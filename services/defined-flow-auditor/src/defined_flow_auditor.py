#!/usr/bin/env python3
"""Defined-flow auditor — deterministic core.

Built from the bound skill `zero-trust` (v1): "never trust, always
verify" — evaluate the defined flows of a system against the five
zero-trust principles, the claim gauntlet, and honest scope limits.

The caller submits a zero-trust evidence manifest (a dict, or JSON on
the CLI). Every check in every section reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict (the skill's gauntlet rule — one failure breaks the claim):
- any fail             -> NOT_DEFINED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DEFINED

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "never_trust_always_verify",
    "identity_based_access",
    "least_privilege",
    "micro_segmentation",
    "continuous_verification",
    "claim_gauntlet",
    "scope_and_limits",
)


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "auth": {
        "every_request_authenticated": "boolean",
        "every_request_authorized": "boolean",
        "internal_traffic_trusted": "boolean",
    },
    "identity": {
        "access_follows_identity": "boolean",
        "checked_before_access": "boolean",
        "proof_method_named": "boolean",
    },
    "privilege": {
        "minimum_access": "boolean",
        "access_expires": "boolean",
        "credential_exceeds_job": "boolean",
    },
    "segmentation": {
        "components_segmented": "boolean",
        "blast_radius_bounded": "boolean",
        "flat_network": "boolean",
    },
    "verification": {
        "sessions_expire": "boolean",
        "tokens_rotate": "boolean",
        "anomalies_retrigger_auth": "boolean",
    },
    "gauntlet": {
        "server_holds_plaintext_or_keys": "boolean",
        "server_breach_exposes_user_data": "boolean",
        "trusted_components_inventoried": "boolean",
        "convenience_decisions_surfaced": "boolean",
        "backdoors_present": "boolean",
        "backdoors_named": "boolean",
    },
    "scope": {
        "adversaries_named": "boolean",
        "out_of_scope_named": "boolean",
        "compromised_endpoint_limit_acknowledged": "boolean",
        "claims_nist_alignment": "boolean",
        "nist_controls_named": "boolean",
    },
}

def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


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
    """Return the verdict dict for a zero-trust evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: never_trust_always_verify (principle 1) ----
    _bool_check(results, "never_trust_always_verify",
                "every_request_authenticated", manifest,
                ("auth", "every_request_authenticated"),
                "every request — user, device, service — is "
                "authenticated as if it came from an open network")
    _bool_check(results, "never_trust_always_verify",
                "every_request_authorized", manifest,
                ("auth", "every_request_authorized"),
                "every request is authorized fresh, on identity and "
                "context")
    _false_check(results, "never_trust_always_verify",
                 "network_location_not_trusted", manifest,
                 ("auth", "internal_traffic_trusted"),
                 "'inside the firewall' is not an identity")

    # ---- Section 2: identity_based_access (principle 2) ----
    _bool_check(results, "identity_based_access",
                "access_follows_identity_not_network", manifest,
                ("identity", "access_follows_identity"),
                "access follows the identity (user, device, workload), "
                "not the network location")
    _bool_check(results, "identity_based_access",
                "identity_checked_before_access", manifest,
                ("identity", "checked_before_access"),
                "what identity does this system check before granting "
                "access?")
    _bool_check(results, "identity_based_access",
                "identity_proof_method_named", manifest,
                ("identity", "proof_method_named"),
                "how is that identity proven? The proof method is named")

    # ---- Section 3: least_privilege (principle 3) ----
    _bool_check(results, "least_privilege", "minimum_access_per_identity",
                manifest, ("privilege", "minimum_access"),
                "every identity gets the minimum access needed")
    _bool_check(results, "least_privilege", "access_expires", manifest,
                ("privilege", "access_expires"),
                "access is granted for the minimum time needed — "
                "does access expire?")
    _false_check(results, "least_privilege",
                 "credentials_scoped_to_job", manifest,
                 ("privilege", "credential_exceeds_job"),
                 "can this credential do more than its job requires? "
                 "It must not")

    # ---- Section 4: micro_segmentation (principle 4) ----
    _bool_check(results, "micro_segmentation", "components_segmented",
                manifest, ("segmentation", "components_segmented"),
                "the blast radius of a compromise is bounded")
    _bool_check(results, "micro_segmentation",
                "breach_blast_radius_bounded", manifest,
                ("segmentation", "blast_radius_bounded"),
                "if this component is breached, what else falls with "
                "it? The answer is bounded, not everything")
    _false_check(results, "micro_segmentation", "network_not_flat",
                 manifest, ("segmentation", "flat_network"),
                 "a flat network where one breach means total breach "
                 "is not zero-trust")

    # ---- Section 5: continuous_verification (principle 5) ----
    _bool_check(results, "continuous_verification", "sessions_expire",
                manifest, ("verification", "sessions_expire"),
                "trust is re-evaluated, not granted once — sessions "
                "expire")
    _bool_check(results, "continuous_verification", "tokens_rotate",
                manifest, ("verification", "tokens_rotate"),
                "tokens rotate")
    _bool_check(results, "continuous_verification",
                "anomalies_retrigger_authentication", manifest,
                ("verification", "anomalies_retrigger_auth"),
                "anomalous behavior re-triggers authentication")

    # ---- Section 6: claim_gauntlet (skill: how to evaluate a claim) ----
    _false_check(results, "claim_gauntlet",
                 "server_holds_no_abusable_secrets", manifest,
                 ("gauntlet", "server_holds_plaintext_or_keys"),
                 "in a true zero-trust design the server holds no "
                 "secrets it could abuse — no plaintext, no "
                 "recoverable keys")
    _false_check(results, "claim_gauntlet",
                 "server_breach_does_not_expose_user_data", manifest,
                 ("gauntlet", "server_breach_exposes_user_data"),
                 "if breaching the server exposes user data, the trust "
                 "was placed in the server")
    _bool_check(results, "claim_gauntlet", "trusted_components_inventoried",
                manifest, ("gauntlet", "trusted_components_inventoried"),
                "every trusted component is an attack surface — "
                "inventory them before praising the architecture")
    _bool_check(results, "claim_gauntlet",
                "convenience_trust_decisions_surfaced", manifest,
                ("gauntlet", "convenience_decisions_surfaced"),
                "convenience features (SSO passthrough, persistent "
                "sessions, silent re-auth) are trust decisions — "
                "surface each one")
    backdoors, has_backdoors = _get(manifest, "gauntlet",
                                    "backdoors_present")
    named, has_named = _get(manifest, "gauntlet", "backdoors_named")
    if has_backdoors and backdoors:
        _check(results, "claim_gauntlet", "backdoors_named_explicitly",
               named, has_named, named is True,
               "recovery, admin override, escrow keys — each is a "
               "trusted third party; name them explicitly")
    else:
        _check(results, "claim_gauntlet", "backdoors_named_explicitly",
               backdoors, has_backdoors, True,
               "no backdoor (recovery / override / escrow) declared")

    # ---- Section 7: scope_and_limits (skill rules + honest limits +
    #      NIST alignment notes) ----
    _bool_check(results, "scope_and_limits", "adversaries_named", manifest,
                ("scope", "adversaries_named"),
                "a system is zero-trust only against the adversaries "
                "it names")
    _bool_check(results, "scope_and_limits", "out_of_scope_named",
                manifest, ("scope", "out_of_scope_named"),
                "who is out of scope is named honestly")
    _bool_check(results, "scope_and_limits",
                "compromised_endpoint_limit_acknowledged", manifest,
                ("scope", "compromised_endpoint_limit_acknowledged"),
                "honest limit: zero-trust does not fix a compromised "
                "endpoint")
    claims_nist, has_claims = _get(manifest, "scope",
                                   "claims_nist_alignment")
    controls, has_controls = _get(manifest, "scope",
                                  "nist_controls_named")
    if has_claims and claims_nist:
        _check(results, "scope_and_limits",
               "nist_controls_named_when_alignment_claimed",
               controls, has_controls, controls is True,
               "'NIST-compliant' without naming the controls is "
               "marketing — alignment is a claim about which controls "
               "are implemented")
    else:
        _check(results, "scope_and_limits",
               "nist_controls_named_when_alignment_claimed",
               claims_nist, has_claims, True,
               "no NIST alignment claimed")

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
        verdict = "NOT_DEFINED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DEFINED"

    return {
        "service": "defined-flow-auditor",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
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
        "DEFINED-FLOW AUDITOR",
        f"system: {verdict.get('system')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<26} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: defined_flow_auditor.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DEFINED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
