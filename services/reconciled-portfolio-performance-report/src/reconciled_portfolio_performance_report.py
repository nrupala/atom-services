#!/usr/bin/env python3
"""Reconciled portfolio performance report — deterministic core.

Built from the bound skill `portfolio-tracking` (v1): track and
attribute honestly — one ledger of truth, proper return math,
benchmarks chosen in advance. The skill's performance rules govern
this core: "TWR for portfolio performance independent of cash-flow
timing; IRR/XIRR for personal experience of money; pick, state
which, and never mix. Show both when they tell different stories."
Both methods are therefore computed, separately labeled, and never
blended into one number; their difference is reported as its own
figure. "Reconcile to broker statements monthly — discrepancies
fixed at the source": this core reports the discrepancies as
numbers; it never edits, smooths or silently adjusts a declared
figure ("no silent history edits — corrections annotated").

The caller submits one manifest: a beginning value, a series of
period-end values, the external flows for each period (a flow is
the net external cash flow at the BEGINNING of its period —
contributions positive, withdrawals negative), and optionally a
benchmark return series chosen in advance, a declared holdings
ledger (quantity x price per holding), ledger transactions
(contributions / withdrawals) and the caller's own declared period
returns. Every quantity below is a deterministic function of that
manifest:

- Period returns: r_i = V_i / (V_{i-1} + F_i) - 1, with V_{-1} the
  beginning value. A period whose base (previous value plus its
  beginning-of-period flow) is not positive has no defined return;
  the whole return path is then a labeled gap, never a mix of
  adjusted and unadjusted periods.
- Time-weighted return (TWR): the chain product of (1 + r_i) - 1.
- Money-weighted return (IRR) per period: the rate r solving
  B(1+r)^n + sum_i F_i (1+r)^(n-i) = final value, found by a fixed
  bracket search (lower bracket -0.999999; upper bracket 1, 3, 7,
  ... doubling-plus-one up to 1048575) followed by exactly 200
  bisection iterations, integer powers by repeated multiplication.
  When no sign-changing bracket exists in that searched range the
  IRR is a labeled gap, not a guess.
- Reconciliation, three legs, all reported as numbers (a
  discrepancy is a finding, not a gap — the caller fixes it at the
  source): (1) declared flows vs ledger transactions — declared
  net external flow minus ledger net (contributions minus
  withdrawals); (2) holdings vs declared value — the holdings
  ledger total (sum of quantity x price) minus the final declared
  period-end value, and that difference as a fraction of the final
  value; (3) declared returns vs computed returns — the per-period
  differences, the largest absolute difference and the count of
  periods whose difference is not zero at the report's
  six-decimal precision.
- Benchmark comparison (only over a series aligned period-for-
  period with the values): benchmark total return (chain product),
  benchmark mean period return, excess total return (portfolio TWR
  minus benchmark total) and the count of periods in which the
  portfolio period return exceeded the benchmark's.

NOT computed — named exclusions, because the skill names them but
specifies no deterministic computation for them: XIRR (the skill
names it but states no date or day-count convention; this core
computes the periodic IRR on the submitted period grid instead);
attribution decomposition (allocation vs selection vs timing vs
costs vs currency — the skill asks for a written one-paragraph
truth, a judgment artifact, and supplies no input data model or
formula for the decomposition); tax lots / adjusted cost base
(the skill asks for awareness and clean data for an accountant,
and states no jurisdictional computation); benchmark fees/taxes
adjustment ("including fees and taxes where material" — no
materiality rule or tax model is stated). Reports never contain
account numbers or identifiers: the manifest carries none and this
core accepts none.

Serialization rule (stated in SERVICE.md, identical in the TS
port): every computed floating quantity is rendered as a STRING
with exactly six decimal places, rounded half away from zero on
the binary double (scaled = floor(abs(x)*10^6 + 0.5); zero renders
"0.000000", never "-0.000000"). Counts and period indices stay
integers. Declared quantities echoed into the report (beginning
and period-end values, flows, quantities, prices, amounts) are
rendered under the same rule. All internal arithmetic is IEEE-754
double arithmetic in a fixed loop order using only +, -, *, /
(and integer powers by repeated multiplication), so the Python
oracle and the TypeScript port produce byte-identical output for
the same manifest.

Status vocabulary (computed deliverable):
- beginning value plus a values series with at least 2 valid
  observations, flows aligned, and no gaps of any kind -> complete
- performance computed but some section or figure is a labeled
  gap (missing flows, misaligned series, invalid entries,
  uncomputable IRR, ...)                            -> partial
- no numeric beginning value, or fewer than 2 valid numeric
  period-end values                       -> insufficient_evidence

No model call, no network, no clock dependence: the same manifest
always produces the same report. That determinism is the product.
"""
import json
import math
import sys

