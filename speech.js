/* MandoQuest speaking helpers — shared by the browser app and Node tests. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MandoSpeech = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const SPOKEN_NUMBERS = {
    '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
    '6': '六', '7': '七', '8': '八', '9': '九', '10': '十',
    '100': '百', '1000': '千'
  };

  function normalizeHanzi(value) {
    const compact = String(value || '').replace(/[^一-鿿A-Za-z0-9]/g, '');
    return SPOKEN_NUMBERS[compact] || compact;
  }

  function normalizePinyin(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      // Android/desktop pinyin keyboards conventionally use "v" for ü. Keep
      // it distinct from plain "u", otherwise lǜ incorrectly accepts "lu".
      .replace(/u\u0308/g, 'v')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  }

  function createTapCooldown(duration, clock) {
    const wait = Math.max(0, Number(duration) || 0);
    const now = typeof clock === 'function' ? clock : Date.now;
    let lockedUntil = -Infinity;
    return {
      run(action) {
        const time = now();
        if (time < lockedUntil) return false;
        lockedUntil = time + wait;
        if (typeof action === 'function') action();
        return true;
      }
    };
  }

  /* ── Numbered pinyin → tone marks ──────────────────────────────────────
     A phone keyboard has no ǎ, so Write It! accepted pinyin without tones —
     which meant nothing in the app ever required them. The standard way round
     this, used by every Mandarin tool, is to type the tone as a digit after
     the syllable: "ni3 hao3" becomes "nǐ hǎo". Works on any keyboard, and
     showing the converted form as the child types is itself the lesson.     */
  const TONE_ROWS = {
    a: 'āáǎà', e: 'ēéěè', i: 'īíǐì',
    o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ'
  };
  const TONED = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

  // Standard placement: a wins, else o or e, else the SECOND vowel of iu/ui,
  // else the only vowel there is. (liù marks the u, guī marks the i.)
  function markSyllable(syl, tone) {
    if (!syl || !(tone >= 1 && tone <= 4)) return syl;      // 0/5 = neutral
    let idx = -1;
    for (const v of ['a', 'o', 'e']) { idx = syl.indexOf(v); if (idx !== -1) break; }
    if (idx === -1) {
      const iu = syl.indexOf('iu'), ui = syl.indexOf('ui');
      if (iu !== -1) idx = iu + 1;
      else if (ui !== -1) idx = ui + 1;
      else {
        for (let i = 0; i < syl.length; i++) if ('iuü'.indexOf(syl[i]) !== -1) idx = i;
      }
    }
    if (idx === -1) return syl;
    const row = TONE_ROWS[syl[idx]];
    return row ? syl.slice(0, idx) + row[tone - 1] + syl.slice(idx + 1) : syl;
  }

  function pinyinFromNumbers(raw) {
    const src = String(raw || '').toLowerCase();
    if (TONED.test(src)) return src;         // already typed with real marks
    let out = '', buf = '', gap = false;
    const flush = tone => {
      if (!buf) return;
      if (gap && out) out += ' ';
      out += markSyllable(buf.replace(/v/g, 'ü'), tone);
      buf = ''; gap = true;
    };
    for (const ch of src) {
      if (ch >= '0' && ch <= '9') flush(Number(ch));
      else if (/[a-zü]/.test(ch)) buf += ch;
      else { flush(0); gap = true; }
    }
    flush(0);
    return out;
  }

  // Letters AND tone, stripped of spacing — what an answer is judged on.
  function compactToned(value) {
    return String(value || '').toLowerCase().normalize('NFC')
      .replace(/ü/g, 'ü')
      .replace(/[^a-züÀ-ǿ]/g, '');
  }

  // SpeechRecognition returns text, not a pronunciation score. Accept only an
  // exact normalized word from one of its alternatives. Partial Hanzi/pinyin
  // made unrelated words such as every color (all ending in 色) pass.
  function matchesSpeech(alternatives, word) {
    if (!Array.isArray(alternatives) || !word) return false;
    const targetHanzi = normalizeHanzi(word.hanzi);
    const targetPinyin = normalizePinyin(word.pinyin);

    return alternatives.some(alternative => {
      const heardHanzi = normalizeHanzi(alternative);
      if (heardHanzi && targetHanzi && heardHanzi === targetHanzi) return true;

      const heardPinyin = normalizePinyin(alternative);
      return !!(heardPinyin && targetPinyin && heardPinyin === targetPinyin);
    });
  }

  // A recognition callback, Skip tap, and delayed success can race each other.
  // This guard makes completing a question an atomic, one-time action.
  function createSingleUseGuard() {
    let open = true;
    return {
      run(action) {
        if (!open) return false;
        open = false;
        if (typeof action === 'function') action();
        return true;
      },
      cancel() { open = false; },
      isOpen() { return open; }
    };
  }

  return { createSingleUseGuard, createTapCooldown, matchesSpeech, normalizeHanzi,
           normalizePinyin, pinyinFromNumbers, compactToned };
});
