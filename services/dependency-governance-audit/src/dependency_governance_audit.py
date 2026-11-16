#!/usr/bin/env python3
"""Dependency governance audit — deterministic core.

Built from the bound skill `dependency-governance` (v1): "Every
dependency is a liability with a feature. Add few, pin them, verify
them, keep them healthy."

The caller submits a dependency-governance evidence manifest (a dict,
or JSON on the CLI). Every check in every section reads declared
manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> NOT_GOVERNED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> GOVERNED

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "justification",
    "verified_sources",
    "pinning",
    "audit_and_updates",
    "licences",
    "sbom",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "justification": {
        "recorded": "boolean",
        "alternatives_considered": "boolean",
    },
    "sources": {
        "all_official": "boolean",
        "publisher_signing_checked": "boolean",
        "binaries_present": "boolean",
        "binary_checksums_verified": "boolean",
    },
    "pinning": {
        "exact_versions": "boolean",
        "lockfile_committed": "boolean",
        "lockfile_updated_in_same_change": "boolean",
        "ci_installs_from_lockfile": "boolean",
        "ci_actions_images_pinned_to_hashes": "boolean",
    },
    "audit": {
        "automated_in_workflow": "boolean",
        "bot_bumps_reviewed": "boolean",
        "automerge_without_green_suite": "boolean",
    },
    "updates": {
        "batched": "boolean",
        "stale_dependencies_flagged": "boolean",
        "unused_retired": "boolean",
    },
    "licences": {
        "checked": "boolean",
        "non_permissive_present": "boolean",
        "human_decision_recorded": "boolean",
        "notice_required": "boolean",
        "notice_updated": "boolean",
    },
    "sbom": {
        "generated_per_release": "boolean",
        "kept_with_artifacts": "boolean",
    },
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


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def evaluate(manifest):
    """Return the verdict dict for a dependency-governance manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: justification (skill method 1 + quality gate) ----
    justified, has_just = _get(manifest, "justification", "recorded")
    _check(results, "justification", "new_dependencies_justified_in_pr",
           justified, has_just, justified is True,
           "quality gate: new dependency justified in the PR (what/why/alternatives)")

    alternatives, has_alt = _get(manifest, "justification",
                                 "alternatives_considered")
    _check(results, "justification", "alternatives_considered",
           alternatives, has_alt, alternatives is True,
           "prefer the standard library; prefer boring, maintained, small")

    # ---- Section 2: verified_sources (skill method 2 + red line) ----
    official, has_official = _get(manifest, "sources", "all_official")
    _check(results, "verified_sources",
           "all_dependencies_from_official_sources",
           official, has_official, official is True,
           "skill red line: no dependencies from unknown sources; official registries/repos only")

    signing, has_signing = _get(manifest, "sources",
                                "publisher_signing_checked")
    _check(results, "verified_sources", "publisher_and_signing_checked",
           signing, has_signing, signing is True,
           "check publisher, release signing where available")

    binaries, has_binaries = _get(manifest, "sources", "binaries_present")
    checksums, has_checksums = _get(manifest, "sources",
                                    "binary_checksums_verified")
    if has_binaries and binaries:
        _check(results, "verified_sources", "binary_checksums_verified",
               checksums, has_checksums, checksums is True,
               "checksums for binaries")
    else:
        _check(results, "verified_sources", "binary_checksums_verified",
               binaries, has_binaries, True,
               "no binaries declared")

    # ---- Section 3: pinning (skill method 3 + quality gates + red line) ----
    exact, has_exact = _get(manifest, "pinning", "exact_versions")
    _check(results, "pinning", "exact_versions_pinned",
           exact, has_exact, exact is True,
           "skill red line: no unpinned \"latest\"; exact versions")

    lockfile, has_lock = _get(manifest, "pinning", "lockfile_committed")
    _check(results, "pinning", "lockfile_committed",
           lockfile, has_lock, lockfile is True,
           "lockfiles committed")

    lock_same, has_lock_same = _get(manifest, "pinning",
                                    "lockfile_updated_in_same_change")
    _check(results, "pinning", "lockfile_updated_in_same_change",
           lock_same, has_lock_same, lock_same is True,
           "quality gate: lockfile updated in the same change")

    ci_lock, has_ci_lock = _get(manifest, "pinning",
                                "ci_installs_from_lockfile")
    _check(results, "pinning", "ci_installs_from_lockfile",
           ci_lock, has_ci_lock, ci_lock is True,
           "CI installs from the lock")

    ci_pinned, has_ci_pinned = _get(manifest, "pinning",
                                    "ci_actions_images_pinned_to_hashes")
    _check(results, "pinning", "ci_actions_and_images_pinned_to_hashes",
           ci_pinned, has_ci_pinned, ci_pinned is True,
           "quality gate: no unpinned CI actions or images; pin to commit hashes")

    # ---- Section 4: audit_and_updates (skill methods 4 + 7 + red line) ----
    auto_audit, has_auto = _get(manifest, "audit", "automated_in_workflow")
    _check(results, "audit_and_updates", "automated_audit_in_workflow",
           auto_audit, has_auto, auto_audit is True,
           "automated audit in the normal workflow")

    bot_reviewed, has_bot = _get(manifest, "audit", "bot_bumps_reviewed")
    _check(results, "audit_and_updates", "bot_bumps_reviewed_not_blind_merged",
           bot_reviewed, has_bot, bot_reviewed is True,
           "review bot bumps — do not blind-merge them")

    automerge, has_automerge = _get(manifest, "audit",
                                    "automerge_without_green_suite")
    _check(results, "audit_and_updates", "no_automerge_without_green_suite",
           automerge, has_automerge, automerge is False,
           "skill red line: no auto-merge of dependency bumps without a green suite")

    batched, has_batched = _get(manifest, "updates", "batched")
    _check(results, "audit_and_updates", "updates_batched",
           batched, has_batched, batched is True,
           "update policy: batch updates, run the suite")

    stale, has_stale = _get(manifest, "updates",
                            "stale_dependencies_flagged")
    _check(results, "audit_and_updates", "stale_dependencies_flagged",
           stale, has_stale, stale is True,
           "flag anything with no release in ~2 years")

    unused, has_unused = _get(manifest, "updates", "unused_retired")
    _check(results, "audit_and_updates", "unused_dependencies_retired",
           unused, has_unused, unused is True,
           "retire unused deps")

    # ---- Section 5: licences (skill method 5 + quality gates) ----
    lic_checked, has_lic = _get(manifest, "licences", "checked")
    _check(results, "licences", "licences_checked",
           lic_checked, has_lic, lic_checked is True,
           "quality gate: license checked")

    nonperm, has_nonperm = _get(manifest, "licences",
                                "non_permissive_present")
    human_decision, has_decision = _get(manifest, "licences",
                                        "human_decision_recorded")
    if has_nonperm and nonperm:
        _check(results, "licences",
               "non_permissive_licences_have_human_decision",
               human_decision, has_decision, human_decision is True,
               "copyleft or commercial goes to an explicit human decision")
    else:
        _check(results, "licences",
               "non_permissive_licences_have_human_decision",
               nonperm, has_nonperm, True,
               "no copyleft or commercial licences declared")

    notice_required, has_nr = _get(manifest, "licences", "notice_required")
    notice_updated, has_nu = _get(manifest, "licences", "notice_updated")
    if has_nr and notice_required:
        _check(results, "licences", "notice_updated_when_required",
               notice_updated, has_nu, notice_updated is True,
               "quality gate: NOTICE updated when required")
    else:
        _check(results, "licences", "notice_updated_when_required",
               notice_required, has_nr, True,
               "NOTICE update not required")

    # ---- Section 6: sbom (skill method 6) ----
    sbom_gen, has_sbom_gen = _get(manifest, "sbom", "generated_per_release")
    _check(results, "sbom", "sbom_generated_per_release",
           sbom_gen, has_sbom_gen, sbom_gen is True,
           "SBOM: generate per release where feasible")

    sbom_kept, has_sbom_kept = _get(manifest, "sbom",
                                    "kept_with_artifacts")
    _check(results, "sbom", "sbom_kept_with_release_artifacts",
           sbom_kept, has_sbom_kept, sbom_kept is True,
           "keep SBOM with release artifacts")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "NOT_GOVERNED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "GOVERNED"

    return {
        "service": "dependency-governance-audit",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DEPENDENCY-GOVERNANCE AUDIT",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<18} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: dependency_governance_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "GOVERNED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
