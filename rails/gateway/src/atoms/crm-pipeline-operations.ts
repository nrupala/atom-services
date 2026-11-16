// CRM pipeline operations — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/crm-pipeline-operations/src/crm_pipeline_operations.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals. Counts and the stage distribution are plain
// integers (null when they cannot be computed). This atom
// validates a declared CRM pipeline artifact; it operates no
// CRM, contacts nobody, moves no deal, and exercises no
// judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (stage list entries and deal-row stages)
// are validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  source: {
    single_system_maintained: "boolean",
    contacts_carry_who_what_context_minimum: "boolean",
    dedupe_cadence_set: "boolean",
    stale_contacts_flagged_not_trusted: "boolean",
  },
  contact_rules: {
    sensitivity_flags_honored: "boolean",
    sensitivity_flags_override_everything: "boolean",
    outreach_drafted_for_review_never_auto_sent: "boolean",
    nothing_personal_shared_beyond_purpose: "boolean",
    unapproved_outreach_sent: "boolean",
    bulk_unsolicited_outreach_sent: "boolean",
    personal_contacts_uploaded_to_third_parties_without_purpose_and_consent: "boolean",
  },
  pipeline: {
    stages_used: ["string"],
    entry_criteria_defined_for_each_stage: "boolean",
    exit_criteria_defined_for_each_stage: "boolean",
    deals_advance_on_evidence_not_optimism: "boolean",
    stale_threshold_days: "number",
    deals: [{
      stage: "string",
      value: "number",
      age_days: "number",
      has_next_step: "boolean",
      has_next_step_date: "boolean",
      open: "boolean",
    }],
  },
  follow_up: {
    cadence_scheduled: "boolean",
    every_touch_carries_value: "boolean",
    every_interaction_logged_with_what_said_promised_next: "boolean",
    promises_tracked_until_delivered: "boolean",
  },
  reporting: {
    pipeline_reported_by_stage_and_age: "boolean",
    conversion_rates_by_stage_reported: "boolean",
    stuck_deal_list_maintained: "boolean",
    stuck_deal_review_held_on_cadence: "boolean",
    forecasts_use_honest_probabilities: "boolean",
  },
  consent: {
    marketing_consent_recorded: "boolean",
    consent_flags_current: "boolean",
    unsubscribe_honored_instantly: "boolean",
    segmentation_per_consent: "boolean",
    scraped_third_party_personal_data_into_crm: "boolean",
  },
  win_loss: {
    reasons_captured: "boolean",
    reasons_include_yours_and_theirs: "boolean",
    feeds_messaging_product_and_process_improvements: "boolean",
  },
  minimal_data: {
    only_relationship_needed_data_collected: "boolean",
    retention_for_dead_leads_defined: "boolean",
  },
};

export const SECTIONS = [
  "single_source_of_truth",
  "contact_rules_and_privacy",
  "pipeline_stages_and_deals",
  "follow_up_cadence_and_logging",
  "reporting_and_forecasts",
  "consent_and_comms",
  "win_loss_discipline",
  "minimal_data_and_retention",
] as const;

export const STATED_PIPELINE_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "decision",
  "won",
  "lost",
];

const DEAL_ROW_FIELDS = [
  "stage",
  "value",
  "age_days",
  "has_next_step",
  "has_next_step_date",
  "open",
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
  pipeline_stages_not_covered: string[] | null;
  deal_count: number | null;
  open_deal_count: number | null;
  stale_deal_count: number | null;
  open_deals_without_next_step_or_date_count: number | null;
  stage_distribution: Record<string, number> | null;
  computed_open_value_total: string | null;
  computed_pipeline_value_total: string | null;
  summary: string;
}

