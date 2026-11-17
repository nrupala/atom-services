import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/observability-and-runbook-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  service_name: "checkout-api",
  signals: { structured_logs_with_correlation_ids: true,
             metrics_cover_requests: true,
             metrics_cover_errors: true,
             metrics_cover_latency: true,
             metrics_cover_saturation: true,
             traces_or_timings_at_every_edge: true,
             health_signal_emitted: true,
             error_rate_signal_emitted: true,
             latency_signal_emitted: true,
             dashboards_present: true },
  alert_design: { alert_set_symptom_based: true,
                  alert_thresholds_tuned_to_reality: true,
                  alert_noise_controls_present: true },
  alerts: [
    { name: "checkout-error-rate-high", owner: "checkout-oncall",
      runbook_linked: true, actionable: true, symptom_based: true },
    { name: "checkout-latency-high", owner: "checkout-oncall",
      runbook_linked: true, actionable: true, symptom_based: true },
    { name: "payment-queue-saturated", owner: "payments-oncall",
      runbook_linked: true, actionable: true, symptom_based: true },
  ],
  failure_modes: [
    { name: "database-unavailable", runbook_present: true,
      symptoms_described: true, check_steps_present: true,
      mitigation_present: true, escalation_present: true,
      recovery_verification_present: true },
    { name: "payment-provider-outage", runbook_present: true,
      symptoms_described: true, check_steps_present: true,
      mitigation_present: true, escalation_present: true,
      recovery_verification_present: true },
  ],
  incident: { acknowledge_step_defined: true,
              blast_radius_assessment_step_defined: true,
              stabilize_step_defined: true,
              rollback_as_first_stabilize_option: true,
              status_communication_step_defined: true,
              fix_step_defined: true,
              blameless_postmortem_required: true,
              postmortem_actions_tracked_to_closure: true },
  resilience: { backup_schedule_declared: true,
                backup_restores_tested: true,
                restore_tested_at_least_once_per_season: true,
                unattended_jobs_have_health_signals: true,
                jobs_emit_success_heartbeats: true },
  red_lines: { paging_on_unactionable_causes_present: false,
               unowned_alerts_present: false,
               monitoring_disabled_to_hide_problem_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "OBSERVABILITY_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 43);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.alerts_count, 3);
  assert.deepEqual(v.alerts_without_owner, []);
  assert.equal(v.owner_coverage, "1.000000");
  assert.deepEqual(v.alerts_without_runbook_link, []);
  assert.equal(v.runbook_link_coverage, "1.000000");
  assert.deepEqual(v.duplicate_alert_names, []);
  assert.equal(v.failure_modes_count, 2);
  assert.deepEqual(v.failure_modes_without_runbook, []);
  assert.equal(v.runbook_coverage, "1.000000");
  assert.deepEqual(v.duplicate_failure_mode_names, []);
});

test("test_no_health_signal_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.signals.health_signal_emitted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "OBSERVABILITY_DESIGN_NOT_SOUND");
  assert.equal(v.sections["signals_and_dashboards"], "fail");
  assert.equal(checkStatus(v, "health_signal_emitted"), "fail");
});

test("test_no_correlation_ids_fails", () => {
  const m = clone(COMPLETE) as any;
  m.signals.structured_logs_with_correlation_ids = false;
  assert.equal(evaluate(m).verdict, "OBSERVABILITY_DESIGN_NOT_SOUND");
});

test("test_alert_without_owner_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[0].owner = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "OBSERVABILITY_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_alert_has_owner"), "fail");
  assert.deepEqual(v.alerts_without_owner, ["checkout-error-rate-high"]);
  assert.equal(v.owner_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_alert_missing_owner_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.alerts[0].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_alert_has_owner"), "missing");
  assert.deepEqual(v.alerts_without_owner, []);
});

test("test_alert_without_runbook_link_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[1].runbook_linked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_alert_links_runbook"), "fail");
  assert.deepEqual(v.alerts_without_runbook_link, ["checkout-latency-high"]);
  assert.equal(v.runbook_link_coverage, "0.666667");
});

test("test_alert_not_actionable_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[2].actionable = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_alert_is_actionable"), "fail");
  assert.deepEqual(v.alerts_without_actionable, ["payment-queue-saturated"]);
  assert.equal(v.actionable_coverage, "0.666667");
});

test("test_alert_not_symptom_based_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[0].symptom_based = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_alert_is_symptom_based"), "fail");
  assert.deepEqual(v.alerts_without_symptom_basis, ["checkout-error-rate-high"]);
  assert.equal(v.symptom_based_coverage, "0.666667");
});

