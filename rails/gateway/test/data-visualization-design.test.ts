import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/data-visualization-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function charts() {
  return [
    { name: "revenue_by_region", question_type: "comparison",
      chart_type: "bar", x_axis_label: "Region",
      y_axis_label: "Revenue", y_axis_unit: "USD",
      y_axis_start: 0, categories_count: 4, bars_sorted: true,
      dual_axis: false, axis_truncated: false,
      truncated_flagged_loudly: false, uses_3d: false,
      red_green_only: false },
    { name: "revenue_trend", question_type: "trend",
      chart_type: "line", x_axis_label: "Quarter",
      y_axis_label: "Revenue", y_axis_unit: "USD",
      y_axis_start: 0, categories_count: 1, bars_sorted: false,
      dual_axis: false, axis_truncated: false,
      truncated_flagged_loudly: false, uses_3d: false,
      red_green_only: false },
    { name: "margin_scatter", question_type: "relationship",
      chart_type: "scatter", x_axis_label: "Spend",
      y_axis_label: "Margin", y_axis_unit: "percent",
      y_axis_start: 0, categories_count: 2, bars_sorted: false,
      dual_axis: false, axis_truncated: true,
      truncated_flagged_loudly: true, uses_3d: false,
      red_green_only: false },
  ];
}

// The DATA_VISUALIZATION_DESIGN_SOUND manifest, copied from the
// Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Q3 Board Report Charts",
  brief: {
    audience: "Board members deciding Q4 spend",
    question: "Where did revenue change and why?",
  },
  charts: charts(),
  honesty: {
    consistent_scales_when_comparing_panels: true,
    data_source_labeled: true,
    data_date_labeled: true,
    misleading_axes_or_scales_present: false,
  },
  perception: {
    primary_encoding_uses_position_or_length: true,
    most_important_element_top_left_or_largest: true,
    gridlines_faint: true,
    chart_junk_minimized: true,
    chart_junk_used_as_branding: false,
  },
  color: {
    palette_colorblind_safe: true,
    sequential_palette_for_magnitude: true,
    diverging_palette_around_real_midpoint: true,
  },
  annotation: {
    title_states_finding_not_topic: true,
    events_and_thresholds_marked: true,
    outliers_called_out_directly: true,
    key_values_annotated: true,
  },
  accessibility: {
    legible_sizes: true,
    alt_text_or_table_fallback_present: true,
    values_readable_without_hover: true,
    contrast_sufficient_for_print_and_screen: true,
  },
  dashboard: {
    one_screen_one_story: true,
    metric_definitions_and_owners_declared: true,
    refresh_cadence_visible: true,
    stale_panels_retired: true,
  },
  reproducibility: {
    tool_version_and_data_snapshot_recorded: true,
    data_reproducible: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 38);
  assert.equal(v.charts_evaluated, 3);
  assert.equal(v.computed_max_categories, "4.000000");
  assert.equal(v.max_categories_difference_from_limit, "-3.000000");
  assert.deepEqual(v.charts_not_matching_question, []);
});

test("test_empty_audience_fails", () => {
  const m = clone(COMPLETE) as any;
  m.brief.audience = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "audience_declared"), "fail");
  assert.equal(v.sections["question_and_chart_choice"], "fail");
});

test("test_absent_question_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.brief.question;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "question_declared"), "missing");
});

test("test_chart_type_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].chart_type = "line";
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "chart_types_match_declared_questions"), "fail");
  assert.deepEqual(v.charts_not_matching_question, ["revenue_by_region"]);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_each_stated_mapping_passes", () => {
  const cases: [string, string][] = [
    ["comparison", "bar"], ["trend", "line"],
    ["distribution", "histogram"], ["distribution", "box_plot"],
    ["relationship", "scatter"], ["composition", "stacked_bar"],
    ["part_to_whole_over_time", "small_multiples"],
  ];
  for (const [qtype, ctype] of cases) {
    const m = clone(COMPLETE) as any;
    for (const row of m.charts) {
      row.question_type = qtype;
      row.chart_type = ctype;
      row.bars_sorted = true;
      row.y_axis_start = 0;
    }
    assert.equal(evaluate(m).verdict, "DATA_VISUALIZATION_DESIGN_SOUND");
  }
});

test("test_unknown_question_type_fails_mapping", () => {
  const m = clone(COMPLETE) as any;
  m.charts[1].question_type = "ranking";
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "chart_types_match_declared_questions"), "fail");
  assert.deepEqual(v.charts_not_matching_question, ["revenue_trend"]);
});

test("test_unsorted_comparison_bars_fail", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].bars_sorted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "comparison_charts_sorted"), "fail");
});

test("test_missing_charts_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.charts;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "chart_entries_complete"), "missing");
  assert.equal(v.charts_evaluated, 0);
  assert.equal(v.computed_status, null);
  assert.equal(v.charts_not_matching_question, null);
  assert.equal(v.computed_max_categories, null);
});

test("test_empty_charts_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.charts = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "chart_types_match_declared_questions"), "missing");
});

test("test_incomplete_chart_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.charts[1].y_axis_unit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "chart_entries_complete"), "missing");
  assert.equal(v.charts_evaluated, 2);
  assert.equal(v.computed_max_categories, null);
});

test("test_empty_string_chart_field_is_incomplete", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].x_axis_label = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "chart_entries_complete"), "missing");
  assert.equal(v.charts_evaluated, 2);
});

test("test_bar_chart_not_at_zero_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].y_axis_start = 50;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "bar_charts_y_axis_starts_at_zero"), "fail");
  assert.equal(v.sections["honesty_and_axes"], "fail");
});

