/**
 * Provider boundary for signal extraction. Raw entry text exists here only for
 * the duration of one Ollama/Gemini request and is never persisted by this
 * service; every provider result still passes strict sanitization and mapping.
 */
import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OLLAMA_MODEL,
} from "../../config/versions.js";
import { MARKERS } from "./markers.js";
import {
  ACTIVITY_CONTEXT_AGENCIES,
  ACTIVITY_CONTEXT_BLOCKERS,
  ACTIVITY_CONTEXT_EFFECTS,
  ACTIVITY_CONTEXT_EVENTS,
  ACTIVITY_CONTEXT_KINDS,
  ACTIVITY_CONTEXT_NEXT_STEPS,
  ACTIVITY_CONTEXT_OUTCOMES,
  ACTIVITY_CONTEXT_STRATEGIES,
  CONFIDENCE_LEVELS,
  METRIC_NAMES,
  SIGNAL_AXES,
} from "../../../shared/contracts/signal.js";
import type {
  ExtractionProvider,
  ExtractionResult,
  SignalMetadata,
} from "../../core/types.js";
import { analyzeSignalContext } from "../../../shared/contracts/signalAnalysis.js";
import {
  createFallbackSignal,
  sanitizeProviderSignalCandidate,
} from "./sanitization.service.js";

type ExtractionOptionsRequest = {
  provider?: unknown;
  model?: unknown;
};

type RequestJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
};

type ProviderStatus = {
  provider: ExtractionProvider;
  model: string;
  available: boolean;
  reason: string | null;
};

type ExtractionProviderMap = {
  OLLAMA: "ollama";
  GEMINI: "gemini";
  OFF: "off";
};

type JsonRecord = Record<string, unknown>;

export const EXTRACTION_PROVIDERS: ExtractionProviderMap = {
  OLLAMA: "ollama",
  GEMINI: "gemini",
  OFF: "off",
};

const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];
const ALLOWED_MARKERS = MARKERS;
const STATE_LEVELS = ["low", "medium", "high"];

const STATE_INFERENCE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: {
    type: "object",
    properties: {
      level: {
        type: "string",
        enum: STATE_LEVELS,
      },
      confidence: {
        type: "string",
        enum: CONFIDENCE_LEVELS,
      },
      basis: {
        type: "array",
        maxItems: 6,
        items: { type: "string" },
      },
    },
    required: ["level", "confidence", "basis"],
  },
};

const ACTIVITY_CONTEXT_JSON_SCHEMA = {
  type: "object",
  properties: {
    activity: { type: "string" },
    kind: { type: "string", enum: ACTIVITY_CONTEXT_KINDS },
    event: { type: "string", enum: ACTIVITY_CONTEXT_EVENTS },
    outcome: { type: "string", enum: ACTIVITY_CONTEXT_OUTCOMES },
    blockers: {
      type: "array",
      maxItems: 2,
      items: { type: "string", enum: ACTIVITY_CONTEXT_BLOCKERS },
    },
    strategy: { type: "string", enum: ACTIVITY_CONTEXT_STRATEGIES },
    next_step: { type: "string", enum: ACTIVITY_CONTEXT_NEXT_STEPS },
    agency: { type: "string", enum: ACTIVITY_CONTEXT_AGENCIES },
    effect: { type: "string", enum: ACTIVITY_CONTEXT_EFFECTS },
    confidence: { type: "string", enum: CONFIDENCE_LEVELS },
  },
  required: [
    "activity",
    "kind",
    "event",
    "outcome",
    "blockers",
    "strategy",
    "next_step",
    "agency",
    "effect",
    "confidence",
  ],
  additionalProperties: false,
};

const SIGNAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
    activities: {
      type: "array",
      maxItems: 2,
      items: { type: "string" },
    },
    activity_contexts: {
      type: "array",
      maxItems: 2,
      items: ACTIVITY_CONTEXT_JSON_SCHEMA,
    },
    markers: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    state_inference: STATE_INFERENCE_JSON_SCHEMA,
    metric_confidence: {
      type: "object",
      properties: Object.fromEntries(
        METRIC_NAMES.map((metric) => [
          metric,
          {
            type: "string",
            enum: CONFIDENCE_LEVELS,
          },
        ]),
      ),
      required: METRIC_NAMES,
      additionalProperties: false,
    },
    quality_reason: { type: "string" },
    load: { type: ["integer", "null"] },
    fatigue: { type: ["integer", "null"] },
    focus: { type: ["integer", "null"] },
    signal_quality: {
      type: "string",
      enum: ["valid", "sparse"],
    },
  },
  required: [
    "topics",
    "activities",
    "activity_contexts",
    "markers",
    "state_inference",
    "metric_confidence",
    "quality_reason",
    "load",
    "fatigue",
    "focus",
    "signal_quality",
  ],
};

export function getExtractionOptions() {
  const ollamaModel = DEFAULT_OLLAMA_MODEL;
  const geminiModel = DEFAULT_GEMINI_MODEL;
  const defaultProvider = normalizeProvider(process.env.ATHENA_AI_PROVIDER);

  return {
    defaults: {
      provider: defaultProvider,
      model: defaultModelForProvider(defaultProvider),
    },
    providers: [
      {
        id: EXTRACTION_PROVIDERS.OLLAMA,
        label: "Ollama local (privacy first)",
        defaultModel: ollamaModel,
        models: unique([ollamaModel, "gpt-oss:20b", "llama3.1:8b"]),
        configured: true,
      },
      {
        id: EXTRACTION_PROVIDERS.GEMINI,
        label: "Gemini API",
        defaultModel: geminiModel,
        models: unique([geminiModel, ...GEMINI_MODELS]),
        configured: Boolean(process.env.GEMINI_API_KEY),
      },
      {
        id: EXTRACTION_PROVIDERS.OFF,
        label: "Off",
        defaultModel: "fallback",
        models: ["fallback"],
        configured: true,
      },
    ],
  };
}

export async function getExtractionStatus(
  { provider, model }: ExtractionOptionsRequest = {},
): Promise<ProviderStatus> {
  const selectedProvider = normalizeProvider(provider);
  const selectedModel = normalizeModel(selectedProvider, model);

  if (selectedProvider === EXTRACTION_PROVIDERS.OFF) {
    return availableStatus(selectedProvider, selectedModel);
  }

  if (selectedProvider === EXTRACTION_PROVIDERS.GEMINI) {
    if (!process.env.GEMINI_API_KEY) {
      return unavailableStatus(selectedProvider, selectedModel, "gemini_key_missing");
    }

    return availableStatus(selectedProvider, selectedModel);
  }

  const baseUrl = getOllamaBaseUrl();

  try {
    const tags = await requestJson(`${trimTrailingSlash(baseUrl)}/api/tags`, {
      timeoutMs: 3_000,
    });
    const models = Array.isArray(tags.models) ? tags.models : [];
    const names = models
      .map((item) => getRecordValue(item, "name"))
      .filter((name): name is string => typeof name === "string");

    if (names.length > 0 && !names.includes(selectedModel)) {
      return unavailableStatus(selectedProvider, selectedModel, "model_missing");
    }

    return availableStatus(selectedProvider, selectedModel);
  } catch {
    return unavailableStatus(selectedProvider, selectedModel, "ollama_unavailable");
  }
}

