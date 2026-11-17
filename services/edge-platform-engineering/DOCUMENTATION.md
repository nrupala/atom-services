# Edge platform engineering — documentation

**Edge platform engineering** · slug `edge-platform-engineering` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "edge-platform-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the edge-platform manifest.** You declare a record of a platform already engineered — the atom audits the record, it does not do the engineering (see Explanation). The recorded full-pass manifest declares the project `test-project`: storage choices documented with the consistency and access pattern reviewed; one component, `db-component`, on the `d1` backend with its storage rationale documented, requiring strong consistency, and declared an admin surface with Access protection. It declares wrangler workflows used, testing with real bindings locally, deploys from git, versioned deploys with a tested rollback path, previous versions kept deployable and staging separated from prod; secrets only in the platform store with no secrets in code, repos or logs (`secrets_in_code_or_repo_present: false`, `secrets_in_logs_present: false`), rate limits and WAF configured, input validated at the boundary, and TLS/HTTPS never disabled (`tls_https_disabled_present: false`). It declares the CPU budget respected, cold start addressed, error capture and alerts configured, staged rules and external health checks; no tunnels (`tunnels_present: false`, so the four tunnel checks pass as not applicable); the free-tier limits known, quota alarms set and a monthly log-driven cost review; and zones documented with automatic, expiry-monitored certificates and consistent email routing.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/edge-platform-engineering` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `EDGE_PLATFORM_SOUND`: "38 pass, 0 fail, 0 missing of 38 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `components_count` is 1, and both coverage ratios are `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `EDGE_PLATFORM_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "edge-platform-engineering"}`.
3. Call: `POST https://atoms.pipavia.com/v1/edge-platform-engineering` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/edge-platform-engineering` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `edge_platform_engineering`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `EDGE_PLATFORM_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `no_strong_consistency_component_on_kv`, `every_admin_component_access_protected`, and the summary reads "36 pass, 2 fail, 0 missing of 38 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `components_on_kv_requiring_strong_consistency` and `admin_components_without_access` both name the row `bad-kv`: a component on the `kv` backend that requires strong consistency, and an admin surface with `access_protected` declared `false`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "components",
  "detail": "components must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/edge-platform-engineering` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/edge-platform-engineering` — tool name `edge_platform_engineering`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `edge_platform_engineering` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `EDGE_PLATFORM_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked |

#### Read by: platform_fit_and_storage

| Field | Type | Notes |
|---|---|---|
| `platform_fit` | object | The platform-fit section object — a present non-object value is rejected before evaluation |
| `platform_fit.storage_choices_documented` | boolean | — |
| `platform_fit.consistency_access_pattern_reviewed` | boolean | — |
| `components` | list | list of component-row objects, each with the entry fields below; computed, see below; also read by security_and_access |
| `components[]` | object | One declared component row — a present non-object entry is rejected before evaluation |
| `components[].name` | string | Names the row in the computed outputs |
| `components[].storage_backend` | string | Must be a non-empty string for the row to pass the computed backend check — an absent field is missing evidence, an empty string fails; the exact value `kv` gates the consistency check below, no other value is imposed (see the declined vocabulary note in Explanation) |
| `components[].storage_rationale_documented` | boolean | — |
| `components[].requires_strong_consistency` | boolean (gate) | gates the KV consistency check below |

#### Read by: deploy_and_versioning

| Field | Type | Notes |
|---|---|---|
| `deploy` | object | The deploy section object — a present non-object value is rejected before evaluation |
| `deploy.wrangler_workflows_used` | boolean | — |
| `deploy.tested_with_real_bindings_locally` | boolean | — |
| `deploy.deploys_from_git` | boolean | — |
| `deploy.versioned_deploys` | boolean | — |
| `deploy.rollback_path_tested` | boolean | — |
| `deploy.previous_versions_kept_deployable` | boolean | — |
| `deploy.staging_separated_from_prod` | boolean | — |

#### Read by: security_and_access

