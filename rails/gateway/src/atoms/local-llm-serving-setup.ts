// Local LLM serving setup — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/local-llm-serving-setup/src/local_llm_serving_setup.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  setup: "string",
  workload: {
    tasks_defined: "boolean",
    context_lengths_defined: "boolean",
    concurrency_defined: "boolean",
    compute_and_vram_ram_budget_computed: "boolean",
    kv_cache_growth_accounted_and_headroom_left: "boolean",
    quantization_chosen_deliberately_with_tradeoffs: "boolean",
  },
  model_selection: {
    model_size_matched_to_task: "boolean",
  },
  models: [{
    name: "string",
    vram_ram_and_context_budget_documented: "boolean",
    version_pinned_and_checksum_recorded: "boolean",
    license_vetted_for_commercial_use: "boolean",
    performance_measured_at_realistic_context: "boolean",
    golden_task_eval_recorded: "boolean",
  }],
  serving: {
    stack_fits_host_and_workload: "boolean",
    runs_daemonless_under_supervisor_with_auto_restart: "boolean",
    bound_to_loopback_only_verified: "boolean",
    remote_access_only_via_authenticated_tunnel: "boolean",
    unauthenticated_inference_port_exposure_present: "boolean",
  },
  performance: {
    tokens_per_second_and_ttft_measured_at_realistic_context: "boolean",
    offload_layers_and_parallelism_tuned: "boolean",
    vram_overcommit_present: "boolean",
  },
  operations: {
    health_endpoint_present: "boolean",
    structured_logs_present: "boolean",
    model_catalog_pinned: "boolean",
    disk_space_for_weights_monitored: "boolean",
    upgrade_path_backup_swap_verify_rollback_present: "boolean",
  },
  fallback: {
    fallback_chain_declared_local_primary_secondary_provider: "boolean",
    model_swaps_behind_stable_openai_compatible_api: "boolean",
    each_failover_tested_deliberately_including_primary_failure: "boolean",
  },
  evaluation: {
    golden_task_suite_run_per_model_change: "boolean",
    quality_and_speed_recorded_before_promotion: "boolean",
    silent_model_swaps_present: "boolean",
  },
};

