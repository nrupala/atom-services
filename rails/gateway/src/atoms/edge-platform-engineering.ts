// Edge platform engineering — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/edge-platform-engineering/src/edge_platform_engineering.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  platform_fit: {
    storage_choices_documented: "boolean",
    consistency_access_pattern_reviewed: "boolean",
  },
  components: [{
    name: "string",
    storage_backend: "string",
    storage_rationale_documented: "boolean",
    requires_strong_consistency: "boolean",
    is_admin_surface: "boolean",
    access_protected: "boolean",
  }],
  deploy: {
    wrangler_workflows_used: "boolean",
    tested_with_real_bindings_locally: "boolean",
    deploys_from_git: "boolean",
    versioned_deploys: "boolean",
    rollback_path_tested: "boolean",
    previous_versions_kept_deployable: "boolean",
    staging_separated_from_prod: "boolean",
  },
  security: {
    secrets_only_in_platform_store: "boolean",
    secrets_in_code_or_repo_present: "boolean",
    secrets_in_logs_present: "boolean",
    rate_limits_configured: "boolean",
    waf_configured: "boolean",
    input_validation_at_boundary: "boolean",
    tls_https_disabled_present: "boolean",
  },
  reliability: {
    cpu_budget_respected: "boolean",
    cold_start_addressed: "boolean",
    error_capture_configured: "boolean",
    alerts_configured: "boolean",
    staged_rules_used: "boolean",
    external_health_checks_configured: "boolean",
  },
  tunnels: {
    tunnels_present: "boolean",
    origin_stays_loopback: "boolean",
    access_policies_for_humans: "boolean",
    service_tokens_for_machines: "boolean",
    origin_exposed_publicly_present: "boolean",
  },
  quotas: {
    free_tier_limits_known: "boolean",
    quota_alarms_set: "boolean",
    monthly_log_driven_cost_review: "boolean",
  },
  dns_tls: {
    zones_documented: "boolean",
    certs_automatic: "boolean",
    cert_expiry_monitored: "boolean",
    email_routing_consistent: "boolean",
  },
};

