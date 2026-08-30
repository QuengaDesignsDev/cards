/* ============================================================
   OMNIVERSE TCG — Game logic & UI (Pocket-style)
   ============================================================ */

const SAVE_KEY = 'omniverse-tcg-save-v1';
const REGEN_INTERVAL = 5 * 60 * 1000; // +1 pack stamina / wonder chance every 5 minutes
const STAMINA_MAX = 2;
const WONDER_MAX = 2;
const START_CENTS = 2500; // new players start with $25.00

let state = {
  cents: START_CENTS,
  owned: {},           // cardId -> copies owned
  packsOpened: 0,
  totalPulls: 0,
  stamina: STAMINA_MAX,
  lastStaminaAt: 0,
  wStamina: WONDER_MAX,
  lastWStaminaAt: 0,
};

/* ---------------- persistence ---------------- */

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      delete data.lastFreePack; // pre-redesign save field
      state = Object.assign(state, data);
    }
  } catch (e) { /* corrupted save: start fresh */ }
  // Coin-era saves migrate at 1 coin = $1.
  if (state.coins !== undefined) {
    state.cents = Math.round(state.coins * 100);
    delete state.coins;
    save();
  }
  // Playtest grant: every save gets a one-time $1,000,000 boost.
  if (!state.milGrant) {
    state.cents += 100000000;
    state.milGrant = true;
    save();
  }
}

