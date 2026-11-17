# Json schema design check — documentation

**Json schema design check** · slug `json-schema-design-check` · deliverable type CHECK · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under each worked example. Where SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagree with the recorded response, this document follows the recorded response and names the discrepancy (see Discrepancies).

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `artifact` "user-profile-service"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "json-schema-design-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the JSON schema-design manifest.** You declare a record of a JSON design already done — the atom audits the record, it does not do the design (see Explanation). The recorded full-pass manifest declares the artifact `user-profile-service`: a schema for every external payload, validated at the boundary; a strict writer emitting exactly its schema, a tolerant reader accepting documented variations, and undocumented variations rejected loudly; one payload, `user_update`, with a schema, a sample, a version field and money/big-integer fields as strings, declared hashed or signed with its canonical rules documented; fixed key ordering and number formatting documented, hashes or signatures covering JSON with canonical rules documented, money and big integers as strings, and no float usage for money or big integers (`float_usage_for_money_or_big_integers_present: false`); a version field on everything persisted or sent, additive changes by default and breaking changes requiring a new version; size and depth limits on untrusted input, no eval (`eval_used_present: false`), duplicate keys handled deliberately, UTF-8 only with escapes normalized, and parse errors explicit rather than silent defaults; NDJSON for logs and events, streaming parsers for large files, compact storage for machines and pretty output for humans, inspection and diffs in reviews, and sample fixtures kept per schema; and neither red line present (`unbounded_parsing_of_untrusted_input_present: false`, `unvalidated_config_edits_without_ci_schema_validation_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/json-schema-design-check` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `JSON_SCHEMA_DESIGN_SOUND`: "32 pass, 0 fail, 0 missing of 32 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `payloads_count` is 1, and `schema_coverage`, `version_coverage`, `money_bigint_string_coverage` and `canonical_coverage` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `JSON_SCHEMA_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "json-schema-design-check"}`.
3. Call: `POST https://atoms.pipavia.com/v1/json-schema-design-check` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered result is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/json-schema-design-check` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `json_schema_design_check`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `JSON_SCHEMA_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_payload_has_schema_and_sample`, `every_hashed_or_signed_payload_canonical_documented`, `every_payload_money_and_bigint_fields_as_strings`, `every_payload_has_version_field`, and the summary reads "28 pass, 4 fail, 0 missing of 32 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, all four row-name lists name `user_update`: a payload row with `has_schema` declared `false`, `has_version_field` declared `false`, `money_and_bigint_fields_as_strings` declared `false`, and `canonical_rules_documented` declared `false` on a row declared hashed or signed, so all four coverages are `"0.000000"`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "schema",
  "detail": "schema must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/json-schema-design-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/json-schema-design-check` — tool name `json_schema_design_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `json_schema_design_check` (per USER-GUIDE.md, one gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md: **all fields are booleans unless noted** in SERVICE.md's field table. Where SERVICE.md states no type — the container objects (`schema`, `writer_reader`, `canonical`, `versioning`, `parsing`, `streaming_ops`, `red_lines`) and the payload-row object (`payloads[]`) — the type given below is grounded in the recorded evidence inputs and in the MCP `inputSchema` recorded in `verification/work/json-schema-design-check/evidence.json` (which types `artifact` as string, `payloads` as array, and the named blocks as object), and is stated as such. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `JSON_SCHEMA_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `artifact` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: schema_first_and_boundary

