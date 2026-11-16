# Firewall rules audit — `firewall-rules-audit`

**Display name:** Firewall rules audit · **Slug:** `firewall-rules-audit` · **Deliverable type:** CHECK · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "firewall-rules-audit"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the firewall ruleset and management-posture manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `system`: `production-cluster`, `environment`: `production`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/firewall-rules-audit` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SOUND` and the summary “20 pass, 0 fail, 0 missing of 20 checks across five sections.” — every one of the 20 checks passed. The response carries the per-section results under `sections`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `SOUND` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "firewall-rules-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `firewall_rules_audit` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/firewall-rules-audit` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/firewall-rules-audit` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `firewall_rules_audit`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `UNSOUND` — 5 pass, 15 fail, 0 missing. The declared ruleset had `default_policy` `allow` in both directions and a single any-any allow rule spanning ports 0–65535. Fix order:

1. Baseline first: set `default_policy.inbound` and `default_policy.outbound` to `deny`, and declare an explicit default-deny rule (the recorded full-pass rules name theirs `deny-all-in` / `deny-all-out`).
2. Least privilege: remove or narrow any-any allow rules and any allow rule spanning 1000 or more ports; check the evidence strings — rule-level checks name the offending rule ids.
3. Then the posture sections: explicit egress allowlist with alerting on denies (`egress.*`), change review and rule retirement (`change_control.*`), denial logging with rate limits (`logging.*`), post-change testing (`testing.*`), and a review cadence of 1–31 days (`review.cadence_days`).

