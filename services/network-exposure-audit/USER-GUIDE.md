# Network exposure audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run networked systems and need the exposure story straight. This atom reads a short evidence manifest describing your network posture — a current endpoint inventory, segmentation into trust zones, TLS everywhere with valid certs, DNS/email authentication, edge access controls, and egress/logging evidence — and returns one deterministic verdict across six sections (inventory, segmentation, tls, dns_email, edge_access, egress_evidence) with per-check evidence: **SOUND**, **UNSOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "network-exposure-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/network-exposure-audit`
  — tool name `network_exposure_audit`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/network-exposure-audit`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `system` |
| `environment` |
| `inventory.current` |
| `endpoints` |
| `segmentation.zones_separated` |
| `segmentation.admin_plane_separate` |
| `segmentation.default_deny` |
| `segmentation.loopback_by_default` |
| `tls.cert_expiry_monitored` |
| `tls.hsts_on_web` |
| `tls.min_version` |
| `dns.registrar_lock` |
| `dns.registrar_2fa` |
| `dns.dnssec_enabled` |
| `domains` |
| `email.dmarc_reports_monitored` |
| `edge.waf_or_cdn_in_front_of_web` |
| `edge.rate_limits_enabled` |
| `access.admin_authenticated_path_only` |
| `access.no_default_credentials` |
| `egress.outbound_allowlist` |
| `egress.unexpected_egress_logged` |
| `evidence.events_logged_denied_and_accepted` |
| `evidence.reviewed_on_change_and_incident` |
| `id` |
| `host` |
| `port` |
| `protocol` |
| `public` |
| `listed` |
| `owner` |
| `service` |
| `zone` |
| `via` |
| `tls_cert_valid` |
| `auth_required` |
| `name` |
| `sending` |
| `spf` |
| `dkim` |
| `dmarc` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/network-exposure-audit`:

```json
{
  "system": "production-core",
  "environment": "production",
  "inventory": {
    "current": true
  },
  "endpoints": [
    {
      "id": "web-gateway",
      "host": "api.example.com",
      "port": 443,
      "protocol": "https",
      "public": true,
      "listed": true,
      "owner": "platform-team",
      "service": "web-api",
      "zone": "public",
      "via": "direct",
      "tls_cert_valid": true,
      "auth_required": true
    }
  ],
  "segmentation": {
    "zones_separated": true,
    "admin_plane_separate": true,
    "default_deny": true,
    "loopback_by_default": true
  },
  "tls": {
    "cert_expiry_monitored": true,
    "hsts_on_web": true,
    "min_version": "1.3"
  },
  "dns": {
    "registrar_lock": true,
    "registrar_2fa": true,
    "dnssec_enabled": true
  },
  "domains": [
    {
      "name": "example.com",
      "sending": true,
      "spf": true,
      "dkim": true,
      "dmarc": true
    }
  ],
  "email": {
    "dmarc_reports_monitored": true
  },
  "edge": {
    "waf_or_cdn_in_front_of_web": true,
    "rate_limits_enabled": true
  },
  "access": {
    "admin_authenticated_path_only": true,
    "no_default_credentials": true
  },
  "egress": {
    "outbound_allowlist": true,
    "unexpected_egress_logged": true
  },
  "evidence": {
    "events_logged_denied_and_accepted": true,
    "reviewed_on_change_and_incident": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "network-exposure-audit",
  "atom_version": "0.1.0",
  "system": "production-core",
  "verdict": "SOUND",
  "sections": {
    "inventory": "pass",
    "segmentation": "pass",
    "tls": "pass",
    "dns_email": "pass",
    "edge_access": "pass",
    "egress_evidence": "pass"
  },
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "checks": [
    {
      "section": "inventory",
      "check": "exposure_inventory_current",
      "status": "pass",
      "evidence": "skill method 1: exposure inventory maintained \u2014 the list of public endpoints and what serves each"
    },
    {
      "section": "inventory",
      "check": "every_public_endpoint_owned",
      "status": "pass",
      "evidence": "every public endpoint has an owner (quality gate: every public entry has an owner)"
    }
  ]
}
```

## Verdicts

- **SOUND** — every check passes (27/27); the exposure posture clears all six sections.
- **UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