/* ---------------- helpers ---------------- */

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function fmt(n) { return n.toLocaleString('en-US'); }
function money(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function rarityRank(r) { return ['c', 'u', 'r', 'e', 'l', 'm'].indexOf(r); }

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function uniqueOwned() { return Object.keys(state.owned).filter(id => state.owned[id] > 0).length; }

/* ---------------- stamina regen ---------------- */

function regenTick() {
  const now = Date.now();
  if (state.stamina < STAMINA_MAX) {
    const gained = Math.floor((now - state.lastStaminaAt) / REGEN_INTERVAL);
    if (gained > 0) {
      state.stamina = Math.min(STAMINA_MAX, state.stamina + gained);
      state.lastStaminaAt += gained * REGEN_INTERVAL;
      save();
    }
  } else {
    state.lastStaminaAt = now;
  }
  if (state.wStamina < WONDER_MAX) {
    const gained = Math.floor((now - state.lastWStaminaAt) / REGEN_INTERVAL);
    if (gained > 0) {
      state.wStamina = Math.min(WONDER_MAX, state.wStamina + gained);
      state.lastWStaminaAt += gained * REGEN_INTERVAL;
      save();
    }
  } else {
    state.lastWStaminaAt = now;
  }
  renderMeters();
}

function countdown(last) {
  const remaining = Math.max(0, last + REGEN_INTERVAL - Date.now());
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderMeters() {
  $('#coin-count').textContent = money(state.cents);
  const pips = Array.from({ length: STAMINA_MAX }, (_, i) =>
    `<span class="pip ${i < state.stamina ? 'full' : ''}">📦</span>`).join('');
  $('#stamina-pips').innerHTML = pips;
  $('#stamina-note').textContent = state.stamina >= STAMINA_MAX
    ? 'MAX' : `+1 in ${countdown(state.lastStaminaAt)}`;
  const wNote = $('#wonder-note');
  if (wNote) {
    wNote.textContent = state.wStamina > 0
      ? '⭐'.repeat(state.wStamina)
      : `+1 in ${countdown(state.lastWStaminaAt)}`;
  }
  const openFree = $('#open-free-btn');
  if (openFree) openFree.disabled = state.stamina < 1;
}

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

function sellCard(cardId, count) {
  const have = state.owned[cardId] || 0;
  count = Math.min(count, have);
  if (count <= 0) return 0;
  const card = CARDS_BY_ID[cardId];
  const value = RARITIES[card.rar].sell * count;
  state.owned[cardId] = have - count;
  state.cents += value;
  save();
  renderMeters();
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
  state.cents += total;
  save();
  renderMeters();
  renderCollection();
  toast(`Sold ${sold} duplicate${sold > 1 ? 's' : ''} for ${money(total)}`);
}

/* ---------------- TCG card rendering ---------------- */

function cardHTML(card, opts = {}) {
  const rar = RARITIES[card.rar];
  const cat = CATEGORIES[card.cat];
  const copies = state.owned[card.id] || 0;
  const move = moveFor(card);
  const holo = ['e', 'l', 'm'].includes(card.rar) ? ' holo' : '';
  const shine = ['r', 'e', 'l', 'm'].includes(card.rar) ? '<div class="shine"></div>' : '';
  const badge = opts.isNew ? '<div class="new-badge">NEW</div>' : '';
  const count = opts.showCount && copies > 1 ? `<div class="copy-count">×${copies}</div>` : '';
  const diamonds = '◆'.repeat(rarityRank(card.rar) + 1);
  return `
    <div class="tcg-card rar-${card.rar}${holo}${opts.small ? ' tcg-sm' : ''}" style="--hue:${cat.hue}" data-card-id="${card.id}">
      ${shine}${badge}${count}
      <div class="tcg-inner">
        <div class="tcg-head">
          <span class="tcg-stage">${cat.name}</span>
          <span class="tcg-name">${card.name}</span>
          <span class="tcg-hp">PW<b>${card.pow}</b></span>
          <span class="tcg-type">${cat.icon}</span>
        </div>
        <div class="tcg-art"><span>${card.emoji}</span></div>
        <div class="tcg-caption">NO. ${String(card.id).padStart(3, '0')} · Omniverse Card</div>
        <div class="tcg-attack">
          <span class="tcg-cost">${cat.icon.repeat(move.cost)}</span>
          <span class="tcg-move">${move.name}</span>
          <span class="tcg-dmg">${card.pow}</span>
        </div>
        <div class="tcg-lore">${card.lore}</div>
        <div class="tcg-foot">
          <span class="tcg-pill" style="color:${rar.color}">${rar.name.toLowerCase()}</span>
          <span class="tcg-pill">sell ${money(rar.sell)}</span>
        </div>
        <div class="tcg-bottom">
          <span class="tcg-diamonds" style="color:${rar.color}">${diamonds}</span>
          <span class="tcg-illus">Illus. Omniverse</span>
        </div>
      </div>
    </div>`;
}

function cardBackHTML(small = false) {
  return `<div class="tcg-card tcg-back${small ? ' tcg-sm' : ''}">
    <div class="back-logo">🌌</div><div class="back-title">OMNIVERSE</div>
  </div>`;
}

function packVisualHTML(pack, cls = '') {
  const [g1, g2, g3] = pack.grad;
  return `
    <div class="pack-visual ${cls}" style="background:linear-gradient(160deg,${g1},${g2} 55%,${g3})">
      <div class="pack-crimp pack-crimp-top"></div>
      <div class="pack-brand">🌌 OMNIVERSE <small>TCG</small></div>
      <div class="pack-icon">${pack.icon}</div>
      <div class="pack-sub">THEMED BOOSTER PACK</div>
      <div class="pack-label">${pack.name.replace(' Pack', '').toUpperCase()}</div>
      <div class="pack-crimp pack-crimp-bottom"></div>
    </div>`;
}

/* ---------------- screens ---------------- */

function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === (name === 'packview' ? 'home' : name)));
  if (name === 'wonder') renderWonder();
  if (name === 'collection') renderCollection();
}

/* ---------------- home ---------------- */

function renderHome() {
  $('#pack-shelf').innerHTML = PACKS.map(p => `
    <button class="shelf-pack" data-pack-id="${p.id}">
      ${packVisualHTML(p)}
    </button>`).join('');
  $$('#pack-shelf .shelf-pack').forEach(el =>
    el.addEventListener('click', () => openPackView(el.dataset.packId)));
}

/* ---------------- pack view ---------------- */

let packIndex = 0;

function openPackView(packId) {
  packIndex = Math.max(0, PACKS.findIndex(p => p.id === packId));
  renderPackView();
  showScreen('packview');
}

