# 🐉 MandoQuest — Learn Chinese!

A fun, colorful Mandarin-learning game built for **Matthew** (age 8). Pure HTML + CSS + JavaScript — no internet needed for the core games (except the speaking game, which uses the browser's voice service).

---

## ▶️ How to play

### On a computer
1. Open the `MandoQuest` folder.
2. Double-click **`index.html`** — it opens in your web browser. That's it!

> Tip: For the **🔊 audio** and **🎤 speaking** games to work best, use **Google Chrome** or **Microsoft Edge**.

### On a tablet or phone (recommended for Matthew)
The app works best when "installed" like a real app:

1. Put the `MandoQuest` folder onto the device (or host the files — see below).
2. Open `index.html` in **Chrome**.
3. Tap the **⋮ menu → "Add to Home screen"** (or "Install app").
4. A 🐉 MandoQuest icon appears on the home screen. Open it like any app — full screen, no browser bars.

### Easiest way to put it on a tablet
Because phones/tablets can't open a folder's `index.html` directly, serve it from the computer once:

```bash
cd MandoQuest
python3 -m http.server 8000
```

Then on the tablet (same Wi-Fi), open `http://<computer-ip>:8000` in Chrome and "Add to Home screen". After the first open it works **offline**.

---

## 🎮 The 5 games

| Game | What Matthew does |
|------|-------------------|
| 🧲 **Match & Drop** | Drag each picture to its Chinese character. |
| 👂 **Listen & Choose** | The dragon says a word — tap the character he said. |
| ⚡ **Hanzi Hunt** | Race the clock: hear a word, tap the right character fast! |
| 🎤 **Speak!** | Say the word out loud — the dragon listens and checks it. |
| 🧩 **Sentence Builder** | Tap the word-cards in order to build a sentence (e.g. 我 + 叫 + Matthew). |

**14 topics:** Greetings · Numbers · Colors · Animals · Food · Family · School · Body · Weather · People & Me · Actions · Time · Transport · Describe. (155 words + 13 sentences, curated HSK 1–2.)

---

## ⭐ How progress works
- Earn **1–3 stars** each round.
- Each topic fills a **progress bar** as Matthew masters its words.
- Reach **80%** in a topic to **unlock** the next one.
- A **🔥 day-streak** counts how many days in a row he plays.
- Everything is saved on the device automatically (no login, no account).

To reset all progress: in the browser, clear site data, or run `localStorage.clear()` in the dev console.

---

## 🔧 Notes for grown-ups
- **No build step, no server, no frameworks.** Just static files.
- **Audio = bundled clear-voice pack.** Every word and sentence ships as a pre-recorded clip in `audio/` (a native **Mainland Mandarin / 普通话** voice, matching the simplified characters used in the app and Matthew's HSK direction). The app plays the clip; if a clip is ever missing or blocked, it automatically **falls back to the browser's built-in voice** (Web Speech API), so audio never fully breaks. After the first time a clip plays, it's cached for offline use.
- **Music & sound effects.** Gentle background music and reward/tap sounds are **synthesised live** in the browser (Web Audio API — no audio files, fully offline). Tap the **🔊 / 🔇** button (top-right) to turn them on or off; the choice is remembered. This toggle never silences the word **pronunciation** — that always plays.
- **Speaking game** (🎤) needs **microphone permission** and an **internet connection** (the browser's speech recognition runs online). All other games work fully offline.
- Best supported on **Chrome / Edge**. Safari has limited speech-recognition support — the other 4 games still work.

### ➕ Adding new words — or a whole new topic (level)
All the learning content lives in **one file: `data.js`**. You don't need to touch any other code.

**To add words to an existing topic:** find the topic in `data.js` (e.g. `Food`) and add a line to its `words` list, copying the format of the lines around it exactly:

```js
{ hanzi: '苹果', pinyin: 'píng guǒ', en: 'Apple', id: 'Apel', emoji: '🍎' },
```
- `hanzi` — Chinese characters (simplified) · `pinyin` — pronunciation with tone marks
- `en` — English word shown in the game · `id` — Indonesian (kept hidden, reference only)
- `emoji` — a picture for the card; if no emoji fits, use `emoji: ''` and the English word shows instead

**To add a whole new topic (a new "level"):** copy one entire topic block — from `{ id: ... }` to its closing `}` — paste it at the **end** of the `categories` list (before the closing `]`), then change `id`, `name`, `icon`, `color`, and the `words`. New topics appear **in array order**, and each one unlocks after the child reaches **80%** on the topic before it.

**After ANY change to `data.js`, do these 3 steps:**
1. **Rebuild the audio** so the new words get a voice clip:
   ```bash
   cd MandoQuest
   node tools/gen-audio.js
   ```
2. **Bump the cache number** in `sw.js`: change `const CACHE = 'mandoquest-v5';` to `v6` (then `v7` next time, and so on). **This step matters** — it forces the app to discard old cached audio so the new words always say the right thing.
3. **Open the app and check** — the new topic/words should appear, with sound.

> Tip: choose **concrete words that have a clear emoji/picture** (animals, food, objects). Abstract grammar words (的 / 了 / 吗) don't work well in a picture-matching game.

### 🔊 Regenerating the audio pack
The clips live in `audio/` with a map at `audio/manifest.js`. To rebuild them all (e.g. after adding new words to `data.js`):

```bash
cd MandoQuest
node tools/gen-audio.js
```

This reads every word/sentence from `data.js`, downloads a fresh clip for each, and rewrites `audio/manifest.js`. Source voice is selectable via the `MQ_SOURCE` env var:

| `MQ_SOURCE` | Voice | Notes |
|-------------|-------|-------|
| `google` *(default)* | Google Translate TTS — Mainland 普通话 | Used voice. Matches HSK + simplified text. |
| `youdao` | Youdao dictionary — Mainland | Alternative Mainland source. |
| `tingting` | macOS `say -v Tingting` — Taiwan 國語 | Offline, Apple-only; different accent. |

Any word that fails to download just uses the Web Speech fallback at runtime — the app still works.

## 📁 Files
```
MandoQuest/
├── index.html         app shell + dragon mascot
├── style.css          kid-first visual design
├── data.js            all words, sentences & phrases
├── app.js             game engine + 5 game modes
├── manifest.json      makes it installable as an app
├── sw.js              offline cache (service worker)
├── icons/icon.svg     the dragon app icon
├── audio/             pre-recorded voice clips (*.mp3) + manifest.js
├── tools/gen-audio.js rebuilds the audio pack from data.js
└── README.md          this file
```

Made with 🧡 for Matthew.
