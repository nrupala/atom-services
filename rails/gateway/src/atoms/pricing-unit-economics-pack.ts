// Pricing unit economics pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/pricing-unit-economics-pack/src/pricing_unit_economics_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; computed comparisons compare the fixed-6dp difference
// to zero.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  revenue_model: {
    model_kind: "string",
    bookings_billings_and_recognized_revenue_kept_distinct: "boolean",
    recognition_timing_documented: "boolean",
    accountant_alignment_on_recognition_declared: "boolean",
  },
  pricing: {
    value_based_anchor_documented: "boolean",
    good_better_best_tiers_declared: "boolean",
    price_change_grandfathering_plan_present: "boolean",
    pricing_reviewed_annually_declared: "boolean",
  },
  tiers: [{
    name: "string",
    price: "number",
    variable_cost_per_unit: "number",
    units: "number",
    declared_revenue: "number",
    declared_contribution: "number",
  }],
  discount_policy: {
    approval_matrix_present: "boolean",
    floor_prices_set: "boolean",
    deal_desk_for_exceptions_present: "boolean",
    refund_and_credit_policy_present: "boolean",
    failed_payment_dunning_process_present: "boolean",
    fraud_and_dispute_basics_present: "boolean",
  },
  discounts: [{
    label: "string",
    reason: "string",
  }],
  unit_economics: {
    assumptions_stated: "boolean",
    assumptions_conservative_declared: "boolean",
    unit_economics_updated_quarterly_declared: "boolean",
    price_per_unit: "number",
    variable_cost_per_unit: "number",
    fixed_costs: "number",
    units_sold: "number",
    declared_contribution_margin_ratio: "number",
    declared_break_even_units: "number",
    declared_total_contribution: "number",
  },
  churn: {
    gross_and_net_churn_kept_distinct: "boolean",
    cohort_curves_used_not_single_period_averages: "boolean",
    expansion_revenue_tracked: "boolean",
  },
  mrr_bridge: {
    opening_mrr: "number",
    new_mrr: "number",
    expansion_mrr: "number",
    contraction_mrr: "number",
    churned_mrr: "number",
    declared_closing_mrr: "number",
  },
  reporting: {
    cash_collection_and_recognized_revenue_kept_distinct: "boolean",
    forecast_inputs_handed_over_with_ranges_declared: "boolean",
  },
  red_lines: {
    bookings_presented_as_revenue_present: "boolean",
    unrecorded_discounts_present: "boolean",
    improvised_recognition_decisions_present: "boolean",
  },
};

export const SECTIONS = [
  "revenue_model_and_recognition",
  "pricing_and_packaging",
  "discount_and_payment_guardrails",
  "unit_economics",
  "churn_retention_and_reporting",
  "red_lines",
] as const;

const STATED_MODEL_KINDS = ["one_time", "subscription", "usage", "hybrid"];

