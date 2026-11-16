import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/edge-platform-engineering.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The EDGE_PLATFORM_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  project: "ops-worker-suite",
  platform_fit: { storage_choices_documented: true,
                  consistency_access_pattern_reviewed: true },
  components: [
    { name: "api-worker", storage_backend: "d1",
      storage_rationale_documented: true,
      requires_strong_consistency: true, is_admin_surface: false },
    { name: "config-cache", storage_backend: "kv",
      storage_rationale_documented: true,
      requires_strong_consistency: false, is_admin_surface: false },
    { name: "admin-console", storage_backend: "r2",
      storage_rationale_documented: true,
      requires_strong_consistency: false, is_admin_surface: true,
      access_protected: true },
  ],
  deploy: { wrangler_workflows_used: true,
            tested_with_real_bindings_locally: true,
            deploys_from_git: true, versioned_deploys: true,
            rollback_path_tested: true,
            previous_versions_kept_deployable: true,
            staging_separated_from_prod: true },
  security: { secrets_only_in_platform_store: true,
              secrets_in_code_or_repo_present: false,
              secrets_in_logs_present: false,
              rate_limits_configured: true, waf_configured: true,
              input_validation_at_boundary: true,
              tls_https_disabled_present: false },
  reliability: { cpu_budget_respected: true,
                 cold_start_addressed: true,
                 error_capture_configured: true,
                 alerts_configured: true, staged_rules_used: true,
                 external_health_checks_configured: true },
  tunnels: { tunnels_present: true, origin_stays_loopback: true,
             access_policies_for_humans: true,
             service_tokens_for_machines: true,
             origin_exposed_publicly_present: false },
  quotas: { free_tier_limits_known: true, quota_alarms_set: true,
            monthly_log_driven_cost_review: true },
  dns_tls: { zones_documented: true, certs_automatic: true,
             cert_expiry_monitored: true,
             email_routing_consistent: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 29 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "EDGE_PLATFORM_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 38);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.components_count, 3);
  assert.deepEqual(v.components_without_storage_backend, []);
  assert.equal(v.storage_documentation_coverage, "1.000000");
  assert.deepEqual(v.components_on_kv_requiring_strong_consistency, []);
  assert.deepEqual(v.admin_components_without_access, []);
  assert.equal(v.access_protection_coverage, "1.000000");
});

test("test_storage_choices_not_documented_fails_platform_section", () => {
  const m = clone(COMPLETE) as any;
  m.platform_fit.storage_choices_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(v.sections["platform_fit_and_storage"], "fail");
});

test("test_component_without_backend_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.components[1].storage_backend = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(checkStatus(v, "every_component_names_storage_backend"), "fail");
  assert.deepEqual(v.components_without_storage_backend, ["config-cache"]);
  assert.equal(v.storage_documentation_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_component_missing_backend_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.components[0].storage_backend;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_component_names_storage_backend"), "missing");
});

test("test_component_without_rationale_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[2].storage_rationale_documented = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_component_documents_storage_rationale"), "fail");
  assert.equal(v.storage_documentation_coverage, "0.666667");
});

test("test_empty_components_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "components_declared"), "fail");
  assert.equal(v.components_count, 0);
  assert.equal(v.storage_documentation_coverage, null);
  assert.equal(v.access_protection_coverage, null);
});

test("test_strong_consistency_on_kv_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.components[1].requires_strong_consistency = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(checkStatus(v, "no_strong_consistency_component_on_kv"), "fail");
  assert.deepEqual(v.components_on_kv_requiring_strong_consistency, ["config-cache"]);
});

test("test_strong_consistency_missing_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.components[1].requires_strong_consistency;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_strong_consistency_component_on_kv"), "missing");
});

test("test_unversioned_deploys_fail_deploy_section", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.versioned_deploys = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(v.sections["deploy_and_versioning"], "fail");
});

