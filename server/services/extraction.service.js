import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OLLAMA_MODEL,
} from "../config/versions.js";
import { MARKERS } from "../core/markers.js";
import {
  createFallbackSignal,
  sanitizeSignalCandidate,
} from "./sanitization.service.js";

export const EXTRACTION_PROVIDERS = {
  OLLAMA: "ollama",
  GEMINI: "gemini",
  OFF: "off",
};

const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const ALLOWED_MARKERS = MARKERS;

const SIGNAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: { type: "string" },
    },
    activities: {
      type: "array",
      items: { type: "string" },
    },
    markers: {
      type: "array",
      items: {
        type: "string",
        enum: ALLOWED_MARKERS,
      },
    },
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
    "markers",
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

export async function getExtractionStatus({ provider, model } = {}) {
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
    const names = models.map((item) => item?.name).filter(Boolean);

    if (names.length > 0 && !names.includes(selectedModel)) {
      return unavailableStatus(selectedProvider, selectedModel, "model_missing");
    }

    return availableStatus(selectedProvider, selectedModel);
  } catch {
    return unavailableStatus(selectedProvider, selectedModel, "ollama_unavailable");
  }
}

export async function extractSignal({ text, provider, model }) {
  const selectedProvider = normalizeProvider(provider);
  const selectedModel = normalizeModel(selectedProvider, model);

  if (selectedProvider === EXTRACTION_PROVIDERS.OFF) {
    return createFallbackResult(selectedProvider, selectedModel, "provider_off");
  }

  try {
    const candidate =
      selectedProvider === EXTRACTION_PROVIDERS.GEMINI
        ? await requestGeminiExtraction(text, selectedModel)
        : await requestOllamaExtraction(text, selectedModel);
    const sanitized = sanitizeSignalCandidate(candidate);

    if (!sanitized.ok) {
      return createFallbackResult(selectedProvider, selectedModel, "parse_error");
    }

    return {
      signal: sanitized.data,
      metadata: createSignalMetadata(selectedProvider, selectedModel),
    };
  } catch (error) {
    const errorCode = classifyProviderError(error, selectedProvider);
    console.warn(`[extraction:${selectedProvider}] using fallback:`, error);

    return createFallbackResult(selectedProvider, selectedModel, errorCode);
  }
}

function normalizeProvider(provider) {
  if (Object.values(EXTRACTION_PROVIDERS).includes(provider)) return provider;
  if (Object.values(EXTRACTION_PROVIDERS).includes(process.env.ATHENA_AI_PROVIDER)) {
    return process.env.ATHENA_AI_PROVIDER;
  }

  return EXTRACTION_PROVIDERS.OLLAMA;
}

function normalizeModel(provider, model) {
  if (typeof model === "string" && model.trim()) return model.trim();
  return defaultModelForProvider(provider);
}

function defaultModelForProvider(provider) {
  if (provider === EXTRACTION_PROVIDERS.GEMINI) return DEFAULT_GEMINI_MODEL;
  if (provider === EXTRACTION_PROVIDERS.OFF) return "fallback";
  return DEFAULT_OLLAMA_MODEL;
}

async function requestOllamaExtraction(rawText, model) {
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
  const content = data.message?.content;

  if (typeof content !== "string") {
    throw new Error("empty_response");
  }

  return JSON.parse(extractJson(content));
}

async function requestGeminiExtraction(rawText, model) {
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
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("");

  if (!text) {
    throw new Error("empty_response");
  }

  return JSON.parse(extractJson(text));
}

async function requestJson(url, { method = "GET", headers = {}, body, timeoutMs }) {
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

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildExtractionMessages(rawText) {
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

function buildSystemInstruction() {
  return [
    "You are the extraction layer of Athena.",
    "You see only the current raw entry.",
    "Do not use history, assumptions, external context, or prior trends.",
    "Return only valid JSON.",
    "No markdown. No explanation. No text outside JSON.",
    "Use the same language as the entry for topics and activities.",
    "Do not translate.",
    "Markers are first-class context and event flags, not weak numeric scores.",
    "Use concrete markers when the entry directly names a context, symptom, rhythm, or event.",
    "If there is not enough evidence for load, fatigue, or focus, use null.",
    "Do not invent load, fatigue, or focus from a marker alone.",
    "Allowed signal_quality values: valid, sparse.",
    "Do not output fallback. Fallback is created only by the app.",
  ].join("\n");
}

function buildUserExtractionPrompt(rawText) {
  return [
    "Extract a signal candidate from this entry.",
    "",
    "Return exactly this JSON shape:",
    "{",
    '  "topics": [],',
    '  "activities": [],',
    '  "markers": [],',
    '  "load": null,',
    '  "fatigue": null,',
    '  "focus": null,',
    '  "signal_quality": "sparse"',
    "}",
    "",
    "Rules:",
    "- topics: string[], 0-5",
    "- activities: string[], 0-5",
    "- markers: enum[], 0-8",
    "- load/fatigue/focus: integer 0-10 or null",
    "- no extra fields",
    "",
    "Marker guidance:",
    "- insomnia, бессонница, poor sleep, waking at night -> sleep_issue",
    "- ideas arriving late at night or before sleep -> late_night_ideas",
    "- explicitly needing rest, pause, recovery -> recovery_need",
    "- illness, pain, feeling physically unwell -> health_issue",
    "- normal sleep context without a problem can use sleep",
    "- keep state scores null unless the entry gives enough direct evidence",
    "",
    "Allowed markers:",
    ALLOWED_MARKERS.join(", "),
    "",
    "Entry:",
    rawText,
  ].join("\n");
}

function createSignalMetadata(provider, model, errorCode = null) {
  return {
    schema_version: ACTIVE_SCHEMA_VERSION,
    prompt_version: ACTIVE_PROMPT_VERSION,
    provider,
    model,
    error_code: errorCode,
    created_at: new Date().toISOString(),
  };
}

function createFallbackResult(provider, model, errorCode) {
  return {
    signal: createFallbackSignal(),
    metadata: createSignalMetadata(provider, model, errorCode),
  };
}

function classifyProviderError(error, provider) {
  const message = String(error?.message ?? error ?? "");

  if (message.includes("gemini_key_missing")) return "gemini_key_missing";
  if (message.includes("ollama_non_local_url")) return "ollama_non_local_url";
  if (message.includes("AbortError")) return "timeout";
  if (message.includes("SyntaxError")) return "parse_error";
  if (message.includes("http_401") || message.includes("http_403")) {
    return provider === EXTRACTION_PROVIDERS.GEMINI
      ? "gemini_auth_error"
      : "provider_auth_error";
  }
  if (message.includes("http_429")) return "quota_error";
  if (message.includes("http_404")) return "model_missing";

  return provider === EXTRACTION_PROVIDERS.OLLAMA
    ? "ollama_unavailable"
    : "provider_error";
}

function availableStatus(provider, model) {
  return {
    provider,
    model,
    available: true,
    reason: null,
  };
}

function unavailableStatus(provider, model, reason) {
  return {
    provider,
    model,
    available: false,
    reason,
  };
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("parse_error");
  }

  return text.slice(start, end + 1);
}

function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isLocalOllamaUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
