# Semantic HTML review — documentation

**Semantic html review** · slug `semantic-html-review` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22) · rate: null — free during trial.

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared semantic-HTML review record for completeness and consistency only: you submit one declared manifest — a review record for one page, made from the page's actual markup — and it returns one deterministic verdict across nine sections. It judges the declared review record, never a live page: it fetches, parses and renders no page or HTML text itself. Surfaces: REST `POST /v1/semantic-html-review` and MCP `POST /mcp/semantic-html-review` on https://atoms.pipavia.com.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/semantic-html-review/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `page` "home"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "semantic-html-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the semantic-HTML review manifest.** You declare a record of a semantic-HTML review for one page, made from the page's actual markup — the atom audits the declared record, it does not fetch or parse any page (see Explanation). The recorded full-pass manifest declares the page `home`: all five landmark flags `true` with exactly one main landmark declared; one heading row (level `1`, label `Main Title`); all seven semantic-element flags `true`; all four control flags `true`; one form input `email_field` with a bound label; captions declared present for media elements; one image `logo`, decorative with empty alt text; one data table `stats` declaring thead, th scope and caption; all four document-head flags `true`; all three ARIA-practice flags `true`; all three validation flags `true`; and all three red-line flags `false` (no div/span click handlers, no layout tables, no missing lang or title).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/semantic-html-review` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SEMANTIC_HTML_REVIEW_SOUND`: "45 pass, 0 fail, 0 missing of 45 checks across nine sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `headings_count` is 1, `h1_count` is 1, `heading_level_skip_positions` is `[]`, `form_inputs_count` is 1, `images_count` is 1, `data_tables_count` is 1, and `labelled_input_coverage`, `appropriate_alt_coverage` and `fully_structured_table_coverage` are each `"1.000000"`, with every row-name and duplicate list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `SEMANTIC_HTML_REVIEW_DEFICIENT` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "semantic-html-review"}`.
3. Call: `POST https://atoms.pipavia.com/v1/semantic-html-review` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/semantic-html-review` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `semantic_html_review`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `SEMANTIC_HTML_REVIEW_DEFICIENT` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `exactly_one_h1_in_declared_heading_outline`, `every_declared_form_input_has_a_bound_label`, `every_content_image_has_meaningful_alt_text`, `no_div_or_span_click_handlers`, and the summary reads "41 pass, 4 fail, 0 missing of 45 checks across nine sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `headings[0].level` is declared `2`, so the outline holds no level-1 heading, failing `exactly_one_h1_in_declared_heading_outline` with `h1_count` `0`; `form_inputs[0].label_bound` is declared `false`, failing `every_declared_form_input_has_a_bound_label`, with `form_inputs_without_bound_label` naming `["email_field"]` and `labelled_input_coverage` `"0.000000"`; `images[0].decorative` is declared `false` while its `alt_text` stays empty, failing `every_content_image_has_meaningful_alt_text`, with `content_images_without_meaningful_alt` naming `["logo"]` and `appropriate_alt_coverage` `"0.000000"`; and `red_lines.div_span_click_handlers_present` is declared `true`, failing `no_div_or_span_click_handlers`; sections `landmarks_and_heading_outline`, `real_controls_and_labels`, `text_alternatives_and_captions` and `red_lines` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "headings",
  "detail": "headings must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/semantic-html-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/semantic-html-review` — tool name `semantic_html_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `semantic_html_review` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `page` and the row ref / label / alt-text string fields are noted as strings, `headings[].level` as a number, and `headings`, `form_inputs`, `images` and `data_tables` as lists there. Where SERVICE.md states no type — the section container objects (`landmarks`, `semantic_elements`, `controls`, `media`, `document_head`, `aria_practice`, `validation`, `red_lines`) and the row objects (`headings[]`, `form_inputs[]`, `images[]`, `data_tables[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `headings`, `form_inputs`, `images` and `data_tables` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `SEMANTIC_HTML_REVIEW_DEFICIENT`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `page` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: landmarks_and_heading_outline

| Field | Type | Notes |
|---|---|---|
| `landmarks` | object | The landmarks section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `landmarks.header_landmark_present` | boolean | — |
| `landmarks.nav_landmark_present` | boolean | — |
| `landmarks.main_landmark_present` | boolean | — |
| `landmarks.footer_landmark_present` | boolean | — |
| `landmarks.exactly_one_main_landmark_declared` | boolean | — |
| `headings` | list | list of heading-row objects, one per heading in document order, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `headings[]` | object | One declared heading row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `headings[].level` | number | The heading's level, 1–6 (type stated in SERVICE.md) |
| `headings[].label` | string | Carried for the caller's own reference, not itself checked (type stated in SERVICE.md) |

#### Read by: semantic_elements

| Field | Type | Notes |
|---|---|---|
| `semantic_elements` | object | The semantic-elements section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `semantic_elements.nav_element_carries_navigation` | boolean | — |
| `semantic_elements.main_element_carries_primary_content` | boolean | — |
| `semantic_elements.article_element_for_self_contained_content` | boolean | — |
| `semantic_elements.section_elements_have_real_meaning` | boolean | — |
| `semantic_elements.figure_elements_have_figcaptions` | boolean | — |
| `semantic_elements.time_elements_for_dates_and_times` | boolean | — |
| `semantic_elements.generic_divs_used_only_when_no_semantic_element_fits` | boolean | — |

#### Read by: real_controls_and_labels

| Field | Type | Notes |
|---|---|---|
| `controls` | object | The controls section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `controls.button_elements_for_actions` | boolean | — |
| `controls.anchor_elements_for_navigation` | boolean | — |
| `controls.fieldset_legend_group_related_inputs` | boolean | — |
| `controls.keyboard_only_traversal_passed_for_all_interactive_elements` | boolean | — |
| `form_inputs` | list | list of form-input-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `form_inputs[]` | object | One declared form-input row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `form_inputs[].input_ref` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `form_inputs[].label_bound` | boolean | Must be `true` per row |

#### Read by: text_alternatives_and_captions

| Field | Type | Notes |
|---|---|---|
| `media` | object | The media section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `media.captions_present_for_media_elements` | boolean | — |
| `images` | list | list of image-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `images[]` | object | One declared image row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `images[].image_ref` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `images[].decorative` | boolean | `true` = decorative image, `false` = content image |
| `images[].alt_text` | string | The declared alt text — non-empty for content images, empty for decorative (type stated in SERVICE.md) |

#### Read by: data_table_structure

| Field | Type | Notes |
|---|---|---|
| `data_tables` | list | list of data-table-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `data_tables[]` | object | One declared data-table row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `data_tables[].table_ref` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `data_tables[].thead_present` | boolean | Must be `true` per row |
| `data_tables[].th_scope_present` | boolean | Must be `true` per row |
| `data_tables[].caption_present` | boolean | Must be `true` per row |

#### Read by: document_head_hygiene

| Field | Type | Notes |
|---|---|---|
| `document_head` | object | The document-head section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `document_head.html_lang_attribute_set` | boolean | — |
| `document_head.viewport_meta_declared` | boolean | — |
| `document_head.charset_meta_first_in_head` | boolean | — |
| `document_head.page_title_descriptive` | boolean | — |

#### Read by: aria_practice

| Field | Type | Notes |
|---|---|---|
| `aria_practice` | object | The ARIA-practice section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `aria_practice.native_semantics_preferred_before_aria` | boolean | — |
| `aria_practice.aria_used_only_for_real_gaps` | boolean | — |
| `aria_practice.aria_not_used_to_simulate_controls` | boolean | — |

#### Read by: validation_and_nesting

| Field | Type | Notes |
|---|---|---|
| `validation` | object | The validation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `validation.w3c_validator_reports_clean` | boolean | — |
| `validation.htmlhint_reports_clean` | boolean | — |
| `validation.invalid_nesting_absent_from_markup` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.div_span_click_handlers_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.layout_tables_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.lang_or_title_missing_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 45 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: landmarks_and_heading_outline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `header_landmark_present` | landmarks: a header landmark is present on the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `nav_landmark_present` | landmarks: a nav landmark is present on the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `main_landmark_present` | landmarks: a main landmark is present on the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `footer_landmark_present` | landmarks: a footer landmark is present on the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `exactly_one_main_landmark_declared` | landmarks: exactly one main landmark is declared for the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `heading_outline_declared` | the declared record names its heading outline — the headings list is present, one row per heading in document order | Computed over the declared record. Pass: the `headings` list is present (an empty list is present evidence — it passes this check and fails the one-`<h1>` check). Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `exactly_one_h1_in_declared_heading_outline` | heading outline: exactly one level-1 heading appears in the declared outline — one <h1> per page | Computed over the declared record. Pass: exactly one declared row has `level` 1 — one `<h1>` per page. Fail: the declared outline contains zero or more than one level-1 heading. Missing: the list is absent, or a row has `level` absent. |
| `heading_outline_levels_never_skip_a_level` | heading outline: no descending step in the declared outline skips a heading level — the order is logical | Computed over the declared record. Pass: no descending step in the declared outline jumps more than one level. Fail: a step skips a level (the landing positions are named in `heading_level_skip_positions`). Missing: the list is absent, or a row has `level` absent. |

#### Section: semantic_elements

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `nav_element_carries_navigation` | semantic elements: the nav element carries the page's navigation blocks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `main_element_carries_primary_content` | semantic elements: the main element carries the page's primary content | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `article_element_for_self_contained_content` | semantic elements: the article element is used for self-contained content | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `section_elements_have_real_meaning` | semantic elements: section elements carry real meaning, not styling hooks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `figure_elements_have_figcaptions` | semantic elements: figure elements carry figcaptions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `time_elements_for_dates_and_times` | semantic elements: the time element is used for dates and times | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `generic_divs_used_only_when_no_semantic_element_fits` | semantic elements: a generic div is reached for only after asking what the content is and finding no semantic element fits | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: real_controls_and_labels

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `button_elements_for_actions` | real controls: button elements carry the page's actions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `anchor_elements_for_navigation` | real controls: anchor elements carry the page's navigation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fieldset_legend_group_related_inputs` | real controls: fieldset and legend group related inputs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keyboard_only_traversal_passed_for_all_interactive_elements` | real controls: a keyboard-only pass of every interactive element has been completed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `form_input_inventory_declared` | the declared record names its form inputs — the form_inputs list is present; an empty list declares that the page has no form inputs | Computed over the declared record. Pass: the `form_inputs` list is present — an empty list passes, because it declares that the page has no form inputs. Missing: the list is absent. (SERVICE.md states no fail case for this check.) |
| `every_declared_form_input_has_a_bound_label` | form inputs: every declared form input has a label bound to it | Computed over the declared record. Pass: every declared form-input row declares `label_bound` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending rows are named in `form_inputs_without_bound_label`). Missing: the list is absent, or a row has the field absent. |
| `no_declared_form_input_ref_repeated` | form inputs: no declared input ref is owned by more than one row | Computed over the declared record. Pass: no declared `input_ref` appears on more than one row. Fail: a ref is declared on more than one row (duplicates are named in `duplicate_form_input_refs`). Missing: the list is absent, or a row has `input_ref` absent. |

