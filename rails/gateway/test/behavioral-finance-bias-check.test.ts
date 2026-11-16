import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/behavioral-finance-bias-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The BIAS_CHECK_CLEAR manifest, copied from the Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  decision: "panic-sell-review-2026-11",
  decision_context: { is_entry: true, is_major_move: true },
  bias_playbook: {
    loss_aversion_precommitted_exits_set: true,
    loss_aversion_reunderwritten_instead_of_waiting_to_get_even: true,
    anchoring_own_valuation_written_before_market_price_targets: true,
    recency_base_rates_and_long_windows_used: true,
    overconfidence_sizing_cap_percent: 10,
    overconfidence_position_size_percent: 8,
    confirmation_disconfirming_evidence_present: true,
    sunk_cost_would_buy_today_test_applied: true,
    biases_considered: [
      { bias: "loss aversion", counter_applied: true },
      { bias: "fomo", counter_applied: true },
      { bias: "confirmation", counter_applied: true }],
  },
  precommitment: { written_rules_present: true,
                   stop_levels_set: true,
                   thesis_written: true },
  cooling_off: { hours_elapsed: 72,
                 periods_honored_for_impulsive_ideas: true },
  journal: { decision_recorded: true,
             expected_outcome_recorded: true,
             actual_outcome_and_lessons_recorded: true,
             current_with_outcomes_and_lessons: true,
             reviewed_monthly: true,
             hit_rate_tracked_honestly: true },
  watch_and_challenge: {
    continuous_price_watching: false,
    scheduled_reviews_used: true,
    notifications_off: true,
    devils_advocate_round_assigned: true,
    slept_on_material_changes: true,
    major_move_discussed_with_advisor_set_documented: true },
  temptation_and_red_lines: {
    one_click_trading_paths_removed: true,
    decision_driven_by_headlines: false,
    decision_driven_by_streaks: false,
    decision_driven_by_moods: false,
    journal_skipped_for_this_decision: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_bias_check_clear", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "BIAS_CHECK_CLEAR");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_limits_on_declared_evidence");
  assert.equal(v.checks.length, 30);
});

test("test_biases_considered_count_reported", () => {
  assert.equal(evaluate(clone(COMPLETE)).biases_considered_count, 3);
});

test("test_size_over_cap_serialized_at_fixed_4dp", () => {
  assert.equal(evaluate(clone(COMPLETE)).position_size_over_cap_percent, "-2.0000");
  const m = clone(COMPLETE) as any;
  m.bias_playbook.overconfidence_position_size_percent = 12.5;
  assert.equal(evaluate(m).position_size_over_cap_percent, "2.5000");
});

test("test_cooling_below_48_serialized_at_fixed_4dp", () => {
  assert.equal(evaluate(clone(COMPLETE)).cooling_off_hours_below_48, "-24.0000");
  const m = clone(COMPLETE) as any;
  m.cooling_off.hours_elapsed = 47.5;
  assert.equal(evaluate(m).cooling_off_hours_below_48, "0.5000");
});

test("test_cooling_off_exactly_48_passes", () => {
  const m = clone(COMPLETE) as any;
  m.cooling_off.hours_elapsed = 48;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_CLEAR");
  assert.equal(v.cooling_off_hours_below_48, "0.0000");
});

test("test_cooling_off_below_48_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cooling_off.hours_elapsed = 12;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["cooling_off"], "fail");
  assert.equal(v.computed_status, "outside_limits_on_declared_evidence");
});

test("test_position_size_at_cap_passes", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.overconfidence_position_size_percent = 10;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_CLEAR");
});

test("test_position_size_over_cap_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.overconfidence_position_size_percent = 18;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["bias_playbook"], "fail");
  assert.equal(v.computed_status, "outside_limits_on_declared_evidence");
});

test("test_missing_sizing_cap_is_missing_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.bias_playbook.overconfidence_sizing_cap_percent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.position_size_over_cap_percent, null);
  assert.equal(v.computed_status, null);
});

