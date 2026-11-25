// The kitchen's stations: the ingredient shelf, the chopping board, the stove, the
// assembly plate, the serving window and the trash. This file owns what each station
// holds and what happens when the cook uses it; world.js owns the clock, the tickets
// and the score. An item is ready for the plate once its prep is done: chopped, cooked,
// or both, as its ingredient demands.

import { PLATE_SLOTS, PREP, STOVE_SLOTS, ingredientById } from './config.js';
import { matchingTicket } from './orders.js';

/** A fresh item of an ingredient, raw and unprepared. */
export function makeItem(ingId) {
  return { ing: ingId, stage: 'raw', progress: 0, overTime: 0, ready: ingredientById(ingId).prep === 'none' };
}

/** Whether this item has had all the prep its ingredient needs. */
export function isReady(item) {
  if (!item) return false;
  const prep = ingredientById(item.ing).prep;
  if (prep === 'none') return true;
  if (prep === 'chop') return item.stage === 'chopped';
  if (prep === 'cook') return item.stage === 'cooked';
  return item.stage === 'cooked'; // chopcook: chopped first, then cooked
}

export function createKitchen() {
  return {
    board: { item: null },
    stove: { slots: STOVE_SLOTS.map(() => null) },
    plate: { items: [] },
  };
}

/** Advance chopping and cooking. Returns the sounds the step earned: 'chopped' when a
 *  board item finishes, 'cooked' when a stove item finishes, 'burnt' when one burns. */
export function stepKitchen(kitchen, dt) {
  const sounds = [];
  const boardItem = kitchen.board.item;
  if (boardItem && boardItem.stage === 'raw') {
    boardItem.progress += dt / PREP.chopSeconds;
    if (boardItem.progress >= 1) {
      boardItem.progress = 1;
      boardItem.stage = 'chopped';
      boardItem.ready = ingredientById(boardItem.ing).prep === 'chop';
      sounds.push('chopped');
    }
  }
  for (const slot of kitchen.stove.slots) {
    if (!slot) continue;
    if (slot.stage === 'chopped' || (slot.stage === 'raw' && ingredientById(slot.ing).prep === 'cook')) {
      slot.progress += dt / PREP.cookSeconds;
      if (slot.progress >= 1) {
        slot.progress = 1;
        slot.stage = 'cooked';
        slot.ready = true;
        sounds.push('cooked');
      }
    } else if (slot.stage === 'cooked') {
      slot.overTime += dt;
      if (slot.overTime >= PREP.burnSeconds) {
        slot.stage = 'burnt';
        slot.ready = false;
        sounds.push('burnt');
      }
    }
  }
  return sounds;
}

/**
 * Use the station the cook stands at. `cook.carrying` is the one item in the cook's
 * hands (or null). `selected` is the ingredient the shelf hands out (keys 1-6 or a
 * click on a bin). Returns { kind, ... }: 'picked', 'placed', 'served', 'trashed',
 * 'error' (with a reason to show) or 'none' (nothing to do here).
 */
export function interact(kitchen, stationId, cook, selected, tickets) {
  if (stationId === 'shelf') {
    if (cook.carrying) return { kind: 'error', reason: 'tangan penuh' };
    cook.carrying = makeItem(selected);
    return { kind: 'picked', ing: selected };
  }

  if (stationId === 'board') {
    const boardItem = kitchen.board.item;
    if (boardItem && !cook.carrying) {
      if (boardItem.stage !== 'chopped') return { kind: 'error', reason: 'masih dipotong' };
      cook.carrying = boardItem;
      kitchen.board.item = null;
      return { kind: 'picked', ing: boardItem.ing };
    }
    if (!boardItem && cook.carrying) {
      const item = cook.carrying;
      const prep = ingredientById(item.ing).prep;
      if (item.stage !== 'raw') return { kind: 'error', reason: 'sudah dipotong' };
      if (prep !== 'chop' && prep !== 'chopcook') return { kind: 'error', reason: 'tak perlu dipotong' };
      item.progress = 0;
      kitchen.board.item = item;
      cook.carrying = null;
      return { kind: 'placed', ing: item.ing };
    }
    if (boardItem && cook.carrying) return { kind: 'error', reason: 'talnan dipakai' };
    return { kind: 'none' };
  }

  if (stationId === 'stove') {
    if (!cook.carrying) {
      const index = kitchen.stove.slots.findIndex(
        (slot) => slot && (slot.stage === 'cooked' || slot.stage === 'burnt'),
      );
      if (index === -1) {
        const busy = kitchen.stove.slots.some((slot) => slot);
        return { kind: 'error', reason: busy ? 'masih dimasak' : 'kompor kosong' };
      }
      const item = kitchen.stove.slots[index];
      kitchen.stove.slots[index] = null;
      cook.carrying = item;
      return { kind: 'picked', ing: item.ing, burnt: item.stage === 'burnt' };
    }
    const item = cook.carrying;
    const prep = ingredientById(item.ing).prep;
    if (prep !== 'cook' && prep !== 'chopcook') return { kind: 'error', reason: 'tak perlu dimasak' };
    if (prep === 'chopcook' && item.stage !== 'chopped') return { kind: 'error', reason: 'potong dulu' };
    if (item.stage === 'cooked') return { kind: 'error', reason: 'sudah matang' };
    const free = kitchen.stove.slots.findIndex((slot) => !slot);
    if (free === -1) return { kind: 'error', reason: 'kompor penuh' };
    item.progress = 0;
    item.overTime = 0;
    kitchen.stove.slots[free] = item;
    cook.carrying = null;
    return { kind: 'placed', ing: item.ing };
  }

  if (stationId === 'plate') {
    if (cook.carrying) {
      const item = cook.carrying;
      if (!isReady(item)) return { kind: 'error', reason: 'belum siap: potong / masak dulu' };
      if (kitchen.plate.items.some((placed) => placed.ing === item.ing)) {
        return { kind: 'error', reason: 'sudah ada di piring' };
      }
      if (kitchen.plate.items.length >= PLATE_SLOTS) return { kind: 'error', reason: 'piring penuh' };
      kitchen.plate.items.push(item);
      cook.carrying = null;
      return { kind: 'placed', ing: item.ing };
    }
    const last = kitchen.plate.items.pop();
    if (!last) return { kind: 'none' };
    cook.carrying = last;
    return { kind: 'picked', ing: last.ing };
  }

  if (stationId === 'window') {
    if (kitchen.plate.items.length === 0) return { kind: 'error', reason: 'piring kosong' };
    const ticket = matchingTicket(kitchen.plate, tickets);
    if (!ticket) return { kind: 'error', reason: 'belum sesuai pesanan' };
    kitchen.plate.items = [];
    return { kind: 'served', ticket };
  }

  if (stationId === 'trash') {
    if (!cook.carrying) return { kind: 'none' };
    const ing = cook.carrying.ing;
    cook.carrying = null;
    return { kind: 'trashed', ing };
  }

  return { kind: 'none' };
}
