import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/zero-trust-architecture-design-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  design_title: "payments-zero-trust-design",
  identity: { identity_first_design_declared: true,
              user_identities_declared: true,
              workload_identities_declared: true,
              short_lived_credentials_declared: true,
              credentials_scoped_declared: true,
              credentials_rotated_declared: true,
              no_implicit_network_trust_declared: true,
              every_hop_authenticated_and_authorized_declared: true,
              policy_layer_decides_access_declared: true },
  assets: [
    { asset_id: "asset-1", asset_name: "Payments API", asset_kind: "service" },
    { asset_id: "asset-2", asset_name: "Payments worker", asset_kind: "workload" },
    { asset_id: "asset-3", asset_name: "Payments store", asset_kind: "data_store" },
  ],
  policies: [
    { policy_id: "pol-1", policy_name: "API access policy",
      covered_asset_ids: ["asset-1", "asset-2"] },
    { policy_id: "pol-2", policy_name: "Store access policy",
      covered_asset_ids: ["asset-3"] },
  ],
  segmentation: { segmentation_declared: true,
                  blast_radius_boundaries_declared: true,
                  egress_restricted_declared: true,
                  egress_monitored_declared: true,
                  deny_by_default_declared: true,
                  least_privilege_declared: true },
  trust: { device_posture_checks_declared: true,
           device_inventory_declared: true,
           server_posture_checks_declared: true,
           workload_attestation_declared: true,
           node_trust_requires_attestation_declared: true,
           encryption_in_transit_declared: true,
           encryption_at_rest_declared: true,
           end_to_end_encryption_demanded: true,
           end_to_end_encryption_declared: true },
  monitoring: { audit_logging_declared: true,
                privileged_actions_logged_immutably_declared: true,
                anomaly_alerting_declared: true,
                audit_trail_survives_component_declared: true,
                egress_changes_audited_declared: true,
                privilege_changes_audited_declared: true,
                incident_response_path_declared: true,
                break_glass_documented_declared: true,
                break_glass_ceremony_gated_declared: true,
                break_glass_tested_declared: true },
  migration: { migration_phases_declared: true,
               rollout_order_declared: true,
               legacy_implicit_trust_removal_declared: true,
               rollback_path_declared: true,
               per_hop_verification_during_rollout_declared: true,
               permissions_review_and_revocation_declared: true },
  red_lines: { internal_network_trusted_present: false,
               shared_credentials_present: false,
               long_lived_wide_scope_secrets_present: false,
               unrevocable_access_present: false,
               anonymous_east_west_access_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "ZERO_TRUST_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 54);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.zero_trust_design_assets_count, 3);
  assert.equal(v.zero_trust_design_policies_count, 2);
  assert.deepEqual(v.duplicate_zero_trust_design_asset_ids, []);
  assert.equal(v.zero_trust_design_policy_coverage_ratio, "1.000000");
});

test("test_identity_first_not_declared_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.identity.identity_first_design_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ZERO_TRUST_DESIGN_NOT_SOUND");
  assert.equal(v.sections["identity_and_perimeter_framing"], "fail");
  assert.equal(checkStatus(v, "zero_trust_design_identity_first_design_declared"), "fail");
});

test("test_duplicate_asset_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.assets[1].asset_id = "asset-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zero_trust_design_asset_id_unique"), "fail");
  assert.deepEqual(v.duplicate_zero_trust_design_asset_ids, ["asset-1"]);
});

test("test_empty_assets_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assets = [];
  assert.equal(checkStatus(evaluate(m), "zero_trust_design_assets_list_declared"), "fail");
});

test("test_absent_assets_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.assets;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zero_trust_design_assets_list_declared"), "missing");
  assert.equal(v.zero_trust_design_assets_count, null);
  assert.equal(v.computed_status, null);
});

test("test_invalid_asset_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assets[0].asset_kind = "laptop-thing";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zero_trust_design_asset_kind_recognised"), "fail");
  assert.deepEqual(v.zero_trust_design_assets_with_invalid_kind, ["asset-1"]);
});

test("test_uncovered_asset_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.policies[1].covered_asset_ids = ["asset-1"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zero_trust_design_declared_asset_covered_by_policy"), "fail");
  assert.deepEqual(v.zero_trust_design_assets_without_policy_coverage, ["asset-3"]);
  assert.equal(v.zero_trust_design_policy_coverage_ratio, "0.666667");
});

test("test_policy_ref_to_undeclared_asset_fails", () => {
  const m = clone(COMPLETE) as any;
  m.policies[0].covered_asset_ids = ["asset-1", "asset-99"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zero_trust_design_policy_coverage_reference_resolves"), "fail");
  assert.deepEqual(v.zero_trust_design_policy_refs_not_declared_as_assets, ["asset-99"]);
});

test("test_policy_without_coverage_fails", () => {
  const m = clone(COMPLETE) as any;
  m.policies[1].covered_asset_ids = [];
  m.policies[0].covered_asset_ids = ["asset-1", "asset-2", "asset-3"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zero_trust_design_policy_covers_at_least_one_asset"), "fail");
  assert.deepEqual(v.zero_trust_design_policies_without_coverage, ["pol-2"]);
});

test("test_e2e_demanded_without_declaration_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.trust.end_to_end_encryption_declared = false;
  assert.equal(checkStatus(evaluate(m), "zero_trust_design_end_to_end_encryption_declared_where_demanded"), "fail");
});

test("test_e2e_not_demanded_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.trust.end_to_end_encryption_demanded = false;
  m.trust.end_to_end_encryption_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "zero_trust_design_end_to_end_encryption_declared_where_demanded"), "pass");
  assert.equal(v.verdict, "ZERO_TRUST_DESIGN_SOUND");
});

test("test_break_glass_untested_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.monitoring.break_glass_tested_declared = false;
  assert.equal(evaluate(m).sections["monitoring_audit_and_response"], "fail");
});

test("test_legacy_trust_removal_missing_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.migration.legacy_implicit_trust_removal_declared = false;
  assert.equal(evaluate(m).sections["migration_and_rollout"], "fail");
});

test("test_internal_network_trusted_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.internal_network_trusted_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "ZERO_TRUST_DESIGN_NOT_SOUND");
});

test("test_shared_credentials_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.shared_credentials_present = true;
  assert.equal(checkStatus(evaluate(m), "zero_trust_design_free_of_shared_credentials"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.monitoring;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["monitoring_audit_and_response"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.zero_trust_design_assets_count, null);
  assert.equal(v.zero_trust_design_policy_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ZERO_TRUST_DESIGN_SOUND"));
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
  m.design_title = 12345;
  assert.throws(() => evaluate(m), fieldError("design_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ identity: "should-be-an-object" }), fieldError("identity"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ assets: { asset_id: "asset-1" } }), fieldError("assets"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ policies: ["pol-1"] }), fieldError("policies[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.identity.identity_first_design_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("identity.identity_first_design_declared"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.policies[0].covered_asset_ids = [42];
  assert.throws(() => evaluate(m), fieldError("policies[0].covered_asset_ids[0]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.migration = null;
  assert.throws(() => evaluate(m), fieldError("migration"));
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
  .filter((f) => f.startsWith("zero-trust-architecture-design-pack--") && f.endsWith(".json"))
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
