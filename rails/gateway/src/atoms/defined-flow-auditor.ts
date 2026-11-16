// Defined-flow auditor — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/defined-flow-auditor/src/defined_flow_auditor.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  auth: {
    every_request_authenticated: "boolean",
    every_request_authorized: "boolean",
    internal_traffic_trusted: "boolean",
  },
  identity: {
    access_follows_identity: "boolean",
    checked_before_access: "boolean",
    proof_method_named: "boolean",
  },
  privilege: {
    minimum_access: "boolean",
    access_expires: "boolean",
    credential_exceeds_job: "boolean",
  },
  segmentation: {
    components_segmented: "boolean",
    blast_radius_bounded: "boolean",
    flat_network: "boolean",
  },
  verification: {
    sessions_expire: "boolean",
    tokens_rotate: "boolean",
    anomalies_retrigger_auth: "boolean",
  },
  gauntlet: {
    server_holds_plaintext_or_keys: "boolean",
    server_breach_exposes_user_data: "boolean",
    trusted_components_inventoried: "boolean",
    convenience_decisions_surfaced: "boolean",
    backdoors_present: "boolean",
    backdoors_named: "boolean",
  },
  scope: {
    adversaries_named: "boolean",
    out_of_scope_named: "boolean",
    compromised_endpoint_limit_acknowledged: "boolean",
    claims_nist_alignment: "boolean",
    nist_controls_named: "boolean",
  },
};

export const SECTIONS = [
  "never_trust_always_verify",
  "identity_based_access",
  "least_privilege",
  "micro_segmentation",
  "continuous_verification",
  "claim_gauntlet",
  "scope_and_limits",
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
  system: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: never_trust_always_verify (principle 1) ----
  boolCheck(results, "never_trust_always_verify",
    "every_request_authenticated", manifest,
    ["auth", "every_request_authenticated"],
    "every request — user, device, service — is authenticated as if it came from an open network");
  boolCheck(results, "never_trust_always_verify",
    "every_request_authorized", manifest,
    ["auth", "every_request_authorized"],
    "every request is authorized fresh, on identity and context");
  falseCheck(results, "never_trust_always_verify",
    "network_location_not_trusted", manifest,
    ["auth", "internal_traffic_trusted"],
    "'inside the firewall' is not an identity");

  // ---- Section 2: identity_based_access (principle 2) ----
  boolCheck(results, "identity_based_access",
    "access_follows_identity_not_network", manifest,
    ["identity", "access_follows_identity"],
    "access follows the identity (user, device, workload), not the network location");
  boolCheck(results, "identity_based_access",
    "identity_checked_before_access", manifest,
    ["identity", "checked_before_access"],
    "what identity does this system check before granting access?");
  boolCheck(results, "identity_based_access",
    "identity_proof_method_named", manifest,
    ["identity", "proof_method_named"],
    "how is that identity proven? The proof method is named");

  // ---- Section 3: least_privilege (principle 3) ----
  boolCheck(results, "least_privilege", "minimum_access_per_identity",
    manifest, ["privilege", "minimum_access"],
    "every identity gets the minimum access needed");
  boolCheck(results, "least_privilege", "access_expires", manifest,
    ["privilege", "access_expires"],
    "access is granted for the minimum time needed — does access expire?");
  falseCheck(results, "least_privilege", "credentials_scoped_to_job",
    manifest, ["privilege", "credential_exceeds_job"],
    "can this credential do more than its job requires? It must not");

  // ---- Section 4: micro_segmentation (principle 4) ----
  boolCheck(results, "micro_segmentation", "components_segmented",
    manifest, ["segmentation", "components_segmented"],
    "the blast radius of a compromise is bounded");
  boolCheck(results, "micro_segmentation", "breach_blast_radius_bounded",
    manifest, ["segmentation", "blast_radius_bounded"],
    "if this component is breached, what else falls with it? The answer is bounded, not everything");
  falseCheck(results, "micro_segmentation", "network_not_flat",
    manifest, ["segmentation", "flat_network"],
    "a flat network where one breach means total breach is not zero-trust");

  // ---- Section 5: continuous_verification (principle 5) ----
  boolCheck(results, "continuous_verification", "sessions_expire",
    manifest, ["verification", "sessions_expire"],
    "trust is re-evaluated, not granted once — sessions expire");
  boolCheck(results, "continuous_verification", "tokens_rotate",
    manifest, ["verification", "tokens_rotate"], "tokens rotate");
  boolCheck(results, "continuous_verification",
    "anomalies_retrigger_authentication", manifest,
    ["verification", "anomalies_retrigger_auth"],
    "anomalous behavior re-triggers authentication");

  // ---- Section 6: claim_gauntlet ----
  falseCheck(results, "claim_gauntlet",
    "server_holds_no_abusable_secrets", manifest,
    ["gauntlet", "server_holds_plaintext_or_keys"],
    "in a true zero-trust design the server holds no secrets it could abuse — no plaintext, no recoverable keys");
  falseCheck(results, "claim_gauntlet",
    "server_breach_does_not_expose_user_data", manifest,
    ["gauntlet", "server_breach_exposes_user_data"],
    "if breaching the server exposes user data, the trust was placed in the server");
  boolCheck(results, "claim_gauntlet", "trusted_components_inventoried",
    manifest, ["gauntlet", "trusted_components_inventoried"],
    "every trusted component is an attack surface — inventory them before praising the architecture");
  boolCheck(results, "claim_gauntlet",
    "convenience_trust_decisions_surfaced", manifest,
    ["gauntlet", "convenience_decisions_surfaced"],
    "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one");
  const [backdoors, hasBackdoors] = getPath(manifest, "gauntlet", "backdoors_present");
  const [named, hasNamed] = getPath(manifest, "gauntlet", "backdoors_named");
  if (hasBackdoors && pyTruthy(backdoors)) {
    check(results, "claim_gauntlet", "backdoors_named_explicitly",
      named, hasNamed, named === true,
      "recovery, admin override, escrow keys — each is a trusted third party; name them explicitly");
  } else {
    check(results, "claim_gauntlet", "backdoors_named_explicitly",
      backdoors, hasBackdoors, true,
      "no backdoor (recovery / override / escrow) declared");
  }

  // ---- Section 7: scope_and_limits ----
  boolCheck(results, "scope_and_limits", "adversaries_named", manifest,
    ["scope", "adversaries_named"],
    "a system is zero-trust only against the adversaries it names");
  boolCheck(results, "scope_and_limits", "out_of_scope_named", manifest,
    ["scope", "out_of_scope_named"], "who is out of scope is named honestly");
  boolCheck(results, "scope_and_limits",
    "compromised_endpoint_limit_acknowledged", manifest,
    ["scope", "compromised_endpoint_limit_acknowledged"],
    "honest limit: zero-trust does not fix a compromised endpoint");
  const [claimsNist, hasClaims] = getPath(manifest, "scope", "claims_nist_alignment");
  const [controls, hasControls] = getPath(manifest, "scope", "nist_controls_named");
  if (hasClaims && pyTruthy(claimsNist)) {
    check(results, "scope_and_limits",
      "nist_controls_named_when_alignment_claimed",
      controls, hasControls, controls === true,
      "'NIST-compliant' without naming the controls is marketing — alignment is a claim about which controls are implemented");
  } else {
    check(results, "scope_and_limits",
      "nist_controls_named_when_alignment_claimed",
      claimsNist, hasClaims, true, "no NIST alignment claimed");
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
    verdict = "NOT_DEFINED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DEFINED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "defined-flow-auditor",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DEFINED-FLOW AUDITOR",
    `system: ${pyStr(verdict.system ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(26)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
