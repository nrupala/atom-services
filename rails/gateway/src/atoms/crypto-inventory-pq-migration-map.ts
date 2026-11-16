// Crypto inventory PQ migration map — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/crypto-inventory-pq-migration-map/src/crypto_inventory_pq_migration_map.py
// (evaluate() + stamp()). No logic changes: every status, count,
// classification, target family, priority rank and summary string is
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Inventory entries are intentionally unvalidated ("any"):
// SERVICE.md documents counted-invalid entry semantics.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  inventory: ["any"],
};

export const CLASSIFICATIONS = [
  "quantum_vulnerable",
  "hybrid_classical_pq",
  "pq_ready",
  "symmetric_or_hash_not_broken",
  "unknown",
] as const;

const GROUP_ORDER: Record<string, number> = {
  quantum_vulnerable: 0,
  hybrid_classical_pq: 1,
  unknown: 2,
  pq_ready: 3,
  symmetric_or_hash_not_broken: 4,
};

const ACTIONS: Record<string, string> = {
  quantum_vulnerable: "migrate_hybrid",
  hybrid_classical_pq: "complete_hybrid_transition",
  pq_ready: "retain_pq",
  symmetric_or_hash_not_broken: "no_pq_migration_needed",
  unknown: "classify_before_planning",
};

const BASIS: Record<string, string> = {
  quantum_vulnerable:
    "classical asymmetric algorithm — quantum breaks today's asymmetric crypto",
  hybrid_classical_pq:
    "classical + NIST PQ together — hybrid mode during transition",
  pq_ready: "NIST PQC standard family algorithm (FIPS 203/204/205)",
  symmetric_or_hash_not_broken:
    "symmetric/hash algorithm — the asymmetric side is what breaks; AES-256 is fine",
  unknown:
    "algorithm is in none of the skill's families (classical asymmetric, NIST PQ, symmetric/hash) — classify before planning",
};

const PQ_MARKERS = [
  "ml-kem", "mlkem", "kyber", "ml-dsa", "mldsa",
  "dilithium", "slh-dsa", "slhdsa", "sphincs",
];
const CLASSICAL_MARKERS = [
  "rsa", "ecdsa", "ecdh", "ecdhe", "ed25519",
  "ed448", "x25519", "x448", "curve25519", "dsa",
  "diffie", "elgamal", "ecies", "secp256",
  "secp384", "secp521", "p-256", "p-384", "p-521",
];
const SYMMETRIC_MARKERS = [
  "aes", "chacha", "sha-2", "sha2", "sha-256",
  "sha256", "sha-384", "sha384", "sha-512",
  "sha512", "sha3", "shake", "blake", "hmac",
  "argon", "scrypt", "bcrypt", "pbkdf",
];
const KEY_EXCHANGE_PURPOSES = [
  "key_exchange", "key-exchange", "key exchange", "kem",
  "key_encapsulation", "encryption", "key_transport",
];
const SIGNATURE_PURPOSES = ["signature", "signing"];

export interface MapRow {
  id: string | null;
  surface: string | null;
  algorithm: string | null;
  purpose: string | null;
  classification: string;
  action: string;
  target_family: string | null;
  shelf_life_years: number | null;
  owner: string | null;
  priority_rank: number | null;
  basis: string;
}

