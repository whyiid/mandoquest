/* ===========================================================================
   MandoQuest — app.js
   Core engine + 9 learning activities. Vanilla JS, no dependencies.
   Sections:  Utils · TTS/Speech · State · Gamification · Router ·
              Home · Category · Modes (Match/Listen/Hunt/Speak/Recall/Sentence/
              Pattern/Tones/Sentence Listening) ·
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
  r.lang = 'zh-CN'; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
  let settled = false;
  let hardTimer = null, stopTimer = null;
  const settle = fn => (...args) => {
    if (settled) return;
    settled = true;
    clearTimeout(hardTimer); clearTimeout(stopTimer);
    fn(...args);
  };
  r.onresult = settle(e => {
    const alts = [], res = e.results[0];
    for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
    onResult(alts);
  });
  r.onerror = settle(e => onError(e.error || 'error'));
  r.onend = settle(() => onError('no-speech'));
  // Start inside the tap event. Delaying this can lose Android's transient user
  // activation before Chrome requests microphone permission.
  try { r.start(); } catch (e) { settled = true; onError('error'); return null; }
  stopTimer = setTimeout(() => { try { r.stop(); } catch (_) {} }, 6000);
  hardTimer = setTimeout(settle(() => { try { r.abort(); } catch (_) {} onError('network'); }), 12000);
  return r;
}
const speechMatch = window.MandoSpeech.matchesSpeech;
const createSpeechGuard = window.MandoSpeech.createSingleUseGuard;
const createTapCooldown = window.MandoSpeech.createTapCooldown;
const updateSrsEntry = window.MandoLearning.updateSrsEntry;
const weakSrsEntries = window.MandoLearning.weakSrsEntries;
const isWeakWord = window.MandoLearning.isWeakWord;
const masteryFor = window.MandoLearning.masteryFor;
const rankFor = window.MandoLearning.rankFor;
const modesOpen = window.MandoLearning.modesOpen;

/* ── Persistent state ────────────────────────────────────────────────── */
// Bumped with the service-worker CACHE version. Shown on the Progress screen so
// "am I actually on the new build?" can be answered by looking, not by asking.
const APP_BUILD = 'v35';
const SAVE_KEY = 'mandoquest.v1';
const DEFAULT_STATE = { progress: {}, streak: { count: 0, last: '' }, sentence: { best: 0 }, patterns: {}, unlockSeen: [], gateV2: false, quest: null, srs: {}, tones: { best: 0 }, hear: { best: 0 } };
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

/* ── Spaced repetition ───────────────────────────────────────────────────
   The app used to count only the words he got RIGHT and never the ones he got
   wrong, so it had no idea which words were weak. Every word now carries a
   streak and a due date: miss it and it returns tomorrow, nail it repeatedly
   and it backs off to a month. Review then targets what is about to be
   forgotten instead of whatever the shuffle happened to pick.               */
const SRS_STEPS = [1, 2, 4, 8, 16, 32];        // days, indexed by correct streak
function addDays(ds, n) {
  const [y, m, d] = ds.split('-').map(Number);
  const t = new Date(y, m - 1, d + n);
  return dateStr(t);
}
function recordWord(catId, hanzi, ok) {
  // '_galaxy' / '_srs' are virtual decks — don't create progress rows for them
  if (ok && catId && catId.charAt(0) !== '_') addWordCorrect(catId, hanzi);
  if (!state.srs) state.srs = {};
  const today = todayStr();
  state.srs[hanzi] = updateSrsEntry(state.srs[hanzi], ok, today, SRS_STEPS, addDays);
}
// Words he has met before, from open topics, whose rest day has arrived.
function dueWords() {
  const t = todayStr(), out = [];
  if (!state.srs) return out;
  MANDO_DATA.categories.forEach((c, i) => {
    if (!isUnlocked(i)) return;
    c.words.forEach(w => {
      const e = state.srs[w.hanzi];
      if (e && e.due <= t) out.push(Object.assign({}, w, { _src: c.id, _miss: e.miss || 0 }));
    });
  });
  // weakest first, so a short session still covers the shakiest words
  return out.sort((a, b) => b._miss - a._miss);
}
function launchSrs() {
  const due = dueWords();
  if (!due.length) { toast('🧠 Nothing to review today — well done!'); return; }
  MANDO_DATA._virtual['_srs'] = {
    id: '_srs', name: 'Memory Check', icon: '🧠', color: '#7E57C2',
    words: due.slice(0, 12)
  };
  goCategory('_srs');
}
function addXp(id, n) { ensureCat(id); state.progress[id].xp += n; }
function setBest(id, mode, stars) { ensureCat(id); if (stars > (state.progress[id].stars[mode] || 0)) state.progress[id].stars[mode] = stars; }
function getBest(id, mode) { return (state.progress[id] && state.progress[id].stars[mode]) || 0; }
// Mastery is skill, not repetition: best stars earned across the 4 modes.
// It used to also take a word-exposure score (each word answered right 3x) and
// return whichever was higher. That score counts how OFTEN a word was answered
// right, never how often it was answered wrong, so replaying a topic at 40%
// accuracy still crept to 100% and unlocked the next one. Stars carry accuracy,
// so they are the only gate now.
function categoryStars(id) {
  const p = state.progress[id];
  if (!p || !p.stars) return 0;
  let stars = 0;
  MODES.forEach(mo => { stars += p.stars[mo.key] || 0; });
  return stars;
}
function maxStars() { return MODES.length * 3; }
function categoryMastery(id) { return Math.round(categoryStars(id) / maxStars() * 100); }
// Stars needed to open the next topic — 80% of 12, shown as a count because
// "10 of 12 stars" is something a child can act on and "83%" is not.
function starsToUnlock() { return Math.ceil(maxStars() * 0.8); }
// A topic already opened stays open — tightening the gate must not take away
// what Matthew reached under the old rules. New topics must earn it.
function isUnlocked(i) {
  if (i === 0) return true;
  if (state.unlockSeen.indexOf(MANDO_DATA.categories[i].id) !== -1) return true;
  return categoryStars(MANDO_DATA.categories[i - 1].id) >= starsToUnlock();
}

