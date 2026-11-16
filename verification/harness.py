#!/usr/bin/env python3
"""External-verification harness: executes designed test cases against the
LIVE atoms gateway (https://atoms.pipavia.com) with the non-internal tester
key and records raw requests/outputs. Never prints the key.

Usage:
  harness.py run --atom <service> --cases cases.json --out evidence.json
  harness.py tools --atom <service>          # print tools/list result

Cases file: {"cases":[{"id","kind","input":<json value>|null,
                        "raw_body":<string>|null,
                        "expect":{...}}, ...]}
For kind "full-pass" the harness additionally runs the REST call a second
time (determinism, byte-compare) and the same input via MCP tools/call
(face parity, structuredContent vs REST artifact deep-compare).

Pre-flight (Wave 7): every case file is validated by validate_cases.py
BEFORE any call is made; a rejected file is not executed at all. The
validation report is written next to the evidence file as
validation.json."""
import argparse, json, os, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validate_cases

BASE = "https://atoms.pipavia.com"
STATE = os.path.expanduser("~/.tools-state/atoms-external-verification.json")
UA = {"User-Agent": "atoms-external-verification/1.0 (+https://atoms.pipavia.com)"}

def load_key():
    with open(STATE) as f:
        st = json.load(f)
    return st["gateway_key"], st["key_prefix"], st["key_last4"]

def http(method, url, key=None, body=None, raw=None):
    data = raw.encode() if raw is not None else (
        json.dumps(body).encode() if body is not None else None)
    headers = {"Content-Type": "application/json", **UA}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as e:  # transport error is evidence too
        return -1, f"TRANSPORT_ERROR: {e}"

def jparse(text):
    try:
        return json.loads(text)
    except Exception:
        return None

def mcp_tools_list(atom, key):
    status, text = http("POST", f"{BASE}/mcp/{atom}", key,
                        {"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    body = jparse(text)
    tools = (((body or {}).get("result") or {}).get("tools")) or []
    return status, tools

def mcp_call(atom, key, tool_name, args):
    return http("POST", f"{BASE}/mcp/{atom}", key,
                {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                 "params": {"name": tool_name, "arguments": args}})

def run_atom(atom, cases_path, out_path):
    key, prefix, last4 = load_key()
    with open(cases_path) as f:
        cases_doc = json.load(f)
    vreport = validate_cases.validate(atom, cases_doc)
    vpath = os.path.join(os.path.dirname(os.path.abspath(out_path)),
                         "validation.json")
    with open(vpath, "w") as f:
        json.dump(vreport, f, indent=2)
    if not vreport["ok"]:
        print(json.dumps({"atom": atom, "EXECUTION REFUSED":
                          "case file rejected by validate_cases.py",
                          "validation_report": vpath,
                          "rejections": vreport["rejections"]}, indent=2))
        raise SystemExit(1)
    cases = cases_doc["cases"]
    hstatus, htext = http("GET", f"{BASE}/health")
    health = jparse(htext) or {}
    tstatus, tools = mcp_tools_list(atom, key)
    tool_name = tools[0]["name"] if tools else None
    out_cases = []
    for case in cases:
        execs = []
        inp = case.get("input")
        raw = case.get("raw_body")
        status, text = http("POST", f"{BASE}/v1/{atom}", key, body=inp, raw=raw)
        execs.append({"face": "REST", "status": status, "response_text": text})
        entry = {"id": case["id"], "kind": case["kind"], "expect": case.get("expect"),
                 "input": inp, "raw_body": raw, "executions": execs}
        if case["kind"] == "full-pass" and isinstance(inp, dict):
            time.sleep(0.3)
            s2, t2 = http("POST", f"{BASE}/v1/{atom}", key, body=inp)
            execs.append({"face": "REST-repeat", "status": s2, "response_text": t2})
            entry["determinism_byte_identical"] = (s2 == status and t2 == text)
            if tool_name:
                time.sleep(0.3)
                s3, t3 = mcp_call(atom, key, tool_name, inp)
                execs.append({"face": "MCP", "status": s3, "response_text": t3})
                mcp_body = jparse(t3)
                sc = ((mcp_body or {}).get("result") or {}).get("structuredContent")
                rest_body = jparse(text)
                entry["parity_structured_equal"] = (sc is not None and sc == rest_body)
                entry["mcp_structured_content"] = sc
        out_cases.append(entry)
        time.sleep(0.3)
    evidence = {
        "atom": atom,
        "tested_at_utc": datetime.now(timezone.utc).isoformat(),
        "gateway": {"base": BASE, "version": health.get("version"),
                    "health_status": hstatus},
        "tester_key": {"prefix": prefix, "last4": last4},
        "mcp_tools_list_status": tstatus,
        "mcp_tool_name": tool_name,
        "mcp_tools": tools,
        "case_validation": {"ok": True,
                            "validator": vreport["validator"],
                            "register_size": vreport["register_size"]},
        "cases": out_cases,
    }
    with open(out_path, "w") as f:
        json.dump(evidence, f, indent=2)
    summary = {c["id"]: [e["status"] for e in c["executions"]] for c in out_cases}
    print(json.dumps({"atom": atom, "tool": tool_name, "cases": summary}))

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--atom", required=True)
    r.add_argument("--cases", required=True)
    r.add_argument("--out", required=True)
    t = sub.add_parser("tools")
    t.add_argument("--atom", required=True)
    a = ap.parse_args()
    if a.cmd == "run":
        run_atom(a.atom, a.cases, a.out)
    else:
        key, _, _ = load_key()
        s, tools = mcp_tools_list(a.atom, key)
        print(json.dumps({"status": s, "tools": tools}, indent=2))
