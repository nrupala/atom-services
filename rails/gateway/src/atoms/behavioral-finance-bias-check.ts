// Behavioral finance bias check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/behavioral-finance-bias-check/src/behavioral_finance_bias_check.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed status and
// the summary string are byte-identical to the Python output for
// the same input. The computed excess/shortfall values use the
// shared fixed serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  decision: "string",
  decision_context: {
    is_entry: "boolean",
    is_major_move: "boolean",
  },
  bias_playbook: {
    loss_aversion_precommitted_exits_set: "boolean",
    loss_aversion_reunderwritten_instead_of_waiting_to_get_even: "boolean",
    anchoring_own_valuation_written_before_market_price_targets: "boolean",
    recency_base_rates_and_long_windows_used: "boolean",
    overconfidence_sizing_cap_percent: "number",
    overconfidence_position_size_percent: "number",
    confirmation_disconfirming_evidence_present: "boolean",
    sunk_cost_would_buy_today_test_applied: "boolean",
    biases_considered: [{
      bias: "string",
      counter_applied: "boolean",
    }],
  },
  precommitment: {
    written_rules_present: "boolean",
    stop_levels_set: "boolean",
    thesis_written: "boolean",
  },
  cooling_off: {
    hours_elapsed: "number",
    periods_honored_for_impulsive_ideas: "boolean",
  },
  journal: {
    decision_recorded: "boolean",
    expected_outcome_recorded: "boolean",
    actual_outcome_and_lessons_recorded: "boolean",
    current_with_outcomes_and_lessons: "boolean",
    reviewed_monthly: "boolean",
    hit_rate_tracked_honestly: "boolean",
  },
  watch_and_challenge: {
    continuous_price_watching: "boolean",
    scheduled_reviews_used: "boolean",
    notifications_off: "boolean",
    devils_advocate_round_assigned: "boolean",
    slept_on_material_changes: "boolean",
    major_move_discussed_with_advisor_set_documented: "boolean",
  },
  temptation_and_red_lines: {
    one_click_trading_paths_removed: "boolean",
    decision_driven_by_headlines: "boolean",
    decision_driven_by_streaks: "boolean",
    decision_driven_by_moods: "boolean",
    journal_skipped_for_this_decision: "boolean",
  },
};

export const SECTIONS = [
  "bias_playbook",
  "precommitment_and_thesis",
  "cooling_off",
  "decision_journal",
  "watch_and_challenge",
  "temptation_and_red_lines",
] as const;

