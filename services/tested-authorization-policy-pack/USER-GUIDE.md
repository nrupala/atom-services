# Tested authorization policy pack — user guide

## What it does

You ship authorization policy as code — OPA/Rego-class rules, tests,
decision logs, safe rollout. This atom reads a short evidence manifest
describing a policy pack — decision model, policy code, the declared
policies and their tests, rollout, decision logs, and governance and
enforcement — and returns one deterministic verdict across 29 checks
in six sections: **READY**, **NOT_READY**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Three checks are computed from the
policies and tests you declare: every declared policy must default to
`deny`, every declared policy must be covered by at least one declared
test (untested policy ids are named), and every declared policy must
have a declared positive, negative and edge test. The output also
reports `coverage_status`, `policy_count`, `tested_policy_count`,
`test_count` and `test_coverage_ratio` (the tested-policy share, a
string with exactly four decimals). Everything else is your declared
posture, audited — the atom does not parse or execute Rego/Cedar, run
your tests, or read real decision logs. Same manifest in → same
verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "tested-authorization-policy-pack"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/tested-authorization-policy-pack`
  — tool name `tested_authorization_policy_pack`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/tested-authorization-policy-pack`
  — body = the manifest object; same `Authorization` header.

## Input — the tested-policy-pack manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `pack` | pack name (string; carried into the output, not itself checked) |
| `decision_model.decisions_enumerated`, `decision_model.input_schema_defined`, `decision_model.default_deny` | decision model |
| `policies[]` | declared policies: `{id, default}` — `id` a non-empty string, `default` the policy's declared default effect (must be `"deny"` to pass the computed default-deny check) |
| `policy_code.rules_small_and_composable`, `policy_code.data_separated_from_logic`, `policy_code.policy_data_versioned`, `policy_code.decision_explanations_available` | policy code |
| `tests[]` | declared tests: `{policy_id, kind}` with `kind` one of `"positive"`, `"negative"`, `"edge"` |
| `testing.tests_green`, `testing.lint_format_clean`, `testing.key_roles_coverage_declared` | testing |
| `rollout.shadow_completed`, `rollout.staged_before_production`, `rollout.break_glass_documented_gated_audited`, `rollout.break_glass_tested`, `rollout.silent_policy_edits` (must be `false` to pass) | rollout |
| `decision_logs.record_who_decision_version_reason`, `decision_logs.retained_immutably`, `decision_logs.full_in_sensitive_flows` | decision logs |
| `governance.second_pair_of_eyes_on_prs`, `governance.version_and_changelog`, `governance.human_summary_in_sync_with_code` | governance |
| `enforcement.points_inventoried`, `enforcement.failure_mode_chosen_per_surface`, `enforcement.sensitive_surfaces_fail_closed`, `enforcement.bypass_paths_present` (must be `false` to pass) | enforcement |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false, a policy defaulting
to anything other than `deny`, a policy with no declared test, or a
policy missing a positive, negative or edge test = the check fails
(counts toward NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/tested-authorization-policy-pack`:

```json
{
  "pack": "auth-v1",
  "decision_model": {"decisions_enumerated": true, "input_schema_defined": true, "default_deny": true},
  "policies": [{"id": "p1", "default": "deny"}, {"id": "p2", "default": "deny"}],
  "policy_code": {"rules_small_and_composable": true, "data_separated_from_logic": true, "policy_data_versioned": true, "decision_explanations_available": true},
  "tests": [{"policy_id": "p1", "kind": "positive"}, {"policy_id": "p1", "kind": "negative"}, {"policy_id": "p1", "kind": "edge"}, {"policy_id": "p2", "kind": "positive"}, {"policy_id": "p2", "kind": "negative"}, {"policy_id": "p2", "kind": "edge"}],
  "testing": {"tests_green": true, "lint_format_clean": true, "key_roles_coverage_declared": true},
  "rollout": {"shadow_completed": true, "staged_before_production": true, "break_glass_documented_gated_audited": true, "break_glass_tested": true, "silent_policy_edits": false},
  "decision_logs": {"record_who_decision_version_reason": true, "retained_immutably": true, "full_in_sensitive_flows": true},
  "governance": {"second_pair_of_eyes_on_prs": true, "version_and_changelog": true, "human_summary_in_sync_with_code": true},
  "enforcement": {"points_inventoried": true, "failure_mode_chosen_per_surface": true, "sensitive_surfaces_fail_closed": true, "bypass_paths_present": false}
}
```

Response — HTTP 200 (trimmed; the full response carries all 29 checks
and a text stamp of the verdict):

```json
{
  "service": "tested-authorization-policy-pack",
  "atom_version": "0.1.0",
  "pack": "auth-v1",
  "verdict": "READY",
  "sections": {"decision_model": "pass", "policy_code": "pass", "testing": "pass", "rollout": "pass", "decision_logs": "pass", "governance_and_enforcement": "pass"},
  "coverage_status": "complete_on_declared_tests",
  "policy_count": 2,
  "tested_policy_count": 2,
  "test_count": 6,
  "test_coverage_ratio": "1.0000",
  "untested_policy_ids": [],
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

The coverage ratio is a string with exactly four decimals (`null`
when the computed checks cannot run, e.g. no policies declared).

## Verdicts

- **READY** — every check passes, including the computed default-deny
  and per-policy test-coverage checks.
- **NOT_READY** — at least one check fails; the failing checks name
  the breached section and, for the computed checks, the offending
  policy ids.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
