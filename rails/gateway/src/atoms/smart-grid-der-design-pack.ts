// Smart grid DER design pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/smart-grid-der-design-pack/src/smart_grid_der_design_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed quantities use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  architecture: {
    single_line_diagram_recorded: "boolean",
    comms_diagram_paired: "boolean",
    five_layers_mapped: "boolean",
    ieee_1547_cited: "boolean",
    iec_61850_cited: "boolean",
    der_dr_protocol_cited: "boolean",
    cim_model_cited: "boolean",
    clause_level_citations_where_claims_matter: "boolean",
  },
  network_model: {
    gis_power_flow_model_recorded: "boolean",
    point_list_derived_from_model: "boolean",
    control_loops_derived_from_point_list: "boolean",
  },
  telemetry_points: [{
    point_id: "string",
    purpose_recorded: "boolean",
    units_recorded: "boolean",
    latency_class_recorded: "boolean",
    owner_recorded: "boolean",
  }],
  der: {
    hosting_capacity_study_recorded: "boolean",
    hosting_capacity_kw: "number",
    protection_coordination_min_max_der: "boolean",
    inverter_dominance_protection_addressed: "boolean",
    islanding_addressed: "boolean",
    black_start_addressed: "boolean",
    point_of_interconnection_recorded: "boolean",
  },
  der_units: [{
    unit_id: "string",
    capacity_kw: "number",
    ride_through_declared: "boolean",
    anti_islanding_declared: "boolean",
  }],
  latency: {
    tiers_distinguished: "boolean",
  },
  control_loops: [{
    loop_id: "string",
    latency_tier: "string",
    latency_budget_declared: "boolean",
    shares_path_with_other_tiers: "boolean",
    tier_mixing_justification_recorded: "boolean",
  }],
  cyber: {
    purdue_segmentation_documented: "boolean",
    unidirectional_gateway_telemetry_egress: "boolean",
    key_management_documented: "boolean",
    patching_windows_documented: "boolean",
    incident_fallback_safe_state_documented: "boolean",
    posture_against_recognized_framework: "boolean",
  },
  pilot: {
    measurable_outcomes_before_deployment: "boolean",
    exit_criteria_before_deployment: "boolean",
    capabilities_staged: "boolean",
    safe_fallback_specified: "boolean",
    kpis_and_fallback_before_energization: "boolean",
  },
  economics: {
    cost_stack_recorded: "boolean",
    rate_treatment_and_incentives_recorded: "boolean",
    operational_authority_in_writing: "boolean",
  },
  review: {
    architecture_reviewed_by_qualified_peng: "boolean",
  },
  red_lines: {
    protection_setting_changed_without_coordination_study_present: "boolean",
    safety_disabled_for_demo_present: "boolean",
    flat_it_ot_network_present: "boolean",
    field_change_without_switching_authority_clarity_present: "boolean",
    vendor_lockin_without_export_exit_plan_present: "boolean",
    customer_data_without_consent_present: "boolean",
  },
};

export const SECTIONS = [
  "layered_architecture_and_standards",
  "network_model_and_telemetry_points",
  "der_interconnection_and_protection",
  "latency_tiers_and_control_loops",
  "ot_cybersecurity",
  "pilot_economics_and_authority",
  "red_lines",
] as const;

const LATENCY_TIERS = ["protection", "control", "analytics"];

