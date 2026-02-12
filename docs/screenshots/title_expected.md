# Title Expected Composition

This gate describes the required title-screen composition for `TitleScene`.

## Required Visual Layout

- Upper third shows generated `title_logo.png` centered with chunky outline and warm highlight.
- Bart portrait (`bart_portrait_96.png`) sits near the title as a branding mark.
- Subtitle line appears below title in bitmap text:
  - `4 WORLDS X 6 LEVELS + FINAL CASTLE`
- Bottom third includes blinking `PRESS ENTER` plus the small controls hint row.

## Required Background Behavior

- Background must be a live attract-style scene using in-game visual language:
  - parallax sky/haze/hills,
  - drifting clouds,
  - tile ground strip,
  - bobbing question block,
  - shimmering coin row.
- Camera slowly pans horizontally in a loop.

## Enforcement

- `TitleScene` must read positions/sizes/timing from `src/style/styleConfig.ts` (`titleLayout`).
- Hardcoded numeric placement in `TitleScene` `this.add(...)` calls is treated as a style failure by `tools/style_validate.ts`.
- `npm run lint:style` is the mandatory gate.
