# Design system

## Direction

The portfolio is a daylight screening room: a warm, inviting stage where shipped work is the evidence and the interface behaves like a precise production surface. The page uses pauses, frames, and editorial pacing to make a long archive feel intentional without turning the work into a card wall.

## Brand mark

`assets/screening-mark.png` is the project emblem: an amber geometric aperture framed by four crop marks, with interlocking negative space that quietly suggests the SS initials. It is used in the header, favicon, and Apple touch icon, and is designed to remain legible at small sizes.

## Palette

Light is the default theme; a dark variant remains available through the CLI (`theme dark`).

- `--bg` / ivory: `#f7f1e6`
- `--surface`: `#efe6d8`
- `--bone`: `#261c10`
- `--muted`: `#4a3d2c`
- `--faint`: `#6f614d`
- `--amber`: `#9a4f0d`
- `--amber-soft`: `#7c3f06`
- Dark variant (`body[data-theme="dark"]`): soot `#0c0a09`, bone `#f0e8dc`, amber `#e6ad4f`, amber-soft `#f3cf8b`.
- All accent surfaces (ticker, buttons, selection, glows, stage rings) derive from theme-aware variables so they adapt with the theme.
- Lines are warm, transparent separators rather than hard rules.

## Typography

- Syne is the display voice: wide, slightly eccentric, and used for the hero and section titles.
- DM Mono is reserved for production marks, metadata, filters, skills, and CLI copy.
- Display text uses tight negative tracking (floor −0.04em); functional labels stay at or above the 11px legibility floor. Body copy is measured and kept near 65 characters per line.

## Composition

- The first viewport is a full-height stage with a restrained spotlight, framing lines, title, statement, and one primary work action.
- Long-form content is paced as labeled sections, an amber ticker, ledger-style metadata, and open rows.
- Projects and open-source work are evidence rows, not cards. Each row exposes its name, explanation, classification, and direct source link.
- The contact section closes the page as a final frame with one direct email action.

## Interaction

- Filter controls use real buttons with `aria-pressed`; inactive items are removed from the accessibility tree.
- Skill tags focus the nearest project category and scroll the visitor to the relevant evidence.
- The CLI uses a native dialog and supports Cmd/Ctrl+K, a visible close control, and reduced-motion-safe behavior.
- The CLI theme command toggles `light` (default) and `dark` variants.
- Motion is limited to the opening title/beam reveal, ticker, and intentional hover emphasis. `prefers-reduced-motion` disables continuous animation.

## Browser surfaces

- Selection, focus rings, caret, placeholder, and scrollbars are themed from the palette; `color-scheme` follows the active theme.
