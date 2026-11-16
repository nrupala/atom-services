import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/codebase-visualization.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function diagrams() {
  return [
    { name: "dependency_graph", format: "mermaid",
      scope: "all modules", generation_source: "import script",
      generated_at: "2026-11-10" },
    { name: "architecture_context", format: "plantuml",
      scope: "system context", generation_source: "c4 export",
      generated_at: "2026-11-10" },
    { name: "hot_path_calls", format: "graphviz",
      scope: "hot paths", generation_source: "profiler export",
      generated_at: "2026-11-10" },
  ];
}

// The CODEBASE_VISUALIZATION_READY manifest, copied from the
// Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Codebase",
  diagrams_as_code: {
    key_diagrams_exist_as_code_in_repo: true,
    regenerable: true,
    versioned_and_diffable: true,
    regenerated_on_change: true,
    diagrams: diagrams(),
  },
  dependency: {
    graph_present: true,
    cycles_highlighted: true,
    layering_violations_highlighted: true,
    known_issues_list_maintained: true,
    modules_total: 40,
    modules_included: 40,
  },
  call_and_flow: {
    call_graph_for_hot_paths_present: true,
    sequence_diagrams_for_critical_journeys_present: true,
    data_flow_for_pipelines_present: true,
  },
  architecture: {
    map_present: true,
    levels_declared: ["context", "containers", "components"],
    one_page_per_level: true,
    owners_annotated: true,
    boundaries_annotated: true,
    adrs_live_beside_maps: true,
  },
  metrics: {
    complexity_heatmap_present: true,
    coverage_overlay_present: true,
    hotspot_view_considered: true,
    hotspot_change_frequency: 12,
    hotspot_complexity: 8,
    declared_hotspot_score: 96,
  },
  history: {
    churn_timeline_present: true,
    ownership_map_present: true,
    incident_overlays_present: true,
  },
  honesty: {
    each_diagram_labeled_scope_and_generation_source: true,
    diagrams_labeled_generated_at_tool_scope: true,
    generatable_diagrams_generated: true,
    stale_diagrams_shipped_as_truth: false,
    unlabeled_hand_drawn_maps_guiding_decisions: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 32);
  assert.equal(v.diagrams_evaluated, 3);
  assert.equal(v.computed_dependency_coverage, "1.000000");
  assert.equal(v.dependency_coverage_difference, "0.000000");
  assert.equal(v.computed_hotspot_score, "96.000000");
  assert.equal(v.hotspot_score_difference, "0.000000");
  assert.deepEqual(v.c4_levels_not_declared, []);
});

test("test_diagrams_not_as_code_in_repo_fails", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.key_diagrams_exist_as_code_in_repo = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.sections["diagrams_as_code"], "fail");
});

test("test_diagrams_not_regenerated_on_change_fails", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.regenerated_on_change = false;
  assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_NOT_READY");
});

test("test_unstated_diagram_format_fails", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams[1].format = "png_screenshot";
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(
    checkStatus(v, "diagram_formats_use_stated_diagrams_as_code_tools"),
    "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
  assert.equal(v.diagrams_evaluated, 3);
});

test("test_each_stated_format_passes", () => {
  for (const fmt of ["mermaid", "graphviz", "plantuml"]) {
    const m = clone(COMPLETE) as any;
    for (const d of m.diagrams_as_code.diagrams) d.format = fmt;
    assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_READY");
  }
});

test("test_missing_diagrams_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.diagrams_as_code.diagrams;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "diagram_entries_complete"), "missing");
  assert.equal(v.diagrams_evaluated, 0);
  assert.equal(v.computed_status, null);
});

test("test_empty_diagrams_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "diagram_formats_use_stated_diagrams_as_code_tools"),
    "missing");
});

test("test_incomplete_diagram_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.diagrams_as_code.diagrams[1].scope;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "diagram_entries_complete"), "missing");
  assert.equal(v.diagrams_evaluated, 2);
});

test("test_empty_string_diagram_field_is_incomplete", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams[0].generated_at = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "diagram_entries_complete"), "missing");
  assert.equal(v.diagrams_evaluated, 2);
});

test("test_cycles_not_highlighted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.cycles_highlighted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.sections["dependency_views"], "fail");
});

test("test_known_issues_list_not_maintained_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.known_issues_list_maintained = false;
  assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_NOT_READY");
});

test("test_dependency_partial_coverage_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.modules_included = 30;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(
    checkStatus(v, "dependency_graph_covers_all_declared_modules"),
    "fail");
  assert.equal(v.computed_dependency_coverage, "0.750000");
  assert.equal(v.dependency_coverage_difference, "-10.000000");
});

test("test_dependency_coverage_at_other_counts_passes", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.modules_total = 7;
  m.dependency.modules_included = 7;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_READY");
  assert.equal(v.computed_dependency_coverage, "1.000000");
});

test("test_dependency_included_above_total_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.modules_included = 41;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "dependency_graph_covers_all_declared_modules"),
    "fail");
  assert.equal(v.dependency_coverage_difference, "1.000000");
});

