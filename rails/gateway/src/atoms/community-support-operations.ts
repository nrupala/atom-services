// Community support operations — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/community-support-operations/src/community_support_operations.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared
// support/community operations artifact; it runs no support desk
// and exercises no judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the triage-category list entries) are
// validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  intake: {
    channels_defined: "boolean",
    sla_targets_documented: "boolean",
    outage_target_hours: "number",
    broken_target_hours: "number",
    question_target_hours: "number",
    messages_received: "number",
    messages_tracked: "number",
    support_messages_left_untracked_in_dms: "boolean",
  },
  help_docs: {
    faq_covers_top_recurring_questions: "boolean",
    docs_updated_from_actual_tickets: "boolean",
    fixes_link_doc_where_possible: "boolean",
    top_theme_count: "number",
    themes_with_doc_or_backlog_count: "number",
  },
  triage: {
    categories_used: ["string"],
    bugs_require_reproduction: "boolean",
    bugs_filed_in_tracker_with_evidence: "boolean",
    features_routed_to_backlog: "boolean",
    threads_total: "number",
    threads_closed_with_resolution_or_tracked_item: "number",
    obvious_issues_left_unanswered: "boolean",
    triage_then_prioritize_deliberately: "boolean",
  },
  response: {
    acknowledge_expectation_deliver_confirm_followed: "boolean",
    mistakes_owned_plainly: "boolean",
    argues_publicly_with_users: "boolean",
    unshipped_dates_or_features_promised: "boolean",
    reporter_privacy_leaked_in_public_threads: "boolean",
  },
  comms: {
    changelog_highlights_for_users_published: "boolean",
    incident_templates_ready: "boolean",
    incident_templates_include_honesty_rules: "boolean",
    incident_status_honest_no_fake_precision: "boolean",
    follow_up_after_resolution_sent: "boolean",
  },
  community: {
    code_of_conduct_exists: "boolean",
    moderation_process_documented: "boolean",
    moderation_applied_consistently: "boolean",
    contributors_celebrated: "boolean",
    spaces_spam_free_without_hostility: "boolean",
  },
  measurement: {
    first_response_time_measured: "boolean",
    resolution_time_measured: "boolean",
    recurring_themes_tracked: "boolean",
    satisfaction_signals_observed: "boolean",
    monthly_review_held: "boolean",
    themes_feed_product: "boolean",
  },
};

export const SECTIONS = [
  "intake_and_slas",
  "help_docs_and_deflection",
  "triage_loop",
  "response_craft_and_red_lines",
  "release_and_incident_comms",
  "community_norms",
  "measurement",
] as const;

