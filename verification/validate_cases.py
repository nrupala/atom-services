#!/usr/bin/env python3
"""Mechanical pre-flight validator for designed verification case files.

Wave 6 lesson, converted to structure: the case-design checklist
(exact check names; structured computed_spot_checks; full-manifest
violations inputs; exactly one malformed type violation) was applied
as a human pre-execution review in Wave 6. It contained every slip —
none reached execution — but it did not reduce the raw slip count
(31 in Wave 6 vs 29 in Wave 5), because Gemini's raw designs keep
making the same four classes of error. From Wave 7 on, the checklist
is this script: the harness runs it on every designed case file
BEFORE execution and refuses to execute a rejected file.

Rules (a rejection names the rule and the offending detail):
  R1 check-register — every name in the violations case's
     expect.failing_checks is an exact check name in the atom's
     check register. The register is extracted mechanically from the
     atom's own Python oracle core (services/<atom>/src/*.py):
     evaluate({}) enumerates every check. Section names, shorthand
     and input field paths are not check names and are rejected.
  R2 structured-spot-checks — the full-pass and violations expects
     carry computed_spot_checks in structured form: a non-empty JSON
     object mapping quantity name -> expected value, or a non-empty
     list of {"quantity"/"name", "expected"} objects. Quantities
     stated only in prose notes are rejected.
  R3 violations-full-manifest — the violations input is a full
     manifest, not a sparse one: every key path present in the
     full-pass input is present in the violations input (planted
     violations change values, never remove structure).
  R4 malformed-exactly-one — the malformed input carries exactly
     ONE type violation of a documented typed field, counted by
     walking the input against the oracle's MANIFEST_SPEC with the
     oracle's own type semantics. Zero (no violation, or a violation
     only on an undocumented field) and two-or-more are both
     rejected: the gateway names the first violating field, so a
     second violation makes the expected 422 field ambiguous.

Usage:
  validate_cases.py --atom <service> --cases cases.json
      prints a JSON report; exit 0 = accepted, 1 = rejected,
      2 = the case file or atom core could not be loaded.
  Importable: validate(atom, cases_dict) -> report dict.
"""
import argparse, importlib.util, json, os, sys

ROOT = os.path.expanduser("~/workspace/atom-services")


# ---------------------------------------------------------------- atom core

