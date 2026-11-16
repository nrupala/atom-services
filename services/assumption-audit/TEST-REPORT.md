# Test report — assumption-audit

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/assumption-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid decision-process manifest, all 18 fields true | HTTP 200, verdict `SOUND`, 18/18 checks pass | HTTP 200, `SOUND`, "18 pass, 0 fail, 0 missing of 18 checks across six sections" | PASS |
| 2 | violations — `framing.options_listed=false`, `loss.framed_each_direction=false` | HTTP 200, verdict `UNSOUND`, checks `real_options_listed` + `loss_framed_in_each_direction` fail | HTTP 200, `UNSOUND`, exactly those 2 checks fail (16 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — only `decision` + one framing field | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 17 missing | PASS |
| 4 | malformed — `framing: "not-an-object"`, `preset.criteria_set_before_data: "should-be-boolean"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `UNSOUND` (0 pass, 1 fail, 17 missing) — the string `"should-be-boolean"` was evaluated as a failing check instead of rejected as a type error | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `assumption_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"assumption-audit","atom_version":"0.1.0","decision":"Launch new product line","verdict":"SOUND","sections":{"framing":"pass","preset_criteria":"pass","loss_function":"pass","rigor_sizing":"pass","data_discipline":"pass","review":"pass"},"checks":[{"section":"framing","check":"decision_named","status":"pass","evidence":"name the decision and the real options"},{"section":"framing","check":"real_options_listed","status":"pass","evidence":"the real options are listed, not a single foregone option"},{"section":"framing","check":"decision_maker_identified","status":"pass","evidence":"identify the decision-maker"},{"section":"framing","check":"objective_defined","status":"pass","evidence":"what the decision-maker actually cares about (the objective / loss function) is defined"},{"section":"preset_criteria","check":"criteria_set_before_data","status":"pass","evidence":"decide how to decide before you see the data — decision criteria set in advance"},{"section":"preset_criteria","check":"default_action_set","status":"pass","evidence":"default action known in advance"},{"section":"preset_criteria","check":"change_my_mind_threshold_set_before_data","status":"pass","evidence":"pre-commit to exactly what evidence would flip the default — answered before looking"},{"section":"loss_function","check":"loss_framed_in_each_direction","status":"pass","evidence":"what being wrong costs — in each direction"},{"section":"loss_function","check":"threshold_reflects_asymmetric_costs","status":"pass","evidence":"asymmetric costs move the threshold"},{"section":"rigor_sizing","check":"stakes_assessed","status":"pass","evidence":"match effort to stakes"},{"section":"rigor_sizing","check":"reversibility_assessed","status":"pass","evidence":"one-way-door vs two-way-door assessed"},{"section":"rigor_sizing","check":"effort_matched_to_stakes_and_reversibility","status":"pass","evidence":"reversible decisions decide fast; irreversible ones slow down and gather more"},{"section":"data_discipline","check":"exploratory_and_confirmatory_separated","status":"pass","evidence":"exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis"},{"section":"data_discipline","check":"no_conclusion_from_inspiring_data","status":"pass","evidence":"never draw a conclusion from the same data that inspired it"},{"section":"data_discipline","check":"evidence_could_change_the_decision","status":"pass","evidence":"if no possible data could change the action, the data is decoration"},{"section":"data_discipline","check":"roles_clear","status":"pass","evidence":"the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call"},{"section":"review","check":"decision_quality_reviewed","status":"pass","evidence":"review the decision after acting per the pre-set criteria"},{"section":"review","check":"decision_reviewed_separately_from_outcome","status":"pass","evidence":"judge a decision by the process and information at the time, not by how it turned out (no resulting)"}],"summary":"18 pass, 0 fail, 0 missing of 18 checks across six sections.","stamp":"ASSUMPTION AUDIT\ndecision: Launch new product line\nVERDICT: SOUND\n  framing            pass\n  preset_criteria    pass\n  loss_function      pass\n  rigor_sizing       pass\n  data_discipline    pass\n  review             pass\n18 pass, 0 fail, 0 missing of 18 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"assumption-audit","atom_version":"0.1.0","decision":"Malformed test","verdict":"UNSOUND","sections":{"framing":"insufficient_evidence","preset_criteria":"fail","loss_function":"insufficient_evidence","rigor_sizing":"insufficient_evidence","data_discipline":"insufficient_evidence","review":"insufficient_evidence"},"checks":[{"section":"framing","check":"decision_named","status":"missing","evidence":"name the decision and the real options"},{"section":"framing","check":"real_options_listed","status":"missing","evidence":"the real options are listed, not a single foregone option"},{"section":"framing","check":"decision_maker_identified","status":"missing","evidence":"identify the decision-maker"},{"section":"framing","check":"objective_defined","status":"missing","evidence":"what the decision-maker actually cares about (the objective / loss function) is defined"},{"section":"preset_criteria","check":"criteria_set_before_data","status":"fail","evidence":"decide how to decide before you see the data — decision criteria set in advance"},{"section":"preset_criteria","check":"default_action_set","status":"missing","evidence":"default action known in advance"},{"section":"preset_criteria","check":"change_my_mind_threshold_set_before_data","status":"missing","evidence":"pre-commit to exactly what evidence would flip the default — answered before looking"},{"section":"loss_function","check":"loss_framed_in_each_direction","status":"missing","evidence":"what being wrong costs — in each direction"},{"section":"loss_function","check":"threshold_reflects_asymmetric_costs","status":"missing","evidence":"asymmetric costs move the threshold"},{"section":"rigor_sizing","check":"stakes_assessed","status":"missing","evidence":"match effort to stakes"},{"section":"rigor_sizing","check":"reversibility_assessed","status":"missing","evidence":"one-way-door vs two-way-door assessed"},{"section":"rigor_sizing","check":"effort_matched_to_stakes_and_reversibility","status":"missing","evidence":"reversible decisions decide fast; irreversible ones slow down and gather more"},{"section":"data_discipline","check":"exploratory_and_confirmatory_separated","status":"missing","evidence":"exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis"},{"section":"data_discipline","check":"no_conclusion_from_inspiring_data","status":"missing","evidence":"never draw a conclusion from the same data that inspired it"},{"section":"data_discipline","check":"evidence_could_change_the_decision","status":"missing","evidence":"if no possible data could change the action, the data is decoration"},{"section":"data_discipline","check":"roles_clear","status":"missing","evidence":"the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call"},{"section":"review","check":"decision_quality_reviewed","status":"missing","evidence":"review the decision after acting per the pre-set criteria"},{"section":"review","check":"decision_reviewed_separately_from_outcome","status":"missing","evidence":"judge a decision by the process and information at the time, not by how it turned out (no resulting)"}],"summary":"0 pass, 1 fail, 17 missing of 18 checks across six sections.","stamp":"ASSUMPTION AUDIT\ndecision: Malformed test\nVERDICT: UNSOUND\n  framing            insufficient_evidence\n  preset_criteria    fail\n  loss_function      insufficient_evidence\n  rigor_sizing       insufficient_evidence\n  data_discipline    insufficient_evidence\n  review             insufficient_evidence\n0 pass, 1 fail, 17 missing of 18 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4 (malformed): `framing` as a string where an object is required, and `preset.criteria_set_before_data` as a string where a boolean is required. Expected (test doctrine for this
program + the gateway's `invalid_input` mechanism in `callpath.ts`):
HTTP 422 `{ok:false, error:"invalid_input", field:...}`. Actual:
HTTP 200 with a verdict computed over the garbage values. The atom's
handler does not validate manifest field types before evaluation.
Disposition: **fix spec filed** — `verification/fix-specs/assumption-audit.md`.
Retest on redeploy.

No tester errors in this atom's run.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases, determinism and MCP/REST parity hold; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment 7f9cae9fdd60417eb72062905a066554. Evidence: `verification/work/assumption-audit/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/assumption-audit/judgment.json` (Gemini verdict: PASS).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `SOUND` | HTTP 200, verdict `SOUND` | PASS |
| 2 | violations | HTTP 200, verdict `UNSOUND` | HTTP 200, verdict `UNSOUND` | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "framing", "detail": "framing must be an object"}` | PASS |
| 5 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| 6 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

F1 disposition: **F1 closed — malformed now returns 422 invalid_input (field: framing)**. Raw malformed body: `{"ok": false, "error": "invalid_input", "field": "framing", "detail": "framing must be an object"}`. Wave 1 returned HTTP 200 with a verdict computed over the type-violating input; the retest evidence shows the recorded malformed case is now rejected before evaluation, and all other recorded cases (full-pass, violations, sparse, determinism, parity) pass both the Gemini judgment (verdict: PASS, findings: 0) and the mechanical checks (malformed status 422 with error == "invalid_input"; full-pass determinism_byte_identical == true and parity_structured_equal == true; full-pass/violations/sparse HTTP status and verdict match cases.json expect).

Tester errors this wave: none.

**Retest verdict: PASS**
