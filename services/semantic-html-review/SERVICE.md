# Semantic html review — `semantic-html-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write semantic, accessible HTML — structure before styling, real controls, valid markup.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Content site page builds reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the semantic-HTML review manifest

The caller submits one JSON manifest: a declared
semantic-HTML review record for one page, made from the
page's actual markup. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid
= the check fails (`SEMANTIC_HTML_REVIEW_DEFICIENT`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `page` (string; carried into the verdict output, not itself checked) | — |
| `landmarks.header_landmark_present` (boolean) | landmarks_and_heading_outline |
| `landmarks.nav_landmark_present` (boolean) | landmarks_and_heading_outline |
| `landmarks.main_landmark_present` (boolean) | landmarks_and_heading_outline |
| `landmarks.footer_landmark_present` (boolean) | landmarks_and_heading_outline |
| `landmarks.exactly_one_main_landmark_declared` (boolean) | landmarks_and_heading_outline |
| `headings` (list of heading-row objects, one per heading in document order, each with the entry fields below; computed, see below) | landmarks_and_heading_outline |
| `headings[].level` (number; the heading's level, 1–6) | landmarks_and_heading_outline |
| `headings[].label` (string; carried for the caller's own reference, not itself checked) | landmarks_and_heading_outline |
| `semantic_elements.nav_element_carries_navigation` (boolean) | semantic_elements |
| `semantic_elements.main_element_carries_primary_content` (boolean) | semantic_elements |
| `semantic_elements.article_element_for_self_contained_content` (boolean) | semantic_elements |
| `semantic_elements.section_elements_have_real_meaning` (boolean) | semantic_elements |
| `semantic_elements.figure_elements_have_figcaptions` (boolean) | semantic_elements |
| `semantic_elements.time_elements_for_dates_and_times` (boolean) | semantic_elements |
| `semantic_elements.generic_divs_used_only_when_no_semantic_element_fits` (boolean) | semantic_elements |
| `controls.button_elements_for_actions` (boolean) | real_controls_and_labels |
| `controls.anchor_elements_for_navigation` (boolean) | real_controls_and_labels |
| `controls.fieldset_legend_group_related_inputs` (boolean) | real_controls_and_labels |
| `controls.keyboard_only_traversal_passed_for_all_interactive_elements` (boolean) | real_controls_and_labels |
| `form_inputs` (list of form-input-row objects, each with the entry fields below; computed, see below) | real_controls_and_labels |
| `form_inputs[].input_ref` (string; names the row in the computed outputs) | real_controls_and_labels |
| `form_inputs[].label_bound` (boolean; must be `true` per row) | real_controls_and_labels |
| `media.captions_present_for_media_elements` (boolean) | text_alternatives_and_captions |
| `images` (list of image-row objects, each with the entry fields below; computed, see below) | text_alternatives_and_captions |
| `images[].image_ref` (string; names the row in the computed outputs) | text_alternatives_and_captions |
| `images[].decorative` (boolean; `true` = decorative image, `false` = content image) | text_alternatives_and_captions |
| `images[].alt_text` (string; the declared alt text — non-empty for content images, empty for decorative) | text_alternatives_and_captions |
| `data_tables` (list of data-table-row objects, each with the entry fields below; computed, see below) | data_table_structure |
| `data_tables[].table_ref` (string; names the row in the computed outputs) | data_table_structure |
| `data_tables[].thead_present` (boolean; must be `true` per row) | data_table_structure |
| `data_tables[].th_scope_present` (boolean; must be `true` per row) | data_table_structure |
| `data_tables[].caption_present` (boolean; must be `true` per row) | data_table_structure |
| `document_head.html_lang_attribute_set` (boolean) | document_head_hygiene |
| `document_head.viewport_meta_declared` (boolean) | document_head_hygiene |
| `document_head.charset_meta_first_in_head` (boolean) | document_head_hygiene |
| `document_head.page_title_descriptive` (boolean) | document_head_hygiene |
| `aria_practice.native_semantics_preferred_before_aria` (boolean) | aria_practice |
| `aria_practice.aria_used_only_for_real_gaps` (boolean) | aria_practice |
| `aria_practice.aria_not_used_to_simulate_controls` (boolean) | aria_practice |
| `validation.w3c_validator_reports_clean` (boolean) | validation_and_nesting |
| `validation.htmlhint_reports_clean` (boolean) | validation_and_nesting |
| `validation.invalid_nesting_absent_from_markup` (boolean) | validation_and_nesting |
| `red_lines.div_span_click_handlers_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.layout_tables_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.lang_or_title_missing_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Heading outline declared:** the declared `headings` list
  passes when it is present. An absent list is missing
  evidence. (An empty list is present evidence — and fails the
  one-`<h1>` check below, because the skill requires one
  `<h1>` per page.)
- **Exactly one h1 in the declared outline:** the declared
  outline must contain exactly one level-1 heading (the
  skill: "one `<h1>` per page"). A row with `level` absent is
  missing evidence for this check.
- **Heading levels never skip a level:** no descending step
  in the declared outline may jump more than one level (an
  outline going 1 → 3 skips level 2; the skill: "logical
  heading order"). A row with `level` absent is missing
  evidence for this check. The output names the positions of
  any skips in `heading_level_skip_positions` (the index, in
  the declared list, of the heading that lands after the
  skip).
- **Form-input inventory declared:** the declared
  `form_inputs` list passes when it is present. An empty list
  passes: it declares that the page has no form inputs.
- **Bound label per form input:** every declared form-input
  row must declare `label_bound` true (the skill's quality
  gate: "every input has a label"). A row with the field
  absent is missing evidence; a row declaring it false fails.
  On an empty list the check passes vacuously.
- **Image inventory declared:** the declared `images` list
  passes when it is present. An empty list passes: it
  declares that the page has no images.
- **Meaningful alt per content image:** every declared image
  row with `decorative` false must declare a non-empty
  `alt_text` (the skill: "meaningful `alt` for content
  images" — a non-empty declared string is the declared
  evidence of a meaningful alt; this atom does not judge the
  wording). A row with `decorative` or `alt_text` absent is
  missing evidence for this check.
- **Empty alt per decorative image:** every declared image
  row with `decorative` true must declare `alt_text` exactly
  empty (the skill: "empty `alt` for decorative"), under the
  same absent/false rules.
- **Data-table inventory declared:** the declared
  `data_tables` list passes when it is present. An empty list
  passes: it declares that the page has no data tables.
- **Thead / th scope / caption per data table:** every
  declared data-table row must declare `thead_present`,
  `th_scope_present` and `caption_present` true (the skill:
  data tables carry "`<thead>`, `<th scope>`, `<caption>`"),
  each under the same absent/false/vacuous rules.
- **No row ref repeated:** no declared `input_ref`,
  `image_ref` or `table_ref` may appear on more than one row
  of its list. A row with its ref absent is missing evidence
  for that list's check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the fifteen primary computed checks above cannot be
completed), the counts `headings_count`, `h1_count`,
`form_inputs_count`, `images_count` and `data_tables_count`
(each the declared list length, or null when the list is not
declared — counts are reported as integers, exactly),
`heading_level_skip_positions`, the row-name lists
`form_inputs_without_bound_label`, `content_images_without_meaningful_alt`,
`decorative_images_with_nonempty_alt`, `data_tables_without_thead`,
`data_tables_without_th_scope` and `data_tables_without_caption`
(rows whose field is present but not satisfied; a row with
the field absent is missing evidence and does not appear),
the duplicate-ref lists `duplicate_form_input_refs`,
`duplicate_image_refs` and `duplicate_table_refs` (refs
declared on more than one row, in the order their second
occurrence appears), and the coverage ratios
`labelled_input_coverage` (inputs with a bound label ÷
declared inputs), `appropriate_alt_coverage` (images whose
declared alt matches their decorative/content kind ÷ declared
images) and `fully_structured_table_coverage` (tables
declaring thead, th scope and caption ÷ declared tables).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio
is null when its denominator list is absent or empty. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states exactly one numeric rule — one `<h1>` per
page — and it is applied exactly as stated. It states no
other numeric threshold: its remaining demands are
qualitative declarations the record makes, not bars the atom
can set. Quantities are computed and reported; the only bar
on the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a maximum or minimum number of headings, sections or
landmarks beyond the one `<h1>` and the one `main` landmark
the skill and its quality gate state; an alt-text minimum
length or word count for "meaningful" (a non-empty declared
string is the bar — the wording is never judged); a maximum
number of images, form inputs or data tables, or a coverage
percentage any of the computed ratios must reach beyond every
declared row satisfying its rule; a validator or htmlhint
warning/error count beyond clean as declared (neither tool
is run by this atom); a keyboard-traversal time, tab-stop
count or focus-order metric beyond the declared keyboard-only
pass; a caption coverage percentage or a media-element count;
an ARIA attribute or role count, or a named list of permitted
ARIA roles beyond used-only-for-real-gaps as declared; a
`div`/`span` usage ratio or percentage (the skill's bar is
that a semantic element was considered first, declared — not
a quota); a title length, a `lang` value list, or a specific
charset or viewport content string (only that each is
present, first or descriptive as declared is checked).

The verdict is one of `SEMANTIC_HTML_REVIEW_SOUND` (all 45
checks pass), `SEMANTIC_HTML_REVIEW_DEFICIENT` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across nine sections:
landmarks_and_heading_outline, semantic_elements,
real_controls_and_labels, text_alternatives_and_captions,
data_table_structure, document_head_hygiene, aria_practice,
validation_and_nesting, red_lines.

## Distinct ground

The nearest siblings are `efficient-web-build-standard` (a
declared web-build record — publish-time precompute, caching
layers, compression, delivery and security headers over a
site build) and `frontend-implementation` (a declared
frontend implementation record — components, data-view state
coverage, responsive layout and performance budgets over an
app build). This atom shares **zero checks** with any other
atom in the fleet (verified mechanically by enumerating
`evaluate({})` check names from every atom oracle and by
literal grep of every oracle source): every check here is a
semantic-HTML question about one page's declared markup — a
header/nav/main/footer landmark set with exactly one main,
a declared heading outline with exactly one level-1 heading
and no skipped levels, nav/main/article/section/figure/time
elements chosen by meaning before any generic `div`, buttons
for actions and anchors for navigation with a label bound to
every declared form input and fieldset/legend grouping,
meaningful alt on every content image and empty alt on every
decorative one with captions for media, data tables each
declaring a thead, th scope and a caption, a document head
with `lang`, viewport meta, charset first and a descriptive
title, ARIA used sparingly and never to simulate controls,
validator-clean markup with no invalid nesting, and the HTML
red lines (no `div`/`span` click handlers, no layout tables,
no missing `lang`/`title`). The boundary is: one page's
declared markup semantics here; build/delivery efficiency
and app implementation there.

## Honest scoping

This atom reviews a **declared** semantic-HTML review record —
it fetches, parses and renders no page or HTML text itself,
runs no W3C validator or htmlhint, performs no keyboard
traversal, and does not verify that declared markup was ever
written. A page is sound *on the caller's declared evidence*:
a record that declares one `<h1>`, a bound label on every
input, and validator-clean markup passes those checks even
if the real page has none of it. It is a completeness and
consistency audit of the review record the skill requires,
**not an HTML parser, a validator, an accessibility audit of
a live page, or a guarantee that the page is accessible or
standards-conformant**: it never judges whether a declared
alt text is actually meaningful, whether a declared heading
label or page title is actually descriptive, whether the
declared semantic elements are the right meaning for the
content, or whether the declared validator result was ever
produced — only that the record contains what the skill's
method, quality gates and red lines demand, and that its
declared heading, input, image and table rows are internally
consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no parsing of caller-
supplied HTML text (the skill's method is written for an
author or reviewer of markup; this atom's deterministic form
is the declared record of that review, and structural facts
about live markup — actual nesting, actual attribute
presence, actual heading order in a document — are exactly
what the caller declares, never independently observed); no
numeric thresholds beyond the skill's one-`<h1>` rule (see
the declined list above); no live verification of any
declared fact; no judgment of markup *quality* — whether the
chosen semantics, alt wording or heading labels are good is
the caller's declaration, checked only for declared presence
and consistency.

## U-13 regulatory screen

No: this atom's output could not read as regulated
professional advice — it audits a declared semantic-HTML
review record for completeness and consistency against an
HTML-craft skill; it offers no engineering-practice advice
in the APEGA sense (no design, stamping, or safety judgment
over physical systems), no financial or securities advice,
nothing psychology-adjacent, and no medical or legal advice.
Its subject is software markup practice only, the same class
as the software-engineering titles that stayed live at the
census pending the owner's review. Classification: **(a) No
outright** — no flag and no controls required.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
