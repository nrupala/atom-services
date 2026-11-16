# Test report — crm-pipeline-operations

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/crm-pipeline-operations/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all six stated stages (`lead`, `qualified`, `proposal`, `decision`, `won`, `lost`), one open lead deal (value 1000, age 10, next step + date, threshold 30), all other booleans true / red-lines false | HTTP 200, verdict `CRM_PIPELINE_READY`, `deal_count` 1, `open_deal_count` 1, `stale_deal_count` 0, `open_deals_without_next_step_or_date_count` 0, `pipeline_stages_not_covered` `[]`, `stage_distribution` lead 1 / others 0, `computed_open_value_total` `1000.000000`, `computed_pipeline_value_total` `1000.000000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CRM_PIPELINE_READY`, 38 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — full manifest with exactly 4 planted violations: `unapproved_outreach_sent` true, `stages_used` only `[lead]`, open deal with `has_next_step`/`has_next_step_date` false, open deal age 50 > declared threshold 30 | HTTP 200, verdict `CRM_PIPELINE_NOT_READY`, the 4 named checks fail | HTTP 200, `CRM_PIPELINE_NOT_READY`, 34 pass / 4 fail / 0 missing; failing checks exactly `no_unapproved_outreach`, `pipeline_stages_cover_stated_stages`, `every_open_deal_has_next_step_and_date`, `no_open_deal_stale_beyond_declared_threshold`; `pipeline_stages_not_covered` `["qualified","proposal","decision","won","lost"]`, `stale_deal_count` 1, `open_deals_without_next_step_or_date_count` 1, `computed_open_value_total` `100.000000`, `computed_pipeline_value_total` `100.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 38 missing, computed fields null | PASS |
| 4 | malformed — `pipeline.stale_threshold_days: "thirty"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"pipeline.stale_threshold_days","detail":"pipeline.stale_threshold_days must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `crm_pipeline_operations`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "crm-pipeline-operations", "atom_version": "0.1.0", "entity": "Acme Corp", "verdict": "CRM_PIPELINE_READY", "sections": {"single_source_of_truth": "pass", "contact_rules_and_privacy": "pass", "pipeline_stages_and_deals": "pass", "follow_up_cadence_and_logging": "pass", "reporting_and_forecasts": "pass", "consent_and_comms": "pass", "win_loss_discipline": "pass", "minimal_data_and_retention": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "pipeline_stages_not_covered": [], "deal_count": 1, "open_deal_count": 1, "stale_deal_count": 0, "open_deals_without_next_step_or_date_count": 0, "stage_distribution": {"lead": 1, "qualified": 0, "proposal": 0, "decision": 0, "won": 0, "lost": 0}, "computed_open_value_total": "1000.000000", "computed_pipeline_value_total": "1000.000000", "summary": "38 pass, 0 fail, 0 missing of 38 checks across eight sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"pipeline.stale_threshold_days","detail":"pipeline.stale_threshold_days must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at judgment stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`deal_count` 1, `open_deal_count` 1, `stale_deal_count` 0, `open_deals_without_next_step_or_date_count` 0, `pipeline_stages_not_covered` `[]`, `stage_distribution` lead 1 / others 0, `computed_open_value_total` `1000.000000`, `computed_pipeline_value_total` `1000.000000`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed section names (`pipeline_stages_and_deals`, `contact_rules_and_privacy`) instead of exact check names. Corrected before execution to the 4 exact check names above.
3. Violations input was sparse — most sections absent, so their checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest carrying exactly the four planted violations the designer intended (unapproved outreach, incomplete stage coverage, open deal without next step/date, open deal stale beyond the declared threshold).
4. Violations `expect` likewise carried no structured `computed_spot_checks` (computed quantities only implied in prose). Corrected before execution as part of the violations rebuild: added the structured block (`deal_count` 1, `open_deal_count` 1, `stale_deal_count` 1, `open_deals_without_next_step_or_date_count` 1, `pipeline_stages_not_covered` the 5 omitted stages, `computed_open_value_total` `100.000000`, `computed_pipeline_value_total` `100.000000`, `computed_status` `outside_stated_limits_on_declared_evidence`).
5. Malformed designed with TWO type violations (`pipeline.stages_used: "not-a-list"` and `pipeline.stale_threshold_days: "thirty"`). Corrected before execution: reduced to exactly one type violation of a documented typed field — `pipeline.stale_threshold_days: "thirty"` on an otherwise full-pass manifest.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (stage coverage against the six stated stages, deal-row completeness, stated-stage membership, next-step+date counting over open deals, staleness against the caller-declared threshold, stage distribution, open and total pipeline value sums with the SERVICE.md 6dp round-half-up rule, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/crm-pipeline-operations/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `pipeline_stages_not_covered` | [] | [] | ✓ |
| full-pass `deal_count` / `open_deal_count` | 1 / 1 | 1 / 1 | ✓ |
| full-pass `stale_deal_count` (age 10 ≤ threshold 30) | 0 | 0 | ✓ |
| full-pass `open_deals_without_next_step_or_date_count` | 0 | 0 | ✓ |
| full-pass `stage_distribution` | lead 1, others 0 | lead 1, others 0 | ✓ |
| full-pass `computed_open_value_total` / `computed_pipeline_value_total` | 1000.000000 / 1000.000000 | 1000.000000 / 1000.000000 | ✓ |
| violations `pipeline_stages_not_covered` | 5 omitted entries | same 5 | ✓ |
| violations `stale_deal_count` (age 50 > threshold 30) | 1 | 1 | ✓ |
| violations `open_deals_without_next_step_or_date_count` | 1 | 1 | ✓ |
| violations `computed_open_value_total` / `computed_pipeline_value_total` | 100.000000 / 100.000000 | 100.000000 / 100.000000 | ✓ |
| verdicts | CRM_PIPELINE_READY / CRM_PIPELINE_NOT_READY (exactly 4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own headline recompute also matches: the single open deal (value 1000, age 10 ≤ 30) gives open and pipeline totals of `1000.000000`, and the violations deal (value 100, age 50 > 30, no next step/date) gives stale count 1 and totals of `100.000000`.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `pipeline.stale_threshold_days`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
