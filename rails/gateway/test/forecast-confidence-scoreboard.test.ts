import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/forecast-confidence-scoreboard.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CONFIDENCE_SCOREBOARD_SOUND manifest, copied from the
// Python VerdictTests oracle (hand-computed aggregates there).
const COMPLETE: Record<string, unknown> = {
  subject: "product-forecasters-2026",
  record: { resolution_criteria_predeclared: true,
            forecasts_recorded_before_resolution: true,
            unresolved_forecasts_excluded: true },
  forecasts: [
    { forecaster: "ana", claim: "launch ships in March",
      stated_probability: 0.8, outcome: 1 },
    { forecaster: "ana", claim: "churn stays under 5 percent",
      stated_probability: 0.6, outcome: 1 },
    { forecaster: "ana", claim: "enterprise deal closes",
      stated_probability: 0.4, outcome: 0 },
    { forecaster: "ana", claim: "beta fills in two weeks",
      stated_probability: 0.7, outcome: 1 },
    { forecaster: "bo", claim: "revenue target is met",
      stated_probability: 0.9, outcome: 0 },
    { forecaster: "bo", claim: "hire is made by June",
      stated_probability: 0.8, outcome: 0 },
    { forecaster: "bo", claim: "pilot converts",
      stated_probability: 0.6, outcome: 1 },
    { forecaster: "bo", claim: "grant is awarded",
      stated_probability: 0.5, outcome: 1 },
    { forecaster: "cy", claim: "release slips past May",
      stated_probability: 0.5, outcome: 1 },
    { forecaster: "cy", claim: "partner signs the LOI",
      stated_probability: 0.5, outcome: 0 },
  ],
  scoreboard: [
    { forecaster: "ana", forecasts_count: 4,
      mean_stated_probability: 0.625, hit_rate: 0.75,
      calibration_gap: 0.125, brier_score: 0.1125, rank: 1 },
    { forecaster: "bo", forecasts_count: 4,
      mean_stated_probability: 0.7, hit_rate: 0.5,
      calibration_gap: 0.2, brier_score: 0.465, rank: 3 },
    { forecaster: "cy", forecasts_count: 2,
      mean_stated_probability: 0.5, hit_rate: 0.5,
      calibration_gap: 0.0, brier_score: 0.25, rank: 2 },
  ],
  confidence_reporting: {
    calibration_reported_per_forecaster: true,
    outputs_are_probabilities: true,
    calibration_reported_not_just_ranking: true,
    worst_forecaster_surfaced: true },
  scoreboard_use: { decision_stated: true,
                    decision_costs_considered: true },
  honesty: { metric_chosen_to_flatter_present: false,
             silent_score_rewrites_present: false,
             scores_refreshed_as_outcomes_resolve: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 31 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 26);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.forecasts_count, 10);
  assert.equal(v.forecasters_count, 3);
  assert.equal(v.overall_mean_stated_probability, "0.630000");
  assert.equal(v.overall_hit_rate, "0.600000");
  assert.equal(v.overall_calibration_gap, "0.030000");
  assert.equal(v.overall_brier_score, "0.281000");
  assert.equal(v.calibration_direction, "overconfident");
  assert.equal(v.worst_calibrated_forecaster, "bo");
  assert.deepEqual(v.forecasters_without_scoreboard_row, []);
  assert.deepEqual(v.scoreboard_rows_without_forecasts, []);
  assert.deepEqual(v.mismatched_scoreboard_rows, []);
  assert.deepEqual(v.forecasters_with_wrong_rank, []);
});

test("test_resolution_criteria_not_predeclared_fails_ledger_section", () => {
  const m = clone(COMPLETE) as any;
  m.record.resolution_criteria_predeclared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(v.sections["ledger_and_resolution"], "fail");
});

