import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/designed-test-case-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The TEST_CASE_PACK_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  pack: "checkout-feature",
  requirements: [
    { id: "REQ-1" },
    { id: "REQ-2" },
  ],
  cases: [
    { id: "TC-1", requirement_ids: ["REQ-1"],
      level: "system", preconditions_declared: true,
      steps_declared: true,
      expected_result: "order is confirmed",
      expected_result_written_before_execution: true,
      covers_boundary: true, covers_negative: false },
    { id: "TC-2", requirement_ids: ["REQ-2"],
      level: "system", preconditions_declared: true,
      steps_declared: true,
      expected_result: "invalid quantity is rejected",
      expected_result_written_before_execution: true,
      covers_boundary: false, covers_negative: true },
  ],
  technique_application: {
    equivalence_partitioning_applied: true,
    equivalence_representative_and_edges_per_class: true,
    boundary_value_analysis_applied: true,
    boundary_just_below_at_and_above_covered: true,
    decision_tables_applicable: true,
    decision_table_rules_covered_including_awkward: true,
    stateful_behaviour_present: true,
    state_transitions_allowed_forbidden_and_interrupts_tested: true,
    many_config_axes_present: true,
    pairwise_pair_coverage_used: true },
  negative_and_error_guessing: {
    negative_cases_designed: true,
    invalid_inputs_covered: true,
    wrong_order_retries_and_partial_failure_covered: true },
  risk_selection: {
    risk_based_selection_applied: true,
    cases_ranked_by_damage_and_likelihood: true,
    highest_risk_cases_selected_first: true,
    not_tested_stated_explicitly: true },
  coverage: {
    coverage_gaps_stated_explicitly: true,
    duplicate_path_suites_present: false,
    happy_path_only_suite_present: false,
    cases_written_before_execution: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 32 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "TEST_CASE_PACK_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 30);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.requirements_count, 2);
  assert.equal(v.cases_count, 2);
  assert.deepEqual(v.untraced_requirements, []);
  assert.equal(v.requirement_trace_coverage, "1.0000");
  assert.deepEqual(v.cases_without_expected_result, []);
  assert.equal(v.expected_result_coverage, "1.0000");
  assert.deepEqual(v.cases_without_traceability, []);
  assert.deepEqual(v.duplicate_case_ids, []);
});

test("test_untraced_requirement_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].requirement_ids = ["REQ-1"];
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(v.sections["traceability_and_case_format"], "fail");
  assert.equal(checkStatus(v, "every_requirement_traced_to_at_least_one_case"), "fail");
  assert.deepEqual(v.untraced_requirements, ["REQ-2"]);
  assert.equal(v.requirement_trace_coverage, "0.5000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_case_tracing_to_undeclared_requirement_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].requirement_ids = ["REQ-99"];
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_case_traces_to_at_least_one_requirement"), "fail");
  assert.deepEqual(v.cases_without_traceability, ["TC-1"]);
});

test("test_case_missing_requirement_ids_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.cases[0].requirement_ids;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_case_traces_to_at_least_one_requirement"), "missing");
  assert.deepEqual(v.cases_without_traceability, []);
});

test("test_case_without_expected_result_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].expected_result = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_case_has_expected_result"), "fail");
  assert.deepEqual(v.cases_without_expected_result, ["TC-2"]);
  assert.equal(v.expected_result_coverage, "0.5000");
});

test("test_case_missing_expected_result_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.cases[0].expected_result;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_case_has_expected_result"), "missing");
  assert.deepEqual(v.cases_without_expected_result, ["TC-1"]);
});

test("test_duplicate_case_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].id = "TC-1";
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_case_has_unique_nonempty_id"), "fail");
  assert.deepEqual(v.duplicate_case_ids, ["TC-1"]);
});

test("test_empty_cases_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "cases_declared"), "fail");
  assert.equal(v.cases_count, 0);
  assert.equal(v.expected_result_coverage, null);
});

test("test_empty_requirements_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.requirements = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "requirements_declared"), "fail");
  assert.equal(v.requirements_count, 0);
  assert.equal(v.requirement_trace_coverage, null);
});

test("test_case_without_level_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].level = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_case_declares_level"), "fail");
});

test("test_case_without_preconditions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].preconditions_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_case_declares_preconditions"), "fail");
});

test("test_case_without_steps_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].steps_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_case_declares_steps"), "fail");
});

test("test_expected_result_not_written_before_execution_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].expected_result_written_before_execution = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_case_expected_result_written_before_execution"), "fail");
});

test("test_no_boundary_case_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].covers_boundary = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "at_least_one_boundary_case_declared"), "fail");
});

