#!/usr/bin/env python3
"""Brand mention monitoring triage digest — deterministic core.

Built from the bound skill `social-listening` (v1): "Track
mentions and reputation across the web - monitoring coverage,
alert triage, response policy, reporting." This atom audits one
declared monitoring / triage / digest setup — the watch a caller
declares they run for a brand — against the skill's seven method
steps, its four quality gates, and its three red lines. It does
not listen to live social feeds, fetch mentions, judge the
sentiment of any real post, or verify that a declared value is
true — it checks that the declared setup contains what the
skill's method requires, on the caller's declared evidence.

The caller submits a brand-mention manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
set logic and arithmetic of the declared values — no outside
threshold is imported:

- triage-dimension coverage (method step 3: "severity x reach x
  authenticity"): the declared dimension list must cover all
  three dimensions the skill names;
- triage-route coverage (method step 3: "Route: ignore / monitor
  / reply / escalate / legal"): the declared route list must
  cover all five routes the skill names;
- evidence for every action (quality gate: "Evidence archived
  for every action taken"; method step 6: "archive every
  actionable mention (screenshot + link) before responding"):
  the declared count of actions with evidence archived must
  equal the declared count of actions taken, with coherent
  counts (none negative, actions taken no more than total
  mentions).

Vocabulary entries (dimension / route list entries) are reported
back as the skill-named entries the declaration omits
(`triage_dimensions_missing`, `triage_routes_missing`, null when
no list is declared), and the actions taken without archived
evidence as `actions_without_archived_evidence` (null when the
counts needed cannot be read). The computed outcome over the
three computed checks is reported as `computed_status`.

Verdict:
- any fail             -> TRIAGE_DIGEST_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TRIAGE_DIGEST_READY

This is a completeness and consistency audit over declared
evidence, not a reputation review: a setup that declares every
step passes even if the brand's actual reputation is poor, and
nothing here verifies that monitoring really happens.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "inventory_and_coverage",
    "triage_rubric",
    "response_policy",
    "alert_hygiene_and_evidence",
    "digest_reporting",
    "red_lines",
)

STATED_DIMENSIONS = [
    "severity",
    "reach",
    "authenticity",
]

STATED_ROUTES = [
    "ignore",
    "monitor",
    "reply",
    "escalate",
    "legal",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the dimension / route list entries) are
# validated as strings only, never enum-checked: coverage is a
# verdict check, not a type error.
MANIFEST_SPEC = {
    "brand": "string",
    "inventory": {
        "names_handles_products_listed": "boolean",
        "misspellings_and_variants_included": "boolean",
        "owned_vs_third_party_distinguished": "boolean",
    },
    "coverage": {
        "sources_listed": "boolean",
        "blind_spots_acknowledged": "boolean",
        "mechanism_configured_per_source": "boolean",
        "cadence_defined": "boolean",
        "crisis_cadence_realtime": "boolean",
        "routine_cadence_daily_digest": "boolean",
    },
    "triage": {
        "rubric_documented": "boolean",
        "dimensions": ["string"],
        "routes": ["string"],
        "escalation_path_documented": "boolean",
        "false_positives_tracked": "boolean",
    },
    "response": {
        "authority_to_speak_defined": "boolean",
        "tone_rules_defined": "boolean",
        "dm_move_criteria_defined": "boolean",
        "statement_criteria_defined": "boolean",
        "templates_approved": "boolean",
    },
    "alerts": {
        "thresholds_defined": "boolean",
        "dedupe_enabled": "boolean",
        "quiet_hours_defined": "boolean",
        "tested_after_setup": "boolean",
    },
    "evidence": {
        "archiving_required_before_response": "boolean",
    },
    "counts": {
        "total_mentions": "number",
        "actions_taken": "number",
        "actions_with_evidence_archived": "number",
    },
    "digest": {
        "weekly_cadence": "boolean",
        "includes_notable_mentions": "boolean",
        "includes_trend_notes": "boolean",
        "sentiment_included": "boolean",
        "sentiment_caveats_stated": "boolean",
        "actions_taken_listed": "boolean",
        "signal_separated_from_noise": "boolean",
    },
    "conduct": {
        "astroturfing_fake_reviews_or_manufactured_engagement": "boolean",
        "public_argument_without_policy_backing": "boolean",
        "retaliation_against_mentioners": "boolean",
        "private_data_of_individuals_exposed": "boolean",
        "defamation_or_impersonation_fought_publicly_instead_of_counsel": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a brand-mention manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: inventory_and_coverage (skill method steps
    #      1-2: "Inventory: names, handles, products, misspellings
    #      and variants; owned channels vs third-party sources.
    #      List where discussion happens and known blind spots
    #      (logged-in-only platforms, DMs)"; "Coverage setup: RSS,
    #      APIs, saved searches, alerts, webmentions per source;
    #      define cadence (real-time for crises, daily digest
    #      otherwise)"; quality gate: "Coverage list written with
    #      blind spots acknowledged") ----
    _bool_check(results, "inventory_and_coverage",
                "names_handles_products_listed",
                manifest, ("inventory", "names_handles_products_listed"),
                "method step 1: names, handles and products under "
                "watch are listed")
    _bool_check(results, "inventory_and_coverage",
                "misspellings_and_variants_included",
                manifest,
                ("inventory", "misspellings_and_variants_included"),
                "method step 1: misspellings and variants of the "
                "watched names are included in the inventory")
    _bool_check(results, "inventory_and_coverage",
                "owned_vs_third_party_distinguished",
                manifest,
                ("inventory", "owned_vs_third_party_distinguished"),
                "method step 1: owned channels are distinguished "
                "from third-party sources")
    _bool_check(results, "inventory_and_coverage", "coverage_sources_listed",
                manifest, ("coverage", "sources_listed"),
                "method step 1: where discussion happens is listed "
                "— the coverage list is written")
    _bool_check(results, "inventory_and_coverage",
                "blind_spots_acknowledged",
                manifest, ("coverage", "blind_spots_acknowledged"),
                "quality gate: the coverage list acknowledges its "
                "blind spots (e.g. logged-in-only platforms, DMs)")
    _bool_check(results, "inventory_and_coverage",
                "coverage_mechanism_configured_per_source",
                manifest,
                ("coverage", "mechanism_configured_per_source"),
                "method step 2: a coverage mechanism (RSS, APIs, "
                "saved searches, alerts, webmentions) is configured "
                "per source")
    _bool_check(results, "inventory_and_coverage", "cadence_defined",
                manifest, ("coverage", "cadence_defined"),
                "method step 2: a monitoring cadence is defined")
    _bool_check(results, "inventory_and_coverage",
                "crisis_cadence_realtime",
                manifest, ("coverage", "crisis_cadence_realtime"),
                "method step 2: the cadence is real-time for crises")
    _bool_check(results, "inventory_and_coverage",
                "routine_cadence_daily_digest",
                manifest, ("coverage", "routine_cadence_daily_digest"),
                "method step 2: the cadence is a daily digest "
                "otherwise")

    # ---- Section 2: triage_rubric (skill method step 3: "Triage
    #      rubric: severity x reach x authenticity (is it
    #      spam/astroturf?). Route: ignore / monitor / reply /
    #      escalate / legal. False positives get tracked too";
    #      quality gate: "Triage rubric + escalation path
    #      documented") ----
    _bool_check(results, "triage_rubric", "triage_rubric_documented",
                manifest, ("triage", "rubric_documented"),
                "quality gate: the triage rubric is documented")
    dimensions, has_dimensions = _get(manifest, "triage", "dimensions")
    dimensions_is_list = has_dimensions and isinstance(dimensions, list)
    dimensions_missing = (
        [d for d in STATED_DIMENSIONS if d not in dimensions]
        if dimensions_is_list else None
    )
    _check(results, "triage_rubric", "all_stated_triage_dimensions_used",
           dimensions, dimensions_is_list,
           dimensions_is_list and len(dimensions_missing) == 0,
           "method step 3: the rubric scores every dimension the "
           "skill names — severity, reach, authenticity (is it "
           "spam/astroturf?)")
    routes, has_routes = _get(manifest, "triage", "routes")
    routes_is_list = has_routes and isinstance(routes, list)
    routes_missing = (
        [r for r in STATED_ROUTES if r not in routes]
        if routes_is_list else None
    )
    _check(results, "triage_rubric", "all_stated_triage_routes_defined",
           routes, routes_is_list,
           routes_is_list and len(routes_missing) == 0,
           "method step 3: the rubric defines every route the "
           "skill names — ignore, monitor, reply, escalate, legal")
    _bool_check(results, "triage_rubric", "escalation_path_documented",
                manifest, ("triage", "escalation_path_documented"),
                "quality gate: the escalation path is documented")
    _bool_check(results, "triage_rubric", "false_positives_tracked",
                manifest, ("triage", "false_positives_tracked"),
                "method step 3: false positives get tracked too")

    # ---- Section 3: response_policy (skill method step 4:
    #      "Response policy: who may speak as the brand; tone
    #      rules; when to take it to DM; when to publish a
    #      statement. Draft + approve templates for common cases";
    #      quality gate: "Response templates approved; authority
    #      to speak defined") ----
    _bool_check(results, "response_policy", "authority_to_speak_defined",
                manifest, ("response", "authority_to_speak_defined"),
                "quality gate: authority to speak is defined — who "
                "may speak as the brand")
    _bool_check(results, "response_policy", "tone_rules_defined",
                manifest, ("response", "tone_rules_defined"),
                "method step 4: tone rules for responses are defined")
    _bool_check(results, "response_policy", "dm_move_criteria_defined",
                manifest, ("response", "dm_move_criteria_defined"),
                "method step 4: when to take a conversation to DM "
                "is defined")
    _bool_check(results, "response_policy", "statement_criteria_defined",
                manifest, ("response", "statement_criteria_defined"),
                "method step 4: when to publish a statement is "
                "defined")
    _bool_check(results, "response_policy", "response_templates_approved",
                manifest, ("response", "templates_approved"),
                "quality gate: response templates for common cases "
                "are drafted and approved")

    # ---- Section 4: alert_hygiene_and_evidence (skill method
    #      steps 5-6: "Alert hygiene: thresholds, dedupe, quiet
    #      hours; no alert storms; test alerts after setup";
    #      "Evidence: archive every actionable mention (screenshot
    #      + link) before responding — posts get deleted"; quality
    #      gate: "Evidence archived for every action taken") ----
    _bool_check(results, "alert_hygiene_and_evidence",
                "alert_thresholds_defined",
                manifest, ("alerts", "thresholds_defined"),
                "method step 5: alert thresholds are defined")
    _bool_check(results, "alert_hygiene_and_evidence", "alert_dedupe_enabled",
                manifest, ("alerts", "dedupe_enabled"),
                "method step 5: alerts are deduplicated — no alert "
                "storms")
    _bool_check(results, "alert_hygiene_and_evidence",
                "alert_quiet_hours_defined",
                manifest, ("alerts", "quiet_hours_defined"),
                "method step 5: alert quiet hours are defined")
    _bool_check(results, "alert_hygiene_and_evidence",
                "alerts_tested_after_setup",
                manifest, ("alerts", "tested_after_setup"),
                "method step 5: alerts are tested after setup")
    _bool_check(results, "alert_hygiene_and_evidence",
                "evidence_archived_before_response",
                manifest,
                ("evidence", "archiving_required_before_response"),
                "method step 6: every actionable mention is "
                "archived (screenshot + link) before responding — "
                "posts get deleted")
    total, has_total = _get(manifest, "counts", "total_mentions")
    taken, has_taken = _get(manifest, "counts", "actions_taken")
    archived, has_archived = _get(
        manifest, "counts", "actions_with_evidence_archived")
    all_counts = (
        has_total and has_taken and has_archived
        and _is_number(total) and _is_number(taken)
        and _is_number(archived)
    )
    without_evidence = (
        taken - archived
        if has_taken and has_archived and _is_number(taken)
        and _is_number(archived)
        else None
    )
    evidence_complete = (
        all_counts
        and total >= 0 and taken >= 0 and archived >= 0
        and taken <= total
        and archived == taken
    )
    _check(results, "alert_hygiene_and_evidence",
           "evidence_archived_for_every_action", archived, all_counts,
           evidence_complete,
           "quality gate: evidence is archived for every action "
           "taken — the archived count equals the actions-taken "
           "count, with coherent counts")

    # ---- Section 5: digest_reporting (skill method step 7:
    #      "Report: weekly digest — notable mentions, trend notes,
    #      sentiment with caveats, actions taken. Separate signal
    #      from noise explicitly") ----
    _bool_check(results, "digest_reporting", "digest_weekly_cadence",
                manifest, ("digest", "weekly_cadence"),
                "method step 7: the report is a weekly digest")
    _bool_check(results, "digest_reporting",
                "digest_includes_notable_mentions",
                manifest, ("digest", "includes_notable_mentions"),
                "method step 7: the digest includes notable mentions")
    _bool_check(results, "digest_reporting", "digest_includes_trend_notes",
                manifest, ("digest", "includes_trend_notes"),
                "method step 7: the digest includes trend notes")
    _bool_check(results, "digest_reporting", "digest_sentiment_included",
                manifest, ("digest", "sentiment_included"),
                "method step 7: the digest includes sentiment")
    _bool_check(results, "digest_reporting",
                "digest_sentiment_caveats_stated",
                manifest, ("digest", "sentiment_caveats_stated"),
                "method step 7: sentiment is reported with caveats")
    _bool_check(results, "digest_reporting", "digest_actions_taken_listed",
                manifest, ("digest", "actions_taken_listed"),
                "method step 7: the digest lists actions taken")
    _bool_check(results, "digest_reporting",
                "signal_separated_from_noise",
                manifest, ("digest", "signal_separated_from_noise"),
                "method step 7: signal is separated from noise "
                "explicitly")

    # ---- Section 6: red_lines (skill red lines: "No astroturfing,
    #      fake reviews, or manufactured engagement — ever";
    #      "Don't argue in public threads as the brand without
    #      policy backing; never retaliate"; "Private data about
    #      individuals stays private; defamation/impersonation
    #      goes to counsel, not combat") ----
    _false_check(results, "red_lines", "no_astroturfing_or_fake_engagement",
                 manifest,
                 ("conduct",
                  "astroturfing_fake_reviews_or_manufactured_engagement"),
                 "red line: no astroturfing, fake reviews, or "
                 "manufactured engagement — ever")
    _false_check(results, "red_lines",
                 "no_public_argument_without_policy_backing",
                 manifest,
                 ("conduct", "public_argument_without_policy_backing"),
                 "red line: the brand does not argue in public "
                 "threads without policy backing")
    _false_check(results, "red_lines", "no_retaliation",
                 manifest, ("conduct", "retaliation_against_mentioners"),
                 "red line: never retaliate against mentioners")
    _false_check(results, "red_lines", "private_data_stays_private",
                 manifest,
                 ("conduct", "private_data_of_individuals_exposed"),
                 "red line: private data about individuals stays "
                 "private")
    _false_check(results, "red_lines",
                 "defamation_impersonation_to_counsel_not_combat",
                 manifest,
                 ("conduct",
                  "defamation_or_impersonation_fought_publicly_instead_of_counsel"),
                 "red line: defamation/impersonation goes to "
                 "counsel, not combat")

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
        verdict = "TRIAGE_DIGEST_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TRIAGE_DIGEST_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("all_stated_triage_dimensions_used",
                          "all_stated_triage_routes_defined",
                          "evidence_archived_for_every_action")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "brand-mention-monitoring-triage-digest",
        "atom_version": "0.1.0",
        "brand": manifest.get("brand"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "triage_dimensions_missing": dimensions_missing,
        "triage_routes_missing": routes_missing,
        "actions_without_archived_evidence": without_evidence,
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
        "BRAND MENTION MONITORING TRIAGE DIGEST",
        f"brand: {verdict.get('brand')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print(
            "usage: brand_mention_monitoring_triage_digest.py "
            "<manifest.json>",
            file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TRIAGE_DIGEST_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
