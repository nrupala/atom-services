# Confidential computing design — `confidential-computing-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Use enclaves and TEEs properly — threat models, attestation, sealed data, honest claims, hybrid designs.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Enclave product design reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Boundary with `encryption-claim-audit`

The live `encryption-claim-audit` atom audits encryption **claims** — algorithms, modes, key lengths, KDFs, TLS and at-rest/in-use encryption posture as declared. This atom is different: it audits a confidential-computing **design record** — data-*in-use* protection as declared: the threat model, the TEE technology selection, attestation verification, sealed-key and enclave patterns, engineering discipline, key release/recovery design, and claims discipline for the enclave itself. A design can pass here and still carry unsound encryption claims there, and vice versa; neither atom's verdict substitutes for the other's.

## Inputs — the confidential-computing-design manifest

This atom does not design a confidential-computing system and exercises no security judgment. The caller submits one JSON manifest declaring a confidential-computing design record — its threat model, its technology selection, its attestation record, its enclave patterns and trusted-codebase accounting, its engineering discipline, its key-management record, and its claims record — and the atom validates that artifact deterministically. Every field below is read by the named section's checks. A field **absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (`CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `threat_model.documented` | threat_model |
| `threat_model.protects_against` (list of strings; computed, see below) | threat_model |
| `threat_model.does_not_protect_against` (list of strings; computed, see below) | threat_model |
| `threat_model.claims_require_threat_model` | threat_model |
| `technology.name` (string; must be non-empty to pass; validated as a string only, never enum-checked — see computed checks) | technology_selection |
| `technology.distinctions_considered` | technology_selection |
| `technology.chosen_by_workload_shape` | technology_selection |
| `technology.chosen_by_available_hardware` | technology_selection |
| `attestation.verification_implemented` | attestation |
| `attestation.verification_tested` | attestation |
| `attestation.measurement_verified` | attestation |
| `attestation.fresh_nonce_verified` | attestation |
| `attestation.verified_before_trusting` | attestation |
| `enclave.sealed_keys_bound_to_identity_or_measurement` | enclave_patterns |
| `enclave.attested_tls_used` | enclave_patterns |
| `enclave.surface_area_minimized` | enclave_patterns |
| `enclave.trusted_components` (list of trusted-component entries; absent / not a list / empty = both computed trusted-codebase checks missing) | enclave_patterns |
| `enclave.trusted_components[].name` (string; must be non-empty for the entry to be complete) | enclave_patterns |
| `enclave.trusted_components[].trusted_lines` (number) | enclave_patterns |
| `enclave.declared_trusted_codebase_lines` (number; declared, re-derived, see below) | enclave_patterns |
| `enclave.debug_enabled_in_production` (must be `false` to pass — skill red line) | enclave_patterns |
| `engineering.reproducible_builds` | engineering_discipline |
| `engineering.signed_enclave_images` | engineering_discipline |
| `engineering.measurements_versioned_and_pinned` | engineering_discipline |
| `engineering.real_attestation_in_ci_or_staging` | engineering_discipline |
| `engineering.fallback_documented` | engineering_discipline |
| `engineering.silent_downgrade_used` (must be `false` to pass — skill method step 5) | engineering_discipline |
| `keys.sealed_keys_tested_including_recovery` | key_management |
| `keys.root_keys_stored_unsealed_beside_enclave` (must be `false` to pass — skill red line) | key_management |
| `keys.rotation_designed` | key_management |
| `keys.recovery_designed` | key_management |
| `keys.measurement_changes_invalidating_seals_documented` | key_management |
| `claims.claims_match_evidence` | claims_discipline |
| `claims.marketing_mechanism_audit_done` | claims_discipline |
| `claims.public_exclusions` (list of strings; computed, see below) | claims_discipline |
| `claims.unverifiable_secure_enclave_claims_made` (must be `false` to pass — skill red line) | claims_discipline |
| `claims.regulatory_compliance_paired_where_required` | claims_discipline |

Five checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Threat-model protects coverage:** the skill's method step 1
  names what the TEE protects against — host access, operator
  poking, co-tenants. The declared
  `threat_model.protects_against` list therefore passes only
  when it contains all three stated entries (`host_access`,
  `operator_access`, `co_tenant_access`); unknown entries do
  not count toward coverage. A missing list is missing
  evidence; an empty list is present and fails. The output
  reports the omitted stated entries as
  `threat_protects_not_covered` (null when no list is declared).
