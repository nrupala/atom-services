# Test report — observability-and-runbook-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/observability-and-runbook-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (service `auth-service`): all signals, alert-design, incident and resilience declarations in passing polarity, all three red-line flags false, one alert row `high-error-rate` with owner `team-alpha`, runbook-linked, actionable and symptom-based, one failure-mode row `db-connection-timeout` with full runbook content | HTTP 200, verdict `OBSERVABILITY_DESIGN_SOUND`, `alerts_count` `1`, `failure_modes_count` `1`, `owner_coverage` `"1.000000"`, `runbook_link_coverage` `"1.000000"`, `actionable_coverage` `"1.000000"`, `symptom_based_coverage` `"1.000000"`, `runbook_coverage` `"1.000000"`, `symptoms_coverage` `"1.000000"`, `check_steps_coverage` `"1.000000"`, `mitigation_coverage` `"1.000000"`, `escalation_coverage` `"1.000000"`, `recovery_verification_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `OBSERVABILITY_DESIGN_SOUND`, 43 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`, `duplicate_alert_names` `[]`, `duplicate_failure_mode_names` `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `signals.metrics_cover_errors` false, alert `high-error-rate` with `owner` `""`, `runbook_linked` false, `symptom_based` false, failure mode `db-connection-timeout` with `check_steps_present` false and `recovery_verification_present` false, `incident.blameless_postmortem_required` false, and `red_lines.unowned_alerts_present` true | HTTP 200, verdict `OBSERVABILITY_DESIGN_NOT_SOUND`, the 8 named checks fail | HTTP 200, `OBSERVABILITY_DESIGN_NOT_SOUND`, 35 pass / 8 fail / 0 missing; failing checks exactly `blameless_postmortem_required`, `every_alert_has_owner`, `every_alert_is_symptom_based`, `every_alert_links_runbook`, `every_runbook_has_check_steps`, `every_runbook_has_recovery_verification`, `metrics_cover_errors`, `no_unowned_alerts`; `alerts_without_owner` `["high-error-rate"]`, `owner_coverage` `"0.000000"`, `alerts_without_runbook_link` `["high-error-rate"]`, `runbook_link_coverage` `"0.000000"`, `alerts_without_actionable` `[]`, `actionable_coverage` `"1.000000"`, `alerts_without_symptom_basis` `["high-error-rate"]`, `symptom_based_coverage` `"0.000000"`, `failure_modes_without_check_steps` `["db-connection-timeout"]`, `check_steps_coverage` `"0.000000"`, `failure_modes_without_recovery_verification` `["db-connection-timeout"]`, `recovery_verification_coverage` `"0.000000"`, all other row-name lists `[]` and coverages `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; all five sections `fail` | PASS |
| 3 | sparse — only `service_name` (`minimal-service`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 43 missing, all five sections `insufficient_evidence`, `alerts_count` null, `failure_modes_count` null, all row-name lists null, all coverage values null, `computed_status` null | PASS |
| 4 | malformed — `signals: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"signals","detail":"signals must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `observability_and_runbook_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 43 checks and a text stamp):

```json
{"service": "observability-and-runbook-design", "atom_version": "0.1.0", "service_name": "auth-service", "verdict": "OBSERVABILITY_DESIGN_SOUND", "sections": {"signals_and_dashboards": "pass", "alert_design_and_runbook_linkage": "pass", "runbook_content_and_failure_modes": "pass", "incident_flow_and_postmortem": "pass", "backups_silent_failure_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "alerts_count": 1, "alerts_without_owner": [], "owner_coverage": "1.000000", "alerts_without_runbook_link": [], "runbook_link_coverage": "1.000000", "alerts_without_actionable": [], "actionable_coverage": "1.000000", "alerts_without_symptom_basis": [], "symptom_based_coverage": "1.000000", "duplicate_alert_names": [], "failure_modes_count": 1, "failure_modes_without_runbook": [], "runbook_coverage": "1.000000", "failure_modes_without_symptoms": [], "symptoms_coverage": "1.000000", "failure_modes_without_check_steps": [], "check_steps_coverage": "1.000000", "failure_modes_without_mitigation": [], "mitigation_coverage": "1.000000", "failure_modes_without_escalation": [], "escalation_coverage": "1.000000", "failure_modes_without_recovery_verification": [], "recovery_verification_coverage": "1.000000", "duplicate_failure_mode_names": [], "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"signals","detail":"signals must be an object"}
```

## Findings

No findings.

## Tester errors

13 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 12 rejections in total — by rule: R1 check-register ×8, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1 — plus 1 plant-adaptation correction recorded when the violations case was rebuilt. The corrected, executed battery passed the validator (`final_ok: true`) before execution. Full record: `verification/work/observability-and-runbook-design/corrections.json`.

