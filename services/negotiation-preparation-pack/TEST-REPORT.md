# Test report — negotiation-preparation-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/negotiation-preparation-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (negotiation `Vendor Service Level Agreement`): all BATNA/reservation/ZOPA, interests, value-creation, direction, presence, sequence, anchoring and tactics declarations in passing polarity, all six red-line flags false, anchoring gate `informed_enough_to_anchor_first` true with `anchor_first_planned` true, one issue row `Price` naming both underlying interests with trade potential assessed | HTTP 200, verdict `NEGOTIATION_PREPARATION_SOUND`, `issues_count` `1`, `own_interest_coverage` `"1.000000"`, `counterpart_interest_coverage` `"1.000000"`, `trade_potential_assessed_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `NEGOTIATION_PREPARATION_SOUND`, 44 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `batna_and_reservation.batna_identified` false, issue `Price` with `own_underlying_interest` `""`, `trade_potential_assessed` false, `anchoring.anchor_first_planned` false (gate true), and `red_lines.no_batna_present` true | HTTP 200, verdict `NEGOTIATION_PREPARATION_NOT_SOUND`, the 5 named checks fail | HTTP 200, `NEGOTIATION_PREPARATION_NOT_SOUND`, 39 pass / 5 fail / 0 missing; failing checks exactly `anchor_first_planned_when_informed`, `batna_identified`, `every_issue_names_own_underlying_interest`, `every_issue_trade_potential_assessed`, `no_batna`; `issues_without_own_interest` `["Price"]`, `own_interest_coverage` `"0.000000"`, `issues_without_counterpart_interest` `[]`, `counterpart_interest_coverage` `"1.000000"`, `issues_without_trade_potential_assessed` `["Price"]`, `trade_potential_assessed_coverage` `"0.000000"`, `duplicate_issue_names` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `batna_reservation_price_and_zopa`, `interests_and_value_creation`, `openings_moments_closing_and_tactics` and `debrief_and_anti_pattern_red_lines` `fail`, `improvisation_and_adaptation` `pass` | PASS |
| 3 | sparse — only `negotiation` (`Incomplete Prep`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 44 missing, all five sections `insufficient_evidence`, `issues_count` null, `issues_without_own_interest` null, `own_interest_coverage` null, `issues_without_counterpart_interest` null, `counterpart_interest_coverage` null, `issues_without_trade_potential_assessed` null, `trade_potential_assessed_coverage` null, `duplicate_issue_names` null, `computed_status` null | PASS |
| 4 | malformed — `batna_and_reservation: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"batna_and_reservation","detail":"batna_and_reservation must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `negotiation_preparation_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 44 checks and a text stamp):

```json
{"service": "negotiation-preparation-pack", "atom_version": "0.1.0", "negotiation": "Vendor Service Level Agreement", "verdict": "NEGOTIATION_PREPARATION_SOUND", "sections": {"batna_reservation_price_and_zopa": "pass", "interests_and_value_creation": "pass", "improvisation_and_adaptation": "pass", "openings_moments_closing_and_tactics": "pass", "debrief_and_anti_pattern_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "issues_count": 1, "issues_without_own_interest": [], "own_interest_coverage": "1.000000", "issues_without_counterpart_interest": [], "counterpart_interest_coverage": "1.000000", "issues_without_trade_potential_assessed": [], "trade_potential_assessed_coverage": "1.000000", "duplicate_issue_names": [], "summary": "44 pass, 0 fail, 0 missing of 44 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"batna_and_reservation","detail":"batna_and_reservation must be an object"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field `no_batna_present` instead of an exact check name — validator rejection: "failing_checks names 'no_batna_present', which is not in the atom's check register (44 checks)". Corrected before execution as part of rebuilding the violations case (see below).
2. (R1) Violations designed `failing_checks` named the input field `arguing_positions_present` instead of an exact check name — validator rejection: "failing_checks names 'arguing_positions_present', which is not in the atom's check register (44 checks)". Corrected before execution as part of rebuilding the violations case (see below).
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `issues_count` `1`, `issues_without_own_interest` `[]`, `own_interest_coverage` `"1.000000"`, `issues_without_counterpart_interest` `[]`, `counterpart_interest_coverage` `"1.000000"`, `issues_without_trade_potential_assessed` `[]`, `trade_potential_assessed_coverage` `"1.000000"`, `duplicate_issue_names` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `issues_count` `1`, `issues_without_own_interest` `["Price"]`, `own_interest_coverage` `"0.000000"`, `issues_without_counterpart_interest` `[]`, `counterpart_interest_coverage` `"1.000000"`, `issues_without_trade_potential_assessed` `["Price"]`, `trade_potential_assessed_coverage` `"0.000000"`, `duplicate_issue_names` `[]`).
5. (R3) Violations input was a sparse manifest (only `negotiation` and `red_lines` present) instead of a full manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): anchoring, anchoring.anchor_first_planned, anchoring.informed_enough_to_anchor_first, batna_and_reservation, … (44 key paths in total)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the 5 planted changes — `batna_and_reservation.batna_identified` = false, `issues[0].own_underlying_interest` = `""`, `issues[0].trade_potential_assessed` = false, `anchoring.anchor_first_planned` = false, `red_lines.no_batna_present` = true — with `failing_checks` set to exactly the 5 exact check names those changes fail: `anchor_first_planned_when_informed`, `batna_identified`, `every_issue_names_own_underlying_interest`, `every_issue_trade_potential_assessed`, `no_batna`.
6. (R4) Malformed input carried two documented type violations (`negotiation` as a number, `issues` as a string) — validator rejection: "malformed input carries 2 type violations (negotiation must be a string, issues must be a list); exactly one is required so the 422 field is unambiguous". Corrected before execution: the malformed case was adjusted to exactly one documented type violation — `batna_and_reservation` set to the string `"not_an_object"` where an object is required (`negotiation` kept a valid string, `issues` removed).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 44 checks pass on it — no correction needed), and the sparse case already carried an identity-only manifest (`{negotiation}` only), so no correction was needed there.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/negotiation-preparation-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `issues_count` | 1 | 1 | ✓ |
| full-pass `own_interest_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `counterpart_interest_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `trade_potential_assessed_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `issues_without_own_interest` / `issues_without_counterpart_interest` / `issues_without_trade_potential_assessed` / `duplicate_issue_names` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `issues_without_own_interest` (`Price` own interest `""`) | ["Price"] | ["Price"] | ✓ |
| violations `own_interest_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `counterpart_interest_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `issues_without_trade_potential_assessed` (`Price` not assessed) | ["Price"] | ["Price"] | ✓ |
| violations `trade_potential_assessed_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `duplicate_issue_names` | [] | [] | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | NEGOTIATION_PREPARATION_SOUND / NEGOTIATION_PREPARATION_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `batna_and_reservation`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
