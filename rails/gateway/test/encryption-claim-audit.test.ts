import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/encryption-claim-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  product: "example-vault",
  claims: {
    algorithm: "AES",
    mode: "GCM",
    key_length_bits: 256,
    end_to_end_encrypted: true,
    zero_knowledge: true,
    vague_marketing_terms_used: false,
  },
  construction: {
    authenticated_encryption: true,
    custom_crypto: false,
    nonce_unique_per_key: true,
  },
  asymmetric: { applies: true, key_exchange: "X25519", signatures: "Ed25519" },
  key_management: {
    keys_from_csprng: true,
    keys_hardcoded: false,
    storage: "platform_keystore",
    rotation_planned: true,
    recovery_story_documented: true,
  },
  password_derivation: {
    applies: true,
    kdf: "Argon2id",
    salt_unique_random_per_key: true,
    password_used_directly_as_key: false,
  },
  randomness: { source: "os_csprng" },
  coverage: {
    transport: { tls_version: "1.3", plaintext_fallback: false },
    at_rest: { encrypted: true, key_stored_with_data: false },
    in_use: { plaintext_logged: false, plaintext_in_crash_dumps: false },
    fails_closed_on_crypto_error: true,
  },
  access: {
    server_can_read_plaintext: false,
    server_holds_decryption_keys: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 16 Python VerdictTests, ported ----

test("test_sound_manifest_is_claims_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "CLAIMS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
});

test("test_ecb_mode_fails_standard_construction", () => {
  const m = clone(SOUND) as any;
  m.claims.mode = "ECB";
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["standard_construction"], "fail");
});

test("test_unauthenticated_encryption_fails", () => {
  const m = clone(SOUND) as any;
  m.construction.authenticated_encryption = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["standard_construction"], "fail");
});

test("test_nonce_reuse_fails", () => {
  const m = clone(SOUND) as any;
  m.construction.nonce_unique_per_key = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
});

test("test_hardcoded_keys_fail_key_management", () => {
  const m = clone(SOUND) as any;
  m.key_management.keys_hardcoded = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["key_management"], "fail");
});

test("test_raw_sha256_kdf_fails_derivation", () => {
  const m = clone(SOUND) as any;
  m.password_derivation.kdf = "SHA-256";
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["derivation_and_randomness"], "fail");
});

test("test_tls_below_1_2_fails_coverage", () => {
  const m = clone(SOUND) as any;
  m.coverage.transport.tls_version = "1.1";
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["coverage"], "fail");
});

test("test_key_stored_with_data_fails_coverage", () => {
  const m = clone(SOUND) as any;
  m.coverage.at_rest.key_stored_with_data = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["coverage"], "fail");
});

test("test_end_to_end_claim_with_server_plaintext_access_fails", () => {
  const m = clone(SOUND) as any;
  m.access.server_can_read_plaintext = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["claim_consistency"], "fail");
});

test("test_zero_knowledge_claim_with_server_keys_fails", () => {
  const m = clone(SOUND) as any;
  m.access.server_holds_decryption_keys = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["claim_consistency"], "fail");
});

test("test_vague_marketing_terms_fail_claim_specificity", () => {
  const m = clone(SOUND) as any;
  m.claims.vague_marketing_terms_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_UNSOUND");
  assert.equal(v.sections["claim_specificity"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.coverage.transport;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["coverage"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_no_password_or_asymmetric_declared_still_sound", () => {
  const m = clone(SOUND) as any;
  m.password_derivation = { applies: false };
  m.asymmetric = { applies: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "CLAIMS_SOUND");
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
    () => evaluate({ product: 12345, claims: "invalid_string_instead_of_object" }),
    fieldError("product"),
  );
});

test("malformed: product as number rejected", () => {
  assert.throws(
    () => evaluate({ product: 12345 }),
    fieldError("product"),
  );
});

test("malformed: claims as string rejected", () => {
  assert.throws(
    () => evaluate({ claims: "invalid_string_instead_of_object" }),
    fieldError("claims"),
  );
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.claims.key_length_bits = "256";
  assert.throws(() => evaluate(m), fieldError("claims.key_length_bits"));
});

test("malformed: deep nested leaf as number rejected", () => {
  const m = clone(SOUND) as any;
  m.coverage.transport.tls_version = 1.3;
  assert.throws(() => evaluate(m), fieldError("coverage.transport.tls_version"));
});

test("malformed: null field rejected", () => {
  const m = clone(SOUND) as any;
  m.claims = null;
  assert.throws(() => evaluate(m), fieldError("claims"));
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
  .filter((f) => f.startsWith("encryption-claim-audit--") && f.endsWith(".json"))
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
