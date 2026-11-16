#!/usr/bin/env python3
"""Forecast confidence scoreboard — deterministic core.

Built from the bound skill `prediction`: "A prediction is a claim
with an error bar. Beat the baseline, validate without leakage,
report calibration — or don't deploy it." Its calibration core:
"output probabilities; set action thresholds from decision costs;
check calibration (when it says 70%, it should be right ~70%) —
not just ranking ability", plus "segment errors — the worst
cohort is the story" and the red line "no metric-chosen-to-flatter".

This atom is a SCOREBOARD over human forecasters, not an ML-model
audit and not a single-forecast artifact. The caller submits a
declared scoreboard record: a ledger of resolved binary
probabilistic forecasts, each naming its forecaster, its claim,
the probability the forecaster stated before resolution, and the
binary outcome; plus the published per-forecaster scoreboard rows
(count, mean stated probability, hit rate, calibration gap, Brier
score, rank). The atom recomputes every per-forecaster aggregate
and the overall aggregates from the ledger and checks that the
published scoreboard is honest about its own ledger:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- every ledger entry must name a forecaster, state a claim, state
  a probability inside [0, 1] (a probability is by definition in
  that interval) and record a binary outcome (0 or 1);
- the scoreboard must cover exactly the forecasters in the ledger;
- each scoreboard row's count, mean stated probability, hit rate,
  calibration gap (|mean stated probability - hit rate|) and
  Brier score (mean squared (stated probability - outcome)) must
  agree with the values recomputed from the ledger, compared
  after the fixed 6dp serialization below — agreement with the
  record's own ledger is the bar, never a quality bar;
- the published ranks must be exactly 1..N and must follow the
  recomputed Brier order (lower Brier ranks first; ties break by
  forecaster name, ascending, so the expected order is total).

Computed ratios / scores are serialized as strings with exactly
six decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the serialized values for declared-vs-recomputed agreement and
the unrounded values elsewhere. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical. Counts
are reported as integers (exact).

The skill states no numeric pass/fail threshold for this ground —
no tolerated calibration gap, no Brier bar, no hit-rate bar, no
minimum forecasts per forecaster, no probability-bucket scheme
(its only calibration number is the illustrative "when it says
70%, it should be right ~70%"), no rank-separation margin — so no
numeric threshold check is invented; quantities are computed and
reported, the calibration direction (overconfident /
underconfident / exact) is reported without failing, and
completeness and declared-vs-recomputed agreement over the
caller's own declared rows are the only bars.

Verdict:
- any fail             -> CONFIDENCE_SCOREBOARD_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CONFIDENCE_SCOREBOARD_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "ledger_and_resolution",
    "per_forecaster_scoring",
    "calibration_reporting",
    "ranking_integrity",
    "honesty_and_live_use",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "subject": "string",
    "record": {
        "resolution_criteria_predeclared": "boolean",
        "forecasts_recorded_before_resolution": "boolean",
        "unresolved_forecasts_excluded": "boolean",
    },
    "forecasts": [{
        "forecaster": "string",
        "claim": "string",
        "stated_probability": "number",
        "outcome": "number",
    }],
    "scoreboard": [{
        "forecaster": "string",
        "forecasts_count": "number",
        "mean_stated_probability": "number",
        "hit_rate": "number",
        "calibration_gap": "number",
        "brier_score": "number",
        "rank": "number",
    }],
    "confidence_reporting": {
        "calibration_reported_per_forecaster": "boolean",
        "outputs_are_probabilities": "boolean",
        "calibration_reported_not_just_ranking": "boolean",
        "worst_forecaster_surfaced": "boolean",
    },
    "scoreboard_use": {
        "decision_stated": "boolean",
        "decision_costs_considered": "boolean",
    },
    "honesty": {
        "metric_chosen_to_flatter_present": "boolean",
        "silent_score_rewrites_present": "boolean",
        "scores_refreshed_as_outcomes_resolve": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _stats_valid(entry):
    return (
        isinstance(entry, dict)
        and _nonempty_str(entry.get("forecaster"))
        and _is_number(entry.get("stated_probability"))
        and 0 <= entry["stated_probability"] <= 1
        and _is_number(entry.get("outcome"))
        and entry["outcome"] in (0, 1)
    )


def _forecaster_stats(rows):
    """Per-forecaster aggregates over stats-valid entries, in
    ledger encounter order for the sums."""
    stats = {}
    for entry in rows:
        if not _stats_valid(entry):
            continue
        name = entry["forecaster"]
        bucket = stats.setdefault(
            name, {"count": 0, "prob_sum": 0.0, "hit_sum": 0.0,
                   "brier_sum": 0.0})
        bucket["count"] += 1
        bucket["prob_sum"] += entry["stated_probability"]
        bucket["hit_sum"] += entry["outcome"]
        diff = entry["stated_probability"] - entry["outcome"]
        bucket["brier_sum"] += diff * diff
    for bucket in stats.values():
        bucket["mean"] = bucket["prob_sum"] / bucket["count"]
        bucket["hit"] = bucket["hit_sum"] / bucket["count"]
        bucket["gap"] = abs(bucket["mean"] - bucket["hit"])
        bucket["brier"] = bucket["brier_sum"] / bucket["count"]
    return stats


def evaluate(manifest):
    """Return the verdict dict for a forecast-confidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    forecasts, has_forecasts = _get(manifest, "forecasts")
    forecasts_is_list = has_forecasts and isinstance(forecasts, list)
    f_rows = forecasts if forecasts_is_list else []
    forecasts_count = len(f_rows) if forecasts_is_list else None

    scoreboard, has_scoreboard = _get(manifest, "scoreboard")
    scoreboard_is_list = has_scoreboard and isinstance(scoreboard, list)
    s_rows = scoreboard if scoreboard_is_list else []

    stats = _forecaster_stats(f_rows)
    stats_complete = (
        forecasts_is_list and forecasts_count > 0
        and all(_stats_valid(c) for c in f_rows)
    )
    valid_entries = [c for c in f_rows if _stats_valid(c)]
    if valid_entries:
        overall_mean = (
            sum(c["stated_probability"] for c in valid_entries)
            / len(valid_entries)
        )
        overall_hit = (
            sum(c["outcome"] for c in valid_entries) / len(valid_entries)
        )
        overall_gap = abs(overall_mean - overall_hit)
        overall_brier = (
            sum((c["stated_probability"] - c["outcome"])
                * (c["stated_probability"] - c["outcome"])
                for c in valid_entries)
            / len(valid_entries)
        )
        if overall_mean > overall_hit:
            calibration_direction = "overconfident"
        elif overall_mean < overall_hit:
            calibration_direction = "underconfident"
        else:
            calibration_direction = "exact"
    else:
        overall_mean = overall_hit = overall_gap = overall_brier = None
        calibration_direction = None

    worst_calibrated_forecaster = None
    worst_gap = None
    for name in sorted(stats):
        if worst_gap is None or stats[name]["gap"] > worst_gap:
            worst_gap = stats[name]["gap"]
            worst_calibrated_forecaster = name

    ledger_names = []
    for c in f_rows:
        if isinstance(c, dict) and _nonempty_str(c.get("forecaster")):
            if c["forecaster"] not in ledger_names:
                ledger_names.append(c["forecaster"])
    forecasters_count = len(ledger_names) if forecasts_is_list else None
    sb_names = []
    for c in s_rows:
        if isinstance(c, dict) and isinstance(c.get("forecaster"), str):
            if c["forecaster"] not in sb_names:
                sb_names.append(c["forecaster"])
    forecasters_without_scoreboard_row = (
        [n for n in ledger_names if n not in sb_names]
        if forecasts_is_list and scoreboard_is_list else None
    )
    scoreboard_rows_without_forecasts = (
        [n for n in sb_names if n not in ledger_names]
        if forecasts_is_list and scoreboard_is_list else None
    )

    def _row_mismatches(row):
        if not isinstance(row, dict):
            return False
        name = row.get("forecaster")
        if not isinstance(name, str):
            return False
        if "forecasts_count" in row:
            ledger_count = sum(
                1 for c in f_rows
                if isinstance(c, dict) and c.get("forecaster") == name)
            if row["forecasts_count"] != ledger_count:
                return True
        if name in stats:
            for field, key in (
                ("mean_stated_probability", "mean"),
                ("hit_rate", "hit"),
                ("calibration_gap", "gap"),
                ("brier_score", "brier"),
            ):
                if field in row and _fmt6(row[field]) != _fmt6(stats[name][key]):
                    return True
        return False

    mismatched_scoreboard_rows = (
        [c["forecaster"] for c in s_rows
         if isinstance(c, dict) and isinstance(c.get("forecaster"), str)
         and _row_mismatches(c)]
        if forecasts_is_list and scoreboard_is_list else None
    )

    expected_rank = {}
    if stats_complete and scoreboard_is_list:
        ordered = sorted(
            (c["forecaster"] for c in s_rows
             if isinstance(c, dict) and c.get("forecaster") in stats),
            key=lambda n: (stats[n]["brier"], n),
        )
        for index, name in enumerate(ordered):
            if name not in expected_rank:
                expected_rank[name] = index + 1
    forecasters_with_wrong_rank = (
        [c["forecaster"] for c in s_rows
         if isinstance(c, dict) and "rank" in c
         and c.get("forecaster") in expected_rank
         and c["rank"] != expected_rank[c["forecaster"]]]
        if stats_complete and scoreboard_is_list else None
    )

    # ---- Section 1: ledger_and_resolution (skill: target &
    #      decision — what counts as the outcome is settled before
    #      the outcome is seen; validation without leakage — no
    #      peeking at validation, here: no forecast recorded after
    #      its resolution and no unresolved forecast scored) ----
    _bool_check(results, "ledger_and_resolution",
                "resolution_criteria_predeclared", manifest,
                ("record", "resolution_criteria_predeclared"),
                "target & decision: the criteria that resolve each "
                "claim are declared before outcomes are known")
    _bool_check(results, "ledger_and_resolution",
                "forecasts_recorded_before_resolution", manifest,
                ("record", "forecasts_recorded_before_resolution"),
                "validation without leakage: every forecast is "
                "recorded before its outcome resolves — no peeking")
    _bool_check(results, "ledger_and_resolution",
                "unresolved_forecasts_excluded_from_scoring", manifest,
                ("record", "unresolved_forecasts_excluded"),
                "scoreboard honesty: only resolved forecasts are "
                "scored — unresolved forecasts are excluded")
    _check(results, "ledger_and_resolution",
           "forecasts_declared", forecasts, forecasts_is_list,
           forecasts_is_list and forecasts_count > 0,
           "the declared record names its resolved forecasts — "
           "the forecasts list is present and non-empty")
    names_present = (
        forecasts_is_list
        and all(isinstance(c, dict) and "forecaster" in c for c in f_rows)
    )
    _check(results, "ledger_and_resolution",
           "every_forecast_names_forecaster", forecasts, names_present,
           forecasts_is_list and forecasts_count > 0
           and all(isinstance(c, dict)
                   and _nonempty_str(c.get("forecaster")) for c in f_rows),
           "every declared forecast row names its forecaster — a "
           "non-empty forecaster string")
    claim_present = (
        forecasts_is_list
        and all(isinstance(c, dict) and "claim" in c for c in f_rows)
    )
    _check(results, "ledger_and_resolution",
           "every_forecast_states_claim", forecasts, claim_present,
           forecasts_is_list and forecasts_count > 0
           and all(isinstance(c, dict)
                   and _nonempty_str(c.get("claim")) for c in f_rows),
           "every declared forecast row states the claim that was "
           "predicted — a non-empty claim string")
    prob_present = (
        forecasts_is_list
        and all(isinstance(c, dict) and "stated_probability" in c
                for c in f_rows)
    )
    _check(results, "ledger_and_resolution",
           "every_forecast_probability_in_range", forecasts,
           prob_present,
           forecasts_is_list and forecasts_count > 0
           and all(isinstance(c, dict)
                   and _is_number(c.get("stated_probability"))
                   and 0 <= c["stated_probability"] <= 1
                   for c in f_rows),
           "probabilities, not fortune-telling: every declared "
           "forecast row states a probability inside [0, 1]")
    outcome_present = (
        forecasts_is_list
        and all(isinstance(c, dict) and "outcome" in c for c in f_rows)
    )
    _check(results, "ledger_and_resolution",
           "every_forecast_outcome_binary", forecasts, outcome_present,
           forecasts_is_list and forecasts_count > 0
           and all(isinstance(c, dict)
                   and _is_number(c.get("outcome"))
                   and c["outcome"] in (0, 1) for c in f_rows),
           "every declared forecast row records a binary outcome "
           "— 0 or 1")

    # ---- Section 2: per_forecaster_scoring (skill: evaluate for
    #      purpose — the scoreboard's unit is the forecaster; each
    #      published aggregate must be the aggregate of the
    #      forecaster's own declared ledger rows) ----
    _check(results, "per_forecaster_scoring",
           "scoreboard_declared", scoreboard, scoreboard_is_list,
           scoreboard_is_list and len(s_rows) > 0,
           "the declared record publishes its scoreboard — the "
           "scoreboard list is present and non-empty")
    covers_present = (
        forecasts_is_list and scoreboard_is_list
        and all(isinstance(c, dict) and "forecaster" in c for c in f_rows)
        and all(isinstance(c, dict) and "forecaster" in c for c in s_rows)
    )
    raw_sb_names = [c.get("forecaster") for c in s_rows
                    if isinstance(c, dict)]
    raw_ledger_names = [c.get("forecaster") for c in f_rows
                        if isinstance(c, dict)]
    _check(results, "per_forecaster_scoring",
           "scoreboard_covers_every_forecaster", scoreboard,
           covers_present,
           forecasts_is_list and scoreboard_is_list
           and set(raw_ledger_names) == set(raw_sb_names)
           and len(raw_sb_names) == len(set(raw_sb_names)),
           "the scoreboard covers exactly the forecasters in the "
           "ledger — no forecaster omitted, no row without "
           "forecasts, no duplicate rows")
    count_present = (
        forecasts_is_list and scoreboard_is_list
        and all(isinstance(c, dict) and "forecaster" in c for c in f_rows)
        and all(isinstance(c, dict) and "forecaster" in c
                and "forecasts_count" in c for c in s_rows)
    )
    _check(results, "per_forecaster_scoring",
           "every_scoreboard_forecast_count_matches_ledger",
           scoreboard, count_present,
           scoreboard_is_list
           and all(
               isinstance(c, dict)
               and c.get("forecasts_count") == sum(
                   1 for f in f_rows
                   if isinstance(f, dict)
                   and f.get("forecaster") == c.get("forecaster"))
               for c in s_rows),
           "every scoreboard row's forecasts_count equals the "
           "number of ledger rows naming that forecaster")

    def _aggregate_check(name, field, key, evidence):
        present = (
            stats_complete and scoreboard_is_list
            and all(isinstance(c, dict) and "forecaster" in c
                    and field in c for c in s_rows)
            and all(isinstance(c, dict)
                    and c.get("forecaster") in stats for c in s_rows)
        )
        _check(results, "per_forecaster_scoring", name, scoreboard,
               present,
               scoreboard_is_list and len(s_rows) > 0
               and all(isinstance(c, dict)
                       and c.get("forecaster") in stats
                       and _fmt6(c.get(field))
                       == _fmt6(stats[c["forecaster"]][key])
                       for c in s_rows),
               evidence)

    _aggregate_check(
        "every_scoreboard_mean_probability_matches",
        "mean_stated_probability", "mean",
        "every scoreboard row's mean stated probability agrees "
        "with the mean recomputed from that forecaster's ledger "
        "rows (agreement at the fixed 6dp serialization)")
    _aggregate_check(
        "every_scoreboard_hit_rate_matches",
        "hit_rate", "hit",
        "every scoreboard row's hit rate agrees with the hit "
        "rate recomputed from that forecaster's ledger rows "
        "(agreement at the fixed 6dp serialization)")
    _aggregate_check(
        "every_scoreboard_brier_score_matches",
        "brier_score", "brier",
        "every scoreboard row's Brier score — mean squared "
        "(stated probability - outcome) — agrees with the Brier "
        "score recomputed from that forecaster's ledger rows "
        "(agreement at the fixed 6dp serialization)")

    # ---- Section 3: calibration_reporting (skill: probabilities,
    #      not fortune-telling — check calibration, when it says
    #      70% it should be right ~70%, not just ranking ability;
    #      segment errors — the worst cohort is the story, here
    #      the cohort is the forecaster) ----
    gap_present = (
        stats_complete and scoreboard_is_list
        and all(isinstance(c, dict) and "forecaster" in c
                and "calibration_gap" in c for c in s_rows)
        and all(isinstance(c, dict)
                and c.get("forecaster") in stats for c in s_rows)
    )
    _check(results, "calibration_reporting",
           "every_scoreboard_calibration_gap_matches", scoreboard,
           gap_present,
           scoreboard_is_list and len(s_rows) > 0
           and all(isinstance(c, dict)
                   and c.get("forecaster") in stats
                   and _fmt6(c.get("calibration_gap"))
                   == _fmt6(stats[c["forecaster"]]["gap"])
                   for c in s_rows),
           "every scoreboard row's calibration gap — |mean stated "
           "probability - hit rate| — agrees with the gap "
           "recomputed from that forecaster's ledger rows "
           "(agreement at the fixed 6dp serialization)")
    _bool_check(results, "calibration_reporting",
                "calibration_reported_per_forecaster", manifest,
                ("confidence_reporting",
                 "calibration_reported_per_forecaster"),
                "check calibration: calibration is reported per "
                "forecaster, not only in aggregate")
    _bool_check(results, "calibration_reporting",
                "probabilities_reported_not_point_verdicts", manifest,
                ("confidence_reporting", "outputs_are_probabilities"),
                "probabilities, not fortune-telling: the "
                "scoreboard reports stated probabilities, not "
                "bare point verdicts")
    _bool_check(results, "calibration_reporting",
                "calibration_reported_not_just_ranking", manifest,
                ("confidence_reporting",
                 "calibration_reported_not_just_ranking"),
                "check calibration — not just ranking ability: "
                "calibration is reported alongside any ranking")
    _bool_check(results, "calibration_reporting",
                "worst_calibrated_forecaster_surfaced", manifest,
                ("confidence_reporting", "worst_forecaster_surfaced"),
                "segment errors — the worst cohort is the story: "
                "the worst-calibrated forecaster is surfaced, "
                "not hidden in the aggregate")

    # ---- Section 4: ranking_integrity (skill: evaluate for
    #      purpose — a ranking published by the scoreboard must
    #      be the ranking of its own recomputed scores) ----
    ranks_present = (
        scoreboard_is_list
        and all(isinstance(c, dict) and "forecaster" in c
                and "rank" in c for c in s_rows)
    )
    rank_values = [c.get("rank") for c in s_rows if isinstance(c, dict)]
    _check(results, "ranking_integrity",
           "scoreboard_ranks_complete_and_unique", scoreboard,
           ranks_present,
           scoreboard_is_list and len(s_rows) > 0
           and all(_is_number(r) and r == int(r) for r in rank_values)
           and sorted(rank_values) == list(range(1, len(s_rows) + 1)),
           "the published ranks are exactly 1..N over the "
           "scoreboard rows — complete, unique, integral")
    ranking_present = (
        stats_complete and scoreboard_is_list and len(s_rows) > 0
        and all(isinstance(c, dict) and "forecaster" in c
                and "rank" in c for c in s_rows)
        and all(isinstance(c, dict)
                and c.get("forecaster") in stats for c in s_rows)
    )
    _check(results, "ranking_integrity",
           "scoreboard_ranking_matches_brier_order", scoreboard,
           ranking_present,
           ranking_present
           and all(c.get("rank") == expected_rank.get(c.get("forecaster"))
                   for c in s_rows if isinstance(c, dict)),
           "the published ranking follows the recomputed Brier "
           "order — lower Brier ranks first, ties break by "
           "forecaster name ascending")

    # ---- Section 5: honesty_and_live_use (skill: target &
    #      decision — the metric is chosen from the decision's
    #      costs, false positives vs false negatives rarely cost
    #      the same; drift & loops — monitor live performance;
    #      red lines — no metric-chosen-to-flatter, no silent
    #      updates in production, here: no silent score rewrites)
    _bool_check(results, "honesty_and_live_use",
                "scoreboard_decision_stated", manifest,
                ("scoreboard_use", "decision_stated"),
                "target & decision: the decision this scoreboard "
                "drives — whose forecasts get trusted or weighted "
                "— is stated")
    _bool_check(results, "honesty_and_live_use",
                "decision_costs_considered", manifest,
                ("scoreboard_use", "decision_costs_considered"),
                "target & decision: the metric is chosen from the "
                "decision's costs — false positives vs false "
                "negatives rarely cost the same")
    _false_check(results, "honesty_and_live_use",
                 "no_metric_chosen_to_flatter", manifest,
                 ("honesty", "metric_chosen_to_flatter_present"),
                 "red line: no metric-chosen-to-flatter — the "
                 "published score is not selected to flatter a "
                 "forecaster")
    _false_check(results, "honesty_and_live_use",
                 "no_silent_score_rewrites", manifest,
                 ("honesty", "silent_score_rewrites_present"),
                 "red line: no silent updates — published scores "
                 "are never silently rewritten after resolution")
    _bool_check(results, "honesty_and_live_use",
                "live_scores_refreshed_on_resolution", manifest,
                ("honesty", "scores_refreshed_as_outcomes_resolve"),
                "drift & loops: monitor live performance — scores "
                "are refreshed as new outcomes resolve")

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
        verdict = "CONFIDENCE_SCOREBOARD_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CONFIDENCE_SCOREBOARD_SOUND"

    computed_names = (
        "forecasts_declared",
        "every_forecast_names_forecaster",
        "every_forecast_states_claim",
        "every_forecast_probability_in_range",
        "every_forecast_outcome_binary",
        "scoreboard_declared",
        "scoreboard_covers_every_forecaster",
        "every_scoreboard_forecast_count_matches_ledger",
        "every_scoreboard_mean_probability_matches",
        "every_scoreboard_hit_rate_matches",
        "every_scoreboard_brier_score_matches",
        "every_scoreboard_calibration_gap_matches",
        "scoreboard_ranks_complete_and_unique",
        "scoreboard_ranking_matches_brier_order",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "forecast-confidence-scoreboard",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "forecasts_count": forecasts_count,
        "forecasters_count": forecasters_count,
        "overall_mean_stated_probability": _fmt6(overall_mean),
        "overall_hit_rate": _fmt6(overall_hit),
        "overall_calibration_gap": _fmt6(overall_gap),
        "overall_brier_score": _fmt6(overall_brier),
        "calibration_direction": calibration_direction,
        "worst_calibrated_forecaster": worst_calibrated_forecaster,
        "forecasters_without_scoreboard_row":
            forecasters_without_scoreboard_row,
        "scoreboard_rows_without_forecasts":
            scoreboard_rows_without_forecasts,
        "mismatched_scoreboard_rows": mismatched_scoreboard_rows,
        "forecasters_with_wrong_rank": forecasters_with_wrong_rank,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "FORECAST CONFIDENCE SCOREBOARD",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: forecast_confidence_scoreboard.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CONFIDENCE_SCOREBOARD_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
