// Data/ML pipeline engineering — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/data-ml-pipeline-engineering/src/data_ml_pipeline_engineering.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared data/ML
// pipeline design record; it builds no pipeline, trains no
// model and exercises no ML judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  sources: {
    datasets: [{
      name: "string",
      rows: "number",
    }],
    declared_total_rows: "number",
    schemas_and_expectations_declared_for_all_inputs_and_outputs: "boolean",
    validation_on_arrival: "boolean",
    bad_data_refused_loudly: "boolean",
    silent_coercion_present: "boolean",
  },
  pipeline: {
    steps_rerunnable_idempotently: "boolean",
    exactly_once_effects_at_sinks: "boolean",
    backfill_tested_once: "boolean",
    explicit_step_dependencies: "boolean",
    schedules_documented: "boolean",
    failures_alert_and_retry: "boolean",
    unrecorded_manual_reruns_present: "boolean",
  },
  quality: {
    row_count_checks_between_stages: "boolean",
    freshness_checks_between_stages: "boolean",
    null_uniqueness_distribution_checks_between_stages: "boolean",
    bad_partitions_quarantined: "boolean",
    pipeline_health_dashboard_present: "boolean",
  },
  lineage: {
    source_to_transform_to_sink_tracked: "boolean",
    code_versioned: "boolean",
    config_versioned: "boolean",
    data_snapshots_versioned: "boolean",
    same_inputs_produce_same_outputs_verified: "boolean",
  },
  training: {
    reproducible_with_seeds_and_pinned_env: "boolean",
  },
  features: {
    feature_definitions_declared: "boolean",
    label_definition_declared: "boolean",
    feature_store_only_when_justified: "boolean",
  },
  splits: {
    train_rows: "number",
    eval_rows: "number",
    test_rows: "number",
    declared_total_rows: "number",
    leakage_checks_cover_time_target_and_cross_splits: "boolean",
    split_by_time_or_user_when_temporal: "boolean",
    class_balance_assessed: "boolean",
  },
  privacy: {
    pii_in_training_data_without_lawful_basis: "boolean",
  },
  lifecycle: {
    eval_suites_versioned_with_model: "boolean",
    model_registry_entry_exists: "boolean",
    model_card_covers_data_metrics_and_limits: "boolean",
    offline_eval_completed_before_prod: "boolean",
    rollout_plan_present_before_prod: "boolean",
  },
  serving: {
    deployment_pattern_declared: "boolean",
    estimated_latency_ms: "number",
    latency_budget_ms: "number",
    estimated_monthly_cost: "number",
    monthly_cost_budget: "number",
  },
  monitoring: {
    input_drift_monitored: "boolean",
    output_drift_monitored: "boolean",
    performance_decay_monitored_vs_baselines: "boolean",
    alert_thresholds_set: "boolean",
    thresholds_tied_to_retraining_policy: "boolean",
    retraining_is_a_pipeline: "boolean",
  },
};

