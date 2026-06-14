#!/usr/bin/env node
/* ===========================================================================
   MandoQuest — audio pack generator
   ---------------------------------------------------------------------------
   Builds a clear, native-speaker audio clip for every word & sentence in
   data.js, so the app plays a real recording instead of the device's
   (often unclear) built-in text-to-speech voice.

   VOICE = Mainland Mandarin (普通话, zh-CN). This matches:
     • the app's text, which is written in SIMPLIFIED characters, and
     • Matthew's curriculum direction (HSK = Mainland standard).
   (Ting-Ting is a Taiwan 國語 / Apple-only voice — kept only as an option.)

   The app (speak() in app.js) falls back to the Web Speech API at runtime if
   a clip is ever missing, so this pack is a drop-in upgrade — never required.

   Run:  node tools/gen-audio.js
   Output: audio/<id>.{mp3,m4a}  +  audio/manifest.js  (window.MANDO_AUDIO map)

   Source modes (env MQ_SOURCE):
     'google'   (default) — Google Translate TTS MP3, Mainland 普通话 (neural).
     'youdao'             — Youdao dictionary MP3, also Mainland.
     'tingting'           — macOS "Tingting" → .m4a, Taiwan 國語 (offline only).
   =========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const SOURCE = (process.env.MQ_SOURCE || 'google').toLowerCase();

// endpoints
const GOOGLE = (s) => 'https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=' + encodeURIComponent(s);
const YOUDAO = (s) => 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(s) + '&type=2';
const VOICE = 'Tingting';   // macOS zh voice (Taiwan) — only for MQ_SOURCE=tingting
const RATE = '150';         // words-per-minute; gentle pace for a child

/* ── load data.js (browser global) into Node ─────────────────────────────── */
const dataSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const MANDO_DATA = new Function(dataSrc + '\n;return MANDO_DATA;')();

/* ── collect every string the app will ever speak ────────────────────────── */
const strings = [];
const seen = new Set();
const add = (s) => { if (s && !seen.has(s)) { seen.add(s); strings.push(s); } };
MANDO_DATA.categories.forEach(c => c.words.forEach(w => add(w.hanzi)));
(MANDO_DATA.sentences || []).forEach(s => add(s.tokens.join('')));

/* ── helpers ─────────────────────────────────────────────────────────────── */
// synchronous sleep (no subprocess) — throttles network calls to dodge rate-limits
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

function isValidMp3(file) {
  let b;
  try { b = fs.readFileSync(file); } catch (e) { return false; }
  if (b.length < 800) return false;
  const id3 = b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33;            // "ID3"
  const sync = b[0] === 0xFF && (b[1] & 0xE0) === 0xE0;                   // MPEG frame sync
  return id3 || sync;
}
// curl an MP3 endpoint with retries + backoff; validate the result
function fetchMp3(url, outFile) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      execFileSync('curl', ['-fsSL', '--max-time', '20', '-A', 'Mozilla/5.0', url, '-o', outFile], { stdio: 'ignore' });
      if (isValidMp3(outFile)) return true;
    } catch (e) { /* retry */ }
    sleep(600 + attempt * 600);                                          // 0.6s, 1.2s, 1.8s backoff
  }
  try { fs.existsSync(outFile) && fs.unlinkSync(outFile); } catch (e) {}
  return false;
}
function sayTingting(s, outFile) {
  execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', outFile, s], { stdio: 'ignore' });
  return fs.existsSync(outFile) && fs.statSync(outFile).size > 0;
}

/* ── clean + regenerate ──────────────────────────────────────────────────── */
fs.mkdirSync(AUDIO_DIR, { recursive: true });
for (const f of fs.readdirSync(AUDIO_DIR)) {
  if (/\.(mp3|m4a)$/i.test(f)) fs.unlinkSync(path.join(AUDIO_DIR, f));
}

const map = {};
const tally = { google: 0, youdao: 0, tingting: 0, failed: 0 };
const failedStrings = [];
strings.forEach((s, i) => {
  const id = String(i + 1).padStart(4, '0');
  let rel = null;

  if (SOURCE === 'tingting') {
    if (sayTingting(s, path.join(AUDIO_DIR, id + '.m4a'))) { rel = 'audio/' + id + '.m4a'; tally.tingting++; }
  } else if (SOURCE === 'youdao') {
    if (fetchMp3(YOUDAO(s), path.join(AUDIO_DIR, id + '.mp3'))) { rel = 'audio/' + id + '.mp3'; tally.youdao++; }
  } else { // 'google' (default)
    if (fetchMp3(GOOGLE(s), path.join(AUDIO_DIR, id + '.mp3'))) { rel = 'audio/' + id + '.mp3'; tally.google++; }
    sleep(250);                                                          // be gentle to the endpoint
  }

  if (rel) { map[s] = rel; } else { tally.failed++; failedStrings.push(s); }
  process.stdout.write(`\r[${i + 1}/${strings.length}] ${s}            `);
});
process.stdout.write('\n');

/* ── write the manifest the app reads ────────────────────────────────────── */
const header = '/* Auto-generated by tools/gen-audio.js — do not edit by hand. */\n';
fs.writeFileSync(
  path.join(AUDIO_DIR, 'manifest.js'),
  header + 'window.MANDO_AUDIO = ' + JSON.stringify(map) + ';\n'
);

console.log(`Done [source=${SOURCE}]. ${Object.keys(map).length}/${strings.length} clips ` +
  `(google: ${tally.google}, youdao: ${tally.youdao}, tingting: ${tally.tingting}, failed: ${tally.failed}).`);
if (failedStrings.length) {
  console.log('Failed (will use Web Speech fallback at runtime): ' + failedStrings.join(' '));
}
