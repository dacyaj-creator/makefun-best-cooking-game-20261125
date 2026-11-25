// Every pixel of Warung Kilat, drawn in code: the warung's wall and awning, the order
// board, the kitchen stations, the cook, and the food itself. Nothing is an image file:
// each ingredient is a small shape the renderer draws, so a dish reads at a glance
// even when the screenshot is shrunk to a contact sheet.

import { FIELD, FONT, INGREDIENTS, PALETTE, STATIONS, STOVE_SLOTS, ingredientById } from './config.js';
import { matchingTicket } from './orders.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** A ring showing 0..1 of a prep (chopping or cooking) around a station. */
function progressRing(ctx, x, y, radius, progress, color) {
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
}

/** One ingredient, drawn as a food shape. `stage` changes it: raw, chopped, cooked, burnt. */
export function drawIngredient(ctx, ingId, x, y, size, stage = 'raw') {
  const ing = ingredientById(ingId);
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (stage === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.2, s * 0.3, 0, Math.PI * 2);
    ctx.arc(s * 0.3, s * 0.2, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (ingId === 'nasi') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.25, s * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = ing.dark;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-s * 0.5 + i * s * 0.25, -s * 0.1 + (i % 2) * s * 0.2, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingId === 'mie') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = s * 0.28;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, -s * 0.4 + i * s * 0.4);
      ctx.quadraticCurveTo(0, -s * 0.7 + i * s * 0.4, s * 0.8, -s * 0.4 + i * s * 0.4);
      ctx.stroke();
    }
  } else if (ingId === 'ayam') {
    ctx.fillStyle = stage === 'cooked' ? '#8a4b1f' : ing.color;
    if (stage === 'chopped') {
      ctx.beginPath();
      ctx.arc(-s * 0.35, 0, s * 0.45, 0, Math.PI * 2);
      ctx.arc(s * 0.35, s * 0.1, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5f0e1';
      ctx.lineWidth = s * 0.22;
      ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.45);
      ctx.lineTo(s * 0.75, s * 0.8);
      ctx.stroke();
    }
  } else if (ingId === 'telur') {
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    if (stage === 'cooked') {
      ctx.strokeStyle = '#c98f1b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = stage === 'cooked' ? '#f2a007' : ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'sayur') {
    ctx.fillStyle = ing.color;
    if (stage === 'chopped') {
      ctx.save();
      ctx.rotate(0.4);
      ctx.fillRect(-s * 0.8, -s * 0.15, s * 1.6, s * 0.3);
      ctx.rotate(-0.8);
      ctx.fillRect(-s * 0.8, -s * 0.15, s * 1.6, s * 0.3);
      ctx.restore();
    } else {
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(i * s * 0.45, -i * s * 0.15, s * 0.32, s * 0.6, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (ingId === 'sambal') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.15, s * 0.8, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff8a5c';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(-s * 0.5 + i * s * 0.3, -s * 0.25 + (i % 2) * s * 0.25, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (stage === 'cooked') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 1.1);
    ctx.quadraticCurveTo(-s * 0.5, -s * 1.4, -s * 0.3, -s * 1.7);
    ctx.moveTo(s * 0.3, -s * 1.1);
    ctx.quadraticCurveTo(s * 0.5, -s * 1.4, s * 0.3, -s * 1.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h, plate) {
  const urgent = ticket.timeLeft < 8;
  const pulse = urgent ? 0.75 + 0.25 * Math.sin(performance.now() / 120) : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? PALETTE.timerBad : PALETTE.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  ctx.restore();

  text(ctx, `#${ticket.id} ${ticket.name}`, x + 12, y + 20, 17, '#3a2a18', 'left');
  // Ingredient chips: filled once the matching item is already on the plate.
  const have = plate ? plate.items.map((item) => item.ing) : [];
  let chipX = x + 14;
  for (const need of ticket.needs) {
    const ing = ingredientById(need);
    const done = have.includes(need);
    ctx.globalAlpha = done ? 0.35 : 1;
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(chipX + 13, y + 48, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (done) {
      ctx.strokeStyle = '#2f7d2b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(chipX + 6, y + 48);
      ctx.lineTo(chipX + 11, y + 53);
      ctx.lineTo(chipX + 20, y + 43);
      ctx.stroke();
    }
    text(ctx, ing.name, chipX + 13, y + 72, 11, '#3a2a18');
    chipX += 52;
  }
  ctx.globalAlpha = 1;
  // Countdown bar.
  const frac = Math.max(0, ticket.timeLeft / ticket.maxTime);
  const barColor = frac > 0.5 ? PALETTE.timerGood : frac > 0.25 ? PALETTE.timerWarn : PALETTE.timerBad;
  ctx.fillStyle = '#e0d0ae';
  roundRect(ctx, x + 12, y + h - 20, w - 24, 10, 5);
  ctx.fill();
  ctx.fillStyle = barColor;
  roundRect(ctx, x + 12, y + h - 20, (w - 24) * frac, 10, 5);
  ctx.fill();
  text(ctx, `${Math.ceil(ticket.timeLeft)} dtk`, x + w - 14, y + h - 34, 13, urgent ? PALETTE.timerBad : '#7a5a2a', 'right');
}

/** A station's name on a dark pill, so it reads on the wall and on the counter. */
function stationLabel(ctx, label, x, y) {
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = 'rgba(58,42,24,0.85)';
  const w = ctx.measureText(label).width + 22;
  roundRect(ctx, x - w / 2, y - 11, w, 22, 11);
  ctx.fill();
  text(ctx, label, x, y + 1, 12, PALETTE.text);
}

function drawStations(ctx, state) {
  const kitchen = state.kitchen;
  // Counter body.
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, 16, 400, 1248, 150, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, 16, 400, 1248, 26, 12);
  ctx.fill();

  // Shelf: six ingredient bins with their number keys.
  const shelf = STATIONS.shelf;
  ctx.fillStyle = PALETTE.panelLight;
  roundRect(ctx, shelf.x - shelf.width / 2, shelf.y - 62, shelf.width, 118, 10);
  ctx.fill();
  const binW = 38;
  const startX = shelf.x - shelf.width / 2 + 8;
  INGREDIENTS.forEach((ing, index) => {
    const bx = startX + index * (binW + 3) + binW / 2;
    const by = shelf.y - 14;
    ctx.fillStyle = state.selected === ing.id ? '#ffd94d' : '#fff8ea';
    roundRect(ctx, bx - binW / 2, by - 30, binW, 62, 8);
    ctx.fill();
    drawIngredient(ctx, ing.id, bx, by - 2, 30);
    text(ctx, ing.key, bx, by + 22, 11, '#3a2a18');
    text(ctx, ing.name, bx, by + 46, 10, PALETTE.muted);
  });
  stationLabel(ctx, shelf.label, shelf.x, shelf.y - 76);

  // Chopping board.
  const board = STATIONS.board;
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, board.x - 52, board.y - 34, 104, 62, 8);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (kitchen.board.item) {
    const item = kitchen.board.item;
    drawIngredient(ctx, item.ing, board.x, board.y - 4, 44, item.stage);
    if (item.stage === 'raw') progressRing(ctx, board.x, board.y - 4, 30, item.progress, '#ff9800');
    else text(ctx, 'SIAP', board.x, board.y + 34, 11, '#2f7d2b');
  }
  stationLabel(ctx, board.label, board.x, board.y - 76);

  // Stove: two woks with flames, progress rings and smoke when burnt.
  const stove = STATIONS.stove;
  ctx.fillStyle = '#2b2b2b';
  roundRect(ctx, stove.x - stove.width / 2, stove.y - 40, stove.width, 74, 10);
  ctx.fill();
  STOVE_SLOTS.forEach((slot, index) => {
    const wx = stove.x + slot.dx;
    const wy = stove.y - 4;
    const item = kitchen.stove.slots[index];
    if (item && (item.stage === 'chopped' || item.stage === 'raw')) {
      ctx.fillStyle = PALETTE.flame;
      ctx.beginPath();
      ctx.moveTo(wx - 16, wy + 26);
      ctx.quadraticCurveTo(wx - 20, wy + 8, wx, wy - 2);
      ctx.quadraticCurveTo(wx + 20, wy + 8, wx + 16, wy + 26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(wx, wy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(wx, wy, 24, 0, Math.PI * 2);
    ctx.fill();
    if (item) {
      drawIngredient(ctx, item.ing, wx, wy, 34, item.stage);
      if (item.stage === 'chopped' || item.stage === 'raw') {
        progressRing(ctx, wx, wy, 34, item.progress, '#ff8c1a');
      } else if (item.stage === 'cooked') {
        progressRing(ctx, wx, wy, 34, 1 - item.overTime / 5, '#e53935');
      } else if (item.stage === 'burnt') {
        ctx.fillStyle = 'rgba(141,141,141,0.8)';
        ctx.beginPath();
        ctx.arc(wx - 8, wy - 34, 7, 0, Math.PI * 2);
        ctx.arc(wx + 6, wy - 44, 9, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, 'GOSONG', wx, wy + 42, 10, '#ff8a80');
      }
    }
  });
  stationLabel(ctx, stove.label, stove.x, stove.y - 76);

  // Assembly plate.
  const plate = STATIONS.plate;
  const readyTicket = matchingTicket(kitchen.plate, state.tickets);
  if (readyTicket) {
    ctx.save();
    ctx.shadowColor = PALETTE.readyGlow;
    ctx.shadowBlur = 24;
    ctx.fillStyle = PALETTE.ready;
    ctx.beginPath();
    ctx.ellipse(plate.x, plate.y - 4, 62, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(plate.x, plate.y - 4, 56, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#efe3c2';
  ctx.beginPath();
  ctx.ellipse(plate.x, plate.y - 4, 40, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  kitchen.plate.items.forEach((item, index) => {
    const px = plate.x - 36 + index * 24;
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(px, plate.y + 6, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, item.ing, px, plate.y - 4, 26, item.stage);
  });
  if (readyTicket) text(ctx, 'SIAP SAJI!', plate.x, plate.y - 52, 15, PALETTE.readyGlow);
  stationLabel(ctx, plate.label, plate.x, plate.y - 76);

  // Serving window.
  const win = STATIONS.window;
  ctx.fillStyle = '#8a5a2a';
  roundRect(ctx, win.x - 70, win.y - 66, 140, 96, 10);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  roundRect(ctx, win.x - 58, win.y - 54, 116, 60, 8);
  ctx.fill();
  text(ctx, 'PESANAN', win.x, win.y - 34, 13, '#3a2a18');
  text(ctx, 'SIAP', win.x, win.y - 14, 13, '#3a2a18');
  // The service bell.
  ctx.fillStyle = readyTicket ? '#ffd94d' : '#c9a86a';
  ctx.beginPath();
  ctx.arc(win.x, win.y + 22, 14, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(win.x - 16, win.y + 20, 32, 4);
  stationLabel(ctx, win.label, win.x, win.y - 76);

  // Trash bin.
  const trash = STATIONS.trash;
  ctx.fillStyle = '#5a5a5a';
  roundRect(ctx, trash.x - 26, trash.y - 30, 52, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#777';
  roundRect(ctx, trash.x - 30, trash.y - 36, 60, 10, 5);
  ctx.fill();
  stationLabel(ctx, trash.label, trash.x, trash.y - 52);
}

function drawCook(ctx, state) {
  const cook = state.cook;
  const x = cook.x;
  const feetY = 648;
  // Body: blue shirt, white apron.
  ctx.fillStyle = PALETTE.cookShirt;
  roundRect(ctx, x - 20, feetY - 52, 40, 52, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.cookApron;
  roundRect(ctx, x - 13, feetY - 46, 26, 44, 6);
  ctx.fill();
  // Head and chef hat.
  ctx.fillStyle = PALETTE.cookSkin;
  ctx.beginPath();
  ctx.arc(x, feetY - 66, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cookHat;
  roundRect(ctx, x - 16, feetY - 92, 32, 14, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 9, feetY - 92, 8, Math.PI, 0);
  ctx.arc(x + 9, feetY - 92, 8, Math.PI, 0);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 6, feetY - 66, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, feetY - 66, 2, 0, Math.PI * 2);
  ctx.fill();
  // The item in hand, held high.
  if (cook.carrying) {
    ctx.fillStyle = 'rgba(255,248,234,0.95)';
    ctx.beginPath();
    ctx.arc(x, feetY - 108, 20, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, cook.carrying.ing, x, feetY - 108, 30, cook.carrying.stage);
  }
}

function drawHud(ctx, state, best) {
  // Day, score, combo and hearts on the left; the shift timer in the middle.
  text(ctx, `HARI ${state.day}`, 24, 84, 20, PALETTE.text, 'left');
  text(ctx, `SKOR ${state.score}`, 24, 110, 16, PALETTE.muted, 'left');
  if (state.combo >= 2) {
    ctx.fillStyle = '#ffd94d';
    roundRect(ctx, 150, 96, 92, 26, 13);
    ctx.fill();
    text(ctx, `KOMBO x${state.combo}`, 196, 110, 14, '#3a2a18');
  }
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.hearts ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
    const hx = 1160 + i * 34;
    ctx.beginPath();
    ctx.arc(hx, 84, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 10, 84);
    ctx.lineTo(hx, 100);
    ctx.lineTo(hx + 10, 84);
    ctx.fill();
  }
  text(ctx, `TERBAIK ${Math.max(best, state.score)}`, 1240, 110, 14, PALETTE.muted, 'right');
  // Shift timer: big, and red when the day is almost over.
  const dayFrac = state.dayTime / 90;
  const timerColor = dayFrac > 0.25 ? PALETTE.text : PALETTE.timerBad;
  const minutes = Math.floor(state.dayTime / 60);
  const seconds = Math.floor(state.dayTime % 60);
  text(ctx, `${minutes}:${String(seconds).padStart(2, '0')}`, 640, 92, 34, timerColor);
  text(ctx, 'SHIFT BERAKHIR', 640, 118, 11, PALETTE.muted);
}

function drawWall(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 48, FIELD.width, 352);
  // A shelf with pots and a menu board on the wall, below the order board.
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 330, FIELD.width, 10);
  ctx.fillStyle = '#6b4a2a';
  ctx.fillRect(60, 286, 220, 8);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = ['#d63c2f', '#2f80ed', '#5fbf5a'][i];
    ctx.beginPath();
    ctx.arc(100 + i * 70, 272, 16, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#3a2a18';
  roundRect(ctx, 980, 248, 240, 84, 8);
  ctx.fill();
  text(ctx, 'MENU HARI INI', 1100, 266, 14, '#ffd94d');
  text(ctx, 'Nasi Goreng · Mie Goreng', 1100, 290, 12, PALETTE.text);
  text(ctx, 'Ayam Geprek · Nasi Ayam', 1100, 310, 12, PALETTE.text);
  // Floor.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 550, FIELD.width, 170);
  ctx.fillStyle = PALETTE.floorDark;
  for (let x = 0; x < FIELD.width; x += 80) {
    ctx.fillRect(x, 550, 2, 170);
  }
  // Awning stripes across the top.
  for (let x = 0; x < FIELD.width; x += 80) {
    ctx.fillStyle = (x / 80) % 2 === 0 ? PALETTE.awningA : PALETTE.awningB;
    ctx.fillRect(x, 0, 80, 48);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 44, FIELD.width, 4);
  ctx.fillStyle = PALETTE.awningB;
  roundRect(ctx, 640 - 150, 8, 300, 34, 17);
  ctx.fill();
  text(ctx, 'WARUNG KILAT', 640, 26, 24, '#3a2a18');
}

function drawOverlay(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(20,12,4,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  let y = 250;
  for (const line of lines) {
    text(ctx, line.text, 640, y, line.size, line.color || PALETTE.text);
    y += line.size + 14;
  }
  if (accent) text(ctx, accent, 640, y + 10, 16, '#ffd94d');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function draw(state, screen, best) {
    ctx.save();
    if (state.shake > 0) {
      const mag = state.shake * 18;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    drawWall(ctx);
    drawHud(ctx, state, best);
    // Order board: up to four ticket cards.
    const ticketW = 296;
    const gap = 12;
    const total = Math.min(state.tickets.length, 4) * (ticketW + gap) - gap;
    let tx = (FIELD.width - total) / 2;
    for (const ticket of state.tickets.slice(0, 4)) {
      drawTicket(ctx, ticket, tx, 132, ticketW, 96, state.kitchen.plate);
      tx += ticketW + gap;
    }
    if (state.tickets.length === 0) {
      text(ctx, 'Belum ada pesanan — sebentar lagi datang!', 640, 180, 16, PALETTE.muted);
    }
    drawStations(ctx, state);
    drawCook(ctx, state);

    // Floating score popups.
    for (const popup of state.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, popup.life));
      text(ctx, popup.text, popup.x, popup.y, 26, popup.color);
      ctx.globalAlpha = 1;
    }
    // A short hint line when the cook does something wrong.
    if (state.messageTime > 0) {
      ctx.fillStyle = 'rgba(58,42,24,0.9)';
      const w = ctx.measureText(state.message).width + 36;
      roundRect(ctx, 640 - w / 2, 668, w, 34, 17);
      ctx.fill();
      text(ctx, state.message, 640, 686, 16, '#ffd94d');
    }
    ctx.restore();

    // Red flash when a ticket expires.
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(229,57,53,${state.flash * 0.35})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }

    if (screen === SCREEN_TITLE) {
      drawOverlay(ctx, [
        { text: 'WARUNG KILAT', size: 56, color: '#ffd94d' },
        { text: 'Dapur cepat saji khas Indonesia', size: 22 },
        { text: 'Ambil bahan (klik / tombol 1-6), potong di talnan, masak di kompor,', size: 17, color: PALETTE.muted },
        { text: 'susun di piring, sajikan di jendela sebelum pesanan hangus.', size: 17, color: PALETTE.muted },
        { text: 'Gerak: ← → / A D · Pakai: Spasi / E / klik · Jeda: P', size: 15, color: PALETTE.muted },
      ], best > 0 ? `Skor terbaik: ${best}` : 'Tekan SPASI atau klik untuk mulai masak!');
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay(ctx, [
        { text: 'JEDA', size: 48, color: '#ffd94d' },
        { text: 'Warung istirahat sebentar.', size: 20 },
      ], 'Tekan P untuk lanjut.');
    } else if (screen === SCREEN_OVER) {
      drawOverlay(ctx, [
        { text: 'WARUNG TUTUP', size: 48, color: '#ff8a80' },
        { text: `Skor akhir: ${state.score}  ·  Hari ke-${state.day}  ·  Tersaji: ${state.served}`, size: 22 },
        { text: `Kombo terbaik: x${state.bestCombo}  ·  Pesanan hangus: ${state.lost}`, size: 17, color: PALETTE.muted },
      ], best > 0 ? `Skor terbaik: ${best}` : 'Tekan R atau klik untuk buka warung lagi.');
    }
  }

  return { draw };
}
