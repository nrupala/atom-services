import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluate,
  stamp,
} from "../src/atoms/brand-mention-monitoring-triage-digest.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The TRIAGE_DIGEST_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  brand: "AIMLDS",
  inventory: {
    names_handles_products_listed: true,
    misspellings_and_variants_included: true,
    owned_vs_third_party_distinguished: true,
  },
  coverage: {
    sources_listed: true,
    blind_spots_acknowledged: true,
    mechanism_configured_per_source: true,
    cadence_defined: true,
    crisis_cadence_realtime: true,
    routine_cadence_daily_digest: true,
  },
  triage: {
    rubric_documented: true,
    dimensions: ["severity", "reach", "authenticity"],
    routes: ["ignore", "monitor", "reply", "escalate", "legal"],
    escalation_path_documented: true,
    false_positives_tracked: true,
  },
  response: {
    authority_to_speak_defined: true,
    tone_rules_defined: true,
    dm_move_criteria_defined: true,
    statement_criteria_defined: true,
    templates_approved: true,
  },
  alerts: {
    thresholds_defined: true,
    dedupe_enabled: true,
    quiet_hours_defined: true,
    tested_after_setup: true,
  },
  evidence: { archiving_required_before_response: true },
  counts: {
    total_mentions: 120,
    actions_taken: 14,
    actions_with_evidence_archived: 14,
  },
  digest: {
    weekly_cadence: true,
    includes_notable_mentions: true,
    includes_trend_notes: true,
    sentiment_included: true,
    sentiment_caveats_stated: true,
    actions_taken_listed: true,
    signal_separated_from_noise: true,
  },
  conduct: {
    astroturfing_fake_reviews_or_manufactured_engagement: false,
    public_argument_without_policy_backing: false,
    retaliation_against_mentioners: false,
    private_data_of_individuals_exposed: false,
    defamation_or_impersonation_fought_publicly_instead_of_counsel:
      false,
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
  assert.equal(v.verdict, "TRIAGE_DIGEST_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 37);
  assert.deepEqual(v.triage_dimensions_missing, []);
  assert.deepEqual(v.triage_routes_missing, []);
  assert.equal(v.actions_without_archived_evidence, 0);
});

test("test_blind_spots_not_acknowledged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.blind_spots_acknowledged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["inventory_and_coverage"], "fail");
});

test("test_variants_not_included_fails", () => {
  const m = clone(COMPLETE) as any;
  m.inventory.misspellings_and_variants_included = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_routine_cadence_not_daily_digest_fails", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.routine_cadence_daily_digest = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_dimension_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.triage.dimensions = ["severity", "reach"];
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.deepEqual(v.triage_dimensions_missing, ["authenticity"]);
  assert.equal(
    checkStatus(v, "all_stated_triage_dimensions_used"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_dimension_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.triage.dimensions = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.deepEqual(v.triage_dimensions_missing,
    ["severity", "reach", "authenticity"]);
});

test("test_dimension_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.triage.dimensions = ["volume", "velocity"];
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.triage_dimensions_missing?.length, 3);
});

test("test_missing_dimension_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.triage.dimensions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.triage_dimensions_missing, null);
  assert.equal(v.computed_status, null);
});

test("test_route_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.triage.routes = m.triage.routes.filter((r: string) => r !== "legal");
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.deepEqual(v.triage_routes_missing, ["legal"]);
  assert.equal(
    checkStatus(v, "all_stated_triage_routes_defined"), "fail");
});

test("test_route_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.triage.routes = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.deepEqual(v.triage_routes_missing,
    ["ignore", "monitor", "reply", "escalate", "legal"]);
});

test("test_missing_route_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.triage.routes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.triage_routes_missing, null);
});

test("test_escalation_path_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.triage.escalation_path_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["triage_rubric"], "fail");
});

test("test_false_positives_not_tracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.triage.false_positives_tracked = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_templates_not_approved_fails", () => {
  const m = clone(COMPLETE) as any;
  m.response.templates_approved = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["response_policy"], "fail");
});

test("test_authority_to_speak_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.response.authority_to_speak_defined = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_alerts_not_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.alerts.tested_after_setup = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["alert_hygiene_and_evidence"], "fail");
});

test("test_evidence_not_archived_for_every_action_fails", () => {
  const m = clone(COMPLETE) as any;
  m.counts.actions_with_evidence_archived = 11;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(
    checkStatus(v, "evidence_archived_for_every_action"), "fail");
  assert.equal(v.actions_without_archived_evidence, 3);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_actions_above_total_mentions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.counts.actions_taken = 200;
  m.counts.actions_with_evidence_archived = 200;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(
    checkStatus(v, "evidence_archived_for_every_action"), "fail");
});

test("test_archived_above_actions_taken_fails", () => {
  const m = clone(COMPLETE) as any;
  m.counts.actions_with_evidence_archived = 20;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.actions_without_archived_evidence, -6);
});

test("test_negative_counts_fail", () => {
  const m = clone(COMPLETE) as any;
  m.counts.total_mentions = -1;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_zero_actions_with_zero_archived_passes", () => {
  const m = clone(COMPLETE) as any;
  m.counts = {
    total_mentions: 40, actions_taken: 0,
    actions_with_evidence_archived: 0,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_READY");
  assert.equal(v.actions_without_archived_evidence, 0);
});

test("test_missing_counts_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.counts.actions_taken;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "evidence_archived_for_every_action"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.actions_without_archived_evidence, null);
});

test("test_sentiment_without_caveats_fails", () => {
  const m = clone(COMPLETE) as any;
  m.digest.sentiment_caveats_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["digest_reporting"], "fail");
});

test("test_signal_not_separated_from_noise_fails", () => {
  const m = clone(COMPLETE) as any;
  m.digest.signal_separated_from_noise = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_astroturfing_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.conduct.astroturfing_fake_reviews_or_manufactured_engagement = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_DIGEST_NOT_READY");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_public_argument_without_policy_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.conduct.public_argument_without_policy_backing = true;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_retaliation_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.conduct.retaliation_against_mentioners = true;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_private_data_exposed_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.conduct.private_data_of_individuals_exposed = true;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_defamation_fought_publicly_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.conduct
    .defamation_or_impersonation_fought_publicly_instead_of_counsel =
    true;
  assert.equal(evaluate(m).verdict, "TRIAGE_DIGEST_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.digest;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["digest_reporting"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.triage_dimensions_missing, null);
  assert.equal(v.triage_routes_missing, null);
  assert.equal(v.actions_without_archived_evidence, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: TRIAGE_DIGEST_READY"));
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
  m.brand = 12345;
  assert.throws(() => evaluate(m), fieldError("brand"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ coverage: "should-be-an-object" }),
    fieldError("coverage"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.triage.routes = "reply";
  assert.throws(() => evaluate(m), fieldError("triage.routes"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.triage.dimensions = ["severity", 42];
  assert.throws(() => evaluate(m), fieldError("triage.dimensions[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.coverage.blind_spots_acknowledged = "yes";
  assert.throws(
    () => evaluate(m), fieldError("coverage.blind_spots_acknowledged"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.counts.total_mentions = "120";
  assert.throws(() => evaluate(m), fieldError("counts.total_mentions"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.counts.actions_taken = true;
  assert.throws(() => evaluate(m), fieldError("counts.actions_taken"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.triage = null;
  assert.throws(() => evaluate(m), fieldError("triage"));
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
  .filter((f) =>
    f.startsWith("brand-mention-monitoring-triage-digest--") &&
    f.endsWith(".json"))
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
