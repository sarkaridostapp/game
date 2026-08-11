/*
 * generate-songs.js — build assets/js/songs.js from the CSV catalog + the
 * original hand-curated tracks (which carry real YouTube ids and singers).
 *
 * Run:  node tools/generate-songs.js
 *
 * Merge rule: a curated track that also exists in the CSV (matched on
 * normalised title+film) keeps its yt id and singer but inherits the CSV's
 * richer taxonomy. Curated tracks with no CSV match are kept as-is. Songs
 * without a yt id play via YouTube search at runtime.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'assets', 'data', 'catalog.csv');
const OUT = path.join(ROOT, 'assets', 'js', 'songs.js');

/* ---- the original curated tracks: real yt ids + singers --------------- */
const CURATED = [
  { title: 'Oonchi Hai Building', film: 'Judwaa', year: 1997, singer: 'Abhijeet, Poornima', oldMood: 'mast', yt: 'gXd94eYUNZk' },
  { title: 'Jumma Chumma De De', film: 'Hum', year: 1991, singer: 'Sudesh Bhosle, Kavita Krishnamurthy', oldMood: 'mast', yt: '-AZJJOmwn5c' },
  { title: 'Tu Cheez Badi Hai Mast Mast', film: 'Mohra', year: 1994, singer: 'Udit Narayan, Kavita Krishnamurthy', oldMood: 'mast', yt: 'fT4vP4PnLxg' },
  { title: 'Choli Ke Peeche Kya Hai', film: 'Khalnayak', year: 1993, singer: 'Alka Yagnik, Ila Arun', oldMood: 'mast', yt: 'epYiGd853mQ' },
  { title: 'Ankhiyon Se Goli Maare', film: 'Dulhe Raja', year: 1998, singer: 'Sonu Nigam, Jaspinder Narula', oldMood: 'mast', yt: 'llfkNB3rRTc' },
  { title: 'Didi Tera Devar Deewana', film: 'Hum Aapke Hain Koun..!', year: 1994, singer: 'Lata Mangeshkar, S. P. Balasubrahmanyam', oldMood: 'mast', yt: 'ZqcDGvCM_w0' },
  { title: 'Ole Ole', film: 'Yeh Dillagi', year: 1994, singer: 'Abhijeet', oldMood: 'mast', yt: 'hcCvSmjHwGY' },
  { title: 'Sona Kitna Sona Hai', film: 'Hero No. 1', year: 1997, singer: 'Udit Narayan, Poornima', oldMood: 'mast', yt: '4mGzU0VbdSU' },
  { title: 'Muqabala Muqabala', film: 'Humse Hai Muqabala', year: 1994, singer: 'Mano, Swarnalatha', oldMood: 'mast', yt: 'FQzC23GLptE' },
  { title: 'Urvashi Urvashi', film: 'Humse Hai Muqabala', year: 1994, singer: 'A. R. Rahman, Suresh Peters', oldMood: 'mast', yt: 'dkedupX73xs' },
  { title: 'Ruk Ruk Ruk', film: 'Vijaypath', year: 1994, singer: 'Alisha Chinai', oldMood: 'mast', yt: '5pER2p6J-OM' },
  { title: 'Aati Kya Khandala', film: 'Ghulam', year: 1998, singer: 'Aamir Khan, Alka Yagnik', oldMood: 'mast', yt: 'yIFMTfgJzY0' },
  { title: 'Kisi Disco Mein Jaaye', film: 'Bade Miyan Chote Miyan', year: 1998, singer: 'Udit Narayan, Alka Yagnik', oldMood: 'mast', yt: 'wfAIdZKs6Ok' },
  { title: 'Dilbar Dilbar', film: 'Sirf Tum', year: 1999, singer: 'Alka Yagnik', oldMood: 'mast', yt: 'BJrHJoCqJKo' },
  { title: 'Gore Gore Mukhde Pe', film: 'Suhaag', year: 1994, singer: 'Udit Narayan, Alka Yagnik', oldMood: 'mast', yt: 'QBMN9Hi2lbk' },
  { title: 'Jhanjhariya Uski Chanak Gayi', film: 'Krishna', year: 1996, singer: 'Abhijeet, Alka Yagnik', oldMood: 'mast', yt: 'VqPdRyhbfM8' },
  { title: 'Mehndi Laga Ke Rakhna', film: 'Dilwale Dulhania Le Jayenge', year: 1995, singer: 'Lata Mangeshkar, Udit Narayan', oldMood: 'mast', yt: '-bNwqXvMuB8' },
  { title: 'Dhak Dhak Karne Laga', film: 'Beta', year: 1992, singer: 'Udit Narayan, Anuradha Paudwal', oldMood: 'romantic', yt: 'P7i0Z4yDKNM' },
  { title: 'Chura Ke Dil Mera', film: 'Main Khiladi Tu Anari', year: 1994, singer: 'Kumar Sanu, Alka Yagnik', oldMood: 'romantic', yt: '1eSG6dLiYxY' },
  { title: 'Yeh Kaali Kaali Aankhen', film: 'Baazigar', year: 1993, singer: 'Kumar Sanu, Anu Malik', oldMood: 'romantic', yt: '74sgRdJ6OHM' },
  { title: 'Pehla Nasha', film: 'Jo Jeeta Wohi Sikandar', year: 1992, singer: 'Udit Narayan, Sadhana Sargam', oldMood: 'romantic', yt: 'SBfPs-PMGTA' },
  { title: 'Tumse Milne Ki Tamanna Hai', film: 'Saajan', year: 1991, singer: 'S. P. Balasubrahmanyam, Alka Yagnik', oldMood: 'romantic', yt: 'Z4TEDNoExk4' },
  { title: 'Tadap Tadap Ke', film: 'Hum Dil De Chuke Sanam', year: 1999, singer: 'KK, Dominique Cerejo', oldMood: 'dard', yt: 'H4YOLNHFx0I' },
  { title: 'Tu Pyar Hai Kisi Aur Ka', film: 'Dil Hai Ke Manta Nahin', year: 1991, singer: 'Kumar Sanu, Anuradha Paudwal', oldMood: 'dard', yt: '47DstHmE-bE' },
  { title: 'Jab Koi Baat Bigad Jaye', film: 'Jurm', year: 1990, singer: 'Kumar Sanu, Sadhana Sargam', oldMood: 'dard', yt: 'ln3meCI0LFM' },
  { title: 'Kajra Re', film: 'Bunty Aur Babli', year: 2005, singer: 'Alisha Chinai, Shankar Mahadevan, Javed Ali', oldMood: 'bonus', yt: '4dsFQFCvVGU' },
  { title: 'Beedi Jalaile', film: 'Omkara', year: 2006, singer: 'Sukhwinder Singh, Sunidhi Chauhan', oldMood: 'bonus', yt: 'XLJCtZK0x5M' },
  { title: 'Munni Badnaam Hui', film: 'Dabangg', year: 2010, singer: 'Mamta Sharma, Aishwarya Nigam', oldMood: 'bonus', yt: 'vJV_WSPlK6Q' },
  { title: 'Sheila Ki Jawani', film: 'Tees Maar Khan', year: 2010, singer: 'Sunidhi Chauhan, Vishal Dadlani', oldMood: 'bonus', yt: 'ZTmF2v59CtI' },
  { title: 'Chikni Chameli', film: 'Agneepath', year: 2012, singer: 'Shreya Ghoshal', oldMood: 'bonus', yt: 'MQM7CNoAsBI' },
  { title: 'Fevicol Se', film: 'Dabangg 2', year: 2012, singer: 'Mamta Sharma, Wajid', oldMood: 'bonus', yt: 'zE7Pwgl6sLA' },
  { title: 'Lungi Dance', film: 'Chennai Express', year: 2013, singer: 'Yo Yo Honey Singh', oldMood: 'bonus', yt: '69CEiHfS_mc' },
  { title: 'Saree Ke Fall Sa', film: 'R... Rajkumar', year: 2013, singer: 'Antara Mitra, Nakash Aziz', oldMood: 'bonus', yt: 'EkxOXF9J77w' },
  { title: 'Party All Night', film: 'Boss', year: 2013, singer: 'Yo Yo Honey Singh', oldMood: 'bonus', yt: 'Wd7H311MrWA' },
  { title: 'Balam Pichkari', film: 'Yeh Jawaani Hai Deewani', year: 2013, singer: 'Vishal Dadlani, Shalmali Kholgade', oldMood: 'bonus', yt: '0WtRNGubWGA' },
  { title: 'Tune Maari Entriyaan', film: 'Gunday', year: 2014, singer: 'KK, Neeti Mohan, Vishal Dadlani, Bappi Lahiri', oldMood: 'bonus', yt: '2I3NgxDAiqE' },
  { title: 'Laila Main Laila', film: 'Raees', year: 2017, singer: 'Pawni Pandey', oldMood: 'bonus', yt: 'wjk7lV4PwAo' },
  { title: 'Aankh Marey', film: 'Simmba', year: 2018, singer: 'Neha Kakkar, Mika Singh, Kumar Sanu', oldMood: 'bonus', yt: '_KhQT-LGb-4' },
  { title: 'Lollypop Lagelu', film: 'Bhojpuri Hit', year: 2007, singer: 'Pawan Singh', oldMood: 'bonus', yt: 'FA7fR5omES0' }
];