export const STATED_TRIAGE_CATEGORIES = [
  "bug",
  "feature",
  "usage",
  "noise",
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
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  computed_tracked_share: string | null;
  tracked_difference: string | null;
  computed_theme_coverage_ratio: string | null;
  theme_coverage_difference: string | null;
  triage_categories_not_covered: string[] | null;
  computed_thread_closure_share: string | null;
  thread_closure_difference: string | null;
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: intake_and_slas ----
  boolCheck(results, "intake_and_slas", "channels_defined",
    manifest, ["intake", "channels_defined"],
    "method step 1: support channels are defined");
  boolCheck(results, "intake_and_slas", "sla_targets_documented",
    manifest, ["intake", "sla_targets_documented"],
    "quality gate: channels and SLA response-time targets are documented");
  const [outage, hasOutage] = getPath(manifest, "intake", "outage_target_hours");
  const [broken, hasBroken] = getPath(manifest, "intake", "broken_target_hours");
  const [question, hasQuestion] = getPath(
    manifest, "intake", "question_target_hours");
  const slaAllNumbers = hasOutage && hasBroken && hasQuestion &&
    isNumber(outage) && isNumber(broken) && isNumber(question);
  const slaOrderOk = slaAllNumbers &&
    (outage as number) < (broken as number) &&
    (broken as number) < (question as number);
  check(results, "intake_and_slas", "sla_targets_respect_severity_order",
    outage, slaAllNumbers, slaOrderOk,
    "method step 1: the declared response-time targets respect the severity order the skill names — outage shorter than broken, broken shorter than question (outage > broken > question); no target value itself is judged, the skill states none");
  const [received, hasReceived] = getPath(
    manifest, "intake", "messages_received");
  const [tracked, hasTracked] = getPath(manifest, "intake", "messages_tracked");
  const intakeAllNumbers = hasReceived && hasTracked &&
    isNumber(received) && isNumber(tracked);
  const trackedShare: number | null =
    intakeAllNumbers && (received as number) > 0
      ? (tracked as number) / (received as number)
      : null;
  const trackedDifference: number | null = intakeAllNumbers
    ? (tracked as number) - (received as number)
    : null;
  const intakeTrackedOk = intakeAllNumbers && (received as number) > 0 &&
    fmt6((tracked as number) - (received as number)) === "0.000000";
  check(results, "intake_and_slas", "every_message_tracked",
    tracked, intakeAllNumbers, intakeTrackedOk,
    "method step 1: every message lands somewhere tracked — the declared tracked count equals the declared received count");
  falseCheck(results, "intake_and_slas",
    "no_support_messages_left_untracked_in_dms",
    manifest, ["intake", "support_messages_left_untracked_in_dms"],
    "method step 1: no support DMs vanish into history untracked");

  // ---- Section 2: help_docs_and_deflection ----
  boolCheck(results, "help_docs_and_deflection",
    "faq_covers_top_recurring_questions",
    manifest, ["help_docs", "faq_covers_top_recurring_questions"],
    "method step 2: FAQ/help docs cover the top recurring questions");
  boolCheck(results, "help_docs_and_deflection",
    "docs_updated_from_actual_tickets",
    manifest, ["help_docs", "docs_updated_from_actual_tickets"],
    "method step 2: help docs are updated from actual tickets");
  boolCheck(results, "help_docs_and_deflection",
    "fixes_link_doc_where_possible",
    manifest, ["help_docs", "fixes_link_doc_where_possible"],
    "method step 2: fixes link a help doc where possible");
  const [topCount, hasTop] = getPath(manifest, "help_docs", "top_theme_count");
  const [covered, hasCovered] = getPath(
    manifest, "help_docs", "themes_with_doc_or_backlog_count");
  const topPresent = hasTop && isNumber(topCount);
  const topTenOk = topPresent &&
    fmt6((topCount as number) - 10) === "0.000000";
  check(results, "help_docs_and_deflection", "top_ten_themes_identified",
    topCount, topPresent, topTenOk,
    "quality gate: the top themes are the top 10 the skill names — the declared top-theme count is 10");
  const themesAllNumbers = hasTop && hasCovered &&
    isNumber(topCount) && isNumber(covered);
  const themeCoverageRatio: number | null =
    themesAllNumbers && (topCount as number) > 0
      ? (covered as number) / (topCount as number)
      : null;
  const themeCoverageDifference: number | null = themesAllNumbers
    ? (covered as number) - (topCount as number)
    : null;
  const themesCoveredOk = themesAllNumbers &&
    fmt6((covered as number) - (topCount as number)) === "0.000000";
  check(results, "help_docs_and_deflection",
    "all_top_themes_have_doc_or_backlog",
    covered, themesAllNumbers, themesCoveredOk,
    "quality gate: every top theme has a help doc or a backlog entry — the declared covered count equals the declared top-theme count");

  // ---- Section 3: triage_loop ----
  const [categories, hasCategories] = getPath(
    manifest, "triage", "categories_used");
  const categoriesIsList = hasCategories && Array.isArray(categories);
  const notCovered: string[] | null = categoriesIsList
    ? STATED_TRIAGE_CATEGORIES.filter(
        (c) => !(categories as unknown[]).includes(c))
    : null;
  check(results, "triage_loop", "triage_categories_cover_stated_categories",
    categories, categoriesIsList,
    categoriesIsList && (notCovered as string[]).length === 0,
    "method step 3: the categories used cover every category the skill names — bug, feature, usage, noise");
  boolCheck(results, "triage_loop", "bugs_require_reproduction",
    manifest, ["triage", "bugs_require_reproduction"],
    "method step 3: bugs need reproductions");
  boolCheck(results, "triage_loop", "bugs_filed_in_tracker_with_evidence",
    manifest, ["triage", "bugs_filed_in_tracker_with_evidence"],
    "method step 3: bugs go to the issue tracker with evidence");
  boolCheck(results, "triage_loop", "features_routed_to_backlog",
    manifest, ["triage", "features_routed_to_backlog"],
    "method step 3: features are routed to the backlog");
  const [total, hasTotal] = getPath(manifest, "triage", "threads_total");
  const [closed, hasClosed] = getPath(
    manifest, "triage",
    "threads_closed_with_resolution_or_tracked_item");
  const threadsAllNumbers = hasTotal && hasClosed &&
    isNumber(total) && isNumber(closed);
  const threadClosureShare: number | null =
    threadsAllNumbers && (total as number) > 0
      ? (closed as number) / (total as number)
      : null;
  const threadClosureDifference: number | null = threadsAllNumbers
    ? (closed as number) - (total as number)
    : null;
  const threadsClosedOk = threadsAllNumbers && (total as number) > 0 &&
    fmt6((closed as number) - (total as number)) === "0.000000";
  check(results, "triage_loop",
    "every_thread_ends_with_resolution_or_tracked_item",
    closed, threadsAllNumbers, threadsClosedOk,
    "method step 3: every thread ends with a resolution or a tracked item — the declared closed count equals the declared thread total");
  falseCheck(results, "triage_loop", "no_unanswered_obvious_issues",
    manifest, ["triage", "obvious_issues_left_unanswered"],
    "red line: no unanswered 'obvious' issues");
  boolCheck(results, "triage_loop", "triage_then_prioritize_deliberately",
    manifest, ["triage", "triage_then_prioritize_deliberately"],
    "red line: issues are triaged, then prioritized deliberately");

  // ---- Section 4: response_craft_and_red_lines ----
  boolCheck(results, "response_craft_and_red_lines",
    "acknowledge_expectation_deliver_confirm_followed",
    manifest,
    ["response", "acknowledge_expectation_deliver_confirm_followed"],
    "method step 4: responses follow acknowledge, set expectation, deliver, confirm");
  boolCheck(results, "response_craft_and_red_lines",
    "mistakes_owned_plainly",
    manifest, ["response", "mistakes_owned_plainly"],
    "method step 4: mistakes are owned plainly");
  falseCheck(results, "response_craft_and_red_lines",
    "never_argues_publicly",
    manifest, ["response", "argues_publicly_with_users"],
    "method step 4: never argue publicly");
  falseCheck(results, "response_craft_and_red_lines",
    "never_promises_unshipped_dates_or_features",
    manifest, ["response", "unshipped_dates_or_features_promised"],
    "red line: never promise what isn't shipped — no unshipped dates or features are promised");
  falseCheck(results, "response_craft_and_red_lines",
    "reporter_privacy_never_leaked_in_public_threads",
    manifest, ["response", "reporter_privacy_leaked_in_public_threads"],
    "red line: reporter privacy is never leaked in public threads");

  // ---- Section 5: release_and_incident_comms ----
  boolCheck(results, "release_and_incident_comms",
    "changelog_highlights_for_users_published",
    manifest, ["comms", "changelog_highlights_for_users_published"],
    "method step 5: changelog highlights for users are published");
  boolCheck(results, "release_and_incident_comms",
    "incident_templates_ready",
    manifest, ["comms", "incident_templates_ready"],
    "quality gate: incident comms templates are ready");
  boolCheck(results, "release_and_incident_comms",
    "incident_templates_include_honesty_rules",
    manifest, ["comms", "incident_templates_include_honesty_rules"],
    "quality gate: incident comms templates carry the honesty rules");
  boolCheck(results, "release_and_incident_comms",
    "incident_status_honest_no_fake_precision",
    manifest, ["comms", "incident_status_honest_no_fake_precision"],
    "method step 5: incident updates give honest status — 'investigating' is not fake precision");
  boolCheck(results, "release_and_incident_comms",
    "follow_up_after_resolution_sent",
    manifest, ["comms", "follow_up_after_resolution_sent"],
    "method step 5: a follow-up is sent after resolution");

  // ---- Section 6: community_norms ----
  boolCheck(results, "community_norms", "code_of_conduct_exists",
    manifest, ["community", "code_of_conduct_exists"],
    "method step 6: a code of conduct exists");
  boolCheck(results, "community_norms", "moderation_process_documented",
    manifest, ["community", "moderation_process_documented"],
    "quality gate: community guidelines and a documented moderation process exist where a community runs");
  boolCheck(results, "community_norms", "moderation_applied_consistently",
    manifest, ["community", "moderation_applied_consistently"],
    "method step 6: moderation is consistent");
  boolCheck(results, "community_norms", "contributors_celebrated",
    manifest, ["community", "contributors_celebrated"],
    "method step 6: contributors are celebrated");
  boolCheck(results, "community_norms",
    "spaces_spam_free_without_hostility",
    manifest, ["community", "spaces_spam_free_without_hostility"],
    "method step 6: spaces are kept spam-free without turning hostile");

  // ---- Section 7: measurement ----
  boolCheck(results, "measurement", "first_response_time_measured",
    manifest, ["measurement", "first_response_time_measured"],
    "method step 7: first response time is measured");
  boolCheck(results, "measurement", "resolution_time_measured",
    manifest, ["measurement", "resolution_time_measured"],
    "method step 7: resolution time is measured");
  boolCheck(results, "measurement", "recurring_themes_tracked",
    manifest, ["measurement", "recurring_themes_tracked"],
    "method step 7: recurring themes are tracked");
  boolCheck(results, "measurement", "satisfaction_signals_observed",
    manifest, ["measurement", "satisfaction_signals_observed"],
    "method step 7: quiet satisfaction signals are observed");
  boolCheck(results, "measurement", "monthly_review_held",
    manifest, ["measurement", "monthly_review_held"],
    "method step 7: a monthly review is held");
  boolCheck(results, "measurement", "themes_feed_product",
    manifest, ["measurement", "themes_feed_product"],
    "method step 7: themes feed the product");

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
    verdict = "COMMUNITY_SUPPORT_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "COMMUNITY_SUPPORT_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "sla_targets_respect_severity_order" ||
      r.check === "every_message_tracked" ||
      r.check === "top_ten_themes_identified" ||
      r.check === "all_top_themes_have_doc_or_backlog" ||
      r.check === "triage_categories_cover_stated_categories" ||
      r.check === "every_thread_ends_with_resolution_or_tracked_item")
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
    service: "community-support-operations",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    computed_tracked_share: fmt6(trackedShare),
    tracked_difference: fmt6(trackedDifference),
    computed_theme_coverage_ratio: fmt6(themeCoverageRatio),
    theme_coverage_difference: fmt6(themeCoverageDifference),
    triage_categories_not_covered: notCovered,
    computed_thread_closure_share: fmt6(threadClosureShare),
    thread_closure_difference: fmt6(threadClosureDifference),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "COMMUNITY SUPPORT OPERATIONS",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
