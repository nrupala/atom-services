// Product metrics event taxonomy pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/product-metrics-event-taxonomy-pack/src/product_metrics_event_taxonomy_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  decision: {
    measurement_decision_named: "boolean",
    tracking_only_for_a_named_decision: "boolean",
    kpi_tree_from_north_star_to_inputs_declared: "boolean",
  },
  metrics: [{
    name: "string",
    definition: "string",
    kpi_tree_role: "string",
  }],
  taxonomy: {
    naming_convention_adopted_for_event_names: "boolean",
    event_spec_written_before_feature_code: "boolean",
    event_spec_reviewed_before_code: "boolean",
    analytics_reviewed_in_pull_request: "boolean",
    event_spec_validated_in_staging: "boolean",
  },
  events: [{
    name: "string",
    feature: "string",
    spec_version: "string",
  }],
  properties: [{
    event_name: "string",
    name: "string",
    data_type: "string",
    requirement: "string",
    contains_pii: "boolean",
  }],
  data_quality: {
    capture_time_validation_planned: "boolean",
    dashboard_dupe_and_drop_audit_planned: "boolean",
    taxonomy_definitions_documented: "boolean",
    two_definitions_of_one_metric_treated_as_bugs: "boolean",
  },
  privacy: {
    pseudonymous_ids_only_in_events: "boolean",
    consent_gating_applied_where_required: "boolean",
    aggregation_before_export_applied_where_possible: "boolean",
  },
  dashboards: {
    every_chart_carries_question_definition_owner_target: "boolean",
    trends_shown_over_snapshots: "boolean",
    dashboard_segmentation_done_thoughtfully: "boolean",
    dead_metrics_and_dashboards_retired: "boolean",
  },
  experiments: {
    hypothesis_and_primary_metric_recorded_before_launch: "boolean",
    guardrails_and_sample_size_rationale_recorded_before_launch: "boolean",
    single_change_per_experiment: "boolean",
    assignment_and_blinding_checks_planned: "boolean",
    experiment_results_written_down_including_no_effect: "boolean",
  },
  feedback: {
    qualitative_support_themes_placed_beside_quantitative_results: "boolean",
    qualitative_and_quantitative_feedback_both_feed_backlog: "boolean",
  },
  red_lines: {
    pii_in_analytics_events_present: "boolean",
    unregistered_experiments_present: "boolean",
    metrics_without_definitions_present: "boolean",
    dark_pattern_measurement_present: "boolean",
  },
};

