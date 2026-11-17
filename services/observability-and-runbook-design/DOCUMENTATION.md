# Observability and runbook design — documentation

**Observability and runbook design** · slug `observability-and-runbook-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/observability-and-runbook-design/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `service_name` "auth-service"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "observability-and-runbook-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the observability and runbook design manifest.** You declare a record of a service's observability and runbook design — the atom audits the declared record, it does not design a monitoring stack or inspect a live system (see Explanation). The recorded full-pass manifest declares the service `auth-service`: structured logs with correlation ids; metrics covering requests, errors, latency and saturation; traces or timings at every edge; health, error-rate and latency signals emitted; and dashboards present; an alert set that is symptom-based, with thresholds tuned to reality and noise controls present; one alert row, `high-error-rate` (owner `team-alpha`, runbook-linked, actionable and symptom-based); one failure-mode row, `db-connection-timeout`, with a runbook present that describes symptoms and carries check steps, mitigation, escalation and recovery verification; acknowledge, blast-radius assessment, stabilize (rollback as the first stabilize option), status communication and fix steps defined, a blameless postmortem required, and postmortem actions tracked to closure; a backup schedule declared, restores tested at least once per season, unattended jobs with health signals, and jobs emitting success heartbeats; and all three red-line flags `false` (no paging on unactionable causes, no unowned alerts, no monitoring disabled to hide a problem).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/observability-and-runbook-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `OBSERVABILITY_DESIGN_SOUND`: "43 pass, 0 fail, 0 missing of 43 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `alerts_count` and `failure_modes_count` are each 1, and all ten coverage ratios are each `"1.000000"`, with all twelve row-name / duplicate-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `OBSERVABILITY_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "observability-and-runbook-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/observability-and-runbook-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/observability-and-runbook-design` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `observability_and_runbook_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `OBSERVABILITY_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 8 checks fail: `blameless_postmortem_required`, `every_alert_has_owner`, `every_alert_is_symptom_based`, `every_alert_links_runbook`, `every_runbook_has_check_steps`, `every_runbook_has_recovery_verification`, `metrics_cover_errors`, `no_unowned_alerts`, and the summary reads "35 pass, 8 fail, 0 missing of 43 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `alerts_without_owner` names `high-error-rate` — that row declares `owner: ""` — `owner_coverage` is `"0.000000"`, `alerts_without_runbook_link` names `high-error-rate` — that row declares `runbook_linked: false` — `runbook_link_coverage` is `"0.000000"`, `alerts_without_symptom_basis` names `high-error-rate` — that row declares `symptom_based: false` — `symptom_based_coverage` is `"0.000000"`, `failure_modes_without_check_steps` names `db-connection-timeout` — that row declares `check_steps_present: false` — `check_steps_coverage` is `"0.000000"`, and `failure_modes_without_recovery_verification` names `db-connection-timeout` — that row declares `recovery_verification_present: false` — `recovery_verification_coverage` is `"0.000000"`, `signals.metrics_cover_errors` is declared `false`, failing `metrics_cover_errors`, `incident.blameless_postmortem_required` is declared `false`, failing `blameless_postmortem_required`, and `red_lines.unowned_alerts_present` is declared `true`, failing `no_unowned_alerts`; all five sections report `fail`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "signals",
  "detail": "signals must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/observability-and-runbook-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/observability-and-runbook-design` — tool name `observability_and_runbook_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `observability_and_runbook_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `service_name` and the `alerts[]` / `failure_modes[]` name and owner fields are noted as strings and `alerts` and `failure_modes` as lists there. Where SERVICE.md states no type — the section container objects (`signals`, `alert_design`, `incident`, `resilience`, `red_lines`) and the `alerts[]` / `failure_modes[]` row objects — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `alerts` / `failure_modes` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `OBSERVABILITY_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `service_name` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: signals_and_dashboards

| Field | Type | Notes |
|---|---|---|
| `signals` | object | The signals section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `signals.structured_logs_with_correlation_ids` | boolean | — |
| `signals.metrics_cover_requests` | boolean | — |
| `signals.metrics_cover_errors` | boolean | — |
| `signals.metrics_cover_latency` | boolean | — |
| `signals.metrics_cover_saturation` | boolean | — |
| `signals.traces_or_timings_at_every_edge` | boolean | — |
| `signals.health_signal_emitted` | boolean | — |
| `signals.error_rate_signal_emitted` | boolean | — |
| `signals.latency_signal_emitted` | boolean | — |
| `signals.dashboards_present` | boolean | — |

#### Read by: alert_design_and_runbook_linkage

