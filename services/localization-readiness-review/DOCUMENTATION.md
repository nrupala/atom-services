# Localization readiness review — documentation

**Localization readiness review** · slug `localization-readiness-review` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/localization-readiness-review/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `product` "TestApp"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "localization-readiness-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the localization readiness manifest.** You declare a record of a product's localization readiness — the atom audits the declared record, it does not localize the product or inspect its code (see Explanation). The recorded full-pass manifest declares the product `TestApp`: all user-visible strings externalized with stable keys, full sentences as translation units, no hardcoded UI strings present and a hardcoded-string lint that catches them; dates, times, numbers, currency, lists and relative time via locale APIs, timestamps stored in UTC and rendered local, and no hand-rolled format masks present; ICU MessageFormat used for plurals and select, and gender and declension handled where required; a layout that allows language length variance, no fixed-width text containers present, and buttons that wrap safely; logical CSS properties used where RTL is possible, mirrored icons reviewed, and an RTL smoke locale tested; a TMS or controlled files used, a glossary for product terms present, brand names kept untranslated, the glossary respected, context notes for translators provided, and machine-translation drafts human-reviewed before shipping; a pseudo-localization pass done and in CI where possible, and a layout that survives long strings; one locale row, `French` (`fr-FR`, direction `ltr`, format tests passed, screenshots reviewed); and both red-line flags `false` (no string concatenation for grammar, no raw machine translation shipped unreviewed for legal or sensitive text).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/localization-readiness-review` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `LOCALIZATION_READINESS_SOUND`: "37 pass, 0 fail, 0 missing of 37 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `locales_count` is 1, and `format_test_coverage`, `valid_direction_coverage` and `screenshot_coverage` are each `"1.000000"`, with all four row-name / code lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `LOCALIZATION_READINESS_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "localization-readiness-review"}`.
3. Call: `POST https://atoms.pipavia.com/v1/localization-readiness-review` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/localization-readiness-review` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `localization_readiness_review`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `LOCALIZATION_READINESS_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_locale_direction_valid`, `every_locale_has_format_tests_passed`, `no_hardcoded_ui_strings`, and the summary reads "34 pass, 3 fail, 0 missing of 37 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `locales_without_format_tests` names `French` — that row declares `format_tests_passed: false` — `format_test_coverage` is `"0.000000"`, `locales_with_invalid_direction` names `French` — that row declares `direction: "sideways"` — `valid_direction_coverage` is `"0.000000"`, and `externalization.hardcoded_ui_strings_present` is declared `true`, failing `no_hardcoded_ui_strings`; sections `externalized_strings_and_translation_units` and `locale_testing_and_red_lines` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "externalization",
  "detail": "externalization must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/localization-readiness-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/localization-readiness-review` — tool name `localization_readiness_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `localization_readiness_review` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `product` and the `locales[]` string fields are noted as strings and `locales` as a list there. Where SERVICE.md states no type — the section container objects (`externalization`, `formats`, `grammar`, `layout`, `rtl`, `workflow`, `testing`, `red_lines`) and a `locales[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `locales` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `LOCALIZATION_READINESS_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `product` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: externalized_strings_and_translation_units

| Field | Type | Notes |
|---|---|---|
| `externalization` | object | The externalization section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `externalization.all_user_visible_strings_externalized` | boolean | — |
| `externalization.stable_keys_used` | boolean | — |
| `externalization.full_sentences_are_translation_units` | boolean | — |
| `externalization.hardcoded_ui_strings_present` | boolean | must be `false` to pass |
| `externalization.hardcoded_string_lint_catches_them` | boolean | — |

#### Read by: locale_formats_plurals_and_grammar

| Field | Type | Notes |
|---|---|---|
| `formats` | object | The formats section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `formats.dates_via_locale_apis` | boolean | — |
| `formats.times_via_locale_apis` | boolean | — |
| `formats.numbers_via_locale_apis` | boolean | — |
| `formats.currency_via_locale_apis` | boolean | — |
| `formats.lists_via_locale_apis` | boolean | — |
| `formats.relative_time_via_locale_apis` | boolean | — |
| `formats.timestamps_stored_utc_rendered_local` | boolean | — |
| `formats.hand_rolled_format_masks_present` | boolean | must be `false` to pass |
| `grammar` | object | The grammar section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `grammar.icu_messageformat_used_for_plurals_and_select` | boolean | — |
| `grammar.gender_and_declension_handled_where_required` | boolean | — |

#### Read by: flexible_layout_and_rtl_readiness

| Field | Type | Notes |
|---|---|---|
| `layout` | object | The layout section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `layout.layout_allows_language_length_variance` | boolean | — |
| `layout.fixed_width_text_containers_present` | boolean | must be `false` to pass |
| `layout.buttons_wrap_safely` | boolean | — |
| `rtl` | object | The RTL section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `rtl.logical_css_properties_used_where_rtl_possible` | boolean | — |
| `rtl.mirrored_icons_reviewed` | boolean | — |
| `rtl.rtl_smoke_locale_tested` | boolean | — |

#### Read by: content_workflow_and_glossary

| Field | Type | Notes |
|---|---|---|
| `workflow` | object | The workflow section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `workflow.tms_or_controlled_files_used` | boolean | — |
| `workflow.glossary_for_product_terms_present` | boolean | — |
| `workflow.brand_names_kept_untranslated` | boolean | — |
| `workflow.glossary_respected` | boolean | — |
| `workflow.context_notes_for_translators_provided` | boolean | — |
| `workflow.machine_translation_drafts_human_reviewed_before_shipping` | boolean | — |

#### Read by: locale_testing_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.pseudo_localization_pass_done` | boolean | — |
| `testing.pseudo_localization_pass_in_ci_where_possible` | boolean | — |
| `testing.layout_survives_long_strings` | boolean | — |
| `locales` | list | list of locale-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `locales[]` | object | One declared locale row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `locales[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `locales[].code` | string | The locale code the row declares; duplicate declaration is computed, see below (type stated in SERVICE.md) |
| `locales[].direction` | string | Must be one of `ltr`, `rtl` — the skill's own distinction (type and set stated in SERVICE.md) |
| `locales[].format_tests_passed` | boolean | — |
| `locales[].screenshots_reviewed` | boolean | — |
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.string_concatenation_for_grammar_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: externalized_strings_and_translation_units

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `all_user_visible_strings_externalized` | externalize everything: all user-visible strings are in resources | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stable_keys_used` | externalize everything: strings carry stable keys | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `full_sentences_are_translation_units` | externalize everything: full sentences are translation units — word order varies by language | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_hardcoded_ui_strings` | quality gate: no hardcoded UI strings are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `hardcoded_string_lint_catches_them` | quality gate: a lint catches hardcoded UI strings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: locale_formats_plurals_and_grammar

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `dates_via_locale_apis` | formats via platform APIs: dates are formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `times_via_locale_apis` | formats via platform APIs: times are formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `numbers_via_locale_apis` | formats via platform APIs: numbers are formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `currency_via_locale_apis` | formats via platform APIs: currency is formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lists_via_locale_apis` | formats via platform APIs: lists are formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `relative_time_via_locale_apis` | formats via platform APIs: relative time is formatted via locale APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `timestamps_stored_utc_rendered_local` | formats via platform APIs: timestamps are stored in UTC and rendered local | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_hand_rolled_format_masks` | formats via platform APIs: no hand-rolled format masks are present — never hand-rolled masks | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `icu_messageformat_used_for_plurals_and_select` | plurals and grammar: ICU MessageFormat (plural/select) is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `gender_and_declension_handled_where_required` | plurals and grammar: gender and declension are handled where the language requires it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: flexible_layout_and_rtl_readiness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `layout_allows_language_length_variance` | layout that flexes: layout allows language length variance | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_fixed_width_text_containers` | layout that flexes: no fixed-width text containers are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `buttons_wrap_safely` | layout that flexes: buttons wrap safely | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `logical_css_properties_used_where_rtl_possible` | RTL readiness: logical CSS properties — start/end, not left/right — are used where RTL is possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mirrored_icons_reviewed` | RTL readiness: mirrored icons are reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rtl_smoke_locale_tested` | RTL readiness: one RTL smoke locale is tested if in scope | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: content_workflow_and_glossary

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tms_or_controlled_files_used` | content workflow: a TMS or controlled files are used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `glossary_for_product_terms_present` | content workflow: a glossary for product terms is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `brand_names_kept_untranslated` | content workflow: brand names are kept untranslated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `glossary_respected` | quality gate: the glossary is respected and brand terms are protected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `context_notes_for_translators_provided` | content workflow: context notes for translators are provided | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `machine_translation_drafts_human_reviewed_before_shipping` | content workflow: machine translation drafts receive human review for anything shipped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: locale_testing_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pseudo_localization_pass_done` | locale testing: a pseudo-localization pass is done | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pseudo_localization_pass_in_ci_where_possible` | locale testing: the pseudo-localization pass runs in CI where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `layout_survives_long_strings` | quality gate: layout survives long strings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `locales_declared` | the declared record names its locales — the locales list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_locale_has_format_tests_passed` | locale testing: every declared locale row passes its per-locale unit tests for formats | Computed over the declared record. Pass: every declared locale row declares `format_tests_passed: true`. Fail: a row declares `format_tests_passed` present but not `true` (offending rows are named in `locales_without_format_tests`). Missing: the list is absent, or a row has `format_tests_passed` absent (such a row is missing evidence and does not appear in `locales_without_format_tests`). |
| `every_locale_direction_valid` | locale testing: every declared locale row declares a direction from the skill's distinction — ltr / rtl | Computed over the declared record. Pass: every declared locale row declares `direction` from the skill's distinction — `ltr`, `rtl`. Fail: a row declares `direction` present but not in that distinction (offending rows are named in `locales_with_invalid_direction`). Missing: the list is absent, or a row has `direction` absent (such a row is missing evidence and does not appear in `locales_with_invalid_direction`). |
| `no_locale_code_declared_twice` | locale testing: no declared locale code is declared by more than one locale row | Computed over the declared record. Pass: no declared `code` string appears on more than one locale row. Fail: a `code` string is declared on more than one row (offending codes are named in `duplicate_locale_codes`). Missing: the list is absent, or a row has `code` absent (such a row is missing evidence for this check). |
| `every_locale_has_screenshots_reviewed` | locale testing: every declared locale row has screenshots of key screens reviewed for its language | Computed over the declared record. Pass: every declared locale row declares `screenshots_reviewed: true`. Fail: a row declares `screenshots_reviewed` present but not `true` (offending rows are named in `locales_without_screenshots`). Missing: the list is absent, or a row has `screenshots_reviewed` absent (such a row is missing evidence and does not appear in `locales_without_screenshots`). |
| `no_string_concatenation_for_grammar` | red line: no string concatenation for grammar is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text` | red line: no raw machine translation is shipped unreviewed for legal or sensitive text | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"localization-readiness-review"`), `atom_version` (`"0.1.0"`), and `product` (the manifest's declared product value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `locales_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `locales_without_format_tests` (locales whose `format_tests_passed` field is present but not `true`; a locale with the field absent is missing evidence and does not appear), `locales_with_invalid_direction` (locales whose `direction` is present but not in the skill's distinction) and `locales_without_screenshots` (locales whose `screenshots_reviewed` field is present but not `true`), and the code list `duplicate_locale_codes` (locale codes declared on more than one row, in the order their second occurrence appears) — all four lists are null when the `locales` list is not declared, as recorded in the sparse case; and the ratios `format_test_coverage` (locales passing format tests ÷ declared locales), `valid_direction_coverage` (locales with a valid direction ÷ declared locales) and `screenshot_coverage` (locales with screenshots reviewed ÷ declared locales) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared product value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `LOCALIZATION_READINESS_SOUND` — all 37 checks pass: the declared localization record is complete and consistent with the bound skill's checklist and red lines.
- `LOCALIZATION_READINESS_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `locales_count`, `locales_without_format_tests`, `format_test_coverage`, `locales_with_invalid_direction`, `valid_direction_coverage`, `duplicate_locale_codes`, `locales_without_screenshots`, `screenshot_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"externalization","detail":"externalization must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Internationalize properly — external strings, ICU formats, RTL, locale-aware everything, tested (the bound capability, from the skill). You submit one declared record — the localization readiness manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`externalized_strings_and_translation_units`, `locale_formats_plurals_and_grammar`, `flexible_layout_and_rtl_readiness`, `content_workflow_and_glossary`, `locale_testing_and_red_lines`). The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `locales` list must be present and non-empty, every locale row must declare `format_tests_passed: true`, must declare a `direction` from the skill's own distinction (`ltr`, `rtl`), and must declare `screenshots_reviewed: true`, and no declared `code` string may appear on more than one locale row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `LOCALIZATION_READINESS_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `LOCALIZATION_READINESS_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a translation-coverage or string-externalization percentage; a number of locales or languages a product must support; a number of externalized strings or stable keys; a format-test count or test-coverage percentage; a screenshot or key-screen count; a text-expansion percentage to pass (the skill's stated +30–100% language length variance is a layout attestation the record declares allowed, not a measured bar this atom sets); a pseudo-localization elongation percentage; a number of RTL locales beyond the skill's stated one RTL smoke locale if in scope; a glossary term count; a translation-quality, machine-translation-quality or human-review turnaround score; a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** localization record: a verdict of `LOCALIZATION_READINESS_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares all strings externalized, formats via locale APIs and no raw machine translation shipped unreviewed passes those checks even if the real product does none of it. It is a completeness and consistency audit of the record the skill requires, **not a translation service, a localization service, or a certification that a product is correctly localized in any language**. Specifically: it inspects no source code, runs no lint or pseudo-localization, renders no screen, executes no format test, and does not verify that a declared control actually works. It never judges whether a translation is accurate or idiomatic, whether a format renders correctly for a locale, whether a layout truly survives a language, or whether a glossary term is the right term — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — hardcoded strings, string concatenation and unreviewed machine translation are caller-declared present / absent flags, the atom reads no code or copy; translation quality and linguistic fit are caller declarations — the atom checks only that workflow, glossary, testing and per-locale rows are declared and consistent; whether RTL is in scope for a product is a caller declaration — the smoke-locale check reads the declared flag only.

