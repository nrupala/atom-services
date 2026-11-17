# Confidence scoreboard — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You keep a ledger of resolved binary probabilistic forecasts by named human forecasters — each claim with the probability its forecaster stated before resolution and its binary outcome (0 or 1) — and you publish a per-forecaster scoreboard over that ledger. This atom reads one declared manifest and returns one deterministic verdict across five sections: **CONFIDENCE_SCOREBOARD_SOUND**, **CONFIDENCE_SCOREBOARD_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It recomputes every per-forecaster aggregate and the ranking from the ledger and checks the published scoreboard is honest about its own ledger. It audits the declared record's completeness and consistency only — it resolves no claim itself, reads no outcome source, verifies no timestamp, and does not verify that a declared control actually works. A scoreboard is sound *on your declared evidence*: it is not a forecasting service, not a forecaster certification, and not a judgment that any forecaster is good — it never judges whether a stated probability was wise, whether a claim was worth predicting, whether the resolution criteria were fair, or whether the best-ranked forecaster will stay best. It produces no forecast of its own, reads no baseline value, range, scenario, or numeric forecast-vs-actual pair (that is the sibling `forecast-with-ranges-and-scorecard`'s ground), and involves no ML model — no features, no split, no holdout. Computed checks: the declared `forecasts` list must be present and non-empty with every row naming a non-empty `forecaster`, stating a non-empty `claim`, stating a `stated_probability` inside [0, 1], and recording an `outcome` of exactly 0 or 1; the declared `scoreboard` list must be present and non-empty, cover exactly the forecasters in the ledger with no duplicates, and every row's `forecasts_count`, `mean_stated_probability`, `hit_rate`, `calibration_gap` (|mean stated probability − hit rate|) and `brier_score` (mean of (stated probability − outcome)²) must agree with the values recomputed from that forecaster's ledger rows at the fixed 6-decimal serialization; and the published `rank` values must be exactly 1..N and follow the recomputed Brier order (lower Brier ranks first; ties break by forecaster name, ascending). No numeric threshold is imposed — no tolerated calibration gap, no Brier-score pass bar, no hit-rate bar, no minimum forecasts per forecaster, no probability-bucket scheme, no overconfidence gap bar, and no rank-separation margin; quantities are computed and reported, and completeness and declared-vs-recomputed agreement are the only bars. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "forecast-confidence-scoreboard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/forecast-confidence-scoreboard` — tool name `forecast_confidence_scoreboard`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/forecast-confidence-scoreboard` — body = the manifest object; same `Authorization` header.

## Input — the forecast-confidence-scoreboard manifest

