# Test report — home-shortlist-carrying-cost-comparison

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/home-shortlist-carrying-cost-comparison/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (search `Calgary Family Home`): criteria written before search in `CAD` for `NW Calgary` detached homes with ceiling `600000`, one home `Home A` (MLS, fetched `2023-10-01`, status `live`, asking `550000`, monthly components housing `2500` + tax `300` + utilities `200` + HOA `0` = re-derived `3000`, declared total `3000`), all tracking and presentation declarations true | HTTP 200, verdict `HOME_SHORTLIST_COMPARISON_READY`, `homes_count` `1`, `monthly_carrying_costs` `[{"name": "Home A", "monthly_carrying_cost": "3000.000000"}]`, `total_monthly_carrying_cost` `"3000.000000"`, `lowest_monthly_carrying_cost` `"3000.000000"`, `highest_monthly_carrying_cost` `"3000.000000"`, `carrying_cost_spread` `"0.000000"`, `ranked_home_names` `["Home A"]`, `cheapest_home_name` `"Home A"`, `cost_figure_coverage` `"1.000000"`, `homes_over_budget_ceiling` `[]`, `homes_within_budget_count` `1`, `any_home_within_budget` `true`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `HOME_SHORTLIST_COMPARISON_READY`, 25 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest with the same key paths as full-pass except home `Bad Home` declares monthly components housing `100` + tax `0` + utilities `0` + HOA `0` = re-derived `100` but a declared total of `999` | HTTP 200, verdict `HOME_SHORTLIST_COMPARISON_NOT_READY`, the 1 named check fails | HTTP 200, `HOME_SHORTLIST_COMPARISON_NOT_READY`, 24 pass / 1 fail / 0 missing; failing check exactly `declared_carrying_costs_match_rederived`; `monthly_carrying_costs` `[{"name": "Bad Home", "monthly_carrying_cost": "100.000000"}]`, `total_monthly_carrying_cost` `"100.000000"`, `lowest_monthly_carrying_cost` `"100.000000"`, `highest_monthly_carrying_cost` `"100.000000"`, `carrying_cost_spread` `"0.000000"`, `ranked_home_names` `["Bad Home"]`, `cheapest_home_name` `"Bad Home"`, `cost_figure_coverage` `"1.000000"`, `homes_with_carrying_cost_mismatch` `["Bad Home"]`, `homes_over_budget_ceiling` `[]` (asking `100` ≤ ceiling `100`; over requires strictly greater), `homes_within_budget_count` `1`, `any_home_within_budget` `true`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `carrying_cost_computation` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `search_name` (`Empty`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 25 missing, all five sections `insufficient_evidence`, `homes_count` null, `monthly_carrying_costs` null, `total_monthly_carrying_cost` null, `lowest_monthly_carrying_cost` null, `highest_monthly_carrying_cost` null, `carrying_cost_spread` null, `ranked_home_names` null, `cheapest_home_name` null, `cost_figure_coverage` null, `homes_without_listing_source` null, `homes_without_fetch_date` null, `homes_with_invalid_status` null, `ruled_out_homes_without_reason` null, `homes_not_meeting_criteria` null, `homes_with_carrying_cost_mismatch` null, `homes_over_budget_ceiling` null, `homes_within_budget_count` null, `any_home_within_budget` null, `computed_status` null | PASS |
| 4 | malformed — `homes: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"homes","detail":"homes must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `home_shortlist_carrying_cost_comparison`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 25 checks and a text stamp):

```json
{"service": "home-shortlist-carrying-cost-comparison", "atom_version": "0.1.0", "search_name": "Calgary Family Home", "verdict": "HOME_SHORTLIST_COMPARISON_READY", "sections": {"criteria_first": "pass", "candidate_records": "pass", "carrying_cost_computation": "pass", "tracking_and_refresh": "pass", "ranking_and_presentation": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "homes_count": 1, "monthly_carrying_costs": [{"name": "Home A", "monthly_carrying_cost": "3000.000000"}], "total_monthly_carrying_cost": "3000.000000", "lowest_monthly_carrying_cost": "3000.000000", "highest_monthly_carrying_cost": "3000.000000", "carrying_cost_spread": "0.000000", "ranked_home_names": ["Home A"], "cheapest_home_name": "Home A", "cost_figure_coverage": "1.000000", "homes_without_listing_source": [], "homes_without_fetch_date": [], "homes_with_invalid_status": [], "ruled_out_homes_without_reason": [], "homes_not_meeting_criteria": [], "homes_with_carrying_cost_mismatch": [], "homes_over_budget_ceiling": [], "homes_within_budget_count": 1, "any_home_within_budget": true, "summary": "25 pass, 0 fail, 0 missing of 25 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"homes","detail":"homes must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×1, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the section name `carrying_cost_computation` instead of an exact check name — 1 validator rejection. Corrected before execution to the 1 exact check name the planted value fails: `declared_carrying_costs_match_rederived` (hand-verified: re-derived cost `100 + 0 + 0 + 0 = 100` vs declared `999`).
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-computed from the input per SERVICE.md (`homes_count` `1`, `monthly_carrying_costs` `[{"name": "Home A", "monthly_carrying_cost": "3000.000000"}]` from `2500 + 300 + 200 + 0 = 3000`, `total_monthly_carrying_cost` `"3000.000000"`, `lowest_monthly_carrying_cost` `"3000.000000"`, `highest_monthly_carrying_cost` `"3000.000000"`, `carrying_cost_spread` `"0.000000"`, `ranked_home_names` `["Home A"]`, `cheapest_home_name` `"Home A"`, `cost_figure_coverage` `"1.000000"`, all row-name lists `[]`, `homes_over_budget_ceiling` `[]`, `homes_within_budget_count` `1`, `any_home_within_budget` `true`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-computed from the input per SERVICE.md (`homes_count` `1`, `monthly_carrying_costs` `[{"name": "Bad Home", "monthly_carrying_cost": "100.000000"}]` from `100 + 0 + 0 + 0 = 100`, `total_monthly_carrying_cost` `"100.000000"`, `lowest_monthly_carrying_cost` `"100.000000"`, `highest_monthly_carrying_cost` `"100.000000"`, `carrying_cost_spread` `"0.000000"`, `ranked_home_names` `["Bad Home"]`, `cheapest_home_name` `"Bad Home"`, `cost_figure_coverage` `"1.000000"`, `homes_with_carrying_cost_mismatch` `["Bad Home"]`, `homes_over_budget_ceiling` `[]`, `homes_within_budget_count` `1`, `any_home_within_budget` `true`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R4) Malformed input carried 2 type violations (`currency` as the number `123` where a string is required, and `criteria` as a string where an object is required), so the expected 422 field was ambiguous. Corrected before execution: rebuilt it with exactly one type violation of a documented typed field — `homes` as the string `"not-a-list"` where a list is required.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, declared total `3000` re-deriving exactly from its components, status `live` so the ruled-out-reason check passes as not applicable — no correction needed), the violations input already carried the full-pass manifest's key paths (R3 passed with no correction — only the planted declared-total value differs in effect), and the sparse case was verified genuinely sparse (only `search_name` — no correction needed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the per-home monthly carrying-cost sums, the declared-total consistency comparison, the totals / lowest / highest / spread chain, the ranking, the coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, the budget comparison, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/home-shortlist-carrying-cost-comparison/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `monthly_carrying_costs` (Home A: 2500 + 300 + 200 + 0) | "3000.000000" | "3000.000000" | ✓ |
| full-pass `total_monthly_carrying_cost` / `lowest_monthly_carrying_cost` / `highest_monthly_carrying_cost` | "3000.000000" / "3000.000000" / "3000.000000" | "3000.000000" / "3000.000000" / "3000.000000" | ✓ |
| full-pass `carrying_cost_spread` (3000 − 3000) | "0.000000" | "0.000000" | ✓ |
| full-pass `cost_figure_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass budget (asking 550000 ≤ ceiling 600000) | over `[]`, within count `1`, any `true` | over `[]`, within count `1`, any `true` | ✓ |
| full-pass `computed_status` (all seven computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `monthly_carrying_costs` (Bad Home: 100 + 0 + 0 + 0) | "100.000000" | "100.000000" | ✓ |
| violations `homes_with_carrying_cost_mismatch` (declared 999 vs re-derived 100) | ["Bad Home"] | ["Bad Home"] | ✓ |
| violations `total_monthly_carrying_cost` / `lowest_monthly_carrying_cost` / `highest_monthly_carrying_cost` / `carrying_cost_spread` | "100.000000" / "100.000000" / "100.000000" / "0.000000" | "100.000000" / "100.000000" / "100.000000" / "0.000000" | ✓ |
| violations budget (asking 100 ≤ ceiling 100) | over `[]`, within count `1`, any `true` | over `[]`, within count `1`, any `true` | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 1 planted check | same 1 | ✓ |
| verdicts | HOME_SHORTLIST_COMPARISON_READY / HOME_SHORTLIST_COMPARISON_NOT_READY (1 fail) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 1-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, every spot-check quantity, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `homes`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
