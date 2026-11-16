import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/finance-content-compliance-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The COMPLIANT manifest, copied from the Python VerdictTests oracle.
const COMPLIANT: Record<string, unknown> = {
  content: "RRSP vs TFSA explainer",
  jurisdiction: "CA",
  advice_boundary: {
    teaches_frameworks_not_recommendations: true,
    personalized_recommendations_present: false,
    education_not_advice_disclaimer_present: true,
    checklist_passed: true,
    advice_like_content_present: true,
    advice_like_flagged_for_review: true,
  },
  figures: [
    { label: "RRSP contribution limit", as_of: "2026-10",
      source: "CRA", source_is_primary: true, rederived: true },
    { label: "TFSA dollar limit", as_of: "2026-10",
      source: "CRA", source_is_primary: true, rederived: true },
  ],
  accuracy: {
    primary_sources_linked: true,
    rates_and_limits_dated: true,
    recheck_cadence_set: true,
  },
  risk: {
    risk_before_upside: true,
    uses_past_performance: true,
    past_performance_caveat_present: true,
    fees_visible: true,
    taxes_visible: true,
    return_promises_present: false,
    forecasts_presented_as_fact: false,
    survivorship_examples_used: false,
  },
  calculators: {
    includes_calculator: true,
    spec_with_formulas_present: true,
    boundary_cases_tested: true,
    assumptions_visible_in_ui: true,
    dark_patterns_present: false,
  },
  commercial: {
    has_sponsored_or_affiliate_content: true,
    sponsored_affiliate_hard_labeled: true,
    conflicts_disclosed: true,
    editorial_separated_from_sales: true,
    recommendations_for_undisclosed_compensation: false,
    fear_based_selling_present: false,
  },
  compliance: {
    jurisdiction_notes_file_kept: true,
    tools_collect_user_data: true,
    privacy_rules_applied: true,
    user_data_leaves_device_without_consent: false,
  },
  corrections: {
    correction_log_maintained: true,
    corrections_made: true,
    correction_note_visible_and_dated: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 28 Python VerdictTests, ported ----

test("test_compliant_manifest_is_compliant", () => {
  const v = evaluate(clone(COMPLIANT));
  assert.equal(v.verdict, "COMPLIANT");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 32);
  assert.equal(v.figures_evaluated, 2);
  assert.equal(v.figures_incomplete, 0);
});

test("test_personalized_recommendation_fails_advice_boundary", () => {
  const m = clone(COMPLIANT) as any;
  m.advice_boundary.personalized_recommendations_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["advice_boundary"], "fail");
});

test("test_missing_disclaimer_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.advice_boundary.education_not_advice_disclaimer_present = false;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_advice_like_content_not_flagged_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.advice_boundary.advice_like_flagged_for_review = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["advice_boundary"], "fail");
});

test("test_no_advice_like_content_passes_flag_as_not_applicable", () => {
  const m = clone(COMPLIANT) as any;
  m.advice_boundary.advice_like_content_present = false;
  delete m.advice_boundary.advice_like_flagged_for_review;
  assert.equal(evaluate(m).verdict, "COMPLIANT");
});

test("test_missing_jurisdiction_is_insufficient_evidence", () => {
  const m = clone(COMPLIANT) as any;
  delete m.jurisdiction;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["advice_boundary"], "insufficient_evidence");
});

test("test_empty_jurisdiction_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.jurisdiction = "";
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_figure_missing_as_of_is_insufficient_evidence", () => {
  const m = clone(COMPLIANT) as any;
  delete m.figures[0].as_of;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["accuracy_and_sourcing"], "insufficient_evidence");
  assert.equal(v.figures_evaluated, 1);
  assert.equal(v.figures_incomplete, 1);
});

test("test_figure_not_primary_sourced_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.figures[1].source_is_primary = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["accuracy_and_sourcing"], "fail");
});

test("test_figure_not_rederived_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.figures[0].rederived = false;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_no_figures_declared_is_insufficient_evidence", () => {
  const m = clone(COMPLIANT) as any;
  delete m.figures;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.figures_evaluated, 0);
});

