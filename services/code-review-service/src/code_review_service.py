#!/usr/bin/env python3
"""Code review service — deterministic core.

Built from the bound skill `code-review-practice` (v1): "Review
changes properly — small PRs, a real checklist, blocking vs
non-blocking feedback, green gates before approval."

This atom does NOT read or review actual code and exercises no
review judgment. The caller submits a code-review manifest: one
DECLARED code-review record — its PR size and description, its
review checklist coverage, its declared comment counts and
labels, its response / resolution record, its approval-gate
record, and its red-line / merge record. The atom validates that
artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- PR size (method step 1: "keep PRs small (aim <= ~400 changed
  lines)"): the declared changed-line count passes only when it
  is at or under the 400 lines the skill itself names;
- checklist coverage (method step 3): the declared covered
  items must cover the five categories the skill names —
  correctness, security, tests, readability, docs;
- feedback labels (method step 4: label comments must:/nit:/q:):
  the declared labeled-comment count must equal the declared
  total comment count;
- responses (method step 5: "authors answer every comment"):
  the declared answered-comment count must equal the declared
  total comment count in the resolution record;
- reviewers (quality gate: "at least one reviewer for
  non-trivial changes"): a declared non-trivial change passes
  only with at least one declared reviewer; a declared trivial
  change is not held to that gate by the skill, so it passes
  this check regardless of reviewer count;
- unresolved comments (method step 6: approval gates are "green
  CI + resolved comments + reviewer sign-off"): the declared
  unresolved-comment count at approval must be zero;
- docs for behavior changes (quality gate: "behavior-changing
  PRs update docs + changelog"): a declared behavior-changing
  change passes only when docs + changelog are declared
  updated; a declared non-behavior-changing change passes this
  check regardless;
- hotfix post-review (when-to-use: "emergency hotfixes get
  post-review"): a declared emergency hotfix passes only when
  its post-review is declared completed; a declared
  non-hotfix passes this check regardless.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The checklist categories the
skill names but the artifact does not declare covered are
reported as `checklist_items_not_covered` (null when no list is
declared). The computed outcome over the eight computed checks
is reported as `computed_status`.

Verdict:
- any fail             -> CODE_REVIEW_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CODE_REVIEW_READY

This is a completeness and consistency audit over declared
evidence, not a code review: an artifact that declares every
step passes even if the underlying code is poor, and nothing
here verifies that a declared value is true, reads a diff, or
judges correctness, security, or readability itself.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "pr_size_and_description",
    "review_checklist",
    "feedback_etiquette",
    "response_and_resolution",
    "approval_gates",
    "red_lines_and_merge_discipline",
)

STATED_CHECKLIST_ITEMS = [
    "correctness",
    "security",
    "tests",
    "readability",
    "docs",
]

STATED_CHANGED_LINES_AIM = 400

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the checklist-item list entries) are
# validated as strings only, never enum-checked: coverage is a
# verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "pr": {
        "changed_lines": "number",
        "description_what_present": "boolean",
        "description_why_present": "boolean",
        "description_how_to_test_present": "boolean",
        "spec_or_issue_linked": "boolean",
        "screenshots_included_for_ui_changes": "boolean",
    },
    "checklist": {
        "covered_items": ["string"],
        "correctness_edge_cases_checked": "boolean",
        "security_inputs_secrets_dependencies_checked": "boolean",
        "tests_coverage_and_determinism_checked": "boolean",
        "readability_names_and_structure_checked": "boolean",
    },
    "feedback": {
        "total_comments": "number",
        "labeled_comments": "number",
        "labels_use_must_nit_q_scheme": "boolean",
        "why_explained": "boolean",
        "proposes_not_dictates": "boolean",
    },
    "resolution": {
        "total_comments": "number",
        "answered_comments": "number",
        "resolved_only_when_addressed": "boolean",
        "resolved_nits_not_relitigated": "boolean",
    },
    "gates": {
        "ci_green_before_approval": "boolean",
        "change_nontrivial": "boolean",
        "reviewer_count": "number",
        "reviewer_sign_off_recorded": "boolean",
        "unresolved_comments": "number",
        "behavior_changing": "boolean",
        "docs_and_changelog_updated": "boolean",
        "approver_would_ship": "boolean",
    },
    "red_lines": {
        "force_push_over_review_without_telling": "boolean",
        "rubber_stamped": "boolean",
        "unexplained_blocking": "boolean",
    },
    "merge": {
        "self_merged_unreviewed": "boolean",
        "emergency_hotfix": "boolean",
        "hotfix_post_review_completed": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def evaluate(manifest):
    """Return the verdict dict for a code-review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: pr_size_and_description (skill method step
    #      1: "Size: keep PRs small (aim <= ~400 changed lines);
    #      split large changes logically so they can be
    #      reviewed"; method step 2: "PR description: what / why
    #      / how-to-test; link the spec or issue; screenshots for
    #      UI changes") ----
    changed, has_changed = _get(manifest, "pr", "changed_lines")
    changed_is_number = has_changed and _is_number(changed)
    changed_lines_difference = (
        changed - STATED_CHANGED_LINES_AIM if changed_is_number else None
    )
    _check(results, "pr_size_and_description",
           "pr_size_within_stated_aim",
           changed, changed_is_number,
           changed_is_number and changed <= STATED_CHANGED_LINES_AIM,
           "method step 1: the declared changed-line count is at "
           "or under the aim the skill names — keep PRs small "
           "(aim <= ~400 changed lines)")
    _bool_check(results, "pr_size_and_description",
                "pr_description_what_present",
                manifest, ("pr", "description_what_present"),
                "method step 2: the PR description states what "
                "changed")
    _bool_check(results, "pr_size_and_description",
                "pr_description_why_present",
                manifest, ("pr", "description_why_present"),
                "method step 2: the PR description states why the "
                "change was made")
    _bool_check(results, "pr_size_and_description",
                "pr_description_how_to_test_present",
                manifest, ("pr", "description_how_to_test_present"),
                "method step 2: the PR description states "
                "how-to-test")
    _bool_check(results, "pr_size_and_description",
                "spec_or_issue_linked",
                manifest, ("pr", "spec_or_issue_linked"),
                "method step 2: the PR description links the spec "
                "or issue")
    _bool_check(results, "pr_size_and_description",
                "screenshots_included_for_ui_changes",
                manifest,
                ("pr", "screenshots_included_for_ui_changes"),
                "method step 2: screenshots are included for UI "
                "changes")

    # ---- Section 2: review_checklist (skill method step 3:
    #      "Checklist: correctness (logic, edge cases) · security
    #      (inputs, secrets, dependencies) · tests (coverage,
    #      determinism) · readability (names, structure) · docs
    #      (README/changelog when behavior changed)") ----
    covered, has_covered = _get(manifest, "checklist", "covered_items")
    covered_is_list = has_covered and isinstance(covered, list)
    not_covered = (
        [c for c in STATED_CHECKLIST_ITEMS if c not in covered]
        if covered_is_list else None
    )
    _check(results, "review_checklist",
           "checklist_items_cover_stated_checklist",
           covered, covered_is_list,
           covered_is_list and len(not_covered) == 0,
           "method step 3: the declared covered checklist items "
           "cover every category the skill names — correctness, "
           "security, tests, readability, docs")
    _bool_check(results, "review_checklist",
                "correctness_edge_cases_checked",
                manifest,
                ("checklist", "correctness_edge_cases_checked"),
                "method step 3: correctness is checked — logic, "
                "edge cases")
    _bool_check(results, "review_checklist",
                "security_inputs_secrets_dependencies_checked",
                manifest,
                ("checklist",
                 "security_inputs_secrets_dependencies_checked"),
                "method step 3: security is checked — inputs, "
                "secrets, dependencies")
    _bool_check(results, "review_checklist",
                "tests_coverage_and_determinism_checked",
                manifest,
                ("checklist", "tests_coverage_and_determinism_checked"),
                "method step 3: tests are checked — coverage, "
                "determinism")
    _bool_check(results, "review_checklist",
                "readability_names_and_structure_checked",
                manifest,
                ("checklist",
                 "readability_names_and_structure_checked"),
                "method step 3: readability is checked — names, "
                "structure")

    # ---- Section 3: feedback_etiquette (skill method step 4:
    #      "Feedback etiquette: label comments — must:
    #      (blocking), nit: (non-blocking), q: (question); explain
    #      the why; propose, don't dictate") ----
    fb_total, has_fb_total = _get(manifest, "feedback", "total_comments")
    fb_labeled, has_fb_labeled = _get(
        manifest, "feedback", "labeled_comments")
    feedback_all_numbers = (
        has_fb_total and has_fb_labeled
        and _is_number(fb_total) and _is_number(fb_labeled)
    )
    labeled_difference = (
        fb_labeled - fb_total if feedback_all_numbers else None
    )
    _check(results, "feedback_etiquette",
           "feedback_comments_all_labeled",
           fb_labeled, feedback_all_numbers,
           feedback_all_numbers
           and _fmt6(fb_labeled - fb_total) == "0.000000",
           "method step 4: the declared labeled-comment count "
           "equals the declared total comment count — every "
           "comment carries a must:/nit:/q: label")
    _bool_check(results, "feedback_etiquette",
                "labels_use_must_nit_q_scheme",
                manifest, ("feedback", "labels_use_must_nit_q_scheme"),
                "method step 4: comments are labeled must: "
                "(blocking), nit: (non-blocking), q: (question)")
    _bool_check(results, "feedback_etiquette", "feedback_why_explained",
                manifest, ("feedback", "why_explained"),
                "method step 4: feedback explains the why")
    _bool_check(results, "feedback_etiquette",
                "feedback_proposes_not_dictates",
                manifest, ("feedback", "proposes_not_dictates"),
                "method step 4: feedback proposes, it does not "
                "dictate")

    # ---- Section 4: response_and_resolution (skill method step
    #      5: "Respond / resolve: authors answer every comment;
    #      resolve only when addressed; never re-litigate
    #      resolved nits") ----
    res_total, has_res_total = _get(
        manifest, "resolution", "total_comments")
    res_answered, has_res_answered = _get(
        manifest, "resolution", "answered_comments")
    resolution_all_numbers = (
        has_res_total and has_res_answered
        and _is_number(res_total) and _is_number(res_answered)
    )
    answered_difference = (
        res_answered - res_total if resolution_all_numbers else None
    )
    _check(results, "response_and_resolution",
           "authors_answer_every_comment",
           res_answered, resolution_all_numbers,
           resolution_all_numbers
           and _fmt6(res_answered - res_total) == "0.000000",
           "method step 5: the declared answered-comment count "
           "equals the declared total comment count — authors "
           "answer every comment")
    _bool_check(results, "response_and_resolution",
                "comments_resolved_only_when_addressed",
                manifest,
                ("resolution", "resolved_only_when_addressed"),
                "method step 5: comments are resolved only when "
                "addressed")
    _bool_check(results, "response_and_resolution",
                "resolved_nits_not_relitigated",
                manifest,
                ("resolution", "resolved_nits_not_relitigated"),
                "method step 5: resolved nits are never "
                "re-litigated")

    # ---- Section 5: approval_gates (skill method step 6:
    #      "Approval gates: green CI + resolved comments +
    #      reviewer sign-off. Approve only what you'd ship";
    #      quality gates: "CI green before approval — red means
    #      no merge"; "At least one reviewer for non-trivial
    #      changes"; "Behavior-changing PRs update docs +
    #      changelog") ----
    _bool_check(results, "approval_gates", "ci_green_before_approval",
                manifest, ("gates", "ci_green_before_approval"),
                "quality gate: CI is green before approval — red "
                "means no merge")
    nontrivial, has_nontrivial = _get(
        manifest, "gates", "change_nontrivial")
    reviewers, has_reviewers = _get(manifest, "gates", "reviewer_count")
    reviewer_gate_present = (
        has_nontrivial and has_reviewers
        and isinstance(nontrivial, bool) and _is_number(reviewers)
    )
    _check(results, "approval_gates",
           "at_least_one_reviewer_for_nontrivial_change",
           reviewers, reviewer_gate_present,
           reviewer_gate_present
           and (nontrivial is False or reviewers >= 1),
           "quality gate: a non-trivial change has at least one "
           "reviewer (a declared trivial change is not held to "
           "this gate by the skill)")
    _bool_check(results, "approval_gates",
                "reviewer_sign_off_recorded",
                manifest, ("gates", "reviewer_sign_off_recorded"),
                "method step 6: reviewer sign-off is recorded "
                "before approval")
    unresolved, has_unresolved = _get(
        manifest, "gates", "unresolved_comments")
    unresolved_is_number = has_unresolved and _is_number(unresolved)
    _check(results, "approval_gates",
           "no_unresolved_comments_before_approval",
           unresolved, unresolved_is_number,
           unresolved_is_number
           and _fmt6(unresolved) == "0.000000",
           "method step 6: the declared unresolved-comment count "
           "at approval is zero — approval gates require "
           "resolved comments")
    behavior, has_behavior = _get(manifest, "gates", "behavior_changing")
    docs_updated, has_docs = _get(
        manifest, "gates", "docs_and_changelog_updated")
    docs_gate_present = (
        has_behavior and has_docs
        and isinstance(behavior, bool) and isinstance(docs_updated, bool)
    )
    _check(results, "approval_gates",
           "docs_and_changelog_updated_for_behavior_changing_change",
           docs_updated, docs_gate_present,
           docs_gate_present
           and (behavior is False or docs_updated is True),
           "quality gate: a behavior-changing PR updates docs + "
           "changelog (a declared non-behavior-changing change "
           "is not held to this gate by the skill)")
    _bool_check(results, "approval_gates", "approver_would_ship",
                manifest, ("gates", "approver_would_ship"),
                "method step 6: the approver approves only what "
                "they would ship")

    # ---- Section 6: red_lines_and_merge_discipline (skill red
    #      lines: "No force-push over someone else's review
    #      without telling them"; "No rubber-stamping; no
    #      unexplained blocking"; when to use: "Every change
    #      before merge. No self-merged unreviewed work
    #      (emergency hotfixes get post-review)") ----
    _false_check(results, "red_lines_and_merge_discipline",
                 "no_force_push_over_review_without_telling",
                 manifest,
                 ("red_lines",
                  "force_push_over_review_without_telling"),
                 "red line: no force-push over someone else's "
                 "review without telling them")
    _false_check(results, "red_lines_and_merge_discipline",
                 "no_rubber_stamping",
                 manifest, ("red_lines", "rubber_stamped"),
                 "red line: no rubber-stamping")
    _false_check(results, "red_lines_and_merge_discipline",
                 "no_unexplained_blocking",
                 manifest, ("red_lines", "unexplained_blocking"),
                 "red line: no unexplained blocking")
    _false_check(results, "red_lines_and_merge_discipline",
                 "no_self_merged_unreviewed_work",
                 manifest, ("merge", "self_merged_unreviewed"),
                 "when to use: no self-merged unreviewed work — "
                 "every change is reviewed before merge")
    hotfix, has_hotfix = _get(manifest, "merge", "emergency_hotfix")
    post_review, has_post = _get(
        manifest, "merge", "hotfix_post_review_completed")
    hotfix_gate_present = (
        has_hotfix and has_post
        and isinstance(hotfix, bool) and isinstance(post_review, bool)
    )
    _check(results, "red_lines_and_merge_discipline",
           "emergency_hotfix_post_reviewed_if_applicable",
           post_review, hotfix_gate_present,
           hotfix_gate_present
           and (hotfix is False or post_review is True),
           "when to use: an emergency hotfix gets post-review "
           "(a declared non-hotfix is not held to this gate by "
           "the skill)")

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
        verdict = "CODE_REVIEW_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CODE_REVIEW_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "pr_size_within_stated_aim",
            "checklist_items_cover_stated_checklist",
            "feedback_comments_all_labeled",
            "authors_answer_every_comment",
            "at_least_one_reviewer_for_nontrivial_change",
            "no_unresolved_comments_before_approval",
            "docs_and_changelog_updated_for_behavior_changing_change",
            "emergency_hotfix_post_reviewed_if_applicable")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "code-review-service",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "computed_changed_lines": _fmt6(
            changed if changed_is_number else None),
        "changed_lines_over_stated_aim": _fmt6(changed_lines_difference),
        "checklist_items_not_covered": not_covered,
        "labeled_comment_difference": _fmt6(labeled_difference),
        "answered_comment_difference": _fmt6(answered_difference),
        "computed_reviewer_count": _fmt6(
            reviewers if has_reviewers and _is_number(reviewers)
            else None),
        "computed_unresolved_comments": _fmt6(
            unresolved if unresolved_is_number else None),
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
        "CODE REVIEW",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: code_review_service.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CODE_REVIEW_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
