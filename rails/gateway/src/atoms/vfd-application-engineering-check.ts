// VFD application engineering check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/vfd-application-engineering-check/src/vfd_application_engineering_check.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed margin and
// the summary string are byte-identical to the Python output for
// the same input. Computed margins use the shared fixed
// serialization: round half up to 4dp — floor(v * 10000 + 0.5) /
// 10000 — then format with exactly four decimals; comparisons use
// the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  asset: "string",
  application: {
    load_torque_type: "string",
    overload_duty_declared: "boolean",
    speed_range_declared: "boolean",
    starts_per_hour: "number",
    environment_declared: "boolean",
    selected_to_duty: "boolean",
  },
  power_quality: {
    harmonic_impact_estimated: "boolean",
    harmonic_distortion_percent: "number",
    site_limit_percent: "number",
    mitigation_declared: "boolean",
    capacitor_bank_interaction_reviewed: "boolean",
    harmonics_per_site_standard: "boolean",
  },
  cable: {
    cable_length_m: "number",
    oem_max_lead_length_m: "number",
    motor_insulation_within_drive_limits: "boolean",
    dvdt_reflected_wave_reviewed: "boolean",
    inverter_duty_motor_assessed: "boolean",
    shaft_bearing_protection_reviewed: "boolean",
  },
  drive: {
    derated_current_a: "number",
    required_load_current_a: "number",
  },
  protection: {
    overload_model_configured: "boolean",
    ground_fault_configured: "boolean",
    over_under_voltage_configured: "boolean",
    stall_configured: "boolean",
    bypass_philosophy_documented: "boolean",
    estop_interlocks_verified: "boolean",
  },
  commissioning: {
    parameter_sheet_completed_archived: "boolean",
    motor_id_run_done: "boolean",
    protections_tested_logically: "boolean",
    ramps_limits_setpoints_documented: "boolean",
    baseline_trends_recorded: "boolean",
  },
  troubleshooting: {
    open: "boolean",
    fault_log_reviewed_first: "boolean",
    typical_fault_causes_cross_checked: "boolean",
    mechanical_causes_cross_checked: "boolean",
    findings_documented: "boolean",
  },
  records: {
    parameter_backup_archived: "boolean",
    commissioning_sheet_archived: "boolean",
    firmware_version: "string",
    hipot_performed_on_drive_output: "boolean",
    protections_bypassed_without_documented_approval: "boolean",
  },
};

export const SECTIONS = [
  "application_profile",
  "power_quality",
  "motor_cable_drive",
  "protection_and_control",
  "commissioning",
  "troubleshooting",
  "records_and_red_lines",
] as const;

export const TORQUE_TYPES = ["variable", "constant"] as const;

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
  engineering_status: string | null;
  harmonic_margin_percent: string | null;
  cable_margin_m: string | null;
  current_margin_a: string | null;
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

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function leCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  valuePath: string[],
  limitPath: string[],
  evidence: string,
): [boolean | null, number | null] {
  const [value, hasValue] = getPath(manifest, ...valuePath);
  const [limit, hasLimit] = getPath(manifest, ...limitPath);
  const present = hasValue && hasLimit;
  if (!(present && isNumber(value) && isNumber(limit))) {
    check(results, section, name, value, present, false, evidence);
    return [null, null];
  }
  const margin = (limit as number) - (value as number);
  check(results, section, name, value, true,
    (value as number) <= (limit as number), evidence);
  return [(value as number) > (limit as number), margin];
}

function geCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  valuePath: string[],
  reqPath: string[],
  evidence: string,
): [boolean | null, number | null] {
  const [value, hasValue] = getPath(manifest, ...valuePath);
  const [required, hasReq] = getPath(manifest, ...reqPath);
  const present = hasValue && hasReq;
  if (!(present && isNumber(value) && isNumber(required))) {
    check(results, section, name, value, present, false, evidence);
    return [null, null];
  }
  const margin = (value as number) - (required as number);
  check(results, section, name, value, true,
    (value as number) >= (required as number), evidence);
  return [(value as number) < (required as number), margin];
}

