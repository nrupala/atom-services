#!/usr/bin/env python3
"""Structured root cause analysis — deterministic core.

Built from the bound skill `analytical-reasoning`: "Thinking is a
skill with methods. Use the right inference for the question,
structure it, and quantify where it matters." Its root-cause
method is this atom's method: "5-whys or fishbone toward the
*controllable* cause; distinguish trigger vs root; verify by
reverting/testing the cause — plausible candidates don't count
until tested." Around it the skill demands: classify the
inference (deduction / induction / abduction); MECE decomposition
and a hypothesis tree ranked by likelihood x cost to test;
evidence discipline (tier evidence — measurements > logs >
reports > opinions; base rates first; update on new evidence);
quantify (magnitudes and ranges; state units + assumptions);
falsify the conclusion (strongest counterargument, data that
would contradict, what would change your mind — written down);
and land it (conclusion, confidence, basis, revision
conditions). Its red lines are this atom's red lines: "No
conclusions from unverified single sources; no post-hoc
storytelling; never confuse plausible with proven."

This atom is a REPORT on a declared root-cause analysis record:
it audits the record a caller declares — the stated problem and
classified inference, the declared decomposition and timeline,
the declared fishbone factor rows with their declared evidence
tiers, the declared causal chain (the 5-whys links), the
declared evidence and quantification attestations, the declared
verification / counterfactual / falsification record, the
declared corrective-action rows, and the red lines refused. It
investigates NOTHING itself, interviews no one, inspects no
incident, system, log or site, asserts no real-world cause,
assigns no blame, and gives no engineering determination — it
checks that the RCA record the skill requires is present and
internally consistent on the declared evidence, and it
re-verifies the declared rows' own consistency exactly:
timeline order, fishbone coverage, causal-chain depth and
factor references, and corrective-action factor references.

Distinct ground: the nearest siblings are
`argument-analysis-review` (a declared argument record —
premises, conclusion, steelman, fallacy/bias screens),
`assumption-audit` (a declared decision record's assumptions),
`decision-trap-sweep` (a declared decision record's traps) and
`condition-monitoring-triage` (declared asset readings against
declared alert bands). This atom shares zero checks with any of
them: every check here is an RCA-record question — a problem
statement with its inference classified, trigger distinguished
from root and the controllable cause targeted, a MECE /
hypothesis-tree decomposition, a declared timeline whose
sequence numbers strictly increase, declared fishbone factor
rows in declared categories with recognised evidence tiers, a
declared causal chain whose depths run consecutively from one
and whose every link references a declared factor, base rates
and evidence updates, magnitudes with units and assumptions,
verification by reverting/testing the cause with a recorded
counterfactual test, the strongest counterargument with
contradicting data and revision conditions, corrective actions
that reference declared factors, and the RCA red lines
(unverified single-source conclusions, post-hoc storytelling,
plausible presented as proven, cause asserted without declared
evidence, person blame as root cause). The boundary is: the
internal consistency of a declared root-cause analysis record
here; an argument, a decision's assumptions or traps, and asset
readings against bands, there.

The caller submits an RCA manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- timeline order: every declared timeline event declares a
  sequence number, and the declared sequence numbers strictly
  increase in row order (a declared record whose own timeline
  runs backwards is not a timeline);
- row identity: no declared event_id, factor_id, link_id or
  action_id may be owned by more than one row in its list;
- fishbone coverage: every declared factor declares a
  non-empty category, and every declared factor's evidence tier
  is one of the skill's four tiers — `measurement`, `log`,
  `report`, `opinion` ("tier evidence (measurements > logs >
  reports > opinions)");
- causal-chain shape: the declared chain links' depths run
  consecutively from one in row order (the 5-whys chain is a
  chain — a record whose depths skip or repeat is not the chain
  it declares), and every declared link's factor_id references
  a factor declared in the factor rows;
- corrective-action references: every declared corrective
  action's factor_id references a factor declared in the
  factor rows (an action aimed at no declared factor is not
  linked to the record's own root cause).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
number of whys beyond a chain that runs consecutively from
one, no minimum factor, category, timeline or action count
beyond at least one row in each declared list, no evidence-tier
floor (opinion is the skill's lowest tier, tiered and declared
— never barred), no likelihood or test-cost score, no
confidence level, no magnitude or range bar — so no such check
is invented; those quantities are caller declarations at most,
and quantities here are computed and reported, with exact
consistency and completeness over the caller's own declared
rows as the only bars, exactly as stated above.

Verdict:
- any fail             -> ROOT_CAUSE_ANALYSIS_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ROOT_CAUSE_ANALYSIS_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "problem_framing_and_inference",
    "decomposition_and_timeline",
    "causal_chain_and_fishbone",
    "evidence_and_quantification",
    "verification_falsification_and_conclusion",
    "red_lines",
)

EVIDENCE_TIERS = ("measurement", "log", "report", "opinion")

MANIFEST_SPEC = {
    "analysis_title": "string",
    "problem": {
        "problem_statement_stated": "boolean",
        "inference_type_classified": "boolean",
        "scope_boundary_stated": "boolean",
        "trigger_distinguished_from_root_cause": "boolean",
        "controllable_cause_targeted": "boolean",
    },
    "decomposition": {
        "mece_decomposition_declared": "boolean",
        "hypothesis_tree_declared": "boolean",
        "branches_ranked_by_likelihood_and_test_cost": "boolean",
    },
    "timeline_events": [{
        "event_id": "string",
        "sequence_number": "number",
    }],
    "factors": [{
        "factor_id": "string",
        "category": "string",
        "evidence_tier": "string",
    }],
    "causal_chain": [{
        "link_id": "string",
        "depth": "number",
        "factor_id": "string",
    }],
    "evidence": {
        "evidence_tiers_applied": "boolean",
        "base_rates_considered_first": "boolean",
        "evidence_update_stated": "boolean",
        "magnitudes_and_ranges_quantified": "boolean",
        "units_and_assumptions_stated": "boolean",
    },
    "verification": {
        "root_cause_verified_by_revert_or_test": "boolean",
        "counterfactual_test_recorded": "boolean",
        "strongest_counterargument_stated": "boolean",
        "contradicting_data_named": "boolean",
        "revision_conditions_stated": "boolean",
    },
    "conclusion": {
        "conclusion_confidence_and_basis_stated": "boolean",
    },
    "corrective_actions": [{
        "action_id": "string",
        "factor_id": "string",
    }],
    "red_lines": {
        "unverified_single_source_conclusion_present": "boolean",
        "post_hoc_storytelling_present": "boolean",
        "plausible_presented_as_proven_present": "boolean",
        "cause_asserted_without_declared_evidence_present": "boolean",
        "person_blame_as_root_cause_present": "boolean",
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


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_id(entry, field):
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


def _factor_ids(rows):
    return [c["factor_id"] for c in rows
            if isinstance(c, dict) and isinstance(c.get("factor_id"), str)]


def _factor_complete_for_category(entry):
    return _has(entry, "category") and _nonempty_str(entry.get("category"))


def _factor_complete_for_tier(entry):
    return (_has(entry, "evidence_tier")
            and _nonempty_str(entry.get("evidence_tier")))


def _factor_tier_recognised(entry):
    return (_factor_complete_for_tier(entry)
            and entry.get("evidence_tier") in EVIDENCE_TIERS)


def _ref_complete(entry):
    return _has(entry, "factor_id") and _nonempty_str(entry.get("factor_id"))


def _ref_matches(entry, factor_ids):
    return _ref_complete(entry) and entry.get("factor_id") in factor_ids


def evaluate(manifest):
    """Return the verdict dict for a structured RCA manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    timeline, has_timeline = _get(manifest, "timeline_events")
    timeline_is_list = has_timeline and isinstance(timeline, list)
    timeline_count = len(timeline) if timeline_is_list else None
    t_rows = timeline if timeline_is_list else []

    factors, has_factors = _get(manifest, "factors")
    factors_is_list = has_factors and isinstance(factors, list)
    factors_count = len(factors) if factors_is_list else None
    f_rows = factors if factors_is_list else []
    factor_ids = _factor_ids(f_rows)

    chain, has_chain = _get(manifest, "causal_chain")
    chain_is_list = has_chain and isinstance(chain, list)
    chain_count = len(chain) if chain_is_list else None
    c_rows = chain if chain_is_list else []

    actions, has_actions = _get(manifest, "corrective_actions")
    actions_is_list = has_actions and isinstance(actions, list)
    actions_count = len(actions) if actions_is_list else None
    a_rows = actions if actions_is_list else []

    duplicate_timeline_event_ids = (
        _duplicates(t_rows, "event_id") if timeline_is_list else None)
    duplicate_factor_ids = (
        _duplicates(f_rows, "factor_id") if factors_is_list else None)
    duplicate_causal_chain_link_ids = (
        _duplicates(c_rows, "link_id") if chain_is_list else None)
    duplicate_corrective_action_ids = (
        _duplicates(a_rows, "action_id") if actions_is_list else None)
    factors_without_category = (
        [_row_id(c, "factor_id") for c in f_rows
         if not _factor_complete_for_category(c)]
        if factors_is_list else None)
    factors_missing_evidence_tier = (
        [_row_id(c, "factor_id") for c in f_rows
         if not _factor_complete_for_tier(c)]
        if factors_is_list else None)
    factors_with_unrecognised_evidence_tier = (
        [_row_id(c, "factor_id") for c in f_rows
         if _factor_complete_for_tier(c) and not _factor_tier_recognised(c)]
        if factors_is_list else None)
    chain_links_with_unreferenced_factor = (
        [_row_id(c, "link_id") for c in c_rows
         if _ref_complete(c) and not _ref_matches(c, factor_ids)]
        if chain_is_list and factors_is_list else None)
    actions_with_unreferenced_factor = (
        [_row_id(c, "action_id") for c in a_rows
         if _ref_complete(c) and not _ref_matches(c, factor_ids)]
        if actions_is_list and factors_is_list else None)
    fishbone_categories_declared_count = (
        len({c["category"] for c in f_rows
             if _factor_complete_for_category(c)})
        if factors_is_list else None)
    factor_category_coverage_ratio = (
        sum(1 for c in f_rows if _factor_complete_for_category(c))
        / factors_count
        if factors_is_list and factors_count > 0 else None)
    factor_evidence_tier_ratio = (
        sum(1 for c in f_rows if _factor_tier_recognised(c)) / factors_count
        if factors_is_list and factors_count > 0 else None)
    chain_reference_ratio = (
        sum(1 for c in c_rows if _ref_matches(c, factor_ids)) / chain_count
        if chain_is_list and factors_is_list and chain_count > 0 else None)
    action_reference_ratio = (
        sum(1 for c in a_rows if _ref_matches(c, factor_ids)) / actions_count
        if actions_is_list and factors_is_list and actions_count > 0
        else None)

    # ---- Section 1: problem_framing_and_inference (skill steps
    #      1 and 3 — classify the inference; the problem stated
    #      with its scope; trigger distinguished from root; the
    #      hunt aimed at the controllable cause) ----
    _bool_check(results, "problem_framing_and_inference",
                "rca_problem_statement_stated", manifest,
                ("problem", "problem_statement_stated"),
                "problem: the problem the analysis explains is "
                "stated")
    _bool_check(results, "problem_framing_and_inference",
                "rca_inference_type_classified", manifest,
                ("problem", "inference_type_classified"),
                "problem: the inference type is classified "
                "(deduction, induction or abduction) and the "
                "confidence that type earns is the confidence "
                "claimed")
    _bool_check(results, "problem_framing_and_inference",
                "rca_scope_boundary_stated", manifest,
                ("problem", "scope_boundary_stated"),
                "problem: the scope and boundary of the analysis "
                "are stated (what is in, what is out)")
    _bool_check(results, "problem_framing_and_inference",
                "rca_trigger_distinguished_from_root", manifest,
                ("problem", "trigger_distinguished_from_root_cause"),
                "problem: the trigger is distinguished from the "
                "root cause — the event that set it off is not "
                "recorded as the cause that explains it")
    _bool_check(results, "problem_framing_and_inference",
                "rca_controllable_cause_targeted", manifest,
                ("problem", "controllable_cause_targeted"),
                "problem: the hunt is aimed at the controllable "
                "cause, not at a cause no one can act on")

    # ---- Section 2: decomposition_and_timeline (skill steps 2
    #      and 3 — MECE decomposition, a hypothesis tree ranked
    #      by likelihood x cost to test, and the declared
    #      timeline the record itself lays out) ----
    _bool_check(results, "decomposition_and_timeline",
                "rca_mece_decomposition_declared", manifest,
                ("decomposition", "mece_decomposition_declared"),
                "decomposition: the problem is decomposed MECE "
                "(no overlaps, no gaps) before it is answered")
    _bool_check(results, "decomposition_and_timeline",
                "rca_hypothesis_tree_declared", manifest,
                ("decomposition", "hypothesis_tree_declared"),
                "decomposition: the candidate causes are laid out "
                "as a hypothesis tree")
    _bool_check(results, "decomposition_and_timeline",
                "rca_branches_ranked_by_likelihood_and_test_cost",
                manifest,
                ("decomposition",
                 "branches_ranked_by_likelihood_and_test_cost"),
                "decomposition: the tree's branches are ranked by "
                "likelihood x cost to test")
    _check(results, "decomposition_and_timeline",
           "rca_timeline_events_list_declared", timeline,
           timeline_is_list,
           timeline_is_list and timeline_count > 0,
           "the declared record names its timeline events — the "
           "timeline_events list is present and names at least "
           "one event; an absent list is missing evidence and an "
           "empty list declares no timeline at all")
    timeline_id_present = (
        timeline_is_list
        and all(_has(c, "event_id") for c in t_rows))
    _check(results, "decomposition_and_timeline",
           "every_rca_timeline_event_id_unique", timeline,
           timeline_id_present,
           timeline_is_list and duplicate_timeline_event_ids is not None
           and len(duplicate_timeline_event_ids) == 0,
           "timeline events: no declared event_id is owned by "
           "more than one row")
    sequence_present = (
        timeline_is_list
        and all(_has(c, "sequence_number")
                and _is_number(c.get("sequence_number")) for c in t_rows))
    _check(results, "decomposition_and_timeline",
           "rca_timeline_sequence_strictly_increasing", timeline,
           sequence_present,
           timeline_is_list
           and all(t_rows[i].get("sequence_number")
                   > t_rows[i - 1].get("sequence_number")
                   for i in range(1, len(t_rows))
                   if _is_number(t_rows[i].get("sequence_number"))
                   and _is_number(t_rows[i - 1].get("sequence_number"))),
           "timeline events: the declared sequence numbers "
           "strictly increase in row order — the record's own "
           "timeline never runs backwards")

    # ---- Section 3: causal_chain_and_fishbone (skill step 3 —
    #      5-whys or fishbone toward the controllable cause:
    #      declared factor rows in declared categories, and a
    #      declared chain whose depths run consecutively from
    #      one and whose links reference declared factors) ----
    _check(results, "causal_chain_and_fishbone",
           "rca_factor_rows_list_declared", factors, factors_is_list,
           factors_is_list and factors_count > 0,
           "the declared record names its fishbone factor rows — "
           "the factors list is present and names at least one "
           "factor; an absent list is missing evidence and an "
           "empty list declares no fishbone at all")
    factor_id_present = (
        factors_is_list and all(_has(c, "factor_id") for c in f_rows))
    _check(results, "causal_chain_and_fishbone",
           "every_rca_factor_id_unique", factors, factor_id_present,
           factors_is_list and duplicate_factor_ids is not None
           and len(duplicate_factor_ids) == 0,
           "factor rows: no declared factor_id is owned by more "
           "than one row")
    category_present = (
        factors_is_list and all(_has(c, "category") for c in f_rows))
    _check(results, "causal_chain_and_fishbone",
           "every_rca_factor_category_declared", factors,
           category_present,
           factors_is_list
           and all(_factor_complete_for_category(c) for c in f_rows),
           "factor rows: every declared factor declares its "
           "fishbone category, none empty")
    _check(results, "causal_chain_and_fishbone",
           "rca_causal_chain_list_declared", chain, chain_is_list,
           chain_is_list and chain_count > 0,
           "the declared record names its causal chain — the "
           "causal_chain list is present and names at least one "
           "link; an absent list is missing evidence and an "
           "empty list declares no chain at all")
    link_id_present = (
        chain_is_list and all(_has(c, "link_id") for c in c_rows))
    _check(results, "causal_chain_and_fishbone",
           "every_rca_causal_chain_link_id_unique", chain,
           link_id_present,
           chain_is_list and duplicate_causal_chain_link_ids is not None
           and len(duplicate_causal_chain_link_ids) == 0,
           "causal chain: no declared link_id is owned by more "
           "than one row")
    depth_present = (
        chain_is_list
        and all(_has(c, "depth") and _is_number(c.get("depth"))
                for c in c_rows))
    _check(results, "causal_chain_and_fishbone",
           "rca_causal_chain_depths_consecutive_from_one", chain,
           depth_present,
           chain_is_list
           and all(_is_number(c.get("depth")) and c.get("depth") == i + 1
                   for i, c in enumerate(c_rows)),
           "causal chain: the declared links' depths run "
           "consecutively from one in row order — the 5-whys "
           "chain the record declares has no skipped or repeated "
           "depth")
    chain_ref_present = (
        chain_is_list and factors_is_list
        and all(_has(c, "factor_id") for c in c_rows))
    _check(results, "causal_chain_and_fishbone",
           "every_rca_causal_chain_link_factor_referenced", chain,
           chain_ref_present,
           chain_is_list and factors_is_list
           and all(_ref_matches(c, factor_ids) for c in c_rows),
           "causal chain: every declared link's factor_id "
           "references a factor declared in the factor rows")

    # ---- Section 4: evidence_and_quantification (skill steps 4
    #      and 5 — tier evidence, base rates first, update on
    #      new evidence; magnitudes and ranges with units and
    #      assumptions stated; every factor's tier recognised) --
    _bool_check(results, "evidence_and_quantification",
                "rca_evidence_tiers_applied", manifest,
                ("evidence", "evidence_tiers_applied"),
                "evidence: the evidence is tiered (measurements "
                "> logs > reports > opinions)")
    _bool_check(results, "evidence_and_quantification",
                "rca_base_rates_considered_first", manifest,
                ("evidence", "base_rates_considered_first"),
                "evidence: base rates are considered first, "
                "before the case's own story")
    _bool_check(results, "evidence_and_quantification",
                "rca_evidence_update_stated", manifest,
                ("evidence", "evidence_update_stated"),
                "evidence: how new evidence updates the view is "
                "stated (how much this evidence should change it)")
    _bool_check(results, "evidence_and_quantification",
                "rca_magnitudes_and_ranges_quantified", manifest,
                ("evidence", "magnitudes_and_ranges_quantified"),
                "quantification: magnitudes and ranges are "
                "quantified — ballpark numbers, not hand-waving")
    _bool_check(results, "evidence_and_quantification",
                "rca_units_and_assumptions_stated", manifest,
                ("evidence", "units_and_assumptions_stated"),
                "quantification: units and assumptions are stated "
                "with the quantified magnitudes")
    tier_present = (
        factors_is_list and all(_has(c, "evidence_tier") for c in f_rows))
    _check(results, "evidence_and_quantification",
           "every_rca_factor_evidence_tier_recognised", factors,
           tier_present,
           factors_is_list
           and all(_factor_tier_recognised(c) for c in f_rows),
           "factor rows: every declared factor's evidence tier "
           "is one of the skill's four tiers — measurement, log, "
           "report, opinion")

    # ---- Section 5: verification_falsification_and_conclusion
    #      (skill steps 3, 6 and 7 — the root cause verified by
    #      reverting/testing, not merely plausible; a recorded
    #      counterfactual test; falsify the conclusion; land it
    #      with confidence, basis and revision conditions; and
    #      corrective actions that reference declared factors) --
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_root_cause_verified_by_revert_or_test", manifest,
                ("verification", "root_cause_verified_by_revert_or_test"),
                "verification: the root cause is verified by "
                "reverting or testing the cause — a plausible "
                "candidate does not count until tested")
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_counterfactual_test_recorded", manifest,
                ("verification", "counterfactual_test_recorded"),
                "verification: a counterfactual test is recorded "
                "(removing the declared cause is declared to "
                "remove the declared effect)")
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_strongest_counterargument_stated", manifest,
                ("verification", "strongest_counterargument_stated"),
                "falsification: the strongest counterargument to "
                "the conclusion is stated")
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_contradicting_data_named", manifest,
                ("verification", "contradicting_data_named"),
                "falsification: the data that would contradict "
                "the conclusion is named")
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_revision_conditions_stated", manifest,
                ("verification", "revision_conditions_stated"),
                "falsification: what would change the analyst's "
                "mind is written down (revision conditions)")
    _bool_check(results, "verification_falsification_and_conclusion",
                "rca_conclusion_confidence_and_basis_stated", manifest,
                ("conclusion", "conclusion_confidence_and_basis_stated"),
                "conclusion: the record lands its conclusion with "
                "its confidence and its basis stated")
    _check(results, "verification_falsification_and_conclusion",
           "rca_corrective_action_rows_list_declared", actions,
           actions_is_list,
           actions_is_list and actions_count > 0,
           "the declared record names its corrective actions — "
           "the corrective_actions list is present and names at "
           "least one action; an absent list is missing evidence "
           "and an empty list declares no corrective action at "
           "all")
    action_id_present = (
        actions_is_list and all(_has(c, "action_id") for c in a_rows))
    _check(results, "verification_falsification_and_conclusion",
           "every_rca_corrective_action_id_unique", actions,
           action_id_present,
           actions_is_list and duplicate_corrective_action_ids is not None
           and len(duplicate_corrective_action_ids) == 0,
           "corrective actions: no declared action_id is owned "
           "by more than one row")
    action_ref_present = (
        actions_is_list and factors_is_list
        and all(_has(c, "factor_id") for c in a_rows))
    _check(results, "verification_falsification_and_conclusion",
           "every_rca_corrective_action_factor_referenced", actions,
           action_ref_present,
           actions_is_list and factors_is_list
           and all(_ref_matches(c, factor_ids) for c in a_rows),
           "corrective actions: every declared action's "
           "factor_id references a factor declared in the factor "
           "rows — an action aimed at no declared factor is not "
           "linked to the record's own root cause")

    # ---- Section 6: red_lines (skill "Red lines" — no
    #      conclusions from unverified single sources, no
    #      post-hoc storytelling, never confuse plausible with
    #      proven; plus the record-level forms: a cause asserted
    #      with no declared evidence behind it, and a person
    #      blamed in place of the controllable cause) ----
    _false_check(results, "red_lines",
                 "rca_free_of_unverified_single_source_conclusion",
                 manifest,
                 ("red_lines",
                  "unverified_single_source_conclusion_present"),
                 "red line: no conclusion drawn from an unverified "
                 "single source is present in the record")
    _false_check(results, "red_lines",
                 "rca_free_of_post_hoc_storytelling", manifest,
                 ("red_lines", "post_hoc_storytelling_present"),
                 "red line: no post-hoc storytelling is present in "
                 "the record (a story fitted after the fact is not "
                 "a cause)")
    _false_check(results, "red_lines",
                 "rca_free_of_plausible_presented_as_proven", manifest,
                 ("red_lines", "plausible_presented_as_proven_present"),
                 "red line: nothing merely plausible is presented "
                 "as proven in the record")
    _false_check(results, "red_lines",
                 "rca_free_of_cause_without_declared_evidence", manifest,
                 ("red_lines",
                  "cause_asserted_without_declared_evidence_present"),
                 "red line: no cause asserted without declared "
                 "evidence behind it is present in the record")
    _false_check(results, "red_lines",
                 "rca_free_of_person_blame_as_root_cause", manifest,
                 ("red_lines", "person_blame_as_root_cause_present"),
                 "red line: no person blame recorded as the root "
                 "cause is present in the record — the hunt "
                 "targets the controllable cause, not a person")

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
        verdict = "ROOT_CAUSE_ANALYSIS_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ROOT_CAUSE_ANALYSIS_SOUND"

    computed_names = (
        "rca_timeline_events_list_declared",
        "every_rca_timeline_event_id_unique",
        "rca_timeline_sequence_strictly_increasing",
        "rca_factor_rows_list_declared",
        "every_rca_factor_id_unique",
        "every_rca_factor_category_declared",
        "rca_causal_chain_list_declared",
        "every_rca_causal_chain_link_id_unique",
        "rca_causal_chain_depths_consecutive_from_one",
        "every_rca_causal_chain_link_factor_referenced",
        "every_rca_factor_evidence_tier_recognised",
        "rca_corrective_action_rows_list_declared",
        "every_rca_corrective_action_id_unique",
        "every_rca_corrective_action_factor_referenced",
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
        "service": "structured-root-cause-analysis",
        "atom_version": "0.1.0",
        "analysis_title": manifest.get("analysis_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "timeline_events_count": timeline_count,
        "factor_rows_count": factors_count,
        "causal_chain_links_count": chain_count,
        "corrective_action_rows_count": actions_count,
        "duplicate_timeline_event_ids": duplicate_timeline_event_ids,
        "duplicate_factor_ids": duplicate_factor_ids,
        "duplicate_causal_chain_link_ids": duplicate_causal_chain_link_ids,
        "duplicate_corrective_action_ids": duplicate_corrective_action_ids,
        "factors_without_category": factors_without_category,
        "factors_missing_evidence_tier": factors_missing_evidence_tier,
        "factors_with_unrecognised_evidence_tier":
            factors_with_unrecognised_evidence_tier,
        "causal_chain_links_with_unreferenced_factor":
            chain_links_with_unreferenced_factor,
        "corrective_actions_with_unreferenced_factor":
            actions_with_unreferenced_factor,
        "fishbone_categories_declared_count":
            fishbone_categories_declared_count,
        "factor_category_coverage_ratio":
            _fmt6(factor_category_coverage_ratio),
        "factor_evidence_tier_ratio": _fmt6(factor_evidence_tier_ratio),
        "causal_chain_reference_ratio": _fmt6(chain_reference_ratio),
        "corrective_action_reference_ratio": _fmt6(action_reference_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "STRUCTURED ROOT CAUSE ANALYSIS",
        f"analysis_title: {verdict.get('analysis_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: structured_root_cause_analysis.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ROOT_CAUSE_ANALYSIS_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
