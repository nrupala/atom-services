# Production Rust engineering pack — documentation

**Production Rust engineering pack** · slug `production-rust-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/production-rust-engineering-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the production Rust engineering manifest.** You declare a record of a production Rust codebase, made from the codebase's actual practice — the atom audits the declared record, it does not compile the code or inspect its repository (see Explanation). The recorded full-pass manifest declares the project `test-project`: borrow before cloning practised, lifetimes kept local, owned data at boundaries with borrows within, and clones justified where present; error enums used for fallible APIs, thiserror for library errors and anyhow for binary errors, `?` propagation used, no unwrap or expect in production paths, and unwrap/expect exceptions limited to tests and startup with messages; unsafe forbidden by default and isolated in dedicated modules, with one unsafe block, `src/lib.rs:42`, its invariant documented and covering tests declared; structured tasks with tokio used, blocking calls absent from async code, bounded channels used, and timeouts applied everywhere; unit tests beside code, integration tests in `tests/`, doc tests for examples, error paths tested, criterion benchmarks present, and tests green including failure paths; clippy clean with deny warnings, `cargo fmt --check` clean, and lints fixed not silenced without reason; crates split only at real boundaries and feature flags kept minimal with no default bloat; cargo audit run, MSRV pinned, and new crates reviewed before adoption; and all three red-line flags `false` (no blocking work inside async, no unbounded channels, no spawn loops without backpressure).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCTION_RUST_ENGINEERING_PACK_READY`: "37 pass, 0 fail, 0 missing of 37 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `unsafe_blocks_count` is 1, and `documented_coverage` and `tested_coverage` are both `"1.000000"`, with all three lists empty (`unsafe_blocks_without_invariant`, `unsafe_blocks_without_tests` and `duplicate_unsafe_block_locations` all `[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-rust-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `production_rust_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `borrow_before_cloning_practised`, `every_unsafe_block_documents_its_invariant`, `no_blocking_work_inside_async`, and the summary reads "34 pass, 3 fail, 0 missing of 37 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `unsafe_blocks_without_invariant` names `src/lib.rs:42` — that row declares `invariant_documented: false` — `documented_coverage` is `"0.000000"` and `tested_coverage` is `"1.000000"`, `ownership.borrow_before_cloning_practised` is declared `false`, failing `borrow_before_cloning_practised`, and `red_lines.blocking_work_inside_async_present` is declared `true`, failing `no_blocking_work_inside_async`; sections `ownership_and_lifetimes`, `unsafe_discipline` and `red_lines` report `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "ownership.borrow_before_cloning_practised",
  "detail": "ownership.borrow_before_cloning_practised must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/production-rust-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/production-rust-engineering-pack` — tool name `production_rust_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `production_rust_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the `unsafe_blocks[]` string field are noted as strings and `unsafe_blocks` as a list there. Where SERVICE.md states no type — the section container objects (`ownership`, `errors`, `unsafe_policy`, `async_runtime`, `testing`, `tooling`, `workspace`, `supply_chain`, `red_lines`) and an `unsafe_blocks[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `unsafe_blocks`, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `unsafe_blocks` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: ownership_and_lifetimes

| Field | Type | Notes |
|---|---|---|
| `ownership` | object | The ownership section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `ownership.borrow_before_cloning_practised` | boolean | — |
| `ownership.lifetimes_kept_local` | boolean | — |
| `ownership.owned_data_at_boundaries_borrows_within` | boolean | — |
| `ownership.clones_justified_where_present` | boolean | — |

#### Read by: error_handling

| Field | Type | Notes |
|---|---|---|
| `errors` | object | The errors section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `errors.error_enums_used_for_fallible_apis` | boolean | — |
| `errors.thiserror_used_for_library_errors` | boolean | — |
| `errors.anyhow_used_for_binary_errors` | boolean | — |
| `errors.question_mark_propagation_used` | boolean | — |
| `errors.no_unwrap_or_expect_in_production_paths` | boolean | — |
| `errors.unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages` | boolean | — |

#### Read by: unsafe_discipline

| Field | Type | Notes |
|---|---|---|
| `unsafe_policy` | object | The unsafe-policy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `unsafe_policy.unsafe_forbidden_by_default_declared` | boolean | — |
| `unsafe_policy.unsafe_isolated_in_dedicated_modules` | boolean | — |
| `unsafe_blocks` | list | list of unsafe-block-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `unsafe_blocks[]` | object | One declared unsafe-block row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `unsafe_blocks[].location` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `unsafe_blocks[].invariant_documented` | boolean | must be `true` per row |
| `unsafe_blocks[].tests_covering_block` | boolean | must be `true` per row |

#### Read by: async_discipline

| Field | Type | Notes |
|---|---|---|
| `async_runtime` | object | The async-runtime section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `async_runtime.structured_tasks_with_tokio_used` | boolean | — |
| `async_runtime.blocking_calls_absent_from_async_code` | boolean | — |
| `async_runtime.bounded_channels_used` | boolean | — |
| `async_runtime.timeouts_applied_everywhere` | boolean | — |

#### Read by: testing_and_benchmarks

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.unit_tests_beside_code_present` | boolean | — |
| `testing.integration_tests_in_tests_directory_present` | boolean | — |
| `testing.doc_tests_for_examples_present` | boolean | — |
| `testing.error_paths_tested` | boolean | — |
| `testing.criterion_benchmarks_present` | boolean | — |
| `testing.tests_green_including_failure_paths` | boolean | — |

