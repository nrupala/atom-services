# Technical documentation pack — documentation

**Technical documentation pack** · slug `technical-documentation-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared technical documentation production record for completeness and internal consistency only, and recomputes the counts, duplicate lists, row-name lists and ratios over the declared rows. It surfaces two faces: REST `POST /v1/technical-documentation-pack` and MCP `POST /mcp/technical-documentation-pack`. It writes no documentation, opens no document and verifies no document against the real product — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/technical-documentation-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 22647267ae414ecbb3a5ee342afd73f8). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the product `TestSystem`, version `1.0.0`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "technical-documentation-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the technical documentation production manifest.** You declare a technical documentation production record for one product/system, made from the documentation production as actually carried out — the atom audits the declared record, it does not write or review any document for you (see Explanation). The recorded full-pass manifest declares the product `TestSystem` at version `1.0.0`: all seven README flags `true` (what-it-is in one paragraph, quickstart present and copy-paste ready, usage, operations, troubleshooting, and where-to-change-things present); one document `doc_001` (kind `readme`, source location `src/README.md`, source of truth `repo_root`); both source-of-truth flags `true` (docs live with the source they describe; no wiki-only oracle docs); one config option `opt_001` (default `true`, `documented` `true`); the API-docs generated-from-or-verified-against-contracts flag `true`; one endpoint `ep_001` (documented in `doc_001`, working example `true`, example verified against contract `true`); the ADR cross-link-where-surprising flag `true`; one decision record `adr_001` (documented in `doc_001`, cross-linked from code `true`); the review/verification flags `true` (docs reviewed like code, updated in the same change as behaviour changes, quickstart run from a clean environment and working verbatim from a clean state, worked examples tested) with `screenshots_or_commands_present` declared `false` — so the verified-current field is absent from the manifest and its check passes as not applicable; all four plain-language flags `true`; all three changelog flags `true`; `versioning.doc_set_version` `1.0.0` with versioned-with-product `true`; and both red-line flags `false` (no private, contact or financial data published in docs; no silent TODO-to-document item).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/technical-documentation-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `TECHNICAL_DOCUMENTATION_SOUND`: "46 pass, 0 fail, 0 missing of 46 checks across eight sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `documentation_set_docs_count`, `documentation_config_options_count`, `documentation_endpoints_count` and `documentation_decision_records_count` are each 1, all fourteen duplicate / row-name lists are empty (`[]`), and `doc_source_of_truth_ratio`, `config_option_documentation_ratio`, `endpoint_worked_example_ratio` and `decision_record_cross_link_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `TECHNICAL_DOCUMENTATION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "technical-documentation-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/technical-documentation-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/technical-documentation-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `technical_documentation_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `TECHNICAL_DOCUMENTATION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_technical_documentation_doc_kind_recognised`, `every_technical_documentation_config_option_documented` and `technical_documentation_doc_set_version_matches_product_version`, and the summary reads "43 pass, 3 fail, 0 missing of 46 checks across eight sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `documents[0].doc_kind` is declared `invalid_kind`, failing `every_technical_documentation_doc_kind_recognised`, with `technical_documentation_docs_with_invalid_kind` naming `["doc_001"]`; `config_options[0].documented` is declared `false`, failing `every_technical_documentation_config_option_documented`, with `technical_documentation_config_options_not_documented` naming `["opt_001"]` and `config_option_documentation_ratio` `"0.000000"`; and `versioning.doc_set_version` is declared `9.9.9` against `product_version` `1.0.0`, failing `technical_documentation_doc_set_version_matches_product_version`; sections `readme_and_doc_set_structure`, `docs_as_code_and_source_of_truth` and `changelog_and_versioning` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual record: correct the kind to a recognised value, declare the option documented if it is, and make the two version strings agree if they do. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "documents",
  "detail": "documents must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/technical-documentation-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/technical-documentation-pack` — tool name `technical_documentation_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `technical_documentation_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `product_name`, `product_version`, `versioning.doc_set_version`, the row id fields, `documents[].doc_kind`, `documents[].documented_in_doc_id`-style cross-reference fields are noted as strings (the source-location, source-of-truth and default-value fields as non-empty strings), and `documents`, `config_options`, `endpoints` and `decision_records` as lists there. Where SERVICE.md states no type — the section container objects (`readme`, `source_of_truth`, `api_docs`, `decision_work`, `review_verification`, `plain_language`, `changelog`, `versioning`, `red_lines`) and the row objects (`documents[]`, `config_options[]`, `endpoints[]`, `decision_records[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object`); that grounding is said so in the Notes column. The recorded MCP `inputSchema` types the four list properties `object` rather than `array` — SERVICE.md's table and the recorded inputs govern (see Discrepancies). A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `TECHNICAL_DOCUMENTATION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the split rows named where they occur: the `documents` list is grouped under `readme_and_doc_set_structure` while its rows' `source_of_truth` leaf is read by `docs_as_code_and_source_of_truth`, and the top-level `product_version` is grouped under `changelog_and_versioning`, exactly as SERVICE.md's table groups it.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `product_name` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: readme_and_doc_set_structure

