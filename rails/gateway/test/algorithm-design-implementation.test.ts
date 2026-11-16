import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/algorithm-design-implementation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DESIGN_SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  problem: "leaderboard that updates constantly",
  decomposition: { inputs_stated: true,
                   outputs_stated: true,
                   constraints_stated: true,
                   invariant_stated: true,
                   pseudocode_sketched: true,
                   input_scale_stated: true,
                   max_input_size: 1000000 },
  complexity: { time_big_o_stated: true,
                space_big_o_stated: true,
                dominant_term_identified: true,
                bottleneck_identified: true,
                tradeoffs_named: true,
                time_complexity: "O(n log n)" },
  design: { key_operation_identified: true,
            key_operation: "top_k_or_priority",
            chosen_structure: "heap",
            structure_forces_quadratic: false,
            pattern: "greedy",
            greedy_safety_proven: true },
  correctness: { invariant_reasoned: true,
                 termination_reasoned: true,
                 edge_cases: { empty: true,
                               single_element: true,
                               duplicates: true,
                               boundaries: true,
                               integer_overflow: true },
                 edges_and_properties_tested: true },
  verification: { correctness_critical: true,
                  method: "property_based_testing" },
  optimization: { correctness_established_first: true,
                  profiled_before_optimizing: true,
                  optimized_before_measuring: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string): string {
  return v.checks.find((c) => c.check === name)!.status;
}

// ---- The 42 Python VerdictTests, ported ----

test("test_sound_manifest_is_design_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.design_status, "sound_on_declared_evidence");
  assert.equal(v.scale_status, "no_fatal_scale_combination_declared");
  assert.equal(v.checks.length, 31);
});

test("test_quadratic_at_fatal_scale_fails", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 10000000;
  m.complexity.time_complexity = "O(n^2)";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["complexity_reasoning"], "fail");
  assert.equal(v.scale_status, "fatal_scale_combination_declared");
  assert.equal(v.design_status, "not_sound_on_declared_evidence");
});

test("test_quadratic_above_fatal_scale_fails", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 50000000;
  m.complexity.time_complexity = "O(n^2)";
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_quadratic_just_below_fatal_scale_passes", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 9999999;
  m.complexity.time_complexity = "O(n^2)";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_SOUND");
  assert.equal(v.scale_status, "no_fatal_scale_combination_declared");
});

test("test_quadratic_at_small_scale_passes", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 100;
  m.complexity.time_complexity = "O(n^2)";
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_non_quadratic_at_fatal_scale_passes", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 10000000;
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_fractional_size_just_below_fatal_scale_passes", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = 9999999.5;
  m.complexity.time_complexity = "O(n^2)";
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_non_numeric_max_input_size_is_missing", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = "ten million";
  assert.throws(
    () => evaluate(m),
    fieldError("decomposition.max_input_size"),
  );
});

test("test_missing_time_complexity_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.complexity.time_complexity;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.scale_status, null);
});

test("test_all_skill_mappings_pass", () => {
  for (const [operation, structure] of [
    ["lookup", "hash_map"],
    ["top_k_or_priority", "heap"],
    ["ordered_range", "bst_or_btree"],
    ["prefix", "trie"],
    ["connectivity", "union_find"],
    ["sliding_window", "deque"],
    ["range_queries", "prefix_sums"],
  ]) {
    const m = clone(SOUND) as any;
    m.design.key_operation = operation;
    m.design.chosen_structure = structure;
    const v = evaluate(m);
    assert.equal(checkStatus(v, "structure_matches_skill_mapping"), "pass", operation);
    assert.equal(v.verdict, "DESIGN_SOUND", operation);
  }
});

test("test_wrong_structure_for_operation_fails", () => {
  const m = clone(SOUND) as any;
  m.design.key_operation = "lookup";
  m.design.chosen_structure = "heap";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["data_structure_choice"], "fail");
  assert.equal(v.design_status, "not_sound_on_declared_evidence");
});

test("test_unknown_operation_fails", () => {
  const m = clone(SOUND) as any;
  m.design.key_operation = "fuzzy_search";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structure_matches_skill_mapping"), "fail");
  assert.equal(v.verdict, "DESIGN_UNSOUND");
});

test("test_unknown_structure_fails", () => {
  const m = clone(SOUND) as any;
  m.design.chosen_structure = "quantum_array";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structure_matches_skill_mapping"), "fail");
});

test("test_missing_structure_is_missing_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.design.chosen_structure;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "structure_matches_skill_mapping"), "missing");
});

test("test_structure_forcing_quadratic_fails", () => {
  const m = clone(SOUND) as any;
  m.design.structure_forces_quadratic = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["data_structure_choice"], "fail");
});

test("test_all_toolbox_patterns_pass_toolbox_check", () => {
  for (const pattern of ["two_pointers", "sliding_window",
    "binary_search", "binary_search_on_answer",
    "divide_and_conquer", "greedy",
    "dynamic_programming", "graph_traversal",
    "hashing"]) {
    const m = clone(SOUND) as any;
    m.design.pattern = pattern;
    if (pattern === "dynamic_programming") {
      m.design.dp_state_defined = true;
      m.design.dp_transition_defined = true;
      m.design.dp_base_case_defined = true;
    }
    if (pattern === "graph_traversal") {
      m.design.graph_traversal_variant_named = true;
    }
    const v = evaluate(m);
    assert.equal(checkStatus(v, "pattern_in_skill_toolbox"), "pass", pattern);
    assert.equal(v.verdict, "DESIGN_SOUND", pattern);
  }
});

