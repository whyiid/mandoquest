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

  // A word counts as still-weak until the schedule has carried it far enough to
  // have stuck. Never seen, recently missed, or only one success deep all mean
  // "not learned yet" — the quest uses this to decide what to keep drilling.
  function isWeakWord(entry) {
    if (!entry) return true;
    return (entry.miss || 0) > 0 || entry.lastOk === false || (entry.n || 0) < 2;
  }

  // Mastery index 0..4 from two independent signals. Stars say he can play the
  // topic; the word schedule says he actually remembers it. Only when BOTH are
  // high does a topic count as finished, so a full star row earned on lucky
  // rounds cannot buy its way out of review while the words are still shaky.
  function masteryFor(stars, maxStars, weakWords, totalWords) {
    if (stars <= 0) return 0;
    const starPart = maxStars > 0 ? stars / maxStars : 0;
    const solid = totalWords > 0 ? 1 - weakWords / totalWords : 0;
    if (starPart >= 1 && solid >= 0.9) return 4;
    if (starPart >= 0.8 && solid >= 0.7) return 3;
    if (starPart >= 0.45 || solid >= 0.5) return 2;
    return 1;
  }

  // Highest rank whose threshold the player has passed.
  function rankFor(totalStars, ranks) {
    let r = ranks[0];
    ranks.forEach(x => { if (totalStars >= x.min) r = x; });
    return r;
  }

  return { updateSrsEntry, weakSrsEntries, isWeakWord, masteryFor, rankFor };
});
