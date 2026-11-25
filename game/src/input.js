// Sizzle & Serve — input.js
// Keyboard + mouse input. WASD / arrows walk the chef, E (or Space) uses the
// nearest station, click-to-move walks there and uses the clicked station on
// arrival. Keys 1-6 grab from a crate by number, M mutes, P pauses, R restarts.

import { CHEF_SPEED, STATIONS } from './config.js';

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    click: null, // { x, y, consumed }
    pressed: new Set(), // keys pressed since last consume
    pointer: { x: 0, y: 0 },
  };

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(key);
    input.keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('pointerdown', (event) => {
    const pos = toGameCoords(event);
    input.click = { x: pos.x, y: pos.y };
    input.pointer = pos;
  });
  canvas.addEventListener('pointermove', (event) => {
    input.pointer = toGameCoords(event);
  });
  return input;
}

export function consumePress(input, key) {
  if (input.pressed.has(key)) {
    input.pressed.delete(key);
    return true;
  }
  return false;
}

export function consumeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}

export function moveVector(input) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('a') || input.keys.has('arrowleft')) dx -= 1;
  if (input.keys.has('d') || input.keys.has('arrowright')) dx += 1;
  if (input.keys.has('w') || input.keys.has('arrowup')) dy -= 1;
  if (input.keys.has('s') || input.keys.has('arrowdown')) dy += 1;
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv;
    dy *= inv;
  }
  return { dx, dy };
}

export function stationAtPoint(x, y) {
  for (const station of STATIONS) {
    if (x >= station.x && x <= station.x + station.w && y >= station.y && y <= station.y + station.h) {
      return station;
    }
  }
  return null;
}

// The chef can use a station when standing close to its edge.
export function nearestStation(chefX, chefY, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const station of STATIONS) {
    const cx = Math.max(station.x, Math.min(chefX, station.x + station.w));
    const cy = Math.max(station.y, Math.min(chefY, station.y + station.h));
    const d = Math.hypot(chefX - cx, chefY - cy);
    if (d < bestD) {
      bestD = d;
      best = station;
    }
  }
  return best;
}

export function clampChef(x, y) {
  // Walkable floor: below the order board, inside the kitchen walls.
  return {
    x: Math.max(24, Math.min(1256, x)),
    y: Math.max(200, Math.min(776, y)),
  };
}

export function stepChefTowards(world, dt) {
  const chef = world.chef;
  const dx = chef.tx - chef.x;
  const dy = chef.ty - chef.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    chef.moving = false;
    return true;
  }
  const step = Math.min(dist, CHEF_SPEED * dt);
  chef.x += (dx / dist) * step;
  chef.y += (dy / dist) * step;
  chef.face = dx < 0 ? -1 : 1;
  chef.moving = true;
  chef.bob += dt * 12;
  const clamped = clampChef(chef.x, chef.y);
  chef.x = clamped.x;
  chef.y = clamped.y;
  return false;
}
