import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/ux-flow-component-spec-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const ALL_STATES = ["default", "hover", "active", "disabled", "focus", "loading", "error"];

const COMPLETE: Record<string, unknown> = {
  spec_title: "checkout-flow-spec",
  flow_design: { flows_designed_before_implementation: true,
                 primary_journeys_documented_as_step_diagrams: true,
                 information_hierarchy_defined_per_screen: true,
                 content_before_decoration: true },
  flow_steps: [
    { step_id: "step-1", intent: "Review cart", entry_condition: "Cart has items",
      exit_condition: "Cart confirmed", next_step_ids: ["step-2"] },
    { step_id: "step-2", intent: "Pay", entry_condition: "Cart confirmed",
      exit_condition: "Payment submitted", next_step_ids: [] },
  ],
  design_tokens: { tokens_single_source_declared: true, color_tokens_defined: true,
                   type_scale_tokens_defined: true, spacing_tokens_defined: true,
                   radius_tokens_defined: true, elevation_tokens_defined: true },
  components: [
    { component_id: "comp-1", purpose: "Submit payment",
      variants_declared: "primary, secondary", interactive: true,
      decorative_only: false, states_declared: [...ALL_STATES] },
    { component_id: "comp-2", purpose: "Show order summary",
      variants_declared: "compact, full", interactive: false,
      decorative_only: false, states_declared: ["default"] },
  ],
  screens: [
    { screen_id: "scr-1", is_data_surface: true, empty_state_designed: true,
      loading_state_designed: true, error_state_designed: true,
      contrast_check_noted: true, keyboard_check_noted: true },
    { screen_id: "scr-2", is_data_surface: false, empty_state_designed: false,
      loading_state_designed: false, error_state_designed: false,
      contrast_check_noted: true, keyboard_check_noted: true },
  ],
  accessibility: { wcag_target_declared: "WCAG AA",
                   keyboard_reachable_declared: true,
                   labels_on_all_fields_declared: true,
                   visible_focus_declared: true,
                   reduced_motion_respected_declared: true },
  microcopy: { buttons_say_what_they_do: true, errors_say_how_to_fix: true,
               empty_states_say_what_to_do_next: true,
               microcopy_reviewed_for_clarity: true },
  critique: { compared_against_brief: true,
              compared_against_domain_conventions: true,
              non_orienting_decoration_cut: true },
  red_lines: { placeholder_lorem_shipped_present: false,
               dead_controls_present: false,
               accessibility_traded_for_aesthetics_present: false,
               aesthetics_traded_for_accessibility_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "UX_SPEC_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 45);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.ux_flow_steps_count, 2);
  assert.equal(v.ux_components_count, 2);
  assert.equal(v.ux_screens_count, 2);
  assert.equal(v.ux_interactive_components_count, 1);
  assert.equal(v.ux_data_surfaces_count, 1);
  assert.deepEqual(v.duplicate_ux_flow_step_ids, []);
  assert.equal(v.flow_step_reference_resolution_ratio, "1.000000");
  assert.equal(v.interactive_component_complete_state_ratio, "1.000000");
  assert.equal(v.data_surface_complete_state_ratio, "1.000000");
  assert.equal(v.screen_accessibility_check_ratio, "1.000000");
});

test("test_flow_not_before_implementation_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.flow_design.flows_designed_before_implementation = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UX_SPEC_NOT_SOUND");
  assert.equal(v.sections["ux_flows_and_hierarchy"], "fail");
  assert.equal(checkStatus(v, "ux_flow_designed_before_implementation"), "fail");
});

test("test_duplicate_step_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[1].step_id = "step-1";
  m.flow_steps[0].next_step_ids = ["step-1"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_flow_step_id_unique"), "fail");
  assert.deepEqual(v.duplicate_ux_flow_step_ids, ["step-1"]);
});

test("test_empty_intent_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[0].intent = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_flow_step_intent_declared"), "fail");
  assert.deepEqual(v.ux_flow_steps_without_intent, ["step-1"]);
});

test("test_empty_entry_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[0].entry_condition = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_flow_step_entry_condition_declared"), "fail");
  assert.deepEqual(v.ux_flow_steps_without_entry_condition, ["step-1"]);
});

test("test_empty_exit_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[1].exit_condition = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_flow_step_exit_condition_declared"), "fail");
  assert.deepEqual(v.ux_flow_steps_without_exit_condition, ["step-2"]);
});

test("test_unresolved_next_step_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[0].next_step_ids = ["step-99"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_flow_step_next_step_reference_resolves"), "fail");
  assert.deepEqual(v.ux_flow_steps_with_unresolved_next_step_references, ["step-1"]);
  assert.equal(v.flow_step_reference_resolution_ratio, "0.500000");
});

