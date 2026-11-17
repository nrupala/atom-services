# Release pack changelog seal rollback — documentation

**Release pack changelog seal rollback** · slug `release-pack-changelog-seal-rollback` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

The atom audits a caller-declared software release-pack record — its changelog, its sealed artifacts and its rollback plan — for completeness, declared-checksum format and internal consistency only. It surfaces two faces: REST `POST /v1/release-pack-changelog-seal-rollback` and MCP `POST /mcp/release-pack-changelog-seal-rollback`. Pricing rate is `null` — free during trial.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/release-pack-changelog-seal-rollback/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the release label `v1.1.0`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "release-pack-changelog-seal-rollback"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the release-pack manifest.** You declare a record of one release pack, made from the pack's actual changelog, seal and rollback artefacts — the atom audits the declared record, it does not fetch the release, hash any artifact or execute any rollback (see Explanation). The recorded full-pass manifest declares the release label `v1.1.0`: version `1.1.0` advancing from previous `1.0.0` with bump kind `minor` and no breaking change declared; all four changelog-pack flags `true`; one changelog entry `Added feature X` (category `Added`, summary present, filed under version heading `1.1.0`); the seal record's two flags `true` with declared sealed-artifact total `1`; one sealed artifact `bin.tar.gz` (algorithm `sha256`, a 64-hex-digit checksum value, signature recorded); all five tag-and-attachment flags `true`; all three rollback-detail flags `true`; one rollback step `Restore DB` (order `1`, action and post-step verification recorded); all five rollout-record flags `true`; and all three red-line flags `false` (no untagged pack release, no published-history rewrite, no unattended pack deploy).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/release-pack-changelog-seal-rollback` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY`: "41 pass, 0 fail, 0 missing of 41 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `changelog_entries_count` is 1, `sealed_artifacts_count` is 1, `rollback_steps_count` is 1, and `changelog_summary_coverage`, `recognised_category_coverage`, `checksum_format_coverage`, `signature_coverage`, `rollback_action_coverage` and `rollback_verification_coverage` are each `"1.000000"`, with every row-name and duplicate list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete, format-valid and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "release-pack-changelog-seal-rollback"}`.
3. Call: `POST https://atoms.pipavia.com/v1/release-pack-changelog-seal-rollback` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/release-pack-changelog-seal-rollback` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `release_pack_changelog_seal_rollback`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_changelog_entry_uses_recognised_category`, `every_sealed_artifact_checksum_matches_declared_algorithm_format`, `rollback_step_orders_form_contiguous_sequence`, and the summary reads "38 pass, 3 fail, 0 missing of 41 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `changelog_entries[0].entry_category` is declared `InvalidCategory`, failing `every_changelog_entry_uses_recognised_category`, with `changelog_entries_with_unrecognised_category` naming `["Added feature X"]` and `recognised_category_coverage` `"0.000000"`; `sealed_artifacts[0].checksum_value` is declared `short`, failing `every_sealed_artifact_checksum_matches_declared_algorithm_format` — a declared `sha256` checksum must be exactly 64 hex digits — with `sealed_artifacts_with_malformed_checksum` naming `["bin.tar.gz"]` and `checksum_format_coverage` `"0.000000"`; and `rollback_steps[0].step_order` is declared `5`, failing `rollback_step_orders_form_contiguous_sequence` — a single declared step must be order `1`, the declared orders forming exactly 1..n; sections `changelog_pack_completeness`, `seal_manifest_integrity` and `rollback_sequence_detail` report `fail`, the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "version_detail",
  "detail": "version_detail must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/release-pack-changelog-seal-rollback` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/release-pack-changelog-seal-rollback` — tool name `release_pack_changelog_seal_rollback`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `release_pack_changelog_seal_rollback` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `release_label`, the version / bump-kind / category / heading / filename / algorithm / checksum / label string fields are noted as strings, `seal_record.declared_sealed_artifact_total` and `rollback_steps[].step_order` as numbers, and `changelog_entries`, `sealed_artifacts` and `rollback_steps` as lists there. Where SERVICE.md states no type — the section container objects (`version_detail`, `changelog_pack`, `seal_record`, `tag_and_attachment`, `rollback_detail`, `rollout_record`, `red_lines`) and the row objects (`changelog_entries[]`, `sealed_artifacts[]`, `rollback_steps[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `changelog_entries`, `sealed_artifacts` and `rollback_steps` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `release_label` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: version_stamp_and_bump_classification

| Field | Type | Notes |
|---|---|---|
| `version_detail` | object | The version-detail section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `version_detail.declared_version` | string | Semver-checked, computed, see below (type stated in SERVICE.md) |
| `version_detail.previous_version` | string | The semver delta base, computed, see below (type stated in SERVICE.md) |
| `version_detail.bump_kind` | string | `major` / `minor` / `patch`, computed, see below (type stated in SERVICE.md) |
| `version_detail.breaking_change_in_pack` | boolean | — |

#### Read by: changelog_pack_completeness

| Field | Type | Notes |
|---|---|---|
| `changelog_pack` | object | The changelog-pack section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `changelog_pack.keep_a_changelog_layout_followed` | boolean | — |
| `changelog_pack.unreleased_backlog_maintained_continuously` | boolean | — |
| `changelog_pack.pack_release_notes_state_why_changes_matter` | boolean | — |
| `changelog_pack.pack_breaking_items_pair_migration_steps` | boolean | — |
| `changelog_entries` | list | list of changelog-entry-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `changelog_entries[]` | object | One declared changelog entry row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `changelog_entries[].entry_heading` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `changelog_entries[].entry_category` | string | Must be a Keep-a-Changelog category (type stated in SERVICE.md) |
| `changelog_entries[].entry_summary_present` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `changelog_entries[].entry_version_heading` | string | Must equal `version_detail.declared_version` per row (type stated in SERVICE.md) |

#### Read by: seal_manifest_integrity

