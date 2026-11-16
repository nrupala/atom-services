// Zero-trust evaluation verdict — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/zero-trust-evaluation-verdict/src/zero_trust_evaluation_verdict.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed claim status
// and the summary string are byte-identical to the Python output
// for the same input. The computed secret-length margin uses the
// shared fixed serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  evaluation: {
    claim_stated: "boolean",
    adversaries_named: "boolean",
    out_of_scope_named: "boolean",
    not_certification_acknowledged: "boolean",
  },
  gauntlet: {
    authentication_point_identified: "boolean",
    session_trusted_indefinitely: "boolean",
    master_secret_leaves_client: "boolean",
    server_sees_only_encrypted_data: "boolean",
    server_breach_exposes_user_data: "boolean",
  },
  identity: {
    checked_before_access: "boolean",
    proof_method_named: "boolean",
  },
  cryptography: {
    password_kdf: "string",
    minimum_secret_length_chars: "number",
    claims_nist_alignment: "boolean",
    nist_controls_named: "boolean",
  },
  findings: {
    least_privilege_evaluated: "boolean",
    credential_exceeds_job: "boolean",
    blast_radius_bounded: "boolean",
    flat_network: "boolean",
    trust_rechecked_after_login: "boolean",
  },
  inventory: {
    trusted_components_inventoried: "boolean",
    backdoors_present: "boolean",
    backdoors_named: "boolean",
    convenience_decisions_surfaced: "boolean",
    internal_network_trusted: "boolean",
  },
  limits: {
    compromised_endpoint_limit_acknowledged: "boolean",
    usability_tradeoff_stated: "boolean",
    design_claims_only_acknowledged: "boolean",
  },
};

export const SECTIONS = [
  "claim_and_scope",
  "authentication_and_server_trust",
  "identity_and_authenticator_strength",
  "privilege_segmentation_and_verification",
  "trust_inventory",
  "honest_limits",
] as const;

