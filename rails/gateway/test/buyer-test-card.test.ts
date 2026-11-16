import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/buyer-test-card.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CARD_COMPLETE manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  idea: "A two-week POC of a new search backend for the house stack",
  decision: "adopt",
  disposition: "disposable",
  hypothesis: {
    written: true,
    single: true,
    states_capability_under_constraints: true,
  },
  criteria: {
    success_written_before_start: true,
    kill_written_before_start: true,
    agreed_by_decision_owner_before_build: true,
  },
  timebox: {
    hard_limit_set: true,
    limit_days: 10,
    elapsed_days: 8,
    scope_limited_to_critical_path: true,
    scope_creep_refused_politely: true,
  },
  evidence: {
    from_measurements_tests_or_demo: true,
    numbers_over_impressions: true,
    stubs_and_mocks_recorded: true,
  },
  production_boundary: {
    slid_into_production: false,
    claimed_as_production_evidence: false,
  },
  findings: {
    memo_written: true,
    rationale_references_criteria: true,
    decision_logged: true,
    not_tested_list_clear: true,
    adopting_routed_through_full_team_process: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_card_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CARD_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 22);
  assert.equal(v.timebox_limit_days, 10);
  assert.equal(v.timebox_elapsed_days, 8);
  assert.equal(v.timebox_overrun_days, "-2.000000");
  assert.equal(v.decision, "adopt");
  assert.equal(v.disposition, "disposable");
});

test("test_elapsed_exactly_at_limit_passes", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.elapsed_days = 10;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_COMPLETE");
  assert.equal(v.timebox_overrun_days, "0.000000");
});

test("test_elapsed_above_limit_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.elapsed_days = 13;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["timebox_and_scope"], "fail");
  assert.equal(checkStatus(v, "timebox_within_declared_limit"), "fail");
  assert.equal(v.timebox_overrun_days, "3.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_zero_timebox_limit_fails_unbounded", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.limit_days = 0;
  m.timebox.elapsed_days = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(checkStatus(v, "timebox_within_declared_limit"), "fail");
});

test("test_negative_elapsed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.elapsed_days = -1;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_fractional_days_within_limit_pass", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.limit_days = 2.5;
  m.timebox.elapsed_days = 2.25;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_COMPLETE");
  assert.equal(v.timebox_overrun_days, "-0.250000");
});

test("test_missing_timebox_numbers_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.timebox.elapsed_days;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "timebox_within_declared_limit"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.timebox_limit_days, 10);
  assert.equal(v.timebox_elapsed_days, null);
  assert.equal(v.timebox_overrun_days, null);
});

test("test_long_timebox_not_capped_by_invented_threshold", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.limit_days = 60;
  m.timebox.elapsed_days = 45;
  assert.equal(evaluate(m).verdict, "CARD_COMPLETE");
});

test("test_each_stated_decision_passes", () => {
  for (const decision of ["adopt", "adapt", "abandon"]) {
    const m = clone(COMPLETE) as any;
    m.decision = decision;
    assert.equal(evaluate(m).verdict, "CARD_COMPLETE");
  }
});

test("test_unstated_decision_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision = "ship_it";
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(checkStatus(v, "decision_is_a_stated_option"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_decision_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.decision;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "decision_is_a_stated_option"), "missing");
});

test("test_each_stated_disposition_passes", () => {
  for (const disposition of ["disposable", "slated_for_hardening"]) {
    const m = clone(COMPLETE) as any;
    m.disposition = disposition;
    assert.equal(evaluate(m).verdict, "CARD_COMPLETE");
  }
});

test("test_unstated_disposition_fails", () => {
  const m = clone(COMPLETE) as any;
  m.disposition = "production";
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "disposition_is_a_stated_option"), "fail");
});

test("test_missing_disposition_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.disposition;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "disposition_is_a_stated_option"), "missing");
});

test("test_hypothesis_not_written_fails", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.written = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["hypothesis"], "fail");
});

test("test_multiple_hypotheses_fail", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.single = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_kill_criteria_not_written_before_start_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.kill_written_before_start = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["criteria_upfront"], "fail");
});

test("test_criteria_not_agreed_by_owner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.agreed_by_decision_owner_before_build = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_scope_creep_not_refused_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.scope_creep_refused_politely = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_slid_into_production_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.production_boundary.slid_into_production = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(
    v.sections["disposition_and_production_boundary"], "fail");
});

test("test_claimed_as_production_evidence_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.production_boundary.claimed_as_production_evidence = true;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_stubs_not_recorded_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.stubs_and_mocks_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["evidence"], "fail");
});

test("test_rationale_not_referencing_criteria_fails", () => {
  const m = clone(COMPLETE) as any;
  m.findings.rationale_references_criteria = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_not_tested_list_not_clear_fails", () => {
  const m = clone(COMPLETE) as any;
  m.findings.not_tested_list_clear = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_adopting_not_routed_through_full_process_fails", () => {
  const m = clone(COMPLETE) as any;
  m.findings.adopting_routed_through_full_team_process = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.evidence;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["evidence"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.timebox_limit_days, null);
  assert.equal(v.timebox_elapsed_days, null);
  assert.equal(v.timebox_overrun_days, null);
  assert.equal(v.decision, null);
  assert.equal(v.disposition, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CARD_COMPLETE"));
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
  const m = clone(COMPLETE) as any;
  m.idea = 12345;
  assert.throws(() => evaluate(m), fieldError("idea"));
});

test("malformed: vocabulary string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decision = 42;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: vocabulary string field as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.disposition = true;
  assert.throws(() => evaluate(m), fieldError("disposition"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ hypothesis: "should-be-an-object" }),
    fieldError("hypothesis"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.written = "yes";
  assert.throws(() => evaluate(m), fieldError("hypothesis.written"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.production_boundary.slid_into_production = 1;
  assert.throws(
    () => evaluate(m),
    fieldError("production_boundary.slid_into_production"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.limit_days = "10 days";
  assert.throws(() => evaluate(m), fieldError("timebox.limit_days"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.elapsed_days = true;
  assert.throws(() => evaluate(m), fieldError("timebox.elapsed_days"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria = null;
  assert.throws(() => evaluate(m), fieldError("criteria"));
});

test("malformed: null leaf rejected", () => {
  const m = clone(COMPLETE) as any;
  m.findings.decision_logged = null;
  assert.throws(() => evaluate(m), fieldError("findings.decision_logged"));
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
  .filter((f) => f.startsWith("buyer-test-card--") && f.endsWith(".json"))
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
