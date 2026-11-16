import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/agent-safety-guardrail-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The GUARDED manifest, copied from the Python AuditTests oracle.
const GUARDED: Record<string, unknown> = {
  system: "example-agent",
  version: "2.1.0",
  guardrails_disabled: false,
  injection_defense: {
    external_content_treated_as_data: true,
    suspicious_imperatives_flagged: true,
    test_suite: { present: true, passing: true },
  },
  tool_access: {
    scoped_to_job: true,
    read_write_separated: true,
    destructive_tools_gated: true,
    shell_access: true,
    shell_sandboxed: true,
  },
  approvals: {
    destructive_actions_require_approval: true,
    verified: true,
    covered_actions: ["deploys", "payments", "deletions",
                      "external_sends", "credential_changes"],
    bypassable_by_agent: false,
  },
  sandbox: {
    enabled: true,
    filesystem_scope_minimal: true,
    egress_restricted: true,
    resource_caps_enforced: true,
    abuse_test_passed: true,
  },
  budgets: { caps_set: true, alert_before_cap: true },
  circuit_breakers: { loop_detection_enabled: true },
  kill_switch: { present: true, tested: true },
  output_validation: {
    schema_checked: true,
    model_output_evaled: false,
    downstream_parameterized: true,
  },
  secrets: {
    values_in_context: false,
    pii_in_context: false,
    credential_handles_only: true,
    exfiltration_paths_tested: true,
  },
  red_team: {
    injection_suite_run: true,
    jailbreak_tested: true,
    canary_tokens_used: true,
    findings_become_regression_tests: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 15 Python AuditTests, ported ----

test("test_guarded_manifest_is_guarded", () => {
  const v = evaluate(clone(GUARDED));
  assert.equal(v.verdict, "GUARDED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 34);
});

test("test_secrets_in_context_is_a_red_line_fail", () => {
  const m = clone(GUARDED) as any;
  m.secrets.values_in_context = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["secrets_hygiene"], "fail");
});

test("test_pii_in_context_is_a_red_line_fail", () => {
  const m = clone(GUARDED) as any;
  m.secrets.pii_in_context = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["secrets_hygiene"], "fail");
});

test("test_guardrails_disabled_is_a_red_line_fail", () => {
  const m = clone(GUARDED) as any;
  m.guardrails_disabled = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["approval_gates"], "fail");
});

test("test_agent_bypassable_approval_fails", () => {
  const m = clone(GUARDED) as any;
  m.approvals.bypassable_by_agent = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["approval_gates"], "fail");
});

test("test_approval_missing_a_sensitive_action_fails", () => {
  const m = clone(GUARDED) as any;
  m.approvals.covered_actions = ["deploys", "payments", "deletions",
                                 "external_sends"];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["approval_gates"], "fail");
});

test("test_unsandboxed_shell_access_fails", () => {
  const m = clone(GUARDED) as any;
  m.tool_access.shell_sandboxed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["tool_least_privilege"], "fail");
});

test("test_no_shell_access_passes_shell_check", () => {
  const m = clone(GUARDED) as any;
  m.tool_access.shell_access = false;
  delete m.tool_access.shell_sandboxed;
  const v = evaluate(m);
  assert.equal(v.verdict, "GUARDED");
});

test("test_evaled_model_output_fails", () => {
  const m = clone(GUARDED) as any;
  m.output_validation.model_output_evaled = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["output_validation"], "fail");
});

test("test_untested_kill_switch_fails", () => {
  const m = clone(GUARDED) as any;
  m.kill_switch.tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["budgets_and_circuit_breakers"], "fail");
});

test("test_failing_injection_suite_fails", () => {
  const m = clone(GUARDED) as any;
  m.injection_defense.test_suite.passing = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GUARDED");
  assert.equal(v.sections["injection_defense"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(GUARDED) as any;
  delete m.sandbox;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sandboxing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(GUARDED));
  const s = stamp(v);
  assert.ok(s.includes("VERDICT: GUARDED"));
  assert.ok(s.includes("injection_defense"));
  assert.ok(s.includes("34 checks across eight sections"));
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
    () => evaluate({ guardrails_disabled: "not-a-boolean", tool_access: "should-be-an-object" }),
    fieldError("guardrails_disabled"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ tool_access: "should-be-an-object" }),
    fieldError("tool_access"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(GUARDED) as Record<string, any>;
  m.secrets.values_in_context = "no";
  assert.throws(() => evaluate(m), fieldError("secrets.values_in_context"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(GUARDED) as Record<string, any>;
  m.approvals.covered_actions = "deploys";
  assert.throws(() => evaluate(m), fieldError("approvals.covered_actions"));
});

test("malformed: list entry as number rejected", () => {
  const m = structuredClone(GUARDED) as Record<string, any>;
  m.approvals.covered_actions = ["deploys", 42];
  assert.throws(() => evaluate(m), fieldError("approvals.covered_actions[1]"));
});

test("malformed: nested object as string rejected", () => {
  const m = structuredClone(GUARDED) as Record<string, any>;
  m.injection_defense.test_suite = "present";
  assert.throws(() => evaluate(m), fieldError("injection_defense.test_suite"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(GUARDED) as Record<string, any>;
  m.sandbox = null;
  assert.throws(() => evaluate(m), fieldError("sandbox"));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist/test/, fixtures in test/fixtures/.
// Only this atom's fixtures (prefix agent-safety-guardrail-audit--).
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
  .filter((f) => f.startsWith("agent-safety-guardrail-audit--") && f.endsWith(".json"))
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
