# Test report — distribution-equipment-rating-condition-check

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
**Evidence:** `verification/work/distribution-equipment-rating-condition-check/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest; CB-01 interrupting 50 kA vs fault 40 kA, TX-01 load 800/1000 kVA (corrected case, see tester-error note) | HTTP 200, verdict `RATING_CONDITION_SOUND`, 27/27 checks pass, `rating_status=within_declared_ratings` | HTTP 200, `RATING_CONDITION_SOUND`, "27 pass, 0 fail, 0 missing of 27 checks across six sections", `rating_status` `within_declared_ratings`, stamp present and well-formed | PASS |
| 2 | violations — CB-FAIL interrupting 10 kA < fault 20 kA, continuous 100 A < load 150 A | HTTP 200, verdict `RATING_CONDITION_UNSOUND`, the 2 computed rating checks fail, `rating_status=exceeded` | HTTP 200, `RATING_CONDITION_UNSOUND`, exactly those 2 checks fail (22 pass, 2 fail, 3 missing — the case's empty `transformers[]` leaves the 3 transformer checks missing; the verdict is driven by the 2 fails as expected), `rating_status` `exceeded` | PASS |
| 3 | sparse — only `lineup` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 27 missing, `rating_status` null | PASS |
| 4 | malformed — `ratings: "invalid_string_instead_of_object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 27 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `distribution_equipment_rating_condition_check`) | PASS |