**Buyer and use context.** Teams and agents working in Engineering & code who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product UI localization readiness work (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared localization readiness record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not a translation service, a localization service, or a certification that a product is correctly localized in any language, and that it inspects no source code and verifies no live fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `localization_readiness_review` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/localization_readiness_review.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_localization_readiness_review.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/localization-readiness-review` (REST) and `POST /mcp/localization-readiness-review` (MCP, tool `localization_readiness_review`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `localization_readiness_review`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_hardcoded_ui_strings` (input `externalization.hardcoded_ui_strings_present`), `no_hand_rolled_format_masks` (input `formats.hand_rolled_format_masks_present`), `no_fixed_width_text_containers` (input `layout.fixed_width_text_containers_present`), `no_string_concatenation_for_grammar` (input `red_lines.string_concatenation_for_grammar_present`) and `no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text` (input `red_lines.raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present`), plus the computed checks `locales_declared`, `every_locale_has_format_tests_passed`, `every_locale_direction_valid`, `no_locale_code_declared_twice` and `every_locale_has_screenshots_reviewed`, which read the `locales` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Section grouping vs input objects:** the recorded sections merge separate input objects — `formats` and `grammar` inputs are read by the single recorded section `locale_formats_plurals_and_grammar`, `layout` and `rtl` inputs are read by the single recorded section `flexible_layout_and_rtl_readiness`, and `testing`, `locales` and `red_lines` inputs are read by the single recorded section `locale_testing_and_red_lines`. This document groups the Input reference and the Checks by the recorded section names.
5. **Null lists on an undeclared `locales` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `locales_count` and the coverage ratios, but does not state a null rule for the four row-name / code lists. The recorded sparse response returns all four lists as `null` when `locales` is not declared (as USER-GUIDE.md also states); this document follows the recording.

## Worked examples

Provenance: recorded 2026-11-16T07:36:28.378184+00:00 against gateway v1.1.0, external verification lane, source `verification/work/localization-readiness-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:36:28.378184+00:00 · gateway v1.1.0 · source `verification/work/localization-readiness-review/evidence.json`.

Input:

```json
{
  "product": "TestApp",
  "externalization": {
    "all_user_visible_strings_externalized": true,
    "stable_keys_used": true,
    "full_sentences_are_translation_units": true,
    "hardcoded_ui_strings_present": false,
    "hardcoded_string_lint_catches_them": true
  },
  "formats": {
    "dates_via_locale_apis": true,
    "times_via_locale_apis": true,
    "numbers_via_locale_apis": true,
    "currency_via_locale_apis": true,
    "lists_via_locale_apis": true,
    "relative_time_via_locale_apis": true,
    "timestamps_stored_utc_rendered_local": true,
    "hand_rolled_format_masks_present": false
  },
  "grammar": {
    "icu_messageformat_used_for_plurals_and_select": true,
    "gender_and_declension_handled_where_required": true
  },
  "layout": {
    "layout_allows_language_length_variance": true,
    "fixed_width_text_containers_present": false,
    "buttons_wrap_safely": true
  },
  "rtl": {
    "logical_css_properties_used_where_rtl_possible": true,
    "mirrored_icons_reviewed": true,
    "rtl_smoke_locale_tested": true
  },
  "workflow": {
    "tms_or_controlled_files_used": true,
    "glossary_for_product_terms_present": true,
    "brand_names_kept_untranslated": true,
    "glossary_respected": true,
    "context_notes_for_translators_provided": true,
    "machine_translation_drafts_human_reviewed_before_shipping": true
  },
  "testing": {
    "pseudo_localization_pass_done": true,
    "pseudo_localization_pass_in_ci_where_possible": true,
    "layout_survives_long_strings": true
  },
  "locales": [
    {
      "name": "French",
      "code": "fr-FR",
      "direction": "ltr",
      "format_tests_passed": true,
      "screenshots_reviewed": true
    }
  ],
  "red_lines": {
    "string_concatenation_for_grammar_present": false,
    "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "localization-readiness-review",
  "atom_version": "0.1.0",
  "product": "TestApp",
  "verdict": "LOCALIZATION_READINESS_SOUND",
  "sections": {
    "externalized_strings_and_translation_units": "pass",
    "locale_formats_plurals_and_grammar": "pass",
    "flexible_layout_and_rtl_readiness": "pass",
    "content_workflow_and_glossary": "pass",
    "locale_testing_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "externalized_strings_and_translation_units",
      "check": "all_user_visible_strings_externalized",
      "status": "pass",
      "evidence": "externalize everything: all user-visible strings are in resources"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "stable_keys_used",
      "status": "pass",
      "evidence": "externalize everything: strings carry stable keys"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "full_sentences_are_translation_units",
      "status": "pass",
      "evidence": "externalize everything: full sentences are translation units — word order varies by language"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "no_hardcoded_ui_strings",
      "status": "pass",
      "evidence": "quality gate: no hardcoded UI strings are present"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "hardcoded_string_lint_catches_them",
      "status": "pass",
      "evidence": "quality gate: a lint catches hardcoded UI strings"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "dates_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: dates are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "times_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: times are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "numbers_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: numbers are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "currency_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: currency is formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "lists_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: lists are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "relative_time_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: relative time is formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "timestamps_stored_utc_rendered_local",
      "status": "pass",
      "evidence": "formats via platform APIs: timestamps are stored in UTC and rendered local"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "no_hand_rolled_format_masks",
      "status": "pass",
      "evidence": "formats via platform APIs: no hand-rolled format masks are present — never hand-rolled masks"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "icu_messageformat_used_for_plurals_and_select",
      "status": "pass",
      "evidence": "plurals and grammar: ICU MessageFormat (plural/select) is used"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "gender_and_declension_handled_where_required",
      "status": "pass",
      "evidence": "plurals and grammar: gender and declension are handled where the language requires it"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "layout_allows_language_length_variance",
      "status": "pass",
      "evidence": "layout that flexes: layout allows language length variance"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "no_fixed_width_text_containers",
      "status": "pass",
      "evidence": "layout that flexes: no fixed-width text containers are present"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "buttons_wrap_safely",
      "status": "pass",
      "evidence": "layout that flexes: buttons wrap safely"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "logical_css_properties_used_where_rtl_possible",
      "status": "pass",
      "evidence": "RTL readiness: logical CSS properties — start/end, not left/right — are used where RTL is possible"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "mirrored_icons_reviewed",
      "status": "pass",
      "evidence": "RTL readiness: mirrored icons are reviewed"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "rtl_smoke_locale_tested",
      "status": "pass",
      "evidence": "RTL readiness: one RTL smoke locale is tested if in scope"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "tms_or_controlled_files_used",
      "status": "pass",
      "evidence": "content workflow: a TMS or controlled files are used"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "glossary_for_product_terms_present",
      "status": "pass",
      "evidence": "content workflow: a glossary for product terms is present"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "brand_names_kept_untranslated",
      "status": "pass",
      "evidence": "content workflow: brand names are kept untranslated"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "glossary_respected",
      "status": "pass",
      "evidence": "quality gate: the glossary is respected and brand terms are protected"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "context_notes_for_translators_provided",
      "status": "pass",
      "evidence": "content workflow: context notes for translators are provided"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "machine_translation_drafts_human_reviewed_before_shipping",
      "status": "pass",
      "evidence": "content workflow: machine translation drafts receive human review for anything shipped"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "pseudo_localization_pass_done",
      "status": "pass",
      "evidence": "locale testing: a pseudo-localization pass is done"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "pseudo_localization_pass_in_ci_where_possible",
      "status": "pass",
      "evidence": "locale testing: the pseudo-localization pass runs in CI where possible"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "layout_survives_long_strings",
      "status": "pass",
      "evidence": "quality gate: layout survives long strings"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "locales_declared",
      "status": "pass",
      "evidence": "the declared record names its locales — the locales list is present and non-empty"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_has_format_tests_passed",
      "status": "pass",
      "evidence": "locale testing: every declared locale row passes its per-locale unit tests for formats"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_direction_valid",
      "status": "pass",
      "evidence": "locale testing: every declared locale row declares a direction from the skill's distinction — ltr / rtl"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_locale_code_declared_twice",
      "status": "pass",
      "evidence": "locale testing: no declared locale code is declared by more than one locale row"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_has_screenshots_reviewed",
      "status": "pass",
      "evidence": "locale testing: every declared locale row has screenshots of key screens reviewed for its language"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_string_concatenation_for_grammar",
      "status": "pass",
      "evidence": "red line: no string concatenation for grammar is present"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text",
      "status": "pass",
      "evidence": "red line: no raw machine translation is shipped unreviewed for legal or sensitive text"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "locales_count": 1,
  "locales_without_format_tests": [],
  "format_test_coverage": "1.000000",
  "locales_with_invalid_direction": [],
  "valid_direction_coverage": "1.000000",
  "duplicate_locale_codes": [],
  "locales_without_screenshots": [],
  "screenshot_coverage": "1.000000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections.",
  "stamp": "LOCALIZATION READINESS REVIEW\nproduct: TestApp\nVERDICT: LOCALIZATION_READINESS_SOUND\n  externalized_strings_and_translation_units pass\n  locale_formats_plurals_and_grammar   pass\n  flexible_layout_and_rtl_readiness    pass\n  content_workflow_and_glossary        pass\n  locale_testing_and_red_lines         pass\n37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:36:28.378184+00:00 · gateway v1.1.0 · source `verification/work/localization-readiness-review/evidence.json`.

Input:

```json
{
  "product": "TestApp",
  "externalization": {
    "all_user_visible_strings_externalized": true,
    "stable_keys_used": true,
    "full_sentences_are_translation_units": true,
    "hardcoded_ui_strings_present": true,
    "hardcoded_string_lint_catches_them": true
  },
  "formats": {
    "dates_via_locale_apis": true,
    "times_via_locale_apis": true,
    "numbers_via_locale_apis": true,
    "currency_via_locale_apis": true,
    "lists_via_locale_apis": true,
    "relative_time_via_locale_apis": true,
    "timestamps_stored_utc_rendered_local": true,
    "hand_rolled_format_masks_present": false
  },
  "grammar": {
    "icu_messageformat_used_for_plurals_and_select": true,
    "gender_and_declension_handled_where_required": true
  },
  "layout": {
    "layout_allows_language_length_variance": true,
    "fixed_width_text_containers_present": false,
    "buttons_wrap_safely": true
  },
  "rtl": {
    "logical_css_properties_used_where_rtl_possible": true,
    "mirrored_icons_reviewed": true,
    "rtl_smoke_locale_tested": true
  },
  "workflow": {
    "tms_or_controlled_files_used": true,
    "glossary_for_product_terms_present": true,
    "brand_names_kept_untranslated": true,
    "glossary_respected": true,
    "context_notes_for_translators_provided": true,
    "machine_translation_drafts_human_reviewed_before_shipping": true
  },
  "testing": {
    "pseudo_localization_pass_done": true,
    "pseudo_localization_pass_in_ci_where_possible": true,
    "layout_survives_long_strings": true
  },
  "locales": [
    {
      "name": "French",
      "code": "fr-FR",
      "direction": "sideways",
      "format_tests_passed": false,
      "screenshots_reviewed": true
    }
  ],
  "red_lines": {
    "string_concatenation_for_grammar_present": false,
    "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "localization-readiness-review",
  "atom_version": "0.1.0",
  "product": "TestApp",
  "verdict": "LOCALIZATION_READINESS_NOT_SOUND",
  "sections": {
    "externalized_strings_and_translation_units": "fail",
    "locale_formats_plurals_and_grammar": "pass",
    "flexible_layout_and_rtl_readiness": "pass",
    "content_workflow_and_glossary": "pass",
    "locale_testing_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "externalized_strings_and_translation_units",
      "check": "all_user_visible_strings_externalized",
      "status": "pass",
      "evidence": "externalize everything: all user-visible strings are in resources"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "stable_keys_used",
      "status": "pass",
      "evidence": "externalize everything: strings carry stable keys"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "full_sentences_are_translation_units",
      "status": "pass",
      "evidence": "externalize everything: full sentences are translation units — word order varies by language"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "no_hardcoded_ui_strings",
      "status": "fail",
      "evidence": "quality gate: no hardcoded UI strings are present"
    },
    {
      "section": "externalized_strings_and_translation_units",
      "check": "hardcoded_string_lint_catches_them",
      "status": "pass",
      "evidence": "quality gate: a lint catches hardcoded UI strings"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "dates_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: dates are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "times_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: times are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "numbers_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: numbers are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "currency_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: currency is formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "lists_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: lists are formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "relative_time_via_locale_apis",
      "status": "pass",
      "evidence": "formats via platform APIs: relative time is formatted via locale APIs"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "timestamps_stored_utc_rendered_local",
      "status": "pass",
      "evidence": "formats via platform APIs: timestamps are stored in UTC and rendered local"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "no_hand_rolled_format_masks",
      "status": "pass",
      "evidence": "formats via platform APIs: no hand-rolled format masks are present — never hand-rolled masks"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "icu_messageformat_used_for_plurals_and_select",
      "status": "pass",
      "evidence": "plurals and grammar: ICU MessageFormat (plural/select) is used"
    },
    {
      "section": "locale_formats_plurals_and_grammar",
      "check": "gender_and_declension_handled_where_required",
      "status": "pass",
      "evidence": "plurals and grammar: gender and declension are handled where the language requires it"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "layout_allows_language_length_variance",
      "status": "pass",
      "evidence": "layout that flexes: layout allows language length variance"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "no_fixed_width_text_containers",
      "status": "pass",
      "evidence": "layout that flexes: no fixed-width text containers are present"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "buttons_wrap_safely",
      "status": "pass",
      "evidence": "layout that flexes: buttons wrap safely"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "logical_css_properties_used_where_rtl_possible",
      "status": "pass",
      "evidence": "RTL readiness: logical CSS properties — start/end, not left/right — are used where RTL is possible"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "mirrored_icons_reviewed",
      "status": "pass",
      "evidence": "RTL readiness: mirrored icons are reviewed"
    },
    {
      "section": "flexible_layout_and_rtl_readiness",
      "check": "rtl_smoke_locale_tested",
      "status": "pass",
      "evidence": "RTL readiness: one RTL smoke locale is tested if in scope"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "tms_or_controlled_files_used",
      "status": "pass",
      "evidence": "content workflow: a TMS or controlled files are used"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "glossary_for_product_terms_present",
      "status": "pass",
      "evidence": "content workflow: a glossary for product terms is present"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "brand_names_kept_untranslated",
      "status": "pass",
      "evidence": "content workflow: brand names are kept untranslated"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "glossary_respected",
      "status": "pass",
      "evidence": "quality gate: the glossary is respected and brand terms are protected"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "context_notes_for_translators_provided",
      "status": "pass",
      "evidence": "content workflow: context notes for translators are provided"
    },
    {
      "section": "content_workflow_and_glossary",
      "check": "machine_translation_drafts_human_reviewed_before_shipping",
      "status": "pass",
      "evidence": "content workflow: machine translation drafts receive human review for anything shipped"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "pseudo_localization_pass_done",
      "status": "pass",
      "evidence": "locale testing: a pseudo-localization pass is done"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "pseudo_localization_pass_in_ci_where_possible",
      "status": "pass",
      "evidence": "locale testing: the pseudo-localization pass runs in CI where possible"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "layout_survives_long_strings",
      "status": "pass",
      "evidence": "quality gate: layout survives long strings"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "locales_declared",
      "status": "pass",
      "evidence": "the declared record names its locales — the locales list is present and non-empty"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_has_format_tests_passed",
      "status": "fail",
      "evidence": "locale testing: every declared locale row passes its per-locale unit tests for formats"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_direction_valid",
      "status": "fail",
      "evidence": "locale testing: every declared locale row declares a direction from the skill's distinction — ltr / rtl"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_locale_code_declared_twice",
      "status": "pass",
      "evidence": "locale testing: no declared locale code is declared by more than one locale row"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "every_locale_has_screenshots_reviewed",
      "status": "pass",
      "evidence": "locale testing: every declared locale row has screenshots of key screens reviewed for its language"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_string_concatenation_for_grammar",
      "status": "pass",
      "evidence": "red line: no string concatenation for grammar is present"
    },
    {
      "section": "locale_testing_and_red_lines",
      "check": "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text",
      "status": "pass",
      "evidence": "red line: no raw machine translation is shipped unreviewed for legal or sensitive text"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "locales_count": 1,
  "locales_without_format_tests": [
    "French"
  ],
  "format_test_coverage": "0.000000",
  "locales_with_invalid_direction": [
    "French"
  ],
  "valid_direction_coverage": "0.000000",
  "duplicate_locale_codes": [],
  "locales_without_screenshots": [],
  "screenshot_coverage": "1.000000",
  "summary": "34 pass, 3 fail, 0 missing of 37 checks across five sections.",
  "stamp": "LOCALIZATION READINESS REVIEW\nproduct: TestApp\nVERDICT: LOCALIZATION_READINESS_NOT_SOUND\n  externalized_strings_and_translation_units fail\n  locale_formats_plurals_and_grammar   pass\n  flexible_layout_and_rtl_readiness    pass\n  content_workflow_and_glossary        pass\n  locale_testing_and_red_lines         fail\n34 pass, 3 fail, 0 missing of 37 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:36:28.378184+00:00 · gateway v1.1.0 · source `verification/work/localization-readiness-review/evidence.json`.

Input:

```json
{
  "product": "MalformedApp",
  "externalization": "should_be_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "externalization",
  "detail": "externalization must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared localization readiness record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a translation service, a localization service or a certification that a product is correctly localized in any language, and it verifies no live fact. |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`locales_count`, the four row-name / code lists and the three coverage ratios) |
| Input reference typed | Yes — 48 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/localization-readiness-review/evidence.json` |
