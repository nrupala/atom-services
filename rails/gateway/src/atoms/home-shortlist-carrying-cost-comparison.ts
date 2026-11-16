// Home shortlist carrying-cost comparison — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/home-shortlist-carrying-cost-comparison/src/
// home_shortlist_carrying_cost_comparison.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed amounts and ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the fixed-6dp difference against zero.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  search_name: "string",
  currency: "string",
  criteria: {
    written_before_search: "boolean",
    area: "string",
    property_type: "string",
    budget_ceiling: "number",
    must_haves_defined: "boolean",
    deal_breakers_defined: "boolean",
  },
  homes: [{
    name: "string",
    listing_source: "string",
    fetch_date: "string",
    status: "string",
    ruled_out_reason: "string",
    asking_price: "number",
    monthly_housing_payment: "number",
    monthly_property_tax: "number",
    monthly_utilities_estimate: "number",
    monthly_condo_or_hoa_fees: "number",
    declared_monthly_carrying_cost: "number",
    open_questions: ["string"],
    meets_criteria: "boolean",
  }],
  tracking: {
    tracked_in_one_list: "boolean",
    refreshed_before_comparison: "boolean",
    criteria_market_conflict_addressed: "boolean",
  },
  presentation: {
    ranked_on_carrying_cost_not_price_alone: "boolean",
    sources_and_fetch_dates_attached: "boolean",
    unknowns_presented_as_questions: "boolean",
    freshness_limits_stated: "boolean",
    presented_as_research_not_advice: "boolean",
  },
};

export const SECTIONS = [
  "criteria_first",
  "candidate_records",
  "carrying_cost_computation",
  "tracking_and_refresh",
  "ranking_and_presentation",
] as const;

const STATED_STATUSES = [
  "live",
  "ruled_out",
  "viewed",
  "awaiting_information",
];

const COST_COMPONENTS = [
  "monthly_housing_payment",
  "monthly_property_tax",
  "monthly_utilities_estimate",
  "monthly_condo_or_hoa_fees",
];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface HomeCarryingCost {
  name: string;
  monthly_carrying_cost: string | null;
}

