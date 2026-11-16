import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/crypto-inventory-pq-migration-map.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The COMPLETE manifest, copied from the Python MigrationMapTests oracle.
const COMPLETE: Record<string, unknown> = {
  system: "product-signing-and-archives",
  inventory: [
    { id: "archive-envelope", surface: "at_rest_envelope",
      algorithm: "RSA-2048", purpose: "key_exchange",
      shelf_life_years: 30, owner: "platform" },
    { id: "tls-edge", surface: "tls",
      algorithm: "ECDHE-X25519", purpose: "key_exchange",
      shelf_life_years: 5, owner: "platform" },
    { id: "firmware-signing", surface: "firmware_signing",
      algorithm: "ECDSA-P256", purpose: "signature",
      shelf_life_years: 15, owner: "release" },
    { id: "agent-trust-hybrid", surface: "agent_trust_root",
      algorithm: "X25519+ML-KEM-768", purpose: "key_exchange",
      shelf_life_years: 10, owner: "agents" },
    { id: "new-kem", surface: "tls",
      algorithm: "ML-KEM-768", purpose: "key_exchange",
      shelf_life_years: 10, owner: "platform" },
    { id: "archive-aes", surface: "at_rest_envelope",
      algorithm: "AES-256-GCM", purpose: "encryption",
      shelf_life_years: 30, owner: "platform" },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function byId(result: ReturnType<typeof evaluate>) {
  return Object.fromEntries(
    result.migration_map.map((row) => [row.id, row]));
}

// ---- The 20 Python MigrationMapTests, ported ----

test("test_complete_inventory_is_complete_and_prioritised", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.status, "complete");
  assert.deepEqual(v.migration_map.map((r) => r.id),
    ["archive-envelope", "firmware-signing", "tls-edge",
     "agent-trust-hybrid", "new-kem", "archive-aes"]);
  assert.deepEqual(v.migration_map.map((r) => r.priority_rank),
    [1, 2, 3, 4, 5, 6]);
  assert.equal(v.counts.migration_needed, 3);
});

test("test_rsa_key_exchange_targets_ml_kem_hybrid", () => {
  const row = byId(evaluate(clone(COMPLETE)))["archive-envelope"];
  assert.equal(row.classification, "quantum_vulnerable");
  assert.equal(row.action, "migrate_hybrid");
  assert.equal(row.target_family, "ML-KEM (FIPS 203)");
});

test("test_ecdsa_signature_targets_ml_dsa_or_slh_dsa", () => {
  const row = byId(evaluate(clone(COMPLETE)))["firmware-signing"];
  assert.equal(row.classification, "quantum_vulnerable");
  assert.equal(row.target_family, "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)");
});

test("test_vulnerable_without_purpose_gets_dual_family_target", () => {
  const v = evaluate({ inventory: [
    { id: "bare-rsa", algorithm: "RSA-4096", shelf_life_years: 20 }] });
  assert.equal(v.migration_map[0].target_family,
    "ML-KEM (FIPS 203) for key exchange; ML-DSA (FIPS 204) / " +
    "SLH-DSA (FIPS 205) for signatures");
});

test("test_ml_kem_is_pq_ready_and_retained", () => {
  const row = byId(evaluate(clone(COMPLETE)))["new-kem"];
  assert.equal(row.classification, "pq_ready");
  assert.equal(row.action, "retain_pq");
  assert.equal(row.target_family, "ML-KEM (FIPS 203)");
});

test("test_slh_dsa_is_pq_ready_with_its_own_family", () => {
  const v = evaluate({ inventory: [
    { id: "root-signing", algorithm: "SLH-DSA-SHA2-128s",
      purpose: "signature", shelf_life_years: 25 }] });
  const row = v.migration_map[0];
  assert.equal(row.classification, "pq_ready");
  assert.equal(row.target_family, "SLH-DSA (FIPS 205)");
  assert.equal(v.status, "complete");
});

test("test_classical_plus_pq_is_hybrid", () => {
  const row = byId(evaluate(clone(COMPLETE)))["agent-trust-hybrid"];
  assert.equal(row.classification, "hybrid_classical_pq");
  assert.equal(row.action, "complete_hybrid_transition");
  assert.equal(row.target_family, "ML-KEM (FIPS 203)");
});

test("test_aes_256_is_not_quantum_broken_and_needs_no_migration", () => {
  const row = byId(evaluate(clone(COMPLETE)))["archive-aes"];
  assert.equal(row.classification, "symmetric_or_hash_not_broken");
  assert.equal(row.action, "no_pq_migration_needed");
  assert.equal(row.target_family, null);
  assert.equal(row.priority_rank, 6);
});

test("test_hash_algorithm_is_symmetric_or_hash", () => {
  const v = evaluate({ inventory: [
    { id: "integrity", algorithm: "SHA-256", shelf_life_years: 10 }] });
  assert.equal(v.migration_map[0].classification,
               "symmetric_or_hash_not_broken");
  assert.equal(v.status, "complete");
});

