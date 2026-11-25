# Dossier — Sizzle & Serve

**Bounty:** Make the best cooking game — `best-cooking-game-20261125-0137` ($250, free entry)
**Site title:** Sizzle & Serve
**Repo (to be created by parent):** `Rezzrizz25/makefun-cooking-game`
**Entries close:** Wed 25 Nov 2026 21:37 +08 · **Result due:** Thu 10 Dec 2026 09:37 +08

## What it is

An original single-player cooking game that runs offline in a desktop browser
from its own static files (HTML/CSS/JS, canvas, no network requests, no
libraries). One 3-minute lunch shift: orders arrive on the board, the player
walks the kitchen, preps ingredients, assembles dishes and serves them before
the ticket patience runs out.

## The loop

1. **Take orders** — tickets appear on the order board with the dish, its
   ingredients and a patience bar (max 4 at once; a new one every ~14s, every
   ~9s in Rush Hour, the last 60 seconds).
2. **Gather** — six crates: bun, patty, tomato, lettuce, cheese, onion.
   Carry up to 2 items. Keys 1–6 grab straight from a crate.
3. **Prep** — patties grill in 4s (grab before ~9s or they burn and must be
   binned); tomato/lettuce/onion chop on the board in ~1.4s. Bun and cheese
   are ready as-is.
4. **Assemble** — stack ready items on the plate at the Assembly Counter.
   The ticket ticks off ingredients as they land.
5. **Serve** — carry the finished plate to the serve window and press E.
   Exact match only. Score = dish base (60–100) + up to 40 time bonus +
   up to 25 streak bonus. Three expired orders = shift over.

## Recipes (5)

Classic Stack (bun+patty+lettuce), Cheesy Melt (bun+patty+cheese+tomato),
Garden Fresh (bun+lettuce+tomato+onion), Double Trouble
(bun+patty+patty+cheese), Sunset Stack (bun+patty+tomato+onion). Each forces a
different route through the kitchen (grill vs. board vs. grab-and-go).

## Controls

Mouse click-to-move / click station to use; WASD or arrows to walk; E or
Space to use the nearest station; 1–6 grab ingredient; Q put down; P pause;
R restart; M mute. Start and game-over screens, pause overlay, toast hints,
score popups, particles and synthesized WebAudio sounds (sizzle, chop, serve
jingle, buzzer).

## Screenshots (real renders, `?shot=` staged states, seed 1)

1. `1-cover.jpg` — busy mid-shift: 3 tickets, plate mid-stack (bun+patty),
   patty grilling, lettuce chopping, timer 2:14, score 320.
2. `2-kitchen.jpg` — shift start: full crates, 2 fresh tickets, chef holding
   a raw patty, timer 2:58.
3. `3-assembly.jpg` — Cheesy Melt mid-assembly (bun+patty+cheese stacked),
   tomato chopping at 60%, grilled patty waiting, urgent ticket at 18s.
4. `4-serve.jpg` — finished Classic Stack in hand at the serve window,
   matched ticket, "+120 SERVED!" popup, timer 0:52, score 540.

## Structure (for the judge's source outline)

- `game/src/config.js` — recipes, ingredients, stations, tuning
- `game/src/world.js` — state, orders, plating, scoring (`servePlate`,
  `plateMatchesOrder`, `spawnOrder`, `updateGrill`, `updateChopping`)
- `game/src/input.js` — keyboard + mouse, click-to-move (`nearestStation`,
  `stepChefTowards`)
- `game/src/render.js` — all canvas art (`drawIngredientIcon`,
  `drawOrderBoard`, `drawStation`, `drawChef`, `drawTopBar`)
- `game/src/audio.js` — WebAudio synth (`createSoundEngine`)
- `game/src/shots.js` — staged screenshot states (`applyShot`)
- `game/src/main.js` — frame loop and station interactions (`useGrill`,
  `useBoard`, `usePlate`, `useWindow`)
- `game/src/random.js` — seeded RNG (`mulberry32`)
- `main.ts` — Node 22 entrypoint, copies game/ + screenshots/, writes
  dossier.json via `vendor/makefun-game.ts` (kit copy, unchanged)

## Verification

- `MAKEFUN_OUTPUT_DIR=out node main.ts` run locally; kit check result in
  SUBMIT-STATUS.md (written by parent after submit; pre-submit check run
  during build — see report).
- Game played headlessly in Chromium: title screen renders, staged shots
  render, no console errors.
