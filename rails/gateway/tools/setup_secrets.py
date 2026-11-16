#!/usr/bin/env python3
"""One-time atoms gateway secret setup.

Generates the ATOMS_MASTER_SECRET, places it as a Worker secret
binding through the Cloudflare API route, and bootstraps the
internal caller (G7): an issuance record for internal@aimlds.org
scoped to atom #1, inserted directly into D1.

The master secret exists only in this process's memory and inside
Cloudflare — it is never printed, filed, or logged. The derived
internal key is written to /tmp/atoms-internal-key.txt (mode 0600,
ephemeral scratch) for this session's behavior proofs; it is
revocable and reissuable like any gateway key.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import subprocess
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CF_INFRA = os.path.join(HERE, "cf_infra.py")
SCRIPT = "atoms-gateway"
INTERNAL_EMAIL = "internal@aimlds.org"
ATOM_SCOPE = "release_readiness_verdict"


def iso_now() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def put_secret(name: str, value: str) -> None:
    proc = subprocess.run(
        [sys.executable, CF_INFRA, "put-secret", SCRIPT, name],
        input=value, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(f"put-secret {name} failed: {proc.stdout} {proc.stderr}")
    print(proc.stdout.strip())


def d1(sql: str, uuid: str) -> None:
    proc = subprocess.run(
        [sys.executable, CF_INFRA, "d1-query", uuid, sql],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(f"d1 query failed: {proc.stdout} {proc.stderr}")
    out = json.loads(proc.stdout)
    if not out.get("success", True):
        raise SystemExit(f"d1 query unsuccessful: {proc.stdout[:400]}")


def main() -> None:
    uuid = sys.argv[1]
    master = secrets.token_hex(32)
    put_secret("ATOMS_MASTER_SECRET", master)

    issued_at = iso_now()
    digest = hmac.new(
        master.encode(), f"{INTERNAL_EMAIL}|{issued_at}".encode(), hashlib.sha256
    ).hexdigest()
    internal_key = f"atm_1_{digest}"
    fingerprint = hmac.new(
        master.encode(), f"fingerprint|{internal_key}".encode(), hashlib.sha256
    ).hexdigest()[:32]

    sql = (
        f"INSERT INTO users (email, created_at) VALUES ('{INTERNAL_EMAIL}', '{issued_at}') "
        "ON CONFLICT(email) DO NOTHING; "
        f"INSERT INTO balances (email, balance_micro) VALUES ('{INTERNAL_EMAIL}', 0) "
        "ON CONFLICT(email) DO NOTHING; "
        "INSERT INTO gateway_keys (email, issued_at, fingerprint, is_internal, revoked_at, created_at) "
        f"VALUES ('{INTERNAL_EMAIL}', '{issued_at}', '{fingerprint}', 1, NULL, '{issued_at}'); "
        "INSERT INTO key_scopes (key_id, scope) "
        f"SELECT id, '{ATOM_SCOPE}' FROM gateway_keys WHERE fingerprint = '{fingerprint}';"
    )
    d1(sql, uuid)

    path = "/tmp/atoms-internal-key.txt"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(internal_key)
    os.chmod(path, 0o600)
    print(json.dumps({
        "master_secret": "placed as ATOMS_MASTER_SECRET (value never printed)",
        "internal_issuance": "created",
        "internal_email": INTERNAL_EMAIL,
        "internal_scope": ATOM_SCOPE,
        "internal_fingerprint": fingerprint,
        "internal_key_file": path,
    }))


if __name__ == "__main__":
    main()
