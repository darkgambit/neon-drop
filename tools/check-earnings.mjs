#!/usr/bin/env node
/**
 * check-earnings.mjs — "is it earning yet?" answered in one command.
 *
 * WHY THIS EXISTS
 * Adsterra does not email you when you start earning. There is no "you earned your
 * first $0.01" alert. Their publisher documentation describes the Statistics tab and
 * the Publishers API as the way to read earnings — nothing else notifies you.
 *
 * So the honest situation without this script is: you check a dashboard by hand, or
 * you don't know. This makes it one command, and it prints the three numbers that
 * actually matter — impressions, revenue, and how far you are from the payout floor.
 *
 * THE DISTINCTION THAT MATTERS MOST
 *   "ad request fired"  !=  "impression counted"  !=  "revenue accrued"
 *
 * Our own evidence harness (`.verify/shot-ads-evidence.mjs`) proves the FIRST one:
 * the tag is requested and a creative renders. It cannot prove the second, and the
 * second is what becomes money. An impression is only counted once the ad fully
 * loads on a real visitor's device. This script reads Adsterra's own count, which is
 * the only number that is ever true.
 *
 * SETUP
 *   1. Adsterra dashboard -> API page -> GENERATE NEW TOKEN
 *   2. Save it to  ADSTERRA_API_KEY.local  (gitignored) — a single line, no quotes
 *      ...or export ADSTERRA_API_KEY=... in the environment.
 *   The token is never printed, logged, or committed.
 *
 * Usage:
 *   node tools/check-earnings.mjs               # last 7 days
 *   node tools/check-earnings.mjs --days 30
 *   node tools/check-earnings.mjs --sites       # also break the total down per website
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api3.adsterratools.com/publisher';
const TOKEN_FILE = path.join(ROOT, 'ADSTERRA_API_KEY.local');

// The payout floor attached to this account: WebMoney (WMZ), $5 minimum.
const PAYOUT_MINIMUM = 5.0;

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const DAYS = Math.min(366, Math.max(1, parseInt(argOf('--days', '7'), 10) || 7));
const SHOW_SITES = argv.includes('--sites');

function loadToken() {
  if (process.env.ADSTERRA_API_KEY && process.env.ADSTERRA_API_KEY.trim()) {
    return { token: process.env.ADSTERRA_API_KEY.trim(), from: 'environment' };
  }
  if (existsSync(TOKEN_FILE)) {
    const t = readFileSync(TOKEN_FILE, 'utf8').trim();
    if (t) return { token: t, from: path.relative(ROOT, TOKEN_FILE) };
  }
  return null;
}

const iso = (d) => d.toISOString().slice(0, 10);
const money = (n) => '$' + Number(n || 0).toFixed(4);
const num = (n) => Number(n || 0).toLocaleString('en-US');

async function api(endpoint, params, token) {
  const url = new URL(API + endpoint);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-API-Key': token },
  });
  const body = await res.text();
  let json = null;
  try { json = JSON.parse(body); } catch { /* non-JSON error page */ }
  return { status: res.status, json, body };
}

/** Turn an HTTP status into something that tells you what to actually do. */
function explain(status) {
  switch (status) {
    case 401: return 'token is incorrect — copy it again from the Adsterra API page';
    case 403: return 'token is invalid or expired — generate a fresh one on the Adsterra API page';
    case 404: return 'endpoint not found (this is a bug in the script, not your account)';
    case 405: return 'method not allowed (script bug)';
    case 422: return 'request rejected — usually a malformed date range';
    default:  return 'unexpected response';
  }
}

