# Architecture decision record — user guide

## What it does

You are recording an architecture decision. This atom reads a declared
ADR pack for one decision — NFRs first, boundaries and contracts,
options and trade-offs, ADR format, reversibility and security,
lifecycle and dependencies — and returns one deterministic verdict
across six sections: **ADR_COMPLETE**, **ADR_NOT_COMPLETE**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Four checks are computed: the
alternatives list must hold 2–3 entries, every alternative must state
its trade-offs, at least one alternative must be serious, and the ADR
must be one page max. Same manifest in → same verdict out. It audits
the completeness of the record; it does not judge whether the decision
itself is wise.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "architecture-decision-record"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/architecture-decision-record`
  — tool name `architecture_decision_record`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/architecture-decision-record`
  — body = the manifest object; same `Authorization` header.

## Input — the architecture-decision manifest

| Field | Meaning |
|---|---|
| `decision` | decision name (string; carried into the output, not checked) |
| `nfrs.written` / `quantified_where_possible` / `agreed_before_design_freeze` | NFRs-first evidence |
| `boundaries.contexts_drawn` / `core_kept_small` | boundary evidence |
| `boundaries.hidden_coupling_present`, `boundaries.backdoor_paths_present` | both must be `false` to pass (red lines) |
| `contracts.interfaces_documented` / `interfaces_versioned` / `inputs_outputs_defined` / `errors_defined` / `defined_before_code` | contract evidence |
| `options.alternatives` | list of `{name, serious, tradeoffs_stated}`; computed: 2–3 entries, all trade-offs stated, at least one serious |
| `options.prefers_boring_replaceable_tech` | boring, replaceable tech preferred |
| `adr.numbered` / `context_stated` / `decision_stated` / `consequences_positive_stated` / `consequences_negative_stated` / `consequences_risks_stated` / `status_stated` | ADR format evidence |
| `adr.page_count` | number; must be ≤ 1 to pass (computed) |
| `reversibility.assessed` / `expensive_choices_isolated_behind_interfaces` | reversibility evidence |
| `reversibility.irreversible_decisions_deferred` | must be `false` to pass (red line) |
| `security.data_flows_mapped` / `encryption_verification_addressed` | security evidence |
| `dependencies.new_dependency_introduced`, `dependencies.new_dependency_reason_stated` | reason required only when a dependency is introduced |
| `supersession.has_superseded_adrs`, `supersession.superseded_adrs_linked_to_replacements` | link required only when superseded ADRs exist |
| `supersession.superseded_silently_rewritten` | must be `false` to pass |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward ADR_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/architecture-decision-record`:

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

Response — HTTP 200 (trimmed; the full response carries all 32 checks
and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "alternatives_count": 2,
  "page_count_over_limit": "0.0000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections."
}
```

## Verdicts

- **ADR_COMPLETE** — every check passes; the record is complete on the declared evidence.
- **ADR_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null), `alternatives_count` (or null) and `page_count_over_limit` (declared page count minus 1, string with exactly four decimals, or null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
