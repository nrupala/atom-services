# Audience contract design — `audience-contract-design`

**Audience contract design** · slug `audience-contract-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "audience-contract-design"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one artifact. In the recorded run the artifact is `test-artifact-001` — an audience-contract design record for one artifact — a named path for each of the four user classes (humans, agents, hybrid systems, software), a single canonical truth, progressive formality and per-class failure behaviour, the authority lattice for dangerous actions, and verification and identity by class. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/audience-contract-design` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `AUDIENCE_CONTRACT_COMPLETE`: 26 pass, 0 fail, 0 missing of 26 checks across six sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 26 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "audience-contract-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/audience-contract-design` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/audience-contract-design` with the same `Authorization: Bearer <key>` header, and call the tool `audience_contract_design`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `AUDIENCE_CONTRACT_COMPLETE` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `AUDIENCE_CONTRACT_INCOMPLETE` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `AUDIENCE_CONTRACT_INCOMPLETE`, 23 pass, 3 fail, 0 missing of 26 checks across six sections. The failing checks are: `not_single_class_only_shipment`, `truth_not_forked_per_class`, `dangerous_path_does_not_skip_lattice`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "classes",
  "detail": "classes must be an object"
}
```

`field` names the offending field (`classes`) and `detail` states the expected type ("classes must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/audience-contract-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/audience-contract-design` — tool name `audience_contract_design`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "audience-contract-design"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 28 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `artifact` | string | string; carried into the verdict output, not itself checked |

#### `classes_and_paths`

| Field | Type | Notes |
|---|---|---|
| `classes.human_path_defined` | boolean | — |
| `classes.agent_path_defined` | boolean | — |
| `classes.system_path_defined` | boolean | — |
| `classes.software_path_defined` | boolean | — |
| `classes.single_class_only_shipment` | boolean | must be `false` to pass — skill red line |

#### `single_truth`

| Field | Type | Notes |
|---|---|---|
| `single_truth.canonical_source_declared` | boolean | — |
| `single_truth.renderings_generated_not_maintained` | boolean | — |
| `single_truth.truth_forked_per_class` | boolean | must be `false` to pass — skill red line |

#### `progressive_formality_and_failure`

| Field | Type | Notes |
|---|---|---|
| `progressive_formality.formality_progressive_declared` | boolean | — |
| `failure.human_failure_defined` | boolean | — |
| `failure.agent_failure_defined` | boolean | — |
| `failure.system_failure_defined` | boolean | — |
| `failure.software_failure_defined` | boolean | — |

#### `authority_lattice`

| Field | Type | Notes |
|---|---|---|
| `authority.dangerous_actions_present` | boolean | gates the four lattice checks below |
| `authority.capability_required` | boolean | required when dangerous actions are present; otherwise the check passes as not applicable |
| `authority.human_approval_required` | boolean | required when dangerous actions are present; otherwise not applicable |
| `authority.software_determinism_required` | boolean | required when dangerous actions are present; otherwise not applicable |
| `authority.system_audit_required` | boolean | required when dangerous actions are present; otherwise not applicable |
| `authority.dangerous_path_skips_lattice` | boolean | must be `false` to pass — skill red line |

#### `verification_by_class`

| Field | Type | Notes |
|---|---|---|
| `verification.agents_verified_by_software` | boolean | — |
| `verification.humans_verified_by_evidence` | boolean | — |
| `verification.software_verified_by_spec_tests` | boolean | — |
| `verification.systems_verified_by_audit_trails` | boolean | — |

#### `identity_by_class`

| Field | Type | Notes |
|---|---|---|
| `identity.human_passkey_or_mfa` | boolean | — |
| `identity.agent_scoped_short_lived_tokens` | boolean | — |
| `identity.system_policy_engine` | boolean | — |
| `identity.software_service_creds_or_mtls` | boolean | — |

### Checks

