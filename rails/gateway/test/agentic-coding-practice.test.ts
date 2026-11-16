import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/agentic-coding-practice.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The RELIABLE_PRACTICE manifest, copied from the Python VerdictTests oracle.
const RELIABLE: Record<string, unknown> = {
  practice: "small-feature build workflow",
  spec: { spec_written_first: true,
          small_vertical_slices: true,
          diffs_reviewed: true },
  hooks: { wired_as_guardrails: true,
           events_and_payloads_known: true,
           protected_paths_blocked: true,
           formatters_auto_run: true,
           secrets_denied: true },
  feedback: { tests_run_after_edit: true,
              tests_wired_into_hooks: true,
              linters_wired_into_hooks: true },
  guardrails: { protected_paths_declared: true,
                no_secrets: true,
                docker_used: false,
                staging_first: true,
                human_in_loop_on_irreversible: true,
                autonomous_only_safe_reversible: true,
                agent_run_unbounded: false },
  context: { only_what_agent_needs: true,
             whole_repo_dumped: false,
             files_pulled_into_workspace: true },
  tools: { mcp_tools_typed: true,
           mcp_tools_narrowly_scoped: true },
  delegation: { subagent_tasks_bounded: true,
                subagent_context_narrow: true,
                planner_worker_reviewer_pattern: true },
  access: { broad_write_access: true,
            guardrails_present: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 36 Python VerdictTests, ported ----

test("test_reliable_manifest_is_reliable_practice", () => {
  const v = evaluate(clone(RELIABLE));
  assert.equal(v.verdict, "RELIABLE_PRACTICE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 27);
  assert.equal(v.practice, "small-feature build workflow");
});

test("test_no_spec_first_fails", () => {
  const m = clone(RELIABLE) as any;
  m.spec.spec_written_first = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["spec_and_slicing"], "fail");
});

test("test_not_small_vertical_slices_fails", () => {
  const m = clone(RELIABLE) as any;
  m.spec.small_vertical_slices = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_rubber_stamped_diffs_fail", () => {
  const m = clone(RELIABLE) as any;
  m.spec.diffs_reviewed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["spec_and_slicing"], "fail");
});

test("test_hooks_not_wired_as_guardrails_fails", () => {
  const m = clone(RELIABLE) as any;
  m.hooks.wired_as_guardrails = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["hooks_and_events"], "fail");
});

test("test_hook_events_and_payloads_unknown_fails", () => {
  const m = clone(RELIABLE) as any;
  m.hooks.events_and_payloads_known = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_protected_paths_not_blocked_by_hooks_fails", () => {
  const m = clone(RELIABLE) as any;
  m.hooks.protected_paths_blocked = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_formatters_not_auto_run_fails", () => {
  const m = clone(RELIABLE) as any;
  m.hooks.formatters_auto_run = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_secrets_not_denied_by_hooks_fails", () => {
  const m = clone(RELIABLE) as any;
  m.hooks.secrets_denied = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_tests_not_run_after_edit_fails", () => {
  const m = clone(RELIABLE) as any;
  m.feedback.tests_run_after_edit = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["feedback_loop"], "fail");
});

test("test_no_automated_tests_in_loop_fails", () => {
  const m = clone(RELIABLE) as any;
  m.feedback.tests_wired_into_hooks = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_linters_not_wired_fails", () => {
  const m = clone(RELIABLE) as any;
  m.feedback.linters_wired_into_hooks = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_protected_paths_not_declared_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.protected_paths_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["guardrails"], "fail");
});

test("test_secrets_used_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.no_secrets = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_docker_used_fails_house_rule", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.docker_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["guardrails"], "fail");
});

test("test_not_staging_first_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.staging_first = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_no_human_in_loop_on_irreversible_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.human_in_loop_on_irreversible = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_autonomous_on_irreversible_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.autonomous_only_safe_reversible = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_unbounded_agent_run_fails", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails.agent_run_unbounded = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["guardrails"], "fail");
});