| Field | Type | Notes |
|---|---|---|
| `components[].is_admin_surface` | boolean (gate) | gates the Access check below |
| `components[].access_protected` | boolean | required when the row is an admin surface; otherwise the check passes as not applicable to that row |
| `security` | object | The security section object — a present non-object value is rejected before evaluation |
| `security.secrets_only_in_platform_store` | boolean | — |
| `security.secrets_in_code_or_repo_present` | boolean | must be `false` to pass — skill red line |
| `security.secrets_in_logs_present` | boolean | must be `false` to pass — skill red line |
| `security.rate_limits_configured` | boolean | — |
| `security.waf_configured` | boolean | — |
| `security.input_validation_at_boundary` | boolean | — |
| `security.tls_https_disabled_present` | boolean | must be `false` to pass — skill red line |

#### Read by: reliability_and_observability

| Field | Type | Notes |
|---|---|---|
| `reliability` | object | The reliability section object — a present non-object value is rejected before evaluation |
| `reliability.cpu_budget_respected` | boolean | — |
| `reliability.cold_start_addressed` | boolean | — |
| `reliability.error_capture_configured` | boolean | — |
| `reliability.alerts_configured` | boolean | — |
| `reliability.staged_rules_used` | boolean | — |
| `reliability.external_health_checks_configured` | boolean | — |

#### Read by: tunnels_quotas_and_hygiene

| Field | Type | Notes |
|---|---|---|
| `tunnels` | object | The tunnels section object — a present non-object value is rejected before evaluation |
| `tunnels.tunnels_present` | boolean (gate) | gates the four tunnel checks below |
| `tunnels.origin_stays_loopback` | boolean | required when tunnels are declared present; otherwise the check passes as not applicable |
| `tunnels.access_policies_for_humans` | boolean | required when tunnels are declared present; otherwise not applicable |
| `tunnels.service_tokens_for_machines` | boolean | required when tunnels are declared present; otherwise not applicable |
| `tunnels.origin_exposed_publicly_present` | boolean | must be `false` when tunnels are declared present — skill rule; otherwise the check passes as not applicable |
| `quotas` | object | The quotas section object — a present non-object value is rejected before evaluation |
| `quotas.free_tier_limits_known` | boolean | — |
| `quotas.quota_alarms_set` | boolean | — |
| `quotas.monthly_log_driven_cost_review` | boolean | — |
| `dns_tls` | object | The DNS/TLS section object — a present non-object value is rejected before evaluation |
| `dns_tls.zones_documented` | boolean | — |
| `dns_tls.certs_automatic` | boolean | — |
| `dns_tls.cert_expiry_monitored` | boolean | — |
| `dns_tls.email_routing_consistent` | boolean | — |

### Checks

