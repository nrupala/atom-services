import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/service-isolation-hardening-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  subject: "fleet-node-3",
  identity: { dedicated_non_login_system_user_per_isolated_service: true,
              isolated_services_run_as_non_root: true,
              cross_service_filesystem_access_denied_between_services: true,
              per_service_capability_set_minimised: true },
  services: [
    { name: "mailer", dedicated_user_assigned: true, filesystem_access_scoped: true, egress_restricted: true },
    { name: "parser", dedicated_user_assigned: true, filesystem_access_scoped: true, egress_restricted: true },
  ],
  systemd: { systemd_no_new_privileges_directive_set: true,
             systemd_protect_system_strict_directive_set: true,
             systemd_protect_home_directive_set: true,
             systemd_private_tmp_directive_set: true,
             systemd_dynamic_user_directive_set: true,
             systemd_capability_bounding_set_directive_restricted: true,
             systemd_system_call_filter_directive_applied: true,
             systemd_restrict_address_families_directive_applied: true,
             systemd_read_write_paths_directive_limited_to_required_paths: true },
  confinement: { sandbox_tool_used_for_one_off_untrusted_execution_isolation: true,
                 namespaces_provide_filesystem_and_network_separation_for_isolated_services: true,
                 mac_profile_confines_network_exposed_isolated_services: true,
                 mac_denials_audited_without_blanket_disabling_confinement: true,
                 wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation: true,
                 microvm_used_where_kernel_level_isolation_is_required: true,
                 windows_low_privilege_isolation_equivalents_applied_where_in_scope: true,
                 chroot_not_relied_upon_as_sole_service_isolation: true },
  resources: { cgroups_v2_cpu_memory_io_limits_set_for_isolated_services: true,
               per_service_ulimits_configured_for_isolated_services: true,
               execution_timeouts_configured_for_isolated_services: true,
               restart_limits_configured_for_isolated_services: true },
  egress_monitoring: { outbound_egress_restricted_for_isolated_services_not_needing_world_access: true,
                       exec_and_spawn_events_logged_for_isolated_services: true,
                       per_service_kill_switch_available_for_isolated_services: true },
  verification: { runaway_service_behaviour_tested_against_resource_limits: true,
                  sandbox_escape_and_abuse_cases_exercised_for_isolated_services: true,
                  sandbox_blocking_verified_not_assumed_for_isolated_services: true },
  red_lines: { root_service_run_for_convenience_present: false,
               host_wide_mounts_into_isolated_services_present: false,
               sandbox_disabled_to_make_service_run_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_hardened", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 39);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.services_count, 2);
  assert.deepEqual(v.services_without_dedicated_user, []);
  assert.deepEqual(v.services_without_filesystem_scope, []);
  assert.deepEqual(v.services_without_egress_restriction, []);
  assert.equal(v.dedicated_user_coverage, "1.000000");
  assert.equal(v.filesystem_scope_coverage, "1.000000");
  assert.equal(v.egress_restriction_coverage, "1.000000");
  assert.deepEqual(v.duplicate_service_names, []);
});

test("test_empty_services_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.services = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED");
  assert.equal(v.services_count, 0);
  assert.deepEqual(v.services_without_dedicated_user, []);
  assert.equal(v.dedicated_user_coverage, null);
  assert.equal(v.filesystem_scope_coverage, null);
  assert.equal(v.egress_restriction_coverage, null);
  assert.deepEqual(v.duplicate_service_names, []);
  assert.equal(checkStatus(v, "isolated_services_roster_declared"), "pass");
  assert.equal(checkStatus(v, "every_rostered_service_has_dedicated_user_assignment"), "pass");
});

test("test_shared_user_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.identity.dedicated_non_login_system_user_per_isolated_service = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["least_privilege_identity"], "fail");
  assert.equal(checkStatus(v, "dedicated_non_login_system_user_per_isolated_service"), "fail");
});

test("test_root_service_declaration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.identity.isolated_services_run_as_non_root = false;
  assert.equal(checkStatus(evaluate(m), "isolated_services_run_as_non_root"), "fail");
});

test("test_service_without_dedicated_user_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.services[0].dedicated_user_assigned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(checkStatus(v, "every_rostered_service_has_dedicated_user_assignment"), "fail");
  assert.deepEqual(v.services_without_dedicated_user, ["mailer"]);
  assert.equal(v.dedicated_user_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_service_without_filesystem_scope_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.services[1].filesystem_access_scoped = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rostered_service_has_scoped_filesystem_access"), "fail");
  assert.deepEqual(v.services_without_filesystem_scope, ["parser"]);
  assert.equal(v.filesystem_scope_coverage, "0.500000");
});

test("test_service_without_egress_restriction_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.services[1].egress_restricted = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rostered_service_has_restricted_egress_declaration"), "fail");
  assert.deepEqual(v.services_without_egress_restriction, ["parser"]);
  assert.equal(v.egress_restriction_coverage, "0.500000");
});