test("test_forecast_recorded_after_resolution_fails", () => {
  const m = clone(COMPLETE) as any;
  m.record.forecasts_recorded_before_resolution = false;
  assert.equal(evaluate(m).verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_probability_out_of_range_fails_and_is_not_scored", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[0].stated_probability = 1.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(checkStatus(v, "every_forecast_probability_in_range"), "fail");
  assert.equal(v.overall_mean_stated_probability, "0.611111");
  assert.equal(v.overall_hit_rate, "0.555556");
});

test("test_nonbinary_outcome_fails", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[1].outcome = 2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_forecast_outcome_binary"), "fail");
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_forecast_without_forecaster_fails", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[0].forecaster = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_forecast_names_forecaster"), "fail");
});

test("test_forecast_missing_claim_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.forecasts[0].claim;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_forecast_states_claim"), "missing");
});

test("test_empty_forecasts_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "forecasts_declared"), "fail");
  assert.equal(v.forecasts_count, 0);
  assert.equal(v.forecasters_count, 0);
  assert.equal(v.overall_mean_stated_probability, null);
  assert.equal(v.calibration_direction, null);
  assert.equal(v.worst_calibrated_forecaster, null);
});

test("test_scoreboard_missing_a_forecaster_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard.splice(2, 1);
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(checkStatus(v, "scoreboard_covers_every_forecaster"), "fail");
  assert.deepEqual(v.forecasters_without_scoreboard_row, ["cy"]);
});

test("test_scoreboard_row_without_forecasts_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard.push({ forecaster: "di", forecasts_count: 0,
    mean_stated_probability: 0.5, hit_rate: 0.5,
    calibration_gap: 0.0, brier_score: 0.25, rank: 4 });
  const v = evaluate(m);
  assert.equal(checkStatus(v, "scoreboard_covers_every_forecaster"), "fail");
  assert.deepEqual(v.scoreboard_rows_without_forecasts, ["di"]);
});

test("test_wrong_forecast_count_fails_and_row_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[0].forecasts_count = 5;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_scoreboard_forecast_count_matches_ledger"), "fail");
  assert.deepEqual(v.mismatched_scoreboard_rows, ["ana"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_wrong_mean_probability_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[1].mean_stated_probability = 0.65;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_scoreboard_mean_probability_matches"), "fail");
  assert.deepEqual(v.mismatched_scoreboard_rows, ["bo"]);
});

test("test_wrong_hit_rate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[0].hit_rate = 0.5;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_scoreboard_hit_rate_matches"), "fail");
});

test("test_wrong_brier_score_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[2].brier_score = 0.2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_scoreboard_brier_score_matches"), "fail");
});

test("test_wrong_calibration_gap_fails_calibration_section", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[1].calibration_gap = 0.05;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(v.sections["calibration_reporting"], "fail");
  assert.equal(checkStatus(v, "every_scoreboard_calibration_gap_matches"), "fail");
});

test("test_aggregate_missing_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.scoreboard[0].brier_score;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_scoreboard_brier_score_matches"), "missing");
});

test("test_duplicate_ranks_fail", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[2].rank = 1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "scoreboard_ranks_complete_and_unique"), "fail");
});

test("test_ranking_not_matching_brier_order_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[1].rank = 2;
  m.scoreboard[2].rank = 3;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(v.sections["ranking_integrity"], "fail");
  assert.equal(checkStatus(v, "scoreboard_ranking_matches_brier_order"), "fail");
  assert.deepEqual(v.forecasters_with_wrong_rank, ["bo", "cy"]);
});

test("test_calibration_not_reported_per_forecaster_fails", () => {
  const m = clone(COMPLETE) as any;
  m.confidence_reporting.calibration_reported_per_forecaster = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "calibration_reported_per_forecaster"), "fail");
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_worst_forecaster_not_surfaced_fails", () => {
  const m = clone(COMPLETE) as any;
  m.confidence_reporting.worst_forecaster_surfaced = false;
  assert.equal(evaluate(m).verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_metric_chosen_to_flatter_fails_honesty_section", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.metric_chosen_to_flatter_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
  assert.equal(v.sections["honesty_and_live_use"], "fail");
  assert.equal(checkStatus(v, "no_metric_chosen_to_flatter"), "fail");
});

