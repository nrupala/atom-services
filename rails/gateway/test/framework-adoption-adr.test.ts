import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/framework-adoption-adr.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FRAMEWORK_ADOPTION_SOUND manifest, copied from the Python
// VerdictTests oracle.
const FIT: Record<string, unknown> = {
  team_familiarity_assessed: true, maintenance_health_assessed: true,
  ecosystem_assessed: true, performance_assessed: true,
  exit_cost_assessed: true,
};

const COMPLETE: Record<string, unknown> = {
  project: "storefront-rebuild",
  framework: "framework-b",
  adr: { logged: true, alternatives_stated: true, exit_cost_stated: true },
  candidates: [
    { name: "framework-a", ...FIT, selected: false },
    { name: "framework-b", ...FIT, selected: true },
    { name: "framework-c", ...FIT, selected: false },
  ],
  house_stack: { one_framework_per_layer: true,
                 core_logic_imports_no_framework_code: true,
                 framework_at_edges_ports_adapters: true,
                 is_mid_project_change: true,
                 migration_plan_documented: true,
                 migration_plan_approved: true },
  versions: { exact_versions_pinned: true,
              unpinned_latest_in_production_present: false,
              changelogs_read: true, updates_batched: true,
              major_upgrade_planned: true,
              major_upgrade_written_plan: true,
              major_upgrade_full_suite_run: true },
  runtime: { explicit_configuration_preferred: true,
             runtime_behaviour_understood: true,
             lifecycle_understood: true,
             dependency_injection_understood: true,
             caching_behaviour_understood: true,
             deprecated_apis_on_hot_path_present: false },
  plugins: { plugins_present: true,
             plugins_treated_as_dependencies: true,
             unused_plugins_removed: true,
             items: [
               { name: "plugin-x", reviewed: true, pinned: true },
               { name: "plugin-y", reviewed: true, pinned: true },
             ] },
  deprecations: { warnings_tracked: true, migrations_scheduled: true,
                  zombie_code_paths_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 34 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 30);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.candidates_count, 3);
  assert.deepEqual(v.candidates_without_name, []);
  assert.deepEqual(v.candidates_without_fit_assessment, []);
  assert.equal(v.fit_assessment_coverage, "1.000000");
  assert.equal(v.selected_count, 1);
  assert.equal(v.selected_candidate, "framework-b");
  assert.equal(v.plugins_count, 2);
  assert.deepEqual(v.plugins_without_review_or_pin, []);
  assert.equal(v.plugin_compliance_coverage, "1.000000");
});

test("test_adr_not_logged_fails_adr_section", () => {
  const m = clone(COMPLETE) as any;
  m.adr.logged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
  assert.equal(v.sections["adr_and_fit"], "fail");
});

test("test_adr_without_exit_cost_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.exit_cost_stated = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "adr_states_exit_cost"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_candidate_without_name_fails_and_is_counted", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].name = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_candidate_names_framework"), "fail");
  assert.deepEqual(v.candidates_without_name, [""]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_candidate_missing_name_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.candidates[0].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_candidate_names_framework"), "missing");
});

test("test_candidate_fit_incomplete_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[2].ecosystem_assessed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_candidate_fit_fully_assessed"), "fail");
  assert.deepEqual(v.candidates_without_fit_assessment, ["framework-c"]);
  assert.equal(v.fit_assessment_coverage, "0.666667");
});

test("test_candidate_fit_field_absent_is_missing_not_named", () => {
  const m = clone(COMPLETE) as any;
  delete m.candidates[1].performance_assessed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_candidate_fit_fully_assessed"), "missing");
  assert.deepEqual(v.candidates_without_fit_assessment, ["framework-b"]);
});

test("test_empty_candidates_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.candidates = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "candidates_declared"), "fail");
  assert.equal(v.candidates_count, 0);
  assert.equal(v.selected_count, 0);
  assert.equal(v.selected_candidate, null);
  assert.equal(v.fit_assessment_coverage, null);
});

test("test_two_selected_candidates_fail", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].selected = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "exactly_one_candidate_selected"), "fail");
  assert.equal(v.selected_count, 2);
  assert.equal(v.selected_candidate, null);
});

test("test_no_selected_candidate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[1].selected = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "exactly_one_candidate_selected"), "fail");
  assert.equal(v.selected_count, 0);
});

test("test_selected_field_absent_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.candidates[0].selected;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "exactly_one_candidate_selected"), "missing");
});

test("test_two_frameworks_per_layer_fails_house_section", () => {
  const m = clone(COMPLETE) as any;
  m.house_stack.one_framework_per_layer = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
  assert.equal(v.sections["house_stack_and_core"], "fail");
});

test("test_core_importing_framework_code_fails", () => {
  const m = clone(COMPLETE) as any;
  m.house_stack.core_logic_imports_no_framework_code = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "core_logic_imports_no_framework_code"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_mid_project_change_without_approved_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.house_stack.migration_plan_approved = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "mid_project_migration_plan_approved"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_mid_project_change_missing_plan_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.house_stack.migration_plan_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "mid_project_migration_plan_documented"), "missing");
});

