// The screenshot scenes behind ?shot=cover|play|rush|serve. Each one stages a real game
// state — tickets on the board, food on the stations, a plate mid-assembly — through the
// game's own state, then the renderer paints it exactly as a player would see it. The
// same seed always gives the same frame.

import { dishById } from './config.js';
import { isReady, makeItem } from './kitchen.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

let ticketNumber = 100;

function ticket(dishId, timeLeft, maxTime) {
  ticketNumber += 1;
  const dish = dishById(dishId);
  return { id: ticketNumber, dish: dish.id, name: dish.name, needs: [...dish.needs], timeLeft, maxTime };
}

function placed(ingId, stage, progress = 1, overTime = 0) {
  const item = makeItem(ingId);
  item.stage = stage;
  item.progress = progress;
  item.overTime = overTime;
  item.ready = isReady(item);
  if (stage === 'burnt') item.ready = false;
  return item;
}

/** The cover: the whole kitchen at its busiest — three tickets, a plate ready to serve,
 *  food chopping and cooking, the timer running, a combo on the board. */
function stageCover(world) {
  const state = world.state;
  state.day = 2;
  state.dayTime = 47;
  state.score = 1240;
  state.combo = 4;
  state.bestCombo = 4;
  state.hearts = 2;
  state.served = 9;
  state.tickets = [
    ticket('nasi-ayam', 6, 28),
    ticket('mie-goreng', 18, 28),
    ticket('nasi-goreng', 25, 28),
  ];
  state.kitchen.board.item = placed('sayur', 'chopped');
  state.kitchen.stove.slots[0] = placed('telur', 'cooked', 1, 1.5);
  state.kitchen.stove.slots[1] = placed('ayam', 'chopped', 0.55);
  state.kitchen.plate.items = [placed('nasi', 'raw'), placed('ayam', 'cooked'), placed('sayur', 'chopped')];
  state.cook.x = 800;
  state.cook.carrying = placed('sambal', 'raw');
  state.selected = 'sambal';
  return { screen: SCREEN_PLAY, best: state.score };
}

/** Mid-game: a dish half-built on the plate, the cook carrying veg to the board. */
function stagePlay(world) {
  const state = world.state;
  state.day = 1;
  state.dayTime = 62;
  state.score = 340;
  state.combo = 2;
  state.bestCombo = 2;
  state.hearts = 3;
  state.served = 3;
  state.tickets = [
    ticket('nasi-goreng', 21, 32),
    ticket('ayam-geprek', 14, 32),
    ticket('nasi-ayam', 27, 32),
  ];
  state.kitchen.board.item = placed('ayam', 'raw', 0.4);
  state.kitchen.stove.slots[0] = placed('telur', 'raw', 0.7);
  state.kitchen.plate.items = [placed('nasi', 'raw'), placed('telur', 'cooked')];
  state.cook.x = 330;
  state.cook.carrying = placed('sayur', 'raw');
  state.selected = 'sayur';
  return { screen: SCREEN_PLAY, best: state.score };
}

/** The rush: day three, four tickets, one about to expire, a plate ready, a burnt wok. */
function stageRush(world) {
  const state = world.state;
  state.day = 3;
  state.dayTime = 14;
  state.score = 1890;
  state.combo = 5;
  state.bestCombo = 6;
  state.hearts = 1;
  state.served = 14;
  state.tickets = [
    ticket('mie-goreng', 5, 24),
    ticket('nasi-goreng', 11, 24),
    ticket('ayam-geprek', 19, 24),
    ticket('telur-dadar', 23, 24),
  ];
  state.kitchen.board.item = placed('sayur', 'chopped');
  state.kitchen.stove.slots[0] = placed('ayam', 'burnt', 1, 6);
  state.kitchen.stove.slots[1] = placed('telur', 'raw', 0.35);
  state.kitchen.plate.items = [placed('mie', 'raw'), placed('ayam', 'cooked'), placed('sayur', 'chopped')];
  state.cook.x = 1010;
  state.cook.carrying = null;
  state.selected = 'nasi';
  state.popups = [{ x: 640, y: 300, text: 'HARI 3!', color: '#ffd94d', life: 1.2 }];
  return { screen: SCREEN_PLAY, best: state.score };
}

/** The serve: the cook at the window with a finished plate, coins flying. */
function stageServe(world) {
  const state = world.state;
  state.day = 1;
  state.dayTime = 55;
  state.score = 860;
  state.combo = 3;
  state.bestCombo = 3;
  state.hearts = 3;
  state.served = 6;
  state.tickets = [
    ticket('ayam-geprek', 16, 32),
    ticket('nasi-ayam', 24, 32),
  ];
  state.kitchen.plate.items = [placed('nasi', 'raw'), placed('ayam', 'cooked'), placed('sambal', 'raw')];
  state.cook.x = 1010;
  state.cook.carrying = null;
  state.selected = 'ayam';
  state.popups = [
    { x: 880, y: 350, text: '+180', color: '#7ed957', life: 1.2 },
    { x: 880, y: 380, text: 'KOMBO x3!', color: '#ffd94d', life: 1.2 },
  ];
  return { screen: SCREEN_PLAY, best: state.score };
}

/** The title screen over a kitchen already mid-shift. */
function stageStart(world) {
  const state = world.state;
  state.day = 1;
  state.dayTime = 78;
  state.score = 0;
  state.combo = 0;
  state.hearts = 3;
  state.tickets = [ticket('nasi-goreng', 26, 32), ticket('mie-goreng', 20, 32)];
  state.kitchen.board.item = placed('sayur', 'chopped');
  state.kitchen.stove.slots[0] = placed('telur', 'raw', 0.5);
  state.kitchen.plate.items = [placed('nasi', 'raw')];
  state.cook.x = 640;
  state.cook.carrying = null;
  return { screen: SCREEN_TITLE, best: 0 };
}

/**
 * Set `world` to the named scene (cover, play, rush, serve, start; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  ticketNumber = 100;
  if (name === 'cover') return stageCover(world);
  if (name === 'play') return stagePlay(world);
  if (name === 'rush') return stageRush(world);
  if (name === 'serve') return stageServe(world);
  if (name === 'end') {
    const state = world.state;
    state.hearts = 0;
    state.score = 2140;
    state.day = 3;
    state.served = 16;
    state.bestCombo = 6;
    state.lost = 3;
    state.tickets = [];
    return { screen: SCREEN_OVER, best: state.score };
  }
  return stageStart(world);
}
