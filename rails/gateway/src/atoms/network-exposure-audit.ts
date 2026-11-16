// Network exposure audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/network-exposure-audit/src/network_exposure_audit.py
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
  system: "string",
  environment: "string",
  inventory: {
    current: "boolean",
  },
  endpoints: [{
    id: "string",
    host: "string",
    port: "number",
    protocol: "string",
    public: "boolean",
    listed: "boolean",
    owner: "string",
    service: "string",
    zone: "string",
    via: "string",
    tls_cert_valid: "boolean",
    auth_required: "boolean",
  }],
  segmentation: {
    zones_separated: "boolean",
    admin_plane_separate: "boolean",
    default_deny: "boolean",
    loopback_by_default: "boolean",
  },
  tls: {
    cert_expiry_monitored: "boolean",
    hsts_on_web: "boolean",
    min_version: "string",
  },
  dns: {
    registrar_lock: "boolean",
    registrar_2fa: "boolean",
    dnssec_enabled: "boolean",
  },
  domains: [{
    name: "string",
    sending: "boolean",
    spf: "boolean",
    dkim: "boolean",
    dmarc: "boolean",
  }],
  email: {
    dmarc_reports_monitored: "boolean",
  },
  edge: {
    waf_or_cdn_in_front_of_web: "boolean",
    rate_limits_enabled: "boolean",
  },
  access: {
    admin_authenticated_path_only: "boolean",
    no_default_credentials: "boolean",
  },
  egress: {
    outbound_allowlist: "boolean",
    unexpected_egress_logged: "boolean",
  },
  evidence: {
    events_logged_denied_and_accepted: "boolean",
    reviewed_on_change_and_incident: "boolean",
  },
};