async function main() {
  const auth = loadToken();
  if (!auth) {
    console.log('\n=== Adsterra earnings check ===\n');
    console.log('No API token found, so there is nothing to read.\n');
    console.log('  1. Adsterra dashboard -> API page -> GENERATE NEW TOKEN');
    console.log('  2. Save it as a single line in:  ' + path.relative(ROOT, TOKEN_FILE));
    console.log('     (that path is gitignored — it will not be committed or deployed)\n');
    console.log('Until then the only way to see earnings is the Statistics tab by hand.\n');
    process.exit(0);
  }

  const finish = new Date();
  const start = new Date(finish.getTime() - (DAYS - 1) * 86400000);

  console.log('\n=== Adsterra earnings check ===');
  console.log(`  window : ${iso(start)} .. ${iso(finish)}  (${DAYS} days)`);
  console.log(`  token  : loaded from ${auth.from} (not printed)\n`);

  const stats = await api('/stats.json', {
    start_date: iso(start),
    finish_date: iso(finish),
    group_by: 'date',
  }, auth.token);

  if (stats.status !== 200) {
    console.log(`FAILED — HTTP ${stats.status}: ${explain(stats.status)}`);
    if (stats.body && stats.body.length < 400) console.log('  server said: ' + stats.body.trim());
    process.exit(1);
  }

  const items = (stats.json && stats.json.items) || [];
  const totals = items.reduce((a, r) => ({
    impression: a.impression + (r.impression || 0),
    clicks: a.clicks + (r.clicks || 0),
    revenue: a.revenue + (r.revenue || 0),
  }), { impression: 0, clicks: 0, revenue: 0 });

  console.log('  date         impressions     clicks      CPM      revenue');
  console.log('  ' + '-'.repeat(58));
  for (const r of items) {
    console.log(
      '  ' + String(r.date).padEnd(12) +
      num(r.impression).padStart(12) +
      num(r.clicks).padStart(11) +
      ('$' + Number(r.cpm || 0).toFixed(3)).padStart(9) +
      money(r.revenue).padStart(13)
    );
  }
  console.log('  ' + '-'.repeat(58));
  console.log(
    '  ' + 'TOTAL'.padEnd(12) +
    num(totals.impression).padStart(12) +
    num(totals.clicks).padStart(11) +
    ''.padStart(9) +
    money(totals.revenue).padStart(13)
  );

  const pct = Math.min(100, (totals.revenue / PAYOUT_MINIMUM) * 100);
  const bar = '#'.repeat(Math.round(pct / 5)).padEnd(20, '.');
  console.log(`\n  progress to the $${PAYOUT_MINIMUM.toFixed(2)} payout floor: ${bar} ${pct.toFixed(1)}%`);
  if (totals.revenue < PAYOUT_MINIMUM) {
    console.log(`  still needed: ${money(PAYOUT_MINIMUM - totals.revenue)}`);
  } else {
    console.log('  floor reached — payment is due in the next 1st-2nd / 16th-17th window,');
    console.log('  PROVIDED the Payout Information form reads APPROVED (attached is not approved).');
  }

  if (SHOW_SITES) {
    const perSite = await api('/stats.json', {
      start_date: iso(start), finish_date: iso(finish), group_by: 'domain',
    }, auth.token);
    if (perSite.status === 200 && perSite.json && perSite.json.items) {
      console.log('\n  per website');
      console.log('  ' + '-'.repeat(58));
      for (const r of perSite.json.items) {
        const label = r.domain || r.domain_id || '(unknown)';
        console.log(
          '  ' + String(label).padEnd(28) +
          num(r.impression).padStart(12) +
          money(r.revenue).padStart(13)
        );
      }
    }
  }

  if (stats.json && stats.json.dbLastUpdateTime) {
    console.log(`\n  Adsterra database last updated: ${stats.json.dbLastUpdateTime}`);
    console.log('  (figures are not instantaneous — today\'s number is still moving, and');
    console.log('   CPM reads low in the morning UTC before rates level out during the day)');
  }

  const verdict = totals.impression === 0
    ? 'ZERO impressions counted. Either nobody has visited, or the ad units are not serving. Check the Statistics tab by domain.'
    : totals.revenue === 0
      ? `${num(totals.impression)} impressions counted but $0 revenue. Normal at very low volume — CPM needs volume to register.`
      : 'EARNING. Revenue is accruing.';
  console.log(`\n  VERDICT: ${verdict}\n`);
}

main().catch((err) => {
  console.error('\ncheck-earnings failed:', err && err.message ? err.message : err);
  process.exit(1);
});
