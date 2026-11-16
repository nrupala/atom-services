import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/crm-pipeline-operations.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CRM_PIPELINE_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Pipeline",
  source: {
    single_system_maintained: true,
    contacts_carry_who_what_context_minimum: true,
    dedupe_cadence_set: true,
    stale_contacts_flagged_not_trusted: true,
  },
  contact_rules: {
    sensitivity_flags_honored: true,
    sensitivity_flags_override_everything: true,
    outreach_drafted_for_review_never_auto_sent: true,
    nothing_personal_shared_beyond_purpose: true,
    unapproved_outreach_sent: false,
    bulk_unsolicited_outreach_sent: false,
    personal_contacts_uploaded_to_third_parties_without_purpose_and_consent: false,
  },
  pipeline: {
    stages_used: ["lead", "qualified", "proposal", "decision", "won", "lost"],
    entry_criteria_defined_for_each_stage: true,
    exit_criteria_defined_for_each_stage: true,
    deals_advance_on_evidence_not_optimism: true,
    stale_threshold_days: 30,
    deals: [
      { stage: "lead", value: 1000, age_days: 5, has_next_step: true, has_next_step_date: true, open: true },
      { stage: "qualified", value: 2000, age_days: 10, has_next_step: true, has_next_step_date: true, open: true },
      { stage: "proposal", value: 3000, age_days: 12, has_next_step: true, has_next_step_date: true, open: true },
      { stage: "won", value: 4000, age_days: 20, has_next_step: false, has_next_step_date: false, open: false },
      { stage: "lost", value: 500, age_days: 25, has_next_step: false, has_next_step_date: false, open: false },
    ],
  },
  follow_up: {
    cadence_scheduled: true,
    every_touch_carries_value: true,
    every_interaction_logged_with_what_said_promised_next: true,
    promises_tracked_until_delivered: true,
  },
  reporting: {
    pipeline_reported_by_stage_and_age: true,
    conversion_rates_by_stage_reported: true,
    stuck_deal_list_maintained: true,
    stuck_deal_review_held_on_cadence: true,
    forecasts_use_honest_probabilities: true,
  },
  consent: {
    marketing_consent_recorded: true,
    consent_flags_current: true,
    unsubscribe_honored_instantly: true,
    segmentation_per_consent: true,
    scraped_third_party_personal_data_into_crm: false,
  },
  win_loss: {
    reasons_captured: true,
    reasons_include_yours_and_theirs: true,
    feeds_messaging_product_and_process_improvements: true,
  },
  minimal_data: {
    only_relationship_needed_data_collected: true,
    retention_for_dead_leads_defined: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CRM_PIPELINE_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 38);
  assert.deepEqual(v.pipeline_stages_not_covered, []);
  assert.equal(v.deal_count, 5);
  assert.equal(v.open_deal_count, 3);
  assert.equal(v.stale_deal_count, 0);
  assert.equal(v.open_deals_without_next_step_or_date_count, 0);
  assert.deepEqual(v.stage_distribution, { lead: 1, qualified: 1, proposal: 1, decision: 0, won: 1, lost: 1 });
  assert.equal(v.computed_open_value_total, "6000.000000");
  assert.equal(v.computed_pipeline_value_total, "10500.000000");
});

test("test_stage_missing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages_used = ["lead", "qualified", "proposal", "decision", "won"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.deepEqual(v.pipeline_stages_not_covered, ["lost"]);
  assert.equal(checkStatus(v, "pipeline_stages_cover_stated_stages"), "fail");
});

test("test_empty_stages_fail_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages_used = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.pipeline_stages_not_covered?.length, 6);
});

test("test_missing_stages_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.stages_used;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.pipeline_stages_not_covered, null);
});

test("test_open_deal_without_next_step_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[0].has_next_step = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "every_open_deal_has_next_step_and_date"), "fail");
  assert.equal(v.open_deals_without_next_step_or_date_count, 1);
});

test("test_closed_deal_without_next_step_passes", () => {
  assert.equal(evaluate(clone(COMPLETE)).verdict, "CRM_PIPELINE_READY");
});

test("test_stale_open_deal_fails_against_declared_threshold", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[1].age_days = 45;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.stale_deal_count, 1);
  assert.equal(checkStatus(v, "no_open_deal_stale_beyond_declared_threshold"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_stale_closed_deal_does_not_count", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[3].age_days = 90;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_READY");
});

test("test_age_equal_to_threshold_is_not_stale", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[0].age_days = 30;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_READY");
});

test("test_missing_threshold_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.stale_threshold_days;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.stale_deal_count, null);
  assert.equal(checkStatus(v, "no_open_deal_stale_beyond_declared_threshold"), "missing");
});