export const STATED_MINIMUM_SECRET_LENGTH = 16;
export const PREFERRED_KDF = "argon2id";

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
  system: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  claim_status: string | null;
  secret_length_margin_chars: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: claim_and_scope ----
  boolCheck(results, "claim_and_scope", "claim_stated_verbatim",
    manifest, ["evaluation", "claim_stated"],
    "the zero-trust claim under evaluation is stated — alignment is a claim about which controls are implemented, not a certificate");
  boolCheck(results, "claim_and_scope", "adversaries_named",
    manifest, ["evaluation", "adversaries_named"],
    "a system is zero-trust only against the adversaries it names");
  boolCheck(results, "claim_and_scope", "out_of_scope_named",
    manifest, ["evaluation", "out_of_scope_named"],
    "who is out of scope is named honestly (zerok names compromised client OS and physical access as out of scope)");
  boolCheck(results, "claim_and_scope",
    "evaluation_not_certification_acknowledged",
    manifest, ["evaluation", "not_certification_acknowledged"],
    "honest limit: this skill evaluates design claims — it does not replace a security audit, penetration test, or formal certification");

  // ---- Section 2: authentication_and_server_trust ----
  boolCheck(results, "authentication_and_server_trust",
    "authentication_point_identified",
    manifest, ["gauntlet", "authentication_point_identified"],
    "gauntlet: where does authentication happen? The authentication point is identified");
  falseCheck(results, "authentication_and_server_trust",
    "session_not_trusted_indefinitely",
    manifest, ["gauntlet", "session_trusted_indefinitely"],
    "gauntlet: if the server authenticates you and then trusts the session indefinitely, that's perimeter thinking with extra steps");
  falseCheck(results, "authentication_and_server_trust",
    "master_secret_never_leaves_client",
    manifest, ["gauntlet", "master_secret_leaves_client"],
    "gauntlet: what does the server know? In a true zero-trust design the server holds no secrets it could abuse (mykey: master password never leaves the machine)");
  boolCheck(results, "authentication_and_server_trust",
    "server_sees_only_encrypted_data",
    manifest, ["gauntlet", "server_sees_only_encrypted_data"],
    "gauntlet: the server sees only encrypted data (zerok: storage server sees only encrypted blobs — no plaintext, no recoverable keys)");
  falseCheck(results, "authentication_and_server_trust",
    "server_breach_does_not_expose_user_data",
    manifest, ["gauntlet", "server_breach_exposes_user_data"],
    "gauntlet: what survives a server breach? If breaching the server exposes user data, the trust was placed in the server — the opposite of zero-trust");

  // ---- Section 3: identity_and_authenticator_strength ----
  boolCheck(results, "identity_and_authenticator_strength",
    "identity_checked_before_access",
    manifest, ["identity", "checked_before_access"],
    "identity-based access: what identity does this system check before granting access?");
  boolCheck(results, "identity_and_authenticator_strength",
    "identity_proof_method_named",
    manifest, ["identity", "proof_method_named"],
    "identity-based access: how is that identity proven? The proof method is named");
  const [kdf, hasKdf] = getPath(manifest, "cryptography", "password_kdf");
  check(results, "identity_and_authenticator_strength",
    "password_kdf_is_argon2id", kdf, hasKdf,
    hasKdf && kdf === PREFERRED_KDF,
    "NIST notes: Argon2id is the NIST-preferred password-hashing/KDF choice — prefer it over PBKDF2 and never over raw SHA-256 (not a KDF)");
  const [length, hasLength] = getPath(
    manifest, "cryptography", "minimum_secret_length_chars");
  const lengthIsNumber = hasLength && isNumber(length);
  const lengthOk = lengthIsNumber &&
    (length as number) >= STATED_MINIMUM_SECRET_LENGTH;
  check(results, "identity_and_authenticator_strength",
    "minimum_secret_length_meets_stated_minimum", length,
    lengthIsNumber, lengthOk,
    "NIST notes: CISA guidance — enforce meaningful minimum entropy (mykey: 16 characters); length beats complexity rules");
  const lengthMargin: number | null = lengthIsNumber
    ? (length as number) - STATED_MINIMUM_SECRET_LENGTH
    : null;
  const [claimsNist, hasClaims] = getPath(
    manifest, "cryptography", "claims_nist_alignment");
  const [controls, hasControls] = getPath(
    manifest, "cryptography", "nist_controls_named");
  if (hasClaims && pyTruthy(claimsNist)) {
    check(results, "identity_and_authenticator_strength",
      "nist_controls_named_when_alignment_claimed",
      controls, hasControls, controls === true,
      "NIST notes: 'NIST-compliant' without naming the controls is marketing — alignment is a claim about which controls are implemented");
  } else {
    check(results, "identity_and_authenticator_strength",
      "nist_controls_named_when_alignment_claimed",
      claimsNist, hasClaims, true,
      "no NIST alignment claimed");
  }

  // ---- Section 4: privilege_segmentation_and_verification ----
  boolCheck(results, "privilege_segmentation_and_verification",
    "least_privilege_evaluated",
    manifest, ["findings", "least_privilege_evaluated"],
    "least privilege evaluated: every identity gets the minimum access needed, for the minimum time needed");
  falseCheck(results, "privilege_segmentation_and_verification",
    "credential_scope_within_job",
    manifest, ["findings", "credential_exceeds_job"],
    "least privilege: can this credential do more than its job requires? It must not");
  boolCheck(results, "privilege_segmentation_and_verification",
    "breach_blast_radius_bounded",
    manifest, ["findings", "blast_radius_bounded"],
    "micro-segmentation: if this component is breached, what else falls with it? The blast radius is bounded");
  falseCheck(results, "privilege_segmentation_and_verification",
    "network_not_flat",
    manifest, ["findings", "flat_network"],
    "micro-segmentation: a flat network where one breach means total breach is not zero-trust");
  boolCheck(results, "privilege_segmentation_and_verification",
    "trust_rechecked_after_login",
    manifest, ["findings", "trust_rechecked_after_login"],
    "continuous verification: what happens after the initial login — is anything ever re-checked? Sessions expire, tokens rotate, anomalous behavior re-triggers authentication");

  // ---- Section 5: trust_inventory ----
  boolCheck(results, "trust_inventory",
    "trusted_components_inventoried",
    manifest, ["inventory", "trusted_components_inventoried"],
    "trust is a vulnerability: every trusted component is an attack surface — inventory them before praising the architecture");
  const [backdoors, hasBackdoors] = getPath(
    manifest, "inventory", "backdoors_present");
  const [named, hasNamed] = getPath(
    manifest, "inventory", "backdoors_named");
  if (hasBackdoors && pyTruthy(backdoors)) {
    check(results, "trust_inventory", "backdoors_named_explicitly",
      named, hasNamed, named === true,
      "is there a backdoor? 'Forgot password' recovery, admin override, escrow keys — each is a trusted third party; name them explicitly");
  } else {
    check(results, "trust_inventory", "backdoors_named_explicitly",
      backdoors, hasBackdoors, true,
      "no backdoor (recovery / override / escrow) declared");
  }
  boolCheck(results, "trust_inventory",
    "convenience_trust_decisions_surfaced",
    manifest, ["inventory", "convenience_decisions_surfaced"],
    "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one");
  falseCheck(results, "trust_inventory",
    "network_not_trusted_as_internal",
    manifest, ["inventory", "internal_network_trusted"],
    "the network is always hostile in your analysis, even 'internal' networks — 'inside the firewall' is not an identity");

  // ---- Section 6: honest_limits ----
  boolCheck(results, "honest_limits",
    "compromised_endpoint_limit_acknowledged",
    manifest, ["limits", "compromised_endpoint_limit_acknowledged"],
    "honest limit: zero-trust does not fix a compromised endpoint — if the client device is owned, no architecture above it holds");
  boolCheck(results, "honest_limits", "usability_tradeoff_stated",
    manifest, ["limits", "usability_tradeoff_stated"],
    "usability and zero-trust are in tension (no password recovery IS the guarantee) — say what the user gives up, not just what they gain");
  boolCheck(results, "honest_limits",
    "design_claims_only_acknowledged",
    manifest, ["limits", "design_claims_only_acknowledged"],
    "this skill evaluates design claims — the verdict is over the declared design evidence, not a live audit of the running system");

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
    verdict = "CLAIM_NOT_SUSTAINED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CLAIM_SUSTAINED";
  }

  const computedStatuses = results
    .filter((r) => r.check === "password_kdf_is_argon2id" ||
      r.check === "minimum_secret_length_meets_stated_minimum")
    .map((r) => r.status);
  let claimStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    claimStatus = "not_sustained_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    claimStatus = "sustained_on_declared_evidence";
  } else {
    claimStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "zero-trust-evaluation-verdict",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    verdict,
    sections,
    checks: results,
    claim_status: claimStatus,
    secret_length_margin_chars: fmt4(lengthMargin),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ZERO TRUST EVALUATION VERDICT",
    `system: ${pyStr(verdict.system ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
