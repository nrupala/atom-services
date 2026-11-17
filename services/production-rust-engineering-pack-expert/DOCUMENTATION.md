# Production Rust engineering pack expert — documentation

**Production Rust engineering pack expert** · slug `production-rust-engineering-pack-expert` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared expert Rust engineering record for completeness and consistency only. It surfaces two faces: REST `POST /v1/production-rust-engineering-pack-expert` and MCP `POST /mcp/production-rust-engineering-pack-expert`. It compiles no code, runs no cargo, miri, clippy or flamegraph command, and inspects no repository — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/production-rust-engineering-pack-expert/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "secure-core"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack-expert"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the expert Rust engineering manifest.** You declare an EXPERT-tier production Rust engineering record for one Rust codebase, made from the codebase's actual practice — the atom audits the declared record, it does not inspect any code (see Explanation). The recorded full-pass manifest declares the project `secure-core`: all six lifetime-design flags `true` (lifetimes modelled deliberately at API boundaries, annotation sprawl treated as a layout signal, structs split when lifetimes tangle, index handles or arenas used for tangled graphs, borrow-checker fights resolved by restructuring, and an acyclic crate dependency graph with clean boundaries); all seven type-design flags `true` (newtypes, state-machine enums, `From`/`Into` conversions, the builder pattern, trait boundaries over premature generics, a conscious `impl Trait` vs `dyn Trait` choice, and errors carrying context at boundaries); all four async-depth flags `true` (`spawn_blocking` offload, `Send`/`Sync` bounds checked, mpsc/oneshot channels assigned by purpose, cancellation modelled explicitly); all six performance flags `true` (flamegraphs before optimizing, criterion results gating optimization claims, `&str` borrows, iterators, `Cow`, and `SmallVec` where small sizes dominate); both unsafe/FFI flags `true` (unsafe surface encapsulated behind a safe API, wasm sandboxing via wasm-bindgen for untrusted code); one FFI binding `lib_c_core` declaring a safe wrapper, a `// SAFETY:` comment and miri testing all `true`; all three crypto flags `true` (vetted RustCrypto/`ring` crates only, secrets zeroized after use, constant-time comparison for timing-sensitive checks); and all four expert red-line flags `false` (no reflexive `clone`/`Rc` dodge, no premature unsafe, no homemade crypto, no lifetime soup papered over).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack-expert` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY`: "37 pass, 0 fail, 0 missing of 37 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `ffi_bindings_count` is 1, and `safe_wrapper_coverage`, `safety_comment_coverage` and `miri_coverage` are each `"1.000000"`, with every row-name list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack-expert"}`.
3. Call: `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack-expert` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack-expert` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `production_rust_engineering_pack_expert`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `every_ffi_binding_exposes_safe_wrapper` and `expert_no_reflexive_clone_rc_dodge`, and the summary reads "35 pass, 2 fail, 0 missing of 37 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `ffi_bindings[0].safe_wrapper_present` is declared `false`, failing `every_ffi_binding_exposes_safe_wrapper`, with `ffi_bindings_without_safe_wrapper` naming `["lib_c_core"]` and `safe_wrapper_coverage` `"0.000000"`; and `expert_red_lines.reflexive_clone_rc_dodge_present` is declared `true`, failing `expert_no_reflexive_clone_rc_dodge`; sections `unsafe_ffi_and_wasm_depth` and `expert_red_lines` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "project",
  "detail": "project must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack-expert` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack-expert` — tool name `production_rust_engineering_pack_expert`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `production_rust_engineering_pack_expert` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the row `name` field are noted as strings, and `ffi_bindings` as a list there. Where SERVICE.md states no type — the section container objects (`lifetime_design`, `type_design`, `async_depth`, `performance`, `unsafe_ffi`, `crypto`, `expert_red_lines`) and the FFI-binding row object (`ffi_bindings[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `ffi_bindings` list, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `ffi_bindings` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: lifetime_architecture_depth

| Field | Type | Notes |
|---|---|---|
| `lifetime_design` | object | The lifetime-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `lifetime_design.lifetimes_modelled_deliberately_at_api_boundaries` | boolean | — |
| `lifetime_design.lifetime_annotation_sprawl_treated_as_layout_signal` | boolean | — |
| `lifetime_design.structs_split_when_lifetimes_tangle` | boolean | — |
| `lifetime_design.index_handles_or_arenas_used_for_tangled_graphs` | boolean | — |
| `lifetime_design.borrow_checker_fights_resolved_by_restructuring` | boolean | — |
| `lifetime_design.crate_dependency_graph_acyclic_and_boundaries_clean` | boolean | — |

#### Read by: type_system_and_api_design

| Field | Type | Notes |
|---|---|---|
| `type_design` | object | The type-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `type_design.newtypes_wrap_domain_primitives` | boolean | — |
| `type_design.state_machines_modelled_with_enums` | boolean | — |
| `type_design.from_into_conversions_for_value_crossings` | boolean | — |
| `type_design.builder_pattern_for_complex_construction` | boolean | — |
| `type_design.trait_boundaries_chosen_over_premature_generics` | boolean | — |
| `type_design.impl_vs_dyn_trait_choice_made_consciously` | boolean | — |
| `type_design.error_values_carry_context_at_boundaries` | boolean | — |

#### Read by: async_runtime_depth

| Field | Type | Notes |
|---|---|---|
| `async_depth` | object | The async-depth section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `async_depth.blocking_work_offloaded_via_spawn_blocking` | boolean | — |
| `async_depth.send_sync_bounds_checked_for_spawned_futures` | boolean | — |
| `async_depth.mpsc_and_oneshot_channels_assigned_by_purpose` | boolean | — |
| `async_depth.cancellation_modelled_explicitly_in_async_flows` | boolean | — |

#### Read by: performance_measurement_and_allocation

| Field | Type | Notes |
|---|---|---|
| `performance` | object | The performance section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `performance.flamegraphs_captured_before_optimizing` | boolean | — |
| `performance.criterion_results_gate_optimization_claims` | boolean | — |
| `performance.str_borrows_preferred_over_owned_strings` | boolean | — |
| `performance.iterators_preferred_over_manual_loops` | boolean | — |
| `performance.cow_used_for_maybe_owned_data` | boolean | — |
| `performance.smallvec_used_where_small_sizes_dominate` | boolean | — |

#### Read by: unsafe_ffi_and_wasm_depth

| Field | Type | Notes |
|---|---|---|
| `unsafe_ffi` | object | The unsafe/FFI section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `unsafe_ffi.unsafe_surface_encapsulated_behind_safe_api` | boolean | — |
| `unsafe_ffi.wasm_sandboxing_via_wasm_bindgen_for_untrusted_code` | boolean | — |
| `ffi_bindings` | list | list of FFI-binding-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `ffi_bindings[]` | object | One declared FFI-binding row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `ffi_bindings[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `ffi_bindings[].safe_wrapper_present` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `ffi_bindings[].safety_comment_present` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `ffi_bindings[].miri_tested` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: cryptography_and_secret_handling

| Field | Type | Notes |
|---|---|---|
| `crypto` | object | The cryptography section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `crypto.vetted_crypto_crates_only_rustcrypto_or_ring` | boolean | — |
| `crypto.secrets_zeroized_after_use` | boolean | — |
| `crypto.constant_time_comparison_for_timing_sensitive_checks` | boolean | — |

#### Read by: expert_red_lines

| Field | Type | Notes |
|---|---|---|
| `expert_red_lines` | object | The expert red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_red_lines.reflexive_clone_rc_dodge_present` | boolean | must be `false` to pass — skill red line |
| `expert_red_lines.premature_unsafe_present` | boolean | must be `false` to pass — skill red line |
| `expert_red_lines.homemade_crypto_present` | boolean | must be `false` to pass — skill red line |
| `expert_red_lines.lifetime_soup_papered_over_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: lifetime_architecture_depth

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `lifetimes_modelled_deliberately_at_api_boundaries` | lifetime design: lifetimes are modelled deliberately — owned values at API boundaries, borrows internally | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lifetime_annotation_sprawl_treated_as_layout_signal` | lifetime design: lifetime soup is treated as a signal the data layout is wrong, not annotated away | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structs_split_when_lifetimes_tangle` | lifetime design: structs are split when lifetimes tangle | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `index_handles_or_arenas_used_for_tangled_graphs` | lifetime design: index-based handles or arenas are used for tangled object graphs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `borrow_checker_fights_resolved_by_restructuring` | lifetime design: borrow-checker fights are resolved by restructuring the data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `crate_dependency_graph_acyclic_and_boundaries_clean` | workspace architecture: crate boundaries are clean and dependencies are acyclic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: type_system_and_api_design

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `newtypes_wrap_domain_primitives` | type design: newtypes wrap domain primitives so illegal states are unrepresentable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `state_machines_modelled_with_enums` | type design: state machines are modelled with enums | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `from_into_conversions_for_value_crossings` | type design: From/Into carry conversions between value types | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `builder_pattern_for_complex_construction` | type design: the builder pattern carries complex construction | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `trait_boundaries_chosen_over_premature_generics` | type design: code programs to traits and avoids premature generics | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `impl_vs_dyn_trait_choice_made_consciously` | type design: impl Trait vs dyn Trait is chosen consciously — monomorphization speed vs binary size and flexibility | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_values_carry_context_at_boundaries` | type design: errors carry context across boundaries | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: async_runtime_depth

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `blocking_work_offloaded_via_spawn_blocking` | async depth: blocking work is offloaded to spawn_blocking, never run on the runtime | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `send_sync_bounds_checked_for_spawned_futures` | async depth: Send/Sync bounds are minded for spawned futures | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mpsc_and_oneshot_channels_assigned_by_purpose` | async depth: mpsc and oneshot channels are assigned by coordination purpose | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cancellation_modelled_explicitly_in_async_flows` | async depth: cancellation is modelled explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: performance_measurement_and_allocation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `flamegraphs_captured_before_optimizing` | performance: flamegraphs are captured before optimizing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `criterion_results_gate_optimization_claims` | performance: criterion measurements gate every optimization claim — measure before optimizing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `str_borrows_preferred_over_owned_strings` | performance: &str is preferred over String where ownership is not needed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `iterators_preferred_over_manual_loops` | performance: iterators are preferred over manual loops | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cow_used_for_maybe_owned_data` | performance: Cow carries maybe-owned data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `smallvec_used_where_small_sizes_dominate` | performance: SmallVec is used where small sizes dominate and it pays | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: unsafe_ffi_and_wasm_depth

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unsafe_surface_encapsulated_behind_safe_api` | unsafe depth: the unsafe surface is minimized and encapsulated behind a safe API | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `wasm_sandboxing_via_wasm_bindgen_for_untrusted_code` | unsafe depth: sandboxed execution runs on wasm32 with wasm-bindgen | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ffi_bindings_declared` | the declared record names its FFI bindings — the ffi_bindings list is present; an empty list declares that the codebase exposes no FFI bindings | Computed over the declared record. Pass: the `ffi_bindings` list is present — an empty list passes, because it declares that the codebase exposes no FFI bindings. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_ffi_binding_exposes_safe_wrapper` | FFI bindings: every declared FFI binding is exposed through a safe wrapper | Computed over the declared record. Pass: every declared FFI-binding row declares `safe_wrapper_present` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending bindings are named in `ffi_bindings_without_safe_wrapper`). Missing: the list is absent, or a row has the field absent. |
| `every_ffi_binding_carries_safety_comment` | FFI bindings: every declared FFI binding documents its invariant with a // SAFETY: comment | Computed over the declared record. Pass: every declared FFI-binding row declares `safety_comment_present` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending bindings are named in `ffi_bindings_without_safety_comment`). Missing: the list is absent, or a row has the field absent. |
| `every_ffi_binding_tested_under_miri` | FFI bindings: every declared FFI binding is tested under miri | Computed over the declared record. Pass: every declared FFI-binding row declares `miri_tested` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending bindings are named in `ffi_bindings_without_miri`). Missing: the list is absent, or a row has the field absent. |
| `no_ffi_binding_name_duplicated` | FFI bindings: no declared FFI-binding name is owned by more than one row | Computed over the declared record. Pass: no declared FFI-binding `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_ffi_binding_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |

#### Section: cryptography_and_secret_handling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vetted_crypto_crates_only_rustcrypto_or_ring` | crypto: only vetted crates are used — RustCrypto or ring | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `secrets_zeroized_after_use` | crypto: secrets are zeroized after use | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `constant_time_comparison_for_timing_sensitive_checks` | crypto: constant-time comparison is used where timing matters | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: expert_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_no_reflexive_clone_rc_dodge` | red line: no reflexive clone/Rc used to dodge the borrow checker is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_premature_unsafe` | red line: no premature unsafe is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_homemade_crypto` | red line: no homemade crypto is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_lifetime_soup_papered_over` | red line: no lifetime soup papered over with annotations instead of restructuring is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"production-rust-engineering-pack-expert"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `ffi_bindings_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `ffi_bindings_without_safe_wrapper`, `ffi_bindings_without_safety_comment` and `ffi_bindings_without_miri` (bindings whose field is present but not true; a binding with the field absent is missing evidence and does not appear; each null when the `ffi_bindings` list is not declared, as recorded in the sparse case) and `duplicate_ffi_binding_names` (names declared on more than one row, in the order their second occurrence appears; null when the list is not declared, as recorded in the sparse case); and the ratios `safe_wrapper_coverage` (bindings declaring a safe wrapper ÷ declared bindings), `safety_comment_coverage` (bindings declaring a `// SAFETY:` comment ÷ declared bindings) and `miri_coverage` (bindings declared miri-tested ÷ declared bindings) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY` — all 37 checks pass: the declared expert production Rust engineering record is complete and consistent with the bound skill's checklist and red lines.
- `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `ffi_bindings_count`, `ffi_bindings_without_safe_wrapper`, `ffi_bindings_without_safety_comment`, `ffi_bindings_without_miri`, `duplicate_ffi_binding_names`, `safe_wrapper_coverage`, `safety_comment_coverage`, `miri_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"project","detail":"project must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Writes Rust that lets the compiler enforce the rules — ownership done right, illegal states made impossible, no borrow-checker fights (the bound capability, from the skill). You submit one declared record — the expert production Rust engineering manifest, made from the codebase's actual practice — and the atom audits that record for completeness and internal consistency against the bound skill's expert practice and red lines, returning one deterministic verdict across 7 sections (`lifetime_architecture_depth`, `type_system_and_api_design`, `async_runtime_depth`, `performance_measurement_and_allocation`, `unsafe_ffi_and_wasm_depth`, `cryptography_and_secret_handling`, `expert_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This expert atom shares zero checks with its sibling base-tier atom `production-rust-engineering-pack` and with every other atom (SERVICE.md, Distinct ground); it asks expert-only questions the base pack does not ask — expert design depth here, base production hygiene in the base pack.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared FFI-binding rows themselves — the `ffi_bindings` list must be present (an empty list passes), every declared row must declare `safe_wrapper_present`, `safety_comment_present` and `miri_tested` all `true`, and no declared row `name` may appear on more than one row — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set. Declined, named: a maximum lifetime-annotation count or a lifetime-per-API rate; a clone or allocation count, an allocation budget, or a per-function allocation rate; a benchmark performance figure, a flamegraph hot-spot percentage, or a speedup factor an optimization must show (only that criterion measurements and flamegraphs gate the work is checked); a `SmallVec` inline capacity or a size cutoff for when it "pays"; an FFI-binding count or an unsafe-lines-of-code budget; a miri runtime or a miri issue count; a key length, a zeroize coverage percentage, or a named list of timing-sensitive operations beyond constant-time comparison being declared where timing matters; a crate count or a dependency-depth limit beyond the graph being declared acyclic with clean boundaries; a binary-size budget for the `impl Trait` vs `dyn Trait` trade-off (only that the choice is made consciously is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** expert production Rust engineering record: a verdict of `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares every FFI binding miri-tested and every secret zeroized passes those checks even if the real codebase did none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not a compiler, a soundness proof, a cryptography review, or a guarantee that the code is memory-safe or correct**. Specifically: it compiles no code itself, runs no cargo, miri, clippy or flamegraph command, inspects no repository or crate, runs no test or benchmark, and does not verify that declared practice was ever carried out. It never judges whether a declared `// SAFETY:` invariant is actually true, whether a safe wrapper is actually sound, whether the declared lifetime restructuring is good, or whether the type design actually makes the important illegal states unrepresentable — only that the record contains what the skill's expert practice demands, and that its declared FFI-binding rows are internally consistent. Named exclusions: no numeric thresholds at all (the skill states none — see the declined list above); no live verification of any declared fact; no judgment of practice *quality* — whether the lifetime architecture, type design, or crypto usage is adequate for the real codebase is the caller's declaration, checked only for declared presence and consistency; the skill's worked examples (modelling a state machine in Rust with enums, the guardian-mesh crate list, the PAE C numerical core and argent's WASM + GGUF approach) are checked only as the general declarations the skill states (state machines modelled with enums; crate boundaries clean and acyclic; FFI bindings declared with wrappers, SAFETY comments and miri testing; wasm sandboxing declared) — the atom takes no position on any specific crate, binding or codebase named in the skill.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Guardian Mesh and hot-path builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) screen-NO — flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom's output could not read as regulated professional advice — it audits a declared software-engineering record for completeness and consistency against an expert Rust practice skill; it offers no engineering-practice advice in the APEGA sense (no design, stamping, or safety judgment over physical systems), no financial or securities advice, and nothing psychology-adjacent. Its subject is software practice only, the same class as the software-engineering titles that stayed live at the census pending the owner's review. The named controls, exactly as SERVICE.md records them: (1) declared-record audit only — the atom audits the record the caller declares, never inspects real code and never verifies practice; (2) advice-shaped skill steps are excluded as red lines — the skill's prescriptive moves (how to model a state machine, how to restructure a layout) are never emitted as advice; the atom only checks declared presence/consistency and refuses the skill's anti-patterns as red-line declarations; (3) no numeric threshold is invented — every bar is the skill's own stated rule or completeness over the caller's declared rows. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `production_rust_engineering_pack_expert` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/production_rust_engineering_pack_expert.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_production_rust_engineering_pack_expert.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/production-rust-engineering-pack-expert` (REST) and `POST /mcp/production-rust-engineering-pack-expert` (MCP, tool `production_rust_engineering_pack_expert`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189; RC soak to 2026-11-22). Key scope: `production_rust_engineering_pack_expert`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** nine recorded check names are not the input field names they read. In `unsafe_ffi_and_wasm_depth` the five computed checks read the `ffi_bindings` rows rather than any single input field of the same name: `ffi_bindings_declared` (the `ffi_bindings` list), `every_ffi_binding_exposes_safe_wrapper` (rows' `safe_wrapper_present`), `every_ffi_binding_carries_safety_comment` (rows' `safety_comment_present`), `every_ffi_binding_tested_under_miri` (rows' `miri_tested`) and `no_ffi_binding_name_duplicated` (rows' `name`). In `expert_red_lines` all four recorded check names differ from their fields: `expert_no_reflexive_clone_rc_dodge` (input `expert_red_lines.reflexive_clone_rc_dodge_present`), `expert_no_premature_unsafe` (input `expert_red_lines.premature_unsafe_present`), `expert_no_homemade_crypto` (input `expert_red_lines.homemade_crypto_present`) and `expert_no_lifetime_soup_papered_over` (input `expert_red_lines.lifetime_soup_papered_over_present`). The other 28 recorded check names match the leaf name of the field they read. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`lifetime_design`, `type_design`, `async_depth`, `performance`, `unsafe_ffi`, `crypto`, `expert_red_lines`) or for a row object (`ffi_bindings[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `ffi_bindings` list, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `ffi_bindings_count` and the coverage ratios, but does not state a null rule for the row-name lists `ffi_bindings_without_safe_wrapper`, `ffi_bindings_without_safety_comment` and `ffi_bindings_without_miri`, nor for `duplicate_ffi_binding_names`. The recorded sparse response returns all four as `null` when the `ffi_bindings` list is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** one recorded section merges two separate input objects — `unsafe_ffi` and `ffi_bindings` inputs are both read by the single recorded section `unsafe_ffi_and_wasm_depth`. The other six recorded sections map one-to-one onto their input objects (`lifetime_design` → `lifetime_architecture_depth`, `type_design` → `type_system_and_api_design`, `async_depth` → `async_runtime_depth`, `performance` → `performance_measurement_and_allocation`, `crypto` → `cryptography_and_secret_handling`, `expert_red_lines` → `expert_red_lines`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (6 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named a prose phrase `safe_wrapper_per_ffi_binding` and an input field path `expert_red_lines.reflexive_clone_rc_dodge_present` instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed malformed input carried 2 type violations (`project` and `lifetime_design`) instead of exactly one (R4 ×1); and the designed sparse input was not identity-only — it carried `lifetime_design.lifetimes_modelled_deliberately_at_api_boundaries` = `true` alongside `project` (validity ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T10:51:10.098849+00:00 against gateway v1.1.0, external verification battery Wave 14, source `verification/work/production-rust-engineering-pack-expert/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:51:10.098849+00:00 · gateway v1.1.0 · external verification battery Wave 14 · source `verification/work/production-rust-engineering-pack-expert/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "lifetime_architecture_depth",
      "check": "lifetimes_modelled_deliberately_at_api_boundaries",
      "status": "pass",
      "evidence": "lifetime design: lifetimes are modelled deliberately — owned values at API boundaries, borrows internally"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "lifetime_annotation_sprawl_treated_as_layout_signal",
      "status": "pass",
      "evidence": "lifetime design: lifetime soup is treated as a signal the data layout is wrong, not annotated away"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "structs_split_when_lifetimes_tangle",
      "status": "pass",
      "evidence": "lifetime design: structs are split when lifetimes tangle"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "index_handles_or_arenas_used_for_tangled_graphs",
      "status": "pass",
      "evidence": "lifetime design: index-based handles or arenas are used for tangled object graphs"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "borrow_checker_fights_resolved_by_restructuring",
      "status": "pass",
      "evidence": "lifetime design: borrow-checker fights are resolved by restructuring the data"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "crate_dependency_graph_acyclic_and_boundaries_clean",
      "status": "pass",
      "evidence": "workspace architecture: crate boundaries are clean and dependencies are acyclic"
    },
    {
      "section": "type_system_and_api_design",
      "check": "newtypes_wrap_domain_primitives",
      "status": "pass",
      "evidence": "type design: newtypes wrap domain primitives so illegal states are unrepresentable"
    },
    {
      "section": "type_system_and_api_design",
      "check": "state_machines_modelled_with_enums",
      "status": "pass",
      "evidence": "type design: state machines are modelled with enums"
    },
    {
      "section": "type_system_and_api_design",
      "check": "from_into_conversions_for_value_crossings",
      "status": "pass",
      "evidence": "type design: From/Into carry conversions between value types"
    },
    {
      "section": "type_system_and_api_design",
      "check": "builder_pattern_for_complex_construction",
      "status": "pass",
      "evidence": "type design: the builder pattern carries complex construction"
    },
    {
      "section": "type_system_and_api_design",
      "check": "trait_boundaries_chosen_over_premature_generics",
      "status": "pass",
      "evidence": "type design: code programs to traits and avoids premature generics"
    },
    {
      "section": "type_system_and_api_design",
      "check": "impl_vs_dyn_trait_choice_made_consciously",
      "status": "pass",
      "evidence": "type design: impl Trait vs dyn Trait is chosen consciously — monomorphization speed vs binary size and flexibility"
    },
    {
      "section": "type_system_and_api_design",
      "check": "error_values_carry_context_at_boundaries",
      "status": "pass",
      "evidence": "type design: errors carry context across boundaries"
    },
    {
      "section": "async_runtime_depth",
      "check": "blocking_work_offloaded_via_spawn_blocking",
      "status": "pass",
      "evidence": "async depth: blocking work is offloaded to spawn_blocking, never run on the runtime"
    },
    {
      "section": "async_runtime_depth",
      "check": "send_sync_bounds_checked_for_spawned_futures",
      "status": "pass",
      "evidence": "async depth: Send/Sync bounds are minded for spawned futures"
    },
    {
      "section": "async_runtime_depth",
      "check": "mpsc_and_oneshot_channels_assigned_by_purpose",
      "status": "pass",
      "evidence": "async depth: mpsc and oneshot channels are assigned by coordination purpose"
    },
    {
      "section": "async_runtime_depth",
      "check": "cancellation_modelled_explicitly_in_async_flows",
      "status": "pass",
      "evidence": "async depth: cancellation is modelled explicitly"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "flamegraphs_captured_before_optimizing",
      "status": "pass",
      "evidence": "performance: flamegraphs are captured before optimizing"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "criterion_results_gate_optimization_claims",
      "status": "pass",
      "evidence": "performance: criterion measurements gate every optimization claim — measure before optimizing"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "str_borrows_preferred_over_owned_strings",
      "status": "pass",
      "evidence": "performance: &str is preferred over String where ownership is not needed"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "iterators_preferred_over_manual_loops",
      "status": "pass",
      "evidence": "performance: iterators are preferred over manual loops"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "cow_used_for_maybe_owned_data",
      "status": "pass",
      "evidence": "performance: Cow carries maybe-owned data"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "smallvec_used_where_small_sizes_dominate",
      "status": "pass",
      "evidence": "performance: SmallVec is used where small sizes dominate and it pays"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "unsafe_surface_encapsulated_behind_safe_api",
      "status": "pass",
      "evidence": "unsafe depth: the unsafe surface is minimized and encapsulated behind a safe API"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code",
      "status": "pass",
      "evidence": "unsafe depth: sandboxed execution runs on wasm32 with wasm-bindgen"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "ffi_bindings_declared",
      "status": "pass",
      "evidence": "the declared record names its FFI bindings — the ffi_bindings list is present; an empty list declares that the codebase exposes no FFI bindings"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_exposes_safe_wrapper",
      "status": "pass",
      "evidence": "FFI bindings: every declared FFI binding is exposed through a safe wrapper"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_carries_safety_comment",
      "status": "pass",
      "evidence": "FFI bindings: every declared FFI binding documents its invariant with a // SAFETY: comment"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_tested_under_miri",
      "status": "pass",
      "evidence": "FFI bindings: every declared FFI binding is tested under miri"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "no_ffi_binding_name_duplicated",
      "status": "pass",
      "evidence": "FFI bindings: no declared FFI-binding name is owned by more than one row"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "vetted_crypto_crates_only_rustcrypto_or_ring",
      "status": "pass",
      "evidence": "crypto: only vetted crates are used — RustCrypto or ring"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "secrets_zeroized_after_use",
      "status": "pass",
      "evidence": "crypto: secrets are zeroized after use"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "constant_time_comparison_for_timing_sensitive_checks",
      "status": "pass",
      "evidence": "crypto: constant-time comparison is used where timing matters"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_reflexive_clone_rc_dodge",
      "status": "pass",
      "evidence": "red line: no reflexive clone/Rc used to dodge the borrow checker is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_premature_unsafe",
      "status": "pass",
      "evidence": "red line: no premature unsafe is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_homemade_crypto",
      "status": "pass",
      "evidence": "red line: no homemade crypto is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_lifetime_soup_papered_over",
      "status": "pass",
      "evidence": "red line: no lifetime soup papered over with annotations instead of restructuring is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "ffi_bindings_count": 1,
  "ffi_bindings_without_safe_wrapper": [],
  "ffi_bindings_without_safety_comment": [],
  "ffi_bindings_without_miri": [],
  "safe_wrapper_coverage": "1.000000",
  "safety_comment_coverage": "1.000000",
  "miri_coverage": "1.000000",
  "duplicate_ffi_binding_names": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "PRODUCTION RUST ENGINEERING PACK EXPERT\nproject: secure-core\nVERDICT: PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY\n  lifetime_architecture_depth                  pass\n  type_system_and_api_design                   pass\n  async_runtime_depth                          pass\n  performance_measurement_and_allocation       pass\n  unsafe_ffi_and_wasm_depth                    pass\n  cryptography_and_secret_handling             pass\n  expert_red_lines                             pass\n37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:51:10.098849+00:00 · gateway v1.1.0 · external verification battery Wave 14 · source `verification/work/production-rust-engineering-pack-expert/evidence.json`.

Input:

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
      "safe_wrapper_present": false,
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
    "reflexive_clone_rc_dodge_present": true,
    "premature_unsafe_present": false,
    "homemade_crypto_present": false,
    "lifetime_soup_papered_over_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-rust-engineering-pack-expert",
  "atom_version": "0.1.0",
  "project": "secure-core",
  "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY",
  "sections": {
    "lifetime_architecture_depth": "pass",
    "type_system_and_api_design": "pass",
    "async_runtime_depth": "pass",
    "performance_measurement_and_allocation": "pass",
    "unsafe_ffi_and_wasm_depth": "fail",
    "cryptography_and_secret_handling": "pass",
    "expert_red_lines": "fail"
  },
  "checks": [
    {
      "section": "lifetime_architecture_depth",
      "check": "lifetimes_modelled_deliberately_at_api_boundaries",
      "status": "pass",
      "evidence": "lifetime design: lifetimes are modelled deliberately — owned values at API boundaries, borrows internally"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "lifetime_annotation_sprawl_treated_as_layout_signal",
      "status": "pass",
      "evidence": "lifetime design: lifetime soup is treated as a signal the data layout is wrong, not annotated away"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "structs_split_when_lifetimes_tangle",
      "status": "pass",
      "evidence": "lifetime design: structs are split when lifetimes tangle"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "index_handles_or_arenas_used_for_tangled_graphs",
      "status": "pass",
      "evidence": "lifetime design: index-based handles or arenas are used for tangled object graphs"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "borrow_checker_fights_resolved_by_restructuring",
      "status": "pass",
      "evidence": "lifetime design: borrow-checker fights are resolved by restructuring the data"
    },
    {
      "section": "lifetime_architecture_depth",
      "check": "crate_dependency_graph_acyclic_and_boundaries_clean",
      "status": "pass",
      "evidence": "workspace architecture: crate boundaries are clean and dependencies are acyclic"
    },
    {
      "section": "type_system_and_api_design",
      "check": "newtypes_wrap_domain_primitives",
      "status": "pass",
      "evidence": "type design: newtypes wrap domain primitives so illegal states are unrepresentable"
    },
    {
      "section": "type_system_and_api_design",
      "check": "state_machines_modelled_with_enums",
      "status": "pass",
      "evidence": "type design: state machines are modelled with enums"
    },
    {
      "section": "type_system_and_api_design",
      "check": "from_into_conversions_for_value_crossings",
      "status": "pass",
      "evidence": "type design: From/Into carry conversions between value types"
    },
    {
      "section": "type_system_and_api_design",
      "check": "builder_pattern_for_complex_construction",
      "status": "pass",
      "evidence": "type design: the builder pattern carries complex construction"
    },
    {
      "section": "type_system_and_api_design",
      "check": "trait_boundaries_chosen_over_premature_generics",
      "status": "pass",
      "evidence": "type design: code programs to traits and avoids premature generics"
    },
    {
      "section": "type_system_and_api_design",
      "check": "impl_vs_dyn_trait_choice_made_consciously",
      "status": "pass",
      "evidence": "type design: impl Trait vs dyn Trait is chosen consciously — monomorphization speed vs binary size and flexibility"
    },
    {
      "section": "type_system_and_api_design",
      "check": "error_values_carry_context_at_boundaries",
      "status": "pass",
      "evidence": "type design: errors carry context across boundaries"
    },
    {
      "section": "async_runtime_depth",
      "check": "blocking_work_offloaded_via_spawn_blocking",
      "status": "pass",
      "evidence": "async depth: blocking work is offloaded to spawn_blocking, never run on the runtime"
    },
    {
      "section": "async_runtime_depth",
      "check": "send_sync_bounds_checked_for_spawned_futures",
      "status": "pass",
      "evidence": "async depth: Send/Sync bounds are minded for spawned futures"
    },
    {
      "section": "async_runtime_depth",
      "check": "mpsc_and_oneshot_channels_assigned_by_purpose",
      "status": "pass",
      "evidence": "async depth: mpsc and oneshot channels are assigned by coordination purpose"
    },
    {
      "section": "async_runtime_depth",
      "check": "cancellation_modelled_explicitly_in_async_flows",
      "status": "pass",
      "evidence": "async depth: cancellation is modelled explicitly"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "flamegraphs_captured_before_optimizing",
      "status": "pass",
      "evidence": "performance: flamegraphs are captured before optimizing"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "criterion_results_gate_optimization_claims",
      "status": "pass",
      "evidence": "performance: criterion measurements gate every optimization claim — measure before optimizing"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "str_borrows_preferred_over_owned_strings",
      "status": "pass",
      "evidence": "performance: &str is preferred over String where ownership is not needed"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "iterators_preferred_over_manual_loops",
      "status": "pass",
      "evidence": "performance: iterators are preferred over manual loops"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "cow_used_for_maybe_owned_data",
      "status": "pass",
      "evidence": "performance: Cow carries maybe-owned data"
    },
    {
      "section": "performance_measurement_and_allocation",
      "check": "smallvec_used_where_small_sizes_dominate",
      "status": "pass",
      "evidence": "performance: SmallVec is used where small sizes dominate and it pays"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "unsafe_surface_encapsulated_behind_safe_api",
      "status": "pass",
      "evidence": "unsafe depth: the unsafe surface is minimized and encapsulated behind a safe API"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code",
      "status": "pass",
      "evidence": "unsafe depth: sandboxed execution runs on wasm32 with wasm-bindgen"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "ffi_bindings_declared",
      "status": "pass",
      "evidence": "the declared record names its FFI bindings — the ffi_bindings list is present; an empty list declares that the codebase exposes no FFI bindings"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_exposes_safe_wrapper",
      "status": "fail",
      "evidence": "FFI bindings: every declared FFI binding is exposed through a safe wrapper"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_carries_safety_comment",
      "status": "pass",
      "evidence": "FFI bindings: every declared FFI binding documents its invariant with a // SAFETY: comment"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "every_ffi_binding_tested_under_miri",
      "status": "pass",
      "evidence": "FFI bindings: every declared FFI binding is tested under miri"
    },
    {
      "section": "unsafe_ffi_and_wasm_depth",
      "check": "no_ffi_binding_name_duplicated",
      "status": "pass",
      "evidence": "FFI bindings: no declared FFI-binding name is owned by more than one row"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "vetted_crypto_crates_only_rustcrypto_or_ring",
      "status": "pass",
      "evidence": "crypto: only vetted crates are used — RustCrypto or ring"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "secrets_zeroized_after_use",
      "status": "pass",
      "evidence": "crypto: secrets are zeroized after use"
    },
    {
      "section": "cryptography_and_secret_handling",
      "check": "constant_time_comparison_for_timing_sensitive_checks",
      "status": "pass",
      "evidence": "crypto: constant-time comparison is used where timing matters"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_reflexive_clone_rc_dodge",
      "status": "fail",
      "evidence": "red line: no reflexive clone/Rc used to dodge the borrow checker is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_premature_unsafe",
      "status": "pass",
      "evidence": "red line: no premature unsafe is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_homemade_crypto",
      "status": "pass",
      "evidence": "red line: no homemade crypto is present in the record"
    },
    {
      "section": "expert_red_lines",
      "check": "expert_no_lifetime_soup_papered_over",
      "status": "pass",
      "evidence": "red line: no lifetime soup papered over with annotations instead of restructuring is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "ffi_bindings_count": 1,
  "ffi_bindings_without_safe_wrapper": [
    "lib_c_core"
  ],
  "ffi_bindings_without_safety_comment": [],
  "ffi_bindings_without_miri": [],
  "safe_wrapper_coverage": "0.000000",
  "safety_comment_coverage": "1.000000",
  "miri_coverage": "1.000000",
  "duplicate_ffi_binding_names": [],
  "summary": "35 pass, 2 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "PRODUCTION RUST ENGINEERING PACK EXPERT\nproject: secure-core\nVERDICT: PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY\n  lifetime_architecture_depth                  pass\n  type_system_and_api_design                   pass\n  async_runtime_depth                          pass\n  performance_measurement_and_allocation       pass\n  unsafe_ffi_and_wasm_depth                    fail\n  cryptography_and_secret_handling             pass\n  expert_red_lines                             fail\n35 pass, 2 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:51:10.098849+00:00 · gateway v1.1.0 · external verification battery Wave 14 · source `verification/work/production-rust-engineering-pack-expert/evidence.json`.

Input:

```json
{
  "project": 12345,
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "project",
  "detail": "project must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) screen-NO — flag-with-controls (census class), with the three named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`ffi_bindings_count`, the three row-name lists, `duplicate_ffi_binding_names` and the three coverage ratios) |
| Input reference typed | Yes — 46 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/production-rust-engineering-pack-expert/evidence.json` |
