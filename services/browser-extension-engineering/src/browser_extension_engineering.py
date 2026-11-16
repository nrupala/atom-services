#!/usr/bin/env python3
"""Browser extension engineering — deterministic core.

Built from the bound skill `browser-extension-engineering` (v1):
"Build browser extensions carefully — MV3 architecture,
least-privilege permissions, messaging, store review." This atom
audits one declared extension design/build manifest — a single
extension as its caller declares it — against the skill's seven
method steps, its four quality gates, and its red lines. It does
not write extension code, inspect a real extension package, or
verify that a declared value is true — it checks that the
declared design contains what the skill's method requires, on
the caller's declared evidence.

The caller submits a browser-extension-engineering manifest (a
dict, or JSON on the CLI). Every check reads declared manifest
fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
set logic of the declared lists — no outside threshold, no
permission vocabulary, and no browser vocabulary is imported
(the skill names no specific permission, host pattern, or
browser as passing or failing, so none is imposed):

- permission justification coverage (quality gate: "Each
  permission justified in writing"): when the manifest declares
  the requested permissions and the permissions justified in
  writing, every requested permission must appear in the
  justified list. Requested permissions with no written
  justification are reported as
  `permissions_without_justification` (null when either list is
  not declared). Justifications for permissions that were not
  requested do not count against the design. An empty requested
  list passes vacuously — an extension may request no
  permissions at all.
- cross-browser coverage (quality gate: "Works across target
  browsers (or differences documented)"): when the manifest
  declares target browsers, tested browsers, and browsers whose
  differences are documented, every target browser must appear
  in the tested list or the difference-documented list, and at
  least one target browser must be declared. Target browsers in
  neither list are reported as `browsers_not_covered` (null when
  any of the three lists is not declared).

The computed outcome over the two computed checks is reported
as `computed_status`.

Verdict:
- any fail             -> EXTENSION_DESIGN_DEFICIENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> EXTENSION_DESIGN_SOUND

This is a completeness and consistency audit over declared
evidence, not a code or store review: a design that declares
every step passes even if a declaration is mistaken, and
nothing here verifies that a declared value is true, that a
permission is actually needed, or that a store will accept the
extension.

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import sys

SECTIONS = (
    "mv3_architecture",
    "least_privilege_permissions",
    "architecture_and_messaging",
    "ux_honesty",
    "privacy",
    "distribution_and_cross_browser",
    "security",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the permission and browser list entries)
# are validated as strings only, never enum-checked: coverage is
# a verdict check, not a type error — the skill names no specific
# permission or browser, so none is imposed.
MANIFEST_SPEC = {
    "extension_name": "string",
    "mv3": {
        "service_worker_background": "boolean",
        "persistent_background_page_used": "boolean",
        "alarms_used_instead_of_timers": "boolean",
        "declarative_apis_used_where_possible": "boolean",
        "remote_code_executed": "boolean",
        "all_code_bundled": "boolean",
    },
    "permissions": {
        "only_needed_requested": "boolean",
        "host_patterns_narrow": "boolean",
        "optional_permissions_for_power_features": "boolean",
        "permission_list_reviewed_as_security_audit": "boolean",
        "overbroad_permissions_present": "boolean",
        "requested": ["string"],
        "justified": ["string"],
    },
    "architecture": {
        "content_scripts_isolated_from_page_context": "boolean",
        "message_passing_well_defined": "boolean",
        "messages_validated_on_both_ends": "boolean",
        "storage_scoped_sync_vs_local": "boolean",
        "secrets_stored_in_extension_storage": "boolean",
    },
    "ux": {
        "popup_or_options_pages_provided": "boolean",
        "logged_out_and_unavailable_states_provided": "boolean",
        "keyboard_shortcuts_provided": "boolean",
        "drive_by_dom_changes_without_user_intent": "boolean",
    },
    "privacy": {
        "page_data_processed_locally_by_default": "boolean",
        "telemetry_requires_explicit_consent": "boolean",
        "telemetry_clearly_disclosed": "boolean",
        "privacy_disclosure_matches_behavior_tested": "boolean",
        "browsing_data_exfiltrated": "boolean",
        "hidden_data_collection_present": "boolean",
    },
    "distribution": {
        "store_listing_screenshots_provided": "boolean",
        "store_privacy_form_accurate": "boolean",
        "staged_rollout_planned": "boolean",
        "version_discipline_followed": "boolean",
        "firefox_mv3_differences_addressed": "boolean",
        "target_browsers": ["string"],
        "tested_browsers": ["string"],
        "difference_documented_browsers": ["string"],
    },
    "security": {
        "csp_discipline_followed": "boolean",
        "injected_ui_sanitized": "boolean",
        "auto_update_via_store_only": "boolean",
        "eval_or_remote_scripts_used": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a browser-extension manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: mv3_architecture (skill method step 1:
    #      "MV3 reality: service-worker background (no persistent
    #      page), alarms instead of timers, declarative APIs where
    #      possible; no remote code execution — bundle
    #      everything") ----
    _bool_check(results, "mv3_architecture", "service_worker_background",
                manifest, ("mv3", "service_worker_background"),
                "method step 1: the background is a service worker")
    _false_check(results, "mv3_architecture",
                 "no_persistent_background_page",
                 manifest, ("mv3", "persistent_background_page_used"),
                 "method step 1: no persistent background page is "
                 "used")
    _bool_check(results, "mv3_architecture",
                "alarms_used_instead_of_timers",
                manifest, ("mv3", "alarms_used_instead_of_timers"),
                "method step 1: alarms are used instead of timers")
    _bool_check(results, "mv3_architecture",
                "declarative_apis_used_where_possible",
                manifest,
                ("mv3", "declarative_apis_used_where_possible"),
                "method step 1: declarative APIs are used where "
                "possible")
    _false_check(results, "mv3_architecture", "no_remote_code_execution",
                 manifest, ("mv3", "remote_code_executed"),
                 "method step 1: no remote code execution — "
                 "everything is bundled")
    _bool_check(results, "mv3_architecture", "all_code_bundled",
                manifest, ("mv3", "all_code_bundled"),
                "method step 1: all code is bundled with the "
                "extension")

    # ---- Section 2: least_privilege_permissions (skill method
    #      step 2: "Least privilege: request only needed
    #      permissions; narrow host patterns; optional permissions
    #      for power features; review the permission list like a
    #      security audit — reviewers do"; quality gate: "Each
    #      permission justified in writing; host patterns
    #      minimal"; red line: "No overbroad permissions") ----
    _bool_check(results, "least_privilege_permissions",
                "only_needed_permissions_requested",
                manifest, ("permissions", "only_needed_requested"),
                "method step 2: only needed permissions are "
                "requested")
    _bool_check(results, "least_privilege_permissions",
                "host_patterns_narrow",
                manifest, ("permissions", "host_patterns_narrow"),
                "method step 2 / quality gate: host patterns are "
                "narrow / minimal")
    _bool_check(results, "least_privilege_permissions",
                "optional_permissions_for_power_features",
                manifest,
                ("permissions",
                 "optional_permissions_for_power_features"),
                "method step 2: power features use optional "
                "permissions")
    _bool_check(results, "least_privilege_permissions",
                "permission_list_reviewed_as_security_audit",
                manifest,
                ("permissions",
                 "permission_list_reviewed_as_security_audit"),
                "method step 2: the permission list is reviewed "
                "like a security audit")
    _false_check(results, "least_privilege_permissions",
                 "no_overbroad_permissions",
                 manifest,
                 ("permissions", "overbroad_permissions_present"),
                 "red line: no overbroad permissions")
    requested, has_requested = _get(manifest, "permissions", "requested")
    justified, has_justified = _get(manifest, "permissions", "justified")
    both_lists = (
        has_requested and has_justified
        and isinstance(requested, list) and isinstance(justified, list)
    )
    without_justification = (
        [p for p in requested if p not in justified]
        if both_lists else None
    )
    _check(results, "least_privilege_permissions",
           "all_requested_permissions_justified_in_writing", requested,
           both_lists,
           both_lists and len(without_justification) == 0,
           "quality gate: each permission is justified in writing "
           "— every declared requested permission appears in the "
           "declared justified-in-writing list")

    # ---- Section 3: architecture_and_messaging (skill method
    #      step 3: "Architecture: content scripts isolated from
    #      page context; well-defined message passing (validate
    #      messages on both ends); storage scoped (storage.sync
    #      vs local), no secrets in extension storage"; quality
    #      gate: "Messaging validated") ----
    _bool_check(results, "architecture_and_messaging",
                "content_scripts_isolated_from_page_context",
                manifest,
                ("architecture",
                 "content_scripts_isolated_from_page_context"),
                "method step 3: content scripts are isolated from "
                "page context")
    _bool_check(results, "architecture_and_messaging",
                "message_passing_well_defined",
                manifest,
                ("architecture", "message_passing_well_defined"),
                "method step 3: message passing is well-defined")
    _bool_check(results, "architecture_and_messaging",
                "messages_validated_on_both_ends",
                manifest,
                ("architecture", "messages_validated_on_both_ends"),
                "method step 3 / quality gate: messages are "
                "validated on both ends")
    _bool_check(results, "architecture_and_messaging", "storage_scoped",
                manifest,
                ("architecture", "storage_scoped_sync_vs_local"),
                "method step 3: storage is scoped — storage.sync "
                "vs local chosen deliberately")
    _false_check(results, "architecture_and_messaging",
                 "no_secrets_in_extension_storage",
                 manifest,
                 ("architecture", "secrets_stored_in_extension_storage"),
                 "method step 3: no secrets are kept in extension "
                 "storage")

    # ---- Section 4: ux_honesty (skill method step 4: "UX
    #      honesty: popup/options pages; states for
    #      logged-out/unavailable; no drive-by DOM changes without
    #      user intent; keyboard shortcuts") ----
    _bool_check(results, "ux_honesty", "popup_or_options_pages_provided",
                manifest, ("ux", "popup_or_options_pages_provided"),
                "method step 4: popup / options pages are provided")
    _bool_check(results, "ux_honesty",
                "logged_out_and_unavailable_states_provided",
                manifest,
                ("ux", "logged_out_and_unavailable_states_provided"),
                "method step 4: states for logged-out / "
                "unavailable are provided")
    _bool_check(results, "ux_honesty", "keyboard_shortcuts_provided",
                manifest, ("ux", "keyboard_shortcuts_provided"),
                "method step 4: keyboard shortcuts are provided")
    _false_check(results, "ux_honesty",
                 "no_drive_by_dom_changes_without_user_intent",
                 manifest,
                 ("ux", "drive_by_dom_changes_without_user_intent"),
                 "method step 4: no drive-by DOM changes without "
                 "user intent")

    # ---- Section 5: privacy (skill method step 5: "Privacy:
    #      process page data locally by default; explicit consent
    #      + clear disclosure for any telemetry; never exfiltrate
    #      browsing data"; quality gate: "Privacy disclosure
    #      matches actual behavior (tested)"; red line: "no
    #      hidden data collection") ----
    _bool_check(results, "privacy",
                "page_data_processed_locally_by_default",
                manifest,
                ("privacy", "page_data_processed_locally_by_default"),
                "method step 5: page data is processed locally by "
                "default")
    _bool_check(results, "privacy", "telemetry_requires_explicit_consent",
                manifest,
                ("privacy", "telemetry_requires_explicit_consent"),
                "method step 5: any telemetry requires explicit "
                "consent")
    _bool_check(results, "privacy", "telemetry_clearly_disclosed",
                manifest, ("privacy", "telemetry_clearly_disclosed"),
                "method step 5: any telemetry is clearly disclosed")
    _bool_check(results, "privacy",
                "privacy_disclosure_matches_actual_behavior_tested",
                manifest,
                ("privacy",
                 "privacy_disclosure_matches_behavior_tested"),
                "quality gate: the privacy disclosure matches "
                "actual behavior, tested")
    _false_check(results, "privacy", "browsing_data_never_exfiltrated",
                 manifest, ("privacy", "browsing_data_exfiltrated"),
                 "method step 5: browsing data is never exfiltrated")
    _false_check(results, "privacy", "no_hidden_data_collection",
                 manifest, ("privacy", "hidden_data_collection_present"),
                 "red line: no hidden data collection")

    # ---- Section 6: distribution_and_cross_browser (skill
    #      method step 6: "Distribution: store listings
    #      (screenshots, privacy form accurate), staged rollout,
    #      version discipline; Firefox MV3 differences (browser.*
    #      shim)"; quality gate: "Works across target browsers
    #      (or differences documented)") ----
    _bool_check(results, "distribution_and_cross_browser",
                "store_listing_screenshots_provided",
                manifest,
                ("distribution", "store_listing_screenshots_provided"),
                "method step 6: the store listing includes "
                "screenshots")
    _bool_check(results, "distribution_and_cross_browser",
                "store_privacy_form_accurate",
                manifest,
                ("distribution", "store_privacy_form_accurate"),
                "method step 6: the store privacy form is accurate")
    _bool_check(results, "distribution_and_cross_browser",
                "staged_rollout_planned",
                manifest, ("distribution", "staged_rollout_planned"),
                "method step 6: distribution uses a staged rollout")
    _bool_check(results, "distribution_and_cross_browser",
                "version_discipline_followed",
                manifest,
                ("distribution", "version_discipline_followed"),
                "method step 6: version discipline is followed")
    _bool_check(results, "distribution_and_cross_browser",
                "firefox_mv3_differences_addressed",
                manifest,
                ("distribution", "firefox_mv3_differences_addressed"),
                "method step 6: Firefox MV3 differences are "
                "addressed (browser.* shim)")
    targets, has_targets = _get(
        manifest, "distribution", "target_browsers")
    tested, has_tested = _get(manifest, "distribution", "tested_browsers")
    documented, has_documented = _get(
        manifest, "distribution", "difference_documented_browsers")
    all_lists = (
        has_targets and has_tested and has_documented
        and isinstance(targets, list) and isinstance(tested, list)
        and isinstance(documented, list)
    )
    not_covered = (
        [b for b in targets if b not in tested and b not in documented]
        if all_lists else None
    )
    _check(results, "distribution_and_cross_browser",
           "all_target_browsers_tested_or_differences_documented",
           targets, all_lists,
           all_lists and len(targets) > 0 and len(not_covered) == 0,
           "quality gate: the extension works across target "
           "browsers, or differences are documented — every "
           "declared target browser appears in the declared "
           "tested list or the declared difference-documented "
           "list, and at least one target browser is declared")

    # ---- Section 7: security (skill method step 7: "Security:
    #      CSP discipline; sanitize any injected UI; auto-update
    #      via store only"; quality gate: "no remote code
    #      anywhere"; red line: "no eval / remote scripts") ----
    _bool_check(results, "security", "csp_discipline_followed",
                manifest, ("security", "csp_discipline_followed"),
                "method step 7: CSP discipline is followed")
    _bool_check(results, "security", "injected_ui_sanitized",
                manifest, ("security", "injected_ui_sanitized"),
                "method step 7: any injected UI is sanitized")
    _bool_check(results, "security", "auto_update_via_store_only",
                manifest, ("security", "auto_update_via_store_only"),
                "method step 7: auto-update is via the store only")
    _false_check(results, "security", "no_eval_or_remote_scripts",
                 manifest, ("security", "eval_or_remote_scripts_used"),
                 "red line: no eval / remote scripts")

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
        verdict = "EXTENSION_DESIGN_DEFICIENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "EXTENSION_DESIGN_SOUND"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "all_requested_permissions_justified_in_writing",
            "all_target_browsers_tested_or_differences_documented")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "browser-extension-engineering",
        "atom_version": "0.1.0",
        "extension_name": manifest.get("extension_name"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "permissions_without_justification": without_justification,
        "browsers_not_covered": not_covered,
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
        "BROWSER EXTENSION ENGINEERING",
        f"extension: {verdict.get('extension_name')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: browser_extension_engineering.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "EXTENSION_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