export interface Verdict {
  service: string;
  atom_version: string;
  search_name: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  homes_count: number | null;
  monthly_carrying_costs: HomeCarryingCost[] | null;
  total_monthly_carrying_cost: string | null;
  lowest_monthly_carrying_cost: string | null;
  highest_monthly_carrying_cost: string | null;
  carrying_cost_spread: string | null;
  ranked_home_names: string[] | null;
  cheapest_home_name: string | null;
  cost_figure_coverage: string | null;
  homes_without_listing_source: string[] | null;
  homes_without_fetch_date: string[] | null;
  homes_with_invalid_status: string[] | null;
  ruled_out_homes_without_reason: string[] | null;
  homes_not_meeting_criteria: string[] | null;
  homes_with_carrying_cost_mismatch: string[] | null;
  homes_over_budget_ceiling: string[] | null;
  homes_within_budget_count: number | null;
  any_home_within_budget: boolean | null;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function rowCost(entry: unknown): number | null {
  if (!isPyDict(entry)) return null;
  let total = 0;
  for (const field of COST_COMPONENTS) {
    const value = entry[field];
    if (!isNumber(value)) return null;
    total = total + value;
  }
  return total;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows and criteria, read once ----
  const [homesRaw, hasHomes] = getPath(manifest, "homes");
  const homesIsList = hasHomes && Array.isArray(homesRaw);
  const rows: unknown[] = homesIsList ? (homesRaw as unknown[]) : [];
  const homesCount: number | null = homesIsList ? rows.length : null;

  const [budgetCeiling, hasBudget] = getPath(
    manifest, "criteria", "budget_ceiling");

  const rowCosts: (number | null)[] = rows.map(rowCost);
  const completeIdx: number[] = [];
  rowCosts.forEach((c, i) => { if (c !== null) completeIdx.push(i); });
  const monthlyCarryingCosts: HomeCarryingCost[] | null = homesIsList
    ? rows.map((row, i) => ({
        name: rowName(row),
        monthly_carrying_cost: fmt6(rowCosts[i]),
      }))
    : null;
  let totalCarrying: number | null = null;
  if (completeIdx.length > 0) {
    totalCarrying = 0;
    for (const i of completeIdx) totalCarrying += rowCosts[i] as number;
  }
  const completeCosts: number[] = completeIdx.map(
    (i) => rowCosts[i] as number);
  let lowestCarrying: number | null = null;
  let highestCarrying: number | null = null;
  for (const c of completeCosts) {
    if (lowestCarrying === null || c < lowestCarrying) lowestCarrying = c;
    if (highestCarrying === null || c > highestCarrying) highestCarrying = c;
  }
  const spread: number | null = completeCosts.length > 0
    ? (highestCarrying as number) - (lowestCarrying as number)
    : null;
  const rankedIdx = [...completeIdx].sort((a, b) => {
    const ca = rowCosts[a] as number;
    const cb = rowCosts[b] as number;
    if (ca !== cb) return ca < cb ? -1 : 1;
    return a - b;
  });
  const rankedHomeNames: string[] | null = homesIsList
    ? rankedIdx.map((i) => rowName(rows[i]))
    : null;
  const cheapestHomeName: string | null =
    rankedHomeNames !== null && rankedHomeNames.length > 0
      ? rankedHomeNames[0]
      : null;
  const costFigureCoverage: number | null =
    homesIsList && homesCount !== null && homesCount > 0
      ? completeIdx.length / homesCount
      : null;

  const homesWithoutSource: string[] | null = homesIsList
    ? rows.filter((c) => !nonemptyStr(c, "listing_source")).map(rowName)
    : null;
  const homesWithoutFetchDate: string[] | null = homesIsList
    ? rows.filter((c) => !nonemptyStr(c, "fetch_date")).map(rowName)
    : null;
  const homesWithInvalidStatus: string[] | null = homesIsList
    ? rows.filter((c) => isPyDict(c) && typeof c["status"] === "string" &&
        !STATED_STATUSES.includes(c["status"] as string)).map(rowName)
    : null;
  const ruledOutRows = rows.filter(
    (c) => isPyDict(c) && c["status"] === "ruled_out");
  const ruledOutWithoutReason: string[] | null = homesIsList
    ? ruledOutRows.filter((c) => hasField(c, "ruled_out_reason") &&
        !nonemptyStr(c, "ruled_out_reason")).map(rowName)
    : null;
  const homesNotMeetingCriteria: string[] | null = homesIsList
    ? rows.filter((c) => isPyDict(c) && c["meets_criteria"] === false)
        .map(rowName)
    : null;
  const mismatchIdx = completeIdx.filter((i) => {
    const row = rows[i];
    return isPyDict(row) &&
      isNumber(row["declared_monthly_carrying_cost"]) &&
      fmt6((row["declared_monthly_carrying_cost"] as number) -
        (rowCosts[i] as number)) !== "0.000000";
  });
  const homesWithMismatch: string[] | null = homesIsList
    ? mismatchIdx.map((i) => rowName(rows[i]))
    : null;

  const budgetComputable = homesIsList && isNumber(budgetCeiling);
  const homesOverBudget: string[] | null = budgetComputable
    ? rows.filter((c) => isPyDict(c) && isNumber(c["asking_price"]) &&
        (c["asking_price"] as number) > (budgetCeiling as number))
        .map(rowName)
    : null;
  const withinBudget = budgetComputable
    ? rows.filter((c) => isPyDict(c) && isNumber(c["asking_price"]) &&
        (c["asking_price"] as number) <= (budgetCeiling as number))
    : null;
  const homesWithinBudgetCount: number | null = withinBudget !== null
    ? withinBudget.length
    : null;
  const anyHomeWithinBudget: boolean | null =
    homesWithinBudgetCount !== null ? homesWithinBudgetCount > 0 : null;

  // ---- Section 1: criteria_first ----
  boolCheck(results, "criteria_first",
    "criteria_written_before_search", manifest,
    ["criteria", "written_before_search"],
    "method step 1 / quality gate: the criteria were written down before listings were gathered");
  const [currency, hasCurrency] = getPath(manifest, "currency");
  check(results, "criteria_first", "currency_declared",
    currency, hasCurrency,
    typeof currency === "string" && currency.length > 0,
    "method step 3: every declared figure is in one declared currency — a non-empty currency string, so the comparison sums like with like");
  const [area, hasArea] = getPath(manifest, "criteria", "area");
  check(results, "criteria_first", "criteria_area_declared",
    area, hasArea,
    typeof area === "string" && area.length > 0,
    "method step 1: the criteria name the search area — a non-empty area string");
  const [propertyType, hasPropertyType] = getPath(
    manifest, "criteria", "property_type");
  check(results, "criteria_first", "criteria_property_type_declared",
    propertyType, hasPropertyType,
    typeof propertyType === "string" && propertyType.length > 0,
    "method step 1: the criteria name the property type — a non-empty property_type string");
  check(results, "criteria_first", "criteria_budget_ceiling_declared",
    budgetCeiling, hasBudget,
    isNumber(budgetCeiling) && budgetCeiling > 0,
    "method step 1: the criteria declare a budget ceiling — a positive declared amount, the caller's own ceiling (no affordability bar is imposed here)");
  boolCheck(results, "criteria_first", "must_haves_defined",
    manifest, ["criteria", "must_haves_defined"],
    "method step 1: the must-haves are defined in writing");
  boolCheck(results, "criteria_first", "deal_breakers_defined",
    manifest, ["criteria", "deal_breakers_defined"],
    "method step 1: the deal-breakers are defined in writing");

  // ---- Section 2: candidate_records ----
  check(results, "candidate_records", "homes_declared",
    homesRaw, homesIsList,
    homesIsList && (homesCount as number) > 0,
    "method step 2: the declared record names its candidate homes — the homes list is present and non-empty");
  const sourcePresent = homesIsList &&
    rows.every((c) => hasField(c, "listing_source"));
  check(results, "candidate_records", "every_home_names_listing_source",
    homesRaw, sourcePresent,
    homesIsList && (homesCount as number) > 0 &&
      homesWithoutSource !== null && homesWithoutSource.length === 0,
    "quality gate: every candidate names its listing source — a non-empty listing_source string per home");
  const fetchPresent = homesIsList &&
    rows.every((c) => hasField(c, "fetch_date"));
  check(results, "candidate_records", "every_home_names_fetch_date",
    homesRaw, fetchPresent,
    homesIsList && (homesCount as number) > 0 &&
      homesWithoutFetchDate !== null && homesWithoutFetchDate.length === 0,
    "quality gate: every candidate names the date its listing was fetched — a non-empty fetch_date string per home");
  const statusPresent = homesIsList &&
    rows.every((c) => hasField(c, "status"));
  check(results, "candidate_records", "every_home_declares_stated_status",
    homesRaw, statusPresent,
    homesIsList && (homesCount as number) > 0 &&
      homesWithInvalidStatus !== null &&
      homesWithInvalidStatus.length === 0 &&
      rows.every((c) => isPyDict(c) && typeof c["status"] === "string" &&
        (c["status"] as string).length > 0),
    "method step 6: every home declares a tracking status from the statuses the skill names — live, ruled_out, viewed, awaiting_information");
  const fitPresent = homesIsList &&
    rows.every((c) => hasField(c, "meets_criteria"));
  check(results, "candidate_records", "every_home_declares_fit_to_criteria",
    homesRaw, fitPresent,
    homesIsList && (homesCount as number) > 0,
    "method step 9: every home declares whether it meets the written criteria, so the shortlist can be ranked on fit as well as carrying cost");
  const ruledOutPresent = homesIsList &&
    ruledOutRows.every((c) => hasField(c, "ruled_out_reason"));
  check(results, "candidate_records", "every_ruled_out_home_has_reason",
    homesRaw, ruledOutPresent,
    homesIsList && ruledOutWithoutReason !== null &&
      ruledOutWithoutReason.length === 0 &&
      ruledOutRows.every((c) => nonemptyStr(c, "ruled_out_reason")),
    "quality gate: ruled-out homes carry a reason, not just a deletion — every home declared ruled_out names a non-empty ruled_out_reason");
  const questionsPresent = homesIsList &&
    rows.every((c) => hasField(c, "open_questions"));
  check(results, "candidate_records", "every_home_lists_open_questions",
    homesRaw, questionsPresent,
    homesIsList && (homesCount as number) > 0,
    "method step 5: every home lists what the listing does not say as open questions — the open_questions list is declared per home (an empty list declares none)");

  // ---- Section 3: carrying_cost_computation ----
  const pricePresent = homesIsList &&
    rows.every((c) => hasField(c, "asking_price"));
  check(results, "carrying_cost_computation",
    "every_home_declares_asking_price", homesRaw, pricePresent,
    homesIsList && (homesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && isNumber(c["asking_price"]) &&
        (c["asking_price"] as number) > 0),
    "method step 3: every home declares its asking price — a positive declared amount per home");
  const componentsPresent = homesIsList &&
    rows.every((c) => COST_COMPONENTS.every((f) => hasField(c, f)));
  check(results, "carrying_cost_computation",
    "every_home_declares_all_monthly_cost_components", homesRaw,
    componentsPresent,
    homesIsList && (homesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        COST_COMPONENTS.every((f) => isNumber(c[f]) &&
          (c[f] as number) >= 0)),
    "method step 3: every home declares all four monthly carrying-cost components — housing payment, property tax, utilities estimate, condo or HOA fees — each a non-negative declared amount (zero declares none, e.g. no HOA fees; nothing is estimated here)");
  const totalsPresent = componentsPresent &&
    rows.every((c) => hasField(c, "declared_monthly_carrying_cost"));
  check(results, "carrying_cost_computation",
    "declared_carrying_costs_match_rederived", homesRaw, totalsPresent,
    homesIsList && (homesCount as number) > 0 &&
      homesWithMismatch !== null && homesWithMismatch.length === 0 &&
      completeIdx.length === homesCount,
    "method step 4: each home's declared monthly carrying cost equals the re-derived sum of its four declared monthly components");

  // ---- Section 4: tracking_and_refresh ----
  boolCheck(results, "tracking_and_refresh",
    "candidates_tracked_in_one_list", manifest,
    ["tracking", "tracked_in_one_list"],
    "method step 6: the candidates are tracked in one list with honest status notes");
  boolCheck(results, "tracking_and_refresh",
    "stale_candidates_refreshed_before_comparison", manifest,
    ["tracking", "refreshed_before_comparison"],
    "method step 8: stale candidates were refreshed before the comparison is relied on — availability and price change without notice");
  boolCheck(results, "tracking_and_refresh",
    "criteria_market_conflict_addressed", manifest,
    ["tracking", "criteria_market_conflict_addressed"],
    "method step 7: where criteria and market reality conflict, that is stated plainly with the nearest trade-offs shown (or none was found)");

  // ---- Section 5: ranking_and_presentation ----
  boolCheck(results, "ranking_and_presentation",
    "shortlist_ranked_on_carrying_cost_not_price_alone", manifest,
    ["presentation", "ranked_on_carrying_cost_not_price_alone"],
    "method step 9 / red line: the shortlist is ranked on fit to criteria and full carrying cost — never on headline price while hiding fees");
  boolCheck(results, "ranking_and_presentation",
    "sources_and_fetch_dates_attached_to_shortlist", manifest,
    ["presentation", "sources_and_fetch_dates_attached"],
    "method step 9: sources and fetch dates are attached to the presented shortlist");
  boolCheck(results, "ranking_and_presentation",
    "unknowns_presented_as_questions_not_assumptions", manifest,
    ["presentation", "unknowns_presented_as_questions"],
    "quality gate: unknowns are listed as questions, never filled in by guesswork");
  boolCheck(results, "ranking_and_presentation",
    "freshness_limits_stated", manifest,
    ["presentation", "freshness_limits_stated"],
    "red line: no listing price or availability is presented as current beyond its fetch time — the freshness limits are stated");
  boolCheck(results, "ranking_and_presentation",
    "presented_as_research_not_advice", manifest,
    ["presentation", "presented_as_research_not_advice"],
    "red line: the comparison is presented as education and organization, not real-estate advice — the buy decision stays with the caller and their own professionals");

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
    verdict = "HOME_SHORTLIST_COMPARISON_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "HOME_SHORTLIST_COMPARISON_READY";
  }

