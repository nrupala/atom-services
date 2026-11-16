#!/usr/bin/env python3
"""Community support operations — deterministic core.

Built from the bound skill `community-support` (v1): "Run support
and community well — intake/SLAs, help docs, triage loops,
release comms, moderation."

This atom does NOT run a support desk or a community and
exercises no judgment of its own. The caller submits a
community-support manifest: one DECLARED support/community
operations artifact — its intake channels and SLA targets, its
declared intake and triage counts, its help-doc and top-theme
record, its triage categories, its response-craft and red-line
record, its release and incident comms record, its community
norms, and its measurement record. The atom validates that
artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- SLA severity order (method step 1: "response-time targets by
  severity (outage > broken > question)"): the declared outage
  target must be shorter than the declared broken target, which
  must be shorter than the declared question target — the
  severity order the skill names, read as response-time order.
  The skill states no hour values, so no target value is judged;
- intake tracking (method step 1: "every message lands somewhere
  tracked"): the declared tracked-message count must equal the
  declared received-message count;
- top themes (quality gate: "Top-10 themes have help docs or
  backlog entries"): the declared top-theme count must be the
  10 the skill names, and the declared count of themes with a
  help doc or a backlog entry must equal it;
- triage categories (method step 3: "classify (bug / feature /
  usage / noise)"): the declared categories used must cover the
  four categories the skill names;
- thread closure (method step 3: "every thread ends with a
  resolution or a tracked item"): the declared count of threads
  closed with a resolution or a tracked item must equal the
  declared thread total.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The triage categories the
skill names but the artifact does not declare used are reported
as `triage_categories_not_covered` (null when no list is
declared). The computed outcome over the six computed checks is
reported as `computed_status`.

Verdict:
- any fail             -> COMMUNITY_SUPPORT_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> COMMUNITY_SUPPORT_READY

This is a completeness and consistency audit over declared
evidence, not a support-quality review: an artifact that
declares every step passes even if its actual support is poor,
and nothing here verifies that a declared value is true, that
an SLA target is adequate, or that users are satisfied.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "intake_and_slas",
    "help_docs_and_deflection",
    "triage_loop",
    "response_craft_and_red_lines",
    "release_and_incident_comms",
    "community_norms",
    "measurement",
)

STATED_TRIAGE_CATEGORIES = [
    "bug",
    "feature",
    "usage",
    "noise",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the triage-category list entries) are
# validated as strings only, never enum-checked: coverage is a
# verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "intake": {
        "channels_defined": "boolean",
        "sla_targets_documented": "boolean",
        "outage_target_hours": "number",
        "broken_target_hours": "number",
        "question_target_hours": "number",
        "messages_received": "number",
        "messages_tracked": "number",
        "support_messages_left_untracked_in_dms": "boolean",
    },
    "help_docs": {
        "faq_covers_top_recurring_questions": "boolean",
        "docs_updated_from_actual_tickets": "boolean",
        "fixes_link_doc_where_possible": "boolean",
        "top_theme_count": "number",
        "themes_with_doc_or_backlog_count": "number",
    },
    "triage": {
        "categories_used": ["string"],
        "bugs_require_reproduction": "boolean",
        "bugs_filed_in_tracker_with_evidence": "boolean",
        "features_routed_to_backlog": "boolean",
        "threads_total": "number",
        "threads_closed_with_resolution_or_tracked_item": "number",
        "obvious_issues_left_unanswered": "boolean",
        "triage_then_prioritize_deliberately": "boolean",
    },
    "response": {
        "acknowledge_expectation_deliver_confirm_followed": "boolean",
        "mistakes_owned_plainly": "boolean",
        "argues_publicly_with_users": "boolean",
        "unshipped_dates_or_features_promised": "boolean",
        "reporter_privacy_leaked_in_public_threads": "boolean",
    },
    "comms": {
        "changelog_highlights_for_users_published": "boolean",
        "incident_templates_ready": "boolean",
        "incident_templates_include_honesty_rules": "boolean",
        "incident_status_honest_no_fake_precision": "boolean",
        "follow_up_after_resolution_sent": "boolean",
    },
    "community": {
        "code_of_conduct_exists": "boolean",
        "moderation_process_documented": "boolean",
        "moderation_applied_consistently": "boolean",
        "contributors_celebrated": "boolean",
        "spaces_spam_free_without_hostility": "boolean",
    },
    "measurement": {
        "first_response_time_measured": "boolean",
        "resolution_time_measured": "boolean",
        "recurring_themes_tracked": "boolean",
        "satisfaction_signals_observed": "boolean",
        "monthly_review_held": "boolean",
        "themes_feed_product": "boolean",
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
    """Return the verdict dict for a community-support manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: intake_and_slas (skill method step 1:
    #      "Intake & SLAs: defined channels + response-time
    #      targets by severity (outage > broken > question);
    #      every message lands somewhere tracked — no support
    #      DMs vanishing into history"; quality gate: "Channels
    #      + SLAs documented; intake is tracked") ----
    _bool_check(results, "intake_and_slas", "channels_defined",
                manifest, ("intake", "channels_defined"),
                "method step 1: support channels are defined")
    _bool_check(results, "intake_and_slas", "sla_targets_documented",
                manifest, ("intake", "sla_targets_documented"),
                "quality gate: channels and SLA response-time "
                "targets are documented")
    outage, has_outage = _get(manifest, "intake", "outage_target_hours")
    broken, has_broken = _get(manifest, "intake", "broken_target_hours")
    question, has_question = _get(manifest, "intake",
                                  "question_target_hours")
    sla_all_numbers = (
        has_outage and has_broken and has_question
        and _is_number(outage) and _is_number(broken)
        and _is_number(question)
    )
    sla_order_ok = (
        sla_all_numbers and outage < broken and broken < question
    )
    _check(results, "intake_and_slas",
           "sla_targets_respect_severity_order",
           outage, sla_all_numbers, sla_order_ok,
           "method step 1: the declared response-time targets "
           "respect the severity order the skill names — outage "
           "shorter than broken, broken shorter than question "
           "(outage > broken > question); no target value itself "
           "is judged, the skill states none")
    received, has_received = _get(manifest, "intake", "messages_received")
    tracked, has_tracked = _get(manifest, "intake", "messages_tracked")
    intake_all_numbers = (
        has_received and has_tracked
        and _is_number(received) and _is_number(tracked)
    )
    tracked_share = (
        tracked / received
        if intake_all_numbers and received > 0
        else None
    )
    tracked_difference = (
        tracked - received
        if intake_all_numbers
        else None
    )
    intake_tracked_ok = (
        intake_all_numbers and received > 0
        and _fmt6(tracked - received) == "0.000000"
    )
    _check(results, "intake_and_slas", "every_message_tracked",
           tracked, intake_all_numbers, intake_tracked_ok,
           "method step 1: every message lands somewhere tracked "
           "— the declared tracked count equals the declared "
           "received count")
    _false_check(results, "intake_and_slas",
                 "no_support_messages_left_untracked_in_dms",
                 manifest,
                 ("intake", "support_messages_left_untracked_in_dms"),
                 "method step 1: no support DMs vanish into "
                 "history untracked")

    # ---- Section 2: help_docs_and_deflection (skill method
    #      step 2: "Help that deflects: FAQ/help docs for the top
    #      recurring questions, updated from actual tickets;
    #      fixes link a doc where possible"; quality gate:
    #      "Top-10 themes have help docs or backlog entries") ----
    _bool_check(results, "help_docs_and_deflection",
                "faq_covers_top_recurring_questions",
                manifest,
                ("help_docs", "faq_covers_top_recurring_questions"),
                "method step 2: FAQ/help docs cover the top "
                "recurring questions")
    _bool_check(results, "help_docs_and_deflection",
                "docs_updated_from_actual_tickets",
                manifest,
                ("help_docs", "docs_updated_from_actual_tickets"),
                "method step 2: help docs are updated from actual "
                "tickets")
    _bool_check(results, "help_docs_and_deflection",
                "fixes_link_doc_where_possible",
                manifest,
                ("help_docs", "fixes_link_doc_where_possible"),
                "method step 2: fixes link a help doc where "
                "possible")
    top_count, has_top = _get(manifest, "help_docs", "top_theme_count")
    covered, has_covered = _get(
        manifest, "help_docs", "themes_with_doc_or_backlog_count")
    top_present = has_top and _is_number(top_count)
    top_ten_ok = (
        top_present and _fmt6(top_count - 10) == "0.000000"
    )
    _check(results, "help_docs_and_deflection",
           "top_ten_themes_identified",
           top_count, top_present, top_ten_ok,
           "quality gate: the top themes are the top 10 the "
           "skill names — the declared top-theme count is 10")
    themes_all_numbers = (
        has_top and has_covered
        and _is_number(top_count) and _is_number(covered)
    )
    theme_coverage_ratio = (
        covered / top_count
        if themes_all_numbers and top_count > 0
        else None
    )
    theme_coverage_difference = (
        covered - top_count
        if themes_all_numbers
        else None
    )
    themes_covered_ok = (
        themes_all_numbers
        and _fmt6(covered - top_count) == "0.000000"
    )
    _check(results, "help_docs_and_deflection",
           "all_top_themes_have_doc_or_backlog",
           covered, themes_all_numbers, themes_covered_ok,
           "quality gate: every top theme has a help doc or a "
           "backlog entry — the declared covered count equals "
           "the declared top-theme count")

    # ---- Section 3: triage_loop (skill method step 3: "Triage
    #      loop: classify (bug / feature / usage / noise); bugs
    #      need reproductions -> issue tracker with evidence;
    #      features -> backlog; every thread ends with a
    #      resolution or a tracked item"; red line: "no
    #      unanswered 'obvious' issues — triage, then prioritize
    #      deliberately") ----
    categories, has_categories = _get(manifest, "triage",
                                      "categories_used")
    categories_is_list = has_categories and isinstance(categories, list)
    not_covered = (
        [c for c in STATED_TRIAGE_CATEGORIES if c not in categories]
        if categories_is_list else None
    )
    _check(results, "triage_loop",
           "triage_categories_cover_stated_categories",
           categories, categories_is_list,
           categories_is_list and len(not_covered) == 0,
           "method step 3: the categories used cover every "
           "category the skill names — bug, feature, usage, noise")
    _bool_check(results, "triage_loop", "bugs_require_reproduction",
                manifest, ("triage", "bugs_require_reproduction"),
                "method step 3: bugs need reproductions")
    _bool_check(results, "triage_loop",
                "bugs_filed_in_tracker_with_evidence",
                manifest,
                ("triage", "bugs_filed_in_tracker_with_evidence"),
                "method step 3: bugs go to the issue tracker with "
                "evidence")
    _bool_check(results, "triage_loop", "features_routed_to_backlog",
                manifest, ("triage", "features_routed_to_backlog"),
                "method step 3: features are routed to the backlog")
    total, has_total = _get(manifest, "triage", "threads_total")
    closed, has_closed = _get(
        manifest, "triage",
        "threads_closed_with_resolution_or_tracked_item")
    threads_all_numbers = (
        has_total and has_closed
        and _is_number(total) and _is_number(closed)
    )
    thread_closure_share = (
        closed / total
        if threads_all_numbers and total > 0
        else None
    )
    thread_closure_difference = (
        closed - total
        if threads_all_numbers
        else None
    )
    threads_closed_ok = (
        threads_all_numbers and total > 0
        and _fmt6(closed - total) == "0.000000"
    )
    _check(results, "triage_loop",
           "every_thread_ends_with_resolution_or_tracked_item",
           closed, threads_all_numbers, threads_closed_ok,
           "method step 3: every thread ends with a resolution "
           "or a tracked item — the declared closed count equals "
           "the declared thread total")
    _false_check(results, "triage_loop",
                 "no_unanswered_obvious_issues",
                 manifest, ("triage", "obvious_issues_left_unanswered"),
                 "red line: no unanswered 'obvious' issues")
    _bool_check(results, "triage_loop",
                "triage_then_prioritize_deliberately",
                manifest,
                ("triage", "triage_then_prioritize_deliberately"),
                "red line: issues are triaged, then prioritized "
                "deliberately")

    # ---- Section 4: response_craft_and_red_lines (skill method
    #      step 4: "Response craft: acknowledge -> set expectation
    #      -> deliver -> confirm; own mistakes plainly; never
    #      argue publicly; never promise unshipped dates or
    #      features"; red lines: "Never promise what isn't
    #      shipped; never leak reporter privacy in public
    #      threads") ----
    _bool_check(results, "response_craft_and_red_lines",
                "acknowledge_expectation_deliver_confirm_followed",
                manifest,
                ("response",
                 "acknowledge_expectation_deliver_confirm_followed"),
                "method step 4: responses follow acknowledge, set "
                "expectation, deliver, confirm")
    _bool_check(results, "response_craft_and_red_lines",
                "mistakes_owned_plainly",
                manifest, ("response", "mistakes_owned_plainly"),
                "method step 4: mistakes are owned plainly")
    _false_check(results, "response_craft_and_red_lines",
                 "never_argues_publicly",
                 manifest, ("response", "argues_publicly_with_users"),
                 "method step 4: never argue publicly")
    _false_check(results, "response_craft_and_red_lines",
                 "never_promises_unshipped_dates_or_features",
                 manifest,
                 ("response", "unshipped_dates_or_features_promised"),
                 "red line: never promise what isn't shipped — no "
                 "unshipped dates or features are promised")
    _false_check(results, "response_craft_and_red_lines",
                 "reporter_privacy_never_leaked_in_public_threads",
                 manifest,
                 ("response",
                  "reporter_privacy_leaked_in_public_threads"),
                 "red line: reporter privacy is never leaked in "
                 "public threads")

    # ---- Section 5: release_and_incident_comms (skill method
    #      step 5: "Release & incident comms: changelog highlights
    #      for users; incident updates with honest status
    #      ('investigating' != fake precision); follow-up after
    #      resolution"; quality gate: "Incident comms templates
    #      ready (with honesty rules)") ----
    _bool_check(results, "release_and_incident_comms",
                "changelog_highlights_for_users_published",
                manifest,
                ("comms", "changelog_highlights_for_users_published"),
                "method step 5: changelog highlights for users "
                "are published")
    _bool_check(results, "release_and_incident_comms",
                "incident_templates_ready",
                manifest, ("comms", "incident_templates_ready"),
                "quality gate: incident comms templates are ready")
    _bool_check(results, "release_and_incident_comms",
                "incident_templates_include_honesty_rules",
                manifest,
                ("comms", "incident_templates_include_honesty_rules"),
                "quality gate: incident comms templates carry the "
                "honesty rules")
    _bool_check(results, "release_and_incident_comms",
                "incident_status_honest_no_fake_precision",
                manifest,
                ("comms", "incident_status_honest_no_fake_precision"),
                "method step 5: incident updates give honest "
                "status — 'investigating' is not fake precision")
    _bool_check(results, "release_and_incident_comms",
                "follow_up_after_resolution_sent",
                manifest, ("comms", "follow_up_after_resolution_sent"),
                "method step 5: a follow-up is sent after "
                "resolution")

    # ---- Section 6: community_norms (skill method step 6:
    #      "Community norms: code of conduct; consistent,
    #      documented moderation; celebrate contributors; keep
    #      spaces spam-free without turning hostile"; quality
    #      gate: "Community guidelines + moderation process exist
    #      where a community runs") ----
    _bool_check(results, "community_norms", "code_of_conduct_exists",
                manifest, ("community", "code_of_conduct_exists"),
                "method step 6: a code of conduct exists")
    _bool_check(results, "community_norms",
                "moderation_process_documented",
                manifest, ("community", "moderation_process_documented"),
                "quality gate: community guidelines and a "
                "documented moderation process exist where a "
                "community runs")
    _bool_check(results, "community_norms",
                "moderation_applied_consistently",
                manifest,
                ("community", "moderation_applied_consistently"),
                "method step 6: moderation is consistent")
    _bool_check(results, "community_norms", "contributors_celebrated",
                manifest, ("community", "contributors_celebrated"),
                "method step 6: contributors are celebrated")
    _bool_check(results, "community_norms",
                "spaces_spam_free_without_hostility",
                manifest,
                ("community", "spaces_spam_free_without_hostility"),
                "method step 6: spaces are kept spam-free without "
                "turning hostile")

    # ---- Section 7: measurement (skill method step 7: "Measure
    #      lightly: first response time, resolution time,
    #      recurring themes, quiet satisfaction signals; monthly
    #      review; themes feed product") ----
    _bool_check(results, "measurement", "first_response_time_measured",
                manifest, ("measurement", "first_response_time_measured"),
                "method step 7: first response time is measured")
    _bool_check(results, "measurement", "resolution_time_measured",
                manifest, ("measurement", "resolution_time_measured"),
                "method step 7: resolution time is measured")
    _bool_check(results, "measurement", "recurring_themes_tracked",
                manifest, ("measurement", "recurring_themes_tracked"),
                "method step 7: recurring themes are tracked")
    _bool_check(results, "measurement", "satisfaction_signals_observed",
                manifest, ("measurement", "satisfaction_signals_observed"),
                "method step 7: quiet satisfaction signals are "
                "observed")
    _bool_check(results, "measurement", "monthly_review_held",
                manifest, ("measurement", "monthly_review_held"),
                "method step 7: a monthly review is held")
    _bool_check(results, "measurement", "themes_feed_product",
                manifest, ("measurement", "themes_feed_product"),
                "method step 7: themes feed the product")

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
        verdict = "COMMUNITY_SUPPORT_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "COMMUNITY_SUPPORT_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "sla_targets_respect_severity_order",
            "every_message_tracked",
            "top_ten_themes_identified",
            "all_top_themes_have_doc_or_backlog",
            "triage_categories_cover_stated_categories",
            "every_thread_ends_with_resolution_or_tracked_item")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "community-support-operations",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "computed_tracked_share": _fmt6(tracked_share),
        "tracked_difference": _fmt6(tracked_difference),
        "computed_theme_coverage_ratio": _fmt6(theme_coverage_ratio),
        "theme_coverage_difference": _fmt6(theme_coverage_difference),
        "triage_categories_not_covered": not_covered,
        "computed_thread_closure_share": _fmt6(thread_closure_share),
        "thread_closure_difference": _fmt6(thread_closure_difference),
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
        "COMMUNITY SUPPORT OPERATIONS",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: community_support_operations.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "COMMUNITY_SUPPORT_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
