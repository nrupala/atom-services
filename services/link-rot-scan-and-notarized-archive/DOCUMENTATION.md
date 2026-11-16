# Link rot scan and notarized archive — `link-rot-scan-and-notarized-archive`

**Link rot scan and notarized archive** · slug `link-rot-scan-and-notarized-archive` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Keep links stable and provable — link-rot scans, WARC archiving, canonicalization, notarized captures.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `site` = `example.com`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/link-rot-scan-and-notarized-archive` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "LINK_INTEGRITY_SOUND"`, every section `pass`, and the summary: "33 pass, 0 fail, 0 missing of 33 checks across six sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "link-rot-scan-and-notarized-archive"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/link-rot-scan-and-notarized-archive \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/link-rot-scan-and-notarized-archive`
- Tool name: `link_rot_scan_and_notarized_archive` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `LINK_INTEGRITY_UNSOUND` with the summary: "0 pass, 1 fail, 32 missing of 33 checks across six sections."

The checks with `status: "fail"` in that recorded run were:

- `notarization.timestamp_from_real_tsa_or_log` — evidence: "red line: timestamps come from a real RFC 3161 TSA or transparency log — never fabricated"

Fix procedure:

1. **Separate `fail` from `missing`.** A `fail` means a field was present but false / invalid, or a must-be-false red-line field was true — correct the underlying fact or the declaration. A `missing` check means the field was absent — supply the evidence. Adding a missing field cannot fix a fail, and vice versa.
2. **Work section by section.** The `sections` object rolls the checks up: a section is `fail` if any of its checks fails, otherwise `insufficient_evidence` if any is missing, otherwise `pass`. Fix every failing check in a section before re-reading its roll-up.
3. **Respect the gates.** Some checks only bite when a gate field says they apply (see the notes in the Input reference). If a gated check fails, either the gated thing must be brought up to standard or the gate declaration was wrong — fix whichever is true, never just flip the gate to make the check disappear if the gated thing exists.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update. Resubmit the corrected full manifest and confirm the summary counts move (fail count to zero, then missing count to zero).

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scan",
  "detail": "scan must be an object"
}
```

Fix the field named in `field` (`scan`): `detail` says what was expected ("scan must be an object"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/link-rot-scan-and-notarized-archive` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/link-rot-scan-and-notarized-archive` | Tool name `link_rot_scan_and_notarized_archive`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field table: 'All fields are booleans unless noted' — fields with no type note in that table are listed as boolean, and fields with a note carry that note's type. Notes (gates / conditionals / must-be-false and must-be-true conditions) are preserved from SERVICE.md.

#### `site`

| Field | Type | Read by / notes |
|---|---|---|
| `site` | string | carried into the verdict output, not itself checked |

#### `scan`

| Field | Type | Read by / notes |
|---|---|---|
| `scan.scans_scheduled` | boolean | Read by: scan_coverage |
| `scan.scan_records_status` | boolean | Read by: scan_coverage |
| `scan.scan_records_content_hash` | boolean | Read by: scan_coverage |
| `scan.dashboard_lists_rot_with_owners` | boolean | Read by: scan_coverage |
| `scan.last_scan_within_cadence` | boolean | Read by: scan_coverage |

#### `links`

| Field | Type | Read by / notes |
|---|---|---|
| `links` | list of link rows | Read by: scan_coverage, archive_capture, canonicalization, notarization, repair_and_compliance; absent / not a list / empty = all computed link checks missing |
| `links[].id` | non-empty string | Read by: scan_coverage |
| `links[].url` | non-empty string | Read by: scan_coverage |
| `links[].is_published_citation` | boolean | Read by: archive_capture, notarization, repair_and_compliance; gates the citation checks: archive, cite-time, notarization, repair |
| `links[].observed_status` | string: `"ok"`, `"dead"`, `"moved"`, `"soft_404"`, `"paywalled"` or `"hijacked"` | Read by: scan_coverage, repair_and_compliance; dead / moved / soft_404 / hijacked count as rotted |
| `links[].archived` | boolean | Read by: archive_capture; with `links[].capture_hash_present` and `links[].capture_timestamp_present`; all three must be true for a citation |
| `links[].capture_hash_present` | boolean | Read by: archive_capture; see above |
| `links[].capture_timestamp_present` | boolean | Read by: archive_capture; see above |
| `links[].capture_at_cite_time` | boolean | Read by: archive_capture |
| `links[].canonicalized` | boolean | Read by: canonicalization; with `links[].stable_id_present`; both must be true for every link |
| `links[].stable_id_present` | boolean | Read by: canonicalization; see above |
| `links[].content_hash` | non-empty string | Read by: canonicalization; rows sharing one must share one `canonical_url` |
| `links[].canonical_url` | non-empty string | Read by: canonicalization |
| `links[].notarized` | boolean | Read by: notarization |
| `links[].repair_action` | string: `"none_needed"`, `"archived_copy"`, `"updated_canonical"`, `"removal_note"` or `"none"` | Read by: repair_and_compliance; a rotted citation needs one of the middle three |
| `links[].repair_logged` | boolean | Read by: repair_and_compliance; a rotted citation's repair must be logged |

#### `archive`

| Field | Type | Read by / notes |
|---|---|---|
| `archive.capture_format_warc_or_singlefile` | boolean | Read by: archive_capture |
| `archive.fallback_chain_configured` | boolean | Read by: archive_capture |

#### `canonicalization`

| Field | Type | Read by / notes |
|---|---|---|
| `canonicalization.tracker_params_stripped` | boolean | Read by: canonicalization |
| `canonicalization.redirects_resolved` | boolean | Read by: canonicalization |
| `canonicalization.dedupe_by_content_hash` | boolean | Read by: canonicalization |

#### `notarization`

| Field | Type | Read by / notes |
|---|---|---|
| `notarization.hash_algorithm_sha256` | boolean | Read by: notarization |
| `notarization.timestamp_source` | string: `"rfc3161_tsa"` or `"transparency_log"` | Read by: notarization; anything else fails — timestamps must come from a real TSA/log |
| `notarization.evidence_bundle_complete` | boolean | Read by: notarization |
| `notarization.tool_versions_recorded` | boolean | Read by: notarization |
| `notarization.verification_recipe_published` | boolean | Read by: notarization |

#### `serving`

| Field | Type | Read by / notes |
|---|---|---|
| `serving.as_seen_views_available` | boolean | Read by: honest_serving |
| `serving.live_vs_archive_diff_available` | boolean | Read by: honest_serving |
| `serving.provenance_badge_shows_capture_date` | boolean | Read by: honest_serving; with `serving.provenance_badge_shows_verification_status`; both must be present and true |
| `serving.provenance_badge_shows_verification_status` | boolean | Read by: honest_serving; see above |
| `serving.archived_presented_as_current` | boolean | Read by: honest_serving; must be `false` to pass |
| `serving.authorship_preserved` | boolean | Read by: honest_serving |

#### `repair`

| Field | Type | Read by / notes |
|---|---|---|
| `repair.repairs_logged` | boolean | Read by: repair_and_compliance |
| `repair.silent_drops_made` | boolean | Read by: repair_and_compliance; must be `false` to pass |

#### `compliance`

| Field | Type | Read by / notes |
|---|---|---|
| `compliance.robots_and_tos_honored` | boolean | Read by: repair_and_compliance |
| `compliance.rate_limits_respected` | boolean | Read by: repair_and_compliance |
| `compliance.access_controls_bypassed` | boolean | Read by: repair_and_compliance; must be `false` to pass |
| `compliance.fabricated_captures_present` | boolean | Read by: repair_and_compliance; must be `false` to pass |

Input fields documented: 44 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **33 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

Seven checks are computed over the declared `links[]` rows, not declared as booleans: `links_complete` (row completeness), `citations_archived_with_hash_and_timestamp`, `citations_captured_at_cite_time`, `links_canonicalized_with_stable_ids`, `duplicate_content_shares_canonical` (rows sharing one `content_hash` share one `canonical_url`), `citations_notarized`, and `rotted_citations_repaired` (dead / moved / soft_404 / hijacked count as rotted; a rotted citation needs a logged repair action of `archived_copy`, `updated_canonical` or `removal_note`). Non-citation links are exempt from the citation checks. The response also reports `links_evaluated`, `citations_total`, `rotted_citations` and `unarchived_citations`.

#### Section `scan_coverage` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `scans_scheduled` | scheduled scans (HEAD/GET) for internal and external links |
| `scan_records_status` | scan records the observed status of every link |
| `scan_records_content_hash` | scan records a content hash for every link |
| `dashboard_lists_rot_with_owners` | quality gate: dashboard lists dead/moved/hijacked links with owners |
| `scan_cadence_current` | the most recent scan ran within its declared cadence |
| `links_complete` | every link row carries an id, url, observed status, archive, canonicalization, notarization, and repair record |

#### Section `archive_capture` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `captures_in_warc_or_singlefile` | captures stored as WARC or SingleFile at save time |
| `fallback_chain_configured` | fallback chain: original, then archive.org, then other public archives |
| `citations_archived_with_hash_and_timestamp` | quality gate: every published citation has an archived capture with hash and timestamp |
| `citations_captured_at_cite_time` | captures taken at cite time, when saved — not later |

#### Section `canonicalization` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `tracker_params_stripped` | URLs normalized: tracker parameters stripped |
| `redirects_resolved` | URLs normalized: redirects resolved |
| `dedupe_by_content_hash` | dedupe by content hash |
| `links_canonicalized_with_stable_ids` | every link is canonicalized and carries a stable internal ID, so links survive URL changes |
| `duplicate_content_shares_canonical` | links sharing a content hash share one canonical URL |

#### Section `notarization` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `hash_is_sha256` | artifact hashed with SHA-256 |
| `timestamp_from_real_tsa_or_log` | red line: timestamps come from a real RFC 3161 TSA or transparency log — never fabricated |
| `evidence_bundle_complete` | evidence bundle: URL + capture + hashes + time + tool versions |
| `tool_versions_recorded` | tool versions recorded in the evidence bundle |
| `verification_recipe_published` | quality gate: verification recipe published — anyone can re-hash and check |
| `citations_notarized` | every published citation's capture is notarized |

#### Section `honest_serving` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `as_seen_views_available` | reader/playback offers as-seen views of captures |
| `live_vs_archive_diff_available` | live-vs-archive diff available |
| `provenance_badge_complete` | provenance badge shows capture date and verification status |
| `archived_never_presented_as_current` | red line: archived content is never presented as current |
| `authorship_never_stripped` | red line: a page's authorship is never stripped while archiving |

#### Section `repair_and_compliance` — 7 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `repairs_logged` | quality gate: all repairs logged |
| `no_silent_drops` | rotted links are never silently dropped |
| `rotted_citations_repaired` | quality gate: no broken citation ships — every rotted citation has a logged repair (archived copy, updated canonical, or dated removal note) |
| `robots_and_tos_honored` | robots and terms of service honored for fetching |
| `rate_limits_respected` | rate limits respected — no scraping at volumes that harm the target |
| `no_access_control_bypass` | red line: no bypassing access controls |
| `no_fabricated_captures` | red line: no fabricated or synthetic captures |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"link-rot-scan-and-notarized-archive"`) and `atom_version` (string, `"0.1.0"`)
- `site` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `links_evaluated`, `citations_total`, `rotted_citations`, `unarchived_citations`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `LINK_INTEGRITY_SOUND` | All 33 checks pass across all six sections. |
| `LINK_INTEGRITY_UNSOUND` | At least one check fails (a present field is false / invalid, an invalid `notarization.timestamp_source`, or a computed citation / repair check fails). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `scan`, detail "scan must be an object" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. Link rot is an evidence problem, not just a broken-link problem. A citation that now 404s, or whose target changed silently, no longer supports the claim it was cited for. The atom therefore checks the whole chain — scan, capture at cite time, canonical identity, notarization, honest serving of the archived copy, and logged repair — rather than status codes alone.

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

