# 🛺 Auto Driver Playlist

A single-page website for the playlist that used to play in every auto rickshaw —
90s Hindi, full volume, horn included. Same idea as the "bus driver playlist" /
"truck driver playlist" / "saloon playlist" collections, built as an actual site
you can open and play.

**500 tracks**, streamed from YouTube. No dependencies, no backend — static files
and it runs.

## What's in it

**The playlist** — 500 Hindi songs spanning the 1950s to 2023, each with a real
YouTube video id (39 hand-curated, the rest resolved once at build time — see
*Playback* below). Filter along two axes:

- **Decade chips** — 90's, 2000's, 2010's, 2020's, 80's, and Purane Gaane
  (evergreen classics), plus a Pasandeeda (favourites) chip.
- **Mood dropdown** — Romantic, Party, Sad, Travel, Fun, Happy, Reflective,
  Relaxed, Celebration, Motivational, Intense, Emotional.

## Playback

The player is **audio-only** — the YouTube iframe streams sound from off-screen,
there is no video panel. Every track has a real YouTube video id, so playback is
a straight `loadVideoById`. YouTube removed search-based loading from its IFrame
API, so ids can't be resolved in the browser; instead
[`tools/resolve-ids.js`](tools/resolve-ids.js) looks up each song's top search
result **once at build time** and bakes the id into the catalog. If a video
turns out to be un-embeddable, the player flags it and skips to the next song.

**City intro** — first visit opens a picker: choose a city (Mumbai, Delhi,
Jaipur, Kolkata, Chennai, Bengaluru, Agra, Noida), tap to start the auto (a
synthesised engine + horn), and the rickshaw drives across as the playlist is
revealed. The choice is remembered; a background strip shows the city skyline
and an auto that drives only while music plays.

**Stations** — one-tap curated playlists (radio style): Subah Sawaari, Din Ki
Bhaag-Daud, Sham-e-Ishq, Dard Bhare Geet, Highway Raat, Full Volume, 90s
Nostalgia, Shaadi Special, Punjabi Tadka, Barish. The five time-based ones light
up as **🔴 Abhi Live** at the matching hour (IST); tapping a station shuffles a
track from it. Defined in [`assets/js/stations.js`](assets/js/stations.js) as
predicates over the catalogue.

**The player**

- Play / pause / next / previous, shuffle, and repeat (off → all → one)
- Seek bar with elapsed and total time, volume control
- Auto-advance to the next track when one ends
- Search across song, film, singer, year, mood, and category
- Decade chips + a mood dropdown, plus a **Pasandeeda** (favourites) filter
- "🎲 Koi bhi bajao" — random track from whatever is currently listed
- **Horn OK Please** button — a two-tone auto horn synthesised with the Web Audio
  API, so there is no sound file to ship
- Din / Raat (light / dark) theme toggle
- Deep links: `?song=tadap-tadap-ke` opens the site with that track cued
- Favourites, volume, theme, shuffle/repeat, and last-played track are remembered
  in `localStorage`
- Lock-screen / media-key controls via the Media Session API
- Keyboard: `Space` play/pause · `N` next · `P` previous · `S` shuffle ·
  `R` repeat · `F` favourite · `H` horn · `/` search · `←`/`→` seek 10s

If a video turns out to be blocked from embedding, the player says so and skips
to the next track instead of sitting on a dead screen.

## Running it

Any static file server will do:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight off disk also works, though the YouTube player is
happier over `http://`.

## Deploying to Vercel

There is no build step, so Vercel serves the folder as-is. `vercel.json` sets the
cache and security headers; you do not need to configure anything in the
dashboard.

**From your machine** — fastest route:

```bash
npm i -g vercel     # once
cd game
vercel              # preview deploy, follow the login prompt
vercel --prod       # production URL
```

When it asks for settings, accept the defaults: framework **Other**, root
directory `./`, and leave the build command and output directory empty.

**From the dashboard** — no CLI:

Go to [vercel.com/new](https://vercel.com/new) and drag the project folder onto
the page, or click **Import Git Repository** once this branch is on GitHub. Set
framework to **Other** and leave the build settings blank.

### Other hosts

Any static host works. For GitHub Pages: push this branch, then **Settings →
Pages → Source: Deploy from a branch**, pick the branch and the `/ (root)`
folder.

### A note on caching

`style.css`, `app.js` and `songs.js` do not have content hashes in their
filenames, so `vercel.json` caches them for an hour rather than forever. Edits go
live within an hour, or immediately after a redeploy for anyone who has not
cached them. If you start shipping changes often, either lower `max-age` or add a
version query to the tags in `index.html` (`app.js?v=2`).

## Adding songs

The catalog is generated. **Edit the CSV, not `songs.js`.**

1. Add a row to [`assets/data/catalog.csv`](assets/data/catalog.csv):

   ```
   id,title,movie_or_album,year,categories,mood,energy,best_for,language,source_type
   song_0478,New Song,New Film,2024,2020s;Romantic,Romantic,Low,Night,Hindi,curated_catalog
   ```

   `categories` and `best_for` are `;`-separated. The `decade` chip is taken
   from the decade token in `categories` (`90s`, `2000s`, …, `Evergreen`), or
   derived from `year` if none is present. The `mood` column drives the mood
   dropdown and the row's colour tag.

2. Resolve YouTube ids for any new rows, then rebuild the catalog:

   ```bash
   node tools/resolve-ids.js      # fills in ids for songs that lack one
   node tools/generate-songs.js   # rebuilds assets/js/songs.js
   ```

`resolve-ids.js` is idempotent — it only looks up songs missing from
[`assets/data/yt-ids.json`](assets/data/yt-ids.json), so re-runs are cheap.
`generate-songs.js` rebuilds [`assets/js/songs.js`](assets/js/songs.js) — 500-odd
song objects plus the `DECADES` and `VIBES` lists the UI reads. The 39
hand-curated tracks with exact ids live in the `CURATED` array inside
`generate-songs.js` and are merged in (deduplicated on title + film); their ids
win over resolved ones.

To give a specific mood its own tag colour, add a `.tag-<mood>` rule (lowercase)
in [`assets/css/style.css`](assets/css/style.css).

## Layout

```
index.html                  markup
assets/css/style.css        truck-art styling, both themes, responsive rules
assets/data/catalog.csv     the playlist source data — edit this
assets/data/yt-ids.json     resolved YouTube ids (build cache)
tools/resolve-ids.js        looks up a YouTube id per song (build time)
tools/generate-songs.js     builds songs.js from the CSV + ids + curated tracks
assets/js/songs.js          GENERATED — do not hand-edit
assets/js/cities.js         intro city skylines + shared rickshaw art
assets/js/stations.js       curated "station" playlists + live-by-time logic
assets/js/app.js            player, filtering, favourites, keyboard, horn, intro
```

## A note on the music

Nothing is hosted here. Every track plays through YouTube's embedded player,
which means views and ad revenue go to the rights holders the same as on YouTube
itself. All songs remain the copyright of their respective owners.
