# Gate verdict — token-estimator

**Process line: R-18** (product-release.md — service units behind a shared
gateway carry their OWN gate verdict + evidence pack + Guardian Mesh
disposition; a gateway/batch verdict does not cover units; external UAT is
evidence input, never the verdict).

- **Unit:** `token-estimator` — registry `org.aimlds/atom-token-estimator`
- **Surfaces:** `POST /v1/token-estimator` (REST) · `POST /mcp/token-estimator` (MCP, tool via tools/list)
- **Cohort:** Batch 23 (atoms-gateway v1.1.0, integration deployment `5ac5dfdf7d1a469f8522f34b3c9f484f` + docs-emit deployment `c8b9f8e8f2744fa9869472b8482efc26`, live at gate time; STRIPE_MODE=test; rate null — free during trial)
- **Gate run:** 2026-11-17, per-atom gate by the building seat at deploy
  (fleet order: deploy → live gate). Evidence: the Batch 23 entry in
  REPLICATION-LOG.md (deploy record, live keyless probe record, suite
  results) + the golden fixtures under
  `rails/gateway/test/fixtures/token-estimator--*.json`.
- **Regulatory screen (U-13):** YES — publishable without a per-unit
  ruling; see CENSUS-FOLLOWUP-2026-11-17-BATCH23-SCREEN.md.
- **UAT evidence input (not the verdict):** none yet — no external
  verification wave has run for Batch 23; TEST-REPORT.md comes from
  that wave when it runs.

## Verdict: PASS WITH FINDINGS

RELEASE CANDIDATE — in RC soak since 2026-11-17, graduating 2026-11-24.
Nothing in this record calls the atom a full release; graduation is the
gate thread's act on a clean soak plus this verdict.

## R-18 lines for this unit

| Line | State |
|---|---|
| Own gate verdict (this record) | PROVEN |
| Own evidence pack (deploy record + suite results + live keyless probe record, REPLICATION-LOG.md Batch 23) | PROVEN |
| Judgment differential (playbook §7) executed live | PROVEN — live replay 2026-11-17, 14/14 probe checks across the cohort (below) |
| Attacker-view leg (playbook §6, gateway auth/key surfaces) | PROVEN — keyless leg live at deploy (401 on REST and MCP faces, held-atom 404, F-G3 header set on `/`) + keyed leg live at this gate (scope fence 403 scope_required before grant — probed on THIS atom, 422 naming the field, disabled atom 503 atom_disabled) |
| Documentation lines incl. N-10 (WS1 workstream) | PROVEN — DOCUMENTATION.md + USER-GUIDE.md written at build (worked examples are verbatim recorded runs); docs-emit deployment `c8b9f8e8f2744fa9869472b8482efc26` live-verified: GET /docs/token-estimator 200 and the catalogue feed entry carries the documentation field |
| Guardian Mesh disposition | NOT RUN — Spec Inputs filed (GMSI-184, Batch 22 cohort, covers the atoms surface); see below |

## Judgment differential (§7)

Corpus: the builder golden fixtures for this atom (6 fixtures, generated
from the Python oracle) plus one gate extension case — labelled
builder-fixture corpus — executed BOTH in-suite on the exact deploy
tree (gateway suite 6,417/6,417 green, in-process through the real
call path) AND live against https://atoms.pipavia.com at this gate
(2026-11-17; tester key issued through the real POST /v1/keys under a
D1-seeded session — the fleet's Batch 9 probe method; session deleted
after). Live parity is judged on the artifact: the HTTP face returns
the artifact plus its rendered `stamp`, which the fixture does not
carry; with the stamp set aside, every live body is byte-identical to
its fixture expectation. Cohort probe run: 14/14 checks PASS,
including the scope fence probed on this atom (403 scope_required
before the grant), same-key scope grants, and the disabled-atom 503
regression.

- Fixtures: hello, empty, sentence, numbers-cjk, claude-family,
  messages — all parity-exact against the oracle.
- Extension case: a 17-character CJK sentence repeated 20 times with
  model_family `gpt` — exercises the CJK segment weighting at volume
  under a non-default family; parity-exact against the oracle.
