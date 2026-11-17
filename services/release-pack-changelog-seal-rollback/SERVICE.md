# Release pack changelog seal rollback — `release-pack-changelog-seal-rollback`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Ship releases safely — semver, changelogs, signed tags, rollout and rollback plans, sealed release provenance.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Shipping product releases safely**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the release-pack manifest

The caller submits one JSON manifest: a declared release-pack
record for one release, made from the pack's actual changelog,
seal and rollback artefacts. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `release_label` (string; carried into the verdict output, not itself checked) | — |
| `version_detail.declared_version` (string; semver-checked, computed) | version_stamp_and_bump_classification |
| `version_detail.previous_version` (string; semver delta base, computed) | version_stamp_and_bump_classification |
| `version_detail.bump_kind` (string; `major` / `minor` / `patch`, computed) | version_stamp_and_bump_classification |
| `version_detail.breaking_change_in_pack` (boolean) | version_stamp_and_bump_classification |
| `changelog_pack.keep_a_changelog_layout_followed` (boolean) | changelog_pack_completeness |
| `changelog_pack.unreleased_backlog_maintained_continuously` (boolean) | changelog_pack_completeness |
| `changelog_pack.pack_release_notes_state_why_changes_matter` (boolean) | changelog_pack_completeness |
| `changelog_pack.pack_breaking_items_pair_migration_steps` (boolean) | changelog_pack_completeness |
| `changelog_entries` (list of changelog-entry-row objects, each with the entry fields below; computed, see below) | changelog_pack_completeness |
| `changelog_entries[].entry_heading` (string; names the row in the computed outputs) | changelog_pack_completeness |
| `changelog_entries[].entry_category` (string; must be a Keep-a-Changelog category) | changelog_pack_completeness |
| `changelog_entries[].entry_summary_present` (boolean; must be `true` per row) | changelog_pack_completeness |
| `changelog_entries[].entry_version_heading` (string; must equal `version_detail.declared_version` per row) | changelog_pack_completeness |
| `seal_record.pack_artifacts_hashed_and_signed_declared` (boolean) | seal_manifest_integrity |
| `seal_record.seal_manifest_generated_from_build_outputs` (boolean) | seal_manifest_integrity |
| `seal_record.declared_sealed_artifact_total` (number; must equal the declared artifact-row count, computed) | seal_manifest_integrity |
| `sealed_artifacts` (list of sealed-artifact-row objects, each with the artifact fields below; computed, see below) | seal_manifest_integrity |
| `sealed_artifacts[].artifact_filename` (string; names the row in the computed outputs) | seal_manifest_integrity |
| `sealed_artifacts[].checksum_algorithm` (string; `sha256` or `sha512` for the format check) | seal_manifest_integrity |
| `sealed_artifacts[].checksum_value` (string; hex format checked against the declared algorithm) | seal_manifest_integrity |
| `sealed_artifacts[].signature_recorded` (boolean; must be `true` per row) | seal_manifest_integrity |
| `tag_and_attachment.pack_tag_created_as_annotated` (boolean) | tag_signature_and_attachment |
| `tag_and_attachment.pack_tag_signature_recorded_when_signing_key_exists` (boolean) | tag_signature_and_attachment |
| `tag_and_attachment.seal_manifest_attached_to_pack_record` (boolean) | tag_signature_and_attachment |
| `tag_and_attachment.signature_file_attached_to_pack_record` (boolean) | tag_signature_and_attachment |
| `tag_and_attachment.pack_checksums_rechecked_before_announcement` (boolean) | tag_signature_and_attachment |
| `rollback_detail.rollback_path_written_before_rollout_began` (boolean) | rollback_sequence_detail |
| `rollback_detail.rollback_sequence_is_executable_as_written` (boolean) | rollback_sequence_detail |
| `rollback_detail.rollback_trigger_conditions_named_in_pack` (boolean) | rollback_sequence_detail |
| `rollback_steps` (list of rollback-step-row objects, each with the step fields below; computed, see below) | rollback_sequence_detail |
| `rollback_steps[].step_label` (string; names the row in the computed outputs) | rollback_sequence_detail |
| `rollback_steps[].step_order` (number; the declared orders must form 1..n, computed) | rollback_sequence_detail |
| `rollback_steps[].step_action_recorded` (boolean; must be `true` per row) | rollback_sequence_detail |
| `rollback_steps[].step_verification_recorded` (boolean; must be `true` per row) | rollback_sequence_detail |
| `rollout_record.rollout_staging_or_canary_declared_for_pack` (boolean) | staged_rollout_and_health_record |
| `rollout_record.rollout_approver_recorded_for_pack` (boolean) | staged_rollout_and_health_record |
| `rollout_record.defined_health_window_stated_for_pack` (boolean) | staged_rollout_and_health_record |
| `rollout_record.post_release_health_verification_completed_for_pack` (boolean) | staged_rollout_and_health_record |
| `rollout_record.post_release_discrepancies_logged_for_pack` (boolean) | staged_rollout_and_health_record |
| `red_lines.untagged_pack_release_present` (boolean; must be `false` to pass — skill red line) | pack_red_lines |
| `red_lines.published_history_rewrite_present` (boolean; must be `false` to pass — skill red line) | pack_red_lines |
| `red_lines.unattended_pack_deploy_present` (boolean; must be `false` to pass — skill red line) | pack_red_lines |

