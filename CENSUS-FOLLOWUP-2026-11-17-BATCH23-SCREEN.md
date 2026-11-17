# Regulatory screen — Batch 23 (U-13), 2026-11-17

**Process line: U-13** (service-unit-delivery.md) — every atom's output
is screened regulatory-wise, YES or NO, before it counts as properly
published; a unit whose output is or could read as regulated
professional advice needs the Director's explicit per-unit ruling
after he sees the screen.

**Cohort:** Batch 23 (utilities), commissioned by the Director's
ruling of 2026-11-17 ("These three are good to add actually"),
deployed 2026-11-17 (atoms-gateway deployment
`5ac5dfdf7d1a469f8522f34b3c9f484f`).

| Atom | Screen | Basis |
|---|---|---|
| markdown-sanitizer | **YES** | Deterministic text transformation of caller-supplied markdown: active blocks removed whole, raw HTML stripped, dangerous link schemes neutralized, whitespace tidied, per-rule removal counts reported. It produces no advice, opinion, assessment or recommendation of any kind; it edits no wording. No regulated-advice surface (not engineering practice, not financial, not psychological, not legal, not medical). |
| token-estimator | **YES** | Deterministic measurement of caller-supplied text: a segment-weighted token estimate with its range, the measured char/word counts, and the method + factor-table version stated on the result. The output is a measurement, expressly labelled an estimate and never a tokenizer count; it advises nothing. No regulated-advice surface. |
| json-schema-enforcer | **YES** | Deterministic validation of a caller-supplied JSON payload against a caller-supplied JSON Schema over a documented subset: returns a validity verdict with every violation listed by path, rule, expected and found; keywords outside the subset are named as unsupported, never silently ignored. It judges data shape only — no professional judgment, no advice about the caller's domain. No regulated-advice surface. |

**Disposition:** all three screen YES — publishable without a
per-unit ruling (the ruling requirement attaches only where output
is or could read as regulated professional advice; these three are
utilities that transform, measure, and validate caller-supplied
data). The screen outcome is reported to the Director with the
Batch 23 completion report, per the standing gate.

Screened by Arjun (the building seat), 2026-11-17, from the three
SERVICE.md surfaces and the shipped oracles.