export async function extractSignal({
  text,
  provider,
  model,
  entry_date,
  captured_at,
}: {
  text: string;
  provider?: unknown;
  model?: unknown;
  entry_date?: string;
  captured_at?: string;
}): Promise<ExtractionResult> {
  const selectedProvider = normalizeProvider(provider);
  const selectedModel = normalizeModel(selectedProvider, model);
  const context = analyzeSignalContext(text, {
    entryDate: entry_date,
    capturedAt: captured_at,
  });

  if (selectedProvider === EXTRACTION_PROVIDERS.OFF) {
    return createFallbackResult(selectedProvider, selectedModel, "provider_off", context);
  }

  try {
    const candidate =
      selectedProvider === EXTRACTION_PROVIDERS.GEMINI
        ? await requestGeminiExtraction(text, selectedModel)
        : await requestOllamaExtraction(text, selectedModel);
    const sanitized = sanitizeProviderSignalCandidate(candidate, context);

    if (!sanitized.ok) {
      console.warn(
        `[extraction:${selectedProvider}] rejected candidate: ${sanitized.reason}`,
      );
      return createFallbackResult(
        selectedProvider,
        selectedModel,
        sanitized.reason,
        context,
      );
    }

    return {
      signal: {
        ...sanitized.data,
        ...context,
      },
      metadata: createSignalMetadata(selectedProvider, selectedModel),
    };
  } catch (error) {
    const errorCode = classifyProviderError(error, selectedProvider);
    console.warn(`[extraction:${selectedProvider}] using fallback:`, error);

    return createFallbackResult(selectedProvider, selectedModel, errorCode, context);
  }
}

function normalizeProvider(provider: unknown): ExtractionProvider {
  if (isExtractionProvider(provider)) return provider;
  if (isExtractionProvider(process.env.ATHENA_AI_PROVIDER)) {
    return process.env.ATHENA_AI_PROVIDER;
  }

  return EXTRACTION_PROVIDERS.OLLAMA;
}

function normalizeModel(provider: ExtractionProvider, model: unknown): string {
  if (typeof model === "string" && model.trim()) return model.trim();
  return defaultModelForProvider(provider);
}

function defaultModelForProvider(provider: ExtractionProvider): string {
  if (provider === EXTRACTION_PROVIDERS.GEMINI) return DEFAULT_GEMINI_MODEL;
  if (provider === EXTRACTION_PROVIDERS.OFF) return "fallback";
  return DEFAULT_OLLAMA_MODEL;
}

async function requestOllamaExtraction(
  rawText: string,
  model: string,
): Promise<unknown> {
  const baseUrl = getOllamaBaseUrl();

  if (!isLocalOllamaUrl(baseUrl)) {
    throw new Error("ollama_non_local_url");
  }

  const data = await requestJson(`${trimTrailingSlash(baseUrl)}/api/chat`, {
    method: "POST",
    timeoutMs: Number(process.env.OLLAMA_REQUEST_TIMEOUT_MS ?? 30_000),
    body: {
      model,
      stream: false,
      messages: buildExtractionMessages(rawText),
    },
  });
  const message = getRecordValue(data.message, "content");

  if (typeof message !== "string") {
    throw new Error("empty_response");
  }

  return JSON.parse(extractJson(message));
}

