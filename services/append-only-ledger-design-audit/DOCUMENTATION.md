# Append only ledger design audit — `append-only-ledger-design-audit`

**Display name:** Append only ledger design audit · **Slug:** `append-only-ledger-design-audit` · **Deliverable type:** CHECK · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "append-only-ledger-design-audit"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the ledger-design evidence manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `ledger_name`: `Production Ledger`, `version`: `1.0.0`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/append-only-ledger-design-audit` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SOUND` and the summary “29 pass, 0 fail, 0 missing of 29 checks across five sections.” — every one of the 29 checks passed. The response carries the per-section results under `sections`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `SOUND` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "append-only-ledger-design-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `append_only_ledger_design_audit` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/append-only-ledger-design-audit` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/append-only-ledger-design-audit` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `append_only_ledger_design_audit`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `UNSOUND` with three failing checks:

- `events_immutable` (section `append_only`) — `append_only.events_immutable` was `false`. Fix: declare events immutable (`true`).
- `no_update_on_posted_entries` (section `append_only`) — `append_only.update_on_posted_entries` was `true`. Fix: set it to `false` — posted entries are never updated; corrections are new entries.
- `every_event_carries_timestamp_actor_source` (section `structure_and_derivation`) — `structure.event_fields` did not carry the full `timestamp`, `actor`, `source` set. Fix: declare all three event fields.

