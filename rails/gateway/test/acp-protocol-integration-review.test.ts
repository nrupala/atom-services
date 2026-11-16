import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/acp-protocol-integration-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The INTEGRATION_SOUND (ACP-client) manifest, copied from the Python oracle tests.
const SOUND_CLIENT: Record<string, unknown> = {
  implementation: "editor ACP agent adapter",
  protocol: { flavor: "ACP-client",
              disambiguated_naming: true,
              spec_version_documented: true,
              supported_subset_documented: true },
  adapter: { thin: true,
             single_core_protocol_at_edge: true,
             business_logic_in_wire_layer: false },
  surface: { client_flow_complete: true,
             client_permissions_handled: true },
  lifecycle: { unknown_sessions_or_runs_handled: true,
               cancels_handled: true,
               errors_handled: true,
               reconnects_handled: true,
               state_leaks_across_sessions: false },
  streaming: { updates_ordered: true,
               chunk_sizes_bounded: true,
               backpressure_addressed: true,
               terminal_states_clear: true },
  security: { remote_endpoints_present: true,
              remote_endpoints_authenticated: true,
              inputs_validated: true,
              output_sizes_capped: true,
              tool_execution_sandboxed: true },
  honesty: { unimplemented_modes_noted: true,
             unsupported_features_faked: false },
  tests: { scripted_client_handshake_covered: true,
           lifecycle_happy_error_cancel_covered: true,
           contract_tests_in_ci_per_protocol: true },
  upgrade: { sdk_upgrade_path_documented: true,
             adapter_tests_kept_for_sdk_swap: true },
};

const SOUND_COMM: Record<string, unknown> = (() => {
  const m = clone(SOUND_CLIENT) as any;
  m.implementation = "agent-to-agent run service";
  m.protocol.flavor = "ACP-comm";
  m.surface = { comm_endpoints_complete: true,
                comm_message_parts_typed: true };
  return m;
})();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkOf(v: any, name: string) {
  return v.checks.find((c: any) => c.check === name);
}

// ---- The Python VerdictTests, ported ----

test("test_sound_client_manifest_is_integration_sound", () => {
  const v = evaluate(clone(SOUND_CLIENT));
  assert.equal(v.verdict, "INTEGRATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.flavor_status, "acp_client");
  assert.equal(v.checks.length, 31);
});

test("test_sound_comm_manifest_is_integration_sound", () => {
  const v = evaluate(clone(SOUND_COMM));
  assert.equal(v.verdict, "INTEGRATION_SOUND");
  assert.equal(v.flavor_status, "acp_comm");
  assert.equal(checkOf(v, "comm_endpoints_complete_when_comm_flavor").status, "pass");
  assert.equal(checkOf(v, "client_flow_complete_when_client_flavor").evidence, "not an ACP-client integration");
});

test("test_client_surface_not_applicable_for_comm", () => {
  const v = evaluate(clone(SOUND_COMM));
  assert.equal(checkOf(v, "client_permissions_handled_when_client_flavor").status, "pass");
});

test("test_comm_surface_not_applicable_for_client", () => {
  const v = evaluate(clone(SOUND_CLIENT));
  assert.equal(checkOf(v, "comm_message_parts_typed_when_comm_flavor").status, "pass");
});

test("test_unrecognized_flavor_fails", () => {
  for (const bad of ["ACP", "acp-client", "ACP-Client", "", "MCP"]) {
    const m = clone(SOUND_CLIENT) as any;
    m.protocol.flavor = bad;
    const v = evaluate(m);
    assert.equal(v.verdict, "INTEGRATION_NOT_SOUND", bad);
    assert.equal(v.flavor_status, "unrecognized", bad);
    assert.equal(v.sections["disambiguation_and_scope"], "fail", bad);
  }
});

test("test_non_string_flavor_fails_as_unrecognized", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect). A
  // non-string flavor is now rejected with FieldTypeError.
  const m = clone(SOUND_CLIENT) as any;
  m.protocol.flavor = 42;
  assert.throws(() => evaluate(m), fieldError("protocol.flavor"));
});

test("test_missing_flavor_is_missing_not_failed", () => {
  const m = clone(SOUND_CLIENT) as any;
  delete m.protocol.flavor;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.flavor_status, null);
  assert.equal(checkOf(v, "flavor_recognized").status, "missing");
  assert.equal(checkOf(v, "client_flow_complete_when_client_flavor").status, "missing");
});

test("test_client_flow_incomplete_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.surface.client_flow_complete = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["protocol_surface"], "fail");
});