#### Read by: tooling_workspace_and_supply_chain

| Field | Type | Notes |
|---|---|---|
| `tooling` | object | The tooling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tooling.clippy_clean_with_deny_warnings` | boolean | — |
| `tooling.cargo_fmt_check_clean` | boolean | — |
| `tooling.lints_fixed_not_silenced_without_reason` | boolean | — |
| `workspace` | object | The workspace section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `workspace.crates_split_only_at_real_boundaries` | boolean | — |
| `workspace.feature_flags_kept_minimal_no_default_bloat` | boolean | — |
| `supply_chain` | object | The supply-chain section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `supply_chain.cargo_audit_run` | boolean | — |
| `supply_chain.msrv_pinned` | boolean | — |
| `supply_chain.new_crates_reviewed_before_adoption` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.blocking_work_inside_async_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unbounded_channels_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.spawn_loops_without_backpressure_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: ownership_and_lifetimes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `borrow_before_cloning_practised` | ownership: borrow before cloning is practised | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lifetimes_kept_local` | ownership: lifetimes are kept local | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `owned_data_at_boundaries_borrows_within` | ownership: owned data at boundaries, borrows within | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `clones_justified_where_present` | ownership: every clone present is justified — borrowing was considered first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: error_handling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `error_enums_used_for_fallible_apis` | errors: errors are types — enums carry the fallible cases | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `thiserror_used_for_library_errors` | errors: thiserror is used for library errors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `anyhow_used_for_binary_errors` | errors: anyhow is used for binary errors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `question_mark_propagation_used` | errors: `?` is used for propagation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unwrap_or_expect_in_production_paths` | errors: zero unwrap/expect in production paths — no unwrap/expect on fallible paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages` | errors: any unwrap/expect exceptions are confined to tests and startup-time invariants, with messages | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: unsafe_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unsafe_forbidden_by_default_declared` | unsafe policy: unsafe is forbidden by default | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unsafe_isolated_in_dedicated_modules` | unsafe policy: where unsafe is needed, it is isolated in a dedicated module | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unsafe_blocks_declared` | the declared record names its unsafe blocks — the unsafe_blocks list is present; an empty list declares that the codebase contains no unsafe blocks | Computed over the declared record. Pass: the `unsafe_blocks` list is present — an empty list passes, because it declares that the codebase contains no unsafe blocks. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_unsafe_block_documents_its_invariant` | unsafe blocks: every declared unsafe block documents its invariant — unsafe is a contract | Computed over the declared record. Pass: every declared unsafe-block row declares `invariant_documented` as `true` — on an empty list the check passes vacuously. Fail: a row declares `invariant_documented` present but not `true` (offending rows are named in `unsafe_blocks_without_invariant`). Missing: the list is absent, or a row has `invariant_documented` absent (such a row is missing evidence and does not appear in `unsafe_blocks_without_invariant`). |
| `every_unsafe_block_has_covering_tests` | unsafe blocks: every declared unsafe block has tests covering it | Computed over the declared record. Pass: every declared unsafe-block row declares `tests_covering_block` as `true` — on an empty list the check passes vacuously. Fail: a row declares `tests_covering_block` present but not `true` (offending rows are named in `unsafe_blocks_without_tests`). Missing: the list is absent, or a row has `tests_covering_block` absent (such a row is missing evidence and does not appear in `unsafe_blocks_without_tests`). |
| `no_unsafe_block_location_duplicated` | unsafe blocks: no declared unsafe-block location is owned by more than one row | Computed over the declared record. Pass: no declared `location` string appears on more than one unsafe-block row. Fail: a `location` string is declared on more than one row (offending locations are named in `duplicate_unsafe_block_locations`). Missing: the list is absent, or a row has `location` absent (such a row is missing evidence for this check). |

