# Test report — decision-process-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/decision-process-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (decision `Launch new feature`): all framing/precommitment/loss/rigor/evidence/review declarations true, the five must-be-false flags false, options `A`/`B` both viable, criterion `C1` set before data with threshold declared, default action `A`, loss costs 100 / 50 | HTTP 200, verdict `DECISION_PROCESS_SOUND`, `options_count` `2`, `criteria_count` `1`, `loss_cost_ratio` `"2.0000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DECISION_PROCESS_SOUND`, 36 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values (coverages `"1.0000"`, `default_action` `"A"`, all row-name lists `[]`) | PASS |
| 2 | violations — full manifest with `framing.analysis_makes_the_call_present` true, `options[0].viable` false, `precommitment.default_action` `NonExistentOption`, `loss.cost_of_false_action` -10 | HTTP 200, verdict `DECISION_PROCESS_NOT_SOUND`, the 4 named checks fail | HTTP 200, `DECISION_PROCESS_NOT_SOUND`, 32 pass / 4 fail / 0 missing; failing checks exactly `every_option_declared_viable`, `no_analysis_makes_the_call`, `default_action_matches_declared_option`, `loss_costs_both_directions_declared`; `options_not_declared_viable` `["A"]`, `default_action` `"NonExistentOption"`, `loss_cost_ratio` `"-0.2000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `framing_and_roles`, `precommitment_before_data` and `loss_stakes_and_rigor` `fail`, `evidence_discipline_and_review` `pass` | PASS |
| 3 | sparse — only `decision` (`Minimal test`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, all four sections `insufficient_evidence`, `options_count` null, `criteria_count` null, `loss_cost_ratio` null, `computed_status` null | PASS |
| 4 | malformed — `loss.cost_of_false_action: "should-be-a-number"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"loss.cost_of_false_action","detail":"loss.cost_of_false_action must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `decision_process_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 36 checks and a text stamp):

```json
{"service": "decision-process-design", "atom_version": "0.1.0", "decision": "Launch new feature", "verdict": "DECISION_PROCESS_SOUND", "sections": {"framing_and_roles": "pass", "precommitment_before_data": "pass", "loss_stakes_and_rigor": "pass", "evidence_discipline_and_review": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "options_count": 2, "options_without_name": [], "options_not_declared_viable": [], "option_name_coverage": "1.0000", "criteria_count": 1, "criteria_without_name": [], "criteria_not_set_before_data": [], "criteria_without_threshold": [], "criterion_set_before_data_coverage": "1.0000", "criterion_threshold_coverage": "1.0000", "default_action": "A", "loss_cost_ratio": "2.0000", "summary": "36 pass, 0 fail, 0 missing of 36 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"loss.cost_of_false_action","detail":"loss.cost_of_false_action must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`options_count` `2`, `criteria_count` `1`, `loss_cost_ratio` `"2.0000"`, coverages `"1.0000"`, `default_action` `"A"`, all row-name lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. (R1) Violations designed `failing_checks` listed a field path (`analysis_makes_the_call_present`) and prose shorthand (`Viability per option`, `Default action matches a declared option`, `Loss costs in both directions`) instead of exact check names — 4 validator rejections. Corrected before execution to the 4 exact check names the planted values fail: `no_analysis_makes_the_call`, `every_option_declared_viable`, `default_action_matches_declared_option`, `loss_costs_both_directions_declared`.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`options_count` `2`, `criteria_count` `1`, `loss_cost_ratio` `"-0.2000"`, `options_not_declared_viable` `["A"]`, `default_action` `"NonExistentOption"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it omitted most of the full-pass manifest's key paths (criteria, evidence, review, rigor, and most framing/precommitment/loss fields). Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 4 planted violations (analysis makes the call, option `A` not viable, default action naming no declared option, negative false-action cost) and nothing else changed.
5. (R4) Malformed designed with TWO type violations (`framing` as a string instead of an object, plus `options` as a string instead of a list). Corrected before execution: reduced to exactly one type violation of a documented typed field — `loss.cost_of_false_action` as a string where a number is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, gated checks passing as not applicable on their declared-false gates — no correction needed), and the sparse case needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the nine primary computed checks, the four gated conditional checks, the declared counts, the row-name lists, the coverage ratios and the `loss_cost_ratio` under SERVICE.md's fixed 4-decimal serialization rule `floor(v * 10000 + 0.5) / 10000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/decision-process-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `options_count` / `criteria_count` | 2 / 1 | 2 / 1 | ✓ |
| full-pass `option_name_coverage` (2 ÷ 2) | "1.0000" | "1.0000" | ✓ |
| full-pass `criterion_set_before_data_coverage` / `criterion_threshold_coverage` (1 ÷ 1) | "1.0000" / "1.0000" | "1.0000" / "1.0000" | ✓ |
| full-pass `default_action` (declared, matches option `A`) | "A" | "A" | ✓ |
| full-pass `loss_cost_ratio` (100 ÷ 50) | "2.0000" | "2.0000" | ✓ |
| full-pass `computed_status` (all nine computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `options_not_declared_viable` (`A` viable=false) | ["A"] | ["A"] | ✓ |
| violations `default_action` (names no declared option) | "NonExistentOption" | "NonExistentOption" | ✓ |
| violations `loss_cost_ratio` (-10 ÷ 50, floor rule on the negative value) | "-0.2000" | "-0.2000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | DECISION_PROCESS_SOUND / DECISION_PROCESS_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `loss.cost_of_false_action`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
