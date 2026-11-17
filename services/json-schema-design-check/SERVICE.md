# Json schema design check — `json-schema-design-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Use JSON safely and predictably — schemas, canonical forms, versioning, parse limits, big-number care.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product API payload schema design**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the JSON schema-design manifest

The caller submits one JSON manifest: a declared JSON
schema-design record for one artifact. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`JSON_SCHEMA_DESIGN_NOT_SOUND`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `artifact` (string; carried into the verdict output, not itself checked) | — |
| `schema.schema_for_every_external_payload` (boolean) | schema_first_and_boundary |
| `schema.validated_at_boundary` (boolean) | schema_first_and_boundary |
| `writer_reader.strict_writer_emits_exactly_schema` (boolean) | schema_first_and_boundary |
| `writer_reader.tolerant_reader_accepts_documented_variations` (boolean) | schema_first_and_boundary |
| `writer_reader.undocumented_variations_rejected_loudly` (boolean) | schema_first_and_boundary |
| `payloads` (list of payload-row objects, each with the entry fields below; computed, see below) | schema_first_and_boundary, canonical_form_and_number_care, versioning |
| `payloads[].name` (string; names the row in the computed outputs) | schema_first_and_boundary, canonical_form_and_number_care, versioning |
| `payloads[].has_schema` (boolean) | schema_first_and_boundary |
| `payloads[].has_sample` (boolean) | schema_first_and_boundary |
| `payloads[].has_version_field` (boolean) | versioning |
| `payloads[].money_and_bigint_fields_as_strings` (boolean) | canonical_form_and_number_care |
| `payloads[].is_hashed_or_signed` (boolean; gates the canonical-rules check below) | canonical_form_and_number_care |
| `payloads[].canonical_rules_documented` (boolean; required when the row is hashed or signed; otherwise the check passes as not applicable to that row) | canonical_form_and_number_care |
| `canonical.fixed_key_ordering_documented` (boolean) | canonical_form_and_number_care |
| `canonical.number_formatting_documented` (boolean) | canonical_form_and_number_care |
| `canonical.hashes_or_signatures_cover_json` (boolean; gates the canonical-rules check below) | canonical_form_and_number_care |
| `canonical.canonical_rules_documented` (boolean; required when hashes or signatures cover JSON; otherwise the check passes as not applicable) | canonical_form_and_number_care |
| `canonical.money_as_strings` (boolean) | canonical_form_and_number_care |
| `canonical.big_integers_as_strings` (boolean) | canonical_form_and_number_care |
| `canonical.float_usage_for_money_or_big_integers_present` (boolean; must be `false` to pass — skill quality gate) | canonical_form_and_number_care |
| `versioning.version_field_on_everything_persisted_or_sent` (boolean) | versioning |
| `versioning.additive_changes_by_default` (boolean) | versioning |
| `versioning.breaking_changes_require_new_version` (boolean) | versioning |
| `parsing.size_limits_on_untrusted_input` (boolean) | parsing_safety_and_encoding |
| `parsing.depth_limits_on_untrusted_input` (boolean) | parsing_safety_and_encoding |
| `parsing.eval_used_present` (boolean; must be `false` to pass — skill parsing safety) | parsing_safety_and_encoding |
| `parsing.duplicate_keys_handled_deliberately` (boolean) | parsing_safety_and_encoding |
| `parsing.utf8_only_and_escapes_normalized` (boolean) | parsing_safety_and_encoding |
| `parsing.parse_errors_explicit_not_silent_defaults` (boolean) | parsing_safety_and_encoding |
| `streaming_ops.ndjson_for_logs_and_events` (boolean) | streaming_ops_and_red_lines |
| `streaming_ops.streaming_parsers_for_large_files` (boolean) | streaming_ops_and_red_lines |
| `streaming_ops.compact_for_machine_storage_pretty_for_humans` (boolean) | streaming_ops_and_red_lines |
| `streaming_ops.inspection_and_diffs_in_reviews` (boolean) | streaming_ops_and_red_lines |
| `streaming_ops.sample_fixtures_kept_per_schema` (boolean) | streaming_ops_and_red_lines |
| `red_lines.unbounded_parsing_of_untrusted_input_present` (boolean; must be `false` to pass — skill red line) | streaming_ops_and_red_lines |
| `red_lines.unvalidated_config_edits_without_ci_schema_validation_present` (boolean; must be `false` to pass — skill red line) | streaming_ops_and_red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Payloads declared:** the declared `payloads` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Schema and sample per payload:** every declared payload row
  must declare `has_schema: true` and `has_sample: true` (the
  skill's quality gate: "Every external payload has a schema +
  sample"). A row with either field absent is missing evidence.
- **Canonical rules per hashed/signed payload:** every row with
  `is_hashed_or_signed: true` must declare
  `canonical_rules_documented: true` (the skill:
  "Canonicalization documented wherever hashes/signatures cover
  JSON"). A row with `is_hashed_or_signed` absent, or a
  hashed/signed row with the target field absent, is missing
  evidence; designs with no hashed/signed rows pass as not
  applicable.
- **Money / big-integer fields as strings per payload:** every
  declared payload row must declare
  `money_and_bigint_fields_as_strings: true` (the skill:
  "money/big integers as strings"; "No float usage for money or
  >2^53 integers").
- **Version field per payload:** every declared payload row
  must declare `has_version_field: true` (the skill: "a version
  field on everything persisted or sent").

One check is conditional, following the skill's own scoping —
computed from the declared gate field:

- **Canonical rules when hashing/signing:**
  `canonical.canonical_rules_documented` is required only when
  `canonical.hashes_or_signatures_cover_json` is declared
  `true`; when no hashes or signatures cover JSON, the check
  passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`payloads_count` (the declared list length, or null when the
list is not declared — counts are reported as integers,
exactly), the row-name lists
`payloads_without_schema_or_sample` (payloads whose schema or
sample field is present but not true; a payload with the field
absent is missing evidence and does not appear),
`payloads_without_version_field`,
`payloads_without_money_and_bigint_fields_as_strings` and
`hashed_or_signed_payloads_without_canonical_rules`, and the
coverage ratios `schema_coverage` (payloads with a schema ÷
declared payloads), `version_coverage` (payloads with a version
field ÷ declared payloads), `money_bigint_string_coverage`
(payloads with money/big-integer fields as strings ÷ declared
payloads) and `canonical_coverage` (hashed/signed payloads with
canonical rules documented ÷ hashed/signed payloads; null when
no payload is declared hashed or signed).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states exactly one number — 2^53, the integer bound
beyond which integers are carried as strings — and it is used
only as the skill states it, in the wording of that check. The
skill states no other numeric pass/fail threshold, so none is
invented. Quantities are computed and reported; the only bar on
the computed rows is completeness over the caller's own declared
rows, exactly as stated above. Declined thresholds, named: a
parse size limit in bytes or characters (the skill requires
size limits on untrusted input but states no size — caller
attestation only); a parse depth limit in levels (the skill
requires depth limits but states no depth); a schema dialect or
JSON Schema draft version a design must use; a canonicalization
algorithm or scheme a design must adopt (the skill requires the
rules be documented, not which rules); a version-field name,
format, or numbering scheme (the skill requires a version field
on everything persisted or sent, not its shape); a payload,
file-size, or event-volume bar at which streaming parsers or
NDJSON become mandatory (the skill names the techniques, not a
trigger size); a coverage percentage below completeness; a
sample-fixture count per schema beyond the skill's one schema +
sample gate.

The verdict is one of `JSON_SCHEMA_DESIGN_SOUND` (all 32 checks
pass), `JSON_SCHEMA_DESIGN_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: schema_first_and_boundary,
canonical_form_and_number_care, versioning,
parsing_safety_and_encoding, streaming_ops_and_red_lines.

## Distinct ground

This atom audits JSON interchange design only — schemas,
canonical form, versioning, parsing safety and streaming for
JSON payloads. It shares zero checks with the staged sibling
`database-design-review` (relational data models, store
selection, table primary keys and normalization — a database
schema is not a JSON payload schema) and zero checks with
`backend-engineering-advice` (general backend/API engineering
advice; where that atom ranges over API contracts broadly, this
atom's boundary is the JSON layer itself: schema-first payloads,
canonical bytes, number care, parse limits and version fields).
No check name or manifest field is shared with either sibling.

## Honest scoping

This atom audits a **declared** JSON schema-design record — it
designs no schema, parses no live payload, validates no real
document against a real schema, signs nothing, and does not
verify that a declared control actually works. A design is sound
*on the caller's declared evidence*: a manifest that declares
schemas for every payload, size and depth limits, and money as
strings passes those checks even if the real system does none of
it. It is a completeness and consistency audit of the record the
skill requires, **not a JSON design service or a security
certification**: it never judges whether a schema is well
designed for its domain, whether a canonicalization scheme is
cryptographically sound, whether a declared size or depth limit
is large or small enough, or whether a parser is actually safe —
only that the record contains what the skill's method, quality
gates and red lines demand, and that its declared rows are
internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated 2^53 integer bound (see the declined list
above); no live verification of any declared fact; no payload or
schema text inspection — the atom reads no actual JSON document
or schema body, only the declared record about them; schema
quality (field naming, optionality, extensibility choices) is a
caller declaration — the atom checks only that a schema and a
sample are declared present for every payload; canonicalization
correctness is a caller declaration — only its declared
documentation is checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Validator shape could lift to A
