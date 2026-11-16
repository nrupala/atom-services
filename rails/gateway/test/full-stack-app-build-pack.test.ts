import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/full-stack-app-build-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FULL_STACK_BUILD_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  project: "booking-app",
  approach: { problem_and_data_flow_understood: true,
              user_visible_outcome_defined: true,
              source_of_truth_identified: true,
              contract_defined_first: true,
              data_shape_defined_first: true,
              vertical_slice_before_widening: true },
  slices: [
    { name: "book-a-slot", end_to_end_complete: true },
    { name: "list-bookings", end_to_end_complete: true },
  ],
  frontend: { vanilla_ts_web_components_used: true,
              progressive_enhancement_applied: true,
              dependency_tree_kept_small: true,
              mobile_first_responsive: true,
              viewport_configured: true,
              touch_targets_at_least_44px: true,
              semantic_html_used: true,
              keyboard_navigation_supported: true,
              aria_only_where_needed: true,
              sufficient_contrast: true,
              boundaries_typed_no_any: true,
              undefined_fields_guarded_when_rendering: true,
              framework_bloat_present: false },
  backend: { api_contracts_versioned: true,
             input_validated_at_boundary: true,
             handlers_stateless: true,
             idempotency_for_retried_writes: true,
             error_taxonomy_defined: true,
             structured_error_responses: true,
             bare_500_responses_present: false,
             health_endpoint_present: true },
  data: { schema_is_source_of_truth: true,
          migrations_forward_only: true,
          migrations_backward_compatible: true,
          parametrized_queries_only: true,
          string_concatenated_sql_present: false },
  security: { authn_authz_separated: true,
              least_privilege_enforced: true,
              secrets_via_env_or_secret_store: true,
              secrets_rotatable: true,
              secrets_in_repo_present: false,
              owasp_top10_reviewed: true,
              zero_knowledge_required: true,
              client_side_encryption_applied: true,
              user_held_keys: true },
  testing: { unit_tests_for_logic: true,
             integration_tests_for_boundaries: true,
             e2e_critical_path_tested: true,
             tests_target_contract_not_implementation: true,
             tests_deferred_present: false,
             observability_in_place: true,
             graceful_degradation: true,
             stranger_readable_code: true },
  deploy: { docker_used_present: false,
            uses_direct_or_platform_native_deploy: true,
            staging_deployed_first: true,
            direct_to_production_used: false,
            github_repo_in_sync_with_deployed: true,
            big_bang_release_present: false,
            premature_optimization_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 26 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FULL_STACK_BUILD_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 57);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.slices_count, 2);
  assert.deepEqual(v.slices_not_end_to_end, []);
  assert.equal(v.slice_end_to_end_coverage, "1.000000");
});

test("test_contract_not_defined_first_fails_approach_section", () => {
  const m = clone(COMPLETE) as any;
  m.approach.contract_defined_first = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["approach_and_contracts"], "fail");
});

test("test_slice_not_end_to_end_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.slices[1].end_to_end_complete = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(checkStatus(v, "every_slice_end_to_end"), "fail");
  assert.deepEqual(v.slices_not_end_to_end, ["list-bookings"]);
  assert.equal(v.slice_end_to_end_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_slice_missing_e2e_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.slices[0].end_to_end_complete;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_slice_end_to_end"), "missing");
  assert.deepEqual(v.slices_not_end_to_end, []);
});

test("test_empty_slices_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.slices = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "slices_declared"), "fail");
  assert.equal(v.slices_count, 0);
  assert.equal(v.slice_end_to_end_coverage, null);
  assert.deepEqual(v.slices_not_end_to_end, []);
});

test("test_framework_bloat_fails_frontend_section", () => {
  const m = clone(COMPLETE) as any;
  m.frontend.framework_bloat_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["frontend"], "fail");
  assert.equal(checkStatus(v, "no_framework_bloat"), "fail");
});