test("test_zero_modules_total_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.modules_total = 0;
  m.dependency.modules_included = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.computed_dependency_coverage, null);
  assert.equal(v.dependency_coverage_difference, "0.000000");
});

test("test_missing_dependency_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.dependency.modules_total;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_dependency_coverage, null);
  assert.equal(v.dependency_coverage_difference, null);
});

test("test_call_graph_missing_view_fails", () => {
  const m = clone(COMPLETE) as any;
  m.call_and_flow.call_graph_for_hot_paths_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.sections["call_and_flow_views"], "fail");
});

test("test_data_flow_view_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.call_and_flow.data_flow_for_pipelines_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["call_and_flow_views"],
    "insufficient_evidence");
});

test("test_c4_levels_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = ["context", "containers"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.deepEqual(v.c4_levels_not_declared, ["components"]);
  assert.equal(checkStatus(v, "c4_levels_cover_stated_levels"), "fail");
});

test("test_c4_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.deepEqual(v.c4_levels_not_declared,
    ["context", "containers", "components"]);
});

test("test_c4_unknown_levels_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = ["system", "modules"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.c4_levels_not_declared?.length, 3);
});

test("test_c4_extra_levels_still_pass", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = [
    "context", "containers", "components", "code"];
  assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_READY");
});

test("test_missing_c4_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.architecture.levels_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.c4_levels_not_declared, null);
});

test("test_owners_not_annotated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.owners_annotated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.sections["architecture_maps"], "fail");
});

test("test_hotspot_score_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics.declared_hotspot_score = 80;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(
    checkStatus(v,
      "hotspot_score_matches_change_frequency_times_complexity"),
    "fail");
  assert.equal(v.hotspot_score_difference, "-16.000000");
  assert.equal(v.computed_hotspot_score, "96.000000");
});

test("test_hotspot_score_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.metrics.hotspot_change_frequency = 5;
  m.metrics.hotspot_complexity = 7.5;
  m.metrics.declared_hotspot_score = 37.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_READY");
  assert.equal(v.computed_hotspot_score, "37.500000");
});

test("test_missing_hotspot_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics.hotspot_complexity;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_hotspot_score, null);
  assert.equal(v.hotspot_score_difference, null);
});

test("test_hotspot_view_not_considered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics.hotspot_view_considered = false;
  assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_NOT_READY");
});

test("test_churn_timeline_absent_section_fails_history", () => {
  const m = clone(COMPLETE) as any;
  m.history.churn_timeline_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(v.sections["metrics_and_history_views"], "fail");
});

test("test_stale_diagrams_shipped_as_truth_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.stale_diagrams_shipped_as_truth = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(
    checkStatus(v, "stale_diagrams_not_shipped_as_truth"), "fail");
  assert.equal(v.sections["honesty_and_currency"], "fail");
});

test("test_unlabeled_hand_drawn_maps_guiding_decisions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.unlabeled_hand_drawn_maps_guiding_decisions = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODEBASE_VISUALIZATION_NOT_READY");
  assert.equal(
    checkStatus(v, "unlabeled_hand_drawn_maps_not_guiding_decisions"),
    "fail");
});

test("test_diagrams_unlabeled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.each_diagram_labeled_scope_and_generation_source = false;
  assert.equal(evaluate(m).verdict, "CODEBASE_VISUALIZATION_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.honesty;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["honesty_and_currency"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.diagrams_evaluated, 0);
  assert.equal(v.computed_dependency_coverage, null);
  assert.equal(v.computed_hotspot_score, null);
  assert.equal(v.c4_levels_not_declared, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CODEBASE_VISUALIZATION_READY"));
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
    () => evaluate({ dependency: "should-be-an-object" }),
    fieldError("dependency"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = "context";
  assert.throws(() => evaluate(m),
    fieldError("architecture.levels_declared"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.levels_declared = ["context", 42];
  assert.throws(() => evaluate(m),
    fieldError("architecture.levels_declared[1]"));
});

test("malformed: diagrams list as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams = { name: "dependency_graph" };
  assert.throws(() => evaluate(m),
    fieldError("diagrams_as_code.diagrams"));
});

test("malformed: diagram entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams[0] = "dependency_graph";
  assert.throws(() => evaluate(m),
    fieldError("diagrams_as_code.diagrams[0]"));
});

test("malformed: diagram string leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.diagrams_as_code.diagrams[2].format = 7;
  assert.throws(() => evaluate(m),
    fieldError("diagrams_as_code.diagrams[2].format"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.stale_diagrams_shipped_as_truth = "no";
  assert.throws(() => evaluate(m),
    fieldError("honesty.stale_diagrams_shipped_as_truth"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.metrics.hotspot_complexity = "8";
  assert.throws(() => evaluate(m), fieldError("metrics.hotspot_complexity"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.dependency.modules_total = true;
  assert.throws(() => evaluate(m), fieldError("dependency.modules_total"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.architecture = null;
  assert.throws(() => evaluate(m), fieldError("architecture"));
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
  .filter((f) => f.startsWith("codebase-visualization--") && f.endsWith(".json"))
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
