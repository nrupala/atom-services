import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/smart-grid-der-design-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "feeder-12-der-pilot",
  architecture: {
    single_line_diagram_recorded: true,
    comms_diagram_paired: true,
    five_layers_mapped: true,
    ieee_1547_cited: true,
    iec_61850_cited: true,
    der_dr_protocol_cited: true,
    cim_model_cited: true,
    clause_level_citations_where_claims_matter: true },
  network_model: {
    gis_power_flow_model_recorded: true,
    point_list_derived_from_model: true,
    control_loops_derived_from_point_list: true },
  telemetry_points: [
    { point_id: "FDR12.VOLT.A", purpose_recorded: true,
      units_recorded: true, latency_class_recorded: true,
      owner_recorded: true },
    { point_id: "FDR12.DER.SOC", purpose_recorded: true,
      units_recorded: true, latency_class_recorded: true,
      owner_recorded: true },
  ],
  der: {
    hosting_capacity_study_recorded: true,
    hosting_capacity_kw: 900,
    protection_coordination_min_max_der: true,
    inverter_dominance_protection_addressed: true,
    islanding_addressed: true,
    black_start_addressed: true,
    point_of_interconnection_recorded: true },
  der_units: [
    { unit_id: "PV-1", capacity_kw: 400,
      ride_through_declared: true, anti_islanding_declared: true },
    { unit_id: "BESS-1", capacity_kw: 350,
      ride_through_declared: true, anti_islanding_declared: true },
  ],
  latency: { tiers_distinguished: true },
  control_loops: [
    { loop_id: "volt-var", latency_tier: "control",
      latency_budget_declared: true,
      shares_path_with_other_tiers: false,
      tier_mixing_justification_recorded: false },
    { loop_id: "feeder-protection", latency_tier: "protection",
      latency_budget_declared: true,
      shares_path_with_other_tiers: true,
      tier_mixing_justification_recorded: true },
  ],
  cyber: {
    purdue_segmentation_documented: true,
    unidirectional_gateway_telemetry_egress: true,
    key_management_documented: true,
    patching_windows_documented: true,
    incident_fallback_safe_state_documented: true,
    posture_against_recognized_framework: true },
  pilot: {
    measurable_outcomes_before_deployment: true,
    exit_criteria_before_deployment: true,
    capabilities_staged: true,
    safe_fallback_specified: true,
    kpis_and_fallback_before_energization: true },
  economics: {
    cost_stack_recorded: true,
    rate_treatment_and_incentives_recorded: true,
    operational_authority_in_writing: true },
  review: { architecture_reviewed_by_qualified_peng: true },
  red_lines: {
    protection_setting_changed_without_coordination_study_present: false,
    safety_disabled_for_demo_present: false,
    flat_it_ot_network_present: false,
    field_change_without_switching_authority_clarity_present: false,
    vendor_lockin_without_export_exit_plan_present: false,
    customer_data_without_consent_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 50);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.telemetry_points_count, 2);
  assert.deepEqual(v.telemetry_points_incomplete, []);
  assert.equal(v.telemetry_points_complete_share, "1.000000");
  assert.deepEqual(v.duplicate_telemetry_point_ids, []);
  assert.equal(v.der_units_count, 2);
  assert.deepEqual(v.der_units_without_ride_through_or_anti_islanding, []);
  assert.equal(v.der_total_capacity_kw, "750.000000");
  assert.equal(v.declared_hosting_capacity_kw, "900.000000");
  assert.equal(v.hosting_capacity_margin_kw, "150.000000");
  assert.equal(v.control_loops_count, 2);
  assert.deepEqual(v.control_loops_without_latency_budget, []);
  assert.deepEqual(v.control_loops_with_invalid_latency_tier, []);
  assert.deepEqual(v.control_loops_with_unjustified_shared_path, []);
  assert.deepEqual(v.duplicate_control_loop_ids, []);
});

