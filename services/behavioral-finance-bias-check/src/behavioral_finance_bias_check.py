#!/usr/bin/env python3
"""Behavioral finance bias check — deterministic core.

Built from the bound skill `behavioral-finance` (v1): "Keep your
brain out of the way — bias checks, pre-commitment, cooling-off,
and decision journals." This atom is a CHECK of a declared
investment-decision pack: it validates the bias-check record a
caller declares against the skill's bias playbook and its
counters, its pre-commitment / journal / watch-condition method
steps, its four quality gates, and its red lines. It does not
give investment advice, judge whether the decision itself is
wise, or verify that a declared value is true — it checks that
the record the skill requires is present and internally
complete on the declared evidence.

The caller submits a bias-check manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not merely declared, and use ONLY the
values the skill itself states or the caller declares as the
limit — no outside threshold is imported:

- the FOMO/chasing counter requires a 48h cooling-off (skill
  method step 1) — for a declared entry decision, the declared
  cooling-off hours elapsed pass at or above 48 and fail below
  it; equality passes, because the skill states a period, not a
  margin above it. For a non-entry decision the check passes as
  not applicable;
- the overconfidence counter requires sizing caps (skill method
  step 1) — the declared position size percent passes at or
  below the declared sizing cap percent and fails above it.
  Equality passes: the cap is a maximum.

Two further checks are gated, mirroring the skill's own scope:
a written thesis is required only for an entry decision ("no
entry without a written thesis"), and documented discussion
with the advisor set is required only for a major move ("for
major moves, discuss with the advisor set"). When the gating
field declares the situation does not apply, the gated check
passes as not applicable; when the gating field is absent, the
gated check is missing evidence.

The computed outcome is also reported as `computed_status`:
"outside_limits_on_declared_evidence" when either primary
computed check (sizing cap, cooling-off) fails,
"within_limits_on_declared_evidence" when both pass, otherwise
null. The position size's excess over the declared cap is
reported as `position_size_over_cap_percent`, and — for an
entry decision — the cooling-off shortfall against the stated
48 hours as `cooling_off_hours_below_48`, each a string with
exactly four decimal places produced in both implementations
by the same fixed rule: round half up to 4dp —
floor(v * 10000 + 0.5) / 10000 — then format with exactly four
decimals. Comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. The number of declared biases considered is
reported as `biases_considered_count` (null when no list is
declared).

Verdict:
- any fail             -> BIAS_CHECK_FAILED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> BIAS_CHECK_CLEAR

No model call, no network, no clock dependence: the same
manifest always produces the same check. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "bias_playbook",
    "precommitment_and_thesis",
    "cooling_off",
    "decision_journal",
    "watch_and_challenge",
    "temptation_and_red_lines",
)

STATED_COOLING_OFF_HOURS = 48

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "decision": "string",
    "decision_context": {
        "is_entry": "boolean",
        "is_major_move": "boolean",
    },
    "bias_playbook": {
        "loss_aversion_precommitted_exits_set": "boolean",
        "loss_aversion_reunderwritten_instead_of_waiting_to_get_even": "boolean",
        "anchoring_own_valuation_written_before_market_price_targets": "boolean",
        "recency_base_rates_and_long_windows_used": "boolean",
        "overconfidence_sizing_cap_percent": "number",
        "overconfidence_position_size_percent": "number",
        "confirmation_disconfirming_evidence_present": "boolean",
        "sunk_cost_would_buy_today_test_applied": "boolean",
        "biases_considered": [{
            "bias": "string",
            "counter_applied": "boolean",
        }],
    },
    "precommitment": {
        "written_rules_present": "boolean",
        "stop_levels_set": "boolean",
        "thesis_written": "boolean",
    },
    "cooling_off": {
        "hours_elapsed": "number",
        "periods_honored_for_impulsive_ideas": "boolean",
    },
    "journal": {
        "decision_recorded": "boolean",
        "expected_outcome_recorded": "boolean",
        "actual_outcome_and_lessons_recorded": "boolean",
        "current_with_outcomes_and_lessons": "boolean",
        "reviewed_monthly": "boolean",
        "hit_rate_tracked_honestly": "boolean",
    },
    "watch_and_challenge": {
        "continuous_price_watching": "boolean",
        "scheduled_reviews_used": "boolean",
        "notifications_off": "boolean",
        "devils_advocate_round_assigned": "boolean",
        "slept_on_material_changes": "boolean",
        "major_move_discussed_with_advisor_set_documented": "boolean",
    },
    "temptation_and_red_lines": {
        "one_click_trading_paths_removed": "boolean",
        "decision_driven_by_headlines": "boolean",
        "decision_driven_by_streaks": "boolean",
        "decision_driven_by_moods": "boolean",
        "journal_skipped_for_this_decision": "boolean",
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def evaluate(manifest):
    """Return the check dict for a behavioral-finance bias-check manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: bias_playbook (skill method step 1: the bias
    #      playbook, each bias paired with its counter) ----
    _bool_check(results, "bias_playbook",
                "loss_aversion_precommitted_exits_set", manifest,
                ("bias_playbook", "loss_aversion_precommitted_exits_set"),
                "loss aversion counter: pre-committed exits are set")
    _bool_check(results, "bias_playbook",
                "loss_aversion_reunderwritten_instead_of_waiting_to_get_even",
                manifest,
                ("bias_playbook",
                 "loss_aversion_reunderwritten_instead_of_waiting_to_get_even"),
                "loss aversion counter: the position is re-underwritten "
                "instead of held while waiting to get even")
    _bool_check(results, "bias_playbook",
                "anchoring_own_valuation_written_before_market_price_targets",
                manifest,
                ("bias_playbook",
                 "anchoring_own_valuation_written_before_market_price_targets"),
                "anchoring counter: your own valuation is written BEFORE "
                "reading the market's price targets")
    _bool_check(results, "bias_playbook",
                "recency_base_rates_and_long_windows_used", manifest,
                ("bias_playbook",
                 "recency_base_rates_and_long_windows_used"),
                "recency counter: base rates and long windows are used "
                "— one year is not a trend")
    cap, has_cap = _get(
        manifest, "bias_playbook", "overconfidence_sizing_cap_percent")
    size, has_size = _get(
        manifest, "bias_playbook", "overconfidence_position_size_percent")
    sizing_present = has_cap and _is_number(cap) and has_size \
        and _is_number(size)
    _check(results, "bias_playbook", "position_size_within_sizing_cap",
           size, sizing_present,
           sizing_present and size <= cap,
           "overconfidence counter: sizing caps — the declared "
           "position size percent is at or below the declared "
           "sizing cap percent")
    size_over_cap = (size - cap if sizing_present else None)
    _bool_check(results, "bias_playbook",
                "confirmation_disconfirming_evidence_present", manifest,
                ("bias_playbook",
                 "confirmation_disconfirming_evidence_present"),
                "confirmation counter: a mandatory "
                "disconfirming-evidence section is present in the "
                "thesis (also a quality gate: disconfirming evidence "
                "present in every thesis)")
    _bool_check(results, "bias_playbook",
                "sunk_cost_would_buy_today_test_applied", manifest,
                ("bias_playbook",
                 "sunk_cost_would_buy_today_test_applied"),
                "sunk cost counter: the 'would I buy this today at "
                "this price?' test is applied")
    biases, has_biases = _get(manifest, "bias_playbook", "biases_considered")
    biases_is_list = has_biases and isinstance(biases, list)
    biases_count = len(biases) if biases_is_list else None
    counters_ok = (biases_is_list and len(biases) > 0 and all(
        isinstance(b, dict) and b.get("counter_applied") is True
        for b in biases))
    _check(results, "bias_playbook",
           "all_considered_biases_have_counter_applied", biases,
           biases_is_list, counters_ok,
           "bias playbook with counters: every bias the caller "
           "declares considered carries its applied counter")

    # ---- Section 2: precommitment_and_thesis (skill method step
    #      2: pre-commitment — decisions made when calm and
    #      enforced when not; step 1 FOMO counter: no entry
    #      without a written thesis) ----
    _bool_check(results, "precommitment_and_thesis",
                "written_precommitment_rules_present", manifest,
                ("precommitment", "written_rules_present"),
                "pre-commitment: written rules exist — decisions get "
                "made when calm and enforced when not")
    _bool_check(results, "precommitment_and_thesis",
                "stop_levels_set", manifest,
                ("precommitment", "stop_levels_set"),
                "pre-commitment: stop levels are set — written rules, "
                "journal, and stop levels beat willpower")
    is_entry, has_entry = _get(manifest, "decision_context", "is_entry")
    thesis, has_thesis = _get(manifest, "precommitment", "thesis_written")
    if has_entry and is_entry:
        _check(results, "precommitment_and_thesis",
               "written_thesis_before_entry", thesis, has_thesis,
               thesis is True,
               "FOMO/chasing counter: no entry without a written thesis")
    else:
        _check(results, "precommitment_and_thesis",
               "written_thesis_before_entry", is_entry, has_entry, True,
               "not an entry decision")

    # ---- Section 3: cooling_off (skill method step 1: FOMO/
    #      chasing -> 48h cooling-off; quality gate: cooling-off
    #      periods honored for impulsive ideas) ----
    hours, has_hours = _get(manifest, "cooling_off", "hours_elapsed")
    hours_is_number = has_hours and _is_number(hours)
    if has_entry and is_entry:
        _check(results, "cooling_off",
               "cooling_off_hours_at_least_48", hours, hours_is_number,
               hours_is_number and hours >= STATED_COOLING_OFF_HOURS,
               "FOMO/chasing counter: 48h cooling-off — the declared "
               "cooling-off hours elapsed for this entry decision "
               "are at least 48")
        cooling_below = (STATED_COOLING_OFF_HOURS - hours
                         if hours_is_number else None)
    else:
        _check(results, "cooling_off",
               "cooling_off_hours_at_least_48", is_entry, has_entry,
               True, "not an entry decision")
        cooling_below = None
    _bool_check(results, "cooling_off",
                "cooling_off_periods_honored_for_impulsive_ideas",
                manifest,
                ("cooling_off", "periods_honored_for_impulsive_ideas"),
                "quality gate: cooling-off periods honored for "
                "impulsive ideas")

    # ---- Section 4: decision_journal (skill method step 3:
    #      journals — every decision + expected outcome + later
    #      actuals; review monthly; method step 1: track your hit
    #      rate honestly (journal); quality gate: journal current
    #      with outcomes + lessons) ----
    _bool_check(results, "decision_journal", "journal_decision_recorded",
                manifest, ("journal", "decision_recorded"),
                "journals: every decision is recorded in the journal")
    _bool_check(results, "decision_journal",
                "journal_expected_outcome_recorded", manifest,
                ("journal", "expected_outcome_recorded"),
                "journals: the expected outcome is recorded with "
                "the decision")
    _bool_check(results, "decision_journal",
                "journal_actual_outcome_and_lessons_recorded", manifest,
                ("journal", "actual_outcome_and_lessons_recorded"),
                "journals: later actuals are recorded against the "
                "decision")
    _bool_check(results, "decision_journal",
                "journal_current_with_outcomes_and_lessons", manifest,
                ("journal", "current_with_outcomes_and_lessons"),
                "quality gate: journal current with outcomes + lessons")
    _bool_check(results, "decision_journal", "journal_reviewed_monthly",
                manifest, ("journal", "reviewed_monthly"),
                "journals: the journal is reviewed monthly — "
                "patterns surface on review")
    _bool_check(results, "decision_journal",
                "hit_rate_tracked_honestly_in_journal", manifest,
                ("journal", "hit_rate_tracked_honestly"),
                "overconfidence counter: track your hit rate "
                "honestly (journal)")

    # ---- Section 5: watch_and_challenge (skill method step 4:
    #      watch conditions; step 5: committee tricks for solo
    #      investors; quality gate: review cadence held, not
    #      continuous watching) ----
    _false_check(results, "watch_and_challenge",
                 "no_continuous_price_watching", manifest,
                 ("watch_and_challenge", "continuous_price_watching"),
                 "watch conditions: no continuous price-watching "
                 "(also the quality gate: review cadence held, not "
                 "continuous watching)")
    _bool_check(results, "watch_and_challenge",
                "scheduled_reviews_used", manifest,
                ("watch_and_challenge", "scheduled_reviews_used"),
                "watch conditions: scheduled reviews are used instead "
                "of continuous watching")
    _bool_check(results, "watch_and_challenge", "notifications_off",
                manifest, ("watch_and_challenge", "notifications_off"),
                "watch conditions: notifications off — headlines are "
                "not data")
    _bool_check(results, "watch_and_challenge",
                "devils_advocate_round_assigned", manifest,
                ("watch_and_challenge", "devils_advocate_round_assigned"),
                "committee tricks: a devil's advocate round is "
                "assigned for big decisions")
    _bool_check(results, "watch_and_challenge",
                "slept_on_material_changes", manifest,
                ("watch_and_challenge", "slept_on_material_changes"),
                "committee tricks: material changes are slept on")
    is_major, has_major = _get(
        manifest, "decision_context", "is_major_move")
    discussed, has_discussed = _get(
        manifest, "watch_and_challenge",
        "major_move_discussed_with_advisor_set_documented")
    if has_major and is_major:
        _check(results, "watch_and_challenge",
               "major_move_discussed_with_advisor_set_documented",
               discussed, has_discussed, discussed is True,
               "committee tricks: for major moves, discuss with the "
               "advisor set (documented, not vibes)")
    else:
        _check(results, "watch_and_challenge",
               "major_move_discussed_with_advisor_set_documented",
               is_major, has_major, True, "not a major move")

    # ---- Section 6: temptation_and_red_lines (skill method step
    #      6: temptation architecture; red lines: no decisions
    #      driven by headlines, streaks, or moods; no skipped
    #      journals) ----
    _bool_check(results, "temptation_and_red_lines",
                "one_click_trading_paths_removed", manifest,
                ("temptation_and_red_lines",
                 "one_click_trading_paths_removed"),
                "temptation architecture: one-click trading paths "
                "are removed for the accounts that matter")
    _false_check(results, "temptation_and_red_lines",
                 "decision_not_driven_by_headlines", manifest,
                 ("temptation_and_red_lines",
                  "decision_driven_by_headlines"),
                 "red line: no decisions driven by headlines")
    _false_check(results, "temptation_and_red_lines",
                 "decision_not_driven_by_streaks", manifest,
                 ("temptation_and_red_lines", "decision_driven_by_streaks"),
                 "red line: no decisions driven by streaks")
    _false_check(results, "temptation_and_red_lines",
                 "decision_not_driven_by_moods", manifest,
                 ("temptation_and_red_lines", "decision_driven_by_moods"),
                 "red line: no decisions driven by moods")
    _false_check(results, "temptation_and_red_lines",
                 "journal_not_skipped_for_this_decision", manifest,
                 ("temptation_and_red_lines",
                  "journal_skipped_for_this_decision"),
                 "red line: no skipped journals — the process IS "
                 "the edge")

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
        verdict = "BIAS_CHECK_FAILED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "BIAS_CHECK_CLEAR"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("position_size_within_sizing_cap",
                          "cooling_off_hours_at_least_48")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "behavioral-finance-bias-check",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "biases_considered_count": biases_count,
        "position_size_over_cap_percent": _fmt4(size_over_cap),
        "cooling_off_hours_below_48": _fmt4(cooling_below),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a check dict."""
    lines = [
        "BEHAVIORAL FINANCE BIAS CHECK",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: behavioral_finance_bias_check.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "BIAS_CHECK_CLEAR" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