const POINT_ATTRS = [
  "purpose_recorded",
  "units_recorded",
  "latency_class_recorded",
  "owner_recorded",
];

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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  telemetry_points_count: number | null;
  telemetry_points_incomplete: string[] | null;
  telemetry_points_complete_share: string | null;
  duplicate_telemetry_point_ids: string[] | null;
  der_units_count: number | null;
  der_units_without_ride_through_or_anti_islanding: string[] | null;
  der_total_capacity_kw: string | null;
  declared_hosting_capacity_kw: string | null;
  hosting_capacity_margin_kw: string | null;
  control_loops_count: number | null;
  control_loops_without_latency_budget: string[] | null;
  control_loops_with_invalid_latency_tier: string[] | null;
  control_loops_with_unjustified_shared_path: string[] | null;
  duplicate_control_loop_ids: string[] | null;
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

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) {
        dups.push(nm);
      }
      seen.push(nm);
    }
  }
  return dups;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [pointsRaw, hasPoints] = getPath(manifest, "telemetry_points");
  const pointsIsList = hasPoints && Array.isArray(pointsRaw);
  const pointRows: unknown[] = pointsIsList ? (pointsRaw as unknown[]) : [];
  const pointsCount: number | null = pointsIsList ? pointRows.length : null;

  const [unitsRaw, hasUnits] = getPath(manifest, "der_units");
  const unitsIsList = hasUnits && Array.isArray(unitsRaw);
  const unitRows: unknown[] = unitsIsList ? (unitsRaw as unknown[]) : [];
  const unitsCount: number | null = unitsIsList ? unitRows.length : null;

  const [loopsRaw, hasLoops] = getPath(manifest, "control_loops");
  const loopsIsList = hasLoops && Array.isArray(loopsRaw);
  const loopRows: unknown[] = loopsIsList ? (loopsRaw as unknown[]) : [];
  const loopsCount: number | null = loopsIsList ? loopRows.length : null;

  const [hostingRaw, hasHosting] = getPath(manifest, "der", "hosting_capacity_kw");
  const hostingKw: number | null =
    hasHosting && typeof hostingRaw === "number" ? hostingRaw : null;

  const pointsIncomplete: string[] | null = pointsIsList
    ? pointRows.filter((c) => isPyDict(c) &&
        POINT_ATTRS.some((a) => hasField(c, a) && c[a] !== true))
        .map((c) => rowName(c, "point_id"))
    : null;
  const duplicatePointIds: string[] | null = pointsIsList
    ? duplicates(pointRows, "point_id")
    : null;
  const pointsCompleteShare: number | null =
    pointsIsList && pointsCount !== null && pointsCount > 0
      ? pointRows.filter((c) => isPyDict(c) &&
          POINT_ATTRS.every((a) => c[a] === true)).length / pointsCount
      : null;

  const unitsWithoutRideOrAnti: string[] | null = unitsIsList
    ? unitRows.filter((c) => isPyDict(c) &&
        ((hasField(c, "ride_through_declared") &&
          c["ride_through_declared"] !== true) ||
         (hasField(c, "anti_islanding_declared") &&
          c["anti_islanding_declared"] !== true)))
        .map((c) => rowName(c, "unit_id"))
    : null;
  const capacitiesComplete = unitsIsList &&
    unitRows.every((c) => hasField(c, "capacity_kw"));
  let derTotalKw: number | null = null;
  if (capacitiesComplete) {
    derTotalKw = 0;
    for (const c of unitRows) {
      derTotalKw += (c as Record<string, unknown>)["capacity_kw"] as number;
    }
  }
  const hostingMarginKw: number | null =
    hasHosting && hostingKw !== null && derTotalKw !== null
      ? hostingKw - derTotalKw
      : null;

  const loopsWithoutBudget: string[] | null = loopsIsList
    ? loopRows.filter((c) => hasField(c, "latency_budget_declared") &&
        (c as Record<string, unknown>)["latency_budget_declared"] !== true)
        .map((c) => rowName(c, "loop_id"))
    : null;
  const loopsWithInvalidTier: string[] | null = loopsIsList
    ? loopRows.filter((c) => hasField(c, "latency_tier") &&
        !LATENCY_TIERS.includes(
          (c as Record<string, unknown>)["latency_tier"] as string))
        .map((c) => rowName(c, "loop_id"))
    : null;
  const loopsUnjustifiedShared: string[] | null = loopsIsList
    ? loopRows.filter((c) => isPyDict(c) &&
        c["shares_path_with_other_tiers"] === true &&
        hasField(c, "tier_mixing_justification_recorded") &&
        c["tier_mixing_justification_recorded"] !== true)
        .map((c) => rowName(c, "loop_id"))
    : null;
  const duplicateLoopIds: string[] | null = loopsIsList
    ? duplicates(loopRows, "loop_id")
    : null;

  // ---- Section 1: layered_architecture_and_standards ----
  boolCheck(results, "layered_architecture_and_standards",
    "sg_single_line_diagram_recorded", manifest,
    ["architecture", "single_line_diagram_recorded"],
    "architecture: a single-line diagram is recorded for the declared design");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_comms_diagram_paired_with_single_line", manifest,
    ["architecture", "comms_diagram_paired"],
    "architecture: a communications diagram is paired with the single-line diagram");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_five_layer_architecture_mapped", manifest,
    ["architecture", "five_layers_mapped"],
    "architecture: all five layers are mapped — primary equipment, protection & control, communications, platforms, programs & markets");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_ieee_1547_interconnection_standard_cited", manifest,
    ["architecture", "ieee_1547_cited"],
    "standards map: IEEE 1547 (interconnection) is cited");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_iec_61850_substation_standard_cited", manifest,
    ["architecture", "iec_61850_cited"],
    "standards map: IEC 61850 (substation) is cited");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_der_dr_protocol_standard_cited", manifest,
    ["architecture", "der_dr_protocol_cited"],
    "standards map: IEEE 2030.5 / OpenADR (DER & DR) is cited");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_cim_model_standard_cited", manifest,
    ["architecture", "cim_model_cited"],
    "standards map: CIM (models) is cited");
  boolCheck(results, "layered_architecture_and_standards",
    "sg_clause_level_citation_where_claims_matter", manifest,
    ["architecture", "clause_level_citations_where_claims_matter"],
    "standards map: clause-level citation is recorded where claims matter");

  // ---- Section 2: network_model_and_telemetry_points ----
  boolCheck(results, "network_model_and_telemetry_points",
    "sg_network_model_from_gis_and_power_flow", manifest,
    ["network_model", "gis_power_flow_model_recorded"],
    "network model: a GIS + power-flow network model is recorded");
  boolCheck(results, "network_model_and_telemetry_points",
    "sg_point_list_derived_from_network_model", manifest,
    ["network_model", "point_list_derived_from_model"],
    "network model: the telemetry point list is derived from the network model");
  boolCheck(results, "network_model_and_telemetry_points",
    "sg_control_loops_derived_from_point_list", manifest,
    ["network_model", "control_loops_derived_from_point_list"],
    "network model: the control loops are derived from the point list");
  check(results, "network_model_and_telemetry_points",
    "sg_telemetry_points_declared", pointsRaw, pointsIsList,
    pointsIsList,
    "the declared record names its telemetry points — the telemetry_points list is present; an empty list declares that the record contains no telemetry points");
  const attrsPresent = pointsIsList &&
    pointRows.every((c) => isPyDict(c) &&
      POINT_ATTRS.every((a) => hasField(c, a)));
  check(results, "network_model_and_telemetry_points",
    "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner",
    pointsRaw, attrsPresent,
    pointsIsList &&
      pointRows.every((c) => isPyDict(c) &&
        POINT_ATTRS.every((a) => c[a] === true)),
    "telemetry points: every declared point records its purpose, units, latency class and owner — every point has a purpose, units, latency class, and owner");
  const pointIdPresent = pointsIsList &&
    pointRows.every((c) => hasField(c, "point_id"));
  check(results, "network_model_and_telemetry_points",
    "sg_no_telemetry_point_id_duplicated", pointsRaw, pointIdPresent,
    pointsIsList && duplicatePointIds !== null &&
      duplicatePointIds.length === 0,
    "telemetry points: no declared point id is owned by more than one row");

  // ---- Section 3: der_interconnection_and_protection ----
  boolCheck(results, "der_interconnection_and_protection",
    "sg_hosting_capacity_study_recorded", manifest,
    ["der", "hosting_capacity_study_recorded"],
    "DER: a hosting-capacity study is recorded for the declared interconnection");
  boolCheck(results, "der_interconnection_and_protection",
    "sg_protection_coordination_across_min_max_der", manifest,
    ["der", "protection_coordination_min_max_der"],
    "DER: protection coordination is studied across min/max DER conditions");
  boolCheck(results, "der_interconnection_and_protection",
    "sg_inverter_dominance_protection_addressed", manifest,
    ["der", "inverter_dominance_protection_addressed"],
    "DER: protection coordination under inverter dominance is addressed");
  boolCheck(results, "der_interconnection_and_protection",
    "sg_islanding_formation_and_detection_addressed", manifest,
    ["der", "islanding_addressed"],
    "DER: islanding / island formation and detection are addressed");
  boolCheck(results, "der_interconnection_and_protection",
    "sg_black_start_requirement_addressed", manifest,
    ["der", "black_start_addressed"],
    "DER: black-start needs are addressed");
  boolCheck(results, "der_interconnection_and_protection",
    "sg_point_of_interconnection_recorded", manifest,
    ["der", "point_of_interconnection_recorded"],
    "DER: the point of interconnection is recorded");
  check(results, "der_interconnection_and_protection",
    "sg_der_units_declared", unitsRaw, unitsIsList,
    unitsIsList,
    "the declared record names its DER units — the der_units list is present; an empty list declares that the record contains no DER units");
  const ridePresent = unitsIsList &&
    unitRows.every((c) => hasField(c, "ride_through_declared") &&
      hasField(c, "anti_islanding_declared"));
  check(results, "der_interconnection_and_protection",
    "sg_every_der_unit_declares_ride_through_and_anti_islanding",
    unitsRaw, ridePresent,
    unitsIsList &&
      unitRows.every((c) => isPyDict(c) &&
        c["ride_through_declared"] === true &&
        c["anti_islanding_declared"] === true),
    "DER units: every declared unit declares ride-through and anti-islanding");
  const hostingPresent = capacitiesComplete && hasHosting;
  check(results, "der_interconnection_and_protection",
    "sg_der_total_capacity_within_declared_hosting_capacity",
    unitsRaw, hostingPresent,
    hostingPresent && derTotalKw !== null && hostingKw !== null &&
      derTotalKw <= hostingKw,
    "DER units: the declared aggregate DER capacity does not exceed the hosting capacity the record itself declares — the limit is the caller's declared study result, not a number this atom supplies");

  // ---- Section 4: latency_tiers_and_control_loops ----
  boolCheck(results, "latency_tiers_and_control_loops",
    "sg_latency_tiers_distinguished", manifest,
    ["latency", "tiers_distinguished"],
    "latency: the protection / control / analytics latency tiers are distinguished in the record");
  check(results, "latency_tiers_and_control_loops",
    "sg_control_loops_declared", loopsRaw, loopsIsList,
    loopsIsList,
    "the declared record names its control loops — the control_loops list is present; an empty list declares that the record contains no control loops");
  const budgetPresent = loopsIsList &&
    loopRows.every((c) => hasField(c, "latency_budget_declared"));
  check(results, "latency_tiers_and_control_loops",
    "sg_every_control_loop_declares_latency_budget", loopsRaw,
    budgetPresent,
    loopsIsList &&
      loopRows.every((c) => isPyDict(c) &&
        c["latency_budget_declared"] === true),
    "control loops: every declared loop states a latency budget");
  const tierPresent = loopsIsList &&
    loopRows.every((c) => hasField(c, "latency_tier"));
  check(results, "latency_tiers_and_control_loops",
    "sg_every_control_loop_declares_recognized_latency_tier", loopsRaw,
    tierPresent,
    loopsIsList &&
      loopRows.every((c) => isPyDict(c) &&
        LATENCY_TIERS.includes(c["latency_tier"] as string)),
    "control loops: every declared loop declares one of the skill's three latency tiers — protection, control or analytics");
  const sharedPresent = loopsIsList &&
    loopRows.every((c) => isPyDict(c) &&
      hasField(c, "shares_path_with_other_tiers") &&
      (c["shares_path_with_other_tiers"] !== true ||
        hasField(c, "tier_mixing_justification_recorded")));
  check(results, "latency_tiers_and_control_loops",
    "sg_shared_path_loops_carry_tier_mixing_justification", loopsRaw,
    sharedPresent,
    loopsIsList &&
      loopRows.every((c) => isPyDict(c) &&
        (c["shares_path_with_other_tiers"] !== true ||
          c["tier_mixing_justification_recorded"] === true)),
    "control loops: every loop that mixes tier traffic on one path records a justification — tier traffic is never mixed on one path without justification");
  const loopIdPresent = loopsIsList &&
    loopRows.every((c) => hasField(c, "loop_id"));
  check(results, "latency_tiers_and_control_loops",
    "sg_no_control_loop_id_duplicated", loopsRaw, loopIdPresent,
    loopsIsList && duplicateLoopIds !== null &&
      duplicateLoopIds.length === 0,
    "control loops: no declared loop id is owned by more than one row");

  // ---- Section 5: ot_cybersecurity ----
  boolCheck(results, "ot_cybersecurity",
    "sg_purdue_style_segmentation_documented", manifest,
    ["cyber", "purdue_segmentation_documented"],
    "cyber: Purdue-style segmentation is documented");
  boolCheck(results, "ot_cybersecurity",
    "sg_unidirectional_gateway_for_telemetry_egress", manifest,
    ["cyber", "unidirectional_gateway_telemetry_egress"],
    "cyber: a unidirectional gateway is used for telemetry egress");
  boolCheck(results, "ot_cybersecurity",
    "sg_cyber_key_management_documented", manifest,
    ["cyber", "key_management_documented"],
    "cyber: key management is documented");
  boolCheck(results, "ot_cybersecurity",
    "sg_patching_windows_documented", manifest,
    ["cyber", "patching_windows_documented"],
    "cyber: patching windows are documented");
  boolCheck(results, "ot_cybersecurity",
    "sg_incident_fallback_to_safe_state_documented", manifest,
    ["cyber", "incident_fallback_safe_state_documented"],
    "cyber: incident fallback to a safe state is documented");
  boolCheck(results, "ot_cybersecurity",
    "sg_cyber_posture_against_recognized_framework", manifest,
    ["cyber", "posture_against_recognized_framework"],
    "cyber: the cyber posture is documented against a recognized framework");

  // ---- Section 6: pilot_economics_and_authority ----
  boolCheck(results, "pilot_economics_and_authority",
    "sg_pilot_measurable_outcomes_defined_before_deployment", manifest,
    ["pilot", "measurable_outcomes_before_deployment"],
    "pilot: measurable outcomes are defined before deployment");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_pilot_exit_criteria_defined_before_deployment", manifest,
    ["pilot", "exit_criteria_before_deployment"],
    "pilot: exit criteria are defined before deployment");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_pilot_capabilities_staged", manifest,
    ["pilot", "capabilities_staged"],
    "pilot: capabilities are staged");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_safe_fallback_behavior_specified", manifest,
    ["pilot", "safe_fallback_specified"],
    "pilot: the safe fallback behavior is specified");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_pilot_kpis_and_fallback_before_energization", manifest,
    ["pilot", "kpis_and_fallback_before_energization"],
    "pilot: pilot KPIs and fallback behavior are defined before energization");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_cost_stack_recorded", manifest,
    ["economics", "cost_stack_recorded"],
    "economics: the cost stack is recorded");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_rate_treatment_and_incentives_recorded", manifest,
    ["economics", "rate_treatment_and_incentives_recorded"],
    "economics: rate treatment and incentives are recorded");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_operational_authority_who_opens_breaker_in_writing", manifest,
    ["economics", "operational_authority_in_writing"],
    "economics: operational authority — who opens the breaker — is clarified in writing");
  boolCheck(results, "pilot_economics_and_authority",
    "sg_architecture_reviewed_by_qualified_peng_recorded", manifest,
    ["review", "architecture_reviewed_by_qualified_peng"],
    "review: the single-line + communications architecture is recorded as reviewed by a qualified P.Eng — a caller declaration this atom records, never a review it performs or verifies");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "sg_no_protection_setting_change_without_coordination_study", manifest,
    ["red_lines", "protection_setting_changed_without_coordination_study_present"],
    "red line: no protection setting change without a coordination study is present in the record");
  falseCheck(results, "red_lines",
    "sg_no_safety_disabled_for_demos", manifest,
    ["red_lines", "safety_disabled_for_demo_present"],
    "red line: no safety disabled for demos is present in the record");
  falseCheck(results, "red_lines",
    "sg_no_flat_it_ot_network", manifest,
    ["red_lines", "flat_it_ot_network_present"],
    "red line: no flat IT/OT network is present in the record");
  falseCheck(results, "red_lines",
    "sg_no_field_change_without_switching_authority_clarity", manifest,
    ["red_lines", "field_change_without_switching_authority_clarity_present"],
    "red line: no field change without switching authority clarity is present in the record");
  falseCheck(results, "red_lines",
    "sg_no_vendor_lockin_without_export_and_exit_plan", manifest,
    ["red_lines", "vendor_lockin_without_export_exit_plan_present"],
    "red line: no vendor lock-in without data export + exit plan is present in the record");
  falseCheck(results, "red_lines",
    "sg_no_customer_data_without_consent", manifest,
    ["red_lines", "customer_data_without_consent_present"],
    "red line: no customer data without consent is present in the record");

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
    verdict = "SMART_GRID_DER_DESIGN_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SMART_GRID_DER_DESIGN_PACK_READY";
  }

  const computedNames = [
    "sg_telemetry_points_declared",
    "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner",
    "sg_no_telemetry_point_id_duplicated",
    "sg_der_units_declared",
    "sg_every_der_unit_declares_ride_through_and_anti_islanding",
    "sg_der_total_capacity_within_declared_hosting_capacity",
    "sg_control_loops_declared",
    "sg_every_control_loop_declares_latency_budget",
    "sg_every_control_loop_declares_recognized_latency_tier",
    "sg_shared_path_loops_carry_tier_mixing_justification",
    "sg_no_control_loop_id_duplicated",
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
    service: "smart-grid-der-design-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    telemetry_points_count: pointsCount,
    telemetry_points_incomplete: pointsIncomplete,
    telemetry_points_complete_share: fmt6(pointsCompleteShare),
    duplicate_telemetry_point_ids: duplicatePointIds,
    der_units_count: unitsCount,
    der_units_without_ride_through_or_anti_islanding: unitsWithoutRideOrAnti,
    der_total_capacity_kw: fmt6(derTotalKw),
    declared_hosting_capacity_kw: fmt6(hasHosting ? hostingKw : null),
    hosting_capacity_margin_kw: fmt6(hostingMarginKw),
    control_loops_count: loopsCount,
    control_loops_without_latency_budget: loopsWithoutBudget,
    control_loops_with_invalid_latency_tier: loopsWithInvalidTier,
    control_loops_with_unjustified_shared_path: loopsUnjustifiedShared,
    duplicate_control_loop_ids: duplicateLoopIds,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SMART GRID DER DESIGN PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
