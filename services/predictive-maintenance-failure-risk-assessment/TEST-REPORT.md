# Test report — predictive-maintenance-failure-risk-assessment

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/predictive-maintenance-failure-risk-assessment/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all 24 boolean evidence fields true | HTTP 200, verdict `ASSESSMENT_SOUND`, 24/24 checks pass | HTTP 200, `ASSESSMENT_SOUND`, "24 pass, 0 fail, 0 missing of 24 checks across six sections" | PASS |
| 2 | violations — `strategy.matched_to_criticality_and_failure_cost=false`, `pf_curve.detection_early_in_window=false` | HTTP 200, verdict `ASSESSMENT_UNSOUND`, those 2 checks fail | HTTP 200, `ASSESSMENT_UNSOUND`, exactly those 2 checks fail (22 pass, 2 fail, 0 missing) | PASS |
| 3 | sparse — only `asset` + one strategy field | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 23 missing | PASS |
| 4 | malformed — `asset: 12345`, `strategy: "invalid_string_instead_of_object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 24 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `predictive_maintenance_failure_risk_assessment`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed to the first
section — the full response carries all 24 checks and a text stamp):

```json
{"service":"predictive-maintenance-failure-risk-assessment","atom_version":"0.1.0","asset":"Turbine-01","verdict":"ASSESSMENT_SOUND","sections":{"strategy_fit":"pass","pf_window":"pass","condition_monitoring":"pass","prediction":"pass","reliability_frame":"pass","data_and_integration":"pass"},"checks":[{"section":"strategy_fit","check":"asset_criticality_assessed","status":"pass","evidence":"match strategy to asset criticality and failure cost — not everything deserves PdM"},{"section":"strategy_fit","check":"failure_cost_assessed","status":"pass","evidence":"the cost of failure is assessed before a strategy is chosen"},{"section":"strategy_fit","check":"strategy_matched_to_criticality_and_failure_cost","status":"pass","evidence":"reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets"},{"section":"strategy_fit","check":"pdm_justified_for_this_asset","status":"pass","evidence":"PdM on assets that don't justify it is refused"}],"summary":"24 pass, 0 fail, 0 missing of 24 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"predictive-maintenance-failure-risk-assessment","atom_version":"0.1.0","asset":12345,"verdict":"INSUFFICIENT_EVIDENCE","sections":{"strategy_fit":"insufficient_evidence","pf_window":"insufficient_evidence","condition_monitoring":"insufficient_evidence","prediction":"insufficient_evidence","reliability_frame":"insufficient_evidence","data_and_integration":"insufficient_evidence"},"summary":"0 pass, 0 fail, 24 missing of 24 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `asset` as a number, `strategy` as a string. Expected
(test doctrine for this program + the gateway's `invalid_input`
mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage values
(`asset` echoed back as `12345`). The atom's handler does not validate
manifest field types before evaluation. Disposition: **fix spec filed**
— `verification/fix-specs/predictive-maintenance-failure-risk-assessment.md`.
Retest on redeploy.

No tester errors in this atom's run. Gemini's judgment was verified
against the raw evidence and matches it on every case.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold; the single defect is F1
(malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com — gateway version 1.1.0 (health HTTP 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run via verification/harness.py against the live gateway; judged by verification/gemini_judge.py (Gemini verdict: PASS) and mechanically verified from the new evidence.json. Mechanical evidence governs over Gemini where they conflict; no conflict occurred for this atom.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | 200 ASSESSMENT_SOUND | 200 ASSESSMENT_SOUND | PASS |
| 2 | violations | 200 ASSESSMENT_UNSOUND | 200 ASSESSMENT_UNSOUND | PASS |
| 3 | sparse | 200 INSUFFICIENT_EVIDENCE | 200 INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | 422 invalid_input | 422 invalid_input (field: asset) | PASS |
| 5 | determinism | byte-identical repeat | determinism_byte_identical=True | PASS |
| 6 | parity | MCP structuredContent == REST | parity_structured_equal=True | PASS |

F1 closed — malformed now returns 422 invalid_input (field: asset). Raw malformed body: `{"ok":false,"error":"invalid_input","field":"asset","detail":"asset must be a string"}`. Wave 1 returned HTTP 200 with a verdict computed over the type-violating input; the retest evidence shows the gateway now rejects it before evaluation, and all other cases are unchanged in outcome.

Tester errors this wave: none. Gemini findings: 0.

**Retest verdict: PASS**
