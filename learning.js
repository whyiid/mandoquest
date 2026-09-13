/* MandoQuest learning helpers — shared by the browser app and Node tests. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MandoLearning = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function updateSrsEntry(entry, ok, today, steps, addDays) {
    const previous = entry || {};
    const e = Object.assign({
      n: 0,
      due: today,
      miss: 0,
      lapses: previous.miss || 0,
      lastSuccess: '',
      lastOk: null
    }, previous);

    if (ok) {
      e.miss = 0;
      e.lastOk = true;
      // Repetitions in one play session reinforce the word, but they are not
      // separate spaced reviews. Advance the interval at most once per day.
      if (e.lastSuccess !== today) {
        e.n = Math.min(e.n + 1, steps.length);
        e.due = addDays(today, steps[e.n - 1]);
        e.lastSuccess = today;
      }
    } else {
      e.n = 0;
      e.miss = (e.miss || 0) + 1;
      e.lapses = (e.lapses || 0) + 1;
      e.due = addDays(today, 1);
      e.lastOk = false;
    }

    return e;
  }

  function weakSrsEntries(srs) {
    return Object.keys(srs || {})
      .map(hanzi => Object.assign({ hanzi }, srs[hanzi]))
      .filter(entry => (entry.miss || 0) > 0 && entry.lastOk !== true)
      .sort((a, b) => (b.miss || 0) - (a.miss || 0) || (a.n || 0) - (b.n || 0));
  }

  return { updateSrsEntry, weakSrsEntries };
});