| Field | Type | Notes |
|---|---|---|
| `seal_record` | object | The seal-record section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `seal_record.pack_artifacts_hashed_and_signed_declared` | boolean | — |
| `seal_record.seal_manifest_generated_from_build_outputs` | boolean | — |
| `seal_record.declared_sealed_artifact_total` | number | Must equal the declared artifact-row count, computed, see below (type stated in SERVICE.md) |
| `sealed_artifacts` | list | list of sealed-artifact-row objects, each with the artifact fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `sealed_artifacts[]` | object | One declared sealed artifact row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `sealed_artifacts[].artifact_filename` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `sealed_artifacts[].checksum_algorithm` | string | `sha256` or `sha512` for the format check (type stated in SERVICE.md) |
| `sealed_artifacts[].checksum_value` | string | Hex format checked against the declared algorithm (type stated in SERVICE.md) |
| `sealed_artifacts[].signature_recorded` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: tag_signature_and_attachment

| Field | Type | Notes |
|---|---|---|
| `tag_and_attachment` | object | The tag-and-attachment section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tag_and_attachment.pack_tag_created_as_annotated` | boolean | — |
| `tag_and_attachment.pack_tag_signature_recorded_when_signing_key_exists` | boolean | — |
| `tag_and_attachment.seal_manifest_attached_to_pack_record` | boolean | — |
| `tag_and_attachment.signature_file_attached_to_pack_record` | boolean | — |
| `tag_and_attachment.pack_checksums_rechecked_before_announcement` | boolean | — |

#### Read by: rollback_sequence_detail

| Field | Type | Notes |
|---|---|---|
| `rollback_detail` | object | The rollback-detail section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `rollback_detail.rollback_path_written_before_rollout_began` | boolean | — |
| `rollback_detail.rollback_sequence_is_executable_as_written` | boolean | — |
| `rollback_detail.rollback_trigger_conditions_named_in_pack` | boolean | — |
| `rollback_steps` | list | list of rollback-step-row objects, each with the step fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `rollback_steps[]` | object | One declared rollback step row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `rollback_steps[].step_label` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `rollback_steps[].step_order` | number | The declared orders must form 1..n, computed, see below (type stated in SERVICE.md) |
| `rollback_steps[].step_action_recorded` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `rollback_steps[].step_verification_recorded` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: staged_rollout_and_health_record

| Field | Type | Notes |
|---|---|---|
| `rollout_record` | object | The rollout-record section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `rollout_record.rollout_staging_or_canary_declared_for_pack` | boolean | — |
| `rollout_record.rollout_approver_recorded_for_pack` | boolean | — |
| `rollout_record.defined_health_window_stated_for_pack` | boolean | — |
| `rollout_record.post_release_health_verification_completed_for_pack` | boolean | — |
| `rollout_record.post_release_discrepancies_logged_for_pack` | boolean | — |

#### Read by: pack_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.untagged_pack_release_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.published_history_rewrite_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unattended_pack_deploy_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 41 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: version_stamp_and_bump_classification

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pack_version_is_wellformed_semver` | semver: the pack's declared version is well-formed MAJOR.MINOR.PATCH semver | Computed over the declared record. Pass: the declared `version_detail.declared_version` is well-formed semver (`MAJOR.MINOR.PATCH`, no leading zeros). Fail: the declared version is present but not well-formed. Missing: the field is absent. |
| `pack_version_advances_from_previous_declared_version` | semver: the pack's declared version advances from the declared previous version | Computed over the declared record. Pass: the declared version advances from the declared `version_detail.previous_version`. Fail: both versions are declared but the declared version does not advance. Missing: either version field is absent. |
| `pack_bump_kind_matches_version_delta` | semver: the declared bump kind matches the declared version delta — major resets minor/patch, minor resets patch, patch increments patch only | Computed over the declared record. Pass: the declared `version_detail.bump_kind` matches the declared delta exactly (major: major+1 with minor/patch reset to 0; minor: minor+1 with patch reset to 0; patch: patch+1). Fail: the declared bump kind does not match the declared delta. Missing: the declared version, the previous version or the bump kind is absent. |
| `pack_bump_kind_follows_declared_breaking_flag` | semver: a pack declaring a breaking change declares a major bump — MAJOR means breaking | Computed over the declared record. Pass: no breaking change is declared, or a breaking change is declared with a `major` bump. Fail: `version_detail.breaking_change_in_pack` is declared `true` but the declared bump kind is not `major`. Missing: the breaking-change flag or the bump kind is absent. |

#### Section: changelog_pack_completeness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `keep_a_changelog_layout_followed` | changelog: the pack follows the Keep-a-Changelog layout | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unreleased_backlog_maintained_continuously` | changelog: the [Unreleased] backlog is maintained continuously, not reconstructed at release time | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pack_release_notes_state_why_changes_matter` | release notes: the pack's user-facing notes state what changed and why it matters | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pack_breaking_items_pair_migration_steps` | release notes: the pack's breaking items are paired with migration steps in the notes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `changelog_entry_rows_declared` | changelog: the pack declares its changelog entry rows — the list is present and non-empty; a release pack ships at least one changelog entry | Computed over the declared record. Pass: the `changelog_entries` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_changelog_entry_uses_recognised_category` | changelog entries: every declared entry's category is a Keep-a-Changelog category (Added / Changed / Deprecated / Removed / Fixed / Security) | Computed over the declared record. Pass: every declared entry's `entry_category` is one of Added, Changed, Deprecated, Removed, Fixed, Security. Fail: a row declares any other value (offending rows are named in `changelog_entries_with_unrecognised_category`). Missing: the list is absent, or a row has `entry_category` absent. |
| `every_changelog_entry_carries_summary` | changelog entries: every declared entry carries a summary of the change | Computed over the declared record. Pass: every declared entry row declares `entry_summary_present` `true`. Fail: a row declares it present but not `true` (offending rows are named in `changelog_entries_without_summary`). Missing: the list is absent, or a row has the field absent. |
| `every_changelog_entry_filed_under_pack_version` | changelog entries: every declared entry is filed under the pack's declared version heading — entries moved under the version at release | Computed over the declared record. Pass: every declared entry's `entry_version_heading` equals the declared pack version. Fail: a row's heading is present but differs from the declared version (offending rows are named in `changelog_entries_filed_under_other_version`). Missing: the list is absent, a row has the field absent, or the declared version is absent. |
| `no_changelog_entry_heading_duplicated` | changelog entries: no declared entry heading is owned by more than one row | Computed over the declared record. Pass: no declared `entry_heading` appears on more than one row. Fail: a heading is declared on more than one row (duplicates are named in `duplicate_changelog_entry_headings`). Missing: the list is absent, or a row has `entry_heading` absent. |

