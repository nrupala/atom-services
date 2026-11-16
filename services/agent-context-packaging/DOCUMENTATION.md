# Agent context packaging — `agent-context-packaging`

**Display name:** Agent context packaging · **Slug:** `agent-context-packaging` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "agent-context-packaging"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the context-pack manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `pack` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/agent-context-packaging` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `PACK_SOUND` — 29 pass, 0 fail, 0 missing of 29 checks across six sections. The pack is declared a handoff dossier (`handoff.is_handoff_dossier: true`), so the gated dossier-contents check applies and passes. Third-party personal data is declared not included (`privacy.third_party_personal_data_included: false`), so the lawful-basis check passes as not applicable.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "agent-context-packaging"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/agent-context-packaging` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/agent-context-packaging` with the same `Authorization: Bearer <key>` header and call the tool `agent_context_packaging` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `PACK_NOT_SOUND` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), the failing checks are `contacts_and_financials_excluded_by_default`, `no_unredacted_secrets_or_pii`, `not_hand_assembled` and `not_hand_maintained_silently` — i.e. contacts/financials were declared included, unredacted secrets or PII declared present, and the pack declared hand-assembled / silently hand-maintained. Fix = redact and regenerate the pack from its source of truth, exclude contacts/financials, then declare the true values and resubmit. That run also left two checks `missing` (the handoff section reported `insufficient_evidence` alongside the failures) — supply those fields too.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `scope` with detail "scope must be an object" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/agent-context-packaging` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-context-packaging` — tool name `agent_context_packaging`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `pack` | string | — | string; carried into the verdict output, not itself checked |
| `scope.what_travels_declared` | boolean | scope_declaration |  |
| `scope.recipient_declared` | boolean | scope_declaration |  |
| `scope.purpose_declared` | boolean | scope_declaration |  |
| `scope.pack_inherits_boundary` | boolean | scope_declaration |  |
| `redaction.keys_replaced_with_environment_references` | boolean | redaction |  |
| `redaction.personal_data_minimized_purpose_limited` | boolean | redaction |  |
| `redaction.contacts_or_financials_included` | boolean | redaction | must be `false` to pass — excluded by default |
| `redaction.scan_clean_automated_and_manual` | boolean | redaction |  |
| `redaction.secrets_or_pii_unredacted_present` | boolean | redaction | must be `false` to pass — skill red line |
| `manifest.manifest_present` | boolean | structure_and_manifest |  |
| `manifest.manifest_lists_contents_version_date_generator_and_source` | boolean | structure_and_manifest |  |
| `structure.stable_folder_layout` | boolean | structure_and_manifest |  |
| `structure.receiver_runbook_present` | boolean | structure_and_manifest |  |
| `structure.receiver_runbook_tested` | boolean | structure_and_manifest |  |
| `reproducibility.generated_by_script_from_source_of_truth` | boolean | reproducibility_and_signing |  |
| `reproducibility.hand_assembled` | boolean | reproducibility_and_signing | must be `false` to pass |
| `reproducibility.derived_pack_hand_maintained_silently` | boolean | reproducibility_and_signing | must be `false` to pass — skill red line |
| `reproducibility.versioned_in_git` | boolean | reproducibility_and_signing |  |
| `signing.pack_signed` | boolean | reproducibility_and_signing |  |
| `handoff.is_handoff_dossier` | boolean | handoff_dossier | gates the contents check below |
| `handoff.dossier_contents_complete` | boolean | handoff_dossier | required when the pack is a handoff dossier; otherwise the check passes as not applicable |
| `handoff.everything_dated` | boolean | handoff_dossier |  |
| `handoff.review_date_marked` | boolean | handoff_dossier |  |
| `freshness.expiry_or_review_date_present` | boolean | freshness_and_privacy |  |
| `freshness.stale_packs_flagged` | boolean | freshness_and_privacy |  |
| `freshness.single_upstream_source_derived_not_primary` | boolean | freshness_and_privacy |  |
| `privacy.stored_privately` | boolean | freshness_and_privacy |  |
| `privacy.access_limited` | boolean | freshness_and_privacy |  |
| `privacy.contact_handling_rules_complied` | boolean | freshness_and_privacy |  |
| `privacy.third_party_personal_data_included` | boolean | freshness_and_privacy | gates the lawful-basis check below |
| `privacy.lawful_basis_established` | boolean | freshness_and_privacy | required when third-party personal data is included; otherwise the check passes as not applicable |

### Checks

All 29 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `scope_declaration` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `scope_what_travels_declared` | scope declaration first: what travels (config / rules / skills / state summaries / dossiers) is written down |
| `scope_recipient_declared` | scope declaration first: to whom the pack travels is written down |
| `scope_purpose_declared` | scope declaration first: why the pack travels is written down |
| `pack_inherits_scope_boundary` | the pack inherits the declared scope boundary |
#### Section: `redaction` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `keys_replaced_with_environment_references` | redaction before anything: keys become environment references |
| `personal_data_minimized_purpose_limited` | redaction: personal data is minimized (purpose-limited) |
| `contacts_and_financials_excluded_by_default` | redaction: contacts / financials are excluded by default |
| `redaction_scan_clean_automated_and_manual` | quality gate: redaction scan clean (automated secret scanners + a manual pass); assume the receiver's storage is less protected than yours |
| `no_unredacted_secrets_or_pii` | red line: never export secrets or PII unredacted |
#### Section: `structure_and_manifest` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `manifest_present` | structure: a manifest is present |
| `manifest_lists_contents_version_date_generator_and_source` | structure: the manifest lists contents, version, date and generator; red line: every pack carries date + source |
| `stable_folder_layout` | structure: a stable folder layout, machine-readable where possible |
| `receiver_runbook_present` | structure: a README / runbook for the receiving agent is present |
| `receiver_runbook_tested` | quality gate: receiver runbook tested — a fresh agent can operate from the pack |
#### Section: `reproducibility_and_signing` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `generated_by_script_from_source_of_truth` | reproducibility: exports are generated by a script from the source of truth |
| `not_hand_assembled` | reproducibility: exports are never hand-assembled |
| `not_hand_maintained_silently` | red line: never hand-maintain a derived pack silently |
| `versioned_in_git` | reproducibility: exports are versioned in git |
| `pack_signed` | reproducibility / quality gate: the pack is signed so authenticity is checkable; stored privately |
#### Section: `handoff_dossier` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `dossier_contents_complete_when_dossier` | handoff dossiers carry goals, current state, open loops, contact/protocol rules and first tasks |
| `everything_dated` | handoff dossiers: date everything |
| `review_date_marked_against_stale_claims` | handoff dossiers: avoid stale claims — mark the review date |
#### Section: `freshness_and_privacy` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `expiry_or_review_date_present` | freshness: expiry / review dates are present |
| `stale_packs_flagged` | freshness: stale packs are flagged |
| `single_upstream_source_export_derived_not_primary` | freshness: a single upstream source — the export is derived, never the primary |
| `stored_privately` | privacy / quality gate: private repos — the pack is stored privately |
| `access_limited` | privacy: access to the pack is limited |
| `contact_handling_rules_complied` | privacy: the pack complies with contact-handling rules |
| `third_party_personal_data_lawful_basis_when_included` | no third-party personal data declared included |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `pack` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 29 per-check results: `section`, `check`, `status`, `evidence`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `PACK_SOUND` — All 29 checks pass.
- `PACK_NOT_SOUND` — At least one check fails — including the skill's red lines: never export secrets or PII unredacted; never hand-maintain a derived pack silently; every pack carries date + source.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "scope", "detail": "scope must be an object"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom audits a declared context pack — what travels, to whom and why, how it was redacted, how it is structured, how it was generated and signed, what its handoff dossier carries, and its freshness and privacy posture — across six sections. Two checks are gated: `handoff.is_handoff_dossier` gates the dossier-contents check, and `privacy.third_party_personal_data_included` gates the lawful-basis check; a gated check whose gate is closed passes as not applicable. No check is computed from a numeric value, because the skill states no numeric threshold, limit, expiry period, or scoring formula — dates and review dates are checked for declared presence only, never compared against a clock, which would import an unstated threshold and break determinism.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It audits **declared** evidence only — it does not open the pack, inspect its files, run a secret scanner, verify a signature, check a git history, or test the runbook with a fresh agent. It is a packaging verdict over declarations, not a redaction service, not a scanner, and not a guarantee that the receiving agent can operate from the pack. Named exclusions: no check of *what* travels beyond the scope being declared; no freshness arithmetic (no pack is failed for its age); no verification that a declared lawful basis is legally sufficient, only that one is established when third-party personal data is included; no judgment of dossier quality beyond the five contents the skill names (goals, current state, open loops, contact/protocol rules, first tasks) being declared complete.

**Buyer / use context.** Teams and agents handing context packs between agents who need a repeatable soundness verdict before a pack travels — the house's own workflow is agent handoff package builds. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/agent_context_packaging.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_agent_context_packaging.py — 41 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/agent-context-packaging` and MCP `POST /mcp/agent-context-packaging` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-15T23:56:03.993588+00:00 against gateway v1.1.0, external verification lane, source `verification/work/agent-context-packaging/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "pack": "agent_handoff_v1",
  "scope": {
    "what_travels_declared": true,
    "recipient_declared": true,
    "purpose_declared": true,
    "pack_inherits_boundary": true
  },
  "redaction": {
    "keys_replaced_with_environment_references": true,
    "personal_data_minimized_purpose_limited": true,
    "contacts_or_financials_included": false,
    "scan_clean_automated_and_manual": true,
    "secrets_or_pii_unredacted_present": false
  },
  "manifest": {
    "manifest_present": true,
    "manifest_lists_contents_version_date_generator_and_source": true
  },
  "structure": {
    "stable_folder_layout": true,
    "receiver_runbook_present": true,
    "receiver_runbook_tested": true
  },
  "reproducibility": {
    "generated_by_script_from_source_of_truth": true,
    "hand_assembled": false,
    "derived_pack_hand_maintained_silently": false,
    "versioned_in_git": true
  },
  "signing": {
    "pack_signed": true
  },
  "handoff": {
    "is_handoff_dossier": true,
    "dossier_contents_complete": true,
    "everything_dated": true,
    "review_date_marked": true
  },
  "freshness": {
    "expiry_or_review_date_present": true,
    "stale_packs_flagged": true,
    "single_upstream_source_derived_not_primary": true
  },
  "privacy": {
    "stored_privately": true,
    "access_limited": true,
    "contact_handling_rules_complied": true,
    "third_party_personal_data_included": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "agent-context-packaging",
  "atom_version": "0.1.0",
  "pack": "agent_handoff_v1",
  "verdict": "PACK_SOUND",
  "sections": {
    "scope_declaration": "pass",
    "redaction": "pass",
    "structure_and_manifest": "pass",
    "reproducibility_and_signing": "pass",
    "handoff_dossier": "pass",
    "freshness_and_privacy": "pass"
  },
  "checks": [
    {
      "section": "scope_declaration",
      "check": "scope_what_travels_declared",
      "status": "pass",
      "evidence": "scope declaration first: what travels (config / rules / skills / state summaries / dossiers) is written down"
    },
    {
      "section": "scope_declaration",
      "check": "scope_recipient_declared",
      "status": "pass",
      "evidence": "scope declaration first: to whom the pack travels is written down"
    },
    {
      "section": "scope_declaration",
      "check": "scope_purpose_declared",
      "status": "pass",
      "evidence": "scope declaration first: why the pack travels is written down"
    },
    {
      "section": "scope_declaration",
      "check": "pack_inherits_scope_boundary",
      "status": "pass",
      "evidence": "the pack inherits the declared scope boundary"
    },
    {
      "section": "redaction",
      "check": "keys_replaced_with_environment_references",
      "status": "pass",
      "evidence": "redaction before anything: keys become environment references"
    },
    {
      "section": "redaction",
      "check": "personal_data_minimized_purpose_limited",
      "status": "pass",
      "evidence": "redaction: personal data is minimized (purpose-limited)"
    },
    {
      "section": "redaction",
      "check": "contacts_and_financials_excluded_by_default",
      "status": "pass",
      "evidence": "redaction: contacts / financials are excluded by default"
    },
    {
      "section": "redaction",
      "check": "redaction_scan_clean_automated_and_manual",
      "status": "pass",
      "evidence": "quality gate: redaction scan clean (automated secret scanners + a manual pass); assume the receiver's storage is less protected than yours"
    },
    {
      "section": "redaction",
      "check": "no_unredacted_secrets_or_pii",
      "status": "pass",
      "evidence": "red line: never export secrets or PII unredacted"
    },
    {
      "section": "structure_and_manifest",
      "check": "manifest_present",
      "status": "pass",
      "evidence": "structure: a manifest is present"
    },
    {
      "section": "structure_and_manifest",
      "check": "manifest_lists_contents_version_date_generator_and_source",
      "status": "pass",
      "evidence": "structure: the manifest lists contents, version, date and generator; red line: every pack carries date + source"
    },
    {
      "section": "structure_and_manifest",
      "check": "stable_folder_layout",
      "status": "pass",
      "evidence": "structure: a stable folder layout, machine-readable where possible"
    },
    {
      "section": "structure_and_manifest",
      "check": "receiver_runbook_present",
      "status": "pass",
      "evidence": "structure: a README / runbook for the receiving agent is present"
    },
    {
      "section": "structure_and_manifest",
      "check": "receiver_runbook_tested",
      "status": "pass",
      "evidence": "quality gate: receiver runbook tested \u2014 a fresh agent can operate from the pack"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "generated_by_script_from_source_of_truth",
      "status": "pass",
      "evidence": "reproducibility: exports are generated by a script from the source of truth"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "not_hand_assembled",
      "status": "pass",
      "evidence": "reproducibility: exports are never hand-assembled"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "not_hand_maintained_silently",
      "status": "pass",
      "evidence": "red line: never hand-maintain a derived pack silently"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "versioned_in_git",
      "status": "pass",
      "evidence": "reproducibility: exports are versioned in git"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "pack_signed",
      "status": "pass",
      "evidence": "reproducibility / quality gate: the pack is signed so authenticity is checkable; stored privately"
    },
    {
      "section": "handoff_dossier",
      "check": "dossier_contents_complete_when_dossier",
      "status": "pass",
      "evidence": "handoff dossiers carry goals, current state, open loops, contact/protocol rules and first tasks"
    },
    {
      "section": "handoff_dossier",
      "check": "everything_dated",
      "status": "pass",
      "evidence": "handoff dossiers: date everything"
    },
    {
      "section": "handoff_dossier",
      "check": "review_date_marked_against_stale_claims",
      "status": "pass",
      "evidence": "handoff dossiers: avoid stale claims \u2014 mark the review date"
    },
    {
      "section": "freshness_and_privacy",
      "check": "expiry_or_review_date_present",
      "status": "pass",
      "evidence": "freshness: expiry / review dates are present"
    },
    {
      "section": "freshness_and_privacy",
      "check": "stale_packs_flagged",
      "status": "pass",
      "evidence": "freshness: stale packs are flagged"
    },
    {
      "section": "freshness_and_privacy",
      "check": "single_upstream_source_export_derived_not_primary",
      "status": "pass",
      "evidence": "freshness: a single upstream source \u2014 the export is derived, never the primary"
    },
    {
      "section": "freshness_and_privacy",
      "check": "stored_privately",
      "status": "pass",
      "evidence": "privacy / quality gate: private repos \u2014 the pack is stored privately"
    },
    {
      "section": "freshness_and_privacy",
      "check": "access_limited",
      "status": "pass",
      "evidence": "privacy: access to the pack is limited"
    },
    {
      "section": "freshness_and_privacy",
      "check": "contact_handling_rules_complied",
      "status": "pass",
      "evidence": "privacy: the pack complies with contact-handling rules"
    },
    {
      "section": "freshness_and_privacy",
      "check": "third_party_personal_data_lawful_basis_when_included",
      "status": "pass",
      "evidence": "no third-party personal data declared included"
    }
  ],
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections.",
  "stamp": "AGENT CONTEXT PACKAGING VERDICT\npack: agent_handoff_v1\nVERDICT: PACK_SOUND\n  scope_declaration                pass\n  redaction                        pass\n  structure_and_manifest           pass\n  reproducibility_and_signing      pass\n  handoff_dossier                  pass\n  freshness_and_privacy            pass\n29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "pack": "bad_pack",
  "scope": {
    "what_travels_declared": true,
    "recipient_declared": true,
    "purpose_declared": true,
    "pack_inherits_boundary": true
  },
  "redaction": {
    "keys_replaced_with_environment_references": true,
    "personal_data_minimized_purpose_limited": true,
    "contacts_or_financials_included": true,
    "scan_clean_automated_and_manual": true,
    "secrets_or_pii_unredacted_present": true
  },
  "manifest": {
    "manifest_present": true,
    "manifest_lists_contents_version_date_generator_and_source": true
  },
  "structure": {
    "stable_folder_layout": true,
    "receiver_runbook_present": true,
    "receiver_runbook_tested": true
  },
  "reproducibility": {
    "generated_by_script_from_source_of_truth": true,
    "hand_assembled": true,
    "derived_pack_hand_maintained_silently": true,
    "versioned_in_git": true
  },
  "signing": {
    "pack_signed": true
  },
  "handoff": {
    "is_handoff_dossier": false
  },
  "freshness": {
    "expiry_or_review_date_present": true,
    "stale_packs_flagged": true,
    "single_upstream_source_derived_not_primary": true
  },
  "privacy": {
    "stored_privately": true,
    "access_limited": true,
    "contact_handling_rules_complied": true,
    "third_party_personal_data_included": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "agent-context-packaging",
  "atom_version": "0.1.0",
  "pack": "bad_pack",
  "verdict": "PACK_NOT_SOUND",
  "sections": {
    "scope_declaration": "pass",
    "redaction": "fail",
    "structure_and_manifest": "pass",
    "reproducibility_and_signing": "fail",
    "handoff_dossier": "insufficient_evidence",
    "freshness_and_privacy": "pass"
  },
  "checks": [
    {
      "section": "scope_declaration",
      "check": "scope_what_travels_declared",
      "status": "pass",
      "evidence": "scope declaration first: what travels (config / rules / skills / state summaries / dossiers) is written down"
    },
    {
      "section": "scope_declaration",
      "check": "scope_recipient_declared",
      "status": "pass",
      "evidence": "scope declaration first: to whom the pack travels is written down"
    },
    {
      "section": "scope_declaration",
      "check": "scope_purpose_declared",
      "status": "pass",
      "evidence": "scope declaration first: why the pack travels is written down"
    },
    {
      "section": "scope_declaration",
      "check": "pack_inherits_scope_boundary",
      "status": "pass",
      "evidence": "the pack inherits the declared scope boundary"
    },
    {
      "section": "redaction",
      "check": "keys_replaced_with_environment_references",
      "status": "pass",
      "evidence": "redaction before anything: keys become environment references"
    },
    {
      "section": "redaction",
      "check": "personal_data_minimized_purpose_limited",
      "status": "pass",
      "evidence": "redaction: personal data is minimized (purpose-limited)"
    },
    {
      "section": "redaction",
      "check": "contacts_and_financials_excluded_by_default",
      "status": "fail",
      "evidence": "redaction: contacts / financials are excluded by default"
    },
    {
      "section": "redaction",
      "check": "redaction_scan_clean_automated_and_manual",
      "status": "pass",
      "evidence": "quality gate: redaction scan clean (automated secret scanners + a manual pass); assume the receiver's storage is less protected than yours"
    },
    {
      "section": "redaction",
      "check": "no_unredacted_secrets_or_pii",
      "status": "fail",
      "evidence": "red line: never export secrets or PII unredacted"
    },
    {
      "section": "structure_and_manifest",
      "check": "manifest_present",
      "status": "pass",
      "evidence": "structure: a manifest is present"
    },
    {
      "section": "structure_and_manifest",
      "check": "manifest_lists_contents_version_date_generator_and_source",
      "status": "pass",
      "evidence": "structure: the manifest lists contents, version, date and generator; red line: every pack carries date + source"
    },
    {
      "section": "structure_and_manifest",
      "check": "stable_folder_layout",
      "status": "pass",
      "evidence": "structure: a stable folder layout, machine-readable where possible"
    },
    {
      "section": "structure_and_manifest",
      "check": "receiver_runbook_present",
      "status": "pass",
      "evidence": "structure: a README / runbook for the receiving agent is present"
    },
    {
      "section": "structure_and_manifest",
      "check": "receiver_runbook_tested",
      "status": "pass",
      "evidence": "quality gate: receiver runbook tested \u2014 a fresh agent can operate from the pack"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "generated_by_script_from_source_of_truth",
      "status": "pass",
      "evidence": "reproducibility: exports are generated by a script from the source of truth"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "not_hand_assembled",
      "status": "fail",
      "evidence": "reproducibility: exports are never hand-assembled"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "not_hand_maintained_silently",
      "status": "fail",
      "evidence": "red line: never hand-maintain a derived pack silently"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "versioned_in_git",
      "status": "pass",
      "evidence": "reproducibility: exports are versioned in git"
    },
    {
      "section": "reproducibility_and_signing",
      "check": "pack_signed",
      "status": "pass",
      "evidence": "reproducibility / quality gate: the pack is signed so authenticity is checkable; stored privately"
    },
    {
      "section": "handoff_dossier",
      "check": "dossier_contents_complete_when_dossier",
      "status": "pass",
      "evidence": "no handoff dossier declared"
    },
    {
      "section": "handoff_dossier",
      "check": "everything_dated",
      "status": "missing",
      "evidence": "handoff dossiers: date everything"
    },
    {
      "section": "handoff_dossier",
      "check": "review_date_marked_against_stale_claims",
      "status": "missing",
      "evidence": "handoff dossiers: avoid stale claims \u2014 mark the review date"
    },
    {
      "section": "freshness_and_privacy",
      "check": "expiry_or_review_date_present",
      "status": "pass",
      "evidence": "freshness: expiry / review dates are present"
    },
    {
      "section": "freshness_and_privacy",
      "check": "stale_packs_flagged",
      "status": "pass",
      "evidence": "freshness: stale packs are flagged"
    },
    {
      "section": "freshness_and_privacy",
      "check": "single_upstream_source_export_derived_not_primary",
      "status": "pass",
      "evidence": "freshness: a single upstream source \u2014 the export is derived, never the primary"
    },
    {
      "section": "freshness_and_privacy",
      "check": "stored_privately",
      "status": "pass",
      "evidence": "privacy / quality gate: private repos \u2014 the pack is stored privately"
    },
    {
      "section": "freshness_and_privacy",
      "check": "access_limited",
      "status": "pass",
      "evidence": "privacy: access to the pack is limited"
    },
    {
      "section": "freshness_and_privacy",
      "check": "contact_handling_rules_complied",
      "status": "pass",
      "evidence": "privacy: the pack complies with contact-handling rules"
    },
    {
      "section": "freshness_and_privacy",
      "check": "third_party_personal_data_lawful_basis_when_included",
      "status": "pass",
      "evidence": "no third-party personal data declared included"
    }
  ],
  "summary": "23 pass, 4 fail, 2 missing of 29 checks across six sections.",
  "stamp": "AGENT CONTEXT PACKAGING VERDICT\npack: bad_pack\nVERDICT: PACK_NOT_SOUND\n  scope_declaration                pass\n  redaction                        fail\n  structure_and_manifest           pass\n  reproducibility_and_signing      fail\n  handoff_dossier                  insufficient_evidence\n  freshness_and_privacy            pass\n23 pass, 4 fail, 2 missing of 29 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "pack": "malformed_pack",
  "scope": "not_an_object"
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 29 / 29 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses listed |
| Input reference typed | Yes — 32 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
