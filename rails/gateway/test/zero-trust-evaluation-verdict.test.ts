import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/zero-trust-evaluation-verdict.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CLAIM_SUSTAINED manifest, copied from the Python VerdictTests oracle.
const SUSTAINED: Record<string, unknown> = {
  system: "home-office vault + storage",
  evaluation: { claim_stated: true,
                adversaries_named: true,
                out_of_scope_named: true,
                not_certification_acknowledged: true },
  gauntlet: { authentication_point_identified: true,
              session_trusted_indefinitely: false,
              master_secret_leaves_client: false,
              server_sees_only_encrypted_data: true,
              server_breach_exposes_user_data: false },
  identity: { checked_before_access: true,
              proof_method_named: true },
  cryptography: { password_kdf: "argon2id",
                  minimum_secret_length_chars: 16,
                  claims_nist_alignment: true,
                  nist_controls_named: true },
  findings: { least_privilege_evaluated: true,
              credential_exceeds_job: false,
              blast_radius_bounded: true,
              flat_network: false,
              trust_rechecked_after_login: true },
  inventory: { trusted_components_inventoried: true,
               backdoors_present: true,
               backdoors_named: true,
               convenience_decisions_surfaced: true,
               internal_network_trusted: false },
  limits: { compromised_endpoint_limit_acknowledged: true,
            usability_tradeoff_stated: true,
            design_claims_only_acknowledged: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 26 Python VerdictTests, ported ----

test("test_sustained_manifest_is_claim_sustained", () => {
  const v = evaluate(clone(SUSTAINED));
  assert.equal(v.verdict, "CLAIM_SUSTAINED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.claim_status, "sustained_on_declared_evidence");
  assert.equal(v.checks.length, 26);
});

test("test_secret_length_margin_serialized_at_fixed_4dp", () => {
  const v = evaluate(clone(SUSTAINED));
  assert.equal(v.secret_length_margin_chars, "0.0000");
  const m = clone(SUSTAINED) as any;
  m.cryptography.minimum_secret_length_chars = 20;
  assert.equal(evaluate(m).secret_length_margin_chars, "4.0000");
});

test("test_secret_length_below_stated_minimum_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.cryptography.minimum_secret_length_chars = 12;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["identity_and_authenticator_strength"], "fail");
  assert.equal(v.claim_status, "not_sustained_on_declared_evidence");
  assert.equal(v.secret_length_margin_chars, "-4.0000");
});

test("test_secret_length_exactly_at_minimum_passes", () => {
  const m = clone(SUSTAINED) as any;
  m.cryptography.minimum_secret_length_chars = 16;
  assert.equal(evaluate(m).verdict, "CLAIM_SUSTAINED");
});

test("test_non_argon2id_kdf_fails", () => {
  for (const kdf of ["pbkdf2", "sha256", "bcrypt"]) {
    const m = clone(SUSTAINED) as any;
    m.cryptography.password_kdf = kdf;
    const v = evaluate(m);
    assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED", kdf);
    assert.equal(v.claim_status, "not_sustained_on_declared_evidence", kdf);
  }
});

test("test_missing_kdf_is_missing_not_failed", () => {
  const m = clone(SUSTAINED) as any;
  delete m.cryptography.password_kdf;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.claim_status, null);
});

test("test_non_numeric_secret_length_is_missing", () => {
  // F1 correction (coordinator ruling, 2026-11-15): this ported
  // test previously asserted an INSUFFICIENT_EVIDENCE verdict over
  // a wrong-typed documented field — that assertion encoded the
  // F1 defect itself. A non-numeric minimum_secret_length_chars is
  // invalid input and is now rejected with FieldTypeError naming
  // the field.
  const m = clone(SUSTAINED) as any;
  m.cryptography.minimum_secret_length_chars = "sixteen";
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError &&
      err.field === "cryptography.minimum_secret_length_chars",
  );
});

test("test_session_trusted_indefinitely_fails_gauntlet", () => {
  const m = clone(SUSTAINED) as any;
  m.gauntlet.session_trusted_indefinitely = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["authentication_and_server_trust"], "fail");
});

test("test_master_secret_leaving_client_fails_red_line", () => {
  const m = clone(SUSTAINED) as any;
  m.gauntlet.master_secret_leaves_client = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["authentication_and_server_trust"], "fail");
});

test("test_server_breach_exposing_data_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.gauntlet.server_breach_exposes_user_data = true;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_server_seeing_plaintext_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.gauntlet.server_sees_only_encrypted_data = false;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_claim_not_stated_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.evaluation.claim_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["claim_and_scope"], "fail");
});

test("test_adversaries_not_named_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.evaluation.adversaries_named = false;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_unnamed_backdoor_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.inventory.backdoors_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["trust_inventory"], "fail");
});

test("test_no_backdoor_passes_naming_as_not_applicable", () => {
  const m = clone(SUSTAINED) as any;
  m.inventory.backdoors_present = false;
  delete m.inventory.backdoors_named;
  assert.equal(evaluate(m).verdict, "CLAIM_SUSTAINED");
});

test("test_nist_claim_without_controls_named_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.cryptography.nist_controls_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["identity_and_authenticator_strength"], "fail");
});

test("test_no_nist_claim_passes_controls_as_not_applicable", () => {
  const m = clone(SUSTAINED) as any;
  m.cryptography.claims_nist_alignment = false;
  delete m.cryptography.nist_controls_named;
  assert.equal(evaluate(m).verdict, "CLAIM_SUSTAINED");
});

test("test_credential_exceeding_job_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.findings.credential_exceeds_job = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["privilege_segmentation_and_verification"], "fail");
});

test("test_flat_network_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.findings.flat_network = true;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_internal_network_trusted_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.inventory.internal_network_trusted = true;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_trust_not_rechecked_after_login_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.findings.trust_rechecked_after_login = false;
  assert.equal(evaluate(m).verdict, "CLAIM_NOT_SUSTAINED");
});

test("test_compromised_endpoint_limit_not_acknowledged_fails", () => {
  const m = clone(SUSTAINED) as any;
  m.limits.compromised_endpoint_limit_acknowledged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIM_NOT_SUSTAINED");
  assert.equal(v.sections["honest_limits"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SUSTAINED) as any;
  delete m.limits;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["honest_limits"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.claim_status, null);
  assert.equal(v.secret_length_margin_chars, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SUSTAINED))).includes("VERDICT: CLAIM_SUSTAINED"));
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
    () => evaluate({ system: "malformed-test", evaluation: "not-an-object" }),
    fieldError("evaluation"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ gauntlet: "not-an-object" }),
    fieldError("gauntlet"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SUSTAINED) as Record<string, any>;
  m.limits.usability_tradeoff_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("limits.usability_tradeoff_stated"));
});

test("malformed: kdf as number rejected", () => {
  const m = structuredClone(SUSTAINED) as Record<string, any>;
  m.cryptography.password_kdf = 42;
  assert.throws(() => evaluate(m), fieldError("cryptography.password_kdf"));
});

test("malformed: secret length as string rejected", () => {
  const m = structuredClone(SUSTAINED) as Record<string, any>;
  m.cryptography.minimum_secret_length_chars = "sixteen";
  assert.throws(() => evaluate(m), fieldError("cryptography.minimum_secret_length_chars"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SUSTAINED) as Record<string, any>;
  m.inventory = null;
  assert.throws(() => evaluate(m), fieldError("inventory"));
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
  .filter((f) => f.startsWith("zero-trust-evaluation-verdict--") && f.endsWith(".json"))
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