export const SECTIONS = [
  "contracts_and_ingestion",
  "idempotency_and_orchestration",
  "quality_gates",
  "lineage_and_reproducibility",
  "ml_hygiene_and_splits",
  "lifecycle_and_serving",
  "monitoring_and_drift",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  sources_evaluated: number;
  computed_total_rows: string | null;
  total_rows_difference: string | null;
  computed_split_total_rows: string | null;
  split_total_difference: string | null;
  latency_headroom_ms: string | null;
  monthly_cost_headroom: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

interface SourceComputed {
  sourcesEvaluated: number;
  computedTotal: number | null;
  totalDifference: number | null;
}

function sourceChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): SourceComputed {
  const [datasets, hasDatasets] = getPath(manifest, "sources", "datasets");
  const [declaredTotal, hasTotal] = getPath(
    manifest, "sources", "declared_total_rows");
  if (!hasDatasets || !Array.isArray(datasets) || datasets.length === 0) {
    for (const name of [
      "source_entries_complete",
      "total_rows_matches_sum_of_source_rows",
    ] as const) {
      check(results, "contracts_and_ingestion", name,
        datasets, false, false, "no source datasets declared");
    }
    return { sourcesEvaluated: 0, computedTotal: null, totalDifference: null };
  }
  let nameIncomplete = false;
  let rowsIncomplete = false;
  let evaluated = 0;
  let total = 0;
  for (const entry of datasets as unknown[]) {
    if (!isPyDict(entry)) {
      nameIncomplete = true;
      rowsIncomplete = true;
      continue;
    }
    const [name, hasName] = getEntry(entry, "name");
    const [rows, hasRows] = getEntry(entry, "rows");
    if (!(hasName && isNonemptyStr(name))) {
      nameIncomplete = true;
    }
    if (!(hasRows && isNumber(rows))) {
      rowsIncomplete = true;
    } else {
      total += rows as number;
    }
    if (hasName && hasRows && isNonemptyStr(name) && isNumber(rows)) {
      evaluated += 1;
    }
  }
  const incomplete = nameIncomplete || rowsIncomplete;
  if (incomplete) {
    check(results, "contracts_and_ingestion", "source_entries_complete",
      datasets, false, false,
      "a source dataset entry is missing its name or rows");
  } else {
    check(results, "contracts_and_ingestion", "source_entries_complete",
      datasets, true, true,
      "every source dataset entry carries a non-empty name and numeric rows");
  }
  let computedTotal: number | null = null;
  let difference: number | null = null;
  if (rowsIncomplete || !hasTotal || !isNumber(declaredTotal)) {
    check(results, "contracts_and_ingestion",
      "total_rows_matches_sum_of_source_rows",
      datasets, false, false,
      "the declared total rows or a dataset's rows are missing, so the total cannot be re-derived");
  } else {
    computedTotal = total;
    difference = (declaredTotal as number) - total;
    check(results, "contracts_and_ingestion",
      "total_rows_matches_sum_of_source_rows",
      datasets, true, fmt6(difference) === "0.000000",
      "the declared total source rows equal the sum of the declared per-dataset rows");
  }
  return {
    sourcesEvaluated: evaluated, computedTotal,
    totalDifference: difference,
  };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: contracts_and_ingestion ----
  const { sourcesEvaluated, computedTotal, totalDifference } =
    sourceChecks(results, manifest);
  boolCheck(results, "contracts_and_ingestion",
    "schemas_and_expectations_declared",
    manifest,
    ["sources", "schemas_and_expectations_declared_for_all_inputs_and_outputs"],
    "method step 1: schemas and expectations (types, ranges, nullability) are declared for every input and output");
  boolCheck(results, "contracts_and_ingestion", "validation_on_arrival",
    manifest, ["sources", "validation_on_arrival"],
    "method step 1: data is validated on arrival at every edge");
  boolCheck(results, "contracts_and_ingestion", "bad_data_refused_loudly",
    manifest, ["sources", "bad_data_refused_loudly"],
    "method step 1: bad data is refused loudly, never accepted silently");
  falseCheck(results, "contracts_and_ingestion", "no_silent_coercion",
    manifest, ["sources", "silent_coercion_present"],
    "red line: data is never coerced silently");

  // ---- Section 2: idempotency_and_orchestration ----
  boolCheck(results, "idempotency_and_orchestration",
    "steps_rerunnable_idempotently",
    manifest, ["pipeline", "steps_rerunnable_idempotently"],
    "method step 2 / quality gate: pipeline steps are rerunnable idempotently");
  boolCheck(results, "idempotency_and_orchestration",
    "exactly_once_effects_at_sinks",
    manifest, ["pipeline", "exactly_once_effects_at_sinks"],
    "method step 2: sinks have exactly-once effects (upserts/keys)");
  boolCheck(results, "idempotency_and_orchestration", "backfill_tested_once",
    manifest, ["pipeline", "backfill_tested_once"],
    "quality gate: a backfill was tested once — backfills are supported and cheap to rerun");
  boolCheck(results, "idempotency_and_orchestration",
    "explicit_step_dependencies",
    manifest, ["pipeline", "explicit_step_dependencies"],
    "method step 3: step dependencies are explicit");
  boolCheck(results, "idempotency_and_orchestration", "schedules_documented",
    manifest, ["pipeline", "schedules_documented"],
    "method step 3: schedules are documented");
  boolCheck(results, "idempotency_and_orchestration",
    "failures_alert_and_retry",
    manifest, ["pipeline", "failures_alert_and_retry"],
    "method step 3: failures alert and retry safely");
  falseCheck(results, "idempotency_and_orchestration",
    "no_unrecorded_manual_reruns",
    manifest, ["pipeline", "unrecorded_manual_reruns_present"],
    "method step 3: there are no unrecorded 'just rerun it' habits");

  // ---- Section 3: quality_gates ----
  boolCheck(results, "quality_gates", "row_count_checks_between_stages",
    manifest, ["quality", "row_count_checks_between_stages"],
    "method step 4: row count checks run between stages");
  boolCheck(results, "quality_gates", "freshness_checks_between_stages",
    manifest, ["quality", "freshness_checks_between_stages"],
    "method step 4: freshness checks run between stages");
  boolCheck(results, "quality_gates",
    "null_uniqueness_distribution_checks_between_stages",
    manifest, ["quality", "null_uniqueness_distribution_checks_between_stages"],
    "method step 4: null, uniqueness and distribution checks run between stages");
  boolCheck(results, "quality_gates", "bad_partitions_quarantined",
    manifest, ["quality", "bad_partitions_quarantined"],
    "method step 4: bad partitions are quarantined, not passed downstream");
  boolCheck(results, "quality_gates", "pipeline_health_dashboard_present",
    manifest, ["quality", "pipeline_health_dashboard_present"],
    "method step 4: a pipeline-health dashboard exists");

  // ---- Section 4: lineage_and_reproducibility ----
  boolCheck(results, "lineage_and_reproducibility",
    "source_to_transform_to_sink_lineage_tracked",
    manifest, ["lineage", "source_to_transform_to_sink_tracked"],
    "method step 5: lineage is tracked from source through transform to sink");
  boolCheck(results, "lineage_and_reproducibility", "code_versioned",
    manifest, ["lineage", "code_versioned"],
    "method step 5: code is versioned");
  boolCheck(results, "lineage_and_reproducibility", "config_versioned",
    manifest, ["lineage", "config_versioned"],
    "method step 5: config is versioned");
  boolCheck(results, "lineage_and_reproducibility", "data_snapshots_versioned",
    manifest, ["lineage", "data_snapshots_versioned"],
    "method step 5: data snapshots are versioned where it matters");
  boolCheck(results, "lineage_and_reproducibility",
    "same_inputs_produce_same_outputs_verified",
    manifest, ["lineage", "same_inputs_produce_same_outputs_verified"],
    "method step 5: the same inputs produce the same outputs — verified, not assumed");
  boolCheck(results, "lineage_and_reproducibility",
    "training_reproducible_with_seeds_and_pinned_env",
    manifest, ["training", "reproducible_with_seeds_and_pinned_env"],
    "method step 7 / quality gate: training is reproducible — seeds recorded and the environment pinned");

  // ---- Section 5: ml_hygiene_and_splits ----
  const [trainRows, hasTrain] = getPath(manifest, "splits", "train_rows");
  const [evalRows, hasEval] = getPath(manifest, "splits", "eval_rows");
  const [testRows, hasTest] = getPath(manifest, "splits", "test_rows");
  const [splitDeclaredTotal, hasSplitTotal] = getPath(
    manifest, "splits", "declared_total_rows");
  const splitPartsPresent = hasTrain && hasEval && hasTest &&
    isNumber(trainRows) && isNumber(evalRows) && isNumber(testRows);
  const computedSplitTotal: number | null = splitPartsPresent
    ? (trainRows as number) + (evalRows as number) + (testRows as number)
    : null;
  const splitDifference: number | null =
    computedSplitTotal !== null && hasSplitTotal &&
      isNumber(splitDeclaredTotal)
      ? (splitDeclaredTotal as number) - computedSplitTotal
      : null;
  const splitAllNumbers = splitPartsPresent && hasSplitTotal &&
    isNumber(splitDeclaredTotal);
  check(results, "ml_hygiene_and_splits",
    "split_total_matches_sum_of_split_rows",
    splitDeclaredTotal, splitAllNumbers,
    splitAllNumbers && fmt6(splitDifference) === "0.000000",
    "method step 6: the declared total split rows equal the declared train rows plus eval rows plus test rows (the skill states no split ratio, so none is imposed here)");
  boolCheck(results, "ml_hygiene_and_splits",
    "leakage_checks_cover_time_target_and_cross_splits",
    manifest, ["splits", "leakage_checks_cover_time_target_and_cross_splits"],
    "method step 6: leakage checks cover time, target and cross-split leakage");
  boolCheck(results, "ml_hygiene_and_splits",
    "split_by_time_or_user_when_temporal",
    manifest, ["splits", "split_by_time_or_user_when_temporal"],
    "method step 6: data is split by time or user when reality is temporal");
  boolCheck(results, "ml_hygiene_and_splits", "class_balance_assessed",
    manifest, ["splits", "class_balance_assessed"],
    "method step 6: class balance is assessed — awareness is declared, no ratio is imposed");
  boolCheck(results, "ml_hygiene_and_splits", "feature_definitions_declared",
    manifest, ["features", "feature_definitions_declared"],
    "method step 6: feature definitions are declared");
  boolCheck(results, "ml_hygiene_and_splits", "label_definition_declared",
    manifest, ["features", "label_definition_declared"],
    "method step 6: the label definition is declared");
  boolCheck(results, "ml_hygiene_and_splits",
    "feature_store_only_when_justified",
    manifest, ["features", "feature_store_only_when_justified"],
    "method step 6: a feature store is used only when justified");
  falseCheck(results, "ml_hygiene_and_splits",
    "no_pii_in_training_data_without_lawful_basis",
    manifest, ["privacy", "pii_in_training_data_without_lawful_basis"],
    "red line: no PII is in training data without a lawful basis");

  // ---- Section 6: lifecycle_and_serving ----
  boolCheck(results, "lifecycle_and_serving",
    "eval_suites_versioned_with_model",
    manifest, ["lifecycle", "eval_suites_versioned_with_model"],
    "method step 7: eval suites are versioned with the model");
  boolCheck(results, "lifecycle_and_serving", "model_registry_entry_exists",
    manifest, ["lifecycle", "model_registry_entry_exists"],
    "method step 7 / quality gate: a registry entry exists for the model");
  boolCheck(results, "lifecycle_and_serving",
    "model_card_covers_data_metrics_and_limits",
    manifest, ["lifecycle", "model_card_covers_data_metrics_and_limits"],
    "method step 7 / quality gate: a model card exists covering data, metrics and limits");
  boolCheck(results, "lifecycle_and_serving",
    "offline_eval_completed_before_prod",
    manifest, ["lifecycle", "offline_eval_completed_before_prod"],
    "red line: offline eval is completed before a model goes to prod");
  boolCheck(results, "lifecycle_and_serving",
    "rollout_plan_present_before_prod",
    manifest, ["lifecycle", "rollout_plan_present_before_prod"],
    "red line: a rollout plan exists before a model goes to prod");
  boolCheck(results, "lifecycle_and_serving", "deployment_pattern_declared",
    manifest, ["serving", "deployment_pattern_declared"],
    "method step 7: the deployment pattern (batch vs service) is declared");
  const [estimatedLatency, hasEstLatency] = getPath(
    manifest, "serving", "estimated_latency_ms");
  const [latencyBudget, hasLatencyBudget] = getPath(
    manifest, "serving", "latency_budget_ms");
  const latencyPresent = hasEstLatency && hasLatencyBudget &&
    isNumber(estimatedLatency) && isNumber(latencyBudget);
  const latencyHeadroom: number | null = latencyPresent
    ? (latencyBudget as number) - (estimatedLatency as number)
    : null;
  check(results, "lifecycle_and_serving",
    "latency_within_caller_declared_budget",
    latencyBudget, latencyPresent,
    latencyPresent &&
      (estimatedLatency as number) <= (latencyBudget as number),
    "method step 7: the declared estimated latency does not exceed the latency budget the caller itself declares (the skill states no latency number, so none is imposed here)");
  const [estimatedCost, hasEstCost] = getPath(
    manifest, "serving", "estimated_monthly_cost");
  const [costBudget, hasCostBudget] = getPath(
    manifest, "serving", "monthly_cost_budget");
  const costPresent = hasEstCost && hasCostBudget &&
    isNumber(estimatedCost) && isNumber(costBudget);
  const costHeadroom: number | null = costPresent
    ? (costBudget as number) - (estimatedCost as number)
    : null;
  check(results, "lifecycle_and_serving",
    "cost_within_caller_declared_budget",
    costBudget, costPresent,
    costPresent && (estimatedCost as number) <= (costBudget as number),
    "method step 7: the declared estimated monthly cost does not exceed the monthly cost budget the caller itself declares (the skill states no cost number, so none is imposed here)");

  // ---- Section 7: monitoring_and_drift ----
  boolCheck(results, "monitoring_and_drift", "input_drift_monitored",
    manifest, ["monitoring", "input_drift_monitored"],
    "method step 8: input drift is monitored");
  boolCheck(results, "monitoring_and_drift", "output_drift_monitored",
    manifest, ["monitoring", "output_drift_monitored"],
    "method step 8: output drift is monitored");
  boolCheck(results, "monitoring_and_drift",
    "performance_decay_monitored_vs_baselines",
    manifest, ["monitoring", "performance_decay_monitored_vs_baselines"],
    "method step 8: performance decay is monitored against baselines");
  boolCheck(results, "monitoring_and_drift", "alert_thresholds_set",
    manifest, ["monitoring", "alert_thresholds_set"],
    "quality gate: drift and performance monitoring is live with alert thresholds — the threshold values are the caller's, none is imposed here");
  boolCheck(results, "monitoring_and_drift",
    "thresholds_tied_to_retraining_policy",
    manifest, ["monitoring", "thresholds_tied_to_retraining_policy"],
    "method step 8: alert thresholds are tied to a retraining policy");
  boolCheck(results, "monitoring_and_drift", "retraining_is_a_pipeline",
    manifest, ["monitoring", "retraining_is_a_pipeline"],
    "method step 8: retraining is a pipeline, not a heroic weekend");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "DATA_ML_PIPELINE_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DATA_ML_PIPELINE_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "source_entries_complete" ||
      r.check === "total_rows_matches_sum_of_source_rows" ||
      r.check === "split_total_matches_sum_of_split_rows" ||
      r.check === "latency_within_caller_declared_budget" ||
      r.check === "cost_within_caller_declared_budget")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "data-ml-pipeline-engineering",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    sources_evaluated: sourcesEvaluated,
    computed_total_rows: fmt6(computedTotal),
    total_rows_difference: fmt6(totalDifference),
    computed_split_total_rows: fmt6(computedSplitTotal),
    split_total_difference: fmt6(splitDifference),
    latency_headroom_ms: fmt6(latencyHeadroom),
    monthly_cost_headroom: fmt6(costHeadroom),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DATA/ML PIPELINE ENGINEERING",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
