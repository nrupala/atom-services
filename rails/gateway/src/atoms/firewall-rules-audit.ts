// Firewall rules audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/firewall-rules-audit/src/firewall_rules_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Exception, per SERVICE.md's documented rule semantics: a rule's
// port_start/port_end are NOT type-validated — when they are not
// both integers the core deliberately treats the rule as covering
// ports 0-65535, so a wrong-typed port is evidence, not an error.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  environment: "string",
  default_policy: { inbound: "string", outbound: "string" },
  rules: [{
    id: "string",
    direction: "string",
    source: "string",
    destination: "string",
    protocol: "string",
    action: "string",
    owner: "string",
    reason: "string",
    date: "string",
    service: "string",
    temporary: "boolean",
    ticket: "string",
    expiry_date: "string",
    port_forward: "boolean",
    reviewed: "boolean",
  }],
  layers_consistent: "boolean",
  egress: {
    explicit_allowlist: "boolean",
    alert_on_denies: "boolean",
  },
  change_control: {
    changes_reviewed: "boolean",
    old_rules_retired_on_schedule: "boolean",
  },
  logging: {
    denials_logged: "boolean",
    rate_limited: "boolean",
  },
  testing: {
    allowed_and_disallowed_paths_verified: "boolean",
    smoke_matrix_per_service: "boolean",
  },
  review: { cadence_days: "number" },
};

export const SECTIONS = [
  "baseline",
  "least_privilege",
  "egress",
  "documentation_change",
  "assurance",
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

const ANY_VALUES = new Set(["any", "*", "0.0.0.0/0", "::/0", "internet"]);
const SENSITIVE_PORTS = [1433, 2375, 2376, 3306, 5432, 6379, 9200, 27017];
const SENSITIVE_SERVICES = new Set([
  "database", "db", "mysql", "postgres", "postgresql", "mssql",
  "mongodb", "redis", "elasticsearch", "admin", "admin-panel",
  "admin_panel", "admin panel", "control-plane", "control_plane",
  "control plane", "agent-control-plane", "agent control plane",
  "docker",
]);
const BROAD_PORT_SPAN = 1000;

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

function isAny(value: unknown): boolean {
  return ANY_VALUES.has(norm(value));
}

function nonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function field(rule: unknown, key: string): unknown {
  return isPyDict(rule) ? rule[key] : null;
}

function ruleId(rule: unknown, index: number): string {
  if (isPyDict(rule) && nonemptyStr(rule["id"])) return rule["id"] as string;
  return `rule[${index}]`;
}

function portRange(rule: unknown): [number, number] {
  if (!isPyDict(rule)) return [0, 65535];
  const start = rule["port_start"];
  const end = rule["port_end"];
  if (isInt(start) && isInt(end)) return [start, end];
  return [0, 65535];
}

function parseIpv4(value: unknown): [number, number] | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  let addr: string;
  let prefix: number;
  const slash = text.indexOf("/");
  if (slash !== -1) {
    addr = text.slice(0, slash);
    const prefixText = text.slice(slash + 1);
    if (!/^\d+$/.test(prefixText)) return null;
    prefix = parseInt(prefixText, 10);
    if (prefix < 0 || prefix > 32) return null;
  } else {
    addr = text;
    prefix = 32;
  }
  const parts = addr.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part) || part.length > 3) return null;
    const octet = parseInt(part, 10);
    if (octet > 255) return null;
    num = num * 256 + octet;
  }
  return [num, prefix];
}

function coversAddr(earlier: unknown, later: unknown): boolean {
  if (isAny(earlier)) return true;
  if (
    typeof earlier === "string" &&
    typeof later === "string" &&
    norm(earlier) === norm(later)
  ) {
    return true;
  }
  const e = parseIpv4(earlier);
  const l = parseIpv4(later);
  if (e === null || l === null) return false;
  const [eNum, ePrefix] = e;
  const [lNum, lPrefix] = l;
  if (ePrefix > lPrefix) return false;
  if (ePrefix === 0) return true;
  const shift = 32 - ePrefix;
  return Math.floor(eNum / 2 ** shift) === Math.floor(lNum / 2 ** shift);
}

function coversProto(earlier: unknown, later: unknown): boolean {
  let e = typeof earlier === "string" ? norm(earlier) : "any";
  if (!e) e = "any";
  let l = typeof later === "string" ? norm(later) : "any";
  if (!l) l = "any";
  return e === "any" || e === "all" || e === "*" || e === l;
}