async function requestGeminiExtraction(
  rawText: string,
  model: string,
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("gemini_key_missing");
  }

  const data = await requestJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`,
    {
      method: "POST",
      timeoutMs: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? 30_000),
      headers: {
        "x-goog-api-key": apiKey,
      },
      body: {
        systemInstruction: {
          parts: [{ text: buildSystemInstruction() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserExtractionPrompt(rawText) }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: SIGNAL_JSON_SCHEMA,
        },
      },
    },
  );
  const text = readGeminiText(data);

  if (!text) {
    throw new Error("empty_response");
  }

  return JSON.parse(extractJson(text));
}

async function requestJson(
  url: string,
  { method = "GET", headers = {}, body, timeoutMs }: RequestJsonOptions,
): Promise<JsonRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`http_${response.status}:${text.slice(0, 200)}`);
    }

    return response.json() as Promise<JsonRecord>;
  } finally {
    clearTimeout(timeout);
  }
}

function buildExtractionMessages(rawText: string) {
  return [
    {
      role: "system",
      content: buildSystemInstruction(),
    },
    {
      role: "user",
      content: buildUserExtractionPrompt(rawText),
    },
  ];
}

function buildSystemInstruction(): string {
  return [
    "You are the extraction layer of Athena.",
    "Read as a precise analyst of one diary entry, not as a keyword classifier.",
    "You see only the current raw entry.",
    "Do not use history, assumptions, external context, or prior trends.",
    "Do not claim clinical authority.",
    "Do not use diagnosis, therapy instructions, crisis counseling, medication guidance, or medical claims.",
    "Do not reduce extraction to keyword search.",
    "Return only valid JSON.",
    "No markdown. No explanation. No text outside JSON.",
    "Use the same language as the entry for topics, activities, and activity_contexts.activity.",
    "Do not translate.",
    "Write activity names as concise sentence-case phrases whose first meaningful letter is uppercase.",
    "Activities are only the entry's primary intentional tasks, projects, or repeatable practices.",
    "A task has a finite result or completion condition even when it recurs; an activity is a repeatable practice whose value lies in continuing it.",
    "Never use activities as a second topic list.",
    "For every returned activity, return exactly one activity_context object with the same activity name.",
    "Attribute context to a specific activity only when the entry supports that link; never copy the entry's general mood, strain, or blocker onto every activity.",
    "Activity context is structured evidence, not advice, biography, or a free-text summary.",
    "Markers are first-class context and event flags, not weak numeric scores.",
    "Use concrete markers when the entry directly names a context, symptom, rhythm, or event.",
    "State inference separates observed context, inferred state, uncertainty, and final numeric projection.",
    "The app recomputes final metrics deterministically from state_inference, but you must still provide the full Signal v5 shape.",
    "The app also computes entry_intent, structure_signal, and temporal_context deterministically; do not include those fields.",
    "Use null for load, fatigue, or focus only if the entry contains no relevant signal for that metric at all.",
    "Prefer a cautious estimate over null when the entry gives any directional evidence.",
    "Do not invent load, fatigue, or focus from a marker alone; markers may support a score only when the entry also gives contextual evidence.",
    "Allowed signal_quality values: valid, sparse.",
    "Do not output fallback. Fallback is created only by the app.",
  ].join("\n");
}

function buildUserExtractionPrompt(rawText: string): string {
  return [
    "Extract a Signal v5 candidate from this entry.",
    "",
    "Return exactly this JSON shape:",
    "{",
    '  "topics": [],',
    '  "activities": [],',
    '  "activity_contexts": [],',
    '  "markers": [],',
    '  "state_inference": {',
    '    "distress": { "level": "low", "confidence": "low", "basis": [] }',
    "  },",
    '  "metric_confidence": {',
    '    "load": "low",',
    '    "fatigue": "low",',
    '    "focus": "low"',
    "  },",
    '  "quality_reason": "no_relevant_signal",',
    '  "load": null,',
    '  "fatigue": null,',
    '  "focus": null,',
    '  "signal_quality": "sparse"',
    "}",
    "",
    "Rules:",
    "- topics: string[], 0-5; keep salient burnout context here even when it is not an activity",
    "- activities: string[], 0-2; only primary intentional activities, projects, or practices central to the entry",
    "- activity names must be concise, stable, in the entry language, and start with an uppercase letter",
    "- return activities: [] when the entry has no clear central activity",
    "- an activity must be something the author intentionally did, pursued, practiced, or worked on",
    "- exclude states, emotions, places, people, weather, abstract themes, entry metadata, and incidental actions from activities",
    "- normalize an object or topic to a stable action only when the action is explicit and safe: books -> reading",
    "- do not infer an activity from an object alone; body becomes training only when the entry is actually about training",
    "- prefer the one or two activities that best explain what the entry is mainly about",
    "- activity_contexts: one object per activity, in the same order, with an exactly matching activity name",
    "- kind: task when there is a finite outcome or completion condition; activity for an ongoing repeatable practice; unknown only when the distinction is genuinely unsupported",
    "- event: the most specific supported event; maintained means a repeatable practice continued normally",
    "- outcome: achieved for a realized intended result, partial for limited progress, missed for an explicitly failed expected result, none when no result occurred yet, unknown when the entry does not establish it",
    "- blockers: at most two activity-specific obstacles; [] means no obstacle is supported, not that none exists",
    "- strategy: describe only the approach visible in this entry; repeated_attempt requires explicit language such as again or the same approach",
    "- next_step: explicit when a concrete next action is stated, vague when only an intention is stated, not_mentioned otherwise",
    "- agency: active for self-directed action, constrained when external conditions dominate, passive only when inaction or pure reaction is explicit, mixed when both are supported",
    "- effect: use draining, restorative, neutral, or mixed only when the entry links that effect to this activity; otherwise unclear",
    "- confidence: confidence in the activity-specific context as a whole",
    "- never infer a cross-entry pattern inside activity_contexts; extraction sees only this entry",
    "- do not add quotes, summaries, names of people or organizations, locations, or any free-text evidence to activity_contexts",
    "- markers: enum[], 0-8",
    "- state_inference: object keyed only by allowed state axes; omit axes with no evidence",
    "- state_inference values: { level: low|medium|high, confidence: low|medium|high, basis: string[] }",
    "- basis: short observed reasons from this entry, not quotes of the full entry",
    "- metric_confidence: confidence for final load/fatigue/focus projection",
    "- quality_reason: short snake_case reason for the projection or abstention",
    "- load/fatigue/focus: integer 0-10 or null",
    "- do not include entry_intent, structure_signal, temporal_context, coaching, advice, or diagnosis",
    "- no extra fields",
    "",
    "Allowed activity context values:",
    `- kind: ${ACTIVITY_CONTEXT_KINDS.join(", ")}`,
    `- event: ${ACTIVITY_CONTEXT_EVENTS.join(", ")}`,
    `- outcome: ${ACTIVITY_CONTEXT_OUTCOMES.join(", ")}`,
    `- blockers: ${ACTIVITY_CONTEXT_BLOCKERS.join(", ")}`,
    `- strategy: ${ACTIVITY_CONTEXT_STRATEGIES.join(", ")}`,
    `- next_step: ${ACTIVITY_CONTEXT_NEXT_STEPS.join(", ")}`,
    `- agency: ${ACTIVITY_CONTEXT_AGENCIES.join(", ")}`,
    `- effect: ${ACTIVITY_CONTEXT_EFFECTS.join(", ")}`,
    "",
    "Allowed state axes:",
    SIGNAL_AXES.join(", "),
    "",
    "Metric scales:",
    "",
    "load: cognitive and task pressure felt during the day",
    "  null  - entry contains no relevant signal at all",
    "  1-3   - light day, low demand, author feels comfortable",
    "  4-6   - normal workload, some effort required",
    "  7-8   - high pressure, many tasks, mentions strain or rush",
    "  9-10  - overwhelming, crisis, collapse of plans",
    "",
    "fatigue: physical or mental depletion",
    "  null  - entry contains no relevant signal at all",
    "  1-3   - fresh or mildly tired",
    "  4-6   - noticeable tiredness by end of day",
    "  7-8   - significant exhaustion mentioned",
    "  9-10  - unable to function, complete depletion",
    "",
    "focus: ability to concentrate and complete work",
    "  null  - entry contains no relevant signal at all",
    "  1-3   - scattered, distracted, unable to work",
    "  4-6   - moderate focus with interruptions",
    "  7-8   - good productive concentration",
    "  9-10  - deep uninterrupted flow state",
    "",
    "Metric rule:",
    "- Use null only if the entry contains no relevant signal at all.",
    "- Prefer a cautious estimate over null when the entry gives any directional evidence.",
    "",
    "Activity examples:",
    '- Entry: "An ordinary daily note from home and the flat. A good day, but also boredom, frustration, mental noise, overthinking, and thoughts about balance."',
    '  activities: []; activity_contexts: [] (home, balance, boredom, frustration, daily, flat, good_day, mental_noise, notes, ordinary, and overthinking are not activities)',
    '- Entry: "Went for a walk and spent the evening reading; those were the main things I did."',
    '  activities: ["Walk", "Reading"]; both are activity; event is maintained; effect is unclear unless the entry links a felt effect to them',
    '- Entry: "Sent three applications, received no replies, and will rewrite the cover letter tomorrow."',
    '  activities: ["Job search"]; kind is task; event is progressed; outcome is none; next_step is explicit; rejection is not a blocker because no rejection was stated',
    '- Entry: "Training was the main thing today; my body felt tired afterwards."',
    '  activities: ["Training"]; kind is activity; event is maintained; effect is draining (body and tiredness are context, not activities)',
    "",
    "Marker guidance:",
    "- insomnia, бессонница, poor sleep, waking at night -> sleep_issue",
    "- ideas arriving late at night or before sleep -> late_night_ideas",
    "- explicitly needing rest, pause, recovery -> recovery_need",
    "- illness, pain, feeling physically unwell -> health_issue",
    "- normal sleep context without a problem can use sleep",
    "- keep state scores null only when the entry gives no relevant directional evidence",
    "",
    "Allowed markers:",
    ALLOWED_MARKERS.join(", "),
    "",
    "Entry:",
    rawText,
  ].join("\n");
}

function createSignalMetadata(
  provider: ExtractionProvider,
  model: string,
  errorCode: string | null = null,
): SignalMetadata {
  return {
    schema_version: ACTIVE_SCHEMA_VERSION,
    prompt_version: ACTIVE_PROMPT_VERSION,
    provider,
    model,
    error_code: errorCode,
    created_at: new Date().toISOString(),
  };
}

function createFallbackResult(
  provider: ExtractionProvider,
  model: string,
  errorCode: string,
  context = analyzeSignalContext(""),
): ExtractionResult {
  return {
    signal: {
      ...createFallbackSignal(),
      ...context,
    },
    metadata: createSignalMetadata(provider, model, errorCode),
  };
}

function classifyProviderError(error: unknown, provider: ExtractionProvider): string {
  const message = String(
    error instanceof Error ? error.message : error ?? "",
  );

  if (error instanceof SyntaxError) return "invalid_json";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (message.includes("gemini_key_missing")) return "gemini_key_missing";
  if (message.includes("ollama_non_local_url")) return "ollama_non_local_url";
  if (message.includes("empty_response")) return "empty_response";
  if (message.includes("json_object_missing")) return "json_object_missing";
  if (message.includes("http_401") || message.includes("http_403")) {
    return provider === EXTRACTION_PROVIDERS.GEMINI
      ? "gemini_auth_error"
      : "provider_auth_error";
  }
  if (message.includes("http_400")) return "provider_request_error";
  if (message.includes("http_429")) return "quota_error";
  if (message.includes("http_404")) return "model_missing";

  return provider === EXTRACTION_PROVIDERS.OLLAMA
    ? "ollama_unavailable"
    : "provider_error";
}

function availableStatus(
  provider: ExtractionProvider,
  model: string,
): ProviderStatus {
  return {
    provider,
    model,
    available: true,
    reason: null,
  };
}

function unavailableStatus(
  provider: ExtractionProvider,
  model: string,
  reason: string,
): ProviderStatus {
  return {
    provider,
    model,
    available: false,
    reason,
  };
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("json_object_missing");
  }

  return text.slice(start, end + 1);
}

function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
}

function trimTrailingSlash(value: unknown): string {
  return String(value || "").replace(/\/+$/, "");
}

function isLocalOllamaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isExtractionProvider(value: unknown): value is ExtractionProvider {
  return Object.values(EXTRACTION_PROVIDERS).includes(value as ExtractionProvider);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getRecordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function readGeminiText(data: JsonRecord): string {
  const candidates = getRecordValue(data, "candidates");
  if (!Array.isArray(candidates)) return "";

  const firstCandidate = candidates[0];
  const content = getRecordValue(firstCandidate, "content");
  const parts = getRecordValue(content, "parts");
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => getRecordValue(part, "text"))
    .filter((text): text is string => typeof text === "string")
    .join("");
}
