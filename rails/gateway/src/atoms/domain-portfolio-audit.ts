// Domain portfolio audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/domain-portfolio-audit/src/domain_portfolio_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  portfolio: "string",
  evaluation_date: "string",
  inventory: {
    inventory_current: "boolean",
    single_source_of_truth: "boolean",
    version_controlled: "boolean",
    secrets_in_inventory_present: "boolean",
  },
  brand_architecture: {
    redirect_map_as_code: "boolean",
    redirect_map_reviewed_in_diffs: "boolean",
  },
  domains: [{
    name: "string",
    registrar: "string",
    renewal_date: "string",
    status: "string",
    purpose: "string",
    owner: "string",
    brand_cluster: "string",
    is_canonical: "boolean",
    is_personal_brand: "boolean",
    redirect_target: "string",
    redirect_status_code: "number",
    sends_email: "boolean",
    spf_declared: "boolean",
    dkim_declared: "boolean",
    dmarc_declared: "boolean",
    spoofing_blocked: "boolean",
    registrar_lock: "boolean",
    auto_renew: "boolean",
  }],
  dns: {
    zones_version_controlled: "boolean",
    ttl_policy_defined: "boolean",
    wildcard_dns_present: "boolean",
    wildcard_justification_documented: "boolean",
    change_protocol_followed: "boolean",
    silent_changes_present: "boolean",
  },
  redirects: {
    redirect_map_tested: "boolean",
  },
  email_auth: {
    dmarc_monitoring_rua_configured: "boolean",
    dmarc_progression_toward_quarantine: "boolean",
    tested_after_dns_changes: "boolean",
  },
  tls: {
    certs_auto_renew: "boolean",
    hsts_enabled_once_stable: "boolean",
    changes_dual_verified: "boolean",
    cert_expiry_monitored: "boolean",
    uptime_and_redirect_chains_monitored: "boolean",
    wildcard_dns_and_cert_combo_without_review_present: "boolean",
  },
  renewals: {
    alerts_configured: "boolean",
    alert_window_days: "number",
    payment_method_expiry_tracked: "boolean",
    expiry_monitors_live: "boolean",
  },
  audit: {
    quarterly_audit_executed: "boolean",
    quarterly_audit_logged: "boolean",
    dead_redirects_checked: "boolean",
    dangling_dns_records_checked: "boolean",
    dmarc_reports_reviewed: "boolean",
  },
};

