# Edge platform engineering — `edge-platform-engineering`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build on the edge — Cloudflare Workers/KV/D1/R2, tunnels and Access, versioned deploys, quota alarms.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Cloudflare Workers product builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the edge-platform manifest

The caller submits one JSON manifest: a declared edge-platform
record for one project. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`EDGE_PLATFORM_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `platform_fit.storage_choices_documented` | platform_fit_and_storage |
| `platform_fit.consistency_access_pattern_reviewed` | platform_fit_and_storage |
| `components` (list of component-row objects, each with the entry fields below; computed, see below) | platform_fit_and_storage, security_and_access |
| `components[].name` (string; names the row in the computed outputs) | platform_fit_and_storage, security_and_access |
| `components[].storage_backend` (string; must be a non-empty string for the row to pass the computed backend check — an absent field is missing evidence, an empty string fails; the exact value `kv` gates the consistency check below, no other value is imposed, see the declined vocabulary note below) | platform_fit_and_storage |
| `components[].storage_rationale_documented` | platform_fit_and_storage |
| `components[].requires_strong_consistency` (gates the KV consistency check below) | platform_fit_and_storage |
| `components[].is_admin_surface` (gates the Access check below) | security_and_access |
| `components[].access_protected` (required when the row is an admin surface; otherwise the check passes as not applicable to that row) | security_and_access |
| `deploy.wrangler_workflows_used` | deploy_and_versioning |
| `deploy.tested_with_real_bindings_locally` | deploy_and_versioning |
| `deploy.deploys_from_git` | deploy_and_versioning |
| `deploy.versioned_deploys` | deploy_and_versioning |
| `deploy.rollback_path_tested` | deploy_and_versioning |
| `deploy.previous_versions_kept_deployable` | deploy_and_versioning |
| `deploy.staging_separated_from_prod` | deploy_and_versioning |
| `security.secrets_only_in_platform_store` | security_and_access |
| `security.secrets_in_code_or_repo_present` (must be `false` to pass — skill red line) | security_and_access |
| `security.secrets_in_logs_present` (must be `false` to pass — skill red line) | security_and_access |
| `security.rate_limits_configured` | security_and_access |
| `security.waf_configured` | security_and_access |
| `security.input_validation_at_boundary` | security_and_access |
| `security.tls_https_disabled_present` (must be `false` to pass — skill red line) | security_and_access |
| `reliability.cpu_budget_respected` | reliability_and_observability |
| `reliability.cold_start_addressed` | reliability_and_observability |
| `reliability.error_capture_configured` | reliability_and_observability |
| `reliability.alerts_configured` | reliability_and_observability |
| `reliability.staged_rules_used` | reliability_and_observability |
| `reliability.external_health_checks_configured` | reliability_and_observability |
| `tunnels.tunnels_present` (gates the four tunnel checks below) | tunnels_quotas_and_hygiene |
| `tunnels.origin_stays_loopback` (required when tunnels are declared present; otherwise the check passes as not applicable) | tunnels_quotas_and_hygiene |
| `tunnels.access_policies_for_humans` (required when tunnels are declared present; otherwise not applicable) | tunnels_quotas_and_hygiene |
| `tunnels.service_tokens_for_machines` (required when tunnels are declared present; otherwise not applicable) | tunnels_quotas_and_hygiene |
| `tunnels.origin_exposed_publicly_present` (must be `false` when tunnels are declared present — skill rule; otherwise the check passes as not applicable) | tunnels_quotas_and_hygiene |
| `quotas.free_tier_limits_known` | tunnels_quotas_and_hygiene |
| `quotas.quota_alarms_set` | tunnels_quotas_and_hygiene |
| `quotas.monthly_log_driven_cost_review` | tunnels_quotas_and_hygiene |
| `dns_tls.zones_documented` | tunnels_quotas_and_hygiene |
| `dns_tls.certs_automatic` | tunnels_quotas_and_hygiene |
| `dns_tls.cert_expiry_monitored` | tunnels_quotas_and_hygiene |
| `dns_tls.email_routing_consistent` | tunnels_quotas_and_hygiene |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Components declared:** the declared `components` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Storage backend per component:** every declared component
  row must name a non-empty `storage_backend` string. A row with
  the field absent is missing evidence; a row naming an empty
  string fails.
- **Storage rationale per component:** every declared component
  row must declare `storage_rationale_documented: true` (the
  skill's quality gate: "Storage choices documented (consistency
  + access reasons)").
- **No strong-consistency component on KV:** no row with
  `requires_strong_consistency: true` may declare
  `storage_backend` exactly `kv` (the skill: "KV for config/cache
  (eventually consistent!)" — an eventually consistent store
  cannot serve a strong-consistency need on the declared
  evidence). A row with either field absent is missing evidence.
- **Access per admin component:** every row with
  `is_admin_surface: true` must declare
  `access_protected: true` (the skill's red line: "No admin
  surfaces without Access"). A row with `is_admin_surface`
  absent, or an admin row with `access_protected` absent, is
  missing evidence; projects with no admin rows pass as not
  applicable.

Four check groups are conditional, following the skill's own
scoping — computed from the declared gate field:

- **Tunnel discipline:** the skill binds its tunnel rules to
  cloudflared private origins. `origin_stays_loopback`,
  `access_policies_for_humans`, `service_tokens_for_machines`
  and the no-public-exposure rule are therefore required only
  when `tunnels.tunnels_present` is declared `true`; when no
  tunnels are declared, all four checks pass as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`components_count` (the declared list length, or null when the
list is not declared — counts are reported as integers, exactly),
the row-name lists `components_without_storage_backend` (null
when the list is not declared),
`components_on_kv_requiring_strong_consistency` and
`admin_components_without_access` (admin components whose
`access_protected` field is present but not true; an admin
component with the field absent is missing evidence and does not
appear), and the two coverage ratios
`storage_documentation_coverage` (components naming a storage
backend with its rationale documented ÷ declared components) and
`access_protection_coverage` (admin components declaring Access
protection ÷ admin components).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for access
protection coverage, when no component is declared as an admin
surface). That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The skill states no numeric pass/fail threshold — no CPU-time
millisecond budget, no free-tier quota number, no alarm headroom,
no coverage percentage: its CPU budget and free-tier numbers are
platform facts the record attests to knowing and respecting, not
bars the atom can set. Quantities are computed and reported; the
only bar on the computed rows is completeness over the caller's
own declared rows, exactly as stated above. Declined thresholds,
named: a CPU-time budget in milliseconds (the skill says "ms
limits!" but states no number — caller attestation only); the
free-tier quota numbers themselves (requests, KV ops, D1 rows,
bandwidth — the skill says "know free-tier numbers" but states
none, and platform tiers change; caller attestation only); a
quota-alarm headroom or percentage; a cold-start latency target;
a health-check interval; a rate-limit or WAF rule threshold; a
coverage percentage below completeness; a storage-backend
vocabulary (the skill names KV / D1 / R2 as the storage classes,
but only the exact value `kv` gates the consistency check — any
other declared backend string is accepted as declared rather
than failed against a vocabulary the atom would have to enforce
beyond the skill's gating use).

The verdict is one of `EDGE_PLATFORM_SOUND` (all 38 checks
pass), `EDGE_PLATFORM_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: platform_fit_and_storage,
deploy_and_versioning, security_and_access,
reliability_and_observability, tunnels_quotas_and_hygiene.

