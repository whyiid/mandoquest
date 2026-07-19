/* ===========================================================================
   MandoQuest — app.js
   Core engine + 5 game modes. Vanilla JS, no dependencies.
   Sections:  Utils · TTS/Speech · State · Gamification · Router ·
              Home · Category · Modes (Match/Listen/Hunt/Speak/Sentence) ·
              Results · Init
   =========================================================================== */
'use strict';

/* ── tiny DOM utils ──────────────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function sample(a, n) { return shuffle(a).slice(0, n); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

const gameArea = () => $('#game-area');

/* ── sound effects bridge (sfx.js → window.MandoSFX) ─────────────────────
   Safe no-op if sfx.js is missing or the toggle is off. Never used for the
   Mandarin pronunciation — that stays in speak() so it's always audible. */
function sfx(name) { try { const s = window.MandoSFX; if (s && typeof s[name] === 'function') s[name](); } catch (e) {} }

/* ── Text-to-Speech (zh-CN) ──────────────────────────────────────────── */
let zhVoice = null;
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find(v => /zh[-_]?CN|zh\b|cmn|Chinese|Mandarin/i.test(v.lang + ' ' + v.name)) ||
            vs.find(v => /zh/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
let currentAudio = null;
function stopAudio() {
  if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {} currentAudio = null; }
}
function ttsSpeak(text, rate) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = rate || 0.8; u.pitch = 1.05;
    if (zhVoice) u.voice = zhVoice;
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
/* Hybrid speak: prefer a bundled clear recording (audio/manifest.js → window.MANDO_AUDIO),
   fall back to the browser's Web Speech voice if the clip is missing or blocked. */
function speak(text, rate) {
  if (!text) return;
  stopAudio();
  const src = window.MANDO_AUDIO && window.MANDO_AUDIO[text];
  if (!src) { ttsSpeak(text, rate); return; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  let settled = false;
  const a = new Audio(src);
  currentAudio = a;
  const fallback = () => {
    if (settled) return; settled = true;
    if (currentAudio === a) currentAudio = null;
    ttsSpeak(text, rate);
  };
  a.addEventListener('playing', () => { settled = true; });   // real clip started → no fallback
  a.addEventListener('error', fallback);
  try {
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(fallback);  // autoplay-blocked / decode error
  } catch (e) { fallback(); }
}

/* ── Speech Recognition (zh-CN) — used by Speak mode ─────────────────── */
const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = !!SRClass;
function listenOnce(onResult, onError) {
  if (!speechSupported) { onError('unsupported'); return null; }
  let r;
  try { r = new SRClass(); } catch (e) { onError('unsupported'); return null; }
  r.lang = 'cmn-Hans-CN'; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
  let settled = false;
  const settle = fn => (...args) => { if (settled) return; settled = true; clearTimeout(timer); fn(...args); };
  const timer = setTimeout(settle(() => { try { r.abort(); } catch (_) {} onError('network'); }), 12000);
  r.onresult = settle(e => {
    const alts = [], res = e.results[0];
    for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
    onResult(alts);
  });
  r.onerror = settle(e => onError(e.error || 'error'));
  r.onend = settle(() => onError('no-speech'));
  setTimeout(() => {
    try { r.start(); } catch (e) { settled = true; clearTimeout(timer); onError('error'); return; }
    setTimeout(() => { try { r.stop(); } catch (_) {} }, 6000);   // let onresult fire, don't hang to 12s abort
  }, 300);
  return r;
}
function normHan(s) { return (s || '').replace(/[^一-鿿A-Za-z0-9]/g, ''); }
const NUM_TO_HAN = {'1000':'千','100':'百','10':'十','0':'零','1':'一','2':'二','3':'三','4':'四','5':'五','6':'六','7':'七','8':'八','9':'九'};
function numToHan(s) { return (s||'').replace(/1000|100|10|\d/g, m => NUM_TO_HAN[m] || m); }
function toneless(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, ''); }
function speechMatch(alts, w) {
  const t = normHan(w.hanzi), tpy = toneless(w.pinyin);
  return alts.some(a => {
    const x = normHan(numToHan(a));
    if (x && (x === t || x.includes(t) || t.includes(x))) return true;
    let common = 0;
    for (const ch of t) if (x.indexOf(ch) !== -1) common++;
    if (t.length && common >= Math.ceil(t.length / 2)) return true;
    const apy = toneless(a);                                     // recognizer sometimes returns latin pinyin
    return apy && tpy && (apy.includes(tpy) || tpy.includes(apy));
  });
}

