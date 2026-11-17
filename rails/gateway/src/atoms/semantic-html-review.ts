// Semantic HTML review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/semantic-html-review/src/semantic_html_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  page: "string",
  landmarks: {
    header_landmark_present: "boolean",
    nav_landmark_present: "boolean",
    main_landmark_present: "boolean",
    footer_landmark_present: "boolean",
    exactly_one_main_landmark_declared: "boolean",
  },
  headings: [{
    level: "number",
    label: "string",
  }],
  semantic_elements: {
    nav_element_carries_navigation: "boolean",
    main_element_carries_primary_content: "boolean",
    article_element_for_self_contained_content: "boolean",
    section_elements_have_real_meaning: "boolean",
    figure_elements_have_figcaptions: "boolean",
    time_elements_for_dates_and_times: "boolean",
    generic_divs_used_only_when_no_semantic_element_fits: "boolean",
  },
  controls: {
    button_elements_for_actions: "boolean",
    anchor_elements_for_navigation: "boolean",
    fieldset_legend_group_related_inputs: "boolean",
    keyboard_only_traversal_passed_for_all_interactive_elements: "boolean",
  },
  form_inputs: [{
    input_ref: "string",
    label_bound: "boolean",
  }],
  media: {
    captions_present_for_media_elements: "boolean",
  },
  images: [{
    image_ref: "string",
    decorative: "boolean",
    alt_text: "string",
  }],
  data_tables: [{
    table_ref: "string",
    thead_present: "boolean",
    th_scope_present: "boolean",
    caption_present: "boolean",
  }],
  document_head: {
    html_lang_attribute_set: "boolean",
    viewport_meta_declared: "boolean",
    charset_meta_first_in_head: "boolean",
    page_title_descriptive: "boolean",
  },
  aria_practice: {
    native_semantics_preferred_before_aria: "boolean",
    aria_used_only_for_real_gaps: "boolean",
    aria_not_used_to_simulate_controls: "boolean",
  },
  validation: {
    w3c_validator_reports_clean: "boolean",
    htmlhint_reports_clean: "boolean",
    invalid_nesting_absent_from_markup: "boolean",
  },
  red_lines: {
    div_span_click_handlers_present: "boolean",
    layout_tables_present: "boolean",
    lang_or_title_missing_present: "boolean",
  },
};

export const SECTIONS = [
  "landmarks_and_heading_outline",
  "semantic_elements",
  "real_controls_and_labels",
  "text_alternatives_and_captions",
  "data_table_structure",
  "document_head_hygiene",
  "aria_practice",
  "validation_and_nesting",
  "red_lines",
] as const;

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
  page: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  headings_count: number | null;
  h1_count: number | null;
  heading_level_skip_positions: number[] | null;
  form_inputs_count: number | null;
  form_inputs_without_bound_label: string[] | null;
  duplicate_form_input_refs: string[] | null;
  labelled_input_coverage: string | null;
  images_count: number | null;
  content_images_without_meaningful_alt: string[] | null;
  decorative_images_with_nonempty_alt: string[] | null;
  duplicate_image_refs: string[] | null;
  appropriate_alt_coverage: string | null;
  data_tables_count: number | null;
  data_tables_without_thead: string[] | null;
  data_tables_without_th_scope: string[] | null;
  data_tables_without_caption: string[] | null;
  duplicate_table_refs: string[] | null;
  fully_structured_table_coverage: string | null;
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowRef(entry: unknown, field: string): string {
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
      if (seen.includes(nm) && !dups.includes(nm)) {
        dups.push(nm);
      }
      seen.push(nm);
    }
  }
  return dups;
}

function allField(rows: unknown[], field: string): boolean {
  return rows.every((c) => isPyDict(c) && c[field] === true);
}

function fieldPresent(rows: unknown[], ...fields: string[]): boolean {
  return rows.every((c) => fields.every((f) => hasField(c, f)));
}

