#!/usr/bin/env python3
"""Technical explainer content pack — deterministic core.

Built from the bound skill `technical-education-content`:
"Teaching is compression that must not lie" — explainers that
make technical topics understandable to non-specialists
without becoming wrong. Its method is this atom's method:
define the audience and what the reader should be able to do
or say afterwards, stating assumed prior knowledge (none
assumed by default); build one piece on the spine question ->
why it matters -> one core idea -> how it works -> where it
breaks -> what to watch, one idea per piece, splitting if
there are two; simplify language, never facts, flagging what
was simplified and how, keeping units, orders of magnitude
and directions correct; use one analogy, stated with its
failure mode; give concrete numbers and cases — real figures
with dates and sources, worked mini-examples, visuals where
they carry weight; label and source every factual claim, with
expert review and "defers to licensed practice" notes for
safety-relevant topics; and re-render, don't rewrite — one
canonical explainer rendered to FAQ / thread / video-script,
updating the source and regenerating. Its quality gates are:
accuracy review done with sources archived and claims
labeled; simplifications flagged and analogies carrying their
limits; reading level appropriate with jargon defined on
first use; safety-critical content reviewed by a qualified
person where applicable. Its red lines are this atom's red
lines: no invented numbers or "studies show" without a
study; no fear-mongering or hype; never teach beyond
competence — get review or don't publish; electrical/power
content never encourages unlicensed practice; corrections
dated, visible and logged.

This atom is a DELIVERABLE audit of a declared technical
explainer content production record: it audits the record a
caller declares — the audience/prerequisite declarations,
the declared learning-objective rows, the declared
explanation-structure rows and their spine stages, the
simplification and analogy declarations, the declared
worked-example rows, the declared misconception rows, the
accuracy/source declarations, the safety declarations, the
canonical/rendering and corrections declarations, and the
red lines refused. It writes no explainer, teaches nothing,
verifies no fact, number, citation or claim against the
world and judges no explainer's quality — it checks that the
production record the skill requires is present and
internally consistent on the declared evidence, and it
recomputes the cross-references of the declared rows
exactly.

Distinct ground: the nearest siblings are
`technical-documentation-pack` (authored in this same batch
— product/system documentation for users, operators or
developers of the documented thing: how the thing works and
how to use it, not a learner's progression), `finance-
education-article` (finance-domain education only — concepts
and frameworks for money topics) and
`long-form-authoring-pipeline` (a declared long-form written
work — outline, drafting loop, review passes, versioning and
publishing of prose). This atom shares zero checks with any
of them: every check here is a learner-facing explainer
question — an audience and a do-or-say reader outcome
declared with its prior-knowledge assumption, learning
objectives as declared rows, explanation sections carrying
the skill's six spine stages and resolving to declared
objectives, simplifications flagged with units, magnitudes
and directions preserved, a single analogy confessing its
failure mode, worked examples resolving to declared
objectives and declared sources, misconceptions resolved to
the sections that address them, safety-relevant topics
expert-reviewed with a defer-to-licensed-practice note, and
one canonical explainer re-rendered rather than rewritten.
The boundary is unmistakable: learner-facing educational
content built around objectives and misconceptions here;
documentation of a thing, finance-only education, and a
prose authoring pipeline there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- prerequisites: listed (at least one row) only where prior
  knowledge is declared assumed, unique prerequisite ids, and
  a non-empty description on every row;
- learning objectives: at least one declared row, unique
  objective ids, and a non-empty outcome on every row;
- explanation sections: at least one declared row, unique
  section ids, every row's spine stage one of the six stages
  the skill names (question, why_it_matters, core_idea,
  how_it_works, where_it_breaks, what_to_watch), every row's
  objective reference naming a declared objective, and all
  six spine stages present among the declared rows;
- worked examples: at least one declared row, unique example
  ids, every example's objective and source references naming
  declared rows, and every example declared steps-complete;
- accuracy sources: at least one declared row, unique source
  ids, a non-empty citation on every row, and every source
  declared archived;
- misconceptions: at least one declared row, unique
  misconception ids, a non-empty description on every row,
  and every misconception's addressed-section reference
  naming a declared explanation section;
- renderings: at least one declared row, unique rendering
  ids, every rendering kind one of faq / thread / video_script
  (the renderings the skill names), and every rendering
  declared derived from the canonical explainer;
- gated declarations: a single analogy and its failure mode
  are required only where an analogy is declared used, a
  split-off piece only where a second core idea is declared
  present, and expert review plus a defer-to-licensed-
  practice note only where a safety-relevant topic is
  declared.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no reading-
level score, no word count, no number of objectives,
examples or sources, no analogy count beyond one — so no
such check is invented; those quantities are caller
declarations at most, and quantities here are computed and
reported, with exact cross-reference and completeness over
the caller's own declared rows as the only bars.

Verdict:
- any fail             -> EXPLAINER_CONTENT_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> EXPLAINER_CONTENT_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "audience_and_prerequisites",
    "learning_objectives",
    "explanation_spine_and_structure",
    "simplification_and_analogy_integrity",
    "worked_examples_and_concrete_numbers",
    "misconceptions_accuracy_and_safety",
    "renderings_and_corrections",
    "red_lines",
)

SPINE_STAGES = (
    "question", "why_it_matters", "core_idea", "how_it_works",
    "where_it_breaks", "what_to_watch",
)

RENDERING_KINDS = ("faq", "thread", "video_script")

MANIFEST_SPEC = {
    "explainer_title": "string",
    "audience": {
        "defined": "boolean",
        "reader_outcome_stated": "boolean",
        "prior_knowledge_assumption_stated": "boolean",
        "prior_knowledge_assumed": "boolean",
    },
    "prerequisites": [{
        "prerequisite_id": "string",
        "description": "string",
    }],
    "learning_objective_framing": {
        "outcomes_stated_as_do_or_say": "boolean",
    },
    "learning_objectives": [{
        "objective_id": "string",
        "outcome": "string",
    }],
    "structure": {
        "follows_spine_order": "boolean",
        "single_core_idea_confirmed": "boolean",
        "second_core_idea_present": "boolean",
        "second_core_idea_split_off": "boolean",
    },
    "explanation_sections": [{
        "section_id": "string",
        "spine_stage": "string",
        "objective_id": "string",
    }],
    "simplification": {
        "language_simplified_not_facts": "boolean",
        "simplifications_flagged_explicitly": "boolean",
        "units_preserved_correct": "boolean",
        "orders_of_magnitude_preserved_correct": "boolean",
        "directions_preserved_correct": "boolean",
        "jargon_defined_on_first_use": "boolean",
        "reading_level_appropriate_for_audience": "boolean",
    },
    "analogy": {
        "analogy_used": "boolean",
        "single_analogy_confirmed": "boolean",
        "failure_mode_stated": "boolean",
    },
    "example_work": {
        "worked_mini_examples_included": "boolean",
        "concrete_numbers_included": "boolean",
        "concrete_cases_included": "boolean",
        "visuals_included_where_they_carry_weight": "boolean",
    },
    "worked_examples": [{
        "example_id": "string",
        "objective_id": "string",
        "source_id": "string",
        "steps_declared_complete": "boolean",
    }],
    "misconceptions": [{
        "misconception_id": "string",
        "description": "string",
        "addressed_section_id": "string",
    }],
    "accuracy": {
        "accuracy_review_done": "boolean",
        "every_factual_claim_labeled": "boolean",
        "every_factual_claim_sourced": "boolean",
    },
    "sources": [{
        "source_id": "string",
        "citation": "string",
        "archived": "boolean",
    }],
    "safety": {
        "safety_relevant_topic": "boolean",
        "expert_review_by_qualified_person": "boolean",
        "defers_to_licensed_practice_note_included": "boolean",
    },
    "canonical": {
        "canonical_explainer_identified": "boolean",
        "renderings_regenerated_from_canonical_after_updates": "boolean",
    },
    "renderings": [{
        "rendering_id": "string",
        "rendering_kind": "string",
        "derived_from_canonical_source": "boolean",
    }],
    "corrections": {
        "corrections_dated": "boolean",
        "corrections_visible": "boolean",
        "corrections_logged": "boolean",
    },
    "red_lines": {
        "invented_numbers_or_figures_present": "boolean",
        "unsupported_studies_show_claim_present": "boolean",
        "fear_mongering_or_hype_present": "boolean",
        "teaching_beyond_declared_competence_present": "boolean",
        "unlicensed_practice_encouraged_present": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a technical explainer manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    prereqs, has_prereqs = _get(manifest, "prerequisites")
    prereqs_is_list = has_prereqs and isinstance(prereqs, list)
    prereqs_count = len(prereqs) if prereqs_is_list else None
    prereq_rows = prereqs if prereqs_is_list else []

    objectives, has_objectives = _get(manifest, "learning_objectives")
    objectives_is_list = has_objectives and isinstance(objectives, list)
    objectives_count = len(objectives) if objectives_is_list else None
    objective_rows = objectives if objectives_is_list else []
    objective_ids = _ids(objective_rows, "objective_id")

    sections_decl, has_sections_decl = _get(manifest, "explanation_sections")
    sections_is_list = has_sections_decl and isinstance(sections_decl, list)
    sections_count = len(sections_decl) if sections_is_list else None
    section_rows = sections_decl if sections_is_list else []
    section_ids = _ids(section_rows, "section_id")

    examples, has_examples = _get(manifest, "worked_examples")
    examples_is_list = has_examples and isinstance(examples, list)
    examples_count = len(examples) if examples_is_list else None
    example_rows = examples if examples_is_list else []

    misconceptions, has_misconceptions = _get(manifest, "misconceptions")
    misconceptions_is_list = (
        has_misconceptions and isinstance(misconceptions, list))
    misconceptions_count = (
        len(misconceptions) if misconceptions_is_list else None)
    misconception_rows = misconceptions if misconceptions_is_list else []

    sources, has_sources = _get(manifest, "sources")
    sources_is_list = has_sources and isinstance(sources, list)
    sources_count = len(sources) if sources_is_list else None
    source_rows = sources if sources_is_list else []
    source_ids = _ids(source_rows, "source_id")

    renderings, has_renderings = _get(manifest, "renderings")
    renderings_is_list = has_renderings and isinstance(renderings, list)
    renderings_count = len(renderings) if renderings_is_list else None
    rendering_rows = renderings if renderings_is_list else []

    duplicate_prereq_ids = (
        _duplicates(prereq_rows, "prerequisite_id")
        if prereqs_is_list else None)
    duplicate_objective_ids = (
        _duplicates(objective_rows, "objective_id")
        if objectives_is_list else None)
    duplicate_section_ids = (
        _duplicates(section_rows, "section_id")
        if sections_is_list else None)
    duplicate_example_ids = (
        _duplicates(example_rows, "example_id")
        if examples_is_list else None)
    duplicate_misconception_ids = (
        _duplicates(misconception_rows, "misconception_id")
        if misconceptions_is_list else None)
    duplicate_source_ids = (
        _duplicates(source_rows, "source_id")
        if sources_is_list else None)
    duplicate_rendering_ids = (
        _duplicates(rendering_rows, "rendering_id")
        if renderings_is_list else None)

    prereqs_without_description = (
        [_row_name(c, "prerequisite_id") for c in prereq_rows
         if _has(c, "description") and not _nonempty_str(c.get("description"))]
        if prereqs_is_list else None)
    objectives_without_outcome = (
        [_row_name(c, "objective_id") for c in objective_rows
         if _has(c, "outcome") and not _nonempty_str(c.get("outcome"))]
        if objectives_is_list else None)
    sections_with_invalid_stage = (
        [_row_name(c, "section_id") for c in section_rows
         if _has(c, "spine_stage") and c.get("spine_stage") not in SPINE_STAGES]
        if sections_is_list else None)
    sections_with_unknown_objective = (
        [_row_name(c, "section_id") for c in section_rows
         if _has(c, "objective_id")
         and c.get("objective_id") not in objective_ids]
        if sections_is_list and objectives_is_list else None)
    declared_stages = _ids(section_rows, "spine_stage")
    missing_spine_stages = (
        [s for s in SPINE_STAGES if s not in declared_stages]
        if sections_is_list else None)
    examples_with_unknown_objective = (
        [_row_name(c, "example_id") for c in example_rows
         if _has(c, "objective_id")
         and c.get("objective_id") not in objective_ids]
        if examples_is_list and objectives_is_list else None)
    examples_with_unknown_source = (
        [_row_name(c, "example_id") for c in example_rows
         if _has(c, "source_id") and c.get("source_id") not in source_ids]
        if examples_is_list and sources_is_list else None)
    examples_without_complete_steps = (
        [_row_name(c, "example_id") for c in example_rows
         if _has(c, "steps_declared_complete")
         and c.get("steps_declared_complete") is not True]
        if examples_is_list else None)
    sources_without_citation = (
        [_row_name(c, "source_id") for c in source_rows
         if _has(c, "citation") and not _nonempty_str(c.get("citation"))]
        if sources_is_list else None)
    sources_not_archived = (
        [_row_name(c, "source_id") for c in source_rows
         if _has(c, "archived") and c.get("archived") is not True]
        if sources_is_list else None)
    misconceptions_without_description = (
        [_row_name(c, "misconception_id") for c in misconception_rows
         if _has(c, "description") and not _nonempty_str(c.get("description"))]
        if misconceptions_is_list else None)
    misconceptions_with_unknown_section = (
        [_row_name(c, "misconception_id") for c in misconception_rows
         if _has(c, "addressed_section_id")
         and c.get("addressed_section_id") not in section_ids]
        if misconceptions_is_list and sections_is_list else None)
    renderings_with_invalid_kind = (
        [_row_name(c, "rendering_id") for c in rendering_rows
         if _has(c, "rendering_kind")
         and c.get("rendering_kind") not in RENDERING_KINDS]
        if renderings_is_list else None)
    renderings_not_derived = (
        [_row_name(c, "rendering_id") for c in rendering_rows
         if _has(c, "derived_from_canonical_source")
         and c.get("derived_from_canonical_source") is not True]
        if renderings_is_list else None)

    def _example_traced(c):
        return (objectives_is_list and sources_is_list
                and _has(c, "objective_id")
                and c.get("objective_id") in objective_ids
                and _has(c, "source_id")
                and c.get("source_id") in source_ids
                and c.get("steps_declared_complete") is True)

    spine_coverage_ratio = (
        len([s for s in SPINE_STAGES if s in declared_stages]) / len(SPINE_STAGES)
        if sections_is_list and sections_count > 0 else None)
    objective_coverage_ratio = (
        len([o for o in objective_ids
             if o in _ids(section_rows, "objective_id")]) / objectives_count
        if objectives_is_list and sections_is_list and objectives_count > 0
        else None)
    example_traceability_ratio = (
        sum(1 for c in example_rows if _example_traced(c)) / examples_count
        if examples_is_list and examples_count > 0 else None)
    source_archive_ratio = (
        sum(1 for c in source_rows if c.get("archived") is True) / sources_count
        if sources_is_list and sources_count > 0 else None)
    misconception_resolution_ratio = (
        sum(1 for c in misconception_rows
            if sections_is_list and _has(c, "addressed_section_id")
            and c.get("addressed_section_id") in section_ids)
        / misconceptions_count
        if misconceptions_is_list and misconceptions_count > 0 else None)
    rendering_derivation_ratio = (
        sum(1 for c in rendering_rows
            if c.get("derived_from_canonical_source") is True)
        / renderings_count
        if renderings_is_list and renderings_count > 0 else None)

    # ---- Section 1: audience_and_prerequisites ----
    S = "audience_and_prerequisites"
    _bool_check(results, S, "technical_explainer_audience_defined", manifest,
                ("audience", "defined"),
                "audience: the explainer audience was defined")
    _bool_check(results, S, "technical_explainer_reader_outcome_stated", manifest,
                ("audience", "reader_outcome_stated"),
                "audience & outcome: what the reader should be able to do or say afterwards was stated")
    _bool_check(results, S, "technical_explainer_prior_knowledge_assumption_stated", manifest,
                ("audience", "prior_knowledge_assumption_stated"),
                "audience: the assumed prior knowledge was stated — none assumed by default")
    # gated computed prerequisites
    gate, has_gate = _get(manifest, "audience", "prior_knowledge_assumed")
    if has_gate and gate:
        _check(results, S,
               "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed",
               prereqs, prereqs_is_list,
               prereqs_is_list and prereqs_count > 0,
               "prerequisites: prior knowledge is declared assumed, so the declared record names at least one prerequisite row")
    else:
        _check(results, S,
               "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed",
               gate, has_gate, True,
               "no prior knowledge declared assumed")
    prereq_id_present = prereqs_is_list and all(
        _has(c, "prerequisite_id") for c in prereq_rows)
    _check(results, S, "every_technical_explainer_prerequisite_id_unique",
           prereqs, prereq_id_present,
           prereqs_is_list and duplicate_prereq_ids is not None
           and len(duplicate_prereq_ids) == 0,
           "prerequisites: no declared prerequisite_id is owned by more than one row")
    prereq_desc_present = prereqs_is_list and all(
        _has(c, "description") for c in prereq_rows)
    _check(results, S, "every_technical_explainer_prerequisite_description_declared",
           prereqs, prereq_desc_present,
           prereqs_is_list
           and all(_nonempty_str(c.get("description")) for c in prereq_rows),
           "prerequisites: every declared prerequisite declares a non-empty description")

    # ---- Section 2: learning_objectives ----
    S = "learning_objectives"
    _bool_check(results, S, "technical_explainer_objectives_stated_as_do_or_say_outcomes", manifest,
                ("learning_objective_framing", "outcomes_stated_as_do_or_say"),
                "learning objectives: the objectives are stated as what the reader can do or say afterwards, not as topics covered")
    _check(results, S, "technical_explainer_learning_objectives_list_declared",
           objectives, objectives_is_list,
           objectives_is_list and objectives_count > 0,
           "learning objectives: the declared record names its learning objectives — the list is present and names at least one objective; an absent list is missing evidence and an empty list declares no objective at all")
    obj_id_present = objectives_is_list and all(
        _has(c, "objective_id") for c in objective_rows)
    _check(results, S, "every_technical_explainer_learning_objective_id_unique",
           objectives, obj_id_present,
           objectives_is_list and duplicate_objective_ids is not None
           and len(duplicate_objective_ids) == 0,
           "learning objectives: no declared objective_id is owned by more than one row")
    outcome_present = objectives_is_list and all(
        _has(c, "outcome") for c in objective_rows)
    _check(results, S, "every_technical_explainer_learning_objective_outcome_declared",
           objectives, outcome_present,
           objectives_is_list
           and all(_nonempty_str(c.get("outcome")) for c in objective_rows),
           "learning objectives: every declared objective declares a non-empty outcome")

    # ---- Section 3: explanation_spine_and_structure ----
    S = "explanation_spine_and_structure"
    _bool_check(results, S, "technical_explainer_spine_order_followed", manifest,
                ("structure", "follows_spine_order"),
                "spine: the piece follows question, why it matters, one core idea, how it works, where it breaks, what to watch, in order")
    _bool_check(results, S, "technical_explainer_single_core_idea_confirmed", manifest,
                ("structure", "single_core_idea_confirmed"),
                "spine: the piece carries one core idea only")
    _gated_bool_check(results, S,
                      "technical_explainer_second_core_idea_split_off_where_present",
                      manifest,
                      ("structure", "second_core_idea_present"),
                      ("structure", "second_core_idea_split_off"),
                      "spine: a second core idea was split off into its own piece",
                      "no second core idea declared present")
    _check(results, S, "technical_explainer_explanation_sections_list_declared",
           sections_decl, sections_is_list,
           sections_is_list and sections_count > 0,
           "explanation sections: the declared record names its explanation sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no structure at all")
    sec_id_present = sections_is_list and all(
        _has(c, "section_id") for c in section_rows)
    _check(results, S, "every_technical_explainer_explanation_section_id_unique",
           sections_decl, sec_id_present,
           sections_is_list and duplicate_section_ids is not None
           and len(duplicate_section_ids) == 0,
           "explanation sections: no declared section_id is owned by more than one row")
    stage_present = sections_is_list and all(
        _has(c, "spine_stage") for c in section_rows)
    _check(results, S, "every_technical_explainer_explanation_section_spine_stage_recognised",
           sections_decl, stage_present,
           sections_is_list
           and all(c.get("spine_stage") in SPINE_STAGES for c in section_rows),
           "explanation sections: every declared section's spine stage is one of question, why_it_matters, core_idea, how_it_works, where_it_breaks, what_to_watch")
    sec_obj_present = (sections_is_list and objectives_is_list and all(
        _has(c, "objective_id") for c in section_rows))
    _check(results, S, "every_technical_explainer_explanation_section_objective_reference_resolves",
           sections_decl, sec_obj_present,
           sections_is_list and objectives_is_list
           and all(_has(c, "objective_id")
                   and c.get("objective_id") in objective_ids
                   for c in section_rows),
           "explanation sections: every declared section's objective_id names a declared learning objective")
    _check(results, S, "technical_explainer_all_spine_stages_declared_present",
           sections_decl, stage_present,
           sections_is_list and missing_spine_stages == [],
           "spine: all six spine stages are present among the declared explanation sections — none missing")
    # ---- Section 4: simplification_and_analogy_integrity ----
    S = "simplification_and_analogy_integrity"
    _bool_check(results, S, "technical_explainer_language_simplified_not_facts", manifest,
                ("simplification", "language_simplified_not_facts"),
                "simplification contract: language was simplified, never facts")
    _bool_check(results, S, "technical_explainer_simplifications_flagged_explicitly", manifest,
                ("simplification", "simplifications_flagged_explicitly"),
                "simplification contract / quality gate: what was simplified, and how, was explicitly flagged")
    _bool_check(results, S, "technical_explainer_units_preserved_correct", manifest,
                ("simplification", "units_preserved_correct"),
                "simplification contract: units were kept correct through simplification")
    _bool_check(results, S, "technical_explainer_orders_of_magnitude_preserved_correct", manifest,
                ("simplification", "orders_of_magnitude_preserved_correct"),
                "simplification contract: orders of magnitude were kept correct through simplification")
    _bool_check(results, S, "technical_explainer_directions_preserved_correct", manifest,
                ("simplification", "directions_preserved_correct"),
                "simplification contract: directions (up/down) were kept correct through simplification")
    _bool_check(results, S, "technical_explainer_jargon_defined_on_first_use", manifest,
                ("simplification", "jargon_defined_on_first_use"),
                "quality gate: jargon was defined on first use")
    _bool_check(results, S, "technical_explainer_reading_level_appropriate_for_audience", manifest,
                ("simplification", "reading_level_appropriate_for_audience"),
                "quality gate: the reading level was declared appropriate for the declared audience")
    _gated_bool_check(results, S,
                      "technical_explainer_single_analogy_confirmed_where_analogy_used",
                      manifest,
                      ("analogy", "analogy_used"),
                      ("analogy", "single_analogy_confirmed"),
                      "analogies that confess: only one analogy is used",
                      "no analogy declared used")
    _gated_bool_check(results, S,
                      "technical_explainer_analogy_failure_mode_stated_where_analogy_used",
                      manifest,
                      ("analogy", "analogy_used"),
                      ("analogy", "failure_mode_stated"),
                      "analogies that confess / quality gate: the analogy is stated with its failure mode — where it breaks",
                      "no analogy declared used")

    # ---- Section 5: worked_examples_and_concrete_numbers ----
    S = "worked_examples_and_concrete_numbers"
    _bool_check(results, S, "technical_explainer_worked_mini_examples_included", manifest,
                ("example_work", "worked_mini_examples_included"),
                "concrete numbers & cases: worked mini-examples are included")
    _bool_check(results, S, "technical_explainer_concrete_numbers_included", manifest,
                ("example_work", "concrete_numbers_included"),
                "concrete numbers & cases: concrete numbers are included, as real figures with dates and sources")
    _bool_check(results, S, "technical_explainer_concrete_cases_included", manifest,
                ("example_work", "concrete_cases_included"),
                "concrete numbers & cases: concrete cases are included")
    _bool_check(results, S, "technical_explainer_visuals_included_where_they_carry_weight", manifest,
                ("example_work", "visuals_included_where_they_carry_weight"),
                "concrete numbers & cases: visuals are included where they carry weight")
    _check(results, S, "technical_explainer_worked_examples_list_declared",
           examples, examples_is_list,
           examples_is_list and examples_count > 0,
           "worked examples: the declared record names its worked examples — the list is present and names at least one example; an absent list is missing evidence and an empty list declares no worked example at all")
    ex_id_present = examples_is_list and all(
        _has(c, "example_id") for c in example_rows)
    _check(results, S, "every_technical_explainer_worked_example_id_unique",
           examples, ex_id_present,
           examples_is_list and duplicate_example_ids is not None
           and len(duplicate_example_ids) == 0,
           "worked examples: no declared example_id is owned by more than one row")
    ex_obj_present = (examples_is_list and objectives_is_list and all(
        _has(c, "objective_id") for c in example_rows))
    _check(results, S, "every_technical_explainer_worked_example_objective_reference_resolves",
           examples, ex_obj_present,
           examples_is_list and objectives_is_list
           and all(_has(c, "objective_id")
                   and c.get("objective_id") in objective_ids
                   for c in example_rows),
           "worked examples: every declared example's objective_id names a declared learning objective")
    ex_src_present = (examples_is_list and sources_is_list and all(
        _has(c, "source_id") for c in example_rows))
    _check(results, S, "every_technical_explainer_worked_example_source_reference_resolves",
           examples, ex_src_present,
           examples_is_list and sources_is_list
           and all(_has(c, "source_id")
                   and c.get("source_id") in source_ids
                   for c in example_rows),
           "worked examples: every declared example's source_id names a declared accuracy source — its figures trace to a declared source")
    steps_present = examples_is_list and all(
        _has(c, "steps_declared_complete") for c in example_rows)
    _check(results, S, "every_technical_explainer_worked_example_steps_declared_complete",
           examples, steps_present,
           examples_is_list
           and all(c.get("steps_declared_complete") is True
                   for c in example_rows),
           "worked examples: every declared example is declared steps-complete")

    # ---- Section 6: misconceptions_accuracy_and_safety ----
    S = "misconceptions_accuracy_and_safety"
    _bool_check(results, S, "technical_explainer_accuracy_review_done", manifest,
                ("accuracy", "accuracy_review_done"),
                "verification loop / quality gate: accuracy review was done")
    _bool_check(results, S, "technical_explainer_every_factual_claim_labeled", manifest,
                ("accuracy", "every_factual_claim_labeled"),
                "verification loop / quality gate: every factual claim was labeled")
    _bool_check(results, S, "technical_explainer_every_factual_claim_sourced", manifest,
                ("accuracy", "every_factual_claim_sourced"),
                "verification loop: every factual claim was sourced")
    _check(results, S, "technical_explainer_accuracy_sources_list_declared",
           sources, sources_is_list,
           sources_is_list and sources_count > 0,
           "accuracy sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced explainer at all")
    src_id_present = sources_is_list and all(
        _has(c, "source_id") for c in source_rows)
    _check(results, S, "every_technical_explainer_accuracy_source_id_unique",
           sources, src_id_present,
           sources_is_list and duplicate_source_ids is not None
           and len(duplicate_source_ids) == 0,
           "accuracy sources: no declared source_id is owned by more than one row")
    citation_present = sources_is_list and all(
        _has(c, "citation") for c in source_rows)
    _check(results, S, "every_technical_explainer_accuracy_source_citation_recorded",
           sources, citation_present,
           sources_is_list
           and all(_nonempty_str(c.get("citation")) for c in source_rows),
           "accuracy sources: every declared source declares a non-empty citation as recorded")
    archived_present = sources_is_list and all(
        _has(c, "archived") for c in source_rows)
    _check(results, S, "every_technical_explainer_accuracy_source_archived",
           sources, archived_present,
           sources_is_list
           and all(c.get("archived") is True for c in source_rows),
           "accuracy sources / quality gate: every declared source is declared archived")
    _check(results, S, "technical_explainer_misconceptions_list_declared",
           misconceptions, misconceptions_is_list,
           misconceptions_is_list and misconceptions_count > 0,
           "misconceptions: the declared record names the misconceptions it handles — the list is present and names at least one misconception; an absent list is missing evidence and an empty list declares no misconception handling at all")
    misc_id_present = misconceptions_is_list and all(
        _has(c, "misconception_id") for c in misconception_rows)
    _check(results, S, "every_technical_explainer_misconception_id_unique",
           misconceptions, misc_id_present,
           misconceptions_is_list and duplicate_misconception_ids is not None
           and len(duplicate_misconception_ids) == 0,
           "misconceptions: no declared misconception_id is owned by more than one row")
    misc_desc_present = misconceptions_is_list and all(
        _has(c, "description") for c in misconception_rows)
    _check(results, S, "every_technical_explainer_misconception_description_declared",
           misconceptions, misc_desc_present,
           misconceptions_is_list
           and all(_nonempty_str(c.get("description"))
                   for c in misconception_rows),
           "misconceptions: every declared misconception declares a non-empty description")
    misc_sec_present = (misconceptions_is_list and sections_is_list and all(
        _has(c, "addressed_section_id") for c in misconception_rows))
    _check(results, S, "every_technical_explainer_misconception_addressed_section_reference_resolves",
           misconceptions, misc_sec_present,
           misconceptions_is_list and sections_is_list
           and all(_has(c, "addressed_section_id")
                   and c.get("addressed_section_id") in section_ids
                   for c in misconception_rows),
           "misconceptions: every declared misconception's addressed_section_id names a declared explanation section")
    _gated_bool_check(results, S,
                      "technical_explainer_safety_expert_review_where_safety_relevant",
                      manifest,
                      ("safety", "safety_relevant_topic"),
                      ("safety", "expert_review_by_qualified_person"),
                      "verification loop / quality gate: safety-relevant content was reviewed by a qualified person",
                      "no safety-relevant topic declared")
    _gated_bool_check(results, S,
                      "technical_explainer_defers_to_licensed_practice_note_where_safety_relevant",
                      manifest,
                      ("safety", "safety_relevant_topic"),
                      ("safety", "defers_to_licensed_practice_note_included"),
                      "verification loop: a defers-to-licensed-practice note is included for the safety-relevant topic",
                      "no safety-relevant topic declared")

    # ---- Section 7: renderings_and_corrections ----
    S = "renderings_and_corrections"
    _bool_check(results, S, "technical_explainer_canonical_explainer_identified", manifest,
                ("canonical", "canonical_explainer_identified"),
                "re-render, don't rewrite: one canonical explainer was identified as the source")
    _bool_check(results, S, "technical_explainer_renderings_regenerated_from_canonical_after_updates", manifest,
                ("canonical", "renderings_regenerated_from_canonical_after_updates"),
                "re-render, don't rewrite: after an update, the source was updated and the renderings regenerated from it")
    _check(results, S, "technical_explainer_renderings_list_declared",
           renderings, renderings_is_list,
           renderings_is_list and renderings_count > 0,
           "renderings: the declared record names its renderings — the list is present and names at least one rendering; an absent list is missing evidence and an empty list declares no rendering at all")
    rend_id_present = renderings_is_list and all(
        _has(c, "rendering_id") for c in rendering_rows)
    _check(results, S, "every_technical_explainer_rendering_id_unique",
           renderings, rend_id_present,
           renderings_is_list and duplicate_rendering_ids is not None
           and len(duplicate_rendering_ids) == 0,
           "renderings: no declared rendering_id is owned by more than one row")
    kind_present = renderings_is_list and all(
        _has(c, "rendering_kind") for c in rendering_rows)
    _check(results, S, "every_technical_explainer_rendering_kind_recognised",
           renderings, kind_present,
           renderings_is_list
           and all(c.get("rendering_kind") in RENDERING_KINDS
                   for c in rendering_rows),
           "renderings: every declared rendering's kind is one of faq, thread, video_script — the renderings the skill names")
    derived_present = renderings_is_list and all(
        _has(c, "derived_from_canonical_source") for c in rendering_rows)
    _check(results, S, "every_technical_explainer_rendering_derived_from_canonical_source",
           renderings, derived_present,
           renderings_is_list
           and all(c.get("derived_from_canonical_source") is True
                   for c in rendering_rows),
           "renderings: every declared rendering is declared derived from the canonical explainer, not rewritten separately")
    _bool_check(results, S, "technical_explainer_corrections_dated", manifest,
                ("corrections", "corrections_dated"),
                "corrections: corrections are dated")
    _bool_check(results, S, "technical_explainer_corrections_visible", manifest,
                ("corrections", "corrections_visible"),
                "corrections: corrections are visible")
    _bool_check(results, S, "technical_explainer_corrections_logged", manifest,
                ("corrections", "corrections_logged"),
                "corrections: corrections are logged")

    # ---- Section 8: red_lines ----
    S = "red_lines"
    _false_check(results, S, "technical_explainer_free_of_invented_numbers_or_figures", manifest,
                 ("red_lines", "invented_numbers_or_figures_present"),
                 "red line: no invented numbers or figures are present in the record")
    _false_check(results, S, "technical_explainer_free_of_unsupported_studies_show_claim", manifest,
                 ("red_lines", "unsupported_studies_show_claim_present"),
                 "red line: no 'studies show' claim without a study is present in the record")
    _false_check(results, S, "technical_explainer_free_of_fear_mongering_or_hype", manifest,
                 ("red_lines", "fear_mongering_or_hype_present"),
                 "red line: no fear-mongering or hype is present in the record")
    _false_check(results, S, "technical_explainer_free_of_teaching_beyond_declared_competence", manifest,
                 ("red_lines", "teaching_beyond_declared_competence_present"),
                 "red line: no teaching beyond competence without review is present in the record")
    _false_check(results, S, "technical_explainer_free_of_unlicensed_practice_encouragement", manifest,
                 ("red_lines", "unlicensed_practice_encouraged_present"),
                 "red line: no encouragement of unlicensed practice — in particular electrical/power practice — is present in the record")

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
        verdict = "EXPLAINER_CONTENT_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "EXPLAINER_CONTENT_SOUND"

    computed_names = (
        "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed",
        "every_technical_explainer_prerequisite_id_unique",
        "every_technical_explainer_prerequisite_description_declared",
        "technical_explainer_learning_objectives_list_declared",
        "every_technical_explainer_learning_objective_id_unique",
        "every_technical_explainer_learning_objective_outcome_declared",
        "technical_explainer_explanation_sections_list_declared",
        "every_technical_explainer_explanation_section_id_unique",
        "every_technical_explainer_explanation_section_spine_stage_recognised",
        "every_technical_explainer_explanation_section_objective_reference_resolves",
        "technical_explainer_all_spine_stages_declared_present",
        "technical_explainer_worked_examples_list_declared",
        "every_technical_explainer_worked_example_id_unique",
        "every_technical_explainer_worked_example_objective_reference_resolves",
        "every_technical_explainer_worked_example_source_reference_resolves",
        "every_technical_explainer_worked_example_steps_declared_complete",
        "technical_explainer_accuracy_sources_list_declared",
        "every_technical_explainer_accuracy_source_id_unique",
        "every_technical_explainer_accuracy_source_citation_recorded",
        "every_technical_explainer_accuracy_source_archived",
        "technical_explainer_misconceptions_list_declared",
        "every_technical_explainer_misconception_id_unique",
        "every_technical_explainer_misconception_description_declared",
        "every_technical_explainer_misconception_addressed_section_reference_resolves",
        "technical_explainer_renderings_list_declared",
        "every_technical_explainer_rendering_id_unique",
        "every_technical_explainer_rendering_kind_recognised",
        "every_technical_explainer_rendering_derived_from_canonical_source",
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
        "service": "technical-explainer-content-pack",
        "atom_version": "0.1.0",
        "explainer_title": manifest.get("explainer_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "technical_explainer_prerequisites_count": prereqs_count,
        "technical_explainer_learning_objectives_count": objectives_count,
        "technical_explainer_explanation_sections_count": sections_count,
        "technical_explainer_worked_examples_count": examples_count,
        "technical_explainer_misconceptions_count": misconceptions_count,
        "technical_explainer_accuracy_sources_count": sources_count,
        "technical_explainer_renderings_count": renderings_count,
        "duplicate_technical_explainer_prerequisite_ids": duplicate_prereq_ids,
        "duplicate_technical_explainer_learning_objective_ids": duplicate_objective_ids,
        "duplicate_technical_explainer_explanation_section_ids": duplicate_section_ids,
        "duplicate_technical_explainer_worked_example_ids": duplicate_example_ids,
        "duplicate_technical_explainer_misconception_ids": duplicate_misconception_ids,
        "duplicate_technical_explainer_accuracy_source_ids": duplicate_source_ids,
        "duplicate_technical_explainer_rendering_ids": duplicate_rendering_ids,
        "technical_explainer_prerequisites_without_description": prereqs_without_description,
        "technical_explainer_learning_objectives_without_outcome": objectives_without_outcome,
        "technical_explainer_explanation_sections_with_invalid_spine_stage": sections_with_invalid_stage,
        "technical_explainer_explanation_sections_with_unknown_objective_reference": sections_with_unknown_objective,
        "technical_explainer_missing_spine_stages": missing_spine_stages,
        "technical_explainer_worked_examples_with_unknown_objective_reference": examples_with_unknown_objective,
        "technical_explainer_worked_examples_with_unknown_source_reference": examples_with_unknown_source,
        "technical_explainer_worked_examples_without_complete_steps": examples_without_complete_steps,
        "technical_explainer_accuracy_sources_without_citation": sources_without_citation,
        "technical_explainer_accuracy_sources_not_archived": sources_not_archived,
        "technical_explainer_misconceptions_without_description": misconceptions_without_description,
        "technical_explainer_misconceptions_with_unknown_addressed_section": misconceptions_with_unknown_section,
        "technical_explainer_renderings_with_invalid_kind": renderings_with_invalid_kind,
        "technical_explainer_renderings_not_derived_from_canonical": renderings_not_derived,
        "spine_stage_coverage_ratio": _fmt6(spine_coverage_ratio),
        "objective_section_coverage_ratio": _fmt6(objective_coverage_ratio),
        "worked_example_traceability_ratio": _fmt6(example_traceability_ratio),
        "accuracy_source_archive_ratio": _fmt6(source_archive_ratio),
        "misconception_resolution_ratio": _fmt6(misconception_resolution_ratio),
        "rendering_derivation_ratio": _fmt6(rendering_derivation_ratio),
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
        "TECHNICAL EXPLAINER CONTENT PACK",
        f"explainer_title: {verdict.get('explainer_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: technical_explainer_content_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "EXPLAINER_CONTENT_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