/* ── Persistent state ────────────────────────────────────────────────── */
const SAVE_KEY = 'mandoquest.v1';
const DEFAULT_STATE = { progress: {}, streak: { count: 0, last: '' }, sentence: { best: 0 }, unlockSeen: [] };
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), JSON.parse(raw));
  } catch (e) { /* fresh start */ }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }

function ensureCat(id) { if (!state.progress[id]) state.progress[id] = { words: {}, xp: 0, stars: {} }; }
function addWordCorrect(id, hanzi) { ensureCat(id); state.progress[id].words[hanzi] = (state.progress[id].words[hanzi] || 0) + 1; }
function addXp(id, n) { ensureCat(id); state.progress[id].xp += n; }
function setBest(id, mode, stars) { ensureCat(id); if (stars > (state.progress[id].stars[mode] || 0)) state.progress[id].stars[mode] = stars; }
function getBest(id, mode) { return (state.progress[id] && state.progress[id].stars[mode]) || 0; }
function categoryMastery(id) {
  const cat = MANDO_DATA.getCategory(id), p = state.progress[id];
  if (!p) return 0;
  // word-based: needs each word answered right 3x — but rounds only sample 6
  // words, so big categories plateau below 80% even at max stars.
  let sum = 0;
  cat.words.forEach(w => { sum += Math.min(p.words[w.hanzi] || 0, 3); });
  const wordPct = sum / (cat.words.length * 3) * 100;
  // star-based: 3 stars in all 4 modes = topic beaten = 100%. Take whichever
  // is higher so completing every mode always unlocks the next topic.
  let stars = 0;
  MODES.forEach(mo => { stars += p.stars[mo.key] || 0; });
  const starPct = stars / (MODES.length * 3) * 100;
  return Math.round(Math.max(wordPct, starPct));
}
function isUnlocked(i) { return i === 0 || categoryMastery(MANDO_DATA.categories[i - 1].id) >= 80; }
function totalStars() {
  let s = state.sentence.best || 0;
  for (const id in state.progress) { const st = state.progress[id].stars || {}; for (const k in st) s += st[k]; }
  return s;
}

