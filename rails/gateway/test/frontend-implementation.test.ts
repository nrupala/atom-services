import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/frontend-implementation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FRONTEND_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  project: "storefront-ui",
  structure: { semantic_html_first: true,
               small_single_responsibility_components: true,
               data_down_events_up: true, god_components_present: false,
               follows_project_stack_and_styles: true,
               uses_design_tokens: true },
  framework: { new_framework_introduced: false },
  data_views: [
    { name: "product-list", loading_implemented: true,
      empty_implemented: true, error_implemented: true,
      success_implemented: true },
    { name: "cart", loading_implemented: true, empty_implemented: true,
      error_implemented: true, success_implemented: true },
    { name: "account", loading_implemented: true, empty_implemented: true,
      error_implemented: true, success_implemented: true },
  ],
  interactions: { buttons_disabled_while_submitting: true,
                  dead_controls_present: false,
                  silent_failures_present: false },
  data_layer: { single_small_client_per_app: true,
                retries_with_backoff_for_transient_errors: true,
                whole_screen_blocked_by_single_widget_present: false },
  verification: { state_matrix_documented: true,
                  smoke_tests_for_key_flows: true,
                  keyboard_only_primary_journey_passed: true },
  responsive: { fluid_grids_used: true, wrap_safe_text: true,
                stable_dimensions: true,
                widths_verified_360_to_desktop: true,
                overflow_present: false, overlap_present: false,
                has_fixed_bars: true,
                nothing_hidden_behind_fixed_bars: true },
  accessibility: { labels_on_all_fields: true, logical_focus_order: true,
                   aria_live_for_async_results: true,
                   fully_keyboard_operable: true },
  performance: { budget_defined_before_build: true,
                 lazy_load_below_fold: true, layout_shift_avoided: true,
                 static_assets_cached: true,
                 budget_checked_bundle_and_first_paint: true,
                 budget_checked_on_slow_throttle: true },
  errors: { human_readable_messages_in_ui: true,
            details_sent_to_logs_not_ui: true,
            console_spam_present: false },
  security: { secrets_in_frontend_code_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 29 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FRONTEND_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 39);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.data_views_count, 3);
  assert.deepEqual(v.data_views_without_complete_states, []);
  assert.equal(v.state_coverage, "1.000000");
});

test("test_non_semantic_html_fails_structure_section", () => {
  const m = clone(COMPLETE) as any;
  m.structure.semantic_html_first = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
  assert.equal(v.sections["structure_and_components"], "fail");
});

test("test_god_components_fail", () => {
  const m = clone(COMPLETE) as any;
  m.structure.god_components_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_god_components"), "fail");
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
});

test("test_new_framework_without_adr_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framework = { new_framework_introduced: true, adr_recorded: false };
  const v = evaluate(m);
  assert.equal(checkStatus(v, "new_framework_has_adr"), "fail");
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
});

test("test_new_framework_with_adr_passes", () => {
  const m = clone(COMPLETE) as any;
  m.framework = { new_framework_introduced: true, adr_recorded: true };
  assert.equal(evaluate(m).verdict, "FRONTEND_SOUND");
});

test("test_new_framework_missing_adr_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.framework = { new_framework_introduced: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "new_framework_has_adr"), "missing");
});

test("test_no_new_framework_passes_adr_check_as_na", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "new_framework_has_adr"), "pass");
});

test("test_view_missing_a_state_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.data_views[1].empty_implemented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
  assert.equal(checkStatus(v, "every_data_view_has_all_four_states"), "fail");
  assert.deepEqual(v.data_views_without_complete_states, ["cart"]);
  assert.equal(v.state_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_view_missing_state_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.data_views[0].error_implemented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_data_view_has_all_four_states"), "missing");
  assert.deepEqual(v.data_views_without_complete_states, []);
});

test("test_empty_data_views_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data_views = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "data_views_declared"), "fail");
  assert.equal(v.data_views_count, 0);
  assert.equal(v.state_coverage, null);
});

test("test_dead_controls_fail", () => {
  const m = clone(COMPLETE) as any;
  m.interactions.dead_controls_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_dead_controls"), "fail");
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
});

