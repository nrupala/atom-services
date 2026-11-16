// Auth design review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/auth-design-review/src/auth_design_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary
// string are byte-identical to the Python output for the same
// input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  human_auth: {
    passkeys_preferred: "boolean",
    mfa_enforced_for_admin: "boolean",
    mfa_enforced_for_sensitive_ops: "boolean",
    passwords_used: "boolean",
    passwords_hashed_strong: "boolean",
    passwords_long_not_complex: "boolean",
    shared_accounts_present: "boolean",
  },
  sessions: {
    secure_httponly_samesite_cookies: "boolean",
    rotate_on_login_and_privilege_change: "boolean",
    expiry_defined: "boolean",
    server_side_revocation_works: "boolean",
  },
  oauth: {
    oauth_used: "boolean",
    authorization_code_pkce: "boolean",
    exact_redirect_allowlists: "boolean",
    iss_aud_exp_validated: "boolean",
    implicit_flow_used: "boolean",
    refresh_tokens_rotated: "boolean",
  },
  service_tokens: {
    short_lived: "boolean",
    scoped: "boolean",
    audience_bound: "boolean",
    jit_over_long_lived_keys: "boolean",
    rotation_revocation_tested: "boolean",
    lifetimes_and_scopes_documented: "boolean",
    long_lived_unrevocable_credentials_present: "boolean",
  },
  authorization: {
    server_side_checks_per_endpoint: "boolean",
    rbac_coarse: "boolean",
    abac_fine: "boolean",
    deny_by_default: "boolean",
    client_side_only_authorization: "boolean",
    hand_rolled_crypto_or_protocols: "boolean",
  },
  lifecycle: {
    provisioning_reviewed: "boolean",
    deprovisioning_checklist_exists: "boolean",
    deprovisioning_exercised: "boolean",
    access_reviews_scheduled_for_admin: "boolean",
  },
  anti_abuse: {
    login_rate_limited: "boolean",
    token_endpoints_rate_limited: "boolean",
    lockout_balanced_no_user_dos: "boolean",
    anomaly_alerting: "boolean",
  },
  audit: {
    authn_events_logged: "boolean",
    authz_denials_logged: "boolean",
    permission_changes_logged: "boolean",
    logs_include_actor_and_context: "boolean",
  },
};

