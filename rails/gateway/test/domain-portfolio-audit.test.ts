import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/domain-portfolio-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DOMAIN_PORTFOLIO_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  portfolio: "personal-brand-estate",
  evaluation_date: "2026-11-15",
  inventory: { inventory_current: true,
               single_source_of_truth: true,
               version_controlled: true,
               secrets_in_inventory_present: false },
  brand_architecture: { redirect_map_as_code: true,
                        redirect_map_reviewed_in_diffs: true },
  domains: [
    { name: "example.com", registrar: "Cloudflare",
      renewal_date: "2027-08-20", status: "active",
      purpose: "primary brand site", owner: "owner",
      brand_cluster: "example-brand", is_canonical: true,
      is_personal_brand: true, sends_email: true,
      spf_declared: true, dkim_declared: true, dmarc_declared: true,
      registrar_lock: true, auto_renew: true },
    { name: "example.org", registrar: "Cloudflare",
      renewal_date: "2027-05-01", status: "redirect",
      purpose: "variant spelling", owner: "owner",
      brand_cluster: "example-brand", is_canonical: false,
      is_personal_brand: false, redirect_target: "example.com",
      redirect_status_code: 301, sends_email: false },
    { name: "example.net", registrar: "Namecheap",
      renewal_date: "2026-12-20", status: "parked",
      purpose: "defensive registration", owner: "owner",
      brand_cluster: "example-brand", is_canonical: false,
      is_personal_brand: false, sends_email: false,
      spoofing_blocked: true },
  ],
  dns: { zones_version_controlled: true,
         ttl_policy_defined: true,
         wildcard_dns_present: true,
         wildcard_justification_documented: true,
         change_protocol_followed: true,
         silent_changes_present: false },
  redirects: { redirect_map_tested: true },
  email_auth: { dmarc_monitoring_rua_configured: true,
                dmarc_progression_toward_quarantine: true,
                tested_after_dns_changes: true },
  tls: { certs_auto_renew: true,
         hsts_enabled_once_stable: true,
         changes_dual_verified: true,
         cert_expiry_monitored: true,
         uptime_and_redirect_chains_monitored: true,
         wildcard_dns_and_cert_combo_without_review_present: false },
  renewals: { alerts_configured: true,
              alert_window_days: 90,
              payment_method_expiry_tracked: true,
              expiry_monitors_live: true },
  audit: { quarterly_audit_executed: true,
           quarterly_audit_logged: true,
           dead_redirects_checked: true,
           dangling_dns_records_checked: true,
           dmarc_reports_reviewed: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 31 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 44);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.domains_count, 3);
  assert.deepEqual(v.domains_without_purpose, []);
  assert.equal(v.purpose_coverage, "1.0000");
  assert.equal(v.email_auth_coverage, "1.0000");
  assert.deepEqual(v.domains_missing_email_auth, []);
  assert.deepEqual(v.domains_lapsed, []);
  assert.deepEqual(v.domains_within_alert_window, ["example.net"]);
  assert.equal(v.nearest_renewal_days, 35);
  assert.deepEqual(v.redirect_loop_domains, []);
});

test("test_inventory_not_current_fails_inventory_section", () => {
  const m = clone(COMPLETE) as any;
  m.inventory.inventory_current = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(v.sections["inventory_and_brand_architecture"], "fail");
});

test("test_secrets_in_inventory_fail", () => {
  const m = clone(COMPLETE) as any;
  m.inventory.secrets_in_inventory_present = true;
  assert.equal(evaluate(m).verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_domain_without_purpose_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].purpose = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(checkStatus(v, "every_domain_has_purpose"), "fail");
  assert.deepEqual(v.domains_without_purpose, ["example.org"]);
  assert.equal(v.purpose_coverage, "0.6667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_domain_missing_purpose_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.domains[0].purpose;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_domain_has_purpose"), "missing");
  assert.deepEqual(v.domains_without_purpose, ["example.com"]);
});

test("test_empty_domains_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "domains_declared"), "fail");
  assert.equal(v.domains_count, 0);
  assert.equal(v.purpose_coverage, null);
  assert.equal(v.email_auth_coverage, null);
});

test("test_two_canonicals_in_cluster_fail", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].is_canonical = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(checkStatus(v, "exactly_one_canonical_per_brand_cluster"), "fail");
});

test("test_no_canonical_in_cluster_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].is_canonical = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "exactly_one_canonical_per_brand_cluster"), "fail");
});

test("test_wildcard_without_justification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dns.wildcard_justification_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(checkStatus(v, "wildcard_dns_justified_when_present"), "fail");
});

test("test_no_wildcard_passes_justification_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.dns.wildcard_dns_present = false;
  delete m.dns.wildcard_justification_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_SOUND");
  assert.equal(checkStatus(v, "wildcard_dns_justified_when_present"), "pass");
});

test("test_silent_dns_changes_fail", () => {
  const m = clone(COMPLETE) as any;
  m.dns.silent_changes_present = true;
  assert.equal(evaluate(m).verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_redirect_without_target_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].redirect_target = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(checkStatus(v, "every_redirect_domain_declares_target"), "fail");
});

test("test_redirect_missing_target_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.domains[1].redirect_target;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_redirect_domain_declares_target"), "missing");
});

