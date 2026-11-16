# Cash flow forecast — documentation

**Cash flow forecast** · slug `cash-flow-forecast` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is the value that run actually returned.

**The job.** You have a declared cash-flow forecast artifact — its flow map and lag assumptions, 13-week buckets, reserve target, working-capital and lever record, runway declaration, stress record, and reporting record, and you want one deterministic verdict on whether it is complete and internally coherent on its own declared evidence.

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the exact calls are in *How-to guides → Get a key and call via REST*). Keep the key; you send it as `Authorization: Bearer <key>` on every call.

**Step 2 — assemble the manifest.** Build one JSON object covering every section: `flows_and_lags`, `thirteen_week_forecast`, `reserves_and_runway`, `working_capital_and_levers`, `stress_tests`, `reporting_and_commitments`. In the recorded run the identity field `entity` was `"Test Corp"`. Fill each evidence field honestly from your own records: `true` where the practice was followed, `false` where a must-be-false field applies (see the Input reference — those fields must be `false` to pass), and the declared lists and numbers the computed checks re-derive. Leave a field out only if you genuinely have no evidence for it — an absent field is not a failure, it is `missing`, and it will hold the verdict at `INSUFFICIENT_EVIDENCE`.

**Step 3 — send it.** `POST https://atoms.pipavia.com/v1/cash-flow-forecast` with the manifest as the body and your key in the `Authorization` header.

**Step 4 — read the verdict.** The recorded run returned HTTP 200 with verdict `CASH_FLOW_FORECAST_READY`: every section `pass`, and the summary "30 pass, 0 fail, 0 missing of 30 checks across six sections." The computed fields came back `computed_status` = `"within_stated_limits_on_declared_evidence"`, `weeks_evaluated` = `13`, `computed_final_balance` = `"4900.000000"`, `final_balance_difference` = `"0.000000"`, `computed_reserve_target` = `"200.000000"`, `reserve_target_difference` = `"0.000000"`, `computed_runway_months` = `"10.000000"`, `runway_difference` = `"0.000000"`, `stress_cases_not_run` = `[]` — the declared lists and numbers agree with the limits the method itself states, on the declared evidence.

**Step 5 — act on it.** A `CASH_FLOW_FORECAST_READY` verdict means the manifest is complete on the evidence you declared — it does not certify that the underlying work is good (see *Explanation → What it does not do*). If instead you get the failing verdict or `INSUFFICIENT_EVIDENCE`, the `checks` array names exactly which checks failed or are missing; *How-to guides → Read a failing verdict and fix the manifest* walks through that repair loop using the recorded violations run.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cash-flow-forecast"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call the atom: `POST https://atoms.pipavia.com/v1/cash-flow-forecast` — body = the manifest object (see the Input reference).

```bash
curl -s -X POST https://atoms.pipavia.com/v1/cash-flow-forecast \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The response is the verdict object described in *Reference → Output format*. The same manifest always returns the same verdict (determinism was byte-identical on the recorded repeat call — see TEST-REPORT.md).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/cash-flow-forecast`
- Tool name: `cash_flow_forecast`
- Call `tools/call` with the tool name above and the manifest object as the arguments — the same object you would send as the REST body, with the same `Authorization: Bearer <key>` header.
- The MCP result's structured content is the same verdict object as the REST response (parity was verified structured-equal on the recorded full-pass run — see TEST-REPORT.md). Prefer whichever face your client already speaks; do not expect different verdicts from the two faces.

### Read a failing verdict and fix the manifest

The recorded violations run (Worked example 2) returned verdict `CASH_FLOW_FORECAST_NOT_READY` with the summary "25 pass, 5 fail, 0 missing of 30 checks across six sections." Repair any failing verdict the same way:

1. **Read `sections` first.** A section is `fail` when any of its checks fails, `insufficient_evidence` when none fails but at least one is `missing`, and `pass` only when all its checks pass. That tells you where to look.
2. **Read the `checks` array.** Each entry is `{section, check, status, evidence}`. Work the `fail` entries first — the `evidence` text states the rule that was breached. In the recorded violations run the failing checks were: `weekly_closing_balances_match_rederived`, `reserve_target_amount_matches_months_times_fixed_costs`, `runway_matches_cash_divided_by_burn`, `stress_cases_cover_stated_cases`, `no_commitments_against_unlanded_receivables`.
3. **Distinguish `fail` from `missing`.** `fail` = the field was present but false, invalid, or arithmetically/set-wise incoherent — fix the underlying practice or correct the declaration. `missing` = the field was absent — supply the evidence; do not guess a value to make the check pass, because the atom audits declarations, and a declaration you cannot stand behind is worse than a missing one.
4. **Check the computed fields.** On a failing verdict the computed outputs (see *Reference → Output format*) show the re-derived values and the differences, so you can see by how much a declared total, count, or list disagrees before you resubmit.
5. **Fix the manifest and resubmit the whole object.** The atom is stateless per call: there is no partial update, no case to reopen, and no memory of the previous submission. Resubmit the corrected full manifest and read the new verdict.

### Handle a 422 invalid_input

