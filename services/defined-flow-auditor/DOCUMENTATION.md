# Defined-flow auditor — documentation

**Defined-flow auditor** · slug `defined-flow-auditor` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — a production system, `production-cluster-alpha` — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "defined-flow-auditor"}`. Keep the returned key — you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the manifest.** Build one JSON object: a zero-trust evidence manifest: a system's actual flows — authentication and authorization, identity-based access, least privilege, segmentation, continuous verification, the claim gauntlet, and scope and limits. In the recorded run the manifest names `system: "production-cluster-alpha"` and declares every field `true` in the passing sense (every must-be-false field `false`), with the supporting rows the computed checks read.
3. **Send it.** `POST https://atoms.pipavia.com/v1/defined-flow-auditor` with the manifest as the body and the `Authorization` header set.
4. **Read the verdict.** The recorded response is HTTP 200 with verdict `DEFINED`. Its `summary` reads: “24 pass, 0 fail, 0 missing of 24 checks across seven sections.” Every section in `sections` is `pass`, and every entry in `checks` carries `status: "pass"` with its evidence line.
5. **Keep the stamp.** The response's `stamp` field is the same verdict as a plain-text block, suitable for pasting into a change record or review note.

You now have the deliverable: one deterministic verdict. Same manifest in → same verdict out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "defined-flow-auditor"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope: a key never verifies for an atom outside its granted scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/defined-flow-auditor \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The body is the manifest object itself (see Reference — Input reference). HTTP 200 returns the verdict object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/defined-flow-auditor`
- Tool name: `defined_flow_auditor`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the manifest object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same manifest.

### Read a failing verdict and fix the manifest

Worked example 2 below is the recorded failing run: verdict `NOT_DEFINED`, summary “19 pass, 5 fail, 0 missing of 24 checks across seven sections.”. To fix a failing verdict:

1. **Find the non-pass checks.** In the response's `checks` array, look for `status: "fail"` (present but wrong) and `status: "missing"` (not declared). In the recorded violations run the failing checks are:
   - `network_location_not_trusted` (section `never_trust_always_verify`) — evidence: “'inside the firewall' is not an identity”
   - `credentials_scoped_to_job` (section `least_privilege`) — evidence: “can this credential do more than its job requires? It must not”
   - `network_not_flat` (section `micro_segmentation`) — evidence: “a flat network where one breach means total breach is not zero-trust”
   - `server_holds_no_abusable_secrets` (section `claim_gauntlet`) — evidence: “in a true zero-trust design the server holds no secrets it could abuse — no plaintext, no recoverable keys”
   - `server_breach_does_not_expose_user_data` (section `claim_gauntlet`) — evidence: “if breaching the server exposes user data, the trust was placed in the server”
2. **Note the section roll-up.** `sections` marks each affected section `fail` (or `insufficient_evidence` when nothing in it failed but evidence is missing). The verdict is `NOT_DEFINED` when any check fails, `INSUFFICIENT_EVIDENCE` when nothing fails but any check is missing, and `DEFINED` only when every check passes.
3. **Fix the underlying fact, then the manifest.** Each check's Reference entry names the manifest field it reads. Correct the real-world condition first (the atom reads declarations — declaring `true` for work not done defeats the purpose), set the field to the passing value, and resubmit the whole manifest. The atom is stateless: a resubmission is a fresh, complete evaluation.
4. **Re-read the new summary.** It counts pass / fail / missing across all checks; you are done when it reads all-pass and the verdict is `DEFINED`.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — never scored. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "auth.every_request_authenticated",
  "detail": "auth.every_request_authenticated must be a boolean"
}
```

- `field` names the offending field (`auth.every_request_authenticated` in the recorded run) and `detail` says what type was expected (`"auth.every_request_authenticated must be a boolean"`).
- Fix exactly that field's type in your manifest (see the types in the Input reference) and resubmit. Validation reports the first offending field it reaches, so a manifest with several type errors may need more than one fix-and-resubmit round.
- A 422 carries no verdict and no `checks` array — do not read it as a failing evaluation.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/defined-flow-auditor` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/defined-flow-auditor` — tool name `defined_flow_auditor`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON manifest per call. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. Unless a field is marked otherwise, every boolean field follows the same rule: **absent = evidence missing** (the check it feeds is `missing`; the verdict degrades to `INSUFFICIENT_EVIDENCE`), **present but false/invalid = the check fails** (the verdict degrades to `NOT_DEFINED`). Fields marked “must be `false`” invert the passing value, as noted.

