#!/usr/bin/env python3
"""Framework adoption ADR — deterministic core.

Built from the bound skill `framework-discipline`: "Frameworks
accelerate and entangle in equal measure. Choose them
deliberately, keep the core free of them, and always know the
exit."

This atom is an AUDIT of a declared framework-adoption ADR
record: it validates the record a caller declares against the
skill's method sections — choose by fit, conform to the house
stack, framework-free core, pin and plan upgrades, avoid magic,
plugin discipline, deprecations — plus its quality gates and red
lines. It does not choose a framework, write the ADR, inspect a
codebase for framework imports, or verify that a declared control
actually works — it checks that the adoption record the skill
requires is present and internally complete and consistent on
the declared evidence.

Distinct ground vs the sibling `architecture-decision-record`
atom: that atom audits a GENERAL ADR for completeness (NFRs,
boundaries/contracts, a 2-3 alternatives range with trade-offs,
ADR format/numbering/one-page limit, reversibility, supersession).
This atom audits only the decision to TAKE ON A FRAMEWORK: the
five named fit criteria from this skill's method step 1, the
adoption ADR's alternatives + exit-cost statement, house-stack
conformity, framework-free core, version pinning and major-
upgrade planning, runtime explicitness, plugin discipline and
deprecation handling. No check here duplicates a sibling check:
no alternatives count range, no trade-offs/serious flags, no ADR
format, page-count, NFR, boundary, contract or supersession check.

The caller submits a framework-adoption manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- candidates: the declared `candidates` list must be non-empty,
  every candidate row must name its framework, every candidate
  row must declare all five fit criteria assessed (team
  familiarity, maintenance health, ecosystem, performance, exit
  cost — skill method step 1), and exactly one candidate row
  may be declared selected (an adoption ADR decides one
  framework; zero or several selected rows are internally
  inconsistent on the declared evidence);
- plugins: when plugins are declared present, every declared
  plugin row must declare itself reviewed and pinned (skill:
  "plugins are dependencies — review, pin, and remove unused
  ones").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no exit-cost amount, no
fit score, no upgrade cadence, no deprecation window — so no
numeric threshold check is invented; fit quality and exit-cost
size are caller declarations, and quantities are computed and
reported, with completeness (every declared row) as the only
bar, exactly as stated above.

Verdict:
- any fail             -> FRAMEWORK_ADOPTION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FRAMEWORK_ADOPTION_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "adr_and_fit",
    "house_stack_and_core",
    "pinning_and_upgrades",
    "explicitness_and_runtime",
    "plugins_and_deprecations",
)

FIT_FIELDS = (
    "team_familiarity_assessed",
    "maintenance_health_assessed",
    "ecosystem_assessed",
    "performance_assessed",
    "exit_cost_assessed",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "framework": "string",
    "adr": {
        "logged": "boolean",
        "alternatives_stated": "boolean",
        "exit_cost_stated": "boolean",
    },
    "candidates": [{
        "name": "string",
        "team_familiarity_assessed": "boolean",
        "maintenance_health_assessed": "boolean",
        "ecosystem_assessed": "boolean",
        "performance_assessed": "boolean",
        "exit_cost_assessed": "boolean",
        "selected": "boolean",
    }],
    "house_stack": {
        "one_framework_per_layer": "boolean",
        "core_logic_imports_no_framework_code": "boolean",
        "framework_at_edges_ports_adapters": "boolean",
        "is_mid_project_change": "boolean",
        "migration_plan_documented": "boolean",
        "migration_plan_approved": "boolean",
    },
    "versions": {
        "exact_versions_pinned": "boolean",
        "unpinned_latest_in_production_present": "boolean",
        "changelogs_read": "boolean",
        "updates_batched": "boolean",
        "major_upgrade_planned": "boolean",
        "major_upgrade_written_plan": "boolean",
        "major_upgrade_full_suite_run": "boolean",
    },
    "runtime": {
        "explicit_configuration_preferred": "boolean",
        "runtime_behaviour_understood": "boolean",
        "lifecycle_understood": "boolean",
        "dependency_injection_understood": "boolean",
        "caching_behaviour_understood": "boolean",
        "deprecated_apis_on_hot_path_present": "boolean",
    },
    "plugins": {
        "plugins_present": "boolean",
        "plugins_treated_as_dependencies": "boolean",
        "unused_plugins_removed": "boolean",
        "items": [{
            "name": "string",
            "reviewed": "boolean",
            "pinned": "boolean",
        }],
    },
    "deprecations": {
        "warnings_tracked": "boolean",
        "migrations_scheduled": "boolean",
        "zombie_code_paths_present": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


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


def _nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def _fit_complete(entry):
    return (
        isinstance(entry, dict)
        and all(entry.get(f) is True for f in FIT_FIELDS)
    )


def evaluate(manifest):
    """Return the verdict dict for a framework-adoption manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    candidates, has_candidates = _get(manifest, "candidates")
    candidates_is_list = has_candidates and isinstance(candidates, list)
    candidates_count = len(candidates) if candidates_is_list else None
    rows = candidates if candidates_is_list else []

    candidates_without_name = (
        [_row_name(c) for c in rows if not _nonempty_str(c, "name")]
        if candidates_is_list else None
    )
    fit_rows = [c for c in rows if _fit_complete(c)]
    candidates_without_fit_assessment = (
        [_row_name(c) for c in rows
         if any(f in c for f in FIT_FIELDS) and not _fit_complete(c)]
        if candidates_is_list else None
    )
    fit_assessment_coverage = (
        len(fit_rows) / candidates_count
        if candidates_is_list and candidates_count > 0 else None
    )
    selected_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("selected") is True
    ]
    selected_count = len(selected_rows) if candidates_is_list else None
    selected_candidate = (
        selected_rows[0]["name"]
        if len(selected_rows) == 1
        and _nonempty_str(selected_rows[0], "name") else None
    )

    plugin_items, has_plugin_items = _get(manifest, "plugins", "items")
    plugins_is_list = has_plugin_items and isinstance(plugin_items, list)
    plugins_count = len(plugin_items) if plugins_is_list else None
    prows = plugin_items if plugins_is_list else []
    compliant_prows = [
        c for c in prows
        if isinstance(c, dict)
        and c.get("reviewed") is True and c.get("pinned") is True
    ]
    plugins_without_review_or_pin = (
        [_row_name(c) for c in prows
         if ("reviewed" in c or "pinned" in c)
         and not (c.get("reviewed") is True and c.get("pinned") is True)]
        if plugins_is_list else None
    )
    plugin_compliance_coverage = (
        len(compliant_prows) / plugins_count
        if plugins_is_list and plugins_count > 0 else None
    )

    # ---- Section 1: adr_and_fit (skill: when to use — introducing
    #      a framework into an existing codebase requires an ADR;
    #      quality gate — new framework = logged ADR (alternatives
    #      + exit cost). Method step 1 — choose by fit: team
    #      familiarity, maintenance health, ecosystem, performance,
    #      and exit cost) ----
    _bool_check(results, "adr_and_fit",
                "adr_logged_for_new_framework", manifest,
                ("adr", "logged"),
                "quality gate: the new framework has a logged ADR")
    _bool_check(results, "adr_and_fit",
                "adr_states_alternatives", manifest,
                ("adr", "alternatives_stated"),
                "quality gate: the adoption ADR states the "
                "alternatives considered")
    _bool_check(results, "adr_and_fit",
                "adr_states_exit_cost", manifest,
                ("adr", "exit_cost_stated"),
                "quality gate: the adoption ADR states the exit "
                "cost of taking on this framework")
    _check(results, "adr_and_fit",
           "candidates_declared", candidates, candidates_is_list,
           candidates_is_list and candidates_count > 0,
           "choose by fit: the declared record names its candidate "
           "frameworks — the candidates list is present and "
           "non-empty")
    name_present = (
        candidates_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "adr_and_fit",
           "every_candidate_names_framework", candidates,
           name_present,
           candidates_is_list and candidates_count > 0
           and len(candidates_without_name) == 0,
           "choose by fit: every declared candidate row names its "
           "framework — a non-empty name string")
    fit_present = (
        candidates_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in FIT_FIELDS) for c in rows)
    )
    _check(results, "adr_and_fit",
           "every_candidate_fit_fully_assessed", candidates,
           fit_present,
           candidates_is_list and candidates_count > 0
           and len(fit_rows) == candidates_count,
           "choose by fit: every declared candidate row declares "
           "all five fit criteria assessed — team familiarity, "
           "maintenance health, ecosystem, performance, exit cost")
    selected_present = (
        candidates_is_list
        and all(isinstance(c, dict) and "selected" in c for c in rows)
    )
    _check(results, "adr_and_fit",
           "exactly_one_candidate_selected", candidates,
           selected_present,
           candidates_is_list and len(selected_rows) == 1,
           "choose by fit: exactly one declared candidate row is "
           "selected — an adoption ADR decides one framework")

    # ---- Section 2: house_stack_and_core (skill: method step 2 —
    #      conform to the house stack: one framework per layer;
    #      don't mix directions mid-project (change = ADR +
    #      migration plan). Method step 3 / quality gate —
    #      framework-free core: business logic in plain
    #      functions/modules; the framework sits at the edges
    #      (ports & adapters); core logic imports no framework
    #      code. Red line — no framework-hopping mid-project
    #      without an approved migration plan) ----
    _bool_check(results, "house_stack_and_core",
                "one_framework_per_layer", manifest,
                ("house_stack", "one_framework_per_layer"),
                "house stack: one framework per layer")
    _bool_check(results, "house_stack_and_core",
                "core_logic_imports_no_framework_code", manifest,
                ("house_stack", "core_logic_imports_no_framework_code"),
                "framework-free core / quality gate: core logic "
                "imports no framework code")
    _bool_check(results, "house_stack_and_core",
                "framework_at_edges_ports_adapters", manifest,
                ("house_stack", "framework_at_edges_ports_adapters"),
                "framework-free core: the framework sits at the "
                "edges (ports & adapters); business logic lives in "
                "plain functions/modules")
    _gated_bool_check(
        results, "house_stack_and_core",
        "mid_project_migration_plan_documented", manifest,
        ("house_stack", "is_mid_project_change"),
        ("house_stack", "migration_plan_documented"),
        "house stack: a mid-project framework change has a "
        "documented migration plan (change = ADR + migration plan)",
        "not a mid-project change")
    _gated_bool_check(
        results, "house_stack_and_core",
        "mid_project_migration_plan_approved", manifest,
        ("house_stack", "is_mid_project_change"),
        ("house_stack", "migration_plan_approved"),
        "red line: no framework-hopping mid-project without an "
        "approved migration plan — the plan is approved",
        "not a mid-project change")

    # ---- Section 3: pinning_and_upgrades (skill: method step 4 —
    #      pin and plan upgrades: exact versions; read changelogs;
    #      batch updates; use codemods; run the full suite; never
    #      jump majors blind. Quality gate — versions pinned;
    #      major upgrades have a written plan + full-suite run.
    #      Red line — no unpinned "latest" from CDNs or tags in
    #      production) ----
    _bool_check(results, "pinning_and_upgrades",
                "exact_versions_pinned", manifest,
                ("versions", "exact_versions_pinned"),
                "pin and plan upgrades / quality gate: versions "
                "are pinned exactly")
    _false_check(results, "pinning_and_upgrades",
                 "no_unpinned_latest_in_production", manifest,
                 ("versions", "unpinned_latest_in_production_present"),
                 "red line: no unpinned \"latest\" from CDNs or "
                 "tags in production")
    _bool_check(results, "pinning_and_upgrades",
                "changelogs_read_before_upgrades", manifest,
                ("versions", "changelogs_read"),
                "pin and plan upgrades: changelogs are read before "
                "upgrades")
    _bool_check(results, "pinning_and_upgrades",
                "updates_batched", manifest,
                ("versions", "updates_batched"),
                "pin and plan upgrades: updates are batched")
    _gated_bool_check(
        results, "pinning_and_upgrades",
        "major_upgrade_written_plan", manifest,
        ("versions", "major_upgrade_planned"),
        ("versions", "major_upgrade_written_plan"),
        "quality gate: a major upgrade has a written plan — "
        "never jump majors blind",
        "no major upgrade declared")
    _gated_bool_check(
        results, "pinning_and_upgrades",
        "major_upgrade_full_suite_run", manifest,
        ("versions", "major_upgrade_planned"),
        ("versions", "major_upgrade_full_suite_run"),
        "quality gate: a major upgrade has a full-suite run",
        "no major upgrade declared")

    # ---- Section 4: explicitness_and_runtime (skill: method
    #      step 5 — avoid magic: prefer explicit configuration;
    #      understand what the framework does at runtime
    #      (lifecycle, DI, caching). Quality gate — no deprecated
    #      APIs on the hot path) ----
    _bool_check(results, "explicitness_and_runtime",
                "explicit_configuration_preferred", manifest,
                ("runtime", "explicit_configuration_preferred"),
                "avoid magic: explicit configuration is preferred")
    _bool_check(results, "explicitness_and_runtime",
                "runtime_behaviour_understood", manifest,
                ("runtime", "runtime_behaviour_understood"),
                "avoid magic: what the framework does at runtime "
                "is understood")
    _bool_check(results, "explicitness_and_runtime",
                "lifecycle_understood", manifest,
                ("runtime", "lifecycle_understood"),
                "avoid magic: the framework lifecycle is understood")
    _bool_check(results, "explicitness_and_runtime",
                "dependency_injection_understood", manifest,
                ("runtime", "dependency_injection_understood"),
                "avoid magic: the framework's dependency injection "
                "is understood")
    _bool_check(results, "explicitness_and_runtime",
                "caching_behaviour_understood", manifest,
                ("runtime", "caching_behaviour_understood"),
                "avoid magic: the framework's caching behaviour is "
                "understood")
    _false_check(results, "explicitness_and_runtime",
                 "no_deprecated_apis_on_hot_path", manifest,
                 ("runtime", "deprecated_apis_on_hot_path_present"),
                 "quality gate: no deprecated APIs on the hot path")

    # ---- Section 5: plugins_and_deprecations (skill: method
    #      step 6 — plugin discipline: plugins are dependencies —
    #      review, pin, and remove unused ones. Method step 7 —
    #      deprecations: track warnings; migrate on schedule; no
    #      zombie code paths waiting to break) ----
    _bool_check(results, "plugins_and_deprecations",
                "plugins_treated_as_dependencies", manifest,
                ("plugins", "plugins_treated_as_dependencies"),
                "plugin discipline: plugins are treated as "
                "dependencies")
    plugins_gate, has_plugins_gate = _get(
        manifest, "plugins", "plugins_present")
    if has_plugins_gate and plugins_gate:
        plugin_rows_present = (
            plugins_is_list
            and all(isinstance(c, dict) and "reviewed" in c
                    and "pinned" in c for c in prows)
        )
        _check(results, "plugins_and_deprecations",
               "every_plugin_reviewed_and_pinned", plugin_items,
               plugin_rows_present,
               plugins_is_list and plugins_count > 0
               and len(compliant_prows) == plugins_count,
               "plugin discipline: every declared plugin row "
               "declares itself reviewed and pinned")
        _bool_check(results, "plugins_and_deprecations",
                    "unused_plugins_removed", manifest,
                    ("plugins", "unused_plugins_removed"),
                    "plugin discipline: unused plugins are removed")
    else:
        _check(results, "plugins_and_deprecations",
               "every_plugin_reviewed_and_pinned", plugins_gate,
               has_plugins_gate, True, "no plugins declared")
        _check(results, "plugins_and_deprecations",
               "unused_plugins_removed", plugins_gate,
               has_plugins_gate, True, "no plugins declared")
    _bool_check(results, "plugins_and_deprecations",
                "deprecation_warnings_tracked", manifest,
                ("deprecations", "warnings_tracked"),
                "deprecations: deprecation warnings are tracked")
    _bool_check(results, "plugins_and_deprecations",
                "deprecation_migrations_scheduled", manifest,
                ("deprecations", "migrations_scheduled"),
                "deprecations: deprecation migrations happen on "
                "schedule")
    _false_check(results, "plugins_and_deprecations",
                 "no_zombie_code_paths", manifest,
                 ("deprecations", "zombie_code_paths_present"),
                 "deprecations: no zombie code paths waiting to "
                 "break")

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
        verdict = "FRAMEWORK_ADOPTION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FRAMEWORK_ADOPTION_SOUND"

    computed_names = (
        "candidates_declared",
        "every_candidate_names_framework",
        "every_candidate_fit_fully_assessed",
        "exactly_one_candidate_selected",
        "every_plugin_reviewed_and_pinned",
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
        "service": "framework-adoption-adr",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "framework": manifest.get("framework"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "candidates_count": candidates_count,
        "candidates_without_name": candidates_without_name,
        "candidates_without_fit_assessment":
            candidates_without_fit_assessment,
        "fit_assessment_coverage": _fmt6(fit_assessment_coverage),
        "selected_count": selected_count,
        "selected_candidate": selected_candidate,
        "plugins_count": plugins_count,
        "plugins_without_review_or_pin": plugins_without_review_or_pin,
        "plugin_compliance_coverage": _fmt6(plugin_compliance_coverage),
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
        "FRAMEWORK ADOPTION ADR",
        f"project: {verdict.get('project')}",
        f"framework: {verdict.get('framework')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: framework_adoption_adr.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FRAMEWORK_ADOPTION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
