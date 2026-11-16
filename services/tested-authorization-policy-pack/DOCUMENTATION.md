# Tested authorization policy pack — full documentation

**Tested authorization policy pack** · slug `tested-authorization-policy-pack` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `pack` (`"auth-v1"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/tested-authorization-policy-pack` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `READY`. Its summary: "29 pass, 0 fail, 0 missing of 29 checks across six sections." Every section reports `pass` (decision_model, policy_code, testing, rollout, decision_logs, governance_and_enforcement) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "tested-authorization-policy-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/tested-authorization-policy-pack` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/tested-authorization-policy-pack`
- Tool name: `tested_authorization_policy_pack` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `NOT_READY`: "25 pass, 4 fail, 0 missing of 29 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `every_policy_defaults_to_deny` (section `decision_model`) — evidence: "skill red line: no default-allow — policies not defaulting to deny: p1"
   - `positive_negative_edge_tests_per_policy` (section `testing`) — evidence: "unit tests per rule — positive, negative, edge cases; policies missing a test kind: p1"
   - `no_silent_policy_edits` (section `rollout`) — evidence: "no silent policy edits"
   - `no_bypass_paths` (section `governance_and_enforcement`) — evidence: "skill red line: no bypass paths around enforcement points"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision_model",
  "detail": "decision_model must be an object"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `decision_model`: "decision_model must be an object". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/tested-authorization-policy-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/tested-authorization-policy-pack` — tool name `tested_authorization_policy_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `pack` | string | carried into the verdict output, not itself checked |

**Group: `decision_model`**

| Field | Type | Notes |
|---|---|---|
| `decision_model.decisions_enumerated` | boolean |  |
| `decision_model.input_schema_defined` | boolean |  |
| `decision_model.default_deny` | boolean |  |

**Group: `decision_model, policy_code, testing`**

| Field | Type | Notes |
|---|---|---|
| `policies[]` | list of policy entries | see below |

**Group: `policy_code`**

| Field | Type | Notes |
|---|---|---|
| `policy_code.rules_small_and_composable` | boolean |  |
| `policy_code.data_separated_from_logic` | boolean |  |
| `policy_code.policy_data_versioned` | boolean |  |
| `policy_code.decision_explanations_available` | boolean |  |

**Group: `testing`**

| Field | Type | Notes |
|---|---|---|
| `tests[]` | list of test entries | see below |
| `testing.tests_green` | boolean |  |
| `testing.lint_format_clean` | boolean |  |
| `testing.key_roles_coverage_declared` | boolean |  |

**Group: `rollout`**

| Field | Type | Notes |
|---|---|---|
| `rollout.shadow_completed` | boolean |  |
| `rollout.staged_before_production` | boolean |  |
| `rollout.break_glass_documented_gated_audited` | boolean |  |
| `rollout.break_glass_tested` | boolean |  |
| `rollout.silent_policy_edits` | must be `false` to pass | must be `false` to pass |

**Group: `decision_logs`**

| Field | Type | Notes |
|---|---|---|
| `decision_logs.record_who_decision_version_reason` | boolean |  |
| `decision_logs.retained_immutably` | boolean |  |
| `decision_logs.full_in_sensitive_flows` | boolean |  |

**Group: `governance_and_enforcement`**

| Field | Type | Notes |
|---|---|---|
| `governance.second_pair_of_eyes_on_prs` | boolean |  |
| `governance.version_and_changelog` | boolean |  |
| `governance.human_summary_in_sync_with_code` | boolean |  |
| `enforcement.points_inventoried` | boolean |  |
| `enforcement.failure_mode_chosen_per_surface` | boolean |  |
| `enforcement.sensitive_surfaces_fail_closed` | boolean |  |
| `enforcement.bypass_paths_present` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

**Group: policies[] entry**

| Field | Type | Notes |
|---|---|---|
| `policies[].id` | string (non-empty) | Policy identifier, referenced by tests. |
| `policies[].default` | string — must be `"deny"` to pass the computed default-deny check | The policy's declared default effect. |

**Group: tests[] entry**

| Field | Type | Notes |
|---|---|---|
| `tests[].policy_id` | string | The policy this test covers. |
| `tests[].kind` | string — one of `"positive"`, `"negative"`, `"edge"` | Test kind; every policy needs all three kinds declared. |

### Checks

Every check the atom runs — 29 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `decision_model`**

| Check | Requires to pass | Notes |
|---|---|---|
| `decisions_enumerated` | model the decisions: the questions to answer are enumerated (can subject S do action A on resource R, under context C?) |  |
| `input_schema_defined` | the input schema for policy decisions is defined |  |
| `default_deny_declared` | default deny is the declared decision model |  |
| `every_policy_defaults_to_deny` | default deny — every declared policy defaults to deny | Computed over `policies[]`: every declared policy's `default` must be `"deny"`; offending policy ids are named. |
**Section: `policy_code`**

| Check | Requires to pass | Notes |
|---|---|---|
| `policies_declared` | policies declared as code — authorization logic in testable policy, not scattered if statements | Computed-presence check over `policies[]`: policies must be declared as code. |
| `rules_small_and_composable` | write policy as code: small composable rules |  |
| `data_separated_from_logic` | data separated from logic |  |
| `policy_data_versioned` | policy data versioned |  |
| `decision_explanations_available` | decision explanations available for humans |  |
**Section: `testing`**

| Check | Requires to pass | Notes |
|---|---|---|
| `every_policy_tested` | test like code: every declared policy is covered by at least one declared test | Computed over `policies[]` + `tests[]`: every declared policy must be covered by at least one declared test; untested ids are named. |
| `positive_negative_edge_tests_per_policy` | unit tests per rule — every declared policy has a declared positive, negative and edge test | Computed: every declared policy must have a declared positive, a negative and an edge test. |
| `tests_green` | quality gate: tests green |  |
| `lint_and_format_clean` | lint + format in CI (opa fmt / check) clean |  |
| `decision_space_coverage_for_key_roles` | decision-space coverage for key roles declared |  |
**Section: `rollout`**

| Check | Requires to pass | Notes |
|---|---|---|
| `shadow_period_completed` | quality gate: shadow period completed before enforcement — shadow mode logs decisions without enforcing |  |
| `staged_rollout_followed` | roll out safely: shadow mode, then staging enforcement, then production |  |
| `break_glass_documented_gated_audited` | break-glass path documented, gated, and audited |  |
| `break_glass_tested_once` | quality gate: break-glass tested once |  |
| `no_silent_policy_edits` | no silent policy edits |  |
**Section: `decision_logs`**

| Check | Requires to pass | Notes |
|---|---|---|
| `logs_record_who_decision_version_reason` | decision logs: who asked, what was decided, under which policy version, why |  |
| `logs_retained_immutably` | quality gate: decision logs retained immutably |  |
| `full_logging_in_sensitive_flows` | sample in prod, full in sensitive flows — full logging in sensitive flows declared |  |
**Section: `governance_and_enforcement`**

| Check | Requires to pass | Notes |
|---|---|---|
| `second_review_on_policy_changes` | governance: second pair of eyes on policy PRs |  |
| `version_and_changelog_present` | version + changelog kept for the policy pack |  |
| `human_summary_in_sync_with_code` | the human-readable policy summary is in sync with the code |  |
| `enforcement_points_inventoried` | quality gate: enforcement points inventoried — app middleware, gateways, sidecars enumerated |  |
| `failure_mode_chosen_per_surface` | quality gate: failure mode chosen consciously — fail-open vs fail-closed decided per surface |  |
| `sensitive_surfaces_fail_closed` | default: fail closed for sensitive surfaces |  |
| `no_bypass_paths` | skill red line: no bypass paths around enforcement points |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `pack`, `verdict`, `sections`, `checks`, `coverage_status`, `policy_count`, `tested_policy_count`, `test_count`, `test_coverage_ratio`, `untested_policy_ids`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response also carries `coverage_status`, `policy_count`, `tested_policy_count`, `test_count`, `test_coverage_ratio` (the tested-policy share, as a string with exactly four decimal places by the fixed round-half-up rule) and `untested_policy_ids`, plus a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `READY` | All 29 checks pass, including the three computed checks over the declared policies and tests. |
| `NOT_READY` | At least one check fails — a declared boolean is false, a red line is crossed (silent policy edits, bypass paths), or a computed check fails (a policy not defaulting to deny, an untested policy, or a policy missing a positive/negative/edge test). Offending policy ids are named. |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, or no policies/tests declared for the computed checks to run over). |
| `coverage_status = complete_on_declared_tests / incomplete_on_declared_tests / null` | Derived from the declared policies and tests; null when the computed checks cannot run. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `tested-authorization-policy-pack` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "decision_model", "detail": "decision_model must be an object"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for tested-authorization-policy-pack exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded deliverable artifact — never the underlying knowledge itself. teams and agents working in Security & privacy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Access policy for agents and products**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). Most checks read one declared boolean each. Three checks are computed from the declared `policies[]` and `tests[]` entries, using only relationships the bound skill states: every declared policy must default to `"deny"` (offending policy ids are named); every declared policy must be covered by at least one declared test (untested ids are named in the evidence and in `untested_policy_ids`); and every declared policy must have a declared positive, negative and edge test. No outside standard or numeric coverage threshold is imported. Absent = missing; present-but-false or a failed computed check = fail.

