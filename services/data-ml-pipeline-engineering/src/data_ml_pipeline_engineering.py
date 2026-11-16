#!/usr/bin/env python3
"""Data/ML pipeline engineering — deterministic core.

Built from the bound skill `data-ml-pipelines` (v1): "Ship data
and ML pipelines that hold — quality checks, reproducibility,
lineage, drift monitoring."

This atom does NOT design or build a pipeline, train a model,
or exercise ML judgment. The caller submits a
data-ml-pipeline-engineering manifest: one DECLARED data/ML
pipeline design record — its declared source datasets with row
counts and a declared total, its contracts and validation
record, its idempotency and orchestration record, its quality
gate record, its lineage and reproducibility record, its
feature/label, split and leakage record, its lifecycle and
serving record, and its monitoring record. The atom validates
that record deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- source rows (method step 1, arithmetic only): the declared
  total source rows must equal the sum of the declared
  per-dataset rows;
- split rows (method step 6, arithmetic only): the declared
  total dataset rows for the split must equal the declared
  train rows plus eval rows plus test rows. The skill states
  no split ratio, so no proportion is imposed — only the
  declared total's arithmetic is re-derived;
- serving latency and cost (method step 7: deployment pattern
  "with latency/cost budgets"): the declared estimated latency
  and estimated monthly cost must not exceed the latency and
  cost budgets the CALLER itself declares. The skill states no
  latency or cost number, so none is imposed — only the
  caller's own declared budgets are compared;
- contracts, leakage and production red lines (method steps 1
  and 6, red lines: "no silent coercion; no PII in training
  data without a lawful basis; no model to prod without
  offline eval + rollout plan") are checked as declared
  must-be-true / must-be-false fields, exactly as declared.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The computed outcome over
the five computed checks is reported as `computed_status`.

Verdict:
- any fail             -> DATA_ML_PIPELINE_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DATA_ML_PIPELINE_READY

This is a completeness and consistency audit over declared
evidence, not a pipeline or model review: a record that
declares every step passes even if its underlying pipeline is
slow or its model is weak, and nothing here verifies that a
declared value is true, that leakage is actually absent, or
that a declared check would catch real bad data.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "contracts_and_ingestion",
    "idempotency_and_orchestration",
    "quality_gates",
    "lineage_and_reproducibility",
    "ml_hygiene_and_splits",
    "lifecycle_and_serving",
    "monitoring_and_drift",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "entity": "string",
    "sources": {
        "datasets": [{
            "name": "string",
            "rows": "number",
        }],
        "declared_total_rows": "number",
        "schemas_and_expectations_declared_for_all_inputs_and_outputs": "boolean",
        "validation_on_arrival": "boolean",
        "bad_data_refused_loudly": "boolean",
        "silent_coercion_present": "boolean",
    },
    "pipeline": {
        "steps_rerunnable_idempotently": "boolean",
        "exactly_once_effects_at_sinks": "boolean",
        "backfill_tested_once": "boolean",
        "explicit_step_dependencies": "boolean",
        "schedules_documented": "boolean",
        "failures_alert_and_retry": "boolean",
        "unrecorded_manual_reruns_present": "boolean",
    },
    "quality": {
        "row_count_checks_between_stages": "boolean",
        "freshness_checks_between_stages": "boolean",
        "null_uniqueness_distribution_checks_between_stages": "boolean",
        "bad_partitions_quarantined": "boolean",
        "pipeline_health_dashboard_present": "boolean",
    },
    "lineage": {
        "source_to_transform_to_sink_tracked": "boolean",
        "code_versioned": "boolean",
        "config_versioned": "boolean",
        "data_snapshots_versioned": "boolean",
        "same_inputs_produce_same_outputs_verified": "boolean",
    },
    "training": {
        "reproducible_with_seeds_and_pinned_env": "boolean",
    },
    "features": {
        "feature_definitions_declared": "boolean",
        "label_definition_declared": "boolean",
        "feature_store_only_when_justified": "boolean",
    },
    "splits": {
        "train_rows": "number",
        "eval_rows": "number",
        "test_rows": "number",
        "declared_total_rows": "number",
        "leakage_checks_cover_time_target_and_cross_splits": "boolean",
        "split_by_time_or_user_when_temporal": "boolean",
        "class_balance_assessed": "boolean",
    },
    "privacy": {
        "pii_in_training_data_without_lawful_basis": "boolean",
    },
    "lifecycle": {
        "eval_suites_versioned_with_model": "boolean",
        "model_registry_entry_exists": "boolean",
        "model_card_covers_data_metrics_and_limits": "boolean",
        "offline_eval_completed_before_prod": "boolean",
        "rollout_plan_present_before_prod": "boolean",
    },
    "serving": {
        "deployment_pattern_declared": "boolean",
        "estimated_latency_ms": "number",
        "latency_budget_ms": "number",
        "estimated_monthly_cost": "number",
        "monthly_cost_budget": "number",
    },
    "monitoring": {
        "input_drift_monitored": "boolean",
        "output_drift_monitored": "boolean",
        "performance_decay_monitored_vs_baselines": "boolean",
        "alert_thresholds_set": "boolean",
        "thresholds_tied_to_retraining_policy": "boolean",
        "retraining_is_a_pipeline": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _source_checks(results, manifest):
    """Computed source checks. Returns (sources_evaluated,
    computed_total_rows, total_rows_difference)."""
    datasets, has_datasets = _get(manifest, "sources", "datasets")
    declared_total, has_total = _get(
        manifest, "sources", "declared_total_rows")
    if not has_datasets or not isinstance(datasets, list) or not datasets:
        for name in (
            "source_entries_complete",
            "total_rows_matches_sum_of_source_rows",
        ):
            _check(results, "contracts_and_ingestion", name,
                   datasets, False, False,
                   "no source datasets declared")
        return 0, None, None
    name_incomplete = False
    rows_incomplete = False
    evaluated = 0
    total = 0
    for entry in datasets:
        if not isinstance(entry, dict):
            name_incomplete = True
            rows_incomplete = True
            continue
        name, has_name = _get(entry, "name")
        rows, has_rows = _get(entry, "rows")
        if not (has_name and _is_nonempty_str(name)):
            name_incomplete = True
        if not (has_rows and _is_number(rows)):
            rows_incomplete = True
        else:
            total += rows
        if (has_name and has_rows and _is_nonempty_str(name)
                and _is_number(rows)):
            evaluated += 1
    incomplete = name_incomplete or rows_incomplete
    if incomplete:
        _check(results, "contracts_and_ingestion",
               "source_entries_complete",
               datasets, False, False,
               "a source dataset entry is missing its name or rows")
    else:
        _check(results, "contracts_and_ingestion",
               "source_entries_complete",
               datasets, True, True,
               "every source dataset entry carries a non-empty "
               "name and numeric rows")
    computed_total = None
    difference = None
    if rows_incomplete or not has_total or not _is_number(declared_total):
        _check(results, "contracts_and_ingestion",
               "total_rows_matches_sum_of_source_rows",
               datasets, False, False,
               "the declared total rows or a dataset's rows are "
               "missing, so the total cannot be re-derived")
    else:
        computed_total = total
        difference = declared_total - total
        _check(results, "contracts_and_ingestion",
               "total_rows_matches_sum_of_source_rows",
               datasets, True, _fmt6(difference) == "0.000000",
               "the declared total source rows equal the sum of "
               "the declared per-dataset rows")
    return evaluated, computed_total, difference


def evaluate(manifest):
    """Return the verdict dict for a data-ml-pipeline-engineering manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: contracts_and_ingestion (skill method step
    #      1: "Contracts at the edges: schemas + expectations for
    #      every input/output (types, ranges, nullability);
    #      validate on arrival; refuse bad data loudly — never
    #      coerce silently"; red line: "no silent coercion") ----
    sources_evaluated, computed_total_rows, total_rows_difference = \
        _source_checks(results, manifest)
    _bool_check(results, "contracts_and_ingestion",
                "schemas_and_expectations_declared",
                manifest,
                ("sources",
                 "schemas_and_expectations_declared_for_all_inputs_and_outputs"),
                "method step 1: schemas and expectations (types, "
                "ranges, nullability) are declared for every "
                "input and output")
    _bool_check(results, "contracts_and_ingestion",
                "validation_on_arrival",
                manifest, ("sources", "validation_on_arrival"),
                "method step 1: data is validated on arrival at "
                "every edge")
    _bool_check(results, "contracts_and_ingestion",
                "bad_data_refused_loudly",
                manifest, ("sources", "bad_data_refused_loudly"),
                "method step 1: bad data is refused loudly, never "
                "accepted silently")
    _false_check(results, "contracts_and_ingestion",
                 "no_silent_coercion",
                 manifest, ("sources", "silent_coercion_present"),
                 "red line: data is never coerced silently")

    # ---- Section 2: idempotency_and_orchestration (skill method
    #      step 2: "Idempotent steps: rerunnable stages;
    #      exactly-once effects at sinks (upserts/keys); safe
    #      retries; cheap backfills"; step 3: "Orchestration:
    #      explicit step dependencies; schedules documented;
    #      failures alert + retry; no unrecorded 'just rerun it'
    #      habits"; quality gate: "Pipelines rerun idempotently;
    #      a backfill was tested once") ----
    _bool_check(results, "idempotency_and_orchestration",
                "steps_rerunnable_idempotently",
                manifest, ("pipeline", "steps_rerunnable_idempotently"),
                "method step 2 / quality gate: pipeline steps are "
                "rerunnable idempotently")
    _bool_check(results, "idempotency_and_orchestration",
                "exactly_once_effects_at_sinks",
                manifest, ("pipeline", "exactly_once_effects_at_sinks"),
                "method step 2: sinks have exactly-once effects "
                "(upserts/keys)")
    _bool_check(results, "idempotency_and_orchestration",
                "backfill_tested_once",
                manifest, ("pipeline", "backfill_tested_once"),
                "quality gate: a backfill was tested once — "
                "backfills are supported and cheap to rerun")
    _bool_check(results, "idempotency_and_orchestration",
                "explicit_step_dependencies",
                manifest, ("pipeline", "explicit_step_dependencies"),
                "method step 3: step dependencies are explicit")
    _bool_check(results, "idempotency_and_orchestration",
                "schedules_documented",
                manifest, ("pipeline", "schedules_documented"),
                "method step 3: schedules are documented")
    _bool_check(results, "idempotency_and_orchestration",
                "failures_alert_and_retry",
                manifest, ("pipeline", "failures_alert_and_retry"),
                "method step 3: failures alert and retry safely")
    _false_check(results, "idempotency_and_orchestration",
                 "no_unrecorded_manual_reruns",
                 manifest, ("pipeline", "unrecorded_manual_reruns_present"),
                 "method step 3: there are no unrecorded 'just "
                 "rerun it' habits")

    # ---- Section 3: quality_gates (skill method step 4:
    #      "Quality gates between stages: row counts, freshness,
    #      null/uniqueness/distribution checks; quarantine bad
    #      partitions; pipeline-health dashboards"; quality gate:
    #      "Schemas + quality checks active at every boundary") ----
    _bool_check(results, "quality_gates",
                "row_count_checks_between_stages",
                manifest, ("quality", "row_count_checks_between_stages"),
                "method step 4: row count checks run between stages")
    _bool_check(results, "quality_gates",
                "freshness_checks_between_stages",
                manifest, ("quality", "freshness_checks_between_stages"),
                "method step 4: freshness checks run between stages")
    _bool_check(results, "quality_gates",
                "null_uniqueness_distribution_checks_between_stages",
                manifest,
                ("quality",
                 "null_uniqueness_distribution_checks_between_stages"),
                "method step 4: null, uniqueness and distribution "
                "checks run between stages")
    _bool_check(results, "quality_gates",
                "bad_partitions_quarantined",
                manifest, ("quality", "bad_partitions_quarantined"),
                "method step 4: bad partitions are quarantined, "
                "not passed downstream")
    _bool_check(results, "quality_gates",
                "pipeline_health_dashboard_present",
                manifest, ("quality", "pipeline_health_dashboard_present"),
                "method step 4: a pipeline-health dashboard exists")

    # ---- Section 4: lineage_and_reproducibility (skill method
    #      step 5: "Lineage & versioning: source -> transform ->
    #      sink tracked; code + config + data snapshots versioned
    #      where it matters; same inputs -> same outputs"; step
    #      7: "reproducible training (seeds, pinned env)";
    #      quality gate: "Training reproducible") ----
    _bool_check(results, "lineage_and_reproducibility",
                "source_to_transform_to_sink_lineage_tracked",
                manifest,
                ("lineage", "source_to_transform_to_sink_tracked"),
                "method step 5: lineage is tracked from source "
                "through transform to sink")
    _bool_check(results, "lineage_and_reproducibility",
                "code_versioned",
                manifest, ("lineage", "code_versioned"),
                "method step 5: code is versioned")
    _bool_check(results, "lineage_and_reproducibility",
                "config_versioned",
                manifest, ("lineage", "config_versioned"),
                "method step 5: config is versioned")
    _bool_check(results, "lineage_and_reproducibility",
                "data_snapshots_versioned",
                manifest, ("lineage", "data_snapshots_versioned"),
                "method step 5: data snapshots are versioned "
                "where it matters")
    _bool_check(results, "lineage_and_reproducibility",
                "same_inputs_produce_same_outputs_verified",
                manifest,
                ("lineage", "same_inputs_produce_same_outputs_verified"),
                "method step 5: the same inputs produce the same "
                "outputs — verified, not assumed")
    _bool_check(results, "lineage_and_reproducibility",
                "training_reproducible_with_seeds_and_pinned_env",
                manifest,
                ("training", "reproducible_with_seeds_and_pinned_env"),
                "method step 7 / quality gate: training is "
                "reproducible — seeds recorded and the "
                "environment pinned")

    # ---- Section 5: ml_hygiene_and_splits (skill method step 6:
    #      "ML — data hygiene: leakage checks (time/target/
    #      cross-splits); split by time/user when reality is
    #      temporal; class-balance awareness; feature stores only
    #      when justified"; red line: "No PII in training data
    #      without a lawful basis") ----
    train_rows, has_train = _get(manifest, "splits", "train_rows")
    eval_rows, has_eval = _get(manifest, "splits", "eval_rows")
    test_rows, has_test = _get(manifest, "splits", "test_rows")
    split_declared_total, has_split_total = _get(
        manifest, "splits", "declared_total_rows")
    split_parts_present = (
        has_train and has_eval and has_test
        and _is_number(train_rows) and _is_number(eval_rows)
        and _is_number(test_rows)
    )
    computed_split_total = (
        train_rows + eval_rows + test_rows
        if split_parts_present else None
    )
    split_difference = (
        split_declared_total - computed_split_total
        if computed_split_total is not None and has_split_total
        and _is_number(split_declared_total)
        else None
    )
    split_all_numbers = (
        split_parts_present and has_split_total
        and _is_number(split_declared_total)
    )
    _check(results, "ml_hygiene_and_splits",
           "split_total_matches_sum_of_split_rows",
           split_declared_total, split_all_numbers,
           split_all_numbers
           and _fmt6(split_difference) == "0.000000",
           "method step 6: the declared total split rows equal "
           "the declared train rows plus eval rows plus test "
           "rows (the skill states no split ratio, so none is "
           "imposed here)")
    _bool_check(results, "ml_hygiene_and_splits",
                "leakage_checks_cover_time_target_and_cross_splits",
                manifest,
                ("splits",
                 "leakage_checks_cover_time_target_and_cross_splits"),
                "method step 6: leakage checks cover time, target "
                "and cross-split leakage")
    _bool_check(results, "ml_hygiene_and_splits",
                "split_by_time_or_user_when_temporal",
                manifest,
                ("splits", "split_by_time_or_user_when_temporal"),
                "method step 6: data is split by time or user "
                "when reality is temporal")
    _bool_check(results, "ml_hygiene_and_splits",
                "class_balance_assessed",
                manifest, ("splits", "class_balance_assessed"),
                "method step 6: class balance is assessed — "
                "awareness is declared, no ratio is imposed")
    _bool_check(results, "ml_hygiene_and_splits",
                "feature_definitions_declared",
                manifest, ("features", "feature_definitions_declared"),
                "method step 6: feature definitions are declared")
    _bool_check(results, "ml_hygiene_and_splits",
                "label_definition_declared",
                manifest, ("features", "label_definition_declared"),
                "method step 6: the label definition is declared")
    _bool_check(results, "ml_hygiene_and_splits",
                "feature_store_only_when_justified",
                manifest, ("features", "feature_store_only_when_justified"),
                "method step 6: a feature store is used only "
                "when justified")
    _false_check(results, "ml_hygiene_and_splits",
                 "no_pii_in_training_data_without_lawful_basis",
                 manifest,
                 ("privacy", "pii_in_training_data_without_lawful_basis"),
                 "red line: no PII is in training data without a "
                 "lawful basis")

    # ---- Section 6: lifecycle_and_serving (skill method step 7:
    #      "ML — lifecycle: eval suites versioned with the model;
    #      registry + model card (data, metrics, limits);
    #      deployment pattern (batch vs service) with latency/
    #      cost budgets"; quality gate: "model card + registry
    #      entry exist"; red line: "no model to prod without
    #      offline eval + rollout plan") ----
    _bool_check(results, "lifecycle_and_serving",
                "eval_suites_versioned_with_model",
                manifest, ("lifecycle", "eval_suites_versioned_with_model"),
                "method step 7: eval suites are versioned with "
                "the model")
    _bool_check(results, "lifecycle_and_serving",
                "model_registry_entry_exists",
                manifest, ("lifecycle", "model_registry_entry_exists"),
                "method step 7 / quality gate: a registry entry "
                "exists for the model")
    _bool_check(results, "lifecycle_and_serving",
                "model_card_covers_data_metrics_and_limits",
                manifest,
                ("lifecycle", "model_card_covers_data_metrics_and_limits"),
                "method step 7 / quality gate: a model card "
                "exists covering data, metrics and limits")
    _bool_check(results, "lifecycle_and_serving",
                "offline_eval_completed_before_prod",
                manifest, ("lifecycle", "offline_eval_completed_before_prod"),
                "red line: offline eval is completed before a "
                "model goes to prod")
    _bool_check(results, "lifecycle_and_serving",
                "rollout_plan_present_before_prod",
                manifest, ("lifecycle", "rollout_plan_present_before_prod"),
                "red line: a rollout plan exists before a model "
                "goes to prod")
    _bool_check(results, "lifecycle_and_serving",
                "deployment_pattern_declared",
                manifest, ("serving", "deployment_pattern_declared"),
                "method step 7: the deployment pattern (batch "
                "vs service) is declared")
    estimated_latency, has_est_latency = _get(
        manifest, "serving", "estimated_latency_ms")
    latency_budget, has_latency_budget = _get(
        manifest, "serving", "latency_budget_ms")
    latency_present = (
        has_est_latency and has_latency_budget
        and _is_number(estimated_latency) and _is_number(latency_budget)
    )
    latency_headroom = (
        latency_budget - estimated_latency if latency_present else None
    )
    _check(results, "lifecycle_and_serving",
           "latency_within_caller_declared_budget",
           latency_budget, latency_present,
           latency_present and estimated_latency <= latency_budget,
           "method step 7: the declared estimated latency does "
           "not exceed the latency budget the caller itself "
           "declares (the skill states no latency number, so "
           "none is imposed here)")
    estimated_cost, has_est_cost = _get(
        manifest, "serving", "estimated_monthly_cost")
    cost_budget, has_cost_budget = _get(
        manifest, "serving", "monthly_cost_budget")
    cost_present = (
        has_est_cost and has_cost_budget
        and _is_number(estimated_cost) and _is_number(cost_budget)
    )
    cost_headroom = (
        cost_budget - estimated_cost if cost_present else None
    )
    _check(results, "lifecycle_and_serving",
           "cost_within_caller_declared_budget",
           cost_budget, cost_present,
           cost_present and estimated_cost <= cost_budget,
           "method step 7: the declared estimated monthly cost "
           "does not exceed the monthly cost budget the caller "
           "itself declares (the skill states no cost number, "
           "so none is imposed here)")

    # ---- Section 7: monitoring_and_drift (skill method step 8:
    #      "Monitoring & drift: input drift, output drift,
    #      performance decay vs baselines; thresholds tied to a
    #      retraining policy — retraining is a pipeline, not a
    #      heroic weekend"; quality gate: "Drift/performance
    #      monitoring live with alert thresholds") ----
    _bool_check(results, "monitoring_and_drift",
                "input_drift_monitored",
                manifest, ("monitoring", "input_drift_monitored"),
                "method step 8: input drift is monitored")
    _bool_check(results, "monitoring_and_drift",
                "output_drift_monitored",
                manifest, ("monitoring", "output_drift_monitored"),
                "method step 8: output drift is monitored")
    _bool_check(results, "monitoring_and_drift",
                "performance_decay_monitored_vs_baselines",
                manifest,
                ("monitoring", "performance_decay_monitored_vs_baselines"),
                "method step 8: performance decay is monitored "
                "against baselines")
    _bool_check(results, "monitoring_and_drift",
                "alert_thresholds_set",
                manifest, ("monitoring", "alert_thresholds_set"),
                "quality gate: drift and performance monitoring "
                "is live with alert thresholds — the threshold "
                "values are the caller's, none is imposed here")
    _bool_check(results, "monitoring_and_drift",
                "thresholds_tied_to_retraining_policy",
                manifest,
                ("monitoring", "thresholds_tied_to_retraining_policy"),
                "method step 8: alert thresholds are tied to a "
                "retraining policy")
    _bool_check(results, "monitoring_and_drift",
                "retraining_is_a_pipeline",
                manifest, ("monitoring", "retraining_is_a_pipeline"),
                "method step 8: retraining is a pipeline, not a "
                "heroic weekend")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "DATA_ML_PIPELINE_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DATA_ML_PIPELINE_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "source_entries_complete",
            "total_rows_matches_sum_of_source_rows",
            "split_total_matches_sum_of_split_rows",
            "latency_within_caller_declared_budget",
            "cost_within_caller_declared_budget")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "data-ml-pipeline-engineering",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "sources_evaluated": sources_evaluated,
        "computed_total_rows": _fmt6(computed_total_rows),
        "total_rows_difference": _fmt6(total_rows_difference),
        "computed_split_total_rows": _fmt6(computed_split_total),
        "split_total_difference": _fmt6(split_difference),
        "latency_headroom_ms": _fmt6(latency_headroom),
        "monthly_cost_headroom": _fmt6(cost_headroom),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DATA/ML PIPELINE ENGINEERING",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: data_ml_pipeline_engineering.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DATA_ML_PIPELINE_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