function ruleCheck(
  results: CheckResult[],
  section: string,
  name: string,
  rules: unknown,
  hasRules: boolean,
  offenders: string[],
  passEvidence: string,
  failPrefix: string,
): void {
  if (!hasRules) {
    check(results, section, name, false, false, "rules not provided");
  } else if (!Array.isArray(rules)) {
    check(results, section, name, true, false, `rules=${pyRepr(rules)}`);
  } else if (offenders.length > 0) {
    check(
      results, section, name, true, false,
      `${failPrefix}: ${offenders.join(", ")}`,
    );
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

  const [rules, hasRules] = getPath(manifest, "rules");
  const ruleList: unknown[] = Array.isArray(rules) ? rules : [];

  // ---- Section 1: baseline (default deny, both directions) ----
  const [inbound, hasIn] = getPath(manifest, "default_policy", "inbound");
  check(
    results, "baseline", "default_deny_inbound", hasIn,
    norm(inbound) === "deny",
    "skill method 1: default deny, both directions — inbound starts closed",
  );

  const [outbound, hasOut] = getPath(manifest, "default_policy", "outbound");
  check(
    results, "baseline", "default_deny_outbound", hasOut,
    norm(outbound) === "deny",
    "skill method 1: default deny, both directions — outbound starts closed",
  );

  const denyIds: string[] = [];
  ruleList.forEach((r, i) => {
    if (
      norm(field(r, "action")) === "deny" &&
      isAny(field(r, "source")) &&
      isAny(field(r, "destination"))
    ) {
      denyIds.push(ruleId(r, i));
    }
  });
  if (!hasRules) {
    check(
      results, "baseline", "explicit_default_deny_rule_present",
      false, false, "rules not provided",
    );
  } else if (!Array.isArray(rules)) {
    check(
      results, "baseline", "explicit_default_deny_rule_present",
      true, false, `rules=${pyRepr(rules)}`,
    );
  } else if (denyIds.length > 0) {
    check(
      results, "baseline", "explicit_default_deny_rule_present",
      true, true,
      `explicit default-deny rule present: ${denyIds[0]}`,
    );
  } else {
    check(
      results, "baseline", "explicit_default_deny_rule_present",
      true, false,
      "no explicit deny-any rule in the declared rules " +
        "(missing default-deny rule)",
    );
  }

  const [layers, hasLayers] = getPath(manifest, "layers_consistent");
  check(
    results, "baseline", "layers_consistent", hasLayers,
    layers === true,
    "skill method 4: platform layers consistent, no conflicting opens",
  );

  // ---- Section 2: least_privilege (rule-level) ----
  const anyAny: string[] = [];
  ruleList.forEach((r, i) => {
    if (
      norm(field(r, "action")) === "allow" &&
      isAny(field(r, "source")) &&
      isAny(field(r, "destination"))
    ) {
      anyAny.push(ruleId(r, i));
    }
  });
  ruleCheck(
    results, "least_privilege", "no_any_any_allow_rules",
    rules, hasRules, anyAny,
    "no any-any allow rules",
    "any-any allow rules (skill: no any-any in production, ever)",
  );

  const broad: string[] = [];
  ruleList.forEach((r, i) => {
    if (norm(field(r, "action")) !== "allow") return;
    const [start, end] = portRange(r);
    if (end - start + 1 >= BROAD_PORT_SPAN) {
      broad.push(`${ruleId(r, i)} ports ${start}-${end}`);
    }
  });
  ruleCheck(
    results, "least_privilege", "no_overly_broad_port_ranges",
    rules, hasRules, broad,
    "no allow rule spans 1000 or more ports",
    "overly broad port ranges (least-privilege: scope by port)",
  );

  const shadowed: string[] = [];
  for (let j = 0; j < ruleList.length; j++) {
    const later = ruleList[j];
    for (let i = 0; i < j; i++) {
      const earlier = ruleList[i];
      if (norm(field(earlier, "direction")) !== norm(field(later, "direction"))) continue;
      if (!coversAddr(field(earlier, "source"), field(later, "source"))) continue;
      if (!coversAddr(field(earlier, "destination"), field(later, "destination"))) continue;
      const [eStart, eEnd] = portRange(earlier);
      const [lStart, lEnd] = portRange(later);
      if (!(eStart <= lStart && eEnd >= lEnd)) continue;
      if (!coversProto(field(earlier, "protocol"), field(later, "protocol"))) continue;
      shadowed.push(`${ruleId(later, j)} shadowed by ${ruleId(earlier, i)}`);
      break;
    }
  }
  ruleCheck(
    results, "least_privilege", "no_shadowed_rules",
    rules, hasRules, shadowed,
    "no shadowed rules",
    "shadowed rules",
  );

  const sensitive: string[] = [];
  ruleList.forEach((r, i) => {
    if (norm(field(r, "action")) !== "allow") return;
    if (norm(field(r, "direction")) !== "inbound") return;
    if (!isAny(field(r, "source"))) return;
    const [start, end] = portRange(r);
    const portHit = SENSITIVE_PORTS.some((p) => start <= p && p <= end);
    if (portHit || SENSITIVE_SERVICES.has(norm(field(r, "service")))) {
      sensitive.push(ruleId(r, i));
    }
  });
  ruleCheck(
    results, "least_privilege", "no_direct_sensitive_exposure",
    rules, hasRules, sensitive,
    "no direct exposure of databases, admin panels, " +
      "or agent control planes",
    "directly exposed sensitive rules (skill red line: no " +
      "direct exposure of databases, admin panels, or agent " +
      "control planes)",
  );

  const unreviewedForwards: string[] = [];
  ruleList.forEach((r, i) => {
    if (field(r, "port_forward") === true && field(r, "reviewed") !== true) {
      unreviewedForwards.push(ruleId(r, i));
    }
  });
  ruleCheck(
    results, "least_privilege", "no_port_forwards_without_review",
    rules, hasRules, unreviewedForwards,
    "no port-forward without a review (port-forwards are " +
      "inventory items with reviews)",
    "port-forwards without review",
  );

  // ---- Section 3: egress (explicit outbound allowlist) ----
  const [allowlist, hasAllowlist] = getPath(manifest, "egress", "explicit_allowlist");
  check(
    results, "egress", "explicit_egress_allowlist", hasAllowlist,
    allowlist === true,
    "skill method 3: explicit egress — outbound allowlists for " +
      "the services actually called",
  );

  const [alert, hasAlert] = getPath(manifest, "egress", "alert_on_denies");
  check(
    results, "egress", "egress_alert_on_denies", hasAlert,
    alert === true,
    "skill method 3: alert on denies to spot misconfig and compromise",
  );

  // ---- Section 4: documentation_change ----
  const undocumented: string[] = [];
  ruleList.forEach((r, i) => {
    if (norm(field(r, "action")) !== "allow") return;
    if (
      !(
        nonemptyStr(field(r, "owner")) &&
        nonemptyStr(field(r, "reason")) &&
        nonemptyStr(field(r, "date"))
      )
    ) {
      undocumented.push(ruleId(r, i));
    }
  });
  ruleCheck(
    results, "documentation_change", "every_allow_rule_documented",
    rules, hasRules, undocumented,
    "every allow entry has reason + owner + date " +
      "(quality gate: every allow entry has reason + owner comment)",
    "allow rules without owner/reason/date",
  );

  const [reviewed, hasReviewed] = getPath(manifest, "change_control", "changes_reviewed");
  check(
    results, "documentation_change", "changes_reviewed_like_code",
    hasReviewed, reviewed === true,
    "skill method 6: changes reviewed like code",
  );

  const temporary: string[] = [];
  ruleList.forEach((r, i) => {
    if (
      field(r, "temporary") === true &&
      !(
        nonemptyStr(field(r, "ticket")) &&
        nonemptyStr(field(r, "expiry_date"))
      )
    ) {
      temporary.push(ruleId(r, i));
    }
  });
  ruleCheck(
    results, "documentation_change",
    "temporary_rules_have_ticket_and_expiry",
    rules, hasRules, temporary,
    "no temporary rule without a ticket and expiry date",
    "temporary rules without ticket/expiry (skill red line: " +
      "temporary means a ticket with a date)",
  );

  const [retired, hasRetired] = getPath(
    manifest, "change_control", "old_rules_retired_on_schedule",
  );
  check(
    results, "documentation_change", "old_rules_retired_on_schedule",
    hasRetired, retired === true,
    "skill method 6: old rules retired on a schedule",
  );

  // ---- Section 5: assurance (log, test, review) ----
  const [logged, hasLogged] = getPath(manifest, "logging", "denials_logged");
  check(
    results, "assurance", "denials_logged", hasLogged,
    logged === true,
    "skill method 8: denials logged",
  );

  const [rateLimited, hasRl] = getPath(manifest, "logging", "rate_limited");
  check(
    results, "assurance", "denial_logging_rate_limited", hasRl,
    rateLimited === true,
    "skill method 8: denials logged with rate-limits to avoid " +
      "noise floods",
  );

  const [tested, hasTested] = getPath(
    manifest, "testing", "allowed_and_disallowed_paths_verified",
  );
  check(
    results, "assurance", "post_change_test_allowed_and_blocked",
    hasTested, tested === true,
    "quality gate: post-change test — allowed path passes, " +
      "disallowed fails",
  );

  const [smoke, hasSmoke] = getPath(manifest, "testing", "smoke_matrix_per_service");
  check(
    results, "assurance", "smoke_matrix_per_service", hasSmoke,
    smoke === true,
    "skill method 7: keep a smoke matrix per service",
  );

  const [cadence, hasCadence] = getPath(manifest, "review", "cadence_days");
  const cadenceOk =
    typeof cadence === "number" && 1 <= cadence && cadence <= 31;
  check(
    results, "assurance", "review_cadence_within_31_days",
    hasCadence, cadenceOk,
    `cadence_days=${pyRepr(cadence)} (skill: review top denied flows ` +
      `monthly; rule review performed on schedule)`,
  );

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
  } else if (
    Object.values(sections).some((v) => v === "insufficient_evidence")
  ) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "firewall-rules-audit",
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
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FIREWALL RULES AUDIT",
    `system: ${pyStr(verdict.system ?? null)}  environment: ${pyStr(verdict.environment ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(20)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
