# Semantic html review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are reviewing the semantic HTML of one page — its landmarks and heading outline, its semantic elements, its real controls and labels, its text alternatives and captions, its data-table structure, its document head, its ARIA practice, its validation and nesting, and its red lines — and you have a declared record of that review, made from the page's actual markup. This atom reads one declared manifest and returns one deterministic verdict across nine sections (landmarks_and_heading_outline, semantic_elements, real_controls_and_labels, text_alternatives_and_captions, data_table_structure, document_head_hygiene, aria_practice, validation_and_nesting, red_lines): **SEMANTIC_HTML_REVIEW_SOUND**, **SEMANTIC_HTML_REVIEW_DEFICIENT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 45 checks. It audits the declared semantic-HTML review record's completeness and consistency only — it fetches, parses and renders no page or HTML text itself, runs no W3C validator or htmlhint, performs no keyboard traversal, and does not verify that declared markup was ever written. A page is sound *on your declared evidence*: it never judges whether a declared alt text is actually meaningful, whether a declared heading label or page title is actually descriptive, whether the declared semantic elements are the right meaning for the content, or whether the declared validator result was ever produced. It is not an HTML parser, a validator, an accessibility audit of a live page, or a guarantee that the page is accessible or standards-conformant. The computed checks: the declared `headings` list must be present (an empty list is present evidence and fails the one-`<h1>` check); the declared outline must contain exactly one level-1 heading (one `<h1>` per page); no descending step in the outline may skip a level, with any skip positions named; the declared `form_inputs` list must be present (an empty list declares that the page has no form inputs); every form-input row must declare `label_bound` true; the declared `images` list must be present (an empty list declares that the page has no images); every content image (`decorative` false) must declare a non-empty `alt_text`; every decorative image must declare `alt_text` exactly empty; the declared `data_tables` list must be present (an empty list declares that the page has no data tables); every data-table row must declare `thead_present`, `th_scope_present` and `caption_present` true; and no declared `input_ref`, `image_ref` or `table_ref` may appear on more than one row of its list. No numeric threshold is imposed beyond the skill's one-`<h1>` rule — no maximum or minimum number of headings, sections or landmarks beyond the one `<h1>` and the one `main` landmark stated; no alt-text minimum length or word count for "meaningful" (a non-empty declared string is the bar — the wording is never judged); no maximum number of images, form inputs or data tables, and no coverage percentage any computed ratio must reach beyond every declared row satisfying its rule; no validator or htmlhint warning/error count beyond clean as declared (neither tool is run by this atom); no keyboard-traversal time, tab-stop count or focus-order metric beyond the declared keyboard-only pass; no caption coverage percentage or media-element count; no ARIA attribute or role count, and no named list of permitted ARIA roles beyond used-only-for-real-gaps as declared; no `div`/`span` usage ratio or percentage; and no title length, `lang` value list, or specific charset or viewport content string (only that each is present, first or descriptive as declared is checked). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "semantic-html-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/semantic-html-review` — tool name `semantic_html_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/semantic-html-review` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `page` | Page name (string; carried into the output, not checked) |
| `landmarks.header_landmark_present` | landmark evidence: a header landmark is present |
| `landmarks.nav_landmark_present` | landmark evidence: a nav landmark is present |
| `landmarks.main_landmark_present` | landmark evidence: a main landmark is present |
| `landmarks.footer_landmark_present` | landmark evidence: a footer landmark is present |
| `landmarks.exactly_one_main_landmark_declared` | landmark evidence: exactly one main landmark is declared |
| `headings` (list of heading-row objects) | computed: must be present (an empty list is present evidence and fails the one-`<h1>` check); reported as `headings_count` |
| `headings[].level` (number, 1–6) | computed: exactly one row must be level 1, and no descending step may skip a level |
| `headings[].label` (string) | the heading's label (carried for your own reference, not checked) |
| `semantic_elements.nav_element_carries_navigation` | semantic evidence: the nav element carries the navigation |
| `semantic_elements.main_element_carries_primary_content` | semantic evidence: the main element carries the primary content |
| `semantic_elements.article_element_for_self_contained_content` | semantic evidence: the article element is used for self-contained content |
| `semantic_elements.section_elements_have_real_meaning` | semantic evidence: section elements carry real meaning |
| `semantic_elements.figure_elements_have_figcaptions` | semantic evidence: figure elements carry figcaptions |
| `semantic_elements.time_elements_for_dates_and_times` | semantic evidence: the time element is used for dates and times |
| `semantic_elements.generic_divs_used_only_when_no_semantic_element_fits` | semantic evidence: generic divs are used only when no semantic element fits |
| `controls.button_elements_for_actions` | control evidence: button elements carry the actions |
| `controls.anchor_elements_for_navigation` | control evidence: anchor elements carry the navigation |
| `controls.fieldset_legend_group_related_inputs` | control evidence: fieldset and legend group related inputs |
| `controls.keyboard_only_traversal_passed_for_all_interactive_elements` | control evidence: a keyboard-only traversal pass succeeded for all interactive elements |
| `form_inputs` (list of form-input-row objects) | computed: must be present (an empty list declares that the page has no form inputs); reported as `form_inputs_count` |
| `form_inputs[].input_ref` (string) | names the row in the computed outputs; computed: no ref may appear on more than one row |
| `form_inputs[].label_bound` | computed: must be `true` per row (every input has a bound label) |
| `media.captions_present_for_media_elements` | media evidence: captions are present for media elements |
| `images` (list of image-row objects) | computed: must be present (an empty list declares that the page has no images); reported as `images_count` |
| `images[].image_ref` (string) | names the row in the computed outputs; computed: no ref may appear on more than one row |
| `images[].decorative` | `true` = decorative image, `false` = content image |
| `images[].alt_text` (string) | computed: must be non-empty for content images and exactly empty for decorative images |
| `data_tables` (list of data-table-row objects) | computed: must be present (an empty list declares that the page has no data tables); reported as `data_tables_count` |
| `data_tables[].table_ref` (string) | names the row in the computed outputs; computed: no ref may appear on more than one row |
| `data_tables[].thead_present` | computed: must be `true` per row |
| `data_tables[].th_scope_present` | computed: must be `true` per row |
| `data_tables[].caption_present` | computed: must be `true` per row |
| `document_head.html_lang_attribute_set` | document-head evidence: the `lang` attribute is set on the html element |
| `document_head.viewport_meta_declared` | document-head evidence: the viewport meta is declared |
| `document_head.charset_meta_first_in_head` | document-head evidence: the charset meta comes first in the head |
| `document_head.page_title_descriptive` | document-head evidence: the page title is descriptive |
| `aria_practice.native_semantics_preferred_before_aria` | ARIA evidence: native semantics are preferred before ARIA |
| `aria_practice.aria_used_only_for_real_gaps` | ARIA evidence: ARIA is used only for real gaps |
| `aria_practice.aria_not_used_to_simulate_controls` | ARIA evidence: ARIA is not used to simulate controls |
| `validation.w3c_validator_reports_clean` | validation evidence: the W3C validator reports clean |
| `validation.htmlhint_reports_clean` | validation evidence: htmlhint reports clean |
| `validation.invalid_nesting_absent_from_markup` | validation evidence: no invalid nesting is present in the markup |
| `red_lines.div_span_click_handlers_present` | must be `false` to pass (red line: no div/span click handlers) |
| `red_lines.layout_tables_present` | must be `false` to pass (red line: no layout tables) |
| `red_lines.lang_or_title_missing_present` | must be `false` to pass (red line: no missing lang or title) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward SEMANTIC_HTML_REVIEW_DEFICIENT). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/semantic-html-review`:

```json
{
  "page": "home",
  "landmarks": {
    "header_landmark_present": true,
    "nav_landmark_present": true,
    "main_landmark_present": true,
    "footer_landmark_present": true,
    "exactly_one_main_landmark_declared": true
  },
  "headings": [
    {
      "level": 1,
      "label": "Main Title"
    }
  ],
  "semantic_elements": {
    "nav_element_carries_navigation": true,
    "main_element_carries_primary_content": true,
    "article_element_for_self_contained_content": true,
    "section_elements_have_real_meaning": true,
    "figure_elements_have_figcaptions": true,
    "time_elements_for_dates_and_times": true,
    "generic_divs_used_only_when_no_semantic_element_fits": true
  },
  "controls": {
    "button_elements_for_actions": true,
    "anchor_elements_for_navigation": true,
    "fieldset_legend_group_related_inputs": true,
    "keyboard_only_traversal_passed_for_all_interactive_elements": true
  },
  "form_inputs": [
    {
      "input_ref": "email_field",
      "label_bound": true
    }
  ],
  "media": {
    "captions_present_for_media_elements": true
  },
  "images": [
    {
      "image_ref": "logo",
      "decorative": true,
      "alt_text": ""
    }
  ],
  "data_tables": [
    {
      "table_ref": "stats",
      "thead_present": true,
      "th_scope_present": true,
      "caption_present": true
    }
  ],
  "document_head": {
    "html_lang_attribute_set": true,
    "viewport_meta_declared": true,
    "charset_meta_first_in_head": true,
    "page_title_descriptive": true
  },
  "aria_practice": {
    "native_semantics_preferred_before_aria": true,
    "aria_used_only_for_real_gaps": true,
    "aria_not_used_to_simulate_controls": true
  },
  "validation": {
    "w3c_validator_reports_clean": true,
    "htmlhint_reports_clean": true,
    "invalid_nesting_absent_from_markup": true
  },
  "red_lines": {
    "div_span_click_handlers_present": false,
    "layout_tables_present": false,
    "lang_or_title_missing_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 45 checks and a text stamp of the verdict):

```json
{
  "service": "semantic-html-review",
  "atom_version": "0.1.0",
  "page": "home",
  "verdict": "SEMANTIC_HTML_REVIEW_SOUND",
  "sections": {
    "landmarks_and_heading_outline": "pass",
    "semantic_elements": "pass",
    "real_controls_and_labels": "pass",
    "text_alternatives_and_captions": "pass",
    "data_table_structure": "pass",
    "document_head_hygiene": "pass",
    "aria_practice": "pass",
    "validation_and_nesting": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "headings_count": 1,
  "h1_count": 1,
  "heading_level_skip_positions": [],
  "form_inputs_count": 1,
  "form_inputs_without_bound_label": [],
  "duplicate_form_input_refs": [],
  "labelled_input_coverage": "1.000000",
  "images_count": 1,
  "content_images_without_meaningful_alt": [],
  "decorative_images_with_nonempty_alt": [],
  "duplicate_image_refs": [],
  "appropriate_alt_coverage": "1.000000",
  "data_tables_count": 1,
  "data_tables_without_thead": [],
  "data_tables_without_th_scope": [],
  "data_tables_without_caption": [],
  "duplicate_table_refs": [],
  "fully_structured_table_coverage": "1.000000",
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across nine sections."
}
```

## Verdicts

- **SEMANTIC_HTML_REVIEW_SOUND** — every check passes; the declared semantic-HTML review record is complete and consistent with the skill's checklist and red lines.
- **SEMANTIC_HTML_REVIEW_DEFICIENT** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fifteen primary computed checks cannot be completed), the counts `headings_count`, `h1_count`, `form_inputs_count`, `images_count` and `data_tables_count` (each the declared list length as an integer, or null when the list is not declared), `heading_level_skip_positions` (the index, in the declared list, of the heading that lands after any skip), the row-name lists `form_inputs_without_bound_label`, `content_images_without_meaningful_alt`, `decorative_images_with_nonempty_alt`, `data_tables_without_thead`, `data_tables_without_th_scope` and `data_tables_without_caption` (rows whose field is present but not satisfied; a row with the field absent is missing evidence and does not appear), the duplicate-ref lists `duplicate_form_input_refs`, `duplicate_image_refs` and `duplicate_table_refs` (refs declared on more than one row, in the order their second occurrence appears), and the coverage ratios `labelled_input_coverage` (inputs with a bound label ÷ declared inputs), `appropriate_alt_coverage` (images whose declared alt matches their decorative/content kind ÷ declared images) and `fully_structured_table_coverage` (tables declaring thead, th scope and caption ÷ declared tables) — each ratio a string with exactly six decimal places, or null when its denominator list is absent or empty.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
