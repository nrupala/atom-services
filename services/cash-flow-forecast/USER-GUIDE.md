# Cash flow forecast — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a cash-flow forecast artifact — a 13-week rolling forecast with its flow map, reserve target, runway declaration, stress record and reporting record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CASH_FLOW_FORECAST_READY**, **CASH_FLOW_FORECAST_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not build a forecast or judge whether the numbers are realistic. Computed checks: the forecast must declare exactly 13 weekly buckets and every declared weekly closing balance must equal the opening balance plus cumulative inflows minus outflows; the declared reserve target must equal target months × monthly fixed costs (no minimum months is imposed); the declared runway must equal cash on hand ÷ burn, with a positive burn (no minimum runway is imposed — the 6/3-month figures are alert thresholds, not pass marks); and the stress record must cover the three stated cases — revenue −20%, collections +30 days late, surprise capex. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cash-flow-forecast"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/cash-flow-forecast` — tool name `cash_flow_forecast`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/cash-flow-forecast` — body = the manifest object; same `Authorization` header.

## Input — the cash-flow-forecast manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `flows.recurring_inflows_mapped` / `recurring_outflows_mapped` / `seasonal_patterns_mapped` / `one_offs_mapped` / `lag_assumptions_documented` | flow map and lag evidence |
| `forecast.opening_balance` (number) | opening balance the weekly closings are re-derived from |
| `forecast.weeks` (list of weekly buckets) | computed: must declare exactly 13 buckets; each bucket needs a non-empty `label` (string) and numeric `inflows`, `outflows` and `closing_balance`; each closing must equal opening + cumulative inflows − outflows; reported as `weeks_evaluated`, `computed_final_balance` and `final_balance_difference` (6 decimal places) |
| `forecast.rolling_maintained_weekly` / `monthly_annual_planning_present` | forecast maintenance evidence |
| `reserves.target_set` / `held_separately` / `breach_requires_explicit_decision` | reserve evidence |
| `reserves.monthly_fixed_costs` (number), `reserves.target_months` (number), `reserves.declared_target_amount` (number) | computed: declared target must equal target months × monthly fixed costs; reported as `computed_reserve_target` and `reserve_target_difference` (6 decimal places) |
| `reserves.put_at_risk` | must be `false` to pass |
| `working_capital.ar_aging_reviewed_on_cadence` / `chase_ladder_applied` / `ap_calendar_maintained` / `inventory_only_where_it_pays` | working-capital evidence |
| `levers.inflow_acceleration_applied` / `outflows_phased` | lever evidence |
| `levers.vendors_used_as_silent_financing` | must be `false` to pass |
| `runway.cash_on_hand` (number), `runway.burn` (number), `runway.declared_runway_months` (number) | computed: declared runway must equal cash on hand ÷ burn (burn must be positive); reported as `computed_runway_months` and `runway_difference` (6 decimal places) |
| `runway.alert_thresholds_at_6_and_3_months_set` | alert-threshold declaration (checked as set, never as a pass mark on the runway) |
| `stress.cases_run` (list of strings) | computed: must contain all three stated cases — `revenue_minus_20_percent`, `collections_plus_30_days_late`, `surprise_capex`; omitted ones reported as `stress_cases_not_run` |
| `stress.answers_recorded` / `responses_predecided` | stress record evidence |
| `reporting.weekly_position_and_forecast_reported` / `monthly_summary_drivers_annotated` | reporting evidence |
| `commitments.committed_against_unlanded_receivables` | must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CASH_FLOW_FORECAST_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/cash-flow-forecast`:

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

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "weeks_evaluated": 13,
  "computed_final_balance": "4900.000000",
  "final_balance_difference": "0.000000",
  "computed_reserve_target": "200.000000",
  "reserve_target_difference": "0.000000",
  "computed_runway_months": "10.000000",
  "runway_difference": "0.000000",
  "stress_cases_not_run": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections."
}
```

## Verdicts

- **CASH_FLOW_FORECAST_READY** — every check passes; the forecast artifact is complete and internally consistent on the declared evidence.
- **CASH_FLOW_FORECAST_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `weeks_evaluated` (count of complete weekly entries), `computed_final_balance` and `final_balance_difference`, `computed_reserve_target` and `reserve_target_difference`, `computed_runway_months` and `runway_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `stress_cases_not_run` (omitted stated stress cases, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