| Field | Type | Notes |
|---|---|---|
| `alert_design` | object | The alert-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `alert_design.alert_set_symptom_based` | boolean | — |
| `alert_design.alert_thresholds_tuned_to_reality` | boolean | — |
| `alert_design.alert_noise_controls_present` | boolean | — |
| `alerts` | list | list of alert-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `alerts[]` | object | One declared alert row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `alerts[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `alerts[].owner` | string | The alert's owner; must be present and non-empty per row (type stated in SERVICE.md) |
| `alerts[].runbook_linked` | boolean | — |
| `alerts[].actionable` | boolean | — |
| `alerts[].symptom_based` | boolean | — |

#### Read by: runbook_content_and_failure_modes

| Field | Type | Notes |
|---|---|---|
| `failure_modes` | list | list of failure-mode-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `failure_modes[]` | object | One declared failure-mode row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `failure_modes[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `failure_modes[].runbook_present` | boolean | — |
| `failure_modes[].symptoms_described` | boolean | — |
| `failure_modes[].check_steps_present` | boolean | — |
| `failure_modes[].mitigation_present` | boolean | — |
| `failure_modes[].escalation_present` | boolean | — |
| `failure_modes[].recovery_verification_present` | boolean | — |

#### Read by: incident_flow_and_postmortem

| Field | Type | Notes |
|---|---|---|
| `incident` | object | The incident section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `incident.acknowledge_step_defined` | boolean | — |
| `incident.blast_radius_assessment_step_defined` | boolean | — |
| `incident.stabilize_step_defined` | boolean | — |
| `incident.rollback_as_first_stabilize_option` | boolean | — |
| `incident.status_communication_step_defined` | boolean | — |
| `incident.fix_step_defined` | boolean | — |
| `incident.blameless_postmortem_required` | boolean | — |
| `incident.postmortem_actions_tracked_to_closure` | boolean | — |

#### Read by: backups_silent_failure_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `resilience` | object | The resilience section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `resilience.backup_schedule_declared` | boolean | — |
| `resilience.backup_restores_tested` | boolean | — |
| `resilience.restore_tested_at_least_once_per_season` | boolean | — |
| `resilience.unattended_jobs_have_health_signals` | boolean | — |
| `resilience.jobs_emit_success_heartbeats` | boolean | — |
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.paging_on_unactionable_causes_present` | boolean | must be `false` to pass |
| `red_lines.unowned_alerts_present` | boolean | must be `false` to pass |
| `red_lines.monitoring_disabled_to_hide_problem_present` | boolean | must be `false` to pass |

### Checks

All 43 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: signals_and_dashboards

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_logs_with_correlation_ids` | signals: structured logs carry correlation ids | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_cover_requests` | signals: metrics cover requests | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_cover_errors` | signals: metrics cover errors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_cover_latency` | signals: metrics cover latency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_cover_saturation` | signals: metrics cover saturation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `traces_or_timings_at_every_edge` | signals: traces, or at least timings, exist at every edge | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `health_signal_emitted` | quality gate: the service emits a health signal | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_rate_signal_emitted` | quality gate: the service emits an error-rate signal | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `latency_signal_emitted` | quality gate: the service emits a latency signal | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dashboards_present` | artifacts: dashboards present the declared signals | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: alert_design_and_runbook_linkage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `alert_set_symptom_based` | alerts: the alert set is symptom-based — user-visible pain, not causes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `alert_thresholds_tuned_to_reality` | alerts: thresholds are tuned to reality | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `alert_noise_controls_present` | alerts: the set is few and actionable, with controls against noise storms | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `alerts_declared` | the declared record names its alerts — the alerts list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_alert_has_owner` | quality gate: every declared alert row names a non-empty owner | Computed over the declared record. Pass: every declared alert row names a non-empty `owner`. Fail: a row declares `owner` present but empty (offending rows are named in `alerts_without_owner`). Missing: the list is absent, or a row has `owner` absent (such a row is missing evidence and does not appear in `alerts_without_owner`). |
| `every_alert_links_runbook` | alerts: every declared alert row links its runbook | Computed over the declared record. Pass: every declared alert row declares `runbook_linked: true`. Fail: a row declares `runbook_linked` present but not `true` (offending rows are named in `alerts_without_runbook_link`). Missing: the list is absent, or a row has `runbook_linked` absent (such a row is missing evidence and does not appear in `alerts_without_runbook_link`). |
| `every_alert_is_actionable` | alerts: every declared alert row is actionable by its owner | Computed over the declared record. Pass: every declared alert row declares `actionable: true`. Fail: a row declares `actionable` present but not `true` (offending rows are named in `alerts_without_actionable`). Missing: the list is absent, or a row has `actionable` absent (such a row is missing evidence and does not appear in `alerts_without_actionable`). |
| `every_alert_is_symptom_based` | alerts: every declared alert row is symptom-based — user-visible pain | Computed over the declared record. Pass: every declared alert row declares `symptom_based: true`. Fail: a row declares `symptom_based` present but not `true` (offending rows are named in `alerts_without_symptom_basis`). Missing: the list is absent, or a row has `symptom_based` absent (such a row is missing evidence and does not appear in `alerts_without_symptom_basis`). |
| `no_alert_name_duplicated` | alerts: no declared alert name is owned by more than one alert row | Computed over the declared record. Pass: no declared `name` string appears on more than one alert row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_alert_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: runbook_content_and_failure_modes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `failure_modes_declared` | the declared record names its failure modes — the failure_modes list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_failure_mode_has_runbook` | runbooks: every declared failure mode has a runbook — one per failure mode | Computed over the declared record. Pass: every declared failure-mode row declares `runbook_present: true`. Fail: a row declares `runbook_present` present but not `true` (offending rows are named in `failure_modes_without_runbook`). Missing: the list is absent, or a row has `runbook_present` absent (such a row is missing evidence and does not appear in `failure_modes_without_runbook`). |
| `every_runbook_describes_symptoms` | runbooks: every declared runbook describes the failure mode's symptoms | Computed over the declared record. Pass: every declared failure-mode row declares `symptoms_described: true`. Fail: a row declares `symptoms_described` present but not `true` (offending rows are named in `failure_modes_without_symptoms`). Missing: the list is absent, or a row has `symptoms_described` absent (such a row is missing evidence and does not appear in `failure_modes_without_symptoms`). |
| `every_runbook_has_check_steps` | runbooks: every declared runbook carries check steps | Computed over the declared record. Pass: every declared failure-mode row declares `check_steps_present: true`. Fail: a row declares `check_steps_present` present but not `true` (offending rows are named in `failure_modes_without_check_steps`). Missing: the list is absent, or a row has `check_steps_present` absent (such a row is missing evidence and does not appear in `failure_modes_without_check_steps`). |
| `every_runbook_has_mitigation` | runbooks: every declared runbook carries a mitigation | Computed over the declared record. Pass: every declared failure-mode row declares `mitigation_present: true`. Fail: a row declares `mitigation_present` present but not `true` (offending rows are named in `failure_modes_without_mitigation`). Missing: the list is absent, or a row has `mitigation_present` absent (such a row is missing evidence and does not appear in `failure_modes_without_mitigation`). |
| `every_runbook_has_escalation` | runbooks: every declared runbook carries an escalation path | Computed over the declared record. Pass: every declared failure-mode row declares `escalation_present: true`. Fail: a row declares `escalation_present` present but not `true` (offending rows are named in `failure_modes_without_escalation`). Missing: the list is absent, or a row has `escalation_present` absent (such a row is missing evidence and does not appear in `failure_modes_without_escalation`). |
| `every_runbook_has_recovery_verification` | runbooks: every declared runbook carries recovery verification | Computed over the declared record. Pass: every declared failure-mode row declares `recovery_verification_present: true`. Fail: a row declares `recovery_verification_present` present but not `true` (offending rows are named in `failure_modes_without_recovery_verification`). Missing: the list is absent, or a row has `recovery_verification_present` absent (such a row is missing evidence and does not appear in `failure_modes_without_recovery_verification`). |
| `no_failure_mode_name_duplicated` | failure modes: no declared failure-mode name is owned by more than one failure-mode row | Computed over the declared record. Pass: no declared `name` string appears on more than one failure-mode row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_failure_mode_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: incident_flow_and_postmortem

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `acknowledge_step_defined` | incident flow: acknowledge is a defined step | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `blast_radius_assessment_step_defined` | incident flow: assessing blast radius is a defined step | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stabilize_step_defined` | incident flow: stabilize is a defined step | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollback_as_first_stabilize_option` | incident flow: rollback is the first stabilize option | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_communication_step_defined` | incident flow: communicating status is a defined step | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fix_step_defined` | incident flow: fix is a defined step, after stabilizing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `blameless_postmortem_required` | incident flow: a blameless postmortem is required after an incident | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `postmortem_actions_tracked_to_closure` | quality gate: postmortem actions are tracked to closure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: backups_silent_failure_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `backup_schedule_declared` | backups: a backup schedule is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `backup_restores_tested` | backups: restores are tested, not just backups scheduled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `restore_tested_at_least_once_per_season` | quality gate: backups are restore-tested at least once per season | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unattended_jobs_have_health_signals` | no silent failure: anything that can fail unattended has a health signal | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `jobs_emit_success_heartbeats` | no silent failure: jobs report success too — heartbeats | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_paging_on_unactionable_causes` | red line: no paging on causes nobody can act on is present in the design | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unowned_alerts` | red line: no unowned alerts are present in the design | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `monitoring_never_disabled_to_hide_problem` | red line: monitoring is never disabled to make a problem disappear | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"observability-and-runbook-design"`), `atom_version` (`"0.1.0"`), and `service_name` (the manifest's declared service name value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `alerts_count` and `failure_modes_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `alerts_without_owner` (alerts whose `owner` is present but empty; an alert with the field absent is missing evidence and does not appear), `alerts_without_runbook_link` (alerts whose `runbook_linked` field is present but not `true`), `alerts_without_actionable` (alerts whose `actionable` field is present but not `true`) and `alerts_without_symptom_basis` (alerts whose `symptom_based` field is present but not `true`), `failure_modes_without_runbook`, `failure_modes_without_symptoms`, `failure_modes_without_check_steps`, `failure_modes_without_mitigation`, `failure_modes_without_escalation` and `failure_modes_without_recovery_verification` (failure modes whose corresponding field is present but not `true`), and the name lists `duplicate_alert_names` and `duplicate_failure_mode_names` (names declared on more than one row of their own list, in the order their second occurrence appears) — all twelve lists are null when their corresponding list is not declared, as recorded in the sparse case; and the ratios `owner_coverage`, `runbook_link_coverage`, `actionable_coverage`, `symptom_based_coverage`, `runbook_coverage`, `symptoms_coverage`, `check_steps_coverage`, `mitigation_coverage`, `escalation_coverage` and `recovery_verification_coverage` (rows satisfying the field ÷ declared rows of the same list) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "43 pass, 0 fail, 0 missing of 43 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared service name value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `OBSERVABILITY_DESIGN_SOUND` — all 43 checks pass: the declared observability and runbook design record is complete and consistent with the bound skill's checklist and red lines.
- `OBSERVABILITY_DESIGN_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the fourteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `alerts_count`, `alerts_without_owner`, `owner_coverage`, `alerts_without_runbook_link`, `runbook_link_coverage`, `alerts_without_actionable`, `actionable_coverage`, `alerts_without_symptom_basis`, `symptom_based_coverage`, `duplicate_alert_names`, `failure_modes_count`, `failure_modes_without_runbook`, `runbook_coverage`, `failure_modes_without_symptoms`, `symptoms_coverage`, `failure_modes_without_check_steps`, `check_steps_coverage`, `failure_modes_without_mitigation`, `mitigation_coverage`, `failure_modes_without_escalation`, `escalation_coverage`, `failure_modes_without_recovery_verification`, `recovery_verification_coverage`, `duplicate_failure_mode_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"signals","detail":"signals must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Make systems observable and operable — logs, metrics, runbooks, alert design, incident response, blameless postmortems (the bound capability, from the skill). You submit one declared record — the observability and runbook design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`signals_and_dashboards`, `alert_design_and_runbook_linkage`, `runbook_content_and_failure_modes`, `incident_flow_and_postmortem`, `backups_silent_failure_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `alerts` list must be present and non-empty, every alert row must name a non-empty `owner`, must declare `runbook_linked: true`, `actionable: true` and `symptom_based: true`, and no declared alert `name` may appear on more than one row, and the declared `failure_modes` list must be present and non-empty, every failure-mode row must declare `runbook_present`, `symptoms_described`, `check_steps_present`, `mitigation_present`, `escalation_present` and `recovery_verification_present` all `true`, and no declared failure-mode `name` may appear on more than one row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `OBSERVABILITY_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `OBSERVABILITY_DESIGN_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a maximum number of alerts behind the skill's "few"; an error-rate, latency or saturation threshold value an alert must fire at; a trace sampling rate or a log volume / retention bar; a dashboard count or refresh interval; a restore-test interval in days beyond the skill's own stated cadence of at least once per season (checked as declared, never converted to days), and any backup retention, RPO or RTO number; an incident acknowledgement or response time in minutes; a postmortem completion or action-closure deadline in days; a heartbeat interval for unattended jobs; a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** observability and runbook design record: a verdict of `OBSERVABILITY_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares correlation-id logs, an owned runbook-linked alert set, and restore-tested backups passes those checks even if the real service has none of it. It is a completeness and consistency audit of the design record the skill requires, **not an SRE service, a monitoring product, or a judgment that the service will stay up**. Specifically: it designs no monitoring stack itself, reads no live logs, metrics or traces, pages no one, runs no restore test, and does not verify that a declared signal, alert, runbook or restore test ever existed in a real system. It never judges whether the named signals are the right signals, whether an alert threshold is well chosen, whether a runbook's steps would actually work, or whether the incident flow would hold under a real outage — only that the record contains what the skill's sections and red lines demand, and that its declared alert and failure-mode rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no judgment of design quality — whether the observability design is good is the caller's declaration, checked only for declared presence and consistency; the content of any dashboard, alert definition, runbook or postmortem is never read — only its declared presence and completeness fields are checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product service launch observability design (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared observability and runbook design record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence in a regulated domain, and SERVICE.md states explicitly that it is not an SRE service, a monitoring product, or a judgment that the service will stay up, that it verifies no live fact, and (U-13 screen) that its output could not read as regulated professional advice. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `observability_and_runbook_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/observability_and_runbook_design.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_observability_and_runbook_design.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/observability-and-runbook-design` (REST) and `POST /mcp/observability-and-runbook-design` (MCP, tool `observability_and_runbook_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `observability_and_runbook_design`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_paging_on_unactionable_causes` (input `red_lines.paging_on_unactionable_causes_present`), `no_unowned_alerts` (input `red_lines.unowned_alerts_present`) and `monitoring_never_disabled_to_hide_problem` (input `red_lines.monitoring_disabled_to_hide_problem_present`), plus the computed checks `alerts_declared`, `every_alert_has_owner`, `every_alert_links_runbook`, `every_alert_is_actionable`, `every_alert_is_symptom_based`, `no_alert_name_duplicated`, `failure_modes_declared`, `every_failure_mode_has_runbook`, `every_runbook_describes_symptoms`, `every_runbook_has_check_steps`, `every_runbook_has_mitigation`, `every_runbook_has_escalation`, `every_runbook_has_recovery_verification` and `no_failure_mode_name_duplicated`, which read the `alerts` / `failure_modes` rows rather than any single input field.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`signals`, `alert_design`, `incident`, `resilience`, `red_lines`) or for a `alerts[]` / `failure_modes[]` row object. The types in the Input reference for those are grounded in the recorded evidence inputs and, for the top-level containers and lists, in the recorded MCP `inputSchema` in evidence.json, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 43 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `alert_design` and `alerts` inputs are read by the single recorded section `alert_design_and_runbook_linkage`, and `resilience` and `red_lines` inputs are read by the single recorded section `backups_silent_failure_and_red_lines`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on undeclared lists:** SERVICE.md's output paragraph states the null rules for `computed_status`, the counts and the coverage ratios, but does not state a null rule for the twelve row-name / duplicate-name lists. The recorded sparse response returns all twelve lists as `null` when their corresponding lists are not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose notes in cases.json:** the `notes` prose in cases.json is abbreviated / generic (for example the full-pass note mentions only three computed spot-check quantities in prose, and the malformed note says “string instead of object/list” generically) and is unscored prose; the structured `computed_spot_checks` and the recorded executions govern. The recorded inputs and expectations in cases.json otherwise match evidence.json exactly, as verified for this document.

## Worked examples

Provenance: recorded 2026-11-16T08:32:18.120211+00:00 against gateway v1.1.0, external verification lane, source `verification/work/observability-and-runbook-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:32:18.120211+00:00 · gateway v1.1.0 · source `verification/work/observability-and-runbook-design/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "signals_and_dashboards",
      "check": "structured_logs_with_correlation_ids",
      "status": "pass",
      "evidence": "signals: structured logs carry correlation ids"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_requests",
      "status": "pass",
      "evidence": "signals: metrics cover requests"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_errors",
      "status": "pass",
      "evidence": "signals: metrics cover errors"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_latency",
      "status": "pass",
      "evidence": "signals: metrics cover latency"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_saturation",
      "status": "pass",
      "evidence": "signals: metrics cover saturation"
    },
    {
      "section": "signals_and_dashboards",
      "check": "traces_or_timings_at_every_edge",
      "status": "pass",
      "evidence": "signals: traces, or at least timings, exist at every edge"
    },
    {
      "section": "signals_and_dashboards",
      "check": "health_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits a health signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "error_rate_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits an error-rate signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "latency_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits a latency signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "dashboards_present",
      "status": "pass",
      "evidence": "artifacts: dashboards present the declared signals"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_set_symptom_based",
      "status": "pass",
      "evidence": "alerts: the alert set is symptom-based — user-visible pain, not causes"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_thresholds_tuned_to_reality",
      "status": "pass",
      "evidence": "alerts: thresholds are tuned to reality"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_noise_controls_present",
      "status": "pass",
      "evidence": "alerts: the set is few and actionable, with controls against noise storms"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alerts_declared",
      "status": "pass",
      "evidence": "the declared record names its alerts — the alerts list is present and non-empty"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_has_owner",
      "status": "pass",
      "evidence": "quality gate: every declared alert row names a non-empty owner"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_links_runbook",
      "status": "pass",
      "evidence": "alerts: every declared alert row links its runbook"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_is_actionable",
      "status": "pass",
      "evidence": "alerts: every declared alert row is actionable by its owner"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_is_symptom_based",
      "status": "pass",
      "evidence": "alerts: every declared alert row is symptom-based — user-visible pain"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "no_alert_name_duplicated",
      "status": "pass",
      "evidence": "alerts: no declared alert name is owned by more than one alert row"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "failure_modes_declared",
      "status": "pass",
      "evidence": "the declared record names its failure modes — the failure_modes list is present and non-empty"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_failure_mode_has_runbook",
      "status": "pass",
      "evidence": "runbooks: every declared failure mode has a runbook — one per failure mode"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_describes_symptoms",
      "status": "pass",
      "evidence": "runbooks: every declared runbook describes the failure mode's symptoms"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_check_steps",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries check steps"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_mitigation",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries a mitigation"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_escalation",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries an escalation path"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_recovery_verification",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries recovery verification"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "no_failure_mode_name_duplicated",
      "status": "pass",
      "evidence": "failure modes: no declared failure-mode name is owned by more than one failure-mode row"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "acknowledge_step_defined",
      "status": "pass",
      "evidence": "incident flow: acknowledge is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "blast_radius_assessment_step_defined",
      "status": "pass",
      "evidence": "incident flow: assessing blast radius is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "stabilize_step_defined",
      "status": "pass",
      "evidence": "incident flow: stabilize is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "rollback_as_first_stabilize_option",
      "status": "pass",
      "evidence": "incident flow: rollback is the first stabilize option"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "status_communication_step_defined",
      "status": "pass",
      "evidence": "incident flow: communicating status is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "fix_step_defined",
      "status": "pass",
      "evidence": "incident flow: fix is a defined step, after stabilizing"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "blameless_postmortem_required",
      "status": "pass",
      "evidence": "incident flow: a blameless postmortem is required after an incident"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "postmortem_actions_tracked_to_closure",
      "status": "pass",
      "evidence": "quality gate: postmortem actions are tracked to closure"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "backup_schedule_declared",
      "status": "pass",
      "evidence": "backups: a backup schedule is declared"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "backup_restores_tested",
      "status": "pass",
      "evidence": "backups: restores are tested, not just backups scheduled"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "restore_tested_at_least_once_per_season",
      "status": "pass",
      "evidence": "quality gate: backups are restore-tested at least once per season"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "unattended_jobs_have_health_signals",
      "status": "pass",
      "evidence": "no silent failure: anything that can fail unattended has a health signal"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "jobs_emit_success_heartbeats",
      "status": "pass",
      "evidence": "no silent failure: jobs report success too — heartbeats"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "no_paging_on_unactionable_causes",
      "status": "pass",
      "evidence": "red line: no paging on causes nobody can act on is present in the design"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "no_unowned_alerts",
      "status": "pass",
      "evidence": "red line: no unowned alerts are present in the design"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "monitoring_never_disabled_to_hide_problem",
      "status": "pass",
      "evidence": "red line: monitoring is never disabled to make a problem disappear"
    }
  ],
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
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections.",
  "stamp": "OBSERVABILITY AND RUNBOOK DESIGN\nservice_name: auth-service\nVERDICT: OBSERVABILITY_DESIGN_SOUND\n  signals_and_dashboards                       pass\n  alert_design_and_runbook_linkage             pass\n  runbook_content_and_failure_modes            pass\n  incident_flow_and_postmortem                 pass\n  backups_silent_failure_and_red_lines         pass\n43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:32:18.120211+00:00 · gateway v1.1.0 · source `verification/work/observability-and-runbook-design/evidence.json`.

