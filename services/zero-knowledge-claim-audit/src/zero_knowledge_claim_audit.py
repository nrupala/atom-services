#!/usr/bin/env python3
"""Zero-knowledge claim audit — deterministic core.

Built from the bound skill `zero-knowledge` (v1): "Zero-knowledge
principles for software — the server learns nothing. Client-side
encryption, proof without revelation, when ZK matters vs when it's
theater. Distilled from zerok-container."

IMPORTANT SCOPE: the bound skill is about zero-knowledge *software
architecture* (client-side encryption, keys that never leave the
device, a server that stores only opaque bytes). It states NO facts
about zero-knowledge proof systems, trusted setups, circuits or
constraint systems, and this audit invents none: it checks declared
claims about a declared system against declared evidence only. It
does not verify any proof, and it does not verify that the declared
posture is true of the running system — it audits the consistency
and completeness of the declarations themselves.

The caller submits one zero-knowledge-evidence manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and valid   -> pass
- field present and invalid -> fail
- field absent              -> missing (evidence not provided)

Verdict:
- any fail             -> CLAIMS_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CLAIMS_SOUND

No computed numbers appear in the output except the integer pass /
fail / missing counts in the summary, which are serialized as plain
base-10 integers in both implementations (no rounding rule needed).

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "core_test",
    "client_side_encryption",
    "key_journey",
    "trusted_parties_and_recovery",
    "plaintext_and_metadata_scope",
    "theater_and_threat_model",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "product": "string",
    "claims": {
        "claim_basis": "string",
    },
    "access": {
        "server_can_read_user_data": "boolean",
    },
    "storage": {
        "server_stores_only_opaque_bytes": "boolean",
    },
    "encryption": {
        "encryption_happens_on_client_device": "boolean",
        "plaintext_exists_only_on_client_device": "boolean",
        "authenticated_encryption": "boolean",
        "relies_on_tls_alone": "boolean",
    },
    "keys": {
        "keys_never_leave_device": "boolean",
        "key_derivation_client_side": "boolean",
        "key_journey_documented": "boolean",
        "key_backup_uploads_key_to_server": "boolean",
    },
    "trust": {
        "key_escrow": "boolean",
        "recovery_backdoor": "boolean",
        "admin_plaintext_view": "boolean",
        "trusted_components": ["string"],
        "trusted_third_parties_in_data_path": ["string"],
    },
    "recovery": {
        "password_reset_recovers_data": "boolean",
        "no_recovery_possible_claimed": "boolean",
    },
    "scope": {
        "plaintext_locations_documented": "boolean",
        "plaintext_in_logs": "boolean",
        "plaintext_in_crash_dumps": "boolean",
        "plaintext_in_thumbnails_or_previews": "boolean",
        "metadata_leakage_acknowledged": "boolean",
        "residual_risks_documented": "boolean",
    },
    "theater": {
        "client_type": "string",
        "web_app_trust_distinction_acknowledged": "boolean",
        "search_or_indexing_requires_server_plaintext_or_tokens": "boolean",
        "threat_model_includes_malicious_operator": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a zero-knowledge-evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: core_test (skill: the core test, one sentence) ----
    server_read, has_server_read = _get(manifest, "access",
                                        "server_can_read_user_data")
    _check(results, "core_test", "server_operator_cannot_read_user_data",
           server_read, has_server_read, server_read is False,
           "skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge")

    opaque, has_opaque = _get(manifest, "storage",
                              "server_stores_only_opaque_bytes")
    _check(results, "core_test", "server_stores_only_opaque_bytes",
           opaque, has_opaque, opaque is True,
           "skill: the server receives and stores opaque bytes; plaintext exists only on the user's device")

    basis, has_basis = _get(manifest, "claims", "claim_basis")
    _check(results, "core_test", "claim_basis_is_cryptographic_guarantee",
           basis, has_basis, basis == "cryptographic_guarantee",
           f"claim_basis={basis!r} (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK)")

    # ---- Section 2: client_side_encryption (skill: what ZK requires 1, 3, 5) ----
    on_device, has_on_device = _get(manifest, "encryption",
                                    "encryption_happens_on_client_device")
    _check(results, "client_side_encryption", "encryption_on_client_device",
           on_device, has_on_device, on_device is True,
           "skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says")

    plaintext_only, has_po = _get(manifest, "encryption",
                                  "plaintext_exists_only_on_client_device")
    _check(results, "client_side_encryption",
           "plaintext_only_on_client_device",
           plaintext_only, has_po, plaintext_only is True,
           "skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts")

    authenticated, has_auth = _get(manifest, "encryption",
                                   "authenticated_encryption")
    _check(results, "client_side_encryption", "authenticated_encryption",
           authenticated, has_auth, authenticated is True,
           "skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently")

    tls_alone, has_tls_alone = _get(manifest, "encryption",
                                    "relies_on_tls_alone")
    _check(results, "client_side_encryption",
           "encryption_independent_of_transport",
           tls_alone, has_tls_alone, tls_alone is False,
           "skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe")

    # ---- Section 3: key_journey (skill: requires 2; follow the key) ----
    never_leave, has_nl = _get(manifest, "keys", "keys_never_leave_device")
    _check(results, "key_journey", "keys_never_leave_device",
           never_leave, has_nl, never_leave is True,
           "skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features'")

    deriv_local, has_dl = _get(manifest, "keys",
                               "key_derivation_client_side")
    _check(results, "key_journey", "key_derivation_client_side",
           deriv_local, has_dl, deriv_local is True,
           "skill: key derivation happens locally (password -> KDF -> key, all client-side)")

    journey, has_journey = _get(manifest, "keys", "key_journey_documented")
    _check(results, "key_journey", "key_journey_documented",
           journey, has_journey, journey is True,
           "skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings")

    backup_upload, has_bu = _get(manifest, "keys",
                                 "key_backup_uploads_key_to_server")
    _check(results, "key_journey", "no_key_backup_uploaded_to_server",
           backup_upload, has_bu, backup_upload is False,
           "skill (theater): key 'backup' uploads the key to the server under another name")

    # ---- Section 4: trusted_parties_and_recovery (requires 4; recovery story) ----
    escrow, has_escrow = _get(manifest, "trust", "key_escrow")
    _check(results, "trusted_parties_and_recovery", "no_key_escrow",
           escrow, has_escrow, escrow is False,
           "skill: no trusted third parties in the data path — no key escrow")

    backdoor, has_backdoor = _get(manifest, "trust", "recovery_backdoor")
    _check(results, "trusted_parties_and_recovery", "no_recovery_backdoor",
           backdoor, has_backdoor, backdoor is False,
           "skill: no trusted third parties in the data path — no recovery backdoor")

    admin_view, has_av = _get(manifest, "trust", "admin_plaintext_view")
    _check(results, "trusted_parties_and_recovery", "no_admin_plaintext_view",
           admin_view, has_av, admin_view is False,
           "skill: no trusted third parties in the data path — no admin plaintext view")

    components, has_comp = _get(manifest, "trust", "trusted_components")
    _check(results, "trusted_parties_and_recovery",
           "trusted_components_named_including_client_os_distribution",
           components, has_comp,
           isinstance(components, list)
           and "client" in components
           and "operating_system" in components
           and "distribution_channel" in components,
           f"trusted_components={components!r} (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)")

    third_parties, has_tp = _get(manifest, "trust",
                                 "trusted_third_parties_in_data_path")
    _check(results, "trusted_parties_and_recovery",
           "trusted_third_parties_in_data_path_listed",
           third_parties, has_tp, isinstance(third_parties, list),
           f"trusted_third_parties_in_data_path={third_parties!r} (skill: each exception is a named party you now trust — list them; an empty list declares none)")

    recovers, has_recovers = _get(manifest, "recovery",
                                  "password_reset_recovers_data")
    no_recovery, has_no_rec = _get(manifest, "recovery",
                                   "no_recovery_possible_claimed")
    _check(results, "trusted_parties_and_recovery",
           "recovery_claims_consistent",
           recovers, has_recovers and has_no_rec,
           not (recovers is True and no_recovery is True),
           f"password_reset_recovers_data={recovers!r} no_recovery_possible_claimed={no_recovery!r} (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)")

    # ---- Section 5: plaintext_and_metadata_scope (follow the plaintext; metadata) ----
    locations, has_loc = _get(manifest, "scope",
                              "plaintext_locations_documented")
    _check(results, "plaintext_and_metadata_scope",
           "plaintext_locations_documented",
           locations, has_loc, locations is True,
           "skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary")

    in_logs, has_logs = _get(manifest, "scope", "plaintext_in_logs")
    _check(results, "plaintext_and_metadata_scope", "plaintext_not_in_logs",
           in_logs, has_logs, in_logs is False,
           "skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee")

    in_dumps, has_dumps = _get(manifest, "scope",
                               "plaintext_in_crash_dumps")
    _check(results, "plaintext_and_metadata_scope",
           "plaintext_not_in_crash_dumps",
           in_dumps, has_dumps, in_dumps is False,
           "skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee")

    in_thumbs, has_thumbs = _get(manifest, "scope",
                                 "plaintext_in_thumbnails_or_previews")
    _check(results, "plaintext_and_metadata_scope",
           "plaintext_not_in_thumbnails_or_previews",
           in_thumbs, has_thumbs, in_thumbs is False,
           "skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee")

    metadata, has_meta = _get(manifest, "scope",
                              "metadata_leakage_acknowledged")
    _check(results, "plaintext_and_metadata_scope",
           "metadata_leakage_acknowledged",
           metadata, has_meta, metadata is True,
           "skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it")

    residual, has_res = _get(manifest, "scope",
                             "residual_risks_documented")
    _check(results, "plaintext_and_metadata_scope",
           "residual_risks_documented",
           residual, has_res, residual is True,
           "skill: residual risks are part of the answer, not a footnote")

    # ---- Section 6: theater_and_threat_model (skill: ZK matters vs theater) ----
    client_type, has_ct = _get(manifest, "theater", "client_type")
    _check(results, "theater_and_threat_model", "client_type_declared",
           client_type, has_ct,
           isinstance(client_type, str) and len(client_type.strip()) > 0,
           f"client_type={client_type!r} (skill: say which one you are looking at — a locally installed client or a web app served by the same server)")

    web_ack, has_web_ack = _get(manifest, "theater",
                                "web_app_trust_distinction_acknowledged")
    if has_ct and client_type == "web_app_served_by_same_server":
        _check(results, "theater_and_threat_model",
               "web_app_trust_distinction_acknowledged",
               web_ack, has_web_ack, web_ack is True,
               f"client_type={client_type!r} web_app_trust_distinction_acknowledged={web_ack!r} (skill: the web-app paradox — browser-delivered crypto moves trust to the server's code pipeline; it is not the same guarantee as a locally installed client, and that distinction must be stated)")
    else:
        _check(results, "theater_and_threat_model",
               "web_app_trust_distinction_acknowledged",
               client_type, has_ct, True,
               "client is not declared as a web app served by the same server")

    search_tokens, has_st = _get(
        manifest, "theater",
        "search_or_indexing_requires_server_plaintext_or_tokens")
    _check(results, "theater_and_threat_model",
           "search_indexing_does_not_expose_plaintext_or_tokens",
           search_tokens, has_st, search_tokens is False,
           "skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens")

    malicious, has_mal = _get(manifest, "theater",
                              "threat_model_includes_malicious_operator")
    _check(results, "theater_and_threat_model",
           "threat_model_includes_malicious_operator",
           malicious, has_mal, malicious is True,
           "skill (theater): the threat model quietly excludes the actual adversary (a malicious operator)")

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
        verdict = "CLAIMS_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CLAIMS_SOUND"

    return {
        "service": "zero-knowledge-claim-audit",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
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
        "ZERO-KNOWLEDGE CLAIM AUDIT",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: zero_knowledge_claim_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CLAIMS_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
