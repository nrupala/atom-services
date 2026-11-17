#!/usr/bin/env python3
"""Tech stack decision memo — deterministic core.

Built from the bound skill `tech-stack-architect`: "Chooses
technology stacks for the requirement and the team that must
run them — decided like one-way doors, not fashion." Its method
in brief is this atom's record structure: frame the decision
from the hard constraints (security model, regulatory,
performance, offline), the access/usage patterns, the
operability cost (who runs this at 2am) and the exit cost if
the choice is wrong; apply a boring-technology bias (proven,
well-understood tools for the plumbing; the limited novelty
budget spent only where it actually differentiates); weigh
total cost of ownership — licensing, ops burden, learning
curve and lock-in, not just the sticker — and, for free-tier
choices, name the hidden fragility cost explicitly; and keep
reversibility — isolate vendor-specific pieces behind
interfaces and always keep an exit path. Its anti-patterns to
refuse are this atom's red lines: framework-of-the-week;
microservices for a solo project; Docker-by-default; lock-in
with no exit; choosing tech to pad a CV.

This atom is a DELIVERABLE audit of a declared tech-stack
decision memo record: it audits the record a caller declares —
the context and constraints, the declared candidate rows, the
declared evaluation-criteria rows with their declared weights,
the declared per-candidate scores and declared weighted
totals, the evidence notes, the total-cost and operability
declarations, the decision and rationale declarations with a
declared ranking, the risk/reversibility and exit
declarations, and the red lines refused. It issues NO
recommendation and picks NO stack: every skill step that
recommends, chooses, ranks or applies a default stack is
EXCLUDED from this atom by name — choosing a stack for a
requirement, recommending a candidate, ranking candidates as
the atom's own output, applying Nrupal's house stack defaults
(frontend, backend, data, hosting or security defaults named
in the skill) as a prescription or a conformity bar, and
judging that the chosen stack is the right stack are each
excluded; the atom checks only that the memo record the skill
requires is present and internally consistent on the declared
evidence, and it recomputes the record's own declared
arithmetic exactly. Checking a DECLARED ranking's internal
consistency (it lists exactly the declared candidates) is
audit, not advice: the atom never produces a ranking, never
checks that the chosen candidate is the top-ranked or
highest-scoring one, and never treats a declared score as its
own judgment.

Distinct ground: the nearest siblings are
`architecture-decision-record` (a single decision's ADR —
context, decision, consequences, status, one-page form),
`framework-adoption-adr` (the adoption record for taking on
one framework — fit criteria, house-stack conformity, pinning)
and `structured-decision-making` (a general decision process —
frame, options, criteria, evaluate, commit, review for any
decision). This atom shares zero checks with any of them:
every check here is a tech-stack memo question — hard
constraints, access/usage patterns and team-of-one operability
framing for a stack choice, candidate stacks classified proven
or novel under a declared novelty budget, stack-evaluation
criteria with declared weights and per-candidate stack scores
whose declared weighted totals recompute, licensing / ops /
learning-curve / lock-in total cost with the hidden fragility
cost of a free choice named, a declared stack ranking that
matches the declared candidates exactly, and exit cost /
exit path / vendor isolation for the stack. The boundary is:
one comparative stack-selection memo here; a single decision's
ADR, one framework's adoption record, and a general decision
process there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- candidates: at least two declared rows (a memo that selects
  between stacks is comparative by the record's own framing;
  one row compares nothing), unique candidate ids, a non-empty
  stack name and a non-empty evidence note on every row, and
  every novelty classification one of `proven` / `novel` (the
  two classes the skill's boring-technology bias works with);
- criteria: at least one declared row, unique criterion ids,
  a non-empty criterion name on every row, every declared
  weight non-negative, and the declared weights summing to a
  positive total (a memo whose weights sum to zero scores
  nothing — internal consistency, not an imported target; the
  skill states no weight-sum target such as 1 or 100, so none
  is checked);
- scores: every declared candidate scores every declared
  criterion and no other criterion, exactly once;
- weighted totals: every declared candidate's
  `weighted_total_declared` recomputes as sum(declared weight
  x declared score) over its declared scores, compared on the
  fixed 6dp serialization below;
- decision: the declared chosen candidate id names one of the
  declared candidates, and the declared ranking list is
  exactly the declared candidate ids — none missing, none
  extra, none duplicated;
- gated declaration: the hidden fragility cost is required
  only where a free-tier or free choice is declared used.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
team size, no cost ceiling, no exit-cost amount, no score
scale, no winning margin, no novelty-budget percentage — so
no such check is invented; those quantities are caller
declarations at most, and quantities here are computed and
reported, with exact recomputation and completeness over the
caller's own declared rows as the only bars.

Verdict:
- any fail             -> TECH_STACK_DECISION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TECH_STACK_DECISION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "context_and_constraints",
    "candidates_and_boring_technology",
    "evaluation_criteria_and_evidence",
    "total_cost_and_operability",
    "decision_and_rationale",
    "reversibility_and_exit",
    "red_lines",
)

NOVELTY_CLASSIFICATIONS = ("proven", "novel")

MANIFEST_SPEC = {
    "memo_title": "string",
    "context": {
        "hard_constraints_declared": "boolean",
        "security_model_constraint_addressed": "boolean",
        "regulatory_constraint_addressed": "boolean",
        "performance_constraint_addressed": "boolean",
        "offline_constraint_addressed": "boolean",
        "access_patterns_declared": "boolean",
        "usage_patterns_declared": "boolean",
        "team_operability_context_declared": "boolean",
        "decision_framed_as_sticky": "boolean",
    },
    "candidate_work": {
        "candidates_compared_against_same_hard_constraints": "boolean",
        "boring_technology_bias_addressed": "boolean",
        "novelty_budget_allocation_declared": "boolean",
        "novelty_spend_tied_to_differentiation_declared": "boolean",
    },
    "candidates": [{
        "candidate_id": "string",
        "stack_name": "string",
        "novelty_classification": "string",
        "evidence_note": "string",
        "scores": [{
            "criterion_id": "string",
            "score": "number",
        }],
        "weighted_total_declared": "number",
    }],
    "evaluation": {
        "evidence_basis_recorded": "boolean",
        "evaluation_applied_consistently_across_candidates": "boolean",
    },
    "criteria": [{
        "criterion_id": "string",
        "criterion_name": "string",
        "weight": "number",
    }],
    "tco": {
        "licensing_cost_addressed": "boolean",
        "operations_burden_addressed": "boolean",
        "learning_curve_addressed": "boolean",
        "lock_in_cost_addressed": "boolean",
        "operability_cost_addressed": "boolean",
        "on_call_operability_owner_declared": "boolean",
        "team_can_operate_declared_stack": "boolean",
        "free_tier_or_free_choice_used": "boolean",
        "hidden_fragility_cost_named": "boolean",
    },
    "decision": {
        "decision_recorded": "boolean",
        "chosen_candidate_id": "string",
        "rationale_recorded": "boolean",
        "rationale_tied_to_hard_constraints": "boolean",
        "rationale_tied_to_evaluation_criteria": "boolean",
        "tradeoffs_of_decision_recorded": "boolean",
        "declared_ranking_candidate_ids": ["string"],
    },
    "reversibility": {
        "exit_cost_assessed": "boolean",
        "exit_path_kept": "boolean",
        "vendor_specific_pieces_isolated_behind_interfaces": "boolean",
        "reversibility_assessed": "boolean",
    },
    "red_lines": {
        "framework_of_the_week_chosen_for_novelty_present": "boolean",
        "microservices_for_solo_project_present": "boolean",
        "docker_by_default_choice_present": "boolean",
        "lock_in_with_no_exit_present": "boolean",
        "technology_chosen_to_pad_cv_present": "boolean",
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


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


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


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def _str_duplicates(values):
    seen = []
    dups = []
    for nm in values:
        if isinstance(nm, str):
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a tech stack decision memo."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    candidates, has_candidates = _get(manifest, "candidates")
    cand_is_list = has_candidates and isinstance(candidates, list)
    cand_count = len(candidates) if cand_is_list else None
    cand_rows = candidates if cand_is_list else []
    candidate_ids = _ids(cand_rows, "candidate_id")

    criteria, has_criteria = _get(manifest, "criteria")
    crit_is_list = has_criteria and isinstance(criteria, list)
    crit_count = len(criteria) if crit_is_list else None
    crit_rows = criteria if crit_is_list else []
    criterion_ids = _ids(crit_rows, "criterion_id")

    ranking, has_ranking = _get(
        manifest, "decision", "declared_ranking_candidate_ids")
    ranking_is_list = has_ranking and isinstance(ranking, list)
    ranking_rows = ranking if ranking_is_list else []

    chosen, has_chosen = _get(manifest, "decision", "chosen_candidate_id")

    duplicate_candidate_ids = (
        _duplicates(cand_rows, "candidate_id") if cand_is_list else None)
    duplicate_criterion_ids = (
        _duplicates(crit_rows, "criterion_id") if crit_is_list else None)
    duplicate_ranking_ids = (
        _str_duplicates(ranking_rows) if ranking_is_list else None)

    candidates_without_stack_name = (
        [_row_name(c, "candidate_id") for c in cand_rows
         if _has(c, "stack_name") and not _nonempty_str(c.get("stack_name"))]
        if cand_is_list else None)
    candidates_with_invalid_novelty = (
        [_row_name(c, "candidate_id") for c in cand_rows
         if _has(c, "novelty_classification")
         and c.get("novelty_classification") not in NOVELTY_CLASSIFICATIONS]
        if cand_is_list else None)
    candidates_without_evidence_note = (
        [_row_name(c, "candidate_id") for c in cand_rows
         if _has(c, "evidence_note")
         and not _nonempty_str(c.get("evidence_note"))]
        if cand_is_list else None)
    criteria_without_name = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "criterion_name")
         and not _nonempty_str(c.get("criterion_name"))]
        if crit_is_list else None)
    criteria_with_invalid_weight = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "weight")
         and not (isinstance(c.get("weight"), (int, float))
                  and not isinstance(c.get("weight"), bool)
                  and c.get("weight") >= 0)]
        if crit_is_list else None)

    weight_by_criterion = {}
    if crit_is_list:
        for c in crit_rows:
            if (isinstance(c, dict)
                    and isinstance(c.get("criterion_id"), str)
                    and isinstance(c.get("weight"), (int, float))
                    and not isinstance(c.get("weight"), bool)):
                weight_by_criterion[c["criterion_id"]] = c["weight"]
    weights_sum = None
    if crit_is_list:
        weights_sum = 0.0
        for cid in weight_by_criterion:
            weights_sum += weight_by_criterion[cid]

    def _score_ids(c):
        scores = c.get("scores") if isinstance(c, dict) else None
        if not isinstance(scores, list):
            return None
        return [s["criterion_id"] for s in scores
                if isinstance(s, dict)
                and isinstance(s.get("criterion_id"), str)]

    def _scores_cover(c):
        sids = _score_ids(c)
        if sids is None:
            return False
        return (len(sids) == len(criterion_ids)
                and len(set(sids)) == len(sids)
                and all(sid in criterion_ids for sid in sids)
                and all(cid in sids for cid in criterion_ids))

    def _recomputed_total(c):
        scores = c.get("scores") if isinstance(c, dict) else None
        if not isinstance(scores, list):
            return None
        total_val = 0.0
        for s in scores:
            if (isinstance(s, dict)
                    and isinstance(s.get("criterion_id"), str)
                    and s.get("criterion_id") in weight_by_criterion
                    and isinstance(s.get("score"), (int, float))
                    and not isinstance(s.get("score"), bool)):
                total_val += weight_by_criterion[s["criterion_id"]] * s["score"]
        return total_val

    def _total_matches(c):
        if not _has(c, "weighted_total_declared"):
            return False
        rec = _recomputed_total(c)
        if rec is None:
            return False
        declared = c.get("weighted_total_declared")
        if not (isinstance(declared, (int, float))
                and not isinstance(declared, bool)):
            return False
        return _fmt6(rec) == _fmt6(declared)

    candidates_with_incomplete_scores = (
        [_row_name(c, "candidate_id") for c in cand_rows
         if _has(c, "scores") and not _scores_cover(c)]
        if cand_is_list and crit_is_list else None)
    candidates_with_total_mismatch = (
        [_row_name(c, "candidate_id") for c in cand_rows
         if _has(c, "weighted_total_declared") and _has(c, "scores")
         and not _total_matches(c)]
        if cand_is_list and crit_is_list else None)

    ranking_missing = None
    ranking_extra = None
    if cand_is_list and ranking_is_list:
        ranking_missing = []
        for cid in candidate_ids:
            if cid not in ranking_rows and cid not in ranking_missing:
                ranking_missing.append(cid)
        ranking_extra = []
        for rid in ranking_rows:
            if (isinstance(rid, str) and rid not in candidate_ids
                    and rid not in ranking_extra):
                ranking_extra.append(rid)

    score_coverage_ratio = (
        sum(1 for c in cand_rows if _scores_cover(c)) / cand_count
        if cand_is_list and crit_is_list and cand_count > 0 else None)
    weighted_total_match_ratio = (
        sum(1 for c in cand_rows if _total_matches(c)) / cand_count
        if cand_is_list and crit_is_list and cand_count > 0 else None)
    candidate_evidence_ratio = (
        sum(1 for c in cand_rows
            if _nonempty_str(c.get("evidence_note"))) / cand_count
        if cand_is_list and cand_count > 0 else None)

    # ---- Section 1: context_and_constraints ----
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_hard_constraints_declared", manifest,
                ("context", "hard_constraints_declared"),
                "decision frame: the memo declares its hard constraints")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_security_model_constraint_addressed", manifest,
                ("context", "security_model_constraint_addressed"),
                "decision frame: the security-model hard constraint is addressed")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_regulatory_constraint_addressed", manifest,
                ("context", "regulatory_constraint_addressed"),
                "decision frame: the regulatory hard constraint is addressed")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_performance_constraint_addressed", manifest,
                ("context", "performance_constraint_addressed"),
                "decision frame: the performance hard constraint is addressed")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_offline_constraint_addressed", manifest,
                ("context", "offline_constraint_addressed"),
                "decision frame: the offline hard constraint is addressed")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_access_patterns_declared", manifest,
                ("context", "access_patterns_declared"),
                "decision frame: the access patterns the stack must serve are declared")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_usage_patterns_declared", manifest,
                ("context", "usage_patterns_declared"),
                "decision frame: the usage patterns the stack must serve are declared")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_team_operability_context_declared", manifest,
                ("context", "team_operability_context_declared"),
                "decision frame: the team that must run the stack — its size and capability — is declared")
    _bool_check(results, "context_and_constraints",
                "tech_stack_memo_decision_framed_as_sticky", manifest,
                ("context", "decision_framed_as_sticky"),
                "decision frame: the stack choice is framed as sticky — decided like a one-way door, not fashion")

    # ---- Section 2: candidates_and_boring_technology ----
    _bool_check(results, "candidates_and_boring_technology",
                "tech_stack_memo_candidates_compared_against_same_hard_constraints",
                manifest,
                ("candidate_work", "candidates_compared_against_same_hard_constraints"),
                "candidates: every candidate stack was compared against the same declared hard constraints")
    _bool_check(results, "candidates_and_boring_technology",
                "tech_stack_memo_boring_technology_bias_addressed", manifest,
                ("candidate_work", "boring_technology_bias_addressed"),
                "boring-technology bias: the memo addresses preferring proven, well-understood tools for the plumbing")
    _bool_check(results, "candidates_and_boring_technology",
                "tech_stack_memo_novelty_budget_allocation_declared", manifest,
                ("candidate_work", "novelty_budget_allocation_declared"),
                "boring-technology bias: the memo declares how its limited novelty budget is allocated")
    _bool_check(results, "candidates_and_boring_technology",
                "tech_stack_memo_novelty_spend_tied_to_differentiation_declared",
                manifest,
                ("candidate_work", "novelty_spend_tied_to_differentiation_declared"),
                "boring-technology bias: any novelty spend is declared tied to where it actually differentiates")
    _check(results, "candidates_and_boring_technology",
           "tech_stack_memo_candidates_list_declared", candidates,
           cand_is_list, cand_is_list and cand_count >= 2,
           "candidates: the declared record names its candidate stacks — the list is present and names at least two candidates; an absent list is missing evidence and a list of fewer than two declares no comparison at all")
    cand_id_present = cand_is_list and all(
        _has(c, "candidate_id") for c in cand_rows)
    _check(results, "candidates_and_boring_technology",
           "every_tech_stack_memo_candidate_id_unique", candidates,
           cand_id_present,
           cand_is_list and duplicate_candidate_ids is not None
           and len(duplicate_candidate_ids) == 0,
           "candidates: no declared candidate_id is owned by more than one row")
    stack_name_present = cand_is_list and all(
        _has(c, "stack_name") for c in cand_rows)
    _check(results, "candidates_and_boring_technology",
           "every_tech_stack_memo_candidate_stack_name_declared", candidates,
           stack_name_present,
           cand_is_list
           and all(_nonempty_str(c.get("stack_name")) for c in cand_rows),
           "candidates: every declared candidate declares a non-empty stack name")
    novelty_present = cand_is_list and all(
        _has(c, "novelty_classification") for c in cand_rows)
    _check(results, "candidates_and_boring_technology",
           "every_tech_stack_memo_candidate_novelty_classification_recognised",
           candidates, novelty_present,
           cand_is_list
           and all(c.get("novelty_classification") in NOVELTY_CLASSIFICATIONS
                   for c in cand_rows),
           "candidates: every declared candidate's novelty classification is one of proven, novel — the two classes the boring-technology bias works with")
    evidence_present = cand_is_list and all(
        _has(c, "evidence_note") for c in cand_rows)
    _check(results, "candidates_and_boring_technology",
           "every_tech_stack_memo_candidate_evidence_note_declared", candidates,
           evidence_present,
           cand_is_list
           and all(_nonempty_str(c.get("evidence_note")) for c in cand_rows),
           "candidates: every declared candidate declares a non-empty evidence note")

    # ---- Section 3: evaluation_criteria_and_evidence ----
    _bool_check(results, "evaluation_criteria_and_evidence",
                "tech_stack_memo_evaluation_evidence_basis_recorded", manifest,
                ("evaluation", "evidence_basis_recorded"),
                "evaluation: the evidence basis for the candidate evaluation is recorded")
    _bool_check(results, "evaluation_criteria_and_evidence",
                "tech_stack_memo_evaluation_applied_consistently_across_candidates",
                manifest,
                ("evaluation", "evaluation_applied_consistently_across_candidates"),
                "evaluation: the same criteria and evidence basis were applied consistently across all candidates")
    _check(results, "evaluation_criteria_and_evidence",
           "tech_stack_memo_criteria_list_declared", criteria,
           crit_is_list, crit_is_list and crit_count > 0,
           "criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all")
    crit_id_present = crit_is_list and all(
        _has(c, "criterion_id") for c in crit_rows)
    _check(results, "evaluation_criteria_and_evidence",
           "every_tech_stack_memo_criterion_id_unique", criteria,
           crit_id_present,
           crit_is_list and duplicate_criterion_ids is not None
           and len(duplicate_criterion_ids) == 0,
           "criteria: no declared criterion_id is owned by more than one row")
    crit_name_present = crit_is_list and all(
        _has(c, "criterion_name") for c in crit_rows)
    _check(results, "evaluation_criteria_and_evidence",
           "every_tech_stack_memo_criterion_name_declared", criteria,
           crit_name_present,
           crit_is_list
           and all(_nonempty_str(c.get("criterion_name")) for c in crit_rows),
           "criteria: every declared criterion declares a non-empty criterion name")
    weight_present = crit_is_list and all(
        _has(c, "weight") for c in crit_rows)
    _check(results, "evaluation_criteria_and_evidence",
           "every_tech_stack_memo_criterion_weight_non_negative", criteria,
           weight_present,
           crit_is_list
           and all(isinstance(c.get("weight"), (int, float))
                   and not isinstance(c.get("weight"), bool)
                   and c.get("weight") >= 0 for c in crit_rows),
           "criteria: every declared criterion declares a non-negative weight")
    _check(results, "evaluation_criteria_and_evidence",
           "tech_stack_memo_criteria_weights_sum_positive", criteria,
           weight_present,
           crit_is_list and weights_sum is not None and weights_sum > 0,
           "criteria: the declared criterion weights sum to a positive total — a memo whose weights sum to zero scores nothing")
    scores_present = (cand_is_list and crit_is_list
                      and all(_has(c, "scores") for c in cand_rows)
                      and all(_has(c, "criterion_id") for c in crit_rows)
                      and all(isinstance(s, dict) and _has(s, "criterion_id")
                              for c in cand_rows
                              if isinstance(c.get("scores"), list)
                              for s in c["scores"]))
    _check(results, "evaluation_criteria_and_evidence",
           "every_tech_stack_memo_candidate_scores_every_declared_criterion",
           candidates, scores_present,
           cand_is_list and crit_is_list
           and all(_scores_cover(c) for c in cand_rows),
           "scores: every declared candidate scores every declared criterion and no other criterion, exactly once")
    totals_present = (cand_is_list and crit_is_list
                      and all(_has(c, "weighted_total_declared")
                              for c in cand_rows)
                      and all(_has(c, "scores") for c in cand_rows)
                      and all(_has(c, "weight") for c in crit_rows)
                      and all(_has(c, "criterion_id") for c in crit_rows))
    _check(results, "evaluation_criteria_and_evidence",
           "every_tech_stack_memo_candidate_weighted_total_recomputes",
           candidates, totals_present,
           cand_is_list and crit_is_list
           and all(_total_matches(c) for c in cand_rows),
           "scores: every declared candidate's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores")

    # ---- Section 4: total_cost_and_operability ----
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_licensing_cost_addressed", manifest,
                ("tco", "licensing_cost_addressed"),
                "total cost of ownership: licensing cost is weighed — not just the sticker")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_operations_burden_addressed", manifest,
                ("tco", "operations_burden_addressed"),
                "total cost of ownership: operations burden is weighed")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_learning_curve_addressed", manifest,
                ("tco", "learning_curve_addressed"),
                "total cost of ownership: learning curve for the team that must run the stack is weighed")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_lock_in_cost_addressed", manifest,
                ("tco", "lock_in_cost_addressed"),
                "total cost of ownership: lock-in cost is weighed")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_operability_cost_addressed", manifest,
                ("tco", "operability_cost_addressed"),
                "operability: the operability cost of the stack — who runs this at 2am — is addressed")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_on_call_operability_owner_declared", manifest,
                ("tco", "on_call_operability_owner_declared"),
                "operability: the on-call operability owner who runs the stack at 2am is declared")
    _bool_check(results, "total_cost_and_operability",
                "tech_stack_memo_team_can_operate_declared_stack", manifest,
                ("tco", "team_can_operate_declared_stack"),
                "operability: the memo declares the team can operate the declared stack")
    _gated_bool_check(
        results, "total_cost_and_operability",
        "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used",
        manifest,
        ("tco", "free_tier_or_free_choice_used"),
        ("tco", "hidden_fragility_cost_named"),
        "total cost of ownership: the hidden fragility cost of the free-tier or free choice used is named explicitly, so the trade-off is chosen knowingly",
        "no free-tier or free choice declared used")

    # ---- Section 5: decision_and_rationale ----
    _bool_check(results, "decision_and_rationale",
                "tech_stack_memo_decision_recorded", manifest,
                ("decision", "decision_recorded"),
                "decision: the memo records a decision")
    _bool_check(results, "decision_and_rationale",
                "tech_stack_memo_rationale_recorded", manifest,
                ("decision", "rationale_recorded"),
                "decision: the memo records the rationale for its decision")
    _bool_check(results, "decision_and_rationale",
                "tech_stack_memo_rationale_tied_to_hard_constraints", manifest,
                ("decision", "rationale_tied_to_hard_constraints"),
                "decision: the recorded rationale is tied to the declared hard constraints")
    _bool_check(results, "decision_and_rationale",
                "tech_stack_memo_rationale_tied_to_evaluation_criteria", manifest,
                ("decision", "rationale_tied_to_evaluation_criteria"),
                "decision: the recorded rationale is tied to the declared evaluation criteria")
    _bool_check(results, "decision_and_rationale",
                "tech_stack_memo_tradeoffs_of_decision_recorded", manifest,
                ("decision", "tradeoffs_of_decision_recorded"),
                "decision: the trade-offs of the recorded decision are recorded")
    chosen_present = has_chosen and cand_is_list
    _check(results, "decision_and_rationale",
           "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
           chosen, chosen_present,
           chosen_present and isinstance(chosen, str)
           and chosen in candidate_ids,
           "decision: the declared chosen candidate id names one of the declared candidates — the atom checks only that the reference resolves; it never checks that the chosen candidate is the top-ranked or highest-scoring one")
    ranking_present = (ranking_is_list and cand_is_list
                       and all(_has(c, "candidate_id") for c in cand_rows))
    _check(results, "decision_and_rationale",
           "tech_stack_memo_declared_ranking_matches_declared_candidates",
           ranking, ranking_present,
           ranking_present and ranking_missing == []
           and ranking_extra == [] and duplicate_ranking_ids == []
           and len(ranking_rows) == len(candidate_ids),
           "decision: the candidate ids in the memo's declared ranking are exactly the declared candidate ids — none missing, none extra, none duplicated; checking a declared ranking's internal consistency is audit, not advice, and the atom produces no ranking of its own")

    # ---- Section 6: reversibility_and_exit ----
    _bool_check(results, "reversibility_and_exit",
                "tech_stack_memo_exit_cost_assessed", manifest,
                ("reversibility", "exit_cost_assessed"),
                "reversibility: the exit cost if this choice is wrong is assessed")
    _bool_check(results, "reversibility_and_exit",
                "tech_stack_memo_exit_path_kept", manifest,
                ("reversibility", "exit_path_kept"),
                "reversibility: an exit path from the chosen stack is kept")
    _bool_check(results, "reversibility_and_exit",
                "tech_stack_memo_vendor_specific_pieces_isolated_behind_interfaces",
                manifest,
                ("reversibility",
                 "vendor_specific_pieces_isolated_behind_interfaces"),
                "reversibility: vendor-specific pieces are isolated behind interfaces")
    _bool_check(results, "reversibility_and_exit",
                "tech_stack_memo_reversibility_assessed", manifest,
                ("reversibility", "reversibility_assessed"),
                "reversibility: the reversibility of the stack choice is assessed")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty",
                 manifest,
                 ("red_lines", "framework_of_the_week_chosen_for_novelty_present"),
                 "red line: no framework-of-the-week chosen for novelty is present in the record")
    _false_check(results, "red_lines",
                 "tech_stack_memo_free_of_microservices_for_solo_project",
                 manifest,
                 ("red_lines", "microservices_for_solo_project_present"),
                 "red line: no microservices architecture for a solo project is present in the record")
    _false_check(results, "red_lines",
                 "tech_stack_memo_free_of_docker_by_default_choice",
                 manifest,
                 ("red_lines", "docker_by_default_choice_present"),
                 "red line: no Docker-by-default choice is present in the record")
    _false_check(results, "red_lines",
                 "tech_stack_memo_free_of_lock_in_with_no_exit",
                 manifest,
                 ("red_lines", "lock_in_with_no_exit_present"),
                 "red line: no lock-in with no exit is present in the record")
    _false_check(results, "red_lines",
                 "tech_stack_memo_free_of_technology_chosen_to_pad_cv",
                 manifest,
                 ("red_lines", "technology_chosen_to_pad_cv_present"),
                 "red line: no technology chosen to pad a CV is present in the record")

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
        verdict = "TECH_STACK_DECISION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TECH_STACK_DECISION_SOUND"

    computed_names = (
        "tech_stack_memo_candidates_list_declared",
        "every_tech_stack_memo_candidate_id_unique",
        "every_tech_stack_memo_candidate_stack_name_declared",
        "every_tech_stack_memo_candidate_novelty_classification_recognised",
        "every_tech_stack_memo_candidate_evidence_note_declared",
        "tech_stack_memo_criteria_list_declared",
        "every_tech_stack_memo_criterion_id_unique",
        "every_tech_stack_memo_criterion_name_declared",
        "every_tech_stack_memo_criterion_weight_non_negative",
        "tech_stack_memo_criteria_weights_sum_positive",
        "every_tech_stack_memo_candidate_scores_every_declared_criterion",
        "every_tech_stack_memo_candidate_weighted_total_recomputes",
        "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
        "tech_stack_memo_declared_ranking_matches_declared_candidates",
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
        "service": "tech-stack-decision-memo",
        "atom_version": "0.1.0",
        "memo_title": manifest.get("memo_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "tech_stack_candidates_count": cand_count,
        "tech_stack_criteria_count": crit_count,
        "duplicate_tech_stack_candidate_ids": duplicate_candidate_ids,
        "duplicate_tech_stack_criterion_ids": duplicate_criterion_ids,
        "duplicate_declared_ranking_candidate_ids": duplicate_ranking_ids,
        "tech_stack_candidates_without_stack_name": candidates_without_stack_name,
        "tech_stack_candidates_with_invalid_novelty_classification": candidates_with_invalid_novelty,
        "tech_stack_candidates_without_evidence_note": candidates_without_evidence_note,
        "tech_stack_criteria_without_name": criteria_without_name,
        "tech_stack_criteria_with_invalid_weight": criteria_with_invalid_weight,
        "tech_stack_candidates_with_incomplete_or_extra_scores": candidates_with_incomplete_scores,
        "tech_stack_candidates_with_weighted_total_mismatch": candidates_with_total_mismatch,
        "tech_stack_candidates_missing_from_declared_ranking": ranking_missing,
        "declared_ranking_ids_not_declared_as_candidates": ranking_extra,
        "tech_stack_criteria_weights_sum": _fmt6(weights_sum),
        "candidate_score_coverage_ratio": _fmt6(score_coverage_ratio),
        "candidate_weighted_total_match_ratio": _fmt6(weighted_total_match_ratio),
        "candidate_evidence_note_ratio": _fmt6(candidate_evidence_ratio),
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
        "TECH STACK DECISION MEMO",
        f"memo_title: {verdict.get('memo_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: tech_stack_decision_memo.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TECH_STACK_DECISION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
