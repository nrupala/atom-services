#!/usr/bin/env python3
"""Observability and runbook design — deterministic core.

Built from the bound skill `observability-ops`: "Make systems
observable and operable — logs, metrics, runbooks, alert design,
incident response, blameless postmortems." ("If you can't see
it, you can't run it.")

This atom is a REVIEW of a declared observability-and-runbook
design record: it audits the record a caller declares against
the design the skill defines — the three signals at every edge,
symptom-based actionable alerts each linked to a runbook and an
owner, a runbook per failure mode carrying symptoms, check
steps, mitigation, escalation and recovery verification, the
incident flow from acknowledgement to a blameless postmortem
with tracked actions, restore-tested backups, no silent
failure, and the skill's red lines refused. It does not design
a monitoring stack itself, read live telemetry, page anyone, or
verify that a declared signal, alert, runbook or restore test
ever existed in a real system — it checks that the design
record the skill requires is present and internally complete
and consistent on the declared evidence.

Distinct ground: the nearest deployed siblings are
`backend-engineering-advice` (a broad backend design review —
contracts, data safety, idempotency, jobs — whose observability
corner asks whether a backend's code emits structured logs and
edge metrics at all), `cicd-pipeline-design` (pipeline stages,
gates, secrets and a rollback path for a build pipeline),
`release-readiness-verdict` (release artifacts, changelog, a
rollback plan and a post-release health window for one
release), `database-design-review` (a database design review
that includes scheduled backups for a database), and
`condition-monitoring-triage` (industrial asset condition
readings classified against alarm bands). This atom shares
zero checks with any of them: every check here is an
observability-design question for a running service — the
three signals and the health / error-rate / latency quality
gates, per-alert owner / runbook-link / actionable /
symptom-based completeness over the declared alert rows,
per-failure-mode runbook content completeness over the
declared failure-mode rows, the incident flow steps in order,
restore-tested (not merely scheduled) backups, success
heartbeats for unattended jobs, and the observability red
lines. The boundary is: a service's declared observability and
runbook design here; backend code design, pipeline design,
release readiness, database design and physical-asset
monitoring there.

The caller submits an observability manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- alerts: the declared `alerts` list must be non-empty, and
  every declared alert row must have an owner, link its
  runbook, be actionable and be symptom-based (the skill:
  "Every alert has a runbook and an owner"; "symptom-based
  (user-visible pain), few and actionable");
- failure_modes: the declared `failure_modes` list must be
  non-empty, and every declared failure-mode row must have a
  runbook that describes symptoms and carries check steps,
  mitigation, escalation and recovery verification (the skill:
  "Runbooks: one per failure mode — symptoms, check steps,
  mitigation, escalation, recovery verification");
- name ownership: no declared alert name or failure-mode name
  may be owned by more than one row of its own list (internal
  consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no alert-count cap, no
error-rate or latency bar, no threshold value an alert must
fire at, no restore-test day count beyond its own "at least
once per season", no postmortem or runbook deadline — so no
numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared alert and
failure-mode row) as the only bar, exactly as stated above.

Verdict:
- any fail             -> OBSERVABILITY_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> OBSERVABILITY_DESIGN_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "signals_and_dashboards",
    "alert_design_and_runbook_linkage",
    "runbook_content_and_failure_modes",
    "incident_flow_and_postmortem",
    "backups_silent_failure_and_red_lines",
)

MANIFEST_SPEC = {
    "service_name": "string",
    "signals": {
        "structured_logs_with_correlation_ids": "boolean",
        "metrics_cover_requests": "boolean",
        "metrics_cover_errors": "boolean",
        "metrics_cover_latency": "boolean",
        "metrics_cover_saturation": "boolean",
        "traces_or_timings_at_every_edge": "boolean",
        "health_signal_emitted": "boolean",
        "error_rate_signal_emitted": "boolean",
        "latency_signal_emitted": "boolean",
        "dashboards_present": "boolean",
    },
    "alert_design": {
        "alert_set_symptom_based": "boolean",
        "alert_thresholds_tuned_to_reality": "boolean",
        "alert_noise_controls_present": "boolean",
    },
    "alerts": [{
        "name": "string",
        "owner": "string",
        "runbook_linked": "boolean",
        "actionable": "boolean",
        "symptom_based": "boolean",
    }],
    "failure_modes": [{
        "name": "string",
        "runbook_present": "boolean",
        "symptoms_described": "boolean",
        "check_steps_present": "boolean",
        "mitigation_present": "boolean",
        "escalation_present": "boolean",
        "recovery_verification_present": "boolean",
    }],
    "incident": {
        "acknowledge_step_defined": "boolean",
        "blast_radius_assessment_step_defined": "boolean",
        "stabilize_step_defined": "boolean",
        "rollback_as_first_stabilize_option": "boolean",
        "status_communication_step_defined": "boolean",
        "fix_step_defined": "boolean",
        "blameless_postmortem_required": "boolean",
        "postmortem_actions_tracked_to_closure": "boolean",
    },
    "resilience": {
        "backup_schedule_declared": "boolean",
        "backup_restores_tested": "boolean",
        "restore_tested_at_least_once_per_season": "boolean",
        "unattended_jobs_have_health_signals": "boolean",
        "jobs_emit_success_heartbeats": "boolean",
    },
    "red_lines": {
        "paging_on_unactionable_causes_present": "boolean",
        "unowned_alerts_present": "boolean",
        "monitoring_disabled_to_hide_problem_present": "boolean",
    },
}

# (row field, without-list key stem, coverage key stem) for the
# boolean per-row fields of each computed row list.
ALERT_BOOL_FIELDS = (
    "runbook_linked",
    "actionable",
    "symptom_based",
)
FAILURE_MODE_BOOL_FIELDS = (
    "runbook_present",
    "symptoms_described",
    "check_steps_present",
    "mitigation_present",
    "escalation_present",
    "recovery_verification_present",
)


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


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _rows_state(manifest, key):
    rows_raw, has_rows = _get(manifest, key)
    is_list = has_rows and isinstance(rows_raw, list)
    rows = rows_raw if is_list else []
    count = len(rows) if is_list else None
    return rows_raw, is_list, rows, count


def _without(rows, is_list, field):
    if not is_list:
        return None
    return [_row_name(c) for c in rows
            if isinstance(c, dict) and field in c
            and c.get(field) is not True]


def _without_owner(rows, is_list):
    if not is_list:
        return None
    return [_row_name(c) for c in rows
            if isinstance(c, dict) and "owner" in c
            and not (isinstance(c.get("owner"), str)
                     and c.get("owner") != "")]


def _coverage(rows, is_list, count, field):
    if not (is_list and count):
        return None
    return (sum(1 for c in rows
                if isinstance(c, dict) and c.get(field) is True)
            / count)


def _owner_coverage(rows, is_list, count):
    if not (is_list and count):
        return None
    return (sum(1 for c in rows
                if isinstance(c, dict)
                and isinstance(c.get("owner"), str)
                and c.get("owner") != "")
            / count)


def _duplicates(rows, is_list):
    if not is_list:
        return None
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get("name"), str):
            nm = c["name"]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _row_bool_check(results, section, name, rows_raw, is_list, rows,
                    count, field, evidence):
    present = (
        is_list
        and all(isinstance(c, dict) and field in c for c in rows)
    )
    _check(results, section, name, rows_raw, present,
           is_list and count > 0
           and all(isinstance(c, dict) and c.get(field) is True
                   for c in rows),
           evidence)


def evaluate(manifest):
    """Return the verdict dict for an observability manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    alerts_raw, alerts_is_list, alert_rows, alerts_count = (
        _rows_state(manifest, "alerts"))
    fm_raw, fm_is_list, fm_rows, fm_count = (
        _rows_state(manifest, "failure_modes"))

    alerts_without_owner = _without_owner(alert_rows, alerts_is_list)
    alerts_without_runbook_link = _without(
        alert_rows, alerts_is_list, "runbook_linked")
    alerts_without_actionable = _without(
        alert_rows, alerts_is_list, "actionable")
    alerts_without_symptom_basis = _without(
        alert_rows, alerts_is_list, "symptom_based")
    duplicate_alert_names = _duplicates(alert_rows, alerts_is_list)
    owner_coverage = _owner_coverage(
        alert_rows, alerts_is_list, alerts_count)
    runbook_link_coverage = _coverage(
        alert_rows, alerts_is_list, alerts_count, "runbook_linked")
    actionable_coverage = _coverage(
        alert_rows, alerts_is_list, alerts_count, "actionable")
    symptom_based_coverage = _coverage(
        alert_rows, alerts_is_list, alerts_count, "symptom_based")

    fm_without = {
        field: _without(fm_rows, fm_is_list, field)
        for field in FAILURE_MODE_BOOL_FIELDS
    }
    fm_coverage = {
        field: _coverage(fm_rows, fm_is_list, fm_count, field)
        for field in FAILURE_MODE_BOOL_FIELDS
    }
    duplicate_failure_mode_names = _duplicates(fm_rows, fm_is_list)

    # ---- Section 1: signals_and_dashboards (skill Method 1
    #      "Three signals" and the quality gate "Every service
    #      emits health, error-rate, and latency signals", plus
    #      the dashboards artifact) ----
    _bool_check(results, "signals_and_dashboards",
                "structured_logs_with_correlation_ids", manifest,
                ("signals", "structured_logs_with_correlation_ids"),
                "signals: structured logs carry correlation ids")
    _bool_check(results, "signals_and_dashboards",
                "metrics_cover_requests", manifest,
                ("signals", "metrics_cover_requests"),
                "signals: metrics cover requests")
    _bool_check(results, "signals_and_dashboards",
                "metrics_cover_errors", manifest,
                ("signals", "metrics_cover_errors"),
                "signals: metrics cover errors")
    _bool_check(results, "signals_and_dashboards",
                "metrics_cover_latency", manifest,
                ("signals", "metrics_cover_latency"),
                "signals: metrics cover latency")
    _bool_check(results, "signals_and_dashboards",
                "metrics_cover_saturation", manifest,
                ("signals", "metrics_cover_saturation"),
                "signals: metrics cover saturation")
    _bool_check(results, "signals_and_dashboards",
                "traces_or_timings_at_every_edge", manifest,
                ("signals", "traces_or_timings_at_every_edge"),
                "signals: traces, or at least timings, exist at "
                "every edge")
    _bool_check(results, "signals_and_dashboards",
                "health_signal_emitted", manifest,
                ("signals", "health_signal_emitted"),
                "quality gate: the service emits a health signal")
    _bool_check(results, "signals_and_dashboards",
                "error_rate_signal_emitted", manifest,
                ("signals", "error_rate_signal_emitted"),
                "quality gate: the service emits an error-rate "
                "signal")
    _bool_check(results, "signals_and_dashboards",
                "latency_signal_emitted", manifest,
                ("signals", "latency_signal_emitted"),
                "quality gate: the service emits a latency signal")
    _bool_check(results, "signals_and_dashboards",
                "dashboards_present", manifest,
                ("signals", "dashboards_present"),
                "artifacts: dashboards present the declared "
                "signals")

    # ---- Section 2: alert_design_and_runbook_linkage (skill
    #      Method 2 "Alerts" and the quality gate "Every alert
    #      has a runbook and an owner", plus the computed alert
    #      rows) ----
    _bool_check(results, "alert_design_and_runbook_linkage",
                "alert_set_symptom_based", manifest,
                ("alert_design", "alert_set_symptom_based"),
                "alerts: the alert set is symptom-based — "
                "user-visible pain, not causes")
    _bool_check(results, "alert_design_and_runbook_linkage",
                "alert_thresholds_tuned_to_reality", manifest,
                ("alert_design", "alert_thresholds_tuned_to_reality"),
                "alerts: thresholds are tuned to reality")
    _bool_check(results, "alert_design_and_runbook_linkage",
                "alert_noise_controls_present", manifest,
                ("alert_design", "alert_noise_controls_present"),
                "alerts: the set is few and actionable, with "
                "controls against noise storms")
    _check(results, "alert_design_and_runbook_linkage",
           "alerts_declared", alerts_raw, alerts_is_list,
           alerts_is_list and alerts_count > 0,
           "the declared record names its alerts — the alerts "
           "list is present and non-empty")
    owner_present = (
        alerts_is_list
        and all(isinstance(c, dict) and "owner" in c
                for c in alert_rows)
    )
    _check(results, "alert_design_and_runbook_linkage",
           "every_alert_has_owner", alerts_raw, owner_present,
           alerts_is_list and alerts_count > 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("owner"), str)
                   and c.get("owner") != ""
                   for c in alert_rows),
           "quality gate: every declared alert row names a "
           "non-empty owner")
    _row_bool_check(results, "alert_design_and_runbook_linkage",
                    "every_alert_links_runbook", alerts_raw,
                    alerts_is_list, alert_rows, alerts_count,
                    "runbook_linked",
                    "alerts: every declared alert row links its "
                    "runbook")
    _row_bool_check(results, "alert_design_and_runbook_linkage",
                    "every_alert_is_actionable", alerts_raw,
                    alerts_is_list, alert_rows, alerts_count,
                    "actionable",
                    "alerts: every declared alert row is "
                    "actionable by its owner")
    _row_bool_check(results, "alert_design_and_runbook_linkage",
                    "every_alert_is_symptom_based", alerts_raw,
                    alerts_is_list, alert_rows, alerts_count,
                    "symptom_based",
                    "alerts: every declared alert row is "
                    "symptom-based — user-visible pain")
    alert_name_present = (
        alerts_is_list
        and all(isinstance(c, dict) and "name" in c
                for c in alert_rows)
    )
    _check(results, "alert_design_and_runbook_linkage",
           "no_alert_name_duplicated", alerts_raw,
           alert_name_present,
           alerts_is_list and duplicate_alert_names is not None
           and len(duplicate_alert_names) == 0,
           "alerts: no declared alert name is owned by more "
           "than one alert row")

    # ---- Section 3: runbook_content_and_failure_modes (skill
    #      Method 3 "Runbooks: one per failure mode", computed
    #      over the declared failure-mode rows) ----
    _check(results, "runbook_content_and_failure_modes",
           "failure_modes_declared", fm_raw, fm_is_list,
           fm_is_list and fm_count > 0,
           "the declared record names its failure modes — the "
           "failure_modes list is present and non-empty")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_failure_mode_has_runbook", fm_raw,
                    fm_is_list, fm_rows, fm_count, "runbook_present",
                    "runbooks: every declared failure mode has a "
                    "runbook — one per failure mode")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_runbook_describes_symptoms", fm_raw,
                    fm_is_list, fm_rows, fm_count,
                    "symptoms_described",
                    "runbooks: every declared runbook describes "
                    "the failure mode's symptoms")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_runbook_has_check_steps", fm_raw,
                    fm_is_list, fm_rows, fm_count,
                    "check_steps_present",
                    "runbooks: every declared runbook carries "
                    "check steps")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_runbook_has_mitigation", fm_raw,
                    fm_is_list, fm_rows, fm_count,
                    "mitigation_present",
                    "runbooks: every declared runbook carries a "
                    "mitigation")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_runbook_has_escalation", fm_raw,
                    fm_is_list, fm_rows, fm_count,
                    "escalation_present",
                    "runbooks: every declared runbook carries an "
                    "escalation path")
    _row_bool_check(results, "runbook_content_and_failure_modes",
                    "every_runbook_has_recovery_verification",
                    fm_raw, fm_is_list, fm_rows, fm_count,
                    "recovery_verification_present",
                    "runbooks: every declared runbook carries "
                    "recovery verification")
    fm_name_present = (
        fm_is_list
        and all(isinstance(c, dict) and "name" in c for c in fm_rows)
    )
    _check(results, "runbook_content_and_failure_modes",
           "no_failure_mode_name_duplicated", fm_raw,
           fm_name_present,
           fm_is_list and duplicate_failure_mode_names is not None
           and len(duplicate_failure_mode_names) == 0,
           "failure modes: no declared failure-mode name is "
           "owned by more than one failure-mode row")

    # ---- Section 4: incident_flow_and_postmortem (skill
    #      Method 4 "Incident flow" and the quality gate
    #      "Postmortem actions tracked to closure") ----
    _bool_check(results, "incident_flow_and_postmortem",
                "acknowledge_step_defined", manifest,
                ("incident", "acknowledge_step_defined"),
                "incident flow: acknowledge is a defined step")
    _bool_check(results, "incident_flow_and_postmortem",
                "blast_radius_assessment_step_defined", manifest,
                ("incident", "blast_radius_assessment_step_defined"),
                "incident flow: assessing blast radius is a "
                "defined step")
    _bool_check(results, "incident_flow_and_postmortem",
                "stabilize_step_defined", manifest,
                ("incident", "stabilize_step_defined"),
                "incident flow: stabilize is a defined step")
    _bool_check(results, "incident_flow_and_postmortem",
                "rollback_as_first_stabilize_option", manifest,
                ("incident", "rollback_as_first_stabilize_option"),
                "incident flow: rollback is the first stabilize "
                "option")
    _bool_check(results, "incident_flow_and_postmortem",
                "status_communication_step_defined", manifest,
                ("incident", "status_communication_step_defined"),
                "incident flow: communicating status is a "
                "defined step")
    _bool_check(results, "incident_flow_and_postmortem",
                "fix_step_defined", manifest,
                ("incident", "fix_step_defined"),
                "incident flow: fix is a defined step, after "
                "stabilizing")
    _bool_check(results, "incident_flow_and_postmortem",
                "blameless_postmortem_required", manifest,
                ("incident", "blameless_postmortem_required"),
                "incident flow: a blameless postmortem is "
                "required after an incident")
    _bool_check(results, "incident_flow_and_postmortem",
                "postmortem_actions_tracked_to_closure", manifest,
                ("incident", "postmortem_actions_tracked_to_closure"),
                "quality gate: postmortem actions are tracked "
                "to closure")

    # ---- Section 5: backups_silent_failure_and_red_lines
    #      (skill Method 5 "Backups", Method 6 "No silent
    #      failure", the quality gate "Backups restore-tested
    #      at least once per season", and the red lines) ----
    _bool_check(results, "backups_silent_failure_and_red_lines",
                "backup_schedule_declared", manifest,
                ("resilience", "backup_schedule_declared"),
                "backups: a backup schedule is declared")
    _bool_check(results, "backups_silent_failure_and_red_lines",
                "backup_restores_tested", manifest,
                ("resilience", "backup_restores_tested"),
                "backups: restores are tested, not just backups "
                "scheduled")
    _bool_check(results, "backups_silent_failure_and_red_lines",
                "restore_tested_at_least_once_per_season", manifest,
                ("resilience",
                 "restore_tested_at_least_once_per_season"),
                "quality gate: backups are restore-tested at "
                "least once per season")
    _bool_check(results, "backups_silent_failure_and_red_lines",
                "unattended_jobs_have_health_signals", manifest,
                ("resilience", "unattended_jobs_have_health_signals"),
                "no silent failure: anything that can fail "
                "unattended has a health signal")
    _bool_check(results, "backups_silent_failure_and_red_lines",
                "jobs_emit_success_heartbeats", manifest,
                ("resilience", "jobs_emit_success_heartbeats"),
                "no silent failure: jobs report success too — "
                "heartbeats")
    _false_check(results, "backups_silent_failure_and_red_lines",
                 "no_paging_on_unactionable_causes", manifest,
                 ("red_lines", "paging_on_unactionable_causes_present"),
                 "red line: no paging on causes nobody can act "
                 "on is present in the design")
    _false_check(results, "backups_silent_failure_and_red_lines",
                 "no_unowned_alerts", manifest,
                 ("red_lines", "unowned_alerts_present"),
                 "red line: no unowned alerts are present in "
                 "the design")
    _false_check(results, "backups_silent_failure_and_red_lines",
                 "monitoring_never_disabled_to_hide_problem", manifest,
                 ("red_lines",
                  "monitoring_disabled_to_hide_problem_present"),
                 "red line: monitoring is never disabled to "
                 "make a problem disappear")

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
        verdict = "OBSERVABILITY_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "OBSERVABILITY_DESIGN_SOUND"

    computed_names = (
        "alerts_declared",
        "every_alert_has_owner",
        "every_alert_links_runbook",
        "every_alert_is_actionable",
        "every_alert_is_symptom_based",
        "no_alert_name_duplicated",
        "failure_modes_declared",
        "every_failure_mode_has_runbook",
        "every_runbook_describes_symptoms",
        "every_runbook_has_check_steps",
        "every_runbook_has_mitigation",
        "every_runbook_has_escalation",
        "every_runbook_has_recovery_verification",
        "no_failure_mode_name_duplicated",
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
        "service": "observability-and-runbook-design",
        "atom_version": "0.1.0",
        "service_name": manifest.get("service_name"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "alerts_count": alerts_count,
        "alerts_without_owner": alerts_without_owner,
        "owner_coverage": _fmt6(owner_coverage),
        "alerts_without_runbook_link": alerts_without_runbook_link,
        "runbook_link_coverage": _fmt6(runbook_link_coverage),
        "alerts_without_actionable": alerts_without_actionable,
        "actionable_coverage": _fmt6(actionable_coverage),
        "alerts_without_symptom_basis": alerts_without_symptom_basis,
        "symptom_based_coverage": _fmt6(symptom_based_coverage),
        "duplicate_alert_names": duplicate_alert_names,
        "failure_modes_count": fm_count,
        "failure_modes_without_runbook":
            fm_without["runbook_present"],
        "runbook_coverage": _fmt6(fm_coverage["runbook_present"]),
        "failure_modes_without_symptoms":
            fm_without["symptoms_described"],
        "symptoms_coverage": _fmt6(fm_coverage["symptoms_described"]),
        "failure_modes_without_check_steps":
            fm_without["check_steps_present"],
        "check_steps_coverage":
            _fmt6(fm_coverage["check_steps_present"]),
        "failure_modes_without_mitigation":
            fm_without["mitigation_present"],
        "mitigation_coverage":
            _fmt6(fm_coverage["mitigation_present"]),
        "failure_modes_without_escalation":
            fm_without["escalation_present"],
        "escalation_coverage":
            _fmt6(fm_coverage["escalation_present"]),
        "failure_modes_without_recovery_verification":
            fm_without["recovery_verification_present"],
        "recovery_verification_coverage":
            _fmt6(fm_coverage["recovery_verification_present"]),
        "duplicate_failure_mode_names": duplicate_failure_mode_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "OBSERVABILITY AND RUNBOOK DESIGN",
        f"service_name: {verdict.get('service_name')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: observability_and_runbook_design.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "OBSERVABILITY_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