#### Section: seal_manifest_integrity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pack_artifacts_hashed_and_signed_declared` | seal: the pack declares its build artifacts hashed and signed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `seal_manifest_generated_from_build_outputs` | seal: the pack's seal manifest is generated from the build outputs it seals | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sealed_artifact_rows_declared` | seal: the pack declares its sealed artifact rows — the list is present and non-empty; the skill seals build artifacts | Computed over the declared record. Pass: the `sealed_artifacts` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_sealed_artifact_checksum_matches_declared_algorithm_format` | sealed artifacts: every declared checksum matches the format of the algorithm declared on its row (sha256: 64 hex digits; sha512: 128 hex digits) — format only; no real artifact is hashed here | Computed over the declared record. Pass: every declared artifact's `checksum_value` matches the format of the algorithm declared on its own row (sha256: exactly 64 hex digits; sha512: exactly 128 hex digits). Fail: a row's checksum is present but does not match its declared algorithm's format, or the declared algorithm is not one the format check knows (offending rows are named in `sealed_artifacts_with_malformed_checksum`). Missing: the list is absent, or a row has `checksum_value` or `checksum_algorithm` absent. |
| `every_sealed_artifact_signature_recorded` | sealed artifacts: every declared artifact records its signature in the pack | Computed over the declared record. Pass: every declared artifact row declares `signature_recorded` `true`. Fail: a row declares it present but not `true` (offending rows are named in `sealed_artifacts_without_signature`). Missing: the list is absent, or a row has the field absent. |
| `no_sealed_artifact_filename_duplicated` | sealed artifacts: no declared artifact filename is owned by more than one row | Computed over the declared record. Pass: no declared `artifact_filename` appears on more than one row. Fail: a filename is declared on more than one row (duplicates are named in `duplicate_sealed_artifact_filenames`). Missing: the list is absent, or a row has `artifact_filename` absent. |
| `seal_artifact_count_matches_pack_manifest_total` | seal: the seal record's declared artifact total equals the number of declared sealed artifact rows | Computed over the declared record. Pass: `seal_record.declared_sealed_artifact_total` equals the number of declared sealed-artifact rows. Fail: the total is declared but differs from the row count. Missing: the total is absent, or the `sealed_artifacts` list is absent. |

#### Section: tag_signature_and_attachment

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pack_tag_created_as_annotated` | tag: the pack's release tag is created as an annotated tag | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pack_tag_signature_recorded_when_signing_key_exists` | tag: the pack records the tag as signed when signing keys exist | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `seal_manifest_attached_to_pack_record` | seal: the manifest is attached to the pack's release record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `signature_file_attached_to_pack_record` | seal: the signature file is attached to the pack's release record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pack_checksums_rechecked_before_announcement` | seal: the pack's checksums and signature are rechecked before the release is announced | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: rollback_sequence_detail

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `rollback_path_written_before_rollout_began` | rollback: the pack's rollback path was written before the rollout began | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollback_sequence_is_executable_as_written` | rollback: the pack's rollback sequence is executable as written — the plan is testable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollback_trigger_conditions_named_in_pack` | rollback: the pack names the conditions that trigger a rollback | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollback_step_rows_declared` | rollback: the pack declares its rollback step rows — the list is present and non-empty; a rollback path has at least one step | Computed over the declared record. Pass: the `rollback_steps` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `rollback_step_orders_form_contiguous_sequence` | rollback steps: the declared step orders form the contiguous sequence 1..n — no gaps, no repeats | Computed over the declared record. Pass: the declared `step_order` values, sorted, are exactly 1..n (the rows themselves may be declared in any order). Fail: the declared orders are present but have gaps or repeats. Missing: the list is absent, or a row has `step_order` absent. |
| `every_rollback_step_records_its_action` | rollback steps: every declared step records the action it performs | Computed over the declared record. Pass: every declared step row declares `step_action_recorded` `true`. Fail: a row declares it present but not `true` (offending rows are named in `rollback_steps_without_action`). Missing: the list is absent, or a row has the field absent. |
| `every_rollback_step_records_post_step_verification` | rollback steps: every declared step records how its effect is verified after the step runs | Computed over the declared record. Pass: every declared step row declares `step_verification_recorded` `true`. Fail: a row declares it present but not `true` (offending rows are named in `rollback_steps_without_verification`). Missing: the list is absent, or a row has the field absent. |
| `no_rollback_step_label_duplicated` | rollback steps: no declared step label is owned by more than one row | Computed over the declared record. Pass: no declared `step_label` appears on more than one row. Fail: a label is declared on more than one row (duplicates are named in `duplicate_rollback_step_labels`). Missing: the list is absent, or a row has `step_label` absent. |

