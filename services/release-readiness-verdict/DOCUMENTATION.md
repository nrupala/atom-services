# Release-readiness verdict — `release-readiness-verdict`

**Display name:** Release-readiness verdict · **Slug:** `release-readiness-verdict` · **Deliverable type:** VERDICT · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "release-readiness-verdict"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the release-evidence manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `product`: `milo-core`, `version`: `1.2.3`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/release-readiness-verdict` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `READY` and the summary “19 pass, 0 fail, 0 missing of 19 checks across five bars.” — every one of the 19 checks passed. The response carries the per-section results under `bars`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `READY` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "release-readiness-verdict"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `release_readiness_verdict` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/release-readiness-verdict` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/release-readiness-verdict` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `release_readiness_verdict`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `NOT_READY` with exactly two failing checks:

- `rollback_plan_testable` (bar `lifecycle`) — `rollback_plan.testable` was `false`. Fix: make the rollback plan testable and set `rollback_plan.testable` to `true`.
- `post_release_health_window_24_to_48h` (bar `lifecycle`) — `health_check.window_hours` was `10`. Fix: set the post-release health-check window to a value in the 24–48 range.

Re-submit the corrected manifest; the same input always returns the same verdict, so a re-run is a clean re-test. If instead a check comes back `missing`, the field was absent — supply it rather than changing a value (see the sparse case in the verification record: only `product` + `version` supplied returns `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 18 missing).

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/release-readiness-verdict` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/release-readiness-verdict` — JSON-RPC; tool name `release_readiness_verdict`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `release_readiness_verdict`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: control

| Field | Type | Notes |
|---|---|---|
| `product` | string | Read by: control. |
| `version` | string | Read by: control. semver; `tag.name` must equal `v<version>` |
| `version_bump_locations` | array | Read by: control. array of strings; must name exactly one place |
| `tag.name` | string | Read by: control. must be `v<version>` |
| `tag.annotated` | boolean | Read by: control. |
| `tag.moved` | boolean | Read by: control. must be `false` — a published tag is never moved |

#### Group: understanding

| Field | Type | Notes |
|---|---|---|
| `changelog.has_entry_for_version` | boolean | Read by: understanding. |
| `changelog.unreleased_section_moved` | boolean | Read by: understanding. |
| `release_notes.present` | boolean | Read by: understanding. |
| `release_notes.breaking_changes` | boolean | Read by: understanding. recorded full-pass run carries boolean `false` (= no breaking changes declared); SERVICE.md declares no type for this field — note the gateway MCP inputSchema description in evidence.json describes a list form, a discrepancy recorded in this documentation worker's gap return |
| `release_notes.migration_steps` | string | Read by: understanding. recorded full-pass run carries the string `"none"` (no breaking changes declared) |

#### Group: management

| Field | Type | Notes |
|---|---|---|
| `approver` | string | Read by: management. a named human |
| `approval.hitl_recorded` | boolean | Read by: management. |
| `rollout_plan.present` | boolean | Read by: management. |

#### Group: lifecycle

| Field | Type | Notes |
|---|---|---|
| `rollback_plan.present` | boolean | Read by: lifecycle. |
| `rollback_plan.testable` | boolean | Read by: lifecycle. |
| `health_check.window_hours` | integer | Read by: lifecycle. number; must be 24–48 |

#### Group: stability

| Field | Type | Notes |
|---|---|---|
| `artifacts.sealed` | boolean | Read by: stability. |
| `artifacts.checksum_manifest` | boolean | Read by: stability. |
| `artifacts.verified_before_announcement` | boolean | Read by: stability. |
| `tests.passing` | boolean | Read by: stability. |

### Checks

