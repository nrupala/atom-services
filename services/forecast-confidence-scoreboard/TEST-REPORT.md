# Test report — forecast-confidence-scoreboard

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/forecast-confidence-scoreboard/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (subject `Q1 2024 Revenue`): Alice (prob 0.8, outcome 1) and Bob (prob 0.4, outcome 1), scoreboard rows with correct counts, means, hit rates, gaps, Brier scores and Brier-order ranks, all reporting/honesty declarations true except the two must-be-false flags false | HTTP 200, verdict `CONFIDENCE_SCOREBOARD_SOUND`, `forecasts_count` `2`, `forecasters_count` `2`, `overall_mean_stated_probability` `"0.600000"`, `overall_hit_rate` `"1.000000"`, `overall_calibration_gap` `"0.400000"`, `overall_brier_score` `"0.200000"`, `calibration_direction` `underconfident`, `worst_calibrated_forecaster` `Bob`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CONFIDENCE_SCOREBOARD_SOUND`, 26 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — manifest with same key paths as full-pass, Alice only, scoreboard claiming `forecasts_count` 99 for Alice while the ledger contains 1 | HTTP 200, verdict `CONFIDENCE_SCOREBOARD_NOT_SOUND`, the 1 named check fails | HTTP 200, `CONFIDENCE_SCOREBOARD_NOT_SOUND`, 25 pass / 1 fail / 0 missing; failing check exactly `every_scoreboard_forecast_count_matches_ledger`; `forecasts_count` `1`, `forecasters_count` `1`, `overall_mean_stated_probability` `"0.800000"`, `overall_hit_rate` `"1.000000"`, `overall_calibration_gap` `"0.200000"`, `overall_brier_score` `"0.040000"`, `calibration_direction` `underconfident`, `worst_calibrated_forecaster` `Alice`, `mismatched_scoreboard_rows` `["Alice"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `per_forecaster_scoring` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `subject` (`Minimal Record`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 26 missing, all five sections `insufficient_evidence`, `forecasts_count` null, `forecasters_count` null, all overall aggregates null, `calibration_direction` null, `worst_calibrated_forecaster` null, all name lists null, `computed_status` null | PASS |
| 4 | malformed — `forecasts: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"forecasts","detail":"forecasts must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `forecast_confidence_scoreboard`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 26 checks and a text stamp):

```json
{"service": "forecast-confidence-scoreboard", "atom_version": "0.1.0", "subject": "Q1 2024 Revenue", "verdict": "CONFIDENCE_SCOREBOARD_SOUND", "sections": {"ledger_and_resolution": "pass", "per_forecaster_scoring": "pass", "calibration_reporting": "pass", "ranking_integrity": "pass", "honesty_and_live_use": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "forecasts_count": 2, "forecasters_count": 2, "overall_mean_stated_probability": "0.600000", "overall_hit_rate": "1.000000", "overall_calibration_gap": "0.400000", "overall_brier_score": "0.200000", "calibration_direction": "underconfident", "worst_calibrated_forecaster": "Bob", "forecasters_without_scoreboard_row": [], "scoreboard_rows_without_forecasts": [], "mismatched_scoreboard_rows": [], "forecasters_with_wrong_rank": [], "summary": "26 pass, 0 fail, 0 missing of 26 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"forecasts","detail":"forecasts must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×1, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the prose label `Per-forecaster aggregates match` instead of an exact check name — 1 validator rejection. Corrected before execution to the exact check name the planted value fails: `every_scoreboard_forecast_count_matches_ledger`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-computed from the input per SERVICE.md (Alice: mean 0.8, hit 1.0, gap 0.2, Brier (0.8−1)²=0.04; Bob: mean 0.4, hit 1.0, gap 0.6, Brier (0.4−1)²=0.36; overall mean (0.8+0.4)/2=0.6 → `"0.600000"`, hit `"1.000000"`, gap `"0.400000"`, Brier (0.04+0.36)/2=0.2 → `"0.200000"`, direction `underconfident`, worst `Bob`, counts 2/2, all lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-computed (Alice single row: overall mean `"0.800000"`, hit `"1.000000"`, gap `"0.200000"`, Brier `"0.040000"`, direction `underconfident`, worst `Alice`, counts 1/1, `mismatched_scoreboard_rows` `["Alice"]`, other lists `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R4) Malformed input carried 2 type violations (`record` as a string where an object is required, and `forecasts` as a number where a list is required), making the 422 field ambiguous. Corrected before execution: reduced to exactly one type violation — `forecasts: "not-a-list"` (string where a list is required), with `subject` as the only other field.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types, per-forecaster aggregates and Brier-order ranks recomputed by hand and via the Python oracle — 26 pass / 0 fail — no correction needed), the sparse case was verified genuinely sparse (only `subject` — no correction needed), and the violations input satisfied R3 (same key paths as full-pass — no R3 rejection, no correction needed on that rule).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (per-forecaster count / mean stated probability / hit rate / calibration gap / Brier score, the ranking in Brier order, the overall aggregates under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, calibration direction, worst-calibrated forecaster, counts, name lists, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/forecast-confidence-scoreboard/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass Alice aggregates (count / mean / hit / gap / Brier) | 1 / "0.800000" / "1.000000" / "0.200000" / "0.040000" | same (declared, passes) | ✓ |
| full-pass Bob aggregates (count / mean / hit / gap / Brier) | 1 / "0.400000" / "1.000000" / "0.600000" / "0.360000" | same (declared, passes) | ✓ |
| full-pass ranking (Brier 0.04 < 0.36) | Alice rank 1, Bob rank 2 | same | ✓ |
| full-pass `overall_mean_stated_probability` ((0.8+0.4)/2) | "0.600000" | "0.600000" | ✓ |
| full-pass `overall_hit_rate` / `overall_calibration_gap` / `overall_brier_score` | "1.000000" / "0.400000" / "0.200000" | same | ✓ |
| full-pass `calibration_direction` (0.6 < 1.0) / `worst_calibrated_forecaster` (gap 0.6) | underconfident / Bob | underconfident / Bob | ✓ |
| full-pass counts / lists / `computed_status` | 2 / 2 / [] / within_stated_limits_on_declared_evidence | same | ✓ |
| violations Alice recomputed count vs declared 99 | 1 vs 99 → count check fails, other aggregates pass | exactly `every_scoreboard_forecast_count_matches_ledger` fails | ✓ |
| violations overall aggregates | "0.800000" / "1.000000" / "0.200000" / "0.040000" | same | ✓ |
| violations `mismatched_scoreboard_rows` / `computed_status` | ["Alice"] / outside_stated_limits_on_declared_evidence | same | ✓ |
| verdicts | CONFIDENCE_SCOREBOARD_SOUND / CONFIDENCE_SCOREBOARD_NOT_SOUND (1 fail) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 1-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity, and every structured spot-check quantity in both the full-pass and violations cases); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded. No judge tester-error claims contradict the recorded evidence.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `forecasts`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
