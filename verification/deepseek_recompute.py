#!/usr/bin/env python3
"""Ask DeepSeek (independent second tester) to recompute one atom's
computed quantities by hand from the recorded inputs and compare with
the recorded artifacts. Reads verification/work/<atom>/evidence.json,
writes work/<atom>/deepseek-raw.txt.
Usage: deepseek_recompute.py --atom <service>"""
import argparse, json, os, subprocess, sys

ROOT = os.path.expanduser("~/workspace/atom-services")
DS = os.path.expanduser(
    "~/workspace/custom-connectors/custom.legacy-deepseek/bin/ds_chat.py")

SYSTEM = ("You are an independent software tester performing an "
          "independent recompute. You did not build the software. "
          "Show your arithmetic; never take the artifact's word for "
          "any quantity.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atom", required=True)
    a = ap.parse_args()
    svc_dir = os.path.join(ROOT, "services", a.atom)
    contract = open(os.path.join(svc_dir, "contract.yaml")).read()
    service_md = open(os.path.join(svc_dir, "SERVICE.md")).read()
    work = os.path.join(ROOT, "verification", "work", a.atom)
    evidence = json.load(open(os.path.join(work, "evidence.json")))
    cases = []
    for c in evidence["cases"]:
        if c["kind"] not in ("full-pass", "violations"):
            continue
        first = c["executions"][0] if c["executions"] else {}
        artifact = None
        try:
            artifact = json.loads(first.get("response_text") or "")
        except Exception:
            artifact = None
        cases.append({"id": c["id"], "kind": c["kind"],
                      "input": c.get("input"), "http_status": first.get("status"),
                      "artifact": artifact})
    prompt = f"""Independently recompute the computed quantities of a deterministic API atom from its recorded inputs, and compare with the recorded output artifacts.

ATOM: {a.atom}

=== contract.yaml ===
{contract}

=== SERVICE.md ===
{service_md}

=== RECORDED CASES (input + live artifact) ===
{json.dumps(cases, indent=2)}

For every quantity or check that SERVICE.md marks as computed (and any
headline computed value in the artifacts):
- recompute it from the case input by hand, showing the arithmetic and
  the exact rounding/serialization rule you applied;
- state the artifact's value and mark MATCH or MISMATCH;
- for the violations case, confirm the checks that fail are exactly
  the ones the planted wrong values should fail.
End your answer with exactly one line:
AGREEMENT: full
or
AGREEMENT: partial — <what disagrees and the values on both sides>"""
    with open(os.path.join(work, "deepseek-prompt.txt"), "w") as f:
        f.write(prompt)
    r = subprocess.run([sys.executable, DS, "--system", SYSTEM,
                        "--temperature", "0.1", "--max-tokens", "6000",
                        "--timeout", "240"],
                       input=prompt, capture_output=True, text=True,
                       timeout=300)
    with open(os.path.join(work, "deepseek-raw.txt"), "w") as f:
        f.write(r.stdout or "")
        if r.stderr:
            f.write("\n--- STDERR ---\n" + r.stderr)
    if r.returncode != 0:
        raise SystemExit(
            f"deepseek recompute failed rc={r.returncode}: {(r.stderr or '')[:400]}")
    tail = [ln for ln in (r.stdout or "").splitlines()
            if ln.strip().startswith("AGREEMENT")]
    print(json.dumps({"atom": a.atom, "agreement": tail[-1] if tail else None}))


if __name__ == "__main__":
    main()
