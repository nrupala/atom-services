# Forecast with ranges and scorecard — `forecast-with-ranges-and-scorecard`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Forecast with discipline — baselines, seasonality, drivers, ranges, accuracy tracking, revision hygiene.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Portfolio revenue and demand forecasting**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the forecast-artifact manifest

This atom does not produce a forecast and makes no forecast judgment.
The caller submits one JSON manifest declaring a forecast artifact —
its baselines, range, scenarios, and past-forecast scorecard — and
the atom validates that artifact deterministically. Every field below
is read by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`FORECAST_NOT_READY`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `series` (string; carried into the verdict output, not itself checked) | — |
| `forecast.purpose_stated` | purpose_and_horizon |
| `forecast.horizon_stated` | purpose_and_horizon |
| `forecast.decision_cadence_matched` | purpose_and_horizon |
| `forecast.owner_named` | purpose_and_horizon |
| `baselines.naive_value` (number; with the two baselines below, all three must be present as numbers) | baselines_and_decomposition |
| `baselines.moving_average_value` (number; see above) | baselines_and_decomposition |
| `baselines.seasonal_naive_value` (number; see above) | baselines_and_decomposition |
| `baselines.compared_to_forecast` | baselines_and_decomposition |
| `baselines.complex_model_used` (gates the beats-baseline check below) | baselines_and_decomposition |
| `baselines.complex_model_beats_baselines` (required when a complex model is used; otherwise the check passes as not applicable) | baselines_and_decomposition |
| `decomposition.level_trend_seasonality_shown` | baselines_and_decomposition |
| `decomposition.drivers_known` (gates the driver-based check below) | baselines_and_decomposition |
| `decomposition.driver_based_shown` (required when drivers are known; otherwise the check passes as not applicable) | baselines_and_decomposition |
| `range.low` (number; must be ≤ `range.base` and < `range.high`) | ranges_and_scenarios |
| `range.base` (number) | ranges_and_scenarios |
| `range.high` (number) | ranges_and_scenarios |
| `scenarios` (list of scenarios; absent / not a list / empty = both computed scenario checks missing) | ranges_and_scenarios |
| `scenarios[].name` (string; the set must cover `"base"`, `"best"` and `"worst"`) | ranges_and_scenarios |
| `scenarios[].trigger_condition` (non-empty string; required on every scenario) | ranges_and_scenarios |
| `scenario_detail.sensitivity_shown` | ranges_and_scenarios |
| `scorecard.published` | scorecard_accuracy |
| `scorecard.tracked_per_series` | scorecard_accuracy |
| `scorecard.history` (list of past forecast-vs-actual entries; absent / not a list / empty = all computed scorecard checks missing) | scorecard_accuracy |
| `scorecard.history[].period` (non-empty string) | scorecard_accuracy |
| `scorecard.history[].forecast` (number) | scorecard_accuracy |
| `scorecard.history[].actual` (number) | scorecard_accuracy |
| `scorecard.declared_mae` (number; compared against the MAE recomputed from the history) | scorecard_accuracy |
| `scorecard.declared_mape_percent` (number; MAPE in percent, recomputed over entries with a non-zero actual) | scorecard_accuracy |
| `scorecard.declared_bias` (number; mean signed error, forecast − actual, recomputed from the history) | scorecard_accuracy |
| `revision.forecast_actual_history_preserved` | revision_hygiene |
| `revision.revisions_made` (gates the reasons check below) | revision_hygiene |
| `revision.revision_reasons_documented` (required when revisions were made; otherwise the check passes as not applicable) | revision_hygiene |
| `revision.silently_restated` (must be `false` to pass) | revision_hygiene |
| `cadence.rolling_forecast_maintained` | cadence |
| `cadence.cadence_matches_review_rhythm` | cadence |
| `cadence.forecast_updated_on_cadence` | cadence |

Four checks are computed, not declared: the three baseline values
must all be present as numbers; the declared range must satisfy
low ≤ base ≤ high with low < high (a bare point is false precision);
the declared scenarios must cover base / best / worst, each with a
trigger condition; and the scorecard's declared MAE, MAPE and bias
are recomputed from the declared forecast-vs-actual history and must
agree within 0.01 (the declared values are understood to be rounded
to two decimals). No accuracy threshold is invented by the atom —
it checks that the scorecard is honest about its own history, never
that the forecast was good enough. The verdict dict also reports
`history_entries_evaluated` and `scenarios_evaluated` counts.

The verdict is one of `FORECAST_READY` (all 25 checks pass),
`FORECAST_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
purpose_and_horizon, baselines_and_decomposition,
ranges_and_scenarios, scorecard_accuracy, revision_hygiene, cadence.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Methods are commodity; scorecard differentiates
