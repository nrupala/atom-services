# Production rust engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a production Rust codebase — ownership, error handling, unsafe policy, async runtime, testing, tooling, workspace and supply chain — and a record of how it is actually engineered. This atom reads one declared manifest and returns one deterministic verdict across seven sections (ownership_and_lifetimes, error_handling, unsafe_discipline, async_discipline, testing_and_benchmarks, tooling_workspace_and_supply_chain, red_lines): **PRODUCTION_RUST_ENGINEERING_PACK_READY**, **PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 37 checks. It audits the declared engineering record's completeness and consistency only — it compiles no code itself, runs no cargo, clippy, rustfmt or cargo-audit command, inspects no repository or crate, runs no test or benchmark, and does not verify that declared practice was ever carried out. A codebase is ready *on your declared evidence*: it never judges whether a declared invariant is actually true, whether a documented unsafe block is sound, whether the declared ownership design is good, or whether the error types are well-designed. The computed checks: the declared `unsafe_blocks` list must be present (an empty list passes — it declares the codebase contains no unsafe blocks); every declared unsafe-block row must declare its invariant documented and tests covering it; and no unsafe-block `location` may appear on more than one row. The skill states no numeric threshold at all — no maximum number or percentage of clones, or a clone-per-function rate; no maximum number of unsafe blocks, or an unsafe-lines-of-code budget; no channel capacity number; no timeout duration in milliseconds or seconds; no test-coverage percentage, test count, or benchmark performance figure (only that criterion benches exist is checked); no clippy lint count beyond the skill's own clean-with-`-D warnings` gate, or a list of permitted silenced lints beyond a reason being required; no crate count, workspace size, or feature-flag count beyond minimal-with-no-default-bloat as declared; no specific MSRV version number (only that an MSRV is pinned is checked); no cargo-audit vulnerability count or severity bar beyond the audit being run; and no dependency count or named list of approved crates (only that new crates are reviewed is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack` — tool name `production_rust_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `ownership.borrow_before_cloning_practised` | ownership evidence: borrow before cloning is practised |
| `ownership.lifetimes_kept_local` | ownership evidence: lifetimes are kept local |
| `ownership.owned_data_at_boundaries_borrows_within` | ownership evidence: owned data at boundaries, borrows within |
| `ownership.clones_justified_where_present` | ownership evidence: clones are justified where present |
| `errors.error_enums_used_for_fallible_apis` | error evidence: error enums are used for fallible APIs |
| `errors.thiserror_used_for_library_errors` | error evidence: thiserror is used for library errors |
| `errors.anyhow_used_for_binary_errors` | error evidence: anyhow is used for binary errors |
| `errors.question_mark_propagation_used` | error evidence: `?` propagation is used |
| `errors.no_unwrap_or_expect_in_production_paths` | error evidence: no unwrap or expect in production paths |
| `errors.unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages` | error evidence: unwrap/expect exceptions are limited to tests and startup, with messages |
| `unsafe_policy.unsafe_forbidden_by_default_declared` | unsafe evidence: unsafe is forbidden by default, as declared |
| `unsafe_policy.unsafe_isolated_in_dedicated_modules` | unsafe evidence: unsafe is isolated in dedicated modules |
| `unsafe_blocks` (list of unsafe-block-row objects) | computed: must be present; reported as `unsafe_blocks_count`; an empty list declares no unsafe blocks |
| `unsafe_blocks[].location` (string) | names the row in the computed outputs; computed: no location may appear on more than one row |
| `unsafe_blocks[].invariant_documented` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `unsafe_blocks_without_invariant` |
| `unsafe_blocks[].tests_covering_block` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `unsafe_blocks_without_tests` |
| `async_runtime.structured_tasks_with_tokio_used` | async evidence: structured tasks with tokio are used |
| `async_runtime.blocking_calls_absent_from_async_code` | async evidence: blocking calls are absent from async code |
| `async_runtime.bounded_channels_used` | async evidence: bounded channels are used |
| `async_runtime.timeouts_applied_everywhere` | async evidence: timeouts are applied everywhere |
| `testing.unit_tests_beside_code_present` | testing evidence: unit tests beside the code are present |
| `testing.integration_tests_in_tests_directory_present` | testing evidence: integration tests in the `tests/` directory are present |
| `testing.doc_tests_for_examples_present` | testing evidence: doc tests for examples are present |
| `testing.error_paths_tested` | testing evidence: error paths are tested |
| `testing.criterion_benchmarks_present` | testing evidence: criterion benchmarks are present |
| `testing.tests_green_including_failure_paths` | testing evidence: tests are green, including failure paths |
| `tooling.clippy_clean_with_deny_warnings` | tooling evidence: clippy is clean with deny warnings |
| `tooling.cargo_fmt_check_clean` | tooling evidence: `cargo fmt --check` is clean |
| `tooling.lints_fixed_not_silenced_without_reason` | tooling evidence: lints are fixed, not silenced without reason |
| `workspace.crates_split_only_at_real_boundaries` | workspace evidence: crates are split only at real boundaries |
| `workspace.feature_flags_kept_minimal_no_default_bloat` | workspace evidence: feature flags are kept minimal, with no default bloat |
| `supply_chain.cargo_audit_run` | supply-chain evidence: cargo audit is run |
| `supply_chain.msrv_pinned` | supply-chain evidence: the MSRV is pinned |
| `supply_chain.new_crates_reviewed_before_adoption` | supply-chain evidence: new crates are reviewed before adoption |
| `red_lines.blocking_work_inside_async_present` | must be `false` to pass (red line: no blocking work inside async) |
| `red_lines.unbounded_channels_present` | must be `false` to pass (red line: no unbounded channels) |
| `red_lines.spawn_loops_without_backpressure_present` | must be `false` to pass (red line: no spawn loops without backpressure) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/production-rust-engineering-pack`:

```json
{
  "project": "test-project",
  "ownership": {
    "borrow_before_cloning_practised": true,
    "lifetimes_kept_local": true,
    "owned_data_at_boundaries_borrows_within": true,
    "clones_justified_where_present": true
  },
  "errors": {
    "error_enums_used_for_fallible_apis": true,
    "thiserror_used_for_library_errors": true,
    "anyhow_used_for_binary_errors": true,
    "question_mark_propagation_used": true,
    "no_unwrap_or_expect_in_production_paths": true,
    "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages": true
  },
  "unsafe_policy": {
    "unsafe_forbidden_by_default_declared": true,
    "unsafe_isolated_in_dedicated_modules": true
  },
  "unsafe_blocks": [
    {
      "location": "src/lib.rs:42",
      "invariant_documented": true,
      "tests_covering_block": true
    }
  ],
  "async_runtime": {
    "structured_tasks_with_tokio_used": true,
    "blocking_calls_absent_from_async_code": true,
    "bounded_channels_used": true,
    "timeouts_applied_everywhere": true
  },
  "testing": {
    "unit_tests_beside_code_present": true,
    "integration_tests_in_tests_directory_present": true,
    "doc_tests_for_examples_present": true,
    "error_paths_tested": true,
    "criterion_benchmarks_present": true,
    "tests_green_including_failure_paths": true
  },
  "tooling": {
    "clippy_clean_with_deny_warnings": true,
    "cargo_fmt_check_clean": true,
    "lints_fixed_not_silenced_without_reason": true
  },
  "workspace": {
    "crates_split_only_at_real_boundaries": true,
    "feature_flags_kept_minimal_no_default_bloat": true
  },
  "supply_chain": {
    "cargo_audit_run": true,
    "msrv_pinned": true,
    "new_crates_reviewed_before_adoption": true
  },
  "red_lines": {
    "blocking_work_inside_async_present": false,
    "unbounded_channels_present": false,
    "spawn_loops_without_backpressure_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "production-rust-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_READY",
  "sections": {
    "ownership_and_lifetimes": "pass",
    "error_handling": "pass",
    "unsafe_discipline": "pass",
    "async_discipline": "pass",
    "testing_and_benchmarks": "pass",
    "tooling_workspace_and_supply_chain": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "unsafe_blocks_count": 1,
  "unsafe_blocks_without_invariant": [],
  "unsafe_blocks_without_tests": [],
  "documented_coverage": "1.000000",
  "tested_coverage": "1.000000",
  "duplicate_unsafe_block_locations": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

## Verdicts

- **PRODUCTION_RUST_ENGINEERING_PACK_READY** — every check passes; the declared production Rust engineering record is complete and consistent with the skill's checklist and red lines.
- **PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `unsafe_blocks_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `unsafe_blocks_without_invariant` and `unsafe_blocks_without_tests` (blocks whose relevant field is present but not true; a block with the field absent is missing evidence and does not appear; null when the list is not declared) and `duplicate_unsafe_block_locations` (locations declared on more than one row, in the order their second occurrence appears), the coverage values `documented_coverage` and `tested_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