1. (R1 check-register) Violations designed `failing_checks` named `Owner per alert` instead of an exact check name — validator rejection: "failing_checks names 'Owner per alert', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
2. (R1 check-register) Violations designed `failing_checks` named `Runbook link per alert` instead of an exact check name — validator rejection: "failing_checks names 'Runbook link per alert', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
3. (R1 check-register) Violations designed `failing_checks` named `Actionable per alert` instead of an exact check name — validator rejection: "failing_checks names 'Actionable per alert', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
4. (R1 check-register) Violations designed `failing_checks` named `Symptom-based per alert` instead of an exact check name — validator rejection: "failing_checks names 'Symptom-based per alert', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
5. (R1 check-register) Violations designed `failing_checks` named `Runbook content per failure mode` instead of an exact check name — validator rejection: "failing_checks names 'Runbook content per failure mode', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
6. (R1 check-register) Violations designed `failing_checks` named the input field path `paging_on_unactionable_causes_present` instead of an exact check name — validator rejection: "failing_checks names 'paging_on_unactionable_causes_present', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
7. (R1 check-register) Violations designed `failing_checks` named the input field path `unowned_alerts_present` instead of an exact check name — validator rejection: "failing_checks names 'unowned_alerts_present', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
8. (R1 check-register) Violations designed `failing_checks` named the input field path `monitoring_disabled_to_hide_problem_present` instead of an exact check name — validator rejection: "failing_checks names 'monitoring_disabled_to_hide_problem_present', which is not in the atom's check register (43 checks)". Corrected before execution as part of rebuilding the violations case (see item 13).
9. (R2 structured-spot-checks) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes) — validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (all computed fields of the full-pass oracle output except envelope/identity fields, including `computed_status` `within_stated_limits_on_declared_evidence`, `alerts_count` `1`, `failure_modes_count` `1` and all ten coverage values `"1.000000"`).
10. (R2 structured-spot-checks) Violations `expect` carried no structured `computed_spot_checks` — validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle for the rebuilt violations input (including `computed_status` `outside_stated_limits_on_declared_evidence`, `owner_coverage` `"0.000000"`, `runbook_link_coverage` `"0.000000"`, `symptom_based_coverage` `"0.000000"`, `check_steps_coverage` `"0.000000"`, `recovery_verification_coverage` `"0.000000"`).
11. (R3 violations-full-manifest) The raw violations input was sparse — it omitted the `signals`, `alert_design`, `incident` and `resilience` objects entirely — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): alert_design, alert_design.alert_noise_controls_present, alert_design.alert_set_symptom_based, alert_design.alert_thresholds_tuned_to_reality, incident, incident.acknowledge_step_defined, incident.blameless_postmortem_required, incident.blast_radius_assessment_step_defined, incident.fix_step_defined, incident.postmortem_actions_tracked_to_closure, incident.rollback_as_first_stabilize_option, incident.stabilize_step_defined, incident.status_communication_step_defined, resilience, resilience.backup_restores_tested, resilience.backup_schedule_declared, resilience.jobs_emit_success_heartbeats, resilience.restore_tested_at_least_once_per_season, resilience.unattended_jobs_have_health_signals, signals, signals.dashboards_present, signals.error_rate_signal_emitted, signals.health_signal_emitted, signals.latency_signal_emitted, signals.metrics_cover_errors, signals.metrics_cover_latency, signals.metrics_cover_requests, signals.metrics_cover_saturation, signals.structured_logs_with_correlation_ids, signals.traces_or_timings_at_every_edge". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes (see item 13).
12. (R4 malformed-exactly-one) The raw malformed input carried two documented type violations — validator rejection: "malformed input carries 2 type violations (signals must be a object, alerts must be a list); exactly one is required so the 422 field is unambiguous". Corrected before execution: the `alerts` key was removed, leaving exactly one violation (`signals` as a string where an object is required), so the expected 422 field is unambiguously `signals`.
13. (plant-adaptation) The violations case was rebuilt as a deep copy of the corrected full-pass manifest plus 8 planted mutations chosen from the check semantics in SERVICE.md — `signals.metrics_cover_errors` = false, `alerts[0].owner` = `""`, `alerts[0].runbook_linked` = false, `alerts[0].symptom_based` = false, `failure_modes[0].check_steps_present` = false, `failure_modes[0].recovery_verification_present` = false, `incident.blameless_postmortem_required` = false, `red_lines.unowned_alerts_present` = true — with `failing_checks` set to exactly the oracle's failing set for the mutated input (sorted): `blameless_postmortem_required`, `every_alert_has_owner`, `every_alert_is_symptom_based`, `every_alert_links_runbook`, `every_runbook_has_check_steps`, `every_runbook_has_recovery_verification`, `metrics_cover_errors`, `no_unowned_alerts`, and `expect.outcome` set to the oracle's verdict `OBSERVABILITY_DESIGN_NOT_SOUND`, with no missing checks.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 43 checks pass on it — no correction needed), and the sparse case was already an identity-only manifest (`{service_name}` only) as designed, so it was kept unchanged apart from the standard sparse expectation wording.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the fourteen primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/observability-and-runbook-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `alerts_count` | 1 | 1 | ✓ |
| full-pass `failure_modes_count` | 1 | 1 | ✓ |
| full-pass `owner_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `runbook_link_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `actionable_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `symptom_based_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `runbook_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `symptoms_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `check_steps_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `mitigation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `escalation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `recovery_verification_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass all row-name lists / `duplicate_alert_names` / `duplicate_failure_mode_names` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all fourteen computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `alerts_without_owner` (`high-error-rate` owner `""`) | ["high-error-rate"] | ["high-error-rate"] | ✓ |
| violations `owner_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `alerts_without_runbook_link` | ["high-error-rate"] | ["high-error-rate"] | ✓ |
| violations `runbook_link_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `alerts_without_symptom_basis` | ["high-error-rate"] | ["high-error-rate"] | ✓ |
| violations `symptom_based_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `actionable_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `failure_modes_without_check_steps` | ["db-connection-timeout"] | ["db-connection-timeout"] | ✓ |
| violations `check_steps_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `failure_modes_without_recovery_verification` | ["db-connection-timeout"] | ["db-connection-timeout"] | ✓ |
| violations `recovery_verification_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations remaining coverages (1 ÷ 1 each) | "1.000000" | "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 8 planted checks | same 8 | ✓ |
| verdicts | OBSERVABILITY_DESIGN_SOUND / OBSERVABILITY_DESIGN_NOT_SOUND (8 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 8-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `signals`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
