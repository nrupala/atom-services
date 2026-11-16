// Reconciled portfolio performance report — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/reconciled-portfolio-performance-report/src/reconciled_portfolio_performance_report.py
// (evaluate() + stamp()). No logic changes: every status, count, gap,
// metric string and summary string is byte-identical to the Python
// output for the same input. Computed floats are rendered by fmt()
// under the shared 6dp serialization rule stated in SERVICE.md.

import { pyStr } from "./release-readiness.js";
import {
  FieldTypeError,
  validateManifest,
  type FieldSpec,
} from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any computation runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  portfolio: "string",
  beginning_value: "number",
  benchmark_name: "string",
};

// List fields are validated as CONTAINERS ONLY, exactly as in the
// Python oracle: their entries are documented counted gaps, not
// caller errors (non-numeric period_end_values entries are counted
// in counts.invalid_value_entries, the other series pass through
// the same validSeries counting, holdings entries without a
// numeric quantity and price are counted in counts.invalid_holdings,
// and transactions entries without a valid kind and amount are
// counted in counts.invalid_transactions). Only the list type
// itself is checked here.
const LIST_FIELDS = [
  "period_end_values",
  "external_flows",
  "benchmark_returns",
  "declared_returns",
  "holdings",
  "transactions",
] as const;

function validateReconciledManifest(
  manifest: Record<string, unknown>,
): void {
  validateManifest(manifest, MANIFEST_SPEC);
  for (const field of LIST_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(manifest, field) &&
      !Array.isArray(manifest[field])
    ) {
      throw new FieldTypeError(field, `${field} must be a list`);
    }
  }
}

export const DISCLAIMER =
  "Educational reporting only — not financial advice. " +
  "The tool calculates; the user decides.";

