# Design system

## Direction

The site opens as a game: a hedge maze with a website inside (see "The maze" below). The plain portfolio described in the rest of this file is still there, one button away, and is the single source of truth for every word on the site.

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

## The maze

- A snowy hedge maze, entered from a gap in the outer ring, with the heart at the centre. It follows the unmaze project: an 11×11-cell maze (a 23×23 tile grid) built with Wilson's algorithm, so every visit is a different maze. `?maze=<number>` shares one.
- Eight rooms sit in the maze's dead ends and the heart holds Contact. A room is a dialog that clones the plain-page block tagged `data-room="<id>"`, so content is edited once, in `index.html`.
- A lantern lights a small circle; the rest is snow-fog. Rooms glow amber through the fog, stamped rooms turn sky blue, the heart glows red. Footprints stay behind and the fog stays thin where you have been. Hedges watch (a few pairs of glowing eyes).
- The card is a 3×3 bingo of the eight rooms and the heart. It doubles as a table of contents: choose a square and the ghost walks you there.
- A strict judge grades the route at the heart, after unmaze: SOLVED only if the visited tiles are exactly the one simple path, otherwise LOST with the stray blobs counted. Rooms live in dead ends, so reading everything reads as "lost" by design.
- "Model" replays a stand-in for the unmaze model: the true path hidden under a made-up noise schedule, labelled as a stand-in on screen. It is never presented as the trained model.
- Palette additions: hedge `#3b5a47` (dark `#25463a`), lantern `#e9a23b`, route red `#b9442f` (dark `#e2705a`). They sit on the existing cream and navy grounds; fog is the page background colour.
- Escape hatches: the Plain page button, `?plain`, deep links to `#about` and the other plain anchors, a remembered choice, and the no-JavaScript default all show the plain page.
- Touch: swipe runs down a corridor, tap a footprint to walk back to it, and an on-screen d-pad appears on coarse pointers.

## Composition (plain page)

- The first viewport is name, one-line positioning, and profile links (GitHub, X, LinkedIn, email, résumé).
- About is a short bio and availability line. Job history and upstream writeups are not repeated here.
- Experience is two roles (Independent engineering, Accenture) plus a short education block.
- Open source is evidence-style writeups for better-auth and go-ethereum, with PR links — not a ticker, CLI, findings wall, or skills cluster.
- Work is one numbered list, ordered as chosen by the owner (unmaze, Bingo). Only public repos appear. Each project is What / Why / How, plus a Repo link and a Demo link only when a real URL exists. Findings fold into How as one evidence line or one small table. Proof chips (Live demo / Measured / CI) sit under the title and appear only when they are true: a public demo URL, published numbers already on the card, or confirmed green GitHub Actions on that repo.
- The contact section closes the page as a final frame with one direct email action.

## Interaction

- In-page nav uses hash links with a sticky-header offset and a scroll spy on About, Experience, Open source, Work, and Contact. The appearance toggle lives in that same header so offset measurement still tracks wrap height.
- Plain page: motion is limited to the opening title reveal and intentional hover emphasis.
- Maze: lantern flicker, falling snow, blinking eyes and the model's denoising are the motion. `prefers-reduced-motion` turns all of it off, makes steps instant, and shows the model's answer immediately.

## Browser surfaces

- Selection, focus rings, and scrollbars are themed from the palette; `color-scheme` follows the active light or dark appearance.