#### Section: text_alternatives_and_captions

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `captions_present_for_media_elements` | text alternatives: captions are provided for the page's media elements | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `image_inventory_declared` | the declared record names its images — the images list is present; an empty list declares that the page has no images | Computed over the declared record. Pass: the `images` list is present — an empty list passes, because it declares that the page has no images. Missing: the list is absent. (SERVICE.md states no fail case for this check.) |
| `every_content_image_has_meaningful_alt_text` | images: every declared content (non-decorative) image declares a non-empty alt text — the declared evidence of a meaningful alt | Computed over the declared record. Pass: every declared image row with `decorative` `false` declares a non-empty `alt_text` — a non-empty declared string is the declared evidence of a meaningful alt; the wording is never judged. Fail: a content image declares an empty `alt_text` (offending rows are named in `content_images_without_meaningful_alt`). Missing: the list is absent, or a row has `decorative` or `alt_text` absent. |
| `every_decorative_image_has_empty_alt_text` | images: every declared decorative image declares an empty alt text | Computed over the declared record. Pass: every declared image row with `decorative` `true` declares `alt_text` exactly empty. Fail: a decorative image declares a non-empty `alt_text` (offending rows are named in `decorative_images_with_nonempty_alt`). Missing: the list is absent, or a row has `decorative` or `alt_text` absent. |
| `no_declared_image_ref_repeated` | images: no declared image ref is owned by more than one row | Computed over the declared record. Pass: no declared `image_ref` appears on more than one row. Fail: a ref is declared on more than one row (duplicates are named in `duplicate_image_refs`). Missing: the list is absent, or a row has `image_ref` absent. |

