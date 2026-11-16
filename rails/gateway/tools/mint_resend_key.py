#!/usr/bin/env python3
"""Mint the atoms gateway's Resend API key and place it directly.

Uses the house full-access Resend credential (custom.resend-codetopo
surrogate) to create a sending-scoped key named "atoms-gateway",
then places the token as the Worker's RESEND_API_KEY secret through
the Cloudflare API route. The token exists only in this process's
memory and inside Cloudflare — never printed, filed, or logged
(the documented pattern from the codetopo connector, 2026-10-23).
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

HERE = os.path.dirname(os.path.abspath(__file__))
CF_INFRA = os.path.join(HERE, "cf_infra.py")
SCRIPT = "atoms-gateway"


def main() -> None:
    req = urllib.request.Request(
        "https://api.resend.com/api-keys",
        data=json.dumps({"name": "atoms-gateway", "permission": "sending_access"}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "atoms-gateway-setup/1.0"},
        method="POST",
    )
    add_surrogate_to_request(req, "custom.resend-codetopo", allowed_hosts=["api.resend.com"])
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            created = read_json_response(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:600]
        raise SystemExit(f"resend key creation failed: HTTP {exc.code} {body}")
    token = created.get("token")
    key_id = created.get("id")
    if not token or not key_id:
        raise SystemExit(f"unexpected resend response shape: {json.dumps(created)[:300]}")

    proc = subprocess.run(
        [sys.executable, CF_INFRA, "put-secret", SCRIPT, "RESEND_API_KEY"],
        input=token, capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(f"placing RESEND_API_KEY failed: {proc.stdout} {proc.stderr}")
    print(json.dumps({
        "resend_key_id": key_id,
        "resend_key_name": "atoms-gateway",
        "placed_as": "RESEND_API_KEY worker secret (value never printed)",
    }))


if __name__ == "__main__":
    main()