function renderPackView() {
  const pack = PACKS[packIndex];
  const freeOk = pack.id !== 'stellar';
  $('#packview-stage').innerHTML = `
    <div class="packview-carousel">
      ${packVisualHTML(PACKS[(packIndex + PACKS.length - 1) % PACKS.length], 'side')}
      ${packVisualHTML(pack, 'big main')}
      ${packVisualHTML(PACKS[(packIndex + 1) % PACKS.length], 'side')}
    </div>
    <div class="packview-name">${pack.name}</div>
    <div class="packview-blurb">${pack.blurb}</div>
    <div class="packview-actions">
      ${freeOk ? `<button class="btn primary" id="open-free-btn" ${state.stamina < 1 ? 'disabled' : ''}>📦 Open ×1</button>` : ''}
      <button class="btn coin ${state.cents < pack.cost ? 'cant-afford' : ''}" id="open-coin-btn">${money(pack.cost)}</button>
    </div>
    <div class="packview-tools">
      <button class="btn ghost" id="rates-btn">Offering Rates</button>
      <button class="btn ghost" id="packview-back">↩ Back</button>
    </div>`;
  $('.packview-carousel .side:first-of-type').addEventListener('click', () => { packIndex = (packIndex + PACKS.length - 1) % PACKS.length; renderPackView(); });
  $$('.packview-carousel .side')[1].addEventListener('click', () => { packIndex = (packIndex + 1) % PACKS.length; renderPackView(); });
  const freeBtn = $('#open-free-btn');
  if (freeBtn) freeBtn.addEventListener('click', () => openPack(pack, true));
  $('#open-coin-btn').addEventListener('click', () => openPack(pack, false));
  $('#rates-btn').addEventListener('click', () => showRates(pack));
  $('#packview-back').addEventListener('click', () => showScreen('home'));
}

function showRates(pack) {
  const rows = pack.odds.map((table, i) => {
    const cells = Object.entries(table)
      .map(([r, w]) => `<span style="color:${RARITIES[r].color}">${RARITIES[r].name} ${w}%</span>`)
      .join(' · ');
    return `<div class="rate-row"><b>Card ${i + 1}</b><span>${cells}</span></div>`;
  }).join('');
  $('#rates-body').innerHTML = `<h3>${pack.name} — Offering Rates</h3>${rows}
    <div class="rate-note">Every pack contains 5 cards. Rarer cards sell for more.</div>`;
  $('#rates-modal').classList.add('show');
}

/* ---------------- pack opening ceremony ---------------- */

let opening = null; // { pack, pulls, newSet, idx }

function openPack(pack, useStamina) {
  if (useStamina) {
    regenTick();
    if (state.stamina < 1) { toast('No pack stamina — wait for it to recharge!'); return; }
    if (state.stamina >= STAMINA_MAX) state.lastStaminaAt = Date.now();
    state.stamina--;
  } else {
    if (state.cents < pack.cost) { toast('Not enough cash — sell some duplicates!'); return; }
    state.cents -= pack.cost;
  }
  state.packsOpened++;
  const pulls = pullPack(pack);
  const newSet = new Set(pulls.filter(c => !(state.owned[c.id] > 0)).map(c => c.id));
  for (const c of pulls) {
    state.owned[c.id] = (state.owned[c.id] || 0) + 1;
    state.totalPulls++;
  }
  save();
  renderMeters();
  opening = { pack, pulls, newSet, idx: 0 };
  $('#opening-overlay').classList.add('show');
  $('#opening-stage').innerHTML = `
    <div class="rip-pack" id="rip-pack">
      ${packVisualHTML(pack, 'big')}
      <div class="rip-hint">Tap to rip open!</div>
    </div>`;
  $('#rip-pack').addEventListener('click', () => {
    $('#rip-pack').classList.add('ripping');
    setTimeout(showNextCard, 550);
  }, { once: true });
}