// One-time repair. The old gate also accepted word exposure — how OFTEN a word
// was answered right, never how often it was answered wrong — and `unlockSeen`
// only ever recorded a topic on the device that was open when it unlocked. So
// tightening the gate re-locked topics that were genuinely open before. The old
// rule is recomputed here from the saved word counts and anything it had opened
// is written into unlockSeen, once. Nothing new is granted: from here on a topic
// opens only by earning stars.
function migrateUnlocks() {
  if (state.gateV2) return;
  MANDO_DATA.categories.forEach((c, i) => {
    if (i === 0 || state.unlockSeen.indexOf(c.id) !== -1) return;
    const prev = MANDO_DATA.categories[i - 1], p = state.progress[prev.id];
    if (!p || !p.words) return;
    let sum = 0;
    prev.words.forEach(w => { sum += Math.min(p.words[w.hanzi] || 0, 3); });
    if (sum / (prev.words.length * 3) * 100 >= 80) state.unlockSeen.push(c.id);
  });
  state.gateV2 = true;
  save();
}
function totalStars() {
  let s = state.sentence.best || 0;
  for (const id in state.progress) { const st = state.progress[id].stars || {}; for (const k in st) s += st[k]; }
  for (const id in (state.patterns || {})) s += state.patterns[id] || 0;
  s += (state.tones && state.tones.best) || 0;
  s += (state.hear && state.hear.best) || 0;
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
  renderQuest();
  $('#hud-streak').textContent = state.streak.count || 0;
  $('#hud-stars').textContent = totalStars();
  mountDragon($('#home-dragon'));
  $('#home-speech').textContent = pick(MANDO_DATA.phrases.idle);

  const rank = playerRank(), toNext = starsToNextRank();
  const rb = $('#home-rank');
  if (rb) {
    rb.innerHTML =
      '<span class="r-badge">' + rank.badge + '</span>' +
      '<div class="r-text"><div class="r-name">' + rank.name + '</div>' +
      '<div class="r-sub">' + (toNext == null
        ? 'Top rank reached! 👑'
        : toNext + ' ⭐ to ' + RANKS[rankIndex() + 1].badge + ' ' + RANKS[rankIndex() + 1].name) +
      '</div></div>';
  }

  const grid = $('#cat-grid'); grid.innerHTML = '';
  MANDO_DATA.categories.forEach((c, idx) => {
    const m = categoryMastery(c.id), unlocked = isUnlocked(idx);
    const st = categoryStars(c.id);
    const lvl = masteryOf(c.id);
    const card = el('div', 'cat-card' + (unlocked ? '' : ' locked'));
    card.innerHTML =
      '<span class="cc-icon">' + c.icon + '</span>' +
      (unlocked ? '<span class="cc-mastery" title="' + lvl.label + '">' + lvl.badge + '</span>' : '') +
      '<span class="cc-name">' + c.name + '</span>' +
      '<div class="cc-bar"><div class="cc-fill" style="width:' + m + '%;background:' + c.color + '"></div></div>' +
      '<span class="cc-pct">' + st + '/' + maxStars() + ' ⭐</span>' +
      (unlocked ? '' :
        '<div class="cc-lock"><span class="lk">🔒</span>Get ' + starsToUnlock() + ' of ' + maxStars() +
         ' ⭐ in ' + MANDO_DATA.categories[idx - 1].name + '</div>');
    if (unlocked) card.onclick = () => goCategory(c.id);
    grid.appendChild(card);
  });

  const hb = $('#home-build');
  if (hb) hb.textContent = 'MandoQuest ' + APP_BUILD;

  // Memory Check tile — only when the schedule actually has something due
  const dueNow = dueWords().length;
  const srsTile = $('#srs-tile');
  if (srsTile) {
    srsTile.hidden = dueNow === 0;
    const sub = $('#srs-sub');
    if (sub) sub.textContent = dueNow + ' word' + (dueNow === 1 ? '' : 's') + ' ready to review';
    srsTile.onclick = launchSrs;
  }

  // Galaxy Mix tile — appears once 3+ topics are unlocked
  const unlockedCats = MANDO_DATA.categories.filter((_, i) => isUnlocked(i));
  if (unlockedCats.length >= 3) {
    const gCard = el('div', 'cat-card galaxy-card');
    gCard.innerHTML =
      '<span class="cc-icon">🌌</span>' +
      '<span class="cc-name">Galaxy Mix</span>' +
      '<div class="cc-bar"><div class="cc-fill" style="width:100%;background:linear-gradient(90deg,#7C4DFF,#FF4081)"></div></div>' +
      '<span class="cc-pct">Mix all!</span>';
    gCard.onclick = launchGalaxy;
    grid.appendChild(gCard);
  }
}

/* ── difficulty tiers (per-topic ramp) ───────────────────────────────────
   Topics ramp in difficulty by their order: first 4 = easy, next 5 = medium,
   rest = hard. Later phases add more items/options + mixed distractors; this
   phase drives only how much pinyin scaffolding is shown. */
function catTier(id) {
  const i = MANDO_DATA.categories.findIndex(c => c.id === id);
  return i < 4 ? 'easy' : i < 9 ? 'medium' : 'hard';
}

/* ── player rank (global ramp) ───────────────────────────────────────────
   Topic tier alone made the ramp a dead end: topic 1 stayed a 4-word round
   forever, so a child who had beaten it thirty times still got the beginner
   version. Rank is earned across the whole app, so the SAME topic gets harder
   as he does — more items per round, more daily jobs, and a higher pass mark
   than "finished it at all". */
// `need` is the star mark a quest job must reach to count. It stayed at 1 for a
// long time on purpose: the first version jumped to 2 the moment he passed 40
// stars, which — stacked on top of harder topics and harder games arriving the
// same day — turned the quest into something he could not clear, and he gave up
// on it. Finishing the round is the job until he is genuinely far along.
const RANKS = [
  { min: 0,   badge: '🥚', name: 'Egg',          jobs: 3, need: 1, extra: 0 },
  { min: 40,  badge: '🐣', name: 'Hatchling',    jobs: 3, need: 1, extra: 0 },
  { min: 100, badge: '🐲', name: 'Young Dragon', jobs: 3, need: 1, extra: 1 },
  { min: 200, badge: '🔥', name: 'Fire Dragon',  jobs: 4, need: 2, extra: 1 },
  { min: 320, badge: '👑', name: 'Dragon Master',jobs: 4, need: 2, extra: 1 }
];
function playerRank() { return rankFor(totalStars(), RANKS); }
function rankIndex() { return RANKS.indexOf(playerRank()); }
// Stars still needed for the next rank — null once he is at the top.
function starsToNextRank() {
  const nxt = RANKS[rankIndex() + 1];
  return nxt ? nxt.min - totalStars() : null;
}
// item/option counts scale up with tier — more to track = harder. The rank
// bonus rides on top so a mastered topic keeps growing instead of stalling.
// `cap` exists because the two knobs do not scale alike: more tiles to find is
// a fair challenge, but a multiple-choice row past six options is just clutter
// an eight-year-old has to scan, so callers that render choices cap the bonus.
function tierN(id, easy, medium, hard, cap) {
  const t = catTier(id);
  const base = t === 'easy' ? easy : t === 'medium' ? medium : hard;
  const n = base + playerRank().extra;
  return cap != null ? Math.min(n, cap) : n;
}

/* ── mastery per topic (what is learned vs what is not) ──────────────────
   The quest used to spread practice evenly, which meant a topic he had beaten
   kept taking slots away from the one he keeps missing. Mastery answers "does
   he actually know this?" from two independent signals: stars (can he play it
   well) and the word schedule (does he still miss the words). A topic counts as
   mastered only when BOTH agree, so a full star row with shaky words does not
   buy its way out of review. */
const MASTERY = [
  { key: 'new',      badge: '⚪', label: 'Not started' },
  { key: 'learning', badge: '🔴', label: 'Learning' },
  { key: 'growing',  badge: '🟡', label: 'Getting there' },
  { key: 'strong',   badge: '🟢', label: 'Strong' },
  { key: 'mastered', badge: '💎', label: 'Mastered' }
];
// Words in a topic he has not yet proven: never seen, recently missed, or not
// carried far enough through the schedule to have stuck.
function weakWordsIn(catId) {
  const cat = MANDO_DATA.getCategory(catId);
  if (!cat) return [];
  const srs = state.srs || {};
  return cat.words.filter(w => isWeakWord(srs[w.hanzi]));
}
function masteryIndex(catId) {
  const cat = MANDO_DATA.getCategory(catId);
  const total = (cat && cat.words.length) || 0;
  return masteryFor(categoryStars(catId), maxStars(), weakWordsIn(catId).length, total);
}
function masteryOf(catId) { return MASTERY[masteryIndex(catId)]; }
// A mastered topic still resurfaces when the schedule says a word is slipping —
// "don't repeat what he knows" must not become "let him forget it".
function needsWork(catId) {
  return masteryIndex(catId) < 4 || weakWordsIn(catId).length > 0;
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
  { key: 'speak',  name: 'Speak!',         sub: 'Say it out loud',  emoji: '🎤', color: 'var(--brand-2)' },
  // The only mode with no menu to pick from. Everything else shows the answer
  // somewhere on screen; this one asks him to produce it from memory.
  { key: 'recall', name: 'Write It!',       sub: 'Type from memory', emoji: '✍️', color: '#7E57C2' }
];
function launchGalaxy() {
  const pool = [];
  MANDO_DATA.categories.forEach((c, i) => {
    if (isUnlocked(i)) c.words.forEach(w => pool.push(Object.assign({}, w, { _src: c.id })));
  });
  const words = sample(pool, Math.min(20, pool.length));
  MANDO_DATA._virtual['_galaxy'] = { id: '_galaxy', name: 'Galaxy Mix', icon: '🌌', color: '#7C4DFF', words };
  goCategory('_galaxy');
}

