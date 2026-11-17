# Zero trust architecture design pack — documentation

**Zero trust architecture design pack** · slug `zero-trust-architecture-design-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared zero-trust architecture design record for completeness and internal consistency only, and recomputes the policy coverage the record itself declares. It surfaces two faces: REST `POST /v1/zero-trust-architecture-design-pack` and MCP `POST /mcp/zero-trust-architecture-design-pack`. It designs no architecture, evaluates no live posture, probes no network and certifies no security outcome — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/zero-trust-architecture-design-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ee6a845a54d94e829dd0aad9f8cd9d41). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the design "Secure Service Mesh"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-trust-architecture-design-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the zero-trust architecture design manifest.** You declare a zero-trust architecture design record for one system or service set, made from the design as actually written — identity-first access, least privilege, short-lived credentials, no implicit network trust; the atom audits the declared record, it does not design an architecture for you (see Explanation). The recorded full-pass manifest declares the design `Secure Service Mesh`: all nine identity flags `true` (identity-first design, user and workload identities, short-lived, scoped and rotated credentials, no implicit network trust, every hop authenticated and authorized, policy layer deciding access); one asset `a1` (name `auth-service`, kind `service`) and one policy `p1` (name `auth-policy`, `covered_asset_ids` `["a1"]`); all six segmentation flags `true`; all trust flags `true` with `end_to_end_encryption_demanded` declared `false` and `end_to_end_encryption_declared` declared `false`, so the gated end-to-end check passes as not applicable; all ten monitoring flags `true`; all six migration flags `true`; and all five red-line flags `false` (no internal network trusted, no shared credentials, no long-lived wide-scope secrets, no unrevocable access, no anonymous east-west access).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/zero-trust-architecture-design-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `ZERO_TRUST_DESIGN_SOUND`: "54 pass, 0 fail, 0 missing of 54 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `zero_trust_design_assets_count` is 1, `zero_trust_design_policies_count` is 1, both duplicate lists and all six row-name lists are empty (`[]`), and `zero_trust_design_policy_coverage_ratio` is `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `ZERO_TRUST_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-trust-architecture-design-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/zero-trust-architecture-design-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/zero-trust-architecture-design-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `zero_trust_architecture_design_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `ZERO_TRUST_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_zero_trust_design_asset_name_declared`, `every_zero_trust_design_policy_coverage_reference_resolves`, and `every_zero_trust_design_declared_asset_covered_by_policy`, and the summary reads "51 pass, 3 fail, 0 missing of 54 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, asset `a1` declares an empty `asset_name`, named in `zero_trust_design_assets_without_name` as `["a1"]`; policy `p1` declares `covered_asset_ids` `["nonexistent"]`, so the unresolved reference is named in `zero_trust_design_policy_refs_not_declared_as_assets` as `["nonexistent"]` and the uncovered asset is named in `zero_trust_design_assets_without_policy_coverage` as `["a1"]`, which drops `zero_trust_design_policy_coverage_ratio` to `"0.000000"` while `zero_trust_design_assets_count` and `zero_trust_design_policies_count` stay 1; section `policy_coverage_and_segmentation` reports `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual design: supply the real asset name and correct the coverage list to name declared assets. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "assets",
  "detail": "assets must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/zero-trust-architecture-design-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-trust-architecture-design-pack` — tool name `zero_trust_architecture_design_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `zero_trust_architecture_design_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `design_title`, `assets[].asset_id`, `assets[].asset_name`, `assets[].asset_kind`, `policies[].policy_id` and `policies[].policy_name` are noted as strings (with `assets[].asset_name` and `policies[].policy_name` noted as non-empty strings), `assets` and `policies` as lists of row objects there, and `policies[].covered_asset_ids` as a list of strings there. Where SERVICE.md states no type — the section container objects (`identity`, `segmentation`, `trust`, `monitoring`, `migration`, `red_lines`) and the row objects (`assets[]`, `policies[]`) — the type below is grounded in the recorded evidence inputs and the recorded MCP `inputSchema` (evidence.json `mcp_tools`, which types the containers `object` and the `assets` and `policies` lists `array`), and is said so in the row note. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `ZERO_TRUST_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the recorded section that reads them, as SERVICE.md groups them. The Input reference carries 62 typed field rows in total.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `design_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: identity_and_perimeter_framing

| Field | Type | Notes |
|---|---|---|
| `identity` | object | The identity section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `identity.identity_first_design_declared` | boolean | — |
| `identity.user_identities_declared` | boolean | — |
| `identity.workload_identities_declared` | boolean | — |
| `identity.short_lived_credentials_declared` | boolean | — |
| `identity.credentials_scoped_declared` | boolean | — |
| `identity.credentials_rotated_declared` | boolean | — |
| `identity.no_implicit_network_trust_declared` | boolean | — |
| `identity.every_hop_authenticated_and_authorized_declared` | boolean | — |
| `identity.policy_layer_decides_access_declared` | boolean | — |

#### Read by: policy_coverage_and_segmentation

| Field | Type | Notes |
|---|---|---|
| `assets` | list | List of asset-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `assets[]` | object | One declared asset row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `assets[].asset_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `assets[].asset_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `assets[].asset_kind` | string | Computed — one of `service`, `workload`, `device`, `data_store`, `admin_path` (type stated in SERVICE.md) |
| `policies` | list | List of policy-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `policies[]` | object | One declared policy row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `policies[].policy_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `policies[].policy_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `policies[].covered_asset_ids` | list of strings | Computed — must name declared assets, and every declared asset must be covered, see below (type stated in SERVICE.md) |
| `segmentation` | object | The segmentation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `segmentation.segmentation_declared` | boolean | — |
| `segmentation.blast_radius_boundaries_declared` | boolean | — |
| `segmentation.egress_restricted_declared` | boolean | — |
| `segmentation.egress_monitored_declared` | boolean | — |
| `segmentation.deny_by_default_declared` | boolean | — |
| `segmentation.least_privilege_declared` | boolean | — |

#### Read by: device_and_workload_trust