/* map the old 4-mood scheme onto the CSV taxonomy for curated-only songs */
const OLD_MOOD = {
  mast:     { mood: 'Party',    energy: 'High',   cat: 'Party' },
  romantic: { mood: 'Romantic', energy: 'Medium', cat: 'Romantic' },
  dard:     { mood: 'Sad',      energy: 'Low',    cat: 'Sad' },
  bonus:    { mood: 'Party',    energy: 'High',   cat: 'Party' }
};

/* ---- helpers ---------------------------------------------------------- */
function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function key(title, film) { return norm(title) + '|' + norm(film); }

const DECADE_TOKENS = ['Evergreen', '80s', '90s', '2000s', '2010s', '2020s'];
function decadeFor(cats, year) {
  for (const c of cats) {
    if (DECADE_TOKENS.indexOf(c) !== -1) {
      return c === 'Evergreen' ? 'evergreen' : c;
    }
  }
  var y = Number(year);
  if (!y || y < 1980) return 'evergreen';
  if (y < 1990) return '80s';
  if (y < 2000) return '90s';
  if (y < 2010) return '2000s';
  if (y < 2020) return '2010s';
  return '2020s';
}

function slug(title, film, used) {
  var base = (norm(title) + '-' + norm(film)).replace(/^-|-$/g, '') || 'song';
  var s = base, n = 2;
  while (used.has(s)) { s = base + '-' + n; n++; }
  used.add(s);
  return s;
}

