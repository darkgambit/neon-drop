/* =============================================================
   NEON DROP — Lighthouse gate
   Thresholds required by the brief:
     Performance >= 90 | Accessibility >= 90 | Best-Practices >= 90 | SEO >= 95
   Runs mobile (the stricter profile) and desktop, against both the
   landing page and the standalone game build.

   Usage:  node lighthouse.mjs [baseUrl]
   ============================================================= */
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const OUT = process.env.EVIDENCE_DIR || path.resolve('.verify/out');
fs.mkdirSync(OUT, { recursive: true });

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const THRESHOLDS = { performance: 90, accessibility: 90, 'best-practices': 90, seo: 95 };

const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];
const PAGES = [
  { key: 'landing', url: `${BASE}/` },
  { key: 'game', url: `${BASE}/game/index.html` },
];
const FORMS = [
  { key: 'mobile', formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } },
  { key: 'desktop', formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } },
];

const chrome = await chromeLauncher.launch({
  chromePath: CHROME,
  chromeFlags: ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions'],
});

const rows = [];
for (const form of FORMS) {
  for (const pg of PAGES) {
    let lhr;
    try {
      const res = await lighthouse(pg.url, {
        logLevel: 'error',
        output: 'json',
        port: chrome.port,
        onlyCategories: CATS,
        formFactor: form.formFactor,
        screenEmulation: form.screenEmulation,
        throttling: form.throttling,
        throttlingMethod: 'simulate',
      });
      lhr = res.lhr;
    } catch (e) {
      rows.push({ page: pg.key, form: form.key, error: String(e.message).split('\n')[0] });
      continue;
    }
    const scores = {};
    for (const c of CATS) scores[c] = Math.round((lhr.categories[c]?.score ?? 0) * 100);

    // Every scored audit that is not perfect — this is the fix list.
    const failures = [];
    for (const c of CATS) {
      for (const ref of lhr.categories[c]?.auditRefs || []) {
        const a = lhr.audits[ref.id];
        if (!a || a.score === null || a.score === undefined) continue;
        if (a.score >= 1) continue;
        if (ref.weight === 0) continue;
        failures.push({
          cat: c, id: ref.id, title: a.title,
          score: a.score, weight: ref.weight,
          display: a.displayValue || '',
          detail: (a.details?.items || []).slice(0, 4).map(i => i.node?.snippet || i.url || i.selector || JSON.stringify(i).slice(0, 120)),
        });
      }
    }
    rows.push({ page: pg.key, form: form.key, url: pg.url, scores, failures });
    fs.writeFileSync(path.join(OUT, `lighthouse-${pg.key}-${form.key}.json`), JSON.stringify(lhr, null, 2));
  }
}

await chrome.kill();

/* ------------------------------------------------------- report */
console.log('\n' + '='.repeat(74));
console.log('  LIGHTHOUSE RESULTS');
console.log('='.repeat(74));
console.log('  page      form      perf  a11y   bp    seo   verdict');
console.log('  ' + '-'.repeat(70));
let allPass = true;
for (const r of rows) {
  if (r.error) { console.log(`  ${r.page.padEnd(9)} ${r.form.padEnd(9)} ERROR: ${r.error}`); allPass = false; continue; }
  const bad = CATS.filter(c => r.scores[c] < THRESHOLDS[c]);
  if (bad.length) allPass = false;
  const verdict = bad.length ? `FAIL (${bad.join(', ')})` : 'PASS';
  console.log(`  ${r.page.padEnd(9)} ${r.form.padEnd(9)} ${String(r.scores.performance).padStart(4)}  ${String(r.scores.accessibility).padStart(4)}  ${String(r.scores['best-practices']).padStart(4)}  ${String(r.scores.seo).padStart(4)}   ${verdict}`);
}
console.log('  ' + '-'.repeat(70));
console.log(`  thresholds: perf>=${THRESHOLDS.performance}  a11y>=${THRESHOLDS.accessibility}  bp>=${THRESHOLDS['best-practices']}  seo>=${THRESHOLDS.seo}`);

const seen = new Set();
console.log('\n  FAILING AUDITS (fix list):');
for (const r of rows) {
  for (const f of r.failures || []) {
    const k = `${r.page}|${f.cat}|${f.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`\n   • [${f.cat}] ${f.id} — ${f.title}  (score ${f.score}, weight ${f.weight})${f.display ? '  ' + f.display : ''}`);
    for (const d of f.detail) if (d) console.log(`       ${String(d).replace(/\s+/g, ' ').slice(0, 150)}`);
  }
}
console.log('\n' + (allPass ? '  ✅ ALL LIGHTHOUSE THRESHOLDS MET' : '  ❌ SOME THRESHOLDS NOT MET'));
fs.writeFileSync(path.join(OUT, 'lighthouse-summary.json'), JSON.stringify({ allPass, rows }, null, 2));
process.exit(allPass ? 0 : 1);
