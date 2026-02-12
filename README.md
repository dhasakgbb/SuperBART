# Super BART V2

Mario-style 2D platformer built with Phaser 3 + Vite + TypeScript.

## Features
- 5 worlds x 5 campaign levels (generated from deterministic seeds)
- bonus-level unlock path via stars
- player feel upgrades: coyote time, jump buffer, variable jump, knockback i-frames
- enemies/hazards: walker, shell, flying, spitter, spikes, thwomp-lite, moving platforms + spring/pit hazards
- checkpoint respawn, score/coins/stars progression, end-of-level summary
- in-app synthesized audio (SFX + music) with settings toggles
- Bart avatar pipeline from `/public/assets/bart_source.png` to pixel sprites

## Run
```bash
cd /Users/damian/GitHub/NES/SuperBART
python3 -m pip install -r tools/requirements.txt
npm install
npm run gen:all
npm run dev
```

## Commands
```bash
npm run gen:all
npm run gen:avatars
npm run lint:assets
npm run lint:style
npm run test
npm run validate
npm run build
npm run preview
```

## Bart Avatar Updates
To update Bart’s avatar, replace `/public/assets/bart_source.png` and run `npm run gen:avatars`.

Builds auto-generate the full UI/portrait asset set through `prebuild` (`npm run gen:all`).

## Controls
- Move: Arrow keys or `A` / `D`
- Jump: `Space`, `W`, or `Up`
- Restart level: `R`
- Return to map: `Esc`
- Title: `Enter` start/continue, `N` new game, `S` settings

## Debug APIs
- `window.__SUPER_BART__.getState()`
- `window.render_game_to_text()`
- `window.advanceTime(ms)`

## Troubleshooting
- If assets are missing, run `npm run assets:generate` then `npm run assets:validate`.
- If Bart avatar generation fails, run `python3 -m pip install -r tools/requirements.txt` then `npm run gen:avatars`.
- If local save gets inconsistent during development, clear browser localStorage for this origin.

## CI Notes
A minimal CI pipeline should run:
1. `npm ci`
2. `npm run gen:all`
3. `npm run lint:assets`
4. `npm run test` (includes `lint:style`)
5. `npm run validate`
6. `npm run build`
