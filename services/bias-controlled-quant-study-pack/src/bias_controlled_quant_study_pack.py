#!/usr/bin/env python3
"""Bias-controlled quant study pack — deterministic core.

Built from the bound skill `quant-research` (v1): "Research
markets with statistical honesty — distributions, biases, data
hygiene, and falsifiable hypotheses." This atom audits one
declared quant study pack — a single market study worked through
the skill's method — against the skill's seven method steps, its
four quality gates, and its three red lines. It does not fetch
market data, run the study, or judge whether the study's result
is right — it checks that the pack contains what the skill's
method requires, on the caller's declared evidence. Data
sourcing, the hypothesis itself, and the study's conclusions
stay the caller's: the pack declares its own hygiene, bias
controls, and counts, and this core checks their completeness
and internal coherence.

The caller submits a bias-controlled-quant-study-pack manifest
(a dict, or JSON on the CLI). Every check reads declared
manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic / set logic of the declared values — no outside
threshold is imported:

- cost coverage (method step 6: "Costs from day one: spreads,
  fees, slippage, borrow, taxes"): the declared included-cost
  list must cover every cost the skill names. Unknown entries do
  not count toward coverage; the omitted stated costs are
  reported as `costs_not_included` (null when no list is
  declared);
- stability across periods (method step 4: "test stability
  across periods"; quality gate: "stability checked across
  periods"): the declared stability-period list passes only
  when it names at least two DISTINCT periods — "across
  periods" cannot be satisfied by one period, and a period
  repeated is still one period. No period length, count above
  two, or period identity is imposed: the skill states none.
  The distinct count is reported as `stability_period_count`
  (null when no list is declared);
- reported-within-tested coherence (method step 5: "screens
  test thousands of things — the best of 10,000 random signals
  looks great; control for it"): the declared count of signals
  reported as results can never exceed the declared count of
  signals tested, and both counts are counts — whole numbers,
  zero or more. The skill states no significance level, no
  deflation formula, and no maximum number of tests, so none is
  imposed: this check is pure accounting coherence between the
  two declared counts. The declared counts and their difference
  (reported minus tested) are reported verbatim.

The computed outcome over the three computed checks is reported
as `computed_status`.

Verdict:
- any fail             -> STUDY_PACK_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> STUDY_PACK_COMPLETE

This is a completeness and coherence audit over declared
evidence, not a research review: a pack that declares every
step passes even if its hypothesis is wrong, and nothing here
verifies that a declared value is true, that the data actually
was clean, or that the result will survive live trading.

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import sys

SECTIONS = (
    "hypothesis_preregistration",
    "data_hygiene",
    "distribution_reality",
    "stationarity_and_stability",
    "multiple_testing",
    "costs",
    "reproducibility",
)

STATED_COSTS = [
    "spreads",
    "fees",
    "slippage",
    "borrow",
    "taxes",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the cost list and stability-period list
# entries) are validated as strings only, never enum-checked:
# coverage / distinctness are verdict checks, not type errors.
MANIFEST_SPEC = {
    "study": "string",
    "hypothesis": {
        "hypothesis_written": "boolean",
        "prediction_stated": "boolean",
        "falsification_test_defined": "boolean",
        "results_looked_at_before_registration": "boolean",
    },
    "data": {
        "provenance_documented": "boolean",
        "snapshot_version_documented": "boolean",
        "adjusted_prices": "boolean",
        "delisted_names_retained": "boolean",
        "survivorship_gap_present": "boolean",
        "point_in_time_fundamentals": "boolean",
        "restatement_peeking": "boolean",
        "timezone_timestamp_discipline": "boolean",
    },
    "distribution": {
        "fat_tails_considered": "boolean",
        "volatility_clustering_considered": "boolean",
        "gaussian_assumed": "boolean",
        "crisis_correlations_considered": "boolean",
    },
    "stationarity": {
        "stability_tested": "boolean",
        "stability_periods": ["string"],
        "regime_context_provided": "boolean",
        "mechanism_stated": "boolean",
        "claim_made_without_regime_context": "boolean",
    },
    "multiple_testing": {
        "controlled": "boolean",
        "deflated_significance_applied": "boolean",
        "holdout_used": "boolean",
        "signals_tested": "number",
        "signals_reported": "number",
        "p_hacked_screen_presented_as_strategy": "boolean",
        "result_from_single_sample": "boolean",
    },
    "costs": {
        "costs_included": "boolean",
        "included": ["string"],
        "results_net_of_costs": "boolean",
    },
    "reproducibility": {
        "seeded_runs": "boolean",
        "snapshot_pinned": "boolean",
        "code_versioned": "boolean",
        "rerunnable_by_others": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_count(value):
    """A declared signal count: a whole number, zero or more."""
    return _is_number(value) and float(value).is_integer()


def evaluate(manifest):
    """Return the verdict dict for a quant-study-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: hypothesis_preregistration (skill method
    #      step 1: "Hypothesis pre-registration: write the
    #      hypothesis, the prediction, and the falsification test
    #      BEFORE looking at results"; quality gate: "Hypothesis
    #      + falsification written before analysis") ----
    _bool_check(results, "hypothesis_preregistration",
                "hypothesis_written_before_analysis",
                manifest, ("hypothesis", "hypothesis_written"),
                "method step 1: the hypothesis is written before "
                "analysis (pre-registration)")
    _bool_check(results, "hypothesis_preregistration",
                "prediction_stated_before_analysis",
                manifest, ("hypothesis", "prediction_stated"),
                "method step 1: the prediction the hypothesis makes "
                "is stated before looking at results")
    _bool_check(results, "hypothesis_preregistration",
                "falsification_test_defined_before_analysis",
                manifest, ("hypothesis", "falsification_test_defined"),
                "quality gate: the falsification test is written "
                "before analysis — what result would kill the "
                "hypothesis")
    _false_check(results, "hypothesis_preregistration",
                 "results_not_seen_before_registration",
                 manifest,
                 ("hypothesis", "results_looked_at_before_registration"),
                 "method step 1: results are not looked at before "
                 "the hypothesis, prediction and falsification test "
                 "are written")

    # ---- Section 2: data_hygiene (skill method step 2: "Data
    #      hygiene: adjusted prices (splits/dividends) done
    #      correctly; delisted names retained (survivorship!);
    #      point-in-time fundamentals (no restatement peeking);
    #      timezone & timestamp discipline; document provenance
    #      + snapshot version"; quality gate: "Data provenance +
    #      adjustments documented; no survivorship gap") ----
    _bool_check(results, "data_hygiene", "data_provenance_documented",
                manifest, ("data", "provenance_documented"),
                "quality gate: data provenance is documented — "
                "where every series came from")
    _bool_check(results, "data_hygiene", "snapshot_version_documented",
                manifest, ("data", "snapshot_version_documented"),
                "method step 2: the data snapshot version is "
                "documented alongside the provenance")
    _bool_check(results, "data_hygiene",
                "prices_adjusted_for_splits_and_dividends",
                manifest, ("data", "adjusted_prices"),
                "method step 2: adjusted prices (splits/dividends) "
                "are done correctly")
    _bool_check(results, "data_hygiene", "delisted_names_retained",
                manifest, ("data", "delisted_names_retained"),
                "method step 2: delisted names are retained in the "
                "dataset (survivorship)")
    _false_check(results, "data_hygiene", "no_survivorship_gap",
                 manifest, ("data", "survivorship_gap_present"),
                 "quality gate: there is no survivorship gap — the "
                 "dataset is not silently limited to names that "
                 "survived")
    _bool_check(results, "data_hygiene",
                "point_in_time_fundamentals_used",
                manifest, ("data", "point_in_time_fundamentals"),
                "method step 2: fundamentals are point-in-time — "
                "the values as known on the date, not as later "
                "restated")
    _false_check(results, "data_hygiene", "no_restatement_peeking",
                 manifest, ("data", "restatement_peeking"),
                 "method step 2: no restatement peeking — later "
                 "restated fundamentals are not read back into "
                 "earlier dates")
    _bool_check(results, "data_hygiene",
                "timezone_and_timestamp_discipline",
                manifest, ("data", "timezone_timestamp_discipline"),
                "method step 2: timezone and timestamp discipline "
                "is applied across the dataset")

    # ---- Section 3: distribution_reality (skill method step 3:
    #      "Distribution reality: fat tails, volatility
    #      clustering, non-normality — don't assume Gaussian;
    #      correlations rise in crises (diversification fails
    #      exactly when needed)") ----
    _bool_check(results, "distribution_reality",
                "fat_tails_accounted_for",
                manifest, ("distribution", "fat_tails_considered"),
                "method step 3: fat tails are accounted for — "
                "extreme moves are more common than a normal "
                "distribution implies")
    _bool_check(results, "distribution_reality",
                "volatility_clustering_accounted_for",
                manifest,
                ("distribution", "volatility_clustering_considered"),
                "method step 3: volatility clustering is accounted "
                "for — turbulent and quiet periods bunch together")
    _false_check(results, "distribution_reality", "gaussian_not_assumed",
                 manifest, ("distribution", "gaussian_assumed"),
                 "method step 3: a Gaussian distribution is not "
                 "assumed — returns are non-normal")
    _bool_check(results, "distribution_reality",
                "crisis_correlation_rise_accounted_for",
                manifest,
                ("distribution", "crisis_correlations_considered"),
                "method step 3: the rise of correlations in crises "
                "is accounted for — diversification fails exactly "
                "when needed")

    # ---- Section 4: stationarity_and_stability (skill method
    #      step 4: "Stationarity skepticism: regimes end;
    #      relationships decay; test stability across periods;
    #      prefer theories with a mechanism over curve fits
    #      without one"; quality gate: "stability checked across
    #      periods"; red line: "no 'works since 2021' claims
    #      without regime context") ----
    _bool_check(results, "stationarity_and_stability",
                "stability_tested_across_periods",
                manifest, ("stationarity", "stability_tested"),
                "method step 4: stability is tested across periods "
                "— regimes end and relationships decay")
    periods, has_periods = _get(
        manifest, "stationarity", "stability_periods")
    periods_is_list = has_periods and isinstance(periods, list)
    period_count = len(set(periods)) if periods_is_list else None
    _check(results, "stationarity_and_stability",
           "stability_periods_cover_multiple_periods", periods,
           periods_is_list,
           periods_is_list and period_count >= 2,
           "method step 4: the declared stability periods cover "
           "at least two distinct periods — stability 'across "
           "periods' cannot be shown inside a single period, and "
           "a repeated period is still one period")
    _bool_check(results, "stationarity_and_stability",
                "regime_context_provided",
                manifest, ("stationarity", "regime_context_provided"),
                "red line: performance claims carry their regime "
                "context — which regimes the study period covers")
    _bool_check(results, "stationarity_and_stability",
                "mechanism_theory_stated",
                manifest, ("stationarity", "mechanism_stated"),
                "method step 4: the study rests on a theory with a "
                "mechanism, preferred over a curve fit without one")
    _false_check(results, "stationarity_and_stability",
                 "no_claim_without_regime_context",
                 manifest,
                 ("stationarity", "claim_made_without_regime_context"),
                 "red line: no 'works since 2021' claims without "
                 "regime context")

    # ---- Section 5: multiple_testing (skill method step 5:
    #      "Multiple testing: screens test thousands of things —
    #      the best of 10,000 random signals looks great; control
    #      for it (deflated significance awareness, holdout
    #      discipline)"; quality gate: "Multiple-testing
    #      controlled"; red lines: "No result from one lucky
    #      sample"; "no p-hacked screens presented as
    #      strategy") ----
    _bool_check(results, "multiple_testing",
                "multiple_testing_controlled",
                manifest, ("multiple_testing", "controlled"),
                "quality gate: multiple testing is controlled — a "
                "screen that tests thousands of things expects "
                "lucky winners by chance alone")
    _bool_check(results, "multiple_testing",
                "deflated_significance_awareness_applied",
                manifest,
                ("multiple_testing", "deflated_significance_applied"),
                "method step 5: deflated significance awareness is "
                "applied — significance is read against how many "
                "things were tested")
    _bool_check(results, "multiple_testing", "holdout_discipline_applied",
                manifest, ("multiple_testing", "holdout_used"),
                "method step 5: holdout discipline is applied — "
                "part of the evidence is kept back and not used to "
                "select the result")
    tested, has_tested = _get(
        manifest, "multiple_testing", "signals_tested")
    reported, has_reported = _get(
        manifest, "multiple_testing", "signals_reported")
    both_counts = (
        has_tested and has_reported
        and _is_count(tested) and _is_count(reported)
    )
    coherent = (
        both_counts and tested >= 0 and reported >= 0
        and reported <= tested
    )
    _check(results, "multiple_testing",
           "reported_signals_within_tested_count", reported,
           has_tested and has_reported, coherent,
           "method step 5: the signals reported as results never "
           "exceed the signals actually tested, and both declared "
           "counts are whole numbers — pure accounting coherence "
           "between the two counts the pack itself declares")
    _false_check(results, "multiple_testing",
                 "no_phacked_screen_presented_as_strategy",
                 manifest,
                 ("multiple_testing",
                  "p_hacked_screen_presented_as_strategy"),
                 "red line: no p-hacked screens presented as "
                 "strategy")
    _false_check(results, "multiple_testing",
                 "result_not_from_single_lucky_sample",
                 manifest,
                 ("multiple_testing", "result_from_single_sample"),
                 "red line: no result from one lucky sample")

    # ---- Section 6: costs (skill method step 6: "Costs from
    #      day one: spreads, fees, slippage, borrow, taxes — a
    #      paper edge that dies after costs is not an edge";
    #      quality gate: "Costs included") ----
    _bool_check(results, "costs", "costs_included_from_day_one",
                manifest, ("costs", "costs_included"),
                "quality gate: costs are included from day one — "
                "a paper edge that dies after costs is not an edge")
    included, has_included = _get(manifest, "costs", "included")
    included_is_list = has_included and isinstance(included, list)
    not_included = (
        [c for c in STATED_COSTS if c not in included]
        if included_is_list else None
    )
    _check(results, "costs", "all_stated_costs_included", included,
           included_is_list,
           included_is_list and len(not_included) == 0,
           "method step 6: the included costs cover every cost "
           "the skill names — spreads, fees, slippage, borrow, "
           "taxes")
    _bool_check(results, "costs", "results_reported_net_of_costs",
                manifest, ("costs", "results_net_of_costs"),
                "method step 6: results are reported net of costs "
                "— the edge shown is the edge after spreads, fees, "
                "slippage, borrow and taxes")

    # ---- Section 7: reproducibility (skill method step 7:
    #      "Reproducibility: seeded runs, pinned data snapshots,
    #      versioned notebooks/scripts; results rerunnable by
    #      someone else"; quality gate: "results reproducible
    #      from the snapshot") ----
    _bool_check(results, "reproducibility", "seeded_runs",
                manifest, ("reproducibility", "seeded_runs"),
                "method step 7: runs are seeded — the same inputs "
                "rerun to the same outputs")
    _bool_check(results, "reproducibility", "data_snapshot_pinned",
                manifest, ("reproducibility", "snapshot_pinned"),
                "quality gate: the data snapshot is pinned — "
                "results are reproducible from the snapshot")
    _bool_check(results, "reproducibility",
                "notebooks_and_scripts_versioned",
                manifest, ("reproducibility", "code_versioned"),
                "method step 7: notebooks and scripts are "
                "versioned — the exact code that produced the "
                "result is on record")
    _bool_check(results, "reproducibility",
                "results_rerunnable_by_someone_else",
                manifest, ("reproducibility", "rerunnable_by_others"),
                "method step 7: results are rerunnable by someone "
                "else from the seeded runs, the pinned snapshot "
                "and the versioned code")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "STUDY_PACK_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "STUDY_PACK_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("stability_periods_cover_multiple_periods",
                          "reported_signals_within_tested_count",
                          "all_stated_costs_included")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    signals_tested = tested if has_tested and _is_number(tested) else None
    signals_reported = (
        reported if has_reported and _is_number(reported) else None
    )
    signals_difference = (
        reported - tested
        if signals_tested is not None and signals_reported is not None
        else None
    )

    return {
        "service": "bias-controlled-quant-study-pack",
        "atom_version": "0.1.0",
        "study": manifest.get("study"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "stability_period_count": period_count,
        "signals_tested": signals_tested,
        "signals_reported": signals_reported,
        "signals_reported_minus_tested": signals_difference,
        "costs_not_included": not_included,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "BIAS-CONTROLLED QUANT STUDY PACK",
        f"study: {verdict.get('study')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: bias_controlled_quant_study_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "STUDY_PACK_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
