// Every tuning number, colour and recipe in one place. The kitchen is a fixed 1280x720
// logical area; the renderer scales it to the window, so no rule below depends on the
// screen size. Warung Kilat: a one-cook Indonesian street-food kitchen. Orders arrive on
// the board; the cook fetches ingredients, chops and cooks them, assembles the dish on a
// plate and serves it at the window before the ticket's timer runs out.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds in one day (shift); surviving it starts the next, faster day. */
export const DAY_SECONDS = 90;

/** An expired ticket costs one heart; three lost hearts close the warung. */
export const HEARTS = 3;

/** Seconds a ticket lives on day one; later days shorten it. */
export const TICKET_SECONDS = 32;
export const TICKET_MIN_SECONDS = 20;

/** Seconds between ticket arrivals on day one; later days shorten it. */
export const TICKET_INTERVAL = 9;
export const TICKET_INTERVAL_MIN = 5.5;

/** At most this many tickets can wait on the board at once. */
export const MAX_TICKETS = 4;

export const COOK = { width: 46, height: 64, speed: 540, y: 560 };

/** How close the cook must be to a station to use it (pixels from its centre). */
export const REACH = 110;

/** Prep times, in seconds. Chopping and cooking both show a progress ring. */
export const PREP = {
  chopSeconds: 1.6,
  cookSeconds: 2.6,
  /** Cooked food left on the stove this long after it is done burns. */
  burnSeconds: 5,
};

/** Coins for a served dish, before the time bonus and the combo multiplier. */
export const SCORE = {
  base: 40,
  /** Extra coins per whole second left on the ticket when served. */
  timeBonus: 3,
  /** Each combo step adds this many coins, up to the cap. */
  comboBonus: 10,
  comboCap: 5,
  dayBonus: 50,
};

/** Ingredients. prep: what a raw item needs before it can go on a plate.
 *  none  -> straight from the shelf to the plate (rice, noodles, sambal)
 *  chop  -> the chopping board first (veg)
 *  cook  -> the stove first (egg)
 *  chopcook -> board, then stove (chicken) */
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', prep: 'none', color: '#f5f0e1', dark: '#d9cfae' },
  { id: 'mie', name: 'Mie', key: '2', prep: 'none', color: '#f2c14e', dark: '#c98f1b' },
  { id: 'ayam', name: 'Ayam', key: '3', prep: 'chopcook', color: '#e08a5a', dark: '#a85a2c' },
  { id: 'telur', name: 'Telur', key: '4', prep: 'cook', color: '#ffd94d', dark: '#e0a800' },
  { id: 'sayur', name: 'Sayur', key: '5', prep: 'chop', color: '#5fbf5a', dark: '#2f7d2b' },
  { id: 'sambal', name: 'Sambal', key: '6', prep: 'none', color: '#d63c2f', dark: '#8f1f16' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

/** The menu. Each dish is a set of prepared ingredients: a raw item counts only once it
 *  has had its prep done (chopped, cooked, or both). The plate must hold exactly these. */
export const DISHES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    needs: ['nasi', 'telur', 'sayur', 'sambal'],
    color: '#f2a541',
  },
  {
    id: 'mie-goreng',
    name: 'Mie Goreng',
    needs: ['mie', 'ayam', 'sayur'],
    color: '#e08a3c',
  },
  {
    id: 'ayam-geprek',
    name: 'Ayam Geprek',
    needs: ['nasi', 'ayam', 'sambal'],
    color: '#d63c2f',
  },
  {
    id: 'nasi-ayam',
    name: 'Nasi Ayam',
    needs: ['nasi', 'ayam', 'sayur'],
    color: '#c98a4b',
  },
  {
    id: 'telur-dadar',
    name: 'Telur Dadar',
    needs: ['nasi', 'telur', 'sambal'],
    color: '#ffd94d',
  },
];

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

/** Station layout, left to right along the counter. x is the centre of the station. */
export const STATIONS = {
  shelf: { id: 'shelf', label: 'BAHAN', x: 150, y: 470, width: 260, height: 150 },
  board: { id: 'board', label: 'TALNAN', x: 400, y: 470, width: 120, height: 150 },
  stove: { id: 'stove', label: 'KOMPOR', x: 590, y: 470, width: 210, height: 150 },
  plate: { id: 'plate', label: 'PIRING', x: 800, y: 470, width: 130, height: 150 },
  window: { id: 'window', label: 'SAJI', x: 1010, y: 470, width: 150, height: 150 },
  trash: { id: 'trash', label: 'SAMPAH', x: 1180, y: 500, width: 80, height: 120 },
};

/** The stove holds two woks side by side; their centres, relative to the stove. */
export const STOVE_SLOTS = [{ dx: -48 }, { dx: 48 }];

/** The plate holds up to this many items at once. */
export const PLATE_SLOTS = 4;

export const PALETTE = {
  wall: '#f7c873',
  wallDark: '#e8a94e',
  awningA: '#d63c2f',
  awningB: '#fff3d6',
  floor: '#b5773a',
  floorDark: '#9c6228',
  counter: '#7a4a21',
  counterTop: '#a06a35',
  board: '#e8c890',
  panel: '#3a2a18',
  panelLight: '#57402a',
  text: '#fff8ea',
  muted: '#e8d5b0',
  ticket: '#fff8e6',
  ticketEdge: '#d9c08a',
  timerGood: '#4caf50',
  timerWarn: '#ff9800',
  timerBad: '#e53935',
  ready: '#7ed957',
  readyGlow: '#b6ff9e',
  cookSkin: '#f2c89b',
  cookShirt: '#2f80ed',
  cookApron: '#ffffff',
  cookHat: '#ffffff',
  flame: '#ff8c1a',
  smoke: '#8d8d8d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'warung-kilat.best';
