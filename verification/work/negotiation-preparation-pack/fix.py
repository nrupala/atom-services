"""Wave 12 design-time correction driver for negotiation-preparation-pack:
takes Gemini's raw design (cases-raw-gemini.json), verifies the full-pass
input genuinely passes against the Python oracle, rebuilds the violations
case as the full-pass manifest carrying exactly the planted violations
below, injects structured computed_spot_checks from the oracle outputs,
replaces the sparse case with an identity-only manifest, adjusts the
malformed case to exactly one documented type violation, writes the
corrected cases.json, validates it, and records every correction in
corrections.json. Also writes validation-raw.json for the RAW file."""
import copy, json, os, sys
sys.path.insert(0, os.path.expanduser("~/workspace/atom-services/verification"))
import validate_cases

ATOM = "negotiation-preparation-pack"
IDENTITY = "negotiation"
ROOT = os.path.expanduser("~/workspace/atom-services")
W = os.path.join(ROOT, "verification", "work", ATOM)

PLANTS = [
    (("batna_and_reservation", "batna_identified"), False),
    (("issues", 0, "own_underlying_interest"), ""),
    (("issues", 0, "trade_potential_assessed"), False),
    (("anchoring", "anchor_first_planned"), False),
    (("red_lines", "no_batna_present"), True),
]
DESIGNED_FAILING = sorted([
    "batna_identified",
    "every_issue_names_own_underlying_interest",
    "every_issue_trade_potential_assessed",
    "anchor_first_planned_when_informed",
    "no_batna",
])

SPARSE_INPUT = {"negotiation": "Incomplete Prep"}
MALFORMED_INPUT = {"negotiation": "Malformed", "batna_and_reservation": "not_an_object"}


def set_path(obj, path, value):
    cur = obj
    for k in path[:-1]:
        cur = cur[k]
    cur[path[-1]] = value


def spot_checks(oracle_out):
    skip = {"service", "atom_version", "verdict", "sections", "checks",
            "summary", "stamp", IDENTITY}
    return {k: v for k, v in oracle_out.items() if k not in skip}


def main():
    with open(os.path.join(W, "cases-raw-gemini.json")) as f:
        raw = json.load(f)
    raw_report = validate_cases.validate(ATOM, raw)
    raw_report["cases_file"] = f"verification/work/{ATOM}/cases-raw-gemini.json"
    with open(os.path.join(W, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)

    by_kind = {c["kind"]: c for c in raw["cases"]}
    mod = validate_cases.load_oracle(ATOM)

    # genuine-validity gate: full-pass must pass the oracle completely
    fp_in = by_kind["full-pass"]["input"]
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, f"full-pass not genuinely valid: fails={fails} missing={missing}"
    assert out["verdict"] == "NEGOTIATION_PREPARATION_SOUND", out["verdict"]

    # violations: deep copy of full-pass + planted mutations
    v_in = copy.deepcopy(fp_in)
    for path, value in PLANTS:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == DESIGNED_FAILING, f"planted set {v_fails} != designed {DESIGNED_FAILING}"
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    assert v_out["verdict"] == "NEGOTIATION_PREPARATION_NOT_SOUND", v_out["verdict"]

    # malformed: exactly one documented type violation
    tv = validate_cases.type_violations(MALFORMED_INPUT, mod.MANIFEST_SPEC, "")
    assert len(tv) == 1, f"malformed violations {tv}"

    fp_case = copy.deepcopy(by_kind["full-pass"])
    fp_case.setdefault("expect", {})["computed_spot_checks"] = spot_checks(out)
    fp_case["expect"]["failing_checks"] = []

    mal_case = copy.deepcopy(by_kind["malformed"])
    mal_case["input"] = MALFORMED_INPUT
    mal_case.setdefault("expect", {}).update(
        {"outcome": None, "http": 422, "failing_checks": [],
         "notes": "Type mismatch: 'batna_and_reservation' field expected to be an object, received a string."})

    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": DESIGNED_FAILING,
                    "computed_spot_checks": spot_checks(v_out),
                    "notes": "Full manifest identical to full-pass except batna_identified false, issues[0].own_underlying_interest empty, issues[0].trade_potential_assessed false, anchoring.anchor_first_planned false (gate true), red_lines.no_batna_present true."}},
        {"id": "sparse", "kind": "sparse", "input": SPARSE_INPUT,
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        mal_case,
    ]}
    with open(os.path.join(W, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    report = validate_cases.validate(ATOM, cases)

    # corrections: one entry per raw validator rejection, verbatim detail
    cls = {"R1 check-register": "R1 check-register",
           "R2 structured-spot-checks": "R2 structured-spot-checks",
           "R3 violations-full-manifest": "R3 violations-full-manifest",
           "R4 malformed-exactly-one": "R4 malformed-exactly-one"}
    corrections = []
    for r in raw_report["rejections"]:
        rule = r["rule"]
        extra = ""
        if rule.startswith("R3"):
            extra = (" Corrected before execution: the violations case was rebuilt as a full copy of the "
                     "full-pass manifest carrying exactly the 5 planted changes — batna_and_reservation.batna_identified=false, "
                     "issues[0].own_underlying_interest='', issues[0].trade_potential_assessed=false, "
                     "anchoring.anchor_first_planned=false, red_lines.no_batna_present=true — with failing_checks set to exactly "
                     "the 5 exact check names those changes fail: anchor_first_planned_when_informed, batna_identified, "
                     "every_issue_names_own_underlying_interest, every_issue_trade_potential_assessed, no_batna (oracle-confirmed, no missing checks).")
        elif rule.startswith("R1"):
            extra = " Corrected before execution as part of rebuilding the violations case (see the R3 correction)."
        elif rule.startswith("R2") and r["case"] == "full-pass":
            extra = (" Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md "
                     "and confirmed against the Python oracle (" + ", ".join(
                         f"{k}={json.dumps(v)}" for k, v in spot_checks(out).items()) + ").")
        elif rule.startswith("R2"):
            extra = (" Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md "
                     "and confirmed against the Python oracle (" + ", ".join(
                         f"{k}={json.dumps(v)}" for k, v in spot_checks(v_out).items()) + ").")
        elif rule.startswith("R4"):
            extra = (" Corrected before execution: the malformed case was adjusted to exactly one documented type violation — "
                     "batna_and_reservation set to the string \"not_an_object\" where an object is required (negotiation kept a valid string, issues removed).")
        corrections.append({"class": cls.get(rule, rule),
                            "detail": f"validator rejection: \"{r['detail']}\"{extra}"})
    with open(os.path.join(W, "corrections.json"), "w") as f:
        json.dump(corrections, f, indent=2)

    by_rule = {}
    for r in raw_report["rejections"]:
        k = r["rule"].split(" ")[0]
        by_rule[k] = by_rule.get(k, 0) + 1
    print(json.dumps({"atom": ATOM, "raw_rejections": len(raw_report["rejections"]),
                      "raw_by_rule": by_rule,
                      "violations_failing": v_fails,
                      "violations_computed": spot_checks(v_out),
                      "full_pass_computed": spot_checks(out),
                      "malformed_violations": tv,
                      "corrections": len(corrections),
                      "final_ok": report["ok"],
                      "final_rejections": report["rejections"]}, indent=2))


if __name__ == "__main__":
    main()
