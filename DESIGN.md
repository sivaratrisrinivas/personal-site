# Design system

## Direction

The portfolio is Soft daylight: a cream surface with a quiet sky accent, where shipped work is the evidence. The page uses labeled sections and editorial type to make a short archive feel intentional without turning the work into a card wall or a findings wall.

## Brand mark

`assets/screening-mark.png` is the project emblem: a sky geometric aperture framed by four crop marks, with interlocking negative space that quietly suggests the SS initials. It is used in the header, favicon, and Apple touch icon, and is designed to remain legible at small sizes.

## Palette

Soft daylight. Light is the default theme. Dark inverts the same family carefully: cream-ish text on a deep warm charcoal/navy-adjacent ground, with a readable sky accent — not pure black and neon.

- `--color-bg` / cream: `#f4f0e6` (dark: `#1b2228`)
- `--color-surface`: `#ebe6da` (dark: `#242c34`)
- `--color-text` / warm charcoal: `#2c2a26` (dark: cream-ish `#ede8dc`)
- `--color-muted`: `#565248` (dark: `#b8b2a6`)
- `--color-faint`: `#6f6a61` (dark: `#9a9488`)
- `--accent` / soft sky: `#2e6584` (dark: `#7aadc2`)
- `--accent-strong`: `#24536e` (dark: `#8fbfcf`)
- Lines are warm, transparent separators rather than hard rules.

The first visit follows `prefers-color-scheme`. After the header toggle is used, the choice is stored in `localStorage` and `theme-color` updates with the active background.

## Typography

- Syne is the display voice: wide, slightly eccentric, and used for the hero and section titles.
- DM Mono is reserved for production marks, metadata, What/Why/How labels, and project copy.
- Display text uses tight negative tracking (floor −0.04em); functional labels stay at or above the 11px legibility floor. Body copy is measured and kept near 65 characters per line.

## Composition

- The first viewport is name, one-line positioning, and profile links (GitHub, X, LinkedIn, email, résumé).
- About is a short bio and availability line. Job history and upstream writeups are not repeated here.
- Experience is two roles (Independent engineering, Accenture) plus a short education block.
- Open source is evidence-style writeups for better-auth and go-ethereum, with PR links — not a ticker, CLI, findings wall, or skills cluster.
- Work is one numbered list. Each project is What / Why / How, plus GitHub and a live demo only when a real URL exists. Findings fold into How as one evidence line or one small table. Proof chips (Live demo / Measured / CI) sit under the title and appear only when they are true: a public demo URL, published numbers already on the card, or confirmed green GitHub Actions on that repo.
- The contact section closes the page as a final frame with one direct email action.

## Interaction

- In-page nav uses hash links with a sticky-header offset and a scroll spy on About, Experience, Open source, Work, and Contact. The appearance toggle lives in that same header so offset measurement still tracks wrap height.
- Motion is limited to the opening title reveal and intentional hover emphasis. `prefers-reduced-motion` disables continuous animation.

## Browser surfaces

- Selection, focus rings, and scrollbars are themed from the palette; `color-scheme` follows the active light or dark appearance.
