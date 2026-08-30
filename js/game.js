/* ============================================================
   OMNIVERSE TCG — Game logic & UI
   ============================================================ */

const SAVE_KEY = 'omniverse-tcg-save-v1';
const FREE_PACK_INTERVAL = 5 * 60 * 1000; // one free Universal Pack every 5 minutes
const START_COINS = 500;

let state = {
  coins: START_COINS,
  owned: {},          // cardId -> copies owned
  packsOpened: 0,
  totalPulls: 0,
  lastFreePack: 0,    // timestamp of last free pack claim
};

/* ---------------- persistence ---------------- */

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* corrupted save: start fresh */ }
}

/* ---------------- helpers ---------------- */

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function fmt(n) { return n.toLocaleString('en-US'); }

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function uniqueOwned() { return Object.keys(state.owned).filter(id => state.owned[id] > 0).length; }

/* ---------------- pull logic ---------------- */

function rollRarity(table) {
  let roll = Math.random() * 100;
  for (const [rar, weight] of Object.entries(table)) {
    if (roll < weight) return rar;
    roll -= weight;
  }
  return Object.keys(table)[0]; // float rounding fallback
}

function cardPool(pack, rar) {
  const inCats = c => !pack.cats || pack.cats.includes(c.cat);
  let pool = CARDS.filter(c => c.rar === rar && inCats(c));
  if (pool.length) return pool;
  // A rarity may not exist within a themed pack's categories: step down until it does.
  const order = ['m', 'l', 'e', 'r', 'u', 'c'];
  for (let i = order.indexOf(rar) + 1; i < order.length; i++) {
    pool = CARDS.filter(c => c.rar === order[i] && inCats(c));
    if (pool.length) return pool;
  }
  return CARDS;
}

function pullPack(pack) {
  return pack.odds.map(table => {
    const pool = cardPool(pack, rollRarity(table));
    return pool[Math.floor(Math.random() * pool.length)];
  });
}

/* ---------------- economy ---------------- */

function buyPack(packId, free = false) {
  const pack = PACKS.find(p => p.id === packId);
  if (!pack) return;
  if (!free) {
    if (state.coins < pack.cost) { toast('Not enough coins — sell some duplicates!'); return; }
    state.coins -= pack.cost;
  } else {
    state.lastFreePack = Date.now();
  }
  state.packsOpened++;
  const pulls = pullPack(pack);
  save();
  renderHeader();
  startOpening(pack, pulls);
}

function sellCard(cardId, count) {
  const have = state.owned[cardId] || 0;
  count = Math.min(count, have);
  if (count <= 0) return 0;
  const card = CARDS_BY_ID[cardId];
  const value = RARITIES[card.rar].sell * count;
  state.owned[cardId] = have - count;
  state.coins += value;
  save();
  renderHeader();
  return value;
}

function sellAllDuplicates() {
  let total = 0, sold = 0;
  for (const [id, n] of Object.entries(state.owned)) {
    if (n > 1) {
      total += RARITIES[CARDS_BY_ID[id].rar].sell * (n - 1);
      sold += n - 1;
      state.owned[id] = 1;
    }
  }
  if (!sold) { toast('No duplicates to sell.'); return; }
  state.coins += total;
  save();
  renderHeader();
  renderCollection();
  toast(`Sold ${sold} duplicate${sold > 1 ? 's' : ''} for 🪙 ${fmt(total)}`);
}

/* ---------------- card rendering ---------------- */

function cardHTML(card, opts = {}) {
  const rar = RARITIES[card.rar];
  const cat = CATEGORIES[card.cat];
  const copies = state.owned[card.id] || 0;
  const holo = ['e', 'l', 'm'].includes(card.rar) ? ' holo' : '';
  const shine = ['r', 'e', 'l', 'm'].includes(card.rar) ? '<div class="shine"></div>' : '';
  const badge = opts.isNew ? '<div class="new-badge">NEW</div>' : '';
  const count = opts.showCount && copies > 1 ? `<div class="copy-count">×${copies}</div>` : '';
  return `
    <div class="card rar-${card.rar}${holo}" style="--hue:${cat.hue}" data-card-id="${card.id}">
      ${shine}${badge}${count}
      <div class="card-top">
        <span class="card-cat">${cat.icon} ${cat.name}</span>
        <span class="card-pow">⚡${card.pow}</span>
      </div>
      <div class="card-art"><span>${card.emoji}</span></div>
      <div class="card-name">${card.name}</div>
      <div class="card-rarity" style="color:${rar.color}">${'◆'.repeat(rarityRank(card.rar) + 1)} ${rar.name}</div>
      <div class="card-lore">${card.lore}</div>
    </div>`;
}

function rarityRank(r) { return ['c', 'u', 'r', 'e', 'l', 'm'].indexOf(r); }

function cardBackHTML() {
  return `<div class="card card-back"><div class="back-logo">🌌</div><div class="back-title">OMNIVERSE</div></div>`;
}