Input:

```json
{
  "service_name": "auth-service",
  "signals": {
    "structured_logs_with_correlation_ids": true,
    "metrics_cover_requests": true,
    "metrics_cover_errors": false,
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
      "owner": "",
      "runbook_linked": false,
      "actionable": true,
      "symptom_based": false
    }
  ],
  "failure_modes": [
    {
      "name": "db-connection-timeout",
      "runbook_present": true,
      "symptoms_described": true,
      "check_steps_present": false,
      "mitigation_present": true,
      "escalation_present": true,
      "recovery_verification_present": false
    }
  ],
  "incident": {
    "acknowledge_step_defined": true,
    "blast_radius_assessment_step_defined": true,
    "stabilize_step_defined": true,
    "rollback_as_first_stabilize_option": true,
    "status_communication_step_defined": true,
    "fix_step_defined": true,
    "blameless_postmortem_required": false,
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
    "unowned_alerts_present": true,
    "monitoring_disabled_to_hide_problem_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "observability-and-runbook-design",
  "atom_version": "0.1.0",
  "service_name": "auth-service",
  "verdict": "OBSERVABILITY_DESIGN_NOT_SOUND",
  "sections": {
    "signals_and_dashboards": "fail",
    "alert_design_and_runbook_linkage": "fail",
    "runbook_content_and_failure_modes": "fail",
    "incident_flow_and_postmortem": "fail",
    "backups_silent_failure_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "signals_and_dashboards",
      "check": "structured_logs_with_correlation_ids",
      "status": "pass",
      "evidence": "signals: structured logs carry correlation ids"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_requests",
      "status": "pass",
      "evidence": "signals: metrics cover requests"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_errors",
      "status": "fail",
      "evidence": "signals: metrics cover errors"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_latency",
      "status": "pass",
      "evidence": "signals: metrics cover latency"
    },
    {
      "section": "signals_and_dashboards",
      "check": "metrics_cover_saturation",
      "status": "pass",
      "evidence": "signals: metrics cover saturation"
    },
    {
      "section": "signals_and_dashboards",
      "check": "traces_or_timings_at_every_edge",
      "status": "pass",
      "evidence": "signals: traces, or at least timings, exist at every edge"
    },
    {
      "section": "signals_and_dashboards",
      "check": "health_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits a health signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "error_rate_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits an error-rate signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "latency_signal_emitted",
      "status": "pass",
      "evidence": "quality gate: the service emits a latency signal"
    },
    {
      "section": "signals_and_dashboards",
      "check": "dashboards_present",
      "status": "pass",
      "evidence": "artifacts: dashboards present the declared signals"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_set_symptom_based",
      "status": "pass",
      "evidence": "alerts: the alert set is symptom-based — user-visible pain, not causes"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_thresholds_tuned_to_reality",
      "status": "pass",
      "evidence": "alerts: thresholds are tuned to reality"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alert_noise_controls_present",
      "status": "pass",
      "evidence": "alerts: the set is few and actionable, with controls against noise storms"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "alerts_declared",
      "status": "pass",
      "evidence": "the declared record names its alerts — the alerts list is present and non-empty"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_has_owner",
      "status": "fail",
      "evidence": "quality gate: every declared alert row names a non-empty owner"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_links_runbook",
      "status": "fail",
      "evidence": "alerts: every declared alert row links its runbook"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_is_actionable",
      "status": "pass",
      "evidence": "alerts: every declared alert row is actionable by its owner"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "every_alert_is_symptom_based",
      "status": "fail",
      "evidence": "alerts: every declared alert row is symptom-based — user-visible pain"
    },
    {
      "section": "alert_design_and_runbook_linkage",
      "check": "no_alert_name_duplicated",
      "status": "pass",
      "evidence": "alerts: no declared alert name is owned by more than one alert row"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "failure_modes_declared",
      "status": "pass",
      "evidence": "the declared record names its failure modes — the failure_modes list is present and non-empty"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_failure_mode_has_runbook",
      "status": "pass",
      "evidence": "runbooks: every declared failure mode has a runbook — one per failure mode"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_describes_symptoms",
      "status": "pass",
      "evidence": "runbooks: every declared runbook describes the failure mode's symptoms"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_check_steps",
      "status": "fail",
      "evidence": "runbooks: every declared runbook carries check steps"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_mitigation",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries a mitigation"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_escalation",
      "status": "pass",
      "evidence": "runbooks: every declared runbook carries an escalation path"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "every_runbook_has_recovery_verification",
      "status": "fail",
      "evidence": "runbooks: every declared runbook carries recovery verification"
    },
    {
      "section": "runbook_content_and_failure_modes",
      "check": "no_failure_mode_name_duplicated",
      "status": "pass",
      "evidence": "failure modes: no declared failure-mode name is owned by more than one failure-mode row"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "acknowledge_step_defined",
      "status": "pass",
      "evidence": "incident flow: acknowledge is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "blast_radius_assessment_step_defined",
      "status": "pass",
      "evidence": "incident flow: assessing blast radius is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "stabilize_step_defined",
      "status": "pass",
      "evidence": "incident flow: stabilize is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "rollback_as_first_stabilize_option",
      "status": "pass",
      "evidence": "incident flow: rollback is the first stabilize option"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "status_communication_step_defined",
      "status": "pass",
      "evidence": "incident flow: communicating status is a defined step"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "fix_step_defined",
      "status": "pass",
      "evidence": "incident flow: fix is a defined step, after stabilizing"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "blameless_postmortem_required",
      "status": "fail",
      "evidence": "incident flow: a blameless postmortem is required after an incident"
    },
    {
      "section": "incident_flow_and_postmortem",
      "check": "postmortem_actions_tracked_to_closure",
      "status": "pass",
      "evidence": "quality gate: postmortem actions are tracked to closure"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "backup_schedule_declared",
      "status": "pass",
      "evidence": "backups: a backup schedule is declared"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "backup_restores_tested",
      "status": "pass",
      "evidence": "backups: restores are tested, not just backups scheduled"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "restore_tested_at_least_once_per_season",
      "status": "pass",
      "evidence": "quality gate: backups are restore-tested at least once per season"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "unattended_jobs_have_health_signals",
      "status": "pass",
      "evidence": "no silent failure: anything that can fail unattended has a health signal"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "jobs_emit_success_heartbeats",
      "status": "pass",
      "evidence": "no silent failure: jobs report success too — heartbeats"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "no_paging_on_unactionable_causes",
      "status": "pass",
      "evidence": "red line: no paging on causes nobody can act on is present in the design"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "no_unowned_alerts",
      "status": "fail",
      "evidence": "red line: no unowned alerts are present in the design"
    },
    {
      "section": "backups_silent_failure_and_red_lines",
      "check": "monitoring_never_disabled_to_hide_problem",
      "status": "pass",
      "evidence": "red line: monitoring is never disabled to make a problem disappear"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "alerts_count": 1,
  "alerts_without_owner": [
    "high-error-rate"
  ],
  "owner_coverage": "0.000000",
  "alerts_without_runbook_link": [
    "high-error-rate"
  ],
  "runbook_link_coverage": "0.000000",
  "alerts_without_actionable": [],
  "actionable_coverage": "1.000000",
  "alerts_without_symptom_basis": [
    "high-error-rate"
  ],
  "symptom_based_coverage": "0.000000",
  "duplicate_alert_names": [],
  "failure_modes_count": 1,
  "failure_modes_without_runbook": [],
  "runbook_coverage": "1.000000",
  "failure_modes_without_symptoms": [],
  "symptoms_coverage": "1.000000",
  "failure_modes_without_check_steps": [
    "db-connection-timeout"
  ],
  "check_steps_coverage": "0.000000",
  "failure_modes_without_mitigation": [],
  "mitigation_coverage": "1.000000",
  "failure_modes_without_escalation": [],
  "escalation_coverage": "1.000000",
  "failure_modes_without_recovery_verification": [
    "db-connection-timeout"
  ],
  "recovery_verification_coverage": "0.000000",
  "duplicate_failure_mode_names": [],
  "summary": "35 pass, 8 fail, 0 missing of 43 checks across five sections.",
  "stamp": "OBSERVABILITY AND RUNBOOK DESIGN\nservice_name: auth-service\nVERDICT: OBSERVABILITY_DESIGN_NOT_SOUND\n  signals_and_dashboards                       fail\n  alert_design_and_runbook_linkage             fail\n  runbook_content_and_failure_modes            fail\n  incident_flow_and_postmortem                 fail\n  backups_silent_failure_and_red_lines         fail\n35 pass, 8 fail, 0 missing of 43 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:32:18.120211+00:00 · gateway v1.1.0 · source `verification/work/observability-and-runbook-design/evidence.json`.

Input:

```json
{
  "service_name": "bad-types",
  "signals": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "signals",
  "detail": "signals must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared observability and runbook design record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence in a regulated domain, not an SRE service, a monitoring product or a judgment that a service will stay up, and it verifies no live fact. |
| Checks named | 43 documented / 43 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`alerts_count` and `failure_modes_count`, the twelve row-name / duplicate-name lists, the ten coverage ratios and `computed_status`) |
| Input reference typed | Yes — 51 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/observability-and-runbook-design/evidence.json` |
