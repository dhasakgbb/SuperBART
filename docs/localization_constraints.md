# Localization Constraints v1.0

This document defines the text rendering constraints for Super BART. These constraints are non-negotiable for v1 and must be enforced by tooling.

---

## 1) Language Scope

Super BART v1 ships in **English only**. No localization infrastructure is required at this time.

If localization is added in a future version, it will require:
- A string table system replacing all hardcoded text
- Per-locale bitmap font atlases
- Revised max string lengths per locale (German and Japanese will exceed English lengths)
- Validation tooling updates to check all locales

None of this exists today. Do not build speculative localization scaffolding.

---

## 2) Character Set

All gameplay and UI text must use the bitmap font character set defined below. No exceptions.

### Supported Characters

| Category | Characters |
|----------|-----------|
| Uppercase letters | `A B C D E F G H I J K L M N O P Q R S T U V W X Y Z` |
| Digits | `0 1 2 3 4 5 6 7 8 9` |
| Punctuation | `. , : ; ! ? ' " - / ( )` |
| Symbols | `x + = # % & @` |
| Whitespace | Space |

### Explicitly Excluded

- Lowercase letters (`a-z`): The bitmap font does not include them. All text is uppercase.
- Unicode beyond ASCII range: No accented characters, no CJK, no emoji, no box-drawing characters.
- Curly quotes or typographic punctuation: Use straight quotes only (`'` and `"`).
- Tab characters: Use spaces for alignment if needed (but prefer layout, not text spacing).

### The `x` Multiplier Glyph

The character `x` serves double duty as both the letter X and the multiplier glyph in HUD counters (`BART x03`, `x127`). This is a deliberate NES-era convention and must not be replaced with a Unicode multiplication sign.

---

## 3) Maximum String Lengths

All strings must respect the following character limits. These are hard limits enforced by validation tooling, not soft guidelines.

| Category | Max Characters | Rationale |
|----------|---------------|-----------|
| Gameplay popup text | 30 | Must be readable during active play in under one second at HUD toast size. |
| Scene headers | 40 | Displayed at large size on dedicated screens. More room but still single-line. |
| HUD labels | 12 | Compact counters on the persistent gameplay overlay. Icon-driven, minimal text. |
| Loading text variants | 30 | Displayed during transitions. Same readability constraint as popups. |
| Stats labels | 12 | Level Complete summary screen. Single-word metric names. |

### Measuring Length

Character count includes all visible characters and spaces. It does not include trailing whitespace. The count is of the raw string, not the rendered pixel width.

For bitmap font rendering, character width is fixed (monospaced grid). A 30-character string will always occupy the same pixel width regardless of content.

---

## 4) Text Rendering Rules

### Bitmap Font Only

All text in all scenes is rendered using the project bitmap font (`scene.fontKey`). No Phaser `add.text()` calls with system fonts are permitted in production. The style validator (`tools/style_validate.ts`) enforces this.

### No Runtime Font Loading

The bitmap font atlas is generated at build time via `npm run gen:assets`. There is no runtime font downloading, no web font loading, and no fallback chain. If the bitmap font is missing, text does not render. This is correct behavior -- it surfaces the problem immediately.

### Uppercase Rendering

All strings are converted to uppercase before rendering. If a string somehow contains lowercase characters, the bitmap font will render blanks or incorrect glyphs. The content validator (`tools/content_validate.ts`) must reject strings containing lowercase.

---

## 5) String Validation Pipeline

Every approved string must pass through:

1. **Content manifest inclusion:** String exists in the approved set defined in `src/content/`.
2. **Character set validation:** Every character in the string is in the supported set (Section 2).
3. **Length validation:** String length does not exceed the category maximum (Section 3).
4. **Uppercase validation:** String contains no lowercase characters.
5. **Tool enforcement:** `npm run lint:content` runs `tools/content_validate.ts` which checks all of the above.

Strings that fail any check are not shipped. There are no exceptions and no overrides.

---

## 6) Future Localization Notes

These notes are for reference only. They do not describe current requirements.

- String IDs should be introduced before any localization work begins. Currently, strings are hardcoded at their usage sites.
- The bitmap font atlas would need per-locale variants. Extended Latin (for European languages) would require accented character support. CJK would require a fundamentally different font approach.
- Max string lengths would need per-locale tuning. German strings are typically 30-40% longer than English equivalents.
- Right-to-left rendering (Arabic, Hebrew) would require layout engine changes.
- The content validation pipeline would need to run per-locale with locale-specific constraints.

None of this is in scope for v1. This section exists to prevent premature optimization toward a localization architecture that may never be needed.
