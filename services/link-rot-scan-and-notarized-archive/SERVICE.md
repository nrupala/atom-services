# Link rot scan and notarized archive — `link-rot-scan-and-notarized-archive`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Keep links stable and provable - link-rot scans, WARC archiving, canonicalization, notarized captures.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Content site citation link audits**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the scan/archive evidence manifest

The gateway cannot fetch live URLs, so this atom does not crawl. The
caller submits one JSON manifest of declared scan/archive evidence:
the URLs with their observed statuses, the archive snapshots with
hashes and timestamps, and the notarization records. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`LINK_INTEGRITY_UNSOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `site` (string; carried into the verdict output, not itself checked) | — |
| `scan.scans_scheduled` | scan_coverage |
| `scan.scan_records_status` | scan_coverage |
| `scan.scan_records_content_hash` | scan_coverage |
| `scan.dashboard_lists_rot_with_owners` | scan_coverage |
| `scan.last_scan_within_cadence` | scan_coverage |
| `links` (list of link rows; absent / not a list / empty = all computed link checks missing) | scan_coverage, archive_capture, canonicalization, notarization, repair_and_compliance |
| `links[].id` (non-empty string) | scan_coverage |
| `links[].url` (non-empty string) | scan_coverage |
| `links[].is_published_citation` (gates the citation checks: archive, cite-time, notarization, repair) | archive_capture, notarization, repair_and_compliance |
| `links[].observed_status` (string: `"ok"`, `"dead"`, `"moved"`, `"soft_404"`, `"paywalled"` or `"hijacked"`; dead / moved / soft_404 / hijacked count as rotted) | scan_coverage, repair_and_compliance |
| `links[].archived` (with `links[].capture_hash_present` and `links[].capture_timestamp_present`; all three must be true for a citation) | archive_capture |
| `links[].capture_hash_present` (see above) | archive_capture |
| `links[].capture_timestamp_present` (see above) | archive_capture |
| `links[].capture_at_cite_time` | archive_capture |
| `links[].canonicalized` (with `links[].stable_id_present`; both must be true for every link) | canonicalization |
| `links[].stable_id_present` (see above) | canonicalization |
| `links[].content_hash` (non-empty string; rows sharing one must share one `canonical_url`) | canonicalization |
| `links[].canonical_url` (non-empty string) | canonicalization |
| `links[].notarized` | notarization |
| `links[].repair_action` (string: `"none_needed"`, `"archived_copy"`, `"updated_canonical"`, `"removal_note"` or `"none"`; a rotted citation needs one of the middle three) | repair_and_compliance |
| `links[].repair_logged` (a rotted citation's repair must be logged) | repair_and_compliance |
| `archive.capture_format_warc_or_singlefile` | archive_capture |
| `archive.fallback_chain_configured` | archive_capture |
| `canonicalization.tracker_params_stripped` | canonicalization |
| `canonicalization.redirects_resolved` | canonicalization |
| `canonicalization.dedupe_by_content_hash` | canonicalization |
| `notarization.hash_algorithm_sha256` | notarization |
| `notarization.timestamp_source` (string: `"rfc3161_tsa"` or `"transparency_log"`; anything else fails — timestamps must come from a real TSA/log) | notarization |
| `notarization.evidence_bundle_complete` | notarization |
| `notarization.tool_versions_recorded` | notarization |
| `notarization.verification_recipe_published` | notarization |
| `serving.as_seen_views_available` | honest_serving |
| `serving.live_vs_archive_diff_available` | honest_serving |
| `serving.provenance_badge_shows_capture_date` (with `serving.provenance_badge_shows_verification_status`; both must be present and true) | honest_serving |
| `serving.provenance_badge_shows_verification_status` (see above) | honest_serving |
| `serving.archived_presented_as_current` (must be `false` to pass) | honest_serving |
| `serving.authorship_preserved` | honest_serving |
| `repair.repairs_logged` | repair_and_compliance |
| `repair.silent_drops_made` (must be `false` to pass) | repair_and_compliance |
| `compliance.robots_and_tos_honored` | repair_and_compliance |
| `compliance.rate_limits_respected` | repair_and_compliance |
| `compliance.access_controls_bypassed` (must be `false` to pass) | repair_and_compliance |
| `compliance.fabricated_captures_present` (must be `false` to pass) | repair_and_compliance |

Seven checks are computed over the declared link rows, not declared
as booleans: row completeness, citation archiving (capture + hash +
timestamp on every published citation), capture at cite time,
canonicalization with stable IDs on every link, dedupe consistency
(rows sharing a content hash share one canonical URL), citation
notarization, and repair of rotted citations. Non-citation links are
exempt from the citation checks. The verdict dict also reports
`links_evaluated`, `citations_total`, `rotted_citations` and
`unarchived_citations` counts. No threshold is invented by the atom —
the observed statuses are the caller's declared scan results.

The verdict is one of `LINK_INTEGRITY_SOUND` (all 33 checks pass),
`LINK_INTEGRITY_UNSOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: scan_coverage, archive_capture,
canonicalization, notarization, honest_serving,
repair_and_compliance.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.
