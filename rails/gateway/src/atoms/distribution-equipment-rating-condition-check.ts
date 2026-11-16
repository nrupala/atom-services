// Distribution equipment rating condition check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/distribution-equipment-rating-condition-check/src/distribution_equipment_rating_condition_check.py
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
  lineup: "string",
  ratings: {
    fault_study_current: "boolean",
    gaps_documented: "boolean",
  },
  equipment: [{
    id: "string",
    interrupting_rating_ka: "number",
    available_fault_current_ka: "number",
    continuous_current_rating_a: "number",
    load_current_a: "number",
  }],
  mcc: {
    section_bus_rating_verified: "boolean",
    starter_types_recorded: "boolean",
    segregation_and_barriers_verified: "boolean",
    heat_load_assessed: "boolean",
    planned_spare_capacity_recorded: "boolean",
    labeling_matches_lineup_drawing: "boolean",
  },
  switchgear: {
    breaker_relay_schemes_verified: "boolean",
    ct_ratios_and_wiring_checked: "boolean",
    trip_tests_per_plan: "boolean",
    interlock_function_tests_done: "boolean",
    torque_checks_per_oem: "boolean",
  },
  transformers: [{
    id: "string",
    nameplate_kva: "number",
    load_kva: "number",
    top_oil_temp_c: "number",
    top_oil_limit_c: "number",
    winding_temp_c: "number",
    winding_limit_c: "number",
    paralleled: "boolean",
    vector_group_match: "boolean",
    ratio_match: "boolean",
    impedance_match: "boolean",
  }],
  transformer: {
    tap_positions_recorded: "boolean",
    harmonic_rich_load: "boolean",
    k_factor_assessed: "boolean",
  },
  condition: {
    oil_dga_screening_on_schedule: "boolean",
    ir_scans_done: "boolean",
    audible_corona_logged_vs_baseline: "boolean",
  },
  coordination: {
    settings_labels_study_aligned: "boolean",
    equipment_changed: "boolean",
    study_refresh_flagged: "boolean",
    test_records_complete_with_instruments_and_calibration: "boolean",
    energized_work_outside_permit_system: "boolean",
  },
};

export const SECTIONS = [
  "ratings_vs_fault_study",
  "mcc_specifics",
  "switchgear_specifics",
  "transformers",
  "condition_awareness",
  "coordination_and_safety",
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
  lineup: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  rating_status: string | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function equipmentChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): boolean | null {
  const [equipment, hasEquipment] = getPath(manifest, "equipment");
  if (!hasEquipment || !Array.isArray(equipment) || equipment.length === 0) {
    check(results, "ratings_vs_fault_study",
      "interrupting_rating_covers_fault_current",
      equipment, false, false, "no equipment declared");
    check(results, "ratings_vs_fault_study",
      "continuous_current_rating_covers_load",
      equipment, false, false, "no equipment declared");
    return null;
  }
  let intIncomplete = false;
  let intViolating = false;
  let contIncomplete = false;
  let contViolating = false;
  for (const entry of equipment) {
    if (!isPyDict(entry)) {
      intIncomplete = true;
      contIncomplete = true;
      continue;
    }
    const [rating, hasRating] = getFrom(entry, "interrupting_rating_ka");
    const [fault, hasFault] = getFrom(entry, "available_fault_current_ka");
    if (!(hasRating && hasFault && isNumber(rating) && isNumber(fault))) {
      intIncomplete = true;
    } else if ((rating as number) < (fault as number)) {
      intViolating = true;
    }
    const [continuous, hasCont] = getFrom(entry, "continuous_current_rating_a");
    const [load, hasLoad] = getFrom(entry, "load_current_a");
    if (!(hasCont && hasLoad && isNumber(continuous) && isNumber(load))) {
      contIncomplete = true;
    } else if ((continuous as number) < (load as number)) {
      contViolating = true;
    }
  }
  if (intIncomplete) {
    check(results, "ratings_vs_fault_study",
      "interrupting_rating_covers_fault_current",
      equipment, false, false,
      "an equipment entry is missing its interrupting rating or available fault current");
  } else {
    check(results, "ratings_vs_fault_study",
      "interrupting_rating_covers_fault_current",
      equipment, true, !intViolating,
      "interrupting rating vs available fault current, from the current short-circuit study");
  }
  if (contIncomplete) {
    check(results, "ratings_vs_fault_study",
      "continuous_current_rating_covers_load",
      equipment, false, false,
      "an equipment entry is missing its continuous current rating or load current");
  } else {
    check(results, "ratings_vs_fault_study",
      "continuous_current_rating_covers_load",
      equipment, true, !contViolating,
      "continuous current rating covers the declared load current");
  }
  if (intIncomplete || contIncomplete) {
    return (intViolating || contViolating) ? true : null;
  }
  return intViolating || contViolating;
}

function transformerChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): boolean | null {
  const [transformers, hasTransformers] = getPath(manifest, "transformers");
  if (!hasTransformers || !Array.isArray(transformers) ||
      transformers.length === 0) {
    check(results, "transformers", "transformer_loading_within_nameplate",
      transformers, false, false, "no transformers declared");
    check(results, "transformers",
      "transformer_temperatures_within_declared_limits",
      transformers, false, false, "no transformers declared");
    check(results, "transformers", "paralleling_requirements_match",
      transformers, false, false, "no transformers declared");
    return null;
  }
  let loadIncomplete = false;
  let loadViolating = false;
  let tempIncomplete = false;
  let tempViolating = false;
  let parIncomplete = false;
  let parViolating = false;
  for (const entry of transformers) {
    if (!isPyDict(entry)) {
      loadIncomplete = true;
      tempIncomplete = true;
      parIncomplete = true;
      continue;
    }
    const [nameplate, hasNp] = getFrom(entry, "nameplate_kva");
    const [load, hasLoad] = getFrom(entry, "load_kva");
    if (!(hasNp && hasLoad && isNumber(nameplate) && isNumber(load))) {
      loadIncomplete = true;
    } else if ((load as number) > (nameplate as number)) {
      loadViolating = true;
    }
    const [oil, hasOil] = getFrom(entry, "top_oil_temp_c");
    const [oilLimit, hasOilLimit] = getFrom(entry, "top_oil_limit_c");
    const [winding, hasWinding] = getFrom(entry, "winding_temp_c");
    const [windingLimit, hasWindingLimit] = getFrom(entry, "winding_limit_c");
    if (!(hasOil && hasOilLimit && hasWinding && hasWindingLimit &&
          isNumber(oil) && isNumber(oilLimit) && isNumber(winding) &&
          isNumber(windingLimit))) {
      tempIncomplete = true;
    } else if ((oil as number) > (oilLimit as number) ||
               (winding as number) > (windingLimit as number)) {
      tempViolating = true;
    }
    const [paralleled, hasParalleled] = getFrom(entry, "paralleled");
    if (!hasParalleled) {
      parIncomplete = true;
    } else if (pyTruthy(paralleled)) {
      const [vector, hasVector] = getFrom(entry, "vector_group_match");
      const [ratio, hasRatio] = getFrom(entry, "ratio_match");
      const [impedance, hasImpedance] = getFrom(entry, "impedance_match");
      if (!(hasVector && hasRatio && hasImpedance)) {
        parIncomplete = true;
      } else if (!(vector === true && ratio === true && impedance === true)) {
        parViolating = true;
      }
    }
  }
  if (loadIncomplete) {
    check(results, "transformers", "transformer_loading_within_nameplate",
      transformers, false, false,
      "a transformer entry is missing its nameplate rating or load");
  } else {
    check(results, "transformers", "transformer_loading_within_nameplate",
      transformers, true, !loadViolating,
      "loading per nameplate — load does not exceed the nameplate rating");
  }
  if (tempIncomplete) {
    check(results, "transformers",
      "transformer_temperatures_within_declared_limits",
      transformers, false, false,
      "a transformer entry is missing its top-oil/winding temperatures or declared limits");
  } else {
    check(results, "transformers",
      "transformer_temperatures_within_declared_limits",
      transformers, true, !tempViolating,
      "top-oil and winding temperatures within the declared limits, with temperature context");
  }
  if (parIncomplete) {
    check(results, "transformers", "paralleling_requirements_match",
      transformers, false, false,
      "a transformer entry is missing its paralleled flag or paralleling match fields");
  } else {
    check(results, "transformers", "paralleling_requirements_match",
      transformers, true, !parViolating,
      "paralleling requires matching vector group/ratio/impedance — verify, never assume");
  }
  if (loadIncomplete || tempIncomplete) {
    return (loadViolating || tempViolating) ? true : null;
  }
  return loadViolating || tempViolating;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: ratings_vs_fault_study (skill method 1 + gate) ----
  boolCheck(results, "ratings_vs_fault_study",
    "ratings_verified_vs_current_fault_study", manifest,
    ["ratings", "fault_study_current"],
    "quality gate: ratings verified vs current fault study — voltage class, continuous current, interrupting rating, bus bracing — from a current short-circuit study, not memory");
  boolCheck(results, "ratings_vs_fault_study", "rating_gaps_documented",
    manifest, ["ratings", "gaps_documented"],
    "rating gaps against the fault study are documented");
  const equipmentExceeded = equipmentChecks(results, manifest);

  // ---- Section 2: mcc_specifics (skill method 2) ----
  boolCheck(results, "mcc_specifics", "section_bus_rating_verified",
    manifest, ["mcc", "section_bus_rating_verified"],
    "MCC section/bus rating verified");
  boolCheck(results, "mcc_specifics", "starter_types_recorded", manifest,
    ["mcc", "starter_types_recorded"],
    "starter types recorded (DOL/soft/VFD buckets)");
  boolCheck(results, "mcc_specifics", "segregation_and_barriers_verified",
    manifest, ["mcc", "segregation_and_barriers_verified"],
    "segregation and barriers verified");
  boolCheck(results, "mcc_specifics", "heat_load_assessed", manifest,
    ["mcc", "heat_load_assessed"], "heat load assessed");
  boolCheck(results, "mcc_specifics", "planned_spare_capacity_recorded",
    manifest, ["mcc", "planned_spare_capacity_recorded"],
    "planned spare capacity recorded");
  boolCheck(results, "mcc_specifics", "labeling_matches_lineup_drawing",
    manifest, ["mcc", "labeling_matches_lineup_drawing"],
    "labeling matches the line-up drawing");

  // ---- Section 3: switchgear_specifics (skill method 3) ----
  boolCheck(results, "switchgear_specifics",
    "breaker_relay_schemes_verified", manifest,
    ["switchgear", "breaker_relay_schemes_verified"],
    "breaker/relay schemes verified");
  boolCheck(results, "switchgear_specifics", "ct_ratios_and_wiring_checked",
    manifest, ["switchgear", "ct_ratios_and_wiring_checked"],
    "CT ratios + wiring checks done");
  boolCheck(results, "switchgear_specifics", "trip_tests_per_plan", manifest,
    ["switchgear", "trip_tests_per_plan"],
    "trip tests (primary/secondary injection per plan) done");
  boolCheck(results, "switchgear_specifics", "interlock_function_tests_done",
    manifest, ["switchgear", "interlock_function_tests_done"],
    "interlock function tests done");
  boolCheck(results, "switchgear_specifics", "torque_checks_per_oem",
    manifest, ["switchgear", "torque_checks_per_oem"],
    "torque checks per OEM — skill red line: no torque specs from memory; OEM procedures only");

  // ---- Section 4: transformers (skill method 4 + quality gate) ----
  const transformerExceeded = transformerChecks(results, manifest);
  boolCheck(results, "transformers", "tap_positions_recorded", manifest,
    ["transformer", "tap_positions_recorded"],
    "quality gate: tap position recorded");
  const [harmonic, hasHarmonic] = getPath(manifest, "transformer", "harmonic_rich_load");
  const [kFactor, hasKFactor] = getPath(manifest, "transformer", "k_factor_assessed");
  if (hasHarmonic && pyTruthy(harmonic)) {
    check(results, "transformers", "k_factor_assessed_for_harmonic_loads",
      kFactor, hasKFactor, kFactor === true,
      "K-factor assessed for harmonic-rich loads");
  } else {
    check(results, "transformers", "k_factor_assessed_for_harmonic_loads",
      harmonic, hasHarmonic, true, "no harmonic-rich load declared");
  }

  // ---- Section 5: condition_awareness (skill method 5) ----
  boolCheck(results, "condition_awareness", "oil_dga_screening_on_schedule",
    manifest, ["condition", "oil_dga_screening_on_schedule"],
    "transformer oil/DGA screening on schedule");
  boolCheck(results, "condition_awareness",
    "ir_scans_of_terminations_and_bus_done", manifest,
    ["condition", "ir_scans_done"],
    "IR scans of terminations/bus done");
  boolCheck(results, "condition_awareness",
    "audible_corona_observations_logged_vs_baseline", manifest,
    ["condition", "audible_corona_logged_vs_baseline"],
    "audible/corona observations logged vs baseline");

  // ---- Section 6: coordination_and_safety (method 6 + gates) ----
  boolCheck(results, "coordination_and_safety",
    "settings_labels_and_study_aligned", manifest,
    ["coordination", "settings_labels_study_aligned"],
    "quality gate: labels, settings, and drawings consistent — keep settings, labels, and the study aligned");
  const [changed, hasChanged] = getPath(manifest, "coordination", "equipment_changed");
  const [refresh, hasRefresh] = getPath(manifest, "coordination", "study_refresh_flagged");
  if (hasChanged && pyTruthy(changed)) {
    check(results, "coordination_and_safety",
      "study_refresh_flagged_when_equipment_changes",
      refresh, hasRefresh, refresh === true,
      "when equipment changes, flag a study refresh");
  } else {
    check(results, "coordination_and_safety",
      "study_refresh_flagged_when_equipment_changes",
      changed, hasChanged, true, "no equipment change declared");
  }
  boolCheck(results, "coordination_and_safety",
    "test_records_complete_with_calibration", manifest,
    ["coordination", "test_records_complete_with_instruments_and_calibration"],
    "quality gate: test/inspection records complete with instruments + calibration; records archived");
  const [energized, hasEnergized] = getPath(
    manifest, "coordination", "energized_work_outside_permit_system");
  check(results, "coordination_and_safety",
    "no_energized_work_outside_permit_system",
    energized, hasEnergized, energized === false,
    "skill red line: no energized work outside the site permit/PPE system");

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
    verdict = "RATING_CONDITION_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RATING_CONDITION_SOUND";
  }

  const exceededFlags = [equipmentExceeded, transformerExceeded];
  let ratingStatus: string | null;
  if (exceededFlags.some((f) => f === true)) {
    ratingStatus = "exceeded";
  } else if (exceededFlags.every((f) => f === false)) {
    ratingStatus = "within_declared_ratings";
  } else {
    ratingStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "distribution-equipment-rating-condition-check",
    atom_version: "0.1.0",
    lineup: manifest["lineup"] ?? null,
    verdict,
    sections,
    checks: results,
    rating_status: ratingStatus,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DISTRIBUTION EQUIPMENT RATING CONDITION CHECK",
    `lineup: ${pyStr(verdict.lineup ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
