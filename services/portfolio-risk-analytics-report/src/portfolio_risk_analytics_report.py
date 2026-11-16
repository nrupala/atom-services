#!/usr/bin/env python3
"""Portfolio risk analytics report — deterministic core.

Built from the bound skill `pae` (Personal Analytics Engine, v1):
institutional-grade personal financial analytics — risk metrics,
factor decomposition, stress tests, decision journaling. The skill's
own ruling governs this core: "The tool calculates; the user
decides." "Calculate, don't counsel. Numbers in, numbers out,
interpretation belongs to the user." No recommendations, no output
labeled optimal or recommended — this core computes descriptive
analytics over a submitted manifest and nothing else.

The caller submits one portfolio manifest: a periodic returns series
plus optional benchmark returns, holdings, factor return series,
per-holding return series, stress scenarios and a decision journal.
Every quantity below is a deterministic function of that manifest:

- Returns analytics: mean, total return, best/worst period, positive
  fraction, sample volatility, drawdown path (maximum drawdown with
  peak/trough periods, current drawdown, longest time underwater),
  historical VaR / CVaR at the submitted confidence (nearest-rank),
  and — only when the caller submits the parameters — annualized
  figures (periods_per_year), Sharpe and Sortino (risk_free_per_period
  is the excess target). The skill rules that "all parameters start
  blank or neutral — no defaults that imply advice", so NO parameter
  is defaulted anywhere: a metric whose parameter was not submitted
  is a labeled gap (null), never silently filled in.
- Benchmark-relative: beta, correlation, tracking error and Jensen
  alpha over an aligned benchmark series.
- Concentration: weight sum, Herfindahl index and effective holdings
  over submitted holding weights, largest holding, currency shares.
- Carry: for leveraged holdings, net carry (income minus financing)
  per holding; a negative net carry is flagged plainly (the skill:
  "If carry is negative, say so plainly").
- Factor decomposition: OLS of portfolio returns on the submitted
  factor series (intercept plus one coefficient per factor, in
  submission order), R-squared and residual volatility, by the normal
  equations with partial-pivot Gaussian elimination.
- Holding correlations: pairwise Pearson correlations over submitted
  per-holding series, plus the last-window matrix when a
  correlation_window is submitted (the skill: rolling windows, not
  point estimates — the submitted window is the caller's window).
- Stress tests: each submitted scenario is applied to the current
  allocation — either a submitted portfolio-level return, or
  per-holding shocks weighted by current shares.
- Decision journal calibration: mean confidence vs hit rate,
  calibration gap and Brier score (the skill: "whether 70%-confident
  calls were right 70% of the time").

Missing data is a labeled gap, never silently interpolated (the
skill's rule). Monte Carlo is NOT computed: the skill asks for
1K-100K simulated paths, and no seed, path count or simulation
parameter is defaulted here — a simulated distribution would not be
a deterministic function of the manifest.

Serialization rule (stated in SERVICE.md, identical in the TS port):
every computed floating quantity is rendered as a STRING with exactly
six decimal places, rounded half away from zero on the binary double
(scaled = floor(abs(x)*10^6 + 0.5); zero renders "0.000000", never
"-0.000000"). Counts, period indices and ranks stay integers. All
internal arithmetic is IEEE-754 double arithmetic in a fixed loop
order, using only +, -, *, / and sqrt (plus one pow for geometric
annualization), so the Python oracle and the TypeScript port produce
byte-identical output for the same manifest.

Status vocabulary (computed deliverable):
- returns series present with at least 2 valid numeric observations
  and no gaps of any kind                    -> complete
- analytics computed but some metric/layer is a labeled gap
  (missing parameter, invalid entries, misaligned series, singular
  factors, uncomputable scenario, ...)       -> partial
- no returns series, or fewer than 2 valid numeric observations
                                             -> insufficient_evidence

No model call, no network, no clock dependence: the same manifest
always produces the same report. That determinism is the product.
"""
import json
import math
import sys

DISCLAIMER = ("Educational analytics only — not financial advice. "
              "The tool calculates; the user decides.")