/* ---------------- header ---------------- */

function renderHeader() {
  $('#coin-count').textContent = fmt(state.coins);
  $('#stat-unique').textContent = `${uniqueOwned()}/${CARDS.length}`;
  $('#stat-packs').textContent = fmt(state.packsOpened);
}

function renderFreePackTimer() {
  const btn = $('#free-pack-btn');
  const remaining = state.lastFreePack + FREE_PACK_INTERVAL - Date.now();
  if (remaining <= 0) {
    btn.disabled = false;
    btn.textContent = '🎁 Claim Free Pack';
  } else {
    btn.disabled = true;
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    btn.textContent = `🎁 Free pack in ${m}:${String(s).padStart(2, '0')}`;
  }
}

/* ---------------- shop ---------------- */

function renderShop() {
  $('#pack-grid').innerHTML = PACKS.map(p => {
    const [g1, g2, g3] = p.grad;
    const catIcons = (p.cats || Object.keys(CATEGORIES)).map(c => CATEGORIES[c].icon).join(' ');
    const afford = state.coins >= p.cost;
    return `
      <div class="pack" data-pack-id="${p.id}">
        <div class="pack-visual" style="background:linear-gradient(160deg,${g1},${g2} 55%,${g3})">
          <div class="pack-crimp pack-crimp-top"></div>
          <div class="pack-icon">${p.icon}</div>
          <div class="pack-label">${p.name.replace(' Pack', '').toUpperCase()}</div>
          <div class="pack-crimp pack-crimp-bottom"></div>
        </div>
        <div class="pack-info">
          <div class="pack-name">${p.name}</div>
          <div class="pack-blurb">${p.blurb}</div>
          <div class="pack-cats">${catIcons}</div>
          <button class="btn buy-btn ${afford ? '' : 'cant-afford'}" data-pack-id="${p.id}">🪙 ${fmt(p.cost)}</button>
        </div>
      </div>`;
  }).join('');

  $$('#pack-grid .buy-btn').forEach(btn =>
    btn.addEventListener('click', () => buyPack(btn.dataset.packId)));
}

/* ---------------- collection ---------------- */

let collectionFilter = { cat: 'all', rar: 'all', ownedOnly: false };

function renderCollection() {
  // filter chips
  $('#cat-filters').innerHTML =
    `<button class="chip ${collectionFilter.cat === 'all' ? 'active' : ''}" data-cat="all">All</button>` +
    Object.entries(CATEGORIES).map(([key, c]) =>
      `<button class="chip ${collectionFilter.cat === key ? 'active' : ''}" data-cat="${key}">${c.icon} ${c.name}</button>`
    ).join('');
  $('#rar-filters').innerHTML =
    `<button class="chip ${collectionFilter.rar === 'all' ? 'active' : ''}" data-rar="all">All</button>` +
    Object.entries(RARITIES).map(([key, r]) =>
      `<button class="chip ${collectionFilter.rar === key ? 'active' : ''}" data-rar="${key}" style="--chip-color:${r.color}">${r.name}</button>`
    ).join('');
  $$('#cat-filters .chip').forEach(ch => ch.addEventListener('click', () => {
    collectionFilter.cat = ch.dataset.cat; renderCollection();
  }));
  $$('#rar-filters .chip').forEach(ch => ch.addEventListener('click', () => {
    collectionFilter.rar = ch.dataset.rar; renderCollection();
  }));

  const cards = CARDS.filter(c =>
    (collectionFilter.cat === 'all' || c.cat === collectionFilter.cat) &&
    (collectionFilter.rar === 'all' || c.rar === collectionFilter.rar));

  $('#collection-grid').innerHTML = cards.map(c => {
    const copies = state.owned[c.id] || 0;
    if (!copies) {
      return `<div class="card-slot locked"><div class="locked-emoji">?</div><div class="locked-name">${'—'}</div></div>`;
    }
    return `<div class="card-slot">${cardHTML(c, { showCount: true })}
      ${copies > 1 ? `<button class="btn sell-one" data-card-id="${c.id}">Sell 1 · 🪙${RARITIES[c.rar].sell}</button>` : ''}
    </div>`;
  }).join('');

  $$('#collection-grid .sell-one').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const got = sellCard(+btn.dataset.cardId, 1);
      toast(`Sold for 🪙 ${fmt(got)}`);
      renderCollection();
    }));

  const dupCount = Object.values(state.owned).reduce((a, n) => a + Math.max(0, n - 1), 0);
  const dupValue = Object.entries(state.owned).reduce((a, [id, n]) =>
    a + Math.max(0, n - 1) * RARITIES[CARDS_BY_ID[id].rar].sell, 0);
  const dupBtn = $('#sell-dupes-btn');
  dupBtn.disabled = dupCount === 0;
  dupBtn.textContent = dupCount
    ? `💰 Sell all ${dupCount} duplicates for 🪙 ${fmt(dupValue)}`
    : '💰 No duplicates to sell';
}

