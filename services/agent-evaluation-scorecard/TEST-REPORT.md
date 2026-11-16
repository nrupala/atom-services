# Test report — agent-evaluation-scorecard

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
**Evidence:** `verification/work/agent-evaluation-scorecard/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid agent-evaluation manifest | HTTP 200, verdict `TRUSTED`, 32/32 checks pass | HTTP 200, `TRUSTED`, "32 pass, 0 fail, 0 missing of 32 checks across eight sections", computed scorecard tasks_total=1 / tasks_passing=1 / safety_violations=0 (recomputed by Gemini: match) | PASS |
| 2 | violations — `suite.versioned=false`, `judging.model_judges_itself=true`, one task `passed=false` | HTTP 200, verdict `NOT_TRUSTED`, the checks covering those values fail | HTTP 200, `NOT_TRUSTED`, exactly 2 checks fail (`suite_versioned`, `all_tasks_meet_acceptance_criteria`), 30 pass | PASS |
| 3 | sparse — only `agent` + one task row | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 31 missing | PASS |
| 4 | malformed — `agent: 12345`, `tasks: "not-a-list"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 32 missing) — type-violating values were treated as missing evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `agent_evaluation_scorecard`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"agent-evaluation-scorecard","atom_version":"0.1.0","agent":"milo-v4","verdict":"TRUSTED","sections":{"task_suite":"pass","reproducible_runs":"pass","judging":"pass","regression_gates":"pass","beyond_accuracy":"pass","incident_replay":"pass","scorecard":"pass","benchmark_hygiene":"pass"},"checks":[{"section":"task_suite","check":"suite_versioned","status":"pass","evidence":"quality gate: suite versioned, criteria written before running"},{"section":"task_suite","check":"criteria_written_before_running","status":"pass","evidence":"acceptance criteria written before the run, not after"},{"section":"task_suite","check":"acceptance_criteria_defined_per_task","status":"pass","evidence":"golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints"},{"section":"task_suite","check":"suite_versioned_with_agent","status":"pass","evidence":"task suites versioned with the agent"},{"section":"reproducible_runs","check":"model_version_pinned","status":"pass","evidence":"pin model versions"},{"section":"reproducible_runs","check":"sampling_settings_pinned","status":"pass","evidence":"pin seeds/temperatures"},{"section":"reproducible_runs","check":"tool_state_pinned","status":"pass","evidence":"pin tool states"},{"section":"reproducible_runs","check":"fixtures_pinned","status":"pass","evidence":"pin fixtures"},{"section":"reproducible_runs","check":"raw_transcripts_stored","status":"pass","evidence":"store raw transcripts"},{"section":"reproducible_runs","check":"same_suite_for_every_candidate","status":"pass","evidence":"run the same suite per candidate"},{"section":"judging","check":"deterministic_checks_first","status":"pass","evidence":"deterministic checks first (did it do the thing?)"},{"section":"judging","check":"llm_judge_calibrated_against_human_labels","status":"pass","evidence":"no LLM judge declared"},{"section":"judging","check":"judge_blinded","status":"pass","evidence":"no LLM judge declared"},{"section":"judging","check":"position_bias_controls","status":"pass","evidence":"no LLM judge declared"},{"section":"judging","check":"no_uncalibrated_self_judging","status":"pass","evidence":"the model under test does not judge itself"},{"section":"regression_gates","check":"eval_runs_before_merge","status":"pass","evidence":"eval suite runs before merging agent changes"},{"section":"regression_gates","check":"regressions_block_merge","status":"pass","evidence":"regressions block until explained"},{"section":"regression_gates","check":"accepted_tradeoffs_written","status":"pass","evidence":"accepted trade-offs are written, not vibes"},{"section":"beyond_accuracy","check":"steps_to_completion_tracked","status":"pass","evidence":"track steps-to-completion"},{"section":"beyond_accuracy","check":"cost_tracked","status":"pass","evidence":"track cost"},{"section":"beyond_accuracy","check":"latency_tracked","status":"pass","evidence":"track latency"},{"section":"beyond_accuracy","check":"refusal_and_error_rates_tracked","status":"pass","evidence":"track refusal/error rates"},{"section":"beyond_accuracy","check":"safety_violations_tracked","status":"pass","evidence":"track safety violations"},{"section":"beyond_accuracy","check":"silent_wrongness_tracked","status":"pass","evidence":"track silent wrongness (confident bad output)"},{"section":"incident_replay","check":"misbehavior_becomes_named_test_cases","status":"pass","evidence":"every production misbehavior becomes a named test case"},{"section":"incident_replay","check":"all_production_incidents_replayed","status":"pass","evidence":"incident replay: incidents turned into permanent regression tests"},{"section":"scorecard","check":"scorecard_published_per_run","status":"pass","evidence":"publish a compact scorecard per run"},{"section":"scorecard","check":"scorecards_stored","status":"pass","evidence":"quality gate: scorecards stored"},{"section":"scorecard","check":"all_tasks_meet_acceptance_criteria","status":"pass","evidence":"every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)"},{"section":"benchmark_hygiene","check":"contamination_checked","status":"pass","evidence":"watch contamination (tasks leaking into training)"},{"section":"benchmark_hygiene","check":"variance_reported","status":"pass","evidence":"run N times, report spread"},{"section":"benchmark_hygiene","check":"rebaselined_after_model_updates","status":"pass","evidence":"re-baseline after model updates"}],"scorecard":{"tasks_total":1,"tasks_passing":1,"safety_violations":0},"summary":"32 pass, 0 fail, 0 missing of 32 checks across eight sections.","stamp":"AGENT-EVALUATION SCORECARD\nagent: milo-v4\nVERDICT: TRUSTED\n  task_suite         pass\n  reproducible_runs  pass\n  judging            pass\n  regression_gates   pass\n  beyond_accuracy    pass\n  incident_replay    pass\n  scorecard          pass\n  benchmark_hygiene  pass\n32 pass, 0 fail, 0 missing of 32 checks across eight sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"agent-evaluation-scorecard","atom_version":"0.1.0","agent":12345,"verdict":"INSUFFICIENT_EVIDENCE","sections":{"task_suite":"insufficient_evidence","reproducible_runs":"insufficient_evidence","judging":"insufficient_evidence","regression_gates":"insufficient_evidence","beyond_accuracy":"insufficient_evidence","incident_replay":"insufficient_evidence","scorecard":"insufficient_evidence","benchmark_hygiene":"insufficient_evidence"},"checks":[{"section":"task_suite","check":"suite_versioned","status":"missing","evidence":"quality gate: suite versioned, criteria written before running"},{"section":"task_suite","check":"criteria_written_before_running","status":"missing","evidence":"acceptance criteria written before the run, not after"},{"section":"task_suite","check":"acceptance_criteria_defined_per_task","status":"missing","evidence":"golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints"},{"section":"task_suite","check":"suite_versioned_with_agent","status":"missing","evidence":"task suites versioned with the agent"},{"section":"reproducible_runs","check":"model_version_pinned","status":"missing","evidence":"pin model versions"},{"section":"reproducible_runs","check":"sampling_settings_pinned","status":"missing","evidence":"pin seeds/temperatures"},{"section":"reproducible_runs","check":"tool_state_pinned","status":"missing","evidence":"pin tool states"},{"section":"reproducible_runs","check":"fixtures_pinned","status":"missing","evidence":"pin fixtures"},{"section":"reproducible_runs","check":"raw_transcripts_stored","status":"missing","evidence":"store raw transcripts"},{"section":"reproducible_runs","check":"same_suite_for_every_candidate","status":"missing","evidence":"run the same suite per candidate"},{"section":"judging","check":"deterministic_checks_first","status":"missing","evidence":"deterministic checks first (did it do the thing?)"},{"section":"judging","check":"llm_judge_calibrated_against_human_labels","status":"missing","evidence":"no LLM judge declared"},{"section":"judging","check":"judge_blinded","status":"missing","evidence":"no LLM judge declared"},{"section":"judging","check":"position_bias_controls","status":"missing","evidence":"no LLM judge declared"},{"section":"judging","check":"no_uncalibrated_self_judging","status":"missing","evidence":"the model under test does not judge itself"},{"section":"regression_gates","check":"eval_runs_before_merge","status":"missing","evidence":"eval suite runs before merging agent changes"},{"section":"regression_gates","check":"regressions_block_merge","status":"missing","evidence":"regressions block until explained"},{"section":"regression_gates","check":"accepted_tradeoffs_written","status":"missing","evidence":"accepted trade-offs are written, not vibes"},{"section":"beyond_accuracy","check":"steps_to_completion_tracked","status":"missing","evidence":"track steps-to-completion"},{"section":"beyond_accuracy","check":"cost_tracked","status":"missing","evidence":"track cost"},{"section":"beyond_accuracy","check":"latency_tracked","status":"missing","evidence":"track latency"},{"section":"beyond_accuracy","check":"refusal_and_error_rates_tracked","status":"missing","evidence":"track refusal/error rates"},{"section":"beyond_accuracy","check":"safety_violations_tracked","status":"missing","evidence":"track safety violations"},{"section":"beyond_accuracy","check":"silent_wrongness_tracked","status":"missing","evidence":"track silent wrongness (confident bad output)"},{"section":"incident_replay","check":"misbehavior_becomes_named_test_cases","status":"missing","evidence":"every production misbehavior becomes a named test case"},{"section":"incident_replay","check":"all_production_incidents_replayed","status":"missing","evidence":"incident replay: incidents turned into permanent regression tests"},{"section":"scorecard","check":"scorecard_published_per_run","status":"missing","evidence":"publish a compact scorecard per run"},{"section":"scorecard","check":"scorecards_stored","status":"missing","evidence":"quality gate: scorecards stored"},{"section":"scorecard","check":"all_tasks_meet_acceptance_criteria","status":"missing","evidence":"no task results declared"},{"section":"benchmark_hygiene","check":"contamination_checked","status":"missing","evidence":"watch contamination (tasks leaking into training)"},{"section":"benchmark_hygiene","check":"variance_reported","status":"missing","evidence":"run N times, report spread"},{"section":"benchmark_hygiene","check":"rebaselined_after_model_updates","status":"missing","evidence":"re-baseline after model updates"}],"scorecard":{"tasks_total":0,"tasks_passing":0,"safety_violations":0},"summary":"0 pass, 0 fail, 32 missing of 32 checks across eight sections.","stamp":"AGENT-EVALUATION SCORECARD\nagent: 12345\nVERDICT: INSUFFICIENT_EVIDENCE\n  task_suite         insufficient_evidence\n  reproducible_runs  insufficient_evidence\n  judging            insufficient_evidence\n  regression_gates   insufficient_evidence\n  beyond_accuracy    insufficient_evidence\n  incident_replay    insufficient_evidence\n  scorecard          insufficient_evidence\n  benchmark_hygiene  insufficient_evidence\n0 pass, 0 fail, 32 missing of 32 checks across eight sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4 (malformed): `agent` as a number and `tasks` as a string. Expected (test doctrine for this
program + the gateway's `invalid_input` mechanism in `callpath.ts`):
HTTP 422 `{ok:false, error:"invalid_input", field:...}`. Actual:
HTTP 200 with a verdict computed over the garbage values. The atom's
handler does not validate manifest field types before evaluation.
Disposition: **fix spec filed** — `verification/fix-specs/agent-evaluation-scorecard.md`.
Retest on redeploy.

Tester-note correction (coordinator disposition, not a tester error —
the case's expected outcome was correct): Gemini's design note for
case 2 described `model_judges_itself=true` as "(uncalibrated)", but
the designed input sets `judge_calibrated_against_human_labels=true`,
and SERVICE.md states the check `no_uncalibrated_self_judging` "fails
when true and the judge is uncalibrated". The check passing is
contract-correct; the two genuinely failing checks follow directly
from the other planted values. Gemini's judgment itself raised no
finding on case 2, correctly.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases, the computed scorecard counts recompute correctly, determinism and MCP/REST parity hold; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment 7f9cae9fdd60417eb72062905a066554. Evidence: `verification/work/agent-evaluation-scorecard/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/agent-evaluation-scorecard/judgment.json` (Gemini verdict: PASS).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `TRUSTED` | HTTP 200, verdict `TRUSTED` | PASS |
| 2 | violations | HTTP 200, verdict `NOT_TRUSTED` | HTTP 200, verdict `NOT_TRUSTED` | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "agent", "detail": "agent must be a string"}` | PASS |
| 5 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| 6 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

F1 disposition: **F1 closed — malformed now returns 422 invalid_input (field: agent)**. Raw malformed body: `{"ok": false, "error": "invalid_input", "field": "agent", "detail": "agent must be a string"}`. Wave 1 returned HTTP 200 with a verdict computed over the type-violating input; the retest evidence shows the recorded malformed case is now rejected before evaluation, and all other recorded cases (full-pass, violations, sparse, determinism, parity) pass both the Gemini judgment (verdict: PASS, findings: 0) and the mechanical checks (malformed status 422 with error == "invalid_input"; full-pass determinism_byte_identical == true and parity_structured_equal == true; full-pass/violations/sparse HTTP status and verdict match cases.json expect).

Tester errors this wave: none.

**Retest verdict: PASS**