test("test_considered_bias_without_counter_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.biases_considered[1].counter_applied = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(checkStatus(v, "all_considered_biases_have_counter_applied"), "fail");
});

test("test_empty_biases_considered_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.biases_considered = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.biases_considered_count, 0);
});

test("test_missing_biases_considered_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.bias_playbook.biases_considered;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.biases_considered_count, null);
});

test("test_entry_without_written_thesis_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.thesis_written = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(checkStatus(v, "written_thesis_before_entry"), "fail");
});

test("test_non_entry_passes_thesis_and_cooling_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.decision_context.is_entry = false;
  delete m.precommitment.thesis_written;
  delete m.cooling_off.hours_elapsed;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_CLEAR");
  assert.equal(v.cooling_off_hours_below_48, null);
});

test("test_major_move_without_advisor_discussion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.watch_and_challenge.major_move_discussed_with_advisor_set_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["watch_and_challenge"], "fail");
});

test("test_non_major_move_passes_advisor_check_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.decision_context.is_major_move = false;
  delete m.watch_and_challenge.major_move_discussed_with_advisor_set_documented;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_CLEAR");
});

test("test_disconfirming_evidence_absent_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.confirmation_disconfirming_evidence_present = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_anchoring_counter_missing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.anchoring_own_valuation_written_before_market_price_targets = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_waiting_to_get_even_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.loss_aversion_reunderwritten_instead_of_waiting_to_get_even = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_sunk_cost_test_not_applied_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.sunk_cost_would_buy_today_test_applied = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_cooling_off_not_honored_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.cooling_off.periods_honored_for_impulsive_ideas = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["cooling_off"], "fail");
});

test("test_journal_not_current_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.journal.current_with_outcomes_and_lessons = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_journal_not_reviewed_monthly_fails", () => {
  const m = clone(COMPLETE) as any;
  m.journal.reviewed_monthly = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_continuous_price_watching_fails", () => {
  const m = clone(COMPLETE) as any;
  m.watch_and_challenge.continuous_price_watching = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["watch_and_challenge"], "fail");
});

test("test_decision_driven_by_headlines_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.temptation_and_red_lines.decision_driven_by_headlines = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BIAS_CHECK_FAILED");
  assert.equal(v.sections["temptation_and_red_lines"], "fail");
});

test("test_decision_driven_by_moods_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.temptation_and_red_lines.decision_driven_by_moods = true;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_skipped_journal_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.temptation_and_red_lines.journal_skipped_for_this_decision = true;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_one_click_paths_not_removed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.temptation_and_red_lines.one_click_trading_paths_removed = false;
  assert.equal(evaluate(m).verdict, "BIAS_CHECK_FAILED");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.journal;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["decision_journal"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.biases_considered_count, null);
  assert.equal(v.position_size_over_cap_percent, null);
  assert.equal(v.cooling_off_hours_below_48, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: BIAS_CHECK_CLEAR"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decision = 12345;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ journal: "should-be-an-object" }),
    fieldError("journal"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.biases_considered = "loss-aversion";
  assert.throws(() => evaluate(m), fieldError("bias_playbook.biases_considered"));
});

test("malformed: list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.biases_considered = ["loss aversion"];
  assert.throws(
    () => evaluate(m),
    fieldError("bias_playbook.biases_considered[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.journal.reviewed_monthly = "yes";
  assert.throws(() => evaluate(m), fieldError("journal.reviewed_monthly"));
});

test("malformed: boolean leaf in list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_playbook.biases_considered[0].counter_applied = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("bias_playbook.biases_considered[0].counter_applied"),
  );
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cooling_off.hours_elapsed = "two days";
  assert.throws(() => evaluate(m), fieldError("cooling_off.hours_elapsed"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.journal = null;
  assert.throws(() => evaluate(m), fieldError("journal"));
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
  .filter((f) => f.startsWith("behavioral-finance-bias-check--") && f.endsWith(".json"))
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