| Field | Meaning |
|---|---|
| `subject` | scoreboard subject (string; carried into the output, not checked) |
| `record.resolution_criteria_predeclared` | ledger evidence: the criteria that resolve each claim are declared before outcomes are known |
| `record.forecasts_recorded_before_resolution` | ledger evidence: every forecast is recorded before its outcome resolves — no peeking / leakage |
| `record.unresolved_forecasts_excluded` | ledger evidence: only resolved forecasts are scored — unresolved forecasts are excluded |
| `forecasts` (list of forecast-row objects) | computed: must be present and non-empty; reported as `forecasts_count` |
| `forecasts[].forecaster` (string) | names the row's forecaster in the computed outputs; must be a non-empty string |
| `forecasts[].claim` (string) | the claim that was predicted; must be a non-empty string |
| `forecasts[].stated_probability` (number) | the probability stated before resolution; must lie in [0, 1] to pass and to enter any aggregate |
| `forecasts[].outcome` (number) | the binary outcome; must be exactly 0 or 1 to pass and to enter any aggregate |
| `scoreboard` (list of scoreboard-row objects) | computed: must be present and non-empty; must cover exactly the forecasters in the ledger, with no duplicate rows |
| `scoreboard[].forecaster` (string) | names the row's forecaster |
| `scoreboard[].forecasts_count` (number) | recomputed as the count of ledger rows naming this forecaster |
| `scoreboard[].mean_stated_probability` (number) | recomputed as the mean of this forecaster's stated probabilities |
| `scoreboard[].hit_rate` (number) | recomputed as the mean of this forecaster's outcomes |
| `scoreboard[].calibration_gap` (number) | recomputed as \|mean stated probability − hit rate\| for this forecaster |
| `scoreboard[].brier_score` (number) | recomputed as the mean of (stated probability − outcome)² for this forecaster |
| `scoreboard[].rank` (number) | must be integral, the ranks together exactly 1..N, and must follow the recomputed Brier order (lower Brier first; ties by forecaster name ascending) |
| `confidence_reporting.calibration_reported_per_forecaster` | calibration evidence: calibration is reported per forecaster, not only in aggregate |
| `confidence_reporting.outputs_are_probabilities` | calibration evidence: the scoreboard reports stated probabilities, not bare point verdicts |
| `confidence_reporting.calibration_reported_not_just_ranking` | calibration evidence: calibration is reported alongside any ranking — not just ranking ability |
| `confidence_reporting.worst_forecaster_surfaced` | calibration evidence: the worst-calibrated forecaster is surfaced, not hidden in the aggregate |
| `scoreboard_use.decision_stated` | use evidence: the decision this scoreboard drives — whose forecasts get trusted or weighted — is stated |
| `scoreboard_use.decision_costs_considered` | use evidence: the metric is chosen from the decision's costs — false positives vs false negatives rarely cost the same |
| `honesty.metric_chosen_to_flatter_present` | must be `false` to pass (red line: no metric chosen to flatter a forecaster) |
| `honesty.silent_score_rewrites_present` | must be `false` to pass (red line: published scores are never silently rewritten after resolution) |
| `honesty.scores_refreshed_as_outcomes_resolve` | honesty evidence: scores are refreshed as new outcomes resolve |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CONFIDENCE_SCOREBOARD_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/forecast-confidence-scoreboard`:

```json
{
  "subject": "Q1 2024 Revenue",
  "record": {
    "resolution_criteria_predeclared": true,
    "forecasts_recorded_before_resolution": true,
    "unresolved_forecasts_excluded": true
  },
  "forecasts": [
    {
      "forecaster": "Alice",
      "claim": "Revenue > 1M",
      "stated_probability": 0.8,
      "outcome": 1
    },
    {
      "forecaster": "Bob",
      "claim": "Revenue > 1M",
      "stated_probability": 0.4,
      "outcome": 1
    }
  ],
  "scoreboard": [
    {
      "forecaster": "Alice",
      "forecasts_count": 1,
      "mean_stated_probability": 0.8,
      "hit_rate": 1.0,
      "calibration_gap": 0.2,
      "brier_score": 0.04,
      "rank": 1
    },
    {
      "forecaster": "Bob",
      "forecasts_count": 1,
      "mean_stated_probability": 0.4,
      "hit_rate": 1.0,
      "calibration_gap": 0.6,
      "brier_score": 0.36,
      "rank": 2
    }
  ],
  "confidence_reporting": {
    "calibration_reported_per_forecaster": true,
    "outputs_are_probabilities": true,
    "calibration_reported_not_just_ranking": true,
    "worst_forecaster_surfaced": true
  },
  "scoreboard_use": {
    "decision_stated": true,
    "decision_costs_considered": true
  },
  "honesty": {
    "metric_chosen_to_flatter_present": false,
    "silent_score_rewrites_present": false,
    "scores_refreshed_as_outcomes_resolve": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks and a text stamp of the verdict):

```json
{
  "service": "forecast-confidence-scoreboard",
  "atom_version": "0.1.0",
  "subject": "Q1 2024 Revenue",
  "verdict": "CONFIDENCE_SCOREBOARD_SOUND",
  "sections": {
    "ledger_and_resolution": "pass",
    "per_forecaster_scoring": "pass",
    "calibration_reporting": "pass",
    "ranking_integrity": "pass",
    "honesty_and_live_use": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "forecasts_count": 2,
  "forecasters_count": 2,
  "overall_mean_stated_probability": "0.600000",
  "overall_hit_rate": "1.000000",
  "overall_calibration_gap": "0.400000",
  "overall_brier_score": "0.200000",
  "calibration_direction": "underconfident",
  "worst_calibrated_forecaster": "Bob",
  "forecasters_without_scoreboard_row": [],
  "scoreboard_rows_without_forecasts": [],
  "mismatched_scoreboard_rows": [],
  "forecasters_with_wrong_rank": [],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across five sections."
}
```

## Verdicts

- **CONFIDENCE_SCOREBOARD_SOUND** — every check passes; the declared forecast-confidence record is complete and its published scoreboard is the scoreboard of its own ledger.
- **CONFIDENCE_SCOREBOARD_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fourteen primary computed checks cannot be completed), `forecasts_count` (the declared ledger length as an integer, or null when the list is not declared), `forecasters_count` (distinct non-empty forecaster names in the ledger, or null), the overall aggregates `overall_mean_stated_probability`, `overall_hit_rate`, `overall_calibration_gap` and `overall_brier_score` (computed over the stats-valid ledger entries, as strings with exactly six decimal places — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then formatted with exactly six decimals; null when there are no stats-valid entries), `calibration_direction` (`overconfident` when the overall mean stated probability exceeds the hit rate, `underconfident` when it falls below, `exact` when equal, null when there are no stats-valid entries — reported, never failed), `worst_calibrated_forecaster` (the forecaster with the highest per-forecaster calibration gap; ties break to the first name in ascending order; null when no forecaster has a stats-valid entry), the name lists `forecasters_without_scoreboard_row` and `scoreboard_rows_without_forecasts` (null when either list is not declared), `mismatched_scoreboard_rows` (scoreboard rows whose present count or aggregate fields disagree with the recomputed values; null when either list is not declared) and `forecasters_with_wrong_rank` (null when the ranking cannot be recomputed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
