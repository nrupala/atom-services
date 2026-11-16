import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/delivery-plan-preparation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DELIVERY_PLAN_READY manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  plan: "atlas-launch",
  framing: { goal_declared: true,
             deliverable_declared: true,
             constraints_declared: true,
             definition_of_done_declared: true,
             plan_approved_before_build: true,
             build_started_before_approval: false },
  phases: [
    { name: "discovery", owner: "lead", exit_criteria_declared: true,
      start_date: "2027-01-05", end_date: "2027-01-16",
      depends_on: [], size: "S", assumptions_declared: true },
    { name: "build", owner: "lead", exit_criteria_declared: true,
      start_date: "2027-01-19", end_date: "2027-02-13",
      depends_on: ["discovery"], size: "L", assumptions_declared: true },
    { name: "rollout", owner: "ops", exit_criteria_declared: true,
      start_date: "2027-02-16", end_date: "2027-02-27",
      depends_on: ["build"], size: "M", assumptions_declared: true },
  ],
  milestones: [
    { name: "scope-locked", phase: "discovery", owner: "lead",
      due_date: "2027-01-16" },
    { name: "beta-ready", phase: "build", owner: "lead",
      due_date: "2027-02-13" },
    { name: "launched", phase: "rollout", owner: "ops",
      due_date: "2027-02-27" },
  ],
  estimation: { least_known_item_flagged_as_top_risk: true },
  risks: [
    { name: "vendor-delay", mitigation_declared: true,
      trigger_declared: true },
    { name: "scope-creep", mitigation_declared: true,
      trigger_declared: true },
  ],
  risk_management: { register_reviewed_each_phase: true },
  decisions: [
    { date: "2027-01-06", decision: "phase-gate rollout",
      rationale_declared: true, alternatives_declared: true },
  ],
  decision_log: { append_only: true, logged_at_decision_time: true },
  execution: { wip_limit_declared: true,
               one_worked_item_per_lane: true,
               plan_updates_through_approval: true,
               silent_rescoping_present: false,
               deploys_hitl_approved: true,
               direct_to_production_change_present: false },
  status: { phase_declared: true, done_declared: true,
            next_declared: true, blockers_declared: true,
            confidence_declared: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 30 Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DELIVERY_PLAN_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 38);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.phases_count, 3);
  assert.deepEqual(v.phases_without_owner, []);
  assert.equal(v.owner_coverage, "1.0000");
  assert.deepEqual(v.unknown_dependencies, []);
  assert.deepEqual(v.dependency_order_violations, []);
  assert.equal(v.dependency_coverage, "1.0000");
  assert.equal(v.total_duration_days, 53);
  assert.equal(v.milestones_count, 3);
  assert.equal(v.milestone_phase_coverage, "1.0000");
  assert.equal(v.risks_count, 2);
  assert.equal(v.decisions_count, 1);
  assert.deepEqual(v.decisions_incomplete, []);
});

test("test_plan_not_approved_fails_framing_section", () => {
  const m = clone(COMPLETE) as any;
  m.framing.plan_approved_before_build = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(v.sections["framing_and_approval"], "fail");
});

test("test_build_started_before_approval_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.build_started_before_approval = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(checkStatus(v, "no_build_started_before_approval"), "fail");
});

test("test_phase_without_owner_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].owner = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(checkStatus(v, "every_phase_has_owner_named"), "fail");
  assert.deepEqual(v.phases_without_owner, ["build"]);
  assert.equal(v.owner_coverage, "0.6667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_phase_missing_owner_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.phases[0].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_phase_has_owner_named"), "missing");
  assert.deepEqual(v.phases_without_owner, ["discovery"]);
});

test("test_phase_without_exit_criteria_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases[0].exit_criteria_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.deepEqual(v.phases_without_exit_criteria, ["discovery"]);
});

test("test_empty_phases_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "phases_declared"), "fail");
  assert.equal(v.phases_count, 0);
  assert.equal(v.owner_coverage, null);
  assert.equal(v.total_duration_days, null);
});

test("test_invalid_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases[0].size = "XL";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_phase_has_skill_size"), "fail");
});

test("test_inverted_phase_dates_fail_and_are_named", () => {
  const m = clone(COMPLETE) as any;
  m.phases[0].end_date = "2027-01-01";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_phase_dates_valid_and_in_order"), "fail");
  assert.deepEqual(v.phases_with_date_problems, ["discovery"]);
});

test("test_invalid_date_string_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].start_date = "2027-02-30";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_phase_dates_valid_and_in_order"), "fail");
  assert.deepEqual(v.phases_with_date_problems, ["build"]);
  assert.equal(v.total_duration_days, null);
});

test("test_unknown_dependency_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].depends_on = ["discovery", "qa-signoff"];
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(checkStatus(v, "every_dependency_names_declared_phase"), "fail");
  assert.deepEqual(v.unknown_dependencies, ["build->qa-signoff"]);
  assert.equal(v.dependency_coverage, "0.6667");
});