function renderCategory(catId) {
  const cat = MANDO_DATA.getCategory(catId);
  const isGalaxy = catId === '_galaxy', isSrs = catId === '_srs';
  $('#cat-title').textContent = cat.icon + ' ' + cat.name;
  $('#cat-mastery').textContent = (isGalaxy || isSrs)
    ? cat.words.length + ' words'
    : categoryStars(catId) + '/' + maxStars() + ' ⭐';
  mountDragon($('#cat-dragon'));
  // Show how far HE has got with this topic, not where the topic sits in the
  // list. "Medium" on a topic he has never opened told him nothing about himself
  // and read like the app calling an untouched topic half-done.
  $('#cat-speech').textContent =
    (isGalaxy ? '🌌 Mix from all topics'
     : isSrs   ? '🧠 Words you are about to forget'
     : masteryOf(catId).badge + ' ' + masteryOf(catId).label) + ' • Choose a game! 🎮';
  const list = $('#mode-list'); list.innerHTML = '';

  // Study first. It is always available and never scored, so there is somewhere
  // to go that cannot be failed — including on a topic opened for the very first
  // time, where every game below would just be a quiz on unseen words.
  if (!isGalaxy && !isSrs) {
    const sc = el('div', 'mode-card study-tile');
    sc.innerHTML =
      '<span class="m-emoji" style="background:#26A69A">📖</span>' +
      '<div><div class="m-name">Learn the words</div>' +
      '<div class="m-sub">Look and listen — no score</div></div>';
    sc.onclick = () => { showScreen('screen-game'); modeStudy(catId); };
    list.appendChild(sc);
  }

  const allowed = (isGalaxy || isSrs) ? MODES : modesAllowed(catId);
  MODES.forEach((mo, idx) => {
    const best = getBest(catId, mo.key);
    const open = allowed.some(a => a.key === mo.key);
    const card = el('div', 'mode-card' + (open ? '' : ' mode-locked'));
    card.innerHTML =
      '<span class="m-emoji" style="background:' + mo.color + '">' + (open ? mo.emoji : '🔒') + '</span>' +
      '<div><div class="m-name">' + mo.name + '</div>' +
      '<div class="m-sub">' + (open ? mo.sub : 'Win ' + MODES[idx - 1].name + ' with 2 stars to open') + '</div>' +
      '<div class="m-stars">' + '⭐'.repeat(best) + '☆'.repeat(3 - best) + '</div></div>';
    if (open) card.onclick = () => launch(mo.key, catId);
    list.appendChild(card);
  });
}
function launch(key, catId) {
  showScreen('screen-game');
  ({ match: modeMatch, listen: modeListen, hunt: modeHunt, speak: modeSpeak, recall: modeRecall })[key](catId);
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
   STUDY — look before you are tested
   Every other screen in the app asks a question. For a topic he has not met
   yet that is the wrong first move: he was being quizzed on words nobody had
   shown him, got them wrong, and concluded he was bad at it. This mode cannot
   be failed and keeps no score — it is the "read it first" step that the quest
   hands him before any round on a new topic.
   =========================================================================== */
function modeStudy(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeStudy(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  // Words he has not proven come first; a short topic simply shows everything.
  const weak = weakWordsIn(catId);
  const list = (weak.length >= 4 ? weak : cat.words).slice(0, 8);
  let i = 0;

  function card() {
    if (i >= list.length) { done(); return; }
    const w = list[i];
    setDots(list.length, i);
    $('#game-score').textContent = (i + 1) + '/' + list.length;
    gameRender(
      '<div class="study-card">' +
        '<div class="sd-emoji">' + (w.emoji || '📖') + '</div>' +
        '<div class="sd-hanzi">' + w.hanzi + '</div>' +
        '<div class="sd-pinyin">' + w.pinyin + '</div>' +
        '<div class="sd-en">' + w.en + '</div>' +
        '<button class="btn lg" id="sd-play">🔊 Hear it again</button>' +
      '</div>' +
      '<div class="study-nav">' +
        (i > 0 ? '<button class="btn secondary" id="sd-back">⬅️ Back</button>' : '') +
        '<button class="btn" id="sd-next">' + (i === list.length - 1 ? "I'm ready! ✅" : 'Next ➜') + '</button>' +
      '</div>',
      'Just look and listen — no score here. 😊');
    $('#sd-play').onclick = () => speak(w.hanzi);
    $('#sd-next').onclick = () => { sfx('tap'); i++; card(); };
    const back = $('#sd-back');
    if (back) back.onclick = () => { sfx('tap'); i--; card(); };
    speak(w.hanzi);
  }

  function done() {
    // Studying is a real quest job — it is the step that makes the next round
    // winnable — so it clears its slot regardless of the rank's star mark.
    questComplete('study:' + catId, 99);
    bumpStreak(); save();
    sfx('win'); confetti();
    gameRender(
      '<div class="study-card">' +
        '<div class="sd-emoji">🎓</div>' +
        '<div class="sd-hanzi" style="font-size:34px">Nice studying!</div>' +
        '<div class="sd-en">You saw ' + list.length + ' words. Want to try a game now?</div>' +
      '</div>' +
      '<div class="study-nav">' +
        '<button class="btn secondary" id="sd-again">🔁 Look again</button>' +
        '<button class="btn" id="sd-play-game">🎮 Play a game</button>' +
      '</div>',
      'You are ready! 🌟');
    $('#sd-again').onclick = () => { i = 0; card(); };
    $('#sd-play-game').onclick = () => launch(modesAllowed(catId)[0].key, catId);
  }
  card();
}

/* ===========================================================================
   MODE 1 — Match & Drop
   =========================================================================== */
function modeMatch(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeMatch(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const pool = sample(cat.words, Math.min(tierN(catId, 4, 5, 6), cat.words.length));
  const targets = shuffle(pool.slice());
  const n = pool.length;
  let matched = 0, wrong = 0;

  gameRender(
    '<div class="muted" style="text-align:center;font-weight:800;margin-bottom:10px">Drag each picture to its character! ✋</div>' +
    '<div class="match-grid">' +
      '<div class="match-col" id="m-left"><h4>Picture</h4></div>' +
      '<div class="match-col" id="m-right"><h4>Character</h4></div>' +
    '</div>',
    'Drag and match! ✋');

  setDots(n, 0);
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
      matched++; recordWord(catId, item.dataset.hz, true); speak(item.dataset.hz);
      sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); setDots(n, matched);
      $('#game-score').textContent = matched;
      // The round only ends when everything is matched, so `correct` was always
      // n — a perfect score no matter how many wrong drops it took. Charge the
      // misses against the score instead.
      if (matched === n) setTimeout(() => finishRound({ catId, mode: 'match', correct: Math.max(0, n - wrong), total: n }), 900);
    } else {
      wrong++; recordWord(catId, item.dataset.hz, false);
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
    const opts = shuffle([w].concat(distractors(catId, w, tierN(catId, 3, 4, 5, 5))));
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
          c.classList.add('correct'); correct++; recordWord(catId, w.hanzi, true); speak(w.hanzi);
          sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct));
        } else {
          c.classList.add('wrong'); recordWord(catId, w.hanzi, false);
          sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
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
  let misses = 0;
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
      score++; recordWord(catId, w.hanzi, true); $('#game-score').textContent = score;
      c.classList.add('correct'); setTimeout(() => c.classList.remove('correct'), 300);
      sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); nextTarget();
    } else {
      misses++; recordWord(catId, target.hanzi, false);
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

  // Speed alone used to be enough: wrong taps were never counted, so tapping
  // every cell until something stuck scored 3 stars. Needs speed AND accuracy.
  function end() {
    const taps = score + misses;
    const acc = taps > 0 ? score / taps : 0;
    const stars = (score >= 10 && acc >= 0.8) ? 3 : (score >= 6 && acc >= 0.65) ? 2 : (score >= 3 && acc >= 0.5) ? 1 : 0;
    finishRound({ catId, mode: 'hunt', correct: score, total: Math.max(taps, 10), stars, xp: score * 10, winText: 'You found ' + score + ' words! ⚡' });
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
  let i = 0, correct = 0, rec = null, activeGuard = null;
  const skipCooldown = createTapCooldown(450);

  const pauseForSpeech = () => {
    const audio = window.MandoSFX;
    if (audio && audio.pauseForSpeech) audio.pauseForSpeech();
  };
  const resumeAfterSpeech = () => {
    const audio = window.MandoSFX;
    if (audio && audio.resumeAfterSpeech) audio.resumeAfterSpeech();
  };
  const abortRecognition = () => {
    const current = rec;
    rec = null;
    try { if (current && current.abort) current.abort(); } catch (e) {}
  };

  function show() {
    abortRecognition();
    resumeAfterSpeech();
    if (i >= qs.length) { finishRound({ catId, mode: 'speak', correct, total: qs.length }); return; }
    const w = qs[i];
    const guard = createSpeechGuard();
    activeGuard = guard;
    const canRecognize = speechSupported && navigator.onLine && window.isSecureContext !== false;
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
      canRecognize ? 'Press 🎤 and say it!' : 'Say it out loud, then tap ✅');

    $('#sp-hear').onclick = () => speak(w.hanzi);
    speak(w.hanzi);

    const mic = $('#sp-mic'), fb = $('#sp-fb'), heard = $('#sp-heard'), skip = $('#sp-skip');
    let listening = false, retried = false;

    const disableTurn = () => {
      mic.disabled = true;
      skip.disabled = true;
      mic.classList.remove('listening');
    };
    const markCorrect = () => guard.run(() => {
      disableTurn(); abortRecognition(); resumeAfterSpeech();
      fb.className = 'feedback-line good'; fb.textContent = '✅ ' + pick(['Hebat!', 'Great!', 'Perfect!', 'Wow!']);
      correct++; recordWord(catId, w.hanzi, true); sfx('correct'); reactGame('excited'); confetti();
      setTimeout(() => { i++; show(); }, 1200);
    });

    skip.onclick = () => skipCooldown.run(() => guard.run(() => {
      disableTurn(); abortRecognition(); resumeAfterSpeech();
      recordWord(catId, w.hanzi, false);
      i++; show();
    }));

    // Self-report pass: child taps ✅ to confirm they said it. Used when speech
    // recognition can't work — no API support, OR offline: Web Speech streams
    // audio to Google servers, so with no wifi it silently returns no-speech
    // every time. Matthew plays as an installed PWA offline, so this is the
    // normal path for him, not just a fallback.
    const passBtn = hint => {
      abortRecognition(); resumeAfterSpeech(); listening = false;
      mic.disabled = false; mic.textContent = '✅'; mic.classList.remove('listening');
      fb.className = 'feedback-line'; fb.textContent = hint || 'Tap ✅ when you said it 😊'; heard.textContent = '';
      mic.onclick = markCorrect;
    };

    if (!canRecognize) {
      const hint = window.isSecureContext === false
        ? '🎤 Voice checking needs HTTPS — tap ✅ after you say it!'
        : null;
      passBtn(hint); return;
    }

    const startListen = () => {
      if (!guard.isOpen() || listening) return;
      listening = true; mic.disabled = true;
      stopAudio(); if ('speechSynthesis' in window) speechSynthesis.cancel();   // free the audio channel before mic
      pauseForSpeech();
      mic.classList.add('listening'); fb.className = 'feedback-line'; fb.textContent = 'Listening... 👂'; heard.textContent = '';
      rec = listenOnce(
        alts => {
          if (!guard.isOpen()) return;
          rec = null; listening = false; mic.disabled = false; resumeAfterSpeech();
          mic.classList.remove('listening');
          heard.textContent = alts[0] ? 'You said: ' + alts[0] : '';
          if (speechMatch(alts, w)) {
            markCorrect();
          } else {
            fb.className = 'feedback-line bad'; fb.textContent = '🔄 Try again!'; sfx('wrong'); reactGame('sad');
          }
        },
        err => {
          if (!guard.isOpen()) return;
          rec = null; listening = false; mic.disabled = false; resumeAfterSpeech();
          mic.classList.remove('listening');
          if ((err === 'no-speech' || err === 'aborted') && !retried) { retried = true; startListen(); return; }   // one silent retry
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            passBtn('🎙️ Microphone blocked — tap ✅ after you say it!'); return;
          }
          // recognizer can't hear it (offline, no language pack, weak mic) —
          // don't dead-end the child on "try again"; let them self-report.
          passBtn("🎤 couldn't hear — tap ✅ if you said it!");
        }
      );
    };
    mic.onclick = startListen;
  }
  gameCleanup = () => {
    if (activeGuard) activeGuard.cancel();
    abortRecognition(); resumeAfterSpeech();
  };
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
    const s = qs[i]; let tried = false, answered = false;
    setDots(qs.length, i);
    gameRender(
      '<div class="prompt-card" style="padding:16px"><div class="prompt-en">' + s.en + '</div>' +
      '<div class="muted" style="font-size:15px;margin-top:4px">' + s.pinyin + '</div></div>' +
      '<div class="sent-build" id="sent-build"></div>' +
      '<div class="sent-bank" id="sent-bank"></div>' +
      '<button class="btn block lg" id="sent-check" style="margin-top:16px">Check ✅</button>',
      'Put the words in order! 🧩');

    const build = $('#sent-build'), bankEl = $('#sent-bank'), placed = [];
    // Only the correct tokens used to be offered, so ordering 3 of them was a
    // 6-way guess with no way to pick a wrong word. Decoys make it a real choice.
    const bank = [];
    MANDO_DATA.sentences.forEach(o => o.tokens.forEach(tk => { if (bank.indexOf(tk) === -1) bank.push(tk); }));
    const decoys = sample(bank.filter(tk => s.tokens.indexOf(tk) === -1), s.tokens.length >= 5 ? 2 : 3)
      .map(tk => ({ tk, idx: -1 }));
    shuffle(s.tokens.map((tk, idx) => ({ tk, idx })).concat(decoys)).forEach(o => {
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
      if (answered) return;
      if (placed.length === 0) { toast('Tap the words to build! 👆'); return; }
      const ok = placed.map(p => p.tk).join('') === s.tokens.join('');
      if (ok) {
        answered = true;
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
  questComplete('sentence', stars);
  bumpStreak(); state.sentence.best = Math.max(state.sentence.best || 0, stars);
  save(); refreshUnlocks(true);
  showResult(stars, correct * 15, correct, total, 'Sentence Master! 🧩', null);
}

/* ── round finish + results ──────────────────────────────────────────── */
// 0 stars = round not passed. Without a zero there is no failing grade, so any
// amount of sloppy play still counted toward unlocking the next topic.
function computeStars(correct, total) {
  if (total <= 0) return 0;
  const a = correct / total;
  return a >= 0.9 ? 3 : a >= 0.7 ? 2 : a >= 0.5 ? 1 : 0;
}
function finishRound(o) {
  const stars = (o.stars != null) ? o.stars : computeStars(o.correct, o.total);
  const xp = (o.xp != null) ? o.xp : o.correct * 10;
  if (o.catId) { ensureCat(o.catId); addXp(o.catId, xp); setBest(o.catId, o.mode, stars); }
  questComplete(o.catId === '_galaxy' ? 'galaxy' : o.catId === '_srs' ? 'srs' : 'mode:' + o.catId + ':' + o.mode, stars);
  bumpStreak(); save(); refreshUnlocks(true);
  showResult(stars, xp, o.correct, o.total, o.winText, o.catId || null);
}
function showResult(stars, xp, correct, total, winText, catId) {
  currentGame.catId = catId;
  sfx('win');
  const d = mountDragon($('#result-dragon')); setMood(d, stars >= 2 ? 'excited' : 'happy', false);
  ['s1', 's2', 's3'].forEach((c, idx) => $('.big-star.' + c).classList.toggle('on', idx < stars));
  $('#result-title').textContent = stars >= 3 ? 'Perfect! 🌟' : stars === 2 ? 'Well done! 🎉' : stars === 1 ? 'Good try! 💪' : 'Try again! 🔄';
  $('#result-xp').textContent = '+' + xp + ' XP  ·  ' + correct + '/' + total + ' correct';
  $('#result-msg').textContent = winText || pick(MANDO_DATA.phrases.win);
  $('#btn-again').onclick = () => currentGame.replay();
  showScreen('screen-result');
  if (stars >= 2) confetti();
}

/* ===========================================================================
   MODE 6 — Pattern Drill (Pola Kalimat)
   One sentence frame, one slot, five fillings. Sentence Builder can be beaten
   by remembering a word order; here the frame is handed over and only the slot
   moves, so what sticks is the frame — which then works on new words too.
   =========================================================================== */
// Least-practised pattern first, so every frame comes up without a menu.
function pickPattern() {
  const ps = MANDO_DATA.patterns, best = state.patterns || {};
  let low = 4;
  ps.forEach(p => { low = Math.min(low, best[p.id] || 0); });
  return pick(ps.filter(p => (best[p.id] || 0) === low));
}
function patternChoices(p) {
  if (p.choices) return p.choices.slice();
  const seen = [];
  p.drills.forEach(d => { const a = d.tokens[d.blank]; if (seen.indexOf(a) === -1) seen.push(a); });
  return seen;
}

function modePattern() {
  currentGame = { catId: null, replay: () => { showScreen('screen-game'); modePattern(); } };
  const p = pickPattern();
  const pool = patternChoices(p);
  const drills = sample(p.drills, Math.min(5, p.drills.length));
  let i = 0, correct = 0;

  function show() {
    if (i >= drills.length) { finishPattern(p, correct, drills.length); return; }
    const d = drills[i];
    const answer = d.tokens[d.blank];
    const opts = shuffle([answer].concat(sample(pool.filter(c => c !== answer), Math.min(3, pool.length - 1))));
    setDots(drills.length, i);
    $('#game-score').textContent = correct;

    const frame = d.tokens.map((t, idx) => idx === d.blank
      ? '<span class="pat-slot" id="pat-slot">?</span>'
      : '<span class="pat-tok">' + t + '</span>').join('');

    gameRender(
      '<div class="pat-head"><span class="pat-icon">' + p.icon + '</span>' +
        '<div><div class="pat-title">' + p.title + '</div>' +
        '<div class="pat-sub">' + p.en + '</div></div></div>' +
      (p.note ? '<div class="pat-note">💡 ' + p.note + '</div>' : '') +
      '<div class="pat-frame">' + frame + '</div>' +
      '<div class="pat-ask"><span class="pat-emoji">' + (d.emoji || '') + '</span>' + d.en + '</div>' +
      '<div class="options cols-2" id="pat-opts"></div>',
      'Fill in the blank! 🧩');

    const og = $('#pat-opts'); let answered = false;
    opts.forEach(o => {
      const c = el('div', 'opt', '<div class="opt-hz">' + o + '</div>');
      c.onclick = () => {
        if (answered) return; answered = true;
        const slot = $('#pat-slot');
        if (o === answer) {
          c.classList.add('correct'); correct++;
          if (slot) { slot.textContent = answer; slot.classList.add('filled'); }
          speak(d.tokens.join(''));
          sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct));
        } else {
          c.classList.add('wrong'); sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
          $$('#pat-opts .opt').forEach(x => { if (x.textContent.trim() === answer) x.classList.add('correct'); });
          if (slot) { slot.textContent = answer; slot.classList.add('filled', 'shown'); }
          speak(d.tokens.join(''));
        }
        $$('#pat-opts .opt').forEach(x => { if (x !== c && !x.classList.contains('correct')) x.classList.add('dim'); });
        // show the finished sentence so the frame is read as a whole, not as a gap
        $('.pat-ask').innerHTML = '<span class="pat-emoji">' + (d.emoji || '') + '</span>' +
          '<b>' + d.tokens.join('') + '</b> · ' + d.pinyin;
        setTimeout(() => { i++; show(); }, 1900);
      };
      og.appendChild(c);
    });
  }
  show();
}

