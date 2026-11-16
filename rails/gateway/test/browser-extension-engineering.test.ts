import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/browser-extension-engineering.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The EXTENSION_DESIGN_SOUND manifest, copied from the Python tests.
const COMPLETE: Record<string, unknown> = {
  extension_name: "Reader Capture",
  mv3: {
    service_worker_background: true,
    persistent_background_page_used: false,
    alarms_used_instead_of_timers: true,
    declarative_apis_used_where_possible: true,
    remote_code_executed: false,
    all_code_bundled: true,
  },
  permissions: {
    only_needed_requested: true,
    host_patterns_narrow: true,
    optional_permissions_for_power_features: true,
    permission_list_reviewed_as_security_audit: true,
    overbroad_permissions_present: false,
    requested: ["storage", "activeTab"],
    justified: ["storage", "activeTab"],
  },
  architecture: {
    content_scripts_isolated_from_page_context: true,
    message_passing_well_defined: true,
    messages_validated_on_both_ends: true,
    storage_scoped_sync_vs_local: true,
    secrets_stored_in_extension_storage: false,
  },
  ux: {
    popup_or_options_pages_provided: true,
    logged_out_and_unavailable_states_provided: true,
    keyboard_shortcuts_provided: true,
    drive_by_dom_changes_without_user_intent: false,
  },
  privacy: {
    page_data_processed_locally_by_default: true,
    telemetry_requires_explicit_consent: true,
    telemetry_clearly_disclosed: true,
    privacy_disclosure_matches_behavior_tested: true,
    browsing_data_exfiltrated: false,
    hidden_data_collection_present: false,
  },
  distribution: {
    store_listing_screenshots_provided: true,
    store_privacy_form_accurate: true,
    staged_rollout_planned: true,
    version_discipline_followed: true,
    firefox_mv3_differences_addressed: true,
    target_browsers: ["chrome", "firefox"],
    tested_browsers: ["chrome"],
    difference_documented_browsers: ["firefox"],
  },
  security: {
    csp_discipline_followed: true,
    injected_ui_sanitized: true,
    auto_update_via_store_only: true,
    eval_or_remote_scripts_used: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "EXTENSION_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 37);
  assert.deepEqual(v.permissions_without_justification, []);
  assert.deepEqual(v.browsers_not_covered, []);
});

test("test_persistent_background_page_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mv3.persistent_background_page_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.equal(v.sections["mv3_architecture"], "fail");
});

test("test_remote_code_executed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mv3.remote_code_executed = true;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_timers_instead_of_alarms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mv3.alarms_used_instead_of_timers = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_unjustified_permission_fails_computed", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.requested = ["storage", "activeTab", "tabs"];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.deepEqual(v.permissions_without_justification, ["tabs"]);
  assert.equal(
    checkStatus(v, "all_requested_permissions_justified_in_writing"),
    "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_extra_justifications_do_not_fail", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.justified = ["storage", "activeTab", "alarms"];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_SOUND");
  assert.deepEqual(v.permissions_without_justification, []);
});

test("test_empty_requested_permissions_passes_vacuously", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.requested = [];
  m.permissions.justified = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_SOUND");
  assert.deepEqual(v.permissions_without_justification, []);
});

test("test_missing_permission_lists_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.permissions.justified;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.permissions_without_justification, null);
  assert.equal(v.computed_status, null);
});

test("test_overbroad_permissions_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.overbroad_permissions_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.equal(v.sections["least_privilege_permissions"], "fail");
});

test("test_wide_host_patterns_fail", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.host_patterns_narrow = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_secrets_in_storage_fails", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.secrets_stored_in_extension_storage = true;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_unvalidated_messages_fail", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.messages_validated_on_both_ends = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.equal(v.sections["architecture_and_messaging"], "fail");
});

test("test_drive_by_dom_changes_fail", () => {
  const m = clone(COMPLETE) as any;
  m.ux.drive_by_dom_changes_without_user_intent = true;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_missing_logged_out_states_fails", () => {
  const m = clone(COMPLETE) as any;
  m.ux.logged_out_and_unavailable_states_provided = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_browsing_data_exfiltrated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.browsing_data_exfiltrated = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.equal(v.sections["privacy"], "fail");
});

test("test_hidden_data_collection_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.hidden_data_collection_present = true;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_telemetry_without_consent_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.telemetry_requires_explicit_consent = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_disclosure_not_tested_against_behavior_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.privacy_disclosure_matches_behavior_tested = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_uncovered_target_browser_fails_computed", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.target_browsers = ["chrome", "edge"];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.deepEqual(v.browsers_not_covered, ["edge"]);
  assert.equal(
    checkStatus(
      v, "all_target_browsers_tested_or_differences_documented"),
    "fail");
});

test("test_documented_difference_covers_target_browser", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.target_browsers = ["chrome", "edge"];
  m.distribution.difference_documented_browsers = ["firefox", "edge"];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_SOUND");
  assert.deepEqual(v.browsers_not_covered, []);
});

test("test_empty_target_browsers_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.target_browsers = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.deepEqual(v.browsers_not_covered, []);
  assert.equal(
    checkStatus(
      v, "all_target_browsers_tested_or_differences_documented"),
    "fail");
});

test("test_missing_browser_lists_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.distribution.tested_browsers;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.browsers_not_covered, null);
});

test("test_firefox_differences_not_addressed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.firefox_mv3_differences_addressed = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_inaccurate_privacy_form_fails", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.store_privacy_form_accurate = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_eval_or_remote_scripts_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.security.eval_or_remote_scripts_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXTENSION_DESIGN_DEFICIENT");
  assert.equal(v.sections["security"], "fail");
});

test("test_unsanitized_injected_ui_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.injected_ui_sanitized = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_non_store_auto_update_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.auto_update_via_store_only = false;
  assert.equal(evaluate(m).verdict, "EXTENSION_DESIGN_DEFICIENT");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.privacy;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["privacy"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.permissions_without_justification, null);
  assert.equal(v.browsers_not_covered, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: EXTENSION_DESIGN_SOUND"));
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
  m.extension_name = 12345;
  assert.throws(() => evaluate(m), fieldError("extension_name"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ mv3: "should-be-an-object" }),
    fieldError("mv3"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.requested = "storage";
  assert.throws(() => evaluate(m), fieldError("permissions.requested"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.permissions.requested = ["storage", 42];
  assert.throws(() => evaluate(m), fieldError("permissions.requested[1]"));
});

test("malformed: browser list entry as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.target_browsers = ["chrome", true];
  assert.throws(
    () => evaluate(m), fieldError("distribution.target_browsers[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.mv3.service_worker_background = "yes";
  assert.throws(
    () => evaluate(m), fieldError("mv3.service_worker_background"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.browsing_data_exfiltrated = 0;
  assert.throws(
    () => evaluate(m), fieldError("privacy.browsing_data_exfiltrated"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.permissions = null;
  assert.throws(() => evaluate(m), fieldError("permissions"));
});

test("malformed: null list entry rejected", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.tested_browsers = [null];
  assert.throws(
    () => evaluate(m), fieldError("distribution.tested_browsers[0]"));
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
  .filter((f) => f.startsWith("browser-extension-engineering--") && f.endsWith(".json"))
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
