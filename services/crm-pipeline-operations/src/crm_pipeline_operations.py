#!/usr/bin/env python3
"""CRM pipeline operations — deterministic core.

Built from the bound skill `crm` (v1): "Run CRM with discipline
— data hygiene, pipeline stages, follow-up cadences, privacy
and contact rules."

This atom does NOT operate a CRM, contact anyone, or move a
deal, and exercises no judgment of its own. The caller submits
a CRM manifest: one DECLARED pipeline-operations artifact — its
single-source and hygiene record, its contact-rule and privacy
record, its declared pipeline stages with entry/exit criteria,
its declared deal rows, its follow-up cadence and logging
record, its reporting and forecast record, its consent record,
its win/loss record, and its minimal-data/retention record. The
atom validates that artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers and caller-declared limits —
no outside threshold is imported:

- pipeline stages (method step 3: "lead -> qualified ->
  proposal -> decision -> won/lost"): the declared stages used
  must cover lead, qualified, proposal, decision, won, lost;
- deal rows: every declared deal row must carry stage, value,
  age_days, has_next_step, has_next_step_date and open; every
  row's stage must be one of the stages the skill names;
- next step (method step 3 / quality gate: "every open deal
  carries a next step + date"): every declared open deal must
  declare both a next step and a next-step date;
- staleness: an open deal is stale only against the caller's
  OWN declared `pipeline.stale_threshold_days` — the skill says
  "stale = flagged, not trusted" and "stuck-deal list reviewed
  on cadence" but states no day count, so no day count is
  judged; an open deal whose declared age_days exceeds the
  caller-declared threshold fails this check.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals. Counts and the stage distribution are reported as
plain integers (null when they cannot be computed). That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. The pipeline stages the skill names but the
artifact does not declare used are reported as
`pipeline_stages_not_covered` (null when no list is declared).
The computed outcome over the five computed pipeline checks is
reported as `computed_status`.

Verdict:
- any fail             -> CRM_PIPELINE_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CRM_PIPELINE_READY

This is a completeness and consistency audit over declared
evidence, not a CRM-quality review: an artifact that declares
every step passes even if its actual pipeline is poor, and
nothing here verifies that a declared value is true, that a
next step is meaningful, or that a probability is honest.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "single_source_of_truth",
    "contact_rules_and_privacy",
    "pipeline_stages_and_deals",
    "follow_up_cadence_and_logging",
    "reporting_and_forecasts",
    "consent_and_comms",
    "win_loss_discipline",
    "minimal_data_and_retention",
)

STATED_PIPELINE_STAGES = [
    "lead",
    "qualified",
    "proposal",
    "decision",
    "won",
    "lost",
]

DEAL_ROW_FIELDS = (
    "stage",
    "value",
    "age_days",
    "has_next_step",
    "has_next_step_date",
    "open",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the stage list entries and deal-row stages)
# are validated as strings only, never enum-checked: coverage is a
# verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "source": {
        "single_system_maintained": "boolean",
        "contacts_carry_who_what_context_minimum": "boolean",
        "dedupe_cadence_set": "boolean",
        "stale_contacts_flagged_not_trusted": "boolean",
    },
    "contact_rules": {
        "sensitivity_flags_honored": "boolean",
        "sensitivity_flags_override_everything": "boolean",
        "outreach_drafted_for_review_never_auto_sent": "boolean",
        "nothing_personal_shared_beyond_purpose": "boolean",
        "unapproved_outreach_sent": "boolean",
        "bulk_unsolicited_outreach_sent": "boolean",
        "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent": "boolean",
    },
    "pipeline": {
        "stages_used": ["string"],
        "entry_criteria_defined_for_each_stage": "boolean",
        "exit_criteria_defined_for_each_stage": "boolean",
        "deals_advance_on_evidence_not_optimism": "boolean",
        "stale_threshold_days": "number",
        "deals": [{
            "stage": "string",
            "value": "number",
            "age_days": "number",
            "has_next_step": "boolean",
            "has_next_step_date": "boolean",
            "open": "boolean",
        }],
    },
    "follow_up": {
        "cadence_scheduled": "boolean",
        "every_touch_carries_value": "boolean",
        "every_interaction_logged_with_what_said_promised_next": "boolean",
        "promises_tracked_until_delivered": "boolean",
    },
    "reporting": {
        "pipeline_reported_by_stage_and_age": "boolean",
        "conversion_rates_by_stage_reported": "boolean",
        "stuck_deal_list_maintained": "boolean",
        "stuck_deal_review_held_on_cadence": "boolean",
        "forecasts_use_honest_probabilities": "boolean",
    },
    "consent": {
        "marketing_consent_recorded": "boolean",
        "consent_flags_current": "boolean",
        "unsubscribe_honored_instantly": "boolean",
        "segmentation_per_consent": "boolean",
        "scraped_third_party_personal_data_into_crm": "boolean",
    },
    "win_loss": {
        "reasons_captured": "boolean",
        "reasons_include_yours_and_theirs": "boolean",
        "feeds_messaging_product_and_process_improvements": "boolean",
    },
    "minimal_data": {
        "only_relationship_needed_data_collected": "boolean",
        "retention_for_dead_leads_defined": "boolean",
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


def _row_complete(row):
    if not isinstance(row, dict):
        return False
    for field in DEAL_ROW_FIELDS:
        if field not in row:
            return False
    return (
        isinstance(row["stage"], str) and len(row["stage"]) > 0
        and _is_number(row["value"]) and _is_number(row["age_days"])
        and isinstance(row["has_next_step"], bool)
        and isinstance(row["has_next_step_date"], bool)
        and isinstance(row["open"], bool)
    )


def evaluate(manifest):
    """Return the verdict dict for a CRM pipeline manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: single_source_of_truth (skill method step 1:
    #      "Single source of truth: one system (or structured
    #      folder) for contacts + interactions; who/what/context
    #      minimum; dedupe on a schedule; stale = flagged, not
    #      trusted"; quality gate: "Single source of truth
    #      maintained; dedupe cadence set") ----
    _bool_check(results, "single_source_of_truth",
                "single_system_maintained",
                manifest, ("source", "single_system_maintained"),
                "method step 1: one system (or structured folder) "
                "is the single source of truth for contacts and "
                "interactions")
    _bool_check(results, "single_source_of_truth",
                "contacts_carry_who_what_context_minimum",
                manifest,
                ("source", "contacts_carry_who_what_context_minimum"),
                "method step 1: contacts carry the who/what/context "
                "minimum")
    _bool_check(results, "single_source_of_truth", "dedupe_cadence_set",
                manifest, ("source", "dedupe_cadence_set"),
                "quality gate: a dedupe cadence is set — dedupe "
                "happens on a schedule")
    _bool_check(results, "single_source_of_truth",
                "stale_contacts_flagged_not_trusted",
                manifest,
                ("source", "stale_contacts_flagged_not_trusted"),
                "method step 1: stale contacts are flagged, not "
                "trusted")

    # ---- Section 2: contact_rules_and_privacy (skill method
    #      step 2: "Contact rules first: honor house
    #      contact-handling-rules — sensitivity flags are
    #      absolute; outreach is drafted for review, never
    #      auto-sent; nothing personal is shared beyond its
    #      purpose"; quality gate: "Sensitivity flags honored;
    #      no unapproved outreach"; red lines: "Never bulk
    #      unsolicited outreach (spam); never upload personal
    #      contacts to third parties without purpose + consent;
    #      sensitivity flags override everything") ----
    _bool_check(results, "contact_rules_and_privacy",
                "sensitivity_flags_honored",
                manifest, ("contact_rules", "sensitivity_flags_honored"),
                "quality gate: sensitivity flags are honored")
    _bool_check(results, "contact_rules_and_privacy",
                "sensitivity_flags_override_everything",
                manifest,
                ("contact_rules", "sensitivity_flags_override_everything"),
                "red line: sensitivity flags override everything")
    _bool_check(results, "contact_rules_and_privacy",
                "outreach_drafted_for_review_never_auto_sent",
                manifest,
                ("contact_rules",
                 "outreach_drafted_for_review_never_auto_sent"),
                "method step 2: outreach is drafted for review, "
                "never auto-sent")
    _bool_check(results, "contact_rules_and_privacy",
                "nothing_personal_shared_beyond_purpose",
                manifest,
                ("contact_rules", "nothing_personal_shared_beyond_purpose"),
                "method step 2: nothing personal is shared beyond "
                "its purpose")
    _false_check(results, "contact_rules_and_privacy",
                 "no_unapproved_outreach",
                 manifest, ("contact_rules", "unapproved_outreach_sent"),
                 "quality gate: no unapproved outreach is sent")
    _false_check(results, "contact_rules_and_privacy",
                 "no_bulk_unsolicited_outreach",
                 manifest,
                 ("contact_rules", "bulk_unsolicited_outreach_sent"),
                 "red line: never bulk unsolicited outreach (spam)")
    _false_check(results, "contact_rules_and_privacy",
                 "no_personal_contacts_uploaded_without_purpose_and_consent",
                 manifest,
                 ("contact_rules",
                  "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent"),
                 "red line: personal contacts are never uploaded "
                 "to third parties without purpose and consent")

    # ---- Section 3: pipeline_stages_and_deals (skill method
    #      step 3: "Pipeline stages with exit criteria: lead ->
    #      qualified -> proposal -> decision -> won/lost; deals
    #      advance on evidence (call happened, proposal sent),
    #      not optimism; every open deal carries a next step +
    #      date"; quality gate: "Next-step + date on every open
    #      deal; stuck-deal review held") ----
    stages, has_stages = _get(manifest, "pipeline", "stages_used")
    stages_is_list = has_stages and isinstance(stages, list)
    stages_not_covered = (
        [s for s in STATED_PIPELINE_STAGES if s not in stages]
        if stages_is_list else None
    )
    _check(results, "pipeline_stages_and_deals",
           "pipeline_stages_cover_stated_stages",
           stages, stages_is_list,
           stages_is_list and len(stages_not_covered) == 0,
           "method step 3: the stages used cover every stage "
           "the skill names — lead, qualified, proposal, "
           "decision, won, lost")
    _bool_check(results, "pipeline_stages_and_deals",
                "entry_criteria_defined_for_each_stage",
                manifest,
                ("pipeline", "entry_criteria_defined_for_each_stage"),
                "method step 3: entry criteria are defined for "
                "each pipeline stage")
    _bool_check(results, "pipeline_stages_and_deals",
                "exit_criteria_defined_for_each_stage",
                manifest,
                ("pipeline", "exit_criteria_defined_for_each_stage"),
                "method step 3: exit criteria are defined for "
                "each pipeline stage — deals advance on evidence, "
                "not optimism")
    _bool_check(results, "pipeline_stages_and_deals",
                "deals_advance_on_evidence_not_optimism",
                manifest,
                ("pipeline", "deals_advance_on_evidence_not_optimism"),
                "method step 3: deals advance on evidence (call "
                "happened, proposal sent), not optimism")
    deals, has_deals = _get(manifest, "pipeline", "deals")
    deals_is_list = has_deals and isinstance(deals, list)
    rows_complete = (
        deals_is_list and len(deals) > 0
        and all(_row_complete(row) for row in deals)
    )
    rows_incomplete = deals_is_list and not rows_complete and len(deals) > 0 and not all(_row_complete(row) for row in deals)
    # Present semantics: an absent or empty list is present-and-
    # failing / missing respectively as coded below; a non-empty
    # list with an incomplete row is missing evidence for every
    # row-derived check (the row cannot be evaluated).
    if not deals_is_list:
        deal_present = False
    elif len(deals) == 0:
        deal_present = True
    elif rows_incomplete:
        deal_present = False
    else:
        deal_present = True
    _check(results, "pipeline_stages_and_deals", "deal_rows_complete",
           deals, deal_present, rows_complete,
           "method step 3: every declared deal row carries a "
           "stage, a value, an age in days, a next-step flag, a "
           "next-step-date flag, and an open flag")
    open_deals = (
        [row for row in deals if row["open"] is True]
        if rows_complete else []
    )
    deal_count = len(deals) if deals_is_list else None
    open_deal_count = len(open_deals) if rows_complete else None
    stages_are_stated = (
        rows_complete
        and all(row["stage"] in STATED_PIPELINE_STAGES for row in deals)
    )
    _check(results, "pipeline_stages_and_deals",
           "deal_stages_are_stated_stages",
           deals, deal_present, stages_are_stated,
           "method step 3: every declared deal row's stage is "
           "one of the stages the skill names — lead, qualified, "
           "proposal, decision, won, lost")
    open_without_next_step = (
        sum(1 for row in open_deals
            if not (row["has_next_step"] and row["has_next_step_date"]))
        if rows_complete else None
    )
    every_open_has_next = (
        rows_complete and len(open_deals) > 0
        and open_without_next_step == 0
    )
    _check(results, "pipeline_stages_and_deals",
           "every_open_deal_has_next_step_and_date",
           deals, deal_present, every_open_has_next,
           "quality gate: every open deal carries a next step "
           "and a next-step date — the declared open rows all "
           "declare both (a zero open-deal count fails: no open "
           "pipeline exists to prove this over)")
    threshold, has_threshold = _get(manifest, "pipeline",
                                     "stale_threshold_days")
    threshold_is_number = has_threshold and _is_number(threshold)
    stale_present = deal_present and threshold_is_number
    stale_deal_count = (
        sum(1 for row in open_deals if row["age_days"] > threshold)
        if rows_complete and threshold_is_number else None
    )
    no_stale = (
        rows_complete and threshold_is_number
        and len(open_deals) > 0 and stale_deal_count == 0
    )
    _check(results, "pipeline_stages_and_deals",
           "no_open_deal_stale_beyond_declared_threshold",
           deals, stale_present, no_stale,
           "method step 1: stale is flagged, not trusted — no "
           "declared open deal's age in days exceeds the "
           "caller-declared stale_threshold_days; the skill "
           "states no day count, so only the caller's own "
           "declared threshold is applied (a zero open-deal "
           "count fails: no open pipeline exists to prove this "
           "over)")
    stage_distribution = None
    computed_open_value_total = None
    computed_pipeline_value_total = None
    if rows_complete:
        stage_distribution = {
            stage: sum(1 for row in deals if row["stage"] == stage)
            for stage in STATED_PIPELINE_STAGES
        }
        computed_open_value_total = sum(row["value"] for row in open_deals)
        computed_pipeline_value_total = sum(row["value"] for row in deals)

    # ---- Section 4: follow_up_cadence_and_logging (skill method
    #      step 4: "Follow-up cadence: scheduled touches with
    #      value in each (insight, result, useful link); log
    #      every interaction — what was said, what was promised,
    #      what's next; promised = tracked until delivered") ----
    _bool_check(results, "follow_up_cadence_and_logging",
                "follow_up_cadence_scheduled",
                manifest, ("follow_up", "cadence_scheduled"),
                "method step 4: follow-up touches are scheduled "
                "on a cadence")
    _bool_check(results, "follow_up_cadence_and_logging",
                "every_follow_up_touch_carries_value",
                manifest, ("follow_up", "every_touch_carries_value"),
                "method step 4: every scheduled touch carries "
                "value — an insight, a result, a useful link")
    _bool_check(results, "follow_up_cadence_and_logging",
                "every_interaction_logged_with_what_said_promised_next",
                manifest,
                ("follow_up",
                 "every_interaction_logged_with_what_said_promised_next"),
                "method step 4: every interaction is logged — "
                "what was said, what was promised, what is next")
    _bool_check(results, "follow_up_cadence_and_logging",
                "promises_tracked_until_delivered",
                manifest, ("follow_up", "promises_tracked_until_delivered"),
                "method step 4: what was promised is tracked "
                "until delivered")

    # ---- Section 5: reporting_and_forecasts (skill method step
    #      5: "Reporting: pipeline by stage/age, conversion rates
    #      by stage (base rates!), stuck-deal list reviewed on
    #      cadence; feeds revenue-management forecasts with
    #      honest probabilities"; quality gate: "stuck-deal
    #      review held") ----
    _bool_check(results, "reporting_and_forecasts",
                "pipeline_reported_by_stage_and_age",
                manifest,
                ("reporting", "pipeline_reported_by_stage_and_age"),
                "method step 5: the pipeline is reported by stage "
                "and age")
    _bool_check(results, "reporting_and_forecasts",
                "conversion_rates_by_stage_reported",
                manifest,
                ("reporting", "conversion_rates_by_stage_reported"),
                "method step 5: conversion rates by stage are "
                "reported — base rates, not impressions")
    _bool_check(results, "reporting_and_forecasts",
                "stuck_deal_list_maintained",
                manifest, ("reporting", "stuck_deal_list_maintained"),
                "method step 5: a stuck-deal list is maintained")
    _bool_check(results, "reporting_and_forecasts",
                "stuck_deal_review_held_on_cadence",
                manifest,
                ("reporting", "stuck_deal_review_held_on_cadence"),
                "quality gate: the stuck-deal review is held on "
                "cadence")
    _bool_check(results, "reporting_and_forecasts",
                "forecasts_use_honest_probabilities",
                manifest,
                ("reporting", "forecasts_use_honest_probabilities"),
                "method step 5: reporting feeds revenue-management "
                "forecasts with honest probabilities")

    # ---- Section 6: consent_and_comms (skill method step 6:
    #      "Consent & comms: marketing consent recorded;
    #      unsubscribe honored instantly; segmentation per
    #      consent; no scraping third-party personal data into
    #      the CRM"; quality gate: "Consent flags current") ----
    _bool_check(results, "consent_and_comms",
                "marketing_consent_recorded",
                manifest, ("consent", "marketing_consent_recorded"),
                "method step 6: marketing consent is recorded")
    _bool_check(results, "consent_and_comms", "consent_flags_current",
                manifest, ("consent", "consent_flags_current"),
                "quality gate: consent flags are current")
    _bool_check(results, "consent_and_comms",
                "unsubscribe_honored_instantly",
                manifest, ("consent", "unsubscribe_honored_instantly"),
                "method step 6: unsubscribe is honored instantly")
    _bool_check(results, "consent_and_comms", "segmentation_per_consent",
                manifest, ("consent", "segmentation_per_consent"),
                "method step 6: segmentation is per consent")
    _false_check(results, "consent_and_comms",
                 "no_scraping_third_party_personal_data",
                 manifest,
                 ("consent", "scraped_third_party_personal_data_into_crm"),
                 "method step 6: no third-party personal data is "
                 "scraped into the CRM")

    # ---- Section 7: win_loss_discipline (skill method step 7:
    #      "Win/loss discipline: capture the reason (yours and
    #      theirs); feed messaging, product, and process
    #      improvements"; quality gate: "win/loss reasons
    #      captured") ----
    _bool_check(results, "win_loss_discipline", "win_loss_reasons_captured",
                manifest, ("win_loss", "reasons_captured"),
                "quality gate: win/loss reasons are captured")
    _bool_check(results, "win_loss_discipline",
                "win_loss_reasons_include_yours_and_theirs",
                manifest, ("win_loss", "reasons_include_yours_and_theirs"),
                "method step 7: the captured reason includes "
                "yours and theirs")
    _bool_check(results, "win_loss_discipline",
                "win_loss_feeds_improvements",
                manifest,
                ("win_loss",
                 "feeds_messaging_product_and_process_improvements"),
                "method step 7: win/loss reasons feed messaging, "
                "product, and process improvements")

    # ---- Section 8: minimal_data_and_retention (skill method
    #      step 8: "Minimal data: collect what the relationship
    #      needs, not everything possible; retention for dead
    #      leads defined") ----
    _bool_check(results, "minimal_data_and_retention",
                "only_relationship_needed_data_collected",
                manifest,
                ("minimal_data", "only_relationship_needed_data_collected"),
                "method step 8: only what the relationship needs "
                "is collected, not everything possible")
    _bool_check(results, "minimal_data_and_retention",
                "retention_for_dead_leads_defined",
                manifest,
                ("minimal_data", "retention_for_dead_leads_defined"),
                "method step 8: retention for dead leads is "
                "defined")

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
        verdict = "CRM_PIPELINE_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CRM_PIPELINE_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "pipeline_stages_cover_stated_stages",
            "deal_rows_complete",
            "deal_stages_are_stated_stages",
            "every_open_deal_has_next_step_and_date",
            "no_open_deal_stale_beyond_declared_threshold")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "crm-pipeline-operations",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "pipeline_stages_not_covered": stages_not_covered,
        "deal_count": deal_count,
        "open_deal_count": open_deal_count,
        "stale_deal_count": stale_deal_count,
        "open_deals_without_next_step_or_date_count": open_without_next_step,
        "stage_distribution": stage_distribution,
        "computed_open_value_total": _fmt6(computed_open_value_total),
        "computed_pipeline_value_total": _fmt6(computed_pipeline_value_total),
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
        "CRM PIPELINE OPERATIONS",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: crm_pipeline_operations.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CRM_PIPELINE_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
