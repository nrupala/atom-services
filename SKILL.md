<!--
SPDX-FileCopyrightText: 2026 2351485 ALBERTA INC.

SPDX-License-Identifier: Apache-2.0
-->

# Skill: atoms — bounded judgment services for agents

Use this skill when you are an AI agent and you need a **bounded,
checkable judgment** — a design reviewed, a record audited, a claim
verified, a plan stress-tested — produced deterministically from
evidence you declare, instead of an open-ended opinion. The atoms
fleet is a set of small services ("atoms") behind one gateway. Each
atom takes one declared input and produces one deterministic
result. Most atoms are manifest-check atoms: they take a declared
record (a "manifest"), run a fixed set of named checks over it, and
return a verdict artifact — the verdict, per-section results, and
one evidence string per check. A few atoms instead return a
deliverable (sanitized text, a token estimate, a schema-enforcement
result). Same input in, byte-identical artifact out.

## When to reach for an atom instead of judging it yourself

- "Is this design / record / plan sound?" where the criteria are
  checkable — an atom returns the same verdict for the same record
  every time, with the failing checks named. Your own read varies;
  the atom's does not.
- You need the negative space stated: every atom publishes a
  **does-not-cover line** (in the catalogue and in the feed) naming
  what it does not do. Read it before you call — if your question
  sits in the does-not-cover space, the atom is the wrong tool.
- Reach for your own judgment instead when the question needs facts
  from the world: atoms judge **declared** evidence only. They fetch
  nothing, verify nothing against reality, and contact no one.

## The workflow (discover first, call last)

1. **Discover the fleet.** `GET https://atoms.pipavia.com/api.json`
   is the machine-readable census: one row per atom with `name`,
   `display_name`, `description`, `category`, `deliverable_type`,
   `endpoints`, `pricing`, `status`, a `documentation` link when the
   atom is documented, its `does_not_cover` line, and its
   `measured_trace` (what was actually run against it, and what was
   not) — the documentation link, the does-not-cover line and the
   measured trace are present on live rows only. The human
   catalogue is `GET https://atoms.pipavia.com/`.
   Per-atom documentation: `GET https://atoms.pipavia.com/docs/<name>`.
   Registry listings: `org.aimlds/atom-<name>` in the MCP registry.
   Read counts and status from the feed, never from memory — atoms
   are added and, rarely, disabled.
2. **Check the atom is live and in scope for your question.** A row
   with `status: "live"` serves. A disabled atom's feed row still
   carries its `name`, `display_name`, `description`, `category`,
   `deliverable_type`, `version`, `endpoints` and `pricing`, with
   `status: "disabled"` — what is withheld is exactly the
   `documentation` link, the `does_not_cover` line and the
   `measured_trace`. A disabled atom does not appear in the HTML
   catalogue at all, its documentation page answers 404, and its
   calls answer `503 atom_disabled`. Read the row's
   `does_not_cover` line and the atom's documentation before you
   build a manifest.
3. **Get one gateway key.** Keys are self-serve:
   - `POST /v1/signup` with `{"email": "<you>"}` — a sign-in link is
     emailed to that address (valid 15 minutes, single-use: it is
     burned the first time it is opened).
   - Open the link (`GET /v1/auth/redeem?token=…`) — the page shows
     your session token (also set as a 7-day session cookie).
   - `POST /v1/keys` with header `Authorization: Bearer <session>`
     and body `{"atom": "<atom-name>"}` — returns your gateway key
     (`atm_…`) and its scopes. **One key works across the fleet**;
     call `POST /v1/keys` once per atom you intend to use and that
     atom's scope is added to the same key. `GET /v1/keys` re-reads
     the key and its current scopes; `POST /v1/keys/revoke` revokes
     **and reissues** — the old key stops working at once, a new key
     is returned in the response, and your scopes carry over to it.
   - The hyphenated name (`release-readiness-verdict`) is the atom's
     address; the scope is recorded in underscore form
     (`release_readiness_verdict`).
4. **Call the atom, on either face.** REST:
   `POST /v1/<atom-name>` with `Authorization: Bearer <key>` and the
   manifest as the JSON body. MCP: `POST /mcp/<atom-name>` — the
   atom's single tool is named with underscores
   (`release_readiness_verdict`). The whole MCP surface is
   key-gated: every MCP request — `initialize`, `tools/list` and
   `tools/call` alike — needs the gateway key carrying that atom's
   scope, checked before the method is dispatched; without a valid
   key the answer is `401 {"error":"missing or invalid gateway API
   key"}`, and a key without the scope gets `403`. On a disabled
   atom the same key and scope checks run first; then `tools/list`
   answers 200 with an empty tools array, while `tools/call` and
   `initialize` answer the literal `503` `atom_disabled` refusal.
   Both faces return the identical artifact for the identical
   input.