A type violation is not a verdict — the call is rejected before any check runs. The recorded malformed run (Worked example 3) returned HTTP 422 with this body:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "forecast.opening_balance",
  "detail": "forecast.opening_balance must be a number"
}
```

- `field` names the exact manifest field whose type was wrong (`forecast.opening_balance` in the recorded run); `detail` states the type it must be (`"forecast.opening_balance must be a number"`).
- Fix that field's type in the manifest (consult the type column of the Input reference), then resubmit. If you sent several wrongly-typed fields, expect to repeat this once per call — the recorded shape reports one `field` per response.
- Do not retry the identical body: a 422 is deterministic for the same input and will not clear on its own. It is also not a rate-limit or auth problem — check the `error` value first: `invalid_input` means the manifest, not the key.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/cash-flow-forecast` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/cash-flow-forecast` — tool name `cash_flow_forecast`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway: https://atoms.pipavia.com, gateway version 1.1.0 at the time of the recorded runs. Key scope: this atom only — a key's scope for one atom never verifies for another (contract.yaml key namespace `cash_flow_forecast`).

### Input reference

One JSON manifest. Types are taken from SERVICE.md's field table (its preamble states: all fields are booleans unless noted); the evidence `inputSchema` corroborates the top-level object/string/array types. Notes — including must-be-false gates and computed/conditional behaviour — are preserved from SERVICE.md. Fields are grouped as SERVICE.md groups them (by the section that reads them).

#### Carried / top-level (not itself checked)

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `entity` | string | string; carried into the verdict output, not itself checked |

#### Read by section `flows_and_lags`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `flows.recurring_inflows_mapped` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `flows.recurring_outflows_mapped` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `flows.seasonal_patterns_mapped` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `flows.one_offs_mapped` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `flows.lag_assumptions_documented` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `thirteen_week_forecast`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `forecast.opening_balance` | number | number; computed, see below |
| `forecast.weeks` | list of weekly buckets | list of weekly buckets; absent / not a list / empty = all three computed forecast checks missing |
| `forecast.weeks[].label` | string | string; must be non-empty for the entry to be complete |
| `forecast.weeks[].inflows` | number | number |
| `forecast.weeks[].outflows` | number | number |
| `forecast.weeks[].closing_balance` | number | number; declared, re-derived, see below |
| `forecast.rolling_maintained_weekly` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `forecast.monthly_annual_planning_present` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `reserves_and_runway`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `reserves.target_set` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reserves.monthly_fixed_costs` | number | number; computed, see below |
| `reserves.target_months` | number | number; computed, see below |
| `reserves.declared_target_amount` | number | number; computed, see below |
| `reserves.held_separately` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reserves.breach_requires_explicit_decision` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reserves.put_at_risk` | boolean | must be `false` to pass — skill red line |
| `runway.cash_on_hand` | number | number; computed, see below |
| `runway.burn` | number | number; net monthly outflow, computed, see below |
| `runway.declared_runway_months` | number | number; computed, see below |
| `runway.alert_thresholds_at_6_and_3_months_set` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `working_capital_and_levers`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `working_capital.ar_aging_reviewed_on_cadence` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `working_capital.chase_ladder_applied` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `working_capital.ap_calendar_maintained` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `working_capital.inventory_only_where_it_pays` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `levers.inflow_acceleration_applied` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `levers.outflows_phased` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `levers.vendors_used_as_silent_financing` | boolean | must be `false` to pass — skill red line |

#### Read by section `stress_tests`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `stress.cases_run` | list of strings | list of strings; computed, see below |
| `stress.answers_recorded` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `stress.responses_predecided` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |

#### Read by section `reporting_and_commitments`

| Field | Type | Notes (from SERVICE.md) |
|---|---|---|
| `reporting.weekly_position_and_forecast_reported` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `reporting.monthly_summary_drivers_annotated` | boolean | boolean evidence field — `true` = the declared practice/evidence holds; present but `false` = the check fails; absent = missing evidence |
| `commitments.committed_against_unlanded_receivables` | boolean | must be `false` to pass — skill red line |

Container objects (the section objects and any list-of-objects entries above) are objects/arrays as typed; a container sent as the wrong JSON type is a 422 `invalid_input`, not a failing check (see Errors).

### Checks

Every check the atom runs — 30 checks, grouped by section. Ground truth: the `checks` array of the recorded full-pass REST response (Worked example 1), cross-checked against SERVICE.md; the counts agree (30/30). The `evidence` text quoted for each check is the recorded response's own statement of what the check requires.

**Per-check status semantics (all checks):** `pass` — the recorded evidence satisfies the stated requirement; `fail` — the field was present but false/invalid, or a computed condition (arithmetic, set coverage, vocabulary) was not met; `missing` — the field(s) the check reads were absent, so there is no evidence to judge. No `not_applicable` per-check status is returned by this atom in any recorded case.

#### Section `flows_and_lags` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `recurring_inflows_mapped` | method step 1: recurring inflows are mapped |
| `recurring_outflows_mapped` | method step 1: recurring outflows are mapped |
| `seasonal_patterns_mapped` | method step 1: seasonal patterns are mapped |
| `one_offs_mapped` | method step 1: one-off flows are mapped |
| `lag_assumptions_documented` | quality gate: lag assumptions are documented — payment terms, receivable days, settlement delays |

#### Section `thirteen_week_forecast` — 5 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `forecast_week_entries_complete` | every weekly bucket carries a label, inflows, outflows, and a closing balance |
| `forecast_covers_thirteen_weeks` | method step 2: the rolling forecast declares exactly 13 weekly buckets — the horizon the skill names |
| `weekly_closing_balances_match_rederived` | method step 2: each declared weekly closing balance equals the opening balance plus cumulative declared inflows minus outflows |
| `rolling_forecast_maintained_weekly` | quality gate: the rolling forecast is maintained weekly — stale forecasts cause surprises only |
| `monthly_annual_planning_present` | method step 2: monthly/annual buckets are kept for planning alongside the weekly near-term forecast |