_PIVOT_EPS = 1e-12

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Counted-invalid exception (documented in SERVICE.md / the core):
# the entries of returns, benchmark_returns, holdings,
# holding_returns, stress_scenarios and decision_journal are
# counted in the report's counts.*_invalid_* tallies and excluded
# when invalid — never verdict-ending — so those lists carry the
# ["any"] entry spec (container type still validated; entries
# intentionally unvalidated). The numeric series inside factors[]
# entries follow the same _valid_series counted semantics.
MANIFEST_SPEC = {
    "portfolio": "string",
    "returns": ["any"],
    "benchmark_returns": ["any"],
    "periods_per_year": "number",
    "risk_free_per_period": "number",
    "var_confidence": "number",
    "holdings": ["any"],
    "factors": [{
        "name": "string",
        "returns": ["any"],
    }],
    "holding_returns": ["any"],
    "correlation_window": "number",
    "stress_scenarios": ["any"],
    "decision_journal": ["any"],
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _is_num(value):
    return isinstance(value, (int, float)) \
        and not isinstance(value, bool) and math.isfinite(value)


def _fmt(x):
    """Render a computed float per the shared 6dp serialization rule."""
    if x is None:
        return None
    if x == 0:
        return "0.000000"
    sign = "-" if x < 0 else ""
    scaled = math.floor(abs(x) * 1000000 + 0.5)
    if scaled == 0:
        return "0.000000"
    ip, fp = divmod(scaled, 1000000)
    return f"{sign}{ip}.{fp:06d}"


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _str_or_none(value):
    return value if isinstance(value, str) else None


def _valid_series(raw):
    """(values, invalid_count) for a submitted list, else (None, 0)."""
    if not isinstance(raw, list):
        return None, 0
    values = []
    invalid = 0
    for item in raw:
        if _is_num(item):
            values.append(float(item))
        else:
            invalid += 1
    return values, invalid


def _mean(values):
    total = 0.0
    for v in values:
        total += v
    return total / len(values)


def _sum_sq_dev(values, mean):
    total = 0.0
    for v in values:
        d = v - mean
        total += d * d
    return total


def _cross_dev(a, mean_a, b, mean_b):
    total = 0.0
    for i in range(len(a)):
        total += (a[i] - mean_a) * (b[i] - mean_b)
    return total


def _pearson(a, b):
    """Pearson correlation from raw deviation sums, or None."""
    mean_a = _mean(a)
    mean_b = _mean(b)
    sxx = _sum_sq_dev(a, mean_a)
    syy = _sum_sq_dev(b, mean_b)
    if sxx == 0 or syy == 0:
        return None
    sxy = _cross_dev(a, mean_a, b, mean_b)
    return sxy / (math.sqrt(sxx) * math.sqrt(syy))


def _ols(returns, factor_series):
    """OLS via normal equations + partial-pivot Gaussian elimination.

    Returns (coefficients, singular) where coefficients is
    [intercept, per-factor...] or None when singular.
    """
    n = len(returns)
    k = 1 + len(factor_series)
    # Design columns: column 0 is the intercept (all ones).
    cols = [[1.0] * n]
    for series in factor_series:
        cols.append(list(series))
    aug = []
    for i in range(k):
        row = []
        for j in range(k):
            total = 0.0
            for t in range(n):
                total += cols[i][t] * cols[j][t]
            row.append(total)
        rhs = 0.0
        for t in range(n):
            rhs += cols[i][t] * returns[t]
        row.append(rhs)
        aug.append(row)
    for col in range(k):
        pivot = col
        for r in range(col + 1, k):
            if abs(aug[r][col]) > abs(aug[pivot][col]):
                pivot = r
        if abs(aug[pivot][col]) < _PIVOT_EPS:
            return None, True
        if pivot != col:
            aug[col], aug[pivot] = aug[pivot], aug[col]
        for r in range(col + 1, k):
            factor = aug[r][col] / aug[col][col]
            for j in range(col, k + 1):
                aug[r][j] -= factor * aug[col][j]
    coefs = [0.0] * k
    for i in range(k - 1, -1, -1):
        total = aug[i][k]
        for j in range(i + 1, k):
            total -= aug[i][j] * coefs[j]
        coefs[i] = total / aug[i][i]
    return coefs, False


def evaluate(manifest):
    """Return the risk-analytics report dict for a portfolio manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)

    gaps = []
    counts = {
        "periods": 0,
        "invalid_return_entries": 0,
        "holdings": 0,
        "invalid_holdings": 0,
        "journal_entries": 0,
        "invalid_journal_entries": 0,
        "scenarios": 0,
        "invalid_scenarios": 0,
        "factors": 0,
        "holding_series": 0,
        "invalid_holding_series": 0,
    }
    result = {
        "service": "portfolio-risk-analytics-report",
        "atom_version": "0.1.0",
        "portfolio": manifest.get("portfolio"),
        "status": "insufficient_evidence",
        "layers": {
            "holdings": "absent",
            "risk_metrics": "absent",
            "factor_exposures": "absent",
            "concentration": "absent",
            "decisions": "absent",
        },
        "counts": counts,
        "gaps": gaps,
        "risk_metrics": None,
        "benchmark": None,
        "concentration": None,
        "carry": None,
        "factor_decomposition": None,
        "holding_correlations": None,
        "stress_tests": [],
        "decision_journal": None,
        "disclaimer": DISCLAIMER,
        "summary": "",
    }

    # ---- Raw layer presence (the skill's five layers) ----
    holdings_raw = manifest.get("holdings")
    factors_raw = manifest.get("factors")
    journal_raw = manifest.get("decision_journal")
    if isinstance(holdings_raw, list) and holdings_raw:
        result["layers"]["holdings"] = "present"
    if isinstance(factors_raw, list) and factors_raw:
        result["layers"]["factor_exposures"] = "present"
        counts["factors"] = len(factors_raw)
    if isinstance(journal_raw, list) and journal_raw:
        result["layers"]["decisions"] = "present"

    # ---- Holdings validity (weights) — needed by several sections ----
    valid_holdings = []  # (entry, weight float) in submission order
    if isinstance(holdings_raw, list):
        for entry in holdings_raw:
            weight = entry.get("weight") if isinstance(entry, dict) \
                else None
            if isinstance(entry, dict) and _is_num(weight):
                valid_holdings.append((entry, float(weight)))
            else:
                counts["invalid_holdings"] += 1
    counts["holdings"] = len(valid_holdings)
    if valid_holdings:
        result["layers"]["concentration"] = "present"

    # ---- Returns series: the core input ----
    returns, invalid_returns = _valid_series(manifest.get("returns"))
    if returns is None:
        returns = []
    counts["periods"] = len(returns)
    counts["invalid_return_entries"] = invalid_returns
    n = len(returns)

    if n < 2:
        gaps.append(
            "returns: a returns series with at least 2 valid numeric "
            "observations is required — risk analytics cannot be "
            "computed")
        result["summary"] = (
            f"Insufficient evidence: returns series has {n} valid "
            "numeric observations (need at least 2) — portfolio risk "
            "analytics cannot be computed.")
        return result
    result["layers"]["risk_metrics"] = "present"

    # ================= Risk metrics =================
    if invalid_returns:
        gaps.append(
            f"returns: {invalid_returns} non-numeric entries excluded")
    mean_r = _mean(returns)
    wealth = 1.0
    for r in returns:
        wealth *= 1.0 + r
    total_return = wealth - 1.0
    best = returns[0]
    worst = returns[0]
    positive = 0
    for r in returns:
        if r > best:
            best = r
        if r < worst:
            worst = r
        if r > 0:
            positive += 1
    ss = _sum_sq_dev(returns, mean_r)
    vol = math.sqrt(ss / (n - 1))

    # Drawdown path over wealth indices 0..n (index 0 = initial 1.0).
    max_dd = 0.0
    dd_peak_idx = 0
    dd_trough_idx = 0
    cur_dd = 0.0
    underwater = 0
    longest_underwater = 0
    w = 1.0
    peak = 1.0
    peak_idx = 0
    for t in range(n):
        w *= 1.0 + returns[t]
        if w > peak:
            peak = w
            peak_idx = t + 1
        dd = w / peak - 1.0
        if dd < max_dd:
            max_dd = dd
            dd_peak_idx = peak_idx
            dd_trough_idx = t + 1
        cur_dd = dd
        if dd < 0:
            underwater += 1
            if underwater > longest_underwater:
                longest_underwater = underwater
        else:
            underwater = 0

    # Parameters — blank until submitted; never defaulted.
    ppy_raw, has_ppy = _get(manifest, "periods_per_year")
    ppy = float(ppy_raw) if _is_num(ppy_raw) and ppy_raw > 0 else None
    if not has_ppy:
        gaps.append(
            "periods_per_year not submitted — annualized volatility, "
            "annualized return and annualized Sharpe/Sortino are gaps")
    elif ppy is None:
        gaps.append(
            "periods_per_year is not a positive number — annualized "
            "metrics are gaps")
    rf_raw, has_rf = _get(manifest, "risk_free_per_period")
    rf = float(rf_raw) if _is_num(rf_raw) else None
    if not has_rf:
        gaps.append(
            "risk_free_per_period not submitted — Sharpe, Sortino, "
            "downside deviation and alpha are gaps")
    elif rf is None:
        gaps.append(
            "risk_free_per_period is not a number — Sharpe, Sortino, "
            "downside deviation and alpha are gaps")
    conf_raw, has_conf = _get(manifest, "var_confidence")
    conf = float(conf_raw) if _is_num(conf_raw) and 0 < conf_raw < 1 \
        else None
    if not has_conf:
        gaps.append(
            "var_confidence not submitted — historical VaR and CVaR "
            "are gaps")
    elif conf is None:
        gaps.append(
            "var_confidence is not strictly between 0 and 1 — "
            "historical VaR and CVaR are gaps")

    ann_vol = vol * math.sqrt(ppy) if ppy is not None else None
    ann_return = None
    if ppy is not None:
        if wealth > 0:
            ann_return = wealth ** (ppy / n) - 1.0
        else:
            gaps.append(
                "cumulative wealth is not positive — geometric "
                "annualized return is undefined and is a gap")
    downside_dev = None
    sharpe_pp = None
    sortino_pp = None
    if rf is not None:
        dd_total = 0.0
        for r in returns:
            e = r - rf
            m = e if e < 0 else 0.0
            dd_total += m * m
        downside_dev = math.sqrt(dd_total / n)
        if vol > 0:
            sharpe_pp = (mean_r - rf) / vol
        else:
            gaps.append(
                "volatility is zero — Sharpe ratio is undefined and "
                "is a gap")
        if downside_dev > 0:
            sortino_pp = (mean_r - rf) / downside_dev
        else:
            gaps.append(
                "downside deviation is zero — Sortino ratio is "
                "undefined and is a gap")
    sharpe_ann = sharpe_pp * math.sqrt(ppy) \
        if sharpe_pp is not None and ppy is not None else None
    sortino_ann = sortino_pp * math.sqrt(ppy) \
        if sortino_pp is not None and ppy is not None else None

    var_value = None
    cvar_value = None
    if conf is not None:
        ordered = sorted(returns)
        idx = math.ceil((1.0 - conf) * n) - 1
        if idx < 0:
            idx = 0
        var_value = -ordered[idx]
        tail = 0.0
        for i in range(idx + 1):
            tail += ordered[i]
        cvar_value = -(tail / (idx + 1))

    result["risk_metrics"] = {
        "periods": n,
        "mean_return_per_period": _fmt(mean_r),
        "total_return": _fmt(total_return),
        "best_period_return": _fmt(best),
        "worst_period_return": _fmt(worst),
        "positive_period_fraction": _fmt(positive / n),
        "volatility_per_period": _fmt(vol),
        "annualized_volatility": _fmt(ann_vol),
        "annualized_return": _fmt(ann_return),
        "downside_deviation_per_period": _fmt(downside_dev),
        "sharpe_per_period": _fmt(sharpe_pp),
        "sharpe_annualized": _fmt(sharpe_ann),
        "sortino_per_period": _fmt(sortino_pp),
        "sortino_annualized": _fmt(sortino_ann),
        "max_drawdown": _fmt(max_dd),
        "max_drawdown_peak_period": dd_peak_idx - 1,
        "max_drawdown_trough_period": dd_trough_idx - 1,
        "current_drawdown": _fmt(cur_dd),
        "longest_underwater_periods": longest_underwater,
        "var_confidence": _fmt(conf),
        "historical_var": _fmt(var_value),
        "historical_cvar": _fmt(cvar_value),
    }

    # ================= Benchmark-relative =================
    bench_raw, has_bench = _get(manifest, "benchmark_returns")
    if has_bench and bench_raw is not None:
        bench_section = {
            "aligned": False,
            "periods": len(bench_raw) if isinstance(bench_raw, list)
                       else None,
            "mean_return_per_period": None,
            "volatility_per_period": None,
            "total_return": None,
            "beta": None,
            "correlation": None,
            "tracking_error_per_period": None,
            "alpha_per_period": None,
        }
        result["benchmark"] = bench_section
        bench_vals, bench_invalid = _valid_series(bench_raw)
        if bench_vals is None:
            gaps.append(
                "benchmark_returns is not a list — benchmark metrics "
                "are gaps")
        elif bench_invalid or len(bench_vals) != n:
            gaps.append(
                "benchmark_returns does not align with returns "
                f"({len(bench_vals)} valid of "
                f"{len(bench_raw)} submitted vs {n} periods) — "
                "benchmark metrics are gaps")
        else:
            mean_b = _mean(bench_vals)
            ss_b = _sum_sq_dev(bench_vals, mean_b)
            vol_b = math.sqrt(ss_b / (n - 1))
            wealth_b = 1.0
            for r in bench_vals:
                wealth_b *= 1.0 + r
            diffs = []
            for i in range(n):
                diffs.append(returns[i] - bench_vals[i])
            mean_d = _mean(diffs)
            tracking = math.sqrt(_sum_sq_dev(diffs, mean_d) / (n - 1))
            beta = None
            correlation = None
            if ss_b == 0:
                gaps.append(
                    "benchmark variance is zero — beta and "
                    "correlation are undefined and are gaps")
            else:
                sxy = _cross_dev(returns, mean_r, bench_vals, mean_b)
                beta = sxy / ss_b
                correlation = _pearson(returns, bench_vals)
            alpha = None
            if rf is not None and beta is not None:
                alpha = mean_r - rf - beta * (mean_b - rf)
            bench_section.update({
                "aligned": True,
                "mean_return_per_period": _fmt(mean_b),
                "volatility_per_period": _fmt(vol_b),
                "total_return": _fmt(wealth_b - 1.0),
                "beta": _fmt(beta),
                "correlation": _fmt(correlation),
                "tracking_error_per_period": _fmt(tracking),
                "alpha_per_period": _fmt(alpha),
            })

    # ================= Concentration + carry =================
    shares = None
    weight_sum = None
    if isinstance(holdings_raw, list) and holdings_raw \
            and counts["invalid_holdings"]:
        gaps.append(
            f"holdings: {counts['invalid_holdings']} entries without "
            "a numeric weight excluded")
    if valid_holdings:
        weight_sum = 0.0
        for _entry, wgt in valid_holdings:
            weight_sum += wgt
        conc = {
            "holdings_count": len(valid_holdings),
            "weight_sum": _fmt(weight_sum),
            "hhi": None,
            "effective_holdings": None,
            "largest_holding_id": None,
            "largest_holding_share": None,
            "currency_shares": [],
        }
        result["concentration"] = conc
        if weight_sum == 0:
            gaps.append(
                "holding weights sum to zero — concentration shares "
                "are gaps")
        else:
            shares = []
            for _entry, wgt in valid_holdings:
                shares.append(wgt / weight_sum)
            hhi = 0.0
            for s in shares:
                hhi += s * s
            largest_i = 0
            for i in range(len(shares)):
                if shares[i] > shares[largest_i]:
                    largest_i = i
            currency_totals = {}
            currency_order = []
            for (entry, _wgt), s in zip(valid_holdings, shares):
                cur = entry.get("currency")
                key = cur if isinstance(cur, str) else None
                if key not in currency_totals:
                    currency_totals[key] = 0.0
                    currency_order.append(key)
                currency_totals[key] += s
            rows = []
            for key in currency_order:
                rows.append({"currency": key,
                             "share": _fmt(currency_totals[key])})
            rows.sort(key=lambda row: (row["currency"] is not None,
                                       row["currency"] or ""))
            conc.update({
                "hhi": _fmt(hhi),
                "effective_holdings": _fmt(1.0 / hhi),
                "largest_holding_id": _str_or_none(
                    valid_holdings[largest_i][0].get("id")),
                "largest_holding_share": _fmt(shares[largest_i]),
                "currency_shares": rows,
            })

    leveraged = [(idx, entry) for idx, (entry, _wgt)
                 in enumerate(valid_holdings)
                 if entry.get("leveraged") is True]
    if leveraged:
        rows = []
        missing_carry = 0
        weighted_num = 0.0
        weighted_den = 0.0
        any_negative = False
        all_have = True
        for vh_idx, entry in leveraged:
            income = entry.get("income_per_period")
            financing = entry.get("financing_per_period")
            if _is_num(income) and _is_num(financing):
                net = float(income) - float(financing)
                negative = net < 0
                if negative:
                    any_negative = True
                if shares is not None:
                    weighted_num += shares[vh_idx] * net
                    weighted_den += shares[vh_idx]
                rows.append({
                    "id": _str_or_none(entry.get("id")),
                    "income_per_period": _fmt(float(income)),
                    "financing_per_period": _fmt(float(financing)),
                    "net_carry_per_period": _fmt(net),
                    "negative_carry": negative,
                })
            else:
                missing_carry += 1
                all_have = False
                rows.append({
                    "id": _str_or_none(entry.get("id")),
                    "income_per_period": _fmt(
                        float(income) if _is_num(income) else None),
                    "financing_per_period": _fmt(
                        float(financing) if _is_num(financing)
                        else None),
                    "net_carry_per_period": None,
                    "negative_carry": None,
                })
        if missing_carry:
            gaps.append(
                f"carry: {missing_carry} leveraged holdings missing "
                "income_per_period or financing_per_period — net "
                "carry is a gap for those holdings")
        weighted = None
        if all_have and weighted_den != 0:
            weighted = weighted_num / weighted_den
        result["carry"] = {
            "leveraged_holdings": len(leveraged),
            "rows": rows,
            "weighted_net_carry_per_period": _fmt(weighted),
            "any_negative_carry": any_negative,
        }

    # ================= Factor decomposition (OLS) =================
    if isinstance(factors_raw, list) and factors_raw:
        names = []
        series_list = []
        factors_ok = True
        for entry in factors_raw:
            if not isinstance(entry, dict) \
                    or not isinstance(entry.get("name"), str):
                factors_ok = False
                names.append(None)
                series_list.append(None)
                continue
            vals, inv = _valid_series(entry.get("returns"))
            names.append(entry.get("name"))
            if vals is None or inv or len(vals) != n:
                factors_ok = False
                series_list.append(None)
            else:
                series_list.append(vals)
        decomp = {
            "computable": False,
            "observations": n,
            "intercept_alpha_per_period": None,
            "coefficients": [
                {"factor": name, "coefficient": None} for name in names
            ],
            "r_squared": None,
            "residual_volatility_per_period": None,
        }
        result["factor_decomposition"] = decomp
        if not factors_ok:
            gaps.append(
                "factors: every factor needs a name and a returns "
                f"series aligned to the {n} portfolio periods — "
                "factor decomposition is a gap")
        else:
            coefs, singular = _ols(returns, series_list)
            if singular:
                gaps.append(
                    "factors: factor series are collinear (singular "
                    "normal equations) — factor decomposition is a "
                    "gap")
            else:
                fitted_ss_res = 0.0
                for t in range(n):
                    yhat = coefs[0]
                    for f in range(len(series_list)):
                        yhat += coefs[f + 1] * series_list[f][t]
                    e = returns[t] - yhat
                    fitted_ss_res += e * e
                r_squared = None
                if ss > 0:
                    r_squared = 1.0 - fitted_ss_res / ss
                else:
                    gaps.append(
                        "factors: portfolio returns have zero "
                        "variance — R-squared is undefined and is a "
                        "gap")
                resid_vol = None
                dof = n - (1 + len(series_list))
                if dof > 0:
                    resid_vol = math.sqrt(fitted_ss_res / dof)
                else:
                    gaps.append(
                        "factors: no residual degrees of freedom — "
                        "residual volatility is a gap")
                decomp.update({
                    "computable": True,
                    "intercept_alpha_per_period": _fmt(coefs[0]),
                    "coefficients": [
                        {"factor": names[f],
                         "coefficient": _fmt(coefs[f + 1])}
                        for f in range(len(series_list))
                    ],
                    "r_squared": _fmt(r_squared),
                    "residual_volatility_per_period": _fmt(resid_vol),
                })

    # ================= Holding correlations =================
    hr_raw, has_hr = _get(manifest, "holding_returns")
    if has_hr and hr_raw is not None:
        if not isinstance(hr_raw, list):
            gaps.append(
                "holding_returns is not a list — holding correlations "
                "are gaps")
        elif hr_raw:
            included = []  # (id, values)
            invalid_hr = 0
            for entry in hr_raw:
                if not isinstance(entry, dict):
                    invalid_hr += 1
                    continue
                vals, inv = _valid_series(entry.get("returns"))
                if vals is None or inv or len(vals) != n:
                    invalid_hr += 1
                    continue
                included.append((_str_or_none(entry.get("id")), vals))
            counts["holding_series"] = len(included)
            counts["invalid_holding_series"] = invalid_hr
            if invalid_hr:
                gaps.append(
                    f"holding_returns: {invalid_hr} series not "
                    f"aligned to the {n} portfolio periods excluded")

            def _pairs(series, start):
                out = []
                any_undefined = False
                for i in range(len(series)):
                    for j in range(i + 1, len(series)):
                        window_a = series[i][1][start:]
                        window_b = series[j][1][start:]
                        corr = _pearson(window_a, window_b)
                        if corr is None:
                            any_undefined = True
                        out.append({
                            "a": series[i][0],
                            "b": series[j][0],
                            "correlation": _fmt(corr),
                        })
                return out, any_undefined

            pairs, undefined = _pairs(included, 0)
            if undefined:
                gaps.append(
                    "holding correlations: at least one pair is "
                    "undefined (a constant holding series has zero "
                    "variance)")
            max_pair = None
            max_val = None
            for (a_id, a_vals), (b_id, b_vals) in [
                    (included[i], included[j])
                    for i in range(len(included))
                    for j in range(i + 1, len(included))]:
                corr = _pearson(a_vals, b_vals)
                if corr is not None and (max_val is None
                                         or corr > max_val):
                    max_val = corr
                    max_pair = {"a": a_id, "b": b_id,
                                "correlation": _fmt(corr)}
            window_raw, has_window = _get(manifest,
                                          "correlation_window")
            window = None
            window_pairs = None
            if has_window:
                if isinstance(window_raw, int) \
                        and not isinstance(window_raw, bool) \
                        and 2 <= window_raw <= n:
                    window = window_raw
                    wp, w_undefined = _pairs(included, n - window)
                    window_pairs = wp
                    if w_undefined:
                        gaps.append(
                            "holding correlations (window): at least "
                            "one pair is undefined (a constant "
                            "holding series has zero variance)")
                else:
                    gaps.append(
                        "correlation_window is not an integer "
                        f"between 2 and {n} — window correlations "
                        "are gaps")
            result["holding_correlations"] = {
                "series_count": len(included),
                "pairs": pairs,
                "max_pair": max_pair,
                "window": window,
                "window_pairs": window_pairs,
            }

    # ================= Stress tests =================
    scen_raw, has_scen = _get(manifest, "stress_scenarios")
    if has_scen and scen_raw is not None:
        if not isinstance(scen_raw, list):
            gaps.append(
                "stress_scenarios is not a list — stress tests are "
                "gaps")
        else:
            stress = []
            for pos, entry in enumerate(scen_raw):
                if not isinstance(entry, dict):
                    counts["invalid_scenarios"] += 1
                    continue
                counts["scenarios"] += 1
                name = _str_or_none(entry.get("name"))
                row = {"name": name, "scenario_return": None,
                       "basis": "not_computable"}
                pr = entry.get("portfolio_return")
                shocks = entry.get("shocks")
                if _is_num(pr):
                    row["scenario_return"] = _fmt(float(pr))
                    row["basis"] = "portfolio_return"
                elif isinstance(shocks, list):
                    shock_by_id = {}
                    for shock in shocks:
                        if isinstance(shock, dict) \
                                and isinstance(
                                    shock.get("holding_id"), str) \
                                and shock.get("holding_id") \
                                not in shock_by_id:
                            shock_by_id[shock.get("holding_id")] = \
                                shock.get("return")
                    if shares is None:
                        gaps.append(
                            f"stress scenario {pos}: holding shocks "
                            "need valid holding weights summing to a "
                            "non-zero total — scenario return is a "
                            "gap")
                    else:
                        total = 0.0
                        computable = True
                        for (h_entry, _wgt), s in zip(
                                valid_holdings, shares):
                            hid = h_entry.get("id")
                            if not isinstance(hid, str) \
                                    or hid not in shock_by_id \
                                    or not _is_num(
                                        shock_by_id[hid]):
                                computable = False
                                break
                            total += s * float(shock_by_id[hid])
                        if computable:
                            row["scenario_return"] = _fmt(total)
                            row["basis"] = "holding_shocks"
                        else:
                            gaps.append(
                                f"stress scenario {pos}: a shock "
                                "is missing or non-numeric for at "
                                "least one holding — scenario return "
                                "is a gap")
                else:
                    gaps.append(
                        f"stress scenario {pos}: neither a numeric "
                        "portfolio_return nor holding shocks "
                        "submitted — scenario return is a gap")
                stress.append(row)
            if counts["invalid_scenarios"]:
                gaps.append(
                    f"stress_scenarios: "
                    f"{counts['invalid_scenarios']} non-object "
                    "entries excluded")
            result["stress_tests"] = stress

    # ================= Decision journal =================
    if isinstance(journal_raw, list) and journal_raw:
        valid_journal = []
        for entry in journal_raw:
            if isinstance(entry, dict) \
                    and _is_num(entry.get("confidence")) \
                    and 0 <= entry.get("confidence") <= 1 \
                    and isinstance(entry.get("correct"), bool):
                valid_journal.append(
                    (float(entry.get("confidence")),
                     entry.get("correct")))
            else:
                counts["invalid_journal_entries"] += 1
        counts["journal_entries"] = len(valid_journal)
        if counts["invalid_journal_entries"]:
            gaps.append(
                f"decision_journal: "
                f"{counts['invalid_journal_entries']} entries "
                "without a confidence in [0, 1] and a boolean "
                "correct flag excluded")
        journal_section = {
            "entries": len(valid_journal),
            "mean_confidence": None,
            "hit_rate": None,
            "calibration_gap": None,
            "brier_score": None,
        }
        result["decision_journal"] = journal_section
        if valid_journal:
            conf_total = 0.0
            hits = 0
            brier_total = 0.0
            for conf, correct in valid_journal:
                conf_total += conf
                outcome = 1.0 if correct else 0.0
                if correct:
                    hits += 1
                d = conf - outcome
                brier_total += d * d
            mean_conf = conf_total / len(valid_journal)
            hit_rate = hits / len(valid_journal)
            journal_section.update({
                "mean_confidence": _fmt(mean_conf),
                "hit_rate": _fmt(hit_rate),
                "calibration_gap": _fmt(hit_rate - mean_conf),
                "brier_score": _fmt(brier_total / len(valid_journal)),
            })
    elif journal_raw is not None and not isinstance(journal_raw, list):
        gaps.append(
            "decision_journal is not a list — journal calibration "
            "is a gap")

    result["status"] = "complete" if not gaps else "partial"
    result["summary"] = (
        f"Risk analytics over {n} periods: total return "
        f"{_fmt(total_return)}, volatility per period {_fmt(vol)}, "
        f"max drawdown {_fmt(max_dd)}; "
        f"{len(gaps)} gaps.")
    return result


def stamp(verdict):
    """Human-readable stamp of a risk-analytics report dict."""
    lines = [
        "PORTFOLIO RISK ANALYTICS REPORT",
        f"portfolio: {verdict.get('portfolio')}",
        f"STATUS: {verdict['status']}",
        verdict["summary"],
        verdict["disclaimer"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: portfolio_risk_analytics_report.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["status"] == "complete" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
