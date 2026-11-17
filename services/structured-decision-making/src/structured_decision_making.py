#!/usr/bin/env python3
"""Structured decision making — deterministic core.

Built from the bound skill `decision-making` (v1): "Good decisions
are process, not intuition alone: frame -> options -> criteria ->
evaluate -> commit -> review. Speed where reversible; care where
not." Its method steps are this atom's record structure: classify
(reversible vs irreversible; stakes x reversibility sets the
effort budget); frame the actual decision (what, by when,
constraints, out-of-scope); generate at least three options
including "do nothing / wait" and a smaller reversible step;
criteria first (define what matters and weights BEFORE scoring
options — criteria after scores is rationalization); evaluate
with fitting tools (decision matrix for multi-criteria; expected
value / decision trees when probabilities are estimable;
scenario thinking when they are not; flag the uncertainty);
pre-mortem material decisions; commit + log (choice, rationale,
assumptions, review date; communicate with the "why"); review on
schedule (outcomes vs expectations; separate luck from process;
update). Its red lines are this atom's red lines: no decisions
without options; no criteria invented after scores; no
irreversible decision made in a rush or a mood.

This atom is a DELIVERABLE audit of a declared structured
decision record: ONE decision, as actually recorded — its
framing and classification, its declared options, its declared
criteria with declared weights, its declared decision-matrix
scores per option per criterion with declared weighted totals,
its declared evaluation method and uncertainty handling, its
pre-mortem declarations, its commit log and review plan, and
the red lines refused. It makes NO decision, recommends NO
option as the answer, ranks NO option for the caller, predicts
NOTHING, and gives no domain advice of any kind: it checks that
the decision record the skill requires is present and
internally consistent on the declared evidence, and it
recomputes the record's own declared arithmetic — the criteria
weight sum and every option's weighted total from its declared
scores x the declared criterion weights — exactly.

Distinct ground: `decision-process-design` audits how a
decision process is engineered (roles, pre-commitment, loss
function, rigor, evidence discipline); `decision-trap-sweep`
sweeps a declared record for the traps in the same bound skill
(boolean trap attestations, no matrix rows, no arithmetic);
`base-rate-card` audits one judgment card and recomputes its
declared base rate from reference-class counts;
`assumption-audit` audits a decision-process evidence manifest
of assumption attestations. This atom shares zero checks with
any of them: every check here is a question about the single
decision RECORD's row structure — named options of recognised
kinds including a status-quo and a smaller reversible step,
named criteria with declared non-negative weights summing to a
positive total, a complete score matrix over exactly the
declared criteria, scores inside the caller's own declared
scale, and declared weighted totals that recompute exactly
from the declared scores and weights — plus the framing,
evaluation-method, pre-mortem, commit/review and red-line
declarations the skill wraps around that matrix.

The caller submits a decision manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- option count: the skill states "at least three" options, so
  a declared list shorter than three fails (binary choices are
  usually false binaries);
- option kinds: every declared option names a kind, one of
  `action`, `status_quo`, `smaller_reversible_step`, and the
  declared rows must include at least one `status_quo` and at
  least one `smaller_reversible_step` (the skill's own required
  inclusions);
- criteria weights: every declared criterion declares a
  non-negative weight, and the declared weights must sum to a
  positive total (a matrix whose weights sum to zero scores
  nothing — internal consistency of the declared rows, not an
  imported bar; the skill states no weight-sum target such as
  1.0 or 100, so none is checked);
- score matrix: every declared option must score every declared
  criterion, score no criterion the record does not declare,
  and score no criterion twice; every score must lie inside
  the score scale the record itself declares
  (`evaluation.score_scale_min` .. `evaluation.score_scale_max`);
- weighted totals: every declared option's
  `declared_weighted_total` must recompute as
  sum(weight[criterion] x score) over the declared criteria,
  compared on the fixed 6dp serialization below;
- chosen option: the logged `log.chosen_option` must name a
  declared option row.

Computed quantities are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; weighted-total
comparisons are made on those 6dp serializations of the
recomputed and declared values. That fixed serialization is
what makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states no numeric threshold beyond "at least three"
options — no weight-sum target, no score-scale values of its
own, no minimum winning margin, no stakes level, no
probability or expected-value bar, no review interval — so no
such check is invented; those quantities are computed and
reported, or carried as caller declarations, with exact
recomputation and completeness over the caller's own declared
rows as the only bars, exactly as stated above. In particular
the atom NEVER checks that the chosen option is the option
with the highest recomputed total: the matrix is one declared
evaluation tool, and which option to commit to is the caller's
decision, never this atom's.

Verdict:
- any fail             -> DECISION_RECORD_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DECISION_RECORD_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "structured_framing",
    "structured_options",
    "structured_criteria",
    "structured_matrix_scoring",
    "structured_evaluation_and_uncertainty",
    "structured_pre_mortem",
    "structured_commit_log_and_review",
    "structured_red_lines",
)

CLASSIFICATIONS = ("reversible", "irreversible")
OPTION_KINDS = ("action", "status_quo", "smaller_reversible_step")
METHODS = ("decision_matrix", "expected_value", "decision_tree",
           "scenario_thinking")

MANIFEST_SPEC = {
    "decision": "string",
    "framing": {
        "decision_restated_crisp": "boolean",
        "decide_by_date_stated": "boolean",
        "constraints_named": "boolean",
        "out_of_scope_named": "boolean",
        "classification": "string",
        "stakes_assessed": "boolean",
        "effort_budget_matched_to_stakes_and_reversibility": "boolean",
        "slowed_deliberation_declared": "boolean",
    },
    "options": [{
        "name": "string",
        "kind": "string",
        "scores": [{
            "criterion": "string",
            "score": "number",
        }],
        "declared_weighted_total": "number",
    }],
    "criteria": [{
        "name": "string",
        "weight": "number",
        "defined_before_scoring": "boolean",
    }],
    "evaluation": {
        "method": "string",
        "score_scale_min": "number",
        "score_scale_max": "number",
        "probabilities_estimable": "boolean",
        "expected_value_used": "boolean",
        "scenario_thinking_used": "boolean",
        "uncertainty_flagged": "boolean",
        "base_rates_considered": "boolean",
    },
    "premortem": {
        "decision_is_material": "boolean",
        "conducted": "boolean",
        "failure_reasons_named": "boolean",
        "top_reasons_fixed_or_hedged": "boolean",
    },
    "log": {
        "choice_recorded": "boolean",
        "chosen_option": "string",
        "rationale_recorded": "boolean",
        "assumptions_recorded": "boolean",
        "communicated_with_why": "boolean",
    },
    "review": {
        "review_date_set": "boolean",
        "outcomes_vs_expectations_review_planned": "boolean",
        "luck_separated_from_process_declared": "boolean",
    },
    "red_lines": {
        "decision_without_options_present": "boolean",
        "criteria_invented_after_scores_present": "boolean",
        "irreversible_decision_rushed_present": "boolean",
        "irreversible_decision_made_in_mood_present": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _values_match(a, b):
    if not (isinstance(a, (int, float)) and not isinstance(a, bool)):
        return False
    if not (isinstance(b, (int, float)) and not isinstance(b, bool)):
        return False
    if math.isfinite(a) and math.isfinite(b):
        return _fmt6(a) == _fmt6(b)
    return a == b


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _row_name(entry, field="name"):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _score_rows(entry):
    if isinstance(entry, dict) and isinstance(entry.get("scores"), list):
        return entry["scores"]
    return None


def _score_criteria(entry):
    """Declared score-row criterion strings for one option row,
    or None when the option declares no scores list."""
    rows = _score_rows(entry)
    if rows is None:
        return None
    return [r["criterion"] for r in rows
            if isinstance(r, dict) and isinstance(r.get("criterion"), str)]


def _scores_complete_exact(entry, criteria_names, weights):
    """True when one option's score rows cover exactly the
    declared criteria, once each, with numeric scores, and the
    criteria weights needed to recompute its total all exist."""
    if weights is None:
        return False
    rows = _score_rows(entry)
    if rows is None:
        return False
    crits = _score_criteria(entry)
    if crits is None or len(crits) != len(rows):
        return False
    if sorted(crits) != sorted(criteria_names):
        return False
    return all(isinstance(r, dict) and _is_number(r.get("score"))
               for r in rows)


def _recomputed_total(entry, weights):
    scores = {r["criterion"]: r["score"] for r in _score_rows(entry)}
    total = 0.0
    for name, weight in weights.items():
        total += weight * scores[name]
    return total


def evaluate(manifest):
    """Return the verdict dict for a structured decision manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    options, has_options = _get(manifest, "options")
    options_is_list = has_options and isinstance(options, list)
    option_rows = options if options_is_list else []
    options_count = len(option_rows) if options_is_list else None

    criteria, has_criteria = _get(manifest, "criteria")
    criteria_is_list = has_criteria and isinstance(criteria, list)
    criteria_rows = criteria if criteria_is_list else []
    criteria_count = len(criteria_rows) if criteria_is_list else None

    duplicate_option_names = (
        _duplicates(option_rows, "name") if options_is_list else None)
    duplicate_criterion_names = (
        _duplicates(criteria_rows, "name") if criteria_is_list else None)

    criteria_names = (
        [c["name"] for c in criteria_rows
         if isinstance(c, dict) and isinstance(c.get("name"), str)]
        if criteria_is_list else None)
    criteria_names_complete = (
        criteria_is_list and len(criteria_rows) > 0
        and all(_has(c, "name") for c in criteria_rows)
        and criteria_names is not None
        and len(criteria_names) == len(criteria_rows))
    weights = None
    if (criteria_names_complete and duplicate_criterion_names == []
            and all(_is_number(c.get("weight")) for c in criteria_rows)):
        weights = {c["name"]: c["weight"] for c in criteria_rows}
    criteria_weights_sum = (
        sum(c["weight"] for c in criteria_rows)
        if criteria_is_list
        and all(_has(c, "weight") and _is_number(c.get("weight"))
                for c in criteria_rows) and len(criteria_rows) > 0
        else None)

    def scores_exact(entry):
        if criteria_names is None:
            return False
        return _scores_complete_exact(entry, criteria_names, weights)

    recomputed_totals = None
    if options_is_list and criteria_is_list:
        recomputed_totals = []
        for c in option_rows:
            total = (_recomputed_total(c, weights)
                     if scores_exact(c) else None)
            recomputed_totals.append(
                {"option": _row_name(c),
                 "recomputed_weighted_total": _fmt6(total)})
    options_without_complete_scores = (
        [_row_name(c) for c in option_rows if not scores_exact(c)]
        if options_is_list and criteria_is_list else None)
    options_with_total_mismatch = (
        [_row_name(c) for c in option_rows
         if scores_exact(c) and _has(c, "declared_weighted_total")
         and not _values_match(_recomputed_total(c, weights),
                               c.get("declared_weighted_total"))]
        if options_is_list and criteria_is_list else None)

    def covers_all_criteria(entry):
        crits = _score_criteria(entry)
        if crits is None or criteria_names is None:
            return False
        return all(n in crits for n in criteria_names)

    score_coverage_ratio = (
        sum(1 for c in option_rows if covers_all_criteria(c))
        / options_count
        if options_is_list and criteria_names_complete
        and options_count is not None and options_count > 0 else None)
    weighted_total_match_ratio = (
        sum(1 for c in option_rows
            if scores_exact(c) and _has(c, "declared_weighted_total")
            and _values_match(_recomputed_total(c, weights),
                              c.get("declared_weighted_total")))
        / options_count
        if options_is_list and weights is not None
        and options_count is not None and options_count > 0 else None)

    scale_min, has_scale_min = _get(manifest, "evaluation",
                                    "score_scale_min")
    scale_max, has_scale_max = _get(manifest, "evaluation",
                                    "score_scale_max")
    chosen_option, has_chosen = _get(manifest, "log", "chosen_option")

    # ---- Section 1: structured_framing (method 1-2: classify;
    #      frame the actual decision until it is crisp) ----
    _bool_check(results, "structured_framing",
                "structured_framing_decision_restated_crisp", manifest,
                ("framing", "decision_restated_crisp"),
                "frame: the actual decision is restated until it is "
                "crisp — what needs deciding is stated")
    _bool_check(results, "structured_framing",
                "structured_framing_decide_by_date_stated", manifest,
                ("framing", "decide_by_date_stated"),
                "frame: by when the decision must be made is stated")
    _bool_check(results, "structured_framing",
                "structured_framing_constraints_named", manifest,
                ("framing", "constraints_named"),
                "frame: the constraints on the decision are named")
    _bool_check(results, "structured_framing",
                "structured_framing_out_of_scope_named", manifest,
                ("framing", "out_of_scope_named"),
                "frame: what is out of scope for the decision is named")
    classification, has_classification = _get(
        manifest, "framing", "classification")
    _check(results, "structured_framing",
           "structured_classification_is_reversible_or_irreversible",
           classification, has_classification,
           classification in CLASSIFICATIONS,
           "classify: the decision is classified reversible or "
           "irreversible — speed where reversible, care where not")
    _bool_check(results, "structured_framing",
                "structured_framing_stakes_assessed", manifest,
                ("framing", "stakes_assessed"),
                "classify: the stakes of the decision are assessed — "
                "stakes x reversibility sets the effort budget")
    _bool_check(results, "structured_framing",
                "structured_effort_budget_matched_to_stakes_and_reversibility",
                manifest,
                ("framing",
                 "effort_budget_matched_to_stakes_and_reversibility"),
                "classify: the effort spent on the decision is declared "
                "matched to its stakes and reversibility")
    irreversible = has_classification and classification == "irreversible"
    slowed, has_slowed = _get(manifest, "framing",
                              "slowed_deliberation_declared")
    if irreversible:
        _check(results, "structured_framing",
               "structured_slowed_deliberation_when_irreversible",
               slowed, has_slowed, slowed is True,
               "classify: an irreversible decision is slowed down and "
               "deliberated, not decided fast")
    else:
        _check(results, "structured_framing",
               "structured_slowed_deliberation_when_irreversible",
               classification, has_classification, True,
               "decision is not classified irreversible — slowed "
               "deliberation is not required by the classification")

    # ---- Section 2: structured_options (method 3: at least
    #      three options incl. status quo and a smaller step) ----
    _check(results, "structured_options",
           "structured_options_list_declares_at_least_three", options,
           options_is_list,
           options_is_list and options_count is not None
           and options_count >= 3,
           "options: the declared record names at least three options "
           "— binary choices are usually false binaries; an absent "
           "list is missing evidence and a shorter list fails")
    name_present = (options_is_list
                    and all(_has(c, "name") for c in option_rows))
    _check(results, "structured_options",
           "structured_every_option_row_names_the_option", options,
           name_present,
           options_is_list
           and all(_nonempty_str(c.get("name")) for c in option_rows),
           "options: every declared option row names the option "
           "(a non-empty name)")
    _check(results, "structured_options",
           "structured_option_names_are_unique", options, name_present,
           options_is_list and duplicate_option_names is not None
           and len(duplicate_option_names) == 0,
           "options: no declared option name is owned by more than "
           "one row")
    kind_present = (options_is_list
                    and all(_has(c, "kind") for c in option_rows))
    _check(results, "structured_options",
           "structured_every_option_kind_is_recognised", options,
           kind_present,
           options_is_list
           and all(isinstance(c, dict) and c.get("kind") in OPTION_KINDS
                   for c in option_rows),
           "options: every declared option's kind is one of action, "
           "status_quo, smaller_reversible_step")
    _check(results, "structured_options",
           "structured_options_include_a_status_quo_row", options,
           kind_present,
           options_is_list
           and any(isinstance(c, dict) and c.get("kind") == "status_quo"
                   for c in option_rows),
           "options: the declared rows include a status-quo option "
           "('do nothing / wait')")
    _check(results, "structured_options",
           "structured_options_include_a_smaller_reversible_step_row",
           options, kind_present,
           options_is_list
           and any(isinstance(c, dict)
                   and c.get("kind") == "smaller_reversible_step"
                   for c in option_rows),
           "options: the declared rows include a smaller reversible "
           "step option")

    # ---- Section 3: structured_criteria (method 4: criteria
    #      first, weights before scoring) ----
    _check(results, "structured_criteria",
           "structured_criteria_list_is_declared", criteria,
           criteria_is_list,
           criteria_is_list and criteria_count is not None
           and criteria_count > 0,
           "criteria: the declared record names its criteria — the "
           "criteria list is present and names at least one "
           "criterion; an absent list is missing evidence and an "
           "empty list declares no criteria at all")
    crit_name_present = (criteria_is_list
                         and all(_has(c, "name") for c in criteria_rows))
    _check(results, "structured_criteria",
           "structured_every_criterion_row_names_the_criterion",
           criteria, crit_name_present,
           criteria_is_list
           and all(_nonempty_str(c.get("name")) for c in criteria_rows),
           "criteria: every declared criterion row names the "
           "criterion (a non-empty name)")
    _check(results, "structured_criteria",
           "structured_criterion_names_are_unique", criteria,
           crit_name_present,
           criteria_is_list and duplicate_criterion_names is not None
           and len(duplicate_criterion_names) == 0,
           "criteria: no declared criterion name is owned by more "
           "than one row")
    weight_present = (criteria_is_list
                      and all(_has(c, "weight") for c in criteria_rows))
    _check(results, "structured_criteria",
           "structured_every_criterion_weight_is_nonnegative", criteria,
           weight_present,
           criteria_is_list
           and all(_is_number(c.get("weight")) and c.get("weight") >= 0
                   for c in criteria_rows),
           "criteria: every declared criterion declares a "
           "non-negative weight")
    _check(results, "structured_criteria",
           "structured_criteria_weights_sum_is_positive", criteria,
           weight_present,
           criteria_weights_sum is not None and criteria_weights_sum > 0,
           "criteria: the declared criterion weights sum to a "
           "positive total — a matrix whose weights sum to zero "
           "scores nothing")
    before_present = (criteria_is_list and all(
        _has(c, "defined_before_scoring") for c in criteria_rows))
    _check(results, "structured_criteria",
           "structured_every_criterion_defined_before_scoring", criteria,
           before_present,
           criteria_is_list
           and all(c.get("defined_before_scoring") is True
                   for c in criteria_rows),
           "criteria: every declared criterion is declared defined "
           "before scoring — criteria first, weights before scores")

    # ---- Section 4: structured_matrix_scoring (method 5: the
    #      decision matrix — a complete score matrix whose
    #      declared weighted totals recompute exactly) ----
    matrix_present = (
        options_is_list and criteria_names_complete is True
        and all(_has(c, "scores") for c in option_rows)
        and all(_score_criteria(c) is not None
                and len(_score_criteria(c)) == len(_score_rows(c))
                for c in option_rows))
    _check(results, "structured_matrix_scoring",
           "structured_every_option_scores_every_declared_criterion",
           options, matrix_present,
           options_is_list and criteria_names_complete is True
           and len(option_rows) > 0
           and all(covers_all_criteria(c) for c in option_rows),
           "matrix: every declared option scores every declared "
           "criterion — the score matrix is complete over the "
           "record's own declared criteria")
    _check(results, "structured_matrix_scoring",
           "structured_no_option_scores_an_undeclared_criterion",
           options, matrix_present,
           options_is_list and criteria_names is not None
           and all(all(cr in criteria_names
                       for cr in (_score_criteria(c) or []))
                   for c in option_rows),
           "matrix: no declared option scores a criterion the "
           "record does not declare")
    _check(results, "structured_matrix_scoring",
           "structured_no_option_scores_a_criterion_twice", options,
           matrix_present,
           options_is_list
           and all(len(_score_criteria(c) or [])
                   == len(set(_score_criteria(c) or []))
                   for c in option_rows),
           "matrix: no declared option scores the same criterion "
           "on more than one score row")
    scale_present = has_scale_min and has_scale_max
    _check(results, "structured_matrix_scoring",
           "structured_score_scale_bounds_are_coherent", scale_min,
           scale_present,
           scale_present and _is_number(scale_min)
           and _is_number(scale_max) and scale_min <= scale_max,
           "matrix: the record's declared score scale bounds are "
           "coherent — score_scale_min does not exceed "
           "score_scale_max")
    scores_present = (
        options_is_list and scale_present
        and all(_has(c, "scores") for c in option_rows)
        and all(_score_rows(c) is not None
                and all(isinstance(r, dict) and _has(r, "score")
                        for r in _score_rows(c))
                for c in option_rows))
    _check(results, "structured_matrix_scoring",
           "structured_every_score_lies_within_the_declared_scale",
           options, scores_present,
           scores_present and len(option_rows) > 0
           and all(_is_number(r.get("score"))
                   and scale_min <= r.get("score") <= scale_max
                   for c in option_rows for r in _score_rows(c)),
           "matrix: every declared score lies within the score "
           "scale the record itself declares")
    totals_present = (
        options_is_list and weights is not None
        and all(scores_exact(c) for c in option_rows)
        and all(_has(c, "declared_weighted_total") for c in option_rows))
    _check(results, "structured_matrix_scoring",
           "structured_every_declared_weighted_total_recomputes",
           options, totals_present,
           totals_present and len(option_rows) > 0
           and all(_values_match(_recomputed_total(c, weights),
                                 c.get("declared_weighted_total"))
                   for c in option_rows),
           "matrix: every declared option's declared weighted total "
           "recomputes exactly as sum(declared criterion weight x "
           "declared score) over the declared criteria (6dp "
           "serialization)")

    # ---- Section 5: structured_evaluation_and_uncertainty
    #      (method 5: fitting tools; flag the uncertainty) ----
    method, has_method = _get(manifest, "evaluation", "method")
    _check(results, "structured_evaluation_and_uncertainty",
           "structured_evaluation_method_is_recognised", method,
           has_method, method in METHODS,
           "evaluation: the declared evaluation method is one of "
           "decision_matrix, expected_value, decision_tree, "
           "scenario_thinking — a fitting tool for the decision")
    _bool_check(results, "structured_evaluation_and_uncertainty",
                "structured_evaluation_uncertainty_is_flagged", manifest,
                ("evaluation", "uncertainty_flagged"),
                "evaluation: the uncertainty in the evaluation is "
                "flagged")
    _bool_check(results, "structured_evaluation_and_uncertainty",
                "structured_evaluation_base_rates_are_considered",
                manifest, ("evaluation", "base_rates_considered"),
                "evaluation: base-rate / reference information is "
                "declared considered before the inside view of this "
                "decision (its arithmetic, if any, is the "
                "base-rate-card atom's ground, not this record's)")
    _gated_bool_check(
        results, "structured_evaluation_and_uncertainty",
        "structured_expected_value_used_when_probabilities_estimable",
        manifest, ("evaluation", "probabilities_estimable"),
        ("evaluation", "expected_value_used"),
        "evaluation: when probabilities are declared estimable, "
        "expected value / decision-tree evaluation is declared used",
        "probabilities are not declared estimable — expected-value "
        "evaluation is not required")
    estimable, has_estimable = _get(manifest, "evaluation",
                                    "probabilities_estimable")
    scenario, has_scenario = _get(manifest, "evaluation",
                                  "scenario_thinking_used")
    if has_estimable and estimable is False:
        _check(results, "structured_evaluation_and_uncertainty",
               "structured_scenario_thinking_used_when_probabilities_not_estimable",
               scenario, has_scenario, scenario is True,
               "evaluation: when probabilities are declared not "
               "estimable, scenario thinking is declared used")
    else:
        _check(results, "structured_evaluation_and_uncertainty",
               "structured_scenario_thinking_used_when_probabilities_not_estimable",
               estimable, has_estimable, True,
               "probabilities are not declared non-estimable — "
               "scenario thinking is not the required fitting tool")

    # ---- Section 6: structured_pre_mortem (method 6, quality
    #      gate: pre-mortem done for material decisions) ----
    _gated_bool_check(
        results, "structured_pre_mortem",
        "structured_premortem_conducted_when_decision_is_material",
        manifest, ("premortem", "decision_is_material"),
        ("premortem", "conducted"),
        "pre-mortem: for a material decision a pre-mortem is "
        "declared conducted — assume it failed, why?",
        "decision is not declared material — a pre-mortem is not "
        "required by the quality gate")
    _gated_bool_check(
        results, "structured_pre_mortem",
        "structured_premortem_failure_reasons_named_when_material",
        manifest, ("premortem", "decision_is_material"),
        ("premortem", "failure_reasons_named"),
        "pre-mortem: the pre-mortem's failure reasons are declared "
        "named for a material decision",
        "decision is not declared material — pre-mortem failure "
        "reasons are not required")
    _gated_bool_check(
        results, "structured_pre_mortem",
        "structured_premortem_top_reasons_fixed_or_hedged_when_material",
        manifest, ("premortem", "decision_is_material"),
        ("premortem", "top_reasons_fixed_or_hedged"),
        "pre-mortem: the pre-mortem's top reasons are declared "
        "fixed or hedged now, for a material decision",
        "decision is not declared material — pre-mortem hedging "
        "is not required")

    # ---- Section 7: structured_commit_log_and_review (method
    #      7-8: commit + log; review on schedule) ----
    _bool_check(results, "structured_commit_log_and_review",
                "structured_log_choice_is_recorded", manifest,
                ("log", "choice_recorded"),
                "commit: the choice is recorded in the decision log")
    option_names = (
        [c["name"] for c in option_rows
         if isinstance(c, dict) and isinstance(c.get("name"), str)]
        if options_is_list else None)
    chosen_present = has_chosen and options_is_list
    _check(results, "structured_commit_log_and_review",
           "structured_logged_chosen_option_matches_a_declared_option",
           chosen_option, chosen_present,
           chosen_present and isinstance(chosen_option, str)
           and option_names is not None and chosen_option in option_names,
           "commit: the logged chosen option names a declared "
           "option row — the log commits to an option the record "
           "actually evaluated (which option is chosen is the "
           "caller's decision; this atom never checks it against "
           "the recomputed totals)")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_log_rationale_is_recorded", manifest,
                ("log", "rationale_recorded"),
                "commit: the rationale for the choice is recorded")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_log_assumptions_are_recorded", manifest,
                ("log", "assumptions_recorded"),
                "commit: the assumptions behind the choice are "
                "recorded in the log")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_log_decision_communicated_with_why", manifest,
                ("log", "communicated_with_why"),
                "commit: the decision is declared communicated with "
                "the 'why'")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_review_date_is_set", manifest,
                ("review", "review_date_set"),
                "review: a review date is set — review on schedule")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_review_compares_outcomes_to_expectations",
                manifest,
                ("review", "outcomes_vs_expectations_review_planned"),
                "review: the review is declared to compare outcomes "
                "against the expectations recorded at commit time")
    _bool_check(results, "structured_commit_log_and_review",
                "structured_review_separates_luck_from_process", manifest,
                ("review", "luck_separated_from_process_declared"),
                "review: the review is declared to separate luck "
                "from process and update the record")

    # ---- Section 8: structured_red_lines (skill Red lines) ----
    _false_check(results, "structured_red_lines",
                 "structured_record_free_of_decision_without_options",
                 manifest,
                 ("red_lines", "decision_without_options_present"),
                 "red line: no decision without options is present "
                 "in the record")
    _false_check(results, "structured_red_lines",
                 "structured_record_free_of_criteria_invented_after_scores",
                 manifest,
                 ("red_lines", "criteria_invented_after_scores_present"),
                 "red line: no criteria invented after scores are "
                 "present in the record")
    _false_check(results, "structured_red_lines",
                 "structured_record_free_of_irreversible_decision_rushed",
                 manifest,
                 ("red_lines", "irreversible_decision_rushed_present"),
                 "red line: no irreversible decision made in a rush "
                 "is present in the record")
    _false_check(results, "structured_red_lines",
                 "structured_record_free_of_irreversible_decision_in_a_mood",
                 manifest,
                 ("red_lines",
                  "irreversible_decision_made_in_mood_present"),
                 "red line: no irreversible decision made in a mood "
                 "is present in the record")

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
        verdict = "DECISION_RECORD_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DECISION_RECORD_SOUND"

    computed_names = (
        "structured_classification_is_reversible_or_irreversible",
        "structured_slowed_deliberation_when_irreversible",
        "structured_options_list_declares_at_least_three",
        "structured_option_names_are_unique",
        "structured_criteria_list_is_declared",
        "structured_criterion_names_are_unique",
        "structured_criteria_weights_sum_is_positive",
        "structured_every_option_scores_every_declared_criterion",
        "structured_no_option_scores_an_undeclared_criterion",
        "structured_no_option_scores_a_criterion_twice",
        "structured_score_scale_bounds_are_coherent",
        "structured_every_score_lies_within_the_declared_scale",
        "structured_every_declared_weighted_total_recomputes",
        "structured_logged_chosen_option_matches_a_declared_option",
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
        "service": "structured-decision-making",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "options_count": options_count,
        "criteria_count": criteria_count,
        "duplicate_option_names": duplicate_option_names,
        "duplicate_criterion_names": duplicate_criterion_names,
        "criteria_weights_sum": _fmt6(criteria_weights_sum),
        "recomputed_weighted_totals": recomputed_totals,
        "options_with_weighted_total_mismatch":
            options_with_total_mismatch,
        "options_without_complete_scores":
            options_without_complete_scores,
        "score_coverage_ratio": _fmt6(score_coverage_ratio),
        "weighted_total_match_ratio": _fmt6(weighted_total_match_ratio),
        "chosen_option": chosen_option if has_chosen else None,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "STRUCTURED DECISION MAKING",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: structured_decision_making.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DECISION_RECORD_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
