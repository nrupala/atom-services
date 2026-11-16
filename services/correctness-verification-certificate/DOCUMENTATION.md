# Correctness verification certificate — full documentation

**Correctness verification certificate** · slug `correctness-verification-certificate` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one deliverable back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "correctness-verification-certificate"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the component under review (`component: "auth-service-v1"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). The manifest walks the claim through its register entry (`register.*`: the register exists, and each claim names its property, scope, evidence level and expiry), the evidence ladder (`ladder.*`: the cheapest sufficient level was selected, no claim exceeds its level, and tests are not presented as proof), specs written before tools ran (`specs.*`), machine-checkable artifacts (`artifacts.*`), honest scope (`scope.*`), CI integration (`ci.*`), and adversarial review plus the signed certificate (`review.*`, `certificate.*`). Note the three negative constraints: `ladder.claim_exceeds_evidence_level`, `ladder.tests_presented_as_proof` and `artifacts.counterexample_suppressed` must be `false` — `true` is a failure, not a pass.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/correctness-verification-certificate` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the verdict.** The response `verdict` is `CERTIFIED` and every section — `claims_register`, `evidence_ladder`, `specs_before_tools`, `evidence_artifacts`, `scope_honesty`, `ci_integration`, `adversarial_and_certification` — reports `pass`. The `summary` line reconciles the run: "26 pass, 0 fail, 0 missing of 26 checks across seven sections." Each entry in `checks` names its section, the check, its status and the evidence standard it was judged against, and the response closes with a text `stamp` of the verdict you can file as-is.

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "correctness-verification-certificate"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/correctness-verification-certificate` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/correctness-verification-certificate` and invoke the tool `correctness_verification_certificate` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing verdict is `NOT_CERTIFIED`. Do not read the verdict alone — read the `checks` array:

1. Find every check with status `fail`. Its `section` tells you which part of the manifest to fix and its `evidence` states the standard it failed.
2. In the recorded violations run (Worked examples, example 2) the verdict was `NOT_CERTIFIED` and the failing checks were: `no_claim_exceeds_its_evidence_level` (section `evidence_ladder`); `tests_not_presented_as_proof` (section `evidence_ladder`); `counterexample_not_suppressed` (section `evidence_artifacts`).
3. Distinguish `fail` from `missing`: `fail` means you declared evidence and it does not satisfy the check — change the underlying facts or correct the declaration. `missing` means the field is absent — supply it. A response with only `missing` checks and no `fail` returns `INSUFFICIENT_EVIDENCE`, not the failing verdict.

Bring the claim back inside its evidence: set `ladder.claim_exceeds_evidence_level` to `false` by actually reducing the claim or raising the evidence level, set `ladder.tests_presented_as_proof` to `false` by no longer presenting tests as proof, and set `artifacts.counterexample_suppressed` to `false` by disclosing the counterexample. Then resubmit the corrected manifest — the same deterministic checks re-run and the verdict is recomputed from scratch.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "component",
  "detail": "component must be a string"
}
```

Read `field` first: it names the first offending field (`component`), and `detail` states the expected type ("component must be a string"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/correctness-verification-certificate` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/correctness-verification-certificate` — tool name `correctness_verification_certificate`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. Every field below is read by the named section's checks. All fields are booleans unless a type is noted. A field **absent** = evidence missing; a field present but false / invalid = the check fails. Types are from SERVICE.md's field table; the contract and the evidence `inputSchema` corroborate them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `component` | string | — | string; carried into the verdict output, not itself checked |
| `register.exists` | boolean | claims_register |  |
| `register.property_named` | boolean | claims_register |  |
| `register.scope_named` | boolean | claims_register |  |
| `register.evidence_level_assigned` | boolean | claims_register |  |
| `register.expiry_set` | boolean | claims_register |  |
| `ladder.cheapest_sufficient_level_selected` | boolean | evidence_ladder |  |
| `ladder.claim_exceeds_evidence_level` | boolean | evidence_ladder | must be `false` to pass |
| `ladder.tests_presented_as_proof` | boolean | evidence_ladder | must be `false` to pass |
| `specs.invariants_written` | boolean | specs_before_tools |  |
| `specs.pre_post_conditions_written` | boolean | specs_before_tools |  |
| `specs.liveness_properties_written` | boolean | specs_before_tools |  |
| `specs.written_before_tools_run` | boolean | specs_before_tools |  |
| `artifacts.machine_checkable_per_claim` | boolean | evidence_artifacts |  |
| `artifacts.proof_scripts_or_solver_logs_retained` | boolean | evidence_artifacts |  |
| `artifacts.counterexample_suppressed` | boolean | evidence_artifacts | must be `false` to pass |
| `artifacts.reproduction_recipe_present` | boolean | evidence_artifacts |  |
| `scope.exclusions_written` | boolean | scope_honesty |  |
| `scope.claims_versioned` | boolean | scope_honesty |  |
| `scope.reverification_triggers_defined` | boolean | scope_honesty |  |
| `scope.verified_at_current_version` | boolean | scope_honesty |  |
| `ci.verification_in_pipeline` | boolean | ci_integration |  |
| `ci.broken_proof_fails_build` | boolean | ci_integration |  |
| `review.independent_review_done` | boolean | adversarial_and_certification |  |
| `review.counterexample_found` | boolean | adversarial_and_certification | gates the disclosure check below |
| `review.counterexample_disclosed` | boolean | adversarial_and_certification | required when a counterexample was found; otherwise the check passes as not applicable |
| `certificate.signed_attestation_binds_claim_artifact_commit` | boolean | adversarial_and_certification |  |
| `certificate.independently_reproducible` | boolean | adversarial_and_certification |  |

### Checks

The recorded full-pass REST response carries 26 checks. Every check is named below with its section and what it requires to pass (the `evidence` standard recorded in the response). Cross-checked against SERVICE.md: every recorded check corresponds to a SERVICE.md field or a computed comparison named there; gated fields in SERVICE.md fold into a single conditional check (see the semantics note).

#### Section `claims_register`

| Check | Requires to pass |
|---|---|
| `register_exists` | claims register first: one row per claim — no register, no claim |
| `property_named_for_each_claim` | each claim names the property — what exactly is claimed correct |
| `scope_named_for_each_claim` | each claim names its scope — which version / configuration the claim covers |
| `evidence_level_assigned_for_each_claim` | each claim carries its evidence level from the ladder |
| `expiry_set_for_each_claim` | each claim carries an expiry — stale certificates are void |
#### Section `evidence_ladder`

| Check | Requires to pass |
|---|---|
| `cheapest_sufficient_level_selected` | the evidence ladder — L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants — cheapest that suffices is selected |
| `no_claim_exceeds_its_evidence_level` | no claim exceeds its evidence level (tests are not proof) |
| `tests_not_presented_as_proof` | tests are not presented as proof — never say proven, bug-free, or certified without property, scope, and evidence |
#### Section `specs_before_tools`

| Check | Requires to pass |
|---|---|
| `invariants_written` | invariants are written in the checker's language |
| `pre_post_conditions_written` | pre- and post-conditions are written in the checker's language |
| `liveness_properties_written` | liveness properties are written in the checker's language |
| `specs_written_before_tools_run` | specs come before tools: written before running anything |
#### Section `evidence_artifacts`

| Check | Requires to pass |
|---|---|
| `machine_checkable_artifact_for_each_claim` | each claim has a machine-checkable artifact behind it |
| `proof_scripts_or_solver_logs_retained` | evidence artifacts are retained: counterexamples, proof scripts, solver logs, CI records |
| `counterexample_not_suppressed` | never suppress a counterexample |
| `reproduction_recipe_present` | no certificate without a reproduction recipe |
#### Section `scope_honesty`

| Check | Requires to pass |
|---|---|
| `exclusions_written` | what is outside scope is listed — dependencies, hardware, misconfiguration, side channels |
| `claims_versioned` | every claim is versioned |
| `reverification_triggers_defined` | re-verification triggers are defined — re-verify on change |
| `verified_at_current_version` | never certify an artifact that has not been verified at its current version |
#### Section `ci_integration`

| Check | Requires to pass |
|---|---|
| `verification_runs_in_pipeline` | verification runs in the pipeline |
| `broken_proof_fails_build` | a broken proof fails the build like a broken test |
#### Section `adversarial_and_certification`

| Check | Requires to pass |
|---|---|
| `independent_adversarial_review_done` | an independent adversarial pass tries to falsify the claim — only unfalsified claims are certified |
| `counterexample_disclosed_when_found` | no counterexample found in adversarial review |
| `signed_attestation_binds_claim_artifact_and_commit` | a signed attestation binds claim to artifact to source commit (hash and signature) |
| `certificate_independently_reproducible` | certificates are signed, versioned, and independently reproducible |

**Per-check status semantics** (recorded across the battery): `pass` — the declared evidence satisfies the check; `fail` — evidence was declared and does not satisfy the check (present-but-false, a violated must-be-`false` constraint, an out-of-enum value, or a failed computed comparison); `missing` — the field is absent, so there is no evidence to judge. There is **no separate not-applicable status in the recorded responses**: a gated (conditional) check whose gate does not apply is recorded as `pass`, with its `evidence` text stating why it does not apply (the exact wording is in each response's checks). Section statuses aggregate the same way: `pass`, `fail`, or `insufficient_evidence`.

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `component`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom; the manifest's subject is carried through; `sections` maps each section to its status; `checks` is the per-check array (`section`, `check`, `status`, `evidence`); `summary` reconciles the counts in one line; `stamp` is a text rendering of the verdict. The recorded full-pass response is reproduced in full under Worked examples.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `CERTIFIED` (verdict) | all 26 checks pass |
| `NOT_CERTIFIED` (verdict) | any check fails — one failure breaks the claim |
| `INSUFFICIENT_EVIDENCE` (verdict) | nothing fails but evidence is missing |
| `pass` / `fail` / `insufficient_evidence` (section status) | the section's checks all pass / at least one fails / none fail but at least one is missing |
| `pass` / `fail` / `missing` (per-check status) | evidence satisfies the check / declared evidence does not satisfy it / field absent — no evidence to judge (gated checks that do not apply record as `pass`) |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "component", "detail": "component must be a string"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

The certificate is deliberately brittle: one failed check breaks the claim (`NOT_CERTIFIED`), because a correctness claim is only as strong as its weakest evidence link. The evidence ladder (L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants) is checked for honesty — the cheapest sufficient level must be selected and no claim may exceed the level behind it. Specs must predate tool runs, every claim needs a machine-checkable artifact, scope exclusions must be written, verification must run in CI with a broken proof failing the build, and an independent adversarial review must have tried to falsify the claim. The signed attestation binds claim to artifact to source commit, and the certificate must be independently reproducible.

**How the verdict is decided (deterministic core).** The atom is a deterministic evaluator over the manifest: same manifest in → same verdict out (the recorded battery confirmed byte-identical repeat responses and REST/MCP parity). Each field feeds its section's checks. The semantics are three-valued and the distinction matters: a field **absent** marks its check `missing` — missing evidence; a field **present but false / invalid** marks its check `fail` — the evidence was offered and does not satisfy the check. The verdict aggregates strictly: any `fail` → `NOT_CERTIFIED`; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise (every check `pass`) → `CERTIFIED`. Must-be-`false` fields invert the boolean reading: declaring them `true` is a `fail`. Conditional (gated) checks are required only when their gate field declares the situation exists; otherwise they record as `pass` (there is no separate not-applicable status in the recorded responses).

**What it does NOT do.**

- It does not run a model checker, prover, fuzzer or test suite for you, and it never inspects your code or artifacts directly — it evaluates the evidence manifest you declare. A manifest that misstates the underlying work produces a certificate for a claim that was never earned; the atom checks the declaration's completeness and consistency, not the truth of the world behind it.
- It does not certify anything outside the manifest's declared scope: exclusions, version and configuration bound the claim, exactly as recorded in `scope.*`.
- It sells the certificate — the bounded judgment artifact — never the underlying correctness-verification knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Engineering & code who need a correctness certificate on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **Product correctness claim checks**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/correctness-verification-certificate` (REST) or the MCP tool `correctness_verification_certificate` at `POST https://atoms.pipavia.com/mcp/correctness-verification-certificate`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/correctness_verification_certificate.py — `evaluate(manifest)` -> verdict dict; CLI prints JSON + stamp; tests: tests/test_correctness_verification_certificate.py — 21 tests, all passing 2026-11-15. The atom is bound to the `correctness-verification` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/correctness-verification-certificate` and MCP `POST /mcp/correctness-verification-certificate` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

### For regulators

The `CERTIFIED` verdict is designed to be filed as audit evidence: the signed attestation binds claim, artifact and source commit (`certificate.signed_attestation_binds_claim_artifact_commit`), the certificate is independently reproducible, every claim is versioned with an expiry and re-verification triggers, and counterexamples found in adversarial review must be disclosed, never suppressed. A `NOT_CERTIFIED` or `INSUFFICIENT_EVIDENCE` result is equally evidence — it records, per check, exactly which evidence failed or is missing. The atom assembles and judges the evidence declaration; it does not itself perform the underlying verification work (see Explanation — limits).

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:51:12.763343+00:00 against gateway v1.1.0, external verification lane, source `verification/work/correctness-verification-certificate/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `INSUFFICIENT_EVIDENCE` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

