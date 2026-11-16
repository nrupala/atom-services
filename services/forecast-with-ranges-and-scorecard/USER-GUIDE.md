# Forecast with ranges and scorecard — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You maintain a forecast. This atom reads a short evidence manifest describing it — purpose and horizon, computed baselines and decomposition, an ordered low/base/high range with scenarios, a published accuracy scorecard whose declared MAE/MAPE/bias the atom recomputes from your forecast-vs-actual history, revision hygiene and cadence — and returns one deterministic verdict across six sections with per-check evidence: **FORECAST_READY**, **FORECAST_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "forecast-with-ranges-and-scorecard"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/forecast-with-ranges-and-scorecard`
  — tool name `forecast_with_ranges_and_scorecard`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/forecast-with-ranges-and-scorecard`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `forecast.purpose_stated` |
| `forecast.horizon_stated` |
| `forecast.decision_cadence_matched` |
| `forecast.owner_named` |
| `baselines.compared_to_forecast` |
| `decomposition.level_trend_seasonality_shown` |
| `scenario_detail.sensitivity_shown` |
| `scorecard.published` |
| `scorecard.tracked_per_series` |
| `revision.forecast_actual_history_preserved` |
| `cadence.rolling_forecast_maintained` |
| `cadence.cadence_matches_review_rhythm` |
| `cadence.forecast_updated_on_cadence` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/forecast-with-ranges-and-scorecard`:

```json
{
  "series": "revenue_q1_2026",
  "forecast": {
    "purpose_stated": true,
    "horizon_stated": true,
    "decision_cadence_matched": true,
    "owner_named": true
  },
  "baselines": {
    "naive_value": 100,
    "moving_average_value": 105,
    "seasonal_naive_value": 110,
    "compared_to_forecast": true,
    "complex_model_used": true,
    "complex_model_beats_baselines": true
  },
  "decomposition": {
    "level_trend_seasonality_shown": true,
    "drivers_known": true,
    "driver_based_shown": true
  },
  "range": {
    "low": 90,
    "base": 100,
    "high": 110
  },
  "scenarios": [
    {
      "name": "base",
      "trigger_condition": "normal"
    },
    {
      "name": "best",
      "trigger_condition": "growth"
    },
    {
      "name": "worst",
      "trigger_condition": "recession"
    }
  ],
  "scenario_detail": {
    "sensitivity_shown": true
  },
  "scorecard": {
    "published": true,
    "tracked_per_series": true,
    "history": [
      {
        "period": "2025-Q4",
        "forecast": 100,
        "actual": 100
      }
    ],
    "declared_mae": 0.0,
    "declared_mape_percent": 0.0,
    "declared_bias": 0.0
  },
  "revision": {
    "forecast_actual_history_preserved": true,
    "revisions_made": true,
    "revision_reasons_documented": true,
    "silently_restated": false
  },
  "cadence": {
    "rolling_forecast_maintained": true,
    "cadence_matches_review_rhythm": true,
    "forecast_updated_on_cadence": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "forecast-with-ranges-and-scorecard",
  "atom_version": "0.1.0",
  "series": "revenue_q1_2026",
  "verdict": "FORECAST_READY",
  "sections": {
    "purpose_and_horizon": "pass",
    "baselines_and_decomposition": "pass",
    "ranges_and_scenarios": "pass",
    "scorecard_accuracy": "pass",
    "revision_hygiene": "pass",
    "cadence": "pass"
  },
  "summary": "25 pass, 0 fail, 0 missing of 25 checks across six sections.",
  "checks": [
    {
      "section": "purpose_and_horizon",
      "check": "purpose_stated",
      "status": "pass",
      "evidence": "purpose stated: what decision this forecast feeds"
    },
    {
      "section": "purpose_and_horizon",
      "check": "horizon_stated",
      "status": "pass",
      "evidence": "horizon stated: operational (weeks) vs strategic (years)"
    }
  ]
}
```

## Verdicts

- **FORECAST_READY** — every check passes (25/25); the forecast clears all six sections.
- **FORECAST_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
