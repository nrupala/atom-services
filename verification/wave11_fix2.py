"""Wave 11 design-time correction, round 2 (coordinator).

Round 1 (wave11_fix.py) assumed Gemini's full-pass designs would carry
>=2 rows in the computed lists and perfectly nested sections. The raw
Wave 11 designs broke both assumptions (1-row lists; one design with
flat dotted keys; misplaced baseline fields; failing-polarity
sensitive booleans). This driver performs the documented design-time
corrections — the same class prior waves applied by hand:

  REPAIRS to the full-pass input (tester errors, recorded):
   - unflatten flat dotted keys into nested objects (any atom);
   - ml-project-framing-review: move the three baseline fields from
     metric.* to baseline.*; declare the four gated llm fields
     (absent field = missing even when the gate is false);
   - meaning-first-translation-with-tone-note: set the two sensitive
     booleans to their documented passing polarity (true);
   - malformed: reduce to exactly ONE documented type violation
     (repair all but the first violation with a type-correct value).
  PLANTS (adaptive to the designed row counts): the violations case
  is rebuilt as the repaired full-pass manifest carrying exactly the
  designed planted changes; the failing set is asserted against the
  oracle before anything is written.
  Spot checks are injected in structured form from the oracle
  outputs (the R2 correction), as in round 1.

Reads cases-raw-gemini.json (validation-raw.json already on disk is
NOT overwritten). Writes the final cases.json and prints a summary.
"""
import copy, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validate_cases, wave11_common as W
from wave11_fix import set_path, spot_checks, SPARSE_INPUTS

FAILING = {
  "localization-readiness-review":
    ["every_locale_direction_valid", "every_locale_has_format_tests_passed",
     "no_hardcoded_ui_strings"],
  "long-form-authoring-pipeline":
    ["all_required_review_pass_types_present", "every_review_pass_recorded",
     "every_unit_has_single_point", "every_unit_point_or_outcome_declared"],
  "mcp-server-design-and-review":
    ["every_tool_has_negative_test", "every_tool_has_typed_schema",
     "every_tool_operation_valid", "no_god_tools", "no_tool_name_duplicated"],
  "meaning-first-translation-with-tone-note":
    ["every_carryover_item_matches_exactly", "every_carryover_kind_valid",
     "every_segment_has_translation", "every_segment_meaning_preserved",
     "no_illegible_text_guessed"],
  "meeting-decisions-and-actions-extract":
    ["every_action_has_due_date", "every_action_has_named_owner",
     "every_decision_faithful_to_source", "every_decision_has_source_anchor"],
  "ml-project-framing-review":
    ["every_metric_names_decision_action", "every_metric_tied_to_decision",
     "no_accuracy_for_its_own_sake", "no_metric_name_duplicated"],
}

def set_nested(obj, dotted, value):
    parts = dotted.split(".")
    cur = obj
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value

def unflatten(obj):
    if isinstance(obj, list):
        return [unflatten(v) for v in obj]
    if not isinstance(obj, dict):
        return obj
    out = {}
    for k, v in obj.items():
        if "." in k:
            set_nested(out, k, unflatten(v))
        elif k in out and isinstance(out[k], dict) and isinstance(v, dict):
            merged = dict(out[k]); merged.update(unflatten(v)); out[k] = merged
        else:
            out[k] = unflatten(v)
    return out

def repair_full_pass(atom, fp):
    notes = []
    flat = any("." in k for k in fp)
    fp = unflatten(fp)
    if flat:
        notes.append("unflattened flat dotted keys into nested objects")
    if atom == "ml-project-framing-review":
        metric = fp.get("metric") or {}
        moved = [f for f in ("baseline_value_written_down",
                             "baseline_is_rule_or_heuristic_benchmark",
                             "baseline_recorded_before_complex_build")
                 if f in metric]
        if moved:
            base = fp.setdefault("baseline", {})
            for f in moved:
                base[f] = metric.pop(f)
            notes.append("moved baseline fields from metric.* to baseline.*: "
                         + ", ".join(moved))
        llm = fp.setdefault("llm", {})
        gate = llm.get("uses_llm_or_rag")
        added = []
        for f in ("retrieval_quality_prioritized_over_model_size",
                  "golden_set_evaluation_planned",
                  "grounding_citation_and_idk_required",
                  "prompts_versioned_with_changelog"):
            if f not in llm:
                llm[f] = bool(gate)
                added.append(f)
        if added:
            notes.append("declared the gated llm fields (gate "
                         f"uses_llm_or_rag={gate}): " + ", ".join(added))
    if atom == "meaning-first-translation-with-tone-note":
        sens = fp.get("sensitive") or {}
        fixed = [f for f in ("sensitive_category_identified",
                             "certified_translation_flag_raised_when_sensitive")
                 if sens.get(f) is not True]
        for f in fixed:
            sens[f] = True
        if fixed:
            notes.append("set sensitive booleans to documented passing "
                         "polarity (true): " + ", ".join(fixed))
    return fp, notes