function showNextCard() {
  const { pulls, newSet, idx } = opening;
  if (idx >= pulls.length) { showResults(); return; }
  const card = pulls[idx];
  opening.idx++;
  $('#opening-stage').innerHTML = `
    <div class="single-reveal" id="single-reveal">
      <div class="reveal-flip">
        <div class="flip-inner">
          <div class="flip-front">${cardBackHTML()}</div>
          <div class="flip-back">${cardHTML(card, { isNew: newSet.has(card.id) && pulls.findIndex(c => c.id === card.id) === idx })}</div>
        </div>
      </div>
      <div class="reveal-count">${opening.idx} / ${pulls.length} · tap to continue</div>
    </div>
    <button class="skip-btn" id="skip-btn" title="Skip to results">⏭</button>`;
  requestAnimationFrame(() => requestAnimationFrame(() =>
    $('.reveal-flip')?.classList.add('flipped')));
  if (rarityRank(card.rar) >= 3) setTimeout(() =>
    burstConfetti($('.reveal-flip'), RARITIES[card.rar].color), 500);
  $('#single-reveal').addEventListener('click', showNextCard, { once: true });
  $('#skip-btn').addEventListener('click', e => { e.stopPropagation(); showResults(); });
}

function showResults() {
  const { pulls, newSet } = opening;
  const seen = new Set();
  $('#opening-stage').innerHTML = `
    <div class="results">
      <h2 class="results-title">Opening Results</h2>
      <div class="results-rule"></div>
      <div class="results-grid">
        ${pulls.map(c => {
          const isNew = newSet.has(c.id) && !seen.has(c.id);
          seen.add(c.id);
          return `<div class="result-slot">${cardHTML(c, { isNew, small: true, showCount: true })}</div>`;
        }).join('')}
      </div>
      <button class="btn primary big-pill" id="results-next">Next</button>
    </div>`;
  $('#results-next').addEventListener('click', finishOpening);
}

function finishOpening() {
  const { pulls, newSet } = opening;
  const best = pulls.reduce((a, b) => rarityRank(b.rar) > rarityRank(a.rar) ? b : a);
  $('#opening-overlay').classList.remove('show');
  opening = null;
  renderMeters();
  renderPackView();
  toast(newSet.size
    ? `${newSet.size} new card${newSet.size > 1 ? 's' : ''}! Best pull: ${best.emoji} ${best.name}`
    : `All duplicates — sell them for coins! Best: ${best.emoji} ${best.name}`);
}

