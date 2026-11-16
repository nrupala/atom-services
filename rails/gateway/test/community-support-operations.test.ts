import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/community-support-operations.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The COMMUNITY_SUPPORT_READY manifest, copied from the Python
// oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Support",
  intake: {
    channels_defined: true,
    sla_targets_documented: true,
    outage_target_hours: 1,
    broken_target_hours: 4,
    question_target_hours: 24,
    messages_received: 200,
    messages_tracked: 200,
    support_messages_left_untracked_in_dms: false,
  },
  help_docs: {
    faq_covers_top_recurring_questions: true,
    docs_updated_from_actual_tickets: true,
    fixes_link_doc_where_possible: true,
    top_theme_count: 10,
    themes_with_doc_or_backlog_count: 10,
  },
  triage: {
    categories_used: ["bug", "feature", "usage", "noise"],
    bugs_require_reproduction: true,
    bugs_filed_in_tracker_with_evidence: true,
    features_routed_to_backlog: true,
    threads_total: 180,
    threads_closed_with_resolution_or_tracked_item: 180,
    obvious_issues_left_unanswered: false,
    triage_then_prioritize_deliberately: true,
  },
  response: {
    acknowledge_expectation_deliver_confirm_followed: true,
    mistakes_owned_plainly: true,
    argues_publicly_with_users: false,
    unshipped_dates_or_features_promised: false,
    reporter_privacy_leaked_in_public_threads: false,
  },
  comms: {
    changelog_highlights_for_users_published: true,
    incident_templates_ready: true,
    incident_templates_include_honesty_rules: true,
    incident_status_honest_no_fake_precision: true,
    follow_up_after_resolution_sent: true,
  },
  community: {
    code_of_conduct_exists: true,
    moderation_process_documented: true,
    moderation_applied_consistently: true,
    contributors_celebrated: true,
    spaces_spam_free_without_hostility: true,
  },
  measurement: {
    first_response_time_measured: true,
    resolution_time_measured: true,
    recurring_themes_tracked: true,
    satisfaction_signals_observed: true,
    monthly_review_held: true,
    themes_feed_product: true,
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
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 38);
  assert.equal(v.computed_tracked_share, "1.000000");
  assert.equal(v.tracked_difference, "0.000000");
  assert.equal(v.computed_theme_coverage_ratio, "1.000000");
  assert.equal(v.theme_coverage_difference, "0.000000");
  assert.deepEqual(v.triage_categories_not_covered, []);
  assert.equal(v.computed_thread_closure_share, "1.000000");
  assert.equal(v.thread_closure_difference, "0.000000");
});

test("test_sla_order_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.intake.outage_target_hours = 0.5;
  m.intake.broken_target_hours = 2;
  m.intake.question_target_hours = 48;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_READY");
});

test("test_sla_order_violated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.intake.broken_target_hours = 0.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["intake_and_slas"], "fail");
  assert.equal(
    checkStatus(v, "sla_targets_respect_severity_order"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_sla_equal_targets_fail_order", () => {
  const m = clone(COMPLETE) as any;
  m.intake.question_target_hours = 4;
  assert.equal(
    checkStatus(evaluate(m), "sla_targets_respect_severity_order"),
    "fail");
});

test("test_missing_sla_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.intake.outage_target_hours;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "sla_targets_respect_severity_order"), "missing");
  assert.equal(v.computed_status, null);
});

test("test_untracked_messages_fail", () => {
  const m = clone(COMPLETE) as any;
  m.intake.messages_tracked = 190;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(checkStatus(v, "every_message_tracked"), "fail");
  assert.equal(v.computed_tracked_share, "0.950000");
  assert.equal(v.tracked_difference, "-10.000000");
});

test("test_zero_received_messages_fails_tracking", () => {
  const m = clone(COMPLETE) as any;
  m.intake.messages_received = 0;
  m.intake.messages_tracked = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.computed_tracked_share, null);
  assert.equal(v.tracked_difference, "0.000000");
});

test("test_missing_intake_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.intake.messages_tracked;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_tracked_share, null);
  assert.equal(v.tracked_difference, null);
});

test("test_support_dms_untracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.intake.support_messages_left_untracked_in_dms = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(
    checkStatus(v, "no_support_messages_left_untracked_in_dms"), "fail");
});

test("test_channels_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.intake.channels_defined = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_fewer_than_top_ten_themes_fails", () => {
  const m = clone(COMPLETE) as any;
  m.help_docs.top_theme_count = 8;
  m.help_docs.themes_with_doc_or_backlog_count = 8;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(checkStatus(v, "top_ten_themes_identified"), "fail");
  assert.equal(
    checkStatus(v, "all_top_themes_have_doc_or_backlog"), "pass");
  assert.equal(v.computed_theme_coverage_ratio, "1.000000");
});

test("test_uncovered_theme_fails", () => {
  const m = clone(COMPLETE) as any;
  m.help_docs.themes_with_doc_or_backlog_count = 9;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(
    checkStatus(v, "all_top_themes_have_doc_or_backlog"), "fail");
  assert.equal(v.computed_theme_coverage_ratio, "0.900000");
  assert.equal(v.theme_coverage_difference, "-1.000000");
});

