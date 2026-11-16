# Decision ready research brief — documentation

**Decision ready research brief** · slug `decision-ready-research-brief` · deliverable type REPORT · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `brief` "Market entry strategy"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-ready-research-brief"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the research-brief manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the brief `Market entry strategy`: the decision the research serves is named, the questions are ranked and declared, a timebox is declared and respected, and "enough" is defined. Sources are declared with the full provenance triple (link + date + quote), a source type, and incentives noted, under a primary-over-secondary strategy. Claims are labelled by kind, with confidence stated; material claims name at least one declared supporting source and important claims name at least two distinct declared sources. The synthesis is structured by question with a steelmanned opposing view, and `report_sections` equals the skill's report format exactly and in order — `bluf`, `findings`, `evidence`, `risks`, `open_questions`, `sources`. No AI summaries, scraped data or conflicts are declared, so those gated checks pass as not applicable.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/decision-ready-research-brief` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `RESEARCH_BRIEF_DECISION_READY`: "42 pass, 0 fail, 0 missing of 42 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `RESEARCH_BRIEF_NOT_DECISION_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-ready-research-brief"}`.
3. Call: `POST https://atoms.pipavia.com/v1/decision-ready-research-brief` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/decision-ready-research-brief` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `decision_ready_research_brief`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `RESEARCH_BRIEF_NOT_DECISION_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_source_has_link`, `every_important_claim_triangulated_across_declared_sources`, `no_silent_edits`, and the summary reads "39 pass, 3 fail, 0 missing of 42 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/decision-ready-research-brief` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-ready-research-brief` — tool name `decision_ready_research_brief`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `decision_ready_research_brief` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `RESEARCH_BRIEF_NOT_DECISION_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `brief` | string | Carried into the verdict output, not itself checked |

#### Read by: scoping_and_sources

| Field | Type | Notes |
|---|---|---|
| `scope.decision_named` | boolean | — |
| `scope.questions_ranked` | boolean | — |
| `scope.timebox_declared` | boolean | — |
| `scope.timebox_respected` | boolean | — |
| `scope.enough_criteria_defined` | boolean | — |
| `questions` | list | list of question-row objects, each `{name}` — see the entry field below; computed, see below |
| `questions[].name` | string | Names the question row — the row's presence in the list is what the computed questions check counts |
| `source_strategy.primary_preferred_over_secondary_and_tertiary` | boolean | — |
| `sources` | list | list of source-row objects, each `{name, link, date, quote, source_type, incentives_noted}` — see the six entry fields below; computed, see below |
| `sources[].name` | string | The name a claim's `supporting_source_names` entry must equal for that source to count as supporting the claim |
| `sources[].link` | string | Must be a non-empty string for the row to pass the computed link check — an absent field is missing evidence, an empty string fails |
| `sources[].date` | string | Must be a non-empty string for the row to pass the computed date check — an absent field is missing evidence, an empty string fails; the string is never parsed or compared to any clock, see the freshness note below |
| `sources[].quote` | string | Must be a non-empty string for the row to pass the computed quote check — an absent field is missing evidence, an empty string fails |
| `sources[].source_type` | string | Must be a non-empty string for the row to pass the computed source-type check — no vocabulary is imposed: the skill ranks primary > secondary > tertiary as a strategy, and names no allowed values for a row, so only that a type is declared is checked |
| `sources[].incentives_noted` | boolean | — |

#### Read by: evidence_and_notes

| Field | Type | Notes |
|---|---|---|
| `evidence.notes_question_oriented` | boolean | — |
| `evidence.evidence_table_present` | boolean | — |
| `evidence.fact_estimate_opinion_separated` | boolean | — |
| `evidence.gaps_recorded` | boolean | — |
| `claims` | list | list of claim-row objects, each `{name, kind, material, important, supporting_source_names, confidence_stated}` — see the six entry fields below; computed, see below |
| `claims[].name` | string | Names the row in the computed `material_claims_without_sources` and `important_claims_not_triangulated` outputs |
| `claims[].kind` | string | Must be a non-empty string for the row to pass the computed kind check — no vocabulary is imposed: the skill requires fact / estimate / opinion be separated, and only that each claim is labelled is checked |
| `claims[].material` | boolean (gate) | gates the computed sourcing check below: only material claims are required to name a supporting source |
| `claims[].important` | boolean (gate) | gates the computed triangulation check below: only important claims are required to name two distinct supporting sources |
| `claims[].supporting_source_names` | list of strings | Each entry counts only when it equals a declared source's `name`, and distinct matching names are counted — an absent field on a material or important claim is missing evidence; an absent field on a claim that is neither is not required |
| `claims[].confidence_stated` | boolean | — |

