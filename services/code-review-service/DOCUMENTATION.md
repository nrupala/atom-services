# Code review service — `code-review-service`

**Display name:** Code review service · **Slug:** `code-review-service` · **Deliverable type:** REVIEW · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "code-review-service"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "PR-123" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/code-review-service` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `CODE_REVIEW_READY` — 29 pass, 0 fail, 0 missing of 29 checks across six sections. Recorded computed values: `answered_comment_difference` = `"0.000000"`; `changed_lines_over_stated_aim` = `"-100.000000"`; `checklist_items_not_covered` = `[]`; `computed_changed_lines` = `"300.000000"`; `computed_reviewer_count` = `"1.000000"`; `computed_status` = `"within_stated_limits_on_declared_evidence"`; `computed_unresolved_comments` = `"0.000000"`; `labeled_comment_difference` = `"0.000000"`.
   Why it passes, in the tester's recorded words: All 29 checks pass: changed_lines 300 <= 400 (over -100), checklist covers all five stated items, labeled 2/2, answered 2/2, nontrivial with 1 reviewer, 0 unresolved, behavior-changing with docs updated, hotfix gate passes (non-hotfix), all red lines false.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "code-review-service"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/code-review-service` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/code-review-service` with the same `Authorization: Bearer <key>` header and call the tool `code_review_service` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `CODE_REVIEW_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 29 missing of 29 checks across six sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `CODE_REVIEW_NOT_READY` — 21 pass, 8 fail, 0 missing of 29 checks across six sections. The failing checks were exactly: `pr_size_within_stated_aim`, `checklist_items_cover_stated_checklist`, `feedback_comments_all_labeled`, `authors_answer_every_comment`, `at_least_one_reviewer_for_nontrivial_change`, `no_unresolved_comments_before_approval`, `no_force_push_over_review_without_telling`, `no_self_merged_unreviewed_work`. Recorded case notes: Full manifest with exactly 8 planted violations: changed_lines 500 > 400 (over 100); covered_items only [correctness] so security/tests/readability/docs not covered; labeled 3 vs total 5 (diff -2); answered 2 vs total 5 (diff -3); nontrivial with reviewer_count 0; unresolved_comments 2; force_push_over_review_without_telling true; self_merged_unreviewed true. All other fields pass (hotfix gate passes: non-hotfix).
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `pr.changed_lines` with detail "pr.changed_lines must be a number" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/code-review-service` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/code-review-service` — tool name `code_review_service`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `pr.changed_lines` | number | pr_size_and_description | number; computed, see below |
| `pr.description_what_present` | boolean | pr_size_and_description |  |
| `pr.description_why_present` | boolean | pr_size_and_description |  |
| `pr.description_how_to_test_present` | boolean | pr_size_and_description |  |
| `pr.spec_or_issue_linked` | boolean | pr_size_and_description |  |
| `pr.screenshots_included_for_ui_changes` | boolean | pr_size_and_description |  |
| `checklist.covered_items` | list of strings | review_checklist | list of strings; computed, see below |
| `checklist.correctness_edge_cases_checked` | boolean | review_checklist |  |
| `checklist.security_inputs_secrets_dependencies_checked` | boolean | review_checklist |  |
| `checklist.tests_coverage_and_determinism_checked` | boolean | review_checklist |  |
| `checklist.readability_names_and_structure_checked` | boolean | review_checklist |  |
| `feedback.total_comments` | number | feedback_etiquette | number; computed, see below |
| `feedback.labeled_comments` | number | feedback_etiquette | number; computed, see below |
| `feedback.labels_use_must_nit_q_scheme` | boolean | feedback_etiquette |  |
| `feedback.why_explained` | boolean | feedback_etiquette |  |
| `feedback.proposes_not_dictates` | boolean | feedback_etiquette |  |
| `resolution.total_comments` | number | response_and_resolution | number; computed, see below |
| `resolution.answered_comments` | number | response_and_resolution | number; computed, see below |
| `resolution.resolved_only_when_addressed` | boolean | response_and_resolution |  |
| `resolution.resolved_nits_not_relitigated` | boolean | response_and_resolution |  |
| `gates.ci_green_before_approval` | boolean | approval_gates |  |
| `gates.change_nontrivial` | boolean | approval_gates | boolean; computed gate input, see below — `true` = the change is non-trivial, `false` = trivial |
| `gates.reviewer_count` | number | approval_gates | number; computed, see below |
| `gates.reviewer_sign_off_recorded` | boolean | approval_gates |  |
| `gates.unresolved_comments` | number | approval_gates | number; computed, see below |
| `gates.behavior_changing` | boolean | approval_gates | boolean; computed gate input, see below — `true` = the PR changes behavior, `false` = it does not |
| `gates.docs_and_changelog_updated` | boolean | approval_gates |  |
| `gates.approver_would_ship` | boolean | approval_gates |  |
| `red_lines.force_push_over_review_without_telling` | boolean | red_lines_and_merge_discipline | must be `false` to pass — skill red line |
| `red_lines.rubber_stamped` | boolean | red_lines_and_merge_discipline | must be `false` to pass — skill red line |
| `red_lines.unexplained_blocking` | boolean | red_lines_and_merge_discipline | must be `false` to pass — skill red line |
| `merge.self_merged_unreviewed` | boolean | red_lines_and_merge_discipline | must be `false` to pass — skill when-to-use rule |
| `merge.emergency_hotfix` | boolean | red_lines_and_merge_discipline | boolean; computed gate input, see below — `true` = the change is an emergency hotfix, `false` = it is not |
| `merge.hotfix_post_review_completed` | boolean | red_lines_and_merge_discipline |  |