export interface MigrationMap {
  service: string;
  atom_version: string;
  system: unknown;
  status: string;
  counts: {
    total: number;
    invalid_entries: number;
    by_classification: Record<string, number>;
    migration_needed: number;
    missing_shelf_life: number;
    missing_owner: number;
  };
  migration_map: MapRow[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  obj: unknown,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function strOrNone(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNone(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function classify(algorithm: unknown): string {
  if (typeof algorithm !== "string" || algorithm.length === 0) {
    return "unknown";
  }
  const text = algorithm.toLowerCase();
  const hasPq = PQ_MARKERS.some((marker) => text.includes(marker));
  // Strip the PQ names before the classical scan: "ML-DSA" and
  // "SLH-DSA" contain the classical marker "dsa" as a substring.
  let cleaned = text;
  for (const marker of PQ_MARKERS) {
    cleaned = cleaned.split(marker).join(" ");
  }
  const hasClassical = CLASSICAL_MARKERS.some((marker) =>
    cleaned.includes(marker));
  if (hasPq && hasClassical) return "hybrid_classical_pq";
  if (hasPq) return "pq_ready";
  if (hasClassical) return "quantum_vulnerable";
  if (SYMMETRIC_MARKERS.some((marker) => text.includes(marker))) {
    return "symmetric_or_hash_not_broken";
  }
  return "unknown";
}

function targetFamily(algorithm: unknown, purpose: unknown): string {
  const text = typeof algorithm === "string" ? algorithm.toLowerCase() : "";
  if (text.includes("ml-kem") || text.includes("mlkem") ||
      text.includes("kyber")) {
    return "ML-KEM (FIPS 203)";
  }
  if (text.includes("slh-dsa") || text.includes("slhdsa") ||
      text.includes("sphincs")) {
    return "SLH-DSA (FIPS 205)";
  }
  if (text.includes("ml-dsa") || text.includes("mldsa") ||
      text.includes("dilithium")) {
    return "ML-DSA (FIPS 204)";
  }
  const purposeText = typeof purpose === "string" ? purpose.toLowerCase() : "";
  if (KEY_EXCHANGE_PURPOSES.includes(purposeText)) {
    return "ML-KEM (FIPS 203)";
  }
  if (SIGNATURE_PURPOSES.includes(purposeText)) {
    return "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)";
  }
  return "ML-KEM (FIPS 203) for key exchange; ML-DSA (FIPS 204) / " +
    "SLH-DSA (FIPS 205) for signatures";
}

export function evaluate(manifest: unknown): MigrationMap {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);

  const byClassification: Record<string, number> = {};
  for (const name of CLASSIFICATIONS) byClassification[name] = 0;
  const counts: MigrationMap["counts"] = {
    total: 0,
    invalid_entries: 0,
    by_classification: byClassification,
    migration_needed: 0,
    missing_shelf_life: 0,
    missing_owner: 0,
  };
  const result: MigrationMap = {
    service: "crypto-inventory-pq-migration-map",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    status: "insufficient_evidence",
    counts,
    migration_map: [],
    summary: "",
  };

  const [inventory, hasInventory] = getPath(manifest, "inventory");
  if (!hasInventory || !Array.isArray(inventory) || inventory.length === 0) {
    result.summary =
      "Insufficient evidence: no crypto inventory entries submitted.";
    return result;
  }

  const rows: { index: number; row: MapRow }[] = [];
  inventory.forEach((entry, index) => {
    if (!isPyDict(entry)) {
      counts.invalid_entries += 1;
      return;
    }
    const [algorithm] = getPath(entry, "algorithm");
    const [purpose] = getPath(entry, "purpose");
    const classification = classify(algorithm);
    const shelf = numberOrNone(getPath(entry, "shelf_life_years")[0]);
    const owner = strOrNone(getPath(entry, "owner")[0]);
    const target =
      classification === "quantum_vulnerable" ||
      classification === "hybrid_classical_pq" ||
      classification === "pq_ready"
        ? targetFamily(algorithm, purpose)
        : null;
    rows.push({
      index,
      row: {
        id: strOrNone(getPath(entry, "id")[0]),
        surface: strOrNone(getPath(entry, "surface")[0]),
        algorithm: strOrNone(algorithm),
        purpose: strOrNone(purpose),
        classification,
        action: ACTIONS[classification],
        target_family: target,
        shelf_life_years: shelf,
        owner,
        priority_rank: null,
        basis: BASIS[classification],
      },
    });
    counts.by_classification[classification] += 1;
    if (shelf === null) counts.missing_shelf_life += 1;
    if (owner === null) counts.missing_owner += 1;
  });

  counts.total = rows.length;
  counts.migration_needed = counts.by_classification["quantum_vulnerable"];

  if (rows.length === 0) {
    result.summary =
      `Insufficient evidence: ${counts.invalid_entries} ` +
      "invalid inventory entries submitted; no valid entries to map.";
    return result;
  }

  rows.sort((a, b) => {
    const groupDiff =
      GROUP_ORDER[a.row.classification] - GROUP_ORDER[b.row.classification];
    if (groupDiff !== 0) return groupDiff;
    const aShelf = a.row.shelf_life_years;
    const bShelf = b.row.shelf_life_years;
    const presentDiff =
      (aShelf !== null ? 0 : 1) - (bShelf !== null ? 0 : 1);
    if (presentDiff !== 0) return presentDiff;
    const shelfDiff = (bShelf ?? 0) - (aShelf ?? 0);
    if (shelfDiff !== 0) return shelfDiff;
    return a.index - b.index;
  });
  const migrationMap: MapRow[] = [];
  rows.forEach(({ row }, i) => {
    row.priority_rank = i + 1;
    migrationMap.push(row);
  });
  result.migration_map = migrationMap;

  const byClass = counts.by_classification;
  if (counts.invalid_entries === 0 && byClass["unknown"] === 0 &&
      counts.missing_shelf_life === 0) {
    result.status = "complete";
  } else {
    result.status = "partial";
  }
  result.summary =
    `Migration map over ${counts.total} inventory entries: ` +
    `${byClass["quantum_vulnerable"]} quantum-vulnerable, ` +
    `${byClass["hybrid_classical_pq"]} hybrid, ` +
    `${byClass["pq_ready"]} PQ-ready, ` +
    `${byClass["symmetric_or_hash_not_broken"]} symmetric/hash not broken, ` +
    `${byClass["unknown"]} unknown; ` +
    `${counts.missing_shelf_life} missing shelf-life.`;
  return result;
}

export function stamp(verdict: MigrationMap): string {
  const lines: string[] = [
    "CRYPTO INVENTORY PQ MIGRATION MAP",
    `system: ${pyStr(verdict.system ?? null)}`,
    `STATUS: ${verdict.status}`,
    verdict.summary,
  ];
  return lines.join("\n");
}
