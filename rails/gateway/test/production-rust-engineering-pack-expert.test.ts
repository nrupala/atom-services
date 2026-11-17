import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/production-rust-engineering-pack-expert.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "guardian-mesh-core",
  lifetime_design: {
    lifetimes_modelled_deliberately_at_api_boundaries: true,
    lifetime_annotation_sprawl_treated_as_layout_signal: true,
    structs_split_when_lifetimes_tangle: true,
    index_handles_or_arenas_used_for_tangled_graphs: true,
    borrow_checker_fights_resolved_by_restructuring: true,
    crate_dependency_graph_acyclic_and_boundaries_clean: true },
  type_design: {
    newtypes_wrap_domain_primitives: true,
    state_machines_modelled_with_enums: true,
    from_into_conversions_for_value_crossings: true,
    builder_pattern_for_complex_construction: true,
    trait_boundaries_chosen_over_premature_generics: true,
    impl_vs_dyn_trait_choice_made_consciously: true,
    error_values_carry_context_at_boundaries: true },
  async_depth: {
    blocking_work_offloaded_via_spawn_blocking: true,
    send_sync_bounds_checked_for_spawned_futures: true,
    mpsc_and_oneshot_channels_assigned_by_purpose: true,
    cancellation_modelled_explicitly_in_async_flows: true },
  performance: {
    flamegraphs_captured_before_optimizing: true,
    criterion_results_gate_optimization_claims: true,
    str_borrows_preferred_over_owned_strings: true,
    iterators_preferred_over_manual_loops: true,
    cow_used_for_maybe_owned_data: true,
    smallvec_used_where_small_sizes_dominate: true },
  unsafe_ffi: {
    unsafe_surface_encapsulated_behind_safe_api: true,
    wasm_sandboxing_via_wasm_bindgen_for_untrusted_code: true },
  ffi_bindings: [
    { name: "pae::gemm_f64", safe_wrapper_present: true, safety_comment_present: true, miri_tested: true },
    { name: "pae::syrk_f64", safe_wrapper_present: true, safety_comment_present: true, miri_tested: true },
  ],
  crypto: {
    vetted_crypto_crates_only_rustcrypto_or_ring: true,
    secrets_zeroized_after_use: true,
    constant_time_comparison_for_timing_sensitive_checks: true },
  expert_red_lines: {
    reflexive_clone_rc_dodge_present: false,
    premature_unsafe_present: false,
    homemade_crypto_present: false,
    lifetime_soup_papered_over_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.ffi_bindings_count, 2);
  assert.deepEqual(v.ffi_bindings_without_safe_wrapper, []);
  assert.deepEqual(v.ffi_bindings_without_safety_comment, []);
  assert.deepEqual(v.ffi_bindings_without_miri, []);
  assert.equal(v.safe_wrapper_coverage, "1.000000");
  assert.equal(v.safety_comment_coverage, "1.000000");
  assert.equal(v.miri_coverage, "1.000000");
  assert.deepEqual(v.duplicate_ffi_binding_names, []);
});

test("test_empty_ffi_bindings_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY");
  assert.equal(v.ffi_bindings_count, 0);
  assert.equal(v.safe_wrapper_coverage, null);
  assert.equal(v.miri_coverage, null);
  assert.equal(checkStatus(v, "ffi_bindings_declared"), "pass");
  assert.equal(checkStatus(v, "every_ffi_binding_tested_under_miri"), "pass");
});

test("test_lifetime_soup_annotated_over_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.lifetime_design.lifetime_annotation_sprawl_treated_as_layout_signal = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY");
  assert.equal(v.sections["lifetime_architecture_depth"], "fail");
});

test("test_cyclic_crate_graph_fails", () => {
  const m = clone(COMPLETE) as any;
  m.lifetime_design.crate_dependency_graph_acyclic_and_boundaries_clean = false;
  assert.equal(checkStatus(evaluate(m), "crate_dependency_graph_acyclic_and_boundaries_clean"), "fail");
});

test("test_bare_primitives_fail_type_design", () => {
  const m = clone(COMPLETE) as any;
  m.type_design.newtypes_wrap_domain_primitives = false;
  assert.equal(evaluate(m).sections["type_system_and_api_design"], "fail");
});

test("test_unconscious_dyn_choice_fails", () => {
  const m = clone(COMPLETE) as any;
  m.type_design.impl_vs_dyn_trait_choice_made_consciously = false;
  assert.equal(checkStatus(evaluate(m), "impl_vs_dyn_trait_choice_made_consciously"), "fail");
});

test("test_blocking_without_spawn_blocking_fails_async_depth", () => {
  const m = clone(COMPLETE) as any;
  m.async_depth.blocking_work_offloaded_via_spawn_blocking = false;
  assert.equal(evaluate(m).sections["async_runtime_depth"], "fail");
});

