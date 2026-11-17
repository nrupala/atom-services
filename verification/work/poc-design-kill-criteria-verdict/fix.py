"""Wave 12 design-time correction driver for poc-design-kill-criteria-verdict.

Modeled on verification/wave11_fix.py: takes Gemini's raw design
(cases-raw-gemini.json), verifies the full-pass input genuinely passes
against the Python oracle, rebuilds the violations case as the full-pass
manifest carrying exactly the planted mutations chosen from SERVICE.md
check semantics, injects structured computed_spot_checks from the oracle,
replaces sparse with an identity-only manifest, reduces malformed to
exactly one documented type violation, writes the corrected cases.json,
validates it, writes validation-raw.json for the RAW file, and records
every design-time correction in corrections.json.
"""
import copy, json, os, sys
sys.path.insert(0, os.path.expanduser("~/workspace/atom-services/verification"))
import validate_cases

ATOM = "poc-design-kill-criteria-verdict"
IDENTITY = "poc"
ROOT = os.path.expanduser("~/workspace/atom-services")
W = os.path.join(ROOT, "verification", "work", ATOM)

# Planted mutations (chosen from SERVICE.md check semantics):
# - criteria[0].condition_stated False -> every_criterion_condition_stated
# - criteria[1].kind "other" -> every_criterion_kind_is_success_or_kill
#   and at_least_one_kill_criterion_declared (kill count becomes 0)
# - criteria[1].name "C1" (duplicates criteria[0]) -> no_criterion_name_duplicated
# - timebox.end_date "2023-01-01" (equal to start) -> timebox_end_after_start
# - scope_items[0].on_critical_path False -> every_scope_item_on_critical_path
# - red_lines.poc_code_planned_for_direct_production_use_present True
#   -> no_poc_code_planned_for_direct_production_use
PLANT_MUTATIONS = [
    ("criteria[0].condition_stated", False),
    ("criteria[1].kind", "other"),
    ("criteria[1].name", "C1"),
    ("timebox.end_date", "2023-01-01"),
    ("scope_items[0].on_critical_path", False),
    ("red_lines.poc_code_planned_for_direct_production_use_present", True),
]

SPARSE_INPUT = {"poc": "Sparse POC"}

def set_path(obj, path, value):
    # handles dotted paths with [index] segments, like wave11_fix.set_path
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
    raw_report["cases_file"] = f"verification/work/{ATOM}/cases-raw-gemini.json"
    with open(os.path.join(W, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)

    by_kind = {c["kind"]: c for c in raw["cases"]}
    mod = validate_cases.load_oracle(ATOM)

    # Genuine-validity gate
    fp_in = copy.deepcopy(by_kind["full-pass"]["input"])
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, f"full-pass not genuinely valid: fails={fails} missing={missing}"

    # Violations: deep copy of full-pass + planted mutations; oracle-derived expect
    v_in = copy.deepcopy(fp_in)
    for path, value in PLANT_MUTATIONS:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    assert v_fails, "violations case must fail at least one check"
    assert v_out["verdict"] == "POC_DESIGN_NOT_SOUND", v_out["verdict"]

    # Malformed: keep exactly one documented type violation.
    # Raw carries 2 (design must be a object, criteria must be a list);
    # keep the first (design: "not-an-object") and remove the criteria field.
    mal_case = copy.deepcopy(by_kind["malformed"])
    mal_in = copy.deepcopy(mal_case["input"])
    tv_before = validate_cases.type_violations(mal_in, mod.MANIFEST_SPEC, "")
    if len(tv_before) > 1:
        # remove top-level fields carrying extra violations beyond the first
        keep_path = tv_before[0][0]
        for path, _exp in tv_before[1:]:
            top = path.split(".")[0].split("[")[0]
            if top in mal_in:
                del mal_in[top]
    tv_after = validate_cases.type_violations(mal_in, mod.MANIFEST_SPEC, "")
    assert len(tv_after) == 1, f"malformed must carry exactly one violation, got {tv_after}"
    mal_case["input"] = mal_in
    mal_case.setdefault("expect", {})["notes"] = "Exactly one documented type violation: design set to a string where an object is required; triggers 422."

    fp_case = copy.deepcopy(by_kind["full-pass"])
    fp_case.setdefault("expect", {})["computed_spot_checks"] = spot_checks(out)

    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": v_fails,
                    "computed_spot_checks": spot_checks(v_out),
                    "notes": "Planted: criteria[0].condition_stated false; criteria[1].kind 'other' and name duplicated as 'C1'; timebox end_date equal to start_date; scope_items[0].on_critical_path false; red_lines poc_code_planned_for_direct_production_use_present true."}},
        {"id": "sparse", "kind": "sparse", "input": SPARSE_INPUT,
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        mal_case,
    ]}
    with open(os.path.join(W, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    report = validate_cases.validate(ATOM, cases)

    # Corrections: one entry per raw validator rejection, verbatim detail
    # plus the correction applied. No genuine-validity correction was
    # needed (full-pass passed the oracle as designed) and the sparse
    # case as designed was already identity-only, so no extra entries.
    fix_note = {
        "R1 check-register": "Corrected by rebuilding the violations case as a deep copy of the full-pass manifest carrying the planted mutations, with expect.failing_checks set to exactly the oracle's failing set (sorted): " + ", ".join(v_fails) + ".",
        "R2 structured-spot-checks": "Corrected by injecting structured computed_spot_checks computed from the Python oracle outputs (full-pass and violations): every computed field except envelope/identity fields (service, atom_version, verdict, sections, checks, summary, stamp, poc).",
        "R3 violations-full-manifest": "Corrected by rebuilding the violations case as a deep copy of the full-pass manifest (all key paths present, including criteria[].assesses_house_stack_fit); planted mutations change values only, never remove structure.",
        "R4 malformed-exactly-one": "Corrected by removing the extra type violation (criteria as a string) and keeping exactly one documented type violation: design set to a string (\"not-an-object\") where an object is required.",
    }
    corrections = []
    for r in raw_report["rejections"]:
        rule = r["rule"]
        corrections.append({"class": rule, "detail": f"Validator rejection (case {r['case']}): \"{r['detail']}\" {fix_note.get(rule, '')}"})
    with open(os.path.join(W, "corrections.json"), "w") as f:
        json.dump(corrections, f, indent=2)

    def _by_rule(rejs):
        outd = {}
        for r in rejs:
            key = r["rule"].split(" ")[0]
            outd[key] = outd.get(key, 0) + 1
        return outd
    print(json.dumps({"atom": ATOM, "raw_rejections": len(raw_report["rejections"]),
                      "raw_by_rule": _by_rule(raw_report["rejections"]),
                      "violations_failing": v_fails,
                      "violations_verdict": v_out["verdict"],
                      "malformed_tv": tv_after,
                      "corrections": len(corrections),
                      "final_ok": report["ok"],
                      "final_rejections": report["rejections"]}, indent=2))

if __name__ == "__main__":
    main()
