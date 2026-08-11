/*
 * resolve-ids.js — find a YouTube video id for every catalog song that
 * doesn't already have a hand-curated one, by scraping the first result off
 * YouTube's search page (no API key needed). Runs once at build time; the
 * ids are baked into songs.js so playback never needs a runtime search.
 *
 * Idempotent: results are cached in assets/data/yt-ids.json and re-runs only
 * fetch the ones still missing. Safe to stop and restart.
 *
 * Run:  node tools/resolve-ids.js
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'assets', 'data', 'catalog.csv');
const OUT = path.join(ROOT, 'assets', 'data', 'yt-ids.json');

/* titles+films that already have curated ids — skip these (norm key) */
const CURATED_KEYS = new Set(require('./curated-keys.json'));

function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
function keyOf(t, f) { return norm(t) + '|' + norm(f); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function query(title, film) {
  var q = title;
  if (film && film !== 'Single') q += ' ' + film;
  return q + ' song';
}

async function fetchId(q, attempt) {
  attempt = attempt || 0;
  var url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  try {
    var r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (r.status === 429 || r.status >= 500) throw new Error('http ' + r.status);
    var html = await r.text();
    var m = html.match(/"videoId":"([\w-]{11})"/);
    return m ? m[1] : null;
  } catch (e) {
    if (attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return fetchId(q, attempt + 1);
    }
    console.error('  ! failed:', q, '-', e.message);
    return null;
  }
}

(async function () {
  var lines = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  lines.shift();

  var ids = {};
  if (fs.existsSync(OUT)) ids = JSON.parse(fs.readFileSync(OUT, 'utf8'));

  var todo = lines.map(function (line) {
    var f = line.split(',');
    return { id: f[0], title: f[1], film: f[2] };
  }).filter(function (row) {
    if (CURATED_KEYS.has(keyOf(row.title, row.film))) return false; // has curated id
    if (ids[row.id]) return false;                                   // already resolved
    return true;
  });

  console.log('to resolve:', todo.length, '(already have ' + Object.keys(ids).length + ')');

  var done = 0, concurrency = 5;
  async function worker() {
    while (todo.length) {
      var row = todo.shift();
      var vid = await fetchId(query(row.title, row.film));
      if (vid) ids[row.id] = vid;
      done++;
      if (done % 20 === 0 || !todo.length) {
        fs.writeFileSync(OUT, JSON.stringify(ids, null, 0));
        console.log('  ' + done + ' done, ' + todo.length + ' left');
      }
      await sleep(120);
    }
  }
  var workers = [];
  for (var i = 0; i < concurrency; i++) workers.push(worker());
  await Promise.all(workers);

  fs.writeFileSync(OUT, JSON.stringify(ids, null, 0));
  console.log('resolved ids total:', Object.keys(ids).length);
})();