**Identity**

| Field | Type | Notes |
|---|---|---|
| `system` | string | System name. Carried into the output; not itself checked. |

**`auth` — never trust, always verify**

| Field | Type | Notes |
|---|---|---|
| `auth.every_request_authenticated` | boolean | Read by section `never_trust_always_verify`. |
| `auth.every_request_authorized` | boolean | Read by section `never_trust_always_verify`. |
| `auth.internal_traffic_trusted` | boolean | Read by section `never_trust_always_verify`. Must be `false` to pass. |

**`identity` — identity-based access**

| Field | Type | Notes |
|---|---|---|
| `identity.access_follows_identity` | boolean | Read by section `identity_based_access`. |
| `identity.checked_before_access` | boolean | Read by section `identity_based_access`. |
| `identity.proof_method_named` | boolean | Read by section `identity_based_access`. |

**`privilege` — least privilege**

| Field | Type | Notes |
|---|---|---|
| `privilege.minimum_access` | boolean | Read by section `least_privilege`. |
| `privilege.access_expires` | boolean | Read by section `least_privilege`. |
| `privilege.credential_exceeds_job` | boolean | Read by section `least_privilege`. Must be `false` to pass. |

**`segmentation` — micro-segmentation**

| Field | Type | Notes |
|---|---|---|
| `segmentation.components_segmented` | boolean | Read by section `micro_segmentation`. |
| `segmentation.blast_radius_bounded` | boolean | Read by section `micro_segmentation`. |
| `segmentation.flat_network` | boolean | Read by section `micro_segmentation`. Must be `false` to pass. |

**`verification` — continuous verification**

| Field | Type | Notes |
|---|---|---|
| `verification.sessions_expire` | boolean | Read by section `continuous_verification`. |
| `verification.tokens_rotate` | boolean | Read by section `continuous_verification`. |
| `verification.anomalies_retrigger_auth` | boolean | Read by section `continuous_verification`. |

**`gauntlet` — claim gauntlet**

| Field | Type | Notes |
|---|---|---|
| `gauntlet.server_holds_plaintext_or_keys` | boolean | Read by section `claim_gauntlet`. Must be `false` to pass. |
| `gauntlet.server_breach_exposes_user_data` | boolean | Read by section `claim_gauntlet`. Must be `false` to pass. |
| `gauntlet.trusted_components_inventoried` | boolean | Read by section `claim_gauntlet`. |
| `gauntlet.convenience_decisions_surfaced` | boolean | Read by section `claim_gauntlet`. |
| `gauntlet.backdoors_present` | boolean | Gate: when `true`, the naming field below is required. |
| `gauntlet.backdoors_named` | boolean | Required when `gauntlet.backdoors_present` is `true`; otherwise the check passes as not applicable. |

**`scope` — scope and limits**

| Field | Type | Notes |
|---|---|---|
| `scope.adversaries_named` | boolean | Read by section `scope_and_limits`. |
| `scope.out_of_scope_named` | boolean | Read by section `scope_and_limits`. |
| `scope.compromised_endpoint_limit_acknowledged` | boolean | Read by section `scope_and_limits`. |
| `scope.claims_nist_alignment` | boolean | Gate: when `true`, the controls field below is required. |
| `scope.nist_controls_named` | boolean | Required when `scope.claims_nist_alignment` is `true`; otherwise the check passes as not applicable. |

### Checks

The recorded full-pass REST response carries 24 checks. Every check is listed below, grouped by its `section` exactly as recorded. For each check: what it requires to pass, and its semantics — `pass` = the requirement is met on the declared evidence; `fail` = the field is present but false/invalid (or a must-be-false field is `true`, or a computed condition is breached); `missing` = the field (or the rows a computed check reads) is absent. There is no separate not-applicable status value in recorded responses: a gated check whose gate is closed reports `pass`, with its evidence line saying why (for example “no LLM judge declared”).

