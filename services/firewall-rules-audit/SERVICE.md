# Firewall rules audit — `firewall-rules-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Design firewalls that hold — default deny, least-privilege rules, explicit egress, tested and reviewed.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product release-gate firewall audit**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Input manifest

The caller submits ONE JSON object. Every field below is read by at least one check; an absent field is `missing` evidence (never a fail), a present-but-invalid field is a fail. Verdicts: `SOUND` (all pass) / `UNSOUND` (any fail) / `INSUFFICIENT_EVIDENCE` (no fail, some missing). Sections: `baseline`, `least_privilege`, `egress`, `documentation_change`, `assurance` — 20 checks in total.

| Field | Type | Read by |
|---|---|---|
| `system` | string | echoed in the output as the audited subject |
| `environment` | string | echoed in the output (e.g. `production`) |
| `default_policy.inbound` | string (`deny`/`allow`) | `default_deny_inbound` — must be `deny` |
| `default_policy.outbound` | string (`deny`/`allow`) | `default_deny_outbound` — must be `deny` |
| `layers_consistent` | boolean | `layers_consistent` — platform layers consistent, no conflicting opens |
| `rules` | array of rule objects (schema below) | all rule-level checks: `explicit_default_deny_rule_present`, `no_any_any_allow_rules`, `no_overly_broad_port_ranges` (allow span ≥ 1000 ports), `no_shadowed_rules`, `no_direct_sensitive_exposure`, `no_port_forwards_without_review`, `every_allow_rule_documented`, `temporary_rules_have_ticket_and_expiry` |
| `egress.explicit_allowlist` | boolean | `explicit_egress_allowlist` |
| `egress.alert_on_denies` | boolean | `egress_alert_on_denies` |
| `change_control.changes_reviewed` | boolean | `changes_reviewed_like_code` |
| `change_control.old_rules_retired_on_schedule` | boolean | `old_rules_retired_on_schedule` |
| `logging.denials_logged` | boolean | `denials_logged` |
| `logging.rate_limited` | boolean | `denial_logging_rate_limited` |
| `testing.allowed_and_disallowed_paths_verified` | boolean | `post_change_test_allowed_and_blocked` |
| `testing.smoke_matrix_per_service` | boolean | `smoke_matrix_per_service` |
| `review.cadence_days` | number | `review_cadence_within_31_days` — must be 1–31 (monthly review) |

### Rule object schema (`rules[]`)

| Field | Type | Meaning / use |
|---|---|---|
| `id` | string | rule name used in evidence strings (fallback: `rule[<index>]`) |
| `direction` | string | `inbound` or `outbound` |
| `source` | string | address/CIDR, or `any` / `*` / `0.0.0.0/0` / `::/0` / `internet` for any |
| `destination` | string | address/CIDR, or any-value as above |
| `port_start` | integer | first destination port; if `port_start`/`port_end` are not both integers the rule is treated as covering ports 0–65535 |
| `port_end` | integer | last destination port |
| `protocol` | string | e.g. `tcp`, `udp`, or `any`/`all`/`*`; absent means `any` for shadowing |
| `action` | string | `allow` or `deny` |
| `owner` | string | required (with `reason` and `date`) on every allow rule |
| `reason` | string | why the allow exists — required on every allow rule |
| `date` | string | date of the rule comment — required on every allow rule |
| `service` | string | destination service tag; sensitive tags (database/db/mysql/postgres/mssql/mongodb/redis/elasticsearch/admin/control-plane/agent-control-plane/docker, and ports 1433, 2375, 2376, 3306, 5432, 6379, 9200, 27017) trigger the direct-exposure red line when allowed inbound from any |
| `temporary` | boolean | if `true`, `ticket` and `expiry_date` are both required |
| `ticket` | string | ticket id for a temporary rule |
| `expiry_date` | string | expiry date for a temporary rule |
| `port_forward` | boolean | if `true`, `reviewed` must be `true` |
| `reviewed` | boolean | the port-forward's inventory review |

Shadowing is computed deterministically: a later rule is shadowed when an earlier rule in the same direction covers its source and destination (any-value, exact match, or IPv4 CIDR containment), covers its port range, and covers its protocol.
