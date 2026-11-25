# Sizzle & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Rezzrizz25/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Rezzrizz25/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Play more make.fun games: https://make.fun/r/v4m1pbv2

**Sizzle & Serve** is an original one-player cooking game: run a tiny kitchen through a 3-minute lunch shift. Orders land on the board with a countdown, you grab ingredients from the crates, chop veg on the board, grill patties on the grill (before they burn!), stack dishes on the assembly counter and carry finished plates to the serve window. Fast serves pay more, streaks multiply, and three missed orders ends the shift early. The last minute is Rush Hour — orders arrive faster and patience runs shorter.

## How to play

- **Goal:** serve as many correct dishes as you can before the 3:00 shift timer runs out.
- **Orders:** each ticket on the board shows the dish name, the ingredients it needs (ticked off as you plate them) and a patience bar. Serve the exact stack — no more, no less.
- **Prep:** patties must be grilled (4s, then grab them before they burn at ~9s); tomato, lettuce and onion must be chopped on the board (hold still, ~1.4s). Buns and cheese are ready to go.
- **Plating:** carry up to 2 items at a time. Drop ready items on the plate at the Assembly Counter, pick the plate up, and serve it at the window.
- **Scoring:** each dish pays its base (60–100) + up to 40 for serving fast + up to 25 for your streak. Missed orders cost a strike; 3 strikes ends the shift.
- **Recipes:** Classic Stack, Cheesy Melt, Garden Fresh, Double Trouble, Sunset Stack — each with its own prep route, so every ticket pushes a different path through the kitchen.

## Controls

- Mouse: click a station to walk there and use it; click anywhere else to walk there.
- Keys `WASD` / arrows: walk. `E` / `Space`: use the nearest station.
- Keys `1`–`6`: grab bun / patty / tomato / lettuce / cheese / onion straight from its crate.
- `Q`: put down the last carried item. `P`: pause. `R`: restart. `M`: mute.

## Run it

No build step, no network, no libraries — plain static files, all art drawn on canvas, all sounds synthesized with WebAudio.

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome.

## Screenshots

Staged states are deterministic (`?shot=cover|kitchen|assembly|serve&seed=1`):

1. `1-cover.jpg` — busy mid-shift kitchen: three tickets, plate mid-stack, patty on the grill
2. `2-kitchen.jpg` — the kitchen at shift start, full crates, first orders in
3. `3-assembly.jpg` — a Cheesy Melt mid-assembly, tomato being chopped, grilled patty waiting
4. `4-serve.jpg` — a finished Classic Stack carried to the serve window, timer at 0:52

## Files

- `game/index.html`, `game/style.css` — page shell
- `game/src/config.js` — recipes, ingredients, stations, tuning
- `game/src/world.js` — kitchen state, orders, plating and scoring rules
- `game/src/input.js` — keyboard + mouse, click-to-move
- `game/src/render.js` — all canvas art: kitchen, board, chef, HUD, screens
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/shots.js` — deterministic staged states for screenshots
- `game/src/main.js` — frame loop and cooking interactions
- `game/src/random.js` — seeded RNG
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