| Field | Type | Notes |
|---|---|---|
| `schema` | object | The schema-first section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above); a present non-object value is rejected before evaluation (recorded malformed case) |
| `schema.schema_for_every_external_payload` | boolean | — |
| `schema.validated_at_boundary` | boolean | — |
| `writer_reader` | object | The writer/reader section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `writer_reader.strict_writer_emits_exactly_schema` | boolean | — |
| `writer_reader.tolerant_reader_accepts_documented_variations` | boolean | — |
| `writer_reader.undocumented_variations_rejected_loudly` | boolean | — |
| `payloads` | list | List of payload-row objects, each with the entry fields below; computed, see below; also read by canonical_form_and_number_care and versioning (per SERVICE.md) |
| `payloads[]` | object | One declared payload row — type grounded in the recorded evidence inputs (see note above) |
| `payloads[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `payloads[].has_schema` | boolean | — |
| `payloads[].has_sample` | boolean | — |
| `payloads[].has_version_field` | boolean | Read by versioning |
| `payloads[].money_and_bigint_fields_as_strings` | boolean | Read by canonical_form_and_number_care |
| `payloads[].is_hashed_or_signed` | boolean (gate) | Gates the per-row canonical-rules check below; read by canonical_form_and_number_care |
| `payloads[].canonical_rules_documented` | boolean | Required when the row is hashed or signed; otherwise the check passes as not applicable to that row; read by canonical_form_and_number_care |

#### Read by: canonical_form_and_number_care

| Field | Type | Notes |
|---|---|---|
| `canonical` | object | The canonical-form section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `canonical.fixed_key_ordering_documented` | boolean | — |
| `canonical.number_formatting_documented` | boolean | — |
| `canonical.hashes_or_signatures_cover_json` | boolean (gate) | Gates the canonical-rules check below |
| `canonical.canonical_rules_documented` | boolean | Required when hashes or signatures cover JSON; otherwise the check passes as not applicable |
| `canonical.money_as_strings` | boolean | — |
| `canonical.big_integers_as_strings` | boolean | — |
| `canonical.float_usage_for_money_or_big_integers_present` | boolean | Must be `false` to pass — skill quality gate |

#### Read by: versioning

| Field | Type | Notes |
|---|---|---|
| `versioning` | object | The versioning section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `versioning.version_field_on_everything_persisted_or_sent` | boolean | — |
| `versioning.additive_changes_by_default` | boolean | — |
| `versioning.breaking_changes_require_new_version` | boolean | — |

#### Read by: parsing_safety_and_encoding

| Field | Type | Notes |
|---|---|---|
| `parsing` | object | The parsing-safety section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `parsing.size_limits_on_untrusted_input` | boolean | — |
| `parsing.depth_limits_on_untrusted_input` | boolean | — |
| `parsing.eval_used_present` | boolean | Must be `false` to pass — skill parsing safety |
| `parsing.duplicate_keys_handled_deliberately` | boolean | — |
| `parsing.utf8_only_and_escapes_normalized` | boolean | — |
| `parsing.parse_errors_explicit_not_silent_defaults` | boolean | — |

#### Read by: streaming_ops_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `streaming_ops` | object | The streaming-ops section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `streaming_ops.ndjson_for_logs_and_events` | boolean | — |
| `streaming_ops.streaming_parsers_for_large_files` | boolean | — |
| `streaming_ops.compact_for_machine_storage_pretty_for_humans` | boolean | — |
| `streaming_ops.inspection_and_diffs_in_reviews` | boolean | — |
| `streaming_ops.sample_fixtures_kept_per_schema` | boolean | — |
| `red_lines` | object | The red-lines section object — type grounded in the recorded evidence inputs / MCP inputSchema (see note above) |
| `red_lines.unbounded_parsing_of_untrusted_input_present` | boolean | Must be `false` to pass — skill red line |
| `red_lines.unvalidated_config_edits_without_ci_schema_validation_present` | boolean | Must be `false` to pass — skill red line |

### Checks

All 32 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` as not applicable. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: schema_first_and_boundary

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `schema_for_every_external_payload` | schema-first: a JSON Schema (or typed schema) is declared for every external payload | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `validated_at_boundary` | schema-first: payloads are validated at the boundary | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `strict_writer_emits_exactly_schema` | strict writer / tolerant reader: the writer emits exactly its schema | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tolerant_reader_accepts_documented_variations` | strict writer / tolerant reader: the reader accepts documented variations | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `undocumented_variations_rejected_loudly` | strict writer / tolerant reader: the rest is rejected loudly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `payloads_declared` | the declared record names its payloads — the payloads list is present and non-empty | Computed over the declared record. Pass: the `payloads` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_payload_has_schema_and_sample` | quality gate: every declared payload row has a schema and a sample | Computed over the declared record. Pass: every declared payload row declares `has_schema: true` and `has_sample: true`. Fail: a row declares either field present but not `true` (offending rows are named in `payloads_without_schema_or_sample`). Missing: the list is absent, or a row has either field absent (such a row is missing evidence and does not appear in `payloads_without_schema_or_sample`). |

