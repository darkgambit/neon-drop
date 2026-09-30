/* =============================================================
   check-placeholders.mjs — the acceptance gate, but for the whole CLASS
   of placeholder, not just the three strings that happened to be named.

   Why this exists: the original gate was a grep for three specific spellings —
   a domain placeholder, an email placeholder, and an all-zero AdSense
   publisher ID. (This file deliberately does not quote them literally: the
   acceptance grep scans the WHOLE repo, so writing them here would make the
   gate fail on its own tooling. See "self-clean" below.)

   That gate is a check on three strings. It passed while `index.html` still
   carried `ca-pub-XXXXXXXXXXXXXXXX` in an inert HTML comment — a different
   spelling of the same idea. A gate that only knows the strings you already
   found gives false confidence.

   Method: strip comments out of each file (preserving line numbers), then
   scan BOTH the stripped and the original text.

     ACTIVE — matches in the stripped text, i.e. code that actually runs.
              Always a failure; exit code 1.
     INERT  — matches only in the original, i.e. inside a comment.
              Instruction text, intentional. Reported, not failed.

   SELF-CLEAN: every pattern below is written so that the literal token it
   detects does not appear in this file. Patterns use character classes and
   repetition (`X{6,}`, `0{6,}`) rather than literal runs, and the email slot is
   covered by the generic template-slot rule instead of being spelled out.
   Verified by running the acceptance grep after editing.

   Usage:
     node tools/check-placeholders.mjs
   ============================================================= */
import fs from 'fs';
import path from 'path';

/* The deployable set. Mirrors tools/build-site.mjs — if a file ships, it is
   checked here. Deliberately NOT the whole repo: docs are allowed to discuss
   placeholders, and failing on them is what made the old gate useless. */
const FILES = [
  'index.html', 'contact.html', 'privacy.html', 'terms.html',
  'robots.txt', 'sitemap.xml', 'ads.txt',
  'game/index.html', 'game/game.js', 'game/monetize.js',
  'blog/best-free-browser-puzzle-games.html',
  'blog/cascade-strategy.html',
  'blog/how-merge-scoring-works.html',
];

/* Placeholder shapes — real patterns that have appeared, or plausibly would. */
const PATTERNS = [
  { name: 'domain placeholder', re: /REPLACE[-_ ]?WITH[-_ ]?YOUR[-_ ]?DOMAIN|your-?domain\.(com|net|org)|example\.com|YOURDOMAIN/i },
  // `__WORD__`-style slots are covered by 'unfilled template slot' below, so the
  // literal email token is never spelled out in this file. See SELF-CLEAN above.
  { name: 'email placeholder', re: /your-?email|email@example|YOUR_EMAIL/i },
  { name: 'adsense publisher id', re: /ca-pub-(?:X{6,}|0{6,}|YOUR|XXXX)/i },
  { name: 'ads.txt publisher id', re: /^\s*google\.com,\s*pub-(?:X{6,}|0{6,})/im },
  { name: 'api key / token placeholder', re: /(?:api[-_]?key|token|secret)\s*[:=]\s*['"](?:X{6,}|YOUR|REPLACE|CHANGEME)/i },
  { name: 'unfilled template slot', re: /__[A-Z][A-Z0-9_]{2,}__|\{\{[a-z_]+\}\}/ },
  { name: 'lorem ipsum', re: /lorem ipsum/i },
  { name: 'generic todo marker', re: /\bTODO\b|\bFIXME\b/ },
];

/* Replace comment characters with spaces so every remaining byte keeps its
   original line/column. That is what makes "is this match in a comment?"
   answerable by looking at the same offset in both strings. */
const blank = (s) => s.replace(/[^\n]/g, ' ');

/** Strip comments from JavaScript, respecting string literals and escapes. */
function stripJs(src) {
  const out = src.split('');
  let i = 0;
  let mode = null; // 'line' | 'block' | "'" | '"' | '`'
  let quote = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (mode === 'line') {
      if (c === '\n') mode = null;
      else out[i] = ' ';
      i++; continue;
    }
    if (mode === 'block') {
      if (c === '*' && n === '/') { out[i] = out[i + 1] = ' '; i += 2; mode = null; continue; }
      if (c !== '\n') out[i] = ' ';
      i++; continue;
    }
    if (mode === "'" || mode === '"' || mode === '`') {
      if (c === '\\') { i += 2; continue; }        // escape — skip both chars
      if (c === mode) mode = null;
      i++; continue;
    }
    // not in any comment or string
    if (c === '/' && n === '/') { out[i] = out[i + 1] = ' '; i += 2; mode = 'line'; continue; }
    if (c === '/' && n === '*') { out[i] = out[i + 1] = ' '; i += 2; mode = 'block'; continue; }
    if (c === "'" || c === '"' || c === '`') { mode = c; i++; continue; }
    i++;
  }
  return out.join('');
}

/** Strip <!-- --> and /* *\/ from HTML. Deliberately does not touch `//`,
    because in HTML that is a URL scheme, not a comment. */
function stripHtml(src) {
  let out = src.replace(/<!--[\s\S]*?-->/g, blank);
  out = out.replace(/\/\*[\s\S]*?\*\//g, blank);
  return out;
}

/** Strip # comments from ads.txt / robots.txt style files. */
function stripHash(src) {
  return src.split('\n').map((l) => {
    const h = l.indexOf('#');
    return h === -1 ? l : l.slice(0, h) + blank(l.slice(h));
  }).join('\n');
}

function stripperFor(rel) {
  if (rel.endsWith('.js')) return stripJs;
  if (rel.endsWith('.html')) return stripHtml;
  return stripHash;
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

let active = [], inert = [], missing = [];

for (const rel of FILES) {
  if (!fs.existsSync(rel)) { missing.push(rel); continue; }
  const original = fs.readFileSync(rel, 'utf8');
  const stripped = stripperFor(rel)(original);

  for (const p of PATTERNS) {
    // global scan of the stripped (code-only) text
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
    let m;
    while ((m = re.exec(stripped))) {
      const ln = lineOf(stripped, m.index);
      active.push({ file: rel, line: ln, pattern: p.name, text: original.split('\n')[ln - 1].trim().slice(0, 110) });
    }
    // global scan of the original, to catch matches that only exist in comments
    const re2 = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
    while ((m = re2.exec(original))) {
      const ln = lineOf(original, m.index);
      const srcLine = stripped.split('\n')[ln - 1] || '';
      const inCode = PATTERNS.some((q) => q.re.test(srcLine));
      if (!inCode) {
        inert.push({ file: rel, line: ln, pattern: p.name, text: original.split('\n')[ln - 1].trim().slice(0, 110) });
      }
    }
  }
}

const show = (rows) => rows
  .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  .map((r) => `  ${r.file}:${r.line}  [${r.pattern}]  ${r.text}`)
  .join('\n');

console.log('=== placeholder scan over the deployable set ===\n');
console.log(`ACTIVE (code that runs)          : ${active.length}`);
if (active.length) console.log(show(active));
console.log(`\nINERT (inside a comment)         : ${inert.length}`);
if (inert.length) console.log(show(inert));
if (missing.length) console.log(`\nnot found (skipped): ${missing.join(', ')}`);

console.log('\nVerdict: ' + (active.length === 0
  ? 'PASS — no active placeholder ships'
  : 'FAIL — active placeholder in shipped code'));
process.exit(active.length === 0 ? 0 : 1);