const IRR_LO = -0.999999;
const IRR_HI_STEPS = 20;
const IRR_BISECTION_STEPS = 200;

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  obj: unknown,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function strOrNone(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Render a computed float per the shared 6dp serialization rule. */
export function fmt(x: number | null): string | null {
  if (x === null) return null;
  if (x === 0) return "0.000000";
  const sign = x < 0 ? "-" : "";
  const scaled = Math.floor(Math.abs(x) * 1000000 + 0.5);
  if (scaled === 0) return "0.000000";
  const ip = Math.floor(scaled / 1000000);
  const fp = scaled - ip * 1000000;
  return `${sign}${ip}.${String(fp).padStart(6, "0")}`;
}

function validSeries(raw: unknown): [number[] | null, number] {
  if (!Array.isArray(raw)) return [null, 0];
  const values: number[] = [];
  let invalid = 0;
  for (const item of raw) {
    if (isNum(item)) values.push(item);
    else invalid += 1;
  }
  return [values, invalid];
}

function mean(values: number[]): number {
  let total = 0.0;
  for (const v of values) total += v;
  return total / values.length;
}

function powInt(base: number, exp: number): number {
  let result = 1.0;
  for (let i = 0; i < exp; i++) result *= base;
  return result;
}

function irrResidual(
  beginning: number,
  flows: number[],
  final: number,
  rate: number,
): number {
  const n = flows.length;
  const p = 1.0 + rate;
  let total = beginning * powInt(p, n);
  for (let i = 0; i < n; i++) total += flows[i] * powInt(p, n - i);
  return total - final;
}

function signChange(a: number, b: number): boolean {
  return (a < 0 && b > 0) || (a > 0 && b < 0);
}

function solveIrr(
  beginning: number,
  flows: number[],
  final: number,
): number | null {
  if (beginning === 0) {
    let allZero = true;
    for (const f of flows) if (f !== 0) allZero = false;
    if (allZero) return null;
  }
  const lo = IRR_LO;
  let flo = irrResidual(beginning, flows, final, lo);
  if (flo === 0) return lo;
  let hi = 1.0;
  let fhi = irrResidual(beginning, flows, final, hi);
  let steps = 0;
  while (fhi !== 0 && !signChange(flo, fhi) && steps < IRR_HI_STEPS) {
    hi = (hi + 1.0) * 2.0 - 1.0;
    fhi = irrResidual(beginning, flows, final, hi);
    steps += 1;
  }
  if (fhi === 0) return hi;
  if (!signChange(flo, fhi)) return null;
  let loVar = lo;
  let hiVar = hi;
  for (let s = 0; s < IRR_BISECTION_STEPS; s++) {
    const mid = (loVar + hiVar) / 2.0;
    const fm = irrResidual(beginning, flows, final, mid);
    if (fm === 0) return mid;
    if (signChange(flo, fm)) {
      hiVar = mid;
    } else {
      loVar = mid;
      flo = fm;
    }
  }
  return (loVar + hiVar) / 2.0;
}

export interface Report {
  service: string;
  atom_version: string;
  portfolio: unknown;
  status: string;
  layers: Record<string, string>;
  counts: Record<string, number>;
  gaps: string[];
  performance: Record<string, unknown> | null;
  benchmark: Record<string, unknown> | null;
  reconciliation: Record<string, unknown> | null;
  holdings: Record<string, unknown> | null;
  disclaimer: string;
  summary: string;
}

export function evaluate(manifest: unknown): Report {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateReconciledManifest(manifest);

  const gaps: string[] = [];
  const counts: Record<string, number> = {
    periods: 0,
    invalid_value_entries: 0,
    invalid_flow_entries: 0,
    holdings: 0,
    invalid_holdings: 0,
    transactions: 0,
    invalid_transactions: 0,
  };
  const result: Report = {
    service: "reconciled-portfolio-performance-report",
    atom_version: "0.1.0",
    portfolio: manifest["portfolio"] ?? null,
    status: "insufficient_evidence",
    layers: {
      values: "absent",
      performance: "absent",
      reconciliation: "absent",
      benchmark: "absent",
      holdings: "absent",
    },
    counts,
    gaps,
    performance: null,
    benchmark: null,
    reconciliation: null,
    holdings: null,
    disclaimer: DISCLAIMER,
    summary: "",
  };

  // ---- Raw layer presence ----
  const [beginningRaw] = getPath(manifest, "beginning_value");
  const beginning = isNum(beginningRaw) ? beginningRaw : null;
  const valuesRaw = manifest["period_end_values"];
  const holdingsRaw = manifest["holdings"];
  const transactionsRaw = manifest["transactions"];
  const [benchRaw, hasBench] = getPath(manifest, "benchmark_returns");
  const [declaredRaw, hasDeclared] = getPath(manifest, "declared_returns");
  if (
    beginning !== null && Array.isArray(valuesRaw) && valuesRaw.length > 0
  ) {
    result.layers["values"] = "present";
  }
  // F2 (external verification Wave 1): a ledger field that is
  // PRESENT — even as an explicitly empty list — is declared
  // evidence, not absence. Presence is list-typedness, never
  // non-emptiness: holdings: [] is a zero-total ledger and
  // transactions: [] is a zero-net ledger, and both make their
  // layers present exactly as a non-empty list does. Only a
  // field that was not submitted at all is absent.
  if (Array.isArray(holdingsRaw)) {
    result.layers["holdings"] = "present";
  }
  if (
    Array.isArray(transactionsRaw) ||
    Array.isArray(holdingsRaw) ||
    (hasDeclared && declaredRaw !== null && declaredRaw !== undefined)
  ) {
    result.layers["reconciliation"] = "present";
  }
  if (Array.isArray(benchRaw) && benchRaw.length > 0) {
    result.layers["benchmark"] = "present";
  }

  // ---- Holdings validity (quantity x price) ----
  const validHoldings: {
    entry: Record<string, unknown>;
    quantity: number;
    price: number;
  }[] = [];
  if (Array.isArray(holdingsRaw)) {
    for (const entry of holdingsRaw) {
      const qty = isPyDict(entry) ? entry["quantity"] : undefined;
      const price = isPyDict(entry) ? entry["price"] : undefined;
      if (isPyDict(entry) && isNum(qty) && isNum(price)) {
        validHoldings.push({ entry, quantity: qty, price });
      } else {
        counts["invalid_holdings"] += 1;
      }
    }
  }
  counts["holdings"] = validHoldings.length;

  // ---- Transactions validity (contribution / withdrawal) ----
  const validTransactions: { kind: string; amount: number }[] = [];
  if (Array.isArray(transactionsRaw)) {
    for (const entry of transactionsRaw) {
      const kind = isPyDict(entry) ? entry["kind"] : undefined;
      const amount = isPyDict(entry) ? entry["amount"] : undefined;
      if (
        isPyDict(entry) &&
        (kind === "contribution" || kind === "withdrawal") &&
        isNum(amount) && amount >= 0
      ) {
        validTransactions.push({ kind, amount });
      } else {
        counts["invalid_transactions"] += 1;
      }
    }
  }
  counts["transactions"] = validTransactions.length;

  // ---- Values series: the core input ----
  let [values, invalidValues] = validSeries(valuesRaw);
  if (values === null) values = [];
  counts["periods"] = values.length;
  counts["invalid_value_entries"] = invalidValues;
  const n = values.length;

  if (beginning === null || n < 2) {
    if (beginning === null) {
      gaps.push(
        "beginning_value: a numeric beginning value is " +
        "required — reconciled performance cannot be computed",
      );
    }
    if (n < 2) {
      gaps.push(
        "period_end_values: a series with at least 2 valid " +
        "numeric period-end values is required — reconciled " +
        "performance cannot be computed",
      );
    }
    result.summary =
      "Insufficient evidence: " +
      `beginning value ${beginning !== null ? "present" : "missing"}, ` +
      `period-end values series has ${n} valid numeric ` +
      "observations (need a numeric beginning value and at " +
      "least 2) — reconciled portfolio performance cannot be " +
      "computed.";
    return result;
  }
  result.layers["performance"] = "present";

  const finalValue = values[n - 1];

  // ================= Performance =================
  if (invalidValues) {
    gaps.push(
      `period_end_values: ${invalidValues} non-numeric entries excluded`,
    );
  }
  const perf: Record<string, unknown> = {
    periods: n,
    beginning_value: fmt(beginning),
    final_value: fmt(finalValue),
    value_change: fmt(finalValue - beginning),
    net_external_flows: null,
    total_gain_after_flows: null,
    period_returns: null,
    time_weighted_return: null,
    money_weighted_return_per_period: null,
    mean_period_return: null,
    twr_irr_difference: null,
    methods: ["time_weighted_return", "money_weighted_return_per_period"],
  };
  result.performance = perf;

  const [flowsRaw, hasFlows] = getPath(manifest, "external_flows");
  let flows: number[] | null = null;
  if (!hasFlows || flowsRaw === null || flowsRaw === undefined) {
    gaps.push(
      "external_flows not submitted — period returns cannot " +
      "be separated from cash-flow timing, so time-weighted " +
      "and money-weighted returns are gaps (never mixed, " +
      "never defaulted)",
    );
  } else {
    const [flowVals, flowInvalid] = validSeries(flowsRaw);
    counts["invalid_flow_entries"] = flowInvalid;
    if (flowVals === null) {
      gaps.push(
        "external_flows is not a list — time-weighted and " +
        "money-weighted returns are gaps",
      );
    } else if (flowInvalid || flowVals.length !== n) {
      gaps.push(
        "external_flows does not align with period_end_values " +
        `(${flowVals.length} valid of ${(flowsRaw as unknown[]).length} submitted vs ${n} periods) — ` +
        "time-weighted and money-weighted returns are gaps",
      );
    } else {
      flows = flowVals;
    }
  }

  let periodReturns: number[] | null = null;
  let twr: number | null = null;
  let irr: number | null = null;
  if (flows !== null) {
    const fl = flows;
    let netFlows = 0.0;
    for (const f of fl) netFlows += f;
    perf["net_external_flows"] = fmt(netFlows);
    perf["total_gain_after_flows"] = fmt(finalValue - beginning - netFlows);
    const returns: number[] = [];
    let badBasePeriod: number | null = null;
    for (let i = 0; i < n; i++) {
      const base = (i === 0 ? beginning : values[i - 1]) + fl[i];
      if (base <= 0) {
        badBasePeriod = i;
        break;
      }
      returns.push(values[i] / base - 1.0);
    }
    if (badBasePeriod !== null) {
      gaps.push(
        `period ${badBasePeriod}: previous value plus its ` +
        "beginning-of-period flow is not positive — the period " +
        "return path, time-weighted return and money-weighted " +
        "return are gaps",
      );
    } else {
      periodReturns = returns;
      let wealth = 1.0;
      for (const r of returns) wealth *= 1.0 + r;
      twr = wealth - 1.0;
      irr = solveIrr(beginning, fl, finalValue);
      if (irr === null) {
        gaps.push(
          "money-weighted return: no sign-changing bracket " +
          "found in the searched range (-0.999999 to 1048575) — " +
          "the money-weighted return per period is a gap",
        );
      }
      perf["period_returns"] = returns.map((r) => fmt(r));
      perf["time_weighted_return"] = fmt(twr);
      perf["money_weighted_return_per_period"] = fmt(irr);
      perf["mean_period_return"] = fmt(mean(returns));
      if (irr !== null) perf["twr_irr_difference"] = fmt(twr - irr);
    }
  }

  // ================= Benchmark comparison =================
  if (hasBench && benchRaw !== null && benchRaw !== undefined) {
    const benchSection: Record<string, unknown> = {
      name: strOrNone(manifest["benchmark_name"]),
      aligned: false,
      periods: Array.isArray(benchRaw) ? benchRaw.length : null,
      total_return: null,
      mean_return_per_period: null,
      excess_total_return: null,
      periods_portfolio_ahead: null,
    };
    result.benchmark = benchSection;
    const [benchVals, benchInvalid] = validSeries(benchRaw);
    if (benchVals === null) {
      gaps.push(
        "benchmark_returns is not a list — benchmark comparison is a gap",
      );
    } else if (benchInvalid || benchVals.length !== n) {
      gaps.push(
        "benchmark_returns does not align with period_end_values " +
        `(${benchVals.length} valid of ${(benchRaw as unknown[]).length} submitted vs ${n} periods) — ` +
        "benchmark comparison is a gap",
      );
    } else {
      let wealthB = 1.0;
      for (const r of benchVals) wealthB *= 1.0 + r;
      const benchTotal = wealthB - 1.0;
      let ahead: number | null = null;
      if (periodReturns !== null) {
        ahead = 0;
        for (let i = 0; i < n; i++) {
          if (periodReturns[i] > benchVals[i]) ahead += 1;
        }
      }
      benchSection["aligned"] = true;
      benchSection["total_return"] = fmt(benchTotal);
      benchSection["mean_return_per_period"] = fmt(mean(benchVals));
      benchSection["excess_total_return"] =
        fmt(twr !== null ? twr - benchTotal : null);
      benchSection["periods_portfolio_ahead"] = ahead;
    }
  }

  // ================= Holdings ledger =================
  let holdingsTotal: number | null = null;
  if (
    Array.isArray(holdingsRaw) && holdingsRaw.length > 0 &&
    counts["invalid_holdings"]
  ) {
    gaps.push(
      `holdings: ${counts["invalid_holdings"]} entries without a ` +
      "numeric quantity and price excluded",
    );
  }
  if (validHoldings.length > 0) {
    holdingsTotal = 0.0;
    const holdingValues: number[] = [];
    for (const h of validHoldings) {
      const value = h.quantity * h.price;
      holdingValues.push(value);
      holdingsTotal += value;
    }
    const ht = holdingsTotal;
    const rows: Record<string, unknown>[] = [];
    let largestI = 0;
    for (let i = 0; i < validHoldings.length; i++) {
      if (holdingValues[i] > holdingValues[largestI]) largestI = i;
      rows.push({
        id: strOrNone(validHoldings[i].entry["id"]),
        quantity: fmt(validHoldings[i].quantity),
        price: fmt(validHoldings[i].price),
        value: fmt(holdingValues[i]),
        share_of_holdings: fmt(ht !== 0 ? holdingValues[i] / ht : null),
      });
    }
    if (ht === 0) {
      gaps.push(
        "holdings: holding values sum to zero — holding shares are gaps",
      );
    }
    result.holdings = {
      holdings_count: validHoldings.length,
      total_value: fmt(ht),
      rows,
      largest_holding_id: strOrNone(validHoldings[largestI].entry["id"]),
      largest_holding_share: fmt(
        ht !== 0 ? holdingValues[largestI] / ht : null,
      ),
    };
  } else if (Array.isArray(holdingsRaw)) {
    // F2: a declared holdings ledger with no valid entries —
    // including the explicitly empty list — is a zero-total
    // ledger: the holdings section prints with total 0 and the
    // holdings-vs-declared-value leg below computes over it,
    // instead of the ledger passing in silence as absent.
    holdingsTotal = 0.0;
    result.holdings = {
      holdings_count: 0,
      total_value: fmt(holdingsTotal),
      rows: [],
      largest_holding_id: null,
      largest_holding_share: null,
    };
  }

  // ================= Reconciliation =================
  if (result.layers["reconciliation"] === "present" || flows !== null) {
    const flowsLeg: Record<string, unknown> = {
      declared_net_external_flows: null,
      ledger_contributions: null,
      ledger_withdrawals: null,
      ledger_net_external_flows: null,
      difference: null,
    };
    const holdingsLeg: Record<string, unknown> = {
      holdings_total_value: fmt(holdingsTotal),
      final_declared_value: fmt(finalValue),
      difference: null,
      difference_fraction_of_final: null,
    };
    const recon: Record<string, unknown> = {
      flows_vs_ledger: flowsLeg,
      holdings_vs_declared_value: holdingsLeg,
      declared_vs_computed_returns: null,
    };
    result.reconciliation = recon;
    // Leg 1: declared flows vs ledger transactions.
    if (flows !== null) {
      let netFlows = 0.0;
      for (const f of flows) netFlows += f;
      flowsLeg["declared_net_external_flows"] = fmt(netFlows);
    }
    if (Array.isArray(transactionsRaw)) {
      if (counts["invalid_transactions"]) {
        gaps.push(
          `transactions: ${counts["invalid_transactions"]} entries ` +
          "without a contribution/withdrawal kind, a numeric " +
          "amount and a non-negative amount excluded",
        );
      }
      // F2 audit: the same absent-vs-empty conflation was
      // present here — the leg computed only when at least
      // one valid transaction existed, so a declared empty
      // ledger read as no ledger at all. A submitted list
      // always has a computable net over its valid entries
      // (zero when there are none), so the leg computes
      // whenever the field is present as a list.
      {
        let contributions = 0.0;
        let withdrawals = 0.0;
        for (const t of validTransactions) {
          if (t.kind === "contribution") contributions += t.amount;
          else withdrawals += t.amount;
        }
        const ledgerNet = contributions - withdrawals;
        flowsLeg["ledger_contributions"] = fmt(contributions);
        flowsLeg["ledger_withdrawals"] = fmt(withdrawals);
        flowsLeg["ledger_net_external_flows"] = fmt(ledgerNet);
        if (flows !== null) {
          let netFlows = 0.0;
          for (const f of flows) netFlows += f;
          flowsLeg["difference"] = fmt(netFlows - ledgerNet);
        }
      }
    } else if (transactionsRaw !== null && transactionsRaw !== undefined) {
      gaps.push(
        "transactions is not a list — the flows-vs-ledger " +
        "reconciliation leg is a gap",
      );
    }
    // Leg 2: holdings vs declared final value.
    if (holdingsTotal !== null) {
      const difference = holdingsTotal - finalValue;
      holdingsLeg["difference"] = fmt(difference);
      if (finalValue !== 0) {
        holdingsLeg["difference_fraction_of_final"] =
          fmt(difference / finalValue);
      } else {
        gaps.push(
          "holdings reconciliation: final declared value is " +
          "zero — the difference fraction is a gap",
        );
      }
    }
    // Leg 3: declared returns vs computed returns.
    if (hasDeclared && declaredRaw !== null && declaredRaw !== undefined) {
      const declaredSection: Record<string, unknown> = {
        aligned: false,
        compared_periods: 0,
        differences: null,
        max_abs_difference: null,
        mismatched_periods: null,
      };
      recon["declared_vs_computed_returns"] = declaredSection;
      const [declVals, declInvalid] = validSeries(declaredRaw);
      if (declVals === null) {
        gaps.push(
          "declared_returns is not a list — the " +
          "declared-vs-computed returns reconciliation leg is a gap",
        );
      } else if (declInvalid || declVals.length !== n) {
        gaps.push(
          "declared_returns does not align with period_end_values " +
          `(${declVals.length} valid of ${(declaredRaw as unknown[]).length} submitted vs ${n} periods) — ` +
          "the declared-vs-computed returns reconciliation leg " +
          "is a gap",
        );
      } else if (periodReturns === null) {
        gaps.push(
          "declared_returns cannot be reconciled — computed " +
          "period returns are gaps",
        );
      } else {
        const pr = periodReturns;
        const differences: number[] = [];
        let maxAbs = 0.0;
        let mismatched = 0;
        for (let i = 0; i < n; i++) {
          const d = pr[i] - declVals[i];
          differences.push(d);
          if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d);
          if (fmt(d) !== "0.000000") mismatched += 1;
        }
        declaredSection["aligned"] = true;
        declaredSection["compared_periods"] = n;
        declaredSection["differences"] = differences.map((d) => fmt(d));
        declaredSection["max_abs_difference"] = fmt(maxAbs);
        declaredSection["mismatched_periods"] = mismatched;
      }
    }
  }

  result.status = gaps.length === 0 ? "complete" : "partial";
  if (twr !== null) {
    const irrText = irr !== null ? fmt(irr) : "gap";
    result.summary =
      `Reconciled performance over ${n} periods: time-weighted ` +
      `return ${fmt(twr)}, money-weighted return per period ` +
      `${irrText}, final value ${fmt(finalValue)}; ` +
      `${gaps.length} gaps.`;
  } else {
    result.summary =
      `Performance over ${n} periods: beginning value ` +
      `${fmt(beginning)}, final value ${fmt(finalValue)}; ` +
      "time-weighted and money-weighted returns are gaps; " +
      `${gaps.length} gaps.`;
  }
  return result;
}

export function stamp(verdict: Report): string {
  const lines: string[] = [
    "RECONCILED PORTFOLIO PERFORMANCE REPORT",
    `portfolio: ${pyStr(verdict.portfolio ?? null)}`,
    `STATUS: ${verdict.status}`,
    verdict.summary,
    verdict.disclaimer,
  ];
  return lines.join("\n");
}
