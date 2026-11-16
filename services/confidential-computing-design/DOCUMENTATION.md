# Confidential computing design — `confidential-computing-design`

**Display name:** Confidential computing design · **Slug:** `confidential-computing-design` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "confidential-computing-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "secure-enclave-v1" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/confidential-computing-design` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CONFIDENTIAL_COMPUTING_DESIGN_READY` — 35 pass, 0 fail, 0 missing of 35 checks across seven sections. Recorded computed values: `components_evaluated = 1`; `computed_trusted_codebase_lines = 100.000000 (sum 100)`; `trusted_codebase_difference = 0.000000 (declared 100 - computed 100)`; `threat_protects_not_covered = []`; `threat_exclusions_not_covered = []`; `claims_exclusions_not_listed = []`; `computed_status = within_stated_limits_on_declared_evidence`.
   Why it passes, in the tester's recorded words: All fields present and valid; arithmetic matches; red lines respected.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "confidential-computing-design"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/confidential-computing-design` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/confidential-computing-design` with the same `Authorization: Bearer <key>` header and call the tool `confidential_computing_design` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 35 missing of 35 checks across seven sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` — 31 pass, 4 fail, 0 missing of 35 checks across seven sections. The failing checks were exactly: `trusted_codebase_total_matches_component_sum`, `production_debug_disabled`, `root_keys_never_stored_unsealed`, `no_unverifiable_secure_enclave_claims`. Recorded case notes: Full manifest identical to full-pass except four planted violations: debug_enabled_in_production=true, declared_trusted_codebase_lines=50 vs computed 100, root_keys_stored_unsealed_beside_enclave=true, unverifiable_secure_enclave_claims_made=true.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `enclave.declared_trusted_codebase_lines` with detail "enclave.declared_trusted_codebase_lines must be a number" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/confidential-computing-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/confidential-computing-design` — tool name `confidential_computing_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `threat_model.documented` | boolean | threat_model |  |
| `threat_model.protects_against` | list of strings | threat_model | list of strings; computed, see below |
| `threat_model.does_not_protect_against` | list of strings | threat_model | list of strings; computed, see below |
| `threat_model.claims_require_threat_model` | boolean | threat_model |  |
| `technology.name` | string | technology_selection | string; must be non-empty to pass; validated as a string only, never enum-checked — see computed checks |
| `technology.distinctions_considered` | boolean | technology_selection |  |
| `technology.chosen_by_workload_shape` | boolean | technology_selection |  |
| `technology.chosen_by_available_hardware` | boolean | technology_selection |  |
| `attestation.verification_implemented` | boolean | attestation |  |
| `attestation.verification_tested` | boolean | attestation |  |
| `attestation.measurement_verified` | boolean | attestation |  |
| `attestation.fresh_nonce_verified` | boolean | attestation |  |
| `attestation.verified_before_trusting` | boolean | attestation |  |
| `enclave.sealed_keys_bound_to_identity_or_measurement` | boolean | enclave_patterns |  |
| `enclave.attested_tls_used` | boolean | enclave_patterns |  |
| `enclave.surface_area_minimized` | boolean | enclave_patterns |  |
| `enclave.trusted_components` | list of trusted-component entries | enclave_patterns | list of trusted-component entries; absent / not a list / empty = both computed trusted-codebase checks missing |
| `enclave.trusted_components[].name` | string | enclave_patterns | string; must be non-empty for the entry to be complete |
| `enclave.trusted_components[].trusted_lines` | number | enclave_patterns | number |
| `enclave.declared_trusted_codebase_lines` | number | enclave_patterns | number; declared, re-derived, see below |
| `enclave.debug_enabled_in_production` | boolean | enclave_patterns | must be `false` to pass — skill red line |
| `engineering.reproducible_builds` | boolean | engineering_discipline |  |
| `engineering.signed_enclave_images` | boolean | engineering_discipline |  |
| `engineering.measurements_versioned_and_pinned` | boolean | engineering_discipline |  |
| `engineering.real_attestation_in_ci_or_staging` | boolean | engineering_discipline |  |
| `engineering.fallback_documented` | boolean | engineering_discipline |  |
| `engineering.silent_downgrade_used` | boolean | engineering_discipline | must be `false` to pass — skill method step 5 |
| `keys.sealed_keys_tested_including_recovery` | boolean | key_management |  |
| `keys.root_keys_stored_unsealed_beside_enclave` | boolean | key_management | must be `false` to pass — skill red line |
| `keys.rotation_designed` | boolean | key_management |  |
| `keys.recovery_designed` | boolean | key_management |  |
| `keys.measurement_changes_invalidating_seals_documented` | boolean | key_management |  |
| `claims.claims_match_evidence` | boolean | claims_discipline |  |
| `claims.marketing_mechanism_audit_done` | boolean | claims_discipline |  |
| `claims.public_exclusions` | list of strings | claims_discipline | list of strings; computed, see below |
| `claims.unverifiable_secure_enclave_claims_made` | boolean | claims_discipline | must be `false` to pass — skill red line |
| `claims.regulatory_compliance_paired_where_required` | boolean | claims_discipline |  |

