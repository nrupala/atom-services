# Claim verification fact check stamp — documentation

**Claim verification fact check stamp** · slug `claim-verification-fact-check-stamp` · deliverable type: STAMP · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — a one-claim document, “The company grew by 5% in Q3.” — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "claim-verification-fact-check-stamp"}`. Keep the returned key — you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the manifest.** Build one JSON object: a claim-verification manifest: the declared claims (one row per claim, with its label, source record and re-check record) plus the publication process record. In the recorded run the manifest names `document: "The company grew by 5% in Q3."` and declares every field `true` in the passing sense (every must-be-false field `false`), with the supporting rows the computed checks read.
3. **Send it.** `POST https://atoms.pipavia.com/v1/claim-verification-fact-check-stamp` with the manifest as the body and the `Authorization` header set.
4. **Read the verdict.** The recorded response is HTTP 200 with verdict `STAMPED`. Its `summary` reads: “16 pass, 0 fail, 0 missing of 16 checks across six sections.” Every section in `sections` is `pass`, and every entry in `checks` carries `status: "pass"` with its evidence line.
5. **Read the computed block.** `claims_summary` object — computed counts from the `claims[]` rows: `claims_total`, `material_claims`, `verified_claims`. In the recorded run it reads `{"claims_summary": {"claims_total": 1, "material_claims": 1, "verified_claims": 1}}` — recomputed by the atom from the submitted rows, never taken from the caller's word.
6. **Keep the stamp.** The response's `stamp` field is the same verdict as a plain-text block, suitable for pasting into a change record or review note.

You now have the deliverable: one deterministic verdict. Same manifest in → same verdict out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "claim-verification-fact-check-stamp"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope: a key never verifies for an atom outside its granted scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/claim-verification-fact-check-stamp \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The body is the manifest object itself (see Reference — Input reference). HTTP 200 returns the verdict object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/claim-verification-fact-check-stamp`
- Tool name: `claim_verification_fact_check_stamp`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the manifest object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same manifest.

### Read a failing verdict and fix the manifest

Worked example 2 below is the recorded failing run: verdict `NOT_STAMPED`, summary “12 pass, 4 fail, 0 missing of 16 checks across six sections.”. To fix a failing verdict:

1. **Find the non-pass checks.** In the response's `checks` array, look for `status: "fail"` (present but wrong) and `status: "missing"` (not declared). In the recorded violations run the failing checks are:
   - `material_claim_sources_archived` (section `source_ladder`) — evidence: “material claims without archived sources: c2”
   - `material_claims_triangulated` (section `triangulation`) — evidence: “material claims not triangulated: c2”
   - `numbers_rederived_for_numeric_claims` (section `compute_rechecks`) — evidence: “numeric claims whose math was not re-derived: c2”
   - `no_silent_corrections` (section `publication_and_corrections`) — evidence: “skill red line: corrections are never silent — fast, dated, visible change log”
2. **Note the section roll-up.** `sections` marks each affected section `fail` (or `insufficient_evidence` when nothing in it failed but evidence is missing). The verdict is `NOT_STAMPED` when any check fails, `INSUFFICIENT_EVIDENCE` when nothing fails but any check is missing, and `STAMPED` only when every check passes.
3. **Fix the underlying fact, then the manifest.** Each check's Reference entry names the manifest field it reads. Correct the real-world condition first (the atom reads declarations — declaring `true` for work not done defeats the purpose), set the field to the passing value, and resubmit the whole manifest. The atom is stateless: a resubmission is a fresh, complete evaluation.
4. **Re-read the new summary.** It counts pass / fail / missing across all checks; you are done when it reads all-pass and the verdict is `STAMPED`.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — never scored. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "process",
  "detail": "process must be an object"
}
```

