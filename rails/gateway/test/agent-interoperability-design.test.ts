import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/agent-interoperability-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DESIGN_SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  design: "fleet handoff design v2",
  integrations: [
    { name: "tool host", counterparty_type: "tools_for_models",
      protocol: "mcp", rationale_documented: true },
    { name: "editor session", counterparty_type: "editor_agent_session",
      protocol: "acp_stdio", rationale_documented: true },
    { name: "peer agent", counterparty_type: "agent_to_agent",
      protocol: "a2a", rationale_documented: true },
    { name: "operator scripts", counterparty_type: "human_or_script",
      protocol: "rest_cli_web", rationale_documented: true },
  ],
  architecture: { single_core: true,
                  protocol_adapters: true,
                  business_logic_per_protocol: false },
  gateway: { remote_or_untrusted_agents_present: true,
             single_authenticated_broker: true,
             broker_authenticated: true,
             broker_audited: true,
             broker_rate_limited: true,
             direct_doors_to_remote_agents: false },
  handoff: { contracts_used_for_non_trivial_coordination: true,
             contract_states_goal: true,
             contract_states_constraints: true,
             contract_states_acceptance_criteria: true,
             contract_states_report_back_location: true },
  identity: { each_agent_own_credential: true,
              credentials_least_privilege: true,
              credentials_short_lived: true,
              credentials_revocable: true,
              shared_forever_keys_present: false },
  discovery: { capabilities_published: true,
               version_published: true,
               negotiation_supported: true,
               graceful_degradation_declared: true },
  audit: { message_log_kept: true,
           log_records_who_asked: true,
           log_records_what_ran: true,
           log_records_what_changed: true },
  testing: { handshake_tests_exist: true,
             handshake_tests_pass: true,
             handshake_tests_both_directions: true,
             handshake_tests_per_protocol: true },
  red_lines: { unsandboxed_third_party_agents_present: false,
               secrets_or_private_data_in_messages_by_default: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string): string {
  const found = v.checks.find((r) => r.check === name);
  assert.ok(found, `no check named ${name}`);
  return found.status;
}

// ---- The 32 Python VerdictTests, ported ----

test("test_sound_manifest_is_design_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.protocol_status, "sound_on_declared_evidence");
  assert.equal(v.integration_count, 4);
  assert.equal(v.checks.length, 36);
});

test("test_agent_to_agent_accepts_acp_rest_as_well_as_a2a", () => {
  const m = clone(SOUND) as any;
  m.integrations[2].protocol = "acp_rest";
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_wrong_protocol_for_counterparty_fails", () => {
  for (const [ctype, protocol] of [
    ["tools_for_models", "a2a"],
    ["editor_agent_session", "mcp"],
    ["agent_to_agent", "mcp"],
    ["human_or_script", "acp_stdio"],
  ] as const) {
    const m = clone(SOUND) as any;
    m.integrations = [
      { counterparty_type: ctype, protocol, rationale_documented: true }];
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_NOT_SOUND", `${ctype}/${protocol}`);
    assert.equal(v.sections["protocol_selection"], "fail");
    assert.equal(v.protocol_status, "not_sound_on_declared_evidence");
  }
});

test("test_counterparty_outside_vocabulary_fails", () => {
  const m = clone(SOUND) as any;
  m.integrations[0].counterparty_type = "carrier_pigeon";
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "counterparty_types_in_skill_vocabulary"), "fail");
  assert.equal(v.protocol_status, "not_sound_on_declared_evidence");
});

test("test_missing_counterparty_type_is_missing_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.integrations[0].counterparty_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "counterparty_types_in_skill_vocabulary"), "missing");
  assert.equal(v.protocol_status, null);
});

test("test_missing_protocol_is_missing_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.integrations[1].protocol;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "protocols_match_counterparty_per_skill"), "missing");
  assert.equal(v.protocol_status, null);
});

test("test_undocumented_rationale_fails_quality_gate", () => {
  const m = clone(SOUND) as any;
  m.integrations[0].rationale_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "protocol_choice_documented_with_why_per_integration"),
    "fail");
});

test("test_missing_rationale_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.integrations[0].rationale_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "protocol_choice_documented_with_why_per_integration"),
    "missing");
});

test("test_empty_integration_list_fails", () => {
  const m = clone(SOUND) as any;
  m.integrations = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(v.integration_count, 0);
  assert.equal(checkStatus(v, "integrations_declared"), "fail");
});

test("test_absent_integrations_is_insufficient_evidence", () => {
  const m = clone(SOUND) as any;
  delete m.integrations;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.integration_count, null);
  assert.equal(v.protocol_status, null);
});

test("test_non_list_integrations_is_missing", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(SOUND) as any;
  m.integrations = "mcp everywhere";
  assert.throws(() => evaluate(m), fieldError("integrations"));
});

test("test_business_logic_per_protocol_fails", () => {
  const m = clone(SOUND) as any;
  m.architecture.business_logic_per_protocol = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(v.sections["bridge_architecture"], "fail");
});

test("test_no_single_core_fails", () => {
  const m = clone(SOUND) as any;
  m.architecture.single_core = false;
  assert.equal(evaluate(m).verdict, "DESIGN_NOT_SOUND");
});

test("test_remote_agents_without_broker_fails", () => {
  const m = clone(SOUND) as any;
  m.gateway.single_authenticated_broker = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(v.sections["gateway_and_remote_access"], "fail");
});

