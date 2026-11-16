#!/usr/bin/env python3
"""Crypto inventory PQ migration map — deterministic core.

Built from the bound skill `post-quantum-cryptography` (v1): inventory
the asymmetric cryptography in use, classify each use, and map it to
its post-quantum migration in priority order.

The caller submits one crypto inventory manifest: a list of entries,
each declaring one cryptographic use (where RSA/ECC and friends live,
per the skill's inventory step). The map is computed, not judged:

- Classification is by algorithm family, from the skill's own rules:
  classical asymmetric crypto is what quantum breaks ("it's the
  asymmetric side that breaks"); the NIST PQC family is ML-KEM
  (FIPS 203), ML-DSA (FIPS 204) and SLH-DSA (FIPS 205); classical + PQ
  together is hybrid mode, the skill's transition mode; symmetric and
  hash algorithms are not quantum-broken ("don't 'upgrade' symmetric
  crypto — AES-256 is fine"); anything else is unknown and must be
  classified before it can be planned.
- The target PQ family follows the entry's declared purpose
  (ML-KEM for key exchange, ML-DSA / SLH-DSA for signatures), or the
  PQ algorithm an entry already names.
- Priority order is the skill's rule — "data shelf-life x migration
  horizon = priority order" — applied as an ordering, never a
  threshold: migration-needed entries first (vulnerable, then
  hybrid, then unknown, then PQ-ready, then symmetric/hash), and
  within each group the longest shelf-life first. No year cutoff is
  invented anywhere in this core.

Status vocabulary (computed deliverable):
- every submitted entry is a valid, classified entry with a numeric
  shelf-life            -> complete
- a map was computed but some entries are invalid, unclassified, or
  missing shelf-life     -> partial
- no inventory, an empty inventory, or no valid entries at all
                         -> insufficient_evidence

No model call, no network, no clock dependence: the same inventory
always produces the same map. That determinism is the product.
"""
import json
import sys

CLASSIFICATIONS = (
    "quantum_vulnerable",
    "hybrid_classical_pq",
    "pq_ready",
    "symmetric_or_hash_not_broken",
    "unknown",
)

# Migration-needed first, in this group order; no-action groups last.
_GROUP_ORDER = {
    "quantum_vulnerable": 0,
    "hybrid_classical_pq": 1,
    "unknown": 2,
    "pq_ready": 3,
    "symmetric_or_hash_not_broken": 4,
}

_ACTIONS = {
    "quantum_vulnerable": "migrate_hybrid",
    "hybrid_classical_pq": "complete_hybrid_transition",
    "pq_ready": "retain_pq",
    "symmetric_or_hash_not_broken": "no_pq_migration_needed",
    "unknown": "classify_before_planning",
}

_BASIS = {
    "quantum_vulnerable": "classical asymmetric algorithm — quantum "
                          "breaks today's asymmetric crypto",
    "hybrid_classical_pq": "classical + NIST PQ together — hybrid "
                           "mode during transition",
    "pq_ready": "NIST PQC standard family algorithm (FIPS 203/204/205)",
    "symmetric_or_hash_not_broken": "symmetric/hash algorithm — the "
                                    "asymmetric side is what breaks; "
                                    "AES-256 is fine",
    "unknown": "algorithm is in none of the skill's families "
               "(classical asymmetric, NIST PQ, symmetric/hash) — "
               "classify before planning",
}

_PQ_MARKERS = ("ml-kem", "mlkem", "kyber", "ml-dsa", "mldsa",
               "dilithium", "slh-dsa", "slhdsa", "sphincs")
_CLASSICAL_MARKERS = ("rsa", "ecdsa", "ecdh", "ecdhe", "ed25519",
                      "ed448", "x25519", "x448", "curve25519", "dsa",
                      "diffie", "elgamal", "ecies", "secp256",
                      "secp384", "secp521", "p-256", "p-384", "p-521")
_SYMMETRIC_MARKERS = ("aes", "chacha", "sha-2", "sha2", "sha-256",
                      "sha256", "sha-384", "sha384", "sha-512",
                      "sha512", "sha3", "shake", "blake", "hmac",
                      "argon", "scrypt", "bcrypt", "pbkdf")
_KEY_EXCHANGE_PURPOSES = ("key_exchange", "key-exchange",
                          "key exchange", "kem", "key_encapsulation",
                          "encryption", "key_transport")
_SIGNATURE_PURPOSES = ("signature", "signing")