function finishPattern(p, correct, total) {
  const stars = computeStars(correct, total);
  if (!state.patterns) state.patterns = {};
  if (stars > (state.patterns[p.id] || 0)) state.patterns[p.id] = stars;
  questComplete('pattern', stars);
  bumpStreak(); save();
  showResult(stars, correct * 15, correct, total, 'Pattern: ' + p.title + ' 🧩', null);
}

/* ===========================================================================
   MODE 7 — Write It! (recall, no options)
   Every other mode shows the answer somewhere: an option list, a grid, a set of
   tokens. Recognising is far easier than recalling, so he could hold 3 stars in
   a topic and still not produce one word unprompted. Here there is nothing to
   pick from — picture and meaning in, pinyin out. Tones are not required
   (typing ǎ on a phone is a keyboard problem, not a Mandarin one).
   =========================================================================== */
const normPinyin = window.MandoSpeech.normalizePinyin;
const pinyinFromNumbers = window.MandoSpeech.pinyinFromNumbers;
const compactToned = window.MandoSpeech.compactToned;
function pinyinHint(pinyin) {
  return String(pinyin).split(/\s+/).map(sy => sy.charAt(0) + '·'.repeat(Math.max(1, sy.length - 1))).join(' ');
}
// Only two words in the whole vocabulary use ü (绿色, 女孩), and nothing told
// the child that "v" is how you type it. Say so on exactly those questions
// rather than carrying the rule on every screen.
function recallTip(w) {
  return /[üǖǘǚǜ]/.test(w.pinyin)
    ? 'type <b>v</b> for ü, tone as a number: <b>lv4</b> → <b>lǜ</b>'
    : 'type the tone as a number: <b>hao3</b> → <b>hǎo</b>';
}

