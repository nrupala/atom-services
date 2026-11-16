#!/usr/bin/env python3
"""Ask Gemini (independent tester brain) to design test cases for one atom
from its contract.yaml + SERVICE.md. Writes work/<atom>/cases.json and the
raw Gemini response. Usage: gemini_design.py --atom <service>"""
import argparse, json, os, subprocess, sys

ROOT = os.path.expanduser("~/workspace/atom-services")
GEMINI = os.path.expanduser("~/workspace/custom-connectors/custom.gemini/bin/gemini.py")

SYSTEM = ("You are an independent software tester. You did not build the "
          "software you are testing. You answer with JSON only when asked "
          "for JSON — no markdown fences, no commentary.")

def design_prompt(atom, contract, service_md):
    return f"""Design black-box test cases for a deterministic API atom, from its contract alone.

ATOM: {atom}

=== contract.yaml ===
{contract}

=== SERVICE.md ===
{service_md}

Design EXACTLY 4 cases:
1. kind "full-pass": an input manifest that satisfies every requirement the
   documents state, so the atom must return its PASS outcome (the pass
   verdict/status named in the documents).
2. kind "violations": a manifest of the same shape whose values are present
   but wrong in specific ways, so the atom must return its FAIL outcome and
   the checks covering those wrong values must fail. List the check names
   (as named in the documents/output format) you expect to fail.
3. kind "sparse": a manifest with only one or two fields present, so the
   atom must return its INSUFFICIENT_EVIDENCE outcome (or the equivalent
   named in the documents).
4. kind "malformed": a manifest with clear TYPE violations (e.g. a string
   where an object or list is required, a number where a boolean is
   required), so the atom must answer a clean input error (HTTP 422),
   never a 500 and never a verdict.

Inputs must follow the documented input format exactly (field names,
nesting, value types) — you are testing the atom, so your valid cases must
be genuinely valid per the documents. For computed/report atoms (whose
output is a computed artifact with a status such as complete / partial /
insufficient_evidence), adapt: full-pass = a complete well-formed input
expecting the complete status; violations = an input whose data violates
documented consistency rules expecting the documented failure/partial
behaviour; sparse = a minimal input expecting insufficient_evidence;
malformed = type violations expecting HTTP 422. Where the atom computes
numbers, add "computed_spot_checks" to the full-pass expect: a short list
of quantities the judge can recompute from the input by hand.

Return JSON only, exactly this shape:
{{"cases": [
  {{"id": "full-pass", "kind": "full-pass", "input": {{...}},
    "expect": {{"outcome": "<expected verdict/status value>", "http": 200,
               "failing_checks": [], "notes": "..."}}}},
  {{"id": "violations", "kind": "violations", "input": {{...}},
    "expect": {{"outcome": "<expected fail verdict/status>", "http": 200,
               "failing_checks": ["<check name>", ...], "notes": "..."}}}},
  {{"id": "sparse", "kind": "sparse", "input": {{...}},
    "expect": {{"outcome": "<expected insufficient-evidence value>", "http": 200,
               "failing_checks": [], "notes": "..."}}}},
  {{"id": "malformed", "kind": "malformed", "input": {{...}},
    "expect": {{"outcome": null, "http": 422, "failing_checks": [],
               "notes": "..."}}}}
]}}"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atom", required=True)
    a = ap.parse_args()
    svc_dir = os.path.join(ROOT, "services", a.atom)
    contract = open(os.path.join(svc_dir, "contract.yaml")).read()
    service_md = open(os.path.join(svc_dir, "SERVICE.md")).read()
    work = os.path.join(ROOT, "verification", "work", a.atom)
    os.makedirs(work, exist_ok=True)
    prompt = design_prompt(a.atom, contract, service_md)
    with open(os.path.join(work, "design-prompt.txt"), "w") as f:
        f.write(prompt)
    r = subprocess.run([sys.executable, GEMINI, "--system", SYSTEM,
                        "--temperature", "0.2", "--max-tokens", "8000",
                        "--timeout", "240"],
                       input=prompt, capture_output=True, text=True, timeout=300)
    with open(os.path.join(work, "design-raw.txt"), "w") as f:
        f.write(r.stdout or "")
        if r.stderr:
            f.write("\n--- STDERR ---\n" + r.stderr)
    if r.returncode != 0:
        raise SystemExit(f"gemini design failed rc={r.returncode}: {(r.stderr or '')[:400]}")
    text = (r.stdout or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    try:
        cases = json.loads(text)
    except Exception as e:
        raise SystemExit(f"design output not JSON: {e}; see {work}/design-raw.txt")
    kinds = sorted(c["kind"] for c in cases["cases"])
    assert kinds == ["full-pass", "malformed", "sparse", "violations"], kinds
    with open(os.path.join(work, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    print(json.dumps({"atom": a.atom, "cases": [c["id"] for c in cases["cases"]]}))

if __name__ == "__main__":
    main()
