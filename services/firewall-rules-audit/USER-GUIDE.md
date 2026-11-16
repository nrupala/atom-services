# Firewall rules audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You operate a firewall ruleset. This atom reads a short evidence manifest describing the ruleset — baseline default-deny, least-privilege rules, explicit egress, documentation and change control, and assurance (logging, testing, review cadence) — and returns one deterministic verdict across five sections (20 checks) with per-check evidence. Note the baseline requires both a `deny` default policy in each direction **and** an explicit deny-any rule in the `rules` list: **SOUND**, **UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a gate. A field **absent** = evidence missing
(counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward UNSOUND).

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "firewall-rules-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/firewall-rules-audit`
  — tool name `firewall_rules_audit`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/firewall-rules-audit`
  — body = the manifest object; same `Authorization` header.

## Input — the evidence manifest

| Field | Meaning |
|---|---|
| `system`, `environment` | audited system / environment; echoed in the output |
| `default_policy.inbound`, `.outbound` | must both be `deny` |
| `layers_consistent` | platform layers consistent, no conflicting opens |
| `rules` | array of rule objects (`id`, `direction`, `source`, `destination`, `port_start`, `port_end`, `protocol`, `action`; every allow rule also needs `owner`, `reason`, `date`). Must include an explicit deny-any rule, not just the default policy |
| `egress.explicit_allowlist`, `.alert_on_denies` | explicit egress allowlist, alerting on denies |
| `change_control.changes_reviewed`, `.old_rules_retired_on_schedule` | changes reviewed like code; old rules retired on schedule |
| `logging.denials_logged`, `.rate_limited` | denial logging, rate-limited |
| `testing.allowed_and_disallowed_paths_verified`, `.smoke_matrix_per_service` | post-change testing of allowed and blocked paths |
| `review.cadence_days` | review cadence in days — must be 1–31 |

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/firewall-rules-audit`:

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

Response — HTTP 200 (trimmed; the full response carries all 20 checks
and a text stamp of the verdict):

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
 "summary": "20 pass, 0 fail, 0 missing of 20 checks across five sections."
}
```

## Verdicts

- **SOUND** — every check passes; the ruleset clears all five sections.
- **UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
