#!/usr/bin/env python3
"""Zero-trust evaluation verdict — deterministic core.

Built from the bound skill `zero-trust` (v1): "never trust, always
verify" — an EVALUATION VERDICT over a declared zero-trust
evaluation pack: the claim as stated, the gauntlet questions
(where authentication happens, what the server knows, what
survives a server breach, backdoors), the NIST 800-63B alignment
notes, and the skill's honest limits.

The caller submits an evaluation manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not merely declared, and use ONLY the
values the skill itself states — no outside threshold is imported:

- the password KDF must be Argon2id (skill NIST notes: "Argon2id
  is the NIST-preferred password-hashing/KDF choice ... Prefer it
  over PBKDF2 ... and never over raw SHA-256 (not a KDF)") — any
  other declared KDF fails;
- the declared minimum secret length must meet the skill's stated
  minimum of 16 characters (skill NIST notes: "CISA guidance:
  enforce meaningful minimum entropy (mykey: 16 characters).
  Length beats complexity rules") — at or above 16 passes, below
  fails; equality passes, because the skill states a minimum, not
  a margin above it.

The computed outcome is also reported as `claim_status`:
"not_sustained_on_declared_evidence" when either computed check
fails, "sustained_on_declared_evidence" when both computed checks
pass, otherwise null. The declared minimum secret length's margin
over the stated 16-character minimum is reported as
`secret_length_margin_chars`, a string with exactly four decimal
places produced in both implementations by the same fixed rule:
round half up to 4dp — floor(v * 10000 + 0.5) / 10000 — then format
with exactly four decimals. Comparisons use the unrounded values.
That fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

Verdict (the skill's gauntlet rule — one failure breaks the claim):
- any fail             -> CLAIM_NOT_SUSTAINED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CLAIM_SUSTAINED

This is an evaluation verdict over declared evidence, not a
security certification (the skill's own honest limit).

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "claim_and_scope",
    "authentication_and_server_trust",
    "identity_and_authenticator_strength",
    "privilege_segmentation_and_verification",
    "trust_inventory",
    "honest_limits",
)

STATED_MINIMUM_SECRET_LENGTH = 16
PREFERRED_KDF = "argon2id"

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "evaluation": {
        "claim_stated": "boolean",
        "adversaries_named": "boolean",
        "out_of_scope_named": "boolean",
        "not_certification_acknowledged": "boolean",
    },
    "gauntlet": {
        "authentication_point_identified": "boolean",
        "session_trusted_indefinitely": "boolean",
        "master_secret_leaves_client": "boolean",
        "server_sees_only_encrypted_data": "boolean",
        "server_breach_exposes_user_data": "boolean",
    },
    "identity": {
        "checked_before_access": "boolean",
        "proof_method_named": "boolean",
    },
    "cryptography": {
        "password_kdf": "string",
        "minimum_secret_length_chars": "number",
        "claims_nist_alignment": "boolean",
        "nist_controls_named": "boolean",
    },
    "findings": {
        "least_privilege_evaluated": "boolean",
        "credential_exceeds_job": "boolean",
        "blast_radius_bounded": "boolean",
        "flat_network": "boolean",
        "trust_rechecked_after_login": "boolean",
    },
    "inventory": {
        "trusted_components_inventoried": "boolean",
        "backdoors_present": "boolean",
        "backdoors_named": "boolean",
        "convenience_decisions_surfaced": "boolean",
        "internal_network_trusted": "boolean",
    },
    "limits": {
        "compromised_endpoint_limit_acknowledged": "boolean",
        "usability_tradeoff_stated": "boolean",
        "design_claims_only_acknowledged": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def evaluate(manifest):
    """Return the verdict dict for a zero-trust evaluation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: claim_and_scope (skill: how to evaluate a claim;
    #      a system is zero-trust only against the adversaries it
    #      names; evaluation only, not a certification) ----
    _bool_check(results, "claim_and_scope", "claim_stated_verbatim",
                manifest, ("evaluation", "claim_stated"),
                "the zero-trust claim under evaluation is stated — "
                "alignment is a claim about which controls are "
                "implemented, not a certificate")
    _bool_check(results, "claim_and_scope", "adversaries_named",
                manifest, ("evaluation", "adversaries_named"),
                "a system is zero-trust only against the adversaries "
                "it names")
    _bool_check(results, "claim_and_scope", "out_of_scope_named",
                manifest, ("evaluation", "out_of_scope_named"),
                "who is out of scope is named honestly (zerok names "
                "compromised client OS and physical access as out "
                "of scope)")
    _bool_check(results, "claim_and_scope",
                "evaluation_not_certification_acknowledged", manifest,
                ("evaluation", "not_certification_acknowledged"),
                "honest limit: this skill evaluates design claims — "
                "it does not replace a security audit, penetration "
                "test, or formal certification")

    # ---- Section 2: authentication_and_server_trust (the gauntlet:
    #      where authentication happens, what the server knows, what
    #      survives a server breach) ----
    _bool_check(results, "authentication_and_server_trust",
                "authentication_point_identified", manifest,
                ("gauntlet", "authentication_point_identified"),
                "gauntlet: where does authentication happen? The "
                "authentication point is identified")
    _false_check(results, "authentication_and_server_trust",
                 "session_not_trusted_indefinitely", manifest,
                 ("gauntlet", "session_trusted_indefinitely"),
                 "gauntlet: if the server authenticates you and then "
                 "trusts the session indefinitely, that's perimeter "
                 "thinking with extra steps")
    _false_check(results, "authentication_and_server_trust",
                 "master_secret_never_leaves_client", manifest,
                 ("gauntlet", "master_secret_leaves_client"),
                 "gauntlet: what does the server know? In a true "
                 "zero-trust design the server holds no secrets it "
                 "could abuse (mykey: master password never leaves "
                 "the machine)")
    _bool_check(results, "authentication_and_server_trust",
                "server_sees_only_encrypted_data", manifest,
                ("gauntlet", "server_sees_only_encrypted_data"),
                "gauntlet: the server sees only encrypted data "
                "(zerok: storage server sees only encrypted blobs — "
                "no plaintext, no recoverable keys)")
    _false_check(results, "authentication_and_server_trust",
                 "server_breach_does_not_expose_user_data", manifest,
                 ("gauntlet", "server_breach_exposes_user_data"),
                 "gauntlet: what survives a server breach? If "
                 "breaching the server exposes user data, the trust "
                 "was placed in the server — the opposite of "
                 "zero-trust")

    # ---- Section 3: identity_and_authenticator_strength (principle
    #      2 + the skill's NIST 800-63B alignment notes) ----
    _bool_check(results, "identity_and_authenticator_strength",
                "identity_checked_before_access", manifest,
                ("identity", "checked_before_access"),
                "identity-based access: what identity does this "
                "system check before granting access?")
    _bool_check(results, "identity_and_authenticator_strength",
                "identity_proof_method_named", manifest,
                ("identity", "proof_method_named"),
                "identity-based access: how is that identity proven? "
                "The proof method is named")
    kdf, has_kdf = _get(manifest, "cryptography", "password_kdf")
    kdf_ok = has_kdf and kdf == PREFERRED_KDF
    _check(results, "identity_and_authenticator_strength",
           "password_kdf_is_argon2id", kdf, has_kdf, kdf_ok,
           "NIST notes: Argon2id is the NIST-preferred "
           "password-hashing/KDF choice — prefer it over PBKDF2 "
           "and never over raw SHA-256 (not a KDF)")
    length, has_length = _get(manifest, "cryptography",
                              "minimum_secret_length_chars")
    length_is_number = has_length and _is_number(length)
    length_ok = length_is_number and length >= STATED_MINIMUM_SECRET_LENGTH
    _check(results, "identity_and_authenticator_strength",
           "minimum_secret_length_meets_stated_minimum", length,
           length_is_number, length_ok,
           "NIST notes: CISA guidance — enforce meaningful minimum "
           "entropy (mykey: 16 characters); length beats complexity "
           "rules")
    length_margin = (length - STATED_MINIMUM_SECRET_LENGTH
                     if length_is_number else None)
    claims_nist, has_claims = _get(manifest, "cryptography",
                                   "claims_nist_alignment")
    controls, has_controls = _get(manifest, "cryptography",
                                  "nist_controls_named")
    if has_claims and claims_nist:
        _check(results, "identity_and_authenticator_strength",
               "nist_controls_named_when_alignment_claimed",
               controls, has_controls, controls is True,
               "NIST notes: 'NIST-compliant' without naming the "
               "controls is marketing — alignment is a claim about "
               "which controls are implemented")
    else:
        _check(results, "identity_and_authenticator_strength",
               "nist_controls_named_when_alignment_claimed",
               claims_nist, has_claims, True,
               "no NIST alignment claimed")

    # ---- Section 4: privilege_segmentation_and_verification
    #      (principles 3-5, assessed as evaluation findings) ----
    _bool_check(results, "privilege_segmentation_and_verification",
                "least_privilege_evaluated", manifest,
                ("findings", "least_privilege_evaluated"),
                "least privilege evaluated: every identity gets the "
                "minimum access needed, for the minimum time needed")
    _false_check(results, "privilege_segmentation_and_verification",
                 "credential_scope_within_job", manifest,
                 ("findings", "credential_exceeds_job"),
                 "least privilege: can this credential do more than "
                 "its job requires? It must not")
    _bool_check(results, "privilege_segmentation_and_verification",
                "breach_blast_radius_bounded", manifest,
                ("findings", "blast_radius_bounded"),
                "micro-segmentation: if this component is breached, "
                "what else falls with it? The blast radius is "
                "bounded")
    _false_check(results, "privilege_segmentation_and_verification",
                 "network_not_flat", manifest,
                 ("findings", "flat_network"),
                 "micro-segmentation: a flat network where one "
                 "breach means total breach is not zero-trust")
    _bool_check(results, "privilege_segmentation_and_verification",
                "trust_rechecked_after_login", manifest,
                ("findings", "trust_rechecked_after_login"),
                "continuous verification: what happens after the "
                "initial login — is anything ever re-checked? "
                "Sessions expire, tokens rotate, anomalous behavior "
                "re-triggers authentication")

    # ---- Section 5: trust_inventory (skill rules: inventory trusted
    #      components; the network is always hostile; convenience is
    #      a trust decision; backdoors named explicitly) ----
    _bool_check(results, "trust_inventory",
                "trusted_components_inventoried", manifest,
                ("inventory", "trusted_components_inventoried"),
                "trust is a vulnerability: every trusted component "
                "is an attack surface — inventory them before "
                "praising the architecture")
    backdoors, has_backdoors = _get(manifest, "inventory",
                                    "backdoors_present")
    named, has_named = _get(manifest, "inventory", "backdoors_named")
    if has_backdoors and backdoors:
        _check(results, "trust_inventory", "backdoors_named_explicitly",
               named, has_named, named is True,
               "is there a backdoor? 'Forgot password' recovery, "
               "admin override, escrow keys — each is a trusted "
               "third party; name them explicitly")
    else:
        _check(results, "trust_inventory", "backdoors_named_explicitly",
               backdoors, has_backdoors, True,
               "no backdoor (recovery / override / escrow) declared")
    _bool_check(results, "trust_inventory",
                "convenience_trust_decisions_surfaced", manifest,
                ("inventory", "convenience_decisions_surfaced"),
                "convenience features (SSO passthrough, persistent "
                "sessions, silent re-auth) are trust decisions — "
                "surface each one")
    _false_check(results, "trust_inventory",
                 "network_not_trusted_as_internal", manifest,
                 ("inventory", "internal_network_trusted"),
                 "the network is always hostile in your analysis, "
                 "even 'internal' networks — 'inside the firewall' "
                 "is not an identity")

    # ---- Section 6: honest_limits (skill honest limits + rules) ----
    _bool_check(results, "honest_limits",
                "compromised_endpoint_limit_acknowledged", manifest,
                ("limits", "compromised_endpoint_limit_acknowledged"),
                "honest limit: zero-trust does not fix a compromised "
                "endpoint — if the client device is owned, no "
                "architecture above it holds")
    _bool_check(results, "honest_limits", "usability_tradeoff_stated",
                manifest, ("limits", "usability_tradeoff_stated"),
                "usability and zero-trust are in tension (no "
                "password recovery IS the guarantee) — say what the "
                "user gives up, not just what they gain")
    _bool_check(results, "honest_limits",
                "design_claims_only_acknowledged", manifest,
                ("limits", "design_claims_only_acknowledged"),
                "this skill evaluates design claims — the verdict "
                "is over the declared design evidence, not a live "
                "audit of the running system")

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
        verdict = "CLAIM_NOT_SUSTAINED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CLAIM_SUSTAINED"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("password_kdf_is_argon2id",
                          "minimum_secret_length_meets_stated_minimum")
    ]
    if any(s == "fail" for s in computed_statuses):
        claim_status = "not_sustained_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        claim_status = "sustained_on_declared_evidence"
    else:
        claim_status = None

    return {
        "service": "zero-trust-evaluation-verdict",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "claim_status": claim_status,
        "secret_length_margin_chars": _fmt4(length_margin),
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
        "ZERO TRUST EVALUATION VERDICT",
        f"system: {verdict.get('system')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: zero_trust_evaluation_verdict.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CLAIM_SUSTAINED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
