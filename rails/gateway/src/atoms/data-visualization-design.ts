// Data visualization design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/data-visualization-design/src/data_visualization_design.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; the bar-zero comparison compares the fixed-6dp
// difference to zero. This atom validates a declared
// visualization design record; it renders no chart, reads no
// actual data, and exercises no aesthetic judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (question types, chart types) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  brief: {
    audience: "string",
    question: "string",
  },
  charts: [{
    name: "string",
    question_type: "string",
    chart_type: "string",
    x_axis_label: "string",
    y_axis_label: "string",
    y_axis_unit: "string",
    y_axis_start: "number",
    categories_count: "number",
    bars_sorted: "boolean",
    dual_axis: "boolean",
    axis_truncated: "boolean",
    truncated_flagged_loudly: "boolean",
    uses_3d: "boolean",
    red_green_only: "boolean",
  }],
  honesty: {
    consistent_scales_when_comparing_panels: "boolean",
    data_source_labeled: "boolean",
    data_date_labeled: "boolean",
    misleading_axes_or_scales_present: "boolean",
  },
  perception: {
    primary_encoding_uses_position_or_length: "boolean",
    most_important_element_top_left_or_largest: "boolean",
    gridlines_faint: "boolean",
    chart_junk_minimized: "boolean",
    chart_junk_used_as_branding: "boolean",
  },
  color: {
    palette_colorblind_safe: "boolean",
    sequential_palette_for_magnitude: "boolean",
    diverging_palette_around_real_midpoint: "boolean",
  },
  annotation: {
    title_states_finding_not_topic: "boolean",
    events_and_thresholds_marked: "boolean",
    outliers_called_out_directly: "boolean",
    key_values_annotated: "boolean",
  },
  accessibility: {
    legible_sizes: "boolean",
    alt_text_or_table_fallback_present: "boolean",
    values_readable_without_hover: "boolean",
    contrast_sufficient_for_print_and_screen: "boolean",
  },
  dashboard: {
    one_screen_one_story: "boolean",
    metric_definitions_and_owners_declared: "boolean",
    refresh_cadence_visible: "boolean",
    stale_panels_retired: "boolean",
  },
  reproducibility: {
    tool_version_and_data_snapshot_recorded: "boolean",
    data_reproducible: "boolean",
  },
};

export const SECTIONS = [
  "question_and_chart_choice",
  "honesty_and_axes",
  "perception_and_chart_junk",
  "color",
  "annotation_and_labels",
  "accessibility",
  "dashboards_and_reproducibility",
] as const;

export const STATED_CHART_TYPES_FOR_QUESTION: Record<string, string[]> = {
  comparison: ["bar"],
  trend: ["line"],
  distribution: ["histogram", "box_plot"],
  relationship: ["scatter"],
  composition: ["stacked_bar"],
  part_to_whole_over_time: ["small_multiples"],
};

export const BAR_CHART_TYPES = ["bar", "stacked_bar"];

export const CATEGORY_LIMIT = 7;

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
  charts_evaluated: number;
  computed_max_categories: string | null;
  max_categories_difference_from_limit: string | null;
  charts_not_matching_question: string[] | null;
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

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
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

function stringCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present,
    typeof value === "string" && value.length > 0, evidence);
}

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function isBool(value: unknown): boolean {
  return typeof value === "boolean";
}

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

type Outcome = [boolean, boolean, string];

function entryComplete(entry: unknown): boolean {
  if (!isPyDict(entry)) return false;
  for (const field of ["name", "question_type", "chart_type",
      "x_axis_label", "y_axis_label", "y_axis_unit"]) {
    const [value, present] = getEntry(entry, field);
    if (!present || !isNonemptyStr(value)) return false;
  }
  for (const field of ["y_axis_start", "categories_count"]) {
    const [value, present] = getEntry(entry, field);
    if (!present || !isNumber(value)) return false;
  }
  for (const field of ["bars_sorted", "dual_axis", "axis_truncated",
      "truncated_flagged_loudly", "uses_3d", "red_green_only"]) {
    const [value, present] = getEntry(entry, field);
    if (!present || !isBool(value)) return false;
  }
  return true;
}

