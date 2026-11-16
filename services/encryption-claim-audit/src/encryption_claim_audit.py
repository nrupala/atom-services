#!/usr/bin/env python3
"""Encryption claim audit — deterministic core.

Built from the bound skill `encryption` (v1): "Practical encryption
guidance — what to encrypt, key management basics, authenticated
encryption, KDF choice, and how to spot weak crypto claims."

The caller submits one encryption-evidence manifest (a dict, or JSON
on the CLI) declaring a product's encryption claims and posture.
Every check reads declared manifest fields:

- field present and valid   -> pass
- field present and invalid -> fail
- field absent              -> missing (evidence not provided)

Verdict:
- any fail             -> CLAIMS_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CLAIMS_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "claim_specificity",
    "standard_construction",
    "key_management",
    "derivation_and_randomness",
    "coverage",
    "claim_consistency",
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
        "algorithm": "string",
        "mode": "string",
        "key_length_bits": "number",
        "vague_marketing_terms_used": "boolean",
        "end_to_end_encrypted": "boolean",
        "zero_knowledge": "boolean",
    },
    "construction": {
        "authenticated_encryption": "boolean",
        "custom_crypto": "boolean",
        "nonce_unique_per_key": "boolean",
    },
    "asymmetric": {
        "applies": "boolean",
        "key_exchange": "string",
        "signatures": "string",
    },
    "key_management": {
        "keys_from_csprng": "boolean",
        "keys_hardcoded": "boolean",
        "storage": "string",
        "rotation_planned": "boolean",
        "recovery_story_documented": "boolean",
    },
    "password_derivation": {
        "applies": "boolean",
        "kdf": "string",
        "salt_unique_random_per_key": "boolean",
        "password_used_directly_as_key": "boolean",
    },
    "randomness": {"source": "string"},
    "coverage": {
        "transport": {
            "tls_version": "string",
            "plaintext_fallback": "boolean",
        },
        "at_rest": {
            "encrypted": "boolean",
            "key_stored_with_data": "boolean",
        },
        "in_use": {
            "plaintext_logged": "boolean",
            "plaintext_in_crash_dumps": "boolean",
        },
        "fails_closed_on_crypto_error": "boolean",
    },
    "access": {
        "server_can_read_plaintext": "boolean",
        "server_holds_decryption_keys": "boolean",
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
    """Return the verdict dict for an encryption-evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: claim_specificity (skill: how to evaluate a claim) ----
    algorithm, has_algorithm = _get(manifest, "claims", "algorithm")
    _check(results, "claim_specificity", "algorithm_named",
           algorithm, has_algorithm,
           isinstance(algorithm, str) and len(algorithm.strip()) > 0,
           f"algorithm={algorithm!r} (skill: name the algorithm, mode, and key length)")

    mode, has_mode = _get(manifest, "claims", "mode")
    _check(results, "claim_specificity", "mode_named",
           mode, has_mode,
           isinstance(mode, str) and len(mode.strip()) > 0,
           f"mode={mode!r} (skill: name the algorithm, mode, and key length)")

    key_length, has_key_length = _get(manifest, "claims", "key_length_bits")
    _check(results, "claim_specificity", "key_length_stated",
           key_length, has_key_length,
           isinstance(key_length, (int, float))
           and not isinstance(key_length, bool) and key_length > 0,
           f"key_length_bits={key_length!r} (skill: name the algorithm, mode, and key length)")

    vague, has_vague = _get(manifest, "claims", "vague_marketing_terms_used")
    _check(results, "claim_specificity", "no_vague_unqualified_claim",
           vague, has_vague, vague is False,
           "skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential")

    # ---- Section 2: standard_construction (skill: standard constructions) ----
    sym_present = has_algorithm and has_mode and has_key_length
    sym_ok = (
        str(algorithm).upper() == "AES"
        and str(mode).upper() == "GCM"
        and isinstance(key_length, (int, float))
        and not isinstance(key_length, bool)
        and key_length == 256
    )
    _check(results, "standard_construction", "symmetric_is_aes_256_gcm",
           algorithm, sym_present, sym_ok,
           f"algorithm={algorithm!r} mode={mode!r} key_length_bits={key_length!r} (skill: symmetric: AES-256-GCM)")

    _check(results, "standard_construction", "mode_is_not_ecb",
           mode, has_mode, str(mode).upper() != "ECB",
           f"mode={mode!r} (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks)")

    authenticated, has_auth = _get(manifest, "construction",
                                   "authenticated_encryption")
    _check(results, "standard_construction", "authenticated_encryption",
           authenticated, has_auth, authenticated is True,
           "skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident")

    custom, has_custom = _get(manifest, "construction", "custom_crypto")
    _check(results, "standard_construction", "no_custom_crypto",
           custom, has_custom, custom is False,
           "skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES")

    nonce, has_nonce = _get(manifest, "construction", "nonce_unique_per_key")
    _check(results, "standard_construction", "nonce_unique_per_key",
           nonce, has_nonce, nonce is True,
           "skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key")

    asym_applies, has_asym_applies = _get(manifest, "asymmetric", "applies")
    kx, has_kx = _get(manifest, "asymmetric", "key_exchange")
    sig, has_sig = _get(manifest, "asymmetric", "signatures")
    if has_asym_applies and asym_applies:
        _check(results, "standard_construction", "asymmetric_is_standard",
               kx, has_kx and has_sig,
               kx == "X25519" and sig == "Ed25519",
               f"key_exchange={kx!r} signatures={sig!r} (skill: X25519 for key exchange, Ed25519 for signatures)")
    else:
        _check(results, "standard_construction", "asymmetric_is_standard",
               asym_applies, has_asym_applies, True,
               "no asymmetric cryptography declared")

    # ---- Section 3: key_management (skill: where systems actually fail) ----
    csprng, has_csprng = _get(manifest, "key_management", "keys_from_csprng")
    _check(results, "key_management", "keys_generated_from_csprng",
           csprng, has_csprng, csprng is True,
           "skill: keys come from the CSPRNG, never from passwords directly")

    hardcoded, has_hardcoded = _get(manifest, "key_management",
                                    "keys_hardcoded")
    _check(results, "key_management", "no_hardcoded_keys",
           hardcoded, has_hardcoded, hardcoded is False,
           "skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps")

    storage, has_storage = _get(manifest, "key_management", "storage")
    _check(results, "key_management", "key_storage_in_keystore_or_memory",
           storage, has_storage,
           storage in ("platform_keystore", "memory_only"),
           f"storage={storage!r} (skill: keys live in the platform keystore or in memory only)")

    rotation, has_rotation = _get(manifest, "key_management",
                                  "rotation_planned")
    _check(results, "key_management", "key_rotation_planned",
           rotation, has_rotation, rotation is True,
           "skill: plan rotation before you need it — what happens to old ciphertext when the key changes?")

    recovery, has_recovery = _get(manifest, "key_management",
                                  "recovery_story_documented")
    _check(results, "key_management", "recovery_story_documented",
           recovery, has_recovery, recovery is True,
           "skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated")

    # ---- Section 4: derivation_and_randomness ----
    pd_applies, has_pd_applies = _get(manifest, "password_derivation",
                                      "applies")
    kdf, has_kdf = _get(manifest, "password_derivation", "kdf")
    if has_pd_applies and pd_applies:
        _check(results, "derivation_and_randomness",
               "kdf_is_argon2id_or_pbkdf2",
               kdf, has_kdf, kdf in ("Argon2id", "PBKDF2"),
               f"kdf={kdf!r} (skill: Argon2id; PBKDF2 acceptable with high iteration counts; raw SHA-256 is not key derivation)")
    else:
        _check(results, "derivation_and_randomness",
               "kdf_is_argon2id_or_pbkdf2",
               pd_applies, has_pd_applies, True,
               "no password-derived keys declared")

    salt, has_salt = _get(manifest, "password_derivation",
                          "salt_unique_random_per_key")
    if has_pd_applies and pd_applies:
        _check(results, "derivation_and_randomness",
               "unique_random_salt_per_key",
               salt, has_salt, salt is True,
               "skill: passwords become keys through Argon2id with a unique random salt per key")
    else:
        _check(results, "derivation_and_randomness",
               "unique_random_salt_per_key",
               pd_applies, has_pd_applies, True,
               "no password-derived keys declared")

    direct, has_direct = _get(manifest, "password_derivation",
                              "password_used_directly_as_key")
    if has_pd_applies and pd_applies:
        _check(results, "derivation_and_randomness",
               "password_not_used_directly_as_key",
               direct, has_direct, direct is False,
               "skill mistake: weak or missing KDF — passwords used directly as keys")
    else:
        _check(results, "derivation_and_randomness",
               "password_not_used_directly_as_key",
               pd_applies, has_pd_applies, True,
               "no password-derived keys declared")

    rand_source, has_rand = _get(manifest, "randomness", "source")
    _check(results, "derivation_and_randomness",
           "randomness_from_os_csprng",
           rand_source, has_rand, rand_source == "os_csprng",
           f"source={rand_source!r} (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed)")

    # ---- Section 5: coverage (skill: the three states + fail closed) ----
    tls, has_tls = _get(manifest, "coverage", "transport", "tls_version")
    _check(results, "coverage", "transport_tls_1_2_or_higher",
           tls, has_tls, tls in ("1.2", "1.3"),
           f"tls_version={tls!r} (skill: TLS 1.2+ for every network hop, no exceptions)")

    fallback, has_fallback = _get(manifest, "coverage", "transport",
                                  "plaintext_fallback")
    _check(results, "coverage", "transport_no_plaintext_fallback",
           fallback, has_fallback, fallback is False,
           "skill: TLS 1.2+ for every network hop, no plaintext fallbacks")

    at_rest, has_at_rest = _get(manifest, "coverage", "at_rest", "encrypted")
    _check(results, "coverage", "at_rest_encrypted",
           at_rest, has_at_rest, at_rest is True,
           "skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets")

    key_with_data, has_kwd = _get(manifest, "coverage", "at_rest",
                                  "key_stored_with_data")
    _check(results, "coverage", "key_not_stored_with_data",
           key_with_data, has_kwd, key_with_data is False,
           "skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps")

    logged, has_logged = _get(manifest, "coverage", "in_use",
                              "plaintext_logged")
    _check(results, "coverage", "in_use_plaintext_not_logged",
           logged, has_logged, logged is False,
           "skill: in use — minimize plaintext lifetime, never log it")

    dumps, has_dumps = _get(manifest, "coverage", "in_use",
                            "plaintext_in_crash_dumps")
    _check(results, "coverage", "in_use_plaintext_not_in_crash_dumps",
           dumps, has_dumps, dumps is False,
           "skill: in use — never put plaintext in crash dumps")

    fails_closed, has_fc = _get(manifest, "coverage",
                                "fails_closed_on_crypto_error")
    _check(results, "coverage", "fails_closed_on_crypto_failure",
           fails_closed, has_fc, fails_closed is True,
           "skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected")

    # ---- Section 6: claim_consistency (claim vs declared posture) ----
    e2e, has_e2e = _get(manifest, "claims", "end_to_end_encrypted")
    server_read, has_server_read = _get(manifest, "access",
                                        "server_can_read_plaintext")
    if has_e2e and e2e:
        _check(results, "claim_consistency",
               "end_to_end_claim_matches_server_access",
               server_read, has_server_read, server_read is False,
               f"end_to_end_encrypted={e2e!r} server_can_read_plaintext={server_read!r} (skill: if someone encrypts only in transit, they trust the server; follow the key)")
    else:
        _check(results, "claim_consistency",
               "end_to_end_claim_matches_server_access",
               e2e, has_e2e, True,
               "no end-to-end encryption claim declared")

    zk, has_zk = _get(manifest, "claims", "zero_knowledge")
    server_keys, has_server_keys = _get(manifest, "access",
                                        "server_holds_decryption_keys")
    if has_zk and zk:
        _check(results, "claim_consistency",
               "zero_knowledge_claim_matches_key_access",
               server_keys, has_server_keys, server_keys is False,
               f"zero_knowledge={zk!r} server_holds_decryption_keys={server_keys!r} (skill: ask where the key lives and who can read it — the answers draw the real trust boundary)")
    else:
        _check(results, "claim_consistency",
               "zero_knowledge_claim_matches_key_access",
               zk, has_zk, True,
               "no zero-knowledge claim declared")

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
        "service": "encryption-claim-audit",
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
        "ENCRYPTION CLAIM AUDIT",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: encryption_claim_audit.py <manifest.json>",
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
