import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/validated-simulation-scenario-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  pack_title: "thermal-training-pack",
  purpose: { purpose_declared: true, fidelity_level_declared: true,
             modeled_scope_declared: true, abstractions_declared: true,
             limits_stated_upfront: true },
  core: { deterministic_core_declared: true,
          units_explicit_si_declared: true,
          domain_equations_referenced: true,
          no_magic_numbers_declared: true },
  parameters: [
    { parameter_id: "par-1", parameter_name: "Flow velocity", unit: "m/s",
      value: 2.5, basis_note: "Pump curve datasheet rev 3" },
    { parameter_id: "par-2", parameter_name: "Ambient temperature", unit: "K",
      value: 293, basis_note: "Reference case table 2" },
  ],
  randomness: { stochastic_elements_present: true, seeds_logged: true,
                reproducibility_from_seed_log_declared: true,
                stochastic_runs_reported_as_distributions: true,
                distribution_bands_and_run_counts_reported: true },
  scenarios: [
    { scenario_id: "scn-1", scenario_name: "Flow sweep",
      scenario_type: "parameter_sweep",
      expected_outcome: "Pressure rises monotonically with flow",
      seed_value: 42 },
    { scenario_id: "scn-2", scenario_name: "Zero flow boundary",
      scenario_type: "boundary_case",
      expected_outcome: "System settles at ambient temperature",
      seed_value: 7 },
    { scenario_id: "scn-3", scenario_name: "Textbook golden case",
      scenario_type: "golden",
      expected_outcome: "Matches textbook worked example", seed_value: 11 },
    { scenario_id: "scn-4", scenario_name: "Progressive fouling",
      scenario_type: "evolving_fault",
      expected_outcome: "Efficiency degrades across the run", seed_value: 13 },
  ],
  scenario_library: { golden_scenarios_used_as_regression_tests: true,
                      scenario_expected_outcomes_recorded: true,
                      evolving_faults_applicable: true },
  model_version: "2.1.0",
  validation: { validation_cases_cited: true,
                errors_reported_honestly: true,
                model_changes_versioned_without_silent_edits: true },
  validation_cases: [
    { case_id: "val-1", case_name: "Textbook case A",
      reference_source: "Textbook worked example 4.2",
      expected_value: 100, simulated_value: 102.5,
      absolute_error_declared: 2.5 },
    { case_id: "val-2", case_name: "Field case B",
      reference_source: "Field trial report 2024-11",
      expected_value: 50, simulated_value: 49, absolute_error_declared: 1 },
  ],
  interaction: { sane_defaults_declared: true,
                 step_pause_rewind_controls_declared: true,
                 explanatory_overlays_declared: true,
                 run_logs_exportable: true,
                 live_interactive_ui_present: true },
  performance: { heavy_compute_present: true,
                 heavy_compute_chunked_behind_workers: true,
                 interactive_frame_budget_declared: true },
  red_lines: { sim_output_presented_as_field_truth_present: false,
               hidden_model_edits_present: false,
               safety_critical_training_without_warning_labels_present: false,
               single_stochastic_outcome_presented_as_certain_present: false,
               unseeded_randomness_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 52);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.simulation_parameters_count, 2);
  assert.equal(v.simulation_scenarios_count, 4);
  assert.equal(v.simulation_validation_cases_count, 2);
  assert.deepEqual(v.duplicate_simulation_parameter_ids, []);
  assert.equal(v.simulation_scenario_golden_present, true);
  assert.equal(v.simulation_validation_max_declared_absolute_error, "2.500000");
  assert.equal(v.parameter_basis_note_ratio, "1.000000");
  assert.equal(v.scenario_seed_coverage_ratio, "1.000000");
  assert.equal(v.validation_error_match_ratio, "1.000000");
});

test("test_limits_not_stated_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.purpose.limits_stated_upfront = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_NOT_SOUND");
  assert.equal(v.sections["purpose_and_fidelity"], "fail");
  assert.equal(checkStatus(v, "sim_scenario_pack_limits_stated_upfront"), "fail");
});

test("test_duplicate_parameter_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.parameters[1].parameter_id = "par-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_parameter_id_unique"), "fail");
  assert.deepEqual(v.duplicate_simulation_parameter_ids, ["par-1"]);
});

test("test_empty_parameters_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.parameters = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_parameters_list_declared"), "fail");
  assert.equal(v.simulation_parameters_count, 0);
  assert.equal(v.parameter_basis_note_ratio, null);
});

test("test_absent_parameters_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.parameters;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sim_scenario_pack_parameters_list_declared"), "missing");
  assert.equal(v.simulation_parameters_count, null);
  assert.equal(v.computed_status, null);
});

test("test_non_si_unit_fails", () => {
  const m = clone(COMPLETE) as any;
  m.parameters[0].unit = "rpm";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_parameter_unit_recognised_si"), "fail");
  assert.deepEqual(v.simulation_parameters_with_invalid_unit, ["par-1"]);
});

test("test_empty_basis_note_fails", () => {
  const m = clone(COMPLETE) as any;
  m.parameters[1].basis_note = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_parameter_basis_note_declared"), "fail");
  assert.deepEqual(v.simulation_parameters_without_basis_note, ["par-2"]);
  assert.equal(v.parameter_basis_note_ratio, "0.500000");
});

test("test_missing_parameter_value_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.parameters[0].value;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_sim_scenario_pack_parameter_value_declared"), "missing");
});

