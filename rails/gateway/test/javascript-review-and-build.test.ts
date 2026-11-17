import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/javascript-review-and-build.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  subject: "site-widget",
  modules: { esm_used_everywhere: true, implicit_globals_present: false,
             var_used_present: false,
             const_by_default_let_when_reassigned: true,
             strict_mode_in_effect: true,
             jsdoc_types_for_reused_code: true },
  async: { async_await_with_real_error_handling: true,
           every_promise_handled_or_explicitly_caught: true,
           network_calls_present: true,
           network_timeouts_via_abort_controller: true },
  dom: { nodes_built_with_text_content_and_create_element: true,
         user_input_via_inner_html_present: false,
         html_truly_needed_present: true,
         sanitization_applied_when_html_truly_needed: true },
  environment: { no_dom_apis_in_node_code: true,
                 shared_code_present: true,
                 feature_detection_when_shared_code: true },
  bundle: { bundle_contents_known: true,
            huge_dependencies_for_small_jobs_present: false,
            optional_code_split: true },
  files: [
    { name: "main.js", esm_module: true, var_present: false,
      unhandled_promise_present: false,
      inner_html_with_user_input_present: false },
    { name: "api.js", esm_module: true, var_present: false,
      unhandled_promise_present: false,
      inner_html_with_user_input_present: false },
    { name: "widget.js", esm_module: true, var_present: false,
      unhandled_promise_present: false,
      inner_html_with_user_input_present: false },
  ],
  tests: { pure_logic_unit_tested: true, ui_present: true,
           manual_smoke_for_ui: true,
           logic_extracted_from_event_handlers_and_tested: true },
  red_lines: { eval_or_function_on_untrusted_input_present: false,
               secrets_in_client_side_code_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 27);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.files_count, 3);
  assert.deepEqual(v.files_without_esm, []);
  assert.equal(v.esm_coverage, "1.000000");
  assert.deepEqual(v.files_using_var, []);
  assert.deepEqual(v.files_with_unhandled_promises, []);
  assert.deepEqual(v.files_injecting_user_input_via_inner_html, []);
});

test("test_implicit_globals_fail_modules_section", () => {
  const m = clone(COMPLETE) as any;
  m.modules.implicit_globals_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
  assert.equal(v.sections["modules_and_strictness"], "fail");
  assert.equal(checkStatus(v, "no_implicit_globals"), "fail");
});

test("test_var_used_fails", () => {
  const m = clone(COMPLETE) as any;
  m.modules.var_used_present = true;
  assert.equal(evaluate(m).verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
});

test("test_non_esm_fails", () => {
  const m = clone(COMPLETE) as any;
  m.modules.esm_used_everywhere = false;
  assert.equal(evaluate(m).verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
});

test("test_network_timeout_missing_when_calls_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.async.network_timeouts_via_abort_controller = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "network_timeouts_via_abort_controller_when_network_calls"), "fail");
});

test("test_no_network_calls_passes_timeout_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.async = { async_await_with_real_error_handling: true,
              every_promise_handled_or_explicitly_caught: true,
              network_calls_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_SOUND");
  assert.equal(checkStatus(v, "network_timeouts_via_abort_controller_when_network_calls"), "pass");
});

test("test_network_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.async.network_timeouts_via_abort_controller;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "network_timeouts_via_abort_controller_when_network_calls"), "missing");
});

test("test_unhandled_promise_declaration_fails_async_section", () => {
  const m = clone(COMPLETE) as any;
  m.async.every_promise_handled_or_explicitly_caught = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
  assert.equal(v.sections["async_discipline"], "fail");
});

test("test_file_without_esm_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.files[0].esm_module = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
  assert.equal(checkStatus(v, "every_file_is_esm"), "fail");
  assert.deepEqual(v.files_without_esm, ["main.js"]);
  assert.equal(v.esm_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_file_missing_esm_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.files[0].esm_module;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_file_is_esm"), "missing");
  assert.deepEqual(v.files_without_esm, []);
});

test("test_file_using_var_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.files[2].var_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_file_uses_var"), "fail");
  assert.deepEqual(v.files_using_var, ["widget.js"]);
});

test("test_file_with_unhandled_promise_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.files[1].unhandled_promise_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_file_has_unhandled_promise"), "fail");
  assert.deepEqual(v.files_with_unhandled_promises, ["api.js"]);
});