#### Section: staged_rollout_and_health_record

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `rollout_staging_or_canary_declared_for_pack` | rollout: the pack declares a canary or staged rollout where feasible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rollout_approver_recorded_for_pack` | rollout: the pack's rollout record names its approver | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `defined_health_window_stated_for_pack` | post-release: the pack states a defined health verification window | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `post_release_health_verification_completed_for_pack` | post-release: the pack records the post-release health verification as done | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `post_release_discrepancies_logged_for_pack` | post-release: the pack logs discrepancies and records the loops closed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: pack_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_untagged_pack_release_in_record` | red line: no untagged release of the pack is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_published_history_rewrite_in_record` | red line: no rewritten history on a published branch is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unattended_pack_deploy_in_record` | red line: no deploy of the pack without human approval is present in the record — deploys stay HITL | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"release-pack-changelog-seal-rollback"`), `atom_version` (`"0.1.0"`), and `release_label` (the manifest's declared release label value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `changelog_entries_count`, `sealed_artifacts_count` and `rollback_steps_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `changelog_entries_without_summary`, `changelog_entries_with_unrecognised_category`, `changelog_entries_filed_under_other_version` (null when the declared version is not declared), `sealed_artifacts_with_malformed_checksum`, `sealed_artifacts_without_signature`, `rollback_steps_without_action` and `rollback_steps_without_verification` (rows whose field is present but not true / not valid; a row with the field absent is missing evidence and does not appear; each list is null when its declared list is not declared, as recorded in the sparse case); the duplicate lists `duplicate_changelog_entry_headings`, `duplicate_sealed_artifact_filenames` and `duplicate_rollback_step_labels` (names declared on more than one row, in the order their second occurrence appears; null when the declared list is not declared, as recorded in the sparse case); and the ratios `changelog_summary_coverage`, `recognised_category_coverage`, `checksum_format_coverage`, `signature_coverage`, `rollback_action_coverage` and `rollback_verification_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "41 pass, 0 fail, 0 missing of 41 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared release label value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY` — all 41 checks pass: the declared release-pack record is complete, format-valid and internally consistent with the bound skill's checklist, quality gates and red lines.
- `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the nineteen computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `computed_status`, `changelog_entries_count`, `sealed_artifacts_count`, `rollback_steps_count`, `changelog_entries_without_summary`, `changelog_entries_with_unrecognised_category`, `changelog_entries_filed_under_other_version`, `duplicate_changelog_entry_headings`, `changelog_summary_coverage`, `recognised_category_coverage`, `sealed_artifacts_with_malformed_checksum`, `sealed_artifacts_without_signature`, `duplicate_sealed_artifact_filenames`, `checksum_format_coverage`, `signature_coverage`, `rollback_steps_without_action`, `rollback_steps_without_verification`, `duplicate_rollback_step_labels`, `rollback_action_coverage` and `rollback_verification_coverage` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"version_detail","detail":"version_detail must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Ship releases safely — semver, changelogs, signed tags, rollout and rollback plans, sealed release provenance (the bound capability, from the skill). You submit one declared record — the release-pack manifest, made from the pack's actual changelog, seal and rollback artefacts — and the atom audits that record for completeness, declared-checksum format and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`version_stamp_and_bump_classification`, `changelog_pack_completeness`, `seal_manifest_integrity`, `tag_signature_and_attachment`, `rollback_sequence_detail`, `staged_rollout_and_health_record`, `pack_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and fields themselves — the declared version must be well-formed semver, must advance from the declared previous version, and the declared bump kind must match the declared delta exactly, with a declared breaking change requiring a major bump; the `changelog_entries`, `sealed_artifacts` and `rollback_steps` lists must each be present and non-empty; every changelog entry's category must be a Keep-a-Changelog category, every entry must declare a summary and be filed under the declared pack version, and no entry heading may be duplicated; every sealed artifact's declared checksum string must match the format of the algorithm declared on its own row and record a signature, no artifact filename may be duplicated, and the seal record's declared total must equal the artifact row count; and the declared rollback step orders, sorted, must form exactly 1..n, every step must record its action and its post-step verification, and no step label may be duplicated — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**The checksum work is format-only.** The atom verifies the declared checksum *format* — that a declared `sha256` value is exactly 64 hex digits, a declared `sha512` value exactly 128 hex digits — and never the artifacts themselves: no real artifact is fetched, downloaded or hashed, no declared checksum is compared against any real file, and no recorded signature is verified cryptographically. A declared sha256 string of 64 hex digits passes whether or not it is the hash of anything, and any other declared algorithm fails the format check as unrecognised — it is not silently passed.

**Thresholds declined.** Declined, named: a minimum changelog-entry count beyond the pack's own non-empty list, or a per-category entry quota; a mandated checksum algorithm (only format-matching the algorithm the row itself declares is checked); a signature scheme, key length or signer-identity bar (only that a signature is recorded per artifact is checked); a rollback-step count beyond non-empty, a per-step duration, or a rollback time budget; a canary or staged-rollout percentage or stage count; the skill's 24–48h post-release health window as a numeric range (that range is the readiness verdict's bar in `release-readiness-verdict`; here only that a defined window is stated in the pack is checked); a version-bump location count (the skill's bump-in-exactly-one-place rule is likewise a readiness-verdict bar, not re-checked here); a release cadence or pack size bar. Quantities are computed and reported; the only bar on the computed rows is completeness, format and consistency over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** release-pack record: a verdict of `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY` means the record is complete, format-valid and internally consistent *on the caller's declared evidence* — a record that declares well-formed checksums, a signed tag and a contiguous rollback sequence passes those checks even if the real release did none of it. It is a completeness, format and consistency audit of the release-pack record the skill requires, **not a release system, a provenance verifier, a signing service, a release authority, or a guarantee that the release is safe to ship**. Specifically: it fetches no release, downloads or hashes no real artifact, verifies no real signature cryptographically, executes no rollback, and does not verify that any declared fact was ever carried out. It never judges whether a declared checksum corresponds to a real artifact, whether a recorded signature is valid, whether the rollback sequence would actually work, or whether the changelog summaries are true — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no live verification of any declared fact; no cryptographic verification of any checksum or signature beyond declared-string format; no judgment of record *quality* — whether the changelog entries describe the release well, whether the rollback steps are the right steps, or whether the staged rollout is prudent is the caller's declaration, checked only for declared presence, format and consistency; the skill's bump-in-exactly-one-place rule and its 24–48h health-window range are readiness bars owned by `release-readiness-verdict` and are not re-judged here.