| Field | Type | Notes |
|---|---|---|
| `readme` | object | The README section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `readme.what_it_is_one_paragraph_declared` | boolean | — |
| `readme.quickstart_present` | boolean | — |
| `readme.quickstart_copy_paste_ready` | boolean | — |
| `readme.usage_present` | boolean | — |
| `readme.operations_present` | boolean | — |
| `readme.troubleshooting_present` | boolean | — |
| `readme.where_to_change_things_present` | boolean | — |
| `documents` | list | List of documentation-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by `docs_as_code_and_source_of_truth` (the rows' `source_of_truth` leaf). Note: the recorded MCP `inputSchema` types this property `object`, not `array` — see Discrepancies |
| `documents[]` | object | One declared documentation row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `documents[].doc_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `documents[].doc_kind` | string | Computed — one of `readme`, `runbook`, `api_doc`, `decision_record`, `changelog`, `reference`, `how_to`, `conceptual` (type stated in SERVICE.md) |
| `documents[].source_location` | non-empty string | Computed — must be non-empty per row (type stated in SERVICE.md) |

#### Read by: docs_as_code_and_source_of_truth

| Field | Type | Notes |
|---|---|---|
| `documents[].source_of_truth` | non-empty string | Computed — must be non-empty per row; the `documents` list itself is listed under `readme_and_doc_set_structure` above (type stated in SERVICE.md) |
| `source_of_truth` | object | The source-of-truth section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `source_of_truth.docs_live_with_source_they_describe` | boolean | — |
| `source_of_truth.no_wiki_only_oracle_docs` | boolean | — |
| `config_options` | list | List of config-option-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this property `object`, not `array` — see Discrepancies |
| `config_options[]` | object | One declared config-option row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `config_options[].option_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `config_options[].default_value` | non-empty string | Computed — must be non-empty per row (type stated in SERVICE.md) |
| `config_options[].documented` | boolean | Computed — must be `true` per row |

#### Read by: api_docs_and_worked_examples

| Field | Type | Notes |
|---|---|---|
| `api_docs` | object | The API-docs section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `api_docs.generated_from_or_verified_against_contracts` | boolean | — |
| `endpoints` | list | List of endpoint-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this property `object`, not `array` — see Discrepancies |
| `endpoints[]` | object | One declared endpoint row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `endpoints[].endpoint_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `endpoints[].documented_in_doc_id` | string | Computed — must name a declared document (type stated in SERVICE.md) |
| `endpoints[].has_working_example` | boolean | Computed — must be `true` per row |
| `endpoints[].example_verified_against_contract` | boolean | Computed — must be `true` per row |

#### Read by: decision_records_and_cross_links

| Field | Type | Notes |
|---|---|---|
| `decision_work` | object | The decision-work section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `decision_work.adrs_cross_linked_from_code_where_surprising` | boolean | — |
| `decision_records` | list | List of decision-record-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this property `object`, not `array` — see Discrepancies |
| `decision_records[]` | object | One declared decision-record row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `decision_records[].adr_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `decision_records[].documented_in_doc_id` | string | Computed — must name a declared document (type stated in SERVICE.md) |
| `decision_records[].cross_linked_from_code` | boolean | Computed — must be `true` per row |

#### Read by: review_verification_and_testing

| Field | Type | Notes |
|---|---|---|
| `review_verification` | object | The review/verification section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `review_verification.docs_reviewed_like_code` | boolean | — |
| `review_verification.docs_updated_in_same_change_as_behavior_changes` | boolean | — |
| `review_verification.quickstart_run_from_clean_environment` | boolean | — |
| `review_verification.quickstart_works_verbatim_from_clean_state` | boolean | — |
| `review_verification.worked_examples_tested` | boolean | — |
| `review_verification.screenshots_or_commands_present` | boolean | Gates the currentness check below |
| `review_verification.screenshots_and_commands_verified_current` | boolean | Required when `review_verification.screenshots_or_commands_present` is declared `true`; otherwise the check passes as not applicable. Absent from the recorded full-pass manifest, whose gate is declared `false` |

#### Read by: plain_language_and_examples

| Field | Type | Notes |
|---|---|---|
| `plain_language` | object | The plain-language section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `plain_language.short_sentences_used` | boolean | — |
| `plain_language.jargon_defined_on_first_use` | boolean | — |
| `plain_language.steps_presented_as_lists` | boolean | — |
| `plain_language.examples_preferred_over_adjectives` | boolean | — |

#### Read by: changelog_and_versioning

| Field | Type | Notes |
|---|---|---|
| `product_version` | string | Computed — must equal `versioning.doc_set_version` exactly; a top-level field grouped by SERVICE.md under this section, not with the carried `product_name` (type stated in SERVICE.md) |
| `changelog` | object | The changelog section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `changelog.kept_continuously` | boolean | — |
| `changelog.not_retrofitted_at_release_time` | boolean | — |
| `changelog.entry_for_current_version_present` | boolean | — |
| `versioning` | object | The versioning section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `versioning.doc_set_version` | string | Computed — must equal `product_version` exactly (type stated in SERVICE.md) |
| `versioning.doc_set_versioned_with_product` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.private_contact_or_financial_data_published_in_docs_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.silent_todo_document_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on gated checks: the evidence text of a gated check is case-dependent — the full-pass run's text is quoted here; when the gate state differs (screenshots/commands declared present, or an absent gate), the recorded response carries the corresponding required-form text instead.

#### Section: readme_and_doc_set_structure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_readme_states_what_it_is_in_one_paragraph` | README skeleton: the README states what the documented thing is in one paragraph | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_quickstart_present` | README skeleton: the README carries a quickstart | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_quickstart_copy_paste_ready` | README skeleton: the quickstart is copy-paste ready | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_usage_present` | README skeleton: the README carries a usage section | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_operations_present` | README skeleton: the README carries an operations section (env vars, ports, defaults) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_troubleshooting_present` | README skeleton: the README carries a troubleshooting section | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_readme_where_to_change_things_present` | README skeleton: the README states where to change things | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_doc_set_list_declared` | doc set: the declared record names its documentation rows — the list is present and names at least one document; an absent list is missing evidence and an empty list declares no documentation set at all | Computed over the declared record. Pass: the `documents` list is present and names at least one document. Fail: the list is present but empty — it declares no documentation set at all. Missing: the list is absent. |
| `every_technical_documentation_doc_id_unique` | doc set: no declared doc_id is owned by more than one row | Computed over the declared record. Pass: no declared `doc_id` appears on more than one row. Fail: a `doc_id` is declared on more than one row (duplicates are named in `duplicate_technical_documentation_doc_ids`). Missing: the list is absent, or a row has `doc_id` absent. |
| `every_technical_documentation_doc_kind_recognised` | doc set: every declared document's kind is one of readme, runbook, api_doc, decision_record, changelog, reference, how_to, conceptual — the skill's named artifacts plus the reference / how-to / conceptual groupings for guide and reference material | Computed over the declared record. Pass: every declared document's `doc_kind` is one of `readme`, `runbook`, `api_doc`, `decision_record`, `changelog`, `reference`, `how_to`, `conceptual`. Fail: a row declares any other value (offending rows are named in `technical_documentation_docs_with_invalid_kind`). Missing: the list is absent, or a row has `doc_kind` absent. |
| `every_technical_documentation_doc_source_location_declared` | docs-as-code: every declared document declares a non-empty source location — where it lives with the source it describes | Computed over the declared record. Pass: every declared document declares a non-empty `source_location`. Fail: a row declares an empty location (offending rows are named in `technical_documentation_docs_without_source_location`). Missing: the list is absent, or a row has `source_location` absent. |

#### Section: docs_as_code_and_source_of_truth

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_docs_live_with_source_they_describe` | docs-as-code: the docs live with the source they describe | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_no_wiki_only_oracle_docs` | docs-as-code: no wiki-only oracle documents — no document exists only outside the source it describes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_technical_documentation_doc_source_of_truth_declared` | source of truth: every declared document declares a non-empty source of truth — the contract, source or record it is generated from or verified against | Computed over the declared record. Pass: every declared document declares a non-empty `source_of_truth`. Fail: a row declares an empty source of truth (offending rows are named in `technical_documentation_docs_without_source_of_truth`). Missing: the list is absent, or a row has `source_of_truth` absent. |
| `technical_documentation_config_options_list_declared` | config options: the declared record names its config-option rows — the list is present and names at least one option; an absent list is missing evidence and an empty list declares no documented config at all | Computed over the declared record. Pass: the `config_options` list is present and names at least one option. Fail: the list is present but empty. Missing: the list is absent. |
| `every_technical_documentation_config_option_id_unique` | config options: no declared option_id is owned by more than one row | Computed over the declared record. Pass: no declared `option_id` appears on more than one row. Fail: an `option_id` is declared on more than one row (duplicates are named in `duplicate_technical_documentation_config_option_ids`). Missing: the list is absent, or a row has `option_id` absent. |
| `every_technical_documentation_config_option_default_declared` | config options / quality gate: every declared config option declares a non-empty default value | Computed over the declared record. Pass: every declared config option declares a non-empty `default_value`. Fail: a row declares an empty default (offending rows are named in `technical_documentation_config_options_without_default`). Missing: the list is absent, or a row has `default_value` absent. |
| `every_technical_documentation_config_option_documented` | config options / quality gate: every declared config option is declared documented with its default | Computed over the declared record. Pass: every declared config option row declares `documented` `true`. Fail: a row declares it `false` (offending rows are named in `technical_documentation_config_options_not_documented`). Missing: the list is absent, or a row has `documented` absent. |

#### Section: api_docs_and_worked_examples

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_api_docs_generated_from_or_verified_against_contracts` | API docs: the API docs are generated from, or verified against, the contracts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_endpoints_list_declared` | endpoints: the declared record names its endpoint rows — the list is present and names at least one endpoint; an absent list is missing evidence and an empty list declares no documented endpoints at all | Computed over the declared record. Pass: the `endpoints` list is present and names at least one endpoint. Fail: the list is present but empty. Missing: the list is absent. |
| `every_technical_documentation_endpoint_id_unique` | endpoints: no declared endpoint_id is owned by more than one row | Computed over the declared record. Pass: no declared `endpoint_id` appears on more than one row. Fail: an `endpoint_id` is declared on more than one row (duplicates are named in `duplicate_technical_documentation_endpoint_ids`). Missing: the list is absent, or a row has `endpoint_id` absent. |
| `every_technical_documentation_endpoint_working_example_declared` | API docs: every declared endpoint declares one working example | Computed over the declared record. Pass: every declared endpoint row declares `has_working_example` `true`. Fail: a row declares it `false` (offending rows are named in `technical_documentation_endpoints_without_working_example`). Missing: the list is absent, or a row has the field absent. |
| `every_technical_documentation_endpoint_example_verified_against_contract` | API docs: every declared endpoint's working example is declared verified against the contract | Computed over the declared record. Pass: every declared endpoint row declares `example_verified_against_contract` `true`. Fail: a row declares it `false` (offending rows are named in `technical_documentation_endpoints_with_unverified_example`). Missing: the list is absent, or a row has the field absent. |
| `every_technical_documentation_endpoint_documented_in_declared_doc` | endpoints: every declared endpoint's documented_in_doc_id names one of the declared documentation rows | Computed over the declared record. Pass: every declared endpoint's `documented_in_doc_id` names one of the declared documents. Fail: an endpoint names an undeclared document (offending rows are named in `technical_documentation_endpoints_with_unknown_doc_reference`). Missing: the list is absent, a row has `documented_in_doc_id` absent, or the `documents` list is absent. |

#### Section: decision_records_and_cross_links

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_adrs_cross_linked_from_code_where_surprising` | decision records: ADRs are cross-linked from code where behaviour is surprising | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_decision_records_list_declared` | decision records: the declared record names its decision-record rows — the list is present and names at least one record; an absent list is missing evidence and an empty list declares no decision records at all | Computed over the declared record. Pass: the `decision_records` list is present and names at least one record. Fail: the list is present but empty. Missing: the list is absent. |
| `every_technical_documentation_decision_record_id_unique` | decision records: no declared adr_id is owned by more than one row | Computed over the declared record. Pass: no declared `adr_id` appears on more than one row. Fail: an `adr_id` is declared on more than one row (duplicates are named in `duplicate_technical_documentation_decision_record_ids`). Missing: the list is absent, or a row has `adr_id` absent. |
| `every_technical_documentation_decision_record_cross_linked_from_code` | decision records: every declared decision record is declared cross-linked from the code it explains | Computed over the declared record. Pass: every declared decision-record row declares `cross_linked_from_code` `true`. Fail: a row declares it `false` (offending rows are named in `technical_documentation_decision_records_not_cross_linked`). Missing: the list is absent, or a row has the field absent. |
| `every_technical_documentation_decision_record_documented_in_declared_doc` | decision records: every declared decision record's documented_in_doc_id names one of the declared documentation rows | Computed over the declared record. Pass: every declared decision record's `documented_in_doc_id` names one of the declared documents. Fail: a record names an undeclared document (offending rows are named in `technical_documentation_decision_records_with_unknown_doc_reference`). Missing: the list is absent, a row has `documented_in_doc_id` absent, or the `documents` list is absent. |

#### Section: review_verification_and_testing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_docs_reviewed_like_code` | docs-as-code / review: the docs are reviewed like code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_docs_updated_in_same_change_as_behavior` | quality gate: docs are updated in the same change as behaviour changes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_quickstart_run_from_clean_environment` | test the docs: the quickstart was run from a clean environment | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_quickstart_works_verbatim_from_clean_state` | quality gate: the quickstart works verbatim from a clean state | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_worked_examples_tested` | test the docs: the worked examples in the documentation were tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_screenshots_and_commands_current_where_present` | no screenshots or commands declared present | Computed-gated over the declared record. Pass: `review_verification.screenshots_or_commands_present` is declared `false` (the check passes as not applicable), or it is declared `true` and `review_verification.screenshots_and_commands_verified_current` is declared `true`. Fail: the gate is declared `true` and the verified-current field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the verified-current field is absent. |

#### Section: plain_language_and_examples

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_plain_language_short_sentences_used` | plain language: the documentation uses short sentences | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_jargon_defined_on_first_use` | plain language: jargon is defined on first use | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_steps_presented_as_lists` | plain language: steps are presented as lists | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_examples_preferred_over_adjectives` | plain language: examples are preferred over adjectives | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: changelog_and_versioning

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_changelog_kept_continuously` | changelog: the changelog is kept continuously | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_changelog_not_retrofitted_at_release_time` | changelog: the changelog is never retro-fitted at release time | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_changelog_entry_for_current_version_present` | changelog: a changelog entry for the current version is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_doc_set_versioned_with_product` | versioning: the documentation set is versioned with the product it documents | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `technical_documentation_doc_set_version_matches_product_version` | versioning: the declared doc-set version equals the declared product version exactly | Computed over the declared record. Pass: `versioning.doc_set_version` equals `product_version` exactly. Fail: the two declared versions differ. Missing: either field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `technical_documentation_free_of_private_contact_or_financial_data_in_docs` | red line: no private, contact or financial data published in the docs is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `technical_documentation_free_of_silent_todo_document` | red line: no silent TODO-to-document is present in the record — every such item is tracked or finished | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"technical-documentation-pack"`), `atom_version` (`"0.1.0"`), and `product_name` (the manifest's declared product name value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `documentation_set_docs_count`, `documentation_config_options_count`, `documentation_endpoints_count` and `documentation_decision_records_count` (the declared list lengths as integers, exactly, or null when the corresponding list is not declared); `duplicate_technical_documentation_doc_ids`, `duplicate_technical_documentation_config_option_ids`, `duplicate_technical_documentation_endpoint_ids` and `duplicate_technical_documentation_decision_record_ids` (ids carried by more than one row; each null when its list is not declared, as recorded in the sparse case — SERVICE.md states no null rule for these lists, see Discrepancies); the row-name lists `technical_documentation_docs_with_invalid_kind`, `technical_documentation_docs_without_source_location`, `technical_documentation_docs_without_source_of_truth`, `technical_documentation_config_options_without_default`, `technical_documentation_config_options_not_documented`, `technical_documentation_endpoints_without_working_example`, `technical_documentation_endpoints_with_unverified_example`, `technical_documentation_endpoints_with_unknown_doc_reference`, `technical_documentation_decision_records_not_cross_linked` and `technical_documentation_decision_records_with_unknown_doc_reference` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); and the ratios `doc_source_of_truth_ratio` (documents with a declared source of truth ÷ declared documents), `config_option_documentation_ratio` (config options both declaring a default and declared documented ÷ declared options), `endpoint_worked_example_ratio` (endpoints both carrying a working example and declaring it verified against the contract ÷ declared endpoints) and `decision_record_cross_link_ratio` (decision records declared cross-linked from code ÷ declared records) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Computed ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across eight sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared product name value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `TECHNICAL_DOCUMENTATION_SOUND` — all 46 checks pass: the declared technical documentation production record is complete and consistent with the bound skill's method, quality gates and red lines.
- `TECHNICAL_DOCUMENTATION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the nineteen primary computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the nineteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `documentation_set_docs_count`, `documentation_config_options_count`, `documentation_endpoints_count`, `documentation_decision_records_count`, the four duplicate-id lists, the ten row-name lists, `doc_source_of_truth_ratio`, `config_option_documentation_ratio`, `endpoint_worked_example_ratio`, `decision_record_cross_link_ratio` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"documents","detail":"documents must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write documentation that gets used — READMEs, runbooks, API docs, decision records, changelogs, kept close to source (the bound capability, from the skill). You submit one declared record — the technical documentation production manifest, made from the documentation production as actually carried out — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 8 sections (`readme_and_doc_set_structure`, `docs_as_code_and_source_of_truth`, `api_docs_and_worked_examples`, `decision_records_and_cross_links`, `review_verification_and_testing`, `plain_language_and_examples`, `changelog_and_versioning`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `long-form-authoring-pipeline`, `document-operations-service` and `technical-explainer-content-pack` (SERVICE.md, Distinct ground): every check here is a product/system documentation question — a README skeleton, a doc set living with its source, config options documented with defaults, endpoints with contract-verified worked examples pointing at declared documents, decision records cross-linked from code and pointing at declared documents, docs reviewed and tested like the product, plain language, a continuously kept changelog, and a doc-set version matching the product version. In particular against the explainer pack: its reader learns a topic; this atom's reader operates, uses or develops the documented thing itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* (26) read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (nineteen, per SERVICE.md) are calculated from the declared rows and declared versions themselves — the four declared lists must each be present and name at least one row, every row id must be unique, every document kind must be recognised with a non-empty source location and source of truth per row, every config option must declare a non-empty default and be declared documented, every endpoint must carry a working example declared verified against the contract and name a declared document, every decision record must be declared cross-linked from code and name a declared document, and the declared doc-set version must equal the declared product version exactly — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *One gated check* follows the skill's own conditional scope: screenshots-and-commands currentness is required only where `review_verification.screenshots_or_commands_present` is declared `true`; with the gate declared `false` it passes as not applicable, and with the gate absent it is `missing`. Aggregation is strict: any `fail` anywhere produces `TECHNICAL_DOCUMENTATION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `TECHNICAL_DOCUMENTATION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are a complete README skeleton, docs-as-code with a named source of truth, contract-verified API docs with a working example per endpoint, cross-linked decision records, docs reviewed and tested like the product, plain language, and a continuously kept changelog, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a minimum or maximum number of documents, config options, endpoints or decision records beyond at least one each; a reading-level, sentence-length or jargon-density bar for plain language (checked as declarations only); a documentation-coverage percentage for config options, endpoints or features beyond exact completeness over the declared rows; an example correctness bar beyond declared verification against the contract (the atom receives no contract and no example text and verifies nothing against the world); a freshness interval in days for screenshots, commands or any document; a changelog-entry format or length bar; a versioning-scheme bar beyond exact equality of the two declared version strings; any judgment that the documentation is good, clear or useful (only that its declared production record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact completeness and cross-reference consistency over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** technical documentation production record: a verdict of `TECHNICAL_DOCUMENTATION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its quickstart tested, its examples verified and its versions matching passes those checks even if the real documentation work did none of it. It is a completeness and consistency audit of the documentation record the skill requires, **not a documentation service, a doc review, or a guarantee that the documentation is accurate or good**: it never judges whether a declared source of truth actually supports the document that cites it, whether a quickstart actually works, whether the writing is clear, or whether the docs should be published — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: writing or rewriting any document itself; generating API docs from a contract itself; running the quickstart or any worked example itself; reviewing document prose itself; and maintaining the changelog itself — each is EXCLUDED by name from this atom, which audits only the declared record of those steps. Boundary cases, named: a product/system with genuinely no config options, no API endpoints, or no decision records cannot pass this record format's corresponding list-declared check (the format requires at least one row in each declared list — such a system is outside this atom's computed reach, not failed on its merits).