/* tiny confetti burst for epic+ pulls */
function burstConfetti(anchor, color) {
  if (!anchor) return;
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

/* ---------------- wonder pick ---------------- */

let wonderOffer = null;   // 5 cards on offer
let wonderPicked = false;

function newWonderOffer() {
  wonderOffer = pullPack(PACKS[0]); // universal odds
  wonderPicked = false;
}

function renderWonder() {
  if (!wonderOffer || wonderPicked) newWonderOffer();
  const stage = $('#wonder-stage');
  stage.innerHTML = `
    <p class="wonder-blurb">Someone opened these 5 cards. Spend ⭐ 1 wonder chance,
    the cards flip face-down and shuffle — pick one to keep!</p>
    <div class="wonder-row">
      ${wonderOffer.map(c => `<div class="wonder-slot">${cardHTML(c, { small: true })}</div>`).join('')}
    </div>
    <div class="wonder-actions">
      <button class="btn primary" id="wonder-go" ${state.wStamina < 1 ? 'disabled' : ''}>✨ Wonder Pick (⭐1)</button>
      <button class="btn ghost" id="wonder-refresh">🔄 New offering</button>
    </div>`;
  $('#wonder-go').addEventListener('click', startWonderPick);
  $('#wonder-refresh').addEventListener('click', () => { newWonderOffer(); renderWonder(); });
}

function startWonderPick() {
  regenTick();
  if (state.wStamina < 1) { toast('No wonder chances left — wait for the recharge!'); return; }
  if (state.wStamina >= WONDER_MAX) state.lastWStaminaAt = Date.now();
  state.wStamina--;
  save();
  renderMeters();
  const shuffled = [...wonderOffer].sort(() => Math.random() - 0.5);
  const stage = $('#wonder-stage');
  stage.innerHTML = `
    <p class="wonder-blurb">Pick a card!</p>
    <div class="wonder-row">
      ${shuffled.map((c, i) => `
        <div class="wonder-slot facedown" data-i="${i}">${cardBackHTML(true)}</div>`).join('')}
    </div>`;
  $$('.wonder-slot.facedown').forEach(el => el.addEventListener('click', () => {
    const picked = shuffled[+el.dataset.i];
    const isNew = !(state.owned[picked.id] > 0);
    state.owned[picked.id] = (state.owned[picked.id] || 0) + 1;
    state.totalPulls++;
    wonderPicked = true;
    save();
    renderMeters();
    stage.innerHTML = `
      <p class="wonder-blurb">${isNew ? 'A brand new card!' : 'A duplicate — worth ' + money(RARITIES[picked.rar].sell)}</p>
      <div class="wonder-won">${cardHTML(picked, { isNew })}</div>
      <div class="wonder-actions">
        <button class="btn primary" id="wonder-again">Nice! Continue</button>
      </div>`;
    if (rarityRank(picked.rar) >= 3) burstConfetti($('.wonder-won'), RARITIES[picked.rar].color);
    $('#wonder-again').addEventListener('click', renderWonder);
  }, { once: true }));
}

/* ---------------- collection ---------------- */

let collectionFilter = { cat: 'all', rar: 'all' };

function renderCollection() {
  $('#collection-stats').textContent = `${uniqueOwned()} / ${CARDS.length} collected · ${fmt(state.packsOpened)} packs opened`;
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
      return `<div class="card-slot locked"><div class="locked-emoji">?</div></div>`;
    }
    return `<div class="card-slot">${cardHTML(c, { showCount: true, small: true })}
      ${copies > 1 ? `<button class="btn sell-one" data-card-id="${c.id}">Sell 1 · ${money(RARITIES[c.rar].sell)}</button>` : ''}
    </div>`;
  }).join('');

  $$('#collection-grid .card-slot:not(.locked) .tcg-card').forEach(el =>
    el.addEventListener('click', () => showCardViewer(+el.dataset.cardId)));

  $$('#collection-grid .sell-one').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const got = sellCard(+btn.dataset.cardId, 1);
      toast(`Sold for ${money(got)}`);
      renderCollection();
    }));

  const dupCount = Object.values(state.owned).reduce((a, n) => a + Math.max(0, n - 1), 0);
  const dupValue = Object.entries(state.owned).reduce((a, [id, n]) =>
    a + Math.max(0, n - 1) * RARITIES[CARDS_BY_ID[id].rar].sell, 0);
  const dupBtn = $('#sell-dupes-btn');
  dupBtn.disabled = dupCount === 0;
  dupBtn.textContent = dupCount
    ? `💰 Sell all ${dupCount} duplicates for ${money(dupValue)}`
    : '💰 No duplicates to sell';
}

/* ---------------- full-size card viewer ---------------- */

function showCardViewer(cardId) {
  const card = CARDS_BY_ID[cardId];
  if (!card) return;
  $('#viewer-body').innerHTML = cardHTML(card, { showCount: true });
  $('#viewer-modal').classList.add('show');
}

/* ---------------- boot ---------------- */

function init() {
  load();
  if (!state.lastStaminaAt) state.lastStaminaAt = Date.now();
  if (!state.lastWStaminaAt) state.lastWStaminaAt = Date.now();
  renderHome();
  renderMeters();
  renderCollection();
  regenTick();
  setInterval(regenTick, 1000);

  $$('.nav-btn').forEach(b => b.addEventListener('click', () => showScreen(b.dataset.nav)));
  $('#home-wonder-card').addEventListener('click', () => showScreen('wonder'));
  $('#home-collection-card').addEventListener('click', () => showScreen('collection'));
  $('#rates-close').addEventListener('click', () => $('#rates-modal').classList.remove('show'));
  $('#rates-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
  });
  $('#viewer-modal').addEventListener('click', () => $('#viewer-modal').classList.remove('show'));
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
