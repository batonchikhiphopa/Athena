import type { ExtractionResult } from "../../types";
import { mapSignalCandidate } from "../../lib/signals";

export const CEDR_EMOTION_CANDIDATE_MODEL =
  "cointegrated/rubert-tiny2-cedr-emotion-detection";
export const ONNX_EMOTION_SPIKE_MODEL =
  "onnx-community/tanaos-emotion-detection-v1-ONNX";

type TextClassificationItem = {
  label: string;
  score: number;
};

export type LocalEmotionSignals = {
  provider: "local_onnx_web";
  runtime: "@huggingface/transformers";
  model: string;
  candidate_model: string;
  status: "ok";
  labels: Record<string, number>;
  top_label: string | null;
  top_score: number | null;
  timings_ms: {
    model_load: number;
    inference: number;
  };
  cache: "cold" | "warm";
  privacy: {
    local_inference: true;
    raw_text_sent_to_server: false;
    request_guard: "raw_text_url_body_check";
  };
};

export type LocalEmotionResult =
  | {
      ok: true;
      signals: LocalEmotionSignals;
    }
  | {
      ok: false;
      reason:
        | "empty_text"
        | "runtime_unavailable"
        | "model_unavailable"
        | "privacy_boundary_violation"
        | "inference_failed";
      message: string;
      model: string;
      candidate_model: string;
    };

type PipelineFunction = (
  text: string,
  options?: { top_k?: number | null },
) => Promise<TextClassificationItem[] | TextClassificationItem>;

type LoadedPipeline = {
  classifier: PipelineFunction;
  modelLoadMs: number;
  cache: "cold" | "warm";
};

let pipelinePromise: Promise<LoadedPipeline> | null = null;

export async function extractLocalEmotionSignals(
  text: string,
): Promise<LocalEmotionResult> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return emotionFailure("empty_text", "No text to classify.");
  }

  try {
    const loaded = await withRawTextNetworkGuard(trimmedText, () =>
      loadEmotionPipeline(),
    );
    const inferenceStartedAt = nowMs();
    const output = await withRawTextNetworkGuard(trimmedText, () =>
      loaded.classifier(trimmedText.slice(0, 1500), { top_k: null }),
    );
    const inferenceMs = nowMs() - inferenceStartedAt;

    return {
      ok: true,
      signals: normalizeEmotionClassifierOutput(output, {
        cache: loaded.cache,
        inferenceMs,
        modelLoadMs: loaded.modelLoadMs,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("privacy_boundary_violation")) {
      return emotionFailure(
        "privacy_boundary_violation",
        "Raw text appeared in a model artifact request.",
      );
    }

    if (
      message.includes("Could not locate file") ||
      message.includes("Could not load model") ||
      message.includes("Unsupported model") ||
      message.includes("NoSuchKey") ||
      message.includes("404")
    ) {
      return emotionFailure("model_unavailable", message);
    }

    if (
      message.includes("Cannot find module") ||
      message.includes("@huggingface/transformers")
    ) {
      return emotionFailure("runtime_unavailable", message);
    }

    return emotionFailure("inference_failed", message);
  }
}

export function normalizeEmotionClassifierOutput(
  output: TextClassificationItem[] | TextClassificationItem,
  timings: {
    cache: "cold" | "warm";
    inferenceMs: number;
    modelLoadMs: number;
  },
): LocalEmotionSignals {
  const items = Array.isArray(output) ? output : [output];
  const labels = items.reduce<Record<string, number>>((result, item) => {
    const label = normalizeEmotionLabel(item.label);
    if (!label) return result;

    result[label] = roundScore(item.score);
    return result;
  }, {});
  const top = [...items].sort((left, right) => right.score - left.score)[0];

  return {
    provider: "local_onnx_web",
    runtime: "@huggingface/transformers",
    model: ONNX_EMOTION_SPIKE_MODEL,
    candidate_model: CEDR_EMOTION_CANDIDATE_MODEL,
    status: "ok",
    labels,
    top_label: top ? normalizeEmotionLabel(top.label) : null,
    top_score: top ? roundScore(top.score) : null,
    timings_ms: {
      model_load: Math.max(0, Math.round(timings.modelLoadMs)),
      inference: Math.max(0, Math.round(timings.inferenceMs)),
    },
    cache: timings.cache,
    privacy: {
      local_inference: true,
      raw_text_sent_to_server: false,
      request_guard: "raw_text_url_body_check",
    },
  };
}

export function mergeLocalEmotionSignals(
  extraction: ExtractionResult,
  emotion: LocalEmotionResult,
): ExtractionResult {
  if (!emotion.ok || extraction.signal.signal_quality === "fallback") {
    return extraction;
  }

  return {
    ...extraction,
    signal: mapSignalCandidate({
      ...extraction.signal,
      emotion_signals: emotion.signals,
    }),
  };
}

export function requestContainsRawText(
  input: unknown,
  init: unknown,
  rawText: string,
) {
  const needle = rawText.trim();
  if (needle.length < 8) return false;

  const requestText = [
    stringifyRequestPart(input),
    stringifyRequestPart(init),
  ].join("\n");

  return requestText.includes(needle) || requestText.includes(encodeURIComponent(needle));
}

async function loadEmotionPipeline(): Promise<LoadedPipeline> {
  if (pipelinePromise) {
    const loaded = await pipelinePromise;
    return {
      ...loaded,
      modelLoadMs: 0,
      cache: "warm",
    };
  }

  pipelinePromise = (async () => {
    const startedAt = nowMs();
    const transformers = await import("@huggingface/transformers");

    transformers.env.allowRemoteModels = true;
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = true;
    transformers.env.cacheKey = "athena-local-emotion-v1";
    transformers.env.logLevel = transformers.LogLevel.ERROR;

    const classifier = await transformers.pipeline(
      "text-classification",
      ONNX_EMOTION_SPIKE_MODEL,
      {
        device: getEmotionRuntimeDevice(),
        dtype: "q8",
      },
    );

    return {
      classifier: classifier as unknown as PipelineFunction,
      modelLoadMs: nowMs() - startedAt,
      cache: "cold",
    };
  })();

  return pipelinePromise;
}

async function withRawTextNetworkGuard<T>(
  rawText: string,
  callback: () => Promise<T>,
) {
  const transformers = await import("@huggingface/transformers");
  const originalFetch =
    transformers.env.fetch ?? globalThis.fetch.bind(globalThis);

  transformers.env.fetch = async (input: string | URL, init?: unknown) => {
    if (requestContainsRawText(input, init, rawText)) {
      throw new Error("privacy_boundary_violation");
    }

    return originalFetch(input, init);
  };

  try {
    return await callback();
  } finally {
    transformers.env.fetch = originalFetch;
  }
}

function emotionFailure(
  reason: Extract<LocalEmotionResult, { ok: false }>["reason"],
  message: string,
): LocalEmotionResult {
  return {
    ok: false,
    reason,
    message,
    model: ONNX_EMOTION_SPIKE_MODEL,
    candidate_model: CEDR_EMOTION_CANDIDATE_MODEL,
  };
}

function normalizeEmotionLabel(label: string) {
  return label
    .trim()
    .toLocaleLowerCase()
    .replace(/^label_/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function roundScore(score: number) {
  return Math.round(Math.max(0, Math.min(1, score)) * 10_000) / 10_000;
}

function stringifyRequestPart(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof URL) return value.toString();

  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function getEmotionRuntimeDevice() {
  return typeof window === "undefined" ? "cpu" : "wasm";
}