```json
{
  "component": "auth-service-v1",
  "register": {
    "exists": true,
    "property_named": true,
    "scope_named": true,
    "evidence_level_assigned": true,
    "expiry_set": true
  },
  "ladder": {
    "cheapest_sufficient_level_selected": true,
    "claim_exceeds_evidence_level": false,
    "tests_presented_as_proof": false
  },
  "specs": {
    "invariants_written": true,
    "pre_post_conditions_written": true,
    "liveness_properties_written": true,
    "written_before_tools_run": true
  },
  "artifacts": {
    "machine_checkable_per_claim": true,
    "proof_scripts_or_solver_logs_retained": true,
    "counterexample_suppressed": false,
    "reproduction_recipe_present": true
  },
  "scope": {
    "exclusions_written": true,
    "claims_versioned": true,
    "reverification_triggers_defined": true,
    "verified_at_current_version": true
  },
  "ci": {
    "verification_in_pipeline": true,
    "broken_proof_fails_build": true
  },
  "review": {
    "independent_review_done": true,
    "counterexample_found": false,
    "counterexample_disclosed": true
  },
  "certificate": {
    "signed_attestation_binds_claim_artifact_commit": true,
    "independently_reproducible": true
  }
}
```

Response:

```json
{
  "service": "correctness-verification-certificate",
  "atom_version": "0.1.0",
  "component": "auth-service-v1",
  "verdict": "CERTIFIED",
  "sections": {
    "claims_register": "pass",
    "evidence_ladder": "pass",
    "specs_before_tools": "pass",
    "evidence_artifacts": "pass",
    "scope_honesty": "pass",
    "ci_integration": "pass",
    "adversarial_and_certification": "pass"
  },
  "checks": [
    {
      "section": "claims_register",
      "check": "register_exists",
      "status": "pass",
      "evidence": "claims register first: one row per claim — no register, no claim"
    },
    {
      "section": "claims_register",
      "check": "property_named_for_each_claim",
      "status": "pass",
      "evidence": "each claim names the property — what exactly is claimed correct"
    },
    {
      "section": "claims_register",
      "check": "scope_named_for_each_claim",
      "status": "pass",
      "evidence": "each claim names its scope — which version / configuration the claim covers"
    },
    {
      "section": "claims_register",
      "check": "evidence_level_assigned_for_each_claim",
      "status": "pass",
      "evidence": "each claim carries its evidence level from the ladder"
    },
    {
      "section": "claims_register",
      "check": "expiry_set_for_each_claim",
      "status": "pass",
      "evidence": "each claim carries an expiry — stale certificates are void"
    },
    {
      "section": "evidence_ladder",
      "check": "cheapest_sufficient_level_selected",
      "status": "pass",
      "evidence": "the evidence ladder — L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants — cheapest that suffices is selected"
    },
    {
      "section": "evidence_ladder",
      "check": "no_claim_exceeds_its_evidence_level",
      "status": "pass",
      "evidence": "no claim exceeds its evidence level (tests are not proof)"
    },
    {
      "section": "evidence_ladder",
      "check": "tests_not_presented_as_proof",
      "status": "pass",
      "evidence": "tests are not presented as proof — never say proven, bug-free, or certified without property, scope, and evidence"
    },
    {
      "section": "specs_before_tools",
      "check": "invariants_written",
      "status": "pass",
      "evidence": "invariants are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "pre_post_conditions_written",
      "status": "pass",
      "evidence": "pre- and post-conditions are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "liveness_properties_written",
      "status": "pass",
      "evidence": "liveness properties are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "specs_written_before_tools_run",
      "status": "pass",
      "evidence": "specs come before tools: written before running anything"
    },
    {
      "section": "evidence_artifacts",
      "check": "machine_checkable_artifact_for_each_claim",
      "status": "pass",
      "evidence": "each claim has a machine-checkable artifact behind it"
    },
    {
      "section": "evidence_artifacts",
      "check": "proof_scripts_or_solver_logs_retained",
      "status": "pass",
      "evidence": "evidence artifacts are retained: counterexamples, proof scripts, solver logs, CI records"
    },
    {
      "section": "evidence_artifacts",
      "check": "counterexample_not_suppressed",
      "status": "pass",
      "evidence": "never suppress a counterexample"
    },
    {
      "section": "evidence_artifacts",
      "check": "reproduction_recipe_present",
      "status": "pass",
      "evidence": "no certificate without a reproduction recipe"
    },
    {
      "section": "scope_honesty",
      "check": "exclusions_written",
      "status": "pass",
      "evidence": "what is outside scope is listed — dependencies, hardware, misconfiguration, side channels"
    },
    {
      "section": "scope_honesty",
      "check": "claims_versioned",
      "status": "pass",
      "evidence": "every claim is versioned"
    },
    {
      "section": "scope_honesty",
      "check": "reverification_triggers_defined",
      "status": "pass",
      "evidence": "re-verification triggers are defined — re-verify on change"
    },
    {
      "section": "scope_honesty",
      "check": "verified_at_current_version",
      "status": "pass",
      "evidence": "never certify an artifact that has not been verified at its current version"
    },
    {
      "section": "ci_integration",
      "check": "verification_runs_in_pipeline",
      "status": "pass",
      "evidence": "verification runs in the pipeline"
    },
    {
      "section": "ci_integration",
      "check": "broken_proof_fails_build",
      "status": "pass",
      "evidence": "a broken proof fails the build like a broken test"
    },
    {
      "section": "adversarial_and_certification",
      "check": "independent_adversarial_review_done",
      "status": "pass",
      "evidence": "an independent adversarial pass tries to falsify the claim — only unfalsified claims are certified"
    },
    {
      "section": "adversarial_and_certification",
      "check": "counterexample_disclosed_when_found",
      "status": "pass",
      "evidence": "no counterexample found in adversarial review"
    },
    {
      "section": "adversarial_and_certification",
      "check": "signed_attestation_binds_claim_artifact_and_commit",
      "status": "pass",
      "evidence": "a signed attestation binds claim to artifact to source commit (hash and signature)"
    },
    {
      "section": "adversarial_and_certification",
      "check": "certificate_independently_reproducible",
      "status": "pass",
      "evidence": "certificates are signed, versioned, and independently reproducible"
    }
  ],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across seven sections.",
  "stamp": "CORRECTNESS VERIFICATION CERTIFICATE\ncomponent: auth-service-v1\nVERDICT: CERTIFIED\n  claims_register                  pass\n  evidence_ladder                  pass\n  specs_before_tools               pass\n  evidence_artifacts               pass\n  scope_honesty                    pass\n  ci_integration                   pass\n  adversarial_and_certification    pass\n26 pass, 0 fail, 0 missing of 26 checks across seven sections."
}
```

