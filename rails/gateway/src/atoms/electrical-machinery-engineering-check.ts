// Electrical machinery engineering check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/electrical-machinery-engineering-check/src/
// electrical_machinery_engineering_check.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (duty.load_torque_profile,
// specification.machine_type, specification.enclosure) are
// validated as "string" only, never enum-checked here.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  machine: "string",
  duty: {
    load_torque_profile: "string",
    starts_per_hour: "number",
    ambient_c: "number",
    altitude_m: "number",
    worst_case_identified: "boolean",
  },
  sizing: {
    worst_case_torque_nm: "number",
    rated_torque_nm: "number",
    worst_case_power_kw: "number",
    rated_power_kw: "number",
    service_factor: "number",
    starting_current_a: "number",
    supply_capability_a: "number",
    efficiency_at_actual_load_percent: "number",
  },
  specification: {
    machine_type: "string",
    insulation_class: "string",
    enclosure: "string",
    bearings_specified: "boolean",
    space_heaters_specified: "boolean",
    rtds_specified: "boolean",
    vibration_limits_specified: "boolean",
    standards_cited: "boolean",
  },
  tests: {
    criteria_defined_before_tests: "boolean",
    criteria_from_standards_and_oem: "boolean",
    insulation_resistance_tested: "boolean",
    pi_dar_trends_recorded: "boolean",
    winding_resistance_balance_checked: "boolean",
    surge_comparison_done: "boolean",
    no_load_and_load_runs_done: "boolean",
    results_recorded_with_units: "boolean",
    instruments_and_calibration_recorded: "boolean",
  },
  failure: {
    investigation_open: "boolean",
    evidence_organized_into_timeline: "boolean",
    operating_history_included: "boolean",
    typical_failure_modes_considered: "boolean",
  },
  trending: {
    per_asset_baseline_exists: "boolean",
    like_for_like_comparison: "boolean",
    deltas_compared: "boolean",
  },
  records: {
    nameplate_and_serial_verified: "boolean",
    re_energized_after_insulation_or_winding_anomaly_without_review: "boolean",
    anomalies_flagged: "boolean",
    asset_records_updated: "boolean",
    deviations_logged_with_actions: "boolean",
  },
};

export const SECTIONS = [
  "duty",
  "sizing",
  "specification",
  "acceptance_tests",
  "failure_analysis",
  "trending",
  "records_and_safety",
] as const;

export const TORQUE_PROFILES = ["constant", "variable", "impact"] as const;
export const MACHINE_TYPES = ["induction", "synchronous"] as const;
export const ENCLOSURES = ["TEFC", "ODP", "WPI"] as const;

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
  machine: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function numberCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, isNumber(value), evidence);
}

function enumCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  allowed: readonly string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present,
    typeof value === "string" && allowed.includes(value), evidence);
}

function stringCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  const ok = typeof value === "string" && value.length > 0;
  check(results, section, name, value, present, ok, evidence);
}

function withinCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  valuePath: string[],
  limitPath: string[],
  evidence: string,
): void {
  const [value, hasValue] = getPath(manifest, ...valuePath);
  const [limit, hasLimit] = getPath(manifest, ...limitPath);
  const present = hasValue && hasLimit;
  const ok = isNumber(value) && isNumber(limit) &&
    (value as number) <= (limit as number);
  check(results, section, name, value, present, ok, evidence);
}

