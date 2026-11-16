import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/agent-evaluation-scorecard.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The TRUSTED manifest, copied from the Python VerdictTests oracle.
const TRUSTED: Record<string, unknown> = {
  agent: "example-agent",
  suite: { versioned: true, criteria_written_before_run: true,
           acceptance_criteria_per_task: true, versioned_with_agent: true },
  run: { model_version_pinned: true, sampling_settings_pinned: true,
         tool_state_pinned: true, fixtures_pinned: true,
         raw_transcripts_stored: true, same_suite_per_candidate: true },
  judging: { deterministic_checks_first: true, llm_judge_used: true,
             judge_calibrated_against_human_labels: true,
             judge_blinded: true, position_bias_controls: true,
             model_judges_itself: false },
  gates: { eval_runs_before_merge: true, regressions_block_merge: true,
           accepted_tradeoffs_written: true },
  metrics: { steps_tracked: true, cost_tracked: true, latency_tracked: true,
             refusal_error_rates_tracked: true,
             safety_violations_tracked: true, silent_wrongness_tracked: true },
  incidents: { misbehavior_becomes_named_tests: true,
               all_production_incidents_replayed: true },
  scorecard: { published_per_run: true, stored: true },
  hygiene: { contamination_checked: true, variance_reported: true,
             rebaselined_after_model_updates: true },
  tasks: [
    { name: "triage-inbox", passed: true, cost: 0.04, allowed_cost: 0.10,
      latency_ms: 900, allowed_latency_ms: 2000, safety_violation: false },
    { name: "draft-reply", passed: true, cost: 0.02, allowed_cost: 0.05,
      latency_ms: 400, allowed_latency_ms: 1000, safety_violation: false },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 17 Python VerdictTests, ported ----

test("test_trusted_manifest_is_trusted", () => {
  const v = evaluate(clone(TRUSTED));
  assert.equal(v.verdict, "TRUSTED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.scorecard.tasks_passing, 2);
});

test("test_uncalibrated_llm_judge_fails_judging", () => {
  const m = clone(TRUSTED) as any;
  m.judging.judge_calibrated_against_human_labels = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.sections["judging"], "fail");
});

test("test_no_llm_judge_passes_judge_controls_as_not_applicable", () => {
  const m = clone(TRUSTED) as any;
  m.judging.llm_judge_used = false;
  delete m.judging.judge_calibrated_against_human_labels;
  delete m.judging.judge_blinded;
  delete m.judging.position_bias_controls;
  assert.equal(evaluate(m).verdict, "TRUSTED");
});

test("test_uncalibrated_self_judging_is_a_red_line_fail", () => {
  const m = clone(TRUSTED) as any;
  m.judging.model_judges_itself = true;
  m.judging.judge_calibrated_against_human_labels = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.sections["judging"], "fail");
});

test("test_calibrated_self_judging_passes", () => {
  const m = clone(TRUSTED) as any;
  m.judging.model_judges_itself = true;
  assert.equal(evaluate(m).verdict, "TRUSTED");
});

test("test_criteria_written_after_the_run_fails", () => {
  const m = clone(TRUSTED) as any;
  m.suite.criteria_written_before_run = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.sections["task_suite"], "fail");
});

test("test_regressions_not_blocking_fails_gates", () => {
  const m = clone(TRUSTED) as any;
  m.gates.regressions_block_merge = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.sections["regression_gates"], "fail");
});

test("test_task_over_cost_allowance_fails_scorecard", () => {
  const m = clone(TRUSTED) as any;
  m.tasks[0].cost = 0.50;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.sections["scorecard"], "fail");
  assert.equal(v.scorecard.tasks_passing, 1);
});

test("test_task_safety_violation_fails_scorecard", () => {
  const m = clone(TRUSTED) as any;
  m.tasks[1].safety_violation = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_TRUSTED");
  assert.equal(v.scorecard.safety_violations, 1);
});

test("test_task_over_latency_allowance_fails", () => {
  const m = clone(TRUSTED) as any;
  m.tasks[0].latency_ms = 5000;
  assert.equal(evaluate(m).verdict, "NOT_TRUSTED");
});

test("test_failed_task_fails_scorecard", () => {
  const m = clone(TRUSTED) as any;
  m.tasks[0].passed = false;
  assert.equal(evaluate(m).verdict, "NOT_TRUSTED");
});

test("test_task_missing_acceptance_fields_is_insufficient", () => {
  const m = clone(TRUSTED) as any;
  delete m.tasks[0].allowed_cost;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["scorecard"], "insufficient_evidence");
});

test("test_no_tasks_declared_is_insufficient", () => {
  const m = clone(TRUSTED) as any;
  delete m.tasks;
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(TRUSTED) as any;
  delete m.hygiene;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["benchmark_hygiene"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(TRUSTED))).includes("VERDICT: TRUSTED"));
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
    () => evaluate({ agent: 12345, tasks: "not-a-list" }),
    fieldError("agent"),
  );
});

test("malformed: agent as number rejected", () => {
  assert.throws(
    () => evaluate({ agent: 12345 }),
    fieldError("agent"),
  );
});

test("malformed: tasks as string rejected", () => {
  assert.throws(
    () => evaluate({ tasks: "not-a-list" }),
    fieldError("tasks"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(TRUSTED) as any;
  m.metrics.cost_tracked = "yes";
  assert.throws(() => evaluate(m), fieldError("metrics.cost_tracked"));
});

test("malformed: task entry number as string rejected", () => {
  const m = clone(TRUSTED) as any;
  m.tasks[0].cost = "cheap";
  assert.throws(() => evaluate(m), fieldError("tasks[0].cost"));
});

test("malformed: task entry as string rejected", () => {
  const m = clone(TRUSTED) as any;
  m.tasks = ["triage-inbox"];
  assert.throws(() => evaluate(m), fieldError("tasks[0]"));
});

test("malformed: null field rejected", () => {
  const m = clone(TRUSTED) as any;
  m.suite = null;
  assert.throws(() => evaluate(m), fieldError("suite"));
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
  .filter((f) => f.startsWith("agent-evaluation-scorecard--") && f.endsWith(".json"))
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
