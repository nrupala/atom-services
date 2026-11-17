#!/usr/bin/env node
/**
 * sync-docs — generate the gateway's per-atom documentation module
 * from the atoms' DOCUMENTATION.md files (WS1, the source of truth),
 * following the sync-rates pattern: the served doc is mechanically
 * the repo doc — never a hand-copied page that can drift.
 *
 * Reads rails/gateway/atoms.registry.json (the catalogue set), then
 * each atom's services/<atom>/DOCUMENTATION.md, and writes
 * src/docs.generated.ts exporting DOCS.
 *
 * BUILD GUARD: if a catalogued atom has no DOCUMENTATION.md, this
 * tool exits non-zero and names every missing atom — a catalogue
 * documentation link can therefore never point at a missing doc,
 * and a batch cannot go live undocumented without the build
 * saying so.
 *
 * GUARD SCOPE (Batch 14 deploy, 2026-11-15): the guard binds every
 * atom that was live BEFORE the deploying batch. Two named sets
 * stand outside it, each on record:
 *  - GUARD_WAIVED: electrical-machines-expert-advice — disabled by
 *    owner ruling under process line U-13; its N-10 documentation
 *    line is WAIVED on record and documentation is a precondition
 *    of any return ruling, not of this deploy.
 *    personal-financial-snapshot — HELD staged under an open U-13
 *    per-unit ruling (flagged 2026-11-15; it did not deploy with
 *    Batch 17); documentation is a precondition of any publish
 *    ruling for it, not of any other batch's deploy.
 *  - GUARD_PENDING: the newest batch's own atoms. Batch 21's five
 *    deployed 2026-11-16 and entered scope when Batch 22 was
 *    staged (their WS1 documentation lands after their
 *    verification wave, Wave 16; until it is PROVEN the guard
 *    blocks the next deploy, by design). Batch 22's six are
 *    staged, not deployed; they enter scope at the deploy after
 *    their own. When a new batch deploys, move its names out of
 *    GUARD_PENDING.
 *    smart-grid-der-design-pack — HELD staged under an open U-13
 *    per-unit ruling (engineering class, strictest reading; it did
 *    not deploy with Batch 19); recorded GUARD_WAIVED alongside
 *    personal-financial-snapshot — documentation is a precondition
 *    of any publish ruling for it, not of any other batch's deploy.
 *    structured-root-cause-analysis — HELD staged under an open
 *    U-13 per-unit ruling (engineering class, strictest reading;
 *    authored with Batch 20, held at deploy-set formation and it
 *    did not deploy with Batch 20); recorded GUARD_WAIVED alongside
 *    the other two held atoms — documentation is a precondition
 *    of any publish ruling for it, not of any other batch's deploy.
 *    system-design-failure-mode-pack — HELD staged under an open
 *    U-13 per-unit ruling (engineering class, strictest reading;
 *    authored with Batch 21, flagged at authoring as a hold
 *    candidate and it did not deploy with Batch 21); recorded
 *    GUARD_WAIVED alongside the other held atoms — documentation
 *    is a precondition of any publish ruling for it, not of any
 *    other batch's deploy.
 *    technical-explainer-content-pack — HELD staged under an open
 *    U-13 per-unit ruling (bound skill names safety-relevant
 *    electrical/medical/money topics; authored with Batch 21,
 *    flagged at authoring as a hold candidate and it did not
 *    deploy with Batch 21); recorded GUARD_WAIVED alongside the
 *    other held atoms — documentation is a precondition of any
 *    publish ruling for it, not of any other batch's deploy.
 * Every other catalogued atom missing DOCUMENTATION.md fails the
 * build. Atoms without a doc (waived, pending, or the disabled
 * documented set) are handled at the surfaces: the feed and the
 * catalogue link a doc only when one is emitted here, and disabled
 * atoms are never linked (catalogue.ts reads live kill-switch
 * state; the /docs route 404s a disabled atom).
 *
 * Run from rails/gateway/:  node tools/sync-docs.mjs
 *
 * Status: WIRED at the Batch 14 deploy (2026-11-15) — src/docs.ts,
 * the index.ts /docs route and the catalogue.ts field/link landed
 * with this tool's emit; see
 * documentation/CATALOGUE-DOC-LINK-STAGED-CHANGE.md.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gatewayRoot = join(here, "..");
const repoRoot = join(gatewayRoot, "..", "..");

const registry = JSON.parse(readFileSync(join(gatewayRoot, "atoms.registry.json"), "utf8"));
const names = registry.atoms.map((r) => r.service_name);

// Guard scope sets — see the header comment. GUARD_WAIVED: disabled
// under U-13, N-10 waived on record (electrical-machines-expert-
// advice), plus personal-financial-snapshot,
// smart-grid-der-design-pack, structured-root-cause-analysis,
// system-design-failure-mode-pack and
// technical-explainer-content-pack — all five held staged under
// open U-13 rulings, documentation a precondition of their publish
// rulings. GUARD_PENDING: the staged batch (Batch 22); their docs
// land after their verification wave and the guard covers them
// from the deploy after their own. Batch 21's five deployed atoms
// are in scope as of the Batch 22 staging (their WS1 documentation
// lands after Wave 16; until it is PROVEN the guard blocks the
// Batch 22 deploy, by design).
const GUARD_WAIVED = new Set([
  "electrical-machines-expert-advice",
  "personal-financial-snapshot",
  "smart-grid-der-design-pack",
  "structured-root-cause-analysis",
  "system-design-failure-mode-pack",
  "technical-explainer-content-pack",
]);
// Batch 23 (2026-11-17): Batch 22's five deployed atoms moved out of
// GUARD_PENDING — their DOCUMENTATION.md files are on disk (WS1,
// 2026-11-16/17), so the guard now covers them in full. Batch 23's
// three atoms (markdown-sanitizer, token-estimator,
// json-schema-enforcer) landed their DOCUMENTATION.md with the build
// itself, so they never enter GUARD_PENDING.
// validated-simulation-scenario-pack stays: held staged under its
// U-13 ruling, still undocumented, documentation a precondition of
// any publish ruling for it.
const GUARD_PENDING = new Set([
  "validated-simulation-scenario-pack",
]);

const docs = {};
const missing = [];
for (const name of names) {
  const p = join(repoRoot, "services", name, "DOCUMENTATION.md");
  if (!existsSync(p)) {
    if (!GUARD_WAIVED.has(name) && !GUARD_PENDING.has(name)) missing.push(name);
    continue;
  }
  const markdown = readFileSync(p, "utf8");
  const h1 = /^#\s+(.+)$/m.exec(markdown);
  docs[name] = { title: h1 ? h1[1].trim() : name, markdown };
}

if (missing.length > 0) {
  console.error(`sync-docs: BUILD GUARD — ${missing.length} catalogued atom(s) have no DOCUMENTATION.md:`);
  for (const name of missing) console.error(`  - ${name}`);
  console.error("Refusing to emit src/docs.generated.ts: a catalogue documentation link must never point at a missing doc.");
  process.exit(1);
}

const body = Object.entries(docs)
  .map(([name, d]) => `  ${JSON.stringify(name)}: { title: ${JSON.stringify(d.title)}, markdown: ${JSON.stringify(d.markdown)} },`)
  .join("\n");
const out = `// GENERATED by tools/sync-docs.mjs from services/<atom>/DOCUMENTATION.md
// (WS1 source of truth) + atoms.registry.json (catalogue set).
// DO NOT EDIT BY HAND. Re-run: node tools/sync-docs.mjs
// Generated: ${new Date().toISOString()}

export interface AtomDoc {
  title: string;
  markdown: string;
}

export const DOCS: Record<string, AtomDoc> = {
${body}
};
`;
writeFileSync(join(gatewayRoot, "src", "docs.generated.ts"), out);
console.log(`sync-docs: wrote src/docs.generated.ts with ${Object.keys(docs).length} atom doc(s)`);
