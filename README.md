# 🛺 Auto Driver Playlist

A single-page website for the playlist that used to play in every auto rickshaw —
90s Hindi, full volume, horn included. Same idea as the "bus driver playlist" /
"truck driver playlist" / "saloon playlist" collections, built as an actual site
you can open and play.

**39 tracks**, streamed from YouTube. No build step, no dependencies, no backend —
three static files and it runs.

## What's in it

**The playlist** — 25 songs from the 90s plus 14 bonus tracks from later years,
sorted into four moods:

| Mood | What it is | Count |
|------|-----------|-------|
| Mast Mast | The loud ones — Oonchi Hai Building, Tu Cheez Badi Hai, Choli Ke Peeche | 17 |
| Romantic | Dhak Dhak, Pehla Nasha, Chura Ke Dil Mera | 5 |
| Dard Bhare | Raat ke 2 baje — Tadap Tadap, Jab Koi Baat Bigad Jaye | 3 |
| Bonus | 90s ke baad — Kajra Re through Aankh Marey | 14 |

**The player**

- Play / pause / next / previous, shuffle, and repeat (off → all → one)
- Seek bar with elapsed and total time, volume control
- Auto-advance to the next track when one ends
- Search across song, film, singer, and year
- Mood filter chips, plus a **Pasandeeda** (favourites) filter
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

Everything lives in [`assets/js/songs.js`](assets/js/songs.js). Copy a block,
change the fields:

```js
{
  id: 'oonchi-hai-building',   // unique slug, used for ?song= deep links
  title: 'Oonchi Hai Building',
  film: 'Judwaa',
  year: 1997,
  singer: 'Abhijeet, Poornima',
  mood: 'mast',                // mast | romantic | dard | bonus
  yt: 'gXd94eYUNZk'            // the bit after ?v= in the YouTube URL
}
```

To add a whole new mood, add an entry to the `MOODS` array in the same file and
a `.tag-<key>` colour rule in [`assets/css/style.css`](assets/css/style.css).

## Layout

```
index.html              markup
assets/css/style.css    truck-art styling, both themes, responsive rules
assets/js/songs.js      the playlist data — edit this to change songs
assets/js/app.js        player, filtering, favourites, keyboard, horn
```

## A note on the music

Nothing is hosted here. Every track plays through YouTube's embedded player,
which means views and ad revenue go to the rights holders the same as on YouTube
itself. All songs remain the copyright of their respective owners.