All 38 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: platform_fit_and_storage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `storage_choices_documented` | platform fit / quality gate: storage choices are documented — consistency + access reasons for each KV / D1 / R2 choice | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `consistency_access_pattern_reviewed` | platform fit: each storage choice is picked per consistency + access pattern, not habit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `components_declared` | platform fit: the declared record names its components — the components list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_component_names_storage_backend` | platform fit: every declared component row names its storage backend — a non-empty storage_backend string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_component_documents_storage_rationale` | quality gate: every declared component row declares its storage rationale documented — consistency + access reasons per component | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `no_strong_consistency_component_on_kv` | platform fit: no component that requires strong consistency declares the kv backend — KV is eventually consistent | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: deploy_and_versioning

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `wrangler_workflows_used` | local dev + deploys: wrangler workflows are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tested_with_real_bindings_locally` | local dev + deploys: the app is tested with real bindings locally | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deploys_from_git` | local dev + deploys: deploys run from git | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `versioned_deploys` | quality gate: deploys are versioned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollback_path_tested` | quality gate: the rollback path is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `previous_versions_kept_deployable` | local dev + deploys: previous versions are kept deployable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `staging_separated_from_prod` | quality gate: staging is separated from prod | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: security_and_access

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `secrets_only_in_platform_store` | security / quality gate: secrets live only in the platform secret store | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_secrets_in_code_or_repo` | red line: no secrets in code or repos | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_secrets_in_logs` | red line: no secrets in logs | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `rate_limits_at_edge` | security: rate limits are configured at the edge | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `waf_at_edge` | security: WAF rules are configured at the edge | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `input_validation_at_boundary` | security: all input is validated at the boundary | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_tls_https_disabled` | red line: TLS/HTTPS is never disabled because "it's just a worker" | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_admin_component_access_protected` | red line: no admin surfaces without Access — every component declared as an administrative surface declares Access protection | Computed over the declared record, conditional per row on `components[].is_admin_surface`. Pass: every admin row declares Access protection — or there are no admin rows, in which case the check passes as not applicable. Fail: an admin row declares `access_protected` present but not `true` (offending rows are named in `admin_components_without_access`). Missing: the list is absent, or an admin row has `access_protected` absent (such a row is missing evidence and does not appear in `admin_components_without_access`). |

#### Section: reliability_and_observability

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `cpu_budget_respected` | reliability / quality gate: the CPU-time budget is respected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cold_start_addressed` | reliability: cold-start behaviour is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `error_capture_configured` | reliability: error capture is configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reliability_alerts_configured` | reliability: alerts are configured on errors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `staged_rules_used` | reliability: rules are staged, not pushed live unreviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `external_health_checks_configured` | reliability: health checks run from outside the platform | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: tunnels_quotas_and_hygiene

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tunnel_origin_stays_loopback` | no tunnels declared | Conditional on `tunnels.tunnels_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no tunnels declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `tunnel_access_policies_for_humans` | no tunnels declared | Conditional on `tunnels.tunnels_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no tunnels declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `tunnel_service_tokens_for_machines` | no tunnels declared | Conditional on `tunnels.tunnels_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no tunnels declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `no_public_origin_exposure` | no tunnels declared | Conditional on `tunnels.tunnels_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no tunnels declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `free_tier_limits_known` | cost & quotas: the free-tier numbers are known — requests, KV ops, D1 rows, bandwidth | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quota_alarms_set` | cost & quotas / quality gate: quota alarms are set before quotas are hit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `monthly_log_driven_cost_review` | cost & quotas: a log-driven cost review runs monthly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dns_zones_documented` | DNS/TLS hygiene: zones are documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `certs_automatic` | DNS/TLS hygiene: certificates are automatic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cert_expiry_monitored` | DNS/TLS hygiene: automatic certificates are monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `email_routing_consistent` | DNS/TLS hygiene: email routing and records are consistent | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"edge-platform-engineering"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `components_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `components_without_storage_backend`, `components_on_kv_requiring_strong_consistency` and `admin_components_without_access` (null when the `components` list is not declared; for `admin_components_without_access`, an admin component with `access_protected` absent is missing evidence and does not appear); and the ratios `storage_documentation_coverage` (components naming a storage backend with its rationale documented ÷ declared components) and `access_protection_coverage` (admin components declaring Access protection ÷ admin components) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and `access_protection_coverage` is also null when no component is declared as an admin surface. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "38 pass, 0 fail, 0 missing of 38 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `EDGE_PLATFORM_SOUND` — all 38 checks pass: the declared edge-platform record is complete and consistent with the bound skill's checklist and red lines.
- `EDGE_PLATFORM_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the edge_platform_engineering scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the edge_platform_engineering scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"components","detail":"components must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for edge-platform-engineering exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build on the edge — Cloudflare Workers/KV/D1/R2, tunnels and Access, versioned deploys, quota alarms (the bound capability, from the `edge-platform-engineering` skill). You submit one declared record — the edge-platform manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`platform_fit_and_storage`, `deploy_and_versioning`, `security_and_access`, `reliability_and_observability`, `tunnels_quotas_and_hygiene`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `components` list must be present and non-empty, every row must name a non-empty `storage_backend` and declare its storage rationale documented, no row requiring strong consistency may declare the `kv` backend, and every row declared as an admin surface must declare Access protection — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — the four tunnel checks are required only when `tunnels.tunnels_present` is declared `true`; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `EDGE_PLATFORM_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `EDGE_PLATFORM_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a CPU-time budget in milliseconds (the skill says "ms limits!" but states no number — caller attestation only); the free-tier quota numbers themselves (requests, KV ops, D1 rows, bandwidth — the skill says "know free-tier numbers" but states none, and platform tiers change; caller attestation only); a quota-alarm headroom or percentage; a cold-start latency target; a health-check interval; a rate-limit or WAF rule threshold; a coverage percentage below completeness; and a storage-backend vocabulary (the skill names KV / D1 / R2 as the storage classes, but only the exact value `kv` gates the consistency check — any other declared backend string is accepted as declared rather than failed against a vocabulary the atom would have to enforce beyond the skill's gating use). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** edge-platform record: a verdict of `EDGE_PLATFORM_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares versioned deploys with a tested rollback, secrets only in the platform store, and quota alarms set passes those checks even if the real platform does none of it. It is a completeness and consistency audit of the record the skill requires, **not an edge engineering service or a live posture certification**. Specifically: it performs no deployment, probes no live Worker, reads no real KV/D1/R2 store, opens no tunnel, and does not verify that a declared control actually works. It never judges whether a storage choice is the right choice commercially, whether a declared rollback really restores service, whether Access policies are correctly scoped to the right people, or whether a Worker's real CPU time fits its budget — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no code or repository inspection (secrets in code/repos/logs are caller declarations, the atom reads no repo and no log); no WAF/rate-limit rule content inspection — configuration is declared, rule quality is not read; platform-fit judgment (which backend *should* serve a component, whether Workers is the right platform at all) is a caller declaration — the atom checks only that the choice and its rationale are declared and that no strong-consistency need is declared on the eventually consistent KV backend, never which backend a component ought to use; the skill's cross-references to sibling disciplines (`observability-ops` for alerting depth, `network-security` for email-record consistency) are carried as the caller's own attestations in this record, not re-audited here.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Cloudflare Workers product builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared edge-platform record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a live posture certification (SERVICE.md states this explicitly), and edge platform engineering is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `edge_platform_engineering` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/edge_platform_engineering.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_edge_platform_engineering.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/edge-platform-engineering` (REST) and `POST /mcp/edge-platform-engineering` (MCP, tool `edge_platform_engineering`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `edge_platform_engineering`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:25:53.435503+00:00 against gateway v1.1.0, external verification lane, source `verification/work/edge-platform-engineering/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "platform_fit_and_storage",
      "check": "storage_choices_documented",
      "status": "pass",
      "evidence": "platform fit / quality gate: storage choices are documented \u2014 consistency + access reasons for each KV / D1 / R2 choice"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "consistency_access_pattern_reviewed",
      "status": "pass",
      "evidence": "platform fit: each storage choice is picked per consistency + access pattern, not habit"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "components_declared",
      "status": "pass",
      "evidence": "platform fit: the declared record names its components \u2014 the components list is present and non-empty"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "every_component_names_storage_backend",
      "status": "pass",
      "evidence": "platform fit: every declared component row names its storage backend \u2014 a non-empty storage_backend string"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "every_component_documents_storage_rationale",
      "status": "pass",
      "evidence": "quality gate: every declared component row declares its storage rationale documented \u2014 consistency + access reasons per component"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "no_strong_consistency_component_on_kv",
      "status": "pass",
      "evidence": "platform fit: no component that requires strong consistency declares the kv backend \u2014 KV is eventually consistent"
    },
    {
      "section": "deploy_and_versioning",
      "check": "wrangler_workflows_used",
      "status": "pass",
      "evidence": "local dev + deploys: wrangler workflows are used"
    },
    {
      "section": "deploy_and_versioning",
      "check": "tested_with_real_bindings_locally",
      "status": "pass",
      "evidence": "local dev + deploys: the app is tested with real bindings locally"
    },
    {
      "section": "deploy_and_versioning",
      "check": "deploys_from_git",
      "status": "pass",
      "evidence": "local dev + deploys: deploys run from git"
    },
    {
      "section": "deploy_and_versioning",
      "check": "versioned_deploys",
      "status": "pass",
      "evidence": "quality gate: deploys are versioned"
    },
    {
      "section": "deploy_and_versioning",
      "check": "rollback_path_tested",
      "status": "pass",
      "evidence": "quality gate: the rollback path is tested"
    },
    {
      "section": "deploy_and_versioning",
      "check": "previous_versions_kept_deployable",
      "status": "pass",
      "evidence": "local dev + deploys: previous versions are kept deployable"
    },
    {
      "section": "deploy_and_versioning",
      "check": "staging_separated_from_prod",
      "status": "pass",
      "evidence": "quality gate: staging is separated from prod"
    },
    {
      "section": "security_and_access",
      "check": "secrets_only_in_platform_store",
      "status": "pass",
      "evidence": "security / quality gate: secrets live only in the platform secret store"
    },
    {
      "section": "security_and_access",
      "check": "no_secrets_in_code_or_repo",
      "status": "pass",
      "evidence": "red line: no secrets in code or repos"
    },
    {
      "section": "security_and_access",
      "check": "no_secrets_in_logs",
      "status": "pass",
      "evidence": "red line: no secrets in logs"
    },
    {
      "section": "security_and_access",
      "check": "rate_limits_at_edge",
      "status": "pass",
      "evidence": "security: rate limits are configured at the edge"
    },
    {
      "section": "security_and_access",
      "check": "waf_at_edge",
      "status": "pass",
      "evidence": "security: WAF rules are configured at the edge"
    },
    {
      "section": "security_and_access",
      "check": "input_validation_at_boundary",
      "status": "pass",
      "evidence": "security: all input is validated at the boundary"
    },
    {
      "section": "security_and_access",
      "check": "no_tls_https_disabled",
      "status": "pass",
      "evidence": "red line: TLS/HTTPS is never disabled because \"it's just a worker\""
    },
    {
      "section": "security_and_access",
      "check": "every_admin_component_access_protected",
      "status": "pass",
      "evidence": "red line: no admin surfaces without Access \u2014 every component declared as an administrative surface declares Access protection"
    },
    {
      "section": "reliability_and_observability",
      "check": "cpu_budget_respected",
      "status": "pass",
      "evidence": "reliability / quality gate: the CPU-time budget is respected"
    },
    {
      "section": "reliability_and_observability",
      "check": "cold_start_addressed",
      "status": "pass",
      "evidence": "reliability: cold-start behaviour is addressed"
    },
    {
      "section": "reliability_and_observability",
      "check": "error_capture_configured",
      "status": "pass",
      "evidence": "reliability: error capture is configured"
    },
    {
      "section": "reliability_and_observability",
      "check": "reliability_alerts_configured",
      "status": "pass",
      "evidence": "reliability: alerts are configured on errors"
    },
    {
      "section": "reliability_and_observability",
      "check": "staged_rules_used",
      "status": "pass",
      "evidence": "reliability: rules are staged, not pushed live unreviewed"
    },
    {
      "section": "reliability_and_observability",
      "check": "external_health_checks_configured",
      "status": "pass",
      "evidence": "reliability: health checks run from outside the platform"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_origin_stays_loopback",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_access_policies_for_humans",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_service_tokens_for_machines",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "no_public_origin_exposure",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "free_tier_limits_known",
      "status": "pass",
      "evidence": "cost & quotas: the free-tier numbers are known \u2014 requests, KV ops, D1 rows, bandwidth"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "quota_alarms_set",
      "status": "pass",
      "evidence": "cost & quotas / quality gate: quota alarms are set before quotas are hit"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "monthly_log_driven_cost_review",
      "status": "pass",
      "evidence": "cost & quotas: a log-driven cost review runs monthly"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "dns_zones_documented",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: zones are documented"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "certs_automatic",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: certificates are automatic"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "cert_expiry_monitored",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: automatic certificates are monitored"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "email_routing_consistent",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: email routing and records are consistent"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "components_count": 1,
  "components_without_storage_backend": [],
  "storage_documentation_coverage": "1.000000",
  "components_on_kv_requiring_strong_consistency": [],
  "admin_components_without_access": [],
  "access_protection_coverage": "1.000000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across five sections.",
  "stamp": "EDGE PLATFORM ENGINEERING\nproject: test-project\nVERDICT: EDGE_PLATFORM_SOUND\n  platform_fit_and_storage             pass\n  deploy_and_versioning                pass\n  security_and_access                  pass\n  reliability_and_observability        pass\n  tunnels_quotas_and_hygiene           pass\n38 pass, 0 fail, 0 missing of 38 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "project": "test-project",
  "platform_fit": {
    "storage_choices_documented": true,
    "consistency_access_pattern_reviewed": true
  },
  "components": [
    {
      "name": "bad-kv",
      "storage_backend": "kv",
      "storage_rationale_documented": true,
      "requires_strong_consistency": true,
      "is_admin_surface": true,
      "access_protected": false
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

Response (HTTP 200):

```json
{
  "service": "edge-platform-engineering",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "EDGE_PLATFORM_NOT_SOUND",
  "sections": {
    "platform_fit_and_storage": "fail",
    "deploy_and_versioning": "pass",
    "security_and_access": "fail",
    "reliability_and_observability": "pass",
    "tunnels_quotas_and_hygiene": "pass"
  },
  "checks": [
    {
      "section": "platform_fit_and_storage",
      "check": "storage_choices_documented",
      "status": "pass",
      "evidence": "platform fit / quality gate: storage choices are documented \u2014 consistency + access reasons for each KV / D1 / R2 choice"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "consistency_access_pattern_reviewed",
      "status": "pass",
      "evidence": "platform fit: each storage choice is picked per consistency + access pattern, not habit"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "components_declared",
      "status": "pass",
      "evidence": "platform fit: the declared record names its components \u2014 the components list is present and non-empty"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "every_component_names_storage_backend",
      "status": "pass",
      "evidence": "platform fit: every declared component row names its storage backend \u2014 a non-empty storage_backend string"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "every_component_documents_storage_rationale",
      "status": "pass",
      "evidence": "quality gate: every declared component row declares its storage rationale documented \u2014 consistency + access reasons per component"
    },
    {
      "section": "platform_fit_and_storage",
      "check": "no_strong_consistency_component_on_kv",
      "status": "fail",
      "evidence": "platform fit: no component that requires strong consistency declares the kv backend \u2014 KV is eventually consistent"
    },
    {
      "section": "deploy_and_versioning",
      "check": "wrangler_workflows_used",
      "status": "pass",
      "evidence": "local dev + deploys: wrangler workflows are used"
    },
    {
      "section": "deploy_and_versioning",
      "check": "tested_with_real_bindings_locally",
      "status": "pass",
      "evidence": "local dev + deploys: the app is tested with real bindings locally"
    },
    {
      "section": "deploy_and_versioning",
      "check": "deploys_from_git",
      "status": "pass",
      "evidence": "local dev + deploys: deploys run from git"
    },
    {
      "section": "deploy_and_versioning",
      "check": "versioned_deploys",
      "status": "pass",
      "evidence": "quality gate: deploys are versioned"
    },
    {
      "section": "deploy_and_versioning",
      "check": "rollback_path_tested",
      "status": "pass",
      "evidence": "quality gate: the rollback path is tested"
    },
    {
      "section": "deploy_and_versioning",
      "check": "previous_versions_kept_deployable",
      "status": "pass",
      "evidence": "local dev + deploys: previous versions are kept deployable"
    },
    {
      "section": "deploy_and_versioning",
      "check": "staging_separated_from_prod",
      "status": "pass",
      "evidence": "quality gate: staging is separated from prod"
    },
    {
      "section": "security_and_access",
      "check": "secrets_only_in_platform_store",
      "status": "pass",
      "evidence": "security / quality gate: secrets live only in the platform secret store"
    },
    {
      "section": "security_and_access",
      "check": "no_secrets_in_code_or_repo",
      "status": "pass",
      "evidence": "red line: no secrets in code or repos"
    },
    {
      "section": "security_and_access",
      "check": "no_secrets_in_logs",
      "status": "pass",
      "evidence": "red line: no secrets in logs"
    },
    {
      "section": "security_and_access",
      "check": "rate_limits_at_edge",
      "status": "pass",
      "evidence": "security: rate limits are configured at the edge"
    },
    {
      "section": "security_and_access",
      "check": "waf_at_edge",
      "status": "pass",
      "evidence": "security: WAF rules are configured at the edge"
    },
    {
      "section": "security_and_access",
      "check": "input_validation_at_boundary",
      "status": "pass",
      "evidence": "security: all input is validated at the boundary"
    },
    {
      "section": "security_and_access",
      "check": "no_tls_https_disabled",
      "status": "pass",
      "evidence": "red line: TLS/HTTPS is never disabled because \"it's just a worker\""
    },
    {
      "section": "security_and_access",
      "check": "every_admin_component_access_protected",
      "status": "fail",
      "evidence": "red line: no admin surfaces without Access \u2014 every component declared as an administrative surface declares Access protection"
    },
    {
      "section": "reliability_and_observability",
      "check": "cpu_budget_respected",
      "status": "pass",
      "evidence": "reliability / quality gate: the CPU-time budget is respected"
    },
    {
      "section": "reliability_and_observability",
      "check": "cold_start_addressed",
      "status": "pass",
      "evidence": "reliability: cold-start behaviour is addressed"
    },
    {
      "section": "reliability_and_observability",
      "check": "error_capture_configured",
      "status": "pass",
      "evidence": "reliability: error capture is configured"
    },
    {
      "section": "reliability_and_observability",
      "check": "reliability_alerts_configured",
      "status": "pass",
      "evidence": "reliability: alerts are configured on errors"
    },
    {
      "section": "reliability_and_observability",
      "check": "staged_rules_used",
      "status": "pass",
      "evidence": "reliability: rules are staged, not pushed live unreviewed"
    },
    {
      "section": "reliability_and_observability",
      "check": "external_health_checks_configured",
      "status": "pass",
      "evidence": "reliability: health checks run from outside the platform"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_origin_stays_loopback",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_access_policies_for_humans",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "tunnel_service_tokens_for_machines",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "no_public_origin_exposure",
      "status": "pass",
      "evidence": "no tunnels declared"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "free_tier_limits_known",
      "status": "pass",
      "evidence": "cost & quotas: the free-tier numbers are known \u2014 requests, KV ops, D1 rows, bandwidth"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "quota_alarms_set",
      "status": "pass",
      "evidence": "cost & quotas / quality gate: quota alarms are set before quotas are hit"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "monthly_log_driven_cost_review",
      "status": "pass",
      "evidence": "cost & quotas: a log-driven cost review runs monthly"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "dns_zones_documented",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: zones are documented"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "certs_automatic",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: certificates are automatic"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "cert_expiry_monitored",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: automatic certificates are monitored"
    },
    {
      "section": "tunnels_quotas_and_hygiene",
      "check": "email_routing_consistent",
      "status": "pass",
      "evidence": "DNS/TLS hygiene: email routing and records are consistent"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "components_count": 1,
  "components_without_storage_backend": [],
  "storage_documentation_coverage": "1.000000",
  "components_on_kv_requiring_strong_consistency": [
    "bad-kv"
  ],
  "admin_components_without_access": [
    "bad-kv"
  ],
  "access_protection_coverage": "0.000000",
  "summary": "36 pass, 2 fail, 0 missing of 38 checks across five sections.",
  "stamp": "EDGE PLATFORM ENGINEERING\nproject: test-project\nVERDICT: EDGE_PLATFORM_NOT_SOUND\n  platform_fit_and_storage             fail\n  deploy_and_versioning                pass\n  security_and_access                  fail\n  reliability_and_observability        pass\n  tunnels_quotas_and_hygiene           pass\n36 pass, 2 fail, 0 missing of 38 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "project": "malformed-project",
  "components": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "components",
  "detail": "components must be a list"
}
```


## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared edge-platform record; its verdict is a completeness and consistency judgment, not compliance or audit evidence and not a live posture certification, and edge platform engineering is not a regulated domain. |
| Checks named | 38 documented / 38 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/edge-platform-engineering/evidence.json` |
