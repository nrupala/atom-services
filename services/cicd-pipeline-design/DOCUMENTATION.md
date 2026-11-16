# CI/CD pipeline design — `cicd-pipeline-design`

**Display name:** CI/CD pipeline design · **Slug:** `cicd-pipeline-design` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "cicd-pipeline-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "service-alpha" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/cicd-pipeline-design` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CICD_PIPELINE_READY` — 36 pass, 0 fail, 0 missing of 36 checks across six sections. Recorded computed values: `stages_evaluated` = `6`; `computed_total_minutes` = `"13.000000"`; `total_minutes_difference` = `"0.000000"`; `stated_stages_not_declared` = `[]`; `computed_monthly_minutes` = `"1300.000000"`; `monthly_minutes_difference` = `"0.000000"`; `budget_headroom_minutes` = `"700.000000"`; `computed_status` = `"within_stated_limits_on_declared_evidence"`.
   Why it passes, in the tester's recorded words: All 36 checks pass. Stage sum 1+2+5+3+1+1=13 matches declared 13; monthly 13*100=1300 matches declared 1300; headroom 2000-1300=700.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "cicd-pipeline-design"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/cicd-pipeline-design` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/cicd-pipeline-design` with the same `Authorization: Bearer <key>` header and call the tool `cicd_pipeline_design` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `CICD_PIPELINE_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 36 missing of 36 checks across six sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `CICD_PIPELINE_NOT_READY` — 26 pass, 10 fail, 0 missing of 36 checks across six sections. The failing checks were exactly: `total_minutes_matches_sum_of_stage_minutes`, `no_unpinned_third_party_actions`, `secrets_not_cached`, `secrets_never_in_artifacts`, `no_secret_appeared_in_logs_or_artifacts`, `monthly_minutes_matches_per_run_times_runs`, `monthly_minutes_within_declared_budget`, `pipeline_does_not_duplicate_primary_gate`, `never_direct_to_prod_from_laptop`, `gates_not_disabled_to_unblock_merge`. Recorded case notes: Full manifest with exactly 10 planted violations: declared_total 5 vs sum 13 (diff -8); unpinned_third_party_actions_present=true; secrets_cached=true; secrets.in_artifacts=true; secrets.appeared_in_logs_or_artifacts=true; monthly declared 50 vs computed 10*10=100 (diff -50); computed monthly 100 exceeds declared budget 20 (headroom -80); duplicates_primary_gate=true; direct_to_prod_from_laptop=true; disabled_to_unblock_merge=true. All other fields carry passing values so no other check fails and none is missing.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `pipeline` with detail "pipeline must be an object" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/cicd-pipeline-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/cicd-pipeline-design` — tool name `cicd_pipeline_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `pipeline.stages` | list of stage entries | stages_and_fail_fast | list of stage entries; absent / not a list / empty = all three computed stage checks missing |
| `pipeline.stages[].name` | string | stages_and_fail_fast | string; must be non-empty for the entry to be complete; the entry names are the stage-sequence vocabulary — see the computed checks |
| `pipeline.stages[].minutes` | number | stages_and_fail_fast | number; declared per-stage minutes, summed by the computed total check |
| `pipeline.declared_total_minutes` | number | stages_and_fail_fast | number; computed, see below |
| `pipeline.fails_fast` | boolean | stages_and_fail_fast |  |
| `pipeline.reports_first_real_cause` | boolean | stages_and_fail_fast |  |
| `pipeline.is_primary_green_gate` | boolean | stages_and_fail_fast |  |
| `determinism.lockfile_enforced_installs` | boolean | determinism_and_pinning |  |
| `determinism.tool_versions_pinned` | boolean | determinism_and_pinning |  |
| `determinism.byte_exact_checkouts_where_hashes_matter` | boolean | determinism_and_pinning |  |
| `determinism.same_commit_same_artifact_verified` | boolean | determinism_and_pinning |  |
| `determinism.third_party_actions_pinned` | boolean | determinism_and_pinning |  |
| `determinism.unpinned_third_party_actions_present` | boolean | determinism_and_pinning | must be `false` to pass — skill red line |
| `caching.dependency_cache_keyed_on_lockfile` | boolean | caching_and_secrets |  |
| `caching.build_cache_keyed_on_lockfile` | boolean | caching_and_secrets |  |
| `caching.secrets_cached` | boolean | caching_and_secrets | must be `false` to pass — skill method step 3 |
| `caching.test_fixtures_cached` | boolean | caching_and_secrets | must be `false` to pass — skill method step 3 |
| `secrets.from_secret_store_only` | boolean | caching_and_secrets |  |
| `secrets.masked_in_logs` | boolean | caching_and_secrets |  |
| `secrets.in_artifacts` | boolean | caching_and_secrets | must be `false` to pass — skill method step 4 |
| `secrets.error_output_scrubbed` | boolean | caching_and_secrets |  |
| `secrets.appeared_in_logs_or_artifacts` | boolean | caching_and_secrets | must be `false` to pass — skill quality gate |
| `budget.estimated_minutes_per_run` | number | budget_awareness | number; computed, see below |
| `budget.runs_per_month` | number | budget_awareness | number; computed, see below |
| `budget.declared_monthly_minutes` | number | budget_awareness | number; computed, see below |
| `budget.monthly_minutes_budget` | number | budget_awareness | number; the caller's own declared budget, computed, see below |
| `budget.workflows_minimal_where_constrained` | boolean | budget_awareness |  |
| `budget.heavy_builds_on_owned_hardware` | boolean | budget_awareness |  |
| `budget.duplicates_primary_gate` | boolean | budget_awareness | must be `false` to pass — skill method step 5 |
| `provenance.checksums_published` | boolean | provenance_and_signing |  |
| `provenance.releases_signed` | boolean | provenance_and_signing |  |
| `provenance.build_outputs_retained` | boolean | provenance_and_signing |  |
| `provenance.manifest_hashes_retained` | boolean | provenance_and_signing |  |
| `provenance.release_artifacts_carry_hash_and_signature` | boolean | provenance_and_signing |  |
| `deploys.hitl_approval_required` | boolean | deploys_and_gates |  |
| `deploys.rollback_path_present` | boolean | deploys_and_gates |  |
| `deploys.direct_to_prod_from_laptop` | boolean | deploys_and_gates | must be `false` to pass — skill method step 7 |
| `gates.disabled_to_unblock_merge` | boolean | deploys_and_gates | must be `false` to pass — skill red line |
| `gates.overrides_logged_with_reason` | boolean | deploys_and_gates |  |