function modeRecall(catId) {
  currentGame = { catId, replay: () => { showScreen('screen-game'); modeRecall(catId); } };
  const cat = MANDO_DATA.getCategory(catId);
  const qs = sample(cat.words, Math.min(6, cat.words.length));
  let i = 0, correct = 0;

  function show() {
    if (i >= qs.length) { finishRound({ catId, mode: 'recall', correct, total: qs.length }); return; }
    const w = qs[i];
    setDots(qs.length, i);
    $('#game-score').textContent = correct;
    gameRender(
      '<div class="prompt-card"><div class="rc-emoji">' + (w.emoji || '❓') + '</div>' +
        '<div class="rc-en">' + w.en + '</div></div>' +
      '<div class="rc-box">' +
        '<input class="rc-input" id="rc-in" type="text" autocomplete="off" autocorrect="off" ' +
          'autocapitalize="none" spellcheck="false" placeholder="hao3">' +
        '<div class="rc-live" id="rc-live"><span class="rc-tip">' + recallTip(w) + '</span></div>' +
        '<div class="rc-row"><button class="btn ghost" id="rc-hint">💡 Hint</button>' +
        '<button class="btn" id="rc-go">Check ✓</button></div>' +
        '<div class="feedback-line" id="rc-fb"></div>' +
      '</div>',
      'Type it from memory! ✍️');

    const inp = $('#rc-in'), fb = $('#rc-fb');
    let answered = false;
    try { inp.focus(); } catch (e) {}

    const reveal = (ok, toneMiss) => {
      answered = true;
      inp.disabled = true; $('#rc-go').disabled = true; $('#rc-hint').disabled = true;
      recordWord(catId, w.hanzi, ok);
      if (ok) { correct++; sfx('correct'); reactGame('excited', pick(MANDO_DATA.phrases.correct)); confetti(); }
      else { sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong)); }
      fb.className = 'feedback-line ' + (ok ? 'good' : 'bad');
      fb.innerHTML = ok
        ? '✅ <b>' + w.hanzi + '</b> · ' + w.pinyin
        : (toneMiss
            ? '🎵 Right word, wrong tone — you wrote <b>' + toneMiss + '</b>, it is <b>' + w.pinyin + '</b>'
            : '❌ <b>' + w.hanzi + '</b> · ' + w.pinyin);
      speak(w.hanzi);
      setTimeout(() => { i++; show(); }, ok ? 1400 : 2400);   // longer on a miss, so he reads it
    };

    // Three outcomes, not two: a right word with the wrong tone is a different
    // mistake from a wrong word, and saying so is the whole point of asking for
    // tones at all.
    $('#rc-go').onclick = () => {
      if (answered) return;
      if (!normPinyin(inp.value)) { toast('Type the pinyin first ✍️'); return; }
      const typed = pinyinFromNumbers(inp.value);
      const lettersOk = normPinyin(typed) === normPinyin(w.pinyin);
      const toneOk = compactToned(typed) === compactToned(w.pinyin);
      reveal(toneOk, lettersOk && !toneOk ? typed : null);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('#rc-go').click(); });
    inp.addEventListener('input', () => {
      const live = $('#rc-live');
      const shown = pinyinFromNumbers(inp.value);
      live.innerHTML = shown
        ? '<span class="rc-shown">' + shown + '</span>'
        : '<span class="rc-tip">' + recallTip(w) + '</span>';
    });
    $('#rc-hint').onclick = () => {
      if (answered) return;
      fb.className = 'feedback-line';
      fb.textContent = '💡 ' + pinyinHint(w.pinyin);
    };
  }
  show();
}

