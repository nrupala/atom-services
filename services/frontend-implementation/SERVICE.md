# Frontend implementation — `frontend-implementation`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Implement frontend with production standards — components, state, data fetching, responsive layouts, accessibility, performance.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Content site and product UI builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the frontend manifest

The caller submits one JSON manifest: a declared frontend
implementation record for one project. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`FRONTEND_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `structure.semantic_html_first` | structure_and_components |
| `structure.small_single_responsibility_components` | structure_and_components |
| `structure.data_down_events_up` | structure_and_components |
| `structure.god_components_present` (must be `false` to pass — skill rule) | structure_and_components |
| `structure.follows_project_stack_and_styles` | structure_and_components |
| `structure.uses_design_tokens` | structure_and_components |
| `framework.new_framework_introduced` (gates the ADR check below) | structure_and_components |
| `framework.adr_recorded` (required when a new framework is declared introduced; otherwise the check passes as not applicable) | structure_and_components |
| `data_views` (list of data-view-row objects, each with the entry fields below; computed, see below) | states_and_data_layer |
| `data_views[].name` (string; names the row in the computed outputs) | states_and_data_layer |
| `data_views[].loading_implemented` | states_and_data_layer |
| `data_views[].empty_implemented` | states_and_data_layer |
| `data_views[].error_implemented` | states_and_data_layer |
| `data_views[].success_implemented` | states_and_data_layer |
| `verification.state_matrix_documented` | states_and_data_layer |
| `interactions.buttons_disabled_while_submitting` | states_and_data_layer |
| `interactions.dead_controls_present` (must be `false` to pass — skill rule) | states_and_data_layer |
| `interactions.silent_failures_present` (must be `false` to pass — skill red line) | states_and_data_layer |
| `data_layer.single_small_client_per_app` | states_and_data_layer |
| `data_layer.retries_with_backoff_for_transient_errors` | states_and_data_layer |
| `data_layer.whole_screen_blocked_by_single_widget_present` (must be `false` to pass — skill rule) | states_and_data_layer |
| `responsive.fluid_grids_used` | responsive_and_accessibility |
| `responsive.wrap_safe_text` | responsive_and_accessibility |
| `responsive.stable_dimensions` | responsive_and_accessibility |
| `responsive.widths_verified_360_to_desktop` | responsive_and_accessibility |
| `responsive.overflow_present` (must be `false` to pass — skill rule) | responsive_and_accessibility |
| `responsive.overlap_present` (must be `false` to pass — skill rule) | responsive_and_accessibility |
| `responsive.has_fixed_bars` (gates the fixed-bars check below) | responsive_and_accessibility |
| `responsive.nothing_hidden_behind_fixed_bars` (required when fixed bars are declared present; otherwise the check passes as not applicable) | responsive_and_accessibility |
| `accessibility.labels_on_all_fields` | responsive_and_accessibility |
| `accessibility.logical_focus_order` | responsive_and_accessibility |
| `accessibility.aria_live_for_async_results` | responsive_and_accessibility |
| `accessibility.fully_keyboard_operable` | responsive_and_accessibility |
| `performance.budget_defined_before_build` | performance_and_errors |
| `performance.lazy_load_below_fold` | performance_and_errors |
| `performance.layout_shift_avoided` | performance_and_errors |
| `performance.static_assets_cached` | performance_and_errors |
| `performance.budget_checked_bundle_and_first_paint` | performance_and_errors |
| `performance.budget_checked_on_slow_throttle` | performance_and_errors |
| `errors.human_readable_messages_in_ui` | performance_and_errors |
| `errors.details_sent_to_logs_not_ui` | performance_and_errors |
| `verification.smoke_tests_for_key_flows` | verification_and_red_lines |
| `verification.keyboard_only_primary_journey_passed` | verification_and_red_lines |
| `errors.console_spam_present` (must be `false` to pass — skill red line) | verification_and_red_lines |
| `security.secrets_in_frontend_code_present` (must be `false` to pass — skill red line) | verification_and_red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Data views declared:** the declared `data_views` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **All four states per data view:** every declared data-view
  row must declare `loading_implemented`,
  `empty_implemented`, `error_implemented` and
  `success_implemented` all `true` (the skill: "implement
  loading, empty, error, and success for every data view";
  quality gate: "Every data view has loading / empty / error /
  success implemented"). A row with any state field absent is
  missing evidence.

Two check groups are conditional, following the skill's own
scoping — computed from the declared gate field:

- **New framework ADR:** the skill binds the ADR requirement to
  introducing a new framework ("no new framework without an
  ADR"). `adr_recorded` is therefore required only when
  `framework.new_framework_introduced` is declared `true`; when
  no new framework is declared, the check passes as not
  applicable.
- **Fixed bars:** the skill binds the nothing-hidden rule to
  fixed bars ("nothing hidden behind fixed bars").
  `nothing_hidden_behind_fixed_bars` is therefore required only
  when `responsive.has_fixed_bars` is declared `true`; when no
  fixed bars are declared, the check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
of the two primary computed checks above cannot be completed),
`data_views_count` (the declared list length, or null when the
list is not declared — counts are reported as integers, exactly),
the row-name list `data_views_without_complete_states`
(data views whose four state fields are all present but not all
true; a view with a state field absent is missing evidence and
does not appear; null when the list is not declared), and the
ratio `state_coverage` (data views declaring all four states
implemented ÷ declared data views).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — no WCAG
contrast ratio, no bundle budget, no paint timing: its
performance budget is a project fact the record attests to
defining and checking, not a bar the atom can set. Quantities
are computed and reported; the only bar on the computed rows is
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a WCAG contrast ratio
or conformance level (the skill requires labels, logical focus
order, `aria-live` and full keyboard operability but states no
ratio and no level — caller attestation only); a bundle-size
budget in kilobytes or bytes (the skill says "budget first
(bundle size, first paint)" but states no number — caller
attestation only); a first-paint or load timing budget in
milliseconds; a layout-shift (CLS) score; a slow-throttle speed
(the skill says "on slow throttle" but states no rate — caller
attestation only); a retry count or backoff delay (the skill
says "retries with backoff" but states no count or delay); a
component-size line count for "small" components or "god
components" (the skill's structure rules are qualitative —
caller declarations only, never judged); a state-coverage
percentage below completeness; a framework vocabulary (no list
of permitted or forbidden frameworks is imposed — only the ADR
gate the skill itself states).

The verdict is one of `FRONTEND_SOUND` (all 39 checks pass),
`FRONTEND_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: structure_and_components,
states_and_data_layer, responsive_and_accessibility,
performance_and_errors, verification_and_red_lines.

