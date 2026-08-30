# 🌌 Omniverse TCG

A pack-opening trading card game where the cards can be **anything in the universe** — wild
animals, supercars, world landmarks, entire nations, mythic creatures, planets, deep-sea
monsters, and dinosaurs.

Inspired by the pack-opening thrill of Pokémon TCG, but with a collection that spans the
whole universe.

## ▶️ Play

**Live:** https://omniverse.quengadesigns.dev

It's an installable **PWA**: hit *Install* in the header (or your browser's install prompt)
to add it to your home screen or desktop, and it works fully offline after the first visit.

Or open `index.html` in any browser — no build step, no server, no dependencies.

```
open index.html          # macOS
xdg-open index.html      # Linux
```

Or host the folder on any static host (GitHub Pages, Netlify, Vercel).

## 🎮 How it works

- **Open packs** — every pack contains 5 cards. Tap the pack to rip it open, then tap each
  card to flip and reveal it. Rare pulls get glow, holo shimmer, and confetti.
- **Earn coins** — you start with 🪙 500 and claim a **free Universal Pack every 5 minutes**.
- **Sell cards** — duplicates can be sold for coins (one at a time in the Collection, or all
  at once with *Sell all duplicates*). Rarer cards sell for much more.
- **Buy more packs** — spend coins in the Pack Shop.
- **Collect** — 177 unique cards across 11 categories (from wild animals and nations to
  sports legends, screen tropes, and a genuinely excellent pet rock). Filter the Collection
  by category and rarity; unowned cards show as locked silhouettes, and tapping an owned
  card shows it full-size.
- **Progress saves automatically** in your browser (localStorage).

## 📦 Packs

| Pack | Cost | Contents |
|---|---|---|
| Universal Pack | 🪙 100 | All 8 categories |
| Beast Pack | 🪙 120 | Wild Kingdom, Deep Ocean, Prehistoric |
| Voyager Pack | 🪙 120 | Landmarks, Nations, Machines |
| Arcane Pack | 🪙 140 | Mythic Beings, Cosmos |
| Champions Pack | 🪙 120 | Sports Arena |
| Showtime Pack | 🪙 120 | Screen & Stage |
| Bedrock Pack | 🪙 120 | Rocks & Minerals |
| Stellar Pack | 🪙 400 | All categories, premium odds — no commons, guaranteed Epic+ |

New card sets are one block in `js/cards.js` (a category + its cards + a pack entry) — the
plan is to keep adding sets for anything that can be a card. A battle system built on each
card's power and signature move is on the roadmap.

## ✨ Rarities

| Rarity | Sell value | Odds (last card of a standard pack) |
|---|---|---|
| ◆ Common | 🪙 5 | — |
| ◆◆ Uncommon | 🪙 12 | — |
| ◆◆◆ Rare | 🪙 35 | 58% |
| ◆◆◆◆ Epic | 🪙 90 | 30% |
| ◆◆◆◆◆ Legendary | 🪙 250 | 10% |
| ◆◆◆◆◆◆ Mythic | 🪙 700 | 2% |

Every standard pack's 5th card is Rare or better. Mythics (Alba the First Unicorn, The
Kraken, The Big Bang, Zeus…) are the chase cards — one per category.

## 🗂️ Project layout

```
index.html             page structure + PWA wiring (manifest, service worker registration)
css/style.css          all styling and animations (pack rip, card flip, holo, confetti)
js/cards.js            card database (130 cards), rarities, categories, pack definitions
js/game.js             game state, economy, pack opening, rendering, localStorage saves
manifest.webmanifest   PWA manifest (name, icons, standalone display)
sw.js                  service worker: precaches the app shell, cache-first with background refresh
icons/                 app icons (any + maskable, 192/512, apple-touch)
```

Adding cards is one line in `js/cards.js`; new packs are one entry in the `PACKS` array.
