/* ============================================================
   OMNIVERSE TCG — Game logic & UI (Pocket-style)
   Per-copy ownership: every pulled card copy has its own quality,
   value, and (optionally) an OmniGrade slab.
   ============================================================ */

const SAVE_KEY = 'omniverse-tcg-save-v1';
const REGEN_INTERVAL = 5 * 60 * 1000; // +1 pack stamina / wonder chance every 5 minutes
const STAMINA_MAX = 2;
const WONDER_MAX = 2;
const START_CENTS = 2500; // new players start with $25.00

const CONDITIONS = {
  mint: { name: 'Mint',              short: 'MINT', mult: 1.3,  color: '#10b981' },
  nm:   { name: 'Near Mint',         short: 'NM',   mult: 1.0,  color: '#38bdf8' },
  lp:   { name: 'Lightly Played',    short: 'LP',   mult: 0.7,  color: '#a3a3a3' },
  mp:   { name: 'Moderately Played', short: 'MP',   mult: 0.45, color: '#f59e0b' },
  dmg:  { name: 'Damaged',           short: 'DMG',  mult: 0.25, color: '#ef4444' },
};

const GRADE_TIERS = {
  std: { name: 'Standard', cost: 499,  ms: 5 * 60 * 1000, blurb: 'ready in 5 min' },
  exp: { name: 'Express',  cost: 1499, ms: 60 * 1000,     blurb: 'ready in 60 sec' },
};

const GRADE_MULT = { '10': 6, '9.5': 3, '9': 2, '8.5': 1.4, '8': 1.2 };

let state = {
  cents: START_CENTS,
  copies: [],          // [{ uid, cardId, q:{cen,cor,edg,sur}, grade, grading }]
  nextUid: 1,
  packsOpened: 0,
  totalPulls: 0,
  stamina: STAMINA_MAX,
  lastStaminaAt: 0,
  wStamina: WONDER_MAX,
  lastWStaminaAt: 0,
};

/* ---------------- persistence & migration ---------------- */

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
  }
  // Count-era collections expand into per-copy records with rolled quality.
  if (state.owned !== undefined) {
    if (!Array.isArray(state.copies)) state.copies = [];
    for (const [cardId, n] of Object.entries(state.owned)) {
      for (let i = 0; i < n; i++) addCopy(+cardId);
    }
    delete state.owned;
  }
  if (!Array.isArray(state.copies)) state.copies = [];
  if (!state.nextUid) state.nextUid = state.copies.length + 1;
  // Playtest grant: every save gets a one-time $1,000,000 boost.
  if (!state.milGrant) {
    state.cents += 100000000;
    state.milGrant = true;
  }
  save();
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

/* ---------------- copies, quality, value ---------------- */

function rollSub(floor = 300) {
  let v = 1000 - Math.floor(Math.pow(Math.random(), 2) * 220);
  if (Math.random() < 0.06) v -= 150 + Math.floor(Math.random() * 250);
  return Math.max(floor, Math.min(1000, v));
}

function rollQuality(minty = false) {
  const f = minty ? 880 : 300;
  const q = { cen: rollSub(f), cor: rollSub(f), edg: rollSub(f), sur: rollSub(f) };
  return q;
}

function qScore(q) {
  const vals = [q.cen, q.cor, q.edg, q.sur];
  const avg = vals.reduce((a, b) => a + b, 0) / 4;
  const min = Math.min(...vals);
  return Math.round(avg * 0.6 + min * 0.4); // the weakest point drags the score, TAG-style
}

function conditionOf(copy) {
  const s = qScore(copy.q);
  if (s >= 950) return CONDITIONS.mint;
  if (s >= 880) return CONDITIONS.nm;
  if (s >= 760) return CONDITIONS.lp;
  if (s >= 600) return CONDITIONS.mp;
  return CONDITIONS.dmg;
}

function gradeLabel(score) {
  if (score >= 985) return '10';
  if (score >= 960) return '9.5';
  if (score >= 930) return '9';
  if (score >= 900) return '8.5';
  if (score >= 860) return '8';
  if (score >= 800) return '7';
  if (score >= 700) return '6';
  return '5';
}