test("test_unknown_deal_stage_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[0].stage = "negotiation";
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "deal_stages_are_stated_stages"), "fail");
});

test("test_incomplete_deal_row_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.deals[0].value;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "deal_rows_complete"), "missing");
  assert.equal(v.stage_distribution, null);
  assert.equal(v.computed_open_value_total, null);
  assert.equal(v.deal_count, 5);
});

test("test_empty_deals_fail", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "deal_rows_complete"), "fail");
  assert.equal(v.deal_count, 0);
  assert.equal(v.open_deal_count, null);
});

test("test_missing_deals_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pipeline.deals;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.deal_count, null);
});

test("test_no_exit_criteria_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.exit_criteria_defined_for_each_stage = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["pipeline_stages_and_deals"], "fail");
});

test("test_single_system_not_maintained_fails", () => {
  const m = clone(COMPLETE) as any;
  m.source.single_system_maintained = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["single_source_of_truth"], "fail");
});

test("test_dedupe_cadence_not_set_fails", () => {
  const m = clone(COMPLETE) as any;
  m.source.dedupe_cadence_set = false;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_NOT_READY");
});

test("test_unapproved_outreach_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contact_rules.unapproved_outreach_sent = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "no_unapproved_outreach"), "fail");
});

test("test_bulk_unsolicited_outreach_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.contact_rules.bulk_unsolicited_outreach_sent = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["contact_rules_and_privacy"], "fail");
});

test("test_upload_without_consent_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.contact_rules.personal_contacts_uploaded_to_third_parties_without_purpose_and_consent = true;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_NOT_READY");
});

test("test_sensitivity_flags_not_honored_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contact_rules.sensitivity_flags_honored = false;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_NOT_READY");
});

test("test_promises_not_tracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.follow_up.promises_tracked_until_delivered = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["follow_up_cadence_and_logging"], "fail");
});

test("test_stuck_review_not_held_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reporting.stuck_deal_review_held_on_cadence = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["reporting_and_forecasts"], "fail");
});

test("test_scraping_fails", () => {
  const m = clone(COMPLETE) as any;
  m.consent.scraped_third_party_personal_data_into_crm = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "no_scraping_third_party_personal_data"), "fail");
});

test("test_consent_flags_not_current_fails", () => {
  const m = clone(COMPLETE) as any;
  m.consent.consent_flags_current = false;
  assert.equal(evaluate(m).verdict, "CRM_PIPELINE_NOT_READY");
});

test("test_win_loss_reasons_not_captured_fails", () => {
  const m = clone(COMPLETE) as any;
  m.win_loss.reasons_captured = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["win_loss_discipline"], "fail");
});

test("test_retention_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.minimal_data.retention_for_dead_leads_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CRM_PIPELINE_NOT_READY");
  assert.equal(v.sections["minimal_data_and_retention"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.consent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["consent_and_comms"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.pipeline_stages_not_covered, null);
  assert.equal(v.deal_count, null);
  assert.equal(v.stage_distribution, null);
  assert.equal(v.computed_pipeline_value_total, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CRM_PIPELINE_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types, ported ----

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ pipeline: "should-be-an-object" }),
    fieldError("pipeline"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages_used = "lead";
  assert.throws(() => evaluate(m), fieldError("pipeline.stages_used"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stages_used = ["lead", 42];
  assert.throws(() => evaluate(m), fieldError("pipeline.stages_used[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.source.single_system_maintained = "yes";
  assert.throws(() => evaluate(m), fieldError("source.single_system_maintained"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stale_threshold_days = "30";
  assert.throws(() => evaluate(m), fieldError("pipeline.stale_threshold_days"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.stale_threshold_days = true;
  assert.throws(() => evaluate(m), fieldError("pipeline.stale_threshold_days"));
});

test("malformed: deals as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals = { stage: "lead" };
  assert.throws(() => evaluate(m), fieldError("pipeline.deals"));
});

test("malformed: deal entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals = ["lead"];
  assert.throws(() => evaluate(m), fieldError("pipeline.deals[0]"));
});

test("malformed: deal row field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[1].value = "2000";
  assert.throws(() => evaluate(m), fieldError("pipeline.deals[1].value"));
});

test("malformed: deal row boolean as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.deals[0].open = 1;
  assert.throws(() => evaluate(m), fieldError("pipeline.deals[0].open"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.consent = null;
  assert.throws(() => evaluate(m), fieldError("consent"));
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
  .filter((f) => f.startsWith("crm-pipeline-operations--") && f.endsWith(".json"))
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