### Example 2 — violations (HTTP 200)

Input:

```json
{
  "component": "broken-logic-module",
  "register": {
    "exists": true,
    "property_named": true,
    "scope_named": true,
    "evidence_level_assigned": true,
    "expiry_set": true
  },
  "ladder": {
    "cheapest_sufficient_level_selected": true,
    "claim_exceeds_evidence_level": true,
    "tests_presented_as_proof": true
  },
  "specs": {
    "invariants_written": true,
    "pre_post_conditions_written": true,
    "liveness_properties_written": true,
    "written_before_tools_run": true
  },
  "artifacts": {
    "machine_checkable_per_claim": true,
    "proof_scripts_or_solver_logs_retained": true,
    "counterexample_suppressed": true,
    "reproduction_recipe_present": true
  },
  "scope": {
    "exclusions_written": true,
    "claims_versioned": true,
    "reverification_triggers_defined": true,
    "verified_at_current_version": true
  },
  "ci": {
    "verification_in_pipeline": true,
    "broken_proof_fails_build": true
  },
  "review": {
    "independent_review_done": true,
    "counterexample_found": false,
    "counterexample_disclosed": true
  },
  "certificate": {
    "signed_attestation_binds_claim_artifact_commit": true,
    "independently_reproducible": true
  }
}
```

