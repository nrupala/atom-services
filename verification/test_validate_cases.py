#!/usr/bin/env python3
"""Tests for validate_cases.py — each of the four rules is proven to
fire on a bad case file and to pass a good one. Also regression-tests
a recorded, corrected Wave 6 battery (cpp-engineering-review) and the
harness's refusal to execute a rejected file.

Run: python3 test_validate_cases.py   (exit 0 = all green)"""
import copy, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import validate_cases as vc

ATOM = "decision-process-design"
FAILURES = []


def check(label, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + label + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        FAILURES.append(label)


def full_manifest():
    return {
        "decision": "Adopt the new deployment pipeline",
        "framing": {
            "decision_named": True,
            "decision_maker_identified": True,
            "objective_stated": True,
            "decision_maker_defines_what_matters": True,
            "analyst_informs_not_decides": True,
            "analysis_makes_the_call_present": False,
        },
        "options": [
            {"name": "adopt", "viable": True},
            {"name": "defer", "viable": True},
        ],
        "criteria": [
            {"name": "rollback_safety", "set_before_data": True,
             "threshold_declared": True},
        ],
        "precommitment": {
            "default_action": "defer",
            "change_my_mind_threshold_stated": True,
            "criteria_and_thresholds_set_before_data_seen": True,
            "data_seen_before_criteria_set_present": False,
        },
        "loss": {
            "loss_function_framed": True,
            "cost_of_being_wrong_in_each_direction_stated": True,
            "cost_of_false_action": 40,
            "cost_of_false_inaction": 20,
            "asymmetric_costs_declared": True,
            "threshold_adjusted_for_asymmetric_costs": True,
        },
        "rigor": {
            "stakes_assessed": True,
            "reversibility_assessed": True,
            "effort_matched_to_stakes_and_reversibility": True,
            "data_gathering_worth_assessed": True,
            "irreversible_declared": False,
            "slowed_down_and_more_evidence_for_irreversible": False,
            "reversible_declared": True,
            "default_to_action_for_reversible": True,
        },
        "evidence": {
            "exploratory_and_confirmatory_distinguished": True,
            "confirmatory_analysis_used": False,
            "hypothesis_preregistered": False,
            "conclusion_drawn_from_inspiring_data_present": False,
            "evidence_has_power_to_change_decision": True,
            "data_is_decoration_present": False,
            "acted_per_preset_criteria_after_gathering": True,
        },
        "review": {
            "decision_quality_reviewed_separately_from_outcome": True,
            "decision_judged_by_process_and_information_at_time": True,
            "outcome_used_alone_to_judge_present": False,
        },
    }


def good_cases():
    viol = full_manifest()
    viol["framing"]["decision_named"] = False
    mal = full_manifest()
    mal["decision"] = 42  # exactly one type violation (string field)
    return {"cases": [
        {"id": "full-pass", "kind": "full-pass", "input": full_manifest(),
         "expect": {"outcome": "DECISION_PROCESS_SOUND", "http": 200,
                    "failing_checks": [],
                    "computed_spot_checks": {
                        "options_count": 2, "criteria_count": 1,
                        "loss_cost_ratio": "2.0000",
                        "computed_status":
                            "within_stated_limits_on_declared_evidence"},
                    "notes": "all declared true, anti-patterns false"}},
        {"id": "violations", "kind": "violations", "input": viol,
         "expect": {"outcome": "DECISION_PROCESS_NOT_SOUND", "http": 200,
                    "failing_checks": ["decision_named"],
                    "computed_spot_checks": {
                        "computed_status":
                            "outside_stated_limits_on_declared_evidence"},
                    "notes": "decision_named planted false"}},
        {"id": "sparse", "kind": "sparse",
         "input": {"decision": "Adopt the new deployment pipeline"},
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [], "notes": "one field only"}},
        {"id": "malformed", "kind": "malformed", "input": mal,
         "expect": {"outcome": None, "http": 422, "failing_checks": [],
                    "notes": "decision as a number"}},
    ]}