test("test_silent_failures_fail", () => {
  const m = clone(COMPLETE) as any;
  m.interactions.silent_failures_present = true;
  assert.equal(evaluate(m).verdict, "FRONTEND_NOT_SOUND");
});

test("test_whole_screen_blocking_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data_layer.whole_screen_blocked_by_single_widget_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_whole_screen_blocked_by_single_widget"), "fail");
});

test("test_no_retries_fail_data_section", () => {
  const m = clone(COMPLETE) as any;
  m.data_layer.retries_with_backoff_for_transient_errors = false;
  const v = evaluate(m);
  assert.equal(v.sections["states_and_data_layer"], "fail");
});

test("test_overflow_fails_responsive_section", () => {
  const m = clone(COMPLETE) as any;
  m.responsive.overflow_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
  assert.equal(v.sections["responsive_and_accessibility"], "fail");
  assert.equal(checkStatus(v, "no_overflow"), "fail");
});

test("test_content_hidden_behind_fixed_bars_fails", () => {
  const m = clone(COMPLETE) as any;
  m.responsive.nothing_hidden_behind_fixed_bars = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "nothing_hidden_behind_fixed_bars"), "fail");
});

test("test_no_fixed_bars_passes_hidden_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.responsive.has_fixed_bars = false;
  delete m.responsive.nothing_hidden_behind_fixed_bars;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRONTEND_SOUND");
  assert.equal(checkStatus(v, "nothing_hidden_behind_fixed_bars"), "pass");
});

test("test_fixed_bars_missing_hidden_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.responsive.nothing_hidden_behind_fixed_bars;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "nothing_hidden_behind_fixed_bars"), "missing");
});

test("test_missing_labels_fail_accessibility", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.labels_on_all_fields = false;
  assert.equal(evaluate(m).verdict, "FRONTEND_NOT_SOUND");
});

test("test_no_aria_live_fails", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.aria_live_for_async_results = false;
  assert.equal(evaluate(m).verdict, "FRONTEND_NOT_SOUND");
});

test("test_budget_not_checked_on_throttle_fails_perf_section", () => {
  const m = clone(COMPLETE) as any;
  m.performance.budget_checked_on_slow_throttle = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
  assert.equal(v.sections["performance_and_errors"], "fail");
});

test("test_raw_error_details_in_ui_fail", () => {
  const m = clone(COMPLETE) as any;
  m.errors.details_sent_to_logs_not_ui = false;
  assert.equal(evaluate(m).verdict, "FRONTEND_NOT_SOUND");
});

test("test_console_spam_fails_red_line_section", () => {
  const m = clone(COMPLETE) as any;
  m.errors.console_spam_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_console_spam"), "fail");
  assert.equal(v.sections["verification_and_red_lines"], "fail");
});

test("test_secrets_in_frontend_code_fail", () => {
  const m = clone(COMPLETE) as any;
  m.security.secrets_in_frontend_code_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_in_frontend_code"), "fail");
  assert.equal(v.verdict, "FRONTEND_NOT_SOUND");
});

test("test_keyboard_only_journey_not_passed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.verification.keyboard_only_primary_journey_passed = false;
  assert.equal(evaluate(m).verdict, "FRONTEND_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.performance;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["performance_and_errors"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.data_views_count, null);
  assert.equal(v.data_views_without_complete_states, null);
  assert.equal(v.state_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: FRONTEND_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

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
  assert.throws(
    () => evaluate({ structure: "should-be-an-object" }),
    fieldError("structure"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ data_views: { name: "cart" } }),
    fieldError("data_views"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ data_views: ["cart"] }),
    fieldError("data_views[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.structure.semantic_html_first = "yes";
  assert.throws(() => evaluate(m), fieldError("structure.semantic_html_first"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data_views[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("data_views[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data_views[1].empty_implemented = "yes";
  assert.throws(() => evaluate(m), fieldError("data_views[1].empty_implemented"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.performance = null;
  assert.throws(() => evaluate(m), fieldError("performance"));
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
  .filter((f) => f.startsWith("frontend-implementation--") && f.endsWith(".json"))
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