Response:

```json
{
  "service": "correctness-verification-certificate",
  "atom_version": "0.1.0",
  "component": "broken-logic-module",
  "verdict": "NOT_CERTIFIED",
  "sections": {
    "claims_register": "pass",
    "evidence_ladder": "fail",
    "specs_before_tools": "pass",
    "evidence_artifacts": "fail",
    "scope_honesty": "pass",
    "ci_integration": "pass",
    "adversarial_and_certification": "pass"
  },
  "checks": [
    {
      "section": "claims_register",
      "check": "register_exists",
      "status": "pass",
      "evidence": "claims register first: one row per claim — no register, no claim"
    },
    {
      "section": "claims_register",
      "check": "property_named_for_each_claim",
      "status": "pass",
      "evidence": "each claim names the property — what exactly is claimed correct"
    },
    {
      "section": "claims_register",
      "check": "scope_named_for_each_claim",
      "status": "pass",
      "evidence": "each claim names its scope — which version / configuration the claim covers"
    },
    {
      "section": "claims_register",
      "check": "evidence_level_assigned_for_each_claim",
      "status": "pass",
      "evidence": "each claim carries its evidence level from the ladder"
    },
    {
      "section": "claims_register",
      "check": "expiry_set_for_each_claim",
      "status": "pass",
      "evidence": "each claim carries an expiry — stale certificates are void"
    },
    {
      "section": "evidence_ladder",
      "check": "cheapest_sufficient_level_selected",
      "status": "pass",
      "evidence": "the evidence ladder — L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants — cheapest that suffices is selected"
    },
    {
      "section": "evidence_ladder",
      "check": "no_claim_exceeds_its_evidence_level",
      "status": "fail",
      "evidence": "no claim exceeds its evidence level (tests are not proof)"
    },
    {
      "section": "evidence_ladder",
      "check": "tests_not_presented_as_proof",
      "status": "fail",
      "evidence": "tests are not presented as proof — never say proven, bug-free, or certified without property, scope, and evidence"
    },
    {
      "section": "specs_before_tools",
      "check": "invariants_written",
      "status": "pass",
      "evidence": "invariants are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "pre_post_conditions_written",
      "status": "pass",
      "evidence": "pre- and post-conditions are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "liveness_properties_written",
      "status": "pass",
      "evidence": "liveness properties are written in the checker's language"
    },
    {
      "section": "specs_before_tools",
      "check": "specs_written_before_tools_run",
      "status": "pass",
      "evidence": "specs come before tools: written before running anything"
    },
    {
      "section": "evidence_artifacts",
      "check": "machine_checkable_artifact_for_each_claim",
      "status": "pass",
      "evidence": "each claim has a machine-checkable artifact behind it"
    },
    {
      "section": "evidence_artifacts",
      "check": "proof_scripts_or_solver_logs_retained",
      "status": "pass",
      "evidence": "evidence artifacts are retained: counterexamples, proof scripts, solver logs, CI records"
    },
    {
      "section": "evidence_artifacts",
      "check": "counterexample_not_suppressed",
      "status": "fail",
      "evidence": "never suppress a counterexample"
    },
    {
      "section": "evidence_artifacts",
      "check": "reproduction_recipe_present",
      "status": "pass",
      "evidence": "no certificate without a reproduction recipe"
    },
    {
      "section": "scope_honesty",
      "check": "exclusions_written",
      "status": "pass",
      "evidence": "what is outside scope is listed — dependencies, hardware, misconfiguration, side channels"
    },
    {
      "section": "scope_honesty",
      "check": "claims_versioned",
      "status": "pass",
      "evidence": "every claim is versioned"
    },
    {
      "section": "scope_honesty",
      "check": "reverification_triggers_defined",
      "status": "pass",
      "evidence": "re-verification triggers are defined — re-verify on change"
    },
    {
      "section": "scope_honesty",
      "check": "verified_at_current_version",
      "status": "pass",
      "evidence": "never certify an artifact that has not been verified at its current version"
    },
    {
      "section": "ci_integration",
      "check": "verification_runs_in_pipeline",
      "status": "pass",
      "evidence": "verification runs in the pipeline"
    },
    {
      "section": "ci_integration",
      "check": "broken_proof_fails_build",
      "status": "pass",
      "evidence": "a broken proof fails the build like a broken test"
    },
    {
      "section": "adversarial_and_certification",
      "check": "independent_adversarial_review_done",
      "status": "pass",
      "evidence": "an independent adversarial pass tries to falsify the claim — only unfalsified claims are certified"
    },
    {
      "section": "adversarial_and_certification",
      "check": "counterexample_disclosed_when_found",
      "status": "pass",
      "evidence": "no counterexample found in adversarial review"
    },
    {
      "section": "adversarial_and_certification",
      "check": "signed_attestation_binds_claim_artifact_and_commit",
      "status": "pass",
      "evidence": "a signed attestation binds claim to artifact to source commit (hash and signature)"
    },
    {
      "section": "adversarial_and_certification",
      "check": "certificate_independently_reproducible",
      "status": "pass",
      "evidence": "certificates are signed, versioned, and independently reproducible"
    }
  ],
  "summary": "23 pass, 3 fail, 0 missing of 26 checks across seven sections.",
  "stamp": "CORRECTNESS VERIFICATION CERTIFICATE\ncomponent: broken-logic-module\nVERDICT: NOT_CERTIFIED\n  claims_register                  pass\n  evidence_ladder                  fail\n  specs_before_tools               pass\n  evidence_artifacts               fail\n  scope_honesty                    pass\n  ci_integration                   pass\n  adversarial_and_certification    pass\n23 pass, 3 fail, 0 missing of 26 checks across seven sections."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "component": 12345,
  "register": "not-an-object"
}
```

Response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "component",
  "detail": "component must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators Yes |
| Checks named vs recorded | 26 / 26 (recorded full-pass REST response) |
| Verdict vocabulary complete | Yes — `CERTIFIED`, `NOT_CERTIFIED`, `INSUFFICIENT_EVIDENCE`; section statuses `pass` / `fail` / `insufficient_evidence`; per-check statuses `pass` / `fail` / `missing` |
| Input reference typed | Yes — 28 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/correctness-verification-certificate/evidence.json` |