test("test_stacked_bar_not_at_zero_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].question_type = "composition";
  m.charts[0].chart_type = "stacked_bar";
  m.charts[0].y_axis_start = 10;
  assert.equal(
    checkStatus(evaluate(m), "bar_charts_y_axis_starts_at_zero"),
    "fail");
});

test("test_non_bar_chart_not_at_zero_passes_zero_check", () => {
  const m = clone(COMPLETE) as any;
  m.charts[1].y_axis_start = 20;
  m.charts[1].axis_truncated = true;
  m.charts[1].truncated_flagged_loudly = true;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "bar_charts_y_axis_starts_at_zero"), "pass");
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_SOUND");
});

test("test_dual_axis_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[2].dual_axis = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "no_dual_axes_in_declared_charts"), "fail");
});

test("test_truncated_axis_not_flagged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[2].truncated_flagged_loudly = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "truncated_axes_flagged_loudly"), "fail");
});

test("test_inconsistent_scales_fail", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.consistent_scales_when_comparing_panels = false;
  assert.equal(evaluate(m).verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
});

test("test_misleading_axes_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.misleading_axes_or_scales_present = true;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "misleading_axes_or_scales_not_present"), "fail");
  assert.equal(v.sections["honesty_and_axes"], "fail");
});

test("test_source_not_labeled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.data_source_labeled = false;
  assert.equal(evaluate(m).sections["honesty_and_axes"], "fail");
});

test("test_3d_chart_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].uses_3d = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_3d_in_declared_charts"), "fail");
  assert.equal(v.sections["perception_and_chart_junk"], "fail");
});

test("test_chart_junk_as_branding_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.perception.chart_junk_used_as_branding = true;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "chart_junk_not_used_as_branding"), "fail");
});

test("test_position_length_not_primary_fails", () => {
  const m = clone(COMPLETE) as any;
  m.perception.primary_encoding_uses_position_or_length = false;
  assert.equal(evaluate(m).verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
});

test("test_palette_not_colorblind_safe_fails", () => {
  const m = clone(COMPLETE) as any;
  m.color.palette_colorblind_safe = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(v.sections["color"], "fail");
});

test("test_red_green_only_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[1].red_green_only = true;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "red_green_not_used_alone_in_declared_charts"),
    "fail");
});

test("test_category_count_at_limit_passes", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].categories_count = 7;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_SOUND");
  assert.equal(v.computed_max_categories, "7.000000");
  assert.equal(v.max_categories_difference_from_limit, "0.000000");
});

test("test_category_count_above_limit_fails", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].categories_count = 9;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "category_counts_within_stated_limit"), "fail");
  assert.equal(v.computed_max_categories, "9.000000");
  assert.equal(v.max_categories_difference_from_limit, "2.000000");
});

test("test_title_states_topic_not_finding_fails", () => {
  const m = clone(COMPLETE) as any;
  m.annotation.title_states_finding_not_topic = false;
  assert.equal(evaluate(m).sections["annotation_and_labels"], "fail");
});

test("test_outliers_not_called_out_fails", () => {
  const m = clone(COMPLETE) as any;
  m.annotation.outliers_called_out_directly = false;
  assert.equal(evaluate(m).verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
});

test("test_alt_fallback_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.accessibility.alt_text_or_table_fallback_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["accessibility"], "insufficient_evidence");
});

test("test_values_require_hover_fails", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.values_readable_without_hover = false;
  assert.equal(evaluate(m).sections["accessibility"], "fail");
});

test("test_dashboard_stale_panels_not_retired_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dashboard.stale_panels_retired = false;
  assert.equal(
    evaluate(m).sections["dashboards_and_reproducibility"], "fail");
});

test("test_snapshot_not_recorded_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reproducibility.tool_version_and_data_snapshot_recorded = false;
  assert.equal(evaluate(m).verdict, "DATA_VISUALIZATION_DESIGN_NOT_SOUND");
});

test("test_irreproducible_data_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.reproducibility.data_reproducible = false;
  assert.equal(
    checkStatus(evaluate(m), "chart_data_reproducible"), "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.color;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["color"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.charts_evaluated, 0);
  assert.equal(v.computed_max_categories, null);
  assert.equal(v.max_categories_difference_from_limit, null);
  assert.equal(v.charts_not_matching_question, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: DATA_VISUALIZATION_DESIGN_SOUND"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ honesty: "should-be-an-object" }),
    fieldError("honesty"),
  );
});

test("malformed: brief string leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.brief.audience = 42;
  assert.throws(() => evaluate(m), fieldError("brief.audience"));
});

test("malformed: charts list as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts = { name: "revenue_by_region" };
  assert.throws(() => evaluate(m), fieldError("charts"));
});

test("malformed: chart entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0] = "revenue_by_region";
  assert.throws(() => evaluate(m), fieldError("charts[0]"));
});

test("malformed: chart string leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts[2].chart_type = 7;
  assert.throws(() => evaluate(m), fieldError("charts[2].chart_type"));
});

test("malformed: chart numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].y_axis_start = "0";
  assert.throws(() => evaluate(m), fieldError("charts[0].y_axis_start"));
});

test("malformed: chart numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts[1].categories_count = true;
  assert.throws(() => evaluate(m),
    fieldError("charts[1].categories_count"));
});

test("malformed: chart boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.charts[0].dual_axis = "no";
  assert.throws(() => evaluate(m), fieldError("charts[0].dual_axis"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.misleading_axes_or_scales_present = "no";
  assert.throws(() => evaluate(m),
    fieldError("honesty.misleading_axes_or_scales_present"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.color = null;
  assert.throws(() => evaluate(m), fieldError("color"));
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
  .filter((f) => f.startsWith("data-visualization-design--") && f.endsWith(".json"))
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
