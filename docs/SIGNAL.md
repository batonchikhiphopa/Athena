# Signal v4

Signal v4 is Athena's current textless analytical contract for one entry.

The model may help extract bounded topics, activities, markers, state evidence, and emotion evidence for the current entry only. Athena then sanitizes the payload and recomputes final `load`, `fatigue`, `focus`, confidence, quality reason, and signal quality through deterministic rules.

## Version

Current writes use:

- `schema_version: "signal.v4"`
- `prompt_version: "extraction.v5"`

Older Signal v2/v3 rows remain historical data. New extraction and reprocess work targets Signal v4.

## Deterministic Context Fields

Signal v4 adds three fields that are not provider verdicts:

- `entry_intent`: bounded intent label such as `log`, `reflection`, `planning`, `decision`, `gratitude`, `venting`, or `unknown`.
- `structure_signal`: text-shape metadata such as density, coherence, question presence, and plan presence.
- `temporal_context`: local date and coarse time bucket from entry metadata or capture timestamp.

These fields are computed by Athena. The provider prompt explicitly tells the model not to include them.

## Privacy Boundary

Signal v4 stores only structured, textless context. It does not store raw diary text, copied sentences, embeddings, RAG snippets, hidden memory, or history-derived interpretations.

The context basis values are bounded labels such as `matched_planning_cue` or `words_12_39`; they are designed for debug visibility without leaking entry text.

## Mapper Boundary

Final state metrics remain deterministic:

- provider evidence can inform state inference;
- local emotion evidence can only nudge existing state-derived metrics within bounded rules;
- absence of evidence keeps metrics null or low-confidence;
- context fields do not create clinical claims, diagnosis, or coaching language.
