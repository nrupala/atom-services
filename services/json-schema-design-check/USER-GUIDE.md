# JSON schema design check — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing how JSON payloads move between systems, and you have a record of how that design was done. This atom reads one declared manifest and returns one deterministic verdict across five sections: **JSON_SCHEMA_DESIGN_SOUND**, **JSON_SCHEMA_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it designs no schema, parses no live payload, validates no real document against a real schema, signs nothing, and does not verify that a declared control actually works. A design is sound *on your declared evidence*: it never judges whether a schema is well designed for its domain, whether a canonicalization scheme is cryptographically sound, whether a declared size or depth limit is large or small enough, or whether a parser is actually safe. Computed checks: the declared `payloads` list must be present and non-empty; every payload row must declare a schema and a sample, a version field, and money/big-integer fields as strings; and every row declared hashed or signed must declare its canonical rules documented. The canonical-rules check on the `canonical` block is conditional: `canonical.canonical_rules_documented` is required only when `canonical.hashes_or_signatures_cover_json` is declared `true`; otherwise it passes as not applicable. No numeric threshold is imposed beyond the skill's own 2^53 integer bound (used only in the wording of the no-float check) — no parse size limit in bytes or characters, no parse depth limit in levels, no schema dialect or JSON Schema draft version, no canonicalization algorithm or scheme, no version-field name, format or numbering scheme, no payload, file-size or event-volume bar for streaming parsers or NDJSON, no coverage percentage below completeness, and no sample-fixture count per schema beyond the one schema + sample gate. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "json-schema-design-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/json-schema-design-check` — tool name `json_schema_design_check`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/json-schema-design-check` — body = the manifest object; same `Authorization` header.

## Input — the JSON schema-design manifest

