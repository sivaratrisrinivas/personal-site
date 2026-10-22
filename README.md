# Personal site: a pixel island

The portfolio of Srinivas Sivaratri is a small pixel-art island you walk around. Buildings hold the work, the roles and the pull requests, plus two favourites rooms (books and films). Pure HTML, CSS and JavaScript: no framework, no build step. Every sprite is drawn in code; the only content image is one public-domain book cover in `assets/favourites/`.

## Playing it

- **Walk** with the arrow keys or WASD, the on-screen d-pad on a phone, or click/tap anywhere to walk there.
- **Use things** with `E`, `Space`, `Enter`, the prompt, or the `A` button: open buildings, read the signposts, talk to the owl, press the button, open the chest, and **dig** where the dirt sparkles.
- **Index** (`I`) lists every place, the favourites and the three hidden details as plain text, with *Read* and *Walk there* buttons. It is also the accessible way in.
- **Night** (header button) switches the theme: windows, lamps and the lighthouse beam light up.
- Nothing is tracked or scored; only the theme choice is kept in `localStorage`.

Without JavaScript the same content shows as a normal page (the *codex* in `index.html`).

## Places

| Building | Content |
| --- | --- |
| Lighthouse | Profile and education |
| Workshop | Experience (independent engineering, Accenture) |
| Post office | better-auth pull request |
| Ice house | go-ethereum pull request |
| Lab (and the hedge garden beside it) | unmaze |
| Cinema | Bingo |
| Reading Room | Favourites, 2026: books |
| Picture House | Favourites, 2026: films |
| Dock | Contact (email, profiles, résumé) |

Nine places in all. Three hidden details: a buried note on the hedge's algorithm, the chest at the maze's heart, and the refusal button.

The hedge garden next to the lab is a real maze, grown with Wilson's algorithm like the unmaze project. Walk it to the chest at its heart and the owl, the strict judge from unmaze, grades your route: exactly one simple path is SOLVED, anything else is LOST.

## Editing content

Every word of real content lives once, in the `#codex` block of `index.html`, as `<section data-spot="<id>">`. The game clones a section into a dialog when you open its building, so edit it there. Place names, the three hidden details, and the owl, button and signpost lines live in `js/lore.js`.

To add a place: add a section to the codex, an entry to `SPOTS` in `js/lore.js`, a building to `BUILDINGS` in `js/world.js`, and a painter for its `kind` in `js/art.js`.

## Structure

```
personal-site/
├── index.html        # Game chrome, dialogs, and the codex (all real content)
├── css/style.css     # UI frame: top bar, prompts, dialogs, touch controls, no-JS codex
├── js/lore.js        # Places, hidden details, owl/button/signpost lines (plain data)
├── js/maze.js        # Wilson's algorithm, BFS, the strict judge, the denoising schedule
├── js/world.js       # Island map, buildings, roads, garden, digs, decor, collision, pathfinding
├── js/art.js         # Procedural pixel art: ground, sprites, buildings, characters, night lighting
├── js/favourites.js  # Favourites data (books, films)
├── js/favourites-view.js # Renders the favourites rooms and Index list
├── js/game.js        # Loop, input, camera, interaction, dialogs, minimap
├── tests/            # node --test: maze, world invariants, favourites
├── assets/           # Brand mark, icons, Open Graph image, résumé PDF, one book cover
└── resume/           # RenderCV source for the résumé
```

## Tests

```bash
node --test
```

Covers the maze (perfect mazes, solutions, the judge, the denoiser) and the island (nine places and three hidden details, everything reachable from the spawn, no overlapping buildings, the garden solvable, collision and pathfinding) and the favourites data.

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
