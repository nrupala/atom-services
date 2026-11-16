#!/usr/bin/env python3
"""Link rot scan and notarized archive — deterministic core.

Built from the bound skill `link-integrity-and-archiving` (v1):
"A link is a promise; the web breaks promises constantly. This skill
keeps citations stable and provable: detect rot, archive what was
seen, canonicalize, and notarize captures so a third party can verify
them."

The gateway cannot fetch live URLs, so this atom does not crawl. The
caller submits a declared scan/archive manifest (a dict, or JSON on
the CLI): the scan posture, the declared link rows — each with its
observed status, its archive capture record (hash + timestamp, at
cite time), its canonicalization record, its notarization flag and
its repair record — plus the notarization bundle, the honest-serving
record, and the repair/compliance record. The atom audits that
declared evidence; it never fetches a URL itself.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Seven checks are computed over the declared link rows, not declared
as booleans: row completeness, citation archiving (capture + hash +
timestamp), capture at cite time, canonicalization with stable IDs,
dedupe consistency (rows sharing a content hash share one canonical
URL), citation notarization, and repair of rotted citations (a
rotted citation — dead, moved, soft-404 or hijacked — must carry a
logged repair: archived copy, updated canonical, or a dated removal
note). No threshold is invented here — the observed statuses and
repair vocabulary are the caller's declared scan results.

Verdict:
- any fail             -> LINK_INTEGRITY_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> LINK_INTEGRITY_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "scan_coverage",
    "archive_capture",
    "canonicalization",
    "notarization",
    "honest_serving",
    "repair_and_compliance",
)

OBSERVED_STATUSES = (
    "ok", "dead", "moved", "soft_404", "paywalled", "hijacked",
)
ROTTED_STATUSES = ("dead", "moved", "soft_404", "hijacked")
REPAIR_ACTIONS = (
    "none_needed", "archived_copy", "updated_canonical",
    "removal_note", "none",
)
REPAIR_DONE_ACTIONS = (
    "archived_copy", "updated_canonical", "removal_note",
)
TIMESTAMP_SOURCES = ("rfc3161_tsa", "transparency_log")

_LINK_BOOL_FIELDS = (
    "is_published_citation", "archived", "capture_hash_present",
    "capture_timestamp_present", "capture_at_cite_time",
    "canonicalized", "stable_id_present", "notarized", "repair_logged",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "site": "string",
    "scan": {
        "scans_scheduled": "boolean",
        "scan_records_status": "boolean",
        "scan_records_content_hash": "boolean",
        "dashboard_lists_rot_with_owners": "boolean",
        "last_scan_within_cadence": "boolean",
    },
    "links": [{
        "id": "string",
        "url": "string",
        "is_published_citation": "boolean",
        "observed_status": "string",
        "archived": "boolean",
        "capture_hash_present": "boolean",
        "capture_timestamp_present": "boolean",
        "capture_at_cite_time": "boolean",
        "canonicalized": "boolean",
        "stable_id_present": "boolean",
        "content_hash": "string",
        "canonical_url": "string",
        "notarized": "boolean",
        "repair_action": "string",
        "repair_logged": "boolean",
    }],
    "archive": {
        "capture_format_warc_or_singlefile": "boolean",
        "fallback_chain_configured": "boolean",
    },
    "canonicalization": {
        "tracker_params_stripped": "boolean",
        "redirects_resolved": "boolean",
        "dedupe_by_content_hash": "boolean",
    },
    "notarization": {
        "hash_algorithm_sha256": "boolean",
        "timestamp_source": "string",
        "evidence_bundle_complete": "boolean",
        "tool_versions_recorded": "boolean",
        "verification_recipe_published": "boolean",
    },
    "serving": {
        "as_seen_views_available": "boolean",
        "live_vs_archive_diff_available": "boolean",
        "provenance_badge_shows_capture_date": "boolean",
        "provenance_badge_shows_verification_status": "boolean",
        "archived_presented_as_current": "boolean",
        "authorship_preserved": "boolean",
    },
    "repair": {
        "repairs_logged": "boolean",
        "silent_drops_made": "boolean",
    },
    "compliance": {
        "robots_and_tos_honored": "boolean",
        "rate_limits_respected": "boolean",
        "access_controls_bypassed": "boolean",
        "fabricated_captures_present": "boolean",
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


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_bool(value):
    return isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _link_complete(link):
    if not isinstance(link, dict):
        return False
    if not _is_nonempty_str(link.get("id")):
        return False
    if not _is_nonempty_str(link.get("url")):
        return False
    if link.get("observed_status") not in OBSERVED_STATUSES:
        return False
    for field in _LINK_BOOL_FIELDS:
        if not _is_bool(link.get(field)):
            return False
    if not _is_nonempty_str(link.get("content_hash")):
        return False
    if not _is_nonempty_str(link.get("canonical_url")):
        return False
    if link.get("repair_action") not in REPAIR_ACTIONS:
        return False
    return True


def _analyze_links(manifest):
    """Classify the declared link rows.

    Returns (state, complete_links) where state is "none" (no rows
    declared), "incomplete" (a row is missing or invalid), or "ok".
    """
    links, has_links = _get(manifest, "links")
    if not has_links or not isinstance(links, list) or not links:
        return "none", []
    complete = [row for row in links if _link_complete(row)]
    if len(complete) != len(links):
        return "incomplete", complete
    return "ok", complete


def _computed_check(results, section, name, state, ok, evidence,
                    missing_evidence, na_evidence=None):
    """Emit one computed check over the declared link rows."""
    if state == "none":
        _check(results, section, name, None, False, False,
               "no links declared")
    elif state == "incomplete":
        _check(results, section, name, None, False, False,
               missing_evidence)
    elif ok is None:
        _check(results, section, name, None, True, True, na_evidence)
    else:
        _check(results, section, name, None, True, ok, evidence)


def evaluate(manifest):
    """Return the verdict dict for a scan/archive evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    state, complete_links = _analyze_links(manifest)
    citations = [row for row in complete_links
                 if row["is_published_citation"] is True]
    rotted_citations = [row for row in citations
                        if row["observed_status"] in ROTTED_STATUSES]
    unarchived = [row for row in citations
                  if not (row["archived"] is True
                          and row["capture_hash_present"] is True
                          and row["capture_timestamp_present"] is True)]

    # ---- Section 1: scan_coverage (skill method 1: detect +
    #      quality gate: scans scheduled, dashboard with owners) ----
    _bool_check(results, "scan_coverage", "scans_scheduled",
                manifest, ("scan", "scans_scheduled"),
                "scheduled scans (HEAD/GET) for internal and external "
                "links")
    _bool_check(results, "scan_coverage", "scan_records_status",
                manifest, ("scan", "scan_records_status"),
                "scan records the observed status of every link")
    _bool_check(results, "scan_coverage", "scan_records_content_hash",
                manifest, ("scan", "scan_records_content_hash"),
                "scan records a content hash for every link")
    _bool_check(results, "scan_coverage",
                "dashboard_lists_rot_with_owners", manifest,
                ("scan", "dashboard_lists_rot_with_owners"),
                "quality gate: dashboard lists dead/moved/hijacked "
                "links with owners")
    _bool_check(results, "scan_coverage", "scan_cadence_current",
                manifest, ("scan", "last_scan_within_cadence"),
                "the most recent scan ran within its declared cadence")
    _computed_check(
        results, "scan_coverage", "links_complete", state, True,
        "every link row carries an id, url, observed status, archive, "
        "canonicalization, notarization, and repair record",
        "a link row is missing its id, url, observed status, archive, "
        "canonicalization, notarization, or repair fields")

    # ---- Section 2: archive_capture (skill method 2: archive at
    #      cite time + quality gate: every citation archived) ----
    _bool_check(results, "archive_capture",
                "captures_in_warc_or_singlefile", manifest,
                ("archive", "capture_format_warc_or_singlefile"),
                "captures stored as WARC or SingleFile at save time")
    _bool_check(results, "archive_capture", "fallback_chain_configured",
                manifest, ("archive", "fallback_chain_configured"),
                "fallback chain: original, then archive.org, then "
                "other public archives")
    archived_ok = None
    if state == "ok":
        archived_ok = True if not citations else not unarchived
    _computed_check(
        results, "archive_capture",
        "citations_archived_with_hash_and_timestamp", state,
        archived_ok,
        "quality gate: every published citation has an archived "
        "capture with hash and timestamp",
        "a link row is incomplete, so citation archiving cannot be "
        "verified",
        na_evidence="no published citations declared")
    cite_time_ok = None
    if state == "ok":
        cite_time_ok = True if not citations else all(
            row["capture_at_cite_time"] is True for row in citations)
    _computed_check(
        results, "archive_capture", "citations_captured_at_cite_time",
        state, cite_time_ok,
        "captures taken at cite time, when saved — not later",
        "a link row is incomplete, so cite-time capture cannot be "
        "verified",
        na_evidence="no published citations declared")

    # ---- Section 3: canonicalization (skill method 3:
    #      canonicalize and dedupe) ----
    _bool_check(results, "canonicalization", "tracker_params_stripped",
                manifest, ("canonicalization", "tracker_params_stripped"),
                "URLs normalized: tracker parameters stripped")
    _bool_check(results, "canonicalization", "redirects_resolved",
                manifest, ("canonicalization", "redirects_resolved"),
                "URLs normalized: redirects resolved")
    _bool_check(results, "canonicalization", "dedupe_by_content_hash",
                manifest, ("canonicalization", "dedupe_by_content_hash"),
                "dedupe by content hash")
    canon_ok = None
    if state == "ok":
        canon_ok = all(
            row["canonicalized"] is True
            and row["stable_id_present"] is True
            for row in complete_links)
    _computed_check(
        results, "canonicalization",
        "links_canonicalized_with_stable_ids", state, canon_ok,
        "every link is canonicalized and carries a stable internal "
        "ID, so links survive URL changes",
        "a link row is incomplete, so canonicalization cannot be "
        "verified")
    seen_hashes = {}
    dedupe_conflict = False
    for row in complete_links:
        digest = row["content_hash"]
        if digest in seen_hashes \
                and seen_hashes[digest] != row["canonical_url"]:
            dedupe_conflict = True
        seen_hashes[digest] = row["canonical_url"]
    _computed_check(
        results, "canonicalization",
        "duplicate_content_shares_canonical", state,
        (not dedupe_conflict) if state == "ok" else None,
        "links sharing a content hash share one canonical URL",
        "a link row is incomplete, so dedupe consistency cannot be "
        "verified")

    # ---- Section 4: notarization (skill method 4: notarize +
    #      quality gate: reproducible verification recipe) ----
    _bool_check(results, "notarization", "hash_is_sha256",
                manifest, ("notarization", "hash_algorithm_sha256"),
                "artifact hashed with SHA-256")
    ts_source, has_ts_source = _get(manifest, "notarization",
                                    "timestamp_source")
    _check(results, "notarization", "timestamp_from_real_tsa_or_log",
           ts_source, has_ts_source, ts_source in TIMESTAMP_SOURCES,
           "red line: timestamps come from a real RFC 3161 TSA or "
           "transparency log — never fabricated")
    _bool_check(results, "notarization", "evidence_bundle_complete",
                manifest, ("notarization", "evidence_bundle_complete"),
                "evidence bundle: URL + capture + hashes + time + "
                "tool versions")
    _bool_check(results, "notarization", "tool_versions_recorded",
                manifest, ("notarization", "tool_versions_recorded"),
                "tool versions recorded in the evidence bundle")
    _bool_check(results, "notarization",
                "verification_recipe_published", manifest,
                ("notarization", "verification_recipe_published"),
                "quality gate: verification recipe published — anyone "
                "can re-hash and check")
    notarized_ok = None
    if state == "ok":
        notarized_ok = True if not citations else all(
            row["notarized"] is True for row in citations)
    _computed_check(
        results, "notarization", "citations_notarized", state,
        notarized_ok,
        "every published citation's capture is notarized",
        "a link row is incomplete, so citation notarization cannot "
        "be verified",
        na_evidence="no published citations declared")

    # ---- Section 5: honest_serving (skill method 5: serve
    #      honestly + red line: never present archived as current) ----
    _bool_check(results, "honest_serving", "as_seen_views_available",
                manifest, ("serving", "as_seen_views_available"),
                "reader/playback offers as-seen views of captures")
    _bool_check(results, "honest_serving",
                "live_vs_archive_diff_available", manifest,
                ("serving", "live_vs_archive_diff_available"),
                "live-vs-archive diff available")
    badge_date, has_badge_date = _get(
        manifest, "serving", "provenance_badge_shows_capture_date")
    badge_status, has_badge_status = _get(
        manifest, "serving",
        "provenance_badge_shows_verification_status")
    _check(results, "honest_serving", "provenance_badge_complete",
           badge_date, has_badge_date and has_badge_status,
           badge_date is True and badge_status is True,
           "provenance badge shows capture date and verification "
           "status")
    _false_check(results, "honest_serving",
                 "archived_never_presented_as_current", manifest,
                 ("serving", "archived_presented_as_current"),
                 "red line: archived content is never presented as "
                 "current")
    _bool_check(results, "honest_serving", "authorship_never_stripped",
                manifest, ("serving", "authorship_preserved"),
                "red line: a page's authorship is never stripped "
                "while archiving")

    # ---- Section 6: repair_and_compliance (skill methods 6 + 7:
    #      repair loop, respect the web + quality gate: repairs
    #      logged, no broken citation ships) ----
    _bool_check(results, "repair_and_compliance", "repairs_logged",
                manifest, ("repair", "repairs_logged"),
                "quality gate: all repairs logged")
    _false_check(results, "repair_and_compliance", "no_silent_drops",
                 manifest, ("repair", "silent_drops_made"),
                 "rotted links are never silently dropped")
    repaired_ok = None
    if state == "ok":
        repaired_ok = True if not rotted_citations else all(
            row["repair_action"] in REPAIR_DONE_ACTIONS
            and row["repair_logged"] is True
            for row in rotted_citations)
    _computed_check(
        results, "repair_and_compliance", "rotted_citations_repaired",
        state, repaired_ok,
        "quality gate: no broken citation ships — every rotted "
        "citation has a logged repair (archived copy, updated "
        "canonical, or dated removal note)",
        "a link row is incomplete, so citation repair cannot be "
        "verified",
        na_evidence="no rotted published citations declared")
    _bool_check(results, "repair_and_compliance",
                "robots_and_tos_honored", manifest,
                ("compliance", "robots_and_tos_honored"),
                "robots and terms of service honored for fetching")
    _bool_check(results, "repair_and_compliance",
                "rate_limits_respected", manifest,
                ("compliance", "rate_limits_respected"),
                "rate limits respected — no scraping at volumes that "
                "harm the target")
    _false_check(results, "repair_and_compliance",
                 "no_access_control_bypass", manifest,
                 ("compliance", "access_controls_bypassed"),
                 "red line: no bypassing access controls")
    _false_check(results, "repair_and_compliance",
                 "no_fabricated_captures", manifest,
                 ("compliance", "fabricated_captures_present"),
                 "red line: no fabricated or synthetic captures")

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
        verdict = "LINK_INTEGRITY_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "LINK_INTEGRITY_SOUND"

    return {
        "service": "link-rot-scan-and-notarized-archive",
        "atom_version": "0.1.0",
        "site": manifest.get("site"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "links_evaluated": len(complete_links),
        "citations_total": len(citations),
        "rotted_citations": len(rotted_citations),
        "unarchived_citations": len(unarchived),
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
        "LINK ROT SCAN AND NOTARIZED ARCHIVE",
        f"site: {verdict.get('site')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: link_rot_scan_and_notarized_archive.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "LINK_INTEGRITY_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
