// Encryption claim audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/encryption-claim-audit/src/encryption_claim_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  claims: {
    algorithm: "string",
    mode: "string",
    key_length_bits: "number",
    vague_marketing_terms_used: "boolean",
    end_to_end_encrypted: "boolean",
    zero_knowledge: "boolean",
  },
  construction: {
    authenticated_encryption: "boolean",
    custom_crypto: "boolean",
    nonce_unique_per_key: "boolean",
  },
  asymmetric: {
    applies: "boolean",
    key_exchange: "string",
    signatures: "string",
  },
  key_management: {
    keys_from_csprng: "boolean",
    keys_hardcoded: "boolean",
    storage: "string",
    rotation_planned: "boolean",
    recovery_story_documented: "boolean",
  },
  password_derivation: {
    applies: "boolean",
    kdf: "string",
    salt_unique_random_per_key: "boolean",
    password_used_directly_as_key: "boolean",
  },
  randomness: { source: "string" },
  coverage: {
    transport: {
      tls_version: "string",
      plaintext_fallback: "boolean",
    },
    at_rest: {
      encrypted: "boolean",
      key_stored_with_data: "boolean",
    },
    in_use: {
      plaintext_logged: "boolean",
      plaintext_in_crash_dumps: "boolean",
    },
    fails_closed_on_crypto_error: "boolean",
  },
  access: {
    server_can_read_plaintext: "boolean",
    server_holds_decryption_keys: "boolean",
  },
};