export const SECTIONS = [
  "human_authentication",
  "sessions",
  "oauth_and_oidc",
  "service_tokens",
  "authorization",
  "lifecycle",
  "anti_abuse_and_audit",
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedFalseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === false, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: human_authentication ----
  boolCheck(results, "human_authentication", "passkeys_preferred",
    manifest, ["human_auth", "passkeys_preferred"],
    "method 1: passkeys / WebAuthn are the preferred human authenticator — strong first");
  boolCheck(results, "human_authentication", "mfa_enforced_for_admin",
    manifest, ["human_auth", "mfa_enforced_for_admin"],
    "method 1 / quality gate: MFA or passkey is enforced for admin surfaces");
  boolCheck(results, "human_authentication",
    "mfa_enforced_for_sensitive_ops",
    manifest, ["human_auth", "mfa_enforced_for_sensitive_ops"],
    "method 1: MFA is enforced for sensitive operations");
  gatedBoolCheck(results, "human_authentication",
    "passwords_hashed_strong_when_used", manifest,
    ["human_auth", "passwords_used"],
    ["human_auth", "passwords_hashed_strong"],
    "method 1: passwords in use are hashed with Argon2id (or bcrypt, cost-tuned)",
    "no passwords declared in use");
  gatedBoolCheck(results, "human_authentication",
    "passwords_long_not_complex_when_used", manifest,
    ["human_auth", "passwords_used"],
    ["human_auth", "passwords_long_not_complex"],
    "method 1: passwords in use are long, not complex",
    "no passwords declared in use");
  falseCheck(results, "human_authentication", "no_shared_accounts",
    manifest, ["human_auth", "shared_accounts_present"],
    "quality gate: no shared accounts");

  // ---- Section 2: sessions ----
  boolCheck(results, "sessions", "secure_httponly_samesite_cookies",
    manifest, ["sessions", "secure_httponly_samesite_cookies"],
    "method 2: session cookies are Secure, HttpOnly and SameSite");
  boolCheck(results, "sessions",
    "sessions_rotate_on_privilege_change",
    manifest, ["sessions", "rotate_on_login_and_privilege_change"],
    "method 2: sessions rotate on login and on privilege change");
  boolCheck(results, "sessions", "session_expiry_defined",
    manifest, ["sessions", "expiry_defined"],
    "method 2: sessions expire sensibly — an expiry is defined");
  boolCheck(results, "sessions", "server_side_revocation_works",
    manifest, ["sessions", "server_side_revocation_works"],
    "method 2: the server-side revocation list works");

  // ---- Section 3: oauth_and_oidc ----
  gatedBoolCheck(results, "oauth_and_oidc",
    "authorization_code_with_pkce", manifest,
    ["oauth", "oauth_used"], ["oauth", "authorization_code_pkce"],
    "method 3: the authorization code flow with PKCE is used",
    "no OAuth/OIDC declared in use");
  gatedBoolCheck(results, "oauth_and_oidc",
    "exact_redirect_allowlists", manifest,
    ["oauth", "oauth_used"], ["oauth", "exact_redirect_allowlists"],
    "method 3: redirect URIs are held to exact allowlists",
    "no OAuth/OIDC declared in use");
  gatedBoolCheck(results, "oauth_and_oidc", "iss_aud_exp_validated",
    manifest,
    ["oauth", "oauth_used"], ["oauth", "iss_aud_exp_validated"],
    "method 3: iss, aud and exp claims are validated",
    "no OAuth/OIDC declared in use");
  gatedFalseCheck(results, "oauth_and_oidc", "implicit_flow_not_used",
    manifest,
    ["oauth", "oauth_used"], ["oauth", "implicit_flow_used"],
    "method 3: no implicit flow",
    "no OAuth/OIDC declared in use");
  gatedBoolCheck(results, "oauth_and_oidc", "refresh_tokens_rotated",
    manifest,
    ["oauth", "oauth_used"], ["oauth", "refresh_tokens_rotated"],
    "method 3: refresh tokens are rotated — sender-constrained where possible",
    "no OAuth/OIDC declared in use");

  // ---- Section 4: service_tokens ----
  boolCheck(results, "service_tokens", "tokens_short_lived",
    manifest, ["service_tokens", "short_lived"],
    "method 4: service tokens are short-lived");
  boolCheck(results, "service_tokens", "tokens_scoped",
    manifest, ["service_tokens", "scoped"],
    "method 4: service tokens are scoped");
  boolCheck(results, "service_tokens", "tokens_audience_bound",
    manifest, ["service_tokens", "audience_bound"],
    "method 4: service tokens are audience-bound");
  boolCheck(results, "service_tokens",
    "jit_issuance_over_long_lived_keys",
    manifest, ["service_tokens", "jit_over_long_lived_keys"],
    "method 4: just-in-time issuance is preferred over long-lived keys");
  boolCheck(results, "service_tokens", "rotation_revocation_tested",
    manifest, ["service_tokens", "rotation_revocation_tested"],
    "method 4 / quality gate: rotate and revoke paths are tested — revocation tested");
  boolCheck(results, "service_tokens",
    "lifetimes_and_scopes_documented",
    manifest, ["service_tokens", "lifetimes_and_scopes_documented"],
    "quality gate: token lifetimes and scopes are documented");
  falseCheck(results, "service_tokens",
    "no_long_lived_unrevocable_credentials",
    manifest,
    ["service_tokens", "long_lived_unrevocable_credentials_present"],
    "red line: no long-lived unrevocable credentials");

  // ---- Section 5: authorization ----
  boolCheck(results, "authorization",
    "server_side_checks_per_endpoint",
    manifest, ["authorization", "server_side_checks_per_endpoint"],
    "method 5 / quality gate: authorization is server-side, always — every endpoint performs a server-side permission check");
  boolCheck(results, "authorization", "rbac_for_coarse",
    manifest, ["authorization", "rbac_coarse"],
    "method 5: RBAC roles cover coarse-grained authorization");
  boolCheck(results, "authorization", "abac_for_fine",
    manifest, ["authorization", "abac_fine"],
    "method 5: ABAC / policies (OPA-style) cover fine-grained authorization");
  boolCheck(results, "authorization", "deny_by_default",
    manifest, ["authorization", "deny_by_default"],
    "method 5: deny by default — never trust the UI");
  falseCheck(results, "authorization",
    "no_client_side_only_authorization",
    manifest, ["authorization", "client_side_only_authorization"],
    "red line: no client-side-only authorization");
  falseCheck(results, "authorization",
    "no_hand_rolled_crypto_or_protocols",
    manifest, ["authorization", "hand_rolled_crypto_or_protocols"],
    "red line: no hand-rolled crypto or auth protocols");

  // ---- Section 6: lifecycle ----
  boolCheck(results, "lifecycle", "provisioning_reviewed",
    manifest, ["lifecycle", "provisioning_reviewed"],
    "method 6: provisioning is reviewed");
  boolCheck(results, "lifecycle", "deprovisioning_checklist_exists",
    manifest, ["lifecycle", "deprovisioning_checklist_exists"],
    "method 6 / quality gate: deprovisioning is a checklist — tokens revoked, keys rotated — and the runbook exists");
  boolCheck(results, "lifecycle", "deprovisioning_exercised",
    manifest, ["lifecycle", "deprovisioning_exercised"],
    "quality gate: the deprovisioning runbook was exercised once");
  boolCheck(results, "lifecycle",
    "access_reviews_scheduled_for_admin",
    manifest, ["lifecycle", "access_reviews_scheduled_for_admin"],
    "method 6: access reviews run on schedule for admin surfaces");

  // ---- Section 7: anti_abuse_and_audit ----
  boolCheck(results, "anti_abuse_and_audit",
    "login_endpoints_rate_limited",
    manifest, ["anti_abuse", "login_rate_limited"],
    "method 7: login endpoints are rate-limited");
  boolCheck(results, "anti_abuse_and_audit",
    "token_endpoints_rate_limited",
    manifest, ["anti_abuse", "token_endpoints_rate_limited"],
    "method 7: token endpoints are rate-limited");
  boolCheck(results, "anti_abuse_and_audit",
    "lockout_balanced_no_user_dos",
    manifest, ["anti_abuse", "lockout_balanced_no_user_dos"],
    "method 7: lockout policies are balanced — no user-lockout denial of service");
  boolCheck(results, "anti_abuse_and_audit", "anomaly_alerting",
    manifest, ["anti_abuse", "anomaly_alerting"],
    "method 7: anomalies alert — new geography, spikes");
  boolCheck(results, "anti_abuse_and_audit", "authn_events_logged",
    manifest, ["audit", "authn_events_logged"],
    "method 8: authentication events — success and failure — are logged");
  boolCheck(results, "anti_abuse_and_audit", "authz_denials_logged",
    manifest, ["audit", "authz_denials_logged"],
    "method 8: authorization denials are logged");
  boolCheck(results, "anti_abuse_and_audit",
    "permission_changes_logged",
    manifest, ["audit", "permission_changes_logged"],
    "method 8: permission changes are logged");
  boolCheck(results, "anti_abuse_and_audit",
    "logs_include_actor_and_context",
    manifest, ["audit", "logs_include_actor_and_context"],
    "method 8: auth logs carry actor and context");

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
    verdict = "AUTH_DESIGN_DEFICIENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "AUTH_DESIGN_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "auth-design-review",
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
    "AUTH DESIGN REVIEW",
    `system: ${pyStr(verdict.system ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