/* streak */
function dateStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function todayStr() { return dateStr(new Date()); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
function bumpStreak() {
  const t = todayStr();
  if (state.streak.last === t) return;
  state.streak.count = (state.streak.last === yesterdayStr()) ? state.streak.count + 1 : 1;
  state.streak.last = t;
}

function refreshUnlocks(announce) {
  MANDO_DATA.categories.forEach((c, i) => {
    if (isUnlocked(i) && state.unlockSeen.indexOf(c.id) === -1) {
      state.unlockSeen.push(c.id);
      if (announce && i > 0) { sfx('unlock'); toast('🎉 New topic unlocked: ' + c.name + '!'); }
    }
  });
}

/* ── Dragon mascot ───────────────────────────────────────────────────── */
function mountDragon(container) {
  const node = $('#dragon-tpl').content.cloneNode(true);
  container.innerHTML = '';
  container.appendChild(node);
  return container.querySelector('.dragon');
}
function setMood(dragon, mood, revert) {
  if (!dragon) return;
  dragon.setAttribute('class', 'dragon ' + mood);
  if (revert !== false && mood !== 'idle') setTimeout(() => dragon.setAttribute('class', 'dragon idle'), 1200);
}
function reactGame(mood, text) {
  const d = $('#game-area .dragon'), s = $('#game-area .game-speech');
  if (d) setMood(d, mood);
  if (s && text) s.textContent = text;
}

/* ── visual faces shared by modes ────────────────────────────────────── */
function faceMeaning(w) {
  if (w.swatch) return '<div class="face"><span class="swatch" style="background:' + w.swatch + '"></span><span class="en">' + w.en + '</span></div>';
  if (w.emoji)  return '<div class="face"><span class="emoji">' + w.emoji + '</span><span class="en">' + w.en + '</span></div>';
  return '<div class="face"><span class="en" style="font-size:24px">' + w.en + '</span></div>';
}
function faceHanzi(w, py) {
  return '<div class="face"><span class="hz">' + w.hanzi + '</span>' + (py ? '<span class="py">' + w.pinyin + '</span>' : '') + '</div>';
}

/* ── toast & confetti ────────────────────────────────────────────────── */
let toastT = null;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
function confetti() {
  const colors = ['#ff8a3d', '#ff5e9a', '#8b5cf6', '#38bdf8', '#34d399', '#ffd23f'];
  for (let i = 0; i < 36; i++) {
    const c = el('div', 'confetti');
    c.style.left = (Math.random() * 100) + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animation = 'fall ' + (1 + Math.random() * 1.4) + 's ' + (Math.random() * 0.4) + 's ease-in forwards';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

/* ── Router ──────────────────────────────────────────────────────────── */
let currentGame = { catId: null, replay: function () {} };
let gameCleanup = null;
function showScreen(id) {
  if (gameCleanup) { try { gameCleanup(); } catch (e) {} gameCleanup = null; }
  stopAudio();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}
function goHome() { renderHome(); showScreen('screen-home'); }
function goCategory(catId) { renderCategory(catId); showScreen('screen-category'); }
function handleNav(target) {
  if (target === 'home') goHome();
  else if (target === 'back-cat') { if (currentGame && currentGame.catId) goCategory(currentGame.catId); else goHome(); }
}

/* ── Home screen ─────────────────────────────────────────────────────── */
function renderHome() {
  refreshUnlocks(false);
  $('#hud-streak').textContent = state.streak.count || 0;
  $('#hud-stars').textContent = totalStars();
  mountDragon($('#home-dragon'));
  $('#home-speech').textContent = pick(MANDO_DATA.phrases.idle);

  const grid = $('#cat-grid'); grid.innerHTML = '';
  MANDO_DATA.categories.forEach((c, idx) => {
    const m = categoryMastery(c.id), unlocked = isUnlocked(idx);
    const card = el('div', 'cat-card' + (unlocked ? '' : ' locked'));
    card.innerHTML =
      '<span class="cc-icon">' + c.icon + '</span>' +
      '<span class="cc-name">' + c.name + '</span>' +
      '<div class="cc-bar"><div class="cc-fill" style="width:' + m + '%;background:' + c.color + '"></div></div>' +
      '<span class="cc-pct">' + m + '%</span>' +
      (unlocked ? '' :
        '<div class="cc-lock"><span class="lk">🔒</span>Reach 80% in ' + MANDO_DATA.categories[idx - 1].name + '</div>');
    if (unlocked) card.onclick = () => goCategory(c.id);
    grid.appendChild(card);
  });
}

/* ── difficulty tiers (per-topic ramp) ───────────────────────────────────
   Topics ramp in difficulty by their order: first 4 = easy, next 5 = medium,
   rest = hard. Later phases add more items/options + mixed distractors; this
   phase drives only how much pinyin scaffolding is shown. */
function catTier(id) {
  const i = MANDO_DATA.categories.findIndex(c => c.id === id);
  return i < 4 ? 'easy' : i < 9 ? 'medium' : 'hard';
}
const TIER_BADGE = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };
// item/option counts scale up with tier — more to track = harder.
function tierN(id, easy, medium, hard) {
  const t = catTier(id);
  return t === 'easy' ? easy : t === 'medium' ? medium : hard;
}
// words from earlier (already-unlocked) topics — feed cumulative-review distractors.
function earlierWords(id) {
  const cats = MANDO_DATA.categories;
  const idx = cats.findIndex(c => c.id === id);
  let pool = [];
  for (let j = 0; j < idx; j++) pool = pool.concat(cats[j].words);
  return pool;
}
// n distractor words for `correct`. easy = same topic only; medium/hard blend
// in ~half from earlier topics so wrong options review past vocab.
function distractors(id, correct, n) {
  const same = MANDO_DATA.getCategory(id).words.filter(w => w.hanzi !== correct.hanzi);
  if (catTier(id) === 'easy') return sample(same, n);
  const older = earlierWords(id).filter(w => w.hanzi !== correct.hanzi);
  const picked = sample(older, Math.min(older.length, Math.ceil(n / 2)));
  const taken = new Set(picked.map(w => w.hanzi).concat(correct.hanzi));
  let out = picked.concat(sample(same.filter(w => !taken.has(w.hanzi)), n - picked.length));
  if (out.length < n) {
    const seen = new Set(out.map(w => w.hanzi).concat(correct.hanzi));
    out = out.concat(sample(older.filter(w => !seen.has(w.hanzi)), n - out.length));
  }
  return shuffle(out).slice(0, n);
}
// pinyin crutch drops as tier rises: easy = everywhere, medium = keep only in
// Speak (the pronunciation guide), hard = none.
function showPinyin(id, where) {
  const t = catTier(id);
  if (t === 'easy') return true;
  if (t === 'hard') return false;
  return where === 'speak';   // medium
}

/* ── Category menu ───────────────────────────────────────────────────── */
const MODES = [
  { key: 'match',  name: 'Match & Drop',   sub: 'Drag the picture', emoji: '🧲', color: 'var(--brand)' },
  { key: 'listen', name: 'Listen & Choose', sub: 'Hear & tap',       emoji: '👂', color: 'var(--sky)' },
  { key: 'hunt',   name: 'Hanzi Hunt',     sub: 'Beat the clock',   emoji: '⚡', color: 'var(--grape)' },
  { key: 'speak',  name: 'Speak!',         sub: 'Say it out loud',  emoji: '🎤', color: 'var(--brand-2)' }
];
function renderCategory(catId) {
  const cat = MANDO_DATA.getCategory(catId);
  $('#cat-title').textContent = cat.icon + ' ' + cat.name;
  $('#cat-mastery').textContent = categoryMastery(catId) + '%';
  mountDragon($('#cat-dragon'));
  $('#cat-speech').textContent = TIER_BADGE[catTier(catId)] + ' • Choose a game! 🎮';
  const list = $('#mode-list'); list.innerHTML = '';
  MODES.forEach(mo => {
    const best = getBest(catId, mo.key);
    const card = el('div', 'mode-card');
    card.innerHTML =
      '<span class="m-emoji" style="background:' + mo.color + '">' + mo.emoji + '</span>' +
      '<div><div class="m-name">' + mo.name + '</div><div class="m-sub">' + mo.sub + '</div>' +
      '<div class="m-stars">' + (best ? '⭐'.repeat(best) : '☆☆☆') + '</div></div>';
    card.onclick = () => launch(mo.key, catId);
    list.appendChild(card);
  });
}
function launch(key, catId) {
  showScreen('screen-game');
  ({ match: modeMatch, listen: modeListen, hunt: modeHunt, speak: modeSpeak })[key](catId);
}

/* ── shared game render (content + reacting mascot) ──────────────────── */
function gameRender(innerHTML, speechText) {
  gameArea().innerHTML = innerHTML +
    '<div class="mascot-row" style="margin-top:16px"><span class="dragon-holder"></span>' +
    '<div class="speech game-speech">' + (speechText || 'Good luck! 🍀') + '</div></div>';
  mountDragon($('#game-area .dragon-holder'));
}
function setDots(total, done) {
  const c = $('#game-dots'); c.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = el('span', 'dot');
    if (i < done) d.classList.add('done'); else if (i === done) d.classList.add('cur');
    c.appendChild(d);
  }
}

/* ── pointer-based drag (works on touch + mouse) ─────────────────────── */
function makeDraggable(item, onDrop) {
  item.addEventListener('pointerdown', e => {
    if (item.classList.contains('used')) return;
    e.preventDefault();
    const ghost = item.cloneNode(true); ghost.className = 'drag-ghost'; document.body.appendChild(ghost);
    const place = ev => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; };
    place(e); item.classList.add('dragging'); item.setPointerCapture(e.pointerId);
    let cur = null;
    const move = ev => {
      place(ev);
      ghost.style.display = 'none';
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      ghost.style.display = '';
      const t = under && under.closest ? under.closest('.drop-target:not(.filled)') : null;
      if (t !== cur) { if (cur) cur.classList.remove('over'); cur = t; if (t) t.classList.add('over'); }
    };
    const up = () => {
      item.removeEventListener('pointermove', move);
      item.removeEventListener('pointerup', up);
      item.removeEventListener('pointercancel', up);
      ghost.remove(); item.classList.remove('dragging');
      if (cur) cur.classList.remove('over');
      onDrop(item, cur);
    };
    item.addEventListener('pointermove', move);
    item.addEventListener('pointerup', up);
    item.addEventListener('pointercancel', up);
  });
}

