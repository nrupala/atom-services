import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/base-rate-card.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CARD_COMPLETE manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  claim: "This startup will reach profitability within a year",
  evidence: {
    claim_restated_precisely: true,
    supporting_evidence_sought: true,
    refuting_evidence_sought: true,
    hierarchy_applied: true,
    conflicts_noted_with_reasons: true,
  },
  base_rate: {
    reference_class_defined: true,
    considered_first: true,
    reference_class_size: 100,
    reference_class_successes: 23,
    stated: 0.23,
  },
  steelman: {
    strongest_counterargument_built: true,
    counterargument_engaged: true,
    opposing_view_strawmanned: false,
  },
  fallacies: {
    spot_check_performed: true,
    checked: ["ad_hominem", "straw_man", "false_dilemma",
              "appeal_to_authority_or_antiquity", "survivorship",
              "motivated_reasoning", "cherry_picked_windows"],
  },
  calibration: {
    confidence_stated: true,
    confidence_value: 0.8,
    outcomes_reviewed: true,
    hit_rate_tracked_by_confidence_band: true,
  },
  judgment: {
    second_order_effects_considered: true,
    written: true,
    includes_confidence: true,
    includes_key_uncertainties: true,
    conclusion_from_vibes_or_authority_alone: false,
    certainty_outruns_evidence: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_card_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CARD_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 23);
  assert.equal(v.reference_rate, "0.230000");
  assert.equal(v.base_rate_difference, "0.000000");
  assert.deepEqual(v.fallacies_not_checked, []);
});

test("test_stated_rate_matching_counts_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate = {
    reference_class_defined: true,
    considered_first: true,
    reference_class_size: 40,
    reference_class_successes: 10,
    stated: 0.25,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_COMPLETE");
  assert.equal(v.reference_rate, "0.250000");
});

test("test_stated_rate_disagreeing_with_counts_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.stated = 0.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["base_rates"], "fail");
  assert.equal(
    checkStatus(v, "base_rate_consistent_with_reference_counts"), "fail");
  assert.equal(v.base_rate_difference, "0.270000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_successes_above_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.reference_class_successes = 120;
  m.base_rate.stated = 1.0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "base_rate_consistent_with_reference_counts"), "fail");
});

test("test_zero_reference_class_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.reference_class_size = 0;
  m.base_rate.reference_class_successes = 0;
  m.base_rate.stated = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.reference_rate, null);
  assert.equal(v.base_rate_difference, null);
});

test("test_stated_rate_above_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.stated = 1.2;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_missing_base_rate_numbers_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.base_rate.stated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "base_rate_consistent_with_reference_counts"),
    "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.reference_rate, "0.230000");
  assert.equal(v.base_rate_difference, null);
});

test("test_reference_class_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.reference_class_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["base_rates"], "fail");
});

test("test_base_rate_not_considered_first_fails", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.considered_first = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_refuting_evidence_not_sought_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.refuting_evidence_sought = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["claim_and_evidence"], "fail");
});

test("test_claim_not_restated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.claim_restated_precisely = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_strawmanned_opposition_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.steelman.opposing_view_strawmanned = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["steelman"], "fail");
});

test("test_counterargument_not_engaged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.steelman.counterargument_engaged = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_fallacy_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.fallacies.checked = m.fallacies.checked.filter(
    (f: string) => f !== "survivorship");
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.deepEqual(v.fallacies_not_checked, ["survivorship"]);
  assert.equal(checkStatus(v, "all_stated_fallacies_checked"), "fail");
});

test("test_fallacy_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.fallacies.checked = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.deepEqual(v.fallacies_not_checked,
    ["ad_hominem", "straw_man", "false_dilemma",
     "appeal_to_authority_or_antiquity", "survivorship",
     "motivated_reasoning", "cherry_picked_windows"]);
});

test("test_fallacy_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.fallacies.checked = ["bandwagon", "slippery_slope"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.fallacies_not_checked?.length, 7);
});

test("test_missing_fallacy_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.fallacies.checked;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.fallacies_not_checked, null);
});

test("test_confidence_above_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_value = 1.4;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "confidence_within_probability_bounds"), "fail");
});

test("test_confidence_at_bounds_passes", () => {
  for (const value of [0, 1]) {
    const m = clone(COMPLETE) as any;
    m.calibration.confidence_value = value;
    assert.equal(evaluate(m).verdict, "CARD_COMPLETE");
  }
});

test("test_confidence_negative_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_value = -0.1;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_outcomes_not_reviewed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.outcomes_reviewed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["calibration"], "fail");
});

test("test_conclusion_from_authority_alone_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.judgment.conclusion_from_vibes_or_authority_alone = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CARD_NOT_COMPLETE");
  assert.equal(v.sections["second_order_and_judgment"], "fail");
});

test("test_certainty_outrunning_evidence_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.judgment.certainty_outruns_evidence = true;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_judgment_without_uncertainties_fails", () => {
  const m = clone(COMPLETE) as any;
  m.judgment.includes_key_uncertainties = false;
  assert.equal(evaluate(m).verdict, "CARD_NOT_COMPLETE");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.steelman;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["steelman"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.reference_rate, null);
  assert.equal(v.base_rate_difference, null);
  assert.equal(v.fallacies_not_checked, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CARD_COMPLETE"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claim = 12345;
  assert.throws(() => evaluate(m), fieldError("claim"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ evidence: "should-be-an-object" }),
    fieldError("evidence"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.fallacies.checked = "ad_hominem";
  assert.throws(() => evaluate(m), fieldError("fallacies.checked"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.fallacies.checked = ["ad_hominem", 42];
  assert.throws(() => evaluate(m), fieldError("fallacies.checked[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.claim_restated_precisely = "yes";
  assert.throws(
    () => evaluate(m), fieldError("evidence.claim_restated_precisely"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate.stated = "23%";
  assert.throws(() => evaluate(m), fieldError("base_rate.stated"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.calibration.confidence_value = true;
  assert.throws(
    () => evaluate(m), fieldError("calibration.confidence_value"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.base_rate = null;
  assert.throws(() => evaluate(m), fieldError("base_rate"));
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
  .filter((f) => f.startsWith("base-rate-card--") && f.endsWith(".json"))
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
