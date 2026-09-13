'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { updateSrsEntry, weakSrsEntries } = require('../learning.js');

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