## Honest scoping

This atom audits a **declared** frontend implementation record —
it writes and runs no frontend code, renders no page, measures
no real bundle, paint or layout shift, and does not verify that
a declared control actually works. A frontend is sound *on the
caller's declared evidence*: a manifest that declares all four
states on every view, a checked performance budget, and no
secrets in frontend code passes those checks even if the real
interface does none of it. It is a completeness and consistency
audit of the record the skill requires, **not a frontend
engineering service or a live quality certification**: it never
judges visual quality or taste, whether a component split is
genuinely well-judged, whether error copy is genuinely readable,
or whether a real user's journey is genuinely usable — only
that the record contains what the skill's sections and red
lines demand, and that its declared rows are internally
consistent.

Named exclusions: no numeric thresholds beyond the skill's own
stated rules (see the declined list above); no live verification
of any declared fact; no code or repository inspection (secrets
in frontend code are caller declarations, the atom reads no
code); no accessibility conformance certification — labels,
focus order, `aria-live` and keyboard operability are declared,
never tested against a WCAG level the skill does not state;
visual quality and taste are non-reducible and caller
declarations only, never judged; the skill's cross-references to
sibling disciplines (`ux-ui-design` for specs, `multi-surface-webapp`
for the app blueprint, `testing-strategy` for verification depth)
are carried as the caller's own attestations in this record, not
re-audited here.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
