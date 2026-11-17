// Production Rust engineering pack expert — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/production-rust-engineering-pack-expert/src/production_rust_engineering_pack_expert.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  lifetime_design: {
    lifetimes_modelled_deliberately_at_api_boundaries: "boolean",
    lifetime_annotation_sprawl_treated_as_layout_signal: "boolean",
    structs_split_when_lifetimes_tangle: "boolean",
    index_handles_or_arenas_used_for_tangled_graphs: "boolean",
    borrow_checker_fights_resolved_by_restructuring: "boolean",
    crate_dependency_graph_acyclic_and_boundaries_clean: "boolean",
  },
  type_design: {
    newtypes_wrap_domain_primitives: "boolean",
    state_machines_modelled_with_enums: "boolean",
    from_into_conversions_for_value_crossings: "boolean",
    builder_pattern_for_complex_construction: "boolean",
    trait_boundaries_chosen_over_premature_generics: "boolean",
    impl_vs_dyn_trait_choice_made_consciously: "boolean",
    error_values_carry_context_at_boundaries: "boolean",
  },
  async_depth: {
    blocking_work_offloaded_via_spawn_blocking: "boolean",
    send_sync_bounds_checked_for_spawned_futures: "boolean",
    mpsc_and_oneshot_channels_assigned_by_purpose: "boolean",
    cancellation_modelled_explicitly_in_async_flows: "boolean",
  },
  performance: {
    flamegraphs_captured_before_optimizing: "boolean",
    criterion_results_gate_optimization_claims: "boolean",
    str_borrows_preferred_over_owned_strings: "boolean",
    iterators_preferred_over_manual_loops: "boolean",
    cow_used_for_maybe_owned_data: "boolean",
    smallvec_used_where_small_sizes_dominate: "boolean",
  },
  unsafe_ffi: {
    unsafe_surface_encapsulated_behind_safe_api: "boolean",
    wasm_sandboxing_via_wasm_bindgen_for_untrusted_code: "boolean",
  },
  ffi_bindings: [{
    name: "string",
    safe_wrapper_present: "boolean",
    safety_comment_present: "boolean",
    miri_tested: "boolean",
  }],
  crypto: {
    vetted_crypto_crates_only_rustcrypto_or_ring: "boolean",
    secrets_zeroized_after_use: "boolean",
    constant_time_comparison_for_timing_sensitive_checks: "boolean",
  },
  expert_red_lines: {
    reflexive_clone_rc_dodge_present: "boolean",
    premature_unsafe_present: "boolean",
    homemade_crypto_present: "boolean",
    lifetime_soup_papered_over_present: "boolean",
  },
};