interface DealRow {
  stage: string;
  value: number;
  age_days: number;
  has_next_step: boolean;
  has_next_step_date: boolean;
  open: boolean;
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

function rowComplete(row: unknown): boolean {
  if (!isPyDict(row)) return false;
  for (const field of DEAL_ROW_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(row, field)) return false;
  }
  return (
    typeof row["stage"] === "string" && (row["stage"] as string).length > 0 &&
    isNumber(row["value"]) && isNumber(row["age_days"]) &&
    typeof row["has_next_step"] === "boolean" &&
    typeof row["has_next_step_date"] === "boolean" &&
    typeof row["open"] === "boolean"
  );
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: single_source_of_truth ----
  boolCheck(results, "single_source_of_truth", "single_system_maintained",
    manifest, ["source", "single_system_maintained"],
    "method step 1: one system (or structured folder) is the single source of truth for contacts and interactions");
  boolCheck(results, "single_source_of_truth",
    "contacts_carry_who_what_context_minimum",
    manifest, ["source", "contacts_carry_who_what_context_minimum"],
    "method step 1: contacts carry the who/what/context minimum");
  boolCheck(results, "single_source_of_truth", "dedupe_cadence_set",
    manifest, ["source", "dedupe_cadence_set"],
    "quality gate: a dedupe cadence is set — dedupe happens on a schedule");
  boolCheck(results, "single_source_of_truth",
    "stale_contacts_flagged_not_trusted",
    manifest, ["source", "stale_contacts_flagged_not_trusted"],
    "method step 1: stale contacts are flagged, not trusted");

  // ---- Section 2: contact_rules_and_privacy ----
  boolCheck(results, "contact_rules_and_privacy", "sensitivity_flags_honored",
    manifest, ["contact_rules", "sensitivity_flags_honored"],
    "quality gate: sensitivity flags are honored");
  boolCheck(results, "contact_rules_and_privacy",
    "sensitivity_flags_override_everything",
    manifest, ["contact_rules", "sensitivity_flags_override_everything"],
    "red line: sensitivity flags override everything");
  boolCheck(results, "contact_rules_and_privacy",
    "outreach_drafted_for_review_never_auto_sent",
    manifest, ["contact_rules", "outreach_drafted_for_review_never_auto_sent"],
    "method step 2: outreach is drafted for review, never auto-sent");
  boolCheck(results, "contact_rules_and_privacy",
    "nothing_personal_shared_beyond_purpose",
    manifest, ["contact_rules", "nothing_personal_shared_beyond_purpose"],
    "method step 2: nothing personal is shared beyond its purpose");
  falseCheck(results, "contact_rules_and_privacy", "no_unapproved_outreach",
    manifest, ["contact_rules", "unapproved_outreach_sent"],
    "quality gate: no unapproved outreach is sent");
  falseCheck(results, "contact_rules_and_privacy",
    "no_bulk_unsolicited_outreach",
    manifest, ["contact_rules", "bulk_unsolicited_outreach_sent"],
    "red line: never bulk unsolicited outreach (spam)");
  falseCheck(results, "contact_rules_and_privacy",
    "no_personal_contacts_uploaded_without_purpose_and_consent",
    manifest, ["contact_rules", "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent"],
    "red line: personal contacts are never uploaded to third parties without purpose and consent");