### Checks

All 29 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `pr_size_and_description` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `pr_size_within_stated_aim` | method step 1: the declared changed-line count is at or under the aim the skill names — keep PRs small (aim <= ~400 changed lines) |
| `pr_description_what_present` | method step 2: the PR description states what changed |
| `pr_description_why_present` | method step 2: the PR description states why the change was made |
| `pr_description_how_to_test_present` | method step 2: the PR description states how-to-test |
| `spec_or_issue_linked` | method step 2: the PR description links the spec or issue |
| `screenshots_included_for_ui_changes` | method step 2: screenshots are included for UI changes |

#### Section: `review_checklist` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `checklist_items_cover_stated_checklist` | method step 3: the declared covered checklist items cover every category the skill names — correctness, security, tests, readability, docs |
| `correctness_edge_cases_checked` | method step 3: correctness is checked — logic, edge cases |
| `security_inputs_secrets_dependencies_checked` | method step 3: security is checked — inputs, secrets, dependencies |
| `tests_coverage_and_determinism_checked` | method step 3: tests are checked — coverage, determinism |
| `readability_names_and_structure_checked` | method step 3: readability is checked — names, structure |

#### Section: `feedback_etiquette` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `feedback_comments_all_labeled` | method step 4: the declared labeled-comment count equals the declared total comment count — every comment carries a must:/nit:/q: label |
| `labels_use_must_nit_q_scheme` | method step 4: comments are labeled must: (blocking), nit: (non-blocking), q: (question) |
| `feedback_why_explained` | method step 4: feedback explains the why |
| `feedback_proposes_not_dictates` | method step 4: feedback proposes, it does not dictate |

#### Section: `response_and_resolution` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `authors_answer_every_comment` | method step 5: the declared answered-comment count equals the declared total comment count — authors answer every comment |
| `comments_resolved_only_when_addressed` | method step 5: comments are resolved only when addressed |
| `resolved_nits_not_relitigated` | method step 5: resolved nits are never re-litigated |

#### Section: `approval_gates` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `ci_green_before_approval` | quality gate: CI is green before approval — red means no merge |
| `at_least_one_reviewer_for_nontrivial_change` | quality gate: a non-trivial change has at least one reviewer (a declared trivial change is not held to this gate by the skill) |
| `reviewer_sign_off_recorded` | method step 6: reviewer sign-off is recorded before approval |
| `no_unresolved_comments_before_approval` | method step 6: the declared unresolved-comment count at approval is zero — approval gates require resolved comments |
| `docs_and_changelog_updated_for_behavior_changing_change` | quality gate: a behavior-changing PR updates docs + changelog (a declared non-behavior-changing change is not held to this gate by the skill) |
| `approver_would_ship` | method step 6: the approver approves only what they would ship |

