# Rails — Contracts

The contract is what makes an atom a service instead of a document:
a caller (human, agent, or Wright) sends the contract's inputs and
receives the contract's artifact, metered per the contract's unit.

## contract.yaml — required fields

- `service_name`, `display_name`, `tier`, `status`, `atom_version`
- `sources` — register provenance (skill and/or knowledge atom #)
- `binding` — `skill`, `skill_path`, `skill_version`, and the R1 rule
- `deliverable_type` — VERDICT / CHECK / MAP / STAMP / REPORT /
  REVIEW / EVALUATION / VALIDATION / DELIVERABLE
- `endpoints` — from the register's endpoint fit (API / MCP / agent /
  human)
- `keys` — `namespace`, `prefix`, `issuance`, `scope` (per-atom keys,
  see `billing.md`)
- `rate_limit` — `per_key_per_minute`, `per_key_per_day`, `status`
- `pricing` — `unit`, `rate` (null until decided), `rate_status`
  (`measured | consensus | prompt-rate-fallback | pending`), protocol
  pointer
- `self_use` — R3 verdict + the named workflow
- `qualification_tests` — the register's T1–T6 results
- `internal_caller` — the R2 statement

## Call contract (all atoms)

- **Request:** JSON object matching the atom's input schema (defined
  in the atom's SERVICE.md / implementation when built out), sent to
  the MCP tool or `/v1/<service-name>` with
  `Authorization: Bearer <this atom's key>`.
- **Response:** JSON object carrying at minimum `service`,
  `atom_version`, the artifact itself, and a `summary`. Verdict-type
  atoms also carry the machine verdict word and the per-part
  evidence, as atom #1's implementation does.
- **Errors:** 401 (missing/invalid key for THIS atom), 429 (per-key
  rate limit, limit named), 402 (balance exhausted — **SPEC**, lands
  with the billing core), 422 (input fails the atom's schema, field
  named). A failed call is not metered; a delivered artifact is.
- **Determinism where claimed:** an atom whose core is deterministic
  says so in its SERVICE.md and its tests prove the same input gives
  the same artifact. An atom with a model inside declares its model
  and its token accounting in its contract at build-out.

## Internal-caller contract (R2)

Same request/response shape, internal key (namespace suffix
`_internal`), zero price, every call written to the internal cost
ledger with the atom's measured per-call cost attached. Internal
volume is reported alongside external volume in the atom's uptake
reads; it is never counted as revenue or as an external sale.

## Versioning

- `atom_version` bumps only after the atom re-verifies against its
  bound skill (R1 regression) or its contract changes.
- A breaking input/output change is a major bump and a new listing
  version; the old version's keys keep working until a published
  sunset date — open public usage means strangers build on these
  contracts, so contracts are not broken silently.
