"""Wave 12 design-time correction driver for observability-and-runbook-design.
Modeled on verification/wave11_fix.py: takes Gemini's raw design
(cases-raw-gemini.json), verifies the full-pass input genuinely passes
against the Python oracle, rebuilds the violations case as the full-pass
manifest carrying exactly the planted violations chosen from SERVICE.md
check semantics, injects structured computed_spot_checks from oracle
outputs, normalises sparse to identity-only, fixes malformed to exactly
one documented type violation, writes the corrected cases.json, validates
it, and records every design-time correction in corrections.json."""
import copy, json, os, sys
sys.path.insert(0, os.path.expanduser("~/workspace/atom-services/verification"))
import validate_cases

ATOM = "observability-and-runbook-design"
IDENTITY = "service_name"
WORK = os.path.dirname(os.path.abspath(__file__))

# Planted violations chosen from the check semantics in SERVICE.md:
# one plain signal failure, three computed alert-row failures, two
# computed failure-mode-row failures, one incident failure, one red line.
PLANT_MUTATIONS = [
    ("signals.metrics_cover_errors", False),
    ("alerts[0].owner", ""),
    ("alerts[0].runbook_linked", False),
    ("alerts[0].symptom_based", False),
    ("failure_modes[0].check_steps_present", False),
    ("failure_modes[0].recovery_verification_present", False),
    ("incident.blameless_postmortem_required", False),
    ("red_lines.unowned_alerts_present", True),
]
PLANT_EXPECTED_FAILING = [
    "metrics_cover_errors",
    "every_alert_has_owner",
    "every_alert_links_runbook",
    "every_alert_is_symptom_based",
    "every_runbook_has_check_steps",
    "every_runbook_has_recovery_verification",
    "blameless_postmortem_required",
    "no_unowned_alerts",
]

SPARSE_INPUT = {"service_name": "minimal-service"}


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


def rule_class(rule):
    if rule.startswith("R1"):
        return "R1 check-register"
    if rule.startswith("R2"):
        return "R2 structured-spot-checks"
    if rule.startswith("R3"):
        return "R3 violations-full-manifest"
    if rule.startswith("R4"):
        return "R4 malformed-exactly-one"
    return rule


def main():
    with open(os.path.join(WORK, "cases-raw-gemini.json")) as f:
        raw = json.load(f)
    raw_report = validate_cases.validate(ATOM, raw)
    raw_report["cases_file"] = "verification/work/observability-and-runbook-design/cases-raw-gemini.json"
    with open(os.path.join(WORK, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)

    corrections = []
    for r in raw_report["rejections"]:
        corrections.append({
            "class": rule_class(r["rule"]),
            "detail": f"[{r['case']}] validator rejection verbatim: \"{r['detail']}\"",
        })

    by_kind = {c["kind"]: c for c in raw["cases"]}
    mod = validate_cases.load_oracle(ATOM)

    # Genuine-validity gate: oracle on Gemini's full-pass input must
    # return 0 fail and 0 missing. (Verified: it does — no fix needed.)
    fp_in = copy.deepcopy(by_kind["full-pass"]["input"])
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, (
        f"full-pass not genuinely valid: fails={fails} missing={missing}")

    # Violations: deep copy of corrected full-pass + planted mutations.
    v_in = copy.deepcopy(fp_in)
    for path, value in PLANT_MUTATIONS:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == sorted(PLANT_EXPECTED_FAILING), (
        f"planted set {v_fails} != designed {sorted(PLANT_EXPECTED_FAILING)}")
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    corrections.append({
        "class": "plant-adaptation",
        "detail": (
            "Violations case rebuilt as a deep copy of the corrected "
            "full-pass manifest plus 8 planted mutations chosen from "
            "SERVICE.md check semantics: signals.metrics_cover_errors=false, "
            "alerts[0].owner='', alerts[0].runbook_linked=false, "
            "alerts[0].symptom_based=false, "
            "failure_modes[0].check_steps_present=false, "
            "failure_modes[0].recovery_verification_present=false, "
            "incident.blameless_postmortem_required=false, "
            "red_lines.unowned_alerts_present=true. Oracle failing set set "
            "as expect.failing_checks exactly (sorted): "
            + ", ".join(v_fails)
            + f"; oracle verdict {v_out['verdict']}; no missing checks."),
    })

    # Full-pass case with structured spot checks injected.
    fp_case = copy.deepcopy(by_kind["full-pass"])
    fp_case.setdefault("expect", {})
    fp_case["expect"]["computed_spot_checks"] = spot_checks(out)
    fp_case["expect"]["outcome"] = out["verdict"]
    fp_case["expect"]["http"] = 200
    fp_case["expect"]["failing_checks"] = []

    viol_case = {
        "id": "violations", "kind": "violations", "input": v_in,
        "expect": {"outcome": v_out["verdict"], "http": 200,
                   "failing_checks": v_fails,
                   "computed_spot_checks": spot_checks(v_out),
                   "notes": (by_kind["violations"].get("expect") or {}).get("notes", "")},
    }

    sparse_case = {
        "id": "sparse", "kind": "sparse", "input": SPARSE_INPUT,
        "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                   "failing_checks": [],
                   "notes": "Only the identity field present; every check missing."},
    }

    # Malformed: keep Gemini's if exactly one documented violation,
    # otherwise adjust to exactly one (drop the second violation:
    # alerts string -> remove the alerts key, keeping signals string).
    mal_in = copy.deepcopy(by_kind["malformed"]["input"])
    tv = validate_cases.type_violations(mal_in, mod.MANIFEST_SPEC, "")
    if len(tv) != 1:
        if "alerts" in mal_in:
            del mal_in["alerts"]
        tv2 = validate_cases.type_violations(mal_in, mod.MANIFEST_SPEC, "")
        assert len(tv2) == 1, f"malformed fix failed: {tv2}"
    mal_case = copy.deepcopy(by_kind["malformed"])
    mal_case["input"] = mal_in

    cases = {"cases": [fp_case, viol_case, sparse_case, mal_case]}
    with open(os.path.join(WORK, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    with open(os.path.join(WORK, "corrections.json"), "w") as f:
        json.dump(corrections, f, indent=2)
    report = validate_cases.validate(ATOM, cases)
    by_rule = {}
    for r in raw_report["rejections"]:
        k = r["rule"].split(" ")[0]
        by_rule[k] = by_rule.get(k, 0) + 1
    print(json.dumps({
        "atom": ATOM,
        "raw_rejections": len(raw_report["rejections"]),
        "raw_by_rule": by_rule,
        "corrections": len(corrections),
        "violations_failing": v_fails,
        "violations_verdict": v_out["verdict"],
        "violations_summary": v_out["summary"],
        "full_pass_summary": out["summary"],
        "malformed_input": mal_in,
        "malformed_tv": validate_cases.type_violations(mal_in, mod.MANIFEST_SPEC, ""),
        "final_ok": report["ok"],
        "final_rejections": report["rejections"],
    }, indent=2))


if __name__ == "__main__":
    main()
