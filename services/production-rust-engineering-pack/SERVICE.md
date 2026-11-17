# Production Rust engineering pack — `production-rust-engineering-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write production Rust — ownership done right, no unwrap in prod paths, clippy-clean, tested error paths.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Guardian Mesh and hot-path builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the production Rust engineering manifest

The caller submits one JSON manifest: a declared production
Rust engineering record for one Rust codebase, made from the
codebase's actual practice. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `ownership.borrow_before_cloning_practised` (boolean) | ownership_and_lifetimes |
| `ownership.lifetimes_kept_local` (boolean) | ownership_and_lifetimes |
| `ownership.owned_data_at_boundaries_borrows_within` (boolean) | ownership_and_lifetimes |
| `ownership.clones_justified_where_present` (boolean) | ownership_and_lifetimes |
| `errors.error_enums_used_for_fallible_apis` (boolean) | error_handling |
| `errors.thiserror_used_for_library_errors` (boolean) | error_handling |
| `errors.anyhow_used_for_binary_errors` (boolean) | error_handling |
| `errors.question_mark_propagation_used` (boolean) | error_handling |
| `errors.no_unwrap_or_expect_in_production_paths` (boolean) | error_handling |
| `errors.unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages` (boolean) | error_handling |
| `unsafe_policy.unsafe_forbidden_by_default_declared` (boolean) | unsafe_discipline |
| `unsafe_policy.unsafe_isolated_in_dedicated_modules` (boolean) | unsafe_discipline |
| `unsafe_blocks` (list of unsafe-block-row objects, each with the entry fields below; computed, see below) | unsafe_discipline |
| `unsafe_blocks[].location` (string; names the row in the computed outputs) | unsafe_discipline |
| `unsafe_blocks[].invariant_documented` (boolean; must be `true` per row) | unsafe_discipline |
| `unsafe_blocks[].tests_covering_block` (boolean; must be `true` per row) | unsafe_discipline |
| `async_runtime.structured_tasks_with_tokio_used` (boolean) | async_discipline |
| `async_runtime.blocking_calls_absent_from_async_code` (boolean) | async_discipline |
| `async_runtime.bounded_channels_used` (boolean) | async_discipline |
| `async_runtime.timeouts_applied_everywhere` (boolean) | async_discipline |
| `testing.unit_tests_beside_code_present` (boolean) | testing_and_benchmarks |
| `testing.integration_tests_in_tests_directory_present` (boolean) | testing_and_benchmarks |
| `testing.doc_tests_for_examples_present` (boolean) | testing_and_benchmarks |
| `testing.error_paths_tested` (boolean) | testing_and_benchmarks |
| `testing.criterion_benchmarks_present` (boolean) | testing_and_benchmarks |
| `testing.tests_green_including_failure_paths` (boolean) | testing_and_benchmarks |
| `tooling.clippy_clean_with_deny_warnings` (boolean) | tooling_workspace_and_supply_chain |
| `tooling.cargo_fmt_check_clean` (boolean) | tooling_workspace_and_supply_chain |
| `tooling.lints_fixed_not_silenced_without_reason` (boolean) | tooling_workspace_and_supply_chain |
| `workspace.crates_split_only_at_real_boundaries` (boolean) | tooling_workspace_and_supply_chain |
| `workspace.feature_flags_kept_minimal_no_default_bloat` (boolean) | tooling_workspace_and_supply_chain |
| `supply_chain.cargo_audit_run` (boolean) | tooling_workspace_and_supply_chain |
| `supply_chain.msrv_pinned` (boolean) | tooling_workspace_and_supply_chain |
| `supply_chain.new_crates_reviewed_before_adoption` (boolean) | tooling_workspace_and_supply_chain |
| `red_lines.blocking_work_inside_async_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unbounded_channels_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.spawn_loops_without_backpressure_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Unsafe blocks declared:** the declared `unsafe_blocks` list
  passes when it is present. An absent list is missing
  evidence. An empty list passes: it declares that the codebase
  contains no unsafe blocks — exactly what the skill's
  forbid-by-default policy aims at — and the skill requires no
  unsafe block.
- **Invariant documented per unsafe block:** every declared
  unsafe-block row must declare `invariant_documented` true
  (the skill: unsafe is a contract, and "Every `unsafe` block
  documented + tested"). A row with the field absent is missing
  evidence; a row declaring it false fails. On an empty list
  the check passes vacuously — there is no undocumented block.
- **Covering tests per unsafe block:** every declared
  unsafe-block row must declare `tests_covering_block` true,
  under the same absent/false/vacuous rules.
- **No unsafe-block location duplicated:** no declared
  unsafe-block `location` may appear on more than one row. A
  row with `location` absent is missing evidence for this
  check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four primary computed checks above cannot be completed),
`unsafe_blocks_count` (the declared list length, or null when
the list is not declared — counts are reported as integers,
exactly), the row-name lists `unsafe_blocks_without_invariant`
(blocks whose invariant field is present but not true; a block
with the field absent is missing evidence and does not appear)
and `unsafe_blocks_without_tests` (same rule for the tests
field), `duplicate_unsafe_block_locations` (locations declared
on more than one row, in the order their second occurrence
appears), and the coverage ratios `documented_coverage`
(blocks with a documented invariant ÷ declared blocks) and
`tested_coverage` (blocks with covering tests ÷ declared
blocks). **Fixed serialization rule:** computed ratios are
reported as strings with exactly six decimal places, produced
in both implementations by the same rule — round half up to
6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with
exactly six decimals; comparisons use the unrounded values. A
ratio is null when its denominator list is absent or empty.
That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The skill states no numeric threshold at all — its demands are
qualitative declarations the record makes, not bars the atom
can set. Quantities are computed and reported; the only bar on
the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a maximum number or percentage of clones, or a
clone-per-function rate; a maximum number of unsafe blocks, or
an unsafe-lines-of-code budget; a channel capacity number; a
timeout duration in milliseconds or seconds; a test-coverage
percentage, a test count, or a benchmark performance figure
(only that criterion benches exist is checked); a clippy lint
count beyond the skill's own clean-with-`-D warnings` gate, or
a list of permitted silenced lints beyond a reason being
required; a crate count, a workspace size, or a feature-flag
count beyond minimal-with-no-default-bloat as declared; a
specific MSRV version number (only that an MSRV is pinned is
checked); a cargo-audit vulnerability count or severity bar
beyond the audit being run; a dependency count or a named list
of approved crates (only that new crates are reviewed is
checked).

The verdict is one of `PRODUCTION_RUST_ENGINEERING_PACK_READY`
(all 37 checks pass),
`PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY` (any check fails),
or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections: ownership_and_lifetimes,
error_handling, unsafe_discipline, async_discipline,
testing_and_benchmarks, tooling_workspace_and_supply_chain,
red_lines.

## Distinct ground

The nearest siblings are `c-engineering-review` (a declared C
engineering record — manual memory discipline, one owner per
allocation, banned functions, sized APIs, sanitizers and
fuzzed parsers over C code), `cpp-engineering-review` (a
declared C++ engineering record — RAII and destructors owning
resources, smart pointers and value semantics, the rule of
zero, exceptions policy and ABI versioning over C++ code) and
`production-python-engineering-pack` (a declared Python
engineering record — typing, packaging and interpreter tooling
over Python code). This atom shares **zero checks** with any of
them (verified by comparing every check name here against
every check name in the C and C++ reviews' sources; the Python
pack is authored in parallel from its own skill and the pair is
verified centrally by the coordinator): every check here is a
Rust question — borrow before cloning with lifetimes kept
local and owned data at boundaries with borrows within,
error enums with thiserror for libraries and anyhow for
binaries, `?` propagation and zero unwrap/expect in production
paths with exceptions confined to tests and startup invariants
carrying messages, unsafe forbidden by default and isolated in
dedicated modules with every declared block's invariant
documented and covered by tests, structured tokio tasks with
no blocking calls in async code, bounded channels and timeouts
everywhere, unit tests beside code with integration tests in
`tests/`, doc tests and criterion benchmarks, tests green
including the failure paths, clippy clean under `-D warnings`
with `cargo fmt --check` clean and lints fixed rather than
silenced without reason, crates split only at real boundaries
with feature flags minimal and no default bloat, cargo audit
run with a pinned MSRV and new crates reviewed before
adoption, and the Rust red lines. The boundary is: a Rust
codebase's declared production practice here; C memory
discipline, C++ RAII/value semantics and Python practice there.

## Honest scoping

This atom reviews a **declared** production Rust engineering
record — it compiles no code itself, runs no cargo, clippy,
rustfmt or cargo-audit command, inspects no repository or
crate, runs no test or benchmark, and does not verify that
declared practice was ever carried out. A codebase is ready
*on the caller's declared evidence*: a record that declares
zero unwrap in production paths, a pinned MSRV, and every
unsafe block documented passes those checks even if the real
codebase did none of it. It is a completeness and consistency
audit of the engineering record the skill requires, **not a
compiler, a linter, a code review of actual Rust source, or a
guarantee that the code is memory-safe or correct**: it never
judges whether a declared invariant is actually true, whether
a documented unsafe block is sound, whether the declared
ownership design is good, or whether the error types are
well-designed — only that the record contains what the skill's
method, quality gates and red lines demand, and that its
declared unsafe-block rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds at all
(the skill states none — see the declined list above); no live
verification of any declared fact; no judgment of practice
*quality* — whether the ownership design, error taxonomy, or
async structure is adequate for the real codebase is the
caller's declaration, checked only for declared presence and
consistency; the skill's dependency-governance cross-reference
is checked only as the review declaration the skill states
(new crates reviewed before adoption) — this atom runs no
audit and takes no position on any specific crate's soundness.

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared software-engineering
record for completeness and consistency against a Rust practice
skill; it offers no engineering-practice advice in the APEGA
sense (no design, stamping, or safety judgment over physical
systems), no financial or securities advice, and nothing
psychology-adjacent. Its subject is software practice only,
the same class as the software-engineering titles that stayed
live at the census pending the owner's review.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
