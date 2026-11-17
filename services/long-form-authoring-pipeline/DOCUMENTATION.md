# Long form authoring pipeline — documentation

**Long form authoring pipeline** · slug `long-form-authoring-pipeline` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. Those are stale. TEST-REPORT.md and the recorded evidence in `verification/work/long-form-authoring-pipeline/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `work` "The Art of Authoring"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "long-form-authoring-pipeline"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the authoring-pipeline manifest.** You declare a record of a long-form work's authoring pipeline — the atom audits the declared record, it does not write, draft or edit prose (see Explanation). The recorded full-pass manifest declares the work `The Art of Authoring`: the TOC approved before drafting, chapters or modules defined and scope fences defined; one unit row, `Intro`, with a single point and a non-empty point or outcome; drafting in small units, examples before abstractions, a style sheet and a glossary maintained; comments triaged, not blind-applied; four review passes covering `structure`, `technical_accuracy`, `style_read_aloud` and `facts_attribution`, all recorded; sources in git / Markdown, research kept separate from prose, editions tagged and a changelog per edition; a deterministic pipeline, templates pinned, preview builds for reviewers, and artifacts hashed and signed; distribution channels defined, metadata or platform setup complete, the launch checklist completed and sample and errata pages published; reader / learner feedback collected, a corrections list maintained, corrections feeding the next edition, errata visible and drop-off analytics reviewed; and all three red-line flags `false` (no publishing without an accuracy pass, no silent edition edits, no unverified quotes or attributions).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/long-form-authoring-pipeline` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `AUTHORING_PIPELINE_SOUND`: "36 pass, 0 fail, 0 missing of 36 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `units_count` is 1, `review_passes_count` is 4, and `single_point_coverage`, `point_or_outcome_coverage`, `recorded_review_pass_coverage` and `valid_review_pass_type_coverage` are each `"1.000000"`, with all five row-name / type lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `AUTHORING_PIPELINE_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "long-form-authoring-pipeline"}`.
3. Call: `POST https://atoms.pipavia.com/v1/long-form-authoring-pipeline` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/long-form-authoring-pipeline` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `long_form_authoring_pipeline`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `AUTHORING_PIPELINE_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_unit_has_single_point`, `every_unit_point_or_outcome_declared`, `every_review_pass_recorded`, `all_required_review_pass_types_present`, and the summary reads "32 pass, 4 fail, 0 missing of 36 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `units_without_single_point` names `Intro` — that row declares `has_single_point: false` — `single_point_coverage` is `"0.000000"`, `units_without_point_or_outcome` names `Intro` — that row declares `point_or_outcome` `""` — `point_or_outcome_coverage` is `"0.000000"`, `review_passes_without_record` names `P4` — that row declares `recorded: false` — `recorded_review_pass_coverage` is `"0.750000"`, `review_passes_with_invalid_type` is `[]`, `valid_review_pass_type_coverage` is `"1.000000"`, `missing_review_pass_types` is `["facts_attribution"]` — pass `P4` declares `pass_type` `"structure"` (a duplicate) instead of `facts_attribution` — sections `outline_as_contract` and `review_passes` report `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "units",
  "detail": "units must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/long-form-authoring-pipeline` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/long-form-authoring-pipeline` — tool name `long_form_authoring_pipeline`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `long_form_authoring_pipeline` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `work` and the `units[]` / `review_passes[]` string fields are noted as strings and `units` and `review_passes` as lists there. Where SERVICE.md states no type — the section container objects (`outline`, `drafting`, `review`, `versioning`, `builds`, `publishing`, `feedback`, `red_lines`) and a `units[]` / `review_passes[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `units` / `review_passes` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `AUTHORING_PIPELINE_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `work` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: outline_as_contract

