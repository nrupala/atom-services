# Network exposure audit — `network-exposure-audit`

**Network exposure audit** · slug `network-exposure-audit` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Secure network paths and exposure — segmentation, TLS everywhere, DNS/email auth, WAF/tunnels, egress control.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `system` = `production-core`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/network-exposure-audit` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "SOUND"`, every section `pass`, and the summary: "27 pass, 0 fail, 0 missing of 27 checks across six sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "network-exposure-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/network-exposure-audit \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/network-exposure-audit`
- Tool name: `network_exposure_audit` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `UNSOUND` with the summary: "4 pass, 2 fail, 21 missing of 27 checks across six sections."

The checks with `status: "fail"` in that recorded run were:

- `tls.no_plaintext_protocol_endpoints` — evidence: "plaintext protocol endpoints (skill method 4: no plaintext protocols (HTTP/FTP/telnet) on any path): db-exposed"
- `edge_access.no_admin_or_db_endpoint_public` — evidence: "publicly exposed admin/DB endpoints (skill red line: no admin/DB panels exposed to the internet): db-exposed"

Fix procedure:

1. **Separate `fail` from `missing`.** A `fail` means a field was present but false / invalid, or a must-be-false red-line field was true — correct the underlying fact or the declaration. A `missing` check means the field was absent — supply the evidence. Adding a missing field cannot fix a fail, and vice versa.
2. **Work section by section.** The `sections` object rolls the checks up: a section is `fail` if any of its checks fails, otherwise `insufficient_evidence` if any is missing, otherwise `pass`. Fix every failing check in a section before re-reading its roll-up.
3. **Respect the gates.** Some checks only bite when a gate field says they apply (see the notes in the Input reference). If a gated check fails, either the gated thing must be brought up to standard or the gate declaration was wrong — fix whichever is true, never just flip the gate to make the check disappear if the gated thing exists.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update. Resubmit the corrected full manifest and confirm the summary counts move (fail count to zero, then missing count to zero).

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "inventory.current",
  "detail": "inventory.current must be a boolean"
}
```