test("test_not_mid_project_change_passes_plan_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.house_stack = { one_framework_per_layer: true,
                    core_logic_imports_no_framework_code: true,
                    framework_at_edges_ports_adapters: true,
                    is_mid_project_change: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_SOUND");
  assert.equal(checkStatus(v, "mid_project_migration_plan_approved"), "pass");
});

test("test_unpinned_versions_fail_pinning_section", () => {
  const m = clone(COMPLETE) as any;
  m.versions.exact_versions_pinned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
  assert.equal(v.sections["pinning_and_upgrades"], "fail");
});

test("test_unpinned_latest_in_production_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.versions.unpinned_latest_in_production_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unpinned_latest_in_production"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_major_upgrade_without_written_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.versions.major_upgrade_written_plan = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "major_upgrade_written_plan"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_major_upgrade_without_full_suite_fails", () => {
  const m = clone(COMPLETE) as any;
  m.versions.major_upgrade_full_suite_run = false;
  assert.equal(evaluate(m).verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_no_major_upgrade_passes_upgrade_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.versions.major_upgrade_planned = false;
  delete m.versions.major_upgrade_written_plan;
  delete m.versions.major_upgrade_full_suite_run;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_SOUND");
  assert.equal(checkStatus(v, "major_upgrade_written_plan"), "pass");
});

test("test_runtime_not_understood_fails_runtime_section", () => {
  const m = clone(COMPLETE) as any;
  m.runtime.runtime_behaviour_understood = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
  assert.equal(v.sections["explicitness_and_runtime"], "fail");
});

test("test_deprecated_apis_on_hot_path_fail", () => {
  const m = clone(COMPLETE) as any;
  m.runtime.deprecated_apis_on_hot_path_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_deprecated_apis_on_hot_path"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_unpinned_plugin_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.plugins.items[1].pinned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
  assert.equal(checkStatus(v, "every_plugin_reviewed_and_pinned"), "fail");
  assert.deepEqual(v.plugins_without_review_or_pin, ["plugin-y"]);
  assert.equal(v.plugin_compliance_coverage, "0.500000");
});

test("test_plugin_missing_review_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.plugins.items[0].reviewed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_plugin_reviewed_and_pinned"), "missing");
  assert.deepEqual(v.plugins_without_review_or_pin, ["plugin-x"]);
});

test("test_plugins_present_but_no_items_fails", () => {
  const m = clone(COMPLETE) as any;
  m.plugins.items = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_plugin_reviewed_and_pinned"), "fail");
  assert.equal(v.plugins_count, 0);
  assert.equal(v.plugin_compliance_coverage, null);
});

test("test_no_plugins_passes_plugin_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.plugins = { plugins_present: false,
                plugins_treated_as_dependencies: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_SOUND");
  assert.equal(checkStatus(v, "every_plugin_reviewed_and_pinned"), "pass");
  assert.equal(checkStatus(v, "unused_plugins_removed"), "pass");
  assert.equal(v.plugins_count, null);
  assert.equal(v.plugins_without_review_or_pin, null);
  assert.equal(v.plugin_compliance_coverage, null);
});

test("test_unused_plugins_not_removed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.plugins.unused_plugins_removed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "unused_plugins_removed"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_zombie_code_paths_fail", () => {
  const m = clone(COMPLETE) as any;
  m.deprecations.zombie_code_paths_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_zombie_code_paths"), "fail");
  assert.equal(v.verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_deprecation_warnings_untracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deprecations.warnings_tracked = false;
  assert.equal(evaluate(m).verdict, "FRAMEWORK_ADOPTION_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.versions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["pinning_and_upgrades"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.candidates_count, null);
  assert.equal(v.candidates_without_name, null);
  assert.equal(v.candidates_without_fit_assessment, null);
  assert.equal(v.fit_assessment_coverage, null);
  assert.equal(v.selected_count, null);
  assert.equal(v.selected_candidate, null);
  assert.equal(v.plugins_count, null);
  assert.equal(v.plugins_without_review_or_pin, null);
  assert.equal(v.plugin_compliance_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: FRAMEWORK_ADOPTION_SOUND"));
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
  m.framework = 12345;
  assert.throws(() => evaluate(m), fieldError("framework"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ adr: "should-be-an-object" }),
    fieldError("adr"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ candidates: { name: "framework-a" } }),
    fieldError("candidates"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ candidates: ["framework-a"] }),
    fieldError("candidates[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.versions.exact_versions_pinned = "yes";
  assert.throws(() => evaluate(m), fieldError("versions.exact_versions_pinned"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("candidates[0].name"));
});

test("malformed: nested plugin entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.plugins.items[1].pinned = "yes";
  assert.throws(() => evaluate(m), fieldError("plugins.items[1].pinned"));
});

test("malformed: plugin items as object rejected", () => {
  assert.throws(
    () => evaluate({ plugins: { items: { name: "plugin-x" } } }),
    fieldError("plugins.items"),
  );
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.deprecations = null;
  assert.throws(() => evaluate(m), fieldError("deprecations"));
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
  .filter((f) => f.startsWith("framework-adoption-adr--") && f.endsWith(".json"))
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