test("test_ed25519_signing_is_quantum_vulnerable", () => {
  const v = evaluate({ inventory: [
    { id: "code-signing", algorithm: "Ed25519",
      purpose: "signature", shelf_life_years: 12 }] });
  const row = v.migration_map[0];
  assert.equal(row.classification, "quantum_vulnerable");
  assert.equal(row.target_family, "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)");
});

test("test_unknown_algorithm_is_partial_and_unranked_by_family", () => {
  const v = evaluate({ inventory: [
    { id: "mystery", algorithm: "CustomCipher-9000", shelf_life_years: 40 },
    { id: "known-rsa", algorithm: "RSA-2048", purpose: "key_exchange",
      shelf_life_years: 1 }] });
  assert.equal(v.status, "partial");
  const rows = byId(v);
  assert.equal(rows["mystery"].classification, "unknown");
  assert.equal(rows["mystery"].action, "classify_before_planning");
  assert.equal(rows["mystery"].target_family, null);
  assert.equal(rows["known-rsa"].priority_rank, 1);
  assert.equal(rows["mystery"].priority_rank, 2);
});

test("test_missing_shelf_life_is_partial_and_sorts_last_in_group", () => {
  const v = evaluate({ inventory: [
    { id: "no-shelf", algorithm: "RSA-2048", purpose: "key_exchange" },
    { id: "short-shelf", algorithm: "RSA-2048", purpose: "key_exchange",
      shelf_life_years: 2 }] });
  assert.equal(v.status, "partial");
  assert.equal(v.counts.missing_shelf_life, 1);
  assert.deepEqual(v.migration_map.map((r) => r.id),
    ["short-shelf", "no-shelf"]);
  assert.equal(v.migration_map[1].shelf_life_years, null);
});

test("test_equal_shelf_life_keeps_submission_order", () => {
  const v = evaluate({ inventory: [
    { id: "first", algorithm: "RSA-2048", shelf_life_years: 10 },
    { id: "second", algorithm: "ECDSA-P384", shelf_life_years: 10 }] });
  assert.deepEqual(v.migration_map.map((r) => r.id), ["first", "second"]);
});

test("test_non_object_entries_are_invalid_and_partial", () => {
  const v = evaluate({ inventory: [
    "not-an-entry",
    { id: "ok", algorithm: "ML-DSA-65", purpose: "signature",
      shelf_life_years: 20 }] });
  assert.equal(v.status, "partial");
  assert.equal(v.counts.invalid_entries, 1);
  assert.equal(v.counts.total, 1);
  assert.equal(v.migration_map[0].target_family, "ML-DSA (FIPS 204)");
});

test("test_all_invalid_entries_are_insufficient_evidence", () => {
  const v = evaluate({ inventory: ["nope", 42] });
  assert.equal(v.status, "insufficient_evidence");
  assert.deepEqual(v.migration_map, []);
  assert.equal(v.counts.invalid_entries, 2);
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.status, "insufficient_evidence");
  assert.deepEqual(v.migration_map, []);
});

test("test_empty_inventory_is_insufficient_evidence", () => {
  assert.equal(evaluate({ inventory: [] }).status, "insufficient_evidence");
});

test("test_non_list_inventory_is_rejected", () => {
  // Split from the former
  // test_empty_or_non_list_inventory_is_insufficient_evidence:
  // a non-list inventory is a type violation (F1), not evidence.
  assert.throws(
    () => evaluate({ inventory: "tls-everywhere" }),
    fieldError("inventory"),
  );
});

test("test_missing_owner_is_counted_not_blocking", () => {
  const v = evaluate({ inventory: [
    { id: "owned", algorithm: "RSA-2048", shelf_life_years: 10,
      owner: "platform" },
    { id: "unowned", algorithm: "RSA-2048", shelf_life_years: 9 }] });
  assert.equal(v.status, "complete");
  assert.equal(v.counts.missing_owner, 1);
  assert.equal(byId(v)["unowned"].owner, null);
});

test("test_stamp_names_the_status", () => {
  const text = stamp(evaluate(clone(COMPLETE)));
  assert.ok(text.includes("STATUS: complete"));
  assert.ok(text.includes("system: product-signing-and-archives"));
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
// naming the field — never a verdict over garbage. Inventory
// entries stay unvalidated by design (counted-invalid semantics).

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ system: 12345, inventory: "not-a-list" }),
    fieldError("system"),
  );
});

test("malformed: inventory as string rejected", () => {
  assert.throws(
    () => evaluate({ system: "ok", inventory: "not-a-list" }),
    fieldError("inventory"),
  );
});

test("malformed: null system rejected", () => {
  assert.throws(
    () => evaluate({ system: null, inventory: [] }),
    fieldError("system"),
  );
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
  .filter((f) =>
    f.startsWith("crypto-inventory-pq-migration-map--") &&
    f.endsWith(".json"))
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
