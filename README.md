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
- **Earn cash** — the in-game currency is USD. New players start with $25.00, pack stamina
  gives free opens (2 max, +1 every 5 minutes), and selling duplicates earns more.
- **Sell cards** — duplicates can be sold for coins (one at a time in the Collection, or all
  at once with *Sell all duplicates*). Rarer cards sell for much more.
- **Buy more packs** — spend coins in the Pack Shop.
- **Collect** — 209 unique cards across 13 categories (wild animals, nations, sports
  legends, screen tropes, original TCG battle creatures, video-game archetypes, and a
  genuinely excellent pet rock). Filter by category and rarity; tap any card for its page.
- **Quality** — every copy you pull has its own condition (Mint / Near Mint / Lightly
  Played / Moderately Played / Damaged), rolled from hidden centering/corners/edges/surface
  subscores. Condition changes what a copy is worth.
- **Per-card prices** — each card has its own market value based on rarity and power.
  Singles can be bought individually at market × 1.5, and every copy sells at its own
  condition- and grade-adjusted price.
- **OmniGrade grading** — send any copy to be graded (Standard $4.99, ready in 5 min, or
  Express $14.99, ready in 60 s). Cards come back slabbed with a 1–10 grade from a
  1000-point report (centering, corners, edges, surface). High grades multiply value —
  a 10 is worth 6× market. Track submissions and browse your graded collection in the
  Grade tab.
- **3D cards** — open any card and drag to spin it in 3D (front and back, tilt-reactive
  glare); double-tap to reset.
- **Progress saves automatically** in your browser (localStorage).

## 📦 Packs

| Pack | Cost | Contents |
|---|---|---|
| Universal Pack | $4.99 | All 11 categories |
| Beast Pack | $5.99 | Wild Kingdom, Deep Ocean, Prehistoric |
| Voyager Pack | $5.99 | Landmarks, Nations, Machines |
| Arcane Pack | $6.99 | Mythic Beings, Cosmos |
| Champions Pack | $5.99 | Sports Arena |
| Showtime Pack | $5.99 | Screen & Stage |
| Bedrock Pack | $5.99 | Rocks & Minerals |
| Stellar Pack | $19.99 | All categories, premium odds — no commons, guaranteed Epic+ |

New card sets are one block in `js/cards.js` (a category + its cards + a pack entry) — the
plan is to keep adding sets for anything that can be a card. A battle system built on each
card's power and signature move is on the roadmap.

## ✨ Rarities

| Rarity | Sell value | Odds (last card of a standard pack) |
|---|---|---|
| ◆ Common | $0.15 | — |
| ◆◆ Uncommon | $0.50 | — |
| ◆◆◆ Rare | $2.50 | 58% |
| ◆◆◆◆ Epic | $8.00 | 30% |
| ◆◆◆◆◆ Legendary | $25.00 | 10% |
| ◆◆◆◆◆◆ Mythic | $100.00 | 2% |

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
