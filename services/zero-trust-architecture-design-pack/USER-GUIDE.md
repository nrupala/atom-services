# Zero trust architecture design pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a zero-trust architecture and you keep a design record for one system or service set. This atom reads one declared zero-trust architecture design record and returns one deterministic verdict across six sections (identity_and_perimeter_framing, policy_coverage_and_segmentation, device_and_workload_trust, monitoring_audit_and_response, migration_and_rollout, red_lines): **ZERO_TRUST_DESIGN_SOUND**, **ZERO_TRUST_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 54 checks. It audits the declared design record's completeness and internal consistency only — it designs no architecture, evaluates no live posture, probes no network, reads no configuration, tests no credential, and certifies no security outcome of any kind. A design is sound *on your declared evidence*: a record that declares its identities strong, its credentials short-lived and its assets fully policy-covered passes those checks even if the real design or the built system does none of it. It is not a security evaluation, a security certification, an architecture approval, or a guarantee that the designed system is secure: it never judges whether a declared policy actually enforces anything, whether a declared attestation is strong, whether the segmentation would hold, or whether the design should be built — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `assets` list must be present and name at least one asset, with unique `asset_id` values, a non-empty `asset_name` on every row, and every row's `asset_kind` one of `service`, `workload`, `device`, `data_store`, `admin_path`; the declared `policies` list must be present and name at least one policy, with unique `policy_id` values and a non-empty `policy_name` on every row; every declared policy's `covered_asset_ids` list must be present and non-empty; every id in every `covered_asset_ids` list must name a declared asset; and every declared asset must appear in at least one declared policy's `covered_asset_ids` list (a declared asset no declared policy covers is a hop the design leaves unverified on its own record). One check is gated on the record's own declared gate field — when the gate is declared `false` the check passes as not applicable, and when the gate field is absent the check is missing evidence: end-to-end encryption (`trust.end_to_end_encryption_declared`) is required only where `trust.end_to_end_encryption_demanded` is declared `true`. No numeric security threshold is imposed — no maximum credential lifetime in hours or days, or any bar on how short "short-lived" must be (credentials are checked as declared short-lived, scoped and rotated, never measured); no minimum number of segments, segment-count bar, or blast-radius size; no policy-coverage percentage below completeness over your own declared rows (coverage is complete-or-not over the declared assets, never sampled against the real estate); no attestation standard, framework or level (no NIST, FIDO or vendor attestation bar is imported); no encryption algorithm, protocol or key-length bar; no log-retention period or audit-completeness percentage against real traffic; no migration timeline or rollout-pace bar; and no judgment that the declared design is secure, sufficient or advisable (only that its declared record contains what the skill requires). The only bars on the computed rows are exact recomputation and completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-trust-architecture-design-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-trust-architecture-design-pack` — tool name `zero_trust_architecture_design_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/zero-trust-architecture-design-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `design_title` | Design title (string; carried into the output, not checked) |
| `identity.identity_first_design_declared` | identity evidence: the design is declared identity-first — identity, not network location, is the perimeter |
| `identity.user_identities_declared` | identity evidence: strong identities for users are declared |
| `identity.workload_identities_declared` | identity evidence: strong identities for workloads are declared |
| `identity.short_lived_credentials_declared` | identity evidence: credentials are declared short-lived — declaration only; no lifetime is measured |
| `identity.credentials_scoped_declared` | identity evidence: credentials are declared scoped |
| `identity.credentials_rotated_declared` | identity evidence: credentials are declared rotated |
| `identity.no_implicit_network_trust_declared` | identity evidence: no implicit network trust is declared — location proves nothing |
| `identity.every_hop_authenticated_and_authorized_declared` | identity evidence: every request is declared authenticated and authorized, humans and workloads alike |
| `identity.policy_layer_decides_access_declared` | identity evidence: a policy layer is declared to decide access, not network position |
| `assets` (list of asset objects) | computed: must be present and name at least one asset; reported as `zero_trust_design_assets_count` |
| `assets[].asset_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row, and must be unique per row |
| `assets[].asset_name` (string) | computed: must be present and non-empty on every row |
| `assets[].asset_kind` (string) | computed: must be one of `service`, `workload`, `device`, `data_store`, `admin_path` on every row |
| `policies` (list of policy objects) | computed: must be present and name at least one policy; reported as `zero_trust_design_policies_count` |
| `policies[].policy_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row, and must be unique per row |
| `policies[].policy_name` (string) | computed: must be present and non-empty on every row |
| `policies[].covered_asset_ids` (list of strings) | computed: must be present and non-empty on every row; every id must name a declared asset, and every declared asset must be covered by at least one policy |
| `segmentation.segmentation_declared` | segmentation evidence: segmentation between services and environments is declared |
| `segmentation.blast_radius_boundaries_declared` | segmentation evidence: blast-radius boundaries between services and environments are declared |
| `segmentation.egress_restricted_declared` | segmentation evidence: egress is declared restricted |
| `segmentation.egress_monitored_declared` | segmentation evidence: egress is declared monitored |
| `segmentation.deny_by_default_declared` | least-privilege evidence: access is declared deny by default |
| `segmentation.least_privilege_declared` | least-privilege evidence: scoped tokens and just-in-time elevation are declared under a least-privilege design |
| `trust.device_posture_checks_declared` | trust evidence: device posture checks are declared before a device is trusted |
| `trust.device_inventory_declared` | trust evidence: a device inventory is declared |
| `trust.server_posture_checks_declared` | trust evidence: server posture checks are declared before a node is trusted |
| `trust.workload_attestation_declared` | trust evidence: workload attestation is declared — declaration only; no attestation standard is imposed |
| `trust.node_trust_requires_attestation_declared` | trust evidence: node trust is declared to require attestation — no node is trusted on presence alone |
| `trust.encryption_in_transit_declared` | trust evidence: encryption in transit is declared — declaration only; no algorithm or key-length bar is imposed |
| `trust.encryption_at_rest_declared` | trust evidence: encryption at rest is declared — declaration only, as above |
| `trust.end_to_end_encryption_demanded` | gates the end-to-end encryption check: the target declaration is required only where this is declared `true` |
| `trust.end_to_end_encryption_declared` | required when `trust.end_to_end_encryption_demanded` is `true`; otherwise the check passes as not applicable |
| `monitoring.audit_logging_declared` | monitoring evidence: every request is declared logged |
| `monitoring.privileged_actions_logged_immutably_declared` | monitoring evidence: privileged actions are declared logged immutably |
| `monitoring.anomaly_alerting_declared` | monitoring evidence: alerts on anomalies are declared |
| `monitoring.audit_trail_survives_component_declared` | monitoring evidence: audit trails are declared to survive the component they describe |
| `monitoring.egress_changes_audited_declared` | monitoring evidence: egress changes are declared audited |
| `monitoring.privilege_changes_audited_declared` | monitoring evidence: privilege changes are declared audited |
| `monitoring.incident_response_path_declared` | monitoring evidence: an incident response path for a failed verification is declared |
| `monitoring.break_glass_documented_declared` | break-glass evidence: the emergency path is declared documented |
| `monitoring.break_glass_ceremony_gated_declared` | break-glass evidence: the emergency path is declared ceremony-gated |
| `monitoring.break_glass_tested_declared` | break-glass evidence: the emergency path is declared tested once |
| `migration.migration_phases_declared` | migration evidence: migration phases from the current design to the zero-trust design are declared |
| `migration.rollout_order_declared` | migration evidence: the rollout order across services and environments is declared |
| `migration.legacy_implicit_trust_removal_declared` | migration evidence: removal of legacy implicit trust (the trusted internal network) is declared |
| `migration.rollback_path_declared` | migration evidence: a rollback path for a failed rollout step is declared |
| `migration.per_hop_verification_during_rollout_declared` | migration evidence: per-hop verification during rollout is declared — no hop is left trusted by transition |
| `migration.permissions_review_and_revocation_declared` | migration evidence: permissions are declared reviewed and revoked routinely as the rollout proceeds |
| `red_lines.internal_network_trusted_present` | must be `false` to pass (red line: no "it is on the internal network, so it is fine" trust) |
| `red_lines.shared_credentials_present` | must be `false` to pass (red line: no shared credentials across services or people) |
| `red_lines.long_lived_wide_scope_secrets_present` | must be `false` to pass (red line: no long-lived wide-scope secrets) |
| `red_lines.unrevocable_access_present` | must be `false` to pass (red line: no unrevocable access) |
| `red_lines.anonymous_east_west_access_present` | must be `false` to pass (red line: no anonymous east-west access — every service call is authenticated and authorized) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward ZERO_TRUST_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/zero-trust-architecture-design-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 54 checks and a text stamp of the verdict):

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
  "summary": "54 pass, 0 fail, 0 missing of 54 checks across six sections."
}
```

## Verdicts

- **ZERO_TRUST_DESIGN_SOUND** — every check passes; the declared zero-trust architecture design record is complete and internally consistent with the skill's method, quality gates and red lines.
- **ZERO_TRUST_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `zero_trust_design_assets_count` and `zero_trust_design_policies_count` (integers, exactly; each null when its list is not declared), `duplicate_zero_trust_design_asset_ids` and `duplicate_zero_trust_design_policy_ids` (ids carried by more than one row; each null when its list is not declared), `zero_trust_design_assets_without_name`, `zero_trust_design_assets_with_invalid_kind`, `zero_trust_design_policies_without_name`, `zero_trust_design_policies_without_coverage`, `zero_trust_design_policy_refs_not_declared_as_assets` and `zero_trust_design_assets_without_policy_coverage` (the offending rows for each computed rule; each null when its underlying list is not declared), `zero_trust_design_policy_coverage_ratio` (declared assets covered by at least one declared policy ÷ declared assets; a string with exactly six decimal places, and null when its denominator list is absent or empty, or when the policies list is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the ten primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