#### Section: data_table_structure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `data_table_inventory_declared` | the declared record names its data tables — the data_tables list is present; an empty list declares that the page has no data tables | Computed over the declared record. Pass: the `data_tables` list is present — an empty list passes, because it declares that the page has no data tables. Missing: the list is absent. (SERVICE.md states no fail case for this check.) |
| `every_data_table_declares_a_thead` | data tables: every declared data table declares a thead | Computed over the declared record. Pass: every declared data-table row declares `thead_present` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending rows are named in `data_tables_without_thead`). Missing: the list is absent, or a row has the field absent. |
| `every_data_table_declares_th_scope` | data tables: every declared data table declares scope on its header cells | Computed over the declared record. Pass: every declared data-table row declares `th_scope_present` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending rows are named in `data_tables_without_th_scope`). Missing: the list is absent, or a row has the field absent. |
| `every_data_table_declares_a_caption` | data tables: every declared data table declares a caption | Computed over the declared record. Pass: every declared data-table row declares `caption_present` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending rows are named in `data_tables_without_caption`). Missing: the list is absent, or a row has the field absent. |
| `no_declared_table_ref_repeated` | data tables: no declared table ref is owned by more than one row | Computed over the declared record. Pass: no declared `table_ref` appears on more than one row. Fail: a ref is declared on more than one row (duplicates are named in `duplicate_table_refs`). Missing: the list is absent, or a row has `table_ref` absent. |

