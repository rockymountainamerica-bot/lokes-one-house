# lokes.one brand house

Static LOKES ONE brand house. **Better than Shopify vibe — without Shopify.** Neo-tradition under a compute shell. **$0 hosting** (GitHub Pages). The arcade is the front door.

## What's here

- `index.html` — production **Cartridge HUD** house: defense-grade black/white surface, crop-mark frames, notched arcade tokens, an 8px grid, `steps()` motion only
  - **The stage** (`assets/invaders.js`): a Space Invaders cabinet that plays itself on load (attract mode, tagged `demo`). One tap / `P` / `Enter` / ▶ START begins a real run (`live`)
    - **Sectors are the three holdings**: 01 lokes.one → 02 me.lokes.one → 03 vanism.ai, on loop. Every third sector **the cart** shows up as the boss and gets sent back — *shop stays parked*. A mystery ship drifts by from sector 02. Clear sector 09 → **EMPIRE SECURED** win screen, then overtime
    - Feedback: hard pink flash, stepped screen-shake, 0/1 pixel shrapnel, DOM score pops with a combo multiplier (×2…×5), Odin reactions (faces the way he moves, recoils, ouches, cheers, spins on the win)
    - **Arcade table**: top 5 with 3-letter initials (▲▼ per slot or type letters, Enter), `localStorage` keys `lokes.hi.table`, `lokes.hi`, `lokes.ini`. HI-SCORE readout shows the leader's initials
    - Controls: ← → / A D / pointer to move · Space / ↑ / W / tap to fire (hold to autofire) · Esc exits · on-screen ◄ ► ● pad on phones and any coarse pointer
    - Scoreline: 1UP · HI-SCORE · LIVES · SECTOR · COMBO · INSERT COIN (70s cabinet, mission-control readouts)
  - **Odin**, the pixel white rabbit, huge in the hero (`assets/pixel-rabbit-portrait.png`, up to 600px). Tap to hop (hearts), Konami code to spin (1UP chip). Shrinks to cannon size during play on phones so he can cross the stage
  - **C3i desk** dialog box with typewriter output; it comments on the live run (sectors, boss, combos, table entries), stays quiet during the demo
  - Commands: `help` · `c3i` · `desk` · `whoami` · `odin` · `hop` · `play` · `pilot` · `scores` · `sectors` · `boss` · `coin` · `vanism` · `book` · `doors` · `ride` · `film` · `press` · `credits` · `clear`
  - Hard links: [vanism.ai](https://vanism.ai) · [me.lokes.one](https://me.lokes.one) · [Blood Mutant](https://bloodmutant.com/)
- `assets/` — `house.css` · `stars.js` (pixel starfield) · `invaders.js` · `odin.js` · `c3i.js` · `sprite.svg` (pixel wordmark, door icons, heart) · `pixel-rabbit.svg` · `pixel-rabbit-portrait.png` · `og-card.png`
- `samples/` — `og-card.html` (source of `assets/og-card.png`, render headless at 1200×630) · cartridge HUD / phosphor / amber / cyan / brutal variants + `gallery.html`

Script order matters: `stars.js` → `invaders.js` → `odin.js` → `c3i.js` (`c3i` reads `window.LOKES.*`). `window.LOKES.game` exposes `start · stop · toggle · isPlaying · mode · auto · table · state`; `window.LOKES.odin` exposes `hop · spin · hearts`. Game events arrive on `document` as `lokes:game` (`attract · start · kill · hit · combo · ufo · wave · boss · bosskill · win · over · hiscore · stop`).

## Law

- **Three doors:** vanism.ai (product) · me.lokes.one (man) · lokes.one (this house). The level select shows six tiles: those three are the **primary** doors; youtube · appstore · c3i · book are **satellites** (book stays soon)
- **Shop PARKED** until a real drop. The cart in the game is the joke: it never gets in
- **No cross-brand content** anywhere — the rescue-tech company lives in its own repo; the harness greps this house for its three-letter acronym as a whole word and must find none
- C3i is a warm concise desk greeter — **not** a fake full-AGI claim
- Blood Mutant book door → https://bloodmutant.com/ (Buy on Amazon). Do not invent ASINs
- Design: 8px grid, sharp or stepped corners (no `border-radius`), no blur, `steps()` motion only, green = live, amber = parked, pink = laser / top row / hearts, cyan = links. No build step, no npm

## Preview locally

```bash
python3 -m http.server 8811 --bind 0.0.0.0
# → http://127.0.0.1:8811/   (external <use href="assets/sprite.svg#…"> needs http://, not file://)
```

## Free deploy (GitHub Pages)

1. Repo **Settings → Pages → Source:** Deploy from branch `main` / `/ (root)`
2. Site URL: `https://rockymountainamerica-bot.github.io/lokes-one-house/`
3. When founder stamps DNS: point `lokes.one` CNAME to `rockymountainamerica-bot.github.io` (or transfer later)
4. TODO og-card.png: regenerate from `samples/og-card.html` (1200×630) and commit — the current PNG is the old phosphor card

## Samples

See [`samples/gallery.html`](samples/gallery.html). Screenshots live under `samples/*.png` (local) and optional `.svg` mirrors.