- **Threat-model exclusions coverage:** the skill's method
  step 1 names what the TEE does NOT protect against — side
  channels, supply chain, flawed enclave code, unsealed
  inputs/outputs. The declared
  `threat_model.does_not_protect_against` list therefore passes
  only when it contains all four stated entries
  (`side_channels`, `supply_chain`, `flawed_enclave_code`,
  `unsealed_inputs_outputs`), with the same missing/empty
  semantics. The output reports the omitted stated entries as
  `threat_exclusions_not_covered` (null when no list is
  declared).
- **Trusted-component entries:** every entry of
  `enclave.trusted_components` must carry a non-empty `name`
  string and a numeric `trusted_lines`. A missing or empty list
  is missing evidence; an incomplete entry makes both
  trusted-codebase checks missing (the total cannot be
  re-derived). The output reports `components_evaluated` (the
  count of complete entries).
- **Trusted-codebase total:** the skill's method step 4 calls
  for "minimal enclave surface area (small trusted codebase)".
  The declared `enclave.declared_trusted_codebase_lines`
  therefore passes only when it equals the sum of the declared
  `enclave.trusted_components[].trusted_lines`. The skill
  states **no maximum trusted-codebase size**, so no size is
  judged — only the arithmetic is re-derived. The output
  reports `computed_trusted_codebase_lines` and
  `trusted_codebase_difference` (declared minus computed, null
  when either cannot be computed).
- **Public-exclusions coverage:** the skill's method step 7
  requires exclusions to be listed publicly ("what the enclave
  doesn't cover"). The declared `claims.public_exclusions` list
  therefore passes only when it contains all four exclusions
  the skill names in step 1 (the same four entries as the
  threat-model exclusions check), with the same missing/empty
  semantics. The output reports the omitted stated entries as
  `claims_exclusions_not_listed` (null when no list is
  declared).

All coverage-list entries and the technology name are validated
as strings only, never enum-checked — coverage is a verdict
check, not a type error, and the skill names its technologies
(Intel TDX, AMD SEV-SNP, SGX, ARM CCA/TrustZone) as distinctions
to know, not as a closed list of permitted choices, so
`technology.name` passes on any non-empty string.

**Fixed serialization rule:** computed amounts are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five computed checks cannot be completed).

The verdict is one of `CONFIDENTIAL_COMPUTING_DESIGN_READY`
(all 35 checks pass),
`CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: threat_model, technology_selection,
attestation, enclave_patterns, engineering_discipline,
key_management, claims_discipline.

## Thresholds declined — named explicitly

The skill states no number for any of the following, so this
atom imposes none and names the omission instead of inventing
one:

- **No maximum trusted-codebase size.** Step 4 says "small
  trusted codebase" with no line count; only the declared
  total's arithmetic is re-derived.
- **No attestation-freshness window.** Step 3 says the nonce
  must be "fresh!" with no maximum age in seconds; freshness is
  checked only as the caller's declaration
  (`attestation.fresh_nonce_verified`), never against a clock
  or an invented age limit — this core has no clock dependence
  by design.
- **No closed technology list.** Step 2 names TDX, SEV-SNP, SGX
  and ARM CCA/TrustZone as distinctions to know, not as the
  only permitted technologies; the name is never enum-checked.
- **No side-channel, supply-chain or enclave-code quality
  bar.** The skill lists these as exclusions to declare, not as
  properties this atom can grade; only that they are declared
  as not-protected (and publicly listed) is checked.

## Honest scoping

This atom audits a **declared** confidential-computing design
record — it does not design an enclave, run attestation, verify
a quote, inspect enclave code, verify that a declared value is
true, or audit encryption claims (that is the separate
`encryption-claim-audit` atom — see the boundary above). An
artifact is ready *on the caller's declared evidence* even if
its underlying design is weak. It is a completeness and
consistency audit, **not a security review**: it never decides
whether the threat model is the right one, whether the chosen
TEE fits the workload, whether attestation is correctly
implemented (only that implementation and testing are
declared), whether the trusted codebase is actually small (no
size threshold is stated, so none is imposed), or whether data
in use is actually protected.

Named exclusions: no live attestation or quote verification; no
enclave code review or measurement recomputation; no
side-channel testing; no verification of any declared seal,
signature, build reproducibility or hardware capability; no
encryption algorithm, mode, key-length or TLS claim audit (the
`encryption-claim-audit` atom's scope).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
