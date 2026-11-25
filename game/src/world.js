// The game state and its clock: the cook, the tickets on the board, the day's timer,
// the score and combo, and the events a step earns. The kitchen (stations) and the
// order board (tickets) live in their own files; this file moves time forward.

import {
  COOK,
  DAY_SECONDS,
  HEARTS,
  MAX_TICKETS,
  SCORE,
  STEP,
} from './config.js';
import { createKitchen, interact, stepKitchen } from './kitchen.js';
import { nextTicketIn, spawnTicket, resetTicketNumbers } from './orders.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_DAY = 8;

export function createWorld(random) {
  const world = {
    random,
    state: null,
  };
  world.reset = () => resetWorld(world);
  world.step = (dt, move, use, selected) => stepWorld(world, dt, move, use, selected);
  world.interactNow = (stationId, selected) => interactNow(world, stationId, selected);
  /** The station within reach of kitchen position x, or null. */
  world.stationAt = (x) => nearestStation(x);
  world.reset();
  return world;
}

function resetWorld(world) {
  resetTicketNumbers();
  world.state = {
    time: 0,
    day: 1,
    dayTime: DAY_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    served: 0,
    lost: 0,
    cook: { x: 640, carrying: null },
    selected: 'nasi',
    kitchen: createKitchen(),
    tickets: [],
    ticketIn: 2.5,
    popups: [],
    flash: 0,
    shake: 0,
    message: '',
    messageTime: 0,
    sounds: [],
    muted: false,
  };
  const first = spawnTicket(world.random, 1);
  world.state.tickets.push(first);
  const second = spawnTicket(world.random, 1);
  world.state.tickets.push(second);
}

function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color, life: 1.2 });
}

function showMessage(state, text) {
  state.message = text;
  state.messageTime = 1.6;
}

/** Use the station right in front of the cook (the nearest one within reach). */
function nearestStation(x) {
  // Station centres are defined in config; find the closest one the cook can reach.
  const stations = [
    ['shelf', 150], ['board', 400], ['stove', 590], ['plate', 800], ['window', 1010], ['trash', 1180],
  ];
  let best = null;
  let bestDist = 115;
  for (const [id, sx] of stations) {
    const dist = Math.abs(x - sx);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }
  return best;
}

function interactNow(world, stationId, selected) {
  const state = world.state;
  if (selected) state.selected = selected;
  const result = interact(state.kitchen, stationId, state.cook, state.selected, state.tickets);
  if (result.kind === 'served') {
    const ticket = result.ticket;
    const timeBonus = Math.floor(ticket.timeLeft) * SCORE.timeBonus;
    const comboBonus = Math.min(state.combo, SCORE.comboCap) * SCORE.comboBonus;
    const earned = SCORE.base + timeBonus + comboBonus;
    state.score += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    addPopup(state, 1010, 380, `+${earned}`, '#7ed957');
    if (state.combo >= 2) addPopup(state, 1010, 410, `KOMBO x${state.combo}!`, '#ffd94d');
    state.tickets = state.tickets.filter((item) => item !== ticket);
    return { ...result, earned };
  }
  if (result.kind === 'error') showMessage(state, result.reason);
  return result;
}

function stepWorld(world, dt, move, use, selected) {
  const state = world.state;
  let events = EVENT_NONE;
  state.time += dt;

  // The cook walks. `move` is -1, 0 or 1; the kitchen floor runs from x=60 to x=1240.
  if (move !== 0) {
    state.cook.x = Math.min(1240, Math.max(60, state.cook.x + move * COOK.speed * dt));
  }
  if (selected) state.selected = selected;
  if (use) {
    const stationId = nearestStation(state.cook.x);
    if (stationId) interactNow(world, stationId);
  }

  // Chopping and cooking advance; a finished item dings, a burnt one smokes.
  const sounds = stepKitchen(state.kitchen, dt);
  state.sounds = sounds;
  if (sounds.includes('burnt')) {
    showMessage(state, 'gosong! buang ke sampah');
    state.shake = 0.25;
  }

  // The day's timer runs down; surviving it starts a faster day with a bonus.
  state.dayTime -= dt;
  if (state.dayTime <= 0) {
    state.day += 1;
    state.dayTime = DAY_SECONDS;
    state.score += SCORE.dayBonus;
    addPopup(state, 640, 300, `HARI ${state.day} +${SCORE.dayBonus}`, '#ffd94d');
    events |= EVENT_DAY;
  }

  // New tickets arrive on a schedule, up to the board's limit.
  state.ticketIn -= dt;
  if (state.ticketIn <= 0 && state.tickets.length < MAX_TICKETS) {
    state.tickets.push(spawnTicket(world.random, state.day));
    state.ticketIn = nextTicketIn(world.random, state.day);
  } else if (state.ticketIn <= 0) {
    state.ticketIn = 2;
  }

  // Tickets count down; an expired one costs a heart and breaks the combo.
  for (const ticket of [...state.tickets]) {
    ticket.timeLeft -= dt;
    if (ticket.timeLeft <= 0) {
      state.tickets = state.tickets.filter((item) => item !== ticket);
      state.hearts -= 1;
      state.lost += 1;
      state.combo = 0;
      state.flash = 0.5;
      state.shake = 0.4;
      showMessage(state, `pesanan ${ticket.name} hangus!`);
      events |= EVENT_EXPIRED;
      if (state.hearts <= 0) {
        events |= EVENT_OVER;
        return events;
      }
    }
  }

  // Popups float up and fade; flashes and shakes decay.
  for (const popup of [...state.popups]) {
    popup.life -= dt;
    popup.y -= 28 * dt;
    if (popup.life <= 0) state.popups = state.popups.filter((item) => item !== popup);
  }
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.messageTime > 0) state.messageTime -= dt;

  return events;
}

export { STEP };
