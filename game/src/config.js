// Sizzle & Serve — config.js
// Every tunable number, recipe and station of the kitchen lives here so the
// rest of the game only ever reads data, never magic numbers.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const SHIFT_SECONDS = 180; // one 3-minute shift
export const MAX_ORDERS = 4;
export const MAX_STRIKES = 3;
export const CARRY_LIMIT = 2;
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 4.0;
export const BURN_SECONDS = 9.0;
export const ORDER_PATIENCE = 70;
export const RUSH_AT_SECONDS_LEFT = 60;

// Ingredients. `prep` says what the ingredient must go through before it can
// be plated: none (grab and go), chop (chopping board) or grill (the grill).
export const INGREDIENTS = {
  bun:     { id: 'bun',     label: 'Bun',     color: '#e8b06a', dark: '#b97f36', prep: 'none',  emoji: 'bun' },
  patty:   { id: 'patty',   label: 'Patty',   color: '#8a5a33', dark: '#5d3a1e', prep: 'grill', emoji: 'patty' },
  tomato:  { id: 'tomato',  label: 'Tomato',  color: '#e0452f', dark: '#a92a1a', prep: 'chop',  emoji: 'tomato' },
  lettuce: { id: 'lettuce', label: 'Lettuce', color: '#5fbf4a', dark: '#3a8a2c', prep: 'chop',  emoji: 'lettuce' },
  cheese:  { id: 'cheese',  label: 'Cheese',  color: '#ffc93c', dark: '#d99a06', prep: 'none',  emoji: 'cheese' },
  onion:   { id: 'onion',   label: 'Onion',   color: '#c9a0e8', dark: '#8a5fc0', prep: 'chop',  emoji: 'onion' },
};

// A plated item is an ingredient id plus a ready flag: 'raw' | 'chopped' |
// 'grilled' | 'burnt' | 'ready'. Only 'ready' items can be plated.
export function readyStateOf(ingredientId) {
  const prep = INGREDIENTS[ingredientId].prep;
  if (prep === 'chop') return 'chopped';
  if (prep === 'grill') return 'grilled';
  return 'ready';
}

// Recipes: the dish name, its plated ingredients (as ready ids) and its tip.
export const RECIPES = [
  {
    id: 'classic-stack',
    name: 'Classic Stack',
    needs: ['bun', 'patty', 'lettuce'],
    tip: 'Grill the patty, chop the lettuce.',
    base: 60,
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    needs: ['bun', 'patty', 'cheese', 'tomato'],
    tip: 'Melt it with cheese + tomato.',
    base: 80,
  },
  {
    id: 'garden-fresh',
    name: 'Garden Fresh',
    needs: ['bun', 'lettuce', 'tomato', 'onion'],
    tip: 'No grill — chop everything.',
    base: 70,
  },
  {
    id: 'double-trouble',
    name: 'Double Trouble',
    needs: ['bun', 'patty', 'patty', 'cheese'],
    tip: 'Two patties, one very hungry guest.',
    base: 100,
  },
  {
    id: 'sunset-stack',
    name: 'Sunset Stack',
    needs: ['bun', 'patty', 'tomato', 'onion'],
    tip: 'Sweet onion, hot grill.',
    base: 90,
  },
];

// Kitchen stations. x/y/w/h are in view coordinates; `kind` drives the
// interaction in main.js, `label` is drawn on the counter.
export const STATIONS = [
  { id: 'crate-bun',     kind: 'crate', gives: 'bun',     x: 36,  y: 300, w: 120, h: 86, label: 'BUNS' },
  { id: 'crate-tomato',  kind: 'crate', gives: 'tomato',  x: 36,  y: 402, w: 120, h: 86, label: 'TOMATO' },
  { id: 'crate-lettuce', kind: 'crate', gives: 'lettuce', x: 36,  y: 504, w: 120, h: 86, label: 'LETTUCE' },
  { id: 'crate-cheese',  kind: 'crate', gives: 'cheese',  x: 36,  y: 606, w: 120, h: 86, label: 'CHEESE' },
  { id: 'crate-onion',   kind: 'crate', gives: 'onion',   x: 176, y: 300, w: 120, h: 86, label: 'ONION' },
  { id: 'crate-patty',   kind: 'crate', gives: 'patty',   x: 176, y: 402, w: 120, h: 86, label: 'PATTIES' },
  { id: 'board',         kind: 'board',                   x: 340, y: 420, w: 190, h: 120, label: 'CHOPPING BOARD' },
  { id: 'grill',         kind: 'grill',                   x: 580, y: 420, w: 220, h: 120, label: 'GRILL' },
  { id: 'trash',         kind: 'trash',                   x: 830, y: 420, w: 90,  h: 120, label: 'BIN' },
  { id: 'plate',         kind: 'plate',                   x: 960, y: 420, w: 220, h: 120, label: 'ASSEMBLY COUNTER' },
  { id: 'window',        kind: 'window',                  x: 1020, y: 196, w: 224, h: 96, label: 'SERVE HERE' },
];

export const CHEF_START = { x: 620, y: 640 };
export const CHEF_SPEED = 265; // pixels per second
export const CHEF_RADIUS = 26;

// Order board geometry (tickets row, under the top bar).
export const BOARD = { x: 24, y: 76, w: 1232, h: 104 };
export const TICKET_W = 292;
export const TICKET_H = 92;
export const TICKET_GAP = 16;
