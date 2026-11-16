// Portfolio risk analytics report — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/portfolio-risk-analytics-report/src/portfolio_risk_analytics_report.py
// (evaluate() + stamp()). No logic changes: every status, count, gap,
// metric string and summary string is byte-identical to the Python
// output for the same input. Computed floats are rendered by fmt()
// under the shared 6dp serialization rule stated in SERVICE.md.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Counted-invalid exception (documented in SERVICE.md / the core):
// the entries of returns, benchmark_returns, holdings,
// holding_returns, stress_scenarios and decision_journal are
// counted in the report's counts.*_invalid_* tallies and excluded
// when invalid — never verdict-ending — so those lists carry the
// ["any"] entry spec (container type still validated; entries
// intentionally unvalidated). The numeric series inside factors[]
// entries follow the same counted semantics.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  portfolio: "string",
  returns: ["any"],
  benchmark_returns: ["any"],
  periods_per_year: "number",
  risk_free_per_period: "number",
  var_confidence: "number",
  holdings: ["any"],
  factors: [{
    name: "string",
    returns: ["any"],
  }],
  holding_returns: ["any"],
  correlation_window: "number",
  stress_scenarios: ["any"],
  decision_journal: ["any"],
};

export const DISCLAIMER =
  "Educational analytics only — not financial advice. " +
  "The tool calculates; the user decides.";

const PIVOT_EPS = 1e-12;

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

function sumSqDev(values: number[], m: number): number {
  let total = 0.0;
  for (const v of values) {
    const d = v - m;
    total += d * d;
  }
  return total;
}

function crossDev(a: number[], meanA: number, b: number[], meanB: number): number {
  let total = 0.0;
  for (let i = 0; i < a.length; i++) {
    total += (a[i] - meanA) * (b[i] - meanB);
  }
  return total;
}

function pearson(a: number[], b: number[]): number | null {
  const meanA = mean(a);
  const meanB = mean(b);
  const sxx = sumSqDev(a, meanA);
  const syy = sumSqDev(b, meanB);
  if (sxx === 0 || syy === 0) return null;
  const sxy = crossDev(a, meanA, b, meanB);
  return sxy / (Math.sqrt(sxx) * Math.sqrt(syy));
}

