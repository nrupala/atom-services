import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/grpc-service-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The GRPC_SERVICE_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  project: "agent-rpc-service",
  contract: { proto3_used: true, removed_fields_reserved: true,
              backward_forward_compatibility_rules_documented: true,
              buf_lint_in_ci: true, breaking_change_check_in_ci: true,
              codegen_pinned: true, codegen_generated_in_ci: true,
              hand_generated_stubs_present: false,
              field_number_reuse_present: false },
  methods: [
    { name: "GetJob", streaming_mode: "unary", deadline_set: true },
    { name: "StreamLogs", streaming_mode: "server", deadline_set: true,
      stream_bounded: true },
    { name: "Chat", streaming_mode: "bidi", deadline_set: true,
      stream_bounded: true },
  ],
  proto_fields: [
    { message: "JobRequest", name: "job_id", number: 1 },
    { message: "JobRequest", name: "priority", number: 2 },
    { message: "JobReply", name: "job_id", number: 1 },
  ],
  api_shape: { streaming_choices_documented_by_flow: true,
               cancellation_propagation_configured: true,
               rich_error_model_used: true,
               metadata_limited_to_transport_concerns: true },
  server: { health_service_exposed: true, reflection_enabled: true,
            reflection_restricted_to_dev_or_authenticated: true,
            interceptors_for_auth_logging_metrics_tracing: true,
            keepalive_and_pool_tuning_configured: true,
            explicit_max_message_sizes_set: true },
  security: { cross_host_traffic_present: true, mtls_enabled: true,
              per_service_identities_used: true,
              plaintext_across_hosts_present: false,
              authorization_via_interceptor_or_external_policy: true,
              public_surfaces_present: true,
              rate_limits_on_public_surfaces: true },
  observability: { trace_and_request_id_propagation_configured: true,
                   per_method_metrics_collected: true,
                   structured_errors_logged_once: true },
  testing: { in_process_integration_tests_present: true,
             contract_tests_pass_against_clients: true,
             load_smoke_on_hot_paths_run: true },
  interop: { rest_consumers_present: true,
             gateway_json_adapters_provided: true,
             browser_clients_present: true, grpc_web_enabled: true,
             packages_versioned_v1: true,
             deprecated_fields_announced_then_removed_on_schedule: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 37 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "GRPC_SERVICE_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 39);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.methods_count, 3);
  assert.equal(v.proto_fields_count, 3);
  assert.deepEqual(v.methods_without_streaming_mode, []);
  assert.deepEqual(v.methods_without_deadline, []);
  assert.deepEqual(v.unbounded_streaming_methods, []);
  assert.deepEqual(v.fields_sharing_a_duplicate_number, []);
  assert.equal(v.deadline_coverage, "1.000000");
  assert.equal(v.streaming_boundedness_coverage, "1.000000");
});

test("test_not_proto3_fails_contract_section", () => {
  const m = clone(COMPLETE) as any;
  m.contract.proto3_used = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(v.sections["contract_and_compatibility"], "fail");
});

test("test_removed_fields_not_reserved_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contract.removed_fields_reserved = false;
  assert.equal(evaluate(m).verdict, "GRPC_SERVICE_NOT_SOUND");
});

test("test_breaking_change_check_not_in_ci_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contract.breaking_change_check_in_ci = false;
  assert.equal(checkStatus(evaluate(m), "breaking_change_check_in_ci"), "fail");
});

test("test_hand_generated_stubs_fail", () => {
  const m = clone(COMPLETE) as any;
  m.contract.hand_generated_stubs_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_hand_generated_stubs"), "fail");
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
});

test("test_field_number_reuse_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contract.field_number_reuse_present = true;
  assert.equal(checkStatus(evaluate(m), "no_field_number_reuse"), "fail");
});

