// Predictive maintenance failure risk assessment — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/predictive-maintenance-failure-risk-assessment/src/
// predictive_maintenance_failure_risk_assessment.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  asset: "string",
  strategy: {
    asset_criticality_assessed: "boolean",
    failure_cost_assessed: "boolean",
    matched_to_criticality_and_failure_cost: "boolean",
    pdm_justified_for_asset: "boolean",
  },
  pf_curve: {
    detectable_point_identified: "boolean",
    detection_early_in_window: "boolean",
    planning_runway_sufficient: "boolean",
  },
  monitoring: {
    techniques_matched_to_failure_modes: "boolean",
    sensor_coverage_covers_failure_modes: "boolean",
    operating_parameters_monitored: "boolean",
  },
  prediction: {
    healthy_baseline_established: "boolean",
    anomaly_detection_or_rul_in_place: "boolean",
    fault_labels_available_or_imbalance_handled: "boolean",
    uncertainty_reported: "boolean",
    thresholds_tuned_to_missed_failure_vs_false_alarm_cost: "boolean",
  },
  reliability: {
    fmea_completed: "boolean",
    prioritised_by_severity_occurrence_detectability: "boolean",
    rcm_strategy_per_failure_mode: "boolean",
    mtbf_mttr_tracked: "boolean",
    fmea_and_engineering_judgement_not_replaced: "boolean",
  },
  integration: {
    sensor_quality_and_calibration_verified: "boolean",
    leakage_label_scarcity_and_drift_watched: "boolean",
    edge_vs_cloud_inference_decided: "boolean",
    work_orders_closed_into_cmms: "boolean",
  },
};

