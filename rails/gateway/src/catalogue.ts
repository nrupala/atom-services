// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** The catalogue / pricing surface (models.dev manner): a public
 *  index page + a machine-readable twin at /api.json. Both render
 *  from the SAME generated module the charger uses
 *  (src/generated.ts, produced by tools/sync-rates.mjs from the
 *  contracts) — displayed == charged, mechanically.
 *
 *  The HTML page lists live atoms only; the /api.json feed lists
 *  every atom, with disabled atoms marked and stripped of their
 *  documentation link, limits line and trace (see below). An atom
 *  with an unset rate shows its true state — "Free during trial —
 *  rate pending" — never an invented number.
 *
 *  AxiomCode-standard uplift (2026-11-18): each live row also
 *  carries the atom's "does not cover" line (src/limits.generated
 *  .ts, produced by tools/sync-limits.mjs — a verbatim clause from
 *  the atom's own SERVICE.md record) and its measured trace
 *  (src/traces.generated.ts, produced by tools/sync-traces.mjs from
 *  the recorded verification runs: what was run, the verdict, and
 *  the not-run / not-covered / excluded buckets). Disabled atoms
 *  keep the takedown presentation exactly: absent from the HTML
 *  catalogue; in the feed the row keeps its name, display name,
 *  description, category, deliverable type, version, endpoints
 *  and pricing with status "disabled", but carries no
 *  documentation link, no does-not-cover line and no measured
 *  trace — nothing that presents a disabled atom as serving.
 */

import { CATALOGUE, type CatalogueRow } from "./generated.js";
import { DOCS } from "./docs.generated.js";
import { LIMITS } from "./limits.generated.js";
import { TRACES } from "./traces.generated.js";
import type { Store } from "./store.js";

/** Live kill-switch state (takedown-presentation patch, 2026-11-15).
 *  Presentation derives from the SAME D1 config the call path reads
 *  (`atom_enabled:<service>` via store.getConfig — see callpath.ts),
 *  resolved AT REQUEST TIME on every call below: no disabled list is
 *  baked into generated.ts or the bundle, so flipping a switch in D1
 *  changes the catalogue, the feed, /health and the MCP surfaces
 *  with NO redeploy. Reads for a whole surface run in parallel
 *  (one getConfig per atom, per request — no cache, so a flip is
 *  visible on the very next request). */
export async function isAtomDisabled(store: Store, serviceName: string): Promise<boolean> {
  return (await store.getConfig(`atom_enabled:${serviceName}`)) === "0";
}

export async function disabledAtoms(store: Store, serviceNames: string[]): Promise<Set<string>> {
  const flags = await Promise.all(
    serviceNames.map(async (name) => [name, await isAtomDisabled(store, name)] as const)
  );
  return new Set(flags.filter(([, disabled]) => disabled).map(([name]) => name));
}

export async function catalogueDisabled(store: Store): Promise<Set<string>> {
  return disabledAtoms(store, CATALOGUE.map((row) => row.serviceName));
}

export function rateDisplay(row: CatalogueRow): string {
  if (row.rateMicro === null) return "Free during trial — rate pending";
  const usd = row.rateMicro / 1_000_000;
  return `$${usd.toFixed(usd < 0.01 ? 4 : 2)} / ${row.unit}`;
}