test("test_redirect_with_302_fails_301_check", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].redirect_status_code = 302;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_redirect_uses_301"), "fail");
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_redirect_loop_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].status = "redirect";
  m.domains[0].redirect_target = "example.org";
  m.domains[0].redirect_status_code = 301;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(checkStatus(v, "no_redirect_loops"), "fail");
  assert.equal(checkStatus(v, "redirect_chains_at_most_two_hops"), "fail");
  assert.deepEqual(v.redirect_loop_domains, ["example.com", "example.org"]);
});

test("test_redirect_chain_beyond_two_hops_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains.push(
    { name: "example.io", registrar: "Cloudflare",
      renewal_date: "2027-01-15", status: "redirect",
      purpose: "short link", owner: "owner",
      brand_cluster: "example-brand", is_canonical: false,
      is_personal_brand: false, redirect_target: "example.org",
      redirect_status_code: 301, sends_email: false });
  m.domains.push(
    { name: "example.co", registrar: "Cloudflare",
      renewal_date: "2027-02-15", status: "redirect",
      purpose: "typo variant", owner: "owner",
      brand_cluster: "example-brand", is_canonical: false,
      is_personal_brand: false, redirect_target: "example.io",
      redirect_status_code: 301, sends_email: false });
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_redirect_loops"), "pass");
  assert.equal(checkStatus(v, "redirect_chains_at_most_two_hops"), "fail");
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_sending_domain_without_dmarc_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].dmarc_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(v.sections["email_authentication_and_tls"], "fail");
  assert.equal(checkStatus(v, "every_sending_domain_has_dmarc"), "fail");
  assert.deepEqual(v.domains_missing_email_auth, ["example.com"]);
  assert.equal(v.email_auth_coverage, "0.0000");
});

test("test_sending_domain_missing_spf_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.domains[0].spf_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_sending_domain_has_spf"), "missing");
  assert.deepEqual(v.domains_missing_email_auth, []);
});

test("test_parked_domain_without_spoofing_block_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains[2].spoofing_blocked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "parked_domains_block_spoofing"), "fail");
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_unreviewed_wildcard_combo_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tls.wildcard_dns_and_cert_combo_without_review_present = true;
  assert.equal(evaluate(m).verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_lapsed_domain_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.domains[2].renewal_date = "2026-10-01";
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(v.sections["renewals_and_audit"], "fail");
  assert.equal(checkStatus(v, "every_domain_renewal_not_lapsed"), "fail");
  assert.deepEqual(v.domains_lapsed, ["example.net"]);
  assert.equal(v.nearest_renewal_days, -45);
  assert.deepEqual(v.domains_within_alert_window, []);
});

test("test_invalid_renewal_date_string_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].renewal_date = "next spring";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_domain_renewal_not_lapsed"), "fail");
});

test("test_missing_evaluation_date_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.evaluation_date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_domain_renewal_not_lapsed"), "missing");
  assert.equal(v.domains_lapsed, null);
  assert.equal(v.nearest_renewal_days, null);
  assert.equal(v.domains_within_alert_window, null);
});

test("test_alert_window_absent_nulls_window_list_only", () => {
  const m = clone(COMPLETE) as any;
  delete m.renewals.alert_window_days;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_SOUND");
  assert.equal(v.domains_within_alert_window, null);
  assert.equal(v.nearest_renewal_days, 35);
});

test("test_personal_brand_without_lock_fails", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].registrar_lock = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "personal_brand_domains_lock_and_auto_renew"), "fail");
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
});

test("test_personal_brand_missing_auto_renew_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.domains[0].auto_renew;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "personal_brand_domains_lock_and_auto_renew"), "missing");
});

test("test_quarterly_audit_not_logged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.audit.quarterly_audit_logged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOMAIN_PORTFOLIO_NOT_SOUND");
  assert.equal(v.sections["renewals_and_audit"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.audit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["renewals_and_audit"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.domains_count, null);
  assert.equal(v.domains_without_purpose, null);
  assert.equal(v.purpose_coverage, null);
  assert.equal(v.email_auth_coverage, null);
  assert.equal(v.domains_missing_email_auth, null);
  assert.equal(v.domains_lapsed, null);
  assert.equal(v.domains_within_alert_window, null);
  assert.equal(v.nearest_renewal_days, null);
  assert.equal(v.redirect_loop_domains, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DOMAIN_PORTFOLIO_SOUND"));
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
  m.portfolio = 12345;
  assert.throws(() => evaluate(m), fieldError("portfolio"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ dns: "should-be-an-object" }),
    fieldError("dns"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ domains: { name: "example.com" } }),
    fieldError("domains"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ domains: ["example.com"] }),
    fieldError("domains[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.inventory.inventory_current = "yes";
  assert.throws(() => evaluate(m), fieldError("inventory.inventory_current"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].redirect_target = 42;
  assert.throws(() => evaluate(m), fieldError("domains[1].redirect_target"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.domains[0].spf_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("domains[0].spf_declared"));
});

test("malformed: redirect status code as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].redirect_status_code = "301";
  assert.throws(() => evaluate(m), fieldError("domains[1].redirect_status_code"));
});

test("malformed: redirect status code as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.domains[1].redirect_status_code = true;
  assert.throws(() => evaluate(m), fieldError("domains[1].redirect_status_code"));
});

test("malformed: alert window as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.renewals.alert_window_days = "90";
  assert.throws(() => evaluate(m), fieldError("renewals.alert_window_days"));
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
  .filter((f) => f.startsWith("domain-portfolio-audit--") && f.endsWith(".json"))
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