export const SECTIONS = [
  "workload_and_memory_budget",
  "model_selection_and_provenance",
  "serving_stack_and_exposure",
  "performance_and_operations",
  "fallback_chains_and_evaluation",
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
  setup: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  models_count: number | null;
  models_without_budget_documentation: string[] | null;
  budget_coverage: string | null;
  models_without_pinned_version_and_checksum: string[] | null;
  models_without_vetted_license: string[] | null;
  models_without_performance_measurement: string[] | null;
  performance_coverage: string | null;
  models_without_golden_task_eval: string[] | null;
  golden_eval_coverage: string | null;
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

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function rowsWithout(rows: unknown[], field: string): string[] {
  return rows
    .filter((c) => hasField(c, field) &&
      (c as Record<string, unknown>)[field] !== true)
    .map(rowName);
}

function coverage(
  rows: unknown[],
  count: number | null,
  field: string,
): number | null {
  if (count === null || count === 0) return null;
  return rows.filter((c) => isPyDict(c) && c[field] === true).length / count;
}

function everyCheck(
  results: CheckResult[],
  section: string,
  name: string,
  modelsRaw: unknown,
  modelsIsList: boolean,
  rows: unknown[],
  field: string,
  evidence: string,
): void {
  const present = modelsIsList &&
    rows.every((c) => hasField(c, field));
  check(results, section, name, modelsRaw, present,
    modelsIsList && rows.length > 0 &&
      rows.every((c) => isPyDict(c) && c[field] === true),
    evidence);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [modelsRaw, hasModels] = getPath(manifest, "models");
  const modelsIsList = hasModels && Array.isArray(modelsRaw);
  const rows: unknown[] = modelsIsList ? (modelsRaw as unknown[]) : [];
  const modelsCount: number | null = modelsIsList ? rows.length : null;

  const modelsWithoutBudget: string[] | null = modelsIsList
    ? rowsWithout(rows, "vram_ram_and_context_budget_documented") : null;
  const modelsWithoutPin: string[] | null = modelsIsList
    ? rowsWithout(rows, "version_pinned_and_checksum_recorded") : null;
  const modelsWithoutVettedLicense: string[] | null = modelsIsList
    ? rowsWithout(rows, "license_vetted_for_commercial_use") : null;
  const modelsWithoutPerformance: string[] | null = modelsIsList
    ? rowsWithout(rows, "performance_measured_at_realistic_context") : null;
  const modelsWithoutGoldenEval: string[] | null = modelsIsList
    ? rowsWithout(rows, "golden_task_eval_recorded") : null;
  const budgetCoverage: number | null = modelsIsList
    ? coverage(rows, modelsCount, "vram_ram_and_context_budget_documented")
    : null;
  const performanceCoverage: number | null = modelsIsList
    ? coverage(rows, modelsCount, "performance_measured_at_realistic_context")
    : null;
  const goldenEvalCoverage: number | null = modelsIsList
    ? coverage(rows, modelsCount, "golden_task_eval_recorded") : null;

  // ---- Section 1: workload_and_memory_budget ----
  boolCheck(results, "workload_and_memory_budget",
    "tasks_defined", manifest,
    ["workload", "tasks_defined"],
    "workload first: the tasks the setup serves are defined before any budget is set");
  boolCheck(results, "workload_and_memory_budget",
    "context_lengths_defined", manifest,
    ["workload", "context_lengths_defined"],
    "workload first: the context lengths served are defined");
  boolCheck(results, "workload_and_memory_budget",
    "concurrency_defined", manifest,
    ["workload", "concurrency_defined"],
    "workload first: the concurrency served is defined");
  boolCheck(results, "workload_and_memory_budget",
    "compute_and_vram_ram_budget_computed", manifest,
    ["workload", "compute_and_vram_ram_budget_computed"],
    "workload first: compute and VRAM/RAM budget are computed from the declared tasks, context lengths and concurrency");
  boolCheck(results, "workload_and_memory_budget",
    "kv_cache_growth_accounted_and_headroom_left", manifest,
    ["workload", "kv_cache_growth_accounted_and_headroom_left"],
    "workload first: KV-cache growth with context is accounted for and headroom is left");
  boolCheck(results, "workload_and_memory_budget",
    "quantization_chosen_deliberately_with_tradeoffs", manifest,
    ["workload", "quantization_chosen_deliberately_with_tradeoffs"],
    "workload first: quantization is chosen deliberately — Q4/Q5/Q8 trade-offs weighed — not by default");
  check(results, "workload_and_memory_budget",
    "models_declared", modelsRaw, modelsIsList,
    modelsIsList && (modelsCount as number) > 0,
    "the declared record names its served models — the models list is present and non-empty");
  everyCheck(results, "workload_and_memory_budget",
    "every_model_vram_ram_and_context_budget_documented",
    modelsRaw, modelsIsList, rows,
    "vram_ram_and_context_budget_documented",
    "quality gate: VRAM/RAM + context budget are documented for each served model");

  // ---- Section 2: model_selection_and_provenance ----
  boolCheck(results, "model_selection_and_provenance",
    "model_size_matched_to_task", manifest,
    ["model_selection", "model_size_matched_to_task"],
    "model selection: model size is matched to task — small for routing/summaries, larger for reasoning");
  everyCheck(results, "model_selection_and_provenance",
    "every_model_version_pinned_and_checksum_recorded",
    modelsRaw, modelsIsList, rows,
    "version_pinned_and_checksum_recorded",
    "model selection: every served model row pins its exact version and records its checksum (provenance)");
  everyCheck(results, "model_selection_and_provenance",
    "every_model_license_vetted_for_commercial_use",
    modelsRaw, modelsIsList, rows,
    "license_vetted_for_commercial_use",
    "red line: every served model row declares its license checked for commercial use before adoption — no unvetted model licenses");

  // ---- Section 3: serving_stack_and_exposure ----
  boolCheck(results, "serving_stack_and_exposure",
    "serving_stack_selected_to_fit_host_and_workload", manifest,
    ["serving", "stack_fits_host_and_workload"],
    "serving stack: the stack — llama.cpp server / Ollama / vLLM-class — is selected as it fits the host and workload");
  boolCheck(results, "serving_stack_and_exposure",
    "runs_daemonless_under_supervisor_with_auto_restart", manifest,
    ["serving", "runs_daemonless_under_supervisor_with_auto_restart"],
    "serving stack: the server runs daemonless under systemd (or a Windows service) with auto-restart");
  boolCheck(results, "serving_stack_and_exposure",
    "loopback_only_binding_verified", manifest,
    ["serving", "bound_to_loopback_only_verified"],
    "quality gate: loopback-only binding is verified");
  boolCheck(results, "serving_stack_and_exposure",
    "remote_access_only_via_authenticated_tunnel", manifest,
    ["serving", "remote_access_only_via_authenticated_tunnel"],
    "serving stack: remote access is only via an authenticated tunnel");
  falseCheck(results, "serving_stack_and_exposure",
    "no_unauthenticated_inference_port_exposure", manifest,
    ["serving", "unauthenticated_inference_port_exposure_present"],
    "red line: no unauthenticated exposure of inference ports is present");

  // ---- Section 4: performance_and_operations ----
  boolCheck(results, "performance_and_operations",
    "tokens_per_second_and_ttft_measured_at_realistic_context", manifest,
    ["performance", "tokens_per_second_and_ttft_measured_at_realistic_context"],
    "performance: tokens/s and time-to-first-token are measured at realistic context");
  boolCheck(results, "performance_and_operations",
    "offload_layers_and_parallelism_tuned", manifest,
    ["performance", "offload_layers_and_parallelism_tuned"],
    "performance: offload layers and parallelism are tuned");
  falseCheck(results, "performance_and_operations",
    "no_vram_overcommit", manifest,
    ["performance", "vram_overcommit_present"],
    "performance: VRAM is not overcommitted — \"it loads\" is not \"it serves\"");
  everyCheck(results, "performance_and_operations",
    "every_model_performance_measured_at_realistic_context",
    modelsRaw, modelsIsList, rows,
    "performance_measured_at_realistic_context",
    "performance: every served model row declares its performance measured at realistic context");
  boolCheck(results, "performance_and_operations",
    "health_endpoint_present", manifest,
    ["operations", "health_endpoint_present"],
    "operations: a health endpoint is present");
  boolCheck(results, "performance_and_operations",
    "structured_logs_present", manifest,
    ["operations", "structured_logs_present"],
    "operations: structured logs are kept");
  boolCheck(results, "performance_and_operations",
    "model_catalog_pinned", manifest,
    ["operations", "model_catalog_pinned"],
    "operations: the model catalog is pinned");
  boolCheck(results, "performance_and_operations",
    "disk_space_for_weights_monitored", manifest,
    ["operations", "disk_space_for_weights_monitored"],
    "operations: disk space for weights is monitored");
  boolCheck(results, "performance_and_operations",
    "upgrade_path_backup_swap_verify_rollback_present", manifest,
    ["operations", "upgrade_path_backup_swap_verify_rollback_present"],
    "operations: upgrades follow backup -> swap -> verify, with a rollback path");

  // ---- Section 5: fallback_chains_and_evaluation ----
  boolCheck(results, "fallback_chains_and_evaluation",
    "fallback_chain_declared_local_primary_secondary_provider", manifest,
    ["fallback", "fallback_chain_declared_local_primary_secondary_provider"],
    "fallback chains: the chain is declared — local primary -> local secondary -> declared provider");
  boolCheck(results, "fallback_chains_and_evaluation",
    "model_swaps_behind_stable_openai_compatible_api", manifest,
    ["fallback", "model_swaps_behind_stable_openai_compatible_api"],
    "fallback chains: models swap behind a stable API (OpenAI-compatible surface) so apps never change");
  boolCheck(results, "fallback_chains_and_evaluation",
    "fallback_chain_tested_by_failing_primary_deliberately", manifest,
    ["fallback", "each_failover_tested_deliberately_including_primary_failure"],
    "quality gate: the fallback chain is tested — each failover is tested deliberately, the primary failed on purpose");
  boolCheck(results, "fallback_chains_and_evaluation",
    "golden_task_suite_run_per_model_change", manifest,
    ["evaluation", "golden_task_suite_run_per_model_change"],
    "evaluation: a golden task suite is run per model change");
  boolCheck(results, "fallback_chains_and_evaluation",
    "quality_and_speed_recorded_before_promotion", manifest,
    ["evaluation", "quality_and_speed_recorded_before_promotion"],
    "evaluation: quality and speed are recorded before promotion");
  falseCheck(results, "fallback_chains_and_evaluation",
    "no_silent_model_swaps", manifest,
    ["evaluation", "silent_model_swaps_present"],
    "red line: no silent model swaps in production are present");
  everyCheck(results, "fallback_chains_and_evaluation",
    "every_model_golden_task_eval_recorded",
    modelsRaw, modelsIsList, rows,
    "golden_task_eval_recorded",
    "quality gate: a golden-task eval is recorded for every served model");

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
    verdict = "LOCAL_LLM_SERVING_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "LOCAL_LLM_SERVING_SOUND";
  }

  const computedNames = [
    "models_declared",
    "every_model_vram_ram_and_context_budget_documented",
    "every_model_version_pinned_and_checksum_recorded",
    "every_model_license_vetted_for_commercial_use",
    "every_model_performance_measured_at_realistic_context",
    "every_model_golden_task_eval_recorded",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "local-llm-serving-setup",
    atom_version: "0.1.0",
    setup: manifest["setup"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    models_count: modelsCount,
    models_without_budget_documentation: modelsWithoutBudget,
    budget_coverage: fmt6(budgetCoverage),
    models_without_pinned_version_and_checksum: modelsWithoutPin,
    models_without_vetted_license: modelsWithoutVettedLicense,
    models_without_performance_measurement: modelsWithoutPerformance,
    performance_coverage: fmt6(performanceCoverage),
    models_without_golden_task_eval: modelsWithoutGoldenEval,
    golden_eval_coverage: fmt6(goldenEvalCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LOCAL LLM SERVING SETUP",
    `setup: ${pyStr(verdict.setup ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
