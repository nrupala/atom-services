// Cost estimate preparation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/cost-estimate-preparation/src/cost_estimate_preparation.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared cost
// estimate artifact; it produces no estimate and exercises no
// estimating judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (estimate_class, method, line-item category)
// are validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  basis: {
    document_present: "boolean",
    estimate_class: "string",
    method: "string",
    assumptions_documented: "boolean",
    exclusions_documented: "boolean",
    estimator_identified: "boolean",
  },
  elements: {
    breakdown_not_lump_sum: "boolean",
    labor_burden_included: "boolean",
    hidden_padding_in_rates: "boolean",
  },
  line_items: [{
    label: "string",
    category: "string",
    quantity: "number",
    unit_rate: "number",
    declared_amount: "number",
  }],
  uncertainty: {
    ranges_stated_for_material_uncertainty: "boolean",
    items: [{
      label: "string",
      optimistic: "number",
      likely: "number",
      pessimistic: "number",
      declared_expected_value: "number",
      declared_spread: "number",
    }],
    expected_values_stated: "boolean",
    single_number_precision_on_uncertain_scope: "boolean",
  },
  totals: {
    declared_subtotal: "number",
    contingency_percent: "number",
    declared_contingency_amount: "number",
    escalation_percent: "number",
    declared_escalation_amount: "number",
    declared_grand_total: "number",
    escalation_impacts_stated: "boolean",
    currency_impacts_stated: "boolean",
    quote_validity_dates_captured: "boolean",
  },
  should_cost: {
    benchmark_built_for_big_items: "boolean",
    vendor_quote_amount: "number",
    should_cost_amount: "number",
    declared_variance_percent: "number",
    quote_compared_to_benchmark: "boolean",
    divergences_explained: "boolean",
    quote_exclusions_reviewed: "boolean",
    quote_assumptions_reviewed: "boolean",
    validity_period_respected: "boolean",
    quote_accepted_without_scope_review: "boolean",
  },
  feedback: {
    estimate_vs_actual_tracked_per_item: "boolean",
    rates_updated_from_actuals: "boolean",
    variance_lessons_published: "boolean",
  },
};

export const SECTIONS = [
  "basis_and_class",
  "elements_and_line_items",
  "uncertainty_and_ranges",
  "totals_escalation_and_currency",
  "should_cost_and_quotes",
  "feedback_loop",
] as const;

export const STATED_ESTIMATE_CLASSES = [
  "concept_rom",
  "budget",
  "definitive",
];

export const STATED_METHODS = [
  "bottom_up",
  "parametric",
  "analogous",
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
  uncertainty_items_evaluated: number;
  computed_total_spread: string | null;
  total_spread_difference: string | null;
  computed_contingency_amount: string | null;
  contingency_difference: string | null;
  computed_escalation_amount: string | null;
  escalation_difference: string | null;
  computed_grand_total: string | null;
  grand_total_difference: string | null;
  computed_quote_variance_percent: string | null;
  quote_variance_difference: string | null;
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
      ["line_item_amounts_match_quantity_times_rate",
       "no line items declared"],
      ["subtotal_matches_sum_of_line_items", "no line items declared"],
    ] as const) {
      check(results, "elements_and_line_items", name,
        items, false, false, evidence);
    }
    return { itemsEvaluated: 0, computedSubtotal: null, subtotalDifference: null };
  }
  let incomplete = false;
  let evaluated = 0;
  let amountsOk = true;
  let declaredSum = 0;
  for (const entry of items as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [category, hasCategory] = getEntry(entry, "category");
    const [quantity, hasQuantity] = getEntry(entry, "quantity");
    const [rate, hasRate] = getEntry(entry, "unit_rate");
    const [amount, hasAmount] = getEntry(entry, "declared_amount");
    if (!(hasLabel && hasCategory && hasQuantity && hasRate && hasAmount &&
        isNonemptyStr(label) && isNonemptyStr(category) &&
        isNumber(quantity) && isNumber(rate) && isNumber(amount))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    declaredSum += amount as number;
    if (fmt6((amount as number) -
        (quantity as number) * (rate as number)) !== "0.000000") {
      amountsOk = false;
    }
  }
  if (incomplete) {
    check(results, "elements_and_line_items",
      "line_item_entries_complete",
      items, false, false,
      "a line item is missing its label, category, quantity, unit rate, or declared amount");
  } else {
    check(results, "elements_and_line_items",
      "line_item_entries_complete",
      items, true, true,
      "every line item carries a label, a category, a quantity, a unit rate, and a declared amount");
  }
  if (incomplete) {
    check(results, "elements_and_line_items",
      "line_item_amounts_match_quantity_times_rate",
      items, false, false,
      "a line item is incomplete, so its amount cannot be re-derived");
  } else {
    check(results, "elements_and_line_items",
      "line_item_amounts_match_quantity_times_rate",
      items, true, amountsOk,
      "method step 3: each declared line amount equals its declared quantity multiplied by its declared unit rate");
  }
  const [declaredSubtotal, hasSubtotal] = getPath(
    manifest, "totals", "declared_subtotal");
  void hasSubtotal;
  let computedSubtotal: number | null = null;
  let difference: number | null = null;
  if (incomplete || !isNumber(declaredSubtotal)) {
    check(results, "elements_and_line_items",
      "subtotal_matches_sum_of_line_items",
      items, false, false,
      "a line item is incomplete or no subtotal is declared, so the subtotal cannot be re-derived");
  } else {
    computedSubtotal = declaredSum;
    difference = (declaredSubtotal as number) - declaredSum;
    check(results, "elements_and_line_items",
      "subtotal_matches_sum_of_line_items",
      items, true,
      fmt6((declaredSubtotal as number) - declaredSum) === "0.000000",
      "method step 3: the declared subtotal equals the sum of the declared line amounts");
  }
  return {
    itemsEvaluated: evaluated,
    computedSubtotal,
    subtotalDifference: difference,
  };
}

