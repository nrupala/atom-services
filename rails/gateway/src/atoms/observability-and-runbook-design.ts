// Observability and runbook design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/observability-and-runbook-design/src/observability_and_runbook_design.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  service_name: "string",
  signals: {
    structured_logs_with_correlation_ids: "boolean",
    metrics_cover_requests: "boolean",
    metrics_cover_errors: "boolean",
    metrics_cover_latency: "boolean",
    metrics_cover_saturation: "boolean",
    traces_or_timings_at_every_edge: "boolean",
    health_signal_emitted: "boolean",
    error_rate_signal_emitted: "boolean",
    latency_signal_emitted: "boolean",
    dashboards_present: "boolean",
  },
  alert_design: {
    alert_set_symptom_based: "boolean",
    alert_thresholds_tuned_to_reality: "boolean",
    alert_noise_controls_present: "boolean",
  },
  alerts: [{
    name: "string",
    owner: "string",
    runbook_linked: "boolean",
    actionable: "boolean",
    symptom_based: "boolean",
  }],
  failure_modes: [{
    name: "string",
    runbook_present: "boolean",
    symptoms_described: "boolean",
    check_steps_present: "boolean",
    mitigation_present: "boolean",
    escalation_present: "boolean",
    recovery_verification_present: "boolean",
  }],
  incident: {
    acknowledge_step_defined: "boolean",
    blast_radius_assessment_step_defined: "boolean",
    stabilize_step_defined: "boolean",
    rollback_as_first_stabilize_option: "boolean",
    status_communication_step_defined: "boolean",
    fix_step_defined: "boolean",
    blameless_postmortem_required: "boolean",
    postmortem_actions_tracked_to_closure: "boolean",
  },
  resilience: {
    backup_schedule_declared: "boolean",
    backup_restores_tested: "boolean",
    restore_tested_at_least_once_per_season: "boolean",
    unattended_jobs_have_health_signals: "boolean",
    jobs_emit_success_heartbeats: "boolean",
  },
  red_lines: {
    paging_on_unactionable_causes_present: "boolean",
    unowned_alerts_present: "boolean",
    monitoring_disabled_to_hide_problem_present: "boolean",
  },
};

const FAILURE_MODE_BOOL_FIELDS = [
  "runbook_present",
  "symptoms_described",
  "check_steps_present",
  "mitigation_present",
  "escalation_present",
  "recovery_verification_present",
] as const;

export const SECTIONS = [
  "signals_and_dashboards",
  "alert_design_and_runbook_linkage",
  "runbook_content_and_failure_modes",
  "incident_flow_and_postmortem",
  "backups_silent_failure_and_red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  service_name: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  alerts_count: number | null;
  alerts_without_owner: string[] | null;
  owner_coverage: string | null;
  alerts_without_runbook_link: string[] | null;
  runbook_link_coverage: string | null;
  alerts_without_actionable: string[] | null;
  actionable_coverage: string | null;
  alerts_without_symptom_basis: string[] | null;
  symptom_based_coverage: string | null;
  duplicate_alert_names: string[] | null;
  failure_modes_count: number | null;
  failure_modes_without_runbook: string[] | null;
  runbook_coverage: string | null;
  failure_modes_without_symptoms: string[] | null;
  symptoms_coverage: string | null;
  failure_modes_without_check_steps: string[] | null;
  check_steps_coverage: string | null;
  failure_modes_without_mitigation: string[] | null;
  mitigation_coverage: string | null;
  failure_modes_without_escalation: string[] | null;
  escalation_coverage: string | null;
  failure_modes_without_recovery_verification: string[] | null;
  recovery_verification_coverage: string | null;
  duplicate_failure_mode_names: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function withoutBool(
  rows: unknown[],
  isList: boolean,
  field: string,
): string[] | null {
  if (!isList) return null;
  return rows
    .filter((c) => hasField(c, field) &&
      (c as Record<string, unknown>)[field] !== true)
    .map(rowName);
}

function withoutOwner(
  rows: unknown[],
  isList: boolean,
): string[] | null {
  if (!isList) return null;
  return rows
    .filter((c) => hasField(c, "owner") &&
      !(typeof (c as Record<string, unknown>)["owner"] === "string" &&
        (c as Record<string, unknown>)["owner"] !== ""))
    .map(rowName);
}

function coverageBool(
  rows: unknown[],
  isList: boolean,
  count: number | null,
  field: string,
): number | null {
  if (!(isList && count)) return null;
  return rows.filter((c) => isPyDict(c) && c[field] === true).length / count;
}

function ownerCoverage(
  rows: unknown[],
  isList: boolean,
  count: number | null,
): number | null {
  if (!(isList && count)) return null;
  return rows.filter((c) => isPyDict(c) &&
    typeof c["owner"] === "string" && c["owner"] !== "").length / count;
}

function duplicates(
  rows: unknown[],
  isList: boolean,
): string[] | null {
  if (!isList) return null;
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c["name"] === "string") {
      const nm = c["name"] as string;
      if (seen.includes(nm) && !dups.includes(nm)) {
        dups.push(nm);
      }
      seen.push(nm);
    }
  }
  return dups;
}

function rowBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  rowsRaw: unknown,
  isList: boolean,
  rows: unknown[],
  count: number | null,
  field: string,
  evidence: string,
): void {
  const present = isList && rows.every((c) => hasField(c, field));
  check(results, section, name, rowsRaw, present,
    isList && (count as number) > 0 &&
      rows.every((c) => isPyDict(c) && c[field] === true),
    evidence);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [alertsRaw, hasAlerts] = getPath(manifest, "alerts");
  const alertsIsList = hasAlerts && Array.isArray(alertsRaw);
  const alertRows: unknown[] = alertsIsList ? (alertsRaw as unknown[]) : [];
  const alertsCount: number | null = alertsIsList ? alertRows.length : null;

  const [fmRaw, hasFm] = getPath(manifest, "failure_modes");
  const fmIsList = hasFm && Array.isArray(fmRaw);
  const fmRows: unknown[] = fmIsList ? (fmRaw as unknown[]) : [];
  const fmCount: number | null = fmIsList ? fmRows.length : null;

  const alertsWithoutOwner = withoutOwner(alertRows, alertsIsList);
  const alertsWithoutRunbookLink = withoutBool(
    alertRows, alertsIsList, "runbook_linked");
  const alertsWithoutActionable = withoutBool(
    alertRows, alertsIsList, "actionable");
  const alertsWithoutSymptomBasis = withoutBool(
    alertRows, alertsIsList, "symptom_based");
  const duplicateAlertNames = duplicates(alertRows, alertsIsList);
  const ownerCov = ownerCoverage(alertRows, alertsIsList, alertsCount);
  const runbookLinkCov = coverageBool(
    alertRows, alertsIsList, alertsCount, "runbook_linked");
  const actionableCov = coverageBool(
    alertRows, alertsIsList, alertsCount, "actionable");
  const symptomBasedCov = coverageBool(
    alertRows, alertsIsList, alertsCount, "symptom_based");

  const fmWithout: Record<string, string[] | null> = {};
  const fmCov: Record<string, number | null> = {};
  for (const field of FAILURE_MODE_BOOL_FIELDS) {
    fmWithout[field] = withoutBool(fmRows, fmIsList, field);
    fmCov[field] = coverageBool(fmRows, fmIsList, fmCount, field);
  }
  const duplicateFailureModeNames = duplicates(fmRows, fmIsList);

  // ---- Section 1: signals_and_dashboards ----
  boolCheck(results, "signals_and_dashboards",
    "structured_logs_with_correlation_ids", manifest,
    ["signals", "structured_logs_with_correlation_ids"],
    "signals: structured logs carry correlation ids");
  boolCheck(results, "signals_and_dashboards",
    "metrics_cover_requests", manifest,
    ["signals", "metrics_cover_requests"],
    "signals: metrics cover requests");
  boolCheck(results, "signals_and_dashboards",
    "metrics_cover_errors", manifest,
    ["signals", "metrics_cover_errors"],
    "signals: metrics cover errors");
  boolCheck(results, "signals_and_dashboards",
    "metrics_cover_latency", manifest,
    ["signals", "metrics_cover_latency"],
    "signals: metrics cover latency");
  boolCheck(results, "signals_and_dashboards",
    "metrics_cover_saturation", manifest,
    ["signals", "metrics_cover_saturation"],
    "signals: metrics cover saturation");
  boolCheck(results, "signals_and_dashboards",
    "traces_or_timings_at_every_edge", manifest,
    ["signals", "traces_or_timings_at_every_edge"],
    "signals: traces, or at least timings, exist at every edge");
  boolCheck(results, "signals_and_dashboards",
    "health_signal_emitted", manifest,
    ["signals", "health_signal_emitted"],
    "quality gate: the service emits a health signal");
  boolCheck(results, "signals_and_dashboards",
    "error_rate_signal_emitted", manifest,
    ["signals", "error_rate_signal_emitted"],
    "quality gate: the service emits an error-rate signal");
  boolCheck(results, "signals_and_dashboards",
    "latency_signal_emitted", manifest,
    ["signals", "latency_signal_emitted"],
    "quality gate: the service emits a latency signal");
  boolCheck(results, "signals_and_dashboards",
    "dashboards_present", manifest,
    ["signals", "dashboards_present"],
    "artifacts: dashboards present the declared signals");

  // ---- Section 2: alert_design_and_runbook_linkage ----
  boolCheck(results, "alert_design_and_runbook_linkage",
    "alert_set_symptom_based", manifest,
    ["alert_design", "alert_set_symptom_based"],
    "alerts: the alert set is symptom-based — user-visible pain, not causes");
  boolCheck(results, "alert_design_and_runbook_linkage",
    "alert_thresholds_tuned_to_reality", manifest,
    ["alert_design", "alert_thresholds_tuned_to_reality"],
    "alerts: thresholds are tuned to reality");
  boolCheck(results, "alert_design_and_runbook_linkage",
    "alert_noise_controls_present", manifest,
    ["alert_design", "alert_noise_controls_present"],
    "alerts: the set is few and actionable, with controls against noise storms");
  check(results, "alert_design_and_runbook_linkage",
    "alerts_declared", alertsRaw, alertsIsList,
    alertsIsList && (alertsCount as number) > 0,
    "the declared record names its alerts — the alerts list is present and non-empty");
  const ownerPresent = alertsIsList &&
    alertRows.every((c) => hasField(c, "owner"));
  check(results, "alert_design_and_runbook_linkage",
    "every_alert_has_owner", alertsRaw, ownerPresent,
    alertsIsList && (alertsCount as number) > 0 &&
      alertRows.every((c) => isPyDict(c) &&
        typeof c["owner"] === "string" && c["owner"] !== ""),
    "quality gate: every declared alert row names a non-empty owner");
  rowBoolCheck(results, "alert_design_and_runbook_linkage",
    "every_alert_links_runbook", alertsRaw, alertsIsList, alertRows,
    alertsCount, "runbook_linked",
    "alerts: every declared alert row links its runbook");
  rowBoolCheck(results, "alert_design_and_runbook_linkage",
    "every_alert_is_actionable", alertsRaw, alertsIsList, alertRows,
    alertsCount, "actionable",
    "alerts: every declared alert row is actionable by its owner");
  rowBoolCheck(results, "alert_design_and_runbook_linkage",
    "every_alert_is_symptom_based", alertsRaw, alertsIsList, alertRows,
    alertsCount, "symptom_based",
    "alerts: every declared alert row is symptom-based — user-visible pain");
  const alertNamePresent = alertsIsList &&
    alertRows.every((c) => hasField(c, "name"));
  check(results, "alert_design_and_runbook_linkage",
    "no_alert_name_duplicated", alertsRaw, alertNamePresent,
    alertsIsList && duplicateAlertNames !== null &&
      duplicateAlertNames.length === 0,
    "alerts: no declared alert name is owned by more than one alert row");

  // ---- Section 3: runbook_content_and_failure_modes ----
  check(results, "runbook_content_and_failure_modes",
    "failure_modes_declared", fmRaw, fmIsList,
    fmIsList && (fmCount as number) > 0,
    "the declared record names its failure modes — the failure_modes list is present and non-empty");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_failure_mode_has_runbook", fmRaw, fmIsList, fmRows,
    fmCount, "runbook_present",
    "runbooks: every declared failure mode has a runbook — one per failure mode");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_runbook_describes_symptoms", fmRaw, fmIsList, fmRows,
    fmCount, "symptoms_described",
    "runbooks: every declared runbook describes the failure mode's symptoms");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_runbook_has_check_steps", fmRaw, fmIsList, fmRows,
    fmCount, "check_steps_present",
    "runbooks: every declared runbook carries check steps");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_runbook_has_mitigation", fmRaw, fmIsList, fmRows,
    fmCount, "mitigation_present",
    "runbooks: every declared runbook carries a mitigation");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_runbook_has_escalation", fmRaw, fmIsList, fmRows,
    fmCount, "escalation_present",
    "runbooks: every declared runbook carries an escalation path");
  rowBoolCheck(results, "runbook_content_and_failure_modes",
    "every_runbook_has_recovery_verification", fmRaw, fmIsList, fmRows,
    fmCount, "recovery_verification_present",
    "runbooks: every declared runbook carries recovery verification");
  const fmNamePresent = fmIsList &&
    fmRows.every((c) => hasField(c, "name"));
  check(results, "runbook_content_and_failure_modes",
    "no_failure_mode_name_duplicated", fmRaw, fmNamePresent,
    fmIsList && duplicateFailureModeNames !== null &&
      duplicateFailureModeNames.length === 0,
    "failure modes: no declared failure-mode name is owned by more than one failure-mode row");

  // ---- Section 4: incident_flow_and_postmortem ----
  boolCheck(results, "incident_flow_and_postmortem",
    "acknowledge_step_defined", manifest,
    ["incident", "acknowledge_step_defined"],
    "incident flow: acknowledge is a defined step");
  boolCheck(results, "incident_flow_and_postmortem",
    "blast_radius_assessment_step_defined", manifest,
    ["incident", "blast_radius_assessment_step_defined"],
    "incident flow: assessing blast radius is a defined step");
  boolCheck(results, "incident_flow_and_postmortem",
    "stabilize_step_defined", manifest,
    ["incident", "stabilize_step_defined"],
    "incident flow: stabilize is a defined step");
  boolCheck(results, "incident_flow_and_postmortem",
    "rollback_as_first_stabilize_option", manifest,
    ["incident", "rollback_as_first_stabilize_option"],
    "incident flow: rollback is the first stabilize option");
  boolCheck(results, "incident_flow_and_postmortem",
    "status_communication_step_defined", manifest,
    ["incident", "status_communication_step_defined"],
    "incident flow: communicating status is a defined step");
  boolCheck(results, "incident_flow_and_postmortem",
    "fix_step_defined", manifest,
    ["incident", "fix_step_defined"],
    "incident flow: fix is a defined step, after stabilizing");
  boolCheck(results, "incident_flow_and_postmortem",
    "blameless_postmortem_required", manifest,
    ["incident", "blameless_postmortem_required"],
    "incident flow: a blameless postmortem is required after an incident");
  boolCheck(results, "incident_flow_and_postmortem",
    "postmortem_actions_tracked_to_closure", manifest,
    ["incident", "postmortem_actions_tracked_to_closure"],
    "quality gate: postmortem actions are tracked to closure");

  // ---- Section 5: backups_silent_failure_and_red_lines ----
  boolCheck(results, "backups_silent_failure_and_red_lines",
    "backup_schedule_declared", manifest,
    ["resilience", "backup_schedule_declared"],
    "backups: a backup schedule is declared");
  boolCheck(results, "backups_silent_failure_and_red_lines",
    "backup_restores_tested", manifest,
    ["resilience", "backup_restores_tested"],
    "backups: restores are tested, not just backups scheduled");
  boolCheck(results, "backups_silent_failure_and_red_lines",
    "restore_tested_at_least_once_per_season", manifest,
    ["resilience", "restore_tested_at_least_once_per_season"],
    "quality gate: backups are restore-tested at least once per season");
  boolCheck(results, "backups_silent_failure_and_red_lines",
    "unattended_jobs_have_health_signals", manifest,
    ["resilience", "unattended_jobs_have_health_signals"],
    "no silent failure: anything that can fail unattended has a health signal");
  boolCheck(results, "backups_silent_failure_and_red_lines",
    "jobs_emit_success_heartbeats", manifest,
    ["resilience", "jobs_emit_success_heartbeats"],
    "no silent failure: jobs report success too — heartbeats");
  falseCheck(results, "backups_silent_failure_and_red_lines",
    "no_paging_on_unactionable_causes", manifest,
    ["red_lines", "paging_on_unactionable_causes_present"],
    "red line: no paging on causes nobody can act on is present in the design");
  falseCheck(results, "backups_silent_failure_and_red_lines",
    "no_unowned_alerts", manifest,
    ["red_lines", "unowned_alerts_present"],
    "red line: no unowned alerts are present in the design");
  falseCheck(results, "backups_silent_failure_and_red_lines",
    "monitoring_never_disabled_to_hide_problem", manifest,
    ["red_lines", "monitoring_disabled_to_hide_problem_present"],
    "red line: monitoring is never disabled to make a problem disappear");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "OBSERVABILITY_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "OBSERVABILITY_DESIGN_SOUND";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "observability-and-runbook-design",
    atom_version: "0.1.0",
    service_name: manifest["service_name"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    alerts_count: alertsCount,
    alerts_without_owner: alertsWithoutOwner,
    owner_coverage: fmt6(ownerCov),
    alerts_without_runbook_link: alertsWithoutRunbookLink,
    runbook_link_coverage: fmt6(runbookLinkCov),
    alerts_without_actionable: alertsWithoutActionable,
    actionable_coverage: fmt6(actionableCov),
    alerts_without_symptom_basis: alertsWithoutSymptomBasis,
    symptom_based_coverage: fmt6(symptomBasedCov),
    duplicate_alert_names: duplicateAlertNames,
    failure_modes_count: fmCount,
    failure_modes_without_runbook: fmWithout["runbook_present"],
    runbook_coverage: fmt6(fmCov["runbook_present"]),
    failure_modes_without_symptoms: fmWithout["symptoms_described"],
    symptoms_coverage: fmt6(fmCov["symptoms_described"]),
    failure_modes_without_check_steps: fmWithout["check_steps_present"],
    check_steps_coverage: fmt6(fmCov["check_steps_present"]),
    failure_modes_without_mitigation: fmWithout["mitigation_present"],
    mitigation_coverage: fmt6(fmCov["mitigation_present"]),
    failure_modes_without_escalation: fmWithout["escalation_present"],
    escalation_coverage: fmt6(fmCov["escalation_present"]),
    failure_modes_without_recovery_verification:
      fmWithout["recovery_verification_present"],
    recovery_verification_coverage:
      fmt6(fmCov["recovery_verification_present"]),
    duplicate_failure_mode_names: duplicateFailureModeNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "OBSERVABILITY AND RUNBOOK DESIGN",
    `service_name: ${pyStr(verdict.service_name ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
