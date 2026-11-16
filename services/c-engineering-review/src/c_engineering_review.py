#!/usr/bin/env python3
"""C engineering review — deterministic core.

Built from the bound skill `c-engineering` (v1): "Write production
C — memory discipline, no undefined behaviour, warning-clean
builds, boundary tests." This atom reviews one declared
C-engineering evidence manifest — the caller's declared
static-analysis / build / review records for one piece of C code
or one diff — against the skill's eight method steps, its four
quality gates, and its two red lines. It does not compile, run,
or review live code — it checks that the manifest contains what
the skill's method requires, on the caller's declared evidence.

The caller submits a c-engineering-review manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
set logic of the declared values — no outside threshold is
imported:

- zero warnings (method step 3: "zero warnings maintained, not
  'later'"; quality gate: "Warning-clean with `-Werror` on target
  compilers"): a declared `warnings.warning_count` passes only
  when it equals zero — the one number the skill itself states;
- banned calls (red line: "No `gets`, `strcpy`, `sprintf`,
  unchecked `scanf` — ever"): the declared `bounds.banned_calls`
  list passes only when it contains none of the four stated
  entries (`gets`, `strcpy`, `sprintf`, `unchecked_scanf`);
  unknown entries do not count as banned. A missing list is
  missing evidence; an empty list is present and passes. The
  output reports the stated banned entries found, in the skill's
  stated order, as `banned_calls_found` (null when no list is
  declared). Entries are validated as strings only, never
  enum-checked — the banned-call finding is a verdict check, not
  a type error.

The computed outcome over the two computed checks is reported as
`computed_status`.

Verdict:
- any fail             -> REVIEW_DEFICIENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> REVIEW_SOUND

This is a completeness and consistency review over declared
evidence, not a code review: a manifest that declares every step
passes even if the underlying code is in fact flawed, and nothing
here verifies that a declared value is true, that a build was
actually run, or that the code contains no trap the manifest did
not declare.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "memory_discipline",
    "undefined_behavior",
    "warnings_and_build",
    "bounds_and_strings",
    "sanitizers_and_static_analysis",
    "portability",
    "build_and_test",
)

BANNED_CALLS = [
    "gets",
    "strcpy",
    "sprintf",
    "unchecked_scanf",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the banned-call list entries) are validated
# as strings only, never enum-checked: the banned-call finding is
# a verdict check, not a type error.
MANIFEST_SPEC = {
    "subject": "string",
    "memory": {
        "one_owner_per_allocation": "boolean",
        "freed_on_same_path_as_allocation": "boolean",
        "ownership_documented_in_headers": "boolean",
        "caller_supplied_buffers_preferred": "boolean",
        "ownership_documented_for_outliving_pointers": "boolean",
    },
    "undefined_behavior": {
        "integer_overflow_addressed": "boolean",
        "strict_aliasing_respected": "boolean",
        "uninitialized_reads_avoided": "boolean",
        "signed_shifts_checked": "boolean",
        "sequence_point_traps_avoided": "boolean",
        "ub_shortcuts_used": "boolean",
    },
    "warnings": {
        "warnings_treated_as_errors": "boolean",
        "warning_count": "number",
    },
    "bounds": {
        "sized_apis_used": "boolean",
        "lengths_validated_at_boundaries": "boolean",
        "unbounded_operations_in_diff": "boolean",
        "banned_calls": ["string"],
    },
    "sanitizers": {
        "asan_enabled_in_test_builds": "boolean",
        "ubsan_enabled_in_test_builds": "boolean",
        "asan_ubsan_clean_on_suite": "boolean",
        "valgrind_used_for_leaks": "boolean",
        "parsers_fuzzed": "boolean",
        "static_analysis_run": "boolean",
        "static_analysis_findings_treated_as_bugs": "boolean",
    },
    "portability": {
        "fixed_width_types_used": "boolean",
        "compiler_extensions_isolated": "boolean",
        "tested_on_target_platforms": "boolean",
    },
    "build_and_test": {
        "build_system_pinned": "boolean",
        "unit_tests_at_function_boundaries": "boolean",
        "integration_tests_at_edges": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def evaluate(manifest):
    """Return the verdict dict for a c-engineering-review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: memory_discipline (skill method step 1:
    #      "Memory discipline: one clear owner per allocation;
    #      free on the same path as allocation; document ownership
    #      in headers. Prefer caller-supplied buffers over hidden
    #      allocations"; quality gate: "Ownership documented for
    #      pointers that outlive their function") ----
    _bool_check(results, "memory_discipline", "one_owner_per_allocation",
                manifest, ("memory", "one_owner_per_allocation"),
                "method step 1: one clear owner per allocation")
    _bool_check(results, "memory_discipline",
                "freed_on_same_path_as_allocation",
                manifest, ("memory", "freed_on_same_path_as_allocation"),
                "method step 1: each allocation is freed on the same "
                "path as its allocation")
    _bool_check(results, "memory_discipline",
                "ownership_documented_in_headers",
                manifest, ("memory", "ownership_documented_in_headers"),
                "method step 1: ownership is documented in headers")
    _bool_check(results, "memory_discipline",
                "caller_supplied_buffers_preferred_over_hidden_allocations",
                manifest, ("memory", "caller_supplied_buffers_preferred"),
                "method step 1: caller-supplied buffers are preferred "
                "over hidden allocations")
    _bool_check(results, "memory_discipline",
                "ownership_documented_for_outliving_pointers",
                manifest,
                ("memory", "ownership_documented_for_outliving_pointers"),
                "quality gate: ownership is documented for pointers "
                "that outlive their function")

    # ---- Section 2: undefined_behavior (skill method step 2: "No
    #      undefined behavior: mind integer overflow, strict
    #      aliasing, uninitialized reads, signed shifts,
    #      sequence-point traps. No UB shortcuts"; red line: "No
    #      UB 'because it works on my machine'") ----
    _bool_check(results, "undefined_behavior", "integer_overflow_addressed",
                manifest,
                ("undefined_behavior", "integer_overflow_addressed"),
                "method step 2: integer overflow is minded — no "
                "overflow trap is left unaddressed")
    _bool_check(results, "undefined_behavior", "strict_aliasing_respected",
                manifest,
                ("undefined_behavior", "strict_aliasing_respected"),
                "method step 2: strict aliasing is respected")
    _bool_check(results, "undefined_behavior",
                "uninitialized_reads_avoided",
                manifest,
                ("undefined_behavior", "uninitialized_reads_avoided"),
                "method step 2: uninitialized reads are avoided")
    _bool_check(results, "undefined_behavior", "signed_shifts_checked",
                manifest, ("undefined_behavior", "signed_shifts_checked"),
                "method step 2: signed shifts are checked")
    _bool_check(results, "undefined_behavior",
                "sequence_point_traps_avoided",
                manifest,
                ("undefined_behavior", "sequence_point_traps_avoided"),
                "method step 2: sequence-point traps are avoided")
    _false_check(results, "undefined_behavior", "no_ub_shortcuts",
                 manifest, ("undefined_behavior", "ub_shortcuts_used"),
                 "method step 2 / red line: no UB shortcuts — no UB "
                 "'because it works on my machine'")

    # ---- Section 3: warnings_and_build (skill method step 3:
    #      "Warnings are errors: build `-Wall -Wextra -Werror`
    #      (MSVC `/W4 /WX`); zero warnings maintained, not
    #      'later'"; quality gate: "Warning-clean with `-Werror`
    #      on target compilers") ----
    _bool_check(results, "warnings_and_build", "warnings_treated_as_errors",
                manifest, ("warnings", "warnings_treated_as_errors"),
                "method step 3: warnings are errors — the build uses "
                "-Wall -Wextra -Werror (MSVC /W4 /WX)")
    warn_count, has_warn_count = _get(manifest, "warnings", "warning_count")
    warn_is_number = has_warn_count and _is_number(warn_count)
    _check(results, "warnings_and_build", "zero_warnings_maintained",
           warn_count, warn_is_number,
           warn_is_number and warn_count == 0,
           "method step 3 / quality gate: zero warnings maintained "
           "— warning-clean with -Werror on target compilers")

    # ---- Section 4: bounds_and_strings (skill method step 4:
    #      "Bounds and strings: never `strcpy`/`sprintf`/`gets`;
    #      use sized APIs (`snprintf`, checked `memcpy`); validate
    #      every length crossing a boundary"; quality gate: "No
    #      unbounded string/mem operations in the diff"; red line:
    #      "No `gets`, `strcpy`, `sprintf`, unchecked `scanf` —
    #      ever") ----
    _bool_check(results, "bounds_and_strings", "sized_apis_used",
                manifest, ("bounds", "sized_apis_used"),
                "method step 4: sized APIs are used (snprintf, "
                "checked memcpy) instead of unbounded ones")
    _bool_check(results, "bounds_and_strings",
                "lengths_validated_at_boundaries",
                manifest, ("bounds", "lengths_validated_at_boundaries"),
                "method step 4: every length crossing a boundary is "
                "validated")
    _false_check(results, "bounds_and_strings",
                 "no_unbounded_operations_in_diff",
                 manifest, ("bounds", "unbounded_operations_in_diff"),
                 "quality gate: no unbounded string/mem operations "
                 "in the diff")
    banned, has_banned = _get(manifest, "bounds", "banned_calls")
    banned_is_list = has_banned and isinstance(banned, list)
    banned_found = (
        [b for b in BANNED_CALLS if b in banned]
        if banned_is_list else None
    )
    _check(results, "bounds_and_strings", "no_banned_functions_present",
           banned, banned_is_list,
           banned_is_list and len(banned_found) == 0,
           "red line: no gets, strcpy, sprintf, unchecked scanf — "
           "ever")

    # ---- Section 5: sanitizers_and_static_analysis (skill method
    #      step 5: "Sanitizers in dev: ASan + UBSan in test builds;
    #      Valgrind for leaks; fuzz parsers (libFuzzer/AFL)";
    #      method step 6: "Static analysis: clang-tidy + compiler
    #      analyzer in the loop; findings are bugs until proven
    #      otherwise"; quality gate: "ASan/UBSan clean on the
    #      suite") ----
    _bool_check(results, "sanitizers_and_static_analysis",
                "asan_enabled_in_test_builds",
                manifest, ("sanitizers", "asan_enabled_in_test_builds"),
                "method step 5: ASan is enabled in test builds")
    _bool_check(results, "sanitizers_and_static_analysis",
                "ubsan_enabled_in_test_builds",
                manifest, ("sanitizers", "ubsan_enabled_in_test_builds"),
                "method step 5: UBSan is enabled in test builds")
    _bool_check(results, "sanitizers_and_static_analysis",
                "asan_ubsan_clean_on_suite",
                manifest, ("sanitizers", "asan_ubsan_clean_on_suite"),
                "quality gate: ASan/UBSan clean on the suite")
    _bool_check(results, "sanitizers_and_static_analysis",
                "valgrind_used_for_leaks",
                manifest, ("sanitizers", "valgrind_used_for_leaks"),
                "method step 5: Valgrind is used for leaks")
    _bool_check(results, "sanitizers_and_static_analysis", "parsers_fuzzed",
                manifest, ("sanitizers", "parsers_fuzzed"),
                "method step 5: parsers are fuzzed (libFuzzer/AFL)")
    _bool_check(results, "sanitizers_and_static_analysis",
                "static_analysis_run_in_loop",
                manifest, ("sanitizers", "static_analysis_run"),
                "method step 6: static analysis is in the loop — "
                "clang-tidy plus the compiler analyzer")
    _bool_check(results, "sanitizers_and_static_analysis",
                "static_analysis_findings_treated_as_bugs",
                manifest,
                ("sanitizers", "static_analysis_findings_treated_as_bugs"),
                "method step 6: static-analysis findings are treated "
                "as bugs until proven otherwise")

    # ---- Section 6: portability (skill method step 7:
    #      "Portability: fixed-width types (`stdint.h`); isolate
    #      compiler extensions; test on target platforms") ----
    _bool_check(results, "portability", "fixed_width_types_used",
                manifest, ("portability", "fixed_width_types_used"),
                "method step 7: fixed-width types are used (stdint.h)")
    _bool_check(results, "portability", "compiler_extensions_isolated",
                manifest, ("portability", "compiler_extensions_isolated"),
                "method step 7: compiler extensions are isolated")
    _bool_check(results, "portability", "tested_on_target_platforms",
                manifest, ("portability", "tested_on_target_platforms"),
                "method step 7: the code is tested on target "
                "platforms")

    # ---- Section 7: build_and_test (skill method step 8: "Build
    #      & test: Make/CMake pinned; unit tests at function
    #      boundaries; integration tests at the edges") ----
    _bool_check(results, "build_and_test", "build_system_pinned",
                manifest, ("build_and_test", "build_system_pinned"),
                "method step 8: the build is pinned (Make/CMake)")
    _bool_check(results, "build_and_test",
                "unit_tests_at_function_boundaries",
                manifest,
                ("build_and_test", "unit_tests_at_function_boundaries"),
                "method step 8: unit tests sit at function boundaries")
    _bool_check(results, "build_and_test", "integration_tests_at_edges",
                manifest, ("build_and_test", "integration_tests_at_edges"),
                "method step 8: integration tests sit at the edges")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "REVIEW_DEFICIENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "REVIEW_SOUND"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("zero_warnings_maintained",
                          "no_banned_functions_present")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "c-engineering-review",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "warning_count": warn_count if warn_is_number else None,
        "banned_calls_found": banned_found,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "C ENGINEERING REVIEW",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: c_engineering_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "REVIEW_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