| Field | Type | Notes |
|---|---|---|
| `outline` | object | The outline section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `outline.toc_approved_before_drafting` | boolean | — |
| `outline.chapters_or_modules_defined` | boolean | — |
| `outline.scope_fences_defined` | boolean | — |
| `units` | list | list of unit-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `units[]` | object | One declared unit row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `units[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `units[].point_or_outcome` | string | The unit's point or its claim / learning outcome; must be non-empty, see below (type stated in SERVICE.md) |
| `units[].has_single_point` | boolean | — |

#### Read by: drafting_loop

| Field | Type | Notes |
|---|---|---|
| `drafting` | object | The drafting section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `drafting.small_units_used` | boolean | — |
| `drafting.examples_before_abstractions` | boolean | — |
| `drafting.style_sheet_maintained` | boolean | — |
| `drafting.glossary_maintained` | boolean | — |

#### Read by: review_passes

| Field | Type | Notes |
|---|---|---|
| `review` | object | The review section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `review.comments_triaged_not_blind_applied` | boolean | — |
| `review_passes` | list | list of review-pass-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `review_passes[]` | object | One declared review-pass row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `review_passes[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `review_passes[].pass_type` | string | Must be one of `structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution` — the skill's own set (type and set stated in SERVICE.md) |
| `review_passes[].recorded` | boolean | — |

#### Read by: versioning_and_builds

| Field | Type | Notes |
|---|---|---|
| `versioning` | object | The versioning section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `versioning.sources_in_git_markdown` | boolean | — |
| `versioning.research_kept_separate_from_prose` | boolean | — |
| `versioning.editions_tagged` | boolean | — |
| `versioning.changelog_per_edition` | boolean | — |
| `builds` | object | The builds section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `builds.deterministic_pipeline` | boolean | — |
| `builds.templates_pinned` | boolean | — |
| `builds.preview_builds_for_reviewers` | boolean | — |
| `builds.artifacts_hashed` | boolean | — |
| `builds.artifacts_signed` | boolean | — |

#### Read by: publishing

| Field | Type | Notes |
|---|---|---|
| `publishing` | object | The publishing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `publishing.distribution_channels_defined` | boolean | — |
| `publishing.metadata_or_platform_setup_complete` | boolean | — |
| `publishing.launch_checklist_completed` | boolean | — |
| `publishing.sample_and_errata_pages_published` | boolean | — |

#### Read by: feedback_loop_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `feedback` | object | The feedback section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `feedback.reader_learner_feedback_collected` | boolean | — |
| `feedback.corrections_list_maintained` | boolean | — |
| `feedback.corrections_feed_next_edition` | boolean | — |
| `feedback.errata_visible` | boolean | — |
| `feedback.drop_off_analytics_reviewed` | boolean | — |
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.published_without_accuracy_pass_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.silent_edition_edits_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unverified_quotes_or_attributions_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 36 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: outline_as_contract

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `toc_approved_before_drafting` | outline as contract: the TOC is approved before drafting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chapters_or_modules_defined` | outline as contract: chapters or modules are defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `scope_fences_defined` | outline as contract: scope fences — what the work won't cover — are defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `units_declared` | the declared record names its units — the units list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_unit_has_single_point` | outline as contract: every declared unit row has one point | Computed over the declared record. Pass: every declared unit row declares `has_single_point: true`. Fail: a row declares `has_single_point` present but not `true` (offending rows are named in `units_without_single_point`). Missing: the list is absent, or a row has `has_single_point` absent (such a row is missing evidence and does not appear in `units_without_single_point`). |
| `every_unit_point_or_outcome_declared` | outline as contract: every declared unit row maps to a claim or learning outcome — its point or outcome is declared and non-empty | Computed over the declared record. Pass: every declared unit row declares a non-empty `point_or_outcome` string. Fail: a row declares `point_or_outcome` present but empty (offending rows are named in `units_without_point_or_outcome`). Missing: the list is absent, or a row has `point_or_outcome` absent (such a row is missing evidence and does not appear in `units_without_point_or_outcome`). |

#### Section: drafting_loop

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `small_units_used` | drafting loop: drafting proceeds in small units | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `examples_before_abstractions` | drafting loop: examples come before abstractions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `style_sheet_maintained` | drafting loop: a running style sheet is maintained for consistency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `glossary_maintained` | drafting loop: a glossary is maintained for consistency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: review_passes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `comments_triaged_not_blind_applied` | review passes: comments are triaged, not blind-applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `review_passes_declared` | the declared record names its review passes — the review_passes list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_review_pass_recorded` | review passes: every declared review pass row is recorded — who, when, what changed | Computed over the declared record. Pass: every declared review pass row declares `recorded: true`. Fail: a row declares `recorded` present but not `true` (offending rows are named in `review_passes_without_record`). Missing: the list is absent, or a row has `recorded` absent (such a row is missing evidence and does not appear in `review_passes_without_record`). |
| `every_review_pass_type_valid` | review passes: every declared review pass row declares a pass type from the skill's set — structure / technical_accuracy / style_read_aloud / facts_attribution | Computed over the declared record. Pass: every declared review pass row declares `pass_type` from the skill's set — `structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`. Fail: a row declares `pass_type` present but not in that set (offending rows are named in `review_passes_with_invalid_type`). Missing: the list is absent, or a row has `pass_type` absent (such a row is missing evidence and does not appear in `review_passes_with_invalid_type`). |
| `all_required_review_pass_types_present` | review passes: all four of the skill's pass types are present — structure, technical/accuracy, style/read-aloud and facts/attribution | Computed over the declared record. Pass: the declared pass rows cover all four of the skill's pass types — `structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`. Fail: a required pass type is not declared by any row (missing types are named in `missing_review_pass_types`). Missing: the `review_passes` list is absent. |

#### Section: versioning_and_builds

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sources_in_git_markdown` | versioning: sources are in git, in markdown | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `research_kept_separate_from_prose` | versioning: research is kept separate from prose | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `editions_tagged` | versioning: editions are tagged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `changelog_per_edition` | versioning: a changelog is kept per edition | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deterministic_pipeline` | builds: the build pipeline is deterministic — markdown to HTML / ebook / PDF | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `templates_pinned` | builds: templates are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `preview_builds_for_reviewers` | builds: preview builds are distributed for reviewers | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `artifacts_hashed` | builds: artifacts are hashed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `artifacts_signed` | builds: artifacts are signed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: publishing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `distribution_channels_defined` | publishing: distribution channels are defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metadata_or_platform_setup_complete` | publishing: book metadata — ISBN, description, cover — or course platform setup, including entitlements, is complete | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `launch_checklist_completed` | publishing: the launch checklist is completed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sample_and_errata_pages_published` | publishing: sample and errata pages are published | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: feedback_loop_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `reader_learner_feedback_collected` | feedback loop: reader or learner feedback is collected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `corrections_list_maintained` | feedback loop: feedback feeds a corrections list | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `corrections_feed_next_edition` | feedback loop: the corrections list feeds the next edition | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `errata_visible` | feedback loop: errata are visible — the errata and feedback channel is live | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `drop_off_analytics_reviewed` | feedback loop: analytics on drop-off points are reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_publishing_without_accuracy_pass` | red line: no publishing without an accuracy pass is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_silent_edition_edits` | red line: no silent edition edits are present — no silent edits across editions | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unverified_quotes_or_attributions` | red line: no unverified quotes or attributions are present — quotes and attributions are verified | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"long-form-authoring-pipeline"`), `atom_version` (`"0.1.0"`), and `work` (the manifest's declared work value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `units_count` and `review_passes_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `units_without_single_point` (units whose `has_single_point` field is present but not `true`; a unit with the field absent is missing evidence and does not appear), `units_without_point_or_outcome` (units whose `point_or_outcome` is present but empty), `review_passes_without_record` (passes whose `recorded` field is present but not `true`) and `review_passes_with_invalid_type` (passes whose `pass_type` is present but not in the skill's set), and the type list `missing_review_pass_types` (the skill's pass types not declared by any row, in the skill's order; null when the `review_passes` list is not declared) — all five lists are null when the relevant list is not declared, as recorded in the sparse case; and the ratios `single_point_coverage` (units with a single point ÷ declared units), `point_or_outcome_coverage` (units with a non-empty point or outcome ÷ declared units), `recorded_review_pass_coverage` (recorded passes ÷ declared passes) and `valid_review_pass_type_coverage` (passes with a valid type ÷ declared passes) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "36 pass, 0 fail, 0 missing of 36 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared work value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `AUTHORING_PIPELINE_SOUND` — all 36 checks pass: the declared authoring-pipeline record is complete and consistent with the bound skill's checklist and red lines.
- `AUTHORING_PIPELINE_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the seven primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `units_count`, `units_without_single_point`, `single_point_coverage`, `units_without_point_or_outcome`, `point_or_outcome_coverage`, `review_passes_count`, `review_passes_without_record`, `recorded_review_pass_coverage`, `review_passes_with_invalid_type`, `valid_review_pass_type_coverage`, `missing_review_pass_types` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"units","detail":"units must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Produce long-form work systematically — approved outlines, review passes, versioned builds, clean publishing (the bound capability, from the skill). You submit one declared record — the authoring-pipeline manifest for one work (book, course, guide or long document) — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`outline_as_contract`, `drafting_loop`, `review_passes`, `versioning_and_builds`, `publishing`, `feedback_loop_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `units` list must be present and non-empty, every unit row must declare `has_single_point: true` and a non-empty `point_or_outcome` string, the declared `review_passes` list must be present and non-empty, every pass row must declare `recorded: true` and a `pass_type` from the skill's own set (`structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`), and all four required pass types must be present — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `AUTHORING_PIPELINE_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `AUTHORING_PIPELINE_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a word count, page count or length minimum or maximum per unit or per work (the skill says only "small units" and states no size); a number of chapters, modules or units a work must contain; a number of review passes beyond the skill's own four named pass types, a reviewer count, or a reviewer-qualification bar (the skill says only that the technical/accuracy pass is by a domain expert — caller attestation); a drafting schedule, velocity or deadline; a readability, style or quality score; an accuracy error rate or a number of corrections tolerated; a build time, a hash algorithm, or a signing standard (the skill names hashing and signing, not a method); an ISBN or metadata-completeness score beyond the declared complete flag; a sales, enrolment or completion target; a feedback volume, response rate or correction turnaround; a drop-off percentage for courses; an edition frequency or changelog length; a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** authoring-pipeline record: a verdict of `AUTHORING_PIPELINE_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares an approved outline, recorded review passes and signed artifacts passes those checks even if the real pipeline did none of it. It is a completeness and consistency audit of the record the skill requires, **not an authoring, editing or publishing service, and not a judgment that the work itself is good**. Specifically: it writes, drafts and edits no prose, reads no manuscript, runs no build, checks no hash or signature, and does not verify that a declared pass, approval or changelog entry actually happened. It never judges prose quality, whether an outline is the right structure, whether a unit's point is worth making, or whether a review was competent — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — the prose, the outline, the style sheet and the glossary are never read, and unverified quotes or attributions are a caller-declared present / absent flag; review quality and domain accuracy in substance (whether the accuracy pass genuinely caught errors, whether a domain expert really reviewed) are caller declarations — only their declared presence and record are checked; the recorded detail of a pass (who, when, what changed) is carried in the caller's own records — the atom checks only the declared `recorded` flag, not the record's contents.

**Buyer and use context.** Teams and agents working in Writing & documents who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Book and course authoring (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared long-form authoring-pipeline record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not an authoring, editing or publishing service and not a judgment that the work itself is good, and that it verifies no declared fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `long_form_authoring_pipeline` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/long_form_authoring_pipeline.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_long_form_authoring_pipeline.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/long-form-authoring-pipeline` (REST) and `POST /mcp/long-form-authoring-pipeline` (MCP, tool `long_form_authoring_pipeline`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `long_form_authoring_pipeline`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state: live — release candidate, RC soak to 2026-11-22.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_publishing_without_accuracy_pass` (input `red_lines.published_without_accuracy_pass_present`), `no_silent_edition_edits` (input `red_lines.silent_edition_edits_present`) and `no_unverified_quotes_or_attributions` (input `red_lines.unverified_quotes_or_attributions_present`), plus the computed checks `units_declared`, `every_unit_has_single_point` and `every_unit_point_or_outcome_declared`, which read the `units` rows rather than any single input field, and `review_passes_declared`, `every_review_pass_recorded`, `every_review_pass_type_valid` and `all_required_review_pass_types_present`, which read the `review_passes` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 36 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Section grouping vs input objects:** the recorded sections merge separate input objects — `versioning` and `builds` inputs are read by the single recorded section `versioning_and_builds`, and `feedback` and `red_lines` inputs are read by the single recorded section `feedback_loop_and_red_lines`; likewise the `outline` object and the `units` rows are read by `outline_as_contract`, and the `review` object and the `review_passes` rows are read by `review_passes`. This document groups the Input reference and the Checks by the recorded section names.
5. **Null lists on an undeclared list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `units_count`, `review_passes_count`, the coverage ratios and `missing_review_pass_types`, but does not state a null rule for the other row-name lists. The recorded sparse response returns all of `units_without_single_point`, `units_without_point_or_outcome`, `review_passes_without_record` and `review_passes_with_invalid_type` as `null` when the relevant list is not declared (as USER-GUIDE.md also states); this document follows the recording.
6. **Documentation absence at verification time:** TEST-REPORT.md records that at verification `GET https://atoms.pipavia.com/docs/long-form-authoring-pipeline` returned 404 and this atom's entry in `GET https://atoms.pipavia.com/api.json` carried no `documentation` key, and states that absence was designed — Batch 16's WS1 documentation pass follows that wave. This document is that follow-up pass; the absence was recorded only and never scored against the atom.

## Worked examples

Provenance: recorded 2026-11-16T07:36:31.548479+00:00 against gateway v1.1.0, external verification lane, source `verification/work/long-form-authoring-pipeline/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:36:31.548479+00:00 · gateway v1.1.0 · source `verification/work/long-form-authoring-pipeline/evidence.json`.

Input:

```json
{
  "work": "The Art of Authoring",
  "outline": {
    "toc_approved_before_drafting": true,
    "chapters_or_modules_defined": true,
    "scope_fences_defined": true
  },
  "units": [
    {
      "name": "Intro",
      "point_or_outcome": "Understanding the pipeline",
      "has_single_point": true
    }
  ],
  "drafting": {
    "small_units_used": true,
    "examples_before_abstractions": true,
    "style_sheet_maintained": true,
    "glossary_maintained": true
  },
  "review": {
    "comments_triaged_not_blind_applied": true
  },
  "review_passes": [
    {
      "name": "P1",
      "pass_type": "structure",
      "recorded": true
    },
    {
      "name": "P2",
      "pass_type": "technical_accuracy",
      "recorded": true
    },
    {
      "name": "P3",
      "pass_type": "style_read_aloud",
      "recorded": true
    },
    {
      "name": "P4",
      "pass_type": "facts_attribution",
      "recorded": true
    }
  ],
  "versioning": {
    "sources_in_git_markdown": true,
    "research_kept_separate_from_prose": true,
    "editions_tagged": true,
    "changelog_per_edition": true
  },
  "builds": {
    "deterministic_pipeline": true,
    "templates_pinned": true,
    "preview_builds_for_reviewers": true,
    "artifacts_hashed": true,
    "artifacts_signed": true
  },
  "publishing": {
    "distribution_channels_defined": true,
    "metadata_or_platform_setup_complete": true,
    "launch_checklist_completed": true,
    "sample_and_errata_pages_published": true
  },
  "feedback": {
    "reader_learner_feedback_collected": true,
    "corrections_list_maintained": true,
    "corrections_feed_next_edition": true,
    "errata_visible": true,
    "drop_off_analytics_reviewed": true
  },
  "red_lines": {
    "published_without_accuracy_pass_present": false,
    "silent_edition_edits_present": false,
    "unverified_quotes_or_attributions_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "long-form-authoring-pipeline",
  "atom_version": "0.1.0",
  "work": "The Art of Authoring",
  "verdict": "AUTHORING_PIPELINE_SOUND",
  "sections": {
    "outline_as_contract": "pass",
    "drafting_loop": "pass",
    "review_passes": "pass",
    "versioning_and_builds": "pass",
    "publishing": "pass",
    "feedback_loop_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "outline_as_contract",
      "check": "toc_approved_before_drafting",
      "status": "pass",
      "evidence": "outline as contract: the TOC is approved before drafting"
    },
    {
      "section": "outline_as_contract",
      "check": "chapters_or_modules_defined",
      "status": "pass",
      "evidence": "outline as contract: chapters or modules are defined"
    },
    {
      "section": "outline_as_contract",
      "check": "scope_fences_defined",
      "status": "pass",
      "evidence": "outline as contract: scope fences — what the work won't cover — are defined"
    },
    {
      "section": "outline_as_contract",
      "check": "units_declared",
      "status": "pass",
      "evidence": "the declared record names its units — the units list is present and non-empty"
    },
    {
      "section": "outline_as_contract",
      "check": "every_unit_has_single_point",
      "status": "pass",
      "evidence": "outline as contract: every declared unit row has one point"
    },
    {
      "section": "outline_as_contract",
      "check": "every_unit_point_or_outcome_declared",
      "status": "pass",
      "evidence": "outline as contract: every declared unit row maps to a claim or learning outcome — its point or outcome is declared and non-empty"
    },
    {
      "section": "drafting_loop",
      "check": "small_units_used",
      "status": "pass",
      "evidence": "drafting loop: drafting proceeds in small units"
    },
    {
      "section": "drafting_loop",
      "check": "examples_before_abstractions",
      "status": "pass",
      "evidence": "drafting loop: examples come before abstractions"
    },
    {
      "section": "drafting_loop",
      "check": "style_sheet_maintained",
      "status": "pass",
      "evidence": "drafting loop: a running style sheet is maintained for consistency"
    },
    {
      "section": "drafting_loop",
      "check": "glossary_maintained",
      "status": "pass",
      "evidence": "drafting loop: a glossary is maintained for consistency"
    },
    {
      "section": "review_passes",
      "check": "comments_triaged_not_blind_applied",
      "status": "pass",
      "evidence": "review passes: comments are triaged, not blind-applied"
    },
    {
      "section": "review_passes",
      "check": "review_passes_declared",
      "status": "pass",
      "evidence": "the declared record names its review passes — the review_passes list is present and non-empty"
    },
    {
      "section": "review_passes",
      "check": "every_review_pass_recorded",
      "status": "pass",
      "evidence": "review passes: every declared review pass row is recorded — who, when, what changed"
    },
    {
      "section": "review_passes",
      "check": "every_review_pass_type_valid",
      "status": "pass",
      "evidence": "review passes: every declared review pass row declares a pass type from the skill's set — structure / technical_accuracy / style_read_aloud / facts_attribution"
    },
    {
      "section": "review_passes",
      "check": "all_required_review_pass_types_present",
      "status": "pass",
      "evidence": "review passes: all four of the skill's pass types are present — structure, technical/accuracy, style/read-aloud and facts/attribution"
    },
    {
      "section": "versioning_and_builds",
      "check": "sources_in_git_markdown",
      "status": "pass",
      "evidence": "versioning: sources are in git, in markdown"
    },
    {
      "section": "versioning_and_builds",
      "check": "research_kept_separate_from_prose",
      "status": "pass",
      "evidence": "versioning: research is kept separate from prose"
    },
    {
      "section": "versioning_and_builds",
      "check": "editions_tagged",
      "status": "pass",
      "evidence": "versioning: editions are tagged"
    },
    {
      "section": "versioning_and_builds",
      "check": "changelog_per_edition",
      "status": "pass",
      "evidence": "versioning: a changelog is kept per edition"
    },
    {
      "section": "versioning_and_builds",
      "check": "deterministic_pipeline",
      "status": "pass",
      "evidence": "builds: the build pipeline is deterministic — markdown to HTML / ebook / PDF"
    },
    {
      "section": "versioning_and_builds",
      "check": "templates_pinned",
      "status": "pass",
      "evidence": "builds: templates are pinned"
    },
    {
      "section": "versioning_and_builds",
      "check": "preview_builds_for_reviewers",
      "status": "pass",
      "evidence": "builds: preview builds are distributed for reviewers"
    },
    {
      "section": "versioning_and_builds",
      "check": "artifacts_hashed",
      "status": "pass",
      "evidence": "builds: artifacts are hashed"
    },
    {
      "section": "versioning_and_builds",
      "check": "artifacts_signed",
      "status": "pass",
      "evidence": "builds: artifacts are signed"
    },
    {
      "section": "publishing",
      "check": "distribution_channels_defined",
      "status": "pass",
      "evidence": "publishing: distribution channels are defined"
    },
    {
      "section": "publishing",
      "check": "metadata_or_platform_setup_complete",
      "status": "pass",
      "evidence": "publishing: book metadata — ISBN, description, cover — or course platform setup, including entitlements, is complete"
    },
    {
      "section": "publishing",
      "check": "launch_checklist_completed",
      "status": "pass",
      "evidence": "publishing: the launch checklist is completed"
    },
    {
      "section": "publishing",
      "check": "sample_and_errata_pages_published",
      "status": "pass",
      "evidence": "publishing: sample and errata pages are published"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "reader_learner_feedback_collected",
      "status": "pass",
      "evidence": "feedback loop: reader or learner feedback is collected"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "corrections_list_maintained",
      "status": "pass",
      "evidence": "feedback loop: feedback feeds a corrections list"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "corrections_feed_next_edition",
      "status": "pass",
      "evidence": "feedback loop: the corrections list feeds the next edition"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "errata_visible",
      "status": "pass",
      "evidence": "feedback loop: errata are visible — the errata and feedback channel is live"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "drop_off_analytics_reviewed",
      "status": "pass",
      "evidence": "feedback loop: analytics on drop-off points are reviewed"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_publishing_without_accuracy_pass",
      "status": "pass",
      "evidence": "red line: no publishing without an accuracy pass is present"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_silent_edition_edits",
      "status": "pass",
      "evidence": "red line: no silent edition edits are present — no silent edits across editions"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_unverified_quotes_or_attributions",
      "status": "pass",
      "evidence": "red line: no unverified quotes or attributions are present — quotes and attributions are verified"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "units_count": 1,
  "units_without_single_point": [],
  "single_point_coverage": "1.000000",
  "units_without_point_or_outcome": [],
  "point_or_outcome_coverage": "1.000000",
  "review_passes_count": 4,
  "review_passes_without_record": [],
  "recorded_review_pass_coverage": "1.000000",
  "review_passes_with_invalid_type": [],
  "valid_review_pass_type_coverage": "1.000000",
  "missing_review_pass_types": [],
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections.",
  "stamp": "LONG FORM AUTHORING PIPELINE\nwork: The Art of Authoring\nVERDICT: AUTHORING_PIPELINE_SOUND\n  outline_as_contract                  pass\n  drafting_loop                        pass\n  review_passes                        pass\n  versioning_and_builds                pass\n  publishing                           pass\n  feedback_loop_and_red_lines          pass\n36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:36:31.548479+00:00 · gateway v1.1.0 · source `verification/work/long-form-authoring-pipeline/evidence.json`.

Input:

```json
{
  "work": "The Art of Authoring",
  "outline": {
    "toc_approved_before_drafting": true,
    "chapters_or_modules_defined": true,
    "scope_fences_defined": true
  },
  "units": [
    {
      "name": "Intro",
      "point_or_outcome": "",
      "has_single_point": false
    }
  ],
  "drafting": {
    "small_units_used": true,
    "examples_before_abstractions": true,
    "style_sheet_maintained": true,
    "glossary_maintained": true
  },
  "review": {
    "comments_triaged_not_blind_applied": true
  },
  "review_passes": [
    {
      "name": "P1",
      "pass_type": "structure",
      "recorded": true
    },
    {
      "name": "P2",
      "pass_type": "technical_accuracy",
      "recorded": true
    },
    {
      "name": "P3",
      "pass_type": "style_read_aloud",
      "recorded": true
    },
    {
      "name": "P4",
      "pass_type": "structure",
      "recorded": false
    }
  ],
  "versioning": {
    "sources_in_git_markdown": true,
    "research_kept_separate_from_prose": true,
    "editions_tagged": true,
    "changelog_per_edition": true
  },
  "builds": {
    "deterministic_pipeline": true,
    "templates_pinned": true,
    "preview_builds_for_reviewers": true,
    "artifacts_hashed": true,
    "artifacts_signed": true
  },
  "publishing": {
    "distribution_channels_defined": true,
    "metadata_or_platform_setup_complete": true,
    "launch_checklist_completed": true,
    "sample_and_errata_pages_published": true
  },
  "feedback": {
    "reader_learner_feedback_collected": true,
    "corrections_list_maintained": true,
    "corrections_feed_next_edition": true,
    "errata_visible": true,
    "drop_off_analytics_reviewed": true
  },
  "red_lines": {
    "published_without_accuracy_pass_present": false,
    "silent_edition_edits_present": false,
    "unverified_quotes_or_attributions_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "long-form-authoring-pipeline",
  "atom_version": "0.1.0",
  "work": "The Art of Authoring",
  "verdict": "AUTHORING_PIPELINE_NOT_SOUND",
  "sections": {
    "outline_as_contract": "fail",
    "drafting_loop": "pass",
    "review_passes": "fail",
    "versioning_and_builds": "pass",
    "publishing": "pass",
    "feedback_loop_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "outline_as_contract",
      "check": "toc_approved_before_drafting",
      "status": "pass",
      "evidence": "outline as contract: the TOC is approved before drafting"
    },
    {
      "section": "outline_as_contract",
      "check": "chapters_or_modules_defined",
      "status": "pass",
      "evidence": "outline as contract: chapters or modules are defined"
    },
    {
      "section": "outline_as_contract",
      "check": "scope_fences_defined",
      "status": "pass",
      "evidence": "outline as contract: scope fences — what the work won't cover — are defined"
    },
    {
      "section": "outline_as_contract",
      "check": "units_declared",
      "status": "pass",
      "evidence": "the declared record names its units — the units list is present and non-empty"
    },
    {
      "section": "outline_as_contract",
      "check": "every_unit_has_single_point",
      "status": "fail",
      "evidence": "outline as contract: every declared unit row has one point"
    },
    {
      "section": "outline_as_contract",
      "check": "every_unit_point_or_outcome_declared",
      "status": "fail",
      "evidence": "outline as contract: every declared unit row maps to a claim or learning outcome — its point or outcome is declared and non-empty"
    },
    {
      "section": "drafting_loop",
      "check": "small_units_used",
      "status": "pass",
      "evidence": "drafting loop: drafting proceeds in small units"
    },
    {
      "section": "drafting_loop",
      "check": "examples_before_abstractions",
      "status": "pass",
      "evidence": "drafting loop: examples come before abstractions"
    },
    {
      "section": "drafting_loop",
      "check": "style_sheet_maintained",
      "status": "pass",
      "evidence": "drafting loop: a running style sheet is maintained for consistency"
    },
    {
      "section": "drafting_loop",
      "check": "glossary_maintained",
      "status": "pass",
      "evidence": "drafting loop: a glossary is maintained for consistency"
    },
    {
      "section": "review_passes",
      "check": "comments_triaged_not_blind_applied",
      "status": "pass",
      "evidence": "review passes: comments are triaged, not blind-applied"
    },
    {
      "section": "review_passes",
      "check": "review_passes_declared",
      "status": "pass",
      "evidence": "the declared record names its review passes — the review_passes list is present and non-empty"
    },
    {
      "section": "review_passes",
      "check": "every_review_pass_recorded",
      "status": "fail",
      "evidence": "review passes: every declared review pass row is recorded — who, when, what changed"
    },
    {
      "section": "review_passes",
      "check": "every_review_pass_type_valid",
      "status": "pass",
      "evidence": "review passes: every declared review pass row declares a pass type from the skill's set — structure / technical_accuracy / style_read_aloud / facts_attribution"
    },
    {
      "section": "review_passes",
      "check": "all_required_review_pass_types_present",
      "status": "fail",
      "evidence": "review passes: all four of the skill's pass types are present — structure, technical/accuracy, style/read-aloud and facts/attribution"
    },
    {
      "section": "versioning_and_builds",
      "check": "sources_in_git_markdown",
      "status": "pass",
      "evidence": "versioning: sources are in git, in markdown"
    },
    {
      "section": "versioning_and_builds",
      "check": "research_kept_separate_from_prose",
      "status": "pass",
      "evidence": "versioning: research is kept separate from prose"
    },
    {
      "section": "versioning_and_builds",
      "check": "editions_tagged",
      "status": "pass",
      "evidence": "versioning: editions are tagged"
    },
    {
      "section": "versioning_and_builds",
      "check": "changelog_per_edition",
      "status": "pass",
      "evidence": "versioning: a changelog is kept per edition"
    },
    {
      "section": "versioning_and_builds",
      "check": "deterministic_pipeline",
      "status": "pass",
      "evidence": "builds: the build pipeline is deterministic — markdown to HTML / ebook / PDF"
    },
    {
      "section": "versioning_and_builds",
      "check": "templates_pinned",
      "status": "pass",
      "evidence": "builds: templates are pinned"
    },
    {
      "section": "versioning_and_builds",
      "check": "preview_builds_for_reviewers",
      "status": "pass",
      "evidence": "builds: preview builds are distributed for reviewers"
    },
    {
      "section": "versioning_and_builds",
      "check": "artifacts_hashed",
      "status": "pass",
      "evidence": "builds: artifacts are hashed"
    },
    {
      "section": "versioning_and_builds",
      "check": "artifacts_signed",
      "status": "pass",
      "evidence": "builds: artifacts are signed"
    },
    {
      "section": "publishing",
      "check": "distribution_channels_defined",
      "status": "pass",
      "evidence": "publishing: distribution channels are defined"
    },
    {
      "section": "publishing",
      "check": "metadata_or_platform_setup_complete",
      "status": "pass",
      "evidence": "publishing: book metadata — ISBN, description, cover — or course platform setup, including entitlements, is complete"
    },
    {
      "section": "publishing",
      "check": "launch_checklist_completed",
      "status": "pass",
      "evidence": "publishing: the launch checklist is completed"
    },
    {
      "section": "publishing",
      "check": "sample_and_errata_pages_published",
      "status": "pass",
      "evidence": "publishing: sample and errata pages are published"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "reader_learner_feedback_collected",
      "status": "pass",
      "evidence": "feedback loop: reader or learner feedback is collected"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "corrections_list_maintained",
      "status": "pass",
      "evidence": "feedback loop: feedback feeds a corrections list"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "corrections_feed_next_edition",
      "status": "pass",
      "evidence": "feedback loop: the corrections list feeds the next edition"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "errata_visible",
      "status": "pass",
      "evidence": "feedback loop: errata are visible — the errata and feedback channel is live"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "drop_off_analytics_reviewed",
      "status": "pass",
      "evidence": "feedback loop: analytics on drop-off points are reviewed"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_publishing_without_accuracy_pass",
      "status": "pass",
      "evidence": "red line: no publishing without an accuracy pass is present"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_silent_edition_edits",
      "status": "pass",
      "evidence": "red line: no silent edition edits are present — no silent edits across editions"
    },
    {
      "section": "feedback_loop_and_red_lines",
      "check": "no_unverified_quotes_or_attributions",
      "status": "pass",
      "evidence": "red line: no unverified quotes or attributions are present — quotes and attributions are verified"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "units_count": 1,
  "units_without_single_point": [
    "Intro"
  ],
  "single_point_coverage": "0.000000",
  "units_without_point_or_outcome": [
    "Intro"
  ],
  "point_or_outcome_coverage": "0.000000",
  "review_passes_count": 4,
  "review_passes_without_record": [
    "P4"
  ],
  "recorded_review_pass_coverage": "0.750000",
  "review_passes_with_invalid_type": [],
  "valid_review_pass_type_coverage": "1.000000",
  "missing_review_pass_types": [
    "facts_attribution"
  ],
  "summary": "32 pass, 4 fail, 0 missing of 36 checks across six sections.",
  "stamp": "LONG FORM AUTHORING PIPELINE\nwork: The Art of Authoring\nVERDICT: AUTHORING_PIPELINE_NOT_SOUND\n  outline_as_contract                  fail\n  drafting_loop                        pass\n  review_passes                        fail\n  versioning_and_builds                pass\n  publishing                           pass\n  feedback_loop_and_red_lines          pass\n32 pass, 4 fail, 0 missing of 36 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:36:31.548479+00:00 · gateway v1.1.0 · source `verification/work/long-form-authoring-pipeline/evidence.json`.

Input:

```json
{
  "work": "Malformed",
  "units": "not_a_list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "units",
  "detail": "units must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared long-form authoring-pipeline record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not an authoring, editing or publishing service and not a judgment that the work itself is good, and it verifies no live fact. |
| Checks named | 36 documented / 36 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`units_count` and `review_passes_count`, the five row-name / type lists and the four coverage ratios) |
| Input reference typed | Yes — 48 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/long-form-authoring-pipeline/evidence.json` |
