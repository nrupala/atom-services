# Strict TypeScript engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You maintain a TypeScript codebase — a frontend, a Node service or tooling — and you keep a declared strict TypeScript engineering record for it, made from the codebase's actual practice. This atom reads one declared manifest and returns one deterministic verdict across eight sections (strict_tsconfig_and_compiler_gate, typing_discipline_no_any, typed_boundaries_and_schema_validation, state_modelling_with_discriminated_unions, module_structure_and_declared_modules, async_and_cancellation_discipline, tests_build_and_tooling, typescript_red_lines): **STRICT_TYPESCRIPT_ENGINEERING_PACK_READY**, **STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 39 checks. It audits the declared record's completeness and internal consistency only — it compiles nothing itself, runs no tsc, vitest, linter or bundler, inspects no repository or source file, and does not verify that declared practice was ever carried out. A codebase is ready *on your declared evidence*: a record that declares `strict: true`, no `any` and every boundary schema-tested passes those checks even if the real codebase did none of it. It is not a compiler, a type checker, a code review, or a guarantee that the code is type-safe or correct: it never judges whether a declared schema actually matches the real runtime shape, whether a discriminated union actually models the real states well, or whether a justified cast is actually sound — only that the record contains what the skill's strict TypeScript practice demands, and that its declared boundary and module rows are internally consistent. The skill's write-my-code steps are excluded by name — converting JavaScript to TypeScript, writing or rewriting any TypeScript code, authoring a tsconfig, writing a zod/valibot schema, designing a discriminated union for your state machine, refactoring modules or barrel files, fixing a floating promise, and migrating a JS project to TS are never performed or emitted; the atom only checks declared presence/consistency and refuses the skill's anti-patterns as red-line declarations. The computed checks: the declared `boundaries` list must be present (an empty list passes — it declares that the codebase has no external boundaries, and the skill requires no boundary); every declared boundary row must declare `schema_validated` true and `schema_tested` true; no boundary `name` may appear on more than one row; the declared `modules` list must be present under the same absent/empty rules; every declared module row must declare `any_free` true and `explicit_public_surface` true; no module `name` may appear on more than one row; and strict-flag coverage counts the two skill-named strict flags (`strict` and `noUncheckedIndexedAccess`) when both are declared — the ratio is reported only, the bar is the two boolean checks themselves. No numeric threshold is imposed — no strict-flag set beyond the two flags the skill itself names (for example `exactOptionalPropertyTypes` or `noImplicitOverride` is neither required nor counted); no maximum file size or line count for what counts as a "small" module file; no maximum number of justified `as` casts, cast rate, or non-null-assertion count beyond the declared absence of `!` chains; no module count, boundary count, or dependency count; no test coverage percentage, test count, or test-duration limit; no bundle-size budget or build-time limit; no mandated schema library (zod and valibot are the skill's examples — only that schema validation is declared and tested is checked, never which library); no named lint rule or lint-warning count beyond lint being declared clean and a promise-handling rule being declared enabled; and no cancellation latency or `AbortController` adoption percentage beyond its use for cancellable work being declared. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "strict-typescript-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/strict-typescript-engineering-pack` — tool name `strict_typescript_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/strict-typescript-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | Project name (string; carried into the verdict output, not itself checked) |
| `tsconfig.strict_true_enabled` | strict tsconfig evidence: `strict` is true in tsconfig |
| `tsconfig.no_unchecked_indexed_access_enabled` | strict tsconfig evidence: `noUncheckedIndexedAccess` is enabled |
| `tsconfig.tsc_no_emit_in_development_loop` | strict tsconfig evidence: `tsc --noEmit` runs in the development loop |
| `tsconfig.tsc_no_emit_clean_under_strict` | strict tsconfig evidence: `tsc --noEmit` is clean under strict |
| `typing.unknown_used_and_narrowed_instead_of_any` | typing evidence: `unknown` is used and narrowed instead of `any` |
| `typing.no_any_in_src` | typing evidence: no `any` appears in `src/` |
| `typing.casts_avoided_or_remaining_justified` | typing evidence: `as` casts are avoided, or any that remain are justified |
| `typing.non_null_assertion_chains_absent` | typing evidence: no non-null assertion (`!`) chains are used |
| `boundary_validation.external_input_validated_with_schema` | boundary evidence: external input (API, storage, env) is validated with a schema such as zod/valibot |
| `boundary_validation.parse_not_trust_at_edges` | boundary evidence: boundaries parse, don't trust — validate at the edges |
| `boundaries` (list of boundary-row objects) | computed: must be present (an empty list declares no external boundaries); reported as `boundaries_count` |
| `boundaries[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `boundaries[].schema_validated` | computed: must be `true` per row |
| `boundaries[].schema_tested` | computed: must be `true` per row |
| `state_modelling.discriminated_unions_for_status_machines` | state evidence: status machines are modelled as discriminated unions |
| `state_modelling.exhaustive_switch_with_never_check` | state evidence: switches are exhaustive with a `never` check |
| `state_modelling.illegal_states_unrepresentable_by_design` | state evidence: illegal states are made unrepresentable by the type design |
| `module_structure.small_files_kept` | module evidence: module files are kept small |
| `module_structure.deep_imports_preferred_over_barrel_files` | module evidence: deep imports are preferred over barrel files |
| `module_structure.explicit_public_surfaces` | module evidence: public surfaces are explicit |
| `modules` (list of module-row objects) | computed: must be present (an empty list declares no module rows); reported as `modules_count` |
| `modules[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `modules[].any_free` | computed: must be `true` per row |
| `modules[].explicit_public_surface` | computed: must be `true` per row |
| `async_practices.all_promises_awaited_or_handled` | async evidence: all promises are awaited or handled |
| `async_practices.no_floating_promises` | async evidence: no floating promises are present |
| `async_practices.promise_handling_lint_rule_enabled` | async evidence: a lint rule enforces that promises are awaited or handled |
| `async_practices.abort_controller_for_cancellable_work` | async evidence: `AbortController` is used for cancellable work |
| `testing.unit_tests_for_logic_with_vitest` | testing evidence: unit tests for logic run under vitest |
| `testing.integration_tests_at_module_edges` | testing evidence: integration tests run at the module edges |
| `testing.types_tested_by_compilation` | testing evidence: types are tested by compilation |
| `build_tooling.tsc_for_types_and_bundler_for_bundling` | build evidence: tsc is used for types and a bundler for bundling |
| `build_tooling.source_maps_enabled` | build evidence: source maps are enabled |
| `build_tooling.dependencies_pinned` | build evidence: dependencies are pinned |
| `build_tooling.lint_clean` | build evidence: lint is clean |
| `red_lines.ts_ignore_or_ts_expect_error_without_tracked_reason_present` | must be `false` to pass (red line: no `ts-ignore`/`ts-expect-error` without a tracked reason) |
| `red_lines.unvalidated_runtime_shapes_assumed_present` | must be `false` to pass (red line: no unvalidated runtime shapes assumed) |
| `red_lines.any_in_src_present` | must be `false` to pass (red line: no `any` in `src/`) |
| `red_lines.floating_promises_present` | must be `false` to pass (red line: no floating promises) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/strict-typescript-engineering-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 39 checks and a text stamp of the verdict):

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
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across eight sections."
}
```

## Verdicts

- **STRICT_TYPESCRIPT_ENGINEERING_PACK_READY** — every check passes; the declared strict TypeScript record is complete and internally consistent with the skill's strictness, typing discipline, quality gates and red lines.
- **STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `boundaries_count` and `modules_count` (the declared list lengths, or null when a list is not declared — counts are reported as integers, exactly), `boundaries_without_schema_validation`, `boundaries_without_schema_tests`, `modules_not_any_free` and `modules_without_explicit_public_surface` (rows whose field is present but not true; a row with the field absent is missing evidence and does not appear; each null when its list is not declared), `duplicate_boundary_names` and `duplicate_module_names` (names declared on more than one row, in the order their second occurrence appears; each null when its list is not declared), `strict_flag_coverage`, `schema_validation_coverage`, `schema_test_coverage`, `any_free_coverage` and `explicit_public_surface_coverage` (each a string with exactly six decimal places, produced by round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then formatted with exactly six decimals; a ratio is null when its denominator list is absent or empty, and for `strict_flag_coverage` when either named flag is absent), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eight primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
