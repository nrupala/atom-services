#!/usr/bin/env python3
"""Release-readiness verdict — deterministic core (atom #1).

Built from the bound skill `release-management` (v1) and knowledge
atom #13: "a product in; the five release bars (control / understanding
/ management / lifecycle / stability) probed and verdicted with
evidence."

The caller submits a release-evidence manifest (a dict, or JSON on the
CLI). Every check in every bar reads one manifest field:

- field present and true/valid  -> pass
- field present and false/invalid -> fail
- field absent                   -> missing (evidence not provided)

Verdict:
- any fail            -> NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass            -> READY

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import re
import sys

SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")

BARS = ("control", "understanding", "management", "lifecycle", "stability")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Deliberate exception (F3, 2026-11-15): release_notes.breaking_changes
# and release_notes.migration_steps carry no spec entry because
# SERVICE.md documents no type for them — validation follows the
# documented spec exactly. A field absent from the spec is not
# type-validated; the checks below handle those fields by
# truthiness (false/empty = no breaking changes declared; truthy
# breaking requires a non-empty list migration_steps at check level).
MANIFEST_SPEC = {
    "product": "string",
    "version": "string",
    "tag": {"name": "string", "annotated": "boolean", "moved": "boolean"},
    "version_bump_locations": ["string"],
    "changelog": {
        "has_entry_for_version": "boolean",
        "unreleased_section_moved": "boolean",
    },
    "release_notes": {
        "present": "boolean",
    },
    "approver": "string",
    "approval": {"hitl_recorded": "boolean"},
    "rollout_plan": {"present": "boolean"},
    "rollback_plan": {"present": "boolean", "testable": "boolean"},
    "health_check": {"window_hours": "number"},
    "artifacts": {
        "sealed": "boolean",
        "checksum_manifest": "boolean",
        "verified_before_announcement": "boolean",
    },
    "tests": {"passing": "boolean"},
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, bar, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"bar": bar, "check": name, "status": status, "evidence": evidence}
    )


def evaluate(manifest):
    """Return the verdict dict for a release-evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Bar 1: control (version + tag discipline, from the skill) ----
    version, has_version = _get(manifest, "version")
    semver_ok = bool(has_version and SEMVER.match(str(version)))
    _check(results, "control", "version_is_semver", version, has_version,
           semver_ok, f"version={version!r}")

    tag_name, has_tag = _get(manifest, "tag", "name")
    _check(results, "control", "release_is_tagged", tag_name, has_tag,
           bool(tag_name) and str(tag_name) == f"v{version}",
           f"tag={tag_name!r} expected v{version}")

    annotated, has_ann = _get(manifest, "tag", "annotated")
    _check(results, "control", "tag_is_annotated", annotated, has_ann,
           annotated is True, "annotated tag (skill: annotated tags, signed when keys exist)")

    moved, has_moved = _get(manifest, "tag", "moved")
    _check(results, "control", "published_tag_not_moved", moved, has_moved,
           moved is False, "skill red line: never move a published tag")

    places, has_places = _get(manifest, "version_bump_locations")
    _check(results, "control", "version_bumped_in_exactly_one_place",
           places, has_places,
           isinstance(places, list) and len(places) == 1,
           f"version_bump_locations={places!r}")

    # ---- Bar 2: understanding (changelog + notes a reader can act on) ----
    entry, has_entry = _get(manifest, "changelog", "has_entry_for_version")
    _check(results, "understanding", "changelog_entry_for_this_version",
           entry, has_entry, entry is True,
           "Keep-a-Changelog: entry for this version ships in the same change")

    moved_unrel, has_mu = _get(manifest, "changelog", "unreleased_section_moved")
    _check(results, "understanding", "unreleased_section_moved_under_version",
           moved_unrel, has_mu, moved_unrel is True,
           "[Unreleased] entries moved under the version at release")

    notes, has_notes = _get(manifest, "release_notes", "present")
    _check(results, "understanding", "release_notes_present", notes,
           has_notes, notes is True,
           "user-facing notes: what changed, why it matters")

    breaking, has_breaking = _get(manifest, "release_notes", "breaking_changes")
    migration, has_mig = _get(manifest, "release_notes", "migration_steps")
    if has_breaking and breaking:
        _check(results, "understanding", "breaking_changes_have_migration_steps",
               migration, has_mig,
               isinstance(migration, list) and len(migration) > 0,
               "breaking items must ship with migration steps")
    else:
        _check(results, "understanding", "breaking_changes_have_migration_steps",
               breaking, has_breaking, True,
               "no breaking changes declared")

    # ---- Bar 3: management (a named human owns and approves the release) ----
    approver, has_approver = _get(manifest, "approver")
    _check(results, "management", "approver_named", approver, has_approver,
           isinstance(approver, str) and len(approver.strip()) > 0,
           "rollout plan names the approver")

    hitl, has_hitl = _get(manifest, "approval", "hitl_recorded")
    _check(results, "management", "human_approval_recorded", hitl, has_hitl,
           hitl is True,
           "skill red line: deploys stay HITL — automation prepares, humans approve")

    rollout, has_rollout = _get(manifest, "rollout_plan", "present")
    _check(results, "management", "rollout_plan_present", rollout, has_rollout,
           rollout is True, "canary/staged where feasible")

    # ---- Bar 4: lifecycle (reversible + watched after release) ----
    rb_present, has_rb = _get(manifest, "rollback_plan", "present")
    _check(results, "lifecycle", "rollback_plan_present", rb_present, has_rb,
           rb_present is True,
           "the rollback path is written before rolling out")

    rb_testable, has_rbt = _get(manifest, "rollback_plan", "testable")
    _check(results, "lifecycle", "rollback_plan_testable", rb_testable,
           has_rbt, rb_testable is True,
           "quality gate: rollback plan exists and is testable")

    window, has_window = _get(manifest, "health_check", "window_hours")
    _check(results, "lifecycle", "post_release_health_window_24_to_48h",
           window, has_window,
           isinstance(window, (int, float)) and 24 <= window <= 48,
           f"window_hours={window!r} (skill: verify health for 24–48h)")

    # ---- Bar 5: stability (sealed artifacts + passing tests) ----
    sealed, has_sealed = _get(manifest, "artifacts", "sealed")
    _check(results, "stability", "artifacts_sealed", sealed, has_sealed,
           sealed is True, "hash + sign build artifacts; manifest attached")

    checksums, has_sums = _get(manifest, "artifacts", "checksum_manifest")
    _check(results, "stability", "checksum_manifest_present", checksums,
           has_sums, checksums is True, "provenance manifest present")

    verified, has_ver = _get(manifest, "artifacts", "verified_before_announcement")
    _check(results, "stability", "artifacts_verified_before_announcement",
           verified, has_ver, verified is True,
           "quality gate: artifacts verified (checksums/signature) before announcement")

    tests_ok, has_tests = _get(manifest, "tests", "passing")
    _check(results, "stability", "tests_passing", tests_ok, has_tests,
           tests_ok is True, "the release's own test evidence passes")

    bars = {}
    for bar in BARS:
        bar_results = [r for r in results if r["bar"] == bar]
        if any(r["status"] == "fail" for r in bar_results):
            bars[bar] = "fail"
        elif any(r["status"] == "missing" for r in bar_results):
            bars[bar] = "insufficient_evidence"
        else:
            bars[bar] = "pass"

    if any(v == "fail" for v in bars.values()):
        verdict = "NOT_READY"
    elif any(v == "insufficient_evidence" for v in bars.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "READY"

    return {
        "service": "release-readiness-verdict",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "version": manifest.get("version"),
        "verdict": verdict,
        "bars": bars,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five bars."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "RELEASE-READINESS VERDICT",
        f"product: {verdict.get('product')}  version: {verdict.get('version')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for bar in BARS:
        lines.append(f"  {bar:<14} {verdict['bars'][bar]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: release_readiness.py <manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