test("test_stochastic_single_outcome_reporting_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.randomness.stochastic_runs_reported_as_distributions = false;
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic"), "fail");
});

test("test_no_stochastic_elements_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.randomness.stochastic_elements_present = false;
  m.randomness.stochastic_runs_reported_as_distributions = false;
  m.randomness.distribution_bands_and_run_counts_reported = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic"), "pass");
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_SOUND");
});

test("test_scenario_without_seed_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.scenarios[0].seed_value;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_scenario_seed_declared"), "missing");
  assert.equal(v.scenario_seed_coverage_ratio, "0.750000");
});

test("test_single_scenario_fails_library", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios = m.scenarios.slice(0, 1);
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_scenarios_list_declared"), "fail");
});

test("test_invalid_scenario_type_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].scenario_type = "free_play";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_scenario_type_recognised"), "fail");
  assert.deepEqual(v.simulation_scenarios_with_invalid_scenario_type, ["scn-1"]);
});

test("test_no_golden_scenario_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[2].scenario_type = "nominal_case";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_golden_scenario_present"), "fail");
  assert.equal(v.simulation_scenario_golden_present, false);
});

test("test_no_boundary_case_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[1].scenario_type = "nominal_case";
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_boundary_case_scenario_present"), "fail");
});

test("test_evolving_fault_applicable_but_absent_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[3].scenario_type = "nominal_case";
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_evolving_fault_scenario_present_where_applicable"), "fail");
});

test("test_evolving_fault_not_applicable_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.scenario_library.evolving_faults_applicable = false;
  m.scenarios[3].scenario_type = "nominal_case";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_evolving_fault_scenario_present_where_applicable"), "pass");
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_SOUND");
});

test("test_empty_expected_outcome_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[2].expected_outcome = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_scenario_expected_outcome_declared"), "fail");
  assert.deepEqual(v.simulation_scenarios_without_expected_outcome, ["scn-3"]);
  assert.equal(v.scenario_expected_outcome_ratio, "0.750000");
});

test("test_empty_model_version_fails", () => {
  const m = clone(COMPLETE) as any;
  m.model_version = "";
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_model_version_declared"), "fail");
});

test("test_absent_model_version_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.model_version;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_model_version_declared"), "missing");
  assert.equal(v.computed_status, null);
});

test("test_absolute_error_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.validation_cases[0].absolute_error_declared = 3;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_validation_case_absolute_error_recomputes"), "fail");
  assert.deepEqual(v.simulation_validation_cases_with_error_mismatch, ["val-1"]);
  assert.equal(v.validation_error_match_ratio, "0.500000");
});

test("test_negative_difference_uses_absolute_error", () => {
  const m = clone(COMPLETE) as any;
  m.validation_cases[1].simulated_value = 47.5;
  m.validation_cases[1].absolute_error_declared = 2.5;
  assert.equal(checkStatus(evaluate(m), "every_sim_scenario_pack_validation_case_absolute_error_recomputes"), "pass");
});

test("test_empty_reference_source_fails", () => {
  const m = clone(COMPLETE) as any;
  m.validation_cases[0].reference_source = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sim_scenario_pack_validation_case_reference_source_declared"), "fail");
  assert.deepEqual(v.simulation_validation_cases_without_reference_source, ["val-1"]);
  assert.equal(v.validation_case_reference_ratio, "0.500000");
});

test("test_live_ui_without_frame_budget_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.performance.interactive_frame_budget_declared = false;
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui"), "fail");
});

test("test_no_live_ui_passes_frame_budget_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.interaction.live_interactive_ui_present = false;
  m.performance.interactive_frame_budget_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui"), "pass");
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_SOUND");
});

test("test_heavy_compute_not_chunked_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.performance.heavy_compute_chunked_behind_workers = false;
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_heavy_compute_chunked_behind_workers_where_heavy"), "fail");
});

test("test_run_logs_not_exportable_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.interaction.run_logs_exportable = false;
  assert.equal(evaluate(m).sections["interaction_logs_and_performance"], "fail");
});

test("test_sim_output_as_field_truth_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.sim_output_presented_as_field_truth_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "SIMULATION_SCENARIO_PACK_NOT_SOUND");
});

test("test_unseeded_randomness_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unseeded_randomness_present = true;
  assert.equal(checkStatus(evaluate(m), "sim_scenario_pack_free_of_unseeded_randomness"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.validation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["validation_against_reality"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.simulation_scenarios_count, null);
  assert.equal(v.simulation_scenario_golden_present, null);
  assert.equal(v.validation_error_match_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SIMULATION_SCENARIO_PACK_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pack_title = 12345;
  assert.throws(() => evaluate(m), fieldError("pack_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ purpose: "should-be-an-object" }), fieldError("purpose"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ scenarios: { scenario_id: "scn-1" } }), fieldError("scenarios"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ parameters: ["par-1"] }), fieldError("parameters[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.purpose.purpose_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("purpose.purpose_declared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.parameters[0].value = "2.5";
  assert.throws(() => evaluate(m), fieldError("parameters[0].value"));
});

test("malformed: nested seed as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].seed_value = "42";
  assert.throws(() => evaluate(m), fieldError("scenarios[0].seed_value"));
});

test("malformed: model version as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.model_version = 210;
  assert.throws(() => evaluate(m), fieldError("model_version"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines = null;
  assert.throws(() => evaluate(m), fieldError("red_lines"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("validated-simulation-scenario-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