**Tester error (corrected, not an atom failure):** Gemini's first design
nested the equipment list under `ratings.equipment`; SERVICE.md documents
`equipment[]` as a top-level list. On the first run the full-pass case
therefore returned `INSUFFICIENT_EVIDENCE` (25 pass, 2 missing — the two
computed rating checks) and the violations case also returned
`INSUFFICIENT_EVIDENCE`, and Gemini's first judgment recorded both as
atom findings. Verification against SERVICE.md showed the case
contradicted the contract: `equipment` was moved to the top level, the
harness and judge were re-run, and the atom returned
`RATING_CONDITION_SOUND` 27/27 on full-pass and
`RATING_CONDITION_UNSOUND` with exactly the 2 computed rating checks
failing on violations. The original findings are dispositioned as
tester errors and are not counted against the atom. Computed spot
checks verified from the corrected evidence: CB-01 margin 50 − 40 =
10 kA; TX-01 load 800/1000 = 80% of nameplate.

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"distribution-equipment-rating-condition-check","atom_version":"0.1.0","lineup":"Main-Distribution-A","verdict":"RATING_CONDITION_SOUND","sections":{"ratings_vs_fault_study":"pass","mcc_specifics":"pass","switchgear_specifics":"pass","transformers":"pass","condition_awareness":"pass","coordination_and_safety":"pass"},"checks":[{"section":"ratings_vs_fault_study","check":"ratings_verified_vs_current_fault_study","status":"pass","evidence":"quality gate: ratings verified vs current fault study \u2014 voltage class, continuous current, interrupting rating, bus bracing \u2014 from a current short-circuit study, not memory"},{"section":"ratings_vs_fault_study","check":"rating_gaps_documented","status":"pass","evidence":"rating gaps against the fault study are documented"},{"section":"ratings_vs_fault_study","check":"interrupting_rating_covers_fault_current","status":"pass","evidence":"interrupting rating vs available fault current, from the current short-circuit study"},{"section":"ratings_vs_fault_study","check":"continuous_current_rating_covers_load","status":"pass","evidence":"continuous current rating covers the declared load current"},{"section":"mcc_specifics","check":"section_bus_rating_verified","status":"pass","evidence":"MCC section/bus rating verified"},{"section":"mcc_specifics","check":"starter_types_recorded","status":"pass","evidence":"starter types recorded (DOL/soft/VFD buckets)"},{"section":"mcc_specifics","check":"segregation_and_barriers_verified","status":"pass","evidence":"segregation and barriers verified"},{"section":"mcc_specifics","check":"heat_load_assessed","status":"pass","evidence":"heat load assessed"},{"section":"mcc_specifics","check":"planned_spare_capacity_recorded","status":"pass","evidence":"planned spare capacity recorded"},{"section":"mcc_specifics","check":"labeling_matches_lineup_drawing","status":"pass","evidence":"labeling matches the line-up drawing"},{"section":"switchgear_specifics","check":"breaker_relay_schemes_verified","status":"pass","evidence":"breaker/relay schemes verified"},{"section":"switchgear_specifics","check":"ct_ratios_and_wiring_checked","status":"pass","evidence":"CT ratios + wiring checks done"},{"section":"switchgear_specifics","check":"trip_tests_per_plan","status":"pass","evidence":"trip tests (primary/secondary injection per plan) done"},{"section":"switchgear_specifics","check":"interlock_function_tests_done","status":"pass","evidence":"interlock function tests done"},{"section":"switchgear_specifics","check":"torque_checks_per_oem","status":"pass","evidence":"torque checks per OEM \u2014 skill red line: no torque specs from memory; OEM procedures only"},{"section":"transformers","check":"transformer_loading_within_nameplate","status":"pass","evidence":"loading per nameplate \u2014 load does not exceed the nameplate rating"},{"section":"transformers","check":"transformer_temperatures_within_declared_limits","status":"pass","evidence":"top-oil and winding temperatures within the declared limits, with temperature context"},{"section":"transformers","check":"paralleling_requirements_match","status":"pass","evidence":"paralleling requires matching vector group/ratio/impedance \u2014 verify, never assume"},{"section":"transformers","check":"tap_positions_recorded","status":"pass","evidence":"quality gate: tap position recorded"},{"section":"transformers","check":"k_factor_assessed_for_harmonic_loads","status":"pass","evidence":"no harmonic-rich load declared"},{"section":"condition_awareness","check":"oil_dga_screening_on_schedule","status":"pass","evidence":"transformer oil/DGA screening on schedule"},{"section":"condition_awareness","check":"ir_scans_of_terminations_and_bus_done","status":"pass","evidence":"IR scans of terminations/bus done"},{"section":"condition_awareness","check":"audible_corona_observations_logged_vs_baseline","status":"pass","evidence":"audible/corona observations logged vs baseline"},{"section":"coordination_and_safety","check":"settings_labels_and_study_aligned","status":"pass","evidence":"quality gate: labels, settings, and drawings consistent \u2014 keep settings, labels, and the study aligned"},{"section":"coordination_and_safety","check":"study_refresh_flagged_when_equipment_changes","status":"pass","evidence":"no equipment change declared"},{"section":"coordination_and_safety","check":"test_records_complete_with_calibration","status":"pass","evidence":"quality gate: test/inspection records complete with instruments + calibration; records archived"},{"section":"coordination_and_safety","check":"no_energized_work_outside_permit_system","status":"pass","evidence":"skill red line: no energized work outside the site permit/PPE system"}],"rating_status":"within_declared_ratings","summary":"27 pass, 0 fail, 0 missing of 27 checks across six sections.","stamp":"DISTRIBUTION EQUIPMENT RATING CONDITION CHECK\nlineup: Main-Distribution-A\nVERDICT: RATING_CONDITION_SOUND\n  ratings_vs_fault_study   pass\n  mcc_specifics            pass\n  switchgear_specifics     pass\n  transformers             pass\n  condition_awareness      pass\n  coordination_and_safety  pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"distribution-equipment-rating-condition-check","atom_version":"0.1.0","lineup":"Malformed-Input","verdict":"INSUFFICIENT_EVIDENCE","sections":{"ratings_vs_fault_study":"insufficient_evidence","mcc_specifics":"insufficient_evidence","switchgear_specifics":"insufficient_evidence","transformers":"insufficient_evidence","condition_awareness":"insufficient_evidence","coordination_and_safety":"insufficient_evidence"},"rating_status":null,"summary":"0 pass, 0 fail, 27 missing of 27 checks across six sections.","stamp":"DISTRIBUTION EQUIPMENT RATING CONDITION CHECK\nlineup: Malformed-Input\nVERDICT: INSUFFICIENT_EVIDENCE\n  ratings_vs_fault_study   insufficient_evidence\n  mcc_specifics            insufficient_evidence\n  switchgear_specifics     insufficient_evidence\n  transformers             insufficient_evidence\n  condition_awareness      insufficient_evidence\n  coordination_and_safety  insufficient_evidence\n0 pass, 0 fail, 27 missing of 27 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `ratings` as a string instead of an object. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`INSUFFICIENT_EVIDENCE` verdict computed over the garbage values (the string `ratings` section was treated as absent evidence).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/distribution-equipment-rating-condition-check.md`. Retest on redeploy.

## Final verdict

**FAIL** — core verdict and computed-rating logic is exact on all three verdict cases (after the tester-error correction above), determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

**Gateway/deployment:** atoms-gateway v1.1.0 at https://atoms.pipavia.com (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`, retested 2026-11-15. Evidence: `verification/work/distribution-equipment-rating-condition-check/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/distribution-equipment-rating-condition-check/judgment.json` (Gemini verdict: PASS, 0 findings, 0 tester errors).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `RATING_CONDITION_SOUND` | HTTP 200, verdict `RATING_CONDITION_SOUND`, "27 pass, 0 fail, 0 missing of 27 checks across six sections." | PASS |
| 2 | violations | HTTP 200, verdict `RATING_CONDITION_UNSOUND` | HTTP 200, verdict `RATING_CONDITION_UNSOUND`, "22 pass, 2 fail, 3 missing of 27 checks across six sections." | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, "0 pass, 0 fail, 27 missing of 27 checks across six sections." | PASS |
| 4 | malformed | HTTP 422, `{ok:false, error:"invalid_input"}`, no verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"ratings","detail":"ratings must be an object"}` | PASS |
| 5 | determinism | byte-identical responses on repeat REST submission of full-pass | byte-identical: **true** | PASS |
| 6 | parity | MCP `tools/call` structuredContent deep-equal to REST artifact for full-pass | structuredContent deep-equal: **true** (tool name `distribution_equipment_rating_condition_check`) | PASS |

F1 closed — malformed now returns 422 invalid_input (field: ratings). Raw malformed response: `{"ok":false,"error":"invalid_input","field":"ratings","detail":"ratings must be an object"}`. This replaces the Wave 1 behaviour, in which the same type-violating manifest returned HTTP 200 with a verdict computed over the garbage values. Mechanical verification confirms the malformed first execution is HTTP 422 with a JSON body whose `error` is `"invalid_input"`, and that the full-pass, violations and sparse first executions match the HTTP status and verdict recorded in `cases.json` expect, with `determinism_byte_identical == true` and `parity_structured_equal == true` on the full-pass case.

Tester errors this wave: none. Gemini returned PASS with no findings and no tester errors, and no Gemini finding contradicted the atom's contract.yaml / SERVICE.md; mechanical evidence and Gemini's judgment agree on every case.

**Retest verdict: PASS**
