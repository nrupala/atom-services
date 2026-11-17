// Validated simulation scenario pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/validated-simulation-scenario-pack/src/validated_simulation_scenario_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  pack_title: "string",
  purpose: {
    purpose_declared: "boolean",
    fidelity_level_declared: "boolean",
    modeled_scope_declared: "boolean",
    abstractions_declared: "boolean",
    limits_stated_upfront: "boolean",
  },
  core: {
    deterministic_core_declared: "boolean",
    units_explicit_si_declared: "boolean",
    domain_equations_referenced: "boolean",
    no_magic_numbers_declared: "boolean",
  },
  parameters: [{
    parameter_id: "string",
    parameter_name: "string",
    unit: "string",
    value: "number",
    basis_note: "string",
  }],
  randomness: {
    stochastic_elements_present: "boolean",
    seeds_logged: "boolean",
    reproducibility_from_seed_log_declared: "boolean",
    stochastic_runs_reported_as_distributions: "boolean",
    distribution_bands_and_run_counts_reported: "boolean",
  },
  scenarios: [{
    scenario_id: "string",
    scenario_name: "string",
    scenario_type: "string",
    expected_outcome: "string",
    seed_value: "number",
  }],
  scenario_library: {
    golden_scenarios_used_as_regression_tests: "boolean",
    scenario_expected_outcomes_recorded: "boolean",
    evolving_faults_applicable: "boolean",
  },
  model_version: "string",
  validation: {
    validation_cases_cited: "boolean",
    errors_reported_honestly: "boolean",
    model_changes_versioned_without_silent_edits: "boolean",
  },
  validation_cases: [{
    case_id: "string",
    case_name: "string",
    reference_source: "string",
    expected_value: "number",
    simulated_value: "number",
    absolute_error_declared: "number",
  }],
  interaction: {
    sane_defaults_declared: "boolean",
    step_pause_rewind_controls_declared: "boolean",
    explanatory_overlays_declared: "boolean",
    run_logs_exportable: "boolean",
    live_interactive_ui_present: "boolean",
  },
  performance: {
    heavy_compute_present: "boolean",
    heavy_compute_chunked_behind_workers: "boolean",
    interactive_frame_budget_declared: "boolean",
  },
  red_lines: {
    sim_output_presented_as_field_truth_present: "boolean",
    hidden_model_edits_present: "boolean",
    safety_critical_training_without_warning_labels_present: "boolean",
    single_stochastic_outcome_presented_as_certain_present: "boolean",
    unseeded_randomness_present: "boolean",
  },
};

export const SECTIONS = [
  "purpose_and_fidelity",
  "model_core_and_units",
  "randomness_and_reproducibility",
  "scenario_library_and_golden_cases",
  "validation_against_reality",
  "interaction_logs_and_performance",
  "red_lines",
] as const;

const SCENARIO_TYPES = [
  "parameter_sweep",
  "boundary_case",
  "evolving_fault",
  "golden",
  "nominal_case",
];