export const STATED_COOLING_OFF_HOURS = 48;

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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  biases_considered_count: number | null;
  position_size_over_cap_percent: string | null;
  cooling_off_hours_below_48: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function pyStr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: bias_playbook ----
  boolCheck(results, "bias_playbook",
    "loss_aversion_precommitted_exits_set",
    manifest, ["bias_playbook", "loss_aversion_precommitted_exits_set"],
    "loss aversion counter: pre-committed exits are set");
  boolCheck(results, "bias_playbook",
    "loss_aversion_reunderwritten_instead_of_waiting_to_get_even",
    manifest, ["bias_playbook",
      "loss_aversion_reunderwritten_instead_of_waiting_to_get_even"],
    "loss aversion counter: the position is re-underwritten instead of held while waiting to get even");
  boolCheck(results, "bias_playbook",
    "anchoring_own_valuation_written_before_market_price_targets",
    manifest, ["bias_playbook",
      "anchoring_own_valuation_written_before_market_price_targets"],
    "anchoring counter: your own valuation is written BEFORE reading the market's price targets");
  boolCheck(results, "bias_playbook",
    "recency_base_rates_and_long_windows_used",
    manifest, ["bias_playbook",
      "recency_base_rates_and_long_windows_used"],
    "recency counter: base rates and long windows are used — one year is not a trend");
  const [cap, hasCap] = getPath(
    manifest, "bias_playbook", "overconfidence_sizing_cap_percent");
  const [size, hasSize] = getPath(
    manifest, "bias_playbook", "overconfidence_position_size_percent");
  const sizingPresent = hasCap && isNumber(cap) && hasSize && isNumber(size);
  check(results, "bias_playbook", "position_size_within_sizing_cap",
    size, sizingPresent,
    sizingPresent && (size as number) <= (cap as number),
    "overconfidence counter: sizing caps — the declared position size percent is at or below the declared sizing cap percent");
  const sizeOverCap: number | null = sizingPresent
    ? (size as number) - (cap as number)
    : null;
  boolCheck(results, "bias_playbook",
    "confirmation_disconfirming_evidence_present",
    manifest, ["bias_playbook",
      "confirmation_disconfirming_evidence_present"],
    "confirmation counter: a mandatory disconfirming-evidence section is present in the thesis (also a quality gate: disconfirming evidence present in every thesis)");
  boolCheck(results, "bias_playbook",
    "sunk_cost_would_buy_today_test_applied",
    manifest, ["bias_playbook",
      "sunk_cost_would_buy_today_test_applied"],
    "sunk cost counter: the 'would I buy this today at this price?' test is applied");
  const [biases, hasBiases] = getPath(
    manifest, "bias_playbook", "biases_considered");
  const biasesIsList = hasBiases && Array.isArray(biases);
  const biasesCount: number | null = biasesIsList
    ? (biases as unknown[]).length
    : null;
  const countersOk = biasesIsList && (biases as unknown[]).length > 0 &&
    (biases as unknown[]).every(
      (b) => isPyDict(b) && b["counter_applied"] === true);
  check(results, "bias_playbook",
    "all_considered_biases_have_counter_applied", biases,
    biasesIsList, countersOk,
    "bias playbook with counters: every bias the caller declares considered carries its applied counter");

  // ---- Section 2: precommitment_and_thesis ----
  boolCheck(results, "precommitment_and_thesis",
    "written_precommitment_rules_present",
    manifest, ["precommitment", "written_rules_present"],
    "pre-commitment: written rules exist — decisions get made when calm and enforced when not");
  boolCheck(results, "precommitment_and_thesis",
    "stop_levels_set",
    manifest, ["precommitment", "stop_levels_set"],
    "pre-commitment: stop levels are set — written rules, journal, and stop levels beat willpower");
  const [isEntry, hasEntry] = getPath(
    manifest, "decision_context", "is_entry");
  const [thesis, hasThesis] = getPath(
    manifest, "precommitment", "thesis_written");
  if (hasEntry && pyTruthy(isEntry)) {
    check(results, "precommitment_and_thesis",
      "written_thesis_before_entry", thesis, hasThesis,
      thesis === true,
      "FOMO/chasing counter: no entry without a written thesis");
  } else {
    check(results, "precommitment_and_thesis",
      "written_thesis_before_entry", isEntry, hasEntry, true,
      "not an entry decision");
  }

  // ---- Section 3: cooling_off ----
  const [hours, hasHours] = getPath(manifest, "cooling_off", "hours_elapsed");
  const hoursIsNumber = hasHours && isNumber(hours);
  let coolingBelow: number | null = null;
  if (hasEntry && pyTruthy(isEntry)) {
    check(results, "cooling_off",
      "cooling_off_hours_at_least_48", hours, hoursIsNumber,
      hoursIsNumber && (hours as number) >= STATED_COOLING_OFF_HOURS,
      "FOMO/chasing counter: 48h cooling-off — the declared cooling-off hours elapsed for this entry decision are at least 48");
    coolingBelow = hoursIsNumber
      ? STATED_COOLING_OFF_HOURS - (hours as number)
      : null;
  } else {
    check(results, "cooling_off",
      "cooling_off_hours_at_least_48", isEntry, hasEntry, true,
      "not an entry decision");
  }
  boolCheck(results, "cooling_off",
    "cooling_off_periods_honored_for_impulsive_ideas",
    manifest, ["cooling_off", "periods_honored_for_impulsive_ideas"],
    "quality gate: cooling-off periods honored for impulsive ideas");

  // ---- Section 4: decision_journal ----
  boolCheck(results, "decision_journal", "journal_decision_recorded",
    manifest, ["journal", "decision_recorded"],
    "journals: every decision is recorded in the journal");
  boolCheck(results, "decision_journal",
    "journal_expected_outcome_recorded",
    manifest, ["journal", "expected_outcome_recorded"],
    "journals: the expected outcome is recorded with the decision");
  boolCheck(results, "decision_journal",
    "journal_actual_outcome_and_lessons_recorded",
    manifest, ["journal", "actual_outcome_and_lessons_recorded"],
    "journals: later actuals are recorded against the decision");
  boolCheck(results, "decision_journal",
    "journal_current_with_outcomes_and_lessons",
    manifest, ["journal", "current_with_outcomes_and_lessons"],
    "quality gate: journal current with outcomes + lessons");
  boolCheck(results, "decision_journal", "journal_reviewed_monthly",
    manifest, ["journal", "reviewed_monthly"],
    "journals: the journal is reviewed monthly — patterns surface on review");
  boolCheck(results, "decision_journal",
    "hit_rate_tracked_honestly_in_journal",
    manifest, ["journal", "hit_rate_tracked_honestly"],
    "overconfidence counter: track your hit rate honestly (journal)");

  // ---- Section 5: watch_and_challenge ----
  falseCheck(results, "watch_and_challenge",
    "no_continuous_price_watching",
    manifest, ["watch_and_challenge", "continuous_price_watching"],
    "watch conditions: no continuous price-watching (also the quality gate: review cadence held, not continuous watching)");
  boolCheck(results, "watch_and_challenge",
    "scheduled_reviews_used",
    manifest, ["watch_and_challenge", "scheduled_reviews_used"],
    "watch conditions: scheduled reviews are used instead of continuous watching");
  boolCheck(results, "watch_and_challenge", "notifications_off",
    manifest, ["watch_and_challenge", "notifications_off"],
    "watch conditions: notifications off — headlines are not data");
  boolCheck(results, "watch_and_challenge",
    "devils_advocate_round_assigned",
    manifest, ["watch_and_challenge", "devils_advocate_round_assigned"],
    "committee tricks: a devil's advocate round is assigned for big decisions");
  boolCheck(results, "watch_and_challenge",
    "slept_on_material_changes",
    manifest, ["watch_and_challenge", "slept_on_material_changes"],
    "committee tricks: material changes are slept on");
  const [isMajor, hasMajor] = getPath(
    manifest, "decision_context", "is_major_move");
  const [discussed, hasDiscussed] = getPath(
    manifest, "watch_and_challenge",
    "major_move_discussed_with_advisor_set_documented");
  if (hasMajor && pyTruthy(isMajor)) {
    check(results, "watch_and_challenge",
      "major_move_discussed_with_advisor_set_documented",
      discussed, hasDiscussed, discussed === true,
      "committee tricks: for major moves, discuss with the advisor set (documented, not vibes)");
  } else {
    check(results, "watch_and_challenge",
      "major_move_discussed_with_advisor_set_documented",
      isMajor, hasMajor, true, "not a major move");
  }

  // ---- Section 6: temptation_and_red_lines ----
  boolCheck(results, "temptation_and_red_lines",
    "one_click_trading_paths_removed",
    manifest, ["temptation_and_red_lines",
      "one_click_trading_paths_removed"],
    "temptation architecture: one-click trading paths are removed for the accounts that matter");
  falseCheck(results, "temptation_and_red_lines",
    "decision_not_driven_by_headlines",
    manifest, ["temptation_and_red_lines", "decision_driven_by_headlines"],
    "red line: no decisions driven by headlines");
  falseCheck(results, "temptation_and_red_lines",
    "decision_not_driven_by_streaks",
    manifest, ["temptation_and_red_lines", "decision_driven_by_streaks"],
    "red line: no decisions driven by streaks");
  falseCheck(results, "temptation_and_red_lines",
    "decision_not_driven_by_moods",
    manifest, ["temptation_and_red_lines", "decision_driven_by_moods"],
    "red line: no decisions driven by moods");
  falseCheck(results, "temptation_and_red_lines",
    "journal_not_skipped_for_this_decision",
    manifest, ["temptation_and_red_lines",
      "journal_skipped_for_this_decision"],
    "red line: no skipped journals — the process IS the edge");

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
    verdict = "BIAS_CHECK_FAILED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "BIAS_CHECK_CLEAR";
  }

  const computedStatuses = results
    .filter((r) => r.check === "position_size_within_sizing_cap" ||
      r.check === "cooling_off_hours_at_least_48")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "behavioral-finance-bias-check",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    biases_considered_count: biasesCount,
    position_size_over_cap_percent: fmt4(sizeOverCap),
    cooling_off_hours_below_48: fmt4(coolingBelow),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BEHAVIORAL FINANCE BIAS CHECK",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
