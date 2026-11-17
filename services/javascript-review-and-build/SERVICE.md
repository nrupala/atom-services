# Javascript review and build — `javascript-review-and-build`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Modern JavaScript done right — ESM, no implicit globals, async discipline, XSS-safe DOM, bundle awareness.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **No-build site script engineering**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the javascript-review-and-build manifest

The caller submits one JSON manifest: a declared JavaScript
review/build record for one subject — the caller's declared
module, async, DOM, environment, bundle, file, test and
red-line record for one piece of JavaScript or one build,
worked through the bound skill's method. Every field below is
read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails
(`JAVASCRIPT_REVIEW_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `subject` (string; carried into the verdict output, not itself checked) | — |
| `modules.esm_used_everywhere` (boolean) | modules_and_strictness |
| `modules.implicit_globals_present` (boolean; must be `false` to pass — skill quality gate) | modules_and_strictness |
| `modules.var_used_present` (boolean; must be `false` to pass — skill method: never `var`) | modules_and_strictness |
| `modules.const_by_default_let_when_reassigned` (boolean) | modules_and_strictness |
| `modules.strict_mode_in_effect` (boolean) | modules_and_strictness |
| `modules.jsdoc_types_for_reused_code` (boolean) | modules_and_strictness |
| `async.async_await_with_real_error_handling` (boolean) | async_discipline |
| `async.every_promise_handled_or_explicitly_caught` (boolean) | async_discipline |
| `async.network_calls_present` (boolean; gates the timeout check below) | async_discipline |
| `async.network_timeouts_via_abort_controller` (boolean; required when network calls are declared present; otherwise the check passes as not applicable) | async_discipline |
| `dom.nodes_built_with_text_content_and_create_element` (boolean) | dom_safety |
| `dom.user_input_via_inner_html_present` (boolean; must be `false` to pass — skill DOM safety) | dom_safety |
| `dom.html_truly_needed_present` (boolean; gates the sanitization check below) | dom_safety |
| `dom.sanitization_applied_when_html_truly_needed` (boolean; required when HTML is declared truly needed; otherwise the check passes as not applicable) | dom_safety |
| `environment.no_dom_apis_in_node_code` (boolean) | environment_and_bundle |
| `environment.shared_code_present` (boolean; gates the feature-detection check below) | environment_and_bundle |
| `environment.feature_detection_when_shared_code` (boolean; required when shared code is declared present; otherwise the check passes as not applicable) | environment_and_bundle |
| `bundle.bundle_contents_known` (boolean) | environment_and_bundle |
| `bundle.huge_dependencies_for_small_jobs_present` (boolean; must be `false` to pass — skill bundle awareness) | environment_and_bundle |
| `bundle.optional_code_split` (boolean) | environment_and_bundle |
| `files` (list of file-row objects, each with the entry fields below; computed, see below) | modules_and_strictness, async_discipline, dom_safety |
| `files[].name` (string; names the row in the computed outputs) | modules_and_strictness, async_discipline, dom_safety |
| `files[].esm_module` (boolean) | modules_and_strictness |
| `files[].var_present` (boolean; must be `false` per row to pass the computed var check) | modules_and_strictness |
| `files[].unhandled_promise_present` (boolean; must be `false` per row to pass the computed promise check) | async_discipline |
| `files[].inner_html_with_user_input_present` (boolean; must be `false` per row to pass the computed injection check) | dom_safety |
| `tests.pure_logic_unit_tested` (boolean) | tests_and_red_lines |
| `tests.ui_present` (boolean; gates the manual-smoke check below) | tests_and_red_lines |
| `tests.manual_smoke_for_ui` (boolean; required when a UI is declared present; otherwise the check passes as not applicable) | tests_and_red_lines |
| `tests.logic_extracted_from_event_handlers_and_tested` (boolean) | tests_and_red_lines |
| `red_lines.eval_or_function_on_untrusted_input_present` (boolean; must be `false` to pass — skill red line) | tests_and_red_lines |
| `red_lines.secrets_in_client_side_code_present` (boolean; must be `false` to pass — skill red line) | tests_and_red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Files declared:** the declared `files` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **ESM per file:** every declared file row must declare
  `esm_module: true` (the skill: "ESM (`import`/`export`)
  everywhere"). A row with the field absent is missing
  evidence.
- **No var per file:** no declared file row may declare
  `var_present: true` (the skill: "never `var`"). A row with
  the field absent is missing evidence.
- **No unhandled promise per file:** no declared file row may
  declare `unhandled_promise_present: true` (the skill:
  "every promise handled or explicitly `.catch`ed").
- **No innerHTML injection per file:** no declared file row
  may declare `inner_html_with_user_input_present: true`
  (the skill: "never inject user input via `innerHTML`").

Four checks are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Network timeouts:** `network_timeouts_via_abort_controller`
  is required only when `async.network_calls_present` is
  declared `true`; when no network calls are declared, the
  check passes as not applicable.
- **Sanitization:** `sanitization_applied_when_html_truly_needed`
  is required only when `dom.html_truly_needed_present` is
  declared `true`; otherwise the check passes as not
  applicable.
- **Feature detection:** `feature_detection_when_shared_code`
  is required only when `environment.shared_code_present` is
  declared `true`; otherwise the check passes as not
  applicable.
- **Manual smoke for UI:** `manual_smoke_for_ui` is required
  only when `tests.ui_present` is declared `true`; otherwise
  the check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`files_count` (the declared list length, or null when the
list is not declared — counts are reported as integers,
exactly), the row-name lists `files_without_esm` (files whose
field is present but not true; a file with the field absent is
missing evidence and does not appear), `files_using_var`
(files declaring `var_present: true`),
`files_with_unhandled_promises` (files declaring
`unhandled_promise_present: true`) and
`files_injecting_user_input_via_inner_html` (files declaring
`inner_html_with_user_input_present: true`), and the coverage
ratio `esm_coverage` (ES-module files ÷ declared files).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — no bundle
size, no dependency size, no coverage percentage: its bundle,
async and test concepts are content the record attests to, not
bars the atom can set. Quantities are computed and reported;
the only bar on the computed rows is completeness over the
caller's own declared rows, exactly as stated above. Declined
thresholds, named: a bundle-size limit in kilobytes or any
other unit (the skill says "know what ships" and "no huge
deps for small jobs" but states no size); a dependency-size
or dependency-count limit, or a definition of "huge" or
"small" (caller attestation only); a network-timeout duration
in milliseconds or seconds (the skill requires timeouts via
`AbortController` but states no duration); a test-coverage
percentage (the skill requires unit tests for pure logic but
states no coverage bar); a number of files, modules or
promises a review must cover; a code-size, complexity or
growth threshold at which plain JavaScript should become
TypeScript (the skill says "Prefer TypeScript for anything
that grows" but states no size or complexity number — which
side of that line a subject sits on is a caller declaration,
never judged here); a coverage percentage below completeness.

The verdict is one of `JAVASCRIPT_REVIEW_SOUND` (all 27 checks
pass), `JAVASCRIPT_REVIEW_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: modules_and_strictness, async_discipline,
dom_safety, environment_and_bundle, tests_and_red_lines.

## Distinct ground

Sibling atoms `c-engineering-review`, `cpp-engineering-review`
and `code-review-service` are live, but this atom shares **zero
checks** with any of them. The boundary: those atoms audit,
respectively, C memory/undefined-behaviour evidence, C++
RAII/value-semantics evidence, and the pull-request review
process (PR size, checklist, feedback and approval gates).
This atom audits only JavaScript-specific evidence from the
`javascript-engineering` skill — ESM/`var`/strictness/JSDoc,
promise and `AbortController` discipline, `textContent` /
`createElement` / `innerHTML` DOM safety, Node-vs-DOM
environment split, and bundle/code-split awareness. No check
name, manifest field or verdict overlaps a sibling's.

## Honest scoping

This atom audits a **declared** JavaScript review/build record
— it runs no code, parses no source, lints nothing, probes no
live page or bundle, and does not verify that a declared
control actually works. A review is sound *on the caller's
declared evidence*: a manifest that declares ESM everywhere,
every promise handled, and no `innerHTML` injection passes
those checks even if the real code does none of it. It is a
completeness and consistency audit of the record the skill
requires, **not a code review, a linter, a security audit, or
a certification**: it never judges whether code actually
contains an implicit global, an unhandled promise or an XSS
trap the manifest did not declare, whether error handling is
genuinely adequate, whether sanitization is effective,
whether a dependency is genuinely too large for its job, or
whether TypeScript would have been the better call — only
that the record contains what the skill's method, quality
gates and red lines demand, and that its declared rows are
internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no source inspection —
`eval`/`Function` use, secret presence, `var` use and
`innerHTML` injection are caller-declared present/absent
flags, the atom reads no code; correctness of the underlying
JavaScript (logic, algorithm, API use) is a caller
declaration — the atom checks only that the skill's disciplines
are declared applied; whether plain JS versus TypeScript is
the right call for a subject is a caller declaration, not
re-audited here.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Generic engineering skill