function without(rows: unknown[], field: string, refField: string): string[] {
  return rows
    .filter((c) => hasField(c, field) &&
      (c as Record<string, unknown>)[field] !== true)
    .map((c) => rowRef(c, refField));
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [headingsRaw, hasHeadings] = getPath(manifest, "headings");
  const headingsIsList = hasHeadings && Array.isArray(headingsRaw);
  const headingRows: unknown[] = headingsIsList ? (headingsRaw as unknown[]) : [];
  const headingsCount: number | null = headingsIsList ? headingRows.length : null;
  const h1Count: number | null = headingsIsList
    ? headingRows.filter((c) => isPyDict(c) && c["level"] === 1).length
    : null;
  const headingLevelsComplete = headingsIsList &&
    fieldPresent(headingRows, "level");
  let headingLevelSkipPositions: number[] | null = null;
  if (headingsIsList) {
    headingLevelSkipPositions = [];
    for (let i = 1; i < headingRows.length; i++) {
      const prev = headingRows[i - 1];
      const cur = headingRows[i];
      if (isPyDict(prev) && isPyDict(cur) &&
          typeof prev["level"] === "number" &&
          typeof cur["level"] === "number" &&
          (cur["level"] as number) > (prev["level"] as number) + 1) {
        headingLevelSkipPositions.push(i);
      }
    }
  }

  const [inputsRaw, hasInputs] = getPath(manifest, "form_inputs");
  const inputsIsList = hasInputs && Array.isArray(inputsRaw);
  const inputRows: unknown[] = inputsIsList ? (inputsRaw as unknown[]) : [];
  const inputsCount: number | null = inputsIsList ? inputRows.length : null;
  const inputsWithoutLabel: string[] | null = inputsIsList
    ? without(inputRows, "label_bound", "input_ref")
    : null;
  const duplicateInputRefs: string[] | null = inputsIsList
    ? duplicates(inputRows, "input_ref")
    : null;
  const labelledInputCoverage: number | null =
    inputsIsList && inputsCount !== null && inputsCount > 0
      ? inputRows.filter((c) => isPyDict(c) && c["label_bound"] === true)
          .length / inputsCount
      : null;

  const [imagesRaw, hasImages] = getPath(manifest, "images");
  const imagesIsList = hasImages && Array.isArray(imagesRaw);
  const imageRows: unknown[] = imagesIsList ? (imagesRaw as unknown[]) : [];
  const imagesCount: number | null = imagesIsList ? imageRows.length : null;
  const contentImagesWithoutAlt: string[] | null = imagesIsList
    ? imageRows.filter((c) => isPyDict(c) && c["decorative"] === false &&
        hasField(c, "alt_text") && c["alt_text"] === "")
        .map((c) => rowRef(c, "image_ref"))
    : null;
  const decorativeImagesWithAlt: string[] | null = imagesIsList
    ? imageRows.filter((c) => isPyDict(c) && c["decorative"] === true &&
        hasField(c, "alt_text") && c["alt_text"] !== "")
        .map((c) => rowRef(c, "image_ref"))
    : null;
  const duplicateImageRefs: string[] | null = imagesIsList
    ? duplicates(imageRows, "image_ref")
    : null;
  const appropriateAltCoverage: number | null =
    imagesIsList && imagesCount !== null && imagesCount > 0
      ? imageRows.filter((c) => isPyDict(c) &&
          ((c["decorative"] === true && c["alt_text"] === "") ||
           (c["decorative"] === false &&
            typeof c["alt_text"] === "string" && c["alt_text"] !== "")))
          .length / imagesCount
      : null;

  const [tablesRaw, hasTables] = getPath(manifest, "data_tables");
  const tablesIsList = hasTables && Array.isArray(tablesRaw);
  const tableRows: unknown[] = tablesIsList ? (tablesRaw as unknown[]) : [];
  const tablesCount: number | null = tablesIsList ? tableRows.length : null;
  const tablesWithoutThead: string[] | null = tablesIsList
    ? without(tableRows, "thead_present", "table_ref")
    : null;
  const tablesWithoutThScope: string[] | null = tablesIsList
    ? without(tableRows, "th_scope_present", "table_ref")
    : null;
  const tablesWithoutCaption: string[] | null = tablesIsList
    ? without(tableRows, "caption_present", "table_ref")
    : null;
  const duplicateTableRefs: string[] | null = tablesIsList
    ? duplicates(tableRows, "table_ref")
    : null;
  const fullyStructuredTableCoverage: number | null =
    tablesIsList && tablesCount !== null && tablesCount > 0
      ? tableRows.filter((c) => isPyDict(c) &&
          c["thead_present"] === true &&
          c["th_scope_present"] === true &&
          c["caption_present"] === true).length / tablesCount
      : null;

  // ---- Section 1: landmarks_and_heading_outline ----
  boolCheck(results, "landmarks_and_heading_outline",
    "header_landmark_present", manifest,
    ["landmarks", "header_landmark_present"],
    "landmarks: a header landmark is present on the page");
  boolCheck(results, "landmarks_and_heading_outline",
    "nav_landmark_present", manifest,
    ["landmarks", "nav_landmark_present"],
    "landmarks: a nav landmark is present on the page");
  boolCheck(results, "landmarks_and_heading_outline",
    "main_landmark_present", manifest,
    ["landmarks", "main_landmark_present"],
    "landmarks: a main landmark is present on the page");
  boolCheck(results, "landmarks_and_heading_outline",
    "footer_landmark_present", manifest,
    ["landmarks", "footer_landmark_present"],
    "landmarks: a footer landmark is present on the page");
  boolCheck(results, "landmarks_and_heading_outline",
    "exactly_one_main_landmark_declared", manifest,
    ["landmarks", "exactly_one_main_landmark_declared"],
    "landmarks: exactly one main landmark is declared for the page");
  check(results, "landmarks_and_heading_outline",
    "heading_outline_declared", headingsRaw, headingsIsList,
    headingsIsList,
    "the declared record names its heading outline — the headings list is present, one row per heading in document order");
  check(results, "landmarks_and_heading_outline",
    "exactly_one_h1_in_declared_heading_outline", headingsRaw,
    headingLevelsComplete,
    headingsIsList && h1Count === 1,
    "heading outline: exactly one level-1 heading appears in the declared outline — one <h1> per page");
  check(results, "landmarks_and_heading_outline",
    "heading_outline_levels_never_skip_a_level", headingsRaw,
    headingLevelsComplete,
    headingsIsList && headingLevelSkipPositions !== null &&
      headingLevelSkipPositions.length === 0,
    "heading outline: no descending step in the declared outline skips a heading level — the order is logical");

  // ---- Section 2: semantic_elements ----
  boolCheck(results, "semantic_elements",
    "nav_element_carries_navigation", manifest,
    ["semantic_elements", "nav_element_carries_navigation"],
    "semantic elements: the nav element carries the page's navigation blocks");
  boolCheck(results, "semantic_elements",
    "main_element_carries_primary_content", manifest,
    ["semantic_elements", "main_element_carries_primary_content"],
    "semantic elements: the main element carries the page's primary content");
  boolCheck(results, "semantic_elements",
    "article_element_for_self_contained_content", manifest,
    ["semantic_elements", "article_element_for_self_contained_content"],
    "semantic elements: the article element is used for self-contained content");
  boolCheck(results, "semantic_elements",
    "section_elements_have_real_meaning", manifest,
    ["semantic_elements", "section_elements_have_real_meaning"],
    "semantic elements: section elements carry real meaning, not styling hooks");
  boolCheck(results, "semantic_elements",
    "figure_elements_have_figcaptions", manifest,
    ["semantic_elements", "figure_elements_have_figcaptions"],
    "semantic elements: figure elements carry figcaptions");
  boolCheck(results, "semantic_elements",
    "time_elements_for_dates_and_times", manifest,
    ["semantic_elements", "time_elements_for_dates_and_times"],
    "semantic elements: the time element is used for dates and times");
  boolCheck(results, "semantic_elements",
    "generic_divs_used_only_when_no_semantic_element_fits", manifest,
    ["semantic_elements", "generic_divs_used_only_when_no_semantic_element_fits"],
    "semantic elements: a generic div is reached for only after asking what the content is and finding no semantic element fits");

  // ---- Section 3: real_controls_and_labels ----
  boolCheck(results, "real_controls_and_labels",
    "button_elements_for_actions", manifest,
    ["controls", "button_elements_for_actions"],
    "real controls: button elements carry the page's actions");
  boolCheck(results, "real_controls_and_labels",
    "anchor_elements_for_navigation", manifest,
    ["controls", "anchor_elements_for_navigation"],
    "real controls: anchor elements carry the page's navigation");
  boolCheck(results, "real_controls_and_labels",
    "fieldset_legend_group_related_inputs", manifest,
    ["controls", "fieldset_legend_group_related_inputs"],
    "real controls: fieldset and legend group related inputs");
  boolCheck(results, "real_controls_and_labels",
    "keyboard_only_traversal_passed_for_all_interactive_elements", manifest,
    ["controls", "keyboard_only_traversal_passed_for_all_interactive_elements"],
    "real controls: a keyboard-only pass of every interactive element has been completed");
  check(results, "real_controls_and_labels",
    "form_input_inventory_declared", inputsRaw, inputsIsList,
    inputsIsList,
    "the declared record names its form inputs — the form_inputs list is present; an empty list declares that the page has no form inputs");
  const labelPresent = inputsIsList && fieldPresent(inputRows, "label_bound");
  check(results, "real_controls_and_labels",
    "every_declared_form_input_has_a_bound_label", inputsRaw,
    labelPresent,
    inputsIsList && allField(inputRows, "label_bound"),
    "form inputs: every declared form input has a label bound to it");
  const inputRefPresent = inputsIsList && fieldPresent(inputRows, "input_ref");
  check(results, "real_controls_and_labels",
    "no_declared_form_input_ref_repeated", inputsRaw,
    inputRefPresent,
    inputsIsList && duplicateInputRefs !== null &&
      duplicateInputRefs.length === 0,
    "form inputs: no declared input ref is owned by more than one row");

  // ---- Section 4: text_alternatives_and_captions ----
  boolCheck(results, "text_alternatives_and_captions",
    "captions_present_for_media_elements", manifest,
    ["media", "captions_present_for_media_elements"],
    "text alternatives: captions are provided for the page's media elements");
  check(results, "text_alternatives_and_captions",
    "image_inventory_declared", imagesRaw, imagesIsList,
    imagesIsList,
    "the declared record names its images — the images list is present; an empty list declares that the page has no images");
  const altFieldsPresent = imagesIsList &&
    fieldPresent(imageRows, "decorative", "alt_text");
  check(results, "text_alternatives_and_captions",
    "every_content_image_has_meaningful_alt_text", imagesRaw,
    altFieldsPresent,
    imagesIsList &&
      imageRows.every((c) => isPyDict(c) &&
        (c["decorative"] === true ||
         (typeof c["alt_text"] === "string" && c["alt_text"] !== ""))),
    "images: every declared content (non-decorative) image declares a non-empty alt text — the declared evidence of a meaningful alt");
  check(results, "text_alternatives_and_captions",
    "every_decorative_image_has_empty_alt_text", imagesRaw,
    altFieldsPresent,
    imagesIsList &&
      imageRows.every((c) => isPyDict(c) &&
        (c["decorative"] === false || c["alt_text"] === "")),
    "images: every declared decorative image declares an empty alt text");
  const imageRefPresent = imagesIsList && fieldPresent(imageRows, "image_ref");
  check(results, "text_alternatives_and_captions",
    "no_declared_image_ref_repeated", imagesRaw,
    imageRefPresent,
    imagesIsList && duplicateImageRefs !== null &&
      duplicateImageRefs.length === 0,
    "images: no declared image ref is owned by more than one row");

  // ---- Section 5: data_table_structure ----
  check(results, "data_table_structure",
    "data_table_inventory_declared", tablesRaw, tablesIsList,
    tablesIsList,
    "the declared record names its data tables — the data_tables list is present; an empty list declares that the page has no data tables");
  const theadPresent = tablesIsList && fieldPresent(tableRows, "thead_present");
  check(results, "data_table_structure",
    "every_data_table_declares_a_thead", tablesRaw,
    theadPresent,
    tablesIsList && allField(tableRows, "thead_present"),
    "data tables: every declared data table declares a thead");
  const scopePresent = tablesIsList &&
    fieldPresent(tableRows, "th_scope_present");
  check(results, "data_table_structure",
    "every_data_table_declares_th_scope", tablesRaw,
    scopePresent,
    tablesIsList && allField(tableRows, "th_scope_present"),
    "data tables: every declared data table declares scope on its header cells");
  const captionPresent = tablesIsList &&
    fieldPresent(tableRows, "caption_present");
  check(results, "data_table_structure",
    "every_data_table_declares_a_caption", tablesRaw,
    captionPresent,
    tablesIsList && allField(tableRows, "caption_present"),
    "data tables: every declared data table declares a caption");
  const tableRefPresent = tablesIsList && fieldPresent(tableRows, "table_ref");
  check(results, "data_table_structure",
    "no_declared_table_ref_repeated", tablesRaw,
    tableRefPresent,
    tablesIsList && duplicateTableRefs !== null &&
      duplicateTableRefs.length === 0,
    "data tables: no declared table ref is owned by more than one row");

  // ---- Section 6: document_head_hygiene ----
  boolCheck(results, "document_head_hygiene",
    "html_lang_attribute_set", manifest,
    ["document_head", "html_lang_attribute_set"],
    "document hygiene: the lang attribute is set on the html element");
  boolCheck(results, "document_head_hygiene",
    "viewport_meta_declared", manifest,
    ["document_head", "viewport_meta_declared"],
    "document hygiene: the viewport meta is declared");
  boolCheck(results, "document_head_hygiene",
    "charset_meta_first_in_head", manifest,
    ["document_head", "charset_meta_first_in_head"],
    "document hygiene: the charset declaration comes first in the head");
  boolCheck(results, "document_head_hygiene",
    "page_title_descriptive", manifest,
    ["document_head", "page_title_descriptive"],
    "document hygiene: the page title is descriptive");

  // ---- Section 7: aria_practice ----
  boolCheck(results, "aria_practice",
    "native_semantics_preferred_before_aria", manifest,
    ["aria_practice", "native_semantics_preferred_before_aria"],
    "ARIA: native semantics are used first, before any ARIA");
  boolCheck(results, "aria_practice",
    "aria_used_only_for_real_gaps", manifest,
    ["aria_practice", "aria_used_only_for_real_gaps"],
    "ARIA: ARIA is used only to fill real gaps in the native semantics");
  boolCheck(results, "aria_practice",
    "aria_not_used_to_simulate_controls", manifest,
    ["aria_practice", "aria_not_used_to_simulate_controls"],
    "ARIA: ARIA is never used to fake or simulate controls");

  // ---- Section 8: validation_and_nesting ----
  boolCheck(results, "validation_and_nesting",
    "w3c_validator_reports_clean", manifest,
    ["validation", "w3c_validator_reports_clean"],
    "validation: the W3C validator reports the markup clean");
  boolCheck(results, "validation_and_nesting",
    "htmlhint_reports_clean", manifest,
    ["validation", "htmlhint_reports_clean"],
    "validation: htmlhint reports the markup clean");
  boolCheck(results, "validation_and_nesting",
    "invalid_nesting_absent_from_markup", manifest,
    ["validation", "invalid_nesting_absent_from_markup"],
    "validation: no invalid nesting is present in the markup — no anchor inside an anchor, no block inside an inline element");

  // ---- Section 9: red_lines ----
  falseCheck(results, "red_lines",
    "no_div_or_span_click_handlers", manifest,
    ["red_lines", "div_span_click_handlers_present"],
    "red line: no div or span with a click handler is present in the record");
  falseCheck(results, "red_lines",
    "no_layout_tables_in_markup", manifest,
    ["red_lines", "layout_tables_present"],
    "red line: no layout tables are present in the record");
  falseCheck(results, "red_lines",
    "no_missing_lang_or_title", manifest,
    ["red_lines", "lang_or_title_missing_present"],
    "red line: no missing lang or title is present in the record");

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
    verdict = "SEMANTIC_HTML_REVIEW_DEFICIENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SEMANTIC_HTML_REVIEW_SOUND";
  }

  const computedNames = [
    "heading_outline_declared",
    "exactly_one_h1_in_declared_heading_outline",
    "heading_outline_levels_never_skip_a_level",
    "form_input_inventory_declared",
    "every_declared_form_input_has_a_bound_label",
    "no_declared_form_input_ref_repeated",
    "image_inventory_declared",
    "every_content_image_has_meaningful_alt_text",
    "every_decorative_image_has_empty_alt_text",
    "no_declared_image_ref_repeated",
    "data_table_inventory_declared",
    "every_data_table_declares_a_thead",
    "every_data_table_declares_th_scope",
    "every_data_table_declares_a_caption",
    "no_declared_table_ref_repeated",
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
    service: "semantic-html-review",
    atom_version: "0.1.0",
    page: manifest["page"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    headings_count: headingsCount,
    h1_count: h1Count,
    heading_level_skip_positions: headingLevelSkipPositions,
    form_inputs_count: inputsCount,
    form_inputs_without_bound_label: inputsWithoutLabel,
    duplicate_form_input_refs: duplicateInputRefs,
    labelled_input_coverage: fmt6(labelledInputCoverage),
    images_count: imagesCount,
    content_images_without_meaningful_alt: contentImagesWithoutAlt,
    decorative_images_with_nonempty_alt: decorativeImagesWithAlt,
    duplicate_image_refs: duplicateImageRefs,
    appropriate_alt_coverage: fmt6(appropriateAltCoverage),
    data_tables_count: tablesCount,
    data_tables_without_thead: tablesWithoutThead,
    data_tables_without_th_scope: tablesWithoutThScope,
    data_tables_without_caption: tablesWithoutCaption,
    duplicate_table_refs: duplicateTableRefs,
    fully_structured_table_coverage: fmt6(fullyStructuredTableCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across nine sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SEMANTIC HTML REVIEW",
    `page: ${pyStr(verdict.page ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
