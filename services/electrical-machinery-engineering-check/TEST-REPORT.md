# Test report — electrical-machinery-engineering-check

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
**Evidence:** `verification/work/electrical-machinery-engineering-check/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete machinery manifest; torque/power/current ratios 0.5 (corrected case, see tester-error note) | HTTP 200, verdict `SOUND`, 38/38 checks pass | HTTP 200, `SOUND`, "38 pass, 0 fail, 0 missing of 38 checks across seven sections", stamp present and well-formed | PASS |
| 2 | violations — worst-case torque 150 Nm > rated 100 Nm; re-energized after anomaly without review = true | HTTP 200, verdict `NOT_SOUND`, the torque and re-energize checks fail | HTTP 200, `NOT_SOUND`, exactly those 2 checks fail (36 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — only `machine` + `duty.load_torque_profile` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 37 missing | PASS |
| 4 | malformed — `duty: "invalid_string_instead_of_object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 38 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `electrical_machinery_engineering_check`) | PASS |

**Tester error (corrected, not an atom failure):** Gemini's first design
wrote the failure-analysis fields with double-prefixed keys inside the
`failure` object (`"failure.investigation_open"` etc.); SERVICE.md
documents bare keys under `failure` (`failure.investigation_open` is the
dotted path, not a key name). On the first run the full-pass case
therefore returned `INSUFFICIENT_EVIDENCE` (35 pass, 3 missing — the
three gated failure-analysis checks). Gemini's first judgment also
missed that miss entirely: it flagged only the malformed case and its
notes claimed the SOUND/NOT_SOUND handling was correct, which the raw
first-run evidence contradicts. The keys were corrected, the harness
and judge were re-run, and the atom returned `SOUND` 38/38 on full-pass
and `NOT_SOUND` with exactly the 2 designed fails on violations. The
first-run full-pass miss is dispositioned as a tester error (with
Gemini's initial misread noted), not an atom failure. Computed spot
checks verified: torque ratio 50/100 = 0.5, power ratio 10/20 = 0.5,
current ratio 50/100 = 0.5.

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"electrical-machinery-engineering-check","atom_version":"0.1.0","machine":"Motor-001","verdict":"SOUND","sections":{"duty":"pass","sizing":"pass","specification":"pass","acceptance_tests":"pass","failure_analysis":"pass","trending":"pass","records_and_safety":"pass"},"checks":[{"section":"duty","check":"load_torque_profile_named","status":"pass","evidence":"duty first: the load torque profile is one of constant / variable / impact"},{"section":"duty","check":"starts_per_hour_declared","status":"pass","evidence":"starts per hour declared \u2014 duty drives selection, not habit"},{"section":"duty","check":"ambient_declared","status":"pass","evidence":"ambient temperature declared as a duty input"},{"section":"duty","check":"altitude_declared","status":"pass","evidence":"altitude declared as a duty input"},{"section":"duty","check":"worst_case_identified","status":"pass","evidence":"the worst case the sizing must survive is identified"},{"section":"sizing","check":"worst_case_torque_within_rating","status":"pass","evidence":"quality gate: worst-case torque documented against the selected rating \u2014 the declared worst case must not exceed the declared rating"},{"section":"sizing","check":"worst_case_power_within_rating","status":"pass","evidence":"torque and power at worst case: the declared worst-case power must not exceed the declared rated power"},{"section":"sizing","check":"service_factor_declared","status":"pass","evidence":"frame / service-factor margin: the service factor is declared"},{"section":"sizing","check":"starting_current_within_supply_capability","status":"pass","evidence":"starting current vs supply capability: the declared starting current must not exceed the declared supply capability"},{"section":"sizing","check":"efficiency_at_actual_load_recorded","status":"pass","evidence":"efficiency at actual load (not nameplate) is recorded"},{"section":"specification","check":"machine_type_named","status":"pass","evidence":"machine type is one of induction / synchronous"},{"section":"specification","check":"insulation_class_named","status":"pass","evidence":"insulation class is named \u2014 a vague spec is rejected"},{"section":"specification","check":"enclosure_named","status":"pass","evidence":"enclosure is one of TEFC / ODP / WPI"},{"section":"specification","check":"bearings_specified","status":"pass","evidence":"bearings are specified"},{"section":"specification","check":"space_heaters_specified","status":"pass","evidence":"space heaters are specified"},{"section":"specification","check":"rtds_specified","status":"pass","evidence":"RTDs are specified"},{"section":"specification","check":"vibration_limits_specified","status":"pass","evidence":"vibration limits are specified"},{"section":"specification","check":"standards_cited","status":"pass","evidence":"quality gate: the spec cites standards"},{"section":"acceptance_tests","check":"criteria_defined_before_tests","status":"pass","evidence":"quality gate: test acceptance criteria defined before tests"},{"section":"acceptance_tests","check":"criteria_from_standards_and_oem","status":"pass","evidence":"acceptance criteria come FROM standards and OEM \u2014 the atom applies no threshold of its own"},{"section":"acceptance_tests","check":"insulation_resistance_tested","status":"pass","evidence":"insulation resistance tested"},{"section":"acceptance_tests","check":"pi_dar_trends_recorded","status":"pass","evidence":"insulation resistance recorded with PI / DAR trends"},{"section":"acceptance_tests","check":"winding_resistance_balance_checked","status":"pass","evidence":"winding resistance balance checked (the skill states no numeric balance tolerance, so the check is declared, not re-graded)"},{"section":"acceptance_tests","check":"surge_comparison_done","status":"pass","evidence":"surge comparison done"},{"section":"acceptance_tests","check":"no_load_and_load_runs_done","status":"pass","evidence":"no-load and load runs done"},{"section":"acceptance_tests","check":"results_recorded_with_units","status":"pass","evidence":"quality gate: results recorded with units"},{"section":"acceptance_tests","check":"instruments_and_calibration_recorded","status":"pass","evidence":"results recorded with instruments + calibration status"},{"section":"failure_analysis","check":"evidence_organized_into_timeline","status":"pass","evidence":"no failure investigation declared open"},{"section":"failure_analysis","check":"operating_history_included","status":"pass","evidence":"no failure investigation declared open"},{"section":"failure_analysis","check":"typical_failure_modes_considered","status":"pass","evidence":"no failure investigation declared open"},{"section":"trending","check":"per_asset_baseline_exists","status":"pass","evidence":"per-asset baselines kept"},{"section":"trending","check":"like_for_like_comparison","status":"pass","evidence":"compare like-for-like: same test, same conditions"},{"section":"trending","check":"deltas_compared","status":"pass","evidence":"deltas mean more than absolute values \u2014 deltas are compared"},{"section":"records_and_safety","check":"nameplate_and_serial_verified","status":"pass","evidence":"red line: nameplate / serial verified against documents \u2014 never assumed"},{"section":"records_and_safety","check":"no_reenergize_after_anomaly_without_review","status":"pass","evidence":"red line: never re-energize after insulation or winding anomalies without engineering review"},{"section":"records_and_safety","check":"anomalies_flagged","status":"pass","evidence":"quality gate: anomalies flagged"},{"section":"records_and_safety","check":"asset_records_updated","status":"pass","evidence":"quality gate: asset records updated"},{"section":"records_and_safety","check":"deviations_logged_with_actions","status":"pass","evidence":"quality gate: deviations logged with actions"}],"summary":"38 pass, 0 fail, 0 missing of 38 checks across seven sections.","stamp":"ELECTRICAL-MACHINERY ENGINEERING CHECK\nmachine: Motor-001\nVERDICT: SOUND\n  duty                 pass\n  sizing               pass\n  specification        pass\n  acceptance_tests     pass\n  failure_analysis     pass\n  trending             pass\n  records_and_safety   pass\n38 pass, 0 fail, 0 missing of 38 checks across seven sections."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"electrical-machinery-engineering-check","atom_version":"0.1.0","machine":"Motor-004","verdict":"INSUFFICIENT_EVIDENCE","sections":{"duty":"insufficient_evidence","sizing":"insufficient_evidence","specification":"insufficient_evidence","acceptance_tests":"insufficient_evidence","failure_analysis":"insufficient_evidence","trending":"insufficient_evidence","records_and_safety":"insufficient_evidence"},"summary":"0 pass, 0 fail, 38 missing of 38 checks across seven sections.","stamp":"ELECTRICAL-MACHINERY ENGINEERING CHECK\nmachine: Motor-004\nVERDICT: INSUFFICIENT_EVIDENCE\n  duty                 insufficient_evidence\n  sizing               insufficient_evidence\n  specification        insufficient_evidence\n  acceptance_tests     insufficient_evidence\n  failure_analysis     insufficient_evidence\n  trending             insufficient_evidence\n  records_and_safety   insufficient_evidence\n0 pass, 0 fail, 38 missing of 38 checks across seven sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `duty` as a string instead of an object. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`INSUFFICIENT_EVIDENCE` verdict computed over the garbage values (the string `duty` section was treated as absent evidence).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/electrical-machinery-engineering-check.md`. Retest on redeploy.

## Final verdict

**FAIL** — core verdict and computed sizing logic is exact on all three verdict cases (after the tester-error correction above), determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

**Gateway/deployment:** atoms-gateway v1.1.0 at https://atoms.pipavia.com (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`, retested 2026-11-15. Evidence: `verification/work/electrical-machinery-engineering-check/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/electrical-machinery-engineering-check/judgment.json` (Gemini verdict: PASS, 0 findings, 0 tester errors).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `SOUND` | HTTP 200, verdict `SOUND`, "38 pass, 0 fail, 0 missing of 38 checks across seven sections." | PASS |
| 2 | violations | HTTP 200, verdict `NOT_SOUND` | HTTP 200, verdict `NOT_SOUND`, "36 pass, 2 fail, 0 missing of 38 checks across seven sections." | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, "1 pass, 0 fail, 37 missing of 38 checks across seven sections." | PASS |
| 4 | malformed | HTTP 422, `{ok:false, error:"invalid_input"}`, no verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"duty","detail":"duty must be an object"}` | PASS |
| 5 | determinism | byte-identical responses on repeat REST submission of full-pass | byte-identical: **true** | PASS |
| 6 | parity | MCP `tools/call` structuredContent deep-equal to REST artifact for full-pass | structuredContent deep-equal: **true** (tool name `electrical_machinery_engineering_check`) | PASS |

F1 closed — malformed now returns 422 invalid_input (field: duty). Raw malformed response: `{"ok":false,"error":"invalid_input","field":"duty","detail":"duty must be an object"}`. This replaces the Wave 1 behaviour, in which the same type-violating manifest returned HTTP 200 with a verdict computed over the garbage values. Mechanical verification confirms the malformed first execution is HTTP 422 with a JSON body whose `error` is `"invalid_input"`, and that the full-pass, violations and sparse first executions match the HTTP status and verdict recorded in `cases.json` expect, with `determinism_byte_identical == true` and `parity_structured_equal == true` on the full-pass case.

Tester errors this wave: none. Gemini returned PASS with no findings and no tester errors, and no Gemini finding contradicted the atom's contract.yaml / SERVICE.md; mechanical evidence and Gemini's judgment agree on every case.

**Retest verdict: PASS**
