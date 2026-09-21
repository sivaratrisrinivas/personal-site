# Design system

## Direction

The portfolio is a daylight screening room: a warm, inviting surface where shipped work is the evidence. The page uses labeled sections and editorial type to make a short archive feel intentional without turning the work into a card wall or a findings wall.

## Brand mark

`assets/screening-mark.png` is the project emblem: an amber geometric aperture framed by four crop marks, with interlocking negative space that quietly suggests the SS initials. It is used in the header, favicon, and Apple touch icon, and is designed to remain legible at small sizes.

## Palette

Light is the default theme.

- `--bg` / ivory: `#f7f1e6`
- `--surface`: `#efe6d8`
- `--bone`: `#261c10`
- `--muted`: `#4a3d2c`
- `--faint`: `#6f614d`
- `--amber`: `#9a4f0d`
- `--amber-soft`: `#7c3f06`
- Lines are warm, transparent separators rather than hard rules.

## Typography

- Syne is the display voice: wide, slightly eccentric, and used for the hero and section titles.
- DM Mono is reserved for production marks, metadata, What/Why/How labels, and project copy.
- Display text uses tight negative tracking (floor −0.04em); functional labels stay at or above the 11px legibility floor. Body copy is measured and kept near 65 characters per line.

## Composition

- The first viewport is name, one-line positioning, and profile links (GitHub, X, LinkedIn, email, résumé).
- About is a short bio and availability line. Job history and upstream writeups are not repeated here.
- Experience is two roles (Independent engineering, Accenture) plus a short education block.
- Open source is evidence-style writeups for better-auth, go-ethereum, and peft, with PR links — not a ticker, CLI, findings wall, or skills cluster.
- Work is one numbered list. Each project is What / Why / How, plus GitHub and a live demo only when a real URL exists. Findings fold into How as one evidence line or one small table.
- The contact section closes the page as a final frame with one direct email action.

## Interaction

- In-page nav uses hash links with a sticky-header offset and a scroll spy on About, Experience, Open source, Work, and Contact.
- Motion is limited to the opening title reveal and intentional hover emphasis. `prefers-reduced-motion` disables continuous animation.

## Browser surfaces

- Selection, focus rings, and scrollbars are themed from the palette; `color-scheme` is light.
