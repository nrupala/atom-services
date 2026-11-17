# Framework adoption adr — documentation

**Framework adoption adr** · slug `framework-adoption-adr` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

Discrepancy note: SERVICE.md and contract.yaml still record this atom's status as `built-locally` ("no endpoint is live"), but the recorded verification battery was run against the live gateway v1.1.0 (see Worked examples provenance) and the atom is live as a release candidate. This document follows the recorded evidence and the live status; SERVICE.md's status line is the stale record.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "Alpha", adopting the `framework` "React"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "framework-adoption-adr"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the framework-adoption manifest.** You declare a record of a framework adoption decision — the atom audits the record, it does not adopt the framework (see Explanation). The recorded full-pass manifest declares the project `Alpha` adopting `React`: the adoption ADR is logged, with alternatives and exit cost stated; one candidate, `React`, with all five fit criteria assessed (team familiarity, maintenance health, ecosystem, performance, exit cost) and `selected` true; one framework per layer, core logic importing no framework code, and the framework at the edges (ports & adapters), with `is_mid_project_change` false (so the two migration-plan checks pass as not applicable); versions pinned exactly with no unpinned `latest` in production (`unpinned_latest_in_production_present: false`), changelogs read and updates batched, with `major_upgrade_planned` false (so the two major-upgrade checks pass as not applicable); explicit configuration preferred with runtime behaviour, lifecycle, dependency injection and caching behaviour understood, and no deprecated APIs on the hot path (`deprecated_apis_on_hot_path_present: false`); `plugins_present` false (so the plugin-row and unused-plugins checks pass as not applicable) with plugins treated as dependencies; and deprecation warnings tracked, migrations scheduled, and no zombie code paths (`zombie_code_paths_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/framework-adoption-adr` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `FRAMEWORK_ADOPTION_SOUND`: "30 pass, 0 fail, 0 missing of 30 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `candidates_count` is 1, `selected_count` is 1, `selected_candidate` is `"React"`, `fit_assessment_coverage` is `"1.000000"`, and `plugins_count`, `plugins_without_review_or_pin` and `plugin_compliance_coverage` are null (no `plugins.items` list is declared).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `FRAMEWORK_ADOPTION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "framework-adoption-adr"}`.
3. Call: `POST https://atoms.pipavia.com/v1/framework-adoption-adr` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/framework-adoption-adr` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `framework_adoption_adr`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `FRAMEWORK_ADOPTION_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `exactly_one_candidate_selected`, `no_unpinned_latest_in_production`, and the summary reads "28 pass, 2 fail, 0 missing of 30 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the state of the declared rows (in the recorded violations run, `candidates_count` is 2, `selected_count` is 2 and `selected_candidate` is null: two candidates, `Vue` and `Angular`, both fully fit-assessed, both declare `selected` true, so exactly-one-selected fails; and `versions.unpinned_latest_in_production_present` is declared `true`, so the red-line check fails. Fix = declare exactly one candidate selected, and remove the unpinned `latest` from production so that field can be declared `false`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "adr",
  "detail": "adr must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/framework-adoption-adr` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/framework-adoption-adr` — tool name `framework_adoption_adr`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `framework_adoption_adr` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `FRAMEWORK_ADOPTION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked |
| `framework` | string | The framework being adopted; carried into the verdict output, not itself checked |

#### Read by: adr_and_fit

| Field | Type | Notes |
|---|---|---|
| `adr` | object | The ADR section object — a present non-object value is rejected before evaluation (the recorded 422, field `adr`) |
| `adr.logged` | boolean | — |
| `adr.alternatives_stated` | boolean | — |
| `adr.exit_cost_stated` | boolean | — |
| `candidates` | list | list of candidate-row objects, each with the entry fields below; computed, see below |
| `candidates[]` | object | One declared candidate row — a present non-object entry is rejected before evaluation |
| `candidates[].name` | string | Must be a non-empty string for the row to pass the computed name check — an absent field is missing evidence, an empty string fails; names the row in the computed outputs |
| `candidates[].team_familiarity_assessed` | boolean | One of the five fit criteria |
| `candidates[].maintenance_health_assessed` | boolean | One of the five fit criteria |
| `candidates[].ecosystem_assessed` | boolean | One of the five fit criteria |
| `candidates[].performance_assessed` | boolean | One of the five fit criteria |
| `candidates[].exit_cost_assessed` | boolean | One of the five fit criteria |
| `candidates[].selected` | boolean | Exactly one row in the list may be `true` for the computed selection check to pass |

#### Read by: house_stack_and_core

| Field | Type | Notes |
|---|---|---|
| `house_stack` | object | The house-stack section object — a present non-object value is rejected before evaluation |
| `house_stack.one_framework_per_layer` | boolean | — |
| `house_stack.core_logic_imports_no_framework_code` | boolean | — |
| `house_stack.framework_at_edges_ports_adapters` | boolean | — |
| `house_stack.is_mid_project_change` | boolean (gate) | Gates the two migration-plan checks below |
| `house_stack.migration_plan_documented` | boolean | Required when the adoption is a mid-project change; otherwise the check passes as not applicable |
| `house_stack.migration_plan_approved` | boolean | Required when the adoption is a mid-project change — skill red line; otherwise not applicable |

#### Read by: pinning_and_upgrades

| Field | Type | Notes |
|---|---|---|
| `versions` | object | The versions section object — a present non-object value is rejected before evaluation |
| `versions.exact_versions_pinned` | boolean | — |
| `versions.unpinned_latest_in_production_present` | boolean | Must be `false` to pass — skill red line |
| `versions.changelogs_read` | boolean | — |
| `versions.updates_batched` | boolean | — |
| `versions.major_upgrade_planned` | boolean (gate) | Gates the two major-upgrade checks below |
| `versions.major_upgrade_written_plan` | boolean | Required when a major upgrade is declared planned; otherwise the check passes as not applicable |
| `versions.major_upgrade_full_suite_run` | boolean | Required when a major upgrade is declared planned; otherwise not applicable |

#### Read by: explicitness_and_runtime

| Field | Type | Notes |
|---|---|---|
| `runtime` | object | The runtime section object — a present non-object value is rejected before evaluation |
| `runtime.explicit_configuration_preferred` | boolean | — |
| `runtime.runtime_behaviour_understood` | boolean | — |
| `runtime.lifecycle_understood` | boolean | — |
| `runtime.dependency_injection_understood` | boolean | — |
| `runtime.caching_behaviour_understood` | boolean | — |
| `runtime.deprecated_apis_on_hot_path_present` | boolean | Must be `false` to pass — skill quality gate |

#### Read by: plugins_and_deprecations

| Field | Type | Notes |
|---|---|---|
| `plugins` | object | The plugins section object — a present non-object value is rejected before evaluation |
| `plugins.plugins_present` | boolean (gate) | Gates the computed plugin-row check and the unused-plugins check below |
| `plugins.plugins_treated_as_dependencies` | boolean | — |
| `plugins.unused_plugins_removed` | boolean | Required when plugins are declared present; otherwise the check passes as not applicable |
| `plugins.items` | list | list of plugin-row objects, each with the entry fields below; computed when plugins are declared present, see below |
| `plugins.items[]` | object | One declared plugin row — a present non-object entry is rejected before evaluation |
| `plugins.items[].name` | string | Names the row in the computed outputs |
| `plugins.items[].reviewed` | boolean | — |
| `plugins.items[].pinned` | boolean | — |
| `deprecations` | object | The deprecations section object — a present non-object value is rejected before evaluation |
| `deprecations.warnings_tracked` | boolean | — |
| `deprecations.migrations_scheduled` | boolean | — |
| `deprecations.zombie_code_paths_present` | boolean | Must be `false` to pass — skill rule |

### Checks

All 30 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome; a gated check whose gate field itself is absent reports `missing`. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: adr_and_fit

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `adr_logged_for_new_framework` | quality gate: the new framework has a logged ADR | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `adr_states_alternatives` | quality gate: the adoption ADR states the alternatives considered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `adr_states_exit_cost` | quality gate: the adoption ADR states the exit cost of taking on this framework | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `candidates_declared` | choose by fit: the declared record names its candidate frameworks — the candidates list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_candidate_names_framework` | choose by fit: every declared candidate row names its framework — a non-empty name string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_candidate_fit_fully_assessed` | choose by fit: every declared candidate row declares all five fit criteria assessed — team familiarity, maintenance health, ecosystem, performance, exit cost | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `exactly_one_candidate_selected` | choose by fit: exactly one declared candidate row is selected — an adoption ADR decides one framework | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: house_stack_and_core

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `one_framework_per_layer` | house stack: one framework per layer | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_logic_imports_no_framework_code` | framework-free core / quality gate: core logic imports no framework code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `framework_at_edges_ports_adapters` | framework-free core: the framework sits at the edges (ports & adapters); business logic lives in plain functions/modules | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mid_project_migration_plan_documented` | not a mid-project change | Conditional on `house_stack.is_mid_project_change`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "not a mid-project change"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate itself is absent, or the gate is declared and the required field is absent. |
| `mid_project_migration_plan_approved` | not a mid-project change | Conditional on `house_stack.is_mid_project_change`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "not a mid-project change"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate itself is absent, or the gate is declared and the required field is absent. |

#### Section: pinning_and_upgrades

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `exact_versions_pinned` | pin and plan upgrades / quality gate: versions are pinned exactly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unpinned_latest_in_production` | red line: no unpinned "latest" from CDNs or tags in production | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `changelogs_read_before_upgrades` | pin and plan upgrades: changelogs are read before upgrades | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `updates_batched` | pin and plan upgrades: updates are batched | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `major_upgrade_written_plan` | no major upgrade declared | Conditional on `versions.major_upgrade_planned`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no major upgrade declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate itself is absent, or the gate is declared and the required field is absent. |
| `major_upgrade_full_suite_run` | no major upgrade declared | Conditional on `versions.major_upgrade_planned`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no major upgrade declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate itself is absent, or the gate is declared and the required field is absent. |

#### Section: explicitness_and_runtime

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `explicit_configuration_preferred` | avoid magic: explicit configuration is preferred | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `runtime_behaviour_understood` | avoid magic: what the framework does at runtime is understood | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lifecycle_understood` | avoid magic: the framework lifecycle is understood | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `dependency_injection_understood` | avoid magic: the framework's dependency injection is understood | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `caching_behaviour_understood` | avoid magic: the framework's caching behaviour is understood | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_deprecated_apis_on_hot_path` | quality gate: no deprecated APIs on the hot path | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: plugins_and_deprecations

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `plugins_treated_as_dependencies` | plugin discipline: plugins are treated as dependencies | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_plugin_reviewed_and_pinned` | no plugins declared | Computed over the declared record, conditional on `plugins.plugins_present`. Pass: the gate is declared and every declared plugin row declares `reviewed` and `pinned` true — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no plugins declared"). Fail: the gate is declared and the declared record breaks the rule — an empty list where a non-empty list is required, or a declared row not declaring both true (offending rows are named in `plugins_without_review_or_pin`). Missing: the gate itself is absent, or the gate is declared and the list, or a field the rule reads, is absent. |
| `unused_plugins_removed` | no plugins declared | Conditional on `plugins.plugins_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no plugins declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate itself is absent, or the gate is declared and the required field is absent. |
| `deprecation_warnings_tracked` | deprecations: deprecation warnings are tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deprecation_migrations_scheduled` | deprecations: deprecation migrations happen on schedule | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_zombie_code_paths` | deprecations: no zombie code paths waiting to break | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"framework-adoption-adr"`), `atom_version` (`"0.1.0"`), `project` (the manifest's declared project value, carried through) and `framework` (the manifest's declared framework value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `candidates_count` (the declared list length as an integer, or null when the list is not declared); `selected_count` (declared selected candidate rows, or null when the `candidates` list is not declared); `selected_candidate` (the sole selected candidate's name, or null when there is not exactly one selected row with a non-empty name); `plugins_count` (the declared `plugins.items` list length as an integer, or null when the list is not declared); the row-name lists `candidates_without_name` and `candidates_without_fit_assessment` (null when the `candidates` list is not declared; for `candidates_without_fit_assessment`, rows with at least one fit field present but not all five assessed — a row with no fit field present is missing evidence and does not appear) and `plugins_without_review_or_pin` (null when the `plugins.items` list is not declared; plugin rows with `reviewed` or `pinned` present but not both true — a row with both absent is missing evidence and does not appear); and the ratios `fit_assessment_coverage` (candidates with all five fit criteria assessed ÷ declared candidates) and `plugin_compliance_coverage` (plugins declaring reviewed and pinned ÷ declared plugins) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project and framework values, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `FRAMEWORK_ADOPTION_SOUND` — all 30 checks pass: the declared framework-adoption record is complete and consistent with the bound skill's checklist and red lines.
- `FRAMEWORK_ADOPTION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent (for gated checks: the gate field itself is absent, or the gate is triggered and the required field is absent).

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the framework_adoption_adr scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the framework_adoption_adr scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"adr","detail":"adr must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for framework-adoption-adr exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Adopt, structure, and upgrade frameworks deliberately — ADR for new ones, keep core framework-free, plan exits (the bound capability, from the `framework-discipline` skill). You submit one declared record — the framework-adoption manifest, for one project taking on one framework — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`adr_and_fit`, `house_stack_and_core`, `pinning_and_upgrades`, `explicitness_and_runtime`, `plugins_and_deprecations`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. Its ground is distinct from the sibling `architecture-decision-record` atom, with which it shares zero checks: the sibling audits a **general** architecture decision record (NFRs, boundaries and contracts, a 2–3 alternatives list with trade-offs, ADR format/numbering/one-page, reversibility, supersession), while this atom audits only the decision to **take on a framework** — the adoption ADR's alternatives + exit-cost statement for this framework, the five named fit criteria per candidate, exactly one candidate selected, house-stack conformity, a framework-free core, version pinning and major-upgrade planning, runtime explicitness, plugin discipline and deprecation handling. This atom has no alternatives count range, no trade-offs/serious flags, no ADR format, numbering, page-count, NFR, boundary, contract or supersession check.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `candidates` list must be present and non-empty, every row must name a non-empty `name`, every row must declare all five fit criteria assessed, exactly one row may declare `selected` true, and, when plugins are declared present, the declared `plugins.items` list must be present and non-empty with every row declaring `reviewed` and `pinned` true — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — the migration-plan checks are required only when `house_stack.is_mid_project_change` is declared `true`, the major-upgrade written-plan and full-suite checks only when `versions.major_upgrade_planned` is declared `true`, and the plugin-row and unused-plugin checks only when `plugins.plugins_present` is declared `true`; when the gate is not triggered they pass as not applicable, and their evidence text says so; when the gate field itself is absent they report `missing`. Aggregation is strict: any `fail` anywhere produces `FRAMEWORK_ADOPTION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `FRAMEWORK_ADOPTION_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: an exit-cost amount or ceiling (the skill requires exit cost to be stated/assessed but states no number — caller declaration only); a fit score or weighting across the five criteria (the skill names the criteria but states no score, weight or minimum — assessment declared, quality not scored); a maintenance-health metric (commits, release cadence, issue latency — the skill says "maintenance health" but states no measure); a candidate-count range (the skill requires alternatives in the ADR but states no number for framework candidates — unlike the sibling skill's 2–3 general alternatives rule, which is *not* imported here; completeness and exactly-one-selected are the only bars); an upgrade cadence or batch size (the skill says "batch updates" but states no interval or size); a deprecation-migration window (the skill says "migrate on schedule" but states no period); and a codemod requirement as a separate check (the skill lists codemods among upgrade tools — "use codemods" states no condition under which one is mandatory, so no check is invented for it; the written plan + full-suite run quality gate is the checkable bar). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** framework-adoption record: a verdict of `FRAMEWORK_ADOPTION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares a logged ADR with exit cost, a framework-free core and pinned versions passes those checks even if the real project does none of it. It is a completeness and consistency audit of the record the skill requires, **not a framework selection service or a live posture certification**. Specifically: it writes no ADR, chooses no framework, inspects no codebase for framework imports, reads no lockfile, and does not verify that a declared control actually works. It never judges whether the selected framework is the right choice commercially, whether a declared fit assessment was well made, whether the real core is truly framework-free, or whether a declared exit cost is realistic — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no code, repository or lockfile inspection (core framework imports, version pinning and zombie code paths are caller declarations, the atom reads no code); fit judgment (which framework *should* be selected, how the five criteria should be weighted) is a caller declaration — the atom checks only that every candidate was assessed on all five criteria and that exactly one is selected, never which candidate ought to win; the skill's preference for boring and stable over fashionable is carried as the caller's own fit assessment, not scored here (and is not duplicated from the sibling atom's boring-technology check); the skill's cross-references to sibling disciplines (`architecture-decisions` for the ADR form itself, `dependency-governance` for plugin/dependency depth, `typescript-engineering`) are carried as the caller's own attestations in this record, not re-audited here — the ADR's *general* completeness belongs to the sibling `architecture-decision-record` atom.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product stack framework adoption decisions (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared framework-adoption record; its verdict is a decision-record completeness and consistency judgment on the declared evidence, not compliance or audit evidence in a regulated domain and not a framework review or live posture certification (SERVICE.md states this explicitly). No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `framework_adoption_adr` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/framework_adoption_adr.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_framework_adoption_adr.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/framework-adoption-adr` (REST) and `POST /mcp/framework-adoption-adr` (MCP, tool `framework_adoption_adr`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `framework_adoption_adr`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:48.675193+00:00 against gateway v1.1.0, external verification lane, source `verification/work/framework-adoption-adr/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "project": "Alpha",
  "framework": "React",
  "adr": {
    "logged": true,
    "alternatives_stated": true,
    "exit_cost_stated": true
  },
  "candidates": [
    {
      "name": "React",
      "team_familiarity_assessed": true,
      "maintenance_health_assessed": true,
      "ecosystem_assessed": true,
      "performance_assessed": true,
      "exit_cost_assessed": true,
      "selected": true
    }
  ],
  "house_stack": {
    "one_framework_per_layer": true,
    "core_logic_imports_no_framework_code": true,
    "framework_at_edges_ports_adapters": true,
    "is_mid_project_change": false
  },
  "versions": {
    "exact_versions_pinned": true,
    "unpinned_latest_in_production_present": false,
    "changelogs_read": true,
    "updates_batched": true,
    "major_upgrade_planned": false
  },
  "runtime": {
    "explicit_configuration_preferred": true,
    "runtime_behaviour_understood": true,
    "lifecycle_understood": true,
    "dependency_injection_understood": true,
    "caching_behaviour_understood": true,
    "deprecated_apis_on_hot_path_present": false
  },
  "plugins": {
    "plugins_present": false,
    "plugins_treated_as_dependencies": true
  },
  "deprecations": {
    "warnings_tracked": true,
    "migrations_scheduled": true,
    "zombie_code_paths_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "framework-adoption-adr",
  "atom_version": "0.1.0",
  "project": "Alpha",
  "framework": "React",
  "verdict": "FRAMEWORK_ADOPTION_SOUND",
  "sections": {
    "adr_and_fit": "pass",
    "house_stack_and_core": "pass",
    "pinning_and_upgrades": "pass",
    "explicitness_and_runtime": "pass",
    "plugins_and_deprecations": "pass"
  },
  "checks": [
    {
      "section": "adr_and_fit",
      "check": "adr_logged_for_new_framework",
      "status": "pass",
      "evidence": "quality gate: the new framework has a logged ADR"
    },
    {
      "section": "adr_and_fit",
      "check": "adr_states_alternatives",
      "status": "pass",
      "evidence": "quality gate: the adoption ADR states the alternatives considered"
    },
    {
      "section": "adr_and_fit",
      "check": "adr_states_exit_cost",
      "status": "pass",
      "evidence": "quality gate: the adoption ADR states the exit cost of taking on this framework"
    },
    {
      "section": "adr_and_fit",
      "check": "candidates_declared",
      "status": "pass",
      "evidence": "choose by fit: the declared record names its candidate frameworks \u2014 the candidates list is present and non-empty"
    },
    {
      "section": "adr_and_fit",
      "check": "every_candidate_names_framework",
      "status": "pass",
      "evidence": "choose by fit: every declared candidate row names its framework \u2014 a non-empty name string"
    },
    {
      "section": "adr_and_fit",
      "check": "every_candidate_fit_fully_assessed",
      "status": "pass",
      "evidence": "choose by fit: every declared candidate row declares all five fit criteria assessed \u2014 team familiarity, maintenance health, ecosystem, performance, exit cost"
    },
    {
      "section": "adr_and_fit",
      "check": "exactly_one_candidate_selected",
      "status": "pass",
      "evidence": "choose by fit: exactly one declared candidate row is selected \u2014 an adoption ADR decides one framework"
    },
    {
      "section": "house_stack_and_core",
      "check": "one_framework_per_layer",
      "status": "pass",
      "evidence": "house stack: one framework per layer"
    },
    {
      "section": "house_stack_and_core",
      "check": "core_logic_imports_no_framework_code",
      "status": "pass",
      "evidence": "framework-free core / quality gate: core logic imports no framework code"
    },
    {
      "section": "house_stack_and_core",
      "check": "framework_at_edges_ports_adapters",
      "status": "pass",
      "evidence": "framework-free core: the framework sits at the edges (ports & adapters); business logic lives in plain functions/modules"
    },
    {
      "section": "house_stack_and_core",
      "check": "mid_project_migration_plan_documented",
      "status": "pass",
      "evidence": "not a mid-project change"
    },
    {
      "section": "house_stack_and_core",
      "check": "mid_project_migration_plan_approved",
      "status": "pass",
      "evidence": "not a mid-project change"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "exact_versions_pinned",
      "status": "pass",
      "evidence": "pin and plan upgrades / quality gate: versions are pinned exactly"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "no_unpinned_latest_in_production",
      "status": "pass",
      "evidence": "red line: no unpinned \"latest\" from CDNs or tags in production"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "changelogs_read_before_upgrades",
      "status": "pass",
      "evidence": "pin and plan upgrades: changelogs are read before upgrades"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "updates_batched",
      "status": "pass",
      "evidence": "pin and plan upgrades: updates are batched"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "major_upgrade_written_plan",
      "status": "pass",
      "evidence": "no major upgrade declared"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "major_upgrade_full_suite_run",
      "status": "pass",
      "evidence": "no major upgrade declared"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "explicit_configuration_preferred",
      "status": "pass",
      "evidence": "avoid magic: explicit configuration is preferred"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "runtime_behaviour_understood",
      "status": "pass",
      "evidence": "avoid magic: what the framework does at runtime is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "lifecycle_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework lifecycle is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "dependency_injection_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework's dependency injection is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "caching_behaviour_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework's caching behaviour is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "no_deprecated_apis_on_hot_path",
      "status": "pass",
      "evidence": "quality gate: no deprecated APIs on the hot path"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "plugins_treated_as_dependencies",
      "status": "pass",
      "evidence": "plugin discipline: plugins are treated as dependencies"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "every_plugin_reviewed_and_pinned",
      "status": "pass",
      "evidence": "no plugins declared"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "unused_plugins_removed",
      "status": "pass",
      "evidence": "no plugins declared"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "deprecation_warnings_tracked",
      "status": "pass",
      "evidence": "deprecations: deprecation warnings are tracked"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "deprecation_migrations_scheduled",
      "status": "pass",
      "evidence": "deprecations: deprecation migrations happen on schedule"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "no_zombie_code_paths",
      "status": "pass",
      "evidence": "deprecations: no zombie code paths waiting to break"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "candidates_count": 1,
  "candidates_without_name": [],
  "candidates_without_fit_assessment": [],
  "fit_assessment_coverage": "1.000000",
  "selected_count": 1,
  "selected_candidate": "React",
  "plugins_count": null,
  "plugins_without_review_or_pin": null,
  "plugin_compliance_coverage": null,
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections.",
  "stamp": "FRAMEWORK ADOPTION ADR\nproject: Alpha\nframework: React\nVERDICT: FRAMEWORK_ADOPTION_SOUND\n  adr_and_fit                          pass\n  house_stack_and_core                 pass\n  pinning_and_upgrades                 pass\n  explicitness_and_runtime             pass\n  plugins_and_deprecations             pass\n30 pass, 0 fail, 0 missing of 30 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "project": "Beta",
  "framework": "Vue",
  "adr": {
    "logged": true,
    "alternatives_stated": true,
    "exit_cost_stated": true
  },
  "candidates": [
    {
      "name": "Vue",
      "team_familiarity_assessed": true,
      "maintenance_health_assessed": true,
      "ecosystem_assessed": true,
      "performance_assessed": true,
      "exit_cost_assessed": true,
      "selected": true
    },
    {
      "name": "Angular",
      "team_familiarity_assessed": true,
      "maintenance_health_assessed": true,
      "ecosystem_assessed": true,
      "performance_assessed": true,
      "exit_cost_assessed": true,
      "selected": true
    }
  ],
  "house_stack": {
    "one_framework_per_layer": true,
    "core_logic_imports_no_framework_code": true,
    "framework_at_edges_ports_adapters": true,
    "is_mid_project_change": false
  },
  "versions": {
    "exact_versions_pinned": true,
    "unpinned_latest_in_production_present": true,
    "changelogs_read": true,
    "updates_batched": true,
    "major_upgrade_planned": false
  },
  "runtime": {
    "explicit_configuration_preferred": true,
    "runtime_behaviour_understood": true,
    "lifecycle_understood": true,
    "dependency_injection_understood": true,
    "caching_behaviour_understood": true,
    "deprecated_apis_on_hot_path_present": false
  },
  "plugins": {
    "plugins_present": false,
    "plugins_treated_as_dependencies": true
  },
  "deprecations": {
    "warnings_tracked": true,
    "migrations_scheduled": true,
    "zombie_code_paths_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "framework-adoption-adr",
  "atom_version": "0.1.0",
  "project": "Beta",
  "framework": "Vue",
  "verdict": "FRAMEWORK_ADOPTION_NOT_SOUND",
  "sections": {
    "adr_and_fit": "fail",
    "house_stack_and_core": "pass",
    "pinning_and_upgrades": "fail",
    "explicitness_and_runtime": "pass",
    "plugins_and_deprecations": "pass"
  },
  "checks": [
    {
      "section": "adr_and_fit",
      "check": "adr_logged_for_new_framework",
      "status": "pass",
      "evidence": "quality gate: the new framework has a logged ADR"
    },
    {
      "section": "adr_and_fit",
      "check": "adr_states_alternatives",
      "status": "pass",
      "evidence": "quality gate: the adoption ADR states the alternatives considered"
    },
    {
      "section": "adr_and_fit",
      "check": "adr_states_exit_cost",
      "status": "pass",
      "evidence": "quality gate: the adoption ADR states the exit cost of taking on this framework"
    },
    {
      "section": "adr_and_fit",
      "check": "candidates_declared",
      "status": "pass",
      "evidence": "choose by fit: the declared record names its candidate frameworks \u2014 the candidates list is present and non-empty"
    },
    {
      "section": "adr_and_fit",
      "check": "every_candidate_names_framework",
      "status": "pass",
      "evidence": "choose by fit: every declared candidate row names its framework \u2014 a non-empty name string"
    },
    {
      "section": "adr_and_fit",
      "check": "every_candidate_fit_fully_assessed",
      "status": "pass",
      "evidence": "choose by fit: every declared candidate row declares all five fit criteria assessed \u2014 team familiarity, maintenance health, ecosystem, performance, exit cost"
    },
    {
      "section": "adr_and_fit",
      "check": "exactly_one_candidate_selected",
      "status": "fail",
      "evidence": "choose by fit: exactly one declared candidate row is selected \u2014 an adoption ADR decides one framework"
    },
    {
      "section": "house_stack_and_core",
      "check": "one_framework_per_layer",
      "status": "pass",
      "evidence": "house stack: one framework per layer"
    },
    {
      "section": "house_stack_and_core",
      "check": "core_logic_imports_no_framework_code",
      "status": "pass",
      "evidence": "framework-free core / quality gate: core logic imports no framework code"
    },
    {
      "section": "house_stack_and_core",
      "check": "framework_at_edges_ports_adapters",
      "status": "pass",
      "evidence": "framework-free core: the framework sits at the edges (ports & adapters); business logic lives in plain functions/modules"
    },
    {
      "section": "house_stack_and_core",
      "check": "mid_project_migration_plan_documented",
      "status": "pass",
      "evidence": "not a mid-project change"
    },
    {
      "section": "house_stack_and_core",
      "check": "mid_project_migration_plan_approved",
      "status": "pass",
      "evidence": "not a mid-project change"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "exact_versions_pinned",
      "status": "pass",
      "evidence": "pin and plan upgrades / quality gate: versions are pinned exactly"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "no_unpinned_latest_in_production",
      "status": "fail",
      "evidence": "red line: no unpinned \"latest\" from CDNs or tags in production"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "changelogs_read_before_upgrades",
      "status": "pass",
      "evidence": "pin and plan upgrades: changelogs are read before upgrades"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "updates_batched",
      "status": "pass",
      "evidence": "pin and plan upgrades: updates are batched"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "major_upgrade_written_plan",
      "status": "pass",
      "evidence": "no major upgrade declared"
    },
    {
      "section": "pinning_and_upgrades",
      "check": "major_upgrade_full_suite_run",
      "status": "pass",
      "evidence": "no major upgrade declared"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "explicit_configuration_preferred",
      "status": "pass",
      "evidence": "avoid magic: explicit configuration is preferred"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "runtime_behaviour_understood",
      "status": "pass",
      "evidence": "avoid magic: what the framework does at runtime is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "lifecycle_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework lifecycle is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "dependency_injection_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework's dependency injection is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "caching_behaviour_understood",
      "status": "pass",
      "evidence": "avoid magic: the framework's caching behaviour is understood"
    },
    {
      "section": "explicitness_and_runtime",
      "check": "no_deprecated_apis_on_hot_path",
      "status": "pass",
      "evidence": "quality gate: no deprecated APIs on the hot path"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "plugins_treated_as_dependencies",
      "status": "pass",
      "evidence": "plugin discipline: plugins are treated as dependencies"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "every_plugin_reviewed_and_pinned",
      "status": "pass",
      "evidence": "no plugins declared"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "unused_plugins_removed",
      "status": "pass",
      "evidence": "no plugins declared"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "deprecation_warnings_tracked",
      "status": "pass",
      "evidence": "deprecations: deprecation warnings are tracked"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "deprecation_migrations_scheduled",
      "status": "pass",
      "evidence": "deprecations: deprecation migrations happen on schedule"
    },
    {
      "section": "plugins_and_deprecations",
      "check": "no_zombie_code_paths",
      "status": "pass",
      "evidence": "deprecations: no zombie code paths waiting to break"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "candidates_count": 2,
  "candidates_without_name": [],
  "candidates_without_fit_assessment": [],
  "fit_assessment_coverage": "1.000000",
  "selected_count": 2,
  "selected_candidate": null,
  "plugins_count": null,
  "plugins_without_review_or_pin": null,
  "plugin_compliance_coverage": null,
  "summary": "28 pass, 2 fail, 0 missing of 30 checks across five sections.",
  "stamp": "FRAMEWORK ADOPTION ADR\nproject: Beta\nframework: Vue\nVERDICT: FRAMEWORK_ADOPTION_NOT_SOUND\n  adr_and_fit                          fail\n  house_stack_and_core                 pass\n  pinning_and_upgrades                 fail\n  explicitness_and_runtime             pass\n  plugins_and_deprecations             pass\n28 pass, 2 fail, 0 missing of 30 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "project": "Delta",
  "adr": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "adr",
  "detail": "adr must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared framework-adoption record; its verdict is a decision-record completeness and consistency judgment, not compliance or audit evidence in a regulated domain and not a framework review. |
| Checks named | 30 documented / 30 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/framework-adoption-adr/evidence.json` |