**Section `never_trust_always_verify`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `every_request_authenticated` | Every request — user, device, service — is authenticated as if it came from an open network. Recorded full-pass evidence: “every request — user, device, service — is authenticated as if it came from an open network” | `auth.every_request_authenticated` |
| `every_request_authorized` | Every request is authorized fresh, on identity and context. Recorded full-pass evidence: “every request is authorized fresh, on identity and context” | `auth.every_request_authorized` |
| `network_location_not_trusted` | Network location is not trusted: `auth.internal_traffic_trusted` is `false` — “inside the firewall” is not an identity. Recorded full-pass evidence: “'inside the firewall' is not an identity” | `auth.internal_traffic_trusted` (must be `false`) |
**Section `identity_based_access`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `access_follows_identity_not_network` | Access follows the identity (user, device, workload), not the network location. Recorded full-pass evidence: “access follows the identity (user, device, workload), not the network location” | `identity.access_follows_identity` |
| `identity_checked_before_access` | An identity is checked before access is granted. Recorded full-pass evidence: “what identity does this system check before granting access?” | `identity.checked_before_access` |
| `identity_proof_method_named` | The identity proof method is named — how that identity is proven. Recorded full-pass evidence: “how is that identity proven? The proof method is named” | `identity.proof_method_named` |
**Section `least_privilege`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `minimum_access_per_identity` | Every identity gets the minimum access needed. Recorded full-pass evidence: “every identity gets the minimum access needed” | `privilege.minimum_access` |
| `access_expires` | Access expires — granted for the minimum time needed. Recorded full-pass evidence: “access is granted for the minimum time needed — does access expire?” | `privilege.access_expires` |
| `credentials_scoped_to_job` | No credential can do more than its job requires: `privilege.credential_exceeds_job` is `false`. Recorded full-pass evidence: “can this credential do more than its job requires? It must not” | `privilege.credential_exceeds_job` (must be `false`) |
**Section `micro_segmentation`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `components_segmented` | Components are segmented, so the blast radius of a compromise is bounded. Recorded full-pass evidence: “the blast radius of a compromise is bounded” | `segmentation.components_segmented` |
| `breach_blast_radius_bounded` | The breach blast radius is bounded: if this component is breached, what falls with it is bounded, not everything. Recorded full-pass evidence: “if this component is breached, what else falls with it? The answer is bounded, not everything” | `segmentation.blast_radius_bounded` |
| `network_not_flat` | The network is not flat: `segmentation.flat_network` is `false` — a flat network where one breach means total breach is not zero-trust. Recorded full-pass evidence: “a flat network where one breach means total breach is not zero-trust” | `segmentation.flat_network` (must be `false`) |
**Section `continuous_verification`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `sessions_expire` | Sessions expire — trust is re-evaluated, not granted once. Recorded full-pass evidence: “trust is re-evaluated, not granted once — sessions expire” | `verification.sessions_expire` |
| `tokens_rotate` | Tokens rotate. Recorded full-pass evidence: “tokens rotate” | `verification.tokens_rotate` |
| `anomalies_retrigger_authentication` | Anomalous behavior re-triggers authentication. Recorded full-pass evidence: “anomalous behavior re-triggers authentication” | `verification.anomalies_retrigger_auth` |
**Section `claim_gauntlet`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `server_holds_no_abusable_secrets` | The server holds no secrets it could abuse: `gauntlet.server_holds_plaintext_or_keys` is `false` — no plaintext, no recoverable keys. Recorded full-pass evidence: “in a true zero-trust design the server holds no secrets it could abuse — no plaintext, no recoverable keys” | `gauntlet.server_holds_plaintext_or_keys` (must be `false`) |
| `server_breach_does_not_expose_user_data` | Breaching the server does not expose user data: `gauntlet.server_breach_exposes_user_data` is `false` — if it did, the trust was placed in the server. Recorded full-pass evidence: “if breaching the server exposes user data, the trust was placed in the server” | `gauntlet.server_breach_exposes_user_data` (must be `false`) |
| `trusted_components_inventoried` | Trusted components are inventoried — every trusted component is an attack surface. Recorded full-pass evidence: “every trusted component is an attack surface — inventory them before praising the architecture” | `gauntlet.trusted_components_inventoried` |
| `convenience_trust_decisions_surfaced` | Convenience trust decisions are surfaced — SSO passthrough, persistent sessions, silent re-auth are trust decisions, each surfaced. Recorded full-pass evidence: “convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one” | `gauntlet.convenience_decisions_surfaced` |
| `backdoors_named_explicitly` | Backdoors (recovery / override / escrow) are named explicitly: passes when none is declared, or when a declared backdoor is also named. The recorded full-pass evidence reads “no backdoor (recovery / override / escrow) declared”. Recorded full-pass evidence: “no backdoor (recovery / override / escrow) declared” | `gauntlet.backdoors_present` together with `gauntlet.backdoors_named` |
**Section `scope_and_limits`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `adversaries_named` | Adversaries are named — a system is zero-trust only against the adversaries it names. Recorded full-pass evidence: “a system is zero-trust only against the adversaries it names” | `scope.adversaries_named` |
| `out_of_scope_named` | Who is out of scope is named honestly. Recorded full-pass evidence: “who is out of scope is named honestly” | `scope.out_of_scope_named` |
| `compromised_endpoint_limit_acknowledged` | The compromised-endpoint limit is acknowledged: zero-trust does not fix a compromised endpoint. Recorded full-pass evidence: “honest limit: zero-trust does not fix a compromised endpoint” | `scope.compromised_endpoint_limit_acknowledged` |
| `nist_controls_named_when_alignment_claimed` | When NIST alignment is claimed, the NIST controls are named. When no alignment is claimed, this check passes as not applicable — the recorded evidence reads “no NIST alignment claimed”. Recorded full-pass evidence: “no NIST alignment claimed” | `scope.nist_controls_named`, gated by `scope.claims_nist_alignment` |

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"defined-flow-auditor"` |
| `atom_version` | `"0.1.0" |
| `system` | The manifest's `system` value, carried through |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section to its section status (below) |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order |
| `summary` | One line counting pass / fail / missing across all checks and sections |
| `stamp` | The same verdict as a plain-text block |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `DEFINED` — All 24 checks pass across all seven sections. The defined-flow (zero-trust) claim holds on the evidence declared.
- `NOT_DEFINED` — At least one check fails (a field present but false/invalid, or a must-be-false field true). One failure breaks the claim. The failing checks name the section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — No check fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply.

