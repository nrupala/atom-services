# Conduit Atoms gateway

One Cloudflare Worker serving every live product atom at
**atoms.pipavia.com** — see `DESIGN.md` for the architecture and
`../../BUILD-LOG.md` for the build record.

## Surfaces

- `GET /health` — ungated liveness.
- `GET /` — the catalogue / pricing page; `GET /api.json` its
  machine-readable twin. Both render from the generated rate config.
  Every live row also carries the atom's does-not-cover line and
  measured trace (generated from the atoms' SERVICE.md records and
  the recorded verification runs, incl. the not-run / excluded
  legs); a disabled atom is absent from the page and status-only
  in the feed.
- `GET /SKILL.md` — agent onboarding: discovery, the key flow,
  verdict reading, error shapes. Served verbatim from the
  repo-root `SKILL.md` (generated module).
- `POST /mcp/<atom-service>` — MCP streamable-HTTP face.
- `POST /v1/<atom-service>` — plain HTTP face, same contract.
- `POST /v1/signup` → magic-link sign-in → `POST /v1/keys {atom}`
  issues the caller's one gateway key with that atom's scope.
- `GET /v1/balance`, `POST /v1/balance/checkout` — prepaid balance
  and Stripe-hosted pack purchase; `POST /v1/stripe/webhook`
  grants/reverses on Stripe events.

## Keys

One gateway key per user (`atm_1_` + HMAC-SHA256 of the server
master secret over `email | issued_at`), never stored; per-atom
access is a scope on the key record. The master secret exists only
as the `ATOMS_MASTER_SECRET` Worker secret binding.

## Develop

```bash
npm install
npm test          # tsc + node --test (oracle-port + gateway suites)
npm run build     # production bundle into dist/
npm run sync-rates  # regenerate src/generated.ts from the contracts
```

Rates are never edited by hand: the source of truth is each atom's
`services/<atom>/contract.yaml` pricing block; `tools/sync-rates.mjs`
generates the config the gateway charges and displays from.

## Deploy

House Cloudflare API route (site-integrity declaration first):
build, then upload `dist/` with bindings `DB` (D1 `atoms-state`),
`PUBLIC_BASE_URL`, `STRIPE_MODE`; secrets (`ATOMS_MASTER_SECRET`,
`RESEND_API_KEY`, and the Stripe bindings when armed) are placed as
Worker secret bindings only — never in this repo.
