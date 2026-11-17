#!/usr/bin/env python3
"""Production Rust engineering pack expert — deterministic core.

Built from the bound skill `rust-expert`: "Write Rust that makes
illegal states unrepresentable and lets the compiler enforce the
invariants. Fighting the borrow checker is usually a signal to
restructure the data, not to reach for `clone`/`Rc`."

This atom is a DELIVERABLE audit of a declared EXPERT-tier
production Rust engineering record: it audits the record a
caller declares against the expert practice the skill defines —
lifetimes modelled deliberately with annotation sprawl treated
as a layout signal and tangled data restructured (split structs,
index handles, arenas), newtypes and state-machine enums making
illegal states unrepresentable with `From`/`Into` conversions,
builders and conscious `impl Trait` vs `dyn Trait` choice,
blocking work offloaded via `spawn_blocking` with `Send`/`Sync`
bounds checked and cancellation modelled explicitly, flamegraph-
first performance work with allocation idioms (`&str`, iterators,
`Cow`, `SmallVec`), unsafe encapsulated behind a safe API with
FFI bindings carrying `// SAFETY:` comments and miri testing,
WASM sandboxing, and vetted-crate cryptography with zeroized
secrets and constant-time comparison — plus the skill's expert
red lines refused. It does not compile code, run cargo, miri,
clippy or a flamegraph, inspect a repository, or verify that
declared practice was ever carried out — it checks that the
expert engineering record the skill requires is present and
internally complete and consistent on the declared evidence.

Distinct ground: the nearest sibling is
`production-rust-engineering-pack` (the BASE tier of the same
discipline — borrow-before-cloning, thiserror/anyhow basics,
unsafe forbidden by default, bounded channels, clippy/fmt gate,
MSRV and cargo audit). This expert atom shares ZERO check names
with the base pack and with every other atom (verified
mechanically over every oracle's evaluate({}) check register):
every check here is an expert-only question the base pack does
not ask — lifetime restructuring instead of annotation, type-
level state modelling, spawn_blocking / Send-Sync / cancellation
depth, measurement-gated optimization and allocation idioms,
safe-API encapsulation with SAFETY comments and miri over the
declared FFI bindings, wasm-bindgen sandboxing, and the crypto
discipline (vetted crates, zeroize, constant-time). The boundary
is: expert design depth here; base production hygiene there.

The caller submits an engineering manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- FFI bindings: the declared `ffi_bindings` list must be
  present (an empty list is a valid declaration — the codebase
  exposes no FFI bindings; the skill requires no FFI surface),
  and every declared FFI-binding row must declare a safe
  wrapper, a `// SAFETY:` comment and miri testing (the skill:
  "encapsulate behind a safe API, document every invariant
  with `// SAFETY:`, test under `miri`");
- FFI-binding name ownership: no declared FFI-binding name may
  be owned by more than one row (one record per binding —
  internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold at all — no lifetime
count, no allocation budget, no benchmark figure, no FFI-binding
count, no key length — so no numeric threshold check is
invented; those quantities are caller attestations at most, and
quantities here are computed and reported, with completeness
(every declared FFI-binding row) as the only bar, exactly as
stated above.

Verdict:
- any fail             -> PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "lifetime_architecture_depth",
    "type_system_and_api_design",
    "async_runtime_depth",
    "performance_measurement_and_allocation",
    "unsafe_ffi_and_wasm_depth",
    "cryptography_and_secret_handling",
    "expert_red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "lifetime_design": {
        "lifetimes_modelled_deliberately_at_api_boundaries": "boolean",
        "lifetime_annotation_sprawl_treated_as_layout_signal": "boolean",
        "structs_split_when_lifetimes_tangle": "boolean",
        "index_handles_or_arenas_used_for_tangled_graphs": "boolean",
        "borrow_checker_fights_resolved_by_restructuring": "boolean",
        "crate_dependency_graph_acyclic_and_boundaries_clean": "boolean",
    },
    "type_design": {
        "newtypes_wrap_domain_primitives": "boolean",
        "state_machines_modelled_with_enums": "boolean",
        "from_into_conversions_for_value_crossings": "boolean",
        "builder_pattern_for_complex_construction": "boolean",
        "trait_boundaries_chosen_over_premature_generics": "boolean",
        "impl_vs_dyn_trait_choice_made_consciously": "boolean",
        "error_values_carry_context_at_boundaries": "boolean",
    },
    "async_depth": {
        "blocking_work_offloaded_via_spawn_blocking": "boolean",
        "send_sync_bounds_checked_for_spawned_futures": "boolean",
        "mpsc_and_oneshot_channels_assigned_by_purpose": "boolean",
        "cancellation_modelled_explicitly_in_async_flows": "boolean",
    },
    "performance": {
        "flamegraphs_captured_before_optimizing": "boolean",
        "criterion_results_gate_optimization_claims": "boolean",
        "str_borrows_preferred_over_owned_strings": "boolean",
        "iterators_preferred_over_manual_loops": "boolean",
        "cow_used_for_maybe_owned_data": "boolean",
        "smallvec_used_where_small_sizes_dominate": "boolean",
    },
    "unsafe_ffi": {
        "unsafe_surface_encapsulated_behind_safe_api": "boolean",
        "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code": "boolean",
    },
    "ffi_bindings": [{
        "name": "string",
        "safe_wrapper_present": "boolean",
        "safety_comment_present": "boolean",
        "miri_tested": "boolean",
    }],
    "crypto": {
        "vetted_crypto_crates_only_rustcrypto_or_ring": "boolean",
        "secrets_zeroized_after_use": "boolean",
        "constant_time_comparison_for_timing_sensitive_checks": "boolean",
    },
    "expert_red_lines": {
        "reflexive_clone_rc_dodge_present": "boolean",
        "premature_unsafe_present": "boolean",
        "homemade_crypto_present": "boolean",
        "lifetime_soup_papered_over_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for an expert production Rust manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    bindings, has_bindings = _get(manifest, "ffi_bindings")
    bindings_is_list = has_bindings and isinstance(bindings, list)
    bindings_count = len(bindings) if bindings_is_list else None
    rows = bindings if bindings_is_list else []

    bindings_without_wrapper = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "safe_wrapper_present" in c
         and c.get("safe_wrapper_present") is not True]
        if bindings_is_list else None
    )
    bindings_without_safety_comment = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "safety_comment_present" in c
         and c.get("safety_comment_present") is not True]
        if bindings_is_list else None
    )
    bindings_without_miri = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "miri_tested" in c
         and c.get("miri_tested") is not True]
        if bindings_is_list else None
    )
    duplicate_binding_names = None
    if bindings_is_list:
        seen = []
        duplicate_binding_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_binding_names:
                    duplicate_binding_names.append(nm)
                seen.append(nm)
    wrapper_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("safe_wrapper_present") is True)
        / bindings_count
        if bindings_is_list and bindings_count > 0 else None
    )
    safety_comment_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("safety_comment_present") is True)
        / bindings_count
        if bindings_is_list and bindings_count > 0 else None
    )
    miri_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("miri_tested") is True)
        / bindings_count
        if bindings_is_list and bindings_count > 0 else None
    )

    # ---- Section 1: lifetime_architecture_depth (skill
    #      "Ownership & borrowing" — model lifetimes
    #      deliberately; lifetime soup means the data layout is
    #      wrong: restructure, split structs, index-based
    #      handles, arenas; plus "Tooling & workspaces" — keep
    #      crate boundaries clean and dependencies acyclic) ----
    _bool_check(results, "lifetime_architecture_depth",
                "lifetimes_modelled_deliberately_at_api_boundaries",
                manifest,
                ("lifetime_design",
                 "lifetimes_modelled_deliberately_at_api_boundaries"),
                "lifetime design: lifetimes are modelled "
                "deliberately — owned values at API boundaries, "
                "borrows internally")
    _bool_check(results, "lifetime_architecture_depth",
                "lifetime_annotation_sprawl_treated_as_layout_signal",
                manifest,
                ("lifetime_design",
                 "lifetime_annotation_sprawl_treated_as_layout_signal"),
                "lifetime design: lifetime soup is treated as a "
                "signal the data layout is wrong, not annotated "
                "away")
    _bool_check(results, "lifetime_architecture_depth",
                "structs_split_when_lifetimes_tangle", manifest,
                ("lifetime_design", "structs_split_when_lifetimes_tangle"),
                "lifetime design: structs are split when lifetimes "
                "tangle")
    _bool_check(results, "lifetime_architecture_depth",
                "index_handles_or_arenas_used_for_tangled_graphs",
                manifest,
                ("lifetime_design",
                 "index_handles_or_arenas_used_for_tangled_graphs"),
                "lifetime design: index-based handles or arenas "
                "are used for tangled object graphs")
    _bool_check(results, "lifetime_architecture_depth",
                "borrow_checker_fights_resolved_by_restructuring",
                manifest,
                ("lifetime_design",
                 "borrow_checker_fights_resolved_by_restructuring"),
                "lifetime design: borrow-checker fights are "
                "resolved by restructuring the data")
    _bool_check(results, "lifetime_architecture_depth",
                "crate_dependency_graph_acyclic_and_boundaries_clean",
                manifest,
                ("lifetime_design",
                 "crate_dependency_graph_acyclic_and_boundaries_clean"),
                "workspace architecture: crate boundaries are "
                "clean and dependencies are acyclic")

    # ---- Section 2: type_system_and_api_design (skill "Types
    #      do the work" and "Error handling" — newtypes and
    #      enums make illegal states unrepresentable, From/Into
    #      conversions, builder pattern, program to traits,
    #      avoid premature generics, impl vs dyn chosen
    #      consciously; errors carry context) ----
    _bool_check(results, "type_system_and_api_design",
                "newtypes_wrap_domain_primitives", manifest,
                ("type_design", "newtypes_wrap_domain_primitives"),
                "type design: newtypes wrap domain primitives so "
                "illegal states are unrepresentable")
    _bool_check(results, "type_system_and_api_design",
                "state_machines_modelled_with_enums", manifest,
                ("type_design", "state_machines_modelled_with_enums"),
                "type design: state machines are modelled with "
                "enums")
    _bool_check(results, "type_system_and_api_design",
                "from_into_conversions_for_value_crossings", manifest,
                ("type_design",
                 "from_into_conversions_for_value_crossings"),
                "type design: From/Into carry conversions between "
                "value types")
    _bool_check(results, "type_system_and_api_design",
                "builder_pattern_for_complex_construction", manifest,
                ("type_design", "builder_pattern_for_complex_construction"),
                "type design: the builder pattern carries complex "
                "construction")
    _bool_check(results, "type_system_and_api_design",
                "trait_boundaries_chosen_over_premature_generics",
                manifest,
                ("type_design",
                 "trait_boundaries_chosen_over_premature_generics"),
                "type design: code programs to traits and avoids "
                "premature generics")
    _bool_check(results, "type_system_and_api_design",
                "impl_vs_dyn_trait_choice_made_consciously", manifest,
                ("type_design",
                 "impl_vs_dyn_trait_choice_made_consciously"),
                "type design: impl Trait vs dyn Trait is chosen "
                "consciously — monomorphization speed vs binary "
                "size and flexibility")
    _bool_check(results, "type_system_and_api_design",
                "error_values_carry_context_at_boundaries", manifest,
                ("type_design",
                 "error_values_carry_context_at_boundaries"),
                "type design: errors carry context across "
                "boundaries")

    # ---- Section 3: async_runtime_depth (skill "Async
    #      (tokio)" — never block the runtime, offload blocking
    #      work to spawn_blocking, mind Send/Sync bounds,
    #      channels for coordination, cancellation modelled
    #      explicitly) ----
    _bool_check(results, "async_runtime_depth",
                "blocking_work_offloaded_via_spawn_blocking", manifest,
                ("async_depth",
                 "blocking_work_offloaded_via_spawn_blocking"),
                "async depth: blocking work is offloaded to "
                "spawn_blocking, never run on the runtime")
    _bool_check(results, "async_runtime_depth",
                "send_sync_bounds_checked_for_spawned_futures", manifest,
                ("async_depth",
                 "send_sync_bounds_checked_for_spawned_futures"),
                "async depth: Send/Sync bounds are minded for "
                "spawned futures")
    _bool_check(results, "async_runtime_depth",
                "mpsc_and_oneshot_channels_assigned_by_purpose",
                manifest,
                ("async_depth",
                 "mpsc_and_oneshot_channels_assigned_by_purpose"),
                "async depth: mpsc and oneshot channels are "
                "assigned by coordination purpose")
    _bool_check(results, "async_runtime_depth",
                "cancellation_modelled_explicitly_in_async_flows",
                manifest,
                ("async_depth",
                 "cancellation_modelled_explicitly_in_async_flows"),
                "async depth: cancellation is modelled explicitly")

    # ---- Section 4: performance_measurement_and_allocation
    #      (skill "Performance" — measure with criterion +
    #      flamegraph before optimizing; avoid needless
    #      clone/alloc; prefer &str over String, iterators over
    #      manual loops, Cow for maybe-owned, SmallVec where it
    #      pays) ----
    _bool_check(results, "performance_measurement_and_allocation",
                "flamegraphs_captured_before_optimizing", manifest,
                ("performance", "flamegraphs_captured_before_optimizing"),
                "performance: flamegraphs are captured before "
                "optimizing")
    _bool_check(results, "performance_measurement_and_allocation",
                "criterion_results_gate_optimization_claims", manifest,
                ("performance",
                 "criterion_results_gate_optimization_claims"),
                "performance: criterion measurements gate every "
                "optimization claim — measure before optimizing")
    _bool_check(results, "performance_measurement_and_allocation",
                "str_borrows_preferred_over_owned_strings", manifest,
                ("performance", "str_borrows_preferred_over_owned_strings"),
                "performance: &str is preferred over String where "
                "ownership is not needed")
    _bool_check(results, "performance_measurement_and_allocation",
                "iterators_preferred_over_manual_loops", manifest,
                ("performance", "iterators_preferred_over_manual_loops"),
                "performance: iterators are preferred over manual "
                "loops")
    _bool_check(results, "performance_measurement_and_allocation",
                "cow_used_for_maybe_owned_data", manifest,
                ("performance", "cow_used_for_maybe_owned_data"),
                "performance: Cow carries maybe-owned data")
    _bool_check(results, "performance_measurement_and_allocation",
                "smallvec_used_where_small_sizes_dominate", manifest,
                ("performance",
                 "smallvec_used_where_small_sizes_dominate"),
                "performance: SmallVec is used where small sizes "
                "dominate and it pays")

    # ---- Section 5: unsafe_ffi_and_wasm_depth (skill "Unsafe
    #      & FFI" — minimize unsafe, encapsulate behind a safe
    #      API, document every invariant with // SAFETY:, test
    #      under miri; FFI for the C numerical core; WASM for
    #      sandboxed execution — plus the computed row checks
    #      over the declared FFI bindings) ----
    _bool_check(results, "unsafe_ffi_and_wasm_depth",
                "unsafe_surface_encapsulated_behind_safe_api", manifest,
                ("unsafe_ffi",
                 "unsafe_surface_encapsulated_behind_safe_api"),
                "unsafe depth: the unsafe surface is minimized "
                "and encapsulated behind a safe API")
    _bool_check(results, "unsafe_ffi_and_wasm_depth",
                "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code",
                manifest,
                ("unsafe_ffi",
                 "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code"),
                "unsafe depth: sandboxed execution runs on "
                "wasm32 with wasm-bindgen")
    _check(results, "unsafe_ffi_and_wasm_depth",
           "ffi_bindings_declared", bindings, bindings_is_list,
           bindings_is_list,
           "the declared record names its FFI bindings — the "
           "ffi_bindings list is present; an empty list declares "
           "that the codebase exposes no FFI bindings")
    wrapper_present = (
        bindings_is_list
        and all(isinstance(c, dict) and "safe_wrapper_present" in c
                for c in rows)
    )
    _check(results, "unsafe_ffi_and_wasm_depth",
           "every_ffi_binding_exposes_safe_wrapper", bindings,
           wrapper_present,
           bindings_is_list
           and all(isinstance(c, dict)
                   and c.get("safe_wrapper_present") is True
                   for c in rows),
           "FFI bindings: every declared FFI binding is exposed "
           "through a safe wrapper")
    comment_present = (
        bindings_is_list
        and all(isinstance(c, dict) and "safety_comment_present" in c
                for c in rows)
    )
    _check(results, "unsafe_ffi_and_wasm_depth",
           "every_ffi_binding_carries_safety_comment", bindings,
           comment_present,
           bindings_is_list
           and all(isinstance(c, dict)
                   and c.get("safety_comment_present") is True
                   for c in rows),
           "FFI bindings: every declared FFI binding documents "
           "its invariant with a // SAFETY: comment")
    miri_present = (
        bindings_is_list
        and all(isinstance(c, dict) and "miri_tested" in c
                for c in rows)
    )
    _check(results, "unsafe_ffi_and_wasm_depth",
           "every_ffi_binding_tested_under_miri", bindings,
           miri_present,
           bindings_is_list
           and all(isinstance(c, dict)
                   and c.get("miri_tested") is True
                   for c in rows),
           "FFI bindings: every declared FFI binding is tested "
           "under miri")
    name_present = (
        bindings_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "unsafe_ffi_and_wasm_depth",
           "no_ffi_binding_name_duplicated", bindings,
           name_present,
           bindings_is_list
           and duplicate_binding_names is not None
           and len(duplicate_binding_names) == 0,
           "FFI bindings: no declared FFI-binding name is owned "
           "by more than one row")

    # ---- Section 6: cryptography_and_secret_handling (skill
    #      "Crypto / security (his domain)" — vetted crates
    #      only, never roll your own crypto, zeroize secrets,
    #      constant-time comparison where timing matters) ----
    _bool_check(results, "cryptography_and_secret_handling",
                "vetted_crypto_crates_only_rustcrypto_or_ring", manifest,
                ("crypto",
                 "vetted_crypto_crates_only_rustcrypto_or_ring"),
                "crypto: only vetted crates are used — RustCrypto "
                "or ring")
    _bool_check(results, "cryptography_and_secret_handling",
                "secrets_zeroized_after_use", manifest,
                ("crypto", "secrets_zeroized_after_use"),
                "crypto: secrets are zeroized after use")
    _bool_check(results, "cryptography_and_secret_handling",
                "constant_time_comparison_for_timing_sensitive_checks",
                manifest,
                ("crypto",
                 "constant_time_comparison_for_timing_sensitive_checks"),
                "crypto: constant-time comparison is used where "
                "timing matters")

    # ---- Section 7: expert_red_lines (skill "Anti-patterns to
    #      refuse" — reflexive clone/Rc to dodge the borrow
    #      checker, premature unsafe, homemade crypto; plus
    #      lifetime soup annotated over instead of restructured)
    #      ----
    _false_check(results, "expert_red_lines",
                 "expert_no_reflexive_clone_rc_dodge", manifest,
                 ("expert_red_lines", "reflexive_clone_rc_dodge_present"),
                 "red line: no reflexive clone/Rc used to dodge "
                 "the borrow checker is present in the record")
    _false_check(results, "expert_red_lines",
                 "expert_no_premature_unsafe", manifest,
                 ("expert_red_lines", "premature_unsafe_present"),
                 "red line: no premature unsafe is present in "
                 "the record")
    _false_check(results, "expert_red_lines",
                 "expert_no_homemade_crypto", manifest,
                 ("expert_red_lines", "homemade_crypto_present"),
                 "red line: no homemade crypto is present in the "
                 "record")
    _false_check(results, "expert_red_lines",
                 "expert_no_lifetime_soup_papered_over", manifest,
                 ("expert_red_lines",
                  "lifetime_soup_papered_over_present"),
                 "red line: no lifetime soup papered over with "
                 "annotations instead of restructuring is present "
                 "in the record")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY"

    computed_names = (
        "ffi_bindings_declared",
        "every_ffi_binding_exposes_safe_wrapper",
        "every_ffi_binding_carries_safety_comment",
        "every_ffi_binding_tested_under_miri",
        "no_ffi_binding_name_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "production-rust-engineering-pack-expert",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "ffi_bindings_count": bindings_count,
        "ffi_bindings_without_safe_wrapper": bindings_without_wrapper,
        "ffi_bindings_without_safety_comment":
            bindings_without_safety_comment,
        "ffi_bindings_without_miri": bindings_without_miri,
        "safe_wrapper_coverage": _fmt6(wrapper_coverage),
        "safety_comment_coverage": _fmt6(safety_comment_coverage),
        "miri_coverage": _fmt6(miri_coverage),
        "duplicate_ffi_binding_names": duplicate_binding_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PRODUCTION RUST ENGINEERING PACK EXPERT",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: production_rust_engineering_pack_expert.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