- `field` names the offending field (`process` in the recorded run) and `detail` says what type was expected (`"process must be an object"`).
- Fix exactly that field's type in your manifest (see the types in the Input reference) and resubmit. Validation reports the first offending field it reaches, so a manifest with several type errors may need more than one fix-and-resubmit round.
- A 422 carries no verdict and no `checks` array — do not read it as a failing evaluation.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/claim-verification-fact-check-stamp` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/claim-verification-fact-check-stamp` — tool name `claim_verification_fact_check_stamp`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON manifest per call. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. Unless a field is marked otherwise, every boolean field follows the same rule: **absent = evidence missing** (the check it feeds is `missing`; the verdict degrades to `INSUFFICIENT_EVIDENCE`), **present but false/invalid = the check fails** (the verdict degrades to `NOT_STAMPED`). Fields marked “must be `false`” invert the passing value, as noted.

**Identity**

| Field | Type | Notes |
|---|---|---|
| `document` | string | Document name. Carried into the output; not itself checked. |

**`process` — publication process record**

| Field | Type | Notes |
|---|---|---|
| `process.claims_extracted` | boolean | Read by section `extraction`. |
| `process.units_and_dates_checked` | boolean | Read by section `compute_rechecks`. |
| `process.counter_case_considered` | boolean | Read by section `uncertainty_language`. |
| `process.evidence_published_inline` | boolean | Read by section `publication_and_corrections`. |
| `process.methodology_visible_for_big_claims` | boolean | Read by section `publication_and_corrections`. |
| `process.corrections_policy_published` | boolean | Read by section `publication_and_corrections`. |
| `process.versions_retained` | boolean | Read by section `publication_and_corrections`. |
| `process.silent_edits_made` | boolean | Read by section `publication_and_corrections`. Must be `false` to pass — no silent corrections. |

**`claims[]` — claim rows (read by sections extraction, source_ladder, triangulation, compute_rechecks, uncertainty_language)**

| Field | Type | Notes |
|---|---|---|
| `claims[].id` | string | Claim identifier; aggregate checks name offending ids in their evidence. |
| `claims[].material` | boolean | Materiality gate: triangulation and archiving apply to material claims only; non-material claims are exempt from both. |
| `claims[].label` | string (enum) | Uncertainty label; must be in the vocabulary `verified` / `likely` / `contested` / `unverified`. |
| `claims[].independent_sources` | number | Count of independent sources for the claim. |
| `claims[].primary_source` | boolean | Whether a primary source backs the claim. (Boolean per SERVICE.md — a string value is rejected with HTTP 422; see the recorded `primary-source-string` case in TEST-REPORT.md.) |
| `claims[].sources_archived` | boolean | Required `true` for material claims. |
| `claims[].source_metadata_recorded` | boolean | Source metadata recorded for the claim. |
| `claims[].independence_checked` | boolean | Source independence checked for the claim. |
| `claims[].has_numbers` | boolean | Gate: when `true`, the claim's math must have been rechecked. |
| `claims[].math_rechecked` | boolean | Required `true` when `has_numbers` is `true`. |
| `claims[].language_weakest_supported` | boolean | The claim's language is no stronger than the weakest the evidence supports. |

### Checks

The recorded full-pass REST response carries 16 checks. Every check is listed below, grouped by its `section` exactly as recorded. For each check: what it requires to pass, and its semantics — `pass` = the requirement is met on the declared evidence; `fail` = the field is present but false/invalid (or a must-be-false field is `true`, or a computed condition is breached); `missing` = the field (or the rows a computed check reads) is absent. There is no separate not-applicable status value in recorded responses: a gated check whose gate is closed reports `pass`, with its evidence line saying why (for example “no LLM judge declared”).

