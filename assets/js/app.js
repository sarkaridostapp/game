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
    repeat: 'adp:repeat'
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
    toast: $('toast')
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

    state.view = SONGS.filter(function (s) {
      /* primary: decade chip (with a special "fav" chip) */
      if (state.decade === 'fav') {
        if (!isFav(s.id)) return false;
      } else if (state.decade !== 'all' && s.decade !== state.decade) {
        return false;
      }
      /* secondary: mood/vibe dropdown */
      if (state.vibe !== 'all' && s.mood !== state.vibe) return false;

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
        renderAll();
      });
      el.chips.appendChild(b);
    });
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
    el.playIcon.textContent = state.playing ? '⏸' : '▶';
    el.shuffleBtn.setAttribute('aria-pressed', state.shuffle ? 'true' : 'false');
    el.repeatBtn.setAttribute('aria-pressed', state.repeat === 'off' ? 'false' : 'true');
    el.repeatIcon.textContent = state.repeat === 'one' ? '🔂' : '🔁';
    el.repeatBtn.title = 'Repeat: ' + state.repeat;
  }

  function renderAll() {
    computeView();
    renderChips();
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
      if (state.repeat === 'one') {
        player.seekTo(0, true);
        player.playVideo();
        return;
      }
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

  /* search query for tracks that have no hard-coded YouTube id */
  function searchQuery(song) {
    return song.title + ' ' + song.film + ' ' + song.year + ' song';
  }

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

    if (song.yt) {
      /* exact video id (the hand-curated tracks) */
      if (autoplay) player.loadVideoById(song.yt);
      else player.cueVideoById(song.yt);
      state.loadedId = id;
    } else if (autoplay) {
      /* no id — play the top YouTube search result */
      player.loadPlaylist({ listType: 'search', list: searchQuery(song) });
      state.loadedId = id;
    } else {
      /* can't "cue" a search, so just show it; first Play will load it */
      state.loadedId = null;
    }

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

      /* search-based tracks come as a YouTube search "playlist"; if we let
         it end, YouTube auto-plays the next search result instead of our
         next song. So we take over just before the end. Id-based tracks use
         the reliable ENDED event and are left alone here. */
      var song = songById(state.currentId);
      if (song && !song.yt && dur > 0 && cur >= dur - 1.2) {
        autoNext();
      }
    }, 500);
  }

  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  /* -------------------------------- horn ----------------------------- */

  var audioCtx = null;

  function honk() {
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

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
      computeView();
      renderList();
    });

    el.clearFilters.addEventListener('click', function () {
      state.decade = 'all';
      state.vibe = 'all';
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