function ols(
  returns: number[],
  factorSeries: number[][],
): [number[] | null, boolean] {
  const n = returns.length;
  const k = 1 + factorSeries.length;
  const cols: number[][] = [new Array<number>(n).fill(1.0)];
  for (const series of factorSeries) cols.push([...series]);
  const aug: number[][] = [];
  for (let i = 0; i < k; i++) {
    const row: number[] = [];
    for (let j = 0; j < k; j++) {
      let total = 0.0;
      for (let t = 0; t < n; t++) total += cols[i][t] * cols[j][t];
      row.push(total);
    }
    let rhs = 0.0;
    for (let t = 0; t < n; t++) rhs += cols[i][t] * returns[t];
    row.push(rhs);
    aug.push(row);
  }
  for (let col = 0; col < k; col++) {
    let pivot = col;
    for (let r = col + 1; r < k; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < PIVOT_EPS) return [null, true];
    if (pivot !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivot];
      aug[pivot] = tmp;
    }
    for (let r = col + 1; r < k; r++) {
      const factor = aug[r][col] / aug[col][col];
      for (let j = col; j < k + 1; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  const coefs = new Array<number>(k).fill(0.0);
  for (let i = k - 1; i >= 0; i--) {
    let total = aug[i][k];
    for (let j = i + 1; j < k; j++) total -= aug[i][j] * coefs[j];
    coefs[i] = total / aug[i][i];
  }
  return [coefs, false];
}

export interface Report {
  service: string;
  atom_version: string;
  portfolio: unknown;
  status: string;
  layers: Record<string, string>;
  counts: Record<string, number>;
  gaps: string[];
  risk_metrics: Record<string, unknown> | null;
  benchmark: Record<string, unknown> | null;
  concentration: Record<string, unknown> | null;
  carry: Record<string, unknown> | null;
  factor_decomposition: Record<string, unknown> | null;
  holding_correlations: Record<string, unknown> | null;
  stress_tests: Record<string, unknown>[];
  decision_journal: Record<string, unknown> | null;
  disclaimer: string;
  summary: string;
}

export function evaluate(manifest: unknown): Report {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);

  const gaps: string[] = [];
  const counts: Record<string, number> = {
    periods: 0,
    invalid_return_entries: 0,
    holdings: 0,
    invalid_holdings: 0,
    journal_entries: 0,
    invalid_journal_entries: 0,
    scenarios: 0,
    invalid_scenarios: 0,
    factors: 0,
    holding_series: 0,
    invalid_holding_series: 0,
  };
  const result: Report = {
    service: "portfolio-risk-analytics-report",
    atom_version: "0.1.0",
    portfolio: manifest["portfolio"] ?? null,
    status: "insufficient_evidence",
    layers: {
      holdings: "absent",
      risk_metrics: "absent",
      factor_exposures: "absent",
      concentration: "absent",
      decisions: "absent",
    },
    counts,
    gaps,
    risk_metrics: null,
    benchmark: null,
    concentration: null,
    carry: null,
    factor_decomposition: null,
    holding_correlations: null,
    stress_tests: [],
    decision_journal: null,
    disclaimer: DISCLAIMER,
    summary: "",
  };

  // ---- Raw layer presence (the skill's five layers) ----
  const holdingsRaw = manifest["holdings"];
  const factorsRaw = manifest["factors"];
  const journalRaw = manifest["decision_journal"];
  if (Array.isArray(holdingsRaw) && holdingsRaw.length > 0) {
    result.layers["holdings"] = "present";
  }
  if (Array.isArray(factorsRaw) && factorsRaw.length > 0) {
    result.layers["factor_exposures"] = "present";
    counts["factors"] = factorsRaw.length;
  }
  if (Array.isArray(journalRaw) && journalRaw.length > 0) {
    result.layers["decisions"] = "present";
  }

  // ---- Holdings validity (weights) ----
  const validHoldings: { entry: Record<string, unknown>; weight: number }[] = [];
  if (Array.isArray(holdingsRaw)) {
    for (const entry of holdingsRaw) {
      const weight = isPyDict(entry) ? entry["weight"] : undefined;
      if (isPyDict(entry) && isNum(weight)) {
        validHoldings.push({ entry, weight });
      } else {
        counts["invalid_holdings"] += 1;
      }
    }
  }
  counts["holdings"] = validHoldings.length;
  if (validHoldings.length > 0) {
    result.layers["concentration"] = "present";
  }

  // ---- Returns series: the core input ----
  let [returns, invalidReturns] = validSeries(manifest["returns"]);
  if (returns === null) returns = [];
  counts["periods"] = returns.length;
  counts["invalid_return_entries"] = invalidReturns;
  const n = returns.length;

  if (n < 2) {
    gaps.push(
      "returns: a returns series with at least 2 valid numeric " +
      "observations is required — risk analytics cannot be computed",
    );
    result.summary =
      `Insufficient evidence: returns series has ${n} valid numeric ` +
      "observations (need at least 2) — portfolio risk analytics " +
      "cannot be computed.";
    return result;
  }
  result.layers["risk_metrics"] = "present";

  // ================= Risk metrics =================
  if (invalidReturns) {
    gaps.push(`returns: ${invalidReturns} non-numeric entries excluded`);
  }
  const meanR = mean(returns);
  let wealth = 1.0;
  for (const r of returns) wealth *= 1.0 + r;
  const totalReturn = wealth - 1.0;
  let best = returns[0];
  let worst = returns[0];
  let positive = 0;
  for (const r of returns) {
    if (r > best) best = r;
    if (r < worst) worst = r;
    if (r > 0) positive += 1;
  }
  const ss = sumSqDev(returns, meanR);
  const vol = Math.sqrt(ss / (n - 1));

  // Drawdown path over wealth indices 0..n (index 0 = initial 1.0).
  let maxDd = 0.0;
  let ddPeakIdx = 0;
  let ddTroughIdx = 0;
  let curDd = 0.0;
  let underwater = 0;
  let longestUnderwater = 0;
  let w = 1.0;
  let peak = 1.0;
  let peakIdx = 0;
  for (let t = 0; t < n; t++) {
    w *= 1.0 + returns[t];
    if (w > peak) {
      peak = w;
      peakIdx = t + 1;
    }
    const dd = w / peak - 1.0;
    if (dd < maxDd) {
      maxDd = dd;
      ddPeakIdx = peakIdx;
      ddTroughIdx = t + 1;
    }
    curDd = dd;
    if (dd < 0) {
      underwater += 1;
      if (underwater > longestUnderwater) longestUnderwater = underwater;
    } else {
      underwater = 0;
    }
  }

  // Parameters — blank until submitted; never defaulted.
  const [ppyRaw, hasPpy] = getPath(manifest, "periods_per_year");
  const ppy = isNum(ppyRaw) && ppyRaw > 0 ? ppyRaw : null;
  if (!hasPpy) {
    gaps.push(
      "periods_per_year not submitted — annualized volatility, " +
      "annualized return and annualized Sharpe/Sortino are gaps",
    );
  } else if (ppy === null) {
    gaps.push(
      "periods_per_year is not a positive number — annualized " +
      "metrics are gaps",
    );
  }
  const [rfRaw, hasRf] = getPath(manifest, "risk_free_per_period");
  const rf = isNum(rfRaw) ? rfRaw : null;
  if (!hasRf) {
    gaps.push(
      "risk_free_per_period not submitted — Sharpe, Sortino, " +
      "downside deviation and alpha are gaps",
    );
  } else if (rf === null) {
    gaps.push(
      "risk_free_per_period is not a number — Sharpe, Sortino, " +
      "downside deviation and alpha are gaps",
    );
  }
  const [confRaw, hasConf] = getPath(manifest, "var_confidence");
  const conf = isNum(confRaw) && confRaw > 0 && confRaw < 1 ? confRaw : null;
  if (!hasConf) {
    gaps.push(
      "var_confidence not submitted — historical VaR and CVaR are gaps",
    );
  } else if (conf === null) {
    gaps.push(
      "var_confidence is not strictly between 0 and 1 — " +
      "historical VaR and CVaR are gaps",
    );
  }

  const annVol = ppy !== null ? vol * Math.sqrt(ppy) : null;
  let annReturn: number | null = null;
  if (ppy !== null) {
    if (wealth > 0) {
      annReturn = wealth ** (ppy / n) - 1.0;
    } else {
      gaps.push(
        "cumulative wealth is not positive — geometric " +
        "annualized return is undefined and is a gap",
      );
    }
  }
  let downsideDev: number | null = null;
  let sharpePp: number | null = null;
  let sortinoPp: number | null = null;
  if (rf !== null) {
    let ddTotal = 0.0;
    for (const r of returns) {
      const e = r - rf;
      const m = e < 0 ? e : 0.0;
      ddTotal += m * m;
    }
    downsideDev = Math.sqrt(ddTotal / n);
    if (vol > 0) {
      sharpePp = (meanR - rf) / vol;
    } else {
      gaps.push(
        "volatility is zero — Sharpe ratio is undefined and is a gap",
      );
    }
    if (downsideDev > 0) {
      sortinoPp = (meanR - rf) / downsideDev;
    } else {
      gaps.push(
        "downside deviation is zero — Sortino ratio is undefined " +
        "and is a gap",
      );
    }
  }
  const sharpeAnn =
    sharpePp !== null && ppy !== null ? sharpePp * Math.sqrt(ppy) : null;
  const sortinoAnn =
    sortinoPp !== null && ppy !== null ? sortinoPp * Math.sqrt(ppy) : null;

  let varValue: number | null = null;
  let cvarValue: number | null = null;
  if (conf !== null) {
    const ordered = [...returns].sort((a, b) => a - b);
    let idx = Math.ceil((1.0 - conf) * n) - 1;
    if (idx < 0) idx = 0;
    varValue = -ordered[idx];
    let tail = 0.0;
    for (let i = 0; i < idx + 1; i++) tail += ordered[i];
    cvarValue = -(tail / (idx + 1));
  }

  result.risk_metrics = {
    periods: n,
    mean_return_per_period: fmt(meanR),
    total_return: fmt(totalReturn),
    best_period_return: fmt(best),
    worst_period_return: fmt(worst),
    positive_period_fraction: fmt(positive / n),
    volatility_per_period: fmt(vol),
    annualized_volatility: fmt(annVol),
    annualized_return: fmt(annReturn),
    downside_deviation_per_period: fmt(downsideDev),
    sharpe_per_period: fmt(sharpePp),
    sharpe_annualized: fmt(sharpeAnn),
    sortino_per_period: fmt(sortinoPp),
    sortino_annualized: fmt(sortinoAnn),
    max_drawdown: fmt(maxDd),
    max_drawdown_peak_period: ddPeakIdx - 1,
    max_drawdown_trough_period: ddTroughIdx - 1,
    current_drawdown: fmt(curDd),
    longest_underwater_periods: longestUnderwater,
    var_confidence: fmt(conf),
    historical_var: fmt(varValue),
    historical_cvar: fmt(cvarValue),
  };

  // ================= Benchmark-relative =================
  const [benchRaw, hasBench] = getPath(manifest, "benchmark_returns");
  if (hasBench && benchRaw !== null && benchRaw !== undefined) {
    const benchSection: Record<string, unknown> = {
      aligned: false,
      periods: Array.isArray(benchRaw) ? benchRaw.length : null,
      mean_return_per_period: null,
      volatility_per_period: null,
      total_return: null,
      beta: null,
      correlation: null,
      tracking_error_per_period: null,
      alpha_per_period: null,
    };
    result.benchmark = benchSection;
    const [benchVals, benchInvalid] = validSeries(benchRaw);
    if (benchVals === null) {
      gaps.push(
        "benchmark_returns is not a list — benchmark metrics are gaps",
      );
    } else if (benchInvalid || benchVals.length !== n) {
      gaps.push(
        "benchmark_returns does not align with returns " +
        `(${benchVals.length} valid of ${(benchRaw as unknown[]).length} submitted vs ${n} periods) — ` +
        "benchmark metrics are gaps",
      );
    } else {
      const meanB = mean(benchVals);
      const ssB = sumSqDev(benchVals, meanB);
      const volB = Math.sqrt(ssB / (n - 1));
      let wealthB = 1.0;
      for (const r of benchVals) wealthB *= 1.0 + r;
      const diffs: number[] = [];
      for (let i = 0; i < n; i++) diffs.push(returns[i] - benchVals[i]);
      const meanD = mean(diffs);
      const tracking = Math.sqrt(sumSqDev(diffs, meanD) / (n - 1));
      let beta: number | null = null;
      let correlation: number | null = null;
      if (ssB === 0) {
        gaps.push(
          "benchmark variance is zero — beta and correlation are " +
          "undefined and are gaps",
        );
      } else {
        const sxy = crossDev(returns, meanR, benchVals, meanB);
        beta = sxy / ssB;
        correlation = pearson(returns, benchVals);
      }
      let alpha: number | null = null;
      if (rf !== null && beta !== null) {
        alpha = meanR - rf - beta * (meanB - rf);
      }
      benchSection["aligned"] = true;
      benchSection["mean_return_per_period"] = fmt(meanB);
      benchSection["volatility_per_period"] = fmt(volB);
      benchSection["total_return"] = fmt(wealthB - 1.0);
      benchSection["beta"] = fmt(beta);
      benchSection["correlation"] = fmt(correlation);
      benchSection["tracking_error_per_period"] = fmt(tracking);
      benchSection["alpha_per_period"] = fmt(alpha);
    }
  }

  // ================= Concentration + carry =================
  let shares: number[] | null = null;
  if (
    Array.isArray(holdingsRaw) && holdingsRaw.length > 0 &&
    counts["invalid_holdings"]
  ) {
    gaps.push(
      `holdings: ${counts["invalid_holdings"]} entries without a ` +
      "numeric weight excluded",
    );
  }
  if (validHoldings.length > 0) {
    let weightSum = 0.0;
    for (const h of validHoldings) weightSum += h.weight;
    const conc: Record<string, unknown> = {
      holdings_count: validHoldings.length,
      weight_sum: fmt(weightSum),
      hhi: null,
      effective_holdings: null,
      largest_holding_id: null,
      largest_holding_share: null,
      currency_shares: [],
    };
    result.concentration = conc;
    if (weightSum === 0) {
      gaps.push(
        "holding weights sum to zero — concentration shares are gaps",
      );
    } else {
      shares = validHoldings.map((h) => h.weight / weightSum);
      const sh = shares;
      let hhi = 0.0;
      for (const s of sh) hhi += s * s;
      let largestI = 0;
      for (let i = 0; i < sh.length; i++) {
        if (sh[i] > sh[largestI]) largestI = i;
      }
      const currencyTotals = new Map<string | null, number>();
      const currencyOrder: (string | null)[] = [];
      validHoldings.forEach((h, i) => {
        const cur = h.entry["currency"];
        const key = typeof cur === "string" ? cur : null;
        if (!currencyTotals.has(key)) {
          currencyTotals.set(key, 0.0);
          currencyOrder.push(key);
        }
        currencyTotals.set(key, (currencyTotals.get(key) as number) + sh[i]);
      });
      const rows = currencyOrder.map((key) => ({
        currency: key,
        share: fmt(currencyTotals.get(key) as number),
      }));
      rows.sort((a, b) => {
        const an = a.currency === null ? 0 : 1;
        const bn = b.currency === null ? 0 : 1;
        if (an !== bn) return an - bn;
        const as = a.currency ?? "";
        const bs = b.currency ?? "";
        return as < bs ? -1 : as > bs ? 1 : 0;
      });
      conc["hhi"] = fmt(hhi);
      conc["effective_holdings"] = fmt(1.0 / hhi);
      conc["largest_holding_id"] = strOrNone(
        validHoldings[largestI].entry["id"],
      );
      conc["largest_holding_share"] = fmt(sh[largestI]);
      conc["currency_shares"] = rows;
    }
  }

  const leveraged: { vhIdx: number; entry: Record<string, unknown> }[] = [];
  validHoldings.forEach((h, idx) => {
    if (h.entry["leveraged"] === true) {
      leveraged.push({ vhIdx: idx, entry: h.entry });
    }
  });
  if (leveraged.length > 0) {
    const rows: Record<string, unknown>[] = [];
    let missingCarry = 0;
    let weightedNum = 0.0;
    let weightedDen = 0.0;
    let anyNegative = false;
    let allHave = true;
    for (const { vhIdx, entry } of leveraged) {
      const income = entry["income_per_period"];
      const financing = entry["financing_per_period"];
      if (isNum(income) && isNum(financing)) {
        const net = income - financing;
        const negative = net < 0;
        if (negative) anyNegative = true;
        if (shares !== null) {
          weightedNum += shares[vhIdx] * net;
          weightedDen += shares[vhIdx];
        }
        rows.push({
          id: strOrNone(entry["id"]),
          income_per_period: fmt(income),
          financing_per_period: fmt(financing),
          net_carry_per_period: fmt(net),
          negative_carry: negative,
        });
      } else {
        missingCarry += 1;
        allHave = false;
        rows.push({
          id: strOrNone(entry["id"]),
          income_per_period: fmt(isNum(income) ? income : null),
          financing_per_period: fmt(isNum(financing) ? financing : null),
          net_carry_per_period: null,
          negative_carry: null,
        });
      }
    }
    if (missingCarry) {
      gaps.push(
        `carry: ${missingCarry} leveraged holdings missing ` +
        "income_per_period or financing_per_period — net carry is " +
        "a gap for those holdings",
      );
    }
    let weighted: number | null = null;
    if (allHave && weightedDen !== 0) weighted = weightedNum / weightedDen;
    result.carry = {
      leveraged_holdings: leveraged.length,
      rows,
      weighted_net_carry_per_period: fmt(weighted),
      any_negative_carry: anyNegative,
    };
  }

  // ================= Factor decomposition (OLS) =================
  if (Array.isArray(factorsRaw) && factorsRaw.length > 0) {
    const names: (string | null)[] = [];
    const seriesList: (number[] | null)[] = [];
    let factorsOk = true;
    for (const entry of factorsRaw) {
      if (!isPyDict(entry) || typeof entry["name"] !== "string") {
        factorsOk = false;
        names.push(null);
        seriesList.push(null);
        continue;
      }
      const [vals, inv] = validSeries(entry["returns"]);
      names.push(entry["name"]);
      if (vals === null || inv || vals.length !== n) {
        factorsOk = false;
        seriesList.push(null);
      } else {
        seriesList.push(vals);
      }
    }
    const decomp: Record<string, unknown> = {
      computable: false,
      observations: n,
      intercept_alpha_per_period: null,
      coefficients: names.map((name) => ({
        factor: name,
        coefficient: null as string | null,
      })),
      r_squared: null,
      residual_volatility_per_period: null,
    };
    result.factor_decomposition = decomp;
    if (!factorsOk) {
      gaps.push(
        "factors: every factor needs a name and a returns series " +
        `aligned to the ${n} portfolio periods — factor ` +
        "decomposition is a gap",
      );
    } else {
      const validSeriesList = seriesList as number[][];
      const [coefs, singular] = ols(returns, validSeriesList);
      if (singular || coefs === null) {
        gaps.push(
          "factors: factor series are collinear (singular normal " +
          "equations) — factor decomposition is a gap",
        );
      } else {
        let ssRes = 0.0;
        for (let t = 0; t < n; t++) {
          let yhat = coefs[0];
          for (let f = 0; f < validSeriesList.length; f++) {
            yhat += coefs[f + 1] * validSeriesList[f][t];
          }
          const e = returns[t] - yhat;
          ssRes += e * e;
        }
        let rSquared: number | null = null;
        if (ss > 0) {
          rSquared = 1.0 - ssRes / ss;
        } else {
          gaps.push(
            "factors: portfolio returns have zero variance — " +
            "R-squared is undefined and is a gap",
          );
        }
        let residVol: number | null = null;
        const dof = n - (1 + validSeriesList.length);
        if (dof > 0) {
          residVol = Math.sqrt(ssRes / dof);
        } else {
          gaps.push(
            "factors: no residual degrees of freedom — residual " +
            "volatility is a gap",
          );
        }
        decomp["computable"] = true;
        decomp["intercept_alpha_per_period"] = fmt(coefs[0]);
        decomp["coefficients"] = names.map((name, f) => ({
          factor: name,
          coefficient: fmt(coefs[f + 1]),
        }));
        decomp["r_squared"] = fmt(rSquared);
        decomp["residual_volatility_per_period"] = fmt(residVol);
      }
    }
  }

  // ================= Holding correlations =================
  const [hrRaw, hasHr] = getPath(manifest, "holding_returns");
  if (hasHr && hrRaw !== null && hrRaw !== undefined) {
    if (!Array.isArray(hrRaw)) {
      gaps.push(
        "holding_returns is not a list — holding correlations are gaps",
      );
    } else if (hrRaw.length > 0) {
      const included: { id: string | null; values: number[] }[] = [];
      let invalidHr = 0;
      for (const entry of hrRaw) {
        if (!isPyDict(entry)) {
          invalidHr += 1;
          continue;
        }
        const [vals, inv] = validSeries(entry["returns"]);
        if (vals === null || inv || vals.length !== n) {
          invalidHr += 1;
          continue;
        }
        included.push({ id: strOrNone(entry["id"]), values: vals });
      }
      counts["holding_series"] = included.length;
      counts["invalid_holding_series"] = invalidHr;
      if (invalidHr) {
        gaps.push(
          `holding_returns: ${invalidHr} series not aligned to ` +
          `the ${n} portfolio periods excluded`,
        );
      }

      const pairsFor = (
        series: { id: string | null; values: number[] }[],
        start: number,
      ): [Record<string, unknown>[], boolean] => {
        const out: Record<string, unknown>[] = [];
        let anyUndefined = false;
        for (let i = 0; i < series.length; i++) {
          for (let j = i + 1; j < series.length; j++) {
            const corr = pearson(
              series[i].values.slice(start),
              series[j].values.slice(start),
            );
            if (corr === null) anyUndefined = true;
            out.push({
              a: series[i].id,
              b: series[j].id,
              correlation: fmt(corr),
            });
          }
        }
        return [out, anyUndefined];
      };

      const [pairs, undefined] = pairsFor(included, 0);
      if (undefined) {
        gaps.push(
          "holding correlations: at least one pair is undefined " +
          "(a constant holding series has zero variance)",
        );
      }
      let maxPair: Record<string, unknown> | null = null;
      let maxVal: number | null = null;
      for (let i = 0; i < included.length; i++) {
        for (let j = i + 1; j < included.length; j++) {
          const corr = pearson(included[i].values, included[j].values);
          if (corr !== null && (maxVal === null || corr > maxVal)) {
            maxVal = corr;
            maxPair = {
              a: included[i].id,
              b: included[j].id,
              correlation: fmt(corr),
            };
          }
        }
      }
      const [windowRaw, hasWindow] = getPath(manifest, "correlation_window");
      let window: number | null = null;
      let windowPairs: Record<string, unknown>[] | null = null;
      if (hasWindow) {
        if (
          typeof windowRaw === "number" && Number.isInteger(windowRaw) &&
          windowRaw >= 2 && windowRaw <= n
        ) {
          window = windowRaw;
          const [wp, wUndefined] = pairsFor(included, n - window);
          windowPairs = wp;
          if (wUndefined) {
            gaps.push(
              "holding correlations (window): at least one pair " +
              "is undefined (a constant holding series has zero " +
              "variance)",
            );
          }
        } else {
          gaps.push(
            "correlation_window is not an integer between 2 and " +
            `${n} — window correlations are gaps`,
          );
        }
      }
      result.holding_correlations = {
        series_count: included.length,
        pairs,
        max_pair: maxPair,
        window,
        window_pairs: windowPairs,
      };
    }
  }

  // ================= Stress tests =================
  const [scenRaw, hasScen] = getPath(manifest, "stress_scenarios");
  if (hasScen && scenRaw !== null && scenRaw !== undefined) {
    if (!Array.isArray(scenRaw)) {
      gaps.push(
        "stress_scenarios is not a list — stress tests are gaps",
      );
    } else {
      const stress: Record<string, unknown>[] = [];
      scenRaw.forEach((entry, pos) => {
        if (!isPyDict(entry)) {
          counts["invalid_scenarios"] += 1;
          return;
        }
        counts["scenarios"] += 1;
        const row: Record<string, unknown> = {
          name: strOrNone(entry["name"]),
          scenario_return: null,
          basis: "not_computable",
        };
        const pr = entry["portfolio_return"];
        const shocks = entry["shocks"];
        if (isNum(pr)) {
          row["scenario_return"] = fmt(pr);
          row["basis"] = "portfolio_return";
        } else if (Array.isArray(shocks)) {
          const shockById = new Map<string, unknown>();
          for (const shock of shocks) {
            if (
              isPyDict(shock) && typeof shock["holding_id"] === "string" &&
              !shockById.has(shock["holding_id"])
            ) {
              shockById.set(shock["holding_id"], shock["return"]);
            }
          }
          if (shares === null) {
            gaps.push(
              `stress scenario ${pos}: holding shocks need valid ` +
              "holding weights summing to a non-zero total — " +
              "scenario return is a gap",
            );
          } else {
            const sh = shares;
            let total = 0.0;
            let computable = true;
            for (let i = 0; i < validHoldings.length; i++) {
              const hid = validHoldings[i].entry["id"];
              if (
                typeof hid !== "string" || !shockById.has(hid) ||
                !isNum(shockById.get(hid))
              ) {
                computable = false;
                break;
              }
              total += sh[i] * (shockById.get(hid) as number);
            }
            if (computable) {
              row["scenario_return"] = fmt(total);
              row["basis"] = "holding_shocks";
            } else {
              gaps.push(
                `stress scenario ${pos}: a shock is missing or ` +
                "non-numeric for at least one holding — scenario " +
                "return is a gap",
              );
            }
          }
        } else {
          gaps.push(
            `stress scenario ${pos}: neither a numeric ` +
            "portfolio_return nor holding shocks submitted — " +
            "scenario return is a gap",
          );
        }
        stress.push(row);
      });
      if (counts["invalid_scenarios"]) {
        gaps.push(
          `stress_scenarios: ${counts["invalid_scenarios"]} ` +
          "non-object entries excluded",
        );
      }
      result.stress_tests = stress;
    }
  }

  // ================= Decision journal =================
  if (Array.isArray(journalRaw) && journalRaw.length > 0) {
    const validJournal: { conf: number; correct: boolean }[] = [];
    for (const entry of journalRaw) {
      const conf = isPyDict(entry) ? entry["confidence"] : undefined;
      const correct = isPyDict(entry) ? entry["correct"] : undefined;
      if (isNum(conf) && conf >= 0 && conf <= 1 &&
          typeof correct === "boolean") {
        validJournal.push({ conf, correct });
      } else {
        counts["invalid_journal_entries"] += 1;
      }
    }
    counts["journal_entries"] = validJournal.length;
    if (counts["invalid_journal_entries"]) {
      gaps.push(
        `decision_journal: ${counts["invalid_journal_entries"]} ` +
        "entries without a confidence in [0, 1] and a boolean " +
        "correct flag excluded",
      );
    }
    const journalSection: Record<string, unknown> = {
      entries: validJournal.length,
      mean_confidence: null,
      hit_rate: null,
      calibration_gap: null,
      brier_score: null,
    };
    result.decision_journal = journalSection;
    if (validJournal.length > 0) {
      let confTotal = 0.0;
      let hits = 0;
      let brierTotal = 0.0;
      for (const { conf, correct } of validJournal) {
        confTotal += conf;
        const outcome = correct ? 1.0 : 0.0;
        if (correct) hits += 1;
        const d = conf - outcome;
        brierTotal += d * d;
      }
      const meanConf = confTotal / validJournal.length;
      const hitRate = hits / validJournal.length;
      journalSection["mean_confidence"] = fmt(meanConf);
      journalSection["hit_rate"] = fmt(hitRate);
      journalSection["calibration_gap"] = fmt(hitRate - meanConf);
      journalSection["brier_score"] = fmt(brierTotal / validJournal.length);
    }
  } else if (journalRaw !== null && journalRaw !== undefined &&
             !Array.isArray(journalRaw)) {
    gaps.push(
      "decision_journal is not a list — journal calibration is a gap",
    );
  }

  result.status = gaps.length === 0 ? "complete" : "partial";
  result.summary =
    `Risk analytics over ${n} periods: total return ` +
    `${fmt(totalReturn)}, volatility per period ${fmt(vol)}, ` +
    `max drawdown ${fmt(maxDd)}; ${gaps.length} gaps.`;
  return result;
}

export function stamp(verdict: Report): string {
  const lines: string[] = [
    "PORTFOLIO RISK ANALYTICS REPORT",
    `portfolio: ${pyStr(verdict.portfolio ?? null)}`,
    `STATUS: ${verdict.status}`,
    verdict.summary,
    verdict.disclaimer,
  ];
  return lines.join("\n");
}
