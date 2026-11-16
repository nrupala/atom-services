// Budget design review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/budget-design-review/src/budget_design_review.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Money totals use the shared fixed
// serialization: round half up to 2dp — floor(v * 100 + 0.5) /
// 100 — then format with exactly two decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (budget type, line approaches) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  budget: "string",
  scope: {
    budget_type: "string",
    entity_named: "boolean",
    currency_stated: "boolean",
    governs_stated: "boolean",
    exclusions_stated: "boolean",
  },
  lines: [{
    name: "string",
    owner: "string",
    approach: "string",
    driver_documented: "boolean",
    driver_quantity: "number",
    driver_unit_cost: "number",
    amount: "number",
  }],
  totals: {
    declared_total: "number",
    expected_income: "number",
  },
  revenue: {
    linked_to_forecast: "boolean",
  },
  contingency: {
    explicit_line_present: "boolean",
    sized_to_identified_risks: "boolean",
    hidden_padding_present: "boolean",
  },
  approval: {
    baseline_approved_and_locked: "boolean",
    approval_thresholds_documented: "boolean",
    revisions_reapproved: "boolean",
  },
  monitoring: {
    monthly_variance_process_running: "boolean",
    variance_thresholds_trigger_explanations: "boolean",
    variance_actions_tracked: "boolean",
    rolling_forecast_cadence_set: "boolean",
    rolling_horizon_months: "number",
  },
  close: {
    annual_true_up_done: "boolean",
    carry_over_rules_decided: "boolean",
    lessons_carried_to_next_cycle: "boolean",
    silent_reallocations_made: "boolean",
    actuals_edited_without_annotation: "boolean",
  },
};

export const SECTIONS = [
  "scope",
  "structure_and_owners",
  "drivers_and_totals",
  "revenue_and_contingency",
  "approval_and_baseline",
  "monitoring_and_close",
] as const;

export const STATED_BUDGET_TYPES = ["operating", "capital", "personal"];

export const STATED_APPROACHES = ["zero_based", "incremental"];

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
  budget: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  lines_evaluated: number | null;
  ownerless_line_indexes: number[] | null;
  computed_total: string | null;
  total_difference: string | null;
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