#### Section: canonical_form_and_number_care

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `fixed_key_ordering_documented` | canonical form: fixed key ordering is documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `number_formatting_documented` | canonical form: number formatting is documented — floats are IEEE-754 | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `canonical_rules_documented_when_hashing_or_signing` | canonical form: the canonical rules are documented next to the schema when hashes or signatures cover JSON | Conditional on `canonical.hashes_or_signatures_cover_json`. Pass: the gate is declared `true` and `canonical.canonical_rules_documented` is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable. Fail: the gate is declared `true` and the required field is declared `false`. Missing: the gate is declared `true` and the required field is absent, or the gate itself is absent (in the recorded sparse run its evidence reads "no hashes or signatures cover JSON declared"). |
| `money_as_strings` | number care: money is carried as strings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `big_integers_as_strings` | number care: big integers are carried as strings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_float_for_money_or_big_integers` | quality gate: no float usage for money or >2^53 integers is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_hashed_or_signed_payload_canonical_documented` | canonical form: every payload row declared hashed or signed declares its canonical rules documented | Computed over the declared record, conditional per row on `is_hashed_or_signed`. Pass: every hashed/signed row declares `canonical_rules_documented: true` — or there are no hashed/signed rows, in which case the check passes as not applicable to those rows. Fail: a hashed/signed row declares `canonical_rules_documented` present but not `true` (offending rows are named in `hashed_or_signed_payloads_without_canonical_rules`). Missing: the list is absent, a row has `is_hashed_or_signed` absent, or a hashed/signed row has `canonical_rules_documented` absent (such a row is missing evidence and does not appear in the list). |
| `every_payload_money_and_bigint_fields_as_strings` | number care: every declared payload row declares its money and big-integer fields as strings | Computed over the declared record. Pass: every declared payload row declares `money_and_bigint_fields_as_strings: true`. Fail: a row declares the field present but not `true` (offending rows are named in `payloads_without_money_and_bigint_fields_as_strings`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in that list). |

#### Section: versioning

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `version_field_on_everything_persisted_or_sent` | versioning: a version field is carried on everything persisted or sent | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `additive_changes_by_default` | versioning: changes are additive by default | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `breaking_changes_require_new_version` | versioning: breaking changes require a new version | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_payload_has_version_field` | versioning: every declared payload row carries a version field | Computed over the declared record. Pass: every declared payload row declares `has_version_field: true`. Fail: a row declares the field present but not `true` (offending rows are named in `payloads_without_version_field`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `payloads_without_version_field`). |

#### Section: parsing_safety_and_encoding

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `size_limits_on_untrusted_input` | parsing safety: size limits are applied to untrusted input | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `depth_limits_on_untrusted_input` | parsing safety: depth limits are applied to untrusted input | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_eval` | parsing safety: no eval is used | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `duplicate_keys_handled_deliberately` | parsing safety: duplicate keys are handled deliberately | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `utf8_only_and_escapes_normalized` | parsing safety: UTF-8 only, escapes normalized | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `parse_errors_explicit_not_silent_defaults` | quality gate: parse errors on bad input are explicit, not silent defaults | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: streaming_ops_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ndjson_for_logs_and_events` | streaming & scale: NDJSON is used for logs and events | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `streaming_parsers_for_large_files` | streaming & scale: streaming parsers are used for large files | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `compact_for_machine_storage_pretty_for_humans` | streaming & scale: storage is compact for machines and pretty for humans — megabytes are not pretty-printed for storage | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `inspection_and_diffs_in_reviews` | ops: jq is used for inspection and diffs are carried in reviews | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sample_fixtures_kept_per_schema` | ops: sample fixtures are kept per schema | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unbounded_parsing_of_untrusted_input` | red line: no unbounded parsing of untrusted input (DoS) is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unvalidated_config_edits_without_ci_schema_validation` | red line: no "it's just JSON" config edits without schema validation in CI are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"json-schema-design-check"`), `atom_version` (`"0.1.0"`), and `artifact` (the manifest's declared artifact value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `payloads_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `payloads_without_schema_or_sample` (payloads whose schema or sample field is present but not `true`; a payload with the field absent is missing evidence and does not appear), `payloads_without_version_field`, `payloads_without_money_and_bigint_fields_as_strings` and `hashed_or_signed_payloads_without_canonical_rules` (all four lists are null when the `payloads` list is not declared); and the ratios `schema_coverage` (payloads with a schema ÷ declared payloads), `version_coverage` (payloads with a version field ÷ declared payloads), `money_bigint_string_coverage` (payloads with money/big-integer fields as strings ÷ declared payloads) and `canonical_coverage` (hashed/signed payloads with canonical rules documented ÷ hashed/signed payloads; null when no payload is declared hashed or signed) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "32 pass, 0 fail, 0 missing of 32 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared artifact value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `JSON_SCHEMA_DESIGN_SOUND` — all 32 checks pass: the declared JSON schema-design record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `JSON_SCHEMA_DESIGN_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks (`payloads_declared`, `every_payload_has_schema_and_sample`, `every_hashed_or_signed_payload_canonical_documented`, `every_payload_money_and_bigint_fields_as_strings`, `every_payload_has_version_field`) cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `payloads_count`, `payloads_without_schema_or_sample`, `schema_coverage`, `payloads_without_version_field`, `version_coverage`, `payloads_without_money_and_bigint_fields_as_strings`, `money_bigint_string_coverage`, `hashed_or_signed_payloads_without_canonical_rules` and `canonical_coverage` — defined in Output format above, with the values and null rules stated there.

