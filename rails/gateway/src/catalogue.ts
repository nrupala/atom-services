// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** The catalogue / pricing surface (models.dev manner): a public
 *  index page + a machine-readable twin at /api.json. Both render
 *  from the SAME generated module the charger uses
 *  (src/generated.ts, produced by tools/sync-rates.mjs from the
 *  contracts) — displayed == charged, mechanically.
 *
 *  Only live atoms are listed. An atom with an unset rate shows its
 *  true state — "Free during trial — rate pending" — never an
 *  invented number.
 */

import { CATALOGUE, type CatalogueRow } from "./generated.js";

export function rateDisplay(row: CatalogueRow): string {
  if (row.rateMicro === null) return "Free during trial — rate pending";
  const usd = row.rateMicro / 1_000_000;
  return `$${usd.toFixed(usd < 0.01 ? 4 : 2)} / ${row.unit}`;
}

export function feedJson(baseUrl: string): Record<string, unknown> {
  return {
    service: "conduit-atoms",
    generated_from: "atom contracts (pricing blocks) via tools/sync-rates.mjs",
    atoms: CATALOGUE.map((row) => ({
      name: row.serviceName,
      display_name: row.displayName,
      description: row.description,
      category: row.category,
      deliverable_type: row.deliverableType,
      version: row.atomVersion,
      endpoints: {
        api: `${baseUrl}/v1/${row.serviceName}`,
        mcp: `${baseUrl}/mcp/${row.serviceName}`,
      },
      pricing: {
        unit: row.unit,
        rate_usd: row.rateMicro === null ? null : row.rateMicro / 1_000_000,
        rate_status: row.rateStatus,
        display: rateDisplay(row),
      },
    })),
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function catalogueHtml(baseUrl: string): string {
  const rows = CATALOGUE.map((row) => {
    const rate = rateDisplay(row);
    const rateSort = row.rateMicro === null ? -1 : row.rateMicro;
    return `<tr data-name="${esc(row.displayName.toLowerCase())} ${esc(row.serviceName)}" data-category="${esc(row.category)}" data-rate="${rateSort}">
      <td><strong>${esc(row.displayName)}</strong><br><span class="dim">${esc(row.description)}</span><br><span class="dim mono">${esc(row.serviceName)} · v${esc(row.atomVersion)} · ${esc(row.deliverableType)}</span></td>
      <td>${esc(row.category)}</td>
      <td class="mono">${baseUrl}/v1/${esc(row.serviceName)}<br>${baseUrl}/mcp/${esc(row.serviceName)}</td>
      <td>${esc(row.unit)}</td>
      <td data-rate-cell>${esc(rate)}</td>
    </tr>`;
  }).join("\n");
  const categories = [...new Set(CATALOGUE.map((r) => r.category))].sort();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conduit Atoms — catalogue & pricing</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 1080px; padding: 0 1rem; color: #111; }
  h1 { font-size: 1.5rem; } .dim { color: #666; font-size: .85em; } .mono { font-family: ui-monospace, monospace; font-size: .85em; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { border-bottom: 1px solid #ddd; padding: .6rem .5rem; text-align: left; vertical-align: top; }
  th { cursor: pointer; user-select: none; }
  input, select { padding: .45rem; margin-right: .5rem; }
</style>
</head>
<body>
<h1>Conduit Atoms</h1>
<p>Deterministic product atoms, served per API call. One gateway key works across atoms — each atom is metered at its own posted rate. Sign up with your email, issue a key for an atom, and call it over the API or MCP. Machine-readable twin of this page: <a href="/api.json">/api.json</a>.</p>
<p>
  <input id="q" type="search" placeholder="Search atoms…" size="32">
  <select id="cat"><option value="">All categories</option>${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
</p>
<table id="atoms">
  <thead><tr><th>Atom</th><th>Category</th><th>Endpoints</th><th>Unit</th><th id="rateHead">Rate ⇅</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
<p class="dim">Sold by 2351485 ALBERTA INC. (AIMLDS) · Payments by Stripe · <a href="https://pipavia.com">pipavia.com</a></p>
<script>
  const q = document.getElementById('q'), cat = document.getElementById('cat');
  const tbody = document.querySelector('#atoms tbody');
  function apply() {
    const needle = q.value.toLowerCase(), c = cat.value;
    for (const tr of tbody.rows) {
      tr.style.display = (tr.dataset.name.includes(needle) && (!c || tr.dataset.category === c)) ? '' : 'none';
    }
  }
  q.addEventListener('input', apply); cat.addEventListener('change', apply);
  let asc = true;
  document.getElementById('rateHead').addEventListener('click', () => {
    const rows = [...tbody.rows];
    rows.sort((a, b) => (parseFloat(a.dataset.rate) - parseFloat(b.dataset.rate)) * (asc ? 1 : -1));
    asc = !asc;
    for (const tr of rows) tbody.appendChild(tr);
  });
</script>
</body>
</html>`;
}
