# Cpp engineering review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a piece of C++ code or a diff and a record of how it was engineered — ownership, value semantics, smart pointers, STL use, exceptions/ABI discipline, tooling, sanitizers and safety. This atom reads one declared manifest and returns one deterministic verdict across eight sections: **REVIEW_SOUND**, **REVIEW_DEFICIENT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared evidence's completeness and consistency only — it does not compile, run, sanitize or read your code, and it does not verify that a declared value is true. Computed checks: the declared `tooling.warning_count` passes only when it equals zero (the skill's warnings-as-errors gate — the one number the skill itself states); and the declared `raii.forbidden_constructs` list passes only when it contains none of the three stated entries — `raw_owning_pointer`, `manual_new`, `manual_delete` (unknown entries do not count as forbidden; an empty list passes). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cpp-engineering-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/cpp-engineering-review` — tool name `cpp_engineering_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/cpp-engineering-review` — body = the manifest object; same `Authorization` header.

## Input — the cpp-engineering-review manifest

| Field | Meaning |
|---|---|
| `subject` | subject name (string; carried into the output, not checked) |
| `raii.resources_owned_by_objects` / `destructors_clean_up_resources` | RAII evidence: resources owned by objects; destructors clean up |
| `raii.manual_new_delete_in_new_code` | must be `false` to pass (quality gate: no manual `new`/`delete` in new code) |
| `raii.raw_owning_pointers_in_new_code` | must be `false` to pass (quality gate: no raw owning pointers in new code) |
| `raii.forbidden_constructs` (list of strings) | computed: passes only when it contains none of `raw_owning_pointer`, `manual_new`, `manual_delete`; the stated entries found are reported as `forbidden_constructs_found` (in that stated order), or null when no list is declared |
| `value_semantics.values_const_references_preferred` / `move_semantics_used_where_copies_expensive` / `rule_of_zero_honored` / `special_members_justified_when_present` | value-semantics evidence |
| `smart_pointers.unique_ptr_is_default` / `shared_ptr_only_for_real_shared_ownership` / `weak_ptr_used_to_break_cycles` | smart-pointer evidence |
| `stl.algorithms_preferred_over_hand_loops` / `containers_matched_to_access_patterns` / `ranges_used_where_available` / `templates_used_only_for_real_genericity` / `template_error_messages_readable` | STL and templates evidence |
| `exceptions_and_abi.exceptions_policy_chosen` / `exceptions_policy_documented` / `exceptions_policy_applied_consistently` / `stable_library_interfaces` / `pimpl_used_where_needed` / `symbols_versioned` | exceptions-policy and ABI evidence |
| `tooling.clang_tidy_run` / `clang_tidy_clean_on_diff` / `clang_format_applied` / `warnings_treated_as_errors` | tooling evidence |
| `tooling.warning_count` (number) | computed: passes only when it equals 0; reported as `warning_count` exactly as declared (a JSON number), or null when no count is declared |
| `sanitizers.asan_enabled_in_test_builds` / `ubsan_enabled_in_test_builds` / `tsan_enabled_in_test_builds` / `sanitizer_clean_test_run` | sanitizer evidence |
| `safety.dangling_references_across_async_boundaries` | must be `false` to pass (red line: no dangling references across async boundaries) |
| `safety.macros_used_where_language_features_exist` | must be `false` to pass (red line: no macros where language features exist) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward REVIEW_DEFICIENT). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/cpp-engineering-review`:

```json
{
  "subject": "PR-123",
  "raii": {
    "resources_owned_by_objects": true,
    "destructors_clean_up_resources": true,
    "manual_new_delete_in_new_code": false,
    "raw_owning_pointers_in_new_code": false,
    "forbidden_constructs": []
  },
  "value_semantics": {
    "values_const_references_preferred": true,
    "move_semantics_used_where_copies_expensive": true,
    "rule_of_zero_honored": true,
    "special_members_justified_when_present": true
  },
  "smart_pointers": {
    "unique_ptr_is_default": true,
    "shared_ptr_only_for_real_shared_ownership": true,
    "weak_ptr_used_to_break_cycles": true
  },
  "stl": {
    "algorithms_preferred_over_hand_loops": true,
    "containers_matched_to_access_patterns": true,
    "ranges_used_where_available": true,
    "templates_used_only_for_real_genericity": true,
    "template_error_messages_readable": true
  },
  "exceptions_and_abi": {
    "exceptions_policy_chosen": true,
    "exceptions_policy_documented": true,
    "exceptions_policy_applied_consistently": true,
    "stable_library_interfaces": true,
    "pimpl_used_where_needed": true,
    "symbols_versioned": true
  },
  "tooling": {
    "clang_tidy_run": true,
    "clang_tidy_clean_on_diff": true,
    "clang_format_applied": true,
    "warnings_treated_as_errors": true,
    "warning_count": 0
  },
  "sanitizers": {
    "asan_enabled_in_test_builds": true,
    "ubsan_enabled_in_test_builds": true,
    "tsan_enabled_in_test_builds": true,
    "sanitizer_clean_test_run": true
  },
  "safety": {
    "dangling_references_across_async_boundaries": false,
    "macros_used_where_language_features_exist": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 34 checks and a text stamp of the verdict):

```json
{
  "service": "cpp-engineering-review",
  "atom_version": "0.1.0",
  "subject": "PR-123",
  "verdict": "REVIEW_SOUND",
  "sections": {
    "raii_and_ownership": "pass",
    "value_semantics": "pass",
    "smart_pointers": "pass",
    "stl_and_templates": "pass",
    "exceptions_and_abi": "pass",
    "tooling_and_warnings": "pass",
    "sanitizers": "pass",
    "safety_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "warning_count": 0,
  "forbidden_constructs_found": [],
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across eight sections."
}
```

## Verdicts

- **REVIEW_SOUND** — every check passes; the declared C++-engineering evidence is complete and consistent with the skill's method, quality gates and red lines.
- **REVIEW_DEFICIENT** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `warning_count` (the declared count as a JSON number, or null when it cannot be read), `forbidden_constructs_found` (the stated forbidden entries found, in the skill's stated order, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when either computed check cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
