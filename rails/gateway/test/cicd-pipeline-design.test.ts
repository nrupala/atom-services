import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/cicd-pipeline-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function stages(
  minutes: number[] = [2, 3, 10, 5, 2, 1],
  names: string[] = ["lint", "typecheck", "test", "build",
                     "package_sign", "publish"],
) {
  return names.map((name, i) => ({ name, minutes: minutes[i] }));
}

// The CICD_PIPELINE_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Platform Repo",
  pipeline: {
    stages: stages(),
    declared_total_minutes: 23,
    fails_fast: true,
    reports_first_real_cause: true,
    is_primary_green_gate: true,
  },
  determinism: {
    lockfile_enforced_installs: true,
    tool_versions_pinned: true,
    byte_exact_checkouts_where_hashes_matter: true,
    same_commit_same_artifact_verified: true,
    third_party_actions_pinned: true,
    unpinned_third_party_actions_present: false,
  },
  caching: {
    dependency_cache_keyed_on_lockfile: true,
    build_cache_keyed_on_lockfile: true,
    secrets_cached: false,
    test_fixtures_cached: false,
  },
  secrets: {
    from_secret_store_only: true,
    masked_in_logs: true,
    in_artifacts: false,
    error_output_scrubbed: true,
    appeared_in_logs_or_artifacts: false,
  },
  budget: {
    estimated_minutes_per_run: 23,
    runs_per_month: 100,
    declared_monthly_minutes: 2300,
    monthly_minutes_budget: 2500,
    workflows_minimal_where_constrained: true,
    heavy_builds_on_owned_hardware: true,
    duplicates_primary_gate: false,
  },
  provenance: {
    checksums_published: true,
    releases_signed: true,
    build_outputs_retained: true,
    manifest_hashes_retained: true,
    release_artifacts_carry_hash_and_signature: true,
  },
  deploys: {
    hitl_approval_required: true,
    rollback_path_present: true,
    direct_to_prod_from_laptop: false,
  },
  gates: {
    disabled_to_unblock_merge: false,
    overrides_logged_with_reason: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CICD_PIPELINE_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 36);
  assert.equal(v.stages_evaluated, 6);
  assert.equal(v.computed_total_minutes, "23.000000");
  assert.equal(v.total_minutes_difference, "0.000000");
  assert.deepEqual(v.stated_stages_not_declared, []);
  assert.equal(v.computed_monthly_minutes, "2300.000000");
  assert.equal(v.monthly_minutes_difference, "0.000000");
  assert.equal(v.budget_headroom_minutes, "200.000000");
});

test("test_stage_minutes_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = stages([1, 1, 4, 2, 1, 1]);
  m.pipeline.declared_total_minutes = 10;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_READY");
  assert.equal(v.computed_total_minutes, "10.000000");
});

test("test_stage_order_swapped_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = stages([2, 3, 10, 5, 2, 1],
    ["test", "lint", "typecheck", "build", "package_sign", "publish"]);
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["stages_and_fail_fast"], "fail");
  assert.equal(
    checkStatus(v, "stage_order_matches_stated_sequence"), "fail");
  assert.deepEqual(v.stated_stages_not_declared, []);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_stage_fails_order_and_reports_it", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = stages([2, 3, 10, 5, 2],
    ["lint", "typecheck", "test", "build", "package_sign"]);
  m.pipeline.declared_total_minutes = 22;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "stage_order_matches_stated_sequence"), "fail");
  assert.deepEqual(v.stated_stages_not_declared, ["publish"]);
  assert.equal(v.stages_evaluated, 5);
});

test("test_extra_stage_fails_order", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = [...stages(), { name: "notify", minutes: 1 }];
  m.pipeline.declared_total_minutes = 24;
  assert.equal(evaluate(m).verdict, "CICD_PIPELINE_NOT_READY");
});

test("test_unknown_stage_names_do_not_satisfy_order", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = stages([2, 3, 10, 5, 2, 1],
    ["a", "b", "c", "d", "e", "f"]);
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.stated_stages_not_declared?.length, 6);
});

test("test_total_minutes_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.declared_total_minutes = 20;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "total_minutes_matches_sum_of_stage_minutes"), "fail");
  assert.equal(v.total_minutes_difference, "-3.000000");
});

test("test_missing_stages_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.stages;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "stage_order_matches_stated_sequence"), "missing");
  assert.equal(v.stages_evaluated, 0);
  assert.equal(v.computed_total_minutes, null);
  assert.equal(v.stated_stages_not_declared, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_stages_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "stage_entries_complete"), "missing");
});

test("test_incomplete_stage_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.stages[2].minutes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "stage_entries_complete"), "missing");
  assert.equal(v.stages_evaluated, 5);
  assert.equal(v.computed_total_minutes, null);
  assert.equal(
    checkStatus(v, "stage_order_matches_stated_sequence"), "pass");
});

test("test_stage_entry_without_name_makes_order_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.stages[0].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "stage_order_matches_stated_sequence"), "missing");
  assert.equal(v.stated_stages_not_declared, null);
  assert.equal(v.computed_total_minutes, "23.000000");
});

test("test_missing_declared_total_makes_total_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.declared_total_minutes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "total_minutes_matches_sum_of_stage_minutes"),
    "missing");
  assert.equal(v.computed_total_minutes, null);
});

test("test_not_fails_fast_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.fails_fast = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["stages_and_fail_fast"], "fail");
});

