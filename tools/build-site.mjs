#!/usr/bin/env node
/**
 * build-site.mjs — stage ONLY the public site into _site/
 *
 * Why this exists:
 *   The repo root doubles as the site root, but it also holds files that must
 *   NEVER be served: DEPLOY_SECRETS.local.md, PROGRESS.md, PORTAL_SUBMISSION_KIT.md,
 *   the agent prompts, .verify/, and dist/ (which contains the itch zip and the
 *   source cover art). A plain `netlify deploy --dir=.` uploads all of it.
 *
 *   So the publish directory is `_site`, and this script is the only thing that
 *   writes into it — from an explicit allowlist. Anything not listed is invisible
 *   to the deploy, by construction.
 *
 * Usage:  node tools/build-site.mjs
 * Output: ./_site  (gitignored, safe to delete and rebuild)
 */

import { mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, '_site');

/** Individual public files that live at the site root. */
const FILES = [
  'index.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'robots.txt',
  'sitemap.xml',
  'ads.txt',
  'ads-site.js',
  'consent.js',
  'og-cover.jpg',
];

/** Public directories, copied recursively. */
const DIRS = ['game', 'blog'];

/** Basenames that must never appear anywhere under _site/. Belt and braces. */
const FORBIDDEN = [
  'DEPLOY_SECRETS.local.md',
  'NEXT_ACTIONS.md',
  'PROGRESS.md',
  'PORTAL_SUBMISSION_KIT.md',
  'AI_AGENT_PROMPT.md',
  'CLAUDE_CODE_PROMPT.md',
  'README.md',
  'netlify.toml',
];

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' KB';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function main() {
  const missing = [];
  for (const f of [...FILES, ...DIRS]) {
    if (!existsSync(path.join(ROOT, f))) missing.push(f);
  }
  if (missing.length) {
    console.error('\n[build-site] MISSING required public path(s):');
    for (const m of missing) console.error('  - ' + m);
    console.error('\nRefusing to build a partial site.\n');
    process.exit(1);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const f of FILES) {
    await cp(path.join(ROOT, f), path.join(OUT, f));
  }

  // IndexNow ownership key. IndexNow proves you own the host by fetching
  // https://<host>/<key>.txt, and it 403s the whole submission if that file is not
  // served — so a key that never reaches _site/ is a silent no-op. Matched by shape
  // rather than by name so rotating the key cannot break the submission quietly.
  const indexNowKeys = (await readdir(ROOT)).filter((n) => /^[a-f0-9]{32}\.txt$/.test(n));
  for (const k of indexNowKeys) {
    await cp(path.join(ROOT, k), path.join(OUT, k));
  }

  for (const d of DIRS) {
    await cp(path.join(ROOT, d), path.join(OUT, d), { recursive: true });
  }

  // --- verify: nothing forbidden slipped in, and the payload looks sane -------
  const staged = await walk(OUT);
  const leaked = staged.filter((p) => FORBIDDEN.includes(path.basename(p)));
  if (leaked.length) {
    console.error('\n[build-site] SECURITY: forbidden file(s) staged:');
    for (const p of leaked) console.error('  - ' + path.relative(ROOT, p));
    console.error('');
    process.exit(1);
  }

  let total = 0;
  const rows = [];
  for (const p of staged.sort()) {
    const s = (await stat(p)).size;
    total += s;
    rows.push([path.relative(OUT, p).replace(/\\/g, '/'), kb(s)]);
  }

  console.log('\n[build-site] staged ' + staged.length + ' files into _site/\n');
  for (const [name, size] of rows) console.log('  ' + name.padEnd(46) + size);
  console.log('  ' + '-'.repeat(56));
  console.log('  ' + 'TOTAL'.padEnd(46) + kb(total));
  console.log('\n[build-site] no forbidden files staged. OK\n');
}

main().catch((err) => {
  console.error('[build-site] failed:', err);
  process.exit(1);
});
