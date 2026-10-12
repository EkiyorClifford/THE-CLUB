# The Club

A private board-game club. This repository is a local prototype of the lobby, challenges, friends, messages, and a playable Reversi table.

There is no Supabase project in this environment. Nothing is authenticated, and nothing is stored on a server. The browser keeps the sample club in `sessionStorage`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm test` — Vitest unit tests for Reversi and club rules
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run test:e2e` — Playwright smoke test. Install a browser first with `npx playwright install chromium`.

## What works on this device

- Reversi rules: legal moves, flips, forced passes, scoring, resignation, and local sudden-death clocks.
- Accepting, declining, withdrawing, and expiring challenges. A challenge lasts 15 minutes. You can have one pending outgoing challenge.
- A match screen with both seats on one device, a result, and a rematch that starts only after the other seat accepts.
- Friend requests, profiles, a sample Reversi rating list, and text messages between friends.

## What is not real yet

- Accounts, club invitations, and Row Level Security.
- Server-authoritative moves, clocks, and live updates between two browsers.
- Rating changes. Sample numbers never move, including after a rated result.
- Chess and Scrabble. They are named, and they cannot be played.
- Server-side blocking. This device can block a member, and the domain refuses messages and challenges both ways, but a future server must enforce that itself.

See `docs/architecture.md` and `docs/design.md`.
