import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/confidential-computing-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CONFIDENTIAL_COMPUTING_DESIGN_READY manifest, copied from
// the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Enclave Design",
  threat_model: {
    documented: true,
    protects_against: ["host_access", "operator_access",
                       "co_tenant_access"],
    does_not_protect_against: ["side_channels", "supply_chain",
                                "flawed_enclave_code",
                                "unsealed_inputs_outputs"],
    claims_require_threat_model: true,
  },
  technology: {
    name: "AMD SEV-SNP",
    distinctions_considered: true,
    chosen_by_workload_shape: true,
    chosen_by_available_hardware: true,
  },
  attestation: {
    verification_implemented: true,
    verification_tested: true,
    measurement_verified: true,
    fresh_nonce_verified: true,
    verified_before_trusting: true,
  },
  enclave: {
    sealed_keys_bound_to_identity_or_measurement: true,
    attested_tls_used: true,
    surface_area_minimized: true,
    trusted_components: [
      { name: "loader", trusted_lines: 1200 },
      { name: "crypto", trusted_lines: 3400 },
      { name: "api", trusted_lines: 800 },
    ],
    declared_trusted_codebase_lines: 5400,
    debug_enabled_in_production: false,
  },
  engineering: {
    reproducible_builds: true,
    signed_enclave_images: true,
    measurements_versioned_and_pinned: true,
    real_attestation_in_ci_or_staging: true,
    fallback_documented: true,
    silent_downgrade_used: false,
  },
  keys: {
    sealed_keys_tested_including_recovery: true,
    root_keys_stored_unsealed_beside_enclave: false,
    rotation_designed: true,
    recovery_designed: true,
    measurement_changes_invalidating_seals_documented: true,
  },
  claims: {
    claims_match_evidence: true,
    marketing_mechanism_audit_done: true,
    public_exclusions: ["side_channels", "supply_chain",
                        "flawed_enclave_code",
                        "unsealed_inputs_outputs"],
    unverifiable_secure_enclave_claims_made: false,
    regulatory_compliance_paired_where_required: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 35);
  assert.equal(v.components_evaluated, 3);
  assert.equal(v.computed_trusted_codebase_lines, "5400.000000");
  assert.equal(v.trusted_codebase_difference, "0.000000");
  assert.deepEqual(v.threat_protects_not_covered, []);
  assert.deepEqual(v.threat_exclusions_not_covered, []);
  assert.deepEqual(v.claims_exclusions_not_listed, []);
});

test("test_trusted_codebase_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components = [{ name: "core", trusted_lines: 250.5 }];
  m.enclave.declared_trusted_codebase_lines = 250.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_READY");
  assert.equal(v.computed_trusted_codebase_lines, "250.500000");
});

test("test_trusted_codebase_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.declared_trusted_codebase_lines = 5000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["enclave_patterns"], "fail");
  assert.equal(
    checkStatus(v, "trusted_codebase_total_matches_component_sum"),
    "fail");
  assert.equal(v.trusted_codebase_difference, "-400.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_components_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.enclave.trusted_components;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "trusted_codebase_total_matches_component_sum"),
    "missing");
  assert.equal(v.components_evaluated, 0);
  assert.equal(v.computed_trusted_codebase_lines, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_components_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "trusted_component_entries_complete"), "missing");
});

test("test_incomplete_component_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.enclave.trusted_components[1].trusted_lines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "trusted_component_entries_complete"), "missing");
  assert.equal(v.components_evaluated, 2);
  assert.equal(v.computed_trusted_codebase_lines, null);
});

test("test_missing_declared_total_is_missing_but_sum_computed", () => {
  const m = clone(COMPLETE) as any;
  delete m.enclave.declared_trusted_codebase_lines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "trusted_codebase_total_matches_component_sum"),
    "missing");
  assert.equal(v.computed_trusted_codebase_lines, "5400.000000");
  assert.equal(v.trusted_codebase_difference, null);
});

test("test_protects_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.protects_against =
    m.threat_model.protects_against.filter(
      (c: string) => c !== "co_tenant_access");
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.deepEqual(v.threat_protects_not_covered, ["co_tenant_access"]);
  assert.equal(
    checkStatus(v, "threat_protects_against_covers_stated"), "fail");
});

test("test_protects_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.protects_against = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.deepEqual(v.threat_protects_not_covered,
    ["host_access", "operator_access", "co_tenant_access"]);
});

test("test_protects_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.protects_against = ["malware", "insiders"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.threat_protects_not_covered?.length, 3);
});

test("test_missing_protects_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.threat_model.protects_against;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.threat_protects_not_covered, null);
});

test("test_exclusions_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.does_not_protect_against =
    m.threat_model.does_not_protect_against.filter(
      (c: string) => c !== "supply_chain");
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.deepEqual(v.threat_exclusions_not_covered, ["supply_chain"]);
  assert.equal(v.sections["threat_model"], "fail");
});