Four money_discipline checks are `missing` in that run, not failed: the manifest declared `money.moves_money: false` and none of the other money fields, so `per_transaction_sum_zero`, `no_float_money`, `currency_explicit_per_entry`, and `fx_rates_recorded_at_event_time` had no evidence to read. Supply the fields and re-submit; the same input always returns the same verdict.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "append_only",
  "detail": "append_only must be an object"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/append-only-ledger-design-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/append-only-ledger-design-audit` — JSON-RPC; tool name `append_only_ledger_design_audit`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `append_only_ledger_design_audit`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: top level

| Field | Type | Notes |
|---|---|---|
| `ledger_name` | string | echoed subject field (no check) |
| `version` | string | echoed subject field (no check) |

#### Group: append_only

| Field | Type | Notes |
|---|---|---|
| `append_only.events_immutable` | boolean (`true`) | Read by check `events_immutable`. |
| `append_only.update_on_posted_entries` | boolean (`false`) | Read by check `no_update_on_posted_entries`. |
| `append_only.delete_on_posted_entries` | boolean (`false`) | Read by check `no_delete_on_posted_entries`. |
| `append_only.no_mutation_paths_verified` | boolean (`true`) | Read by check `no_mutation_code_paths_verified`. |
| `append_only.correction_model` | string | Read by check `corrections_are_new_reversing_or_adjusting_entries`. |
| `append_only.corrections_reference_original` | boolean (`true`) | Read by check `corrections_reference_originals`. |
| `append_only.retention_and_legal_holds` | boolean (`true`) | Read by check `retention_policy_and_legal_holds`. |

#### Group: money

| Field | Type | Notes |
|---|---|---|
| `money.moves_money` | boolean | gates `double_entry_when_money_moves` (if truthy, `money.double_entry` is checked; otherwise not applicable) |
| `money.double_entry` | boolean (`true` when money moves) | Read by check `double_entry_when_money_moves`. |
| `money.transaction_sum_zero` | boolean (`true`) | Read by check `per_transaction_sum_zero`. |
| `money.amount_representation` | string | Read by check `no_float_money`. |
| `money.currency_explicit_per_entry` | boolean (`true`) | Read by check `currency_explicit_per_entry`. |
| `money.fx_rates_recorded_at_event_time` | boolean (`true`) | Read by check `fx_rates_recorded_at_event_time`. |

#### Group: structure

| Field | Type | Notes |
|---|---|---|
| `structure.accounts_entries_transactions` | boolean (`true`) | Read by check `accounts_entries_transactions_hierarchy`. |
| `structure.transactions_atomic` | boolean (`true`) | Read by check `transactions_are_atomic_groups`. |
| `structure.stable_ids` | boolean (`true`) | Read by check `stable_ids`. |
| `structure.event_fields` | list containing `timestamp`, `actor`, `source` | Read by check `every_event_carries_timestamp_actor_source`. |

#### Group: derived_state

| Field | Type | Notes |
|---|---|---|
| `derived_state.balances_are_projections` | boolean (`true`) | Read by check `balances_are_derived_projections`. |
| `derived_state.projections_recomputable` | boolean (`true`) | Read by check `projections_recomputable`. |
| `derived_state.checkpoint_hashes` | boolean (`true`) | Read by check `checkpoint_hashes_for_tamper_evidence`. |

#### Group: reconciliation

| Field | Type | Notes |
|---|---|---|
| `reconciliation.cadence` | non-empty string | Read by check `reconciliation_cadence_defined`. recorded full-pass value: `daily` |
| `reconciliation.discrepancy_workflow_recorded` | boolean (`true`) | Read by check `discrepancy_workflow_with_resolution_records`. |
| `reconciliation.unreconciled_period_closed_silently` | boolean (`false`) | Read by check `no_unreconciled_period_closed_silently`. |

#### Group: reporting

| Field | Type | Notes |
|---|---|---|
| `reporting.audit_queries_who_what_when_why` | boolean (`true`) | Read by check `audit_queries_answer_who_what_when_why`. |
| `reporting.tax_ready_exports` | boolean (`true`) | Read by check `tax_ready_exports`. |

#### Group: security

| Field | Type | Notes |
|---|---|---|
| `security.encryption_at_rest` | boolean (`true`) | Read by check `encryption_at_rest`. |
| `security.scoped_access` | boolean (`true`) | Read by check `scoped_access`. |

#### Group: recovery

| Field | Type | Notes |
|---|---|---|
| `recovery.restore_drill_done` | boolean (`true`) | Read by check `restore_drill_done`. |
| `recovery.restore_replay_verified` | boolean (`true`) | Read by check `restore_replays_log_and_verifies_invariants`. |

#### Group: tests

| Field | Type | Notes |
|---|---|---|
| `tests.balance_invariant_tests` | boolean (`true`) | Read by check `balance_invariant_tests_in_suite`. |

### Checks

Every check the atom runs — 29 checks, matching the 29 entries in the recorded full-pass response's `checks` array exactly (names and sections grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Section: append_only

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `events_immutable` | events are immutable (skill method 1: append-only by design) |  |
| `no_update_on_posted_entries` | skill red line: never edit history — no UPDATE on posted facts |  |
| `no_delete_on_posted_entries` | no DELETE on posted facts (skill method 1) |  |
| `no_mutation_code_paths_verified` | quality gate: no mutation code paths on posted entries (verified) |  |
| `corrections_are_new_reversing_or_adjusting_entries` | correction_model='reversing_entry' (skill: corrections are new reversing/adjusting entries) |  |
| `corrections_reference_originals` | corrections reference the originals they reverse/adjust |  |
| `retention_policy_and_legal_holds` | retention per policy; legal holds respected |  |
#### Section: money_discipline

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `double_entry_when_money_moves` | double-entry for anything monetary (skill method 2) | Gated by `money.moves_money`. In the recorded violations run (`moves_money: false`) this check passes with evidence “no monetary movement declared” — not-applicable is reported as `pass` with that evidence, not as a separate status. |
| `per_transaction_sum_zero` | double-entry invariant: sum = zero per transaction |  |
| `no_float_money` | amount_representation='integer_minor_units' (skill red line: no float money — integer minor units or exact decimals) |  |
| `currency_explicit_per_entry` | currency explicit per entry |  |
| `fx_rates_recorded_at_event_time` | FX rates recorded at event time |  |
#### Section: structure_and_derivation

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `accounts_entries_transactions_hierarchy` | structure: accounts -> entries -> transactions |  |
| `transactions_are_atomic_groups` | transactions are atomic groups of entries |  |
| `stable_ids` | stable IDs for accounts, entries and transactions |  |
| `every_event_carries_timestamp_actor_source` | event_fields=['timestamp', 'actor', 'source'] (skill: every event carries timestamp, actor, source) |  |
| `balances_are_derived_projections` | balances and reports are projections — never authoritative over the log |  |
| `projections_recomputable` | projections are recomputable and checkpointed |  |
| `checkpoint_hashes_for_tamper_evidence` | periodic checkpoint hashes for tamper evidence |  |
#### Section: reconciliation_and_reporting

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `reconciliation_cadence_defined` | cadence='daily' (ledger vs bank/processor/external statements on a cadence) |  |
| `discrepancy_workflow_with_resolution_records` | discrepancies get a workflow: found -> investigated -> resolved with record |  |
| `no_unreconciled_period_closed_silently` | skill red line: never close an unreconciled period silently |  |
| `audit_queries_answer_who_what_when_why` | audit queries answer who changed what, when, why; period summaries produced |  |
| `tax_ready_exports` | tax-ready exports for the accountant |  |
#### Section: security_and_recovery

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `encryption_at_rest` | encryption at rest |  |
| `scoped_access` | scoped access |  |
| `restore_drill_done` | quality gate: restore drill done; backups restore-tested |  |
| `restore_replays_log_and_verifies_invariants` | restore = replay the log and verify invariants |  |
| `balance_invariant_tests_in_suite` | quality gate: balance invariant tests in the suite (sums, double-entry) |  |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "append-only-ledger-design-audit",
  "atom_version": "0.1.0",
  "ledger_name": "Production Ledger",
  "version": "1.0.0",
  "verdict": "SOUND",
  "sections": {
    "append_only": "...",
    "money_discipline": "...",
    "structure_and_derivation": "...",
    "reconciliation_and_reporting": "...",
    "security_and_recovery": "..."
  },
  "checks": [
    {
      "section": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across five sections.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `ledger_name`, `version`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `sections` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `SOUND` | all 29 checks pass across the five sections. |
| `UNSOUND` | at least one check fails — a ledger invariant is breached on the declared design evidence. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the verdict names exactly which evidence to supply. |

**Section statuses** (values of the `sections` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the append_only_ledger_design_audit scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the append_only_ledger_design_audit scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "append_only", "detail": "append_only must be an object"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for append-only-ledger-design-audit exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

Bound capability (from the bound skill): build append-only ledgers and audit trails — double-entry where money moves, immutability, reconciliation. The audit runs 29 deterministic checks across five sections: append_only, money_discipline, structure_and_derivation, reconciliation_and_reporting, security_and_recovery.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- It audits the declared ledger *design* in the manifest. It does not inspect running code, replay a live ledger, or verify that a deployed system actually behaves as declared.
- The register's named doubt is printed in SERVICE.md: “Invariant tests make it checkable” — the verdict is only as strong as the invariant-test evidence declared under `tests`.
- It sells the check — a bounded judgment artifact — never the underlying ledger-design knowledge.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use workflow (R3, passed): Vault product ledger design work.

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/append-only-ledger-design-audit` (REST) or the MCP tool `append_only_ledger_design_audit` at `POST https://atoms.pipavia.com/mcp/append-only-ledger-design-audit`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/append_only_ledger_design_audit.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 15 local tests in `tests/test_append_only_ledger_design_audit.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/append-only-ledger-design-audit` and MCP `POST /mcp/append-only-ledger-design-audit` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `append_only_ledger_design_audit`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/append-only-ledger-design-audit.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/append-only-ledger-design-audit/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/append-only-ledger-design-audit.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-15T23:54:03.899990+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/append-only-ledger-design-audit/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "ledger_name": "Production Ledger",
  "version": "1.0.0",
  "append_only": {
    "events_immutable": true,
    "update_on_posted_entries": false,
    "delete_on_posted_entries": false,
    "no_mutation_paths_verified": true,
    "correction_model": "reversing_entry",
    "corrections_reference_original": true,
    "retention_and_legal_holds": true
  },
  "money": {
    "moves_money": true,
    "double_entry": true,
    "transaction_sum_zero": true,
    "amount_representation": "integer_minor_units",
    "currency_explicit_per_entry": true,
    "fx_rates_recorded_at_event_time": true
  },
  "structure": {
    "accounts_entries_transactions": true,
    "transactions_atomic": true,
    "stable_ids": true,
    "event_fields": [
      "timestamp",
      "actor",
      "source"
    ]
  },
  "derived_state": {
    "balances_are_projections": true,
    "projections_recomputable": true,
    "checkpoint_hashes": true
  },
  "reconciliation": {
    "cadence": "daily",
    "discrepancy_workflow_recorded": true,
    "unreconciled_period_closed_silently": false
  },
  "reporting": {
    "audit_queries_who_what_when_why": true,
    "tax_ready_exports": true
  },
  "security": {
    "encryption_at_rest": true,
    "scoped_access": true
  },
  "recovery": {
    "restore_drill_done": true,
    "restore_replay_verified": true
  },
  "tests": {
    "balance_invariant_tests": true
  }
}
```

Response (REST):

```json
{
  "service": "append-only-ledger-design-audit",
  "atom_version": "0.1.0",
  "ledger_name": "Production Ledger",
  "version": "1.0.0",
  "verdict": "SOUND",
  "sections": {
    "append_only": "pass",
    "money_discipline": "pass",
    "structure_and_derivation": "pass",
    "reconciliation_and_reporting": "pass",
    "security_and_recovery": "pass"
  },
  "checks": [
    {
      "section": "append_only",
      "check": "events_immutable",
      "status": "pass",
      "evidence": "events are immutable (skill method 1: append-only by design)"
    },
    {
      "section": "append_only",
      "check": "no_update_on_posted_entries",
      "status": "pass",
      "evidence": "skill red line: never edit history — no UPDATE on posted facts"
    },
    {
      "section": "append_only",
      "check": "no_delete_on_posted_entries",
      "status": "pass",
      "evidence": "no DELETE on posted facts (skill method 1)"
    },
    {
      "section": "append_only",
      "check": "no_mutation_code_paths_verified",
      "status": "pass",
      "evidence": "quality gate: no mutation code paths on posted entries (verified)"
    },
    {
      "section": "append_only",
      "check": "corrections_are_new_reversing_or_adjusting_entries",
      "status": "pass",
      "evidence": "correction_model='reversing_entry' (skill: corrections are new reversing/adjusting entries)"
    },
    {
      "section": "append_only",
      "check": "corrections_reference_originals",
      "status": "pass",
      "evidence": "corrections reference the originals they reverse/adjust"
    },
    {
      "section": "append_only",
      "check": "retention_policy_and_legal_holds",
      "status": "pass",
      "evidence": "retention per policy; legal holds respected"
    },
    {
      "section": "money_discipline",
      "check": "double_entry_when_money_moves",
      "status": "pass",
      "evidence": "double-entry for anything monetary (skill method 2)"
    },
    {
      "section": "money_discipline",
      "check": "per_transaction_sum_zero",
      "status": "pass",
      "evidence": "double-entry invariant: sum = zero per transaction"
    },
    {
      "section": "money_discipline",
      "check": "no_float_money",
      "status": "pass",
      "evidence": "amount_representation='integer_minor_units' (skill red line: no float money — integer minor units or exact decimals)"
    },
    {
      "section": "money_discipline",
      "check": "currency_explicit_per_entry",
      "status": "pass",
      "evidence": "currency explicit per entry"
    },
    {
      "section": "money_discipline",
      "check": "fx_rates_recorded_at_event_time",
      "status": "pass",
      "evidence": "FX rates recorded at event time"
    },
    {
      "section": "structure_and_derivation",
      "check": "accounts_entries_transactions_hierarchy",
      "status": "pass",
      "evidence": "structure: accounts -> entries -> transactions"
    },
    {
      "section": "structure_and_derivation",
      "check": "transactions_are_atomic_groups",
      "status": "pass",
      "evidence": "transactions are atomic groups of entries"
    },
    {
      "section": "structure_and_derivation",
      "check": "stable_ids",
      "status": "pass",
      "evidence": "stable IDs for accounts, entries and transactions"
    },
    {
      "section": "structure_and_derivation",
      "check": "every_event_carries_timestamp_actor_source",
      "status": "pass",
      "evidence": "event_fields=['timestamp', 'actor', 'source'] (skill: every event carries timestamp, actor, source)"
    },
    {
      "section": "structure_and_derivation",
      "check": "balances_are_derived_projections",
      "status": "pass",
      "evidence": "balances and reports are projections — never authoritative over the log"
    },
    {
      "section": "structure_and_derivation",
      "check": "projections_recomputable",
      "status": "pass",
      "evidence": "projections are recomputable and checkpointed"
    },
    {
      "section": "structure_and_derivation",
      "check": "checkpoint_hashes_for_tamper_evidence",
      "status": "pass",
      "evidence": "periodic checkpoint hashes for tamper evidence"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "reconciliation_cadence_defined",
      "status": "pass",
      "evidence": "cadence='daily' (ledger vs bank/processor/external statements on a cadence)"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "discrepancy_workflow_with_resolution_records",
      "status": "pass",
      "evidence": "discrepancies get a workflow: found -> investigated -> resolved with record"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "no_unreconciled_period_closed_silently",
      "status": "pass",
      "evidence": "skill red line: never close an unreconciled period silently"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "audit_queries_answer_who_what_when_why",
      "status": "pass",
      "evidence": "audit queries answer who changed what, when, why; period summaries produced"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "tax_ready_exports",
      "status": "pass",
      "evidence": "tax-ready exports for the accountant"
    },
    {
      "section": "security_and_recovery",
      "check": "encryption_at_rest",
      "status": "pass",
      "evidence": "encryption at rest"
    },
    {
      "section": "security_and_recovery",
      "check": "scoped_access",
      "status": "pass",
      "evidence": "scoped access"
    },
    {
      "section": "security_and_recovery",
      "check": "restore_drill_done",
      "status": "pass",
      "evidence": "quality gate: restore drill done; backups restore-tested"
    },
    {
      "section": "security_and_recovery",
      "check": "restore_replays_log_and_verifies_invariants",
      "status": "pass",
      "evidence": "restore = replay the log and verify invariants"
    },
    {
      "section": "security_and_recovery",
      "check": "balance_invariant_tests_in_suite",
      "status": "pass",
      "evidence": "quality gate: balance invariant tests in the suite (sums, double-entry)"
    }
  ],
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across five sections.",
  "stamp": "APPEND-ONLY LEDGER DESIGN AUDIT\nledger_name: Production Ledger  version: 1.0.0\nVERDICT: SOUND\n  append_only                      pass\n  money_discipline                 pass\n  structure_and_derivation         pass\n  reconciliation_and_reporting     pass\n  security_and_recovery            pass\n29 pass, 0 fail, 0 missing of 29 checks across five sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "ledger_name": "Broken Ledger",
  "version": "0.9.0",
  "append_only": {
    "events_immutable": false,
    "update_on_posted_entries": true,
    "delete_on_posted_entries": false,
    "no_mutation_paths_verified": true,
    "correction_model": "reversing_entry",
    "corrections_reference_original": true,
    "retention_and_legal_holds": true
  },
  "money": {
    "moves_money": false
  },
  "structure": {
    "accounts_entries_transactions": true,
    "transactions_atomic": true,
    "stable_ids": true,
    "event_fields": [
      "timestamp",
      "actor"
    ]
  },
  "derived_state": {
    "balances_are_projections": true,
    "projections_recomputable": true,
    "checkpoint_hashes": true
  },
  "reconciliation": {
    "cadence": "daily",
    "discrepancy_workflow_recorded": true,
    "unreconciled_period_closed_silently": false
  },
  "reporting": {
    "audit_queries_who_what_when_why": true,
    "tax_ready_exports": true
  },
  "security": {
    "encryption_at_rest": true,
    "scoped_access": true
  },
  "recovery": {
    "restore_drill_done": true,
    "restore_replay_verified": true
  },
  "tests": {
    "balance_invariant_tests": true
  }
}
```

Response (REST):

```json
{
  "service": "append-only-ledger-design-audit",
  "atom_version": "0.1.0",
  "ledger_name": "Broken Ledger",
  "version": "0.9.0",
  "verdict": "UNSOUND",
  "sections": {
    "append_only": "fail",
    "money_discipline": "insufficient_evidence",
    "structure_and_derivation": "fail",
    "reconciliation_and_reporting": "pass",
    "security_and_recovery": "pass"
  },
  "checks": [
    {
      "section": "append_only",
      "check": "events_immutable",
      "status": "fail",
      "evidence": "events are immutable (skill method 1: append-only by design)"
    },
    {
      "section": "append_only",
      "check": "no_update_on_posted_entries",
      "status": "fail",
      "evidence": "skill red line: never edit history — no UPDATE on posted facts"
    },
    {
      "section": "append_only",
      "check": "no_delete_on_posted_entries",
      "status": "pass",
      "evidence": "no DELETE on posted facts (skill method 1)"
    },
    {
      "section": "append_only",
      "check": "no_mutation_code_paths_verified",
      "status": "pass",
      "evidence": "quality gate: no mutation code paths on posted entries (verified)"
    },
    {
      "section": "append_only",
      "check": "corrections_are_new_reversing_or_adjusting_entries",
      "status": "pass",
      "evidence": "correction_model='reversing_entry' (skill: corrections are new reversing/adjusting entries)"
    },
    {
      "section": "append_only",
      "check": "corrections_reference_originals",
      "status": "pass",
      "evidence": "corrections reference the originals they reverse/adjust"
    },
    {
      "section": "append_only",
      "check": "retention_policy_and_legal_holds",
      "status": "pass",
      "evidence": "retention per policy; legal holds respected"
    },
    {
      "section": "money_discipline",
      "check": "double_entry_when_money_moves",
      "status": "pass",
      "evidence": "no monetary movement declared"
    },
    {
      "section": "money_discipline",
      "check": "per_transaction_sum_zero",
      "status": "missing",
      "evidence": "double-entry invariant: sum = zero per transaction"
    },
    {
      "section": "money_discipline",
      "check": "no_float_money",
      "status": "missing",
      "evidence": "amount_representation=None (skill red line: no float money — integer minor units or exact decimals)"
    },
    {
      "section": "money_discipline",
      "check": "currency_explicit_per_entry",
      "status": "missing",
      "evidence": "currency explicit per entry"
    },
    {
      "section": "money_discipline",
      "check": "fx_rates_recorded_at_event_time",
      "status": "missing",
      "evidence": "FX rates recorded at event time"
    },
    {
      "section": "structure_and_derivation",
      "check": "accounts_entries_transactions_hierarchy",
      "status": "pass",
      "evidence": "structure: accounts -> entries -> transactions"
    },
    {
      "section": "structure_and_derivation",
      "check": "transactions_are_atomic_groups",
      "status": "pass",
      "evidence": "transactions are atomic groups of entries"
    },
    {
      "section": "structure_and_derivation",
      "check": "stable_ids",
      "status": "pass",
      "evidence": "stable IDs for accounts, entries and transactions"
    },
    {
      "section": "structure_and_derivation",
      "check": "every_event_carries_timestamp_actor_source",
      "status": "fail",
      "evidence": "event_fields=['timestamp', 'actor'] (skill: every event carries timestamp, actor, source)"
    },
    {
      "section": "structure_and_derivation",
      "check": "balances_are_derived_projections",
      "status": "pass",
      "evidence": "balances and reports are projections — never authoritative over the log"
    },
    {
      "section": "structure_and_derivation",
      "check": "projections_recomputable",
      "status": "pass",
      "evidence": "projections are recomputable and checkpointed"
    },
    {
      "section": "structure_and_derivation",
      "check": "checkpoint_hashes_for_tamper_evidence",
      "status": "pass",
      "evidence": "periodic checkpoint hashes for tamper evidence"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "reconciliation_cadence_defined",
      "status": "pass",
      "evidence": "cadence='daily' (ledger vs bank/processor/external statements on a cadence)"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "discrepancy_workflow_with_resolution_records",
      "status": "pass",
      "evidence": "discrepancies get a workflow: found -> investigated -> resolved with record"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "no_unreconciled_period_closed_silently",
      "status": "pass",
      "evidence": "skill red line: never close an unreconciled period silently"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "audit_queries_answer_who_what_when_why",
      "status": "pass",
      "evidence": "audit queries answer who changed what, when, why; period summaries produced"
    },
    {
      "section": "reconciliation_and_reporting",
      "check": "tax_ready_exports",
      "status": "pass",
      "evidence": "tax-ready exports for the accountant"
    },
    {
      "section": "security_and_recovery",
      "check": "encryption_at_rest",
      "status": "pass",
      "evidence": "encryption at rest"
    },
    {
      "section": "security_and_recovery",
      "check": "scoped_access",
      "status": "pass",
      "evidence": "scoped access"
    },
    {
      "section": "security_and_recovery",
      "check": "restore_drill_done",
      "status": "pass",
      "evidence": "quality gate: restore drill done; backups restore-tested"
    },
    {
      "section": "security_and_recovery",
      "check": "restore_replays_log_and_verifies_invariants",
      "status": "pass",
      "evidence": "restore = replay the log and verify invariants"
    },
    {
      "section": "security_and_recovery",
      "check": "balance_invariant_tests_in_suite",
      "status": "pass",
      "evidence": "quality gate: balance invariant tests in the suite (sums, double-entry)"
    }
  ],
  "summary": "22 pass, 3 fail, 4 missing of 29 checks across five sections.",
  "stamp": "APPEND-ONLY LEDGER DESIGN AUDIT\nledger_name: Broken Ledger  version: 0.9.0\nVERDICT: UNSOUND\n  append_only                      fail\n  money_discipline                 insufficient_evidence\n  structure_and_derivation         fail\n  reconciliation_and_reporting     pass\n  security_and_recovery            pass\n22 pass, 3 fail, 4 missing of 29 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "ledger_name": "Malformed Ledger",
  "version": "1.0.0",
  "append_only": "should_be_an_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "append_only",
  "detail": "append_only must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 29 documented / 29 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 32 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/append-only-ledger-design-audit/evidence.json` |