Fix the field named in `field` (`inventory.current`): `detail` says what was expected ("inventory.current must be a boolean"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/network-exposure-audit` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/network-exposure-audit` | Tool name `network_exposure_audit`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field tables, which state a Type for every field, including the separate `endpoints[]` and `domains[]` object schemas. Notes / conditions are preserved from SERVICE.md.

#### `system`

| Field | Type | Read by / notes |
|---|---|---|
| `system` | string | Read by: echoed in the output as the audited subject |

#### `environment`

| Field | Type | Read by / notes |
|---|---|---|
| `environment` | string | Read by: echoed in the output (e.g. `production`) |

#### `inventory`

| Field | Type | Read by / notes |
|---|---|---|
| `inventory.current` | boolean | Read by: `exposure_inventory_current` |

#### `endpoints`

| Field | Type | Read by / notes |
|---|---|---|
| `endpoints` | array of endpoint objects (schema below) | Read by: all endpoint-level checks: `every_public_endpoint_owned`, `no_unlisted_public_endpoints`, `no_plaintext_protocol_endpoints`, `encrypted_endpoints_have_valid_certs`, `no_admin_or_db_endpoint_public`, `no_unauthenticated_tunnels` |

#### `segmentation`

| Field | Type | Read by / notes |
|---|---|---|
| `segmentation.zones_separated` | boolean | Read by: `trust_zones_separated` |
| `segmentation.admin_plane_separate` | boolean | Read by: `admin_plane_separate_from_public_path` |
| `segmentation.default_deny` | boolean | Read by: `default_deny_posture` |
| `segmentation.loopback_by_default` | boolean | Read by: `loopback_by_default` |

#### `tls`

| Field | Type | Read by / notes |
|---|---|---|
| `tls.cert_expiry_monitored` | boolean | Read by: `cert_expiry_monitored` |
| `tls.hsts_on_web` | boolean | Read by: `hsts_on_web` |
| `tls.min_version` | string | Read by: `modern_tls_min_version` — must be `1.2` or `1.3` |

#### `dns`

| Field | Type | Read by / notes |
|---|---|---|
| `dns.registrar_lock` | boolean | Read by: `registrar_lock_enabled` |
| `dns.registrar_2fa` | boolean | Read by: `registrar_2fa_enabled` |
| `dns.dnssec_enabled` | boolean | Read by: `dnssec_enabled` |

#### `domains`

| Field | Type | Read by / notes |
|---|---|---|
| `domains` | array of domain objects (schema below) | Read by: `every_sending_domain_has_spf_dkim_dmarc` |

#### `email`

| Field | Type | Read by / notes |
|---|---|---|
| `email.dmarc_reports_monitored` | boolean | Read by: `dmarc_reports_monitored` |

#### `edge`

| Field | Type | Read by / notes |
|---|---|---|
| `edge.waf_or_cdn_in_front_of_web` | boolean | Read by: `waf_or_cdn_in_front_of_web` |
| `edge.rate_limits_enabled` | boolean | Read by: `edge_rate_limits_enabled` |

#### `access`

| Field | Type | Read by / notes |
|---|---|---|
| `access.admin_authenticated_path_only` | boolean | Read by: `admin_access_authenticated_path_only` |
| `access.no_default_credentials` | boolean | Read by: `no_default_credentials` |

#### `egress`

| Field | Type | Read by / notes |
|---|---|---|
| `egress.outbound_allowlist` | boolean | Read by: `egress_outbound_allowlist` |
| `egress.unexpected_egress_logged` | boolean | Read by: `unexpected_egress_logged` |

#### `evidence`

| Field | Type | Read by / notes |
|---|---|---|
| `evidence.events_logged_denied_and_accepted` | boolean | Read by: `network_events_logged_denied_and_accepted` |
| `evidence.reviewed_on_change_and_incident` | boolean | Read by: `evidence_reviewed_on_change_and_incident` |

#### `id`

| Field | Type | Read by / notes |
|---|---|---|
| `id` | string | Read by: endpoint name used in evidence strings (fallback: `endpoint[<index>]`) |

#### `host`

| Field | Type | Read by / notes |
|---|---|---|
| `host` | string | Read by: host the endpoint is served on (declared context; not itself checked) |

#### `port`

| Field | Type | Read by / notes |
|---|---|---|
| `port` | integer | Read by: port; sensitive ports (1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017) trigger the admin/DB red line when the endpoint is public |

#### `protocol`

| Field | Type | Read by / notes |
|---|---|---|
| `protocol` | string | Read by: `http`/`ftp`/`telnet`/`plaintext` fail on any path; encrypted protocols (`https`, `wss`, `tls`, `ssl`, `smtps`, `imaps`, `pop3s`, `ldaps`) require `tls_cert_valid` |

#### `public`

| Field | Type | Read by / notes |
|---|---|---|
| `public` | boolean | Read by: `true` = reachable from the internet; ownership, listing, and admin/DB checks apply to public endpoints |

#### `listed`

| Field | Type | Read by / notes |
|---|---|---|
| `listed` | boolean | Read by: must be `true` for every public endpoint (on the exposure inventory) |

#### `owner`

| Field | Type | Read by / notes |
|---|---|---|
| `owner` | string | Read by: required (non-empty) on every public endpoint |

#### `service`

| Field | Type | Read by / notes |
|---|---|---|
| `service` | string | Read by: service tag; sensitive tags (database/db/mysql/postgres/postgresql/mssql/mongodb/redis/elasticsearch/admin/control-plane variants) trigger the admin/DB red line when public |

#### `zone`

| Field | Type | Read by / notes |
|---|---|---|
| `zone` | string | Read by: trust zone; `admin` and `data` zones trigger the admin/DB red line when public |

#### `via`

| Field | Type | Read by / notes |
|---|---|---|
| `via` | string | Read by: exposure path; tunnel values (`tunnel`, `cloudflared`, `ssh-tunnel`, `ssh_tunnel`, `ngrok`, `tailscale-funnel`, `tailscale_funnel`) require `auth_required` |

#### `tls_cert_valid`

| Field | Type | Read by / notes |
|---|---|---|
| `tls_cert_valid` | boolean | Read by: must be `true` on every encrypted-protocol endpoint |

#### `auth_required`

| Field | Type | Read by / notes |
|---|---|---|
| `auth_required` | boolean | Read by: must be `true` on every tunnel-exposed endpoint |

#### `name`

| Field | Type | Read by / notes |
|---|---|---|
| `name` | string | Read by: domain name used in evidence strings (fallback: `domain[<index>]`) |

#### `sending`

| Field | Type | Read by / notes |
|---|---|---|
| `sending` | boolean | Read by: if `true`, `spf`, `dkim`, and `dmarc` must all be `true` |

#### `spf`

| Field | Type | Read by / notes |
|---|---|---|
| `spf` | boolean | Read by: SPF record present |

#### `dkim`

| Field | Type | Read by / notes |
|---|---|---|
| `dkim` | boolean | Read by: DKIM signing present |

#### `dmarc`

| Field | Type | Read by / notes |
|---|---|---|
| `dmarc` | boolean | Read by: DMARC policy present |

Input fields documented: 41 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **27 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

The endpoint- and domain-level checks are computed over the declared rows, not declared as booleans: `every_public_endpoint_owned`, `no_unlisted_public_endpoints`, `no_plaintext_protocol_endpoints` (`http` / `ftp` / `telnet` / `plaintext` fail on any path), `encrypted_endpoints_have_valid_certs` (encrypted protocols require `tls_cert_valid`), `no_admin_or_db_endpoint_public` (sensitive ports 1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017, sensitive service tags, or `admin` / `data` zones trigger the red line when public), `no_unauthenticated_tunnels` (tunnel `via` values require `auth_required`), and `every_sending_domain_has_spf_dkim_dmarc` (a sending domain needs SPF, DKIM and DMARC all true). `modern_tls_min_version` is also a value check: `tls.min_version` must be `1.2` or `1.3`.

#### Section `inventory` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `exposure_inventory_current` | skill method 1: exposure inventory maintained — the list of public endpoints and what serves each |
| `every_public_endpoint_owned` | every public endpoint has an owner (quality gate: every public entry has an owner) |
| `no_unlisted_public_endpoints` | no public endpoint absent from the exposure inventory (if it's not on the list, it's not allowed public) |

#### Section `segmentation` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `trust_zones_separated` | skill method 3: segmentation — services separated into trust zones (public edge / app / data / admin) |
| `admin_plane_separate_from_public_path` | skill method 3: admin planes never share the public path |
| `default_deny_posture` | skill method 2: default-deny posture — everything closed unless a list entry justifies exposure |
| `loopback_by_default` | skill method 2: everything listens on loopback unless a list entry justifies exposure |

#### Section `tls` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `no_plaintext_protocol_endpoints` | no plaintext protocol paths (quality gate: no plaintext protocol paths) |
| `encrypted_endpoints_have_valid_certs` | every encrypted endpoint has a valid cert |
| `cert_expiry_monitored` | skill method 4: valid certs — auto-renew + monitor expiry (quality gate: cert expiry monitored) |
| `hsts_on_web` | skill method 4: HSTS on web |
| `modern_tls_min_version` | min_version='1.3' (skill method 4: modern TLS config only — TLS 1.2 or 1.3) |

#### Section `dns_email` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `registrar_lock_enabled` | skill method 5: registrar lock + 2FA |
| `registrar_2fa_enabled` | skill method 5: registrar lock + 2FA |
| `dnssec_enabled` | skill method 5: DNSSEC where possible |
| `every_sending_domain_has_spf_dkim_dmarc` | SPF, DKIM and DMARC present on every sending domain (quality gate: SPF/DKIM/DMARC present on sending domains) |
| `dmarc_reports_monitored` | skill method 5: monitor DMARC reports |

#### Section `edge_access` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `waf_or_cdn_in_front_of_web` | skill method 6: CDN/WAF in front of web; don't roll your own edge |
| `edge_rate_limits_enabled` | skill method 6: edge rate limits and bot rules |
| `no_admin_or_db_endpoint_public` | no admin/DB panel exposed to the internet |
| `admin_access_authenticated_path_only` | quality gate: admin access only via authenticated path (tunnel/VPN/SSO), never open ports |
| `no_unauthenticated_tunnels` | no unauthenticated tunnels |
| `no_default_credentials` | skill red line: no default credentials anywhere |

#### Section `egress_evidence` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `egress_outbound_allowlist` | skill method 7: egress control — outbound allowlists for servers that don't need the internet |
| `unexpected_egress_logged` | skill method 7: log unexpected egress |
| `network_events_logged_denied_and_accepted` | skill method 8: network events logged (denied + accepted) |
| `evidence_reviewed_on_change_and_incident` | skill method 8: evidence reviewed on change and on incident |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"network-exposure-audit"`) and `atom_version` (string, `"0.1.0"`)
- `system` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `environment`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `SOUND` | All 27 checks pass across all six sections. |
| `UNSOUND` | At least one check fails (a present field is false / invalid, `tls.min_version` is not `1.2` or `1.3`, or a computed endpoint / domain check fails). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. SERVICE.md states this explicitly: an absent field is `missing` evidence, never a fail. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `inventory.current`, detail "inventory.current must be a boolean" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. Exposure audits fail most often on inventory, not on cryptography: an endpoint nobody listed, owned by nobody, or an admin/DB surface that became public through a tunnel. That is why the inventory checks are computed over every declared public endpoint (owner present, listed, not admin/DB, not plaintext, cert valid, tunnel authenticated) instead of trusting a single 'inventory current' boolean — although that boolean is checked too.

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

The endpoint- and domain-level checks are computed over the declared rows, not declared as booleans: `every_public_endpoint_owned`, `no_unlisted_public_endpoints`, `no_plaintext_protocol_endpoints` (`http` / `ftp` / `telnet` / `plaintext` fail on any path), `encrypted_endpoints_have_valid_certs` (encrypted protocols require `tls_cert_valid`), `no_admin_or_db_endpoint_public` (sensitive ports 1433, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 27017, sensitive service tags, or `admin` / `data` zones trigger the red line when public), `no_unauthenticated_tunnels` (tunnel `via` values require `auth_required`), and `every_sending_domain_has_spf_dkim_dmarc` (a sending domain needs SPF, DKIM and DMARC all true). `modern_tls_min_version` is also a value check: `tls.min_version` must be `1.2` or `1.3`.

**What it does NOT do:**

- It does not scan a network, probe an endpoint, resolve DNS, or inspect a certificate live. Every endpoint, domain, protocol and certificate fact is a caller declaration in the manifest; the computed checks test those declarations against the red lines above.
- A `SOUND` verdict means the declared exposure posture passes all 27 checks — it is not a penetration test and not a live scan result.
- Fields not itself checked: `system` and `environment` are echoed as the audited subject; `endpoints[].host` is declared context, not itself checked (SERVICE.md endpoint schema).

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Security & privacy who need this check on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Product release network exposure audit — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the check it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/network_exposure_audit.py` — contract entry: src/network_exposure_audit.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_network_exposure_audit.py — 22 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/network-exposure-audit`, MCP `POST https://atoms.pipavia.com/mcp/network-exposure-audit` (tool `network_exposure_audit`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

### For regulators

This view is included because: Its verdict is security-audit evidence over a regulated concern (network exposure, TLS, DNS/email authentication, admin/DB exposure) — the kind of posture evidence security and compliance reviewers rely on, with the declared-not-scanned limit stated plainly.

What the output is, as evidence: a deterministic, reproducible judgment over a declared manifest, with per-check evidence strings, a section roll-up, a one-line summary and a plain-text stamp, produced identically over REST and MCP from the same manifest (parity recorded). What it is not: an independent inspection of the underlying reality — the manifest is caller-declared, and the limits under Explanation ('What it does NOT do') bound exactly how far the verdict can be relied on. The worked examples below are the recorded external-verification runs, reproduced verbatim, so the evidence format can be assessed against real outputs rather than samples. Verification record: TEST-REPORT.md and `verification/results/network-exposure-audit.json` (retest verdict PASS, 2026-11-15).

## Worked examples

Provenance: recorded 2026-11-15T23:56:03.416977+00:00 against gateway v1.1.0, external verification lane, source `verification/work/network-exposure-audit/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

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

Response (REST `response_text`):

```json
{
  "service": "network-exposure-audit",
  "atom_version": "0.1.0",
  "system": "production-core",
  "environment": "production",
  "verdict": "SOUND",
  "sections": {
    "inventory": "pass",
    "segmentation": "pass",
    "tls": "pass",
    "dns_email": "pass",
    "edge_access": "pass",
    "egress_evidence": "pass"
  },
  "checks": [
    {
      "section": "inventory",
      "check": "exposure_inventory_current",
      "status": "pass",
      "evidence": "skill method 1: exposure inventory maintained — the list of public endpoints and what serves each"
    },
    {
      "section": "inventory",
      "check": "every_public_endpoint_owned",
      "status": "pass",
      "evidence": "every public endpoint has an owner (quality gate: every public entry has an owner)"
    },
    {
      "section": "inventory",
      "check": "no_unlisted_public_endpoints",
      "status": "pass",
      "evidence": "no public endpoint absent from the exposure inventory (if it's not on the list, it's not allowed public)"
    },
    {
      "section": "segmentation",
      "check": "trust_zones_separated",
      "status": "pass",
      "evidence": "skill method 3: segmentation — services separated into trust zones (public edge / app / data / admin)"
    },
    {
      "section": "segmentation",
      "check": "admin_plane_separate_from_public_path",
      "status": "pass",
      "evidence": "skill method 3: admin planes never share the public path"
    },
    {
      "section": "segmentation",
      "check": "default_deny_posture",
      "status": "pass",
      "evidence": "skill method 2: default-deny posture — everything closed unless a list entry justifies exposure"
    },
    {
      "section": "segmentation",
      "check": "loopback_by_default",
      "status": "pass",
      "evidence": "skill method 2: everything listens on loopback unless a list entry justifies exposure"
    },
    {
      "section": "tls",
      "check": "no_plaintext_protocol_endpoints",
      "status": "pass",
      "evidence": "no plaintext protocol paths (quality gate: no plaintext protocol paths)"
    },
    {
      "section": "tls",
      "check": "encrypted_endpoints_have_valid_certs",
      "status": "pass",
      "evidence": "every encrypted endpoint has a valid cert"
    },
    {
      "section": "tls",
      "check": "cert_expiry_monitored",
      "status": "pass",
      "evidence": "skill method 4: valid certs — auto-renew + monitor expiry (quality gate: cert expiry monitored)"
    },
    {
      "section": "tls",
      "check": "hsts_on_web",
      "status": "pass",
      "evidence": "skill method 4: HSTS on web"
    },
    {
      "section": "tls",
      "check": "modern_tls_min_version",
      "status": "pass",
      "evidence": "min_version='1.3' (skill method 4: modern TLS config only — TLS 1.2 or 1.3)"
    },
    {
      "section": "dns_email",
      "check": "registrar_lock_enabled",
      "status": "pass",
      "evidence": "skill method 5: registrar lock + 2FA"
    },
    {
      "section": "dns_email",
      "check": "registrar_2fa_enabled",
      "status": "pass",
      "evidence": "skill method 5: registrar lock + 2FA"
    },
    {
      "section": "dns_email",
      "check": "dnssec_enabled",
      "status": "pass",
      "evidence": "skill method 5: DNSSEC where possible"
    },
    {
      "section": "dns_email",
      "check": "every_sending_domain_has_spf_dkim_dmarc",
      "status": "pass",
      "evidence": "SPF, DKIM and DMARC present on every sending domain (quality gate: SPF/DKIM/DMARC present on sending domains)"
    },
    {
      "section": "dns_email",
      "check": "dmarc_reports_monitored",
      "status": "pass",
      "evidence": "skill method 5: monitor DMARC reports"
    },
    {
      "section": "edge_access",
      "check": "waf_or_cdn_in_front_of_web",
      "status": "pass",
      "evidence": "skill method 6: CDN/WAF in front of web; don't roll your own edge"
    },
    {
      "section": "edge_access",
      "check": "edge_rate_limits_enabled",
      "status": "pass",
      "evidence": "skill method 6: edge rate limits and bot rules"
    },
    {
      "section": "edge_access",
      "check": "no_admin_or_db_endpoint_public",
      "status": "pass",
      "evidence": "no admin/DB panel exposed to the internet"
    },
    {
      "section": "edge_access",
      "check": "admin_access_authenticated_path_only",
      "status": "pass",
      "evidence": "quality gate: admin access only via authenticated path (tunnel/VPN/SSO), never open ports"
    },
    {
      "section": "edge_access",
      "check": "no_unauthenticated_tunnels",
      "status": "pass",
      "evidence": "no unauthenticated tunnels"
    },
    {
      "section": "edge_access",
      "check": "no_default_credentials",
      "status": "pass",
      "evidence": "skill red line: no default credentials anywhere"
    },
    {
      "section": "egress_evidence",
      "check": "egress_outbound_allowlist",
      "status": "pass",
      "evidence": "skill method 7: egress control — outbound allowlists for servers that don't need the internet"
    },
    {
      "section": "egress_evidence",
      "check": "unexpected_egress_logged",
      "status": "pass",
      "evidence": "skill method 7: log unexpected egress"
    },
    {
      "section": "egress_evidence",
      "check": "network_events_logged_denied_and_accepted",
      "status": "pass",
      "evidence": "skill method 8: network events logged (denied + accepted)"
    },
    {
      "section": "egress_evidence",
      "check": "evidence_reviewed_on_change_and_incident",
      "status": "pass",
      "evidence": "skill method 8: evidence reviewed on change and on incident"
    }
  ],
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "stamp": "NETWORK EXPOSURE AUDIT\nsystem: production-core  environment: production\nVERDICT: SOUND\n  inventory            pass\n  segmentation         pass\n  tls                  pass\n  dns_email            pass\n  edge_access          pass\n  egress_evidence      pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "endpoints": [
    {
      "id": "db-exposed",
      "host": "db.example.com",
      "port": 3306,
      "protocol": "http",
      "public": true,
      "listed": true,
      "owner": "dev",
      "service": "mysql",
      "zone": "data",
      "via": "direct",
      "tls_cert_valid": false,
      "auth_required": false
    }
  ]
}
```

Response (REST `response_text`):

```json
{
  "service": "network-exposure-audit",
  "atom_version": "0.1.0",
  "system": null,
  "environment": null,
  "verdict": "UNSOUND",
  "sections": {
    "inventory": "insufficient_evidence",
    "segmentation": "insufficient_evidence",
    "tls": "fail",
    "dns_email": "insufficient_evidence",
    "edge_access": "fail",
    "egress_evidence": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "inventory",
      "check": "exposure_inventory_current",
      "status": "missing",
      "evidence": "skill method 1: exposure inventory maintained — the list of public endpoints and what serves each"
    },
    {
      "section": "inventory",
      "check": "every_public_endpoint_owned",
      "status": "pass",
      "evidence": "every public endpoint has an owner (quality gate: every public entry has an owner)"
    },
    {
      "section": "inventory",
      "check": "no_unlisted_public_endpoints",
      "status": "pass",
      "evidence": "no public endpoint absent from the exposure inventory (if it's not on the list, it's not allowed public)"
    },
    {
      "section": "segmentation",
      "check": "trust_zones_separated",
      "status": "missing",
      "evidence": "skill method 3: segmentation — services separated into trust zones (public edge / app / data / admin)"
    },
    {
      "section": "segmentation",
      "check": "admin_plane_separate_from_public_path",
      "status": "missing",
      "evidence": "skill method 3: admin planes never share the public path"
    },
    {
      "section": "segmentation",
      "check": "default_deny_posture",
      "status": "missing",
      "evidence": "skill method 2: default-deny posture — everything closed unless a list entry justifies exposure"
    },
    {
      "section": "segmentation",
      "check": "loopback_by_default",
      "status": "missing",
      "evidence": "skill method 2: everything listens on loopback unless a list entry justifies exposure"
    },
    {
      "section": "tls",
      "check": "no_plaintext_protocol_endpoints",
      "status": "fail",
      "evidence": "plaintext protocol endpoints (skill method 4: no plaintext protocols (HTTP/FTP/telnet) on any path): db-exposed"
    },
    {
      "section": "tls",
      "check": "encrypted_endpoints_have_valid_certs",
      "status": "pass",
      "evidence": "every encrypted endpoint has a valid cert"
    },
    {
      "section": "tls",
      "check": "cert_expiry_monitored",
      "status": "missing",
      "evidence": "skill method 4: valid certs — auto-renew + monitor expiry (quality gate: cert expiry monitored)"
    },
    {
      "section": "tls",
      "check": "hsts_on_web",
      "status": "missing",
      "evidence": "skill method 4: HSTS on web"
    },
    {
      "section": "tls",
      "check": "modern_tls_min_version",
      "status": "missing",
      "evidence": "min_version=None (skill method 4: modern TLS config only — TLS 1.2 or 1.3)"
    },
    {
      "section": "dns_email",
      "check": "registrar_lock_enabled",
      "status": "missing",
      "evidence": "skill method 5: registrar lock + 2FA"
    },
    {
      "section": "dns_email",
      "check": "registrar_2fa_enabled",
      "status": "missing",
      "evidence": "skill method 5: registrar lock + 2FA"
    },
    {
      "section": "dns_email",
      "check": "dnssec_enabled",
      "status": "missing",
      "evidence": "skill method 5: DNSSEC where possible"
    },
    {
      "section": "dns_email",
      "check": "every_sending_domain_has_spf_dkim_dmarc",
      "status": "missing",
      "evidence": "domains not provided"
    },
    {
      "section": "dns_email",
      "check": "dmarc_reports_monitored",
      "status": "missing",
      "evidence": "skill method 5: monitor DMARC reports"
    },
    {
      "section": "edge_access",
      "check": "waf_or_cdn_in_front_of_web",
      "status": "missing",
      "evidence": "skill method 6: CDN/WAF in front of web; don't roll your own edge"
    },
    {
      "section": "edge_access",
      "check": "edge_rate_limits_enabled",
      "status": "missing",
      "evidence": "skill method 6: edge rate limits and bot rules"
    },
    {
      "section": "edge_access",
      "check": "no_admin_or_db_endpoint_public",
      "status": "fail",
      "evidence": "publicly exposed admin/DB endpoints (skill red line: no admin/DB panels exposed to the internet): db-exposed"
    },
    {
      "section": "edge_access",
      "check": "admin_access_authenticated_path_only",
      "status": "missing",
      "evidence": "quality gate: admin access only via authenticated path (tunnel/VPN/SSO), never open ports"
    },
    {
      "section": "edge_access",
      "check": "no_unauthenticated_tunnels",
      "status": "pass",
      "evidence": "no unauthenticated tunnels"
    },
    {
      "section": "edge_access",
      "check": "no_default_credentials",
      "status": "missing",
      "evidence": "skill red line: no default credentials anywhere"
    },
    {
      "section": "egress_evidence",
      "check": "egress_outbound_allowlist",
      "status": "missing",
      "evidence": "skill method 7: egress control — outbound allowlists for servers that don't need the internet"
    },
    {
      "section": "egress_evidence",
      "check": "unexpected_egress_logged",
      "status": "missing",
      "evidence": "skill method 7: log unexpected egress"
    },
    {
      "section": "egress_evidence",
      "check": "network_events_logged_denied_and_accepted",
      "status": "missing",
      "evidence": "skill method 8: network events logged (denied + accepted)"
    },
    {
      "section": "egress_evidence",
      "check": "evidence_reviewed_on_change_and_incident",
      "status": "missing",
      "evidence": "skill method 8: evidence reviewed on change and on incident"
    }
  ],
  "summary": "4 pass, 2 fail, 21 missing of 27 checks across six sections.",
  "stamp": "NETWORK EXPOSURE AUDIT\nsystem: None  environment: None\nVERDICT: UNSOUND\n  inventory            insufficient_evidence\n  segmentation         insufficient_evidence\n  tls                  fail\n  dns_email            insufficient_evidence\n  edge_access          fail\n  egress_evidence      insufficient_evidence\n4 pass, 2 fail, 21 missing of 27 checks across six sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "inventory": {
    "current": "not-a-boolean"
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "inventory.current",
  "detail": "inventory.current must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops, regulators |
| Regulators view | Yes |
| Checks named count vs recorded count | 27 / 27 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (SOUND, UNSOUND, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 41 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/network-exposure-audit/evidence.json` after writing |
| Output format | CommonMark markdown |

