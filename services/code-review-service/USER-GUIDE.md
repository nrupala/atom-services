# Code review service — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a code-review record — a PR's size and description, its review checklist coverage, its comment labels and answers, its approval gates and its merge discipline. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CODE_REVIEW_READY**, **CODE_REVIEW_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not read a diff, open a repository, run CI, or judge whether the code is correct, secure or readable. Computed checks: the declared changed-line count must be at or under the skill's stated aim of ~400 lines; the declared checklist coverage must contain all five stated categories — `correctness`, `security`, `tests`, `readability`, `docs`; every declared comment must be labeled (labeled count equals total) and answered (answered count equals total); a non-trivial change needs at least one reviewer; unresolved comments at approval must be zero; a behavior-changing PR must update docs + changelog; an emergency hotfix must get post-review. No test-coverage percentage, turnaround SLA, comment-volume cap, or reviewer-seniority rule is imposed — the skill states none. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "code-review-service"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/code-review-service` — tool name `code_review_service`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/code-review-service` — body = the manifest object; same `Authorization` header.

## Input — the code-review-service manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `pr.changed_lines` (number) | computed: must be at or under the stated aim of 400; reported as `computed_changed_lines` and `changed_lines_over_stated_aim` (declared minus 400, 6 decimal places) |
| `pr.description_what_present` / `description_why_present` / `description_how_to_test_present` / `spec_or_issue_linked` / `screenshots_included_for_ui_changes` | PR description evidence (what / why / how-to-test, spec or issue link, screenshots for UI changes) |
| `checklist.covered_items` (list of strings) | computed: must contain all five stated entries — `correctness`, `security`, `tests`, `readability`, `docs`; unknown entries do not count; omitted stated entries reported as `checklist_items_not_covered` |
| `checklist.correctness_edge_cases_checked` / `security_inputs_secrets_dependencies_checked` / `tests_coverage_and_determinism_checked` / `readability_names_and_structure_checked` | checklist evidence |
| `feedback.total_comments` (number), `feedback.labeled_comments` (number) | computed: labeled must equal total; reported as `labeled_comment_difference` (labeled minus total, 6 decimal places) |
| `feedback.labels_use_must_nit_q_scheme` / `why_explained` / `proposes_not_dictates` | feedback etiquette evidence (`must:` / `nit:` / `q:` labels, why explained, proposes not dictates) |
| `resolution.total_comments` (number), `resolution.answered_comments` (number) | computed: answered must equal total; reported as `answered_comment_difference` (answered minus total, 6 decimal places) |
| `resolution.resolved_only_when_addressed` / `resolved_nits_not_relitigated` | resolution evidence |
| `gates.ci_green_before_approval` | CI green before approval |
| `gates.change_nontrivial` (boolean), `gates.reviewer_count` (number) | computed gate: when the change is non-trivial, reviewer count must be at least 1 (a trivial change is not held to this gate); reported as `computed_reviewer_count` |
| `gates.reviewer_sign_off_recorded` | reviewer sign-off evidence |
| `gates.unresolved_comments` (number) | computed: must be zero at approval; reported as `computed_unresolved_comments` |
| `gates.behavior_changing` (boolean), `gates.docs_and_changelog_updated` | computed gate: when the PR changes behavior, docs + changelog must be updated (a non-behavior-changing PR is not held to this gate) |
| `gates.approver_would_ship` | approver would ship it |
| `red_lines.force_push_over_review_without_telling` / `rubber_stamped` / `unexplained_blocking` | must be `false` to pass (skill red lines) |
| `merge.self_merged_unreviewed` | must be `false` to pass |
| `merge.emergency_hotfix` (boolean), `merge.hotfix_post_review_completed` | computed gate: when the change is an emergency hotfix, its post-review must be completed (a non-hotfix is not held to this gate) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CODE_REVIEW_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/code-review-service`:

```json
{
  "entity": "PR-123",
  "pr": {
    "changed_lines": 300,
    "description_what_present": true,
    "description_why_present": true,
    "description_how_to_test_present": true,
    "spec_or_issue_linked": true,
    "screenshots_included_for_ui_changes": true
  },
  "checklist": {
    "covered_items": [
      "correctness",
      "security",
      "tests",
      "readability",
      "docs"
    ],
    "correctness_edge_cases_checked": true,
    "security_inputs_secrets_dependencies_checked": true,
    "tests_coverage_and_determinism_checked": true,
    "readability_names_and_structure_checked": true
  },
  "feedback": {
    "total_comments": 2,
    "labeled_comments": 2,
    "labels_use_must_nit_q_scheme": true,
    "why_explained": true,
    "proposes_not_dictates": true
  },
  "resolution": {
    "total_comments": 2,
    "answered_comments": 2,
    "resolved_only_when_addressed": true,
    "resolved_nits_not_relitigated": true
  },
  "gates": {
    "ci_green_before_approval": true,
    "change_nontrivial": true,
    "reviewer_count": 1,
    "reviewer_sign_off_recorded": true,
    "unresolved_comments": 0,
    "behavior_changing": true,
    "docs_and_changelog_updated": true,
    "approver_would_ship": true
  },
  "red_lines": {
    "force_push_over_review_without_telling": false,
    "rubber_stamped": false,
    "unexplained_blocking": false
  },
  "merge": {
    "self_merged_unreviewed": false,
    "emergency_hotfix": false,
    "hotfix_post_review_completed": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 29 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "computed_changed_lines": "300.000000",
  "changed_lines_over_stated_aim": "-100.000000",
  "checklist_items_not_covered": [],
  "labeled_comment_difference": "0.000000",
  "answered_comment_difference": "0.000000",
  "computed_reviewer_count": "1.000000",
  "computed_unresolved_comments": "0.000000",
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

## Verdicts

- **CODE_REVIEW_READY** — every check passes; the review record is complete and internally consistent on the declared evidence.
- **CODE_REVIEW_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_changed_lines` and `changed_lines_over_stated_aim`, `checklist_items_not_covered` (omitted stated checklist entries, or null when no list is declared), `labeled_comment_difference` and `answered_comment_difference`, `computed_reviewer_count` and `computed_unresolved_comments` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