**Section `extraction`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `claims_extracted_one_row_per_claim` | Claims were extracted one row per claim — every checkable unit isolated. Recorded full-pass evidence: “isolate every checkable unit — one row per claim” | `process.claims_extracted` |
| `claims_declared` | Claims are declared for verification — the `claims[]` list is present and non-empty in substance; with no claims declared this check is `missing` (recorded sparse evidence: “no claims declared”). Recorded full-pass evidence: “claims declared for verification” | `claims[]` (computed presence) |
**Section `source_ladder`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `source_metadata_recorded_for_every_claim` | Source metadata is recorded for every claim: who, when, method, sample, conflicts of interest. Recorded full-pass evidence: “for each source: who, when, method, sample, conflicts of interest recorded” | `claims[].source_metadata_recorded` (aggregate over all rows) |
| `source_independence_checked` | Source independence is checked for every claim — two sources citing each other are one source. Recorded full-pass evidence: “independence checked — two sources citing each other are one source” | `claims[].independence_checked` (aggregate over all rows) |
| `material_claim_sources_archived` | Every material claim has at least one archived source. Non-material claims are exempt. A failing or missing aggregate names the position (recorded violations evidence: “material claims without archived sources: c2”). Recorded full-pass evidence: “quality gate: every material claim has at least one archived source” | `claims[].sources_archived` for rows with `material` true (aggregate) |
**Section `triangulation`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `material_claims_triangulated` | Every material claim is triangulated: at least 2 independent sources, or one primary source plus at least 1 independent source (confirmation). Non-material claims are exempt. A failing aggregate names the offending claim ids. Recorded full-pass evidence: “material claims need >= 2 independent sources, or one primary source plus confirmation” | `claims[].independent_sources` and `claims[].primary_source` for rows with `material` true (aggregate) |
**Section `compute_rechecks`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `numbers_rederived_for_numeric_claims` | Math is re-derived for claims carrying numbers: every row with `has_numbers` true has `math_rechecked` true. A failing aggregate names the offending claim ids. Recorded full-pass evidence: “re-derive math for claims carrying numbers” | `claims[].has_numbers` and `claims[].math_rechecked` (aggregate) |
| `units_dates_and_names_checked` | Units, dates and names are sanity-checked (units and orders of magnitude; dates and name spellings verified). Recorded full-pass evidence: “sanity-check units and orders of magnitude; verify dates and name spellings” | `process.units_and_dates_checked` |
**Section `uncertainty_language`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `labels_in_vocabulary` | Every claim's label is in the vocabulary: `verified` / `likely` / `contested` / `unverified`. Recorded full-pass evidence: “labels: verified / likely / contested / unverified” | `claims[].label` (aggregate over all rows) |
| `language_is_weakest_the_evidence_supports` | Language is the weakest the evidence supports for every claim — never upgrade “consistent with” to “proves”. Recorded full-pass evidence: “never upgrade 'consistent with' to 'proves'” | `claims[].language_weakest_supported` (aggregate over all rows) |
| `counter_case_considered` | The counter-case was considered; “what would change our mind” is noted for contested claims. Recorded full-pass evidence: “quality gate: counter-case considered; 'what would change our mind' noted for contested claims” | `process.counter_case_considered` |
**Section `publication_and_corrections`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `evidence_published_inline` | Evidence is published inline: citations and archived links with the document. Recorded full-pass evidence: “publish with evidence: inline citations, archived links” | `process.evidence_published_inline` |
| `methodology_visible_for_big_claims` | Methodology is visible for big claims. Recorded full-pass evidence: “visible methodology for big claims” | `process.methodology_visible_for_big_claims` |
| `corrections_policy_published` | A corrections policy is published. Recorded full-pass evidence: “quality gate: corrections policy published” | `process.corrections_policy_published` |
| `versions_retained` | Versions are retained. Recorded full-pass evidence: “quality gate: versions retained” | `process.versions_retained` |
| `no_silent_corrections` | No silent corrections: `process.silent_edits_made` is `false`. Corrections are never silent — fast, dated, visible change log (skill red line). Recorded full-pass evidence: “skill red line: corrections are never silent — fast, dated, visible change log” | `process.silent_edits_made` (must be `false`) |

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"claim-verification-fact-check-stamp"` |
| `atom_version` | `"0.1.0" |
| `document` | The manifest's `document` value, carried through |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section to its section status (below) |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order |
| (computed) | `claims_summary` object — computed counts from the `claims[]` rows: `claims_total`, `material_claims`, `verified_claims`. |
| `summary` | One line counting pass / fail / missing across all checks and sections |
| `stamp` | The same verdict as a plain-text block |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `STAMPED` — All 16 checks pass across all six sections. The fact-check behind the document is stamped on the evidence declared.
- `NOT_STAMPED` — At least one check fails (a field present but false/invalid, a must-be-false field true, or a per-claim aggregate breached). The failing checks name the section and, for per-claim checks, the offending claim ids.
- `INSUFFICIENT_EVIDENCE` — No check fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply.

