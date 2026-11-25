// Sizzle & Serve — world.js
// The kitchen's state: orders, the plate, the grill and board, the chef's
// hands, score and strikes. Pure data plus the rules that change it; drawing
// lives in render.js and the frame loop in main.js.

import {
  BOARD, CHEF_START, GRILL_SECONDS, BURN_SECONDS, CHOP_SECONDS,
  MAX_ORDERS, MAX_STRIKES, ORDER_PATIENCE, RECIPES, SHIFT_SECONDS,
  STATIONS, TICKET_W, TICKET_GAP,
} from './config.js';
import { mulberry32, pickRandom } from './random.js';

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    mode: 'title', // 'title' | 'play' | 'over'
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    streak: 0,
    bestStreak: 0,
    strikes: 0,
    orders: [], // { id, recipe, patience, maxPatience, born }
    nextOrderId: 1,
    spawnIn: 1.5,
    chef: {
      x: CHEF_START.x, y: CHEF_START.y,
      tx: CHEF_START.x, ty: CHEF_START.y, // click-to-move target
      moving: false, face: 1, bob: 0,
    },
    hands: [], // carried items: { id, state } state: 'raw'|'chopped'|'grilled'|'burnt'|'ready'
    board: null, // { id, progress } item being chopped
    grill: [null, null], // slots: { id, progress, state } state: 'cooking'|'done'|'burnt'
    plate: [], // plated ready item ids, in stacking order
    plateHeld: false, // chef is carrying the plate
    popups: [], // { x, y, text, color, life }
    particles: [], // { x, y, vx, vy, life, color, size }
    message: '',
    messageLife: 0,
    flashOrderId: null,
    frozen: false, // staged screenshot states freeze all timers
    muted: false,
    rush: false,
    lastTickSecond: -1,
  };
}

export function stationById(world, id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function ticketRect(index) {
  return {
    x: BOARD.x + 8 + index * (TICKET_W + TICKET_GAP),
    y: BOARD.y + 6,
    w: TICKET_W,
    h: BOARD.h - 12,
  };
}

export function spawnOrder(world, recipeOverride) {
  if (world.orders.length >= MAX_ORDERS) return null;
  const recipe = recipeOverride || pickRandom(world.rng, RECIPES);
  const patience = world.rush ? ORDER_PATIENCE * 0.8 : ORDER_PATIENCE;
  const order = {
    id: world.nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    born: world.elapsed,
  };
  world.orders.push(order);
  return order;
}

export function updateOrders(world, dt, onExpire) {
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.strikes = Math.min(world.strikes + 1, MAX_STRIKES);
      world.streak = 0;
      if (onExpire) onExpire(order);
    }
  }
}

// Plate matching: how many of the plate's items does this order still need?
export function plateMatchesOrder(plate, order) {
  const need = order.recipe.needs.slice();
  let matched = 0;
  for (const item of plate) {
    const idx = need.indexOf(item);
    if (idx !== -1) {
      need.splice(idx, 1);
      matched++;
    }
  }
  return { matched, missing: need, complete: need.length === 0 && plate.length === order.recipe.needs.length };
}

export function bestOrderForPlate(world) {
  let best = null;
  let bestScore = -1;
  for (const order of world.orders) {
    const m = plateMatchesOrder(world.plate, order);
    if (m.complete) return { order, match: m };
    if (m.matched > bestScore) {
      bestScore = m.matched;
      best = { order, match: m };
    }
  }
  return best;
}

export function servePlate(world) {
  const best = bestOrderForPlate(world);
  if (!best || !best.match.complete) {
    return { ok: false, order: best ? best.order : null, match: best ? best.match : null };
  }
  const { order, match } = best;
  const timeBonus = Math.round((order.patience / order.maxPatience) * 40);
  const streakBonus = Math.min(world.streak, 5) * 5;
  const gained = order.recipe.base + timeBonus + streakBonus;
  world.score += gained;
  world.coins += gained;
  world.served += 1;
  world.streak += 1;
  world.bestStreak = Math.max(world.bestStreak, world.streak);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  world.plateHeld = false;
  world.flashOrderId = order.id;
  return { ok: true, order, match, gained, timeBonus, streakBonus };
}

export function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#fff', life: 1.4 });
}

export function addParticles(world, x, y, color, n, spread) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * (spread || 60);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 30,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}

export function setMessage(world, text) {
  world.message = text;
  world.messageLife = 2.2;
}

export function updateParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.life -= dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.popups.length - 1; i >= 0; i--) {
    const p = world.popups[i];
    p.y -= 34 * dt;
    p.life -= dt;
    if (p.life <= 0) world.popups.splice(i, 1);
  }
  if (world.messageLife > 0) world.messageLife -= dt;
}

export function updateChopping(world, dt, sounds) {
  if (!world.board) return;
  world.board.progress += dt / CHOP_SECONDS;
  if (world.board.progress >= 1) {
    const done = { id: world.board.id, state: 'chopped' };
    world.board = null;
    world.hands.push(done);
    addParticles(world, 435, 480, '#5fbf4a', 12, 70);
    sounds.chopDone();
    setMessage(world, 'Chopped! Ready to plate.');
  }
}

export function updateGrill(world, dt, sounds) {
  let anyCooking = false;
  for (let i = 0; i < world.grill.length; i++) {
    const slot = world.grill[i];
    if (!slot) continue;
    if (slot.state === 'cooking') {
      anyCooking = true;
      slot.progress += dt / GRILL_SECONDS;
      if (slot.progress >= 1) {
        slot.state = 'done';
        slot.progress = 1;
        sounds.grillDone();
        setMessage(world, 'Patty grilled — grab it before it burns!');
      }
    } else if (slot.state === 'done') {
      slot.burnIn -= dt;
      if (slot.burnIn <= 0) {
        slot.state = 'burnt';
        sounds.burn();
        setMessage(world, 'Burnt! Toss it in the bin.');
      }
    }
  }
  if (anyCooking) sounds.startSizzle();
  else sounds.stopSizzle();
}

export function grillSlotCenter(index) {
  return { x: 580 + 55 + index * 110, y: 420 + 60 };
}

export function isShiftOver(world) {
  return world.timeLeft <= 0 || world.strikes >= MAX_STRIKES;
}

export function shiftRating(world) {
  if (world.served >= 12) return { stars: 3, title: 'Head Chef!' };
  if (world.served >= 8) return { stars: 2, title: 'Sous Chef' };
  if (world.served >= 4) return { stars: 1, title: 'Line Cook' };
  return { stars: 0, title: 'Kitchen Trainee' };
}