| Field | Meaning |
|---|---|
| `artifact` | artifact name (string; carried into the output, not checked) |
| `schema.schema_for_every_external_payload` | schema-first evidence: a schema is declared for every external payload |
| `schema.validated_at_boundary` | schema-first evidence: payloads are validated at the boundary |
| `writer_reader.strict_writer_emits_exactly_schema` | strict writer evidence: the writer emits exactly its schema |
| `writer_reader.tolerant_reader_accepts_documented_variations` | tolerant reader evidence: the reader accepts documented variations |
| `writer_reader.undocumented_variations_rejected_loudly` | strict writer evidence: undocumented variations are rejected loudly |
| `payloads` (list of payload-row objects) | computed: must be present and non-empty; reported as `payloads_count` |
| `payloads[].name` (string) | names the row in the computed outputs |
| `payloads[].has_schema` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `payloads_without_schema_or_sample` (together with the sample field) |
| `payloads[].has_sample` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `payloads_without_schema_or_sample` (together with the schema field) |
| `payloads[].has_version_field` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `payloads_without_version_field` |
| `payloads[].money_and_bigint_fields_as_strings` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `payloads_without_money_and_bigint_fields_as_strings` |
| `payloads[].is_hashed_or_signed` | computed gate: declares the row is hashed or signed |
| `payloads[].canonical_rules_documented` | computed: required `true` when the row is hashed or signed; otherwise passes as not applicable to that row; hashed/signed rows with the field present but not `true` are reported in `hashed_or_signed_payloads_without_canonical_rules` |
| `canonical.fixed_key_ordering_documented` | canonical-form evidence: fixed key ordering is documented |
| `canonical.number_formatting_documented` | canonical-form evidence: number formatting is documented |
| `canonical.hashes_or_signatures_cover_json` | gate: declares whether hashes or signatures cover JSON |
| `canonical.canonical_rules_documented` | required `true` only when `canonical.hashes_or_signatures_cover_json` is `true`; otherwise passes as not applicable |
| `canonical.money_as_strings` | number-care evidence: money is carried as strings |
| `canonical.big_integers_as_strings` | number-care evidence: big integers are carried as strings |
| `canonical.float_usage_for_money_or_big_integers_present` | must be `false` to pass (quality gate: no float usage for money or >2^53 integers) |
| `versioning.version_field_on_everything_persisted_or_sent` | versioning evidence: a version field is carried on everything persisted or sent |
| `versioning.additive_changes_by_default` | versioning evidence: changes are additive by default |
| `versioning.breaking_changes_require_new_version` | versioning evidence: breaking changes require a new version |
| `parsing.size_limits_on_untrusted_input` | parsing-safety evidence: size limits are applied to untrusted input |
| `parsing.depth_limits_on_untrusted_input` | parsing-safety evidence: depth limits are applied to untrusted input |
| `parsing.eval_used_present` | must be `false` to pass (parsing safety: no eval is used) |
| `parsing.duplicate_keys_handled_deliberately` | parsing-safety evidence: duplicate keys are handled deliberately |
| `parsing.utf8_only_and_escapes_normalized` | parsing-safety evidence: UTF-8 only, escapes normalized |
| `parsing.parse_errors_explicit_not_silent_defaults` | parsing-safety evidence: parse errors are explicit, not silent defaults |
| `streaming_ops.ndjson_for_logs_and_events` | streaming evidence: NDJSON is used for logs and events |
| `streaming_ops.streaming_parsers_for_large_files` | streaming evidence: streaming parsers are used for large files |
| `streaming_ops.compact_for_machine_storage_pretty_for_humans` | streaming evidence: storage is compact for machines and pretty for humans |
| `streaming_ops.inspection_and_diffs_in_reviews` | ops evidence: inspection tooling is used and diffs are carried in reviews |
| `streaming_ops.sample_fixtures_kept_per_schema` | ops evidence: sample fixtures are kept per schema |
| `red_lines.unbounded_parsing_of_untrusted_input_present` | must be `false` to pass (red line: no unbounded parsing of untrusted input) |
| `red_lines.unvalidated_config_edits_without_ci_schema_validation_present` | must be `false` to pass (red line: no config edits without schema validation in CI) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward JSON_SCHEMA_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/json-schema-design-check`:

```json
{
  "artifact": "user-profile-service",
  "schema": {
    "schema_for_every_external_payload": true,
    "validated_at_boundary": true
  },
  "writer_reader": {
    "strict_writer_emits_exactly_schema": true,
    "tolerant_reader_accepts_documented_variations": true,
    "undocumented_variations_rejected_loudly": true
  },
  "payloads": [
    {
      "name": "user_update",
      "has_schema": true,
      "has_sample": true,
      "has_version_field": true,
      "money_and_bigint_fields_as_strings": true,
      "is_hashed_or_signed": true,
      "canonical_rules_documented": true
    }
  ],
  "canonical": {
    "fixed_key_ordering_documented": true,
    "number_formatting_documented": true,
    "hashes_or_signatures_cover_json": true,
    "canonical_rules_documented": true,
    "money_as_strings": true,
    "big_integers_as_strings": true,
    "float_usage_for_money_or_big_integers_present": false
  },
  "versioning": {
    "version_field_on_everything_persisted_or_sent": true,
    "additive_changes_by_default": true,
    "breaking_changes_require_new_version": true
  },
  "parsing": {
    "size_limits_on_untrusted_input": true,
    "depth_limits_on_untrusted_input": true,
    "eval_used_present": false,
    "duplicate_keys_handled_deliberately": true,
    "utf8_only_and_escapes_normalized": true,
    "parse_errors_explicit_not_silent_defaults": true
  },
  "streaming_ops": {
    "ndjson_for_logs_and_events": true,
    "streaming_parsers_for_large_files": true,
    "compact_for_machine_storage_pretty_for_humans": true,
    "inspection_and_diffs_in_reviews": true,
    "sample_fixtures_kept_per_schema": true
  },
  "red_lines": {
    "unbounded_parsing_of_untrusted_input_present": false,
    "unvalidated_config_edits_without_ci_schema_validation_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

```json
{
  "service": "json-schema-design-check",
  "atom_version": "0.1.0",
  "artifact": "user-profile-service",
  "verdict": "JSON_SCHEMA_DESIGN_SOUND",
  "sections": {
    "schema_first_and_boundary": "pass",
    "canonical_form_and_number_care": "pass",
    "versioning": "pass",
    "parsing_safety_and_encoding": "pass",
    "streaming_ops_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "payloads_count": 1,
  "payloads_without_schema_or_sample": [],
  "schema_coverage": "1.000000",
  "payloads_without_version_field": [],
  "version_coverage": "1.000000",
  "payloads_without_money_and_bigint_fields_as_strings": [],
  "money_bigint_string_coverage": "1.000000",
  "hashed_or_signed_payloads_without_canonical_rules": [],
  "canonical_coverage": "1.000000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

## Verdicts

- **JSON_SCHEMA_DESIGN_SOUND** — every check passes; the declared JSON schema-design record is complete and consistent with the skill's checklist and lines.
- **JSON_SCHEMA_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `payloads_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `payloads_without_schema_or_sample`, `payloads_without_version_field`, `payloads_without_money_and_bigint_fields_as_strings` and `hashed_or_signed_payloads_without_canonical_rules` (null when the `payloads` list is not declared; a payload with the relevant field absent is missing evidence and does not appear in the lists), the coverage values `schema_coverage`, `version_coverage`, `money_bigint_string_coverage` and `canonical_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty — `canonical_coverage` is null when no payload is declared hashed or signed), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
