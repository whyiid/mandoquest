'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('loads the speaking helpers before the game engine', () => {
  const html = read('index.html');
  const speechIndex = html.indexOf('src="speech.js"');
  const appIndex = html.indexOf('src="app.js"');

  assert.notEqual(speechIndex, -1);
  assert.ok(speechIndex < appIndex);
});

test('pre-caches the speaking helpers for the installed app', () => {
  const worker = read('sw.js');

  assert.match(worker, /['"]\.\/speech\.js['"]/);
});

test('Android installation instructions require a secure HTTPS origin', () => {
  const readme = read('README.md');

  assert.doesNotMatch(readme, /http:\/\/<computer-ip>/);
  assert.match(readme, /HTTPS/i);
});

test('speaking mode pauses background music while listening', () => {
  const app = read('app.js');
  const sfx = read('sfx.js');

  assert.match(app, /pauseForSpeech/);
  assert.match(app, /resumeAfterSpeech/);
  assert.match(sfx, /pauseForSpeech/);
  assert.match(sfx, /resumeAfterSpeech/);
});

test('loads learning helpers before the game engine and caches them offline', () => {
  const html = read('index.html');
  const worker = read('sw.js');

  assert.ok(html.indexOf('src="learning.js"') < html.indexOf('src="app.js"'));
  assert.match(worker, /['"]\.\/learning\.js['"]/);
});

test('hidden activity tiles stay out of layout even when tile uses flex', () => {
  const css = read('style.css');

  assert.match(css, /\.tile\[hidden\]\s*\{[^}]*display:\s*none\s*!important/);
});

test('Sentence Builder locks a correct answer before scheduling the next question', () => {
  const app = read('app.js');
  const handler = app.slice(app.indexOf("$('#sent-check').onclick"), app.indexOf('\n    };', app.indexOf("$('#sent-check').onclick")));

  assert.match(handler, /if \(answered\) return/);
  assert.ok(handler.indexOf('answered = true') < handler.indexOf('firstTry++'));
});

test('Speak skip records the missed word and uses a mode-wide tap cooldown', () => {
  const app = read('app.js');
  const start = app.indexOf('function modeSpeak');
  const end = app.indexOf('MODE 5', start);
  const mode = app.slice(start, end);

  assert.match(mode, /createTapCooldown/);
  assert.match(mode, /recordWord\(catId, w\.hanzi, false\)/);
});
