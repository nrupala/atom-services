# Test report — finance-education-article

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/finance-education-article/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (article `Understanding Compound Interest`): topic `Compound Interest`, all structure/worked-example/no-signals/disclosure/review declarations true with the three must-be-false signal flags false, section order `["concept", "worked_example", "what_to_watch"]`, worked example `multiply` 100 × 1.05 = 105.0, disclosure gate true with `data_as_of` `2026-11-01` | HTTP 200, verdict `ARTICLE_READY`, `steps_evaluated` `1`, `steps_incomplete` `0` | HTTP 200, `ARTICLE_READY`, 19 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `structure.section_order` `["concept", "what_to_watch", "worked_example"]`, worked-example step `add` 1 + 1 declared `999.0`, `signals.buy_sell_signals_present` true | HTTP 200, verdict `NOT_ARTICLE_READY`, the 3 named checks fail | HTTP 200, `NOT_ARTICLE_READY`, 16 pass / 3 fail / 0 missing; failing checks exactly `section_order_matches_skill`, `worked_example_arithmetic_correct`, `no_buy_sell_signals`; `steps_evaluated` `1`, `steps_incomplete` `0`; sections `article_structure`, `worked_example` and `no_signals` `fail`, `disclosures` and `review` `pass` | PASS |
| 3 | sparse — only `article` (`Incomplete Draft`) and `topic` (`Finance`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 18 missing, all five sections `insufficient_evidence`, `steps_evaluated` `0`, `steps_incomplete` `0` | PASS |
| 4 | malformed — `topic: 123` (number where a string is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"topic","detail":"topic must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `finance_education_article`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 19 checks and a text stamp):

```json
{"service": "finance-education-article", "atom_version": "0.1.0", "article": "Understanding Compound Interest", "verdict": "ARTICLE_READY", "sections": {"article_structure": "pass", "worked_example": "pass", "no_signals": "pass", "disclosures": "pass", "review": "pass"}, "steps_evaluated": 1, "steps_incomplete": 0, "summary": "19 pass, 0 fail, 0 missing of 19 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"topic","detail":"topic must be a string"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 7 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed section names (`article_structure`, `worked_example`, `no_signals`) instead of exact check names — 3 validator rejections. Corrected before execution to the 3 exact check names the planted values fail: `section_order_matches_skill`, `worked_example_arithmetic_correct`, `no_buy_sell_signals`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`steps_evaluated` `1`, `steps_incomplete` `0`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`steps_evaluated` `1`, `steps_incomplete` `0`).
4. (R3) Violations input was not a full manifest — it omitted the disclosure key paths present in the full-pass manifest (`disclosure.assumptions_stated`, `disclosure.data_as_of`, `disclosure.data_dates_stated`, `disclosure.limits_stated`) and carried `disclosure.uses_data_or_assumptions` false. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 3 planted violations (section order reordered, worked-example `add` 1 + 1 declared `999.0`, `buy_sell_signals_present` true) and nothing else changed.
5. (R4) Malformed designed with TWO type violations (`topic` as a number, plus `structure` as a string instead of an object). Corrected before execution: reduced to exactly one type violation of a documented typed field — `topic` as a number where a string is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, section order exactly the skill's order, worked-example arithmetic re-deriving correctly, disclosure gate true with all four disclosure requirements satisfied — no correction needed), and the sparse case was verified genuinely sparse (only `article` and `topic` present) and needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the section-order equality check, the worked-example arithmetic re-derivation at 6-decimal formatting, the `steps_evaluated` / `steps_incomplete` counts, and the derived verdicts, section rollups and summaries) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/finance-education-article/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `section_order_matches_skill` (`["concept", "worked_example", "what_to_watch"]` = expected) | pass | pass | ✓ |
| full-pass `worked_example_arithmetic_correct` (100 × 1.05 = `105.000000`) | pass | pass | ✓ |
| full-pass `steps_evaluated` / `steps_incomplete` | 1 / 0 | 1 / 0 | ✓ |
| full-pass verdict / summary | ARTICLE_READY / 19-0-0 | ARTICLE_READY / 19-0-0 | ✓ |
| violations `section_order_matches_skill` (reordered) | fail | fail | ✓ |
| violations `worked_example_arithmetic_correct` (1 + 1 = `2.000000` ≠ declared `999.000000`) | fail | fail | ✓ |
| violations `steps_evaluated` / `steps_incomplete` | 1 / 0 | 1 / 0 | ✓ |
| violations `no_buy_sell_signals` (`buy_sell_signals_present` true) | fail | fail | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| violations verdict / summary | NOT_ARTICLE_READY / 16-3-0 | NOT_ARTICLE_READY / 16-3-0 | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `topic`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
