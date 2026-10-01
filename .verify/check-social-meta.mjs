/* Social-card guard: does every PUBLIC page carry a complete Open Graph +
   Twitter card set?

   WHY THIS EXISTS
   All three blog articles shipped with zero social meta tags. Nothing caught it,
   because nothing was looking — and the failure is invisible from the site itself.
   The symptom only appears when someone else shares the link: Reddit, Discord, X
   and Slack all render a bare URL with no title, no description and no image, which
   costs most of the click-through the share would otherwise have earned.

   That makes it a revenue bug, not a cosmetic one: the blog articles are the pages
   most likely to be shared, and every share is a distribution event. A missing
   og:image quietly halves the value of each one.

   WHAT IS ASSERTED
     - the full og: set is present, and og:url matches <link rel="canonical">
     - og:image is an ABSOLUTE https URL (a relative path is silently ignored by
       every scraper — it looks correct in the HTML and does nothing)
     - og:image:width/height are declared, so the large card renders on first fetch
     - twitter:card is summary_large_image and carries its own title/description/image
     - title and description are within the lengths scrapers actually display

   NOT asserted: /game/*. That build is the portal artefact and is deliberately kept
   free of anything a portal reviewer might read as a self-referential link.

   Usage:  node .verify/check-social-meta.mjs
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_OG = [
  'og:type', 'og:site_name', 'og:url', 'og:title', 'og:description',
  'og:image', 'og:image:width', 'og:image:height', 'og:image:alt',
];
const REQUIRED_TW = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const metaContent = (html, attr, key) => {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
};

const pages = [
  'index.html',
  ...readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html')).map((f) => `blog/${f}`),
];

let failures = 0;

console.log('\n=== social card audit ===\n');

for (const rel of pages) {
  if (!existsSync(path.join(ROOT, rel))) {
    console.log(`FAIL ${rel} — missing`);
    failures++;
    continue;
  }
  const html = read(rel);
  const problems = [];

  for (const key of REQUIRED_OG) {
    if (!metaContent(html, 'property', key)) problems.push(`missing ${key}`);
  }
  for (const key of REQUIRED_TW) {
    if (!metaContent(html, 'name', key)) problems.push(`missing ${key}`);
  }

  const canonical = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1] || null;
  const ogUrl = metaContent(html, 'property', 'og:url');
  if (!canonical) problems.push('missing canonical');
  if (canonical && ogUrl && canonical !== ogUrl) {
    problems.push(`og:url (${ogUrl}) != canonical (${canonical})`);
  }

  const img = metaContent(html, 'property', 'og:image');
  if (img && !/^https:\/\//i.test(img)) {
    problems.push(`og:image is not an absolute https URL: ${img}`);
  }
  for (const k of ['og:image:width', 'og:image:height']) {
    const v = metaContent(html, 'property', k);
    if (v && !/^\d+$/.test(v)) problems.push(`${k} is not a number: ${v}`);
  }

  const card = metaContent(html, 'name', 'twitter:card');
  if (card && card !== 'summary_large_image') problems.push(`twitter:card is "${card}"`);

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
  if (title.length > 70) problems.push(`title ${title.length} chars (>70, truncates in search)`);
  const desc = metaContent(html, 'name', 'description');
  if (desc && (desc.length < 50 || desc.length > 300)) {
    problems.push(`meta description ${desc.length} chars (want 50-300)`);
  }

  if (problems.length) {
    console.log(`FAIL ${rel}`);
    for (const p of problems) console.log(`       - ${p}`);
    failures++;
  } else {
    console.log(`OK   ${rel}  og=${REQUIRED_OG.length} twitter=${REQUIRED_TW.length}`);
  }
}

console.log('');
if (failures) {
  console.log(`==== ${failures} page(s) FAILED ====\n`);
  process.exit(1);
}
console.log(`==== all ${pages.length} page(s) carry a complete social card ====\n`);
