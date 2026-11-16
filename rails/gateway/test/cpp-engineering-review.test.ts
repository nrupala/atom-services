import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/cpp-engineering-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The REVIEW_SOUND manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  subject: "widget.cpp diff, RAII modernization",
  raii: {
    resources_owned_by_objects: true,
    destructors_clean_up_resources: true,
    manual_new_delete_in_new_code: false,
    raw_owning_pointers_in_new_code: false,
    forbidden_constructs: [],
  },
  value_semantics: {
    values_const_references_preferred: true,
    move_semantics_used_where_copies_expensive: true,
    rule_of_zero_honored: true,
    special_members_justified_when_present: true,
  },
  smart_pointers: {
    unique_ptr_is_default: true,
    shared_ptr_only_for_real_shared_ownership: true,
    weak_ptr_used_to_break_cycles: true,
  },
  stl: {
    algorithms_preferred_over_hand_loops: true,
    containers_matched_to_access_patterns: true,
    ranges_used_where_available: true,
    templates_used_only_for_real_genericity: true,
    template_error_messages_readable: true,
  },
  exceptions_and_abi: {
    exceptions_policy_chosen: true,
    exceptions_policy_documented: true,
    exceptions_policy_applied_consistently: true,
    stable_library_interfaces: true,
    pimpl_used_where_needed: true,
    symbols_versioned: true,
  },
  tooling: {
    clang_tidy_run: true,
    clang_tidy_clean_on_diff: true,
    clang_format_applied: true,
    warnings_treated_as_errors: true,
    warning_count: 0,
  },
  sanitizers: {
    asan_enabled_in_test_builds: true,
    ubsan_enabled_in_test_builds: true,
    tsan_enabled_in_test_builds: true,
    sanitizer_clean_test_run: true,
  },
  safety: {
    dangling_references_across_async_boundaries: false,
    macros_used_where_language_features_exist: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_review_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "REVIEW_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 34);
  assert.equal(v.warning_count, 0);
  assert.deepEqual(v.forbidden_constructs_found, []);
});

test("test_warnings_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.warning_count = 3;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["tooling_and_warnings"], "fail");
  assert.equal(checkStatus(v, "zero_warnings_maintained"), "fail");
  assert.equal(v.warning_count, 3);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_negative_warning_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.warning_count = -1;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_missing_warning_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.tooling.warning_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zero_warnings_maintained"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.warning_count, null);
});

test("test_warnings_not_treated_as_errors_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.warnings_treated_as_errors = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["tooling_and_warnings"], "fail");
});

test("test_forbidden_construct_present_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.raii.forbidden_constructs = ["manual_new"];
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["raii_and_ownership"], "fail");
  assert.equal(checkStatus(v, "no_forbidden_constructs_present"), "fail");
  assert.deepEqual(v.forbidden_constructs_found, ["manual_new"]);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_forbidden_found_reported_in_skill_order", () => {
  const m = clone(COMPLETE) as any;
  m.raii.forbidden_constructs = [
    "manual_delete", "raw_owning_pointer", "manual_new"];
  const v = evaluate(m);
  assert.deepEqual(v.forbidden_constructs_found,
    ["raw_owning_pointer", "manual_new", "manual_delete"]);
});

test("test_unknown_constructs_do_not_count_as_forbidden", () => {
  const m = clone(COMPLETE) as any;
  m.raii.forbidden_constructs = ["new_expression_in_test", "placement_new"];
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_SOUND");
  assert.deepEqual(v.forbidden_constructs_found, []);
});

test("test_missing_forbidden_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.raii.forbidden_constructs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.forbidden_constructs_found, null);
  assert.equal(v.computed_status, null);
});

test("test_manual_new_delete_flag_fails", () => {
  const m = clone(COMPLETE) as any;
  m.raii.manual_new_delete_in_new_code = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["raii_and_ownership"], "fail");
});

test("test_raw_owning_pointers_flag_fails", () => {
  const m = clone(COMPLETE) as any;
  m.raii.raw_owning_pointers_in_new_code = true;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_resources_not_owned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.raii.resources_owned_by_objects = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["raii_and_ownership"], "fail");
});

test("test_rule_of_zero_not_honored_fails", () => {
  const m = clone(COMPLETE) as any;
  m.value_semantics.rule_of_zero_honored = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["value_semantics"], "fail");
  assert.equal(checkStatus(v, "rule_of_zero_honored"), "fail");
});

test("test_unjustified_special_members_fail", () => {
  const m = clone(COMPLETE) as any;
  m.value_semantics.special_members_justified_when_present = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_shared_ptr_without_shared_ownership_fails", () => {
  const m = clone(COMPLETE) as any;
  m.smart_pointers.shared_ptr_only_for_real_shared_ownership = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["smart_pointers"], "fail");
});

test("test_unique_ptr_not_default_fails", () => {
  const m = clone(COMPLETE) as any;
  m.smart_pointers.unique_ptr_is_default = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_hand_loops_over_algorithms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stl.algorithms_preferred_over_hand_loops = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["stl_and_templates"], "fail");
});

test("test_vanity_templates_fail", () => {
  const m = clone(COMPLETE) as any;
  m.stl.templates_used_only_for_real_genericity = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_exceptions_policy_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.exceptions_and_abi.exceptions_policy_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["exceptions_and_abi"], "fail");
});

test("test_unversioned_symbols_fail", () => {
  const m = clone(COMPLETE) as any;
  m.exceptions_and_abi.symbols_versioned = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_clang_tidy_not_clean_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.clang_tidy_clean_on_diff = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["tooling_and_warnings"], "fail");
});

test("test_sanitizers_not_clean_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.sanitizers.sanitizer_clean_test_run = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["sanitizers"], "fail");
});

test("test_tsan_not_enabled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sanitizers.tsan_enabled_in_test_builds = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_dangling_references_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.safety.dangling_references_across_async_boundaries = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["safety_red_lines"], "fail");
  assert.equal(
    checkStatus(v, "no_dangling_references_across_async_boundaries"),
    "fail");
});

test("test_macros_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.safety.macros_used_where_language_features_exist = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["safety_red_lines"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.sanitizers;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sanitizers"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.warning_count, null);
  assert.equal(v.forbidden_constructs_found, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: REVIEW_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.subject = 12345;
  assert.throws(() => evaluate(m), fieldError("subject"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ raii: "should-be-an-object" }),
    fieldError("raii"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.raii.forbidden_constructs = "manual_new";
  assert.throws(() => evaluate(m), fieldError("raii.forbidden_constructs"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.raii.forbidden_constructs = ["manual_new", 42];
  assert.throws(() => evaluate(m), fieldError("raii.forbidden_constructs[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.raii.resources_owned_by_objects = "yes";
  assert.throws(
    () => evaluate(m), fieldError("raii.resources_owned_by_objects"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.warning_count = "zero";
  assert.throws(() => evaluate(m), fieldError("tooling.warning_count"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.warning_count = true;
  assert.throws(() => evaluate(m), fieldError("tooling.warning_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.safety = null;
  assert.throws(() => evaluate(m), fieldError("safety"));
});

test("malformed: nested boolean as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.exceptions_and_abi.symbols_versioned = 1;
  assert.throws(
    () => evaluate(m), fieldError("exceptions_and_abi.symbols_versioned"));
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
  .filter((f) => f.startsWith("cpp-engineering-review--") && f.endsWith(".json"))
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
