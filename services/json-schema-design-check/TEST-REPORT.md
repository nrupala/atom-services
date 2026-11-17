# Test report — json-schema-design-check

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/json-schema-design-check/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (artifact `user-profile-service`): all schema/writer-reader/canonical/versioning/parsing/streaming declarations in passing polarity, one payload `user_update` with schema + sample + version field + money/bigint as strings, declared hashed/signed with canonical rules documented, all three `*_present` flags false | HTTP 200, verdict `JSON_SCHEMA_DESIGN_SOUND`, `payloads_count` `1`, `schema_coverage` `"1.000000"`, `version_coverage` `"1.000000"`, `money_bigint_string_coverage` `"1.000000"`, `canonical_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `JSON_SCHEMA_DESIGN_SOUND`, 32 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except payload `user_update` with `has_schema` false, `has_version_field` false, `money_and_bigint_fields_as_strings` false, `canonical_rules_documented` false (on a hashed/signed row) | HTTP 200, verdict `JSON_SCHEMA_DESIGN_NOT_SOUND`, the 4 named checks fail | HTTP 200, `JSON_SCHEMA_DESIGN_NOT_SOUND`, 28 pass / 4 fail / 0 missing; failing checks exactly `every_payload_has_schema_and_sample`, `every_hashed_or_signed_payload_canonical_documented`, `every_payload_money_and_bigint_fields_as_strings`, `every_payload_has_version_field`; all four row-name lists `["user_update"]`, all four coverages `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `schema_first_and_boundary`, `canonical_form_and_number_care`, `versioning` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `artifact` (`incomplete-manifest`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, all five sections `insufficient_evidence`, `payloads_count` null, all four row-name lists null, all four coverages null, `computed_status` null | PASS |
| 4 | malformed — `schema: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"schema","detail":"schema must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `json_schema_design_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "json-schema-design-check", "atom_version": "0.1.0", "artifact": "user-profile-service", "verdict": "JSON_SCHEMA_DESIGN_SOUND", "sections": {"schema_first_and_boundary": "pass", "canonical_form_and_number_care": "pass", "versioning": "pass", "parsing_safety_and_encoding": "pass", "streaming_ops_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "payloads_count": 1, "payloads_without_schema_or_sample": [], "schema_coverage": "1.000000", "payloads_without_version_field": [], "version_coverage": "1.000000", "payloads_without_money_and_bigint_fields_as_strings": [], "money_bigint_string_coverage": "1.000000", "hashed_or_signed_payloads_without_canonical_rules": [], "canonical_coverage": "1.000000", "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"schema","detail":"schema must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the three section names `schema_first_and_boundary`, `versioning`, `canonical_form_and_number_care` instead of exact check names — 3 validator rejections. Corrected before execution to the 4 exact check names the planted values fail: `every_payload_has_schema_and_sample`, `every_hashed_or_signed_payload_canonical_documented`, `every_payload_money_and_bigint_fields_as_strings`, `every_payload_has_version_field` (confirmed against the Python oracle's 32-check register and by running the oracle on the violations input: exactly those 4 fail).
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`payloads_count` `1`, `payloads_without_schema_or_sample` `[]`, `schema_coverage` `"1.000000"`, `payloads_without_version_field` `[]`, `version_coverage` `"1.000000"`, `payloads_without_money_and_bigint_fields_as_strings` `[]`, `money_bigint_string_coverage` `"1.000000"`, `hashed_or_signed_payloads_without_canonical_rules` `[]`, `canonical_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`payloads_count` `1`, `payloads_without_schema_or_sample` `["user_update"]`, `schema_coverage` `"0.000000"`, `payloads_without_version_field` `["user_update"]`, `version_coverage` `"0.000000"`, `payloads_without_money_and_bigint_fields_as_strings` `["user_update"]`, `money_bigint_string_coverage` `"0.000000"`, `hashed_or_signed_payloads_without_canonical_rules` `["user_update"]`, `canonical_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3, values-only rebuild — no validator rejection: the raw violations input already carried every full-pass key path, so R3 passed) Violations input renamed the artifact (`bad-design`) and the payload row (`faulty_payload`) in addition to the planted wrong values, so it was not a values-only copy of the full-pass manifest. Corrected before execution: rebuilt it as a full copy of the full-pass manifest (artifact `user-profile-service`, payload `user_update`) carrying exactly the 4 planted violations (`has_schema` false, `has_version_field` false, `money_and_bigint_fields_as_strings` false, `canonical_rules_documented` false on the hashed/signed row) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns all 32 checks pass on it — no correction needed), the sparse case was verified genuinely sparse (only `artifact` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `schema` as a string where an object is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/json-schema-design-check/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `payloads_count` | 1 | 1 | ✓ |
| full-pass `schema_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `version_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `money_bigint_string_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `canonical_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `payloads_without_schema_or_sample` / `payloads_without_version_field` / `payloads_without_money_and_bigint_fields_as_strings` / `hashed_or_signed_payloads_without_canonical_rules` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `payloads_count` | 1 | 1 | ✓ |
| violations `schema_coverage` / `version_coverage` / `money_bigint_string_coverage` / `canonical_coverage` (0 ÷ 1 each) | "0.000000" / "0.000000" / "0.000000" / "0.000000" | "0.000000" / "0.000000" / "0.000000" / "0.000000" | ✓ |
| violations row-name lists (all four) | ["user_update"] each | ["user_update"] each | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | JSON_SCHEMA_DESIGN_SOUND / JSON_SCHEMA_DESIGN_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only five quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `schema`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
