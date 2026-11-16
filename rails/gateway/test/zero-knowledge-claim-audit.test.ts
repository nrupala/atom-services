import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/zero-knowledge-claim-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  product: "example-vault",
  claims: { claim_basis: "cryptographic_guarantee" },
  access: { server_can_read_user_data: false },
  storage: { server_stores_only_opaque_bytes: true },
  encryption: {
    encryption_happens_on_client_device: true,
    plaintext_exists_only_on_client_device: true,
    authenticated_encryption: true,
    relies_on_tls_alone: false,
  },
  keys: {
    keys_never_leave_device: true,
    key_derivation_client_side: true,
    key_journey_documented: true,
    key_backup_uploads_key_to_server: false,
  },
  trust: {
    key_escrow: false,
    recovery_backdoor: false,
    admin_plaintext_view: false,
    trusted_components: ["client", "operating_system", "distribution_channel"],
    trusted_third_parties_in_data_path: [],
  },
  recovery: {
    password_reset_recovers_data: false,
    no_recovery_possible_claimed: true,
  },
  scope: {
    plaintext_locations_documented: true,
    plaintext_in_logs: false,
    plaintext_in_crash_dumps: false,
    plaintext_in_thumbnails_or_previews: false,
    metadata_leakage_acknowledged: true,
    residual_risks_documented: true,
  },
  theater: {
    client_type: "locally_installed_client",
    web_app_trust_distinction_acknowledged: false,
    search_or_indexing_requires_server_plaintext_or_tokens: false,
    threat_model_includes_malicious_operator: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 23 Python VerdictTests, ported ----

test("test_sound_manifest_is_claims_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "CLAIMS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 27);
});

test("test_server_can_read_user_data_fails_core_test", () => {
  const m = clone(SOUND) as any;
  m.access.server_can_read_user_data = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["core_test"], "fail");
});

test("test_policy_promise_basis_fails_core_test", () => {
  const m = clone(SOUND) as any;
  m.claims.claim_basis = "policy_promise";
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["core_test"], "fail");
});

test("test_server_side_encryption_fails_client_side_section", () => {
  const m = clone(SOUND) as any;
  m.encryption.encryption_happens_on_client_device = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["client_side_encryption"], "fail");
});

test("test_unauthenticated_encryption_fails", () => {
  const m = clone(SOUND) as any;
  m.encryption.authenticated_encryption = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["client_side_encryption"], "fail");
});

test("test_tls_alone_fails", () => {
  const m = clone(SOUND) as any;
  m.encryption.relies_on_tls_alone = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
});

test("test_keys_leaving_device_fails_key_journey", () => {
  const m = clone(SOUND) as any;
  m.keys.keys_never_leave_device = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["key_journey"], "fail");
});

test("test_key_backup_to_server_fails_key_journey", () => {
  const m = clone(SOUND) as any;
  m.keys.key_backup_uploads_key_to_server = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["key_journey"], "fail");
});

test("test_key_escrow_fails_trusted_parties", () => {
  const m = clone(SOUND) as any;
  m.trust.key_escrow = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["trusted_parties_and_recovery"], "fail");
});

test("test_admin_plaintext_view_fails_trusted_parties", () => {
  const m = clone(SOUND) as any;
  m.trust.admin_plaintext_view = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["trusted_parties_and_recovery"], "fail");
});

test("test_trusted_components_missing_os_fails", () => {
  const m = clone(SOUND) as any;
  m.trust.trusted_components = ["client", "distribution_channel"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["trusted_parties_and_recovery"], "fail");
});

test("test_contradictory_recovery_claims_fail", () => {
  const m = clone(SOUND) as any;
  m.recovery.password_reset_recovers_data = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["trusted_parties_and_recovery"], "fail");
});

test("test_plaintext_in_logs_fails_scope", () => {
  const m = clone(SOUND) as any;
  m.scope.plaintext_in_logs = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["plaintext_and_metadata_scope"], "fail");
});

test("test_metadata_leakage_unacknowledged_fails_scope", () => {
  const m = clone(SOUND) as any;
  m.scope.metadata_leakage_acknowledged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["plaintext_and_metadata_scope"], "fail");
});

test("test_web_app_without_distinction_fails_theater", () => {
  const m = clone(SOUND) as any;
  m.theater.client_type = "web_app_served_by_same_server";
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["theater_and_threat_model"], "fail");
});

test("test_web_app_with_distinction_still_sound", () => {
  const m = clone(SOUND) as any;
  m.theater.client_type = "web_app_served_by_same_server";
  m.theater.web_app_trust_distinction_acknowledged = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_SOUND");
});

test("test_search_requiring_server_tokens_fails_theater", () => {
  const m = clone(SOUND) as any;
  m.theater.search_or_indexing_requires_server_plaintext_or_tokens = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["theater_and_threat_model"], "fail");
});

test("test_threat_model_excluding_malicious_operator_fails", () => {
  const m = clone(SOUND) as any;
  m.theater.threat_model_includes_malicious_operator = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["theater_and_threat_model"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.keys;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["key_journey"], "insufficient_evidence");
});

test("test_partial_recovery_evidence_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.recovery.no_recovery_possible_claimed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["trusted_parties_and_recovery"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(Object.values(v.sections).every((s) => s === "insufficient_evidence"));
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(SOUND));
  assert.ok(stamp(v).includes("VERDICT: CLAIMS_SOUND"));
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
    () => evaluate({ product: "MalformedAudit", claims: { claim_basis: 12345 }, access: "not_an_object" }),
    fieldError("claims.claim_basis"),
  );
});

test("malformed: claim basis as number rejected", () => {
  assert.throws(
    () => evaluate({ claims: { claim_basis: 12345 } }),
    fieldError("claims.claim_basis"),
  );
});

test("malformed: access as string rejected", () => {
  assert.throws(
    () => evaluate({ access: "not_an_object" }),
    fieldError("access"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.keys.keys_never_leave_device = "yes";
  assert.throws(() => evaluate(m), fieldError("keys.keys_never_leave_device"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.trust.trusted_components = "client";
  assert.throws(() => evaluate(m), fieldError("trust.trusted_components"));
});

test("malformed: list entry as number rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.trust.trusted_components = ["client", 42];
  assert.throws(() => evaluate(m), fieldError("trust.trusted_components[1]"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.scope = null;
  assert.throws(() => evaluate(m), fieldError("scope"));
});

// ---- Golden-fixture parity against the Python oracle (own prefix only) ----

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
  .filter((f) => f.startsWith("zero-knowledge-claim-audit--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