/* ===========================================================================
   TONE TRAINER — the gap 327 words could not fill
   Mandarin is tonal: 九 jiǔ is nine and 旧 jiù is old, same sound, different
   word. Nothing in the app tested this — Write It! even accepts pinyin without
   tone marks, because typing ǎ on a phone is a keyboard problem. So tones had
   to get their own drill. Two kinds of question, both from existing audio:
   hear a syllable and name its tone, or hear one of a real minimal pair and say
   which word it was.
   =========================================================================== */
const TONE_MARKS = { 1: 'āēīōūǖ', 2: 'áéíóúǘ', 3: 'ǎěǐǒǔǚ', 4: 'àèìòùǜ' };
const TONE_INFO = {
  1: { sign: 'ˉ', sample: 'mā', name: 'Flat & high' },
  2: { sign: 'ˊ', sample: 'má', name: 'Rising' },
  3: { sign: 'ˇ', sample: 'mǎ', name: 'Dips down' },
  4: { sign: 'ˋ', sample: 'mà', name: 'Falling' }
};
function syllableTone(sy) {
  for (const t of [1, 2, 3, 4]) {
    for (const ch of String(sy)) if (TONE_MARKS[t].indexOf(ch) !== -1) return t;
  }
  return 0;                                  // neutral / unmarked
}
function openWords() {
  const out = [];
  MANDO_DATA.categories.forEach((c, i) => { if (isUnlocked(i)) c.words.forEach(w => out.push(w)); });
  return out;
}
// Real confusables already sitting in the vocabulary: same syllables, different
// tones, different meaning. Built from the data, not hand-listed, so new topics
// contribute automatically.
function minimalPairs() {
  const g = {}, out = [];
  openWords().forEach(w => {
    const k = normPinyin(w.pinyin);
    (g[k] = g[k] || []).push(w);
  });
  Object.keys(g).forEach(k => {
    const uniq = [];
    // a usable pair must differ in all three: tone, character and meaning.
    // Several words appear in two topics (书 in School and Classroom) and some
    // share an English gloss (星星/星形 are both "Star") — neither is a real test.
    g[k].forEach(w => {
      if (!uniq.some(u => u.pinyin === w.pinyin || u.hanzi === w.hanzi || u.en === w.en)) uniq.push(w);
    });
    if (uniq.length >= 2) out.push(uniq.slice(0, 2));
  });
  return out;
}

function modeTones() {
  currentGame = { catId: null, replay: () => { showScreen('screen-game'); modeTones(); } };
  const singles = openWords().filter(w => w.pinyin.trim().split(/\s+/).length === 1 && syllableTone(w.pinyin));
  const pairs = minimalPairs();
  const qs = [];
  sample(singles, Math.min(4, singles.length)).forEach(w => qs.push({ kind: 'id', w }));
  sample(pairs, Math.min(2, pairs.length)).forEach(p => qs.push({ kind: 'pair', pair: shuffle(p) }));
  const list = shuffle(qs);
  // A brand-new player has one topic open and almost nothing to drill; finishing
  // a zero-question round would hand out a 0-star result for no reason.
  if (list.length < 2) { toast('🎵 Open a few more topics first!'); goHome(); return; }
  let i = 0, correct = 0;

  function show() {
    if (i >= list.length) { finishTones(correct, list.length); return; }
    const q = list[i];
    setDots(list.length, i);
    $('#game-score').textContent = correct;

    if (q.kind === 'id') {
      const w = q.w, ans = syllableTone(w.pinyin);
      gameRender(
        '<div class="prompt-card"><div class="tn-hanzi">' + w.hanzi + '</div>' +
          '<button class="btn lg" id="tn-play" style="margin-top:10px">🔊 Listen</button></div>' +
        '<div class="tn-ask">Which tone is it?</div>' +
        '<div class="options cols-2" id="tn-opts"></div>',
        'Listen to the pitch! 🎵');
      const og = $('#tn-opts'); let done = false;
      [1, 2, 3, 4].forEach(t => {
        const info = TONE_INFO[t];
        const c = el('div', 'opt tn-opt',
          '<div class="tn-sign">' + info.sign + '</div><div class="tn-num">Tone ' + t + '</div>' +
          '<div class="tn-name">' + info.name + ' · ' + info.sample + '</div>');
        c.onclick = () => {
          if (done) return; done = true;
          const ok = t === ans;
          if (ok) { c.classList.add('correct'); correct++; sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); }
          else {
            c.classList.add('wrong'); sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
            $$('#tn-opts .opt').forEach((x, idx) => { if (idx + 1 === ans) x.classList.add('correct'); });
          }
          recordWord(null, w.hanzi, ok);
          $('.tn-ask').innerHTML = (ok ? '✅ ' : '❌ ') + '<b>' + w.hanzi + '</b> · ' + w.pinyin + ' · ' + w.en;
          speak(w.hanzi);
          setTimeout(() => { i++; show(); }, ok ? 1500 : 2400);
        };
        og.appendChild(c);
      });
      $('#tn-play').onclick = () => speak(w.hanzi);
      speak(w.hanzi);

    } else {
      const [a, b] = q.pair, target = pick(q.pair);
      gameRender(
        '<div class="prompt-card"><div style="font-size:60px">👂</div>' +
          '<button class="btn lg" id="tn-play" style="margin-top:8px">🔊 Listen</button></div>' +
        '<div class="tn-ask">Same sound, different tone — which one?</div>' +
        '<div class="options cols-2" id="tn-opts"></div>',
        'Tones change the word! 🎵');
      const og = $('#tn-opts'); let done = false;
      [a, b].forEach(w => {
        const c = el('div', 'opt tn-opt',
          '<div class="tn-hz">' + w.hanzi + '</div><div class="tn-py">' + w.pinyin + '</div>' +
          '<div class="tn-name">' + w.en + '</div>');
        c.onclick = () => {
          if (done) return; done = true;
          const ok = w.hanzi === target.hanzi;
          if (ok) { c.classList.add('correct'); correct++; sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); }
          else {
            c.classList.add('wrong'); sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
            $$('#tn-opts .opt').forEach(x => { if (x.textContent.indexOf(target.hanzi) === 0) x.classList.add('correct'); });
          }
          recordWord(null, target.hanzi, ok);
          $('.tn-ask').innerHTML = (ok ? '✅ ' : '❌ ') + 'It was <b>' + target.hanzi + '</b> · ' + target.pinyin + ' · ' + target.en;
          speak(target.hanzi);
          setTimeout(() => { i++; show(); }, ok ? 1500 : 2600);
        };
        og.appendChild(c);
      });
      $('#tn-play').onclick = () => speak(target.hanzi);
      speak(target.hanzi);
    }
  }
  show();
}
function finishTones(correct, total) {
  const stars = computeStars(correct, total);
  if (!state.tones) state.tones = { best: 0 };
  state.tones.best = Math.max(state.tones.best || 0, stars);
  questComplete('tones', stars);
  bumpStreak(); save();
  showResult(stars, correct * 15, correct, total, 'Tone Master! 🎵', null);
}

/* ===========================================================================
   LISTEN TO SENTENCES — comprehension, not just word recognition
   Listen & Choose only ever sampled cat.words, so listening stopped at single
   words even though all 68 sentences already have their own recorded clip.
   =========================================================================== */