Every check the atom runs — 19 checks, matching the 19 entries in the recorded full-pass response's `checks` array exactly (names and bars grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Bar: control

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `version_is_semver` | version='1.2.3' |  |
| `release_is_tagged` | tag='v1.2.3' expected v1.2.3 |  |
| `tag_is_annotated` | annotated tag (skill: annotated tags, signed when keys exist) |  |
| `published_tag_not_moved` | skill red line: never move a published tag |  |
| `version_bumped_in_exactly_one_place` | version_bump_locations=['src/version.py'] |  |
#### Bar: understanding

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `changelog_entry_for_this_version` | Keep-a-Changelog: entry for this version ships in the same change |  |
| `unreleased_section_moved_under_version` | [Unreleased] entries moved under the version at release |  |
| `release_notes_present` | user-facing notes: what changed, why it matters |  |
| `breaking_changes_have_migration_steps` | no breaking changes declared | Conditional: passes with evidence “no breaking changes declared” when `release_notes.breaking_changes` is `false`; when breaking changes are declared, migration steps are required. |
#### Bar: management

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `approver_named` | rollout plan names the approver |  |
| `human_approval_recorded` | skill red line: deploys stay HITL — automation prepares, humans approve |  |
| `rollout_plan_present` | canary/staged where feasible |  |
#### Bar: lifecycle

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `rollback_plan_present` | the rollback path is written before rolling out |  |
| `rollback_plan_testable` | quality gate: rollback plan exists and is testable |  |
| `post_release_health_window_24_to_48h` | window_hours=24 (skill: verify health for 24–48h) |  |
#### Bar: stability

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `artifacts_sealed` | hash + sign build artifacts; manifest attached |  |
| `checksum_manifest_present` | provenance manifest present |  |
| `artifacts_verified_before_announcement` | quality gate: artifacts verified (checksums/signature) before announcement |  |
| `tests_passing` | the release's own test evidence passes |  |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "release-readiness-verdict",
  "atom_version": "0.1.0",
  "product": "milo-core",
  "version": "1.2.3",
  "verdict": "READY",
  "bars": {
    "control": "...",
    "understanding": "...",
    "management": "...",
    "lifecycle": "...",
    "stability": "..."
  },
  "checks": [
    {
      "bar": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five bars.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `product`, `version`, `verdict`, `bars`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `bars` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `READY` | every check passes — the release clears all five bars. |
| `NOT_READY` | at least one check fails — a bar is breached; the failing checks name the bar and the evidence against it. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the verdict names exactly which evidence to supply. |

**Section statuses** (values of the `bars` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the release_readiness_verdict scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the release_readiness_verdict scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "product", "detail": "product must be a string"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for release-readiness-verdict exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

It probes the five release bars — control, understanding, management, lifecycle, stability — across 19 deterministic checks drawn from the bound release-management method, its quality gates, and its red lines.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- It judges readiness from the submitted evidence only; it does not itself run Guardian Mesh probes or inspect the release (SERVICE.md named doubt: Guardian Mesh adjacency; benches still unbuilt).
- A manifest that lies produces a verdict on the lie — which is why the output carries the evidence string per check, so a human can spot-check what was claimed.
- It is a release gate, not a release manager: it does not tag, build, deploy, roll back, or announce anything.

**Buyer / use context.** Teams and agents who ship software and need a release gate that is not their own optimism: CI pipelines, release managers, and agent workflows that must not ship unsealed or un-rollback-able releases. First buyer is the house itself — its own release-gate program is the prototype (self-use workflow: release gates run on every product).

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/release-readiness-verdict` (REST) or the MCP tool `release_readiness_verdict` at `POST https://atoms.pipavia.com/mcp/release-readiness-verdict`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/release_readiness.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 16 local tests in `tests/test_release_readiness.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/release-readiness-verdict` and MCP `POST /mcp/release-readiness-verdict` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `release_readiness_verdict`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/release-readiness-verdict.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/release-readiness-verdict/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/release-readiness-verdict.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-16T00:42:41.829362+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/release-readiness-verdict/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "product": "milo-core",
  "version": "1.2.3",
  "version_bump_locations": [
    "src/version.py"
  ],
  "tag": {
    "name": "v1.2.3",
    "annotated": true,
    "moved": false
  },
  "changelog": {
    "has_entry_for_version": true,
    "unreleased_section_moved": true
  },
  "release_notes": {
    "present": true,
    "breaking_changes": false,
    "migration_steps": "none"
  },
  "approver": "jane.doe",
  "approval": {
    "hitl_recorded": true
  },
  "rollout_plan": {
    "present": true
  },
  "rollback_plan": {
    "present": true,
    "testable": true
  },
  "health_check": {
    "window_hours": 24
  },
  "artifacts": {
    "sealed": true,
    "checksum_manifest": true,
    "verified_before_announcement": true
  },
  "tests": {
    "passing": true
  }
}
```

Response (REST):

```json
{
  "service": "release-readiness-verdict",
  "atom_version": "0.1.0",
  "product": "milo-core",
  "version": "1.2.3",
  "verdict": "READY",
  "bars": {
    "control": "pass",
    "understanding": "pass",
    "management": "pass",
    "lifecycle": "pass",
    "stability": "pass"
  },
  "checks": [
    {
      "bar": "control",
      "check": "version_is_semver",
      "status": "pass",
      "evidence": "version='1.2.3'"
    },
    {
      "bar": "control",
      "check": "release_is_tagged",
      "status": "pass",
      "evidence": "tag='v1.2.3' expected v1.2.3"
    },
    {
      "bar": "control",
      "check": "tag_is_annotated",
      "status": "pass",
      "evidence": "annotated tag (skill: annotated tags, signed when keys exist)"
    },
    {
      "bar": "control",
      "check": "published_tag_not_moved",
      "status": "pass",
      "evidence": "skill red line: never move a published tag"
    },
    {
      "bar": "control",
      "check": "version_bumped_in_exactly_one_place",
      "status": "pass",
      "evidence": "version_bump_locations=['src/version.py']"
    },
    {
      "bar": "understanding",
      "check": "changelog_entry_for_this_version",
      "status": "pass",
      "evidence": "Keep-a-Changelog: entry for this version ships in the same change"
    },
    {
      "bar": "understanding",
      "check": "unreleased_section_moved_under_version",
      "status": "pass",
      "evidence": "[Unreleased] entries moved under the version at release"
    },
    {
      "bar": "understanding",
      "check": "release_notes_present",
      "status": "pass",
      "evidence": "user-facing notes: what changed, why it matters"
    },
    {
      "bar": "understanding",
      "check": "breaking_changes_have_migration_steps",
      "status": "pass",
      "evidence": "no breaking changes declared"
    },
    {
      "bar": "management",
      "check": "approver_named",
      "status": "pass",
      "evidence": "rollout plan names the approver"
    },
    {
      "bar": "management",
      "check": "human_approval_recorded",
      "status": "pass",
      "evidence": "skill red line: deploys stay HITL — automation prepares, humans approve"
    },
    {
      "bar": "management",
      "check": "rollout_plan_present",
      "status": "pass",
      "evidence": "canary/staged where feasible"
    },
    {
      "bar": "lifecycle",
      "check": "rollback_plan_present",
      "status": "pass",
      "evidence": "the rollback path is written before rolling out"
    },
    {
      "bar": "lifecycle",
      "check": "rollback_plan_testable",
      "status": "pass",
      "evidence": "quality gate: rollback plan exists and is testable"
    },
    {
      "bar": "lifecycle",
      "check": "post_release_health_window_24_to_48h",
      "status": "pass",
      "evidence": "window_hours=24 (skill: verify health for 24–48h)"
    },
    {
      "bar": "stability",
      "check": "artifacts_sealed",
      "status": "pass",
      "evidence": "hash + sign build artifacts; manifest attached"
    },
    {
      "bar": "stability",
      "check": "checksum_manifest_present",
      "status": "pass",
      "evidence": "provenance manifest present"
    },
    {
      "bar": "stability",
      "check": "artifacts_verified_before_announcement",
      "status": "pass",
      "evidence": "quality gate: artifacts verified (checksums/signature) before announcement"
    },
    {
      "bar": "stability",
      "check": "tests_passing",
      "status": "pass",
      "evidence": "the release's own test evidence passes"
    }
  ],
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five bars.",
  "stamp": "RELEASE-READINESS VERDICT\nproduct: milo-core  version: 1.2.3\nVERDICT: READY\n  control        pass\n  understanding  pass\n  management     pass\n  lifecycle      pass\n  stability      pass\n19 pass, 0 fail, 0 missing of 19 checks across five bars."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "product": "milo-core",
  "version": "1.2.3",
  "version_bump_locations": [
    "src/version.py"
  ],
  "tag": {
    "name": "v1.2.3",
    "annotated": true,
    "moved": false
  },
  "changelog": {
    "has_entry_for_version": true,
    "unreleased_section_moved": true
  },
  "release_notes": {
    "present": true,
    "breaking_changes": false,
    "migration_steps": "none"
  },
  "approver": "jane.doe",
  "approval": {
    "hitl_recorded": true
  },
  "rollout_plan": {
    "present": true
  },
  "rollback_plan": {
    "present": true,
    "testable": false
  },
  "health_check": {
    "window_hours": 10
  },
  "artifacts": {
    "sealed": true,
    "checksum_manifest": true,
    "verified_before_announcement": true
  },
  "tests": {
    "passing": true
  }
}
```

Response (REST):

```json
{
  "service": "release-readiness-verdict",
  "atom_version": "0.1.0",
  "product": "milo-core",
  "version": "1.2.3",
  "verdict": "NOT_READY",
  "bars": {
    "control": "pass",
    "understanding": "pass",
    "management": "pass",
    "lifecycle": "fail",
    "stability": "pass"
  },
  "checks": [
    {
      "bar": "control",
      "check": "version_is_semver",
      "status": "pass",
      "evidence": "version='1.2.3'"
    },
    {
      "bar": "control",
      "check": "release_is_tagged",
      "status": "pass",
      "evidence": "tag='v1.2.3' expected v1.2.3"
    },
    {
      "bar": "control",
      "check": "tag_is_annotated",
      "status": "pass",
      "evidence": "annotated tag (skill: annotated tags, signed when keys exist)"
    },
    {
      "bar": "control",
      "check": "published_tag_not_moved",
      "status": "pass",
      "evidence": "skill red line: never move a published tag"
    },
    {
      "bar": "control",
      "check": "version_bumped_in_exactly_one_place",
      "status": "pass",
      "evidence": "version_bump_locations=['src/version.py']"
    },
    {
      "bar": "understanding",
      "check": "changelog_entry_for_this_version",
      "status": "pass",
      "evidence": "Keep-a-Changelog: entry for this version ships in the same change"
    },
    {
      "bar": "understanding",
      "check": "unreleased_section_moved_under_version",
      "status": "pass",
      "evidence": "[Unreleased] entries moved under the version at release"
    },
    {
      "bar": "understanding",
      "check": "release_notes_present",
      "status": "pass",
      "evidence": "user-facing notes: what changed, why it matters"
    },
    {
      "bar": "understanding",
      "check": "breaking_changes_have_migration_steps",
      "status": "pass",
      "evidence": "no breaking changes declared"
    },
    {
      "bar": "management",
      "check": "approver_named",
      "status": "pass",
      "evidence": "rollout plan names the approver"
    },
    {
      "bar": "management",
      "check": "human_approval_recorded",
      "status": "pass",
      "evidence": "skill red line: deploys stay HITL — automation prepares, humans approve"
    },
    {
      "bar": "management",
      "check": "rollout_plan_present",
      "status": "pass",
      "evidence": "canary/staged where feasible"
    },
    {
      "bar": "lifecycle",
      "check": "rollback_plan_present",
      "status": "pass",
      "evidence": "the rollback path is written before rolling out"
    },
    {
      "bar": "lifecycle",
      "check": "rollback_plan_testable",
      "status": "fail",
      "evidence": "quality gate: rollback plan exists and is testable"
    },
    {
      "bar": "lifecycle",
      "check": "post_release_health_window_24_to_48h",
      "status": "fail",
      "evidence": "window_hours=10 (skill: verify health for 24–48h)"
    },
    {
      "bar": "stability",
      "check": "artifacts_sealed",
      "status": "pass",
      "evidence": "hash + sign build artifacts; manifest attached"
    },
    {
      "bar": "stability",
      "check": "checksum_manifest_present",
      "status": "pass",
      "evidence": "provenance manifest present"
    },
    {
      "bar": "stability",
      "check": "artifacts_verified_before_announcement",
      "status": "pass",
      "evidence": "quality gate: artifacts verified (checksums/signature) before announcement"
    },
    {
      "bar": "stability",
      "check": "tests_passing",
      "status": "pass",
      "evidence": "the release's own test evidence passes"
    }
  ],
  "summary": "17 pass, 2 fail, 0 missing of 19 checks across five bars.",
  "stamp": "RELEASE-READINESS VERDICT\nproduct: milo-core  version: 1.2.3\nVERDICT: NOT_READY\n  control        pass\n  understanding  pass\n  management     pass\n  lifecycle      fail\n  stability      pass\n17 pass, 2 fail, 0 missing of 19 checks across five bars."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "product": 123,
  "version": "1.2.3",
  "version_bump_locations": "not-a-list",
  "tag": "invalid-object-type"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 19 documented / 19 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 21 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/release-readiness-verdict/evidence.json` |
