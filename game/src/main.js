// Sizzle & Serve — main.js
// The frame loop and the cooking rules: walking, picking up, chopping,
// grilling, plating and serving. Wires input + world + render together and
// boots the game (title screen, staged ?shot= states, game over).

import {
  BURN_SECONDS, CARRY_LIMIT, CHEF_START, INGREDIENTS, RECIPES,
  SHIFT_SECONDS, STATIONS, VIEW_H, VIEW_W,
} from './config.js';
import {
  addParticles, addPopup, bestOrderForPlate, createWorld, isShiftOver,
  plateMatchesOrder, servePlate, setMessage, spawnOrder, stationById,
  updateChopping, updateGrill, updateOrders, updateParticles,
} from './world.js';
import { createSoundEngine } from './audio.js';
import {
  consumeClick, consumePress, createInput, moveVector, nearestStation,
  stationAtPoint, stepChefTowards,
} from './input.js';
import { renderGame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const sounds = createSoundEngine();

function readSeed() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed'));
  return Number.isFinite(seed) && seed > 0 ? Math.floor(seed) : 1;
}

let world = createWorld(readSeed());
let pendingStation = null; // station the chef is walking to use
let lastTime = performance.now();

function startShift() {
  world = createWorld(readSeed());
  world.mode = 'play';
  world.muted = sounds.isMuted();
  spawnOrder(world, RECIPES[0]);
  spawnOrder(world, RECIPES[2]);
  sounds.unlock();
  setMessage(world, 'Shift started! First orders are in.');
}

function endShift() {
  world.mode = 'over';
  sounds.stopSizzle();
  sounds.serve();
}

function restartFromTitle() {
  startShift();
}

// --- interactions -----------------------------------------------------------

function tryPickupFromCrate(world, station) {
  if (world.hands.length >= CARRY_LIMIT) {
    setMessage(world, 'Hands full! Use what you carry first.');
    sounds.bad();
    return;
  }
  const ing = INGREDIENTS[station.gives];
  // Bun and cheese need no prep, so they are ready to plate at once; items
  // that need chopping or grilling start raw until prepped.
  const state = ing.prep === 'none' ? 'ready' : 'raw';
  world.hands.push({ id: ing.id, state });
  sounds.pickup();
  addParticles(world, world.chef.x, world.chef.y - 40, ing.color, 8, 50);
}

function heldItemIndex(world, id) {
  return world.hands.findIndex((h) => h.id === id);
}

function useBoard(world) {
  if (world.board) {
    setMessage(world, 'Already chopping — wait for it!');
    return;
  }
  const idx = world.hands.findIndex((h) => INGREDIENTS[h.id].prep === 'chop' && h.state === 'raw');
  if (idx === -1) {
    setMessage(world, 'Bring a tomato, lettuce or onion to chop.');
    sounds.bad();
    return;
  }
  const item = world.hands.splice(idx, 1)[0];
  world.board = { id: item.id, progress: 0 };
  sounds.chop();
  setMessage(world, `Chopping ${INGREDIENTS[item.id].label}…`);
}

function useGrill(world) {
  const idx = heldItemIndex(world, 'patty');
  if (idx !== -1) {
    const free = world.grill.findIndex((s) => s === null);
    if (free === -1) {
      setMessage(world, 'Grill is full — wait for a patty.');
      sounds.bad();
      return;
    }
    world.hands.splice(idx, 1);
    world.grill[free] = { id: 'patty', progress: 0, state: 'cooking', burnIn: BURN_SECONDS };
    sounds.grillOn();
    setMessage(world, 'Patty on the grill!');
    return;
  }
  // pick a finished patty back up
  const done = world.grill.findIndex((s) => s && s.state === 'done');
  if (done !== -1) {
    if (world.hands.length >= CARRY_LIMIT) {
      setMessage(world, 'Hands full!');
      sounds.bad();
      return;
    }
    world.grill[done] = null;
    world.hands.push({ id: 'patty', state: 'grilled' });
    sounds.pickup();
    return;
  }
  const burnt = world.grill.findIndex((s) => s && s.state === 'burnt');
  if (burnt !== -1) {
    world.grill[burnt] = null;
    setMessage(world, 'Burnt patty tossed. The grill is free again.');
    sounds.drop();
    return;
  }
  setMessage(world, 'Bring a raw patty to grill.');
  sounds.bad();
}

function useTrash(world) {
  if (world.hands.length === 0) {
    setMessage(world, 'Nothing to throw away.');
    return;
  }
  const item = world.hands.pop();
  sounds.drop();
  addParticles(world, world.chef.x, world.chef.y - 30, '#999', 8, 40);
  setMessage(world, `Tossed the ${INGREDIENTS[item.id].label}.`);
}

