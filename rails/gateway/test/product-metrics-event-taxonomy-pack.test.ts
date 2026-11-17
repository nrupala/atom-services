import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/product-metrics-event-taxonomy-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  product: "vault-app",
  decision: { measurement_decision_named: true,
              tracking_only_for_a_named_decision: true,
              kpi_tree_from_north_star_to_inputs_declared: true },
  metrics: [
    { name: "weekly_active_vaults",
      definition: "vaults opened at least once in 7 days",
      kpi_tree_role: "north_star" },
    { name: "document_scan_completed",
      definition: "scans reaching a saved document",
      kpi_tree_role: "input" },
    { name: "sync_alert_opened",
      definition: "sync alerts opened within a day",
      kpi_tree_role: "input" },
  ],
  taxonomy: { naming_convention_adopted_for_event_names: true,
              event_spec_written_before_feature_code: true,
              event_spec_reviewed_before_code: true,
              analytics_reviewed_in_pull_request: true,
              event_spec_validated_in_staging: true },
  events: [
    { name: "document_scanned", feature: "document-scan",
      spec_version: "1.2.0" },
    { name: "vault_unlocked", feature: "vault-unlock",
      spec_version: "1.0.0" },
    { name: "sync_alert_opened", feature: "sync-alerts",
      spec_version: "0.9.0" },
  ],
  properties: [
    { event_name: "document_scanned", name: "document_id",
      data_type: "string", requirement: "required",
      contains_pii: false },
    { event_name: "document_scanned", name: "page_count",
      data_type: "integer", requirement: "optional",
      contains_pii: false },
    { event_name: "vault_unlocked", name: "method",
      data_type: "string", requirement: "required",
      contains_pii: false },
    { event_name: "sync_alert_opened", name: "alert_id",
      data_type: "string", requirement: "required",
      contains_pii: false },
  ],
  data_quality: { capture_time_validation_planned: true,
                  dashboard_dupe_and_drop_audit_planned: true,
                  taxonomy_definitions_documented: true,
                  two_definitions_of_one_metric_treated_as_bugs: true },
  privacy: { pseudonymous_ids_only_in_events: true,
             consent_gating_applied_where_required: true,
             aggregation_before_export_applied_where_possible: true },
  dashboards: {
    every_chart_carries_question_definition_owner_target: true,
    trends_shown_over_snapshots: true,
    dashboard_segmentation_done_thoughtfully: true,
    dead_metrics_and_dashboards_retired: true },
  experiments: {
    hypothesis_and_primary_metric_recorded_before_launch: true,
    guardrails_and_sample_size_rationale_recorded_before_launch: true,
    single_change_per_experiment: true,
    assignment_and_blinding_checks_planned: true,
    experiment_results_written_down_including_no_effect: true },
  feedback: {
    qualitative_support_themes_placed_beside_quantitative_results: true,
    qualitative_and_quantitative_feedback_both_feed_backlog: true },
  red_lines: { pii_in_analytics_events_present: false,
               unregistered_experiments_present: false,
               metrics_without_definitions_present: false,
               dark_pattern_measurement_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 48);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.metrics_count, 3);
  assert.equal(v.events_count, 3);
  assert.equal(v.properties_count, 4);
  assert.deepEqual(v.metrics_without_definition, []);
  assert.deepEqual(v.duplicate_metric_names, []);
  assert.deepEqual(v.duplicate_event_names, []);
  assert.deepEqual(v.duplicate_property_keys, []);
  assert.deepEqual(v.orphan_property_rows, []);
  assert.deepEqual(v.events_without_properties, []);
  assert.equal(v.definition_coverage, "1.000000");
  assert.equal(v.event_property_coverage, "1.000000");
});

test("test_empty_row_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.metrics = [];
  m.events = [];
  m.properties = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY");
  assert.equal(v.metrics_count, 0);
  assert.equal(v.events_count, 0);
  assert.equal(v.properties_count, 0);
  assert.equal(v.definition_coverage, null);
  assert.equal(v.event_property_coverage, null);
  assert.equal(checkStatus(v, "taxonomy_metrics_declared"), "pass");
  assert.equal(checkStatus(v, "events_declared"), "pass");
  assert.equal(checkStatus(v, "properties_declared"), "pass");
  assert.equal(checkStatus(v, "every_event_has_declared_properties"), "pass");
});