test("test_empty_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.telemetry_points = [];
  m.der_units = [];
  m.control_loops = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_READY");
  assert.equal(v.telemetry_points_count, 0);
  assert.equal(v.telemetry_points_complete_share, null);
  assert.equal(v.der_total_capacity_kw, "0.000000");
  assert.equal(v.hosting_capacity_margin_kw, "900.000000");
  assert.equal(checkStatus(v, "sg_telemetry_points_declared"), "pass");
  assert.equal(checkStatus(v, "sg_der_total_capacity_within_declared_hosting_capacity"), "pass");
});

test("test_missing_single_line_diagram_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.single_line_diagram_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_NOT_READY");
  assert.equal(v.sections["layered_architecture_and_standards"], "fail");
  assert.equal(checkStatus(v, "sg_single_line_diagram_recorded"), "fail");
});

test("test_no_ieee_1547_citation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.ieee_1547_cited = false;
  assert.equal(checkStatus(evaluate(m), "sg_ieee_1547_interconnection_standard_cited"), "fail");
});

test("test_point_without_owner_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.telemetry_points[1].owner_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_NOT_READY");
  assert.equal(checkStatus(v, "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner"), "fail");
  assert.deepEqual(v.telemetry_points_incomplete, ["FDR12.DER.SOC"]);
  assert.equal(v.telemetry_points_complete_share, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_point_missing_attribute_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.telemetry_points[0].units_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner"), "missing");
  assert.deepEqual(v.telemetry_points_incomplete, []);
});

test("test_duplicate_point_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.telemetry_points[1].point_id = "FDR12.VOLT.A";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_no_telemetry_point_id_duplicated"), "fail");
  assert.deepEqual(v.duplicate_telemetry_point_ids, ["FDR12.VOLT.A"]);
});

test("test_absent_telemetry_points_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.telemetry_points;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sg_telemetry_points_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.telemetry_points_count, null);
  assert.equal(v.telemetry_points_incomplete, null);
  assert.equal(v.duplicate_telemetry_point_ids, null);
});

test("test_der_total_over_declared_hosting_capacity_fails", () => {
  const m = clone(COMPLETE) as any;
  m.der_units[1].capacity_kw = 600;
  const v = evaluate(m);
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_NOT_READY");
  assert.equal(checkStatus(v, "sg_der_total_capacity_within_declared_hosting_capacity"), "fail");
  assert.equal(v.der_total_capacity_kw, "1000.000000");
  assert.equal(v.hosting_capacity_margin_kw, "-100.000000");
});

test("test_der_total_equal_to_hosting_capacity_passes", () => {
  const m = clone(COMPLETE) as any;
  m.der_units[1].capacity_kw = 500;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_der_total_capacity_within_declared_hosting_capacity"), "pass");
  assert.equal(v.hosting_capacity_margin_kw, "0.000000");
});

test("test_unit_without_anti_islanding_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.der_units[0].anti_islanding_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_every_der_unit_declares_ride_through_and_anti_islanding"), "fail");
  assert.deepEqual(v.der_units_without_ride_through_or_anti_islanding, ["PV-1"]);
});

test("test_unit_missing_capacity_is_missing_for_hosting_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.der_units[0].capacity_kw;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sg_der_total_capacity_within_declared_hosting_capacity"), "missing");
  assert.equal(v.der_total_capacity_kw, null);
  assert.equal(v.hosting_capacity_margin_kw, null);
  assert.equal(v.declared_hosting_capacity_kw, "900.000000");
});

test("test_absent_hosting_capacity_is_missing_for_hosting_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.der.hosting_capacity_kw;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sg_der_total_capacity_within_declared_hosting_capacity"), "missing");
  assert.equal(v.der_total_capacity_kw, "750.000000");
  assert.equal(v.declared_hosting_capacity_kw, null);
  assert.equal(v.hosting_capacity_margin_kw, null);
});

test("test_no_coordination_across_min_max_der_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.der.protection_coordination_min_max_der = false;
  assert.equal(evaluate(m).sections["der_interconnection_and_protection"], "fail");
});