function usePlate(world) {
  if (world.plateHeld) {
    // put the plate back down
    world.plateHeld = false;
    sounds.drop();
    return;
  }
  if (world.hands.length > 0) {
    // add a ready item to the plate
    const idx = world.hands.findIndex((h) => h.state !== 'raw');
    if (idx === -1) {
      setMessage(world, 'That still needs prep — chop it or grill it first!');
      sounds.bad();
      return;
    }
    const item = world.hands.splice(idx, 1)[0];
    // keep the plate useful: warn if no open order wants this item
    const wanted = world.orders.some((o) => {
      const m = plateMatchesOrder(world.plate.concat([item.id]), o);
      return m.matched > plateMatchesOrder(world.plate, o).matched;
    });
    world.plate.push(item.id);
    sounds.drop();
    addParticles(world, 1070, 480, INGREDIENTS[item.id].color, 10, 50);
    if (!wanted) setMessage(world, 'Hmm — no open order needs that. You can still serve it, but it scores less.');
    return;
  }
  if (world.plate.length > 0) {
    world.plateHeld = true;
    sounds.pickup();
    setMessage(world, 'Plate in hand — take it to the SERVE window!');
    return;
  }
  setMessage(world, 'The plate is empty. Add ingredients first.');
  sounds.bad();
}

function useWindow(world) {
  if (!world.plateHeld || world.plate.length === 0) {
    setMessage(world, 'Bring a finished plate here to serve.');
    sounds.bad();
    return;
  }
  const result = servePlate(world);
  if (!result.ok) {
    setMessage(world, 'That plate matches no order — check the tickets!');
    sounds.bad();
    return;
  }
  sounds.serve();
  addPopup(world, 1130, 260, `+${result.gained}  ${result.order.recipe.name.toUpperCase()}!`, '#7CFC00');
  addParticles(world, 1130, 250, '#ffd23e', 24, 110);
  if (world.streak >= 3) {
    addPopup(world, 1130, 300, `STREAK x${world.streak}!`, '#ffb703');
  }
  setMessage(world, `Served ${result.order.recipe.name} — +${result.gained} (time +${result.timeBonus}, streak +${result.streakBonus}).`);
}

function useStation(world, station) {
  if (!station) return;
  if (station.kind === 'crate') tryPickupFromCrate(world, station);
  else if (station.kind === 'board') useBoard(world);
  else if (station.kind === 'grill') useGrill(world);
  else if (station.kind === 'trash') useTrash(world);
  else if (station.kind === 'plate') usePlate(world);
  else if (station.kind === 'window') useWindow(world);
}

// --- per-frame update -------------------------------------------------------

function updatePlaying(world, dt) {
  if (world.frozen) {
    updateParticles(world, 0);
    return;
  }
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (!world.rush && world.timeLeft <= 60) {
    world.rush = true;
    setMessage(world, 'RUSH HOUR! Orders come faster now!');
    sounds.tick();
  }
  const wholeSecond = Math.floor(world.timeLeft);
  if (wholeSecond !== world.lastTickSecond) {
    world.lastTickSecond = wholeSecond;
    if (wholeSecond <= 10 && wholeSecond > 0) sounds.tick();
  }
  // spawn orders on a timer (faster in the rush)
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < 4) {
    spawnOrder(world);
    world.spawnIn = world.rush ? 9 : 14;
    sounds.tick();
  }
  updateOrders(world, dt, (order) => {
    sounds.bad();
    addPopup(world, 640, 140, `Order #${order.id} walked out!`, '#ff4757');
    setMessage(world, `Order #${order.id} (${order.recipe.name}) expired — strike ${world.strikes}/3.`);
  });
  updateChopping(world, dt, sounds);
  updateGrill(world, dt, sounds);
  updateParticles(world, dt);
  if (isShiftOver(world)) endShift();
}

function updateChefMovement(world, dt) {
  const vec = moveVector(input);
  if (vec.dx !== 0 || vec.dy !== 0) {
    pendingStation = null;
    world.chef.tx = world.chef.x + vec.dx * 10;
    world.chef.ty = world.chef.y + vec.dy * 10;
    const nx = world.chef.x + vec.dx * 265 * dt;
    const ny = world.chef.y + vec.dy * 265 * dt;
    world.chef.x = Math.max(24, Math.min(1256, nx));
    world.chef.y = Math.max(200, Math.min(776, ny));
    world.chef.face = vec.dx < 0 ? -1 : 1;
    world.chef.moving = true;
    world.chef.bob += dt * 12;
  } else if (world.chef.moving) {
    const arrived = stepChefTowards(world, dt);
    if (arrived && pendingStation) {
      const station = pendingStation;
      pendingStation = null;
      useStation(world, station);
    }
  } else {
    world.chef.moving = false;
  }
}

