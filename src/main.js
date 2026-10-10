// ── MELTDWN — Main Entry Point ──
import './style.css';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { initInput, clearFrameInput } from './input.js';
import { createGameState, updateGame, updateValveCooldowns, tickFrame } from './gameState.js';
import { renderFrame } from './renderer.js';

// ── Setup canvas ──
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// ── Init ──
initInput(canvas);
const state = createGameState();
window.__GAME_STATE__ = state;

// ── Game loop ──
let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

function gameLoop(timestamp) {
  const delta = timestamp - lastTime;

  if (delta >= FRAME_TIME) {
    lastTime = timestamp - (delta % FRAME_TIME);

    tickFrame();
    updateGame(state);
    updateValveCooldowns(state);
    renderFrame(ctx, state);
    clearFrameInput();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