| Field | Type | Notes |
|---|---|---|
| `trust` | object | The trust section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `trust.device_posture_checks_declared` | boolean | — |
| `trust.device_inventory_declared` | boolean | — |
| `trust.server_posture_checks_declared` | boolean | — |
| `trust.workload_attestation_declared` | boolean | — |
| `trust.node_trust_requires_attestation_declared` | boolean | — |
| `trust.encryption_in_transit_declared` | boolean | — |
| `trust.encryption_at_rest_declared` | boolean | — |
| `trust.end_to_end_encryption_demanded` | boolean | Gates the end-to-end check below |
| `trust.end_to_end_encryption_declared` | boolean | Required when `trust.end_to_end_encryption_demanded` is declared `true`; otherwise the check that reads it passes as not applicable |

#### Read by: monitoring_audit_and_response

| Field | Type | Notes |
|---|---|---|
| `monitoring` | object | The monitoring section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `monitoring.audit_logging_declared` | boolean | — |
| `monitoring.privileged_actions_logged_immutably_declared` | boolean | — |
| `monitoring.anomaly_alerting_declared` | boolean | — |
| `monitoring.audit_trail_survives_component_declared` | boolean | — |
| `monitoring.egress_changes_audited_declared` | boolean | — |
| `monitoring.privilege_changes_audited_declared` | boolean | — |
| `monitoring.incident_response_path_declared` | boolean | — |
| `monitoring.break_glass_documented_declared` | boolean | — |
| `monitoring.break_glass_ceremony_gated_declared` | boolean | — |
| `monitoring.break_glass_tested_declared` | boolean | — |

#### Read by: migration_and_rollout

| Field | Type | Notes |
|---|---|---|
| `migration` | object | The migration section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `migration.migration_phases_declared` | boolean | — |
| `migration.rollout_order_declared` | boolean | — |
| `migration.legacy_implicit_trust_removal_declared` | boolean | — |
| `migration.rollback_path_declared` | boolean | — |
| `migration.per_hop_verification_during_rollout_declared` | boolean | — |
| `migration.permissions_review_and_revocation_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.internal_network_trusted_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.shared_credentials_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.long_lived_wide_scope_secrets_present` | boolean | must be `false` to pass — skill quality gate |
| `red_lines.unrevocable_access_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.anonymous_east_west_access_present` | boolean | must be `false` to pass — skill quality gate |

### Checks

All 54 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated check: the one gated check (`zero_trust_design_end_to_end_encryption_declared_where_demanded`) carries the same recorded evidence text, "end-to-end encryption not declared demanded by the design's model", in both its full-pass `pass` state and its sparse-run `missing` state — see Discrepancies.