function troubleCheck(
  results: CheckResult[],
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  gate: unknown,
  hasGate: boolean,
  evidence: string,
): void {
  if (hasGate && pyTruthy(gate)) {
    const [value, present] = getPath(manifest, "troubleshooting", field);
    check(results, "troubleshooting", name, value, present,
      value === true, evidence);
  } else {
    check(results, "troubleshooting", name, gate, hasGate, true,
      "no troubleshooting declared open");
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: application_profile ----
  enumCheck(results, "application_profile", "load_torque_type_named",
    manifest, ["application", "load_torque_type"], TORQUE_TYPES,
    "application profile: load torque type is one of variable / constant torque");
  boolCheck(results, "application_profile", "overload_duty_declared",
    manifest, ["application", "overload_duty_declared"],
    "overload duty declared — select to duty, not to marketing tables");
  boolCheck(results, "application_profile", "speed_range_declared",
    manifest, ["application", "speed_range_declared"],
    "speed range declared as an application-profile input");
  numberCheck(results, "application_profile", "starts_per_hour_declared",
    manifest, ["application", "starts_per_hour"],
    "starts/hour declared as an application-profile input");
  boolCheck(results, "application_profile", "environment_declared",
    manifest, ["application", "environment_declared"],
    "environment declared as an application-profile input");
  boolCheck(results, "application_profile", "selected_to_duty_not_marketing",
    manifest, ["application", "selected_to_duty"],
    "drive selected to duty, not to marketing tables");

  // ---- Section 2: power_quality ----
  boolCheck(results, "power_quality", "harmonic_impact_estimated",
    manifest, ["power_quality", "harmonic_impact_estimated"],
    "harmonic impact estimated");
  const [thdExceeded, thdMargin] = leCheck(results, "power_quality",
    "harmonics_within_declared_site_limit", manifest,
    ["power_quality", "harmonic_distortion_percent"],
    ["power_quality", "site_limit_percent"],
    "IEEE 519-style limits per site standard: the declared harmonic distortion must not exceed the declared site limit (the limit is the caller's site standard — this atom supplies no number)");
  boolCheck(results, "power_quality", "mitigation_declared",
    manifest, ["power_quality", "mitigation_declared"],
    "mitigation declared — line reactors / DC chokes / filters; multi-pulse or active front end where justified");
  boolCheck(results, "power_quality", "capacitor_bank_interaction_reviewed",
    manifest, ["power_quality", "capacitor_bank_interaction_reviewed"],
    "capacitor-bank interactions / detuning checked");
  boolCheck(results, "power_quality", "harmonics_addressed_per_site_standard",
    manifest, ["power_quality", "harmonics_per_site_standard"],
    "quality gate: harmonics addressed per site standard");

  // ---- Section 3: motor_cable_drive ----
  const [cableExceeded, cableMargin] = leCheck(results, "motor_cable_drive",
    "cable_length_within_oem_limit", manifest,
    ["cable", "cable_length_m"], ["cable", "oem_max_lead_length_m"],
    "quality gate: lead length within drive limits (documented) — the declared cable length must not exceed the declared OEM maximum lead length (respect OEM limits)");
  boolCheck(results, "motor_cable_drive", "motor_insulation_within_drive_limits",
    manifest, ["cable", "motor_insulation_within_drive_limits"],
    "quality gate: motor insulation system within drive limits (documented)");
  boolCheck(results, "motor_cable_drive", "dvdt_reflected_wave_reviewed",
    manifest, ["cable", "dvdt_reflected_wave_reviewed"],
    "reflected wave / dv-dt vs lead length reviewed (the skill states no dv/dt number, so the review is declared, not re-graded)");
  boolCheck(results, "motor_cable_drive", "inverter_duty_motor_assessed",
    manifest, ["cable", "inverter_duty_motor_assessed"],
    "inverter-duty motors for long leads / high switching assessed");
  boolCheck(results, "motor_cable_drive", "shaft_voltage_bearing_protection_reviewed",
    manifest, ["cable", "shaft_bearing_protection_reviewed"],
    "shaft voltage & bearing currents reviewed — shaft grounding / bearing protection on larger frames");
  const [currentExceeded, currentMargin] = geCheck(results, "motor_cable_drive",
    "derated_current_covers_required_load_current", manifest,
    ["drive", "derated_current_a"], ["drive", "required_load_current_a"],
    "select to duty: the declared derated drive current must cover the declared required load current (both currents are caller-declared — this atom supplies no derating factor)");

  // ---- Section 4: protection_and_control ----
  boolCheck(results, "protection_and_control", "overload_model_configured",
    manifest, ["protection", "overload_model_configured"],
    "internal protection configured: overload model");
  boolCheck(results, "protection_and_control", "ground_fault_protection_configured",
    manifest, ["protection", "ground_fault_configured"],
    "internal protection configured: ground fault");
  boolCheck(results, "protection_and_control", "over_under_voltage_protection_configured",
    manifest, ["protection", "over_under_voltage_configured"],
    "internal protection configured: over/under voltage");
  boolCheck(results, "protection_and_control", "stall_protection_configured",
    manifest, ["protection", "stall_configured"],
    "internal protection configured: stall");
  boolCheck(results, "protection_and_control", "bypass_philosophy_documented",
    manifest, ["protection", "bypass_philosophy_documented"],
    "bypass philosophy documented");
  boolCheck(results, "protection_and_control", "estop_and_interlocks_verified",
    manifest, ["protection", "estop_interlocks_verified"],
    "quality gate: e-stop & interlock design per site standards — never softened for convenience; e-stops verified");

  // ---- Section 5: commissioning ----
  boolCheck(results, "commissioning", "parameter_sheet_completed_and_archived",
    manifest, ["commissioning", "parameter_sheet_completed_archived"],
    "parameter sheet completed and archived (motor data, limits, ramps, setpoints)");
  boolCheck(results, "commissioning", "motor_id_run_done",
    manifest, ["commissioning", "motor_id_run_done"],
    "motor ID run done");
  boolCheck(results, "commissioning", "protections_tested_not_just_set",
    manifest, ["commissioning", "protections_tested_logically"],
    "quality gate: protection settings tested, not just set — each protection tested logically");
  boolCheck(results, "commissioning", "ramps_limits_setpoints_documented",
    manifest, ["commissioning", "ramps_limits_setpoints_documented"],
    "limits, ramps and setpoints documented on the parameter sheet");
  boolCheck(results, "commissioning", "baseline_trends_recorded",
    manifest, ["commissioning", "baseline_trends_recorded"],
    "baseline current / DC-bus / temperature trends recorded");

  // ---- Section 6: troubleshooting ----
  const [gate, hasGate] = getPath(manifest, "troubleshooting", "open");
  troubleCheck(results, "fault_log_reviewed_first", manifest,
    "fault_log_reviewed_first", gate, hasGate,
    "troubleshooting: fault log first");
  troubleCheck(results, "typical_fault_causes_cross_checked", manifest,
    "typical_fault_causes_cross_checked", gate, hasGate,
    "typical faults cross-checked — OC (jam/accel), OV (decel/regeneration), UV (supply), ground fault (cable vs motor), overtemp");
  troubleCheck(results, "mechanical_load_causes_cross_checked", manifest,
    "mechanical_causes_cross_checked", gate, hasGate,
    "mechanical / load causes cross-checked");
  troubleCheck(results, "findings_documented", manifest,
    "findings_documented", gate, hasGate,
    "troubleshooting findings documented");

  // ---- Section 7: records_and_red_lines ----
  boolCheck(results, "records_and_red_lines", "parameter_backup_archived",
    manifest, ["records", "parameter_backup_archived"],
    "records: parameter backups archived per drive");
  boolCheck(results, "records_and_red_lines", "commissioning_sheet_archived",
    manifest, ["records", "commissioning_sheet_archived"],
    "quality gate: commissioning sheet + parameter backup archived");
  stringCheck(results, "records_and_red_lines", "firmware_version_noted",
    manifest, ["records", "firmware_version"],
    "firmware version noted in the records");
  falseCheck(results, "records_and_red_lines", "no_hipot_on_drive_output",
    manifest, ["records", "hipot_performed_on_drive_output"],
    "skill red line: never hi-pot drive output terminals (drive killer); isolate electronics before insulation tests");
  falseCheck(results, "records_and_red_lines",
    "no_protection_bypass_without_documented_approval", manifest,
    ["records", "protections_bypassed_without_documented_approval"],
    "skill red line: never bypass drive protections to \"keep running\" without documented engineering approval");

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

  const exceededFlags = [thdExceeded, cableExceeded, currentExceeded];
  let engineeringStatus: string | null;
  if (exceededFlags.some((f) => f === true)) {
    engineeringStatus = "not_sound_on_declared_values";
  } else if (exceededFlags.every((f) => f === false)) {
    engineeringStatus = "sound_on_declared_values";
  } else {
    engineeringStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "vfd-application-engineering-check",
    atom_version: "0.1.0",
    asset: manifest["asset"] ?? null,
    verdict,
    sections,
    checks: results,
    engineering_status: engineeringStatus,
    harmonic_margin_percent: fmt4(thdMargin),
    cable_margin_m: fmt4(cableMargin),
    current_margin_a: fmt4(currentMargin),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "VFD APPLICATION ENGINEERING CHECK",
    `asset: ${pyStr(verdict.asset ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(25)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
