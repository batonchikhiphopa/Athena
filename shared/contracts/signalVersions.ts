/**
 * Versions shared by the client, server, export metadata, and reprocessing
 * policy. Keeping them outside either runtime prevents silent drift.
 */
export const ACTIVE_SIGNAL_SCHEMA_VERSION = "signal.v5";
export const ACTIVE_EXTRACTION_PROMPT_VERSION = "extraction.v7";