/* ---------------- pack opening ceremony ---------------- */

let opening = null; // { pack, pulls, revealed }

function startOpening(pack, pulls) {
  opening = { pack, pulls, revealed: 0, newIds: [] };
  const [g1, g2, g3] = pack.grad;
  $('#opening-overlay').classList.add('show');
  $('#opening-stage').innerHTML = `
    <div class="rip-pack" id="rip-pack">
      <div class="pack-visual big" style="background:linear-gradient(160deg,${g1},${g2} 55%,${g3})">
        <div class="pack-crimp pack-crimp-top"></div>
        <div class="pack-icon">${pack.icon}</div>
        <div class="pack-label">${pack.name.replace(' Pack', '').toUpperCase()}</div>
        <div class="pack-crimp pack-crimp-bottom"></div>
      </div>
      <div class="rip-hint">Tap to rip open!</div>
    </div>`;
  $('#rip-pack').addEventListener('click', ripOpen, { once: true });
}

function ripOpen() {
  const packEl = $('#rip-pack');
  packEl.classList.add('ripping');
  setTimeout(showReveals, 550);
}

function showReveals() {
  const { pulls } = opening;
  // Cards not owned before this pack get the NEW badge (recorded before adding copies).
  const newSet = new Set(pulls.filter(c => !(state.owned[c.id] > 0)).map(c => c.id));
  opening.newSet = newSet;
  for (const c of pulls) {
    state.owned[c.id] = (state.owned[c.id] || 0) + 1;
    state.totalPulls++;
  }
  save();

  $('#opening-stage').innerHTML = `
    <div class="reveal-row">
      ${pulls.map((c, i) => `
        <div class="flip-card" data-i="${i}" style="animation-delay:${i * 90}ms">
          <div class="flip-inner">
            <div class="flip-front">${cardBackHTML()}</div>
            <div class="flip-back">${cardHTML(c, { isNew: opening.newSet.has(c.id) && pulls.indexOf(c) === i })}</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="reveal-hint">Tap each card to reveal</div>
    <div class="reveal-actions hidden" id="reveal-actions">
      <button class="btn primary" id="reveal-done">Collect All ✨</button>
    </div>`;

  $$('.flip-card').forEach(el => el.addEventListener('click', () => {
    if (el.classList.contains('flipped')) return;
    el.classList.add('flipped');
    const card = pulls[+el.dataset.i];
    if (rarityRank(card.rar) >= 3) burstConfetti(el, RARITIES[card.rar].color);
    opening.revealed++;
    if (opening.revealed === pulls.length) {
      $('#reveal-actions').classList.remove('hidden');
      $('.reveal-hint')?.classList.add('hidden');
    }
  }, { once: true }));

  $('#reveal-done').addEventListener('click', finishOpening);
}

function finishOpening() {
  const { pulls, newSet } = opening;
  const best = pulls.reduce((a, b) => rarityRank(b.rar) > rarityRank(a.rar) ? b : a);
  const newCount = newSet.size;
  $('#opening-overlay').classList.remove('show');
  opening = null;
  renderHeader();
  renderCollection();
  renderShop();
  toast(newCount
    ? `${newCount} new card${newCount > 1 ? 's' : ''}! Best pull: ${best.emoji} ${best.name}`
    : `All duplicates — sell them for coins! Best: ${best.emoji} ${best.name}`);
}

/* tiny confetti burst for epic+ pulls */
function burstConfetti(anchor, color) {
  const rect = anchor.getBoundingClientRect();
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.background = i % 3 ? color : '#fff';
    p.style.left = rect.left + rect.width / 2 + 'px';
    p.style.top = rect.top + rect.height / 2 + 'px';
    const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 140;
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist - 60 + 'px');
    p.style.setProperty('--rot', Math.random() * 720 - 360 + 'deg');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

/* ---------------- tabs ---------------- */

function showTab(tab) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.tab-btn').forEach(b => b.classList.remove('active'));
  $(`#view-${tab}`).classList.add('active');
  $(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
}

/* ---------------- boot ---------------- */

function init() {
  load();
  renderHeader();
  renderShop();
  renderCollection();
  renderFreePackTimer();
  setInterval(renderFreePackTimer, 1000);

  $$('.tab-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('#free-pack-btn').addEventListener('click', () => {
    if (state.lastFreePack + FREE_PACK_INTERVAL - Date.now() > 0) return;
    buyPack('universal', true);
    renderFreePackTimer();
  });
  $('#sell-dupes-btn').addEventListener('click', sellAllDuplicates);
  $('#reset-btn').addEventListener('click', () => {
    if (confirm('Reset ALL progress? Your collection and coins will be lost.')) {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

/* ---------------- PWA install prompt ---------------- */

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  const btn = $('#install-btn');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    btn.hidden = true;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
  }, { once: true });
});
window.addEventListener('appinstalled', () => { $('#install-btn').hidden = true; });
