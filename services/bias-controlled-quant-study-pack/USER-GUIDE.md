# Bias controlled quant study pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are working a single market study through a quant-research method, with bias control at its centre. This atom reads one declared study pack — preregistered hypothesis, data hygiene, distribution reality, stationarity and stability, multiple-testing discipline, costs, and reproducibility — and returns one deterministic verdict across seven sections: **STUDY_PACK_COMPLETE**, **STUDY_PACK_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the declared cost list must cover all five stated costs (spreads, fees, slippage, borrow, taxes); the stability periods must name at least two distinct periods; and the signals reported must not exceed the signals tested. Same manifest in → same verdict out. It audits the declared pack only — it does not fetch market data, run the study, or verify that a declared value is true.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "bias-controlled-quant-study-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/bias-controlled-quant-study-pack` — tool name `bias_controlled_quant_study_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/bias-controlled-quant-study-pack` — body = the manifest object; same `Authorization` header.

## Input — the bias-controlled-quant-study-pack manifest

| Field | Meaning |
|---|---|
| `study` | study text (string; carried into the output, not checked) |
| `hypothesis.hypothesis_written` / `prediction_stated` / `falsification_test_defined` | hypothesis preregistration evidence |
| `hypothesis.results_looked_at_before_registration` | must be `false` to pass |
| `data.provenance_documented` / `snapshot_version_documented` / `adjusted_prices` / `delisted_names_retained` / `point_in_time_fundamentals` / `timezone_timestamp_discipline` | data hygiene evidence |
| `data.survivorship_gap_present` / `restatement_peeking` | both must be `false` to pass |
| `distribution.fat_tails_considered` / `volatility_clustering_considered` / `crisis_correlations_considered` | distribution reality evidence |
| `distribution.gaussian_assumed` | must be `false` to pass |
| `stationarity.stability_tested` / `regime_context_provided` / `mechanism_stated` | stationarity and stability evidence |
| `stationarity.stability_periods` (list of strings) | computed: must name at least two distinct periods; distinct count reported as `stability_period_count` |
| `stationarity.claim_made_without_regime_context` | must be `false` to pass |
| `multiple_testing.controlled` / `deflated_significance_applied` / `holdout_used` | multiple-testing evidence |
| `multiple_testing.signals_tested` (number), `multiple_testing.signals_reported` (number) | computed: both whole numbers, zero or more, reported must not exceed tested; reported as `signals_tested`, `signals_reported` and `signals_reported_minus_tested` |
| `multiple_testing.p_hacked_screen_presented_as_strategy` / `result_from_single_sample` | both must be `false` to pass |
| `costs.costs_included` / `results_net_of_costs` | cost evidence |
| `costs.included` (list of strings) | computed: must contain all five — `spreads`, `fees`, `slippage`, `borrow`, `taxes`; omitted ones reported as `costs_not_included` |
| `reproducibility.seeded_runs` / `snapshot_pinned` / `code_versioned` / `rerunnable_by_others` | reproducibility evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward STUDY_PACK_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/bias-controlled-quant-study-pack`:

```json
{
  "study": "Market Alpha Study 2024",
  "hypothesis": {
    "hypothesis_written": true,
    "prediction_stated": true,
    "falsification_test_defined": true,
    "results_looked_at_before_registration": false
  },
  "data": {
    "provenance_documented": true,
    "snapshot_version_documented": true,
    "adjusted_prices": true,
    "delisted_names_retained": true,
    "survivorship_gap_present": false,
    "point_in_time_fundamentals": true,
    "restatement_peeking": false,
    "timezone_timestamp_discipline": true
  },
  "distribution": {
    "fat_tails_considered": true,
    "volatility_clustering_considered": true,
    "gaussian_assumed": false,
    "crisis_correlations_considered": true
  },
  "stationarity": {
    "stability_tested": true,
    "stability_periods": [
      "2010-2015",
      "2016-2020"
    ],
    "regime_context_provided": true,
    "mechanism_stated": true,
    "claim_made_without_regime_context": false
  },
  "multiple_testing": {
    "controlled": true,
    "deflated_significance_applied": true,
    "holdout_used": true,
    "signals_tested": 100,
    "signals_reported": 5,
    "p_hacked_screen_presented_as_strategy": false,
    "result_from_single_sample": false
  },
  "costs": {
    "costs_included": true,
    "included": [
      "spreads",
      "fees",
      "slippage",
      "borrow",
      "taxes"
    ],
    "results_net_of_costs": true
  },
  "reproducibility": {
    "seeded_runs": true,
    "snapshot_pinned": true,
    "code_versioned": true,
    "rerunnable_by_others": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 34 checks and a text stamp of the verdict):

```json
{
  "service": "bias-controlled-quant-study-pack",
  "atom_version": "0.1.0",
  "study": "Market Alpha Study 2024",
  "verdict": "STUDY_PACK_COMPLETE",
  "sections": {
    "hypothesis_preregistration": "pass",
    "data_hygiene": "pass",
    "distribution_reality": "pass",
    "stationarity_and_stability": "pass",
    "multiple_testing": "pass",
    "costs": "pass",
    "reproducibility": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "stability_period_count": 2,
  "signals_tested": 100,
  "signals_reported": 5,
  "signals_reported_minus_tested": -95,
  "costs_not_included": [],
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across seven sections."
}
```

## Verdicts

- **STUDY_PACK_COMPLETE** — every check passes; the study pack is complete on the declared evidence.
- **STUDY_PACK_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `stability_period_count` (distinct stability periods, or null), `signals_tested`, `signals_reported` and `signals_reported_minus_tested` (each null when it cannot be computed), `costs_not_included` (omitted stated costs, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