test("test_duplicate_field_number_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.proto_fields[1].number = 1;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(checkStatus(v, "no_duplicate_field_number_within_message"), "fail");
  assert.deepEqual(v.fields_sharing_a_duplicate_number, ["job_id", "priority"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_same_number_in_different_messages_passes", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "no_duplicate_field_number_within_message"), "pass");
});

test("test_field_missing_number_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.proto_fields[0].number;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_duplicate_field_number_within_message"), "missing");
});

test("test_empty_proto_fields_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.proto_fields = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "proto_fields_declared"), "fail");
  assert.equal(v.proto_fields_count, 0);
});

test("test_empty_methods_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.methods = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "methods_declared"), "fail");
  assert.equal(v.methods_count, 0);
  assert.equal(v.deadline_coverage, null);
  assert.equal(v.streaming_boundedness_coverage, null);
});

test("test_method_without_mode_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.methods[0].streaming_mode = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_method_names_streaming_mode"), "fail");
  assert.deepEqual(v.methods_without_streaming_mode, ["GetJob"]);
});

test("test_method_missing_mode_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.methods[1].streaming_mode;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_method_names_streaming_mode"), "missing");
});

test("test_method_without_deadline_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.methods[1].deadline_set = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(checkStatus(v, "every_method_has_deadline"), "fail");
  assert.deepEqual(v.methods_without_deadline, ["StreamLogs"]);
  assert.equal(v.deadline_coverage, "0.666667");
});

test("test_method_missing_deadline_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.methods[0].deadline_set;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_method_has_deadline"), "missing");
  assert.deepEqual(v.methods_without_deadline, []);
});

test("test_unbounded_stream_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.methods[2].stream_bounded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(checkStatus(v, "every_streaming_method_bounded"), "fail");
  assert.deepEqual(v.unbounded_streaming_methods, ["Chat"]);
  assert.equal(v.streaming_boundedness_coverage, "0.500000");
});

test("test_streaming_method_missing_bounded_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.methods[1].stream_bounded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_streaming_method_bounded"), "missing");
  assert.deepEqual(v.unbounded_streaming_methods, []);
});

test("test_unary_method_needs_no_bounded_declaration", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "every_streaming_method_bounded"), "pass");
  assert.equal(v.streaming_boundedness_coverage, "1.000000");
});

test("test_no_streaming_methods_coverage_is_none", () => {
  const m = clone(COMPLETE) as any;
  for (const row of m.methods) {
    row.streaming_mode = "unary";
    delete row.stream_bounded;
  }
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_SOUND");
  assert.equal(v.streaming_boundedness_coverage, null);
});

test("test_no_cancellation_propagation_fails_api_section", () => {
  const m = clone(COMPLETE) as any;
  m.api_shape.cancellation_propagation_configured = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(v.sections["api_shape_and_deadlines"], "fail");
});

test("test_health_service_not_exposed_fails_server_section", () => {
  const m = clone(COMPLETE) as any;
  m.server.health_service_exposed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(v.sections["server_hygiene"], "fail");
});

test("test_unrestricted_reflection_fails", () => {
  const m = clone(COMPLETE) as any;
  m.server.reflection_restricted_to_dev_or_authenticated = false;
  assert.equal(
    checkStatus(evaluate(m), "reflection_restricted_to_dev_or_authenticated"),
    "fail");
});

test("test_reflection_disabled_passes_reflection_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.server = { health_service_exposed: true, reflection_enabled: false,
               interceptors_for_auth_logging_metrics_tracing: true,
               keepalive_and_pool_tuning_configured: true,
               explicit_max_message_sizes_set: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_SOUND");
  assert.equal(
    checkStatus(v, "reflection_restricted_to_dev_or_authenticated"), "pass");
});

test("test_no_mtls_on_cross_host_fails_security_section", () => {
  const m = clone(COMPLETE) as any;
  m.security.mtls_enabled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(v.sections["security_and_transport"], "fail");
  assert.equal(checkStatus(v, "mtls_on_cross_host_paths"), "fail");
});

