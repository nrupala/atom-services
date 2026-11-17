#!/usr/bin/env python3
"""Zero trust architecture design pack — deterministic core.

Built from the bound skill `zero-trust-architecture`: "Verify
every hop — identity-first access, least privilege,
short-lived credentials, no implicit network trust." Its
method in brief is this atom's record structure: identity-first
(strong identities for users and workloads; short-lived,
scoped, rotated credentials — no shared or static long-lived
secrets); authenticate and authorize every hop (mTLS or signed
requests east-west; a policy layer decides, not network
position); least privilege (scoped tokens, just-in-time
elevation, deny by default; permissions reviewed and revoked
routinely); segment (blast-radius boundaries between services
and environments; no flat trusted LAN; egress restricted and
monitored); attest (device/server posture checks and inventory
before trusting a node); encrypt in transit and at rest,
end-to-end where the model demands it; audit everything
(privileged actions logged immutably; alerts on anomalies;
audit trails survive the component they describe); and a
documented, ceremony-gated break-glass path, tested once. Its
red lines are this atom's red lines: no "it's on the internal
network, so it's fine"; no shared credentials across services
or people; no unrevocable access.

This atom is a DELIVERABLE audit of a declared zero-trust
architecture DESIGN record only: it audits the record a caller
declares — the identity/perimeter declarations, the declared
asset rows, the declared policy rows and their declared
coverage of the declared assets, the segmentation
declarations, the device/workload trust declarations, the
monitoring/response and break-glass declarations, the
migration/rollout declarations, and the red lines refused. It
evaluates NO live posture, probes NO network, tests NO
credential, reads NO configuration, and certifies NO security
outcome: every skill step that would evaluate, probe, verify
or certify a running system is EXCLUDED from this atom by
name — live posture evaluation, security certification,
network probing, penetration testing, configuration scanning
and credential testing are each excluded; the atom checks only
that the design record the skill requires is present and
internally consistent on the declared evidence, and it
recomputes the record's own declared coverage exactly
(declared assets vs declared policy coverage).

Distinct ground: the nearest sibling is
`zero-trust-evaluation-verdict` (a VERDICT on a declared
evaluation pack for one system's zero-trust CLAIM — claim as
stated, adversaries, gauntlet server-knowledge questions, the
NIST authenticator-strength arithmetic: the Argon2id KDF check
and the stated 16-character minimum). This atom is a
DESIGN-record audit for an architecture being designed: its
distinct ground is the skill's design method — identity-first
design framing, a declared asset inventory with declared
policy rows whose coverage of those assets recomputes,
segmentation and egress declarations, device/workload
attestation and encryption declarations, monitoring /
break-glass declarations, and migration/rollout declarations
for removing implicit trust. The boundary is: an architecture
design record here; a posture evaluation verdict on a claim
there. This atom shares zero checks with that atom.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- assets: at least one declared row, unique asset ids, a
  non-empty asset name on every row, and every asset kind one
  of `service` / `workload` / `device` / `data_store` /
  `admin_path` (the kinds of hop the design record names);
- policies: at least one declared row, unique policy ids, a
  non-empty policy name on every row, every policy declaring
  at least one covered asset, every declared coverage
  reference naming a declared asset, and every declared asset
  covered by at least one declared policy (the skill: every
  service call authenticated and authorized — a declared asset
  no declared policy covers is a hop the design leaves
  unverified on its own record);
- gated declaration: end-to-end encryption is required only
  where the design declares its model demands it.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric security threshold at all — no
credential lifetime, no segment count, no coverage percentage
below completeness over the caller's own declared rows, no
attestation standard — so no such check is invented; those
quantities are caller declarations at most, and quantities
here are computed and reported, with exact recomputation and
completeness over the caller's own declared rows as the only
bars.

Verdict:
- any fail             -> ZERO_TRUST_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ZERO_TRUST_DESIGN_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "identity_and_perimeter_framing",
    "policy_coverage_and_segmentation",
    "device_and_workload_trust",
    "monitoring_audit_and_response",
    "migration_and_rollout",
    "red_lines",
)

ASSET_KINDS = ("service", "workload", "device", "data_store", "admin_path")

MANIFEST_SPEC = {
    "design_title": "string",
    "identity": {
        "identity_first_design_declared": "boolean",
        "user_identities_declared": "boolean",
        "workload_identities_declared": "boolean",
        "short_lived_credentials_declared": "boolean",
        "credentials_scoped_declared": "boolean",
        "credentials_rotated_declared": "boolean",
        "no_implicit_network_trust_declared": "boolean",
        "every_hop_authenticated_and_authorized_declared": "boolean",
        "policy_layer_decides_access_declared": "boolean",
    },
    "assets": [{
        "asset_id": "string",
        "asset_name": "string",
        "asset_kind": "string",
    }],
    "policies": [{
        "policy_id": "string",
        "policy_name": "string",
        "covered_asset_ids": ["string"],
    }],
    "segmentation": {
        "segmentation_declared": "boolean",
        "blast_radius_boundaries_declared": "boolean",
        "egress_restricted_declared": "boolean",
        "egress_monitored_declared": "boolean",
        "deny_by_default_declared": "boolean",
        "least_privilege_declared": "boolean",
    },
    "trust": {
        "device_posture_checks_declared": "boolean",
        "device_inventory_declared": "boolean",
        "server_posture_checks_declared": "boolean",
        "workload_attestation_declared": "boolean",
        "node_trust_requires_attestation_declared": "boolean",
        "encryption_in_transit_declared": "boolean",
        "encryption_at_rest_declared": "boolean",
        "end_to_end_encryption_demanded": "boolean",
        "end_to_end_encryption_declared": "boolean",
    },
    "monitoring": {
        "audit_logging_declared": "boolean",
        "privileged_actions_logged_immutably_declared": "boolean",
        "anomaly_alerting_declared": "boolean",
        "audit_trail_survives_component_declared": "boolean",
        "egress_changes_audited_declared": "boolean",
        "privilege_changes_audited_declared": "boolean",
        "incident_response_path_declared": "boolean",
        "break_glass_documented_declared": "boolean",
        "break_glass_ceremony_gated_declared": "boolean",
        "break_glass_tested_declared": "boolean",
    },
    "migration": {
        "migration_phases_declared": "boolean",
        "rollout_order_declared": "boolean",
        "legacy_implicit_trust_removal_declared": "boolean",
        "rollback_path_declared": "boolean",
        "per_hop_verification_during_rollout_declared": "boolean",
        "permissions_review_and_revocation_declared": "boolean",
    },
    "red_lines": {
        "internal_network_trusted_present": "boolean",
        "shared_credentials_present": "boolean",
        "long_lived_wide_scope_secrets_present": "boolean",
        "unrevocable_access_present": "boolean",
        "anonymous_east_west_access_present": "boolean",
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


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a zero-trust design record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    assets, has_assets = _get(manifest, "assets")
    assets_is_list = has_assets and isinstance(assets, list)
    assets_count = len(assets) if assets_is_list else None
    asset_rows = assets if assets_is_list else []
    asset_ids = _ids(asset_rows, "asset_id")

    policies, has_policies = _get(manifest, "policies")
    policies_is_list = has_policies and isinstance(policies, list)
    policies_count = len(policies) if policies_is_list else None
    policy_rows = policies if policies_is_list else []
    policy_ids = _ids(policy_rows, "policy_id")

    duplicate_asset_ids = (
        _duplicates(asset_rows, "asset_id") if assets_is_list else None)
    duplicate_policy_ids = (
        _duplicates(policy_rows, "policy_id") if policies_is_list else None)

    assets_without_name = (
        [_row_name(c, "asset_id") for c in asset_rows
         if _has(c, "asset_name") and not _nonempty_str(c.get("asset_name"))]
        if assets_is_list else None)
    assets_with_invalid_kind = (
        [_row_name(c, "asset_id") for c in asset_rows
         if _has(c, "asset_kind") and c.get("asset_kind") not in ASSET_KINDS]
        if assets_is_list else None)
    policies_without_name = (
        [_row_name(c, "policy_id") for c in policy_rows
         if _has(c, "policy_name")
         and not _nonempty_str(c.get("policy_name"))]
        if policies_is_list else None)
    policies_without_coverage = (
        [_row_name(c, "policy_id") for c in policy_rows
         if _has(c, "covered_asset_ids")
         and isinstance(c.get("covered_asset_ids"), list)
         and len(c.get("covered_asset_ids")) == 0]
        if policies_is_list else None)

    covered_ids = []
    if policies_is_list:
        for p in policy_rows:
            cov = p.get("covered_asset_ids") if isinstance(p, dict) else None
            if isinstance(cov, list):
                for cid in cov:
                    if isinstance(cid, str) and cid not in covered_ids:
                        covered_ids.append(cid)
    refs_not_declared = None
    assets_without_coverage = None
    if assets_is_list and policies_is_list:
        refs_not_declared = [cid for cid in covered_ids
                             if cid not in asset_ids]
        assets_without_coverage = []
        for aid in asset_ids:
            if aid not in covered_ids and aid not in assets_without_coverage:
                assets_without_coverage.append(aid)

    coverage_ratio = None
    if assets_is_list and policies_is_list and assets_count > 0:
        covered_count = sum(1 for aid in asset_ids if aid in covered_ids)
        coverage_ratio = covered_count / assets_count

    # ---- Section 1: identity_and_perimeter_framing ----
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_identity_first_design_declared", manifest,
                ("identity", "identity_first_design_declared"),
                "identity-first: the design is declared identity-first — identity, not network location, is the perimeter")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_user_identities_declared", manifest,
                ("identity", "user_identities_declared"),
                "identity-first: strong identities for users are declared")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_workload_identities_declared", manifest,
                ("identity", "workload_identities_declared"),
                "identity-first: strong identities for workloads are declared")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_short_lived_credentials_declared", manifest,
                ("identity", "short_lived_credentials_declared"),
                "identity-first: credentials are declared short-lived (tokens, certs) — no shared or static long-lived secrets")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_credentials_scoped_declared", manifest,
                ("identity", "credentials_scoped_declared"),
                "identity-first: credentials are declared scoped")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_credentials_rotated_declared", manifest,
                ("identity", "credentials_rotated_declared"),
                "identity-first: credentials are declared rotated")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_no_implicit_network_trust_declared", manifest,
                ("identity", "no_implicit_network_trust_declared"),
                "identity-first: no implicit network trust is declared — location proves nothing")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_every_hop_authenticated_and_authorized_declared",
                manifest,
                ("identity", "every_hop_authenticated_and_authorized_declared"),
                "every hop: every request is declared authenticated and authorized — humans and workloads alike")
    _bool_check(results, "identity_and_perimeter_framing",
                "zero_trust_design_policy_layer_decides_access_declared", manifest,
                ("identity", "policy_layer_decides_access_declared"),
                "every hop: a policy layer is declared to decide access, not network position")

    # ---- Section 2: policy_coverage_and_segmentation ----
    _check(results, "policy_coverage_and_segmentation",
           "zero_trust_design_assets_list_declared", assets,
           assets_is_list, assets_is_list and assets_count >= 1,
           "assets: the declared record names its assets — the list is present and names at least one asset; an absent list is missing evidence and an empty list declares no hop at all")
    asset_id_present = assets_is_list and all(
        _has(c, "asset_id") for c in asset_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_asset_id_unique", assets,
           asset_id_present,
           assets_is_list and duplicate_asset_ids is not None
           and len(duplicate_asset_ids) == 0,
           "assets: no declared asset_id is owned by more than one row")
    asset_name_present = assets_is_list and all(
        _has(c, "asset_name") for c in asset_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_asset_name_declared", assets,
           asset_name_present,
           assets_is_list
           and all(_nonempty_str(c.get("asset_name")) for c in asset_rows),
           "assets: every declared asset declares a non-empty asset name")
    kind_present = assets_is_list and all(
        _has(c, "asset_kind") for c in asset_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_asset_kind_recognised", assets,
           kind_present,
           assets_is_list
           and all(c.get("asset_kind") in ASSET_KINDS for c in asset_rows),
           "assets: every declared asset's kind is one of service, workload, device, data_store, admin_path — the kinds of hop the design record names")
    _check(results, "policy_coverage_and_segmentation",
           "zero_trust_design_policies_list_declared", policies,
           policies_is_list, policies_is_list and policies_count >= 1,
           "policies: the declared record names its policy rows — the list is present and names at least one policy; an absent list is missing evidence and an empty list declares no policy coverage at all")
    policy_id_present = policies_is_list and all(
        _has(c, "policy_id") for c in policy_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_policy_id_unique", policies,
           policy_id_present,
           policies_is_list and duplicate_policy_ids is not None
           and len(duplicate_policy_ids) == 0,
           "policies: no declared policy_id is owned by more than one row")
    policy_name_present = policies_is_list and all(
        _has(c, "policy_name") for c in policy_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_policy_name_declared", policies,
           policy_name_present,
           policies_is_list
           and all(_nonempty_str(c.get("policy_name")) for c in policy_rows),
           "policies: every declared policy declares a non-empty policy name")
    coverage_present = policies_is_list and all(
        _has(c, "covered_asset_ids") for c in policy_rows)
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_policy_covers_at_least_one_asset",
           policies, coverage_present,
           policies_is_list
           and all(isinstance(c.get("covered_asset_ids"), list)
                   and len(c.get("covered_asset_ids")) > 0
                   for c in policy_rows),
           "policies: every declared policy declares coverage of at least one asset")
    refs_present = (assets_is_list and policies_is_list
                    and all(_has(c, "covered_asset_ids") for c in policy_rows)
                    and all(_has(c, "asset_id") for c in asset_rows))
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_policy_coverage_reference_resolves",
           policies, refs_present,
           refs_present and refs_not_declared == [],
           "policies: every declared coverage reference names a declared asset — no policy claims coverage of an asset the record does not declare")
    _check(results, "policy_coverage_and_segmentation",
           "every_zero_trust_design_declared_asset_covered_by_policy",
           assets, refs_present,
           refs_present and assets_without_coverage == [],
           "coverage: every declared asset is covered by at least one declared policy — a declared asset no declared policy covers is a hop the design leaves unverified on its own record")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_segmentation_declared", manifest,
                ("segmentation", "segmentation_declared"),
                "segment: the design declares segmentation between services and environments")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_blast_radius_boundaries_declared", manifest,
                ("segmentation", "blast_radius_boundaries_declared"),
                "segment: blast-radius boundaries are declared between services and environments")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_egress_restricted_declared", manifest,
                ("segmentation", "egress_restricted_declared"),
                "segment: egress is declared restricted")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_egress_monitored_declared", manifest,
                ("segmentation", "egress_monitored_declared"),
                "segment: egress is declared monitored")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_deny_by_default_declared", manifest,
                ("segmentation", "deny_by_default_declared"),
                "least privilege: access is declared deny by default")
    _bool_check(results, "policy_coverage_and_segmentation",
                "zero_trust_design_least_privilege_declared", manifest,
                ("segmentation", "least_privilege_declared"),
                "least privilege: scoped tokens and just-in-time elevation are declared under a least-privilege design")

    # ---- Section 3: device_and_workload_trust ----
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_device_posture_checks_declared", manifest,
                ("trust", "device_posture_checks_declared"),
                "attest: device posture checks are declared before a device is trusted")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_device_inventory_declared", manifest,
                ("trust", "device_inventory_declared"),
                "attest: a device inventory is declared")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_server_posture_checks_declared", manifest,
                ("trust", "server_posture_checks_declared"),
                "attest: server posture checks are declared before a node is trusted")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_workload_attestation_declared", manifest,
                ("trust", "workload_attestation_declared"),
                "attest: workload attestation is declared")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_node_trust_requires_attestation_declared",
                manifest,
                ("trust", "node_trust_requires_attestation_declared"),
                "attest: node trust is declared to require attestation — no node is trusted on presence alone")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_encryption_in_transit_declared", manifest,
                ("trust", "encryption_in_transit_declared"),
                "encrypt: encryption in transit is declared")
    _bool_check(results, "device_and_workload_trust",
                "zero_trust_design_encryption_at_rest_declared", manifest,
                ("trust", "encryption_at_rest_declared"),
                "encrypt: encryption at rest is declared")
    _gated_bool_check(
        results, "device_and_workload_trust",
        "zero_trust_design_end_to_end_encryption_declared_where_demanded",
        manifest,
        ("trust", "end_to_end_encryption_demanded"),
        ("trust", "end_to_end_encryption_declared"),
        "encrypt: end-to-end encryption is declared where the design's model demands it",
        "end-to-end encryption not declared demanded by the design's model")

    # ---- Section 4: monitoring_audit_and_response ----
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_audit_logging_declared", manifest,
                ("monitoring", "audit_logging_declared"),
                "audit: every request is declared logged — audit everything")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_privileged_actions_logged_immutably_declared",
                manifest,
                ("monitoring", "privileged_actions_logged_immutably_declared"),
                "audit: privileged actions are declared logged immutably")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_anomaly_alerting_declared", manifest,
                ("monitoring", "anomaly_alerting_declared"),
                "audit: alerts on anomalies are declared")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_audit_trail_survives_component_declared",
                manifest,
                ("monitoring", "audit_trail_survives_component_declared"),
                "audit: audit trails are declared to survive the component they describe")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_egress_changes_audited_declared", manifest,
                ("monitoring", "egress_changes_audited_declared"),
                "audit: egress changes are declared audited")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_privilege_changes_audited_declared", manifest,
                ("monitoring", "privilege_changes_audited_declared"),
                "audit: privilege changes are declared audited")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_incident_response_path_declared", manifest,
                ("monitoring", "incident_response_path_declared"),
                "response: an incident response path for a failed verification is declared")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_break_glass_documented_declared", manifest,
                ("monitoring", "break_glass_documented_declared"),
                "break-glass: the emergency path is declared documented")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_break_glass_ceremony_gated_declared", manifest,
                ("monitoring", "break_glass_ceremony_gated_declared"),
                "break-glass: the emergency path is declared ceremony-gated")
    _bool_check(results, "monitoring_audit_and_response",
                "zero_trust_design_break_glass_tested_declared", manifest,
                ("monitoring", "break_glass_tested_declared"),
                "break-glass: the emergency path is declared tested once")

    # ---- Section 5: migration_and_rollout ----
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_migration_phases_declared", manifest,
                ("migration", "migration_phases_declared"),
                "migration: migration phases from the current design to the zero-trust design are declared")
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_rollout_order_declared", manifest,
                ("migration", "rollout_order_declared"),
                "migration: the rollout order across services and environments is declared")
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_legacy_implicit_trust_removal_declared",
                manifest,
                ("migration", "legacy_implicit_trust_removal_declared"),
                "migration: removal of legacy implicit trust (the trusted internal network) is declared")
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_rollback_path_declared", manifest,
                ("migration", "rollback_path_declared"),
                "migration: a rollback path for a failed rollout step is declared")
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_per_hop_verification_during_rollout_declared",
                manifest,
                ("migration", "per_hop_verification_during_rollout_declared"),
                "migration: per-hop verification during rollout is declared — no hop is left trusted by transition")
    _bool_check(results, "migration_and_rollout",
                "zero_trust_design_permissions_review_and_revocation_declared",
                manifest,
                ("migration", "permissions_review_and_revocation_declared"),
                "migration: permissions are declared reviewed and revoked routinely as the rollout proceeds")

    # ---- Section 6: red_lines ----
    _false_check(results, "red_lines",
                 "zero_trust_design_free_of_internal_network_trusted",
                 manifest,
                 ("red_lines", "internal_network_trusted_present"),
                 "red line: no 'it is on the internal network, so it is fine' trust is present in the record")
    _false_check(results, "red_lines",
                 "zero_trust_design_free_of_shared_credentials",
                 manifest,
                 ("red_lines", "shared_credentials_present"),
                 "red line: no shared credentials across services or people are present in the record")
    _false_check(results, "red_lines",
                 "zero_trust_design_free_of_long_lived_wide_scope_secrets",
                 manifest,
                 ("red_lines", "long_lived_wide_scope_secrets_present"),
                 "red line: no long-lived wide-scope secrets are present in the record")
    _false_check(results, "red_lines",
                 "zero_trust_design_free_of_unrevocable_access",
                 manifest,
                 ("red_lines", "unrevocable_access_present"),
                 "red line: no unrevocable access is present in the record")
    _false_check(results, "red_lines",
                 "zero_trust_design_free_of_anonymous_east_west_access",
                 manifest,
                 ("red_lines", "anonymous_east_west_access_present"),
                 "red line: no anonymous east-west access is present in the record — every service call is authenticated and authorized")

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
        verdict = "ZERO_TRUST_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ZERO_TRUST_DESIGN_SOUND"

    computed_names = (
        "zero_trust_design_assets_list_declared",
        "every_zero_trust_design_asset_id_unique",
        "every_zero_trust_design_asset_name_declared",
        "every_zero_trust_design_asset_kind_recognised",
        "zero_trust_design_policies_list_declared",
        "every_zero_trust_design_policy_id_unique",
        "every_zero_trust_design_policy_name_declared",
        "every_zero_trust_design_policy_covers_at_least_one_asset",
        "every_zero_trust_design_policy_coverage_reference_resolves",
        "every_zero_trust_design_declared_asset_covered_by_policy",
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
        "service": "zero-trust-architecture-design-pack",
        "atom_version": "0.1.0",
        "design_title": manifest.get("design_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "zero_trust_design_assets_count": assets_count,
        "zero_trust_design_policies_count": policies_count,
        "duplicate_zero_trust_design_asset_ids": duplicate_asset_ids,
        "duplicate_zero_trust_design_policy_ids": duplicate_policy_ids,
        "zero_trust_design_assets_without_name": assets_without_name,
        "zero_trust_design_assets_with_invalid_kind": assets_with_invalid_kind,
        "zero_trust_design_policies_without_name": policies_without_name,
        "zero_trust_design_policies_without_coverage": policies_without_coverage,
        "zero_trust_design_policy_refs_not_declared_as_assets": refs_not_declared,
        "zero_trust_design_assets_without_policy_coverage": assets_without_coverage,
        "zero_trust_design_policy_coverage_ratio": _fmt6(coverage_ratio),
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
        "ZERO TRUST ARCHITECTURE DESIGN PACK",
        f"design_title: {verdict.get('design_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: zero_trust_architecture_design_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ZERO_TRUST_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
