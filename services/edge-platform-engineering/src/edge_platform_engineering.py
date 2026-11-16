#!/usr/bin/env python3
"""Edge platform engineering — deterministic core.

Built from the bound skill `edge-platform-engineering`: "Edge
platforms (Cloudflare-class) let small teams run serious
infrastructure — if you respect their consistency models, limits,
and deploy discipline."

This atom is an AUDIT of a declared edge-platform record: it
validates the record a caller declares against the skill's method
sections — platform fit, local dev + deploys, security,
reliability, tunnels, cost & quotas, DNS/TLS hygiene — plus its
quality gates and red lines. It does not deploy anything, probe a
live Worker, read a real KV/D1/R2 store, or verify that a declared
control actually works — it checks that the record the skill
requires is present and internally complete and consistent on the
declared evidence.

The caller submits an edge-platform manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- components: the declared `components` list must be non-empty,
  and every declared component row must name a storage backend
  and declare its storage rationale documented (the skill:
  "Storage choices documented (consistency + access reasons)");
- consistency: no component that declares it requires strong
  consistency may declare the `kv` storage backend (the skill:
  "KV for config/cache (eventually consistent!)" — an eventually
  consistent store cannot serve a strong-consistency need on the
  declared evidence);
- access: every component declared as an administrative surface
  must declare Access protection (the skill's red line: "No admin
  surfaces without Access").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no CPU-time millisecond
budget, no quota number, no request/KV/D1 volume, no coverage
percentage — so no numeric threshold check is invented; the CPU
budget and the free-tier numbers are caller attestations, and
quantities are computed and reported, with completeness (every
declared component) as the only bar, exactly as stated above.

Verdict:
- any fail             -> EDGE_PLATFORM_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> EDGE_PLATFORM_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "platform_fit_and_storage",
    "deploy_and_versioning",
    "security_and_access",
    "reliability_and_observability",
    "tunnels_quotas_and_hygiene",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "platform_fit": {
        "storage_choices_documented": "boolean",
        "consistency_access_pattern_reviewed": "boolean",
    },
    "components": [{
        "name": "string",
        "storage_backend": "string",
        "storage_rationale_documented": "boolean",
        "requires_strong_consistency": "boolean",
        "is_admin_surface": "boolean",
        "access_protected": "boolean",
    }],
    "deploy": {
        "wrangler_workflows_used": "boolean",
        "tested_with_real_bindings_locally": "boolean",
        "deploys_from_git": "boolean",
        "versioned_deploys": "boolean",
        "rollback_path_tested": "boolean",
        "previous_versions_kept_deployable": "boolean",
        "staging_separated_from_prod": "boolean",
    },
    "security": {
        "secrets_only_in_platform_store": "boolean",
        "secrets_in_code_or_repo_present": "boolean",
        "secrets_in_logs_present": "boolean",
        "rate_limits_configured": "boolean",
        "waf_configured": "boolean",
        "input_validation_at_boundary": "boolean",
        "tls_https_disabled_present": "boolean",
    },
    "reliability": {
        "cpu_budget_respected": "boolean",
        "cold_start_addressed": "boolean",
        "error_capture_configured": "boolean",
        "alerts_configured": "boolean",
        "staged_rules_used": "boolean",
        "external_health_checks_configured": "boolean",
    },
    "tunnels": {
        "tunnels_present": "boolean",
        "origin_stays_loopback": "boolean",
        "access_policies_for_humans": "boolean",
        "service_tokens_for_machines": "boolean",
        "origin_exposed_publicly_present": "boolean",
    },
    "quotas": {
        "free_tier_limits_known": "boolean",
        "quota_alarms_set": "boolean",
        "monthly_log_driven_cost_review": "boolean",
    },
    "dns_tls": {
        "zones_documented": "boolean",
        "certs_automatic": "boolean",
        "cert_expiry_monitored": "boolean",
        "email_routing_consistent": "boolean",
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


def _gated_false_check(results, section, name, manifest, gate_path,
                       target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is False, evidence)
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


def evaluate(manifest):
    """Return the verdict dict for an edge-platform manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    components, has_components = _get(manifest, "components")
    components_is_list = has_components and isinstance(components, list)
    components_count = len(components) if components_is_list else None
    rows = components if components_is_list else []

    components_without_backend = (
        [_row_name(c) for c in rows
         if not _nonempty_str(c, "storage_backend")]
        if components_is_list else None
    )
    documented_rows = [
        c for c in rows
        if _nonempty_str(c, "storage_backend")
        and isinstance(c, dict)
        and c.get("storage_rationale_documented") is True
    ]
    rationale_rows = [
        c for c in rows
        if isinstance(c, dict)
        and c.get("storage_rationale_documented") is True
    ]
    storage_documentation_coverage = (
        len(documented_rows) / components_count
        if components_is_list and components_count > 0 else None
    )
    kv_strong_rows = [
        c for c in rows
        if isinstance(c, dict)
        and c.get("requires_strong_consistency") is True
        and c.get("storage_backend") == "kv"
    ]
    components_on_kv_requiring_strong_consistency = (
        [_row_name(c) for c in kv_strong_rows]
        if components_is_list else None
    )
    admin_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("is_admin_surface") is True
    ]
    access_protection_coverage = (
        sum(1 for c in admin_rows
            if c.get("access_protected") is True) / len(admin_rows)
        if components_is_list and len(admin_rows) > 0 else None
    )
    admin_components_without_access = (
        [_row_name(c) for c in admin_rows
         if "access_protected" in c
         and c.get("access_protected") is not True]
        if components_is_list else None
    )

    # ---- Section 1: platform_fit_and_storage (skill: platform
    #      fit — Workers for request logic; static assets via
    #      Workers/Pages; KV for config/cache (eventually
    #      consistent!), D1 for SQL, R2 for objects — pick per
    #      consistency + access pattern, not habit. Quality gate —
    #      storage choices documented (consistency + access
    #      reasons)) ----
    _bool_check(results, "platform_fit_and_storage",
                "storage_choices_documented", manifest,
                ("platform_fit", "storage_choices_documented"),
                "platform fit / quality gate: storage choices are "
                "documented — consistency + access reasons for each "
                "KV / D1 / R2 choice")
    _bool_check(results, "platform_fit_and_storage",
                "consistency_access_pattern_reviewed", manifest,
                ("platform_fit", "consistency_access_pattern_reviewed"),
                "platform fit: each storage choice is picked per "
                "consistency + access pattern, not habit")
    _check(results, "platform_fit_and_storage",
           "components_declared", components, components_is_list,
           components_is_list and components_count > 0,
           "platform fit: the declared record names its components "
           "— the components list is present and non-empty")
    backend_present = (
        components_is_list
        and all(isinstance(c, dict) and "storage_backend" in c
                for c in rows)
    )
    _check(results, "platform_fit_and_storage",
           "every_component_names_storage_backend", components,
           backend_present,
           components_is_list and components_count > 0
           and len(components_without_backend) == 0,
           "platform fit: every declared component row names its "
           "storage backend — a non-empty storage_backend string")
    rationale_present = (
        components_is_list
        and all(isinstance(c, dict)
                and "storage_rationale_documented" in c for c in rows)
    )
    _check(results, "platform_fit_and_storage",
           "every_component_documents_storage_rationale", components,
           rationale_present,
           components_is_list and components_count > 0
           and len(rationale_rows) == components_count,
           "quality gate: every declared component row declares "
           "its storage rationale documented — consistency + access "
           "reasons per component")
    consistency_present = (
        components_is_list
        and all(isinstance(c, dict)
                and "requires_strong_consistency" in c
                and "storage_backend" in c for c in rows)
    )
    _check(results, "platform_fit_and_storage",
           "no_strong_consistency_component_on_kv", components,
           consistency_present,
           components_is_list and len(kv_strong_rows) == 0,
           "platform fit: no component that requires strong "
           "consistency declares the kv backend — KV is eventually "
           "consistent")

    # ---- Section 2: deploy_and_versioning (skill: local dev +
    #      deploys — wrangler workflows; test with real bindings
    #      locally; deploy from git; versioned deploys with
    #      rollback (keep previous versions deployable). Quality
    #      gate — deploys versioned with a tested rollback path;
    #      staging separated from prod) ----
    _bool_check(results, "deploy_and_versioning",
                "wrangler_workflows_used", manifest,
                ("deploy", "wrangler_workflows_used"),
                "local dev + deploys: wrangler workflows are used")
    _bool_check(results, "deploy_and_versioning",
                "tested_with_real_bindings_locally", manifest,
                ("deploy", "tested_with_real_bindings_locally"),
                "local dev + deploys: the app is tested with real "
                "bindings locally")
    _bool_check(results, "deploy_and_versioning",
                "deploys_from_git", manifest,
                ("deploy", "deploys_from_git"),
                "local dev + deploys: deploys run from git")
    _bool_check(results, "deploy_and_versioning",
                "versioned_deploys", manifest,
                ("deploy", "versioned_deploys"),
                "quality gate: deploys are versioned")
    _bool_check(results, "deploy_and_versioning",
                "rollback_path_tested", manifest,
                ("deploy", "rollback_path_tested"),
                "quality gate: the rollback path is tested")
    _bool_check(results, "deploy_and_versioning",
                "previous_versions_kept_deployable", manifest,
                ("deploy", "previous_versions_kept_deployable"),
                "local dev + deploys: previous versions are kept "
                "deployable")
    _bool_check(results, "deploy_and_versioning",
                "staging_separated_from_prod", manifest,
                ("deploy", "staging_separated_from_prod"),
                "quality gate: staging is separated from prod")

    # ---- Section 3: security_and_access (skill: security —
    #      secrets via platform secret store (never in code or
    #      repos); Access in front of anything administrative;
    #      rate limits/WAF at the edge; validate all input at the
    #      boundary. Red lines — no admin surfaces without Access;
    #      no secrets in repo or logs; never disable TLS/HTTPS
    #      because "it's just a worker") ----
    _bool_check(results, "security_and_access",
                "secrets_only_in_platform_store", manifest,
                ("security", "secrets_only_in_platform_store"),
                "security / quality gate: secrets live only in the "
                "platform secret store")
    _false_check(results, "security_and_access",
                 "no_secrets_in_code_or_repo", manifest,
                 ("security", "secrets_in_code_or_repo_present"),
                 "red line: no secrets in code or repos")
    _false_check(results, "security_and_access",
                 "no_secrets_in_logs", manifest,
                 ("security", "secrets_in_logs_present"),
                 "red line: no secrets in logs")
    _bool_check(results, "security_and_access",
                "rate_limits_at_edge", manifest,
                ("security", "rate_limits_configured"),
                "security: rate limits are configured at the edge")
    _bool_check(results, "security_and_access",
                "waf_at_edge", manifest,
                ("security", "waf_configured"),
                "security: WAF rules are configured at the edge")
    _bool_check(results, "security_and_access",
                "input_validation_at_boundary", manifest,
                ("security", "input_validation_at_boundary"),
                "security: all input is validated at the boundary")
    _false_check(results, "security_and_access",
                 "no_tls_https_disabled", manifest,
                 ("security", "tls_https_disabled_present"),
                 "red line: TLS/HTTPS is never disabled because "
                 "\"it's just a worker\"")
    admin_gate_present = (
        components_is_list
        and all(isinstance(c, dict) and "is_admin_surface" in c
                for c in rows)
    )
    admin_present = (
        components_is_list and admin_gate_present
        and all("access_protected" in c for c in admin_rows)
    )
    _check(results, "security_and_access",
           "every_admin_component_access_protected", components,
           admin_present,
           components_is_list
           and all(c.get("access_protected") is True
                   for c in admin_rows),
           "red line: no admin surfaces without Access — every "
           "component declared as an administrative surface "
           "declares Access protection")

    # ---- Section 4: reliability_and_observability (skill:
    #      reliability — CPU-time budgets (ms limits!), cold-start
    #      awareness; error capture + alerts; staged rules; health
    #      checks from outside. Quality gate — CPU budget
    #      respected) ----
    _bool_check(results, "reliability_and_observability",
                "cpu_budget_respected", manifest,
                ("reliability", "cpu_budget_respected"),
                "reliability / quality gate: the CPU-time budget is "
                "respected")
    _bool_check(results, "reliability_and_observability",
                "cold_start_addressed", manifest,
                ("reliability", "cold_start_addressed"),
                "reliability: cold-start behaviour is addressed")
    _bool_check(results, "reliability_and_observability",
                "error_capture_configured", manifest,
                ("reliability", "error_capture_configured"),
                "reliability: error capture is configured")
    _bool_check(results, "reliability_and_observability",
                "reliability_alerts_configured", manifest,
                ("reliability", "alerts_configured"),
                "reliability: alerts are configured on errors")
    _bool_check(results, "reliability_and_observability",
                "staged_rules_used", manifest,
                ("reliability", "staged_rules_used"),
                "reliability: rules are staged, not pushed live "
                "unreviewed")
    _bool_check(results, "reliability_and_observability",
                "external_health_checks_configured", manifest,
                ("reliability", "external_health_checks_configured"),
                "reliability: health checks run from outside the "
                "platform")

    # ---- Section 5: tunnels_quotas_and_hygiene (skill: tunnels —
    #      cloudflared for private origins — origin stays loopback;
    #      Access policies for humans, service tokens for machines;
    #      no origin exposure "just in case". Cost & quotas — know
    #      free-tier numbers; alarms before quotas; log-driven cost
    #      review monthly. Quality gate — quota alarms set.
    #      DNS/TLS hygiene — zones documented; certs automatic but
    #      monitored; email routing/records consistent) ----
    _gated_bool_check(
        results, "tunnels_quotas_and_hygiene",
        "tunnel_origin_stays_loopback", manifest,
        ("tunnels", "tunnels_present"),
        ("tunnels", "origin_stays_loopback"),
        "tunnels: the tunnelled origin stays loopback",
        "no tunnels declared")
    _gated_bool_check(
        results, "tunnels_quotas_and_hygiene",
        "tunnel_access_policies_for_humans", manifest,
        ("tunnels", "tunnels_present"),
        ("tunnels", "access_policies_for_humans"),
        "tunnels: Access policies govern human access through "
        "the tunnel",
        "no tunnels declared")
    _gated_bool_check(
        results, "tunnels_quotas_and_hygiene",
        "tunnel_service_tokens_for_machines", manifest,
        ("tunnels", "tunnels_present"),
        ("tunnels", "service_tokens_for_machines"),
        "tunnels: service tokens govern machine access through "
        "the tunnel",
        "no tunnels declared")
    _gated_false_check(
        results, "tunnels_quotas_and_hygiene",
        "no_public_origin_exposure", manifest,
        ("tunnels", "tunnels_present"),
        ("tunnels", "origin_exposed_publicly_present"),
        "tunnels: the origin is not exposed publicly \"just in "
        "case\"",
        "no tunnels declared")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "free_tier_limits_known", manifest,
                ("quotas", "free_tier_limits_known"),
                "cost & quotas: the free-tier numbers are known — "
                "requests, KV ops, D1 rows, bandwidth")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "quota_alarms_set", manifest,
                ("quotas", "quota_alarms_set"),
                "cost & quotas / quality gate: quota alarms are set "
                "before quotas are hit")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "monthly_log_driven_cost_review", manifest,
                ("quotas", "monthly_log_driven_cost_review"),
                "cost & quotas: a log-driven cost review runs "
                "monthly")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "dns_zones_documented", manifest,
                ("dns_tls", "zones_documented"),
                "DNS/TLS hygiene: zones are documented")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "certs_automatic", manifest,
                ("dns_tls", "certs_automatic"),
                "DNS/TLS hygiene: certificates are automatic")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "cert_expiry_monitored", manifest,
                ("dns_tls", "cert_expiry_monitored"),
                "DNS/TLS hygiene: automatic certificates are "
                "monitored")
    _bool_check(results, "tunnels_quotas_and_hygiene",
                "email_routing_consistent", manifest,
                ("dns_tls", "email_routing_consistent"),
                "DNS/TLS hygiene: email routing and records are "
                "consistent")

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
        verdict = "EDGE_PLATFORM_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "EDGE_PLATFORM_SOUND"

    computed_names = (
        "components_declared",
        "every_component_names_storage_backend",
        "every_component_documents_storage_rationale",
        "no_strong_consistency_component_on_kv",
        "every_admin_component_access_protected",
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
        "service": "edge-platform-engineering",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "components_count": components_count,
        "components_without_storage_backend":
            components_without_backend,
        "storage_documentation_coverage":
            _fmt6(storage_documentation_coverage),
        "components_on_kv_requiring_strong_consistency":
            components_on_kv_requiring_strong_consistency,
        "admin_components_without_access":
            admin_components_without_access,
        "access_protection_coverage":
            _fmt6(access_protection_coverage),
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
        "EDGE PLATFORM ENGINEERING",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: edge_platform_engineering.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "EDGE_PLATFORM_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