## Honest scoping

This atom audits a **declared** edge-platform record — it
performs no deployment, probes no live Worker, reads no real
KV/D1/R2 store, opens no tunnel, and does not verify that a
declared control actually works. A platform is sound *on the
caller's declared evidence*: a manifest that declares versioned
deploys with a tested rollback, secrets only in the platform
store, and quota alarms set passes those checks even if the real
platform does none of it. It is a completeness and consistency
audit of the record the skill requires, **not an edge engineering
service or a live posture certification**: it never judges
whether a storage choice is the right choice commercially,
whether a declared rollback really restores service, whether
Access policies are correctly scoped to the right people, or
whether a Worker's real CPU time fits its budget — only that the
record contains what the skill's sections and red lines demand,
and that its declared rows are internally consistent.

Named exclusions: no numeric thresholds beyond the skill's own
stated rules (see the declined list above); no live verification
of any declared fact; no code or repository inspection (secrets
in code/repos/logs are caller declarations, the atom reads no
repo and no log); no WAF/rate-limit rule content inspection —
configuration is declared, rule quality is not read; platform-fit
judgment (which backend *should* serve a component, whether
Workers is the right platform at all) is a caller declaration —
the atom checks only that the choice and its rationale are
declared and that no strong-consistency need is declared on the
eventually consistent KV backend, never which backend a component
ought to use; the skill's cross-references to sibling disciplines
(`observability-ops` for alerting depth, `network-security` for
email-record consistency) are carried as the caller's own
attestations in this record, not re-audited here.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