test("test_context_not_limited_fails", () => {
  const m = clone(RELIABLE) as any;
  m.context.only_what_agent_needs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["context_and_tools"], "fail");
});

test("test_whole_repo_dumped_fails", () => {
  const m = clone(RELIABLE) as any;
  m.context.whole_repo_dumped = true;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_files_not_pulled_into_workspace_fails", () => {
  const m = clone(RELIABLE) as any;
  m.context.files_pulled_into_workspace = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_untyped_mcp_tools_fail", () => {
  const m = clone(RELIABLE) as any;
  m.tools.mcp_tools_typed = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_broadly_scoped_mcp_tools_fail", () => {
  const m = clone(RELIABLE) as any;
  m.tools.mcp_tools_narrowly_scoped = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_unbounded_subagent_tasks_fail", () => {
  const m = clone(RELIABLE) as any;
  m.delegation.subagent_tasks_bounded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["delegation_and_access"], "fail");
});

test("test_wide_subagent_context_fails", () => {
  const m = clone(RELIABLE) as any;
  m.delegation.subagent_context_narrow = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_no_planner_worker_reviewer_orchestration_fails", () => {
  const m = clone(RELIABLE) as any;
  m.delegation.planner_worker_reviewer_pattern = false;
  assert.equal(evaluate(m).verdict, "NOT_RELIABLE_PRACTICE");
});

test("test_broad_write_access_without_guardrails_fails", () => {
  const m = clone(RELIABLE) as any;
  m.access.guardrails_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_RELIABLE_PRACTICE");
  assert.equal(v.sections["delegation_and_access"], "fail");
});

test("test_broad_write_access_guardrails_missing_is_missing", () => {
  const m = clone(RELIABLE) as any;
  delete m.access.guardrails_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["delegation_and_access"], "insufficient_evidence");
});

test("test_no_broad_write_access_passes_as_not_applicable", () => {
  const m = clone(RELIABLE) as any;
  m.access.broad_write_access = false;
  delete m.access.guardrails_present;
  assert.equal(evaluate(m).verdict, "RELIABLE_PRACTICE");
});

test("test_absent_broad_write_access_gate_is_missing", () => {
  const m = clone(RELIABLE) as any;
  delete m.access;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["delegation_and_access"], "insufficient_evidence");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(RELIABLE) as any;
  delete m.feedback;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["feedback_loop"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.practice, null);
  assert.equal(v.checks.length, 27);
});

test("test_non_boolean_truthy_value_fails_bool_check", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(RELIABLE) as any;
  m.spec.spec_written_first = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("spec.spec_written_first"),
  );
});

test("test_stamp_names_the_verdict", () => {
  const s = stamp(evaluate(clone(RELIABLE)));
  assert.ok(s.includes("VERDICT: RELIABLE_PRACTICE"));
  assert.ok(s.includes("spec_and_slicing"));
});

test("test_non_object_manifest_rejected", () => {
  for (const bad of [["not", "a", "manifest"], "not a manifest", null]) {
    assert.throws(
      () => evaluate(bad),
      (err: unknown) =>
        err instanceof TypeError &&
        (err as Error).message === "manifest must be a JSON object",
    );
  }
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(RELIABLE) as any;
  m.practice = 12345;
  assert.throws(() => evaluate(m), fieldError("practice"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ spec: "should-be-an-object" }),
    fieldError("spec"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(RELIABLE) as any;
  m.spec.spec_written_first = "yes";
  assert.throws(() => evaluate(m), fieldError("spec.spec_written_first"));
});

test("malformed: null section rejected", () => {
  const m = clone(RELIABLE) as any;
  m.guardrails = null;
  assert.throws(() => evaluate(m), fieldError("guardrails"));
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
  .filter((f) => f.startsWith("agentic-coding-practice--") && f.endsWith(".json"))
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