function fmt2(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 100 + 0.5) / 100;
  return rounded.toFixed(2);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [linesRaw, hasLinesField] = getPath(manifest, "lines");
  const linesIsList = hasLinesField && Array.isArray(linesRaw);
  const lineEntries: unknown[] = linesIsList ? (linesRaw as unknown[]) : [];
  const hasLines = linesIsList && lineEntries.length > 0;

  // ---- Section 1: scope ----
  const [budgetType, hasType] = getPath(manifest, "scope", "budget_type");
  check(results, "scope", "budget_type_is_stated_kind", budgetType,
    hasType,
    hasType && STATED_BUDGET_TYPES.includes(budgetType as string),
    "method step 1: the budget type is one of the kinds the skill names — operating, capital, or personal");
  boolCheck(results, "scope", "entity_named",
    manifest, ["scope", "entity_named"],
    "method step 1: the entity the budget belongs to is named");
  boolCheck(results, "scope", "currency_stated",
    manifest, ["scope", "currency_stated"],
    "method step 1: the budget currency is stated");
  boolCheck(results, "scope", "governs_stated",
    manifest, ["scope", "governs_stated"],
    "method step 1: what the budget governs is stated");
  boolCheck(results, "scope", "exclusions_stated",
    manifest, ["scope", "exclusions_stated"],
    "method step 1: what the budget does not govern is stated");

  // ---- Section 2: structure_and_owners ----
  check(results, "structure_and_owners", "lines_present", linesRaw,
    linesIsList, hasLines,
    "method step 2: the budget declares at least one line");
  const ownerless: number[] | null = linesIsList
    ? lineEntries.flatMap((entry, i) =>
        isPyDict(entry) && typeof entry["owner"] === "string" &&
          (entry["owner"] as string).length > 0
          ? []
          : [i])
    : null;
  const allOwnersPresent = hasLines && lineEntries.every(
    (entry) => isPyDict(entry) &&
      Object.prototype.hasOwnProperty.call(entry, "owner"));
  check(results, "structure_and_owners", "every_line_has_named_owner",
    linesRaw, allOwnersPresent,
    allOwnersPresent && (ownerless as number[]).length === 0,
    "quality gate: every line has an owner — lines without owners become orphaned spending");
  const allApproachesPresent = hasLines && lineEntries.every(
    (entry) => isPyDict(entry) &&
      Object.prototype.hasOwnProperty.call(entry, "approach"));
  check(results, "structure_and_owners",
    "every_line_approach_is_stated_kind", linesRaw,
    allApproachesPresent,
    allApproachesPresent && lineEntries.every(
      (entry) => STATED_APPROACHES.includes(
        (entry as Record<string, unknown>)["approach"] as string)),
    "method step 3: every line states its approach, and each approach is one the skill names — zero-based for new/volatile areas, incremental for stable ones");

  // ---- Section 3: drivers_and_totals ----
  const allDriversPresent = hasLines && lineEntries.every(
    (entry) => isPyDict(entry) &&
      Object.prototype.hasOwnProperty.call(entry, "driver_documented"));
  check(results, "drivers_and_totals",
    "drivers_documented_for_every_line", linesRaw, allDriversPresent,
    allDriversPresent && lineEntries.every(
      (entry) =>
        (entry as Record<string, unknown>)["driver_documented"] === true),
    "quality gate: drivers are documented for every line — built from drivers, not flat percentages");
  const allDriverNumbers = hasLines && lineEntries.every(
    (entry) => isPyDict(entry) && isNumber(entry["amount"]) &&
      isNumber(entry["driver_quantity"]) &&
      isNumber(entry["driver_unit_cost"]));
  check(results, "drivers_and_totals",
    "line_amounts_match_driver_products", linesRaw, allDriverNumbers,
    allDriverNumbers && lineEntries.every(
      (entry) => {
        const e = entry as Record<string, unknown>;
        return e["amount"] ===
          (e["driver_quantity"] as number) *
            (e["driver_unit_cost"] as number);
      }),
    "method step 4: every line amount equals its declared driver quantity times its declared driver unit cost (headcount x rate, units x cost, usage x price)");
  const [declaredTotal, hasDeclaredTotal] = getPath(
    manifest, "totals", "declared_total");
  const allAmounts = hasLines && lineEntries.every(
    (entry) => isPyDict(entry) && isNumber(entry["amount"]));
  const computedSum: number | null = allAmounts
    ? lineEntries.reduce(
        (acc: number, entry) =>
          acc + ((entry as Record<string, unknown>)["amount"] as number),
        0)
    : null;
  const totalComputable = allAmounts && hasDeclaredTotal &&
    isNumber(declaredTotal);
  check(results, "drivers_and_totals",
    "declared_total_matches_line_sum", declaredTotal, totalComputable,
    totalComputable && computedSum === declaredTotal,
    "the declared total equals the sum of the declared line amounts — the total is re-derived, not trusted");
  const difference: number | null = totalComputable
    ? (declaredTotal as number) - (computedSum as number)
    : null;

  // ---- Section 4: revenue_and_contingency ----
  boolCheck(results, "revenue_and_contingency",
    "revenue_linked_to_forecast",
    manifest, ["revenue", "linked_to_forecast"],
    "method step 5: the revenue side is linked to forecasting — expected income, not hope");
  const [expectedIncome, hasIncome] = getPath(
    manifest, "totals", "expected_income");
  const balanceComputable = hasDeclaredTotal && isNumber(declaredTotal) &&
    hasIncome && isNumber(expectedIncome);
  check(results, "revenue_and_contingency",
    "budget_balances_against_expected_income", expectedIncome,
    balanceComputable,
    balanceComputable &&
      (declaredTotal as number) <= (expectedIncome as number),
    "method step 5: the declared total does not exceed the declared expected income — the budget balances against expected income");
  boolCheck(results, "revenue_and_contingency",
    "contingency_explicit_line_present",
    manifest, ["contingency", "explicit_line_present"],
    "quality gate: contingency is explicit — a visible line, not buried in other lines");
  boolCheck(results, "revenue_and_contingency",
    "contingency_sized_to_identified_risks",
    manifest, ["contingency", "sized_to_identified_risks"],
    "method step 6: the contingency line is sized to identified risks");
  falseCheck(results, "revenue_and_contingency", "no_hidden_padding",
    manifest, ["contingency", "hidden_padding_present"],
    "red line: no hidden padding");

  // ---- Section 5: approval_and_baseline ----
  boolCheck(results, "approval_and_baseline",
    "baseline_approved_and_locked",
    manifest, ["approval", "baseline_approved_and_locked"],
    "method step 7: the baseline is approved and locked");
  boolCheck(results, "approval_and_baseline",
    "approval_thresholds_documented",
    manifest, ["approval", "approval_thresholds_documented"],
    "quality gate: approval thresholds are set and documented — who may approve money decisions, and up to what was decided (the threshold values themselves are the caller's, not checked)");
  boolCheck(results, "approval_and_baseline",
    "revisions_reapproved_not_drifted",
    manifest, ["approval", "revisions_reapproved"],
    "method step 7: revisions are re-approved, not drifted into the baseline");

  // ---- Section 6: monitoring_and_close ----
  boolCheck(results, "monitoring_and_close",
    "monthly_variance_process_running",
    manifest, ["monitoring", "monthly_variance_process_running"],
    "quality gate: a monthly variance process is running — budget vs actual vs latest forecast, on a calendar, not a crisis");
  boolCheck(results, "monitoring_and_close",
    "variance_thresholds_trigger_written_explanations",
    manifest, ["monitoring", "variance_thresholds_trigger_explanations"],
    "method step 8: variance thresholds trigger written explanations (the threshold values are the caller's — the skill states none, so none is checked)");
  boolCheck(results, "monitoring_and_close", "variance_actions_tracked",
    manifest, ["monitoring", "variance_actions_tracked"],
    "quality gate: variance reviews produce actions, and the actions are tracked");
  boolCheck(results, "monitoring_and_close",
    "rolling_forecast_cadence_set",
    manifest, ["monitoring", "rolling_forecast_cadence_set"],
    "quality gate: a rolling forecast cadence is set where volatility demands it");
  const [horizon, hasHorizon] = getPath(
    manifest, "monitoring", "rolling_horizon_months");
  const horizonIsNumber = hasHorizon && isNumber(horizon);
  check(results, "monitoring_and_close",
    "rolling_forecast_covers_twelve_months", horizon, horizonIsNumber,
    horizonIsNumber && horizon === 12,
    "method step 8: the rolling forecast covers the twelve months the skill states");
  boolCheck(results, "monitoring_and_close", "annual_true_up_done",
    manifest, ["close", "annual_true_up_done"],
    "method step 9: an annual true-up closes the cycle");
  boolCheck(results, "monitoring_and_close", "carry_over_rules_decided",
    manifest, ["close", "carry_over_rules_decided"],
    "method step 9: carry-over rules are decided, not improvised at year end");
  boolCheck(results, "monitoring_and_close",
    "lessons_carried_to_next_cycle",
    manifest, ["close", "lessons_carried_to_next_cycle"],
    "method step 9: lessons from this cycle are carried to the next cycle");
  falseCheck(results, "monitoring_and_close", "no_silent_reallocations",
    manifest, ["close", "silent_reallocations_made"],
    "red line: no silent reallocations");
  falseCheck(results, "monitoring_and_close",
    "no_unannotated_actual_edits",
    manifest, ["close", "actuals_edited_without_annotation"],
    "red line: actuals are never edited — corrections are annotated with date and reason");

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
    verdict = "BUDGET_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "BUDGET_DESIGN_SOUND";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "budget_type_is_stated_kind" ||
      r.check === "line_amounts_match_driver_products" ||
      r.check === "declared_total_matches_line_sum" ||
      r.check === "budget_balances_against_expected_income" ||
      r.check === "rolling_forecast_covers_twelve_months")
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
    service: "budget-design-review",
    atom_version: "0.1.0",
    budget: manifest["budget"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    lines_evaluated: linesIsList ? lineEntries.length : null,
    ownerless_line_indexes: ownerless,
    computed_total: fmt2(computedSum),
    total_difference: fmt2(difference),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BUDGET DESIGN REVIEW",
    `budget: ${pyStr(verdict.budget ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
