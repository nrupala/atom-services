# Data ml pipeline engineering — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a data/ML pipeline design record — its source datasets and contracts, idempotency and orchestration record, quality gates, lineage and reproducibility record, feature/label, split and leakage record, lifecycle and serving record, and monitoring record. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **DATA_ML_PIPELINE_READY**, **DATA_ML_PIPELINE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only — it does not design or build a pipeline, train a model, or judge whether the declared checks would catch real bad data. Computed checks: every declared source dataset entry must carry a non-empty name and numeric rows, and the declared total source rows must equal the sum of the per-dataset rows; the declared split total must equal train + eval + test rows (no split ratio is imposed — the skill states none); and the declared estimated latency and monthly cost must not exceed the latency and cost budgets you yourself declare (no latency or cost limit is imposed — the skill states none). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-ml-pipeline-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/data-ml-pipeline-engineering` — tool name `data_ml_pipeline_engineering`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/data-ml-pipeline-engineering` — body = the manifest object; same `Authorization` header.

## Input — the data-ml-pipeline-engineering manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `sources.datasets` (list of entries) | computed: each entry needs a non-empty `name` (string) and numeric `rows`; reported as `sources_evaluated` (count of complete entries) |
| `sources.declared_total_rows` (number) | computed: must equal the sum of the per-dataset `rows`; reported as `computed_total_rows` and `total_rows_difference` (6 decimal places) |
| `sources.schemas_and_expectations_declared_for_all_inputs_and_outputs` / `validation_on_arrival` / `bad_data_refused_loudly` | contract and validation evidence |
| `sources.silent_coercion_present` | must be `false` to pass (red line: no silent coercion) |
| `pipeline.steps_rerunnable_idempotently` / `exactly_once_effects_at_sinks` / `backfill_tested_once` / `explicit_step_dependencies` / `schedules_documented` / `failures_alert_and_retry` | idempotency and orchestration evidence |
| `pipeline.unrecorded_manual_reruns_present` | must be `false` to pass |
| `quality.row_count_checks_between_stages` / `freshness_checks_between_stages` / `null_uniqueness_distribution_checks_between_stages` / `bad_partitions_quarantined` / `pipeline_health_dashboard_present` | quality-gate evidence |
| `lineage.source_to_transform_to_sink_tracked` / `code_versioned` / `config_versioned` / `data_snapshots_versioned` / `same_inputs_produce_same_outputs_verified` | lineage evidence |
| `training.reproducible_with_seeds_and_pinned_env` | reproducible-training evidence |
| `splits.train_rows` / `eval_rows` / `test_rows` (numbers), `splits.declared_total_rows` (number) | computed: declared total must equal train + eval + test; reported as `computed_split_total_rows` and `split_total_difference` (6 decimal places) |
| `splits.leakage_checks_cover_time_target_and_cross_splits` / `split_by_time_or_user_when_temporal` / `class_balance_assessed` | split and leakage evidence |
| `features.feature_definitions_declared` / `label_definition_declared` / `feature_store_only_when_justified` | feature and label evidence |
| `privacy.pii_in_training_data_without_lawful_basis` | must be `false` to pass (red line) |
| `lifecycle.eval_suites_versioned_with_model` / `model_registry_entry_exists` / `model_card_covers_data_metrics_and_limits` / `offline_eval_completed_before_prod` / `rollout_plan_present_before_prod` | lifecycle evidence |
| `serving.deployment_pattern_declared` | deployment-pattern declaration |
| `serving.estimated_latency_ms` (number), `serving.latency_budget_ms` (number) | computed: estimate must not exceed your own declared budget; reported as `latency_headroom_ms` (6 decimal places) |
| `serving.estimated_monthly_cost` (number), `serving.monthly_cost_budget` (number) | computed: estimate must not exceed your own declared budget; reported as `monthly_cost_headroom` (6 decimal places) |
| `monitoring.input_drift_monitored` / `output_drift_monitored` / `performance_decay_monitored_vs_baselines` / `alert_thresholds_set` / `thresholds_tied_to_retraining_policy` / `retraining_is_a_pipeline` | monitoring and drift evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DATA_ML_PIPELINE_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/data-ml-pipeline-engineering`:

```json
{
  "entity": "test-pipeline-001",
  "sources": {
    "datasets": [
      {
        "name": "raw_logs",
        "rows": 100
      },
      {
        "name": "user_data",
        "rows": 50
      }
    ],
    "declared_total_rows": 150,
    "schemas_and_expectations_declared_for_all_inputs_and_outputs": true,
    "validation_on_arrival": true,
    "bad_data_refused_loudly": true,
    "silent_coercion_present": false
  },
  "pipeline": {
    "steps_rerunnable_idempotently": true,
    "exactly_once_effects_at_sinks": true,
    "backfill_tested_once": true,
    "explicit_step_dependencies": true,
    "schedules_documented": true,
    "failures_alert_and_retry": true,
    "unrecorded_manual_reruns_present": false
  },
  "quality": {
    "row_count_checks_between_stages": true,
    "freshness_checks_between_stages": true,
    "null_uniqueness_distribution_checks_between_stages": true,
    "bad_partitions_quarantined": true,
    "pipeline_health_dashboard_present": true
  },
  "lineage": {
    "source_to_transform_to_sink_tracked": true,
    "code_versioned": true,
    "config_versioned": true,
    "data_snapshots_versioned": true,
    "same_inputs_produce_same_outputs_verified": true
  },
  "training": {
    "reproducible_with_seeds_and_pinned_env": true
  },
  "splits": {
    "train_rows": 80,
    "eval_rows": 40,
    "test_rows": 30,
    "declared_total_rows": 150,
    "leakage_checks_cover_time_target_and_cross_splits": true,
    "split_by_time_or_user_when_temporal": true,
    "class_balance_assessed": true
  },
  "features": {
    "feature_definitions_declared": true,
    "label_definition_declared": true,
    "feature_store_only_when_justified": true
  },
  "privacy": {
    "pii_in_training_data_without_lawful_basis": false
  },
  "lifecycle": {
    "eval_suites_versioned_with_model": true,
    "model_registry_entry_exists": true,
    "model_card_covers_data_metrics_and_limits": true,
    "offline_eval_completed_before_prod": true,
    "rollout_plan_present_before_prod": true
  },
  "serving": {
    "deployment_pattern_declared": true,
    "estimated_latency_ms": 100.0,
    "latency_budget_ms": 200.0,
    "estimated_monthly_cost": 50.0,
    "monthly_cost_budget": 100.0
  },
  "monitoring": {
    "input_drift_monitored": true,
    "output_drift_monitored": true,
    "performance_decay_monitored_vs_baselines": true,
    "alert_thresholds_set": true,
    "thresholds_tied_to_retraining_policy": true,
    "retraining_is_a_pipeline": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

```json
{
  "service": "data-ml-pipeline-engineering",
  "atom_version": "0.1.0",
  "entity": "test-pipeline-001",
  "verdict": "DATA_ML_PIPELINE_READY",
  "sections": {
    "contracts_and_ingestion": "pass",
    "idempotency_and_orchestration": "pass",
    "quality_gates": "pass",
    "lineage_and_reproducibility": "pass",
    "ml_hygiene_and_splits": "pass",
    "lifecycle_and_serving": "pass",
    "monitoring_and_drift": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "sources_evaluated": 2,
  "computed_total_rows": "150.000000",
  "total_rows_difference": "0.000000",
  "computed_split_total_rows": "150.000000",
  "split_total_difference": "0.000000",
  "latency_headroom_ms": "100.000000",
  "monthly_cost_headroom": "50.000000",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

## Verdicts

- **DATA_ML_PIPELINE_READY** — every check passes; the pipeline design record is complete and internally consistent on the declared evidence.
- **DATA_ML_PIPELINE_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `sources_evaluated` (count of complete dataset entries), `computed_total_rows` and `total_rows_difference`, `computed_split_total_rows` and `split_total_difference`, `latency_headroom_ms` and `monthly_cost_headroom` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
