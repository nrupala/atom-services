# Network exposure audit — `network-exposure-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Secure network paths and exposure — segmentation, TLS everywhere, DNS/email auth, WAF/tunnels, egress control.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product release network exposure audit**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Input manifest

The caller submits ONE JSON object. Every field below is read by at least one check; an absent field is `missing` evidence (never a fail), a present-but-invalid field is a fail. Verdicts: `SOUND` (all pass) / `UNSOUND` (any fail) / `INSUFFICIENT_EVIDENCE` (no fail, some missing). Sections: `inventory`, `segmentation`, `tls`, `dns_email`, `edge_access`, `egress_evidence` — 27 checks in total.

| Field | Type | Read by |
|---|---|---|
| `system` | string | echoed in the output as the audited subject |
| `environment` | string | echoed in the output (e.g. `production`) |
| `inventory.current` | boolean | `exposure_inventory_current` |
| `endpoints` | array of endpoint objects (schema below) | all endpoint-level checks: `every_public_endpoint_owned`, `no_unlisted_public_endpoints`, `no_plaintext_protocol_endpoints`, `encrypted_endpoints_have_valid_certs`, `no_admin_or_db_endpoint_public`, `no_unauthenticated_tunnels` |
| `segmentation.zones_separated` | boolean | `trust_zones_separated` |
| `segmentation.admin_plane_separate` | boolean | `admin_plane_separate_from_public_path` |
| `segmentation.default_deny` | boolean | `default_deny_posture` |
| `segmentation.loopback_by_default` | boolean | `loopback_by_default` |
| `tls.cert_expiry_monitored` | boolean | `cert_expiry_monitored` |
| `tls.hsts_on_web` | boolean | `hsts_on_web` |
| `tls.min_version` | string | `modern_tls_min_version` — must be `1.2` or `1.3` |
| `dns.registrar_lock` | boolean | `registrar_lock_enabled` |
| `dns.registrar_2fa` | boolean | `registrar_2fa_enabled` |
| `dns.dnssec_enabled` | boolean | `dnssec_enabled` |
| `domains` | array of domain objects (schema below) | `every_sending_domain_has_spf_dkim_dmarc` |
| `email.dmarc_reports_monitored` | boolean | `dmarc_reports_monitored` |
| `edge.waf_or_cdn_in_front_of_web` | boolean | `waf_or_cdn_in_front_of_web` |
| `edge.rate_limits_enabled` | boolean | `edge_rate_limits_enabled` |
| `access.admin_authenticated_path_only` | boolean | `admin_access_authenticated_path_only` |
| `access.no_default_credentials` | boolean | `no_default_credentials` |
| `egress.outbound_allowlist` | boolean | `egress_outbound_allowlist` |
| `egress.unexpected_egress_logged` | boolean | `unexpected_egress_logged` |
| `evidence.events_logged_denied_and_accepted` | boolean | `network_events_logged_denied_and_accepted` |
| `evidence.reviewed_on_change_and_incident` | boolean | `evidence_reviewed_on_change_and_incident` |

### Endpoint object schema (`endpoints[]`)

| Field | Type | Meaning / use |
|---|---|---|
| `id` | string | endpoint name used in evidence strings (fallback: `endpoint[<index>]`) |
| `host` | string | host the endpoint is served on (declared context; not itself checked) |
| `port` | integer | port; sensitive ports (1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017) trigger the admin/DB red line when the endpoint is public |
| `protocol` | string | `http`/`ftp`/`telnet`/`plaintext` fail on any path; encrypted protocols (`https`, `wss`, `tls`, `ssl`, `smtps`, `imaps`, `pop3s`, `ldaps`) require `tls_cert_valid` |
| `public` | boolean | `true` = reachable from the internet; ownership, listing, and admin/DB checks apply to public endpoints |
| `listed` | boolean | must be `true` for every public endpoint (on the exposure inventory) |
| `owner` | string | required (non-empty) on every public endpoint |
| `service` | string | service tag; sensitive tags (database/db/mysql/postgres/postgresql/mssql/mongodb/redis/elasticsearch/admin/control-plane variants) trigger the admin/DB red line when public |
| `zone` | string | trust zone; `admin` and `data` zones trigger the admin/DB red line when public |
| `via` | string | exposure path; tunnel values (`tunnel`, `cloudflared`, `ssh-tunnel`, `ssh_tunnel`, `ngrok`, `tailscale-funnel`, `tailscale_funnel`) require `auth_required` |
| `tls_cert_valid` | boolean | must be `true` on every encrypted-protocol endpoint |
| `auth_required` | boolean | must be `true` on every tunnel-exposed endpoint |

### Domain object schema (`domains[]`)

| Field | Type | Meaning / use |
|---|---|---|
| `name` | string | domain name used in evidence strings (fallback: `domain[<index>]`) |
| `sending` | boolean | if `true`, `spf`, `dkim`, and `dmarc` must all be `true` |
| `spf` | boolean | SPF record present |
| `dkim` | boolean | DKIM signing present |
| `dmarc` | boolean | DMARC policy present |

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
