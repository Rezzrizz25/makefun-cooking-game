// Sizzle & Serve — render.js
// Every pixel of the kitchen is drawn here on one canvas: the floor and
// counters, the order board, the ingredient art, the chef, the HUD and the
// title / game-over screens. No images are loaded — all art is vector.

import {
  BOARD, CHEF_RADIUS, INGREDIENTS, MAX_STRIKES, STATIONS, TICKET_H, TICKET_W,
  VIEW_H, VIEW_W,
} from './config.js';
import { grillSlotCenter, ticketRect, plateMatchesOrder } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawIngredientIcon(ctx, id, x, y, r, state) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#666';
    text(ctx, '✕', 0, 0, r * 1.1, '#999');
    ctx.restore();
    return;
  }
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7d9a0';
    ctx.fillRect(-r, 0, r * 2, r * 0.32);
    ctx.fillStyle = '#fff3d0';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.35, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.55, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = state === 'grilled' ? '#6b3f1d' : '#c98a6b';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#5d3a1e';
    ctx.lineWidth = 2;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.stroke();
    if (state === 'grilled') {
      ctx.strokeStyle = '#3d2208';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.55 - r * 0.25, -r * 0.5);
        ctx.lineTo(i * r * 0.55 + r * 0.25, r * 0.5);
        ctx.stroke();
      }
    }
  } else if (id === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = '#ff6b52';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-r * 0.6 + i * r * 0.6, 0, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd23e';
      ctx.beginPath();
      ctx.arc(-r * 0.6, 0, r * 0.12, 0, Math.PI * 2);
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.6, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8a2c';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.45, -r * 1.25);
      ctx.lineTo(r * 0.45, -r * 1.25);
      ctx.closePath();
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(r * 0.2, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.35, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.05, -r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'onion') {
    ctx.fillStyle = '#e8d5f7';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7fc94f';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(-r * 0.3, -r * 1.3);
    ctx.lineTo(r * 0.3, -r * 1.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#c98d5f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = '#f3e2c7';
  for (let y = 196; y < VIEW_H; y += 64) {
    for (let x = 0; x < VIEW_W; x += 64) {
      const odd = ((x + y) / 64) % 2 === 0;
      ctx.fillStyle = odd ? '#e8c9a0' : '#dfb98a';
      ctx.fillRect(x + 1, y + 1, 62, 62);
    }
  }
  ctx.fillStyle = '#fff8ec';
  ctx.fillRect(0, 188, VIEW_W, 8);
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = '#5d2f16';
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = '#ffb703';
  text(ctx, 'SIZZLE & SERVE', 150, 34, 30, '#ffb703', 'center', '900');
  const mins = Math.max(0, Math.floor(world.timeLeft / 60));
  const secs = Math.max(0, Math.floor(world.timeLeft % 60));
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const urgent = world.timeLeft <= 30 && world.mode === 'play';
  ctx.fillStyle = urgent ? '#ff4757' : '#fff8ec';
  roundRect(ctx, 560, 8, 160, 48, 10);
  ctx.fill();
  text(ctx, `⏱ ${timeStr}`, 640, 33, 28, urgent ? '#fff' : '#5d2f16');
  text(ctx, `SCORE ${world.score}`, 800, 26, 20, '#fff8ec');
  text(ctx, `🪙 ${world.coins}   🔥 x${world.streak}`, 800, 48, 18, '#ffd23e');
  text(ctx, `SERVED ${world.served}`, 990, 26, 20, '#fff8ec');
  const hearts = '♥'.repeat(MAX_STRIKES - world.strikes) + '♡'.repeat(world.strikes);
  text(ctx, hearts, 990, 48, 20, '#ff6b81');
  text(ctx, world.rush ? 'RUSH HOUR!' : 'SHIFT', 1150, 26, 18, world.rush ? '#ff4757' : '#ffd23e');
  text(ctx, world.muted ? 'MUTED (M)' : 'M: MUTE', 1150, 48, 14, '#e8c9a0');
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = '#3d2208';
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 12);
  ctx.fill();
  text(ctx, '— ORDER BOARD —', BOARD.x + 110, BOARD.y + 14, 15, '#ffb703', 'left');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', BOARD.x + BOARD.w / 2, BOARD.y + 58, 18, '#e8c9a0');
    return;
  }
  world.orders.forEach((order, i) => {
    const r = ticketRect(i);
    const urgent = order.patience < 15;
    ctx.fillStyle = urgent ? '#ffe1e1' : '#fff8ec';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff4757' : '#b97f36';
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    text(ctx, `#${order.id}  ${order.recipe.name.toUpperCase()}`, r.x + 12, r.y + 16, 16, '#5d2f16', 'left');
    text(ctx, `${Math.ceil(order.patience)}s`, r.x + r.w - 10, r.y + 16, 16, urgent ? '#ff4757' : '#5d2f16', 'right');
    const m = plateMatchesOrder(world.plate, order);
    order.recipe.needs.forEach((need, j) => {
      const ix = r.x + 26 + j * 44;
      const done = j < m.matched && world.plate.includes(need);
      ctx.globalAlpha = done ? 1 : 0.55;
      drawIngredientIcon(ctx, need, ix, r.y + 48, 15, 'ready');
      ctx.globalAlpha = 1;
      if (done) {
        ctx.strokeStyle = '#2f9e44';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ix, r.y + 48, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e0c9a6';
    roundRect(ctx, r.x + 12, r.y + r.h - 14, r.w - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = urgent ? '#ff4757' : frac > 0.5 ? '#2f9e44' : '#ffb703';
    roundRect(ctx, r.x + 12, r.y + r.h - 14, (r.w - 24) * frac, 8, 4);
    ctx.fill();
  });
}

function drawStation(ctx, world, station) {
  const { x, y, w, h } = station;
  ctx.save();
  if (station.kind === 'crate') {
    ctx.fillStyle = '#7a4a21';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#a9713d';
    roundRect(ctx, x + 6, y + 6, w - 12, h - 26, 6);
    ctx.fill();
    const ing = station.gives;
    for (let i = 0; i < 3; i++) {
      drawIngredientIcon(ctx, ing, x + 28 + i * 32, y + 34, 14, 'ready');
    }
    text(ctx, station.label, x + w / 2, y + h - 10, 13, '#fff8ec');
  } else if (station.kind === 'board') {
    ctx.fillStyle = '#8a5a33';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#e8c9a0';
    roundRect(ctx, x + 10, y + 10, w - 20, h - 38, 6);
    ctx.fill();
    if (world.board) {
      drawIngredientIcon(ctx, world.board.id, x + w / 2, y + 48, 22, 'raw');
      const frac = Math.min(1, world.board.progress);
      ctx.fillStyle = '#e0c9a6';
      roundRect(ctx, x + 20, y + h - 26, w - 40, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#ff8c42';
      roundRect(ctx, x + 20, y + h - 26, (w - 40) * frac, 10, 5);
      ctx.fill();
      text(ctx, 'CHOPPING…', x + w / 2, y + h - 38, 13, '#5d2f16');
    } else {
      text(ctx, '🔪', x + w / 2, y + 42, 26, '#5d2f16');
      text(ctx, 'drop tomato / lettuce /', x + w / 2, y + 74, 12, '#5d2f16');
      text(ctx, 'onion here to chop', x + w / 2, y + 90, 12, '#5d2f16');
    }
    text(ctx, station.label, x + w / 2, y + h - 10, 13, '#fff8ec');
  } else if (station.kind === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    roundRect(ctx, x + 10, y + 10, w - 20, h - 38, 6);
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 22 + i * 11);
      ctx.lineTo(x + w - 16, y + 22 + i * 11);
      ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      const c = grillSlotCenter(i);
      if (!slot) return;
      drawIngredientIcon(ctx, 'patty', c.x, c.y, 24, slot.state === 'burnt' ? 'burnt' : slot.state === 'done' ? 'grilled' : 'raw');
      if (slot.state === 'cooking') {
        ctx.fillStyle = '#e0c9a6';
        roundRect(ctx, c.x - 26, c.y + 28, 52, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#ff8c42';
        roundRect(ctx, c.x - 26, c.y + 28, 52 * Math.min(1, slot.progress), 8, 4);
        ctx.fill();
      } else if (slot.state === 'done') {
        text(ctx, 'READY!', c.x, c.y + 34, 12, '#7CFC00');
      } else if (slot.state === 'burnt') {
        text(ctx, 'BURNT!', c.x, c.y + 34, 12, '#ff4757');
      }
    });
    text(ctx, station.label, x + w / 2, y + h - 10, 13, '#fff8ec');
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#5a5a5a';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    text(ctx, '🗑', x + w / 2, y + 52, 34, '#fff');
    text(ctx, station.label, x + w / 2, y + h - 10, 13, '#fff8ec');
  } else if (station.kind === 'plate') {
    ctx.fillStyle = '#8a5a33';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    roundRect(ctx, x + 10, y + 10, w - 20, h - 38, 6);
    ctx.fill();
    // the plate: stacked ingredients drawn in order (hidden when the chef
    // is carrying it — the counter then shows an empty plate)
    const px = x + w / 2;
    const py = y + 62;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(px, py + 18, 78, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b9a06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (world.plateHeld) {
      text(ctx, 'plate is with the chef →', px, py - 6, 13, '#8a7a5a');
    } else if (world.plate.length === 0) {
      text(ctx, 'empty plate — add items', px, py - 6, 13, '#8a7a5a');
    } else {
      let stackY = py + 8;
      for (let i = world.plate.length - 1; i >= 0; i--) {
        drawIngredientIcon(ctx, world.plate[i], px, stackY, 18, 'ready');
        stackY -= 16;
      }
    }
    text(ctx, station.label, x + w / 2, y + h - 10, 13, '#fff8ec');
  } else if (station.kind === 'window') {
    ctx.fillStyle = '#5d2f16';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9b8';
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6);
    ctx.fill();
    const ready = world.plateHeld && world.plate.length > 0;
    text(ctx, '🔔  SERVE HERE', x + w / 2, y + 26, 18, '#5d2f16');
    text(ctx, ready ? 'PLATE READY — press E!' : 'bring a finished plate', x + w / 2, y + 56, 14, ready ? '#2f9e44' : '#8a7a5a');
    if (ready) {
      ctx.strokeStyle = '#2f9e44';
      ctx.lineWidth = 4;
      roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 12);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(chef.bob) * 3 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + CHEF_RADIUS + 4, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // body (apron)
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 18, y - 6, 36, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#e0452f';
  ctx.fillRect(x - 18, y + 8, 36, 10);
  // head
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath();
  ctx.arc(x, y - 20, 17, 0, Math.PI * 2);
  ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 10, y - 34, 10, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 34, 10, 0, Math.PI * 2);
  ctx.arc(x, y - 38, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 16, y - 36, 32, 8);
  // eyes
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 6 + chef.face * 2, y - 20, 2.4, 0, Math.PI * 2);
  ctx.arc(x + 6 + chef.face * 2, y - 20, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + chef.face * 2, y - 13, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // carried items above the chef
  world.hands.forEach((item, i) => {
    drawIngredientIcon(ctx, item.id, x - 14 + i * 28, y - 58, 13, item.state === 'ready' ? 'ready' : item.state);
  });
  if (world.plateHeld) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y - 56, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    let stackY = y - 62;
    for (let i = world.plate.length - 1; i >= 0; i--) {
      drawIngredientIcon(ctx, world.plate[i], x, stackY, 12, 'ready');
      stackY -= 8;
    }
  }
  // click-to-move target marker
  if (chef.moving) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chef.tx, chef.ty, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    text(ctx, p.text, p.x, p.y, 22, p.color);
  }
  ctx.globalAlpha = 1;
}

function drawToast(ctx, world) {
  if (world.messageLife > 0 && world.message) {
    ctx.fillStyle = 'rgba(61,34,8,0.9)';
    const w = Math.min(560, world.message.length * 9 + 40);
    roundRect(ctx, VIEW_W / 2 - w / 2, VIEW_H - 56, w, 36, 18);
    ctx.fill();
    text(ctx, world.message, VIEW_W / 2, VIEW_H - 38, 16, '#fff8ec');
  }
}

function drawHintBar(ctx, world) {
  if (world.mode !== 'play') return;
  text(
    ctx,
    'WASD / arrows or CLICK to move  •  E use station  •  1–6 grab ingredient  •  P pause  •  R restart',
    VIEW_W / 2, VIEW_H - 78, 14, '#5d2f16',
  );
}

function drawTitleScreen(ctx, world) {
  ctx.fillStyle = 'rgba(40,18,4,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 240, 120, 800, 560, 20);
  ctx.fill();
  text(ctx, '🍳  SIZZLE & SERVE  🍳', VIEW_W / 2, 180, 44, '#e0452f', 'center', '900');
  text(ctx, 'The lunch rush is on. Take orders, chop, grill, stack — and serve before the ticket burns!', VIEW_W / 2, 226, 18, '#5d2f16');
  text(ctx, 'HOW TO PLAY', VIEW_W / 2, 272, 20, '#b97f36');
  const lines = [
    '1.  Orders appear on the board — each ticket lists what the guest wants.',
    '2.  Grab ingredients from the crates. Patties go on the GRILL,',
    '     tomato / lettuce / onion go on the CHOPPING BOARD.',
    '3.  Stack everything on the plate at the ASSEMBLY COUNTER.',
    '4.  Carry the finished plate to the SERVE window and press E.',
    '5.  Fast serves pay more. Streaks multiply. 3 missed orders ends the shift!',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 306 + i * 26, 17, '#3d2208', 'center', 'normal'));
  text(ctx, 'WASD / arrows or CLICK to move  •  E use station  •  1–6 grab  •  M mute', VIEW_W / 2, 470, 16, '#5d2f16');
  ctx.fillStyle = '#e0452f';
  roundRect(ctx, VIEW_W / 2 - 150, 500, 300, 56, 12);
  ctx.fill();
  text(ctx, 'START SHIFT  (Enter)', VIEW_W / 2, 529, 22, '#fff');
  text(ctx, 'A 3-minute shift. No network, no downloads — just you and the kitchen.', VIEW_W / 2, 600, 14, '#8a7a5a');
  text(ctx, 'Original game by Rezzrizz25 for make.fun', VIEW_W / 2, 640, 13, '#b9a06a');
}