test("test_file_injecting_user_input_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.files[1].inner_html_with_user_input_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_file_injects_user_input_via_inner_html"), "fail");
  assert.deepEqual(v.files_injecting_user_input_via_inner_html, ["api.js"]);
});

test("test_empty_files_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.files = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "files_declared"), "fail");
  assert.equal(v.files_count, 0);
  assert.equal(v.esm_coverage, null);
});

test("test_user_input_via_inner_html_fails_dom_section", () => {
  const m = clone(COMPLETE) as any;
  m.dom.user_input_via_inner_html_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_user_input_via_inner_html"), "fail");
  assert.equal(v.sections["dom_safety"], "fail");
});

test("test_sanitization_missing_when_html_needed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dom.sanitization_applied_when_html_truly_needed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sanitization_when_html_truly_needed"), "fail");
});

test("test_no_html_needed_passes_sanitization_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.dom = { nodes_built_with_text_content_and_create_element: true,
            user_input_via_inner_html_present: false,
            html_truly_needed_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_SOUND");
  assert.equal(checkStatus(v, "sanitization_when_html_truly_needed"), "pass");
});

test("test_dom_apis_in_node_fail_environment_section", () => {
  const m = clone(COMPLETE) as any;
  m.environment.no_dom_apis_in_node_code = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
  assert.equal(v.sections["environment_and_bundle"], "fail");
});

test("test_feature_detection_missing_when_shared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.environment.feature_detection_when_shared_code = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "feature_detection_when_shared_code"), "fail");
});

test("test_no_shared_code_passes_feature_detection_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.environment = { no_dom_apis_in_node_code: true, shared_code_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_SOUND");
  assert.equal(checkStatus(v, "feature_detection_when_shared_code"), "pass");
});

test("test_huge_dependencies_fail_bundle", () => {
  const m = clone(COMPLETE) as any;
  m.bundle.huge_dependencies_for_small_jobs_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_huge_dependencies_for_small_jobs"), "fail");
});

test("test_optional_not_split_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bundle.optional_code_split = false;
  assert.equal(evaluate(m).verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
});

test("test_pure_logic_untested_fails_tests_section", () => {
  const m = clone(COMPLETE) as any;
  m.tests.pure_logic_unit_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
  assert.equal(v.sections["tests_and_red_lines"], "fail");
});

test("test_manual_smoke_missing_when_ui_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tests.manual_smoke_for_ui = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "manual_smoke_for_ui_when_ui_present"), "fail");
});

test("test_no_ui_passes_manual_smoke_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.tests = { pure_logic_unit_tested: true, ui_present: false,
              logic_extracted_from_event_handlers_and_tested: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_SOUND");
  assert.equal(checkStatus(v, "manual_smoke_for_ui_when_ui_present"), "pass");
});

test("test_logic_in_handlers_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tests.logic_extracted_from_event_handlers_and_tested = false;
  assert.equal(evaluate(m).verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
});

test("test_eval_on_untrusted_input_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.eval_or_function_on_untrusted_input_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_eval_or_function_on_untrusted_input"), "fail");
  assert.equal(v.sections["tests_and_red_lines"], "fail");
});

test("test_secrets_in_client_code_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.secrets_in_client_side_code_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_in_client_side_code"), "fail");
  assert.equal(v.verdict, "JAVASCRIPT_REVIEW_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.async;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["async_discipline"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.files_count, null);
  assert.equal(v.files_without_esm, null);
  assert.equal(v.esm_coverage, null);
  assert.equal(v.files_using_var, null);
  assert.equal(v.files_with_unhandled_promises, null);
  assert.equal(v.files_injecting_user_input_via_inner_html, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: JAVASCRIPT_REVIEW_SOUND"));
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
  m.subject = 12345;
  assert.throws(() => evaluate(m), fieldError("subject"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ async: "should-be-an-object" }), fieldError("async"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ files: { name: "main.js" } }), fieldError("files"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ files: ["main.js"] }), fieldError("files[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.modules.strict_mode_in_effect = "yes";
  assert.throws(() => evaluate(m), fieldError("modules.strict_mode_in_effect"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.files[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("files[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.files[1].esm_module = "yes";
  assert.throws(() => evaluate(m), fieldError("files[1].esm_module"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.dom = null;
  assert.throws(() => evaluate(m), fieldError("dom"));
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
  .filter((f) => f.startsWith("javascript-review-and-build--") && f.endsWith(".json"))
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
