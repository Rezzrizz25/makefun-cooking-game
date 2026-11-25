// Sizzle & Serve — shots.js
// Staged screenshot states: ?shot=cover|kitchen|assembly|serve (with an
// optional &seed=) drops the kitchen into a fixed, frozen mid-game moment so
// screenshots are real renders of the game's own code, taken in a browser.
// Every required scene is covered: kitchen + order board, ingredients on the
// counter, a dish mid-assembly, the timer, and a plate ready to serve.

import { RECIPES } from './config.js';

function makeOrder(world, id, recipe, patience, maxPatience) {
  return { id, recipe, patience, maxPatience, born: 0 };
}

function stageCommon(world, opts) {
  world.mode = 'play';
  world.frozen = true;
  world.timeLeft = opts.timeLeft;
  world.elapsed = opts.elapsed;
  world.score = opts.score;
  world.coins = opts.score;
  world.served = opts.served;
  world.streak = opts.streak;
  world.bestStreak = opts.streak;
  world.strikes = opts.strikes;
  world.rush = opts.timeLeft <= 60;
  world.spawnIn = 99;
}

export function applyShot(world, kind) {
  if (kind === 'cover') {
    // The cover: a busy mid-shift kitchen. Three tickets, a plate mid-stack,
    // a patty sizzling on the grill, chopped tomato on the board, 2:14 left.
    stageCommon(world, { timeLeft: 134, elapsed: 46, score: 320, served: 5, streak: 3, strikes: 0 });
    world.orders = [
      makeOrder(world, 6, RECIPES[1], 41, 70), // Cheesy Melt
      makeOrder(world, 7, RECIPES[0], 55, 70), // Classic Stack
      makeOrder(world, 8, RECIPES[3], 22, 70), // Double Trouble
    ];
    world.chef.x = 1060;
    world.chef.y = 580;
    world.chef.tx = 1060;
    world.chef.ty = 580;
    world.hands = [{ id: 'tomato', state: 'chopped' }];
    world.board = { id: 'lettuce', progress: 0.6 };
    world.grill = [{ id: 'patty', progress: 0.7, state: 'cooking', burnIn: 9 }, null];
    world.plate = ['bun', 'patty'];
    world.plateHeld = false;
    world.message = 'Cheesy Melt needs cheese + tomato — chop fast!';
    world.messageLife = 99;
  } else if (kind === 'kitchen') {
    // The whole kitchen at the start of the rush: full crates, two fresh
    // tickets, the chef grabbing a patty, timer nearly full.
    stageCommon(world, { timeLeft: 178, elapsed: 2, score: 0, served: 0, streak: 0, strikes: 0 });
    world.orders = [
      makeOrder(world, 1, RECIPES[0], 68, 70),
      makeOrder(world, 2, RECIPES[2], 63, 70),
    ];
    world.chef.x = 300;
    world.chef.y = 470;
    world.chef.tx = 300;
    world.chef.ty = 470;
    world.hands = [{ id: 'patty', state: 'raw' }];
    world.plate = [];
    world.message = 'First orders are in — grab a patty and fire the grill!';
    world.messageLife = 99;
  } else if (kind === 'assembly') {
    // Mid-assembly: bun + patty + cheese already stacked, tomato being
    // chopped, a grilled patty waiting on the grill, ticket almost due.
    stageCommon(world, { timeLeft: 107, elapsed: 73, score: 410, served: 6, streak: 4, strikes: 0 });
    world.orders = [
      makeOrder(world, 9, RECIPES[1], 18, 70), // Cheesy Melt, urgent
      makeOrder(world, 10, RECIPES[4], 49, 70), // Sunset Stack
    ];
    world.chef.x = 430;
    world.chef.y = 570;
    world.chef.tx = 430;
    world.chef.ty = 570;
    world.board = { id: 'tomato', progress: 0.6 };
    world.grill = [null, { id: 'patty', progress: 1, state: 'done', burnIn: 6 }];
    world.plate = ['bun', 'patty', 'cheese'];
    world.message = 'Chop that tomato — the Cheesy Melt is nearly due!';
    world.messageLife = 99;
  } else if (kind === 'serve') {
    // The payoff: a finished Classic Stack on the plate in the chef's hands
    // at the serve window, the matched ticket ticked, 0:52 on the clock.
    stageCommon(world, { timeLeft: 52, elapsed: 128, score: 540, served: 8, streak: 5, strikes: 1 });
    world.orders = [
      makeOrder(world, 12, RECIPES[0], 33, 70), // Classic Stack — matches plate
      makeOrder(world, 13, RECIPES[2], 58, 70),
    ];
    world.chef.x = 1120;
    world.chef.y = 400;
    world.chef.tx = 1120;
    world.chef.ty = 400;
    world.plate = ['bun', 'patty', 'lettuce'];
    world.plateHeld = true;
    world.message = 'Plate complete! Serve it at the window!';
    world.messageLife = 99;
    world.popups = [{ x: 880, y: 330, text: '+120  SERVED!', color: '#2f9e44', life: 99 }];
  } else {
    return false;
  }
  return true;
}

export const SHOT_KINDS = ['cover', 'kitchen', 'assembly', 'serve'];
