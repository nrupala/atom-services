// Technical documentation pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/technical-documentation-pack/src/technical_documentation_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product_name: "string",
  product_version: "string",
  readme: {
    what_it_is_one_paragraph_declared: "boolean",
    quickstart_present: "boolean",
    quickstart_copy_paste_ready: "boolean",
    usage_present: "boolean",
    operations_present: "boolean",
    troubleshooting_present: "boolean",
    where_to_change_things_present: "boolean",
  },
  documents: [{
    doc_id: "string",
    doc_kind: "string",
    source_location: "string",
    source_of_truth: "string",
  }],
  source_of_truth: {
    docs_live_with_source_they_describe: "boolean",
    no_wiki_only_oracle_docs: "boolean",
  },
  config_options: [{
    option_id: "string",
    default_value: "string",
    documented: "boolean",
  }],
  api_docs: {
    generated_from_or_verified_against_contracts: "boolean",
  },
  endpoints: [{
    endpoint_id: "string",
    documented_in_doc_id: "string",
    has_working_example: "boolean",
    example_verified_against_contract: "boolean",
  }],
  decision_work: {
    adrs_cross_linked_from_code_where_surprising: "boolean",
  },
  decision_records: [{
    adr_id: "string",
    documented_in_doc_id: "string",
    cross_linked_from_code: "boolean",
  }],
  review_verification: {
    docs_reviewed_like_code: "boolean",
    docs_updated_in_same_change_as_behavior_changes: "boolean",
    quickstart_run_from_clean_environment: "boolean",
    quickstart_works_verbatim_from_clean_state: "boolean",
    worked_examples_tested: "boolean",
    screenshots_or_commands_present: "boolean",
    screenshots_and_commands_verified_current: "boolean",
  },
  plain_language: {
    short_sentences_used: "boolean",
    jargon_defined_on_first_use: "boolean",
    steps_presented_as_lists: "boolean",
    examples_preferred_over_adjectives: "boolean",
  },
  changelog: {
    kept_continuously: "boolean",
    not_retrofitted_at_release_time: "boolean",
    entry_for_current_version_present: "boolean",
  },
  versioning: {
    doc_set_version: "string",
    doc_set_versioned_with_product: "boolean",
  },
  red_lines: {
    private_contact_or_financial_data_published_in_docs_present: "boolean",
    silent_todo_document_present: "boolean",
  },
};

export const SECTIONS = [
  "readme_and_doc_set_structure",
  "docs_as_code_and_source_of_truth",
  "api_docs_and_worked_examples",
  "decision_records_and_cross_links",
  "review_verification_and_testing",
  "plain_language_and_examples",
  "changelog_and_versioning",
  "red_lines",
] as const;