test("test_duplicate_alert_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[2].name = "checkout-error-rate-high";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_alert_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_alert_names, ["checkout-error-rate-high"]);
});

test("test_alert_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.alerts[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_alert_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_alert_names, []);
});

test("test_empty_alerts_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.alerts = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "alerts_declared"), "fail");
  assert.equal(v.alerts_count, 0);
  assert.equal(v.owner_coverage, null);
  assert.equal(v.runbook_link_coverage, null);
  assert.deepEqual(v.duplicate_alert_names, []);
});

test("test_failure_mode_without_runbook_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].runbook_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_has_runbook"), "fail");
  assert.deepEqual(v.failure_modes_without_runbook, ["database-unavailable"]);
  assert.equal(v.runbook_coverage, "0.500000");
});

test("test_runbook_without_mitigation_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[1].mitigation_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_runbook_has_mitigation"), "fail");
  assert.deepEqual(v.failure_modes_without_mitigation, ["payment-provider-outage"]);
  assert.equal(v.mitigation_coverage, "0.500000");
});

test("test_runbook_missing_escalation_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.failure_modes[0].escalation_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_runbook_has_escalation"), "missing");
  assert.deepEqual(v.failure_modes_without_escalation, []);
});

test("test_runbook_without_recovery_verification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].recovery_verification_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_runbook_has_recovery_verification"), "fail");
  assert.deepEqual(v.failure_modes_without_recovery_verification, ["database-unavailable"]);
  assert.equal(v.recovery_verification_coverage, "0.500000");
});

test("test_duplicate_failure_mode_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[1].name = "database-unavailable";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_failure_mode_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_failure_mode_names, ["database-unavailable"]);
});

test("test_empty_failure_modes_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "failure_modes_declared"), "fail");
  assert.equal(v.failure_modes_count, 0);
  assert.equal(v.runbook_coverage, null);
});

test("test_no_rollback_first_option_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.incident.rollback_as_first_stabilize_option = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "OBSERVABILITY_DESIGN_NOT_SOUND");
  assert.equal(v.sections["incident_flow_and_postmortem"], "fail");
});

test("test_postmortem_actions_not_tracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.incident.postmortem_actions_tracked_to_closure = false;
  assert.equal(checkStatus(evaluate(m), "postmortem_actions_tracked_to_closure"), "fail");
});

test("test_restores_not_tested_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.resilience.backup_restores_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "OBSERVABILITY_DESIGN_NOT_SOUND");
  assert.equal(v.sections["backups_silent_failure_and_red_lines"], "fail");
});

test("test_no_success_heartbeats_fails", () => {
  const m = clone(COMPLETE) as any;
  m.resilience.jobs_emit_success_heartbeats = false;
  assert.equal(checkStatus(evaluate(m), "jobs_emit_success_heartbeats"), "fail");
});

test("test_paging_on_unactionable_causes_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.paging_on_unactionable_causes_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_paging_on_unactionable_causes"), "fail");
  assert.equal(v.sections["backups_silent_failure_and_red_lines"], "fail");
});

test("test_unowned_alerts_and_disabled_monitoring_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unowned_alerts_present = true;
  m.red_lines.monitoring_disabled_to_hide_problem_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unowned_alerts"), "fail");
  assert.equal(checkStatus(v, "monitoring_never_disabled_to_hide_problem"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.incident;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["incident_flow_and_postmortem"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.alerts_count, null);
  assert.equal(v.alerts_without_owner, null);
  assert.equal(v.owner_coverage, null);
  assert.equal(v.duplicate_alert_names, null);
  assert.equal(v.failure_modes_count, null);
  assert.equal(v.failure_modes_without_runbook, null);
  assert.equal(v.runbook_coverage, null);
  assert.equal(v.duplicate_failure_mode_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: OBSERVABILITY_DESIGN_SOUND"));
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
  m.service_name = 12345;
  assert.throws(() => evaluate(m), fieldError("service_name"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ signals: "should-be-an-object" }), fieldError("signals"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ alerts: { name: "checkout-error-rate-high" } }), fieldError("alerts"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ alerts: ["checkout-error-rate-high"] }), fieldError("alerts[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.signals.health_signal_emitted = "yes";
  assert.throws(() => evaluate(m), fieldError("signals.health_signal_emitted"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.alerts[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("alerts[0].name"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[1].mitigation_present = "true";
  assert.throws(() => evaluate(m), fieldError("failure_modes[1].mitigation_present"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.incident = null;
  assert.throws(() => evaluate(m), fieldError("incident"));
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
  .filter((f) => f.startsWith("observability-and-runbook-design--") && f.endsWith(".json"))
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