5. **Read the result, not just the headline.** What a call returns
   depends on the atom's kind. **Manifest-check atoms** (most of
   the fleet) return a verdict artifact: `service`, `atom_version`,
   `verdict`, per-section results (`sections` — pass / fail /
   insufficient per section; the release-readiness atom names this
   field `bars`), `checks` — every check with its `status` and the
   `evidence` string that decided it — a `summary`, and a `stamp`:
   the same verdict rendered as fixed-format text. **Deliverable
   atoms** (for example `markdown-sanitizer`, `token-estimator`,
   `json-schema-enforcer`) instead return the deliverable itself —
   the sanitized text and its removal report, the token estimate
   with its method stated, the validity result with every violation
   listed — with the result fields named in the atom's
   documentation, plus a `stamp`; they carry no `verdict`,
   `sections` or `checks`. Every artifact, of either kind, carries
   the `stamp`. Verdict vocabulary is per-atom, declared in each
   atom's documentation; the families include `<SUBJECT>_SOUND` /
   `<SUBJECT>_NOT_SOUND`, `<SUBJECT>_READY` / `<SUBJECT>_NOT_READY`,
   `GUARDED` / `NOT_GUARDED`, `STAMPED` / `NOT_STAMPED`, and `SOUND`
   / `UNSOUND`. Manifest-check atoms share one further outcome:
   **`INSUFFICIENT_EVIDENCE`** — the declared record lacked the
   evidence a check needed. Absent evidence never passes and never
   fails; it reports as insufficient. Treat a negative verdict's
   failing checks as the work list; treat INSUFFICIENT_EVIDENCE as
   a request for the missing declarations, not as a defect finding.

## Error shapes (the gateway's served shapes; the 401, 403 and 429 bodies are recorded verbatim from live probes)

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok":false,"error":"unauthorized","detail":"missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the same failure is the plain body `{"error":"missing or invalid gateway API key"}` — an HTTP 401 body, not a JSON-RPC envelope. |
| 403 | `{"ok":false,"error":"scope_required","detail":"this key does not hold the <scope> scope; issue it for this atom first"}` | Your key lacks this atom's scope — `POST /v1/keys` for the atom, then retry. |
| 404 | REST: `{"ok":false,"error":"not_found", …}` · MCP: `{"error":"unknown atom"}` | Unknown atom name (hyphenated form; the underscore form is not an address). |
| 422 | `{"ok":false,"error":"invalid_input", …}` naming the field | The manifest failed validation; the body names the field. Fix the manifest, not the key. |
| 429 | `{"ok":false,"error":"rate_limit","detail":"per-key limit 60/minute for <atom> exceeded"}` | Per-key, per-atom limit: 60 calls/minute. Back off to the next minute window. |
| 503 | `{"ok":false,"error":"atom_disabled", …}` | The atom is kill-switched off. This is the atom's state, not your key's fault; its feed row shows `status: "disabled"` without the documentation link, does-not-cover line or measured trace, and it is absent from the HTML catalogue. |

## Pricing

Each feed row's `pricing` block is the price source of truth
(`unit`, `rate_micro`, `rate_status`). At the time of writing every
atom's rate is unset (`rate_micro: null`), so calls meter at zero.
When a rate is set it appears in the feed first — read the row
before you rely on a price.

## Rules of the house

- Atoms judge declared records. A verdict is sound **on the
  caller's declared evidence** — it is never a claim that a declared
  value is true in the world. The does-not-cover line on every live
  row is part of the contract: quote it when you relay a verdict.
- Determinism is a tested property, not a promise: the external
  battery behind each row's `measured_trace` re-ran the atom's
  cases live, including a determinism leg (same input twice,
  byte-identical output) and an MCP↔REST parity leg.
- The trace names its own gaps: `not_run` legs (Guardian Mesh
  disposition among them) and `excluded` legs are printed on the
  row, never silently dropped. A trace with a named not-run leg is
  an honest trace, not a failed one.
- One key, per-atom scopes, deny-by-default: a call without the
  scope fails closed with 403; there is no implicit trust between
  the REST and MCP faces.
- Setup needs no human in the loop: signup, key issue, and calls
  are all API-driven (the sign-in link arrives by email).

---

*Agentic Packaging Standard conformance (2026-11-16): explicit
uncertainty — met (every live row carries its does-not-cover line
and its measured trace with not-run / excluded legs named); composite
task tools — open (atoms are single-judgment services by design;
composition is the caller's workflow); agent onboarding — met by
this file, served at `https://atoms.pipavia.com/SKILL.md`;
zero-compile install — met (hosted services; nothing to install);
measured traces — met (per-atom traces on the catalogue and in the
feed, generated from the recorded verification runs); terminal-story
docs — met (per-atom documentation carries worked examples recorded
from real runs).*
