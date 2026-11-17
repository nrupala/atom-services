import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/mcp-server-design-and-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  server: "filings-server",
  tool_design: { names_are_verb_noun: true, typed_json_schemas: true,
                 descriptions_state_when_to_use: true,
                 errors_teach_fix: true, one_job_per_tool: true,
                 god_tools_present: false },
  budget: { smallest_set_covers_job: true,
            related_operations_grouped: true },
  tools: [
    { name: "get_filing", operation: "read", has_typed_schema: true,
      single_job: true, has_negative_test: true,
      approval_or_scope_gate_present: false },
    { name: "create_filing", operation: "write", has_typed_schema: true,
      single_job: true, has_negative_test: true,
      approval_or_scope_gate_present: false },
    { name: "delete_filing", operation: "destructive",
      has_typed_schema: true, single_job: true, has_negative_test: true,
      approval_or_scope_gate_present: true },
  ],
  transport: { transport_matches_deployment: true,
               handlers_stateless_where_possible: true,
               boundary_validation_applied: true },
  auth: { remote_transports_authenticated: true, remote_tls_present: true,
          least_privilege_tokens_per_server: true },
  safety: { destructive_actions_gated_by_approval_or_scope: true,
            read_and_write_separated: true },
  injection: { tool_results_treated_as_untrusted: true,
               fetched_text_never_treated_as_instructions: true,
               response_sizes_capped: true,
               outputs_sanitized_before_echoing: true },
  versioning: { capabilities_negotiated: true, changes_additive: true,
                deprecations_announced_loudly: true,
                protocol_versions_pinned: true },
  tests: { handshake_smoke_in_ci: true,
           per_tool_happy_and_error_cases_covered: true,
           malformed_input_tests_present: true,
           schema_valid_tool_definitions: true },
  observability: { calls_logged_with_tool_duration_outcome: true,
                   error_rate_spike_alerts_present: true,
                   secrets_or_sensitive_payloads_logged_present: false },
  red_lines: { shell_passthrough_without_sandboxing_present: false,
               secrets_echoed_back_present: false,
               unbounded_resource_reads_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "MCP_SERVER_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 41);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.tools_count, 3);
  assert.deepEqual(v.tools_without_typed_schema, []);
  assert.equal(v.typed_schema_coverage, "1.000000");
  assert.deepEqual(v.tools_not_single_job, []);
  assert.equal(v.single_job_coverage, "1.000000");
  assert.deepEqual(v.tools_with_invalid_operation, []);
  assert.equal(v.valid_operation_coverage, "1.000000");
  assert.deepEqual(v.duplicate_tool_names, []);
  assert.deepEqual(v.destructive_tools_without_gate, []);
  assert.equal(v.destructive_gate_coverage, "1.000000");
  assert.deepEqual(v.tools_without_negative_test, []);
  assert.equal(v.negative_test_coverage, "1.000000");
});

test("test_god_tool_fails_tool_design_section", () => {
  const m = clone(COMPLETE) as any;
  m.tool_design.god_tools_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "MCP_SERVER_NOT_SOUND");
  assert.equal(v.sections["tool_design_and_budget"], "fail");
  assert.equal(checkStatus(v, "no_god_tools"), "fail");
});

test("test_tool_without_typed_schema_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[0].has_typed_schema = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tool_has_typed_schema"), "fail");
  assert.deepEqual(v.tools_without_typed_schema, ["get_filing"]);
  assert.equal(v.typed_schema_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_tool_missing_schema_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tools[0].has_typed_schema;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_tool_has_typed_schema"), "missing");
  assert.deepEqual(v.tools_without_typed_schema, []);
});

test("test_tool_not_single_job_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[1].single_job = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tool_single_job"), "fail");
  assert.deepEqual(v.tools_not_single_job, ["create_filing"]);
  assert.equal(v.single_job_coverage, "0.666667");
});

test("test_tool_with_invalid_operation_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[1].operation = "execute";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tool_operation_valid"), "fail");
  assert.deepEqual(v.tools_with_invalid_operation, ["create_filing"]);
  assert.equal(v.valid_operation_coverage, "0.666667");
});

test("test_tool_missing_operation_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tools[1].operation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_tool_operation_valid"), "missing");
  assert.deepEqual(v.tools_with_invalid_operation, []);
});

test("test_duplicate_tool_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[2].name = "get_filing";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_tool_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_tool_names, ["get_filing"]);
});

test("test_tool_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.tools[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_tool_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_tool_names, []);
});

test("test_empty_tools_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tools = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tools_declared"), "fail");
  assert.equal(v.tools_count, 0);
  assert.equal(v.typed_schema_coverage, null);
  assert.equal(v.single_job_coverage, null);
  assert.equal(v.valid_operation_coverage, null);
  assert.equal(v.destructive_gate_coverage, null);
  assert.equal(v.negative_test_coverage, null);
  assert.deepEqual(v.duplicate_tool_names, []);
  assert.deepEqual(v.destructive_tools_without_gate, []);
});