#### Section: document_head_hygiene

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `html_lang_attribute_set` | document hygiene: the lang attribute is set on the html element | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `viewport_meta_declared` | document hygiene: the viewport meta is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `charset_meta_first_in_head` | document hygiene: the charset declaration comes first in the head | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `page_title_descriptive` | document hygiene: the page title is descriptive | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: aria_practice

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `native_semantics_preferred_before_aria` | ARIA: native semantics are used first, before any ARIA | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `aria_used_only_for_real_gaps` | ARIA: ARIA is used only to fill real gaps in the native semantics | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `aria_not_used_to_simulate_controls` | ARIA: ARIA is never used to fake or simulate controls | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: validation_and_nesting

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `w3c_validator_reports_clean` | validation: the W3C validator reports the markup clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `htmlhint_reports_clean` | validation: htmlhint reports the markup clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `invalid_nesting_absent_from_markup` | validation: no invalid nesting is present in the markup — no anchor inside an anchor, no block inside an inline element | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_div_or_span_click_handlers` | red line: no div or span with a click handler is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_layout_tables_in_markup` | red line: no layout tables are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_missing_lang_or_title` | red line: no missing lang or title is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"semantic-html-review"`), `atom_version` (`"0.1.0"`), and `page` (the manifest's declared page value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `headings_count`, `h1_count`, `form_inputs_count`, `images_count` and `data_tables_count` (each the declared list length as an integer, or null when the list is not declared); `heading_level_skip_positions` (the index, in the declared list, of the heading that lands after any skip); the row-name lists `form_inputs_without_bound_label`, `content_images_without_meaningful_alt`, `decorative_images_with_nonempty_alt`, `data_tables_without_thead`, `data_tables_without_th_scope` and `data_tables_without_caption` (rows whose field is present but not satisfied; a row with the field absent is missing evidence and does not appear); the duplicate-ref lists `duplicate_form_input_refs`, `duplicate_image_refs` and `duplicate_table_refs` (refs declared on more than one row, in the order their second occurrence appears) — the counts and lists in this group are null when the list they are computed from is not declared, as recorded in the sparse case; and the ratios `labelled_input_coverage` (inputs with a bound label ÷ declared inputs), `appropriate_alt_coverage` (images whose declared alt matches their decorative/content kind ÷ declared images) and `fully_structured_table_coverage` (tables declaring thead, th scope and caption ÷ declared tables) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "45 pass, 0 fail, 0 missing of 45 checks across nine sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared page value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `SEMANTIC_HTML_REVIEW_SOUND` — all 45 checks pass: the declared semantic-HTML review record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `SEMANTIC_HTML_REVIEW_DEFICIENT` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the fifteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `headings_count`, `h1_count`, `heading_level_skip_positions`, `form_inputs_count`, `form_inputs_without_bound_label`, `duplicate_form_input_refs`, `labelled_input_coverage`, `images_count`, `content_images_without_meaningful_alt`, `decorative_images_with_nonempty_alt`, `duplicate_image_refs`, `appropriate_alt_coverage`, `data_tables_count`, `data_tables_without_thead`, `data_tables_without_th_scope`, `data_tables_without_caption`, `duplicate_table_refs`, `fully_structured_table_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"headings","detail":"headings must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write semantic, accessible HTML — structure before styling, real controls, valid markup (the bound capability, from the skill). You submit one declared record — the semantic-HTML review manifest for one page, made from the page's actual markup — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 9 sections (`landmarks_and_heading_outline`, `semantic_elements`, `real_controls_and_labels`, `text_alternatives_and_captions`, `data_table_structure`, `document_head_hygiene`, `aria_practice`, `validation_and_nesting`, `red_lines`). The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and fields themselves — the declared `headings` list must be present, the declared outline must contain exactly one level-1 heading and no descending step may skip a level, the `form_inputs`, `images` and `data_tables` lists must each be present (an empty list declares that the page has none of that kind), every form-input row must declare a bound label, every content image must declare a non-empty alt text and every decorative image an exactly empty one, every data-table row must declare thead, th scope and caption, and no declared `input_ref`, `image_ref` or `table_ref` may appear on more than one row of its list — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `SEMANTIC_HTML_REVIEW_DEFICIENT`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `SEMANTIC_HTML_REVIEW_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states exactly one numeric rule — one `<h1>` per page — and it is applied exactly as stated. No other numeric threshold is stated. Declined, named: a maximum or minimum number of headings, sections or landmarks beyond the one `<h1>` and the one `main` landmark the skill and its quality gate state; an alt-text minimum length or word count for "meaningful" (a non-empty declared string is the bar — the wording is never judged); a maximum number of images, form inputs or data tables, or a coverage percentage any of the computed ratios must reach beyond every declared row satisfying its rule; a validator or htmlhint warning/error count beyond clean as declared (neither tool is run by this atom); a keyboard-traversal time, tab-stop count or focus-order metric beyond the declared keyboard-only pass; a caption coverage percentage or a media-element count; an ARIA attribute or role count, or a named list of permitted ARIA roles beyond used-only-for-real-gaps as declared; a `div`/`span` usage ratio or percentage (the skill's bar is that a semantic element was considered first, declared — not a quota); a title length, a `lang` value list, or a specific charset or viewport content string (only that each is present, first or descriptive as declared is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** semantic-HTML review record: a verdict of `SEMANTIC_HTML_REVIEW_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares one `<h1>`, a bound label on every input, and validator-clean markup passes those checks even if the real page has none of it. It is a completeness and consistency audit of the review record the skill requires, **not an HTML parser, a validator, an accessibility audit of a live page, or a guarantee that the page is accessible or standards-conformant**. Specifically: it fetches, parses and renders no page or HTML text itself, runs no W3C validator or htmlhint, performs no keyboard traversal, and does not verify that declared markup was ever written. It never judges whether a declared alt text is actually meaningful, whether a declared heading label or page title is actually descriptive, whether the declared semantic elements are the right meaning for the content, or whether the declared validator result was ever produced — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared heading, input, image and table rows are internally consistent. Declared accessibility attestations — the keyboard-only traversal pass, captions for media, ARIA practice, alt-text declarations — are judged as declarations only, never as a WCAG conformance certification. Named exclusions: no parsing of caller-supplied HTML text (structural facts about live markup — actual nesting, actual attribute presence, actual heading order in a document — are exactly what the caller declares, never independently observed); no numeric thresholds beyond the skill's one-`<h1>` rule (see the declined list above); no live verification of any declared fact; no judgment of markup *quality* — whether the chosen semantics, alt wording or heading labels are good is the caller's declaration, checked only for declared presence and consistency.

**Buyer and use context.** Teams and agents working in Engineering & code who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Content site page builds reviews (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared semantic-HTML review record; SERVICE.md's U-13 screen states outright ("No") that its output could not read as regulated professional advice — it audits a declared record for completeness and consistency against an HTML-craft skill, offering no engineering-practice, financial, medical, psychological or legal advice — and its verdict is not an accessibility certification or a legal-compliance determination. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `semantic_html_review` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/semantic_html_review.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_semantic_html_review.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/semantic-html-review` (REST) and `POST /mcp/semantic-html-review` (MCP, tool `semantic_html_review`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22). Key scope: `semantic_html_review`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** many recorded check names are not the input field names they read. In `landmarks_and_heading_outline` the computed checks `heading_outline_declared`, `exactly_one_h1_in_declared_heading_outline` and `heading_outline_levels_never_skip_a_level` read the `headings` rows rather than any single input field of the same name (the five landmark checks match the leaf names of the `landmarks.*` fields they read). In `real_controls_and_labels` the computed checks `form_input_inventory_declared`, `every_declared_form_input_has_a_bound_label` and `no_declared_form_input_ref_repeated` read the `form_inputs` rows (the four `controls.*` checks match their fields' leaf names). In `text_alternatives_and_captions` the computed checks `image_inventory_declared`, `every_content_image_has_meaningful_alt_text`, `every_decorative_image_has_empty_alt_text` and `no_declared_image_ref_repeated` read the `images` rows (`captions_present_for_media_elements` matches its `media.*` field). In `data_table_structure` all five checks are computed over the `data_tables` rows: `data_table_inventory_declared`, `every_data_table_declares_a_thead`, `every_data_table_declares_th_scope`, `every_data_table_declares_a_caption` and `no_declared_table_ref_repeated`. In `red_lines` all three recorded check names differ from their fields: `no_div_or_span_click_handlers` (input `red_lines.div_span_click_handlers_present`), `no_layout_tables_in_markup` (input `red_lines.layout_tables_present`) and `no_missing_lang_or_title` (input `red_lines.lang_or_title_missing_present`). The `semantic_elements`, `document_head_hygiene`, `aria_practice` and `validation_and_nesting` check names match the leaf names of the fields they read. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`landmarks`, `semantic_elements`, `controls`, `media`, `document_head`, `aria_practice`, `validation`, `red_lines`) or for a row object (`headings[]`, `form_inputs[]`, `images[]`, `data_tables[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 45 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the five declared list-length counts (`headings_count`, `h1_count`, `form_inputs_count`, `images_count`, `data_tables_count`) and the coverage ratios, but does not state a null rule for `heading_level_skip_positions`, for the row-name lists `form_inputs_without_bound_label`, `content_images_without_meaningful_alt`, `decorative_images_with_nonempty_alt`, `data_tables_without_thead`, `data_tables_without_th_scope` and `data_tables_without_caption`, or for the duplicate-ref lists `duplicate_form_input_refs`, `duplicate_image_refs` and `duplicate_table_refs`. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** three recorded sections each merge two input objects — `landmarks` and `headings` inputs are read by the single recorded section `landmarks_and_heading_outline`; `controls` and `form_inputs` inputs by `real_controls_and_labels`; and `media` and `images` inputs by `text_alternatives_and_captions`. The other six sections map one-to-one onto their input objects (`semantic_elements`, `data_tables`, `document_head`, `aria_practice`, `validation`, `red_lines`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named four section names — `landmarks_and_heading_outline`, `real_controls_and_labels`, `text_alternatives_and_captions` and `red_lines` — instead of exact check names (R1 ×4); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing key paths present in the full-pass manifest (R3 ×1). These are unscored design prose only; where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T10:51:01.691327+00:00 against gateway v1.1.0, external-verification battery Wave 14, source `verification/work/semantic-html-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:51:01.691327+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/semantic-html-review/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "landmarks_and_heading_outline",
      "check": "header_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a header landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "nav_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a nav landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "main_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a main landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "footer_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a footer landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "exactly_one_main_landmark_declared",
      "status": "pass",
      "evidence": "landmarks: exactly one main landmark is declared for the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "heading_outline_declared",
      "status": "pass",
      "evidence": "the declared record names its heading outline — the headings list is present, one row per heading in document order"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "exactly_one_h1_in_declared_heading_outline",
      "status": "pass",
      "evidence": "heading outline: exactly one level-1 heading appears in the declared outline — one <h1> per page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "heading_outline_levels_never_skip_a_level",
      "status": "pass",
      "evidence": "heading outline: no descending step in the declared outline skips a heading level — the order is logical"
    },
    {
      "section": "semantic_elements",
      "check": "nav_element_carries_navigation",
      "status": "pass",
      "evidence": "semantic elements: the nav element carries the page's navigation blocks"
    },
    {
      "section": "semantic_elements",
      "check": "main_element_carries_primary_content",
      "status": "pass",
      "evidence": "semantic elements: the main element carries the page's primary content"
    },
    {
      "section": "semantic_elements",
      "check": "article_element_for_self_contained_content",
      "status": "pass",
      "evidence": "semantic elements: the article element is used for self-contained content"
    },
    {
      "section": "semantic_elements",
      "check": "section_elements_have_real_meaning",
      "status": "pass",
      "evidence": "semantic elements: section elements carry real meaning, not styling hooks"
    },
    {
      "section": "semantic_elements",
      "check": "figure_elements_have_figcaptions",
      "status": "pass",
      "evidence": "semantic elements: figure elements carry figcaptions"
    },
    {
      "section": "semantic_elements",
      "check": "time_elements_for_dates_and_times",
      "status": "pass",
      "evidence": "semantic elements: the time element is used for dates and times"
    },
    {
      "section": "semantic_elements",
      "check": "generic_divs_used_only_when_no_semantic_element_fits",
      "status": "pass",
      "evidence": "semantic elements: a generic div is reached for only after asking what the content is and finding no semantic element fits"
    },
    {
      "section": "real_controls_and_labels",
      "check": "button_elements_for_actions",
      "status": "pass",
      "evidence": "real controls: button elements carry the page's actions"
    },
    {
      "section": "real_controls_and_labels",
      "check": "anchor_elements_for_navigation",
      "status": "pass",
      "evidence": "real controls: anchor elements carry the page's navigation"
    },
    {
      "section": "real_controls_and_labels",
      "check": "fieldset_legend_group_related_inputs",
      "status": "pass",
      "evidence": "real controls: fieldset and legend group related inputs"
    },
    {
      "section": "real_controls_and_labels",
      "check": "keyboard_only_traversal_passed_for_all_interactive_elements",
      "status": "pass",
      "evidence": "real controls: a keyboard-only pass of every interactive element has been completed"
    },
    {
      "section": "real_controls_and_labels",
      "check": "form_input_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its form inputs — the form_inputs list is present; an empty list declares that the page has no form inputs"
    },
    {
      "section": "real_controls_and_labels",
      "check": "every_declared_form_input_has_a_bound_label",
      "status": "pass",
      "evidence": "form inputs: every declared form input has a label bound to it"
    },
    {
      "section": "real_controls_and_labels",
      "check": "no_declared_form_input_ref_repeated",
      "status": "pass",
      "evidence": "form inputs: no declared input ref is owned by more than one row"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "captions_present_for_media_elements",
      "status": "pass",
      "evidence": "text alternatives: captions are provided for the page's media elements"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "image_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its images — the images list is present; an empty list declares that the page has no images"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "every_content_image_has_meaningful_alt_text",
      "status": "pass",
      "evidence": "images: every declared content (non-decorative) image declares a non-empty alt text — the declared evidence of a meaningful alt"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "every_decorative_image_has_empty_alt_text",
      "status": "pass",
      "evidence": "images: every declared decorative image declares an empty alt text"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "no_declared_image_ref_repeated",
      "status": "pass",
      "evidence": "images: no declared image ref is owned by more than one row"
    },
    {
      "section": "data_table_structure",
      "check": "data_table_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its data tables — the data_tables list is present; an empty list declares that the page has no data tables"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_a_thead",
      "status": "pass",
      "evidence": "data tables: every declared data table declares a thead"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_th_scope",
      "status": "pass",
      "evidence": "data tables: every declared data table declares scope on its header cells"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_a_caption",
      "status": "pass",
      "evidence": "data tables: every declared data table declares a caption"
    },
    {
      "section": "data_table_structure",
      "check": "no_declared_table_ref_repeated",
      "status": "pass",
      "evidence": "data tables: no declared table ref is owned by more than one row"
    },
    {
      "section": "document_head_hygiene",
      "check": "html_lang_attribute_set",
      "status": "pass",
      "evidence": "document hygiene: the lang attribute is set on the html element"
    },
    {
      "section": "document_head_hygiene",
      "check": "viewport_meta_declared",
      "status": "pass",
      "evidence": "document hygiene: the viewport meta is declared"
    },
    {
      "section": "document_head_hygiene",
      "check": "charset_meta_first_in_head",
      "status": "pass",
      "evidence": "document hygiene: the charset declaration comes first in the head"
    },
    {
      "section": "document_head_hygiene",
      "check": "page_title_descriptive",
      "status": "pass",
      "evidence": "document hygiene: the page title is descriptive"
    },
    {
      "section": "aria_practice",
      "check": "native_semantics_preferred_before_aria",
      "status": "pass",
      "evidence": "ARIA: native semantics are used first, before any ARIA"
    },
    {
      "section": "aria_practice",
      "check": "aria_used_only_for_real_gaps",
      "status": "pass",
      "evidence": "ARIA: ARIA is used only to fill real gaps in the native semantics"
    },
    {
      "section": "aria_practice",
      "check": "aria_not_used_to_simulate_controls",
      "status": "pass",
      "evidence": "ARIA: ARIA is never used to fake or simulate controls"
    },
    {
      "section": "validation_and_nesting",
      "check": "w3c_validator_reports_clean",
      "status": "pass",
      "evidence": "validation: the W3C validator reports the markup clean"
    },
    {
      "section": "validation_and_nesting",
      "check": "htmlhint_reports_clean",
      "status": "pass",
      "evidence": "validation: htmlhint reports the markup clean"
    },
    {
      "section": "validation_and_nesting",
      "check": "invalid_nesting_absent_from_markup",
      "status": "pass",
      "evidence": "validation: no invalid nesting is present in the markup — no anchor inside an anchor, no block inside an inline element"
    },
    {
      "section": "red_lines",
      "check": "no_div_or_span_click_handlers",
      "status": "pass",
      "evidence": "red line: no div or span with a click handler is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_layout_tables_in_markup",
      "status": "pass",
      "evidence": "red line: no layout tables are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_missing_lang_or_title",
      "status": "pass",
      "evidence": "red line: no missing lang or title is present in the record"
    }
  ],
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
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across nine sections.",
  "stamp": "SEMANTIC HTML REVIEW\npage: home\nVERDICT: SEMANTIC_HTML_REVIEW_SOUND\n  landmarks_and_heading_outline                pass\n  semantic_elements                            pass\n  real_controls_and_labels                     pass\n  text_alternatives_and_captions               pass\n  data_table_structure                         pass\n  document_head_hygiene                        pass\n  aria_practice                                pass\n  validation_and_nesting                       pass\n  red_lines                                    pass\n45 pass, 0 fail, 0 missing of 45 checks across nine sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:51:01.691327+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/semantic-html-review/evidence.json`.