/* ===========================================================================
   MODE 1 — Match & Drop
   =========================================================================== */
function modeMatch(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeMatch(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const pool = sample(cat.words, Math.min(tierN(catId, 4, 5, 6), cat.words.length));
  const targets = shuffle(pool.slice());
  let matched = 0, wrong = 0;

  gameRender(
    '<div class="muted" style="text-align:center;font-weight:800;margin-bottom:10px">Drag each picture to its character! ✋</div>' +
    '<div class="match-grid">' +
      '<div class="match-col" id="m-left"><h4>Picture</h4></div>' +
      '<div class="match-col" id="m-right"><h4>Character</h4></div>' +
    '</div>',
    'Drag and match! ✋');

  setDots(4, 0);
  $('#game-score').textContent = 0;
  const left = $('#m-left'), right = $('#m-right');
  pool.forEach(w => { const it = el('div', 'drag-item', faceMeaning(w)); it.dataset.hz = w.hanzi; left.appendChild(it); makeDraggable(it, onDrop); });
  const py = showPinyin(catId, 'match');
  targets.forEach(w => { const t = el('div', 'drop-target', faceHanzi(w, py)); t.dataset.hz = w.hanzi; right.appendChild(t); });

  function onDrop(item, target) {
    if (!target) return;
    if (target.dataset.hz === item.dataset.hz) {
      item.classList.add('used'); item.style.visibility = 'hidden';
      target.classList.add('filled');
      target.insertAdjacentHTML('beforeend', '<div style="font-size:24px;margin-top:4px">✅</div>');
      matched++; addWordCorrect(catId, item.dataset.hz); speak(item.dataset.hz);
      sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); setDots(4, matched);
      $('#game-score').textContent = matched;
      if (matched === 4) setTimeout(() => finishRound({ catId, mode: 'match', correct: 4, total: 4 + wrong }), 900);
    } else {
      wrong++;
      if (item.animate) item.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
    }
  }
}