function modeHearSentence() {
  currentGame = { catId: null, replay: () => { showScreen('screen-game'); modeHearSentence(); } };
  const qs = sample(MANDO_DATA.sentences, Math.min(5, MANDO_DATA.sentences.length));
  let i = 0, correct = 0;

  function show() {
    if (i >= qs.length) { finishHear(correct, qs.length); return; }
    const s = qs[i];
    const opts = shuffle([s].concat(sample(MANDO_DATA.sentences.filter(x => x.en !== s.en), 3)));
    setDots(qs.length, i);
    $('#game-score').textContent = correct;
    gameRender(
      '<div class="prompt-card"><div style="font-size:60px">👂</div>' +
        '<button class="btn lg" id="hs-play" style="margin-top:8px">🔊 Listen</button></div>' +
      '<div class="tn-ask">What did you hear?</div>' +
      '<div class="options" id="hs-opts"></div>',
      'Listen to the whole sentence! 👂');

    const og = $('#hs-opts'); let done = false;
    opts.forEach(o => {
      const c = el('div', 'opt hs-opt', o.en);
      c.onclick = () => {
        if (done) return; done = true;
        const ok = o.en === s.en;
        if (ok) { c.classList.add('correct'); correct++; sfx('correct'); reactGame('happy', pick(MANDO_DATA.phrases.correct)); }
        else {
          c.classList.add('wrong'); sfx('wrong'); reactGame('sad', pick(MANDO_DATA.phrases.wrong));
          $$('#hs-opts .opt').forEach(x => { if (x.textContent === s.en) x.classList.add('correct'); });
        }
        $('.tn-ask').innerHTML = '<b>' + s.tokens.join('') + '</b> · ' + s.pinyin;
        speak(s.tokens.join(''));
        setTimeout(() => { i++; show(); }, ok ? 1600 : 2600);
      };
      og.appendChild(c);
    });
    $('#hs-play').onclick = () => speak(s.tokens.join(''));
    speak(s.tokens.join(''));
  }
  show();
}
function finishHear(correct, total) {
  const stars = computeStars(correct, total);
  if (!state.hear) state.hear = { best: 0 };
  state.hear.best = Math.max(state.hear.best || 0, stars);
  questComplete('hear', stars);
  bumpStreak(); save();
  showResult(stars, correct * 15, correct, total, 'Good ears! 👂', null);
}

/* ===========================================================================
   Daily Quest — three jobs a day, drawn from what Matthew has actually reached
   Free play lets him replay the same easy topic forever and never meet old
   vocabulary again. The quest forces the spread: one topic he already beat (so
   it gets retrieved instead of fading), the topic he is working on now, and one
   speaking/building round. Seeded by the date, so the list is identical all day
   and new tomorrow — closing the app cannot reroll it into something easier.
   =========================================================================== */
function questSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function questRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const QUEST_EXTRAS = {
  pattern:  { icon: '🗣️', title: 'Pattern Drill',    sub: 'Learn a sentence frame' },
  sentence: { icon: '🧩', title: 'Sentence Builder', sub: 'Put the words in order' },
  galaxy:   { icon: '🌌', title: 'Galaxy Mix',       sub: 'Words from every topic' },
  tones:    { icon: '🎵', title: 'Tone Trainer',     sub: 'Hear the pitch' },
  hear:     { icon: '👂', title: 'Listen & Understand', sub: 'Whole sentences' }
};
// Weakest mode first — the gap closes where the stars are thinnest. Ties are
// the normal case (a fresh topic scores 0 everywhere, a strong one scores 3
// everywhere), and breaking them by list order handed every slot to the first
// mode, so the whole day became one game played three times. The day's seed
// breaks ties instead: still identical all day, different tomorrow.
function weakestModes(catId, rnd) {
  return MODES.map(m => ({ m, s: getBest(catId, m.key), j: rnd() }))
    .sort((a, b) => a.s - b.s || a.j - b.j)
    .map(x => x.m);
}
// MODES is ordered easiest-first: Match shows the answer on screen, Write It!
// asks him to produce it from memory with nothing to look at.
//
// Aiming the weakest mode at the weakest topic looked right on paper and was the
// single worst thing in the first version: a topic he had never opened came back
// as "Write It!", because a mode he has never played scores zero. Brand-new
// vocabulary plus the hardest possible game is not a challenge, it is a wall.
// Games now unlock as the topic itself gets learned.
// Each game opens the next one: clear this game with 2 stars and the following
// one appears. Gating on mastery instead would deadlock — the top mastery band
// needs a full star row, a full star row needs Write It!, and Write It! was in
// the top band. This rule cannot lock itself, and it is a promise a child can
// act on: win this, unlock that.
function modesAllowed(catId) {
  return MODES.slice(0, modesOpen(MODES.map(m => getBest(catId, m.key)), 2));
}
// Every unlocked topic that still owes work, hardest-first. `needsWork` already
// keeps a mastered topic in the list while any of its words are slipping, so
// this is the single place that decides what the day is allowed to ask for.
function topicsNeedingWork() {
  return MANDO_DATA.categories
    .filter((_, i) => isUnlocked(i))
    .filter(c => needsWork(c.id))
    .map(c => ({ cat: c, m: masteryIndex(c.id), weak: weakWordsIn(c.id).length }))
    .sort((a, b) => a.m - b.m || b.weak - a.weak);
}
function buildQuest() {
  const today = todayStr();
  if (state.quest && state.quest.date === today) return state.quest;

  const rnd = questRng(questSeed(today));
  const one = a => a[Math.floor(rnd() * a.length)];
  const rank = playerRank();
  const unlocked = MANDO_DATA.categories.filter((_, i) => isUnlocked(i));
  const weakTopics = topicsNeedingWork();
  const tasks = [];
  const add = t => { if (!tasks.some(x => x.key === t.key)) tasks.push(t); };

  // 1 — a win first. The previous version opened with the three topics he was
  // worst at, so the day began with three things he could not do and he quit on
  // it. An easy round on something he already owns costs one slot and changes
  // the mood of everything after it.
  const owned = MANDO_DATA.categories
    .filter((_, i) => isUnlocked(i))
    .filter(c => masteryIndex(c.id) >= 2);
  if (owned.length) {
    const wc = one(owned);
    const wm = one(modesAllowed(wc.id));
    add({ key: 'mode:' + wc.id + ':' + wm.key, icon: '☀️', title: 'Warm-up: ' + wc.name, sub: wm.name });
  }

  // 2 — words actually slipping. The schedule knows which ones are about to go,
  // so it outranks any topic-level guess.
  const due = dueWords();
  if (due.length >= 6 && tasks.length < rank.jobs) {
    add({ key: 'srs', icon: '🧠', title: 'Memory Check', sub: due.length + ' words due today' });
  }

  // 3 — the unmastered topics, weakest first. A topic he has not opened gets the
  // study screen rather than a quiz; one he has met gets a game, but only from
  // the set its mastery has unlocked.
  const usedModes = [];
  weakTopics.forEach(t => {
    if (tasks.length >= rank.jobs) return;
    if (t.m === 0) {
      add({ key: 'study:' + t.cat.id, icon: '📖', title: 'Learn: ' + t.cat.name, sub: 'See the new words first' });
      // Pair it with the easiest game on the same words. Studying then playing
      // what he just read is the point; leaving the slot to a generic extra sent
      // a first-day player straight into whole-sentence listening.
      if (tasks.length < rank.jobs) {
        const first = modesAllowed(t.cat.id)[0];
        add({ key: 'mode:' + t.cat.id + ':' + first.key, icon: '🎮', title: 'Try it: ' + t.cat.name, sub: first.name });
        usedModes.push(first.key);
      }
      return;
    }
    const allowed = modesAllowed(t.cat.id);
    const ranked = weakestModes(t.cat.id, rnd).filter(m => allowed.some(a => a.key === m.key));
    // Prefer a game he has not already been given today. Only when every allowed
    // mode is spoken for does a repeat become acceptable.
    const mo = ranked.find(m => usedModes.indexOf(m.key) === -1) || ranked[0] || allowed[0];
    usedModes.push(mo.key);
    add({
      key: 'mode:' + t.cat.id + ':' + mo.key,
      icon: MASTERY[t.m].badge,
      title: (t.m >= 3 ? 'Polish: ' : 'Practice: ') + t.cat.name,
      sub: mo.name + (t.weak ? ' · ' + t.weak + ' words to fix' : '')
    });
  });

  // 3 — producing rounds, not just recognition. These only fill slots the weak
  // topics did not need, so on a day with plenty to fix they never appear; when
  // everything is mastered they are what keeps the day from being empty.
  // Whole-sentence listening and sentence frames assume vocabulary a beginner
  // does not have yet, so they wait until a few topics are actually open.
  const extras = ['tones', 'sentence']
    .concat(unlocked.length >= 3 ? ['galaxy'] : [])
    .concat(unlocked.length >= 4 ? ['hear', 'pattern'] : []);
  while (tasks.length < rank.jobs) {
    const left = extras.filter(k => !tasks.some(x => x.key === k));
    if (!left.length) break;
    const k = one(left);
    add(Object.assign({ key: k }, QUEST_EXTRAS[k]));
  }

  state.quest = { date: today, tasks, done: [], need: rank.need };
  save();
  return state.quest;
}
// A task only counts when the round is actually passed (>= 1 star), so the
// quest cannot be cleared by losing three times.
function questComplete(key, stars) {
  const q = state.quest;
  if (!q || q.date !== todayStr()) return;
  if (!q.done) q.done = [];
  if (!q.tasks.some(t => t.key === key) || q.done.indexOf(key) !== -1) return;
  // The pass mark rises with rank. At first finishing the round is the job; later
  // the job is playing it well, so the same quest keeps asking for more.
  const need = q.need || 1;
  if (stars < need) {
    toast('⭐'.repeat(need) + ' needed for the quest — you got ' + stars + '. Try again!');
    return;
  }
  q.done.push(key);
  save();
  if (q.done.length === q.tasks.length) { sfx('unlock'); toast('🏆 Daily Quest complete! Amazing, Matthew!'); }
  else toast('✅ Quest ' + q.done.length + '/' + q.tasks.length + ' done!');
}
function runQuestTask(key) {
  if (key === 'pattern')  { showScreen('screen-game'); modePattern(); return; }
  if (key === 'sentence') { showScreen('screen-game'); modeSentence(); return; }
  if (key === 'galaxy')   { launchGalaxy(); return; }
  if (key === 'srs')      { launchSrs(); return; }
  if (key === 'tones')    { showScreen('screen-game'); modeTones(); return; }
  if (key === 'hear')     { showScreen('screen-game'); modeHearSentence(); return; }
  const p = key.split(':');
  if (p[0] === 'study')   { showScreen('screen-game'); modeStudy(p[1]); return; }
  launch(p[2], p[1]);
}
function renderQuest() {
  const host = $('#quest-card');
  if (!host) return;
  const q = buildQuest(), done = q.done || [];
  const all = done.length === q.tasks.length;
  const need = q.need || 1;
  host.className = 'quest-card' + (all ? ' all-done' : '');
  host.innerHTML =
    '<div class="q-head"><span class="q-emoji">' + (all ? '🏆' : '📅') + '</span>' +
      '<div><div class="q-title">' + (all ? 'All done today!' : "Today's Quest") + '</div>' +
      '<div class="q-sub">' + done.length + ' of ' + q.tasks.length + ' finished · needs ' +
        '⭐'.repeat(need) + ' each</div></div></div>' +
    '<div class="q-list">' + q.tasks.map(t => {
      const ok = done.indexOf(t.key) !== -1;
      return '<div class="q-task' + (ok ? ' ok' : '') + '" data-qkey="' + t.key + '">' +
        '<span class="q-check">' + (ok ? '✅' : t.icon) + '</span>' +
        '<div class="q-text"><div class="q-name">' + t.title + '</div>' +
        '<div class="q-mode">' + t.sub + '</div></div>' +
        '<span class="spacer"></span><span class="q-go">' + (ok ? '' : '➜') + '</span></div>';
    }).join('') + '</div>';
  $$('#quest-card .q-task').forEach(node => {
    if (node.classList.contains('ok')) return;
    node.onclick = () => runQuestTask(node.dataset.qkey);
  });
}