export const SECTIONS = [
  "lifetime_architecture_depth",
  "type_system_and_api_design",
  "async_runtime_depth",
  "performance_measurement_and_allocation",
  "unsafe_ffi_and_wasm_depth",
  "cryptography_and_secret_handling",
  "expert_red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  ffi_bindings_count: number | null;
  ffi_bindings_without_safe_wrapper: string[] | null;
  ffi_bindings_without_safety_comment: string[] | null;
  ffi_bindings_without_miri: string[] | null;
  safe_wrapper_coverage: string | null;
  safety_comment_coverage: string | null;
  miri_coverage: string | null;
  duplicate_ffi_binding_names: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [bindingsRaw, hasBindings] = getPath(manifest, "ffi_bindings");
  const bindingsIsList = hasBindings && Array.isArray(bindingsRaw);
  const rows: unknown[] = bindingsIsList ? (bindingsRaw as unknown[]) : [];
  const bindingsCount: number | null = bindingsIsList ? rows.length : null;

  const bindingsWithoutWrapper: string[] | null = bindingsIsList
    ? rows.filter((c) => hasField(c, "safe_wrapper_present") &&
        (c as Record<string, unknown>)["safe_wrapper_present"] !== true)
        .map(rowName)
    : null;
  const bindingsWithoutSafetyComment: string[] | null = bindingsIsList
    ? rows.filter((c) => hasField(c, "safety_comment_present") &&
        (c as Record<string, unknown>)["safety_comment_present"] !== true)
        .map(rowName)
    : null;
  const bindingsWithoutMiri: string[] | null = bindingsIsList
    ? rows.filter((c) => hasField(c, "miri_tested") &&
        (c as Record<string, unknown>)["miri_tested"] !== true)
        .map(rowName)
    : null;
  let duplicateBindingNames: string[] | null = null;
  if (bindingsIsList) {
    const seen: string[] = [];
    duplicateBindingNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateBindingNames.includes(nm)) {
          duplicateBindingNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const wrapperCoverage: number | null =
    bindingsIsList && bindingsCount !== null && bindingsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["safe_wrapper_present"] === true).length / bindingsCount
      : null;
  const safetyCommentCoverage: number | null =
    bindingsIsList && bindingsCount !== null && bindingsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["safety_comment_present"] === true).length / bindingsCount
      : null;
  const miriCoverage: number | null =
    bindingsIsList && bindingsCount !== null && bindingsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["miri_tested"] === true).length / bindingsCount
      : null;

  // ---- Section 1: lifetime_architecture_depth ----
  boolCheck(results, "lifetime_architecture_depth",
    "lifetimes_modelled_deliberately_at_api_boundaries", manifest,
    ["lifetime_design", "lifetimes_modelled_deliberately_at_api_boundaries"],
    "lifetime design: lifetimes are modelled deliberately — owned values at API boundaries, borrows internally");
  boolCheck(results, "lifetime_architecture_depth",
    "lifetime_annotation_sprawl_treated_as_layout_signal", manifest,
    ["lifetime_design", "lifetime_annotation_sprawl_treated_as_layout_signal"],
    "lifetime design: lifetime soup is treated as a signal the data layout is wrong, not annotated away");
  boolCheck(results, "lifetime_architecture_depth",
    "structs_split_when_lifetimes_tangle", manifest,
    ["lifetime_design", "structs_split_when_lifetimes_tangle"],
    "lifetime design: structs are split when lifetimes tangle");
  boolCheck(results, "lifetime_architecture_depth",
    "index_handles_or_arenas_used_for_tangled_graphs", manifest,
    ["lifetime_design", "index_handles_or_arenas_used_for_tangled_graphs"],
    "lifetime design: index-based handles or arenas are used for tangled object graphs");
  boolCheck(results, "lifetime_architecture_depth",
    "borrow_checker_fights_resolved_by_restructuring", manifest,
    ["lifetime_design", "borrow_checker_fights_resolved_by_restructuring"],
    "lifetime design: borrow-checker fights are resolved by restructuring the data");
  boolCheck(results, "lifetime_architecture_depth",
    "crate_dependency_graph_acyclic_and_boundaries_clean", manifest,
    ["lifetime_design", "crate_dependency_graph_acyclic_and_boundaries_clean"],
    "workspace architecture: crate boundaries are clean and dependencies are acyclic");

  // ---- Section 2: type_system_and_api_design ----
  boolCheck(results, "type_system_and_api_design",
    "newtypes_wrap_domain_primitives", manifest,
    ["type_design", "newtypes_wrap_domain_primitives"],
    "type design: newtypes wrap domain primitives so illegal states are unrepresentable");
  boolCheck(results, "type_system_and_api_design",
    "state_machines_modelled_with_enums", manifest,
    ["type_design", "state_machines_modelled_with_enums"],
    "type design: state machines are modelled with enums");
  boolCheck(results, "type_system_and_api_design",
    "from_into_conversions_for_value_crossings", manifest,
    ["type_design", "from_into_conversions_for_value_crossings"],
    "type design: From/Into carry conversions between value types");
  boolCheck(results, "type_system_and_api_design",
    "builder_pattern_for_complex_construction", manifest,
    ["type_design", "builder_pattern_for_complex_construction"],
    "type design: the builder pattern carries complex construction");
  boolCheck(results, "type_system_and_api_design",
    "trait_boundaries_chosen_over_premature_generics", manifest,
    ["type_design", "trait_boundaries_chosen_over_premature_generics"],
    "type design: code programs to traits and avoids premature generics");
  boolCheck(results, "type_system_and_api_design",
    "impl_vs_dyn_trait_choice_made_consciously", manifest,
    ["type_design", "impl_vs_dyn_trait_choice_made_consciously"],
    "type design: impl Trait vs dyn Trait is chosen consciously — monomorphization speed vs binary size and flexibility");
  boolCheck(results, "type_system_and_api_design",
    "error_values_carry_context_at_boundaries", manifest,
    ["type_design", "error_values_carry_context_at_boundaries"],
    "type design: errors carry context across boundaries");

  // ---- Section 3: async_runtime_depth ----
  boolCheck(results, "async_runtime_depth",
    "blocking_work_offloaded_via_spawn_blocking", manifest,
    ["async_depth", "blocking_work_offloaded_via_spawn_blocking"],
    "async depth: blocking work is offloaded to spawn_blocking, never run on the runtime");
  boolCheck(results, "async_runtime_depth",
    "send_sync_bounds_checked_for_spawned_futures", manifest,
    ["async_depth", "send_sync_bounds_checked_for_spawned_futures"],
    "async depth: Send/Sync bounds are minded for spawned futures");
  boolCheck(results, "async_runtime_depth",
    "mpsc_and_oneshot_channels_assigned_by_purpose", manifest,
    ["async_depth", "mpsc_and_oneshot_channels_assigned_by_purpose"],
    "async depth: mpsc and oneshot channels are assigned by coordination purpose");
  boolCheck(results, "async_runtime_depth",
    "cancellation_modelled_explicitly_in_async_flows", manifest,
    ["async_depth", "cancellation_modelled_explicitly_in_async_flows"],
    "async depth: cancellation is modelled explicitly");

  // ---- Section 4: performance_measurement_and_allocation ----
  boolCheck(results, "performance_measurement_and_allocation",
    "flamegraphs_captured_before_optimizing", manifest,
    ["performance", "flamegraphs_captured_before_optimizing"],
    "performance: flamegraphs are captured before optimizing");
  boolCheck(results, "performance_measurement_and_allocation",
    "criterion_results_gate_optimization_claims", manifest,
    ["performance", "criterion_results_gate_optimization_claims"],
    "performance: criterion measurements gate every optimization claim — measure before optimizing");
  boolCheck(results, "performance_measurement_and_allocation",
    "str_borrows_preferred_over_owned_strings", manifest,
    ["performance", "str_borrows_preferred_over_owned_strings"],
    "performance: &str is preferred over String where ownership is not needed");
  boolCheck(results, "performance_measurement_and_allocation",
    "iterators_preferred_over_manual_loops", manifest,
    ["performance", "iterators_preferred_over_manual_loops"],
    "performance: iterators are preferred over manual loops");
  boolCheck(results, "performance_measurement_and_allocation",
    "cow_used_for_maybe_owned_data", manifest,
    ["performance", "cow_used_for_maybe_owned_data"],
    "performance: Cow carries maybe-owned data");
  boolCheck(results, "performance_measurement_and_allocation",
    "smallvec_used_where_small_sizes_dominate", manifest,
    ["performance", "smallvec_used_where_small_sizes_dominate"],
    "performance: SmallVec is used where small sizes dominate and it pays");

  // ---- Section 5: unsafe_ffi_and_wasm_depth ----
  boolCheck(results, "unsafe_ffi_and_wasm_depth",
    "unsafe_surface_encapsulated_behind_safe_api", manifest,
    ["unsafe_ffi", "unsafe_surface_encapsulated_behind_safe_api"],
    "unsafe depth: the unsafe surface is minimized and encapsulated behind a safe API");
  boolCheck(results, "unsafe_ffi_and_wasm_depth",
    "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code", manifest,
    ["unsafe_ffi", "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code"],
    "unsafe depth: sandboxed execution runs on wasm32 with wasm-bindgen");
  check(results, "unsafe_ffi_and_wasm_depth",
    "ffi_bindings_declared", bindingsRaw, bindingsIsList,
    bindingsIsList,
    "the declared record names its FFI bindings — the ffi_bindings list is present; an empty list declares that the codebase exposes no FFI bindings");
  const wrapperPresent = bindingsIsList &&
    rows.every((c) => hasField(c, "safe_wrapper_present"));
  check(results, "unsafe_ffi_and_wasm_depth",
    "every_ffi_binding_exposes_safe_wrapper", bindingsRaw, wrapperPresent,
    bindingsIsList &&
      rows.every((c) => isPyDict(c) && c["safe_wrapper_present"] === true),
    "FFI bindings: every declared FFI binding is exposed through a safe wrapper");
  const commentPresent = bindingsIsList &&
    rows.every((c) => hasField(c, "safety_comment_present"));
  check(results, "unsafe_ffi_and_wasm_depth",
    "every_ffi_binding_carries_safety_comment", bindingsRaw, commentPresent,
    bindingsIsList &&
      rows.every((c) => isPyDict(c) && c["safety_comment_present"] === true),
    "FFI bindings: every declared FFI binding documents its invariant with a // SAFETY: comment");
  const miriPresent = bindingsIsList &&
    rows.every((c) => hasField(c, "miri_tested"));
  check(results, "unsafe_ffi_and_wasm_depth",
    "every_ffi_binding_tested_under_miri", bindingsRaw, miriPresent,
    bindingsIsList &&
      rows.every((c) => isPyDict(c) && c["miri_tested"] === true),
    "FFI bindings: every declared FFI binding is tested under miri");
  const namePresent = bindingsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "unsafe_ffi_and_wasm_depth",
    "no_ffi_binding_name_duplicated", bindingsRaw, namePresent,
    bindingsIsList && duplicateBindingNames !== null &&
      duplicateBindingNames.length === 0,
    "FFI bindings: no declared FFI-binding name is owned by more than one row");

  // ---- Section 6: cryptography_and_secret_handling ----
  boolCheck(results, "cryptography_and_secret_handling",
    "vetted_crypto_crates_only_rustcrypto_or_ring", manifest,
    ["crypto", "vetted_crypto_crates_only_rustcrypto_or_ring"],
    "crypto: only vetted crates are used — RustCrypto or ring");
  boolCheck(results, "cryptography_and_secret_handling",
    "secrets_zeroized_after_use", manifest,
    ["crypto", "secrets_zeroized_after_use"],
    "crypto: secrets are zeroized after use");
  boolCheck(results, "cryptography_and_secret_handling",
    "constant_time_comparison_for_timing_sensitive_checks", manifest,
    ["crypto", "constant_time_comparison_for_timing_sensitive_checks"],
    "crypto: constant-time comparison is used where timing matters");

  // ---- Section 7: expert_red_lines ----
  falseCheck(results, "expert_red_lines",
    "expert_no_reflexive_clone_rc_dodge", manifest,
    ["expert_red_lines", "reflexive_clone_rc_dodge_present"],
    "red line: no reflexive clone/Rc used to dodge the borrow checker is present in the record");
  falseCheck(results, "expert_red_lines",
    "expert_no_premature_unsafe", manifest,
    ["expert_red_lines", "premature_unsafe_present"],
    "red line: no premature unsafe is present in the record");
  falseCheck(results, "expert_red_lines",
    "expert_no_homemade_crypto", manifest,
    ["expert_red_lines", "homemade_crypto_present"],
    "red line: no homemade crypto is present in the record");
  falseCheck(results, "expert_red_lines",
    "expert_no_lifetime_soup_papered_over", manifest,
    ["expert_red_lines", "lifetime_soup_papered_over_present"],
    "red line: no lifetime soup papered over with annotations instead of restructuring is present in the record");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY";
  }

  const computedNames = [
    "ffi_bindings_declared",
    "every_ffi_binding_exposes_safe_wrapper",
    "every_ffi_binding_carries_safety_comment",
    "every_ffi_binding_tested_under_miri",
    "no_ffi_binding_name_duplicated",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "production-rust-engineering-pack-expert",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    ffi_bindings_count: bindingsCount,
    ffi_bindings_without_safe_wrapper: bindingsWithoutWrapper,
    ffi_bindings_without_safety_comment: bindingsWithoutSafetyComment,
    ffi_bindings_without_miri: bindingsWithoutMiri,
    safe_wrapper_coverage: fmt6(wrapperCoverage),
    safety_comment_coverage: fmt6(safetyCommentCoverage),
    miri_coverage: fmt6(miriCoverage),
    duplicate_ffi_binding_names: duplicateBindingNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRODUCTION RUST ENGINEERING PACK EXPERT",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