test("test_direct_doors_to_remote_agents_fails", () => {
  const m = clone(SOUND) as any;
  m.gateway.direct_doors_to_remote_agents = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "no_direct_doors_to_remote_agents"), "fail");
});

test("test_unauthenticated_or_unaudited_or_unlimited_broker_fails", () => {
  for (const field of ["broker_authenticated", "broker_audited",
                       "broker_rate_limited"]) {
    const m = clone(SOUND) as any;
    m.gateway[field] = false;
    assert.equal(evaluate(m).verdict, "DESIGN_NOT_SOUND", field);
  }
});

test("test_no_remote_agents_passes_gateway_as_not_applicable", () => {
  const m = clone(SOUND) as any;
  m.gateway = { remote_or_untrusted_agents_present: false };
  assert.equal(evaluate(m).verdict, "DESIGN_SOUND");
});

test("test_remote_gate_absent_is_insufficient_evidence", () => {
  const m = clone(SOUND) as any;
  delete m.gateway.remote_or_untrusted_agents_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["gateway_and_remote_access"],
    "insufficient_evidence");
});

test("test_remote_agents_with_broker_property_missing_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.gateway.broker_audited;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "broker_audited"), "missing");
});

test("test_handoff_contract_missing_field_fails", () => {
  for (const field of ["contract_states_goal",
                       "contract_states_constraints",
                       "contract_states_acceptance_criteria",
                       "contract_states_report_back_location"]) {
    const m = clone(SOUND) as any;
    m.handoff[field] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_NOT_SOUND", field);
    assert.equal(v.sections["handoff_contracts"], "fail");
  }
});

test("test_contracts_not_used_for_non_trivial_coordination_fails", () => {
  const m = clone(SOUND) as any;
  m.handoff.contracts_used_for_non_trivial_coordination = false;
  assert.equal(evaluate(m).verdict, "DESIGN_NOT_SOUND");
});

test("test_shared_forever_keys_fail", () => {
  const m = clone(SOUND) as any;
  m.identity.shared_forever_keys_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(v.sections["identity_and_credentials"], "fail");
});

test("test_non_revocable_or_long_lived_credentials_fail", () => {
  for (const field of ["each_agent_own_credential",
                       "credentials_least_privilege",
                       "credentials_short_lived",
                       "credentials_revocable"]) {
    const m = clone(SOUND) as any;
    m.identity[field] = false;
    assert.equal(evaluate(m).verdict, "DESIGN_NOT_SOUND", field);
  }
});

test("test_unpublished_capabilities_or_no_degradation_fails", () => {
  for (const field of ["capabilities_published", "version_published",
                       "negotiation_supported",
                       "graceful_degradation_declared"]) {
    const m = clone(SOUND) as any;
    m.discovery[field] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_NOT_SOUND", field);
    assert.equal(v.sections["versioning_and_discovery"], "fail");
  }
});

test("test_audit_log_without_provenance_fails", () => {
  for (const field of ["message_log_kept", "log_records_who_asked",
                       "log_records_what_ran", "log_records_what_changed"]) {
    const m = clone(SOUND) as any;
    m.audit[field] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_NOT_SOUND", field);
    assert.equal(v.sections["audit_and_provenance"], "fail");
  }
});

test("test_handshake_tests_missing_or_failing_fails", () => {
  for (const field of ["handshake_tests_exist", "handshake_tests_pass",
                       "handshake_tests_both_directions",
                       "handshake_tests_per_protocol"]) {
    const m = clone(SOUND) as any;
    m.testing[field] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DESIGN_NOT_SOUND", field);
    assert.equal(v.sections["handshake_testing_and_red_lines"], "fail");
  }
});

test("test_unsandboxed_third_party_agents_fail_red_line", () => {
  const m = clone(SOUND) as any;
  m.red_lines.unsandboxed_third_party_agents_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "no_unsandboxed_third_party_agents"), "fail");
});

test("test_secrets_in_messages_fail_red_line", () => {
  const m = clone(SOUND) as any;
  m.red_lines.secrets_or_private_data_in_messages_by_default = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "no_secrets_or_private_data_in_messages_by_default"),
    "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.audit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["audit_and_provenance"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.protocol_status, null);
  assert.equal(v.integration_count, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: DESIGN_SOUND"));
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
  const m = clone(SOUND) as any;
  m.design = 12345;
  assert.throws(() => evaluate(m), fieldError("design"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ architecture: "should-be-an-object" }),
    fieldError("architecture"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(SOUND) as any;
  m.integrations = "mcp everywhere";
  assert.throws(() => evaluate(m), fieldError("integrations"));
});

test("malformed: list entry as string rejected", () => {
  const m = clone(SOUND) as any;
  m.integrations[0] = "tool host";
  assert.throws(() => evaluate(m), fieldError("integrations[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.gateway.broker_audited = "yes";
  assert.throws(() => evaluate(m), fieldError("gateway.broker_audited"));
});

test("malformed: boolean leaf in list entry as string rejected", () => {
  const m = clone(SOUND) as any;
  m.integrations[0].rationale_documented = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("integrations[0].rationale_documented"),
  );
});

test("malformed: null section rejected", () => {
  const m = clone(SOUND) as any;
  m.audit = null;
  assert.throws(() => evaluate(m), fieldError("audit"));
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
  .filter((f) => f.startsWith("agent-interoperability-design--") && f.endsWith(".json"))
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
