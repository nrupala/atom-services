# Buyer-test card — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are working a single idea through a buyer-test / proof-of-concept card. This atom reads one declared buyer-test record — hypothesis, criteria set upfront, timebox and scope, disposition and production boundary, evidence, and decision and findings — and returns one deterministic verdict across six sections: **CARD_COMPLETE**, **CARD_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the declared timebox passes only when the limit is positive, the elapsed time is not negative, and the elapsed time does not exceed the declared limit (no numeric cap is imposed — only the declared numbers are compared); the declared decision must be one of `adopt` / `adapt` / `abandon`; and the declared disposition must be one of `disposable` / `slated_for_hardening`. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "buyer-test-card"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/buyer-test-card` — tool name `buyer_test_card`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/buyer-test-card` — body = the manifest object; same `Authorization` header.

## Input — the buyer-test-card manifest

| Field | Meaning |
|---|---|
| `idea` | idea text (string; carried into the output, not checked) |
| `decision` (string) | computed: must be one of `adopt`, `adapt`, `abandon`; also carried into the output |
| `disposition` (string) | computed: must be one of `disposable`, `slated_for_hardening`; also carried into the output |
| `hypothesis.written` / `single` / `states_capability_under_constraints` | hypothesis evidence |
| `criteria.success_written_before_start` / `kill_written_before_start` / `agreed_by_decision_owner_before_build` | criteria-upfront evidence |
| `timebox.hard_limit_set` / `scope_limited_to_critical_path` / `scope_creep_refused_politely` | timebox and scope evidence |
| `timebox.limit_days` (number), `timebox.elapsed_days` (number) | computed: elapsed must not exceed the positive limit and must not be negative; reported as `timebox_limit_days`, `timebox_elapsed_days` and `timebox_overrun_days` (elapsed minus limit, six decimal places) |
| `evidence.from_measurements_tests_or_demo` / `numbers_over_impressions` / `stubs_and_mocks_recorded` | evidence evidence |
| `production_boundary.slid_into_production` / `claimed_as_production_evidence` | both must be `false` to pass |
| `findings.memo_written` / `rationale_references_criteria` / `decision_logged` / `not_tested_list_clear` / `adopting_routed_through_full_team_process` | decision and findings evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CARD_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/buyer-test-card`:

```json
{
  "idea": "AI-driven inventory forecasting",
  "decision": "adopt",
  "disposition": "disposable",
  "hypothesis": {
    "written": true,
    "single": true,
    "states_capability_under_constraints": true
  },
  "criteria": {
    "success_written_before_start": true,
    "kill_written_before_start": true,
    "agreed_by_decision_owner_before_build": true
  },
  "timebox": {
    "hard_limit_set": true,
    "limit_days": 10,
    "elapsed_days": 5,
    "scope_limited_to_critical_path": true,
    "scope_creep_refused_politely": true
  },
  "evidence": {
    "from_measurements_tests_or_demo": true,
    "numbers_over_impressions": true,
    "stubs_and_mocks_recorded": true
  },
  "production_boundary": {
    "slid_into_production": false,
    "claimed_as_production_evidence": false
  },
  "findings": {
    "memo_written": true,
    "rationale_references_criteria": true,
    "decision_logged": true,
    "not_tested_list_clear": true,
    "adopting_routed_through_full_team_process": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 22 checks and a text stamp of the verdict):

```json
{
  "service": "buyer-test-card",
  "atom_version": "0.1.0",
  "idea": "AI-driven inventory forecasting",
  "decision": "adopt",
  "disposition": "disposable",
  "verdict": "CARD_COMPLETE",
  "sections": {
    "hypothesis": "pass",
    "criteria_upfront": "pass",
    "timebox_and_scope": "pass",
    "disposition_and_production_boundary": "pass",
    "evidence": "pass",
    "decision_and_findings": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "timebox_limit_days": 10,
  "timebox_elapsed_days": 5,
  "timebox_overrun_days": "-5.000000",
  "summary": "22 pass, 0 fail, 0 missing of 22 checks across six sections."
}
```

## Verdicts

- **CARD_COMPLETE** — every check passes; the card is complete on the declared evidence.
- **CARD_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `timebox_limit_days` and `timebox_elapsed_days` (the declared numbers, or null when absent), `timebox_overrun_days` (elapsed minus limit, string with exactly six decimals, or null when it cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