export const SECTIONS = [
  "inventory_and_brand_architecture",
  "dns_and_redirects",
  "email_authentication_and_tls",
  "renewals_and_audit",
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
  portfolio: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  domains_count: number | null;
  domains_without_purpose: string[] | null;
  purpose_coverage: string | null;
  email_auth_coverage: string | null;
  domains_missing_email_auth: string[] | null;
  domains_lapsed: string[] | null;
  domains_within_alert_window: string[] | null;
  nearest_renewal_days: number | null;
  redirect_loop_domains: string[] | null;
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

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
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

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Strict YYYY-MM-DD parse to UTC epoch-days; null when invalid.
 *  Mirrors the Python oracle's _parse_date + date arithmetic. */
function parseDateDays(value: unknown): number | null {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const ms = Date.UTC(year, month - 1, day);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day) {
    return null;
  }
  return ms / 86400000;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [domainsRaw, hasDomains] = getPath(manifest, "domains");
  const domainsIsList = hasDomains && Array.isArray(domainsRaw);
  const rows: unknown[] = domainsIsList ? (domainsRaw as unknown[]) : [];
  const domainsCount: number | null = domainsIsList ? rows.length : null;

  const [evaluationRaw, hasEvaluation] = getPath(manifest, "evaluation_date");
  const evaluationDays: number | null = hasEvaluation
    ? parseDateDays(evaluationRaw)
    : null;

  const [alertWindowRaw, hasAlertWindow] =
    getPath(manifest, "renewals", "alert_window_days");
  const alertWindowValid = hasAlertWindow &&
    typeof alertWindowRaw === "number";
  const alertWindow = alertWindowValid ? (alertWindowRaw as number) : 0;

  function daysUntil(entry: unknown): number | null {
    if (evaluationDays === null || !isPyDict(entry)) return null;
    const renewal = parseDateDays(entry["renewal_date"]);
    if (renewal === null) return null;
    return renewal - evaluationDays;
  }

  const daysList: (number | null)[] = domainsIsList
    ? rows.map(daysUntil)
    : [];
  const computableDays = daysList.filter(
    (d): d is number => d !== null);
  const nearestRenewalDays: number | null = computableDays.length > 0
    ? Math.min(...computableDays)
    : null;
  const domainsLapsed: string[] | null =
    domainsIsList && evaluationDays !== null
      ? rows.filter((_, i) => daysList[i] !== null &&
          (daysList[i] as number) < 0).map(rowName)
      : null;
  const domainsWithinAlertWindow: string[] | null =
    domainsIsList && evaluationDays !== null && alertWindowValid
      ? rows.filter((_, i) => daysList[i] !== null &&
          (daysList[i] as number) >= 0 &&
          (daysList[i] as number) <= alertWindow).map(rowName)
      : null;

  const domainsWithoutPurpose: string[] | null = domainsIsList
    ? rows.filter((d) => !nonemptyStr(d, "purpose")).map(rowName)
    : null;
  const purposeCoverage: number | null =
    domainsIsList && domainsCount !== null && domainsCount > 0 &&
      domainsWithoutPurpose !== null
      ? (domainsCount - domainsWithoutPurpose.length) / domainsCount
      : null;

  const sendingRows = rows.filter(
    (d) => isPyDict(d) && d["sends_email"] === true);

  function authComplete(entry: Record<string, unknown>): boolean {
    return entry["spf_declared"] === true &&
      entry["dkim_declared"] === true &&
      entry["dmarc_declared"] === true;
  }

  const emailAuthCoverage: number | null =
    domainsIsList && sendingRows.length > 0
      ? sendingRows.filter((d) => authComplete(d as Record<string, unknown>)).length /
        sendingRows.length
      : null;
  const domainsMissingEmailAuth: string[] | null = domainsIsList
    ? sendingRows.filter((d) =>
        ["spf_declared", "dkim_declared", "dmarc_declared"]
          .every((f) => hasField(d, f)) &&
        !authComplete(d as Record<string, unknown>)).map(rowName)
    : null;

  // Redirect graph over declared domains.
  const byName = new Map<string, Record<string, unknown>>();
  for (const d of rows) {
    if (isPyDict(d) && typeof d["name"] === "string") {
      byName.set(d["name"] as string, d);
    }
  }

  function follow(startName: string): [number, boolean] {
    const seen: string[] = [];
    let current = startName;
    let hops = 0;
    for (;;) {
      if (seen.includes(current)) return [hops, true];
      seen.push(current);
      const row = byName.get(current);
      if (!row || row["status"] !== "redirect") return [hops, false];
      const target = row["redirect_target"];
      if (typeof target !== "string" || target.length === 0) {
        return [hops, false];
      }
      hops += 1;
      if (!byName.has(target)) return [hops, false];
      current = target;
    }
  }

  const loopDomains: string[] = [];
  let maxChainHops = 0;
  if (domainsIsList) {
    for (const d of rows) {
      if (isPyDict(d) && d["status"] === "redirect" &&
        typeof d["name"] === "string") {
        const [hops, looped] = follow(d["name"] as string);
        if (looped) {
          if (!loopDomains.includes(rowName(d))) {
            loopDomains.push(rowName(d));
          }
        } else if (hops > maxChainHops) {
          maxChainHops = hops;
        }
      }
    }
  }
  const redirectLoopDomains: string[] | null = domainsIsList
    ? loopDomains
    : null;

  // ---- Section 1: inventory_and_brand_architecture ----
  boolCheck(results, "inventory_and_brand_architecture",
    "inventory_current", manifest,
    ["inventory", "inventory_current"],
    "inventory: the inventory is current — one table as the single source of truth for the whole portfolio");
  boolCheck(results, "inventory_and_brand_architecture",
    "inventory_single_source_of_truth", manifest,
    ["inventory", "single_source_of_truth"],
    "inventory: the inventory is the single source of truth — domain, registrar, renewal date, DNS host, purpose/status, target, owner notes");
  boolCheck(results, "inventory_and_brand_architecture",
    "inventory_version_controlled", manifest,
    ["inventory", "version_controlled"],
    "inventory: the inventory is versioned in the repo");
  falseCheck(results, "inventory_and_brand_architecture",
    "no_secrets_in_inventory", manifest,
    ["inventory", "secrets_in_inventory_present"],
    "inventory / red line: no credentials or registrar secrets in the inventory, ever");
  check(results, "inventory_and_brand_architecture", "domains_declared",
    domainsRaw, domainsIsList,
    domainsIsList && (domainsCount as number) > 0,
    "inventory: the declared portfolio record names its domains — the domains list is present and non-empty");
  const purposePresent = domainsIsList &&
    rows.every((d) => hasField(d, "purpose"));
  check(results, "inventory_and_brand_architecture",
    "every_domain_has_purpose", domainsRaw, purposePresent,
    domainsIsList && (domainsCount as number) > 0 &&
      domainsWithoutPurpose !== null &&
      domainsWithoutPurpose.length === 0,
    "quality gate: every declared domain row names a purpose — a non-empty purpose string");
  const ownerPresent = domainsIsList &&
    rows.every((d) => hasField(d, "owner"));
  const domainsWithoutOwner: string[] | null = domainsIsList
    ? rows.filter((d) => !nonemptyStr(d, "owner")).map(rowName)
    : null;
  check(results, "inventory_and_brand_architecture",
    "every_domain_has_owner", domainsRaw, ownerPresent,
    domainsIsList && (domainsCount as number) > 0 &&
      domainsWithoutOwner !== null && domainsWithoutOwner.length === 0,
    "quality gate: every declared domain row names an owner — a non-empty owner string");
  const registrarPresent = domainsIsList &&
    rows.every((d) => hasField(d, "registrar"));
  const domainsWithoutRegistrar: string[] | null = domainsIsList
    ? rows.filter((d) => !nonemptyStr(d, "registrar")).map(rowName)
    : null;
  check(results, "inventory_and_brand_architecture",
    "every_domain_has_registrar", domainsRaw, registrarPresent,
    domainsIsList && (domainsCount as number) > 0 &&
      domainsWithoutRegistrar !== null &&
      domainsWithoutRegistrar.length === 0,
    "inventory: every declared domain row names its registrar — a non-empty registrar string");
  const canonicalPresent = domainsIsList &&
    rows.every((d) => hasField(d, "brand_cluster") &&
      hasField(d, "is_canonical"));
  function canonicalOk(): boolean {
    if (!domainsIsList || domainsCount === 0) return false;
    const clusters = new Map<string, number>();
    for (const d of rows) {
      if (!nonemptyStr(d, "brand_cluster")) return false;
      const cluster = (d as Record<string, unknown>)["brand_cluster"] as string;
      if (!clusters.has(cluster)) clusters.set(cluster, 0);
      if ((d as Record<string, unknown>)["is_canonical"] === true) {
        clusters.set(cluster, (clusters.get(cluster) as number) + 1);
      }
    }
    return [...clusters.values()].every((count) => count === 1);
  }
  check(results, "inventory_and_brand_architecture",
    "exactly_one_canonical_per_brand_cluster", domainsRaw,
    canonicalPresent, canonicalOk(),
    "brand architecture: exactly one canonical domain per brand cluster — every declared domain names its brand cluster, and each cluster declares exactly one canonical domain");
  boolCheck(results, "inventory_and_brand_architecture",
    "redirect_map_kept_as_code", manifest,
    ["brand_architecture", "redirect_map_as_code"],
    "brand architecture: the redirect map is kept as code");
  boolCheck(results, "inventory_and_brand_architecture",
    "redirect_map_reviewed_in_diffs", manifest,
    ["brand_architecture", "redirect_map_reviewed_in_diffs"],
    "brand architecture: the redirect map is reviewed in diffs");

  // ---- Section 2: dns_and_redirects ----
  boolCheck(results, "dns_and_redirects",
    "dns_zones_version_controlled", manifest,
    ["dns", "zones_version_controlled"],
    "DNS as code: zones are exported to files under version control");
  boolCheck(results, "dns_and_redirects", "ttl_policy_defined",
    manifest, ["dns", "ttl_policy_defined"],
    "DNS as code: a TTL policy is defined — low before changes, raised after stable");
  gatedBoolCheck(results, "dns_and_redirects",
    "wildcard_dns_justified_when_present", manifest,
    ["dns", "wildcard_dns_present"],
    ["dns", "wildcard_justification_documented"],
    "DNS as code: the declared wildcard DNS carries a written justification",
    "no wildcard DNS declared");
  boolCheck(results, "dns_and_redirects",
    "dns_change_protocol_followed", manifest,
    ["dns", "change_protocol_followed"],
    "DNS as code: the change protocol is followed — preview → apply → verify → rollback plan");
  falseCheck(results, "dns_and_redirects", "no_silent_dns_changes",
    manifest, ["dns", "silent_changes_present"],
    "red line: no silent DNS changes");
  const redirectRows = rows.filter(
    (d) => isPyDict(d) && d["status"] === "redirect");
  const statusPresent = domainsIsList &&
    rows.every((d) => hasField(d, "status"));
  const targetPresent = domainsIsList && statusPresent &&
    redirectRows.every((d) => hasField(d, "redirect_target"));
  check(results, "dns_and_redirects",
    "every_redirect_domain_declares_target", domainsRaw, targetPresent,
    domainsIsList &&
      redirectRows.every((d) => nonemptyStr(d, "redirect_target")),
    "brand architecture: every domain declared with status redirect names its redirect target — spokes redirect to the hub");
  const codePresent = domainsIsList && statusPresent &&
    redirectRows.every((d) => hasField(d, "redirect_status_code"));
  check(results, "dns_and_redirects", "every_redirect_uses_301",
    domainsRaw, codePresent,
    domainsIsList &&
      redirectRows.every(
        (d) => (d as Record<string, unknown>)["redirect_status_code"] === 301),
    "brand architecture: every declared redirect uses status code 301 — spokes 301-redirect to the hub");
  check(results, "dns_and_redirects", "no_redirect_loops", domainsRaw,
    domainsIsList,
    domainsIsList && loopDomains.length === 0,
    "red line: no redirect loops — following the declared redirect targets never revisits a domain");
  check(results, "dns_and_redirects",
    "redirect_chains_at_most_two_hops", domainsRaw, domainsIsList,
    domainsIsList && loopDomains.length === 0 && maxChainHops <= 2,
    "red line: no redirect chains beyond two hops — the longest declared redirect chain is at most two hops");
  boolCheck(results, "dns_and_redirects", "redirect_map_tested",
    manifest, ["redirects", "redirect_map_tested"],
    "quality gate: the redirect map is tested — status, destination, no loops");

  // ---- Section 3: email_authentication_and_tls ----
  const sendsPresent = domainsIsList &&
    rows.every((d) => hasField(d, "sends_email"));
  const authFields: [string, string, string][] = [
    ["spf_declared", "every_sending_domain_has_spf", "SPF"],
    ["dkim_declared", "every_sending_domain_has_dkim", "DKIM"],
    ["dmarc_declared", "every_sending_domain_has_dmarc", "DMARC"],
  ];
  for (const [field, checkName, label] of authFields) {
    const authPresent = domainsIsList && sendsPresent &&
      sendingRows.every((d) => hasField(d, field));
    check(results, "email_authentication_and_tls", checkName,
      domainsRaw, authPresent,
      domainsIsList &&
        sendingRows.every(
          (d) => (d as Record<string, unknown>)[field] === true),
      `email authentication: every domain declared as sending email declares ${label} — SPF + DKIM + DMARC on every sending domain`);
  }
  const parkedRows = rows.filter(
    (d) => isPyDict(d) && d["status"] === "parked");
  const spoofingPresent = domainsIsList && statusPresent &&
    parkedRows.every((d) => hasField(d, "spoofing_blocked"));
  check(results, "email_authentication_and_tls",
    "parked_domains_block_spoofing", domainsRaw, spoofingPresent,
    domainsIsList &&
      parkedRows.every(
        (d) => (d as Record<string, unknown>)["spoofing_blocked"] === true),
    "email authentication: spoofing is blocked on parked domains — every domain declared with status parked declares spoofing blocked");
  boolCheck(results, "email_authentication_and_tls",
    "dmarc_monitoring_rua_configured", manifest,
    ["email_auth", "dmarc_monitoring_rua_configured"],
    "email authentication: DMARC monitoring is configured first — p=none with rua reporting");
  boolCheck(results, "email_authentication_and_tls",
    "dmarc_progression_toward_quarantine", manifest,
    ["email_auth", "dmarc_progression_toward_quarantine"],
    "email authentication: DMARC progresses from monitoring toward quarantine");
  boolCheck(results, "email_authentication_and_tls",
    "email_auth_tested_after_dns_changes", manifest,
    ["email_auth", "tested_after_dns_changes"],
    "email authentication: authentication is tested after every DNS change");
  boolCheck(results, "email_authentication_and_tls",
    "tls_certs_auto_renew", manifest,
    ["tls", "certs_auto_renew"],
    "TLS & hosting: certificates are auto-renewing");
  boolCheck(results, "email_authentication_and_tls",
    "hsts_enabled_once_stable", manifest,
    ["tls", "hsts_enabled_once_stable"],
    "TLS & hosting: HSTS is enabled once stable");
  boolCheck(results, "email_authentication_and_tls",
    "tls_changes_dual_verified", manifest,
    ["tls", "changes_dual_verified"],
    "TLS & hosting: dual verification is performed after any change");
  boolCheck(results, "email_authentication_and_tls",
    "cert_expiry_monitored", manifest,
    ["tls", "cert_expiry_monitored"],
    "TLS & hosting: certificate expiry is monitored");
  boolCheck(results, "email_authentication_and_tls",
    "uptime_and_redirect_chains_monitored", manifest,
    ["tls", "uptime_and_redirect_chains_monitored"],
    "TLS & hosting: uptime and redirect chains are monitored");
  falseCheck(results, "email_authentication_and_tls",
    "no_unreviewed_wildcard_dns_and_cert_combo", manifest,
    ["tls", "wildcard_dns_and_cert_combo_without_review_present"],
    "red line: no wildcard DNS + wildcard cert combo without review");

  // ---- Section 4: renewals_and_audit ----
  const renewalPresent = domainsIsList && evaluationDays !== null &&
    rows.every((d) => hasField(d, "renewal_date"));
  function renewalOk(): boolean {
    if (!domainsIsList || domainsCount === 0) return false;
    return daysList.every((days) => days !== null && days >= 0);
  }
  check(results, "renewals_and_audit",
    "every_domain_renewal_not_lapsed", domainsRaw, renewalPresent,
    renewalOk(),
    "renewals / red line: no declared domain is lapsed — every declared renewal date is a valid date on or after the declared evaluation date");
  const pbRows = rows.filter(
    (d) => isPyDict(d) && d["is_personal_brand"] === true);
  const pbGatePresent = domainsIsList &&
    rows.every((d) => hasField(d, "is_personal_brand"));
  const pbPresent = domainsIsList && pbGatePresent &&
    pbRows.every((d) => hasField(d, "registrar_lock") &&
      hasField(d, "auto_renew"));
  check(results, "renewals_and_audit",
    "personal_brand_domains_lock_and_auto_renew", domainsRaw, pbPresent,
    domainsIsList &&
      pbRows.every((d) =>
        (d as Record<string, unknown>)["registrar_lock"] === true &&
        (d as Record<string, unknown>)["auto_renew"] === true),
    "red line: a personal-brand domain must never lapse — every personal-brand domain declares a registrar lock and auto-renew (the alerts leg is the portfolio-level alerts check below)");
  boolCheck(results, "renewals_and_audit", "renewal_alerts_configured",
    manifest, ["renewals", "alerts_configured"],
    "renewals: renewal alerts are configured — alerts at 60/30/7 days");
  boolCheck(results, "renewals_and_audit",
    "payment_method_expiry_tracked", manifest,
    ["renewals", "payment_method_expiry_tracked"],
    "renewals: payment method expiry is tracked");
  boolCheck(results, "renewals_and_audit", "expiry_monitors_live",
    manifest, ["renewals", "expiry_monitors_live"],
    "quality gate: renewal and expiry monitors are live");
  boolCheck(results, "renewals_and_audit",
    "quarterly_audit_executed", manifest,
    ["audit", "quarterly_audit_executed"],
    "quality gate: the quarterly audit is executed");
  boolCheck(results, "renewals_and_audit", "quarterly_audit_logged",
    manifest, ["audit", "quarterly_audit_logged"],
    "quality gate: the quarterly audit is logged");
  boolCheck(results, "renewals_and_audit",
    "dead_redirects_checked_in_audit", manifest,
    ["audit", "dead_redirects_checked"],
    "quarterly audit: dead redirects are checked");
  boolCheck(results, "renewals_and_audit",
    "dangling_dns_records_checked_in_audit", manifest,
    ["audit", "dangling_dns_records_checked"],
    "quarterly audit: dangling DNS records are checked");
  boolCheck(results, "renewals_and_audit",
    "dmarc_reports_reviewed_in_audit", manifest,
    ["audit", "dmarc_reports_reviewed"],
    "quarterly audit: DMARC reports are reviewed");

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
    verdict = "DOMAIN_PORTFOLIO_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DOMAIN_PORTFOLIO_SOUND";
  }

  const computedNames = [
    "domains_declared",
    "every_domain_has_purpose",
    "exactly_one_canonical_per_brand_cluster",
    "no_redirect_loops",
    "redirect_chains_at_most_two_hops",
    "every_domain_renewal_not_lapsed",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "domain-portfolio-audit",
    atom_version: "0.1.0",
    portfolio: manifest["portfolio"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    domains_count: domainsCount,
    domains_without_purpose: domainsWithoutPurpose,
    purpose_coverage: fmt4(purposeCoverage),
    email_auth_coverage: fmt4(emailAuthCoverage),
    domains_missing_email_auth: domainsMissingEmailAuth,
    domains_lapsed: domainsLapsed,
    domains_within_alert_window: domainsWithinAlertWindow,
    nearest_renewal_days: nearestRenewalDays,
    redirect_loop_domains: redirectLoopDomains,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DOMAIN PORTFOLIO AUDIT",
    `portfolio: ${pyStr(verdict.portfolio ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