test("test_loop_without_budget_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.control_loops[0].latency_budget_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_every_control_loop_declares_latency_budget"), "fail");
  assert.deepEqual(v.control_loops_without_latency_budget, ["volt-var"]);
});

test("test_loop_with_unrecognized_tier_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.control_loops[0].latency_tier = "real-time-ish";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_every_control_loop_declares_recognized_latency_tier"), "fail");
  assert.deepEqual(v.control_loops_with_invalid_latency_tier, ["volt-var"]);
});

test("test_shared_path_without_justification_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.control_loops[1].tier_mixing_justification_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_shared_path_loops_carry_tier_mixing_justification"), "fail");
  assert.deepEqual(v.control_loops_with_unjustified_shared_path, ["feeder-protection"]);
});

test("test_shared_path_missing_justification_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.control_loops[1].tier_mixing_justification_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sg_shared_path_loops_carry_tier_mixing_justification"), "missing");
  assert.deepEqual(v.control_loops_with_unjustified_shared_path, []);
});

test("test_unshared_path_needs_no_justification", () => {
  const m = clone(COMPLETE) as any;
  delete m.control_loops[0].tier_mixing_justification_recorded;
  assert.equal(checkStatus(evaluate(m), "sg_shared_path_loops_carry_tier_mixing_justification"), "pass");
});

test("test_duplicate_loop_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.control_loops[1].loop_id = "volt-var";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_no_control_loop_id_duplicated"), "fail");
  assert.deepEqual(v.duplicate_control_loop_ids, ["volt-var"]);
});

test("test_flat_it_ot_network_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.flat_it_ot_network_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sg_no_flat_it_ot_network"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "SMART_GRID_DER_DESIGN_PACK_NOT_READY");
});

test("test_protection_change_without_study_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.protection_setting_changed_without_coordination_study_present = true;
  assert.equal(checkStatus(evaluate(m), "sg_no_protection_setting_change_without_coordination_study"), "fail");
});

test("test_customer_data_without_consent_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.customer_data_without_consent_present = true;
  assert.equal(checkStatus(evaluate(m), "sg_no_customer_data_without_consent"), "fail");
});

test("test_no_purdue_segmentation_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.cyber.purdue_segmentation_documented = false;
  assert.equal(evaluate(m).sections["ot_cybersecurity"], "fail");
});

test("test_no_operational_authority_in_writing_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.economics.operational_authority_in_writing = false;
  const v = evaluate(m);
  assert.equal(v.sections["pilot_economics_and_authority"], "fail");
  assert.equal(checkStatus(v, "sg_operational_authority_who_opens_breaker_in_writing"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.cyber;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["ot_cybersecurity"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.telemetry_points_count, null);
  assert.equal(v.der_units_count, null);
  assert.equal(v.der_total_capacity_kw, null);
  assert.equal(v.declared_hosting_capacity_kw, null);
  assert.equal(v.hosting_capacity_margin_kw, null);
  assert.equal(v.control_loops_count, null);
  assert.equal(v.duplicate_control_loop_ids, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SMART_GRID_DER_DESIGN_PACK_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ architecture: "should-be-an-object" }), fieldError("architecture"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ der_units: { unit_id: "PV-1" } }), fieldError("der_units"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ telemetry_points: ["FDR12.VOLT.A"] }), fieldError("telemetry_points[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cyber.key_management_documented = "yes";
  assert.throws(() => evaluate(m), fieldError("cyber.key_management_documented"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.der.hosting_capacity_kw = "900";
  assert.throws(() => evaluate(m), fieldError("der.hosting_capacity_kw"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.der_units[0].capacity_kw = true;
  assert.throws(() => evaluate(m), fieldError("der_units[0].capacity_kw"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.control_loops[0].latency_tier = 42;
  assert.throws(() => evaluate(m), fieldError("control_loops[0].latency_tier"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pilot = null;
  assert.throws(() => evaluate(m), fieldError("pilot"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("smart-grid-der-design-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
