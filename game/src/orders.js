// The order board: the menu, the tickets waiting on it, and the rules for matching a
// finished plate against a ticket. A ticket names a dish and a deadline; serving the
// plate whose contents are exactly that dish's ingredients, in any order, fills it.

import { DISHES, MAX_TICKETS, TICKET_INTERVAL, TICKET_INTERVAL_MIN, TICKET_MIN_SECONDS, TICKET_SECONDS, dishById } from './config.js';

let ticketNumber = 0;

/** A fresh ticket for a random dish, with a countdown that shrinks on later days. */
export function spawnTicket(random, day) {
  ticketNumber += 1;
  const dish = random.pick(DISHES);
  const seconds = Math.max(TICKET_MIN_SECONDS, TICKET_SECONDS - (day - 1) * 2);
  return {
    id: ticketNumber,
    dish: dish.id,
    name: dish.name,
    needs: [...dish.needs],
    timeLeft: seconds,
    maxTime: seconds,
  };
}

/** Seconds until the next ticket arrives, shorter on later days. */
export function nextTicketIn(random, day) {
  const base = Math.max(TICKET_INTERVAL_MIN, TICKET_INTERVAL - (day - 1) * 0.8);
  return base * (0.8 + random.next() * 0.4);
}

/** The plate's item ids, sorted, so order on the plate never matters. */
export function plateContents(plate) {
  return plate.items.map((item) => item.ing).sort();
}

/** The ticket this plate completes, or null: the plate must hold exactly the dish's
 *  ingredients, each prepared (chopped, cooked, or both, as its prep demands). */
export function matchingTicket(plate, tickets) {
  if (plate.items.length === 0) return null;
  for (const item of plate.items) {
    if (!item.ready) return null;
  }
  const contents = plateContents(plate);
  for (const ticket of tickets) {
    const needs = [...ticket.needs].sort();
    if (contents.length === needs.length && contents.every((id, index) => id === needs[index])) {
      return ticket;
    }
  }
  return null;
}

/** What a dish still needs, given what is already on the plate: the ticket's chips the
 *  renderer greys out once the matching item is plated. */
export function missingFor(ticket, plate) {
  const have = plateContents(plate);
  return ticket.needs.filter((id) => !have.includes(id));
}

/** A short hint for the ticket, for the screen-reader line and the title screen. */
export function ticketHint(ticket) {
  const dish = dishById(ticket.dish);
  return `${ticket.name}: ${dish.needs.join(', ')}`;
}

export function resetTicketNumbers() {
  ticketNumber = 0;
}

export { MAX_TICKETS };
