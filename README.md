# Codacade — Retro 80s Web Arcade

A retro 80s-themed web arcade featuring classic and modern mini-games with neon Outrun/synthwave aesthetics.

## How to Run

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Deployment

This site is automatically deployed to GitHub Pages via GitHub Actions whenever changes are pushed to the `main` branch.

URL: [https://natcodakid.github.io/codacade/](https://natcodakid.github.io/codacade/)

## Main Files

- `index.html` — Single-page app shell
- `css/style.css` — Retro design system
- `src/main.js` — Main entry point
- `src/router.js` — SPA router and game registry
- `src/auth.js` — JWT auth (client-side prototype)
- `src/leaderboard.js` — Score tracking and leaderboard
- `src/games/hangman/` — Hangman game
- `src/games/star-blaster/` — Star Blaster (Galaga-style) game
- `src/games/neon-snake/` — Neon Snake game

## Skills Used

- game-development
- auth-implementation-patterns
- ui-ux-pro-max
