# ADR-0003: Signal v3 And Deterministic Mapper

## Status

Accepted.

## Context

LLM extraction can produce inconsistent output. Athena needs observations that are conservative, explainable, and testable.

## Decision

Use Signal v3 as a structured extraction contract and recompute final `load`, `fatigue`, `focus`, metric confidence, quality reason, and signal quality through a deterministic mapper.

The model provides structured evidence. The mapper owns final metrics.

## Consequences

Benefits:

- final metrics are reproducible;
- invalid model output is sanitized or rejected;
- debug mode can explain why metrics are present or null;
- emotion evidence can be bounded and secondary.

Costs:

- prompts and schemas are more complex;
- new signal fields require mapper tests;
- analytics must respect schema and prompt version boundaries.
