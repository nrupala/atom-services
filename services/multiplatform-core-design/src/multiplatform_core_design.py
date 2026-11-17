#!/usr/bin/env python3
"""Multiplatform core design — deterministic core.

Built from the bound skill `multiplatform-engineering`:
"Designs one portable core with many thin surfaces — shared
logic and data model, native-feeling apps on each platform."

This atom is an AUDIT of a declared multiplatform design
record: it validates the record a caller declares against the
skill's sections — the portable core architecture, the surfaces
and thin adapters, local-first and portability discipline,
packaging and testing, and the anti-pattern red lines. It does
not inspect a codebase, build any surface, run any test, or
verify that a declared core actually is portable — it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits a multiplatform manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- surfaces: the declared `surfaces` list must be non-empty, and
  every declared surface row must declare a kind from the
  skill's own surface set (web_pwa / mobile / desktop_cli /
  api), consume the one core contract, isolate its
  platform-specific code, and not reimplement core logic.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no code-sharing
percentage, no number of surfaces, no core test-coverage
percentage, no binary size, no sync latency — so no numeric
threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared surface) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> MULTIPLATFORM_CORE_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> MULTIPLATFORM_CORE_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "core_architecture",
    "surfaces_and_thin_adapters",
    "local_first_and_portability",
    "packaging_and_testing",
    "anti_pattern_red_lines",
)

SURFACE_KINDS = ("web_pwa", "mobile", "desktop_cli", "api")

MANIFEST_SPEC = {
    "project": "string",
    "core": {
        "core_holds_logic": "boolean",
        "core_holds_crypto": "boolean",
        "core_holds_data_model": "boolean",
        "core_in_portable_language": "boolean",
        "single_internal_api_defined": "boolean",
    },
    "web": {
        "web_installable": "boolean",
        "web_offline_capable_service_worker": "boolean",
        "web_responsive": "boolean",
    },
    "mobile": {
        "mobile_pwa_first_where_sufficient": "boolean",
        "mobile_native_only_when_truly_needed": "boolean",
    },
    "desktop_cli": {
        "desktop_single_static_binary_where_possible": "boolean",
        "cli_good_help": "boolean",
        "cli_correct_exit_codes": "boolean",
        "cli_pipe_friendly_output": "boolean",
    },
    "api": {
        "api_one_typed_contract": "boolean",
    },
    "surfaces": [{
        "name": "string",
        "kind": "string",
        "consumes_core_contract": "boolean",
        "platform_code_isolated": "boolean",
        "core_logic_reimplemented": "boolean",
    }],
    "local_first": {
        "source_of_truth_on_device": "boolean",
        "sync_is_enhancement_not_requirement": "boolean",
        "user_data_and_keys_stay_on_device_hardware": "boolean",
    },
    "portability": {
        "platform_specific_code_behind_interfaces": "boolean",
        "per_platform_forks_minimized": "boolean",
        "one_design_system_across_surfaces": "boolean",
        "each_platform_conventions_respected": "boolean",
    },
    "packaging": {
        "reproducible_builds": "boolean",
        "signed_builds": "boolean",
        "docker_used": "boolean",
        "distribution_route_decided_per_surface": "boolean",
    },
    "testing": {
        "shared_core_tested_thoroughly_once": "boolean",
        "each_surface_smoke_tested": "boolean",
    },
    "red_lines": {
        "core_logic_rewritten_per_platform_present": "boolean",
        "lowest_common_denominator_ux_present": "boolean",
        "platform_conventions_ignored_present": "boolean",
        "online_only_where_offline_matters_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a multiplatform design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    surfaces, has_surfaces = _get(manifest, "surfaces")
    surfaces_is_list = has_surfaces and isinstance(surfaces, list)
    surfaces_count = len(surfaces) if surfaces_is_list else None
    rows = surfaces if surfaces_is_list else []

    surfaces_with_invalid_kind = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "kind" in c
         and c.get("kind") not in SURFACE_KINDS]
        if surfaces_is_list else None
    )
    surfaces_not_consuming_core_contract = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "consumes_core_contract" in c
         and c.get("consumes_core_contract") is not True]
        if surfaces_is_list else None
    )
    surfaces_without_isolated_platform_code = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "platform_code_isolated" in c
         and c.get("platform_code_isolated") is not True]
        if surfaces_is_list else None
    )
    surfaces_reimplementing_core_logic = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "core_logic_reimplemented" in c
         and c.get("core_logic_reimplemented") is not False]
        if surfaces_is_list else None
    )
    valid_kind_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("kind") in SURFACE_KINDS)
        / surfaces_count
        if surfaces_is_list and surfaces_count > 0 else None
    )
    core_contract_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("consumes_core_contract") is True)
        / surfaces_count
        if surfaces_is_list and surfaces_count > 0 else None
    )
    isolated_platform_code_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("platform_code_isolated") is True)
        / surfaces_count
        if surfaces_is_list and surfaces_count > 0 else None
    )
    no_core_reimplementation_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("core_logic_reimplemented") is False)
        / surfaces_count
        if surfaces_is_list and surfaces_count > 0 else None
    )

    # ---- Section 1: core_architecture (skill Architecture —
    #      a portable core holds logic, crypto and the data
    #      model; one internal API the core exposes) ----
    _bool_check(results, "core_architecture",
                "core_holds_logic", manifest,
                ("core", "core_holds_logic"),
                "core architecture: the portable core holds the logic")
    _bool_check(results, "core_architecture",
                "core_holds_crypto", manifest,
                ("core", "core_holds_crypto"),
                "core architecture: the portable core holds the crypto")
    _bool_check(results, "core_architecture",
                "core_holds_data_model", manifest,
                ("core", "core_holds_data_model"),
                "core architecture: the portable core holds the data model")
    _bool_check(results, "core_architecture",
                "core_in_portable_language", manifest,
                ("core", "core_in_portable_language"),
                "core architecture: the core is in a portable language")
    _bool_check(results, "core_architecture",
                "single_internal_api_defined", manifest,
                ("core", "single_internal_api_defined"),
                "core architecture: one internal API the core exposes is defined")

    # ---- Section 2: surfaces_and_thin_adapters (skill
    #      Surfaces — web/PWA installable, offline-capable and
    #      responsive; mobile PWA-first, native when truly
    #      needed; desktop/CLI single static binary, good help,
    #      correct exit codes, pipe-friendly; API one typed
    #      contract; every surface a thin adapter consuming the
    #      same contract) ----
    _bool_check(results, "surfaces_and_thin_adapters",
                "web_installable", manifest,
                ("web", "web_installable"),
                "surfaces: the web / PWA surface is installable")
    _bool_check(results, "surfaces_and_thin_adapters",
                "web_offline_capable_service_worker", manifest,
                ("web", "web_offline_capable_service_worker"),
                "surfaces: the web / PWA surface is offline-capable via a service worker")
    _bool_check(results, "surfaces_and_thin_adapters",
                "web_responsive", manifest,
                ("web", "web_responsive"),
                "surfaces: the web / PWA surface is responsive")
    _bool_check(results, "surfaces_and_thin_adapters",
                "mobile_pwa_first_where_sufficient", manifest,
                ("mobile", "mobile_pwa_first_where_sufficient"),
                "surfaces: mobile is PWA-first where it suffices")
    _bool_check(results, "surfaces_and_thin_adapters",
                "mobile_native_only_when_truly_needed", manifest,
                ("mobile", "mobile_native_only_when_truly_needed"),
                "surfaces: mobile is native / APK only when truly needed")
    _bool_check(results, "surfaces_and_thin_adapters",
                "desktop_single_static_binary_where_possible", manifest,
                ("desktop_cli", "desktop_single_static_binary_where_possible"),
                "surfaces: desktop / CLI is a single static binary where possible")
    _bool_check(results, "surfaces_and_thin_adapters",
                "cli_good_help", manifest,
                ("desktop_cli", "cli_good_help"),
                "surfaces: the CLI has good --help")
    _bool_check(results, "surfaces_and_thin_adapters",
                "cli_correct_exit_codes", manifest,
                ("desktop_cli", "cli_correct_exit_codes"),
                "surfaces: the CLI uses correct exit codes")
    _bool_check(results, "surfaces_and_thin_adapters",
                "cli_pipe_friendly_output", manifest,
                ("desktop_cli", "cli_pipe_friendly_output"),
                "surfaces: the CLI output is pipe-friendly")
    _bool_check(results, "surfaces_and_thin_adapters",
                "api_one_typed_contract", manifest,
                ("api", "api_one_typed_contract"),
                "surfaces: the API is one typed contract any surface consumes")
    _check(results, "surfaces_and_thin_adapters",
           "surfaces_declared", surfaces, surfaces_is_list,
           surfaces_is_list and surfaces_count > 0,
           "the declared record names its surfaces — the surfaces "
           "list is present and non-empty")
    kind_present = (
        surfaces_is_list
        and all(isinstance(c, dict) and "kind" in c for c in rows)
    )
    _check(results, "surfaces_and_thin_adapters",
           "every_surface_kind_valid", surfaces, kind_present,
           surfaces_is_list and surfaces_count > 0
           and all(isinstance(c, dict)
                   and c.get("kind") in SURFACE_KINDS
                   for c in rows),
           "surfaces: every declared surface row declares a kind "
           "from the skill's set — web_pwa / mobile / desktop_cli / api")
    consumes_present = (
        surfaces_is_list
        and all(isinstance(c, dict) and "consumes_core_contract" in c
                for c in rows)
    )
    _check(results, "surfaces_and_thin_adapters",
           "every_surface_consumes_core_contract", surfaces,
           consumes_present,
           surfaces_is_list and surfaces_count > 0
           and all(isinstance(c, dict)
                   and c.get("consumes_core_contract") is True
                   for c in rows),
           "surfaces: every declared surface row consumes the same "
           "core contract — surfaces are thin adapters, not rewrites")
    isolated_present = (
        surfaces_is_list
        and all(isinstance(c, dict) and "platform_code_isolated" in c
                for c in rows)
    )
    _check(results, "surfaces_and_thin_adapters",
           "every_surface_platform_code_isolated", surfaces,
           isolated_present,
           surfaces_is_list and surfaces_count > 0
           and all(isinstance(c, dict)
                   and c.get("platform_code_isolated") is True
                   for c in rows),
           "surfaces: every declared surface row isolates its "
           "platform-specific code behind interfaces")
    reimpl_present = (
        surfaces_is_list
        and all(isinstance(c, dict)
                and "core_logic_reimplemented" in c for c in rows)
    )
    _check(results, "surfaces_and_thin_adapters",
           "no_surface_reimplements_core_logic", surfaces,
           reimpl_present,
           surfaces_is_list
           and surfaces_reimplementing_core_logic is not None
           and len(surfaces_reimplementing_core_logic) == 0,
           "surfaces: no declared surface row reimplements core "
           "logic — the core is shared, not rewritten per platform")

    # ---- Section 3: local_first_and_portability (skill
    #      Local-first / offline and Portability discipline —
    #      source of truth on the device, sync an enhancement,
    #      data and keys on the user's hardware; platform code
    #      behind interfaces, forks minimized, one design
    #      system, each platform's conventions respected) ----
    _bool_check(results, "local_first_and_portability",
                "source_of_truth_on_device", manifest,
                ("local_first", "source_of_truth_on_device"),
                "local-first: the source of truth is on the device")
    _bool_check(results, "local_first_and_portability",
                "sync_is_enhancement_not_requirement", manifest,
                ("local_first", "sync_is_enhancement_not_requirement"),
                "local-first: sync is an enhancement, not a requirement")
    _bool_check(results, "local_first_and_portability",
                "user_data_and_keys_stay_on_device_hardware", manifest,
                ("local_first", "user_data_and_keys_stay_on_device_hardware"),
                "local-first: the user's data and keys stay on their hardware")
    _bool_check(results, "local_first_and_portability",
                "platform_specific_code_behind_interfaces", manifest,
                ("portability", "platform_specific_code_behind_interfaces"),
                "portability discipline: platform-specific code is isolated behind interfaces")
    _bool_check(results, "local_first_and_portability",
                "per_platform_forks_minimized", manifest,
                ("portability", "per_platform_forks_minimized"),
                "portability discipline: per-platform forks are minimized")
    _bool_check(results, "local_first_and_portability",
                "one_design_system_across_surfaces", manifest,
                ("portability", "one_design_system_across_surfaces"),
                "portability discipline: one design system runs across surfaces")
    _bool_check(results, "local_first_and_portability",
                "each_platform_conventions_respected", manifest,
                ("portability", "each_platform_conventions_respected"),
                "portability discipline: each platform's conventions are respected")

    # ---- Section 4: packaging_and_testing (skill Packaging &
    #      distribution and Testing — reproducible, signed
    #      builds, no Docker, distribution route decided per
    #      surface; the shared core tested thoroughly once,
    #      each surface smoke-tested) ----
    _bool_check(results, "packaging_and_testing",
                "reproducible_builds", manifest,
                ("packaging", "reproducible_builds"),
                "packaging: builds are reproducible")
    _bool_check(results, "packaging_and_testing",
                "signed_builds", manifest,
                ("packaging", "signed_builds"),
                "packaging: builds are signed")
    _false_check(results, "packaging_and_testing",
                 "no_docker", manifest,
                 ("packaging", "docker_used"),
                 "packaging: no Docker is used")
    _bool_check(results, "packaging_and_testing",
                "distribution_route_decided_per_surface", manifest,
                ("packaging", "distribution_route_decided_per_surface"),
                "packaging: store vs sideload vs direct is decided per surface")
    _bool_check(results, "packaging_and_testing",
                "shared_core_tested_thoroughly_once", manifest,
                ("testing", "shared_core_tested_thoroughly_once"),
                "testing: the shared core is tested thoroughly once")
    _bool_check(results, "packaging_and_testing",
                "each_surface_smoke_tested", manifest,
                ("testing", "each_surface_smoke_tested"),
                "testing: each surface is smoke-tested for integration and platform quirks")

    # ---- Section 5: anti_pattern_red_lines (skill
    #      Anti-patterns to refuse — no core rewrite per
    #      platform, no lowest-common-denominator UX, no
    #      ignored platform conventions, no online-only where
    #      offline genuinely matters) ----
    _false_check(results, "anti_pattern_red_lines",
                 "no_core_logic_rewritten_per_platform", manifest,
                 ("red_lines", "core_logic_rewritten_per_platform_present"),
                 "red line: core logic is not rewritten per platform")
    _false_check(results, "anti_pattern_red_lines",
                 "no_lowest_common_denominator_ux", manifest,
                 ("red_lines", "lowest_common_denominator_ux_present"),
                 "red line: no lowest-common-denominator UX is shipped")
    _false_check(results, "anti_pattern_red_lines",
                 "no_platform_conventions_ignored", manifest,
                 ("red_lines", "platform_conventions_ignored_present"),
                 "red line: platform conventions are not ignored")
    _false_check(results, "anti_pattern_red_lines",
                 "no_online_only_where_offline_matters", manifest,
                 ("red_lines", "online_only_where_offline_matters_present"),
                 "red line: the design is not online-only where offline genuinely matters")

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
        verdict = "MULTIPLATFORM_CORE_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "MULTIPLATFORM_CORE_SOUND"

    computed_names = (
        "surfaces_declared",
        "every_surface_kind_valid",
        "every_surface_consumes_core_contract",
        "every_surface_platform_code_isolated",
        "no_surface_reimplements_core_logic",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "multiplatform-core-design",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "surfaces_count": surfaces_count,
        "surfaces_with_invalid_kind": surfaces_with_invalid_kind,
        "valid_kind_coverage": _fmt6(valid_kind_coverage),
        "surfaces_not_consuming_core_contract": surfaces_not_consuming_core_contract,
        "core_contract_coverage": _fmt6(core_contract_coverage),
        "surfaces_without_isolated_platform_code": surfaces_without_isolated_platform_code,
        "isolated_platform_code_coverage": _fmt6(isolated_platform_code_coverage),
        "surfaces_reimplementing_core_logic": surfaces_reimplementing_core_logic,
        "no_core_reimplementation_coverage": _fmt6(no_core_reimplementation_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "MULTIPLATFORM CORE DESIGN",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: multiplatform_core_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "MULTIPLATFORM_CORE_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
