# Lean4 formal proof — `lean4-formal-proof`

**Lean4 formal proof** · slug `lean4-formal-proof` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Formal verification with Lean 4 — propositions as types, structured proofs, statements you can trust.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `project` = `verified-math-lib`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/lean4-formal-proof` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "VERIFIED"`, every section `pass`, and the summary: "26 pass, 0 fail, 0 missing of 26 checks across seven sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "lean4-formal-proof"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/lean4-formal-proof \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/lean4-formal-proof`
- Tool name: `lean4_formal_proof` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `NOT_VERIFIED` with the summary: "24 pass, 2 fail, 0 missing of 26 checks across seven sections."

The checks with `status: "fail"` in that recorded run were:

- `statement_integrity.statement_not_weakened_silently` — evidence: "never weaken a statement silently to make it provable"
- `theorem_declarations.no_sorry_in_declared_theorems` — evidence: "zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry"

Fix procedure:

1. **Separate `fail` from `missing`.** A `fail` means a field was present but false / invalid, or a must-be-false red-line field was true — correct the underlying fact or the declaration. A `missing` check means the field was absent — supply the evidence. Adding a missing field cannot fix a fail, and vice versa.
2. **Work section by section.** The `sections` object rolls the checks up: a section is `fail` if any of its checks fails, otherwise `insufficient_evidence` if any is missing, otherwise `pass`. Fix every failing check in a section before re-reading its roll-up.
3. **Respect the gates.** Some checks only bite when a gate field says they apply (see the notes in the Input reference). If a gated check fails, either the gated thing must be brought up to standard or the gate declaration was wrong — fix whichever is true, never just flip the gate to make the check disappear if the gated thing exists.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update. Resubmit the corrected full manifest and confirm the summary counts move (fail count to zero, then missing count to zero).

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "setup",
  "detail": "setup must be an object"
}
```

Fix the field named in `field` (`setup`): `detail` says what was expected ("setup must be an object"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/lean4-formal-proof` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/lean4-formal-proof` | Tool name `lean4_formal_proof`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field table: 'All fields are booleans unless noted' — fields with no type note in that table are listed as boolean, and fields with a note carry that note's type. Notes (gates / conditionals / must-be-false and must-be-true conditions) are preserved from SERVICE.md.

#### `project`

| Field | Type | Read by / notes |
|---|---|---|
| `project` | string | carried into the verdict output, not itself checked |

#### `setup`

| Field | Type | Read by / notes |
|---|---|---|
| `setup.toolchain_pinned` | boolean | Read by: project_setup |
| `setup.versions_pinned` | boolean | Read by: project_setup |
| `setup.ci_runs_lake_build` | boolean | Read by: project_setup |
| `setup.lake_build_green` | boolean | Read by: project_setup |

#### `statements`

| Field | Type | Read by / notes |
|---|---|---|
| `statements.stated_before_proving` | boolean | Read by: statement_integrity |
| `statements.meaning_checked_before_proving` | boolean | Read by: statement_integrity |
| `statements.reviewed_independently_of_tactics` | boolean | Read by: statement_integrity |
| `statements.weakened_silently` | boolean | Read by: statement_integrity; must be `false` to pass |
| `statements.unproven_claims_presented_as_verified` | boolean | Read by: statement_integrity; must be `false` to pass |

#### `definitions`

| Field | Type | Read by / notes |
|---|---|---|
| `definitions.total` | boolean | Read by: definitions_and_model |
| `definitions.executable` | boolean | Read by: definitions_and_model |
| `definitions.specs_separate_from_implementation` | boolean | Read by: definitions_and_model |

#### `proof`

| Field | Type | Read by / notes |
|---|---|---|
| `proof.structured_and_readable` | boolean | Read by: proof_integrity |
| `proof.cheating_items_tracked_as_tickets` | boolean | Read by: proof_integrity |
| `proof.cheating_smuggled_into_deliverable` | boolean | Read by: proof_integrity; must be `false` to pass |

#### `theorems`

| Field | Type | Read by / notes |
|---|---|---|
| `theorems` | list of theorem declarations | Read by: theorem_declarations; absent / not a list / empty = all five computed checks missing |
| `theorems[].name` | non-empty string | Read by: theorem_declarations |
| `theorems[].sorry_count` | integer ≥ 0 | Read by: theorem_declarations; must be `0` in every delivered theorem |
| `theorems[].axioms` | list of strings | Read by: theorem_declarations; every entry must be a standard kernel axiom: `propext`, `Classical.choice`, `Quot.sound` |
| `theorems[].native_decide_used` | boolean | Read by: theorem_declarations; must be `false` in every delivered theorem |
| `theorems[].kernel_checked` | boolean | Read by: theorem_declarations; must be `true` in every delivered theorem |

#### `attestation`

| Field | Type | Read by / notes |
|---|---|---|
| `attestation.build_log_retained` | boolean | Read by: build_attestation |
| `attestation.axiom_audit_performed` | boolean | Read by: build_attestation |
| `attestation.reproduction_recipe_present` | boolean | Read by: build_attestation |

#### `alignment`

| Field | Type | Read by / notes |
|---|---|---|
| `alignment.mapping_documented` | boolean | Read by: model_alignment |
| `alignment.changes_ported_through_model` | boolean | Read by: model_alignment |
| `alignment.model_and_implementation_in_sync` | boolean | Read by: model_alignment |

Input fields documented: 28 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **26 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

Five checks are computed, not declared, all over the `theorems[]` list: `theorems_present_and_wellformed`, `no_sorry_in_declared_theorems` (every `sorry_count` must be 0), `no_extra_axioms_in_declared_theorems` (every axiom must be one of the standard kernel axioms `propext`, `Classical.choice`, `Quot.sound`), `no_native_decide_in_declared_theorems`, and `all_declared_theorems_kernel_checked`. The response also reports `theorems_evaluated` and `theorems_with_sorry`.

#### Section `project_setup` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `toolchain_pinned` | elan toolchain pinned — the proof is checked by a known toolchain, not whatever is installed |
| `dependency_versions_pinned` | lake / Mathlib versions pinned — the proof's dependencies do not drift |
| `ci_runs_lake_build` | CI runs lake build so proofs stay green |
| `lake_build_green` | lake build is green — the proofs compile |

#### Section `statement_integrity` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `statement_stated_before_proving` | the theorem is stated first — theorem name (args) : Prop — before any proving begins |
| `statement_meaning_checked` | the statement is checked to say what it means before proving it |
| `statement_reviewed_independently_of_tactics` | statements are reviewed independently of tactics by a second pair of eyes — a proof of the wrong theorem is worthless |
| `statement_not_weakened_silently` | never weaken a statement silently to make it provable |
| `unproven_claims_not_presented_as_verified` | no unproven claims dressed as formally verified |

#### Section `definitions_and_model` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `definitions_are_total` | definitions of the system model are total — no partial definitions hiding the hard cases |
| `definitions_are_executable` | definitions of the system model are executable |
| `specs_separate_from_implementation` | specs are separate from implementation |

#### Section `proof_integrity` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `proofs_structured_and_readable` | structured proofs, kept readable — proofs are code and docs |
| `cheating_items_tracked_as_tickets` | sorry, new axioms and native_decide shortcuts are tracked as tickets, never smuggled into deliverables |
| `cheating_not_smuggled_into_deliverable` | no cheating smuggled into the deliverable |

#### Section `theorem_declarations` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `theorems_present_and_wellformed` | each delivered theorem is declared with its name, sorry count, axiom list, native_decide use and kernel-check status |
| `no_sorry_in_declared_theorems` | zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry |
| `no_extra_axioms_in_declared_theorems` | no axioms beyond the standard kernel axioms (propext, Classical.choice, Quot.sound) — new axioms are tracked as cheating, never smuggled |
| `no_native_decide_in_declared_theorems` | no native_decide shortcuts in delivered theorems |
| `all_declared_theorems_kernel_checked` | every delivered theorem is kernel-checked — the statement you can trust is the one the kernel accepted |

#### Section `build_attestation` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `build_log_retained` | the lake build output is retained as the kernel-check attestation |
| `axiom_audit_performed` | an axiom audit (#print axioms) is performed for each delivered theorem |
| `reproduction_recipe_present` | a clean-checkout rebuild recipe is present — the proof re-checks from scratch |

#### Section `model_alignment` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `model_implementation_mapping_documented` | the model-to-implementation mapping is documented |
| `implementation_changes_ported_through_model` | port changes go back through the model |
| `model_and_implementation_in_sync` | the verified model and the implementation are in sync |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"lean4-formal-proof"`) and `atom_version` (string, `"0.1.0"`)
- `project` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `theorems_evaluated`, `theorems_with_sorry`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `VERIFIED` | All 26 checks pass across all seven sections. |
| `NOT_VERIFIED` | At least one check fails — SERVICE.md stresses that one failure breaks the claim. |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `setup`, detail "setup must be an object" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. Formal proof fails in two distinct ways, and the sections separate them: the proof can be unsound as declared (sorry, extra axioms, `native_decide`, no kernel check), or the statement can be the wrong statement (weakened silently, meaning not checked, unproven claims presented as verified). A green build alone answers neither — hence statement integrity, build attestation and model alignment are separate sections.

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

