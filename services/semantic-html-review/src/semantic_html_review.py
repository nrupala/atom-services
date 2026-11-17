#!/usr/bin/env python3
"""Semantic HTML review — deterministic core.

Built from the bound skill `html-craft`: "Write semantic,
accessible HTML — structure before styling, real controls,
valid markup." ("HTML is the foundation: get the structure and
semantics right and accessibility, SEO, and maintainability
come almost free.")

This atom is a REVIEW of a declared semantic-HTML review
record: it audits the record a caller declares about one page
against the practice the skill defines — structure first (one
`<h1>` per page, a logical heading order, the header/nav/main/
footer landmarks), semantic elements chosen by meaning before
any `div`, real controls (`button` for actions, `a` for
navigation, a `label` bound to every input, `fieldset`/`legend`
for groups), text alternatives (meaningful `alt` for content
images, empty `alt` for decorative images, captions for
media), data tables used only for data (`<thead>`, `<th
scope>`, `<caption>`), document hygiene (`lang`, viewport
meta, charset first, a descriptive `<title>`), ARIA used
sparingly and only to fill real gaps, validator-clean markup
with no invalid nesting — plus the skill's red lines refused.
It does not fetch, parse or render any page or HTML text, run
the W3C validator or htmlhint, traverse the page by keyboard,
or verify that declared markup was ever written — it checks
that the review record the skill requires is present and
internally complete and consistent on the declared evidence.

Distinct ground: the nearest siblings are
`efficient-web-build-standard` (a declared web-build record —
publish-time precompute, caching layers, compression and
delivery budgets over a site build) and
`frontend-implementation` (a declared frontend implementation
record — components, state coverage, responsive layout and
performance budgets over an app build). This atom shares zero
checks with either of them: every check here is a semantic-
HTML question about one page's declared markup — its heading
outline and landmarks, its semantic elements, its real
controls and bound labels, its image alt declarations, its
data-table structure, its document head, its ARIA practice,
its validator result and its nesting — and the HTML red lines
(click handlers on `div`/`span`, layout tables, missing
`lang`/`title`). The boundary is: one page's declared markup
semantics here; build/delivery efficiency and app
implementation there.

The caller submits a review manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- heading outline: the declared `headings` list must be
  present, must contain exactly one level-1 heading (the
  skill: "one `<h1>` per page"), and its levels must never
  skip a level as they descend (the skill: "logical heading
  order" — an outline that jumps from level 1 to level 3
  skips level 2);
- form inputs: the declared `form_inputs` list must be
  present (an empty list is a valid declaration — the page
  has no form inputs), and every declared input row must
  declare a bound label (the skill's quality gate: "every
  input has a label");
- images: the declared `images` list must be present (an
  empty list is a valid declaration — the page has no
  images), and every declared image row must declare its
  alternative appropriately: a non-decorative (content) image
  declares a non-empty `alt_text` (the skill: "meaningful
  `alt` for content images" — a non-empty declared string is
  the declared evidence of a meaningful alt; this atom does
  not judge the wording), and a decorative image declares an
  empty `alt_text` (the skill: "empty `alt` for decorative");
- data tables: the declared `data_tables` list must be
  present (an empty list is a valid declaration — the page
  has no data tables), and every declared table row must
  declare a `<thead>`, `<th scope>` and a `<caption>` (the
  skill: data tables carry "`<thead>`, `<th scope>`,
  `<caption>`");
- row-ref ownership: no declared heading-independent row ref
  (`input_ref`, `image_ref`, `table_ref`) may be owned by more
  than one row in its list (one record per element — internal
  consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states exactly one numeric rule — one `<h1>` per
page — and it is applied exactly as stated. It states no
other numeric threshold: no heading count, no landmark count
beyond the one `main` its quality gate names, no image,
input or table count, no alt-text length, no validator
warning count — so no other numeric threshold check is
invented; those quantities are computed and reported, with
completeness (every declared row) as the only bar, exactly
as stated above.

Verdict:
- any fail             -> SEMANTIC_HTML_REVIEW_DEFICIENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SEMANTIC_HTML_REVIEW_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "landmarks_and_heading_outline",
    "semantic_elements",
    "real_controls_and_labels",
    "text_alternatives_and_captions",
    "data_table_structure",
    "document_head_hygiene",
    "aria_practice",
    "validation_and_nesting",
    "red_lines",
)

MANIFEST_SPEC = {
    "page": "string",
    "landmarks": {
        "header_landmark_present": "boolean",
        "nav_landmark_present": "boolean",
        "main_landmark_present": "boolean",
        "footer_landmark_present": "boolean",
        "exactly_one_main_landmark_declared": "boolean",
    },
    "headings": [{
        "level": "number",
        "label": "string",
    }],
    "semantic_elements": {
        "nav_element_carries_navigation": "boolean",
        "main_element_carries_primary_content": "boolean",
        "article_element_for_self_contained_content": "boolean",
        "section_elements_have_real_meaning": "boolean",
        "figure_elements_have_figcaptions": "boolean",
        "time_elements_for_dates_and_times": "boolean",
        "generic_divs_used_only_when_no_semantic_element_fits": "boolean",
    },
    "controls": {
        "button_elements_for_actions": "boolean",
        "anchor_elements_for_navigation": "boolean",
        "fieldset_legend_group_related_inputs": "boolean",
        "keyboard_only_traversal_passed_for_all_interactive_elements": "boolean",
    },
    "form_inputs": [{
        "input_ref": "string",
        "label_bound": "boolean",
    }],
    "media": {
        "captions_present_for_media_elements": "boolean",
    },
    "images": [{
        "image_ref": "string",
        "decorative": "boolean",
        "alt_text": "string",
    }],
    "data_tables": [{
        "table_ref": "string",
        "thead_present": "boolean",
        "th_scope_present": "boolean",
        "caption_present": "boolean",
    }],
    "document_head": {
        "html_lang_attribute_set": "boolean",
        "viewport_meta_declared": "boolean",
        "charset_meta_first_in_head": "boolean",
        "page_title_descriptive": "boolean",
    },
    "aria_practice": {
        "native_semantics_preferred_before_aria": "boolean",
        "aria_used_only_for_real_gaps": "boolean",
        "aria_not_used_to_simulate_controls": "boolean",
    },
    "validation": {
        "w3c_validator_reports_clean": "boolean",
        "htmlhint_reports_clean": "boolean",
        "invalid_nesting_absent_from_markup": "boolean",
    },
    "red_lines": {
        "div_span_click_handlers_present": "boolean",
        "layout_tables_present": "boolean",
        "lang_or_title_missing_present": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_ref(entry, field):
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


def _all_field(rows, field):
    return all(isinstance(c, dict) and c.get(field) is True for c in rows)


def _field_present(rows, *fields):
    return all(
        isinstance(c, dict) and all(f in c for f in fields) for c in rows
    )


def _without(rows, field, ref_field):
    return [
        _row_ref(c, ref_field) for c in rows
        if isinstance(c, dict) and field in c and c.get(field) is not True
    ]


def evaluate(manifest):
    """Return the verdict dict for a semantic-HTML review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    headings, has_headings = _get(manifest, "headings")
    headings_is_list = has_headings and isinstance(headings, list)
    heading_rows = headings if headings_is_list else []
    headings_count = len(heading_rows) if headings_is_list else None
    h1_count = (
        sum(1 for c in heading_rows
            if isinstance(c, dict) and c.get("level") == 1)
        if headings_is_list else None
    )
    heading_levels_complete = (
        headings_is_list and _field_present(heading_rows, "level")
    )
    heading_level_skip_positions = None
    if headings_is_list:
        heading_level_skip_positions = []
        for i in range(1, len(heading_rows)):
            prev = heading_rows[i - 1]
            cur = heading_rows[i]
            if (isinstance(prev, dict) and isinstance(cur, dict)
                    and isinstance(prev.get("level"), (int, float))
                    and not isinstance(prev.get("level"), bool)
                    and isinstance(cur.get("level"), (int, float))
                    and not isinstance(cur.get("level"), bool)
                    and cur["level"] > prev["level"] + 1):
                heading_level_skip_positions.append(i)

    inputs, has_inputs = _get(manifest, "form_inputs")
    inputs_is_list = has_inputs and isinstance(inputs, list)
    input_rows = inputs if inputs_is_list else []
    inputs_count = len(input_rows) if inputs_is_list else None
    inputs_without_label = (
        _without(input_rows, "label_bound", "input_ref")
        if inputs_is_list else None
    )
    duplicate_input_refs = (
        _duplicates(input_rows, "input_ref") if inputs_is_list else None
    )
    labelled_input_coverage = (
        sum(1 for c in input_rows
            if isinstance(c, dict) and c.get("label_bound") is True)
        / inputs_count
        if inputs_is_list and inputs_count > 0 else None
    )

    images, has_images = _get(manifest, "images")
    images_is_list = has_images and isinstance(images, list)
    image_rows = images if images_is_list else []
    images_count = len(image_rows) if images_is_list else None
    content_images_without_alt = (
        [_row_ref(c, "image_ref") for c in image_rows
         if isinstance(c, dict)
         and c.get("decorative") is False
         and "alt_text" in c and c.get("alt_text") == ""]
        if images_is_list else None
    )
    decorative_images_with_alt = (
        [_row_ref(c, "image_ref") for c in image_rows
         if isinstance(c, dict)
         and c.get("decorative") is True
         and "alt_text" in c and c.get("alt_text") != ""]
        if images_is_list else None
    )
    duplicate_image_refs = (
        _duplicates(image_rows, "image_ref") if images_is_list else None
    )
    appropriate_alt_coverage = (
        sum(1 for c in image_rows
            if isinstance(c, dict)
            and ((c.get("decorative") is True and c.get("alt_text") == "")
                 or (c.get("decorative") is False
                     and isinstance(c.get("alt_text"), str)
                     and c.get("alt_text") != "")))
        / images_count
        if images_is_list and images_count > 0 else None
    )

    tables, has_tables = _get(manifest, "data_tables")
    tables_is_list = has_tables and isinstance(tables, list)
    table_rows = tables if tables_is_list else []
    tables_count = len(table_rows) if tables_is_list else None
    tables_without_thead = (
        _without(table_rows, "thead_present", "table_ref")
        if tables_is_list else None
    )
    tables_without_th_scope = (
        _without(table_rows, "th_scope_present", "table_ref")
        if tables_is_list else None
    )
    tables_without_caption = (
        _without(table_rows, "caption_present", "table_ref")
        if tables_is_list else None
    )
    duplicate_table_refs = (
        _duplicates(table_rows, "table_ref") if tables_is_list else None
    )
    fully_structured_table_coverage = (
        sum(1 for c in table_rows
            if isinstance(c, dict)
            and c.get("thead_present") is True
            and c.get("th_scope_present") is True
            and c.get("caption_present") is True)
        / tables_count
        if tables_is_list and tables_count > 0 else None
    )

    # ---- Section 1: landmarks_and_heading_outline (skill
    #      Method 1 "Structure first" — landmarks
    #      header/nav/main/footer, one <h1> per page, logical
    #      heading order; plus the quality gate's one main
    #      landmark) ----
    _bool_check(results, "landmarks_and_heading_outline",
                "header_landmark_present", manifest,
                ("landmarks", "header_landmark_present"),
                "landmarks: a header landmark is present on the page")
    _bool_check(results, "landmarks_and_heading_outline",
                "nav_landmark_present", manifest,
                ("landmarks", "nav_landmark_present"),
                "landmarks: a nav landmark is present on the page")
    _bool_check(results, "landmarks_and_heading_outline",
                "main_landmark_present", manifest,
                ("landmarks", "main_landmark_present"),
                "landmarks: a main landmark is present on the page")
    _bool_check(results, "landmarks_and_heading_outline",
                "footer_landmark_present", manifest,
                ("landmarks", "footer_landmark_present"),
                "landmarks: a footer landmark is present on the page")
    _bool_check(results, "landmarks_and_heading_outline",
                "exactly_one_main_landmark_declared", manifest,
                ("landmarks", "exactly_one_main_landmark_declared"),
                "landmarks: exactly one main landmark is declared "
                "for the page")
    _check(results, "landmarks_and_heading_outline",
           "heading_outline_declared", headings, headings_is_list,
           headings_is_list,
           "the declared record names its heading outline — the "
           "headings list is present, one row per heading in "
           "document order")
    _check(results, "landmarks_and_heading_outline",
           "exactly_one_h1_in_declared_heading_outline", headings,
           heading_levels_complete,
           headings_is_list and h1_count == 1,
           "heading outline: exactly one level-1 heading appears "
           "in the declared outline — one <h1> per page")
    _check(results, "landmarks_and_heading_outline",
           "heading_outline_levels_never_skip_a_level", headings,
           heading_levels_complete,
           headings_is_list
           and heading_level_skip_positions is not None
           and len(heading_level_skip_positions) == 0,
           "heading outline: no descending step in the declared "
           "outline skips a heading level — the order is logical")

    # ---- Section 2: semantic_elements (skill Method 2
    #      "Semantic elements" — nav, main, article, section,
    #      figure/figcaption, time; ask "what is this?" before
    #      reaching for div) ----
    _bool_check(results, "semantic_elements",
                "nav_element_carries_navigation", manifest,
                ("semantic_elements", "nav_element_carries_navigation"),
                "semantic elements: the nav element carries the "
                "page's navigation blocks")
    _bool_check(results, "semantic_elements",
                "main_element_carries_primary_content", manifest,
                ("semantic_elements", "main_element_carries_primary_content"),
                "semantic elements: the main element carries the "
                "page's primary content")
    _bool_check(results, "semantic_elements",
                "article_element_for_self_contained_content", manifest,
                ("semantic_elements",
                 "article_element_for_self_contained_content"),
                "semantic elements: the article element is used "
                "for self-contained content")
    _bool_check(results, "semantic_elements",
                "section_elements_have_real_meaning", manifest,
                ("semantic_elements", "section_elements_have_real_meaning"),
                "semantic elements: section elements carry real "
                "meaning, not styling hooks")
    _bool_check(results, "semantic_elements",
                "figure_elements_have_figcaptions", manifest,
                ("semantic_elements", "figure_elements_have_figcaptions"),
                "semantic elements: figure elements carry "
                "figcaptions")
    _bool_check(results, "semantic_elements",
                "time_elements_for_dates_and_times", manifest,
                ("semantic_elements", "time_elements_for_dates_and_times"),
                "semantic elements: the time element is used for "
                "dates and times")
    _bool_check(results, "semantic_elements",
                "generic_divs_used_only_when_no_semantic_element_fits",
                manifest,
                ("semantic_elements",
                 "generic_divs_used_only_when_no_semantic_element_fits"),
                "semantic elements: a generic div is reached for "
                "only after asking what the content is and finding "
                "no semantic element fits")

    # ---- Section 3: real_controls_and_labels (skill Method 3
    #      "Real controls" — button for actions, a for
    #      navigation, label bound to every input,
    #      fieldset/legend for groups; plus the quality gates'
    #      keyboard-only pass and every input labelled, as the
    #      computed row checks) ----
    _bool_check(results, "real_controls_and_labels",
                "button_elements_for_actions", manifest,
                ("controls", "button_elements_for_actions"),
                "real controls: button elements carry the page's "
                "actions")
    _bool_check(results, "real_controls_and_labels",
                "anchor_elements_for_navigation", manifest,
                ("controls", "anchor_elements_for_navigation"),
                "real controls: anchor elements carry the page's "
                "navigation")
    _bool_check(results, "real_controls_and_labels",
                "fieldset_legend_group_related_inputs", manifest,
                ("controls", "fieldset_legend_group_related_inputs"),
                "real controls: fieldset and legend group related "
                "inputs")
    _bool_check(results, "real_controls_and_labels",
                "keyboard_only_traversal_passed_for_all_interactive_elements",
                manifest,
                ("controls",
                 "keyboard_only_traversal_passed_for_all_interactive_elements"),
                "real controls: a keyboard-only pass of every "
                "interactive element has been completed")
    _check(results, "real_controls_and_labels",
           "form_input_inventory_declared", inputs, inputs_is_list,
           inputs_is_list,
           "the declared record names its form inputs — the "
           "form_inputs list is present; an empty list declares "
           "that the page has no form inputs")
    label_present = (
        inputs_is_list and _field_present(input_rows, "label_bound")
    )
    _check(results, "real_controls_and_labels",
           "every_declared_form_input_has_a_bound_label", inputs,
           label_present,
           inputs_is_list and _all_field(input_rows, "label_bound"),
           "form inputs: every declared form input has a label "
           "bound to it")
    input_ref_present = (
        inputs_is_list and _field_present(input_rows, "input_ref")
    )
    _check(results, "real_controls_and_labels",
           "no_declared_form_input_ref_repeated", inputs,
           input_ref_present,
           inputs_is_list
           and duplicate_input_refs is not None
           and len(duplicate_input_refs) == 0,
           "form inputs: no declared input ref is owned by more "
           "than one row")

    # ---- Section 4: text_alternatives_and_captions (skill
    #      Method 4 "Text alternatives" — meaningful alt for
    #      content images, empty alt for decorative, captions
    #      for media; plus the quality gate's every image has
    #      appropriate alt text, as the computed row checks) ----
    _bool_check(results, "text_alternatives_and_captions",
                "captions_present_for_media_elements", manifest,
                ("media", "captions_present_for_media_elements"),
                "text alternatives: captions are provided for the "
                "page's media elements")
    _check(results, "text_alternatives_and_captions",
           "image_inventory_declared", images, images_is_list,
           images_is_list,
           "the declared record names its images — the images "
           "list is present; an empty list declares that the "
           "page has no images")
    alt_fields_present = (
        images_is_list
        and _field_present(image_rows, "decorative", "alt_text")
    )
    _check(results, "text_alternatives_and_captions",
           "every_content_image_has_meaningful_alt_text", images,
           alt_fields_present,
           images_is_list
           and all(isinstance(c, dict)
                   and (c.get("decorative") is True
                        or (isinstance(c.get("alt_text"), str)
                            and c.get("alt_text") != ""))
                   for c in image_rows),
           "images: every declared content (non-decorative) "
           "image declares a non-empty alt text — the declared "
           "evidence of a meaningful alt")
    _check(results, "text_alternatives_and_captions",
           "every_decorative_image_has_empty_alt_text", images,
           alt_fields_present,
           images_is_list
           and all(isinstance(c, dict)
                   and (c.get("decorative") is False
                        or c.get("alt_text") == "")
                   for c in image_rows),
           "images: every declared decorative image declares an "
           "empty alt text")
    image_ref_present = (
        images_is_list and _field_present(image_rows, "image_ref")
    )
    _check(results, "text_alternatives_and_captions",
           "no_declared_image_ref_repeated", images,
           image_ref_present,
           images_is_list
           and duplicate_image_refs is not None
           and len(duplicate_image_refs) == 0,
           "images: no declared image ref is owned by more "
           "than one row")

    # ---- Section 5: data_table_structure (skill Method 5
    #      "Data tables" — only for data, with thead, th scope
    #      and caption, as the computed row checks) ----
    _check(results, "data_table_structure",
           "data_table_inventory_declared", tables, tables_is_list,
           tables_is_list,
           "the declared record names its data tables — the "
           "data_tables list is present; an empty list declares "
           "that the page has no data tables")
    thead_present = (
        tables_is_list and _field_present(table_rows, "thead_present")
    )
    _check(results, "data_table_structure",
           "every_data_table_declares_a_thead", tables,
           thead_present,
           tables_is_list and _all_field(table_rows, "thead_present"),
           "data tables: every declared data table declares a "
           "thead")
    scope_present = (
        tables_is_list and _field_present(table_rows, "th_scope_present")
    )
    _check(results, "data_table_structure",
           "every_data_table_declares_th_scope", tables,
           scope_present,
           tables_is_list and _all_field(table_rows, "th_scope_present"),
           "data tables: every declared data table declares "
           "scope on its header cells")
    caption_present = (
        tables_is_list and _field_present(table_rows, "caption_present")
    )
    _check(results, "data_table_structure",
           "every_data_table_declares_a_caption", tables,
           caption_present,
           tables_is_list and _all_field(table_rows, "caption_present"),
           "data tables: every declared data table declares a "
           "caption")
    table_ref_present = (
        tables_is_list and _field_present(table_rows, "table_ref")
    )
    _check(results, "data_table_structure",
           "no_declared_table_ref_repeated", tables,
           table_ref_present,
           tables_is_list
           and duplicate_table_refs is not None
           and len(duplicate_table_refs) == 0,
           "data tables: no declared table ref is owned by more "
           "than one row")

    # ---- Section 6: document_head_hygiene (skill Method 6
    #      "Document hygiene" — lang on <html>, viewport meta,
    #      charset first, descriptive <title>) ----
    _bool_check(results, "document_head_hygiene",
                "html_lang_attribute_set", manifest,
                ("document_head", "html_lang_attribute_set"),
                "document hygiene: the lang attribute is set on "
                "the html element")
    _bool_check(results, "document_head_hygiene",
                "viewport_meta_declared", manifest,
                ("document_head", "viewport_meta_declared"),
                "document hygiene: the viewport meta is declared")
    _bool_check(results, "document_head_hygiene",
                "charset_meta_first_in_head", manifest,
                ("document_head", "charset_meta_first_in_head"),
                "document hygiene: the charset declaration comes "
                "first in the head")
    _bool_check(results, "document_head_hygiene",
                "page_title_descriptive", manifest,
                ("document_head", "page_title_descriptive"),
                "document hygiene: the page title is descriptive")

    # ---- Section 7: aria_practice (skill Method 7 "ARIA —
    #      sparingly" — native semantics first, ARIA only to
    #      fill real gaps, never to fake controls) ----
    _bool_check(results, "aria_practice",
                "native_semantics_preferred_before_aria", manifest,
                ("aria_practice", "native_semantics_preferred_before_aria"),
                "ARIA: native semantics are used first, before "
                "any ARIA")
    _bool_check(results, "aria_practice",
                "aria_used_only_for_real_gaps", manifest,
                ("aria_practice", "aria_used_only_for_real_gaps"),
                "ARIA: ARIA is used only to fill real gaps in the "
                "native semantics")
    _bool_check(results, "aria_practice",
                "aria_not_used_to_simulate_controls", manifest,
                ("aria_practice", "aria_not_used_to_simulate_controls"),
                "ARIA: ARIA is never used to fake or simulate "
                "controls")

    # ---- Section 8: validation_and_nesting (skill Method 8
    #      "Validate" and the quality gate's validator-clean
    #      markup — W3C validator / htmlhint clean, no invalid
    #      nesting such as <a> in <a> or block in inline) ----
    _bool_check(results, "validation_and_nesting",
                "w3c_validator_reports_clean", manifest,
                ("validation", "w3c_validator_reports_clean"),
                "validation: the W3C validator reports the "
                "markup clean")
    _bool_check(results, "validation_and_nesting",
                "htmlhint_reports_clean", manifest,
                ("validation", "htmlhint_reports_clean"),
                "validation: htmlhint reports the markup clean")
    _bool_check(results, "validation_and_nesting",
                "invalid_nesting_absent_from_markup", manifest,
                ("validation", "invalid_nesting_absent_from_markup"),
                "validation: no invalid nesting is present in "
                "the markup — no anchor inside an anchor, no "
                "block inside an inline element")

    # ---- Section 9: red_lines (skill "Red lines" — no
    #      div/span with click handlers, no layout tables, no
    #      missing lang/title) ----
    _false_check(results, "red_lines",
                 "no_div_or_span_click_handlers", manifest,
                 ("red_lines", "div_span_click_handlers_present"),
                 "red line: no div or span with a click handler "
                 "is present in the record")
    _false_check(results, "red_lines",
                 "no_layout_tables_in_markup", manifest,
                 ("red_lines", "layout_tables_present"),
                 "red line: no layout tables are present in the "
                 "record")
    _false_check(results, "red_lines",
                 "no_missing_lang_or_title", manifest,
                 ("red_lines", "lang_or_title_missing_present"),
                 "red line: no missing lang or title is present "
                 "in the record")

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
        verdict = "SEMANTIC_HTML_REVIEW_DEFICIENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SEMANTIC_HTML_REVIEW_SOUND"

    computed_names = (
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
        "service": "semantic-html-review",
        "atom_version": "0.1.0",
        "page": manifest.get("page"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "headings_count": headings_count,
        "h1_count": h1_count,
        "heading_level_skip_positions": heading_level_skip_positions,
        "form_inputs_count": inputs_count,
        "form_inputs_without_bound_label": inputs_without_label,
        "duplicate_form_input_refs": duplicate_input_refs,
        "labelled_input_coverage": _fmt6(labelled_input_coverage),
        "images_count": images_count,
        "content_images_without_meaningful_alt": content_images_without_alt,
        "decorative_images_with_nonempty_alt": decorative_images_with_alt,
        "duplicate_image_refs": duplicate_image_refs,
        "appropriate_alt_coverage": _fmt6(appropriate_alt_coverage),
        "data_tables_count": tables_count,
        "data_tables_without_thead": tables_without_thead,
        "data_tables_without_th_scope": tables_without_th_scope,
        "data_tables_without_caption": tables_without_caption,
        "duplicate_table_refs": duplicate_table_refs,
        "fully_structured_table_coverage": _fmt6(
            fully_structured_table_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across nine sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "SEMANTIC HTML REVIEW",
        f"page: {verdict.get('page')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: semantic_html_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SEMANTIC_HTML_REVIEW_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
