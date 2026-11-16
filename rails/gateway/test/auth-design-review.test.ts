import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/auth-design-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The AUTH_DESIGN_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  system: "customer-portal",
  human_auth: { passkeys_preferred: true,
                mfa_enforced_for_admin: true,
                mfa_enforced_for_sensitive_ops: true,
                passwords_used: true,
                passwords_hashed_strong: true,
                passwords_long_not_complex: true,
                shared_accounts_present: false },
  sessions: { secure_httponly_samesite_cookies: true,
              rotate_on_login_and_privilege_change: true,
              expiry_defined: true,
              server_side_revocation_works: true },
  oauth: { oauth_used: true,
           authorization_code_pkce: true,
           exact_redirect_allowlists: true,
           iss_aud_exp_validated: true,
           implicit_flow_used: false,
           refresh_tokens_rotated: true },
  service_tokens: { short_lived: true,
                    scoped: true,
                    audience_bound: true,
                    jit_over_long_lived_keys: true,
                    rotation_revocation_tested: true,
                    lifetimes_and_scopes_documented: true,
                    long_lived_unrevocable_credentials_present: false },
  authorization: { server_side_checks_per_endpoint: true,
                   rbac_coarse: true,
                   abac_fine: true,
                   deny_by_default: true,
                   client_side_only_authorization: false,
                   hand_rolled_crypto_or_protocols: false },
  lifecycle: { provisioning_reviewed: true,
               deprovisioning_checklist_exists: true,
               deprovisioning_exercised: true,
               access_reviews_scheduled_for_admin: true },
  anti_abuse: { login_rate_limited: true,
                token_endpoints_rate_limited: true,
                lockout_balanced_no_user_dos: true,
                anomaly_alerting: true },
  audit: { authn_events_logged: true,
           authz_denials_logged: true,
           permission_changes_logged: true,
           logs_include_actor_and_context: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 24 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "AUTH_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 40);
});

test("test_no_mfa_for_admin_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.human_auth.mfa_enforced_for_admin = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(v.sections["human_authentication"], "fail");
});

test("test_shared_accounts_fail_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.human_auth.shared_accounts_present = true;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_passwords_weakly_hashed_fail_when_used", () => {
  const m = clone(COMPLETE) as any;
  m.human_auth.passwords_hashed_strong = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(checkStatus(v, "passwords_hashed_strong_when_used"), "fail");
});

test("test_no_passwords_passes_password_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.human_auth.passwords_used = false;
  delete m.human_auth.passwords_hashed_strong;
  delete m.human_auth.passwords_long_not_complex;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_SOUND");
  assert.equal(checkStatus(v, "passwords_hashed_strong_when_used"), "pass");
});

test("test_password_check_missing_when_passwords_used", () => {
  const m = clone(COMPLETE) as any;
  delete m.human_auth.passwords_long_not_complex;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "passwords_long_not_complex_when_used"), "missing");
});

test("test_sessions_not_rotated_fail", () => {
  const m = clone(COMPLETE) as any;
  m.sessions.rotate_on_login_and_privilege_change = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_revocation_not_working_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sessions.server_side_revocation_works = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_implicit_flow_fails_when_oauth_used", () => {
  const m = clone(COMPLETE) as any;
  m.oauth.implicit_flow_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(v.sections["oauth_and_oidc"], "fail");
  assert.equal(checkStatus(v, "implicit_flow_not_used"), "fail");
});

test("test_no_pkce_fails_when_oauth_used", () => {
  const m = clone(COMPLETE) as any;
  m.oauth.authorization_code_pkce = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_no_oauth_passes_oauth_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.oauth.oauth_used = false;
  delete m.oauth.authorization_code_pkce;
  delete m.oauth.exact_redirect_allowlists;
  delete m.oauth.iss_aud_exp_validated;
  delete m.oauth.implicit_flow_used;
  delete m.oauth.refresh_tokens_rotated;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_SOUND");
  assert.equal(checkStatus(v, "authorization_code_with_pkce"), "pass");
});

test("test_long_lived_unrevocable_credentials_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.service_tokens.long_lived_unrevocable_credentials_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(v.sections["service_tokens"], "fail");
});

test("test_revocation_untested_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.service_tokens.rotation_revocation_tested = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_endpoint_without_server_side_check_fails", () => {
  const m = clone(COMPLETE) as any;
  m.authorization.server_side_checks_per_endpoint = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(v.sections["authorization"], "fail");
});

test("test_client_side_only_authorization_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.authorization.client_side_only_authorization = true;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_hand_rolled_crypto_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.authorization.hand_rolled_crypto_or_protocols = true;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_allow_by_default_fails", () => {
  const m = clone(COMPLETE) as any;
  m.authorization.deny_by_default = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_deprovisioning_never_exercised_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.lifecycle.deprovisioning_exercised = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTH_DESIGN_DEFICIENT");
  assert.equal(v.sections["lifecycle"], "fail");
});

test("test_login_not_rate_limited_fails", () => {
  const m = clone(COMPLETE) as any;
  m.anti_abuse.login_rate_limited = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_authz_denials_not_logged_fail", () => {
  const m = clone(COMPLETE) as any;
  m.audit.authz_denials_logged = false;
  assert.equal(evaluate(m).verdict, "AUTH_DESIGN_DEFICIENT");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.sessions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sessions"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: AUTH_DESIGN_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.system = 12345;
  assert.throws(() => evaluate(m), fieldError("system"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ sessions: "should-be-an-object" }),
    fieldError("sessions"),
  );
});

test("malformed: section as list rejected", () => {
  assert.throws(
    () => evaluate({ oauth: ["not", "an", "object"] }),
    fieldError("oauth"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.human_auth.mfa_enforced_for_admin = "yes";
  assert.throws(() => evaluate(m), fieldError("human_auth.mfa_enforced_for_admin"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sessions.expiry_defined = 30;
  assert.throws(() => evaluate(m), fieldError("sessions.expiry_defined"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.audit = null;
  assert.throws(() => evaluate(m), fieldError("audit"));
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
  .filter((f) => f.startsWith("auth-design-review--") && f.endsWith(".json"))
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