#### Section `reserves_and_runway` — 7 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `reserve_target_set` | quality gate: a reserve target is set |
| `reserve_target_amount_matches_months_times_fixed_costs` | method step 4: the declared reserve target amount equals the declared months of fixed costs multiplied by the declared monthly fixed costs (minimum cash = X months of fixed costs; X itself is sized to volatility and is not judged here) |
| `reserve_held_separately` | quality gate: the reserve is held separately from operating cash |
| `reserve_breach_requires_explicit_decision` | quality gate: the reserve is only breached by explicit decision |
| `reserves_not_put_at_risk` | red line: reserves are never put at risk |
| `runway_matches_cash_divided_by_burn` | method step 6: the declared runway equals the declared cash divided by the declared burn (burn = net monthly outflow; runway = cash / burn) |
| `runway_alert_thresholds_at_6_and_3_months_set` | method step 6: alert thresholds are set at 6 and 3 months of runway |

#### Section `working_capital_and_levers` — 7 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `ar_aging_reviewed_on_cadence` | quality gate: AR aging is reviewed on cadence — who owes what |
| `chase_ladder_applied` | quality gate: the chase ladder is applied to receivables |
| `ap_calendar_maintained` | method step 5: an AP calendar is maintained — discounts vs float |
| `inventory_only_where_it_pays` | method step 5: inventory is held only where it pays |
| `inflow_levers_applied_honestly` | method step 3: inflows are accelerated honestly — invoicing discipline, deposits, follow-up cadence |
| `outflow_levers_phased` | method step 3: outflows are phased — terms, batch purchases, timing |
| `vendors_not_used_as_silent_financing` | red line: vendors are never used as silent financing — obligations are never stiffed quietly |

#### Section `stress_tests` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `stress_cases_cover_stated_cases` | method step 7: the stress cases run cover every case the skill names — revenue -20%, collections +30 days late, surprise capex |
| `stress_answers_recorded` | method step 7: the stress answers are recorded — does the plan hold, case by case |
| `stress_responses_predecided` | quality gate: stress responses are pre-decided |

#### Section `reporting_and_commitments` — 3 checks

| Check | What it requires to pass (recorded evidence text) |
|---|---|
| `weekly_position_and_forecast_reported` | method step 8: the weekly cash position and short forecast are reported |
| `monthly_summary_drivers_annotated` | method step 8: the monthly summary is reported with drivers annotated |
| `no_commitments_against_unlanded_receivables` | red line: no commitments against expected receivables that haven't landed |

#### Computed checks in detail