### Errors

A failed call is not a verdict. The 422 body below is the recorded malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the verification battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is invented for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no body in the battery; status + meaning only* | Missing or invalid gateway key. |
| 403 | *Unrecorded — no body in the battery; status + meaning only* | The key is valid but lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"schema","detail":"schema must be an object"}` (this atom's recorded malformed run, verbatim) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no body in the battery; status + meaning only* | Rate limit exceeded (60/min, 10,000/day per key, per USER-GUIDE.md). |

### Rate limits and pricing

- **Rate limits (per key, per USER-GUIDE.md):** 60 calls/minute and 10,000 calls/day.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). No price is set in SERVICE.md — **Free during trial — rate pending** (per USER-GUIDE.md). Prices are set only from measured production cost per unit.

## Explanation

**What the atom does.** Use JSON safely and predictably — schemas, canonical forms, versioning, parse limits, big-number care (the bound capability, from SERVICE.md). You submit one declared record — the JSON schema-design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`schema_first_and_boundary`, `canonical_form_and_number_care`, `versioning`, `parsing_safety_and_encoding`, `streaming_ops_and_red_lines`). The atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself (deliverable type CHECK, per SERVICE.md).

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `payloads` list must be present and non-empty, every payload row must declare a schema and a sample, a version field, and money/big-integer fields as strings, and every row declared hashed or signed must declare its canonical rules documented — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — the `canonical` block's canonical-rules check is required only when `canonical.hashes_or_signatures_cover_json` is declared `true`, and the per-row canonical-rules requirement binds only on rows declared hashed or signed; when a gate is not triggered those checks pass as not applicable. Aggregation is strict: any `fail` anywhere produces `JSON_SCHEMA_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `JSON_SCHEMA_DESIGN_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states exactly one number — 2^53, the integer bound beyond which integers are carried as strings — and it is used only as the skill states it, in the wording of the `no_float_for_money_or_big_integers` check. No other numeric threshold is invented: a parse size limit in bytes or characters (the skill requires size limits on untrusted input but states no size — caller attestation only); a parse depth limit in levels; a schema dialect or JSON Schema draft version a design must use; a canonicalization algorithm or scheme a design must adopt (the skill requires the rules be documented, not which rules); a version-field name, format, or numbering scheme; a payload, file-size, or event-volume bar at which streaming parsers or NDJSON become mandatory; a coverage percentage below completeness; a sample-fixture count per schema beyond the skill's one schema + sample gate. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** JSON schema-design record: a verdict of `JSON_SCHEMA_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares schemas for every payload, size and depth limits, and money as strings passes those checks even if the real system does none of it. It is a completeness and consistency audit of the record the skill requires, **not a JSON design service or a security certification**. Specifically: it designs no schema, parses no live payload, validates no real document against a real schema, signs nothing, and does not verify that a declared control actually works. It never judges whether a schema is well designed for its domain, whether a canonicalization scheme is cryptographically sound, whether a declared size or depth limit is large or small enough, or whether a parser is actually safe — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated 2^53 integer bound (see the declined list above); no live verification of any declared fact; no payload or schema text inspection — the atom reads no actual JSON document or schema body, only the declared record about them; schema quality (field naming, optionality, extensibility choices) is a caller declaration — the atom checks only that a schema and a sample are declared present for every payload; canonicalization correctness is a caller declaration — only its declared documentation is checked.