/* ===========================================================================
   MODE 2 — Listen & Choose
   =========================================================================== */
function modeListen(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeListen(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const qs = sample(cat.words, Math.min(6, cat.words.length));
  let i = 0, correct = 0;

  function show() {
    if (i >= qs.length) { finishRound({ catId, mode: 'listen', correct, total: qs.length }); return; }
    const w = qs[i];
    const opts = shuffle([w].concat(distractors(catId, w, tierN(catId, 3, 4, 5))));
    setDots(qs.length, i);
    $('#game-score').textContent = correct;
    gameRender(
      '<div class="prompt-card"><div style="font-size:60px">👂</div>' +
      '<button class="btn lg" id="ls-play" style="margin-top:8px">🔊 Listen</button></div>' +
      '<div class="options cols-2" id="ls-opts"></div>',
      'Tap what you hear! 👂');

    const og = $('#ls-opts'); let answered = false;
    opts.forEach(o => {
      const c = el('div', 'opt', faceHanzi(o, false)); c.__hz = o.hanzi;
      c.onclick = () => {
        if (answered) return; answered = true;
        if (o.hanzi === w.hanzi) {
          c.classList.add('correct'); correct++; addWordCorrect(catId, w.hanzi); speak(w.hanzi);
          sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct));
        } else {
          c.classList.add('wrong'); sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
          $$('#ls-opts .opt').forEach(x => { if (x.__hz === w.hanzi) x.classList.add('correct'); });
        }
        $$('#ls-opts .opt').forEach(x => { if (x !== c && !x.classList.contains('correct')) x.classList.add('dim'); });
        setTimeout(() => { i++; show(); }, 1200);
      };
      og.appendChild(c);
    });
    $('#ls-play').onclick = () => speak(w.hanzi);
    speak(w.hanzi);
  }
  show();
}