function copyValue(copy) {
  const base = marketValue(CARDS_BY_ID[copy.cardId]);
  if (copy.grade) return Math.round(base * (GRADE_MULT[copy.grade.label] || 1));
  return Math.round(base * conditionOf(copy).mult);
}

function addCopy(cardId, minty = false) {
  const copy = { uid: state.nextUid++, cardId, q: rollQuality(minty), grade: null, grading: null };
  state.copies.push(copy);
  return copy;
}

function copiesOf(cardId) { return state.copies.filter(c => c.cardId === cardId); }
function countOf(cardId) { return copiesOf(cardId).length; }
function uniqueOwned() { return new Set(state.copies.map(c => c.cardId)).size; }
function copyByUid(uid) { return state.copies.find(c => c.uid === uid); }
function bestCopy(cardId) {
  return copiesOf(cardId).sort((a, b) => copyValue(b) - copyValue(a))[0];
}

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
  if ($('#screen-grade').classList.contains('active')) refreshGradeTimers();
}

function countdown(last, interval = REGEN_INTERVAL) {
  const remaining = Math.max(0, last + interval - Date.now());
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
  const gradeDot = $('#grade-dot');
  if (gradeDot) {
    const ready = state.copies.some(c => c.grading && c.grading.readyAt <= Date.now());
    gradeDot.hidden = !ready;
  }
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

function sellCopy(uid) {
  const copy = copyByUid(uid);
  if (!copy || copy.grading) return 0;
  const value = copyValue(copy);
  state.copies = state.copies.filter(c => c.uid !== uid);
  state.cents += value;
  save();
  renderMeters();
  return value;
}

function sellAllDuplicates() {
  let total = 0, sold = 0;
  const byCard = {};
  for (const c of state.copies) (byCard[c.cardId] ||= []).push(c);
  for (const copies of Object.values(byCard)) {
    if (copies.length < 2) continue;
    // keep the most valuable copy; sell the rest, cheapest first, skipping graded-in-transit
    const sellable = copies.sort((a, b) => copyValue(b) - copyValue(a)).slice(1)
      .filter(c => !c.grading);
    for (const c of sellable) {
      total += copyValue(c);
      sold++;
      state.copies = state.copies.filter(x => x.uid !== c.uid);
    }
  }
  if (!sold) { toast('No duplicates to sell.'); return; }
  state.cents += total;
  save();
  renderMeters();
  renderCollection();
  toast(`Sold ${sold} duplicate${sold > 1 ? 's' : ''} for ${money(total)}`);
}

function buySingle(cardId) {
  const card = CARDS_BY_ID[cardId];
  const cost = Math.round(marketValue(card) * 1.5);
  if (state.cents < cost) { toast('Not enough cash for this single.'); return null; }
  state.cents -= cost;
  const copy = addCopy(cardId, true); // singles arrive Near Mint or better
  save();
  renderMeters();
  toast(`Bought ${card.name} (${conditionOf(copy).name}) for ${money(cost)}`);
  return copy;
}

/* ---------------- TCG card rendering ---------------- */

function cardHTML(card, opts = {}) {
  const rar = RARITIES[card.rar];
  const cat = CATEGORIES[card.cat];
  const copies = countOf(card.id);
  const move = moveFor(card);
  const holo = ['e', 'l', 'm'].includes(card.rar) ? ' holo' : '';
  const shine = ['r', 'e', 'l', 'm'].includes(card.rar) ? '<div class="shine"></div>' : '';
  const badge = opts.isNew ? '<div class="new-badge">NEW</div>' : '';
  const count = opts.showCount && copies > 1 ? `<div class="copy-count">×${copies}</div>` : '';
  const best = opts.showGrade ? bestGradeOf(card.id) : null;
  const gradeBadge = best ? `<div class="grade-badge">🏅 ${best.grade.label}</div>` : '';
  return `
    <div class="tcg-card rar-${card.rar}${holo}${opts.small ? ' tcg-sm' : ''}" style="--hue:${cat.hue}" data-card-id="${card.id}">
      ${shine}${badge}${count}${gradeBadge}
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
          <span class="tcg-pill">${money(marketValue(card))}</span>
        </div>
        <div class="tcg-bottom">
          <span class="tcg-diamonds" style="color:${rar.color}">${'◆'.repeat(rarityRank(card.rar) + 1)}</span>
          <span class="tcg-illus">Illus. Omniverse</span>
        </div>
      </div>
    </div>`;
}

function bestGradeOf(cardId) {
  const graded = copiesOf(cardId).filter(c => c.grade)
    .sort((a, b) => b.grade.score - a.grade.score);
  return graded[0] || null;
}

function cardBackHTML(small = false) {
  return `<div class="tcg-card tcg-back${small ? ' tcg-sm' : ''}">
    <div class="back-logo">🌌</div><div class="back-title">OMNIVERSE</div>
  </div>`;
}

function slabHTML(copy, opts = {}) {
  const card = CARDS_BY_ID[copy.cardId];
  return `
    <div class="slab${opts.small ? ' slab-sm' : ''}" data-uid="${copy.uid}">
      <div class="slab-label">
        <span class="slab-brand">OMNIGRADE</span>
        <span class="slab-name">${card.name}</span>
        <span class="slab-grade">${copy.grade.label}</span>
      </div>
      ${cardHTML(card, { small: true })}
      <div class="slab-score">${copy.grade.score}/1000</div>
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
  if (name === 'grade') renderGrade();
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
  showModal(`<h3>${pack.name} — Offering Rates</h3>${rows}
    <div class="rate-note">Every pack contains 5 cards. Each card's value depends on its
    rarity, its power, its condition — and its grade, if you send it to OmniGrade.</div>`);
}

function showModal(html) {
  $('#rates-body').innerHTML = html;
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
  const cards = pullPack(pack);
  const newSet = new Set(cards.filter(c => countOf(c.id) === 0).map(c => c.id));
  const pulls = cards.map(c => {
    state.totalPulls++;
    return { card: c, copy: addCopy(c.id) };
  });
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
  const { card, copy } = pulls[idx];
  opening.idx++;
  const cond = conditionOf(copy);
  $('#opening-stage').innerHTML = `
    <div class="single-reveal" id="single-reveal">
      <div class="reveal-flip">
        <div class="flip-inner">
          <div class="flip-front">${cardBackHTML()}</div>
          <div class="flip-back">${cardHTML(card, { isNew: newSet.has(card.id) && pulls.findIndex(p => p.card.id === card.id) === idx })}</div>
        </div>
      </div>
      <div class="cond-chip" style="color:${cond.color}">${cond.name}</div>
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
        ${pulls.map(({ card, copy }) => {
          const isNew = newSet.has(card.id) && !seen.has(card.id);
          seen.add(card.id);
          const cond = conditionOf(copy);
          return `<div class="result-slot">
            ${cardHTML(card, { isNew, small: true, showCount: true })}
            <div class="result-cond" style="color:${cond.color}">${cond.short} · ${money(copyValue(copy))}</div>
          </div>`;
        }).join('')}
      </div>
      <button class="btn primary big-pill" id="results-next">Next</button>
    </div>`;
  $('#results-next').addEventListener('click', finishOpening);
}

function finishOpening() {
  const { pulls, newSet } = opening;
  const best = pulls.reduce((a, b) => rarityRank(b.card.rar) > rarityRank(a.card.rar) ? b : a).card;
  $('#opening-overlay').classList.remove('show');
  opening = null;
  renderMeters();
  renderPackView();
  toast(newSet.size
    ? `${newSet.size} new card${newSet.size > 1 ? 's' : ''}! Best pull: ${best.emoji} ${best.name}`
    : `All duplicates — sell them for cash! Best: ${best.emoji} ${best.name}`);
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

/* ---------------- OmniGrade ---------------- */

function sendToGrading(uid, tierKey) {
  const copy = copyByUid(uid);
  const tier = GRADE_TIERS[tierKey];
  if (!copy || copy.grading || copy.grade) return;
  if (state.cents < tier.cost) { toast('Not enough cash for grading.'); return; }
  state.cents -= tier.cost;
  copy.grading = { readyAt: Date.now() + tier.ms, tier: tierKey };
  save();
  renderMeters();
  toast(`Sent to OmniGrade (${tier.name}) — ${tier.blurb}!`);
}

function revealGrade(uid) {
  const copy = copyByUid(uid);
  if (!copy || !copy.grading || copy.grading.readyAt > Date.now()) return;
  const score = qScore(copy.q);
  copy.grade = { score, label: gradeLabel(score) };
  copy.grading = null;
  save();
  renderMeters();
  renderGrade();
  const slabEl = $(`.slab[data-uid="${uid}"]`);
  if (parseFloat(copy.grade.label) >= 9.5) burstConfetti(slabEl, '#f0a92e');
  toast(`OmniGrade ${copy.grade.label} — ${score}/1000!`);
}

function showReport(uid) {
  const copy = copyByUid(uid);
  if (!copy || !copy.grade) return;
  const card = CARDS_BY_ID[copy.cardId];
  const bars = [['Centering', copy.q.cen], ['Corners', copy.q.cor], ['Edges', copy.q.edg], ['Surface', copy.q.sur]]
    .map(([label, v]) => `
      <div class="report-row">
        <span class="report-label">${label}</span>
        <div class="report-bar"><div class="report-fill" style="width:${v / 10}%"></div></div>
        <span class="report-val">${v}</span>
      </div>`).join('');
  showModal(`
    <h3>OmniGrade Report</h3>
    <div class="report-card">${card.emoji} <b>${card.name}</b> · Cert #OG-${String(copy.uid).padStart(6, '0')}</div>
    <div class="report-grade">${copy.grade.label}</div>
    <div class="report-score">${copy.grade.score} / 1000</div>
    ${bars}
    <div class="rate-note">Graded value: ${money(copyValue(copy))} (market ${money(marketValue(card))} × ${GRADE_MULT[copy.grade.label] || 1})</div>`);
}

function renderGrade() {
  const now = Date.now();
  const pending = state.copies.filter(c => c.grading && c.grading.readyAt > now);
  const ready = state.copies.filter(c => c.grading && c.grading.readyAt <= now);
  const graded = state.copies.filter(c => c.grade).sort((a, b) => b.grade.score - a.grade.score);

  $('#grade-stage').innerHTML = `
    <p class="wonder-blurb">Send any copy to OmniGrade from its card page (tap a card in your
    Collection). Standard ${money(GRADE_TIERS.std.cost)} · Express ${money(GRADE_TIERS.exp.cost)}.</p>
    ${ready.length ? `<h3 class="grade-h">🎉 Ready to reveal</h3>
      <div class="grade-row">${ready.map(c => `
        <button class="grade-ready" data-uid="${c.uid}">
          ${cardBackHTML(true)}
          <span class="grade-ready-label">Tap to reveal grade!</span>
        </button>`).join('')}</div>` : ''}
    ${pending.length ? `<h3 class="grade-h">📦 At the graders</h3>
      <div class="grade-list">${pending.map(c => {
        const card = CARDS_BY_ID[c.cardId];
        return `<div class="grade-pending" data-ready="${c.grading.readyAt}">
          <span>${card.emoji} ${card.name}</span>
          <span class="grade-eta">${GRADE_TIERS[c.grading.tier].name} · <b class="eta">${countdown(c.grading.readyAt, 0)}</b></span>
        </div>`;
      }).join('')}</div>` : ''}
    <h3 class="grade-h">🏅 Graded collection ${graded.length ? `(${graded.length})` : ''}</h3>
    ${graded.length
      ? `<div class="grade-row">${graded.map(c => slabHTML(c)).join('')}</div>`
      : '<p class="wonder-blurb">No graded cards yet — send your best pulls in!</p>'}`;

  $$('.grade-ready').forEach(el => el.addEventListener('click', () => {
    el.outerHTML = slabPlaceholder(+el.dataset.uid);
    revealGrade(+el.dataset.uid);
  }));
  $$('#grade-stage .slab').forEach(el =>
    el.addEventListener('click', () => showReport(+el.dataset.uid)));
}

function slabPlaceholder(uid) { return `<div data-uid="${uid}"></div>`; }

function refreshGradeTimers() {
  $$('.grade-pending').forEach(el => {
    const readyAt = +el.dataset.ready;
    if (readyAt <= Date.now()) { renderGrade(); return; }
    const eta = el.querySelector('.eta');
    if (eta) eta.textContent = countdown(readyAt, 0);
  });
}

/* ---------------- wonder pick ---------------- */

let wonderOffer = null;
let wonderPicked = false;

function newWonderOffer() {
  wonderOffer = pullPack(PACKS[0]);
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
    const isNew = countOf(picked.id) === 0;
    const copy = addCopy(picked.id);
    state.totalPulls++;
    wonderPicked = true;
    save();
    renderMeters();
    const cond = conditionOf(copy);
    stage.innerHTML = `
      <p class="wonder-blurb">${isNew ? 'A brand new card!' : 'A duplicate — worth ' + money(copyValue(copy))}
        <span style="color:${cond.color}">(${cond.name})</span></p>
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
    const copies = countOf(c.id);
    if (!copies) {
      return `<div class="card-slot locked" data-card-id="${c.id}">
        <div class="locked-emoji">?</div>
        <div class="locked-buy">Buy · ${money(Math.round(marketValue(c) * 1.5))}</div>
      </div>`;
    }
    return `<div class="card-slot" data-card-id="${c.id}">${cardHTML(c, { showCount: true, small: true, showGrade: true })}</div>`;
  }).join('');

  $$('#collection-grid .card-slot').forEach(el =>
    el.addEventListener('click', () => openViewer(+el.dataset.cardId)));

  const dupUids = new Set();
  const byCard = {};
  for (const c of state.copies) (byCard[c.cardId] ||= []).push(c);
  let dupCount = 0, dupValue = 0;
  for (const copies of Object.values(byCard)) {
    if (copies.length < 2) continue;
    const extras = copies.sort((a, b) => copyValue(b) - copyValue(a)).slice(1).filter(c => !c.grading);
    for (const c of extras) { dupCount++; dupValue += copyValue(c); dupUids.add(c.uid); }
  }
  const dupBtn = $('#sell-dupes-btn');
  dupBtn.disabled = dupCount === 0;
  dupBtn.textContent = dupCount
    ? `💰 Sell all ${dupCount} duplicates for ${money(dupValue)}`
    : '💰 No duplicates to sell';
}