Several checks are computed from the declared record, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Semver stamp and bump classification:** the declared
  version must be well-formed semver (`MAJOR.MINOR.PATCH`, no
  leading zeros), must advance from the declared previous
  version, and the declared bump kind must match the declared
  delta exactly as the skill defines the kinds (major:
  major+1 with minor/patch reset to 0; minor: minor+1 with
  patch reset to 0; patch: patch+1). A pack declaring a
  breaking change must declare a major bump (the skill: MAJOR
  means breaking).
- **Changelog entry rows declared:** the declared
  `changelog_entries` list passes only when present and
  non-empty — a release pack ships at least one changelog
  entry (the skill's quality gate: changelog + version bump
  ship in the same change as the release content). An absent
  list is missing evidence.
- **Recognised category per entry:** every declared entry's
  `entry_category` must be one of the Keep-a-Changelog
  categories the skill's format names — Added, Changed,
  Deprecated, Removed, Fixed, Security. A row with the field
  absent is missing evidence; any other value fails.
- **Summary per entry:** every declared entry row must declare
  `entry_summary_present` true, under the same absent/false
  rules.
- **Filed under the pack version:** every declared entry's
  `entry_version_heading` must equal the declared pack
  version (entries moved under the version at release).
- **No entry heading duplicated:** no declared entry
  `entry_heading` may appear on more than one row.
- **Sealed artifact rows declared:** the declared
  `sealed_artifacts` list passes only when present and
  non-empty — the skill seals build artifacts.
- **Checksum format per artifact:** every declared artifact's
  `checksum_value` must match the format of the algorithm
  declared on its own row — sha256: exactly 64 hex digits;
  sha512: exactly 128 hex digits. This is a **format** check
  over declared strings only: no real artifact is fetched,
  hashed or compared.
- **Signature recorded per artifact:** every declared artifact
  row must declare `signature_recorded` true. The record is
  checked, never the signature itself.
- **No artifact filename duplicated:** no declared
  `artifact_filename` may appear on more than one row.
- **Seal total matches the rows:** the seal record's
  `declared_sealed_artifact_total` must equal the number of
  declared sealed-artifact rows.
- **Rollback step rows declared:** the declared
  `rollback_steps` list passes only when present and
  non-empty — a rollback path has at least one step.
- **Step orders contiguous:** the declared `step_order`
  values, sorted, must be exactly 1..n — no gaps, no repeats.
  The rows themselves may be declared in any order.
- **Action and post-step verification per step:** every
  declared step row must declare `step_action_recorded` and
  `step_verification_recorded` true.
- **No step label duplicated:** no declared `step_label` may
  appear on more than one row.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the nineteen computed checks above cannot be completed), the