/* ===========================================================================
   MODE 3 — Hanzi Hunt (timed)
   =========================================================================== */
function modeHunt(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeHunt(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const cells = sample(cat.words, Math.min(tierN(catId, 9, 12, 16), cat.words.length));
  let score = 0, target = null, running = true;
  const DUR = 45000;

  gameRender(
    '<div class="timer-bar"><div class="timer-fill" id="hunt-fill"></div></div>' +
    '<div class="prompt-card" style="padding:14px">' +
      '<div class="muted" style="font-size:18px;font-weight:800">Tap the word you hear! 👂</div>' +
      '<button class="btn secondary" id="hunt-replay" style="margin-top:8px">🔊 Hear again</button></div>' +
    '<div class="hunt-grid" id="hunt-grid"></div>',
    'Be quick! ⚡');

  setDots(0, 0);
  $('#game-score').textContent = 0;
  const grid = $('#hunt-grid');
  cells.forEach(w => { const c = el('div', 'hunt-cell', w.hanzi); c.dataset.hz = w.hanzi; c.onclick = () => tap(w, c); grid.appendChild(c); });

  function nextTarget() { target = pick(cells); speak(target.hanzi); }
  $('#hunt-replay').onclick = () => { if (target) speak(target.hanzi); };

  function tap(w, c) {
    if (!running || !target) return;
    if (w.hanzi === target.hanzi) {
      score++; addWordCorrect(catId, w.hanzi); $('#game-score').textContent = score;
      c.classList.add('correct'); setTimeout(() => c.classList.remove('correct'), 300);
      sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); nextTarget();
    } else {
      c.classList.add('wrong'); setTimeout(() => c.classList.remove('wrong'), 300);
      sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
    }
  }

  const start = Date.now(), fill = $('#hunt-fill');
  const iv = setInterval(() => {
    const left = Math.max(0, DUR - (Date.now() - start));
    fill.style.width = (left / DUR * 100) + '%';
    if (left <= 0) { clearInterval(iv); running = false; end(); }
  }, 100);
  gameCleanup = () => { clearInterval(iv); running = false; };

  function end() {
    const stars = score >= 10 ? 3 : score >= 6 ? 2 : 1;
    finishRound({ catId, mode: 'hunt', correct: score, total: Math.max(score, 10), stars, xp: score * 10, winText: 'You found ' + score + ' words! ⚡' });
  }
  nextTarget();
}

/* ===========================================================================
   MODE 4 — Speak! (Web Speech recognition)
   =========================================================================== */
