# Test report — cpp-engineering-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/cpp-engineering-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (subject `PR-123`): all ownership/value/smart-pointer/STL/ABI/tooling/sanitizer declarations true, the four must-be-false flags false, `raii.forbidden_constructs` `[]`, `tooling.warning_count` 0 | HTTP 200, verdict `REVIEW_SOUND`, `warning_count` `0`, `forbidden_constructs_found` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `REVIEW_SOUND`, 34 pass / 0 fail / 0 missing, all eight sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `raii.manual_new_delete_in_new_code` true, `raii.forbidden_constructs` `[manual_new]`, `tooling.warning_count` 5 | HTTP 200, verdict `REVIEW_DEFICIENT`, the 3 named checks fail | HTTP 200, `REVIEW_DEFICIENT`, 31 pass / 3 fail / 0 missing; failing checks exactly `no_manual_new_delete_in_new_code`, `no_forbidden_constructs_present`, `zero_warnings_maintained`; `warning_count` `5`, `forbidden_constructs_found` `["manual_new"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `raii_and_ownership` and `tooling_and_warnings` `fail`, the other six `pass` | PASS |
| 3 | sparse — only `subject` plus `raii.resources_owned_by_objects` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 33 missing, all eight sections `insufficient_evidence`, `warning_count` null, `forbidden_constructs_found` null, `computed_status` null | PASS |
| 4 | malformed — `tooling.warning_count: "should-be-a-number"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"tooling.warning_count","detail":"tooling.warning_count must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `cpp_engineering_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 34 checks and a text stamp):

```json
{"service": "cpp-engineering-review", "atom_version": "0.1.0", "subject": "PR-123", "verdict": "REVIEW_SOUND", "sections": {"raii_and_ownership": "pass", "value_semantics": "pass", "smart_pointers": "pass", "stl_and_templates": "pass", "exceptions_and_abi": "pass", "tooling_and_warnings": "pass", "sanitizers": "pass", "safety_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "warning_count": 0, "forbidden_constructs_found": [], "summary": "34 pass, 0 fail, 0 missing of 34 checks across eight sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"tooling.warning_count","detail":"tooling.warning_count must be a number"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`warning_count` `0`, `forbidden_constructs_found` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed section names (`raii_and_ownership`, `tooling_and_warnings`) instead of exact check names. Corrected before execution to the 3 exact check names the planted values fail: `no_manual_new_delete_in_new_code`, `no_forbidden_constructs_present`, `zero_warnings_maintained`.
3. Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`warning_count` `5`, `forbidden_constructs_found` `["manual_new"]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. Malformed designed with TWO type violations (`raii` as a string instead of an object, plus `tooling.warning_count` as a string instead of a number). Corrected before execution: reduced to exactly one type violation of a documented typed field — `tooling.warning_count` as a string where a number is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting — no correction needed), and the violations input was verified to be a full manifest carrying exactly the planted violations (no correction needed on that point).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the zero-warnings check against the skill's stated zero, the forbidden-constructs set intersection against the three stated entries `raw_owning_pointer` / `manual_new` / `manual_delete` in stated order, and the derived `computed_status`, per SERVICE.md's no-floating-point serialization rule) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/cpp-engineering-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `warning_count` (declared, echoed as-is) | 0 | 0 | ✓ |
| full-pass `forbidden_constructs_found` (`[]` ∩ stated set = ∅) | [] | [] | ✓ |
| full-pass `computed_status` (both computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `warning_count` (declared, echoed as-is) | 5 | 5 | ✓ |
| violations `forbidden_constructs_found` (`[manual_new]` ∩ stated set) | ["manual_new"] | ["manual_new"] | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| verdicts | REVIEW_SOUND / REVIEW_DEFICIENT (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case. The coordinating tester's own headline recompute also matches: declared `warning_count` 0 passes the skill's stated zero and 5 fails it; `forbidden_constructs_found` is the stated-order intersection (`[]` on full-pass, `["manual_new"]` on violations), identical to the artifacts.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `tooling.warning_count`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
