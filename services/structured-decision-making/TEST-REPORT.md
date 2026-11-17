# Test report — structured-decision-making

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment ac6ddba696934ceb84596876507fc08c
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/structured-decision-making/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (decision `Choose cloud provider`): framing all true, classification `reversible`, stakes assessed true, effort matched true, slowed deliberation true; 3 options `AWS` (`action`, score Cost 5.0, declared total 5.0), `GCP` (`status_quo`, 4.0, 4.0), `Azure` (`smaller_reversible_step`, 3.0, 3.0); 1 criterion `Cost` weight 1.0 defined before scoring true; evaluation method `decision_matrix`, scale 0.0–10.0, probabilities estimable false, expected value false, scenario thinking true, uncertainty flagged true, base rates considered true; pre-mortem material false (other pre-mortem flags false, not applicable); log all true with chosen option `AWS`; review all true; all four red-line flags false | HTTP 200, verdict `DECISION_RECORD_SOUND`, `options_count` `3`, `criteria_count` `1`, `criteria_weights_sum` `"1.000000"`, recomputed totals AWS `"5.000000"` / GCP `"4.000000"` / Azure `"3.000000"`, mismatch `[]`, incomplete-scores `[]`, `score_coverage_ratio` `"1.000000"`, `weighted_total_match_ratio` `"1.000000"`, `chosen_option` `AWS`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DECISION_RECORD_SOUND`, 46 pass / 0 fail / 0 missing, all eight sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to the final full-pass except planted mutations: AWS score `11.0` (declared total set to `11.0` so it still recomputes), GCP `declared_weighted_total` `999.0`, `evaluation.uncertainty_flagged` `false`, `evaluation.base_rates_considered` `false`, `evaluation.scenario_thinking_used` `false` | HTTP 200, verdict `DECISION_RECORD_NOT_SOUND`, the 5 named checks fail | HTTP 200, `DECISION_RECORD_NOT_SOUND`, 41 pass / 5 fail / 0 missing; failing checks exactly `structured_every_score_lies_within_the_declared_scale`, `structured_every_declared_weighted_total_recomputes`, `structured_evaluation_uncertainty_is_flagged`, `structured_evaluation_base_rates_are_considered`, `structured_scenario_thinking_used_when_probabilities_not_estimable`; recomputed totals AWS `"11.000000"` / GCP `"4.000000"` / Azure `"3.000000"`, mismatch `["GCP"]`, `weighted_total_match_ratio` `"0.666667"`, `score_coverage_ratio` `"1.000000"`, `criteria_weights_sum` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `structured_matrix_scoring` and `structured_evaluation_and_uncertainty` `fail`, other six `pass` | PASS |
| 3 | sparse — only `decision` (`Empty decision`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 46 missing, all eight sections `insufficient_evidence`, `computed_status` null, `options_count` null, `criteria_count` null, `criteria_weights_sum` null, `recomputed_weighted_totals` null, `options_with_weighted_total_mismatch` null, `score_coverage_ratio` null, `weighted_total_match_ratio` null, `chosen_option` null | PASS |
| 4 | malformed — `decision: 12345` (number where a string is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"decision","detail":"decision must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `structured_decision_making`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 46 checks and a text stamp):

```json
{
  "service": "structured-decision-making",
  "atom_version": "0.1.0",
  "decision": "Choose cloud provider",
  "verdict": "DECISION_RECORD_SOUND",
  "sections": {
    "structured_framing": "pass",
    "structured_options": "pass",
    "structured_criteria": "pass",
    "structured_matrix_scoring": "pass",
    "structured_evaluation_and_uncertainty": "pass",
    "structured_pre_mortem": "pass",
    "structured_commit_log_and_review": "pass",
    "structured_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "options_count": 3,
  "criteria_count": 1,
  "duplicate_option_names": [],
  "duplicate_criterion_names": [],
  "criteria_weights_sum": "1.000000",
  "recomputed_weighted_totals": [
    {
      "option": "AWS",
      "recomputed_weighted_total": "5.000000"
    },
    {
      "option": "GCP",
      "recomputed_weighted_total": "4.000000"
    },
    {
      "option": "Azure",
      "recomputed_weighted_total": "3.000000"
    }
  ],
  "options_with_weighted_total_mismatch": [],
  "options_without_complete_scores": [],
  "score_coverage_ratio": "1.000000",
  "weighted_total_match_ratio": "1.000000",
  "chosen_option": "AWS",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across eight sections."
}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"decision","detail":"decision must be a string"}
```

## Findings

No findings. (Gemini judge: verdict PASS, findings [], tester_errors [] at the judgment stage; notes record that all cases align with the contract, including the 422 response and the verdict vocabulary `DECISION_RECORD_SOUND` / `DECISION_RECORD_NOT_SOUND` / `INSUFFICIENT_EVIDENCE`.)

## Tester errors

7 tester errors in total, all corrected at design time before execution and not scored against the atom. The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1 — and the oracle pre-check found 1 additional full-pass design defect. The corrected, executed battery passed the validator (`ok: true`) before execution, and the Gemini judge recorded 0 additional tester errors at the judgment stage.

1. (R1) failing_checks names 'Every score within the declared scale', which is not in the atom's check register (46 checks) — Corrected before execution: Rebuilt the violations case as a deep copy of the final corrected full-pass input with planted value mutations (AWS score 11.0 over the declared scale max 10.0, GCP declared_weighted_total 999.0, uncertainty_flagged false, base_rates_considered false, scenario_thinking_used false); ran the Python oracle on the mutated input and set expect.failing_checks to exactly the oracle's failing set.
2. (R1) failing_checks names 'Every declared weighted total recomputes', which is not in the atom's check register (46 checks) — Corrected before execution: Same rebuild as the companion R1 correction: expect.failing_checks was set to exactly the oracle's failing set on the mutated deep-copy input, using exact register names only.
3. (R2) expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count — Corrected before execution: Injected expect.computed_spot_checks as a structured object into the full-pass case, taken from the Python oracle output on the exact final corrected full-pass input (computed_status, options_count, criteria_count, duplicate lists, criteria_weights_sum, recomputed_weighted_totals, mismatch/coverage lists and ratios, chosen_option).
4. (R2) expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count — Corrected before execution: Injected expect.computed_spot_checks as a structured object into the violations case, taken from the Python oracle output on the exact mutated violations input.
5. (R3) violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): premortem, premortem.conducted, premortem.decision_is_material, premortem.failure_reasons_named, premortem.top_reasons_fixed_or_hedged — Corrected before execution: Rebuilt the violations input as a deep copy of the final corrected full-pass input, restoring premortem and all other key paths in full, changing values only via the planted mutations, so every key path present in the full-pass manifest is present in the violations input.
6. (R4) malformed input carries 2 type violations (decision must be a string, framing must be a object); exactly one is required so the 422 field is unambiguous — Corrected before execution: Rebuilt the malformed case as a deep copy of the final full-pass input with exactly one documented typed field given a wrong-typed value (decision = 12345, a number where a string is required); the raw second violation (framing as a string) was removed. Confirmed validate_cases.type_violations(input, MANIFEST_SPEC, '') returns exactly 1.
7. (oracle-pre-check) Oracle pre-check on the raw full-pass input returned DECISION_RECORD_NOT_SOUND (44 pass, 1 fail, 1 missing of 46 checks): fail structured_evaluation_uncertainty_is_flagged, missing structured_every_declared_weighted_total_recomputes; the raw design set evaluation.uncertainty_flagged=false and placed declared_weighted_total at the top level (undocumented) instead of per-option. — Corrected before execution: Corrected the full-pass design values only (contract unchanged): set evaluation.uncertainty_flagged=true, removed the top-level declared_weighted_total, and added per-option declared_weighted_total values AWS 5.0, GCP 4.0, Azure 3.0 (weight 1.0 x scores 5.0/4.0/3.0). Re-ran the oracle: DECISION_RECORD_SOUND, 46 pass / 0 fail / 0 missing.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (criteria weights sum, per-option recomputed weighted totals as Σ declared weight × declared score, the weighted-total mismatch list, score-coverage and weighted-total-match ratios, option/criterion counts, duplicate name lists, chosen option, the derived `computed_status`, verdicts and summaries, under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/structured-decision-making/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `criteria_weights_sum` | "1.000000" | "1.000000" | ✓ |
| full-pass recomputed totals AWS / GCP / Azure | "5.000000" / "4.000000" / "3.000000" | "5.000000" / "4.000000" / "3.000000" | ✓ |
| full-pass `options_with_weighted_total_mismatch` / `options_without_complete_scores` | [] / [] | [] / [] | ✓ |
| full-pass `score_coverage_ratio` / `weighted_total_match_ratio` | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| full-pass `options_count` / `criteria_count` / duplicates / `chosen_option` | 3 / 1 / [] / AWS | 3 / 1 / [] / AWS | ✓ |
| full-pass `computed_status` / verdict / summary | within_stated_limits_on_declared_evidence / DECISION_RECORD_SOUND / 46 pass, 0 fail, 0 missing | same | ✓ |
| violations recomputed totals AWS / GCP / Azure | "11.000000" / "4.000000" / "3.000000" | "11.000000" / "4.000000" / "3.000000" | ✓ |
| violations mismatch / match ratio | ["GCP"] / "0.666667" | ["GCP"] / "0.666667" | ✓ |
| violations failing-check set | exactly the 5 named checks | same 5 | ✓ |
| violations `computed_status` / verdict / summary | outside_stated_limits_on_declared_evidence / DECISION_RECORD_NOT_SOUND / 41 pass, 5 fail, 0 missing | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `decision`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
