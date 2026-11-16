// Brand mention monitoring triage digest — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/brand-mention-monitoring-triage-digest/src/
// brand_mention_monitoring_triage_digest.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check
// status, evidence string, computed value and the summary string
// are byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the dimension / route list entries) are
// validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  brand: "string",
  inventory: {
    names_handles_products_listed: "boolean",
    misspellings_and_variants_included: "boolean",
    owned_vs_third_party_distinguished: "boolean",
  },
  coverage: {
    sources_listed: "boolean",
    blind_spots_acknowledged: "boolean",
    mechanism_configured_per_source: "boolean",
    cadence_defined: "boolean",
    crisis_cadence_realtime: "boolean",
    routine_cadence_daily_digest: "boolean",
  },
  triage: {
    rubric_documented: "boolean",
    dimensions: ["string"],
    routes: ["string"],
    escalation_path_documented: "boolean",
    false_positives_tracked: "boolean",
  },
  response: {
    authority_to_speak_defined: "boolean",
    tone_rules_defined: "boolean",
    dm_move_criteria_defined: "boolean",
    statement_criteria_defined: "boolean",
    templates_approved: "boolean",
  },
  alerts: {
    thresholds_defined: "boolean",
    dedupe_enabled: "boolean",
    quiet_hours_defined: "boolean",
    tested_after_setup: "boolean",
  },
  evidence: {
    archiving_required_before_response: "boolean",
  },
  counts: {
    total_mentions: "number",
    actions_taken: "number",
    actions_with_evidence_archived: "number",
  },
  digest: {
    weekly_cadence: "boolean",
    includes_notable_mentions: "boolean",
    includes_trend_notes: "boolean",
    sentiment_included: "boolean",
    sentiment_caveats_stated: "boolean",
    actions_taken_listed: "boolean",
    signal_separated_from_noise: "boolean",
  },
  conduct: {
    astroturfing_fake_reviews_or_manufactured_engagement: "boolean",
    public_argument_without_policy_backing: "boolean",
    retaliation_against_mentioners: "boolean",
    private_data_of_individuals_exposed: "boolean",
    defamation_or_impersonation_fought_publicly_instead_of_counsel:
      "boolean",
  },
};

export const SECTIONS = [
  "inventory_and_coverage",
  "triage_rubric",
  "response_policy",
  "alert_hygiene_and_evidence",
  "digest_reporting",
  "red_lines",
] as const;

export const STATED_DIMENSIONS = [
  "severity",
  "reach",
  "authenticity",
];

