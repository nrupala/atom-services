#!/usr/bin/env python3
"""Full-stack app build pack — deterministic core.

Built from the bound skill `senior-fullstack-engineer`: "Build
like someone who will maintain this for years. Favor clarity over
cleverness, contracts over assumptions, and small correct slices
over big fragile ones."

This atom is an AUDIT of a declared full-stack build record: it
validates the record a caller declares against the skill's
approach (understand the problem, contract-first, thin vertical
slice, harden), frontend, backend, data-layer, security, testing
and deploy disciplines, plus its anti-patterns. It does not build
an app, run code, inspect a repository, or verify that a declared
control actually works — it checks that the record the skill
requires is present and internally complete and consistent on
the declared evidence.

The caller submits a build manifest (a dict, or JSON on the CLI).
Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- slices: the declared `slices` list must be non-empty, and every
  declared slice row must declare itself end-to-end complete (the
  skill: "Ship one end-to-end path (UI -> API -> store -> back)
  before widening").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states one numeric requirement — touch targets of at
least 44px (a standing devinfo.dev requirement) — and it is
carried as a caller attestation, not a measurement: the atom
reads no layout. The skill states no other numeric threshold —
no test-coverage percentage, no contrast ratio, no dependency
count, no latency budget — so no other numeric threshold check is
invented.

Verdict:
- any fail             -> FULL_STACK_BUILD_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FULL_STACK_BUILD_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "approach_and_contracts",
    "frontend",
    "backend_and_data",
    "security",
    "testing_and_quality",
    "deploy_and_delivery",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "approach": {
        "problem_and_data_flow_understood": "boolean",
        "user_visible_outcome_defined": "boolean",
        "source_of_truth_identified": "boolean",
        "contract_defined_first": "boolean",
        "data_shape_defined_first": "boolean",
        "vertical_slice_before_widening": "boolean",
    },
    "slices": [{
        "name": "string",
        "end_to_end_complete": "boolean",
    }],
    "frontend": {
        "vanilla_ts_web_components_used": "boolean",
        "progressive_enhancement_applied": "boolean",
        "dependency_tree_kept_small": "boolean",
        "mobile_first_responsive": "boolean",
        "viewport_configured": "boolean",
        "touch_targets_at_least_44px": "boolean",
        "semantic_html_used": "boolean",
        "keyboard_navigation_supported": "boolean",
        "aria_only_where_needed": "boolean",
        "sufficient_contrast": "boolean",
        "boundaries_typed_no_any": "boolean",
        "undefined_fields_guarded_when_rendering": "boolean",
        "framework_bloat_present": "boolean",
    },
    "backend": {
        "api_contracts_versioned": "boolean",
        "input_validated_at_boundary": "boolean",
        "handlers_stateless": "boolean",
        "idempotency_for_retried_writes": "boolean",
        "error_taxonomy_defined": "boolean",
        "structured_error_responses": "boolean",
        "bare_500_responses_present": "boolean",
        "health_endpoint_present": "boolean",
    },
    "data": {
        "schema_is_source_of_truth": "boolean",
        "migrations_forward_only": "boolean",
        "migrations_backward_compatible": "boolean",
        "parametrized_queries_only": "boolean",
        "string_concatenated_sql_present": "boolean",
    },
    "security": {
        "authn_authz_separated": "boolean",
        "least_privilege_enforced": "boolean",
        "secrets_via_env_or_secret_store": "boolean",
        "secrets_rotatable": "boolean",
        "secrets_in_repo_present": "boolean",
        "owasp_top10_reviewed": "boolean",
        "zero_knowledge_required": "boolean",
        "client_side_encryption_applied": "boolean",
        "user_held_keys": "boolean",
    },
    "testing": {
        "unit_tests_for_logic": "boolean",
        "integration_tests_for_boundaries": "boolean",
        "e2e_critical_path_tested": "boolean",
        "tests_target_contract_not_implementation": "boolean",
        "tests_deferred_present": "boolean",
        "observability_in_place": "boolean",
        "graceful_degradation": "boolean",
        "stranger_readable_code": "boolean",
    },
    "deploy": {
        "docker_used_present": "boolean",
        "uses_direct_or_platform_native_deploy": "boolean",
        "staging_deployed_first": "boolean",
        "direct_to_production_used": "boolean",
        "direct_to_prod_named_bridge_with_end_date": "boolean",
        "github_repo_in_sync_with_deployed": "boolean",
        "big_bang_release_present": "boolean",
        "premature_optimization_present": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a full-stack build manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    slices, has_slices = _get(manifest, "slices")
    slices_is_list = has_slices and isinstance(slices, list)
    slices_count = len(slices) if slices_is_list else None
    rows = slices if slices_is_list else []

    e2e_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("end_to_end_complete") is True
    ]
    slice_end_to_end_coverage = (
        len(e2e_rows) / slices_count
        if slices_is_list and slices_count > 0 else None
    )
    slices_not_end_to_end = (
        [_row_name(c) for c in rows
         if isinstance(c, dict) and "end_to_end_complete" in c
         and c.get("end_to_end_complete") is not True]
        if slices_is_list else None
    )

    # ---- Section 1: approach_and_contracts (skill: approach —
    #      understand the problem and the data flow before writing
    #      code; contract-first; thin vertical slice; harden) ----
    _bool_check(results, "approach_and_contracts",
                "problem_and_data_flow_understood", manifest,
                ("approach", "problem_and_data_flow_understood"),
                "approach: the problem and the data flow are "
                "understood before writing code")
    _bool_check(results, "approach_and_contracts",
                "user_visible_outcome_defined", manifest,
                ("approach", "user_visible_outcome_defined"),
                "approach: the user-visible outcome is defined")
    _bool_check(results, "approach_and_contracts",
                "source_of_truth_identified", manifest,
                ("approach", "source_of_truth_identified"),
                "approach: the source of truth is identified")
    _bool_check(results, "approach_and_contracts",
                "contract_defined_first", manifest,
                ("approach", "contract_defined_first"),
                "contract-first: the API/interface is defined "
                "first; both ends code to the contract")
    _bool_check(results, "approach_and_contracts",
                "data_shape_defined_first", manifest,
                ("approach", "data_shape_defined_first"),
                "contract-first: the data shape is defined first")
    _bool_check(results, "approach_and_contracts",
                "vertical_slice_before_widening", manifest,
                ("approach", "vertical_slice_before_widening"),
                "thin vertical slice: one end-to-end path is "
                "shipped before widening")
    _check(results, "approach_and_contracts",
           "slices_declared", slices, slices_is_list,
           slices_is_list and slices_count > 0,
           "thin vertical slice: the declared record names its "
           "slices — the slices list is present and non-empty")
    e2e_present = (
        slices_is_list
        and all(isinstance(c, dict) and "end_to_end_complete" in c
                for c in rows)
    )
    _check(results, "approach_and_contracts",
           "every_slice_end_to_end", slices, e2e_present,
           slices_is_list and slices_count > 0
           and len(e2e_rows) == slices_count,
           "thin vertical slice: every declared slice row "
           "declares itself end-to-end complete — UI to API to "
           "store and back")

    # ---- Section 2: frontend (skill: frontend — vanilla
    #      TypeScript + Web Components; mobile-first / responsive;
    #      accessibility; type the boundaries; guard against
    #      undefined fields when rendering) ----
    _bool_check(results, "frontend",
                "vanilla_ts_web_components_used", manifest,
                ("frontend", "vanilla_ts_web_components_used"),
                "frontend: vanilla TypeScript + Web Components "
                "are used — no framework bloat")
    _bool_check(results, "frontend",
                "progressive_enhancement_applied", manifest,
                ("frontend", "progressive_enhancement_applied"),
                "frontend: progressive enhancement is applied")
    _bool_check(results, "frontend",
                "dependency_tree_kept_small", manifest,
                ("frontend", "dependency_tree_kept_small"),
                "frontend: the dependency tree is kept small")
    _bool_check(results, "frontend",
                "mobile_first_responsive", manifest,
                ("frontend", "mobile_first_responsive"),
                "frontend: the layout is mobile-first / "
                "responsive by default")
    _bool_check(results, "frontend",
                "viewport_configured", manifest,
                ("frontend", "viewport_configured"),
                "frontend: a proper viewport is configured")
    _bool_check(results, "frontend",
                "touch_targets_at_least_44px", manifest,
                ("frontend", "touch_targets_at_least_44px"),
                "frontend: touch targets are at least 44px — a "
                "standing devinfo.dev requirement, declared as a "
                "caller attestation")
    _bool_check(results, "frontend",
                "semantic_html_used", manifest,
                ("frontend", "semantic_html_used"),
                "accessibility: semantic HTML is used")
    _bool_check(results, "frontend",
                "keyboard_navigation_supported", manifest,
                ("frontend", "keyboard_navigation_supported"),
                "accessibility: keyboard navigation is supported")
    _bool_check(results, "frontend",
                "aria_only_where_needed", manifest,
                ("frontend", "aria_only_where_needed"),
                "accessibility: ARIA is used only where needed")
    _bool_check(results, "frontend",
                "sufficient_contrast", manifest,
                ("frontend", "sufficient_contrast"),
                "accessibility: contrast is sufficient")
    _bool_check(results, "frontend",
                "boundaries_typed_no_any", manifest,
                ("frontend", "boundaries_typed_no_any"),
                "frontend: the boundaries are typed — unknown is "
                "narrowed at the edge; any is never used through")
    _bool_check(results, "frontend",
                "undefined_fields_guarded_when_rendering", manifest,
                ("frontend", "undefined_fields_guarded_when_rendering"),
                "frontend: rendering from KV/JSON guards against "
                "undefined fields")
    _false_check(results, "frontend",
                 "no_framework_bloat", manifest,
                 ("frontend", "framework_bloat_present"),
                 "anti-pattern: no framework-of-the-week for a "
                 "static page — no framework bloat is present")

    # ---- Section 3: backend_and_data (skill: backend — clear,
    #      versioned API contracts; validate every input; stateless
    #      handlers; idempotency; error taxonomy; health endpoints.
    #      Data layer — schema is the source of truth; migrations
    #      forward-only and backward-compatible; parametrized
    #      queries only) ----
    _bool_check(results, "backend_and_data",
                "api_contracts_versioned", manifest,
                ("backend", "api_contracts_versioned"),
                "backend: API contracts are clear and versioned")
    _bool_check(results, "backend_and_data",
                "input_validated_at_boundary", manifest,
                ("backend", "input_validated_at_boundary"),
                "backend: every input is validated at the "
                "boundary; the client is never trusted")
    _bool_check(results, "backend_and_data",
                "handlers_stateless", manifest,
                ("backend", "handlers_stateless"),
                "backend: handlers are stateless")
    _bool_check(results, "backend_and_data",
                "idempotency_for_retried_writes", manifest,
                ("backend", "idempotency_for_retried_writes"),
                "backend: writes that can be retried carry "
                "explicit idempotency")
    _bool_check(results, "backend_and_data",
                "error_taxonomy_defined", manifest,
                ("backend", "error_taxonomy_defined"),
                "backend: a real error taxonomy is defined — "
                "client vs server vs upstream")
    _bool_check(results, "backend_and_data",
                "structured_error_responses", manifest,
                ("backend", "structured_error_responses"),
                "backend: error responses are structured")
    _false_check(results, "backend_and_data",
                 "no_bare_500_responses", manifest,
                 ("backend", "bare_500_responses_present"),
                 "backend: no bare 500 responses are present")
    _bool_check(results, "backend_and_data",
                "health_endpoint_present", manifest,
                ("backend", "health_endpoint_present"),
                "backend: a health endpoint (/api/health) is "
                "present on every service")
    _bool_check(results, "backend_and_data",
                "schema_is_source_of_truth", manifest,
                ("data", "schema_is_source_of_truth"),
                "data layer: the schema is the source of truth")
    _bool_check(results, "backend_and_data",
                "migrations_forward_only", manifest,
                ("data", "migrations_forward_only"),
                "data layer: migrations are forward-only")
    _bool_check(results, "backend_and_data",
                "migrations_backward_compatible", manifest,
                ("data", "migrations_backward_compatible"),
                "data layer: migrations are backward-compatible "
                "(expand/contract)")
    _bool_check(results, "backend_and_data",
                "parametrized_queries_only", manifest,
                ("data", "parametrized_queries_only"),
                "data layer: parametrized queries only")
    _false_check(results, "backend_and_data",
                 "no_string_concatenated_sql", manifest,
                 ("data", "string_concatenated_sql_present"),
                 "data layer: SQL is never built by string "
                 "concatenation")

    # ---- Section 4: security (skill: security by default —
    #      AuthN and authZ separate; least privilege; no secrets
    #      in the repo; OWASP Top 10 awareness; zero-knowledge /
    #      zero-trust where the product calls for it) ----
    _bool_check(results, "security",
                "authn_authz_separated", manifest,
                ("security", "authn_authz_separated"),
                "security: AuthN and authZ are separate concerns")
    _bool_check(results, "security",
                "least_privilege_enforced", manifest,
                ("security", "least_privilege_enforced"),
                "security: least privilege is enforced")
    _bool_check(results, "security",
                "secrets_via_env_or_secret_store", manifest,
                ("security", "secrets_via_env_or_secret_store"),
                "security: secrets come via environment / secret "
                "store")
    _bool_check(results, "security",
                "secrets_rotatable", manifest,
                ("security", "secrets_rotatable"),
                "security: secrets are rotate-able")
    _false_check(results, "security",
                 "no_secrets_in_repo", manifest,
                 ("security", "secrets_in_repo_present"),
                 "security / anti-pattern: no secrets in the repo "
                 "— no secrets in code")
    _bool_check(results, "security",
                "owasp_top10_reviewed", manifest,
                ("security", "owasp_top10_reviewed"),
                "security: the OWASP Top 10 is reviewed — "
                "injection, broken access control, SSRF, XSS, CSRF")
    _gated_bool_check(
        results, "security",
        "client_side_encryption_applied", manifest,
        ("security", "zero_knowledge_required"),
        ("security", "client_side_encryption_applied"),
        "security: where the product calls for zero-knowledge, "
        "data is encrypted client-side and stored as ciphertext",
        "zero-knowledge posture not required by the product")
    _gated_bool_check(
        results, "security",
        "user_held_keys", manifest,
        ("security", "zero_knowledge_required"),
        ("security", "user_held_keys"),
        "security: where the product calls for zero-knowledge, "
        "keys are user-held",
        "zero-knowledge posture not required by the product")

    # ---- Section 5: testing_and_quality (skill: testing &
    #      quality bar — unit-test logic, integration-test
    #      boundaries, e2e the critical path; test the contract,
    #      not the implementation. Definition of done: it works,
    #      it's tested, it's observable, it degrades gracefully,
    #      and a stranger could read it) ----
    _bool_check(results, "testing_and_quality",
                "unit_tests_for_logic", manifest,
                ("testing", "unit_tests_for_logic"),
                "testing: logic is unit-tested")
    _bool_check(results, "testing_and_quality",
                "integration_tests_for_boundaries", manifest,
                ("testing", "integration_tests_for_boundaries"),
                "testing: boundaries are integration-tested")
    _bool_check(results, "testing_and_quality",
                "e2e_critical_path_tested", manifest,
                ("testing", "e2e_critical_path_tested"),
                "testing: the critical path is tested end-to-end")
    _bool_check(results, "testing_and_quality",
                "tests_target_contract_not_implementation", manifest,
                ("testing", "tests_target_contract_not_implementation"),
                "testing: tests target the contract, not the "
                "implementation")
    _false_check(results, "testing_and_quality",
                 "no_tests_deferred", manifest,
                 ("testing", "tests_deferred_present"),
                 "anti-pattern: tests are not deferred — no "
                 "\"we'll add tests later\"")
    _bool_check(results, "testing_and_quality",
                "observability_in_place", manifest,
                ("testing", "observability_in_place"),
                "definition of done: the build is observable")
    _bool_check(results, "testing_and_quality",
                "graceful_degradation", manifest,
                ("testing", "graceful_degradation"),
                "definition of done: the build degrades gracefully")
    _bool_check(results, "testing_and_quality",
                "stranger_readable_code", manifest,
                ("testing", "stranger_readable_code"),
                "definition of done: a stranger could read the code")

    # ---- Section 6: deploy_and_delivery (skill: deploy, per
    #      phased-delivery — no Docker; staging first;
    #      direct-to-production only as a named bridge with an end
    #      date; keep the GitHub repo in sync with what's actually
    #      deployed. Anti-patterns — big-bang features; optimizing
    #      before measuring) ----
    _false_check(results, "deploy_and_delivery",
                 "no_docker_used", manifest,
                 ("deploy", "docker_used_present"),
                 "deploy: no Docker is used")
    _bool_check(results, "deploy_and_delivery",
                "uses_direct_or_platform_native_deploy", manifest,
                ("deploy", "uses_direct_or_platform_native_deploy"),
                "deploy: the deploy method is direct Python "
                "(venv/pip/PYTHONPATH), systemd, or "
                "platform-native")
    _bool_check(results, "deploy_and_delivery",
                "staging_deployed_first", manifest,
                ("deploy", "staging_deployed_first"),
                "deploy: staging comes first")
    _gated_bool_check(
        results, "deploy_and_delivery",
        "direct_to_prod_named_bridge_with_end_date", manifest,
        ("deploy", "direct_to_production_used"),
        ("deploy", "direct_to_prod_named_bridge_with_end_date"),
        "deploy: direct-to-production is used only as a named "
        "bridge with an end date",
        "no direct-to-production deploy declared")
    _bool_check(results, "deploy_and_delivery",
                "github_repo_in_sync_with_deployed", manifest,
                ("deploy", "github_repo_in_sync_with_deployed"),
                "deploy: the GitHub repo is kept in sync with "
                "what's actually deployed")
    _false_check(results, "deploy_and_delivery",
                 "no_big_bang_release", manifest,
                 ("deploy", "big_bang_release_present"),
                 "anti-pattern: no big-bang features with no "
                 "vertical slice")
    _false_check(results, "deploy_and_delivery",
                 "no_premature_optimization", manifest,
                 ("deploy", "premature_optimization_present"),
                 "anti-pattern: no optimizing before measuring")

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
        verdict = "FULL_STACK_BUILD_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FULL_STACK_BUILD_SOUND"

    computed_names = (
        "slices_declared",
        "every_slice_end_to_end",
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
        "service": "full-stack-app-build-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "slices_count": slices_count,
        "slices_not_end_to_end": slices_not_end_to_end,
        "slice_end_to_end_coverage": _fmt6(slice_end_to_end_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "FULL STACK APP BUILD PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: full_stack_app_build_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FULL_STACK_BUILD_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
