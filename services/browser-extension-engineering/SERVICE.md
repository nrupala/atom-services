# Browser extension engineering — `browser-extension-engineering`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build browser extensions carefully — MV3 architecture, least-privilege permissions, messaging, store review.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Reader extension builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the browser-extension-engineering manifest

The caller submits one JSON manifest: one extension design/build —
a single extension as its caller declares it — worked through the
bound skill's method. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`EXTENSION_DESIGN_DEFICIENT`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `extension_name` (string; carried into the verdict output, not itself checked) | — |
| `mv3.service_worker_background` | mv3_architecture |
| `mv3.persistent_background_page_used` (must be `false` to pass — skill method step 1) | mv3_architecture |
| `mv3.alarms_used_instead_of_timers` | mv3_architecture |
| `mv3.declarative_apis_used_where_possible` | mv3_architecture |
| `mv3.remote_code_executed` (must be `false` to pass — skill method step 1) | mv3_architecture |
| `mv3.all_code_bundled` | mv3_architecture |
| `permissions.only_needed_requested` | least_privilege_permissions |
| `permissions.host_patterns_narrow` | least_privilege_permissions |
| `permissions.optional_permissions_for_power_features` | least_privilege_permissions |
| `permissions.permission_list_reviewed_as_security_audit` | least_privilege_permissions |
| `permissions.overbroad_permissions_present` (must be `false` to pass — skill red line) | least_privilege_permissions |
| `permissions.requested` (list of strings; computed, see below) | least_privilege_permissions |
| `permissions.justified` (list of strings; computed, see below) | least_privilege_permissions |
| `architecture.content_scripts_isolated_from_page_context` | architecture_and_messaging |
| `architecture.message_passing_well_defined` | architecture_and_messaging |
| `architecture.messages_validated_on_both_ends` | architecture_and_messaging |
| `architecture.storage_scoped_sync_vs_local` | architecture_and_messaging |
| `architecture.secrets_stored_in_extension_storage` (must be `false` to pass — skill method step 3) | architecture_and_messaging |
| `ux.popup_or_options_pages_provided` | ux_honesty |
| `ux.logged_out_and_unavailable_states_provided` | ux_honesty |
| `ux.keyboard_shortcuts_provided` | ux_honesty |
| `ux.drive_by_dom_changes_without_user_intent` (must be `false` to pass — skill method step 4) | ux_honesty |
| `privacy.page_data_processed_locally_by_default` | privacy |
| `privacy.telemetry_requires_explicit_consent` | privacy |
| `privacy.telemetry_clearly_disclosed` | privacy |
| `privacy.privacy_disclosure_matches_behavior_tested` | privacy |
| `privacy.browsing_data_exfiltrated` (must be `false` to pass — skill method step 5) | privacy |
| `privacy.hidden_data_collection_present` (must be `false` to pass — skill red line) | privacy |
| `distribution.store_listing_screenshots_provided` | distribution_and_cross_browser |
| `distribution.store_privacy_form_accurate` | distribution_and_cross_browser |
| `distribution.staged_rollout_planned` | distribution_and_cross_browser |
| `distribution.version_discipline_followed` | distribution_and_cross_browser |
| `distribution.firefox_mv3_differences_addressed` | distribution_and_cross_browser |
| `distribution.target_browsers` (list of strings; computed, see below) | distribution_and_cross_browser |
| `distribution.tested_browsers` (list of strings; computed, see below) | distribution_and_cross_browser |
| `distribution.difference_documented_browsers` (list of strings; computed, see below) | distribution_and_cross_browser |
| `security.csp_discipline_followed` | security |
| `security.injected_ui_sanitized` | security |
| `security.auto_update_via_store_only` | security |
| `security.eval_or_remote_scripts_used` (must be `false` to pass — skill red line) | security |

Two checks are computed from the declared lists, using only what
the skill itself states plus the set logic of the declared
values — no outside threshold and no permission or browser
vocabulary is imported:

- **Permission justification coverage:** the skill's quality
  gate is "Each permission justified in writing." When the
  manifest declares the requested permissions and the
  permissions justified in writing, every requested permission
  passes only when it appears in the justified list. The output
  reports `permissions_without_justification` (the requested
  entries with no written justification, in declared order; null
  when either list is not declared). Justifications for
  permissions that were not requested do not count against the
  design, and an empty requested list passes vacuously — an
  extension may request no permissions at all.
- **Cross-browser coverage:** the skill's quality gate is
  "Works across target browsers (or differences documented)."
  When the manifest declares target browsers, tested browsers,
  and browsers whose differences are documented, every target
  browser passes only when it appears in the tested list or the
  difference-documented list, and at least one target browser
  must be declared (an empty target list is present and fails).
  The output reports `browsers_not_covered` (the target entries
  in neither list, in declared order; null when any of the three
  lists is not declared).

List entries are validated as strings only, never enum-checked —
coverage is a verdict check, not a type error. The skill names
no specific permission, host pattern, or browser as passing or
failing, so none is imposed: whether a particular permission is
overbroad or a particular host pattern is broad stays a declared
judgment of the caller, checked here only as the declared
red-line / narrowness fields above.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
of the two computed checks cannot be completed).

The verdict is one of `EXTENSION_DESIGN_SOUND` (all 37 checks
pass), `EXTENSION_DESIGN_DEFICIENT` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: mv3_architecture,
least_privilege_permissions, architecture_and_messaging,
ux_honesty, privacy, distribution_and_cross_browser, security.

## Honest scoping

This atom audits a **declared** extension design/build manifest —
it does not write extension code, inspect a real extension
package or manifest file, run the extension in a browser, or
verify that a declared value is true. A design is sound *on the
caller's declared evidence* even if a declaration is mistaken.
It is a completeness and consistency audit, **not a code review
or a store review**: it never decides whether a permission is
actually needed, whether a host pattern is actually narrow,
whether the messaging validation is actually correct, or whether
a store will accept the extension — only that the declared
design contains what the skill's method, quality gates, and red
lines demand, and that its declared permission and browser lists
agree with themselves.

Named exclusions: no permission vocabulary (the skill states no
list of overbroad permissions, so none is imposed — overbreadth
is a declared field, not a computed one); no host-pattern breadth
test (the skill states no pattern, such as a match-all pattern,
as broad, so breadth is declared, not parsed); no browser
vocabulary (the skill names Firefox only for its MV3
differences, which are a declared field; target/tested/documented
coverage is pure set logic over the caller's own strings); no
version-number rule (the skill requires "version discipline"
but states no versioning scheme, so no semver or numbering check
is imposed); no numeric threshold of any kind (the skill states
none); no live verification of any declared fact, and no store
submission or store-review outcome prediction.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