DISCLAIMER = ("Educational reporting only — not financial advice. "
              "The tool calculates; the user decides.")

_IRR_LO = -0.999999
_IRR_HI_STEPS = 20
_IRR_BISECTION_STEPS = 200


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


# Documented manifest field types (SERVICE.md input table). Every
# scalar field the core reads is listed, in read order. A field
# present with the wrong JSON type is a caller error (ValueError
# -> the gateway's HTTP 422 invalid_input), never evidence: F1
# remedy, external verification Wave 1. Absent fields are not
# validated — absence is a labeled gap, decided by the core below.
MANIFEST_SPEC = {
    "portfolio": "string",
    "beginning_value": "number",
    "benchmark_name": "string",
}

# List fields are validated as CONTAINERS ONLY. Their entries are
# documented counted gaps, not caller errors (SERVICE.md):
# non-numeric period_end_values entries are counted in
# counts.invalid_value_entries, flow/benchmark/declared series
# entries pass through the same _valid_series counting, holdings
# entries without a numeric quantity and price are counted in
# counts.invalid_holdings, and transactions entries without a
# valid kind and amount are counted in
# counts.invalid_transactions. Entry-validating any of these lists
# would turn a counted gap into a rejection, so only the list
# type itself is checked here.
_LIST_FIELDS = (
    "period_end_values",
    "external_flows",
    "benchmark_returns",
    "declared_returns",
    "holdings",
    "transactions",
)


def _validate_value(value, spec, path):
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
    for field in _LIST_FIELDS:
        if field in manifest and not isinstance(manifest[field], list):
            raise ValueError(f"{field} must be a list")


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


def _pow_int(base, exp):
    """base**exp for a non-negative integer exp, by repetition."""
    result = 1.0
    for _ in range(exp):
        result *= base
    return result


def _irr_residual(beginning, flows, final, rate):
    n = len(flows)
    p = 1.0 + rate
    total = beginning * _pow_int(p, n)
    for i in range(n):
        total += flows[i] * _pow_int(p, n - i)
    return total - final


def _sign_change(a, b):
    return (a < 0 and b > 0) or (a > 0 and b < 0)


def _solve_irr(beginning, flows, final):
    """Periodic money-weighted rate, or None when unbracketed."""
    if beginning == 0:
        all_zero = True
        for f in flows:
            if f != 0:
                all_zero = False
        if all_zero:
            return None
    lo = _IRR_LO
    flo = _irr_residual(beginning, flows, final, lo)
    if flo == 0:
        return lo
    hi = 1.0
    fhi = _irr_residual(beginning, flows, final, hi)
    steps = 0
    while fhi != 0 and not _sign_change(flo, fhi) \
            and steps < _IRR_HI_STEPS:
        hi = (hi + 1.0) * 2.0 - 1.0
        fhi = _irr_residual(beginning, flows, final, hi)
        steps += 1
    if fhi == 0:
        return hi
    if not _sign_change(flo, fhi):
        return None
    for _ in range(_IRR_BISECTION_STEPS):
        mid = (lo + hi) / 2.0
        fm = _irr_residual(beginning, flows, final, mid)
        if fm == 0:
            return mid
        if _sign_change(flo, fm):
            hi = mid
        else:
            lo = mid
            flo = fm
    return (lo + hi) / 2.0