const SI_UNITS = [
  "m", "kg", "s", "A", "K", "mol", "cd", "rad",
  "Hz", "N", "Pa", "J", "W", "C", "V", "F", "ohm", "S",
  "Wb", "T", "H", "lm", "lx",
  "dimensionless", "m/s", "m/s^2", "kg/m^3", "N*m",
];

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
  pack_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  simulation_parameters_count: number | null;
  simulation_scenarios_count: number | null;
  simulation_validation_cases_count: number | null;
  duplicate_simulation_parameter_ids: string[] | null;
  duplicate_simulation_scenario_ids: string[] | null;
  duplicate_simulation_validation_case_ids: string[] | null;
  simulation_parameters_without_name: string[] | null;
  simulation_parameters_with_invalid_unit: string[] | null;
  simulation_parameters_without_basis_note: string[] | null;
  simulation_scenarios_without_name: string[] | null;
  simulation_scenarios_with_invalid_scenario_type: string[] | null;
  simulation_scenarios_without_expected_outcome: string[] | null;
  simulation_validation_cases_without_name: string[] | null;
  simulation_validation_cases_without_reference_source: string[] | null;
  simulation_validation_cases_with_error_mismatch: string[] | null;
  simulation_scenario_golden_present: boolean | null;
  simulation_scenario_parameter_sweep_present: boolean | null;
  simulation_scenario_boundary_case_present: boolean | null;
  simulation_scenario_evolving_fault_present: boolean | null;
  simulation_validation_max_declared_absolute_error: string | null;
  parameter_basis_note_ratio: string | null;
  scenario_expected_outcome_ratio: string | null;
  scenario_seed_coverage_ratio: string | null;
  validation_case_reference_ratio: string | null;
  validation_error_match_ratio: string | null;
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [parametersRaw, hasParameters] = getPath(manifest, "parameters");
  const paramIsList = hasParameters && Array.isArray(parametersRaw);
  const paramRows: unknown[] = paramIsList ? (parametersRaw as unknown[]) : [];
  const paramCount: number | null = paramIsList ? paramRows.length : null;

  const [scenariosRaw, hasScenarios] = getPath(manifest, "scenarios");
  const scenIsList = hasScenarios && Array.isArray(scenariosRaw);
  const scenRows: unknown[] = scenIsList ? (scenariosRaw as unknown[]) : [];
  const scenCount: number | null = scenIsList ? scenRows.length : null;

  const [valCasesRaw, hasValCases] = getPath(manifest, "validation_cases");
  const valIsList = hasValCases && Array.isArray(valCasesRaw);
  const valRows: unknown[] = valIsList ? (valCasesRaw as unknown[]) : [];
  const valCount: number | null = valIsList ? valRows.length : null;

  const [modelVersion, hasModelVersion] = getPath(manifest, "model_version");

  const duplicateParameterIds: string[] | null = paramIsList
    ? duplicates(paramRows, "parameter_id") : null;
  const duplicateScenarioIds: string[] | null = scenIsList
    ? duplicates(scenRows, "scenario_id") : null;
  const duplicateValidationCaseIds: string[] | null = valIsList
    ? duplicates(valRows, "case_id") : null;

  const parametersWithoutName: string[] | null = paramIsList
    ? paramRows.filter((c) => hasField(c, "parameter_name") &&
        !nonemptyStr((c as Record<string, unknown>)["parameter_name"]))
        .map((c) => rowName(c, "parameter_id"))
    : null;
  const parametersWithInvalidUnit: string[] | null = paramIsList
    ? paramRows.filter((c) => hasField(c, "unit") &&
        !SI_UNITS.includes((c as Record<string, unknown>)["unit"] as string))
        .map((c) => rowName(c, "parameter_id"))
    : null;
  const parametersWithoutBasisNote: string[] | null = paramIsList
    ? paramRows.filter((c) => hasField(c, "basis_note") &&
        !nonemptyStr((c as Record<string, unknown>)["basis_note"]))
        .map((c) => rowName(c, "parameter_id"))
    : null;
  const scenariosWithoutName: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "scenario_name") &&
        !nonemptyStr((c as Record<string, unknown>)["scenario_name"]))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosWithInvalidType: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "scenario_type") &&
        !SCENARIO_TYPES.includes(
          (c as Record<string, unknown>)["scenario_type"] as string))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosWithoutExpectedOutcome: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "expected_outcome") &&
        !nonemptyStr((c as Record<string, unknown>)["expected_outcome"]))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const validationCasesWithoutName: string[] | null = valIsList
    ? valRows.filter((c) => hasField(c, "case_name") &&
        !nonemptyStr((c as Record<string, unknown>)["case_name"]))
        .map((c) => rowName(c, "case_id"))
    : null;
  const validationCasesWithoutReference: string[] | null = valIsList
    ? valRows.filter((c) => hasField(c, "reference_source") &&
        !nonemptyStr((c as Record<string, unknown>)["reference_source"]))
        .map((c) => rowName(c, "case_id"))
    : null;

  const errorMatches = (c: unknown): boolean => {
    if (!(hasField(c, "expected_value") && hasField(c, "simulated_value") &&
        hasField(c, "absolute_error_declared"))) return false;
    const rec = c as Record<string, unknown>;
    const expected = rec["expected_value"];
    const simulated = rec["simulated_value"];
    const declared = rec["absolute_error_declared"];
    if (!(isNumber(expected) && isNumber(simulated) && isNumber(declared))) {
      return false;
    }
    return fmt6(Math.abs(simulated - expected)) === fmt6(declared);
  };

  const validationCasesWithErrorMismatch: string[] | null = valIsList
    ? valRows.filter((c) => hasField(c, "expected_value") &&
        hasField(c, "simulated_value") &&
        hasField(c, "absolute_error_declared") && !errorMatches(c))
        .map((c) => rowName(c, "case_id"))
    : null;

  const scenarioTypePresent = (t: string): boolean =>
    scenRows.some((c) => isPyDict(c) && c["scenario_type"] === t);
  const scenarioGoldenPresent: boolean | null = scenIsList
    ? scenarioTypePresent("golden") : null;
  const scenarioSweepPresent: boolean | null = scenIsList
    ? scenarioTypePresent("parameter_sweep") : null;
  const scenarioBoundaryPresent: boolean | null = scenIsList
    ? scenarioTypePresent("boundary_case") : null;
  const scenarioEvolvingPresent: boolean | null = scenIsList
    ? scenarioTypePresent("evolving_fault") : null;

  const declaredErrors: number[] = [];
  for (const c of valRows) {
    if (isPyDict(c) && isNumber(c["absolute_error_declared"])) {
      declaredErrors.push(c["absolute_error_declared"] as number);
    }
  }
  const maxDeclaredError: number | null =
    valIsList && declaredErrors.length > 0
      ? Math.max(...declaredErrors) : null;

  const parameterBasisRatio: number | null =
    paramIsList && paramCount !== null && paramCount > 0
      ? paramRows.filter((c) => isPyDict(c) && nonemptyStr(c["basis_note"])).length / paramCount
      : null;
  const scenarioExpectedOutcomeRatio: number | null =
    scenIsList && scenCount !== null && scenCount > 0
      ? scenRows.filter((c) => isPyDict(c) && nonemptyStr(c["expected_outcome"])).length / scenCount
      : null;
  const scenarioSeedCoverageRatio: number | null =
    scenIsList && scenCount !== null && scenCount > 0
      ? scenRows.filter((c) => hasField(c, "seed_value")).length / scenCount
      : null;
  const validationCaseReferenceRatio: number | null =
    valIsList && valCount !== null && valCount > 0
      ? valRows.filter((c) => isPyDict(c) && nonemptyStr(c["reference_source"])).length / valCount
      : null;
  const validationErrorMatchRatio: number | null =
    valIsList && valCount !== null && valCount > 0
      ? valRows.filter((c) => errorMatches(c)).length / valCount
      : null;

  // ---- Section 1: purpose_and_fidelity ----
  boolCheck(results, "purpose_and_fidelity",
    "sim_scenario_pack_purpose_declared", manifest,
    ["purpose", "purpose_declared"],
    "purpose and fidelity: the pack declares its purpose — teaching, predicting or testing — which sets the fidelity bar");
  boolCheck(results, "purpose_and_fidelity",
    "sim_scenario_pack_fidelity_level_declared", manifest,
    ["purpose", "fidelity_level_declared"],
    "purpose and fidelity: the fidelity level the declared purpose demands is declared");
  boolCheck(results, "purpose_and_fidelity",
    "sim_scenario_pack_modeled_scope_declared", manifest,
    ["purpose", "modeled_scope_declared"],
    "purpose and fidelity: what the model models is documented");
  boolCheck(results, "purpose_and_fidelity",
    "sim_scenario_pack_abstractions_declared", manifest,
    ["purpose", "abstractions_declared"],
    "purpose and fidelity: what the model abstracts away is documented");
  boolCheck(results, "purpose_and_fidelity",
    "sim_scenario_pack_limits_stated_upfront", manifest,
    ["purpose", "limits_stated_upfront"],
    "purpose and fidelity: the model's limits are stated up front");

  // ---- Section 2: model_core_and_units ----
  boolCheck(results, "model_core_and_units",
    "sim_scenario_pack_deterministic_core_declared", manifest,
    ["core", "deterministic_core_declared"],
    "core discipline: the model's core is declared deterministic where possible");
  boolCheck(results, "model_core_and_units",
    "sim_scenario_pack_units_explicit_si_declared", manifest,
    ["core", "units_explicit_si_declared"],
    "core discipline: units are declared explicit, SI everywhere");
  boolCheck(results, "model_core_and_units",
    "sim_scenario_pack_domain_equations_referenced", manifest,
    ["core", "domain_equations_referenced"],
    "core discipline: the domain equations, curves, constants and standards the model uses are referenced");
  boolCheck(results, "model_core_and_units",
    "sim_scenario_pack_no_magic_numbers_declared", manifest,
    ["core", "no_magic_numbers_declared"],
    "core discipline: the pack declares no magic numbers — every constant is named and sourced");
  check(results, "model_core_and_units",
    "sim_scenario_pack_parameters_list_declared", parametersRaw, paramIsList,
    paramIsList && paramCount !== null && paramCount >= 1,
    "parameters: the declared record names its model parameters — the list is present and names at least one parameter; an absent list is missing evidence and an empty list declares no parameterised model at all");
  const paramIdPresent = paramIsList &&
    paramRows.every((c) => hasField(c, "parameter_id"));
  check(results, "model_core_and_units",
    "every_sim_scenario_pack_parameter_id_unique", parametersRaw,
    paramIdPresent,
    paramIsList && duplicateParameterIds !== null &&
      duplicateParameterIds.length === 0,
    "parameters: no declared parameter_id is owned by more than one row");
  const paramNamePresent = paramIsList &&
    paramRows.every((c) => hasField(c, "parameter_name"));
  check(results, "model_core_and_units",
    "every_sim_scenario_pack_parameter_name_declared", parametersRaw,
    paramNamePresent,
    paramIsList && paramRows.every((c) => isPyDict(c) && nonemptyStr(c["parameter_name"])),
    "parameters: every declared parameter declares a non-empty parameter name");
  const unitPresent = paramIsList &&
    paramRows.every((c) => hasField(c, "unit"));
  check(results, "model_core_and_units",
    "every_sim_scenario_pack_parameter_unit_recognised_si", parametersRaw,
    unitPresent,
    paramIsList && paramRows.every((c) => isPyDict(c) &&
      SI_UNITS.includes(c["unit"] as string)),
    "parameters: every declared parameter's unit is a recognised SI unit — an SI base or derived unit, a listed SI compound form, or dimensionless");
  const valuePresent = paramIsList &&
    paramRows.every((c) => hasField(c, "value"));
  check(results, "model_core_and_units",
    "every_sim_scenario_pack_parameter_value_declared", parametersRaw,
    valuePresent,
    paramIsList && paramRows.every((c) => isPyDict(c) && isNumber(c["value"])),
    "parameters: every declared parameter declares a numeric value");
  const basisPresent = paramIsList &&
    paramRows.every((c) => hasField(c, "basis_note"));
  check(results, "model_core_and_units",
    "every_sim_scenario_pack_parameter_basis_note_declared", parametersRaw,
    basisPresent,
    paramIsList && paramRows.every((c) => isPyDict(c) && nonemptyStr(c["basis_note"])),
    "parameters: every declared parameter declares a non-empty basis note naming where its value comes from — the record form of no magic numbers");

  // ---- Section 3: randomness_and_reproducibility ----
  const [stochasticValue, stochasticPresent] = getPath(
    manifest, "randomness", "stochastic_elements_present");
  check(results, "randomness_and_reproducibility",
    "sim_scenario_pack_stochastic_elements_identified", stochasticValue,
    stochasticPresent, true,
    "randomness: whether the model has stochastic elements is declared — the declaration itself is the evidence, true or false; the gated distribution checks below read it");
  boolCheck(results, "randomness_and_reproducibility",
    "sim_scenario_pack_seeds_logged", manifest,
    ["randomness", "seeds_logged"],
    "randomness: the randomness is seeded and the seeds are logged");
  boolCheck(results, "randomness_and_reproducibility",
    "sim_scenario_pack_reproducibility_from_seed_log_declared", manifest,
    ["randomness", "reproducibility_from_seed_log_declared"],
    "randomness: runs are declared reproducible from the seed log");
  gatedBoolCheck(results, "randomness_and_reproducibility",
    "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic",
    manifest,
    ["randomness", "stochastic_elements_present"],
    ["randomness", "stochastic_runs_reported_as_distributions"],
    "randomness: stochastic runs are reported as distributions, not single outcomes",
    "no stochastic elements declared present");
  gatedBoolCheck(results, "randomness_and_reproducibility",
    "sim_scenario_pack_distribution_bands_and_run_counts_reported_where_stochastic",
    manifest,
    ["randomness", "stochastic_elements_present"],
    ["randomness", "distribution_bands_and_run_counts_reported"],
    "randomness: stochastic results are reported with run counts and distribution bands",
    "no stochastic elements declared present");
  const seedPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "seed_value"));
  check(results, "randomness_and_reproducibility",
    "every_sim_scenario_pack_scenario_seed_declared", scenariosRaw,
    seedPresent,
    scenIsList && scenRows.every((c) => isPyDict(c) && isNumber(c["seed_value"])),
    "randomness: every declared scenario declares the seed its runs reproduce from");

  // ---- Section 4: scenario_library_and_golden_cases ----
  boolCheck(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_golden_scenarios_used_as_regression_tests", manifest,
    ["scenario_library", "golden_scenarios_used_as_regression_tests"],
    "scenario library: golden scenarios are used as regression tests");
  boolCheck(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_scenario_expected_outcomes_recorded", manifest,
    ["scenario_library", "scenario_expected_outcomes_recorded"],
    "scenario library: expected outcomes are recorded for the scenarios");
  check(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_scenarios_list_declared", scenariosRaw, scenIsList,
    scenIsList && scenCount !== null && scenCount >= 2,
    "scenarios: the declared record names its scenario library — the list is present and names at least two scenarios; an absent list is missing evidence and a single row is one case, not a library");
  const scenIdPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "scenario_id"));
  check(results, "scenario_library_and_golden_cases",
    "every_sim_scenario_pack_scenario_id_unique", scenariosRaw, scenIdPresent,
    scenIsList && duplicateScenarioIds !== null &&
      duplicateScenarioIds.length === 0,
    "scenarios: no declared scenario_id is owned by more than one row");
  const scenNamePresent = scenIsList &&
    scenRows.every((c) => hasField(c, "scenario_name"));
  check(results, "scenario_library_and_golden_cases",
    "every_sim_scenario_pack_scenario_name_declared", scenariosRaw,
    scenNamePresent,
    scenIsList && scenRows.every((c) => isPyDict(c) && nonemptyStr(c["scenario_name"])),
    "scenarios: every declared scenario declares a non-empty scenario name");
  const typePresent = scenIsList &&
    scenRows.every((c) => hasField(c, "scenario_type"));
  check(results, "scenario_library_and_golden_cases",
    "every_sim_scenario_pack_scenario_type_recognised", scenariosRaw,
    typePresent,
    scenIsList && scenRows.every((c) => isPyDict(c) &&
      SCENARIO_TYPES.includes(c["scenario_type"] as string)),
    "scenarios: every declared scenario's type is one of parameter_sweep, boundary_case, evolving_fault, golden, nominal_case — the skill's scenario-library vocabulary");
  const outcomePresent = scenIsList &&
    scenRows.every((c) => hasField(c, "expected_outcome"));
  check(results, "scenario_library_and_golden_cases",
    "every_sim_scenario_pack_scenario_expected_outcome_declared",
    scenariosRaw, outcomePresent,
    scenIsList && scenRows.every((c) => isPyDict(c) && nonemptyStr(c["expected_outcome"])),
    "scenarios: every declared scenario declares a non-empty expected outcome");
  check(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_golden_scenario_present", scenariosRaw, scenIsList,
    scenIsList && scenarioGoldenPresent === true,
    "scenarios: at least one declared scenario is a golden scenario with an expected outcome, held as a regression test");
  check(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_parameter_sweep_scenario_present", scenariosRaw,
    scenIsList,
    scenIsList && scenarioSweepPresent === true,
    "scenarios: at least one declared scenario is a parameter sweep");
  check(results, "scenario_library_and_golden_cases",
    "sim_scenario_pack_boundary_case_scenario_present", scenariosRaw,
    scenIsList,
    scenIsList && scenarioBoundaryPresent === true,
    "scenarios: at least one declared scenario is a boundary case");
  const [evolvingGate, hasEvolvingGate] = getPath(
    manifest, "scenario_library", "evolving_faults_applicable");
  if (hasEvolvingGate && evolvingGate) {
    check(results, "scenario_library_and_golden_cases",
      "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
      scenariosRaw, scenIsList,
      scenIsList && scenarioEvolvingPresent === true,
      "scenarios: evolving faults are declared applicable, and at least one declared scenario is an evolving-fault scenario");
  } else {
    check(results, "scenario_library_and_golden_cases",
      "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
      evolvingGate, hasEvolvingGate, true,
      "evolving faults not declared applicable");
  }

  // ---- Section 5: validation_against_reality ----
  boolCheck(results, "validation_against_reality",
    "sim_scenario_pack_validation_cases_cited", manifest,
    ["validation", "validation_cases_cited"],
    "validation: the validation cases the model was checked against are cited");
  boolCheck(results, "validation_against_reality",
    "sim_scenario_pack_validation_errors_reported_honestly", manifest,
    ["validation", "errors_reported_honestly"],
    "validation: validation errors are reported honestly, not hidden or rounded away");
  boolCheck(results, "validation_against_reality",
    "sim_scenario_pack_model_changes_versioned_without_silent_edits", manifest,
    ["validation", "model_changes_versioned_without_silent_edits"],
    "validation: the model is versioned — no silent changes; a new version carries new validation");
  check(results, "validation_against_reality",
    "sim_scenario_pack_model_version_declared", modelVersion,
    hasModelVersion,
    hasModelVersion && nonemptyStr(modelVersion),
    "validation: the declared record names the model version this pack validates — an absent version is missing evidence and an empty version fails");
  check(results, "validation_against_reality",
    "sim_scenario_pack_validation_cases_list_declared", valCasesRaw,
    valIsList, valIsList && valCount !== null && valCount >= 1,
    "validation cases: the declared record names its validation cases — the list is present and names at least one case; an absent list is missing evidence and an empty list declares no validation at all");
  const valIdPresent = valIsList &&
    valRows.every((c) => hasField(c, "case_id"));
  check(results, "validation_against_reality",
    "every_sim_scenario_pack_validation_case_id_unique", valCasesRaw,
    valIdPresent,
    valIsList && duplicateValidationCaseIds !== null &&
      duplicateValidationCaseIds.length === 0,
    "validation cases: no declared case_id is owned by more than one row");
  const valNamePresent = valIsList &&
    valRows.every((c) => hasField(c, "case_name"));
  check(results, "validation_against_reality",
    "every_sim_scenario_pack_validation_case_name_declared", valCasesRaw,
    valNamePresent,
    valIsList && valRows.every((c) => isPyDict(c) && nonemptyStr(c["case_name"])),
    "validation cases: every declared validation case declares a non-empty case name");
  const refPresent = valIsList &&
    valRows.every((c) => hasField(c, "reference_source"));
  check(results, "validation_against_reality",
    "every_sim_scenario_pack_validation_case_reference_source_declared",
    valCasesRaw, refPresent,
    valIsList && valRows.every((c) => isPyDict(c) && nonemptyStr(c["reference_source"])),
    "validation cases: every declared validation case cites a non-empty reference source — the textbook, field or reference case it reproduces");
  const errorPresent = valIsList &&
    valRows.every((c) => hasField(c, "expected_value") &&
      hasField(c, "simulated_value") &&
      hasField(c, "absolute_error_declared"));
  check(results, "validation_against_reality",
    "every_sim_scenario_pack_validation_case_absolute_error_recomputes",
    valCasesRaw, errorPresent,
    valIsList && valRows.every((c) => errorMatches(c)),
    "validation cases: every declared case's declared absolute error recomputes exactly as the absolute difference between its declared simulated and expected values — the atom checks the declared arithmetic only; it never checks that a simulated value is right");

  // ---- Section 6: interaction_logs_and_performance ----
  boolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_sane_defaults_declared", manifest,
    ["interaction", "sane_defaults_declared"],
    "interaction: the harness declares sane defaults");
  boolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_step_pause_rewind_controls_declared", manifest,
    ["interaction", "step_pause_rewind_controls_declared"],
    "interaction: step, pause and rewind controls are declared");
  boolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_explanatory_overlays_declared", manifest,
    ["interaction", "explanatory_overlays_declared"],
    "interaction: overlays that explain the physics are declared");
  boolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_run_logs_exportable", manifest,
    ["interaction", "run_logs_exportable"],
    "interaction: run logs are exportable");
  gatedBoolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui",
    manifest,
    ["interaction", "live_interactive_ui_present"],
    ["performance", "interactive_frame_budget_declared"],
    "performance: an interactive frame budget is declared for the live UI",
    "no live interactive UI declared present");
  gatedBoolCheck(results, "interaction_logs_and_performance",
    "sim_scenario_pack_heavy_compute_chunked_behind_workers_where_heavy",
    manifest,
    ["performance", "heavy_compute_present"],
    ["performance", "heavy_compute_chunked_behind_workers"],
    "performance: heavy compute is chunked behind workers",
    "no heavy compute declared present");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "sim_scenario_pack_free_of_sim_output_presented_as_field_truth", manifest,
    ["red_lines", "sim_output_presented_as_field_truth_present"],
    "red line: no sim output presented as field truth is present in the record");
  falseCheck(results, "red_lines",
    "sim_scenario_pack_free_of_hidden_model_edits", manifest,
    ["red_lines", "hidden_model_edits_present"],
    "red line: no hidden model edits are present in the record");
  falseCheck(results, "red_lines",
    "sim_scenario_pack_free_of_safety_critical_training_without_warning_labels",
    manifest,
    ["red_lines", "safety_critical_training_without_warning_labels_present"],
    "red line: no safety-critical training use without warning labels is present in the record");
  falseCheck(results, "red_lines",
    "sim_scenario_pack_free_of_single_stochastic_outcome_presented_as_certain",
    manifest,
    ["red_lines", "single_stochastic_outcome_presented_as_certain_present"],
    "red line: no single stochastic outcome presented as certain is present in the record");
  falseCheck(results, "red_lines",
    "sim_scenario_pack_free_of_unseeded_randomness", manifest,
    ["red_lines", "unseeded_randomness_present"],
    "red line: no unseeded randomness is present in the record");

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
    verdict = "SIMULATION_SCENARIO_PACK_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SIMULATION_SCENARIO_PACK_SOUND";
  }

  const computedNames = [
    "sim_scenario_pack_parameters_list_declared",
    "every_sim_scenario_pack_parameter_id_unique",
    "every_sim_scenario_pack_parameter_name_declared",
    "every_sim_scenario_pack_parameter_unit_recognised_si",
    "every_sim_scenario_pack_parameter_value_declared",
    "every_sim_scenario_pack_parameter_basis_note_declared",
    "every_sim_scenario_pack_scenario_seed_declared",
    "sim_scenario_pack_scenarios_list_declared",
    "every_sim_scenario_pack_scenario_id_unique",
    "every_sim_scenario_pack_scenario_name_declared",
    "every_sim_scenario_pack_scenario_type_recognised",
    "every_sim_scenario_pack_scenario_expected_outcome_declared",
    "sim_scenario_pack_golden_scenario_present",
    "sim_scenario_pack_parameter_sweep_scenario_present",
    "sim_scenario_pack_boundary_case_scenario_present",
    "sim_scenario_pack_evolving_fault_scenario_present_where_applicable",
    "sim_scenario_pack_model_version_declared",
    "sim_scenario_pack_validation_cases_list_declared",
    "every_sim_scenario_pack_validation_case_id_unique",
    "every_sim_scenario_pack_validation_case_name_declared",
    "every_sim_scenario_pack_validation_case_reference_source_declared",
    "every_sim_scenario_pack_validation_case_absolute_error_recomputes",
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
    service: "validated-simulation-scenario-pack",
    atom_version: "0.1.0",
    pack_title: manifest["pack_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    simulation_parameters_count: paramCount,
    simulation_scenarios_count: scenCount,
    simulation_validation_cases_count: valCount,
    duplicate_simulation_parameter_ids: duplicateParameterIds,
    duplicate_simulation_scenario_ids: duplicateScenarioIds,
    duplicate_simulation_validation_case_ids: duplicateValidationCaseIds,
    simulation_parameters_without_name: parametersWithoutName,
    simulation_parameters_with_invalid_unit: parametersWithInvalidUnit,
    simulation_parameters_without_basis_note: parametersWithoutBasisNote,
    simulation_scenarios_without_name: scenariosWithoutName,
    simulation_scenarios_with_invalid_scenario_type: scenariosWithInvalidType,
    simulation_scenarios_without_expected_outcome: scenariosWithoutExpectedOutcome,
    simulation_validation_cases_without_name: validationCasesWithoutName,
    simulation_validation_cases_without_reference_source: validationCasesWithoutReference,
    simulation_validation_cases_with_error_mismatch: validationCasesWithErrorMismatch,
    simulation_scenario_golden_present: scenarioGoldenPresent,
    simulation_scenario_parameter_sweep_present: scenarioSweepPresent,
    simulation_scenario_boundary_case_present: scenarioBoundaryPresent,
    simulation_scenario_evolving_fault_present: scenarioEvolvingPresent,
    simulation_validation_max_declared_absolute_error: fmt6(maxDeclaredError),
    parameter_basis_note_ratio: fmt6(parameterBasisRatio),
    scenario_expected_outcome_ratio: fmt6(scenarioExpectedOutcomeRatio),
    scenario_seed_coverage_ratio: fmt6(scenarioSeedCoverageRatio),
    validation_case_reference_ratio: fmt6(validationCaseReferenceRatio),
    validation_error_match_ratio: fmt6(validationErrorMatchRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "VALIDATED SIMULATION SCENARIO PACK",
    `pack_title: ${pyStr(verdict.pack_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