### Checks

All 36 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `stages_and_fail_fast` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `stage_entries_complete` | every stage entry carries a non-empty name and numeric minutes |
| `stage_order_matches_stated_sequence` | method step 1: the declared stage names equal the stated sequence in order — lint, typecheck, test, build, package/sign, publish (cheapest first) |
| `total_minutes_matches_sum_of_stage_minutes` | the declared total pipeline minutes equal the sum of the declared per-stage minutes |
| `pipeline_fails_fast` | quality gate: the pipeline fails fast — the cheapest stages run first and stop the run on the first failure |
| `first_real_cause_reported` | quality gate: the pipeline reports the first real cause of a failure |
| `pipeline_is_primary_green_gate` | the pipeline is the primary green gate — humans approve deploys, the pipeline gates the merge |

#### Section: `determinism_and_pinning` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `lockfile_enforced_installs` | method step 2: installs are lockfile-enforced (frozen-lockfile) |
| `tool_versions_pinned` | method step 2: tool versions are pinned |
| `byte_exact_checkouts_where_hashes_matter` | method step 2: checkouts are byte-exact where hashes matter |
| `same_commit_produces_same_artifact` | quality gate: the same commit produces the same artifact — determinism is verified, not assumed |
| `third_party_actions_pinned` | red line: third-party actions are pinned to versions |
| `no_unpinned_third_party_actions` | red line: no unpinned third-party actions are present in the pipeline |

#### Section: `caching_and_secrets` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `dependency_cache_keyed_on_lockfile` | method step 3: the dependency cache is keyed on the lockfile |
| `build_cache_keyed_on_lockfile` | method step 3: the build cache is keyed on the lockfile |
| `secrets_not_cached` | method step 3: secrets are never cached |
| `test_fixtures_not_cached` | method step 3: test fixtures are never cached |
| `secrets_from_secret_store_only` | method step 4: secrets come from the secret store only |
| `secrets_masked_in_logs` | method step 4: secrets are masked in logs |
| `secrets_never_in_artifacts` | method step 4: secrets never appear in artifacts |
| `error_output_scrubbed` | method step 4: error output is scrubbed of secrets |
| `no_secret_appeared_in_logs_or_artifacts` | quality gate: no secret ever appears in logs or artifacts |

#### Section: `budget_awareness` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `monthly_minutes_matches_per_run_times_runs` | method step 5: the declared monthly minutes equal the declared estimated minutes per run multiplied by the declared runs per month |
| `monthly_minutes_within_declared_budget` | method step 5: the re-derived monthly minutes do not exceed the monthly minutes budget the caller itself declares (the skill states no budget number, so none is imposed here) |
| `workflows_minimal_where_minutes_constrained` | method step 5: workflows are kept minimal where minutes are constrained |
| `heavy_builds_on_owned_hardware` | method step 5: heavy builds run on owned hardware |
| `pipeline_does_not_duplicate_primary_gate` | method step 5: the pipeline does not duplicate the primary gate |