interface UncertaintyComputed {
  itemsEvaluated: number;
  computedTotalSpread: number | null;
  totalSpreadDifference: number | null;
}

function uncertaintyChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): UncertaintyComputed {
  const [items, hasItems] = getPath(manifest, "uncertainty", "items");
  if (!hasItems || !Array.isArray(items) || items.length === 0) {
    for (const [name, evidence] of [
      ["uncertainty_entries_complete",
       "no three-point uncertainty items declared"],
      ["three_point_ordering_valid",
       "no three-point uncertainty items declared"],
      ["three_point_spreads_match_pessimistic_minus_optimistic",
       "no three-point uncertainty items declared"],
    ] as const) {
      check(results, "uncertainty_and_ranges", name,
        items, false, false, evidence);
    }
    return {
      itemsEvaluated: 0,
      computedTotalSpread: null,
      totalSpreadDifference: null,
    };
  }
  let incomplete = false;
  let evaluated = 0;
  let orderingOk = true;
  let spreadsOk = true;
  let computedTotal = 0;
  let declaredTotal = 0;
  for (const entry of items as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [optimistic, hasO] = getEntry(entry, "optimistic");
    const [likely, hasL] = getEntry(entry, "likely");
    const [pessimistic, hasP] = getEntry(entry, "pessimistic");
    const [expected, hasE] = getEntry(entry, "declared_expected_value");
    const [spread, hasS] = getEntry(entry, "declared_spread");
    if (!(hasLabel && hasO && hasL && hasP && hasE && hasS &&
        isNonemptyStr(label) && isNumber(optimistic) &&
        isNumber(likely) && isNumber(pessimistic) &&
        isNumber(expected) && isNumber(spread))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    if (!((optimistic as number) <= (likely as number) &&
        (likely as number) <= (pessimistic as number))) {
      orderingOk = false;
    }
    computedTotal += (pessimistic as number) - (optimistic as number);
    declaredTotal += spread as number;
    if (fmt6((spread as number) -
        ((pessimistic as number) - (optimistic as number))) !== "0.000000") {
      spreadsOk = false;
    }
  }
  if (incomplete) {
    check(results, "uncertainty_and_ranges",
      "uncertainty_entries_complete",
      items, false, false,
      "an uncertainty item is missing its label, optimistic, likely, or pessimistic point, declared expected value, or declared spread");
  } else {
    check(results, "uncertainty_and_ranges",
      "uncertainty_entries_complete",
      items, true, true,
      "every uncertainty item carries a label, three points, a declared expected value, and a declared spread");
  }
  if (incomplete) {
    check(results, "uncertainty_and_ranges",
      "three_point_ordering_valid",
      items, false, false,
      "an uncertainty item is incomplete, so its three points cannot be ordered");
    check(results, "uncertainty_and_ranges",
      "three_point_spreads_match_pessimistic_minus_optimistic",
      items, false, false,
      "an uncertainty item is incomplete, so its spread cannot be re-derived");
    return {
      itemsEvaluated: evaluated,
      computedTotalSpread: null,
      totalSpreadDifference: null,
    };
  }
  check(results, "uncertainty_and_ranges",
    "three_point_ordering_valid",
    items, true, orderingOk,
    "method step 4: each item's three points are in optimistic <= likely <= pessimistic order");
  check(results, "uncertainty_and_ranges",
    "three_point_spreads_match_pessimistic_minus_optimistic",
    items, true, spreadsOk,
    "method step 4: each declared spread equals its declared pessimistic minus optimistic value (the declared expected value states no formula in the skill and is checked for presence only)");
  return {
    itemsEvaluated: evaluated,
    computedTotalSpread: computedTotal,
    totalSpreadDifference: declaredTotal - computedTotal,
  };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: basis_and_class ----
  boolCheck(results, "basis_and_class", "basis_document_present",
    manifest, ["basis", "document_present"],
    "quality gate: a basis document is present for the estimate");
  const [estimateClass, hasClass] = getPath(
    manifest, "basis", "estimate_class");
  check(results, "basis_and_class", "estimate_class_in_stated_classes",
    estimateClass, hasClass,
    hasClass && STATED_ESTIMATE_CLASSES.includes(estimateClass as string),
    "method step 1: the declared estimate class is one of the classes the skill names — concept/ROM, budget, definitive (declared as concept_rom, budget, or definitive)");
  const [method, hasMethod] = getPath(manifest, "basis", "method");
  check(results, "basis_and_class", "method_in_stated_methods",
    method, hasMethod,
    hasMethod && STATED_METHODS.includes(method as string),
    "method step 2: the declared method is one of the methods the skill names — bottom-up, parametric, analogous (declared as bottom_up, parametric, or analogous)");
  boolCheck(results, "basis_and_class", "assumptions_documented",
    manifest, ["basis", "assumptions_documented"],
    "quality gate: the basis document states the estimate's assumptions");
  boolCheck(results, "basis_and_class", "exclusions_documented",
    manifest, ["basis", "exclusions_documented"],
    "quality gate: the basis document states the estimate's exclusions");
  boolCheck(results, "basis_and_class", "estimator_identified",
    manifest, ["basis", "estimator_identified"],
    "quality gate: the basis document identifies the estimator");

  // ---- Section 2: elements_and_line_items ----
  boolCheck(results, "elements_and_line_items",
    "elements_broken_down_not_lump_sum",
    manifest, ["elements", "breakdown_not_lump_sum"],
    "method step 3: the estimate is broken into elements, not lump sums — material, labor, equipment, subcontract, freight, indirects");
  boolCheck(results, "elements_and_line_items",
    "labor_rates_include_burden",
    manifest, ["elements", "labor_burden_included"],
    "method step 3: labor is costed as hours x rates including burden");
  const { itemsEvaluated, computedSubtotal, subtotalDifference } =
    lineItemChecks(results, manifest);
  falseCheck(results, "elements_and_line_items",
    "no_hidden_padding_in_rates",
    manifest, ["elements", "hidden_padding_in_rates"],
    "red line: no padding is hidden inside rates");

  // ---- Section 3: uncertainty_and_ranges ----
  boolCheck(results, "uncertainty_and_ranges",
    "ranges_stated_for_material_uncertainty",
    manifest, ["uncertainty", "ranges_stated_for_material_uncertainty"],
    "quality gate: ranges, not points, are stated for material uncertainty");
  const {
    itemsEvaluated: uncEvaluated,
    computedTotalSpread,
    totalSpreadDifference,
  } = uncertaintyChecks(results, manifest);
  boolCheck(results, "uncertainty_and_ranges", "expected_values_stated",
    manifest, ["uncertainty", "expected_values_stated"],
    "method step 4: an expected value is stated for each shaky item alongside its spread");
  falseCheck(results, "uncertainty_and_ranges",
    "no_single_number_precision_on_uncertain_scope",
    manifest, ["uncertainty", "single_number_precision_on_uncertain_scope"],
    "red line: no single-number precision is presented on uncertain scope");

  // ---- Section 4: totals_escalation_and_currency ----
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
  check(results, "totals_escalation_and_currency",
    "contingency_amount_matches_subtotal_times_percent",
    contAmt, contingencyAll,
    contingencyAll &&
      fmt6((contAmt as number) -
        (subtotal as number) * (contPct as number) / 100) === "0.000000",
    "the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)");
  const [escPct, hasEscPct] = getPath(
    manifest, "totals", "escalation_percent");
  const [escAmt, hasEscAmt] = getPath(
    manifest, "totals", "declared_escalation_amount");
  const escalationAll = hasSub && hasEscPct && hasEscAmt &&
    isNumber(subtotal) && isNumber(escPct) && isNumber(escAmt);
  const computedEscalation: number | null =
    hasSub && hasEscPct && isNumber(subtotal) && isNumber(escPct)
      ? (subtotal as number) * (escPct as number) / 100
      : null;
  const escalationDifference: number | null =
    computedEscalation !== null && hasEscAmt && isNumber(escAmt)
      ? (escAmt as number) - computedEscalation
      : null;
  check(results, "totals_escalation_and_currency",
    "escalation_amount_matches_subtotal_times_percent",
    escAmt, escalationAll,
    escalationAll &&
      fmt6((escAmt as number) -
        (subtotal as number) * (escPct as number) / 100) === "0.000000",
    "method step 5: the declared escalation amount equals the declared subtotal multiplied by the declared escalation percent (the percent itself is fixed by no statement in the skill and is not judged here)");
  const [grand, hasGrand] = getPath(
    manifest, "totals", "declared_grand_total");
  const grandAll = hasSub && hasContAmt && hasEscAmt && hasGrand &&
    isNumber(subtotal) && isNumber(contAmt) && isNumber(escAmt) &&
    isNumber(grand);
  const computedGrand: number | null =
    hasSub && hasContAmt && hasEscAmt && isNumber(subtotal) &&
      isNumber(contAmt) && isNumber(escAmt)
      ? (subtotal as number) + (contAmt as number) + (escAmt as number)
      : null;
  const grandDifference: number | null =
    computedGrand !== null && hasGrand && isNumber(grand)
      ? (grand as number) - computedGrand
      : null;
  check(results, "totals_escalation_and_currency",
    "grand_total_matches_subtotal_plus_contingency_plus_escalation",
    grand, grandAll,
    grandAll &&
      fmt6((grand as number) - ((subtotal as number) +
        (contAmt as number) + (escAmt as number))) === "0.000000",
    "the declared grand total equals the declared subtotal plus the declared contingency amount plus the declared escalation amount");
  boolCheck(results, "totals_escalation_and_currency",
    "escalation_impacts_stated",
    manifest, ["totals", "escalation_impacts_stated"],
    "method step 5: escalation impacts — inflation and lead-time — are stated");
  boolCheck(results, "totals_escalation_and_currency",
    "currency_impacts_stated",
    manifest, ["totals", "currency_impacts_stated"],
    "method step 5: currency (fx) impacts are stated");
  boolCheck(results, "totals_escalation_and_currency",
    "quote_validity_dates_captured",
    manifest, ["totals", "quote_validity_dates_captured"],
    "method step 5: quote validity dates are captured");

  // ---- Section 5: should_cost_and_quotes ----
  boolCheck(results, "should_cost_and_quotes",
    "should_cost_benchmark_built",
    manifest, ["should_cost", "benchmark_built_for_big_items"],
    "method step 6: an independent should-cost benchmark is built for big items");
  boolCheck(results, "should_cost_and_quotes",
    "quote_compared_to_benchmark",
    manifest, ["should_cost", "quote_compared_to_benchmark"],
    "method step 6: vendor quotes are compared against the should-cost benchmark");
  const [quoteAmt, hasQuote] = getPath(
    manifest, "should_cost", "vendor_quote_amount");
  const [benchAmt, hasBench] = getPath(
    manifest, "should_cost", "should_cost_amount");
  const [varPct, hasVar] = getPath(
    manifest, "should_cost", "declared_variance_percent");
  const varianceAll = hasQuote && hasBench && hasVar &&
    isNumber(quoteAmt) && isNumber(benchAmt) && isNumber(varPct);
  const computedVariance: number | null =
    hasQuote && hasBench && isNumber(quoteAmt) && isNumber(benchAmt) &&
      (benchAmt as number) !== 0
      ? ((quoteAmt as number) - (benchAmt as number)) /
        (benchAmt as number) * 100
      : null;
  const varianceDifference: number | null =
    computedVariance !== null && hasVar && isNumber(varPct)
      ? (varPct as number) - computedVariance
      : null;
  check(results, "should_cost_and_quotes",
    "quote_variance_percent_matches_rederived",
    varPct, varianceAll,
    varianceAll && (benchAmt as number) !== 0 &&
      fmt6((varPct as number) -
        ((quoteAmt as number) - (benchAmt as number)) /
        (benchAmt as number) * 100) === "0.000000",
    "method step 6: the declared variance percent equals the declared vendor quote minus the declared should-cost benchmark, divided by the benchmark, times 100 (whether the variance is acceptable is not judged here)");
  boolCheck(results, "should_cost_and_quotes", "divergences_explained",
    manifest, ["should_cost", "divergences_explained"],
    "quality gate: divergences between quotes and the benchmark are explained — scope, rates, or margin");
  boolCheck(results, "should_cost_and_quotes",
    "quote_exclusions_reviewed",
    manifest, ["should_cost", "quote_exclusions_reviewed"],
    "quality gate: the quotes' exclusions are reviewed line by line");
  boolCheck(results, "should_cost_and_quotes",
    "quote_assumptions_reviewed",
    manifest, ["should_cost", "quote_assumptions_reviewed"],
    "method step 7: the quotes' assumptions are reviewed line by line");
  boolCheck(results, "should_cost_and_quotes",
    "validity_period_respected",
    manifest, ["should_cost", "validity_period_respected"],
    "method step 7: the quote validity period is respected");
  falseCheck(results, "should_cost_and_quotes",
    "no_quote_accepted_without_scope_review",
    manifest, ["should_cost", "quote_accepted_without_scope_review"],
    "red line: no vendor quote is accepted without scope review");

  // ---- Section 6: feedback_loop ----
  boolCheck(results, "feedback_loop",
    "estimate_vs_actual_tracked_per_item",
    manifest, ["feedback", "estimate_vs_actual_tracked_per_item"],
    "quality gate: estimate vs actual is tracked per item");
  boolCheck(results, "feedback_loop", "rates_updated_from_actuals",
    manifest, ["feedback", "rates_updated_from_actuals"],
    "quality gate: tracked actuals are fed back into rates");
  boolCheck(results, "feedback_loop", "variance_lessons_published",
    manifest, ["feedback", "variance_lessons_published"],
    "method step 8: variance lessons are published");

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
    verdict = "COST_ESTIMATE_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "COST_ESTIMATE_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "estimate_class_in_stated_classes" ||
      r.check === "method_in_stated_methods" ||
      r.check === "line_item_amounts_match_quantity_times_rate" ||
      r.check === "subtotal_matches_sum_of_line_items" ||
      r.check === "three_point_spreads_match_pessimistic_minus_optimistic" ||
      r.check === "contingency_amount_matches_subtotal_times_percent" ||
      r.check === "escalation_amount_matches_subtotal_times_percent" ||
      r.check === "grand_total_matches_subtotal_plus_contingency_plus_escalation" ||
      r.check === "quote_variance_percent_matches_rederived")
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
    service: "cost-estimate-preparation",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    line_items_evaluated: itemsEvaluated,
    computed_subtotal: fmt6(computedSubtotal),
    subtotal_difference: fmt6(subtotalDifference),
    uncertainty_items_evaluated: uncEvaluated,
    computed_total_spread: fmt6(computedTotalSpread),
    total_spread_difference: fmt6(totalSpreadDifference),
    computed_contingency_amount: fmt6(computedContingency),
    contingency_difference: fmt6(contingencyDifference),
    computed_escalation_amount: fmt6(computedEscalation),
    escalation_difference: fmt6(escalationDifference),
    computed_grand_total: fmt6(computedGrand),
    grand_total_difference: fmt6(grandDifference),
    computed_quote_variance_percent: fmt6(computedVariance),
    quote_variance_difference: fmt6(varianceDifference),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "COST ESTIMATE PREPARATION",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