**Section statuses** (values in the `sections` object):

- `pass` — every check in the section passes.
- `fail` — at least one check in the section fails.
- `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (the `status` field of each `checks[]` entry):

- `pass` — the requirement is met on the declared evidence (including gated checks whose gate is closed — see Checks).
- `fail` — the requirement is breached on present evidence.
- `missing` — the evidence the check reads was not declared.

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 body is the recorded one.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — the manifest violates a field type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "process", "detail": "process must be an object"}` — `field` and `detail` name the offending field and the expected type for your submission. |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

A second recorded 422 for this atom (case `primary-source-string`, HTTP 422) confirms the same shape on a nested field:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "claims[0].primary_source",
  "detail": "claims[0].primary_source must be a boolean"
}
```

Its recorded input:

```json
{
  "document": "The company grew by 5% in Q3.",
  "process": {
    "claims_extracted": true,
    "units_and_dates_checked": true,
    "counter_case_considered": true,
    "evidence_published_inline": true,
    "methodology_visible_for_big_claims": true,
    "corrections_policy_published": true,
    "versions_retained": true,
    "silent_edits_made": false
  },
  "claims": [
    {
      "id": "c1",
      "material": true,
      "label": "verified",
      "independent_sources": 2,
      "primary_source": "nasa.gov",
      "sources_archived": true,
      "source_metadata_recorded": true,
      "independence_checked": true,
      "has_numbers": true,
      "math_rechecked": true,
      "language_weakest_supported": true
    }
  ]
}
```

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `deliverable`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

The stamp attests to the fact-checking process behind a document, claim by claim. Extraction isolates every checkable unit as its own row; the source ladder records metadata and independence (two sources citing each other are one source); material claims must be triangulated and archived; numeric claims must have their math re-derived; labels must stay inside the vocabulary and language must stay at the weakest strength the evidence supports; and publication must carry its evidence inline, a visible methodology for big claims, a corrections policy, retained versions, and no silent edits. Per-claim checks are aggregates: when one claim breaches, the check fails and its evidence names the offending claim ids.

**How the verdict is decided.** The core is deterministic: the same manifest always produces the same verdict (the recorded battery proves byte-identical repeat responses, and MCP/REST parity). Each check reads named manifest fields and resolves to `pass`, `fail`, or `missing`. The distinction that drives the verdict is *absent vs false*: a field that is **absent** is missing evidence — its check is `missing`, and if nothing fails the verdict is `INSUFFICIENT_EVIDENCE`, naming exactly what to supply. A field that is **present but false or invalid** is a breached requirement — its check fails, and any single failure makes the verdict `NOT_STAMPED`. Section statuses roll up the same way (`pass` / `fail` / `insufficient_evidence`). Gated checks follow their gate field: when the gate is closed (for example no LLM judge used, no repair declared, no NIST alignment claimed, no backdoor present), the gated check passes as not applicable rather than going missing; when the gate is open, the gated field is required. Must-be-false fields invert the test: declaring them `true` is the failure.

**What it does not do.**

- It does not read the document, visit the sources, or verify any claim against the world — it stamps the declared fact-check record, in the declared shape.
- It does not verify that declared booleans are true in the world; a fabricated record that declares everything correctly will pass.
- It does not extract claims itself: claims not declared as rows are invisible to it.
- It sells the stamp (the fact-check verdict) — never the underlying verification knowledge itself.

**Buyer and use context.** Teams and agents working in “Thinking & decisions” who need this stamp on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: fact-checking content before publishing — Wright is an internal caller (zero price, metered to the internal cost ledger). One unit of sale = one deliverable (the delivered verdict). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge.

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the manifest to the REST endpoint (or call the MCP tool `claim_verification_fact_check_stamp`), and consume `verdict`, `sections`, `checks`, `summary` and `stamp`. Treat the three verdict values as your branch points: `STAMPED` = proceed; `NOT_STAMPED` = stop and remediate the failing checks; `INSUFFICIENT_EVIDENCE` = collect the missing evidence named in the `missing` checks and resubmit. Handle 422 as a client bug (fix the named field's type), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching a verdict for an unchanged manifest is sound.

### For developers

Manifest authoring: declare facts, not aspirations — every boolean is a claim about work actually done, and must-be-false fields are the usual trap (declaring them `true` is an instant fail). Respect the gates: gated fields are required only when their gate field opens them. Implementation pointers: `src/claim_verification_fact_check_stamp.py` — `evaluate(manifest) -> stamp dict`; CLI prints JSON + stamp. Tests: `tests/test_claim_verification_fact_check_stamp.py — 17 tests, all passing 2026-11-15`. Determinism is contractual: no randomness, no clock, no external calls in the evaluation path — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/claim-verification-fact-check-stamp`, MCP `POST /mcp/claim-verification-fact-check-stamp` (tool `claim_verification_fact_check_stamp`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client manifest type bugs (the body names the field); a rising 422 rate after a client release is a client regression, not an atom fault. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/claim-verification-fact-check-stamp.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

### For regulators

This atom is compliance-facing: The stamp is itself publication fact-check evidence — a dated, deterministic, per-check record that a document's claims were extracted, triangulated, rechecked and published under a corrections policy — and it is used to support publishing and content-compliance decisions. The verdict artifact is designed to be retained as evidence: it is deterministic (the same manifest replays to the same verdict), it carries per-check evidence lines naming what was checked and what was found, it distinguishes a breached requirement (`fail`) from absent evidence (`missing`) rather than collapsing both into a negative, and its plain-text `stamp` mirrors the JSON verdict for filing alongside the underlying records. Retention note: the atom itself is stateless — the caller retains the manifest and the verdict together; either one alone is an incomplete record. The verdict attests to the declared evidence in the declared shape; it is evidence production support, not a certification of the underlying facts.

## Worked examples

Provenance: recorded 2026-11-16T00:43:04.830422+00:00 against gateway v1.1.0, external verification lane, source `verification/work/claim-verification-fact-check-stamp/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

The recorded battery for this atom carries a fifth case, `primary-source-string` (kind: malformed), beyond the four standard cases: a full-pass-shaped manifest with `claims[0].primary_source` set to the string `"nasa.gov"` was rejected with HTTP 422 `invalid_input`, field `claims[0].primary_source` — confirming `primary_source` is a boolean. Its recorded input and response are reproduced in the Errors section above; see TEST-REPORT.md for the full battery.

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "document": "The company grew by 5% in Q3.",
  "process": {
    "claims_extracted": true,
    "units_and_dates_checked": true,
    "counter_case_considered": true,
    "evidence_published_inline": true,
    "methodology_visible_for_big_claims": true,
    "corrections_policy_published": true,
    "versions_retained": true,
    "silent_edits_made": false
  },
  "claims": [
    {
      "id": "c1",
      "material": true,
      "label": "verified",
      "independent_sources": 2,
      "primary_source": true,
      "sources_archived": true,
      "source_metadata_recorded": true,
      "independence_checked": true,
      "has_numbers": true,
      "math_rechecked": true,
      "language_weakest_supported": true
    }
  ]
}
```

Response (REST):

```json
{
  "service": "claim-verification-fact-check-stamp",
  "atom_version": "0.1.0",
  "document": "The company grew by 5% in Q3.",
  "verdict": "STAMPED",
  "sections": {
    "extraction": "pass",
    "source_ladder": "pass",
    "triangulation": "pass",
    "compute_rechecks": "pass",
    "uncertainty_language": "pass",
    "publication_and_corrections": "pass"
  },
  "checks": [
    {
      "section": "extraction",
      "check": "claims_extracted_one_row_per_claim",
      "status": "pass",
      "evidence": "isolate every checkable unit — one row per claim"
    },
    {
      "section": "extraction",
      "check": "claims_declared",
      "status": "pass",
      "evidence": "claims declared for verification"
    },
    {
      "section": "source_ladder",
      "check": "source_metadata_recorded_for_every_claim",
      "status": "pass",
      "evidence": "for each source: who, when, method, sample, conflicts of interest recorded"
    },
    {
      "section": "source_ladder",
      "check": "source_independence_checked",
      "status": "pass",
      "evidence": "independence checked — two sources citing each other are one source"
    },
    {
      "section": "source_ladder",
      "check": "material_claim_sources_archived",
      "status": "pass",
      "evidence": "quality gate: every material claim has at least one archived source"
    },
    {
      "section": "triangulation",
      "check": "material_claims_triangulated",
      "status": "pass",
      "evidence": "material claims need >= 2 independent sources, or one primary source plus confirmation"
    },
    {
      "section": "compute_rechecks",
      "check": "numbers_rederived_for_numeric_claims",
      "status": "pass",
      "evidence": "re-derive math for claims carrying numbers"
    },
    {
      "section": "compute_rechecks",
      "check": "units_dates_and_names_checked",
      "status": "pass",
      "evidence": "sanity-check units and orders of magnitude; verify dates and name spellings"
    },
    {
      "section": "uncertainty_language",
      "check": "labels_in_vocabulary",
      "status": "pass",
      "evidence": "labels: verified / likely / contested / unverified"
    },
    {
      "section": "uncertainty_language",
      "check": "language_is_weakest_the_evidence_supports",
      "status": "pass",
      "evidence": "never upgrade 'consistent with' to 'proves'"
    },
    {
      "section": "uncertainty_language",
      "check": "counter_case_considered",
      "status": "pass",
      "evidence": "quality gate: counter-case considered; 'what would change our mind' noted for contested claims"
    },
    {
      "section": "publication_and_corrections",
      "check": "evidence_published_inline",
      "status": "pass",
      "evidence": "publish with evidence: inline citations, archived links"
    },
    {
      "section": "publication_and_corrections",
      "check": "methodology_visible_for_big_claims",
      "status": "pass",
      "evidence": "visible methodology for big claims"
    },
    {
      "section": "publication_and_corrections",
      "check": "corrections_policy_published",
      "status": "pass",
      "evidence": "quality gate: corrections policy published"
    },
    {
      "section": "publication_and_corrections",
      "check": "versions_retained",
      "status": "pass",
      "evidence": "quality gate: versions retained"
    },
    {
      "section": "publication_and_corrections",
      "check": "no_silent_corrections",
      "status": "pass",
      "evidence": "skill red line: corrections are never silent — fast, dated, visible change log"
    }
  ],
  "claims_summary": {
    "claims_total": 1,
    "material_claims": 1,
    "verified_claims": 1
  },
  "summary": "16 pass, 0 fail, 0 missing of 16 checks across six sections.",
  "stamp": "CLAIM-VERIFICATION FACT-CHECK STAMP\ndocument: The company grew by 5% in Q3.\nVERDICT: STAMPED\n  extraction                 pass\n  source_ladder              pass\n  triangulation              pass\n  compute_rechecks           pass\n  uncertainty_language       pass\n  publication_and_corrections pass\n16 pass, 0 fail, 0 missing of 16 checks across six sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "document": "Data is false.",
  "process": {
    "claims_extracted": true,
    "units_and_dates_checked": true,
    "counter_case_considered": true,
    "evidence_published_inline": true,
    "methodology_visible_for_big_claims": true,
    "corrections_policy_published": true,
    "versions_retained": true,
    "silent_edits_made": true
  },
  "claims": [
    {
      "id": "c2",
      "material": true,
      "label": "verified",
      "independent_sources": 0,
      "primary_source": false,
      "sources_archived": false,
      "source_metadata_recorded": true,
      "independence_checked": true,
      "has_numbers": true,
      "math_rechecked": false,
      "language_weakest_supported": true
    }
  ]
}
```

Response (REST):

```json
{
  "service": "claim-verification-fact-check-stamp",
  "atom_version": "0.1.0",
  "document": "Data is false.",
  "verdict": "NOT_STAMPED",
  "sections": {
    "extraction": "pass",
    "source_ladder": "fail",
    "triangulation": "fail",
    "compute_rechecks": "fail",
    "uncertainty_language": "pass",
    "publication_and_corrections": "fail"
  },
  "checks": [
    {
      "section": "extraction",
      "check": "claims_extracted_one_row_per_claim",
      "status": "pass",
      "evidence": "isolate every checkable unit — one row per claim"
    },
    {
      "section": "extraction",
      "check": "claims_declared",
      "status": "pass",
      "evidence": "claims declared for verification"
    },
    {
      "section": "source_ladder",
      "check": "source_metadata_recorded_for_every_claim",
      "status": "pass",
      "evidence": "for each source: who, when, method, sample, conflicts of interest recorded"
    },
    {
      "section": "source_ladder",
      "check": "source_independence_checked",
      "status": "pass",
      "evidence": "independence checked — two sources citing each other are one source"
    },
    {
      "section": "source_ladder",
      "check": "material_claim_sources_archived",
      "status": "fail",
      "evidence": "material claims without archived sources: c2"
    },
    {
      "section": "triangulation",
      "check": "material_claims_triangulated",
      "status": "fail",
      "evidence": "material claims not triangulated: c2"
    },
    {
      "section": "compute_rechecks",
      "check": "numbers_rederived_for_numeric_claims",
      "status": "fail",
      "evidence": "numeric claims whose math was not re-derived: c2"
    },
    {
      "section": "compute_rechecks",
      "check": "units_dates_and_names_checked",
      "status": "pass",
      "evidence": "sanity-check units and orders of magnitude; verify dates and name spellings"
    },
    {
      "section": "uncertainty_language",
      "check": "labels_in_vocabulary",
      "status": "pass",
      "evidence": "labels: verified / likely / contested / unverified"
    },
    {
      "section": "uncertainty_language",
      "check": "language_is_weakest_the_evidence_supports",
      "status": "pass",
      "evidence": "never upgrade 'consistent with' to 'proves'"
    },
    {
      "section": "uncertainty_language",
      "check": "counter_case_considered",
      "status": "pass",
      "evidence": "quality gate: counter-case considered; 'what would change our mind' noted for contested claims"
    },
    {
      "section": "publication_and_corrections",
      "check": "evidence_published_inline",
      "status": "pass",
      "evidence": "publish with evidence: inline citations, archived links"
    },
    {
      "section": "publication_and_corrections",
      "check": "methodology_visible_for_big_claims",
      "status": "pass",
      "evidence": "visible methodology for big claims"
    },
    {
      "section": "publication_and_corrections",
      "check": "corrections_policy_published",
      "status": "pass",
      "evidence": "quality gate: corrections policy published"
    },
    {
      "section": "publication_and_corrections",
      "check": "versions_retained",
      "status": "pass",
      "evidence": "quality gate: versions retained"
    },
    {
      "section": "publication_and_corrections",
      "check": "no_silent_corrections",
      "status": "fail",
      "evidence": "skill red line: corrections are never silent — fast, dated, visible change log"
    }
  ],
  "claims_summary": {
    "claims_total": 1,
    "material_claims": 1,
    "verified_claims": 1
  },
  "summary": "12 pass, 4 fail, 0 missing of 16 checks across six sections.",
  "stamp": "CLAIM-VERIFICATION FACT-CHECK STAMP\ndocument: Data is false.\nVERDICT: NOT_STAMPED\n  extraction                 pass\n  source_ladder              fail\n  triangulation              fail\n  compute_rechecks           fail\n  uncertainty_language       pass\n  publication_and_corrections fail\n12 pass, 4 fail, 0 missing of 16 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "document": "Valid string",
  "process": "should_be_an_object",
  "claims": "should_be_a_list"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "process",
  "detail": "process must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators Yes |
| Checks named: documented vs recorded | 16 / 16 (from the recorded full-pass REST response `checks` array) |
| Verdict vocabulary complete | Yes — 3 verdict values, 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 20 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/claim-verification-fact-check-stamp/evidence.json` |