#### Section: `red_lines_and_merge_discipline` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `no_force_push_over_review_without_telling` | red line: no force-push over someone else's review without telling them |
| `no_rubber_stamping` | red line: no rubber-stamping |
| `no_unexplained_blocking` | red line: no unexplained blocking |
| `no_self_merged_unreviewed_work` | when to use: no self-merged unreviewed work — every change is reviewed before merge |
| `emergency_hotfix_post_reviewed_if_applicable` | when to use: an emergency hotfix gets post-review (a declared non-hotfix is not held to this gate by the skill) |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`code-review-service`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 29 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `computed_changed_lines` — Computed/reported field; recorded full-pass value: `"300.000000"`.
- `changed_lines_over_stated_aim` — Computed/reported field; recorded full-pass value: `"-100.000000"`.
- `checklist_items_not_covered` — Computed/reported field; recorded full-pass value: `[]`.
- `labeled_comment_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `answered_comment_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_reviewer_count` — Computed/reported field; recorded full-pass value: `"1.000000"`.
- `computed_unresolved_comments` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `computed_changed_lines` and `changed_lines_over_stated_aim`, `checklist_items_not_covered` (omitted stated checklist entries, or null when no list is declared), `labeled_comment_difference` and `answered_comment_difference`, `computed_reviewer_count` and `computed_unresolved_comments` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `CODE_REVIEW_READY` — every check passes; the review record is complete and internally consistent on the declared evidence.
- `CODE_REVIEW_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `computed_changed_lines` — reported as in the recorded responses (full-pass value `"300.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `changed_lines_over_stated_aim` — reported as in the recorded responses (full-pass value `"-100.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `checklist_items_not_covered` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `labeled_comment_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `answered_comment_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_reviewer_count` — reported as in the recorded responses (full-pass value `"1.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_unresolved_comments` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "pr.changed_lines", "detail": "pr.changed_lines must be a number"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a code-review record — a PR's size and description, its review checklist coverage, its comment labels and answers, its approval gates and its merge discipline. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CODE_REVIEW_READY**, **CODE_REVIEW_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not read a diff, open a repository, run CI, or judge whether the code is correct, secure or readable. Computed checks: the declared changed-line count must be at or under the skill's stated aim of ~400 lines; the declared checklist coverage must contain all five stated categories — `correctness`, `security`, `tests`, `readability`, `docs`; every declared comment must be labeled (labeled count equals total) and answered (answered count equals total); a non-trivial change needs at least one reviewer; unresolved comments at approval must be zero; a behavior-changing PR must update docs + changelog; an emergency hotfix must get post-review. No test-coverage percentage, turnaround SLA, comment-volume cap, or reviewer-seniority rule is imposed — the skill states none. Same manifest in → same verdict out.

**Computed checks.** Eight checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **PR size:** the skill's method step 1 is "keep PRs small (aim ≤ ~400 changed lines)". The declared `pr.changed_lines` therefore passes only when it is at or under 400 — the number the skill itself names. The output reports `computed_changed_lines` and `changed_lines_over_stated_aim` (declared minus 400, null when no count is declared).
- **Checklist coverage:** the skill's method step 3 names the checklist categories — correctness, security, tests, readability, docs. The declared `checklist.covered_items` list therefore passes only when it contains all five stated entries (`correctness`, `security`, `tests`, `readability`, `docs`); unknown entries do not count toward coverage. A missing list is missing evidence; an empty list is present and fails. The output reports the omitted stated entries as `checklist_items_not_covered` (null when no list is declared). Entries are validated as strings only, never enum-checked — coverage is a verdict check, not a type error.
- **Feedback labels:** the skill's method step 4 requires comments to be labeled (`must:` blocking, `nit:` non-blocking, `q:` question). The declared `feedback.labeled_comments` therefore passes only when it equals `feedback.total_comments`. The output reports `labeled_comment_difference` (labeled minus total, null when either cannot be computed). Whether any individual comment's label is the *right* label is the reviewer's judgment, not this atom's.
- **Responses:** the skill's method step 5 requires authors to answer every comment. The declared `resolution.answered_comments` therefore passes only when it equals `resolution.total_comments`. The output reports `answered_comment_difference` (answered minus total, null when either cannot be computed). The feedback and resolution totals are separate declared records; this core does not cross-check one section's total against the other's.
- **Reviewers:** the skill's quality gate is "at least one reviewer for non-trivial changes". When `gates.change_nontrivial` is declared `true`, the check passes only when `gates.reviewer_count` is at least 1; when it is declared `false`, the skill does not hold the change to that gate and the check passes regardless of reviewer count. The check is missing when either input is absent. The output reports `computed_reviewer_count` (null when no count is declared). No reviewer seniority, identity, or count above one is imposed — the skill states none.
- **Unresolved comments at approval:** the skill's method step 6 approval gates are "green CI + resolved comments + reviewer sign-off". The declared `gates.unresolved_comments` therefore passes only when it is zero. The output reports `computed_unresolved_comments` (null when no count is declared).
- **Docs for behavior changes:** the skill's quality gate is "behavior-changing PRs update docs + changelog". When `gates.behavior_changing` is declared `true`, the check passes only when `gates.docs_and_changelog_updated` is declared `true`; when it is declared `false`, the skill does not hold the change to that gate and the check passes regardless. The check is missing when either input is absent.
- **Hotfix post-review:** the skill's when-to-use rule is "emergency hotfixes get post-review". When `merge.emergency_hotfix` is declared `true`, the check passes only when `merge.hotfix_post_review_completed` is declared `true`; when it is declared `false`, the check passes regardless. The check is missing when either input is absent.

**Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `CODE_REVIEW_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `CODE_REVIEW_READY`. The verdict is one of `CODE_REVIEW_READY` (all 29 checks pass), `CODE_REVIEW_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across six sections: pr_size_and_description, review_checklist, feedback_etiquette, response_and_resolution, approval_gates, red_lines_and_merge_discipline.

**What it does NOT do.**

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** code-review record — it does not read a diff, open a repository, run CI, verify that a declared value is true, or judge the underlying code. The artifact declares its own size, checklist coverage, comment counts, dispositions and gates, and this core checks only their internal consistency and the completeness of the skill's method on the declared evidence. An artifact is ready *on the caller's declared evidence* even if the underlying code is poor. It is a completeness and consistency audit, **not a code review**: it never decides whether the code is correct, secure, readable or well tested, whether a comment was rightly blocking or a nit, or whether the change should actually merge.

**Thresholds declined — named explicitly.** The skill states no number for these, so this atom imposes none, and any future imposition must land in the skill first:

- **Test-coverage percentage:** the skill requires tests to be checked for coverage and determinism but states no percentage (no 80%, or any other figure, is imposed).
- **Review turnaround / response time:** no SLA, review-age or time-to-approval limit is imposed — the skill states none.
- **Comment volume:** no minimum or maximum comment count, no cap on `nit:` comments, and no minimum number of blocking findings is imposed — only that declared comments are all labeled and all answered.
- **Reviewer seniority or count above one:** no staff/principal reviewer, code-owner, or two-reviewer requirement is imposed beyond the skill's stated at-least-one for non-trivial changes.
- **Split quality for large PRs:** beyond the skill's stated ~400-line aim, no judgment is made about whether a large change was split *logically* — that is a review judgment over the actual change, which this atom never sees.
- **Screenshot count or form for UI changes:** only the declared presence is checked; no number, format or before/after pairing is imposed.
- **CI specifics:** no required CI duration, flake rate, job list or pipeline shape is imposed — only the declared green-before-approval gate.
- **Finding severity thresholds:** no per-severity finding counts (critical/high/medium/low) are declared or judged — the skill's vocabulary is its `must:`/`nit:`/`q:` labels, and only their declared coverage is checked.

Named exclusions: no reading or reviewing of actual code or diffs; no verification of any declared line count, comment, approval or CI result; no correctness, security, readability or test-quality judgment; no merge, approval or force-push action on any repository.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this review on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **PR reviews before merge**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/code_review_service.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_code_review_service.py` — 50 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/code-review-service` and MCP `POST /mcp/code-review-service` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:44.355286+00:00 against gateway v1.1.0, external verification lane, source `verification/work/code-review-service/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "checklist": {
    "correctness_edge_cases_checked": true,
    "covered_items": [
      "correctness",
      "security",
      "tests",
      "readability",
      "docs"
    ],
    "readability_names_and_structure_checked": true,
    "security_inputs_secrets_dependencies_checked": true,
    "tests_coverage_and_determinism_checked": true
  },
  "entity": "PR-123",
  "feedback": {
    "labeled_comments": 2,
    "labels_use_must_nit_q_scheme": true,
    "proposes_not_dictates": true,
    "total_comments": 2,
    "why_explained": true
  },
  "gates": {
    "approver_would_ship": true,
    "behavior_changing": true,
    "change_nontrivial": true,
    "ci_green_before_approval": true,
    "docs_and_changelog_updated": true,
    "reviewer_count": 1,
    "reviewer_sign_off_recorded": true,
    "unresolved_comments": 0
  },
  "merge": {
    "emergency_hotfix": false,
    "hotfix_post_review_completed": true,
    "self_merged_unreviewed": false
  },
  "pr": {
    "changed_lines": 300,
    "description_how_to_test_present": true,
    "description_what_present": true,
    "description_why_present": true,
    "screenshots_included_for_ui_changes": true,
    "spec_or_issue_linked": true
  },
  "red_lines": {
    "force_push_over_review_without_telling": false,
    "rubber_stamped": false,
    "unexplained_blocking": false
  },
  "resolution": {
    "answered_comments": 2,
    "resolved_nits_not_relitigated": true,
    "resolved_only_when_addressed": true,
    "total_comments": 2
  }
}
```

Response (`response_text`):

```json
{
  "service": "code-review-service",
  "atom_version": "0.1.0",
  "entity": "PR-123",
  "verdict": "CODE_REVIEW_READY",
  "sections": {
    "pr_size_and_description": "pass",
    "review_checklist": "pass",
    "feedback_etiquette": "pass",
    "response_and_resolution": "pass",
    "approval_gates": "pass",
    "red_lines_and_merge_discipline": "pass"
  },
  "checks": [
    {
      "section": "pr_size_and_description",
      "check": "pr_size_within_stated_aim",
      "status": "pass",
      "evidence": "method step 1: the declared changed-line count is at or under the aim the skill names — keep PRs small (aim <= ~400 changed lines)"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_what_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states what changed"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_why_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states why the change was made"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_how_to_test_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states how-to-test"
    },
    {
      "section": "pr_size_and_description",
      "check": "spec_or_issue_linked",
      "status": "pass",
      "evidence": "method step 2: the PR description links the spec or issue"
    },
    {
      "section": "pr_size_and_description",
      "check": "screenshots_included_for_ui_changes",
      "status": "pass",
      "evidence": "method step 2: screenshots are included for UI changes"
    },
    {
      "section": "review_checklist",
      "check": "checklist_items_cover_stated_checklist",
      "status": "pass",
      "evidence": "method step 3: the declared covered checklist items cover every category the skill names — correctness, security, tests, readability, docs"
    },
    {
      "section": "review_checklist",
      "check": "correctness_edge_cases_checked",
      "status": "pass",
      "evidence": "method step 3: correctness is checked — logic, edge cases"
    },
    {
      "section": "review_checklist",
      "check": "security_inputs_secrets_dependencies_checked",
      "status": "pass",
      "evidence": "method step 3: security is checked — inputs, secrets, dependencies"
    },
    {
      "section": "review_checklist",
      "check": "tests_coverage_and_determinism_checked",
      "status": "pass",
      "evidence": "method step 3: tests are checked — coverage, determinism"
    },
    {
      "section": "review_checklist",
      "check": "readability_names_and_structure_checked",
      "status": "pass",
      "evidence": "method step 3: readability is checked — names, structure"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_comments_all_labeled",
      "status": "pass",
      "evidence": "method step 4: the declared labeled-comment count equals the declared total comment count — every comment carries a must:/nit:/q: label"
    },
    {
      "section": "feedback_etiquette",
      "check": "labels_use_must_nit_q_scheme",
      "status": "pass",
      "evidence": "method step 4: comments are labeled must: (blocking), nit: (non-blocking), q: (question)"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_why_explained",
      "status": "pass",
      "evidence": "method step 4: feedback explains the why"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_proposes_not_dictates",
      "status": "pass",
      "evidence": "method step 4: feedback proposes, it does not dictate"
    },
    {
      "section": "response_and_resolution",
      "check": "authors_answer_every_comment",
      "status": "pass",
      "evidence": "method step 5: the declared answered-comment count equals the declared total comment count — authors answer every comment"
    },
    {
      "section": "response_and_resolution",
      "check": "comments_resolved_only_when_addressed",
      "status": "pass",
      "evidence": "method step 5: comments are resolved only when addressed"
    },
    {
      "section": "response_and_resolution",
      "check": "resolved_nits_not_relitigated",
      "status": "pass",
      "evidence": "method step 5: resolved nits are never re-litigated"
    },
    {
      "section": "approval_gates",
      "check": "ci_green_before_approval",
      "status": "pass",
      "evidence": "quality gate: CI is green before approval — red means no merge"
    },
    {
      "section": "approval_gates",
      "check": "at_least_one_reviewer_for_nontrivial_change",
      "status": "pass",
      "evidence": "quality gate: a non-trivial change has at least one reviewer (a declared trivial change is not held to this gate by the skill)"
    },
    {
      "section": "approval_gates",
      "check": "reviewer_sign_off_recorded",
      "status": "pass",
      "evidence": "method step 6: reviewer sign-off is recorded before approval"
    },
    {
      "section": "approval_gates",
      "check": "no_unresolved_comments_before_approval",
      "status": "pass",
      "evidence": "method step 6: the declared unresolved-comment count at approval is zero — approval gates require resolved comments"
    },
    {
      "section": "approval_gates",
      "check": "docs_and_changelog_updated_for_behavior_changing_change",
      "status": "pass",
      "evidence": "quality gate: a behavior-changing PR updates docs + changelog (a declared non-behavior-changing change is not held to this gate by the skill)"
    },
    {
      "section": "approval_gates",
      "check": "approver_would_ship",
      "status": "pass",
      "evidence": "method step 6: the approver approves only what they would ship"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_force_push_over_review_without_telling",
      "status": "pass",
      "evidence": "red line: no force-push over someone else's review without telling them"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_rubber_stamping",
      "status": "pass",
      "evidence": "red line: no rubber-stamping"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_unexplained_blocking",
      "status": "pass",
      "evidence": "red line: no unexplained blocking"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_self_merged_unreviewed_work",
      "status": "pass",
      "evidence": "when to use: no self-merged unreviewed work — every change is reviewed before merge"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "emergency_hotfix_post_reviewed_if_applicable",
      "status": "pass",
      "evidence": "when to use: an emergency hotfix gets post-review (a declared non-hotfix is not held to this gate by the skill)"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "computed_changed_lines": "300.000000",
  "changed_lines_over_stated_aim": "-100.000000",
  "checklist_items_not_covered": [],
  "labeled_comment_difference": "0.000000",
  "answered_comment_difference": "0.000000",
  "computed_reviewer_count": "1.000000",
  "computed_unresolved_comments": "0.000000",
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections.",
  "stamp": "CODE REVIEW\nentity: PR-123\nVERDICT: CODE_REVIEW_READY\n  pr_size_and_description      pass\n  review_checklist             pass\n  feedback_etiquette           pass\n  response_and_resolution      pass\n  approval_gates               pass\n  red_lines_and_merge_discipline pass\n29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "checklist": {
    "correctness_edge_cases_checked": true,
    "covered_items": [
      "correctness"
    ],
    "readability_names_and_structure_checked": true,
    "security_inputs_secrets_dependencies_checked": true,
    "tests_coverage_and_determinism_checked": true
  },
  "entity": "PR-124",
  "feedback": {
    "labeled_comments": 3,
    "labels_use_must_nit_q_scheme": true,
    "proposes_not_dictates": true,
    "total_comments": 5,
    "why_explained": true
  },
  "gates": {
    "approver_would_ship": true,
    "behavior_changing": true,
    "change_nontrivial": true,
    "ci_green_before_approval": true,
    "docs_and_changelog_updated": true,
    "reviewer_count": 0,
    "reviewer_sign_off_recorded": true,
    "unresolved_comments": 2
  },
  "merge": {
    "emergency_hotfix": false,
    "hotfix_post_review_completed": false,
    "self_merged_unreviewed": true
  },
  "pr": {
    "changed_lines": 500,
    "description_how_to_test_present": true,
    "description_what_present": true,
    "description_why_present": true,
    "screenshots_included_for_ui_changes": true,
    "spec_or_issue_linked": true
  },
  "red_lines": {
    "force_push_over_review_without_telling": true,
    "rubber_stamped": false,
    "unexplained_blocking": false
  },
  "resolution": {
    "answered_comments": 2,
    "resolved_nits_not_relitigated": true,
    "resolved_only_when_addressed": true,
    "total_comments": 5
  }
}
```

Response (`response_text`):

```json
{
  "service": "code-review-service",
  "atom_version": "0.1.0",
  "entity": "PR-124",
  "verdict": "CODE_REVIEW_NOT_READY",
  "sections": {
    "pr_size_and_description": "fail",
    "review_checklist": "fail",
    "feedback_etiquette": "fail",
    "response_and_resolution": "fail",
    "approval_gates": "fail",
    "red_lines_and_merge_discipline": "fail"
  },
  "checks": [
    {
      "section": "pr_size_and_description",
      "check": "pr_size_within_stated_aim",
      "status": "fail",
      "evidence": "method step 1: the declared changed-line count is at or under the aim the skill names — keep PRs small (aim <= ~400 changed lines)"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_what_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states what changed"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_why_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states why the change was made"
    },
    {
      "section": "pr_size_and_description",
      "check": "pr_description_how_to_test_present",
      "status": "pass",
      "evidence": "method step 2: the PR description states how-to-test"
    },
    {
      "section": "pr_size_and_description",
      "check": "spec_or_issue_linked",
      "status": "pass",
      "evidence": "method step 2: the PR description links the spec or issue"
    },
    {
      "section": "pr_size_and_description",
      "check": "screenshots_included_for_ui_changes",
      "status": "pass",
      "evidence": "method step 2: screenshots are included for UI changes"
    },
    {
      "section": "review_checklist",
      "check": "checklist_items_cover_stated_checklist",
      "status": "fail",
      "evidence": "method step 3: the declared covered checklist items cover every category the skill names — correctness, security, tests, readability, docs"
    },
    {
      "section": "review_checklist",
      "check": "correctness_edge_cases_checked",
      "status": "pass",
      "evidence": "method step 3: correctness is checked — logic, edge cases"
    },
    {
      "section": "review_checklist",
      "check": "security_inputs_secrets_dependencies_checked",
      "status": "pass",
      "evidence": "method step 3: security is checked — inputs, secrets, dependencies"
    },
    {
      "section": "review_checklist",
      "check": "tests_coverage_and_determinism_checked",
      "status": "pass",
      "evidence": "method step 3: tests are checked — coverage, determinism"
    },
    {
      "section": "review_checklist",
      "check": "readability_names_and_structure_checked",
      "status": "pass",
      "evidence": "method step 3: readability is checked — names, structure"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_comments_all_labeled",
      "status": "fail",
      "evidence": "method step 4: the declared labeled-comment count equals the declared total comment count — every comment carries a must:/nit:/q: label"
    },
    {
      "section": "feedback_etiquette",
      "check": "labels_use_must_nit_q_scheme",
      "status": "pass",
      "evidence": "method step 4: comments are labeled must: (blocking), nit: (non-blocking), q: (question)"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_why_explained",
      "status": "pass",
      "evidence": "method step 4: feedback explains the why"
    },
    {
      "section": "feedback_etiquette",
      "check": "feedback_proposes_not_dictates",
      "status": "pass",
      "evidence": "method step 4: feedback proposes, it does not dictate"
    },
    {
      "section": "response_and_resolution",
      "check": "authors_answer_every_comment",
      "status": "fail",
      "evidence": "method step 5: the declared answered-comment count equals the declared total comment count — authors answer every comment"
    },
    {
      "section": "response_and_resolution",
      "check": "comments_resolved_only_when_addressed",
      "status": "pass",
      "evidence": "method step 5: comments are resolved only when addressed"
    },
    {
      "section": "response_and_resolution",
      "check": "resolved_nits_not_relitigated",
      "status": "pass",
      "evidence": "method step 5: resolved nits are never re-litigated"
    },
    {
      "section": "approval_gates",
      "check": "ci_green_before_approval",
      "status": "pass",
      "evidence": "quality gate: CI is green before approval — red means no merge"
    },
    {
      "section": "approval_gates",
      "check": "at_least_one_reviewer_for_nontrivial_change",
      "status": "fail",
      "evidence": "quality gate: a non-trivial change has at least one reviewer (a declared trivial change is not held to this gate by the skill)"
    },
    {
      "section": "approval_gates",
      "check": "reviewer_sign_off_recorded",
      "status": "pass",
      "evidence": "method step 6: reviewer sign-off is recorded before approval"
    },
    {
      "section": "approval_gates",
      "check": "no_unresolved_comments_before_approval",
      "status": "fail",
      "evidence": "method step 6: the declared unresolved-comment count at approval is zero — approval gates require resolved comments"
    },
    {
      "section": "approval_gates",
      "check": "docs_and_changelog_updated_for_behavior_changing_change",
      "status": "pass",
      "evidence": "quality gate: a behavior-changing PR updates docs + changelog (a declared non-behavior-changing change is not held to this gate by the skill)"
    },
    {
      "section": "approval_gates",
      "check": "approver_would_ship",
      "status": "pass",
      "evidence": "method step 6: the approver approves only what they would ship"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_force_push_over_review_without_telling",
      "status": "fail",
      "evidence": "red line: no force-push over someone else's review without telling them"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_rubber_stamping",
      "status": "pass",
      "evidence": "red line: no rubber-stamping"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_unexplained_blocking",
      "status": "pass",
      "evidence": "red line: no unexplained blocking"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "no_self_merged_unreviewed_work",
      "status": "fail",
      "evidence": "when to use: no self-merged unreviewed work — every change is reviewed before merge"
    },
    {
      "section": "red_lines_and_merge_discipline",
      "check": "emergency_hotfix_post_reviewed_if_applicable",
      "status": "pass",
      "evidence": "when to use: an emergency hotfix gets post-review (a declared non-hotfix is not held to this gate by the skill)"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "computed_changed_lines": "500.000000",
  "changed_lines_over_stated_aim": "100.000000",
  "checklist_items_not_covered": [
    "security",
    "tests",
    "readability",
    "docs"
  ],
  "labeled_comment_difference": "-2.000000",
  "answered_comment_difference": "-3.000000",
  "computed_reviewer_count": "0.000000",
  "computed_unresolved_comments": "2.000000",
  "summary": "21 pass, 8 fail, 0 missing of 29 checks across six sections.",
  "stamp": "CODE REVIEW\nentity: PR-124\nVERDICT: CODE_REVIEW_NOT_READY\n  pr_size_and_description      fail\n  review_checklist             fail\n  feedback_etiquette           fail\n  response_and_resolution      fail\n  approval_gates               fail\n  red_lines_and_merge_discipline fail\n21 pass, 8 fail, 0 missing of 29 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "pr": {
    "changed_lines": "four-hundred"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pr.changed_lines",
  "detail": "pr.changed_lines must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 29 / 29 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 35 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom audits a declared code-review record; its verdict is an engineering-process readiness judgment, not compliance or audit evidence, and code review is not a regulated domain (finance, security, licensing, privacy).
