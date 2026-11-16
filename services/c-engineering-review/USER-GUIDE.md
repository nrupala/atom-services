# C engineering review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You submit one declared C-engineering evidence manifest — your static-analysis, build, and review records for one piece of C code or one diff — and this atom returns one deterministic verdict across seven sections: **REVIEW_SOUND**, **REVIEW_DEFICIENT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the declared `warnings.warning_count` must equal zero (the skill's one stated number — warnings are errors, zero warnings maintained), and the declared `bounds.banned_calls` list must contain none of the four stated banned entries (`gets`, `strcpy`, `sprintf`, `unchecked_scanf`). It reviews declared evidence only: it does not compile, run, fuzz, or read live code, and it does not verify that a declared value is true. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "c-engineering-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/c-engineering-review` — tool name `c_engineering_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/c-engineering-review` — body = the manifest object; same `Authorization` header.

## Input — the c-engineering-review manifest

| Field | Meaning |
|---|---|
| `subject` | subject text (string; carried into the output, not checked) |
| `memory.one_owner_per_allocation` / `freed_on_same_path_as_allocation` / `ownership_documented_in_headers` / `caller_supplied_buffers_preferred` / `ownership_documented_for_outliving_pointers` | memory-discipline evidence |
| `undefined_behavior.integer_overflow_addressed` / `strict_aliasing_respected` / `uninitialized_reads_avoided` / `signed_shifts_checked` / `sequence_point_traps_avoided` | undefined-behavior evidence |
| `undefined_behavior.ub_shortcuts_used` | must be `false` to pass |
| `warnings.warnings_treated_as_errors` | warnings evidence |
| `warnings.warning_count` (number) | computed: passes only when it equals zero; reported as `warning_count` |
| `bounds.sized_apis_used` / `lengths_validated_at_boundaries` | bounds and strings evidence |
| `bounds.unbounded_operations_in_diff` | must be `false` to pass |
| `bounds.banned_calls` (list of strings) | computed: passes only when it contains none of `gets`, `strcpy`, `sprintf`, `unchecked_scanf`; stated entries found are reported, in that order, as `banned_calls_found` |
| `sanitizers.asan_enabled_in_test_builds` / `ubsan_enabled_in_test_builds` / `asan_ubsan_clean_on_suite` / `valgrind_used_for_leaks` / `parsers_fuzzed` / `static_analysis_run` / `static_analysis_findings_treated_as_bugs` | sanitizers and static-analysis evidence |
| `portability.fixed_width_types_used` / `compiler_extensions_isolated` / `tested_on_target_platforms` | portability evidence |
| `build_and_test.build_system_pinned` / `unit_tests_at_function_boundaries` / `integration_tests_at_edges` | build and test evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward REVIEW_DEFICIENT).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/c-engineering-review`:

```json
{
  "subject": "core-engine-v1",
  "memory": {
    "one_owner_per_allocation": true,
    "freed_on_same_path_as_allocation": true,
    "ownership_documented_in_headers": true,
    "caller_supplied_buffers_preferred": true,
    "ownership_documented_for_outliving_pointers": true
  },
  "undefined_behavior": {
    "integer_overflow_addressed": true,
    "strict_aliasing_respected": true,
    "uninitialized_reads_avoided": true,
    "signed_shifts_checked": true,
    "sequence_point_traps_avoided": true,
    "ub_shortcuts_used": false
  },
  "warnings": {
    "warnings_treated_as_errors": true,
    "warning_count": 0
  },
  "bounds": {
    "sized_apis_used": true,
    "lengths_validated_at_boundaries": true,
    "unbounded_operations_in_diff": false,
    "banned_calls": []
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "asan_ubsan_clean_on_suite": true,
    "valgrind_used_for_leaks": true,
    "parsers_fuzzed": true,
    "static_analysis_run": true,
    "static_analysis_findings_treated_as_bugs": true
  },
  "portability": {
    "fixed_width_types_used": true,
    "compiler_extensions_isolated": true,
    "tested_on_target_platforms": true
  },
  "build_and_test": {
    "build_system_pinned": true,
    "unit_tests_at_function_boundaries": true,
    "integration_tests_at_edges": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

```json
{
  "service": "c-engineering-review",
  "atom_version": "0.1.0",
  "subject": "core-engine-v1",
  "verdict": "REVIEW_SOUND",
  "sections": {
    "memory_discipline": "pass",
    "undefined_behavior": "pass",
    "warnings_and_build": "pass",
    "bounds_and_strings": "pass",
    "sanitizers_and_static_analysis": "pass",
    "portability": "pass",
    "build_and_test": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "warning_count": 0,
  "banned_calls_found": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across seven sections."
}
```

## Verdicts

- **REVIEW_SOUND** — every check passes; the review is sound on the declared evidence.
- **REVIEW_DEFICIENT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `warning_count` (the declared count, or null when no count is declared or it is not a number), `banned_calls_found` (the stated banned entries found, in the skill's stated order, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