test("test_silent_score_rewrites_fail", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.silent_score_rewrites_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_silent_score_rewrites"), "fail");
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_scores_not_refreshed_fail", () => {
  const m = clone(COMPLETE) as any;
  m.honesty.scores_refreshed_as_outcomes_resolve = false;
  assert.equal(evaluate(m).verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_decision_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard_use.decision_stated = false;
  assert.equal(evaluate(m).verdict, "CONFIDENCE_SCOREBOARD_NOT_SOUND");
});

test("test_exact_calibration_direction", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts = [
    { forecaster: "cy", claim: "a", stated_probability: 0.5, outcome: 1 },
    { forecaster: "cy", claim: "b", stated_probability: 0.5, outcome: 0 },
  ];
  m.scoreboard = [
    { forecaster: "cy", forecasts_count: 2,
      mean_stated_probability: 0.5, hit_rate: 0.5,
      calibration_gap: 0.0, brier_score: 0.25, rank: 1 },
  ];
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_SOUND");
  assert.equal(v.calibration_direction, "exact");
  assert.equal(v.worst_calibrated_forecaster, "cy");
});

test("test_underconfident_direction_is_reported_not_failed", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[4].stated_probability = 0.1;
  m.forecasts[5].stated_probability = 0.2;
  Object.assign(m.scoreboard[1],
    { mean_stated_probability: 0.35, calibration_gap: 0.15,
      brier_score: 0.115, rank: 2 });
  m.scoreboard[2].rank = 3;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONFIDENCE_SCOREBOARD_SOUND");
  assert.equal(v.calibration_direction, "underconfident");
  assert.equal(v.worst_calibrated_forecaster, "bo");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.confidence_reporting;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["calibration_reporting"], "insufficient_evidence");
});

test("test_sparse_manifest_is_insufficient_evidence", () => {
  const v = evaluate({ subject: "thin-board",
    forecasts: [{ forecaster: "ana", claim: "x",
                  stated_probability: 0.5, outcome: 1 }] });
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.forecasts_count, 1);
  assert.equal(v.overall_brier_score, "0.250000");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.forecasts_count, null);
  assert.equal(v.forecasters_count, null);
  assert.equal(v.overall_mean_stated_probability, null);
  assert.equal(v.overall_hit_rate, null);
  assert.equal(v.overall_calibration_gap, null);
  assert.equal(v.overall_brier_score, null);
  assert.equal(v.calibration_direction, null);
  assert.equal(v.worst_calibrated_forecaster, null);
  assert.equal(v.forecasters_without_scoreboard_row, null);
  assert.equal(v.scoreboard_rows_without_forecasts, null);
  assert.equal(v.mismatched_scoreboard_rows, null);
  assert.equal(v.forecasters_with_wrong_rank, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: CONFIDENCE_SCOREBOARD_SOUND"));
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
  m.subject = 12345;
  assert.throws(() => evaluate(m), fieldError("subject"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ record: "should-be-an-object" }),
    fieldError("record"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ forecasts: { forecaster: "ana" } }),
    fieldError("forecasts"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ forecasts: ["ana"] }),
    fieldError("forecasts[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.record.resolution_criteria_predeclared = "yes";
  assert.throws(() => evaluate(m), fieldError("record.resolution_criteria_predeclared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[0].stated_probability = "0.8";
  assert.throws(() => evaluate(m), fieldError("forecasts[0].stated_probability"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scoreboard[1].rank = "first";
  assert.throws(() => evaluate(m), fieldError("scoreboard[1].rank"));
});

test("malformed: boolean as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecasts[0].outcome = true;
  assert.throws(() => evaluate(m), fieldError("forecasts[0].outcome"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.honesty = null;
  assert.throws(() => evaluate(m), fieldError("honesty"));
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
  .filter((f) => f.startsWith("forecast-confidence-scoreboard--") && f.endsWith(".json"))
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
