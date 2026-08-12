/*
 * Auto Driver Playlist — "stations": one-tap curated playlists.
 * Inspired by radio-style rotations. Each station is a recipe over the
 * catalogue (a `test` predicate on a song). Stations with a `time` window
 * [startHour, endHour) in IST light up as "Abhi Live" at that time of day.
 */

function _cat(s, c)  { return s.cats.indexOf(c) !== -1; }
function _best(s, b) { return s.best.indexOf(b) !== -1; }
function _mood(s, list) { return list.indexOf(s.mood) !== -1; }

const STATIONS = [
  { key: 'subah', name: 'Subah Sawaari', hint: 'Halki-phulki shuruaat', emoji: '☀️', time: [5, 10],
    test: function (s) { return _best(s, 'Morning') || (_mood(s, ['Happy', 'Relaxed', 'Reflective']) && s.energy !== 'High'); } },

  { key: 'din', name: 'Din Ki Bhaag-Daud', hint: 'Dhoop mein full speed', emoji: '🚦', time: [10, 17],
    test: function (s) { return _mood(s, ['Party', 'Fun', 'Travel', 'Happy']) && s.energy !== 'Low'; } },

  { key: 'sham', name: 'Sham-e-Ishq', hint: 'Dhalti sham, dheeme geet', emoji: '🌆', time: [17, 20],
    test: function (s) { return s.mood === 'Romantic' || _best(s, 'Evening'); } },

  { key: 'dard', name: 'Dard Bhare Geet', hint: 'Raat ke 2 baje wala dard', emoji: '💔', time: [20, 23],
    test: function (s) { return _mood(s, ['Sad', 'Emotional', 'Reflective']); } },

  { key: 'highway', name: 'Highway Raat', hint: 'Raat ke lambe route', emoji: '🌙', time: [23, 5],
    test: function (s) { return _cat(s, 'Highway') || _cat(s, 'Travel') || s.mood === 'Travel'; } },

  /* genre stations — always available, no clock */
  { key: 'volume', name: 'Full Volume', hint: 'DJ wale, awaaz tez', emoji: '📢',
    test: function (s) { return s.mood === 'Party' || _cat(s, 'DJ') || _cat(s, 'Dance'); } },

  { key: 'ninetiez', name: '90s Nostalgia', hint: 'Auto ka golden era', emoji: '📻',
    test: function (s) { return s.decade === '90s'; } },

  { key: 'shaadi', name: 'Shaadi Special', hint: 'Baraat aur celebration', emoji: '🎉',
    test: function (s) { return _cat(s, 'Wedding') || s.mood === 'Celebration'; } },

  { key: 'punjabi', name: 'Punjabi Tadka', hint: 'Balle balle', emoji: '🥁',
    test: function (s) { return _cat(s, 'Punjabi'); } },

  { key: 'barish', name: 'Barish', hint: 'Rimjhim ke geet', emoji: '🌧️',
    test: function (s) { return _cat(s, 'Rain'); } }
];

/* current time in IST, as an hour with a fractional part (0–24) */
function istHour() {
  var now = new Date();
  var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  var ist = new Date(utcMs + 5.5 * 3600000);
  return ist.getHours() + ist.getMinutes() / 60;
}

function _inWindow(h, start, end) {
  return start <= end ? (h >= start && h < end) : (h >= start || h < end);
}

/* the station scheduled for right now, or null */
function liveStation() {
  var h = istHour();
  for (var i = 0; i < STATIONS.length; i++) {
    var t = STATIONS[i].time;
    if (t && _inWindow(h, t[0], t[1])) return STATIONS[i];
  }
  return null;
}

function stationByKey(key) {
  for (var i = 0; i < STATIONS.length; i++) {
    if (STATIONS[i].key === key) return STATIONS[i];
  }
  return null;
}
