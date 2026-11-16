#!/usr/bin/env python3
"""C++ engineering review — deterministic core.

Built from the bound skill `cpp-engineering` (v1): "Write modern
C++ — RAII, value semantics, STL-first design, sanitizers and
static analysis in the loop." This atom reviews one declared
C++-engineering evidence manifest — the caller's declared
ownership / tooling / review records for one piece of C++ code
or one diff — against the skill's eight method steps, its four
quality gates, and its two red lines. It does not compile, run,
or review live code — it checks that the manifest contains what
the skill's method requires, on the caller's declared evidence.

The caller submits a cpp-engineering-review manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
set logic of the declared values — no outside threshold is
imported:

- zero warnings (method step 6: "warnings as errors"; quality
  gate: "warnings-as-errors build green"): a declared
  `tooling.warning_count` passes only when it equals zero — the
  one number the skill itself states;
- forbidden constructs (quality gate: "No raw owning pointers
  or manual `new`/`delete` in new code"): the declared
  `raii.forbidden_constructs` list passes only when it contains
  none of the three stated entries (`raw_owning_pointer`,
  `manual_new`, `manual_delete`); unknown entries do not count
  as forbidden. A missing list is missing evidence; an empty
  list is present and passes. The output reports the stated
  forbidden entries found, in the skill's stated order, as
  `forbidden_constructs_found` (null when no list is declared).
  Entries are validated as strings only, never enum-checked —
  the forbidden-construct finding is a verdict check, not a
  type error.

The computed outcome over the two computed checks is reported as
`computed_status`.

Serialization rule (identical in both implementations): no
floating-point arithmetic is performed anywhere in this atom.
`warning_count` is echoed as the declared JSON number exactly
as declared (or null when absent / not a number);
`forbidden_constructs_found` is a list of strings in the fixed
skill-stated order above (or null). There is no derived
floating-point field, so no fixed-decimal conversion arises.

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
    "raii_and_ownership",
    "value_semantics",
    "smart_pointers",
    "stl_and_templates",
    "exceptions_and_abi",
    "tooling_and_warnings",
    "sanitizers",
    "safety_red_lines",
)

FORBIDDEN_CONSTRUCTS = [
    "raw_owning_pointer",
    "manual_new",
    "manual_delete",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the forbidden-construct list entries) are
# validated as strings only, never enum-checked: the
# forbidden-construct finding is a verdict check, not a type
# error.
MANIFEST_SPEC = {
    "subject": "string",
    "raii": {
        "resources_owned_by_objects": "boolean",
        "destructors_clean_up_resources": "boolean",
        "manual_new_delete_in_new_code": "boolean",
        "raw_owning_pointers_in_new_code": "boolean",
        "forbidden_constructs": ["string"],
    },
    "value_semantics": {
        "values_const_references_preferred": "boolean",
        "move_semantics_used_where_copies_expensive": "boolean",
        "rule_of_zero_honored": "boolean",
        "special_members_justified_when_present": "boolean",
    },
    "smart_pointers": {
        "unique_ptr_is_default": "boolean",
        "shared_ptr_only_for_real_shared_ownership": "boolean",
        "weak_ptr_used_to_break_cycles": "boolean",
    },
    "stl": {
        "algorithms_preferred_over_hand_loops": "boolean",
        "containers_matched_to_access_patterns": "boolean",
        "ranges_used_where_available": "boolean",
        "templates_used_only_for_real_genericity": "boolean",
        "template_error_messages_readable": "boolean",
    },
    "exceptions_and_abi": {
        "exceptions_policy_chosen": "boolean",
        "exceptions_policy_documented": "boolean",
        "exceptions_policy_applied_consistently": "boolean",
        "stable_library_interfaces": "boolean",
        "pimpl_used_where_needed": "boolean",
        "symbols_versioned": "boolean",
    },
    "tooling": {
        "clang_tidy_run": "boolean",
        "clang_tidy_clean_on_diff": "boolean",
        "clang_format_applied": "boolean",
        "warnings_treated_as_errors": "boolean",
        "warning_count": "number",
    },
    "sanitizers": {
        "asan_enabled_in_test_builds": "boolean",
        "ubsan_enabled_in_test_builds": "boolean",
        "tsan_enabled_in_test_builds": "boolean",
        "sanitizer_clean_test_run": "boolean",
    },
    "safety": {
        "dangling_references_across_async_boundaries": "boolean",
        "macros_used_where_language_features_exist": "boolean",
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
    """Return the verdict dict for a cpp-engineering-review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: raii_and_ownership (skill method step 1:
    #      "RAII everywhere: resources (memory, files, sockets,
    #      locks) owned by objects; destructors clean up; no
    #      manual pairing"; quality gate: "No raw owning pointers
    #      or manual `new`/`delete` in new code") ----
    _bool_check(results, "raii_and_ownership",
                "resources_owned_by_objects",
                manifest, ("raii", "resources_owned_by_objects"),
                "method step 1: resources are owned by objects — "
                "RAII everywhere (memory, files, sockets, locks)")
    _bool_check(results, "raii_and_ownership",
                "destructors_clean_up_resources",
                manifest, ("raii", "destructors_clean_up_resources"),
                "method step 1: destructors clean up — no manual "
                "pairing")
    _false_check(results, "raii_and_ownership",
                 "no_manual_new_delete_in_new_code",
                 manifest, ("raii", "manual_new_delete_in_new_code"),
                 "quality gate: no manual new/delete in new code")
    _false_check(results, "raii_and_ownership",
                 "no_raw_owning_pointers_in_new_code",
                 manifest, ("raii", "raw_owning_pointers_in_new_code"),
                 "quality gate: no raw owning pointers in new code")
    forbidden, has_forbidden = _get(manifest, "raii",
                                    "forbidden_constructs")
    forbidden_is_list = has_forbidden and isinstance(forbidden, list)
    forbidden_found = (
        [f for f in FORBIDDEN_CONSTRUCTS if f in forbidden]
        if forbidden_is_list else None
    )
    _check(results, "raii_and_ownership",
           "no_forbidden_constructs_present",
           forbidden, forbidden_is_list,
           forbidden_is_list and len(forbidden_found) == 0,
           "quality gate: no raw owning pointers or manual "
           "new/delete in new code")

    # ---- Section 2: value_semantics (skill method step 2:
    #      "Value semantics first: prefer values, `const`, and
    #      references; move semantics where copies are expensive;
    #      follow the Rule of Zero (write special members only
    #      when you must)"; quality gate: "Rule of Zero honored
    #      (special members only when justified)") ----
    _bool_check(results, "value_semantics",
                "values_const_references_preferred",
                manifest,
                ("value_semantics", "values_const_references_preferred"),
                "method step 2: values, const, and references are "
                "preferred — value semantics first")
    _bool_check(results, "value_semantics",
                "move_semantics_used_where_copies_expensive",
                manifest,
                ("value_semantics",
                 "move_semantics_used_where_copies_expensive"),
                "method step 2: move semantics are used where "
                "copies are expensive")
    _bool_check(results, "value_semantics", "rule_of_zero_honored",
                manifest, ("value_semantics", "rule_of_zero_honored"),
                "method step 2 / quality gate: the Rule of Zero is "
                "honored — special members are written only when "
                "you must")
    _bool_check(results, "value_semantics",
                "special_members_justified_when_present",
                manifest,
                ("value_semantics",
                 "special_members_justified_when_present"),
                "quality gate: special members are present only "
                "when justified")

    # ---- Section 3: smart_pointers (skill method step 3:
    #      "Smart pointers with intent: `unique_ptr` default;
    #      `shared_ptr` only for real shared ownership; `weak_ptr`
    #      to break cycles. No raw owning pointers in new code") ----
    _bool_check(results, "smart_pointers", "unique_ptr_is_default",
                manifest, ("smart_pointers", "unique_ptr_is_default"),
                "method step 3: unique_ptr is the default smart "
                "pointer")
    _bool_check(results, "smart_pointers",
                "shared_ptr_only_for_real_shared_ownership",
                manifest,
                ("smart_pointers",
                 "shared_ptr_only_for_real_shared_ownership"),
                "method step 3: shared_ptr is used only for real "
                "shared ownership")
    _bool_check(results, "smart_pointers",
                "weak_ptr_used_to_break_cycles",
                manifest,
                ("smart_pointers", "weak_ptr_used_to_break_cycles"),
                "method step 3: weak_ptr is used to break cycles")

    # ---- Section 4: stl_and_templates (skill method step 4:
    #      "STL-first: algorithms over hand loops; containers
    #      matched to access patterns; ranges where available";
    #      method step 7: "Templates sparingly: for real
    #      genericity, not vanity; keep error messages readable")
    #      ----
    _bool_check(results, "stl_and_templates",
                "algorithms_preferred_over_hand_loops",
                manifest,
                ("stl", "algorithms_preferred_over_hand_loops"),
                "method step 4: STL algorithms are preferred over "
                "hand loops")
    _bool_check(results, "stl_and_templates",
                "containers_matched_to_access_patterns",
                manifest,
                ("stl", "containers_matched_to_access_patterns"),
                "method step 4: containers are matched to access "
                "patterns")
    _bool_check(results, "stl_and_templates",
                "ranges_used_where_available",
                manifest, ("stl", "ranges_used_where_available"),
                "method step 4: ranges are used where available")
    _bool_check(results, "stl_and_templates",
                "templates_used_only_for_real_genericity",
                manifest,
                ("stl", "templates_used_only_for_real_genericity"),
                "method step 7: templates are used sparingly — "
                "for real genericity, not vanity")
    _bool_check(results, "stl_and_templates",
                "template_error_messages_readable",
                manifest, ("stl", "template_error_messages_readable"),
                "method step 7: template error messages are kept "
                "readable")

    # ---- Section 5: exceptions_and_abi (skill method step 5:
    #      "Exceptions policy: pick one per codebase (exceptions
    #      on/off), document it, and be consistent"; method
    #      step 8: "ABI discipline: for libraries: stable
    #      interfaces, pimpl where needed, versioned symbols") ----
    _bool_check(results, "exceptions_and_abi",
                "exceptions_policy_chosen",
                manifest,
                ("exceptions_and_abi", "exceptions_policy_chosen"),
                "method step 5: one exceptions policy is picked "
                "for the codebase (exceptions on/off)")
    _bool_check(results, "exceptions_and_abi",
                "exceptions_policy_documented",
                manifest,
                ("exceptions_and_abi", "exceptions_policy_documented"),
                "method step 5: the exceptions policy is documented")
    _bool_check(results, "exceptions_and_abi",
                "exceptions_policy_applied_consistently",
                manifest,
                ("exceptions_and_abi",
                 "exceptions_policy_applied_consistently"),
                "method step 5: the exceptions policy is applied "
                "consistently")
    _bool_check(results, "exceptions_and_abi",
                "stable_library_interfaces",
                manifest,
                ("exceptions_and_abi", "stable_library_interfaces"),
                "method step 8: library interfaces are stable")
    _bool_check(results, "exceptions_and_abi",
                "pimpl_used_where_needed",
                manifest,
                ("exceptions_and_abi", "pimpl_used_where_needed"),
                "method step 8: pimpl is used where needed")
    _bool_check(results, "exceptions_and_abi", "symbols_versioned",
                manifest, ("exceptions_and_abi", "symbols_versioned"),
                "method step 8: symbols are versioned")

    # ---- Section 6: tooling_and_warnings (skill method step 6:
    #      "Tooling gates: clang-tidy + clang-format;
    #      ASan/UBSan/TSan test builds; warnings as errors";
    #      quality gate: "clang-tidy clean on the diff;
    #      warnings-as-errors build green") ----
    _bool_check(results, "tooling_and_warnings",
                "clang_tidy_run_in_loop",
                manifest, ("tooling", "clang_tidy_run"),
                "method step 6: clang-tidy is in the loop")
    _bool_check(results, "tooling_and_warnings",
                "clang_tidy_clean_on_diff",
                manifest, ("tooling", "clang_tidy_clean_on_diff"),
                "quality gate: clang-tidy is clean on the diff")
    _bool_check(results, "tooling_and_warnings",
                "clang_format_applied",
                manifest, ("tooling", "clang_format_applied"),
                "method step 6: clang-format is applied")
    _bool_check(results, "tooling_and_warnings",
                "warnings_treated_as_errors",
                manifest, ("tooling", "warnings_treated_as_errors"),
                "method step 6: warnings are treated as errors")
    warn_count, has_warn_count = _get(manifest, "tooling",
                                      "warning_count")
    warn_is_number = has_warn_count and _is_number(warn_count)
    _check(results, "tooling_and_warnings", "zero_warnings_maintained",
           warn_count, warn_is_number,
           warn_is_number and warn_count == 0,
           "method step 6 / quality gate: zero warnings "
           "maintained — warnings-as-errors build green")

    # ---- Section 7: sanitizers (skill method step 6:
    #      "ASan/UBSan/TSan test builds"; quality gate:
    #      "Sanitizer-clean test run") ----
    _bool_check(results, "sanitizers", "asan_enabled_in_test_builds",
                manifest, ("sanitizers", "asan_enabled_in_test_builds"),
                "method step 6: ASan is enabled in test builds")
    _bool_check(results, "sanitizers", "ubsan_enabled_in_test_builds",
                manifest, ("sanitizers", "ubsan_enabled_in_test_builds"),
                "method step 6: UBSan is enabled in test builds")
    _bool_check(results, "sanitizers", "tsan_enabled_in_test_builds",
                manifest, ("sanitizers", "tsan_enabled_in_test_builds"),
                "method step 6: TSan is enabled in test builds")
    _bool_check(results, "sanitizers", "sanitizer_clean_test_run",
                manifest, ("sanitizers", "sanitizer_clean_test_run"),
                "quality gate: the test run is sanitizer-clean")

    # ---- Section 8: safety_red_lines (skill red lines: "No
    #      dangling references across async boundaries"; "No
    #      macros where language features exist") ----
    _false_check(results, "safety_red_lines",
                 "no_dangling_references_across_async_boundaries",
                 manifest,
                 ("safety", "dangling_references_across_async_boundaries"),
                 "red line: no dangling references across async "
                 "boundaries")
    _false_check(results, "safety_red_lines",
                 "no_macros_where_language_features_exist",
                 manifest,
                 ("safety", "macros_used_where_language_features_exist"),
                 "red line: no macros where language features exist")

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
                          "no_forbidden_constructs_present")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "cpp-engineering-review",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "warning_count": warn_count if warn_is_number else None,
        "forbidden_constructs_found": forbidden_found,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "CPP ENGINEERING REVIEW",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: cpp_engineering_review.py <manifest.json>",
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