# Documented manifest field types (SERVICE.md input table). Every
# top-level field the core reads is listed, in read order. A field
# present with the wrong JSON type is a caller error (ValueError ->
# the gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Inventory entries are intentionally unvalidated ("any"): SERVICE.md
# documents that a non-object entry is counted in
# counts.invalid_entries and skipped, and entry fields are read
# defensively (non-string / non-number values become missing).
MANIFEST_SPEC = {
    "system": "string",
    "inventory": ["any"],
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _str_or_none(value):
    return value if isinstance(value, str) else None


def _number_or_none(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return value


def _classify(algorithm):
    """Classify an algorithm name into the skill's families."""
    if not isinstance(algorithm, str) or not algorithm:
        return "unknown"
    text = algorithm.lower()
    has_pq = any(marker in text for marker in _PQ_MARKERS)
    # Strip the PQ names before the classical scan: "ML-DSA" and
    # "SLH-DSA" contain the classical marker "dsa" as a substring.
    cleaned = text
    for marker in _PQ_MARKERS:
        cleaned = cleaned.replace(marker, " ")
    has_classical = any(marker in cleaned
                        for marker in _CLASSICAL_MARKERS)
    if has_pq and has_classical:
        return "hybrid_classical_pq"
    if has_pq:
        return "pq_ready"
    if has_classical:
        return "quantum_vulnerable"
    if any(marker in text for marker in _SYMMETRIC_MARKERS):
        return "symmetric_or_hash_not_broken"
    return "unknown"


def _target_family(algorithm, purpose):
    """The PQ family an entry maps to, or None when no PQ move applies."""
    text = algorithm.lower() if isinstance(algorithm, str) else ""
    if "ml-kem" in text or "mlkem" in text or "kyber" in text:
        return "ML-KEM (FIPS 203)"
    if "slh-dsa" in text or "slhdsa" in text or "sphincs" in text:
        return "SLH-DSA (FIPS 205)"
    if "ml-dsa" in text or "mldsa" in text or "dilithium" in text:
        return "ML-DSA (FIPS 204)"
    purpose_text = purpose.lower() if isinstance(purpose, str) else ""
    if purpose_text in _KEY_EXCHANGE_PURPOSES:
        return "ML-KEM (FIPS 203)"
    if purpose_text in _SIGNATURE_PURPOSES:
        return "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)"
    return ("ML-KEM (FIPS 203) for key exchange; ML-DSA (FIPS 204) / "
            "SLH-DSA (FIPS 205) for signatures")


def evaluate(manifest):
    """Return the migration-map dict for a crypto inventory manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)

    counts = {
        "total": 0,
        "invalid_entries": 0,
        "by_classification": {name: 0 for name in CLASSIFICATIONS},
        "migration_needed": 0,
        "missing_shelf_life": 0,
        "missing_owner": 0,
    }
    result = {
        "service": "crypto-inventory-pq-migration-map",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "status": "insufficient_evidence",
        "counts": counts,
        "migration_map": [],
        "summary": "",
    }

    inventory, has_inventory = _get(manifest, "inventory")
    if not has_inventory or not isinstance(inventory, list) \
            or not inventory:
        result["summary"] = (
            "Insufficient evidence: no crypto inventory entries "
            "submitted."
        )
        return result

    rows = []
    for index, entry in enumerate(inventory):
        if not isinstance(entry, dict):
            counts["invalid_entries"] += 1
            continue
        algorithm, _ = _get(entry, "algorithm")
        purpose, _ = _get(entry, "purpose")
        classification = _classify(algorithm)
        shelf = _number_or_none(_get(entry, "shelf_life_years")[0])
        owner = _str_or_none(_get(entry, "owner")[0])
        if classification in ("quantum_vulnerable",
                              "hybrid_classical_pq", "pq_ready"):
            target = _target_family(algorithm, purpose)
        else:
            target = None
        rows.append((index, {
            "id": _str_or_none(_get(entry, "id")[0]),
            "surface": _str_or_none(_get(entry, "surface")[0]),
            "algorithm": _str_or_none(algorithm),
            "purpose": _str_or_none(purpose),
            "classification": classification,
            "action": _ACTIONS[classification],
            "target_family": target,
            "shelf_life_years": shelf,
            "owner": owner,
            "priority_rank": None,
            "basis": _BASIS[classification],
        }))
        counts["by_classification"][classification] += 1
        if shelf is None:
            counts["missing_shelf_life"] += 1
        if owner is None:
            counts["missing_owner"] += 1

    counts["total"] = len(rows)
    counts["migration_needed"] = \
        counts["by_classification"]["quantum_vulnerable"]

    if not rows:
        result["summary"] = (
            f"Insufficient evidence: {counts['invalid_entries']} "
            "invalid inventory entries submitted; no valid entries "
            "to map."
        )
        return result

    def _sort_key(item):
        index, row = item
        shelf = row["shelf_life_years"]
        return (
            _GROUP_ORDER[row["classification"]],
            0 if shelf is not None else 1,
            -shelf if shelf is not None else 0,
            index,
        )

    rows.sort(key=_sort_key)
    migration_map = []
    for rank, (_index, row) in enumerate(rows, start=1):
        row["priority_rank"] = rank
        migration_map.append(row)
    result["migration_map"] = migration_map

    by_class = counts["by_classification"]
    if counts["invalid_entries"] == 0 \
            and by_class["unknown"] == 0 \
            and counts["missing_shelf_life"] == 0:
        result["status"] = "complete"
    else:
        result["status"] = "partial"
    result["summary"] = (
        f"Migration map over {counts['total']} inventory entries: "
        f"{by_class['quantum_vulnerable']} quantum-vulnerable, "
        f"{by_class['hybrid_classical_pq']} hybrid, "
        f"{by_class['pq_ready']} PQ-ready, "
        f"{by_class['symmetric_or_hash_not_broken']} symmetric/hash "
        f"not broken, {by_class['unknown']} unknown; "
        f"{counts['missing_shelf_life']} missing shelf-life."
    )
    return result


def stamp(verdict):
    """Human-readable stamp of a migration-map dict."""
    lines = [
        "CRYPTO INVENTORY PQ MIGRATION MAP",
        f"system: {verdict.get('system')}",
        f"STATUS: {verdict['status']}",
        verdict["summary"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: crypto_inventory_pq_migration_map.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["status"] == "complete" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
