# Gate verdict — community-support-operations

**Process line: R-18** (product-release.md — service units behind a shared
gateway carry their OWN gate verdict + evidence pack + Guardian Mesh
disposition; a gateway/batch verdict does not cover units; external UAT is
evidence input, never the verdict).

- **Unit:** `community-support-operations` — registry `org.aimlds/atom-community-support-operations`
- **Surfaces:** `POST /v1/community-support-operations` (REST) · `POST /mcp/community-support-operations` (MCP, tool via tools/list)
- **Cohort:** Batch 10 (atoms-gateway v1.1.0, live at gate time; STRIPE_MODE=test; rate null — free during trial)
- **Gate run:** 2026-11-15, per-atom gate (WS2/WS3 remediation) — pack:
  `~/workspace/release-gate-runs/atoms-per-atom-gate-2026-11-15/`
- **UAT evidence input (not the verdict):** Wave wave-5, verdict PASS (services/community-support-operations/TEST-REPORT.md)

## Verdict: PASS WITH FINDINGS

RELEASE CANDIDATE — in RC soak since 2026-11-15, graduating 2026-11-22.
Nothing in this record calls the atom a full release; graduation is the
gate thread's act on a clean soak plus this verdict.

## R-18 lines for this unit

| Line | State |
|---|---|
| Own gate verdict (this record) | PROVEN |
| Own evidence pack (batch pack + differential JSON + probe evidence) | PROVEN |
| Judgment differential (playbook §7) executed live | PROVEN |
| Attacker-view leg (playbook §6, gateway auth/key surfaces) | PROVEN (gateway-level leg; see pack) |
| Documentation lines incl. N-10 (WS1 workstream) | OPEN — WS1 lane in flight; not this gate's evidence |
| Guardian Mesh disposition | NOT RUN — Spec Inputs filed (GMSI-167); see below |

## Judgment differential (§7)

Corpus: the atom's recorded external-verification battery (verification/work/community-support-operations/cases.json), re-executed LIVE by this gate against https://atoms.pipavia.com (REST + MCP faces), plus one gate-added single-violation extension case.
- full-pass (full-pass): http 200, outcome 'COMMUNITY_SUPPORT_READY', grade PASS — determinism byte-identical: True; MCP↔REST parity: True; failing-set basis: expect-names
- violations (violations): http 200, outcome 'COMMUNITY_SUPPORT_NOT_READY', grade PASS — MCP↔REST parity: True; failing-set basis: expect-names
- sparse (sparse): http 200, outcome 'INSUFFICIENT_EVIDENCE', grade PASS — failing-set basis: expect-names
- malformed (malformed): http 422, outcome None, grade PASS
- extension (single-violation, §7 calibration analog): mutated `intake.messages_tracked` → outcome 'COMMUNITY_SUPPORT_NOT_READY' (fail class 'COMMUNITY_SUPPORT_NOT_READY'), failing ['every_message_tracked'] — state: clean. fail-class outcome; failing set non-empty and within the violations failing set (expect names or UAT-live names)
§7 mapping for this product class: identity-imitation and reputable-parent items are N/A (manifests carry no host/brand identity; atom-name spoofing/traversal is covered by the attacker-view leg); semantic-direction is exercised as present-but-false evidence (violations → fail) vs absent evidence (sparse → INSUFFICIENT_EVIDENCE, never pass, never fail); benign twin = the full-pass manifest; calibration = the sparse case plus the single-violation extension; cross-surface = MCP↔REST parity above.

## Extended test families

