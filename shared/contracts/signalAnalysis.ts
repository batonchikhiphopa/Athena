import type {
  EntryIntentSignal,
  Signal,
  StructureSignal,
  TemporalContext,
} from "./signal.js";

export type SignalContextInput = {
  entryDate?: string | null;
  capturedAt?: string | null;
};

export type SignalContextFields = Pick<
  Signal,
  "entry_intent" | "structure_signal" | "temporal_context"
>;

const PLAN_PATTERN =
  /\b(plan|planning|todo|next|tomorrow|will|надо|нужно|план|завтра|буду|сделаю|треба|потрібно|планую)\b/i;
const DECISION_PATTERN =
  /\b(decide|decision|choose|chosen|решил|решила|выбрал|выбрала|решение|обираю|вирішив|вирішила)\b/i;
const GRATITUDE_PATTERN =
  /\b(thanks|grateful|gratitude|appreciate|спасибо|благодар|дякую|вдячн)\b/i;
const VENTING_PATTERN =
  /\b(angry|furious|hate|exhausted|устал|устала|злюсь|ненавижу|бесит|втомив|втомилась|злий|зла)\b/i;
const REFLECTION_PATTERN =
  /\b(realized|noticed|feel|felt|думаю|понял|поняла|заметил|заметила|чувствую|відчуваю|зрозумів|зрозуміла)\b/i;

export function createDefaultSignalContext(): SignalContextFields {
  return {
    entry_intent: {
      intent: "unknown",
      confidence: "low",
      basis: [],
    },
    structure_signal: {
      density: "empty",
      coherence: "low",
      has_question: false,
      has_plan: false,
      basis: [],
    },
    temporal_context: {
      local_date: null,
      time_bucket: "unknown",
      source: "absent",
    },
  };
}

export function analyzeSignalContext(
  rawText: string,
  input: SignalContextInput = {},
): SignalContextFields {
  const text = rawText.trim();

  return {
    entry_intent: inferEntryIntent(text),
    structure_signal: inferStructureSignal(text),
    temporal_context: inferTemporalContext(input),
  };
}

function inferEntryIntent(text: string): EntryIntentSignal {
  if (!text) return createDefaultSignalContext().entry_intent;

  const candidates: EntryIntentSignal[] = [
    candidate("decision", DECISION_PATTERN, text),
    candidate("planning", PLAN_PATTERN, text),
    candidate("gratitude", GRATITUDE_PATTERN, text),
    candidate("venting", VENTING_PATTERN, text),
    candidate("reflection", REFLECTION_PATTERN, text),
  ].filter((item) => item.confidence !== "low");

  if (candidates.length > 0) return candidates[0];

  return {
    intent: "log",
    confidence: "low",
    basis: ["deterministic_text_shape"],
  };
}

function candidate(
  intent: EntryIntentSignal["intent"],
  pattern: RegExp,
  text: string,
): EntryIntentSignal {
  if (!pattern.test(text)) {
    return {
      intent: "unknown",
      confidence: "low",
      basis: [],
    };
  }

  return {
    intent,
    confidence: "medium",
    basis: [`matched_${intent}_cue`],
  };
}

function inferStructureSignal(text: string): StructureSignal {
  const words = text.match(/[\p{L}\p{N}_'-]+/gu) ?? [];
  const sentences = text
    .split(/[.!?。！？\n]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const hasQuestion = /[?？]/u.test(text);
  const hasPlan = PLAN_PATTERN.test(text);
  const density =
    words.length === 0
      ? "empty"
      : words.length < 12
        ? "sparse"
        : words.length < 90
          ? "normal"
          : "dense";
  const coherence =
    words.length === 0
      ? "low"
      : sentences.length <= 1 && words.length > 40
        ? "low"
        : sentences.length > 1 || words.length >= 12
          ? "medium"
          : "low";
  const basis = [
    `words_${bucketCount(words.length)}`,
    `sentences_${bucketCount(sentences.length)}`,
  ];

  if (hasQuestion) basis.push("contains_question");
  if (hasPlan) basis.push("contains_plan_cue");

  return {
    density,
    coherence,
    has_question: hasQuestion,
    has_plan: hasPlan,
    basis: basis.slice(0, 6),
  };
}

function inferTemporalContext(input: SignalContextInput): TemporalContext {
  const capturedAt = normalizeIso(input.capturedAt);
  const entryDate = normalizeDate(input.entryDate);

  if (capturedAt) {
    return {
      local_date: entryDate ?? capturedAt.slice(0, 10),
      time_bucket: bucketHour(new Date(capturedAt).getHours()),
      source: "created_at",
    };
  }

  if (entryDate) {
    return {
      local_date: entryDate,
      time_bucket: "unknown",
      source: "entry_metadata",
    };
  }

  return createDefaultSignalContext().temporal_context;
}

function normalizeIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function bucketHour(hour: number): TemporalContext["time_bucket"] {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function bucketCount(count: number): string {
  if (count === 0) return "0";
  if (count < 5) return "1_4";
  if (count < 12) return "5_11";
  if (count < 40) return "12_39";
  if (count < 90) return "40_89";
  return "90_plus";
}