test("test_no_decision_named_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.decision.measurement_decision_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
  assert.equal(v.sections["decision_and_kpi_tree"], "fail");
  assert.equal(checkStatus(v, "measurement_decision_named"), "fail");
});

test("test_metric_without_definition_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[0].definition = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
  assert.equal(checkStatus(v, "every_metric_names_definition"), "fail");
  assert.deepEqual(v.metrics_without_definition, ["weekly_active_vaults"]);
  assert.equal(v.definition_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_metric_missing_definition_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics[0].definition;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_metric_names_definition"), "missing");
  assert.deepEqual(v.metrics_without_definition, []);
});

test("test_duplicate_metric_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[2].name = "weekly_active_vaults";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_taxonomy_metric_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_metric_names, ["weekly_active_vaults"]);
});

test("test_metric_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_taxonomy_metric_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_metric_names, []);
});

test("test_unknown_kpi_tree_role_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[1].kpi_tree_role = "vanity";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_metric_kpi_tree_role_is_north_star_or_input"), "fail");
  assert.equal(checkStatus(v, "every_metric_names_kpi_tree_role"), "pass");
});

test("test_absent_metrics_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "taxonomy_metrics_declared"), "missing");
  assert.equal(v.metrics_count, null);
  assert.equal(v.metrics_without_definition, null);
  assert.equal(v.duplicate_metric_names, null);
  assert.equal(v.definition_coverage, null);
});

test("test_event_name_not_object_action_snake_case_fails", () => {
  const m = clone(COMPLETE) as any;
  m.events[0].name = "DocumentScanned";
  m.properties[0].event_name = "DocumentScanned";
  m.properties[1].event_name = "DocumentScanned";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_event_name_follows_object_action_snake_case"), "fail");
});

test("test_event_name_without_underscore_fails", () => {
  const m = clone(COMPLETE) as any;
  m.events[1].name = "vaultunlocked";
  m.properties[2].event_name = "vaultunlocked";
  assert.equal(checkStatus(evaluate(m), "every_event_name_follows_object_action_snake_case"), "fail");
});

test("test_duplicate_event_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.events[2].name = "document_scanned";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_event_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_event_names, ["document_scanned"]);
});

test("test_event_without_feature_fails", () => {
  const m = clone(COMPLETE) as any;
  m.events[0].feature = "";
  assert.equal(checkStatus(evaluate(m), "every_event_names_its_feature"), "fail");
});

test("test_event_without_spec_version_fails", () => {
  const m = clone(COMPLETE) as any;
  m.events[0].spec_version = "";
  assert.equal(checkStatus(evaluate(m), "every_event_names_spec_version"), "fail");
});

test("test_duplicate_property_for_same_event_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.properties[1].name = "document_id";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_property_duplicated_for_same_event"), "fail");
  assert.deepEqual(v.duplicate_property_keys, ["document_scanned.document_id"]);
});

test("test_same_property_name_on_different_events_passes", () => {
  const m = clone(COMPLETE) as any;
  m.properties[2].name = "document_id";
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY");
  assert.deepEqual(v.duplicate_property_keys, []);
});

test("test_property_without_data_type_fails", () => {
  const m = clone(COMPLETE) as any;
  m.properties[0].data_type = "";
  assert.equal(checkStatus(evaluate(m), "every_property_declares_a_data_type"), "fail");
});

test("test_property_with_unknown_requirement_fails", () => {
  const m = clone(COMPLETE) as any;
  m.properties[0].requirement = "sometimes";
  assert.equal(checkStatus(evaluate(m), "every_property_marks_required_or_optional"), "fail");
});

test("test_orphan_property_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.properties[3].event_name = "checkout_completed";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_orphan_property_rows"), "fail");
  assert.deepEqual(v.orphan_property_rows, ["alert_id"]);
  assert.equal(checkStatus(v, "every_event_has_declared_properties"), "fail");
  assert.deepEqual(v.events_without_properties, ["sync_alert_opened"]);
  assert.equal(v.event_property_coverage, "0.666667");
});

test("test_event_without_any_property_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.properties = m.properties.filter((p: any) => p.event_name !== "vault_unlocked");
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_event_has_declared_properties"), "fail");
  assert.deepEqual(v.events_without_properties, ["vault_unlocked"]);
  assert.equal(v.event_property_coverage, "0.666667");
});