/* ---------------- 3D card viewer ---------------- */

let viewer = { cardId: null, rx: -6, ry: 0, vx: 0, dragging: false, raf: 0, lastT: 0 };

function openViewer(cardId) {
  viewer.cardId = cardId;
  viewer.rx = -6; viewer.ry = 0; viewer.vx = 0;
  const card = CARDS_BY_ID[cardId];
  $('#viewer-3d').innerHTML = `
    <div class="v3d-inner" id="v3d-inner">
      <div class="v3d-face v3d-front">${cardHTML(card)}<div class="v3d-glare" id="v3d-glare"></div></div>
      <div class="v3d-face v3d-back">${cardBackHTML()}</div>
    </div>`;
  renderViewerCopies();
  $('#viewer-modal').classList.add('show');
  startViewerLoop();
}

function closeViewer() {
  $('#viewer-modal').classList.remove('show');
  cancelAnimationFrame(viewer.raf);
  viewer.cardId = null;
}

function renderViewerCopies() {
  const card = CARDS_BY_ID[viewer.cardId];
  const copies = copiesOf(viewer.cardId);
  const buyCost = Math.round(marketValue(card) * 1.5);
  $('#viewer-copies').innerHTML = `
    <div class="viewer-title">${card.name} · market ${money(marketValue(card))}</div>
    <div class="copy-list">
      ${copies.map(c => {
        const cond = conditionOf(c);
        const val = copyValue(c);
        let status, actions;
        if (c.grading) {
          status = `<span class="copy-status">📦 at graders · ${countdown(c.grading.readyAt, 0)}</span>`;
          actions = '';
        } else if (c.grade) {
          status = `<span class="copy-grade">🏅 ${c.grade.label} (${c.grade.score})</span>`;
          actions = `<button class="btn mini" data-act="report" data-uid="${c.uid}">Report</button>
                     <button class="btn mini" data-act="sell" data-uid="${c.uid}">Sell ${money(val)}</button>`;
        } else {
          status = `<span style="color:${cond.color};font-weight:900">${cond.short}</span>`;
          actions = `<button class="btn mini" data-act="grade" data-uid="${c.uid}">🏅 Grade</button>
                     <button class="btn mini" data-act="sell" data-uid="${c.uid}">Sell ${money(val)}</button>`;
        }
        return `<div class="copy-row">${status}<span class="copy-actions">${actions}</span></div>`;
      }).join('') || '<div class="copy-row"><span class="copy-status">You don’t own this card yet.</span></div>'}
    </div>
    <button class="btn coin" id="viewer-buy">🛒 Buy single · ${money(buyCost)}</button>`;

  $('#viewer-buy').addEventListener('click', () => { if (buySingle(viewer.cardId)) renderViewerCopies(); });
  $$('#viewer-copies [data-act]').forEach(btn => btn.addEventListener('click', () => {
    const uid = +btn.dataset.uid;
    const act = btn.dataset.act;
    if (act === 'sell') { const got = sellCopy(uid); if (got) toast(`Sold for ${money(got)}`); renderViewerCopies(); renderCollection(); }
    if (act === 'report') showReport(uid);
    if (act === 'grade') {
      showModal(`<h3>Send to OmniGrade</h3>
        <p class="rate-note">Grading measures centering, corners, edges and surface,
        and seals the card in a slab. Graded cards are worth more.</p>
        <button class="btn primary" id="g-std">Standard · ${money(GRADE_TIERS.std.cost)} · 5 min</button>
        <button class="btn primary" id="g-exp">Express · ${money(GRADE_TIERS.exp.cost)} · 60 sec</button>`);
      $('#g-std').addEventListener('click', () => { sendToGrading(uid, 'std'); $('#rates-modal').classList.remove('show'); renderViewerCopies(); });
      $('#g-exp').addEventListener('click', () => { sendToGrading(uid, 'exp'); $('#rates-modal').classList.remove('show'); renderViewerCopies(); });
    }
  }));
}