function handleClick(world) {
  const click = consumeClick(input);
  if (!click) return;
  const station = stationAtPoint(click.x, click.y);
  if (station) {
    // walk to the station's near edge, then use it
    const cx = Math.max(station.x, Math.min(world.chef.x, station.x + station.w));
    const cy = Math.max(station.y, Math.min(world.chef.y, station.y + station.h));
    const dx = world.chef.x - cx;
    const dy = world.chef.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    world.chef.tx = cx + (dx / d) * 46;
    world.chef.ty = cy + (dy / d) * 46;
    world.chef.tx = Math.max(24, Math.min(1256, world.chef.tx));
    world.chef.ty = Math.max(200, Math.min(776, world.chef.ty));
    pendingStation = station;
    world.chef.moving = true;
    if (Math.hypot(world.chef.x - world.chef.tx, world.chef.y - world.chef.ty) < 60) {
      pendingStation = null;
      useStation(world, station);
    }
  } else {
    world.chef.tx = Math.max(24, Math.min(1256, click.x));
    world.chef.ty = Math.max(200, Math.min(776, click.y));
    pendingStation = null;
    world.chef.moving = true;
  }
}

function handleKeys(world) {
  if (consumePress(input, 'm')) {
    const muted = sounds.toggleMute();
    world.muted = muted;
    setMessage(world, muted ? 'Muted.' : 'Sound on.');
  }
  if (consumePress(input, 'p') && world.mode === 'play') {
    world.paused = !world.paused;
    if (world.paused) sounds.stopSizzle();
  }
  if (consumePress(input, 'r') && (world.mode === 'over' || world.mode === 'play')) {
    restartFromTitle();
    return;
  }
  if (world.mode === 'title') {
    if (consumePress(input, 'enter') || consumePress(input, ' ')) startShift();
    return;
  }
  if (world.mode === 'over') {
    if (consumePress(input, 'enter') || consumePress(input, ' ')) restartFromTitle();
    return;
  }
  if (world.paused) return;
  // number keys grab straight from a crate (1=bun 2=patty 3=tomato 4=lettuce 5=cheese 6=onion)
  const crateOrder = ['crate-bun', 'crate-patty', 'crate-tomato', 'crate-lettuce', 'crate-cheese', 'crate-onion'];
  for (let i = 0; i < crateOrder.length; i++) {
    if (consumePress(input, String(i + 1))) {
      tryPickupFromCrate(world, stationById(world, crateOrder[i]));
    }
  }
  if (consumePress(input, 'e') || consumePress(input, ' ')) {
    const station = nearestStation(world.chef.x, world.chef.y, 78);
    if (station) useStation(world, station);
    else setMessage(world, 'Walk up to a station to use it.');
  }
  if (consumePress(input, 'q')) {
    // Q drops the last carried item back (handy when hands are full)
    if (world.hands.length > 0) {
      const item = world.hands.pop();
      sounds.drop();
      setMessage(world, `Put down the ${INGREDIENTS[item.id].label}.`);
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  handleKeys(world);
  if (world.mode === 'play' && !world.paused) {
    handleClick(world);
    updateChefMovement(world, dt);
    updatePlaying(world, dt);
  } else if (world.mode === 'title') {
    // clicking anywhere on the title screen starts the shift
    if (consumeClick(input)) startShift();
  } else if (world.mode === 'over') {
    if (consumeClick(input)) restartFromTitle();
  }
  // clear consumed presses each frame so a held key does not retrigger
  input.pressed.clear();
  renderGame(ctx, world);
  requestAnimationFrame(frame);
}

// --- boot -------------------------------------------------------------------

function boot() {
  const params = new URLSearchParams(window.location.search);
  // ?debug=1 exposes the live world for automated play-testing only.
  if (params.get('debug') === '1') {
    Object.defineProperty(window, '__world', { get: () => world });
  }
  const shot = params.get('shot');
  if (shot) {
    if (applyShot(world, shot)) {
      world.muted = true;
      renderGame(ctx, world);
      requestAnimationFrame(frame);
      return;
    }
  }
  renderGame(ctx, world);
  requestAnimationFrame(frame);
}

boot();