#### Read by: synthesis_and_report_structure

| Field | Type | Notes |
|---|---|---|
| `synthesis.structured_by_question` | boolean | — |
| `synthesis.opposing_view_steelmanned` | boolean | — |
| `synthesis.quantified_where_possible` | boolean | — |
| `synthesis.confidence_stated` | boolean | — |
| `synthesis.unknowns_stated_explicitly` | boolean | — |
| `report_sections` | list of strings | Computed, see below — must equal the skill's report format exactly and in order: `bluf`, `findings`, `evidence`, `risks`, `open_questions`, `sources` |
| `report.version` | string | Must be a non-empty string to pass the computed version check — an absent field is missing evidence, an empty string fails |
| `report.date` | string | Must be a non-empty string to pass the computed date check — an absent field is missing evidence, an empty string fails; the string is never parsed or compared to any clock |
| `report.open_questions_listed` | boolean | — |

#### Read by: reuse_verification_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `reuse.notes_archived_for_reuse` | boolean | — |
| `reuse.updates_via_changelog` | boolean | — |
| `reuse.silent_edits_present` | boolean | must be `false` to pass — skill anti-pattern |
| `tooling.automation_does_not_replace_verification` | boolean | — |
| `tooling.ai_summaries_used` | boolean (gate) | gates the two AI-summary checks below |
| `tooling.ai_summaries_cite_sources` | boolean | required when AI summaries are declared in use; otherwise the check passes as not applicable |
| `tooling.ai_summaries_spot_checked` | boolean | required when AI summaries are declared in use; otherwise the check passes as not applicable |
| `tooling.seo_spam_and_content_farms_screened` | boolean | — |
| `tooling.scraped_or_automated_data_used` | boolean (gate) | gates the quality check below |
| `tooling.scraped_or_automated_data_quality_checked` | boolean | required when scraped or automated data is declared in use; otherwise the check passes as not applicable |
| `disclosure.conflicts_present` | boolean (gate) | gates the disclosure check below |
| `disclosure.conflicts_disclosed` | boolean | required when conflicts are declared present; otherwise the check passes as not applicable |
| `disclosure.unsourced_claims_present` | boolean | must be `false` to pass — skill red line |
| `disclosure.single_source_conclusions_on_important_facts_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 42 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: scoping_and_sources

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `decision_named` | scope first: the decision this research serves is named — no decision, the research is questioned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `questions_ranked` | scope first: the questions are ranked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `questions_declared` | scope first: the declared brief record names its questions — the questions list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `timebox_declared` | scope first: a timebox is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `timebox_respected` | quality gate: the timebox is respected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `enough_criteria_defined` | scope first: what "enough" looks like is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `primary_sources_preferred` | source strategy: primary sources (filings, docs, data) are preferred over secondary, and secondary over tertiary | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sources_declared` | source strategy: the declared brief record names its sources — the sources list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_source_has_link` | source strategy / provenance: every declared source row names a non-empty link — provenance is tracked as link + date + quote | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_source_has_date` | source strategy / provenance: every declared source row names a non-empty date — provenance is tracked as link + date + quote | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_source_has_quote` | source strategy / provenance: every declared source row names a non-empty quote — provenance is tracked as link + date + quote | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_source_declares_source_type` | source strategy / provenance: every declared source row declares its source type — provenance is tracked as link + date + quote | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_source_incentives_noted` | source strategy: every declared source row declares its incentives noted | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: evidence_and_notes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `claims_declared` | notes discipline: the declared brief record names its claims — the claims list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `notes_question_oriented` | notes discipline: notes are question-oriented, not dumps | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `evidence_table_present` | notes discipline: an evidence table is present — claim to sources to confidence to gaps | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fact_estimate_opinion_separated` | notes discipline: fact, estimate and opinion are separated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `gaps_recorded` | notes discipline: gaps are recorded in the evidence table | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_material_claim_sourced_from_declared_sources` | quality gate / red line: every material claim is sourced — it names at least one supporting source that is actually declared; no unsourced claims | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_important_claim_triangulated_across_declared_sources` | source strategy / red line: every important claim is triangulated — it names at least two distinct supporting sources that are actually declared; no single-source conclusions on important facts | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_claim_confidence_stated` | quality gate: every declared claim row declares its confidence stated | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_claim_kind_declared` | notes discipline: every declared claim row declares a non-empty kind — the fact / estimate / opinion separation starts from each claim being labelled | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: synthesis_and_report_structure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `synthesis_structured_by_question` | synthesis: the brief is structured by question | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `opposing_view_steelmanned` | synthesis / quality gate: opposing views are presented as a steelman | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quantified_where_possible` | synthesis: findings are quantified where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `synthesis_confidence_stated` | synthesis: confidence is stated explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unknowns_stated_explicitly` | synthesis: unknowns are stated explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `report_sections_in_skill_order` | report format: the declared report sections are exactly the skill's format in order — bluf, findings, evidence, risks, open_questions, sources | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `report_version_declared` | report format: the report declares a non-empty version — version and date go on every report | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `report_date_declared` | report format: the report declares a non-empty date — version and date go on every report | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `open_questions_listed` | quality gate: open questions are listed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: reuse_verification_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `notes_archived_for_reuse` | reuse: notes are stored and archived for future questions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `updates_via_changelog` | reuse: reports are updated when facts change via a changelog | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_edits` | reuse / anti-pattern: no silent edits — updates are a changelog, not silent edits | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `automation_does_not_replace_verification` | tooling discipline: automation speeds collection but never replaces verification | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ai_summaries_cite_sources_when_used` | no AI summaries declared in use | Conditional on `tooling.ai_summaries_used`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `ai_summaries_spot_checked_when_used` | no AI summaries declared in use | Conditional on `tooling.ai_summaries_used`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `seo_spam_and_content_farms_screened` | tooling discipline: results are watched for SEO spam and content farms | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `scraped_or_automated_data_quality_checked_when_used` | no scraped or automated data declared in use | Conditional on `tooling.scraped_or_automated_data_used`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `conflicts_disclosed_when_present` | no conflicts declared present | Conditional on `disclosure.conflicts_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_unsourced_claims` | red line: no unsourced claims | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_single_source_conclusions_on_important_facts` | red line: no single-source conclusions on important facts | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"decision-ready-research-brief"`), `atom_version` (`"0.1.0"`), and `brief` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `questions_count`, `sources_count` and `claims_count` (declared list lengths as integers, or null when the list is not declared); the row-name lists `sources_without_complete_provenance` (null when the sources list is not declared), `material_claims_without_sources` and `important_claims_not_triangulated` (null when either underlying list — claims or sources — is not declared; a material or important claim whose `supporting_source_names` field is absent is missing evidence and does not appear in these lists); the ratios `source_provenance_coverage`, `material_claim_source_coverage` and `important_claim_triangulation_coverage` (strings with exactly four decimal places; null when the denominator list is absent or empty — and, for the claim ratios, when the sources list is absent or no claim is declared material / important respectively); and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "42 pass, 0 fail, 0 missing of 42 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `RESEARCH_BRIEF_DECISION_READY` — all 42 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `RESEARCH_BRIEF_NOT_DECISION_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the decision_ready_research_brief scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the decision_ready_research_brief scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for decision-ready-research-brief exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run research rigorously — question scoping, source triangulation, evidence notes, decision-ready reports (bound from the `research-tooling` skill). You submit one declared record — the research-brief manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`scoping_and_sources`, `evidence_and_notes`, `synthesis_and_report_structure`, `reuse_verification_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `RESEARCH_BRIEF_NOT_DECISION_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `RESEARCH_BRIEF_DECISION_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no minimum or maximum source, claim or question count; no minimum confidence level or confidence vocabulary (confidence must be *stated*; no scale is imposed); no numeric timebox duration or measured overrun; no maximum source age or freshness window; no numeric quantification rate; no source-type vocabulary (primary / secondary / tertiary is the strategy preference order, not imposed row values); and no claim-kind vocabulary (fact / estimate / opinion names the required separation, checked as attestation plus per-claim labelling, not imposed row values). The one numeric bar is the skill's own: two distinct declared sources for triangulation of an important claim.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `RESEARCH_BRIEF_DECISION_READY` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it performs no research, fetches no source, opens no link and reads no notes. It does not verify that a declared source exists, says what its quote claims, or supports the claim that names it. It never judges whether a source is actually good, independent or correctly typed (only the declared `source_type` string and the preference-order attestation are checked), whether two declared sources are genuinely independent of each other (only that two *distinct declared names* are cited is computed), whether the synthesis is sound or the steelman strong, whether a claim is truly material or important (those flags are the caller's declarations and gate the computed checks), or whether the stated confidence is warranted. Source and report `date` strings are declared provenance only — never parsed and never compared to any clock. The skill's conditional scope rule "No decision → question the research" is not a separate gated check: the record's `decision_named` attestation already covers the decision being named, and the record declares no separate decision-absent flag to gate on.

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this report on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: deep research for product decisions. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared research-brief record for decision-readiness; its verdict is a completeness and consistency judgment, not compliance or audit evidence, and research briefing is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `decision_ready_research_brief` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/decision_ready_research_brief.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_decision_ready_research_brief.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/decision-ready-research-brief` (REST) and `POST /mcp/decision-ready-research-brief` (MCP, tool `decision_ready_research_brief`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `decision_ready_research_brief`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:28:16.846496+00:00 against gateway v1.1.0, external verification lane, source `verification/work/decision-ready-research-brief/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "brief": "Market entry strategy",
  "scope": {
    "decision_named": true,
    "questions_ranked": true,
    "timebox_declared": true,
    "timebox_respected": true,
    "enough_criteria_defined": true
  },
  "questions": [
    {
      "name": "Q1"
    }
  ],
  "source_strategy": {
    "primary_preferred_over_secondary_and_tertiary": true
  },
  "sources": [
    {
      "name": "S1",
      "link": "http://a.com",
      "date": "2023-01-01",
      "quote": "A",
      "source_type": "primary",
      "incentives_noted": true
    },
    {
      "name": "S2",
      "link": "http://b.com",
      "date": "2023-01-01",
      "quote": "B",
      "source_type": "primary",
      "incentives_noted": true
    }
  ],
  "evidence": {
    "notes_question_oriented": true,
    "evidence_table_present": true,
    "fact_estimate_opinion_separated": true,
    "gaps_recorded": true
  },
  "claims": [
    {
      "name": "C1",
      "kind": "fact",
      "material": true,
      "important": true,
      "supporting_source_names": [
        "S1",
        "S2"
      ],
      "confidence_stated": true
    }
  ],
  "synthesis": {
    "structured_by_question": true,
    "opposing_view_steelmanned": true,
    "quantified_where_possible": true,
    "confidence_stated": true,
    "unknowns_stated_explicitly": true
  },
  "report_sections": [
    "bluf",
    "findings",
    "evidence",
    "risks",
    "open_questions",
    "sources"
  ],
  "report": {
    "version": "1.0",
    "date": "2023-01-02",
    "open_questions_listed": true
  },
  "reuse": {
    "notes_archived_for_reuse": true,
    "updates_via_changelog": true,
    "silent_edits_present": false
  },
  "tooling": {
    "automation_does_not_replace_verification": true,
    "ai_summaries_used": false,
    "seo_spam_and_content_farms_screened": true,
    "scraped_or_automated_data_used": false
  },
  "disclosure": {
    "conflicts_present": false,
    "unsourced_claims_present": false,
    "single_source_conclusions_on_important_facts_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "decision-ready-research-brief",
  "atom_version": "0.1.0",
  "brief": "Market entry strategy",
  "verdict": "RESEARCH_BRIEF_DECISION_READY",
  "sections": {
    "scoping_and_sources": "pass",
    "evidence_and_notes": "pass",
    "synthesis_and_report_structure": "pass",
    "reuse_verification_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "scoping_and_sources",
      "check": "decision_named",
      "status": "pass",
      "evidence": "scope first: the decision this research serves is named \u2014 no decision, the research is questioned"
    },
    {
      "section": "scoping_and_sources",
      "check": "questions_ranked",
      "status": "pass",
      "evidence": "scope first: the questions are ranked"
    },
    {
      "section": "scoping_and_sources",
      "check": "questions_declared",
      "status": "pass",
      "evidence": "scope first: the declared brief record names its questions \u2014 the questions list is present and non-empty"
    },
    {
      "section": "scoping_and_sources",
      "check": "timebox_declared",
      "status": "pass",
      "evidence": "scope first: a timebox is declared"
    },
    {
      "section": "scoping_and_sources",
      "check": "timebox_respected",
      "status": "pass",
      "evidence": "quality gate: the timebox is respected"
    },
    {
      "section": "scoping_and_sources",
      "check": "enough_criteria_defined",
      "status": "pass",
      "evidence": "scope first: what \"enough\" looks like is defined"
    },
    {
      "section": "scoping_and_sources",
      "check": "primary_sources_preferred",
      "status": "pass",
      "evidence": "source strategy: primary sources (filings, docs, data) are preferred over secondary, and secondary over tertiary"
    },
    {
      "section": "scoping_and_sources",
      "check": "sources_declared",
      "status": "pass",
      "evidence": "source strategy: the declared brief record names its sources \u2014 the sources list is present and non-empty"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_link",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row names a non-empty link \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_date",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row names a non-empty date \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_quote",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row names a non-empty quote \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_declares_source_type",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row declares its source type \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_incentives_noted",
      "status": "pass",
      "evidence": "source strategy: every declared source row declares its incentives noted"
    },
    {
      "section": "evidence_and_notes",
      "check": "claims_declared",
      "status": "pass",
      "evidence": "notes discipline: the declared brief record names its claims \u2014 the claims list is present and non-empty"
    },
    {
      "section": "evidence_and_notes",
      "check": "notes_question_oriented",
      "status": "pass",
      "evidence": "notes discipline: notes are question-oriented, not dumps"
    },
    {
      "section": "evidence_and_notes",
      "check": "evidence_table_present",
      "status": "pass",
      "evidence": "notes discipline: an evidence table is present \u2014 claim to sources to confidence to gaps"
    },
    {
      "section": "evidence_and_notes",
      "check": "fact_estimate_opinion_separated",
      "status": "pass",
      "evidence": "notes discipline: fact, estimate and opinion are separated"
    },
    {
      "section": "evidence_and_notes",
      "check": "gaps_recorded",
      "status": "pass",
      "evidence": "notes discipline: gaps are recorded in the evidence table"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_material_claim_sourced_from_declared_sources",
      "status": "pass",
      "evidence": "quality gate / red line: every material claim is sourced \u2014 it names at least one supporting source that is actually declared; no unsourced claims"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_important_claim_triangulated_across_declared_sources",
      "status": "pass",
      "evidence": "source strategy / red line: every important claim is triangulated \u2014 it names at least two distinct supporting sources that are actually declared; no single-source conclusions on important facts"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_claim_confidence_stated",
      "status": "pass",
      "evidence": "quality gate: every declared claim row declares its confidence stated"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_claim_kind_declared",
      "status": "pass",
      "evidence": "notes discipline: every declared claim row declares a non-empty kind \u2014 the fact / estimate / opinion separation starts from each claim being labelled"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "synthesis_structured_by_question",
      "status": "pass",
      "evidence": "synthesis: the brief is structured by question"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "opposing_view_steelmanned",
      "status": "pass",
      "evidence": "synthesis / quality gate: opposing views are presented as a steelman"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "quantified_where_possible",
      "status": "pass",
      "evidence": "synthesis: findings are quantified where possible"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "synthesis_confidence_stated",
      "status": "pass",
      "evidence": "synthesis: confidence is stated explicitly"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "unknowns_stated_explicitly",
      "status": "pass",
      "evidence": "synthesis: unknowns are stated explicitly"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_sections_in_skill_order",
      "status": "pass",
      "evidence": "report format: the declared report sections are exactly the skill's format in order \u2014 bluf, findings, evidence, risks, open_questions, sources"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_version_declared",
      "status": "pass",
      "evidence": "report format: the report declares a non-empty version \u2014 version and date go on every report"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_date_declared",
      "status": "pass",
      "evidence": "report format: the report declares a non-empty date \u2014 version and date go on every report"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "open_questions_listed",
      "status": "pass",
      "evidence": "quality gate: open questions are listed"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "notes_archived_for_reuse",
      "status": "pass",
      "evidence": "reuse: notes are stored and archived for future questions"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "updates_via_changelog",
      "status": "pass",
      "evidence": "reuse: reports are updated when facts change via a changelog"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_silent_edits",
      "status": "pass",
      "evidence": "reuse / anti-pattern: no silent edits \u2014 updates are a changelog, not silent edits"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "automation_does_not_replace_verification",
      "status": "pass",
      "evidence": "tooling discipline: automation speeds collection but never replaces verification"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "ai_summaries_cite_sources_when_used",
      "status": "pass",
      "evidence": "no AI summaries declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "ai_summaries_spot_checked_when_used",
      "status": "pass",
      "evidence": "no AI summaries declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "seo_spam_and_content_farms_screened",
      "status": "pass",
      "evidence": "tooling discipline: results are watched for SEO spam and content farms"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "scraped_or_automated_data_quality_checked_when_used",
      "status": "pass",
      "evidence": "no scraped or automated data declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "conflicts_disclosed_when_present",
      "status": "pass",
      "evidence": "no conflicts declared present"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_unsourced_claims",
      "status": "pass",
      "evidence": "red line: no unsourced claims"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_single_source_conclusions_on_important_facts",
      "status": "pass",
      "evidence": "red line: no single-source conclusions on important facts"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "questions_count": 1,
  "sources_count": 2,
  "sources_without_complete_provenance": [],
  "source_provenance_coverage": "1.0000",
  "claims_count": 1,
  "material_claims_without_sources": [],
  "material_claim_source_coverage": "1.0000",
  "important_claims_not_triangulated": [],
  "important_claim_triangulation_coverage": "1.0000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections.",
  "stamp": "DECISION-READY RESEARCH BRIEF\nbrief: Market entry strategy\nVERDICT: RESEARCH_BRIEF_DECISION_READY\n  scoping_and_sources                  pass\n  evidence_and_notes                   pass\n  synthesis_and_report_structure       pass\n  reuse_verification_and_red_lines     pass\n42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "brief": "Bad brief",
  "scope": {
    "decision_named": true,
    "questions_ranked": true,
    "timebox_declared": true,
    "timebox_respected": true,
    "enough_criteria_defined": true
  },
  "questions": [
    {
      "name": "Q1"
    }
  ],
  "source_strategy": {
    "primary_preferred_over_secondary_and_tertiary": true
  },
  "sources": [
    {
      "name": "S1",
      "link": "",
      "date": "2023-01-01",
      "quote": "A",
      "source_type": "primary",
      "incentives_noted": true
    },
    {
      "name": "S2",
      "link": "http://b.com",
      "date": "2023-01-01",
      "quote": "B",
      "source_type": "primary",
      "incentives_noted": true
    }
  ],
  "evidence": {
    "notes_question_oriented": true,
    "evidence_table_present": true,
    "fact_estimate_opinion_separated": true,
    "gaps_recorded": true
  },
  "claims": [
    {
      "name": "C1",
      "kind": "fact",
      "material": true,
      "important": true,
      "supporting_source_names": [
        "S1"
      ],
      "confidence_stated": true
    }
  ],
  "synthesis": {
    "structured_by_question": true,
    "opposing_view_steelmanned": true,
    "quantified_where_possible": true,
    "confidence_stated": true,
    "unknowns_stated_explicitly": true
  },
  "report_sections": [
    "bluf",
    "findings",
    "evidence",
    "risks",
    "open_questions",
    "sources"
  ],
  "report": {
    "version": "1.0",
    "date": "2023-01-02",
    "open_questions_listed": true
  },
  "reuse": {
    "notes_archived_for_reuse": true,
    "updates_via_changelog": true,
    "silent_edits_present": true
  },
  "tooling": {
    "automation_does_not_replace_verification": true,
    "ai_summaries_used": false,
    "seo_spam_and_content_farms_screened": true,
    "scraped_or_automated_data_used": false
  },
  "disclosure": {
    "conflicts_present": false,
    "unsourced_claims_present": false,
    "single_source_conclusions_on_important_facts_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "decision-ready-research-brief",
  "atom_version": "0.1.0",
  "brief": "Bad brief",
  "verdict": "RESEARCH_BRIEF_NOT_DECISION_READY",
  "sections": {
    "scoping_and_sources": "fail",
    "evidence_and_notes": "fail",
    "synthesis_and_report_structure": "pass",
    "reuse_verification_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "scoping_and_sources",
      "check": "decision_named",
      "status": "pass",
      "evidence": "scope first: the decision this research serves is named \u2014 no decision, the research is questioned"
    },
    {
      "section": "scoping_and_sources",
      "check": "questions_ranked",
      "status": "pass",
      "evidence": "scope first: the questions are ranked"
    },
    {
      "section": "scoping_and_sources",
      "check": "questions_declared",
      "status": "pass",
      "evidence": "scope first: the declared brief record names its questions \u2014 the questions list is present and non-empty"
    },
    {
      "section": "scoping_and_sources",
      "check": "timebox_declared",
      "status": "pass",
      "evidence": "scope first: a timebox is declared"
    },
    {
      "section": "scoping_and_sources",
      "check": "timebox_respected",
      "status": "pass",
      "evidence": "quality gate: the timebox is respected"
    },
    {
      "section": "scoping_and_sources",
      "check": "enough_criteria_defined",
      "status": "pass",
      "evidence": "scope first: what \"enough\" looks like is defined"
    },
    {
      "section": "scoping_and_sources",
      "check": "primary_sources_preferred",
      "status": "pass",
      "evidence": "source strategy: primary sources (filings, docs, data) are preferred over secondary, and secondary over tertiary"
    },
    {
      "section": "scoping_and_sources",
      "check": "sources_declared",
      "status": "pass",
      "evidence": "source strategy: the declared brief record names its sources \u2014 the sources list is present and non-empty"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_link",
      "status": "fail",
      "evidence": "source strategy / provenance: every declared source row names a non-empty link \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_date",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row names a non-empty date \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_has_quote",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row names a non-empty quote \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_declares_source_type",
      "status": "pass",
      "evidence": "source strategy / provenance: every declared source row declares its source type \u2014 provenance is tracked as link + date + quote"
    },
    {
      "section": "scoping_and_sources",
      "check": "every_source_incentives_noted",
      "status": "pass",
      "evidence": "source strategy: every declared source row declares its incentives noted"
    },
    {
      "section": "evidence_and_notes",
      "check": "claims_declared",
      "status": "pass",
      "evidence": "notes discipline: the declared brief record names its claims \u2014 the claims list is present and non-empty"
    },
    {
      "section": "evidence_and_notes",
      "check": "notes_question_oriented",
      "status": "pass",
      "evidence": "notes discipline: notes are question-oriented, not dumps"
    },
    {
      "section": "evidence_and_notes",
      "check": "evidence_table_present",
      "status": "pass",
      "evidence": "notes discipline: an evidence table is present \u2014 claim to sources to confidence to gaps"
    },
    {
      "section": "evidence_and_notes",
      "check": "fact_estimate_opinion_separated",
      "status": "pass",
      "evidence": "notes discipline: fact, estimate and opinion are separated"
    },
    {
      "section": "evidence_and_notes",
      "check": "gaps_recorded",
      "status": "pass",
      "evidence": "notes discipline: gaps are recorded in the evidence table"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_material_claim_sourced_from_declared_sources",
      "status": "pass",
      "evidence": "quality gate / red line: every material claim is sourced \u2014 it names at least one supporting source that is actually declared; no unsourced claims"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_important_claim_triangulated_across_declared_sources",
      "status": "fail",
      "evidence": "source strategy / red line: every important claim is triangulated \u2014 it names at least two distinct supporting sources that are actually declared; no single-source conclusions on important facts"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_claim_confidence_stated",
      "status": "pass",
      "evidence": "quality gate: every declared claim row declares its confidence stated"
    },
    {
      "section": "evidence_and_notes",
      "check": "every_claim_kind_declared",
      "status": "pass",
      "evidence": "notes discipline: every declared claim row declares a non-empty kind \u2014 the fact / estimate / opinion separation starts from each claim being labelled"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "synthesis_structured_by_question",
      "status": "pass",
      "evidence": "synthesis: the brief is structured by question"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "opposing_view_steelmanned",
      "status": "pass",
      "evidence": "synthesis / quality gate: opposing views are presented as a steelman"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "quantified_where_possible",
      "status": "pass",
      "evidence": "synthesis: findings are quantified where possible"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "synthesis_confidence_stated",
      "status": "pass",
      "evidence": "synthesis: confidence is stated explicitly"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "unknowns_stated_explicitly",
      "status": "pass",
      "evidence": "synthesis: unknowns are stated explicitly"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_sections_in_skill_order",
      "status": "pass",
      "evidence": "report format: the declared report sections are exactly the skill's format in order \u2014 bluf, findings, evidence, risks, open_questions, sources"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_version_declared",
      "status": "pass",
      "evidence": "report format: the report declares a non-empty version \u2014 version and date go on every report"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "report_date_declared",
      "status": "pass",
      "evidence": "report format: the report declares a non-empty date \u2014 version and date go on every report"
    },
    {
      "section": "synthesis_and_report_structure",
      "check": "open_questions_listed",
      "status": "pass",
      "evidence": "quality gate: open questions are listed"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "notes_archived_for_reuse",
      "status": "pass",
      "evidence": "reuse: notes are stored and archived for future questions"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "updates_via_changelog",
      "status": "pass",
      "evidence": "reuse: reports are updated when facts change via a changelog"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_silent_edits",
      "status": "fail",
      "evidence": "reuse / anti-pattern: no silent edits \u2014 updates are a changelog, not silent edits"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "automation_does_not_replace_verification",
      "status": "pass",
      "evidence": "tooling discipline: automation speeds collection but never replaces verification"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "ai_summaries_cite_sources_when_used",
      "status": "pass",
      "evidence": "no AI summaries declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "ai_summaries_spot_checked_when_used",
      "status": "pass",
      "evidence": "no AI summaries declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "seo_spam_and_content_farms_screened",
      "status": "pass",
      "evidence": "tooling discipline: results are watched for SEO spam and content farms"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "scraped_or_automated_data_quality_checked_when_used",
      "status": "pass",
      "evidence": "no scraped or automated data declared in use"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "conflicts_disclosed_when_present",
      "status": "pass",
      "evidence": "no conflicts declared present"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_unsourced_claims",
      "status": "pass",
      "evidence": "red line: no unsourced claims"
    },
    {
      "section": "reuse_verification_and_red_lines",
      "check": "no_single_source_conclusions_on_important_facts",
      "status": "pass",
      "evidence": "red line: no single-source conclusions on important facts"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "questions_count": 1,
  "sources_count": 2,
  "sources_without_complete_provenance": [
    "S1"
  ],
  "source_provenance_coverage": "0.5000",
  "claims_count": 1,
  "material_claims_without_sources": [],
  "material_claim_source_coverage": "1.0000",
  "important_claims_not_triangulated": [
    "C1"
  ],
  "important_claim_triangulation_coverage": "0.0000",
  "summary": "39 pass, 3 fail, 0 missing of 42 checks across four sections.",
  "stamp": "DECISION-READY RESEARCH BRIEF\nbrief: Bad brief\nVERDICT: RESEARCH_BRIEF_NOT_DECISION_READY\n  scoping_and_sources                  fail\n  evidence_and_notes                   fail\n  synthesis_and_report_structure       pass\n  reuse_verification_and_red_lines     fail\n39 pass, 3 fail, 0 missing of 42 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "brief": "Malformed",
  "scope": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared research-brief record for decision-readiness; its verdict is a completeness and consistency judgment, not compliance or audit evidence, and research briefing is not a regulated domain. |
| Checks named | 42 documented / 42 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/decision-ready-research-brief/evidence.json` |
