# Personal Portfolio

A portfolio for Srinivas Sivaratri that opens as a game: a hedge maze with a website inside. Pure HTML/CSS/JS, no frameworks, no build step.

## The maze

Walk a ghost with a lantern through a snowy hedge maze (arrow keys, WASD, swipes, or tap a footprint). Eight rooms hide in the dead ends (profile, two roles, two upstream PRs, two projects, résumés) and the heart in the middle holds contact. Your card is a 3×3 bingo of the nine; any line is a BINGO. A strict judge, borrowed from the unmaze project, grades your route at the heart: one clean path is SOLVED, anything else is LOST, so reading everything counts as getting lost. Press `M` to see a stand-in for the unmaze model denoise the answer, `C` for your card.

- `?maze=<number>` loads (and shares) a specific maze; every visit is otherwise a new one.
- The plain page is one button away (`Plain page`), and also what you get from `?plain`, a deep link such as `/#work`, a remembered choice, or with JavaScript off.
- Every room is cloned from the plain page's own markup (`data-room="<id>"`), so content is edited once in `index.html`.

## Sections of the plain page

1. **Hero** — Name, one-line positioning, GitHub / X / LinkedIn / email / résumé, plus Backend, Full-stack and Product résumés
2. **About** — Short bio and availability; job history and upstream live in their own sections
3. **Experience** — Independent engineering and Accenture, with education underneath
4. **Open source** — better-auth and go-ethereum writeups with PR links
5. **Work** — One project list; each card is What / Why / How plus Repo and a Demo link when real
6. **Contact** — Email, GitHub, X, LinkedIn, résumé PDF and the three role résumés

## Quick Start

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Structure

```
personal-site/
├── index.html      # Live site markup
├── css/style.css   # Visual system and responsive layout
├── css/game.css    # Maze layer: stage, dialogs, card, d-pad
├── js/script.js    # Smooth navigation, theme, and cursor (plain page)
├── js/maze.js      # Pure maze logic: Wilson's algorithm, BFS, rooms, the judge, the stand-in denoiser
├── js/game.js      # Canvas, fog, input, dialogs, card, mode switch
├── tests/          # node --test: unit tests for maze.js
├── assets/         # Brand assets, Open Graph image, and résumé PDFs
├── resume/         # RenderCV sources (main, Backend, Full-stack, Product Engineer)
└── README.md
```

## Tests

```bash
node --test   # maze.js: perfect mazes, solutions, room placement, the judge, the denoiser
```

## Deploy

Push to GitHub → enable GitHub Pages on `main` branch. Or drag-drop to Netlify / `vercel` CLI.

## Tech

- HTML5 / CSS3 / Vanilla JS
- Fonts: Syne + DM Mono (Google Fonts)
- Custom cursor, responsive layout

---

**Built with simplicity** | 2025—26