def rules_hit(report):
    return sorted({r["rule"].split()[0] for r in report["rejections"]})


def main():
    good = good_cases()
    rep = vc.validate(ATOM, copy.deepcopy(good))
    check("good case file accepted", rep["ok"], json.dumps(rep["rejections"]))
    check("register extracted (36 checks)", rep["register_size"] == 36,
          str(rep["register_size"]))

    # R1: a section name is not a check name.
    bad = copy.deepcopy(good)
    bad["cases"][1]["expect"]["failing_checks"] = ["framing_and_roles"]
    rep = vc.validate(ATOM, bad)
    check("R1 fires on section name in failing_checks",
          not rep["ok"] and rules_hit(rep) == ["R1"], json.dumps(rep["rejections"]))

    # R2: computed quantities only in prose.
    bad = copy.deepcopy(good)
    del bad["cases"][0]["expect"]["computed_spot_checks"]
    bad["cases"][0]["expect"]["notes"] = "options_count is 2 and ratio 2.0000"
    rep = vc.validate(ATOM, bad)
    check("R2 fires on prose-only computed quantities",
          not rep["ok"] and rules_hit(rep) == ["R2"], json.dumps(rep["rejections"]))

    # R3: sparse violations input.
    bad = copy.deepcopy(good)
    bad["cases"][1]["input"] = {"decision": "x",
                                "framing": {"decision_named": False}}
    rep = vc.validate(ATOM, bad)
    check("R3 fires on sparse violations input",
          not rep["ok"] and rules_hit(rep) == ["R3"], json.dumps(rep["rejections"]))

    # R4a: two type violations.
    bad = copy.deepcopy(good)
    bad["cases"][3]["input"]["framing"] = "not-an-object"
    rep = vc.validate(ATOM, bad)
    check("R4 fires on two type violations",
          not rep["ok"] and rules_hit(rep) == ["R4"], json.dumps(rep["rejections"]))

    # R4b: violation only on an undocumented field (zero documented).
    bad = copy.deepcopy(good)
    bad["cases"][3]["input"] = full_manifest()
    bad["cases"][3]["input"]["undocumented_field"] = {"anything": 1}
    rep = vc.validate(ATOM, bad)
    check("R4 fires on zero documented type violations",
          not rep["ok"] and rules_hit(rep) == ["R4"], json.dumps(rep["rejections"]))

    # R4c: a nested list-entry violation counts as the one violation.
    ok_nested = copy.deepcopy(good)
    ok_nested["cases"][3]["input"] = full_manifest()
    ok_nested["cases"][3]["input"]["options"][0]["viable"] = "yes"
    rep = vc.validate(ATOM, ok_nested)
    check("single nested violation accepted", rep["ok"],
          json.dumps(rep["rejections"]))

    # Regression: the recorded, corrected Wave 6 battery passes.
    rec = json.load(open(os.path.join(
        HERE, "work", "cpp-engineering-review", "cases.json")))
    rep = vc.validate("cpp-engineering-review", rec)
    check("recorded Wave 6 cpp battery accepted", rep["ok"],
          json.dumps(rep["rejections"]))

    # Harness refusal: a rejected file must not execute.
    with tempfile.TemporaryDirectory() as td:
        badf = os.path.join(td, "cases.json")
        bad = copy.deepcopy(good)
        bad["cases"][1]["expect"]["failing_checks"] = ["framing_and_roles"]
        json.dump(bad, open(badf, "w"))
        out = os.path.join(td, "evidence.json")
        r = subprocess.run([sys.executable, os.path.join(HERE, "harness.py"),
                            "run", "--atom", ATOM, "--cases", badf,
                            "--out", out],
                           capture_output=True, text=True, timeout=120)
        check("harness refuses a rejected case file",
              r.returncode != 0 and not os.path.exists(out)
              and os.path.exists(os.path.join(td, "validation.json")),
              f"rc={r.returncode} stdout={r.stdout[:200]}")

    print("FAILURES:", FAILURES if FAILURES else "none")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    sys.exit(main())
