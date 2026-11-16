# Test report — cicd-pipeline-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/cicd-pipeline-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — stages lint 1 / typecheck 2 / test 5 / build 3 / package_sign 1 / publish 1 (sum 13, declared 13), monthly 13 × 100 = 1300 declared 1300, budget 2000 (headroom 700), all must-be-true fields true, all must-be-false fields false | HTTP 200, verdict `CICD_PIPELINE_READY`, `computed_total_minutes` `13.000000`, `total_minutes_difference` `0.000000`, `computed_monthly_minutes` `1300.000000`, `monthly_minutes_difference` `0.000000`, `budget_headroom_minutes` `700.000000`, `stated_stages_not_declared` `[]` | HTTP 200, `CICD_PIPELINE_READY`, 36 pass / 0 fail / 0 missing, exactly those computed values, `stages_evaluated` 6, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — full manifest with declared total 5 vs sum 13, `unpinned_third_party_actions_present` true, `secrets_cached` true, `secrets.in_artifacts` true, `secrets.appeared_in_logs_or_artifacts` true, monthly declared 50 vs computed 10 × 10 = 100, computed monthly 100 over declared budget 20, `duplicates_primary_gate` true, `direct_to_prod_from_laptop` true, `disabled_to_unblock_merge` true | HTTP 200, verdict `CICD_PIPELINE_NOT_READY`, the 10 named checks fail | HTTP 200, `CICD_PIPELINE_NOT_READY`, 26 pass / 10 fail / 0 missing; failing checks exactly `total_minutes_matches_sum_of_stage_minutes`, `no_unpinned_third_party_actions`, `secrets_not_cached`, `secrets_never_in_artifacts`, `no_secret_appeared_in_logs_or_artifacts`, `monthly_minutes_matches_per_run_times_runs`, `monthly_minutes_within_declared_budget`, `pipeline_does_not_duplicate_primary_gate`, `never_direct_to_prod_from_laptop`, `gates_not_disabled_to_unblock_merge`; `computed_total_minutes` `13.000000`, `total_minutes_difference` `-8.000000`, `computed_monthly_minutes` `100.000000`, `monthly_minutes_difference` `-50.000000`, `budget_headroom_minutes` `-80.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, computed fields null, `stages_evaluated` 0 | PASS |
| 4 | malformed — `pipeline: "this-should-be-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"pipeline","detail":"pipeline must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `cicd_pipeline_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 36 checks and a text stamp):

```json
{"service": "cicd-pipeline-design", "atom_version": "0.1.0", "entity": "service-alpha", "verdict": "CICD_PIPELINE_READY", "sections": {"stages_and_fail_fast": "pass", "determinism_and_pinning": "pass", "caching_and_secrets": "pass", "budget_awareness": "pass", "provenance_and_signing": "pass", "deploys_and_gates": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "stages_evaluated": 6, "computed_total_minutes": "13.000000", "total_minutes_difference": "0.000000", "stated_stages_not_declared": [], "computed_monthly_minutes": "1300.000000", "monthly_minutes_difference": "0.000000", "budget_headroom_minutes": "700.000000", "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"pipeline","detail":"pipeline must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`stages_evaluated` 6, `computed_total_minutes` `13.000000`, `total_minutes_difference` `0.000000`, `stated_stages_not_declared` `[]`, `computed_monthly_minutes` `1300.000000`, `monthly_minutes_difference` `0.000000`, `budget_headroom_minutes` `700.000000`, `computed_status`).
2. Violations designed `failing_checks` listed section names (`stages_and_fail_fast`, `determinism_and_pinning`, `caching_and_secrets`, `budget_awareness`, `deploys_and_gates`) instead of exact check names. Corrected before execution to the 10 exact check names above.
3. Violations input was sparse — most sections absent, so their checks would have been `missing`, not failing, and its single `lint` stage would have added an unintended stage-sequence failure. Corrected before execution: rebuilt as a full manifest carrying exactly the ten planted violations intended (wrong declared total, unpinned actions present, secrets cached, secrets in artifacts, secret appeared in logs/artifacts, wrong declared monthly minutes, monthly minutes over the caller-declared budget, duplicated primary gate, direct-to-prod from laptop, gates disabled to unblock merge), with every other field at its passing value.
4. Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_total_minutes` `13.000000`, `total_minutes_difference` `-8.000000`, `computed_monthly_minutes` `100.000000`, `monthly_minutes_difference` `-50.000000`, `budget_headroom_minutes` `-80.000000`, `stages_evaluated` 6, `computed_status`).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (stage-minutes sum, monthly minutes per-run × runs, budget headroom, stage-sequence coverage, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/cicd-pipeline-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_total_minutes` (1 + 2 + 5 + 3 + 1 + 1) | 13.000000 | 13.000000 | ✓ |
| full-pass `total_minutes_difference` (13 − 13) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_monthly_minutes` (13 × 100) | 1300.000000 | 1300.000000 | ✓ |
| full-pass `monthly_minutes_difference` (1300 − 1300) | 0.000000 | 0.000000 | ✓ |
| full-pass `budget_headroom_minutes` (2000 − 1300) | 700.000000 | 700.000000 | ✓ |
| full-pass `stated_stages_not_declared` | [] | [] | ✓ |
| violations `computed_total_minutes` (rederived sum) | 13.000000 | 13.000000 | ✓ |
| violations `total_minutes_difference` (5 − 13) | -8.000000 | -8.000000 | ✓ |
| violations `computed_monthly_minutes` (10 × 10) | 100.000000 | 100.000000 | ✓ |
| violations `monthly_minutes_difference` (50 − 100) | -50.000000 | -50.000000 | ✓ |
| violations `budget_headroom_minutes` (20 − 100) | -80.000000 | -80.000000 | ✓ |
| verdicts | CICD_PIPELINE_READY / CICD_PIPELINE_NOT_READY (10 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 10-check failure set on the violations case. The coordinating tester's own headline recompute also matches: stage sum 1 + 2 + 5 + 3 + 1 + 1 = 13 → `computed_total_minutes` `13.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `pipeline`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