test("test_threat_model_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["threat_model"], "fail");
});

test("test_technology_not_named_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technology.name = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(checkStatus(v, "technology_named"), "fail");
  assert.equal(v.sections["technology_selection"], "fail");
});

test("test_missing_technology_name_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.technology.name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "technology_named"), "missing");
});

test("test_unlisted_technology_name_still_passes", () => {
  const m = clone(COMPLETE) as any;
  m.technology.name = "Some Future TEE";
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_READY");
});

test("test_distinctions_not_considered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technology.distinctions_considered = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_fresh_nonce_not_verified_fails", () => {
  const m = clone(COMPLETE) as any;
  m.attestation.fresh_nonce_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["attestation"], "fail");
  assert.equal(checkStatus(v, "fresh_nonce_verified"), "fail");
});

test("test_attestation_not_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.attestation.verification_tested = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_production_debug_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.debug_enabled_in_production = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["enclave_patterns"], "fail");
  assert.equal(checkStatus(v, "production_debug_disabled"), "fail");
});

test("test_sealed_keys_not_bound_fails", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.sealed_keys_bound_to_identity_or_measurement = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_silent_downgrade_fails", () => {
  const m = clone(COMPLETE) as any;
  m.engineering.silent_downgrade_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["engineering_discipline"], "fail");
});

test("test_unsigned_images_fail", () => {
  const m = clone(COMPLETE) as any;
  m.engineering.signed_enclave_images = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_root_keys_unsealed_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.keys.root_keys_stored_unsealed_beside_enclave = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["key_management"], "fail");
  assert.equal(
    checkStatus(v, "root_keys_never_stored_unsealed"), "fail");
});

test("test_sealed_keys_not_tested_with_recovery_fails", () => {
  const m = clone(COMPLETE) as any;
  m.keys.sealed_keys_tested_including_recovery = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_public_exclusions_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims.public_exclusions = m.claims.public_exclusions.filter(
    (c: string) => c !== "side_channels");
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.deepEqual(v.claims_exclusions_not_listed, ["side_channels"]);
  assert.equal(
    checkStatus(v, "public_exclusions_cover_stated_exclusions"),
    "fail");
});

test("test_public_exclusions_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.claims.public_exclusions = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.claims_exclusions_not_listed?.length, 4);
});

test("test_missing_public_exclusions_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.claims.public_exclusions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.claims_exclusions_not_listed, null);
});

test("test_unverifiable_claims_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.claims.unverifiable_secure_enclave_claims_made = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
  assert.equal(v.sections["claims_discipline"], "fail");
});

test("test_claims_not_matching_evidence_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims.claims_match_evidence = false;
  assert.equal(evaluate(m).verdict,
    "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.attestation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["attestation"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.components_evaluated, 0);
  assert.equal(v.computed_trusted_codebase_lines, null);
  assert.equal(v.threat_protects_not_covered, null);
  assert.equal(v.threat_exclusions_not_covered, null);
  assert.equal(v.claims_exclusions_not_listed, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes(
    "VERDICT: CONFIDENTIAL_COMPUTING_DESIGN_READY"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ threat_model: "should-be-an-object" }),
    fieldError("threat_model"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.threat_model.protects_against = "host_access";
  assert.throws(
    () => evaluate(m), fieldError("threat_model.protects_against"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claims.public_exclusions = ["side_channels", 42];
  assert.throws(
    () => evaluate(m), fieldError("claims.public_exclusions[1]"));
});

test("malformed: components list as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components = { name: "loader" };
  assert.throws(
    () => evaluate(m), fieldError("enclave.trusted_components"));
});

test("malformed: component entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components[0] = "loader";
  assert.throws(
    () => evaluate(m), fieldError("enclave.trusted_components[0]"));
});

test("malformed: component numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components[2].trusted_lines = "800";
  assert.throws(
    () => evaluate(m),
    fieldError("enclave.trusted_components[2].trusted_lines"));
});

test("malformed: component name as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components[0].name = 1;
  assert.throws(
    () => evaluate(m),
    fieldError("enclave.trusted_components[0].name"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.attestation.fresh_nonce_verified = "yes";
  assert.throws(
    () => evaluate(m), fieldError("attestation.fresh_nonce_verified"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.declared_trusted_codebase_lines = "5400";
  assert.throws(
    () => evaluate(m),
    fieldError("enclave.declared_trusted_codebase_lines"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.enclave.trusted_components[0].trusted_lines = true;
  assert.throws(
    () => evaluate(m),
    fieldError("enclave.trusted_components[0].trusted_lines"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.keys = null;
  assert.throws(() => evaluate(m), fieldError("keys"));
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
  .filter((f) => f.startsWith("confidential-computing-design--") && f.endsWith(".json"))
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
