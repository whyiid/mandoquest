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