export const SECTIONS = [
  "platform_fit_and_storage",
  "deploy_and_versioning",
  "security_and_access",
  "reliability_and_observability",
  "tunnels_quotas_and_hygiene",
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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  components_count: number | null;
  components_without_storage_backend: string[] | null;
  storage_documentation_coverage: string | null;
  components_on_kv_requiring_strong_consistency: string[] | null;
  admin_components_without_access: string[] | null;
  access_protection_coverage: string | null;
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [componentsRaw, hasComponents] = getPath(manifest, "components");
  const componentsIsList = hasComponents && Array.isArray(componentsRaw);
  const rows: unknown[] = componentsIsList ? (componentsRaw as unknown[]) : [];
  const componentsCount: number | null = componentsIsList ? rows.length : null;

  const componentsWithoutBackend: string[] | null = componentsIsList
    ? rows.filter((c) => !nonemptyStr(c, "storage_backend")).map(rowName)
    : null;
  const documentedRows = rows.filter(
    (c) => nonemptyStr(c, "storage_backend") && isPyDict(c) &&
      c["storage_rationale_documented"] === true);
  const rationaleRows = rows.filter(
    (c) => isPyDict(c) && c["storage_rationale_documented"] === true);
  const storageDocumentationCoverage: number | null =
    componentsIsList && componentsCount !== null && componentsCount > 0
      ? documentedRows.length / componentsCount
      : null;
  const kvStrongRows = rows.filter(
    (c) => isPyDict(c) && c["requires_strong_consistency"] === true &&
      c["storage_backend"] === "kv");
  const componentsOnKv: string[] | null = componentsIsList
    ? kvStrongRows.map(rowName)
    : null;
  const adminRows = rows.filter(
    (c) => isPyDict(c) && c["is_admin_surface"] === true);
  const accessProtectionCoverage: number | null =
    componentsIsList && adminRows.length > 0
      ? adminRows.filter(
          (c) => (c as Record<string, unknown>)["access_protected"] === true,
        ).length / adminRows.length
      : null;
  const adminWithoutAccess: string[] | null = componentsIsList
    ? adminRows.filter((c) => hasField(c, "access_protected") &&
        (c as Record<string, unknown>)["access_protected"] !== true)
        .map(rowName)
    : null;

  // ---- Section 1: platform_fit_and_storage ----
  boolCheck(results, "platform_fit_and_storage",
    "storage_choices_documented", manifest,
    ["platform_fit", "storage_choices_documented"],
    "platform fit / quality gate: storage choices are documented — consistency + access reasons for each KV / D1 / R2 choice");
  boolCheck(results, "platform_fit_and_storage",
    "consistency_access_pattern_reviewed", manifest,
    ["platform_fit", "consistency_access_pattern_reviewed"],
    "platform fit: each storage choice is picked per consistency + access pattern, not habit");
  check(results, "platform_fit_and_storage", "components_declared",
    componentsRaw, componentsIsList,
    componentsIsList && (componentsCount as number) > 0,
    "platform fit: the declared record names its components — the components list is present and non-empty");
  const backendPresent = componentsIsList &&
    rows.every((c) => hasField(c, "storage_backend"));
  check(results, "platform_fit_and_storage",
    "every_component_names_storage_backend", componentsRaw, backendPresent,
    componentsIsList && (componentsCount as number) > 0 &&
      componentsWithoutBackend !== null &&
      componentsWithoutBackend.length === 0,
    "platform fit: every declared component row names its storage backend — a non-empty storage_backend string");
  const rationalePresent = componentsIsList &&
    rows.every((c) => hasField(c, "storage_rationale_documented"));
  check(results, "platform_fit_and_storage",
    "every_component_documents_storage_rationale", componentsRaw,
    rationalePresent,
    componentsIsList && (componentsCount as number) > 0 &&
      rationaleRows.length === componentsCount,
    "quality gate: every declared component row declares its storage rationale documented — consistency + access reasons per component");
  const consistencyPresent = componentsIsList &&
    rows.every((c) => hasField(c, "requires_strong_consistency") &&
      hasField(c, "storage_backend"));
  check(results, "platform_fit_and_storage",
    "no_strong_consistency_component_on_kv", componentsRaw,
    consistencyPresent,
    componentsIsList && kvStrongRows.length === 0,
    "platform fit: no component that requires strong consistency declares the kv backend — KV is eventually consistent");

  // ---- Section 2: deploy_and_versioning ----
  boolCheck(results, "deploy_and_versioning",
    "wrangler_workflows_used", manifest,
    ["deploy", "wrangler_workflows_used"],
    "local dev + deploys: wrangler workflows are used");
  boolCheck(results, "deploy_and_versioning",
    "tested_with_real_bindings_locally", manifest,
    ["deploy", "tested_with_real_bindings_locally"],
    "local dev + deploys: the app is tested with real bindings locally");
  boolCheck(results, "deploy_and_versioning",
    "deploys_from_git", manifest,
    ["deploy", "deploys_from_git"],
    "local dev + deploys: deploys run from git");
  boolCheck(results, "deploy_and_versioning",
    "versioned_deploys", manifest,
    ["deploy", "versioned_deploys"],
    "quality gate: deploys are versioned");
  boolCheck(results, "deploy_and_versioning",
    "rollback_path_tested", manifest,
    ["deploy", "rollback_path_tested"],
    "quality gate: the rollback path is tested");
  boolCheck(results, "deploy_and_versioning",
    "previous_versions_kept_deployable", manifest,
    ["deploy", "previous_versions_kept_deployable"],
    "local dev + deploys: previous versions are kept deployable");
  boolCheck(results, "deploy_and_versioning",
    "staging_separated_from_prod", manifest,
    ["deploy", "staging_separated_from_prod"],
    "quality gate: staging is separated from prod");

  // ---- Section 3: security_and_access ----
  boolCheck(results, "security_and_access",
    "secrets_only_in_platform_store", manifest,
    ["security", "secrets_only_in_platform_store"],
    "security / quality gate: secrets live only in the platform secret store");
  falseCheck(results, "security_and_access",
    "no_secrets_in_code_or_repo", manifest,
    ["security", "secrets_in_code_or_repo_present"],
    "red line: no secrets in code or repos");
  falseCheck(results, "security_and_access",
    "no_secrets_in_logs", manifest,
    ["security", "secrets_in_logs_present"],
    "red line: no secrets in logs");
  boolCheck(results, "security_and_access",
    "rate_limits_at_edge", manifest,
    ["security", "rate_limits_configured"],
    "security: rate limits are configured at the edge");
  boolCheck(results, "security_and_access",
    "waf_at_edge", manifest,
    ["security", "waf_configured"],
    "security: WAF rules are configured at the edge");
  boolCheck(results, "security_and_access",
    "input_validation_at_boundary", manifest,
    ["security", "input_validation_at_boundary"],
    "security: all input is validated at the boundary");
  falseCheck(results, "security_and_access",
    "no_tls_https_disabled", manifest,
    ["security", "tls_https_disabled_present"],
    "red line: TLS/HTTPS is never disabled because \"it's just a worker\"");
  const adminGatePresent = componentsIsList &&
    rows.every((c) => hasField(c, "is_admin_surface"));
  const adminPresent = componentsIsList && adminGatePresent &&
    adminRows.every((c) => hasField(c, "access_protected"));
  check(results, "security_and_access",
    "every_admin_component_access_protected", componentsRaw, adminPresent,
    componentsIsList &&
      adminRows.every(
        (c) => (c as Record<string, unknown>)["access_protected"] === true),
    "red line: no admin surfaces without Access — every component declared as an administrative surface declares Access protection");

  // ---- Section 4: reliability_and_observability ----
  boolCheck(results, "reliability_and_observability",
    "cpu_budget_respected", manifest,
    ["reliability", "cpu_budget_respected"],
    "reliability / quality gate: the CPU-time budget is respected");
  boolCheck(results, "reliability_and_observability",
    "cold_start_addressed", manifest,
    ["reliability", "cold_start_addressed"],
    "reliability: cold-start behaviour is addressed");
  boolCheck(results, "reliability_and_observability",
    "error_capture_configured", manifest,
    ["reliability", "error_capture_configured"],
    "reliability: error capture is configured");
  boolCheck(results, "reliability_and_observability",
    "reliability_alerts_configured", manifest,
    ["reliability", "alerts_configured"],
    "reliability: alerts are configured on errors");
  boolCheck(results, "reliability_and_observability",
    "staged_rules_used", manifest,
    ["reliability", "staged_rules_used"],
    "reliability: rules are staged, not pushed live unreviewed");
  boolCheck(results, "reliability_and_observability",
    "external_health_checks_configured", manifest,
    ["reliability", "external_health_checks_configured"],
    "reliability: health checks run from outside the platform");

  // ---- Section 5: tunnels_quotas_and_hygiene ----
  gatedBoolCheck(results, "tunnels_quotas_and_hygiene",
    "tunnel_origin_stays_loopback", manifest,
    ["tunnels", "tunnels_present"],
    ["tunnels", "origin_stays_loopback"],
    "tunnels: the tunnelled origin stays loopback",
    "no tunnels declared");
  gatedBoolCheck(results, "tunnels_quotas_and_hygiene",
    "tunnel_access_policies_for_humans", manifest,
    ["tunnels", "tunnels_present"],
    ["tunnels", "access_policies_for_humans"],
    "tunnels: Access policies govern human access through the tunnel",
    "no tunnels declared");
  gatedBoolCheck(results, "tunnels_quotas_and_hygiene",
    "tunnel_service_tokens_for_machines", manifest,
    ["tunnels", "tunnels_present"],
    ["tunnels", "service_tokens_for_machines"],
    "tunnels: service tokens govern machine access through the tunnel",
    "no tunnels declared");
  gatedFalseCheck(results, "tunnels_quotas_and_hygiene",
    "no_public_origin_exposure", manifest,
    ["tunnels", "tunnels_present"],
    ["tunnels", "origin_exposed_publicly_present"],
    "tunnels: the origin is not exposed publicly \"just in case\"",
    "no tunnels declared");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "free_tier_limits_known", manifest,
    ["quotas", "free_tier_limits_known"],
    "cost & quotas: the free-tier numbers are known — requests, KV ops, D1 rows, bandwidth");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "quota_alarms_set", manifest,
    ["quotas", "quota_alarms_set"],
    "cost & quotas / quality gate: quota alarms are set before quotas are hit");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "monthly_log_driven_cost_review", manifest,
    ["quotas", "monthly_log_driven_cost_review"],
    "cost & quotas: a log-driven cost review runs monthly");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "dns_zones_documented", manifest,
    ["dns_tls", "zones_documented"],
    "DNS/TLS hygiene: zones are documented");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "certs_automatic", manifest,
    ["dns_tls", "certs_automatic"],
    "DNS/TLS hygiene: certificates are automatic");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "cert_expiry_monitored", manifest,
    ["dns_tls", "cert_expiry_monitored"],
    "DNS/TLS hygiene: automatic certificates are monitored");
  boolCheck(results, "tunnels_quotas_and_hygiene",
    "email_routing_consistent", manifest,
    ["dns_tls", "email_routing_consistent"],
    "DNS/TLS hygiene: email routing and records are consistent");

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
    verdict = "EDGE_PLATFORM_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "EDGE_PLATFORM_SOUND";
  }

  const computedNames = [
    "components_declared",
    "every_component_names_storage_backend",
    "every_component_documents_storage_rationale",
    "no_strong_consistency_component_on_kv",
    "every_admin_component_access_protected",
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
    service: "edge-platform-engineering",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    components_count: componentsCount,
    components_without_storage_backend: componentsWithoutBackend,
    storage_documentation_coverage: fmt6(storageDocumentationCoverage),
    components_on_kv_requiring_strong_consistency: componentsOnKv,
    admin_components_without_access: adminWithoutAccess,
    access_protection_coverage: fmt6(accessProtectionCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "EDGE PLATFORM ENGINEERING",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