function drawGameOverScreen(ctx, world) {
  ctx.fillStyle = 'rgba(40,18,4,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 290, 150, 700, 500, 20);
  ctx.fill();
  const grade = world.strikes >= 3
    ? { stars: 0, title: 'Too many missed orders — the shift was cut short!' }
    : gradeFor(world);
  text(ctx, 'SHIFT OVER!', VIEW_W / 2, 210, 40, '#e0452f', 'center', '900');
  text(ctx, grade.title, VIEW_W / 2, 252, 22, '#5d2f16');
  text(ctx, '★'.repeat(grade.stars) + '☆'.repeat(3 - grade.stars), VIEW_W / 2, 292, 34, '#ffb703');
  text(ctx, `SCORE  ${world.score}`, VIEW_W / 2, 350, 28, '#3d2208');
  text(ctx, `Dishes served: ${world.served}    Best streak: x${world.bestStreak}    Coins earned: ${world.coins}`, VIEW_W / 2, 396, 18, '#5d2f16');
  ctx.fillStyle = '#2f9e44';
  roundRect(ctx, VIEW_W / 2 - 150, 440, 300, 56, 12);
  ctx.fill();
  text(ctx, 'PLAY AGAIN  (R)', VIEW_W / 2, 469, 22, '#fff');
  text(ctx, 'Tip: grill two patties at once and chop while they cook.', VIEW_W / 2, 540, 15, '#8a7a5a');
  text(ctx, 'Thanks for playing Sizzle & Serve!', VIEW_W / 2, 580, 14, '#b9a06a');
}

function gradeFor(world) {
  if (world.served >= 12) return { stars: 3, title: 'Head Chef! The crowd chants your name.' };
  if (world.served >= 8) return { stars: 2, title: 'Sous Chef — the kitchen runs on you.' };
  if (world.served >= 4) return { stars: 1, title: 'Line Cook — solid shift, chef.' };
  return { stars: 0, title: 'Kitchen Trainee — the grill awaits your revenge.' };
}

export function renderGame(ctx, world) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawTopBar(ctx, world);
  drawOrderBoard(ctx, world);
  for (const station of STATIONS) drawStation(ctx, world, station);
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawHintBar(ctx, world);
  drawToast(ctx, world);
  if (world.mode === 'title') drawTitleScreen(ctx, world);
  if (world.mode === 'over') drawGameOverScreen(ctx, world);
  if (world.paused) {
    ctx.fillStyle = 'rgba(40,18,4,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED — press P to keep cooking', VIEW_W / 2, VIEW_H / 2, 32, '#fff8ec');
  }
}

export { drawIngredientIcon, drawOrderBoard, drawStation, drawChef, drawTopBar };
