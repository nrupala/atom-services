# Edge platform engineering — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run a project on an edge platform — Cloudflare Workers/KV/D1/R2, tunnels and Access, versioned deploys, quota alarms — and you have a record of how that platform was engineered. This atom reads one declared manifest and returns one deterministic verdict across five sections: **EDGE_PLATFORM_SOUND**, **EDGE_PLATFORM_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it performs no deployment, probes no live Worker, reads no real KV/D1/R2 store, opens no tunnel, and does not verify that a declared control actually works. A platform is sound *on your declared evidence*: it never judges whether a storage choice is the right choice commercially, whether a declared rollback really restores service, whether Access policies are correctly scoped, or whether a Worker's real CPU time fits its budget. Computed checks: the declared `components` list must be present and non-empty with every row naming a non-empty `storage_backend` and declaring its storage rationale documented; no row requiring strong consistency may declare the `kv` backend; and every row declared as an admin surface must declare Access protection. The tunnel checks are conditional: they are required only when `tunnels.tunnels_present` is declared `true`; otherwise they pass as not applicable. No numeric threshold is imposed — no CPU-time millisecond budget, no free-tier quota number, no quota-alarm headroom, no cold-start latency target, no health-check interval, no rate-limit or WAF threshold, no coverage percentage below completeness, and no storage-backend vocabulary beyond the exact `kv` gate on the consistency check. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "edge-platform-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/edge-platform-engineering` — tool name `edge_platform_engineering`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/edge-platform-engineering` — body = the manifest object; same `Authorization` header.