- **Weekly entries and 13-week coverage (`forecast_week_entries_complete`, `forecast_covers_thirteen_weeks`):** `forecast.weeks` passes the coverage check only when it declares exactly 13 buckets, and the entries check only when every bucket carries a non-empty `label` string and numeric `inflows`, `outflows` and `closing_balance`. A missing or empty list is missing evidence; an incomplete entry makes the entries and balance checks missing (the entry cannot be re-derived).
- **Weekly closing balances (`weekly_closing_balances_match_rederived`):** each declared weekly closing balance must equal `forecast.opening_balance` plus cumulative declared inflows minus outflows up to that week. The output reports `computed_final_balance`, `final_balance_difference` (final week's declared closing minus the re-derived final balance) and `weeks_evaluated` (count of complete weekly entries) — each null when it cannot be computed.
- **Reserve target (`reserve_target_amount_matches_months_times_fixed_costs`):** `reserves.declared_target_amount` passes only when it equals `reserves.target_months` × `reserves.monthly_fixed_costs`. The method sizes the months 'to volatility' and states no number, so **no minimum months is imposed** — only the arithmetic is re-derived. The output reports `computed_reserve_target` and `reserve_target_difference` (declared minus computed, null when either cannot be computed).
- **Runway (`runway_matches_cash_divided_by_burn`):** `runway.declared_runway_months` passes only when it equals `runway.cash_on_hand` / `runway.burn`, with a positive burn (a zero burn fails — no finite runway exists). The 6/3-month figures are **alert thresholds**, checked only as a declaration that they are set — never as a pass mark on the runway itself; no minimum runway is imposed. The output reports `computed_runway_months` and `runway_difference` (declared minus computed, null when either cannot be computed).
- **Stress coverage (`stress_cases_cover_stated_cases`):** `stress.cases_run` passes only when it contains all three stated entries — `revenue_minus_20_percent`, `collections_plus_30_days_late`, `surprise_capex`. Unknown entries do not count. A missing list is missing evidence; an empty list is present and fails. Omitted entries are reported as `stress_cases_not_run` (null when no list is declared). Entries are validated as strings only, never enum-checked. Whether the plan actually holds under stress is the caller's recorded answer (`stress.answers_recorded`), not this atom's judgment.
- **Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

The output also reports `computed_status` over the five computed checks: `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five computed checks cannot be completed (SERVICE.md).

### Output format

HTTP 200 with one JSON verdict object (a 422 rejection is the only non-verdict response shape — see Errors). Top-level fields, in the order returned in the recorded responses:

| Field | Meaning |
|---|---|
| `service` | Always `"cash-flow-forecast"`. |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"` in the recorded runs). |
| `entity` | The manifest's identity field, carried through (null when the manifest did not declare it, as in the recorded violations run for some atoms). |
| `verdict` | One of the verdict values below. |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`). |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order. |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null — see the computed-checks note above. |
| `weeks_evaluated` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `13`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `computed_final_balance` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"4900.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `final_balance_difference` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"0.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `computed_reserve_target` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"200.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `reserve_target_difference` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"0.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `computed_runway_months` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"10.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `runway_difference` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `"0.000000"`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `stress_cases_not_run` | Computed output field (see *Checks → Computed checks in detail*); in the recorded full-pass run: `[]`. Null when it cannot be computed from the declared values, unless SERVICE.md states a different null rule for it. |
| `summary` | One-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across six sections." |
| `stamp` | Plain-text rendering of the same verdict (display name, identity, verdict, per-section statuses, summary) for human-readable records. |

### Verdict vocabulary

| Value | Kind | Meaning |
|---|---|---|
| `CASH_FLOW_FORECAST_READY` | verdict | Every check passes (30/30); the manifest is complete and coherent on the declared evidence. |
| `CASH_FLOW_FORECAST_NOT_READY` | verdict | At least one check fails. Failing checks are named in the `checks` array with their evidence text. |
| `INSUFFICIENT_EVIDENCE` | verdict | Nothing fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply. |
| `within_stated_limits_on_declared_evidence` | `computed_status` | All computed checks that could be completed are within the limits the method itself states. |
| `outside_stated_limits_on_declared_evidence` | `computed_status` | At least one computed check is outside those stated limits. |
| `null` | `computed_status` | At least one computed check could not be completed from the declared values. |
| `pass` | section status | Every check in the section passes. |
| `fail` | section status | At least one check in the section fails. |
| `insufficient_evidence` | section status | No check in the section fails, but at least one is missing. |
| `pass` | per-check status | The requirement stated in the check's evidence text is satisfied. |
| `fail` | per-check status | The field was present but false/invalid, or a computed condition was not met. |
| `missing` | per-check status | The field(s) the check reads were absent — missing evidence, not a failure. |

No other verdict, section-status, or per-check-status values are returned; in particular there is no per-check `not_applicable` status in any recorded case.

### Errors

Only the shapes evidenced in USER-GUIDE.md / the recorded evidence are documented here; no payload shape is invented for statuses whose body was not recorded.

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | Missing or invalid key (USER-GUIDE.md). No body shape is recorded in the evidence; send a valid `Authorization: Bearer <key>` header. |
| 403 | scope | The key lacks this atom's scope (USER-GUIDE.md). Issue the key for this atom (`POST /v1/keys` with this atom's slug); a scope granted for another atom does not transfer. No body shape is recorded in the evidence. |
| 422 | `invalid_input` | Recorded body (verbatim from the malformed case): `{"ok": false, "error": "invalid_input", "field": "forecast.opening_balance", "detail": "forecast.opening_balance must be a number"}` — `ok: false`, `error`, `field` (the exact manifest field) and `detail` (the type it must be). Never a verdict. |
| 429 | rate limit | Rate limit exceeded: 60/min, 10,000/day per key (contract.yaml / USER-GUIDE.md). No body shape is recorded in the evidence; back off and retry after the window. |

### Rate limits and pricing status

- Rate limits (contract.yaml): **60 requests per minute per key** and **10,000 requests per day per key**. Contract note: the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is **null** (`rate_status: pending`). **Free during trial — rate pending.** Prices are set only from measured production cost per unit (SERVICE.md).

## Explanation

### What this atom does, in depth

This atom does not produce a cash-flow forecast and exercises no business judgment (SERVICE.md). It validates one declared forecast artifact against a deliberate cash-management method: flows and lags mapped (recurring, seasonal, one-offs, lag assumptions documented); a 13-week rolling forecast whose weekly closing balances are re-derived from the opening balance and the declared flows; a reserve target that must equal months × fixed costs, held separately and never put at risk; working capital reviewed on cadence with a chase ladder and an AP calendar, and levers applied without using vendors as silent financing; runway re-derived as cash ÷ burn with 6- and 3-month alert thresholds set; the method's three stress cases run with answers recorded and responses pre-decided; and weekly/monthly reporting with no commitments made against unlanded receivables. It checks only the artifact's internal consistency and the completeness of the method on the declared evidence.

### How the verdict is decided

The core is deterministic: same manifest in → same verdict out, byte-identically (verified on the recorded repeat call). Each check reads declared field(s) and lands in exactly one of three states:

- **Absent field = missing evidence.** The check is `missing`; its section is `insufficient_evidence` unless another check in it fails; and if nothing anywhere fails, the verdict is `INSUFFICIENT_EVIDENCE`. Missing is not a failure and is never silently treated as `false`.
- **Present but false / invalid = fail.** The check is `fail`, its section is `fail`, and the verdict is the failing verdict — one failing check is enough, however complete the rest of the manifest is. Must-be-false (red-line) fields work the same way in mirror image: present and `true` = fail.
- **Computed checks** re-derive what can be re-derived from the declared values themselves — arithmetic, set coverage, and stated vocabulary only, importing no outside threshold (see *Checks → Computed checks in detail*). A computed check whose inputs are absent is `missing`, not failed; one whose inputs are present but disagree is `fail`.

Section statuses roll up mechanically (`fail` if any check fails, else `insufficient_evidence` if any is missing, else `pass`), and the verdict rolls up the same way across all 30 checks: `CASH_FLOW_FORECAST_READY` only when every check passes.

### What it does not do

- It does **not** build the forecast, map the caller's actual flows, verify that a declared value is true, or give financial advice. SERVICE.md answers the register's named doubt — finance advice adjacency — with exactly this framing.
- It is **not a forecast review**: it never decides whether the forecast is realistic, whether the reserve is adequate (the method states no size beyond 'size to volatility', so none is imposed), whether the runway is long enough (no minimum is imposed — the 6/3-month figures are alert thresholds, not verdict thresholds), or whether the plan will hold under stress. An artifact can be ready on the declared evidence even if its underlying cash position is weak.
- No production of a forecast from raw business data; no verification of any declared inflow, outflow, balance or receivable; no reserve-adequacy, runway-adequacy or stress-survival judgment; no AR/AP amounts or aging buckets (the method names the review cadence and the chase ladder but states no aging thresholds, so none are imposed); no live verification of any declared fact.

The atom sells its deliverable — the bounded judgment artifact (the verdict object) — never the underlying knowledge or method itself.

### Buyer and use context

First buyer hypothesis (SERVICE.md, from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand. Named self-use: **Business cash runway planning** — Wright is an internal caller (zero price, metered to the internal cost ledger).

## Role views

### For integrators (Users)

- Start with [USER-GUIDE.md](USER-GUIDE.md) for the quick start, then the Tutorial and How-to guides above. One call = one manifest in, one verdict object out; there is no session, upload, or follow-up state to manage.
- Integrate on the REST face (`POST /v1/cash-flow-forecast`) or the MCP face (tool `cash_flow_forecast`) — they return the same verdict object and were parity-verified. Branch on `verdict` first, then on per-check `status` for repair guidance; treat HTTP 422 as a client bug (fix the type named in `field`), 401/403 as key problems, and 429 as back-off.
- Cache by manifest content if you cache at all: the verdict is a pure function of the manifest, so an identical manifest never needs a second paid call.

### For developers

- Manifest authoring: type every field exactly as the Input reference states — booleans as JSON booleans (not `"true"`), numbers as JSON numbers, lists as arrays of strings. A wrong type is a 422 at the gateway, not a failing check; a wrong *value* is a failing check. Vocabulary and coverage fields are validated as strings only and judged as verdict checks, so a misspelled vocabulary entry fails its check rather than erroring.
- Determinism: the core is a deterministic Python oracle with a TypeScript port, parity-proven (TEST-REPORT.md); the recorded REST repeat was byte-identical and MCP structured content was deep-equal to REST. Any fixed serialization rule for computed outputs is stated in *Checks → Computed checks in detail* where SERVICE.md states one.
- Source and tests: implementation in `src/cash_flow_forecast.py`, tests in `tests/test_cash_flow_forecast.py` (same directory as this document). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

- Endpoints: REST `POST https://atoms.pipavia.com/v1/cash-flow-forecast` and MCP `POST https://atoms.pipavia.com/mcp/cash-flow-forecast` on gateway https://atoms.pipavia.com (v1.1.0 at recorded-run time). Status: live — release candidate, one-week RC soak to 2026-11-22; treat verdict-shape changes during the soak as RC incidents, not silent deploys.
- Keys and scope: per-user, per-atom issuance (`POST /v1/keys`); a key's scope for this atom is namespace `cash_flow_forecast` and never verifies for another atom. Watch 403s for mis-issued keys and 401s for missing/invalid headers.
- Limits and monitoring: 60/min and 10,000/day per key; alert on 429 volume (client retry storms), on 422 rate (a client shipping wrongly-typed manifests), and on any drift between REST and MCP verdicts for identical manifests (parity is a verified property — drift is a defect). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-16T01:21:59.564171+00:00 against gateway v1.1.0, external verification lane, source `verification/work/cash-flow-forecast/evidence.json`. The three examples below are that evidence's recorded cases: each shows the case's `input` and the REST execution's `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically after writing — see the checklist).

