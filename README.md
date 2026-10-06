# Klockowo

**Play it online: <https://klockowo.vercel.app>** (works offline after the first visit and can be added to a phone's home screen)

A small, ad-free maths game for children aged 5–6. The child learns to count to 100 and to add, guided by Kubik, a block-world beagle, and his team of rescue puppies. It is a personal project (not an app-store product): it runs entirely in the browser, needs no backend, and sends nothing anywhere.

The game is available in three languages, chosen on the start screen:

| Button | Language |
| --- | --- |
| **PL** | Polish (the original, default) |
| **EN** | English |
| **UA** | Ukrainian |

All on-screen text and all spoken lines follow the chosen language, including number words and noun agreement ("two apples" / "дві груші" / "dwie gruszki"). The parent zone has its own panel language (Polish / English / Ukrainian).

## What is inside

- **7 worlds, 95 levels** with 14 mini-games: counting, subitizing, giving a number, comparing, number bonds, adding (with and without crossing ten), tens and ones, the hundred chart, number line, story problems and more.
- **Gentle by design:** no timers, no lives, no red crosses; a wrong answer gets "let's try again", then a hint, then Kubik solves it together with the child. Difficulty adapts to how the child is doing and earlier skills are revisited.
- **Rewards that are predictable:** one sticker per level, a few badges, a sticker album and a free-play playground. No streaks, currency or random prizes.
- **Parent zone** (hold the gear for 3 seconds, then answer a multiplication question): progress and skill map, difficulties, settings, several profiles, and backup/restore of progress as a file.
- **Offline and installable:** a service worker caches the whole app, so after the first visit it works without internet and can be added to a phone or tablet home screen.
- **Voice and sound:** spoken instructions use the browser's own text-to-speech (Web Speech API). Sound effects and quiet background music are synthesised with Web Audio — there are no audio files.
- **Responsive and accessible:** touch targets of at least 64 px (80 px on phones), keyboard focus ring, a "less animation" setting, and signals that never rely on colour alone.

## Voices — important

The voice comes from the **device and browser**, not from the website. A language is spoken only if the browser has a voice for it:

- Polish, English: normally available.
- Ukrainian: Edge on Windows has online Ukrainian voices; Chrome on Windows needs a Ukrainian language pack with speech installed in Windows; Android (Google) and iOS ("Lesya") usually have one.

If no voice exists for the chosen language, the game shows a short notice for adults and still works silently (instructions remain visible as pictures and digits).

## Run it locally

Requires a recent Node.js (20.19+ or 22+).

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev -- --host   # also reachable from a phone on the same Wi-Fi
```

Other scripts:

```bash
npm test             # unit tests (Vitest)
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build on http://localhost:4173
```

The dev server also exposes developer pages under `/#/dev` (component showcases, a game playground with ready-made presets, a voice lab). They are excluded from production builds.

## Hosting

The build is a fully static site: upload the contents of `dist/` to any static host (GitHub Pages, Netlify, Cloudflare Pages, your own server). Routing uses the URL hash and asset paths are relative, so it works from the site root or from a sub-folder without extra configuration. The page must be served over **HTTPS** for the offline mode and "install to home screen" to work (`localhost` also qualifies). See [`docs/INSTALL.md`](docs/INSTALL.md) for step-by-step instructions (in Ukrainian).

Progress is stored in the browser's `localStorage` on each device. Use the backup export in the parent zone before clearing browser data or changing devices. On iOS an installed home-screen app has storage separate from the Safari tab.

## Tech stack

Vite, React 19, TypeScript (strict), zustand (persisted, versioned schema with migrations), react-router (hash routing), CSS Modules with design tokens, Vitest, `vite-plugin-pwa`. Fonts (Fredoka, Nunito, Andika) are bundled locally. No analytics, ads, external requests or tracking.

## Project layout

```
src/
  app/          app shell, routes, providers
  screens/      one folder or file per screen
  components/   ui/ (buttons, tiles, HUD) and math/ (counting objects, ten frame, number line, hundred chart…)
  characters/   Kubik, the puppy team, player pups
  games/        engine (task loop, hints, retry queue) + one folder per mini-game
  curriculum/   worlds, level data, adaptivity, review, rewards
  speech/       tts, sound effects, music, all text (lines.ts), numbers, nouns, plural rules
    lang/       Ukrainian (uk/) and English (en/) packs
  store/        profiles, settings, progress
  parent/       parent gate, report, backup
  session/      session clock, breaks
docs/           brief, pedagogy notes, Polish copy, plan and development journal
design/         visual design exports and the design index
```

### How languages work

Polish is the reference: its strings live in `src/speech/lines.ts`, nouns in `nouns.ts`, number words in `numberWords.ts` and agreement uses `Intl.PluralRules('pl')`. Other languages are plug-in packs in `src/speech/lang/<code>/` with the same keys (the compiler enforces completeness); `src/speech/language.ts` swaps them in. Numbers are always spoken as words, never digits. To add a language: create a pack (numbers, nouns, lines, templates, stories), register it in `language.ts` and add its code to `langCode.ts`. The tests in `src/games/engine/voice.test.ts` check every spoken line of all 95 levels in every language.

## Documentation

- [`docs/BRIEF.md`](docs/BRIEF.md) — behaviour, screens and games (Ukrainian)
- [`docs/PEDAGOGY.md`](docs/PEDAGOGY.md) — methodology, levels and adaptivity
- [`docs/POLISH_COPY.md`](docs/POLISH_COPY.md) — Polish grammar notes and copy
- [`docs/PLAN.md`](docs/PLAN.md) — development stages and journal
- [`docs/INSTALL.md`](docs/INSTALL.md) — installing on a phone or tablet

## Note on characters

The visual style is an original block world with its own team of puppies. It deliberately contains no characters, logos or recognisable elements from Minecraft or any TV franchise.
