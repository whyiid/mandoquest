'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { updateSrsEntry, weakSrsEntries, isWeakWord, masteryFor, rankFor, modesOpen } = require('../learning.js');

const steps = [1, 2, 4, 8, 16, 32];
const addDays = (date, days) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

test('multiple correct answers on one day advance the SRS interval only once', () => {
  const first = updateSrsEntry(null, true, '2026-09-13', steps, addDays);
  const sixth = Array.from({ length: 5 }).reduce(
    entry => updateSrsEntry(entry, true, '2026-09-13', steps, addDays),
    first
  );

  assert.equal(sixth.n, 1);
  assert.equal(sixth.due, '2026-09-14');
  assert.equal(sixth.lastSuccess, '2026-09-13');
});

test('a correct review on a later day advances to the next interval', () => {
  const first = updateSrsEntry(null, true, '2026-09-13', steps, addDays);
  const next = updateSrsEntry(first, true, '2026-09-14', steps, addDays);

  assert.equal(next.n, 2);
  assert.equal(next.due, '2026-09-16');
});

test('a miss resets the interval and records both current and lifetime misses', () => {
  const learned = updateSrsEntry(null, true, '2026-09-13', steps, addDays);
  const missed = updateSrsEntry(learned, false, '2026-09-14', steps, addDays);

  assert.equal(missed.n, 0);
  assert.equal(missed.due, '2026-09-15');
  assert.equal(missed.miss, 1);
  assert.equal(missed.lapses, 1);
  assert.equal(missed.lastOk, false);
});

test('a later success clears current weakness but preserves lifetime misses', () => {
  const oldSave = { n: 0, due: '2026-09-13', miss: 4 };
  const recovered = updateSrsEntry(oldSave, true, '2026-09-14', steps, addDays);

  assert.equal(recovered.miss, 0);
  assert.equal(recovered.lapses, 4);
  assert.equal(recovered.lastOk, true);
});

test('parent weak list excludes words whose latest result was correct', () => {
  const entries = weakSrsEntries({
    '你好': { miss: 7, lapses: 7, lastOk: true, n: 2 },
    '谢谢': { miss: 2, lapses: 5, lastOk: false, n: 0 },
    '再见': { miss: 1, lapses: 1, lastOk: false, n: 0 }
  });

  assert.deepEqual(entries.map(x => x.hanzi), ['谢谢', '再见']);
});

/* ── mastery: what the daily quest is allowed to skip ──────────────────── */

test('a word is weak until the schedule has carried it past one success', () => {
  assert.equal(isWeakWord(undefined), true, 'never seen');
  assert.equal(isWeakWord({ n: 3, miss: 1, lastOk: true }), true, 'recently missed');
  assert.equal(isWeakWord({ n: 3, miss: 0, lastOk: false }), true, 'last answer wrong');
  assert.equal(isWeakWord({ n: 1, miss: 0, lastOk: true }), true, 'only one success deep');
  assert.equal(isWeakWord({ n: 2, miss: 0, lastOk: true }), false, 'proven');
});

test('full stars do not count as mastered while the words are still shaky', () => {
  // The whole point of two signals: he can play the topic well, but half its
  // words keep getting missed, so the quest must keep drilling it.
  assert.equal(masteryFor(15, 15, 5, 10), 2);
  assert.equal(masteryFor(15, 15, 0, 10), 4);
});

test('an untouched topic is "not started", not "learning"', () => {
  assert.equal(masteryFor(0, 15, 10, 10), 0);
});

test('mastery rises as both stars and remembered words rise', () => {
  assert.equal(masteryFor(3, 15, 9, 10), 1);
  assert.equal(masteryFor(7, 15, 5, 10), 2);
  assert.equal(masteryFor(12, 15, 2, 10), 3);
  assert.equal(masteryFor(15, 15, 1, 10), 4);
});

test('rank is the highest threshold passed, and never falls off either end', () => {
  const ranks = [{ min: 0, name: 'Egg' }, { min: 40, name: 'Hatchling' }, { min: 100, name: 'Dragon' }];

  assert.equal(rankFor(0, ranks).name, 'Egg');
  assert.equal(rankFor(39, ranks).name, 'Egg');
  assert.equal(rankFor(40, ranks).name, 'Hatchling');
  assert.equal(rankFor(99, ranks).name, 'Hatchling');
  assert.equal(rankFor(100, ranks).name, 'Dragon');
  assert.equal(rankFor(99999, ranks).name, 'Dragon');
});

/* ── game unlocking: the ramp must never be able to lock itself ─────────── */

test('a fresh topic opens only the easiest game', () => {
  assert.equal(modesOpen([0, 0, 0, 0, 0], 2), 1);
});

test('each game opens the next one at two stars', () => {
  assert.equal(modesOpen([1, 0, 0, 0, 0], 2), 1, 'one star is not enough');
  assert.equal(modesOpen([2, 0, 0, 0, 0], 2), 2);
  assert.equal(modesOpen([3, 2, 0, 0, 0], 2), 3);
  assert.equal(modesOpen([3, 3, 2, 0, 0], 2), 4);
  assert.equal(modesOpen([3, 3, 3, 2, 0], 2), 5);
});

test('the hardest game is reachable without already having beaten it', () => {
  // The first ramp gated Write It! on a mastery band that required a full star
  // row — which required Write It!. Nothing may depend on its own output again.
  const noWriteStars = [3, 3, 3, 3, 0];

  assert.equal(modesOpen(noWriteStars, 2), 5);
});

test('a gap partway along stops the ramp there', () => {
  assert.equal(modesOpen([3, 0, 3, 3, 3], 2), 2, 'cannot skip past an unbeaten game');
});