The recorded full-pass response carries 26 checks across 6 sections (`classes_and_paths`, `single_truth`, `progressive_formality_and_failure`, `authority_lattice`, `verification_by_class`, `identity_by_class`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

The four lattice checks (`lattice_capability_required`, `lattice_human_approval_required`, `lattice_software_determinism_required`, `lattice_system_audit_required`) are conditional on `authority.dangerous_actions_present`. Their recorded status is `pass` when the gate is off (not applicable), `pass` when the gate is on and the element is declared, `fail` when the gate is on and the element is declared `false`, and `missing` when the gate is on and the element is absent.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `classes_and_paths` | `human_path_defined` | method 1 / quality gate: the human class has a named, working path — visual, narrative, progressive disclosure, forgiving input; approves | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `classes_and_paths` | `agent_path_defined` | method 1 / quality gate: the agent class has a named, working path — procedure: when to use, method, gates, red lines; executes within caps | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `classes_and_paths` | `system_path_defined` | method 1 / quality gate: the system class (human+agent+software together) has a named, working path — handoff contracts, approvals, shared state, audit; binds the others | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `classes_and_paths` | `software_path_defined` | method 1 / quality gate: the software class has a named, working path — schemas, stable IDs, versioned API/CLI/JSON, exit codes; deterministic | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `classes_and_paths` | `not_single_class_only_shipment` | red line: never ship for one class and assume others will cope | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `single_truth` | `canonical_source_declared` | method 2: one canonical artifact is the single source of truth, rendered per audience | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `single_truth` | `renderings_generated_not_maintained` | quality gate: renderings are generated from the canonical source, not maintained separately | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `single_truth` | `truth_not_forked_per_class` | red line: never fork truth per audience — forking truth per class is drift | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `progressive_formality_and_failure` | `formality_progressive_declared` | method 3: progressive formality — human view most forgiving to software least, same content: card, procedure, gates, schema, signature | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `progressive_formality_and_failure` | `human_failure_defined` | method 4: humans get readable errors plus retry | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `progressive_formality_and_failure` | `agent_failure_defined` | method 4: agents get instructive errors plus a safe fallback | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `progressive_formality_and_failure` | `system_failure_defined` | method 4: systems get escalation | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `progressive_formality_and_failure` | `software_failure_defined` | method 4: software gets structured errors plus exit codes | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `authority_lattice` | `lattice_capability_required` | authority lattice: dangerous actions need capability (agent) | Conditional: required when dangerous actions are present (`true` → `pass`, `false` → `fail`, absent → `missing`); gate off → `pass` (not applicable) |
| `authority_lattice` | `lattice_human_approval_required` | authority lattice: dangerous actions need approval (human) | Conditional: required when dangerous actions are present (`true` → `pass`, `false` → `fail`, absent → `missing`); gate off → `pass` (not applicable) |
| `authority_lattice` | `lattice_software_determinism_required` | authority lattice: dangerous actions need determinism (software) | Conditional: required when dangerous actions are present (`true` → `pass`, `false` → `fail`, absent → `missing`); gate off → `pass` (not applicable) |
| `authority_lattice` | `lattice_system_audit_required` | authority lattice: dangerous actions need audit (system) — audit exists | Conditional: required when dangerous actions are present (`true` → `pass`, `false` → `fail`, absent → `missing`); gate off → `pass` (not applicable) |
| `authority_lattice` | `dangerous_path_does_not_skip_lattice` | red line: no dangerous path that skips the lattice | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `verification_by_class` | `agents_verified_by_software` | method 6: agents are verified with software — tests and signatures | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `verification_by_class` | `humans_verified_by_evidence` | method 6: humans are verified by evidence | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `verification_by_class` | `software_verified_by_spec_tests` | method 6: software is verified by spec tests | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `verification_by_class` | `systems_verified_by_audit_trails` | method 6: systems are verified by cross-verification via audit trails | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `identity_by_class` | `human_identity_declared` | method 7: humans authenticate with passkey or MFA | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `identity_by_class` | `agent_identity_declared` | method 7: agents authenticate with scoped short-lived tokens | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `identity_by_class` | `system_identity_declared` | method 7: systems authenticate through a policy engine | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `identity_by_class` | `software_identity_declared` | method 7: software authenticates with service credentials or mTLS | `true` → `pass`; `false` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"audience-contract-design"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `artifact` | The declared artifact, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 26 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four class-path checks cannot be completed |
| `classes_with_path_count` | How many of the four class-path fields are `true`; null when none of the four is declared |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "26 pass, 0 fail, 0 missing of 26 checks across six sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `AUDIENCE_CONTRACT_COMPLETE` — Every check passes; the design record is complete on the declared evidence.
- `AUDIENCE_CONTRACT_INCOMPLETE` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `classes` / "classes must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 26 checks grouped into 6 sections (classes_and_paths, single_truth, progressive_formality_and_failure, authority_lattice, verification_by_class, identity_by_class), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the deliverable it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** Two things are computed from the declared values, using only the bound skill's own structure. **Classes with a path (count):** the skill names exactly four user classes and its first quality gate requires all four to have a named, working path; `classes_with_path_count` reports how many of the four declared path fields are `true` (null when none of the four is declared). **Authority lattice (conditional):** dangerous actions need capability (agent) + approval (human) + determinism (software) + audit (system) — each lattice element is required only when `authority.dangerous_actions_present` is declared `true`; when no dangerous actions are declared, each lattice check passes as not applicable. The output also reports `computed_status` (null when any of the four class-path checks cannot be completed).

**What it does NOT do.** This atom audits a **declared** audience-contract design record —
it does not design the interface, render any class's view, or
verify that a declared path actually works. A design is complete
*on the caller's declared evidence*: a manifest that declares four
paths, a canonical source, and a full lattice passes those checks
even if the underlying contracts were never built. It is a
completeness audit of the record the skill requires, **not a
usability or API review**: it never judges whether a class's path
is good, whether the renderings are faithful, or whether the
progressive formality is well judged — only that the record
contains what the skill's method, quality gates, and red lines
demand.

Named exclusions: no check of any rendering's content or fidelity
(the skill requires renderings be generated from one canonical
source, not that any particular rendering is correct, and states
no test for it, so none is invented); no per-class needs beyond
the skill's method step 1 descriptions; no live verification of
any declared path, identity mechanism, or audit trail.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/audience-contract-design` (or the MCP tool `audience_contract_design`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/audience_contract_design.py`, tests in `tests/test_audience_contract_design.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/audience-contract-design` and MCP `POST https://atoms.pipavia.com/mcp/audience-contract-design` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:44:25.779459+00:00 against gateway v1.1.0, external verification lane, source `verification/work/audience-contract-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/audience-contract-design`:

```json
{
  "artifact": "test-artifact-001",
  "classes": {
    "human_path_defined": true,
    "agent_path_defined": true,
    "system_path_defined": true,
    "software_path_defined": true,
    "single_class_only_shipment": false
  },
  "single_truth": {
    "canonical_source_declared": true,
    "renderings_generated_not_maintained": true,
    "truth_forked_per_class": false
  },
  "progressive_formality": {
    "formality_progressive_declared": true
  },
  "failure": {
    "human_failure_defined": true,
    "agent_failure_defined": true,
    "system_failure_defined": true,
    "software_failure_defined": true
  },
  "authority": {
    "dangerous_actions_present": true,
    "capability_required": true,
    "human_approval_required": true,
    "software_determinism_required": true,
    "system_audit_required": true,
    "dangerous_path_skips_lattice": false
  },
  "verification": {
    "agents_verified_by_software": true,
    "humans_verified_by_evidence": true,
    "software_verified_by_spec_tests": true,
    "systems_verified_by_audit_trails": true
  },
  "identity": {
    "human_passkey_or_mfa": true,
    "agent_scoped_short_lived_tokens": true,
    "system_policy_engine": true,
    "software_service_creds_or_mtls": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "audience-contract-design",
  "atom_version": "0.1.0",
  "artifact": "test-artifact-001",
  "verdict": "AUDIENCE_CONTRACT_COMPLETE",
  "sections": {
    "classes_and_paths": "pass",
    "single_truth": "pass",
    "progressive_formality_and_failure": "pass",
    "authority_lattice": "pass",
    "verification_by_class": "pass",
    "identity_by_class": "pass"
  },
  "checks": [
    {
      "section": "classes_and_paths",
      "check": "human_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the human class has a named, working path \u2014 visual, narrative, progressive disclosure, forgiving input; approves"
    },
    {
      "section": "classes_and_paths",
      "check": "agent_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the agent class has a named, working path \u2014 procedure: when to use, method, gates, red lines; executes within caps"
    },
    {
      "section": "classes_and_paths",
      "check": "system_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the system class (human+agent+software together) has a named, working path \u2014 handoff contracts, approvals, shared state, audit; binds the others"
    },
    {
      "section": "classes_and_paths",
      "check": "software_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the software class has a named, working path \u2014 schemas, stable IDs, versioned API/CLI/JSON, exit codes; deterministic"
    },
    {
      "section": "classes_and_paths",
      "check": "not_single_class_only_shipment",
      "status": "pass",
      "evidence": "red line: never ship for one class and assume others will cope"
    },
    {
      "section": "single_truth",
      "check": "canonical_source_declared",
      "status": "pass",
      "evidence": "method 2: one canonical artifact is the single source of truth, rendered per audience"
    },
    {
      "section": "single_truth",
      "check": "renderings_generated_not_maintained",
      "status": "pass",
      "evidence": "quality gate: renderings are generated from the canonical source, not maintained separately"
    },
    {
      "section": "single_truth",
      "check": "truth_not_forked_per_class",
      "status": "pass",
      "evidence": "red line: never fork truth per audience \u2014 forking truth per class is drift"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "formality_progressive_declared",
      "status": "pass",
      "evidence": "method 3: progressive formality \u2014 human view most forgiving to software least, same content: card, procedure, gates, schema, signature"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "human_failure_defined",
      "status": "pass",
      "evidence": "method 4: humans get readable errors plus retry"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "agent_failure_defined",
      "status": "pass",
      "evidence": "method 4: agents get instructive errors plus a safe fallback"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "system_failure_defined",
      "status": "pass",
      "evidence": "method 4: systems get escalation"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "software_failure_defined",
      "status": "pass",
      "evidence": "method 4: software gets structured errors plus exit codes"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_capability_required",
      "status": "pass",
      "evidence": "authority lattice: dangerous actions need capability (agent)"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_human_approval_required",
      "status": "pass",
      "evidence": "authority lattice: dangerous actions need approval (human)"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_software_determinism_required",
      "status": "pass",
      "evidence": "authority lattice: dangerous actions need determinism (software)"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_system_audit_required",
      "status": "pass",
      "evidence": "authority lattice: dangerous actions need audit (system) \u2014 audit exists"
    },
    {
      "section": "authority_lattice",
      "check": "dangerous_path_does_not_skip_lattice",
      "status": "pass",
      "evidence": "red line: no dangerous path that skips the lattice"
    },
    {
      "section": "verification_by_class",
      "check": "agents_verified_by_software",
      "status": "pass",
      "evidence": "method 6: agents are verified with software \u2014 tests and signatures"
    },
    {
      "section": "verification_by_class",
      "check": "humans_verified_by_evidence",
      "status": "pass",
      "evidence": "method 6: humans are verified by evidence"
    },
    {
      "section": "verification_by_class",
      "check": "software_verified_by_spec_tests",
      "status": "pass",
      "evidence": "method 6: software is verified by spec tests"
    },
    {
      "section": "verification_by_class",
      "check": "systems_verified_by_audit_trails",
      "status": "pass",
      "evidence": "method 6: systems are verified by cross-verification via audit trails"
    },
    {
      "section": "identity_by_class",
      "check": "human_identity_declared",
      "status": "pass",
      "evidence": "method 7: humans authenticate with passkey or MFA"
    },
    {
      "section": "identity_by_class",
      "check": "agent_identity_declared",
      "status": "pass",
      "evidence": "method 7: agents authenticate with scoped short-lived tokens"
    },
    {
      "section": "identity_by_class",
      "check": "system_identity_declared",
      "status": "pass",
      "evidence": "method 7: systems authenticate through a policy engine"
    },
    {
      "section": "identity_by_class",
      "check": "software_identity_declared",
      "status": "pass",
      "evidence": "method 7: software authenticates with service credentials or mTLS"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "classes_with_path_count": 4,
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections.",
  "stamp": "AUDIENCE CONTRACT DESIGN\nartifact: test-artifact-001\nVERDICT: AUDIENCE_CONTRACT_COMPLETE\n  classes_and_paths                    pass\n  single_truth                         pass\n  progressive_formality_and_failure    pass\n  authority_lattice                    pass\n  verification_by_class                pass\n  identity_by_class                    pass\n26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

### Example 2 — violations

Request — `POST /v1/audience-contract-design`:

```json
{
  "artifact": "test-artifact-002",
  "classes": {
    "human_path_defined": true,
    "agent_path_defined": true,
    "system_path_defined": true,
    "software_path_defined": true,
    "single_class_only_shipment": true
  },
  "single_truth": {
    "canonical_source_declared": true,
    "renderings_generated_not_maintained": true,
    "truth_forked_per_class": true
  },
  "progressive_formality": {
    "formality_progressive_declared": true
  },
  "failure": {
    "human_failure_defined": true,
    "agent_failure_defined": true,
    "system_failure_defined": true,
    "software_failure_defined": true
  },
  "authority": {
    "dangerous_actions_present": false,
    "dangerous_path_skips_lattice": true
  },
  "verification": {
    "agents_verified_by_software": true,
    "humans_verified_by_evidence": true,
    "software_verified_by_spec_tests": true,
    "systems_verified_by_audit_trails": true
  },
  "identity": {
    "human_passkey_or_mfa": true,
    "agent_scoped_short_lived_tokens": true,
    "system_policy_engine": true,
    "software_service_creds_or_mtls": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "audience-contract-design",
  "atom_version": "0.1.0",
  "artifact": "test-artifact-002",
  "verdict": "AUDIENCE_CONTRACT_INCOMPLETE",
  "sections": {
    "classes_and_paths": "fail",
    "single_truth": "fail",
    "progressive_formality_and_failure": "pass",
    "authority_lattice": "fail",
    "verification_by_class": "pass",
    "identity_by_class": "pass"
  },
  "checks": [
    {
      "section": "classes_and_paths",
      "check": "human_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the human class has a named, working path \u2014 visual, narrative, progressive disclosure, forgiving input; approves"
    },
    {
      "section": "classes_and_paths",
      "check": "agent_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the agent class has a named, working path \u2014 procedure: when to use, method, gates, red lines; executes within caps"
    },
    {
      "section": "classes_and_paths",
      "check": "system_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the system class (human+agent+software together) has a named, working path \u2014 handoff contracts, approvals, shared state, audit; binds the others"
    },
    {
      "section": "classes_and_paths",
      "check": "software_path_defined",
      "status": "pass",
      "evidence": "method 1 / quality gate: the software class has a named, working path \u2014 schemas, stable IDs, versioned API/CLI/JSON, exit codes; deterministic"
    },
    {
      "section": "classes_and_paths",
      "check": "not_single_class_only_shipment",
      "status": "fail",
      "evidence": "red line: never ship for one class and assume others will cope"
    },
    {
      "section": "single_truth",
      "check": "canonical_source_declared",
      "status": "pass",
      "evidence": "method 2: one canonical artifact is the single source of truth, rendered per audience"
    },
    {
      "section": "single_truth",
      "check": "renderings_generated_not_maintained",
      "status": "pass",
      "evidence": "quality gate: renderings are generated from the canonical source, not maintained separately"
    },
    {
      "section": "single_truth",
      "check": "truth_not_forked_per_class",
      "status": "fail",
      "evidence": "red line: never fork truth per audience \u2014 forking truth per class is drift"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "formality_progressive_declared",
      "status": "pass",
      "evidence": "method 3: progressive formality \u2014 human view most forgiving to software least, same content: card, procedure, gates, schema, signature"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "human_failure_defined",
      "status": "pass",
      "evidence": "method 4: humans get readable errors plus retry"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "agent_failure_defined",
      "status": "pass",
      "evidence": "method 4: agents get instructive errors plus a safe fallback"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "system_failure_defined",
      "status": "pass",
      "evidence": "method 4: systems get escalation"
    },
    {
      "section": "progressive_formality_and_failure",
      "check": "software_failure_defined",
      "status": "pass",
      "evidence": "method 4: software gets structured errors plus exit codes"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_capability_required",
      "status": "pass",
      "evidence": "no dangerous actions declared"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_human_approval_required",
      "status": "pass",
      "evidence": "no dangerous actions declared"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_software_determinism_required",
      "status": "pass",
      "evidence": "no dangerous actions declared"
    },
    {
      "section": "authority_lattice",
      "check": "lattice_system_audit_required",
      "status": "pass",
      "evidence": "no dangerous actions declared"
    },
    {
      "section": "authority_lattice",
      "check": "dangerous_path_does_not_skip_lattice",
      "status": "fail",
      "evidence": "red line: no dangerous path that skips the lattice"
    },
    {
      "section": "verification_by_class",
      "check": "agents_verified_by_software",
      "status": "pass",
      "evidence": "method 6: agents are verified with software \u2014 tests and signatures"
    },
    {
      "section": "verification_by_class",
      "check": "humans_verified_by_evidence",
      "status": "pass",
      "evidence": "method 6: humans are verified by evidence"
    },
    {
      "section": "verification_by_class",
      "check": "software_verified_by_spec_tests",
      "status": "pass",
      "evidence": "method 6: software is verified by spec tests"
    },
    {
      "section": "verification_by_class",
      "check": "systems_verified_by_audit_trails",
      "status": "pass",
      "evidence": "method 6: systems are verified by cross-verification via audit trails"
    },
    {
      "section": "identity_by_class",
      "check": "human_identity_declared",
      "status": "pass",
      "evidence": "method 7: humans authenticate with passkey or MFA"
    },
    {
      "section": "identity_by_class",
      "check": "agent_identity_declared",
      "status": "pass",
      "evidence": "method 7: agents authenticate with scoped short-lived tokens"
    },
    {
      "section": "identity_by_class",
      "check": "system_identity_declared",
      "status": "pass",
      "evidence": "method 7: systems authenticate through a policy engine"
    },
    {
      "section": "identity_by_class",
      "check": "software_identity_declared",
      "status": "pass",
      "evidence": "method 7: software authenticates with service credentials or mTLS"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "classes_with_path_count": 4,
  "summary": "23 pass, 3 fail, 0 missing of 26 checks across six sections.",
  "stamp": "AUDIENCE CONTRACT DESIGN\nartifact: test-artifact-002\nVERDICT: AUDIENCE_CONTRACT_INCOMPLETE\n  classes_and_paths                    fail\n  single_truth                         fail\n  progressive_formality_and_failure    pass\n  authority_lattice                    fail\n  verification_by_class                pass\n  identity_by_class                    pass\n23 pass, 3 fail, 0 missing of 26 checks across six sections."
}
```

### Example 3 — malformed

Request — `POST /v1/audience-contract-design`:

```json
{
  "artifact": "test-artifact-004",
  "classes": "invalid_string_instead_of_object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "classes",
  "detail": "classes must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — Not compliance-facing: the verdict is a completeness audit of a declared audience-contract design record; it is not compliance or audit evidence and the domain is not regulated. |
| Checks named (documented / recorded) | 26 / 26 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 28 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/audience-contract-design/evidence.json` after writing |