function startViewerLoop() {
  const inner = $('#v3d-inner');
  const glare = $('#v3d-glare');
  viewer.lastT = performance.now();
  const tick = t => {
    if (!viewer.cardId) return;
    const dt = Math.min(50, t - viewer.lastT);
    viewer.lastT = t;
    if (!viewer.dragging) {
      if (Math.abs(viewer.vx) > 0.02) {
        viewer.ry += viewer.vx * dt;
        viewer.vx *= Math.pow(0.994, dt);
      } else {
        viewer.ry += 0.010 * dt; // slow idle spin
      }
    }
    inner.style.transform = `rotateX(${viewer.rx}deg) rotateY(${viewer.ry}deg)`;
    if (glare) {
      const a = ((viewer.ry % 360) + 360) % 360;
      const gx = 50 + Math.sin(a * Math.PI / 180) * 45;
      const gy = 40 - viewer.rx;
      glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, #ffffff59, transparent 55%)`;
    }
    viewer.raf = requestAnimationFrame(tick);
  };
  viewer.raf = requestAnimationFrame(tick);
}

function bindViewerGestures() {
  const stage = $('#viewer-stage');
  let px = 0, py = 0, lastDx = 0, lastMove = 0;
  stage.addEventListener('pointerdown', e => {
    viewer.dragging = true; viewer.vx = 0;
    px = e.clientX; py = e.clientY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!viewer.dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    viewer.ry += dx * 0.45;
    viewer.rx = Math.max(-45, Math.min(45, viewer.rx - dy * 0.3));
    lastDx = dx; lastMove = performance.now();
  });
  const release = () => {
    if (!viewer.dragging) return;
    viewer.dragging = false;
    viewer.vx = (performance.now() - lastMove < 80) ? lastDx * 0.05 : 0;
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('dblclick', () => { viewer.rx = -6; viewer.ry = 0; viewer.vx = 0; });
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
  $('#viewer-close').addEventListener('click', closeViewer);
  bindViewerGestures();
  $('#reset-btn').addEventListener('click', () => {
    if (confirm('Reset ALL progress? Your collection and cash will be lost.')) {
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
