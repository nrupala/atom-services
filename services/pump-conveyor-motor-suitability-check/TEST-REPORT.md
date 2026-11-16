# Test report — pump-conveyor-motor-suitability-check

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition.
**Second tester:** DeepSeek (independent recomputation — see its section
below).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/pump-conveyor-motor-suitability-check/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — pump drive rated 15 kW vs 10 kW required, NPSH 5 m vs 3 m, all evidence true | HTTP 200, verdict `SUITABLE`, 26/26 checks pass, `min_power_margin_kw=5.0000`, `min_npsh_margin_m=2.0000` | HTTP 200, `SUITABLE`, "26 pass, 0 fail, 0 missing", margins 5.0000 / 2.0000 as expected | PASS |
| 2 | violations — required power 20 kW > rated 15 kW, NPSH available 2 m < required 3 m, operating flow 70 < minimum 80 | HTTP 200, verdict `NOT_SUITABLE`, motor-sizing and pump checks fail | HTTP 200, `NOT_SUITABLE`, exactly the 3 computed checks fail (`motor_power_covers_required_power`, `npsh_available_covers_required`, `operating_flow_covers_minimum_flow`); 23 pass, 3 fail | PASS |
| 3 | sparse — only `asset` + `equipment_kind` and partial duty | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 6 pass / 0 fail / 20 missing | PASS |
| 4 | malformed — `equipment_kind: 123`, `duty: "invalid_string_instead_of_object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 26 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `pump_conveyor_motor_suitability_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full
response carries all 26 checks and a text stamp):

```json
{"service":"pump-conveyor-motor-suitability-check","atom_version":"0.1.0","asset":"PUMP-001","verdict":"SUITABLE","sections":{"load_and_operating_point":"pass","motor_sizing":"pass","pump_checks":"pass","conveyor_checks":"pass","baselines":"pass","interface_and_protection":"pass"},"suitability_status":"suitable_on_declared_values","min_power_margin_kw":"5.0000","min_running_torque_margin_nm":"10.0000","min_npsh_margin_m":"2.0000","min_starting_torque_margin_nm":null,"summary":"26 pass, 0 fail, 0 missing of 26 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"pump-conveyor-motor-suitability-check","atom_version":"0.1.0","asset":"ERR-001","verdict":"INSUFFICIENT_EVIDENCE","sections":{"load_and_operating_point":"insufficient_evidence","motor_sizing":"insufficient_evidence","pump_checks":"insufficient_evidence","conveyor_checks":"insufficient_evidence","baselines":"insufficient_evidence","interface_and_protection":"insufficient_evidence"},"summary":"0 pass, 0 fail, 26 missing of 26 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `equipment_kind` as a number, `duty` as a string.
Expected (test doctrine for this program + the gateway's
`invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage values.
The atom's handler does not validate manifest field types before
evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/pump-conveyor-motor-suitability-check.md`.
Retest on redeploy.

No tester errors in this atom's run. Gemini's judgment was verified
against the raw evidence and matches it on every case (its
computed spot checks — power margin 5.0000, NPSH margin 2.0000 —
match the recorded artifact).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (rated-minus-required power / running torque /
NPSH margins per drive, and the suitability status) and verified the
artifact's numbers and verdicts. Raw output:
`verification/work/pump-conveyor-motor-suitability-check/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single finding (malformed input
returns HTTP 200 with a verdict instead of HTTP 422).

Its computed checks (all match):

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `min_power_margin_kw` | 5.0000 | 5.0000 | ✓ |
| full-pass `min_running_torque_margin_nm` | 10.0000 | 10.0000 | ✓ |
| full-pass `min_npsh_margin_m` | 2.0000 | 2.0000 | ✓ |
| full-pass `min_starting_torque_margin_nm` | null (pump drive — not applicable) | null | ✓ |
| full-pass `suitability_status` | suitable_on_declared_values | suitable_on_declared_values | ✓ |
| violations `min_power_margin_kw` | −5.0000 | −5.0000 | ✓ |
| violations `min_running_torque_margin_nm` | 10.0000 | 10.0000 | ✓ |
| violations `min_npsh_margin_m` | −1.0000 | −1.0000 | ✓ |
| violations `suitability_status` | not_suitable_on_declared_values | not_suitable_on_declared_values | ✓ |

**Agreement:** full. DeepSeek and Gemini agree on the verdict, on the
single finding, and on every recomputed margin. No disagreement to
disposition.

## Final verdict

**FAIL** — verdict logic and every computed margin are exact on the
valid cases (confirmed by two independent testers), determinism and
MCP/REST parity hold; the single defect is F1 (malformed-input
handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `SUITABLE`, min_power_margin_kw = 5.0000, min_npsh_margin_m = 2.0000 | HTTP 200, verdict `SUITABLE`, margins power 5.0000 / running torque 10.0000 / NPSH 2.0000 / starting null | PASS |
| 2 | violations | HTTP 200, verdict `NOT_SUITABLE`, failing sections motor_sizing + pump_checks | HTTP 200, verdict `NOT_SUITABLE`, sections motor_sizing = fail, pump_checks = fail (3 failing checks), margins −5.0000 / 10.0000 / −1.0000 | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, suitability_status null, margins null | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (equipment_kind / duty type violations) | HTTP 422, `{ok:false, error:"invalid_input", field:"equipment_kind"}` — no verdict artifact | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **CLOSED**. Wave 1: `equipment_kind: 123` + `duty` as a string returned HTTP 200 with an `INSUFFICIENT_EVIDENCE` verdict. Retest: the same malformed case returns HTTP 422 `{ok:false, error:"invalid_input", field:"equipment_kind"}` ("equipment_kind must be a string") and no verdict is produced. Mechanical check of the new evidence: malformed status == 422 and body error == "invalid_input" — confirmed. Verdict logic and margins on the valid cases are unchanged and exact.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/pump-conveyor-motor-suitability-check/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 9 computed checks match.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass min_power_margin_kw | 5.0000 (15.0−10.0) | 5.0000 | ✓ |
| full-pass min_running_torque_margin_nm | 10.0000 (60.0−50.0) | 10.0000 | ✓ |
| full-pass min_npsh_margin_m | 2.0000 (5.0−3.0) | 2.0000 | ✓ |
| violations min_power_margin_kw | −5.0000 (15.0−20.0) | −5.0000 | ✓ |
| violations min_npsh_margin_m | −1.0000 (2.0−3.0) | −1.0000 | ✓ |
| violations failing check count | 3 (power, NPSH, flow) | 3 | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
