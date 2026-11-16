#!/usr/bin/env python3
"""Atoms gateway infrastructure helper — Cloudflare API via the house
surrogate route (credential custom.cloudflare). Subcommands:

  d1-create            create the atoms-state D1 database (idempotent-ish:
                       lists first, reuses an existing one)
  d1-query <uuid> <sqlfile|sql>   run SQL against the database
  put-secret <script> <name> <value-from-stdin>
                       PUT a Worker secret binding (value read from
                       stdin so it never appears in argv or logs)
  attach-domain <script> <hostname>
                       attach a Workers custom domain

Nothing here prints credential material.
"""
from __future__ import annotations

import json
import sys
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

ACCOUNT = "2edd59d09fd816187b47afbb9ea43af1"
BASE = "https://api.cloudflare.com/client/v4"
CREDENTIAL = "custom.cloudflare"


def api(method: str, path: str, payload=None, raw_text: bool = False):
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = payload.encode() if raw_text else json.dumps(payload).encode()
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    add_surrogate_to_request(req, CREDENTIAL, allowed_hosts=["api.cloudflare.com"])
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return read_json_response(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:1200]
        raise SystemExit(f"HTTP {exc.code} {method} {path}\n{body}")


def d1_create() -> None:
    listed = api("GET", f"/accounts/{ACCOUNT}/d1/database?name=atoms-state")
    for db in listed.get("result", []):
        if db.get("name") == "atoms-state":
            print(json.dumps({"uuid": db["uuid"], "name": db["name"], "existing": True}))
            return
    created = api("POST", f"/accounts/{ACCOUNT}/d1/database", {"name": "atoms-state"})
    result = created.get("result", {})
    print(json.dumps({"uuid": result.get("uuid"), "name": result.get("name"), "existing": False}))


def d1_query(uuid: str, sql: str) -> None:
    out = api("POST", f"/accounts/{ACCOUNT}/d1/database/{uuid}/query", {"sql": sql})
    print(json.dumps(out)[:2000])


def put_secret(script: str, name: str) -> None:
    value = sys.stdin.read()
    if not value:
        raise SystemExit("no secret value on stdin")
    out = api(
        "PUT",
        f"/accounts/{ACCOUNT}/workers/scripts/{script}/secrets",
        {"name": name, "text": value, "type": "secret_text"},
    )
    print(json.dumps({"placed": name, "success": out.get("success")}))


def attach_domain(script: str, hostname: str) -> None:
    out = api(
        "POST",
        f"/accounts/{ACCOUNT}/workers/domains",
        {"hostname": hostname, "service": script, "environment": "production"},
    )
    print(json.dumps(out)[:800])


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "d1-create":
        d1_create()
    elif cmd == "d1-query":
        src = sys.argv[3]
        try:
            with open(src, encoding="utf-8") as fh:
                sql_text = fh.read()
        except OSError:
            sql_text = src
        d1_query(sys.argv[2], sql_text)
    elif cmd == "put-secret":
        put_secret(sys.argv[2], sys.argv[3])
    elif cmd == "attach-domain":
        attach_domain(sys.argv[2], sys.argv[3])
    else:
        raise SystemExit(f"unknown subcommand {cmd}")