#### Section: `provenance_and_signing` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `artifact_checksums_published` | method step 6: artifacts are published with checksums |
| `releases_signed` | method step 6: releases are signed |
| `build_outputs_retained` | method step 6: build outputs are kept |
| `manifest_hashes_retained` | method step 6: manifest hashes are kept alongside the build outputs |
| `release_artifacts_carry_hash_and_signature` | quality gate: release artifacts carry hash + signature |

#### Section: `deploys_and_gates` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `hitl_approval_for_deploys` | method step 7: deploys require HITL approval — humans approve deploys |
| `rollback_path_present` | method step 7: a rollback path always exists |
| `never_direct_to_prod_from_laptop` | method step 7: never direct-to-prod from a laptop |
| `gates_not_disabled_to_unblock_merge` | red line: gates are not disabled to unblock a merge |
| `gate_overrides_logged_with_reason` | red line: a conscious gate override is logged with its reason |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`cicd-pipeline-design`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 36 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `stages_evaluated` — Computed/reported field; recorded full-pass value: `6`.
- `computed_total_minutes` — Computed/reported field; recorded full-pass value: `"13.000000"`.
- `total_minutes_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `stated_stages_not_declared` — Computed/reported field; recorded full-pass value: `[]`.
- `computed_monthly_minutes` — Computed/reported field; recorded full-pass value: `"1300.000000"`.
- `monthly_minutes_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `budget_headroom_minutes` — Computed/reported field; recorded full-pass value: `"700.000000"`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `stages_evaluated` (count of complete stage entries), `computed_total_minutes` and `total_minutes_difference`, `stated_stages_not_declared` (stated stages absent from the declared names, or null when no stage list is declared or an entry carries no usable name), `computed_monthly_minutes` and `monthly_minutes_difference`, `budget_headroom_minutes` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `CICD_PIPELINE_READY` — every check passes; the pipeline artifact is complete and internally consistent on the declared evidence.
- `CICD_PIPELINE_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `stages_evaluated` — reported as in the recorded responses (full-pass value `6`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_total_minutes` — reported as in the recorded responses (full-pass value `"13.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `total_minutes_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `stated_stages_not_declared` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_monthly_minutes` — reported as in the recorded responses (full-pass value `"1300.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `monthly_minutes_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `budget_headroom_minutes` — reported as in the recorded responses (full-pass value `"700.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "pipeline", "detail": "pipeline must be an object"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a CI/CD pipeline artifact — its declared stage list with per-stage minutes and a declared total, its determinism and pinning record, its caching and secrets record, its minutes budget record, its provenance record, and its deploy and gate record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CICD_PIPELINE_READY**, **CICD_PIPELINE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not design a pipeline, write workflow files, run the pipeline, or verify that a declared value is true. Computed checks: every stage entry must carry a non-empty name and numeric minutes; the declared stage names must equal the skill's stated sequence exactly — lint → typecheck → test → build → package_sign (the manifest spelling of "package/sign") → publish, cheapest first; the declared total minutes must equal the sum of the per-stage minutes; the declared monthly minutes must equal estimated minutes per run × runs per month; and the re-derived monthly minutes must not exceed the monthly minutes budget you yourself declare (no budget is imposed — the skill states no number, so only your own declared budget is compared). Same manifest in → same verdict out.

**Computed checks.** Five checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **Stage entries:** every declared `pipeline.stages` entry must carry a non-empty `name` string and numeric `minutes`. A missing or empty list is missing evidence; an incomplete entry makes the entries check missing, and makes the sequence check missing when the entry carries no usable name, or the total check missing when it carries no usable minutes. The output reports `stages_evaluated` (the count of complete stage entries).
- **Stage sequence:** the skill's method step 1 states the stages — "lint → typecheck → test → build → package/sign → publish. Cheapest first; fail fast". The declared stage names (with `package_sign` as the manifest spelling of "package/sign") therefore pass only when they equal that stated sequence exactly, in that order; extra, missing, renamed or reordered stages fail. Entries are validated as strings only, never enum-checked — sequence coverage is a verdict check, not a type error. The output reports the stated stages absent from the declared names as `stated_stages_not_declared` (null when no stage list is declared, or when a stage entry carries no usable name).
- **Stage minutes total:** the declared `pipeline.declared_total_minutes` passes only when it equals the sum of the declared per-stage `minutes`. The output reports `computed_total_minutes` and `total_minutes_difference` (declared minus computed, null when either cannot be computed).
- **Monthly minutes:** the declared `budget.declared_monthly_minutes` passes only when it equals `budget.estimated_minutes_per_run` × `budget.runs_per_month`. The output reports `computed_monthly_minutes` and `monthly_minutes_difference` (declared minus computed, null when either cannot be computed).
- **Monthly minutes vs the caller's own budget:** the re-derived monthly minutes pass only when they do not exceed `budget.monthly_minutes_budget` — the budget the caller itself declares. The skill says pipelines must be "minutes budget aware" but states no budget number, so **no budget is imposed** — only the caller's own declared budget is compared. The output reports `budget_headroom_minutes` (declared budget minus re-derived monthly minutes, null when either cannot be computed).

**Fixed serialization rule:** computed amounts are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `CICD_PIPELINE_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `CICD_PIPELINE_READY`. The verdict is one of `CICD_PIPELINE_READY` (all 36 checks pass), `CICD_PIPELINE_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across six sections: stages_and_fail_fast, determinism_and_pinning, caching_and_secrets, budget_awareness, provenance_and_signing, deploys_and_gates.

**What it does NOT do.**

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** pipeline artifact — it does not design the pipeline, write workflow files, run the pipeline, verify that a declared value is true, or judge whether the gates catch real problems. An artifact is ready *on the caller's declared evidence* even if its underlying pipeline is slow, flaky or fragile. It is a completeness and consistency audit, **not a pipeline review**: it never decides whether the stage set is right for the caller's stack beyond the skill's own stated sequence, whether the declared minutes are accurate (only that the declared totals are arithmetically consistent), or whether a cache is effective (only that it is keyed as the skill states and holds nothing the skill forbids).

**Thresholds declined — named explicitly.** The skill states no number for any of the following, so this atom imposes none and any future threshold must come from a skill refinement first (binding rule R1):

- no maximum pipeline duration, per-stage duration limit, or monthly minutes budget (only the caller-declared `monthly_minutes_budget` is compared, and only the declared totals' arithmetic is re-derived);
- no minimum cache hit rate or cache size (the skill requires lockfile keying and forbids caching secrets and test fixtures; effectiveness is not scored);
- no mandated checksum algorithm, signature scheme, or signing tool (the skill requires checksums and signed releases; it names the `secure-build-pattern` but states no algorithm);
- no stage count beyond the skill's own stated sequence, and no required ordering beyond that sequence;
- no rollback time limit, approval count beyond HITL approval being required, or build-output retention period (the skill requires a rollback path, HITL approval and kept outputs; it states no times, counts or periods);
- no flakiness rate, retry count, or failure-rate threshold (the skill requires fail-fast behaviour and first-cause reporting; it states no rates).

Named exclusions: no production of pipeline configs or gate reports; no verification of any declared stage, cache, secret handling or signature against a live repository or CI system; no judgment of test quality (what runs inside the `test` stage is the `testing-strategy` skill's surface, not this one's); no live verification of any declared fact.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **Repo pipeline setup work**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/cicd_pipeline_design.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_cicd_pipeline_design.py` — 45 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/cicd-pipeline-design` and MCP `POST /mcp/cicd-pipeline-design` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:55.962679+00:00 against gateway v1.1.0, external verification lane, source `verification/work/cicd-pipeline-design/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "entity": "service-alpha",
  "pipeline": {
    "stages": [
      {
        "name": "lint",
        "minutes": 1.0
      },
      {
        "name": "typecheck",
        "minutes": 2.0
      },
      {
        "name": "test",
        "minutes": 5.0
      },
      {
        "name": "build",
        "minutes": 3.0
      },
      {
        "name": "package_sign",
        "minutes": 1.0
      },
      {
        "name": "publish",
        "minutes": 1.0
      }
    ],
    "declared_total_minutes": 13.0,
    "fails_fast": true,
    "reports_first_real_cause": true,
    "is_primary_green_gate": true
  },
  "determinism": {
    "lockfile_enforced_installs": true,
    "tool_versions_pinned": true,
    "byte_exact_checkouts_where_hashes_matter": true,
    "same_commit_same_artifact_verified": true,
    "third_party_actions_pinned": true,
    "unpinned_third_party_actions_present": false
  },
  "caching": {
    "dependency_cache_keyed_on_lockfile": true,
    "build_cache_keyed_on_lockfile": true,
    "secrets_cached": false,
    "test_fixtures_cached": false
  },
  "secrets": {
    "from_secret_store_only": true,
    "masked_in_logs": true,
    "in_artifacts": false,
    "error_output_scrubbed": true,
    "appeared_in_logs_or_artifacts": false
  },
  "budget": {
    "estimated_minutes_per_run": 13.0,
    "runs_per_month": 100,
    "declared_monthly_minutes": 1300.0,
    "monthly_minutes_budget": 2000.0,
    "workflows_minimal_where_constrained": true,
    "heavy_builds_on_owned_hardware": true,
    "duplicates_primary_gate": false
  },
  "provenance": {
    "checksums_published": true,
    "releases_signed": true,
    "build_outputs_retained": true,
    "manifest_hashes_retained": true,
    "release_artifacts_carry_hash_and_signature": true
  },
  "deploys": {
    "hitl_approval_required": true,
    "rollback_path_present": true,
    "direct_to_prod_from_laptop": false
  },
  "gates": {
    "disabled_to_unblock_merge": false,
    "overrides_logged_with_reason": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "cicd-pipeline-design",
  "atom_version": "0.1.0",
  "entity": "service-alpha",
  "verdict": "CICD_PIPELINE_READY",
  "sections": {
    "stages_and_fail_fast": "pass",
    "determinism_and_pinning": "pass",
    "caching_and_secrets": "pass",
    "budget_awareness": "pass",
    "provenance_and_signing": "pass",
    "deploys_and_gates": "pass"
  },
  "checks": [
    {
      "section": "stages_and_fail_fast",
      "check": "stage_entries_complete",
      "status": "pass",
      "evidence": "every stage entry carries a non-empty name and numeric minutes"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "stage_order_matches_stated_sequence",
      "status": "pass",
      "evidence": "method step 1: the declared stage names equal the stated sequence in order — lint, typecheck, test, build, package/sign, publish (cheapest first)"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "total_minutes_matches_sum_of_stage_minutes",
      "status": "pass",
      "evidence": "the declared total pipeline minutes equal the sum of the declared per-stage minutes"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "pipeline_fails_fast",
      "status": "pass",
      "evidence": "quality gate: the pipeline fails fast — the cheapest stages run first and stop the run on the first failure"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "first_real_cause_reported",
      "status": "pass",
      "evidence": "quality gate: the pipeline reports the first real cause of a failure"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "pipeline_is_primary_green_gate",
      "status": "pass",
      "evidence": "the pipeline is the primary green gate — humans approve deploys, the pipeline gates the merge"
    },
    {
      "section": "determinism_and_pinning",
      "check": "lockfile_enforced_installs",
      "status": "pass",
      "evidence": "method step 2: installs are lockfile-enforced (frozen-lockfile)"
    },
    {
      "section": "determinism_and_pinning",
      "check": "tool_versions_pinned",
      "status": "pass",
      "evidence": "method step 2: tool versions are pinned"
    },
    {
      "section": "determinism_and_pinning",
      "check": "byte_exact_checkouts_where_hashes_matter",
      "status": "pass",
      "evidence": "method step 2: checkouts are byte-exact where hashes matter"
    },
    {
      "section": "determinism_and_pinning",
      "check": "same_commit_produces_same_artifact",
      "status": "pass",
      "evidence": "quality gate: the same commit produces the same artifact — determinism is verified, not assumed"
    },
    {
      "section": "determinism_and_pinning",
      "check": "third_party_actions_pinned",
      "status": "pass",
      "evidence": "red line: third-party actions are pinned to versions"
    },
    {
      "section": "determinism_and_pinning",
      "check": "no_unpinned_third_party_actions",
      "status": "pass",
      "evidence": "red line: no unpinned third-party actions are present in the pipeline"
    },
    {
      "section": "caching_and_secrets",
      "check": "dependency_cache_keyed_on_lockfile",
      "status": "pass",
      "evidence": "method step 3: the dependency cache is keyed on the lockfile"
    },
    {
      "section": "caching_and_secrets",
      "check": "build_cache_keyed_on_lockfile",
      "status": "pass",
      "evidence": "method step 3: the build cache is keyed on the lockfile"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_not_cached",
      "status": "pass",
      "evidence": "method step 3: secrets are never cached"
    },
    {
      "section": "caching_and_secrets",
      "check": "test_fixtures_not_cached",
      "status": "pass",
      "evidence": "method step 3: test fixtures are never cached"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_from_secret_store_only",
      "status": "pass",
      "evidence": "method step 4: secrets come from the secret store only"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_masked_in_logs",
      "status": "pass",
      "evidence": "method step 4: secrets are masked in logs"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_never_in_artifacts",
      "status": "pass",
      "evidence": "method step 4: secrets never appear in artifacts"
    },
    {
      "section": "caching_and_secrets",
      "check": "error_output_scrubbed",
      "status": "pass",
      "evidence": "method step 4: error output is scrubbed of secrets"
    },
    {
      "section": "caching_and_secrets",
      "check": "no_secret_appeared_in_logs_or_artifacts",
      "status": "pass",
      "evidence": "quality gate: no secret ever appears in logs or artifacts"
    },
    {
      "section": "budget_awareness",
      "check": "monthly_minutes_matches_per_run_times_runs",
      "status": "pass",
      "evidence": "method step 5: the declared monthly minutes equal the declared estimated minutes per run multiplied by the declared runs per month"
    },
    {
      "section": "budget_awareness",
      "check": "monthly_minutes_within_declared_budget",
      "status": "pass",
      "evidence": "method step 5: the re-derived monthly minutes do not exceed the monthly minutes budget the caller itself declares (the skill states no budget number, so none is imposed here)"
    },
    {
      "section": "budget_awareness",
      "check": "workflows_minimal_where_minutes_constrained",
      "status": "pass",
      "evidence": "method step 5: workflows are kept minimal where minutes are constrained"
    },
    {
      "section": "budget_awareness",
      "check": "heavy_builds_on_owned_hardware",
      "status": "pass",
      "evidence": "method step 5: heavy builds run on owned hardware"
    },
    {
      "section": "budget_awareness",
      "check": "pipeline_does_not_duplicate_primary_gate",
      "status": "pass",
      "evidence": "method step 5: the pipeline does not duplicate the primary gate"
    },
    {
      "section": "provenance_and_signing",
      "check": "artifact_checksums_published",
      "status": "pass",
      "evidence": "method step 6: artifacts are published with checksums"
    },
    {
      "section": "provenance_and_signing",
      "check": "releases_signed",
      "status": "pass",
      "evidence": "method step 6: releases are signed"
    },
    {
      "section": "provenance_and_signing",
      "check": "build_outputs_retained",
      "status": "pass",
      "evidence": "method step 6: build outputs are kept"
    },
    {
      "section": "provenance_and_signing",
      "check": "manifest_hashes_retained",
      "status": "pass",
      "evidence": "method step 6: manifest hashes are kept alongside the build outputs"
    },
    {
      "section": "provenance_and_signing",
      "check": "release_artifacts_carry_hash_and_signature",
      "status": "pass",
      "evidence": "quality gate: release artifacts carry hash + signature"
    },
    {
      "section": "deploys_and_gates",
      "check": "hitl_approval_for_deploys",
      "status": "pass",
      "evidence": "method step 7: deploys require HITL approval — humans approve deploys"
    },
    {
      "section": "deploys_and_gates",
      "check": "rollback_path_present",
      "status": "pass",
      "evidence": "method step 7: a rollback path always exists"
    },
    {
      "section": "deploys_and_gates",
      "check": "never_direct_to_prod_from_laptop",
      "status": "pass",
      "evidence": "method step 7: never direct-to-prod from a laptop"
    },
    {
      "section": "deploys_and_gates",
      "check": "gates_not_disabled_to_unblock_merge",
      "status": "pass",
      "evidence": "red line: gates are not disabled to unblock a merge"
    },
    {
      "section": "deploys_and_gates",
      "check": "gate_overrides_logged_with_reason",
      "status": "pass",
      "evidence": "red line: a conscious gate override is logged with its reason"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "stages_evaluated": 6,
  "computed_total_minutes": "13.000000",
  "total_minutes_difference": "0.000000",
  "stated_stages_not_declared": [],
  "computed_monthly_minutes": "1300.000000",
  "monthly_minutes_difference": "0.000000",
  "budget_headroom_minutes": "700.000000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections.",
  "stamp": "CI/CD PIPELINE DESIGN\nentity: service-alpha\nVERDICT: CICD_PIPELINE_READY\n  stages_and_fail_fast         pass\n  determinism_and_pinning      pass\n  caching_and_secrets          pass\n  budget_awareness             pass\n  provenance_and_signing       pass\n  deploys_and_gates            pass\n36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "service-alpha",
  "pipeline": {
    "stages": [
      {
        "name": "lint",
        "minutes": 1.0
      },
      {
        "name": "typecheck",
        "minutes": 2.0
      },
      {
        "name": "test",
        "minutes": 5.0
      },
      {
        "name": "build",
        "minutes": 3.0
      },
      {
        "name": "package_sign",
        "minutes": 1.0
      },
      {
        "name": "publish",
        "minutes": 1.0
      }
    ],
    "declared_total_minutes": 5.0,
    "fails_fast": true,
    "reports_first_real_cause": true,
    "is_primary_green_gate": true
  },
  "determinism": {
    "lockfile_enforced_installs": true,
    "tool_versions_pinned": true,
    "byte_exact_checkouts_where_hashes_matter": true,
    "same_commit_same_artifact_verified": true,
    "third_party_actions_pinned": true,
    "unpinned_third_party_actions_present": true
  },
  "caching": {
    "dependency_cache_keyed_on_lockfile": true,
    "build_cache_keyed_on_lockfile": true,
    "secrets_cached": true,
    "test_fixtures_cached": false
  },
  "secrets": {
    "from_secret_store_only": true,
    "masked_in_logs": true,
    "in_artifacts": true,
    "error_output_scrubbed": true,
    "appeared_in_logs_or_artifacts": true
  },
  "budget": {
    "estimated_minutes_per_run": 10.0,
    "runs_per_month": 10,
    "declared_monthly_minutes": 50.0,
    "monthly_minutes_budget": 20.0,
    "workflows_minimal_where_constrained": true,
    "heavy_builds_on_owned_hardware": true,
    "duplicates_primary_gate": true
  },
  "provenance": {
    "checksums_published": true,
    "releases_signed": true,
    "build_outputs_retained": true,
    "manifest_hashes_retained": true,
    "release_artifacts_carry_hash_and_signature": true
  },
  "deploys": {
    "hitl_approval_required": true,
    "rollback_path_present": true,
    "direct_to_prod_from_laptop": true
  },
  "gates": {
    "disabled_to_unblock_merge": true,
    "overrides_logged_with_reason": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "cicd-pipeline-design",
  "atom_version": "0.1.0",
  "entity": "service-alpha",
  "verdict": "CICD_PIPELINE_NOT_READY",
  "sections": {
    "stages_and_fail_fast": "fail",
    "determinism_and_pinning": "fail",
    "caching_and_secrets": "fail",
    "budget_awareness": "fail",
    "provenance_and_signing": "pass",
    "deploys_and_gates": "fail"
  },
  "checks": [
    {
      "section": "stages_and_fail_fast",
      "check": "stage_entries_complete",
      "status": "pass",
      "evidence": "every stage entry carries a non-empty name and numeric minutes"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "stage_order_matches_stated_sequence",
      "status": "pass",
      "evidence": "method step 1: the declared stage names equal the stated sequence in order — lint, typecheck, test, build, package/sign, publish (cheapest first)"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "total_minutes_matches_sum_of_stage_minutes",
      "status": "fail",
      "evidence": "the declared total pipeline minutes equal the sum of the declared per-stage minutes"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "pipeline_fails_fast",
      "status": "pass",
      "evidence": "quality gate: the pipeline fails fast — the cheapest stages run first and stop the run on the first failure"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "first_real_cause_reported",
      "status": "pass",
      "evidence": "quality gate: the pipeline reports the first real cause of a failure"
    },
    {
      "section": "stages_and_fail_fast",
      "check": "pipeline_is_primary_green_gate",
      "status": "pass",
      "evidence": "the pipeline is the primary green gate — humans approve deploys, the pipeline gates the merge"
    },
    {
      "section": "determinism_and_pinning",
      "check": "lockfile_enforced_installs",
      "status": "pass",
      "evidence": "method step 2: installs are lockfile-enforced (frozen-lockfile)"
    },
    {
      "section": "determinism_and_pinning",
      "check": "tool_versions_pinned",
      "status": "pass",
      "evidence": "method step 2: tool versions are pinned"
    },
    {
      "section": "determinism_and_pinning",
      "check": "byte_exact_checkouts_where_hashes_matter",
      "status": "pass",
      "evidence": "method step 2: checkouts are byte-exact where hashes matter"
    },
    {
      "section": "determinism_and_pinning",
      "check": "same_commit_produces_same_artifact",
      "status": "pass",
      "evidence": "quality gate: the same commit produces the same artifact — determinism is verified, not assumed"
    },
    {
      "section": "determinism_and_pinning",
      "check": "third_party_actions_pinned",
      "status": "pass",
      "evidence": "red line: third-party actions are pinned to versions"
    },
    {
      "section": "determinism_and_pinning",
      "check": "no_unpinned_third_party_actions",
      "status": "fail",
      "evidence": "red line: no unpinned third-party actions are present in the pipeline"
    },
    {
      "section": "caching_and_secrets",
      "check": "dependency_cache_keyed_on_lockfile",
      "status": "pass",
      "evidence": "method step 3: the dependency cache is keyed on the lockfile"
    },
    {
      "section": "caching_and_secrets",
      "check": "build_cache_keyed_on_lockfile",
      "status": "pass",
      "evidence": "method step 3: the build cache is keyed on the lockfile"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_not_cached",
      "status": "fail",
      "evidence": "method step 3: secrets are never cached"
    },
    {
      "section": "caching_and_secrets",
      "check": "test_fixtures_not_cached",
      "status": "pass",
      "evidence": "method step 3: test fixtures are never cached"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_from_secret_store_only",
      "status": "pass",
      "evidence": "method step 4: secrets come from the secret store only"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_masked_in_logs",
      "status": "pass",
      "evidence": "method step 4: secrets are masked in logs"
    },
    {
      "section": "caching_and_secrets",
      "check": "secrets_never_in_artifacts",
      "status": "fail",
      "evidence": "method step 4: secrets never appear in artifacts"
    },
    {
      "section": "caching_and_secrets",
      "check": "error_output_scrubbed",
      "status": "pass",
      "evidence": "method step 4: error output is scrubbed of secrets"
    },
    {
      "section": "caching_and_secrets",
      "check": "no_secret_appeared_in_logs_or_artifacts",
      "status": "fail",
      "evidence": "quality gate: no secret ever appears in logs or artifacts"
    },
    {
      "section": "budget_awareness",
      "check": "monthly_minutes_matches_per_run_times_runs",
      "status": "fail",
      "evidence": "method step 5: the declared monthly minutes equal the declared estimated minutes per run multiplied by the declared runs per month"
    },
    {
      "section": "budget_awareness",
      "check": "monthly_minutes_within_declared_budget",
      "status": "fail",
      "evidence": "method step 5: the re-derived monthly minutes do not exceed the monthly minutes budget the caller itself declares (the skill states no budget number, so none is imposed here)"
    },
    {
      "section": "budget_awareness",
      "check": "workflows_minimal_where_minutes_constrained",
      "status": "pass",
      "evidence": "method step 5: workflows are kept minimal where minutes are constrained"
    },
    {
      "section": "budget_awareness",
      "check": "heavy_builds_on_owned_hardware",
      "status": "pass",
      "evidence": "method step 5: heavy builds run on owned hardware"
    },
    {
      "section": "budget_awareness",
      "check": "pipeline_does_not_duplicate_primary_gate",
      "status": "fail",
      "evidence": "method step 5: the pipeline does not duplicate the primary gate"
    },
    {
      "section": "provenance_and_signing",
      "check": "artifact_checksums_published",
      "status": "pass",
      "evidence": "method step 6: artifacts are published with checksums"
    },
    {
      "section": "provenance_and_signing",
      "check": "releases_signed",
      "status": "pass",
      "evidence": "method step 6: releases are signed"
    },
    {
      "section": "provenance_and_signing",
      "check": "build_outputs_retained",
      "status": "pass",
      "evidence": "method step 6: build outputs are kept"
    },
    {
      "section": "provenance_and_signing",
      "check": "manifest_hashes_retained",
      "status": "pass",
      "evidence": "method step 6: manifest hashes are kept alongside the build outputs"
    },
    {
      "section": "provenance_and_signing",
      "check": "release_artifacts_carry_hash_and_signature",
      "status": "pass",
      "evidence": "quality gate: release artifacts carry hash + signature"
    },
    {
      "section": "deploys_and_gates",
      "check": "hitl_approval_for_deploys",
      "status": "pass",
      "evidence": "method step 7: deploys require HITL approval — humans approve deploys"
    },
    {
      "section": "deploys_and_gates",
      "check": "rollback_path_present",
      "status": "pass",
      "evidence": "method step 7: a rollback path always exists"
    },
    {
      "section": "deploys_and_gates",
      "check": "never_direct_to_prod_from_laptop",
      "status": "fail",
      "evidence": "method step 7: never direct-to-prod from a laptop"
    },
    {
      "section": "deploys_and_gates",
      "check": "gates_not_disabled_to_unblock_merge",
      "status": "fail",
      "evidence": "red line: gates are not disabled to unblock a merge"
    },
    {
      "section": "deploys_and_gates",
      "check": "gate_overrides_logged_with_reason",
      "status": "pass",
      "evidence": "red line: a conscious gate override is logged with its reason"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "stages_evaluated": 6,
  "computed_total_minutes": "13.000000",
  "total_minutes_difference": "-8.000000",
  "stated_stages_not_declared": [],
  "computed_monthly_minutes": "100.000000",
  "monthly_minutes_difference": "-50.000000",
  "budget_headroom_minutes": "-80.000000",
  "summary": "26 pass, 10 fail, 0 missing of 36 checks across six sections.",
  "stamp": "CI/CD PIPELINE DESIGN\nentity: service-alpha\nVERDICT: CICD_PIPELINE_NOT_READY\n  stages_and_fail_fast         fail\n  determinism_and_pinning      fail\n  caching_and_secrets          fail\n  budget_awareness             fail\n  provenance_and_signing       pass\n  deploys_and_gates            fail\n26 pass, 10 fail, 0 missing of 36 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "pipeline": "this-should-be-an-object"
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline",
  "detail": "pipeline must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 36 / 36 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 40 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom audits a declared CI/CD pipeline artifact for completeness and internal consistency; its verdict is an engineering readiness judgment, not compliance or audit evidence, and CI/CD pipeline design is not a regulated domain (finance, security, licensing, privacy).
