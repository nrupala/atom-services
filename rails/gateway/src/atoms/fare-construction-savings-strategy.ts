// Fare construction savings strategy — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/fare-construction-savings-strategy/src/
// fare_construction_savings_strategy.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check
// status, evidence string, computed value and the summary string
// are byte-identical to the Python output for the same input.
// Computed amounts use the shared fixed serialization: round
// half up to 6dp — floor(v * 1000000 + 0.5) / 1000000 — then
// format with exactly six decimals; computed comparisons compare
// the fixed-6dp difference to zero. This atom validates a
// declared fare-construction record; it searches no fares,
// quotes no prices, books nothing and exercises no travel
// judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  trip_label: "string",
  trip: {
    origin: "string",
    destination: "string",
    travel_dates: "string",
    flexibility: "string",
  },
  drivers: {
    advance_purchase_explained: "boolean",
    day_of_week_explained: "boolean",
    nearby_airports_considered: "boolean",
    split_tickets_considered: "boolean",
  },
  strategy: {
    search_strategy_given: "boolean",
    price_only_without_strategy: "boolean",
  },
  total_cost: {
    headline_fare: "number",
    fees: "number",
    baggage_fees: "number",
    seat_fees: "number",
    declared_total_cost: "number",
    total_cost_surfaced: "boolean",
    headline_presented_as_total_cost: "boolean",
  },
  construction: {
    legs: [{
      label: "string",
      price: "number",
    }],
    declared_constructed_total: "number",
    baseline_direct_fare: "number",
    declared_savings: "number",
    constructed_option_compared_to_direct: "boolean",
  },
  integrity: {
    prices_invented: "boolean",
    quoted_fare_presented_as_starting_point: "boolean",
    recheck_before_booking_advised: "boolean",
    uncheckable_items_disclosed: "boolean",
  },
};

export const SECTIONS = [
  "trip_definition",
  "fare_drivers_explained",
  "search_strategy",
  "total_cost_surface",
  "fare_construction",
  "price_integrity",
] as const;

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
  trip_label: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  legs_evaluated: number;
  computed_constructed_total: string | null;
  constructed_total_difference: string | null;
  computed_total_cost: string | null;
  total_cost_difference: string | null;
  computed_savings: string | null;
  savings_difference: string | null;
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

function stringCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, isNonemptyStr(value), evidence);
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

interface ConstructionComputed {
  legsEvaluated: number;
  computedConstructedTotal: number | null;
  constructedTotalDifference: number | null;
}

function constructionChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): ConstructionComputed {
  const [legs, hasLegs] = getPath(manifest, "construction", "legs");
  const [declaredTotal, hasTotal] = getPath(
    manifest, "construction", "declared_constructed_total");
  if (!hasLegs || !Array.isArray(legs) || legs.length === 0) {
    for (const [name, evidence] of [
      ["construction_legs_complete", "no construction legs declared"],
      ["constructed_total_matches_sum_of_leg_prices",
       "no construction legs declared"],
    ] as const) {
      check(results, "fare_construction", name, legs, false, false, evidence);
    }
    return {
      legsEvaluated: 0,
      computedConstructedTotal: null,
      constructedTotalDifference: null,
    };
  }
  let incomplete = false;
  let evaluated = 0;
  let legSum = 0;
  for (const entry of legs as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [price, hasPrice] = getEntry(entry, "price");
    if (!(hasLabel && hasPrice && isNonemptyStr(label) && isNumber(price))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    legSum += price as number;
  }
  if (incomplete) {
    check(results, "fare_construction", "construction_legs_complete",
      legs, false, false,
      "a construction leg is missing its label or price");
    check(results, "fare_construction",
      "constructed_total_matches_sum_of_leg_prices",
      legs, false, false,
      "a construction leg is incomplete, so the constructed total cannot be re-derived");
    return {
      legsEvaluated: evaluated,
      computedConstructedTotal: null,
      constructedTotalDifference: null,
    };
  }
  check(results, "fare_construction", "construction_legs_complete",
    legs, true, true,
    "every construction leg carries a label and a price");
  const computedTotal = legSum;
  const difference: number | null =
    hasTotal && isNumber(declaredTotal)
      ? (declaredTotal as number) - computedTotal
      : null;
  const consistent = hasTotal && isNumber(declaredTotal) &&
    fmt6((declaredTotal as number) - computedTotal) === "0.000000";
  check(results, "fare_construction",
    "constructed_total_matches_sum_of_leg_prices",
    declaredTotal, hasTotal && isNumber(declaredTotal), consistent,
    "the declared constructed total equals the sum of the declared construction leg prices");
  return {
    legsEvaluated: evaluated,
    computedConstructedTotal: computedTotal,
    constructedTotalDifference: difference,
  };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: trip_definition ----
  stringCheck(results, "trip_definition", "origin_declared",
    manifest, ["trip", "origin"],
    "step 1: the trip origin is declared");
  stringCheck(results, "trip_definition", "destination_declared",
    manifest, ["trip", "destination"],
    "step 1: the trip destination is declared");
  stringCheck(results, "trip_definition", "travel_dates_declared",
    manifest, ["trip", "travel_dates"],
    "step 1: the travel dates are declared");
  stringCheck(results, "trip_definition", "flexibility_declared",
    manifest, ["trip", "flexibility"],
    "step 1: the traveller's date flexibility is declared");

  // ---- Section 2: fare_drivers_explained ----
  boolCheck(results, "fare_drivers_explained",
    "advance_purchase_driver_explained",
    manifest, ["drivers", "advance_purchase_explained"],
    "step 2: the advance-purchase driver is explained for this route");
  boolCheck(results, "fare_drivers_explained",
    "day_of_week_driver_explained",
    manifest, ["drivers", "day_of_week_explained"],
    "step 2: the day-of-week driver is explained for this route");
  boolCheck(results, "fare_drivers_explained",
    "nearby_airports_considered",
    manifest, ["drivers", "nearby_airports_considered"],
    "step 2: nearby airports are considered for this route");
  boolCheck(results, "fare_drivers_explained",
    "split_tickets_considered",
    manifest, ["drivers", "split_tickets_considered"],
    "step 2: split tickets are considered for this route");

  // ---- Section 3: search_strategy ----
  boolCheck(results, "search_strategy", "search_strategy_given",
    manifest, ["strategy", "search_strategy_given"],
    "step 3: a search strategy is given, not just a price");
  falseCheck(results, "search_strategy",
    "not_price_only_without_strategy",
    manifest, ["strategy", "price_only_without_strategy"],
    "step 3: the record is not a price alone without a strategy");

  // ---- Section 4: total_cost_surface ----
  boolCheck(results, "total_cost_surface", "total_cost_surfaced",
    manifest, ["total_cost", "total_cost_surfaced"],
    "rule: the total cost is surfaced to the caller, not only the headline fare");
  falseCheck(results, "total_cost_surface",
    "headline_not_presented_as_total_cost",
    manifest, ["total_cost", "headline_presented_as_total_cost"],
    "rule: the headline fare is never presented as the cost");
  const [headline, hasHeadline] = getPath(
    manifest, "total_cost", "headline_fare");
  const [fees, hasFees] = getPath(manifest, "total_cost", "fees");
  const [bags, hasBags] = getPath(manifest, "total_cost", "baggage_fees");
  const [seats, hasSeats] = getPath(manifest, "total_cost", "seat_fees");
  const [declaredCost, hasCost] = getPath(
    manifest, "total_cost", "declared_total_cost");
  const componentsAllNumbers = hasHeadline && hasFees && hasBags &&
    hasSeats && isNumber(headline) && isNumber(fees) && isNumber(bags) &&
    isNumber(seats);
  const computedCost: number | null = componentsAllNumbers
    ? (headline as number) + (fees as number) + (bags as number) +
      (seats as number)
    : null;
  const costAllNumbers = componentsAllNumbers && hasCost &&
    isNumber(declaredCost);
  const costDifference: number | null =
    computedCost !== null && hasCost && isNumber(declaredCost)
      ? (declaredCost as number) - computedCost
      : null;
  const costConsistent = costAllNumbers &&
    fmt6((declaredCost as number) - (computedCost as number)) === "0.000000";
  check(results, "total_cost_surface",
    "total_cost_matches_headline_plus_fees_bags_seats",
    declaredCost, costAllNumbers, costConsistent,
    "rule: the declared total cost equals the declared headline fare plus the declared fees, baggage fees and seat fees (fees, bags, seats are surfaced, never folded silently into the headline)");

  // ---- Section 5: fare_construction ----
  const { legsEvaluated, computedConstructedTotal,
    constructedTotalDifference } = constructionChecks(results, manifest);
  const [baseline, hasBaseline] = getPath(
    manifest, "construction", "baseline_direct_fare");
  const [declaredTotal, hasTotal] = getPath(
    manifest, "construction", "declared_constructed_total");
  const [declaredSavings, hasSavings] = getPath(
    manifest, "construction", "declared_savings");
  const savingsAllNumbers = hasBaseline && hasTotal && hasSavings &&
    isNumber(baseline) && isNumber(declaredTotal) &&
    isNumber(declaredSavings);
  const computedSavings: number | null =
    hasBaseline && hasTotal && isNumber(baseline) && isNumber(declaredTotal)
      ? (baseline as number) - (declaredTotal as number)
      : null;
  const savingsDifference: number | null =
    computedSavings !== null && hasSavings && isNumber(declaredSavings)
      ? (declaredSavings as number) - computedSavings
      : null;
  const savingsConsistent = savingsAllNumbers &&
    fmt6((declaredSavings as number) - (computedSavings as number)) ===
      "0.000000";
  check(results, "fare_construction",
    "declared_savings_matches_baseline_minus_constructed_total",
    declaredSavings, savingsAllNumbers, savingsConsistent,
    "the declared savings equal the declared baseline direct fare minus the declared constructed total (no minimum saving is imposed — the skill states none; only the arithmetic is re-derived)");
  boolCheck(results, "fare_construction",
    "constructed_option_compared_to_direct",
    manifest, ["construction", "constructed_option_compared_to_direct"],
    "the constructed option is compared against the direct option on the record");

  // ---- Section 6: price_integrity ----
  falseCheck(results, "price_integrity", "prices_not_invented",
    manifest, ["integrity", "prices_invented"],
    "rule: prices are never invented");
  boolCheck(results, "price_integrity",
    "quoted_fare_presented_as_starting_point_not_promise",
    manifest, ["integrity", "quoted_fare_presented_as_starting_point"],
    "rule: a quoted fare is presented as a starting point, not a promise");
  boolCheck(results, "price_integrity", "recheck_before_booking_advised",
    manifest, ["integrity", "recheck_before_booking_advised"],
    "rule: rechecking the fare before booking is advised");
  boolCheck(results, "price_integrity", "uncheckable_items_disclosed",
    manifest, ["integrity", "uncheckable_items_disclosed"],
    "rule: what cannot be checked is said, not silently omitted");

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
    verdict = "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "total_cost_matches_headline_plus_fees_bags_seats" ||
      r.check === "construction_legs_complete" ||
      r.check === "constructed_total_matches_sum_of_leg_prices" ||
      r.check === "declared_savings_matches_baseline_minus_constructed_total")
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
    service: "fare-construction-savings-strategy",
    atom_version: "0.1.0",
    trip_label: manifest["trip_label"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    legs_evaluated: legsEvaluated,
    computed_constructed_total: fmt6(computedConstructedTotal),
    constructed_total_difference: fmt6(constructedTotalDifference),
    computed_total_cost: fmt6(computedCost),
    total_cost_difference: fmt6(costDifference),
    computed_savings: fmt6(computedSavings),
    savings_difference: fmt6(savingsDifference),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FARE CONSTRUCTION SAVINGS STRATEGY",
    `trip_label: ${pyStr(verdict.trip_label ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