export const STATED_ROUTES = [
  "ignore",
  "monitor",
  "reply",
  "escalate",
  "legal",
];

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
  brand: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  triage_dimensions_missing: string[] | null;
  triage_routes_missing: string[] | null;
  actions_without_archived_evidence: number | null;
  summary: string;
}

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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: inventory_and_coverage ----
  boolCheck(results, "inventory_and_coverage",
    "names_handles_products_listed",
    manifest, ["inventory", "names_handles_products_listed"],
    "method step 1: names, handles and products under watch are listed");
  boolCheck(results, "inventory_and_coverage",
    "misspellings_and_variants_included",
    manifest, ["inventory", "misspellings_and_variants_included"],
    "method step 1: misspellings and variants of the watched names are included in the inventory");
  boolCheck(results, "inventory_and_coverage",
    "owned_vs_third_party_distinguished",
    manifest, ["inventory", "owned_vs_third_party_distinguished"],
    "method step 1: owned channels are distinguished from third-party sources");
  boolCheck(results, "inventory_and_coverage", "coverage_sources_listed",
    manifest, ["coverage", "sources_listed"],
    "method step 1: where discussion happens is listed — the coverage list is written");
  boolCheck(results, "inventory_and_coverage",
    "blind_spots_acknowledged",
    manifest, ["coverage", "blind_spots_acknowledged"],
    "quality gate: the coverage list acknowledges its blind spots (e.g. logged-in-only platforms, DMs)");
  boolCheck(results, "inventory_and_coverage",
    "coverage_mechanism_configured_per_source",
    manifest, ["coverage", "mechanism_configured_per_source"],
    "method step 2: a coverage mechanism (RSS, APIs, saved searches, alerts, webmentions) is configured per source");
  boolCheck(results, "inventory_and_coverage", "cadence_defined",
    manifest, ["coverage", "cadence_defined"],
    "method step 2: a monitoring cadence is defined");
  boolCheck(results, "inventory_and_coverage",
    "crisis_cadence_realtime",
    manifest, ["coverage", "crisis_cadence_realtime"],
    "method step 2: the cadence is real-time for crises");
  boolCheck(results, "inventory_and_coverage",
    "routine_cadence_daily_digest",
    manifest, ["coverage", "routine_cadence_daily_digest"],
    "method step 2: the cadence is a daily digest otherwise");

  // ---- Section 2: triage_rubric ----
  boolCheck(results, "triage_rubric", "triage_rubric_documented",
    manifest, ["triage", "rubric_documented"],
    "quality gate: the triage rubric is documented");
  const [dimensions, hasDimensions] = getPath(
    manifest, "triage", "dimensions");
  const dimensionsIsList = hasDimensions && Array.isArray(dimensions);
  const dimensionsMissing: string[] | null = dimensionsIsList
    ? STATED_DIMENSIONS.filter(
        (d) => !(dimensions as unknown[]).includes(d))
    : null;
  check(results, "triage_rubric", "all_stated_triage_dimensions_used",
    dimensions, dimensionsIsList,
    dimensionsIsList && (dimensionsMissing as string[]).length === 0,
    "method step 3: the rubric scores every dimension the skill names — severity, reach, authenticity (is it spam/astroturf?)");
  const [routes, hasRoutes] = getPath(manifest, "triage", "routes");
  const routesIsList = hasRoutes && Array.isArray(routes);
  const routesMissing: string[] | null = routesIsList
    ? STATED_ROUTES.filter((r) => !(routes as unknown[]).includes(r))
    : null;
  check(results, "triage_rubric", "all_stated_triage_routes_defined",
    routes, routesIsList,
    routesIsList && (routesMissing as string[]).length === 0,
    "method step 3: the rubric defines every route the skill names — ignore, monitor, reply, escalate, legal");
  boolCheck(results, "triage_rubric", "escalation_path_documented",
    manifest, ["triage", "escalation_path_documented"],
    "quality gate: the escalation path is documented");
  boolCheck(results, "triage_rubric", "false_positives_tracked",
    manifest, ["triage", "false_positives_tracked"],
    "method step 3: false positives get tracked too");

  // ---- Section 3: response_policy ----
  boolCheck(results, "response_policy", "authority_to_speak_defined",
    manifest, ["response", "authority_to_speak_defined"],
    "quality gate: authority to speak is defined — who may speak as the brand");
  boolCheck(results, "response_policy", "tone_rules_defined",
    manifest, ["response", "tone_rules_defined"],
    "method step 4: tone rules for responses are defined");
  boolCheck(results, "response_policy", "dm_move_criteria_defined",
    manifest, ["response", "dm_move_criteria_defined"],
    "method step 4: when to take a conversation to DM is defined");
  boolCheck(results, "response_policy", "statement_criteria_defined",
    manifest, ["response", "statement_criteria_defined"],
    "method step 4: when to publish a statement is defined");
  boolCheck(results, "response_policy", "response_templates_approved",
    manifest, ["response", "templates_approved"],
    "quality gate: response templates for common cases are drafted and approved");

  // ---- Section 4: alert_hygiene_and_evidence ----
  boolCheck(results, "alert_hygiene_and_evidence",
    "alert_thresholds_defined",
    manifest, ["alerts", "thresholds_defined"],
    "method step 5: alert thresholds are defined");
  boolCheck(results, "alert_hygiene_and_evidence", "alert_dedupe_enabled",
    manifest, ["alerts", "dedupe_enabled"],
    "method step 5: alerts are deduplicated — no alert storms");
  boolCheck(results, "alert_hygiene_and_evidence",
    "alert_quiet_hours_defined",
    manifest, ["alerts", "quiet_hours_defined"],
    "method step 5: alert quiet hours are defined");
  boolCheck(results, "alert_hygiene_and_evidence",
    "alerts_tested_after_setup",
    manifest, ["alerts", "tested_after_setup"],
    "method step 5: alerts are tested after setup");
  boolCheck(results, "alert_hygiene_and_evidence",
    "evidence_archived_before_response",
    manifest, ["evidence", "archiving_required_before_response"],
    "method step 6: every actionable mention is archived (screenshot + link) before responding — posts get deleted");
  const [total, hasTotal] = getPath(manifest, "counts", "total_mentions");
  const [taken, hasTaken] = getPath(manifest, "counts", "actions_taken");
  const [archived, hasArchived] = getPath(
    manifest, "counts", "actions_with_evidence_archived");
  const allCounts = hasTotal && hasTaken && hasArchived &&
    isNumber(total) && isNumber(taken) && isNumber(archived);
  const withoutEvidence: number | null =
    hasTaken && hasArchived && isNumber(taken) && isNumber(archived)
      ? (taken as number) - (archived as number)
      : null;
  const evidenceComplete = allCounts &&
    (total as number) >= 0 && (taken as number) >= 0 &&
    (archived as number) >= 0 &&
    (taken as number) <= (total as number) &&
    archived === taken;
  check(results, "alert_hygiene_and_evidence",
    "evidence_archived_for_every_action", archived, allCounts,
    evidenceComplete,
    "quality gate: evidence is archived for every action taken — the archived count equals the actions-taken count, with coherent counts");

  // ---- Section 5: digest_reporting ----
  boolCheck(results, "digest_reporting", "digest_weekly_cadence",
    manifest, ["digest", "weekly_cadence"],
    "method step 7: the report is a weekly digest");
  boolCheck(results, "digest_reporting",
    "digest_includes_notable_mentions",
    manifest, ["digest", "includes_notable_mentions"],
    "method step 7: the digest includes notable mentions");
  boolCheck(results, "digest_reporting", "digest_includes_trend_notes",
    manifest, ["digest", "includes_trend_notes"],
    "method step 7: the digest includes trend notes");
  boolCheck(results, "digest_reporting", "digest_sentiment_included",
    manifest, ["digest", "sentiment_included"],
    "method step 7: the digest includes sentiment");
  boolCheck(results, "digest_reporting",
    "digest_sentiment_caveats_stated",
    manifest, ["digest", "sentiment_caveats_stated"],
    "method step 7: sentiment is reported with caveats");
  boolCheck(results, "digest_reporting", "digest_actions_taken_listed",
    manifest, ["digest", "actions_taken_listed"],
    "method step 7: the digest lists actions taken");
  boolCheck(results, "digest_reporting",
    "signal_separated_from_noise",
    manifest, ["digest", "signal_separated_from_noise"],
    "method step 7: signal is separated from noise explicitly");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines", "no_astroturfing_or_fake_engagement",
    manifest,
    ["conduct", "astroturfing_fake_reviews_or_manufactured_engagement"],
    "red line: no astroturfing, fake reviews, or manufactured engagement — ever");
  falseCheck(results, "red_lines",
    "no_public_argument_without_policy_backing",
    manifest, ["conduct", "public_argument_without_policy_backing"],
    "red line: the brand does not argue in public threads without policy backing");
  falseCheck(results, "red_lines", "no_retaliation",
    manifest, ["conduct", "retaliation_against_mentioners"],
    "red line: never retaliate against mentioners");
  falseCheck(results, "red_lines", "private_data_stays_private",
    manifest, ["conduct", "private_data_of_individuals_exposed"],
    "red line: private data about individuals stays private");
  falseCheck(results, "red_lines",
    "defamation_impersonation_to_counsel_not_combat",
    manifest,
    ["conduct",
     "defamation_or_impersonation_fought_publicly_instead_of_counsel"],
    "red line: defamation/impersonation goes to counsel, not combat");

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
    verdict = "TRIAGE_DIGEST_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TRIAGE_DIGEST_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "all_stated_triage_dimensions_used" ||
      r.check === "all_stated_triage_routes_defined" ||
      r.check === "evidence_archived_for_every_action")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "brand-mention-monitoring-triage-digest",
    atom_version: "0.1.0",
    brand: manifest["brand"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    triage_dimensions_missing: dimensionsMissing,
    triage_routes_missing: routesMissing,
    actions_without_archived_evidence: withoutEvidence,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BRAND MENTION MONITORING TRIAGE DIGEST",
    `brand: ${pyStr(verdict.brand ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