const DOC_KINDS = ["readme", "runbook", "api_doc", "decision_record",
  "changelog", "reference", "how_to", "conceptual"];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  product_name: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  documentation_set_docs_count: number | null;
  documentation_config_options_count: number | null;
  documentation_endpoints_count: number | null;
  documentation_decision_records_count: number | null;
  duplicate_technical_documentation_doc_ids: string[] | null;
  duplicate_technical_documentation_config_option_ids: string[] | null;
  duplicate_technical_documentation_endpoint_ids: string[] | null;
  duplicate_technical_documentation_decision_record_ids: string[] | null;
  technical_documentation_docs_with_invalid_kind: string[] | null;
  technical_documentation_docs_without_source_location: string[] | null;
  technical_documentation_docs_without_source_of_truth: string[] | null;
  technical_documentation_config_options_without_default: string[] | null;
  technical_documentation_config_options_not_documented: string[] | null;
  technical_documentation_endpoints_without_working_example: string[] | null;
  technical_documentation_endpoints_with_unverified_example: string[] | null;
  technical_documentation_endpoints_with_unknown_doc_reference: string[] | null;
  technical_documentation_decision_records_not_cross_linked: string[] | null;
  technical_documentation_decision_records_with_unknown_doc_reference: string[] | null;
  doc_source_of_truth_ratio: string | null;
  config_option_documentation_ratio: string | null;
  endpoint_worked_example_ratio: string | null;
  decision_record_cross_link_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [docsRaw, hasDocs] = getPath(manifest, "documents");
  const docsIsList = hasDocs && Array.isArray(docsRaw);
  const docRows: unknown[] = docsIsList ? (docsRaw as unknown[]) : [];
  const docsCount: number | null = docsIsList ? docRows.length : null;
  const docIds = idsOf(docRows, "doc_id");

  const [optionsRaw, hasOptions] = getPath(manifest, "config_options");
  const optionsIsList = hasOptions && Array.isArray(optionsRaw);
  const optionRows: unknown[] = optionsIsList ? (optionsRaw as unknown[]) : [];
  const optionsCount: number | null = optionsIsList ? optionRows.length : null;

  const [endpointsRaw, hasEndpoints] = getPath(manifest, "endpoints");
  const endpointsIsList = hasEndpoints && Array.isArray(endpointsRaw);
  const endpointRows: unknown[] = endpointsIsList ? (endpointsRaw as unknown[]) : [];
  const endpointsCount: number | null = endpointsIsList ? endpointRows.length : null;

  const [adrsRaw, hasAdrs] = getPath(manifest, "decision_records");
  const adrsIsList = hasAdrs && Array.isArray(adrsRaw);
  const adrRows: unknown[] = adrsIsList ? (adrsRaw as unknown[]) : [];
  const adrsCount: number | null = adrsIsList ? adrRows.length : null;

  const duplicateDocIds: string[] | null = docsIsList
    ? duplicates(docRows, "doc_id") : null;
  const duplicateOptionIds: string[] | null = optionsIsList
    ? duplicates(optionRows, "option_id") : null;
  const duplicateEndpointIds: string[] | null = endpointsIsList
    ? duplicates(endpointRows, "endpoint_id") : null;
  const duplicateAdrIds: string[] | null = adrsIsList
    ? duplicates(adrRows, "adr_id") : null;

  const docsWithInvalidKind: string[] | null = docsIsList
    ? docRows.filter((c) => hasField(c, "doc_kind") &&
        !DOC_KINDS.includes((c as Record<string, unknown>)["doc_kind"] as string))
        .map((c) => rowName(c, "doc_id"))
    : null;
  const docsWithoutLocation: string[] | null = docsIsList
    ? docRows.filter((c) => hasField(c, "source_location") &&
        !nonemptyStr((c as Record<string, unknown>)["source_location"]))
        .map((c) => rowName(c, "doc_id"))
    : null;
  const docsWithoutTruth: string[] | null = docsIsList
    ? docRows.filter((c) => hasField(c, "source_of_truth") &&
        !nonemptyStr((c as Record<string, unknown>)["source_of_truth"]))
        .map((c) => rowName(c, "doc_id"))
    : null;
  const optionsWithoutDefault: string[] | null = optionsIsList
    ? optionRows.filter((c) => hasField(c, "default_value") &&
        !nonemptyStr((c as Record<string, unknown>)["default_value"]))
        .map((c) => rowName(c, "option_id"))
    : null;
  const optionsNotDocumented: string[] | null = optionsIsList
    ? optionRows.filter((c) => hasField(c, "documented") &&
        (c as Record<string, unknown>)["documented"] !== true)
        .map((c) => rowName(c, "option_id"))
    : null;
  const endpointsWithoutExample: string[] | null = endpointsIsList
    ? endpointRows.filter((c) => hasField(c, "has_working_example") &&
        (c as Record<string, unknown>)["has_working_example"] !== true)
        .map((c) => rowName(c, "endpoint_id"))
    : null;
  const endpointsWithUnverifiedExample: string[] | null = endpointsIsList
    ? endpointRows.filter((c) => hasField(c, "example_verified_against_contract") &&
        (c as Record<string, unknown>)["example_verified_against_contract"] !== true)
        .map((c) => rowName(c, "endpoint_id"))
    : null;
  const endpointsWithUnknownDoc: string[] | null = endpointsIsList && docsIsList
    ? endpointRows.filter((c) => hasField(c, "documented_in_doc_id") &&
        !docIds.includes((c as Record<string, unknown>)["documented_in_doc_id"] as string))
        .map((c) => rowName(c, "endpoint_id"))
    : null;
  const adrsNotCrossLinked: string[] | null = adrsIsList
    ? adrRows.filter((c) => hasField(c, "cross_linked_from_code") &&
        (c as Record<string, unknown>)["cross_linked_from_code"] !== true)
        .map((c) => rowName(c, "adr_id"))
    : null;
  const adrsWithUnknownDoc: string[] | null = adrsIsList && docsIsList
    ? adrRows.filter((c) => hasField(c, "documented_in_doc_id") &&
        !docIds.includes((c as Record<string, unknown>)["documented_in_doc_id"] as string))
        .map((c) => rowName(c, "adr_id"))
    : null;

  const docTruthRatio: number | null =
    docsIsList && docsCount !== null && docsCount > 0
      ? docRows.filter((c) => isPyDict(c) && nonemptyStr(c["source_of_truth"])).length / docsCount
      : null;
  const optionDocumentationRatio: number | null =
    optionsIsList && optionsCount !== null && optionsCount > 0
      ? optionRows.filter((c) => isPyDict(c) && nonemptyStr(c["default_value"]) && c["documented"] === true).length / optionsCount
      : null;
  const endpointExampleRatio: number | null =
    endpointsIsList && endpointsCount !== null && endpointsCount > 0
      ? endpointRows.filter((c) => isPyDict(c) && c["has_working_example"] === true && c["example_verified_against_contract"] === true).length / endpointsCount
      : null;
  const adrCrossLinkRatio: number | null =
    adrsIsList && adrsCount !== null && adrsCount > 0
      ? adrRows.filter((c) => isPyDict(c) && c["cross_linked_from_code"] === true).length / adrsCount
      : null;

  const [productVersion, hasProductVersion] = getPath(manifest, "product_version");
  const [docSetVersion, hasDocSetVersion] = getPath(manifest, "versioning", "doc_set_version");

  // ---- Section 1: readme_and_doc_set_structure ----
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_states_what_it_is_in_one_paragraph", manifest,
    ["readme", "what_it_is_one_paragraph_declared"],
    "README skeleton: the README states what the documented thing is in one paragraph");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_quickstart_present", manifest,
    ["readme", "quickstart_present"],
    "README skeleton: the README carries a quickstart");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_quickstart_copy_paste_ready", manifest,
    ["readme", "quickstart_copy_paste_ready"],
    "README skeleton: the quickstart is copy-paste ready");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_usage_present", manifest,
    ["readme", "usage_present"],
    "README skeleton: the README carries a usage section");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_operations_present", manifest,
    ["readme", "operations_present"],
    "README skeleton: the README carries an operations section (env vars, ports, defaults)");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_troubleshooting_present", manifest,
    ["readme", "troubleshooting_present"],
    "README skeleton: the README carries a troubleshooting section");
  boolCheck(results, "readme_and_doc_set_structure",
    "technical_documentation_readme_where_to_change_things_present", manifest,
    ["readme", "where_to_change_things_present"],
    "README skeleton: the README states where to change things");
  check(results, "readme_and_doc_set_structure",
    "technical_documentation_doc_set_list_declared", docsRaw, docsIsList,
    docsIsList && docsCount !== null && docsCount > 0,
    "doc set: the declared record names its documentation rows — the list is present and names at least one document; an absent list is missing evidence and an empty list declares no documentation set at all");
  const docIdPresent = docsIsList && docRows.every((c) => hasField(c, "doc_id"));
  check(results, "readme_and_doc_set_structure",
    "every_technical_documentation_doc_id_unique", docsRaw, docIdPresent,
    docsIsList && duplicateDocIds !== null && duplicateDocIds.length === 0,
    "doc set: no declared doc_id is owned by more than one row");
  const kindPresent = docsIsList && docRows.every((c) => hasField(c, "doc_kind"));
  check(results, "readme_and_doc_set_structure",
    "every_technical_documentation_doc_kind_recognised", docsRaw, kindPresent,
    docsIsList && docRows.every((c) => isPyDict(c) && DOC_KINDS.includes(c["doc_kind"] as string)),
    "doc set: every declared document's kind is one of readme, runbook, api_doc, decision_record, changelog, reference, how_to, conceptual — the skill's named artifacts plus the reference / how-to / conceptual groupings for guide and reference material");
  const locationPresent = docsIsList && docRows.every((c) => hasField(c, "source_location"));
  check(results, "readme_and_doc_set_structure",
    "every_technical_documentation_doc_source_location_declared", docsRaw, locationPresent,
    docsIsList && docRows.every((c) => isPyDict(c) && nonemptyStr(c["source_location"])),
    "docs-as-code: every declared document declares a non-empty source location — where it lives with the source it describes");

  // ---- Section 2: docs_as_code_and_source_of_truth ----
  boolCheck(results, "docs_as_code_and_source_of_truth",
    "technical_documentation_docs_live_with_source_they_describe", manifest,
    ["source_of_truth", "docs_live_with_source_they_describe"],
    "docs-as-code: the docs live with the source they describe");
  boolCheck(results, "docs_as_code_and_source_of_truth",
    "technical_documentation_no_wiki_only_oracle_docs", manifest,
    ["source_of_truth", "no_wiki_only_oracle_docs"],
    "docs-as-code: no wiki-only oracle documents — no document exists only outside the source it describes");
  const truthPresent = docsIsList && docRows.every((c) => hasField(c, "source_of_truth"));
  check(results, "docs_as_code_and_source_of_truth",
    "every_technical_documentation_doc_source_of_truth_declared", docsRaw, truthPresent,
    docsIsList && docRows.every((c) => isPyDict(c) && nonemptyStr(c["source_of_truth"])),
    "source of truth: every declared document declares a non-empty source of truth — the contract, source or record it is generated from or verified against");
  check(results, "docs_as_code_and_source_of_truth",
    "technical_documentation_config_options_list_declared", optionsRaw, optionsIsList,
    optionsIsList && optionsCount !== null && optionsCount > 0,
    "config options: the declared record names its config-option rows — the list is present and names at least one option; an absent list is missing evidence and an empty list declares no documented config at all");
  const optionIdPresent = optionsIsList && optionRows.every((c) => hasField(c, "option_id"));
  check(results, "docs_as_code_and_source_of_truth",
    "every_technical_documentation_config_option_id_unique", optionsRaw, optionIdPresent,
    optionsIsList && duplicateOptionIds !== null && duplicateOptionIds.length === 0,
    "config options: no declared option_id is owned by more than one row");
  const defaultPresent = optionsIsList && optionRows.every((c) => hasField(c, "default_value"));
  check(results, "docs_as_code_and_source_of_truth",
    "every_technical_documentation_config_option_default_declared", optionsRaw, defaultPresent,
    optionsIsList && optionRows.every((c) => isPyDict(c) && nonemptyStr(c["default_value"])),
    "config options / quality gate: every declared config option declares a non-empty default value");
  const documentedPresent = optionsIsList && optionRows.every((c) => hasField(c, "documented"));
  check(results, "docs_as_code_and_source_of_truth",
    "every_technical_documentation_config_option_documented", optionsRaw, documentedPresent,
    optionsIsList && optionRows.every((c) => isPyDict(c) && c["documented"] === true),
    "config options / quality gate: every declared config option is declared documented with its default");

  // ---- Section 3: api_docs_and_worked_examples ----
  boolCheck(results, "api_docs_and_worked_examples",
    "technical_documentation_api_docs_generated_from_or_verified_against_contracts", manifest,
    ["api_docs", "generated_from_or_verified_against_contracts"],
    "API docs: the API docs are generated from, or verified against, the contracts");
  check(results, "api_docs_and_worked_examples",
    "technical_documentation_endpoints_list_declared", endpointsRaw, endpointsIsList,
    endpointsIsList && endpointsCount !== null && endpointsCount > 0,
    "endpoints: the declared record names its endpoint rows — the list is present and names at least one endpoint; an absent list is missing evidence and an empty list declares no documented endpoints at all");
  const endpointIdPresent = endpointsIsList && endpointRows.every((c) => hasField(c, "endpoint_id"));
  check(results, "api_docs_and_worked_examples",
    "every_technical_documentation_endpoint_id_unique", endpointsRaw, endpointIdPresent,
    endpointsIsList && duplicateEndpointIds !== null && duplicateEndpointIds.length === 0,
    "endpoints: no declared endpoint_id is owned by more than one row");
  const examplePresent = endpointsIsList && endpointRows.every((c) => hasField(c, "has_working_example"));
  check(results, "api_docs_and_worked_examples",
    "every_technical_documentation_endpoint_working_example_declared", endpointsRaw, examplePresent,
    endpointsIsList && endpointRows.every((c) => isPyDict(c) && c["has_working_example"] === true),
    "API docs: every declared endpoint declares one working example");
  const verifiedPresent = endpointsIsList && endpointRows.every((c) => hasField(c, "example_verified_against_contract"));
  check(results, "api_docs_and_worked_examples",
    "every_technical_documentation_endpoint_example_verified_against_contract", endpointsRaw, verifiedPresent,
    endpointsIsList && endpointRows.every((c) => isPyDict(c) && c["example_verified_against_contract"] === true),
    "API docs: every declared endpoint's working example is declared verified against the contract");
  const endpointDocPresent = endpointsIsList && docsIsList &&
    endpointRows.every((c) => hasField(c, "documented_in_doc_id"));
  check(results, "api_docs_and_worked_examples",
    "every_technical_documentation_endpoint_documented_in_declared_doc", endpointsRaw, endpointDocPresent,
    endpointsIsList && docsIsList &&
      endpointRows.every((c) => hasField(c, "documented_in_doc_id") &&
        docIds.includes((c as Record<string, unknown>)["documented_in_doc_id"] as string)),
    "endpoints: every declared endpoint's documented_in_doc_id names one of the declared documentation rows");

  // ---- Section 4: decision_records_and_cross_links ----
  boolCheck(results, "decision_records_and_cross_links",
    "technical_documentation_adrs_cross_linked_from_code_where_surprising", manifest,
    ["decision_work", "adrs_cross_linked_from_code_where_surprising"],
    "decision records: ADRs are cross-linked from code where behaviour is surprising");
  check(results, "decision_records_and_cross_links",
    "technical_documentation_decision_records_list_declared", adrsRaw, adrsIsList,
    adrsIsList && adrsCount !== null && adrsCount > 0,
    "decision records: the declared record names its decision-record rows — the list is present and names at least one record; an absent list is missing evidence and an empty list declares no decision records at all");
  const adrIdPresent = adrsIsList && adrRows.every((c) => hasField(c, "adr_id"));
  check(results, "decision_records_and_cross_links",
    "every_technical_documentation_decision_record_id_unique", adrsRaw, adrIdPresent,
    adrsIsList && duplicateAdrIds !== null && duplicateAdrIds.length === 0,
    "decision records: no declared adr_id is owned by more than one row");
  const crossPresent = adrsIsList && adrRows.every((c) => hasField(c, "cross_linked_from_code"));
  check(results, "decision_records_and_cross_links",
    "every_technical_documentation_decision_record_cross_linked_from_code", adrsRaw, crossPresent,
    adrsIsList && adrRows.every((c) => isPyDict(c) && c["cross_linked_from_code"] === true),
    "decision records: every declared decision record is declared cross-linked from the code it explains");
  const adrDocPresent = adrsIsList && docsIsList &&
    adrRows.every((c) => hasField(c, "documented_in_doc_id"));
  check(results, "decision_records_and_cross_links",
    "every_technical_documentation_decision_record_documented_in_declared_doc", adrsRaw, adrDocPresent,
    adrsIsList && docsIsList &&
      adrRows.every((c) => hasField(c, "documented_in_doc_id") &&
        docIds.includes((c as Record<string, unknown>)["documented_in_doc_id"] as string)),
    "decision records: every declared decision record's documented_in_doc_id names one of the declared documentation rows");

  // ---- Section 5: review_verification_and_testing ----
  boolCheck(results, "review_verification_and_testing",
    "technical_documentation_docs_reviewed_like_code", manifest,
    ["review_verification", "docs_reviewed_like_code"],
    "docs-as-code / review: the docs are reviewed like code");
  boolCheck(results, "review_verification_and_testing",
    "technical_documentation_docs_updated_in_same_change_as_behavior", manifest,
    ["review_verification", "docs_updated_in_same_change_as_behavior_changes"],
    "quality gate: docs are updated in the same change as behaviour changes");
  boolCheck(results, "review_verification_and_testing",
    "technical_documentation_quickstart_run_from_clean_environment", manifest,
    ["review_verification", "quickstart_run_from_clean_environment"],
    "test the docs: the quickstart was run from a clean environment");
  boolCheck(results, "review_verification_and_testing",
    "technical_documentation_quickstart_works_verbatim_from_clean_state", manifest,
    ["review_verification", "quickstart_works_verbatim_from_clean_state"],
    "quality gate: the quickstart works verbatim from a clean state");
  boolCheck(results, "review_verification_and_testing",
    "technical_documentation_worked_examples_tested", manifest,
    ["review_verification", "worked_examples_tested"],
    "test the docs: the worked examples in the documentation were tested");
  gatedBoolCheck(results, "review_verification_and_testing",
    "technical_documentation_screenshots_and_commands_current_where_present", manifest,
    ["review_verification", "screenshots_or_commands_present"],
    ["review_verification", "screenshots_and_commands_verified_current"],
    "quality gate: no stale screenshots or commands — every screenshot or command present is verified current",
    "no screenshots or commands declared present");

  // ---- Section 6: plain_language_and_examples ----
  boolCheck(results, "plain_language_and_examples",
    "technical_documentation_plain_language_short_sentences_used", manifest,
    ["plain_language", "short_sentences_used"],
    "plain language: the documentation uses short sentences");
  boolCheck(results, "plain_language_and_examples",
    "technical_documentation_jargon_defined_on_first_use", manifest,
    ["plain_language", "jargon_defined_on_first_use"],
    "plain language: jargon is defined on first use");
  boolCheck(results, "plain_language_and_examples",
    "technical_documentation_steps_presented_as_lists", manifest,
    ["plain_language", "steps_presented_as_lists"],
    "plain language: steps are presented as lists");
  boolCheck(results, "plain_language_and_examples",
    "technical_documentation_examples_preferred_over_adjectives", manifest,
    ["plain_language", "examples_preferred_over_adjectives"],
    "plain language: examples are preferred over adjectives");

  // ---- Section 7: changelog_and_versioning ----
  boolCheck(results, "changelog_and_versioning",
    "technical_documentation_changelog_kept_continuously", manifest,
    ["changelog", "kept_continuously"],
    "changelog: the changelog is kept continuously");
  boolCheck(results, "changelog_and_versioning",
    "technical_documentation_changelog_not_retrofitted_at_release_time", manifest,
    ["changelog", "not_retrofitted_at_release_time"],
    "changelog: the changelog is never retro-fitted at release time");
  boolCheck(results, "changelog_and_versioning",
    "technical_documentation_changelog_entry_for_current_version_present", manifest,
    ["changelog", "entry_for_current_version_present"],
    "changelog: a changelog entry for the current version is present");
  boolCheck(results, "changelog_and_versioning",
    "technical_documentation_doc_set_versioned_with_product", manifest,
    ["versioning", "doc_set_versioned_with_product"],
    "versioning: the documentation set is versioned with the product it documents");
  const versionMatchPresent = hasProductVersion && hasDocSetVersion;
  check(results, "changelog_and_versioning",
    "technical_documentation_doc_set_version_matches_product_version", docSetVersion,
    versionMatchPresent,
    versionMatchPresent && docSetVersion === productVersion,
    "versioning: the declared doc-set version equals the declared product version exactly");

  // ---- Section 8: red_lines ----
  falseCheck(results, "red_lines",
    "technical_documentation_free_of_private_contact_or_financial_data_in_docs", manifest,
    ["red_lines", "private_contact_or_financial_data_published_in_docs_present"],
    "red line: no private, contact or financial data published in the docs is present in the record");
  falseCheck(results, "red_lines",
    "technical_documentation_free_of_silent_todo_document", manifest,
    ["red_lines", "silent_todo_document_present"],
    "red line: no silent TODO-to-document is present in the record — every such item is tracked or finished");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "TECHNICAL_DOCUMENTATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TECHNICAL_DOCUMENTATION_SOUND";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "technical-documentation-pack",
    atom_version: "0.1.0",
    product_name: manifest["product_name"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    documentation_set_docs_count: docsCount,
    documentation_config_options_count: optionsCount,
    documentation_endpoints_count: endpointsCount,
    documentation_decision_records_count: adrsCount,
    duplicate_technical_documentation_doc_ids: duplicateDocIds,
    duplicate_technical_documentation_config_option_ids: duplicateOptionIds,
    duplicate_technical_documentation_endpoint_ids: duplicateEndpointIds,
    duplicate_technical_documentation_decision_record_ids: duplicateAdrIds,
    technical_documentation_docs_with_invalid_kind: docsWithInvalidKind,
    technical_documentation_docs_without_source_location: docsWithoutLocation,
    technical_documentation_docs_without_source_of_truth: docsWithoutTruth,
    technical_documentation_config_options_without_default: optionsWithoutDefault,
    technical_documentation_config_options_not_documented: optionsNotDocumented,
    technical_documentation_endpoints_without_working_example: endpointsWithoutExample,
    technical_documentation_endpoints_with_unverified_example: endpointsWithUnverifiedExample,
    technical_documentation_endpoints_with_unknown_doc_reference: endpointsWithUnknownDoc,
    technical_documentation_decision_records_not_cross_linked: adrsNotCrossLinked,
    technical_documentation_decision_records_with_unknown_doc_reference: adrsWithUnknownDoc,
    doc_source_of_truth_ratio: fmt6(docTruthRatio),
    config_option_documentation_ratio: fmt6(optionDocumentationRatio),
    endpoint_worked_example_ratio: fmt6(endpointExampleRatio),
    decision_record_cross_link_ratio: fmt6(adrCrossLinkRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "TECHNICAL DOCUMENTATION PACK",
    `product_name: ${pyStr(verdict.product_name ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