### Checks

All 35 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `threat_model` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `threat_model_documented` | quality gate: the threat model is documented — protects / doesn't protect |
| `threat_protects_against_covers_stated` | method step 1: the declared protects-against list covers what the skill names — host access, operator poking, co-tenants |
| `threat_does_not_protect_against_covers_stated` | method step 1: the declared does-not-protect list covers what the skill names — side channels, supply chain, flawed enclave code, unsealed inputs/outputs |
| `claims_require_threat_model` | method step 1: no model, no claim — claims are gated on the threat model |

#### Section: `technology_selection` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `technology_named` | method step 2: the chosen TEE technology is named (validated as a string only, never enum-checked — the skill names examples, not a closed list) |
| `technology_distinctions_considered` | method step 2: the VM-level vs process-level vs ARM CCA/TZ distinctions are considered |
| `technology_chosen_by_workload_shape` | method step 2: the technology is chosen by workload shape |
| `technology_chosen_by_available_hardware` | method step 2: the technology is chosen by available hardware |

#### Section: `attestation` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `attestation_verification_implemented` | quality gate: attestation verification is implemented |
| `attestation_verification_tested` | quality gate: attestation verification is tested |
| `quote_measurement_verified` | method step 3: the quote measurement is verified |
| `fresh_nonce_verified` | method step 3: the nonce is fresh — quotes are verified with a fresh nonce |
| `attestation_verified_before_trusting` | method step 3: quotes are verified before trusting an enclave |

#### Section: `enclave_patterns` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `sealed_keys_bound_to_identity_or_measurement` | method step 4: sealed storage — keys are bound to enclave identity/measurement |
| `attested_tls_secure_channels` | method step 4: secure channels use attested TLS |
| `enclave_surface_area_minimized` | method step 4: the enclave surface area is minimal — a small trusted codebase |
| `trusted_component_entries_complete` | every trusted component carries a name and a trusted_lines count |
| `trusted_codebase_total_matches_component_sum` | method step 4: the declared total trusted-codebase lines equal the sum of the declared trusted components' lines (minimal enclave surface area; no maximum size is stated by the skill, so no size is judged here) |
| `production_debug_disabled` | red line: no production debug mode — debug is disabled everywhere in prod |

#### Section: `engineering_discipline` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `reproducible_builds` | method step 5: enclave builds are reproducible |
| `enclave_images_signed` | method step 5: enclave images are signed |
| `measurements_versioned_and_pinned` | method step 5: measurements are versioned and pinned |
| `real_attestation_in_ci_or_staging` | method step 5: real attestation is exercised in CI/staging where possible (a simulator is used in dev) |
| `hardware_absent_fallback_documented` | method step 5: the fallback if hardware is absent is documented |
| `fallback_never_silent_downgrade` | method step 5: a hardware-absent downgrade is explicit, never silent |

#### Section: `key_management` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `sealed_keys_tested_including_recovery` | quality gate: sealed keys are tested, including the recovery path |
| `root_keys_never_stored_unsealed` | red line: root keys are never stored unsealed beside the enclave |
| `key_rotation_designed` | method step 6: key rotation is designed |
| `key_recovery_designed` | method step 6: key recovery is designed — user data is not bricked if the enclave dies |
| `measurement_changes_invalidating_seals_documented` | method step 6: measurement changes that invalidate seals are documented |

