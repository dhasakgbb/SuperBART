# UI Text Voice Guide v1.0

This document defines every approved UI string in Super BART, its display context, and the rules for writing new strings. All strings are sourced from the Content Bible Section 9 and validated by `tools/content_validate.ts`.

---

## 1) General Rules

- All UI text is rendered in bitmap font. No system fonts, no TrueType, no runtime SVG.
- UI strings are uppercase only. The bitmap font character set is `A-Z`, `0-9`, and common punctuation.
- Keep joke density low. The game is the main act. Text is punctuation, not the sentence.
- Strings must be legible at NES-era resolution on a 16px tile grid.
- No string should require a second read to parse. If the player squints, it is too long.

---

## 2) Scene Headers

Scene headers are the primary text displayed when entering a non-gameplay scene. They set context in one glance.

| Scene | String | Max Length | Notes |
|-------|--------|-----------|-------|
| Title | `SUPER BART` | 40 chars | Rendered large, center screen. This is the logo treatment. |
| World Map | `SERVICE MAP` | 40 chars | Displayed as the scene title. Reinforces infrastructure metaphor. |
| Pause | `PAUSED` | 40 chars | Simple. No joke. The player chose to stop; respect that. |
| Game Over | `429: TOO MANY REQUESTS` | 40 chars | HTTP status code humor. Bart ran out of retries. |
| Level Complete | `DEPLOYED TO PROD` | 40 chars | The level shipped. This is the reward moment. |
| Final Victory | `BENCHMARKS IMPROVED` | 40 chars | Primary text. Deliberately anticlimactic. |
| Final Victory (sub) | `SHIPPING STILL PENDING` | 40 chars | Optional small subtext below primary. The joke is that even victory is provisional. |

### Do / Don't

**Do:** Use infrastructure vocabulary that maps to the emotional beat. "DEPLOYED TO PROD" works because it is both a real event and a triumph.

**Don't:** Use conversational or celebratory language. "YOU WIN!" or "GREAT JOB!" breaks the system-voice conceit. The system does not congratulate. It reports.

---

## 3) Loading Text Variants

Loading text appears during scene transitions and asset provisioning. The game cycles through these variants. Each should suggest the system is doing infrastructure work.

| String | Max Length | Context |
|--------|-----------|---------|
| `PROVISIONING...` | 30 chars | Default loading state. Generic cloud infrastructure spin-up. |
| `WARMING CACHE...` | 30 chars | Suggests pre-computation. Used for longer loads. |
| `REDUCING HALLUCINATIONS...` | 30 chars | The best one. Implies the game is fixing its own enemies. |

### Do / Don't

**Do:** Write loading strings that sound like real infrastructure status messages. The humor is in the recontextualization.

**Don't:** Write loading strings that are self-aware jokes about loading. "LOADING... GET IT?" is not this game. The system does not know it is funny.

---

## 4) Gameplay Popup Strings

Popup strings appear briefly during gameplay as HUD toast messages (`showHudToast`). They are transient, small, and must not obstruct play. These are the only approved in-play text overlays.

| Event | String | Max Length | Context |
|-------|--------|-----------|---------|
| Stomp kill | `CORRECTED` | 30 chars | Appears when player stomps an enemy. The Hallucination was wrong; now it is fixed. |
| Pit death | `CONTEXT WINDOW EXCEEDED` | 30 chars | Appears on fall death. Bart ran out of context (ground). |
| Checkpoint | `SAVED TO BLOB STORAGE` | 30 chars | Appears when hitting a checkpoint. Progress is persisted. |

### Do / Don't

**Do:** Keep popup strings under 30 characters. They appear during active gameplay and must be readable in under one second.

**Don't:** Use popup strings for commentary or jokes that require the player to stop and read. If the player has to stop playing to appreciate the text, cut the text.

**Don't:** Stack multiple popups. One toast at a time. The most recent event wins.

---

## 5) Stats Labels

Stats labels appear on the Level Complete summary screen. They describe the metrics of the completed run.

| Label | Context |
|-------|---------|
| `LATENCY` | Time taken to complete the level. Framed as response time, not play time. |
| `TOKENS` | Coins collected. The currency of inference. |
| `EVALS` | Stars collected. Rare and optional. |
| `ROLLBACKS` | Deaths during the level. Each death is a rollback, not a failure. |

### Do / Don't

**Do:** Use metric vocabulary from ML/infrastructure. The stats screen should read like a deployment report.

**Don't:** Use emotional language. "DEATHS" is too direct. "ROLLBACKS" maintains the system-voice distance.

---

## 6) HUD Labels

HUD labels are the persistent on-screen counters during gameplay. They are icon-driven with minimal text.

| Element | Format | Max Length | Notes |
|---------|--------|-----------|-------|
| Life counter | `BART xNN` | 12 chars | Portrait + name + multiplier glyph + count. |
| World indicator | `WORLD W-L` | 12 chars | World and level number. |
| Time display | `TIME ###` | 12 chars | Countdown timer. |

HUD counters for tokens and evals use icons, not text labels. The `x` multiplier glyph is part of the visual identity and must not be replaced with a word.

### Do / Don't

**Do:** Keep HUD text minimal. Icons carry the meaning. Text is for values only.

**Don't:** Add labels like `LIVES`, `COINS`, or `STARS` to the HUD. The content bible explicitly forbids this. Everything is icon + number.

---

## 7) Combo / Kill Streak Labels

Currently not implemented. If combo labels are added in the future, they must follow these constraints:

- Maximum 30 characters
- Transient popup only (HUD toast)
- Infrastructure vocabulary (not gaming vocabulary)
- No escalating superlatives ("AMAZING!", "INCREDIBLE!"). The system does not have opinions about performance. It reports metrics.

Candidate pattern: `BATCH CORRECTED x3` for multi-stomp sequences.

---

## 8) String Authoring Checklist

Before adding any new UI string:

1. **Length check:** Popup max 30 chars. Scene header max 40 chars. HUD label max 12 chars.
2. **Character set check:** Uppercase A-Z, 0-9, common punctuation only. No lowercase, no Unicode beyond ASCII.
3. **Voice check:** Does it sound like a system reporting an event, or a person talking? It must be the former.
4. **Tweet test:** Would someone post this on social media? If yes, rewrite it.
5. **Gameplay test:** Can the player read it without stopping? If not, shorten it.
6. **Redundancy check:** Does this string duplicate information already conveyed by an icon, animation, or sound? If yes, cut it.
7. **Validation:** Add the string to the approved set in the content manifest and verify with `tools/content_validate.ts`.

---

## 9) Forbidden Patterns

These patterns are explicitly banned from UI text:

- Exclamation marks in gameplay popups (the system does not exclaim)
- Ellipsis used for comedic timing ("LOADING... STILL LOADING..." is a tweet)
- Self-referential game humor ("PRESS F TO PAY RESPECTS", "YOU DIED")
- Real product or company names
- Lowercase characters (bitmap font does not support them)
- Emoji or Unicode symbols beyond the ASCII character set
- Placeholder text that shipped ("TODO", "PLACEHOLDER", "TEMP")