test("test_dependency_ending_after_dependent_starts_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].start_date = "2027-01-10";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_dependency_precedes_dependent"), "fail");
  assert.deepEqual(v.dependency_order_violations, ["build->discovery"]);
});

test("test_milestone_with_unknown_phase_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.milestones[0].phase = "research";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_milestone_names_declared_phase"), "fail");
  assert.deepEqual(v.milestones_with_unknown_phase, ["scope-locked"]);
  assert.equal(v.milestone_phase_coverage, "0.6667");
});

test("test_milestone_due_outside_phase_dates_fails", () => {
  const m = clone(COMPLETE) as any;
  m.milestones[1].due_date = "2027-02-20";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_milestone_due_within_phase_dates"), "fail");
  assert.deepEqual(v.milestones_due_outside_phase_dates, ["beta-ready"]);
});

test("test_milestone_without_owner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.milestones[2].owner = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_milestone_has_owner_named"), "fail");
  assert.deepEqual(v.milestones_without_owner, ["launched"]);
});

test("test_risk_without_trigger_fails", () => {
  const m = clone(COMPLETE) as any;
  m.risks[0].trigger_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(v.sections["risks_estimates_and_decisions"], "fail");
  assert.deepEqual(v.risks_without_trigger, ["vendor-delay"]);
});

test("test_risk_without_mitigation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.risks[1].mitigation_declared = false;
  const v = evaluate(m);
  assert.deepEqual(v.risks_without_mitigation, ["scope-creep"]);
});

test("test_phase_without_assumptions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.phases[2].assumptions_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_phase_declares_assumptions"), "fail");
});

test("test_least_known_not_flagged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.estimation.least_known_item_flagged_as_top_risk = false;
  assert.equal(evaluate(m).verdict, "DELIVERY_PLAN_NOT_READY");
});

test("test_decision_without_alternatives_is_incomplete", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[0].alternatives_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_decision_entry_complete"), "fail");
  assert.deepEqual(v.decisions_incomplete, ["phase-gate rollout"]);
});

test("test_decision_with_invalid_date_is_incomplete", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[0].date = "Jan 6";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_decision_entry_complete"), "fail");
});

test("test_decision_log_not_append_only_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision_log.append_only = false;
  assert.equal(evaluate(m).verdict, "DELIVERY_PLAN_NOT_READY");
});

test("test_silent_rescoping_fails", () => {
  const m = clone(COMPLETE) as any;
  m.execution.silent_rescoping_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERY_PLAN_NOT_READY");
  assert.equal(v.sections["execution_discipline_and_status"], "fail");
});

test("test_direct_to_production_change_fails", () => {
  const m = clone(COMPLETE) as any;
  m.execution.direct_to_production_change_present = true;
  assert.equal(evaluate(m).verdict, "DELIVERY_PLAN_NOT_READY");
});

test("test_deploys_not_hitl_fail", () => {
  const m = clone(COMPLETE) as any;
  m.execution.deploys_hitl_approved = false;
  assert.equal(evaluate(m).verdict, "DELIVERY_PLAN_NOT_READY");
});

test("test_status_confidence_missing_is_insufficient", () => {
  const m = clone(COMPLETE) as any;
  delete m.status.confidence_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["execution_discipline_and_status"], "insufficient_evidence");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.status;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["execution_discipline_and_status"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.phases_count, null);
  assert.equal(v.phases_without_owner, null);
  assert.equal(v.owner_coverage, null);
  assert.equal(v.unknown_dependencies, null);
  assert.equal(v.dependency_coverage, null);
  assert.equal(v.total_duration_days, null);
  assert.equal(v.milestone_phase_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DELIVERY_PLAN_READY"));
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
  m.plan = 12345;
  assert.throws(() => evaluate(m), fieldError("plan"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ framing: "should-be-an-object" }),
    fieldError("framing"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ phases: { name: "discovery" } }),
    fieldError("phases"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ phases: ["discovery"] }),
    fieldError("phases[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.framing.goal_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("framing.goal_declared"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].owner = 42;
  assert.throws(() => evaluate(m), fieldError("phases[1].owner"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.phases[0].exit_criteria_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("phases[0].exit_criteria_declared"));
});

test("malformed: depends_on entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].depends_on = [123];
  assert.throws(() => evaluate(m), fieldError("phases[1].depends_on[0]"));
});

test("malformed: depends_on as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.phases[1].depends_on = "discovery";
  assert.throws(() => evaluate(m), fieldError("phases[1].depends_on"));
});

test("malformed: milestone entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.milestones[0].due_date = true;
  assert.throws(() => evaluate(m), fieldError("milestones[0].due_date"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.status = null;
  assert.throws(() => evaluate(m), fieldError("status"));
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
  .filter((f) => f.startsWith("delivery-plan-preparation--") && f.endsWith(".json"))
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