test("test_touch_targets_below_44px_fails", () => {
  const m = clone(COMPLETE) as any;
  m.frontend.touch_targets_at_least_44px = false;
  assert.equal(evaluate(m).verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_bare_500_responses_fail_backend_section", () => {
  const m = clone(COMPLETE) as any;
  m.backend.bare_500_responses_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["backend_and_data"], "fail");
  assert.equal(checkStatus(v, "no_bare_500_responses"), "fail");
});

test("test_no_health_endpoint_fails", () => {
  const m = clone(COMPLETE) as any;
  m.backend.health_endpoint_present = false;
  assert.equal(evaluate(m).verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_string_concatenated_sql_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.string_concatenated_sql_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_string_concatenated_sql"), "fail");
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_non_parametrized_queries_fail", () => {
  const m = clone(COMPLETE) as any;
  m.data.parametrized_queries_only = false;
  assert.equal(evaluate(m).verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_secrets_in_repo_fail_security_section", () => {
  const m = clone(COMPLETE) as any;
  m.security.secrets_in_repo_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["security"], "fail");
  assert.equal(checkStatus(v, "no_secrets_in_repo"), "fail");
});

test("test_zero_knowledge_required_but_no_client_encryption_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.client_side_encryption_applied = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "client_side_encryption_applied"), "fail");
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_zero_knowledge_not_required_passes_gated_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.security.zero_knowledge_required = false;
  delete m.security.client_side_encryption_applied;
  delete m.security.user_held_keys;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_SOUND");
  assert.equal(checkStatus(v, "client_side_encryption_applied"), "pass");
  assert.equal(checkStatus(v, "user_held_keys"), "pass");
});

test("test_zero_knowledge_missing_target_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.security.user_held_keys;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "user_held_keys"), "missing");
});

test("test_tests_deferred_fails_testing_section", () => {
  const m = clone(COMPLETE) as any;
  m.testing.tests_deferred_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["testing_and_quality"], "fail");
  assert.equal(checkStatus(v, "no_tests_deferred"), "fail");
});

test("test_no_e2e_critical_path_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.e2e_critical_path_tested = false;
  assert.equal(evaluate(m).verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_docker_used_fails_deploy_section", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.docker_used_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
  assert.equal(v.sections["deploy_and_delivery"], "fail");
  assert.equal(checkStatus(v, "no_docker_used"), "fail");
});

test("test_direct_to_prod_without_named_bridge_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.direct_to_production_used = true;
  m.deploy.direct_to_prod_named_bridge_with_end_date = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "direct_to_prod_named_bridge_with_end_date"), "fail");
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_direct_to_prod_with_named_bridge_passes", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.direct_to_production_used = true;
  m.deploy.direct_to_prod_named_bridge_with_end_date = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FULL_STACK_BUILD_SOUND");
  assert.equal(checkStatus(v, "direct_to_prod_named_bridge_with_end_date"), "pass");
});

test("test_no_direct_to_prod_passes_gated_check_as_na", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "direct_to_prod_named_bridge_with_end_date"), "pass");
});

test("test_big_bang_release_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deploy.big_bang_release_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_big_bang_release"), "fail");
  assert.equal(v.verdict, "FULL_STACK_BUILD_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.backend;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["backend_and_data"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.slices_count, null);
  assert.equal(v.slices_not_end_to_end, null);
  assert.equal(v.slice_end_to_end_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: FULL_STACK_BUILD_SOUND"));
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
    () => evaluate({ backend: "should-be-an-object" }),
    fieldError("backend"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ slices: { name: "book-a-slot" } }),
    fieldError("slices"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ slices: ["book-a-slot"] }),
    fieldError("slices[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.backend.api_contracts_versioned = "yes";
  assert.throws(() => evaluate(m), fieldError("backend.api_contracts_versioned"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.slices[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("slices[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.slices[1].end_to_end_complete = "yes";
  assert.throws(() => evaluate(m), fieldError("slices[1].end_to_end_complete"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.security = null;
  assert.throws(() => evaluate(m), fieldError("security"));
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
  .filter((f) => f.startsWith("full-stack-app-build-pack--") && f.endsWith(".json"))
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