test("test_missing_theme_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.help_docs.themes_with_doc_or_backlog_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_theme_coverage_ratio, null);
  assert.equal(v.theme_coverage_difference, null);
});

test("test_docs_not_updated_from_tickets_fails", () => {
  const m = clone(COMPLETE) as any;
  m.help_docs.docs_updated_from_actual_tickets = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_triage_category_missing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.triage.categories_used = ["bug", "feature", "usage"];
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.deepEqual(v.triage_categories_not_covered, ["noise"]);
  assert.equal(
    checkStatus(v, "triage_categories_cover_stated_categories"), "fail");
});

test("test_triage_empty_categories_fail_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.triage.categories_used = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.deepEqual(v.triage_categories_not_covered,
    ["bug", "feature", "usage", "noise"]);
});

test("test_triage_unknown_categories_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.triage.categories_used = ["question", "spam"];
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.triage_categories_not_covered?.length, 4);
});

test("test_missing_triage_categories_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.triage.categories_used;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.triage_categories_not_covered, null);
});

test("test_open_threads_fail_closure", () => {
  const m = clone(COMPLETE) as any;
  m.triage.threads_closed_with_resolution_or_tracked_item = 175;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(
    checkStatus(
      v, "every_thread_ends_with_resolution_or_tracked_item"), "fail");
  assert.equal(v.thread_closure_difference, "-5.000000");
});

test("test_zero_threads_fails_closure", () => {
  const m = clone(COMPLETE) as any;
  m.triage.threads_total = 0;
  m.triage.threads_closed_with_resolution_or_tracked_item = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.computed_thread_closure_share, null);
});

test("test_missing_thread_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.triage.threads_total;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_thread_closure_share, null);
  assert.equal(v.thread_closure_difference, null);
});

test("test_bugs_without_reproduction_fail", () => {
  const m = clone(COMPLETE) as any;
  m.triage.bugs_require_reproduction = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_obvious_issues_unanswered_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.triage.obvious_issues_left_unanswered = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["triage_loop"], "fail");
});

test("test_arguing_publicly_fails", () => {
  const m = clone(COMPLETE) as any;
  m.response.argues_publicly_with_users = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(checkStatus(v, "never_argues_publicly"), "fail");
});

test("test_promising_unshipped_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.response.unshipped_dates_or_features_promised = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(
    checkStatus(v, "never_promises_unshipped_dates_or_features"), "fail");
});

test("test_reporter_privacy_leak_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.response.reporter_privacy_leaked_in_public_threads = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["response_craft_and_red_lines"], "fail");
});

test("test_mistakes_not_owned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.response.mistakes_owned_plainly = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_incident_templates_not_ready_fails", () => {
  const m = clone(COMPLETE) as any;
  m.comms.incident_templates_ready = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["release_and_incident_comms"], "fail");
});

test("test_incident_templates_without_honesty_rules_fail", () => {
  const m = clone(COMPLETE) as any;
  m.comms.incident_templates_include_honesty_rules = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_no_follow_up_after_resolution_fails", () => {
  const m = clone(COMPLETE) as any;
  m.comms.follow_up_after_resolution_sent = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_no_code_of_conduct_fails", () => {
  const m = clone(COMPLETE) as any;
  m.community.code_of_conduct_exists = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["community_norms"], "fail");
});

test("test_moderation_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.community.moderation_process_documented = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_no_monthly_review_fails", () => {
  const m = clone(COMPLETE) as any;
  m.measurement.monthly_review_held = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "COMMUNITY_SUPPORT_NOT_READY");
  assert.equal(v.sections["measurement"], "fail");
});

test("test_themes_not_feeding_product_fails", () => {
  const m = clone(COMPLETE) as any;
  m.measurement.themes_feed_product = false;
  assert.equal(evaluate(m).verdict, "COMMUNITY_SUPPORT_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.comms;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["release_and_incident_comms"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.computed_tracked_share, null);
  assert.equal(v.computed_theme_coverage_ratio, null);
  assert.equal(v.triage_categories_not_covered, null);
  assert.equal(v.computed_thread_closure_share, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: COMMUNITY_SUPPORT_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

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
    () => evaluate({ intake: "should-be-an-object" }),
    fieldError("intake"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.triage.categories_used = "bug";
  assert.throws(() => evaluate(m), fieldError("triage.categories_used"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.triage.categories_used = ["bug", 42];
  assert.throws(
    () => evaluate(m), fieldError("triage.categories_used[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.intake.channels_defined = "yes";
  assert.throws(() => evaluate(m), fieldError("intake.channels_defined"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.intake.messages_received = "200";
  assert.throws(() => evaluate(m), fieldError("intake.messages_received"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.help_docs.top_theme_count = true;
  assert.throws(() => evaluate(m), fieldError("help_docs.top_theme_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.community = null;
  assert.throws(() => evaluate(m), fieldError("community"));
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
  .filter((f) => f.startsWith("community-support-operations--") && f.endsWith(".json"))
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