**Section statuses** (values in the `sections` object):

- `pass` — every check in the section passes.
- `fail` — at least one check in the section fails.
- `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (the `status` field of each `checks[]` entry):

- `pass` — the requirement is met on the declared evidence (including gated checks whose gate is closed — see Checks).
- `fail` — the requirement is breached on present evidence.
- `missing` — the evidence the check reads was not declared.

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 body is the recorded one.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — the manifest violates a field type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "auth.every_request_authenticated", "detail": "auth.every_request_authenticated must be a boolean"}` — `field` and `detail` name the offending field and the expected type for your submission. |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `call`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

The auditor tests a zero-trust claim the way the claim is made: flow by flow, never trust, always verify. Authentication and authorization on every request; access following identity rather than network location; least-privilege credentials that expire; segmentation that bounds the blast radius; sessions that expire and tokens that rotate; and a gauntlet aimed at the server itself — a design whose server holds plaintext or recoverable keys, or whose breach exposes user data, placed its trust in the server and fails. Scope honesty is part of the verdict: adversaries and out-of-scope are named, the compromised-endpoint limit is acknowledged, and NIST controls are named whenever alignment is claimed (the bound skill is distilled from mykey and zerok-container, with NIST 800-63B alignment in its scope). Unlike the other verdict atoms, a single failure breaks the whole claim: NOT_DEFINED follows from any one failed check. The register's named doubt stands: Guardian Mesh capabilities are spec inputs until behaviour-proven.

