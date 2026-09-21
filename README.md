# Personal Portfolio

A Soft daylight portfolio for Srinivas Sivaratri. Pure HTML/CSS/JS, no frameworks.

## Sections

1. **Hero** — Name, one-line positioning, GitHub / X / LinkedIn / email / résumé
2. **About** — Short bio and availability; job history and upstream live in their own sections
3. **Experience** — Independent engineering and Accenture, with education underneath
4. **Open source** — better-auth and go-ethereum writeups with PR links
5. **Work** — One project list; each card is What / Why / How plus GitHub and a live demo when real
6. **Contact** — Email, GitHub, X, LinkedIn, résumé PDF
7. **The game** — Optional `/game` briefing (quiet footer link: “The game”). Three short acts unlock Experience, Open source, and four project clips using only published facts. Dedicated OG; main recruiter card stays put.

## Quick Start

```bash
python -m http.server 8000
# visit http://localhost:8000
# game: http://localhost:8000/game
```

## Structure

```
personal-site/
├── index.html      # Live site markup
├── game/           # /game briefing (index.html, CSS, JS)
├── vercel.json     # Rewrites /game → /game/index.html
├── css/style.css   # Visual system and responsive layout
├── js/script.js    # Smooth navigation, theme, and cursor
├── assets/         # Brand assets, Open Graph images, and résumé PDF
├── resume/         # RenderCV source and generated résumé artifacts
└── README.md
```

## Deploy

Push to GitHub → enable GitHub Pages on `main` branch. Or drag-drop to Netlify / `vercel` CLI.

## Tech

- HTML5 / CSS3 / Vanilla JS
- Fonts: Syne + DM Mono (Google Fonts)
- Custom cursor, responsive layout

---

**Built with simplicity** | 2025—26