### Example 1 — full-pass

Recorded expectation: HTTP 200, outcome `CASH_FLOW_FORECAST_READY`. Recorded REST status: 200.

Input:

```json
{
  "entity": "Test Corp",
  "flows": {
    "recurring_inflows_mapped": true,
    "recurring_outflows_mapped": true,
    "seasonal_patterns_mapped": true,
    "one_offs_mapped": true,
    "lag_assumptions_documented": true
  },
  "forecast": {
    "opening_balance": 1000.0,
    "weeks": [
      {
        "label": "W1",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1300.0
      },
      {
        "label": "W2",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1600.0
      },
      {
        "label": "W3",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1900.0
      },
      {
        "label": "W4",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2200.0
      },
      {
        "label": "W5",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2500.0
      },
      {
        "label": "W6",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2800.0
      },
      {
        "label": "W7",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3100.0
      },
      {
        "label": "W8",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3400.0
      },
      {
        "label": "W9",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3700.0
      },
      {
        "label": "W10",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4000.0
      },
      {
        "label": "W11",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4300.0
      },
      {
        "label": "W12",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4600.0
      },
      {
        "label": "W13",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4900.0
      }
    ],
    "rolling_maintained_weekly": true,
    "monthly_annual_planning_present": true
  },
  "reserves": {
    "target_set": true,
    "monthly_fixed_costs": 100.0,
    "target_months": 2.0,
    "declared_target_amount": 200.0,
    "held_separately": true,
    "breach_requires_explicit_decision": true,
    "put_at_risk": false
  },
  "working_capital": {
    "ar_aging_reviewed_on_cadence": true,
    "chase_ladder_applied": true,
    "ap_calendar_maintained": true,
    "inventory_only_where_it_pays": true
  },
  "levers": {
    "inflow_acceleration_applied": true,
    "outflows_phased": true,
    "vendors_used_as_silent_financing": false
  },
  "runway": {
    "cash_on_hand": 1000.0,
    "burn": 100.0,
    "declared_runway_months": 10.0,
    "alert_thresholds_at_6_and_3_months_set": true
  },
  "stress": {
    "cases_run": [
      "revenue_minus_20_percent",
      "collections_plus_30_days_late",
      "surprise_capex"
    ],
    "answers_recorded": true,
    "responses_predecided": true
  },
  "reporting": {
    "weekly_position_and_forecast_reported": true,
    "monthly_summary_drivers_annotated": true
  },
  "commitments": {
    "committed_against_unlanded_receivables": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "cash-flow-forecast",
  "atom_version": "0.1.0",
  "entity": "Test Corp",
  "verdict": "CASH_FLOW_FORECAST_READY",
  "sections": {
    "flows_and_lags": "pass",
    "thirteen_week_forecast": "pass",
    "reserves_and_runway": "pass",
    "working_capital_and_levers": "pass",
    "stress_tests": "pass",
    "reporting_and_commitments": "pass"
  },
  "checks": [
    {
      "section": "flows_and_lags",
      "check": "recurring_inflows_mapped",
      "status": "pass",
      "evidence": "method step 1: recurring inflows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "recurring_outflows_mapped",
      "status": "pass",
      "evidence": "method step 1: recurring outflows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "seasonal_patterns_mapped",
      "status": "pass",
      "evidence": "method step 1: seasonal patterns are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "one_offs_mapped",
      "status": "pass",
      "evidence": "method step 1: one-off flows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "lag_assumptions_documented",
      "status": "pass",
      "evidence": "quality gate: lag assumptions are documented \u2014 payment terms, receivable days, settlement delays"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "forecast_week_entries_complete",
      "status": "pass",
      "evidence": "every weekly bucket carries a label, inflows, outflows, and a closing balance"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "forecast_covers_thirteen_weeks",
      "status": "pass",
      "evidence": "method step 2: the rolling forecast declares exactly 13 weekly buckets \u2014 the horizon the skill names"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "weekly_closing_balances_match_rederived",
      "status": "pass",
      "evidence": "method step 2: each declared weekly closing balance equals the opening balance plus cumulative declared inflows minus outflows"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "rolling_forecast_maintained_weekly",
      "status": "pass",
      "evidence": "quality gate: the rolling forecast is maintained weekly \u2014 stale forecasts cause surprises only"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "monthly_annual_planning_present",
      "status": "pass",
      "evidence": "method step 2: monthly/annual buckets are kept for planning alongside the weekly near-term forecast"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_target_set",
      "status": "pass",
      "evidence": "quality gate: a reserve target is set"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_target_amount_matches_months_times_fixed_costs",
      "status": "pass",
      "evidence": "method step 4: the declared reserve target amount equals the declared months of fixed costs multiplied by the declared monthly fixed costs (minimum cash = X months of fixed costs; X itself is sized to volatility and is not judged here)"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_held_separately",
      "status": "pass",
      "evidence": "quality gate: the reserve is held separately from operating cash"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_breach_requires_explicit_decision",
      "status": "pass",
      "evidence": "quality gate: the reserve is only breached by explicit decision"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserves_not_put_at_risk",
      "status": "pass",
      "evidence": "red line: reserves are never put at risk"
    },
    {
      "section": "reserves_and_runway",
      "check": "runway_matches_cash_divided_by_burn",
      "status": "pass",
      "evidence": "method step 6: the declared runway equals the declared cash divided by the declared burn (burn = net monthly outflow; runway = cash / burn)"
    },
    {
      "section": "reserves_and_runway",
      "check": "runway_alert_thresholds_at_6_and_3_months_set",
      "status": "pass",
      "evidence": "method step 6: alert thresholds are set at 6 and 3 months of runway"
    },
    {
      "section": "working_capital_and_levers",
      "check": "ar_aging_reviewed_on_cadence",
      "status": "pass",
      "evidence": "quality gate: AR aging is reviewed on cadence \u2014 who owes what"
    },
    {
      "section": "working_capital_and_levers",
      "check": "chase_ladder_applied",
      "status": "pass",
      "evidence": "quality gate: the chase ladder is applied to receivables"
    },
    {
      "section": "working_capital_and_levers",
      "check": "ap_calendar_maintained",
      "status": "pass",
      "evidence": "method step 5: an AP calendar is maintained \u2014 discounts vs float"
    },
    {
      "section": "working_capital_and_levers",
      "check": "inventory_only_where_it_pays",
      "status": "pass",
      "evidence": "method step 5: inventory is held only where it pays"
    },
    {
      "section": "working_capital_and_levers",
      "check": "inflow_levers_applied_honestly",
      "status": "pass",
      "evidence": "method step 3: inflows are accelerated honestly \u2014 invoicing discipline, deposits, follow-up cadence"
    },
    {
      "section": "working_capital_and_levers",
      "check": "outflow_levers_phased",
      "status": "pass",
      "evidence": "method step 3: outflows are phased \u2014 terms, batch purchases, timing"
    },
    {
      "section": "working_capital_and_levers",
      "check": "vendors_not_used_as_silent_financing",
      "status": "pass",
      "evidence": "red line: vendors are never used as silent financing \u2014 obligations are never stiffed quietly"
    },
    {
      "section": "stress_tests",
      "check": "stress_cases_cover_stated_cases",
      "status": "pass",
      "evidence": "method step 7: the stress cases run cover every case the skill names \u2014 revenue -20%, collections +30 days late, surprise capex"
    },
    {
      "section": "stress_tests",
      "check": "stress_answers_recorded",
      "status": "pass",
      "evidence": "method step 7: the stress answers are recorded \u2014 does the plan hold, case by case"
    },
    {
      "section": "stress_tests",
      "check": "stress_responses_predecided",
      "status": "pass",
      "evidence": "quality gate: stress responses are pre-decided"
    },
    {
      "section": "reporting_and_commitments",
      "check": "weekly_position_and_forecast_reported",
      "status": "pass",
      "evidence": "method step 8: the weekly cash position and short forecast are reported"
    },
    {
      "section": "reporting_and_commitments",
      "check": "monthly_summary_drivers_annotated",
      "status": "pass",
      "evidence": "method step 8: the monthly summary is reported with drivers annotated"
    },
    {
      "section": "reporting_and_commitments",
      "check": "no_commitments_against_unlanded_receivables",
      "status": "pass",
      "evidence": "red line: no commitments against expected receivables that haven't landed"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "weeks_evaluated": 13,
  "computed_final_balance": "4900.000000",
  "final_balance_difference": "0.000000",
  "computed_reserve_target": "200.000000",
  "reserve_target_difference": "0.000000",
  "computed_runway_months": "10.000000",
  "runway_difference": "0.000000",
  "stress_cases_not_run": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections.",
  "stamp": "CASH-FLOW FORECAST\nentity: Test Corp\nVERDICT: CASH_FLOW_FORECAST_READY\n  flows_and_lags               pass\n  thirteen_week_forecast       pass\n  reserves_and_runway          pass\n  working_capital_and_levers   pass\n  stress_tests                 pass\n  reporting_and_commitments    pass\n30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

### Example 2 — violations

Recorded expectation: HTTP 200, outcome `CASH_FLOW_FORECAST_NOT_READY`. Recorded REST status: 200.

Input:

```json
{
  "entity": "Test Corp",
  "flows": {
    "recurring_inflows_mapped": true,
    "recurring_outflows_mapped": true,
    "seasonal_patterns_mapped": true,
    "one_offs_mapped": true,
    "lag_assumptions_documented": true
  },
  "forecast": {
    "opening_balance": 1000.0,
    "weeks": [
      {
        "label": "W1",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1300.0
      },
      {
        "label": "W2",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1600.0
      },
      {
        "label": "W3",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 1900.0
      },
      {
        "label": "W4",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2200.0
      },
      {
        "label": "W5",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2500.0
      },
      {
        "label": "W6",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 2800.0
      },
      {
        "label": "W7",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3100.0
      },
      {
        "label": "W8",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3400.0
      },
      {
        "label": "W9",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 3700.0
      },
      {
        "label": "W10",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4000.0
      },
      {
        "label": "W11",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4300.0
      },
      {
        "label": "W12",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 4600.0
      },
      {
        "label": "W13",
        "inflows": 500.0,
        "outflows": 200.0,
        "closing_balance": 9999.0
      }
    ],
    "rolling_maintained_weekly": true,
    "monthly_annual_planning_present": true
  },
  "reserves": {
    "target_set": true,
    "monthly_fixed_costs": 100.0,
    "target_months": 2.0,
    "declared_target_amount": 500.0,
    "held_separately": true,
    "breach_requires_explicit_decision": true,
    "put_at_risk": false
  },
  "working_capital": {
    "ar_aging_reviewed_on_cadence": true,
    "chase_ladder_applied": true,
    "ap_calendar_maintained": true,
    "inventory_only_where_it_pays": true
  },
  "levers": {
    "inflow_acceleration_applied": true,
    "outflows_phased": true,
    "vendors_used_as_silent_financing": false
  },
  "runway": {
    "cash_on_hand": 1000.0,
    "burn": 100.0,
    "declared_runway_months": 5.0,
    "alert_thresholds_at_6_and_3_months_set": true
  },
  "stress": {
    "cases_run": [
      "revenue_minus_20_percent"
    ],
    "answers_recorded": true,
    "responses_predecided": true
  },
  "reporting": {
    "weekly_position_and_forecast_reported": true,
    "monthly_summary_drivers_annotated": true
  },
  "commitments": {
    "committed_against_unlanded_receivables": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "cash-flow-forecast",
  "atom_version": "0.1.0",
  "entity": "Test Corp",
  "verdict": "CASH_FLOW_FORECAST_NOT_READY",
  "sections": {
    "flows_and_lags": "pass",
    "thirteen_week_forecast": "fail",
    "reserves_and_runway": "fail",
    "working_capital_and_levers": "pass",
    "stress_tests": "fail",
    "reporting_and_commitments": "fail"
  },
  "checks": [
    {
      "section": "flows_and_lags",
      "check": "recurring_inflows_mapped",
      "status": "pass",
      "evidence": "method step 1: recurring inflows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "recurring_outflows_mapped",
      "status": "pass",
      "evidence": "method step 1: recurring outflows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "seasonal_patterns_mapped",
      "status": "pass",
      "evidence": "method step 1: seasonal patterns are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "one_offs_mapped",
      "status": "pass",
      "evidence": "method step 1: one-off flows are mapped"
    },
    {
      "section": "flows_and_lags",
      "check": "lag_assumptions_documented",
      "status": "pass",
      "evidence": "quality gate: lag assumptions are documented \u2014 payment terms, receivable days, settlement delays"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "forecast_week_entries_complete",
      "status": "pass",
      "evidence": "every weekly bucket carries a label, inflows, outflows, and a closing balance"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "forecast_covers_thirteen_weeks",
      "status": "pass",
      "evidence": "method step 2: the rolling forecast declares exactly 13 weekly buckets \u2014 the horizon the skill names"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "weekly_closing_balances_match_rederived",
      "status": "fail",
      "evidence": "method step 2: each declared weekly closing balance equals the opening balance plus cumulative declared inflows minus outflows"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "rolling_forecast_maintained_weekly",
      "status": "pass",
      "evidence": "quality gate: the rolling forecast is maintained weekly \u2014 stale forecasts cause surprises only"
    },
    {
      "section": "thirteen_week_forecast",
      "check": "monthly_annual_planning_present",
      "status": "pass",
      "evidence": "method step 2: monthly/annual buckets are kept for planning alongside the weekly near-term forecast"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_target_set",
      "status": "pass",
      "evidence": "quality gate: a reserve target is set"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_target_amount_matches_months_times_fixed_costs",
      "status": "fail",
      "evidence": "method step 4: the declared reserve target amount equals the declared months of fixed costs multiplied by the declared monthly fixed costs (minimum cash = X months of fixed costs; X itself is sized to volatility and is not judged here)"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_held_separately",
      "status": "pass",
      "evidence": "quality gate: the reserve is held separately from operating cash"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserve_breach_requires_explicit_decision",
      "status": "pass",
      "evidence": "quality gate: the reserve is only breached by explicit decision"
    },
    {
      "section": "reserves_and_runway",
      "check": "reserves_not_put_at_risk",
      "status": "pass",
      "evidence": "red line: reserves are never put at risk"
    },
    {
      "section": "reserves_and_runway",
      "check": "runway_matches_cash_divided_by_burn",
      "status": "fail",
      "evidence": "method step 6: the declared runway equals the declared cash divided by the declared burn (burn = net monthly outflow; runway = cash / burn)"
    },
    {
      "section": "reserves_and_runway",
      "check": "runway_alert_thresholds_at_6_and_3_months_set",
      "status": "pass",
      "evidence": "method step 6: alert thresholds are set at 6 and 3 months of runway"
    },
    {
      "section": "working_capital_and_levers",
      "check": "ar_aging_reviewed_on_cadence",
      "status": "pass",
      "evidence": "quality gate: AR aging is reviewed on cadence \u2014 who owes what"
    },
    {
      "section": "working_capital_and_levers",
      "check": "chase_ladder_applied",
      "status": "pass",
      "evidence": "quality gate: the chase ladder is applied to receivables"
    },
    {
      "section": "working_capital_and_levers",
      "check": "ap_calendar_maintained",
      "status": "pass",
      "evidence": "method step 5: an AP calendar is maintained \u2014 discounts vs float"
    },
    {
      "section": "working_capital_and_levers",
      "check": "inventory_only_where_it_pays",
      "status": "pass",
      "evidence": "method step 5: inventory is held only where it pays"
    },
    {
      "section": "working_capital_and_levers",
      "check": "inflow_levers_applied_honestly",
      "status": "pass",
      "evidence": "method step 3: inflows are accelerated honestly \u2014 invoicing discipline, deposits, follow-up cadence"
    },
    {
      "section": "working_capital_and_levers",
      "check": "outflow_levers_phased",
      "status": "pass",
      "evidence": "method step 3: outflows are phased \u2014 terms, batch purchases, timing"
    },
    {
      "section": "working_capital_and_levers",
      "check": "vendors_not_used_as_silent_financing",
      "status": "pass",
      "evidence": "red line: vendors are never used as silent financing \u2014 obligations are never stiffed quietly"
    },
    {
      "section": "stress_tests",
      "check": "stress_cases_cover_stated_cases",
      "status": "fail",
      "evidence": "method step 7: the stress cases run cover every case the skill names \u2014 revenue -20%, collections +30 days late, surprise capex"
    },
    {
      "section": "stress_tests",
      "check": "stress_answers_recorded",
      "status": "pass",
      "evidence": "method step 7: the stress answers are recorded \u2014 does the plan hold, case by case"
    },
    {
      "section": "stress_tests",
      "check": "stress_responses_predecided",
      "status": "pass",
      "evidence": "quality gate: stress responses are pre-decided"
    },
    {
      "section": "reporting_and_commitments",
      "check": "weekly_position_and_forecast_reported",
      "status": "pass",
      "evidence": "method step 8: the weekly cash position and short forecast are reported"
    },
    {
      "section": "reporting_and_commitments",
      "check": "monthly_summary_drivers_annotated",
      "status": "pass",
      "evidence": "method step 8: the monthly summary is reported with drivers annotated"
    },
    {
      "section": "reporting_and_commitments",
      "check": "no_commitments_against_unlanded_receivables",
      "status": "fail",
      "evidence": "red line: no commitments against expected receivables that haven't landed"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "weeks_evaluated": 13,
  "computed_final_balance": "4900.000000",
  "final_balance_difference": "5099.000000",
  "computed_reserve_target": "200.000000",
  "reserve_target_difference": "300.000000",
  "computed_runway_months": "10.000000",
  "runway_difference": "-5.000000",
  "stress_cases_not_run": [
    "collections_plus_30_days_late",
    "surprise_capex"
  ],
  "summary": "25 pass, 5 fail, 0 missing of 30 checks across six sections.",
  "stamp": "CASH-FLOW FORECAST\nentity: Test Corp\nVERDICT: CASH_FLOW_FORECAST_NOT_READY\n  flows_and_lags               pass\n  thirteen_week_forecast       fail\n  reserves_and_runway          fail\n  working_capital_and_levers   pass\n  stress_tests                 fail\n  reporting_and_commitments    fail\n25 pass, 5 fail, 0 missing of 30 checks across six sections."
}
```

### Example 3 — malformed

Recorded expectation: HTTP 422, no verdict (rejected as invalid input). Recorded REST status: 422.

Input:

```json
{
  "forecast": {
    "opening_balance": "one thousand"
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "forecast.opening_balance",
  "detail": "forecast.opening_balance must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes; Developers Yes; Ops Yes; Regulators: N/A — although the domain is finance, SERVICE.md scopes the atom to validating a *declared* artifact's internal consistency and states it does not give financial advice and is not a forecast review; the verdict is advisory validation for the caller, not compliance or audit evidence for a regulator. |
| Checks named: documented / recorded | 30 / 30 (from the recorded full-pass REST `checks` array, cross-checked against SERVICE.md) |
| Verdict vocabulary complete | Yes — all 3 verdicts (`CASH_FLOW_FORECAST_READY`, `CASH_FLOW_FORECAST_NOT_READY`, `INSUFFICIENT_EVIDENCE`), `computed_status` values including null, section statuses and per-check statuses |
| Input reference typed | Yes — 38 fields, each with a type from SERVICE.md's field table, grouped as SERVICE.md groups them, gates/conditionals preserved in Notes |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/cash-flow-forecast/evidence.json` after writing; all matched |
| Errors documented from evidence only | Yes — 422 shape verbatim from the recorded malformed case; 401/403/429 documented at the status/meaning level evidenced in USER-GUIDE.md and contract.yaml, with no invented payload |

