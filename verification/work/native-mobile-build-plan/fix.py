"""Wave 12 design-time correction driver for native-mobile-build-plan.

Modeled on verification/wave11_fix.py: takes Gemini's raw design
(cases-raw-gemini.json), validates it (report -> validation-raw.json),
verifies the full-pass input genuinely passes against the Python
oracle, rebuilds the violations case as the full-pass manifest
carrying exactly the planted violations below, injects structured
computed_spot_checks from the oracle outputs, sets the sparse case
to an identity-only manifest, keeps the malformed case (exactly one
documented type violation), writes the corrected cases.json, validates
it, and records every design-time correction in corrections.json.
"""
import copy, json, os, sys
sys.path.insert(0, os.path.expanduser("~/workspace/atom-services/verification"))
import validate_cases, wave11_common as W

ATOM = "native-mobile-build-plan"
IDENTITY = "app"

# Planted violations: (input path, planted value) on a deep copy of the
# corrected full-pass manifest. Each maps 1:1 to one check failure.
MUTATE = [
    ("constraints.screen_sizes_considered", False),
    ("offline.local_store_is_truth_for_user_data", False),
    ("permissions[0].feature_needing_it", ""),
    ("red_lines.secrets_in_app_bundle_present", True),
]
FAILING = ["screen_sizes_considered",
           "local_store_is_truth_for_user_data",
           "every_permission_names_feature_needing_it",
           "no_secrets_in_app_bundle"]

SPARSE_INPUT = {"app": "Minimal-Plan"}


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
    """Structured computed_spot_checks from the oracle output: every
    computed field, excluding envelope/identity fields."""
    skip = {"service", "atom_version", "verdict", "sections", "checks",
            "summary", "stamp", IDENTITY}
    return {k: v for k, v in oracle_out.items() if k not in skip}


def main():
    w = W.work(ATOM)
    raw = W.load_json(os.path.join(w, "cases-raw-gemini.json"))
    raw_report = validate_cases.validate(ATOM, raw)
    raw_report["cases_file"] = f"verification/work/{ATOM}/cases-raw-gemini.json"
    with open(os.path.join(w, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)

    by_kind = {c["kind"]: c for c in raw["cases"]}
    fp_in = by_kind["full-pass"]["input"]

    # Genuine-validity gate: the oracle's evaluate() on Gemini's
    # full-pass input must return 0 fail and 0 missing checks.
    mod = validate_cases.load_oracle(ATOM)
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, \
        f"full-pass not genuinely valid: fails={fails} missing={missing}"

    # Violations: deep copy of the full-pass input + planted mutations;
    # expect set to EXACTLY the oracle's failing set and verdict.
    v_in = copy.deepcopy(fp_in)
    for path, value in MUTATE:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == sorted(FAILING), \
        f"planted set {v_fails} != designed {sorted(FAILING)}"
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"

    fp_case = by_kind["full-pass"]
    fp_case.setdefault("expect", {})["computed_spot_checks"] = spot_checks(out)

    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": v_fails,
                    "computed_spot_checks": spot_checks(v_out),
                    "notes": ("Full-pass manifest with four planted "
                              "violations: constraints.screen_sizes_considered "
                              "false, offline.local_store_is_truth_for_user_data "
                              "false, permissions[0].feature_needing_it empty, "
                              "red_lines.secrets_in_app_bundle_present true.")}},
        {"id": "sparse", "kind": "sparse", "input": SPARSE_INPUT,
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        by_kind["malformed"],
    ]}
    with open(os.path.join(w, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)

    # Corrections record: validator rejections verbatim + extra fixes.
    corrections = [{"class": r["rule"], "detail": r["detail"]}
                   for r in raw_report["rejections"]]
    corrections.append({
        "class": "plant-adaptation",
        "detail": ("Violations case rebuilt as a deep copy of the "
                   "genuinely-valid full-pass manifest carrying exactly "
                   "four planted mutations chosen from the check semantics "
                   "in SERVICE.md: constraints.screen_sizes_considered=false "
                   "(fails screen_sizes_considered), "
                   "offline.local_store_is_truth_for_user_data=false "
                   "(fails local_store_is_truth_for_user_data), "
                   "permissions[0].feature_needing_it=\"\" (fails "
                   "every_permission_names_feature_needing_it), "
                   "red_lines.secrets_in_app_bundle_present=true (fails "
                   "no_secrets_in_app_bundle); expect.failing_checks set to "
                   "exactly the oracle's failing set (sorted) and "
                   "expect.outcome to the oracle's verdict; no missing "
                   "checks asserted.")})
    with open(os.path.join(w, "corrections.json"), "w") as f:
        json.dump(corrections, f, indent=2)

    report = validate_cases.validate(ATOM, cases)
    by_rule = {}
    for r in raw_report["rejections"]:
        key = r["rule"].split(" ")[0]
        by_rule[key] = by_rule.get(key, 0) + 1
    print(json.dumps({"atom": ATOM,
                      "raw_rejections": len(raw_report["rejections"]),
                      "raw_by_rule": by_rule,
                      "corrections": len(corrections),
                      "violations_failing": v_fails,
                      "violations_outcome": v_out["verdict"],
                      "full_pass_spot_checks": spot_checks(out),
                      "violations_spot_checks": spot_checks(v_out),
                      "final_ok": report["ok"],
                      "final_rejections": report["rejections"]}, indent=2))


if __name__ == "__main__":
    main()