test("test_service_missing_user_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.services[0].dedicated_user_assigned;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_rostered_service_has_dedicated_user_assignment"), "missing");
  assert.deepEqual(v.services_without_dedicated_user, []);
});

test("test_duplicate_service_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.services[1].name = "mailer";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_rostered_service_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_service_names, ["mailer"]);
});

test("test_service_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.services[1].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_rostered_service_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_service_names, []);
});

test("test_absent_services_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.services;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "isolated_services_roster_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.services_count, null);
  assert.equal(v.services_without_dedicated_user, null);
  assert.equal(v.services_without_filesystem_scope, null);
  assert.equal(v.services_without_egress_restriction, null);
  assert.equal(v.dedicated_user_coverage, null);
  assert.equal(v.filesystem_scope_coverage, null);
  assert.equal(v.egress_restriction_coverage, null);
  assert.equal(v.duplicate_service_names, null);
});

test("test_missing_no_new_privileges_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.systemd.systemd_no_new_privileges_directive_set = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["systemd_sandbox_directives"], "fail");
});

test("test_unrestricted_read_write_paths_fail", () => {
  const m = clone(COMPLETE) as any;
  m.systemd.systemd_read_write_paths_directive_limited_to_required_paths = false;
  assert.equal(checkStatus(evaluate(m), "systemd_read_write_paths_directive_limited_to_required_paths"), "fail");
});

test("test_no_mac_profile_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.confinement.mac_profile_confines_network_exposed_isolated_services = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["confinement_and_sandbox_tools"], "fail");
});

test("test_chroot_as_sole_isolation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.confinement.chroot_not_relied_upon_as_sole_service_isolation = false;
  assert.equal(checkStatus(evaluate(m), "chroot_not_relied_upon_as_sole_service_isolation"), "fail");
});

test("test_no_resource_limits_fail_section4", () => {
  const m = clone(COMPLETE) as any;
  m.resources.cgroups_v2_cpu_memory_io_limits_set_for_isolated_services = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["resource_containment"], "fail");
});

test("test_no_restart_limits_fail", () => {
  const m = clone(COMPLETE) as any;
  m.resources.restart_limits_configured_for_isolated_services = false;
  assert.equal(checkStatus(evaluate(m), "restart_limits_configured_for_isolated_services"), "fail");
});

test("test_open_egress_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.egress_monitoring.outbound_egress_restricted_for_isolated_services_not_needing_world_access = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["egress_monitoring_and_kill_switch"], "fail");
});

test("test_no_kill_switch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.egress_monitoring.per_service_kill_switch_available_for_isolated_services = false;
  assert.equal(checkStatus(evaluate(m), "per_service_kill_switch_available_for_isolated_services"), "fail");
});

test("test_unexercised_escape_cases_fail_section6", () => {
  const m = clone(COMPLETE) as any;
  m.verification.sandbox_escape_and_abuse_cases_exercised_for_isolated_services = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
  assert.equal(v.sections["isolation_verification"], "fail");
});

test("test_runaway_behaviour_untested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.verification.runaway_service_behaviour_tested_against_resource_limits = false;
  assert.equal(checkStatus(evaluate(m), "runaway_service_behaviour_tested_against_resource_limits"), "fail");
});

test("test_root_for_convenience_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.root_service_run_for_convenience_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_root_isolated_service_run_for_convenience"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_host_wide_mounts_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.host_wide_mounts_into_isolated_services_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_host_wide_mounts_into_isolated_services"), "fail");
  assert.equal(v.verdict, "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED");
});

test("test_sandbox_disabled_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.sandbox_disabled_to_make_service_run_present = true;
  assert.equal(checkStatus(evaluate(m), "no_sandbox_disabled_to_make_isolated_service_run"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.verification;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["isolation_verification"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.services_count, null);
  assert.equal(v.services_without_dedicated_user, null);
  assert.equal(v.services_without_filesystem_scope, null);
  assert.equal(v.services_without_egress_restriction, null);
  assert.equal(v.dedicated_user_coverage, null);
  assert.equal(v.filesystem_scope_coverage, null);
  assert.equal(v.egress_restriction_coverage, null);
  assert.equal(v.duplicate_service_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED"));
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
  m.subject = 12345;
  assert.throws(() => evaluate(m), fieldError("subject"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ identity: "should-be-an-object" }), fieldError("identity"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ services: { name: "mailer" } }), fieldError("services"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ services: ["mailer"] }), fieldError("services[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.verification.runaway_service_behaviour_tested_against_resource_limits = "yes";
  assert.throws(() => evaluate(m), fieldError("verification.runaway_service_behaviour_tested_against_resource_limits"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.services[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("services[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.services[1].dedicated_user_assigned = 7;
  assert.throws(() => evaluate(m), fieldError("services[1].dedicated_user_assigned"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.systemd = null;
  assert.throws(() => evaluate(m), fieldError("systemd"));
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
  .filter((f) => f.startsWith("service-isolation-hardening-review--") && f.endsWith(".json"))
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