function failureCheck(
  results: CheckResult[],
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  gate: unknown,
  hasGate: boolean,
  evidence: string,
): void {
  if (hasGate && pyTruthy(gate)) {
    const [value, present] = getPath(manifest, "failure", field);
    check(results, "failure_analysis", name, value, present,
      value === true, evidence);
  } else {
    check(results, "failure_analysis", name, gate, hasGate, true,
      "no failure investigation declared open");
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: duty (skill method 1) ----
  enumCheck(results, "duty", "load_torque_profile_named", manifest,
    ["duty", "load_torque_profile"], TORQUE_PROFILES,
    "duty first: the load torque profile is one of constant / variable / impact");
  numberCheck(results, "duty", "starts_per_hour_declared", manifest,
    ["duty", "starts_per_hour"],
    "starts per hour declared — duty drives selection, not habit");
  numberCheck(results, "duty", "ambient_declared", manifest,
    ["duty", "ambient_c"],
    "ambient temperature declared as a duty input");
  numberCheck(results, "duty", "altitude_declared", manifest,
    ["duty", "altitude_m"], "altitude declared as a duty input");
  boolCheck(results, "duty", "worst_case_identified", manifest,
    ["duty", "worst_case_identified"],
    "the worst case the sizing must survive is identified");

  // ---- Section 2: sizing (skill method 2 + quality gate) ----
  withinCheck(results, "sizing", "worst_case_torque_within_rating",
    manifest, ["sizing", "worst_case_torque_nm"],
    ["sizing", "rated_torque_nm"],
    "quality gate: worst-case torque documented against the selected rating — the declared worst case must not exceed the declared rating");
  withinCheck(results, "sizing", "worst_case_power_within_rating",
    manifest, ["sizing", "worst_case_power_kw"],
    ["sizing", "rated_power_kw"],
    "torque and power at worst case: the declared worst-case power must not exceed the declared rated power");
  numberCheck(results, "sizing", "service_factor_declared", manifest,
    ["sizing", "service_factor"],
    "frame / service-factor margin: the service factor is declared");
  withinCheck(results, "sizing",
    "starting_current_within_supply_capability", manifest,
    ["sizing", "starting_current_a"], ["sizing", "supply_capability_a"],
    "starting current vs supply capability: the declared starting current must not exceed the declared supply capability");
  numberCheck(results, "sizing", "efficiency_at_actual_load_recorded",
    manifest, ["sizing", "efficiency_at_actual_load_percent"],
    "efficiency at actual load (not nameplate) is recorded");

  // ---- Section 3: specification (skill method 3) ----
  enumCheck(results, "specification", "machine_type_named", manifest,
    ["specification", "machine_type"], MACHINE_TYPES,
    "machine type is one of induction / synchronous");
  stringCheck(results, "specification", "insulation_class_named", manifest,
    ["specification", "insulation_class"],
    "insulation class is named — a vague spec is rejected");
  enumCheck(results, "specification", "enclosure_named", manifest,
    ["specification", "enclosure"], ENCLOSURES,
    "enclosure is one of TEFC / ODP / WPI");
  boolCheck(results, "specification", "bearings_specified", manifest,
    ["specification", "bearings_specified"], "bearings are specified");
  boolCheck(results, "specification", "space_heaters_specified", manifest,
    ["specification", "space_heaters_specified"],
    "space heaters are specified");
  boolCheck(results, "specification", "rtds_specified", manifest,
    ["specification", "rtds_specified"], "RTDs are specified");
  boolCheck(results, "specification", "vibration_limits_specified",
    manifest, ["specification", "vibration_limits_specified"],
    "vibration limits are specified");
  boolCheck(results, "specification", "standards_cited", manifest,
    ["specification", "standards_cited"],
    "quality gate: the spec cites standards");

  // ---- Section 4: acceptance_tests (skill method 4 + gates) ----
  boolCheck(results, "acceptance_tests", "criteria_defined_before_tests",
    manifest, ["tests", "criteria_defined_before_tests"],
    "quality gate: test acceptance criteria defined before tests");
  boolCheck(results, "acceptance_tests",
    "criteria_from_standards_and_oem", manifest,
    ["tests", "criteria_from_standards_and_oem"],
    "acceptance criteria come FROM standards and OEM — the atom applies no threshold of its own");
  boolCheck(results, "acceptance_tests", "insulation_resistance_tested",
    manifest, ["tests", "insulation_resistance_tested"],
    "insulation resistance tested");
  boolCheck(results, "acceptance_tests", "pi_dar_trends_recorded",
    manifest, ["tests", "pi_dar_trends_recorded"],
    "insulation resistance recorded with PI / DAR trends");
  boolCheck(results, "acceptance_tests",
    "winding_resistance_balance_checked", manifest,
    ["tests", "winding_resistance_balance_checked"],
    "winding resistance balance checked (the skill states no numeric balance tolerance, so the check is declared, not re-graded)");
  boolCheck(results, "acceptance_tests", "surge_comparison_done",
    manifest, ["tests", "surge_comparison_done"], "surge comparison done");
  boolCheck(results, "acceptance_tests", "no_load_and_load_runs_done",
    manifest, ["tests", "no_load_and_load_runs_done"],
    "no-load and load runs done");
  boolCheck(results, "acceptance_tests", "results_recorded_with_units",
    manifest, ["tests", "results_recorded_with_units"],
    "quality gate: results recorded with units");
  boolCheck(results, "acceptance_tests",
    "instruments_and_calibration_recorded", manifest,
    ["tests", "instruments_and_calibration_recorded"],
    "results recorded with instruments + calibration status");

  // ---- Section 5: failure_analysis (skill method 5) ----
  const [gate, hasGate] = getPath(manifest, "failure", "investigation_open");
  failureCheck(results, "evidence_organized_into_timeline", manifest,
    "evidence_organized_into_timeline", gate, hasGate,
    "failure evidence (photos, waveforms, teardown notes, operating history) organized into a timeline");
  failureCheck(results, "operating_history_included", manifest,
    "operating_history_included", gate, hasGate,
    "operating history is part of the failure evidence");
  failureCheck(results, "typical_failure_modes_considered", manifest,
    "typical_failure_modes_considered", gate, hasGate,
    "typical modes considered: bearings, insulation aging / PD, rotor bars, supply / VFD interaction");

  // ---- Section 6: trending (skill method 6) ----
  boolCheck(results, "trending", "per_asset_baseline_exists", manifest,
    ["trending", "per_asset_baseline_exists"], "per-asset baselines kept");
  boolCheck(results, "trending", "like_for_like_comparison", manifest,
    ["trending", "like_for_like_comparison"],
    "compare like-for-like: same test, same conditions");
  boolCheck(results, "trending", "deltas_compared", manifest,
    ["trending", "deltas_compared"],
    "deltas mean more than absolute values — deltas are compared");

  // ---- Section 7: records_and_safety (gates + red lines) ----
  boolCheck(results, "records_and_safety",
    "nameplate_and_serial_verified", manifest,
    ["records", "nameplate_and_serial_verified"],
    "red line: nameplate / serial verified against documents — never assumed");
  falseCheck(results, "records_and_safety",
    "no_reenergize_after_anomaly_without_review", manifest,
    ["records", "re_energized_after_insulation_or_winding_anomaly_without_review"],
    "red line: never re-energize after insulation or winding anomalies without engineering review");
  boolCheck(results, "records_and_safety", "anomalies_flagged", manifest,
    ["records", "anomalies_flagged"], "quality gate: anomalies flagged");
  boolCheck(results, "records_and_safety", "asset_records_updated",
    manifest, ["records", "asset_records_updated"],
    "quality gate: asset records updated");
  boolCheck(results, "records_and_safety",
    "deviations_logged_with_actions", manifest,
    ["records", "deviations_logged_with_actions"],
    "quality gate: deviations logged with actions");

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
    verdict = "NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "electrical-machinery-engineering-check",
    atom_version: "0.1.0",
    machine: manifest["machine"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ELECTRICAL-MACHINERY ENGINEERING CHECK",
    `machine: ${pyStr(verdict.machine ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(20)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