def load_oracle(atom):
    src_dir = os.path.join(ROOT, "services", atom, "src")
    files = [f for f in os.listdir(src_dir)
             if f.endswith(".py") and not f.startswith("__")]
    if len(files) != 1:
        raise ValueError(f"{atom}: expected exactly one oracle module "
                         f"in {src_dir}, found {files}")
    path = os.path.join(src_dir, files[0])
    spec = importlib.util.spec_from_file_location(f"oracle_{atom}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def check_register(mod):
    out = mod.evaluate({})
    return [c["check"] for c in out["checks"]]


# ------------------------------------------------------- type-violation walk

def type_violations(value, spec, path):
    """Mirror of the oracle cores' _validate_value semantics: returns
    [(path, expected)] for every present field whose JSON type
    contradicts the documented spec. Fields absent from the spec are
    undocumented and never count as violations (the oracle ignores
    them too)."""
    if spec == "any":
        return []
    if spec == "string":
        return [] if isinstance(value, str) else [(path, "string")]
    if spec == "boolean":
        return [] if isinstance(value, bool) else [(path, "boolean")]
    if spec == "number":
        ok = isinstance(value, (int, float)) and not isinstance(value, bool)
        return [] if ok else [(path, "number")]
    if isinstance(spec, list):
        if not isinstance(value, list):
            return [(path, "list")]
        out = []
        for i, entry in enumerate(value):
            out += type_violations(entry, spec[0], f"{path}[{i}]")
        return out
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            return [(path, "object")]
        out = []
        for field, fspec in spec.items():
            if field in value:
                p = f"{path}.{field}" if path else field
                out += type_violations(value[field], fspec, p)
        return out
    raise ValueError(f"unknown manifest spec at {path}: {spec!r}")


# ------------------------------------------------------------- path coverage

def key_paths(obj, prefix=""):
    """All key paths of a manifest: dict keys dotted; list entries
    contribute their element paths under '<path>[]' (union over
    entries). Leaf values contribute their own path."""
    paths = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{prefix}.{k}" if prefix else k
            paths.add(p)
            paths |= key_paths(v, p)
    elif isinstance(obj, list):
        for entry in obj:
            paths |= key_paths(entry, prefix + "[]")
    return paths


# ------------------------------------------------------------------- rules

def _spot_checks_ok(sc):
    if isinstance(sc, dict):
        return len(sc) >= 1
    if isinstance(sc, list):
        return len(sc) >= 1 and all(
            isinstance(e, dict)
            and ("quantity" in e or "name" in e) and "expected" in e
            for e in sc)
    return False


def validate(atom, cases):
    mod = load_oracle(atom)
    register = check_register(mod)
    register_set = set(register)
    spec = mod.MANIFEST_SPEC
    by_kind = {}
    for c in cases.get("cases", []):
        by_kind.setdefault(c.get("kind"), c)
    rejections = []

    def reject(case_id, rule, detail):
        rejections.append({"case": case_id, "rule": rule, "detail": detail})

    for kind in ("full-pass", "violations", "sparse", "malformed"):
        if kind not in by_kind:
            reject(kind, "structure",
                   f"case file carries no '{kind}' case")

    fp = by_kind.get("full-pass")
    viol = by_kind.get("violations")
    mal = by_kind.get("malformed")

    # R1 — violations failing_checks names are exact check names.
    if viol is not None:
        fc = (viol.get("expect") or {}).get("failing_checks")
        if not isinstance(fc, list) or not fc:
            reject("violations", "R1 check-register",
                   "expect.failing_checks is missing or empty; a "
                   "violations case must name the checks it plants")
        else:
            for name in fc:
                if name not in register_set:
                    reject("violations", "R1 check-register",
                           f"failing_checks names {name!r}, which is "
                           f"not in the atom's check register "
                           f"({len(register_set)} checks)")

    # R2 — computed quantities structured, never prose-only.
    for case in (fp, viol):
        if case is None:
            continue
        sc = (case.get("expect") or {}).get("computed_spot_checks")
        if not _spot_checks_ok(sc):
            reject(case["id"], "R2 structured-spot-checks",
                   "expect.computed_spot_checks is absent, empty or "
                   "not structured (a non-empty object of quantity -> "
                   "expected value, or a list of {quantity, expected} "
                   "objects, is required); quantities stated only in "
                   "prose notes do not count")

    # R3 — violations input is a full manifest.
    if fp is not None and viol is not None:
        fp_paths = key_paths(fp.get("input") or {})
        v_paths = key_paths(viol.get("input") or {})
        missing = sorted(fp_paths - v_paths)
        if missing:
            reject("violations", "R3 violations-full-manifest",
                   "violations input is missing key paths present in "
                   "the full-pass manifest (a sparse violations input "
                   "reads as missing evidence, not as failure): "
                   + ", ".join(missing))

    # R4 — malformed carries exactly one documented type violation.
    if mal is not None:
        inp = mal.get("input")
        if not isinstance(inp, dict):
            reject("malformed", "R4 malformed-exactly-one",
                   "malformed input is not a manifest object")
        else:
            tv = type_violations(inp, spec, "")
            if len(tv) == 0:
                reject("malformed", "R4 malformed-exactly-one",
                       "malformed input carries no type violation of "
                       "a documented typed field (MANIFEST_SPEC); a "
                       "violation on an undocumented field does not "
                       "count")
            elif len(tv) > 1:
                reject("malformed", "R4 malformed-exactly-one",
                       "malformed input carries "
                       f"{len(tv)} type violations ("
                       + ", ".join(f"{p} must be a {t}" for p, t in tv)
                       + "); exactly one is required so the 422 "
                         "field is unambiguous")

    return {"atom": atom, "ok": not rejections, "rejections": rejections,
            "register_size": len(register_set),
            "validator": "validate_cases.py (Wave 7)"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atom", required=True)
    ap.add_argument("--cases", required=True)
    a = ap.parse_args()
    try:
        with open(a.cases) as f:
            cases = json.load(f)
        report = validate(a.atom, cases)
    except Exception as e:
        print(json.dumps({"atom": a.atom, "ok": False,
                          "error": f"{type(e).__name__}: {e}"}))
        return 2
    report["cases_file"] = a.cases
    print(json.dumps(report, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