**What it does NOT do.**

- Declared evidence only: it does not parse or execute Rego/Cedar, run the caller's tests, read real decision logs, or verify that a declared value is true. Readiness is readiness *on the caller's declared evidence* — a pack whose tests are declared green passes that check even if the tests would fail when run.
- No policy-language linting or evaluation (the `opa fmt`/`check` step is the caller's CI; this atom checks only that it is declared clean).
- No coverage percentage threshold — the skill requires tests per rule and decision-space coverage for key roles, never a number.
- No live shadow-mode observation, log inspection, or enforcement-point probing.
- It audits a declared pack; it does not author policy code.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/tested-authorization-policy-pack/src/tested_authorization_policy_pack.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/tested-authorization-policy-pack/tests/test_tested_authorization_policy_pack.py` (21 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/tested-authorization-policy-pack` and MCP `POST /mcp/tested-authorization-policy-pack` (tool `tested_authorization_policy_pack`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

Included because this atom is compliance-facing: its verdict is audit evidence about an authorization policy pack. What it gives a reviewer: default-deny verified over every declared policy, per-policy test coverage with untested policy ids named, decision-log and governance posture, and the full per-check evidence array. What it does not give: execution of the policies or tests, live enforcement-point probing, or a certification of the running system.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:51:55.166579+00:00 against gateway v1.1.0, external verification lane, source `verification/work/tested-authorization-policy-pack/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: computed_spot_checks: policy_count=2, tested_policy_count=2, test_count=6, test_coverage_ratio='1.0000'

Input:

```json
{
  "pack": "auth-v1",
  "decision_model": {
    "decisions_enumerated": true,
    "input_schema_defined": true,
    "default_deny": true
  },
  "policies": [
    {
      "id": "p1",
      "default": "deny"
    },
    {
      "id": "p2",
      "default": "deny"
    }
  ],
  "policy_code": {
    "rules_small_and_composable": true,
    "data_separated_from_logic": true,
    "policy_data_versioned": true,
    "decision_explanations_available": true
  },
  "tests": [
    {
      "policy_id": "p1",
      "kind": "positive"
    },
    {
      "policy_id": "p1",
      "kind": "negative"
    },
    {
      "policy_id": "p1",
      "kind": "edge"
    },
    {
      "policy_id": "p2",
      "kind": "positive"
    },
    {
      "policy_id": "p2",
      "kind": "negative"
    },
    {
      "policy_id": "p2",
      "kind": "edge"
    }
  ],
  "testing": {
    "tests_green": true,
    "lint_format_clean": true,
    "key_roles_coverage_declared": true
  },
  "rollout": {
    "shadow_completed": true,
    "staged_before_production": true,
    "break_glass_documented_gated_audited": true,
    "break_glass_tested": true,
    "silent_policy_edits": false
  },
  "decision_logs": {
    "record_who_decision_version_reason": true,
    "retained_immutably": true,
    "full_in_sensitive_flows": true
  },
  "governance": {
    "second_pair_of_eyes_on_prs": true,
    "version_and_changelog": true,
    "human_summary_in_sync_with_code": true
  },
  "enforcement": {
    "points_inventoried": true,
    "failure_mode_chosen_per_surface": true,
    "sensitive_surfaces_fail_closed": true,
    "bypass_paths_present": false
  }
}
```

Response (REST):

```json
{
  "service": "tested-authorization-policy-pack",
  "atom_version": "0.1.0",
  "pack": "auth-v1",
  "verdict": "READY",
  "sections": {
    "decision_model": "pass",
    "policy_code": "pass",
    "testing": "pass",
    "rollout": "pass",
    "decision_logs": "pass",
    "governance_and_enforcement": "pass"
  },
  "checks": [
    {
      "section": "decision_model",
      "check": "decisions_enumerated",
      "status": "pass",
      "evidence": "model the decisions: the questions to answer are enumerated (can subject S do action A on resource R, under context C?)"
    },
    {
      "section": "decision_model",
      "check": "input_schema_defined",
      "status": "pass",
      "evidence": "the input schema for policy decisions is defined"
    },
    {
      "section": "decision_model",
      "check": "default_deny_declared",
      "status": "pass",
      "evidence": "default deny is the declared decision model"
    },
    {
      "section": "decision_model",
      "check": "every_policy_defaults_to_deny",
      "status": "pass",
      "evidence": "default deny — every declared policy defaults to deny"
    },
    {
      "section": "policy_code",
      "check": "policies_declared",
      "status": "pass",
      "evidence": "policies declared as code — authorization logic in testable policy, not scattered if statements"
    },
    {
      "section": "policy_code",
      "check": "rules_small_and_composable",
      "status": "pass",
      "evidence": "write policy as code: small composable rules"
    },
    {
      "section": "policy_code",
      "check": "data_separated_from_logic",
      "status": "pass",
      "evidence": "data separated from logic"
    },
    {
      "section": "policy_code",
      "check": "policy_data_versioned",
      "status": "pass",
      "evidence": "policy data versioned"
    },
    {
      "section": "policy_code",
      "check": "decision_explanations_available",
      "status": "pass",
      "evidence": "decision explanations available for humans"
    },
    {
      "section": "testing",
      "check": "every_policy_tested",
      "status": "pass",
      "evidence": "test like code: every declared policy is covered by at least one declared test"
    },
    {
      "section": "testing",
      "check": "positive_negative_edge_tests_per_policy",
      "status": "pass",
      "evidence": "unit tests per rule — every declared policy has a declared positive, negative and edge test"
    },
    {
      "section": "testing",
      "check": "tests_green",
      "status": "pass",
      "evidence": "quality gate: tests green"
    },
    {
      "section": "testing",
      "check": "lint_and_format_clean",
      "status": "pass",
      "evidence": "lint + format in CI (opa fmt / check) clean"
    },
    {
      "section": "testing",
      "check": "decision_space_coverage_for_key_roles",
      "status": "pass",
      "evidence": "decision-space coverage for key roles declared"
    },
    {
      "section": "rollout",
      "check": "shadow_period_completed",
      "status": "pass",
      "evidence": "quality gate: shadow period completed before enforcement — shadow mode logs decisions without enforcing"
    },
    {
      "section": "rollout",
      "check": "staged_rollout_followed",
      "status": "pass",
      "evidence": "roll out safely: shadow mode, then staging enforcement, then production"
    },
    {
      "section": "rollout",
      "check": "break_glass_documented_gated_audited",
      "status": "pass",
      "evidence": "break-glass path documented, gated, and audited"
    },
    {
      "section": "rollout",
      "check": "break_glass_tested_once",
      "status": "pass",
      "evidence": "quality gate: break-glass tested once"
    },
    {
      "section": "rollout",
      "check": "no_silent_policy_edits",
      "status": "pass",
      "evidence": "no silent policy edits"
    },
    {
      "section": "decision_logs",
      "check": "logs_record_who_decision_version_reason",
      "status": "pass",
      "evidence": "decision logs: who asked, what was decided, under which policy version, why"
    },
    {
      "section": "decision_logs",
      "check": "logs_retained_immutably",
      "status": "pass",
      "evidence": "quality gate: decision logs retained immutably"
    },
    {
      "section": "decision_logs",
      "check": "full_logging_in_sensitive_flows",
      "status": "pass",
      "evidence": "sample in prod, full in sensitive flows — full logging in sensitive flows declared"
    },
    {
      "section": "governance_and_enforcement",
      "check": "second_review_on_policy_changes",
      "status": "pass",
      "evidence": "governance: second pair of eyes on policy PRs"
    },
    {
      "section": "governance_and_enforcement",
      "check": "version_and_changelog_present",
      "status": "pass",
      "evidence": "version + changelog kept for the policy pack"
    },
    {
      "section": "governance_and_enforcement",
      "check": "human_summary_in_sync_with_code",
      "status": "pass",
      "evidence": "the human-readable policy summary is in sync with the code"
    },
    {
      "section": "governance_and_enforcement",
      "check": "enforcement_points_inventoried",
      "status": "pass",
      "evidence": "quality gate: enforcement points inventoried — app middleware, gateways, sidecars enumerated"
    },
    {
      "section": "governance_and_enforcement",
      "check": "failure_mode_chosen_per_surface",
      "status": "pass",
      "evidence": "quality gate: failure mode chosen consciously — fail-open vs fail-closed decided per surface"
    },
    {
      "section": "governance_and_enforcement",
      "check": "sensitive_surfaces_fail_closed",
      "status": "pass",
      "evidence": "default: fail closed for sensitive surfaces"
    },
    {
      "section": "governance_and_enforcement",
      "check": "no_bypass_paths",
      "status": "pass",
      "evidence": "skill red line: no bypass paths around enforcement points"
    }
  ],
  "coverage_status": "complete_on_declared_tests",
  "policy_count": 2,
  "tested_policy_count": 2,
  "test_count": 6,
  "test_coverage_ratio": "1.0000",
  "untested_policy_ids": [],
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections.",
  "stamp": "TESTED AUTHORIZATION POLICY PACK\npack: auth-v1\nVERDICT: READY\n  decision_model            pass\n  policy_code               pass\n  testing                   pass\n  rollout                   pass\n  decision_logs             pass\n  governance_and_enforcement pass\n29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Violates red lines: default-allow, silent edits, bypass paths, and incomplete test coverage per rule.

Input:

```json
{
  "pack": "auth-v1",
  "decision_model": {
    "decisions_enumerated": true,
    "input_schema_defined": true,
    "default_deny": true
  },
  "policies": [
    {
      "id": "p1",
      "default": "allow"
    }
  ],
  "policy_code": {
    "rules_small_and_composable": true,
    "data_separated_from_logic": true,
    "policy_data_versioned": true,
    "decision_explanations_available": true
  },
  "tests": [
    {
      "policy_id": "p1",
      "kind": "positive"
    }
  ],
  "testing": {
    "tests_green": true,
    "lint_format_clean": true,
    "key_roles_coverage_declared": true
  },
  "rollout": {
    "shadow_completed": true,
    "staged_before_production": true,
    "break_glass_documented_gated_audited": true,
    "break_glass_tested": true,
    "silent_policy_edits": true
  },
  "decision_logs": {
    "record_who_decision_version_reason": true,
    "retained_immutably": true,
    "full_in_sensitive_flows": true
  },
  "governance": {
    "second_pair_of_eyes_on_prs": true,
    "version_and_changelog": true,
    "human_summary_in_sync_with_code": true
  },
  "enforcement": {
    "points_inventoried": true,
    "failure_mode_chosen_per_surface": true,
    "sensitive_surfaces_fail_closed": true,
    "bypass_paths_present": true
  }
}
```

Response (REST):

```json
{
  "service": "tested-authorization-policy-pack",
  "atom_version": "0.1.0",
  "pack": "auth-v1",
  "verdict": "NOT_READY",
  "sections": {
    "decision_model": "fail",
    "policy_code": "pass",
    "testing": "fail",
    "rollout": "fail",
    "decision_logs": "pass",
    "governance_and_enforcement": "fail"
  },
  "checks": [
    {
      "section": "decision_model",
      "check": "decisions_enumerated",
      "status": "pass",
      "evidence": "model the decisions: the questions to answer are enumerated (can subject S do action A on resource R, under context C?)"
    },
    {
      "section": "decision_model",
      "check": "input_schema_defined",
      "status": "pass",
      "evidence": "the input schema for policy decisions is defined"
    },
    {
      "section": "decision_model",
      "check": "default_deny_declared",
      "status": "pass",
      "evidence": "default deny is the declared decision model"
    },
    {
      "section": "decision_model",
      "check": "every_policy_defaults_to_deny",
      "status": "fail",
      "evidence": "skill red line: no default-allow — policies not defaulting to deny: p1"
    },
    {
      "section": "policy_code",
      "check": "policies_declared",
      "status": "pass",
      "evidence": "policies declared as code — authorization logic in testable policy, not scattered if statements"
    },
    {
      "section": "policy_code",
      "check": "rules_small_and_composable",
      "status": "pass",
      "evidence": "write policy as code: small composable rules"
    },
    {
      "section": "policy_code",
      "check": "data_separated_from_logic",
      "status": "pass",
      "evidence": "data separated from logic"
    },
    {
      "section": "policy_code",
      "check": "policy_data_versioned",
      "status": "pass",
      "evidence": "policy data versioned"
    },
    {
      "section": "policy_code",
      "check": "decision_explanations_available",
      "status": "pass",
      "evidence": "decision explanations available for humans"
    },
    {
      "section": "testing",
      "check": "every_policy_tested",
      "status": "pass",
      "evidence": "test like code: every declared policy is covered by at least one declared test"
    },
    {
      "section": "testing",
      "check": "positive_negative_edge_tests_per_policy",
      "status": "fail",
      "evidence": "unit tests per rule — positive, negative, edge cases; policies missing a test kind: p1"
    },
    {
      "section": "testing",
      "check": "tests_green",
      "status": "pass",
      "evidence": "quality gate: tests green"
    },
    {
      "section": "testing",
      "check": "lint_and_format_clean",
      "status": "pass",
      "evidence": "lint + format in CI (opa fmt / check) clean"
    },
    {
      "section": "testing",
      "check": "decision_space_coverage_for_key_roles",
      "status": "pass",
      "evidence": "decision-space coverage for key roles declared"
    },
    {
      "section": "rollout",
      "check": "shadow_period_completed",
      "status": "pass",
      "evidence": "quality gate: shadow period completed before enforcement — shadow mode logs decisions without enforcing"
    },
    {
      "section": "rollout",
      "check": "staged_rollout_followed",
      "status": "pass",
      "evidence": "roll out safely: shadow mode, then staging enforcement, then production"
    },
    {
      "section": "rollout",
      "check": "break_glass_documented_gated_audited",
      "status": "pass",
      "evidence": "break-glass path documented, gated, and audited"
    },
    {
      "section": "rollout",
      "check": "break_glass_tested_once",
      "status": "pass",
      "evidence": "quality gate: break-glass tested once"
    },
    {
      "section": "rollout",
      "check": "no_silent_policy_edits",
      "status": "fail",
      "evidence": "no silent policy edits"
    },
    {
      "section": "decision_logs",
      "check": "logs_record_who_decision_version_reason",
      "status": "pass",
      "evidence": "decision logs: who asked, what was decided, under which policy version, why"
    },
    {
      "section": "decision_logs",
      "check": "logs_retained_immutably",
      "status": "pass",
      "evidence": "quality gate: decision logs retained immutably"
    },
    {
      "section": "decision_logs",
      "check": "full_logging_in_sensitive_flows",
      "status": "pass",
      "evidence": "sample in prod, full in sensitive flows — full logging in sensitive flows declared"
    },
    {
      "section": "governance_and_enforcement",
      "check": "second_review_on_policy_changes",
      "status": "pass",
      "evidence": "governance: second pair of eyes on policy PRs"
    },
    {
      "section": "governance_and_enforcement",
      "check": "version_and_changelog_present",
      "status": "pass",
      "evidence": "version + changelog kept for the policy pack"
    },
    {
      "section": "governance_and_enforcement",
      "check": "human_summary_in_sync_with_code",
      "status": "pass",
      "evidence": "the human-readable policy summary is in sync with the code"
    },
    {
      "section": "governance_and_enforcement",
      "check": "enforcement_points_inventoried",
      "status": "pass",
      "evidence": "quality gate: enforcement points inventoried — app middleware, gateways, sidecars enumerated"
    },
    {
      "section": "governance_and_enforcement",
      "check": "failure_mode_chosen_per_surface",
      "status": "pass",
      "evidence": "quality gate: failure mode chosen consciously — fail-open vs fail-closed decided per surface"
    },
    {
      "section": "governance_and_enforcement",
      "check": "sensitive_surfaces_fail_closed",
      "status": "pass",
      "evidence": "default: fail closed for sensitive surfaces"
    },
    {
      "section": "governance_and_enforcement",
      "check": "no_bypass_paths",
      "status": "fail",
      "evidence": "skill red line: no bypass paths around enforcement points"
    }
  ],
  "coverage_status": "incomplete_on_declared_tests",
  "policy_count": 1,
  "tested_policy_count": 1,
  "test_count": 1,
  "test_coverage_ratio": "1.0000",
  "untested_policy_ids": [],
  "summary": "25 pass, 4 fail, 0 missing of 29 checks across six sections.",
  "stamp": "TESTED AUTHORIZATION POLICY PACK\npack: auth-v1\nVERDICT: NOT_READY\n  decision_model            fail\n  policy_code               pass\n  testing                   fail\n  rollout                   fail\n  decision_logs             pass\n  governance_and_enforcement fail\n25 pass, 4 fail, 0 missing of 29 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Input schema violation: expected objects/lists, received primitives.

Input:

```json
{
  "pack": "bad-types",
  "decision_model": "not-an-object",
  "policies": "not-a-list"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision_model",
  "detail": "decision_model must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators Y (compliance-facing — the verdict is audit evidence about an authorization policy pack (default-deny, per-policy test coverage, decision logging, governance) of the kind a security reviewer or auditor relies on; it attests the declared pack's posture, not the behaviour of a running enforcement point.) |
| Checks named count vs recorded count | 29 / 29 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 32 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/tested-authorization-policy-pack/evidence.json` |

