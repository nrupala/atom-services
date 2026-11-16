# Test report — creative-ideation-session

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/creative-ideation-session/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all booleans true, methods `[brainstorm, scamper]`, target 10, captured 12, duplicates 2, unique 10 (12−2), shortlist 3 | HTTP 200, verdict `SESSION_COMPLETE`, `volume_gap_ideas` `2.000000`, `dedup_discrepancy_ideas` `0.000000`, `methods_used_count` 2, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `SESSION_COMPLETE`, 24 pass / 0 fail / 0 missing, exactly those computed values, all six sections `pass` | PASS |
| 2 | violations — full manifest with methods `[invalid_method]`, captured 5 vs target 10, shortlist 10 vs unique pool 5; dedup arithmetic itself consistent (5−0=5) | HTTP 200, verdict `SESSION_NOT_COMPLETE`, the 3 named checks fail | HTTP 200, `SESSION_NOT_COMPLETE`, 21 pass / 3 fail / 0 missing; failing checks exactly `methods_used_are_stated_methods`, `volume_meets_declared_target`, `shortlist_within_unique_pool`; `volume_gap_ideas` `-5.000000`, `dedup_discrepancy_ideas` `0.000000`, `methods_used_count` 1, `shortlist_count` 10, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `session_title` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 24 missing, computed fields null, `computed_status` null | PASS |
| 4 | malformed — `brief: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"brief","detail":"brief must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `creative_ideation_session`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 24 checks and a text stamp):

```json
{"service": "creative-ideation-session", "atom_version": "0.1.0", "session_title": "Q3 Product Strategy", "methods_used": ["brainstorm", "scamper"], "verdict": "SESSION_COMPLETE", "sections": {"brief_and_preparation": "pass", "capture_and_generation": "pass", "divergence_and_methods": "pass", "idea_pool_and_volume": "pass", "selection_and_convergence": "pass", "shortlist_and_ship": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "target_idea_count": 10, "total_ideas_captured": 12, "volume_gap_ideas": "2.000000", "duplicates_removed": 2, "unique_ideas_after_dedup": 10, "dedup_discrepancy_ideas": "0.000000", "shortlist_count": 3, "methods_used_count": 2, "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections."}
```

Violations response (REST, HTTP 200; checks array trimmed):

```json
{"service": "creative-ideation-session", "atom_version": "0.1.0", "session_title": "Bad Math Session", "methods_used": ["invalid_method"], "verdict": "SESSION_NOT_COMPLETE", "sections": {"brief_and_preparation": "pass", "capture_and_generation": "pass", "divergence_and_methods": "fail", "idea_pool_and_volume": "fail", "selection_and_convergence": "fail", "shortlist_and_ship": "pass"}, "computed_status": "outside_stated_limits_on_declared_evidence", "target_idea_count": 10, "total_ideas_captured": 5, "volume_gap_ideas": "-5.000000", "duplicates_removed": 0, "unique_ideas_after_dedup": 5, "dedup_discrepancy_ideas": "0.000000", "shortlist_count": 10, "methods_used_count": 1, "summary": "21 pass, 3 fail, 0 missing of 24 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"brief","detail":"brief must be an object"}
```

## Findings

No findings.

## Tester errors

3 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 tester errors at judgment stage; no judge-stage tester errors were added):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`target_idea_count` 10, `total_ideas_captured` 12, `volume_gap_ideas` `2.000000`, `duplicates_removed` 2, `unique_ideas_after_dedup` 10, `dedup_discrepancy_ideas` `0.000000`, `shortlist_count` 3, `methods_used` `[brainstorm, scamper]`, `methods_used_count` 2, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed descriptive phrases (`volume_against_declared_target`, `divergence_method_vocabulary`, `shortlist_within_the_unique_pool`) instead of exact check names. Corrected before execution to the 3 exact check names: `methods_used_are_stated_methods`, `volume_meets_declared_target`, `shortlist_within_unique_pool`.
3. Violations `expect` carried no structured `computed_spot_checks` — its expected computed quantities were only implicit in prose notes. Corrected before execution: added the structured spot-check block (`target_idea_count` 10, `total_ideas_captured` 5, `volume_gap_ideas` `-5.000000`, `duplicates_removed` 0, `unique_ideas_after_dedup` 5, `dedup_discrepancy_ideas` `0.000000`, `shortlist_count` 10, `methods_used` `[invalid_method]`, `methods_used_count` 1, `computed_status` `outside_stated_limits_on_declared_evidence`).

Checklist items that passed with no correction: the full-pass input is genuinely valid per SERVICE.md (every required field, correct types/nesting); the violations input is a full manifest carrying exactly the three planted violations; the malformed case carries exactly one type violation of a documented typed field (`brief` as a string where an object is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (volume gap captured − target, dedup discrepancy declared unique − (captured − duplicates), shortlist-within-pool, divergence-method vocabulary against the five stated methods, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/creative-ideation-session/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `volume_gap_ideas` (12 − 10) | 2.000000 | 2.000000 | ✓ |
| full-pass `dedup_discrepancy_ideas` (10 − (12 − 2)) | 0.000000 | 0.000000 | ✓ |
| full-pass `methods_used_count` | 2 | 2 | ✓ |
| full-pass `shortlist_count` | 3 | 3 | ✓ |
| violations `volume_gap_ideas` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| violations `dedup_discrepancy_ideas` (5 − (5 − 0)) | 0.000000 | 0.000000 | ✓ |
| violations `methods_used_count` | 1 | 1 | ✓ |
| violations `shortlist_count` | 10 | 10 | ✓ |
| verdicts | SESSION_COMPLETE / SESSION_NOT_COMPLETE (exactly 3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case. The coordinating tester's own headline recompute also matches: captured 12 minus target 10 = 2 → `volume_gap_ideas` `2.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `brief`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
