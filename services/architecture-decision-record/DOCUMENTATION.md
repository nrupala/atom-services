# Architecture decision record — `architecture-decision-record`

**Display name:** Architecture decision record · **Slug:** `architecture-decision-record` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "architecture-decision-record"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the architecture-decision manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `decision` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/architecture-decision-record` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `ADR_COMPLETE` — 32 pass, 0 fail, 0 missing of 32 checks across six sections. The declared alternatives list holds two entries (within the skill's stated 2–3 range), every entry declares its trade-offs, at least one (PostgreSQL) is declared serious, and `adr.page_count` is exactly 1 — so the four computed checks pass, `alternatives_count` reports 2 and `page_count_over_limit` reports `"0.0000"`. Both gates are closed in the recorded run (`dependencies.new_dependency_introduced: false`, `supersession.has_superseded_adrs: false`), so the gated reason and link checks pass as not applicable.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "architecture-decision-record"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/architecture-decision-record` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/architecture-decision-record` with the same `Authorization: Bearer <key>` header and call the tool `architecture_decision_record` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `ADR_NOT_COMPLETE` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), seven checks fail: `no_hidden_coupling_across_boundaries`, `no_backdoor_paths_around_contracts`, `alternatives_count_in_stated_range`, `all_alternatives_tradeoffs_stated`, `at_least_one_serious_alternative`, `adr_within_one_page_max` and `irreversible_decisions_not_deferred`. Fix = remove hidden coupling and backdoor paths (or declare honestly once removed), list 2–3 alternatives with trade-offs stated for each and at least one serious, cut the ADR to one page, and stop deferring irreversible decisions — then resubmit.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `nfrs` with detail "nfrs must be an object" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/architecture-decision-record` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/architecture-decision-record` — tool name `architecture_decision_record`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `decision` | string | — | string; carried into the verdict output, not itself checked |
| `nfrs.written` | boolean | nfrs_first |  |
| `nfrs.quantified_where_possible` | boolean | nfrs_first |  |
| `nfrs.agreed_before_design_freeze` | boolean | nfrs_first |  |
| `boundaries.contexts_drawn` | boolean | boundaries_and_contracts |  |
| `boundaries.core_kept_small` | boolean | boundaries_and_contracts |  |
| `boundaries.hidden_coupling_present` | boolean | boundaries_and_contracts | must be `false` to pass — skill red line |
| `boundaries.backdoor_paths_present` | boolean | boundaries_and_contracts | must be `false` to pass — skill red line |
| `contracts.interfaces_documented` | boolean | boundaries_and_contracts |  |
| `contracts.interfaces_versioned` | boolean | boundaries_and_contracts |  |
| `contracts.inputs_outputs_defined` | boolean | boundaries_and_contracts |  |
| `contracts.errors_defined` | boolean | boundaries_and_contracts |  |
| `contracts.defined_before_code` | boolean | boundaries_and_contracts |  |
| `options.alternatives` | string | options_and_tradeoffs | list of `{name (string |
| `options.prefers_boring_replaceable_tech` | boolean | options_and_tradeoffs |  |
| `adr.numbered` | boolean | adr_format |  |
| `adr.context_stated` | boolean | adr_format |  |
| `adr.decision_stated` | boolean | adr_format |  |
| `adr.consequences_positive_stated` | boolean | adr_format |  |
| `adr.consequences_negative_stated` | boolean | adr_format |  |
| `adr.consequences_risks_stated` | boolean | adr_format |  |
| `adr.status_stated` | boolean | adr_format |  |
| `adr.page_count` | number | adr_format | number; must be ≤ 1 to pass — computed, see below |
| `reversibility.assessed` | boolean | reversibility_and_security |  |
| `reversibility.expensive_choices_isolated_behind_interfaces` | boolean | reversibility_and_security |  |
| `reversibility.irreversible_decisions_deferred` | boolean | reversibility_and_security | must be `false` to pass — skill red line |
| `security.data_flows_mapped` | boolean | reversibility_and_security |  |
| `security.encryption_verification_addressed` | boolean | reversibility_and_security |  |
| `dependencies.new_dependency_introduced` | boolean | lifecycle_and_dependencies | gates the reason check below |
| `dependencies.new_dependency_reason_stated` | boolean | lifecycle_and_dependencies | required when a dependency is introduced; otherwise the check passes as not applicable |
| `supersession.has_superseded_adrs` | boolean | lifecycle_and_dependencies | gates the link check below |
| `supersession.superseded_adrs_linked_to_replacements` | boolean | lifecycle_and_dependencies | required when superseded ADRs exist; otherwise the check passes as not applicable |
| `supersession.superseded_silently_rewritten` | boolean | lifecycle_and_dependencies | must be `false` to pass |

### Checks

All 32 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `nfrs_first` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `nfrs_written` | NFRs first: non-functional requirements (performance, scale, availability, security, cost) are written before the design |
| `nfrs_quantified_where_possible` | NFRs are quantified where possible, per the skill's method step 1 |
| `nfrs_agreed_before_design_freeze` | quality gate: NFRs written and agreed before design freeze |
#### Section: `boundaries_and_contracts` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `boundaries_drawn` | boundaries: contexts/modules are drawn before the build |
| `core_kept_small` | boundaries: the core is kept small, with clear interfaces at the seams |
| `interfaces_documented` | quality gate: interfaces are documented |
| `interfaces_versioned` | quality gate: interfaces are versioned — contracts are defined and versioned before code |
| `contract_inputs_outputs_defined` | contracts before code: API/module contracts define inputs and outputs |
| `contract_errors_defined` | contracts before code: API/module contracts define errors |
| `contracts_defined_before_code` | contracts before code: the contracts are defined before the code that implements them |
| `no_hidden_coupling_across_boundaries` | red line: no hidden coupling across boundaries |
| `no_backdoor_paths_around_contracts` | red line: no backdoor paths around the contracts |
#### Section: `options_and_tradeoffs` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `alternatives_count_in_stated_range` | options: list 2-3 real alternatives — the declared alternatives list holds between two and three entries |
| `all_alternatives_tradeoffs_stated` | options: each listed alternative carries its trade-offs (honest trade-offs, stated per alternative) |
| `at_least_one_serious_alternative` | quality gate: at least one serious alternative considered per major decision |
| `boring_replaceable_tech_preferred` | options: prefer boring, replaceable tech |
#### Section: `adr_format` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `adr_numbered` | artifacts: the ADR is numbered (docs/adr/NNNN-title) |
| `context_stated` | ADR format: Context is stated |
| `decision_stated` | ADR format: Decision is stated |
| `consequences_positive_stated` | ADR format: Consequences state the positives |
| `consequences_negative_stated` | ADR format: Consequences state the negatives |
| `consequences_risks_stated` | ADR format: Consequences state the risks |
| `status_stated` | ADR format: Status is stated |
| `adr_within_one_page_max` | ADR format: one page max — the declared page count is at or below one page |
#### Section: `reversibility_and_security` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `reversibility_assessed` | reversibility: the decision's reversibility is assessed — choices that are cheap to undo are preferred |
| `expensive_choices_isolated_behind_interfaces` | reversibility: expensive-to-reverse choices are isolated behind interfaces |
| `irreversible_decisions_not_deferred` | red line: no 'we'll figure it out later' for irreversible decisions |
| `data_flows_mapped` | security by design: data flows are mapped |
| `encryption_and_verification_addressed` | security by design: encryption/verification is addressed per the secure-build pattern |
#### Section: `lifecycle_and_dependencies` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `new_dependency_reason_stated_when_introduced` | no new dependency introduced |
| `superseded_adrs_link_to_replacements` | no superseded ADRs declared |
| `superseded_adrs_not_silently_rewritten` | decisions live in ADRs — written once, superseded, never silently rewritten |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `decision` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 32 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence`; `null` when either primary computed check (alternatives count, page limit) cannot be completed.
- `alternatives_count` — The declared alternatives list length (integer), or `null`.
- `page_count_over_limit` — The declared page count minus the stated maximum of 1, as a string with exactly four decimal places (round half up to 4dp: `floor(v * 10000 + 0.5) / 10000`, then formatted to four decimals; comparisons use unrounded values).
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `ADR_COMPLETE` — All 32 checks pass.
- `ADR_NOT_COMPLETE` — At least one check fails.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence`; `null` when either primary computed check (alternatives count, page limit) cannot be completed.
- `alternatives_count` — The declared alternatives list length (integer), or `null`.
- `page_count_over_limit` — The declared page count minus the stated maximum of 1, as a string with exactly four decimal places (round half up to 4dp: `floor(v * 10000 + 0.5) / 10000`, then formatted to four decimals; comparisons use unrounded values).

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "nfrs", "detail": "nfrs must be an object"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom audits a declared ADR pack for one architecture decision across six sections: NFRs first (written, quantified where possible, agreed before design freeze); boundaries and contracts (contexts drawn, core kept small, no hidden coupling or backdoor paths, interfaces documented/versioned with inputs, outputs and errors defined before code); options and trade-offs; ADR format; reversibility and security; and lifecycle and dependencies. Four checks are computed from the declared alternatives list and page count, using only what the skill itself states. **Alternatives count:** the skill's method states 'list 2–3 real alternatives', so the list passes only with two or three entries inclusive; a missing or non-list value is missing evidence, an empty list is present and fails. **Trade-offs per alternative:** every entry must declare `tradeoffs_stated: true`. **Serious alternative:** at least one entry must declare `serious: true`. **One page max:** `adr.page_count` passes at or below 1 and fails above it (equality passes — the skill states a maximum, not a margin); an absent value is missing evidence, a wrong-typed value is invalid input. Two checks are gated: `dependencies.new_dependency_introduced` gates the reason check, and `supersession.has_superseded_adrs` gates the link check; closed gates pass as not applicable. The fixed four-decimal serialization of `page_count_over_limit` is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It audits a **declared** ADR pack — it does not write the ADR, choose the technology, read the repository, or verify that a declared value is true. It is a completeness audit of the record the skill requires, **not an architecture review**: it never judges whether the decision itself is wise, whether the chosen option is the right one, or whether the stated trade-offs are accurate. Named exclusions: no check of the ADR's prose (context quality, consequence honesty, NFR realism are judgment, and the skill states no vocabulary for grading them); no status vocabulary is imposed (only the presence of a Status field is checked); no verification that a numbered ADR file exists at `docs/adr/NNNN-title.md`, only that numbering is declared; no live verification of any declared fact.

**Buyer / use context.** Teams and agents in engineering & code running architecture reviews before builds, who need a deterministic completeness verdict on an ADR pack. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/architecture_decision_record.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_architecture_decision_record.py — 38 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/architecture-decision-record` and MCP `POST /mcp/architecture-decision-record` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T00:02:12.128302+00:00 against gateway v1.1.0, external verification lane, source `verification/work/architecture-decision-record/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "decision": "Use PostgreSQL for primary storage",
  "nfrs": {
    "written": true,
    "quantified_where_possible": true,
    "agreed_before_design_freeze": true
  },
  "boundaries": {
    "contexts_drawn": true,
    "core_kept_small": true,
    "hidden_coupling_present": false,
    "backdoor_paths_present": false
  },
  "contracts": {
    "interfaces_documented": true,
    "interfaces_versioned": true,
    "inputs_outputs_defined": true,
    "errors_defined": true,
    "defined_before_code": true
  },
  "options": {
    "alternatives": [
      {
        "name": "PostgreSQL",
        "serious": true,
        "tradeoffs_stated": true
      },
      {
        "name": "MongoDB",
        "serious": false,
        "tradeoffs_stated": true
      }
    ],
    "prefers_boring_replaceable_tech": true
  },
  "adr": {
    "numbered": true,
    "context_stated": true,
    "decision_stated": true,
    "consequences_positive_stated": true,
    "consequences_negative_stated": true,
    "consequences_risks_stated": true,
    "status_stated": true,
    "page_count": 1
  },
  "reversibility": {
    "assessed": true,
    "expensive_choices_isolated_behind_interfaces": true,
    "irreversible_decisions_deferred": false
  },
  "security": {
    "data_flows_mapped": true,
    "encryption_verification_addressed": true
  },
  "dependencies": {
    "new_dependency_introduced": false
  },
  "supersession": {
    "has_superseded_adrs": false,
    "superseded_silently_rewritten": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "architecture-decision-record",
  "atom_version": "0.1.0",
  "decision": "Use PostgreSQL for primary storage",
  "verdict": "ADR_COMPLETE",
  "sections": {
    "nfrs_first": "pass",
    "boundaries_and_contracts": "pass",
    "options_and_tradeoffs": "pass",
    "adr_format": "pass",
    "reversibility_and_security": "pass",
    "lifecycle_and_dependencies": "pass"
  },
  "checks": [
    {
      "section": "nfrs_first",
      "check": "nfrs_written",
      "status": "pass",
      "evidence": "NFRs first: non-functional requirements (performance, scale, availability, security, cost) are written before the design"
    },
    {
      "section": "nfrs_first",
      "check": "nfrs_quantified_where_possible",
      "status": "pass",
      "evidence": "NFRs are quantified where possible, per the skill's method step 1"
    },
    {
      "section": "nfrs_first",
      "check": "nfrs_agreed_before_design_freeze",
      "status": "pass",
      "evidence": "quality gate: NFRs written and agreed before design freeze"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "boundaries_drawn",
      "status": "pass",
      "evidence": "boundaries: contexts/modules are drawn before the build"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "core_kept_small",
      "status": "pass",
      "evidence": "boundaries: the core is kept small, with clear interfaces at the seams"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "interfaces_documented",
      "status": "pass",
      "evidence": "quality gate: interfaces are documented"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "interfaces_versioned",
      "status": "pass",
      "evidence": "quality gate: interfaces are versioned \u2014 contracts are defined and versioned before code"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contract_inputs_outputs_defined",
      "status": "pass",
      "evidence": "contracts before code: API/module contracts define inputs and outputs"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contract_errors_defined",
      "status": "pass",
      "evidence": "contracts before code: API/module contracts define errors"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contracts_defined_before_code",
      "status": "pass",
      "evidence": "contracts before code: the contracts are defined before the code that implements them"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "no_hidden_coupling_across_boundaries",
      "status": "pass",
      "evidence": "red line: no hidden coupling across boundaries"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "no_backdoor_paths_around_contracts",
      "status": "pass",
      "evidence": "red line: no backdoor paths around the contracts"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "alternatives_count_in_stated_range",
      "status": "pass",
      "evidence": "options: list 2-3 real alternatives \u2014 the declared alternatives list holds between two and three entries"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "all_alternatives_tradeoffs_stated",
      "status": "pass",
      "evidence": "options: each listed alternative carries its trade-offs (honest trade-offs, stated per alternative)"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "at_least_one_serious_alternative",
      "status": "pass",
      "evidence": "quality gate: at least one serious alternative considered per major decision"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "boring_replaceable_tech_preferred",
      "status": "pass",
      "evidence": "options: prefer boring, replaceable tech"
    },
    {
      "section": "adr_format",
      "check": "adr_numbered",
      "status": "pass",
      "evidence": "artifacts: the ADR is numbered (docs/adr/NNNN-title)"
    },
    {
      "section": "adr_format",
      "check": "context_stated",
      "status": "pass",
      "evidence": "ADR format: Context is stated"
    },
    {
      "section": "adr_format",
      "check": "decision_stated",
      "status": "pass",
      "evidence": "ADR format: Decision is stated"
    },
    {
      "section": "adr_format",
      "check": "consequences_positive_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the positives"
    },
    {
      "section": "adr_format",
      "check": "consequences_negative_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the negatives"
    },
    {
      "section": "adr_format",
      "check": "consequences_risks_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the risks"
    },
    {
      "section": "adr_format",
      "check": "status_stated",
      "status": "pass",
      "evidence": "ADR format: Status is stated"
    },
    {
      "section": "adr_format",
      "check": "adr_within_one_page_max",
      "status": "pass",
      "evidence": "ADR format: one page max \u2014 the declared page count is at or below one page"
    },
    {
      "section": "reversibility_and_security",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "reversibility: the decision's reversibility is assessed \u2014 choices that are cheap to undo are preferred"
    },
    {
      "section": "reversibility_and_security",
      "check": "expensive_choices_isolated_behind_interfaces",
      "status": "pass",
      "evidence": "reversibility: expensive-to-reverse choices are isolated behind interfaces"
    },
    {
      "section": "reversibility_and_security",
      "check": "irreversible_decisions_not_deferred",
      "status": "pass",
      "evidence": "red line: no 'we'll figure it out later' for irreversible decisions"
    },
    {
      "section": "reversibility_and_security",
      "check": "data_flows_mapped",
      "status": "pass",
      "evidence": "security by design: data flows are mapped"
    },
    {
      "section": "reversibility_and_security",
      "check": "encryption_and_verification_addressed",
      "status": "pass",
      "evidence": "security by design: encryption/verification is addressed per the secure-build pattern"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "new_dependency_reason_stated_when_introduced",
      "status": "pass",
      "evidence": "no new dependency introduced"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "superseded_adrs_link_to_replacements",
      "status": "pass",
      "evidence": "no superseded ADRs declared"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "superseded_adrs_not_silently_rewritten",
      "status": "pass",
      "evidence": "decisions live in ADRs \u2014 written once, superseded, never silently rewritten"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "alternatives_count": 2,
  "page_count_over_limit": "0.0000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections.",
  "stamp": "ARCHITECTURE DECISION RECORD\ndecision: Use PostgreSQL for primary storage\nVERDICT: ADR_COMPLETE\n  nfrs_first                       pass\n  boundaries_and_contracts         pass\n  options_and_tradeoffs            pass\n  adr_format                       pass\n  reversibility_and_security       pass\n  lifecycle_and_dependencies       pass\n32 pass, 0 fail, 0 missing of 32 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "decision": "Bad Architecture",
  "nfrs": {
    "written": true,
    "quantified_where_possible": true,
    "agreed_before_design_freeze": true
  },
  "boundaries": {
    "contexts_drawn": true,
    "core_kept_small": true,
    "hidden_coupling_present": true,
    "backdoor_paths_present": true
  },
  "contracts": {
    "interfaces_documented": true,
    "interfaces_versioned": true,
    "inputs_outputs_defined": true,
    "errors_defined": true,
    "defined_before_code": true
  },
  "options": {
    "alternatives": [
      {
        "name": "A",
        "serious": false,
        "tradeoffs_stated": false
      }
    ],
    "prefers_boring_replaceable_tech": true
  },
  "adr": {
    "numbered": true,
    "context_stated": true,
    "decision_stated": true,
    "consequences_positive_stated": true,
    "consequences_negative_stated": true,
    "consequences_risks_stated": true,
    "status_stated": true,
    "page_count": 5
  },
  "reversibility": {
    "assessed": true,
    "expensive_choices_isolated_behind_interfaces": true,
    "irreversible_decisions_deferred": true
  },
  "security": {
    "data_flows_mapped": true,
    "encryption_verification_addressed": true
  },
  "dependencies": {
    "new_dependency_introduced": false
  },
  "supersession": {
    "has_superseded_adrs": false,
    "superseded_silently_rewritten": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "architecture-decision-record",
  "atom_version": "0.1.0",
  "decision": "Bad Architecture",
  "verdict": "ADR_NOT_COMPLETE",
  "sections": {
    "nfrs_first": "pass",
    "boundaries_and_contracts": "fail",
    "options_and_tradeoffs": "fail",
    "adr_format": "fail",
    "reversibility_and_security": "fail",
    "lifecycle_and_dependencies": "pass"
  },
  "checks": [
    {
      "section": "nfrs_first",
      "check": "nfrs_written",
      "status": "pass",
      "evidence": "NFRs first: non-functional requirements (performance, scale, availability, security, cost) are written before the design"
    },
    {
      "section": "nfrs_first",
      "check": "nfrs_quantified_where_possible",
      "status": "pass",
      "evidence": "NFRs are quantified where possible, per the skill's method step 1"
    },
    {
      "section": "nfrs_first",
      "check": "nfrs_agreed_before_design_freeze",
      "status": "pass",
      "evidence": "quality gate: NFRs written and agreed before design freeze"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "boundaries_drawn",
      "status": "pass",
      "evidence": "boundaries: contexts/modules are drawn before the build"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "core_kept_small",
      "status": "pass",
      "evidence": "boundaries: the core is kept small, with clear interfaces at the seams"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "interfaces_documented",
      "status": "pass",
      "evidence": "quality gate: interfaces are documented"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "interfaces_versioned",
      "status": "pass",
      "evidence": "quality gate: interfaces are versioned \u2014 contracts are defined and versioned before code"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contract_inputs_outputs_defined",
      "status": "pass",
      "evidence": "contracts before code: API/module contracts define inputs and outputs"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contract_errors_defined",
      "status": "pass",
      "evidence": "contracts before code: API/module contracts define errors"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "contracts_defined_before_code",
      "status": "pass",
      "evidence": "contracts before code: the contracts are defined before the code that implements them"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "no_hidden_coupling_across_boundaries",
      "status": "fail",
      "evidence": "red line: no hidden coupling across boundaries"
    },
    {
      "section": "boundaries_and_contracts",
      "check": "no_backdoor_paths_around_contracts",
      "status": "fail",
      "evidence": "red line: no backdoor paths around the contracts"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "alternatives_count_in_stated_range",
      "status": "fail",
      "evidence": "options: list 2-3 real alternatives \u2014 the declared alternatives list holds between two and three entries"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "all_alternatives_tradeoffs_stated",
      "status": "fail",
      "evidence": "options: each listed alternative carries its trade-offs (honest trade-offs, stated per alternative)"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "at_least_one_serious_alternative",
      "status": "fail",
      "evidence": "quality gate: at least one serious alternative considered per major decision"
    },
    {
      "section": "options_and_tradeoffs",
      "check": "boring_replaceable_tech_preferred",
      "status": "pass",
      "evidence": "options: prefer boring, replaceable tech"
    },
    {
      "section": "adr_format",
      "check": "adr_numbered",
      "status": "pass",
      "evidence": "artifacts: the ADR is numbered (docs/adr/NNNN-title)"
    },
    {
      "section": "adr_format",
      "check": "context_stated",
      "status": "pass",
      "evidence": "ADR format: Context is stated"
    },
    {
      "section": "adr_format",
      "check": "decision_stated",
      "status": "pass",
      "evidence": "ADR format: Decision is stated"
    },
    {
      "section": "adr_format",
      "check": "consequences_positive_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the positives"
    },
    {
      "section": "adr_format",
      "check": "consequences_negative_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the negatives"
    },
    {
      "section": "adr_format",
      "check": "consequences_risks_stated",
      "status": "pass",
      "evidence": "ADR format: Consequences state the risks"
    },
    {
      "section": "adr_format",
      "check": "status_stated",
      "status": "pass",
      "evidence": "ADR format: Status is stated"
    },
    {
      "section": "adr_format",
      "check": "adr_within_one_page_max",
      "status": "fail",
      "evidence": "ADR format: one page max \u2014 the declared page count is at or below one page"
    },
    {
      "section": "reversibility_and_security",
      "check": "reversibility_assessed",
      "status": "pass",
      "evidence": "reversibility: the decision's reversibility is assessed \u2014 choices that are cheap to undo are preferred"
    },
    {
      "section": "reversibility_and_security",
      "check": "expensive_choices_isolated_behind_interfaces",
      "status": "pass",
      "evidence": "reversibility: expensive-to-reverse choices are isolated behind interfaces"
    },
    {
      "section": "reversibility_and_security",
      "check": "irreversible_decisions_not_deferred",
      "status": "fail",
      "evidence": "red line: no 'we'll figure it out later' for irreversible decisions"
    },
    {
      "section": "reversibility_and_security",
      "check": "data_flows_mapped",
      "status": "pass",
      "evidence": "security by design: data flows are mapped"
    },
    {
      "section": "reversibility_and_security",
      "check": "encryption_and_verification_addressed",
      "status": "pass",
      "evidence": "security by design: encryption/verification is addressed per the secure-build pattern"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "new_dependency_reason_stated_when_introduced",
      "status": "pass",
      "evidence": "no new dependency introduced"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "superseded_adrs_link_to_replacements",
      "status": "pass",
      "evidence": "no superseded ADRs declared"
    },
    {
      "section": "lifecycle_and_dependencies",
      "check": "superseded_adrs_not_silently_rewritten",
      "status": "pass",
      "evidence": "decisions live in ADRs \u2014 written once, superseded, never silently rewritten"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "alternatives_count": 1,
  "page_count_over_limit": "4.0000",
  "summary": "25 pass, 7 fail, 0 missing of 32 checks across six sections.",
  "stamp": "ARCHITECTURE DECISION RECORD\ndecision: Bad Architecture\nVERDICT: ADR_NOT_COMPLETE\n  nfrs_first                       pass\n  boundaries_and_contracts         fail\n  options_and_tradeoffs            fail\n  adr_format                       fail\n  reversibility_and_security       fail\n  lifecycle_and_dependencies       pass\n25 pass, 7 fail, 0 missing of 32 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "decision": "Malformed input",
  "nfrs": "not-an-object",
  "adr": {
    "page_count": "one-page"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "nfrs",
  "detail": "nfrs must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 32 / 32 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 33 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
