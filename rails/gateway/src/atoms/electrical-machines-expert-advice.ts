// Electrical machines expert advice — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/electrical-machines-expert-advice/src/
// electrical_machines_expert_advice.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (machine.machine_family, drives.control_mode,
// machine.dc_excitation_type) are validated as "string" only,
// never enum-checked here.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  advice_id: "string",
  engagement: {
    question_or_problem_stated: "boolean",
    operating_context_stated: "boolean",
    assumptions_stated_explicitly: "boolean",
    protection_and_safety_not_handwaved: "boolean",
  },
  machine: {
    machine_family: "string",
    full_load_current_a: "number",
    starting_current_a: "number",
    induction_slip_or_equivalent_circuit_addressed: "boolean",
    induction_torque_speed_addressed: "boolean",
    induction_losses_or_efficiency_addressed: "boolean",
    synchronous_excitation_or_avr_addressed: "boolean",
    synchronous_capability_or_power_angle_addressed: "boolean",
    synchronous_synchronization_addressed: "boolean",
    transformer_vector_group_or_impedance_addressed: "boolean",
    transformer_inrush_tap_cooling_addressed: "boolean",
    transformer_thermal_aging_addressed: "boolean",
    dc_excitation_type: "string",
    dc_retrofit_or_legacy_context_addressed: "boolean",
  },
  drives: {
    vfd_involved: "boolean",
    control_mode: "string",
    harmonics_addressed: "boolean",
    reflected_wave_dvdt_addressed: "boolean",
    bearing_currents_addressed: "boolean",
    cable_charging_addressed: "boolean",
  },
  protection: {
    protection_in_scope: "boolean",
    selectivity_coordination_addressed: "boolean",
    primary_and_backup_addressed: "boolean",
    ansi_device_numbers: ["string"],
    ct_pt_selection_saturation_burden_addressed: "boolean",
    idmt_curves_and_grading_addressed: "boolean",
    final_settings_deferred_to_study: "boolean",
    settings_published_as_fact: "boolean",
  },
  standards: {
    applicable_standards_named: "boolean",
    standards_applicability_reasons_stated: "boolean",
    hazardous_area_involved: "boolean",
    hazloc_zone_or_division_stated: "boolean",
    hazloc_gas_group_and_temp_class_stated: "boolean",
    hazloc_ex_method_and_certification_stated: "boolean",
  },
  calculations: {
    calculations_relied_upon: "boolean",
    short_circuit_addressed: "boolean",
    motor_starting_voltage_dip_addressed: "boolean",
    grounding_addressed: "boolean",
    load_flow_addressed: "boolean",
    arc_flash_addressed: "boolean",
  },
  documents: {
    document_review_in_scope: "boolean",
    sow_addressed: "boolean",
    sdrl_addressed: "boolean",
    sqrl_addressed: "boolean",
    supplier_qualification_addressed: "boolean",
    going_public: "boolean",
    public_sanitization_applied: "boolean",
  },
};

export const SECTIONS = [
  "engagement",
  "machine_analysis",
  "drives",
  "protection",
  "standards_and_hazloc",
  "calculations",
  "documents_and_disclosure",
] as const;

export const MACHINE_FAMILIES = ["induction", "synchronous", "transformer", "dc"] as const;
export const CONTROL_MODES = ["vf", "sensorless_vector", "closed_loop_vector"] as const;
export const DC_EXCITATION_TYPES = ["separately_excited", "series", "shunt"] as const;
export const ANSI_DEVICE_NUMBERS = [
  "50", "51", "87", "27", "59", "81", "49", "46", "32", "25", "86",
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
  advice_id: unknown;
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  gateOn: boolean,
  naEvidence: string,
  evidence: string,
): void {
  if (gateOn) {
    boolCheck(results, section, name, manifest, path, evidence);
  } else {
    check(results, section, name, null, true, true, naEvidence);
  }
}

function gatedEnumCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  allowed: readonly string[],
  gateOn: boolean,
  naEvidence: string,
  evidence: string,
): void {
  if (gateOn) {
    enumCheck(results, section, name, manifest, path, allowed, evidence);
  } else {
    check(results, section, name, null, true, true, naEvidence);
  }
}

