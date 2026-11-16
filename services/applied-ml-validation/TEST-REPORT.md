# Test report — applied-ml-validation

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/applied-ml-validation/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — baseline 0.5 → model 0.6 `higher_is_better`, temporal+grouped data with `time_and_group` split, ladder `linear` with rungs `[majority_heuristic, linear]` | HTTP 200, verdict `VALIDATED`, `baseline_improvement` `0.1000`, `baseline_status` `beaten_on_declared_evidence`, `selected_rung_index` 1 | HTTP 200, `VALIDATED`, 35 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — baseline 0.8 vs model 0.7 `higher_is_better`, training without rights true, temporal data with `random` split, ladder `deep` with rungs `[deep]`, accuracy-only on imbalanced/high-stakes, cherry-picked examples, claims exceed capability | HTTP 200, verdict `NOT_VALIDATED`, the 7 named checks fail | HTTP 200, `NOT_VALIDATED`, 28 pass / 7 fail / 0 missing; failing checks exactly `baseline_meaningfully_beaten_or_project_stopped`, `no_training_without_rights_or_consent`, `splits_by_time_and_group_where_applicable`, `ladder_climbed_in_order`, `no_accuracy_only_reporting_where_it_matters`, `no_cherry_picked_examples`, `no_claims_beyond_measured_capability`; `baseline_improvement` `-0.1000`, `selected_rung_index` 3 | PASS |
| 3 | sparse — only `model` + `framing.decision_named` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 34 missing, computed fields null | PASS |
| 4 | malformed — `model: 123` (number where a string is required), `framing: "not-an-object"` | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"model","detail":"model must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `applied_ml_validation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 35 checks and a text stamp):

```json
{"service": "applied-ml-validation", "atom_version": "0.1.0", "model": "test-model-v1", "verdict": "VALIDATED", "sections": {"framing_and_baseline": "pass", "data_audit_and_leakage": "pass", "model_ladder": "pass", "evaluation_and_honesty": "pass", "robustness_and_limits": "pass", "deployment_monitoring_and_card": "pass"}, "baseline_improvement": "0.1000", "baseline_status": "beaten_on_declared_evidence", "selected_rung_index": 1, "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"model","detail":"model must be a string"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run. (The violations case's expected failing-check labels as designed were paraphrases; they were normalised to the exact check names above before judging, with no change to any input value or expected verdict.)

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (signed baseline improvement with the SERVICE.md 4dp round-half-up rule, ladder indices, split and ladder-prefix rules) and verified the artifact's numbers and verdicts. Raw output: `verification/work/applied-ml-validation/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `baseline_improvement` (0.6 − 0.5, higher_is_better) | 0.1000 | 0.1000 | ✓ |
| violations `baseline_improvement` (0.7 − 0.8) | −0.1000 | −0.1000 | ✓ |
| full-pass `selected_rung_index` (linear) | 1 | 1 | ✓ |
| violations `selected_rung_index` (deep) | 3 | 3 | ✓ |
| splits: full-pass / violations | pass / fail | pass / fail | ✓ |
| ladder prefix: full-pass / violations | pass / fail | pass / fail | ✓ |
| verdicts | VALIDATED / NOT_VALIDATED (7 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 7-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity.
