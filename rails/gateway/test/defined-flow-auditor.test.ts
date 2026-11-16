import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/defined-flow-auditor.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DEFINED manifest, copied from the Python VerdictTests oracle.
const DEFINED: Record<string, unknown> = {
  system: "vault-service",
  auth: { every_request_authenticated: true,
          every_request_authorized: true,
          internal_traffic_trusted: false },
  identity: { access_follows_identity: true, checked_before_access: true,
              proof_method_named: true },
  privilege: { minimum_access: true, access_expires: true,
               credential_exceeds_job: false },
  segmentation: { components_segmented: true, blast_radius_bounded: true,
                  flat_network: false },
  verification: { sessions_expire: true, tokens_rotate: true,
                  anomalies_retrigger_auth: true },
  gauntlet: { server_holds_plaintext_or_keys: false,
              server_breach_exposes_user_data: false,
              trusted_components_inventoried: true,
              convenience_decisions_surfaced: true,
              backdoors_present: true, backdoors_named: true },
  scope: { adversaries_named: true, out_of_scope_named: true,
           compromised_endpoint_limit_acknowledged: true,
           claims_nist_alignment: true, nist_controls_named: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 18 Python VerdictTests, ported ----

test("test_defined_manifest_is_defined", () => {
  const v = evaluate(clone(DEFINED));
  assert.equal(v.verdict, "DEFINED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
});

test("test_internal_traffic_trusted_breaks_the_claim", () => {
  const m = clone(DEFINED) as any;
  m.auth.internal_traffic_trusted = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["never_trust_always_verify"], "fail");
});

test("test_unauthenticated_requests_fail", () => {
  const m = clone(DEFINED) as any;
  m.auth.every_request_authenticated = false;
  assert.equal(evaluate(m).verdict, "NOT_DEFINED");
});

test("test_overprivileged_credential_fails_least_privilege", () => {
  const m = clone(DEFINED) as any;
  m.privilege.credential_exceeds_job = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["least_privilege"], "fail");
});

test("test_non_expiring_access_fails", () => {
  const m = clone(DEFINED) as any;
  m.privilege.access_expires = false;
  assert.equal(evaluate(m).verdict, "NOT_DEFINED");
});

test("test_flat_network_fails_segmentation", () => {
  const m = clone(DEFINED) as any;
  m.segmentation.flat_network = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["micro_segmentation"], "fail");
});

test("test_sessions_that_never_expire_fail_continuous_verification", () => {
  const m = clone(DEFINED) as any;
  m.verification.sessions_expire = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["continuous_verification"], "fail");
});

test("test_server_holding_plaintext_fails_the_gauntlet", () => {
  const m = clone(DEFINED) as any;
  m.gauntlet.server_holds_plaintext_or_keys = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["claim_gauntlet"], "fail");
});

test("test_server_breach_exposing_data_fails_the_gauntlet", () => {
  const m = clone(DEFINED) as any;
  m.gauntlet.server_breach_exposes_user_data = true;
  assert.equal(evaluate(m).verdict, "NOT_DEFINED");
});

test("test_unnamed_backdoor_fails", () => {
  const m = clone(DEFINED) as any;
  m.gauntlet.backdoors_named = false;
  assert.equal(evaluate(m).verdict, "NOT_DEFINED");
});

test("test_no_backdoor_passes_as_not_applicable", () => {
  const m = clone(DEFINED) as any;
  m.gauntlet.backdoors_present = false;
  delete m.gauntlet.backdoors_named;
  assert.equal(evaluate(m).verdict, "DEFINED");
});

test("test_nist_claim_without_named_controls_fails", () => {
  const m = clone(DEFINED) as any;
  m.scope.nist_controls_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEFINED");
  assert.equal(v.sections["scope_and_limits"], "fail");
});

test("test_no_nist_claim_passes_controls_check_as_not_applicable", () => {
  const m = clone(DEFINED) as any;
  m.scope.claims_nist_alignment = false;
  delete m.scope.nist_controls_named;
  assert.equal(evaluate(m).verdict, "DEFINED");
});

test("test_unnamed_adversaries_fail_scope", () => {
  const m = clone(DEFINED) as any;
  m.scope.adversaries_named = false;
  assert.equal(evaluate(m).verdict, "NOT_DEFINED");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(DEFINED) as any;
  delete m.verification;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["continuous_verification"],
               "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(DEFINED))).includes("VERDICT: DEFINED"));
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
    () => evaluate({ system: "malformed-test", auth: { every_request_authenticated: "YES_PLEASE" } }),
    fieldError("auth.every_request_authenticated"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ auth: "not-an-object" }),
    fieldError("auth"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(DEFINED) as any;
  m.auth.every_request_authenticated = "YES_PLEASE";
  assert.throws(() => evaluate(m), fieldError("auth.every_request_authenticated"));
});

test("malformed: nested boolean leaf as string rejected", () => {
  const m = clone(DEFINED) as any;
  m.gauntlet.backdoors_named = "yes";
  assert.throws(() => evaluate(m), fieldError("gauntlet.backdoors_named"));
});

test("malformed: system as number rejected", () => {
  assert.throws(
    () => evaluate({ system: 42 }),
    fieldError("system"),
  );
});

test("malformed: null field rejected", () => {
  const m = clone(DEFINED) as any;
  m.scope = null;
  assert.throws(() => evaluate(m), fieldError("scope"));
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
  .filter((f) => f.startsWith("defined-flow-auditor--") && f.endsWith(".json"))
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