function modeSpeak(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeSpeak(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const qs = sample(cat.words, Math.min(6, cat.words.length));
  let i = 0, correct = 0, rec = null;

  function show() {
    if (i >= qs.length) { finishRound({ catId, mode: 'speak', correct, total: qs.length }); return; }
    const w = qs[i];
    setDots(qs.length, i);
    $('#game-score').textContent = correct;
    gameRender(
      '<div class="prompt-card"><div class="prompt-hanzi">' + w.hanzi + '</div>' +
      (showPinyin(catId, 'speak') ? '<div class="prompt-pinyin">' + w.pinyin + '</div>' : '') +
      '<div class="prompt-en">' + w.en + '</div></div>' +
      '<button class="btn secondary replay-btn" id="sp-hear">🔊 Hear it</button>' +
      '<div class="center-col" style="flex:0">' +
        '<button class="mic-btn" id="sp-mic">🎤</button>' +
        '<div class="feedback-line" id="sp-fb"></div>' +
        '<div class="heard" id="sp-heard"></div>' +
        '<button class="btn ghost" id="sp-skip" style="margin-top:6px">Skip ➜</button>' +
      '</div>',
      speechSupported ? 'Press 🎤 and say it!' : 'Say it out loud, then tap ✅');

    $('#sp-hear').onclick = () => speak(w.hanzi);
    speak(w.hanzi);
    $('#sp-skip').onclick = () => { i++; show(); };

    const mic = $('#sp-mic'), fb = $('#sp-fb'), heard = $('#sp-heard');

    // Self-report pass: child taps ✅ to confirm they said it. Used when speech
    // recognition can't work — no API support, OR offline: Web Speech streams
    // audio to Google servers, so with no wifi it silently returns no-speech
    // every time. Matthew plays as an installed PWA offline, so this is the
    // normal path for him, not just a fallback.
    const passBtn = hint => {
      mic.textContent = '✅'; mic.classList.remove('listening');
      fb.className = 'feedback-line'; fb.textContent = hint || 'Tap ✅ when you said it 😊'; heard.textContent = '';
      mic.onclick = () => {
        fb.className = 'feedback-line good'; fb.textContent = '✅ ' + pick(['Hebat!', 'Great!', 'Perfect!', 'Wow!']);
        correct++; addWordCorrect(catId, w.hanzi); sfx('correct'); reactGame('excited'); confetti();
        setTimeout(() => { i++; show(); }, 1000);
      };
    };

    if (!speechSupported || !navigator.onLine) { passBtn(); return; }

    let retried = false;
    const startListen = () => {
      stopAudio(); if ('speechSynthesis' in window) speechSynthesis.cancel();   // free the audio channel before mic
      mic.classList.add('listening'); fb.className = 'feedback-line'; fb.textContent = 'Listening... 👂'; heard.textContent = '';
      rec = listenOnce(
        alts => {
          mic.classList.remove('listening');
          heard.textContent = alts[0] ? 'You said: ' + alts[0] : '';
          if (speechMatch(alts, w)) {
            fb.className = 'feedback-line good'; fb.textContent = '✅ ' + pick(['Hebat!', 'Great!', 'Perfect!', 'Wow!']);
            correct++; addWordCorrect(catId, w.hanzi); sfx('correct'); reactGame('excited'); confetti();
            setTimeout(() => { i++; show(); }, 1200);
          } else {
            fb.className = 'feedback-line bad'; fb.textContent = '🔄 Try again!'; sfx('wrong'); reactGame('sad');
          }
        },
        err => {
          mic.classList.remove('listening');
          if (err === 'not-allowed' || err === 'service-not-allowed') { fb.className = 'feedback-line bad'; fb.textContent = '🎙️ Please allow the microphone!'; return; }
          if ((err === 'no-speech' || err === 'aborted') && !retried) { retried = true; startListen(); return; }   // one silent retry
          // recognizer can't hear it (offline, no language pack, weak mic) —
          // don't dead-end the child on "try again"; let them self-report.
          passBtn("🎤 couldn't hear — tap ✅ if you said it!");
        }
      );
    };
    mic.onclick = startListen;
  }
  gameCleanup = () => { try { rec && rec.abort && rec.abort(); } catch (e) {} };
  show();
}

/* ===========================================================================
   MODE 5 — Sentence Builder (tap to arrange)
   =========================================================================== */
function modeSentence() {
  currentGame = { catId: null, replay: () => { showScreen('screen-game'); modeSentence(); } };
  const qs = sample(MANDO_DATA.sentences, Math.min(5, MANDO_DATA.sentences.length));
  let i = 0, firstTry = 0;

  function show() {
    if (i >= qs.length) { finishSentence(firstTry, qs.length); return; }
    const s = qs[i]; let tried = false;
    setDots(qs.length, i);
    gameRender(
      '<div class="prompt-card" style="padding:16px"><div class="prompt-en">' + s.en + '</div>' +
      '<div class="muted" style="font-size:15px;margin-top:4px">' + s.pinyin + '</div></div>' +
      '<div class="sent-build" id="sent-build"></div>' +
      '<div class="sent-bank" id="sent-bank"></div>' +
      '<button class="btn block lg" id="sent-check" style="margin-top:16px">Check ✅</button>',
      'Put the words in order! 🧩');

    const build = $('#sent-build'), bankEl = $('#sent-bank'), placed = [];
    shuffle(s.tokens.map((tk, idx) => ({ tk, idx }))).forEach(o => {
      const src = el('div', 'word-card', o.tk);
      src.onclick = () => {
        if (src.classList.contains('used')) return;
        src.classList.add('used'); sfx('tap');
        const chip = el('div', 'word-card', o.tk);
        chip.onclick = () => { chip.remove(); src.classList.remove('used'); placed.splice(placed.indexOf(o), 1); };
        build.appendChild(chip); placed.push(o);
      };
      bankEl.appendChild(src);
    });

    $('#sent-check').onclick = () => {
      if (placed.length === 0) { toast('Tap the words to build! 👆'); return; }
      const ok = placed.map(p => p.tk).join('') === s.tokens.join('');
      if (ok) {
        if (!tried) firstTry++;
        $$('#sent-build .word-card').forEach(x => x.style.background = 'var(--good-soft)');
        speak(s.tokens.join('')); sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct));
        setTimeout(() => { i++; show(); }, 1300);
      } else {
        tried = true; sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong)); toast('Not yet — try again! 💪');
        $$('#sent-build .word-card').forEach(x => { x.style.background = 'var(--bad-soft)'; setTimeout(() => x.style.background = '', 600); });
      }
    };
  }
  show();
}
function finishSentence(correct, total) {
  const stars = computeStars(correct, total);
  bumpStreak(); state.sentence.best = Math.max(state.sentence.best || 0, stars);
  save(); refreshUnlocks(true);
  showResult(stars, correct * 15, correct, total, 'Sentence Master! 🧩', null);
}

