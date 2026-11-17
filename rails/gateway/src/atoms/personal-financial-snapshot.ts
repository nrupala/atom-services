// Personal financial snapshot — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/personal-financial-snapshot/src/personal_financial_snapshot.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed amounts use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the fixed-6dp difference to zero.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  subject: "string",
  snapshot: {
    as_of_date_stated: "boolean",
    currency_stated: "boolean",
    net_worth_stated: "boolean",
    allocation_stated: "boolean",
    cash_flow_stated: "boolean",
    cash_flow_period_stated: "boolean",
  },
  figures: {
    total_assets: "number",
    total_liabilities: "number",
    net_worth: "number",
    period_income: "number",
    period_expenses: "number",
    net_cash_flow: "number",
    annual_fees_and_drag_total: "number",
  },
  assets: [{
    name: "string",
    category: "string",
    amount: "number",
  }],
  liabilities: [{
    name: "string",
    amount: "number",
  }],
  fees: [{
    name: "string",
    amount: "number",
  }],
  lenses: {
    risk_lens_stated: "boolean",
    liquidity_lens_stated: "boolean",
    tax_efficiency_lens_stated: "boolean",
    time_horizon_lens_stated: "boolean",
  },
  costs: {
    fees_and_drag_surfaced: "boolean",
    fees_and_drag_total_stated: "boolean",
  },
  traceability: {
    math_shown: "boolean",
    every_claim_traces_to_a_number: "boolean",
    educational_only_boundary_stated: "boolean",
  },
  red_lines: {
    buy_or_sell_recommendation_present: "boolean",
    personalised_financial_advice_present: "boolean",
    projection_or_scenario_present: "boolean",
    ranked_action_recommendations_present: "boolean",
    claim_without_traced_number_present: "boolean",
  },
};

