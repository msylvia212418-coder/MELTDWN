import { resumeAudio } from './audio.js';
import { CANVAS_W, CANVAS_H } from './constants.js';

const keys = {};
const justPressed = {};
let lastClick = null;

export function initInput(canvas) {
  const targetCanvas = canvas || document.getElementById('gameCanvas');

  window.addEventListener('keydown', (e) => {
    resumeAudio();
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
    // Prevent scrolling for game keys
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  if (targetCanvas) {
    targetCanvas.addEventListener('pointerdown', (e) => {
      resumeAudio();
      const rect = targetCanvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      lastClick = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    });
  }
}

export function isDown(code) {
  return !!keys[code];
}

export function wasPressed(code) {
  return !!justPressed[code];
}

export function wasClicked() {
  return lastClick;
}

/** Call at end of each frame */
export function clearFrameInput() {
  for (const k in justPressed) {
    delete justPressed[k];
  }
  lastClick = null;
}

/** Reset all input state (e.g. on state transition) */
export function resetInput() {
  for (const k in keys) delete keys[k];
  for (const k in justPressed) delete justPressed[k];
  lastClick = null;
}
