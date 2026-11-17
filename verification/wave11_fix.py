"""Wave 11 design-time correction driver: takes Gemini's raw design
(cases-raw-gemini.json), verifies the full-pass input genuinely passes
against the Python oracle, rebuilds the violations case as the full-pass
manifest carrying exactly the coordinator-specified planted violations,
writes the corrected cases.json, and validates it (report ->
validation-raw.json for the RAW file + stdout summary for the final).
Also writes the case-design checklist note for the TEST-REPORT."""
import copy, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validate_cases, wave11_common as W

PLANTS = {
  "localization-readiness-review": {
    "mutate": [("externalization.hardcoded_ui_strings_present", True),
               ("locales[1].direction", "sideways"),
               ("locales[1].format_tests_passed", False)],
    "failing": ["no_hardcoded_ui_strings", "every_locale_direction_valid",
                "every_locale_has_format_tests_passed"]},
  "long-form-authoring-pipeline": {
    "mutate": [("units[1].has_single_point", False),
               ("units[1].point_or_outcome", ""),
               ("review_passes[3].pass_type", "structure"),
               ("review_passes[3].recorded", False)],
    "failing": ["every_unit_has_single_point",
                "every_unit_point_or_outcome_declared",
                "all_required_review_pass_types_present",
                "every_review_pass_recorded"]},
  "mcp-server-design-and-review": {
    "mutate": [("tool_design.god_tools_present", True),
               ("tools[1].operation", "execute"),
               ("tools[1].has_typed_schema", False),
               ("tools[2].name", "fetch_record"),
               ("tools[2].has_negative_test", False)],
    "failing": ["no_god_tools", "every_tool_operation_valid",
                "every_tool_has_typed_schema", "no_tool_name_duplicated",
                "every_tool_has_negative_test"]},
  "meaning-first-translation-with-tone-note": {
    "mutate": [("segments[1].has_translation", False),
               ("segments[1].meaning_preserved", False),
               ("carryover_items[1].kind", "currency"),
               ("carryover_items[1].matches_original_exactly", False),
               ("red_lines.illegible_text_guessed_present", True)],
    "failing": ["every_segment_has_translation",
                "every_segment_meaning_preserved",
                "every_carryover_kind_valid",
                "every_carryover_item_matches_exactly",
                "no_illegible_text_guessed"]},
  "meeting-decisions-and-actions-extract": {
    "mutate": [("decisions[1].source_anchor", ""),
               ("decisions[1].faithful_to_source", False),
               ("actions[0].owner", ""),
               ("actions[0].due_date", "")],
    "failing": ["every_decision_has_source_anchor",
                "every_decision_faithful_to_source",
                "every_action_has_named_owner",
                "every_action_has_due_date"]},
  "ml-project-framing-review": {
    "mutate": [("metric.accuracy_for_its_own_sake_present", True),
               ("metrics[1].tied_to_decision", False),
               ("metrics[1].decision_action", ""),
               ("metrics[1].name", "precision")],
    "failing": ["no_accuracy_for_its_own_sake",
                "every_metric_tied_to_decision",
                "every_metric_names_decision_action",
                "no_metric_name_duplicated"]},
  "multiplatform-core-design": {
    "mutate": [("surfaces[0].kind", "watch"),
               ("surfaces[0].consumes_core_contract", False),
               ("surfaces[0].core_logic_reimplemented", True),
               ("packaging.docker_used", True)],
    "failing": ["every_surface_kind_valid",
                "every_surface_consumes_core_contract",
                "no_surface_reimplements_core_logic", "no_docker"]},
}

SPARSE_INPUTS = {
  "localization-readiness-review": {"product": "sketchy-app"},
  "long-form-authoring-pipeline": {"work": "Untitled Draft"},
  "mcp-server-design-and-review": {"server": "sketchy-server"},
  "meaning-first-translation-with-tone-note": {"document": "letter-42"},
  "meeting-decisions-and-actions-extract": {"meeting": "sync-2026-11-10"},
  "ml-project-framing-review": {"project": "churn-pilot"},
  "multiplatform-core-design": {"project": "fieldnotes"},
}

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