**How the verdict is decided.** The core is deterministic: the same manifest always produces the same verdict (the recorded battery proves byte-identical repeat responses, and MCP/REST parity). Each check reads named manifest fields and resolves to `pass`, `fail`, or `missing`. The distinction that drives the verdict is *absent vs false*: a field that is **absent** is missing evidence — its check is `missing`, and if nothing fails the verdict is `INSUFFICIENT_EVIDENCE`, naming exactly what to supply. A field that is **present but false or invalid** is a breached requirement — its check fails, and any single failure makes the verdict `NOT_DEFINED`. Section statuses roll up the same way (`pass` / `fail` / `insufficient_evidence`). Gated checks follow their gate field: when the gate is closed (for example no LLM judge used, no repair declared, no NIST alignment claimed, no backdoor present), the gated check passes as not applicable rather than going missing; when the gate is open, the gated field is required. Must-be-false fields invert the test: declaring them `true` is the failure.

**What it does not do.**

- It does not probe, scan, or test the live system — it audits the declared evidence manifest about the system's flows.
- It does not verify that declared booleans are true in the world; the verdict is evidence about the declaration, in the declared shape.
- It does not certify NIST compliance: it checks only that controls are named when alignment is claimed.
- It sells the check (the audit verdict) — never the underlying zero-trust knowledge itself.