export const SECTIONS = [
  "claim_specificity",
  "standard_construction",
  "key_management",
  "derivation_and_randomness",
  "coverage",
  "claim_consistency",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Python truthiness for JSON-shaped values.
function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: claim_specificity ----
  const [algorithm, hasAlgorithm] = getPath(manifest, "claims", "algorithm");
  check(
    results, "claim_specificity", "algorithm_named",
    algorithm, hasAlgorithm,
    typeof algorithm === "string" && algorithm.trim().length > 0,
    `algorithm=${pyRepr(algorithm)} (skill: name the algorithm, mode, and key length)`,
  );

  const [mode, hasMode] = getPath(manifest, "claims", "mode");
  check(
    results, "claim_specificity", "mode_named",
    mode, hasMode,
    typeof mode === "string" && mode.trim().length > 0,
    `mode=${pyRepr(mode)} (skill: name the algorithm, mode, and key length)`,
  );

  const [keyLength, hasKeyLength] = getPath(manifest, "claims", "key_length_bits");
  check(
    results, "claim_specificity", "key_length_stated",
    keyLength, hasKeyLength,
    typeof keyLength === "number" && keyLength > 0,
    `key_length_bits=${pyRepr(keyLength)} (skill: name the algorithm, mode, and key length)`,
  );

  const [vague, hasVague] = getPath(manifest, "claims", "vague_marketing_terms_used");
  check(
    results, "claim_specificity", "no_vague_unqualified_claim",
    vague, hasVague, vague === false,
    "skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential",
  );

  // ---- Section 2: standard_construction ----
  const symPresent = hasAlgorithm && hasMode && hasKeyLength;
  const symOk =
    pyStr(algorithm).toUpperCase() === "AES" &&
    pyStr(mode).toUpperCase() === "GCM" &&
    typeof keyLength === "number" &&
    keyLength === 256;
  check(
    results, "standard_construction", "symmetric_is_aes_256_gcm",
    algorithm, symPresent, symOk,
    `algorithm=${pyRepr(algorithm)} mode=${pyRepr(mode)} key_length_bits=${pyRepr(keyLength)} (skill: symmetric: AES-256-GCM)`,
  );

  check(
    results, "standard_construction", "mode_is_not_ecb",
    mode, hasMode, pyStr(mode).toUpperCase() !== "ECB",
    `mode=${pyRepr(mode)} (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks)`,
  );

  const [authenticated, hasAuth] = getPath(manifest, "construction", "authenticated_encryption");
  check(
    results, "standard_construction", "authenticated_encryption",
    authenticated, hasAuth, authenticated === true,
    "skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident",
  );

  const [custom, hasCustom] = getPath(manifest, "construction", "custom_crypto");
  check(
    results, "standard_construction", "no_custom_crypto",
    custom, hasCustom, custom === false,
    "skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES",
  );

  const [nonce, hasNonce] = getPath(manifest, "construction", "nonce_unique_per_key");
  check(
    results, "standard_construction", "nonce_unique_per_key",
    nonce, hasNonce, nonce === true,
    "skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key",
  );

  const [asymApplies, hasAsymApplies] = getPath(manifest, "asymmetric", "applies");
  const [kx, hasKx] = getPath(manifest, "asymmetric", "key_exchange");
  const [sig, hasSig] = getPath(manifest, "asymmetric", "signatures");
  if (hasAsymApplies && pyTruthy(asymApplies)) {
    check(
      results, "standard_construction", "asymmetric_is_standard",
      kx, hasKx && hasSig,
      kx === "X25519" && sig === "Ed25519",
      `key_exchange=${pyRepr(kx)} signatures=${pyRepr(sig)} (skill: X25519 for key exchange, Ed25519 for signatures)`,
    );
  } else {
    check(
      results, "standard_construction", "asymmetric_is_standard",
      asymApplies, hasAsymApplies, true,
      "no asymmetric cryptography declared",
    );
  }

  // ---- Section 3: key_management ----
  const [csprng, hasCsprng] = getPath(manifest, "key_management", "keys_from_csprng");
  check(
    results, "key_management", "keys_generated_from_csprng",
    csprng, hasCsprng, csprng === true,
    "skill: keys come from the CSPRNG, never from passwords directly",
  );

  const [hardcoded, hasHardcoded] = getPath(manifest, "key_management", "keys_hardcoded");
  check(
    results, "key_management", "no_hardcoded_keys",
    hardcoded, hasHardcoded, hardcoded === false,
    "skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps",
  );

  const [storage, hasStorage] = getPath(manifest, "key_management", "storage");
  check(
    results, "key_management", "key_storage_in_keystore_or_memory",
    storage, hasStorage,
    storage === "platform_keystore" || storage === "memory_only",
    `storage=${pyRepr(storage)} (skill: keys live in the platform keystore or in memory only)`,
  );

  const [rotation, hasRotation] = getPath(manifest, "key_management", "rotation_planned");
  check(
    results, "key_management", "key_rotation_planned",
    rotation, hasRotation, rotation === true,
    "skill: plan rotation before you need it — what happens to old ciphertext when the key changes?",
  );

  const [recovery, hasRecovery] = getPath(manifest, "key_management", "recovery_story_documented");
  check(
    results, "key_management", "recovery_story_documented",
    recovery, hasRecovery, recovery === true,
    "skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated",
  );

  // ---- Section 4: derivation_and_randomness ----
  const [pdApplies, hasPdApplies] = getPath(manifest, "password_derivation", "applies");
  const [kdf, hasKdf] = getPath(manifest, "password_derivation", "kdf");
  if (hasPdApplies && pyTruthy(pdApplies)) {
    check(
      results, "derivation_and_randomness", "kdf_is_argon2id_or_pbkdf2",
      kdf, hasKdf, kdf === "Argon2id" || kdf === "PBKDF2",
      `kdf=${pyRepr(kdf)} (skill: Argon2id; PBKDF2 acceptable with high iteration counts; raw SHA-256 is not key derivation)`,
    );
  } else {
    check(
      results, "derivation_and_randomness", "kdf_is_argon2id_or_pbkdf2",
      pdApplies, hasPdApplies, true,
      "no password-derived keys declared",
    );
  }

  const [salt, hasSalt] = getPath(manifest, "password_derivation", "salt_unique_random_per_key");
  if (hasPdApplies && pyTruthy(pdApplies)) {
    check(
      results, "derivation_and_randomness", "unique_random_salt_per_key",
      salt, hasSalt, salt === true,
      "skill: passwords become keys through Argon2id with a unique random salt per key",
    );
  } else {
    check(
      results, "derivation_and_randomness", "unique_random_salt_per_key",
      pdApplies, hasPdApplies, true,
      "no password-derived keys declared",
    );
  }

  const [direct, hasDirect] = getPath(manifest, "password_derivation", "password_used_directly_as_key");
  if (hasPdApplies && pyTruthy(pdApplies)) {
    check(
      results, "derivation_and_randomness", "password_not_used_directly_as_key",
      direct, hasDirect, direct === false,
      "skill mistake: weak or missing KDF — passwords used directly as keys",
    );
  } else {
    check(
      results, "derivation_and_randomness", "password_not_used_directly_as_key",
      pdApplies, hasPdApplies, true,
      "no password-derived keys declared",
    );
  }

  const [randSource, hasRand] = getPath(manifest, "randomness", "source");
  check(
    results, "derivation_and_randomness", "randomness_from_os_csprng",
    randSource, hasRand, randSource === "os_csprng",
    `source=${pyRepr(randSource)} (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed)`,
  );

  // ---- Section 5: coverage ----
  const [tls, hasTls] = getPath(manifest, "coverage", "transport", "tls_version");
  check(
    results, "coverage", "transport_tls_1_2_or_higher",
    tls, hasTls, tls === "1.2" || tls === "1.3",
    `tls_version=${pyRepr(tls)} (skill: TLS 1.2+ for every network hop, no exceptions)`,
  );

  const [fallback, hasFallback] = getPath(manifest, "coverage", "transport", "plaintext_fallback");
  check(
    results, "coverage", "transport_no_plaintext_fallback",
    fallback, hasFallback, fallback === false,
    "skill: TLS 1.2+ for every network hop, no plaintext fallbacks",
  );

  const [atRest, hasAtRest] = getPath(manifest, "coverage", "at_rest", "encrypted");
  check(
    results, "coverage", "at_rest_encrypted",
    atRest, hasAtRest, atRest === true,
    "skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets",
  );

  const [keyWithData, hasKwd] = getPath(manifest, "coverage", "at_rest", "key_stored_with_data");
  check(
    results, "coverage", "key_not_stored_with_data",
    keyWithData, hasKwd, keyWithData === false,
    "skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps",
  );

  const [logged, hasLogged] = getPath(manifest, "coverage", "in_use", "plaintext_logged");
  check(
    results, "coverage", "in_use_plaintext_not_logged",
    logged, hasLogged, logged === false,
    "skill: in use — minimize plaintext lifetime, never log it",
  );

  const [dumps, hasDumps] = getPath(manifest, "coverage", "in_use", "plaintext_in_crash_dumps");
  check(
    results, "coverage", "in_use_plaintext_not_in_crash_dumps",
    dumps, hasDumps, dumps === false,
    "skill: in use — never put plaintext in crash dumps",
  );

  const [failsClosed, hasFc] = getPath(manifest, "coverage", "fails_closed_on_crypto_error");
  check(
    results, "coverage", "fails_closed_on_crypto_failure",
    failsClosed, hasFc, failsClosed === true,
    "skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected",
  );

  // ---- Section 6: claim_consistency ----
  const [e2e, hasE2e] = getPath(manifest, "claims", "end_to_end_encrypted");
  const [serverRead, hasServerRead] = getPath(manifest, "access", "server_can_read_plaintext");
  if (hasE2e && pyTruthy(e2e)) {
    check(
      results, "claim_consistency", "end_to_end_claim_matches_server_access",
      serverRead, hasServerRead, serverRead === false,
      `end_to_end_encrypted=${pyRepr(e2e)} server_can_read_plaintext=${pyRepr(serverRead)} (skill: if someone encrypts only in transit, they trust the server; follow the key)`,
    );
  } else {
    check(
      results, "claim_consistency", "end_to_end_claim_matches_server_access",
      e2e, hasE2e, true,
      "no end-to-end encryption claim declared",
    );
  }

  const [zk, hasZk] = getPath(manifest, "claims", "zero_knowledge");
  const [serverKeys, hasServerKeys] = getPath(manifest, "access", "server_holds_decryption_keys");
  if (hasZk && pyTruthy(zk)) {
    check(
      results, "claim_consistency", "zero_knowledge_claim_matches_key_access",
      serverKeys, hasServerKeys, serverKeys === false,
      `zero_knowledge=${pyRepr(zk)} server_holds_decryption_keys=${pyRepr(serverKeys)} (skill: ask where the key lives and who can read it — the answers draw the real trust boundary)`,
    );
  } else {
    check(
      results, "claim_consistency", "zero_knowledge_claim_matches_key_access",
      zk, hasZk, true,
      "no zero-knowledge claim declared",
    );
  }

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "CLAIMS_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CLAIMS_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "encryption-claim-audit",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ENCRYPTION CLAIM AUDIT",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