Five checks are computed, not declared, all over the `theorems[]` list: `theorems_present_and_wellformed`, `no_sorry_in_declared_theorems` (every `sorry_count` must be 0), `no_extra_axioms_in_declared_theorems` (every axiom must be one of the standard kernel axioms `propext`, `Classical.choice`, `Quot.sound`), `no_native_decide_in_declared_theorems`, and `all_declared_theorems_kernel_checked`. The response also reports `theorems_evaluated` and `theorems_with_sorry`.

**What it does NOT do:**

- This atom audits a DECLARED proof artifact — it does not run Lean. It does not execute `lake build`, does not invoke the Lean kernel, does not elaborate any theorem, and does not prove theorems (SERVICE.md: 'proving is generative work'). `setup.lake_build_green`, `theorems[].kernel_checked` and the axiom lists are caller declarations; the computed checks test those declarations for completeness and consistency (zero sorry, standard axioms only, no `native_decide`, kernel-check flag on every theorem).
- A `VERIFIED` verdict therefore means 'the declared proof-artifact manifest passes all 26 checks', not 'this atom re-checked the proof with Lean'.
- An absent, non-list or empty `theorems` list makes all five computed checks `missing`, not failed.

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): SAIC formal verification proof work — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the deliverable it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/lean4_formal_proof.py` — contract entry: src/lean4_formal_proof.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_lean4_formal_proof.py — 24 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/lean4-formal-proof`, MCP `POST https://atoms.pipavia.com/mcp/lean4-formal-proof` (tool `lean4_formal_proof`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

### For regulators

This view is included because: Its verdict is audit/assurance evidence about a formal-verification claim (build attestation, axiom audit, kernel-check declarations) — the kind of evidence a regulator or assurance reviewer is asked to rely on, with the declared-not-executed limit stated plainly.

What the output is, as evidence: a deterministic, reproducible judgment over a declared manifest, with per-check evidence strings, a section roll-up, a one-line summary and a plain-text stamp, produced identically over REST and MCP from the same manifest (parity recorded). What it is not: an independent inspection of the underlying reality — the manifest is caller-declared, and the limits under Explanation ('What it does NOT do') bound exactly how far the verdict can be relied on. The worked examples below are the recorded external-verification runs, reproduced verbatim, so the evidence format can be assessed against real outputs rather than samples. Verification record: TEST-REPORT.md and `verification/results/lean4-formal-proof.json` (retest verdict PASS, 2026-11-15).

## Worked examples

Provenance: recorded 2026-11-15T23:51:47.966841+00:00 against gateway v1.1.0, external verification lane, source `verification/work/lean4-formal-proof/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

```json
{
  "project": "verified-math-lib",
  "setup": {
    "toolchain_pinned": true,
    "versions_pinned": true,
    "ci_runs_lake_build": true,
    "lake_build_green": true
  },
  "statements": {
    "stated_before_proving": true,
    "meaning_checked_before_proving": true,
    "reviewed_independently_of_tactics": true,
    "weakened_silently": false,
    "unproven_claims_presented_as_verified": false
  },
  "definitions": {
    "total": true,
    "executable": true,
    "specs_separate_from_implementation": true
  },
  "proof": {
    "structured_and_readable": true,
    "cheating_items_tracked_as_tickets": true,
    "cheating_smuggled_into_deliverable": false
  },
  "theorems": [
    {
      "name": "thm1",
      "sorry_count": 0,
      "axioms": [
        "propext"
      ],
      "native_decide_used": false,
      "kernel_checked": true
    }
  ],
  "attestation": {
    "build_log_retained": true,
    "axiom_audit_performed": true,
    "reproduction_recipe_present": true
  },
  "alignment": {
    "mapping_documented": true,
    "changes_ported_through_model": true,
    "model_and_implementation_in_sync": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "lean4-formal-proof",
  "atom_version": "0.1.0",
  "project": "verified-math-lib",
  "verdict": "VERIFIED",
  "sections": {
    "project_setup": "pass",
    "statement_integrity": "pass",
    "definitions_and_model": "pass",
    "proof_integrity": "pass",
    "theorem_declarations": "pass",
    "build_attestation": "pass",
    "model_alignment": "pass"
  },
  "checks": [
    {
      "section": "project_setup",
      "check": "toolchain_pinned",
      "status": "pass",
      "evidence": "elan toolchain pinned — the proof is checked by a known toolchain, not whatever is installed"
    },
    {
      "section": "project_setup",
      "check": "dependency_versions_pinned",
      "status": "pass",
      "evidence": "lake / Mathlib versions pinned — the proof's dependencies do not drift"
    },
    {
      "section": "project_setup",
      "check": "ci_runs_lake_build",
      "status": "pass",
      "evidence": "CI runs lake build so proofs stay green"
    },
    {
      "section": "project_setup",
      "check": "lake_build_green",
      "status": "pass",
      "evidence": "lake build is green — the proofs compile"
    },
    {
      "section": "statement_integrity",
      "check": "statement_stated_before_proving",
      "status": "pass",
      "evidence": "the theorem is stated first — theorem name (args) : Prop — before any proving begins"
    },
    {
      "section": "statement_integrity",
      "check": "statement_meaning_checked",
      "status": "pass",
      "evidence": "the statement is checked to say what it means before proving it"
    },
    {
      "section": "statement_integrity",
      "check": "statement_reviewed_independently_of_tactics",
      "status": "pass",
      "evidence": "statements are reviewed independently of tactics by a second pair of eyes — a proof of the wrong theorem is worthless"
    },
    {
      "section": "statement_integrity",
      "check": "statement_not_weakened_silently",
      "status": "pass",
      "evidence": "never weaken a statement silently to make it provable"
    },
    {
      "section": "statement_integrity",
      "check": "unproven_claims_not_presented_as_verified",
      "status": "pass",
      "evidence": "no unproven claims dressed as formally verified"
    },
    {
      "section": "definitions_and_model",
      "check": "definitions_are_total",
      "status": "pass",
      "evidence": "definitions of the system model are total — no partial definitions hiding the hard cases"
    },
    {
      "section": "definitions_and_model",
      "check": "definitions_are_executable",
      "status": "pass",
      "evidence": "definitions of the system model are executable"
    },
    {
      "section": "definitions_and_model",
      "check": "specs_separate_from_implementation",
      "status": "pass",
      "evidence": "specs are separate from implementation"
    },
    {
      "section": "proof_integrity",
      "check": "proofs_structured_and_readable",
      "status": "pass",
      "evidence": "structured proofs, kept readable — proofs are code and docs"
    },
    {
      "section": "proof_integrity",
      "check": "cheating_items_tracked_as_tickets",
      "status": "pass",
      "evidence": "sorry, new axioms and native_decide shortcuts are tracked as tickets, never smuggled into deliverables"
    },
    {
      "section": "proof_integrity",
      "check": "cheating_not_smuggled_into_deliverable",
      "status": "pass",
      "evidence": "no cheating smuggled into the deliverable"
    },
    {
      "section": "theorem_declarations",
      "check": "theorems_present_and_wellformed",
      "status": "pass",
      "evidence": "each delivered theorem is declared with its name, sorry count, axiom list, native_decide use and kernel-check status"
    },
    {
      "section": "theorem_declarations",
      "check": "no_sorry_in_declared_theorems",
      "status": "pass",
      "evidence": "zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry"
    },
    {
      "section": "theorem_declarations",
      "check": "no_extra_axioms_in_declared_theorems",
      "status": "pass",
      "evidence": "no axioms beyond the standard kernel axioms (propext, Classical.choice, Quot.sound) — new axioms are tracked as cheating, never smuggled"
    },
    {
      "section": "theorem_declarations",
      "check": "no_native_decide_in_declared_theorems",
      "status": "pass",
      "evidence": "no native_decide shortcuts in delivered theorems"
    },
    {
      "section": "theorem_declarations",
      "check": "all_declared_theorems_kernel_checked",
      "status": "pass",
      "evidence": "every delivered theorem is kernel-checked — the statement you can trust is the one the kernel accepted"
    },
    {
      "section": "build_attestation",
      "check": "build_log_retained",
      "status": "pass",
      "evidence": "the lake build output is retained as the kernel-check attestation"
    },
    {
      "section": "build_attestation",
      "check": "axiom_audit_performed",
      "status": "pass",
      "evidence": "an axiom audit (#print axioms) is performed for each delivered theorem"
    },
    {
      "section": "build_attestation",
      "check": "reproduction_recipe_present",
      "status": "pass",
      "evidence": "a clean-checkout rebuild recipe is present — the proof re-checks from scratch"
    },
    {
      "section": "model_alignment",
      "check": "model_implementation_mapping_documented",
      "status": "pass",
      "evidence": "the model-to-implementation mapping is documented"
    },
    {
      "section": "model_alignment",
      "check": "implementation_changes_ported_through_model",
      "status": "pass",
      "evidence": "port changes go back through the model"
    },
    {
      "section": "model_alignment",
      "check": "model_and_implementation_in_sync",
      "status": "pass",
      "evidence": "the verified model and the implementation are in sync"
    }
  ],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across seven sections.",
  "theorems_evaluated": 1,
  "theorems_with_sorry": 0,
  "stamp": "LEAN4 FORMAL PROOF\nproject: verified-math-lib\nVERDICT: VERIFIED\n  project_setup            pass\n  statement_integrity      pass\n  definitions_and_model    pass\n  proof_integrity          pass\n  theorem_declarations     pass\n  build_attestation        pass\n  model_alignment          pass\n26 pass, 0 fail, 0 missing of 26 checks across seven sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "project": "broken-proof",
  "setup": {
    "toolchain_pinned": true,
    "versions_pinned": true,
    "ci_runs_lake_build": true,
    "lake_build_green": true
  },
  "statements": {
    "stated_before_proving": true,
    "meaning_checked_before_proving": true,
    "reviewed_independently_of_tactics": true,
    "weakened_silently": true,
    "unproven_claims_presented_as_verified": false
  },
  "definitions": {
    "total": true,
    "executable": true,
    "specs_separate_from_implementation": true
  },
  "proof": {
    "structured_and_readable": true,
    "cheating_items_tracked_as_tickets": true,
    "cheating_smuggled_into_deliverable": false
  },
  "theorems": [
    {
      "name": "bad_thm",
      "sorry_count": 5,
      "axioms": [
        "propext"
      ],
      "native_decide_used": false,
      "kernel_checked": true
    }
  ],
  "attestation": {
    "build_log_retained": true,
    "axiom_audit_performed": true,
    "reproduction_recipe_present": true
  },
  "alignment": {
    "mapping_documented": true,
    "changes_ported_through_model": true,
    "model_and_implementation_in_sync": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "lean4-formal-proof",
  "atom_version": "0.1.0",
  "project": "broken-proof",
  "verdict": "NOT_VERIFIED",
  "sections": {
    "project_setup": "pass",
    "statement_integrity": "fail",
    "definitions_and_model": "pass",
    "proof_integrity": "pass",
    "theorem_declarations": "fail",
    "build_attestation": "pass",
    "model_alignment": "pass"
  },
  "checks": [
    {
      "section": "project_setup",
      "check": "toolchain_pinned",
      "status": "pass",
      "evidence": "elan toolchain pinned — the proof is checked by a known toolchain, not whatever is installed"
    },
    {
      "section": "project_setup",
      "check": "dependency_versions_pinned",
      "status": "pass",
      "evidence": "lake / Mathlib versions pinned — the proof's dependencies do not drift"
    },
    {
      "section": "project_setup",
      "check": "ci_runs_lake_build",
      "status": "pass",
      "evidence": "CI runs lake build so proofs stay green"
    },
    {
      "section": "project_setup",
      "check": "lake_build_green",
      "status": "pass",
      "evidence": "lake build is green — the proofs compile"
    },
    {
      "section": "statement_integrity",
      "check": "statement_stated_before_proving",
      "status": "pass",
      "evidence": "the theorem is stated first — theorem name (args) : Prop — before any proving begins"
    },
    {
      "section": "statement_integrity",
      "check": "statement_meaning_checked",
      "status": "pass",
      "evidence": "the statement is checked to say what it means before proving it"
    },
    {
      "section": "statement_integrity",
      "check": "statement_reviewed_independently_of_tactics",
      "status": "pass",
      "evidence": "statements are reviewed independently of tactics by a second pair of eyes — a proof of the wrong theorem is worthless"
    },
    {
      "section": "statement_integrity",
      "check": "statement_not_weakened_silently",
      "status": "fail",
      "evidence": "never weaken a statement silently to make it provable"
    },
    {
      "section": "statement_integrity",
      "check": "unproven_claims_not_presented_as_verified",
      "status": "pass",
      "evidence": "no unproven claims dressed as formally verified"
    },
    {
      "section": "definitions_and_model",
      "check": "definitions_are_total",
      "status": "pass",
      "evidence": "definitions of the system model are total — no partial definitions hiding the hard cases"
    },
    {
      "section": "definitions_and_model",
      "check": "definitions_are_executable",
      "status": "pass",
      "evidence": "definitions of the system model are executable"
    },
    {
      "section": "definitions_and_model",
      "check": "specs_separate_from_implementation",
      "status": "pass",
      "evidence": "specs are separate from implementation"
    },
    {
      "section": "proof_integrity",
      "check": "proofs_structured_and_readable",
      "status": "pass",
      "evidence": "structured proofs, kept readable — proofs are code and docs"
    },
    {
      "section": "proof_integrity",
      "check": "cheating_items_tracked_as_tickets",
      "status": "pass",
      "evidence": "sorry, new axioms and native_decide shortcuts are tracked as tickets, never smuggled into deliverables"
    },
    {
      "section": "proof_integrity",
      "check": "cheating_not_smuggled_into_deliverable",
      "status": "pass",
      "evidence": "no cheating smuggled into the deliverable"
    },
    {
      "section": "theorem_declarations",
      "check": "theorems_present_and_wellformed",
      "status": "pass",
      "evidence": "each delivered theorem is declared with its name, sorry count, axiom list, native_decide use and kernel-check status"
    },
    {
      "section": "theorem_declarations",
      "check": "no_sorry_in_declared_theorems",
      "status": "fail",
      "evidence": "zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry"
    },
    {
      "section": "theorem_declarations",
      "check": "no_extra_axioms_in_declared_theorems",
      "status": "pass",
      "evidence": "no axioms beyond the standard kernel axioms (propext, Classical.choice, Quot.sound) — new axioms are tracked as cheating, never smuggled"
    },
    {
      "section": "theorem_declarations",
      "check": "no_native_decide_in_declared_theorems",
      "status": "pass",
      "evidence": "no native_decide shortcuts in delivered theorems"
    },
    {
      "section": "theorem_declarations",
      "check": "all_declared_theorems_kernel_checked",
      "status": "pass",
      "evidence": "every delivered theorem is kernel-checked — the statement you can trust is the one the kernel accepted"
    },
    {
      "section": "build_attestation",
      "check": "build_log_retained",
      "status": "pass",
      "evidence": "the lake build output is retained as the kernel-check attestation"
    },
    {
      "section": "build_attestation",
      "check": "axiom_audit_performed",
      "status": "pass",
      "evidence": "an axiom audit (#print axioms) is performed for each delivered theorem"
    },
    {
      "section": "build_attestation",
      "check": "reproduction_recipe_present",
      "status": "pass",
      "evidence": "a clean-checkout rebuild recipe is present — the proof re-checks from scratch"
    },
    {
      "section": "model_alignment",
      "check": "model_implementation_mapping_documented",
      "status": "pass",
      "evidence": "the model-to-implementation mapping is documented"
    },
    {
      "section": "model_alignment",
      "check": "implementation_changes_ported_through_model",
      "status": "pass",
      "evidence": "port changes go back through the model"
    },
    {
      "section": "model_alignment",
      "check": "model_and_implementation_in_sync",
      "status": "pass",
      "evidence": "the verified model and the implementation are in sync"
    }
  ],
  "summary": "24 pass, 2 fail, 0 missing of 26 checks across seven sections.",
  "theorems_evaluated": 1,
  "theorems_with_sorry": 1,
  "stamp": "LEAN4 FORMAL PROOF\nproject: broken-proof\nVERDICT: NOT_VERIFIED\n  project_setup            pass\n  statement_integrity      fail\n  definitions_and_model    pass\n  proof_integrity          pass\n  theorem_declarations     fail\n  build_attestation        pass\n  model_alignment          pass\n24 pass, 2 fail, 0 missing of 26 checks across seven sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "project": "malformed-input",
  "setup": "not-an-object",
  "theorems": "should-be-a-list"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "setup",
  "detail": "setup must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops, regulators |
| Regulators view | Yes |
| Checks named count vs recorded count | 26 / 26 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (VERIFIED, NOT_VERIFIED, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 28 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/lean4-formal-proof/evidence.json` after writing |
| Output format | CommonMark markdown |

