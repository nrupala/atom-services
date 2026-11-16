# Catalogue documentation link — STAGED CHANGE (for the Batch 13 deploy stream)

**Status:** STAGED — not applied. The gateway tree belongs to the
replication lane; this document is the exact change for that lane to
apply and deploy through the house path (declare → deploy → certify →
close). Prepared by the WS1 documentation lane, 2026-11-15.

**Requirement (owner, 2026-11-15 20:22 MST):** the catalogue page
gains a per-atom documentation link. Every live atom's full
documentation (`services/<atom>/DOCUMENTATION.md`, WS1) gets a public
home and the catalogue + `/api.json` point at it.

## Serving shape — the gateway serves the docs itself

The gateway already renders its public surfaces from a generated
module built from repo sources (`tools/sync-rates.mjs` →
`src/generated.ts` → `src/catalogue.ts`; displayed == charged,
mechanically). Documentation follows the identical pattern, so the
served doc is mechanically the repo doc — never a hand-copied page
that can drift:

1. **New build tool `tools/sync-docs.mjs`** (sibling of
   `sync-rates.mjs`): for every atom in the catalogue it reads
   `services/<atom>/DOCUMENTATION.md` and emits
   `rails/gateway/src/docs.generated.ts` exporting
   `DOCS: Record<string, { title: string; markdown: string }>`.
   **Build guard:** if a live (catalogued) atom has no
   `DOCUMENTATION.md`, the tool exits non-zero and names the atom —
   a catalogue link can therefore never point at a missing doc, and
   a future batch cannot go live undocumented without the build
   saying so.
2. **New route module `rails/gateway/src/docs.ts`**: exports
   `docPageHtml(serviceName, baseUrl)` — renders the atom's markdown
   to a standalone HTML page (semantic headings, `<html lang="en">`,
   page `<title>` = the doc's H1, a back-link to the catalogue, and
   the standard seller strip: "Sold by 2351485 ALBERTA INC. (AIMLDS)
   · Payments by Stripe"). Markdown rendering: a small CommonMark
   subset renderer inside `docs.ts` (headings, paragraphs, lists,
   tables, fenced code, links, inline code/emphasis) — the docs are
   authored to that subset. WCAG 2.2 AA structure per the AppDoc
   Studio standards table (headings hierarchy, contrast-safe palette
   matching the catalogue page).
3. **`rails/gateway/src/index.ts`**: one new route case beside the
   `/api.json` case —
   `GET /docs/<service-name>` → 200 `docPageHtml(...)` for a
   catalogued atom; 404 plain text otherwise. No auth (public docs,
   same posture as the catalogue itself).

## The link itself — `rails/gateway/src/catalogue.ts`

Two edits, both inside existing functions:

- `feedJson(...)`: add one field to each atom object, beside
  `endpoints`:
  `documentation: \`${baseUrl}/docs/${row.serviceName}\``
- `catalogueHtml(...)`: in the row template's first cell, after the
  `mono` span line, add:
  `<br><a href="/docs/${esc(row.serviceName)}">Documentation</a>`

No other catalogue behaviour changes: search/filter/sort data
attributes untouched, rate rendering untouched.

## Apply order + verification (for the applying lane)

1. Precondition: every live atom has `services/<atom>/DOCUMENTATION.md`
   (WS1 covers the 72 verified atoms; Batch 12's seven land with the
   WS1 scope extension — `sync-docs.mjs`'s build guard enforces this
   mechanically at deploy time either way).
2. Run `tools/sync-docs.mjs`; confirm `src/docs.generated.ts` carries
   one entry per catalogued atom.
3. Gateway suite: the catalogue test in `test/gateway.test.ts` gains
   (a) a `documentation` field assertion per feed atom, (b) a
   `GET /docs/<atom>` 200 + title assertion for one atom, (c) a 404
   assertion for an unknown name. Full suite green on the deploy tree.
4. Deploy via the house path; then live probes: `GET /` shows the
   Documentation link per row; `GET /api.json` carries the field;
   `GET /docs/<atom>` returns 200 for every live atom (probe all,
   not a sample — the list is the /api.json atom list).
5. Registry listings: no change required (server.json already points
   at atoms.pipavia.com); the doc home rides the same origin.

## What this deliberately does not do

- No new origin, no static-site deploy, no repo-publication
  dependency: the docs ship inside the artifact the gateway already
  deploys, so doc updates ride the normal batch deploy cadence.
- No change to `billing.ts` / `store.ts` / `callpath.ts` /
  `validate.ts` (frozen files) — the route addition touches
  `index.ts` only, alongside the two `catalogue.ts` edits and the
  two new files above.