#### Section: async_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_tasks_with_tokio_used` | async: structured tasks with tokio are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `blocking_calls_absent_from_async_code` | async: no blocking calls inside async code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `bounded_channels_used` | async: bounded channels are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `timeouts_applied_everywhere` | async: timeouts are applied everywhere | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: testing_and_benchmarks

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unit_tests_beside_code_present` | testing: unit tests sit beside the code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `integration_tests_in_tests_directory_present` | testing: integration tests live in tests/ | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `doc_tests_for_examples_present` | testing: doc tests cover the examples | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_paths_tested` | testing: the error paths are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `criterion_benchmarks_present` | testing: criterion is used for benchmarks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tests_green_including_failure_paths` | testing: tests are green, including the failure and error paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: tooling_workspace_and_supply_chain

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `clippy_clean_with_deny_warnings` | clippy gate: cargo clippy is clean with -D warnings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cargo_fmt_check_clean` | clippy gate: cargo fmt --check is clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lints_fixed_not_silenced_without_reason` | clippy gate: lints are fixed, not silenced without reason | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `crates_split_only_at_real_boundaries` | workspaces: crates are split only when boundaries are real | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `feature_flags_kept_minimal_no_default_bloat` | workspaces: feature flags are kept minimal — no default bloat | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cargo_audit_run` | supply chain: cargo audit is run | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `msrv_pinned` | supply chain: the MSRV is pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `new_crates_reviewed_before_adoption` | supply chain: new crates are reviewed before adoption | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_blocking_work_inside_async` | red line: no blocking work inside the async runtime is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unbounded_channels` | red line: no unbounded channels are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_spawn_loops_without_backpressure` | red line: no spawn-loops without backpressure are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"production-rust-engineering-pack"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `unsafe_blocks_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `unsafe_blocks_without_invariant` (blocks whose `invariant_documented` field is present but not true; a block with the field absent is missing evidence and does not appear) and `unsafe_blocks_without_tests` (same rule for the `tests_covering_block` field) and the name list `duplicate_unsafe_block_locations` (locations declared on more than one row, in the order their second occurrence appears) — all three lists are null when the `unsafe_blocks` list is not declared, as recorded in the sparse case; and the ratios `documented_coverage` (blocks with a documented invariant ÷ declared blocks) and `tested_coverage` (blocks with covering tests ÷ declared blocks) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRODUCTION_RUST_ENGINEERING_PACK_READY` — all 37 checks pass: the declared production Rust engineering record is complete and consistent with the bound skill's checklist and red lines.
- `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the four primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `unsafe_blocks_count`, `unsafe_blocks_without_invariant`, `unsafe_blocks_without_tests`, `documented_coverage`, `tested_coverage`, `duplicate_unsafe_block_locations` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"ownership.borrow_before_cloning_practised","detail":"ownership.borrow_before_cloning_practised must be a boolean"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write production Rust — ownership done right, no unwrap in prod paths, clippy-clean, tested error paths (the bound capability, from the skill). You submit one declared record — the production Rust engineering manifest, made from the codebase's actual practice — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 7 sections (`ownership_and_lifetimes`, `error_handling`, `unsafe_discipline`, `async_discipline`, `testing_and_benchmarks`, `tooling_workspace_and_supply_chain`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `unsafe_blocks` list must be present (an empty list passes: it declares that the codebase contains no unsafe blocks, exactly what the skill's forbid-by-default policy aims at, and the skill requires no unsafe block), every unsafe-block row must declare its invariant documented and tests covering it, and no declared `location` may appear on more than one unsafe-block row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRODUCTION_RUST_ENGINEERING_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set. Declined, named: a maximum number or percentage of clones, or a clone-per-function rate; a maximum number of unsafe blocks, or an unsafe-lines-of-code budget; a channel capacity number; a timeout duration in milliseconds or seconds; a test-coverage percentage, a test count, or a benchmark performance figure (only that criterion benches exist is checked); a clippy lint count beyond the skill's own clean-with-`-D warnings` gate, or a list of permitted silenced lints beyond a reason being required; a crate count, a workspace size, or a feature-flag count beyond minimal-with-no-default-bloat as declared; a specific MSRV version number (only that an MSRV is pinned is checked); a cargo-audit vulnerability count or severity bar beyond the audit being run; a dependency count or a named list of approved crates (only that new crates are reviewed is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** production Rust engineering record: a verdict of `PRODUCTION_RUST_ENGINEERING_PACK_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares zero unwrap in production paths, a pinned MSRV, and every unsafe block documented passes those checks even if the real codebase did none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not a compiler, a linter, a code review of actual Rust source, or a guarantee that the code is memory-safe or correct**. Specifically: it compiles no code itself, runs no cargo, clippy, rustfmt or cargo-audit command, inspects no repository or crate, runs no test or benchmark, and does not verify that declared practice was ever carried out. It never judges whether a declared invariant is actually true, whether a documented unsafe block is sound, whether the declared ownership design is good, or whether the error types are well-designed — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared unsafe-block rows are internally consistent. Named exclusions: no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of practice *quality* — whether the ownership design, error taxonomy, or async structure is adequate for the real codebase is the caller's declaration, checked only for declared presence and consistency; the skill's dependency-governance cross-reference is checked only as the review declaration the skill states (new crates reviewed before adoption) — this atom runs no audit and takes no position on any specific crate's soundness.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Guardian Mesh and hot-path builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared production Rust engineering record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering-practice advice in the APEGA sense (no design, stamping, or safety judgment over physical systems), no financial or securities advice, and nothing psychology-adjacent. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `production_rust_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/production_rust_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_production_rust_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/production-rust-engineering-pack` (REST) and `POST /mcp/production-rust-engineering-pack` (MCP, tool `production_rust_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `production_rust_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_blocking_work_inside_async` (input `red_lines.blocking_work_inside_async_present`), `no_unbounded_channels` (input `red_lines.unbounded_channels_present`) and `no_spawn_loops_without_backpressure` (input `red_lines.spawn_loops_without_backpressure_present`), plus the computed checks `unsafe_blocks_declared`, `every_unsafe_block_documents_its_invariant`, `every_unsafe_block_has_covering_tests` and `no_unsafe_block_location_duplicated`, which read the `unsafe_blocks` rows rather than any single input field. The remaining recorded check names match the leaf name of the input field they read (for example `borrow_before_cloning_practised` reads `ownership.borrow_before_cloning_practised`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`ownership`, `errors`, `unsafe_policy`, `async_runtime`, `testing`, `tooling`, `workspace`, `supply_chain`, `red_lines`) or for an `unsafe_blocks[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `unsafe_blocks`, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `unsafe_policy` and `unsafe_blocks` inputs are read by the single recorded section `unsafe_discipline`, and `tooling`, `workspace` and `supply_chain` inputs are read by the single recorded section `tooling_workspace_and_supply_chain`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `unsafe_blocks` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `unsafe_blocks_count` and the coverage ratios, but does not state a null rule for the two row-name lists or the duplicate-location list. The recorded sparse response returns all three lists as `null` when `unsafe_blocks` is not declared (as USER-GUIDE.md also states for the row-name lists); this document follows the recording.
7. **Case-design prose divergences — corrections.json:** the originally designed cases diverged from the recorded executions in nine ways, all corrected at design time before execution and recorded in `corrections.json` (and in TEST-REPORT.md's Tester errors); the corrected, executed `cases.json` inputs and expects match evidence.json, and where any earlier prose differed, the recorded responses govern. The divergences were: (a) R1 — the violations `failing_checks` named the section names `ownership_and_lifetimes`, `unsafe_discipline` and `red_lines` instead of exact check names (three rejections); (b) R2 — the full-pass and violations `expect` objects carried no structured `computed_spot_checks`, the computed quantities appearing only in prose notes (two rejections); (c) R3 — the violations input was missing key paths present in the full-pass manifest, including the whole `async_runtime`, `errors`, `supply_chain` and `testing` objects and the `tooling` fields as then placed, so it read as missing evidence rather than failure; (d) full-pass oracle — the original full-pass input nested `unsafe_blocks` under `unsafe_policy` instead of the documented top-level `unsafe_blocks` list (oracle: `INSUFFICIENT_EVIDENCE`, 31 pass / 0 fail / 6 missing, the four computed unsafe checks missing), and placed `crates_split_only_at_real_boundaries` and `feature_flags_kept_minimal_no_default_bloat` under `tooling` instead of the documented `workspace` object (oracle: those two checks missing); and (e) sparse — the original sparse input carried an extra `ownership.borrow_before_cloning_practised: true` field, so it was not the identity-only manifest (oracle: 1 pass / 36 missing instead of 0 pass / 37 missing), and was reduced to `{"project": "sparse-project"}` only.

## Worked examples

Provenance: recorded 2026-11-16T09:45:17.342323+00:00 against gateway v1.1.0, external verification lane, source `verification/work/production-rust-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:45:17.342323+00:00 · gateway v1.1.0 · source `verification/work/production-rust-engineering-pack/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "ownership_and_lifetimes",
      "check": "borrow_before_cloning_practised",
      "status": "pass",
      "evidence": "ownership: borrow before cloning is practised"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "lifetimes_kept_local",
      "status": "pass",
      "evidence": "ownership: lifetimes are kept local"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "owned_data_at_boundaries_borrows_within",
      "status": "pass",
      "evidence": "ownership: owned data at boundaries, borrows within"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "clones_justified_where_present",
      "status": "pass",
      "evidence": "ownership: every clone present is justified — borrowing was considered first"
    },
    {
      "section": "error_handling",
      "check": "error_enums_used_for_fallible_apis",
      "status": "pass",
      "evidence": "errors: errors are types — enums carry the fallible cases"
    },
    {
      "section": "error_handling",
      "check": "thiserror_used_for_library_errors",
      "status": "pass",
      "evidence": "errors: thiserror is used for library errors"
    },
    {
      "section": "error_handling",
      "check": "anyhow_used_for_binary_errors",
      "status": "pass",
      "evidence": "errors: anyhow is used for binary errors"
    },
    {
      "section": "error_handling",
      "check": "question_mark_propagation_used",
      "status": "pass",
      "evidence": "errors: `?` is used for propagation"
    },
    {
      "section": "error_handling",
      "check": "no_unwrap_or_expect_in_production_paths",
      "status": "pass",
      "evidence": "errors: zero unwrap/expect in production paths — no unwrap/expect on fallible paths"
    },
    {
      "section": "error_handling",
      "check": "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages",
      "status": "pass",
      "evidence": "errors: any unwrap/expect exceptions are confined to tests and startup-time invariants, with messages"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_forbidden_by_default_declared",
      "status": "pass",
      "evidence": "unsafe policy: unsafe is forbidden by default"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_isolated_in_dedicated_modules",
      "status": "pass",
      "evidence": "unsafe policy: where unsafe is needed, it is isolated in a dedicated module"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_blocks_declared",
      "status": "pass",
      "evidence": "the declared record names its unsafe blocks — the unsafe_blocks list is present; an empty list declares that the codebase contains no unsafe blocks"
    },
    {
      "section": "unsafe_discipline",
      "check": "every_unsafe_block_documents_its_invariant",
      "status": "pass",
      "evidence": "unsafe blocks: every declared unsafe block documents its invariant — unsafe is a contract"
    },
    {
      "section": "unsafe_discipline",
      "check": "every_unsafe_block_has_covering_tests",
      "status": "pass",
      "evidence": "unsafe blocks: every declared unsafe block has tests covering it"
    },
    {
      "section": "unsafe_discipline",
      "check": "no_unsafe_block_location_duplicated",
      "status": "pass",
      "evidence": "unsafe blocks: no declared unsafe-block location is owned by more than one row"
    },
    {
      "section": "async_discipline",
      "check": "structured_tasks_with_tokio_used",
      "status": "pass",
      "evidence": "async: structured tasks with tokio are used"
    },
    {
      "section": "async_discipline",
      "check": "blocking_calls_absent_from_async_code",
      "status": "pass",
      "evidence": "async: no blocking calls inside async code"
    },
    {
      "section": "async_discipline",
      "check": "bounded_channels_used",
      "status": "pass",
      "evidence": "async: bounded channels are used"
    },
    {
      "section": "async_discipline",
      "check": "timeouts_applied_everywhere",
      "status": "pass",
      "evidence": "async: timeouts are applied everywhere"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "unit_tests_beside_code_present",
      "status": "pass",
      "evidence": "testing: unit tests sit beside the code"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "integration_tests_in_tests_directory_present",
      "status": "pass",
      "evidence": "testing: integration tests live in tests/"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "doc_tests_for_examples_present",
      "status": "pass",
      "evidence": "testing: doc tests cover the examples"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "error_paths_tested",
      "status": "pass",
      "evidence": "testing: the error paths are tested"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "criterion_benchmarks_present",
      "status": "pass",
      "evidence": "testing: criterion is used for benchmarks"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "tests_green_including_failure_paths",
      "status": "pass",
      "evidence": "testing: tests are green, including the failure and error paths"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "clippy_clean_with_deny_warnings",
      "status": "pass",
      "evidence": "clippy gate: cargo clippy is clean with -D warnings"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "cargo_fmt_check_clean",
      "status": "pass",
      "evidence": "clippy gate: cargo fmt --check is clean"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "lints_fixed_not_silenced_without_reason",
      "status": "pass",
      "evidence": "clippy gate: lints are fixed, not silenced without reason"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "crates_split_only_at_real_boundaries",
      "status": "pass",
      "evidence": "workspaces: crates are split only when boundaries are real"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "feature_flags_kept_minimal_no_default_bloat",
      "status": "pass",
      "evidence": "workspaces: feature flags are kept minimal — no default bloat"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "cargo_audit_run",
      "status": "pass",
      "evidence": "supply chain: cargo audit is run"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "msrv_pinned",
      "status": "pass",
      "evidence": "supply chain: the MSRV is pinned"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "new_crates_reviewed_before_adoption",
      "status": "pass",
      "evidence": "supply chain: new crates are reviewed before adoption"
    },
    {
      "section": "red_lines",
      "check": "no_blocking_work_inside_async",
      "status": "pass",
      "evidence": "red line: no blocking work inside the async runtime is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unbounded_channels",
      "status": "pass",
      "evidence": "red line: no unbounded channels are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_spawn_loops_without_backpressure",
      "status": "pass",
      "evidence": "red line: no spawn-loops without backpressure are present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "unsafe_blocks_count": 1,
  "unsafe_blocks_without_invariant": [],
  "unsafe_blocks_without_tests": [],
  "documented_coverage": "1.000000",
  "tested_coverage": "1.000000",
  "duplicate_unsafe_block_locations": [],
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "PRODUCTION RUST ENGINEERING PACK\nproject: test-project\nVERDICT: PRODUCTION_RUST_ENGINEERING_PACK_READY\n  ownership_and_lifetimes                      pass\n  error_handling                               pass\n  unsafe_discipline                            pass\n  async_discipline                             pass\n  testing_and_benchmarks                       pass\n  tooling_workspace_and_supply_chain           pass\n  red_lines                                    pass\n37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:45:17.342323+00:00 · gateway v1.1.0 · source `verification/work/production-rust-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "ownership": {
    "borrow_before_cloning_practised": false,
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
      "invariant_documented": false,
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
    "blocking_work_inside_async_present": true,
    "unbounded_channels_present": false,
    "spawn_loops_without_backpressure_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-rust-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY",
  "sections": {
    "ownership_and_lifetimes": "fail",
    "error_handling": "pass",
    "unsafe_discipline": "fail",
    "async_discipline": "pass",
    "testing_and_benchmarks": "pass",
    "tooling_workspace_and_supply_chain": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "ownership_and_lifetimes",
      "check": "borrow_before_cloning_practised",
      "status": "fail",
      "evidence": "ownership: borrow before cloning is practised"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "lifetimes_kept_local",
      "status": "pass",
      "evidence": "ownership: lifetimes are kept local"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "owned_data_at_boundaries_borrows_within",
      "status": "pass",
      "evidence": "ownership: owned data at boundaries, borrows within"
    },
    {
      "section": "ownership_and_lifetimes",
      "check": "clones_justified_where_present",
      "status": "pass",
      "evidence": "ownership: every clone present is justified — borrowing was considered first"
    },
    {
      "section": "error_handling",
      "check": "error_enums_used_for_fallible_apis",
      "status": "pass",
      "evidence": "errors: errors are types — enums carry the fallible cases"
    },
    {
      "section": "error_handling",
      "check": "thiserror_used_for_library_errors",
      "status": "pass",
      "evidence": "errors: thiserror is used for library errors"
    },
    {
      "section": "error_handling",
      "check": "anyhow_used_for_binary_errors",
      "status": "pass",
      "evidence": "errors: anyhow is used for binary errors"
    },
    {
      "section": "error_handling",
      "check": "question_mark_propagation_used",
      "status": "pass",
      "evidence": "errors: `?` is used for propagation"
    },
    {
      "section": "error_handling",
      "check": "no_unwrap_or_expect_in_production_paths",
      "status": "pass",
      "evidence": "errors: zero unwrap/expect in production paths — no unwrap/expect on fallible paths"
    },
    {
      "section": "error_handling",
      "check": "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages",
      "status": "pass",
      "evidence": "errors: any unwrap/expect exceptions are confined to tests and startup-time invariants, with messages"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_forbidden_by_default_declared",
      "status": "pass",
      "evidence": "unsafe policy: unsafe is forbidden by default"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_isolated_in_dedicated_modules",
      "status": "pass",
      "evidence": "unsafe policy: where unsafe is needed, it is isolated in a dedicated module"
    },
    {
      "section": "unsafe_discipline",
      "check": "unsafe_blocks_declared",
      "status": "pass",
      "evidence": "the declared record names its unsafe blocks — the unsafe_blocks list is present; an empty list declares that the codebase contains no unsafe blocks"
    },
    {
      "section": "unsafe_discipline",
      "check": "every_unsafe_block_documents_its_invariant",
      "status": "fail",
      "evidence": "unsafe blocks: every declared unsafe block documents its invariant — unsafe is a contract"
    },
    {
      "section": "unsafe_discipline",
      "check": "every_unsafe_block_has_covering_tests",
      "status": "pass",
      "evidence": "unsafe blocks: every declared unsafe block has tests covering it"
    },
    {
      "section": "unsafe_discipline",
      "check": "no_unsafe_block_location_duplicated",
      "status": "pass",
      "evidence": "unsafe blocks: no declared unsafe-block location is owned by more than one row"
    },
    {
      "section": "async_discipline",
      "check": "structured_tasks_with_tokio_used",
      "status": "pass",
      "evidence": "async: structured tasks with tokio are used"
    },
    {
      "section": "async_discipline",
      "check": "blocking_calls_absent_from_async_code",
      "status": "pass",
      "evidence": "async: no blocking calls inside async code"
    },
    {
      "section": "async_discipline",
      "check": "bounded_channels_used",
      "status": "pass",
      "evidence": "async: bounded channels are used"
    },
    {
      "section": "async_discipline",
      "check": "timeouts_applied_everywhere",
      "status": "pass",
      "evidence": "async: timeouts are applied everywhere"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "unit_tests_beside_code_present",
      "status": "pass",
      "evidence": "testing: unit tests sit beside the code"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "integration_tests_in_tests_directory_present",
      "status": "pass",
      "evidence": "testing: integration tests live in tests/"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "doc_tests_for_examples_present",
      "status": "pass",
      "evidence": "testing: doc tests cover the examples"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "error_paths_tested",
      "status": "pass",
      "evidence": "testing: the error paths are tested"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "criterion_benchmarks_present",
      "status": "pass",
      "evidence": "testing: criterion is used for benchmarks"
    },
    {
      "section": "testing_and_benchmarks",
      "check": "tests_green_including_failure_paths",
      "status": "pass",
      "evidence": "testing: tests are green, including the failure and error paths"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "clippy_clean_with_deny_warnings",
      "status": "pass",
      "evidence": "clippy gate: cargo clippy is clean with -D warnings"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "cargo_fmt_check_clean",
      "status": "pass",
      "evidence": "clippy gate: cargo fmt --check is clean"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "lints_fixed_not_silenced_without_reason",
      "status": "pass",
      "evidence": "clippy gate: lints are fixed, not silenced without reason"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "crates_split_only_at_real_boundaries",
      "status": "pass",
      "evidence": "workspaces: crates are split only when boundaries are real"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "feature_flags_kept_minimal_no_default_bloat",
      "status": "pass",
      "evidence": "workspaces: feature flags are kept minimal — no default bloat"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "cargo_audit_run",
      "status": "pass",
      "evidence": "supply chain: cargo audit is run"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "msrv_pinned",
      "status": "pass",
      "evidence": "supply chain: the MSRV is pinned"
    },
    {
      "section": "tooling_workspace_and_supply_chain",
      "check": "new_crates_reviewed_before_adoption",
      "status": "pass",
      "evidence": "supply chain: new crates are reviewed before adoption"
    },
    {
      "section": "red_lines",
      "check": "no_blocking_work_inside_async",
      "status": "fail",
      "evidence": "red line: no blocking work inside the async runtime is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unbounded_channels",
      "status": "pass",
      "evidence": "red line: no unbounded channels are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_spawn_loops_without_backpressure",
      "status": "pass",
      "evidence": "red line: no spawn-loops without backpressure are present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "unsafe_blocks_count": 1,
  "unsafe_blocks_without_invariant": [
    "src/lib.rs:42"
  ],
  "unsafe_blocks_without_tests": [],
  "documented_coverage": "0.000000",
  "tested_coverage": "1.000000",
  "duplicate_unsafe_block_locations": [],
  "summary": "34 pass, 3 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "PRODUCTION RUST ENGINEERING PACK\nproject: test-project\nVERDICT: PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY\n  ownership_and_lifetimes                      fail\n  error_handling                               pass\n  unsafe_discipline                            fail\n  async_discipline                             pass\n  testing_and_benchmarks                       pass\n  tooling_workspace_and_supply_chain           pass\n  red_lines                                    fail\n34 pass, 3 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:45:17.342323+00:00 · gateway v1.1.0 · source `verification/work/production-rust-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "malformed-project",
  "ownership": {
    "borrow_before_cloning_practised": "not-a-boolean"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "ownership.borrow_before_cloning_practised",
  "detail": "ownership.borrow_before_cloning_practised must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared production Rust engineering record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a compiler, a linter, a code review of actual Rust source or a guarantee that the code is memory-safe or correct, SERVICE.md's U-13 screen states its output could not read as regulated professional advice (no APEGA engineering-practice, financial or securities advice, and nothing psychology-adjacent), and it verifies no live fact. |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`unsafe_blocks_count`, the two row-name lists, the duplicate-location list and the two coverage ratios) |
| Input reference typed | Yes — 48 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/production-rust-engineering-pack/evidence.json` |