def plant(atom, v):
    if atom == "localization-readiness-review":
        v["externalization"]["hardcoded_ui_strings_present"] = True
        v["locales"][0]["direction"] = "sideways"
        v["locales"][0]["format_tests_passed"] = False
    elif atom == "long-form-authoring-pipeline":
        v["units"][0]["has_single_point"] = False
        v["units"][0]["point_or_outcome"] = ""
        v["review_passes"][3]["pass_type"] = "structure"
        v["review_passes"][3]["recorded"] = False
    elif atom == "mcp-server-design-and-review":
        v["tool_design"]["god_tools_present"] = True
        v["tools"][0]["operation"] = "execute"
        v["tools"][0]["has_typed_schema"] = False
        if len(v["tools"]) >= 2:
            v["tools"][1]["name"] = v["tools"][0]["name"]
            v["tools"][1]["has_negative_test"] = False
        else:
            dup = copy.deepcopy(v["tools"][0])
            dup["operation"] = "read"
            dup["has_typed_schema"] = True
            dup["has_negative_test"] = False
            v["tools"].append(dup)
    elif atom == "meaning-first-translation-with-tone-note":
        v["segments"][0]["has_translation"] = False
        v["segments"][0]["meaning_preserved"] = False
        v["carryover_items"][0]["kind"] = "currency"
        v["carryover_items"][0]["matches_original_exactly"] = False
        v["red_lines"]["illegible_text_guessed_present"] = True
    elif atom == "meeting-decisions-and-actions-extract":
        v["decisions"][0]["source_anchor"] = ""
        v["decisions"][0]["faithful_to_source"] = False
        v["actions"][0]["owner"] = ""
        v["actions"][0]["due_date"] = ""
    elif atom == "ml-project-framing-review":
        v["metric"]["accuracy_for_its_own_sake_present"] = True
        if len(v["metrics"]) >= 2:
            v["metrics"][1]["tied_to_decision"] = False
            v["metrics"][1]["decision_action"] = ""
            v["metrics"][1]["name"] = v["metrics"][0]["name"]
        else:
            dup = copy.deepcopy(v["metrics"][0])
            dup["tied_to_decision"] = False
            dup["decision_action"] = ""
            v["metrics"].append(dup)
    return v

def type_correct(expected):
    # type_violations reports the expected type as a label string.
    if expected == "string": return "repaired"
    if expected == "boolean": return True
    if expected == "number": return 1
    if expected == "object": return {}
    if expected == "list": return []
    if expected == "any": return "repaired"
    return None

def repair_malformed(atom, mal_in, spec):
    tv = validate_cases.type_violations(mal_in, spec, "")
    notes = []
    if len(tv) > 1:
        keep = tv[0]
        for path, expected in tv[1:]:
            set_nested(mal_in, path, type_correct(expected))
            notes.append(f"repaired extra type violation at {path} "
                         f"(must be a {expected}); kept {keep[0]}")
        tv = validate_cases.type_violations(mal_in, spec, "")
        assert len(tv) == 1, f"malformed repair failed: {tv}"
    return mal_in, notes

def main(atom):
    w = W.work(atom)
    raw = W.load_json(os.path.join(w, "cases-raw-gemini.json"))
    raw_report = W.load_json(os.path.join(w, "validation-raw.json"))
    by_kind = {c["kind"]: c for c in raw["cases"]}
    mod = validate_cases.load_oracle(atom)
    fp_in, repair_notes = repair_full_pass(atom, copy.deepcopy(by_kind["full-pass"]["input"]))
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, f"full-pass still not valid: fails={fails} missing={missing}"
    v_in = plant(atom, copy.deepcopy(fp_in))
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == sorted(FAILING[atom]), f"planted {v_fails} != designed {sorted(FAILING[atom])}"
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    mal_in, mal_notes = repair_malformed(atom, copy.deepcopy(by_kind["malformed"]["input"]), mod.MANIFEST_SPEC)
    fp_case = copy.deepcopy(by_kind["full-pass"])
    fp_case["input"] = fp_in
    fp_case.setdefault("expect", {})["computed_spot_checks"] = spot_checks(atom, out)
    mal_case = copy.deepcopy(by_kind["malformed"])
    mal_case["input"] = mal_in
    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": sorted(FAILING[atom]),
                    "computed_spot_checks": spot_checks(atom, v_out),
                    "notes": (by_kind["violations"].get("expect") or {}).get("notes", "")}},
        {"id": "sparse", "kind": "sparse", "input": SPARSE_INPUTS[atom],
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        mal_case,
    ]}
    with open(os.path.join(w, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    report = validate_cases.validate(atom, cases)
    print(json.dumps({"atom": atom,
                      "raw_rejections": len(raw_report["rejections"]),
                      "repairs": repair_notes, "malformed_repairs": mal_notes,
                      "final_ok": report["ok"],
                      "final_rejections": report["rejections"]}, indent=2))

if __name__ == "__main__":
    main(sys.argv[1])
