# Batch 23 — routed finding, split verdict, cure (2026-11-18)

Routed by the Product Atoms lane; surfaced by the Conduit lane's uplift
probes. Batch 23 (markdown-sanitizer, token-estimator,
json-schema-enforcer) was Arjun's own-hands build of 2026-11-17; the
verification and cure below are also his, run the same day the finding
landed. Probe scripts: `~/workspace/.tools/b23_finding_verify.py`,
`b23_finish.py`, `b23_fence2.py` (outputs in the same directory).

## Item 2 — kill-switch census gap: CONFIRMED, CURED

The three atoms carried no `atom_enabled:<service>` config rows. The
call path treats a missing row as enabled (`value !== "0"`), so the
three served under the default-on rule and the kill switch could not
have stopped them. Census at finding time: 142 rows (135 enabled /
7 disabled) against 145 registered atoms.

Root cause: migration 0001 seeds config rows only for the atoms known
at migration time; the Batch 23 deploy registered the atoms without
seeding their rows.

Cure (2026-11-18, live D1): inserted the three rows at '1' (their
serving state — behaviour unchanged). Census after: **145 rows,
138 enabled / 7 disabled**; the health endpoint's disabled set still
reads exactly the Director's seven. The Batch 23 RC soak clock (to
2026-11-24) is not restarted: no code changed and no serving behaviour
changed; the cure makes an existing control real.

Standing rule from this item: every future batch's deploy checklist
includes seeding `atom_enabled` rows for its atoms, proven by a census
diff (registered atoms == config rows) in the deploy record.

## Item 1 — scope gap: NOT SUSTAINED as stated; fence proven

The claim: the three atoms answer any valid gateway key regardless of
scopes; the external-verification key (said to hold no Batch 23
scopes) received 200 / 200 / 422.

The premise about the key is factually wrong. The gateway has ONE key
per account; `POST /v1/keys` grants the named atom's scope on that key
and scopes only accumulate. The external-verification key holds **145
scopes — every registered atom, the three included** (the Batch 23
scopes were granted to it during the Batch 23 keyed probes, whose
record reads "tester scopes 142 → 145"). Its 200 / 200 / 422 responses
were authorized calls; the probe could not have detected a missing
fence. (A first re-probe from this desk repeated the same construction
error before the key model was read in `src/auth.ts` — recorded here
so the mistake is not repeated silently.)

Decisive probe (fresh account `fence-probe@aimlds.org`, created for
this test): key issued for release-readiness-verdict only; the issued
scope set was exactly `[release_readiness_verdict]` in both the
issuance response and D1. Results on the live surface:

- control atom (release-readiness-verdict): fence passed, HTTP 200
- markdown-sanitizer: **403 scope_required**
- token-estimator: **403 scope_required**
- json-schema-enforcer: **403 scope_required**
- keyless call: 401

The fence binds for all three atoms, as it did in the Batch 23
pre-grant check (run when the tester key genuinely lacked the three
scopes). Probe residue: the probe key, its scopes and its session are
deleted; one inert `users` row for the probe address remains (no key,
no session, no scopes; its deletion is blocked by the metering rows
its calls created, which are kept as evidence).

Standing rule from this item: a scope-fence verification is decisive
only with a key that lacks the batch's scopes — a fresh account or the
pre-grant state. The fleet's tester key accumulates every scope and
can never again be used as fence evidence after a grant.

## Disposition

- Item 2: cured and census-proven the same day.
- Item 1: not sustained; the authorization contract holds.
- Both standing rules above bind the next batch's deploy record.
