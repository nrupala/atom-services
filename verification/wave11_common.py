"""Wave 11 coordinator helpers: oracle-derived expectations + mechanical
re-verification of recorded evidence. Imported by the per-atom drivers."""
import json, math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validate_cases

ROOT = os.path.expanduser("~/workspace/atom-services")

def r6(num, den):
    """Round half up to 6dp, formatted with exactly six decimals (atom rule)."""
    if not den:
        return None
    v = num / den
    return f"{math.floor(v * 1000000 + 0.5) / 1000000:.6f}"

def expected_artifact(atom, manifest):
    """The oracle's full output for a manifest = the recorded artifact minus
    the gateway-added stamp (TS cores are differential-proven vs the oracle;
    every prior wave's parity held)."""
    mod = validate_cases.load_oracle(atom)
    return mod.evaluate(manifest)

def strip_stamp(artifact):
    if not isinstance(artifact, dict):
        return artifact
    return {k: v for k, v in artifact.items() if k != "stamp"}

def failing_checks(artifact):
    return sorted(c["check"] for c in artifact.get("checks", []) if c.get("status") == "fail")

def check_counts(artifact):
    cs = artifact.get("checks", [])
    return (sum(1 for c in cs if c.get("status") == "pass"),
            sum(1 for c in cs if c.get("status") == "fail"),
            sum(1 for c in cs if c.get("status") == "missing"))

def load_json(path):
    with open(path) as f:
        return json.load(f)

def work(atom):
    return os.path.join(ROOT, "verification", "work", atom)

def verify_atom(atom):
    """Mechanical re-verification of one atom's recorded evidence.
    Returns (problems, facts)."""
    problems, facts = [], {}
    w = work(atom)
    ev = load_json(os.path.join(w, "evidence.json"))
    cases = load_json(os.path.join(w, "cases.json"))["cases"]
    val = load_json(os.path.join(w, "validation.json"))
    judg = load_json(os.path.join(w, "judgment.json"))
    results_path = os.path.join(ROOT, "verification", "results", f"{atom}.json")
    res = load_json(results_path) if os.path.exists(results_path) else None
    by_kind = {}
    for c in ev["cases"]:
        by_kind[c["kind"]] = c
        exp = next((x for x in cases if x["kind"] == c["kind"]), None)
        if exp is None:
            problems.append(f"{c['kind']}: no matching designed case")
            continue
        if c.get("expect") != exp.get("expect"):
            problems.append(f"{c['kind']}: evidence expect != designed expect")
        if c.get("input") != exp.get("input"):
            problems.append(f"{c['kind']}: evidence input != designed input")
    if not val.get("ok"):
        problems.append("validation.json not ok")
    facts["register_size"] = val.get("register_size")
    for kind in ("full-pass", "violations", "sparse", "malformed"):
        c = by_kind.get(kind)
        if c is None:
            problems.append(f"{kind}: case missing from evidence")
            continue
        ex = c["executions"][0]
        facts[f"{kind}_http"] = ex["status"]
        try:
            art = json.loads(ex["response_text"])
        except Exception:
            art = None
        if kind in ("full-pass", "violations", "sparse"):
            if ex["status"] != 200:
                problems.append(f"{kind}: HTTP {ex['status']} != 200")
            if art is None:
                problems.append(f"{kind}: artifact not JSON")
                continue
            exp_art = expected_artifact(atom, c["input"])
            if strip_stamp(art) != exp_art:
                ka = set(strip_stamp(art)); ke = set(exp_art)
                diff = [k for k in ka | ke if strip_stamp(art).get(k) != exp_art.get(k)]
                problems.append(f"{kind}: artifact != oracle output (keys: {diff})")
            facts[f"{kind}_verdict"] = art.get("verdict") or art.get("status")
            facts[f"{kind}_counts"] = check_counts(art)
            facts[f"{kind}_computed"] = {k: art.get(k) for k in art
                                         if k not in ("service", "atom_version", "checks",
                                                      "sections", "verdict", "status",
                                                      "summary", "stamp")
                                         and not isinstance(art.get(k), (dict,))}
            if kind == "full-pass":
                if c.get("determinism_byte_identical") is not True:
                    problems.append("full-pass: determinism not byte-identical")
                if c.get("parity_structured_equal") is not True:
                    problems.append("full-pass: MCP/REST parity not equal")
                if art.get("stamp") in (None, ""):
                    problems.append("full-pass: stamp missing")
                fails = failing_checks(art)
                if fails:
                    problems.append(f"full-pass: unexpected failing checks {fails}")
            if kind == "violations":
                want = sorted((c.get("expect") or {}).get("failing_checks") or [])
                got = failing_checks(art)
                facts["violations_failing"] = got
                if got != want:
                    problems.append(f"violations: failing set {got} != expected {want}")
            if kind == "sparse":
                v = art.get("verdict") or art.get("status")
                if v != "INSUFFICIENT_EVIDENCE":
                    problems.append(f"sparse: outcome {v} != INSUFFICIENT_EVIDENCE")
        if kind == "malformed":
            if ex["status"] != 422:
                problems.append(f"malformed: HTTP {ex['status']} != 422")
            if art is None or art.get("error") != "invalid_input":
                problems.append("malformed: body is not invalid_input")
            else:
                facts["malformed_field"] = art.get("field")
                tv = validate_cases.type_violations(
                    c["input"], validate_cases.load_oracle(atom).MANIFEST_SPEC, "")
                if len(tv) != 1 or tv[0][0] != art.get("field"):
                    problems.append(f"malformed: oracle type violations {tv} vs 422 field {art.get('field')}")
    facts["judge_verdict"] = judg.get("verdict")
    facts["judge_findings"] = len(judg.get("findings") or [])
    facts["judge_tester_errors"] = len(judg.get("tester_errors") or [])
    if judg.get("verdict") != "PASS":
        problems.append(f"judge verdict {judg.get('verdict')} != PASS")
    if judg.get("findings"):
        problems.append(f"judge findings present: {judg['findings']}")
    if res is not None:
        facts["results_verdict"] = res.get("verdict")
    return problems, facts