test("test_absent_events_list_makes_orphan_check_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.events;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_orphan_property_rows"), "missing");
  assert.equal(v.orphan_property_rows, null);
  assert.equal(v.events_without_properties, null);
  assert.equal(v.event_property_coverage, null);
});

test("test_spec_written_after_code_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.taxonomy.event_spec_written_before_feature_code = false;
  const v = evaluate(m);
  assert.equal(v.sections["event_taxonomy_and_spec"], "fail");
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_no_capture_validation_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.data_quality.capture_time_validation_planned = false;
  const v = evaluate(m);
  assert.equal(v.sections["data_quality"], "fail");
});

test("test_two_definitions_not_treated_as_bugs_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data_quality.two_definitions_of_one_metric_treated_as_bugs = false;
  assert.equal(evaluate(m).verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_property_declaring_pii_fails_privacy_section", () => {
  const m = clone(COMPLETE) as any;
  m.properties[0].contains_pii = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_property_row_declares_pii"), "fail");
  assert.equal(v.sections["privacy_by_construction"], "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_property_missing_pii_flag_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.properties[0].contains_pii;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_property_row_declares_pii"), "missing");
});

test("test_consent_gating_absent_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.consent_gating_applied_where_required = false;
  const v = evaluate(m);
  assert.equal(v.sections["privacy_by_construction"], "fail");
});

test("test_chart_without_owner_target_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.dashboards.every_chart_carries_question_definition_owner_target = false;
  const v = evaluate(m);
  assert.equal(v.sections["dashboards_experiments_and_feedback"], "fail");
});

test("test_dead_metrics_not_retired_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dashboards.dead_metrics_and_dashboards_retired = false;
  assert.equal(evaluate(m).verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_unrecorded_sample_size_rationale_fails", () => {
  const m = clone(COMPLETE) as any;
  m.experiments.guardrails_and_sample_size_rationale_recorded_before_launch = false;
  assert.equal(checkStatus(evaluate(m), "guardrails_and_sample_size_rationale_recorded_before_launch"), "fail");
});

test("test_no_effect_results_not_written_down_fails", () => {
  const m = clone(COMPLETE) as any;
  m.experiments.experiment_results_written_down_including_no_effect = false;
  assert.equal(evaluate(m).verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_feedback_not_joined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.qualitative_support_themes_placed_beside_quantitative_results = false;
  assert.equal(evaluate(m).verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_pii_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.pii_in_analytics_events_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_pii_in_analytics_events"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_unregistered_experiment_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unregistered_experiments_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unregistered_experiments"), "fail");
  assert.equal(v.verdict, "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY");
});

test("test_metrics_without_definitions_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.metrics_without_definitions_present = true;
  assert.equal(checkStatus(evaluate(m), "no_metrics_without_definitions"), "fail");
});

test("test_dark_pattern_measurement_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.dark_pattern_measurement_present = true;
  assert.equal(checkStatus(evaluate(m), "no_dark_pattern_measurement"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.experiments;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["dashboards_experiments_and_feedback"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.metrics_count, null);
  assert.equal(v.events_count, null);
  assert.equal(v.properties_count, null);
  assert.equal(v.metrics_without_definition, null);
  assert.equal(v.duplicate_metric_names, null);
  assert.equal(v.duplicate_event_names, null);
  assert.equal(v.duplicate_property_keys, null);
  assert.equal(v.orphan_property_rows, null);
  assert.equal(v.events_without_properties, null);
  assert.equal(v.definition_coverage, null);
  assert.equal(v.event_property_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY"));
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
  m.product = 12345;
  assert.throws(() => evaluate(m), fieldError("product"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ decision: "should-be-an-object" }), fieldError("decision"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ metrics: { name: "x" } }), fieldError("metrics"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ events: ["document_scanned"] }), fieldError("events[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data_quality.capture_time_validation_planned = "yes";
  assert.throws(() => evaluate(m), fieldError("data_quality.capture_time_validation_planned"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("metrics[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.properties[1].contains_pii = "no";
  assert.throws(() => evaluate(m), fieldError("properties[1].contains_pii"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.privacy = null;
  assert.throws(() => evaluate(m), fieldError("privacy"));
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
  .filter((f) => f.startsWith("product-metrics-event-taxonomy-pack--") && f.endsWith(".json"))
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