test("test_return_promise_fails_risk_framing", () => {
  const m = clone(COMPLIANT) as any;
  m.risk.return_promises_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["risk_framing"], "fail");
});

test("test_past_performance_without_caveat_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.risk.past_performance_caveat_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["risk_framing"], "fail");
});

test("test_no_past_performance_passes_caveat_as_not_applicable", () => {
  const m = clone(COMPLIANT) as any;
  m.risk.uses_past_performance = false;
  delete m.risk.past_performance_caveat_present;
  assert.equal(evaluate(m).verdict, "COMPLIANT");
});

test("test_survivorship_examples_fail", () => {
  const m = clone(COMPLIANT) as any;
  m.risk.survivorship_examples_used = true;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_calculator_without_boundary_tests_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.calculators.boundary_cases_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["calculators_and_tools"], "fail");
});

test("test_dark_patterns_in_calculator_fail", () => {
  const m = clone(COMPLIANT) as any;
  m.calculators.dark_patterns_present = true;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_no_calculator_passes_tool_checks_as_not_applicable", () => {
  const m = clone(COMPLIANT) as any;
  m.calculators = { includes_calculator: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "COMPLIANT");
  assert.equal(v.sections["calculators_and_tools"], "pass");
});

test("test_unlabeled_sponsored_content_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.commercial.sponsored_affiliate_hard_labeled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["commercial_honesty"], "fail");
});

test("test_no_sponsored_content_passes_label_as_not_applicable", () => {
  const m = clone(COMPLIANT) as any;
  m.commercial.has_sponsored_or_affiliate_content = false;
  delete m.commercial.sponsored_affiliate_hard_labeled;
  assert.equal(evaluate(m).verdict, "COMPLIANT");
});

test("test_undisclosed_compensation_recommendation_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.commercial.recommendations_for_undisclosed_compensation = true;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_user_data_leaving_without_consent_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.compliance.user_data_leaves_device_without_consent = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["compliance_and_corrections"], "fail");
});

test("test_silent_correction_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.corrections.correction_note_visible_and_dated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["compliance_and_corrections"], "fail");
});

test("test_no_corrections_passes_note_check_as_not_applicable", () => {
  const m = clone(COMPLIANT) as any;
  m.corrections.corrections_made = false;
  delete m.corrections.correction_note_visible_and_dated;
  assert.equal(evaluate(m).verdict, "COMPLIANT");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLIANT) as any;
  delete m.commercial;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["commercial_honesty"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.figures_evaluated, 0);
  assert.equal(v.figures_incomplete, 0);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLIANT))).includes("VERDICT: COMPLIANT"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ content: "Bad types", jurisdiction: 123, advice_boundary: "not_an_object" }),
    fieldError("jurisdiction"),
  );
});

test("malformed: jurisdiction as number rejected", () => {
  assert.throws(
    () => evaluate({ jurisdiction: 123 }),
    fieldError("jurisdiction"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ advice_boundary: "not_an_object" }),
    fieldError("advice_boundary"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(COMPLIANT) as Record<string, any>;
  m.risk.fees_visible = "yes";
  assert.throws(() => evaluate(m), fieldError("risk.fees_visible"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(COMPLIANT) as Record<string, any>;
  m.figures = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("figures"));
});

test("malformed: list entry field as string rejected", () => {
  const m = structuredClone(COMPLIANT) as Record<string, any>;
  m.figures[0].source_is_primary = "yes";
  assert.throws(() => evaluate(m), fieldError("figures[0].source_is_primary"));
});

test("malformed: list entry as string rejected", () => {
  const m = structuredClone(COMPLIANT) as Record<string, any>;
  m.figures[0] = "not-an-object";
  assert.throws(() => evaluate(m), fieldError("figures[0]"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(COMPLIANT) as Record<string, any>;
  m.accuracy = null;
  assert.throws(() => evaluate(m), fieldError("accuracy"));
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
  .filter((f) => f.startsWith("finance-content-compliance-check--") && f.endsWith(".json"))
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
