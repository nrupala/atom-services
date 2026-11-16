import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/data-analysis-deliverable.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DELIVERABLE_COMPLETE manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  question: "Should we expand the onboarding experiment?",
  framing: {
    question_stated: true,
    decision_named: true,
    decision_owner_named: true,
    decision_deadline_stated: true,
    data_that_would_change_decision_stated: true,
  },
  data: {
    sources: ["product_events", "billing_ledger"],
    provenance_documented: true,
    coverage_documented: true,
    definitions_documented: true,
    metrics_have_single_definition: true,
    gaps_documented: true,
    biases_documented: true,
  },
  analysis: {
    distributions_shown: true,
    segments_shown: true,
    trends_on_comparable_windows: true,
    cherry_picked_baselines_used: false,
    decomposition_performed: true,
    cohort_views_shown: true,
    mechanisms_triangulated: true,
  },
  figures: {
    values: [10, 20, 30, 40],
    stated_total: 100,
    stated_mean: 25,
    prior_window_value: 80,
    current_window_value: 100,
    stated_percent_change: 25,
  },
  inference: {
    sample_size_or_power_considered: true,
    uncertainty_stated: true,
    practical_vs_statistical_significance_distinguished: true,
    multiple_comparisons_checked: true,
    causal_claims_from_observational_data_alone: false,
  },
  recommendation: {
    so_what_stated: true,
    recommendation_made: true,
    expected_effect_stated: true,
    recommendation_owner_named: true,
    measurement_plan_stated: true,
    uncertainty_stated_plainly: true,
  },
  report: {
    covers_question_data_method_finding_recommendation_caveats: true,
    is_one_page: true,
    caveats_stated: true,
    charts_oversell_findings: false,
    numbers_reproducible: true,
  },
  closure: {
    predicted_vs_actual_compared: true,
    model_of_world_updated: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_deliverable_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DELIVERABLE_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 40);
  assert.equal(v.recomputed_total, "100.000000");
  assert.equal(v.recomputed_mean, "25.000000");
  assert.equal(v.recomputed_percent_change, "25.000000");
});

test("test_figures_at_other_values_pass", () => {
  const m = clone(COMPLETE) as any;
  m.figures = {
    values: [5, 15],
    stated_total: 20,
    stated_mean: 10,
    prior_window_value: 50,
    current_window_value: 40,
    stated_percent_change: -20,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_COMPLETE");
  assert.equal(v.recomputed_percent_change, "-20.000000");
});

test("test_stated_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.figures.stated_total = 101;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["descriptive_and_diagnostic"], "fail");
  assert.equal(checkStatus(v, "stated_total_matches_declared_values"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_stated_mean_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.figures.stated_mean = 26;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(checkStatus(v, "stated_mean_matches_declared_values"), "fail");
});

test("test_stated_percent_change_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.figures.stated_percent_change = 20;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "stated_percent_change_matches_declared_windows"), "fail");
});

test("test_zero_prior_window_fails_percent_change", () => {
  const m = clone(COMPLETE) as any;
  m.figures.prior_window_value = 0;
  m.figures.stated_percent_change = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.recomputed_percent_change, null);
});

test("test_empty_values_list_fails_computed", () => {
  const m = clone(COMPLETE) as any;
  m.figures.values = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(checkStatus(v, "stated_total_matches_declared_values"), "fail");
  assert.equal(v.recomputed_total, null);
  assert.equal(v.recomputed_mean, null);
});

test("test_missing_figure_inputs_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.figures.stated_mean;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "stated_mean_matches_declared_values"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.recomputed_mean, "25.000000");
});

test("test_missing_values_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.figures;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.recomputed_total, null);
  assert.equal(v.recomputed_percent_change, null);
});

test("test_question_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.question_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["question_framing"], "fail");
});

test("test_decision_owner_not_named_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.decision_owner_named = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_no_data_sources_declared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.sources = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(checkStatus(v, "data_sources_declared"), "fail");
});

test("test_missing_data_sources_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.data.sources;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "data_sources_declared"), "missing");
});

test("test_provenance_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.provenance_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["data_provenance"], "fail");
});

test("test_metric_with_two_definitions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.metrics_have_single_definition = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_cherry_picked_baselines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.analysis.cherry_picked_baselines_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(checkStatus(v, "no_cherry_picked_baselines"), "fail");
});

test("test_distributions_not_shown_fails", () => {
  const m = clone(COMPLETE) as any;
  m.analysis.distributions_shown = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_causal_claims_from_observational_alone_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.inference.causal_claims_from_observational_data_alone = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["statistical_care"], "fail");
});

test("test_multiple_comparisons_not_checked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.inference.multiple_comparisons_checked = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_uncertainty_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.inference.uncertainty_stated = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_recommendation_without_owner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.recommendation.recommendation_owner_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["insight_and_action"], "fail");
});

test("test_recommendation_without_measurement_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.recommendation.measurement_plan_stated = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_charts_that_oversell_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.report.charts_oversell_findings = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DELIVERABLE_NOT_COMPLETE");
  assert.equal(v.sections["reporting_and_reproducibility"], "fail");
});

test("test_caveats_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.report.caveats_stated = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_numbers_not_reproducible_fails", () => {
  const m = clone(COMPLETE) as any;
  m.report.numbers_reproducible = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_loop_not_closed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.closure.predicted_vs_actual_compared = false;
  assert.equal(evaluate(m).verdict, "DELIVERABLE_NOT_COMPLETE");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.inference;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["statistical_care"], "insufficient_evidence");
});

test("test_sparse_manifest_is_insufficient_evidence", () => {
  const v = evaluate({ question: "Why did churn rise?" });
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.recomputed_total, null);
  assert.equal(v.recomputed_mean, null);
  assert.equal(v.recomputed_percent_change, null);
  assert.equal(v.question, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: DELIVERABLE_COMPLETE"));
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
// MalformedTypeTests, ported. A documented field present with the
// wrong JSON type raises FieldTypeError naming the field.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.question = 12345;
  assert.throws(() => evaluate(m), fieldError("question"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ framing: "should-be-an-object" }),
    fieldError("framing"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data.sources = "product_events";
  assert.throws(() => evaluate(m), fieldError("data.sources"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data.sources = ["product_events", 42];
  assert.throws(() => evaluate(m), fieldError("data.sources[1]"));
});

test("malformed: numeric list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.values = [10, "20"];
  assert.throws(() => evaluate(m), fieldError("figures.values[1]"));
});

test("malformed: numeric list as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.values = "10,20,30,40";
  assert.throws(() => evaluate(m), fieldError("figures.values"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.framing.question_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("framing.question_stated"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.stated_total = "100";
  assert.throws(() => evaluate(m), fieldError("figures.stated_total"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.stated_mean = true;
  assert.throws(() => evaluate(m), fieldError("figures.stated_mean"));
});

test("malformed: nested boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.closure.model_of_world_updated = 1;
  assert.throws(
    () => evaluate(m), fieldError("closure.model_of_world_updated"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures = null;
  assert.throws(() => evaluate(m), fieldError("figures"));
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
  .filter((f) => f.startsWith("data-analysis-deliverable--") && f.endsWith(".json"))
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