export const SECTIONS = [
  "inventory",
  "segmentation",
  "tls",
  "dns_email",
  "edge_access",
  "egress_evidence",
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
  environment: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

const PLAINTEXT_PROTOCOLS = new Set(["http", "ftp", "telnet", "plaintext"]);
const ENCRYPTED_PROTOCOLS = new Set([
  "https", "wss", "tls", "ssl", "smtps", "imaps", "pop3s", "ldaps",
]);
const TUNNEL_VIAS = new Set([
  "tunnel", "cloudflared", "ssh-tunnel", "ssh_tunnel", "ngrok",
  "tailscale-funnel", "tailscale_funnel",
]);
const SENSITIVE_PORTS = [1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017];
const SENSITIVE_SERVICES = new Set([
  "database", "db", "mysql", "postgres", "postgresql", "mssql",
  "mongodb", "redis", "elasticsearch", "admin", "admin-panel",
  "admin_panel", "admin panel", "control-plane", "control_plane",
  "control plane",
]);
const SENSITIVE_ZONES = new Set(["admin", "data"]);
const MODERN_TLS_VERSIONS = new Set(["1.2", "1.3"]);

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function norm(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function nonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function field(item: unknown, key: string): unknown {
  return isPyDict(item) ? item[key] : null;
}

function endpointId(endpoint: unknown, index: number): string {
  if (isPyDict(endpoint) && nonemptyStr(endpoint["id"])) return endpoint["id"] as string;
  return `endpoint[${index}]`;
}

function domainId(domain: unknown, index: number): string {
  if (isPyDict(domain) && nonemptyStr(domain["name"])) return domain["name"] as string;
  return `domain[${index}]`;
}

function listCheck(
  results: CheckResult[],
  section: string,
  name: string,
  values: unknown,
  hasValues: boolean,
  offenders: string[],
  passEvidence: string,
  failPrefix: string,
  label: string,
): void {
  if (!hasValues) {
    check(results, section, name, false, false, `${label} not provided`);
  } else if (!Array.isArray(values)) {
    check(results, section, name, true, false, `${label}=${pyRepr(values)}`);
  } else if (offenders.length > 0) {
    check(results, section, name, true, false, `${failPrefix}: ${offenders.join(", ")}`);
  } else {
    check(results, section, name, true, true, passEvidence);
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [endpoints, hasEndpoints] = getPath(manifest, "endpoints");
  const endpointList: unknown[] = Array.isArray(endpoints) ? endpoints : [];
  const [domains, hasDomains] = getPath(manifest, "domains");
  const domainList: unknown[] = Array.isArray(domains) ? domains : [];
  const isPublic = (e: unknown) => field(e, "public") === true;

  // ---- Section 1: inventory (exposure inventory) ----
  const [current, hasCurrent] = getPath(manifest, "inventory", "current");
  check(results, "inventory", "exposure_inventory_current", hasCurrent,
    current === true,
    "skill method 1: exposure inventory maintained — the list of " +
      "public endpoints and what serves each");

  const unowned: string[] = [];
  endpointList.forEach((e, i) => {
    if (isPublic(e) && !nonemptyStr(field(e, "owner"))) unowned.push(endpointId(e, i));
  });
  listCheck(results, "inventory", "every_public_endpoint_owned",
    endpoints, hasEndpoints, unowned,
    "every public endpoint has an owner (quality gate: " +
      "every public entry has an owner)",
    "public endpoints without an owner", "endpoints");

  const unlisted: string[] = [];
  endpointList.forEach((e, i) => {
    if (isPublic(e) && field(e, "listed") !== true) unlisted.push(endpointId(e, i));
  });
  listCheck(results, "inventory", "no_unlisted_public_endpoints",
    endpoints, hasEndpoints, unlisted,
    "no public endpoint absent from the exposure inventory " +
      "(if it's not on the list, it's not allowed public)",
    "public endpoints not on the exposure inventory", "endpoints");

  // ---- Section 2: segmentation (zones, admin plane, posture) ----
  const [zones, hasZones] = getPath(manifest, "segmentation", "zones_separated");
  check(results, "segmentation", "trust_zones_separated", hasZones,
    zones === true,
    "skill method 3: segmentation — services separated into " +
      "trust zones (public edge / app / data / admin)");

  const [adminSep, hasAdminSep] = getPath(manifest, "segmentation", "admin_plane_separate");
  check(results, "segmentation", "admin_plane_separate_from_public_path",
    hasAdminSep, adminSep === true,
    "skill method 3: admin planes never share the public path");

  const [deny, hasDeny] = getPath(manifest, "segmentation", "default_deny");
  check(results, "segmentation", "default_deny_posture", hasDeny,
    deny === true,
    "skill method 2: default-deny posture — everything closed " +
      "unless a list entry justifies exposure");

  const [loopback, hasLoopback] = getPath(manifest, "segmentation", "loopback_by_default");
  check(results, "segmentation", "loopback_by_default", hasLoopback,
    loopback === true,
    "skill method 2: everything listens on loopback unless a " +
      "list entry justifies exposure");

  // ---- Section 3: tls (TLS everywhere) ----
  const plaintext: string[] = [];
  endpointList.forEach((e, i) => {
    if (PLAINTEXT_PROTOCOLS.has(norm(field(e, "protocol")))) plaintext.push(endpointId(e, i));
  });
  listCheck(results, "tls", "no_plaintext_protocol_endpoints",
    endpoints, hasEndpoints, plaintext,
    "no plaintext protocol paths (quality gate: no " +
      "plaintext protocol paths)",
    "plaintext protocol endpoints (skill method 4: no " +
      "plaintext protocols (HTTP/FTP/telnet) on any path)",
    "endpoints");

  const invalidCerts: string[] = [];
  endpointList.forEach((e, i) => {
    if (ENCRYPTED_PROTOCOLS.has(norm(field(e, "protocol"))) && field(e, "tls_cert_valid") !== true) {
      invalidCerts.push(endpointId(e, i));
    }
  });
  listCheck(results, "tls", "encrypted_endpoints_have_valid_certs",
    endpoints, hasEndpoints, invalidCerts,
    "every encrypted endpoint has a valid cert",
    "encrypted endpoints without a valid cert", "endpoints");

  const [expiry, hasExpiry] = getPath(manifest, "tls", "cert_expiry_monitored");
  check(results, "tls", "cert_expiry_monitored", hasExpiry,
    expiry === true,
    "skill method 4: valid certs — auto-renew + monitor expiry " +
      "(quality gate: cert expiry monitored)");

  const [hsts, hasHsts] = getPath(manifest, "tls", "hsts_on_web");
  check(results, "tls", "hsts_on_web", hasHsts,
    hsts === true,
    "skill method 4: HSTS on web");

  const [minVersion, hasMinVersion] = getPath(manifest, "tls", "min_version");
  check(results, "tls", "modern_tls_min_version", hasMinVersion,
    MODERN_TLS_VERSIONS.has(norm(minVersion)),
    `min_version=${pyRepr(minVersion)} (skill method 4: modern TLS ` +
      `config only — TLS 1.2 or 1.3)`);

  // ---- Section 4: dns_email (DNS + email authentication) ----
  const [lock, hasLock] = getPath(manifest, "dns", "registrar_lock");
  check(results, "dns_email", "registrar_lock_enabled", hasLock,
    lock === true,
    "skill method 5: registrar lock + 2FA");

  const [twofa, hasTwofa] = getPath(manifest, "dns", "registrar_2fa");
  check(results, "dns_email", "registrar_2fa_enabled", hasTwofa,
    twofa === true,
    "skill method 5: registrar lock + 2FA");

  const [dnssec, hasDnssec] = getPath(manifest, "dns", "dnssec_enabled");
  check(results, "dns_email", "dnssec_enabled", hasDnssec,
    dnssec === true,
    "skill method 5: DNSSEC where possible");

  const unauthenticatedDomains: string[] = [];
  domainList.forEach((d, i) => {
    if (field(d, "sending") !== true) return;
    if (!(field(d, "spf") === true && field(d, "dkim") === true && field(d, "dmarc") === true)) {
      unauthenticatedDomains.push(domainId(d, i));
    }
  });
  listCheck(results, "dns_email", "every_sending_domain_has_spf_dkim_dmarc",
    domains, hasDomains, unauthenticatedDomains,
    "SPF, DKIM and DMARC present on every sending domain " +
      "(quality gate: SPF/DKIM/DMARC present on sending " +
      "domains)",
    "sending domains without SPF/DKIM/DMARC", "domains");

  const [dmarcMon, hasDmarcMon] = getPath(manifest, "email", "dmarc_reports_monitored");
  check(results, "dns_email", "dmarc_reports_monitored", hasDmarcMon,
    dmarcMon === true,
    "skill method 5: monitor DMARC reports");

  // ---- Section 5: edge_access (edge protection + admin access) ----
  const [waf, hasWaf] = getPath(manifest, "edge", "waf_or_cdn_in_front_of_web");
  check(results, "edge_access", "waf_or_cdn_in_front_of_web", hasWaf,
    waf === true,
    "skill method 6: CDN/WAF in front of web; don't roll " +
      "your own edge");

  const [rateLimits, hasRl] = getPath(manifest, "edge", "rate_limits_enabled");
  check(results, "edge_access", "edge_rate_limits_enabled", hasRl,
    rateLimits === true,
    "skill method 6: edge rate limits and bot rules");

  const exposedSensitive: string[] = [];
  endpointList.forEach((e, i) => {
    if (!isPublic(e)) return;
    const port = field(e, "port");
    const portHit = isInt(port) && SENSITIVE_PORTS.includes(port);
    if (portHit || SENSITIVE_SERVICES.has(norm(field(e, "service"))) || SENSITIVE_ZONES.has(norm(field(e, "zone")))) {
      exposedSensitive.push(endpointId(e, i));
    }
  });
  listCheck(results, "edge_access", "no_admin_or_db_endpoint_public",
    endpoints, hasEndpoints, exposedSensitive,
    "no admin/DB panel exposed to the internet",
    "publicly exposed admin/DB endpoints (skill red line: " +
      "no admin/DB panels exposed to the internet)",
    "endpoints");

  const [adminPath, hasAdminPath] = getPath(manifest, "access", "admin_authenticated_path_only");
  check(results, "edge_access", "admin_access_authenticated_path_only",
    hasAdminPath, adminPath === true,
    "quality gate: admin access only via authenticated path " +
      "(tunnel/VPN/SSO), never open ports");

  const unauthenticatedTunnels: string[] = [];
  endpointList.forEach((e, i) => {
    if (TUNNEL_VIAS.has(norm(field(e, "via"))) && field(e, "auth_required") !== true) {
      unauthenticatedTunnels.push(endpointId(e, i));
    }
  });
  listCheck(results, "edge_access", "no_unauthenticated_tunnels",
    endpoints, hasEndpoints, unauthenticatedTunnels,
    "no unauthenticated tunnels",
    "unauthenticated tunnels (skill red line: no " +
      "unauthenticated tunnels)",
    "endpoints");

  const [defaults, hasDefaults] = getPath(manifest, "access", "no_default_credentials");
  check(results, "edge_access", "no_default_credentials", hasDefaults,
    defaults === true,
    "skill red line: no default credentials anywhere");

  // ---- Section 6: egress_evidence (egress control + evidence) ----
  const [allowlist, hasAllowlist] = getPath(manifest, "egress", "outbound_allowlist");
  check(results, "egress_evidence", "egress_outbound_allowlist",
    hasAllowlist, allowlist === true,
    "skill method 7: egress control — outbound allowlists for " +
      "servers that don't need the internet");

  const [unexpected, hasUnexpected] = getPath(manifest, "egress", "unexpected_egress_logged");
  check(results, "egress_evidence", "unexpected_egress_logged",
    hasUnexpected, unexpected === true,
    "skill method 7: log unexpected egress");

  const [logged, hasLogged] = getPath(manifest, "evidence", "events_logged_denied_and_accepted");
  check(results, "egress_evidence", "network_events_logged_denied_and_accepted",
    hasLogged, logged === true,
    "skill method 8: network events logged (denied + accepted)");

  const [reviewed, hasReviewed] = getPath(manifest, "evidence", "reviewed_on_change_and_incident");
  check(results, "egress_evidence", "evidence_reviewed_on_change_and_incident",
    hasReviewed, reviewed === true,
    "skill method 8: evidence reviewed on change and on incident");

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
    verdict = "UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "network-exposure-audit",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    environment: manifest["environment"] ?? null,
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
    "NETWORK EXPOSURE AUDIT",
    `system: ${pyStr(verdict.system ?? null)}  environment: ${pyStr(verdict.environment ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(20)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