/* ===========================================================================
   PROGRESS — for the parent, not the player
   The app knew exactly which words Matthew keeps missing and never showed any
   of it, so the only way to find out was to ask someone to read the save file.
   Everything here comes from data already stored; nothing new is tracked.
   =========================================================================== */
function renderStats() {
  const cats = MANDO_DATA.categories;
  const open = cats.filter((_, i) => isUnlocked(i));
  const beaten = open.filter(c => categoryStars(c.id) >= starsToUnlock());
  const srs = state.srs || {};
  const met = Object.keys(srs).length;
  const due = dueWords().length;
  const solid = Object.keys(srs).filter(h => (srs[h].n || 0) >= 4).length;

  // Current weak words only; a later correct answer removes stale old misses.
  const weak = weakSrsEntries(srs)
    .slice(0, 10)
    .map(x => {
      const w = MANDO_DATA.allWords.find(v => v.hanzi === x.hanzi);
      return Object.assign(x, { pinyin: w ? w.pinyin : '', en: w ? w.en : '', emoji: w ? w.emoji : '' });
    });

  const card = (big, label) =>
    '<div class="st-cell"><div class="st-big">' + big + '</div><div class="st-lbl">' + label + '</div></div>';

  $('#stats-body').innerHTML =
    // Top of the screen, not buried mid-page: the only job of this line is to
    // answer "is this phone actually on the new build?" at a glance.
    '<div class="st-build">📱 MandoQuest <b>' + APP_BUILD + '</b></div>' +
    '<div class="st-grid">' +
      card(state.streak.count || 0, 'day streak 🔥') +
      card(totalStars(), 'stars ⭐') +
      card(beaten.length + '/' + cats.length, 'topics mastered') +
      card(met, 'words met') +
      card(solid, 'words solid 💪') +
      card(due, 'due to review 🧠') +
    '</div>' +

    '<h3 class="st-h">Words needing practice</h3>' +
    (weak.length
      ? '<div class="st-weak">' + weak.map(x =>
          '<div class="st-word"><span class="st-emoji">' + (x.emoji || '📝') + '</span>' +
          '<div><div class="st-hz">' + x.hanzi + ' <span class="st-py">' + x.pinyin + '</span></div>' +
          '<div class="st-en">' + x.en + '</div></div>' +
          '<span class="spacer"></span><span class="st-miss">' + x.miss + '×</span></div>').join('') +
        '</div>'
      : '<div class="st-empty">Nothing missed yet — either he is flying, or he has not played enough for this to mean anything.</div>') +

    '<h3 class="st-h">Every topic</h3>' +
    '<div class="st-topics">' + cats.map((c, i) => {
      const s = categoryStars(c.id), pct = Math.round(s / maxStars() * 100);
      const lock = !isUnlocked(i);
      return '<div class="st-topic' + (lock ? ' locked' : '') + '">' +
        '<span class="st-ic">' + (lock ? '🔒' : c.icon) + '</span>' +
        '<div class="st-tn">' + c.name + '</div>' +
        '<div class="st-bar"><div class="st-fill" style="width:' + pct + '%;background:' + c.color + '"></div></div>' +
        '<span class="st-num">' + s + '/' + maxStars() + '</span></div>';
    }).join('') + '</div>';
}
function goStats() { renderStats(); showScreen('screen-stats'); }

/* ── Init ────────────────────────────────────────────────────────────── */
function init() {
  load();
  migrateUnlocks();
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nav]');
    if (n) { e.preventDefault(); handleNav(n.dataset.nav); }
  });
  $('#sentence-tile').onclick = () => { showScreen('screen-game'); modeSentence(); };
  const patTile = $('#pattern-tile');
  if (patTile) patTile.onclick = () => { showScreen('screen-game'); modePattern(); };
  const toneTile = $('#tone-tile');
  if (toneTile) toneTile.onclick = () => { showScreen('screen-game'); modeTones(); };
  const hearTile = $('#hear-tile');
  if (hearTile) hearTile.onclick = () => { showScreen('screen-game'); modeHearSentence(); };
  const statsBtn = $('#stats-btn');
  if (statsBtn) statsBtn.onclick = goStats;

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
