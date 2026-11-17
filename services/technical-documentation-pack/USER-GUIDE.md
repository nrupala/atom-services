# Technical documentation pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You keep a technical documentation production record for one product or system — its README, its documentation set, its config options, its API endpoints, its decision records, and how the docs were reviewed, tested and versioned. This atom reads one declared technical documentation production record and returns one deterministic verdict across eight sections (readme_and_doc_set_structure, docs_as_code_and_source_of_truth, api_docs_and_worked_examples, decision_records_and_cross_links, review_verification_and_testing, plain_language_and_examples, changelog_and_versioning, red_lines): **TECHNICAL_DOCUMENTATION_SOUND**, **TECHNICAL_DOCUMENTATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. It audits the declared production record's completeness and internal consistency only — it writes no documentation, opens no document, runs no quickstart, executes no example, fetches no contract, and verifies no document against the real product. A documentation set is sound *on your declared evidence*: a record that declares its quickstart tested, its examples verified and its versions matching passes those checks even if the real documentation work did none of it. It is not a documentation service, a doc review, or a guarantee that the documentation is accurate or good: it never judges whether a declared source of truth actually supports the document that cites it, whether a quickstart actually works, whether the writing is clear, or whether the docs should be published — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The skill's red lines are checks here, not features: no private, contact or financial data published in docs, and no silent "TODO: document" item are ever performed — the atom audits the record of the documentation production you have already carried out. The computed checks: the declared `documents` list must be present and name at least one document, with unique `doc_id` values, every `doc_kind` one of `readme`, `runbook`, `api_doc`, `decision_record`, `changelog`, `reference`, `how_to` or `conceptual`, and a non-empty `source_location` and `source_of_truth` on every row; the declared `config_options` list must be present and name at least one option, with unique `option_id` values, a non-empty `default_value` and `documented` true on every row; the declared `endpoints` list must be present and name at least one endpoint, with unique `endpoint_id` values, a working example and a contract-verified example on every row, and every row's `documented_in_doc_id` naming a declared document; the declared `decision_records` list must be present and name at least one record, with unique `adr_id` values, a code cross-link on every row, and every row's `documented_in_doc_id` naming a declared document; and the declared `versioning.doc_set_version` must equal the declared `product_version` exactly. One further check is gated on the record's own declared gate field — when the gate is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when the gate is `true` the target declaration is required: screenshots and commands verified current is required only where `review_verification.screenshots_or_commands_present` is declared true. No numeric threshold is imposed — no minimum or maximum number of documents, config options, endpoints or decision records beyond at least one each; no reading-level, sentence-length or jargon-density bar for plain language (checked as declarations only); no documentation-coverage percentage for config options, endpoints or features beyond exact completeness over the declared rows; no example correctness bar beyond declared verification against the contract (the atom receives no contract and no example text and verifies nothing against the world); no freshness interval in days for screenshots, commands or any document; no changelog-entry format or length bar; no versioning-scheme bar beyond exact equality of the two declared version strings; and no judgment that the documentation is good, clear or useful (only that its declared production record contains what the skill requires). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "technical-documentation-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/technical-documentation-pack` — tool name `technical_documentation_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/technical-documentation-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `product_name` | Product/system name (string; carried into the output, not checked) |
| `product_version` (string) | computed: must equal `versioning.doc_set_version` exactly |
| `readme.what_it_is_one_paragraph_declared` | README evidence: the README states what the documented thing is in one paragraph |
| `readme.quickstart_present` | README evidence: the README carries a quickstart |
| `readme.quickstart_copy_paste_ready` | README evidence: the quickstart is copy-paste ready |
| `readme.usage_present` | README evidence: the README carries a usage section |
| `readme.operations_present` | README evidence: the README carries an operations section (env vars, ports, defaults) |
| `readme.troubleshooting_present` | README evidence: the README carries a troubleshooting section |
| `readme.where_to_change_things_present` | README evidence: the README states where to change things |
| `documents` (list of document objects) | computed: must be present and name at least one document; reported as `documentation_set_docs_count` |
| `documents[].doc_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `documents[].doc_kind` (string) | computed: must be one of `readme`, `runbook`, `api_doc`, `decision_record`, `changelog`, `reference`, `how_to`, `conceptual` |
| `documents[].source_location` (string) | computed: must be present and non-empty on every row — where the document lives with the source it describes |
| `documents[].source_of_truth` (string) | computed: must be present and non-empty on every row — the contract, source or record the document is generated from or verified against |
| `source_of_truth.docs_live_with_source_they_describe` | docs-as-code evidence: the docs live with the source they describe |
| `source_of_truth.no_wiki_only_oracle_docs` | docs-as-code evidence: no wiki-only oracle documents |
| `config_options` (list of config-option objects) | computed: must be present and name at least one option; reported as `documentation_config_options_count` |
| `config_options[].option_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `config_options[].default_value` (string) | computed: must be present and non-empty on every row |
| `config_options[].documented` | computed: must be `true` on every row |
| `api_docs.generated_from_or_verified_against_contracts` | API-docs evidence: the API docs are generated from, or verified against, the contracts |
| `endpoints` (list of endpoint objects) | computed: must be present and name at least one endpoint; reported as `documentation_endpoints_count` |
| `endpoints[].endpoint_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `endpoints[].documented_in_doc_id` (string) | computed: must name one of the declared documents |
| `endpoints[].has_working_example` | computed: must be `true` on every row |
| `endpoints[].example_verified_against_contract` | computed: must be `true` on every row |
| `decision_work.adrs_cross_linked_from_code_where_surprising` | decision-record evidence: ADRs are cross-linked from code where behaviour is surprising |
| `decision_records` (list of decision-record objects) | computed: must be present and name at least one record; reported as `documentation_decision_records_count` |
| `decision_records[].adr_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `decision_records[].documented_in_doc_id` (string) | computed: must name one of the declared documents |
| `decision_records[].cross_linked_from_code` | computed: must be `true` on every row |
| `review_verification.docs_reviewed_like_code` | review evidence: the docs are reviewed like code |
| `review_verification.docs_updated_in_same_change_as_behavior_changes` | review evidence: docs are updated in the same change as behaviour changes |
| `review_verification.quickstart_run_from_clean_environment` | testing evidence: the quickstart was run from a clean environment |
| `review_verification.quickstart_works_verbatim_from_clean_state` | testing evidence: the quickstart works verbatim from a clean state |
| `review_verification.worked_examples_tested` | testing evidence: the worked examples in the documentation were tested |
| `review_verification.screenshots_or_commands_present` | gates the currentness check: verified-current is required only where screenshots/commands are declared present |
| `review_verification.screenshots_and_commands_verified_current` | required when `review_verification.screenshots_or_commands_present` is `true`; otherwise the check passes as not applicable |
| `plain_language.short_sentences_used` | plain-language evidence: the documentation uses short sentences |
| `plain_language.jargon_defined_on_first_use` | plain-language evidence: jargon is defined on first use |
| `plain_language.steps_presented_as_lists` | plain-language evidence: steps are presented as lists |
| `plain_language.examples_preferred_over_adjectives` | plain-language evidence: examples are preferred over adjectives |
| `changelog.kept_continuously` | changelog evidence: the changelog is kept continuously |
| `changelog.not_retrofitted_at_release_time` | changelog evidence: the changelog is never retro-fitted at release time |
| `changelog.entry_for_current_version_present` | changelog evidence: a changelog entry for the current version is present |
| `versioning.doc_set_version` (string) | computed: must equal `product_version` exactly |
| `versioning.doc_set_versioned_with_product` | versioning evidence: the documentation set is versioned with the product it documents |
| `red_lines.private_contact_or_financial_data_published_in_docs_present` | must be `false` to pass (red line: no private, contact or financial data published in the docs) |
| `red_lines.silent_todo_document_present` | must be `false` to pass (red line: no silent TODO-to-document — every such item is tracked or finished) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward TECHNICAL_DOCUMENTATION_NOT_SOUND). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/technical-documentation-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

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
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across eight sections."
}
```

## Verdicts

- **TECHNICAL_DOCUMENTATION_SOUND** — every check passes; the declared technical documentation production record is complete and internally consistent with the skill's method, quality gates and red lines.
- **TECHNICAL_DOCUMENTATION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `documentation_set_docs_count`, `documentation_config_options_count`, `documentation_endpoints_count` and `documentation_decision_records_count` (integers, exactly; null when the corresponding list is not declared), `duplicate_technical_documentation_doc_ids`, `duplicate_technical_documentation_config_option_ids`, `duplicate_technical_documentation_endpoint_ids` and `duplicate_technical_documentation_decision_record_ids` (ids carried by more than one row; each null when its list is not declared), `technical_documentation_docs_with_invalid_kind`, `technical_documentation_docs_without_source_location`, `technical_documentation_docs_without_source_of_truth`, `technical_documentation_config_options_without_default`, `technical_documentation_config_options_not_documented`, `technical_documentation_endpoints_without_working_example`, `technical_documentation_endpoints_with_unverified_example`, `technical_documentation_endpoints_with_unknown_doc_reference`, `technical_documentation_decision_records_not_cross_linked` and `technical_documentation_decision_records_with_unknown_doc_reference` (the offending rows for each computed rule; each null when its underlying list is not declared), `doc_source_of_truth_ratio` (documents with a declared source of truth ÷ declared documents), `config_option_documentation_ratio` (config options both declaring a default and declared documented ÷ declared options), `endpoint_worked_example_ratio` (endpoints both carrying a working example and declaring it verified against the contract ÷ declared endpoints) and `decision_record_cross_link_ratio` (decision records declared cross-linked from code ÷ declared records; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the nineteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
