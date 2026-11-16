# Test report — budget-design-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/budget-design-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — operating budget "Q1 Marketing Plan", one line (Ads, owner Marketing Lead, zero_based, driver 100 × 5 = amount 500), declared total 500, expected income 1000, rolling horizon 12, all evidence true, all three must-be-false red lines false | HTTP 200, verdict `BUDGET_DESIGN_SOUND`, `computed_total` `500.00`, `total_difference` `0.00`, `lines_evaluated` 1, `ownerless_line_indexes` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `BUDGET_DESIGN_SOUND`, 29 pass / 0 fail / 0 missing, exactly those computed values, all six sections `pass` | PASS |
| 2 | violations — `budget_type` `invalid_type`, line owner `""` (empty), amount 50 vs driver product 10 × 10 = 100, declared total 50 vs expected income 10, `hidden_padding_present` true; remaining sections absent | HTTP 200, verdict `BUDGET_DESIGN_NOT_SOUND`, the 5 named checks fail | HTTP 200, `BUDGET_DESIGN_NOT_SOUND`, 4 pass / 5 fail / 20 missing; failing checks exactly `budget_type_is_stated_kind`, `every_line_has_named_owner`, `line_amounts_match_driver_products`, `budget_balances_against_expected_income`, `no_hidden_padding`; `computed_total` `50.00`, `total_difference` `0.00`, `ownerless_line_indexes` `[0]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `budget` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 29 missing, computed fields null | PASS |
| 4 | malformed — `scope: "not_an_object"` (string where an object is required), `lines: "should_be_a_list"` | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `budget_design_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 29 checks and a text stamp):

```json
{"service": "budget-design-review", "atom_version": "0.1.0", "budget": "Q1 Marketing Plan", "verdict": "BUDGET_DESIGN_SOUND", "sections": {"scope": "pass", "structure_and_owners": "pass", "drivers_and_totals": "pass", "revenue_and_contingency": "pass", "approval_and_baseline": "pass", "monitoring_and_close": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "lines_evaluated": 1, "ownerless_line_indexes": [], "computed_total": "500.00", "total_difference": "0.00", "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}
```

## Findings

No findings.

## Tester errors

2 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed section.field strings (`scope.budget_type`, `structure_and_owners.owner`, `drivers_and_totals.driver_products`, `revenue_and_contingency.balance_against_income`, `revenue_and_contingency.hidden_padding_present`) instead of exact check names. Corrected before execution to the 5 exact check names above, with no change to any input value or expected verdict.
2. Full-pass `computed_spot_checks` were embedded in the expect `notes` text only, with no structured list. Corrected before execution by adding the structured `computed_spot_checks` list (driver product 100 × 5 = 500, `computed_total` `500.00`, `total_difference` `0.00`, balance 500 ≤ 1000, horizon 12, `computed_status`, `lines_evaluated`, `ownerless_line_indexes`), with no change to the input or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (driver products, total re-derivation with the SERVICE.md 2dp round-half-up rule, balance against income, rolling horizon, ownerless indexes, and `computed_status`) and verified the artifacts' numbers and verdicts. Raw output: `verification/work/budget-design-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: partial — Case 2 `computed_status`: my recompute = `null` (rolling_horizon_months absent, so a scalar computed check cannot be completed), artifact = `outside_stated_limits_on_declared_evidence`.**

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass driver product (100 × 5) | 500 | 500 | ✓ |
| full-pass `computed_total` | 500.00 | 500.00 | ✓ |
| full-pass `total_difference` (500 − 500) | 0.00 | 0.00 | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations driver product (10 × 10 vs amount 50) | fail | fail | ✓ |
| violations `computed_total` | 50.00 | 50.00 | ✓ |
| violations `total_difference` (50 − 50) | 0.00 | 0.00 | ✓ |
| violations `ownerless_line_indexes` | [0] | [0] | ✓ |
| violations failing checks | exactly the 5 planted | exactly the 5 planted | ✓ |
| violations `computed_status` | null (rolling horizon missing) | outside_stated_limits_on_declared_evidence | ✗ — adjudicated below |
| verdicts | BUDGET_DESIGN_SOUND / BUDGET_DESIGN_NOT_SOUND (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** partial agreement on DeepSeek's line, adjudicated in the atom's favour on the evidence. The single disputed quantity is the violations-case `computed_status`: DeepSeek read SERVICE.md's parenthetical ("null when any of the five scalar computed checks … cannot be completed") literally, so one missing scalar check (rolling horizon, absent because the violations manifest omits `monitoring`) would force null even though three scalar checks completed and failed. The artifact's behaviour — any scalar fail → `outside_stated_limits_on_declared_evidence`; null only when no scalar check fails and at least one cannot be completed — is the rule the Python oracle implements, the TypeScript port is parity-proven against, and every atom in the fleet implements identically (the same precedence as the verdict itself: any fail → NOT_SOUND, ahead of missing → INSUFFICIENT_EVIDENCE); a previously verified atom's violations case with missing sections was likewise accepted with an `outside_…` status. The raw evidence and the oracle therefore govern over DeepSeek's reading; the SERVICE.md parenthetical is an abbreviated summary of the no-fail case, not a defect in the atom's behaviour. Every other recomputed quantity matches exactly. (DeepSeek also quoted the full-pass line approach as `incremental` in its narrative where the input is `zero_based`; its pass conclusion for that check is unaffected.)

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `scope`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity except the single `computed_status` reading adjudicated above, where the evidence and the oracle govern (AGREEMENT: partial, on that one interpretation point only).
