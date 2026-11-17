"""Wave 12 design-time correction driver for personal-web-presence-audit.
Modeled on verification/wave11_fix.py: validates Gemini's raw design,
checks genuine validity against the Python oracle, rebuilds violations
as full-pass + planted mutations, injects structured computed spot
checks, replaces sparse with identity-only, keeps malformed if exactly
one documented type violation, writes final cases.json + corrections.json
and validation-raw.json."""
import copy, json, os, sys
sys.path.insert(0, os.path.expanduser("~/workspace/atom-services/verification"))
import validate_cases

ATOM = "personal-web-presence-audit"
IDENTITY = "person"
W = os.path.dirname(os.path.abspath(__file__))

PLANTS = [
    ("spokes[0].redirects_to_hub_or_purpose_page", False),
    ("profiles[0].links_to_hub", False),
    ("content.claims_verifiable", False),
    ("red_lines.unverifiable_claims_present", True),
]
EXPECTED_FAILING = ["claims_verifiable",
                    "every_profile_links_to_hub",
                    "every_spoke_redirects_to_hub_or_purpose_page",
                    "no_unverifiable_claims"]

def set_path(obj, path, value):
    parts = path.replace("]", "").split("[")
    keys = []
    for p in parts:
        for seg in p.split("."):
            if seg == "":
                continue
            keys.append(int(seg) if seg.isdigit() else seg)
    cur = obj
    for k in keys[:-1]:
        cur = cur[k]
    cur[keys[-1]] = value

def spot_checks(oracle_out):
    skip = {"service", "atom_version", "verdict", "sections", "checks",
            "summary", "stamp", IDENTITY}
    return {k: v for k, v in oracle_out.items() if k not in skip}

def main():
    with open(os.path.join(W, "cases-raw-gemini.json")) as f:
        raw = json.load(f)
    raw_report = validate_cases.validate(ATOM, raw)
    raw_report["cases_file"] = "verification/work/personal-web-presence-audit/cases-raw-gemini.json"
    with open(os.path.join(W, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)

    corrections = []
    rule_class = {"R1 check-register": "R1 check-register",
                  "R2 structured-spot-checks": "R2 structured-spot-checks",
                  "R3 violations-full-manifest": "R3 violations-full-manifest",
                  "R4 malformed-exactly-one": "R4 malformed-exactly-one"}
    for r in raw_report["rejections"]:
        corrections.append({"class": rule_class.get(r["rule"], r["rule"]),
                            "detail": f"validator rejection (case {r['case']}): {r['detail']}"})

    by_kind = {c["kind"]: c for c in raw["cases"]}
    mod = validate_cases.load_oracle(ATOM)

    # Genuine-validity gate
    fp_in = by_kind["full-pass"]["input"]
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, f"full-pass not genuinely valid: fails={fails} missing={missing}"

    # Violations rebuild
    v_in = copy.deepcopy(fp_in)
    for path, value in PLANTS:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == sorted(EXPECTED_FAILING), f"planted set {v_fails} != designed {sorted(EXPECTED_FAILING)}"
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    corrections.append({"class": "plant-adaptation",
                        "detail": "Violations case rebuilt as a deep copy of the (genuinely valid) full-pass input plus planted mutations: spokes[0].redirects_to_hub_or_purpose_page=false, profiles[0].links_to_hub=false, content.claims_verifiable=false, red_lines.unverifiable_claims_present=true; oracle failing set set exactly to " + ", ".join(v_fails) + " with outcome " + v_out["verdict"] + "."})

    # Malformed check: keep if exactly one documented type violation
    tv = validate_cases.type_violations(by_kind["malformed"]["input"], mod.MANIFEST_SPEC, "")
    assert len(tv) == 1, f"malformed carries {tv}, expected exactly one"

    fp_case = by_kind["full-pass"]
    fp_case.setdefault("expect", {})["computed_spot_checks"] = spot_checks(out)

    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": v_fails,
                    "computed_spot_checks": spot_checks(v_out),
                    "notes": (by_kind["violations"].get("expect") or {}).get("notes", "")}},
        {"id": "sparse", "kind": "sparse", "input": {IDENTITY: fp_in.get(IDENTITY, "Jane Doe")},
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        by_kind["malformed"],
    ]}
    with open(os.path.join(W, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    with open(os.path.join(W, "corrections.json"), "w") as f:
        json.dump(corrections, f, indent=2)

    report = validate_cases.validate(ATOM, cases)
    by_rule = {}
    for r in raw_report["rejections"]:
        k = r["rule"].split(" ")[0]
        by_rule[k] = by_rule.get(k, 0) + 1
    print(json.dumps({"atom": ATOM, "raw_rejections": len(raw_report["rejections"]),
                      "raw_by_rule": by_rule, "corrections": len(corrections),
                      "violations_failing": v_fails, "malformed_tv": tv,
                      "final_ok": report["ok"], "final_rejections": report["rejections"]}, indent=2))

if __name__ == "__main__":
    main()