const COMPUTED_NAMES = [
  "chart_entries_complete",
  "chart_types_match_declared_questions",
  "comparison_charts_sorted",
  "bar_charts_y_axis_starts_at_zero",
  "no_dual_axes_in_declared_charts",
  "truncated_axes_flagged_loudly",
  "no_3d_in_declared_charts",
  "red_green_not_used_alone_in_declared_charts",
  "category_counts_within_stated_limit",
  "axis_labels_and_units_complete",
] as const;

function chartOutcomes(
  manifest: Record<string, unknown>,
): [Record<string, Outcome>, number, number | null, number | null,
    string[] | null] {
  const [charts, hasCharts] = getPath(manifest, "charts");
  if (!hasCharts || !Array.isArray(charts) || charts.length === 0) {
    const outcomes: Record<string, Outcome> = {};
    for (const name of COMPUTED_NAMES) {
      outcomes[name] = [false, false, "no chart entries declared"];
    }
    return [outcomes, 0, null, null, null];
  }
  const complete: Record<string, unknown>[] = [];
  let incomplete = false;
  for (const entry of charts as unknown[]) {
    if (entryComplete(entry)) {
      complete.push(entry as Record<string, unknown>);
    } else {
      incomplete = true;
    }
  }
  const evaluated = complete.length;
  if (incomplete) {
    const outcomes: Record<string, Outcome> = {};
    for (const name of COMPUTED_NAMES) {
      outcomes[name] = [false, false,
        "a chart entry is incomplete, so the declared chart rows cannot be evaluated"];
    }
    return [outcomes, evaluated, null, null, null];
  }

  const mismatched: string[] = [];
  for (const entry of complete) {
    const stated = STATED_CHART_TYPES_FOR_QUESTION[
      entry["question_type"] as string];
    if (stated === undefined ||
        !stated.includes(entry["chart_type"] as string)) {
      mismatched.push(entry["name"] as string);
    }
  }
  const comparisonRows = complete.filter(
    (e) => e["question_type"] === "comparison");
  const barRows = complete.filter(
    (e) => BAR_CHART_TYPES.includes(e["chart_type"] as string));
  const maxCategories = Math.max(
    ...complete.map((e) => e["categories_count"] as number));
  const categoryDifference = maxCategories - CATEGORY_LIMIT;
  const outcomes: Record<string, Outcome> = {
    chart_entries_complete: [true, true,
      "every chart entry carries a name, question type, chart type, axis labels and unit, axis start, category count, and sorting / dual-axis / truncation / 3D / red-green declarations"],
    chart_types_match_declared_questions: [true, mismatched.length === 0,
      "method step 1: every declared chart type is the chart the skill maps its declared question type to — comparison to bar, trend to line, distribution to histogram/box_plot, relationship to scatter, composition to stacked_bar, part-to-whole over time to small_multiples"],
    comparison_charts_sorted: [true,
      comparisonRows.every((e) => e["bars_sorted"] === true),
      "method step 1: every declared comparison chart declares sorted bars" +
        (comparisonRows.length === 0
          ? " (no comparison chart is declared, so this passes vacuously)"
          : "")],
    bar_charts_y_axis_starts_at_zero: [true,
      barRows.every(
        (e) => fmt6((e["y_axis_start"] as number) - 0) === "0.000000"),
      "method step 2 / quality gate: every declared bar or stacked-bar chart's declared y-axis start is zero" +
        (barRows.length === 0
          ? " (no bar chart is declared, so this passes vacuously)"
          : "")],
    no_dual_axes_in_declared_charts: [true,
      complete.every((e) => e["dual_axis"] === false),
      "method step 2: no declared chart row declares a dual axis implying causation"],
    truncated_axes_flagged_loudly: [true,
      complete.every((e) => e["axis_truncated"] === true
        ? e["truncated_flagged_loudly"] === true
        : true),
      "method step 2: every declared chart row that declares a truncated axis also declares it flagged loudly"],
    no_3d_in_declared_charts: [true,
      complete.every((e) => e["uses_3d"] === false),
      "method step 3: no declared chart row declares 3D"],
    red_green_not_used_alone_in_declared_charts: [true,
      complete.every((e) => e["red_green_only"] === false),
      "method step 4 / quality gate: no declared chart row declares a red/green-only encoding"],
    category_counts_within_stated_limit: [true,
      maxCategories <= CATEGORY_LIMIT,
      "method step 4: the largest declared category count across chart rows is at most the 7 categories the skill states"],
    axis_labels_and_units_complete: [true, true,
      "every complete chart entry carries a non-empty x-axis label, y-axis label, and y-axis unit"],
  };
  return [outcomes, evaluated, maxCategories, categoryDifference,
    mismatched];
}