export const SECTIONS = [
  "snapshot_completeness",
  "balance_sheet_arithmetic",
  "cash_flow_and_fees_arithmetic",
  "lenses_and_costs",
  "traceability_and_advice_boundary",
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
  subject: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  assets_count: number | null;
  computed_asset_total: string | null;
  asset_total_difference: string | null;
  duplicate_asset_names: string[] | null;
  liabilities_count: number | null;
  computed_liability_total: string | null;
  liability_total_difference: string | null;
  duplicate_liability_names: string[] | null;
  net_worth_difference: string | null;
  computed_net_cash_flow: string | null;
  net_cash_flow_difference: string | null;
  fees_count: number | null;
  computed_fees_total: string | null;
  fees_total_difference: string | null;
  duplicate_fee_names: string[] | null;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
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

function duplicates(rows: unknown[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c["name"] === "string") {
      const nm = c["name"] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function rowSum(rows: unknown[]): number | null {
  if (!rows.every((c) => isPyDict(c) && isNumber(c["amount"]))) {
    return null;
  }
  let total = 0;
  for (const c of rows) {
    total += (c as Record<string, unknown>)["amount"] as number;
  }
  return total;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [assetsRaw, hasAssets] = getPath(manifest, "assets");
  const assetsIsList = hasAssets && Array.isArray(assetsRaw);
  const assets: unknown[] = assetsIsList ? (assetsRaw as unknown[]) : [];
  const [liabilitiesRaw, hasLiabilities] = getPath(manifest, "liabilities");
  const liabilitiesIsList = hasLiabilities && Array.isArray(liabilitiesRaw);
  const liabilities: unknown[] = liabilitiesIsList
    ? (liabilitiesRaw as unknown[]) : [];
  const [feesRaw, hasFees] = getPath(manifest, "fees");
  const feesIsList = hasFees && Array.isArray(feesRaw);
  const fees: unknown[] = feesIsList ? (feesRaw as unknown[]) : [];

  const assetsCount: number | null = assetsIsList ? assets.length : null;
  const liabilitiesCount: number | null = liabilitiesIsList
    ? liabilities.length : null;
  const feesCount: number | null = feesIsList ? fees.length : null;

  const duplicateAssetNames: string[] | null = assetsIsList
    ? duplicates(assets) : null;
  const duplicateLiabilityNames: string[] | null = liabilitiesIsList
    ? duplicates(liabilities) : null;
  const duplicateFeeNames: string[] | null = feesIsList
    ? duplicates(fees) : null;

  const computedAssetTotal: number | null = assetsIsList
    ? rowSum(assets) : null;
  const computedLiabilityTotal: number | null = liabilitiesIsList
    ? rowSum(liabilities) : null;
  const computedFeesTotal: number | null = feesIsList ? rowSum(fees) : null;

  const [totalAssets, hasTotalAssets] = getPath(manifest, "figures", "total_assets");
  const [totalLiabilities, hasTotalLiabilities] = getPath(manifest, "figures", "total_liabilities");
  const [netWorth, hasNetWorth] = getPath(manifest, "figures", "net_worth");
  const [periodIncome, hasPeriodIncome] = getPath(manifest, "figures", "period_income");
  const [periodExpenses, hasPeriodExpenses] = getPath(manifest, "figures", "period_expenses");
  const [netCashFlow, hasNetCashFlow] = getPath(manifest, "figures", "net_cash_flow");
  const [feesTotal, hasFeesTotal] = getPath(manifest, "figures", "annual_fees_and_drag_total");

  const assetTotalDifference: number | null =
    hasTotalAssets && isNumber(totalAssets) && computedAssetTotal !== null
      ? (totalAssets as number) - computedAssetTotal : null;
  const liabilityTotalDifference: number | null =
    hasTotalLiabilities && isNumber(totalLiabilities) &&
      computedLiabilityTotal !== null
      ? (totalLiabilities as number) - computedLiabilityTotal : null;
  const netWorthDifference: number | null =
    hasNetWorth && hasTotalAssets && hasTotalLiabilities &&
      isNumber(netWorth) && isNumber(totalAssets) && isNumber(totalLiabilities)
      ? (netWorth as number) -
        ((totalAssets as number) - (totalLiabilities as number))
      : null;
  const computedNetCashFlow: number | null =
    hasPeriodIncome && hasPeriodExpenses && isNumber(periodIncome) &&
      isNumber(periodExpenses)
      ? (periodIncome as number) - (periodExpenses as number) : null;
  const netCashFlowDifference: number | null =
    hasNetCashFlow && isNumber(netCashFlow) && computedNetCashFlow !== null
      ? (netCashFlow as number) - computedNetCashFlow : null;
  const feesTotalDifference: number | null =
    hasFeesTotal && isNumber(feesTotal) && computedFeesTotal !== null
      ? (feesTotal as number) - computedFeesTotal : null;

  // ---- Section 1: snapshot_completeness ----
  boolCheck(results, "snapshot_completeness",
    "as_of_date_stated", manifest,
    ["snapshot", "as_of_date_stated"],
    "snapshot: the as-of date of the snapshot is stated — the snapshot is as it is at a stated point in time");
  boolCheck(results, "snapshot_completeness",
    "currency_stated", manifest,
    ["snapshot", "currency_stated"],
    "snapshot: the currency of the declared figures is stated");
  boolCheck(results, "snapshot_completeness",
    "net_worth_stated", manifest,
    ["snapshot", "net_worth_stated"],
    "snapshot: net worth is stated");
  boolCheck(results, "snapshot_completeness",
    "allocation_stated", manifest,
    ["snapshot", "allocation_stated"],
    "snapshot: allocation — where the assets sit — is stated");
  boolCheck(results, "snapshot_completeness",
    "cash_flow_stated", manifest,
    ["snapshot", "cash_flow_stated"],
    "snapshot: cash flow — where money flows — is stated");
  boolCheck(results, "snapshot_completeness",
    "cash_flow_period_stated", manifest,
    ["snapshot", "cash_flow_period_stated"],
    "snapshot: the period the declared cash flow covers is stated");

  // ---- Section 2: balance_sheet_arithmetic ----
  check(results, "balance_sheet_arithmetic",
    "assets_declared", assetsRaw, assetsIsList,
    assetsIsList && (assetsCount as number) > 0,
    "the declared record names its assets — the assets list is present and non-empty");
  const assetFieldsPresent = assetsIsList &&
    assets.every((c) => hasField(c, "name") && hasField(c, "category") &&
      hasField(c, "amount"));
  check(results, "balance_sheet_arithmetic",
    "every_asset_row_complete", assetsRaw, assetFieldsPresent,
    assetsIsList && (assetsCount as number) > 0 &&
      assets.every((c) => isPyDict(c) &&
        typeof c["name"] === "string" && c["name"] !== "" &&
        typeof c["category"] === "string" && c["category"] !== "" &&
        isNumber(c["amount"])),
    "allocation: every declared asset row carries a name, an allocation category and an amount");
  const assetNamesPresent = assetsIsList &&
    assets.every((c) => hasField(c, "name"));
  check(results, "balance_sheet_arithmetic",
    "no_asset_name_duplicated", assetsRaw, assetNamesPresent,
    assetsIsList && duplicateAssetNames !== null &&
      duplicateAssetNames.length === 0,
    "asset rows: no declared asset name is owned by more than one asset row");
  const assetSumPresent = assetsIsList && computedAssetTotal !== null &&
    hasTotalAssets && isNumber(totalAssets);
  check(results, "balance_sheet_arithmetic",
    "asset_rows_sum_matches_declared_total_assets", assetsRaw,
    assetSumPresent,
    assetSumPresent &&
      fmt6((totalAssets as number) - (computedAssetTotal as number)) === "0.000000",
    "snapshot arithmetic: the declared asset row amounts sum to the declared total assets");
  check(results, "balance_sheet_arithmetic",
    "liabilities_declared", liabilitiesRaw, liabilitiesIsList,
    liabilitiesIsList,
    "the declared record names its liabilities — the liabilities list is present; an empty list is a declared zero, not missing evidence");
  const liabilityFieldsPresent = liabilitiesIsList &&
    liabilities.every((c) => hasField(c, "name") && hasField(c, "amount"));
  check(results, "balance_sheet_arithmetic",
    "every_liability_row_complete", liabilitiesRaw, liabilityFieldsPresent,
    liabilitiesIsList &&
      liabilities.every((c) => isPyDict(c) &&
        typeof c["name"] === "string" && c["name"] !== "" &&
        isNumber(c["amount"])),
    "every declared liability row carries a name and an amount");
  const liabilityNamesPresent = liabilitiesIsList &&
    liabilities.every((c) => hasField(c, "name"));
  check(results, "balance_sheet_arithmetic",
    "no_liability_name_duplicated", liabilitiesRaw, liabilityNamesPresent,
    liabilitiesIsList && duplicateLiabilityNames !== null &&
      duplicateLiabilityNames.length === 0,
    "liability rows: no declared liability name is owned by more than one liability row");
  const liabilitySumPresent = liabilitiesIsList &&
    computedLiabilityTotal !== null && hasTotalLiabilities &&
    isNumber(totalLiabilities);
  check(results, "balance_sheet_arithmetic",
    "liability_rows_sum_matches_declared_total_liabilities", liabilitiesRaw,
    liabilitySumPresent,
    liabilitySumPresent &&
      fmt6((totalLiabilities as number) - (computedLiabilityTotal as number)) === "0.000000",
    "snapshot arithmetic: the declared liability row amounts sum to the declared total liabilities");
  const netWorthPresent = hasTotalAssets && hasTotalLiabilities &&
    hasNetWorth && isNumber(totalAssets) && isNumber(totalLiabilities) &&
    isNumber(netWorth);
  check(results, "balance_sheet_arithmetic",
    "declared_net_worth_matches_assets_minus_liabilities", netWorth,
    netWorthPresent,
    netWorthPresent &&
      fmt6((netWorth as number) -
        ((totalAssets as number) - (totalLiabilities as number))) === "0.000000",
    "snapshot arithmetic: the declared net worth equals the declared total assets minus the declared total liabilities");

  // ---- Section 3: cash_flow_and_fees_arithmetic ----
  const cashFlowPresent = hasPeriodIncome && hasPeriodExpenses &&
    hasNetCashFlow && isNumber(periodIncome) && isNumber(periodExpenses) &&
    isNumber(netCashFlow);
  check(results, "cash_flow_and_fees_arithmetic",
    "declared_net_cash_flow_matches_income_minus_expenses", netCashFlow,
    cashFlowPresent,
    cashFlowPresent &&
      fmt6((netCashFlow as number) -
        ((periodIncome as number) - (periodExpenses as number))) === "0.000000",
    "cash-flow arithmetic: the declared net cash flow equals the declared period income minus the declared period expenses");
  check(results, "cash_flow_and_fees_arithmetic",
    "fees_declared", feesRaw, feesIsList,
    feesIsList,
    "the declared record names its fees — the fees list is present; an empty list is a declared none, not missing evidence");
  const feeFieldsPresent = feesIsList &&
    fees.every((c) => hasField(c, "name") && hasField(c, "amount"));
  check(results, "cash_flow_and_fees_arithmetic",
    "every_fee_row_complete", feesRaw, feeFieldsPresent,
    feesIsList &&
      fees.every((c) => isPyDict(c) &&
        typeof c["name"] === "string" && c["name"] !== "" &&
        isNumber(c["amount"])),
    "every declared fee row carries a name and an amount");
  const feeNamesPresent = feesIsList &&
    fees.every((c) => hasField(c, "name"));
  check(results, "cash_flow_and_fees_arithmetic",
    "no_fee_name_duplicated", feesRaw, feeNamesPresent,
    feesIsList && duplicateFeeNames !== null &&
      duplicateFeeNames.length === 0,
    "fee rows: no declared fee name is owned by more than one fee row");
  const feeSumPresent = feesIsList && computedFeesTotal !== null &&
    hasFeesTotal && isNumber(feesTotal);
  check(results, "cash_flow_and_fees_arithmetic",
    "fee_rows_sum_matches_declared_fees_total", feesRaw, feeSumPresent,
    feeSumPresent &&
      fmt6((feesTotal as number) - (computedFeesTotal as number)) === "0.000000",
    "costs arithmetic: the declared fee row amounts sum to the declared annual fees-and-drag total");

  // ---- Section 4: lenses_and_costs ----
  boolCheck(results, "lenses_and_costs",
    "risk_lens_stated", manifest,
    ["lenses", "risk_lens_stated"],
    "lenses: the risk lens is stated for this snapshot");
  boolCheck(results, "lenses_and_costs",
    "liquidity_lens_stated", manifest,
    ["lenses", "liquidity_lens_stated"],
    "lenses: the liquidity lens is stated for this snapshot");
  boolCheck(results, "lenses_and_costs",
    "tax_efficiency_lens_stated", manifest,
    ["lenses", "tax_efficiency_lens_stated"],
    "lenses: the tax-efficiency lens is stated for this snapshot");
  boolCheck(results, "lenses_and_costs",
    "time_horizon_lens_stated", manifest,
    ["lenses", "time_horizon_lens_stated"],
    "lenses: the time-horizon lens is stated for this snapshot");
  boolCheck(results, "lenses_and_costs",
    "fees_and_drag_surfaced", manifest,
    ["costs", "fees_and_drag_surfaced"],
    "costs: fees and drag are surfaced — costs compound against you, so they are always surfaced");
  boolCheck(results, "lenses_and_costs",
    "fees_and_drag_total_stated", manifest,
    ["costs", "fees_and_drag_total_stated"],
    "costs: a total for fees and drag is stated");

  // ---- Section 5: traceability_and_advice_boundary ----
  boolCheck(results, "traceability_and_advice_boundary",
    "math_shown", manifest,
    ["traceability", "math_shown"],
    "traceability: the math is shown — every figure in the snapshot can be followed to its derivation");
  boolCheck(results, "traceability_and_advice_boundary",
    "every_claim_traces_to_a_number", manifest,
    ["traceability", "every_claim_traces_to_a_number"],
    "traceability: every claim in the snapshot traces to a number");
  boolCheck(results, "traceability_and_advice_boundary",
    "educational_only_boundary_stated", manifest,
    ["traceability", "educational_only_boundary_stated"],
    "boundary: the record states it is educational only — not financial advice");
  falseCheck(results, "traceability_and_advice_boundary",
    "no_buy_or_sell_recommendation", manifest,
    ["red_lines", "buy_or_sell_recommendation_present"],
    "red line: no buy/sell recommendation is present in the snapshot record");
  falseCheck(results, "traceability_and_advice_boundary",
    "no_personalised_financial_advice", manifest,
    ["red_lines", "personalised_financial_advice_present"],
    "red line: no personalised financial advice is present in the snapshot record — educational only");
  falseCheck(results, "traceability_and_advice_boundary",
    "no_projection_or_scenario", manifest,
    ["red_lines", "projection_or_scenario_present"],
    "red line: no projection or scenario is present in the snapshot record — the snapshot is as it is, not a forecast");
  falseCheck(results, "traceability_and_advice_boundary",
    "no_ranked_action_recommendations", manifest,
    ["red_lines", "ranked_action_recommendations_present"],
    "red line: no ranked action recommendations are present in the snapshot record");
  falseCheck(results, "traceability_and_advice_boundary",
    "no_claim_without_traced_number", manifest,
    ["red_lines", "claim_without_traced_number_present"],
    "red line: no claim without a traced number is present in the snapshot record");

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
    verdict = "SNAPSHOT_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SNAPSHOT_SOUND";
  }

  const computedNames = [
    "assets_declared",
    "asset_rows_sum_matches_declared_total_assets",
    "liability_rows_sum_matches_declared_total_liabilities",
    "declared_net_worth_matches_assets_minus_liabilities",
    "declared_net_cash_flow_matches_income_minus_expenses",
    "fee_rows_sum_matches_declared_fees_total",
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
    service: "personal-financial-snapshot",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    assets_count: assetsCount,
    computed_asset_total: fmt6(computedAssetTotal),
    asset_total_difference: fmt6(assetTotalDifference),
    duplicate_asset_names: duplicateAssetNames,
    liabilities_count: liabilitiesCount,
    computed_liability_total: fmt6(computedLiabilityTotal),
    liability_total_difference: fmt6(liabilityTotalDifference),
    duplicate_liability_names: duplicateLiabilityNames,
    net_worth_difference: fmt6(netWorthDifference),
    computed_net_cash_flow: fmt6(computedNetCashFlow),
    net_cash_flow_difference: fmt6(netCashFlowDifference),
    fees_count: feesCount,
    computed_fees_total: fmt6(computedFeesTotal),
    fees_total_difference: fmt6(feesTotalDifference),
    duplicate_fee_names: duplicateFeeNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PERSONAL FINANCIAL SNAPSHOT",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
