#!/usr/bin/env python3
"""Release pack changelog seal rollback — deterministic core.

Built from the bound skill `release-management`: "Releases are
events, not accidents: versioned, documented, sealed, and
reversible." (Semver; Keep-a-Changelog with `[Unreleased]`
maintained continuously and entries moved under the version at
release; user-facing release notes — what changed, why it
matters, breaking items with migration steps; seal — hash +
sign build artifacts, attach the manifest and signature to the
release; annotated tags, signed when keys exist, never move a
published tag, never force-push release branches; rollout plan
with the rollback path written before rolling out and the
approver named; post-release health verification for a defined
window, discrepancies logged, loops closed; quality gates —
changelog + version bump ship in the same change, artifacts
verified before announcement, rollback plan exists and is
testable, post-release health check done and recorded; red
lines — no untagged releases, no rewritten history on published
branches, deploys stay HITL.)

This atom is a DELIVERABLE audit of a declared release-pack
record: the pack itself — its declared changelog entry rows,
its declared seal / artifact rows, and its declared rollback
step rows — checked for completeness, format and internal
consistency. It never fetches a real release, never downloads
or hashes a real artifact, never verifies a real signature
cryptographically, and never executes a rollback: the only
cryptographic-adjacent work is checking the FORMAT of declared
checksum strings against the checksum algorithm declared on
the same row (a sha256 declaration carries a 64-hex-digit
value; a sha512 declaration carries a 128-hex-digit value),
exactly as the tasking allows.

Distinct ground: the nearest neighbour is atom #1
`release-readiness-verdict`, which shares this skill and
verdicts a release against five readiness bars (control /
understanding / management / lifecycle / stability) from
single boolean attestations — is there a changelog entry, is
there a rollback plan, are the artifacts sealed, is the health
window 24–48h. This atom stands on different ground: it audits
the pack's declared ROWS — every changelog entry's category,
summary and version filing; every sealed artifact's checksum
format, signature record and the pack manifest's declared
artifact total; every rollback step's order, action and
post-step verification — plus the semver arithmetic of the
declared version delta. It shares zero check names with the
readiness verdict (verified mechanically against every other
atom's register). The boundary is: the readiness verdict
there; the pack's row-level completeness, format and
consistency here.

The caller submits a release-pack manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- semver arithmetic: the declared version must be well-formed
  semver, must advance from the declared previous version, and
  the declared bump kind must match the declared delta
  (major: major+1 with minor/patch reset to 0; minor: minor+1
  with patch reset to 0; patch: patch+1) — the skill's own
  MAJOR/MINOR/PATCH definitions; and a pack declaring a
  breaking change must declare a major bump (MAJOR = breaking);
- changelog entries: the declared list must be present and
  non-empty (a release pack ships a changelog entry — the
  skill's quality gate), every row's category must be one of
  the Keep-a-Changelog categories the skill's format names
  (Added / Changed / Deprecated / Removed / Fixed / Security),
  every row must carry a summary and be filed under the
  declared pack version, and no entry heading may be
  duplicated;
- sealed artifacts: the declared list must be present and
  non-empty (the skill seals build artifacts), every row's
  declared checksum must match the format of its declared
  algorithm, every row must record a signature, no artifact
  filename may be duplicated, and the seal record's declared
  artifact total must equal the number of declared rows;
- rollback steps: the declared list must be present and
  non-empty (the rollback path is written before rolling out),
  the declared step orders must form the contiguous sequence
  1..n, every row must record its action and its post-step
  verification, and no step label may be duplicated.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold beyond its own semver
definitions, its 24–48h health window (owned as a bar by the
readiness verdict; here only that a defined window is stated
is checked) and the Keep-a-Changelog category set — so no
other numeric threshold is invented: no minimum entry count
beyond the pack's own non-empty changelog, no checksum
algorithm mandate beyond format-matching the algorithm the
row itself declares, no rollback-step count, no rollout
percentage. Those quantities are computed and reported, with
completeness over the caller's own declared rows as the only
bar, exactly as stated above. Declined thresholds are named
in SERVICE.md.

Verdict:
- any fail             -> RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import re
import sys

SECTIONS = (
    "version_stamp_and_bump_classification",
    "changelog_pack_completeness",
    "seal_manifest_integrity",
    "tag_signature_and_attachment",
    "rollback_sequence_detail",
    "staged_rollout_and_health_record",
    "pack_red_lines",
)

SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
HEX = re.compile(r"^[0-9a-fA-F]+$")
CHANGELOG_CATEGORIES = (
    "Added", "Changed", "Deprecated", "Removed", "Fixed", "Security",
)
CHECKSUM_HEX_LENGTHS = {"sha256": 64, "sha512": 128}

MANIFEST_SPEC = {
    "release_label": "string",
    "version_detail": {
        "declared_version": "string",
        "previous_version": "string",
        "bump_kind": "string",
        "breaking_change_in_pack": "boolean",
    },
    "changelog_pack": {
        "keep_a_changelog_layout_followed": "boolean",
        "unreleased_backlog_maintained_continuously": "boolean",
        "pack_release_notes_state_why_changes_matter": "boolean",
        "pack_breaking_items_pair_migration_steps": "boolean",
    },
    "changelog_entries": [{
        "entry_heading": "string",
        "entry_category": "string",
        "entry_summary_present": "boolean",
        "entry_version_heading": "string",
    }],
    "seal_record": {
        "pack_artifacts_hashed_and_signed_declared": "boolean",
        "seal_manifest_generated_from_build_outputs": "boolean",
        "declared_sealed_artifact_total": "number",
    },
    "sealed_artifacts": [{
        "artifact_filename": "string",
        "checksum_algorithm": "string",
        "checksum_value": "string",
        "signature_recorded": "boolean",
    }],
    "tag_and_attachment": {
        "pack_tag_created_as_annotated": "boolean",
        "pack_tag_signature_recorded_when_signing_key_exists": "boolean",
        "seal_manifest_attached_to_pack_record": "boolean",
        "signature_file_attached_to_pack_record": "boolean",
        "pack_checksums_rechecked_before_announcement": "boolean",
    },
    "rollback_detail": {
        "rollback_path_written_before_rollout_began": "boolean",
        "rollback_sequence_is_executable_as_written": "boolean",
        "rollback_trigger_conditions_named_in_pack": "boolean",
    },
    "rollback_steps": [{
        "step_label": "string",
        "step_order": "number",
        "step_action_recorded": "boolean",
        "step_verification_recorded": "boolean",
    }],
    "rollout_record": {
        "rollout_staging_or_canary_declared_for_pack": "boolean",
        "rollout_approver_recorded_for_pack": "boolean",
        "defined_health_window_stated_for_pack": "boolean",
        "post_release_health_verification_completed_for_pack": "boolean",
        "post_release_discrepancies_logged_for_pack": "boolean",
    },
    "red_lines": {
        "untagged_pack_release_present": "boolean",
        "published_history_rewrite_present": "boolean",
        "unattended_pack_deploy_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


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


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _parse_semver(value):
    if not isinstance(value, str):
        return None
    match = SEMVER.match(value)
    if not match:
        return None
    return (int(match.group(1)), int(match.group(2)), int(match.group(3)))


def _checksum_format_ok(entry):
    if not isinstance(entry, dict):
        return False
    algorithm = entry.get("checksum_algorithm")
    value = entry.get("checksum_value")
    if algorithm not in CHECKSUM_HEX_LENGTHS or not isinstance(value, str):
        return False
    return (len(value) == CHECKSUM_HEX_LENGTHS[algorithm]
            and bool(HEX.match(value)))


def _duplicates(rows, field):
    seen = []
    dups = []
    for entry in rows:
        if isinstance(entry, dict) and isinstance(entry.get(field), str):
            name = entry[field]
            if name in seen and name not in dups:
                dups.append(name)
            seen.append(name)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a release-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared values read once for the computed checks ----
    declared_version, has_declared_version = _get(
        manifest, "version_detail", "declared_version")
    previous_version, has_previous_version = _get(
        manifest, "version_detail", "previous_version")
    bump_kind, has_bump_kind = _get(
        manifest, "version_detail", "bump_kind")
    breaking, has_breaking = _get(
        manifest, "version_detail", "breaking_change_in_pack")
    parsed_version = _parse_semver(declared_version) \
        if has_declared_version else None
    parsed_previous = _parse_semver(previous_version) \
        if has_previous_version else None

    entries, has_entries = _get(manifest, "changelog_entries")
    entries_is_list = has_entries and isinstance(entries, list)
    entry_rows = entries if entries_is_list else []
    entries_count = len(entry_rows) if entries_is_list else None

    artifacts, has_artifacts = _get(manifest, "sealed_artifacts")
    artifacts_is_list = has_artifacts and isinstance(artifacts, list)
    artifact_rows = artifacts if artifacts_is_list else []
    artifacts_count = len(artifact_rows) if artifacts_is_list else None
    declared_total, has_declared_total = _get(
        manifest, "seal_record", "declared_sealed_artifact_total")

    steps, has_steps = _get(manifest, "rollback_steps")
    steps_is_list = has_steps and isinstance(steps, list)
    step_rows = steps if steps_is_list else []
    steps_count = len(step_rows) if steps_is_list else None

    def _row_names(rows, field, predicate):
        if not rows and not _is_list(rows):
            return None
        return [
            entry[field] if isinstance(entry, dict)
            and isinstance(entry.get(field), str) else "unnamed"
            for entry in rows if predicate(entry)
        ]

    def _is_list(value):
        return isinstance(value, list)

    entries_without_summary = (
        _row_names(entry_rows, "entry_heading",
                   lambda c: isinstance(c, dict)
                   and "entry_summary_present" in c
                   and c.get("entry_summary_present") is not True)
        if entries_is_list else None
    )
    entries_with_unrecognised_category = (
        _row_names(entry_rows, "entry_heading",
                   lambda c: isinstance(c, dict)
                   and "entry_category" in c
                   and c.get("entry_category") not in CHANGELOG_CATEGORIES)
        if entries_is_list else None
    )
    entries_filed_under_other_version = (
        _row_names(entry_rows, "entry_heading",
                   lambda c: isinstance(c, dict)
                   and "entry_version_heading" in c
                   and c.get("entry_version_heading") != declared_version)
        if entries_is_list and has_declared_version else None
    )
    duplicate_entry_headings = (
        _duplicates(entry_rows, "entry_heading")
        if entries_is_list else None
    )
    summary_coverage = (
        sum(1 for c in entry_rows
            if isinstance(c, dict)
            and c.get("entry_summary_present") is True)
        / entries_count
        if entries_is_list and entries_count > 0 else None
    )
    recognised_category_coverage = (
        sum(1 for c in entry_rows
            if isinstance(c, dict)
            and c.get("entry_category") in CHANGELOG_CATEGORIES)
        / entries_count
        if entries_is_list and entries_count > 0 else None
    )

    artifacts_with_malformed_checksum = (
        _row_names(artifact_rows, "artifact_filename",
                   lambda c: isinstance(c, dict)
                   and "checksum_algorithm" in c
                   and "checksum_value" in c
                   and not _checksum_format_ok(c))
        if artifacts_is_list else None
    )
    artifacts_without_signature = (
        _row_names(artifact_rows, "artifact_filename",
                   lambda c: isinstance(c, dict)
                   and "signature_recorded" in c
                   and c.get("signature_recorded") is not True)
        if artifacts_is_list else None
    )
    duplicate_artifact_filenames = (
        _duplicates(artifact_rows, "artifact_filename")
        if artifacts_is_list else None
    )
    checksum_format_coverage = (
        sum(1 for c in artifact_rows if _checksum_format_ok(c))
        / artifacts_count
        if artifacts_is_list and artifacts_count > 0 else None
    )
    signature_coverage = (
        sum(1 for c in artifact_rows
            if isinstance(c, dict)
            and c.get("signature_recorded") is True)
        / artifacts_count
        if artifacts_is_list and artifacts_count > 0 else None
    )

    steps_without_action = (
        _row_names(step_rows, "step_label",
                   lambda c: isinstance(c, dict)
                   and "step_action_recorded" in c
                   and c.get("step_action_recorded") is not True)
        if steps_is_list else None
    )
    steps_without_verification = (
        _row_names(step_rows, "step_label",
                   lambda c: isinstance(c, dict)
                   and "step_verification_recorded" in c
                   and c.get("step_verification_recorded") is not True)
        if steps_is_list else None
    )
    duplicate_step_labels = (
        _duplicates(step_rows, "step_label")
        if steps_is_list else None
    )
    action_coverage = (
        sum(1 for c in step_rows
            if isinstance(c, dict)
            and c.get("step_action_recorded") is True)
        / steps_count
        if steps_is_list and steps_count > 0 else None
    )
    verification_coverage = (
        sum(1 for c in step_rows
            if isinstance(c, dict)
            and c.get("step_verification_recorded") is True)
        / steps_count
        if steps_is_list and steps_count > 0 else None
    )

    # ---- Section 1: version_stamp_and_bump_classification
    #      (skill Method 1 "Semver" — MAJOR (breaking) · MINOR
    #      (features) · PATCH (fixes), as arithmetic over the
    #      declared version pair) ----
    _check(results, "version_stamp_and_bump_classification",
           "pack_version_is_wellformed_semver", declared_version,
           has_declared_version, parsed_version is not None,
           "semver: the pack's declared version is well-formed "
           "MAJOR.MINOR.PATCH semver")
    _check(results, "version_stamp_and_bump_classification",
           "pack_version_advances_from_previous_declared_version",
           previous_version,
           has_declared_version and has_previous_version,
           parsed_version is not None and parsed_previous is not None
           and parsed_version > parsed_previous,
           "semver: the pack's declared version advances from "
           "the declared previous version")
    delta_ok = False
    if parsed_version is not None and parsed_previous is not None:
        vmaj, vmin, vpat = parsed_version
        pmaj, pmin, ppat = parsed_previous
        if bump_kind == "major":
            delta_ok = (vmaj == pmaj + 1 and vmin == 0 and vpat == 0)
        elif bump_kind == "minor":
            delta_ok = (vmaj == pmaj and vmin == pmin + 1 and vpat == 0)
        elif bump_kind == "patch":
            delta_ok = (vmaj == pmaj and vmin == pmin and vpat == ppat + 1)
    _check(results, "version_stamp_and_bump_classification",
           "pack_bump_kind_matches_version_delta", bump_kind,
           has_declared_version and has_previous_version and has_bump_kind,
           delta_ok,
           "semver: the declared bump kind matches the declared "
           "version delta — major resets minor/patch, minor "
           "resets patch, patch increments patch only")
    _check(results, "version_stamp_and_bump_classification",
           "pack_bump_kind_follows_declared_breaking_flag", bump_kind,
           has_bump_kind and has_breaking,
           breaking is not True or bump_kind == "major",
           "semver: a pack declaring a breaking change declares "
           "a major bump — MAJOR means breaking")

    # ---- Section 2: changelog_pack_completeness (skill Method
    #      2 "Changelog" and Method 3 "Release notes", plus the
    #      quality gate that changelog and version ship together;
    #      the row checks audit every declared entry) ----
    _bool_check(results, "changelog_pack_completeness",
                "keep_a_changelog_layout_followed", manifest,
                ("changelog_pack", "keep_a_changelog_layout_followed"),
                "changelog: the pack follows the Keep-a-Changelog "
                "layout")
    _bool_check(results, "changelog_pack_completeness",
                "unreleased_backlog_maintained_continuously", manifest,
                ("changelog_pack",
                 "unreleased_backlog_maintained_continuously"),
                "changelog: the [Unreleased] backlog is maintained "
                "continuously, not reconstructed at release time")
    _bool_check(results, "changelog_pack_completeness",
                "pack_release_notes_state_why_changes_matter", manifest,
                ("changelog_pack",
                 "pack_release_notes_state_why_changes_matter"),
                "release notes: the pack's user-facing notes state "
                "what changed and why it matters")
    _bool_check(results, "changelog_pack_completeness",
                "pack_breaking_items_pair_migration_steps", manifest,
                ("changelog_pack",
                 "pack_breaking_items_pair_migration_steps"),
                "release notes: the pack's breaking items are "
                "paired with migration steps in the notes")
    _check(results, "changelog_pack_completeness",
           "changelog_entry_rows_declared", entries, entries_is_list,
           entries_is_list and entries_count > 0,
           "changelog: the pack declares its changelog entry "
           "rows — the list is present and non-empty; a release "
           "pack ships at least one changelog entry")
    category_present = (
        entries_is_list
        and all(isinstance(c, dict) and "entry_category" in c
                for c in entry_rows)
    )
    _check(results, "changelog_pack_completeness",
           "every_changelog_entry_uses_recognised_category", entries,
           category_present,
           entries_is_list
           and all(isinstance(c, dict)
                   and c.get("entry_category") in CHANGELOG_CATEGORIES
                   for c in entry_rows),
           "changelog entries: every declared entry's category "
           "is a Keep-a-Changelog category (Added / Changed / "
           "Deprecated / Removed / Fixed / Security)")
    summary_present = (
        entries_is_list
        and all(isinstance(c, dict) and "entry_summary_present" in c
                for c in entry_rows)
    )
    _check(results, "changelog_pack_completeness",
           "every_changelog_entry_carries_summary", entries,
           summary_present,
           entries_is_list
           and all(isinstance(c, dict)
                   and c.get("entry_summary_present") is True
                   for c in entry_rows),
           "changelog entries: every declared entry carries a "
           "summary of the change")
    filing_present = (
        entries_is_list and has_declared_version
        and all(isinstance(c, dict) and "entry_version_heading" in c
                for c in entry_rows)
    )
    _check(results, "changelog_pack_completeness",
           "every_changelog_entry_filed_under_pack_version", entries,
           filing_present,
           entries_is_list and has_declared_version
           and all(isinstance(c, dict)
                   and c.get("entry_version_heading") == declared_version
                   for c in entry_rows),
           "changelog entries: every declared entry is filed "
           "under the pack's declared version heading — entries "
           "moved under the version at release")
    heading_present = (
        entries_is_list
        and all(isinstance(c, dict) and "entry_heading" in c
                for c in entry_rows)
    )
    _check(results, "changelog_pack_completeness",
           "no_changelog_entry_heading_duplicated", entries,
           heading_present,
           entries_is_list and duplicate_entry_headings is not None
           and len(duplicate_entry_headings) == 0,
           "changelog entries: no declared entry heading is "
           "owned by more than one row")

    # ---- Section 3: seal_manifest_integrity (skill Method 4
    #      "Seal" — hash + sign build artifacts, manifest and
    #      signature attached; the row checks audit every
    #      declared artifact's checksum format and signature
    #      record, and the manifest total's consistency) ----
    _bool_check(results, "seal_manifest_integrity",
                "pack_artifacts_hashed_and_signed_declared", manifest,
                ("seal_record", "pack_artifacts_hashed_and_signed_declared"),
                "seal: the pack declares its build artifacts "
                "hashed and signed")
    _bool_check(results, "seal_manifest_integrity",
                "seal_manifest_generated_from_build_outputs", manifest,
                ("seal_record",
                 "seal_manifest_generated_from_build_outputs"),
                "seal: the pack's seal manifest is generated from "
                "the build outputs it seals")
    _check(results, "seal_manifest_integrity",
           "sealed_artifact_rows_declared", artifacts, artifacts_is_list,
           artifacts_is_list and artifacts_count > 0,
           "seal: the pack declares its sealed artifact rows — "
           "the list is present and non-empty; the skill seals "
           "build artifacts")
    checksum_present = (
        artifacts_is_list
        and all(isinstance(c, dict) and "checksum_algorithm" in c
                and "checksum_value" in c for c in artifact_rows)
    )
    _check(results, "seal_manifest_integrity",
           "every_sealed_artifact_checksum_matches_declared_algorithm_format",
           artifacts, checksum_present,
           artifacts_is_list
           and all(_checksum_format_ok(c) for c in artifact_rows),
           "sealed artifacts: every declared checksum matches "
           "the format of the algorithm declared on its row "
           "(sha256: 64 hex digits; sha512: 128 hex digits) — "
           "format only; no real artifact is hashed here")
    signature_present = (
        artifacts_is_list
        and all(isinstance(c, dict) and "signature_recorded" in c
                for c in artifact_rows)
    )
    _check(results, "seal_manifest_integrity",
           "every_sealed_artifact_signature_recorded", artifacts,
           signature_present,
           artifacts_is_list
           and all(isinstance(c, dict)
                   and c.get("signature_recorded") is True
                   for c in artifact_rows),
           "sealed artifacts: every declared artifact records "
           "its signature in the pack")
    filename_present = (
        artifacts_is_list
        and all(isinstance(c, dict) and "artifact_filename" in c
                for c in artifact_rows)
    )
    _check(results, "seal_manifest_integrity",
           "no_sealed_artifact_filename_duplicated", artifacts,
           filename_present,
           artifacts_is_list and duplicate_artifact_filenames is not None
           and len(duplicate_artifact_filenames) == 0,
           "sealed artifacts: no declared artifact filename is "
           "owned by more than one row")
    _check(results, "seal_manifest_integrity",
           "seal_artifact_count_matches_pack_manifest_total",
           declared_total,
           artifacts_is_list and has_declared_total,
           artifacts_is_list and has_declared_total
           and declared_total == artifacts_count,
           "seal: the seal record's declared artifact total "
           "equals the number of declared sealed artifact rows")

    # ---- Section 4: tag_signature_and_attachment (skill
    #      Method 4 "Seal" attachment and Method 5 "Tag", plus
    #      the quality gate that artifacts are verified before
    #      announcement — as pack attachment records) ----
    _bool_check(results, "tag_signature_and_attachment",
                "pack_tag_created_as_annotated", manifest,
                ("tag_and_attachment", "pack_tag_created_as_annotated"),
                "tag: the pack's release tag is created as an "
                "annotated tag")
    _bool_check(results, "tag_signature_and_attachment",
                "pack_tag_signature_recorded_when_signing_key_exists",
                manifest,
                ("tag_and_attachment",
                 "pack_tag_signature_recorded_when_signing_key_exists"),
                "tag: the pack records the tag as signed when "
                "signing keys exist")
    _bool_check(results, "tag_signature_and_attachment",
                "seal_manifest_attached_to_pack_record", manifest,
                ("tag_and_attachment",
                 "seal_manifest_attached_to_pack_record"),
                "seal: the manifest is attached to the pack's "
                "release record")
    _bool_check(results, "tag_signature_and_attachment",
                "signature_file_attached_to_pack_record", manifest,
                ("tag_and_attachment",
                 "signature_file_attached_to_pack_record"),
                "seal: the signature file is attached to the "
                "pack's release record")
    _bool_check(results, "tag_signature_and_attachment",
                "pack_checksums_rechecked_before_announcement", manifest,
                ("tag_and_attachment",
                 "pack_checksums_rechecked_before_announcement"),
                "seal: the pack's checksums and signature are "
                "rechecked before the release is announced")

    # ---- Section 5: rollback_sequence_detail (skill Method 6
    #      "Rollout plan" — write the rollback path before
    #      rolling out — and the quality gate that the rollback
    #      plan exists and is testable; the row checks audit
    #      every declared rollback step) ----
    _bool_check(results, "rollback_sequence_detail",
                "rollback_path_written_before_rollout_began", manifest,
                ("rollback_detail",
                 "rollback_path_written_before_rollout_began"),
                "rollback: the pack's rollback path was written "
                "before the rollout began")
    _bool_check(results, "rollback_sequence_detail",
                "rollback_sequence_is_executable_as_written", manifest,
                ("rollback_detail",
                 "rollback_sequence_is_executable_as_written"),
                "rollback: the pack's rollback sequence is "
                "executable as written — the plan is testable")
    _bool_check(results, "rollback_sequence_detail",
                "rollback_trigger_conditions_named_in_pack", manifest,
                ("rollback_detail",
                 "rollback_trigger_conditions_named_in_pack"),
                "rollback: the pack names the conditions that "
                "trigger a rollback")
    _check(results, "rollback_sequence_detail",
           "rollback_step_rows_declared", steps, steps_is_list,
           steps_is_list and steps_count > 0,
           "rollback: the pack declares its rollback step rows "
           "— the list is present and non-empty; a rollback "
           "path has at least one step")
    order_present = (
        steps_is_list
        and all(isinstance(c, dict) and "step_order" in c
                for c in step_rows)
    )
    orders_ok = False
    if steps_is_list and order_present:
        orders = [c.get("step_order") for c in step_rows
                  if isinstance(c, dict)]
        orders_ok = sorted(orders) == list(range(1, steps_count + 1))
    _check(results, "rollback_sequence_detail",
           "rollback_step_orders_form_contiguous_sequence", steps,
           order_present,
           orders_ok,
           "rollback steps: the declared step orders form the "
           "contiguous sequence 1..n — no gaps, no repeats")
    action_present = (
        steps_is_list
        and all(isinstance(c, dict) and "step_action_recorded" in c
                for c in step_rows)
    )
    _check(results, "rollback_sequence_detail",
           "every_rollback_step_records_its_action", steps,
           action_present,
           steps_is_list
           and all(isinstance(c, dict)
                   and c.get("step_action_recorded") is True
                   for c in step_rows),
           "rollback steps: every declared step records the "
           "action it performs")
    verification_present = (
        steps_is_list
        and all(isinstance(c, dict)
                and "step_verification_recorded" in c
                for c in step_rows)
    )
    _check(results, "rollback_sequence_detail",
           "every_rollback_step_records_post_step_verification", steps,
           verification_present,
           steps_is_list
           and all(isinstance(c, dict)
                   and c.get("step_verification_recorded") is True
                   for c in step_rows),
           "rollback steps: every declared step records how its "
           "effect is verified after the step runs")
    label_present = (
        steps_is_list
        and all(isinstance(c, dict) and "step_label" in c
                for c in step_rows)
    )
    _check(results, "rollback_sequence_detail",
           "no_rollback_step_label_duplicated", steps,
           label_present,
           steps_is_list and duplicate_step_labels is not None
           and len(duplicate_step_labels) == 0,
           "rollback steps: no declared step label is owned by "
           "more than one row")

    # ---- Section 6: staged_rollout_and_health_record (skill
    #      Method 6 "Rollout plan" and Method 7 "Post-release",
    #      plus the quality gate that the post-release health
    #      check is done and recorded — as pack records) ----
    _bool_check(results, "staged_rollout_and_health_record",
                "rollout_staging_or_canary_declared_for_pack", manifest,
                ("rollout_record",
                 "rollout_staging_or_canary_declared_for_pack"),
                "rollout: the pack declares a canary or staged "
                "rollout where feasible")
    _bool_check(results, "staged_rollout_and_health_record",
                "rollout_approver_recorded_for_pack", manifest,
                ("rollout_record", "rollout_approver_recorded_for_pack"),
                "rollout: the pack's rollout record names its "
                "approver")
    _bool_check(results, "staged_rollout_and_health_record",
                "defined_health_window_stated_for_pack", manifest,
                ("rollout_record",
                 "defined_health_window_stated_for_pack"),
                "post-release: the pack states a defined health "
                "verification window")
    _bool_check(results, "staged_rollout_and_health_record",
                "post_release_health_verification_completed_for_pack",
                manifest,
                ("rollout_record",
                 "post_release_health_verification_completed_for_pack"),
                "post-release: the pack records the post-release "
                "health verification as done")
    _bool_check(results, "staged_rollout_and_health_record",
                "post_release_discrepancies_logged_for_pack", manifest,
                ("rollout_record",
                 "post_release_discrepancies_logged_for_pack"),
                "post-release: the pack logs discrepancies and "
                "records the loops closed")

    # ---- Section 7: pack_red_lines (skill "Red lines" — no
    #      untagged releases, no rewritten history on published
    #      branches, deploys stay HITL) ----
    _false_check(results, "pack_red_lines",
                 "no_untagged_pack_release_in_record", manifest,
                 ("red_lines", "untagged_pack_release_present"),
                 "red line: no untagged release of the pack is "
                 "present in the record")
    _false_check(results, "pack_red_lines",
                 "no_published_history_rewrite_in_record", manifest,
                 ("red_lines", "published_history_rewrite_present"),
                 "red line: no rewritten history on a published "
                 "branch is present in the record")
    _false_check(results, "pack_red_lines",
                 "no_unattended_pack_deploy_in_record", manifest,
                 ("red_lines", "unattended_pack_deploy_present"),
                 "red line: no deploy of the pack without human "
                 "approval is present in the record — deploys "
                 "stay HITL")

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
        verdict = "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY"

    computed_names = (
        "pack_version_is_wellformed_semver",
        "pack_version_advances_from_previous_declared_version",
        "pack_bump_kind_matches_version_delta",
        "pack_bump_kind_follows_declared_breaking_flag",
        "changelog_entry_rows_declared",
        "every_changelog_entry_uses_recognised_category",
        "every_changelog_entry_carries_summary",
        "every_changelog_entry_filed_under_pack_version",
        "no_changelog_entry_heading_duplicated",
        "sealed_artifact_rows_declared",
        "every_sealed_artifact_checksum_matches_declared_algorithm_format",
        "every_sealed_artifact_signature_recorded",
        "no_sealed_artifact_filename_duplicated",
        "seal_artifact_count_matches_pack_manifest_total",
        "rollback_step_rows_declared",
        "rollback_step_orders_form_contiguous_sequence",
        "every_rollback_step_records_its_action",
        "every_rollback_step_records_post_step_verification",
        "no_rollback_step_label_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "release-pack-changelog-seal-rollback",
        "atom_version": "0.1.0",
        "release_label": manifest.get("release_label"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "changelog_entries_count": entries_count,
        "changelog_entries_without_summary": entries_without_summary,
        "changelog_entries_with_unrecognised_category":
            entries_with_unrecognised_category,
        "changelog_entries_filed_under_other_version":
            entries_filed_under_other_version,
        "duplicate_changelog_entry_headings": duplicate_entry_headings,
        "changelog_summary_coverage": _fmt6(summary_coverage),
        "recognised_category_coverage": _fmt6(recognised_category_coverage),
        "sealed_artifacts_count": artifacts_count,
        "sealed_artifacts_with_malformed_checksum":
            artifacts_with_malformed_checksum,
        "sealed_artifacts_without_signature": artifacts_without_signature,
        "duplicate_sealed_artifact_filenames":
            duplicate_artifact_filenames,
        "checksum_format_coverage": _fmt6(checksum_format_coverage),
        "signature_coverage": _fmt6(signature_coverage),
        "rollback_steps_count": steps_count,
        "rollback_steps_without_action": steps_without_action,
        "rollback_steps_without_verification": steps_without_verification,
        "duplicate_rollback_step_labels": duplicate_step_labels,
        "rollback_action_coverage": _fmt6(action_coverage),
        "rollback_verification_coverage": _fmt6(verification_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "RELEASE PACK CHANGELOG SEAL ROLLBACK",
        f"release_label: {verdict.get('release_label')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: release_pack_changelog_seal_rollback.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
