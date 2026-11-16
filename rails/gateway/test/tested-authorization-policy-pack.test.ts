import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/tested-authorization-policy-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The READY manifest, copied from the Python VerdictTests oracle.
function testsFor(pid: string) {
  return ["positive", "negative", "edge"].map((kind) => ({ policy_id: pid, kind }));
}

const READY: Record<string, unknown> = {
  pack: "agent-access pack v3",
  decision_model: { decisions_enumerated: true,
                    input_schema_defined: true,
                    default_deny: true },
  policies: [
    { id: "allow-read-own-docs", default: "deny" },
    { id: "allow-write-shared-docs", default: "deny" },
  ],
  policy_code: { rules_small_and_composable: true,
                 data_separated_from_logic: true,
                 policy_data_versioned: true,
                 decision_explanations_available: true },
  tests: [...testsFor("allow-read-own-docs"),
          ...testsFor("allow-write-shared-docs")],
  testing: { tests_green: true,
             lint_format_clean: true,
             key_roles_coverage_declared: true },
  rollout: { shadow_completed: true,
             staged_before_production: true,
             break_glass_documented_gated_audited: true,
             break_glass_tested: true,
             silent_policy_edits: false },
  decision_logs: { record_who_decision_version_reason: true,
                   retained_immutably: true,
                   full_in_sensitive_flows: true },
  governance: { second_pair_of_eyes_on_prs: true,
                version_and_changelog: true,
                human_summary_in_sync_with_code: true },
  enforcement: { points_inventoried: true,
                 failure_mode_chosen_per_surface: true,
                 sensitive_surfaces_fail_closed: true,
                 bypass_paths_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 21 Python VerdictTests, ported ----

test("test_ready_manifest_is_ready", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.verdict, "READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.coverage_status, "complete_on_declared_tests");
  assert.equal(v.checks.length, 29);
});

test("test_coverage_quantities", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.policy_count, 2);
  assert.equal(v.tested_policy_count, 2);
  assert.equal(v.test_count, 6);
  assert.equal(v.test_coverage_ratio, "1.0000");
  assert.deepEqual(v.untested_policy_ids, []);
});

test("test_untested_policy_fails_and_is_named", () => {
  const m = clone(READY) as any;
  m.tests = m.tests.filter((t: any) => t.policy_id !== "allow-write-shared-docs");
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["testing"], "fail");
  assert.deepEqual(v.untested_policy_ids, ["allow-write-shared-docs"]);
  assert.equal(v.test_coverage_ratio, "0.5000");
  assert.equal(v.coverage_status, "incomplete_on_declared_tests");
  const c = v.checks.find((x) => x.check === "every_policy_tested")!;
  assert.ok(c.evidence.includes("allow-write-shared-docs"));
});

test("test_missing_edge_test_fails_kind_coverage", () => {
  const m = clone(READY) as any;
  m.tests = m.tests.filter((t: any) =>
    !(t.policy_id === "allow-read-own-docs" && t.kind === "edge"));
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.deepEqual(v.untested_policy_ids, []);
  assert.equal(v.test_coverage_ratio, "1.0000");
  const c = v.checks.find((x) => x.check === "positive_negative_edge_tests_per_policy")!;
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("allow-read-own-docs"));
});

test("test_default_allow_policy_fails_red_line", () => {
  const m = clone(READY) as any;
  m.policies[1].default = "allow";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["decision_model"], "fail");
  const c = v.checks.find((x) => x.check === "every_policy_defaults_to_deny")!;
  assert.ok(c.evidence.includes("allow-write-shared-docs"));
});

test("test_default_deny_not_declared_fails", () => {
  const m = clone(READY) as any;
  m.decision_model.default_deny = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["decision_model"], "fail");
});

test("test_bypass_path_fails_red_line", () => {
  const m = clone(READY) as any;
  m.enforcement.bypass_paths_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["governance_and_enforcement"], "fail");
});

test("test_silent_policy_edits_fail", () => {
  const m = clone(READY) as any;
  m.rollout.silent_policy_edits = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["rollout"], "fail");
});

test("test_shadow_period_not_completed_fails", () => {
  const m = clone(READY) as any;
  m.rollout.shadow_completed = false;
  assert.equal(evaluate(m).verdict, "NOT_READY");
});

test("test_break_glass_not_tested_fails", () => {
  const m = clone(READY) as any;
  m.rollout.break_glass_tested = false;
  assert.equal(evaluate(m).verdict, "NOT_READY");
});

test("test_tests_not_green_fails", () => {
  const m = clone(READY) as any;
  m.testing.tests_green = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["testing"], "fail");
});

test("test_decision_logs_not_retained_fails", () => {
  const m = clone(READY) as any;
  m.decision_logs.retained_immutably = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.sections["decision_logs"], "fail");
});

test("test_sensitive_surfaces_fail_open_fails", () => {
  const m = clone(READY) as any;
  m.enforcement.sensitive_surfaces_fail_closed = false;
  assert.equal(evaluate(m).verdict, "NOT_READY");
});

test("test_human_summary_out_of_sync_fails", () => {
  const m = clone(READY) as any;
  m.governance.human_summary_in_sync_with_code = false;
  assert.equal(evaluate(m).verdict, "NOT_READY");
});

test("test_no_policies_declared_is_missing", () => {
  const m = clone(READY) as any;
  delete m.policies;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.policy_count, null);
  assert.equal(v.coverage_status, null);
  assert.equal(v.test_coverage_ratio, null);
});

test("test_empty_policies_list_is_missing", () => {
  const m = clone(READY) as any;
  m.policies = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.policy_count, null);
});

test("test_policy_missing_default_is_missing", () => {
  const m = clone(READY) as any;
  delete m.policies[0].default;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["decision_model"], "insufficient_evidence");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(READY) as any;
  delete m.decision_logs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["decision_logs"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.coverage_status, null);
  assert.equal(v.policy_count, null);
  assert.deepEqual(v.untested_policy_ids, []);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(READY))).includes("VERDICT: READY"));
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

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ pack: "bad-types", decision_model: "not-an-object", policies: "not-a-list" }),
    fieldError("decision_model"),
  );
});

test("malformed: decision model as string rejected", () => {
  assert.throws(
    () => evaluate({ decision_model: "not-an-object" }),
    fieldError("decision_model"),
  );
});

test("malformed: policies as string rejected", () => {
  assert.throws(
    () => evaluate({ policies: "not-a-list" }),
    fieldError("policies"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.testing.tests_green = "yes";
  assert.throws(() => evaluate(m), fieldError("testing.tests_green"));
});

test("malformed: policy entry field as number rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.policies[0].id = 42;
  assert.throws(() => evaluate(m), fieldError("policies[0].id"));
});

test("malformed: test entry as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.tests[0] = "not-an-object";
  assert.throws(() => evaluate(m), fieldError("tests[0]"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.rollout = null;
  assert.throws(() => evaluate(m), fieldError("rollout"));
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
  .filter((f) => f.startsWith("tested-authorization-policy-pack--") && f.endsWith(".json"))
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