/* ---- parse the CSV ---------------------------------------------------- */
var lines = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
lines.shift(); // header

var curatedByKey = new Map();
CURATED.forEach(function (c) { curatedByKey.set(key(c.title, c.film), c); });
var usedCurated = new Set();

var used = new Set();
var seen = new Map(); // dedup key -> index in songs
var songs = [];

function push(rec) {
  var k = key(rec.title, rec.film);
  if (seen.has(k)) return; // internal duplicate — skip
  seen.set(k, songs.length);
  songs.push(rec);
}

lines.forEach(function (line) {
  var f = line.split(',');
  // columns: id,title,movie_or_album,year,categories,mood,energy,best_for,language,source_type
  var title = f[1], film = f[2], year = Number(f[3]);
  var cats = (f[4] || '').split(';').filter(Boolean);
  var mood = f[5] || 'Other';
  var energy = f[6] || 'Medium';
  var best = (f[7] || '').split(';').filter(Boolean);

  var k = key(title, film);
  var cur = curatedByKey.get(k);
  if (cur) usedCurated.add(k);

  push({
    id: slug(title, film, used),
    title: title,
    film: film,
    year: year,
    singer: cur ? cur.singer : '',
    decade: decadeFor(cats, year),
    mood: mood,
    energy: energy,
    cats: cats,
    best: best,
    yt: cur ? cur.yt : ''
  });
});