**Distinct ground.** The nearest neighbour is `release-readiness-verdict`, which verdicts a release against five readiness bars from single boolean attestations and scalar fields. This atom shares zero check names with it: its ground is the pack's declared **rows** and the semver arithmetic between them — every changelog entry's category, summary and version filing with duplicate-heading detection; every sealed artifact's checksum format against its own declared algorithm, its signature record, and the seal manifest's declared total against the row count; every rollback step's contiguous 1..n ordering, recorded action and post-step verification with duplicate-label detection; and the declared version delta's exact match to the declared bump kind.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Shipping product releases safely (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete, format-valid and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared software release-pack record for completeness, declared-checksum format and internal consistency; it is not a release authority or a signing service, it verifies no real artifact or signature, and SERVICE.md's U-13 regulatory screen states outright ("No") that its output could not read as regulated professional advice — no engineering-practice, financial, legal, medical or psychology-adjacent advice; its subject is software release practice only. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `release_pack_changelog_seal_rollback` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/release_pack_changelog_seal_rollback.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_release_pack_changelog_seal_rollback.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/release-pack-changelog-seal-rollback` (REST) and `POST /mcp/release-pack-changelog-seal-rollback` (MCP, tool `release_pack_changelog_seal_rollback`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189; RC soak to 2026-11-22). Key scope: `release_pack_changelog_seal_rollback`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** many recorded check names are not the input field names they read. In `version_stamp_and_bump_classification` all four computed checks differ: `pack_version_is_wellformed_semver` reads `version_detail.declared_version`, `pack_version_advances_from_previous_declared_version` reads the `version_detail.declared_version` / `version_detail.previous_version` pair, `pack_bump_kind_matches_version_delta` reads the version pair plus `version_detail.bump_kind`, and `pack_bump_kind_follows_declared_breaking_flag` reads `version_detail.breaking_change_in_pack` plus the bump kind. In `changelog_pack_completeness` the computed checks `changelog_entry_rows_declared` reads the `changelog_entries` list, `every_changelog_entry_uses_recognised_category` reads the rows' `entry_category`, `every_changelog_entry_carries_summary` reads `entry_summary_present`, `every_changelog_entry_filed_under_pack_version` reads `entry_version_heading`, and `no_changelog_entry_heading_duplicated` reads `entry_heading` (the four `changelog_pack.*` checks match the leaf name of the field they read). In `seal_manifest_integrity`: `sealed_artifact_rows_declared` reads the `sealed_artifacts` list, `every_sealed_artifact_checksum_matches_declared_algorithm_format` reads the rows' `checksum_value` / `checksum_algorithm` pair, `every_sealed_artifact_signature_recorded` reads `signature_recorded`, `no_sealed_artifact_filename_duplicated` reads `artifact_filename`, and `seal_artifact_count_matches_pack_manifest_total` reads `seal_record.declared_sealed_artifact_total` against the row count (the two `seal_record.*` attestation checks match their leaf names). In `rollback_sequence_detail`: `rollback_step_rows_declared` reads the `rollback_steps` list, `rollback_step_orders_form_contiguous_sequence` reads the rows' `step_order`, `every_rollback_step_records_its_action` reads `step_action_recorded`, `every_rollback_step_records_post_step_verification` reads `step_verification_recorded`, and `no_rollback_step_label_duplicated` reads `step_label` (the three `rollback_detail.*` checks match their leaf names). In `pack_red_lines` all three recorded check names differ from their fields: `no_untagged_pack_release_in_record` (input `red_lines.untagged_pack_release_present`), `no_published_history_rewrite_in_record` (input `red_lines.published_history_rewrite_present`) and `no_unattended_pack_deploy_in_record` (input `red_lines.unattended_pack_deploy_present`). The `tag_signature_and_attachment` and `staged_rollout_and_health_record` check names match the leaf names of the fields they read. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`version_detail`, `changelog_pack`, `seal_record`, `tag_and_attachment`, `rollback_detail`, `rollout_record`, `red_lines`) or for a row object (`changelog_entries[]`, `sealed_artifacts[]`, `rollback_steps[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 41 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the three declared list-length counts, `changelog_entries_filed_under_other_version` (null when the declared version is not declared) and the coverage ratios, but does not state a null rule for the other row-name lists (`changelog_entries_without_summary`, `changelog_entries_with_unrecognised_category`, `sealed_artifacts_with_malformed_checksum`, `sealed_artifacts_without_signature`, `rollback_steps_without_action`, `rollback_steps_without_verification`) or for the duplicate lists (`duplicate_changelog_entry_headings`, `duplicate_sealed_artifact_filenames`, `duplicate_rollback_step_labels`). The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** three recorded sections each merge two input objects — `changelog_pack` and `changelog_entries` inputs are read by the single recorded section `changelog_pack_completeness`; `seal_record` and `sealed_artifacts` inputs by `seal_manifest_integrity`; and `rollback_detail` and `rollback_steps` inputs by `rollback_sequence_detail`. The other four sections map one-to-one (`version_detail` → `version_stamp_and_bump_classification`, `tag_and_attachment` → `tag_signature_and_attachment`, `rollout_record` → `staged_rollout_and_health_record`, `red_lines` → `pack_red_lines`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (8 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named four section labels instead of exact check names — `version_stamp_and_bump_classification`, `changelog_pack_completeness`, `seal_manifest_integrity` and `rollback_sequence_detail` (R1 ×4); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks`, their computed quantities appearing only in prose notes (R2 ×2); the designed violations input was a sparse partial manifest missing 30 key paths present in the full-pass manifest (R3 ×1); and the designed malformed input carried 2 type violations (`version_detail` as a string and `changelog_entries` as a string) instead of exactly one (R4 ×1). These are unscored design-stage prose divergences; the recorded responses govern.
8. **Deployment id not in evidence.json:** evidence.json records the gateway base, version (`1.1.0`) and health status, but no deployment id; the deployment id `b71b0351b5994d9da5dc7bebffcd3189` used in this document's header and Ops view is the one asserted in TEST-REPORT.md. No other source in the atom's record carries it.

## Worked examples

Provenance: recorded 2026-11-16T10:50:57.790759+00:00 against gateway v1.1.0, external-verification battery Wave 14, source `verification/work/release-pack-changelog-seal-rollback/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response body, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:50:57.790759+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/release-pack-changelog-seal-rollback/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_version_is_wellformed_semver",
      "status": "pass",
      "evidence": "semver: the pack's declared version is well-formed MAJOR.MINOR.PATCH semver"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_version_advances_from_previous_declared_version",
      "status": "pass",
      "evidence": "semver: the pack's declared version advances from the declared previous version"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_bump_kind_matches_version_delta",
      "status": "pass",
      "evidence": "semver: the declared bump kind matches the declared version delta \u2014 major resets minor/patch, minor resets patch, patch increments patch only"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_bump_kind_follows_declared_breaking_flag",
      "status": "pass",
      "evidence": "semver: a pack declaring a breaking change declares a major bump \u2014 MAJOR means breaking"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "keep_a_changelog_layout_followed",
      "status": "pass",
      "evidence": "changelog: the pack follows the Keep-a-Changelog layout"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "unreleased_backlog_maintained_continuously",
      "status": "pass",
      "evidence": "changelog: the [Unreleased] backlog is maintained continuously, not reconstructed at release time"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "pack_release_notes_state_why_changes_matter",
      "status": "pass",
      "evidence": "release notes: the pack's user-facing notes state what changed and why it matters"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "pack_breaking_items_pair_migration_steps",
      "status": "pass",
      "evidence": "release notes: the pack's breaking items are paired with migration steps in the notes"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "changelog_entry_rows_declared",
      "status": "pass",
      "evidence": "changelog: the pack declares its changelog entry rows \u2014 the list is present and non-empty; a release pack ships at least one changelog entry"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_uses_recognised_category",
      "status": "pass",
      "evidence": "changelog entries: every declared entry's category is a Keep-a-Changelog category (Added / Changed / Deprecated / Removed / Fixed / Security)"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_carries_summary",
      "status": "pass",
      "evidence": "changelog entries: every declared entry carries a summary of the change"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_filed_under_pack_version",
      "status": "pass",
      "evidence": "changelog entries: every declared entry is filed under the pack's declared version heading \u2014 entries moved under the version at release"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "no_changelog_entry_heading_duplicated",
      "status": "pass",
      "evidence": "changelog entries: no declared entry heading is owned by more than one row"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "pack_artifacts_hashed_and_signed_declared",
      "status": "pass",
      "evidence": "seal: the pack declares its build artifacts hashed and signed"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "seal_manifest_generated_from_build_outputs",
      "status": "pass",
      "evidence": "seal: the pack's seal manifest is generated from the build outputs it seals"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "sealed_artifact_rows_declared",
      "status": "pass",
      "evidence": "seal: the pack declares its sealed artifact rows \u2014 the list is present and non-empty; the skill seals build artifacts"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "every_sealed_artifact_checksum_matches_declared_algorithm_format",
      "status": "pass",
      "evidence": "sealed artifacts: every declared checksum matches the format of the algorithm declared on its row (sha256: 64 hex digits; sha512: 128 hex digits) \u2014 format only; no real artifact is hashed here"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "every_sealed_artifact_signature_recorded",
      "status": "pass",
      "evidence": "sealed artifacts: every declared artifact records its signature in the pack"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "no_sealed_artifact_filename_duplicated",
      "status": "pass",
      "evidence": "sealed artifacts: no declared artifact filename is owned by more than one row"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "seal_artifact_count_matches_pack_manifest_total",
      "status": "pass",
      "evidence": "seal: the seal record's declared artifact total equals the number of declared sealed artifact rows"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_tag_created_as_annotated",
      "status": "pass",
      "evidence": "tag: the pack's release tag is created as an annotated tag"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_tag_signature_recorded_when_signing_key_exists",
      "status": "pass",
      "evidence": "tag: the pack records the tag as signed when signing keys exist"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "seal_manifest_attached_to_pack_record",
      "status": "pass",
      "evidence": "seal: the manifest is attached to the pack's release record"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "signature_file_attached_to_pack_record",
      "status": "pass",
      "evidence": "seal: the signature file is attached to the pack's release record"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_checksums_rechecked_before_announcement",
      "status": "pass",
      "evidence": "seal: the pack's checksums and signature are rechecked before the release is announced"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_path_written_before_rollout_began",
      "status": "pass",
      "evidence": "rollback: the pack's rollback path was written before the rollout began"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_sequence_is_executable_as_written",
      "status": "pass",
      "evidence": "rollback: the pack's rollback sequence is executable as written \u2014 the plan is testable"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_trigger_conditions_named_in_pack",
      "status": "pass",
      "evidence": "rollback: the pack names the conditions that trigger a rollback"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_step_rows_declared",
      "status": "pass",
      "evidence": "rollback: the pack declares its rollback step rows \u2014 the list is present and non-empty; a rollback path has at least one step"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_step_orders_form_contiguous_sequence",
      "status": "pass",
      "evidence": "rollback steps: the declared step orders form the contiguous sequence 1..n \u2014 no gaps, no repeats"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "every_rollback_step_records_its_action",
      "status": "pass",
      "evidence": "rollback steps: every declared step records the action it performs"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "every_rollback_step_records_post_step_verification",
      "status": "pass",
      "evidence": "rollback steps: every declared step records how its effect is verified after the step runs"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "no_rollback_step_label_duplicated",
      "status": "pass",
      "evidence": "rollback steps: no declared step label is owned by more than one row"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "rollout_staging_or_canary_declared_for_pack",
      "status": "pass",
      "evidence": "rollout: the pack declares a canary or staged rollout where feasible"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "rollout_approver_recorded_for_pack",
      "status": "pass",
      "evidence": "rollout: the pack's rollout record names its approver"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "defined_health_window_stated_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack states a defined health verification window"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "post_release_health_verification_completed_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack records the post-release health verification as done"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "post_release_discrepancies_logged_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack logs discrepancies and records the loops closed"
    },
    {
      "section": "pack_red_lines",
      "check": "no_untagged_pack_release_in_record",
      "status": "pass",
      "evidence": "red line: no untagged release of the pack is present in the record"
    },
    {
      "section": "pack_red_lines",
      "check": "no_published_history_rewrite_in_record",
      "status": "pass",
      "evidence": "red line: no rewritten history on a published branch is present in the record"
    },
    {
      "section": "pack_red_lines",
      "check": "no_unattended_pack_deploy_in_record",
      "status": "pass",
      "evidence": "red line: no deploy of the pack without human approval is present in the record \u2014 deploys stay HITL"
    }
  ],
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
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across seven sections.",
  "stamp": "RELEASE PACK CHANGELOG SEAL ROLLBACK\nrelease_label: v1.1.0\nVERDICT: RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY\n  version_stamp_and_bump_classification        pass\n  changelog_pack_completeness                  pass\n  seal_manifest_integrity                      pass\n  tag_signature_and_attachment                 pass\n  rollback_sequence_detail                     pass\n  staged_rollout_and_health_record             pass\n  pack_red_lines                               pass\n41 pass, 0 fail, 0 missing of 41 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:50:57.790759+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/release-pack-changelog-seal-rollback/evidence.json`.

Input:

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
      "entry_category": "InvalidCategory",
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
      "checksum_value": "short",
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
      "step_order": 5,
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

Response (HTTP 200):

```json
{
  "service": "release-pack-changelog-seal-rollback",
  "atom_version": "0.1.0",
  "release_label": "v1.1.0",
  "verdict": "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY",
  "sections": {
    "version_stamp_and_bump_classification": "pass",
    "changelog_pack_completeness": "fail",
    "seal_manifest_integrity": "fail",
    "tag_signature_and_attachment": "pass",
    "rollback_sequence_detail": "fail",
    "staged_rollout_and_health_record": "pass",
    "pack_red_lines": "pass"
  },
  "checks": [
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_version_is_wellformed_semver",
      "status": "pass",
      "evidence": "semver: the pack's declared version is well-formed MAJOR.MINOR.PATCH semver"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_version_advances_from_previous_declared_version",
      "status": "pass",
      "evidence": "semver: the pack's declared version advances from the declared previous version"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_bump_kind_matches_version_delta",
      "status": "pass",
      "evidence": "semver: the declared bump kind matches the declared version delta \u2014 major resets minor/patch, minor resets patch, patch increments patch only"
    },
    {
      "section": "version_stamp_and_bump_classification",
      "check": "pack_bump_kind_follows_declared_breaking_flag",
      "status": "pass",
      "evidence": "semver: a pack declaring a breaking change declares a major bump \u2014 MAJOR means breaking"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "keep_a_changelog_layout_followed",
      "status": "pass",
      "evidence": "changelog: the pack follows the Keep-a-Changelog layout"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "unreleased_backlog_maintained_continuously",
      "status": "pass",
      "evidence": "changelog: the [Unreleased] backlog is maintained continuously, not reconstructed at release time"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "pack_release_notes_state_why_changes_matter",
      "status": "pass",
      "evidence": "release notes: the pack's user-facing notes state what changed and why it matters"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "pack_breaking_items_pair_migration_steps",
      "status": "pass",
      "evidence": "release notes: the pack's breaking items are paired with migration steps in the notes"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "changelog_entry_rows_declared",
      "status": "pass",
      "evidence": "changelog: the pack declares its changelog entry rows \u2014 the list is present and non-empty; a release pack ships at least one changelog entry"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_uses_recognised_category",
      "status": "fail",
      "evidence": "changelog entries: every declared entry's category is a Keep-a-Changelog category (Added / Changed / Deprecated / Removed / Fixed / Security)"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_carries_summary",
      "status": "pass",
      "evidence": "changelog entries: every declared entry carries a summary of the change"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "every_changelog_entry_filed_under_pack_version",
      "status": "pass",
      "evidence": "changelog entries: every declared entry is filed under the pack's declared version heading \u2014 entries moved under the version at release"
    },
    {
      "section": "changelog_pack_completeness",
      "check": "no_changelog_entry_heading_duplicated",
      "status": "pass",
      "evidence": "changelog entries: no declared entry heading is owned by more than one row"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "pack_artifacts_hashed_and_signed_declared",
      "status": "pass",
      "evidence": "seal: the pack declares its build artifacts hashed and signed"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "seal_manifest_generated_from_build_outputs",
      "status": "pass",
      "evidence": "seal: the pack's seal manifest is generated from the build outputs it seals"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "sealed_artifact_rows_declared",
      "status": "pass",
      "evidence": "seal: the pack declares its sealed artifact rows \u2014 the list is present and non-empty; the skill seals build artifacts"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "every_sealed_artifact_checksum_matches_declared_algorithm_format",
      "status": "fail",
      "evidence": "sealed artifacts: every declared checksum matches the format of the algorithm declared on its row (sha256: 64 hex digits; sha512: 128 hex digits) \u2014 format only; no real artifact is hashed here"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "every_sealed_artifact_signature_recorded",
      "status": "pass",
      "evidence": "sealed artifacts: every declared artifact records its signature in the pack"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "no_sealed_artifact_filename_duplicated",
      "status": "pass",
      "evidence": "sealed artifacts: no declared artifact filename is owned by more than one row"
    },
    {
      "section": "seal_manifest_integrity",
      "check": "seal_artifact_count_matches_pack_manifest_total",
      "status": "pass",
      "evidence": "seal: the seal record's declared artifact total equals the number of declared sealed artifact rows"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_tag_created_as_annotated",
      "status": "pass",
      "evidence": "tag: the pack's release tag is created as an annotated tag"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_tag_signature_recorded_when_signing_key_exists",
      "status": "pass",
      "evidence": "tag: the pack records the tag as signed when signing keys exist"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "seal_manifest_attached_to_pack_record",
      "status": "pass",
      "evidence": "seal: the manifest is attached to the pack's release record"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "signature_file_attached_to_pack_record",
      "status": "pass",
      "evidence": "seal: the signature file is attached to the pack's release record"
    },
    {
      "section": "tag_signature_and_attachment",
      "check": "pack_checksums_rechecked_before_announcement",
      "status": "pass",
      "evidence": "seal: the pack's checksums and signature are rechecked before the release is announced"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_path_written_before_rollout_began",
      "status": "pass",
      "evidence": "rollback: the pack's rollback path was written before the rollout began"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_sequence_is_executable_as_written",
      "status": "pass",
      "evidence": "rollback: the pack's rollback sequence is executable as written \u2014 the plan is testable"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_trigger_conditions_named_in_pack",
      "status": "pass",
      "evidence": "rollback: the pack names the conditions that trigger a rollback"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_step_rows_declared",
      "status": "pass",
      "evidence": "rollback: the pack declares its rollback step rows \u2014 the list is present and non-empty; a rollback path has at least one step"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "rollback_step_orders_form_contiguous_sequence",
      "status": "fail",
      "evidence": "rollback steps: the declared step orders form the contiguous sequence 1..n \u2014 no gaps, no repeats"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "every_rollback_step_records_its_action",
      "status": "pass",
      "evidence": "rollback steps: every declared step records the action it performs"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "every_rollback_step_records_post_step_verification",
      "status": "pass",
      "evidence": "rollback steps: every declared step records how its effect is verified after the step runs"
    },
    {
      "section": "rollback_sequence_detail",
      "check": "no_rollback_step_label_duplicated",
      "status": "pass",
      "evidence": "rollback steps: no declared step label is owned by more than one row"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "rollout_staging_or_canary_declared_for_pack",
      "status": "pass",
      "evidence": "rollout: the pack declares a canary or staged rollout where feasible"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "rollout_approver_recorded_for_pack",
      "status": "pass",
      "evidence": "rollout: the pack's rollout record names its approver"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "defined_health_window_stated_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack states a defined health verification window"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "post_release_health_verification_completed_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack records the post-release health verification as done"
    },
    {
      "section": "staged_rollout_and_health_record",
      "check": "post_release_discrepancies_logged_for_pack",
      "status": "pass",
      "evidence": "post-release: the pack logs discrepancies and records the loops closed"
    },
    {
      "section": "pack_red_lines",
      "check": "no_untagged_pack_release_in_record",
      "status": "pass",
      "evidence": "red line: no untagged release of the pack is present in the record"
    },
    {
      "section": "pack_red_lines",
      "check": "no_published_history_rewrite_in_record",
      "status": "pass",
      "evidence": "red line: no rewritten history on a published branch is present in the record"
    },
    {
      "section": "pack_red_lines",
      "check": "no_unattended_pack_deploy_in_record",
      "status": "pass",
      "evidence": "red line: no deploy of the pack without human approval is present in the record \u2014 deploys stay HITL"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "changelog_entries_count": 1,
  "changelog_entries_without_summary": [],
  "changelog_entries_with_unrecognised_category": [
    "Added feature X"
  ],
  "changelog_entries_filed_under_other_version": [],
  "duplicate_changelog_entry_headings": [],
  "changelog_summary_coverage": "1.000000",
  "recognised_category_coverage": "0.000000",
  "sealed_artifacts_count": 1,
  "sealed_artifacts_with_malformed_checksum": [
    "bin.tar.gz"
  ],
  "sealed_artifacts_without_signature": [],
  "duplicate_sealed_artifact_filenames": [],
  "checksum_format_coverage": "0.000000",
  "signature_coverage": "1.000000",
  "rollback_steps_count": 1,
  "rollback_steps_without_action": [],
  "rollback_steps_without_verification": [],
  "duplicate_rollback_step_labels": [],
  "rollback_action_coverage": "1.000000",
  "rollback_verification_coverage": "1.000000",
  "summary": "38 pass, 3 fail, 0 missing of 41 checks across seven sections.",
  "stamp": "RELEASE PACK CHANGELOG SEAL ROLLBACK\nrelease_label: v1.1.0\nVERDICT: RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY\n  version_stamp_and_bump_classification        pass\n  changelog_pack_completeness                  fail\n  seal_manifest_integrity                      fail\n  tag_signature_and_attachment                 pass\n  rollback_sequence_detail                     fail\n  staged_rollout_and_health_record             pass\n  pack_red_lines                               pass\n38 pass, 3 fail, 0 missing of 41 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:50:57.790759+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/release-pack-changelog-seal-rollback/evidence.json`.

Input:

```json
{
  "release_label": "v1.1.0",
  "version_detail": "should_be_an_object",
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "version_detail",
  "detail": "version_detail must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared software release-pack record; its verdict is a completeness, declared-checksum-format and consistency judgment on declared evidence, not compliance evidence, not a release system, a provenance verifier, a signing service or a release authority, and SERVICE.md's U-13 screen states outright that its output could not read as regulated professional advice. |
| Checks named | 41 documented / 41 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the three declared counts, the seven row-name lists, the three duplicate lists and the six coverage ratios) |
| Input reference typed | Yes — 53 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/release-pack-changelog-seal-rollback/evidence.json` |
