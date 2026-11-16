import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/c-engineering-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The REVIEW_SOUND manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  subject: "ring-buffer.c diff, parser hardening",
  memory: {
    one_owner_per_allocation: true,
    freed_on_same_path_as_allocation: true,
    ownership_documented_in_headers: true,
    caller_supplied_buffers_preferred: true,
    ownership_documented_for_outliving_pointers: true,
  },
  undefined_behavior: {
    integer_overflow_addressed: true,
    strict_aliasing_respected: true,
    uninitialized_reads_avoided: true,
    signed_shifts_checked: true,
    sequence_point_traps_avoided: true,
    ub_shortcuts_used: false,
  },
  warnings: {
    warnings_treated_as_errors: true,
    warning_count: 0,
  },
  bounds: {
    sized_apis_used: true,
    lengths_validated_at_boundaries: true,
    unbounded_operations_in_diff: false,
    banned_calls: [],
  },
  sanitizers: {
    asan_enabled_in_test_builds: true,
    ubsan_enabled_in_test_builds: true,
    asan_ubsan_clean_on_suite: true,
    valgrind_used_for_leaks: true,
    parsers_fuzzed: true,
    static_analysis_run: true,
    static_analysis_findings_treated_as_bugs: true,
  },
  portability: {
    fixed_width_types_used: true,
    compiler_extensions_isolated: true,
    tested_on_target_platforms: true,
  },
  build_and_test: {
    build_system_pinned: true,
    unit_tests_at_function_boundaries: true,
    integration_tests_at_edges: true,
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
  assert.equal(v.checks.length, 30);
  assert.equal(v.warning_count, 0);
  assert.deepEqual(v.banned_calls_found, []);
});

test("test_warnings_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.warnings.warning_count = 3;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["warnings_and_build"], "fail");
  assert.equal(checkStatus(v, "zero_warnings_maintained"), "fail");
  assert.equal(v.warning_count, 3);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_negative_warning_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.warnings.warning_count = -1;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_missing_warning_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.warnings.warning_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zero_warnings_maintained"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.warning_count, null);
});

test("test_warnings_not_treated_as_errors_fails", () => {
  const m = clone(COMPLETE) as any;
  m.warnings.warnings_treated_as_errors = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["warnings_and_build"], "fail");
});

test("test_banned_call_present_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.banned_calls = ["strcpy"];
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["bounds_and_strings"], "fail");
  assert.equal(checkStatus(v, "no_banned_functions_present"), "fail");
  assert.deepEqual(v.banned_calls_found, ["strcpy"]);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_banned_calls_found_reported_in_skill_order", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.banned_calls = ["unchecked_scanf", "gets", "sprintf"];
  const v = evaluate(m);
  assert.deepEqual(v.banned_calls_found,
    ["gets", "sprintf", "unchecked_scanf"]);
});

test("test_unknown_calls_do_not_count_as_banned", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.banned_calls = ["memcpy", "snprintf", "strncpy"];
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_SOUND");
  assert.deepEqual(v.banned_calls_found, []);
});

test("test_missing_banned_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.bounds.banned_calls;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.banned_calls_found, null);
  assert.equal(v.computed_status, null);
});

test("test_unbounded_operations_in_diff_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.unbounded_operations_in_diff = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["bounds_and_strings"], "fail");
});

test("test_lengths_not_validated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.lengths_validated_at_boundaries = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_ub_shortcuts_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.undefined_behavior.ub_shortcuts_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["undefined_behavior"], "fail");
  assert.equal(checkStatus(v, "no_ub_shortcuts"), "fail");
});

test("test_strict_aliasing_not_respected_fails", () => {
  const m = clone(COMPLETE) as any;
  m.undefined_behavior.strict_aliasing_respected = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_allocation_without_single_owner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.memory.one_owner_per_allocation = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["memory_discipline"], "fail");
});

test("test_ownership_not_documented_for_outliving_pointers_fails", () => {
  const m = clone(COMPLETE) as any;
  m.memory.ownership_documented_for_outliving_pointers = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(
    checkStatus(v, "ownership_documented_for_outliving_pointers"),
    "fail");
});

test("test_sanitizers_not_clean_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.sanitizers.asan_ubsan_clean_on_suite = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["sanitizers_and_static_analysis"], "fail");
});

test("test_static_analysis_findings_dismissed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sanitizers.static_analysis_findings_treated_as_bugs = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_parsers_not_fuzzed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sanitizers.parsers_fuzzed = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_fixed_width_types_not_used_fails", () => {
  const m = clone(COMPLETE) as any;
  m.portability.fixed_width_types_used = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["portability"], "fail");
});

test("test_not_tested_on_target_platforms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.portability.tested_on_target_platforms = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_build_not_pinned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.build_and_test.build_system_pinned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "REVIEW_DEFICIENT");
  assert.equal(v.sections["build_and_test"], "fail");
});

test("test_no_unit_tests_at_boundaries_fails", () => {
  const m = clone(COMPLETE) as any;
  m.build_and_test.unit_tests_at_function_boundaries = false;
  assert.equal(evaluate(m).verdict, "REVIEW_DEFICIENT");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.portability;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["portability"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.warning_count, null);
  assert.equal(v.banned_calls_found, null);
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
    () => evaluate({ memory: "should-be-an-object" }),
    fieldError("memory"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.banned_calls = "strcpy";
  assert.throws(() => evaluate(m), fieldError("bounds.banned_calls"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bounds.banned_calls = ["strcpy", 42];
  assert.throws(() => evaluate(m), fieldError("bounds.banned_calls[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.memory.one_owner_per_allocation = "yes";
  assert.throws(
    () => evaluate(m), fieldError("memory.one_owner_per_allocation"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.warnings.warning_count = "zero";
  assert.throws(() => evaluate(m), fieldError("warnings.warning_count"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.warnings.warning_count = true;
  assert.throws(() => evaluate(m), fieldError("warnings.warning_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bounds = null;
  assert.throws(() => evaluate(m), fieldError("bounds"));
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
  .filter((f) => f.startsWith("c-engineering-review--") && f.endsWith(".json"))
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