test("test_unknown_pattern_fails", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "quantum_annealing";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.design_status, "not_sound_on_declared_evidence");
});

test("test_greedy_without_safety_proof_fails", () => {
  const m = clone(SOUND) as any;
  m.design.greedy_safety_proven = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["pattern_application"], "fail");
});

test("test_greedy_proof_absent_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.design.greedy_safety_proven;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "greedy_safety_proven_when_greedy"), "missing");
});

test("test_non_greedy_pattern_needs_no_proof", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "hashing";
  delete m.design.greedy_safety_proven;
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_dp_without_base_case_fails", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "dynamic_programming";
  m.design.dp_state_defined = true;
  m.design.dp_transition_defined = true;
  m.design.dp_base_case_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(checkStatus(v, "dp_definition_complete_when_dp"), "fail");
});

test("test_dp_with_absent_definition_is_missing", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "dynamic_programming";
  m.design.dp_state_defined = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "dp_definition_complete_when_dp"), "missing");
});

test("test_graph_traversal_without_variant_is_missing", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "graph_traversal";
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "graph_traversal_variant_named_when_graph"), "missing");
});

test("test_graph_traversal_variant_false_fails", () => {
  const m = clone(SOUND) as any;
  m.design.pattern = "graph_traversal";
  m.design.graph_traversal_variant_named = false;
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_each_edge_case_unhandled_fails", () => {
  for (const edge of ["empty", "single_element", "duplicates",
    "boundaries", "integer_overflow"]) {
    const m = clone(SOUND) as any;
    m.correctness.edge_cases[edge] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_UNSOUND", edge);
    assert.equal(v.sections["correctness_and_edges"], "fail", edge);
  }
});

test("test_missing_edge_case_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.correctness.edge_cases.duplicates;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["correctness_and_edges"], "insufficient_evidence");
});

test("test_edges_not_tested_fails", () => {
  const m = clone(SOUND) as any;
  m.correctness.edges_and_properties_tested = false;
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_termination_not_reasoned_fails", () => {
  const m = clone(SOUND) as any;
  m.correctness.termination_reasoned = false;
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_critical_without_method_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.verification.method;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "verification_method_declared_when_critical"), "missing");
});

test("test_critical_with_unknown_method_fails", () => {
  const m = clone(SOUND) as any;
  m.verification.method = "code_review_only";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["verification_and_optimization"], "fail");
});

test("test_all_verification_methods_pass_when_critical", () => {
  for (const method of ["invariant_proof", "property_based_testing",
    "formal_or_cryptographic_certificate"]) {
    const m = clone(SOUND) as any;
    m.verification.method = method;
    assert.equal(evaluate(m).verdict, "DESIGN_SOUND", method);
  }
});

test("test_not_critical_needs_no_method", () => {
  const m = clone(SOUND) as any;
  m.verification.correctness_critical = false;
  delete m.verification.method;
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_missing_critical_gate_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.verification.correctness_critical;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "verification_method_declared_when_critical"), "missing");
});

test("test_optimized_before_measuring_fails_red_line", () => {
  const m = clone(SOUND) as any;
  m.optimization.optimized_before_measuring = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["verification_and_optimization"], "fail");
});

test("test_not_profiled_before_optimizing_fails", () => {
  const m = clone(SOUND) as any;
  m.optimization.profiled_before_optimizing = false;
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_correctness_not_established_first_fails", () => {
  const m = clone(SOUND) as any;
  m.optimization.correctness_established_first = false;
  assert.equal(evaluate(m).verdict, "DESIGN_UNSOUND");
});

test("test_decomposition_failure_fails_its_section", () => {
  const m = clone(SOUND) as any;
  m.decomposition.invariant_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["decomposition"], "fail");
});

test("test_tradeoffs_not_named_fails", () => {
  const m = clone(SOUND) as any;
  m.complexity.tradeoffs_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_UNSOUND");
  assert.equal(v.sections["complexity_reasoning"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.correctness;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["correctness_and_edges"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.design_status, null);
  assert.equal(v.scale_status, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: DESIGN_SOUND"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(SOUND) as any;
  m.problem = 12345;
  assert.throws(() => evaluate(m), fieldError("problem"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ decomposition: "should-be-an-object" }),
    fieldError("decomposition"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.decomposition.inputs_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("decomposition.inputs_stated"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.decomposition.max_input_size = "ten million";
  assert.throws(
    () => evaluate(m),
    fieldError("decomposition.max_input_size"),
  );
});

test("malformed: nested boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.correctness.edge_cases.empty = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("correctness.edge_cases.empty"),
  );
});

test("malformed: null section rejected", () => {
  const m = clone(SOUND) as any;
  m.design = null;
  assert.throws(() => evaluate(m), fieldError("design"));
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
  .filter((f) => f.startsWith("algorithm-design-implementation--") && f.endsWith(".json"))
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
