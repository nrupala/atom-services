# Production rust engineering pack expert — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are running an expert-tier production Rust codebase — lifetimes modelled deliberately, types that make illegal states unrepresentable, measured performance work, a disciplined unsafe/FFI surface, vetted cryptography — and you have a declared record of that practice. This atom reads one declared manifest and returns one deterministic verdict across seven sections (lifetime_architecture_depth, type_system_and_api_design, async_runtime_depth, performance_measurement_and_allocation, unsafe_ffi_and_wasm_depth, cryptography_and_secret_handling, expert_red_lines): **PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY**, **PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 37 checks. It audits the declared expert production Rust engineering record's completeness and internal consistency only — it compiles no code itself, runs no cargo, miri, clippy or flamegraph command, inspects no repository or crate, runs no test or benchmark, and does not verify that declared practice was ever carried out. A codebase is ready *on your declared evidence*: a record that declares every FFI binding miri-tested and every secret zeroized passes those checks even if the real codebase did none of it. It is not a compiler, a soundness proof, a cryptography review, or a guarantee that the code is memory-safe or correct: it never judges whether a declared `// SAFETY:` invariant is actually true, whether a safe wrapper is actually sound, whether the declared lifetime restructuring is good, or whether the type design actually makes the important illegal states unrepresentable — only that the record contains what the skill's expert practice demands, and that its declared FFI-binding rows are internally consistent. The computed checks: the declared `ffi_bindings` list must be present (an empty list passes — it declares that the codebase exposes no FFI bindings, and the skill requires no FFI surface); every declared FFI-binding row must declare `safe_wrapper_present` true (unsafe is encapsulated behind a safe API), `safety_comment_present` true (every invariant documented with `// SAFETY:`) and `miri_tested` true (tested under `miri`) — a row with the field absent is missing evidence, a row declaring it false fails, and on an empty list each check passes vacuously; and no declared FFI-binding `name` may appear on more than one row. No numeric threshold is imposed — no maximum lifetime-annotation count or lifetime-per-API rate; no clone or allocation count, allocation budget, or per-function allocation rate; no benchmark performance figure, flamegraph hot-spot percentage, or speedup factor an optimization must show (only that criterion measurements and flamegraphs gate the work is checked); no `SmallVec` inline capacity or size cutoff for when it "pays"; no FFI-binding count or unsafe-lines-of-code budget; no miri runtime or miri issue count; no key length, zeroize coverage percentage, or named list of timing-sensitive operations beyond constant-time comparison being declared where timing matters; no crate count or dependency-depth limit beyond the graph being declared acyclic with clean boundaries; and no binary-size budget for the `impl Trait` vs `dyn Trait` trade-off (only that the choice is made consciously is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack-expert"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack-expert` — tool name `production_rust_engineering_pack_expert`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack-expert` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | Project name (string; carried into the output, not checked) |
| `lifetime_design.lifetimes_modelled_deliberately_at_api_boundaries` | lifetime evidence: lifetimes are modelled deliberately at API boundaries |
| `lifetime_design.lifetime_annotation_sprawl_treated_as_layout_signal` | lifetime evidence: lifetime annotation sprawl is treated as a signal the data layout is wrong |
| `lifetime_design.structs_split_when_lifetimes_tangle` | lifetime evidence: structs are split when lifetimes tangle |
| `lifetime_design.index_handles_or_arenas_used_for_tangled_graphs` | lifetime evidence: index handles or arenas are used for tangled object graphs |
| `lifetime_design.borrow_checker_fights_resolved_by_restructuring` | lifetime evidence: borrow-checker fights are resolved by restructuring, not by fighting the checker |
| `lifetime_design.crate_dependency_graph_acyclic_and_boundaries_clean` | lifetime evidence: the crate dependency graph is acyclic and crate boundaries are clean |
| `type_design.newtypes_wrap_domain_primitives` | type evidence: newtypes wrap domain primitives |
| `type_design.state_machines_modelled_with_enums` | type evidence: state machines are modelled with enums |
| `type_design.from_into_conversions_for_value_crossings` | type evidence: `From`/`Into` conversions carry value crossings |
| `type_design.builder_pattern_for_complex_construction` | type evidence: the builder pattern carries complex construction |
| `type_design.trait_boundaries_chosen_over_premature_generics` | type evidence: trait boundaries are chosen over premature generics |
| `type_design.impl_vs_dyn_trait_choice_made_consciously` | type evidence: the `impl Trait` vs `dyn Trait` choice is made consciously |
| `type_design.error_values_carry_context_at_boundaries` | type evidence: error values carry context at boundaries |
| `async_depth.blocking_work_offloaded_via_spawn_blocking` | async evidence: blocking work is offloaded via `spawn_blocking` |
| `async_depth.send_sync_bounds_checked_for_spawned_futures` | async evidence: `Send`/`Sync` bounds are checked for spawned futures |
| `async_depth.mpsc_and_oneshot_channels_assigned_by_purpose` | async evidence: mpsc and oneshot channels are assigned by purpose |
| `async_depth.cancellation_modelled_explicitly_in_async_flows` | async evidence: cancellation is modelled explicitly in async flows |
| `performance.flamegraphs_captured_before_optimizing` | performance evidence: flamegraphs are captured before optimizing |
| `performance.criterion_results_gate_optimization_claims` | performance evidence: criterion results gate optimization claims |
| `performance.str_borrows_preferred_over_owned_strings` | performance evidence: `&str` borrows are preferred over owned strings |
| `performance.iterators_preferred_over_manual_loops` | performance evidence: iterators are preferred over manual loops |
| `performance.cow_used_for_maybe_owned_data` | performance evidence: `Cow` is used for maybe-owned data |
| `performance.smallvec_used_where_small_sizes_dominate` | performance evidence: `SmallVec` is used where small sizes dominate |
| `unsafe_ffi.unsafe_surface_encapsulated_behind_safe_api` | unsafe/FFI evidence: the unsafe surface is encapsulated behind a safe API |
| `unsafe_ffi.wasm_sandboxing_via_wasm_bindgen_for_untrusted_code` | unsafe/FFI evidence: untrusted code is sandboxed via wasm-bindgen |
| `ffi_bindings` (list of FFI-binding row objects) | computed: must be present (an empty list declares that the codebase exposes no FFI bindings); reported as `ffi_bindings_count` |
| `ffi_bindings[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `ffi_bindings[].safe_wrapper_present` | computed: must be `true` per row (a safe wrapper is present) |
| `ffi_bindings[].safety_comment_present` | computed: must be `true` per row (a `// SAFETY:` comment is present) |
| `ffi_bindings[].miri_tested` | computed: must be `true` per row (the binding is tested under miri) |
| `crypto.vetted_crypto_crates_only_rustcrypto_or_ring` | crypto evidence: only vetted crypto crates are used (RustCrypto or `ring`) |
| `crypto.secrets_zeroized_after_use` | crypto evidence: secrets are zeroized after use |
| `crypto.constant_time_comparison_for_timing_sensitive_checks` | crypto evidence: timing-sensitive checks use constant-time comparison |
| `expert_red_lines.reflexive_clone_rc_dodge_present` | must be `false` to pass (red line: no reflexive `clone`/`Rc` dodge) |
| `expert_red_lines.premature_unsafe_present` | must be `false` to pass (red line: no premature unsafe) |
| `expert_red_lines.homemade_crypto_present` | must be `false` to pass (red line: no homemade crypto) |
| `expert_red_lines.lifetime_soup_papered_over_present` | must be `false` to pass (red line: no lifetime soup papered over) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/production-rust-engineering-pack-expert`:

```json
{
  "project": "secure-core",
  "lifetime_design": {
    "lifetimes_modelled_deliberately_at_api_boundaries": true,
    "lifetime_annotation_sprawl_treated_as_layout_signal": true,
    "structs_split_when_lifetimes_tangle": true,
    "index_handles_or_arenas_used_for_tangled_graphs": true,
    "borrow_checker_fights_resolved_by_restructuring": true,
    "crate_dependency_graph_acyclic_and_boundaries_clean": true
  },
  "type_design": {
    "newtypes_wrap_domain_primitives": true,
    "state_machines_modelled_with_enums": true,
    "from_into_conversions_for_value_crossings": true,
    "builder_pattern_for_complex_construction": true,
    "trait_boundaries_chosen_over_premature_generics": true,
    "impl_vs_dyn_trait_choice_made_consciously": true,
    "error_values_carry_context_at_boundaries": true
  },
  "async_depth": {
    "blocking_work_offloaded_via_spawn_blocking": true,
    "send_sync_bounds_checked_for_spawned_futures": true,
    "mpsc_and_oneshot_channels_assigned_by_purpose": true,
    "cancellation_modelled_explicitly_in_async_flows": true
  },
  "performance": {
    "flamegraphs_captured_before_optimizing": true,
    "criterion_results_gate_optimization_claims": true,
    "str_borrows_preferred_over_owned_strings": true,
    "iterators_preferred_over_manual_loops": true,
    "cow_used_for_maybe_owned_data": true,
    "smallvec_used_where_small_sizes_dominate": true
  },
  "unsafe_ffi": {
    "unsafe_surface_encapsulated_behind_safe_api": true,
    "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code": true
  },
  "ffi_bindings": [
    {
      "name": "lib_c_core",
      "safe_wrapper_present": true,
      "safety_comment_present": true,
      "miri_tested": true
    }
  ],
  "crypto": {
    "vetted_crypto_crates_only_rustcrypto_or_ring": true,
    "secrets_zeroized_after_use": true,
    "constant_time_comparison_for_timing_sensitive_checks": true
  },
  "expert_red_lines": {
    "reflexive_clone_rc_dodge_present": false,
    "premature_unsafe_present": false,
    "homemade_crypto_present": false,
    "lifetime_soup_papered_over_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "production-rust-engineering-pack-expert",
  "atom_version": "0.1.0",
  "project": "secure-core",
  "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY",
  "sections": {
    "lifetime_architecture_depth": "pass",
    "type_system_and_api_design": "pass",
    "async_runtime_depth": "pass",
    "performance_measurement_and_allocation": "pass",
    "unsafe_ffi_and_wasm_depth": "pass",
    "cryptography_and_secret_handling": "pass",
    "expert_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "ffi_bindings_count": 1,
  "ffi_bindings_without_safe_wrapper": [],
  "ffi_bindings_without_safety_comment": [],
  "ffi_bindings_without_miri": [],
  "safe_wrapper_coverage": "1.000000",
  "safety_comment_coverage": "1.000000",
  "miri_coverage": "1.000000",
  "duplicate_ffi_binding_names": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

## Verdicts

- **PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY** — every check passes; the declared expert production Rust engineering record is complete and internally consistent with the skill's checklist and red lines.
- **PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `ffi_bindings_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `ffi_bindings_without_safe_wrapper`, `ffi_bindings_without_safety_comment` and `ffi_bindings_without_miri` (bindings whose field is present but not true; a binding with the field absent is missing evidence and does not appear; each null when the `ffi_bindings` list is not declared), `duplicate_ffi_binding_names` (names declared on more than one row, in the order their second occurrence appears; null when the list is not declared), the coverage ratios `safe_wrapper_coverage`, `safety_comment_coverage` and `miri_coverage` (bindings declaring the field true ÷ declared bindings; each null when the declared list is absent or empty; computed ratios are strings with exactly six decimal places), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