#### Section: `claims_discipline` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `claims_match_evidence` | quality gate: claims match evidence |
| `marketing_mechanism_audit_done` | method step 7: a marketing-to-mechanism audit is done |
| `public_exclusions_cover_stated_exclusions` | method step 7: the publicly listed exclusions cover what the enclave doesn't cover — side channels, supply chain, flawed enclave code, unsealed inputs/outputs |
| `no_unverifiable_secure_enclave_claims` | red line: no unverifiable 'secure enclave' claims are made |
| `regulatory_compliance_paired_where_required` | method step 7: regulatory compliance is paired where required |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`confidential-computing-design`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 35 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `components_evaluated` — Computed/reported field; recorded full-pass value: `1`.
- `computed_trusted_codebase_lines` — Computed/reported field; recorded full-pass value: `"100.000000"`.
- `trusted_codebase_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `threat_protects_not_covered` — Computed/reported field; recorded full-pass value: `[]`.
- `threat_exclusions_not_covered` — Computed/reported field; recorded full-pass value: `[]`.
- `claims_exclusions_not_listed` — Computed/reported field; recorded full-pass value: `[]`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `components_evaluated` (count of complete trusted-component entries), `computed_trusted_codebase_lines` and `trusted_codebase_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `threat_protects_not_covered`, `threat_exclusions_not_covered` and `claims_exclusions_not_listed` (omitted stated entries, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `CONFIDENTIAL_COMPUTING_DESIGN_READY` — every check passes; the design record is complete and internally consistent on the declared evidence.
- `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `components_evaluated` — reported as in the recorded responses (full-pass value `1`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_trusted_codebase_lines` — reported as in the recorded responses (full-pass value `"100.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `trusted_codebase_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `threat_protects_not_covered` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `threat_exclusions_not_covered` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `claims_exclusions_not_listed` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "enclave.declared_trusted_codebase_lines", "detail": "enclave.declared_trusted_codebase_lines must be a number"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a confidential-computing design record — its threat model, TEE technology selection, attestation record, enclave patterns and trusted-codebase accounting, engineering discipline, key-management record and claims record. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **CONFIDENTIAL_COMPUTING_DESIGN_READY**, **CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not design an enclave, run attestation, verify a quote, inspect enclave code, or audit encryption claims (that is the separate `encryption-claim-audit` atom). Computed checks: the protects-against list must cover `host_access`, `operator_access`, `co_tenant_access`; the does-not-protect list and the public exclusions must each cover `side_channels`, `supply_chain`, `flawed_enclave_code`, `unsealed_inputs_outputs`; every trusted component must carry a non-empty name and a numeric line count; and the declared trusted-codebase total must equal the sum of the component lines (no maximum size is imposed — only the arithmetic is re-derived). The technology name is validated as a non-empty string only, never enum-checked, and no attestation-freshness window is imposed. Same manifest in → same verdict out.

**Computed checks.** Five checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **Threat-model protects coverage:** the skill's method step 1 names what the TEE protects against — host access, operator poking, co-tenants. The declared `threat_model.protects_against` list therefore passes only when it contains all three stated entries (`host_access`, `operator_access`, `co_tenant_access`); unknown entries do not count toward coverage. A missing list is missing evidence; an empty list is present and fails. The output reports the omitted stated entries as `threat_protects_not_covered` (null when no list is declared).
- **Threat-model exclusions coverage:** the skill's method step 1 names what the TEE does NOT protect against — side channels, supply chain, flawed enclave code, unsealed inputs/outputs. The declared `threat_model.does_not_protect_against` list therefore passes only when it contains all four stated entries (`side_channels`, `supply_chain`, `flawed_enclave_code`, `unsealed_inputs_outputs`), with the same missing/empty semantics. The output reports the omitted stated entries as `threat_exclusions_not_covered` (null when no list is declared).
- **Trusted-component entries:** every entry of `enclave.trusted_components` must carry a non-empty `name` string and a numeric `trusted_lines`. A missing or empty list is missing evidence; an incomplete entry makes both trusted-codebase checks missing (the total cannot be re-derived). The output reports `components_evaluated` (the count of complete entries).
- **Trusted-codebase total:** the skill's method step 4 calls for "minimal enclave surface area (small trusted codebase)". The declared `enclave.declared_trusted_codebase_lines` therefore passes only when it equals the sum of the declared `enclave.trusted_components[].trusted_lines`. The skill states **no maximum trusted-codebase size**, so no size is judged — only the arithmetic is re-derived. The output reports `computed_trusted_codebase_lines` and `trusted_codebase_difference` (declared minus computed, null when either cannot be computed).
- **Public-exclusions coverage:** the skill's method step 7 requires exclusions to be listed publicly ("what the enclave doesn't cover"). The declared `claims.public_exclusions` list therefore passes only when it contains all four exclusions the skill names in step 1 (the same four entries as the threat-model exclusions check), with the same missing/empty semantics. The output reports the omitted stated entries as `claims_exclusions_not_listed` (null when no list is declared).

All coverage-list entries and the technology name are validated as strings only, never enum-checked — coverage is a verdict check, not a type error, and the skill names its technologies (Intel TDX, AMD SEV-SNP, SGX, ARM CCA/TrustZone) as distinctions to know, not as a closed list of permitted choices, so `technology.name` passes on any non-empty string.

**Fixed serialization rule:** computed amounts are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `CONFIDENTIAL_COMPUTING_DESIGN_READY`. The verdict is one of `CONFIDENTIAL_COMPUTING_DESIGN_READY` (all 35 checks pass), `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across seven sections: threat_model, technology_selection, attestation, enclave_patterns, engineering_discipline, key_management, claims_discipline.

**What it does NOT do.**

*Thresholds declined — named explicitly (from SERVICE.md):*

The skill states no number for any of the following, so this atom imposes none and names the omission instead of inventing one:

- **No maximum trusted-codebase size.** Step 4 says "small trusted codebase" with no line count; only the declared total's arithmetic is re-derived.
- **No attestation-freshness window.** Step 3 says the nonce must be "fresh!" with no maximum age in seconds; freshness is checked only as the caller's declaration (`attestation.fresh_nonce_verified`), never against a clock or an invented age limit — this core has no clock dependence by design.
- **No closed technology list.** Step 2 names TDX, SEV-SNP, SGX and ARM CCA/TrustZone as distinctions to know, not as the only permitted technologies; the name is never enum-checked.
- **No side-channel, supply-chain or enclave-code quality bar.** The skill lists these as exclusions to declare, not as properties this atom can grade; only that they are declared as not-protected (and publicly listed) is checked.

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** confidential-computing design record — it does not design an enclave, run attestation, verify a quote, inspect enclave code, verify that a declared value is true, or audit encryption claims (that is the separate `encryption-claim-audit` atom — see the boundary above). An artifact is ready *on the caller's declared evidence* even if its underlying design is weak. It is a completeness and consistency audit, **not a security review**: it never decides whether the threat model is the right one, whether the chosen TEE fits the workload, whether attestation is correctly implemented (only that implementation and testing are declared), whether the trusted codebase is actually small (no size threshold is stated, so none is imposed), or whether data in use is actually protected.

Named exclusions: no live attestation or quote verification; no enclave code review or measurement recomputation; no side-channel testing; no verification of any declared seal, signature, build reproducibility or hardware capability; no encryption algorithm, mode, key-length or TLS claim audit (the `encryption-claim-audit` atom's scope).

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **Enclave product design reviews**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/confidential_computing_design.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_confidential_computing_design.py` — 46 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/confidential-computing-design` and MCP `POST /mcp/confidential-computing-design` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

This atom is compliance-facing — its verdict is security/privacy design evidence over a declared confidential-computing design record. What a regulator or auditor gets: a deterministic, reproducible verdict (`CONFIDENTIAL_COMPUTING_DESIGN_READY` / `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY` / `INSUFFICIENT_EVIDENCE`) across seven sections — threat model, technology selection, attestation, enclave patterns, engineering discipline, key management and claims discipline — with a per-check evidence line for all 35 checks, a plain-text `stamp` for audit files, and the recorded battery in TEST-REPORT.md / `verification/work/confidential-computing-design/evidence.json`. The manifest itself carries the regulatory-pairing declaration (`claims.regulatory_compliance_paired_where_required`).

Limits that bind its evidentiary weight, stated plainly: the atom audits **declared** evidence only — it does not run attestation, verify a quote, inspect enclave code, or verify that any declared value is true (see Explanation, *What it does NOT do*). The verdict is design-record evidence, not a certification, not an attestation result, and not a compliance determination.

## Worked examples

Provenance: recorded 2026-11-16T02:00:48.684613+00:00 against gateway v1.1.0, external verification lane, source `verification/work/confidential-computing-design/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "entity": "secure-enclave-v1",
  "threat_model": {
    "documented": true,
    "protects_against": [
      "host_access",
      "operator_access",
      "co_tenant_access"
    ],
    "does_not_protect_against": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "claims_require_threat_model": true
  },
  "technology": {
    "name": "Intel TDX",
    "distinctions_considered": true,
    "chosen_by_workload_shape": true,
    "chosen_by_available_hardware": true
  },
  "attestation": {
    "verification_implemented": true,
    "verification_tested": true,
    "measurement_verified": true,
    "fresh_nonce_verified": true,
    "verified_before_trusting": true
  },
  "enclave": {
    "sealed_keys_bound_to_identity_or_measurement": true,
    "attested_tls_used": true,
    "surface_area_minimized": true,
    "trusted_components": [
      {
        "name": "core-logic",
        "trusted_lines": 100
      }
    ],
    "declared_trusted_codebase_lines": 100,
    "debug_enabled_in_production": false
  },
  "engineering": {
    "reproducible_builds": true,
    "signed_enclave_images": true,
    "measurements_versioned_and_pinned": true,
    "real_attestation_in_ci_or_staging": true,
    "fallback_documented": true,
    "silent_downgrade_used": false
  },
  "keys": {
    "sealed_keys_tested_including_recovery": true,
    "root_keys_stored_unsealed_beside_enclave": false,
    "rotation_designed": true,
    "recovery_designed": true,
    "measurement_changes_invalidating_seals_documented": true
  },
  "claims": {
    "claims_match_evidence": true,
    "marketing_mechanism_audit_done": true,
    "public_exclusions": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "unverifiable_secure_enclave_claims_made": false,
    "regulatory_compliance_paired_where_required": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "confidential-computing-design",
  "atom_version": "0.1.0",
  "entity": "secure-enclave-v1",
  "verdict": "CONFIDENTIAL_COMPUTING_DESIGN_READY",
  "sections": {
    "threat_model": "pass",
    "technology_selection": "pass",
    "attestation": "pass",
    "enclave_patterns": "pass",
    "engineering_discipline": "pass",
    "key_management": "pass",
    "claims_discipline": "pass"
  },
  "checks": [
    {
      "section": "threat_model",
      "check": "threat_model_documented",
      "status": "pass",
      "evidence": "quality gate: the threat model is documented — protects / doesn't protect"
    },
    {
      "section": "threat_model",
      "check": "threat_protects_against_covers_stated",
      "status": "pass",
      "evidence": "method step 1: the declared protects-against list covers what the skill names — host access, operator poking, co-tenants"
    },
    {
      "section": "threat_model",
      "check": "threat_does_not_protect_against_covers_stated",
      "status": "pass",
      "evidence": "method step 1: the declared does-not-protect list covers what the skill names — side channels, supply chain, flawed enclave code, unsealed inputs/outputs"
    },
    {
      "section": "threat_model",
      "check": "claims_require_threat_model",
      "status": "pass",
      "evidence": "method step 1: no model, no claim — claims are gated on the threat model"
    },
    {
      "section": "technology_selection",
      "check": "technology_named",
      "status": "pass",
      "evidence": "method step 2: the chosen TEE technology is named (validated as a string only, never enum-checked — the skill names examples, not a closed list)"
    },
    {
      "section": "technology_selection",
      "check": "technology_distinctions_considered",
      "status": "pass",
      "evidence": "method step 2: the VM-level vs process-level vs ARM CCA/TZ distinctions are considered"
    },
    {
      "section": "technology_selection",
      "check": "technology_chosen_by_workload_shape",
      "status": "pass",
      "evidence": "method step 2: the technology is chosen by workload shape"
    },
    {
      "section": "technology_selection",
      "check": "technology_chosen_by_available_hardware",
      "status": "pass",
      "evidence": "method step 2: the technology is chosen by available hardware"
    },
    {
      "section": "attestation",
      "check": "attestation_verification_implemented",
      "status": "pass",
      "evidence": "quality gate: attestation verification is implemented"
    },
    {
      "section": "attestation",
      "check": "attestation_verification_tested",
      "status": "pass",
      "evidence": "quality gate: attestation verification is tested"
    },
    {
      "section": "attestation",
      "check": "quote_measurement_verified",
      "status": "pass",
      "evidence": "method step 3: the quote measurement is verified"
    },
    {
      "section": "attestation",
      "check": "fresh_nonce_verified",
      "status": "pass",
      "evidence": "method step 3: the nonce is fresh — quotes are verified with a fresh nonce"
    },
    {
      "section": "attestation",
      "check": "attestation_verified_before_trusting",
      "status": "pass",
      "evidence": "method step 3: quotes are verified before trusting an enclave"
    },
    {
      "section": "enclave_patterns",
      "check": "sealed_keys_bound_to_identity_or_measurement",
      "status": "pass",
      "evidence": "method step 4: sealed storage — keys are bound to enclave identity/measurement"
    },
    {
      "section": "enclave_patterns",
      "check": "attested_tls_secure_channels",
      "status": "pass",
      "evidence": "method step 4: secure channels use attested TLS"
    },
    {
      "section": "enclave_patterns",
      "check": "enclave_surface_area_minimized",
      "status": "pass",
      "evidence": "method step 4: the enclave surface area is minimal — a small trusted codebase"
    },
    {
      "section": "enclave_patterns",
      "check": "trusted_component_entries_complete",
      "status": "pass",
      "evidence": "every trusted component carries a name and a trusted_lines count"
    },
    {
      "section": "enclave_patterns",
      "check": "trusted_codebase_total_matches_component_sum",
      "status": "pass",
      "evidence": "method step 4: the declared total trusted-codebase lines equal the sum of the declared trusted components' lines (minimal enclave surface area; no maximum size is stated by the skill, so no size is judged here)"
    },
    {
      "section": "enclave_patterns",
      "check": "production_debug_disabled",
      "status": "pass",
      "evidence": "red line: no production debug mode — debug is disabled everywhere in prod"
    },
    {
      "section": "engineering_discipline",
      "check": "reproducible_builds",
      "status": "pass",
      "evidence": "method step 5: enclave builds are reproducible"
    },
    {
      "section": "engineering_discipline",
      "check": "enclave_images_signed",
      "status": "pass",
      "evidence": "method step 5: enclave images are signed"
    },
    {
      "section": "engineering_discipline",
      "check": "measurements_versioned_and_pinned",
      "status": "pass",
      "evidence": "method step 5: measurements are versioned and pinned"
    },
    {
      "section": "engineering_discipline",
      "check": "real_attestation_in_ci_or_staging",
      "status": "pass",
      "evidence": "method step 5: real attestation is exercised in CI/staging where possible (a simulator is used in dev)"
    },
    {
      "section": "engineering_discipline",
      "check": "hardware_absent_fallback_documented",
      "status": "pass",
      "evidence": "method step 5: the fallback if hardware is absent is documented"
    },
    {
      "section": "engineering_discipline",
      "check": "fallback_never_silent_downgrade",
      "status": "pass",
      "evidence": "method step 5: a hardware-absent downgrade is explicit, never silent"
    },
    {
      "section": "key_management",
      "check": "sealed_keys_tested_including_recovery",
      "status": "pass",
      "evidence": "quality gate: sealed keys are tested, including the recovery path"
    },
    {
      "section": "key_management",
      "check": "root_keys_never_stored_unsealed",
      "status": "pass",
      "evidence": "red line: root keys are never stored unsealed beside the enclave"
    },
    {
      "section": "key_management",
      "check": "key_rotation_designed",
      "status": "pass",
      "evidence": "method step 6: key rotation is designed"
    },
    {
      "section": "key_management",
      "check": "key_recovery_designed",
      "status": "pass",
      "evidence": "method step 6: key recovery is designed — user data is not bricked if the enclave dies"
    },
    {
      "section": "key_management",
      "check": "measurement_changes_invalidating_seals_documented",
      "status": "pass",
      "evidence": "method step 6: measurement changes that invalidate seals are documented"
    },
    {
      "section": "claims_discipline",
      "check": "claims_match_evidence",
      "status": "pass",
      "evidence": "quality gate: claims match evidence"
    },
    {
      "section": "claims_discipline",
      "check": "marketing_mechanism_audit_done",
      "status": "pass",
      "evidence": "method step 7: a marketing-to-mechanism audit is done"
    },
    {
      "section": "claims_discipline",
      "check": "public_exclusions_cover_stated_exclusions",
      "status": "pass",
      "evidence": "method step 7: the publicly listed exclusions cover what the enclave doesn't cover — side channels, supply chain, flawed enclave code, unsealed inputs/outputs"
    },
    {
      "section": "claims_discipline",
      "check": "no_unverifiable_secure_enclave_claims",
      "status": "pass",
      "evidence": "red line: no unverifiable 'secure enclave' claims are made"
    },
    {
      "section": "claims_discipline",
      "check": "regulatory_compliance_paired_where_required",
      "status": "pass",
      "evidence": "method step 7: regulatory compliance is paired where required"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "components_evaluated": 1,
  "computed_trusted_codebase_lines": "100.000000",
  "trusted_codebase_difference": "0.000000",
  "threat_protects_not_covered": [],
  "threat_exclusions_not_covered": [],
  "claims_exclusions_not_listed": [],
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across seven sections.",
  "stamp": "CONFIDENTIAL COMPUTING DESIGN\nentity: secure-enclave-v1\nVERDICT: CONFIDENTIAL_COMPUTING_DESIGN_READY\n  threat_model                 pass\n  technology_selection         pass\n  attestation                  pass\n  enclave_patterns             pass\n  engineering_discipline       pass\n  key_management               pass\n  claims_discipline            pass\n35 pass, 0 fail, 0 missing of 35 checks across seven sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "secure-enclave-v1",
  "threat_model": {
    "documented": true,
    "protects_against": [
      "host_access",
      "operator_access",
      "co_tenant_access"
    ],
    "does_not_protect_against": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "claims_require_threat_model": true
  },
  "technology": {
    "name": "Intel TDX",
    "distinctions_considered": true,
    "chosen_by_workload_shape": true,
    "chosen_by_available_hardware": true
  },
  "attestation": {
    "verification_implemented": true,
    "verification_tested": true,
    "measurement_verified": true,
    "fresh_nonce_verified": true,
    "verified_before_trusting": true
  },
  "enclave": {
    "sealed_keys_bound_to_identity_or_measurement": true,
    "attested_tls_used": true,
    "surface_area_minimized": true,
    "trusted_components": [
      {
        "name": "core-logic",
        "trusted_lines": 100
      }
    ],
    "declared_trusted_codebase_lines": 50,
    "debug_enabled_in_production": true
  },
  "engineering": {
    "reproducible_builds": true,
    "signed_enclave_images": true,
    "measurements_versioned_and_pinned": true,
    "real_attestation_in_ci_or_staging": true,
    "fallback_documented": true,
    "silent_downgrade_used": false
  },
  "keys": {
    "sealed_keys_tested_including_recovery": true,
    "root_keys_stored_unsealed_beside_enclave": true,
    "rotation_designed": true,
    "recovery_designed": true,
    "measurement_changes_invalidating_seals_documented": true
  },
  "claims": {
    "claims_match_evidence": true,
    "marketing_mechanism_audit_done": true,
    "public_exclusions": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "unverifiable_secure_enclave_claims_made": true,
    "regulatory_compliance_paired_where_required": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "confidential-computing-design",
  "atom_version": "0.1.0",
  "entity": "secure-enclave-v1",
  "verdict": "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY",
  "sections": {
    "threat_model": "pass",
    "technology_selection": "pass",
    "attestation": "pass",
    "enclave_patterns": "fail",
    "engineering_discipline": "pass",
    "key_management": "fail",
    "claims_discipline": "fail"
  },
  "checks": [
    {
      "section": "threat_model",
      "check": "threat_model_documented",
      "status": "pass",
      "evidence": "quality gate: the threat model is documented — protects / doesn't protect"
    },
    {
      "section": "threat_model",
      "check": "threat_protects_against_covers_stated",
      "status": "pass",
      "evidence": "method step 1: the declared protects-against list covers what the skill names — host access, operator poking, co-tenants"
    },
    {
      "section": "threat_model",
      "check": "threat_does_not_protect_against_covers_stated",
      "status": "pass",
      "evidence": "method step 1: the declared does-not-protect list covers what the skill names — side channels, supply chain, flawed enclave code, unsealed inputs/outputs"
    },
    {
      "section": "threat_model",
      "check": "claims_require_threat_model",
      "status": "pass",
      "evidence": "method step 1: no model, no claim — claims are gated on the threat model"
    },
    {
      "section": "technology_selection",
      "check": "technology_named",
      "status": "pass",
      "evidence": "method step 2: the chosen TEE technology is named (validated as a string only, never enum-checked — the skill names examples, not a closed list)"
    },
    {
      "section": "technology_selection",
      "check": "technology_distinctions_considered",
      "status": "pass",
      "evidence": "method step 2: the VM-level vs process-level vs ARM CCA/TZ distinctions are considered"
    },
    {
      "section": "technology_selection",
      "check": "technology_chosen_by_workload_shape",
      "status": "pass",
      "evidence": "method step 2: the technology is chosen by workload shape"
    },
    {
      "section": "technology_selection",
      "check": "technology_chosen_by_available_hardware",
      "status": "pass",
      "evidence": "method step 2: the technology is chosen by available hardware"
    },
    {
      "section": "attestation",
      "check": "attestation_verification_implemented",
      "status": "pass",
      "evidence": "quality gate: attestation verification is implemented"
    },
    {
      "section": "attestation",
      "check": "attestation_verification_tested",
      "status": "pass",
      "evidence": "quality gate: attestation verification is tested"
    },
    {
      "section": "attestation",
      "check": "quote_measurement_verified",
      "status": "pass",
      "evidence": "method step 3: the quote measurement is verified"
    },
    {
      "section": "attestation",
      "check": "fresh_nonce_verified",
      "status": "pass",
      "evidence": "method step 3: the nonce is fresh — quotes are verified with a fresh nonce"
    },
    {
      "section": "attestation",
      "check": "attestation_verified_before_trusting",
      "status": "pass",
      "evidence": "method step 3: quotes are verified before trusting an enclave"
    },
    {
      "section": "enclave_patterns",
      "check": "sealed_keys_bound_to_identity_or_measurement",
      "status": "pass",
      "evidence": "method step 4: sealed storage — keys are bound to enclave identity/measurement"
    },
    {
      "section": "enclave_patterns",
      "check": "attested_tls_secure_channels",
      "status": "pass",
      "evidence": "method step 4: secure channels use attested TLS"
    },
    {
      "section": "enclave_patterns",
      "check": "enclave_surface_area_minimized",
      "status": "pass",
      "evidence": "method step 4: the enclave surface area is minimal — a small trusted codebase"
    },
    {
      "section": "enclave_patterns",
      "check": "trusted_component_entries_complete",
      "status": "pass",
      "evidence": "every trusted component carries a name and a trusted_lines count"
    },
    {
      "section": "enclave_patterns",
      "check": "trusted_codebase_total_matches_component_sum",
      "status": "fail",
      "evidence": "method step 4: the declared total trusted-codebase lines equal the sum of the declared trusted components' lines (minimal enclave surface area; no maximum size is stated by the skill, so no size is judged here)"
    },
    {
      "section": "enclave_patterns",
      "check": "production_debug_disabled",
      "status": "fail",
      "evidence": "red line: no production debug mode — debug is disabled everywhere in prod"
    },
    {
      "section": "engineering_discipline",
      "check": "reproducible_builds",
      "status": "pass",
      "evidence": "method step 5: enclave builds are reproducible"
    },
    {
      "section": "engineering_discipline",
      "check": "enclave_images_signed",
      "status": "pass",
      "evidence": "method step 5: enclave images are signed"
    },
    {
      "section": "engineering_discipline",
      "check": "measurements_versioned_and_pinned",
      "status": "pass",
      "evidence": "method step 5: measurements are versioned and pinned"
    },
    {
      "section": "engineering_discipline",
      "check": "real_attestation_in_ci_or_staging",
      "status": "pass",
      "evidence": "method step 5: real attestation is exercised in CI/staging where possible (a simulator is used in dev)"
    },
    {
      "section": "engineering_discipline",
      "check": "hardware_absent_fallback_documented",
      "status": "pass",
      "evidence": "method step 5: the fallback if hardware is absent is documented"
    },
    {
      "section": "engineering_discipline",
      "check": "fallback_never_silent_downgrade",
      "status": "pass",
      "evidence": "method step 5: a hardware-absent downgrade is explicit, never silent"
    },
    {
      "section": "key_management",
      "check": "sealed_keys_tested_including_recovery",
      "status": "pass",
      "evidence": "quality gate: sealed keys are tested, including the recovery path"
    },
    {
      "section": "key_management",
      "check": "root_keys_never_stored_unsealed",
      "status": "fail",
      "evidence": "red line: root keys are never stored unsealed beside the enclave"
    },
    {
      "section": "key_management",
      "check": "key_rotation_designed",
      "status": "pass",
      "evidence": "method step 6: key rotation is designed"
    },
    {
      "section": "key_management",
      "check": "key_recovery_designed",
      "status": "pass",
      "evidence": "method step 6: key recovery is designed — user data is not bricked if the enclave dies"
    },
    {
      "section": "key_management",
      "check": "measurement_changes_invalidating_seals_documented",
      "status": "pass",
      "evidence": "method step 6: measurement changes that invalidate seals are documented"
    },
    {
      "section": "claims_discipline",
      "check": "claims_match_evidence",
      "status": "pass",
      "evidence": "quality gate: claims match evidence"
    },
    {
      "section": "claims_discipline",
      "check": "marketing_mechanism_audit_done",
      "status": "pass",
      "evidence": "method step 7: a marketing-to-mechanism audit is done"
    },
    {
      "section": "claims_discipline",
      "check": "public_exclusions_cover_stated_exclusions",
      "status": "pass",
      "evidence": "method step 7: the publicly listed exclusions cover what the enclave doesn't cover — side channels, supply chain, flawed enclave code, unsealed inputs/outputs"
    },
    {
      "section": "claims_discipline",
      "check": "no_unverifiable_secure_enclave_claims",
      "status": "fail",
      "evidence": "red line: no unverifiable 'secure enclave' claims are made"
    },
    {
      "section": "claims_discipline",
      "check": "regulatory_compliance_paired_where_required",
      "status": "pass",
      "evidence": "method step 7: regulatory compliance is paired where required"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "components_evaluated": 1,
  "computed_trusted_codebase_lines": "100.000000",
  "trusted_codebase_difference": "-50.000000",
  "threat_protects_not_covered": [],
  "threat_exclusions_not_covered": [],
  "claims_exclusions_not_listed": [],
  "summary": "31 pass, 4 fail, 0 missing of 35 checks across seven sections.",
  "stamp": "CONFIDENTIAL COMPUTING DESIGN\nentity: secure-enclave-v1\nVERDICT: CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY\n  threat_model                 pass\n  technology_selection         pass\n  attestation                  pass\n  enclave_patterns             fail\n  engineering_discipline       pass\n  key_management               fail\n  claims_discipline            fail\n31 pass, 4 fail, 0 missing of 35 checks across seven sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "entity": "malformed-test",
  "enclave": {
    "declared_trusted_codebase_lines": "one hundred"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "enclave.declared_trusted_codebase_lines",
  "detail": "enclave.declared_trusted_codebase_lines must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — compliance-facing (privacy/security design evidence) |
| Checks named: documented vs recorded | 35 / 35 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 38 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **Yes** — this atom is compliance-facing: it audits a confidential-computing (privacy/security) design record — threat model, attestation, key management and claims discipline, including the field `claims.regulatory_compliance_paired_where_required` — so its verdict serves as security/privacy design evidence.