**Buyer and use context.** Teams and agents working in Writing & documents who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: READMEs and runbooks for products (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

*Regulators: N/A — this atom audits a declared technical documentation production record; SERVICE.md's U-13 screen is (a) No outright, stating that its output could not read as regulated professional advice — it is a declared-record audit against its bound skill, offering no engineering-practice, financial, securities or psychology-adjacent advice: the bound skill and the record name documentation, READMEs, runbooks, API docs, decision records and changelogs only, the atom produces no documentation and no advice of any kind, sets no threshold on any subject matter, takes no position on the documented system's subject, and its red-line check on private, contact or financial data judges the caller's declared record only, never the content of any real document. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `technical_documentation_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/technical_documentation_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_technical_documentation_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/technical-documentation-pack` (REST) and `POST /mcp/technical-documentation-pack` (MCP, tool `technical_documentation_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22). Key scope: `technical_documentation_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — they carry `technical_documentation_` / `every_technical_documentation_` prefixes and are descriptive forms rather than field names. The closest cases still reword the leaf (for example `technical_documentation_readme_states_what_it_is_in_one_paragraph` reads `readme.what_it_is_one_paragraph_declared`; `technical_documentation_docs_updated_in_same_change_as_behavior` reads `review_verification.docs_updated_in_same_change_as_behavior_changes` — the check name truncates the field's trailing `_changes`). The nineteen computed checks and the gated check have no single same-named field at all: for example `technical_documentation_doc_set_list_declared` (the `documents` list), `every_technical_documentation_endpoint_documented_in_declared_doc` (the endpoints' `documented_in_doc_id` values against the declared documents), `technical_documentation_doc_set_version_matches_product_version` (fields `versioning.doc_set_version` + `product_version`), `technical_documentation_screenshots_and_commands_current_where_present` (fields `review_verification.screenshots_or_commands_present` + `review_verification.screenshots_and_commands_verified_current`), and the two red-line checks (`technical_documentation_free_of_private_contact_or_financial_data_in_docs` and its sibling read the `red_lines.*_present` fields). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md, and the recorded MCP `inputSchema` types the lists as objects:** SERVICE.md states no type for the section container objects (`readme`, `source_of_truth`, `api_docs`, `decision_work`, `review_verification`, `plain_language`, `changelog`, `versioning`, `red_lines`) or for a row object (`documents[]`, `config_options[]`, `endpoints[]`, `decision_records[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the fifteen top-level properties and types the four list properties (`documents`, `config_options`, `endpoints`, `decision_records`) as `object`, not `array` — the nested row and leaf types, and the lists' list type, rest on SERVICE.md's table and the recorded evidence inputs, not on the schema.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the four counts and the four ratios, but it does not state a null rule for the four duplicate-id lists or the ten row-name lists. The recorded sparse response returns all of those as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging and splitting input objects:** the recorded sections do not map one-to-one onto input objects. The single `documents` list is split across two recorded sections — `readme_and_doc_set_structure` reads the rows' `doc_id`, `doc_kind` and `source_location`, while `docs_as_code_and_source_of_truth` reads the same rows' `source_of_truth` leaf alongside the `source_of_truth` object and the `config_options` rows. `changelog_and_versioning` merges three sources — the top-level `product_version`, the `changelog` object and the `versioning` object — so `product_version` is grouped by SERVICE.md under that section rather than with the carried `product_name`. This document groups the Input reference and the Checks by the recorded section names, with those mergings and splittings named in place.
7. **Gated-check evidence text is case-dependent:** the evidence text quoted in the Checks section is the full-pass run's text. For the gated check the recorded text changes with the gate state — in the full-pass run `technical_documentation_screenshots_and_commands_current_where_present` carries the not-applicable text “no screenshots or commands declared present” (the gate is declared `false`, and the manifest carries no `screenshots_and_commands_verified_current` field at all). No single evidence string per gated check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (6 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named prose labels `Document kind recognised`, `Every config option documented` and `Doc-set version matches product version` instead of exact check names (R1 ×3); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T14:10:37.425155+00:00 against gateway v1.1.0, external verification battery Wave 16, source `verification/work/technical-documentation-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T14:10:37.425155+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/technical-documentation-pack/evidence.json`.

Input:

```json
{
  "product_name": "TestSystem",
  "product_version": "1.0.0",
  "readme": {
    "what_it_is_one_paragraph_declared": true,
    "quickstart_present": true,
    "quickstart_copy_paste_ready": true,
    "usage_present": true,
    "operations_present": true,
    "troubleshooting_present": true,
    "where_to_change_things_present": true
  },
  "documents": [
    {
      "doc_id": "doc_001",
      "doc_kind": "readme",
      "source_location": "src/README.md",
      "source_of_truth": "repo_root"
    }
  ],
  "source_of_truth": {
    "docs_live_with_source_they_describe": true,
    "no_wiki_only_oracle_docs": true
  },
  "config_options": [
    {
      "option_id": "opt_001",
      "default_value": "true",
      "documented": true
    }
  ],
  "api_docs": {
    "generated_from_or_verified_against_contracts": true
  },
  "endpoints": [
    {
      "endpoint_id": "ep_001",
      "documented_in_doc_id": "doc_001",
      "has_working_example": true,
      "example_verified_against_contract": true
    }
  ],
  "decision_work": {
    "adrs_cross_linked_from_code_where_surprising": true
  },
  "decision_records": [
    {
      "adr_id": "adr_001",
      "documented_in_doc_id": "doc_001",
      "cross_linked_from_code": true
    }
  ],
  "review_verification": {
    "docs_reviewed_like_code": true,
    "docs_updated_in_same_change_as_behavior_changes": true,
    "quickstart_run_from_clean_environment": true,
    "quickstart_works_verbatim_from_clean_state": true,
    "worked_examples_tested": true,
    "screenshots_or_commands_present": false
  },
  "plain_language": {
    "short_sentences_used": true,
    "jargon_defined_on_first_use": true,
    "steps_presented_as_lists": true,
    "examples_preferred_over_adjectives": true
  },
  "changelog": {
    "kept_continuously": true,
    "not_retrofitted_at_release_time": true,
    "entry_for_current_version_present": true
  },
  "versioning": {
    "doc_set_version": "1.0.0",
    "doc_set_versioned_with_product": true
  },
  "red_lines": {
    "private_contact_or_financial_data_published_in_docs_present": false,
    "silent_todo_document_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "technical-documentation-pack",
  "atom_version": "0.1.0",
  "product_name": "TestSystem",
  "verdict": "TECHNICAL_DOCUMENTATION_SOUND",
  "sections": {
    "readme_and_doc_set_structure": "pass",
    "docs_as_code_and_source_of_truth": "pass",
    "api_docs_and_worked_examples": "pass",
    "decision_records_and_cross_links": "pass",
    "review_verification_and_testing": "pass",
    "plain_language_and_examples": "pass",
    "changelog_and_versioning": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_states_what_it_is_in_one_paragraph",
      "status": "pass",
      "evidence": "README skeleton: the README states what the documented thing is in one paragraph"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_quickstart_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a quickstart"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_quickstart_copy_paste_ready",
      "status": "pass",
      "evidence": "README skeleton: the quickstart is copy-paste ready"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_usage_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a usage section"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_operations_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries an operations section (env vars, ports, defaults)"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_troubleshooting_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a troubleshooting section"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_where_to_change_things_present",
      "status": "pass",
      "evidence": "README skeleton: the README states where to change things"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_doc_set_list_declared",
      "status": "pass",
      "evidence": "doc set: the declared record names its documentation rows \u2014 the list is present and names at least one document; an absent list is missing evidence and an empty list declares no documentation set at all"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_id_unique",
      "status": "pass",
      "evidence": "doc set: no declared doc_id is owned by more than one row"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_kind_recognised",
      "status": "pass",
      "evidence": "doc set: every declared document's kind is one of readme, runbook, api_doc, decision_record, changelog, reference, how_to, conceptual \u2014 the skill's named artifacts plus the reference / how-to / conceptual groupings for guide and reference material"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_source_location_declared",
      "status": "pass",
      "evidence": "docs-as-code: every declared document declares a non-empty source location \u2014 where it lives with the source it describes"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_docs_live_with_source_they_describe",
      "status": "pass",
      "evidence": "docs-as-code: the docs live with the source they describe"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_no_wiki_only_oracle_docs",
      "status": "pass",
      "evidence": "docs-as-code: no wiki-only oracle documents \u2014 no document exists only outside the source it describes"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_doc_source_of_truth_declared",
      "status": "pass",
      "evidence": "source of truth: every declared document declares a non-empty source of truth \u2014 the contract, source or record it is generated from or verified against"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_config_options_list_declared",
      "status": "pass",
      "evidence": "config options: the declared record names its config-option rows \u2014 the list is present and names at least one option; an absent list is missing evidence and an empty list declares no documented config at all"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_id_unique",
      "status": "pass",
      "evidence": "config options: no declared option_id is owned by more than one row"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_default_declared",
      "status": "pass",
      "evidence": "config options / quality gate: every declared config option declares a non-empty default value"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_documented",
      "status": "pass",
      "evidence": "config options / quality gate: every declared config option is declared documented with its default"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "technical_documentation_api_docs_generated_from_or_verified_against_contracts",
      "status": "pass",
      "evidence": "API docs: the API docs are generated from, or verified against, the contracts"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "technical_documentation_endpoints_list_declared",
      "status": "pass",
      "evidence": "endpoints: the declared record names its endpoint rows \u2014 the list is present and names at least one endpoint; an absent list is missing evidence and an empty list declares no documented endpoints at all"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_id_unique",
      "status": "pass",
      "evidence": "endpoints: no declared endpoint_id is owned by more than one row"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_working_example_declared",
      "status": "pass",
      "evidence": "API docs: every declared endpoint declares one working example"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_example_verified_against_contract",
      "status": "pass",
      "evidence": "API docs: every declared endpoint's working example is declared verified against the contract"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_documented_in_declared_doc",
      "status": "pass",
      "evidence": "endpoints: every declared endpoint's documented_in_doc_id names one of the declared documentation rows"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "technical_documentation_adrs_cross_linked_from_code_where_surprising",
      "status": "pass",
      "evidence": "decision records: ADRs are cross-linked from code where behaviour is surprising"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "technical_documentation_decision_records_list_declared",
      "status": "pass",
      "evidence": "decision records: the declared record names its decision-record rows \u2014 the list is present and names at least one record; an absent list is missing evidence and an empty list declares no decision records at all"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_id_unique",
      "status": "pass",
      "evidence": "decision records: no declared adr_id is owned by more than one row"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_cross_linked_from_code",
      "status": "pass",
      "evidence": "decision records: every declared decision record is declared cross-linked from the code it explains"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_documented_in_declared_doc",
      "status": "pass",
      "evidence": "decision records: every declared decision record's documented_in_doc_id names one of the declared documentation rows"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_docs_reviewed_like_code",
      "status": "pass",
      "evidence": "docs-as-code / review: the docs are reviewed like code"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_docs_updated_in_same_change_as_behavior",
      "status": "pass",
      "evidence": "quality gate: docs are updated in the same change as behaviour changes"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_quickstart_run_from_clean_environment",
      "status": "pass",
      "evidence": "test the docs: the quickstart was run from a clean environment"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_quickstart_works_verbatim_from_clean_state",
      "status": "pass",
      "evidence": "quality gate: the quickstart works verbatim from a clean state"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_worked_examples_tested",
      "status": "pass",
      "evidence": "test the docs: the worked examples in the documentation were tested"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_screenshots_and_commands_current_where_present",
      "status": "pass",
      "evidence": "no screenshots or commands declared present"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_plain_language_short_sentences_used",
      "status": "pass",
      "evidence": "plain language: the documentation uses short sentences"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_jargon_defined_on_first_use",
      "status": "pass",
      "evidence": "plain language: jargon is defined on first use"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_steps_presented_as_lists",
      "status": "pass",
      "evidence": "plain language: steps are presented as lists"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_examples_preferred_over_adjectives",
      "status": "pass",
      "evidence": "plain language: examples are preferred over adjectives"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_kept_continuously",
      "status": "pass",
      "evidence": "changelog: the changelog is kept continuously"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_not_retrofitted_at_release_time",
      "status": "pass",
      "evidence": "changelog: the changelog is never retro-fitted at release time"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_entry_for_current_version_present",
      "status": "pass",
      "evidence": "changelog: a changelog entry for the current version is present"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_doc_set_versioned_with_product",
      "status": "pass",
      "evidence": "versioning: the documentation set is versioned with the product it documents"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_doc_set_version_matches_product_version",
      "status": "pass",
      "evidence": "versioning: the declared doc-set version equals the declared product version exactly"
    },
    {
      "section": "red_lines",
      "check": "technical_documentation_free_of_private_contact_or_financial_data_in_docs",
      "status": "pass",
      "evidence": "red line: no private, contact or financial data published in the docs is present in the record"
    },
    {
      "section": "red_lines",
      "check": "technical_documentation_free_of_silent_todo_document",
      "status": "pass",
      "evidence": "red line: no silent TODO-to-document is present in the record \u2014 every such item is tracked or finished"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "documentation_set_docs_count": 1,
  "documentation_config_options_count": 1,
  "documentation_endpoints_count": 1,
  "documentation_decision_records_count": 1,
  "duplicate_technical_documentation_doc_ids": [],
  "duplicate_technical_documentation_config_option_ids": [],
  "duplicate_technical_documentation_endpoint_ids": [],
  "duplicate_technical_documentation_decision_record_ids": [],
  "technical_documentation_docs_with_invalid_kind": [],
  "technical_documentation_docs_without_source_location": [],
  "technical_documentation_docs_without_source_of_truth": [],
  "technical_documentation_config_options_without_default": [],
  "technical_documentation_config_options_not_documented": [],
  "technical_documentation_endpoints_without_working_example": [],
  "technical_documentation_endpoints_with_unverified_example": [],
  "technical_documentation_endpoints_with_unknown_doc_reference": [],
  "technical_documentation_decision_records_not_cross_linked": [],
  "technical_documentation_decision_records_with_unknown_doc_reference": [],
  "doc_source_of_truth_ratio": "1.000000",
  "config_option_documentation_ratio": "1.000000",
  "endpoint_worked_example_ratio": "1.000000",
  "decision_record_cross_link_ratio": "1.000000",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across eight sections.",
  "stamp": "TECHNICAL DOCUMENTATION PACK\nproduct_name: TestSystem\nVERDICT: TECHNICAL_DOCUMENTATION_SOUND\n  readme_and_doc_set_structure                 pass\n  docs_as_code_and_source_of_truth             pass\n  api_docs_and_worked_examples                 pass\n  decision_records_and_cross_links             pass\n  review_verification_and_testing              pass\n  plain_language_and_examples                  pass\n  changelog_and_versioning                     pass\n  red_lines                                    pass\n46 pass, 0 fail, 0 missing of 46 checks across eight sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T14:10:37.425155+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/technical-documentation-pack/evidence.json`.

Input:

```json
{
  "product_name": "TestSystem",
  "product_version": "1.0.0",
  "readme": {
    "what_it_is_one_paragraph_declared": true,
    "quickstart_present": true,
    "quickstart_copy_paste_ready": true,
    "usage_present": true,
    "operations_present": true,
    "troubleshooting_present": true,
    "where_to_change_things_present": true
  },
  "documents": [
    {
      "doc_id": "doc_001",
      "doc_kind": "invalid_kind",
      "source_location": "src/README.md",
      "source_of_truth": "repo_root"
    }
  ],
  "source_of_truth": {
    "docs_live_with_source_they_describe": true,
    "no_wiki_only_oracle_docs": true
  },
  "config_options": [
    {
      "option_id": "opt_001",
      "default_value": "true",
      "documented": false
    }
  ],
  "api_docs": {
    "generated_from_or_verified_against_contracts": true
  },
  "endpoints": [
    {
      "endpoint_id": "ep_001",
      "documented_in_doc_id": "doc_001",
      "has_working_example": true,
      "example_verified_against_contract": true
    }
  ],
  "decision_work": {
    "adrs_cross_linked_from_code_where_surprising": true
  },
  "decision_records": [
    {
      "adr_id": "adr_001",
      "documented_in_doc_id": "doc_001",
      "cross_linked_from_code": true
    }
  ],
  "review_verification": {
    "docs_reviewed_like_code": true,
    "docs_updated_in_same_change_as_behavior_changes": true,
    "quickstart_run_from_clean_environment": true,
    "quickstart_works_verbatim_from_clean_state": true,
    "worked_examples_tested": true,
    "screenshots_or_commands_present": false
  },
  "plain_language": {
    "short_sentences_used": true,
    "jargon_defined_on_first_use": true,
    "steps_presented_as_lists": true,
    "examples_preferred_over_adjectives": true
  },
  "changelog": {
    "kept_continuously": true,
    "not_retrofitted_at_release_time": true,
    "entry_for_current_version_present": true
  },
  "versioning": {
    "doc_set_version": "9.9.9",
    "doc_set_versioned_with_product": true
  },
  "red_lines": {
    "private_contact_or_financial_data_published_in_docs_present": false,
    "silent_todo_document_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "technical-documentation-pack",
  "atom_version": "0.1.0",
  "product_name": "TestSystem",
  "verdict": "TECHNICAL_DOCUMENTATION_NOT_SOUND",
  "sections": {
    "readme_and_doc_set_structure": "fail",
    "docs_as_code_and_source_of_truth": "fail",
    "api_docs_and_worked_examples": "pass",
    "decision_records_and_cross_links": "pass",
    "review_verification_and_testing": "pass",
    "plain_language_and_examples": "pass",
    "changelog_and_versioning": "fail",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_states_what_it_is_in_one_paragraph",
      "status": "pass",
      "evidence": "README skeleton: the README states what the documented thing is in one paragraph"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_quickstart_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a quickstart"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_quickstart_copy_paste_ready",
      "status": "pass",
      "evidence": "README skeleton: the quickstart is copy-paste ready"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_usage_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a usage section"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_operations_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries an operations section (env vars, ports, defaults)"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_troubleshooting_present",
      "status": "pass",
      "evidence": "README skeleton: the README carries a troubleshooting section"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_readme_where_to_change_things_present",
      "status": "pass",
      "evidence": "README skeleton: the README states where to change things"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "technical_documentation_doc_set_list_declared",
      "status": "pass",
      "evidence": "doc set: the declared record names its documentation rows \u2014 the list is present and names at least one document; an absent list is missing evidence and an empty list declares no documentation set at all"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_id_unique",
      "status": "pass",
      "evidence": "doc set: no declared doc_id is owned by more than one row"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_kind_recognised",
      "status": "fail",
      "evidence": "doc set: every declared document's kind is one of readme, runbook, api_doc, decision_record, changelog, reference, how_to, conceptual \u2014 the skill's named artifacts plus the reference / how-to / conceptual groupings for guide and reference material"
    },
    {
      "section": "readme_and_doc_set_structure",
      "check": "every_technical_documentation_doc_source_location_declared",
      "status": "pass",
      "evidence": "docs-as-code: every declared document declares a non-empty source location \u2014 where it lives with the source it describes"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_docs_live_with_source_they_describe",
      "status": "pass",
      "evidence": "docs-as-code: the docs live with the source they describe"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_no_wiki_only_oracle_docs",
      "status": "pass",
      "evidence": "docs-as-code: no wiki-only oracle documents \u2014 no document exists only outside the source it describes"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_doc_source_of_truth_declared",
      "status": "pass",
      "evidence": "source of truth: every declared document declares a non-empty source of truth \u2014 the contract, source or record it is generated from or verified against"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "technical_documentation_config_options_list_declared",
      "status": "pass",
      "evidence": "config options: the declared record names its config-option rows \u2014 the list is present and names at least one option; an absent list is missing evidence and an empty list declares no documented config at all"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_id_unique",
      "status": "pass",
      "evidence": "config options: no declared option_id is owned by more than one row"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_default_declared",
      "status": "pass",
      "evidence": "config options / quality gate: every declared config option declares a non-empty default value"
    },
    {
      "section": "docs_as_code_and_source_of_truth",
      "check": "every_technical_documentation_config_option_documented",
      "status": "fail",
      "evidence": "config options / quality gate: every declared config option is declared documented with its default"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "technical_documentation_api_docs_generated_from_or_verified_against_contracts",
      "status": "pass",
      "evidence": "API docs: the API docs are generated from, or verified against, the contracts"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "technical_documentation_endpoints_list_declared",
      "status": "pass",
      "evidence": "endpoints: the declared record names its endpoint rows \u2014 the list is present and names at least one endpoint; an absent list is missing evidence and an empty list declares no documented endpoints at all"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_id_unique",
      "status": "pass",
      "evidence": "endpoints: no declared endpoint_id is owned by more than one row"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_working_example_declared",
      "status": "pass",
      "evidence": "API docs: every declared endpoint declares one working example"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_example_verified_against_contract",
      "status": "pass",
      "evidence": "API docs: every declared endpoint's working example is declared verified against the contract"
    },
    {
      "section": "api_docs_and_worked_examples",
      "check": "every_technical_documentation_endpoint_documented_in_declared_doc",
      "status": "pass",
      "evidence": "endpoints: every declared endpoint's documented_in_doc_id names one of the declared documentation rows"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "technical_documentation_adrs_cross_linked_from_code_where_surprising",
      "status": "pass",
      "evidence": "decision records: ADRs are cross-linked from code where behaviour is surprising"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "technical_documentation_decision_records_list_declared",
      "status": "pass",
      "evidence": "decision records: the declared record names its decision-record rows \u2014 the list is present and names at least one record; an absent list is missing evidence and an empty list declares no decision records at all"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_id_unique",
      "status": "pass",
      "evidence": "decision records: no declared adr_id is owned by more than one row"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_cross_linked_from_code",
      "status": "pass",
      "evidence": "decision records: every declared decision record is declared cross-linked from the code it explains"
    },
    {
      "section": "decision_records_and_cross_links",
      "check": "every_technical_documentation_decision_record_documented_in_declared_doc",
      "status": "pass",
      "evidence": "decision records: every declared decision record's documented_in_doc_id names one of the declared documentation rows"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_docs_reviewed_like_code",
      "status": "pass",
      "evidence": "docs-as-code / review: the docs are reviewed like code"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_docs_updated_in_same_change_as_behavior",
      "status": "pass",
      "evidence": "quality gate: docs are updated in the same change as behaviour changes"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_quickstart_run_from_clean_environment",
      "status": "pass",
      "evidence": "test the docs: the quickstart was run from a clean environment"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_quickstart_works_verbatim_from_clean_state",
      "status": "pass",
      "evidence": "quality gate: the quickstart works verbatim from a clean state"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_worked_examples_tested",
      "status": "pass",
      "evidence": "test the docs: the worked examples in the documentation were tested"
    },
    {
      "section": "review_verification_and_testing",
      "check": "technical_documentation_screenshots_and_commands_current_where_present",
      "status": "pass",
      "evidence": "no screenshots or commands declared present"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_plain_language_short_sentences_used",
      "status": "pass",
      "evidence": "plain language: the documentation uses short sentences"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_jargon_defined_on_first_use",
      "status": "pass",
      "evidence": "plain language: jargon is defined on first use"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_steps_presented_as_lists",
      "status": "pass",
      "evidence": "plain language: steps are presented as lists"
    },
    {
      "section": "plain_language_and_examples",
      "check": "technical_documentation_examples_preferred_over_adjectives",
      "status": "pass",
      "evidence": "plain language: examples are preferred over adjectives"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_kept_continuously",
      "status": "pass",
      "evidence": "changelog: the changelog is kept continuously"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_not_retrofitted_at_release_time",
      "status": "pass",
      "evidence": "changelog: the changelog is never retro-fitted at release time"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_changelog_entry_for_current_version_present",
      "status": "pass",
      "evidence": "changelog: a changelog entry for the current version is present"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_doc_set_versioned_with_product",
      "status": "pass",
      "evidence": "versioning: the documentation set is versioned with the product it documents"
    },
    {
      "section": "changelog_and_versioning",
      "check": "technical_documentation_doc_set_version_matches_product_version",
      "status": "fail",
      "evidence": "versioning: the declared doc-set version equals the declared product version exactly"
    },
    {
      "section": "red_lines",
      "check": "technical_documentation_free_of_private_contact_or_financial_data_in_docs",
      "status": "pass",
      "evidence": "red line: no private, contact or financial data published in the docs is present in the record"
    },
    {
      "section": "red_lines",
      "check": "technical_documentation_free_of_silent_todo_document",
      "status": "pass",
      "evidence": "red line: no silent TODO-to-document is present in the record \u2014 every such item is tracked or finished"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "documentation_set_docs_count": 1,
  "documentation_config_options_count": 1,
  "documentation_endpoints_count": 1,
  "documentation_decision_records_count": 1,
  "duplicate_technical_documentation_doc_ids": [],
  "duplicate_technical_documentation_config_option_ids": [],
  "duplicate_technical_documentation_endpoint_ids": [],
  "duplicate_technical_documentation_decision_record_ids": [],
  "technical_documentation_docs_with_invalid_kind": [
    "doc_001"
  ],
  "technical_documentation_docs_without_source_location": [],
  "technical_documentation_docs_without_source_of_truth": [],
  "technical_documentation_config_options_without_default": [],
  "technical_documentation_config_options_not_documented": [
    "opt_001"
  ],
  "technical_documentation_endpoints_without_working_example": [],
  "technical_documentation_endpoints_with_unverified_example": [],
  "technical_documentation_endpoints_with_unknown_doc_reference": [],
  "technical_documentation_decision_records_not_cross_linked": [],
  "technical_documentation_decision_records_with_unknown_doc_reference": [],
  "doc_source_of_truth_ratio": "1.000000",
  "config_option_documentation_ratio": "0.000000",
  "endpoint_worked_example_ratio": "1.000000",
  "decision_record_cross_link_ratio": "1.000000",
  "summary": "43 pass, 3 fail, 0 missing of 46 checks across eight sections.",
  "stamp": "TECHNICAL DOCUMENTATION PACK\nproduct_name: TestSystem\nVERDICT: TECHNICAL_DOCUMENTATION_NOT_SOUND\n  readme_and_doc_set_structure                 fail\n  docs_as_code_and_source_of_truth             fail\n  api_docs_and_worked_examples                 pass\n  decision_records_and_cross_links             pass\n  review_verification_and_testing              pass\n  plain_language_and_examples                  pass\n  changelog_and_versioning                     fail\n  red_lines                                    pass\n43 pass, 3 fail, 0 missing of 46 checks across eight sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T14:10:37.425155+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/technical-documentation-pack/evidence.json`.

Input:

```json
{
  "product_name": "MalformedSystem",
  "documents": "not_a_list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "documents",
  "detail": "documents must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — a declared-record audit; SERVICE.md's U-13 screen is (a) No outright (declared-record audit against its bound skill, offering no engineering-practice, financial, securities or psychology-adjacent advice), so no regulator role view is provided for this atom (see Role views) |
| Checks named | 46 documented / 46 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the four counts, the four duplicate-id lists, the ten row-name lists and the four ratios) |
| Input reference typed | Yes — 62 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/technical-documentation-pack/evidence.json` |