test("test_absent_flow_steps_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.flow_steps;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "ux_flow_steps_list_declared"), "missing");
  assert.equal(v.ux_flow_steps_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_components_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "ux_components_list_declared"), "fail");
  assert.equal(v.ux_components_count, 0);
});

test("test_interactive_missing_state_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].states_declared = ["default", "hover"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_interactive_ux_component_state_inventory_complete"), "fail");
  assert.deepEqual(v.interactive_ux_components_with_incomplete_states, ["comp-1"]);
  assert.equal(v.interactive_component_complete_state_ratio, "0.000000");
});

test("test_interactive_missing_states_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.components[0].states_declared;
  assert.equal(checkStatus(evaluate(m), "every_interactive_ux_component_state_inventory_complete"), "missing");
});

test("test_noninteractive_incomplete_states_passes", () => {
  assert.equal(checkStatus(evaluate(clone(COMPLETE)), "every_interactive_ux_component_state_inventory_complete"), "pass");
});

test("test_interactive_decorative_only_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].decorative_only = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_interactive_ux_component_decorative_only"), "fail");
  assert.deepEqual(v.interactive_ux_components_declared_decorative_only, ["comp-1"]);
});

test("test_component_without_purpose_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[1].purpose = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_component_purpose_declared"), "fail");
  assert.deepEqual(v.ux_components_without_purpose, ["comp-2"]);
});

test("test_component_without_variants_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].variants_declared = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_component_variants_declared"), "fail");
  assert.deepEqual(v.ux_components_without_variants, ["comp-1"]);
});

test("test_data_surface_without_empty_fails", () => {
  const m = clone(COMPLETE) as any;
  m.screens[0].empty_state_designed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_data_surface_empty_state_designed"), "fail");
  assert.deepEqual(v.ux_data_surfaces_without_empty_state, ["scr-1"]);
  assert.equal(v.data_surface_complete_state_ratio, "0.000000");
});

test("test_non_data_surface_without_states_passes", () => {
  assert.equal(evaluate(clone(COMPLETE)).sections["ux_data_surface_states"], "pass");
});

test("test_data_surface_missing_loading_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.screens[0].loading_state_designed;
  assert.equal(checkStatus(evaluate(m), "every_ux_data_surface_loading_state_designed"), "missing");
});

test("test_empty_wcag_target_fails_declaration_only", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.wcag_target_declared = "";
  assert.equal(checkStatus(evaluate(m), "ux_accessibility_wcag_target_declared"), "fail");
});

test("test_screen_without_contrast_check_fails", () => {
  const m = clone(COMPLETE) as any;
  m.screens[1].contrast_check_noted = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ux_screen_contrast_check_noted"), "fail");
  assert.deepEqual(v.ux_screens_without_contrast_check, ["scr-2"]);
  assert.equal(v.screen_accessibility_check_ratio, "0.500000");
});

test("test_screen_without_keyboard_check_fails", () => {
  const m = clone(COMPLETE) as any;
  m.screens[0].keyboard_check_noted = false;
  assert.equal(checkStatus(evaluate(m), "every_ux_screen_keyboard_check_noted"), "fail");
});

test("test_token_missing_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.design_tokens.color_tokens_defined = false;
  assert.equal(evaluate(m).sections["ux_design_tokens"], "fail");
});

test("test_microcopy_error_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.microcopy.errors_say_how_to_fix = false;
  assert.equal(evaluate(m).sections["ux_microcopy_and_critique"], "fail");
});

test("test_dead_controls_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.dead_controls_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "UX_SPEC_NOT_SOUND");
});

test("test_accessibility_trade_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.accessibility_traded_for_aesthetics_present = true;
  assert.equal(checkStatus(evaluate(m), "ux_spec_free_of_accessibility_traded_for_aesthetics"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.microcopy;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["ux_microcopy_and_critique"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.ux_flow_steps_count, null);
  assert.equal(v.flow_step_reference_resolution_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: UX_SPEC_SOUND"));
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
  m.spec_title = 12345;
  assert.throws(() => evaluate(m), fieldError("spec_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ flow_design: "should-be-an-object" }), fieldError("flow_design"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ flow_steps: { step_id: "step-1" } }), fieldError("flow_steps"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ components: ["comp-1"] }), fieldError("components[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.microcopy.buttons_say_what_they_do = "yes";
  assert.throws(() => evaluate(m), fieldError("microcopy.buttons_say_what_they_do"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.flow_steps[0].next_step_ids = [42];
  assert.throws(() => evaluate(m), fieldError("flow_steps[0].next_step_ids[0]"));
});

test("malformed: states list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].states_declared = [42];
  assert.throws(() => evaluate(m), fieldError("components[0].states_declared[0]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility = null;
  assert.throws(() => evaluate(m), fieldError("accessibility"));
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
  .filter((f) => f.startsWith("ux-flow-component-spec-pack--") && f.endsWith(".json"))
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
