// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the ticket order. ?shot=cover|play|rush|serve|start|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_DAY, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED } from './world.js';
import { ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_USE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Main. Ambil bahan, masak, sajikan sebelum pesanan hangus.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.over();
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Warung tutup. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function playSounds(result) {
    if (!result) return;
    if (result.kind === 'picked' || result.kind === 'trashed') audio.click();
    else if (result.kind === 'placed') audio.chop();
    else if (result.kind === 'error') audio.error();
  }

  function playStepSounds() {
    for (const sound of world.state.sounds || []) {
      if (sound === 'chopped') audio.chop();
      else if (sound === 'cooked') audio.ding();
      else if (sound === 'burnt') audio.warn();
    }
    world.state.sounds = [];
  }

  function handleActions() {
    const actions = input.takeActions();
    const clicked = input.takeClick();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Suara mati.' : 'Suara hidup.');
    }
    // During play, the use press belongs to the world step below, not to this handler:
    // hand it back so step() can pick it up.
    if (screen === SCREEN_PLAY && actions & ACTION_USE) input.requeue(ACTION_USE);
    if ((actions & ACTION_USE) || clicked) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return;
      }
    }
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_USE) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Main lagi.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, false);
      return;
    }
    const targetBefore = input.walkTarget();
    const move = input.direction(world.state.cook.x);
    const actions = input.takeActions();
    const use = (actions & ACTION_USE) !== 0;
    const selected = input.takeSelected();
    const events = world.step(STEP, move, use, selected);
    playStepSounds();
    if (events & EVENT_SERVED) audio.coin();
    if (events & EVENT_EXPIRED) audio.warn();
    if (events & EVENT_DAY) audio.fanfare();
    // The cook reached a clicked spot: use the station under it.
    if (targetBefore !== null && input.walkTarget() === null) {
      const stationId = world.stationAt(world.state.cook.x);
      if (stationId) playSounds(world.interactNow(stationId));
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Kilat. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
