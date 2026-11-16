# Data analysis deliverable — user guide

## What it does

You have a data-analysis deliverable record — the question and its framing, the data sources and their provenance, the analysis method evidence, the declared result figures, the statistical-care record, the recommendation, and the reporting / close-the-loop record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **DELIVERABLE_COMPLETE**, **DELIVERABLE_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only — it does not run the analysis, source or inspect the data, or judge whether the conclusions are right. Computed checks: the declared data-source list must be present and non-empty; the stated total must equal the sum of the declared segment values; the stated mean must equal the mean of the same values; and the stated percent change must equal (current − prior) / prior × 100 over the declared comparable-window values, with a non-zero prior window. No thresholds the bound skill does not state are imposed — no minimum sample size, significance level, or source count beyond a non-empty list. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-analysis-deliverable"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/data-analysis-deliverable` — tool name `data_analysis_deliverable`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/data-analysis-deliverable` — body = the manifest object; same `Authorization` header.

## Input — the data-analysis-deliverable manifest

| Field | Meaning |
|---|---|
| `question` | analysis question (string; carried into the output, not checked) |
| `framing.question_stated` / `decision_named` / `decision_owner_named` / `decision_deadline_stated` / `data_that_would_change_decision_stated` | question-framing evidence (decision first — who decides what, by when, and what data would change it) |
| `data.sources` (list of strings) | computed: must be present and non-empty; entries validated as strings only |
| `data.provenance_documented` / `coverage_documented` / `definitions_documented` / `metrics_have_single_definition` / `gaps_documented` / `biases_documented` | data provenance evidence |
| `analysis.distributions_shown` / `segments_shown` / `trends_on_comparable_windows` / `decomposition_performed` / `cohort_views_shown` / `mechanisms_triangulated` | descriptive and diagnostic evidence |
| `analysis.cherry_picked_baselines_used` | must be `false` to pass |
| `figures.values` (list of numbers), `figures.stated_total` (number), `figures.stated_mean` (number) | computed: stated total must equal the sum of the values and stated mean must equal their mean, over a non-empty list; reported as `recomputed_total` and `recomputed_mean` (6 decimal places) |
| `figures.prior_window_value` (number), `figures.current_window_value` (number), `figures.stated_percent_change` (number) | computed: stated percent change must equal (current − prior) / prior × 100, prior non-zero; reported as `recomputed_percent_change` (6 decimal places) |
| `inference.sample_size_or_power_considered` / `uncertainty_stated` / `practical_vs_statistical_significance_distinguished` / `multiple_comparisons_checked` | statistical-care evidence |
| `inference.causal_claims_from_observational_data_alone` | must be `false` to pass |
| `recommendation.so_what_stated` / `recommendation_made` / `expected_effect_stated` / `recommendation_owner_named` / `measurement_plan_stated` / `uncertainty_stated_plainly` | insight-and-action evidence |
| `report.covers_question_data_method_finding_recommendation_caveats` / `is_one_page` / `caveats_stated` / `numbers_reproducible` | reporting evidence |
| `report.charts_oversell_findings` | must be `false` to pass |
| `closure.predicted_vs_actual_compared` / `model_of_world_updated` | close-the-loop evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DELIVERABLE_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/data-analysis-deliverable`:

```json
{
  "question": "Why did conversion drop?",
  "framing": {
    "question_stated": true,
    "decision_named": true,
    "decision_owner_named": true,
    "decision_deadline_stated": true,
    "data_that_would_change_decision_stated": true
  },
  "data": {
    "sources": [
      "db_logs",
      "crm_data"
    ],
    "provenance_documented": true,
    "coverage_documented": true,
    "definitions_documented": true,
    "metrics_have_single_definition": true,
    "gaps_documented": true,
    "biases_documented": true
  },
  "analysis": {
    "distributions_shown": true,
    "segments_shown": true,
    "trends_on_comparable_windows": true,
    "cherry_picked_baselines_used": false,
    "decomposition_performed": true,
    "cohort_views_shown": true,
    "mechanisms_triangulated": true
  },
  "figures": {
    "values": [
      10.0,
      20.0
    ],
    "stated_total": 30.0,
    "stated_mean": 15.0,
    "prior_window_value": 100.0,
    "current_window_value": 110.0,
    "stated_percent_change": 10.0
  },
  "inference": {
    "sample_size_or_power_considered": true,
    "uncertainty_stated": true,
    "practical_vs_statistical_significance_distinguished": true,
    "multiple_comparisons_checked": true,
    "causal_claims_from_observational_data_alone": false
  },
  "recommendation": {
    "so_what_stated": true,
    "recommendation_made": true,
    "expected_effect_stated": true,
    "recommendation_owner_named": true,
    "measurement_plan_stated": true,
    "uncertainty_stated_plainly": true
  },
  "report": {
    "covers_question_data_method_finding_recommendation_caveats": true,
    "is_one_page": true,
    "caveats_stated": true,
    "charts_oversell_findings": false,
    "numbers_reproducible": true
  },
  "closure": {
    "predicted_vs_actual_compared": true,
    "model_of_world_updated": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 40 checks and a text stamp of the verdict):

```json
{
  "service": "data-analysis-deliverable",
  "atom_version": "0.1.0",
  "question": "Why did conversion drop?",
  "verdict": "DELIVERABLE_COMPLETE",
  "sections": {
    "question_framing": "pass",
    "data_provenance": "pass",
    "descriptive_and_diagnostic": "pass",
    "statistical_care": "pass",
    "insight_and_action": "pass",
    "reporting_and_reproducibility": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "recomputed_total": "30.000000",
  "recomputed_mean": "15.000000",
  "recomputed_percent_change": "10.000000",
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections."
}
```

## Verdicts

- **DELIVERABLE_COMPLETE** — every check passes; the deliverable record is complete and internally consistent on the declared evidence.
- **DELIVERABLE_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `recomputed_total`, `recomputed_mean` and `recomputed_percent_change` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three re-derivation checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