test("test_unmodelled_cancellation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.async_depth.cancellation_modelled_explicitly_in_async_flows = false;
  assert.equal(checkStatus(evaluate(m), "cancellation_modelled_explicitly_in_async_flows"), "fail");
});

test("test_optimizing_without_flamegraph_fails_performance", () => {
  const m = clone(COMPLETE) as any;
  m.performance.flamegraphs_captured_before_optimizing = false;
  assert.equal(evaluate(m).sections["performance_measurement_and_allocation"], "fail");
});

test("test_owned_strings_everywhere_fails", () => {
  const m = clone(COMPLETE) as any;
  m.performance.str_borrows_preferred_over_owned_strings = false;
  assert.equal(checkStatus(evaluate(m), "str_borrows_preferred_over_owned_strings"), "fail");
});

test("test_binding_without_safe_wrapper_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[0].safe_wrapper_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY");
  assert.equal(checkStatus(v, "every_ffi_binding_exposes_safe_wrapper"), "fail");
  assert.deepEqual(v.ffi_bindings_without_safe_wrapper, ["pae::gemm_f64"]);
  assert.equal(v.safe_wrapper_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_binding_without_safety_comment_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[1].safety_comment_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ffi_binding_carries_safety_comment"), "fail");
  assert.deepEqual(v.ffi_bindings_without_safety_comment, ["pae::syrk_f64"]);
  assert.equal(v.safety_comment_coverage, "0.500000");
});

test("test_binding_not_miri_tested_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[0].miri_tested = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ffi_binding_tested_under_miri"), "fail");
  assert.deepEqual(v.ffi_bindings_without_miri, ["pae::gemm_f64"]);
  assert.equal(v.miri_coverage, "0.500000");
});

test("test_binding_missing_miri_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.ffi_bindings[0].miri_tested;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_ffi_binding_tested_under_miri"), "missing");
  assert.deepEqual(v.ffi_bindings_without_miri, []);
});

test("test_duplicate_binding_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[1].name = "pae::gemm_f64";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_ffi_binding_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_ffi_binding_names, ["pae::gemm_f64"]);
});

test("test_binding_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.ffi_bindings[1].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_ffi_binding_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_ffi_binding_names, []);
});

test("test_absent_ffi_bindings_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.ffi_bindings;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "ffi_bindings_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.ffi_bindings_count, null);
  assert.equal(v.ffi_bindings_without_safe_wrapper, null);
  assert.equal(v.safe_wrapper_coverage, null);
  assert.equal(v.duplicate_ffi_binding_names, null);
});

test("test_unvetted_crypto_fails", () => {
  const m = clone(COMPLETE) as any;
  m.crypto.vetted_crypto_crates_only_rustcrypto_or_ring = false;
  assert.equal(evaluate(m).sections["cryptography_and_secret_handling"], "fail");
});

test("test_secrets_not_zeroized_fails", () => {
  const m = clone(COMPLETE) as any;
  m.crypto.secrets_zeroized_after_use = false;
  assert.equal(checkStatus(evaluate(m), "secrets_zeroized_after_use"), "fail");
});

test("test_reflexive_clone_rc_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.expert_red_lines.reflexive_clone_rc_dodge_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "expert_no_reflexive_clone_rc_dodge"), "fail");
  assert.equal(v.sections["expert_red_lines"], "fail");
});

test("test_homemade_crypto_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_red_lines.homemade_crypto_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "expert_no_homemade_crypto"), "fail");
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY");
});

test("test_premature_unsafe_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_red_lines.premature_unsafe_present = true;
  assert.equal(checkStatus(evaluate(m), "expert_no_premature_unsafe"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.performance;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["performance_measurement_and_allocation"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.ffi_bindings_count, null);
  assert.equal(v.ffi_bindings_without_safe_wrapper, null);
  assert.equal(v.ffi_bindings_without_safety_comment, null);
  assert.equal(v.ffi_bindings_without_miri, null);
  assert.equal(v.safe_wrapper_coverage, null);
  assert.equal(v.safety_comment_coverage, null);
  assert.equal(v.miri_coverage, null);
  assert.equal(v.duplicate_ffi_binding_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY"));
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
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ lifetime_design: "should-be-an-object" }), fieldError("lifetime_design"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ ffi_bindings: { name: "pae::x" } }), fieldError("ffi_bindings"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ ffi_bindings: ["pae::x"] }), fieldError("ffi_bindings[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.crypto.secrets_zeroized_after_use = "yes";
  assert.throws(() => evaluate(m), fieldError("crypto.secrets_zeroized_after_use"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("ffi_bindings[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.ffi_bindings[1].miri_tested = 7;
  assert.throws(() => evaluate(m), fieldError("ffi_bindings[1].miri_tested"));
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
  .filter((f) => f.startsWith("production-rust-engineering-pack-expert--") && f.endsWith(".json"))
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