function emit(
  results: CheckResult[],
  section: string,
  name: string,
  outcomes: Record<string, Outcome>,
  chartsValue: unknown,
): void {
  const [present, ok, evidence] = outcomes[name];
  check(results, section, name, chartsValue, present, ok, evidence);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];
  const [chartsValue] = getPath(manifest, "charts");
  const [outcomes, chartsEvaluated, computedMaxCategories,
    categoryDifference, chartsNotMatching] = chartOutcomes(manifest);

  // ---- Section 1: question_and_chart_choice ----
  stringCheck(results, "question_and_chart_choice", "audience_declared",
    manifest, ["brief", "audience"],
    "the design record declares its audience as a non-empty string");
  stringCheck(results, "question_and_chart_choice", "question_declared",
    manifest, ["brief", "question"],
    "the design record declares the question it answers as a non-empty string");
  emit(results, "question_and_chart_choice", "chart_entries_complete",
    outcomes, chartsValue);
  emit(results, "question_and_chart_choice",
    "chart_types_match_declared_questions", outcomes, chartsValue);
  emit(results, "question_and_chart_choice", "comparison_charts_sorted",
    outcomes, chartsValue);

  // ---- Section 2: honesty_and_axes ----
  emit(results, "honesty_and_axes", "bar_charts_y_axis_starts_at_zero",
    outcomes, chartsValue);
  emit(results, "honesty_and_axes", "no_dual_axes_in_declared_charts",
    outcomes, chartsValue);
  emit(results, "honesty_and_axes", "truncated_axes_flagged_loudly",
    outcomes, chartsValue);
  boolCheck(results, "honesty_and_axes",
    "consistent_scales_when_comparing_panels",
    manifest, ["honesty", "consistent_scales_when_comparing_panels"],
    "method step 2: consistent scales are declared when comparing panels");
  boolCheck(results, "honesty_and_axes", "data_source_labeled",
    manifest, ["honesty", "data_source_labeled"],
    "method step 2: the data source is labeled on the chart");
  boolCheck(results, "honesty_and_axes", "data_date_labeled",
    manifest, ["honesty", "data_date_labeled"],
    "method step 2: the data date is labeled on the chart");
  falseCheck(results, "honesty_and_axes",
    "misleading_axes_or_scales_not_present",
    manifest, ["honesty", "misleading_axes_or_scales_present"],
    "red line: no misleading axes or scales are present");

  // ---- Section 3: perception_and_chart_junk ----
  boolCheck(results, "perception_and_chart_junk",
    "primary_encoding_uses_position_or_length",
    manifest, ["perception", "primary_encoding_uses_position_or_length"],
    "method step 3: the primary encoding uses position or length, which beat angle, area and colour");
  boolCheck(results, "perception_and_chart_junk",
    "most_important_element_top_left_or_largest",
    manifest,
    ["perception", "most_important_element_top_left_or_largest"],
    "method step 3: the most important thing is top-left or largest");
  boolCheck(results, "perception_and_chart_junk", "gridlines_faint",
    manifest, ["perception", "gridlines_faint"],
    "method step 3: gridlines are faint (chart-junk minimized)");
  emit(results, "perception_and_chart_junk", "no_3d_in_declared_charts",
    outcomes, chartsValue);
  boolCheck(results, "perception_and_chart_junk", "chart_junk_minimized",
    manifest, ["perception", "chart_junk_minimized"],
    "method step 3: chart-junk is minimized");
  falseCheck(results, "perception_and_chart_junk",
    "chart_junk_not_used_as_branding",
    manifest, ["perception", "chart_junk_used_as_branding"],
    "red line: chart-junk is not used as branding");

  // ---- Section 4: color ----
  boolCheck(results, "color", "palette_colorblind_safe",
    manifest, ["color", "palette_colorblind_safe"],
    "method step 4 / quality gate: the palette is declared colorblind-safe");
  boolCheck(results, "color", "sequential_palette_for_magnitude",
    manifest, ["color", "sequential_palette_for_magnitude"],
    "method step 4: a sequential palette is used for magnitude");
  boolCheck(results, "color",
    "diverging_palette_around_real_midpoint",
    manifest, ["color", "diverging_palette_around_real_midpoint"],
    "method step 4: any diverging palette is around a real midpoint");
  emit(results, "color",
    "red_green_not_used_alone_in_declared_charts", outcomes, chartsValue);
  emit(results, "color", "category_counts_within_stated_limit",
    outcomes, chartsValue);

  // ---- Section 5: annotation_and_labels ----
  boolCheck(results, "annotation_and_labels",
    "title_states_finding_not_topic",
    manifest, ["annotation", "title_states_finding_not_topic"],
    "method step 5 / quality gate: the title states the finding, not the topic");
  boolCheck(results, "annotation_and_labels",
    "events_and_thresholds_marked",
    manifest, ["annotation", "events_and_thresholds_marked"],
    "method step 5: events and thresholds are marked");
  boolCheck(results, "annotation_and_labels",
    "outliers_called_out_directly",
    manifest, ["annotation", "outliers_called_out_directly"],
    "method step 5: outliers are called out directly");
  boolCheck(results, "annotation_and_labels", "key_values_annotated",
    manifest, ["annotation", "key_values_annotated"],
    "quality gate: key values are annotated");
  emit(results, "annotation_and_labels",
    "axis_labels_and_units_complete", outcomes, chartsValue);

  // ---- Section 6: accessibility ----
  boolCheck(results, "accessibility", "legible_sizes",
    manifest, ["accessibility", "legible_sizes"],
    "method step 6: text sizes are legible");
  boolCheck(results, "accessibility",
    "alt_text_or_table_fallback_present",
    manifest, ["accessibility", "alt_text_or_table_fallback_present"],
    "method step 6 / quality gate: an alt text or table fallback (accessible alternative) exists");
  boolCheck(results, "accessibility", "values_readable_without_hover",
    manifest, ["accessibility", "values_readable_without_hover"],
    "method step 6: values are readable without hover");
  boolCheck(results, "accessibility",
    "contrast_sufficient_for_print_and_screen",
    manifest,
    ["accessibility", "contrast_sufficient_for_print_and_screen"],
    "method step 6: contrast is sufficient for print and screen");

  // ---- Section 7: dashboards_and_reproducibility ----
  boolCheck(results, "dashboards_and_reproducibility",
    "dashboard_one_screen_one_story",
    manifest, ["dashboard", "one_screen_one_story"],
    "method step 7: a dashboard screen tells one story");
  boolCheck(results, "dashboards_and_reproducibility",
    "metric_definitions_and_owners_declared",
    manifest, ["dashboard", "metric_definitions_and_owners_declared"],
    "method step 7: metric definitions and owners are declared");
  boolCheck(results, "dashboards_and_reproducibility",
    "refresh_cadence_visible",
    manifest, ["dashboard", "refresh_cadence_visible"],
    "method step 7: the refresh cadence is visible");
  boolCheck(results, "dashboards_and_reproducibility",
    "stale_panels_retired",
    manifest, ["dashboard", "stale_panels_retired"],
    "method step 7: stale panels are retired");
  boolCheck(results, "dashboards_and_reproducibility",
    "tool_version_and_data_snapshot_recorded",
    manifest,
    ["reproducibility", "tool_version_and_data_snapshot_recorded"],
    "method step 8 / quality gate: the tool version and a data snapshot are recorded with the chart");
  boolCheck(results, "dashboards_and_reproducibility",
    "chart_data_reproducible",
    manifest, ["reproducibility", "data_reproducible"],
    "red line: the charted data is reproducible — data that cannot be reproduced is never charted");

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
    verdict = "DATA_VISUALIZATION_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some(
      (v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DATA_VISUALIZATION_DESIGN_SOUND";
  }

  const computedStatuses = results
    .filter((r) => (COMPUTED_NAMES as readonly string[]).includes(r.check))
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
    service: "data-visualization-design",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    charts_evaluated: chartsEvaluated,
    computed_max_categories: fmt6(computedMaxCategories),
    max_categories_difference_from_limit: fmt6(categoryDifference),
    charts_not_matching_question: chartsNotMatching,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DATA VISUALIZATION DESIGN",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