| Family | State | Basis |
|---|---|---|
| Software testing | PROVEN | Builder suites (Python oracle + TS port per atom; gateway suite green at every batch staging), oracle↔port differential (per-atom case counts in REPLICATION-LOG.md), and this gate's live replay below. |
| Network vulnerability | NOT RUN | Kali bench not stood up in this lane (no host) — same named gap as the atoms-gateway v1.0.0/v1.1.0 gates. The §6 attacker-view probe set was run live as a separate leg; it does not substitute for the Kali family. |
| User security | PROVEN | Attacker-view leg (this pack): keyless/wrong-key 401 on both faces, session wall 401s, webhook signature rejection in three shapes, signup fuzz + uniform-response shape, refund fences 401/404/422. Scope fence 403 proven at each batch's deploy probes (REPLICATION-LOG.md). |
| Data protection | PROVEN | Keys are HMAC-derived and never stored (fingerprint lookup only); magic tokens sha256-only at rest; append-only ledger. Carried Low F-G2 (docs do not yet describe an export/deletion path) applies to this family. |
| Connection protection | NOT RUN | Deep TLS/cipher verification (testssl.sh class) not run — Kali bench not stood up. Observable posture only: HTTPS surface behind Cloudflare edge; recorded as evidence input, not proof. |
| Encryption | PROVEN | HMAC-SHA256 key derivation, sha256 token storage, TLS in transit. No at-rest payload-encryption claim is made by the product; manifests are processed statelessly. |
| Zero-knowledge | N/A | No zero-knowledge proofs are produced, verified, or claimed anywhere in this atom's surface. |
| Zero trust | PROVEN | Deny-by-default on every call: authentication + per-atom scope checked per request on both faces (401/403 probes); no implicit trust between the MCP and REST faces. |
| UAT | PROVEN | External verification (Gemini case design + judgment; DeepSeek second read where the atom computes) — recorded as UAT evidence input under R-18, never as the gate verdict. See the UAT citation in this record. |
| Proof of concept | PROVEN | Gateway billing-proof cycle and prorated-refund proof cycle executed live end-to-end 2026-11-15 (atoms-gateway v1.1.0 gate pack); per-atom live golden calls in every UAT wave and in this gate's replay. |
| Security hardening | PROVEN | Input-validation fences (422 invalid_input naming the field), per-atom kill switch (config atom_enabled), per-key rate limits — all live-probed in this run or at deploy. The Kali hardening scan sub-leg is NOT RUN (see Network vulnerability). |
| Data isolation | PROVEN | Per-user balances and append-only ledger rows keyed by user in D1; internal vs external usage recorded in separate tables; per-atom kill switches isolate a single atom without touching the fleet. |
| User isolation | PROVEN | Balance/keys surfaces take identity from the session or key only — no object-id parameters exist to cross users (no IDOR surface); session wall probed live in this run. |
| Boundaries | PROVEN | Manifest boundary enforced (type violations → 422, the F1 fix class); malformed JSON, oversized body, wrong-method and atom-name traversal probes in this run's attacker-view leg. |
| Key generation | PROVEN | atm_ keys derived as HMAC-SHA256(master_secret, email | issued_at); the value is never stored; the record holds fingerprint, scopes, revocation. The tester key used by this gate was issued through the real POST /v1/keys endpoint. |
| GPG/PGP | N/A | No GPG/PGP is used anywhere in the product (no PGP signing or encryption surface exists to test). |
| Encryption key-management testing | NOT RUN | Arch crypto bench not stood up. Partial evidence only: the master secret lives in Worker secrets; key rotation is by re-issuance (proven for the Stripe key in the v1.1.0 cycle). Master-secret rotation would invalidate derived keys by construction and has not been exercised live. |

Family counts for this unit: PROVEN 12 / N/A 2 / NOT RUN 3 of 17.

## Findings carried (fleet-level, apply to this unit)

- **F-G1 (must-gate, repo level):** the release-gate scanner at repo root
  returns BLOCKED on the CI check — no root `.github/workflows`; CI is
  defined in the gateway subtree but has never run, and the repo is
  unpublished (local-only) pending the owner's publication decision.
  Substance unchanged since the atoms-gateway v1.0.0 gate (its F1).
  Owner-decision-blocked; named here, never silently passed.
- **F-G2 (Low, carried from v1.0.0/v1.1.0):** top-level docs do not yet
  describe a data export/deletion path (scanner user-protection signal).
- **F-G3 (Low, CONFIRMED this run — §8 disproof pass by a separate
  validator lane):** no security headers (HSTS, CSP, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy) on any gateway surface,
  HTML or JSON; no header-setting code exists in the gateway source
  (index.ts:58-61, 95-97, 113-115, 125-129). Bounded effect: the
  catalogue and redeem pages can be framed; the token-bearing redeem
  URL has no Referrer-Policy; the redeem-success page displays the
  session token without CSP/frame protection. Mitigations on record:
  the redeem token is single-use and burned before session mint; the
  catalogue sets no cookies; the session cookie itself is correctly
  flagged (HttpOnly; Secure; SameSite=Lax — index.ts:129, that
  sub-candidate REJECTED). Fix belongs to the next gateway patch
  (replication lane): set the five headers on HTML responses at
  minimum. Evidence: pack.md §attacker-view + validator record in the
  pack's evidence.

## Guardian Mesh disposition (WS3)

**NOT RUN.** No Guardian Mesh work order covers the atoms surface; the
mesh's behaviour-proven capabilities (release-evidence certification,
WO wire proofs) are scoped to its own work orders and run operator-side
under Cloudflare Access, and no GM probe is behaviour-proven for an
external product surface (the RC register records the same limitation
for other products, 2026-10-19). The Gemini/DeepSeek external testing is
UAT and is NOT Guardian Mesh evidence. Spec Inputs filed: **GMSI-167**
(see the pack's gmsi.md) — per-atom verdict certification: GM must be
able to take (atom id, manifest hash, verdict, checks summary, pack
hash) and issue a sealed ALLOW/BLOCK proof whose tamper verifies
NOT VALID, with certificate issue/supersede/revoke tied to gate
verdicts and the atom kill switch.
