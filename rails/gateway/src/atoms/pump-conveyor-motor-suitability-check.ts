// Pump conveyor motor suitability check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/pump-conveyor-motor-suitability-check/src/pump_conveyor_motor_suitability_check.py
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
// any check runs (F1 remedy, external verification Wave 1). The
// drives[] entry spec is the union of the documented entry fields:
// the universal rating fields plus the pump-only and conveyor-only
// fields, each validated only when present.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  asset: "string",
  equipment_kind: "string",
  duty: {
    curve_or_profile_read: "boolean",
    operating_point_documented: "boolean",
    operating_point_within_limits: "boolean",
    operating_modes_defined: "boolean",
  },
  drives: [{
    id: "string",
    kind: "string",
    required_power_kw: "number",
    motor_rated_power_kw: "number",
    required_running_torque_nm: "number",
    motor_rated_torque_nm: "number",
    npsh_available_m: "number",
    npsh_required_m: "number",
    operating_flow_m3h: "number",
    minimum_flow_m3h: "number",
    required_starting_torque_nm: "number",
    motor_starting_torque_nm: "number",
  }],
  sizing: {
    verified_against_curve_or_profile: "boolean",
    suitable_because_it_runs_only: "boolean",
  },
  pump: {
    minimum_flow_protection_set: "boolean",
    impeller_wear_trend_checked: "boolean",
    vfd_soft_start_reviewed: "boolean",
  },
  conveyor: {
    starting_study_considered: "boolean",
    loaded_starts_holdback_considered: "boolean",
    backstops_brake_interlocks_verified: "boolean",
    sequence_interlock_review_done: "boolean",
    belt_slip_jam_reviewed: "boolean",
  },
  baselines: {
    recorded_per_operating_mode: "boolean",
    flow_head_current_pressure_recorded: "boolean",
    compared_at_same_conditions: "boolean",
  },
  interface: {
    mechanical_data_in_asset_record: "boolean",
    data_shared_single_source: "boolean",
    changes_made: "boolean",
    changes_revalidated: "boolean",
  },
  protection: {
    protection_changed_without_engineering_review: "boolean",
  },
};

export const SECTIONS = [
  "load_and_operating_point",
  "motor_sizing",
  "pump_checks",
  "conveyor_checks",
  "baselines",
  "interface_and_protection",
] as const;

export const KINDS = ["pump", "conveyor", "mixed"] as const;

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
  suitability_status: string | null;
  min_power_margin_kw: string | null;
  min_running_torque_margin_nm: string | null;
  min_npsh_margin_m: string | null;
  min_starting_torque_margin_nm: string | null;
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

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
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

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function kindOf(manifest: Record<string, unknown>): string | null {
  const [kind, hasKind] = getPath(manifest, "equipment_kind");
  if (hasKind && (KINDS as readonly unknown[]).includes(kind)) {
    return kind as string;
  }
  return null;
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  appliesTo: string[],
  evidence: string,
  naEvidence: string,
): void {
  const kind = kindOf(manifest);
  if (kind === null) {
    check(results, section, name, null, false, false,
      "equipment_kind not declared as pump / conveyor / mixed");
  } else if (appliesTo.includes(kind)) {
    boolCheck(results, section, name, manifest, path, evidence);
  } else {
    check(results, section, name, kind, true, true, naEvidence);
  }
}

function drivesChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [boolean | null, number | null, number | null] {
  const [drives, hasDrives] = getPath(manifest, "drives");
  if (!hasDrives || !Array.isArray(drives) || drives.length === 0) {
    check(results, "motor_sizing", "motor_power_covers_required_power",
      drives, false, false, "no drives declared");
    check(results, "motor_sizing", "motor_torque_covers_running_torque",
      drives, false, false, "no drives declared");
    return [null, null, null];
  }
  let powerIncomplete = false;
  let powerViolating = false;
  let powerMargin: number | null = null;
  let torqueIncomplete = false;
  let torqueViolating = false;
  let torqueMargin: number | null = null;
  for (const entry of drives) {
    if (!isPyDict(entry)) {
      powerIncomplete = true;
      torqueIncomplete = true;
      continue;
    }
    const [required, hasReq] = getFrom(entry, "required_power_kw");
    const [rated, hasRated] = getFrom(entry, "motor_rated_power_kw");
    if (!(hasReq && hasRated && isNumber(required) && isNumber(rated))) {
      powerIncomplete = true;
    } else {
      const margin = (rated as number) - (required as number);
      if (powerMargin === null || margin < powerMargin) powerMargin = margin;
      if ((rated as number) < (required as number)) powerViolating = true;
    }
    const [reqTorque, hasReqT] = getFrom(entry, "required_running_torque_nm");
    const [ratedTorque, hasRatedT] = getFrom(entry, "motor_rated_torque_nm");
    if (!(hasReqT && hasRatedT && isNumber(reqTorque) && isNumber(ratedTorque))) {
      torqueIncomplete = true;
    } else {
      const margin = (ratedTorque as number) - (reqTorque as number);
      if (torqueMargin === null || margin < torqueMargin) torqueMargin = margin;
      if ((ratedTorque as number) < (reqTorque as number)) torqueViolating = true;
    }
  }
  if (powerIncomplete) {
    check(results, "motor_sizing", "motor_power_covers_required_power",
      drives, false, false,
      "a drive entry is missing its required power or motor rated power");
  } else {
    check(results, "motor_sizing", "motor_power_covers_required_power",
      drives, true, !powerViolating,
      "motor rated power covers the declared required power for every drive — the load defines the duty");
  }
  if (torqueIncomplete) {
    check(results, "motor_sizing", "motor_torque_covers_running_torque",
      drives, false, false,
      "a drive entry is missing its required running torque or motor rated torque");
  } else {
    check(results, "motor_sizing", "motor_torque_covers_running_torque",
      drives, true, !torqueViolating,
      "motor rated torque covers the declared required running torque for every drive");
  }
  if (powerIncomplete || torqueIncomplete) {
    const exceeded = (powerViolating || torqueViolating) ? true : null;
    return [exceeded, null, null];
  }
  return [powerViolating || torqueViolating, powerMargin, torqueMargin];
}

function pumpChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [boolean | null, number | null] {
  const kind = kindOf(manifest);
  const [drives] = getPath(manifest, "drives");
  if (kind === null) {
    check(results, "pump_checks", "npsh_available_covers_required",
      null, false, false,
      "equipment_kind not declared as pump / conveyor / mixed");
    check(results, "pump_checks", "operating_flow_covers_minimum_flow",
      null, false, false,
      "equipment_kind not declared as pump / conveyor / mixed");
    return [null, null];
  }
  if (!["pump", "mixed"].includes(kind)) {
    check(results, "pump_checks", "npsh_available_covers_required",
      kind, true, true, "no pump drives declared");
    check(results, "pump_checks", "operating_flow_covers_minimum_flow",
      kind, true, true, "no pump drives declared");
    return [false, null];
  }
  const pumps: Record<string, unknown>[] = Array.isArray(drives)
    ? drives.filter((e): e is Record<string, unknown> =>
        isPyDict(e) && e["kind"] === "pump")
    : [];
  if (pumps.length === 0) {
    check(results, "pump_checks", "npsh_available_covers_required",
      drives, false, false, "no pump drives declared");
    check(results, "pump_checks", "operating_flow_covers_minimum_flow",
      drives, false, false, "no pump drives declared");
    return [null, null];
  }
  let npshIncomplete = false;
  let npshViolating = false;
  let npshMargin: number | null = null;
  let flowIncomplete = false;
  let flowViolating = false;
  for (const entry of pumps) {
    const [available, hasAvail] = getFrom(entry, "npsh_available_m");
    const [required, hasReq] = getFrom(entry, "npsh_required_m");
    if (!(hasAvail && hasReq && isNumber(available) && isNumber(required))) {
      npshIncomplete = true;
    } else {
      const margin = (available as number) - (required as number);
      if (npshMargin === null || margin < npshMargin) npshMargin = margin;
      if ((available as number) < (required as number)) npshViolating = true;
    }
    const [flow, hasFlow] = getFrom(entry, "operating_flow_m3h");
    const [minimum, hasMin] = getFrom(entry, "minimum_flow_m3h");
    if (!(hasFlow && hasMin && isNumber(flow) && isNumber(minimum))) {
      flowIncomplete = true;
    } else if ((flow as number) < (minimum as number)) {
      flowViolating = true;
    }
  }
  if (npshIncomplete) {
    check(results, "pump_checks", "npsh_available_covers_required",
      drives, false, false,
      "a pump drive entry is missing its NPSH available or NPSH required");
  } else {
    check(results, "pump_checks", "npsh_available_covers_required",
      drives, true, !npshViolating,
      "NPSH margin noted — NPSH available covers NPSH required for every pump drive (cavitation destroys more than pumps)");
  }
  if (flowIncomplete) {
    check(results, "pump_checks", "operating_flow_covers_minimum_flow",
      drives, false, false,
      "a pump drive entry is missing its operating flow or declared minimum flow");
  } else {
    check(results, "pump_checks", "operating_flow_covers_minimum_flow",
      drives, true, !flowViolating,
      "minimum-flow protection respected — operating flow is at or above the declared minimum flow for every pump drive");
  }
  if (npshIncomplete || flowIncomplete) {
    const exceeded = (npshViolating || flowViolating) ? true : null;
    return [exceeded, null];
  }
  return [npshViolating || flowViolating, npshMargin];
}

function conveyorChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [boolean | null, number | null] {
  const kind = kindOf(manifest);
  const [drives] = getPath(manifest, "drives");
  if (kind === null) {
    check(results, "conveyor_checks", "motor_starting_torque_covers_required",
      null, false, false,
      "equipment_kind not declared as pump / conveyor / mixed");
    return [null, null];
  }
  if (!["conveyor", "mixed"].includes(kind)) {
    check(results, "conveyor_checks", "motor_starting_torque_covers_required",
      kind, true, true, "no conveyor drives declared");
    return [false, null];
  }
  const conveyors: Record<string, unknown>[] = Array.isArray(drives)
    ? drives.filter((e): e is Record<string, unknown> =>
        isPyDict(e) && e["kind"] === "conveyor")
    : [];
  if (conveyors.length === 0) {
    check(results, "conveyor_checks", "motor_starting_torque_covers_required",
      drives, false, false, "no conveyor drives declared");
    return [null, null];
  }
  let incomplete = false;
  let violating = false;
  let marginMin: number | null = null;
  for (const entry of conveyors) {
    const [required, hasReq] = getFrom(entry, "required_starting_torque_nm");
    const [starting, hasStart] = getFrom(entry, "motor_starting_torque_nm");
    if (!(hasReq && hasStart && isNumber(required) && isNumber(starting))) {
      incomplete = true;
    } else {
      const margin = (starting as number) - (required as number);
      if (marginMin === null || margin < marginMin) marginMin = margin;
      if ((starting as number) < (required as number)) violating = true;
    }
  }
  if (incomplete) {
    check(results, "conveyor_checks", "motor_starting_torque_covers_required",
      drives, false, false,
      "a conveyor drive entry is missing its required starting torque or motor starting torque");
    return [violating ? true : null, null];
  }
  check(results, "conveyor_checks", "motor_starting_torque_covers_required",
    drives, true, !violating,
    "starting torque >> running torque — motor starting torque covers the declared required starting torque for every conveyor drive");
  return [violating, marginMin];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: load_and_operating_point ----
  boolCheck(results, "load_and_operating_point",
    "curve_or_profile_read_before_sizing", manifest,
    ["duty", "curve_or_profile_read"],
    "the load defines the duty: pump curve or conveyor profile read before sizing the motor or setting the drive");
  boolCheck(results, "load_and_operating_point",
    "operating_point_documented", manifest,
    ["duty", "operating_point_documented"],
    "quality gate: operating point documented — pump curve vs system curve, or the conveyor profile");
  boolCheck(results, "load_and_operating_point",
    "operating_point_within_equipment_limits", manifest,
    ["duty", "operating_point_within_limits"],
    "quality gate: operating point within equipment limits");
  boolCheck(results, "load_and_operating_point",
    "operating_modes_defined", manifest,
    ["duty", "operating_modes_defined"],
    "operating modes defined — baselines are recorded per operating mode");

  // ---- Section 2: motor_sizing ----
  const [drivesExceeded, powerMargin, torqueMargin] = drivesChecks(results, manifest);
  boolCheck(results, "motor_sizing",
    "sizing_verified_against_curve_or_profile", manifest,
    ["sizing", "verified_against_curve_or_profile"],
    "skill red line: verify against the curve/profile — sizing is verified, not assumed");
  falseCheck(results, "motor_sizing",
    "no_it_runs_so_sizing_is_fine", manifest,
    ["sizing", "suitable_because_it_runs_only"],
    "skill red line: no \"it runs, so sizing is fine\"");

  // ---- Section 3: pump_checks ----
  const [pumpExceeded, npshMargin] = pumpChecks(results, manifest);
  gatedBoolCheck(results, "pump_checks", "minimum_flow_protection_set",
    manifest, ["pump", "minimum_flow_protection_set"], ["pump", "mixed"],
    "quality gate: min-flow protection set (pumps)",
    "no pump drives declared");
  gatedBoolCheck(results, "pump_checks", "impeller_wear_or_fouling_trend_checked",
    manifest, ["pump", "impeller_wear_trend_checked"], ["pump", "mixed"],
    "impeller wear/fouling shows as head/flow loss at the same speed — trend it",
    "no pump drives declared");
  gatedBoolCheck(results, "pump_checks", "vfd_and_soft_start_transients_reviewed",
    manifest, ["pump", "vfd_soft_start_reviewed"], ["pump", "mixed"],
    "VFD control (pressure/flow) reviewed for resonance and minimum speed; soft starts avoid water-hammer transients",
    "no pump drives declared");

  // ---- Section 4: conveyor_checks ----
  const [conveyorExceeded, startingMargin] = conveyorChecks(results, manifest);
  gatedBoolCheck(results, "conveyor_checks", "starting_study_considered",
    manifest, ["conveyor", "starting_study_considered"], ["conveyor", "mixed"],
    "quality gate: starting study considered (conveyors)",
    "no conveyor drives declared");
  gatedBoolCheck(results, "conveyor_checks", "loaded_starts_and_holdback_considered",
    manifest, ["conveyor", "loaded_starts_holdback_considered"], ["conveyor", "mixed"],
    "conveyor dynamics: loaded starts, incline/holdback, belt stretch considered",
    "no conveyor drives declared");
  gatedBoolCheck(results, "conveyor_checks", "backstops_and_brake_interlocks_verified",
    manifest, ["conveyor", "backstops_brake_interlocks_verified"], ["conveyor", "mixed"],
    "backstops and brake interlocks verified",
    "no conveyor drives declared");
  gatedBoolCheck(results, "conveyor_checks", "sequence_and_interlock_review_done",
    manifest, ["conveyor", "sequence_interlock_review_done"], ["conveyor", "mixed"],
    "sequence and interlock review (start/stop order, pull-cord e-stops per site) done",
    "no conveyor drives declared");
  gatedBoolCheck(results, "conveyor_checks", "belt_slip_vs_overload_and_jam_reviewed",
    manifest, ["conveyor", "belt_slip_jam_reviewed"], ["conveyor", "mixed"],
    "belt slip vs overload tradeoffs reviewed; current signature for jam detection reviewed",
    "no conveyor drives declared");

  // ---- Section 5: baselines ----
  boolCheck(results, "baselines", "baselines_recorded_per_mode",
    manifest, ["baselines", "recorded_per_operating_mode"],
    "quality gate: commissioning baselines recorded per mode");
  boolCheck(results, "baselines", "flow_head_current_pressure_recorded",
    manifest, ["baselines", "flow_head_current_pressure_recorded"],
    "record flow/head/current/pressure per operating mode at commissioning");
  boolCheck(results, "baselines", "readings_compared_at_same_conditions",
    manifest, ["baselines", "compared_at_same_conditions"],
    "compare later readings at the SAME conditions — deltas are the signal");

  // ---- Section 6: interface_and_protection ----
  boolCheck(results, "interface_and_protection",
    "mechanical_data_in_asset_record", manifest,
    ["interface", "mechanical_data_in_asset_record"],
    "quality gate: mechanical data (ratios/diameters) in the asset record");
  boolCheck(results, "interface_and_protection",
    "mechanical_electrical_data_single_source", manifest,
    ["interface", "data_shared_single_source"],
    "interface discipline: mechanical↔electrical data shared (coupling, ratios, sheave diameters) — one source of truth");
  const [changed, hasChanged] = getPath(manifest, "interface", "changes_made");
  const [revalidated, hasRevalidated] = getPath(manifest, "interface", "changes_revalidated");
  if (hasChanged && pyTruthy(changed)) {
    check(results, "interface_and_protection",
      "changes_revalidated_on_both_sides",
      revalidated, hasRevalidated, revalidated === true,
      "changes on either side re-validated");
  } else {
    check(results, "interface_and_protection",
      "changes_revalidated_on_both_sides",
      changed, hasChanged, true, "no interface change declared");
  }
  falseCheck(results, "interface_and_protection",
    "no_protection_change_without_engineering_review", manifest,
    ["protection", "protection_changed_without_engineering_review"],
    "skill red line: no protection changes (min flow, overload class) without engineering review");

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
    verdict = "NOT_SUITABLE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SUITABLE";
  }

  const exceededFlags = [drivesExceeded, pumpExceeded, conveyorExceeded];
  let suitabilityStatus: string | null;
  if (exceededFlags.some((f) => f === true)) {
    suitabilityStatus = "not_suitable_on_declared_values";
  } else if (exceededFlags.every((f) => f === false)) {
    suitabilityStatus = "suitable_on_declared_values";
  } else {
    suitabilityStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "pump-conveyor-motor-suitability-check",
    atom_version: "0.1.0",
    asset: manifest["asset"] ?? null,
    verdict,
    sections,
    checks: results,
    suitability_status: suitabilityStatus,
    min_power_margin_kw: fmt4(powerMargin),
    min_running_torque_margin_nm: fmt4(torqueMargin),
    min_npsh_margin_m: fmt4(npshMargin),
    min_starting_torque_margin_nm: fmt4(startingMargin),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PUMP CONVEYOR MOTOR SUITABILITY CHECK",
    `asset: ${pyStr(verdict.asset ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(25)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
