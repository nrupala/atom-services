# Test report — decision-trap-sweep

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
**Evidence:** `verification/work/decision-trap-sweep/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete declared decision record for an irreversible decision | HTTP 200, verdict `TRAP_CLEAR`, 24/24 checks pass | HTTP 200, `TRAP_CLEAR`, "24 pass, 0 fail, 0 missing of 24 checks across seven sections", stamp present and well-formed | PASS |
| 2 | violations — `rush.made_in_rush=true`, `rush.made_in_a_mood=true` on an irreversible decision | HTTP 200, verdict `TRAPS_PRESENT`, the 2 rush/mood checks fail | HTTP 200, `TRAPS_PRESENT`, exactly those 2 checks fail (22 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — only `decision` + `framing.decision_stated` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 23 missing | PASS |
| 4 | malformed — `framing.classification: 123`, `options: "not-a-list"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `TRAPS_PRESENT` (2 pass, 1 fail, 21 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass record submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass record via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `decision_trap_sweep`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"decision-trap-sweep","atom_version":"0.1.0","decision":"Migrate database to cloud","verdict":"TRAP_CLEAR","sections":{"framing_and_classification":"pass","options":"pass","criteria_before_evaluation":"pass","evaluation_and_uncertainty":"pass","pre_mortem":"pass","rush_and_mood_trap":"pass","decision_log_and_review":"pass"},"checks":[{"section":"framing_and_classification","check":"decision_stated","status":"pass","evidence":"what needs deciding is stated \u2014 frame the actual decision until it is crisp"},{"section":"framing_and_classification","check":"decide_by_named","status":"pass","evidence":"by when the decision must be made is named"},{"section":"framing_and_classification","check":"constraints_named","status":"pass","evidence":"the constraints on the decision are named"},{"section":"framing_and_classification","check":"out_of_scope_named","status":"pass","evidence":"what is out of scope is named"},{"section":"framing_and_classification","check":"decision_classified_reversible_or_irreversible","status":"pass","evidence":"classify the decision: reversible (decide fast, adjust) vs irreversible (slow down, deliberate)"},{"section":"framing_and_classification","check":"stakes_assessed","status":"pass","evidence":"stakes assessed \u2014 stakes x reversibility sets the effort budget"},{"section":"options","check":"at_least_three_options","status":"pass","evidence":"generate at least three options \u2014 binary choices are usually false binaries"},{"section":"options","check":"status_quo_option_included","status":"pass","evidence":"the options include 'do nothing / wait'"},{"section":"options","check":"smaller_reversible_step_included","status":"pass","evidence":"the options include a smaller reversible step"},{"section":"criteria_before_evaluation","check":"criteria_listed","status":"pass","evidence":"what matters is defined (cost, risk, time-to-value, optionality)"},{"section":"criteria_before_evaluation","check":"criteria_defined_before_scoring","status":"pass","evidence":"criteria are defined BEFORE scoring options \u2014 criteria after scores is rationalization"},{"section":"criteria_before_evaluation","check":"weights_assigned_before_scoring","status":"pass","evidence":"weights are assigned before evaluation, not fitted to the scores afterwards"},{"section":"evaluation_and_uncertainty","check":"fitting_evaluation_method_named","status":"pass","evidence":"evaluate with a fitting tool \u2014 decision matrix for multi-criteria, expected value / decision trees when probabilities are estimable, scenario thinking when they are not; the method used is named"},{"section":"evaluation_and_uncertainty","check":"uncertainty_flagged","status":"pass","evidence":"flag the uncertainty in the evaluation"},{"section":"evaluation_and_uncertainty","check":"expected_value_used_when_probabilities_estimable","status":"pass","evidence":"when probabilities are estimable, evaluate with expected value / decision trees"},{"section":"pre_mortem","check":"premortem_conducted_for_material_decision","status":"pass","evidence":"pre-mortem for material decisions: assume it failed \u2014 why?"},{"section":"pre_mortem","check":"premortem_top_risks_hedged_for_material_decision","status":"pass","evidence":"fix or hedge the pre-mortem's top failure reasons now"},{"section":"rush_and_mood_trap","check":"irreversible_decision_not_made_in_rush","status":"pass","evidence":"no irreversible decision made in a rush"},{"section":"rush_and_mood_trap","check":"irreversible_decision_not_made_in_a_mood","status":"pass","evidence":"no irreversible decision made in a mood"},{"section":"decision_log_and_review","check":"choice_logged","status":"pass","evidence":"the choice is logged"},{"section":"decision_log_and_review","check":"rationale_logged","status":"pass","evidence":"the rationale is logged"},{"section":"decision_log_and_review","check":"assumptions_logged","status":"pass","evidence":"the assumptions behind the choice are logged"},{"section":"decision_log_and_review","check":"review_date_set","status":"pass","evidence":"a review date is set \u2014 review on schedule: outcomes vs expectations; separate luck from process; update"},{"section":"decision_log_and_review","check":"decision_communicated_with_why","status":"pass","evidence":"the decision is communicated with the 'why'"}],"summary":"24 pass, 0 fail, 0 missing of 24 checks across seven sections.","stamp":"DECISION-TRAP SWEEP\ndecision: Migrate database to cloud\nVERDICT: TRAP_CLEAR\n  framing_and_classification   pass\n  options                      pass\n  criteria_before_evaluation   pass\n  evaluation_and_uncertainty   pass\n  pre_mortem                   pass\n  rush_and_mood_trap           pass\n  decision_log_and_review      pass\n24 pass, 0 fail, 0 missing of 24 checks across seven sections."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"decision-trap-sweep","atom_version":"0.1.0","decision":"Malformed input","verdict":"TRAPS_PRESENT","sections":{"framing_and_classification":"fail","options":"insufficient_evidence","criteria_before_evaluation":"insufficient_evidence","evaluation_and_uncertainty":"insufficient_evidence","pre_mortem":"insufficient_evidence","rush_and_mood_trap":"pass","decision_log_and_review":"insufficient_evidence"},"summary":"2 pass, 1 fail, 21 missing of 24 checks across seven sections.","stamp":"DECISION-TRAP SWEEP\ndecision: Malformed input\nVERDICT: TRAPS_PRESENT\n  framing_and_classification   fail\n  options                      insufficient_evidence\n  criteria_before_evaluation   insufficient_evidence\n  evaluation_and_uncertainty   insufficient_evidence\n  pre_mortem                   insufficient_evidence\n  rush_and_mood_trap           pass\n  decision_log_and_review      insufficient_evidence\n2 pass, 1 fail, 21 missing of 24 checks across seven sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `framing.classification` as a number, `options` as a string. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`TRAPS_PRESENT` verdict computed over the garbage values (the numeric `classification` was failed as a check rather than rejected as a type error).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/decision-trap-sweep.md`. Retest on redeploy.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases, determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

**Gateway/deployment:** atoms-gateway v1.1.0 at https://atoms.pipavia.com (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`, retested 2026-11-15. Evidence: `verification/work/decision-trap-sweep/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/decision-trap-sweep/judgment.json` (Gemini verdict: PASS, 0 findings, 0 tester errors).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `TRAP_CLEAR` | HTTP 200, verdict `TRAP_CLEAR`, "24 pass, 0 fail, 0 missing of 24 checks across seven sections." | PASS |
| 2 | violations | HTTP 200, verdict `TRAPS_PRESENT` | HTTP 200, verdict `TRAPS_PRESENT`, "22 pass, 2 fail, 0 missing of 24 checks across seven sections." | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, "1 pass, 0 fail, 23 missing of 24 checks across seven sections." | PASS |
| 4 | malformed | HTTP 422, `{ok:false, error:"invalid_input"}`, no verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"framing.classification","detail":"framing.classification must be a string"}` | PASS |
| 5 | determinism | byte-identical responses on repeat REST submission of full-pass | byte-identical: **true** | PASS |
| 6 | parity | MCP `tools/call` structuredContent deep-equal to REST artifact for full-pass | structuredContent deep-equal: **true** (tool name `decision_trap_sweep`) | PASS |

F1 closed — malformed now returns 422 invalid_input (field: framing.classification). Raw malformed response: `{"ok":false,"error":"invalid_input","field":"framing.classification","detail":"framing.classification must be a string"}`. This replaces the Wave 1 behaviour, in which the same type-violating manifest returned HTTP 200 with a verdict computed over the garbage values. Mechanical verification confirms the malformed first execution is HTTP 422 with a JSON body whose `error` is `"invalid_input"`, and that the full-pass, violations and sparse first executions match the HTTP status and verdict recorded in `cases.json` expect, with `determinism_byte_identical == true` and `parity_structured_equal == true` on the full-pass case.

Tester errors this wave: none. Gemini returned PASS with no findings and no tester errors, and no Gemini finding contradicted the atom's contract.yaml / SERVICE.md; mechanical evidence and Gemini's judgment agree on every case.

**Retest verdict: PASS**