test("test_no_remote_auth_fails_transports_section", () => {
  const m = clone(COMPLETE) as any;
  m.auth.remote_transports_authenticated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MCP_SERVER_NOT_SOUND");
  assert.equal(v.sections["transports_and_auth"], "fail");
  assert.equal(checkStatus(v, "remote_transports_authenticated"), "fail");
});

test("test_no_boundary_validation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transport.boundary_validation_applied = false;
  assert.equal(evaluate(m).verdict, "MCP_SERVER_NOT_SOUND");
});

test("test_destructive_tool_without_gate_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[2].approval_or_scope_gate_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_destructive_tool_gated"), "fail");
  assert.deepEqual(v.destructive_tools_without_gate, ["delete_filing"]);
  assert.equal(v.destructive_gate_coverage, "0.000000");
  assert.equal(v.sections["safety_rails_and_injection_awareness"], "fail");
});

test("test_destructive_tool_missing_gate_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.tools[2].approval_or_scope_gate_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_destructive_tool_gated"), "missing");
  assert.deepEqual(v.destructive_tools_without_gate, []);
  assert.equal(v.destructive_gate_coverage, "0.000000");
});

test("test_no_destructive_tools_passes_gate_check_vacuously", () => {
  const m = clone(COMPLETE) as any;
  m.tools[2].operation = "write";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_destructive_tool_gated"), "pass");
  assert.equal(v.destructive_gate_coverage, null);
  assert.deepEqual(v.destructive_tools_without_gate, []);
  assert.equal(v.verdict, "MCP_SERVER_SOUND");
});

test("test_fetched_text_as_instructions_fails_safety_section", () => {
  const m = clone(COMPLETE) as any;
  m.injection.fetched_text_never_treated_as_instructions = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MCP_SERVER_NOT_SOUND");
  assert.equal(v.sections["safety_rails_and_injection_awareness"], "fail");
});

test("test_uncapped_responses_fail", () => {
  const m = clone(COMPLETE) as any;
  m.injection.response_sizes_capped = false;
  assert.equal(checkStatus(evaluate(m), "response_sizes_capped"), "fail");
});

test("test_breaking_changes_fail_versioning_section", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.changes_additive = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MCP_SERVER_NOT_SOUND");
  assert.equal(v.sections["versioning_contract_tests_and_observability"], "fail");
});

test("test_no_handshake_smoke_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tests.handshake_smoke_in_ci = false;
  assert.equal(checkStatus(evaluate(m), "handshake_smoke_in_ci"), "fail");
});

test("test_tool_without_negative_test_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tools[0].has_negative_test = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tool_has_negative_test"), "fail");
  assert.deepEqual(v.tools_without_negative_test, ["get_filing"]);
  assert.equal(v.negative_test_coverage, "0.666667");
});

test("test_secrets_logged_fails_observability_check", () => {
  const m = clone(COMPLETE) as any;
  m.observability.secrets_or_sensitive_payloads_logged_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_or_sensitive_payloads_logged"), "fail");
  assert.equal(v.verdict, "MCP_SERVER_NOT_SOUND");
});

test("test_shell_passthrough_without_sandboxing_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.shell_passthrough_without_sandboxing_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_shell_passthrough_without_sandboxing"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_secrets_echoed_and_unbounded_reads_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.secrets_echoed_back_present = true;
  m.red_lines.unbounded_resource_reads_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_echoed_back"), "fail");
  assert.equal(checkStatus(v, "no_unbounded_resource_reads"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.observability;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["versioning_contract_tests_and_observability"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.tools_count, null);
  assert.equal(v.tools_without_typed_schema, null);
  assert.equal(v.typed_schema_coverage, null);
  assert.equal(v.tools_not_single_job, null);
  assert.equal(v.single_job_coverage, null);
  assert.equal(v.tools_with_invalid_operation, null);
  assert.equal(v.valid_operation_coverage, null);
  assert.equal(v.duplicate_tool_names, null);
  assert.equal(v.destructive_tools_without_gate, null);
  assert.equal(v.destructive_gate_coverage, null);
  assert.equal(v.tools_without_negative_test, null);
  assert.equal(v.negative_test_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: MCP_SERVER_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.server = 12345;
  assert.throws(() => evaluate(m), fieldError("server"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ transport: "should-be-an-object" }), fieldError("transport"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ tools: { name: "get_filing" } }), fieldError("tools"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ tools: ["get_filing"] }), fieldError("tools[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.auth.remote_tls_present = "yes";
  assert.throws(() => evaluate(m), fieldError("auth.remote_tls_present"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tools[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("tools[0].name"));
});

test("malformed: nested list entry operation as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tools[1].operation = true;
  assert.throws(() => evaluate(m), fieldError("tools[1].operation"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.injection = null;
  assert.throws(() => evaluate(m), fieldError("injection"));
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
  .filter((f) => f.startsWith("mcp-server-design-and-review--") && f.endsWith(".json"))
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
