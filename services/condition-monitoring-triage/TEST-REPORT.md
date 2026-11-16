# Test report — condition-monitoring-triage

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
**Evidence:** `verification/work/condition-monitoring-triage/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid condition-monitoring manifest, reading 2.5 under watch limit 3.0 | HTTP 200, verdict `TRIAGE_SOUND`, 19/19 checks pass | HTTP 200, `TRIAGE_SOUND`, "19 pass, 0 fail, 0 missing of 19 checks across six sections", computed `highest_band: "normal"` (reading below its watch limit — correct) | PASS |
| 2 | violations — `post_repair_baseline_captured=false` after a declared repair, `alarm_closed_without_triage_note=true` | HTTP 200, verdict `TRIAGE_UNSOUND`, the baseline and escalation checks fail | HTTP 200, `TRIAGE_UNSOUND`, exactly those 2 checks fail (`post_repair_baseline_captured`, `no_alarm_closed_without_triage_note`); 15 pass, 2 missing (see note below) | PASS |
| 3 | sparse — only `asset` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 19 missing | PASS |
| 4 | malformed — `baseline: "NOT_A_BOOLEAN_OBJECT"` (string where an object is required) | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 19 missing) — the type-violating section was treated as missing evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `condition_monitoring_triage`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"condition-monitoring-triage","atom_version":"0.1.0","asset":"Motor-001","verdict":"TRIAGE_SOUND","sections":{"baseline":"pass","technique_coverage":"pass","context":"pass","trending":"pass","alert_bands_and_triage":"pass","escalation":"pass"},"checks":[{"section":"baseline","check":"baseline_exists","status":"pass","evidence":"quality gate: baselines exist for critical assets"},{"section":"baseline","check":"baseline_captured_under_known_load","status":"pass","evidence":"baseline as-installed, under known load"},{"section":"baseline","check":"post_repair_baseline_captured","status":"pass","evidence":"quality gate: post-repair baselines captured (verify the fix actually fixed it)"},{"section":"technique_coverage","check":"techniques_match_asset","status":"pass","evidence":"techniques by asset: vibration / thermography / ESA / DGA as the asset class requires"},{"section":"technique_coverage","check":"fixed_routes_and_points","status":"pass","evidence":"fixed routes; same points, same method"},{"section":"technique_coverage","check":"same_instrument_class","status":"pass","evidence":"same instrument class — comparability is the whole game"},{"section":"context","check":"load_recorded_with_readings","status":"pass","evidence":"quality gate: readings carry load context"},{"section":"context","check":"ambient_recorded","status":"pass","evidence":"quality gate: readings carry ambient context"},{"section":"context","check":"speed_recorded","status":"pass","evidence":"log speed with every reading"},{"section":"trending","check":"deltas_vs_baseline_computed","status":"pass","evidence":"deltas and rates-of-change beat absolute numbers"},{"section":"trending","check":"rate_of_change_considered","status":"pass","evidence":"trend + context: rates-of-change considered"},{"section":"trending","check":"repair_events_annotated","status":"pass","evidence":"annotate charts with repair events"},{"section":"alert_bands_and_triage","check":"bands_defined_per_standard_or_oem","status":"pass","evidence":"define watch/warning/action bands per site standard/OEM"},{"section":"alert_bands_and_triage","check":"readings_classified_against_bands","status":"pass","evidence":"every reading classified against its declared bands"},{"section":"alert_bands_and_triage","check":"action_band_readings_have_act_triage","status":"pass","evidence":"a reading at or beyond its action limit requires an act triage (work request)"},{"section":"alert_bands_and_triage","check":"alarms_fully_triaged","status":"pass","evidence":"every alarm triaged — noise / watch (recheck interval) / act (work request) — with reasoning recorded"},{"section":"escalation","check":"suspicious_findings_escalated_with_trend_pack","status":"pass","evidence":"suspicious findings go to the responsible engineer with the full trend pack, not a single number"},{"section":"escalation","check":"no_alarm_closed_without_triage_note","status":"pass","evidence":"skill red line: no alarm closes without a triage note"},{"section":"escalation","check":"no_condemn_or_clear_on_single_reading","status":"pass","evidence":"skill red line: never condemn or clear equipment on one reading without context"}],"highest_band":"normal","summary":"19 pass, 0 fail, 0 missing of 19 checks across six sections.","stamp":"CONDITION-MONITORING TRIAGE\nasset: Motor-001\nVERDICT: TRIAGE_SOUND\n  baseline               pass\n  technique_coverage     pass\n  context                pass\n  trending               pass\n  alert_bands_and_triage pass\n  escalation             pass\n19 pass, 0 fail, 0 missing of 19 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"condition-monitoring-triage","atom_version":"0.1.0","asset":"Motor-001","verdict":"INSUFFICIENT_EVIDENCE","sections":{"baseline":"insufficient_evidence","technique_coverage":"insufficient_evidence","context":"insufficient_evidence","trending":"insufficient_evidence","alert_bands_and_triage":"insufficient_evidence","escalation":"insufficient_evidence"},"checks":[{"section":"baseline","check":"baseline_exists","status":"missing","evidence":"quality gate: baselines exist for critical assets"},{"section":"baseline","check":"baseline_captured_under_known_load","status":"missing","evidence":"baseline as-installed, under known load"},{"section":"baseline","check":"post_repair_baseline_captured","status":"missing","evidence":"no repair since baseline declared"},{"section":"technique_coverage","check":"techniques_match_asset","status":"missing","evidence":"techniques by asset: vibration / thermography / ESA / DGA as the asset class requires"},{"section":"technique_coverage","check":"fixed_routes_and_points","status":"missing","evidence":"fixed routes; same points, same method"},{"section":"technique_coverage","check":"same_instrument_class","status":"missing","evidence":"same instrument class — comparability is the whole game"},{"section":"context","check":"load_recorded_with_readings","status":"missing","evidence":"quality gate: readings carry load context"},{"section":"context","check":"ambient_recorded","status":"missing","evidence":"quality gate: readings carry ambient context"},{"section":"context","check":"speed_recorded","status":"missing","evidence":"log speed with every reading"},{"section":"trending","check":"deltas_vs_baseline_computed","status":"missing","evidence":"deltas and rates-of-change beat absolute numbers"},{"section":"trending","check":"rate_of_change_considered","status":"missing","evidence":"trend + context: rates-of-change considered"},{"section":"trending","check":"repair_events_annotated","status":"missing","evidence":"annotate charts with repair events"},{"section":"alert_bands_and_triage","check":"bands_defined_per_standard_or_oem","status":"missing","evidence":"define watch/warning/action bands per site standard/OEM"},{"section":"alert_bands_and_triage","check":"readings_classified_against_bands","status":"missing","evidence":"no readings declared"},{"section":"alert_bands_and_triage","check":"action_band_readings_have_act_triage","status":"missing","evidence":"no readings declared"},{"section":"alert_bands_and_triage","check":"alarms_fully_triaged","status":"missing","evidence":"no alarm triage record declared"},{"section":"escalation","check":"suspicious_findings_escalated_with_trend_pack","status":"missing","evidence":"suspicious findings go to the responsible engineer with the full trend pack, not a single number"},{"section":"escalation","check":"no_alarm_closed_without_triage_note","status":"missing","evidence":"skill red line: no alarm closes without a triage note"},{"section":"escalation","check":"no_condemn_or_clear_on_single_reading","status":"missing","evidence":"skill red line: never condemn or clear equipment on one reading without context"}],"highest_band":null,"summary":"0 pass, 0 fail, 19 missing of 19 checks across six sections.","stamp":"CONDITION-MONITORING TRIAGE\nasset: Motor-001\nVERDICT: INSUFFICIENT_EVIDENCE\n  baseline               insufficient_evidence\n  technique_coverage     insufficient_evidence\n  context                insufficient_evidence\n  trending               insufficient_evidence\n  alert_bands_and_triage insufficient_evidence\n  escalation             insufficient_evidence\n0 pass, 0 fail, 19 missing of 19 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4 (malformed): `baseline` as a string where an object section is required. Expected (test doctrine for this
program + the gateway's `invalid_input` mechanism in `callpath.ts`):
HTTP 422 `{ok:false, error:"invalid_input", field:...}`. Actual:
HTTP 200 with a verdict computed over the garbage values. The atom's
handler does not validate manifest field types before evaluation.
Disposition: **fix spec filed** — `verification/fix-specs/condition-monitoring-triage.md`.
Retest on redeploy.

Case-design note (coordinator disposition, not an atom finding and
not a tester error against the contract): in case 2 the designed
input carries `readings: []` where the full-pass case carries one
reading, so the two reading-derived checks
(`readings_classified_against_bands`,
`action_band_readings_have_act_triage`) record `missing` rather than
`pass`. That follows from the designed input itself; the case's
expected outcome and both planted failing checks are exact, and
Gemini raised no finding on the case.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases, the computed `highest_band` is correct, determinism and MCP/REST parity hold; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment 7f9cae9fdd60417eb72062905a066554. Evidence: `verification/work/condition-monitoring-triage/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/condition-monitoring-triage/judgment.json` (Gemini verdict: PASS).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `TRIAGE_SOUND` | HTTP 200, verdict `TRIAGE_SOUND` | PASS |
| 2 | violations | HTTP 200, verdict `TRIAGE_UNSOUND` | HTTP 200, verdict `TRIAGE_UNSOUND` | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "baseline", "detail": "baseline must be an object"}` | PASS |
| 5 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| 6 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

F1 disposition: **F1 closed — malformed now returns 422 invalid_input (field: baseline)**. Raw malformed body: `{"ok": false, "error": "invalid_input", "field": "baseline", "detail": "baseline must be an object"}`. Wave 1 returned HTTP 200 with a verdict computed over the type-violating input; the retest evidence shows the recorded malformed case is now rejected before evaluation, and all other recorded cases (full-pass, violations, sparse, determinism, parity) pass both the Gemini judgment (verdict: PASS, findings: 0) and the mechanical checks (malformed status 422 with error == "invalid_input"; full-pass determinism_byte_identical == true and parity_structured_equal == true; full-pass/violations/sparse HTTP status and verdict match cases.json expect).

Tester errors this wave: none.

**Retest verdict: PASS**