/* curated songs not present in the CSV — append them */
CURATED.forEach(function (c) {
  var k = key(c.title, c.film);
  if (usedCurated.has(k)) return;
  var m = OLD_MOOD[c.oldMood];
  push({
    id: slug(c.title, c.film, used),
    title: c.title,
    film: c.film,
    year: c.year,
    singer: c.singer,
    decade: decadeFor([], c.year),
    mood: m.mood,
    energy: m.energy,
    cats: [c.year < 2000 ? (c.year < 1990 ? '80s' : '90s') : (c.year < 2010 ? '2000s' : '2010s'), m.cat],
    best: ['Any'],
    yt: c.yt
  });
});

/* ---- distinct decades / moods for the UI ------------------------------ */
var DECADE_ORDER = ['90s', '2000s', '2010s', '2020s', '80s', 'evergreen'];
var DECADE_LABELS = {
  '90s': "90's", '2000s': "2000's", '2010s': "2010's",
  '2020s': "2020's", '80s': "80's", 'evergreen': 'Purane Gaane'
};
var DECADE_HINTS = {
  '90s': 'Auto ka golden era', '2000s': 'Naya zamana', '2010s': 'DJ wale',
  '2020s': 'Abhi ke', '80s': 'Disco raat', 'evergreen': 'Dada-dadi ke'
};

var moodCounts = {};
songs.forEach(function (s) { moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1; });
var moodOrder = Object.keys(moodCounts).sort(function (a, b) { return moodCounts[b] - moodCounts[a]; });

/* ---- emit ------------------------------------------------------------- */
function j(v) { return JSON.stringify(v); }

var out = [];
out.push('/*');
out.push(' * Auto Driver Playlist — song data (GENERATED)');
out.push(' * ---------------------------------------------');
out.push(' * Do not hand-edit. Source of truth: assets/data/catalog.csv');
out.push(' * Rebuild with:  node tools/generate-songs.js');
out.push(' *');
out.push(' * Fields: id, title, film, year, singer, decade, mood, energy,');
out.push(' * cats[], best[], yt. Tracks with an empty `yt` play via YouTube');
out.push(' * search at runtime (query = title + film + year).');
out.push(' */');
out.push('');
out.push('const SONGS = [');
songs.forEach(function (s) {
  out.push('  { id: ' + j(s.id) + ', title: ' + j(s.title) + ', film: ' + j(s.film) +
    ', year: ' + s.year + ', singer: ' + j(s.singer) + ', decade: ' + j(s.decade) +
    ', mood: ' + j(s.mood) + ', energy: ' + j(s.energy) + ', cats: ' + j(s.cats) +
    ', best: ' + j(s.best) + ', yt: ' + j(s.yt) + ' },');
});
out.push('];');
out.push('');
out.push('/* decade chips (primary filter) */');
out.push('const DECADES = [');
out.push("  { key: 'all', label: 'Poori Gaadi', hint: 'Saare gaane' },");
DECADE_ORDER.forEach(function (d) {
  if (!songs.some(function (s) { return s.decade === d; })) return;
  out.push('  { key: ' + j(d) + ', label: ' + j(DECADE_LABELS[d]) + ', hint: ' + j(DECADE_HINTS[d]) + ' },');
});
out.push("  { key: 'fav', label: 'Pasandeeda', hint: 'Aapke chune hue' }");
out.push('];');
out.push('');
out.push('/* mood/vibe options (secondary filter, shown in the dropdown) */');
out.push('const VIBES = [');
out.push("  { key: 'all', label: 'Sab Mood' },");
moodOrder.forEach(function (m) {
  out.push('  { key: ' + j(m) + ', label: ' + j(m) + ' },');
});
out.push('];');
out.push('');

fs.writeFileSync(OUT, out.join('\n'));

console.log('Wrote ' + songs.length + ' songs to ' + path.relative(ROOT, OUT));
console.log('With yt id: ' + songs.filter(function (s) { return s.yt; }).length +
  ' | search-based: ' + songs.filter(function (s) { return !s.yt; }).length);
console.log('Decades: ' + DECADE_ORDER.filter(function (d) { return songs.some(function (s) { return s.decade === d; }); }).join(', '));
console.log('Moods: ' + moodOrder.map(function (m) { return m + '(' + moodCounts[m] + ')'; }).join(', '));
