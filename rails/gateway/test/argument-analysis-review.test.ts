import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/argument-analysis-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The ARGUMENT_ANALYSIS_COMPLETE manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  argument: "expand-the-pilot",
  anatomy: { premises_identified: true,
             conclusion_identified: true,
             validity_distinguished_from_soundness: true,
             steelman_stated: true },
  evidence: { source_quality_assessed: true,
              sample_size_considered: true,
              confounders_considered: true,
              replication_considered: true,
              anecdote_treated_as_data: false },
  calibration: { base_rate_stated: true,
                 diagnosticity_assessed: true,
                 confidence_percent: 65,
                 known_vs_believed_separated: true },
  stress_test: { inversion_or_premortem_done: true,
                 second_order_consequences_traced: true,
                 change_mind_evidence_prestated: true },
  screening: {
    fallacies_screened: ["ad_hominem", "straw_man", "false_dichotomy",
                         "appeal_to_authority", "slippery_slope",
                         "correlation_as_causation", "survivorship_bias",
                         "base_rate_neglect", "sunk_cost"],
    biases_screened: ["confirmation", "anchoring", "availability",
                      "motivated_reasoning", "recency",
                      "overconfidence"] },
  razors: { simplest_explanation_preferred: true,
            malice_not_assumed_without_evidence: true,
            chestertons_fence_respected: true,
            map_territory_distinguished: true },
  countercase: { key_assumption_named: true,
                 strongest_countercase_offered: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 20 Python VerdictTests, ported ----

test("test_complete_manifest_is_analysis_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 24);
  assert.deepEqual(v.missing_fallacies, []);
  assert.deepEqual(v.missing_biases, []);
  assert.equal(v.confidence_percent, 65);
});

test("test_extra_screened_tokens_are_ignored", () => {
  const m = clone(COMPLETE) as any;
  m.screening.fallacies_screened.push("whataboutism");
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_COMPLETE");
});

test("test_missing_fallacy_fails_and_is_reported", () => {
  const m = clone(COMPLETE) as any;
  m.screening.fallacies_screened =
    m.screening.fallacies_screened.filter((f: string) => f !== "sunk_cost");
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.equal(v.sections["fallacy_and_bias_screening"], "fail");
  assert.deepEqual(v.missing_fallacies, ["sunk_cost"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_missing_bias_fails_and_is_reported", () => {
  const m = clone(COMPLETE) as any;
  m.screening.biases_screened =
    m.screening.biases_screened.filter((b: string) => b !== "recency");
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.deepEqual(v.missing_biases, ["recency"]);
});

test("test_empty_fallacy_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.screening.fallacies_screened = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.equal(checkStatus(v, "all_listed_fallacies_screened"), "fail");
  assert.equal(v.missing_fallacies?.length, 9);
});

test("test_absent_screening_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.screening;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.missing_fallacies, null);
  assert.equal(v.missing_biases, null);
  assert.equal(v.computed_status, null);
});

test("test_confidence_at_100_is_binary_certainty_and_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_percent = 100;
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.equal(checkStatus(v, "confidence_probabilistic_and_explicit"), "fail");
});

test("test_confidence_at_0_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_percent = 0;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
});

test("test_confidence_just_inside_bounds_passes", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_percent = 99.5;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_COMPLETE");
  m.calibration.confidence_percent = 0.5;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_COMPLETE");
});

test("test_absent_confidence_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.calibration.confidence_percent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.confidence_percent, null);
  assert.equal(v.computed_status, null);
});

test("test_no_steelman_fails", () => {
  const m = clone(COMPLETE) as any;
  m.anatomy.steelman_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.equal(v.sections["anatomy_and_steelman"], "fail");
});

test("test_validity_soundness_not_distinguished_fails", () => {
  const m = clone(COMPLETE) as any;
  m.anatomy.validity_distinguished_from_soundness = false;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
});

test("test_anecdote_treated_as_data_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.anecdote_treated_as_data = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
  assert.equal(v.sections["evidence_weighing"], "fail");
});

test("test_base_rate_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.base_rate_stated = false;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
});

test("test_change_mind_not_prestated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stress_test.change_mind_evidence_prestated = false;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
});

test("test_countercase_not_offered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.countercase.strongest_countercase_offered = false;
  assert.equal(evaluate(m).verdict, "ARGUMENT_ANALYSIS_DEFICIENT");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.evidence;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["evidence_weighing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.confidence_percent, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ARGUMENT_ANALYSIS_COMPLETE"));
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

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.argument = 12345;
  assert.throws(() => evaluate(m), fieldError("argument"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ anatomy: "should-be-an-object" }),
    fieldError("anatomy"),
  );
});

test("malformed: list as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.screening.fallacies_screened = "ad_hominem";
  assert.throws(() => evaluate(m), fieldError("screening.fallacies_screened"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.screening.biases_screened = ["confirmation", 42];
  assert.throws(() => evaluate(m), fieldError("screening.biases_screened[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.anatomy.steelman_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("anatomy.steelman_stated"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_percent = "high";
  assert.throws(() => evaluate(m), fieldError("calibration.confidence_percent"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_percent = true;
  assert.throws(() => evaluate(m), fieldError("calibration.confidence_percent"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.evidence = null;
  assert.throws(() => evaluate(m), fieldError("evidence"));
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
  .filter((f) => f.startsWith("argument-analysis-review--") && f.endsWith(".json"))
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