export async function feedJson(baseUrl: string, store: Store): Promise<Record<string, unknown>> {
  const disabled = await catalogueDisabled(store);
  return {
    service: "conduit-atoms",
    generated_from:
      "atom contracts (pricing blocks) via tools/sync-rates.mjs; does-not-cover lines via tools/sync-limits.mjs from the atoms' SERVICE.md records; measured traces via tools/sync-traces.mjs from the recorded verification runs",
    skill: `${baseUrl}/SKILL.md`,
    atoms: CATALOGUE.map((row) => ({
      name: row.serviceName,
      display_name: row.displayName,
      description: row.description,
      category: row.category,
      deliverable_type: row.deliverableType,
      version: row.atomVersion,
      status: disabled.has(row.serviceName) ? "disabled" : "live",
      endpoints: {
        api: `${baseUrl}/v1/${row.serviceName}`,
        mcp: `${baseUrl}/mcp/${row.serviceName}`,
      },
      // Documentation link (Batch 14 doc-link): present ONLY for a
      // live atom with an emitted doc — a disabled atom keeps its
      // takedown presentation (status disabled, no doc link that
      // could present it as available), and an atom whose WS1 doc
      // has not landed yet (the deploying batch) gets no link that
      // would point at a missing page. sync-docs.mjs's build guard
      // binds every atom live before the deploying batch.
      ...(disabled.has(row.serviceName) || !DOCS[row.serviceName]
        ? {}
        : { documentation: `${baseUrl}/docs/${row.serviceName}` }),
      // Does-not-cover line + measured trace (2026-11-18 uplift):
      // present ONLY for a live atom — the same takedown rule as
      // the documentation link. A disabled atom's row omits the
      // limits line and the trace (its name, description, category,
      // version, endpoints and pricing remain, with status
      // "disabled"): nothing here may present it as serving.
      ...(disabled.has(row.serviceName) || !LIMITS[row.serviceName]
        ? {}
        : { does_not_cover: LIMITS[row.serviceName] }),
      ...(disabled.has(row.serviceName) || !TRACES[row.serviceName]
        ? {}
        : {
            measured_trace: {
              source: TRACES[row.serviceName].source,
              summary: TRACES[row.serviceName].summary,
              not_run: TRACES[row.serviceName].not_run,
              not_covered: TRACES[row.serviceName].not_covered,
              excluded: TRACES[row.serviceName].excluded,
            },
          }),
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

/** Sentence-close a generated clause for display: append "." only
 *  when the clause does not already end with sentence punctuation. */
function closeSentence(s: string): string {
  return /[.!?…]$/.test(s) ? s : `${s}.`;
}

/** The per-atom limits + trace block rendered under a live row
 *  (2026-11-18 uplift). The does-not-cover line stands on its own
 *  (Item 2b); the measured-trace block follows with its summary and
 *  buckets (Item 5). The trace's Not covered bucket repeats the
 *  same generated clause, so the trace block is complete on its
 *  own exactly as it is in the feed — one source (the atom's
 *  SERVICE.md record), two displays. Buckets render only when the
 *  atom's record carries content for them; Not run always carries
 *  at least the Guardian Mesh disposition. */
function limitsTraceHtml(row: CatalogueRow): string {
  const clause = LIMITS[row.serviceName];
  const trace = TRACES[row.serviceName];
  if (!clause && !trace) return "";
  let out = "";
  if (clause) out += `<br><span class="dim">Does not cover — ${esc(closeSentence(clause))}</span>`;
  if (trace) {
    const buckets: string[] = [];
    if (trace.not_run.length) buckets.push(`Not run: ${trace.not_run.join("; ")}`);
    if (trace.not_covered) buckets.push(`Not covered: ${closeSentence(trace.not_covered)}`);
    if (trace.excluded.length) {
      buckets.push(
        `Excluded: ${trace.excluded.map((e) => `${e.leg} (N/A — ${closeSentence(e.reason)})`).join("; ")}`
      );
    }
    out += `<br><span class="dim mono">Measured trace — ${esc(closeSentence(trace.summary))}${buckets.length ? ` ${esc(buckets.join(" "))}` : ""}</span>`;
  }
  return out;
}

export async function catalogueHtml(baseUrl: string, store: Store): Promise<string> {
  const disabled = await catalogueDisabled(store);
  const visible = CATALOGUE.filter((row) => !disabled.has(row.serviceName));
  const rows = visible.map((row) => {
    const rate = rateDisplay(row);
    const rateSort = row.rateMicro === null ? -1 : row.rateMicro;
    return `<tr data-name="${esc(row.displayName.toLowerCase())} ${esc(row.serviceName)}" data-category="${esc(row.category)}" data-rate="${rateSort}">
      <td><strong>${esc(row.displayName)}</strong><br><span class="dim">${esc(row.description)}</span><br><span class="dim mono">${esc(row.serviceName)} · v${esc(row.atomVersion)} · ${esc(row.deliverableType)}</span>${DOCS[row.serviceName] ? `<br><a href="/docs/${esc(row.serviceName)}">Documentation</a>` : ""}${limitsTraceHtml(row)}</td>
      <td>${esc(row.category)}</td>
      <td class="mono">${baseUrl}/v1/${esc(row.serviceName)}<br>${baseUrl}/mcp/${esc(row.serviceName)}</td>
      <td>${esc(row.unit)}</td>
      <td data-rate-cell>${esc(rate)}</td>
    </tr>`;
  }).join("\n");
  const categories = [...new Set(visible.map((r) => r.category))].sort();
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
<p>Deterministic product atoms, served per API call. One gateway key works across atoms — each atom is metered at its own posted rate. Sign up with your email, issue a key for an atom, and call it over the API or MCP. Machine-readable twin of this page: <a href="/api.json">/api.json</a>. Agents: the fleet onboarding file is <a href="/SKILL.md">/SKILL.md</a> — discovery, the key flow, verdict reading and error shapes. Every row below states what the atom does not cover and the measured trace of what was actually run against it, including the legs not run.</p>
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
