// Keyboard and pointer input. Held keys steer the cook; one-shot presses (use, pause,
// restart, mute, ingredient keys) are queued as bit flags and taken once by the loop, so
// a press between two frames is never lost and never counted twice. Clicking the kitchen
// sets a walk target: the cook walks there, then uses the station under the click.

import { INGREDIENTS } from './config.js';

export const ACTION_USE = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const USE = new Set(['Space', 'Enter', 'KeyE']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);

const KEY_BY_CODE = new Map(INGREDIENTS.map((item) => [`Digit${item.key}`, item.id]));

export function createInput(canvas) {
  let left = false;
  let right = false;
  let actions = 0;
  let selected = null;
  let walkTarget = null;
  let clicked = null;

  function canvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 1280;
  }

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (USE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_USE;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (KEY_BY_CODE.has(event.code)) {
      selected = KEY_BY_CODE.get(event.code);
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    clicked = canvasX(event.clientX);
    walkTarget = clicked;
  });

  return {
    /** -1 for left, 1 for right, 0 for neither or both; keys take over from a walk. */
    direction(cookX) {
      if (left || right) {
        walkTarget = null;
        return (right ? 1 : 0) - (left ? 1 : 0);
      }
      if (walkTarget !== null) {
        const diff = walkTarget - cookX;
        if (Math.abs(diff) < 6) {
          walkTarget = null;
          return 0;
        }
        return diff > 0 ? 1 : -1;
      }
      return 0;
    },
    /** The walk target, in kitchen coordinates, or null. */
    walkTarget() {
      return walkTarget;
    },
    /** Clear the walk target (the cook arrived, or the player steered by keys). */
    clearWalk() {
      walkTarget = null;
    },
    /** The x of the last click since the last call, or null. */
    takeClick() {
      const taken = clicked;
      clicked = null;
      return taken;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Put flags back so the next takeActions call sees them again. */
    requeue(flags) {
      actions |= flags;
    },
    /** The ingredient key pressed since the last call (1-6), or null. */
    takeSelected() {
      const taken = selected;
      selected = null;
      return taken;
    },
  };
}
