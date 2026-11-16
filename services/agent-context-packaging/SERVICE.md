# Agent context packaging — `agent-context-packaging`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Package context and configs for agents — redaction, reproducibility, handoffs, versioned exports. Configs and context that travel must arrive safe, reproducible, and actually usable: redact first, generate (never hand-maintain), version everything.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Agent handoff package builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the context-pack manifest

The caller submits one JSON manifest: a declared context pack for
one agent setup — what it claims travels, to whom and why, how it
was redacted, how it is structured, how it was generated and
signed, what its handoff dossier carries, and its freshness and
privacy posture. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`PACK_NOT_SOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `pack` (string; carried into the verdict output, not itself checked) | — |
| `scope.what_travels_declared` | scope_declaration |
| `scope.recipient_declared` | scope_declaration |
| `scope.purpose_declared` | scope_declaration |
| `scope.pack_inherits_boundary` | scope_declaration |
| `redaction.keys_replaced_with_environment_references` | redaction |
| `redaction.personal_data_minimized_purpose_limited` | redaction |
| `redaction.contacts_or_financials_included` (must be `false` to pass — excluded by default) | redaction |
| `redaction.scan_clean_automated_and_manual` | redaction |
| `redaction.secrets_or_pii_unredacted_present` (must be `false` to pass — skill red line) | redaction |
| `manifest.manifest_present` | structure_and_manifest |
| `manifest.manifest_lists_contents_version_date_generator_and_source` | structure_and_manifest |
| `structure.stable_folder_layout` | structure_and_manifest |
| `structure.receiver_runbook_present` | structure_and_manifest |
| `structure.receiver_runbook_tested` | structure_and_manifest |
| `reproducibility.generated_by_script_from_source_of_truth` | reproducibility_and_signing |
| `reproducibility.hand_assembled` (must be `false` to pass) | reproducibility_and_signing |
| `reproducibility.derived_pack_hand_maintained_silently` (must be `false` to pass — skill red line) | reproducibility_and_signing |
| `reproducibility.versioned_in_git` | reproducibility_and_signing |
| `signing.pack_signed` | reproducibility_and_signing |
| `handoff.is_handoff_dossier` (gates the contents check below) | handoff_dossier |
| `handoff.dossier_contents_complete` (required when the pack is a handoff dossier; otherwise the check passes as not applicable) | handoff_dossier |
| `handoff.everything_dated` | handoff_dossier |
| `handoff.review_date_marked` | handoff_dossier |
| `freshness.expiry_or_review_date_present` | freshness_and_privacy |
| `freshness.stale_packs_flagged` | freshness_and_privacy |
| `freshness.single_upstream_source_derived_not_primary` | freshness_and_privacy |
| `privacy.stored_privately` | freshness_and_privacy |
| `privacy.access_limited` | freshness_and_privacy |
| `privacy.contact_handling_rules_complied` | freshness_and_privacy |
| `privacy.third_party_personal_data_included` (gates the lawful-basis check below) | freshness_and_privacy |
| `privacy.lawful_basis_established` (required when third-party personal data is included; otherwise the check passes as not applicable) | freshness_and_privacy |

No check is computed from a numeric value, because the skill
states no numeric threshold, limit, expiry period, or scoring
formula — and none is invented. Dates and review dates are checked
for declared presence only, never compared against a clock; that
would import a threshold the skill does not state and would break
determinism.

The verdict is one of `PACK_SOUND` (all 29 checks pass),
`PACK_NOT_SOUND` (any check fails — the skill's red lines: never
export secrets or PII unredacted; never hand-maintain a derived
pack silently; every pack carries date + source), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: scope_declaration, redaction,
structure_and_manifest, reproducibility_and_signing,
handoff_dossier, freshness_and_privacy.

## Honest scoping

This atom audits **declared** evidence about a context pack — it
does not open the pack, inspect its files, run a secret scanner,
verify a signature, check a git history, or test the runbook with
a fresh agent. A pack is sound *on the caller's declared
evidence*: a pack that declares a clean automated-and-manual
redaction scan passes that check even if the actual pack still
contains an unredacted secret. It is a packaging verdict over
declarations, not a redaction service, not a scanner, and not a
guarantee that the receiving agent can operate from the pack.

Named exclusions: no check of *what* travels beyond the scope
being declared (the skill names the categories — config / rules /
skills / state summaries / dossiers — but sets no per-category
rule, so none is invented); no freshness arithmetic (the skill
requires expiry/review dates and stale-flagging, but states no
number of days, so no pack is failed for its age); no verification
that a declared lawful basis is legally sufficient, only that one
is established when third-party personal data is included; no
judgment of dossier quality beyond the five contents the skill
names (goals, current state, open loops, contact/protocol rules,
first tasks) being declared complete.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python oracle
and TypeScript port built and parity-proven locally; no endpoint is
live. Release happens one by one, by the owner's GO, per the approved
queue.

## Named doubt (from the register)

Redaction deliverable could reach A
