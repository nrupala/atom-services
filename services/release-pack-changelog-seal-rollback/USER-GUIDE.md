# Release pack changelog seal rollback — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are shipping a release — its version stamp, its changelog pack, its sealed artifacts, its tag, its rollback sequence and its staged rollout — and you have a declared record of that release pack, made from the pack's actual changelog, seal and rollback artefacts. This atom reads one declared manifest and returns one deterministic verdict across seven sections (version_stamp_and_bump_classification, changelog_pack_completeness, seal_manifest_integrity, tag_signature_and_attachment, rollback_sequence_detail, staged_rollout_and_health_record, pack_red_lines): **RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY**, **RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 41 checks. It audits the declared release-pack record's completeness, declared-checksum format and internal consistency only — it fetches no release, downloads or hashes no real artifact, verifies no real signature cryptographically, executes no rollback, and does not verify that any declared fact was ever carried out. A pack is ready *on your declared evidence*: a record that declares well-formed checksums, a signed tag and a contiguous rollback sequence passes those checks even if the real release did none of it. The checksum work is format-only — a declared sha256 string of 64 hex digits passes whether or not it is the hash of anything. It is not a release system, a provenance verifier, or a guarantee that the release is safe to ship: it never judges whether a declared checksum corresponds to a real artifact, whether a recorded signature is valid, whether the rollback sequence would actually work, or whether the changelog summaries are true — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared version must be well-formed semver (`MAJOR.MINOR.PATCH`, no leading zeros), must advance from the declared previous version, and the declared bump kind must match the declared delta exactly (major: major+1 with minor/patch reset to 0; minor: minor+1 with patch reset to 0; patch: patch+1), and a pack declaring a breaking change must declare a major bump; the declared `changelog_entries` list must be present and non-empty; every entry's `entry_category` must be one of the Keep-a-Changelog categories (Added, Changed, Deprecated, Removed, Fixed, Security); every entry must declare `entry_summary_present` true and its `entry_version_heading` must equal the declared pack version; no entry heading may be duplicated; the declared `sealed_artifacts` list must be present and non-empty; every artifact's `checksum_value` must match the format of the algorithm declared on its own row (sha256: exactly 64 hex digits; sha512: exactly 128 hex digits — any other declared algorithm fails the format check as unrecognised); every artifact must declare `signature_recorded` true; no artifact filename may be duplicated; the seal record's `declared_sealed_artifact_total` must equal the number of declared sealed-artifact rows; the declared `rollback_steps` list must be present and non-empty; the declared `step_order` values, sorted, must be exactly 1..n (the rows themselves may be declared in any order); every step must declare `step_action_recorded` and `step_verification_recorded` true; and no step label may be duplicated. No outside threshold is imported — no minimum changelog-entry count beyond the pack's own non-empty list and no per-category entry quota; no mandated checksum algorithm (only format-matching the algorithm the row itself declares is checked); no signature scheme, key length or signer-identity bar (only that a signature is recorded per artifact is checked); no rollback-step count beyond non-empty, no per-step duration and no rollback time budget; no canary or staged-rollout percentage or stage count; the skill's 24–48h post-release health window is not imposed as a numeric range here (only that a defined window is stated in the pack is checked — the range itself is a readiness bar owned by `release-readiness-verdict`); no version-bump location count (the bump-in-exactly-one-place rule is likewise a readiness-verdict bar, not re-checked here); and no release cadence or pack size bar. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "release-pack-changelog-seal-rollback"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/release-pack-changelog-seal-rollback` — tool name `release_pack_changelog_seal_rollback`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/release-pack-changelog-seal-rollback` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `release_label` (string) | Release label (carried into the output, not checked) |
| `version_detail.declared_version` (string) | computed: must be well-formed semver, advance from the previous version, and match the declared bump kind |
| `version_detail.previous_version` (string) | the semver delta base the declared version advances from |
| `version_detail.bump_kind` (string) | computed: `major`, `minor` or `patch`; must match the declared version delta exactly, and must be `major` when a breaking change is declared |
| `version_detail.breaking_change_in_pack` | version evidence: the pack declares a breaking change |
| `changelog_pack.keep_a_changelog_layout_followed` | changelog evidence: the pack follows the Keep-a-Changelog layout |
| `changelog_pack.unreleased_backlog_maintained_continuously` | changelog evidence: the [Unreleased] backlog is maintained continuously |
| `changelog_pack.pack_release_notes_state_why_changes_matter` | release-notes evidence: the pack's notes state why the changes matter |
| `changelog_pack.pack_breaking_items_pair_migration_steps` | release-notes evidence: breaking items are paired with migration steps |
| `changelog_entries` (list of changelog-entry row objects) | computed: must be present and non-empty; reported as `changelog_entries_count` |
| `changelog_entries[].entry_heading` (string) | names the row in the computed outputs; computed: no heading may appear on more than one row |
| `changelog_entries[].entry_category` (string) | computed: must be a Keep-a-Changelog category (Added, Changed, Deprecated, Removed, Fixed, Security) |
| `changelog_entries[].entry_summary_present` | computed: must be `true` per row |
| `changelog_entries[].entry_version_heading` (string) | computed: must equal `version_detail.declared_version` per row |
| `seal_record.pack_artifacts_hashed_and_signed_declared` | seal evidence: the pack's artifacts are declared hashed and signed |
| `seal_record.seal_manifest_generated_from_build_outputs` | seal evidence: the seal manifest is generated from the build outputs |
| `seal_record.declared_sealed_artifact_total` (number) | computed: must equal the number of declared sealed-artifact rows |
| `sealed_artifacts` (list of sealed-artifact row objects) | computed: must be present and non-empty; reported as `sealed_artifacts_count` |
| `sealed_artifacts[].artifact_filename` (string) | names the row in the computed outputs; computed: no filename may appear on more than one row |
| `sealed_artifacts[].checksum_algorithm` (string) | the algorithm the row declares (`sha256` or `sha512` for the format check) |
| `sealed_artifacts[].checksum_value` (string) | computed: hex format checked against the declared algorithm (sha256: 64 hex digits; sha512: 128 hex digits) — format only |
| `sealed_artifacts[].signature_recorded` | computed: must be `true` per row (the record is checked, never the signature itself) |
| `tag_and_attachment.pack_tag_created_as_annotated` | tag evidence: the pack's tag is created as an annotated tag |
| `tag_and_attachment.pack_tag_signature_recorded_when_signing_key_exists` | tag evidence: the tag signature is recorded when a signing key exists |
| `tag_and_attachment.seal_manifest_attached_to_pack_record` | seal evidence: the seal manifest is attached to the pack record |
| `tag_and_attachment.signature_file_attached_to_pack_record` | seal evidence: the signature file is attached to the pack record |
| `tag_and_attachment.pack_checksums_rechecked_before_announcement` | seal evidence: checksums are rechecked before announcement |
| `rollback_detail.rollback_path_written_before_rollout_began` | rollback evidence: the rollback path was written before rollout began |
| `rollback_detail.rollback_sequence_is_executable_as_written` | rollback evidence: the rollback sequence is executable as written |
| `rollback_detail.rollback_trigger_conditions_named_in_pack` | rollback evidence: the rollback trigger conditions are named in the pack |
| `rollback_steps` (list of rollback-step row objects) | computed: must be present and non-empty; reported as `rollback_steps_count` |
| `rollback_steps[].step_label` (string) | names the row in the computed outputs; computed: no label may appear on more than one row |
| `rollback_steps[].step_order` (number) | computed: the declared orders must form exactly 1..n |
| `rollback_steps[].step_action_recorded` | computed: must be `true` per row |
| `rollback_steps[].step_verification_recorded` | computed: must be `true` per row |
| `rollout_record.rollout_staging_or_canary_declared_for_pack` | rollout evidence: a staging or canary rollout is declared for the pack |
| `rollout_record.rollout_approver_recorded_for_pack` | rollout evidence: a rollout approver is recorded for the pack |
| `rollout_record.defined_health_window_stated_for_pack` | rollout evidence: a defined health window is stated for the pack |
| `rollout_record.post_release_health_verification_completed_for_pack` | rollout evidence: post-release health verification is completed for the pack |
| `rollout_record.post_release_discrepancies_logged_for_pack` | rollout evidence: post-release discrepancies are logged for the pack |
| `red_lines.untagged_pack_release_present` | must be `false` to pass (red line: no untagged pack release) |
| `red_lines.published_history_rewrite_present` | must be `false` to pass (red line: no published-history rewrite) |
| `red_lines.unattended_pack_deploy_present` | must be `false` to pass (red line: no unattended pack deploy) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/release-pack-changelog-seal-rollback`:

```json
{
  "release_label": "v1.1.0",
  "version_detail": {
    "declared_version": "1.1.0",
    "previous_version": "1.0.0",
    "bump_kind": "minor",
    "breaking_change_in_pack": false
  },
  "changelog_pack": {
    "keep_a_changelog_layout_followed": true,
    "unreleased_backlog_maintained_continuously": true,
    "pack_release_notes_state_why_changes_matter": true,
    "pack_breaking_items_pair_migration_steps": true
  },
  "changelog_entries": [
    {
      "entry_heading": "Added feature X",
      "entry_category": "Added",
      "entry_summary_present": true,
      "entry_version_heading": "1.1.0"
    }
  ],
  "seal_record": {
    "pack_artifacts_hashed_and_signed_declared": true,
    "seal_manifest_generated_from_build_outputs": true,
    "declared_sealed_artifact_total": 1
  },
  "sealed_artifacts": [
    {
      "artifact_filename": "bin.tar.gz",
      "checksum_algorithm": "sha256",
      "checksum_value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "signature_recorded": true
    }
  ],
  "tag_and_attachment": {
    "pack_tag_created_as_annotated": true,
    "pack_tag_signature_recorded_when_signing_key_exists": true,
    "seal_manifest_attached_to_pack_record": true,
    "signature_file_attached_to_pack_record": true,
    "pack_checksums_rechecked_before_announcement": true
  },
  "rollback_detail": {
    "rollback_path_written_before_rollout_began": true,
    "rollback_sequence_is_executable_as_written": true,
    "rollback_trigger_conditions_named_in_pack": true
  },
  "rollback_steps": [
    {
      "step_label": "Restore DB",
      "step_order": 1,
      "step_action_recorded": true,
      "step_verification_recorded": true
    }
  ],
  "rollout_record": {
    "rollout_staging_or_canary_declared_for_pack": true,
    "rollout_approver_recorded_for_pack": true,
    "defined_health_window_stated_for_pack": true,
    "post_release_health_verification_completed_for_pack": true,
    "post_release_discrepancies_logged_for_pack": true
  },
  "red_lines": {
    "untagged_pack_release_present": false,
    "published_history_rewrite_present": false,
    "unattended_pack_deploy_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 41 checks and a text stamp of the verdict):

```json
{
  "service": "release-pack-changelog-seal-rollback",
  "atom_version": "0.1.0",
  "release_label": "v1.1.0",
  "verdict": "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY",
  "sections": {
    "version_stamp_and_bump_classification": "pass",
    "changelog_pack_completeness": "pass",
    "seal_manifest_integrity": "pass",
    "tag_signature_and_attachment": "pass",
    "rollback_sequence_detail": "pass",
    "staged_rollout_and_health_record": "pass",
    "pack_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "changelog_entries_count": 1,
  "changelog_entries_without_summary": [],
  "changelog_entries_with_unrecognised_category": [],
  "changelog_entries_filed_under_other_version": [],
  "duplicate_changelog_entry_headings": [],
  "changelog_summary_coverage": "1.000000",
  "recognised_category_coverage": "1.000000",
  "sealed_artifacts_count": 1,
  "sealed_artifacts_with_malformed_checksum": [],
  "sealed_artifacts_without_signature": [],
  "duplicate_sealed_artifact_filenames": [],
  "checksum_format_coverage": "1.000000",
  "signature_coverage": "1.000000",
  "rollback_steps_count": 1,
  "rollback_steps_without_action": [],
  "rollback_steps_without_verification": [],
  "duplicate_rollback_step_labels": [],
  "rollback_action_coverage": "1.000000",
  "rollback_verification_coverage": "1.000000",
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across seven sections."
}
```

## Verdicts

- **RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY** — every check passes; the declared release-pack record is complete, format-valid and internally consistent with the skill's checklist and red lines.
- **RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the nineteen computed checks cannot be completed), the counts `changelog_entries_count`, `sealed_artifacts_count` and `rollback_steps_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `changelog_entries_without_summary`, `changelog_entries_with_unrecognised_category`, `changelog_entries_filed_under_other_version` (null when the declared version is not declared), `sealed_artifacts_with_malformed_checksum`, `sealed_artifacts_without_signature`, `rollback_steps_without_action` and `rollback_steps_without_verification` (rows whose field is present but not true / not valid; a row with the field absent is missing evidence and does not appear; each list is null when its declared list is not declared), the duplicate lists `duplicate_changelog_entry_headings`, `duplicate_sealed_artifact_filenames` and `duplicate_rollback_step_labels` (names declared on more than one row, in the order their second occurrence appears), and the coverage ratios `changelog_summary_coverage`, `recognised_category_coverage`, `checksum_format_coverage`, `signature_coverage`, `rollback_action_coverage` and `rollback_verification_coverage` (each null when its denominator list is absent or empty). Computed ratios are strings with exactly six decimal places (round half up to 6dp: `floor(v * 1000000 + 0.5) / 1000000`, then formatted with exactly six decimals).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
