# Test report — honest-seo-audit-intent-map

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/honest-seo-audit-intent-map/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (site `example.com`): all technical/intent/on-page/structured-data/entity/authority/measurement/ai-era declarations in passing polarity, all seven red-line flags false, one page row `home` owning intent `buy_service` with valid type `transactional`, single intent, fully answering | HTTP 200, verdict `HONEST_SEO_MAP_SOUND`, `pages_count` `1`, `single_intent_coverage` `"1.000000"`, `valid_intent_type_coverage` `"1.000000"`, `full_answer_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `HONEST_SEO_MAP_SOUND`, 43 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except page `home` with `has_single_intent` false and `red_lines.cloaking_present` true | HTTP 200, verdict `HONEST_SEO_MAP_NOT_SOUND`, the 2 named checks fail | HTTP 200, `HONEST_SEO_MAP_NOT_SOUND`, 41 pass / 2 fail / 0 missing; failing checks exactly `every_page_has_single_intent`, `no_cloaking`; `pages_without_single_intent` `["home"]`, `single_intent_coverage` `"0.000000"`, `valid_intent_type_coverage` `"1.000000"`, `full_answer_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `intent_map_and_on_page_craft` and `white_hat_red_lines` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `site` (`incomplete.com`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 43 missing, all five sections `insufficient_evidence`, `pages_count` null, `pages_without_single_intent` null, `single_intent_coverage` null, `pages_with_invalid_intent_type` null, `valid_intent_type_coverage` null, `duplicate_intents` null, `pages_not_fully_answering` null, `full_answer_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `technical.crawlable_robots_and_sitemap: "NOT_A_BOOLEAN"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"technical.crawlable_robots_and_sitemap","detail":"technical.crawlable_robots_and_sitemap must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `honest_seo_audit_intent_map`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 43 checks and a text stamp):

```json
{"service": "honest-seo-audit-intent-map", "atom_version": "0.1.0", "site": "example.com", "verdict": "HONEST_SEO_MAP_SOUND", "sections": {"technical_foundation": "pass", "intent_map_and_on_page_craft": "pass", "structured_data_and_entity_clarity": "pass", "earned_authority_and_measurement": "pass", "white_hat_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "pages_count": 1, "pages_without_single_intent": [], "single_intent_coverage": "1.000000", "pages_with_invalid_intent_type": [], "valid_intent_type_coverage": "1.000000", "duplicate_intents": [], "pages_not_fully_answering": [], "full_answer_coverage": "1.000000", "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"technical.crawlable_robots_and_sitemap","detail":"technical.crawlable_robots_and_sitemap must be a boolean"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the three section names `technical_foundation`, `intent_map_and_on_page_craft` and `white_hat_red_lines` instead of exact check names — 3 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `every_page_has_single_intent`, `no_cloaking`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`pages_count` `1`, `pages_without_single_intent` `[]`, `single_intent_coverage` `"1.000000"`, `pages_with_invalid_intent_type` `[]`, `valid_intent_type_coverage` `"1.000000"`, `duplicate_intents` `[]`, `pages_not_fully_answering` `[]`, `full_answer_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md and confirmed against the Python oracle.
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`pages_count` `1`, `pages_without_single_intent` `["home"]`, `single_intent_coverage` `"0.000000"`, `pages_with_invalid_intent_type` `[]`, `valid_intent_type_coverage` `"1.000000"`, `duplicate_intents` `[]`, `pages_not_fully_answering` `[]`, `full_answer_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was not a full manifest — it was a sparse record (only `site`, one `technical` flag, a two-row `pages` list and one `red_lines` flag) missing most key paths of the full-pass manifest, so it read as missing evidence rather than failure. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 2 planted violations (page `home` with `has_single_intent` false, and `red_lines.cloaking_present` true) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns all 43 checks pass on it — no correction needed), the sparse case was verified genuinely sparse (only `site` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `technical.crawlable_robots_and_sitemap` as a string where a boolean is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/honest-seo-audit-intent-map/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `pages_count` | 1 | 1 | ✓ |
| full-pass `single_intent_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `valid_intent_type_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `full_answer_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `pages_without_single_intent` / `pages_with_invalid_intent_type` / `duplicate_intents` / `pages_not_fully_answering` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `pages_without_single_intent` (`home` has_single_intent false) | ["home"] | ["home"] | ✓ |
| violations `single_intent_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `valid_intent_type_coverage` / `full_answer_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | HONEST_SEO_MAP_SOUND / HONEST_SEO_MAP_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `technical.crawlable_robots_and_sitemap`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
