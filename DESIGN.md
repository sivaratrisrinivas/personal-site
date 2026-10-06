# Design system

## Direction

The whole site is one small game: a bright pixel-art island you walk around, with the work in its buildings and smaller details buried in the dirt. It should feel like a toy someone made with care: colourful, a little weird, instantly readable, and honest about the work it holds. The island is the interface; there is no second, plainer site behind it (the Index dialog and the no-JavaScript codex are accessibility paths, not alternatives).

## Palette

Two moods from one set of accents. Colour does the wayfinding: each building has its own roof colour, and that colour is reused on its dialog header, its Index row and its minimap marker.

- Day: sky water `#3a86e8`, grass `#5ec24c`, sand `#f6dfa8`, dirt road `#dba869`, cream UI panels `#fff6e0`, ink `#1d1b3a`.
- Night (theme toggle, or the system setting on first visit): the same scene multiplied by indigo `rgb(70,80,150)`, with lights cut back in: lamp posts, lit windows, the lantern the player carries, the cinema marquee, the lab monitor, and a rotating lighthouse beam. UI panels become `#292561`.
- Accents shared by both: pink `#ff4d8d`, cyan `#27d3cc`, lemon `#ffd23f`, violet `#8e63ff`, coral `#ff5d6c`, lime `#5ec24c`.
- Roof colours: coral lighthouse, teal workshop, blue tower, pink post office, ice-white ice house, violet lab, yellow cinema, brick school, green library, wood dock.

## Typography

- Silkscreen (pixel) for labels, buttons, titles and kickers: uppercase for small labels and buttons, mixed case for big titles.
- DM Mono for body copy, at 13 to 16px, measured to about 65 characters.
- Monospace fallbacks keep the layout intact if the web fonts do not load.

## The world

- 48 × 36 tiles of 16px, drawn at an integer scale (2 on phones, 3 on laptops, up to 5), camera rounded to whole pixels so nothing shimmers.
- Everything is drawn in code on small canvases (`js/art.js`): no image files. Trees come in green, teal and cherry-blossom pink; the giant mushrooms in red, cyan and violet.
- Buildings are cached sprites with live overlays: workshop chimney smoke, letters drifting out of the post office window (it leaks), mist at the ice house, the lab's monitor denoising noise into a path, the cinema's chasing marquee bulbs, the school flag, the tower's blinking antenna.
- Sorting is by baseline, so you walk behind trees and buildings. Collision is a small feet box against solid tiles, with corner assist.
- The hedge garden is the unmaze maze, stamped into the map tile for tile. The owl is the strict judge.
- A minimap (desktop) shows the island, buildings by colour, and a green mark on visited ones.

## UI frame

- Panels are hard-edged and outlined (3px ink border, offset ink shadow) like game UI, never rounded or blurred. Buttons press down into their shadow.
- The top bar is always dark indigo with a pink underline, so the world is the brightest thing on screen. It holds the brand, progress (Places x/10, Details x/17), the Index, Résumé, Say hi, and Night controls.
- A prompt chip appears at the bottom whenever something can be used: key cap, then the verb ("Enter the lab", "Dig here"). On touch it also becomes the `A` button beside the d-pad.
- Dialogs use native `<dialog>`. A building's dialog has a header in its roof colour, the real content below, and a footer saying how many details are buried nearby.
- Real content (roles, pull requests, project cards) is cloned from the codex and restyled with the same pixel panels, chips and buttons.

## Motion

Water ripples, drifting cloud shadows, butterflies, falling dig dust, confetti on the last detail, lantern flicker, and a cat who wanders. `prefers-reduced-motion` turns all of it off: no ripples, no clouds, no butterflies, no particles, no beam rotation, and the day/night switch snaps. Walking itself is the game and still works.

## Accessibility

- Keyboard play (arrows/WASD, `E`/`Space`/`Enter`, `I`), a focusable canvas with a descriptive label, and a live region for speech and status.
- Index dialog: every place and every buried detail as text, with *Read* (open directly) and *Walk there*. Nothing requires playing to read.
- 44px minimum targets, visible focus rings, native dialog focus handling, contrast of at least 4.5:1 for every text and background pair in both themes (lowest measured 4.74).
- No-JavaScript visitors and crawlers get the codex as a normal styled page.
