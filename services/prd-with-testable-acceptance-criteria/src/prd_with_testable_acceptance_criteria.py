#!/usr/bin/env python3
"""PRD with testable acceptance criteria — deterministic core.

Built from the bound skill `product-requirements`: "Convert a
problem or idea into a buildable, testable specification.
Nothing enters build without an approved spec (phased
delivery)."

This atom is a DELIVERABLE audit of a declared product
requirements document (PRD) record: it audits the PRD record a
caller declares against the PRD the skill defines — problem
first (who has it, why now, five sentences or fewer) and an
observable outcome over output, stories in the
As-a / I-want / so-that form with a P0/P1/P2 priority on each,
testable and binary acceptance criteria traced to the stories
they accept, explicit scope fences with an out-of-scope list
(no "misc" bucket) and deferrals in a later list, priorities
with conflicts resolved by the decision owner and key
decisions logged, open questions tracked explicitly and
blocking build only when they change architecture, an
approved spec, and the skill's red lines refused (no build
before an approved spec — timeboxed spikes excepted, labeled
as such — and no scope widening mid-phase without updating
the PRD and re-approval). It does not write a PRD itself,
interview anyone, run any test, inspect any repository, or
verify that a declared PRD was ever approved or built from —
it checks that the PRD record the skill requires is present
and internally complete and consistent on the declared
evidence.

Distinct ground: the nearest siblings are
`designed-test-case-pack` (a designed TEST-CASE record —
equivalence partitioning, boundary values, negative cases,
cases traced to requirements), `delivery-plan-preparation`
(a delivery PLAN record — phases, milestones, dependencies,
estimates, a risk register and a decision log for executing
work) and `buyer-test-card` (a bounded BUYER/POC test card —
one hypothesis, success/kill criteria written before a
timeboxed trial starts). This atom shares zero checks with
any of them: every check here is a PRD question — the problem
stated in five sentences or fewer with who has it and why
now, an outcome expressed as behavior or metric rather than
a feature, every story stating role/capability/benefit with
a P0/P1/P2 priority, every story carrying testable and
binary acceptance criteria and every criterion traced back
to a declared story, an out-of-scope list with no "misc"
bucket, deferrals in a later list never silently inside the
scope, P0 items shippable alone, open questions whose build-
blocking flag matches whether they change architecture, and
the PRD red lines. The boundary is: the requirements
specification for a product here; the test cases designed
from requirements, the plan for delivering work, and a
timeboxed buyer trial there.

The caller submits a PRD manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- problem length: the skill states the problem is stated in
  "five sentences or fewer", so the declared
  `problem.statement_sentence_count` passes when it is
  between 1 and 5 inclusive — the skill's own stated limit,
  checked against the caller's declared count, never against
  prose the atom parses or counts itself;
- stories and criteria: the declared `stories` and
  `acceptance_criteria` lists must each be present and
  non-empty (the skill's artifact is stories with acceptance
  criteria — a PRD with neither declares nothing testable),
  every story row must state a non-empty role, capability and
  benefit (the skill's story form), carry a unique non-empty
  id and a priority that is one of the skill's stated P0, P1
  or P2, every story must be traced to by at least one
  criterion row, every criterion row must trace to a declared
  story, carry a unique non-empty id, and declare itself both
  testable and binary (the skill: "testable and binary per
  story ... If it can't be tested, it's not a criterion");
- scope fences: the declared `out_of_scope_items` list must
  be present and non-empty, and no entry may be the "misc"
  bucket the skill's quality gate bars (an entry whose
  trimmed, lower-cased text is exactly "misc");
- open questions: the declared `open_questions` list must be
  present (an empty list is a valid declaration — the PRD
  tracks no open questions), and on every row the declared
  `blocks_build` flag must equal the declared
  `architecture_changing` flag (the skill: open questions
  "block build only on questions that change architecture").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states exactly one numeric limit — the problem
statement at five sentences or fewer — and it is checked
only against the caller's declared sentence count, never as
prose the atom parses. No other numeric threshold is stated
— no story count, no criteria-per-story count beyond the
quality gate's every-story-has-criteria completeness over
the declared rows, no priority mix beyond the P0/P1/P2 labels
the skill names, no open-question count — so no numeric
threshold check is invented; those quantities are computed
and reported, with completeness (every declared story,
criterion and question row) as the only bar, exactly as
stated above.

Verdict:
- any fail             -> PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "problem_and_outcome",
    "stories_and_acceptance_criteria",
    "scope_fences",
    "priorities_and_decisions",
    "open_questions_and_approval",
    "red_lines",
)

MANIFEST_SPEC = {
    "product": "string",
    "problem": {
        "statement_declared": "boolean",
        "who_has_it_declared": "boolean",
        "why_now_declared": "boolean",
        "problem_first_before_solution_declared": "boolean",
        "statement_sentence_count": "number",
    },
    "outcome": {
        "observable_change_defined": "boolean",
        "outcome_is_behavior_or_metric_not_feature_only": "boolean",
    },
    "stories": [{
        "id": "string",
        "role": "string",
        "capability": "string",
        "benefit": "string",
        "priority": "string",
    }],
    "acceptance_criteria": [{
        "id": "string",
        "story_id": "string",
        "testable_declared": "boolean",
        "binary_declared": "boolean",
    }],
    "out_of_scope_items": ["string"],
    "scope": {
        "explicit_out_of_scope_list_declared": "boolean",
        "explicit_scope_boundaries_declared": "boolean",
        "deferrals_placed_in_later_list": "boolean",
        "deferrals_not_silently_inside_scope": "boolean",
    },
    "priorities": {
        "priority_scheme_p0_p1_p2_applied": "boolean",
        "priority_tiers_applied_in_shipping_order": "boolean",
        "p0_items_shippable_alone_declared": "boolean",
        "priority_conflicts_resolved_with_decision_owner": "boolean",
    },
    "decisions": {
        "decision_owner_named": "boolean",
        "key_decisions_logged_in_prd": "boolean",
    },
    "open_questions": [{
        "id": "string",
        "architecture_changing": "boolean",
        "blocks_build": "boolean",
    }],
    "open_question_tracking": {
        "tracked_explicitly": "boolean",
        "architecture_changing_questions_block_build": "boolean",
        "non_architecture_questions_do_not_block_build": "boolean",
    },
    "approval": {
        "approved_spec_declared": "boolean",
    },
    "red_lines": {
        "build_started_before_approved_spec_present": "boolean",
        "unlabeled_spike_treated_as_approved_spec_present": "boolean",
        "scope_widened_mid_phase_without_prd_update_and_reapproval_present": "boolean",
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


def _row_id(entry):
    if isinstance(entry, dict) and isinstance(entry.get("id"), str):
        return entry["id"]
    return "unnamed"


def _duplicates(rows, field="id"):
    seen = []
    dups = []
    for row in rows:
        if isinstance(row, dict) and isinstance(row.get(field), str):
            value = row[field]
            if value in seen and value not in dups:
                dups.append(value)
            seen.append(value)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a PRD manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    sentence_count, has_sentence_count = _get(
        manifest, "problem", "statement_sentence_count")

    stories, has_stories = _get(manifest, "stories")
    stories_is_list = has_stories and isinstance(stories, list)
    stories_count = len(stories) if stories_is_list else None
    story_rows = stories if stories_is_list else []

    criteria, has_criteria = _get(manifest, "acceptance_criteria")
    criteria_is_list = has_criteria and isinstance(criteria, list)
    criteria_count = len(criteria) if criteria_is_list else None
    criteria_rows = criteria if criteria_is_list else []

    story_ids = (
        [r["id"] for r in story_rows
         if isinstance(r, dict) and isinstance(r.get("id"), str)
         and len(r["id"]) > 0]
        if stories_is_list else []
    )
    traced_story_ids = (
        [r["story_id"] for r in criteria_rows
         if isinstance(r, dict) and isinstance(r.get("story_id"), str)]
        if criteria_is_list else []
    )
    stories_without_criteria = (
        [_row_id(r) for r in story_rows
         if isinstance(r, dict) and "id" in r
         and isinstance(r.get("id"), str) and len(r["id"]) > 0
         and r["id"] not in traced_story_ids]
        if stories_is_list and criteria_is_list else None
    )

    def _traces(row):
        return (isinstance(row, dict)
                and isinstance(row.get("story_id"), str)
                and row["story_id"] in story_ids)

    criteria_without_declared_story = (
        [_row_id(r) for r in criteria_rows
         if isinstance(r, dict) and "story_id" in r and not _traces(r)]
        if criteria_is_list and stories_is_list else None
    )
    duplicate_story_ids = (
        _duplicates(story_rows) if stories_is_list else None
    )
    duplicate_criterion_ids = (
        _duplicates(criteria_rows) if criteria_is_list else None
    )
    p0_story_count = (
        sum(1 for r in story_rows
            if isinstance(r, dict) and r.get("priority") == "P0")
        if stories_is_list else None
    )
    story_criteria_coverage = (
        (stories_count - len(stories_without_criteria)) / stories_count
        if stories_without_criteria is not None and stories_count
        else None
    )
    testable_criteria_coverage = (
        sum(1 for r in criteria_rows
            if isinstance(r, dict) and r.get("testable_declared") is True)
        / criteria_count
        if criteria_is_list and criteria_count else None
    )
    binary_criteria_coverage = (
        sum(1 for r in criteria_rows
            if isinstance(r, dict) and r.get("binary_declared") is True)
        / criteria_count
        if criteria_is_list and criteria_count else None
    )

    out_of_scope, has_out_of_scope = _get(manifest, "out_of_scope_items")
    out_is_list = has_out_of_scope and isinstance(out_of_scope, list)
    out_count = len(out_of_scope) if out_is_list else None
    out_rows = out_of_scope if out_is_list else []
    misc_bucket_items = (
        [entry for entry in out_rows
         if isinstance(entry, str) and entry.strip().lower() == "misc"]
        if out_is_list else None
    )

    questions, has_questions = _get(manifest, "open_questions")
    questions_is_list = has_questions and isinstance(questions, list)
    questions_count = len(questions) if questions_is_list else None
    question_rows = questions if questions_is_list else []
    architecture_changing_count = (
        sum(1 for r in question_rows
            if isinstance(r, dict)
            and r.get("architecture_changing") is True)
        if questions_is_list else None
    )
    blocking_question_count = (
        sum(1 for r in question_rows
            if isinstance(r, dict) and r.get("blocks_build") is True)
        if questions_is_list else None
    )

    # ---- Section 1: problem_and_outcome (skill Method 1
    #      "Problem first" — the problem, who has it, and why
    #      now, in five sentences or fewer; Method 2 "Outcome
    #      over output" — the observable change, behavior or
    #      metric, not just the feature) ----
    _bool_check(results, "problem_and_outcome",
                "problem_statement_declared", manifest,
                ("problem", "statement_declared"),
                "problem first: the problem is stated in the PRD")
    _bool_check(results, "problem_and_outcome",
                "problem_who_has_it_declared", manifest,
                ("problem", "who_has_it_declared"),
                "problem first: the PRD states who has the problem")
    _bool_check(results, "problem_and_outcome",
                "problem_why_now_declared", manifest,
                ("problem", "why_now_declared"),
                "problem first: the PRD states why now")
    _check(results, "problem_and_outcome",
           "problem_statement_within_five_sentences", sentence_count,
           has_sentence_count,
           has_sentence_count
           and isinstance(sentence_count, (int, float))
           and not isinstance(sentence_count, bool)
           and 1 <= sentence_count <= 5,
           "problem first: the problem statement is five "
           "sentences or fewer, on the declared sentence count")
    _bool_check(results, "problem_and_outcome",
                "problem_considered_before_solution", manifest,
                ("problem", "problem_first_before_solution_declared"),
                "problem first: the problem is addressed before "
                "any solution or feature")
    _bool_check(results, "problem_and_outcome",
                "observable_outcome_defined", manifest,
                ("outcome", "observable_change_defined"),
                "outcome over output: the observable change the "
                "PRD aims at is defined")
    _bool_check(results, "problem_and_outcome",
                "outcome_expressed_as_behavior_or_metric", manifest,
                ("outcome",
                 "outcome_is_behavior_or_metric_not_feature_only"),
                "outcome over output: the outcome is expressed "
                "as a behavior or metric, not just a feature")

    # ---- Section 2: stories_and_acceptance_criteria (skill
    #      Method 3 "Stories" — As a <role>, I want
    #      <capability>, so that <benefit>, one per behavior;
    #      Method 4 "Acceptance criteria" — testable and binary
    #      per story; Method 6 priorities P0/P1/P2 on each
    #      story; and the quality gate "every story has
    #      testable acceptance criteria") ----
    _check(results, "stories_and_acceptance_criteria",
           "prd_stories_declared", stories, stories_is_list,
           stories_is_list and stories_count > 0,
           "stories: the declared PRD record names its user "
           "stories — the stories list is present and non-empty")
    story_form_present = (
        stories_is_list
        and all(isinstance(r, dict) and "role" in r
                and "capability" in r and "benefit" in r
                for r in story_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_prd_story_states_role_capability_and_benefit",
           stories, story_form_present,
           stories_is_list and stories_count > 0
           and all(isinstance(r, dict)
                   and isinstance(r.get("role"), str)
                   and r.get("role") != ""
                   and isinstance(r.get("capability"), str)
                   and r.get("capability") != ""
                   and isinstance(r.get("benefit"), str)
                   and r.get("benefit") != ""
                   for r in story_rows),
           "stories: every declared story states its role, "
           "capability and benefit — As a <role>, I want "
           "<capability>, so that <benefit>")
    story_id_present = (
        stories_is_list
        and all(isinstance(r, dict) and "id" in r for r in story_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_prd_story_id_unique_and_nonempty", stories,
           story_id_present,
           stories_is_list and stories_count > 0
           and duplicate_story_ids is not None
           and len(duplicate_story_ids) == 0
           and all(isinstance(r, dict)
                   and isinstance(r.get("id"), str)
                   and len(r["id"]) > 0 for r in story_rows),
           "stories: every declared story carries a non-empty "
           "id, and no story id is declared twice")
    priority_present = (
        stories_is_list
        and all(isinstance(r, dict) and "priority" in r
                for r in story_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_prd_story_priority_is_p0_p1_or_p2", stories,
           priority_present,
           stories_is_list and stories_count > 0
           and all(isinstance(r, dict)
                   and r.get("priority") in ("P0", "P1", "P2")
                   for r in story_rows),
           "prioritize: every declared story carries one of "
           "the skill's stated priorities — P0 (must ship), P1 "
           "(should) or P2 (could)")
    _check(results, "stories_and_acceptance_criteria",
           "acceptance_criteria_declared", criteria, criteria_is_list,
           criteria_is_list and criteria_count > 0,
           "acceptance criteria: the declared PRD record names "
           "its acceptance criteria — the acceptance_criteria "
           "list is present and non-empty")
    story_trace_present = (
        stories_is_list and criteria_is_list
        and all(isinstance(r, dict) and "id" in r for r in story_rows)
        and all(isinstance(r, dict) and "story_id" in r
                for r in criteria_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_story_has_acceptance_criteria", stories,
           story_trace_present,
           stories_is_list and criteria_is_list
           and stories_count > 0 and criteria_count > 0
           and stories_without_criteria is not None
           and len(stories_without_criteria) == 0,
           "quality gate: every story has acceptance criteria "
           "— every declared story is traced to by at least "
           "one declared criterion")
    criterion_trace_present = (
        criteria_is_list and stories_is_list
        and all(isinstance(r, dict) and "story_id" in r
                for r in criteria_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_acceptance_criterion_traces_to_declared_story",
           criteria, criterion_trace_present,
           criteria_is_list and stories_is_list
           and criteria_count > 0
           and criteria_without_declared_story is not None
           and len(criteria_without_declared_story) == 0
           and all(_traces(r) for r in criteria_rows),
           "acceptance criteria: every declared criterion "
           "traces to a declared story")
    criterion_id_present = (
        criteria_is_list
        and all(isinstance(r, dict) and "id" in r
                for r in criteria_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_acceptance_criterion_id_unique_and_nonempty",
           criteria, criterion_id_present,
           criteria_is_list and criteria_count > 0
           and duplicate_criterion_ids is not None
           and len(duplicate_criterion_ids) == 0
           and all(isinstance(r, dict)
                   and isinstance(r.get("id"), str)
                   and len(r["id"]) > 0 for r in criteria_rows),
           "acceptance criteria: every declared criterion "
           "carries a non-empty id, and no criterion id is "
           "declared twice")
    testable_present = (
        criteria_is_list
        and all(isinstance(r, dict) and "testable_declared" in r
                for r in criteria_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_acceptance_criterion_declared_testable", criteria,
           testable_present,
           criteria_is_list and criteria_count > 0
           and all(isinstance(r, dict)
                   and r.get("testable_declared") is True
                   for r in criteria_rows),
           "acceptance criteria: every declared criterion is "
           "declared testable — if it can't be tested, it's "
           "not a criterion")
    binary_present = (
        criteria_is_list
        and all(isinstance(r, dict) and "binary_declared" in r
                for r in criteria_rows)
    )
    _check(results, "stories_and_acceptance_criteria",
           "every_acceptance_criterion_declared_binary", criteria,
           binary_present,
           criteria_is_list and criteria_count > 0
           and all(isinstance(r, dict)
                   and r.get("binary_declared") is True
                   for r in criteria_rows),
           "acceptance criteria: every declared criterion is "
           "declared binary — it passes or it fails, with no "
           "middle state")

    # ---- Section 3: scope_fences (skill Method 5 "Scope
    #      fences" — an explicit out-of-scope list; deferrals
    #      go to a "later" list, never silently inside; and
    #      the quality gate "out-of-scope list exists; no
    #      'misc' bucket") ----
    _check(results, "scope_fences",
           "out_of_scope_items_declared", out_of_scope, out_is_list,
           out_is_list and out_count > 0,
           "scope fences: the declared PRD record names its "
           "out-of-scope items — the out_of_scope_items list "
           "is present and non-empty")
    _check(results, "scope_fences",
           "no_misc_bucket_in_out_of_scope_items", out_of_scope,
           out_is_list,
           out_is_list and misc_bucket_items is not None
           and len(misc_bucket_items) == 0,
           "quality gate: the out-of-scope list carries no "
           "\"misc\" bucket")
    _bool_check(results, "scope_fences",
                "explicit_out_of_scope_list_declared", manifest,
                ("scope", "explicit_out_of_scope_list_declared"),
                "scope fences: an explicit out-of-scope list is "
                "declared in the PRD")
    _bool_check(results, "scope_fences",
                "explicit_scope_boundaries_declared", manifest,
                ("scope", "explicit_scope_boundaries_declared"),
                "scope fences: the PRD's scope boundaries are "
                "declared explicitly")
    _bool_check(results, "scope_fences",
                "deferrals_placed_in_later_list", manifest,
                ("scope", "deferrals_placed_in_later_list"),
                "scope fences: deferrals go to a \"later\" list")
    _bool_check(results, "scope_fences",
                "deferrals_not_silently_inside_scope", manifest,
                ("scope", "deferrals_not_silently_inside_scope"),
                "scope fences: no deferral sits silently inside "
                "the scope")

    # ---- Section 4: priorities_and_decisions (skill Method 6
    #      "Prioritize" — P0/P1/P2, conflicts resolved with
    #      the decision owner, the decision logged; and the
    #      quality gates "P0 items are shippable alone" and
    #      "key decisions logged") ----
    _bool_check(results, "priorities_and_decisions",
                "priority_scheme_p0_p1_p2_applied", manifest,
                ("priorities", "priority_scheme_p0_p1_p2_applied"),
                "prioritize: the P0 (must ship) / P1 (should) / "
                "P2 (could) scheme is applied in the PRD")
    _bool_check(results, "priorities_and_decisions",
                "priority_tiers_applied_in_shipping_order", manifest,
                ("priorities",
                 "priority_tiers_applied_in_shipping_order"),
                "prioritize: the priority tiers are applied in "
                "shipping order — P0 before P1 before P2")
    _bool_check(results, "priorities_and_decisions",
                "p0_stories_shippable_alone", manifest,
                ("priorities", "p0_items_shippable_alone_declared"),
                "quality gate: P0 items are shippable alone")
    _bool_check(results, "priorities_and_decisions",
                "priority_conflicts_resolved_with_decision_owner",
                manifest,
                ("priorities",
                 "priority_conflicts_resolved_with_decision_owner"),
                "prioritize: priority conflicts are resolved "
                "with the decision owner")
    _bool_check(results, "priorities_and_decisions",
                "prd_decision_owner_named", manifest,
                ("decisions", "decision_owner_named"),
                "prioritize: the PRD's decision owner is named")
    _bool_check(results, "priorities_and_decisions",
                "prd_key_decisions_recorded", manifest,
                ("decisions", "key_decisions_logged_in_prd"),
                "quality gate: key decisions are logged in the "
                "PRD record")

    # ---- Section 5: open_questions_and_approval (skill
    #      Method 7 "Open questions" — tracked explicitly;
    #      block build only on questions that change
    #      architecture; and the artifact rule that nothing
    #      enters build without an approved spec) ----
    _check(results, "open_questions_and_approval",
           "open_questions_declared", questions, questions_is_list,
           questions_is_list,
           "open questions: the declared PRD record names its "
           "open questions — the open_questions list is "
           "present; an empty list declares that the PRD "
           "tracks no open questions")
    block_flag_present = (
        questions_is_list
        and all(isinstance(r, dict) and "architecture_changing" in r
                and "blocks_build" in r for r in question_rows)
    )
    _check(results, "open_questions_and_approval",
           "every_open_question_block_flag_matches_architecture_impact",
           questions, block_flag_present,
           questions_is_list
           and all(isinstance(r, dict)
                   and isinstance(r.get("architecture_changing"), bool)
                   and isinstance(r.get("blocks_build"), bool)
                   and r.get("blocks_build")
                   == r.get("architecture_changing")
                   for r in question_rows),
           "open questions: on every declared question row, "
           "blocking build matches changing architecture — "
           "questions block build only on questions that "
           "change architecture")
    _bool_check(results, "open_questions_and_approval",
                "open_questions_tracked_explicitly", manifest,
                ("open_question_tracking", "tracked_explicitly"),
                "open questions: open questions are tracked "
                "explicitly in the PRD")
    _bool_check(results, "open_questions_and_approval",
                "architecture_changing_open_questions_block_build",
                manifest,
                ("open_question_tracking",
                 "architecture_changing_questions_block_build"),
                "open questions: a question that changes "
                "architecture blocks build")
    _bool_check(results, "open_questions_and_approval",
                "non_architecture_open_questions_do_not_block_build",
                manifest,
                ("open_question_tracking",
                 "non_architecture_questions_do_not_block_build"),
                "open questions: a question that does not change "
                "architecture does not block build")
    _bool_check(results, "open_questions_and_approval",
                "spec_approved_for_build", manifest,
                ("approval", "approved_spec_declared"),
                "approved spec: the PRD is declared approved — "
                "nothing enters build without an approved spec")

    # ---- Section 6: red_lines (skill "Red lines" — no build
    #      before an approved spec, exceptions being timeboxed
    #      spikes labeled as such; never widen scope mid-phase
    #      without updating the PRD and re-approval) ----
    _false_check(results, "red_lines",
                 "no_build_before_approved_spec", manifest,
                 ("red_lines",
                  "build_started_before_approved_spec_present"),
                 "red line: no build started before an approved "
                 "spec is present in the record")
    _false_check(results, "red_lines",
                 "no_unlabeled_spike_as_spec_exception", manifest,
                 ("red_lines",
                  "unlabeled_spike_treated_as_approved_spec_present"),
                 "red line: no unlabeled spike treated as an "
                 "approved spec is present in the record — "
                 "spike exceptions are timeboxed and labeled "
                 "as such")
    _false_check(results, "red_lines",
                 "no_scope_widening_without_prd_update_and_reapproval",
                 manifest,
                 ("red_lines",
                  "scope_widened_mid_phase_without_prd_update_and_reapproval_present"),
                 "red line: no scope widened mid-phase without "
                 "updating the PRD and re-approval is present "
                 "in the record")

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
        verdict = "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY"

    computed_names = (
        "problem_statement_within_five_sentences",
        "prd_stories_declared",
        "every_prd_story_states_role_capability_and_benefit",
        "every_prd_story_id_unique_and_nonempty",
        "every_prd_story_priority_is_p0_p1_or_p2",
        "acceptance_criteria_declared",
        "every_story_has_acceptance_criteria",
        "every_acceptance_criterion_traces_to_declared_story",
        "every_acceptance_criterion_id_unique_and_nonempty",
        "every_acceptance_criterion_declared_testable",
        "every_acceptance_criterion_declared_binary",
        "out_of_scope_items_declared",
        "no_misc_bucket_in_out_of_scope_items",
        "open_questions_declared",
        "every_open_question_block_flag_matches_architecture_impact",
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
        "service": "prd-with-testable-acceptance-criteria",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "problem_statement_sentence_count": (
            sentence_count if has_sentence_count else None),
        "stories_count": stories_count,
        "acceptance_criteria_count": criteria_count,
        "p0_story_count": p0_story_count,
        "stories_without_criteria": stories_without_criteria,
        "criteria_without_declared_story": (
            criteria_without_declared_story),
        "duplicate_story_ids": duplicate_story_ids,
        "duplicate_criterion_ids": duplicate_criterion_ids,
        "story_criteria_coverage": _fmt6(story_criteria_coverage),
        "testable_criteria_coverage": _fmt6(testable_criteria_coverage),
        "binary_criteria_coverage": _fmt6(binary_criteria_coverage),
        "out_of_scope_items_count": out_count,
        "misc_bucket_items": misc_bucket_items,
        "open_questions_count": questions_count,
        "architecture_changing_open_questions_count": (
            architecture_changing_count),
        "blocking_open_questions_count": blocking_question_count,
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
        "PRD WITH TESTABLE ACCEPTANCE CRITERIA",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: prd_with_testable_acceptance_criteria.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if (verdict["verdict"]
                 == "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