test("test_monthly_minutes_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.budget.declared_monthly_minutes = 2000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "monthly_minutes_matches_per_run_times_runs"), "fail");
  assert.equal(v.monthly_minutes_difference, "-300.000000");
  assert.equal(v.computed_monthly_minutes, "2300.000000");
});

test("test_monthly_minutes_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  Object.assign(m.budget, {
    estimated_minutes_per_run: 10, runs_per_month: 50,
    declared_monthly_minutes: 500, monthly_minutes_budget: 500,
  });
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_READY");
  assert.equal(v.budget_headroom_minutes, "0.000000");
});

test("test_monthly_minutes_over_declared_budget_fails", () => {
  const m = clone(COMPLETE) as any;
  m.budget.monthly_minutes_budget = 2000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "monthly_minutes_within_declared_budget"), "fail");
  assert.equal(v.budget_headroom_minutes, "-300.000000");
  assert.equal(
    checkStatus(v, "monthly_minutes_matches_per_run_times_runs"), "pass");
});

test("test_monthly_minutes_exactly_at_budget_passes", () => {
  const m = clone(COMPLETE) as any;
  m.budget.monthly_minutes_budget = 2300;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "monthly_minutes_within_declared_budget"), "pass");
  assert.equal(v.verdict, "CICD_PIPELINE_READY");
});

test("test_missing_budget_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.budget.runs_per_month;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_monthly_minutes, null);
  assert.equal(v.budget_headroom_minutes, null);
});

test("test_missing_budget_cap_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.budget.monthly_minutes_budget;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "monthly_minutes_within_declared_budget"), "missing");
  assert.equal(v.computed_monthly_minutes, "2300.000000");
  assert.equal(v.budget_headroom_minutes, null);
});

test("test_missing_declared_monthly_is_missing_but_budget_evaluated", () => {
  const m = clone(COMPLETE) as any;
  delete m.budget.declared_monthly_minutes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "monthly_minutes_within_declared_budget"), "pass");
  assert.equal(v.monthly_minutes_difference, null);
});

test("test_duplicate_of_primary_gate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.budget.duplicates_primary_gate = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["budget_awareness"], "fail");
});

test("test_unpinned_actions_present_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.determinism.unpinned_third_party_actions_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["determinism_and_pinning"], "fail");
  assert.equal(
    checkStatus(v, "no_unpinned_third_party_actions"), "fail");
});

test("test_lockfile_not_enforced_fails", () => {
  const m = clone(COMPLETE) as any;
  m.determinism.lockfile_enforced_installs = false;
  assert.equal(evaluate(m).verdict, "CICD_PIPELINE_NOT_READY");
});

test("test_secrets_cached_fails", () => {
  const m = clone(COMPLETE) as any;
  m.caching.secrets_cached = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["caching_and_secrets"], "fail");
});

test("test_test_fixtures_cached_fails", () => {
  const m = clone(COMPLETE) as any;
  m.caching.test_fixtures_cached = true;
  assert.equal(evaluate(m).verdict, "CICD_PIPELINE_NOT_READY");
});

test("test_secret_in_artifacts_fails", () => {
  const m = clone(COMPLETE) as any;
  m.secrets.in_artifacts = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "secrets_never_in_artifacts"), "fail");
});

test("test_secret_appeared_in_logs_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.secrets.appeared_in_logs_or_artifacts = true;
  assert.equal(evaluate(m).verdict, "CICD_PIPELINE_NOT_READY");
});

test("test_unsigned_releases_fail", () => {
  const m = clone(COMPLETE) as any;
  m.provenance.releases_signed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["provenance_and_signing"], "fail");
});

test("test_direct_to_prod_from_laptop_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploys.direct_to_prod_from_laptop = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(v.sections["deploys_and_gates"], "fail");
});

test("test_gates_disabled_to_unblock_merge_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.gates.disabled_to_unblock_merge = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CICD_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "gates_not_disabled_to_unblock_merge"), "fail");
});

test("test_no_rollback_path_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploys.rollback_path_present = false;
  assert.equal(evaluate(m).verdict, "CICD_PIPELINE_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.provenance;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["provenance_and_signing"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.stages_evaluated, 0);
  assert.equal(v.computed_total_minutes, null);
  assert.equal(v.computed_monthly_minutes, null);
  assert.equal(v.stated_stages_not_declared, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CICD_PIPELINE_READY"));
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
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ pipeline: "should-be-an-object" }),
    fieldError("pipeline"),
  );
});

test("malformed: stages list as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages = "lint,test";
  assert.throws(() => evaluate(m), fieldError("pipeline.stages"));
});

test("malformed: stage entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages[0] = "lint";
  assert.throws(() => evaluate(m), fieldError("pipeline.stages[0]"));
});

test("malformed: stage name as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages[0].name = 1;
  assert.throws(() => evaluate(m), fieldError("pipeline.stages[0].name"));
});

test("malformed: stage minutes as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages[2].minutes = "10";
  assert.throws(
    () => evaluate(m), fieldError("pipeline.stages[2].minutes"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.fails_fast = "yes";
  assert.throws(() => evaluate(m), fieldError("pipeline.fails_fast"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.budget.runs_per_month = "100";
  assert.throws(() => evaluate(m), fieldError("budget.runs_per_month"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.budget.estimated_minutes_per_run = true;
  assert.throws(
    () => evaluate(m), fieldError("budget.estimated_minutes_per_run"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.secrets = null;
  assert.throws(() => evaluate(m), fieldError("secrets"));
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
  .filter((f) => f.startsWith("cicd-pipeline-design--") && f.endsWith(".json"))
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
