# Production Rust engineering pack expert — `production-rust-engineering-pack-expert`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Writes Rust that lets the compiler enforce the rules — ownership done right, illegal states made impossible, no borrow-checker fights.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Guardian Mesh and hot-path builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the expert production Rust engineering manifest

The caller submits one JSON manifest: a declared EXPERT-tier
production Rust engineering record for one Rust codebase, made
from the codebase's actual practice. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails
(`PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `lifetime_design.lifetimes_modelled_deliberately_at_api_boundaries` (boolean) | lifetime_architecture_depth |
| `lifetime_design.lifetime_annotation_sprawl_treated_as_layout_signal` (boolean) | lifetime_architecture_depth |
| `lifetime_design.structs_split_when_lifetimes_tangle` (boolean) | lifetime_architecture_depth |
| `lifetime_design.index_handles_or_arenas_used_for_tangled_graphs` (boolean) | lifetime_architecture_depth |
| `lifetime_design.borrow_checker_fights_resolved_by_restructuring` (boolean) | lifetime_architecture_depth |
| `lifetime_design.crate_dependency_graph_acyclic_and_boundaries_clean` (boolean) | lifetime_architecture_depth |
| `type_design.newtypes_wrap_domain_primitives` (boolean) | type_system_and_api_design |
| `type_design.state_machines_modelled_with_enums` (boolean) | type_system_and_api_design |
| `type_design.from_into_conversions_for_value_crossings` (boolean) | type_system_and_api_design |
| `type_design.builder_pattern_for_complex_construction` (boolean) | type_system_and_api_design |
| `type_design.trait_boundaries_chosen_over_premature_generics` (boolean) | type_system_and_api_design |
| `type_design.impl_vs_dyn_trait_choice_made_consciously` (boolean) | type_system_and_api_design |
| `type_design.error_values_carry_context_at_boundaries` (boolean) | type_system_and_api_design |
| `async_depth.blocking_work_offloaded_via_spawn_blocking` (boolean) | async_runtime_depth |
| `async_depth.send_sync_bounds_checked_for_spawned_futures` (boolean) | async_runtime_depth |
| `async_depth.mpsc_and_oneshot_channels_assigned_by_purpose` (boolean) | async_runtime_depth |
| `async_depth.cancellation_modelled_explicitly_in_async_flows` (boolean) | async_runtime_depth |
| `performance.flamegraphs_captured_before_optimizing` (boolean) | performance_measurement_and_allocation |
| `performance.criterion_results_gate_optimization_claims` (boolean) | performance_measurement_and_allocation |
| `performance.str_borrows_preferred_over_owned_strings` (boolean) | performance_measurement_and_allocation |
| `performance.iterators_preferred_over_manual_loops` (boolean) | performance_measurement_and_allocation |
| `performance.cow_used_for_maybe_owned_data` (boolean) | performance_measurement_and_allocation |
| `performance.smallvec_used_where_small_sizes_dominate` (boolean) | performance_measurement_and_allocation |
| `unsafe_ffi.unsafe_surface_encapsulated_behind_safe_api` (boolean) | unsafe_ffi_and_wasm_depth |
| `unsafe_ffi.wasm_sandboxing_via_wasm_bindgen_for_untrusted_code` (boolean) | unsafe_ffi_and_wasm_depth |
| `ffi_bindings` (list of FFI-binding-row objects, each with the entry fields below; computed, see below) | unsafe_ffi_and_wasm_depth |
| `ffi_bindings[].name` (string; names the row in the computed outputs) | unsafe_ffi_and_wasm_depth |
| `ffi_bindings[].safe_wrapper_present` (boolean; must be `true` per row) | unsafe_ffi_and_wasm_depth |
| `ffi_bindings[].safety_comment_present` (boolean; must be `true` per row) | unsafe_ffi_and_wasm_depth |
| `ffi_bindings[].miri_tested` (boolean; must be `true` per row) | unsafe_ffi_and_wasm_depth |
| `crypto.vetted_crypto_crates_only_rustcrypto_or_ring` (boolean) | cryptography_and_secret_handling |
| `crypto.secrets_zeroized_after_use` (boolean) | cryptography_and_secret_handling |
| `crypto.constant_time_comparison_for_timing_sensitive_checks` (boolean) | cryptography_and_secret_handling |
| `expert_red_lines.reflexive_clone_rc_dodge_present` (boolean; must be `false` to pass — skill red line) | expert_red_lines |
| `expert_red_lines.premature_unsafe_present` (boolean; must be `false` to pass — skill red line) | expert_red_lines |
| `expert_red_lines.homemade_crypto_present` (boolean; must be `false` to pass — skill red line) | expert_red_lines |
| `expert_red_lines.lifetime_soup_papered_over_present` (boolean; must be `false` to pass — skill red line) | expert_red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **FFI bindings declared:** the declared `ffi_bindings` list
  passes when it is present. An absent list is missing
  evidence. An empty list passes: it declares that the codebase
  exposes no FFI bindings, and the skill requires no FFI
  surface.
- **Safe wrapper per FFI binding:** every declared FFI-binding
  row must declare `safe_wrapper_present` true (the skill:
  unsafe is "encapsulate[d] behind a safe API"). A row with the
  field absent is missing evidence; a row declaring it false
  fails. On an empty list the check passes vacuously.
- **`// SAFETY:` comment per FFI binding:** every declared row
  must declare `safety_comment_present` true (the skill:
  "document every invariant with `// SAFETY:`"), under the same
  absent/false/vacuous rules.
- **Miri testing per FFI binding:** every declared row must
  declare `miri_tested` true (the skill: "test under `miri`"),
  under the same rules.
- **No FFI-binding name duplicated:** no declared FFI-binding
  `name` may appear on more than one row. A row with `name`
  absent is missing evidence for this check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`ffi_bindings_count` (the declared list length, or null when
the list is not declared — counts are reported as integers,
exactly), the row-name lists
`ffi_bindings_without_safe_wrapper`,
`ffi_bindings_without_safety_comment` and
`ffi_bindings_without_miri` (bindings whose field is present
but not true; a binding with the field absent is missing
evidence and does not appear),
`duplicate_ffi_binding_names` (names declared on more than one
row, in the order their second occurrence appears), and the
coverage ratios `safe_wrapper_coverage`,
`safety_comment_coverage` and `miri_coverage`. **Fixed
serialization rule:** computed ratios are reported as strings
with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio is
null when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold at all — its demands are
qualitative declarations the record makes, not bars the atom
can set. Quantities are computed and reported; the only bar on
the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a maximum lifetime-annotation count or a lifetime-per-API
rate; a clone or allocation count, an allocation budget, or a
per-function allocation rate; a benchmark performance figure,
a flamegraph hot-spot percentage, or a speedup factor an
optimization must show (only that criterion measurements and
flamegraphs gate the work is checked); a `SmallVec` inline
capacity or a size cutoff for when it "pays"; an FFI-binding
count or an unsafe-lines-of-code budget; a miri runtime or a
miri issue count; a key length, a zeroize coverage percentage,
or a named list of timing-sensitive operations beyond
constant-time comparison being declared where timing matters;
a crate count or a dependency-depth limit beyond the graph
being declared acyclic with clean boundaries; a binary-size
budget for the `impl Trait` vs `dyn Trait` trade-off (only
that the choice is made consciously is checked).

The verdict is one of
`PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY` (all 37 checks
pass), `PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails
but evidence is missing), across seven sections:
lifetime_architecture_depth, type_system_and_api_design,
async_runtime_depth, performance_measurement_and_allocation,
unsafe_ffi_and_wasm_depth, cryptography_and_secret_handling,
expert_red_lines.

## Distinct ground

The nearest sibling is `production-rust-engineering-pack` —
the BASE tier of the same discipline (a declared production
Rust record: borrow before cloning with lifetimes kept local,
error enums with thiserror/anyhow and zero unwrap in production
paths, unsafe forbidden by default with every block's invariant
documented and tested, structured tokio tasks with bounded
channels and timeouts, unit/integration/doc tests and criterion
benches, clippy clean under `-D warnings` with `cargo fmt
--check`, minimal feature flags, cargo audit with a pinned
MSRV, and the base red lines). This expert atom shares **zero
checks** with the base pack and with every other atom —
verified mechanically by enumerating `evaluate({})` check names
from every `services/*/src/*.py` oracle and intersecting: the
expert register (37 names) overlaps no other register,
including the base pack's 37. Every check here is an
expert-only question the base pack does not ask: lifetimes
modelled deliberately with annotation sprawl treated as a
layout signal, structs split and index handles/arenas used when
lifetimes tangle, borrow-checker fights resolved by
restructuring, an acyclic crate graph with clean boundaries;
newtypes, state-machine enums, `From`/`Into` conversions,
builders, trait boundaries over premature generics, conscious
`impl Trait` vs `dyn Trait` choice, and errors carrying
context; `spawn_blocking` offload, `Send`/`Sync` bounds,
mpsc/oneshot channel purpose, and explicitly modelled
cancellation; flamegraph-first optimization gated by criterion
results, with `&str`, iterator, `Cow` and `SmallVec` allocation
idioms; unsafe encapsulated behind a safe API with every
declared FFI binding carrying a safe wrapper, a `// SAFETY:`
comment and miri testing, plus wasm-bindgen sandboxing; vetted
RustCrypto/`ring` cryptography with zeroized secrets and
constant-time comparison; and the expert red lines (reflexive
`clone`/`Rc` dodges, premature unsafe, homemade crypto,
lifetime soup papered over). The boundary is: expert design
depth here; base production hygiene in the base pack; C memory
discipline, C++ RAII/value semantics and Python practice in
their own atoms.

## Honest scoping

This atom reviews a **declared** expert production Rust
engineering record — it compiles no code itself, runs no
cargo, miri, clippy or flamegraph command, inspects no
repository or crate, runs no test or benchmark, and does not
verify that declared practice was ever carried out. A codebase
is ready *on the caller's declared evidence*: a record that
declares every FFI binding miri-tested and every secret
zeroized passes those checks even if the real codebase did
none of it. It is a completeness and consistency audit of the
engineering record the skill requires, **not a compiler, a
soundness proof, a cryptography review, or a guarantee that
the code is memory-safe or correct**: it never judges whether
a declared `// SAFETY:` invariant is actually true, whether a
safe wrapper is actually sound, whether the declared lifetime
restructuring is good, or whether the type design actually
makes the important illegal states unrepresentable — only that
the record contains what the skill's expert practice demands,
and that its declared FFI-binding rows are internally
consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds at all
(the skill states none — see the declined list above); no live
verification of any declared fact; no judgment of practice
*quality* — whether the lifetime architecture, type design, or
crypto usage is adequate for the real codebase is the caller's
declaration, checked only for declared presence and
consistency; the skill's worked examples (modelling a state
machine in Rust with enums, the guardian-mesh crate list, the
PAE C numerical core and argent's WASM + GGUF approach) are
checked only as the general declarations the skill states
(state machines modelled with enums; crate boundaries clean
and acyclic; FFI bindings declared with wrappers, SAFETY
comments and miri testing; wasm sandboxing declared) — this
atom takes no position on any specific crate, binding or
codebase named in the skill.

## U-13 regulatory screen

Classification: **(b) screen-NO — flag-with-controls (census
class).** This atom's output could not read as regulated
professional advice — it audits a declared software-engineering
record for completeness and consistency against an expert Rust
practice skill; it offers no engineering-practice advice in the
APEGA sense (no design, stamping, or safety judgment over
physical systems), no financial or securities advice, and
nothing psychology-adjacent. Its subject is software practice
only, the same class as the software-engineering titles that
stayed live at the census pending the owner's review. Named
controls: (1) declared-record audit only — the atom audits the
record the caller declares, never inspects real code and never
verifies practice; (2) advice-shaped skill steps are excluded
as red lines — the skill's prescriptive moves (how to model a
state machine, how to restructure a layout) are never emitted
as advice; the atom only checks declared presence/consistency
and refuses the skill's anti-patterns as red-line declarations;
(3) no numeric threshold is invented — every bar is the skill's
own stated rule or completeness over the caller's declared
rows.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