**Buyer and use context.** Teams and agents working in “Security & privacy” who need this check on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: Guardian Mesh audits of our systems — Wright is an internal caller (zero price, metered to the internal cost ledger). One unit of sale = one call (the delivered verdict). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge.

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the manifest to the REST endpoint (or call the MCP tool `defined_flow_auditor`), and consume `verdict`, `sections`, `checks`, `summary` and `stamp`. Treat the three verdict values as your branch points: `DEFINED` = proceed; `NOT_DEFINED` = stop and remediate the failing checks; `INSUFFICIENT_EVIDENCE` = collect the missing evidence named in the `missing` checks and resubmit. Handle 422 as a client bug (fix the named field's type), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching a verdict for an unchanged manifest is sound.

### For developers

Manifest authoring: declare facts, not aspirations — every boolean is a claim about work actually done, and must-be-false fields are the usual trap (declaring them `true` is an instant fail). Respect the gates: gated fields are required only when their gate field opens them. Implementation pointers: `src/defined_flow_auditor.py` — `evaluate(manifest) -> verdict dict`; CLI prints JSON + stamp. Tests: `tests/test_defined_flow_auditor.py — 18 tests, all passing 2026-11-15`. Determinism is contractual: no randomness, no clock, no external calls in the evaluation path — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/defined-flow-auditor`, MCP `POST /mcp/defined-flow-auditor` (tool `defined_flow_auditor`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client manifest type bugs (the body names the field); a rising 422 rate after a client release is a client regression, not an atom fault. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/defined-flow-auditor.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

### For regulators

This atom is compliance-facing: The verdict is itself security-audit evidence — a deterministic, per-check record of a zero-trust claim across authentication, identity, privilege, segmentation and verification, including NIST-control naming when alignment is claimed — in the regulated security domain. The verdict artifact is designed to be retained as evidence: it is deterministic (the same manifest replays to the same verdict), it carries per-check evidence lines naming what was checked and what was found, it distinguishes a breached requirement (`fail`) from absent evidence (`missing`) rather than collapsing both into a negative, and its plain-text `stamp` mirrors the JSON verdict for filing alongside the underlying records. Retention note: the atom itself is stateless — the caller retains the manifest and the verdict together; either one alone is an incomplete record. The verdict attests to the declared evidence in the declared shape; it is evidence production support, not a certification of the underlying facts.

## Worked examples

Provenance: recorded 2026-11-15T23:57:26.442338+00:00 against gateway v1.1.0, external verification lane, source `verification/work/defined-flow-auditor/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "system": "production-cluster-alpha",
  "auth": {
    "every_request_authenticated": true,
    "every_request_authorized": true,
    "internal_traffic_trusted": false
  },
  "identity": {
    "access_follows_identity": true,
    "checked_before_access": true,
    "proof_method_named": true
  },
  "privilege": {
    "minimum_access": true,
    "access_expires": true,
    "credential_exceeds_job": false
  },
  "segmentation": {
    "components_segmented": true,
    "blast_radius_bounded": true,
    "flat_network": false
  },
  "verification": {
    "sessions_expire": true,
    "tokens_rotate": true,
    "anomalies_retrigger_auth": true
  },
  "gauntlet": {
    "server_holds_plaintext_or_keys": false,
    "server_breach_exposes_user_data": false,
    "trusted_components_inventoried": true,
    "convenience_decisions_surfaced": true,
    "backdoors_present": false
  },
  "scope": {
    "adversaries_named": true,
    "out_of_scope_named": true,
    "compromised_endpoint_limit_acknowledged": true,
    "claims_nist_alignment": false
  }
}
```

Response (REST):

```json
{
  "service": "defined-flow-auditor",
  "atom_version": "0.1.0",
  "system": "production-cluster-alpha",
  "verdict": "DEFINED",
  "sections": {
    "never_trust_always_verify": "pass",
    "identity_based_access": "pass",
    "least_privilege": "pass",
    "micro_segmentation": "pass",
    "continuous_verification": "pass",
    "claim_gauntlet": "pass",
    "scope_and_limits": "pass"
  },
  "checks": [
    {
      "section": "never_trust_always_verify",
      "check": "every_request_authenticated",
      "status": "pass",
      "evidence": "every request — user, device, service — is authenticated as if it came from an open network"
    },
    {
      "section": "never_trust_always_verify",
      "check": "every_request_authorized",
      "status": "pass",
      "evidence": "every request is authorized fresh, on identity and context"
    },
    {
      "section": "never_trust_always_verify",
      "check": "network_location_not_trusted",
      "status": "pass",
      "evidence": "'inside the firewall' is not an identity"
    },
    {
      "section": "identity_based_access",
      "check": "access_follows_identity_not_network",
      "status": "pass",
      "evidence": "access follows the identity (user, device, workload), not the network location"
    },
    {
      "section": "identity_based_access",
      "check": "identity_checked_before_access",
      "status": "pass",
      "evidence": "what identity does this system check before granting access?"
    },
    {
      "section": "identity_based_access",
      "check": "identity_proof_method_named",
      "status": "pass",
      "evidence": "how is that identity proven? The proof method is named"
    },
    {
      "section": "least_privilege",
      "check": "minimum_access_per_identity",
      "status": "pass",
      "evidence": "every identity gets the minimum access needed"
    },
    {
      "section": "least_privilege",
      "check": "access_expires",
      "status": "pass",
      "evidence": "access is granted for the minimum time needed — does access expire?"
    },
    {
      "section": "least_privilege",
      "check": "credentials_scoped_to_job",
      "status": "pass",
      "evidence": "can this credential do more than its job requires? It must not"
    },
    {
      "section": "micro_segmentation",
      "check": "components_segmented",
      "status": "pass",
      "evidence": "the blast radius of a compromise is bounded"
    },
    {
      "section": "micro_segmentation",
      "check": "breach_blast_radius_bounded",
      "status": "pass",
      "evidence": "if this component is breached, what else falls with it? The answer is bounded, not everything"
    },
    {
      "section": "micro_segmentation",
      "check": "network_not_flat",
      "status": "pass",
      "evidence": "a flat network where one breach means total breach is not zero-trust"
    },
    {
      "section": "continuous_verification",
      "check": "sessions_expire",
      "status": "pass",
      "evidence": "trust is re-evaluated, not granted once — sessions expire"
    },
    {
      "section": "continuous_verification",
      "check": "tokens_rotate",
      "status": "pass",
      "evidence": "tokens rotate"
    },
    {
      "section": "continuous_verification",
      "check": "anomalies_retrigger_authentication",
      "status": "pass",
      "evidence": "anomalous behavior re-triggers authentication"
    },
    {
      "section": "claim_gauntlet",
      "check": "server_holds_no_abusable_secrets",
      "status": "pass",
      "evidence": "in a true zero-trust design the server holds no secrets it could abuse — no plaintext, no recoverable keys"
    },
    {
      "section": "claim_gauntlet",
      "check": "server_breach_does_not_expose_user_data",
      "status": "pass",
      "evidence": "if breaching the server exposes user data, the trust was placed in the server"
    },
    {
      "section": "claim_gauntlet",
      "check": "trusted_components_inventoried",
      "status": "pass",
      "evidence": "every trusted component is an attack surface — inventory them before praising the architecture"
    },
    {
      "section": "claim_gauntlet",
      "check": "convenience_trust_decisions_surfaced",
      "status": "pass",
      "evidence": "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one"
    },
    {
      "section": "claim_gauntlet",
      "check": "backdoors_named_explicitly",
      "status": "pass",
      "evidence": "no backdoor (recovery / override / escrow) declared"
    },
    {
      "section": "scope_and_limits",
      "check": "adversaries_named",
      "status": "pass",
      "evidence": "a system is zero-trust only against the adversaries it names"
    },
    {
      "section": "scope_and_limits",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "who is out of scope is named honestly"
    },
    {
      "section": "scope_and_limits",
      "check": "compromised_endpoint_limit_acknowledged",
      "status": "pass",
      "evidence": "honest limit: zero-trust does not fix a compromised endpoint"
    },
    {
      "section": "scope_and_limits",
      "check": "nist_controls_named_when_alignment_claimed",
      "status": "pass",
      "evidence": "no NIST alignment claimed"
    }
  ],
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across seven sections.",
  "stamp": "DEFINED-FLOW AUDITOR\nsystem: production-cluster-alpha\nVERDICT: DEFINED\n  never_trust_always_verify  pass\n  identity_based_access      pass\n  least_privilege            pass\n  micro_segmentation         pass\n  continuous_verification    pass\n  claim_gauntlet             pass\n  scope_and_limits           pass\n24 pass, 0 fail, 0 missing of 24 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "system": "test-system",
  "auth": {
    "every_request_authenticated": true,
    "every_request_authorized": true,
    "internal_traffic_trusted": true
  },
  "identity": {
    "access_follows_identity": true,
    "checked_before_access": true,
    "proof_method_named": true
  },
  "privilege": {
    "minimum_access": true,
    "access_expires": true,
    "credential_exceeds_job": true
  },
  "segmentation": {
    "components_segmented": true,
    "blast_radius_bounded": true,
    "flat_network": true
  },
  "verification": {
    "sessions_expire": true,
    "tokens_rotate": true,
    "anomalies_retrigger_auth": true
  },
  "gauntlet": {
    "server_holds_plaintext_or_keys": true,
    "server_breach_exposes_user_data": true,
    "trusted_components_inventoried": true,
    "convenience_decisions_surfaced": true,
    "backdoors_present": false
  },
  "scope": {
    "adversaries_named": true,
    "out_of_scope_named": true,
    "compromised_endpoint_limit_acknowledged": true,
    "claims_nist_alignment": false
  }
}
```

Response (REST):

```json
{
  "service": "defined-flow-auditor",
  "atom_version": "0.1.0",
  "system": "test-system",
  "verdict": "NOT_DEFINED",
  "sections": {
    "never_trust_always_verify": "fail",
    "identity_based_access": "pass",
    "least_privilege": "fail",
    "micro_segmentation": "fail",
    "continuous_verification": "pass",
    "claim_gauntlet": "fail",
    "scope_and_limits": "pass"
  },
  "checks": [
    {
      "section": "never_trust_always_verify",
      "check": "every_request_authenticated",
      "status": "pass",
      "evidence": "every request — user, device, service — is authenticated as if it came from an open network"
    },
    {
      "section": "never_trust_always_verify",
      "check": "every_request_authorized",
      "status": "pass",
      "evidence": "every request is authorized fresh, on identity and context"
    },
    {
      "section": "never_trust_always_verify",
      "check": "network_location_not_trusted",
      "status": "fail",
      "evidence": "'inside the firewall' is not an identity"
    },
    {
      "section": "identity_based_access",
      "check": "access_follows_identity_not_network",
      "status": "pass",
      "evidence": "access follows the identity (user, device, workload), not the network location"
    },
    {
      "section": "identity_based_access",
      "check": "identity_checked_before_access",
      "status": "pass",
      "evidence": "what identity does this system check before granting access?"
    },
    {
      "section": "identity_based_access",
      "check": "identity_proof_method_named",
      "status": "pass",
      "evidence": "how is that identity proven? The proof method is named"
    },
    {
      "section": "least_privilege",
      "check": "minimum_access_per_identity",
      "status": "pass",
      "evidence": "every identity gets the minimum access needed"
    },
    {
      "section": "least_privilege",
      "check": "access_expires",
      "status": "pass",
      "evidence": "access is granted for the minimum time needed — does access expire?"
    },
    {
      "section": "least_privilege",
      "check": "credentials_scoped_to_job",
      "status": "fail",
      "evidence": "can this credential do more than its job requires? It must not"
    },
    {
      "section": "micro_segmentation",
      "check": "components_segmented",
      "status": "pass",
      "evidence": "the blast radius of a compromise is bounded"
    },
    {
      "section": "micro_segmentation",
      "check": "breach_blast_radius_bounded",
      "status": "pass",
      "evidence": "if this component is breached, what else falls with it? The answer is bounded, not everything"
    },
    {
      "section": "micro_segmentation",
      "check": "network_not_flat",
      "status": "fail",
      "evidence": "a flat network where one breach means total breach is not zero-trust"
    },
    {
      "section": "continuous_verification",
      "check": "sessions_expire",
      "status": "pass",
      "evidence": "trust is re-evaluated, not granted once — sessions expire"
    },
    {
      "section": "continuous_verification",
      "check": "tokens_rotate",
      "status": "pass",
      "evidence": "tokens rotate"
    },
    {
      "section": "continuous_verification",
      "check": "anomalies_retrigger_authentication",
      "status": "pass",
      "evidence": "anomalous behavior re-triggers authentication"
    },
    {
      "section": "claim_gauntlet",
      "check": "server_holds_no_abusable_secrets",
      "status": "fail",
      "evidence": "in a true zero-trust design the server holds no secrets it could abuse — no plaintext, no recoverable keys"
    },
    {
      "section": "claim_gauntlet",
      "check": "server_breach_does_not_expose_user_data",
      "status": "fail",
      "evidence": "if breaching the server exposes user data, the trust was placed in the server"
    },
    {
      "section": "claim_gauntlet",
      "check": "trusted_components_inventoried",
      "status": "pass",
      "evidence": "every trusted component is an attack surface — inventory them before praising the architecture"
    },
    {
      "section": "claim_gauntlet",
      "check": "convenience_trust_decisions_surfaced",
      "status": "pass",
      "evidence": "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one"
    },
    {
      "section": "claim_gauntlet",
      "check": "backdoors_named_explicitly",
      "status": "pass",
      "evidence": "no backdoor (recovery / override / escrow) declared"
    },
    {
      "section": "scope_and_limits",
      "check": "adversaries_named",
      "status": "pass",
      "evidence": "a system is zero-trust only against the adversaries it names"
    },
    {
      "section": "scope_and_limits",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "who is out of scope is named honestly"
    },
    {
      "section": "scope_and_limits",
      "check": "compromised_endpoint_limit_acknowledged",
      "status": "pass",
      "evidence": "honest limit: zero-trust does not fix a compromised endpoint"
    },
    {
      "section": "scope_and_limits",
      "check": "nist_controls_named_when_alignment_claimed",
      "status": "pass",
      "evidence": "no NIST alignment claimed"
    }
  ],
  "summary": "19 pass, 5 fail, 0 missing of 24 checks across seven sections.",
  "stamp": "DEFINED-FLOW AUDITOR\nsystem: test-system\nVERDICT: NOT_DEFINED\n  never_trust_always_verify  fail\n  identity_based_access      pass\n  least_privilege            fail\n  micro_segmentation         fail\n  continuous_verification    pass\n  claim_gauntlet             fail\n  scope_and_limits           pass\n19 pass, 5 fail, 0 missing of 24 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "system": "malformed-test",
  "auth": {
    "every_request_authenticated": "YES_PLEASE"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "auth.every_request_authenticated",
  "detail": "auth.every_request_authenticated must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators Yes |
| Checks named: documented vs recorded | 24 / 24 (from the recorded full-pass REST response `checks` array) |
| Verdict vocabulary complete | Yes — 3 verdict values, 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 27 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/defined-flow-auditor/evidence.json` |