def evaluate(manifest):
    """Return the reconciled performance report dict for a manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)

    gaps = []
    counts = {
        "periods": 0,
        "invalid_value_entries": 0,
        "invalid_flow_entries": 0,
        "holdings": 0,
        "invalid_holdings": 0,
        "transactions": 0,
        "invalid_transactions": 0,
    }
    result = {
        "service": "reconciled-portfolio-performance-report",
        "atom_version": "0.1.0",
        "portfolio": manifest.get("portfolio"),
        "status": "insufficient_evidence",
        "layers": {
            "values": "absent",
            "performance": "absent",
            "reconciliation": "absent",
            "benchmark": "absent",
            "holdings": "absent",
        },
        "counts": counts,
        "gaps": gaps,
        "performance": None,
        "benchmark": None,
        "reconciliation": None,
        "holdings": None,
        "disclaimer": DISCLAIMER,
        "summary": "",
    }

    # ---- Raw layer presence ----
    beginning_raw, _has_beginning = _get(manifest, "beginning_value")
    beginning = float(beginning_raw) if _is_num(beginning_raw) else None
    values_raw = manifest.get("period_end_values")
    holdings_raw = manifest.get("holdings")
    transactions_raw = manifest.get("transactions")
    bench_raw, has_bench = _get(manifest, "benchmark_returns")
    declared_raw, has_declared = _get(manifest, "declared_returns")
    if beginning is not None and isinstance(values_raw, list) \
            and values_raw:
        result["layers"]["values"] = "present"
    # F2 (external verification Wave 1): a ledger field that is
    # PRESENT — even as an explicitly empty list — is declared
    # evidence, not absence. Presence is list-typedness, never
    # non-emptiness: holdings: [] is a zero-total ledger and
    # transactions: [] is a zero-net ledger, and both make their
    # layers present exactly as a non-empty list does. Only a
    # field that was not submitted at all is absent.
    if isinstance(holdings_raw, list):
        result["layers"]["holdings"] = "present"
    if isinstance(transactions_raw, list) \
            or isinstance(holdings_raw, list) \
            or (has_declared and declared_raw is not None):
        result["layers"]["reconciliation"] = "present"
    if isinstance(bench_raw, list) and bench_raw:
        result["layers"]["benchmark"] = "present"

    # ---- Holdings validity (quantity x price) ----
    valid_holdings = []  # (entry, quantity, price) in submission order
    if isinstance(holdings_raw, list):
        for entry in holdings_raw:
            if isinstance(entry, dict) \
                    and _is_num(entry.get("quantity")) \
                    and _is_num(entry.get("price")):
                valid_holdings.append(
                    (entry, float(entry.get("quantity")),
                     float(entry.get("price"))))
            else:
                counts["invalid_holdings"] += 1
    counts["holdings"] = len(valid_holdings)

    # ---- Transactions validity (contribution / withdrawal) ----
    valid_transactions = []  # (kind, amount)
    if isinstance(transactions_raw, list):
        for entry in transactions_raw:
            if isinstance(entry, dict) \
                    and entry.get("kind") in ("contribution",
                                              "withdrawal") \
                    and _is_num(entry.get("amount")) \
                    and entry.get("amount") >= 0:
                valid_transactions.append(
                    (entry.get("kind"), float(entry.get("amount"))))
            else:
                counts["invalid_transactions"] += 1
    counts["transactions"] = len(valid_transactions)

    # ---- Values series: the core input ----
    values, invalid_values = _valid_series(values_raw)
    if values is None:
        values = []
    counts["periods"] = len(values)
    counts["invalid_value_entries"] = invalid_values
    n = len(values)

    if beginning is None or n < 2:
        if beginning is None:
            gaps.append(
                "beginning_value: a numeric beginning value is "
                "required — reconciled performance cannot be "
                "computed")
        if n < 2:
            gaps.append(
                "period_end_values: a series with at least 2 valid "
                "numeric period-end values is required — "
                "reconciled performance cannot be computed")
        result["summary"] = (
            "Insufficient evidence: "
            f"beginning value {'present' if beginning is not None else 'missing'}, "
            f"period-end values series has {n} valid numeric "
            "observations (need a numeric beginning value and at "
            "least 2) — reconciled portfolio performance cannot be "
            "computed.")
        return result
    result["layers"]["performance"] = "present"

    final_value = values[n - 1]

    # ================= Performance =================
    if invalid_values:
        gaps.append(
            f"period_end_values: {invalid_values} non-numeric "
            "entries excluded")
    perf = {
        "periods": n,
        "beginning_value": _fmt(beginning),
        "final_value": _fmt(final_value),
        "value_change": _fmt(final_value - beginning),
        "net_external_flows": None,
        "total_gain_after_flows": None,
        "period_returns": None,
        "time_weighted_return": None,
        "money_weighted_return_per_period": None,
        "mean_period_return": None,
        "twr_irr_difference": None,
        "methods": ["time_weighted_return",
                    "money_weighted_return_per_period"],
    }
    result["performance"] = perf

    flows_raw, has_flows = _get(manifest, "external_flows")
    flows = None
    if not has_flows or flows_raw is None:
        gaps.append(
            "external_flows not submitted — period returns cannot "
            "be separated from cash-flow timing, so time-weighted "
            "and money-weighted returns are gaps (never mixed, "
            "never defaulted)")
    else:
        flow_vals, flow_invalid = _valid_series(flows_raw)
        counts["invalid_flow_entries"] = flow_invalid
        if flow_vals is None:
            gaps.append(
                "external_flows is not a list — time-weighted and "
                "money-weighted returns are gaps")
        elif flow_invalid or len(flow_vals) != n:
            gaps.append(
                "external_flows does not align with "
                f"period_end_values ({len(flow_vals)} valid of "
                f"{len(flows_raw)} submitted vs {n} periods) — "
                "time-weighted and money-weighted returns are gaps")
        else:
            flows = flow_vals

    period_returns = None
    twr = None
    irr = None
    if flows is not None:
        net_flows = 0.0
        for f in flows:
            net_flows += f
        perf["net_external_flows"] = _fmt(net_flows)
        perf["total_gain_after_flows"] = _fmt(
            final_value - beginning - net_flows)
        returns = []
        bad_base_period = None
        for i in range(n):
            base = (beginning if i == 0 else values[i - 1]) + flows[i]
            if base <= 0:
                bad_base_period = i
                break
            returns.append(values[i] / base - 1.0)
        if bad_base_period is not None:
            gaps.append(
                f"period {bad_base_period}: previous value plus "
                "its beginning-of-period flow is not positive — "
                "the period return path, time-weighted return and "
                "money-weighted return are gaps")
        else:
            period_returns = returns
            wealth = 1.0
            for r in returns:
                wealth *= 1.0 + r
            twr = wealth - 1.0
            irr = _solve_irr(beginning, flows, final_value)
            if irr is None:
                gaps.append(
                    "money-weighted return: no sign-changing "
                    "bracket found in the searched range "
                    "(-0.999999 to 1048575) — the money-weighted "
                    "return per period is a gap")
            perf["period_returns"] = [_fmt(r) for r in returns]
            perf["time_weighted_return"] = _fmt(twr)
            perf["money_weighted_return_per_period"] = _fmt(irr)
            perf["mean_period_return"] = _fmt(_mean(returns))
            if irr is not None:
                perf["twr_irr_difference"] = _fmt(twr - irr)

    # ================= Benchmark comparison =================
    if has_bench and bench_raw is not None:
        bench_section = {
            "name": _str_or_none(manifest.get("benchmark_name")),
            "aligned": False,
            "periods": len(bench_raw) if isinstance(bench_raw, list)
                       else None,
            "total_return": None,
            "mean_return_per_period": None,
            "excess_total_return": None,
            "periods_portfolio_ahead": None,
        }
        result["benchmark"] = bench_section
        bench_vals, bench_invalid = _valid_series(bench_raw)
        if bench_vals is None:
            gaps.append(
                "benchmark_returns is not a list — benchmark "
                "comparison is a gap")
        elif bench_invalid or len(bench_vals) != n:
            gaps.append(
                "benchmark_returns does not align with "
                f"period_end_values ({len(bench_vals)} valid of "
                f"{len(bench_raw)} submitted vs {n} periods) — "
                "benchmark comparison is a gap")
        else:
            wealth_b = 1.0
            for r in bench_vals:
                wealth_b *= 1.0 + r
            bench_total = wealth_b - 1.0
            ahead = None
            if period_returns is not None:
                ahead = 0
                for i in range(n):
                    if period_returns[i] > bench_vals[i]:
                        ahead += 1
            bench_section.update({
                "aligned": True,
                "total_return": _fmt(bench_total),
                "mean_return_per_period": _fmt(_mean(bench_vals)),
                "excess_total_return": _fmt(
                    twr - bench_total if twr is not None else None),
                "periods_portfolio_ahead": ahead,
            })

    # ================= Holdings ledger =================
    holdings_total = None
    if isinstance(holdings_raw, list) and holdings_raw \
            and counts["invalid_holdings"]:
        gaps.append(
            f"holdings: {counts['invalid_holdings']} entries "
            "without a numeric quantity and price excluded")
    if valid_holdings:
        holdings_total = 0.0
        holding_values = []
        for _entry, qty, price in valid_holdings:
            value = qty * price
            holding_values.append(value)
            holdings_total += value
        rows = []
        largest_i = 0
        for i in range(len(valid_holdings)):
            if holding_values[i] > holding_values[largest_i]:
                largest_i = i
            entry = valid_holdings[i][0]
            rows.append({
                "id": _str_or_none(entry.get("id")),
                "quantity": _fmt(valid_holdings[i][1]),
                "price": _fmt(valid_holdings[i][2]),
                "value": _fmt(holding_values[i]),
                "share_of_holdings": _fmt(
                    holding_values[i] / holdings_total
                    if holdings_total != 0 else None),
            })
        if holdings_total == 0:
            gaps.append(
                "holdings: holding values sum to zero — holding "
                "shares are gaps")
        result["holdings"] = {
            "holdings_count": len(valid_holdings),
            "total_value": _fmt(holdings_total),
            "rows": rows,
            "largest_holding_id": _str_or_none(
                valid_holdings[largest_i][0].get("id")),
            "largest_holding_share": _fmt(
                holding_values[largest_i] / holdings_total
                if holdings_total != 0 else None),
        }
    elif isinstance(holdings_raw, list):
        # F2: a declared holdings ledger with no valid entries —
        # including the explicitly empty list — is a zero-total
        # ledger: the holdings section prints with total 0 and the
        # holdings-vs-declared-value leg below computes over it,
        # instead of the ledger passing in silence as absent.
        holdings_total = 0.0
        result["holdings"] = {
            "holdings_count": 0,
            "total_value": _fmt(holdings_total),
            "rows": [],
            "largest_holding_id": None,
            "largest_holding_share": None,
        }

    # ================= Reconciliation =================
    if result["layers"]["reconciliation"] == "present" \
            or flows is not None:
        recon = {
            "flows_vs_ledger": {
                "declared_net_external_flows": None,
                "ledger_contributions": None,
                "ledger_withdrawals": None,
                "ledger_net_external_flows": None,
                "difference": None,
            },
            "holdings_vs_declared_value": {
                "holdings_total_value": _fmt(holdings_total),
                "final_declared_value": _fmt(final_value),
                "difference": None,
                "difference_fraction_of_final": None,
            },
            "declared_vs_computed_returns": None,
        }
        result["reconciliation"] = recon
        # Leg 1: declared flows vs ledger transactions.
        if flows is not None:
            net_flows = 0.0
            for f in flows:
                net_flows += f
            recon["flows_vs_ledger"][
                "declared_net_external_flows"] = _fmt(net_flows)
        if isinstance(transactions_raw, list):
            if counts["invalid_transactions"]:
                gaps.append(
                    f"transactions: "
                    f"{counts['invalid_transactions']} entries "
                    "without a contribution/withdrawal kind, a "
                    "numeric amount and a non-negative amount "
                    "excluded")
            # F2 audit: the same absent-vs-empty conflation was
            # present here — the leg computed only when at least
            # one valid transaction existed, so a declared empty
            # ledger read as no ledger at all. A submitted list
            # always has a computable net over its valid entries
            # (zero when there are none), so the leg computes
            # whenever the field is present as a list.
            contributions = 0.0
            withdrawals = 0.0
            for kind, amount in valid_transactions:
                if kind == "contribution":
                    contributions += amount
                else:
                    withdrawals += amount
            ledger_net = contributions - withdrawals
            recon["flows_vs_ledger"]["ledger_contributions"] = \
                _fmt(contributions)
            recon["flows_vs_ledger"]["ledger_withdrawals"] = \
                _fmt(withdrawals)
            recon["flows_vs_ledger"][
                "ledger_net_external_flows"] = _fmt(ledger_net)
            if flows is not None:
                net_flows = 0.0
                for f in flows:
                    net_flows += f
                recon["flows_vs_ledger"]["difference"] = _fmt(
                    net_flows - ledger_net)
        elif transactions_raw is not None:
            gaps.append(
                "transactions is not a list — the flows-vs-ledger "
                "reconciliation leg is a gap")
        # Leg 2: holdings vs declared final value.
        if holdings_total is not None:
            difference = holdings_total - final_value
            recon["holdings_vs_declared_value"]["difference"] = \
                _fmt(difference)
            if final_value != 0:
                recon["holdings_vs_declared_value"][
                    "difference_fraction_of_final"] = _fmt(
                        difference / final_value)
            else:
                gaps.append(
                    "holdings reconciliation: final declared value "
                    "is zero — the difference fraction is a gap")
        # Leg 3: declared returns vs computed returns.
        if has_declared and declared_raw is not None:
            declared_section = {
                "aligned": False,
                "compared_periods": 0,
                "differences": None,
                "max_abs_difference": None,
                "mismatched_periods": None,
            }
            recon["declared_vs_computed_returns"] = declared_section
            decl_vals, decl_invalid = _valid_series(declared_raw)
            if decl_vals is None:
                gaps.append(
                    "declared_returns is not a list — the "
                    "declared-vs-computed returns reconciliation "
                    "leg is a gap")
            elif decl_invalid or len(decl_vals) != n:
                gaps.append(
                    "declared_returns does not align with "
                    f"period_end_values ({len(decl_vals)} valid "
                    f"of {len(declared_raw)} submitted vs {n} "
                    "periods) — the declared-vs-computed returns "
                    "reconciliation leg is a gap")
            elif period_returns is None:
                gaps.append(
                    "declared_returns cannot be reconciled — "
                    "computed period returns are gaps")
            else:
                differences = []
                max_abs = 0.0
                mismatched = 0
                for i in range(n):
                    d = period_returns[i] - decl_vals[i]
                    differences.append(d)
                    if abs(d) > max_abs:
                        max_abs = abs(d)
                    if _fmt(d) != "0.000000":
                        mismatched += 1
                declared_section.update({
                    "aligned": True,
                    "compared_periods": n,
                    "differences": [_fmt(d) for d in differences],
                    "max_abs_difference": _fmt(max_abs),
                    "mismatched_periods": mismatched,
                })

    result["status"] = "complete" if not gaps else "partial"
    if twr is not None:
        irr_text = _fmt(irr) if irr is not None else "gap"
        result["summary"] = (
            f"Reconciled performance over {n} periods: "
            f"time-weighted return {_fmt(twr)}, money-weighted "
            f"return per period {irr_text}, final value "
            f"{_fmt(final_value)}; {len(gaps)} gaps.")
    else:
        result["summary"] = (
            f"Performance over {n} periods: beginning value "
            f"{_fmt(beginning)}, final value {_fmt(final_value)}; "
            "time-weighted and money-weighted returns are gaps; "
            f"{len(gaps)} gaps.")
    return result


def stamp(verdict):
    """Human-readable stamp of a reconciled performance report dict."""
    lines = [
        "RECONCILED PORTFOLIO PERFORMANCE REPORT",
        f"portfolio: {verdict.get('portfolio')}",
        f"STATUS: {verdict['status']}",
        verdict["summary"],
        verdict["disclaimer"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: reconciled_portfolio_performance_report.py "
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
