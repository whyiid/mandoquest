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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
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

  return { createSingleUseGuard, matchesSpeech, normalizeHanzi, normalizePinyin };
});
