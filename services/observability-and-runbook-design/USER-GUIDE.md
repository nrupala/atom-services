# Observability and runbook design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run a service and you have a record of its observability and runbook design — logs, metrics, traces, dashboards, alerts, runbooks, incident flow, backups and heartbeats. This atom reads one declared manifest and returns one deterministic verdict across five sections (signals_and_dashboards, alert_design_and_runbook_linkage, runbook_content_and_failure_modes, incident_flow_and_postmortem, backups_silent_failure_and_red_lines): **OBSERVABILITY_DESIGN_SOUND**, **OBSERVABILITY_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 43 checks. It audits the declared record's completeness and consistency only — it designs no monitoring stack itself, reads no live logs, metrics or traces, pages no one, runs no restore test, and does not verify that a declared signal, alert, runbook or restore test ever existed in a real system. A record is sound *on your declared evidence*: it never judges whether the named signals are the right signals, whether an alert threshold is well chosen, whether a runbook's steps would actually work, or whether the incident flow would hold under a real outage. The fourteen computed checks: the declared `alerts` list must be present and non-empty; every alert row must name a non-empty `owner`, must link its runbook, must be actionable and must be symptom-based; no alert `name` may be duplicated; the declared `failure_modes` list must be present and non-empty; every failure-mode row must declare a runbook that describes symptoms and carries check steps, mitigation, escalation and recovery verification; and no failure-mode `name` may be duplicated. Note: the three `red_lines` flags — `paging_on_unactionable_causes_present`, `unowned_alerts_present` and `monitoring_disabled_to_hide_problem_present` — must be `false` to pass. No numeric threshold is imposed — no maximum number of alerts behind the skill's "few", no error-rate, latency or saturation threshold value an alert must fire at, no trace sampling rate or log volume / retention bar, no dashboard count or refresh interval, no restore-test interval in days beyond the skill's own stated cadence of at least once per season (checked as declared, never converted to days), no backup retention, RPO or RTO number, no incident acknowledgement or response time in minutes, no postmortem completion or action-closure deadline in days, no heartbeat interval for unattended jobs, and no coverage percentage below completeness; those declined thresholds are named in the service definition. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "observability-and-runbook-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/observability-and-runbook-design` — tool name `observability_and_runbook_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/observability-and-runbook-design` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `service_name` | service name (string; carried into the output, not checked) |
| `signals.structured_logs_with_correlation_ids` | signals evidence: structured logs carry correlation ids |
| `signals.metrics_cover_requests` | signals evidence: metrics cover requests |
| `signals.metrics_cover_errors` | signals evidence: metrics cover errors |
| `signals.metrics_cover_latency` | signals evidence: metrics cover latency |
| `signals.metrics_cover_saturation` | signals evidence: metrics cover saturation |
| `signals.traces_or_timings_at_every_edge` | signals evidence: traces, or at least timings, exist at every edge |
| `signals.health_signal_emitted` | quality gate: the service emits a health signal |
| `signals.error_rate_signal_emitted` | quality gate: the service emits an error-rate signal |
| `signals.latency_signal_emitted` | quality gate: the service emits a latency signal |
| `signals.dashboards_present` | signals evidence: dashboards present the declared signals |
| `alert_design.alert_set_symptom_based` | alert-design evidence: the alert set is symptom-based — user-visible pain, not causes |
| `alert_design.alert_thresholds_tuned_to_reality` | alert-design evidence: thresholds are tuned to reality |
| `alert_design.alert_noise_controls_present` | alert-design evidence: the set is few and actionable, with controls against noise storms |
| `alerts` (list of alert-row objects) | computed: must be present and non-empty; reported as `alerts_count` |
| `alerts[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (reported in `duplicate_alert_names`) |
| `alerts[].owner` (string) | computed: every row must name a non-empty owner; rows with the field present but empty are reported in `alerts_without_owner` |
| `alerts[].runbook_linked` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `alerts_without_runbook_link` |
| `alerts[].actionable` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `alerts_without_actionable` |
| `alerts[].symptom_based` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `alerts_without_symptom_basis` |
| `failure_modes` (list of failure-mode-row objects) | computed: must be present and non-empty; reported as `failure_modes_count` |
| `failure_modes[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (reported in `duplicate_failure_mode_names`) |
| `failure_modes[].runbook_present` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_runbook` |
| `failure_modes[].symptoms_described` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_symptoms` |
| `failure_modes[].check_steps_present` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_check_steps` |
| `failure_modes[].mitigation_present` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_mitigation` |
| `failure_modes[].escalation_present` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_escalation` |
| `failure_modes[].recovery_verification_present` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `failure_modes_without_recovery_verification` |
| `incident.acknowledge_step_defined` | incident-flow evidence: acknowledge is a defined step |
| `incident.blast_radius_assessment_step_defined` | incident-flow evidence: assessing blast radius is a defined step |
| `incident.stabilize_step_defined` | incident-flow evidence: stabilize is a defined step |
| `incident.rollback_as_first_stabilize_option` | incident-flow evidence: rollback is the first stabilize option |
| `incident.status_communication_step_defined` | incident-flow evidence: communicating status is a defined step |
| `incident.fix_step_defined` | incident-flow evidence: fix is a defined step, after stabilizing |
| `incident.blameless_postmortem_required` | incident-flow evidence: a blameless postmortem is required after an incident |
| `incident.postmortem_actions_tracked_to_closure` | quality gate: postmortem actions are tracked to closure |
| `resilience.backup_schedule_declared` | backups evidence: a backup schedule is declared |
| `resilience.backup_restores_tested` | backups evidence: restores are tested, not just backups scheduled |
| `resilience.restore_tested_at_least_once_per_season` | quality gate: backups are restore-tested at least once per season |
| `resilience.unattended_jobs_have_health_signals` | no-silent-failure evidence: anything that can fail unattended has a health signal |
| `resilience.jobs_emit_success_heartbeats` | no-silent-failure evidence: jobs report success too — heartbeats |
| `red_lines.paging_on_unactionable_causes_present` | must be `false` to pass (red line: no paging on causes nobody can act on) |
| `red_lines.unowned_alerts_present` | must be `false` to pass (red line: no unowned alerts) |
| `red_lines.monitoring_disabled_to_hide_problem_present` | must be `false` to pass (red line: monitoring is never disabled to make a problem disappear) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward OBSERVABILITY_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/observability-and-runbook-design`:

```json
{
  "service_name": "auth-service",
  "signals": {
    "structured_logs_with_correlation_ids": true,
    "metrics_cover_requests": true,
    "metrics_cover_errors": true,
    "metrics_cover_latency": true,
    "metrics_cover_saturation": true,
    "traces_or_timings_at_every_edge": true,
    "health_signal_emitted": true,
    "error_rate_signal_emitted": true,
    "latency_signal_emitted": true,
    "dashboards_present": true
  },
  "alert_design": {
    "alert_set_symptom_based": true,
    "alert_thresholds_tuned_to_reality": true,
    "alert_noise_controls_present": true
  },
  "alerts": [
    {
      "name": "high-error-rate",
      "owner": "team-alpha",
      "runbook_linked": true,
      "actionable": true,
      "symptom_based": true
    }
  ],
  "failure_modes": [
    {
      "name": "db-connection-timeout",
      "runbook_present": true,
      "symptoms_described": true,
      "check_steps_present": true,
      "mitigation_present": true,
      "escalation_present": true,
      "recovery_verification_present": true
    }
  ],
  "incident": {
    "acknowledge_step_defined": true,
    "blast_radius_assessment_step_defined": true,
    "stabilize_step_defined": true,
    "rollback_as_first_stabilize_option": true,
    "status_communication_step_defined": true,
    "fix_step_defined": true,
    "blameless_postmortem_required": true,
    "postmortem_actions_tracked_to_closure": true
  },
  "resilience": {
    "backup_schedule_declared": true,
    "backup_restores_tested": true,
    "restore_tested_at_least_once_per_season": true,
    "unattended_jobs_have_health_signals": true,
    "jobs_emit_success_heartbeats": true
  },
  "red_lines": {
    "paging_on_unactionable_causes_present": false,
    "unowned_alerts_present": false,
    "monitoring_disabled_to_hide_problem_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 43 checks and a text stamp of the verdict):

```json
{
  "service": "observability-and-runbook-design",
  "atom_version": "0.1.0",
  "service_name": "auth-service",
  "verdict": "OBSERVABILITY_DESIGN_SOUND",
  "sections": {
    "signals_and_dashboards": "pass",
    "alert_design_and_runbook_linkage": "pass",
    "runbook_content_and_failure_modes": "pass",
    "incident_flow_and_postmortem": "pass",
    "backups_silent_failure_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "alerts_count": 1,
  "alerts_without_owner": [],
  "owner_coverage": "1.000000",
  "alerts_without_runbook_link": [],
  "runbook_link_coverage": "1.000000",
  "alerts_without_actionable": [],
  "actionable_coverage": "1.000000",
  "alerts_without_symptom_basis": [],
  "symptom_based_coverage": "1.000000",
  "duplicate_alert_names": [],
  "failure_modes_count": 1,
  "failure_modes_without_runbook": [],
  "runbook_coverage": "1.000000",
  "failure_modes_without_symptoms": [],
  "symptoms_coverage": "1.000000",
  "failure_modes_without_check_steps": [],
  "check_steps_coverage": "1.000000",
  "failure_modes_without_mitigation": [],
  "mitigation_coverage": "1.000000",
  "failure_modes_without_escalation": [],
  "escalation_coverage": "1.000000",
  "failure_modes_without_recovery_verification": [],
  "recovery_verification_coverage": "1.000000",
  "duplicate_failure_mode_names": [],
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

## Verdicts

- **OBSERVABILITY_DESIGN_SOUND** — every check passes; the declared observability and runbook design record is complete and consistent with the skill's checklist and red lines.
- **OBSERVABILITY_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `alerts_count` and `failure_modes_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `alerts_without_owner`, `alerts_without_runbook_link`, `alerts_without_actionable`, `alerts_without_symptom_basis`, `failure_modes_without_runbook`, `failure_modes_without_symptoms`, `failure_modes_without_check_steps`, `failure_modes_without_mitigation`, `failure_modes_without_escalation` and `failure_modes_without_recovery_verification` and the name lists `duplicate_alert_names` and `duplicate_failure_mode_names` (null when the corresponding list is not declared; a row with the relevant field absent is missing evidence and does not appear in these lists), the coverage values `owner_coverage`, `runbook_link_coverage`, `actionable_coverage`, `symptom_based_coverage`, `runbook_coverage`, `symptoms_coverage`, `check_steps_coverage`, `mitigation_coverage`, `escalation_coverage` and `recovery_verification_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fourteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
