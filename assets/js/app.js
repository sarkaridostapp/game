/* =====================================================================
   Auto Driver Playlist — player + playlist logic
   Plain ES5-ish JS, no build step, no dependencies beyond the YouTube
   IFrame API which is loaded at runtime.
   ===================================================================== */

(function () {
  'use strict';

  /* ------------------------------ storage ---------------------------- */

  var LS = {
    favs: 'adp:favs',
    theme: 'adp:theme',
    vol: 'adp:vol',
    last: 'adp:last',
    shuffle: 'adp:shuffle',
    repeat: 'adp:repeat',
    city: 'adp:city',
    introSeen: 'adp:introSeen'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private browsing / quota — playback still works, just not remembered */
    }
  }

  /* ------------------------------- state ----------------------------- */

  var state = {
    currentId: null,
    loadedId: null,   // what the YouTube player actually has loaded
    playing: false,
    decade: 'all',    // primary chip filter
    vibe: 'all',      // mood dropdown filter
    station: null,    // active curated station (overrides decade/vibe)
    query: '',
    shuffle: read(LS.shuffle, false),
    repeat: read(LS.repeat, 'all'), // 'off' | 'all' | 'one'
    favs: read(LS.favs, []),
    broken: {},
    view: SONGS.slice(),
    seeking: false,
    advancing: false  // guards against double auto-advance at end of track
  };

  var player = null;
  var playerReady = false;
  var pendingPlay = null; // { id, autoplay } queued while the API loads
  var ticker = null;

  /* ------------------------------- dom ------------------------------- */

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    npTitle: $('npTitle'),
    npMeta: $('npMeta'),
    playBtn: $('playBtn'),
    playIcon: $('playIcon'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    shuffleBtn: $('shuffleBtn'),
    repeatBtn: $('repeatBtn'),
    repeatIcon: $('repeatIcon'),
    favBtn: $('favBtn'),
    favIcon: $('favIcon'),
    shareBtn: $('shareBtn'),
    hornBtn: $('hornBtn'),
    themeBtn: $('themeBtn'),
    themeIcon: $('themeIcon'),
    seek: $('seek'),
    curTime: $('curTime'),
    durTime: $('durTime'),
    vol: $('vol'),
    search: $('search'),
    vibe: $('vibe'),
    chips: $('chips'),
    list: $('songList'),
    count: $('count'),
    empty: $('empty'),
    clearFilters: $('clearFilters'),
    surprise: $('surpriseBtn'),
    toast: $('toast'),
    intro: $('intro'),
    cityGrid: $('cityGrid'),
    startBtn: $('startBtn'),
    skipIntro: $('skipIntro'),
    introRick: $('introRick'),
    bgSkyline: $('bgSkyline'),
    bgRick: $('bgRick'),
    cityBtn: $('cityBtn'),
    cityName: $('cityName'),
    stationRow: $('stationRow'),
    liveBtn: $('liveBtn'),
    liveName: $('liveName')
  };

  /* ------------------------------ helpers ---------------------------- */

  function songById(id) {
    for (var i = 0; i < SONGS.length; i++) {
      if (SONGS[i].id === id) return SONGS[i];
    }
    return null;
  }

  function isFav(id) { return state.favs.indexOf(id) !== -1; }

  /* "film · year · singer" — singer is dropped when unknown */
  function metaLine(song) {
    var parts = [song.film, String(song.year)];
    if (song.singer) parts.push(song.singer);
    return parts.join(' · ');
  }

  function formatTime(secs) {
    if (!isFinite(secs) || secs < 0) secs = 0;
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  var toastTimer = null;
  function toast(msg, ms) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.hidden = true; }, ms || 2600);
  }

  function decadeLabel(key) {
    for (var i = 0; i < DECADES.length; i++) {
      if (DECADES[i].key === key) return DECADES[i].label;
    }
    return key;
  }

  /* ------------------------------ filtering -------------------------- */

  function computeView() {
    var q = state.query.trim().toLowerCase();
    var st = state.station ? stationByKey(state.station) : null;

    state.view = SONGS.filter(function (s) {
      if (st) {
        /* a station overrides the decade/mood filters entirely */
        if (!st.test(s)) return false;
      } else {
        /* primary: decade chip (with a special "fav" chip) */
        if (state.decade === 'fav') {
          if (!isFav(s.id)) return false;
        } else if (state.decade !== 'all' && s.decade !== state.decade) {
          return false;
        }
        /* secondary: mood/vibe dropdown */
        if (state.vibe !== 'all' && s.mood !== state.vibe) return false;
      }

      if (!q) return true;
      var hay = (s.title + ' ' + s.film + ' ' + s.singer + ' ' + s.year +
                 ' ' + s.mood + ' ' + s.cats.join(' ')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ----------------------------- rendering --------------------------- */

  function renderChips() {
    el.chips.innerHTML = '';
    DECADES.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', state.decade === m.key ? 'true' : 'false');
      b.innerHTML = '';
      b.appendChild(document.createTextNode(m.label));
      var small = document.createElement('small');
      small.textContent = m.hint;
      b.appendChild(small);
      b.addEventListener('click', function () {
        state.decade = m.key;
        state.station = null;   /* chips and stations are alternative filters */
        renderAll();
      });
      el.chips.appendChild(b);
    });
  }

  function renderStations() {
    var live = liveStation();
    el.liveName.textContent = live ? live.name : 'Koi nahi';

    el.stationRow.innerHTML = '';
    STATIONS.forEach(function (st) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'station-card' + (live && live.key === st.key ? ' is-live' : '');
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-pressed', state.station === st.key ? 'true' : 'false');
      b.innerHTML =
        '<span class="station-live"><span class="dot"></span>Live</span>' +
        '<span class="station-emoji" aria-hidden="true">' + st.emoji + '</span>' +
        '<span class="station-name"></span>' +
        '<span class="station-hint"></span>';
      b.querySelector('.station-name').textContent = st.name;
      b.querySelector('.station-hint').textContent = st.hint;
      b.addEventListener('click', function () {
        if (state.station === st.key) clearStation();
        else selectStation(st.key, true);
      });
      el.stationRow.appendChild(b);
    });
  }

  /* pick a station: it becomes the filter, and (radio-style) a random track
     from it starts playing */
  function selectStation(key, autoplay) {
    var st = stationByKey(key);
    if (!st) return;
    state.station = key;
    state.decade = 'all';
    state.vibe = 'all';
    state.query = '';
    el.search.value = '';
    if (el.vibe) el.vibe.value = 'all';
    renderAll();
    toast(st.emoji + ' ' + st.name);
    if (autoplay && state.view.length) {
      var pick = state.view[Math.floor(Math.random() * state.view.length)];
      play(pick.id);
    }
  }

  function clearStation() {
    state.station = null;
    renderAll();
  }

  function renderList() {
    el.list.innerHTML = '';

    state.view.forEach(function (song, i) {
      var li = document.createElement('li');
      li.className = 'song';
      li.dataset.id = song.id;
      if (song.id === state.currentId) li.classList.add('is-playing');
      if (state.broken[song.id]) li.classList.add('is-broken');

      /* index / equaliser ------------------------------------------- */
      var num = document.createElement('div');
      num.className = 'song-num';
      if (song.id === state.currentId) {
        var bars = document.createElement('div');
        bars.className = 'bars' + (state.playing ? '' : ' paused');
        bars.innerHTML = '<i></i><i></i><i></i>';
        num.appendChild(bars);
      } else {
        num.textContent = i + 1;
      }
      li.appendChild(num);

      /* title block --------------------------------------------------- */
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'song-btn';

      var t = document.createElement('span');
      t.className = 'song-title';
      t.textContent = song.title;
      btn.appendChild(t);

      var meta = document.createElement('span');
      meta.className = 'song-meta';
      meta.textContent = metaLine(song);
      btn.appendChild(meta);

      btn.addEventListener('click', function () { play(song.id); });
      li.appendChild(btn);

      /* right side ---------------------------------------------------- */
      var side = document.createElement('div');
      side.className = 'song-side';

      var tag = document.createElement('span');
      tag.className = 'tag tag-' + song.mood.toLowerCase();
      tag.textContent = song.mood;
      side.appendChild(tag);

      var fav = document.createElement('button');
      fav.type = 'button';
      fav.className = 'song-fav' + (isFav(song.id) ? ' on' : '');
      fav.textContent = isFav(song.id) ? '★' : '☆';
      fav.title = 'Pasandeeda';
      fav.setAttribute('aria-label', song.title + ' ko pasandeeda banao');
      fav.setAttribute('aria-pressed', isFav(song.id) ? 'true' : 'false');
      fav.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleFav(song.id);
      });
      side.appendChild(fav);

      li.appendChild(side);
      el.list.appendChild(li);
    });

    var n = state.view.length;
    el.count.textContent = n + (n === 1 ? ' gaana' : ' gaane');
    el.empty.hidden = n !== 0;
  }

  function renderNowPlaying() {
    var song = songById(state.currentId);

    if (!song) {
      el.npTitle.textContent = 'Kuch nahi baj raha';
      el.npMeta.textContent = 'Playlist se koi gaana chuno';
      el.favBtn.setAttribute('aria-pressed', 'false');
      el.favIcon.textContent = '☆';
      return;
    }

    el.npTitle.textContent = song.title;
    el.npMeta.textContent = metaLine(song);
    document.title = song.title + ' — Auto Driver Playlist';

    el.favBtn.setAttribute('aria-pressed', isFav(song.id) ? 'true' : 'false');
    el.favIcon.textContent = isFav(song.id) ? '★' : '☆';

    /* let long titles scroll, like the LED board on a bus */
    el.npTitle.classList.remove('scrolling');
    el.npTitle.style.removeProperty('--shift');
    var overflow = el.npTitle.scrollWidth - el.npTitle.parentNode.clientWidth;
    if (overflow > 4) {
      el.npTitle.style.setProperty('--shift', -overflow + 'px');
      el.npTitle.classList.add('scrolling');
    }

    if ('mediaSession' in navigator && window.MediaMetadata) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: song.title,
          artist: song.singer,
          album: song.film + ' (' + song.year + ')'
        });
      } catch (e) { /* metadata is a nicety, never fatal */ }
    }
  }

  function renderTransport() {
    /* the background auto only drives while music is actually playing */
    document.documentElement.classList.toggle('is-driving', state.playing);
    el.playIcon.textContent = state.playing ? '⏸' : '▶';
    el.shuffleBtn.setAttribute('aria-pressed', state.shuffle ? 'true' : 'false');
    el.repeatBtn.setAttribute('aria-pressed', state.repeat === 'off' ? 'false' : 'true');
    el.repeatIcon.textContent = state.repeat === 'one' ? '🔂' : '🔁';
    el.repeatBtn.title = 'Repeat: ' + state.repeat;
  }

  function renderAll() {
    computeView();
    renderChips();
    renderStations();
    renderList();
    renderNowPlaying();
    renderTransport();
  }

  /* ------------------------------ favourites ------------------------- */

  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i === -1) {
      state.favs.push(id);
      toast('Pasandeeda mein daal diya ★');
    } else {
      state.favs.splice(i, 1);
      toast('Pasandeeda se hata diya');
    }
    write(LS.favs, state.favs);
    renderAll();
  }

  /* ------------------------- youtube iframe api ---------------------- */

  function loadYouTubeAPI() {
    window.onYouTubeIframeAPIReady = function () {
      var vars = {
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3
      };
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        vars.origin = location.origin;
      }

      player = new window.YT.Player('player', {
        width: '100%',
        height: '100%',
        playerVars: vars,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    };

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = function () {
      toast('YouTube load nahi hua — internet check karo', 5000);
    };
    document.head.appendChild(tag);
  }

  function onPlayerReady() {
    playerReady = true;
    player.setVolume(Number(el.vol.value));

    if (pendingPlay) {
      var p = pendingPlay;
      pendingPlay = null;
      startTrack(p.id, p.autoplay);
    }
  }

  function onPlayerStateChange(e) {
    var YT = window.YT;

    if (e.data === YT.PlayerState.PLAYING) {
      state.playing = true;
      startTicker();
    } else if (e.data === YT.PlayerState.PAUSED) {
      state.playing = false;
      stopTicker();
    } else if (e.data === YT.PlayerState.ENDED) {
      state.playing = false;
      stopTicker();
      autoNext();
      return;
    }

    renderTransport();
    renderList();
  }

  /* Codes: 2 bad id · 5 html5 error · 100 gone/private · 101 & 150 embed off */
  function onPlayerError(e) {
    var song = songById(state.currentId);
    if (!song) return;

    state.broken[song.id] = true;
    renderList();

    var reason = (e.data === 101 || e.data === 150)
      ? 'Yeh gaana sirf YouTube par chalega'
      : 'Yeh gaana abhi nahi chal raha';
    toast(reason + ' — agla laga rahe hain…', 3200);

    setTimeout(function () {
      if (state.currentId === song.id) next(true);
    }, 1400);
  }

  /* ------------------------------ playback --------------------------- */

  function startTrack(id, autoplay) {
    var song = songById(id);
    if (!song) return;

    state.currentId = id;
    state.advancing = false;
    write(LS.last, id);

    if (!playerReady) {
      pendingPlay = { id: id, autoplay: autoplay };
      renderNowPlaying();
      renderList();
      return;
    }

    /* every song carries a real video id; the rare unresolved one is
       flagged and skipped rather than leaving the previous track playing */
    if (!song.yt) {
      state.broken[song.id] = true;
      state.loadedId = null;
      renderNowPlaying();
      renderList();
      toast('Yeh gaana abhi available nahi — agla laga rahe hain…', 2600);
      if (autoplay) setTimeout(function () {
        if (state.currentId === song.id) next(true);
      }, 700);
      return;
    }

    if (autoplay) player.loadVideoById(song.yt);
    else player.cueVideoById(song.yt);
    state.loadedId = id;

    el.seek.value = 0;
    el.curTime.textContent = '0:00';
    el.durTime.textContent = '0:00';

    renderNowPlaying();
    renderList();

    /* keep the current row in sight when skipping through a long list */
    var row = el.list.querySelector('.song.is-playing');
    if (row && row.scrollIntoView) {
      row.scrollIntoView({ block: 'nearest' });
    }
  }

  function play(id) {
    if (id === state.currentId && state.loadedId === id && playerReady) {
      togglePlay();
      return;
    }
    startTrack(id, true);
  }

  function togglePlay() {
    if (!playerReady) return;

    if (!state.currentId) {
      var first = state.view[0] || SONGS[0];
      if (first) play(first.id);
      return;
    }

    /* a cued search track hasn't been loaded yet — load and play it */
    if (state.loadedId !== state.currentId) {
      startTrack(state.currentId, true);
      return;
    }

    if (state.playing) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  /* Playback moves through whatever the list currently shows. */
  function pool() {
    return state.view.length ? state.view : SONGS;
  }

  function indexInPool(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === state.currentId) return i;
    }
    return -1;
  }

  function next(auto) {
    var list = pool();
    if (!list.length) return;

    var i = indexInPool(list);

    if (state.shuffle && list.length > 1) {
      var r = i;
      while (r === i) r = Math.floor(Math.random() * list.length);
      startTrack(list[r].id, true);
      return;
    }

    var nextIdx = i + 1;

    if (nextIdx >= list.length) {
      if (auto && state.repeat === 'off') {
        state.playing = false;
        renderTransport();
        toast('Playlist khatam. Savaari utar gayi 🛺');
        return;
      }
      nextIdx = 0;
    }

    startTrack(list[nextIdx].id, true);
  }

  function prev() {
    var list = pool();
    if (!list.length) return;

    /* first 3 seconds → restart, like every real music player */
    if (playerReady && state.currentId && player.getCurrentTime && player.getCurrentTime() > 3) {
      player.seekTo(0, true);
      return;
    }

    var i = indexInPool(list);
    var p = i <= 0 ? list.length - 1 : i - 1;
    startTrack(list[p].id, true);
  }

  /* ------------------------------- ticker ---------------------------- */

  /* auto-advance to the next track, guarded so it only fires once per song */
  function autoNext() {
    if (state.advancing) return;
    state.advancing = true;
    if (state.repeat === 'one') {
      player.seekTo(0, true);
      player.playVideo();
      state.advancing = false;
      return;
    }
    next(true);
  }

  function startTicker() {
    stopTicker();
    ticker = setInterval(function () {
      if (!playerReady || state.seeking) return;
      var cur = player.getCurrentTime() || 0;
      var dur = player.getDuration() || 0;
      el.curTime.textContent = formatTime(cur);
      el.durTime.textContent = formatTime(dur);
      el.seek.value = dur ? Math.round((cur / dur) * 1000) : 0;
    }, 500);
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  /* -------------------------------- horn ----------------------------- */

  var audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function honk() {
    try {
      if (!ensureAudio()) return;

      /* two-tone "pom pom", the way an auto actually sounds */
      [0, 0.22].forEach(function (offset) {
        var t0 = audioCtx.currentTime + offset;
        var gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        gain.connect(audioCtx.destination);

        [440, 554].forEach(function (freq) {
          var osc = audioCtx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t0);
          osc.connect(gain);
          osc.start(t0);
          osc.stop(t0 + 0.2);
        });
      });
    } catch (e) {
      /* no audio context — the visual shake still fires */
    }

    el.hornBtn.classList.remove('honking');
    void el.hornBtn.offsetWidth; /* restart the CSS animation */
    el.hornBtn.classList.add('honking');
  }

  /* synthesised auto-rickshaw start: two struggling cranks, it catches,
     settles into a putt-putt idle, then the horn. ~1.5s. */
  function engineStart(done) {
    var ctx = ensureAudio();
    if (!ctx) { if (done) setTimeout(done, 100); return; }
    try {
      var t0 = ctx.currentTime;

      var master = ctx.createGain();
      master.gain.setValueAtTime(0.9, t0);
      master.connect(ctx.destination);

      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(360, t0);
      lp.frequency.linearRampToValueAtTime(720, t0 + 1.3);
      lp.connect(master);

      /* the chugging cylinder */
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(22, t0);
      osc.frequency.linearRampToValueAtTime(30, t0 + 0.5);
      osc.frequency.exponentialRampToValueAtTime(58, t0 + 1.3);

      var eg = ctx.createGain();
      osc.connect(eg); eg.connect(lp);
      /* base envelope: crank, dip, crank, dip, catch, idle */
      eg.gain.setValueAtTime(0.05, t0);
      eg.gain.linearRampToValueAtTime(0.28, t0 + 0.18);
      eg.gain.linearRampToValueAtTime(0.06, t0 + 0.34);
      eg.gain.linearRampToValueAtTime(0.30, t0 + 0.55);
      eg.gain.linearRampToValueAtTime(0.10, t0 + 0.72);
      eg.gain.linearRampToValueAtTime(0.34, t0 + 1.00);
      eg.gain.setValueAtTime(0.30, t0 + 1.30);

      /* putt-putt: a square LFO added onto the engine gain */
      var lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(5, t0);
      lfo.frequency.linearRampToValueAtTime(16, t0 + 1.3);
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.22;
      lfo.connect(lfoGain); lfoGain.connect(eg.gain);

      /* gritty noise for the cranks + a little idle hiss */
      var nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
      var d = nb.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      var noise = ctx.createBufferSource(); noise.buffer = nb;
      var nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 300; nbp.Q.value = 0.7;
      var ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t0);
      noise.connect(nbp); nbp.connect(ng); ng.connect(master);
      [0, 0.34, 0.72].forEach(function (o) {
        ng.gain.setValueAtTime(0.18, t0 + o);
        ng.gain.exponentialRampToValueAtTime(0.001, t0 + o + 0.16);
      });
      ng.gain.setValueAtTime(0.04, t0 + 1.0);

      osc.start(t0); lfo.start(t0); noise.start(t0);
      var tEnd = t0 + 1.5;
      master.gain.setValueAtTime(0.9, t0 + 1.3);
      master.gain.exponentialRampToValueAtTime(0.001, tEnd);
      osc.stop(tEnd); lfo.stop(tEnd); noise.stop(tEnd);
    } catch (e) { /* audio is a nicety, never fatal */ }

    setTimeout(honk, 1150);          /* horn once it catches */
    if (done) setTimeout(done, 1650);
  }

  /* -------------------------------- theme ---------------------------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    el.themeIcon.textContent = theme === 'din' ? '☀️' : '🌙';
    write(LS.theme, theme);
  }

  /* -------------------------------- share ---------------------------- */

  function share() {
    var song = songById(state.currentId);
    var url = location.origin + location.pathname + (song ? '?song=' + song.id : '');
    var text = song ? song.title + ' — ' + song.film + ' (' + song.year + ')' : 'Auto Driver Playlist';

    if (navigator.share) {
      navigator.share({ title: 'Auto Driver Playlist', text: text, url: url })
        .catch(function () { /* user dismissed the sheet */ });
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast('Link copy ho gaya 🔗');
      }, function () {
        toast(url, 6000);
      });
      return;
    }

    toast(url, 6000);
  }

  /* ------------------------------- events ---------------------------- */

  function wire() {
    el.playBtn.addEventListener('click', togglePlay);
    el.nextBtn.addEventListener('click', function () { next(false); });
    el.prevBtn.addEventListener('click', prev);

    el.shuffleBtn.addEventListener('click', function () {
      state.shuffle = !state.shuffle;
      write(LS.shuffle, state.shuffle);
      renderTransport();
      toast(state.shuffle ? 'Shuffle chalu 🔀' : 'Shuffle band');
    });

    el.repeatBtn.addEventListener('click', function () {
      state.repeat = state.repeat === 'all' ? 'one' : (state.repeat === 'one' ? 'off' : 'all');
      write(LS.repeat, state.repeat);
      renderTransport();
      toast('Repeat: ' + state.repeat);
    });

    el.favBtn.addEventListener('click', function () {
      if (state.currentId) toggleFav(state.currentId);
    });

    el.shareBtn.addEventListener('click', share);
    el.hornBtn.addEventListener('click', honk);

    el.startBtn.addEventListener('click', startFromIntro);
    el.skipIntro.addEventListener('click', skipIntro);
    el.cityBtn.addEventListener('click', openIntro);

    el.themeBtn.addEventListener('click', function () {
      var now = document.documentElement.getAttribute('data-theme');
      applyTheme(now === 'din' ? 'raat' : 'din');
    });

    el.vol.addEventListener('input', function () {
      if (playerReady) player.setVolume(Number(el.vol.value));
      write(LS.vol, Number(el.vol.value));
    });

    el.seek.addEventListener('input', function () {
      state.seeking = true;
      if (!playerReady) return;
      var dur = player.getDuration() || 0;
      el.curTime.textContent = formatTime((el.seek.value / 1000) * dur);
    });

    el.seek.addEventListener('change', function () {
      state.seeking = false;
      if (!playerReady) return;
      var dur = player.getDuration() || 0;
      player.seekTo((el.seek.value / 1000) * dur, true);
    });

    var searchTimer = null;
    el.search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = el.search.value;
        computeView();
        renderList();
      }, 140);
    });

    el.vibe.addEventListener('change', function () {
      state.vibe = el.vibe.value;
      state.station = null;
      renderAll();
    });

    el.liveBtn.addEventListener('click', function () {
      var live = liveStation();
      if (live) selectStation(live.key, true);
      else toast('Abhi koi station live nahi hai');
    });

    el.clearFilters.addEventListener('click', function () {
      state.decade = 'all';
      state.vibe = 'all';
      state.station = null;
      state.query = '';
      el.search.value = '';
      if (el.vibe) el.vibe.value = 'all';
      renderAll();
    });

    el.surprise.addEventListener('click', function () {
      var list = pool();
      if (!list.length) return;
      var pick = list[Math.floor(Math.random() * list.length)];
      play(pick.id);
      toast('Chalo — ' + pick.title);
    });

    /* ------------------------- keyboard ---------------------------- */
    document.addEventListener('keydown', function (e) {
      if (el.intro && !el.intro.hidden) return; // intro open — swallow shortcuts
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

      if (e.key === '/' && !typing) {
        e.preventDefault();
        el.search.focus();
        return;
      }
      if (typing) {
        if (e.key === 'Escape') el.search.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case ' ':
          e.preventDefault(); togglePlay(); break;
        case 'n': case 'N':
          next(false); break;
        case 'p': case 'P':
          prev(); break;
        case 's': case 'S':
          el.shuffleBtn.click(); break;
        case 'r': case 'R':
          el.repeatBtn.click(); break;
        case 'f': case 'F':
          el.favBtn.click(); break;
        case 'h': case 'H':
          honk(); break;
        case 'ArrowRight':
          if (playerReady && state.currentId) player.seekTo((player.getCurrentTime() || 0) + 10, true);
          break;
        case 'ArrowLeft':
          if (playerReady && state.currentId) player.seekTo(Math.max(0, (player.getCurrentTime() || 0) - 10), true);
          break;
      }
    });

    /* the marquee shift depends on the panel width, so recompute it */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderNowPlaying, 200);
    });

    /* ---------------------- lock screen controls -------------------- */
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('nexttrack', function () { next(false); });
        navigator.mediaSession.setActionHandler('previoustrack', prev);
      } catch (e) { /* older browsers ignore unknown actions */ }
    }
  }

  /* -------------------------- cities / intro ------------------------- */

  var introCity = null; // highlighted in the picker, applied on start

  function cityByKey(key) {
    for (var i = 0; i < CITIES.length; i++) {
      if (CITIES[i].key === key) return CITIES[i];
    }
    return null;
  }

  function applyCity(key) {
    var c = cityByKey(key) || CITIES[0];
    el.bgSkyline.innerHTML = svgWrap(c.skyline);
    el.cityName.textContent = c.name;
    write(LS.city, c.key);
  }

  function svgWrap(inner) {
    return '<svg viewBox="0 0 300 100" preserveAspectRatio="xMidYMax meet">' + inner + '</svg>';
  }

  function markSelected(key) {
    introCity = key;
    var cards = el.cityGrid.querySelectorAll('.city-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].setAttribute('aria-selected', cards[i].getAttribute('data-key') === key ? 'true' : 'false');
    }
    el.startBtn.disabled = !key;
  }

  function buildCityGrid() {
    el.cityGrid.innerHTML = '';
    CITIES.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'city-card';
      b.setAttribute('data-key', c.key);
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', 'false');
      b.innerHTML = '<span class="city-sky">' + svgWrap(c.skyline) + '</span>';
      var nm = document.createElement('span');
      nm.textContent = c.name;
      b.appendChild(nm);
      b.addEventListener('click', function () { markSelected(c.key); });
      el.cityGrid.appendChild(b);
    });
  }

  function openIntro() {
    buildCityGrid();
    var current = read(LS.city, null);
    markSelected(current && cityByKey(current) ? current : null);
    el.intro.classList.remove('starting');
    el.intro.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }

  function hideIntro() {
    el.intro.hidden = true;
    el.intro.classList.remove('starting');
    document.documentElement.style.overflow = '';
  }

  function pickedCity() {
    return introCity || read(LS.city, null) || CITIES[0].key;
  }

  function startFromIntro() {
    applyCity(pickedCity());
    write(LS.introSeen, true);
    el.intro.classList.add('starting'); /* drive across + fade out */
    engineStart(hideIntro);
  }

  function skipIntro() {
    applyCity(pickedCity());
    write(LS.introSeen, true);
    hideIntro();
  }

  /* -------------------------------- boot ----------------------------- */

  function renderVibes() {
    el.vibe.innerHTML = '';
    VIBES.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v.key;
      o.textContent = v.label;
      el.vibe.appendChild(o);
    });
    el.vibe.value = state.vibe;
  }

  function boot() {
    applyTheme(read(LS.theme, 'raat'));
    el.vol.value = read(LS.vol, 80);

    renderVibes();
    renderAll();
    wire();
    loadYouTubeAPI();

    /* keep the "Abhi Live" station current as the clock rolls over */
    setInterval(renderStations, 60000);

    /* the auto art for the intro + the background strip */
    el.bgRick.innerHTML = RICKSHAW;
    el.introRick.innerHTML = RICKSHAW;

    var savedCity = read(LS.city, null);
    applyCity(savedCity && cityByKey(savedCity) ? savedCity : CITIES[0].key);

    /* first-time visitors pick a city and start the auto; everyone else
       goes straight to the playlist with their city already set */
    if (!read(LS.introSeen, false)) openIntro();

    /* deep link beats "last played" */
    var params = new URLSearchParams(location.search);
    var deep = params.get('song');
    var startId = (deep && songById(deep)) ? deep : read(LS.last, null);

    if (startId && songById(startId)) {
      /* cue it, don't autoplay — browsers block sound before a click anyway */
      startTrack(startId, false);
    }
  }

  boot();
})();