  // ---- Section 3: pipeline_stages_and_deals ----
  const [stages, hasStages] = getPath(manifest, "pipeline", "stages_used");
  const stagesIsList = hasStages && Array.isArray(stages);
  const stagesNotCovered: string[] | null = stagesIsList
    ? STATED_PIPELINE_STAGES.filter(
        (s) => !(stages as unknown[]).includes(s))
    : null;
  check(results, "pipeline_stages_and_deals",
    "pipeline_stages_cover_stated_stages",
    stages, stagesIsList,
    stagesIsList && (stagesNotCovered as string[]).length === 0,
    "method step 3: the stages used cover every stage the skill names — lead, qualified, proposal, decision, won, lost");
  boolCheck(results, "pipeline_stages_and_deals",
    "entry_criteria_defined_for_each_stage",
    manifest, ["pipeline", "entry_criteria_defined_for_each_stage"],
    "method step 3: entry criteria are defined for each pipeline stage");
  boolCheck(results, "pipeline_stages_and_deals",
    "exit_criteria_defined_for_each_stage",
    manifest, ["pipeline", "exit_criteria_defined_for_each_stage"],
    "method step 3: exit criteria are defined for each pipeline stage — deals advance on evidence, not optimism");
  boolCheck(results, "pipeline_stages_and_deals",
    "deals_advance_on_evidence_not_optimism",
    manifest, ["pipeline", "deals_advance_on_evidence_not_optimism"],
    "method step 3: deals advance on evidence (call happened, proposal sent), not optimism");
  const [dealsRaw, hasDeals] = getPath(manifest, "pipeline", "deals");
  const dealsIsList = hasDeals && Array.isArray(dealsRaw);
  const deals: DealRow[] = dealsIsList ? (dealsRaw as DealRow[]) : [];
  const rowsComplete = dealsIsList && deals.length > 0 &&
    deals.every((row) => rowComplete(row));
  const rowsIncomplete = dealsIsList && !rowsComplete && deals.length > 0 &&
    !deals.every((row) => rowComplete(row));
  let dealPresent: boolean;
  if (!dealsIsList) {
    dealPresent = false;
  } else if (deals.length === 0) {
    dealPresent = true;
  } else if (rowsIncomplete) {
    dealPresent = false;
  } else {
    dealPresent = true;
  }
  check(results, "pipeline_stages_and_deals", "deal_rows_complete",
    dealsRaw, dealPresent, rowsComplete,
    "method step 3: every declared deal row carries a stage, a value, an age in days, a next-step flag, a next-step-date flag, and an open flag");
  const openDeals: DealRow[] = rowsComplete
    ? deals.filter((row) => row["open"] === true)
    : [];
  const dealCount: number | null = dealsIsList ? deals.length : null;
  const openDealCount: number | null = rowsComplete ? openDeals.length : null;
  const stagesAreStated = rowsComplete &&
    deals.every((row) => STATED_PIPELINE_STAGES.includes(row["stage"]));
  check(results, "pipeline_stages_and_deals", "deal_stages_are_stated_stages",
    dealsRaw, dealPresent, stagesAreStated,
    "method step 3: every declared deal row's stage is one of the stages the skill names — lead, qualified, proposal, decision, won, lost");
  const openWithoutNextStep: number | null = rowsComplete
    ? openDeals.filter(
        (row) => !(row["has_next_step"] && row["has_next_step_date"])).length
    : null;
  const everyOpenHasNext = rowsComplete && openDeals.length > 0 &&
    openWithoutNextStep === 0;
  check(results, "pipeline_stages_and_deals",
    "every_open_deal_has_next_step_and_date",
    dealsRaw, dealPresent, everyOpenHasNext,
    "quality gate: every open deal carries a next step and a next-step date — the declared open rows all declare both (a zero open-deal count fails: no open pipeline exists to prove this over)");
  const [threshold, hasThreshold] = getPath(
    manifest, "pipeline", "stale_threshold_days");
  const thresholdIsNumber = hasThreshold && isNumber(threshold);
  const stalePresent = dealPresent && thresholdIsNumber;
  const staleDealCount: number | null =
    rowsComplete && thresholdIsNumber
      ? openDeals.filter(
          (row) => row["age_days"] > (threshold as number)).length
      : null;
  const noStale = rowsComplete && thresholdIsNumber &&
    openDeals.length > 0 && staleDealCount === 0;
  check(results, "pipeline_stages_and_deals",
    "no_open_deal_stale_beyond_declared_threshold",
    dealsRaw, stalePresent, noStale,
    "method step 1: stale is flagged, not trusted — no declared open deal's age in days exceeds the caller-declared stale_threshold_days; the skill states no day count, so only the caller's own declared threshold is applied (a zero open-deal count fails: no open pipeline exists to prove this over)");
  let stageDistribution: Record<string, number> | null = null;
  let computedOpenValueTotal: number | null = null;
  let computedPipelineValueTotal: number | null = null;
  if (rowsComplete) {
    stageDistribution = {};
    for (const stage of STATED_PIPELINE_STAGES) {
      stageDistribution[stage] =
        deals.filter((row) => row["stage"] === stage).length;
    }
    computedOpenValueTotal =
      openDeals.reduce((acc, row) => acc + row["value"], 0);
    computedPipelineValueTotal =
      deals.reduce((acc, row) => acc + row["value"], 0);
  }

  // ---- Section 4: follow_up_cadence_and_logging ----
  boolCheck(results, "follow_up_cadence_and_logging",
    "follow_up_cadence_scheduled",
    manifest, ["follow_up", "cadence_scheduled"],
    "method step 4: follow-up touches are scheduled on a cadence");
  boolCheck(results, "follow_up_cadence_and_logging",
    "every_follow_up_touch_carries_value",
    manifest, ["follow_up", "every_touch_carries_value"],
    "method step 4: every scheduled touch carries value — an insight, a result, a useful link");
  boolCheck(results, "follow_up_cadence_and_logging",
    "every_interaction_logged_with_what_said_promised_next",
    manifest, ["follow_up", "every_interaction_logged_with_what_said_promised_next"],
    "method step 4: every interaction is logged — what was said, what was promised, what is next");
  boolCheck(results, "follow_up_cadence_and_logging",
    "promises_tracked_until_delivered",
    manifest, ["follow_up", "promises_tracked_until_delivered"],
    "method step 4: what was promised is tracked until delivered");