**Distinct ground.** This atom audits JSON interchange design only — schemas, canonical form, versioning, parsing safety and streaming for JSON payloads. It shares zero checks with `database-design-review` (relational data models — a database schema is not a JSON payload schema) and zero checks with `backend-engineering-advice` (general backend/API engineering; this atom's boundary is the JSON layer itself), per SERVICE.md.

**Buyer and use context.** Teams and agents working in Engineering & code who need this check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product API payload schema design (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared JSON schema-design record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a security certification (SERVICE.md states this explicitly in its honest-scoping section), and JSON payload schema design is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with this atom's scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Note the recorded check names that differ from their input field names (see Discrepancies) when reading the `checks` array. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Tests: the external battery recorded in TEST-REPORT.md and `verification/work/json-schema-design-check/evidence.json`.

### For ops

Endpoints: `POST /v1/json-schema-design-check` (REST) and `POST /mcp/json-schema-design-check` (MCP, tool `json_schema_design_check`) on https://atoms.pipavia.com, atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b, at last verification. Rate limits: 60/minute, 10,000/day per key (429, unrecorded body — see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, RC soak to 2026-11-22.

## Discrepancies

This document follows the recorded response in `verification/work/json-schema-design-check/evidence.json` wherever another source disagrees with it. Discrepancies found, named — none papered over:

1. **Status — SERVICE.md is stale.** SERVICE.md states status **built-locally** ("no endpoint is live"), but TEST-REPORT.md and the recorded evidence show the atom live on atoms-gateway v1.1.0 (deployment fe07be725c5a4817ad7b7e341310a97b) with HTTP 200 verdicts recorded. This document follows the evidenced live state — live, release candidate, RC soak to 2026-11-22 — and names SERVICE.md's status line as stale.
2. **Recorded check names differ from input field names.** Five checks are recorded under names that are not the input field they read: `canonical_rules_documented_when_hashing_or_signing` (reads `canonical.canonical_rules_documented`, gated by `canonical.hashes_or_signatures_cover_json`), `no_float_for_money_or_big_integers` (reads `canonical.float_usage_for_money_or_big_integers_present`), `no_eval` (reads `parsing.eval_used_present`), `no_unbounded_parsing_of_untrusted_input` (reads `red_lines.unbounded_parsing_of_untrusted_input_present`), and `no_unvalidated_config_edits_without_ci_schema_validation` (reads `red_lines.unvalidated_config_edits_without_ci_schema_validation_present`). The Checks section uses the recorded check names verbatim.
3. **Computed check names have no single input field.** `payloads_declared`, `every_payload_has_schema_and_sample`, `every_hashed_or_signed_payload_canonical_documented`, `every_payload_money_and_bigint_fields_as_strings` and `every_payload_has_version_field` are computed over the declared `payloads` rows; no manifest field carries those names.
4. **Container-object types are not stated in SERVICE.md's field table.** SERVICE.md notes types only for `artifact` (string), `payloads` (list) and `payloads[].name` (string) and states all other fields are booleans; it does not state a type for the container objects or for a payload row. The object/array types in the Input reference for those containers are grounded in the recorded evidence inputs and the MCP `inputSchema` recorded in the evidence file, and are labelled as such there. The recorded malformed case independently proves `schema` must be an object.
5. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md.** Both present the full-pass response trimmed, omitting the `checks` array and the `stamp` field (both note the trimming). The recorded response carries all 32 checks and a `stamp`; the Worked examples below reproduce the recorded response in full.
6. **Recorded evidence text varies by case for one gated check.** In the full-pass and violations runs `canonical_rules_documented_when_hashing_or_signing` carries the evidence text quoted in the Checks section; in the recorded sparse run the same check, with status `missing`, carries the evidence text "no hashes or signatures cover JSON declared". The Checks section quotes the full-pass text, as the exemplar standard requires; the sparse variant is named here.
7. **Recorded evidence text is more specific than the guide descriptions for three checks.** `number_formatting_documented` adds "floats are IEEE-754", `compact_for_machine_storage_pretty_for_humans` adds "megabytes are not pretty-printed for storage", and `inspection_and_diffs_in_reviews` names `jq` specifically, where USER-GUIDE.md describes the same fields in general terms. The Checks section quotes the recorded text verbatim.

## Worked examples

The three examples below are the recorded battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T06:29:48.932511+00:00 against gateway v1.1.0 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b), source `verification/work/json-schema-design-check/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "schema_first_and_boundary",
      "check": "schema_for_every_external_payload",
      "status": "pass",
      "evidence": "schema-first: a JSON Schema (or typed schema) is declared for every external payload"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "validated_at_boundary",
      "status": "pass",
      "evidence": "schema-first: payloads are validated at the boundary"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "strict_writer_emits_exactly_schema",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the writer emits exactly its schema"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "tolerant_reader_accepts_documented_variations",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the reader accepts documented variations"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "undocumented_variations_rejected_loudly",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the rest is rejected loudly"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "payloads_declared",
      "status": "pass",
      "evidence": "the declared record names its payloads — the payloads list is present and non-empty"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "every_payload_has_schema_and_sample",
      "status": "pass",
      "evidence": "quality gate: every declared payload row has a schema and a sample"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "fixed_key_ordering_documented",
      "status": "pass",
      "evidence": "canonical form: fixed key ordering is documented"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "number_formatting_documented",
      "status": "pass",
      "evidence": "canonical form: number formatting is documented — floats are IEEE-754"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "canonical_rules_documented_when_hashing_or_signing",
      "status": "pass",
      "evidence": "canonical form: the canonical rules are documented next to the schema when hashes or signatures cover JSON"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "money_as_strings",
      "status": "pass",
      "evidence": "number care: money is carried as strings"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "big_integers_as_strings",
      "status": "pass",
      "evidence": "number care: big integers are carried as strings"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "no_float_for_money_or_big_integers",
      "status": "pass",
      "evidence": "quality gate: no float usage for money or >2^53 integers is present"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "every_hashed_or_signed_payload_canonical_documented",
      "status": "pass",
      "evidence": "canonical form: every payload row declared hashed or signed declares its canonical rules documented"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "every_payload_money_and_bigint_fields_as_strings",
      "status": "pass",
      "evidence": "number care: every declared payload row declares its money and big-integer fields as strings"
    },
    {
      "section": "versioning",
      "check": "version_field_on_everything_persisted_or_sent",
      "status": "pass",
      "evidence": "versioning: a version field is carried on everything persisted or sent"
    },
    {
      "section": "versioning",
      "check": "additive_changes_by_default",
      "status": "pass",
      "evidence": "versioning: changes are additive by default"
    },
    {
      "section": "versioning",
      "check": "breaking_changes_require_new_version",
      "status": "pass",
      "evidence": "versioning: breaking changes require a new version"
    },
    {
      "section": "versioning",
      "check": "every_payload_has_version_field",
      "status": "pass",
      "evidence": "versioning: every declared payload row carries a version field"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "size_limits_on_untrusted_input",
      "status": "pass",
      "evidence": "parsing safety: size limits are applied to untrusted input"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "depth_limits_on_untrusted_input",
      "status": "pass",
      "evidence": "parsing safety: depth limits are applied to untrusted input"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "no_eval",
      "status": "pass",
      "evidence": "parsing safety: no eval is used"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "duplicate_keys_handled_deliberately",
      "status": "pass",
      "evidence": "parsing safety: duplicate keys are handled deliberately"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "utf8_only_and_escapes_normalized",
      "status": "pass",
      "evidence": "parsing safety: UTF-8 only, escapes normalized"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "parse_errors_explicit_not_silent_defaults",
      "status": "pass",
      "evidence": "quality gate: parse errors on bad input are explicit, not silent defaults"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "ndjson_for_logs_and_events",
      "status": "pass",
      "evidence": "streaming & scale: NDJSON is used for logs and events"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "streaming_parsers_for_large_files",
      "status": "pass",
      "evidence": "streaming & scale: streaming parsers are used for large files"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "compact_for_machine_storage_pretty_for_humans",
      "status": "pass",
      "evidence": "streaming & scale: storage is compact for machines and pretty for humans — megabytes are not pretty-printed for storage"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "inspection_and_diffs_in_reviews",
      "status": "pass",
      "evidence": "ops: jq is used for inspection and diffs are carried in reviews"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "sample_fixtures_kept_per_schema",
      "status": "pass",
      "evidence": "ops: sample fixtures are kept per schema"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "no_unbounded_parsing_of_untrusted_input",
      "status": "pass",
      "evidence": "red line: no unbounded parsing of untrusted input (DoS) is present"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "no_unvalidated_config_edits_without_ci_schema_validation",
      "status": "pass",
      "evidence": "red line: no \"it's just JSON\" config edits without schema validation in CI are present"
    }
  ],
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
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections.",
  "stamp": "JSON SCHEMA DESIGN CHECK\nartifact: user-profile-service\nVERDICT: JSON_SCHEMA_DESIGN_SOUND\n  schema_first_and_boundary            pass\n  canonical_form_and_number_care       pass\n  versioning                           pass\n  parsing_safety_and_encoding          pass\n  streaming_ops_and_red_lines          pass\n32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T06:29:48.932511+00:00 against gateway v1.1.0 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b), source `verification/work/json-schema-design-check/evidence.json`.

Input:

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
      "has_schema": false,
      "has_sample": true,
      "has_version_field": false,
      "money_and_bigint_fields_as_strings": false,
      "is_hashed_or_signed": true,
      "canonical_rules_documented": false
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

Response (HTTP 200):

```json
{
  "service": "json-schema-design-check",
  "atom_version": "0.1.0",
  "artifact": "user-profile-service",
  "verdict": "JSON_SCHEMA_DESIGN_NOT_SOUND",
  "sections": {
    "schema_first_and_boundary": "fail",
    "canonical_form_and_number_care": "fail",
    "versioning": "fail",
    "parsing_safety_and_encoding": "pass",
    "streaming_ops_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "schema_first_and_boundary",
      "check": "schema_for_every_external_payload",
      "status": "pass",
      "evidence": "schema-first: a JSON Schema (or typed schema) is declared for every external payload"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "validated_at_boundary",
      "status": "pass",
      "evidence": "schema-first: payloads are validated at the boundary"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "strict_writer_emits_exactly_schema",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the writer emits exactly its schema"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "tolerant_reader_accepts_documented_variations",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the reader accepts documented variations"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "undocumented_variations_rejected_loudly",
      "status": "pass",
      "evidence": "strict writer / tolerant reader: the rest is rejected loudly"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "payloads_declared",
      "status": "pass",
      "evidence": "the declared record names its payloads — the payloads list is present and non-empty"
    },
    {
      "section": "schema_first_and_boundary",
      "check": "every_payload_has_schema_and_sample",
      "status": "fail",
      "evidence": "quality gate: every declared payload row has a schema and a sample"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "fixed_key_ordering_documented",
      "status": "pass",
      "evidence": "canonical form: fixed key ordering is documented"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "number_formatting_documented",
      "status": "pass",
      "evidence": "canonical form: number formatting is documented — floats are IEEE-754"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "canonical_rules_documented_when_hashing_or_signing",
      "status": "pass",
      "evidence": "canonical form: the canonical rules are documented next to the schema when hashes or signatures cover JSON"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "money_as_strings",
      "status": "pass",
      "evidence": "number care: money is carried as strings"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "big_integers_as_strings",
      "status": "pass",
      "evidence": "number care: big integers are carried as strings"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "no_float_for_money_or_big_integers",
      "status": "pass",
      "evidence": "quality gate: no float usage for money or >2^53 integers is present"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "every_hashed_or_signed_payload_canonical_documented",
      "status": "fail",
      "evidence": "canonical form: every payload row declared hashed or signed declares its canonical rules documented"
    },
    {
      "section": "canonical_form_and_number_care",
      "check": "every_payload_money_and_bigint_fields_as_strings",
      "status": "fail",
      "evidence": "number care: every declared payload row declares its money and big-integer fields as strings"
    },
    {
      "section": "versioning",
      "check": "version_field_on_everything_persisted_or_sent",
      "status": "pass",
      "evidence": "versioning: a version field is carried on everything persisted or sent"
    },
    {
      "section": "versioning",
      "check": "additive_changes_by_default",
      "status": "pass",
      "evidence": "versioning: changes are additive by default"
    },
    {
      "section": "versioning",
      "check": "breaking_changes_require_new_version",
      "status": "pass",
      "evidence": "versioning: breaking changes require a new version"
    },
    {
      "section": "versioning",
      "check": "every_payload_has_version_field",
      "status": "fail",
      "evidence": "versioning: every declared payload row carries a version field"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "size_limits_on_untrusted_input",
      "status": "pass",
      "evidence": "parsing safety: size limits are applied to untrusted input"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "depth_limits_on_untrusted_input",
      "status": "pass",
      "evidence": "parsing safety: depth limits are applied to untrusted input"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "no_eval",
      "status": "pass",
      "evidence": "parsing safety: no eval is used"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "duplicate_keys_handled_deliberately",
      "status": "pass",
      "evidence": "parsing safety: duplicate keys are handled deliberately"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "utf8_only_and_escapes_normalized",
      "status": "pass",
      "evidence": "parsing safety: UTF-8 only, escapes normalized"
    },
    {
      "section": "parsing_safety_and_encoding",
      "check": "parse_errors_explicit_not_silent_defaults",
      "status": "pass",
      "evidence": "quality gate: parse errors on bad input are explicit, not silent defaults"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "ndjson_for_logs_and_events",
      "status": "pass",
      "evidence": "streaming & scale: NDJSON is used for logs and events"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "streaming_parsers_for_large_files",
      "status": "pass",
      "evidence": "streaming & scale: streaming parsers are used for large files"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "compact_for_machine_storage_pretty_for_humans",
      "status": "pass",
      "evidence": "streaming & scale: storage is compact for machines and pretty for humans — megabytes are not pretty-printed for storage"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "inspection_and_diffs_in_reviews",
      "status": "pass",
      "evidence": "ops: jq is used for inspection and diffs are carried in reviews"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "sample_fixtures_kept_per_schema",
      "status": "pass",
      "evidence": "ops: sample fixtures are kept per schema"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "no_unbounded_parsing_of_untrusted_input",
      "status": "pass",
      "evidence": "red line: no unbounded parsing of untrusted input (DoS) is present"
    },
    {
      "section": "streaming_ops_and_red_lines",
      "check": "no_unvalidated_config_edits_without_ci_schema_validation",
      "status": "pass",
      "evidence": "red line: no \"it's just JSON\" config edits without schema validation in CI are present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "payloads_count": 1,
  "payloads_without_schema_or_sample": [
    "user_update"
  ],
  "schema_coverage": "0.000000",
  "payloads_without_version_field": [
    "user_update"
  ],
  "version_coverage": "0.000000",
  "payloads_without_money_and_bigint_fields_as_strings": [
    "user_update"
  ],
  "money_bigint_string_coverage": "0.000000",
  "hashed_or_signed_payloads_without_canonical_rules": [
    "user_update"
  ],
  "canonical_coverage": "0.000000",
  "summary": "28 pass, 4 fail, 0 missing of 32 checks across five sections.",
  "stamp": "JSON SCHEMA DESIGN CHECK\nartifact: user-profile-service\nVERDICT: JSON_SCHEMA_DESIGN_NOT_SOUND\n  schema_first_and_boundary            fail\n  canonical_form_and_number_care       fail\n  versioning                           fail\n  parsing_safety_and_encoding          pass\n  streaming_ops_and_red_lines          pass\n28 pass, 4 fail, 0 missing of 32 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T06:29:48.932511+00:00 against gateway v1.1.0 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b), source `verification/work/json-schema-design-check/evidence.json`.

Input:

```json
{
  "artifact": "malformed-input",
  "schema": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "schema",
  "detail": "schema must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared JSON schema-design record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a security certification, and JSON payload schema design is not a regulated domain. |
| Checks named | 32 documented / 32 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus the secondary computed fields |
| Input reference typed | Yes — 45 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs / MCP inputSchema and labelled as such |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/json-schema-design-check/evidence.json` |