const TIER_FIELDS = [
  "name", "price", "variable_cost_per_unit", "units",
  "declared_revenue", "declared_contribution",
];
const REVENUE_FIELDS = ["price", "units", "declared_revenue"];
const CONTRIBUTION_FIELDS = [
  "price", "variable_cost_per_unit", "units", "declared_contribution",
];
const BRIDGE_FIELDS = [
  "opening_mrr", "new_mrr", "expansion_mrr", "contraction_mrr",
  "churned_mrr", "declared_closing_mrr",
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
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  tiers_count: number | null;
  duplicate_tier_names: string[] | null;
  tiers_mismatching_revenue: string[] | null;
  tiers_mismatching_contribution: string[] | null;
  total_declared_tier_revenue: string | null;
  total_declared_tier_contribution: string | null;
  tier_contribution_margin: string | null;
  discounts_count: number | null;
  discounts_without_reason: string[] | null;
  duplicate_discount_labels: string[] | null;
  discount_reason_coverage: string | null;
  computed_contribution_margin_ratio: string | null;
  contribution_margin_difference: string | null;
  computed_break_even_units: string | null;
  break_even_difference: string | null;
  computed_total_contribution: string | null;
  total_contribution_difference: string | null;
  computed_closing_mrr: string | null;
  closing_mrr_difference: string | null;
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

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function isNum(value: unknown): value is number {
  return typeof value === "number";
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function rowNumbers(entry: unknown, fields: string[]): boolean {
  return isPyDict(entry) && fields.every((f) => isNum(entry[f]));
}

function numField(obj: Record<string, unknown>, field: string): number | null {
  return isNum(obj[field]) ? (obj[field] as number) : null;
}

function numOf(entry: unknown, field: string): number {
  if (isPyDict(entry) && isNum(entry[field])) return entry[field] as number;
  return 0;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [tiersRaw, hasTiers] = getPath(manifest, "tiers");
  const tiersIsList = hasTiers && Array.isArray(tiersRaw);
  const trows: unknown[] = tiersIsList ? (tiersRaw as unknown[]) : [];
  const tiersCount: number | null = tiersIsList ? trows.length : null;

  const tiersMismatchingRevenue: string[] | null = tiersIsList
    ? trows.filter((c) => rowNumbers(c, REVENUE_FIELDS) &&
        fmt6(numOf(c, "declared_revenue") -
          numOf(c, "price") * numOf(c, "units")) !== "0.000000")
        .map((c) => rowName(c, "name"))
    : null;
  const tiersMismatchingContribution: string[] | null = tiersIsList
    ? trows.filter((c) => rowNumbers(c, CONTRIBUTION_FIELDS) &&
        fmt6(numOf(c, "declared_contribution") -
          (numOf(c, "price") - numOf(c, "variable_cost_per_unit")) *
          numOf(c, "units")) !== "0.000000")
        .map((c) => rowName(c, "name"))
    : null;
  let duplicateTierNames: string[] | null = null;
  if (tiersIsList) {
    const seen: string[] = [];
    duplicateTierNames = [];
    for (const c of trows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateTierNames.includes(nm)) {
          duplicateTierNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const totalTierRevenue: number | null =
    tiersIsList && trows.every((c) => rowNumbers(c, ["declared_revenue"]))
      ? trows.reduce((acc: number, c) => acc + numOf(c, "declared_revenue"), 0)
      : null;
  const totalTierContribution: number | null =
    tiersIsList && trows.every((c) => rowNumbers(c, ["declared_contribution"]))
      ? trows.reduce((acc: number, c) => acc + numOf(c, "declared_contribution"), 0)
      : null;
  const tierContributionMargin: number | null =
    totalTierRevenue !== null && totalTierContribution !== null &&
      totalTierRevenue !== 0
      ? totalTierContribution / totalTierRevenue
      : null;

  const [discountsRaw, hasDiscounts] = getPath(manifest, "discounts");
  const discountsIsList = hasDiscounts && Array.isArray(discountsRaw);
  const drows: unknown[] = discountsIsList ? (discountsRaw as unknown[]) : [];
  const discountsCount: number | null = discountsIsList ? drows.length : null;

  const discountsWithoutReason: string[] | null = discountsIsList
    ? drows.filter((c) => hasField(c, "reason") &&
        !(typeof (c as Record<string, unknown>)["reason"] === "string" &&
          (c as Record<string, unknown>)["reason"] !== ""))
        .map((c) => rowName(c, "label"))
    : null;
  let duplicateDiscountLabels: string[] | null = null;
  if (discountsIsList) {
    const seen: string[] = [];
    duplicateDiscountLabels = [];
    for (const c of drows) {
      if (isPyDict(c) && typeof c["label"] === "string") {
        const nm = c["label"] as string;
        if (seen.includes(nm) && !duplicateDiscountLabels.includes(nm)) {
          duplicateDiscountLabels.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const discountReasonCoverage: number | null =
    discountsIsList && discountsCount !== null && discountsCount > 0
      ? drows.filter((c) => isPyDict(c) &&
          typeof c["reason"] === "string" &&
          c["reason"] !== "").length / discountsCount
      : null;

  const [ueRaw, hasUe] = getPath(manifest, "unit_economics");
  const ue: Record<string, unknown> = isPyDict(ueRaw) ? ueRaw : {};
  const pricePerUnit = numField(ue, "price_per_unit");
  const ueVariable = numField(ue, "variable_cost_per_unit");
  const fixedCosts = numField(ue, "fixed_costs");
  const unitsSold = numField(ue, "units_sold");
  const declaredRatio = numField(ue, "declared_contribution_margin_ratio");
  const declaredBe = numField(ue, "declared_break_even_units");
  const declaredTotalContrib = numField(ue, "declared_total_contribution");

  const unitContribution: number | null =
    pricePerUnit !== null && ueVariable !== null
      ? pricePerUnit - ueVariable
      : null;
  const computedRatio: number | null =
    unitContribution !== null && pricePerUnit !== 0
      ? unitContribution / (pricePerUnit as number)
      : null;
  const ratioDifference: number | null =
    declaredRatio !== null && computedRatio !== null
      ? declaredRatio - computedRatio
      : null;
  const computedBe: number | null =
    fixedCosts !== null && unitContribution !== null && unitContribution !== 0
      ? fixedCosts / unitContribution
      : null;
  const beDifference: number | null =
    declaredBe !== null && computedBe !== null
      ? declaredBe - computedBe
      : null;
  const computedTotalContrib: number | null =
    unitsSold !== null && unitContribution !== null
      ? unitsSold * unitContribution
      : null;
  const totalContribDifference: number | null =
    declaredTotalContrib !== null && computedTotalContrib !== null
      ? declaredTotalContrib - computedTotalContrib
      : null;

  const [bridgeRaw, hasBridge] = getPath(manifest, "mrr_bridge");
  const bridge: Record<string, unknown> = isPyDict(bridgeRaw) ? bridgeRaw : {};
  const bridgeAllDeclared = isPyDict(bridgeRaw) &&
    BRIDGE_FIELDS.every((f) => hasField(bridge, f) && isNum(bridge[f]));
  const computedClosing: number | null = bridgeAllDeclared
    ? (bridge["opening_mrr"] as number) + (bridge["new_mrr"] as number) +
      (bridge["expansion_mrr"] as number) -
      (bridge["contraction_mrr"] as number) -
      (bridge["churned_mrr"] as number)
    : null;
  const closingDifference: number | null = bridgeAllDeclared
    ? (bridge["declared_closing_mrr"] as number) -
      (computedClosing as number)
    : null;

  // ---- Section 1: revenue_model_and_recognition ----
  const [modelKind, modelKindPresent] = getPath(
    manifest, "revenue_model", "model_kind");
  check(results, "revenue_model_and_recognition",
    "revenue_model_kind_is_stated_kind", modelKind, modelKindPresent,
    typeof modelKind === "string" && STATED_MODEL_KINDS.includes(modelKind),
    "model clarity: the revenue model kind is one of the kinds the skill names — one-time, subscription, usage or hybrid");
  boolCheck(results, "revenue_model_and_recognition",
    "bookings_billings_and_recognized_revenue_kept_distinct", manifest,
    ["revenue_model", "bookings_billings_and_recognized_revenue_kept_distinct"],
    "model clarity: bookings, billings and recognized revenue are different things and are kept distinct");
  boolCheck(results, "revenue_model_and_recognition",
    "recognition_timing_documented", manifest,
    ["revenue_model", "recognition_timing_documented"],
    "model clarity: revenue recognition timing is documented");
  boolCheck(results, "revenue_model_and_recognition",
    "accountant_alignment_on_recognition_declared", manifest,
    ["revenue_model", "accountant_alignment_on_recognition_declared"],
    "model clarity: recognition timing is aligned with the accountant — the accountant owns filings, the record keeps the data clean");

  // ---- Section 2: pricing_and_packaging ----
  boolCheck(results, "pricing_and_packaging",
    "value_based_anchor_documented", manifest,
    ["pricing", "value_based_anchor_documented"],
    "pricing: the value-based anchor — what it is worth to the buyer — is documented");
  boolCheck(results, "pricing_and_packaging",
    "good_better_best_tiers_declared", manifest,
    ["pricing", "good_better_best_tiers_declared"],
    "pricing: good-better-best tiers are declared");
  boolCheck(results, "pricing_and_packaging",
    "price_change_grandfathering_plan_present", manifest,
    ["pricing", "price_change_grandfathering_plan_present"],
    "pricing: price changes carry a grandfathering plan");
  boolCheck(results, "pricing_and_packaging",
    "pricing_reviewed_annually_declared", manifest,
    ["pricing", "pricing_reviewed_annually_declared"],
    "pricing: pricing is reviewed annually");
  check(results, "pricing_and_packaging",
    "price_tiers_declared", tiersRaw, tiersIsList, tiersIsList,
    "the declared record names its price tiers — the tiers list is present; an empty list declares that the record prices no tier");
  const tierCompletePresent = tiersIsList &&
    trows.every((c) => isPyDict(c) && TIER_FIELDS.every((f) => hasField(c, f)));
  check(results, "pricing_and_packaging",
    "every_price_tier_entry_complete", tiersRaw, tierCompletePresent,
    tiersIsList &&
      trows.every((c) => isPyDict(c) &&
        typeof c["name"] === "string" && c["name"] !== "" &&
        TIER_FIELDS.slice(1).every((f) => isNum(c[f]))),
    "price tiers: every declared tier row is complete — name, price, variable cost per unit, units, declared revenue and declared contribution all declared, the name non-empty");
  const tierNamePresent = tiersIsList &&
    trows.every((c) => hasField(c, "name"));
  check(results, "pricing_and_packaging",
    "no_price_tier_name_duplicated", tiersRaw, tierNamePresent,
    tiersIsList && duplicateTierNames !== null &&
      duplicateTierNames.length === 0,
    "price tiers: no declared tier name is owned by more than one tier row");
  const tierRevPresent = tiersIsList &&
    trows.every((c) => rowNumbers(c, REVENUE_FIELDS)) &&
    trows.every((c) => isPyDict(c) &&
      REVENUE_FIELDS.every((f) => hasField(c, f)));
  check(results, "pricing_and_packaging",
    "tier_revenue_matches_price_times_units", tiersRaw, tierRevPresent,
    tiersIsList && tiersMismatchingRevenue !== null &&
      tiersMismatchingRevenue.length === 0,
    "price tiers: every declared tier revenue equals its price times its units");
  const tierConPresent = tiersIsList &&
    trows.every((c) => isPyDict(c) &&
      CONTRIBUTION_FIELDS.every((f) => hasField(c, f))) &&
    trows.every((c) => rowNumbers(c, CONTRIBUTION_FIELDS));
  check(results, "pricing_and_packaging",
    "tier_contribution_matches_unit_contribution_times_units", tiersRaw,
    tierConPresent,
    tiersIsList && tiersMismatchingContribution !== null &&
      tiersMismatchingContribution.length === 0,
    "price tiers: every declared tier contribution equals (price minus variable cost per unit) times its units");

  // ---- Section 3: discount_and_payment_guardrails ----
  boolCheck(results, "discount_and_payment_guardrails",
    "discount_approval_matrix_present", manifest,
    ["discount_policy", "approval_matrix_present"],
    "discount guardrails: a discount approval matrix exists");
  boolCheck(results, "discount_and_payment_guardrails",
    "discount_floor_prices_set", manifest,
    ["discount_policy", "floor_prices_set"],
    "discount guardrails: floor prices are set");
  boolCheck(results, "discount_and_payment_guardrails",
    "deal_desk_for_exceptions_present", manifest,
    ["discount_policy", "deal_desk_for_exceptions_present"],
    "discount guardrails: a deal desk handles exceptions");
  boolCheck(results, "discount_and_payment_guardrails",
    "refund_and_credit_policy_present", manifest,
    ["discount_policy", "refund_and_credit_policy_present"],
    "guardrails: a refund and credit policy exists");
  boolCheck(results, "discount_and_payment_guardrails",
    "failed_payment_dunning_process_present", manifest,
    ["discount_policy", "failed_payment_dunning_process_present"],
    "guardrails: failed-payment handling — dunning — is in place");
  boolCheck(results, "discount_and_payment_guardrails",
    "fraud_and_dispute_basics_present", manifest,
    ["discount_policy", "fraud_and_dispute_basics_present"],
    "guardrails: fraud and dispute basics are in place");
  check(results, "discount_and_payment_guardrails",
    "discounts_declared", discountsRaw, discountsIsList, discountsIsList,
    "the declared record names its discounts — the discounts list is present; an empty list declares that no discounts were given");
  const reasonPresent = discountsIsList &&
    drows.every((c) => hasField(c, "reason"));
  check(results, "discount_and_payment_guardrails",
    "every_discount_names_reason", discountsRaw, reasonPresent,
    discountsIsList &&
      drows.every((c) => isPyDict(c) &&
        typeof c["reason"] === "string" && c["reason"] !== ""),
    "discount guardrails: every declared discount row logs a reason — no ad-hoc generosity");
  const labelPresent = discountsIsList &&
    drows.every((c) => hasField(c, "label"));
  check(results, "discount_and_payment_guardrails",
    "no_discount_label_duplicated", discountsRaw, labelPresent,
    discountsIsList && duplicateDiscountLabels !== null &&
      duplicateDiscountLabels.length === 0,
    "discount guardrails: no declared discount label is owned by more than one discount row");

  // ---- Section 4: unit_economics ----
  boolCheck(results, "unit_economics",
    "unit_economics_assumptions_stated", manifest,
    ["unit_economics", "assumptions_stated"],
    "unit economics: the assumptions behind the figures are stated and visible");
  boolCheck(results, "unit_economics",
    "unit_economics_assumptions_conservative_declared", manifest,
    ["unit_economics", "assumptions_conservative_declared"],
    "unit economics: the stated assumptions are declared conservative");
  boolCheck(results, "unit_economics",
    "unit_economics_updated_quarterly_declared", manifest,
    ["unit_economics", "unit_economics_updated_quarterly_declared"],
    "unit economics: the figures are updated quarterly");
  const ratioPresent = pricePerUnit !== null && ueVariable !== null &&
    declaredRatio !== null;
  check(results, "unit_economics",
    "contribution_margin_ratio_matches_price_and_variable_cost",
    hasUe ? ueRaw : null, ratioPresent,
    ratioPresent && computedRatio !== null &&
      fmt6(ratioDifference) === "0.000000",
    "unit economics: the declared contribution-margin ratio equals (price per unit minus variable cost per unit) divided by price per unit");
  const bePresent = fixedCosts !== null && pricePerUnit !== null &&
    ueVariable !== null && declaredBe !== null;
  check(results, "unit_economics",
    "break_even_units_matches_fixed_costs_over_unit_contribution",
    hasUe ? ueRaw : null, bePresent,
    bePresent && computedBe !== null &&
      fmt6(beDifference) === "0.000000",
    "unit economics: the declared break-even units equal fixed costs divided by (price per unit minus variable cost per unit)");
  const totalPresent = unitsSold !== null && pricePerUnit !== null &&
    ueVariable !== null && declaredTotalContrib !== null;
  check(results, "unit_economics",
    "total_contribution_matches_units_sold_times_unit_contribution",
    hasUe ? ueRaw : null, totalPresent,
    totalPresent && computedTotalContrib !== null &&
      fmt6(totalContribDifference) === "0.000000",
    "unit economics: the declared total contribution equals units sold times (price per unit minus variable cost per unit)");

  // ---- Section 5: churn_retention_and_reporting ----
  boolCheck(results, "churn_retention_and_reporting",
    "gross_and_net_churn_kept_distinct", manifest,
    ["churn", "gross_and_net_churn_kept_distinct"],
    "churn: gross churn and net churn are kept distinct");
  boolCheck(results, "churn_retention_and_reporting",
    "cohort_curves_used_not_single_period_averages", manifest,
    ["churn", "cohort_curves_used_not_single_period_averages"],
    "churn: retention is read from cohort curves, not single-period averages");
  boolCheck(results, "churn_retention_and_reporting",
    "expansion_revenue_tracked", manifest,
    ["churn", "expansion_revenue_tracked"],
    "churn: expansion revenue is tracked");
  check(results, "churn_retention_and_reporting",
    "mrr_bridge_closes_on_declared_figures",
    hasBridge ? bridgeRaw : null, bridgeAllDeclared,
    bridgeAllDeclared && fmt6(closingDifference) === "0.000000",
    "reporting: the MRR bridge closes — declared closing MRR equals opening plus new plus expansion minus contraction minus churned MRR");
  boolCheck(results, "churn_retention_and_reporting",
    "cash_collection_and_recognized_revenue_kept_distinct", manifest,
    ["reporting", "cash_collection_and_recognized_revenue_kept_distinct"],
    "reporting: cash collection and recognized revenue are kept distinct");
  boolCheck(results, "churn_retention_and_reporting",
    "forecast_inputs_handed_over_with_ranges_declared", manifest,
    ["reporting", "forecast_inputs_handed_over_with_ranges_declared"],
    "forecast inputs: committed plus pipeline plus base rates are handed to forecasting with ranges — this atom hands inputs over, it forecasts nothing itself");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_bookings_presented_as_revenue", manifest,
    ["red_lines", "bookings_presented_as_revenue_present"],
    "red line: no vanity metrics — bookings presented as revenue are not present in the record");
  falseCheck(results, "red_lines",
    "no_unrecorded_discounts", manifest,
    ["red_lines", "unrecorded_discounts_present"],
    "red line: no unrecorded discounts are present in the record");
  falseCheck(results, "red_lines",
    "no_improvised_recognition_decisions", manifest,
    ["red_lines", "improvised_recognition_decisions_present"],
    "red line: no improvised recognition decisions are present in the record");

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
    verdict = "PRICING_UNIT_ECONOMICS_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRICING_UNIT_ECONOMICS_PACK_READY";
  }

  const computedNames = [
    "revenue_model_kind_is_stated_kind",
    "price_tiers_declared",
    "every_price_tier_entry_complete",
    "no_price_tier_name_duplicated",
    "tier_revenue_matches_price_times_units",
    "tier_contribution_matches_unit_contribution_times_units",
    "discounts_declared",
    "every_discount_names_reason",
    "no_discount_label_duplicated",
    "contribution_margin_ratio_matches_price_and_variable_cost",
    "break_even_units_matches_fixed_costs_over_unit_contribution",
    "total_contribution_matches_units_sold_times_unit_contribution",
    "mrr_bridge_closes_on_declared_figures",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "pricing-unit-economics-pack",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    tiers_count: tiersCount,
    duplicate_tier_names: duplicateTierNames,
    tiers_mismatching_revenue: tiersMismatchingRevenue,
    tiers_mismatching_contribution: tiersMismatchingContribution,
    total_declared_tier_revenue: fmt6(totalTierRevenue),
    total_declared_tier_contribution: fmt6(totalTierContribution),
    tier_contribution_margin: fmt6(tierContributionMargin),
    discounts_count: discountsCount,
    discounts_without_reason: discountsWithoutReason,
    duplicate_discount_labels: duplicateDiscountLabels,
    discount_reason_coverage: fmt6(discountReasonCoverage),
    computed_contribution_margin_ratio: fmt6(computedRatio),
    contribution_margin_difference: fmt6(ratioDifference),
    computed_break_even_units: fmt6(computedBe),
    break_even_difference: fmt6(beDifference),
    computed_total_contribution: fmt6(computedTotalContrib),
    total_contribution_difference: fmt6(totalContribDifference),
    computed_closing_mrr: fmt6(computedClosing),
    closing_mrr_difference: fmt6(closingDifference),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRICING UNIT ECONOMICS PACK",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