  // ---- Section 5: reporting_and_forecasts ----
  boolCheck(results, "reporting_and_forecasts",
    "pipeline_reported_by_stage_and_age",
    manifest, ["reporting", "pipeline_reported_by_stage_and_age"],
    "method step 5: the pipeline is reported by stage and age");
  boolCheck(results, "reporting_and_forecasts",
    "conversion_rates_by_stage_reported",
    manifest, ["reporting", "conversion_rates_by_stage_reported"],
    "method step 5: conversion rates by stage are reported — base rates, not impressions");
  boolCheck(results, "reporting_and_forecasts", "stuck_deal_list_maintained",
    manifest, ["reporting", "stuck_deal_list_maintained"],
    "method step 5: a stuck-deal list is maintained");
  boolCheck(results, "reporting_and_forecasts",
    "stuck_deal_review_held_on_cadence",
    manifest, ["reporting", "stuck_deal_review_held_on_cadence"],
    "quality gate: the stuck-deal review is held on cadence");
  boolCheck(results, "reporting_and_forecasts",
    "forecasts_use_honest_probabilities",
    manifest, ["reporting", "forecasts_use_honest_probabilities"],
    "method step 5: reporting feeds revenue-management forecasts with honest probabilities");

  // ---- Section 6: consent_and_comms ----
  boolCheck(results, "consent_and_comms", "marketing_consent_recorded",
    manifest, ["consent", "marketing_consent_recorded"],
    "method step 6: marketing consent is recorded");
  boolCheck(results, "consent_and_comms", "consent_flags_current",
    manifest, ["consent", "consent_flags_current"],
    "quality gate: consent flags are current");
  boolCheck(results, "consent_and_comms", "unsubscribe_honored_instantly",
    manifest, ["consent", "unsubscribe_honored_instantly"],
    "method step 6: unsubscribe is honored instantly");
  boolCheck(results, "consent_and_comms", "segmentation_per_consent",
    manifest, ["consent", "segmentation_per_consent"],
    "method step 6: segmentation is per consent");
  falseCheck(results, "consent_and_comms",
    "no_scraping_third_party_personal_data",
    manifest, ["consent", "scraped_third_party_personal_data_into_crm"],
    "method step 6: no third-party personal data is scraped into the CRM");

  // ---- Section 7: win_loss_discipline ----
  boolCheck(results, "win_loss_discipline", "win_loss_reasons_captured",
    manifest, ["win_loss", "reasons_captured"],
    "quality gate: win/loss reasons are captured");
  boolCheck(results, "win_loss_discipline",
    "win_loss_reasons_include_yours_and_theirs",
    manifest, ["win_loss", "reasons_include_yours_and_theirs"],
    "method step 7: the captured reason includes yours and theirs");
  boolCheck(results, "win_loss_discipline", "win_loss_feeds_improvements",
    manifest, ["win_loss", "feeds_messaging_product_and_process_improvements"],
    "method step 7: win/loss reasons feed messaging, product, and process improvements");

  // ---- Section 8: minimal_data_and_retention ----
  boolCheck(results, "minimal_data_and_retention",
    "only_relationship_needed_data_collected",
    manifest, ["minimal_data", "only_relationship_needed_data_collected"],
    "method step 8: only what the relationship needs is collected, not everything possible");
  boolCheck(results, "minimal_data_and_retention",
    "retention_for_dead_leads_defined",
    manifest, ["minimal_data", "retention_for_dead_leads_defined"],
    "method step 8: retention for dead leads is defined");

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
    verdict = "CRM_PIPELINE_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CRM_PIPELINE_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "pipeline_stages_cover_stated_stages" ||
      r.check === "deal_rows_complete" ||
      r.check === "deal_stages_are_stated_stages" ||
      r.check === "every_open_deal_has_next_step_and_date" ||
      r.check === "no_open_deal_stale_beyond_declared_threshold")
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
    service: "crm-pipeline-operations",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    pipeline_stages_not_covered: stagesNotCovered,
    deal_count: dealCount,
    open_deal_count: openDealCount,
    stale_deal_count: staleDealCount,
    open_deals_without_next_step_or_date_count: openWithoutNextStep,
    stage_distribution: stageDistribution,
    computed_open_value_total: fmt6(computedOpenValueTotal),
    computed_pipeline_value_total: fmt6(computedPipelineValueTotal),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CRM PIPELINE OPERATIONS",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