#### Section: identity_and_perimeter_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_identity_first_design_declared` | identity-first: the design is declared identity-first — identity, not network location, is the perimeter | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_user_identities_declared` | identity-first: strong identities for users are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_workload_identities_declared` | identity-first: strong identities for workloads are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_short_lived_credentials_declared` | identity-first: credentials are declared short-lived (tokens, certs) — no shared or static long-lived secrets | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_credentials_scoped_declared` | identity-first: credentials are declared scoped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_credentials_rotated_declared` | identity-first: credentials are declared rotated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_no_implicit_network_trust_declared` | identity-first: no implicit network trust is declared — location proves nothing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_every_hop_authenticated_and_authorized_declared` | every hop: every request is declared authenticated and authorized — humans and workloads alike | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_policy_layer_decides_access_declared` | every hop: a policy layer is declared to decide access, not network position | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: policy_coverage_and_segmentation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_assets_list_declared` | assets: the declared record names its assets — the list is present and names at least one asset; an absent list is missing evidence and an empty list declares no hop at all | Computed over the declared record. Pass: the `assets` list is present and names at least one asset. Fail: the list is present but empty. Missing: the list is absent. |
| `every_zero_trust_design_asset_id_unique` | assets: no declared asset_id is owned by more than one row | Computed over the declared record. Pass: no declared `asset_id` appears on more than one row. Fail: an `asset_id` is declared on more than one row (duplicates are named in `duplicate_zero_trust_design_asset_ids`). Missing: the list is absent, or a row has `asset_id` absent. |
| `every_zero_trust_design_asset_name_declared` | assets: every declared asset declares a non-empty asset name | Computed over the declared record. Pass: every declared asset row declares a non-empty `asset_name`. Fail: a row declares an empty name (offending rows are named in `zero_trust_design_assets_without_name`). Missing: the list is absent, or a row has `asset_name` absent. |
| `every_zero_trust_design_asset_kind_recognised` | assets: every declared asset's kind is one of service, workload, device, data_store, admin_path — the kinds of hop the design record names | Computed over the declared record. Pass: every declared asset's `asset_kind` is one of `service`, `workload`, `device`, `data_store`, `admin_path`. Fail: a row declares any other value (offending rows are named in `zero_trust_design_assets_with_invalid_kind`). Missing: the list is absent, or a row has `asset_kind` absent. |
| `zero_trust_design_policies_list_declared` | policies: the declared record names its policy rows — the list is present and names at least one policy; an absent list is missing evidence and an empty list declares no policy coverage at all | Computed over the declared record. Pass: the `policies` list is present and names at least one policy. Fail: the list is present but empty. Missing: the list is absent. |
| `every_zero_trust_design_policy_id_unique` | policies: no declared policy_id is owned by more than one row | Computed over the declared record. Pass: no declared `policy_id` appears on more than one row. Fail: a `policy_id` is declared on more than one row (duplicates are named in `duplicate_zero_trust_design_policy_ids`). Missing: the list is absent, or a row has `policy_id` absent. |
| `every_zero_trust_design_policy_name_declared` | policies: every declared policy declares a non-empty policy name | Computed over the declared record. Pass: every declared policy row declares a non-empty `policy_name`. Fail: a row declares an empty name (offending rows are named in `zero_trust_design_policies_without_name`). Missing: the list is absent, or a row has `policy_name` absent. |
| `every_zero_trust_design_policy_covers_at_least_one_asset` | policies: every declared policy declares coverage of at least one asset | Computed over the declared record. Pass: every declared policy's `covered_asset_ids` list is present and non-empty. Fail: a policy covers nothing (offending policies are named in `zero_trust_design_policies_without_coverage`). Missing: the list is absent, or a policy's `covered_asset_ids` is absent. |
| `every_zero_trust_design_policy_coverage_reference_resolves` | policies: every declared coverage reference names a declared asset — no policy claims coverage of an asset the record does not declare | Computed over the declared record. Pass: every id in every declared `covered_asset_ids` list names a declared asset. Fail: a reference names no declared asset (offending references are named in `zero_trust_design_policy_refs_not_declared_as_assets`). Missing: either list is absent, or a row without its id field. |
| `every_zero_trust_design_declared_asset_covered_by_policy` | coverage: every declared asset is covered by at least one declared policy — a declared asset no declared policy covers is a hop the design leaves unverified on its own record | Computed over the declared record. Pass: every declared asset id appears in at least one declared policy's `covered_asset_ids` list. Fail: a declared asset is covered by no policy (offending assets are named in `zero_trust_design_assets_without_policy_coverage`). Missing: either list is absent, or a row without its id field. |
| `zero_trust_design_segmentation_declared` | segment: the design declares segmentation between services and environments | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_blast_radius_boundaries_declared` | segment: blast-radius boundaries are declared between services and environments | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_egress_restricted_declared` | segment: egress is declared restricted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_egress_monitored_declared` | segment: egress is declared monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_deny_by_default_declared` | least privilege: access is declared deny by default | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_least_privilege_declared` | least privilege: scoped tokens and just-in-time elevation are declared under a least-privilege design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: device_and_workload_trust

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_device_posture_checks_declared` | attest: device posture checks are declared before a device is trusted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_device_inventory_declared` | attest: a device inventory is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_server_posture_checks_declared` | attest: server posture checks are declared before a node is trusted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_workload_attestation_declared` | attest: workload attestation is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_node_trust_requires_attestation_declared` | attest: node trust is declared to require attestation — no node is trusted on presence alone | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_encryption_in_transit_declared` | encrypt: encryption in transit is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_encryption_at_rest_declared` | encrypt: encryption at rest is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_end_to_end_encryption_declared_where_demanded` | end-to-end encryption not declared demanded by the design's model | Computed-gated over the declared record. Pass: `trust.end_to_end_encryption_demanded` is declared `false` (the check passes as not applicable — the recorded full-pass manifest declares both gate and target `false` and passes), or the gate is declared `true` and `trust.end_to_end_encryption_declared` is declared `true`. Fail: the gate is declared `true` and the target is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the target is absent. |

#### Section: monitoring_audit_and_response

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_audit_logging_declared` | audit: every request is declared logged — audit everything | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_privileged_actions_logged_immutably_declared` | audit: privileged actions are declared logged immutably | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_anomaly_alerting_declared` | audit: alerts on anomalies are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_audit_trail_survives_component_declared` | audit: audit trails are declared to survive the component they describe | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_egress_changes_audited_declared` | audit: egress changes are declared audited | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_privilege_changes_audited_declared` | audit: privilege changes are declared audited | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_incident_response_path_declared` | response: an incident response path for a failed verification is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_break_glass_documented_declared` | break-glass: the emergency path is declared documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_break_glass_ceremony_gated_declared` | break-glass: the emergency path is declared ceremony-gated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_break_glass_tested_declared` | break-glass: the emergency path is declared tested once | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: migration_and_rollout

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_migration_phases_declared` | migration: migration phases from the current design to the zero-trust design are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_rollout_order_declared` | migration: the rollout order across services and environments is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_legacy_implicit_trust_removal_declared` | migration: removal of legacy implicit trust (the trusted internal network) is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_rollback_path_declared` | migration: a rollback path for a failed rollout step is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_per_hop_verification_during_rollout_declared` | migration: per-hop verification during rollout is declared — no hop is left trusted by transition | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_trust_design_permissions_review_and_revocation_declared` | migration: permissions are declared reviewed and revoked routinely as the rollout proceeds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zero_trust_design_free_of_internal_network_trusted` | red line: no 'it is on the internal network, so it is fine' trust is present in the record | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zero_trust_design_free_of_shared_credentials` | red line: no shared credentials across services or people are present in the record | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zero_trust_design_free_of_long_lived_wide_scope_secrets` | red line: no long-lived wide-scope secrets are present in the record | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zero_trust_design_free_of_unrevocable_access` | red line: no unrevocable access is present in the record | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zero_trust_design_free_of_anonymous_east_west_access` | red line: no anonymous east-west access is present in the record — every service call is authenticated and authorized | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"zero-trust-architecture-design-pack"`), `atom_version` (`"0.1.0"`), and `design_title` (the manifest's declared design title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `zero_trust_design_assets_count` and `zero_trust_design_policies_count` (the declared list lengths as integers, exactly, or null when the list is not declared); `duplicate_zero_trust_design_asset_ids` and `duplicate_zero_trust_design_policy_ids` (ids carried by more than one row; each null when its underlying list is not declared, as recorded in the sparse case); `zero_trust_design_assets_without_name`, `zero_trust_design_assets_with_invalid_kind`, `zero_trust_design_policies_without_name`, `zero_trust_design_policies_without_coverage`, `zero_trust_design_policy_refs_not_declared_as_assets` and `zero_trust_design_assets_without_policy_coverage` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); and `zero_trust_design_policy_coverage_ratio` (declared assets covered by at least one declared policy ÷ declared assets — a string with exactly six decimal places; null when its denominator list is absent or empty, or when the policies list is not declared). Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "54 pass, 0 fail, 0 missing of 54 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared design title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `ZERO_TRUST_DESIGN_SOUND` — all 54 checks pass: the declared zero-trust architecture design record is complete and internally consistent with the skill's method, quality gates and red lines.
- `ZERO_TRUST_DESIGN_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the ten primary computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the ten primary computed checks cannot be completed because the rows or fields it reads are absent (as recorded in the sparse case).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `zero_trust_design_assets_count`, `zero_trust_design_policies_count`, the two duplicate-id lists, the six row-name lists, and `zero_trust_design_policy_coverage_ratio` — each defined in Output format above, with the values and null rules recorded there (12 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"assets","detail":"assets must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Verify every hop — identity-first access, least privilege, short-lived credentials, no implicit network trust (the bound capability, from the skill). You submit one declared record — the zero-trust architecture design manifest, made from the design as actually written — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, and recomputes the policy coverage the record itself declares, returning one deterministic verdict across 6 sections (`identity_and_perimeter_framing`, `policy_coverage_and_segmentation`, `device_and_workload_trust`, `monitoring_audit_and_response`, `migration_and_rollout`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest sibling `zero-trust-evaluation-verdict` (SERVICE.md, Distinct ground; verified at authoring by enumerating check names from every atom oracle and comparing — zero overlap): every check here is a zero-trust architecture **design-record** question — identity-first design framing with short-lived, scoped, rotated credential declarations, a declared asset inventory with declared policy rows whose coverage recomputes exactly, segmentation / blast-radius / egress and deny-by-default declarations, device and workload attestation and encryption declarations, monitoring / immutable-audit / break-glass declarations, and migration and rollout declarations for removing legacy implicit trust; the sibling is a posture **evaluation** of one system's zero-trust **claim**.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (ten, per SERVICE.md) are calculated from the declared rows themselves — the assets list must be present and name at least one asset, with unique ids, non-empty names and recognised kinds; the policies list must be present and name at least one policy, with unique ids and non-empty names; every policy must cover at least one asset; every coverage reference must name a declared asset; and every declared asset must be covered by at least one declared policy — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The gated check* follows the skill's own conditional scope: end-to-end encryption is declared only where `trust.end_to_end_encryption_demanded` is declared `true`; with the gate declared `false` the check passes as not applicable, and with the gate absent the check is missing evidence. Aggregation is strict: any `fail` anywhere produces `ZERO_TRUST_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `ZERO_TRUST_DESIGN_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric security threshold at all — its demands are identity-first framing, per-hop verification, least privilege, segmentation, attestation, encryption, auditing and a tested break-glass path, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a maximum credential lifetime in hours or days, or any bar on how short "short-lived" must be (credentials are checked as declared short-lived, scoped and rotated, never measured); a minimum number of segments, a segment-count bar, or a blast-radius size; a policy-coverage percentage below completeness over the caller's own declared rows (coverage is complete-or-not over the declared assets, never sampled against the real estate); an attestation standard, framework or level (no NIST, FIDO or vendor attestation bar is imported); an encryption algorithm, protocol or key-length bar; a log-retention period or an audit-completeness percentage against real traffic; a migration timeline or a rollout-pace bar; and any judgment that the declared design is secure, sufficient or advisable (only that its declared record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** zero-trust architecture design record: a verdict of `ZERO_TRUST_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its identities strong, its credentials short-lived and its assets fully policy-covered passes those checks even if the real design or the built system does none of it. It is a completeness and consistency audit of the design record the skill requires, **not a security evaluation, a security certification, an architecture approval, or a guarantee that the designed system is secure**: it never judges whether a declared policy actually enforces anything, whether a declared attestation is strong, whether the segmentation would hold, or whether the design should be built — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions, exactly as SERVICE.md names them: live posture evaluation of any running system; security certification of any design, system or product; network probing, port scanning or traffic inspection of any kind; penetration testing; configuration scanning or reading any deployed configuration; credential testing or verifying that a declared credential property holds in a real identity system; designing the architecture for the caller, choosing an identity provider, policy engine or segmentation product, or writing policies for the caller; and judging any declared design secure — each is EXCLUDED by name from this atom, which audits only the declared design record. Boundary case, named in SERVICE.md: a design whose assets are not inventoried as declared rows cannot pass this record format's coverage checks (the format requires declared asset and policy rows — such a design is outside this atom's computed reach, not failed on its security merits).

**Buyer and use context.** Teams and agents working in Security & privacy who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Hardening product service access (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom **is flagged**: it was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO, flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the keyword screen names security architecture, identity, credentials and encryption — a security-engineering subject squarely adjacent to professional security judgment: a naive version of this atom that evaluated a live system's posture or certified a design as secure could read as a professional security determination a reader might rely on, and that naive version is exactly what this atom refuses to be; the substance screen holds that this atom's output could not itself read as a regulated professional security determination **while the controls below hold** — it audits a caller-**declared** design record for completeness and internal consistency only, and every output is a pass / fail / missing verdict on the record or a quantity recomputed from the caller's own declared rows. Named controls, exactly as SERVICE.md records them: (1) it performs **no live posture evaluation and no security certification** — both are excluded by name in SERVICE.md's Honest scoping, and the verdict vocabulary says a design is sound *on declared evidence*, never secure; (2) it **probes no network, reads no configuration and tests no credential** — there is no live surface from which a professional determination could be drawn; (3) it sets **no security threshold** of its own (see the declined list: no credential lifetime, no attestation standard, no encryption bar) and imports no framework's bar as its own; (4) it **designs nothing and chooses nothing** — no provider, product or policy is recommended; professional security architecture for real systems remains the caller's responsible professionals, on their record. SERVICE.md records why this is the census flag-with-controls class and not class (a): the adjacency is real (zero-trust design for a production system is professional security work); and it is not the genuinely-open personal-financial-snapshot class, because no personal position of any kind is handled. The HOLD-candidate reading was considered and not taken, for the reasons SERVICE.md records. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `zero_trust_architecture_design_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities and ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/zero_trust_architecture_design_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_zero_trust_architecture_design_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/zero-trust-architecture-design-pack` (REST) and `POST /mcp/zero-trust-architecture-design-pack` (MCP, tool `zero_trust_architecture_design_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22). Key scope: `zero_trust_architecture_design_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that "no deploy happens on this atom without the owner's explicit per-unit ruling in any case" — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `zero_trust_design_` prefix (for example `zero_trust_design_identity_first_design_declared` reads `identity.identity_first_design_declared`), the row-computed names carry an `every_zero_trust_design_` form (for example `every_zero_trust_design_asset_id_unique` reads the asset rows' `asset_id` values), the two list-declared checks are named for the lists they read (`zero_trust_design_assets_list_declared`, `zero_trust_design_policies_list_declared`), the gated check is phrased for its condition (`zero_trust_design_end_to_end_encryption_declared_where_demanded` reads `trust.end_to_end_encryption_demanded` and `trust.end_to_end_encryption_declared`), and the five red-line checks are phrased as freedoms (for example `zero_trust_design_free_of_internal_network_trusted` reads `red_lines.internal_network_trusted_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`identity`, `segmentation`, `trust`, `monitoring`, `migration`, `red_lines`) or for a row object (`assets[]`, `policies[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the nine top-level properties (`design_title`, `identity`, `assets`, `policies`, `segmentation`, `trust`, `monitoring`, `migration`, `red_lines`) and — unlike some fleet siblings — types the `assets` and `policies` lists correctly as `array`; the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 54 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, `zero_trust_design_assets_count`, `zero_trust_design_policies_count` and `zero_trust_design_policy_coverage_ratio`, but it does not state a null rule for the two duplicate-id lists or the six row-name lists. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging input objects:** the recorded sections do not map one-to-one onto input objects. The single recorded section `policy_coverage_and_segmentation` reads three top-level inputs — the `assets` list, the `policies` list and the `segmentation` object — merging them into one section, while the other five sections each read one section object. This document groups the Input reference and the Checks by the recorded section names, with that merging named in place.
7. **The gated check's evidence text does not vary with its state:** the evidence text quoted in the Checks section is the full-pass run's text. For the one gated check, `zero_trust_design_end_to_end_encryption_declared_where_demanded`, the recorded sparse run carries the identical evidence string — "end-to-end encryption not declared demanded by the design's model" — with status `missing` (its gate field is absent) as the full-pass run carries with status `pass` (its gate is declared `false`). No distinct required-form evidence string for this check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named computed row-name lists (`zero_trust_design_assets_without_name`, `zero_trust_design_policy_refs_not_declared_as_assets`) instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
9. **Adjudicated second-tester miscount — DeepSeek 55 vs the recorded 54:** DeepSeek's second read returned "AGREEMENT: partial", claiming the recorded `checks` arrays contain 55 entries against the artifacts' 54. The wave coordinator adjudicated this by a direct recount of the recorded artifact (recorded in TEST-REPORT.md): `evidence.json` carries exactly 54 entries (per section: identity_and_perimeter_framing 9, policy_coverage_and_segmentation 16, device_and_workload_trust 8, monitoring_audit_and_response 10, migration_and_rollout 6, red_lines 5 = 54), the oracle register is 54, and the summary is self-consistent; DeepSeek counted the device_and_workload_trust section as 9 instead of 8 (that section carries seven boolean declarations plus the single gated end-to-end-encryption check; the gate field and its target are one check, not two). The partial therefore rests on the second tester's own miscount; agreement is full in substance, and every quantity DeepSeek actually recomputed matches.

## Worked examples

Provenance: recorded 2026-11-16T15:22:52.854702+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-trust-architecture-design-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T15:22:52.854702+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-trust-architecture-design-pack/evidence.json`.

Input:

```json
{
  "design_title": "Secure Service Mesh",
  "identity": {
    "identity_first_design_declared": true,
    "user_identities_declared": true,
    "workload_identities_declared": true,
    "short_lived_credentials_declared": true,
    "credentials_scoped_declared": true,
    "credentials_rotated_declared": true,
    "no_implicit_network_trust_declared": true,
    "every_hop_authenticated_and_authorized_declared": true,
    "policy_layer_decides_access_declared": true
  },
  "assets": [
    {
      "asset_id": "a1",
      "asset_name": "auth-service",
      "asset_kind": "service"
    }
  ],
  "policies": [
    {
      "policy_id": "p1",
      "policy_name": "auth-policy",
      "covered_asset_ids": [
        "a1"
      ]
    }
  ],
  "segmentation": {
    "segmentation_declared": true,
    "blast_radius_boundaries_declared": true,
    "egress_restricted_declared": true,
    "egress_monitored_declared": true,
    "deny_by_default_declared": true,
    "least_privilege_declared": true
  },
  "trust": {
    "device_posture_checks_declared": true,
    "device_inventory_declared": true,
    "server_posture_checks_declared": true,
    "workload_attestation_declared": true,
    "node_trust_requires_attestation_declared": true,
    "encryption_in_transit_declared": true,
    "encryption_at_rest_declared": true,
    "end_to_end_encryption_demanded": false,
    "end_to_end_encryption_declared": false
  },
  "monitoring": {
    "audit_logging_declared": true,
    "privileged_actions_logged_immutably_declared": true,
    "anomaly_alerting_declared": true,
    "audit_trail_survives_component_declared": true,
    "egress_changes_audited_declared": true,
    "privilege_changes_audited_declared": true,
    "incident_response_path_declared": true,
    "break_glass_documented_declared": true,
    "break_glass_ceremony_gated_declared": true,
    "break_glass_tested_declared": true
  },
  "migration": {
    "migration_phases_declared": true,
    "rollout_order_declared": true,
    "legacy_implicit_trust_removal_declared": true,
    "rollback_path_declared": true,
    "per_hop_verification_during_rollout_declared": true,
    "permissions_review_and_revocation_declared": true
  },
  "red_lines": {
    "internal_network_trusted_present": false,
    "shared_credentials_present": false,
    "long_lived_wide_scope_secrets_present": false,
    "unrevocable_access_present": false,
    "anonymous_east_west_access_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "zero-trust-architecture-design-pack",
  "atom_version": "0.1.0",
  "design_title": "Secure Service Mesh",
  "verdict": "ZERO_TRUST_DESIGN_SOUND",
  "sections": {
    "identity_and_perimeter_framing": "pass",
    "policy_coverage_and_segmentation": "pass",
    "device_and_workload_trust": "pass",
    "monitoring_audit_and_response": "pass",
    "migration_and_rollout": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_identity_first_design_declared",
      "status": "pass",
      "evidence": "identity-first: the design is declared identity-first — identity, not network location, is the perimeter"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_user_identities_declared",
      "status": "pass",
      "evidence": "identity-first: strong identities for users are declared"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_workload_identities_declared",
      "status": "pass",
      "evidence": "identity-first: strong identities for workloads are declared"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_short_lived_credentials_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared short-lived (tokens, certs) — no shared or static long-lived secrets"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_credentials_scoped_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared scoped"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_credentials_rotated_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared rotated"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_no_implicit_network_trust_declared",
      "status": "pass",
      "evidence": "identity-first: no implicit network trust is declared — location proves nothing"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_every_hop_authenticated_and_authorized_declared",
      "status": "pass",
      "evidence": "every hop: every request is declared authenticated and authorized — humans and workloads alike"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_policy_layer_decides_access_declared",
      "status": "pass",
      "evidence": "every hop: a policy layer is declared to decide access, not network position"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_assets_list_declared",
      "status": "pass",
      "evidence": "assets: the declared record names its assets — the list is present and names at least one asset; an absent list is missing evidence and an empty list declares no hop at all"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_id_unique",
      "status": "pass",
      "evidence": "assets: no declared asset_id is owned by more than one row"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_name_declared",
      "status": "pass",
      "evidence": "assets: every declared asset declares a non-empty asset name"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_kind_recognised",
      "status": "pass",
      "evidence": "assets: every declared asset's kind is one of service, workload, device, data_store, admin_path — the kinds of hop the design record names"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_policies_list_declared",
      "status": "pass",
      "evidence": "policies: the declared record names its policy rows — the list is present and names at least one policy; an absent list is missing evidence and an empty list declares no policy coverage at all"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_id_unique",
      "status": "pass",
      "evidence": "policies: no declared policy_id is owned by more than one row"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_name_declared",
      "status": "pass",
      "evidence": "policies: every declared policy declares a non-empty policy name"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_covers_at_least_one_asset",
      "status": "pass",
      "evidence": "policies: every declared policy declares coverage of at least one asset"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_coverage_reference_resolves",
      "status": "pass",
      "evidence": "policies: every declared coverage reference names a declared asset — no policy claims coverage of an asset the record does not declare"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_declared_asset_covered_by_policy",
      "status": "pass",
      "evidence": "coverage: every declared asset is covered by at least one declared policy — a declared asset no declared policy covers is a hop the design leaves unverified on its own record"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_segmentation_declared",
      "status": "pass",
      "evidence": "segment: the design declares segmentation between services and environments"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_blast_radius_boundaries_declared",
      "status": "pass",
      "evidence": "segment: blast-radius boundaries are declared between services and environments"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_egress_restricted_declared",
      "status": "pass",
      "evidence": "segment: egress is declared restricted"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_egress_monitored_declared",
      "status": "pass",
      "evidence": "segment: egress is declared monitored"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_deny_by_default_declared",
      "status": "pass",
      "evidence": "least privilege: access is declared deny by default"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_least_privilege_declared",
      "status": "pass",
      "evidence": "least privilege: scoped tokens and just-in-time elevation are declared under a least-privilege design"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_device_posture_checks_declared",
      "status": "pass",
      "evidence": "attest: device posture checks are declared before a device is trusted"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_device_inventory_declared",
      "status": "pass",
      "evidence": "attest: a device inventory is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_server_posture_checks_declared",
      "status": "pass",
      "evidence": "attest: server posture checks are declared before a node is trusted"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_workload_attestation_declared",
      "status": "pass",
      "evidence": "attest: workload attestation is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_node_trust_requires_attestation_declared",
      "status": "pass",
      "evidence": "attest: node trust is declared to require attestation — no node is trusted on presence alone"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_encryption_in_transit_declared",
      "status": "pass",
      "evidence": "encrypt: encryption in transit is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_encryption_at_rest_declared",
      "status": "pass",
      "evidence": "encrypt: encryption at rest is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_end_to_end_encryption_declared_where_demanded",
      "status": "pass",
      "evidence": "end-to-end encryption not declared demanded by the design's model"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_audit_logging_declared",
      "status": "pass",
      "evidence": "audit: every request is declared logged — audit everything"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_privileged_actions_logged_immutably_declared",
      "status": "pass",
      "evidence": "audit: privileged actions are declared logged immutably"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_anomaly_alerting_declared",
      "status": "pass",
      "evidence": "audit: alerts on anomalies are declared"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_audit_trail_survives_component_declared",
      "status": "pass",
      "evidence": "audit: audit trails are declared to survive the component they describe"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_egress_changes_audited_declared",
      "status": "pass",
      "evidence": "audit: egress changes are declared audited"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_privilege_changes_audited_declared",
      "status": "pass",
      "evidence": "audit: privilege changes are declared audited"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_incident_response_path_declared",
      "status": "pass",
      "evidence": "response: an incident response path for a failed verification is declared"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_documented_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared documented"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_ceremony_gated_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared ceremony-gated"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_tested_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared tested once"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_migration_phases_declared",
      "status": "pass",
      "evidence": "migration: migration phases from the current design to the zero-trust design are declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_rollout_order_declared",
      "status": "pass",
      "evidence": "migration: the rollout order across services and environments is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_legacy_implicit_trust_removal_declared",
      "status": "pass",
      "evidence": "migration: removal of legacy implicit trust (the trusted internal network) is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_rollback_path_declared",
      "status": "pass",
      "evidence": "migration: a rollback path for a failed rollout step is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_per_hop_verification_during_rollout_declared",
      "status": "pass",
      "evidence": "migration: per-hop verification during rollout is declared — no hop is left trusted by transition"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_permissions_review_and_revocation_declared",
      "status": "pass",
      "evidence": "migration: permissions are declared reviewed and revoked routinely as the rollout proceeds"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_internal_network_trusted",
      "status": "pass",
      "evidence": "red line: no 'it is on the internal network, so it is fine' trust is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_shared_credentials",
      "status": "pass",
      "evidence": "red line: no shared credentials across services or people are present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_long_lived_wide_scope_secrets",
      "status": "pass",
      "evidence": "red line: no long-lived wide-scope secrets are present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_unrevocable_access",
      "status": "pass",
      "evidence": "red line: no unrevocable access is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_anonymous_east_west_access",
      "status": "pass",
      "evidence": "red line: no anonymous east-west access is present in the record — every service call is authenticated and authorized"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "zero_trust_design_assets_count": 1,
  "zero_trust_design_policies_count": 1,
  "duplicate_zero_trust_design_asset_ids": [],
  "duplicate_zero_trust_design_policy_ids": [],
  "zero_trust_design_assets_without_name": [],
  "zero_trust_design_assets_with_invalid_kind": [],
  "zero_trust_design_policies_without_name": [],
  "zero_trust_design_policies_without_coverage": [],
  "zero_trust_design_policy_refs_not_declared_as_assets": [],
  "zero_trust_design_assets_without_policy_coverage": [],
  "zero_trust_design_policy_coverage_ratio": "1.000000",
  "summary": "54 pass, 0 fail, 0 missing of 54 checks across six sections.",
  "stamp": "ZERO TRUST ARCHITECTURE DESIGN PACK\ndesign_title: Secure Service Mesh\nVERDICT: ZERO_TRUST_DESIGN_SOUND\n  identity_and_perimeter_framing               pass\n  policy_coverage_and_segmentation             pass\n  device_and_workload_trust                    pass\n  monitoring_audit_and_response                pass\n  migration_and_rollout                        pass\n  red_lines                                    pass\n54 pass, 0 fail, 0 missing of 54 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T15:22:52.854702+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-trust-architecture-design-pack/evidence.json`.

Input:

```json
{
  "design_title": "Secure Service Mesh",
  "identity": {
    "identity_first_design_declared": true,
    "user_identities_declared": true,
    "workload_identities_declared": true,
    "short_lived_credentials_declared": true,
    "credentials_scoped_declared": true,
    "credentials_rotated_declared": true,
    "no_implicit_network_trust_declared": true,
    "every_hop_authenticated_and_authorized_declared": true,
    "policy_layer_decides_access_declared": true
  },
  "assets": [
    {
      "asset_id": "a1",
      "asset_name": "",
      "asset_kind": "service"
    }
  ],
  "policies": [
    {
      "policy_id": "p1",
      "policy_name": "auth-policy",
      "covered_asset_ids": [
        "nonexistent"
      ]
    }
  ],
  "segmentation": {
    "segmentation_declared": true,
    "blast_radius_boundaries_declared": true,
    "egress_restricted_declared": true,
    "egress_monitored_declared": true,
    "deny_by_default_declared": true,
    "least_privilege_declared": true
  },
  "trust": {
    "device_posture_checks_declared": true,
    "device_inventory_declared": true,
    "server_posture_checks_declared": true,
    "workload_attestation_declared": true,
    "node_trust_requires_attestation_declared": true,
    "encryption_in_transit_declared": true,
    "encryption_at_rest_declared": true,
    "end_to_end_encryption_demanded": false,
    "end_to_end_encryption_declared": false
  },
  "monitoring": {
    "audit_logging_declared": true,
    "privileged_actions_logged_immutably_declared": true,
    "anomaly_alerting_declared": true,
    "audit_trail_survives_component_declared": true,
    "egress_changes_audited_declared": true,
    "privilege_changes_audited_declared": true,
    "incident_response_path_declared": true,
    "break_glass_documented_declared": true,
    "break_glass_ceremony_gated_declared": true,
    "break_glass_tested_declared": true
  },
  "migration": {
    "migration_phases_declared": true,
    "rollout_order_declared": true,
    "legacy_implicit_trust_removal_declared": true,
    "rollback_path_declared": true,
    "per_hop_verification_during_rollout_declared": true,
    "permissions_review_and_revocation_declared": true
  },
  "red_lines": {
    "internal_network_trusted_present": false,
    "shared_credentials_present": false,
    "long_lived_wide_scope_secrets_present": false,
    "unrevocable_access_present": false,
    "anonymous_east_west_access_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "zero-trust-architecture-design-pack",
  "atom_version": "0.1.0",
  "design_title": "Secure Service Mesh",
  "verdict": "ZERO_TRUST_DESIGN_NOT_SOUND",
  "sections": {
    "identity_and_perimeter_framing": "pass",
    "policy_coverage_and_segmentation": "fail",
    "device_and_workload_trust": "pass",
    "monitoring_audit_and_response": "pass",
    "migration_and_rollout": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_identity_first_design_declared",
      "status": "pass",
      "evidence": "identity-first: the design is declared identity-first — identity, not network location, is the perimeter"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_user_identities_declared",
      "status": "pass",
      "evidence": "identity-first: strong identities for users are declared"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_workload_identities_declared",
      "status": "pass",
      "evidence": "identity-first: strong identities for workloads are declared"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_short_lived_credentials_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared short-lived (tokens, certs) — no shared or static long-lived secrets"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_credentials_scoped_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared scoped"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_credentials_rotated_declared",
      "status": "pass",
      "evidence": "identity-first: credentials are declared rotated"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_no_implicit_network_trust_declared",
      "status": "pass",
      "evidence": "identity-first: no implicit network trust is declared — location proves nothing"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_every_hop_authenticated_and_authorized_declared",
      "status": "pass",
      "evidence": "every hop: every request is declared authenticated and authorized — humans and workloads alike"
    },
    {
      "section": "identity_and_perimeter_framing",
      "check": "zero_trust_design_policy_layer_decides_access_declared",
      "status": "pass",
      "evidence": "every hop: a policy layer is declared to decide access, not network position"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_assets_list_declared",
      "status": "pass",
      "evidence": "assets: the declared record names its assets — the list is present and names at least one asset; an absent list is missing evidence and an empty list declares no hop at all"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_id_unique",
      "status": "pass",
      "evidence": "assets: no declared asset_id is owned by more than one row"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_name_declared",
      "status": "fail",
      "evidence": "assets: every declared asset declares a non-empty asset name"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_asset_kind_recognised",
      "status": "pass",
      "evidence": "assets: every declared asset's kind is one of service, workload, device, data_store, admin_path — the kinds of hop the design record names"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_policies_list_declared",
      "status": "pass",
      "evidence": "policies: the declared record names its policy rows — the list is present and names at least one policy; an absent list is missing evidence and an empty list declares no policy coverage at all"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_id_unique",
      "status": "pass",
      "evidence": "policies: no declared policy_id is owned by more than one row"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_name_declared",
      "status": "pass",
      "evidence": "policies: every declared policy declares a non-empty policy name"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_covers_at_least_one_asset",
      "status": "pass",
      "evidence": "policies: every declared policy declares coverage of at least one asset"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_policy_coverage_reference_resolves",
      "status": "fail",
      "evidence": "policies: every declared coverage reference names a declared asset — no policy claims coverage of an asset the record does not declare"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "every_zero_trust_design_declared_asset_covered_by_policy",
      "status": "fail",
      "evidence": "coverage: every declared asset is covered by at least one declared policy — a declared asset no declared policy covers is a hop the design leaves unverified on its own record"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_segmentation_declared",
      "status": "pass",
      "evidence": "segment: the design declares segmentation between services and environments"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_blast_radius_boundaries_declared",
      "status": "pass",
      "evidence": "segment: blast-radius boundaries are declared between services and environments"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_egress_restricted_declared",
      "status": "pass",
      "evidence": "segment: egress is declared restricted"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_egress_monitored_declared",
      "status": "pass",
      "evidence": "segment: egress is declared monitored"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_deny_by_default_declared",
      "status": "pass",
      "evidence": "least privilege: access is declared deny by default"
    },
    {
      "section": "policy_coverage_and_segmentation",
      "check": "zero_trust_design_least_privilege_declared",
      "status": "pass",
      "evidence": "least privilege: scoped tokens and just-in-time elevation are declared under a least-privilege design"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_device_posture_checks_declared",
      "status": "pass",
      "evidence": "attest: device posture checks are declared before a device is trusted"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_device_inventory_declared",
      "status": "pass",
      "evidence": "attest: a device inventory is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_server_posture_checks_declared",
      "status": "pass",
      "evidence": "attest: server posture checks are declared before a node is trusted"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_workload_attestation_declared",
      "status": "pass",
      "evidence": "attest: workload attestation is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_node_trust_requires_attestation_declared",
      "status": "pass",
      "evidence": "attest: node trust is declared to require attestation — no node is trusted on presence alone"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_encryption_in_transit_declared",
      "status": "pass",
      "evidence": "encrypt: encryption in transit is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_encryption_at_rest_declared",
      "status": "pass",
      "evidence": "encrypt: encryption at rest is declared"
    },
    {
      "section": "device_and_workload_trust",
      "check": "zero_trust_design_end_to_end_encryption_declared_where_demanded",
      "status": "pass",
      "evidence": "end-to-end encryption not declared demanded by the design's model"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_audit_logging_declared",
      "status": "pass",
      "evidence": "audit: every request is declared logged — audit everything"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_privileged_actions_logged_immutably_declared",
      "status": "pass",
      "evidence": "audit: privileged actions are declared logged immutably"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_anomaly_alerting_declared",
      "status": "pass",
      "evidence": "audit: alerts on anomalies are declared"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_audit_trail_survives_component_declared",
      "status": "pass",
      "evidence": "audit: audit trails are declared to survive the component they describe"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_egress_changes_audited_declared",
      "status": "pass",
      "evidence": "audit: egress changes are declared audited"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_privilege_changes_audited_declared",
      "status": "pass",
      "evidence": "audit: privilege changes are declared audited"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_incident_response_path_declared",
      "status": "pass",
      "evidence": "response: an incident response path for a failed verification is declared"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_documented_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared documented"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_ceremony_gated_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared ceremony-gated"
    },
    {
      "section": "monitoring_audit_and_response",
      "check": "zero_trust_design_break_glass_tested_declared",
      "status": "pass",
      "evidence": "break-glass: the emergency path is declared tested once"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_migration_phases_declared",
      "status": "pass",
      "evidence": "migration: migration phases from the current design to the zero-trust design are declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_rollout_order_declared",
      "status": "pass",
      "evidence": "migration: the rollout order across services and environments is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_legacy_implicit_trust_removal_declared",
      "status": "pass",
      "evidence": "migration: removal of legacy implicit trust (the trusted internal network) is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_rollback_path_declared",
      "status": "pass",
      "evidence": "migration: a rollback path for a failed rollout step is declared"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_per_hop_verification_during_rollout_declared",
      "status": "pass",
      "evidence": "migration: per-hop verification during rollout is declared — no hop is left trusted by transition"
    },
    {
      "section": "migration_and_rollout",
      "check": "zero_trust_design_permissions_review_and_revocation_declared",
      "status": "pass",
      "evidence": "migration: permissions are declared reviewed and revoked routinely as the rollout proceeds"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_internal_network_trusted",
      "status": "pass",
      "evidence": "red line: no 'it is on the internal network, so it is fine' trust is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_shared_credentials",
      "status": "pass",
      "evidence": "red line: no shared credentials across services or people are present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_long_lived_wide_scope_secrets",
      "status": "pass",
      "evidence": "red line: no long-lived wide-scope secrets are present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_unrevocable_access",
      "status": "pass",
      "evidence": "red line: no unrevocable access is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zero_trust_design_free_of_anonymous_east_west_access",
      "status": "pass",
      "evidence": "red line: no anonymous east-west access is present in the record — every service call is authenticated and authorized"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "zero_trust_design_assets_count": 1,
  "zero_trust_design_policies_count": 1,
  "duplicate_zero_trust_design_asset_ids": [],
  "duplicate_zero_trust_design_policy_ids": [],
  "zero_trust_design_assets_without_name": [
    "a1"
  ],
  "zero_trust_design_assets_with_invalid_kind": [],
  "zero_trust_design_policies_without_name": [],
  "zero_trust_design_policies_without_coverage": [],
  "zero_trust_design_policy_refs_not_declared_as_assets": [
    "nonexistent"
  ],
  "zero_trust_design_assets_without_policy_coverage": [
    "a1"
  ],
  "zero_trust_design_policy_coverage_ratio": "0.000000",
  "summary": "51 pass, 3 fail, 0 missing of 54 checks across six sections.",
  "stamp": "ZERO TRUST ARCHITECTURE DESIGN PACK\ndesign_title: Secure Service Mesh\nVERDICT: ZERO_TRUST_DESIGN_NOT_SOUND\n  identity_and_perimeter_framing               pass\n  policy_coverage_and_segmentation             fail\n  device_and_workload_trust                    pass\n  monitoring_audit_and_response                pass\n  migration_and_rollout                        pass\n  red_lines                                    pass\n51 pass, 3 fail, 0 missing of 54 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T15:22:52.854702+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-trust-architecture-design-pack/evidence.json`.

Input:

```json
{
  "assets": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "assets",
  "detail": "assets must be a list"
}
```