test("test_client_permissions_not_handled_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.surface.client_permissions_handled = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_comm_endpoints_incomplete_fails", () => {
  const m = clone(SOUND_COMM) as any;
  m.surface.comm_endpoints_complete = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["protocol_surface"], "fail");
});

test("test_comm_message_parts_untyped_fails", () => {
  const m = clone(SOUND_COMM) as any;
  m.surface.comm_message_parts_typed = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_client_surface_fields_ignored_for_comm_flavor", () => {
  const m = clone(SOUND_COMM) as any;
  m.surface.client_flow_complete = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_SOUND");
});

test("test_disambiguated_naming_absent_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.protocol.disambiguated_naming = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["disambiguation_and_scope"], "fail");
});

test("test_spec_version_not_documented_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.protocol.spec_version_documented = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_supported_subset_not_documented_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.protocol.supported_subset_documented = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_business_logic_in_wire_layer_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.adapter.business_logic_in_wire_layer = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["adapter_architecture"], "fail");
});

test("test_adapter_not_thin_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.adapter.thin = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_state_leak_across_sessions_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.lifecycle.state_leaks_across_sessions = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["lifecycle_correctness"], "fail");
});

test("test_cancels_not_handled_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.lifecycle.cancels_handled = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_unknown_sessions_not_handled_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.lifecycle.unknown_sessions_or_runs_handled = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_unordered_updates_fail", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.streaming.updates_ordered = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["streaming_discipline"], "fail");
});

test("test_unclear_terminal_states_fail", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.streaming.terminal_states_clear = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_unauthenticated_remote_endpoints_fail_red_line", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.security.remote_endpoints_authenticated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["security"], "fail");
});

test("test_remote_auth_missing_when_remote_present_is_missing", () => {
  const m = clone(SOUND_CLIENT) as any;
  delete m.security.remote_endpoints_authenticated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkOf(v, "remote_endpoints_authenticated_when_remote").status, "missing");
});

test("test_no_remote_endpoints_passes_auth_as_not_applicable", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.security.remote_endpoints_present = false;
  delete m.security.remote_endpoints_authenticated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_SOUND");
  assert.equal(checkOf(v, "remote_endpoints_authenticated_when_remote").evidence, "no remote endpoints declared");
});

test("test_inputs_not_validated_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.security.inputs_validated = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_unsandboxed_tool_execution_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.security.tool_execution_sandboxed = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_faked_unsupported_features_fail_red_line", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.honesty.unsupported_features_faked = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "INTEGRATION_NOT_SOUND");
  assert.equal(v.sections["honesty_tests_and_upgrade_path"], "fail");
});

test("test_unimplemented_modes_not_noted_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.honesty.unimplemented_modes_noted = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_lifecycle_tests_not_covering_cancel_fail", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.tests.lifecycle_happy_error_cancel_covered = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_contract_tests_not_in_ci_fail", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.tests.contract_tests_in_ci_per_protocol = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_adapter_tests_not_kept_for_swap_fails", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.upgrade.adapter_tests_kept_for_sdk_swap = false;
  assert.equal(evaluate(m).verdict, "INTEGRATION_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND_CLIENT) as any;
  delete m.streaming;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["streaming_discipline"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.flavor_status, null);
  assert.equal(v.checks.length, 31);
});

test("test_truthy_non_boolean_is_fail_not_pass", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(SOUND_CLIENT) as any;
  m.streaming.updates_ordered = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("streaming.updates_ordered"),
  );
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND_CLIENT))).includes("VERDICT: INTEGRATION_SOUND"));
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
// MalformedTypeTests, ported. A documented field present with
// the wrong JSON type raises FieldTypeError naming the field.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.implementation = 12345;
  assert.throws(() => evaluate(m), fieldError("implementation"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ protocol: "should-be-an-object" }),
    fieldError("protocol"),
  );
});

test("malformed: string leaf as number rejected", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.protocol.flavor = 42;
  assert.throws(() => evaluate(m), fieldError("protocol.flavor"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.streaming.updates_ordered = "yes";
  assert.throws(() => evaluate(m), fieldError("streaming.updates_ordered"));
});

test("malformed: null section rejected", () => {
  const m = clone(SOUND_CLIENT) as any;
  m.streaming = null;
  assert.throws(() => evaluate(m), fieldError("streaming"));
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
  .filter((f) => f.startsWith("acp-protocol-integration-review--") && f.endsWith(".json"))
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
