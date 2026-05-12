export const ENTRY_STATUSES = {
  PENDING_EXTRACTION: "pending_extraction",
  PROCESSING: "processing",
  EXTRACTED: "extracted",
  FALLBACK: "fallback",
  FAILED: "failed",
} as const;

export const SIGNAL_QUALITIES = {
  VALID: "valid",
  SPARSE: "sparse",
  FALLBACK: "fallback",
} as const;

export type EntryStatusValue = (typeof ENTRY_STATUSES)[keyof typeof ENTRY_STATUSES];
export type SignalQualityValue =
  (typeof SIGNAL_QUALITIES)[keyof typeof SIGNAL_QUALITIES];
