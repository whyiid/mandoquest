'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  createTapCooldown,
  createSingleUseGuard,
  matchesSpeech,
  normalizeHanzi,
  normalizePinyin
} = require('../speech.js');

const RED = { hanzi: '红色', pinyin: 'hóng sè' };
const HELLO = { hanzi: '你好', pinyin: 'nǐ hǎo' };

test('accepts an exact Hanzi transcript after punctuation normalization', () => {
  assert.equal(matchesSpeech(['红色。'], RED), true);
});

test('accepts exact pinyin with or without tone marks and spaces', () => {
  assert.equal(matchesSpeech(['hóng sè'], RED), true);
  assert.equal(matchesSpeech(['hong se'], RED), true);
});

test('rejects a different color that only shares the 色 suffix', () => {
  assert.equal(matchesSpeech(['蓝色'], RED), false);
});

test('rejects every different Hanzi word in the full learning catalogue', () => {
  const context = {};
  const dataSource = fs.readFileSync(path.resolve(__dirname, '../data.js'), 'utf8');
  vm.runInNewContext(dataSource + ';globalThis.data = MANDO_DATA;', context);
  const words = context.data.categories.flatMap(category => category.words);

  for (const target of words) {
    for (const spoken of words) {
      if (spoken.hanzi === target.hanzi) continue;
      assert.equal(
        matchesSpeech([spoken.hanzi], target),
        false,
        `${spoken.hanzi} must not pass for ${target.hanzi}`
      );
    }
  }
});

test('rejects partial Hanzi and partial pinyin', () => {
  assert.equal(matchesSpeech(['你'], HELLO), false);
  assert.equal(matchesSpeech(['好'], HELLO), false);
  assert.equal(matchesSpeech(['ni'], HELLO), false);
});

test('checks every recognition alternative for an exact match', () => {
  assert.equal(matchesSpeech(['蓝色', '红色'], RED), true);
});

test('rejects missing alternatives or target data', () => {
  assert.equal(matchesSpeech(null, RED), false);
  assert.equal(matchesSpeech([], null), false);
  assert.equal(matchesSpeech([''], { hanzi: '', pinyin: '' }), false);
});

test('normalizes supported spoken digits without changing unrelated text', () => {
  assert.equal(normalizeHanzi('10'), '十');
  assert.equal(normalizeHanzi('100'), '百');
  assert.equal(normalizeHanzi('红色'), '红色');
});

test('normalizes tone-marked pinyin consistently', () => {
  assert.equal(normalizePinyin('Nǐ HǎO'), 'nihao');
});

test('treats v as phone-friendly ü but does not accept plain u', () => {
  assert.equal(normalizePinyin('lǜ sè'), 'lvse');
  assert.equal(normalizePinyin('lv se'), 'lvse');
  assert.notEqual(normalizePinyin('lu se'), normalizePinyin('lǜ sè'));
  assert.equal(normalizePinyin('nǚ hái'), normalizePinyin('nv hai'));
});

test('single-use guard permits only one completion', () => {
  const guard = createSingleUseGuard();
  let completions = 0;

  assert.equal(guard.run(() => { completions++; }), true);
  assert.equal(guard.run(() => { completions++; }), false);
  assert.equal(completions, 1);
  assert.equal(guard.isOpen(), false);
});

test('cancelled guard ignores stale recognition callbacks', () => {
  const guard = createSingleUseGuard();
  let completed = false;

  guard.cancel();

  assert.equal(guard.run(() => { completed = true; }), false);
  assert.equal(completed, false);
});

test('single-use guard can close without an action callback', () => {
  const guard = createSingleUseGuard();

  assert.equal(guard.run(), true);
  assert.equal(guard.isOpen(), false);
});

test('tap cooldown blocks a second tap even after the question rerenders', () => {
  let now = 1000;
  const cooldown = createTapCooldown(450, () => now);
  let advances = 0;

  assert.equal(cooldown.run(() => { advances++; }), true);
  now = 1200;
  assert.equal(cooldown.run(() => { advances++; }), false);
  now = 1450;
  assert.equal(cooldown.run(() => { advances++; }), true);
  assert.equal(advances, 2);
});
