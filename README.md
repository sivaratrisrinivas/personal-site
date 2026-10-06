# Personal site: a tiny island

The portfolio of Srinivas Sivaratri is a small pixel-art island you walk around. Buildings hold the work, the roles and the pull requests; sparkling dirt hides smaller details you can dig up. Pure HTML, CSS and JavaScript: no framework, no build step, no sprite files (every sprite is drawn in code).

## Playing it

- **Walk** with the arrow keys or WASD, the on-screen d-pad on a phone, or click/tap anywhere to walk there.
- **Use things** with `E`, `Space`, `Enter`, the prompt, or the `A` button: open buildings, talk to the cat, the owl and the signposts, press the button, open the chest, and **dig** where the dirt sparkles.
- **Index** (`I`) lists every place and every buried detail as plain text, with *Read* and *Walk there* buttons. It is also the accessible way in.
- **Night** (header button) switches the theme: windows, lamps and the lighthouse beam light up.
- Progress (places visited, details found) is kept in `localStorage`.

Without JavaScript the same content shows as a normal page (the *codex* in `index.html`).

## Places

| Building | Content |
| --- | --- |
| Lighthouse | Profile |
| Workshop | Independent engineering |
| Tower | Accenture |
| Post office | better-auth pull request |
| Ice house | go-ethereum pull request |
| Lab (and the hedge garden beside it) | unmaze |
| Cinema | Bingo |
| School | Education |
| Library | Résumés and links |
| Dock | Contact |

The hedge garden next to the lab is a real maze, grown with Wilson's algorithm like the unmaze project. Walk it to the chest at its heart and the owl, the strict judge from unmaze, grades your route: exactly one simple path is SOLVED, anything else is LOST.

## Editing content

Every word of real content lives once, in the `#codex` block of `index.html`, as `<section data-spot="<id>">`. The game clones a section into a dialog when you open its building, so edit it there. Short facts, hints and the one-liners from the cat, owl and signposts live in `js/lore.js`.

To add a place: add a section to the codex, an entry to `SPOTS` in `js/lore.js`, a building to `BUILDINGS` in `js/world.js`, and a painter for its `kind` in `js/art.js`.

## Structure

```
personal-site/
├── index.html        # Game chrome, dialogs, and the codex (all real content)
├── css/style.css     # UI frame: top bar, prompts, dialogs, touch controls, no-JS codex
├── js/lore.js        # Places, buried details, NPC lines (plain data)
├── js/maze.js        # Wilson's algorithm, BFS, the strict judge, the denoising schedule
├── js/world.js       # Island map, buildings, roads, garden, digs, decor, collision, pathfinding
├── js/art.js         # Procedural pixel art: ground, sprites, buildings, characters, night lighting
├── js/game.js        # Loop, input, camera, interaction, dialogs, progress, minimap
├── tests/            # node --test: maze logic and world invariants
├── assets/           # Brand mark, Open Graph image, résumé PDFs
└── resume/           # RenderCV sources for the résumés
```

## Tests

```bash
node --test
```

Covers the maze (perfect mazes, solutions, the judge, the denoiser) and the island (everything reachable from the spawn, no overlapping buildings, every detail buried once near its place, the garden solvable, collision and pathfinding).

For development, `?debug` on the URL exposes `window.__island` (player, world, teleport) so a browser test can drive the game.

## Run it

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Deploy

Push to GitHub and enable GitHub Pages on `main`, or drop the folder on Netlify or Vercel.

## Tech

- HTML5 canvas at an integer pixel scale (2 to 5), integer-rounded camera
- Fonts: Silkscreen (UI labels) and DM Mono (body) from Google Fonts, with monospace fallbacks
- Native `<dialog>` for every popup; `prefers-reduced-motion` and `prefers-color-scheme` respected

---

**Built with curiosity** | 2025—26