function familyGate(
  manifest: Record<string, unknown>,
  family: string,
): boolean {
  const [value, present] = getPath(manifest, "machine", "machine_family");
  return present && value === family;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: engagement ----
  boolCheck(results, "engagement", "question_or_problem_stated",
    manifest, ["engagement", "question_or_problem_stated"],
    "the question or problem the advice answers is stated");
  boolCheck(results, "engagement", "operating_context_stated",
    manifest, ["engagement", "operating_context_stated"],
    "the operating context the advice applies to is stated");
  boolCheck(results, "engagement", "assumptions_stated_explicitly",
    manifest, ["engagement", "assumptions_stated_explicitly"],
    "assumptions are stated explicitly — the skill requires assumptions shown, never buried");
  boolCheck(results, "engagement", "protection_and_safety_not_handwaved",
    manifest, ["engagement", "protection_and_safety_not_handwaved"],
    "protection and safety are addressed, never hand-waved (caller declaration; the atom does not judge the advice itself)");

  // ---- Section 2: machine_analysis ----
  enumCheck(results, "machine_analysis", "machine_family_named",
    manifest, ["machine", "machine_family"], MACHINE_FAMILIES,
    "machine family is one of induction / synchronous / transformer / dc — the skill's own machine vocabulary");
  const ind = familyGate(manifest, "induction");
  gatedBoolCheck(results, "machine_analysis",
    "induction_slip_or_equivalent_circuit_addressed", manifest,
    ["machine", "induction_slip_or_equivalent_circuit_addressed"], ind,
    "not applicable: declared machine family is not induction",
    "induction machines: equivalent circuit and slip are addressed");
  gatedBoolCheck(results, "machine_analysis",
    "induction_torque_speed_addressed", manifest,
    ["machine", "induction_torque_speed_addressed"], ind,
    "not applicable: declared machine family is not induction",
    "induction machines: the torque-speed curve is addressed");
  if (ind) {
    const [fla, hasFla] = getPath(manifest, "machine", "full_load_current_a");
    const [sta, hasSta] = getPath(manifest, "machine", "starting_current_a");
    const present = hasFla && hasSta;
    const ok = isNumber(fla) && isNumber(sta) &&
      (fla as number) > 0 && (sta as number) > 0;
    const evidence = ok
      ? "induction starting current recorded as a multiple of FLA (the skill states ~6x FLA as an approximation with no tolerance band, so the multiple is recorded, not graded): " +
        `${((sta as number) / (fla as number)).toFixed(6)} x FLA declared`
      : "induction starting current recorded as a multiple of FLA (the skill states ~6x FLA as an approximation with no tolerance band, so the multiple is recorded, not graded)";
    check(results, "machine_analysis",
      "induction_starting_current_multiple_recorded", sta, present, ok,
      evidence);
  } else {
    check(results, "machine_analysis",
      "induction_starting_current_multiple_recorded", null, true, true,
      "not applicable: declared machine family is not induction");
  }
  gatedBoolCheck(results, "machine_analysis",
    "induction_losses_or_efficiency_addressed", manifest,
    ["machine", "induction_losses_or_efficiency_addressed"], ind,
    "not applicable: declared machine family is not induction",
    "induction machines: efficiency and the loss breakdown (copper, iron, windage / friction, stray) are addressed");
  const syn = familyGate(manifest, "synchronous");
  gatedBoolCheck(results, "machine_analysis",
    "synchronous_excitation_or_avr_addressed", manifest,
    ["machine", "synchronous_excitation_or_avr_addressed"], syn,
    "not applicable: declared machine family is not synchronous",
    "synchronous machines: excitation and AVR are addressed");
  gatedBoolCheck(results, "machine_analysis",
    "synchronous_capability_or_power_angle_addressed", manifest,
    ["machine", "synchronous_capability_or_power_angle_addressed"], syn,
    "not applicable: declared machine family is not synchronous",
    "synchronous machines: the capability curve and power-angle behaviour (V-curves) are addressed");
  gatedBoolCheck(results, "machine_analysis",
    "synchronous_synchronization_addressed", manifest,
    ["machine", "synchronous_synchronization_addressed"], syn,
    "not applicable: declared machine family is not synchronous",
    "synchronous machines: synchronization is addressed");
  const trf = familyGate(manifest, "transformer");
  gatedBoolCheck(results, "machine_analysis",
    "transformer_vector_group_or_impedance_addressed", manifest,
    ["machine", "transformer_vector_group_or_impedance_addressed"], trf,
    "not applicable: declared machine family is not transformer",
    "transformers: vector group, per-unit and impedance are addressed");
  gatedBoolCheck(results, "machine_analysis",
    "transformer_inrush_tap_cooling_addressed", manifest,
    ["machine", "transformer_inrush_tap_cooling_addressed"], trf,
    "not applicable: declared machine family is not transformer",
    "transformers: inrush, tap changers and cooling classes are addressed");
  gatedBoolCheck(results, "machine_analysis",
    "transformer_thermal_aging_addressed", manifest,
    ["machine", "transformer_thermal_aging_addressed"], trf,
    "not applicable: declared machine family is not transformer",
    "transformers: thermal aging is addressed");
  const dc = familyGate(manifest, "dc");
  gatedEnumCheck(results, "machine_analysis", "dc_excitation_type_named",
    manifest, ["machine", "dc_excitation_type"], DC_EXCITATION_TYPES, dc,
    "not applicable: declared machine family is not dc",
    "DC machines: excitation type is one of separately_excited / series / shunt — the skill's own vocabulary");
  gatedBoolCheck(results, "machine_analysis",
    "dc_retrofit_or_legacy_context_addressed", manifest,
    ["machine", "dc_retrofit_or_legacy_context_addressed"], dc,
    "not applicable: declared machine family is not dc",
    "DC machines: the legacy / retrofit context is addressed");

  // ---- Section 3: drives ----
  const [vfd, hasVfd] = getPath(manifest, "drives", "vfd_involved");
  const vfdOn = hasVfd && vfd === true;
  const naVfd = "not applicable: no VFD declared involved";
  gatedEnumCheck(results, "drives", "control_mode_named", manifest,
    ["drives", "control_mode"], CONTROL_MODES, vfdOn, naVfd,
    "drive control mode is one of vf / sensorless_vector / closed_loop_vector — the skill's own vocabulary (V/f vs sensorless vector vs closed-loop vector control)");
  gatedBoolCheck(results, "drives", "harmonics_addressed", manifest,
    ["drives", "harmonics_addressed"], vfdOn, naVfd,
    "power quality: harmonics and their mitigation (line reactors, filters) are addressed");
  gatedBoolCheck(results, "drives", "reflected_wave_dvdt_addressed",
    manifest, ["drives", "reflected_wave_dvdt_addressed"], vfdOn, naVfd,
    "reflected-wave / dV/dt effects on long cables are addressed");
  gatedBoolCheck(results, "drives", "bearing_currents_addressed",
    manifest, ["drives", "bearing_currents_addressed"], vfdOn, naVfd,
    "bearing currents and shaft grounding are addressed");
  gatedBoolCheck(results, "drives", "cable_charging_addressed",
    manifest, ["drives", "cable_charging_addressed"], vfdOn, naVfd,
    "cable charging is addressed");

  // ---- Section 4: protection ----
  const [prot, hasProt] = getPath(manifest, "protection", "protection_in_scope");
  const protOn = hasProt && prot === true;
  const naProt = "not applicable: protection not declared in scope";
  gatedBoolCheck(results, "protection",
    "selectivity_coordination_addressed", manifest,
    ["protection", "selectivity_coordination_addressed"], protOn, naProt,
    "selectivity / coordination is addressed");
  gatedBoolCheck(results, "protection", "primary_and_backup_addressed",
    manifest, ["protection", "primary_and_backup_addressed"], protOn,
    naProt,
    "primary + backup protection and the fail-safe / dependability-vs-security balance are addressed");
  if (protOn) {
    const [numbers, present] = getPath(manifest, "protection",
      "ansi_device_numbers");
    const ok = Array.isArray(numbers) && numbers.length > 0 &&
      numbers.every((n) =>
        typeof n === "string" &&
        (ANSI_DEVICE_NUMBERS as readonly string[]).includes(n));
    check(results, "protection", "ansi_device_numbers_valid", numbers,
      present, ok,
      "every declared ANSI device number is in the skill's own list (50/51, 87, 27/59, 81, 49, 46, 32, 25, 86)");
  } else {
    check(results, "protection", "ansi_device_numbers_valid", null, true,
      true, naProt);
  }
  gatedBoolCheck(results, "protection",
    "ct_pt_selection_saturation_burden_addressed", manifest,
    ["protection", "ct_pt_selection_saturation_burden_addressed"],
    protOn, naProt,
    "CT / PT selection, saturation and burden are addressed");
  gatedBoolCheck(results, "protection",
    "idmt_curves_and_grading_addressed", manifest,
    ["protection", "idmt_curves_and_grading_addressed"], protOn, naProt,
    "IDMT curves and grading are addressed (differential and distance principles where relied upon)");
  boolCheck(results, "protection", "final_settings_deferred_to_study",
    manifest, ["protection", "final_settings_deferred_to_study"],
    "standing rule: final settings are deferred to a documented coordination / arc-flash study");
  falseCheck(results, "protection", "settings_not_published_as_fact",
    manifest, ["protection", "settings_published_as_fact"],
    "standing rule: settings are not published as fact — assumptions are stated explicitly instead");

  // ---- Section 5: standards_and_hazloc ----
  boolCheck(results, "standards_and_hazloc", "applicable_standards_named",
    manifest, ["standards", "applicable_standards_named"],
    "applicable standards are named (IEEE, IEC, CSA, the Canadian Electrical Code, APEGA obligations in the skill)");
  boolCheck(results, "standards_and_hazloc",
    "standards_applicability_reasons_stated", manifest,
    ["standards", "standards_applicability_reasons_stated"],
    "which standards do / do not apply to the scope, and why, is stated");
  const [haz, hasHaz] = getPath(manifest, "standards", "hazardous_area_involved");
  const hazOn = hasHaz && haz === true;
  const naHaz = "not applicable: no hazardous area declared involved";
  gatedBoolCheck(results, "standards_and_hazloc",
    "hazloc_zone_or_division_stated", manifest,
    ["standards", "hazloc_zone_or_division_stated"], hazOn, naHaz,
    "hazardous-area classification: zone / division is stated");
  gatedBoolCheck(results, "standards_and_hazloc",
    "hazloc_gas_group_and_temp_class_stated", manifest,
    ["standards", "hazloc_gas_group_and_temp_class_stated"], hazOn, naHaz,
    "hazardous-area classification: gas group and temperature class are stated");
  gatedBoolCheck(results, "standards_and_hazloc",
    "hazloc_ex_method_and_certification_stated", manifest,
    ["standards", "hazloc_ex_method_and_certification_stated"], hazOn,
    naHaz,
    "Ex protection method (Ex d / e / i) and IECEx / CSA certification are stated");

  // ---- Section 6: calculations ----
  const [calc, hasCalc] = getPath(manifest, "calculations",
    "calculations_relied_upon");
  const calcOn = hasCalc && calc === true;
  const naCalc = "not applicable: no calculations declared relied upon";
  gatedBoolCheck(results, "calculations", "short_circuit_addressed",
    manifest, ["calculations", "short_circuit_addressed"], calcOn, naCalc,
    "calculations kept honest: short-circuit is addressed");
  gatedBoolCheck(results, "calculations",
    "motor_starting_voltage_dip_addressed", manifest,
    ["calculations", "motor_starting_voltage_dip_addressed"], calcOn,
    naCalc,
    "calculations kept honest: motor-starting voltage dip is addressed");
  gatedBoolCheck(results, "calculations", "grounding_addressed",
    manifest, ["calculations", "grounding_addressed"], calcOn, naCalc,
    "calculations kept honest: grounding is addressed");
  gatedBoolCheck(results, "calculations", "load_flow_addressed",
    manifest, ["calculations", "load_flow_addressed"], calcOn, naCalc,
    "calculations kept honest: load flow basics are addressed");
  gatedBoolCheck(results, "calculations", "arc_flash_addressed",
    manifest, ["calculations", "arc_flash_addressed"], calcOn, naCalc,
    "calculations kept honest: arc-flash incident energy is addressed");

  // ---- Section 7: documents_and_disclosure ----
  const [doc, hasDoc] = getPath(manifest, "documents",
    "document_review_in_scope");
  const docOn = hasDoc && doc === true;
  const naDoc = "not applicable: no document review declared in scope";
  gatedBoolCheck(results, "documents_and_disclosure", "sow_addressed",
    manifest, ["documents", "sow_addressed"], docOn, naDoc,
    "document workflow: the scope of work (SoW) is addressed");
  gatedBoolCheck(results, "documents_and_disclosure", "sdrl_addressed",
    manifest, ["documents", "sdrl_addressed"], docOn, naDoc,
    "document workflow: the supplier document requirements list (SDRL) is addressed — expected with the proposal");
  gatedBoolCheck(results, "documents_and_disclosure", "sqrl_addressed",
    manifest, ["documents", "sqrl_addressed"], docOn, naDoc,
    "document workflow: the supplier quality requirements list (SQRL) is addressed — expected with the proposal");
  gatedBoolCheck(results, "documents_and_disclosure",
    "supplier_qualification_addressed", manifest,
    ["documents", "supplier_qualification_addressed"], docOn, naDoc,
    "document workflow: supplier qualification is addressed");
  const [pub, hasPub] = getPath(manifest, "documents", "going_public");
  const pubOn = hasPub && pub === true;
  gatedBoolCheck(results, "documents_and_disclosure",
    "public_sanitization_applied", manifest,
    ["documents", "public_sanitization_applied"], pubOn,
    "not applicable: content not declared as going public",
    "content going public: the public-sanitization rules are declared applied (internal / work content otherwise keeps its real detail)");

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
    service: "electrical-machines-expert-advice",
    atom_version: "0.1.0",
    advice_id: manifest["advice_id"] ?? null,
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
    "ELECTRICAL-MACHINES EXPERT ADVICE",
    `advice_id: ${pyStr(verdict.advice_id ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