- Product-truth note: every result carries the method line ("segment-
  weighted heuristic, factor table v1 — estimate, not a tokenizer
  count") and a ±15% range; the atom never presents its estimate as a
  tokenizer count. That labelling is part of the shipped surface and
  was verified in the fixture expectations.

§7 mapping for this product class: identity-imitation and
reputable-parent items are N/A (manifests carry no host/brand identity;
atom-name spoofing/traversal is covered by the attacker-view leg);
benign twin = the hello fixture; calibration = the CJK extension case
(a segment class whose weighting differs most from the Latin baseline);
cross-surface = MCP↔REST parity proven in-suite; the cohort's live
MCP parity was probed on markdown-sanitizer (same call path) — this
atom's live face proof is REST.

## Extended test families

| Family | State | Basis |
|---|---|---|
| Software testing | PROVEN | Python oracle suite (15 tests) + TS port tests + 6 golden fixtures with oracle↔port parity; gateway suite 6,417/6,417 green on the deploy tree, 6,705/6,705 on master. |
| Network vulnerability | NOT RUN | Kali bench not stood up in this lane (no host) — same named gap as the atoms-gateway v1.0.0/v1.1.0 gates. The §6 attacker-view keyless leg was run live as a separate leg; it does not substitute for the Kali family. |
| User security | PROVEN | Keyless 401 on both faces probed live at deploy; scope fence live-probed on this atom at this gate (403 scope_required before grant, 200 after); session wall proven in-suite on the deploy tree. |
| Data protection | PROVEN | Keys are HMAC-derived and never stored (fingerprint lookup only); magic tokens sha256-only at rest; append-only ledger. Carried Low F-G2 (docs do not yet describe an export/deletion path) applies to this family. |
| Connection protection | NOT RUN | Deep TLS/cipher verification (testssl.sh class) not run — Kali bench not stood up. Observable posture only: HTTPS surface behind Cloudflare edge; recorded as evidence input, not proof. |
| Encryption | PROVEN | HMAC-SHA256 key derivation, sha256 token storage, TLS in transit. No at-rest payload-encryption claim is made by the product; manifests are processed statelessly. |
| Zero-knowledge | N/A | No zero-knowledge proofs are produced, verified, or claimed anywhere in this atom's surface. |
| Zero trust | PROVEN | Deny-by-default on every call: authentication + per-atom scope checked per request on both faces (keyless 401s live-probed; scope fence in-suite); no implicit trust between the MCP and REST faces. |
| UAT | NOT RUN | No external verification wave has run for Batch 23. When it runs, its TEST-REPORT.md is recorded as UAT evidence input under R-18, never as the gate verdict. |
| Proof of concept | PROVEN | Gateway billing-proof cycle and prorated-refund proof cycle executed live end-to-end 2026-11-15 (atoms-gateway v1.1.0 gate pack); this atom's golden call + extension case executed live at this gate. |
| Security hardening | PROVEN | Input-validation fences (422 invalid_input naming the field — in-suite for this atom), per-atom kill switch (config atom_enabled), per-key rate limits. The Kali hardening scan sub-leg is NOT RUN (see Network vulnerability). |
| Data isolation | PROVEN | Per-user balances and append-only ledger rows keyed by user in D1; internal vs external usage recorded in separate tables; per-atom kill switches isolate a single atom without touching the fleet. |
| User isolation | PROVEN | Balance/keys surfaces take identity from the session or key only — no object-id parameters exist to cross users (no IDOR surface); session wall proven in-suite. |
| Boundaries | PROVEN | Manifest boundary enforced (type violations → 422 naming the field, in-suite); malformed JSON, oversized body, wrong-method and atom-name traversal probes are gateway-level evidence from the v1.1.0 gate pack. |
| Key generation | PROVEN | Live issuance exercised at this gate through the real POST /v1/keys endpoint (D1-seeded session, deleted after): the tester key was granted this atom's scope and re-derived identically on each grant (same key value returned). Construction: atm_ keys derived as HMAC-SHA256(master_secret, email \| issued_at); the value is never stored; the record holds fingerprint, scopes, revocation. Tester scopes read back in D1: 142 → 145 for the cohort. |
| GPG/PGP | N/A | No GPG/PGP is used anywhere in the product (no PGP signing or encryption surface exists to test). |
| Encryption key-management testing | NOT RUN | Arch crypto bench not stood up. Partial evidence only: the master secret lives in Worker secrets; key rotation is by re-issuance (proven for the Stripe key in the v1.1.0 cycle). Master-secret rotation would invalidate derived keys by construction and has not been exercised live. |

Family counts for this unit: PROVEN 11 / N/A 2 / NOT RUN 4 of 17.

## Findings

- **F-B23-1 (cohort-level) — CLOSED 2026-11-17:** the keyed live
  replay was first recorded NOT RUN: the magic-link session route is
  closed to the building seat (the link value is redacted in every
  email read channel, and the cloud browser is blocked from the
  mailbox by Google). It was then run the fleet's own way — the
  Batch 9 probe method: a session seeded directly in D1 for the
  external-verification tester identity, a real key issued through
  POST /v1/keys, the full probe set executed live (14/14 PASS), the
  session deleted after. No mailbox access is involved in that
  method, and no credential was read from any email.
- **F-G2 (Low, carried from v1.0.0/v1.1.0):** top-level docs do not yet
  describe a data export/deletion path (scanner user-protection signal).
- **F-G3 (Low) — CLOSED by the Batch 14 deploy (2026-11-15) and carried
  by construction in this cohort's deploys:** the gateway ships the
  security-header set (HSTS, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy) on every response; verified
  present on `/` at this cohort's deploy probes. GMSI-173 stands as
  filed — the posture is shipped; the mesh proof is the open leg.

## Guardian Mesh disposition (WS3)

**NOT RUN.** No Guardian Mesh work order covers the atoms surface; the
mesh's behaviour-proven capabilities (release-evidence certification,
WO wire proofs) are scoped to its own work orders and run operator-side
under Cloudflare Access, and no GM probe is behaviour-proven for an
external product surface (the RC register records the same limitation
for other products, 2026-10-19). The Gemini/DeepSeek external testing
is UAT and is NOT Guardian Mesh evidence. Spec Inputs filed: **GMSI-184**
(Batch 22 cohort — per-atom verdict certification: GM must be able to
take (atom id, manifest hash, verdict, checks summary, pack hash) and
issue a sealed ALLOW/BLOCK proof whose tamper verifies NOT VALID, with
certificate issue/supersede/revoke tied to gate verdicts and the atom
kill switch). No new filing is needed for this cohort.
