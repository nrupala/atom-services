// Engineering project budget pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/engineering-project-budget-pack/src/engineering_project_budget_pack.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared budget
// pack artifact; it prepares no budget and exercises no
// budgeting judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (line-item category, pricing_basis) are
// validated as strings only, never enum-checked at the type
// layer.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  basis: {
    document_present: "boolean",
    scope_of_estimate_stated: "boolean",
    assumptions_stated: "boolean",
    exclusions_stated: "boolean",
    quote_validity_stated: "boolean",
    fx_escalation_stated: "boolean",
    estimator_named: "boolean",
  },
  build: {
    labor_costed_rate_times_hours: "boolean",
    indirects_included: "boolean",
  },
  line_items: [{
    label: "string",
    category: "string",
    pricing_basis: "string",
    quantity: "number",
    unit_rate: "number",
    declared_amount: "number",
  }],
  contingency: {
    risks_listed_for_contingency: "boolean",
    management_reserve_held_separately: "boolean",
    padding_buried_in_estimate: "boolean",
  },
  totals: {
    declared_subtotal: "number",
    contingency_percent: "number",
    declared_contingency_amount: "number",
    declared_management_reserve_amount: "number",
    declared_total_budget: "number",
    declared_total_change_impact: "number",
    declared_revised_budget: "number",
  },
  approval: {
    approval_recorded: "boolean",
    baseline_from_approved_amount: "boolean",
    revisions_reapproved: "boolean",
    work_without_approved_estimate_or_po: "boolean",
  },
  changes: {
    log_maintained: "boolean",
    verbal_change_orders_used: "boolean",
  },
  change_entries: [{
    label: "string",
    cost_impact: "number",
    impact_statement_present: "boolean",
    approved_before_work: "boolean",
  }],
  tracking: {
    commitments_vs_actuals_tracked: "boolean",
    invoice_reconciliation_against_delivery: "boolean",
    monthly_report_issued: "boolean",
    variance_reported_with_reasons: "boolean",
    commitments_amount: "number",
    actuals_amount: "number",
    forecast_to_complete_amount: "number",
    declared_total_forecast_amount: "number",
    declared_forecast_variance_amount: "number",
  },
  closeout: {
    final_cost_reconciled: "boolean",
    variance_explained: "boolean",
    lessons_captured: "boolean",
    contingency_disposition_stated: "boolean",
    unspent_contingency_released_explicitly: "boolean",
    declared_final_cost: "number",
    declared_final_variance_amount: "number",
    contingency_used_amount: "number",
    declared_unspent_contingency_amount: "number",
  },
};

export const SECTIONS = [
  "basis_document",
  "budget_build_and_line_items",
  "contingency_reserve_and_totals",
  "approval_and_baseline",
  "change_control_and_tracking",
  "closeout_and_contingency_disposition",
] as const;

export const STATED_PRICING_BASES = [
  "quote_based",
  "allowance",
];

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
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  line_items_evaluated: number;
  computed_subtotal: string | null;
  subtotal_difference: string | null;
  change_entries_evaluated: number;
  computed_change_impact_total: string | null;
  change_impact_difference: string | null;
  computed_contingency_amount: string | null;
  contingency_difference: string | null;
  computed_total_budget: string | null;
  total_budget_difference: string | null;
  computed_revised_budget: string | null;
  revised_budget_difference: string | null;
  computed_total_forecast: string | null;
  total_forecast_difference: string | null;
  computed_forecast_variance: string | null;
  forecast_variance_difference: string | null;
  computed_final_variance: string | null;
  final_variance_difference: string | null;
  computed_unspent_contingency: string | null;
  unspent_contingency_difference: string | null;
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

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
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

function isBool(value: unknown): boolean {
  return typeof value === "boolean";
}

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

interface LineItemComputed {
  itemsEvaluated: number;
  computedSubtotal: number | null;
  subtotalDifference: number | null;
}

function lineItemChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): LineItemComputed {
  const [items, hasItems] = getPath(manifest, "line_items");
  if (!hasItems || !Array.isArray(items) || items.length === 0) {
    for (const [name, evidence] of [
      ["line_item_entries_complete", "no line items declared"],
      ["line_item_pricing_basis_marked", "no line items declared"],
      ["line_item_amounts_match_quantity_times_rate",
       "no line items declared"],
      ["subtotal_matches_sum_of_line_items", "no line items declared"],
    ] as const) {
      check(results, "budget_build_and_line_items", name,
        items, false, false, evidence);
    }
    return { itemsEvaluated: 0, computedSubtotal: null, subtotalDifference: null };
  }
  let incomplete = false;
  let evaluated = 0;
  let amountsOk = true;
  let basesOk = true;
  let declaredSum = 0;
  for (const entry of items as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [category, hasCategory] = getEntry(entry, "category");
    const [basis, hasBasis] = getEntry(entry, "pricing_basis");
    const [quantity, hasQuantity] = getEntry(entry, "quantity");
    const [rate, hasRate] = getEntry(entry, "unit_rate");
    const [amount, hasAmount] = getEntry(entry, "declared_amount");
    if (!(hasLabel && hasCategory && hasBasis && hasQuantity && hasRate &&
        hasAmount && isNonemptyStr(label) && isNonemptyStr(category) &&
        typeof basis === "string" && isNumber(quantity) &&
        isNumber(rate) && isNumber(amount))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    declaredSum += amount as number;
    if (!STATED_PRICING_BASES.includes(basis as string)) {
      basesOk = false;
    }
    if (fmt6((amount as number) -
        (quantity as number) * (rate as number)) !== "0.000000") {
      amountsOk = false;
    }
  }
  if (incomplete) {
    check(results, "budget_build_and_line_items",
      "line_item_entries_complete",
      items, false, false,
      "a line item is missing its label, category, pricing basis, quantity, unit rate, or declared amount");
    check(results, "budget_build_and_line_items",
      "line_item_pricing_basis_marked",
      items, false, false,
      "a line item is incomplete, so its pricing basis cannot be checked");
    check(results, "budget_build_and_line_items",
      "line_item_amounts_match_quantity_times_rate",
      items, false, false,
      "a line item is incomplete, so its amount cannot be re-derived");
  } else {
    check(results, "budget_build_and_line_items",
      "line_item_entries_complete",
      items, true, true,
      "every line item carries a label, a category, a pricing basis, a quantity, a unit rate, and a declared amount");
    check(results, "budget_build_and_line_items",
      "line_item_pricing_basis_marked",
      items, true, basesOk,
      "method step 2: every line item is marked quote-based or allowance (declared as quote_based or allowance)");
    check(results, "budget_build_and_line_items",
      "line_item_amounts_match_quantity_times_rate",
      items, true, amountsOk,
      "method step 2: each declared line amount equals its declared quantity multiplied by its declared unit rate");
  }
  const [declaredSubtotal, hasSubtotal] = getPath(
    manifest, "totals", "declared_subtotal");
  void hasSubtotal;
  let computedSubtotal: number | null = null;
  let difference: number | null = null;
  if (incomplete || !isNumber(declaredSubtotal)) {
    check(results, "budget_build_and_line_items",
      "subtotal_matches_sum_of_line_items",
      items, false, false,
      "a line item is incomplete or no subtotal is declared, so the subtotal cannot be re-derived");
  } else {
    computedSubtotal = declaredSum;
    difference = (declaredSubtotal as number) - declaredSum;
    check(results, "budget_build_and_line_items",
      "subtotal_matches_sum_of_line_items",
      items, true,
      fmt6((declaredSubtotal as number) - declaredSum) === "0.000000",
      "method step 2: the declared subtotal equals the sum of the declared line amounts");
  }
  return {
    itemsEvaluated: evaluated,
    computedSubtotal,
    subtotalDifference: difference,
  };
}

interface ChangeComputed {
  entriesEvaluated: number;
  computedChangeTotal: number | null;
  changeDifference: number | null;
}

function changeEntryChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): ChangeComputed {
  const [items, hasItems] = getPath(manifest, "change_entries");
  if (!hasItems || !Array.isArray(items) || items.length === 0) {
    for (const [name, evidence] of [
      ["change_entries_complete", "no change entries declared"],
      ["all_changes_have_impact_statements",
       "no change entries declared"],
      ["all_changes_approved_before_work",
       "no change entries declared"],
      ["change_impact_total_matches_sum_of_entries",
       "no change entries declared"],
    ] as const) {
      check(results, "change_control_and_tracking", name,
        items, false, false, evidence);
    }
    return {
      entriesEvaluated: 0,
      computedChangeTotal: null,
      changeDifference: null,
    };
  }
  let incomplete = false;
  let evaluated = 0;
  let impactsOk = true;
  let approvalsOk = true;
  let computedTotal = 0;
  for (const entry of items as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [impact, hasImpact] = getEntry(entry, "cost_impact");
    const [statement, hasStatement] = getEntry(
      entry, "impact_statement_present");
    const [approved, hasApproved] = getEntry(entry, "approved_before_work");
    if (!(hasLabel && hasImpact && hasStatement && hasApproved &&
        isNonemptyStr(label) && isNumber(impact) && isBool(statement) &&
        isBool(approved))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    computedTotal += impact as number;
    if (statement !== true) impactsOk = false;
    if (approved !== true) approvalsOk = false;
  }
  if (incomplete) {
    check(results, "change_control_and_tracking",
      "change_entries_complete",
      items, false, false,
      "a change entry is missing its label, cost impact, impact-statement mark, or approval-before-work mark");
    check(results, "change_control_and_tracking",
      "all_changes_have_impact_statements",
      items, false, false,
      "a change entry is incomplete, so its impact statement cannot be checked");
    check(results, "change_control_and_tracking",
      "all_changes_approved_before_work",
      items, false, false,
      "a change entry is incomplete, so its approval-before-work mark cannot be checked");
  } else {
    check(results, "change_control_and_tracking",
      "change_entries_complete",
      items, true, true,
      "every change entry carries a label, a cost impact, an impact-statement mark, and an approval-before-work mark");
    check(results, "change_control_and_tracking",
      "all_changes_have_impact_statements",
      items, true, impactsOk,
      "method step 5: every scope change carries a cost and schedule impact statement");
    check(results, "change_control_and_tracking",
      "all_changes_approved_before_work",
      items, true, approvalsOk,
      "method step 5: every scope change is approved before the work is done");
  }
  const [declaredTotal, hasTotal] = getPath(
    manifest, "totals", "declared_total_change_impact");
  void hasTotal;
  let computed: number | null = null;
  let difference: number | null = null;
  if (incomplete || !isNumber(declaredTotal)) {
    check(results, "change_control_and_tracking",
      "change_impact_total_matches_sum_of_entries",
      items, false, false,
      "a change entry is incomplete or no total change impact is declared, so the total cannot be re-derived");
  } else {
    computed = computedTotal;
    difference = (declaredTotal as number) - computedTotal;
    check(results, "change_control_and_tracking",
      "change_impact_total_matches_sum_of_entries",
      items, true,
      fmt6((declaredTotal as number) - computedTotal) === "0.000000",
      "method step 5: the declared total change impact equals the sum of the declared change entries' cost impacts");
  }
  return {
    entriesEvaluated: evaluated,
    computedChangeTotal: computed,
    changeDifference: difference,
  };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: basis_document ----
  boolCheck(results, "basis_document", "basis_document_present",
    manifest, ["basis", "document_present"],
    "quality gate: a basis document is present for every estimate");
  boolCheck(results, "basis_document", "basis_scope_of_estimate_stated",
    manifest, ["basis", "scope_of_estimate_stated"],
    "method step 1: the basis document states the scope of the estimate");
  boolCheck(results, "basis_document", "basis_assumptions_stated",
    manifest, ["basis", "assumptions_stated"],
    "method step 1: the basis document states the estimate's assumptions");
  boolCheck(results, "basis_document", "basis_exclusions_stated",
    manifest, ["basis", "exclusions_stated"],
    "method step 1: the basis document states the estimate's exclusions");
  boolCheck(results, "basis_document", "basis_quote_validity_stated",
    manifest, ["basis", "quote_validity_stated"],
    "method step 1: the basis document states quote validity");
  boolCheck(results, "basis_document", "basis_fx_escalation_stated",
    manifest, ["basis", "fx_escalation_stated"],
    "method step 1: the basis document states FX and escalation treatment");
  boolCheck(results, "basis_document", "basis_estimator_named",
    manifest, ["basis", "estimator_named"],
    "method step 1: the basis document names the estimator");

  // ---- Section 2: budget_build_and_line_items ----
  boolCheck(results, "budget_build_and_line_items",
    "labor_costed_rate_times_hours",
    manifest, ["build", "labor_costed_rate_times_hours"],
    "method step 2: labor is built as rate x hours");
  boolCheck(results, "budget_build_and_line_items", "indirects_included",
    manifest, ["build", "indirects_included"],
    "method step 2: indirects — freight and permits — are included in the build");
  const { itemsEvaluated, computedSubtotal, subtotalDifference } =
    lineItemChecks(results, manifest);

  // ---- Section 3: contingency_reserve_and_totals ----
  boolCheck(results, "contingency_reserve_and_totals",
    "contingency_tied_to_listed_risks",
    manifest, ["contingency", "risks_listed_for_contingency"],
    "method step 3: the contingency is tied to listed risks");
  boolCheck(results, "contingency_reserve_and_totals",
    "management_reserve_held_separately",
    manifest, ["contingency", "management_reserve_held_separately"],
    "method step 3: the management reserve is held separately from the contingency");
  falseCheck(results, "contingency_reserve_and_totals",
    "no_padding_buried_in_estimate",
    manifest, ["contingency", "padding_buried_in_estimate"],
    "method step 3: no padding is buried in the estimate");
  const [subtotal, hasSub] = getPath(manifest, "totals", "declared_subtotal");
  const [contPct, hasContPct] = getPath(
    manifest, "totals", "contingency_percent");
  const [contAmt, hasContAmt] = getPath(
    manifest, "totals", "declared_contingency_amount");
  const contingencyAll = hasSub && hasContPct && hasContAmt &&
    isNumber(subtotal) && isNumber(contPct) && isNumber(contAmt);
  const computedContingency: number | null =
    hasSub && hasContPct && isNumber(subtotal) && isNumber(contPct)
      ? (subtotal as number) * (contPct as number) / 100
      : null;
  const contingencyDifference: number | null =
    computedContingency !== null && hasContAmt && isNumber(contAmt)
      ? (contAmt as number) - computedContingency
      : null;
  check(results, "contingency_reserve_and_totals",
    "contingency_amount_matches_subtotal_times_percent",
    contAmt, contingencyAll,
    contingencyAll &&
      fmt6((contAmt as number) -
        (subtotal as number) * (contPct as number) / 100) === "0.000000",
    "method step 3: the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)");
  const [reserveAmt, hasReserve] = getPath(
    manifest, "totals", "declared_management_reserve_amount");
  const [totalBudget, hasTotalBudget] = getPath(
    manifest, "totals", "declared_total_budget");
  const totalAll = hasSub && hasContAmt && hasReserve && hasTotalBudget &&
    isNumber(subtotal) && isNumber(contAmt) && isNumber(reserveAmt) &&
    isNumber(totalBudget);
  const computedTotalBudget: number | null =
    hasSub && hasContAmt && hasReserve && isNumber(subtotal) &&
      isNumber(contAmt) && isNumber(reserveAmt)
      ? (subtotal as number) + (contAmt as number) +
        (reserveAmt as number)
      : null;
  const totalBudgetDifference: number | null =
    computedTotalBudget !== null && hasTotalBudget && isNumber(totalBudget)
      ? (totalBudget as number) - computedTotalBudget
      : null;
  check(results, "contingency_reserve_and_totals",
    "total_budget_matches_subtotal_plus_contingency_plus_reserve",
    totalBudget, totalAll,
    totalAll &&
      fmt6((totalBudget as number) - ((subtotal as number) +
        (contAmt as number) + (reserveAmt as number))) === "0.000000",
    "the declared total budget equals the declared subtotal plus the declared contingency amount plus the declared management reserve amount (the reserve held separately, as its own declared line)");

  // ---- Section 4: approval_and_baseline ----
  boolCheck(results, "approval_and_baseline", "approval_recorded",
    manifest, ["approval", "approval_recorded"],
    "quality gate: the budget approval is recorded");
  boolCheck(results, "approval_and_baseline",
    "approved_amount_is_the_baseline",
    manifest, ["approval", "baseline_from_approved_amount"],
    "method step 4: the approved number is the baseline");
  boolCheck(results, "approval_and_baseline",
    "revisions_reapproved_not_drifted",
    manifest, ["approval", "revisions_reapproved"],
    "method step 4: revisions are re-approved, not drifted");
  falseCheck(results, "approval_and_baseline",
    "no_work_without_approved_estimate_or_po",
    manifest, ["approval", "work_without_approved_estimate_or_po"],
    "red line: no work is done without an approved estimate or PO");

  // ---- Section 5: change_control_and_tracking ----
  boolCheck(results, "change_control_and_tracking", "change_log_maintained",
    manifest, ["changes", "log_maintained"],
    "method step 5: the change log is tracked");
  falseCheck(results, "change_control_and_tracking",
    "no_verbal_change_orders",
    manifest, ["changes", "verbal_change_orders_used"],
    "red line: no verbal change orders are used");
  const {
    entriesEvaluated: changesEvaluated,
    computedChangeTotal,
    changeDifference,
  } = changeEntryChecks(results, manifest);
  const [changeTotal, hasChangeTotal] = getPath(
    manifest, "totals", "declared_total_change_impact");
  const [revised, hasRevised] = getPath(
    manifest, "totals", "declared_revised_budget");
  const revisedAll = hasTotalBudget && hasChangeTotal && hasRevised &&
    isNumber(totalBudget) && isNumber(changeTotal) && isNumber(revised);
  const computedRevised: number | null =
    hasTotalBudget && hasChangeTotal && isNumber(totalBudget) &&
      isNumber(changeTotal)
      ? (totalBudget as number) + (changeTotal as number)
      : null;
  const revisedDifference: number | null =
    computedRevised !== null && hasRevised && isNumber(revised)
      ? (revised as number) - computedRevised
      : null;
  check(results, "change_control_and_tracking",
    "revised_budget_matches_total_budget_plus_change_impact",
    revised, revisedAll,
    revisedAll &&
      fmt6((revised as number) - ((totalBudget as number) +
        (changeTotal as number))) === "0.000000",
    "method step 4: the declared revised budget equals the declared total budget plus the declared total change impact (the baseline moves only through approved changes, never by drift)");
  boolCheck(results, "change_control_and_tracking",
    "commitments_vs_actuals_tracked",
    manifest, ["tracking", "commitments_vs_actuals_tracked"],
    "method step 6: commitments (POs) are tracked against actuals");
  boolCheck(results, "change_control_and_tracking",
    "invoice_reconciliation_against_delivery",
    manifest, ["tracking", "invoice_reconciliation_against_delivery"],
    "method step 6: invoices are reconciled against delivery");
  boolCheck(results, "change_control_and_tracking",
    "monthly_report_issued",
    manifest, ["tracking", "monthly_report_issued"],
    "method step 6: the monthly one-page report is issued (variance, reasons, and actions)");
  boolCheck(results, "change_control_and_tracking",
    "variance_reported_with_reasons",
    manifest, ["tracking", "variance_reported_with_reasons"],
    "quality gate: variance is reported with reasons — no unexplained deltas");
  const [actuals, hasActuals] = getPath(
    manifest, "tracking", "actuals_amount");
  const [ftc, hasFtc] = getPath(
    manifest, "tracking", "forecast_to_complete_amount");
  const [totalFc, hasTotalFc] = getPath(
    manifest, "tracking", "declared_total_forecast_amount");
  const forecastAll = hasActuals && hasFtc && hasTotalFc &&
    isNumber(actuals) && isNumber(ftc) && isNumber(totalFc);
  const computedForecast: number | null =
    hasActuals && hasFtc && isNumber(actuals) && isNumber(ftc)
      ? (actuals as number) + (ftc as number)
      : null;
  const forecastDifference: number | null =
    computedForecast !== null && hasTotalFc && isNumber(totalFc)
      ? (totalFc as number) - computedForecast
      : null;
  check(results, "change_control_and_tracking",
    "total_forecast_matches_actuals_plus_forecast_to_complete",
    totalFc, forecastAll,
    forecastAll &&
      fmt6((totalFc as number) - ((actuals as number) +
        (ftc as number))) === "0.000000",
    "method step 6: the declared total forecast equals the declared actuals plus the declared forecast-to-complete");
  const [fcVar, hasFcVar] = getPath(
    manifest, "tracking", "declared_forecast_variance_amount");
  const fcVarAll = hasTotalFc && hasRevised && hasFcVar &&
    isNumber(totalFc) && isNumber(revised) && isNumber(fcVar);
  const computedFcVar: number | null =
    hasTotalFc && hasRevised && isNumber(totalFc) && isNumber(revised)
      ? (totalFc as number) - (revised as number)
      : null;
  const fcVarDifference: number | null =
    computedFcVar !== null && hasFcVar && isNumber(fcVar)
      ? (fcVar as number) - computedFcVar
      : null;
  check(results, "change_control_and_tracking",
    "forecast_variance_matches_total_forecast_minus_revised_budget",
    fcVar, fcVarAll,
    fcVarAll &&
      fmt6((fcVar as number) - ((totalFc as number) -
        (revised as number))) === "0.000000",
    "method step 6: the declared forecast variance equals the declared total forecast minus the declared revised budget (whether the variance is acceptable is not judged here)");

  // ---- Section 6: closeout_and_contingency_disposition ----
  boolCheck(results, "closeout_and_contingency_disposition",
    "final_cost_vs_budget_reconciled",
    manifest, ["closeout", "final_cost_reconciled"],
    "quality gate: closeout reconciles — final cost against budget");
  boolCheck(results, "closeout_and_contingency_disposition",
    "closeout_variance_explained",
    manifest, ["closeout", "variance_explained"],
    "method step 7: the closeout variance is explained");
  boolCheck(results, "closeout_and_contingency_disposition",
    "lessons_captured",
    manifest, ["closeout", "lessons_captured"],
    "method step 7: lessons are captured at closeout");
  boolCheck(results, "closeout_and_contingency_disposition",
    "contingency_disposition_stated",
    manifest, ["closeout", "contingency_disposition_stated"],
    "quality gate: the contingency disposition is stated at closeout");
  boolCheck(results, "closeout_and_contingency_disposition",
    "unspent_contingency_released_explicitly",
    manifest, ["closeout", "unspent_contingency_released_explicitly"],
    "method step 7: unspent contingency is released explicitly");
  const [finalCost, hasFinal] = getPath(
    manifest, "closeout", "declared_final_cost");
  const [finalVar, hasFinalVar] = getPath(
    manifest, "closeout", "declared_final_variance_amount");
  const finalVarAll = hasFinal && hasRevised && hasFinalVar &&
    isNumber(finalCost) && isNumber(revised) && isNumber(finalVar);
  const computedFinalVar: number | null =
    hasFinal && hasRevised && isNumber(finalCost) && isNumber(revised)
      ? (finalCost as number) - (revised as number)
      : null;
  const finalVarDifference: number | null =
    computedFinalVar !== null && hasFinalVar && isNumber(finalVar)
      ? (finalVar as number) - computedFinalVar
      : null;
  check(results, "closeout_and_contingency_disposition",
    "final_variance_matches_final_cost_minus_revised_budget",
    finalVar, finalVarAll,
    finalVarAll &&
      fmt6((finalVar as number) - ((finalCost as number) -
        (revised as number))) === "0.000000",
    "method step 7: the declared final variance equals the declared final cost minus the declared revised budget");
  const [used, hasUsed] = getPath(
    manifest, "closeout", "contingency_used_amount");
  const [unspent, hasUnspent] = getPath(
    manifest, "closeout", "declared_unspent_contingency_amount");
  const unspentAll = hasContAmt && hasUsed && hasUnspent &&
    isNumber(contAmt) && isNumber(used) && isNumber(unspent);
  const computedUnspent: number | null =
    hasContAmt && hasUsed && isNumber(contAmt) && isNumber(used)
      ? (contAmt as number) - (used as number)
      : null;
  const unspentDifference: number | null =
    computedUnspent !== null && hasUnspent && isNumber(unspent)
      ? (unspent as number) - computedUnspent
      : null;
  check(results, "closeout_and_contingency_disposition",
    "unspent_contingency_matches_contingency_minus_used",
    unspent, unspentAll,
    unspentAll &&
      fmt6((unspent as number) - ((contAmt as number) -
        (used as number))) === "0.000000",
    "method step 7: the declared unspent contingency equals the declared contingency amount minus the declared contingency used amount");

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
    verdict = "BUDGET_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "BUDGET_PACK_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "line_item_pricing_basis_marked" ||
      r.check === "line_item_amounts_match_quantity_times_rate" ||
      r.check === "subtotal_matches_sum_of_line_items" ||
      r.check === "contingency_amount_matches_subtotal_times_percent" ||
      r.check === "total_budget_matches_subtotal_plus_contingency_plus_reserve" ||
      r.check === "change_impact_total_matches_sum_of_entries" ||
      r.check === "revised_budget_matches_total_budget_plus_change_impact" ||
      r.check === "total_forecast_matches_actuals_plus_forecast_to_complete" ||
      r.check === "forecast_variance_matches_total_forecast_minus_revised_budget" ||
      r.check === "final_variance_matches_final_cost_minus_revised_budget" ||
      r.check === "unspent_contingency_matches_contingency_minus_used")
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
    service: "engineering-project-budget-pack",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    line_items_evaluated: itemsEvaluated,
    computed_subtotal: fmt6(computedSubtotal),
    subtotal_difference: fmt6(subtotalDifference),
    change_entries_evaluated: changesEvaluated,
    computed_change_impact_total: fmt6(computedChangeTotal),
    change_impact_difference: fmt6(changeDifference),
    computed_contingency_amount: fmt6(computedContingency),
    contingency_difference: fmt6(contingencyDifference),
    computed_total_budget: fmt6(computedTotalBudget),
    total_budget_difference: fmt6(totalBudgetDifference),
    computed_revised_budget: fmt6(computedRevised),
    revised_budget_difference: fmt6(revisedDifference),
    computed_total_forecast: fmt6(computedForecast),
    total_forecast_difference: fmt6(forecastDifference),
    computed_forecast_variance: fmt6(computedFcVar),
    forecast_variance_difference: fmt6(fcVarDifference),
    computed_final_variance: fmt6(computedFinalVar),
    final_variance_difference: fmt6(finalVarDifference),
    computed_unspent_contingency: fmt6(computedUnspent),
    unspent_contingency_difference: fmt6(unspentDifference),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ENGINEERING PROJECT BUDGET PACK",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(38)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