test("test_plaintext_across_hosts_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.plaintext_across_hosts_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_plaintext_across_hosts"), "fail");
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
});

test("test_no_cross_host_passes_security_gates_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.security = { cross_host_traffic_present: false,
                 authorization_via_interceptor_or_external_policy: true,
                 public_surfaces_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_SOUND");
  assert.equal(checkStatus(v, "mtls_on_cross_host_paths"), "pass");
  assert.equal(checkStatus(v, "no_plaintext_across_hosts"), "pass");
  assert.equal(checkStatus(v, "rate_limits_on_public_surfaces"), "pass");
});

test("test_public_surface_without_rate_limits_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.rate_limits_on_public_surfaces = false;
  assert.equal(
    checkStatus(evaluate(m), "rate_limits_on_public_surfaces"), "fail");
});

test("test_cross_host_missing_mtls_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.security.mtls_enabled;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "mtls_on_cross_host_paths"), "missing");
});

test("test_contract_tests_not_passing_fails_interop_section", () => {
  const m = clone(COMPLETE) as any;
  m.testing.contract_tests_pass_against_clients = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_NOT_SOUND");
  assert.equal(v.sections["observability_testing_and_interop"], "fail");
});

test("test_rest_consumers_without_gateway_adapter_fails", () => {
  const m = clone(COMPLETE) as any;
  m.interop.gateway_json_adapters_provided = false;
  assert.equal(
    checkStatus(evaluate(m), "gateway_json_adapters_for_rest_consumers"),
    "fail");
});

test("test_browser_clients_without_grpc_web_fails", () => {
  const m = clone(COMPLETE) as any;
  m.interop.grpc_web_enabled = false;
  assert.equal(
    checkStatus(evaluate(m), "grpc_web_where_browsers_connect"), "fail");
});

test("test_no_rest_or_browser_clients_passes_interop_gates_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.interop = { rest_consumers_present: false,
                browser_clients_present: false,
                packages_versioned_v1: true,
                deprecated_fields_announced_then_removed_on_schedule: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "GRPC_SERVICE_SOUND");
  assert.equal(
    checkStatus(v, "gateway_json_adapters_for_rest_consumers"), "pass");
  assert.equal(checkStatus(v, "grpc_web_where_browsers_connect"), "pass");
});

test("test_packages_not_v1_fails", () => {
  const m = clone(COMPLETE) as any;
  m.interop.packages_versioned_v1 = false;
  assert.equal(evaluate(m).verdict, "GRPC_SERVICE_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.server;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["server_hygiene"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.methods_count, null);
  assert.equal(v.proto_fields_count, null);
  assert.equal(v.methods_without_streaming_mode, null);
  assert.equal(v.methods_without_deadline, null);
  assert.equal(v.unbounded_streaming_methods, null);
  assert.equal(v.fields_sharing_a_duplicate_number, null);
  assert.equal(v.deadline_coverage, null);
  assert.equal(v.streaming_boundedness_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: GRPC_SERVICE_SOUND"));
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
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ contract: "should-be-an-object" }),
    fieldError("contract"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ methods: { name: "GetJob" } }),
    fieldError("methods"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ methods: ["GetJob"] }),
    fieldError("methods[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.contract.proto3_used = "yes";
  assert.throws(() => evaluate(m), fieldError("contract.proto3_used"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.proto_fields[0].number = "1";
  assert.throws(() => evaluate(m), fieldError("proto_fields[0].number"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.proto_fields[0].number = true;
  assert.throws(() => evaluate(m), fieldError("proto_fields[0].number"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.methods[1].stream_bounded = "yes";
  assert.throws(() => evaluate(m), fieldError("methods[1].stream_bounded"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.security = null;
  assert.throws(() => evaluate(m), fieldError("security"));
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
  .filter((f) => f.startsWith("grpc-service-design--") && f.endsWith(".json"))
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