export const SECTIONS = [
  "strategy_fit",
  "pf_window",
  "condition_monitoring",
  "prediction",
  "reliability_frame",
  "data_and_integration",
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
  asset: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: strategy_fit (the maintenance-strategy ladder) ----
  boolCheck(results, "strategy_fit", "asset_criticality_assessed", manifest,
    ["strategy", "asset_criticality_assessed"],
    "match strategy to asset criticality and failure cost — not everything deserves PdM");
  boolCheck(results, "strategy_fit", "failure_cost_assessed", manifest,
    ["strategy", "failure_cost_assessed"],
    "the cost of failure is assessed before a strategy is chosen");
  boolCheck(results, "strategy_fit", "strategy_matched_to_criticality_and_failure_cost", manifest,
    ["strategy", "matched_to_criticality_and_failure_cost"],
    "reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets");
  boolCheck(results, "strategy_fit", "pdm_justified_for_this_asset", manifest,
    ["strategy", "pdm_justified_for_asset"],
    "PdM on assets that don't justify it is refused");

  // ---- Section 2: pf_window (the P-F curve) ----
  boolCheck(results, "pf_window", "detectable_point_identified", manifest,
    ["pf_curve", "detectable_point_identified"],
    "between the point a failure becomes detectable (P) and functional failure (F) lies a window — P is identified");
  boolCheck(results, "pf_window", "detection_early_in_window", manifest,
    ["pf_curve", "detection_early_in_window"],
    "PdM detects early in that window and acts before F");
  boolCheck(results, "pf_window", "planning_runway_sufficient", manifest,
    ["pf_curve", "planning_runway_sufficient"],
    "earlier, more reliable detection = longer planning runway");

  // ---- Section 3: condition_monitoring (what to sense) ----
  boolCheck(results, "condition_monitoring", "techniques_matched_to_failure_modes", manifest,
    ["monitoring", "techniques_matched_to_failure_modes"],
    "techniques are matched to the failure modes — vibration analysis, thermography, MCSA / electrical signature, oil analysis / DGA, acoustic / ultrasonic, operating parameters");
  boolCheck(results, "condition_monitoring", "sensor_coverage_covers_failure_modes", manifest,
    ["monitoring", "sensor_coverage_covers_failure_modes"],
    "the sensing in place covers the failure modes that matter for this asset");
  boolCheck(results, "condition_monitoring", "operating_parameters_monitored", manifest,
    ["monitoring", "operating_parameters_monitored"],
    "operating parameters — load, pressure, temperature, electrical params via SCADA/IoT — are monitored");

  // ---- Section 4: prediction (the AI layer) ----
  boolCheck(results, "prediction", "healthy_baseline_established", manifest,
    ["prediction", "healthy_baseline_established"],
    "anomaly detection on streaming data — baseline \"healthy\" first, then flag deviations");
  boolCheck(results, "prediction", "anomaly_detection_or_rul_in_place", manifest,
    ["prediction", "anomaly_detection_or_rul_in_place"],
    "anomaly detection and/or remaining useful life (RUL) estimation is in place on the degradation signals");
  boolCheck(results, "prediction", "fault_labels_available_or_imbalance_handled", manifest,
    ["prediction", "fault_labels_available_or_imbalance_handled"],
    "\"classifying\" faults with no failure labels is refused — failure labels are usually scarce, so handle class imbalance honestly");
  boolCheck(results, "prediction", "uncertainty_reported", manifest,
    ["prediction", "uncertainty_reported"],
    "baseline first; report uncertainty");
  boolCheck(results, "prediction", "thresholds_tuned_to_missed_failure_vs_false_alarm_cost", manifest,
    ["prediction", "thresholds_tuned_to_missed_failure_vs_false_alarm_cost"],
    "tune precision/recall against the cost of a missed failure vs a false alarm — an alert that cries wolf gets ignored; alert thresholds set without regard to false-alarm cost are refused");

  // ---- Section 5: reliability_frame (reliability engineering) ----
  boolCheck(results, "reliability_frame", "fmea_completed", manifest,
    ["reliability", "fmea_completed"],
    "FMEA — enumerate failure modes and effects");
  boolCheck(results, "reliability_frame", "prioritised_by_severity_occurrence_detectability", manifest,
    ["reliability", "prioritised_by_severity_occurrence_detectability"],
    "prioritize by severity x occurrence x detectability (RPN)");
  boolCheck(results, "reliability_frame", "rcm_strategy_per_failure_mode", manifest,
    ["reliability", "rcm_strategy_per_failure_mode"],
    "RCM — choose the right strategy per failure mode, driven by consequence");
  boolCheck(results, "reliability_frame", "mtbf_mttr_tracked", manifest,
    ["reliability", "mtbf_mttr_tracked"],
    "track MTBF / MTTR, availability, and downtime cost to justify PdM investment");
  boolCheck(results, "reliability_frame", "engineering_judgement_not_replaced_by_black_box", manifest,
    ["reliability", "fmea_and_engineering_judgement_not_replaced"],
    "replacing FMEA and engineering judgment with a black box is refused");

  // ---- Section 6: data_and_integration ----
  boolCheck(results, "data_and_integration", "sensor_quality_and_calibration_verified", manifest,
    ["integration", "sensor_quality_and_calibration_verified"],
    "sensor quality and calibration are foundational — garbage sensors, garbage predictions; ignoring sensor quality/calibration is refused");
  boolCheck(results, "data_and_integration", "leakage_label_scarcity_and_drift_watched", manifest,
    ["integration", "leakage_label_scarcity_and_drift_watched"],
    "data discipline: watch leakage, label scarcity, and drift");
  boolCheck(results, "data_and_integration", "edge_vs_cloud_inference_decided", manifest,
    ["integration", "edge_vs_cloud_inference_decided"],
    "decide edge vs cloud inference");
  boolCheck(results, "data_and_integration", "work_orders_closed_into_cmms", manifest,
    ["integration", "work_orders_closed_into_cmms"],
    "sensors/IoT -> data platform -> models -> work orders, closed back into the CMMS/EAM");

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
    verdict = "ASSESSMENT_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ASSESSMENT_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "predictive-maintenance-failure-risk-assessment",
    atom_version: "0.1.0",
    asset: manifest["asset"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PREDICTIVE MAINTENANCE FAILURE RISK ASSESSMENT",
    `asset: ${pyStr(verdict.asset ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(20)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