Re-submit the corrected manifest; the same input always returns the same verdict.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "review.cadence_days",
  "detail": "review.cadence_days must be a number"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/firewall-rules-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/firewall-rules-audit` — JSON-RPC; tool name `firewall_rules_audit`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `firewall_rules_audit`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: top level

| Field | Type | Notes |
|---|---|---|
| `system` | string | echoed in the output as the audited subject |
| `environment` | string | echoed in the output (e.g. `production`) |
| `layers_consistent` | boolean | platform layers consistent, no conflicting opens |
| `rules` | array of rule objects (schema below) | all rule-level checks: `explicit_default_deny_rule_present`, `no_any_any_allow_rules`, `no_overly_broad_port_ranges` (allow span ≥ 1000 ports), `no_shadowed_rules`, `no_direct_sensitive_exposure`, `no_port_forwards_without_review`, `every_allow_rule_documented`, `temporary_rules_have_ticket_and_expiry` |

#### Group: default_policy

| Field | Type | Notes |
|---|---|---|
| `default_policy.inbound` | string (`deny`/`allow`) | `deny`/`allow`; must be `deny` |
| `default_policy.outbound` | string (`deny`/`allow`) | `deny`/`allow`; must be `deny` |

#### Group: egress

| Field | Type | Notes |
|---|---|---|
| `egress.explicit_allowlist` | boolean | `explicit_egress_allowlist` |
| `egress.alert_on_denies` | boolean | `egress_alert_on_denies` |

#### Group: change_control

| Field | Type | Notes |
|---|---|---|
| `change_control.changes_reviewed` | boolean | `changes_reviewed_like_code` |
| `change_control.old_rules_retired_on_schedule` | boolean | `old_rules_retired_on_schedule` |

#### Group: logging

| Field | Type | Notes |
|---|---|---|
| `logging.denials_logged` | boolean | `denials_logged` |
| `logging.rate_limited` | boolean | `denial_logging_rate_limited` |

#### Group: testing

| Field | Type | Notes |
|---|---|---|
| `testing.allowed_and_disallowed_paths_verified` | boolean | `post_change_test_allowed_and_blocked` |
| `testing.smoke_matrix_per_service` | boolean | `smoke_matrix_per_service` |

#### Group: review

| Field | Type | Notes |
|---|---|---|
| `review.cadence_days` | number | number; must be 1–31 (monthly review) |

#### Group: rules[]

| Field | Type | Notes |
|---|---|---|
| `rules[].id` | string | rule name used in evidence strings (fallback: `rule[<index>]`) |
| `rules[].direction` | string | `inbound` or `outbound` |
| `rules[].source` | string | address/CIDR, or `any` / `*` / `0.0.0.0/0` / `::/0` / `internet` for any |
| `rules[].destination` | string | address/CIDR, or any-value as for `source` |
| `rules[].port_start` | integer | first destination port; if `port_start`/`port_end` are not both integers the rule is treated as covering ports 0–65535 |
| `rules[].port_end` | integer | last destination port |
| `rules[].protocol` | string | e.g. `tcp`, `udp`, or `any`/`all`/`*`; absent means `any` for shadowing |
| `rules[].action` | string | `allow` or `deny` |
| `rules[].owner` | string | required (with `reason` and `date`) on every allow rule |
| `rules[].reason` | string | why the allow exists — required on every allow rule |
| `rules[].date` | string | date of the rule comment — required on every allow rule |
| `rules[].service` | string | destination service tag; sensitive tags (database/db/mysql/postgres/mssql/mongodb/redis/elasticsearch/admin/control-plane/agent-control-plane/docker, and ports 1433, 2375, 2376, 3306, 5432, 6379, 9200, 27017) trigger the direct-exposure red line when allowed inbound from any |
| `rules[].temporary` | boolean | if `true`, `ticket` and `expiry_date` are both required |
| `rules[].ticket` | string | ticket id for a temporary rule |
| `rules[].expiry_date` | string | expiry date for a temporary rule |
| `rules[].port_forward` | boolean | if `true`, `reviewed` must be `true` |
| `rules[].reviewed` | boolean | the port-forward's inventory review |

### Checks

Every check the atom runs — 20 checks, matching the 20 entries in the recorded full-pass response's `checks` array exactly (names and sections grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Section: baseline

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `default_deny_inbound` | skill method 1: default deny, both directions — inbound starts closed |  |
| `default_deny_outbound` | skill method 1: default deny, both directions — outbound starts closed |  |
| `explicit_default_deny_rule_present` | explicit default-deny rule present: deny-all-in |  |
| `layers_consistent` | skill method 4: platform layers consistent, no conflicting opens |  |
#### Section: least_privilege

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `no_any_any_allow_rules` | no any-any allow rules |  |
| `no_overly_broad_port_ranges` | no allow rule spans 1000 or more ports | Fails on any allow rule whose span is ≥ 1000 ports. |
| `no_shadowed_rules` | no shadowed rules | Computed deterministically: a later rule is shadowed when an earlier rule in the same direction covers its source and destination (any-value, exact match, or IPv4 CIDR containment), covers its port range, and covers its protocol. |
| `no_direct_sensitive_exposure` | no direct exposure of databases, admin panels, or agent control planes |  |
| `no_port_forwards_without_review` | no port-forward without a review (port-forwards are inventory items with reviews) | Conditional per rule: only rules with `port_forward: true` need `reviewed: true`. |
#### Section: egress

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `explicit_egress_allowlist` | skill method 3: explicit egress — outbound allowlists for the services actually called |  |
| `egress_alert_on_denies` | skill method 3: alert on denies to spot misconfig and compromise |  |
#### Section: documentation_change

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `every_allow_rule_documented` | every allow entry has reason + owner + date (quality gate: every allow entry has reason + owner comment) |  |
| `changes_reviewed_like_code` | skill method 6: changes reviewed like code |  |
| `temporary_rules_have_ticket_and_expiry` | no temporary rule without a ticket and expiry date | Conditional per rule: only rules with `temporary: true` need `ticket` + `expiry_date`. |
| `old_rules_retired_on_schedule` | skill method 6: old rules retired on a schedule |  |
#### Section: assurance

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `denials_logged` | skill method 8: denials logged |  |
| `denial_logging_rate_limited` | skill method 8: denials logged with rate-limits to avoid noise floods |  |
| `post_change_test_allowed_and_blocked` | quality gate: post-change test — allowed path passes, disallowed fails |  |
| `smoke_matrix_per_service` | skill method 7: keep a smoke matrix per service |  |
| `review_cadence_within_31_days` | cadence_days=30 (skill: review top denied flows monthly; rule review performed on schedule) |  |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "firewall-rules-audit",
  "atom_version": "0.1.0",
  "system": "production-cluster",
  "environment": "production",
  "verdict": "SOUND",
  "sections": {
    "baseline": "...",
    "least_privilege": "...",
    "egress": "...",
    "documentation_change": "...",
    "assurance": "..."
  },
  "checks": [
    {
      "section": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "20 pass, 0 fail, 0 missing of 20 checks across five sections.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `system`, `environment`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `sections` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `SOUND` | all 20 checks pass across the five sections. |
| `UNSOUND` | at least one check fails — the declared ruleset or posture breaches a check. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the verdict names exactly which evidence to supply. |

**Section statuses** (values of the `sections` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the firewall_rules_audit scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the firewall_rules_audit scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "review.cadence_days", "detail": "review.cadence_days must be a number"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for firewall-rules-audit exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

Bound capability (from the bound skill): design firewalls that hold — default deny, least-privilege rules, explicit egress, tested and reviewed. The audit runs 20 deterministic checks across five sections: baseline, least_privilege, egress, documentation_change, assurance — including rule-level checks over the declared `rules[]` list (any-any allows, shadowed rules, broad port ranges, sensitive-service exposure, undocumented or expired temporary rules) that name the offending rules in their evidence.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- It audits the declared ruleset and posture in the manifest. It does not connect to, scan, or probe a live firewall, and it does not verify that the deployed rules match the declared ones.
- Shadowing is computed deterministically from the declared rule order and fields (see the rule schema notes in the input reference); a ruleset whose real engine orders or matches rules differently can behave differently in production.
- It sells the check — a bounded judgment artifact — never the underlying firewall-design knowledge.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use workflow (R3, passed): product release-gate firewall audit.

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/firewall-rules-audit` (REST) or the MCP tool `firewall_rules_audit` at `POST https://atoms.pipavia.com/mcp/firewall-rules-audit`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/firewall_rules_audit.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 17 local tests in `tests/test_firewall_rules_audit.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/firewall-rules-audit` and MCP `POST /mcp/firewall-rules-audit` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `firewall_rules_audit`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/firewall-rules-audit.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/firewall-rules-audit/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/firewall-rules-audit.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-15T23:59:33.075358+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/firewall-rules-audit/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "system": "production-cluster",
  "environment": "production",
  "default_policy": {
    "inbound": "deny",
    "outbound": "deny"
  },
  "layers_consistent": true,
  "rules": [
    {
      "id": "allow-web",
      "direction": "inbound",
      "source": "10.0.0.0/8",
      "destination": "10.0.0.5",
      "port_start": 80,
      "port_end": 80,
      "protocol": "tcp",
      "action": "allow",
      "owner": "admin",
      "reason": "web traffic",
      "date": "2026-01-01"
    },
    {
      "id": "deny-all-in",
      "direction": "inbound",
      "source": "any",
      "destination": "any",
      "port_start": 0,
      "port_end": 65535,
      "protocol": "any",
      "action": "deny"
    },
    {
      "id": "deny-all-out",
      "direction": "outbound",
      "source": "any",
      "destination": "any",
      "port_start": 0,
      "port_end": 65535,
      "protocol": "any",
      "action": "deny"
    }
  ],
  "egress": {
    "explicit_allowlist": true,
    "alert_on_denies": true
  },
  "change_control": {
    "changes_reviewed": true,
    "old_rules_retired_on_schedule": true
  },
  "logging": {
    "denials_logged": true,
    "rate_limited": true
  },
  "testing": {
    "allowed_and_disallowed_paths_verified": true,
    "smoke_matrix_per_service": true
  },
  "review": {
    "cadence_days": 30
  }
}
```

Response (REST):

```json
{
  "service": "firewall-rules-audit",
  "atom_version": "0.1.0",
  "system": "production-cluster",
  "environment": "production",
  "verdict": "SOUND",
  "sections": {
    "baseline": "pass",
    "least_privilege": "pass",
    "egress": "pass",
    "documentation_change": "pass",
    "assurance": "pass"
  },
  "checks": [
    {
      "section": "baseline",
      "check": "default_deny_inbound",
      "status": "pass",
      "evidence": "skill method 1: default deny, both directions — inbound starts closed"
    },
    {
      "section": "baseline",
      "check": "default_deny_outbound",
      "status": "pass",
      "evidence": "skill method 1: default deny, both directions — outbound starts closed"
    },
    {
      "section": "baseline",
      "check": "explicit_default_deny_rule_present",
      "status": "pass",
      "evidence": "explicit default-deny rule present: deny-all-in"
    },
    {
      "section": "baseline",
      "check": "layers_consistent",
      "status": "pass",
      "evidence": "skill method 4: platform layers consistent, no conflicting opens"
    },
    {
      "section": "least_privilege",
      "check": "no_any_any_allow_rules",
      "status": "pass",
      "evidence": "no any-any allow rules"
    },
    {
      "section": "least_privilege",
      "check": "no_overly_broad_port_ranges",
      "status": "pass",
      "evidence": "no allow rule spans 1000 or more ports"
    },
    {
      "section": "least_privilege",
      "check": "no_shadowed_rules",
      "status": "pass",
      "evidence": "no shadowed rules"
    },
    {
      "section": "least_privilege",
      "check": "no_direct_sensitive_exposure",
      "status": "pass",
      "evidence": "no direct exposure of databases, admin panels, or agent control planes"
    },
    {
      "section": "least_privilege",
      "check": "no_port_forwards_without_review",
      "status": "pass",
      "evidence": "no port-forward without a review (port-forwards are inventory items with reviews)"
    },
    {
      "section": "egress",
      "check": "explicit_egress_allowlist",
      "status": "pass",
      "evidence": "skill method 3: explicit egress — outbound allowlists for the services actually called"
    },
    {
      "section": "egress",
      "check": "egress_alert_on_denies",
      "status": "pass",
      "evidence": "skill method 3: alert on denies to spot misconfig and compromise"
    },
    {
      "section": "documentation_change",
      "check": "every_allow_rule_documented",
      "status": "pass",
      "evidence": "every allow entry has reason + owner + date (quality gate: every allow entry has reason + owner comment)"
    },
    {
      "section": "documentation_change",
      "check": "changes_reviewed_like_code",
      "status": "pass",
      "evidence": "skill method 6: changes reviewed like code"
    },
    {
      "section": "documentation_change",
      "check": "temporary_rules_have_ticket_and_expiry",
      "status": "pass",
      "evidence": "no temporary rule without a ticket and expiry date"
    },
    {
      "section": "documentation_change",
      "check": "old_rules_retired_on_schedule",
      "status": "pass",
      "evidence": "skill method 6: old rules retired on a schedule"
    },
    {
      "section": "assurance",
      "check": "denials_logged",
      "status": "pass",
      "evidence": "skill method 8: denials logged"
    },
    {
      "section": "assurance",
      "check": "denial_logging_rate_limited",
      "status": "pass",
      "evidence": "skill method 8: denials logged with rate-limits to avoid noise floods"
    },
    {
      "section": "assurance",
      "check": "post_change_test_allowed_and_blocked",
      "status": "pass",
      "evidence": "quality gate: post-change test — allowed path passes, disallowed fails"
    },
    {
      "section": "assurance",
      "check": "smoke_matrix_per_service",
      "status": "pass",
      "evidence": "skill method 7: keep a smoke matrix per service"
    },
    {
      "section": "assurance",
      "check": "review_cadence_within_31_days",
      "status": "pass",
      "evidence": "cadence_days=30 (skill: review top denied flows monthly; rule review performed on schedule)"
    }
  ],
  "summary": "20 pass, 0 fail, 0 missing of 20 checks across five sections.",
  "stamp": "FIREWALL RULES AUDIT\nsystem: production-cluster  environment: production\nVERDICT: SOUND\n  baseline             pass\n  least_privilege      pass\n  egress               pass\n  documentation_change pass\n  assurance            pass\n20 pass, 0 fail, 0 missing of 20 checks across five sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "system": "test-env",
  "environment": "dev",
  "default_policy": {
    "inbound": "allow",
    "outbound": "allow"
  },
  "layers_consistent": true,
  "rules": [
    {
      "id": "bad-rule",
      "direction": "inbound",
      "source": "any",
      "destination": "any",
      "port_start": 0,
      "port_end": 65535,
      "protocol": "any",
      "action": "allow",
      "owner": "dev",
      "reason": "testing",
      "date": "2026-01-01"
    }
  ],
  "egress": {
    "explicit_allowlist": false,
    "alert_on_denies": false
  },
  "change_control": {
    "changes_reviewed": false,
    "old_rules_retired_on_schedule": false
  },
  "logging": {
    "denials_logged": false,
    "rate_limited": false
  },
  "testing": {
    "allowed_and_disallowed_paths_verified": false,
    "smoke_matrix_per_service": false
  },
  "review": {
    "cadence_days": 99
  }
}
```

Response (REST):

```json
{
  "service": "firewall-rules-audit",
  "atom_version": "0.1.0",
  "system": "test-env",
  "environment": "dev",
  "verdict": "UNSOUND",
  "sections": {
    "baseline": "fail",
    "least_privilege": "fail",
    "egress": "fail",
    "documentation_change": "fail",
    "assurance": "fail"
  },
  "checks": [
    {
      "section": "baseline",
      "check": "default_deny_inbound",
      "status": "fail",
      "evidence": "skill method 1: default deny, both directions — inbound starts closed"
    },
    {
      "section": "baseline",
      "check": "default_deny_outbound",
      "status": "fail",
      "evidence": "skill method 1: default deny, both directions — outbound starts closed"
    },
    {
      "section": "baseline",
      "check": "explicit_default_deny_rule_present",
      "status": "fail",
      "evidence": "no explicit deny-any rule in the declared rules (missing default-deny rule)"
    },
    {
      "section": "baseline",
      "check": "layers_consistent",
      "status": "pass",
      "evidence": "skill method 4: platform layers consistent, no conflicting opens"
    },
    {
      "section": "least_privilege",
      "check": "no_any_any_allow_rules",
      "status": "fail",
      "evidence": "any-any allow rules (skill: no any-any in production, ever): bad-rule"
    },
    {
      "section": "least_privilege",
      "check": "no_overly_broad_port_ranges",
      "status": "fail",
      "evidence": "overly broad port ranges (least-privilege: scope by port): bad-rule ports 0-65535"
    },
    {
      "section": "least_privilege",
      "check": "no_shadowed_rules",
      "status": "pass",
      "evidence": "no shadowed rules"
    },
    {
      "section": "least_privilege",
      "check": "no_direct_sensitive_exposure",
      "status": "fail",
      "evidence": "directly exposed sensitive rules (skill red line: no direct exposure of databases, admin panels, or agent control planes): bad-rule"
    },
    {
      "section": "least_privilege",
      "check": "no_port_forwards_without_review",
      "status": "pass",
      "evidence": "no port-forward without a review (port-forwards are inventory items with reviews)"
    },
    {
      "section": "egress",
      "check": "explicit_egress_allowlist",
      "status": "fail",
      "evidence": "skill method 3: explicit egress — outbound allowlists for the services actually called"
    },
    {
      "section": "egress",
      "check": "egress_alert_on_denies",
      "status": "fail",
      "evidence": "skill method 3: alert on denies to spot misconfig and compromise"
    },
    {
      "section": "documentation_change",
      "check": "every_allow_rule_documented",
      "status": "pass",
      "evidence": "every allow entry has reason + owner + date (quality gate: every allow entry has reason + owner comment)"
    },
    {
      "section": "documentation_change",
      "check": "changes_reviewed_like_code",
      "status": "fail",
      "evidence": "skill method 6: changes reviewed like code"
    },
    {
      "section": "documentation_change",
      "check": "temporary_rules_have_ticket_and_expiry",
      "status": "pass",
      "evidence": "no temporary rule without a ticket and expiry date"
    },
    {
      "section": "documentation_change",
      "check": "old_rules_retired_on_schedule",
      "status": "fail",
      "evidence": "skill method 6: old rules retired on a schedule"
    },
    {
      "section": "assurance",
      "check": "denials_logged",
      "status": "fail",
      "evidence": "skill method 8: denials logged"
    },
    {
      "section": "assurance",
      "check": "denial_logging_rate_limited",
      "status": "fail",
      "evidence": "skill method 8: denials logged with rate-limits to avoid noise floods"
    },
    {
      "section": "assurance",
      "check": "post_change_test_allowed_and_blocked",
      "status": "fail",
      "evidence": "quality gate: post-change test — allowed path passes, disallowed fails"
    },
    {
      "section": "assurance",
      "check": "smoke_matrix_per_service",
      "status": "fail",
      "evidence": "skill method 7: keep a smoke matrix per service"
    },
    {
      "section": "assurance",
      "check": "review_cadence_within_31_days",
      "status": "fail",
      "evidence": "cadence_days=99 (skill: review top denied flows monthly; rule review performed on schedule)"
    }
  ],
  "summary": "5 pass, 15 fail, 0 missing of 20 checks across five sections.",
  "stamp": "FIREWALL RULES AUDIT\nsystem: test-env  environment: dev\nVERDICT: UNSOUND\n  baseline             fail\n  least_privilege      fail\n  egress               fail\n  documentation_change fail\n  assurance            fail\n5 pass, 15 fail, 0 missing of 20 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "system": "malformed-test",
  "review": {
    "cadence_days": "thirty"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "review.cadence_days",
  "detail": "review.cadence_days must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 20 documented / 20 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 32 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/firewall-rules-audit/evidence.json` |
