# Test report — designed-test-case-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/designed-test-case-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (pack `Login Feature Suite`): 1 requirement `REQ-01`, 1 case `TC-01` tracing to it with non-empty expected result, boundary and negative coverage, all technique/negative/risk/coverage declarations true, the two must-be-false coverage flags false, conditional gates (decision tables / stateful / many config axes) false | HTTP 200, verdict `TEST_CASE_PACK_SOUND`, `requirements_count` `1`, `cases_count` `1`, `requirement_trace_coverage` `"1.0000"`, `expected_result_coverage` `"1.0000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `TEST_CASE_PACK_SOUND`, 30 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values, `untraced_requirements` `[]`, `cases_without_expected_result` `[]`, `cases_without_traceability` `[]`, `duplicate_case_ids` `[]` | PASS |
| 2 | violations — full manifest with `cases[0].requirement_ids` `["MISSING-REQ"]`, `cases[0].expected_result` `""`, `covers_boundary` false, `covers_negative` false | HTTP 200, verdict `TEST_CASE_PACK_NOT_SOUND`, the 5 named checks fail | HTTP 200, `TEST_CASE_PACK_NOT_SOUND`, 25 pass / 5 fail / 0 missing; failing checks exactly `every_requirement_traced_to_at_least_one_case`, `every_case_traces_to_at_least_one_requirement`, `every_case_has_expected_result`, `at_least_one_boundary_case_declared`, `at_least_one_negative_case_declared`; `requirements_count` `1`, `cases_count` `1`, `requirement_trace_coverage` `"0.0000"`, `expected_result_coverage` `"0.0000"`, `untraced_requirements` `["REQ-01"]`, `cases_without_expected_result` `["TC-01"]`, `cases_without_traceability` `["TC-01"]`, `duplicate_case_ids` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `traceability_and_case_format`, `technique_coverage` and `negative_and_risk_selection` `fail`, `coverage_gaps_and_suite_hygiene` `pass` | PASS |
| 3 | sparse — only `pack` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 30 missing, all four sections `insufficient_evidence`, `requirements_count` null, `cases_count` null, `requirement_trace_coverage` null, `expected_result_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `requirements: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"requirements","detail":"requirements must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `designed_test_case_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "designed-test-case-pack", "atom_version": "0.1.0", "pack": "Login Feature Suite", "verdict": "TEST_CASE_PACK_SOUND", "sections": {"traceability_and_case_format": "pass", "technique_coverage": "pass", "negative_and_risk_selection": "pass", "coverage_gaps_and_suite_hygiene": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "requirements_count": 1, "cases_count": 1, "untraced_requirements": [], "requirement_trace_coverage": "1.0000", "cases_without_expected_result": [], "expected_result_coverage": "1.0000", "cases_without_traceability": [], "duplicate_case_ids": [], "summary": "30 pass, 0 fail, 0 missing of 30 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"requirements","detail":"requirements must be a list"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total, by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`requirements_count` `1`, `cases_count` `1`, `requirement_trace_coverage` `"1.0000"`, `expected_result_coverage` `"1.0000"`, `computed_status` `within_stated_limits_on_declared_evidence`, `untraced_requirements` `[]`, `cases_without_expected_result` `[]`, `cases_without_traceability` `[]`, `duplicate_case_ids` `[]`).
2. (R1) Violations designed `failing_checks` listed descriptive titles (`Every case traces`, `Expected result per case`, `At least one boundary case`, `At least one negative case`) instead of exact check names, and omitted the `every_requirement_traced_to_at_least_one_case` check that the planted trace violation also fails. Corrected before execution to the 5 exact check names the planted values fail: `every_requirement_traced_to_at_least_one_case`, `every_case_traces_to_at_least_one_requirement`, `every_case_has_expected_result`, `at_least_one_boundary_case_declared`, `at_least_one_negative_case_declared`.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`requirements_count` `1`, `cases_count` `1`, `requirement_trace_coverage` `"0.0000"`, `expected_result_coverage` `"0.0000"`, `computed_status` `outside_stated_limits_on_declared_evidence`, `untraced_requirements` `["REQ-01"]`, `cases_without_expected_result` `["TC-01"]`, `cases_without_traceability` `["TC-01"]`, `duplicate_case_ids` `[]`).
4. (R3) Violations input was sparse instead of a full manifest — it carried only `pack`, `requirements` and `cases`, missing every `technique_application`, `negative_and_error_guessing`, `risk_selection` and `coverage` key path present in the full-pass manifest (22 missing key paths in the validator's R3 detail). Corrected before execution: expanded it to a full manifest identical in structure to the full-pass manifest, carrying exactly the planted violations.
5. (R4) Malformed designed with TWO type violations (`requirements` as a string instead of a list, plus `cases` as a number `123` instead of a list). Corrected before execution: reduced to exactly one type violation of a documented typed field — `requirements` as a string where a list is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting — no correction needed), and the sparse case needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the declared list lengths, the traced/untraced requirement sets, both coverage ratios under SERVICE.md's fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — the row-name lists, duplicate case ids, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/designed-test-case-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `requirements_count` / `cases_count` (declared list lengths) | 1 / 1 | 1 / 1 | ✓ |
| full-pass `requirement_trace_coverage` (1 traced ÷ 1 declared) | "1.0000" | "1.0000" | ✓ |
| full-pass `expected_result_coverage` (1 ÷ 1) | "1.0000" | "1.0000" | ✓ |
| full-pass `untraced_requirements` / `cases_without_expected_result` / `cases_without_traceability` / `duplicate_case_ids` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `requirements_count` / `cases_count` | 1 / 1 | 1 / 1 | ✓ |
| violations `requirement_trace_coverage` (0 traced ÷ 1 declared) | "0.0000" | "0.0000" | ✓ |
| violations `expected_result_coverage` (0 ÷ 1) | "0.0000" | "0.0000" | ✓ |
| violations `untraced_requirements` / `cases_without_expected_result` / `cases_without_traceability` / `duplicate_case_ids` | ["REQ-01"] / ["TC-01"] / ["TC-01"] / [] | ["REQ-01"] / ["TC-01"] / ["TC-01"] / [] | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | TEST_CASE_PACK_SOUND / TEST_CASE_PACK_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: trace coverage is traced ÷ declared (`1/1 = "1.0000"` on full-pass, `0/1 = "0.0000"` on violations) and expected-result coverage is cases naming a non-empty expected result ÷ declared cases (same values), identical to the artifacts.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `requirements`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
