# Test report — c-engineering-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/c-engineering-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — subject `core-engine-v1`, all memory / undefined-behavior / sanitizer / portability / build flags in the passing direction, `ub_shortcuts_used` false, `unbounded_operations_in_diff` false, `warning_count` 0, `banned_calls` `[]` | HTTP 200, verdict `REVIEW_SOUND`, `warning_count` `0`, `banned_calls_found` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `REVIEW_SOUND`, 30 pass / 0 fail / 0 missing, exactly those computed values, all seven sections `pass` | PASS |
| 2 | violations — `ub_shortcuts_used` true, `warning_count` 5, `unbounded_operations_in_diff` true, `banned_calls` `["strcpy"]`, everything else in the passing direction | HTTP 200, verdict `REVIEW_DEFICIENT`, the 4 named checks fail | HTTP 200, `REVIEW_DEFICIENT`, 26 pass / 4 fail / 0 missing; failing checks exactly `no_ub_shortcuts`, `zero_warnings_maintained`, `no_unbounded_operations_in_diff`, `no_banned_functions_present`; `warning_count` `5`, `banned_calls_found` `["strcpy"]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `subject` and `memory.one_owner_per_allocation` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 29 missing, computed fields null | PASS |
| 4 | malformed — `memory.one_owner_per_allocation: "not-a-boolean"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"memory.one_owner_per_allocation","detail":"memory.one_owner_per_allocation must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `c_engineering_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "c-engineering-review", "atom_version": "0.1.0", "subject": "core-engine-v1", "verdict": "REVIEW_SOUND", "sections": {"memory_discipline": "pass", "undefined_behavior": "pass", "warnings_and_build": "pass", "bounds_and_strings": "pass", "sanitizers_and_static_analysis": "pass", "portability": "pass", "build_and_test": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "warning_count": 0, "banned_calls_found": [], "summary": "30 pass, 0 fail, 0 missing of 30 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"memory.one_owner_per_allocation","detail":"memory.one_owner_per_allocation must be a boolean"}
```

## Findings

No findings.

## Tester errors

2 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed input field paths (`undefined_behavior.ub_shortcuts_used`, `warnings.warning_count`, `bounds.unbounded_operations_in_diff`, `bounds.banned_calls`) instead of exact check names. Corrected before execution to the 4 exact check names above (`no_ub_shortcuts`, `zero_warnings_maintained`, `no_unbounded_operations_in_diff`, `no_banned_functions_present`), with no change to any input value or expected verdict.
2. Full-pass designed `computed_spot_checks` only as prose inside `notes`, not as a structured list. Corrected before execution by adding a structured `computed_spot_checks` list to the full-pass expect (`warning_count = 0`, `banned_calls_found = []`, `computed_status = within_stated_limits_on_declared_evidence`), with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (zero-warnings rule, banned-call set membership in the skill's stated order, `computed_status`, per-check tallies and verdicts) and verified the artifact's numbers and verdicts. Raw output: `verification/work/c-engineering-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `warning_count` (declared 0, passes iff = 0) | 0 | 0 | ✓ |
| full-pass `banned_calls_found` (declared `[]`) | [] | [] | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `warning_count` (declared 5, ≠ 0 → fail) | 5 | 5 | ✓ |
| violations `banned_calls_found` (declared `["strcpy"]`) | ["strcpy"] | ["strcpy"] | ✓ |
| violations `computed_status` | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| full-pass pass / fail / missing | 30 / 0 / 0 | 30 / 0 / 0 | ✓ |
| violations pass / fail / missing | 26 / 4 / 0 | 26 / 4 / 0 | ✓ |
| verdicts | REVIEW_SOUND / REVIEW_DEFICIENT (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
