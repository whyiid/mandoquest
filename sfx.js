/* ===========================================================================
   MandoQuest — sfx.js
   ---------------------------------------------------------------------------
   Tiny offline sound engine: gentle pentatonic background music (BGM) + game
   sound effects (SFX), all synthesised live with the Web Audio API.

   • No audio files — pure oscillators, works fully offline.
   • C-major pentatonic (C D E G A) → always consonant, never sounds "wrong".
   • Controls ONLY BGM + SFX. It never touches speak()/TTS — the Mandarin
     pronunciation a child is learning is always audible, even when muted.

   Exposes window.MandoSFX:
     correct() wrong() tap() win() unlock()   — one-shot effects
     startBGM() stopBGM()                      — background loop
     toggle() setOn(bool) isOn()               — on/off, persisted
   =========================================================================== */
(function () {
  'use strict';

  var KEY = 'mandoquest.sound';
  var on  = (function () { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } })(); // default ON
  var ctx = null, master = null, bgmGain = null, bgmTimer = null, started = false, step = 0;

  // C-major pentatonic across two-and-a-bit octaves (Hz)
  var N = {
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00, C6: 1046.50
  };

  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master  = ctx.createGain(); master.gain.value  = 0.9;  master.connect(ctx.destination);
      bgmGain = ctx.createGain(); bgmGain.gain.value = 0.0;  bgmGain.connect(master);
    } catch (e) { ctx = null; return false; }
    return !!ctx;
  }
  function resume() { try { if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) {} }

  // one soft note with a quick attack + smooth release
  function note(freq, t0, dur, peak, type, dest) {
    try {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(dest || master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) {}
  }
  // play a quick melodic sequence (used by the one-shot SFX)
  function seq(freqs, gap, dur, peak, type) {
    if (!on || !ensure()) return;
    resume();
    var t = ctx.currentTime + 0.01;
    for (var i = 0; i < freqs.length; i++) note(freqs[i], t + i * gap, dur, peak, type, master);
  }

  /* ── one-shot effects ──────────────────────────────────────────────── */
  function correct() { seq([N.E5, N.G5, N.C6],                 0.085, 0.18, 0.22, 'triangle'); } // happy rise
  function wrong()   { seq([N.E4, N.C4],                        0.12,  0.22, 0.15, 'sine');     } // soft, gentle dip
  function tap()     { seq([N.A5],                              0.0,   0.06, 0.10, 'sine');     } // light click
  function win()     { seq([N.C5, N.D5, N.E5, N.G5, N.A5, N.C6], 0.09, 0.22, 0.20, 'triangle'); } // little fanfare
  function unlock()  { seq([N.G4, N.C5, N.E5, N.G5],            0.08,  0.30, 0.18, 'triangle'); } // sparkle

  /* ── background music: gentle looping pentatonic ───────────────────── */
  var PATTERN = ['C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'E5'];
  function bgmTick() {
    if (!on || !ctx) return;
    var t = ctx.currentTime + 0.02;
    note(N[PATTERN[step % PATTERN.length]], t, 0.5, 0.5, 'triangle', bgmGain);
    if (step % 4 === 0) note(N.C4, t, 1.4, 0.5, 'sine', bgmGain); // soft warm root
    step++;
  }
  function startBGM() {
    if (!on || !ensure()) return;
    resume();
    try { bgmGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.8); } catch (e) {} // fade in, soft
    if (bgmTimer) return;
    bgmTick();
    bgmTimer = setInterval(bgmTick, 520);
  }
  function stopBGM() {
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (bgmGain && ctx) { try { bgmGain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.3); } catch (e) {} }
  }

  /* ── on/off (persisted) ────────────────────────────────────────────── */
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    if (on) { ensure(); resume(); startBGM(); } else { stopBGM(); }
  }
  function toggle() { setOn(!on); return on; }
  function isOn()   { return on; }

  /* ── unlock audio on first user gesture (browser autoplay policy) ──── */
  function kick() {
    if (started) return; started = true;
    if (ensure()) { resume(); if (on) startBGM(); }
    window.removeEventListener('pointerdown', kick, true);
    window.removeEventListener('keydown', kick, true);
  }
  window.addEventListener('pointerdown', kick, true);
  window.addEventListener('keydown', kick, true);

  // be a good citizen: hush the BGM when the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopBGM();
    else if (on && started) startBGM();
  });

  window.MandoSFX = {
    correct: correct, wrong: wrong, tap: tap, win: win, unlock: unlock,
    startBGM: startBGM, stopBGM: stopBGM, setOn: setOn, toggle: toggle, isOn: isOn
  };
})();
