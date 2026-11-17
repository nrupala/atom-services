#!/usr/bin/env python3
"""Technical documentation pack — deterministic core.

Built from the bound skill `technical-writing`: "Docs are part
of the product. Write for the reader who arrives tired and
wants to get something done." Its method is this atom's
method: a README skeleton (what it is in one paragraph,
quickstart copy-paste and tested, usage, operations — env
vars, ports, defaults — troubleshooting, where to change
things); docs-as-code (docs live with the source they
describe, reviewed like code, no wiki-only oracles); API docs
generated from or verified against the contracts, with one
working example per endpoint; decision records cross-linked
from code where behaviour is surprising; a changelog kept
continuously, never retro-fitted at release time; plain
language (short sentences, jargon defined on first use, steps
as lists, examples over adjectives); and tested docs (run the
quickstart from a clean environment — broken docs equal
broken trust). Its quality gates are this atom's gates:
quickstart works verbatim from a clean state; every config
option documented with its default; docs updated in the same
PR as behaviour changes; no stale screenshots or commands.
Its red lines are this atom's red lines: never publish
private, contact or financial data in docs; no silent
"TODO: document" — track it or finish it.

This atom is a DELIVERABLE audit of a declared technical
documentation production record for one product/system: it
audits the record a caller declares — the README skeleton
declarations, the declared documentation-set rows (each by
kind, with its source location and source of truth), the
declared config-option rows, the declared API endpoint rows
with their worked examples and the documentation rows they
point at, the declared decision-record rows with their
code cross-links and documentation rows, the review /
verification / testing declarations, the plain-language
declarations, the changelog and versioning declarations, and
the red lines refused. It writes no documentation, opens no
document, runs no quickstart, verifies no doc against the
real product and judges no document's quality — it checks
that the documentation record the skill requires is present
and internally consistent on the declared evidence, and it
recomputes the declared coverage sets exactly.

Distinct ground: the nearest siblings are
`long-form-authoring-pipeline` (a declared long-form written
work — approved outline, drafting loop, review passes,
versioning and publishing of prose for a reader/learner),
`document-operations-service` (document workflow operations
— opening, finding, editing and converting documents) and
`technical-explainer-content-pack` (authored in this same
batch — learner-facing educational content with learning
objectives, whose reader is learning a subject). This atom
shares zero checks with any of them: every check here is a
product/system documentation question — a README skeleton
complete for a user/operator/developer of the documented
thing, a doc set that lives with its source and names its
source of truth, every declared config option documented
with its default, every declared endpoint carrying a working
example verified against its contract and pointing at a
declared doc, every declared decision record cross-linked
from code and pointing at a declared doc, docs reviewed like
code and tested from a clean environment, and a doc-set
version that matches the product version. The boundary is
unmistakable: a product/system documentation SET audited
against its declared sources here; a written work's
authoring loop, document workflow operations, and
learner-facing explainer content there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- documentation set: at least one declared row, unique doc
  ids, every doc kind one of the recognised kinds (the
  skill's named artifacts — readme, runbook, api_doc,
  decision_record, changelog — plus the reference / how_to /
  conceptual groupings for guide and reference material in
  the set), a non-empty source location and a non-empty
  source of truth on every row;
- config options: at least one declared row, unique option
  ids, a non-empty declared default and a documented
  declaration on every row;
- endpoints: at least one declared row, unique endpoint ids,
  a working example and a contract-verified example on every
  row, and every row's documented_in_doc_id naming one of the
  declared documentation rows;
- decision records: at least one declared row, unique record
  ids, a code cross-link on every row, and every row's
  documented_in_doc_id naming one of the declared
  documentation rows;
- versioning: the declared doc-set version must equal the
  declared product version exactly.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
doc count beyond at least one row per declared list, no
reading-level score, no sentence-length bar, no coverage
percentage — so no such check is invented; those quantities
are caller declarations at most, and quantities here are
computed and reported, with exact completeness and
cross-reference consistency over the caller's own declared
rows as the only bars.

Verdict:
- any fail             -> TECHNICAL_DOCUMENTATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TECHNICAL_DOCUMENTATION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "readme_and_doc_set_structure",
    "docs_as_code_and_source_of_truth",
    "api_docs_and_worked_examples",
    "decision_records_and_cross_links",
    "review_verification_and_testing",
    "plain_language_and_examples",
    "changelog_and_versioning",
    "red_lines",
)

DOC_KINDS = ("readme", "runbook", "api_doc", "decision_record",
             "changelog", "reference", "how_to", "conceptual")

MANIFEST_SPEC = {
    "product_name": "string",
    "product_version": "string",
    "readme": {
        "what_it_is_one_paragraph_declared": "boolean",
        "quickstart_present": "boolean",
        "quickstart_copy_paste_ready": "boolean",
        "usage_present": "boolean",
        "operations_present": "boolean",
        "troubleshooting_present": "boolean",
        "where_to_change_things_present": "boolean",
    },
    "documents": [{
        "doc_id": "string",
        "doc_kind": "string",
        "source_location": "string",
        "source_of_truth": "string",
    }],
    "source_of_truth": {
        "docs_live_with_source_they_describe": "boolean",
        "no_wiki_only_oracle_docs": "boolean",
    },
    "config_options": [{
        "option_id": "string",
        "default_value": "string",
        "documented": "boolean",
    }],
    "api_docs": {
        "generated_from_or_verified_against_contracts": "boolean",
    },
    "endpoints": [{
        "endpoint_id": "string",
        "documented_in_doc_id": "string",
        "has_working_example": "boolean",
        "example_verified_against_contract": "boolean",
    }],
    "decision_work": {
        "adrs_cross_linked_from_code_where_surprising": "boolean",
    },
    "decision_records": [{
        "adr_id": "string",
        "documented_in_doc_id": "string",
        "cross_linked_from_code": "boolean",
    }],
    "review_verification": {
        "docs_reviewed_like_code": "boolean",
        "docs_updated_in_same_change_as_behavior_changes": "boolean",
        "quickstart_run_from_clean_environment": "boolean",
        "quickstart_works_verbatim_from_clean_state": "boolean",
        "worked_examples_tested": "boolean",
        "screenshots_or_commands_present": "boolean",
        "screenshots_and_commands_verified_current": "boolean",
    },
    "plain_language": {
        "short_sentences_used": "boolean",
        "jargon_defined_on_first_use": "boolean",
        "steps_presented_as_lists": "boolean",
        "examples_preferred_over_adjectives": "boolean",
    },
    "changelog": {
        "kept_continuously": "boolean",
        "not_retrofitted_at_release_time": "boolean",
        "entry_for_current_version_present": "boolean",
    },
    "versioning": {
        "doc_set_version": "string",
        "doc_set_versioned_with_product": "boolean",
    },
    "red_lines": {
        "private_contact_or_financial_data_published_in_docs_present": "boolean",
        "silent_todo_document_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a technical documentation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    docs, has_docs = _get(manifest, "documents")
    docs_is_list = has_docs and isinstance(docs, list)
    docs_count = len(docs) if docs_is_list else None
    doc_rows = docs if docs_is_list else []
    doc_ids = _ids(doc_rows, "doc_id")

    options, has_options = _get(manifest, "config_options")
    options_is_list = has_options and isinstance(options, list)
    options_count = len(options) if options_is_list else None
    option_rows = options if options_is_list else []

    endpoints, has_endpoints = _get(manifest, "endpoints")
    endpoints_is_list = has_endpoints and isinstance(endpoints, list)
    endpoints_count = len(endpoints) if endpoints_is_list else None
    endpoint_rows = endpoints if endpoints_is_list else []

    adrs, has_adrs = _get(manifest, "decision_records")
    adrs_is_list = has_adrs and isinstance(adrs, list)
    adrs_count = len(adrs) if adrs_is_list else None
    adr_rows = adrs if adrs_is_list else []

    duplicate_doc_ids = (
        _duplicates(doc_rows, "doc_id") if docs_is_list else None)
    duplicate_option_ids = (
        _duplicates(option_rows, "option_id") if options_is_list else None)
    duplicate_endpoint_ids = (
        _duplicates(endpoint_rows, "endpoint_id")
        if endpoints_is_list else None)
    duplicate_adr_ids = (
        _duplicates(adr_rows, "adr_id") if adrs_is_list else None)

    docs_with_invalid_kind = (
        [_row_name(c, "doc_id") for c in doc_rows
         if _has(c, "doc_kind") and c.get("doc_kind") not in DOC_KINDS]
        if docs_is_list else None)
    docs_without_location = (
        [_row_name(c, "doc_id") for c in doc_rows
         if _has(c, "source_location")
         and not _nonempty_str(c.get("source_location"))]
        if docs_is_list else None)
    docs_without_truth = (
        [_row_name(c, "doc_id") for c in doc_rows
         if _has(c, "source_of_truth")
         and not _nonempty_str(c.get("source_of_truth"))]
        if docs_is_list else None)
    options_without_default = (
        [_row_name(c, "option_id") for c in option_rows
         if _has(c, "default_value")
         and not _nonempty_str(c.get("default_value"))]
        if options_is_list else None)
    options_not_documented = (
        [_row_name(c, "option_id") for c in option_rows
         if _has(c, "documented") and c.get("documented") is not True]
        if options_is_list else None)
    endpoints_without_example = (
        [_row_name(c, "endpoint_id") for c in endpoint_rows
         if _has(c, "has_working_example")
         and c.get("has_working_example") is not True]
        if endpoints_is_list else None)
    endpoints_with_unverified_example = (
        [_row_name(c, "endpoint_id") for c in endpoint_rows
         if _has(c, "example_verified_against_contract")
         and c.get("example_verified_against_contract") is not True]
        if endpoints_is_list else None)
    endpoints_with_unknown_doc = (
        [_row_name(c, "endpoint_id") for c in endpoint_rows
         if _has(c, "documented_in_doc_id")
         and c.get("documented_in_doc_id") not in doc_ids]
        if endpoints_is_list and docs_is_list else None)
    adrs_not_cross_linked = (
        [_row_name(c, "adr_id") for c in adr_rows
         if _has(c, "cross_linked_from_code")
         and c.get("cross_linked_from_code") is not True]
        if adrs_is_list else None)
    adrs_with_unknown_doc = (
        [_row_name(c, "adr_id") for c in adr_rows
         if _has(c, "documented_in_doc_id")
         and c.get("documented_in_doc_id") not in doc_ids]
        if adrs_is_list and docs_is_list else None)

    doc_truth_ratio = (
        sum(1 for c in doc_rows
            if _nonempty_str(c.get("source_of_truth"))) / docs_count
        if docs_is_list and docs_count > 0 else None)
    option_documentation_ratio = (
        sum(1 for c in option_rows
            if _nonempty_str(c.get("default_value"))
            and c.get("documented") is True) / options_count
        if options_is_list and options_count > 0 else None)
    endpoint_example_ratio = (
        sum(1 for c in endpoint_rows
            if c.get("has_working_example") is True
            and c.get("example_verified_against_contract") is True)
        / endpoints_count
        if endpoints_is_list and endpoints_count > 0 else None)
    adr_cross_link_ratio = (
        sum(1 for c in adr_rows
            if c.get("cross_linked_from_code") is True) / adrs_count
        if adrs_is_list and adrs_count > 0 else None)

    product_version, has_product_version = _get(manifest, "product_version")
    doc_set_version, has_doc_set_version = _get(
        manifest, "versioning", "doc_set_version")

    # ---- Section 1: readme_and_doc_set_structure ----
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_states_what_it_is_in_one_paragraph",
                manifest, ("readme", "what_it_is_one_paragraph_declared"),
                "README skeleton: the README states what the documented thing is in one paragraph")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_quickstart_present", manifest,
                ("readme", "quickstart_present"),
                "README skeleton: the README carries a quickstart")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_quickstart_copy_paste_ready",
                manifest, ("readme", "quickstart_copy_paste_ready"),
                "README skeleton: the quickstart is copy-paste ready")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_usage_present", manifest,
                ("readme", "usage_present"),
                "README skeleton: the README carries a usage section")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_operations_present", manifest,
                ("readme", "operations_present"),
                "README skeleton: the README carries an operations section (env vars, ports, defaults)")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_troubleshooting_present",
                manifest, ("readme", "troubleshooting_present"),
                "README skeleton: the README carries a troubleshooting section")
    _bool_check(results, "readme_and_doc_set_structure",
                "technical_documentation_readme_where_to_change_things_present",
                manifest, ("readme", "where_to_change_things_present"),
                "README skeleton: the README states where to change things")
    _check(results, "readme_and_doc_set_structure",
           "technical_documentation_doc_set_list_declared", docs,
           docs_is_list, docs_is_list and docs_count > 0,
           "doc set: the declared record names its documentation rows — the list is present and names at least one document; an absent list is missing evidence and an empty list declares no documentation set at all")
    doc_id_present = docs_is_list and all(
        _has(c, "doc_id") for c in doc_rows)
    _check(results, "readme_and_doc_set_structure",
           "every_technical_documentation_doc_id_unique", docs,
           doc_id_present,
           docs_is_list and duplicate_doc_ids is not None
           and len(duplicate_doc_ids) == 0,
           "doc set: no declared doc_id is owned by more than one row")
    kind_present = docs_is_list and all(
        _has(c, "doc_kind") for c in doc_rows)
    _check(results, "readme_and_doc_set_structure",
           "every_technical_documentation_doc_kind_recognised", docs,
           kind_present,
           docs_is_list
           and all(c.get("doc_kind") in DOC_KINDS for c in doc_rows),
           "doc set: every declared document's kind is one of readme, runbook, api_doc, decision_record, changelog, reference, how_to, conceptual — the skill's named artifacts plus the reference / how-to / conceptual groupings for guide and reference material")
    location_present = docs_is_list and all(
        _has(c, "source_location") for c in doc_rows)
    _check(results, "readme_and_doc_set_structure",
           "every_technical_documentation_doc_source_location_declared", docs,
           location_present,
           docs_is_list
           and all(_nonempty_str(c.get("source_location")) for c in doc_rows),
           "docs-as-code: every declared document declares a non-empty source location — where it lives with the source it describes")

    # ---- Section 2: docs_as_code_and_source_of_truth ----
    _bool_check(results, "docs_as_code_and_source_of_truth",
                "technical_documentation_docs_live_with_source_they_describe",
                manifest,
                ("source_of_truth", "docs_live_with_source_they_describe"),
                "docs-as-code: the docs live with the source they describe")
    _bool_check(results, "docs_as_code_and_source_of_truth",
                "technical_documentation_no_wiki_only_oracle_docs", manifest,
                ("source_of_truth", "no_wiki_only_oracle_docs"),
                "docs-as-code: no wiki-only oracle documents — no document exists only outside the source it describes")
    truth_present = docs_is_list and all(
        _has(c, "source_of_truth") for c in doc_rows)
    _check(results, "docs_as_code_and_source_of_truth",
           "every_technical_documentation_doc_source_of_truth_declared", docs,
           truth_present,
           docs_is_list
           and all(_nonempty_str(c.get("source_of_truth")) for c in doc_rows),
           "source of truth: every declared document declares a non-empty source of truth — the contract, source or record it is generated from or verified against")
    _check(results, "docs_as_code_and_source_of_truth",
           "technical_documentation_config_options_list_declared", options,
           options_is_list, options_is_list and options_count > 0,
           "config options: the declared record names its config-option rows — the list is present and names at least one option; an absent list is missing evidence and an empty list declares no documented config at all")
    option_id_present = options_is_list and all(
        _has(c, "option_id") for c in option_rows)
    _check(results, "docs_as_code_and_source_of_truth",
           "every_technical_documentation_config_option_id_unique", options,
           option_id_present,
           options_is_list and duplicate_option_ids is not None
           and len(duplicate_option_ids) == 0,
           "config options: no declared option_id is owned by more than one row")
    default_present = options_is_list and all(
        _has(c, "default_value") for c in option_rows)
    _check(results, "docs_as_code_and_source_of_truth",
           "every_technical_documentation_config_option_default_declared",
           options, default_present,
           options_is_list
           and all(_nonempty_str(c.get("default_value")) for c in option_rows),
           "config options / quality gate: every declared config option declares a non-empty default value")
    documented_present = options_is_list and all(
        _has(c, "documented") for c in option_rows)
    _check(results, "docs_as_code_and_source_of_truth",
           "every_technical_documentation_config_option_documented", options,
           documented_present,
           options_is_list
           and all(c.get("documented") is True for c in option_rows),
           "config options / quality gate: every declared config option is declared documented with its default")

    # ---- Section 3: api_docs_and_worked_examples ----
    _bool_check(results, "api_docs_and_worked_examples",
                "technical_documentation_api_docs_generated_from_or_verified_against_contracts",
                manifest,
                ("api_docs", "generated_from_or_verified_against_contracts"),
                "API docs: the API docs are generated from, or verified against, the contracts")
    _check(results, "api_docs_and_worked_examples",
           "technical_documentation_endpoints_list_declared", endpoints,
           endpoints_is_list, endpoints_is_list and endpoints_count > 0,
           "endpoints: the declared record names its endpoint rows — the list is present and names at least one endpoint; an absent list is missing evidence and an empty list declares no documented endpoints at all")
    endpoint_id_present = endpoints_is_list and all(
        _has(c, "endpoint_id") for c in endpoint_rows)
    _check(results, "api_docs_and_worked_examples",
           "every_technical_documentation_endpoint_id_unique", endpoints,
           endpoint_id_present,
           endpoints_is_list and duplicate_endpoint_ids is not None
           and len(duplicate_endpoint_ids) == 0,
           "endpoints: no declared endpoint_id is owned by more than one row")
    example_present = endpoints_is_list and all(
        _has(c, "has_working_example") for c in endpoint_rows)
    _check(results, "api_docs_and_worked_examples",
           "every_technical_documentation_endpoint_working_example_declared",
           endpoints, example_present,
           endpoints_is_list
           and all(c.get("has_working_example") is True
                   for c in endpoint_rows),
           "API docs: every declared endpoint declares one working example")
    verified_present = endpoints_is_list and all(
        _has(c, "example_verified_against_contract") for c in endpoint_rows)
    _check(results, "api_docs_and_worked_examples",
           "every_technical_documentation_endpoint_example_verified_against_contract",
           endpoints, verified_present,
           endpoints_is_list
           and all(c.get("example_verified_against_contract") is True
                   for c in endpoint_rows),
           "API docs: every declared endpoint's working example is declared verified against the contract")
    endpoint_doc_present = (endpoints_is_list and docs_is_list and all(
        _has(c, "documented_in_doc_id") for c in endpoint_rows))
    _check(results, "api_docs_and_worked_examples",
           "every_technical_documentation_endpoint_documented_in_declared_doc",
           endpoints, endpoint_doc_present,
           endpoints_is_list and docs_is_list
           and all(_has(c, "documented_in_doc_id")
                   and c.get("documented_in_doc_id") in doc_ids
                   for c in endpoint_rows),
           "endpoints: every declared endpoint's documented_in_doc_id names one of the declared documentation rows")

    # ---- Section 4: decision_records_and_cross_links ----
    _bool_check(results, "decision_records_and_cross_links",
                "technical_documentation_adrs_cross_linked_from_code_where_surprising",
                manifest,
                ("decision_work", "adrs_cross_linked_from_code_where_surprising"),
                "decision records: ADRs are cross-linked from code where behaviour is surprising")
    _check(results, "decision_records_and_cross_links",
           "technical_documentation_decision_records_list_declared", adrs,
           adrs_is_list, adrs_is_list and adrs_count > 0,
           "decision records: the declared record names its decision-record rows — the list is present and names at least one record; an absent list is missing evidence and an empty list declares no decision records at all")
    adr_id_present = adrs_is_list and all(
        _has(c, "adr_id") for c in adr_rows)
    _check(results, "decision_records_and_cross_links",
           "every_technical_documentation_decision_record_id_unique", adrs,
           adr_id_present,
           adrs_is_list and duplicate_adr_ids is not None
           and len(duplicate_adr_ids) == 0,
           "decision records: no declared adr_id is owned by more than one row")
    cross_present = adrs_is_list and all(
        _has(c, "cross_linked_from_code") for c in adr_rows)
    _check(results, "decision_records_and_cross_links",
           "every_technical_documentation_decision_record_cross_linked_from_code",
           adrs, cross_present,
           adrs_is_list
           and all(c.get("cross_linked_from_code") is True
                   for c in adr_rows),
           "decision records: every declared decision record is declared cross-linked from the code it explains")
    adr_doc_present = (adrs_is_list and docs_is_list and all(
        _has(c, "documented_in_doc_id") for c in adr_rows))
    _check(results, "decision_records_and_cross_links",
           "every_technical_documentation_decision_record_documented_in_declared_doc",
           adrs, adr_doc_present,
           adrs_is_list and docs_is_list
           and all(_has(c, "documented_in_doc_id")
                   and c.get("documented_in_doc_id") in doc_ids
                   for c in adr_rows),
           "decision records: every declared decision record's documented_in_doc_id names one of the declared documentation rows")

    # ---- Section 5: review_verification_and_testing ----
    _bool_check(results, "review_verification_and_testing",
                "technical_documentation_docs_reviewed_like_code", manifest,
                ("review_verification", "docs_reviewed_like_code"),
                "docs-as-code / review: the docs are reviewed like code")
    _bool_check(results, "review_verification_and_testing",
                "technical_documentation_docs_updated_in_same_change_as_behavior",
                manifest,
                ("review_verification",
                 "docs_updated_in_same_change_as_behavior_changes"),
                "quality gate: docs are updated in the same change as behaviour changes")
    _bool_check(results, "review_verification_and_testing",
                "technical_documentation_quickstart_run_from_clean_environment",
                manifest,
                ("review_verification", "quickstart_run_from_clean_environment"),
                "test the docs: the quickstart was run from a clean environment")
    _bool_check(results, "review_verification_and_testing",
                "technical_documentation_quickstart_works_verbatim_from_clean_state",
                manifest,
                ("review_verification",
                 "quickstart_works_verbatim_from_clean_state"),
                "quality gate: the quickstart works verbatim from a clean state")
    _bool_check(results, "review_verification_and_testing",
                "technical_documentation_worked_examples_tested", manifest,
                ("review_verification", "worked_examples_tested"),
                "test the docs: the worked examples in the documentation were tested")
    _gated_bool_check(
        results, "review_verification_and_testing",
        "technical_documentation_screenshots_and_commands_current_where_present",
        manifest,
        ("review_verification", "screenshots_or_commands_present"),
        ("review_verification", "screenshots_and_commands_verified_current"),
        "quality gate: no stale screenshots or commands — every screenshot or command present is verified current",
        "no screenshots or commands declared present")

    # ---- Section 6: plain_language_and_examples ----
    _bool_check(results, "plain_language_and_examples",
                "technical_documentation_plain_language_short_sentences_used",
                manifest, ("plain_language", "short_sentences_used"),
                "plain language: the documentation uses short sentences")
    _bool_check(results, "plain_language_and_examples",
                "technical_documentation_jargon_defined_on_first_use", manifest,
                ("plain_language", "jargon_defined_on_first_use"),
                "plain language: jargon is defined on first use")
    _bool_check(results, "plain_language_and_examples",
                "technical_documentation_steps_presented_as_lists", manifest,
                ("plain_language", "steps_presented_as_lists"),
                "plain language: steps are presented as lists")
    _bool_check(results, "plain_language_and_examples",
                "technical_documentation_examples_preferred_over_adjectives",
                manifest, ("plain_language", "examples_preferred_over_adjectives"),
                "plain language: examples are preferred over adjectives")

    # ---- Section 7: changelog_and_versioning ----
    _bool_check(results, "changelog_and_versioning",
                "technical_documentation_changelog_kept_continuously", manifest,
                ("changelog", "kept_continuously"),
                "changelog: the changelog is kept continuously")
    _bool_check(results, "changelog_and_versioning",
                "technical_documentation_changelog_not_retrofitted_at_release_time",
                manifest, ("changelog", "not_retrofitted_at_release_time"),
                "changelog: the changelog is never retro-fitted at release time")
    _bool_check(results, "changelog_and_versioning",
                "technical_documentation_changelog_entry_for_current_version_present",
                manifest, ("changelog", "entry_for_current_version_present"),
                "changelog: a changelog entry for the current version is present")
    _bool_check(results, "changelog_and_versioning",
                "technical_documentation_doc_set_versioned_with_product",
                manifest, ("versioning", "doc_set_versioned_with_product"),
                "versioning: the documentation set is versioned with the product it documents")
    version_match_present = has_product_version and has_doc_set_version
    _check(results, "changelog_and_versioning",
           "technical_documentation_doc_set_version_matches_product_version",
           doc_set_version, version_match_present,
           version_match_present and doc_set_version == product_version,
           "versioning: the declared doc-set version equals the declared product version exactly")

    # ---- Section 8: red_lines ----
    _false_check(results, "red_lines",
                 "technical_documentation_free_of_private_contact_or_financial_data_in_docs",
                 manifest,
                 ("red_lines",
                  "private_contact_or_financial_data_published_in_docs_present"),
                 "red line: no private, contact or financial data published in the docs is present in the record")
    _false_check(results, "red_lines",
                 "technical_documentation_free_of_silent_todo_document",
                 manifest,
                 ("red_lines", "silent_todo_document_present"),
                 "red line: no silent TODO-to-document is present in the record — every such item is tracked or finished")

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
        verdict = "TECHNICAL_DOCUMENTATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TECHNICAL_DOCUMENTATION_SOUND"

    computed_names = (
        "technical_documentation_doc_set_list_declared",
        "every_technical_documentation_doc_id_unique",
        "every_technical_documentation_doc_kind_recognised",
        "every_technical_documentation_doc_source_location_declared",
        "every_technical_documentation_doc_source_of_truth_declared",
        "technical_documentation_config_options_list_declared",
        "every_technical_documentation_config_option_id_unique",
        "every_technical_documentation_config_option_default_declared",
        "every_technical_documentation_config_option_documented",
        "technical_documentation_endpoints_list_declared",
        "every_technical_documentation_endpoint_id_unique",
        "every_technical_documentation_endpoint_working_example_declared",
        "every_technical_documentation_endpoint_example_verified_against_contract",
        "every_technical_documentation_endpoint_documented_in_declared_doc",
        "technical_documentation_decision_records_list_declared",
        "every_technical_documentation_decision_record_id_unique",
        "every_technical_documentation_decision_record_cross_linked_from_code",
        "every_technical_documentation_decision_record_documented_in_declared_doc",
        "technical_documentation_doc_set_version_matches_product_version",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "technical-documentation-pack",
        "atom_version": "0.1.0",
        "product_name": manifest.get("product_name"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "documentation_set_docs_count": docs_count,
        "documentation_config_options_count": options_count,
        "documentation_endpoints_count": endpoints_count,
        "documentation_decision_records_count": adrs_count,
        "duplicate_technical_documentation_doc_ids": duplicate_doc_ids,
        "duplicate_technical_documentation_config_option_ids": duplicate_option_ids,
        "duplicate_technical_documentation_endpoint_ids": duplicate_endpoint_ids,
        "duplicate_technical_documentation_decision_record_ids": duplicate_adr_ids,
        "technical_documentation_docs_with_invalid_kind": docs_with_invalid_kind,
        "technical_documentation_docs_without_source_location": docs_without_location,
        "technical_documentation_docs_without_source_of_truth": docs_without_truth,
        "technical_documentation_config_options_without_default": options_without_default,
        "technical_documentation_config_options_not_documented": options_not_documented,
        "technical_documentation_endpoints_without_working_example": endpoints_without_example,
        "technical_documentation_endpoints_with_unverified_example": endpoints_with_unverified_example,
        "technical_documentation_endpoints_with_unknown_doc_reference": endpoints_with_unknown_doc,
        "technical_documentation_decision_records_not_cross_linked": adrs_not_cross_linked,
        "technical_documentation_decision_records_with_unknown_doc_reference": adrs_with_unknown_doc,
        "doc_source_of_truth_ratio": _fmt6(doc_truth_ratio),
        "config_option_documentation_ratio": _fmt6(option_documentation_ratio),
        "endpoint_worked_example_ratio": _fmt6(endpoint_example_ratio),
        "decision_record_cross_link_ratio": _fmt6(adr_cross_link_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "TECHNICAL DOCUMENTATION PACK",
        f"product_name: {verdict.get('product_name')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: technical_documentation_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TECHNICAL_DOCUMENTATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