test("test_rollback_not_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.rollback_path_tested = false;
  assert.equal(evaluate(m).verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_staging_not_separated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.staging_separated_from_prod = false;
  assert.equal(evaluate(m).verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_secrets_in_repo_fail_security_section", () => {
  const m = clone(COMPLETE) as any;
  m.security.secrets_in_code_or_repo_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(v.sections["security_and_access"], "fail");
  assert.equal(checkStatus(v, "no_secrets_in_code_or_repo"), "fail");
});

test("test_secrets_in_logs_fail", () => {
  const m = clone(COMPLETE) as any;
  m.security.secrets_in_logs_present = true;
  assert.equal(evaluate(m).verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_tls_disabled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.tls_https_disabled_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_tls_https_disabled"), "fail");
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_admin_component_without_access_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.components[2].access_protected = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(checkStatus(v, "every_admin_component_access_protected"), "fail");
  assert.deepEqual(v.admin_components_without_access, ["admin-console"]);
  assert.equal(v.access_protection_coverage, "0.000000");
});

test("test_admin_component_missing_access_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.components[2].access_protected;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_admin_component_access_protected"), "missing");
  assert.deepEqual(v.admin_components_without_access, []);
});

test("test_no_admin_components_passes_access_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.components[2].is_admin_surface = false;
  delete m.components[2].access_protected;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_SOUND");
  assert.equal(checkStatus(v, "every_admin_component_access_protected"), "pass");
  assert.equal(v.access_protection_coverage, null);
});

test("test_cpu_budget_not_respected_fails_reliability_section", () => {
  const m = clone(COMPLETE) as any;
  m.reliability.cpu_budget_respected = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(v.sections["reliability_and_observability"], "fail");
});

test("test_no_external_health_checks_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reliability.external_health_checks_configured = false;
  assert.equal(evaluate(m).verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_tunnel_origin_not_loopback_fails_tunnels_section", () => {
  const m = clone(COMPLETE) as any;
  m.tunnels.origin_stays_loopback = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
  assert.equal(v.sections["tunnels_quotas_and_hygiene"], "fail");
  assert.equal(checkStatus(v, "tunnel_origin_stays_loopback"), "fail");
});

test("test_public_origin_exposure_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tunnels.origin_exposed_publicly_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_public_origin_exposure"), "fail");
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_no_tunnels_passes_tunnel_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.tunnels = { tunnels_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "EDGE_PLATFORM_SOUND");
  assert.equal(checkStatus(v, "tunnel_origin_stays_loopback"), "pass");
  assert.equal(checkStatus(v, "no_public_origin_exposure"), "pass");
});

test("test_tunnels_missing_target_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tunnels.service_tokens_for_machines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "tunnel_service_tokens_for_machines"), "missing");
});

test("test_quota_alarms_not_set_fails", () => {
  const m = clone(COMPLETE) as any;
  m.quotas.quota_alarms_set = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "quota_alarms_set"), "fail");
  assert.equal(v.verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_cert_expiry_not_monitored_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dns_tls.cert_expiry_monitored = false;
  assert.equal(evaluate(m).verdict, "EDGE_PLATFORM_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.deploy;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["deploy_and_versioning"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.components_count, null);
  assert.equal(v.components_without_storage_backend, null);
  assert.equal(v.storage_documentation_coverage, null);
  assert.equal(v.components_on_kv_requiring_strong_consistency, null);
  assert.equal(v.admin_components_without_access, null);
  assert.equal(v.access_protection_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: EDGE_PLATFORM_SOUND"));
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
    () => evaluate({ deploy: "should-be-an-object" }),
    fieldError("deploy"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ components: { name: "api-worker" } }),
    fieldError("components"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ components: ["api-worker"] }),
    fieldError("components[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.versioned_deploys = "yes";
  assert.throws(() => evaluate(m), fieldError("deploy.versioned_deploys"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].storage_backend = 42;
  assert.throws(() => evaluate(m), fieldError("components[0].storage_backend"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.components[2].access_protected = "yes";
  assert.throws(() => evaluate(m), fieldError("components[2].access_protected"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.quotas = null;
  assert.throws(() => evaluate(m), fieldError("quotas"));
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
  .filter((f) => f.startsWith("edge-platform-engineering--") && f.endsWith(".json"))
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