Input:

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
      "level": 2,
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
      "label_bound": false
    }
  ],
  "media": {
    "captions_present_for_media_elements": true
  },
  "images": [
    {
      "image_ref": "logo",
      "decorative": false,
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
    "div_span_click_handlers_present": true,
    "layout_tables_present": false,
    "lang_or_title_missing_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "semantic-html-review",
  "atom_version": "0.1.0",
  "page": "home",
  "verdict": "SEMANTIC_HTML_REVIEW_DEFICIENT",
  "sections": {
    "landmarks_and_heading_outline": "fail",
    "semantic_elements": "pass",
    "real_controls_and_labels": "fail",
    "text_alternatives_and_captions": "fail",
    "data_table_structure": "pass",
    "document_head_hygiene": "pass",
    "aria_practice": "pass",
    "validation_and_nesting": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "landmarks_and_heading_outline",
      "check": "header_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a header landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "nav_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a nav landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "main_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a main landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "footer_landmark_present",
      "status": "pass",
      "evidence": "landmarks: a footer landmark is present on the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "exactly_one_main_landmark_declared",
      "status": "pass",
      "evidence": "landmarks: exactly one main landmark is declared for the page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "heading_outline_declared",
      "status": "pass",
      "evidence": "the declared record names its heading outline — the headings list is present, one row per heading in document order"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "exactly_one_h1_in_declared_heading_outline",
      "status": "fail",
      "evidence": "heading outline: exactly one level-1 heading appears in the declared outline — one <h1> per page"
    },
    {
      "section": "landmarks_and_heading_outline",
      "check": "heading_outline_levels_never_skip_a_level",
      "status": "pass",
      "evidence": "heading outline: no descending step in the declared outline skips a heading level — the order is logical"
    },
    {
      "section": "semantic_elements",
      "check": "nav_element_carries_navigation",
      "status": "pass",
      "evidence": "semantic elements: the nav element carries the page's navigation blocks"
    },
    {
      "section": "semantic_elements",
      "check": "main_element_carries_primary_content",
      "status": "pass",
      "evidence": "semantic elements: the main element carries the page's primary content"
    },
    {
      "section": "semantic_elements",
      "check": "article_element_for_self_contained_content",
      "status": "pass",
      "evidence": "semantic elements: the article element is used for self-contained content"
    },
    {
      "section": "semantic_elements",
      "check": "section_elements_have_real_meaning",
      "status": "pass",
      "evidence": "semantic elements: section elements carry real meaning, not styling hooks"
    },
    {
      "section": "semantic_elements",
      "check": "figure_elements_have_figcaptions",
      "status": "pass",
      "evidence": "semantic elements: figure elements carry figcaptions"
    },
    {
      "section": "semantic_elements",
      "check": "time_elements_for_dates_and_times",
      "status": "pass",
      "evidence": "semantic elements: the time element is used for dates and times"
    },
    {
      "section": "semantic_elements",
      "check": "generic_divs_used_only_when_no_semantic_element_fits",
      "status": "pass",
      "evidence": "semantic elements: a generic div is reached for only after asking what the content is and finding no semantic element fits"
    },
    {
      "section": "real_controls_and_labels",
      "check": "button_elements_for_actions",
      "status": "pass",
      "evidence": "real controls: button elements carry the page's actions"
    },
    {
      "section": "real_controls_and_labels",
      "check": "anchor_elements_for_navigation",
      "status": "pass",
      "evidence": "real controls: anchor elements carry the page's navigation"
    },
    {
      "section": "real_controls_and_labels",
      "check": "fieldset_legend_group_related_inputs",
      "status": "pass",
      "evidence": "real controls: fieldset and legend group related inputs"
    },
    {
      "section": "real_controls_and_labels",
      "check": "keyboard_only_traversal_passed_for_all_interactive_elements",
      "status": "pass",
      "evidence": "real controls: a keyboard-only pass of every interactive element has been completed"
    },
    {
      "section": "real_controls_and_labels",
      "check": "form_input_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its form inputs — the form_inputs list is present; an empty list declares that the page has no form inputs"
    },
    {
      "section": "real_controls_and_labels",
      "check": "every_declared_form_input_has_a_bound_label",
      "status": "fail",
      "evidence": "form inputs: every declared form input has a label bound to it"
    },
    {
      "section": "real_controls_and_labels",
      "check": "no_declared_form_input_ref_repeated",
      "status": "pass",
      "evidence": "form inputs: no declared input ref is owned by more than one row"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "captions_present_for_media_elements",
      "status": "pass",
      "evidence": "text alternatives: captions are provided for the page's media elements"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "image_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its images — the images list is present; an empty list declares that the page has no images"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "every_content_image_has_meaningful_alt_text",
      "status": "fail",
      "evidence": "images: every declared content (non-decorative) image declares a non-empty alt text — the declared evidence of a meaningful alt"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "every_decorative_image_has_empty_alt_text",
      "status": "pass",
      "evidence": "images: every declared decorative image declares an empty alt text"
    },
    {
      "section": "text_alternatives_and_captions",
      "check": "no_declared_image_ref_repeated",
      "status": "pass",
      "evidence": "images: no declared image ref is owned by more than one row"
    },
    {
      "section": "data_table_structure",
      "check": "data_table_inventory_declared",
      "status": "pass",
      "evidence": "the declared record names its data tables — the data_tables list is present; an empty list declares that the page has no data tables"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_a_thead",
      "status": "pass",
      "evidence": "data tables: every declared data table declares a thead"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_th_scope",
      "status": "pass",
      "evidence": "data tables: every declared data table declares scope on its header cells"
    },
    {
      "section": "data_table_structure",
      "check": "every_data_table_declares_a_caption",
      "status": "pass",
      "evidence": "data tables: every declared data table declares a caption"
    },
    {
      "section": "data_table_structure",
      "check": "no_declared_table_ref_repeated",
      "status": "pass",
      "evidence": "data tables: no declared table ref is owned by more than one row"
    },
    {
      "section": "document_head_hygiene",
      "check": "html_lang_attribute_set",
      "status": "pass",
      "evidence": "document hygiene: the lang attribute is set on the html element"
    },
    {
      "section": "document_head_hygiene",
      "check": "viewport_meta_declared",
      "status": "pass",
      "evidence": "document hygiene: the viewport meta is declared"
    },
    {
      "section": "document_head_hygiene",
      "check": "charset_meta_first_in_head",
      "status": "pass",
      "evidence": "document hygiene: the charset declaration comes first in the head"
    },
    {
      "section": "document_head_hygiene",
      "check": "page_title_descriptive",
      "status": "pass",
      "evidence": "document hygiene: the page title is descriptive"
    },
    {
      "section": "aria_practice",
      "check": "native_semantics_preferred_before_aria",
      "status": "pass",
      "evidence": "ARIA: native semantics are used first, before any ARIA"
    },
    {
      "section": "aria_practice",
      "check": "aria_used_only_for_real_gaps",
      "status": "pass",
      "evidence": "ARIA: ARIA is used only to fill real gaps in the native semantics"
    },
    {
      "section": "aria_practice",
      "check": "aria_not_used_to_simulate_controls",
      "status": "pass",
      "evidence": "ARIA: ARIA is never used to fake or simulate controls"
    },
    {
      "section": "validation_and_nesting",
      "check": "w3c_validator_reports_clean",
      "status": "pass",
      "evidence": "validation: the W3C validator reports the markup clean"
    },
    {
      "section": "validation_and_nesting",
      "check": "htmlhint_reports_clean",
      "status": "pass",
      "evidence": "validation: htmlhint reports the markup clean"
    },
    {
      "section": "validation_and_nesting",
      "check": "invalid_nesting_absent_from_markup",
      "status": "pass",
      "evidence": "validation: no invalid nesting is present in the markup — no anchor inside an anchor, no block inside an inline element"
    },
    {
      "section": "red_lines",
      "check": "no_div_or_span_click_handlers",
      "status": "fail",
      "evidence": "red line: no div or span with a click handler is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_layout_tables_in_markup",
      "status": "pass",
      "evidence": "red line: no layout tables are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_missing_lang_or_title",
      "status": "pass",
      "evidence": "red line: no missing lang or title is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "headings_count": 1,
  "h1_count": 0,
  "heading_level_skip_positions": [],
  "form_inputs_count": 1,
  "form_inputs_without_bound_label": [
    "email_field"
  ],
  "duplicate_form_input_refs": [],
  "labelled_input_coverage": "0.000000",
  "images_count": 1,
  "content_images_without_meaningful_alt": [
    "logo"
  ],
  "decorative_images_with_nonempty_alt": [],
  "duplicate_image_refs": [],
  "appropriate_alt_coverage": "0.000000",
  "data_tables_count": 1,
  "data_tables_without_thead": [],
  "data_tables_without_th_scope": [],
  "data_tables_without_caption": [],
  "duplicate_table_refs": [],
  "fully_structured_table_coverage": "1.000000",
  "summary": "41 pass, 4 fail, 0 missing of 45 checks across nine sections.",
  "stamp": "SEMANTIC HTML REVIEW\npage: home\nVERDICT: SEMANTIC_HTML_REVIEW_DEFICIENT\n  landmarks_and_heading_outline                fail\n  semantic_elements                            pass\n  real_controls_and_labels                     fail\n  text_alternatives_and_captions               fail\n  data_table_structure                         pass\n  document_head_hygiene                        pass\n  aria_practice                                pass\n  validation_and_nesting                       pass\n  red_lines                                    fail\n41 pass, 4 fail, 0 missing of 45 checks across nine sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:51:01.691327+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/semantic-html-review/evidence.json`.

Input:

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
  "headings": "not-a-list",
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "headings",
  "detail": "headings must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — a declared semantic-HTML review record audit whose SERVICE.md U-13 screen states the output could not read as regulated professional advice; not an accessibility certification or a legal-compliance determination. |
| Checks named | 45 documented / 45 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the five declared counts, `heading_level_skip_positions`, the six row-name lists, the three duplicate-ref lists and the three coverage ratios) |
| Input reference typed | Yes — 58 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/semantic-html-review/evidence.json` |