counts `changelog_entries_count`, `sealed_artifacts_count`
and `rollback_steps_count` (declared list lengths, or null
when a list is not declared — counts are reported as integers,
exactly), the row-name lists
`changelog_entries_without_summary`,
`changelog_entries_with_unrecognised_category`,
`changelog_entries_filed_under_other_version` (null when the
declared version is not declared),
`sealed_artifacts_with_malformed_checksum`,
`sealed_artifacts_without_signature`,
`rollback_steps_without_action` and
`rollback_steps_without_verification` (rows whose field is
present but not true / not valid; a row with the field absent
is missing evidence and does not appear), the duplicate lists
`duplicate_changelog_entry_headings`,
`duplicate_sealed_artifact_filenames` and
`duplicate_rollback_step_labels` (names declared on more than
one row, in the order their second occurrence appears), and
the coverage ratios `changelog_summary_coverage`,
`recognised_category_coverage`, `checksum_format_coverage`,
`signature_coverage`, `rollback_action_coverage` and
`rollback_verification_coverage`. **Fixed serialization
rule:** computed ratios are reported as strings with exactly
six decimal places, produced in both implementations by the
same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) /
1000000`, then format with exactly six decimals; comparisons
use the unrounded values. A ratio is null when its denominator
list is absent or empty. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

Declined thresholds, named: a minimum changelog-entry count
beyond the pack's own non-empty list, or a per-category entry
quota; a mandated checksum algorithm (only format-matching
the algorithm the row itself declares is checked — sha256 and
sha512 are the two algorithms whose hex lengths the format
check knows; any other declared algorithm fails the format
check as unrecognised, it is not silently passed); a
signature scheme, key length or signer-identity bar (only
that a signature is recorded per artifact is checked); a
rollback-step count beyond non-empty, a per-step duration, or
a rollback time budget; a canary or staged-rollout percentage
or stage count; the skill's 24–48h post-release health window
as a numeric range (that range is the readiness verdict's
bar in `release-readiness-verdict`; here only that a defined
window is stated in the pack is checked); a version-bump
location count (the skill's bump-in-exactly-one-place rule is
likewise a readiness-verdict bar, not re-checked here); a
release cadence or pack size bar.

The verdict is one of `RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY`
(all 41 checks pass),
`RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across seven sections:
version_stamp_and_bump_classification,
changelog_pack_completeness, seal_manifest_integrity,
tag_signature_and_attachment, rollback_sequence_detail,
staged_rollout_and_health_record, pack_red_lines.

## Distinct ground

The nearest neighbour is `release-readiness-verdict` (atom #1,
same bound skill), which verdicts a release against five
readiness bars — control, understanding, management,
lifecycle, stability — from single boolean attestations and
scalar fields: whether a changelog entry exists for the
version, whether a rollback plan exists and is testable,
whether the artifacts are sealed, whether the health window
is 24–48h, whether the tag matches the version and was never
moved. This atom shares **zero check names** with it (and with
every other atom — verified mechanically by enumerating
`evaluate({})` check names from every `services/*/src/*.py`
oracle): its ground is the pack's declared **rows** and the
semver arithmetic between them — every changelog entry's
Keep-a-Changelog category, summary and version filing with
duplicate-heading detection; every sealed artifact's checksum
format against its own declared algorithm, its signature
record, and the seal manifest's declared total against the
row count; every rollback step's contiguous 1..n ordering,
recorded action and post-step verification with duplicate-
label detection; and the declared version delta's exact match
to the declared bump kind. The boundary is: a go/no-go
readiness verdict over attestations there; the release pack's
row-level completeness, format and internal consistency here.

## Honest scoping

This atom reviews a **declared** release-pack record — it
fetches no release, downloads or hashes no real artifact,
verifies no real signature cryptographically, executes no
rollback, and does not verify that any declared fact was ever
carried out. A pack is ready *on the caller's declared
evidence*: a record that declares well-formed checksums, a
signed tag and a contiguous rollback sequence passes those
checks even if the real release did none of it. The checksum
work is format-only — a declared sha256 string of 64 hex
digits passes whether or not it is the hash of anything. It
is a completeness, format and consistency audit of the
release-pack record the skill requires, **not a release
system, a provenance verifier, or a guarantee that the
release is safe to ship**: it never judges whether a declared
checksum corresponds to a real artifact, whether a recorded
signature is valid, whether the rollback sequence would
actually work, or whether the changelog summaries are true —
only that the record contains what the skill's method,
quality gates and red lines demand, and that its declared
rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no live verification of any
declared fact; no cryptographic verification of any checksum
or signature beyond declared-string format; no judgment of
record *quality* — whether the changelog entries describe the
release well, whether the rollback steps are the right steps,
or whether the staged rollout is prudent is the caller's
declaration, checked only for declared presence, format and
consistency; the skill's bump-in-exactly-one-place rule and
its 24–48h health-window range are readiness bars owned by
`release-readiness-verdict` and are not re-judged here (see
the declined list above).

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared software release
pack record for completeness, declared-checksum format and
internal consistency against a release-management skill; it
offers no engineering-practice advice in the APEGA sense (no
design, stamping, or safety judgment over physical systems),
no financial or securities advice, no legal or medical
advice, and nothing psychology-adjacent. Its subject is
software release practice only, the same class as the
software-engineering titles that stayed live at the census
pending the owner's review. Classification: (a) No outright —
no flag-with-controls required.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
