# Test report — fare-construction-savings-strategy

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/fare-construction-savings-strategy/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (trip `NYC-LON-2025`): trip JFK→LHR, all driver/strategy/integrity declarations true with the must-be-false flags false, headline 500 / fees 50 / baggage 20 / seat 30 with declared total 600, legs `Leg1` 300 / `Leg2` 250 with declared constructed total 550, baseline 600, declared savings 50 | HTTP 200, verdict `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY`, `computed_total_cost` `"600.000000"`, `computed_constructed_total` `"550.000000"`, `computed_savings` `"50.000000"`, all differences `"0.000000"`, `legs_evaluated` `2`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY`, 21 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `total_cost.declared_total_cost` 999, `construction.declared_savings` 100 | HTTP 200, verdict `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY`, the 2 named checks fail | HTTP 200, `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY`, 19 pass / 2 fail / 0 missing; failing checks exactly `total_cost_matches_headline_plus_fees_bags_seats`, `declared_savings_matches_baseline_minus_constructed_total`; `computed_total_cost` `"600.000000"`, `total_cost_difference` `"399.000000"`, `computed_constructed_total` `"550.000000"`, `constructed_total_difference` `"0.000000"`, `computed_savings` `"50.000000"`, `savings_difference` `"50.000000"`, `legs_evaluated` `2`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `total_cost_surface` and `fare_construction` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `trip_label` (`Minimal`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 21 missing, all six sections `insufficient_evidence`, `legs_evaluated` `0`, `computed_constructed_total` null, `constructed_total_difference` null, `computed_total_cost` null, `total_cost_difference` null, `computed_savings` null, `savings_difference` null, `computed_status` null | PASS |
| 4 | malformed — `total_cost.headline_fare: "should-be-a-number"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"total_cost.headline_fare","detail":"total_cost.headline_fare must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `fare_construction_savings_strategy`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 21 checks and a text stamp):

```json
{"service": "fare-construction-savings-strategy", "atom_version": "0.1.0", "trip_label": "NYC-LON-2025", "verdict": "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY", "sections": {"trip_definition": "pass", "fare_drivers_explained": "pass", "search_strategy": "pass", "total_cost_surface": "pass", "fare_construction": "pass", "price_integrity": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "legs_evaluated": 2, "computed_constructed_total": "550.000000", "constructed_total_difference": "0.000000", "computed_total_cost": "600.000000", "total_cost_difference": "0.000000", "computed_savings": "50.000000", "savings_difference": "0.000000", "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"total_cost.headline_fare","detail":"total_cost.headline_fare must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0. Corrections 4 and 5 below were design-time corrections made to meet the full-manifest and documented-field requirements precisely, beyond the validator's rejections. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-recomputed from the manifest (`computed_total_cost` `"600.000000"` — 500 + 50 + 20 + 30, `computed_constructed_total` `"550.000000"` — 300 + 250, `computed_savings` `"50.000000"` — 600 − 550, all differences `"0.000000"`, `legs_evaluated` `2`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. (R1) Violations `expect.failing_checks` listed section names (`total_cost_surface`, `fare_construction`) instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `total_cost_matches_headline_plus_fees_bags_seats`, `declared_savings_matches_baseline_minus_constructed_total`.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-recomputed (`computed_total_cost` `"600.000000"`, `total_cost_difference` `"399.000000"` — 999 − 600, `computed_constructed_total` `"550.000000"`, `constructed_total_difference` `"0.000000"`, `computed_savings` `"50.000000"`, `savings_difference` `"50.000000"` — 100 − 50, `legs_evaluated` `2`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input dropped the second construction leg (legs reduced from two entries to one, with `declared_constructed_total` changed to 300), so its savings failure was incidental to that structural change rather than a planted declared value; the validator did not reject it because the key-path union was unchanged. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 2 planted violations (`total_cost.declared_total_cost` 999, `construction.declared_savings` 100) and nothing else changed.
5. (R4) Malformed designed with `trip` as a string instead of an object — an object-type violation on a container whose documented typed fields are its subfields, making the expected 422 field less precise; the validator did not reject it (exactly one violation). Corrected before execution: changed to exactly one type violation of a documented typed field — `total_cost.headline_fare` as a string where a number is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types, all booleans and must-be-false flags correct, and the three computed sums matching their declared totals — no correction needed), and the sparse case was verified genuinely sparse (only `trip_label`) and needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the total-cost sum, the constructed-total leg sum, the declared-savings arithmetic, all differences and `legs_evaluated`, under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/fare-construction-savings-strategy/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_total_cost` (500 + 50 + 20 + 30) | "600.000000" | "600.000000" | ✓ |
| full-pass `total_cost_difference` (600 − 600) | "0.000000" | "0.000000" | ✓ |
| full-pass `computed_constructed_total` (300 + 250) / `legs_evaluated` | "550.000000" / 2 | "550.000000" / 2 | ✓ |
| full-pass `constructed_total_difference` (550 − 550) | "0.000000" | "0.000000" | ✓ |
| full-pass `computed_savings` (600 − 550) | "50.000000" | "50.000000" | ✓ |
| full-pass `savings_difference` (50 − 50) | "0.000000" | "0.000000" | ✓ |
| full-pass `computed_status` (all computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `computed_total_cost` / `total_cost_difference` (999 − 600) | "600.000000" / "399.000000" | "600.000000" / "399.000000" | ✓ |
| violations `computed_constructed_total` / `constructed_total_difference` | "550.000000" / "0.000000" | "550.000000" / "0.000000" | ✓ |
| violations `computed_savings` / `savings_difference` (100 − 50) | "50.000000" / "50.000000" | "50.000000" / "50.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY / FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `total_cost.headline_fare`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
