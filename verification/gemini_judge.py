#!/usr/bin/env python3
"""Ask Gemini to judge one atom's recorded live outputs against its
contract. Reads verification/work/<atom>/evidence.json (produced by
harness.py), writes judgment.json + judge-raw.txt.
Usage: gemini_judge.py --atom <service>"""
import argparse, json, os, subprocess, sys

ROOT = os.path.expanduser("~/workspace/atom-services")
GEMINI = os.path.expanduser("~/workspace/custom-connectors/custom.gemini/bin/gemini.py")

SYSTEM = ("You are an independent software tester issuing a verdict on "
          "recorded test evidence. You did not build the software. You "
          "answer with JSON only when asked for JSON — no markdown "
          "fences, no commentary.")

def judge_input(evidence):
    cases = []
    for c in evidence["cases"]:
        first = c["executions"][0] if c["executions"] else {}
        artifact = None
        try:
            artifact = json.loads(first.get("response_text") or "")
        except Exception:
            artifact = None
        cases.append({
            "id": c["id"], "kind": c["kind"], "expect": c.get("expect"),
            "input": c.get("input"),
            "http_status": first.get("status"),
            "artifact": artifact,
            "determinism_byte_identical": c.get("determinism_byte_identical"),
            "parity_structured_equal": c.get("parity_structured_equal"),
        })
    return {"atom": evidence["atom"], "cases": cases}

def judge_prompt(atom, contract, service_md, jinput):
    return f"""Judge recorded live test evidence for a deterministic API atom against its contract.

ATOM: {atom}

=== contract.yaml ===
{contract}

=== SERVICE.md ===
{service_md}

=== RECORDED EVIDENCE (real HTTP calls to the live gateway) ===
{json.dumps(jinput, indent=2)}

Judge strictly against the documents:
- Verdict/status vocabulary must match the documents exactly.
- The stamp: if the documents or the output format show a stamp field,
  check its presence and shape; report if absent or malformed.
- full-pass case: outcome must be the PASS outcome; every check pass;
  determinism_byte_identical must be true; parity_structured_equal must
  be true (MCP and REST agree). Determinism and parity are recorded ONLY
  for the full-pass case by design — their absence on other cases is not
  a finding and must not be noted as a gap.
- violations case: outcome must be the FAIL outcome; the checks named in
  expect.failing_checks must be failing. Extra failing checks are a
  finding ONLY if they cannot follow from the wrong values supplied.
- sparse case: outcome must be the INSUFFICIENT_EVIDENCE outcome (or its
  documented equivalent) — never a PASS.
- malformed case: HTTP status must be 422 (a clean input error). A 500,
  or a 200 verdict on type-violating input, is a FAIL finding.
- Computed atoms: recompute the quantities in expect.computed_spot_checks
  (or, if none were recorded, at least one headline computed value) from
  the input by hand and compare with the artifact.
- If a test case itself contradicts the contract (the case was wrong,
  not the atom), list it under tester_errors instead of findings.

Return JSON only, exactly this shape:
{{"verdict": "PASS" | "FAIL",
  "findings": [{{"case": "<id>", "expected": "...", "actual": "...",
                 "contract_clause": "<where the contract/SERVICE.md states it>",
                 "detail": "..."}}],
  "tester_errors": [{{"case": "<id>", "problem": "..."}}],
  "computed_checks": [{{"quantity": "...", "expected": "...", "actual": "...", "match": true}}],
  "notes": "..."}}"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atom", required=True)
    a = ap.parse_args()
    svc_dir = os.path.join(ROOT, "services", a.atom)
    contract = open(os.path.join(svc_dir, "contract.yaml")).read()
    service_md = open(os.path.join(svc_dir, "SERVICE.md")).read()
    work = os.path.join(ROOT, "verification", "work", a.atom)
    evidence = json.load(open(os.path.join(work, "evidence.json")))
    prompt = judge_prompt(a.atom, contract, service_md, judge_input(evidence))
    with open(os.path.join(work, "judge-prompt.txt"), "w") as f:
        f.write(prompt)
    r = subprocess.run([sys.executable, GEMINI, "--system", SYSTEM,
                        "--temperature", "0.1", "--max-tokens", "8000",
                        "--timeout", "240"],
                       input=prompt, capture_output=True, text=True, timeout=300)
    with open(os.path.join(work, "judge-raw.txt"), "w") as f:
        f.write(r.stdout or "")
        if r.stderr:
            f.write("\n--- STDERR ---\n" + r.stderr)
    if r.returncode != 0:
        raise SystemExit(f"gemini judge failed rc={r.returncode}: {(r.stderr or '')[:400]}")
    text = (r.stdout or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    try:
        judgment = json.loads(text)
    except Exception as e:
        raise SystemExit(f"judge output not JSON: {e}; see {work}/judge-raw.txt")
    with open(os.path.join(work, "judgment.json"), "w") as f:
        json.dump(judgment, f, indent=2)
    print(json.dumps({"atom": a.atom, "verdict": judgment.get("verdict"),
                      "findings": len(judgment.get("findings") or []),
                      "tester_errors": len(judgment.get("tester_errors") or [])}))

if __name__ == "__main__":
    main()