IDENTITY = {
  "localization-readiness-review": "product",
  "long-form-authoring-pipeline": "work",
  "mcp-server-design-and-review": "server",
  "meaning-first-translation-with-tone-note": "document",
  "meeting-decisions-and-actions-extract": "meeting",
  "ml-project-framing-review": "project",
  "multiplatform-core-design": "project",
}

def spot_checks(atom, oracle_out):
    """Structured computed_spot_checks from the oracle output: every
    computed field (counts, row-name lists, coverages, computed_status),
    excluding identity/envelope fields. The R2 correction of record:
    values computed per SERVICE.md and confirmed against the oracle."""
    skip = {"service", "atom_version", "verdict", "sections", "checks",
            "summary", "stamp", IDENTITY[atom]}
    return {k: v for k, v in oracle_out.items() if k not in skip}

def main(atom):
    w = W.work(atom)
    raw = W.load_json(os.path.join(w, "cases-raw-gemini.json"))
    raw_report = validate_cases.validate(atom, raw)
    raw_report["cases_file"] = f"verification/work/{atom}/cases-raw-gemini.json"
    with open(os.path.join(w, "validation-raw.json"), "w") as f:
        json.dump(raw_report, f, indent=2)
    by_kind = {c["kind"]: c for c in raw["cases"]}
    fp_in = by_kind["full-pass"]["input"]
    # genuine-validity gate: full-pass must pass the oracle completely
    mod = validate_cases.load_oracle(atom)
    out = mod.evaluate(fp_in)
    fails = [c["check"] for c in out["checks"] if c["status"] == "fail"]
    missing = [c["check"] for c in out["checks"] if c["status"] == "missing"]
    assert not fails and not missing, f"full-pass not genuinely valid: fails={fails} missing={missing}"
    plant = PLANTS[atom]
    v_in = copy.deepcopy(fp_in)
    for path, value in plant["mutate"]:
        set_path(v_in, path, value)
    v_out = mod.evaluate(v_in)
    v_fails = sorted(c["check"] for c in v_out["checks"] if c["status"] == "fail")
    assert v_fails == sorted(plant["failing"]), f"planted set {v_fails} != designed {sorted(plant['failing'])}"
    v_missing = [c["check"] for c in v_out["checks"] if c["status"] == "missing"]
    assert not v_missing, f"violations case has missing checks: {v_missing}"
    fp_case = by_kind["full-pass"]
    fp_expect = fp_case.setdefault("expect", {})
    raw_sc = fp_expect.get("computed_spot_checks")
    fp_expect["computed_spot_checks"] = spot_checks(atom, out)
    cases = {"cases": [
        fp_case,
        {"id": "violations", "kind": "violations", "input": v_in,
         "expect": {"outcome": v_out["verdict"], "http": 200,
                    "failing_checks": sorted(plant["failing"]),
                    "computed_spot_checks": spot_checks(atom, v_out),
                    "notes": (by_kind["violations"].get("expect") or {}).get("notes", "")}},
        {"id": "sparse", "kind": "sparse", "input": SPARSE_INPUTS[atom],
         "expect": {"outcome": "INSUFFICIENT_EVIDENCE", "http": 200,
                    "failing_checks": [],
                    "notes": "Only the identity field present; every check missing."}},
        by_kind["malformed"],
    ]}
    with open(os.path.join(w, "cases.json"), "w") as f:
        json.dump(cases, f, indent=2)
    report = validate_cases.validate(atom, cases)
    print(json.dumps({"atom": atom, "raw_rejections": len(raw_report["rejections"]),
                      "raw_by_rule": _by_rule(raw_report["rejections"]),
                      "full_pass_spot_checks_in_raw": raw_sc is not None,
                      "final_ok": report["ok"],
                      "final_rejections": report["rejections"]}, indent=2))

def _by_rule(rejs):
    out = {}
    for r in rejs:
        key = r["rule"].split(" ")[0]
        out[key] = out.get(key, 0) + 1
    return out

if __name__ == "__main__":
    main(sys.argv[1])