test("test_no_negative_case_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].covers_negative = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "at_least_one_negative_case_declared"), "fail");
});

test("test_equivalence_partitioning_not_applied_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.equivalence_partitioning_applied = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(v.sections["technique_coverage"], "fail");
});

test("test_decision_table_rules_missing_when_applicable", () => {
  const m = clone(COMPLETE) as any;
  delete m.technique_application.decision_table_rules_covered_including_awkward;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "decision_table_rules_covered_when_applicable"), "missing");
});

test("test_decision_tables_not_applicable_passes_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.decision_tables_applicable = false;
  delete m.technique_application.decision_table_rules_covered_including_awkward;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_SOUND");
  assert.equal(checkStatus(v, "decision_table_rules_covered_when_applicable"), "pass");
});

test("test_state_transitions_not_tested_when_stateful_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.state_transitions_allowed_forbidden_and_interrupts_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "state_transitions_tested_when_stateful"), "fail");
});

test("test_no_stateful_behaviour_passes_state_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.stateful_behaviour_present = false;
  delete m.technique_application.state_transitions_allowed_forbidden_and_interrupts_tested;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_SOUND");
});

test("test_pairwise_not_used_when_many_axes_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.pairwise_pair_coverage_used = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(checkStatus(v, "pairwise_coverage_used_when_many_config_axes"), "fail");
});

test("test_few_config_axes_passes_pairwise_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.technique_application.many_config_axes_present = false;
  delete m.technique_application.pairwise_pair_coverage_used;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_SOUND");
});

test("test_invalid_inputs_not_covered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.negative_and_error_guessing.invalid_inputs_covered = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(v.sections["negative_and_risk_selection"], "fail");
});

test("test_cases_not_ranked_by_risk_fails", () => {
  const m = clone(COMPLETE) as any;
  m.risk_selection.cases_ranked_by_damage_and_likelihood = false;
  assert.equal(evaluate(m).verdict, "TEST_CASE_PACK_NOT_SOUND");
});

test("test_not_tested_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.risk_selection.not_tested_stated_explicitly = false;
  assert.equal(evaluate(m).verdict, "TEST_CASE_PACK_NOT_SOUND");
});

test("test_coverage_gaps_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.coverage_gaps_stated_explicitly = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TEST_CASE_PACK_NOT_SOUND");
  assert.equal(v.sections["coverage_gaps_and_suite_hygiene"], "fail");
});

test("test_duplicate_path_suites_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.duplicate_path_suites_present = true;
  assert.equal(evaluate(m).verdict, "TEST_CASE_PACK_NOT_SOUND");
});

test("test_happy_path_only_suite_fails", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.happy_path_only_suite_present = true;
  assert.equal(evaluate(m).verdict, "TEST_CASE_PACK_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.coverage;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["coverage_gaps_and_suite_hygiene"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.requirements_count, null);
  assert.equal(v.cases_count, null);
  assert.equal(v.untraced_requirements, null);
  assert.equal(v.requirement_trace_coverage, null);
  assert.equal(v.cases_without_expected_result, null);
  assert.equal(v.expected_result_coverage, null);
  assert.equal(v.cases_without_traceability, null);
  assert.equal(v.duplicate_case_ids, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: TEST_CASE_PACK_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pack = 12345;
  assert.throws(() => evaluate(m), fieldError("pack"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ coverage: "should-be-an-object" }),
    fieldError("coverage"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ cases: { id: "TC-1" } }),
    fieldError("cases"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ cases: ["TC-1"] }),
    fieldError("cases[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.coverage_gaps_stated_explicitly = "yes";
  assert.throws(() => evaluate(m), fieldError("coverage.coverage_gaps_stated_explicitly"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cases[1].expected_result = 42;
  assert.throws(() => evaluate(m), fieldError("cases[1].expected_result"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].covers_boundary = "yes";
  assert.throws(() => evaluate(m), fieldError("cases[0].covers_boundary"));
});

test("malformed: requirement_ids entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].requirement_ids = [123];
  assert.throws(() => evaluate(m), fieldError("cases[0].requirement_ids[0]"));
});

test("malformed: requirement_ids as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cases[0].requirement_ids = "REQ-1";
  assert.throws(() => evaluate(m), fieldError("cases[0].requirement_ids"));
});

test("malformed: requirement entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.requirements[0].id = true;
  assert.throws(() => evaluate(m), fieldError("requirements[0].id"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.coverage = null;
  assert.throws(() => evaluate(m), fieldError("coverage"));
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
  .filter((f) => f.startsWith("designed-test-case-pack--") && f.endsWith(".json"))
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
