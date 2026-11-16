# License compliance check — `license-compliance-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Get licensing right — license choice, NOTICE/attribution, dependency compatibility, contributor terms.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product release license compliance check**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Not legal advice; scan-based

## Input manifest

The caller submits one licence-evidence manifest (a JSON object). Every check reads declared manifest fields only: a field present and true/valid passes, present and false/invalid fails, and absent is reported as `missing` (evidence not provided), which yields an `INSUFFICIENT_EVIDENCE` verdict rather than a failure. Verdicts: any fail → `NON_COMPLIANT`; no fail but any missing → `INSUFFICIENT_EVIDENCE`; all pass → `COMPLIANT`.

| Field | Type | Read by |
|---|---|---|
| `product` | string | Output/stamp only — echoed in the result; no check gates on it |
| `distribution_model` | string | `no_copyleft_in_proprietary_binary` (fails when exactly `proprietary_binary` and any component licence is copyleft); `bundled_licenses_shipped_where_required` (triggered when one of `proprietary_binary`, `binary_distribution`, `open_binary`) |
| `project_license` | string | `copyleft_choice_logged_as_decision` (copyleft = licence string starting `AGPL` or `GPL`, case-insensitive) |
| `license_decision.logged` | boolean | `copyleft_choice_logged_as_decision` — required true only when `project_license` is copyleft |
| `license_file.present` | boolean | `root_license_present` |
| `license_file.texts_unmodified` | boolean | `license_texts_unmodified` |
| `notice_file.present` | boolean | `notice_file_present` |
| `source_headers.present` | boolean | `source_headers_present` |
| `components` | array of component objects (see schema below) | `components_inventory_declared` (must be a non-empty list); licence/flag fields drive the copyleft, attribution and bundled-licence checks |
| `dependency_scan.completed` | boolean | `dependency_scan_completed` |
| `dependency_scan.clean` | boolean | `scan_clean_or_accepted_with_record` (passes when true, or when `accepted_with_record` is true) |
| `dependency_scan.accepted_with_record` | boolean | `scan_clean_or_accepted_with_record` (alternative pass path; its own absence does not make the check missing) |
| `dependency_scan.incompatible_shipped` | boolean | `no_incompatible_dependency_shipped` — must be exactly false |
| `attribution.shipped` | boolean | `attribution_shipped_where_required` — checked only when at least one component sets `requires_attribution: true`; otherwise the check passes on the components evidence |
| `bundled_licenses.shipped` | boolean | `bundled_licenses_shipped_where_required` — checked only when the distribution model is a binary model and at least one component sets `requires_bundled_license: true` |
| `contributor_terms.policy` | string | `contributor_policy_chosen` — must be `DCO` or `CLA` |
| `contributor_terms.documented_in_contributing` | boolean | `contributor_policy_documented` |
| `contributor_terms.enforced` | boolean | `contributor_policy_enforced` |
| `trademark.usage_rules_documented` | boolean | `trademark_usage_rules_documented` |
| `trademark.implied_endorsement` | boolean | `no_implied_endorsement` — must be exactly false |
| `public_claims.claims_made` | array | `public_claims_have_attestation` — the attestation field is checked only when this is a non-empty list |
| `public_claims.attestation_present` | boolean | `public_claims_have_attestation` |
| `client_work.is_client_work` | boolean | `client_contract_constraints_reviewed` — the review field is checked only when this is true |
| `client_work.contract_constraints_reviewed` | boolean | `client_contract_constraints_reviewed` |

### Component-list schema (`components[]`)

Each entry in `components` is an object with these fields (all read by the checks above):

| Component field | Type | Read by |
|---|---|---|
| `name` | string | `no_copyleft_in_proprietary_binary` — listed in the evidence string when the component's licence is copyleft |
| `license` | string | `no_copyleft_in_proprietary_binary` — copyleft when the string starts with `AGPL` or `GPL` (case-insensitive, surrounding whitespace ignored) |
| `requires_attribution` | boolean | Gates `attribution_shipped_where_required` when exactly true |
| `requires_bundled_license` | boolean | Gates `bundled_licenses_shipped_where_required` when exactly true |