/* ── round finish + results ──────────────────────────────────────────── */
function computeStars(correct, total) {
  if (total <= 0) return 1;
  const a = correct / total;
  return a >= 0.9 ? 3 : a >= 0.6 ? 2 : 1;
}
function finishRound(o) {
  const stars = (o.stars != null) ? o.stars : computeStars(o.correct, o.total);
  const xp = (o.xp != null) ? o.xp : o.correct * 10;
  if (o.catId) { ensureCat(o.catId); addXp(o.catId, xp); setBest(o.catId, o.mode, stars); }
  bumpStreak(); save(); refreshUnlocks(true);
  showResult(stars, xp, o.correct, o.total, o.winText, o.catId || null);
}
function showResult(stars, xp, correct, total, winText, catId) {
  currentGame.catId = catId;
  sfx('win');
  const d = mountDragon($('#result-dragon')); setMood(d, stars >= 2 ? 'excited' : 'happy', false);
  ['s1', 's2', 's3'].forEach((c, idx) => $('.big-star.' + c).classList.toggle('on', idx < stars));
  $('#result-title').textContent = stars >= 3 ? 'Perfect! 🌟' : stars === 2 ? 'Well done! 🎉' : 'Good try! 💪';
  $('#result-xp').textContent = '+' + xp + ' XP  ·  ' + correct + '/' + total + ' correct';
  $('#result-msg').textContent = winText || pick(MANDO_DATA.phrases.win);
  $('#btn-again').onclick = () => currentGame.replay();
  showScreen('screen-result');
  if (stars >= 2) confetti();
}

/* ── Init ────────────────────────────────────────────────────────────── */
function init() {
  load();
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nav]');
    if (n) { e.preventDefault(); handleNav(n.dataset.nav); }
  });
  $('#sentence-tile').onclick = () => { showScreen('screen-game'); modeSentence(); };

  // music & sound toggle (does NOT affect Mandarin pronunciation)
  const soundBtn = $('#sound-toggle');
  if (soundBtn) {
    const syncSound = () => { const ico = $('#sound-ico'); if (ico) ico.textContent = (window.MandoSFX && window.MandoSFX.isOn()) ? '🔊' : '🔇'; };
    syncSound();
    soundBtn.onclick = () => { if (window.MandoSFX) { window.MandoSFX.toggle(); syncSound(); } };
  }

  renderHome();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
init();