## Input — the edge-platform-engineering manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `platform_fit.storage_choices_documented` | platform-fit evidence: storage choices are documented (consistency + access reasons) |
| `platform_fit.consistency_access_pattern_reviewed` | platform-fit evidence: each storage choice was picked per consistency + access pattern, not habit |
| `components` (list of component-row objects) | computed: must be present and non-empty; reported as `components_count` |
| `components[].name` (string) | names the row in the computed outputs |
| `components[].storage_backend` (string) | computed: every row must name a non-empty string; rows that do not are reported in `components_without_storage_backend`; the exact value `kv` gates the consistency check below, no other value is imposed |
| `components[].storage_rationale_documented` | computed: every row must declare `true`; documented rows count toward `storage_documentation_coverage` |
| `components[].requires_strong_consistency` | computed gate: a row declaring `true` must not declare `storage_backend` `kv`; rows that do are reported in `components_on_kv_requiring_strong_consistency` |
| `components[].is_admin_surface` | computed gate: declares the row is an administrative surface |
| `components[].access_protected` | computed: required `true` when the row is an admin surface; admin rows with the field present but not `true` are reported in `admin_components_without_access` (an absent field is missing evidence and does not appear) |
| `deploy.wrangler_workflows_used` / `tested_with_real_bindings_locally` / `deploys_from_git` | deploy evidence: wrangler workflows are used; the app is tested with real bindings locally; deploys run from git |
| `deploy.versioned_deploys` / `rollback_path_tested` / `previous_versions_kept_deployable` / `staging_separated_from_prod` | deploy evidence: deploys are versioned; the rollback path is tested; previous versions are kept deployable; staging is separated from prod |
| `security.secrets_only_in_platform_store` | security evidence: secrets live only in the platform secret store |
| `security.secrets_in_code_or_repo_present` | must be `false` to pass (red line: no secrets in code or repos) |
| `security.secrets_in_logs_present` | must be `false` to pass (red line: no secrets in logs) |
| `security.rate_limits_configured` / `waf_configured` / `input_validation_at_boundary` | security evidence: rate limits and WAF are configured at the edge; all input is validated at the boundary |
| `security.tls_https_disabled_present` | must be `false` to pass (red line: TLS/HTTPS never disabled) |
| `reliability.cpu_budget_respected` / `cold_start_addressed` | reliability evidence: the CPU-time budget is respected; cold-start behaviour is addressed |
| `reliability.error_capture_configured` / `alerts_configured` / `staged_rules_used` / `external_health_checks_configured` | reliability evidence: error capture and alerts are configured; rules are staged; health checks run from outside the platform |
| `tunnels.tunnels_present` | gate: declares whether tunnels are present |
| `tunnels.origin_stays_loopback` | required `true` only when `tunnels.tunnels_present` is `true`; otherwise passes as not applicable |
| `tunnels.access_policies_for_humans` | required `true` only when tunnels are declared present; otherwise passes as not applicable |
| `tunnels.service_tokens_for_machines` | required `true` only when tunnels are declared present; otherwise passes as not applicable |
| `tunnels.origin_exposed_publicly_present` | must be `false` when tunnels are declared present; otherwise passes as not applicable |
| `quotas.free_tier_limits_known` / `quota_alarms_set` / `monthly_log_driven_cost_review` | quota evidence: the free-tier numbers are known; quota alarms are set; a log-driven cost review runs monthly |
| `dns_tls.zones_documented` / `certs_automatic` / `cert_expiry_monitored` / `email_routing_consistent` | DNS/TLS evidence: zones are documented; certificates are automatic and monitored for expiry; email routing and records are consistent |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward EDGE_PLATFORM_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/edge-platform-engineering`:

```json
{
  "project": "test-project",
  "platform_fit": {
    "storage_choices_documented": true,
    "consistency_access_pattern_reviewed": true
  },
  "components": [
    {
      "name": "db-component",
      "storage_backend": "d1",
      "storage_rationale_documented": true,
      "requires_strong_consistency": true,
      "is_admin_surface": true,
      "access_protected": true
    }
  ],
  "deploy": {
    "wrangler_workflows_used": true,
    "tested_with_real_bindings_locally": true,
    "deploys_from_git": true,
    "versioned_deploys": true,
    "rollback_path_tested": true,
    "previous_versions_kept_deployable": true,
    "staging_separated_from_prod": true
  },
  "security": {
    "secrets_only_in_platform_store": true,
    "secrets_in_code_or_repo_present": false,
    "secrets_in_logs_present": false,
    "rate_limits_configured": true,
    "waf_configured": true,
    "input_validation_at_boundary": true,
    "tls_https_disabled_present": false
  },
  "reliability": {
    "cpu_budget_respected": true,
    "cold_start_addressed": true,
    "error_capture_configured": true,
    "alerts_configured": true,
    "staged_rules_used": true,
    "external_health_checks_configured": true
  },
  "tunnels": {
    "tunnels_present": false
  },
  "quotas": {
    "free_tier_limits_known": true,
    "quota_alarms_set": true,
    "monthly_log_driven_cost_review": true
  },
  "dns_tls": {
    "zones_documented": true,
    "certs_automatic": true,
    "cert_expiry_monitored": true,
    "email_routing_consistent": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

```json
{
  "service": "edge-platform-engineering",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "EDGE_PLATFORM_SOUND",
  "sections": {
    "platform_fit_and_storage": "pass",
    "deploy_and_versioning": "pass",
    "security_and_access": "pass",
    "reliability_and_observability": "pass",
    "tunnels_quotas_and_hygiene": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "components_count": 1,
  "components_without_storage_backend": [],
  "storage_documentation_coverage": "1.000000",
  "components_on_kv_requiring_strong_consistency": [],
  "admin_components_without_access": [],
  "access_protection_coverage": "1.000000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across five sections."
}
```

## Verdicts

- **EDGE_PLATFORM_SOUND** — every check passes; the declared edge-platform record is complete and consistent with the skill's checklist and red lines.
- **EDGE_PLATFORM_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `components_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `components_without_storage_backend`, `components_on_kv_requiring_strong_consistency` and `admin_components_without_access` (null when the `components` list is not declared; for `admin_components_without_access`, an admin component with `access_protected` absent is missing evidence and does not appear), the coverage values `storage_documentation_coverage` and `access_protection_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and `access_protection_coverage` is also null when no component is declared as an admin surface), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
