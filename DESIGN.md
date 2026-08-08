# Design system

## Direction

The portfolio is a cinematic screening room: a dark stage where shipped work is the evidence and the interface behaves like a precise production surface. The page uses pauses, frames, and editorial pacing to make a long archive feel intentional without turning the work into a card wall.

## Palette

- `--bg` / soot: `#0c0a09`
- `--surface`: `#15110f`
- `--bone`: `#f0e8dc`
- `--muted`: `#b4a99d`
- `--faint`: `#766d64`
- `--amber`: `#e6ad4f`
- `--amber-soft`: `#f3cf8b`
- Lines are warm, transparent separators rather than hard white rules.

## Typography

- Syne is the display voice: wide, slightly eccentric, and used for the hero and section titles.
- DM Mono is reserved for production marks, metadata, filters, skills, and CLI copy.
- Display text uses tight negative tracking; body copy is measured and kept near 65 characters per line.

## Composition

- The first viewport is a full-height stage with a restrained spotlight, framing lines, title, statement, and one primary work action.
- Long-form content is paced as labeled sections, an amber ticker, ledger-style metadata, and open rows.
- Projects and open-source work are evidence rows, not cards. Each row exposes its name, explanation, classification, and direct source link.
- The contact section closes the page as a final frame with one direct email action.

## Interaction

- Filter controls use real buttons with `aria-pressed`; inactive items are removed from the accessibility tree.
- Skill tags focus the nearest project category and scroll the visitor to the relevant evidence.
- The CLI uses a native dialog and supports Cmd/Ctrl+K, a visible close control, and reduced-motion-safe behavior.
- Motion is limited to the opening title/beam reveal, ticker, and intentional hover emphasis. `prefers-reduced-motion` disables continuous animation.