Seven checks are computed over the declared `links[]` rows, not declared as booleans: `links_complete` (row completeness), `citations_archived_with_hash_and_timestamp`, `citations_captured_at_cite_time`, `links_canonicalized_with_stable_ids`, `duplicate_content_shares_canonical` (rows sharing one `content_hash` share one `canonical_url`), `citations_notarized`, and `rotted_citations_repaired` (dead / moved / soft_404 / hijacked count as rotted; a rotted citation needs a logged repair action of `archived_copy`, `updated_canonical` or `removal_note`). Non-citation links are exempt from the citation checks. The response also reports `links_evaluated`, `citations_total`, `rotted_citations` and `unarchived_citations`.

**What it does NOT do:**

- The gateway cannot fetch live URLs, so this atom does not crawl. It does not fetch a link, take a capture, hash a page, or notarize anything itself — the observed statuses, captures, hashes and timestamps are the caller's declared scan/archive evidence.
- No threshold is invented by the atom — the observed statuses are the caller's declared scan results.
- Non-citation links are exempt from the citation checks (archive, cite-time, notarization, repair), as stated in SERVICE.md.

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Engineering & code who need this check on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Content site citation link audits — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the check it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/link_rot_scan_and_notarized_archive.py` — contract entry: src/link_rot_scan_and_notarized_archive.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_link_rot_scan_and_notarized_archive.py — 27 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/link-rot-scan-and-notarized-archive`, MCP `POST https://atoms.pipavia.com/mcp/link-rot-scan-and-notarized-archive` (tool `link_rot_scan_and_notarized_archive`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

### For regulators

This view is included because: Its verdict is evidence-integrity / audit evidence: notarized captures, SHA-256 hashes, RFC 3161 / transparency-log timestamps, evidence bundles and a published verification recipe are produced precisely so a third party — including a regulator — can re-check provenance. Its `repair_and_compliance` section also covers robots/ToS, rate limits and access controls.

What the output is, as evidence: a deterministic, reproducible judgment over a declared manifest, with per-check evidence strings, a section roll-up, a one-line summary and a plain-text stamp, produced identically over REST and MCP from the same manifest (parity recorded). What it is not: an independent inspection of the underlying reality — the manifest is caller-declared, and the limits under Explanation ('What it does NOT do') bound exactly how far the verdict can be relied on. The worked examples below are the recorded external-verification runs, reproduced verbatim, so the evidence format can be assessed against real outputs rather than samples. Verification record: TEST-REPORT.md and `verification/results/link-rot-scan-and-notarized-archive.json` (retest verdict PASS, 2026-11-15).

## Worked examples

Provenance: recorded 2026-11-15T23:53:47.280450+00:00 against gateway v1.1.0, external verification lane, source `verification/work/link-rot-scan-and-notarized-archive/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

```json
{
  "site": "example.com",
  "scan": {
    "scans_scheduled": true,
    "scan_records_status": true,
    "scan_records_content_hash": true,
    "dashboard_lists_rot_with_owners": true,
    "last_scan_within_cadence": true
  },
  "links": [
    {
      "id": "link_01",
      "url": "https://example.com/ref1",
      "is_published_citation": true,
      "observed_status": "ok",
      "archived": true,
      "capture_hash_present": true,
      "capture_timestamp_present": true,
      "capture_at_cite_time": true,
      "canonicalized": true,
      "stable_id_present": true,
      "content_hash": "abc123",
      "canonical_url": "https://example.com/ref1",
      "notarized": true,
      "repair_action": "none_needed",
      "repair_logged": true
    }
  ],
  "archive": {
    "capture_format_warc_or_singlefile": true,
    "fallback_chain_configured": true
  },
  "canonicalization": {
    "tracker_params_stripped": true,
    "redirects_resolved": true,
    "dedupe_by_content_hash": true
  },
  "notarization": {
    "hash_algorithm_sha256": true,
    "timestamp_source": "rfc3161_tsa",
    "evidence_bundle_complete": true,
    "tool_versions_recorded": true,
    "verification_recipe_published": true
  },
  "serving": {
    "as_seen_views_available": true,
    "live_vs_archive_diff_available": true,
    "provenance_badge_shows_capture_date": true,
    "provenance_badge_shows_verification_status": true,
    "archived_presented_as_current": false,
    "authorship_preserved": true
  },
  "repair": {
    "repairs_logged": true,
    "silent_drops_made": false
  },
  "compliance": {
    "robots_and_tos_honored": true,
    "rate_limits_respected": true,
    "access_controls_bypassed": false,
    "fabricated_captures_present": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "link-rot-scan-and-notarized-archive",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "LINK_INTEGRITY_SOUND",
  "sections": {
    "scan_coverage": "pass",
    "archive_capture": "pass",
    "canonicalization": "pass",
    "notarization": "pass",
    "honest_serving": "pass",
    "repair_and_compliance": "pass"
  },
  "checks": [
    {
      "section": "scan_coverage",
      "check": "scans_scheduled",
      "status": "pass",
      "evidence": "scheduled scans (HEAD/GET) for internal and external links"
    },
    {
      "section": "scan_coverage",
      "check": "scan_records_status",
      "status": "pass",
      "evidence": "scan records the observed status of every link"
    },
    {
      "section": "scan_coverage",
      "check": "scan_records_content_hash",
      "status": "pass",
      "evidence": "scan records a content hash for every link"
    },
    {
      "section": "scan_coverage",
      "check": "dashboard_lists_rot_with_owners",
      "status": "pass",
      "evidence": "quality gate: dashboard lists dead/moved/hijacked links with owners"
    },
    {
      "section": "scan_coverage",
      "check": "scan_cadence_current",
      "status": "pass",
      "evidence": "the most recent scan ran within its declared cadence"
    },
    {
      "section": "scan_coverage",
      "check": "links_complete",
      "status": "pass",
      "evidence": "every link row carries an id, url, observed status, archive, canonicalization, notarization, and repair record"
    },
    {
      "section": "archive_capture",
      "check": "captures_in_warc_or_singlefile",
      "status": "pass",
      "evidence": "captures stored as WARC or SingleFile at save time"
    },
    {
      "section": "archive_capture",
      "check": "fallback_chain_configured",
      "status": "pass",
      "evidence": "fallback chain: original, then archive.org, then other public archives"
    },
    {
      "section": "archive_capture",
      "check": "citations_archived_with_hash_and_timestamp",
      "status": "pass",
      "evidence": "quality gate: every published citation has an archived capture with hash and timestamp"
    },
    {
      "section": "archive_capture",
      "check": "citations_captured_at_cite_time",
      "status": "pass",
      "evidence": "captures taken at cite time, when saved — not later"
    },
    {
      "section": "canonicalization",
      "check": "tracker_params_stripped",
      "status": "pass",
      "evidence": "URLs normalized: tracker parameters stripped"
    },
    {
      "section": "canonicalization",
      "check": "redirects_resolved",
      "status": "pass",
      "evidence": "URLs normalized: redirects resolved"
    },
    {
      "section": "canonicalization",
      "check": "dedupe_by_content_hash",
      "status": "pass",
      "evidence": "dedupe by content hash"
    },
    {
      "section": "canonicalization",
      "check": "links_canonicalized_with_stable_ids",
      "status": "pass",
      "evidence": "every link is canonicalized and carries a stable internal ID, so links survive URL changes"
    },
    {
      "section": "canonicalization",
      "check": "duplicate_content_shares_canonical",
      "status": "pass",
      "evidence": "links sharing a content hash share one canonical URL"
    },
    {
      "section": "notarization",
      "check": "hash_is_sha256",
      "status": "pass",
      "evidence": "artifact hashed with SHA-256"
    },
    {
      "section": "notarization",
      "check": "timestamp_from_real_tsa_or_log",
      "status": "pass",
      "evidence": "red line: timestamps come from a real RFC 3161 TSA or transparency log — never fabricated"
    },
    {
      "section": "notarization",
      "check": "evidence_bundle_complete",
      "status": "pass",
      "evidence": "evidence bundle: URL + capture + hashes + time + tool versions"
    },
    {
      "section": "notarization",
      "check": "tool_versions_recorded",
      "status": "pass",
      "evidence": "tool versions recorded in the evidence bundle"
    },
    {
      "section": "notarization",
      "check": "verification_recipe_published",
      "status": "pass",
      "evidence": "quality gate: verification recipe published — anyone can re-hash and check"
    },
    {
      "section": "notarization",
      "check": "citations_notarized",
      "status": "pass",
      "evidence": "every published citation's capture is notarized"
    },
    {
      "section": "honest_serving",
      "check": "as_seen_views_available",
      "status": "pass",
      "evidence": "reader/playback offers as-seen views of captures"
    },
    {
      "section": "honest_serving",
      "check": "live_vs_archive_diff_available",
      "status": "pass",
      "evidence": "live-vs-archive diff available"
    },
    {
      "section": "honest_serving",
      "check": "provenance_badge_complete",
      "status": "pass",
      "evidence": "provenance badge shows capture date and verification status"
    },
    {
      "section": "honest_serving",
      "check": "archived_never_presented_as_current",
      "status": "pass",
      "evidence": "red line: archived content is never presented as current"
    },
    {
      "section": "honest_serving",
      "check": "authorship_never_stripped",
      "status": "pass",
      "evidence": "red line: a page's authorship is never stripped while archiving"
    },
    {
      "section": "repair_and_compliance",
      "check": "repairs_logged",
      "status": "pass",
      "evidence": "quality gate: all repairs logged"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_silent_drops",
      "status": "pass",
      "evidence": "rotted links are never silently dropped"
    },
    {
      "section": "repair_and_compliance",
      "check": "rotted_citations_repaired",
      "status": "pass",
      "evidence": "quality gate: no broken citation ships — every rotted citation has a logged repair (archived copy, updated canonical, or dated removal note)"
    },
    {
      "section": "repair_and_compliance",
      "check": "robots_and_tos_honored",
      "status": "pass",
      "evidence": "robots and terms of service honored for fetching"
    },
    {
      "section": "repair_and_compliance",
      "check": "rate_limits_respected",
      "status": "pass",
      "evidence": "rate limits respected — no scraping at volumes that harm the target"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_access_control_bypass",
      "status": "pass",
      "evidence": "red line: no bypassing access controls"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_fabricated_captures",
      "status": "pass",
      "evidence": "red line: no fabricated or synthetic captures"
    }
  ],
  "links_evaluated": 1,
  "citations_total": 1,
  "rotted_citations": 0,
  "unarchived_citations": 0,
  "summary": "33 pass, 0 fail, 0 missing of 33 checks across six sections.",
  "stamp": "LINK ROT SCAN AND NOTARIZED ARCHIVE\nsite: example.com\nVERDICT: LINK_INTEGRITY_SOUND\n  scan_coverage            pass\n  archive_capture          pass\n  canonicalization         pass\n  notarization             pass\n  honest_serving           pass\n  repair_and_compliance    pass\n33 pass, 0 fail, 0 missing of 33 checks across six sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "site": "example.com",
  "links": [
    {
      "id": "link_02",
      "url": "https://example.com/dead",
      "is_published_citation": true,
      "observed_status": "dead",
      "archived": false,
      "capture_hash_present": false,
      "capture_timestamp_present": false,
      "canonicalized": true,
      "stable_id_present": true,
      "content_hash": "xyz789",
      "canonical_url": "https://example.com/dead",
      "notarized": false,
      "repair_action": "none",
      "repair_logged": false
    }
  ],
  "notarization": {
    "timestamp_source": "invalid_source"
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "link-rot-scan-and-notarized-archive",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "LINK_INTEGRITY_UNSOUND",
  "sections": {
    "scan_coverage": "insufficient_evidence",
    "archive_capture": "insufficient_evidence",
    "canonicalization": "insufficient_evidence",
    "notarization": "fail",
    "honest_serving": "insufficient_evidence",
    "repair_and_compliance": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "scan_coverage",
      "check": "scans_scheduled",
      "status": "missing",
      "evidence": "scheduled scans (HEAD/GET) for internal and external links"
    },
    {
      "section": "scan_coverage",
      "check": "scan_records_status",
      "status": "missing",
      "evidence": "scan records the observed status of every link"
    },
    {
      "section": "scan_coverage",
      "check": "scan_records_content_hash",
      "status": "missing",
      "evidence": "scan records a content hash for every link"
    },
    {
      "section": "scan_coverage",
      "check": "dashboard_lists_rot_with_owners",
      "status": "missing",
      "evidence": "quality gate: dashboard lists dead/moved/hijacked links with owners"
    },
    {
      "section": "scan_coverage",
      "check": "scan_cadence_current",
      "status": "missing",
      "evidence": "the most recent scan ran within its declared cadence"
    },
    {
      "section": "scan_coverage",
      "check": "links_complete",
      "status": "missing",
      "evidence": "a link row is missing its id, url, observed status, archive, canonicalization, notarization, or repair fields"
    },
    {
      "section": "archive_capture",
      "check": "captures_in_warc_or_singlefile",
      "status": "missing",
      "evidence": "captures stored as WARC or SingleFile at save time"
    },
    {
      "section": "archive_capture",
      "check": "fallback_chain_configured",
      "status": "missing",
      "evidence": "fallback chain: original, then archive.org, then other public archives"
    },
    {
      "section": "archive_capture",
      "check": "citations_archived_with_hash_and_timestamp",
      "status": "missing",
      "evidence": "a link row is incomplete, so citation archiving cannot be verified"
    },
    {
      "section": "archive_capture",
      "check": "citations_captured_at_cite_time",
      "status": "missing",
      "evidence": "a link row is incomplete, so cite-time capture cannot be verified"
    },
    {
      "section": "canonicalization",
      "check": "tracker_params_stripped",
      "status": "missing",
      "evidence": "URLs normalized: tracker parameters stripped"
    },
    {
      "section": "canonicalization",
      "check": "redirects_resolved",
      "status": "missing",
      "evidence": "URLs normalized: redirects resolved"
    },
    {
      "section": "canonicalization",
      "check": "dedupe_by_content_hash",
      "status": "missing",
      "evidence": "dedupe by content hash"
    },
    {
      "section": "canonicalization",
      "check": "links_canonicalized_with_stable_ids",
      "status": "missing",
      "evidence": "a link row is incomplete, so canonicalization cannot be verified"
    },
    {
      "section": "canonicalization",
      "check": "duplicate_content_shares_canonical",
      "status": "missing",
      "evidence": "a link row is incomplete, so dedupe consistency cannot be verified"
    },
    {
      "section": "notarization",
      "check": "hash_is_sha256",
      "status": "missing",
      "evidence": "artifact hashed with SHA-256"
    },
    {
      "section": "notarization",
      "check": "timestamp_from_real_tsa_or_log",
      "status": "fail",
      "evidence": "red line: timestamps come from a real RFC 3161 TSA or transparency log — never fabricated"
    },
    {
      "section": "notarization",
      "check": "evidence_bundle_complete",
      "status": "missing",
      "evidence": "evidence bundle: URL + capture + hashes + time + tool versions"
    },
    {
      "section": "notarization",
      "check": "tool_versions_recorded",
      "status": "missing",
      "evidence": "tool versions recorded in the evidence bundle"
    },
    {
      "section": "notarization",
      "check": "verification_recipe_published",
      "status": "missing",
      "evidence": "quality gate: verification recipe published — anyone can re-hash and check"
    },
    {
      "section": "notarization",
      "check": "citations_notarized",
      "status": "missing",
      "evidence": "a link row is incomplete, so citation notarization cannot be verified"
    },
    {
      "section": "honest_serving",
      "check": "as_seen_views_available",
      "status": "missing",
      "evidence": "reader/playback offers as-seen views of captures"
    },
    {
      "section": "honest_serving",
      "check": "live_vs_archive_diff_available",
      "status": "missing",
      "evidence": "live-vs-archive diff available"
    },
    {
      "section": "honest_serving",
      "check": "provenance_badge_complete",
      "status": "missing",
      "evidence": "provenance badge shows capture date and verification status"
    },
    {
      "section": "honest_serving",
      "check": "archived_never_presented_as_current",
      "status": "missing",
      "evidence": "red line: archived content is never presented as current"
    },
    {
      "section": "honest_serving",
      "check": "authorship_never_stripped",
      "status": "missing",
      "evidence": "red line: a page's authorship is never stripped while archiving"
    },
    {
      "section": "repair_and_compliance",
      "check": "repairs_logged",
      "status": "missing",
      "evidence": "quality gate: all repairs logged"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_silent_drops",
      "status": "missing",
      "evidence": "rotted links are never silently dropped"
    },
    {
      "section": "repair_and_compliance",
      "check": "rotted_citations_repaired",
      "status": "missing",
      "evidence": "a link row is incomplete, so citation repair cannot be verified"
    },
    {
      "section": "repair_and_compliance",
      "check": "robots_and_tos_honored",
      "status": "missing",
      "evidence": "robots and terms of service honored for fetching"
    },
    {
      "section": "repair_and_compliance",
      "check": "rate_limits_respected",
      "status": "missing",
      "evidence": "rate limits respected — no scraping at volumes that harm the target"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_access_control_bypass",
      "status": "missing",
      "evidence": "red line: no bypassing access controls"
    },
    {
      "section": "repair_and_compliance",
      "check": "no_fabricated_captures",
      "status": "missing",
      "evidence": "red line: no fabricated or synthetic captures"
    }
  ],
  "links_evaluated": 0,
  "citations_total": 0,
  "rotted_citations": 0,
  "unarchived_citations": 0,
  "summary": "0 pass, 1 fail, 32 missing of 33 checks across six sections.",
  "stamp": "LINK ROT SCAN AND NOTARIZED ARCHIVE\nsite: example.com\nVERDICT: LINK_INTEGRITY_UNSOUND\n  scan_coverage            insufficient_evidence\n  archive_capture          insufficient_evidence\n  canonicalization         insufficient_evidence\n  notarization             fail\n  honest_serving           insufficient_evidence\n  repair_and_compliance    insufficient_evidence\n0 pass, 1 fail, 32 missing of 33 checks across six sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "site": "malformed_test",
  "scan": "not_an_object"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scan",
  "detail": "scan must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops, regulators |
| Regulators view | Yes |
| Checks named count vs recorded count | 33 / 33 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (LINK_INTEGRITY_SOUND, LINK_INTEGRITY_UNSOUND, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 44 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/link-rot-scan-and-notarized-archive/evidence.json` after writing |
| Output format | CommonMark markdown |