  const computedNames = [
    "homes_declared",
    "every_home_names_listing_source",
    "every_home_names_fetch_date",
    "every_home_declares_stated_status",
    "every_ruled_out_home_has_reason",
    "every_home_declares_all_monthly_cost_components",
    "declared_carrying_costs_match_rederived",
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
    service: "home-shortlist-carrying-cost-comparison",
    atom_version: "0.1.0",
    search_name: manifest["search_name"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    homes_count: homesCount,
    monthly_carrying_costs: monthlyCarryingCosts,
    total_monthly_carrying_cost: fmt6(totalCarrying),
    lowest_monthly_carrying_cost: fmt6(lowestCarrying),
    highest_monthly_carrying_cost: fmt6(highestCarrying),
    carrying_cost_spread: fmt6(spread),
    ranked_home_names: rankedHomeNames,
    cheapest_home_name: cheapestHomeName,
    cost_figure_coverage: fmt6(costFigureCoverage),
    homes_without_listing_source: homesWithoutSource,
    homes_without_fetch_date: homesWithoutFetchDate,
    homes_with_invalid_status: homesWithInvalidStatus,
    ruled_out_homes_without_reason: ruledOutWithoutReason,
    homes_not_meeting_criteria: homesNotMeetingCriteria,
    homes_with_carrying_cost_mismatch: homesWithMismatch,
    homes_over_budget_ceiling: homesOverBudget,
    homes_within_budget_count: homesWithinBudgetCount,
    any_home_within_budget: anyHomeWithinBudget,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "HOME SHORTLIST CARRYING COST COMPARISON",
    `search_name: ${pyStr(verdict.search_name ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
