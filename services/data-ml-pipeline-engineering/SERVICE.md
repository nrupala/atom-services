# Data ml pipeline engineering — `data-ml-pipeline-engineering`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Ship data and ML pipelines that hold — quality checks, reproducibility, lineage, drift monitoring.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **RA data pipeline builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the data-ml-pipeline-engineering manifest

This atom does not design or build a data or ML pipeline, train
a model, and exercises no ML judgment. The caller submits one
JSON manifest declaring a data/ML pipeline design record — its
declared source datasets with row counts and a declared total,
its contracts and validation record, its idempotency and
orchestration record, its quality gate record, its lineage and
reproducibility record, its feature/label, split and leakage
record, its lifecycle and serving record, and its monitoring
record — and the atom validates that record deterministically.
Every field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`DATA_ML_PIPELINE_NOT_READY`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `sources.datasets` (list of dataset entries; absent / not a list / empty = both computed source checks missing) | contracts_and_ingestion |
| `sources.datasets[].name` (string; must be non-empty for the entry to be complete) | contracts_and_ingestion |
| `sources.datasets[].rows` (number; declared per-dataset rows, summed by the computed total check) | contracts_and_ingestion |
| `sources.declared_total_rows` (number; computed, see below) | contracts_and_ingestion |
| `sources.schemas_and_expectations_declared_for_all_inputs_and_outputs` | contracts_and_ingestion |
| `sources.validation_on_arrival` | contracts_and_ingestion |
| `sources.bad_data_refused_loudly` | contracts_and_ingestion |
| `sources.silent_coercion_present` (must be `false` to pass — skill red line) | contracts_and_ingestion |
| `pipeline.steps_rerunnable_idempotently` | idempotency_and_orchestration |
| `pipeline.exactly_once_effects_at_sinks` | idempotency_and_orchestration |
| `pipeline.backfill_tested_once` | idempotency_and_orchestration |
| `pipeline.explicit_step_dependencies` | idempotency_and_orchestration |
| `pipeline.schedules_documented` | idempotency_and_orchestration |
| `pipeline.failures_alert_and_retry` | idempotency_and_orchestration |
| `pipeline.unrecorded_manual_reruns_present` (must be `false` to pass — skill method step 3) | idempotency_and_orchestration |
| `quality.row_count_checks_between_stages` | quality_gates |
| `quality.freshness_checks_between_stages` | quality_gates |
| `quality.null_uniqueness_distribution_checks_between_stages` | quality_gates |
| `quality.bad_partitions_quarantined` | quality_gates |
| `quality.pipeline_health_dashboard_present` | quality_gates |
| `lineage.source_to_transform_to_sink_tracked` | lineage_and_reproducibility |
| `lineage.code_versioned` | lineage_and_reproducibility |
| `lineage.config_versioned` | lineage_and_reproducibility |
| `lineage.data_snapshots_versioned` | lineage_and_reproducibility |
| `lineage.same_inputs_produce_same_outputs_verified` | lineage_and_reproducibility |
| `training.reproducible_with_seeds_and_pinned_env` | lineage_and_reproducibility |
| `splits.train_rows` (number; computed, see below) | ml_hygiene_and_splits |
| `splits.eval_rows` (number; computed, see below) | ml_hygiene_and_splits |
| `splits.test_rows` (number; computed, see below) | ml_hygiene_and_splits |
| `splits.declared_total_rows` (number; computed, see below) | ml_hygiene_and_splits |
| `splits.leakage_checks_cover_time_target_and_cross_splits` | ml_hygiene_and_splits |
| `splits.split_by_time_or_user_when_temporal` | ml_hygiene_and_splits |
| `splits.class_balance_assessed` | ml_hygiene_and_splits |
| `features.feature_definitions_declared` | ml_hygiene_and_splits |
| `features.label_definition_declared` | ml_hygiene_and_splits |
| `features.feature_store_only_when_justified` | ml_hygiene_and_splits |
| `privacy.pii_in_training_data_without_lawful_basis` (must be `false` to pass — skill red line) | ml_hygiene_and_splits |
| `lifecycle.eval_suites_versioned_with_model` | lifecycle_and_serving |
| `lifecycle.model_registry_entry_exists` | lifecycle_and_serving |
| `lifecycle.model_card_covers_data_metrics_and_limits` | lifecycle_and_serving |
| `lifecycle.offline_eval_completed_before_prod` | lifecycle_and_serving |
| `lifecycle.rollout_plan_present_before_prod` | lifecycle_and_serving |
| `serving.deployment_pattern_declared` | lifecycle_and_serving |
| `serving.estimated_latency_ms` (number; computed, see below) | lifecycle_and_serving |
| `serving.latency_budget_ms` (number; the caller's own declared budget, computed, see below) | lifecycle_and_serving |
| `serving.estimated_monthly_cost` (number; computed, see below) | lifecycle_and_serving |
| `serving.monthly_cost_budget` (number; the caller's own declared budget, computed, see below) | lifecycle_and_serving |
| `monitoring.input_drift_monitored` | monitoring_and_drift |
| `monitoring.output_drift_monitored` | monitoring_and_drift |
| `monitoring.performance_decay_monitored_vs_baselines` | monitoring_and_drift |
| `monitoring.alert_thresholds_set` | monitoring_and_drift |
| `monitoring.thresholds_tied_to_retraining_policy` | monitoring_and_drift |
| `monitoring.retraining_is_a_pipeline` | monitoring_and_drift |

Five checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Source entries:** every declared `sources.datasets` entry
  must carry a non-empty `name` string and numeric `rows`. A
  missing or empty list is missing evidence; an incomplete
  entry makes the entries check missing, and makes the total
  check missing when the entry carries no usable rows. The
  output reports `sources_evaluated` (the count of complete
  dataset entries).
- **Source rows total:** the declared
  `sources.declared_total_rows` passes only when it equals the
  sum of the declared per-dataset `rows`. The output reports
  `computed_total_rows` and `total_rows_difference` (declared
  minus computed, null when either cannot be computed).
- **Split rows total:** the declared `splits.declared_total_rows`
  passes only when it equals `splits.train_rows` +
  `splits.eval_rows` + `splits.test_rows`. The skill states no
  split ratio, so **no proportion is imposed** — only the
  declared total's arithmetic is re-derived. The output reports
  `computed_split_total_rows` and `split_total_difference`
  (declared minus computed, null when either cannot be
  computed).
- **Serving latency vs the caller's own budget:** the declared
  `serving.estimated_latency_ms` passes only when it does not
  exceed `serving.latency_budget_ms` — the budget the caller
  itself declares. The skill requires a deployment pattern
  "with latency/cost budgets" but states no latency number, so
  **no latency limit is imposed**. The output reports
  `latency_headroom_ms` (declared budget minus declared
  estimate, null when either cannot be computed).
- **Serving cost vs the caller's own budget:** the declared
  `serving.estimated_monthly_cost` passes only when it does not
  exceed `serving.monthly_cost_budget` — the budget the caller
  itself declares, on the same basis as latency. The output
  reports `monthly_cost_headroom` (declared budget minus
  declared estimate, null when either cannot be computed).

**Fixed serialization rule:** computed amounts are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five computed checks cannot be completed).

The verdict is one of `DATA_ML_PIPELINE_READY` (all 46 checks
pass), `DATA_ML_PIPELINE_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: contracts_and_ingestion,
idempotency_and_orchestration, quality_gates,
lineage_and_reproducibility, ml_hygiene_and_splits,
lifecycle_and_serving, monitoring_and_drift.

## Honest scoping

This atom audits a **declared** data/ML pipeline design record
— it does not design or build a pipeline, ingest or transform
any data, train or evaluate a model, verify that a declared
value is true, or judge whether the declared checks would catch
real bad data. A record is ready *on the caller's declared
evidence* even if its underlying pipeline is slow, its data is
dirty, or its model is weak. It is a completeness and
consistency audit, **not a pipeline or model review**: it never
decides whether the schemas are correct (only that they are
declared for every input and output), whether leakage is
actually absent (only that leakage checks covering time, target
and cross-split leakage are declared), whether the split is
appropriate for the problem (only that its declared rows add
up), whether a feature store is truly justified, whether a
lawful basis for PII actually exists in law (only that PII
without one is declared absent), or whether the declared drift
thresholds are well chosen (only that thresholds are declared
and tied to a retraining policy).

**Thresholds declined — named explicitly.** The skill states
no number for any of the following, so this atom imposes none
and any future threshold must come from a skill refinement
first (binding rule R1):

- no train/eval/test split ratio or minimum split size (the
  skill requires leakage checks and temporal splitting where
  reality is temporal; it states no proportions);
- no maximum serving latency or monthly cost (only the
  caller-declared `latency_budget_ms` and `monthly_cost_budget`
  are compared, and only the declared totals' arithmetic is
  re-derived);
- no drift, performance-decay or alert threshold value (the
  skill requires thresholds tied to a retraining policy; it
  states no values, and no retraining frequency);
- no class-balance ratio or imbalance limit (the skill requires
  class-balance awareness; it states no ratio);
- no freshness window, null-rate, uniqueness or distribution
  limit (the skill requires those checks between stages; it
  states no values they must enforce);
- no minimum dataset or row count, and no backfill cost limit
  (the skill requires cheap backfills and a tested backfill; it
  quantifies neither);
- no mandated schema format, feature-store product, model
  registry tool, or deployment pattern choice (the skill
  requires a declared batch-vs-service pattern with budgets; it
  does not prescribe which pattern, tool or format).

Named exclusions: no production of pipeline code, schemas or
model artifacts; no verification of any declared schema, check,
split, lineage record or monitoring claim against a live
pipeline, dataset or model registry; no judgment of model
quality or metric values (what the eval suite measures is the
caller's surface, not this one's); no live verification of any
declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
