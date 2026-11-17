# Strict TypeScript engineering pack — documentation

**Strict TypeScript engineering pack** · slug `strict-typescript-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared strict TypeScript engineering record for completeness and consistency only. It surfaces two faces: REST `POST /v1/strict-typescript-engineering-pack` and MCP `POST /mcp/strict-typescript-engineering-pack`, tool name `strict_typescript_engineering_pack`. It compiles no TypeScript, runs no tsc, and inspects no repository — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/strict-typescript-engineering-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "strict-typescript-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the strict TypeScript engineering manifest.** You declare a strict TypeScript engineering record for one TypeScript codebase, made from the codebase's actual practice — the atom audits the declared record, it does not inspect any code (see Explanation). The recorded full-pass manifest declares the project `test-project`: all four tsconfig flags `true` (`strict` true, `noUncheckedIndexedAccess` enabled, `tsc --noEmit` in the development loop, and `tsc --noEmit` clean under strict); all four typing flags `true` (`unknown` used and narrowed instead of `any`, no `any` in `src/`, casts avoided or remaining justified, and non-null assertion chains absent); both boundary-validation flags `true` (external input validated with a schema, and parse-not-trust at the edges); one boundary `api-boundary` declaring `schema_validated` and `schema_tested` both `true`; all three state-modelling flags `true` (discriminated unions for status machines, exhaustive switch with a `never` check, and illegal states unrepresentable by design); all three module-structure flags `true` (small files kept, deep imports preferred over barrel files, and explicit public surfaces); one module `auth-module` declaring `any_free` and `explicit_public_surface` both `true`; all four async flags `true` (all promises awaited or handled, no floating promises, a promise-handling lint rule enabled, and `AbortController` for cancellable work); all three testing flags `true` (unit tests for logic with vitest, integration tests at module edges, and types tested by compilation); all four build-tooling flags `true` (tsc for types and a bundler for bundling, source maps enabled, dependencies pinned, and lint clean); and all four red-line flags `false` (no `ts-ignore`/`ts-expect-error` without a tracked reason, no unvalidated runtime shapes assumed, no `any` in `src/`, and no floating promises).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/strict-typescript-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `STRICT_TYPESCRIPT_ENGINEERING_PACK_READY`: "39 pass, 0 fail, 0 missing of 39 checks across eight sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `boundaries_count` is 1 and `modules_count` is 1, and `strict_flag_coverage`, `schema_validation_coverage`, `schema_test_coverage`, `any_free_coverage` and `explicit_public_surface_coverage` are each `"1.000000"`, with every row-name list and both duplicate lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "strict-typescript-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/strict-typescript-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/strict-typescript-engineering-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `strict_typescript_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_ts_boundary_schema_validated`, `every_ts_boundary_schema_tested`, `every_ts_module_any_free` and `every_ts_module_explicit_public_surface`, and the summary reads "35 pass, 4 fail, 0 missing of 39 checks across eight sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `boundaries[0].schema_validated` and `boundaries[0].schema_tested` are declared `false`, failing `every_ts_boundary_schema_validated` and `every_ts_boundary_schema_tested`, with `boundaries_without_schema_validation` and `boundaries_without_schema_tests` each naming `["api-boundary"]` and `schema_validation_coverage` and `schema_test_coverage` each `"0.000000"`; and `modules[0].any_free` and `modules[0].explicit_public_surface` are declared `false`, failing `every_ts_module_any_free` and `every_ts_module_explicit_public_surface`, with `modules_not_any_free` and `modules_without_explicit_public_surface` each naming `["auth-module"]` and `any_free_coverage` and `explicit_public_surface_coverage` each `"0.000000"`; `strict_flag_coverage` remains `"1.000000"`, `boundaries_count` and `modules_count` are each 1, both duplicate lists are `[]`, sections `typed_boundaries_and_schema_validation` and `module_structure_and_declared_modules` report `fail`, the other six sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tsconfig",
  "detail": "tsconfig must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3; its recorded input declares `tsconfig` as the string `"not-an-object"`.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/strict-typescript-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/strict-typescript-engineering-pack` — tool name `strict_typescript_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `strict_typescript_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the row `name` fields are noted as strings, and `boundaries` and `modules` as lists there. Where SERVICE.md states no type — the section container objects (`tsconfig`, `typing`, `boundary_validation`, `state_modelling`, `module_structure`, `async_practices`, `testing`, `build_tooling`, `red_lines`) and the boundary- and module-row objects (`boundaries[]`, `modules[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `boundaries` and `modules` lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `boundaries` and `modules` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: strict_tsconfig_and_compiler_gate

| Field | Type | Notes |
|---|---|---|
| `tsconfig` | object | The tsconfig section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tsconfig.strict_true_enabled` | boolean | — |
| `tsconfig.no_unchecked_indexed_access_enabled` | boolean | — |
| `tsconfig.tsc_no_emit_in_development_loop` | boolean | — |
| `tsconfig.tsc_no_emit_clean_under_strict` | boolean | — |

#### Read by: typing_discipline_no_any

| Field | Type | Notes |
|---|---|---|
| `typing` | object | The typing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `typing.unknown_used_and_narrowed_instead_of_any` | boolean | — |
| `typing.no_any_in_src` | boolean | — |
| `typing.casts_avoided_or_remaining_justified` | boolean | — |
| `typing.non_null_assertion_chains_absent` | boolean | — |

#### Read by: typed_boundaries_and_schema_validation

| Field | Type | Notes |
|---|---|---|
| `boundary_validation` | object | The boundary-validation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `boundary_validation.external_input_validated_with_schema` | boolean | — |
| `boundary_validation.parse_not_trust_at_edges` | boolean | — |
| `boundaries` | list | list of boundary-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `boundaries[]` | object | One declared boundary row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `boundaries[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `boundaries[].schema_validated` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `boundaries[].schema_tested` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: state_modelling_with_discriminated_unions

| Field | Type | Notes |
|---|---|---|
| `state_modelling` | object | The state-modelling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `state_modelling.discriminated_unions_for_status_machines` | boolean | — |
| `state_modelling.exhaustive_switch_with_never_check` | boolean | — |
| `state_modelling.illegal_states_unrepresentable_by_design` | boolean | — |

#### Read by: module_structure_and_declared_modules

| Field | Type | Notes |
|---|---|---|
| `module_structure` | object | The module-structure section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `module_structure.small_files_kept` | boolean | — |
| `module_structure.deep_imports_preferred_over_barrel_files` | boolean | — |
| `module_structure.explicit_public_surfaces` | boolean | — |
| `modules` | list | list of module-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `modules[]` | object | One declared module row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `modules[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `modules[].any_free` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `modules[].explicit_public_surface` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: async_and_cancellation_discipline

| Field | Type | Notes |
|---|---|---|
| `async_practices` | object | The async-practices section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `async_practices.all_promises_awaited_or_handled` | boolean | — |
| `async_practices.no_floating_promises` | boolean | — |
| `async_practices.promise_handling_lint_rule_enabled` | boolean | — |
| `async_practices.abort_controller_for_cancellable_work` | boolean | — |

#### Read by: tests_build_and_tooling

This recorded section reads two input objects, `testing` and `build_tooling` (see Discrepancies).

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.unit_tests_for_logic_with_vitest` | boolean | — |
| `testing.integration_tests_at_module_edges` | boolean | — |
| `testing.types_tested_by_compilation` | boolean | — |
| `build_tooling` | object | The build-tooling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `build_tooling.tsc_for_types_and_bundler_for_bundling` | boolean | — |
| `build_tooling.source_maps_enabled` | boolean | — |
| `build_tooling.dependencies_pinned` | boolean | — |
| `build_tooling.lint_clean` | boolean | — |

#### Read by: typescript_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.ts_ignore_or_ts_expect_error_without_tracked_reason_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unvalidated_runtime_shapes_assumed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.any_in_src_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.floating_promises_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 39 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: strict_tsconfig_and_compiler_gate

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_strict_true_enabled` | strict tsconfig: strict mode is always on - the tsconfig declares strict true | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_no_unchecked_indexed_access_enabled` | strict tsconfig: noUncheckedIndexedAccess is enabled alongside strict | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_tsc_no_emit_in_loop` | strict tsconfig: tsc --noEmit runs in the development loop | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_tsc_no_emit_clean_under_strict` | quality gate: tsc --noEmit is clean under strict | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: typing_discipline_no_any

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_unknown_narrowed_instead_of_any` | typing discipline: unknown is used and narrowed instead of any | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_src_declared_any_free` | typing discipline: no any appears in src | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_casts_avoided_or_justified` | typing discipline: as casts are avoided, and any that remain are justified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_non_null_assertion_chains_absent` | typing discipline: no non-null assertion chains are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: typed_boundaries_and_schema_validation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_external_input_schema_validated` | typed boundaries: external input - API, storage, env - is validated with a schema such as zod or valibot | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_boundaries_parse_not_trust` | typed boundaries: boundaries parse rather than trust - validate at the edges and trust the compiler inside | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_boundaries_declared` | the declared record names its boundaries - the boundaries list is present; an empty list declares that the codebase has no external boundaries | Computed over the declared record. Pass: the `boundaries` list is present — an empty list passes, because it declares that the codebase has no external boundaries. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_ts_boundary_schema_validated` | boundaries: every declared boundary row declares schema validation | Computed over the declared record. Pass: every declared boundary row declares `schema_validated` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending boundaries are named in `boundaries_without_schema_validation`). Missing: the list is absent, or a row has the field absent. |
| `every_ts_boundary_schema_tested` | boundaries: every declared boundary row declares its schema is tested | Computed over the declared record. Pass: every declared boundary row declares `schema_tested` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending boundaries are named in `boundaries_without_schema_tests`). Missing: the list is absent, or a row has the field absent. |
| `no_ts_boundary_name_duplicated` | boundaries: no declared boundary name is owned by more than one row | Computed over the declared record. Pass: no declared boundary `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_boundary_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |

#### Section: state_modelling_with_discriminated_unions

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_status_machines_as_discriminated_unions` | state modelling: status machines are modelled as discriminated unions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_exhaustive_switch_never_check` | state modelling: switches are exhaustive with a never check | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_illegal_states_unrepresentable` | state modelling: illegal states are made unrepresentable by the type design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: module_structure_and_declared_modules

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_small_module_files_kept` | modules: module files are kept small | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_deep_imports_over_cycle_hiding_barrels` | modules: deep imports are preferred over barrel files that hide cycles | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_explicit_public_surfaces_declared` | modules: public surfaces are explicit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_modules_declared` | the declared record names its modules - the modules list is present; an empty list declares no module rows | Computed over the declared record. Pass: the `modules` list is present — an empty list passes, because it declares no module rows. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_ts_module_any_free` | modules: every declared module row declares it is any-free | Computed over the declared record. Pass: every declared module row declares `any_free` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending modules are named in `modules_not_any_free`). Missing: the list is absent, or a row has the field absent. |
| `every_ts_module_explicit_public_surface` | modules: every declared module row declares an explicit public surface | Computed over the declared record. Pass: every declared module row declares `explicit_public_surface` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending modules are named in `modules_without_explicit_public_surface`). Missing: the list is absent, or a row has the field absent. |
| `no_ts_module_name_duplicated` | modules: no declared module name is owned by more than one row | Computed over the declared record. Pass: no declared module `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_module_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |

#### Section: async_and_cancellation_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_all_promises_awaited_or_handled` | async: all promises are awaited or handled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_no_floating_promises_declared` | async: no floating promises are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_promise_handling_lint_rule_enabled` | async: a lint rule enforces that promises are awaited or handled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_abort_controller_for_cancellable_work` | async: AbortController is used for cancellable work | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: tests_build_and_tooling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_logic_unit_tested_with_vitest` | tests: unit tests for logic run under vitest | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_module_edge_integration_tested` | tests: integration tests run at the module edges | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_types_tested_by_compilation` | tests: types are tested by compilation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_tsc_for_types_bundler_for_bundling` | build: tsc is used for types and esbuild or vite for bundling | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_source_maps_enabled` | build: source maps are on | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_dependencies_pinned_for_build` | build: dependencies are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ts_lint_clean_declared` | quality gate: lint is clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: typescript_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ts_no_untracked_ts_ignore_or_expect_error` | red line: no ts-ignore or ts-expect-error without a tracked reason is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ts_no_unvalidated_runtime_shape_assumption` | red line: no runtime shapes assumed that were not validated are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ts_red_line_any_absent_from_src` | red line: no any in src is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ts_red_line_floating_promises_absent` | red line: no floating promises are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"strict-typescript-engineering-pack"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `boundaries_count` and `modules_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `boundaries_without_schema_validation`, `boundaries_without_schema_tests`, `modules_not_any_free` and `modules_without_explicit_public_surface` (rows whose field is present but not true; a row with the field absent is missing evidence and does not appear; each null when its list is not declared, as recorded in the sparse case) and `duplicate_boundary_names` and `duplicate_module_names` (names declared on more than one row, in the order their second occurrence appears; each null when its list is not declared, as recorded in the sparse case); and the ratios `strict_flag_coverage` (the two skill-named strict flags declared true ÷ the two flags, counted only when both are declared), `schema_validation_coverage` (boundaries declaring schema validation ÷ declared boundaries), `schema_test_coverage` (boundaries declaring schema testing ÷ declared boundaries), `any_free_coverage` (modules declaring any-free ÷ declared modules) and `explicit_public_surface_coverage` (modules declaring an explicit public surface ÷ declared modules) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and `strict_flag_coverage` is null when either named flag is absent. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "39 pass, 0 fail, 0 missing of 39 checks across eight sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `STRICT_TYPESCRIPT_ENGINEERING_PACK_READY` — all 39 checks pass: the declared strict TypeScript engineering record is complete and consistent with the bound skill's checklist and red lines.
- `STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the eight primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `boundaries_count`, `modules_count`, `boundaries_without_schema_validation`, `boundaries_without_schema_tests`, `modules_not_any_free`, `modules_without_explicit_public_surface`, `duplicate_boundary_names`, `duplicate_module_names`, `strict_flag_coverage`, `schema_validation_coverage`, `schema_test_coverage`, `any_free_coverage`, `explicit_public_surface_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"tsconfig","detail":"tsconfig must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write production TypeScript — strict mode, no any, typed boundaries with schemas, small honest modules (the bound capability, from the skill). You submit one declared record — the strict TypeScript engineering manifest, made from the codebase's actual practice — and the atom audits that record for completeness and internal consistency against the bound skill's strict TypeScript practice and red lines, returning one deterministic verdict across 8 sections (`strict_tsconfig_and_compiler_gate`, `typing_discipline_no_any`, `typed_boundaries_and_schema_validation`, `state_modelling_with_discriminated_unions`, `module_structure_and_declared_modules`, `async_and_cancellation_discipline`, `tests_build_and_tooling`, `typescript_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom's ground is TypeScript-specific strictness and typing discipline, and it shares zero checks with its siblings (SERVICE.md, Distinct ground); it asks TypeScript-only questions — tsconfig strictness, `any` vs `unknown`, casts, non-null assertions, schema-typed boundaries, discriminated unions with a `never` check — that the Python, Rust, plain JavaScript, C and C++ atoms do not ask.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared boundary and module rows themselves and the declared tsconfig flags — the `boundaries` list must be present (an empty list passes), every declared boundary row must declare `schema_validated` and `schema_tested` both `true`, no declared boundary `name` may appear on more than one row, the `modules` list must be present under the same rules, every declared module row must declare `any_free` and `explicit_public_surface` both `true`, no declared module `name` may appear on more than one row, and strict-flag coverage counts the two skill-named strict flags when both are declared (reported only; the bar is the two boolean checks themselves) — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `STRICT_TYPESCRIPT_ENGINEERING_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set. Declined, named: a strict-flag set beyond the two flags the skill itself names (`strict` and `noUncheckedIndexedAccess`) — no additional tsconfig flag (for example `exactOptionalPropertyTypes` or `noImplicitOverride`) is required or counted; a maximum file size or line count for what counts as a "small" module file; a maximum number of justified `as` casts, a cast rate, or a non-null-assertion count beyond the declared absence of `!` chains; a module count, a boundary count, or a dependency count; a test coverage percentage, a test count, or a test-duration limit; a bundle-size budget or a build-time limit; a mandated schema library (zod and valibot are the skill's examples — only that schema validation is declared and tested is checked, never which library); a named lint rule or a lint-warning count beyond lint being declared clean and a promise-handling rule being declared enabled; a cancellation latency or an `AbortController` adoption percentage beyond its use for cancellable work being declared. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** strict TypeScript engineering record: a verdict of `STRICT_TYPESCRIPT_ENGINEERING_PACK_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares `strict: true`, no `any` and every boundary schema-tested passes those checks even if the real codebase did none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not a compiler, a type checker, a code review, or a guarantee that the code is type-safe or correct**. Specifically: it compiles no TypeScript and compiles nothing itself, runs no tsc, vitest, linter or bundler, inspects no repository or source file, runs no test, and does not verify that declared practice was ever carried out. It never judges whether a declared schema actually matches the real runtime shape, whether a discriminated union actually models the real states well, or whether a justified cast is actually sound — only that the record contains what the skill's strict TypeScript practice demands, and that its declared boundary and module rows are internally consistent. Named exclusions: the skill's write-my-code steps are excluded by name — converting JavaScript to TypeScript, writing or rewriting any TypeScript code, authoring a tsconfig, writing a zod/valibot schema, designing a discriminated union for a caller's state machine, refactoring modules or barrel files, fixing a floating promise, and migrating a JS project to TS are never performed or emitted; the atom only checks declared presence/consistency and refuses the skill's anti-patterns as red-line declarations; no numeric thresholds at all (the skill states none — see the declined list above); no live verification of any declared fact; no judgment of practice *quality* — whether the strictness, typing or module design is adequate for the real codebase is the caller's declaration, checked only for declared presence and consistency.

**Buyer and use context.** Teams and agents working in Engineering & code — frontend, Node services and tooling codebases — who need a strict-TypeScript discipline verdict on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Frontend and tooling builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) screen-NO — flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom's output could not read as regulated professional advice — it audits a declared software-engineering record for completeness and consistency against a strict TypeScript practice skill; it offers no engineering-practice advice in the APEGA sense (no design, stamping, or safety judgment over physical systems), no financial or securities advice, and nothing psychology-adjacent. Its subject is software practice only, the same class as the software-engineering titles that stayed live at the census pending the owner's review. The named controls, exactly as SERVICE.md records them: (1) declared-record audit only — the atom audits the record the caller declares, never inspects real code and never verifies practice; (2) advice-shaped and write-my-code skill steps are excluded as red lines / named exclusions — the skill's prescriptive moves (how to convert JS to TS, how to model a state machine, how to write a schema) are never emitted as advice or code; the atom only checks declared presence/consistency and refuses the skill's anti-patterns as red-line declarations; (3) no numeric threshold is invented — every bar is the skill's own stated rule or completeness over the caller's declared rows. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `strict_typescript_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/strict_typescript_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_strict_typescript_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/strict-typescript-engineering-pack` (REST) and `POST /mcp/strict-typescript-engineering-pack` (MCP, tool `strict_typescript_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `strict_typescript_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** every recorded check name differs from the leaf name of the input field it reads — most by a `ts_` prefix or a rewording, the computed checks by construction. In `strict_tsconfig_and_compiler_gate`: `ts_strict_true_enabled` (input `tsconfig.strict_true_enabled`), `ts_no_unchecked_indexed_access_enabled` (input `tsconfig.no_unchecked_indexed_access_enabled`), `ts_tsc_no_emit_in_loop` (input `tsconfig.tsc_no_emit_in_development_loop`) and `ts_tsc_no_emit_clean_under_strict` (input `tsconfig.tsc_no_emit_clean_under_strict`). In `typing_discipline_no_any`: `ts_unknown_narrowed_instead_of_any` (input `typing.unknown_used_and_narrowed_instead_of_any`), `ts_src_declared_any_free` (input `typing.no_any_in_src`), `ts_casts_avoided_or_justified` (input `typing.casts_avoided_or_remaining_justified`) and `ts_non_null_assertion_chains_absent` (input `typing.non_null_assertion_chains_absent`). In `typed_boundaries_and_schema_validation`: `ts_external_input_schema_validated` (input `boundary_validation.external_input_validated_with_schema`), `ts_boundaries_parse_not_trust` (input `boundary_validation.parse_not_trust_at_edges`), `ts_boundaries_declared` (the `boundaries` list), `every_ts_boundary_schema_validated` (rows' `schema_validated`), `every_ts_boundary_schema_tested` (rows' `schema_tested`) and `no_ts_boundary_name_duplicated` (rows' `name`). In `state_modelling_with_discriminated_unions`: `ts_status_machines_as_discriminated_unions` (input `state_modelling.discriminated_unions_for_status_machines`), `ts_exhaustive_switch_never_check` (input `state_modelling.exhaustive_switch_with_never_check`) and `ts_illegal_states_unrepresentable` (input `state_modelling.illegal_states_unrepresentable_by_design`). In `module_structure_and_declared_modules`: `ts_small_module_files_kept` (input `module_structure.small_files_kept`), `ts_deep_imports_over_cycle_hiding_barrels` (input `module_structure.deep_imports_preferred_over_barrel_files`), `ts_explicit_public_surfaces_declared` (input `module_structure.explicit_public_surfaces`), `ts_modules_declared` (the `modules` list), `every_ts_module_any_free` (rows' `any_free`), `every_ts_module_explicit_public_surface` (rows' `explicit_public_surface`) and `no_ts_module_name_duplicated` (rows' `name`). In `async_and_cancellation_discipline`: `ts_all_promises_awaited_or_handled` (input `async_practices.all_promises_awaited_or_handled`), `ts_no_floating_promises_declared` (input `async_practices.no_floating_promises`), `ts_promise_handling_lint_rule_enabled` (input `async_practices.promise_handling_lint_rule_enabled`) and `ts_abort_controller_for_cancellable_work` (input `async_practices.abort_controller_for_cancellable_work`). In `tests_build_and_tooling`: `ts_logic_unit_tested_with_vitest` (input `testing.unit_tests_for_logic_with_vitest`), `ts_module_edge_integration_tested` (input `testing.integration_tests_at_module_edges`), `ts_types_tested_by_compilation` (input `testing.types_tested_by_compilation`), `ts_tsc_for_types_bundler_for_bundling` (input `build_tooling.tsc_for_types_and_bundler_for_bundling`), `ts_source_maps_enabled` (input `build_tooling.source_maps_enabled`), `ts_dependencies_pinned_for_build` (input `build_tooling.dependencies_pinned`) and `ts_lint_clean_declared` (input `build_tooling.lint_clean`). In `typescript_red_lines`: `ts_no_untracked_ts_ignore_or_expect_error` (input `red_lines.ts_ignore_or_ts_expect_error_without_tracked_reason_present`), `ts_no_unvalidated_runtime_shape_assumption` (input `red_lines.unvalidated_runtime_shapes_assumed_present`), `ts_red_line_any_absent_from_src` (input `red_lines.any_in_src_present`) and `ts_red_line_floating_promises_absent` (input `red_lines.floating_promises_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`tsconfig`, `typing`, `boundary_validation`, `state_modelling`, `module_structure`, `async_practices`, `testing`, `build_tooling`, `red_lines`) or for a row object (`boundaries[]`, `modules[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `boundaries` and `modules` lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 39 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `boundaries_count`, `modules_count` and the coverage ratios, but does not state a null rule for the row-name lists `boundaries_without_schema_validation`, `boundaries_without_schema_tests`, `modules_not_any_free` and `modules_without_explicit_public_surface`, nor for `duplicate_boundary_names` and `duplicate_module_names`. The recorded sparse response returns all six as `null` when their list is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** three recorded sections each merge two separate input objects — `boundary_validation` and `boundaries` inputs are both read by the single recorded section `typed_boundaries_and_schema_validation`; `module_structure` and `modules` inputs are both read by the single recorded section `module_structure_and_declared_modules`; and `testing` and `build_tooling` inputs are both read by the single recorded section `tests_build_and_tooling`. The other five recorded sections map one-to-one onto their input objects (`tsconfig` → `strict_tsconfig_and_compiler_gate`, `typing` → `typing_discipline_no_any`, `state_modelling` → `state_modelling_with_discriminated_unions`, `async_practices` → `async_and_cancellation_discipline`, `red_lines` → `typescript_red_lines`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (4 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named the section names `typed_boundaries_and_schema_validation` and `module_structure_and_declared_modules` instead of exact check names (R1 ×2); and the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
8. **DeepSeek check-count adjudication (recorded in TEST-REPORT.md):** the second tester DeepSeek returned "AGREEMENT: partial", claiming the artifact's summary (39 checks) was inconsistent with a `checks` array it counted as 38. The coordinator's direct recount of the recorded evidence found exactly 39 entries (per section: strict_tsconfig_and_compiler_gate 4, typing_discipline_no_any 4, typed_boundaries_and_schema_validation 6, state_modelling_with_discriminated_unions 3, module_structure_and_declared_modules 7, async_and_cancellation_discipline 4, tests_build_and_tooling 7, typescript_red_lines 4 = 39; DeepSeek counted the module-structure section as 6 instead of 7), so agreement is full in substance on every recomputed quantity. This document follows the recorded responses: 39 checks.

## Worked examples

Provenance: recorded 2026-11-16T12:27:03.421012+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/strict-typescript-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:27:03.421012+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/strict-typescript-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "tsconfig": {
    "strict_true_enabled": true,
    "no_unchecked_indexed_access_enabled": true,
    "tsc_no_emit_in_development_loop": true,
    "tsc_no_emit_clean_under_strict": true
  },
  "typing": {
    "unknown_used_and_narrowed_instead_of_any": true,
    "no_any_in_src": true,
    "casts_avoided_or_remaining_justified": true,
    "non_null_assertion_chains_absent": true
  },
  "boundary_validation": {
    "external_input_validated_with_schema": true,
    "parse_not_trust_at_edges": true
  },
  "boundaries": [
    {
      "name": "api-boundary",
      "schema_validated": true,
      "schema_tested": true
    }
  ],
  "state_modelling": {
    "discriminated_unions_for_status_machines": true,
    "exhaustive_switch_with_never_check": true,
    "illegal_states_unrepresentable_by_design": true
  },
  "module_structure": {
    "small_files_kept": true,
    "deep_imports_preferred_over_barrel_files": true,
    "explicit_public_surfaces": true
  },
  "modules": [
    {
      "name": "auth-module",
      "any_free": true,
      "explicit_public_surface": true
    }
  ],
  "async_practices": {
    "all_promises_awaited_or_handled": true,
    "no_floating_promises": true,
    "promise_handling_lint_rule_enabled": true,
    "abort_controller_for_cancellable_work": true
  },
  "testing": {
    "unit_tests_for_logic_with_vitest": true,
    "integration_tests_at_module_edges": true,
    "types_tested_by_compilation": true
  },
  "build_tooling": {
    "tsc_for_types_and_bundler_for_bundling": true,
    "source_maps_enabled": true,
    "dependencies_pinned": true,
    "lint_clean": true
  },
  "red_lines": {
    "ts_ignore_or_ts_expect_error_without_tracked_reason_present": false,
    "unvalidated_runtime_shapes_assumed_present": false,
    "any_in_src_present": false,
    "floating_promises_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "strict-typescript-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY",
  "sections": {
    "strict_tsconfig_and_compiler_gate": "pass",
    "typing_discipline_no_any": "pass",
    "typed_boundaries_and_schema_validation": "pass",
    "state_modelling_with_discriminated_unions": "pass",
    "module_structure_and_declared_modules": "pass",
    "async_and_cancellation_discipline": "pass",
    "tests_build_and_tooling": "pass",
    "typescript_red_lines": "pass"
  },
  "checks": [
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_strict_true_enabled",
      "status": "pass",
      "evidence": "strict tsconfig: strict mode is always on - the tsconfig declares strict true"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_no_unchecked_indexed_access_enabled",
      "status": "pass",
      "evidence": "strict tsconfig: noUncheckedIndexedAccess is enabled alongside strict"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_tsc_no_emit_in_loop",
      "status": "pass",
      "evidence": "strict tsconfig: tsc --noEmit runs in the development loop"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_tsc_no_emit_clean_under_strict",
      "status": "pass",
      "evidence": "quality gate: tsc --noEmit is clean under strict"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_unknown_narrowed_instead_of_any",
      "status": "pass",
      "evidence": "typing discipline: unknown is used and narrowed instead of any"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_src_declared_any_free",
      "status": "pass",
      "evidence": "typing discipline: no any appears in src"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_casts_avoided_or_justified",
      "status": "pass",
      "evidence": "typing discipline: as casts are avoided, and any that remain are justified"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_non_null_assertion_chains_absent",
      "status": "pass",
      "evidence": "typing discipline: no non-null assertion chains are used"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_external_input_schema_validated",
      "status": "pass",
      "evidence": "typed boundaries: external input - API, storage, env - is validated with a schema such as zod or valibot"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_boundaries_parse_not_trust",
      "status": "pass",
      "evidence": "typed boundaries: boundaries parse rather than trust - validate at the edges and trust the compiler inside"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_boundaries_declared",
      "status": "pass",
      "evidence": "the declared record names its boundaries - the boundaries list is present; an empty list declares that the codebase has no external boundaries"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "every_ts_boundary_schema_validated",
      "status": "pass",
      "evidence": "boundaries: every declared boundary row declares schema validation"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "every_ts_boundary_schema_tested",
      "status": "pass",
      "evidence": "boundaries: every declared boundary row declares its schema is tested"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "no_ts_boundary_name_duplicated",
      "status": "pass",
      "evidence": "boundaries: no declared boundary name is owned by more than one row"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_status_machines_as_discriminated_unions",
      "status": "pass",
      "evidence": "state modelling: status machines are modelled as discriminated unions"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_exhaustive_switch_never_check",
      "status": "pass",
      "evidence": "state modelling: switches are exhaustive with a never check"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_illegal_states_unrepresentable",
      "status": "pass",
      "evidence": "state modelling: illegal states are made unrepresentable by the type design"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_small_module_files_kept",
      "status": "pass",
      "evidence": "modules: module files are kept small"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_deep_imports_over_cycle_hiding_barrels",
      "status": "pass",
      "evidence": "modules: deep imports are preferred over barrel files that hide cycles"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_explicit_public_surfaces_declared",
      "status": "pass",
      "evidence": "modules: public surfaces are explicit"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_modules_declared",
      "status": "pass",
      "evidence": "the declared record names its modules - the modules list is present; an empty list declares no module rows"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "every_ts_module_any_free",
      "status": "pass",
      "evidence": "modules: every declared module row declares it is any-free"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "every_ts_module_explicit_public_surface",
      "status": "pass",
      "evidence": "modules: every declared module row declares an explicit public surface"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "no_ts_module_name_duplicated",
      "status": "pass",
      "evidence": "modules: no declared module name is owned by more than one row"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_all_promises_awaited_or_handled",
      "status": "pass",
      "evidence": "async: all promises are awaited or handled"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_no_floating_promises_declared",
      "status": "pass",
      "evidence": "async: no floating promises are present"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_promise_handling_lint_rule_enabled",
      "status": "pass",
      "evidence": "async: a lint rule enforces that promises are awaited or handled"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_abort_controller_for_cancellable_work",
      "status": "pass",
      "evidence": "async: AbortController is used for cancellable work"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_logic_unit_tested_with_vitest",
      "status": "pass",
      "evidence": "tests: unit tests for logic run under vitest"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_module_edge_integration_tested",
      "status": "pass",
      "evidence": "tests: integration tests run at the module edges"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_types_tested_by_compilation",
      "status": "pass",
      "evidence": "tests: types are tested by compilation"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_tsc_for_types_bundler_for_bundling",
      "status": "pass",
      "evidence": "build: tsc is used for types and esbuild or vite for bundling"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_source_maps_enabled",
      "status": "pass",
      "evidence": "build: source maps are on"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_dependencies_pinned_for_build",
      "status": "pass",
      "evidence": "build: dependencies are pinned"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_lint_clean_declared",
      "status": "pass",
      "evidence": "quality gate: lint is clean"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_no_untracked_ts_ignore_or_expect_error",
      "status": "pass",
      "evidence": "red line: no ts-ignore or ts-expect-error without a tracked reason is present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_no_unvalidated_runtime_shape_assumption",
      "status": "pass",
      "evidence": "red line: no runtime shapes assumed that were not validated are present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_red_line_any_absent_from_src",
      "status": "pass",
      "evidence": "red line: no any in src is present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_red_line_floating_promises_absent",
      "status": "pass",
      "evidence": "red line: no floating promises are present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "boundaries_count": 1,
  "modules_count": 1,
  "boundaries_without_schema_validation": [],
  "boundaries_without_schema_tests": [],
  "modules_not_any_free": [],
  "modules_without_explicit_public_surface": [],
  "strict_flag_coverage": "1.000000",
  "schema_validation_coverage": "1.000000",
  "schema_test_coverage": "1.000000",
  "any_free_coverage": "1.000000",
  "explicit_public_surface_coverage": "1.000000",
  "duplicate_boundary_names": [],
  "duplicate_module_names": [],
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across eight sections.",
  "stamp": "STRICT TYPESCRIPT ENGINEERING PACK\nproject: test-project\nVERDICT: STRICT_TYPESCRIPT_ENGINEERING_PACK_READY\n  strict_tsconfig_and_compiler_gate            pass\n  typing_discipline_no_any                     pass\n  typed_boundaries_and_schema_validation       pass\n  state_modelling_with_discriminated_unions    pass\n  module_structure_and_declared_modules        pass\n  async_and_cancellation_discipline            pass\n  tests_build_and_tooling                      pass\n  typescript_red_lines                         pass\n39 pass, 0 fail, 0 missing of 39 checks across eight sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:27:03.421012+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/strict-typescript-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "tsconfig": {
    "strict_true_enabled": true,
    "no_unchecked_indexed_access_enabled": true,
    "tsc_no_emit_in_development_loop": true,
    "tsc_no_emit_clean_under_strict": true
  },
  "typing": {
    "unknown_used_and_narrowed_instead_of_any": true,
    "no_any_in_src": true,
    "casts_avoided_or_remaining_justified": true,
    "non_null_assertion_chains_absent": true
  },
  "boundary_validation": {
    "external_input_validated_with_schema": true,
    "parse_not_trust_at_edges": true
  },
  "boundaries": [
    {
      "name": "api-boundary",
      "schema_validated": false,
      "schema_tested": false
    }
  ],
  "state_modelling": {
    "discriminated_unions_for_status_machines": true,
    "exhaustive_switch_with_never_check": true,
    "illegal_states_unrepresentable_by_design": true
  },
  "module_structure": {
    "small_files_kept": true,
    "deep_imports_preferred_over_barrel_files": true,
    "explicit_public_surfaces": true
  },
  "modules": [
    {
      "name": "auth-module",
      "any_free": false,
      "explicit_public_surface": false
    }
  ],
  "async_practices": {
    "all_promises_awaited_or_handled": true,
    "no_floating_promises": true,
    "promise_handling_lint_rule_enabled": true,
    "abort_controller_for_cancellable_work": true
  },
  "testing": {
    "unit_tests_for_logic_with_vitest": true,
    "integration_tests_at_module_edges": true,
    "types_tested_by_compilation": true
  },
  "build_tooling": {
    "tsc_for_types_and_bundler_for_bundling": true,
    "source_maps_enabled": true,
    "dependencies_pinned": true,
    "lint_clean": true
  },
  "red_lines": {
    "ts_ignore_or_ts_expect_error_without_tracked_reason_present": false,
    "unvalidated_runtime_shapes_assumed_present": false,
    "any_in_src_present": false,
    "floating_promises_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "strict-typescript-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY",
  "sections": {
    "strict_tsconfig_and_compiler_gate": "pass",
    "typing_discipline_no_any": "pass",
    "typed_boundaries_and_schema_validation": "fail",
    "state_modelling_with_discriminated_unions": "pass",
    "module_structure_and_declared_modules": "fail",
    "async_and_cancellation_discipline": "pass",
    "tests_build_and_tooling": "pass",
    "typescript_red_lines": "pass"
  },
  "checks": [
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_strict_true_enabled",
      "status": "pass",
      "evidence": "strict tsconfig: strict mode is always on - the tsconfig declares strict true"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_no_unchecked_indexed_access_enabled",
      "status": "pass",
      "evidence": "strict tsconfig: noUncheckedIndexedAccess is enabled alongside strict"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_tsc_no_emit_in_loop",
      "status": "pass",
      "evidence": "strict tsconfig: tsc --noEmit runs in the development loop"
    },
    {
      "section": "strict_tsconfig_and_compiler_gate",
      "check": "ts_tsc_no_emit_clean_under_strict",
      "status": "pass",
      "evidence": "quality gate: tsc --noEmit is clean under strict"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_unknown_narrowed_instead_of_any",
      "status": "pass",
      "evidence": "typing discipline: unknown is used and narrowed instead of any"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_src_declared_any_free",
      "status": "pass",
      "evidence": "typing discipline: no any appears in src"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_casts_avoided_or_justified",
      "status": "pass",
      "evidence": "typing discipline: as casts are avoided, and any that remain are justified"
    },
    {
      "section": "typing_discipline_no_any",
      "check": "ts_non_null_assertion_chains_absent",
      "status": "pass",
      "evidence": "typing discipline: no non-null assertion chains are used"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_external_input_schema_validated",
      "status": "pass",
      "evidence": "typed boundaries: external input - API, storage, env - is validated with a schema such as zod or valibot"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_boundaries_parse_not_trust",
      "status": "pass",
      "evidence": "typed boundaries: boundaries parse rather than trust - validate at the edges and trust the compiler inside"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "ts_boundaries_declared",
      "status": "pass",
      "evidence": "the declared record names its boundaries - the boundaries list is present; an empty list declares that the codebase has no external boundaries"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "every_ts_boundary_schema_validated",
      "status": "fail",
      "evidence": "boundaries: every declared boundary row declares schema validation"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "every_ts_boundary_schema_tested",
      "status": "fail",
      "evidence": "boundaries: every declared boundary row declares its schema is tested"
    },
    {
      "section": "typed_boundaries_and_schema_validation",
      "check": "no_ts_boundary_name_duplicated",
      "status": "pass",
      "evidence": "boundaries: no declared boundary name is owned by more than one row"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_status_machines_as_discriminated_unions",
      "status": "pass",
      "evidence": "state modelling: status machines are modelled as discriminated unions"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_exhaustive_switch_never_check",
      "status": "pass",
      "evidence": "state modelling: switches are exhaustive with a never check"
    },
    {
      "section": "state_modelling_with_discriminated_unions",
      "check": "ts_illegal_states_unrepresentable",
      "status": "pass",
      "evidence": "state modelling: illegal states are made unrepresentable by the type design"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_small_module_files_kept",
      "status": "pass",
      "evidence": "modules: module files are kept small"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_deep_imports_over_cycle_hiding_barrels",
      "status": "pass",
      "evidence": "modules: deep imports are preferred over barrel files that hide cycles"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_explicit_public_surfaces_declared",
      "status": "pass",
      "evidence": "modules: public surfaces are explicit"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "ts_modules_declared",
      "status": "pass",
      "evidence": "the declared record names its modules - the modules list is present; an empty list declares no module rows"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "every_ts_module_any_free",
      "status": "fail",
      "evidence": "modules: every declared module row declares it is any-free"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "every_ts_module_explicit_public_surface",
      "status": "fail",
      "evidence": "modules: every declared module row declares an explicit public surface"
    },
    {
      "section": "module_structure_and_declared_modules",
      "check": "no_ts_module_name_duplicated",
      "status": "pass",
      "evidence": "modules: no declared module name is owned by more than one row"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_all_promises_awaited_or_handled",
      "status": "pass",
      "evidence": "async: all promises are awaited or handled"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_no_floating_promises_declared",
      "status": "pass",
      "evidence": "async: no floating promises are present"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_promise_handling_lint_rule_enabled",
      "status": "pass",
      "evidence": "async: a lint rule enforces that promises are awaited or handled"
    },
    {
      "section": "async_and_cancellation_discipline",
      "check": "ts_abort_controller_for_cancellable_work",
      "status": "pass",
      "evidence": "async: AbortController is used for cancellable work"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_logic_unit_tested_with_vitest",
      "status": "pass",
      "evidence": "tests: unit tests for logic run under vitest"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_module_edge_integration_tested",
      "status": "pass",
      "evidence": "tests: integration tests run at the module edges"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_types_tested_by_compilation",
      "status": "pass",
      "evidence": "tests: types are tested by compilation"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_tsc_for_types_bundler_for_bundling",
      "status": "pass",
      "evidence": "build: tsc is used for types and esbuild or vite for bundling"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_source_maps_enabled",
      "status": "pass",
      "evidence": "build: source maps are on"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_dependencies_pinned_for_build",
      "status": "pass",
      "evidence": "build: dependencies are pinned"
    },
    {
      "section": "tests_build_and_tooling",
      "check": "ts_lint_clean_declared",
      "status": "pass",
      "evidence": "quality gate: lint is clean"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_no_untracked_ts_ignore_or_expect_error",
      "status": "pass",
      "evidence": "red line: no ts-ignore or ts-expect-error without a tracked reason is present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_no_unvalidated_runtime_shape_assumption",
      "status": "pass",
      "evidence": "red line: no runtime shapes assumed that were not validated are present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_red_line_any_absent_from_src",
      "status": "pass",
      "evidence": "red line: no any in src is present in the record"
    },
    {
      "section": "typescript_red_lines",
      "check": "ts_red_line_floating_promises_absent",
      "status": "pass",
      "evidence": "red line: no floating promises are present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "boundaries_count": 1,
  "modules_count": 1,
  "boundaries_without_schema_validation": [
    "api-boundary"
  ],
  "boundaries_without_schema_tests": [
    "api-boundary"
  ],
  "modules_not_any_free": [
    "auth-module"
  ],
  "modules_without_explicit_public_surface": [
    "auth-module"
  ],
  "strict_flag_coverage": "1.000000",
  "schema_validation_coverage": "0.000000",
  "schema_test_coverage": "0.000000",
  "any_free_coverage": "0.000000",
  "explicit_public_surface_coverage": "0.000000",
  "duplicate_boundary_names": [],
  "duplicate_module_names": [],
  "summary": "35 pass, 4 fail, 0 missing of 39 checks across eight sections.",
  "stamp": "STRICT TYPESCRIPT ENGINEERING PACK\nproject: test-project\nVERDICT: STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY\n  strict_tsconfig_and_compiler_gate            pass\n  typing_discipline_no_any                     pass\n  typed_boundaries_and_schema_validation       fail\n  state_modelling_with_discriminated_unions    pass\n  module_structure_and_declared_modules        fail\n  async_and_cancellation_discipline            pass\n  tests_build_and_tooling                      pass\n  typescript_red_lines                         pass\n35 pass, 4 fail, 0 missing of 39 checks across eight sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:27:03.421012+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/strict-typescript-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "malformed-project",
  "tsconfig": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "tsconfig",
  "detail": "tsconfig must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) screen-NO — flag-with-controls (census class), with the three named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 39 documented / 39 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`boundaries_count`, `modules_count`, the four row-name lists, `duplicate_boundary_names`, `duplicate_module_names` and the five coverage ratios) |
| Input reference typed | Yes — 51 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/strict-typescript-engineering-pack/evidence.json` |