export const SECTIONS = [
  "decision_and_kpi_tree",
  "event_taxonomy_and_spec",
  "data_quality",
  "privacy_by_construction",
  "dashboards_experiments_and_feedback",
  "red_lines",
] as const;

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const KPI_TREE_ROLES = ["north_star", "input"];
const PROPERTY_REQUIREMENTS = ["required", "optional"];

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
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  metrics_count: number | null;
  events_count: number | null;
  properties_count: number | null;
  metrics_without_definition: string[] | null;
  duplicate_metric_names: string[] | null;
  duplicate_event_names: string[] | null;
  duplicate_property_keys: string[] | null;
  orphan_property_rows: string[] | null;
  events_without_properties: string[] | null;
  definition_coverage: string | null;
  event_property_coverage: string | null;
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

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function fieldOf(entry: unknown, field: string): unknown {
  return isPyDict(entry) ? entry[field] : undefined;
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

function nonEmptyStr(value: unknown): boolean {
  return typeof value === "string" && value !== "";
}

function duplicates(values: string[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const value of values) {
    if (seen.includes(value) && !dups.includes(value)) {
      dups.push(value);
    }
    seen.push(value);
  }
  return dups;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [metricsRaw, hasMetrics] = getPath(manifest, "metrics");
  const metricsIsList = hasMetrics && Array.isArray(metricsRaw);
  const mRows: unknown[] = metricsIsList ? (metricsRaw as unknown[]) : [];
  const metricsCount: number | null = metricsIsList ? mRows.length : null;

  const [eventsRaw, hasEvents] = getPath(manifest, "events");
  const eventsIsList = hasEvents && Array.isArray(eventsRaw);
  const eRows: unknown[] = eventsIsList ? (eventsRaw as unknown[]) : [];
  const eventsCount: number | null = eventsIsList ? eRows.length : null;

  const [propertiesRaw, hasProperties] = getPath(manifest, "properties");
  const propertiesIsList = hasProperties && Array.isArray(propertiesRaw);
  const pRows: unknown[] = propertiesIsList ? (propertiesRaw as unknown[]) : [];
  const propertiesCount: number | null = propertiesIsList ? pRows.length : null;

  const metricsWithoutDefinition: string[] | null = metricsIsList
    ? mRows.filter((c) => hasField(c, "definition") &&
        !nonEmptyStr(fieldOf(c, "definition"))).map(rowName)
    : null;
  const duplicateMetricNames: string[] | null = metricsIsList
    ? duplicates(mRows.filter((c) => typeof fieldOf(c, "name") === "string")
        .map((c) => fieldOf(c, "name") as string))
    : null;
  const duplicateEventNames: string[] | null = eventsIsList
    ? duplicates(eRows.filter((c) => typeof fieldOf(c, "name") === "string")
        .map((c) => fieldOf(c, "name") as string))
    : null;
  const duplicatePropertyKeys: string[] | null = propertiesIsList
    ? duplicates(pRows.filter((c) =>
        typeof fieldOf(c, "event_name") === "string" &&
        typeof fieldOf(c, "name") === "string")
        .map((c) => `${fieldOf(c, "event_name") as string}.${fieldOf(c, "name") as string}`))
    : null;
  const eventNames: string[] = eventsIsList
    ? eRows.filter((c) => typeof fieldOf(c, "name") === "string")
        .map((c) => fieldOf(c, "name") as string)
    : [];
  const propertyEventNames: string[] = propertiesIsList
    ? pRows.filter((c) => typeof fieldOf(c, "event_name") === "string")
        .map((c) => fieldOf(c, "event_name") as string)
    : [];
  const orphanPropertyRows: string[] | null =
    propertiesIsList && eventsIsList
      ? pRows.filter((c) => nonEmptyStr(fieldOf(c, "event_name")) &&
          !eventNames.includes(fieldOf(c, "event_name") as string))
          .map(rowName)
      : null;
  const eventsWithoutProperties: string[] | null =
    eventsIsList && propertiesIsList
      ? eRows.filter((c) => typeof fieldOf(c, "name") === "string" &&
          !propertyEventNames.includes(fieldOf(c, "name") as string))
          .map((c) => fieldOf(c, "name") as string)
      : null;
  const definitionCoverage: number | null =
    metricsIsList && metricsCount !== null && metricsCount > 0
      ? mRows.filter((c) => nonEmptyStr(fieldOf(c, "definition"))).length /
        metricsCount
      : null;
  const eventPropertyCoverage: number | null =
    eventsIsList && propertiesIsList && eventsCount !== null && eventsCount > 0
      ? eRows.filter((c) => typeof fieldOf(c, "name") === "string" &&
          propertyEventNames.includes(fieldOf(c, "name") as string)).length /
        eventsCount
      : null;

  // ---- Section 1: decision_and_kpi_tree ----
  boolCheck(results, "decision_and_kpi_tree",
    "measurement_decision_named", manifest,
    ["decision", "measurement_decision_named"],
    "question first: the decision this data will change is named — if no decision changes, the tracking is not built");
  boolCheck(results, "decision_and_kpi_tree",
    "tracking_only_for_a_named_decision", manifest,
    ["decision", "tracking_only_for_a_named_decision"],
    "question first: tracking is limited to what a named decision needs, not curiosity");
  boolCheck(results, "decision_and_kpi_tree",
    "kpi_tree_from_north_star_to_inputs_declared", manifest,
    ["decision", "kpi_tree_from_north_star_to_inputs_declared"],
    "question first: the metrics tie to a KPI tree — north star to inputs — as declared");
  check(results, "decision_and_kpi_tree",
    "taxonomy_metrics_declared", metricsRaw, metricsIsList,
    metricsIsList,
    "the declared record names its metrics — the metrics list is present; an empty list declares that the pack declares no metrics");
  const metricDefinitionPresent = metricsIsList &&
    mRows.every((c) => hasField(c, "definition"));
  check(results, "decision_and_kpi_tree",
    "every_metric_names_definition", metricsRaw, metricDefinitionPresent,
    metricsIsList &&
      mRows.every((c) => nonEmptyStr(fieldOf(c, "definition"))),
    "metrics: every declared metric row carries a definition — no metrics without definitions");
  const metricNamePresent = metricsIsList &&
    mRows.every((c) => hasField(c, "name"));
  check(results, "decision_and_kpi_tree",
    "no_taxonomy_metric_name_duplicated", metricsRaw, metricNamePresent,
    metricsIsList && duplicateMetricNames !== null &&
      duplicateMetricNames.length === 0,
    "metrics: no declared metric name is owned by more than one metric row — one metric, one record");
  const metricRolePresent = metricsIsList &&
    mRows.every((c) => hasField(c, "kpi_tree_role"));
  check(results, "decision_and_kpi_tree",
    "every_metric_names_kpi_tree_role", metricsRaw, metricRolePresent,
    metricsIsList &&
      mRows.every((c) => nonEmptyStr(fieldOf(c, "kpi_tree_role"))),
    "metrics: every declared metric row names its role in the KPI tree");
  check(results, "decision_and_kpi_tree",
    "every_metric_kpi_tree_role_is_north_star_or_input", metricsRaw,
    metricRolePresent,
    metricsIsList &&
      mRows.every((c) => KPI_TREE_ROLES.includes(fieldOf(c, "kpi_tree_role") as string)),
    "metrics: every declared KPI-tree role is one of the two roles the skill's KPI tree states — north_star or input");

  // ---- Section 2: event_taxonomy_and_spec ----
  boolCheck(results, "event_taxonomy_and_spec",
    "naming_convention_adopted_for_event_names", manifest,
    ["taxonomy", "naming_convention_adopted_for_event_names"],
    "event taxonomy: a naming convention for event names is adopted — object_action, snake_case");
  boolCheck(results, "event_taxonomy_and_spec",
    "event_spec_written_before_feature_code", manifest,
    ["taxonomy", "event_spec_written_before_feature_code"],
    "event taxonomy: the event spec exists before the feature ships — written before feature code");
  boolCheck(results, "event_taxonomy_and_spec",
    "event_spec_reviewed_before_code", manifest,
    ["taxonomy", "event_spec_reviewed_before_code"],
    "event taxonomy: the versioned event spec is reviewed before code");
  boolCheck(results, "event_taxonomy_and_spec",
    "analytics_reviewed_in_pull_request", manifest,
    ["taxonomy", "analytics_reviewed_in_pull_request"],
    "event taxonomy: analytics is reviewed in the pull request");
  boolCheck(results, "event_taxonomy_and_spec",
    "event_spec_validated_in_staging", manifest,
    ["taxonomy", "event_spec_validated_in_staging"],
    "quality gate: the event spec is validated in staging");
  check(results, "event_taxonomy_and_spec",
    "events_declared", eventsRaw, eventsIsList,
    eventsIsList,
    "the declared record names its events — the events list is present; an empty list declares that the pack declares no events");
  const eventNamePresent = eventsIsList &&
    eRows.every((c) => hasField(c, "name"));
  check(results, "event_taxonomy_and_spec",
    "every_event_name_follows_object_action_snake_case", eventsRaw,
    eventNamePresent,
    eventsIsList &&
      eRows.every((c) => typeof fieldOf(c, "name") === "string" &&
        EVENT_NAME_PATTERN.test(fieldOf(c, "name") as string)),
    "events: every declared event name follows the skill's naming convention — object_action in snake_case, object and action joined by an underscore");
  check(results, "event_taxonomy_and_spec",
    "no_event_name_duplicated", eventsRaw, eventNamePresent,
    eventsIsList && duplicateEventNames !== null &&
      duplicateEventNames.length === 0,
    "events: no declared event name is owned by more than one event row");
  const eventFeaturePresent = eventsIsList &&
    eRows.every((c) => hasField(c, "feature"));
  check(results, "event_taxonomy_and_spec",
    "every_event_names_its_feature", eventsRaw, eventFeaturePresent,
    eventsIsList &&
      eRows.every((c) => nonEmptyStr(fieldOf(c, "feature"))),
    "events: every declared event row names the feature its spec belongs to — a versioned event spec per feature");
  const eventVersionPresent = eventsIsList &&
    eRows.every((c) => hasField(c, "spec_version"));
  check(results, "event_taxonomy_and_spec",
    "every_event_names_spec_version", eventsRaw, eventVersionPresent,
    eventsIsList &&
      eRows.every((c) => nonEmptyStr(fieldOf(c, "spec_version"))),
    "events: every declared event row names its spec version — the event spec is versioned");
  check(results, "event_taxonomy_and_spec",
    "properties_declared", propertiesRaw, propertiesIsList,
    propertiesIsList,
    "the declared record names its event properties — the properties list is present; an empty list declares that the pack declares no properties");
  const propertyEventPresent = propertiesIsList &&
    pRows.every((c) => hasField(c, "event_name"));
  check(results, "event_taxonomy_and_spec",
    "every_property_names_its_event", propertiesRaw, propertyEventPresent,
    propertiesIsList &&
      pRows.every((c) => nonEmptyStr(fieldOf(c, "event_name"))),
    "properties: every declared property row names the event it belongs to");
  const propertyPairPresent = propertiesIsList &&
    pRows.every((c) => hasField(c, "event_name") && hasField(c, "name"));
  check(results, "event_taxonomy_and_spec",
    "no_property_duplicated_for_same_event", propertiesRaw,
    propertyPairPresent,
    propertiesIsList && duplicatePropertyKeys !== null &&
      duplicatePropertyKeys.length === 0,
    "properties: no declared property is declared twice for the same event");
  const propertyTypePresent = propertiesIsList &&
    pRows.every((c) => hasField(c, "data_type"));
  check(results, "event_taxonomy_and_spec",
    "every_property_declares_a_data_type", propertiesRaw,
    propertyTypePresent,
    propertiesIsList &&
      pRows.every((c) => nonEmptyStr(fieldOf(c, "data_type"))),
    "properties: every declared property row declares its type — the event spec states properties and types");
  const propertyRequirementPresent = propertiesIsList &&
    pRows.every((c) => hasField(c, "requirement"));
  check(results, "event_taxonomy_and_spec",
    "every_property_marks_required_or_optional", propertiesRaw,
    propertyRequirementPresent,
    propertiesIsList &&
      pRows.every((c) => PROPERTY_REQUIREMENTS.includes(fieldOf(c, "requirement") as string)),
    "properties: every declared property row is marked one of the two marks the skill states — required or optional");
  const orphanPresent = propertiesIsList && eventsIsList &&
    pRows.every((c) => hasField(c, "event_name")) &&
    eRows.every((c) => hasField(c, "name"));
  check(results, "event_taxonomy_and_spec",
    "no_orphan_property_rows", propertiesRaw, orphanPresent,
    propertiesIsList && eventsIsList && orphanPropertyRows !== null &&
      orphanPropertyRows.length === 0,
    "properties: no declared property row names an event that is not itself declared — no orphan properties");
  const coveragePresent = eventsIsList && propertiesIsList &&
    eRows.every((c) => hasField(c, "name")) &&
    pRows.every((c) => hasField(c, "event_name"));
  check(results, "event_taxonomy_and_spec",
    "every_event_has_declared_properties", eventsRaw, coveragePresent,
    eventsIsList && propertiesIsList && eventsWithoutProperties !== null &&
      eventsWithoutProperties.length === 0,
    "properties: every declared event has at least one declared property — the properties are part of each event's spec");

  // ---- Section 3: data_quality ----
  boolCheck(results, "data_quality",
    "capture_time_validation_planned", manifest,
    ["data_quality", "capture_time_validation_planned"],
    "data quality: validation at capture is planned");
  boolCheck(results, "data_quality",
    "dashboard_dupe_and_drop_audit_planned", manifest,
    ["data_quality", "dashboard_dupe_and_drop_audit_planned"],
    "data quality: dashboards are audited for dupes and drops");
  boolCheck(results, "data_quality",
    "taxonomy_definitions_documented", manifest,
    ["data_quality", "taxonomy_definitions_documented"],
    "data quality: the taxonomy's definitions are documented");
  boolCheck(results, "data_quality",
    "two_definitions_of_one_metric_treated_as_bugs", manifest,
    ["data_quality", "two_definitions_of_one_metric_treated_as_bugs"],
    "data quality: a metric with two definitions is treated as two bugs");

  // ---- Section 4: privacy_by_construction ----
  boolCheck(results, "privacy_by_construction",
    "pseudonymous_ids_only_in_events", manifest,
    ["privacy", "pseudonymous_ids_only_in_events"],
    "privacy: events carry IDs only, pseudonymous — no PII in events");
  boolCheck(results, "privacy_by_construction",
    "consent_gating_applied_where_required", manifest,
    ["privacy", "consent_gating_applied_where_required"],
    "privacy: consent gating is applied where required");
  boolCheck(results, "privacy_by_construction",
    "aggregation_before_export_applied_where_possible", manifest,
    ["privacy", "aggregation_before_export_applied_where_possible"],
    "privacy: data is aggregated before export where possible");
  const propertyPiiPresent = propertiesIsList &&
    pRows.every((c) => hasField(c, "contains_pii"));
  check(results, "privacy_by_construction",
    "no_property_row_declares_pii", propertiesRaw, propertyPiiPresent,
    propertiesIsList &&
      pRows.every((c) => fieldOf(c, "contains_pii") === false),
    "privacy: no declared property row declares that it contains PII — no PII in analytics events");

  // ---- Section 5: dashboards_experiments_and_feedback ----
  boolCheck(results, "dashboards_experiments_and_feedback",
    "every_chart_carries_question_definition_owner_target", manifest,
    ["dashboards", "every_chart_carries_question_definition_owner_target"],
    "dashboards: each chart carries a question, a definition, an owner and a target — or it is not built");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "trends_shown_over_snapshots", manifest,
    ["dashboards", "trends_shown_over_snapshots"],
    "dashboards: trends are shown over snapshots");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "dashboard_segmentation_done_thoughtfully", manifest,
    ["dashboards", "dashboard_segmentation_done_thoughtfully"],
    "dashboards: segmentation is done thoughtfully");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "dead_metrics_and_dashboards_retired", manifest,
    ["dashboards", "dead_metrics_and_dashboards_retired"],
    "dashboards: dead metrics are retired — no vanity walls");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "hypothesis_and_primary_metric_recorded_before_launch", manifest,
    ["experiments", "hypothesis_and_primary_metric_recorded_before_launch"],
    "experiments: the hypothesis and the primary metric are recorded before launch");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "guardrails_and_sample_size_rationale_recorded_before_launch", manifest,
    ["experiments", "guardrails_and_sample_size_rationale_recorded_before_launch"],
    "experiments: guardrails and the sample-size rationale are recorded before launch");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "single_change_per_experiment", manifest,
    ["experiments", "single_change_per_experiment"],
    "experiments: one change per test");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "assignment_and_blinding_checks_planned", manifest,
    ["experiments", "assignment_and_blinding_checks_planned"],
    "experiments: assignment and blinding checks are planned");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "experiment_results_written_down_including_no_effect", manifest,
    ["experiments", "experiment_results_written_down_including_no_effect"],
    "experiments: results are written down — including no effect, which is a result, not a failure");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "qualitative_support_themes_placed_beside_quantitative_results", manifest,
    ["feedback", "qualitative_support_themes_placed_beside_quantitative_results"],
    "feedback joins data: qualitative themes from support are placed beside the quantitative results");
  boolCheck(results, "dashboards_experiments_and_feedback",
    "qualitative_and_quantitative_feedback_both_feed_backlog", manifest,
    ["feedback", "qualitative_and_quantitative_feedback_both_feed_backlog"],
    "feedback joins data: qualitative and quantitative feedback both feed the backlog");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_pii_in_analytics_events", manifest,
    ["red_lines", "pii_in_analytics_events_present"],
    "red line: no PII in analytics events is present in the record");
  falseCheck(results, "red_lines",
    "no_unregistered_experiments", manifest,
    ["red_lines", "unregistered_experiments_present"],
    "red line: no unregistered experiments are present in the record");
  falseCheck(results, "red_lines",
    "no_metrics_without_definitions", manifest,
    ["red_lines", "metrics_without_definitions_present"],
    "red line: no metrics without definitions are present in the record");
  falseCheck(results, "red_lines",
    "no_dark_pattern_measurement", manifest,
    ["red_lines", "dark_pattern_measurement_present"],
    "red line: no dark-pattern measurement is present in the record");

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
    verdict = "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY";
  }

  const computedNames = [
    "taxonomy_metrics_declared",
    "every_metric_names_definition",
    "no_taxonomy_metric_name_duplicated",
    "every_metric_names_kpi_tree_role",
    "every_metric_kpi_tree_role_is_north_star_or_input",
    "events_declared",
    "every_event_name_follows_object_action_snake_case",
    "no_event_name_duplicated",
    "every_event_names_its_feature",
    "every_event_names_spec_version",
    "properties_declared",
    "every_property_names_its_event",
    "no_property_duplicated_for_same_event",
    "every_property_declares_a_data_type",
    "every_property_marks_required_or_optional",
    "no_orphan_property_rows",
    "every_event_has_declared_properties",
    "no_property_row_declares_pii",
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
    service: "product-metrics-event-taxonomy-pack",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    metrics_count: metricsCount,
    events_count: eventsCount,
    properties_count: propertiesCount,
    metrics_without_definition: metricsWithoutDefinition,
    duplicate_metric_names: duplicateMetricNames,
    duplicate_event_names: duplicateEventNames,
    duplicate_property_keys: duplicatePropertyKeys,
    orphan_property_rows: orphanPropertyRows,
    events_without_properties: eventsWithoutProperties,
    definition_coverage: fmt6(definitionCoverage),
    event_property_coverage: fmt6(eventPropertyCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRODUCT METRICS EVENT TAXONOMY PACK",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
