// ── Renderer ──
// All Canvas 2D drawing for the game world, HUD, and menus.
import { COLORS, CANVAS_W, CANVAS_H, TILE, PRESSURE_MAX, PRESSURE_WARN, PRESSURE_DANGER, STATE } from './constants.js';
import { LEVEL_W, LEVEL_H } from './level.js';
import { renderPlayer } from './player.js';
import { isMuted } from './audio.js';

let frameTick = 0;

export function renderFrame(ctx, state) {
  frameTick++;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (state.gameState === STATE.MENU) {
    drawMenu(ctx);
    return;
  }
  if (state.gameState === STATE.INSTRUCTIONS) {
    drawInstructions(ctx);
    return;
  }

  // ── Camera ──
  const camX = getCamX(state.player);
  const camY = getCamY(state.player);

  // ── Background layers ──
  drawBackground(ctx, camX, camY);

  // ── Platforms ──
  drawPlatforms(ctx, state.level.platforms, camX, camY);
  if (state.shortcutOpen) {
    drawShortcutPlatforms(ctx, state.level.shortcutPlatforms, camX, camY);
  } else {
    drawLockedShortcutGate(ctx, camX, camY);
  }

  // ── Hazards ──
  drawHazards(ctx, state.level.hazards, camX, camY);

  // ── Checkpoints ──
  drawCheckpoints(ctx, state.level.checkpoints, camX, camY);

  // ── Gears ──
  drawGears(ctx, state.level.gears, camX, camY);

  // ── Permits ──
  drawPermits(ctx, state.level.permits, camX, camY);

  // ── Upgrades ──
  drawUpgrades(ctx, state.level.upgrades, camX, camY);

  // ── Machines ──
  drawMachines(ctx, state.level.machines, camX, camY);

  // ── Valves ──
  drawValves(ctx, state.level.valves, camX, camY);

  // ── Signs ──
  drawSigns(ctx, state.level.signs, camX, camY);

  // ── Engine ──
  drawEngine(ctx, state.level.engine, camX, camY);

  // ── Player ──
  renderPlayer(ctx, state.player, camX, camY);

  // ── Steam particles ──
  drawSteamParticles(ctx, state.particles, camX, camY);

  // ── HUD ──
  drawHUD(ctx, state);

  // ── Dialogue overlay ──
  if (state.dialogue) {
    drawDialogue(ctx, state.dialogue);
  }

  // ── Interaction prompt ──
  if (state.interactPrompt && !state.dialogue) {
    drawInteractPrompt(ctx, state.interactPrompt);
  }

  // ── Pause overlay ──
  if (state.gameState === STATE.PAUSED) {
    drawPauseOverlay(ctx);
  }

  // ── Victory overlay ──
  if (state.gameState === STATE.VICTORY) {
    drawVictoryOverlay(ctx, state);
  }

  // ── Defeat overlay ──
  if (state.gameState === STATE.DEFEAT) {
    drawDefeatOverlay(ctx, state);
  }
}

// ── Camera ──
function getCamX(player) {
  let cx = player.x - CANVAS_W / 2 + player.w / 2;
  if (cx < 0) cx = 0;
  if (cx > LEVEL_W - CANVAS_W) cx = LEVEL_W - CANVAS_W;
  return cx;
}

function getCamY(player) {
  let cy = player.y - CANVAS_H / 2 + player.h / 2;
  if (cy < 0) cy = 0;
  if (cy > LEVEL_H - CANVAS_H) cy = LEVEL_H - CANVAS_H;
  return cy;
}

// ── Background ──
function drawBackground(ctx, camX, camY) {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#0D2B2D');
  grad.addColorStop(0.5, '#1A3A3A');
  grad.addColorStop(1, '#2C2C2C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Parallax pipes (back layer)
  ctx.strokeStyle = COLORS.charcoalMed;
  ctx.lineWidth = 6;
  for (let i = 0; i < 12; i++) {
    const px = i * 300 - (camX * 0.2) % 300;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, CANVAS_H);
    ctx.stroke();
    // Horizontal pipes
    ctx.beginPath();
    ctx.moveTo(px - 50, 100 + (i % 3) * 80);
    ctx.lineTo(px + 250, 100 + (i % 3) * 80);
    ctx.stroke();
  }

  // Gears in background (parallax)
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 8; i++) {
    const gx = i * 400 - (camX * 0.15) % 400 + 100;
    const gy = 150 + (i % 3) * 120;
    drawGearShape(ctx, gx, gy, 40 + (i % 2) * 20, frameTick * 0.005 * (i % 2 === 0 ? 1 : -1));
  }
  ctx.globalAlpha = 1;
}

// ── Platforms ──
function drawPlatforms(ctx, platforms, camX, camY) {
  for (const p of platforms) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    if (sx + p.w < -50 || sx > CANVAS_W + 50) continue;

    if (p.h <= TILE / 2 + 1) {
      // Thin platform — metal grating
      ctx.fillStyle = COLORS.charcoalMed;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = COLORS.copper;
      ctx.fillRect(sx, sy, p.w, 3);
      // Rivets
      ctx.fillStyle = COLORS.brassGold;
      for (let rx = sx + 8; rx < sx + p.w; rx += 20) {
        ctx.beginPath();
        ctx.arc(rx, sy + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Floor / thick platform
      // Top surface
      ctx.fillStyle = COLORS.charcoalMed;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = COLORS.charcoalLight;
      ctx.fillRect(sx, sy, p.w, 4);
      // Brick pattern
      ctx.strokeStyle = COLORS.charcoal;
      ctx.lineWidth = 1;
      for (let by = sy + 8; by < sy + p.h; by += TILE / 2) {
        const offset = ((by - sy) / (TILE / 2)) % 2 === 0 ? 0 : TILE / 3;
        for (let bx = sx + offset; bx < sx + p.w; bx += TILE * 0.66) {
          ctx.strokeRect(bx, by, TILE * 0.66, TILE / 2);
        }
      }
    }
  }
}

// ── Shortcut platforms & gate ──
function drawShortcutPlatforms(ctx, shortcutPlatforms, camX, camY) {
  if (!shortcutPlatforms) return;
  for (const p of shortcutPlatforms) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    if (sx + p.w < -50 || sx > CANVAS_W + 50) continue;

    // Polished gold pneumatic pipe platform
    ctx.fillStyle = COLORS.brassDark;
    ctx.fillRect(sx, sy, p.w, p.h);
    ctx.fillStyle = COLORS.brassGold;
    ctx.fillRect(sx, sy, p.w, 3);
    ctx.fillStyle = COLORS.brassLight;
    ctx.fillRect(sx, sy + 1, p.w, 1);

    // Glowing rivets
    ctx.fillStyle = COLORS.yellowWarn;
    for (let rx = sx + 8; rx < sx + p.w; rx += 18) {
      ctx.beginPath();
      ctx.arc(rx, sy + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Entrance banner
  const first = shortcutPlatforms[0];
  if (first) {
    const bx = first.x - camX;
    const by = first.y - camY - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx, by, 140, 16);
    ctx.strokeStyle = COLORS.brassGold;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 140, 16);
    ctx.fillStyle = COLORS.brassLight;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ GOLD SHORTCUT', bx + 6, by + 11);
  }
}

function drawLockedShortcutGate(ctx, camX, camY) {
  const gx = 51 * TILE - camX;
  const gy = 6 * TILE - camY - 20;
  if (gx < -100 || gx > CANVAS_W + 100) return;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(gx, gy, 150, 20);
  ctx.strokeStyle = COLORS.rustRed;
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy, 150, 20);

  ctx.fillStyle = COLORS.rustLight;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('🔒 SHORTCUT LOCKED', gx + 6, gy + 13);
}

// ── Gears ──
function drawGears(ctx, gears, camX, camY) {
  for (const g of gears) {
    if (g.collected) continue;
    const gx = g.x - camX + 10;
    const gy = g.y - camY + 10 + Math.sin(frameTick * 0.04 + g.bobOffset) * 4;
    drawGearShape(ctx, gx, gy, 10, frameTick * 0.02);
    // Glow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COLORS.brassLight;
    ctx.beginPath();
    ctx.arc(gx, gy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawGearShape(ctx, cx, cy, r, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = COLORS.brassGold;
  ctx.beginPath();
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.35) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.65) / teeth) * Math.PI * 2;
    const a4 = ((i + 1) / teeth) * Math.PI * 2;
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.lineTo(Math.cos(a2) * (r * 1.3), Math.sin(a2) * (r * 1.3));
    ctx.lineTo(Math.cos(a3) * (r * 1.3), Math.sin(a3) * (r * 1.3));
    ctx.lineTo(Math.cos(a4) * r, Math.sin(a4) * r);
  }
  ctx.closePath();
  ctx.fill();
  // Center hole
  ctx.fillStyle = COLORS.charcoal;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Permits ──
function drawPermits(ctx, permits, camX, camY) {
  for (const p of permits) {
    if (p.collected) continue;
    const px = p.x - camX;
    const py = p.y - camY + Math.sin(frameTick * 0.03 + p.bobOffset) * 3;
    // Parchment document
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(px, py, p.w, p.h);
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, p.w, p.h);
    // Seal
    ctx.fillStyle = COLORS.rustRed;
    ctx.beginPath();
    ctx.arc(px + p.w / 2, py + p.h - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    // Lines (text representation)
    ctx.fillStyle = COLORS.charcoalLight;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + 4, py + 4 + i * 5, p.w - 8, 2);
    }
    // Glow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(px - 3, py - 3, p.w + 6, p.h + 6);
    ctx.globalAlpha = 1;
  }
}

// ── Machines ──
function drawMachines(ctx, machines, camX, camY) {
  for (const m of machines) {
    const mx = m.x - camX;
    const my = m.y - camY;

    if (m.id === 'engine') continue; // drawn separately

    // Machine body
    ctx.fillStyle = m.activated ? COLORS.teal : COLORS.charcoalMed;
    ctx.fillRect(mx, my, m.w, m.h);
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, m.w, m.h);

    // Gauge on machine
    const gaugeX = mx + m.w / 2;
    const gaugeY = my + 15;
    ctx.fillStyle = COLORS.bgAlt;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.brassGold;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (m.activated) {
      // Active indicator — green light
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Inactive — red dot
      ctx.fillStyle = COLORS.rustRed;
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '9px "Special Elite", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(m.name, mx + m.w / 2, my - 5);
  }
}

// ── Valves ──
function drawValves(ctx, valves, camX, camY) {
  for (const v of valves) {
    const vx = v.x - camX;
    const vy = v.y - camY;
    // Pipe
    ctx.fillStyle = COLORS.charcoalLight;
    ctx.fillRect(vx + TILE / 2 - 4, vy - 10, 8, TILE + 10);
    // Valve wheel
    ctx.strokeStyle = v.cooldown > 0 ? COLORS.charcoalLight : COLORS.rustRed;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(vx + TILE / 2, vy + TILE / 2, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Spokes
    for (let a = 0; a < 4; a++) {
      const angle = (a / 4) * Math.PI * 2 + frameTick * 0.01;
      ctx.beginPath();
      ctx.moveTo(vx + TILE / 2, vy + TILE / 2);
      ctx.lineTo(vx + TILE / 2 + Math.cos(angle) * 12, vy + TILE / 2 + Math.sin(angle) * 12);
      ctx.stroke();
    }
    // Label
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '8px "Special Elite", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VALVE', vx + TILE / 2, vy - 14);
  }
}

// ── Signs ──
function drawSigns(ctx, signs, camX, camY) {
  for (const s of signs) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    // Post
    ctx.fillStyle = COLORS.copperDark;
    ctx.fillRect(sx + TILE / 2 - 3, sy, 6, s.h);
    // Board
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(sx - 8, sy - 5, TILE + 16, 30);
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, sy - 5, TILE + 16, 30);
    // Text hint
    ctx.fillStyle = COLORS.charcoal;
    ctx.font = '7px "Special Elite", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('READ [E]', sx + TILE / 2, sy + 15);
  }
}

// ── Upgrades ──
function drawUpgrades(ctx, upgrades, camX, camY) {
  for (const u of upgrades) {
    if (u.purchased) continue;
    const ux = u.x - camX;
    const uy = u.y - camY + Math.sin(frameTick * 0.035 + u.bobOffset) * 4;
    // Box
    ctx.fillStyle = COLORS.brassGold;
    ctx.fillRect(ux, uy, u.w, u.h);
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(ux, uy, u.w, u.h);
    // Icon
    ctx.fillStyle = COLORS.charcoal;
    ctx.font = '16px "Spectral SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.id === 'turbo_boots' ? '⚡' : '⚙', ux + u.w / 2, uy + u.h - 6);
    // Name
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '8px "Special Elite", monospace';
    ctx.fillText(u.name, ux + u.w / 2, uy - 6);
    // Glow
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = COLORS.yellowWarn;
    ctx.fillRect(ux - 4, uy - 4, u.w + 8, u.h + 8);
    ctx.globalAlpha = 1;
  }
}

// ── Hazards ──
function drawHazards(ctx, hazards, camX, camY) {
  for (const h of hazards) {
    const hx = h.x - camX;
    const hy = h.y - camY;

    if (h.type === 'steam_vent') {
      // Vent pipe
      ctx.fillStyle = COLORS.charcoalLight;
      ctx.fillRect(hx + 10, hy + h.h - TILE, TILE - 20, TILE);
      if (h.active) {
        // Steam column
        ctx.globalAlpha = 0.35 + Math.sin(frameTick * 0.1) * 0.15;
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(hx + 5, hy, TILE - 10, h.h - TILE);
        ctx.globalAlpha = 1;
        // Warning
        ctx.fillStyle = COLORS.dangerRed;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠', hx + TILE / 2, hy - 5);
      }
    } else if (h.type === 'conveyor') {
      if (!h.active) continue;
      ctx.fillStyle = COLORS.charcoalLight;
      ctx.fillRect(hx, hy, h.w, h.h);
      // Arrow indicators
      ctx.fillStyle = COLORS.yellowWarn;
      const dir = h.dir === 'right' ? 1 : -1;
      for (let ax = 0; ax < h.w; ax += 30) {
        const offset = (frameTick * 2 * dir) % 30;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dir > 0 ? '►' : '◄', hx + ax + offset, hy - 2);
      }
    } else if (h.type === 'gap') {
      // Danger markings around gap
      ctx.fillStyle = COLORS.rustRed;
      ctx.globalAlpha = 0.5 + Math.sin(frameTick * 0.05) * 0.2;
      ctx.fillRect(hx - 5, hy, 5, 3);
      ctx.fillRect(hx + h.w, hy, 5, 3);
      ctx.globalAlpha = 1;
    }
  }
}

// ── Checkpoints ──
function drawCheckpoints(ctx, checkpoints, camX, camY) {
  for (const cp of checkpoints) {
    const cx = cp.x - camX;
    const cy = cp.y - camY;
    // Flag pole
    ctx.fillStyle = COLORS.charcoalLight;
    ctx.fillRect(cx + TILE / 2 - 2, cy - 20, 4, TILE + 20);
    // Flag
    ctx.fillStyle = cp.activated ? COLORS.green : COLORS.charcoalMed;
    ctx.beginPath();
    ctx.moveTo(cx + TILE / 2 + 2, cy - 18);
    ctx.lineTo(cx + TILE / 2 + 18, cy - 12);
    ctx.lineTo(cx + TILE / 2 + 2, cy - 6);
    ctx.closePath();
    ctx.fill();
  }
}

// ── Engine ──
function drawEngine(ctx, engine, camX, camY) {
  if (!engine) return;
  const ex = engine.x - camX;
  const ey = engine.y - camY;

  // Large machine body
  ctx.fillStyle = engine.activated ? COLORS.teal : COLORS.charcoalMed;
  ctx.fillRect(ex, ey, engine.w, engine.h);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 3;
  ctx.strokeRect(ex, ey, engine.w, engine.h);

  // Large gear
  drawGearShape(ctx, ex + engine.w / 2, ey + engine.h / 2, 30,
    engine.activated ? frameTick * 0.03 : 0);

  // Smokestack
  ctx.fillStyle = COLORS.charcoalMed;
  ctx.fillRect(ex + 10, ey - 40, 20, 40);
  ctx.fillRect(ex + engine.w - 30, ey - 30, 20, 30);

  if (engine.activated) {
    // Smoke
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COLORS.steam;
    for (let i = 0; i < 3; i++) {
      const sx = ex + 15 + Math.sin(frameTick * 0.03 + i) * 8;
      const sy = ey - 45 - i * 15 - (frameTick % 60);
      ctx.beginPath();
      ctx.arc(sx, sy, 8 + i * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Label
  ctx.fillStyle = COLORS.brassLight;
  ctx.font = '11px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('GRAND STEAM ENGINE', ex + engine.w / 2, ey - 45);
}

// ── Steam particles ──
function drawSteamParticles(ctx, particles, camX, camY) {
  if (!particles) return;
  ctx.globalAlpha = 0.4;
  for (const p of particles) {
    ctx.fillStyle = `rgba(200,200,200,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y - camY, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── HUD ──
function drawHUD(ctx, state) {
  // Background bar
  ctx.fillStyle = 'rgba(20,20,20,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, 52);
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(0, 52, CANVAS_W, 2);

  // Pressure gauge
  drawPressureGauge(ctx, 15, 5, state.pressure, state.deceptiveGaugeActive, state.gaugeTappedTimer);

  // Gears count
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = '14px "Spectral SC", serif';
  ctx.textAlign = 'left';
  drawGearShape(ctx, 180, 26, 9, frameTick * 0.02);
  ctx.fillStyle = COLORS.parchment;
  ctx.fillText(`× ${state.gearsCollected}`, 194, 31);

  // Permits
  ctx.fillStyle = COLORS.parchment;
  ctx.font = '11px "Special Elite", monospace';
  ctx.fillText(`Permits: ${state.permitsHeld.length}`, 250, 30);

  // Objective
  ctx.fillStyle = COLORS.yellowWarn;
  ctx.font = '10px "Special Elite", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.currentObjective || '', CANVAS_W / 2, 22);
  
  // Supervisor message (brief)
  if (state.supervisorMsg && state.supervisorMsgTimer > 0) {
    ctx.fillStyle = COLORS.cream;
    ctx.font = '9px "Special Elite", monospace';
    ctx.fillText(state.supervisorMsg, CANVAS_W / 2, 40);
  }

  // Upgrades indicators
  let ux = CANVAS_W - 150;
  if (state.player.hasTurboBoots) {
    ctx.fillStyle = COLORS.rustLight;
    ctx.font = '10px "Special Elite", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ TURBO BOOTS', ux, 20);
    ux += 0;
  }
  if (state.player.hasGoldenGear) {
    ctx.fillStyle = COLORS.brassGold;
    ctx.font = '10px "Special Elite", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚙ GOLDEN GEAR', CANVAS_W - 150, 38);
  }

  // Controls indicators (Pause & Sound)
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('⏸ [ESC]', CANVAS_W - 75, 46);
  ctx.fillText(isMuted() ? '🔇 [M]' : '🔊 [M]', CANVAS_W - 10, 46);
}

function drawPressureGauge(ctx, x, y, pressure, deceptive, gaugeTappedTimer) {
  const w = 140;
  const h = 20;
  const isTapped = gaugeTappedTimer > 0;
  const displayPressure = (deceptive && !isTapped) ? Math.max(0, pressure - 20) : pressure;
  const ratio = displayPressure / PRESSURE_MAX;
  
  // Label
  ctx.fillStyle = COLORS.parchment;
  ctx.font = '9px "Special Elite", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PRESSURE', x, y + 10);

  // Background
  ctx.fillStyle = COLORS.bgAlt;
  ctx.fillRect(x, y + 14, w, h);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + 14, w, h);

  // Bar
  let barColor = COLORS.green;
  if (pressure >= PRESSURE_DANGER) barColor = COLORS.dangerRed;
  else if (pressure >= PRESSURE_WARN) barColor = COLORS.yellowWarn;
  
  // Flash when danger
  if (pressure >= PRESSURE_DANGER && frameTick % 20 < 10) {
    barColor = COLORS.rustRed;
  }

  ctx.fillStyle = barColor;
  ctx.fillRect(x + 2, y + 16, (w - 4) * Math.min(ratio, 1), h - 4);

  // Threshold markers
  ctx.strokeStyle = COLORS.yellowWarn;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  const warnX = x + (w * PRESSURE_WARN / PRESSURE_MAX);
  ctx.beginPath(); ctx.moveTo(warnX, y + 14); ctx.lineTo(warnX, y + 34); ctx.stroke();
  const dangerX = x + (w * PRESSURE_DANGER / PRESSURE_MAX);
  ctx.strokeStyle = COLORS.dangerRed;
  ctx.beginPath(); ctx.moveTo(dangerX, y + 14); ctx.lineTo(dangerX, y + 34); ctx.stroke();
  ctx.setLineDash([]);

  // Percentage
  ctx.fillStyle = isTapped ? COLORS.yellowWarn : COLORS.parchment;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(displayPressure)}%`, x + w / 2, y + 30);

  // Deceptive indicator / tap hint
  if (isTapped) {
    ctx.fillStyle = COLORS.yellowWarn;
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('! TRUE READING !', x, y + 44);
  } else if (deceptive) {
    ctx.fillStyle = COLORS.yellowWarn;
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('*calibrated* [Click/T to tap]', x, y + 44);
  }
}

// ── Dialogue box ──
function drawDialogue(ctx, dialogue) {
  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bw = 600;
  const bh = 200;
  const bx = (CANVAS_W - bw) / 2;
  const by = CANVAS_H - bh - 40;

  // Box
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);

  // Header
  ctx.fillStyle = COLORS.tealDark;
  ctx.fillRect(bx, by, bw, 28);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '12px "Spectral SC", serif';
  ctx.textAlign = 'left';
  ctx.fillText(dialogue.title || 'FACTORY NOTICE', bx + 15, by + 19);

  // Body text
  ctx.fillStyle = COLORS.charcoal;
  ctx.font = '13px "Special Elite", monospace';
  const lines = (dialogue.text || '').split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + 20, by + 55 + i * 20);
  });

  // Dismiss hint
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = '10px "Special Elite", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press [E] or [SPACE] to close', bx + bw / 2, by + bh - 15);
}

// ── Interaction prompt ──
function drawInteractPrompt(ctx, text) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const tw = ctx.measureText(text).width + 30;
  const px = CANVAS_W / 2 - tw / 2;
  ctx.fillRect(px, CANVAS_H - 70, tw, 26);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(px, CANVAS_H - 70, tw, 26);
  ctx.fillStyle = COLORS.yellowWarn;
  ctx.font = '11px "Special Elite", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_W / 2, CANVAS_H - 52);
}

// ── Pause overlay ──
function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLORS.brassGold;
  ctx.font = '36px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 30);

  const btnW = 280;
  const btnX = CANVAS_W / 2 - btnW / 2;

  // Resume button
  ctx.fillStyle = 'rgba(27, 107, 111, 0.7)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 5, btnW, 30);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 5, btnW, 30);
  ctx.fillStyle = COLORS.parchment;
  ctx.font = '13px "Special Elite", monospace';
  ctx.fillText('[ ESC ] — RESUME WORK', CANVAS_W / 2, CANVAS_H / 2 + 25);

  // Restart button
  ctx.fillStyle = 'rgba(44, 44, 44, 0.7)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 42, btnW, 26);
  ctx.strokeStyle = COLORS.copper;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 42, btnW, 26);
  ctx.fillStyle = COLORS.cream;
  ctx.fillText('[ R ] — RESTART SHIFT', CANVAS_W / 2, CANVAS_H / 2 + 59);
}

// ── Victory overlay ──
function drawVictoryOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Form 47-B
  const bw = 500;
  const bh = 330;
  const bx = (CANVAS_W - bw) / 2;
  const by = (CANVAS_H - bh) / 2;

  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = COLORS.charcoal;
  ctx.font = '20px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('FORM 47-B', CANVAS_W / 2, by + 40);

  ctx.font = '14px "Special Elite", monospace';
  ctx.fillText('APPLICATION FOR PERMISSION TO CELEBRATE', CANVAS_W / 2, by + 70);

  ctx.fillStyle = COLORS.rustRed;
  ctx.font = '18px "Spectral SC", serif';
  ctx.fillText('STATUS: PENDING REVIEW', CANVAS_W / 2, by + 110);

  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = '11px "Special Elite", monospace';
  ctx.fillText('The Grand Steam Engine is operational.', CANVAS_W / 2, by + 145);
  ctx.fillText('Your celebration request has been filed.', CANVAS_W / 2, by + 165);
  ctx.fillText(`Estimated processing time: ${state.celebrationDays || 412} business days`, CANVAS_W / 2, by + 185);
  ctx.fillText(`Gears collected: ${state.gearsCollected}`, CANVAS_W / 2, by + 215);
  ctx.fillText(`Trust violations: ${state.trustMemory.signTrust + state.trustMemory.upgradeTrust + state.trustMemory.gaugeTrust}`, CANVAS_W / 2, by + 235);

  // Official seal
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = COLORS.rustRed;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2 + 160, by + 225, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.rustRed;
  ctx.font = '8px "Spectral SC", serif';
  ctx.fillText('OFFICIAL', CANVAS_W / 2 + 160, by + 228);

  // Buttons
  const btnW = 190;
  const btnH = 28;
  const btnY = by + bh - 38;
  const btnX1 = CANVAS_W / 2 - btnW - 10;
  const btnX2 = CANVAS_W / 2 + 10;

  ctx.fillStyle = 'rgba(27, 107, 111, 0.85)';
  ctx.fillRect(btnX1, btnY, btnW, btnH);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(btnX1, btnY, btnW, btnH);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '12px "Special Elite", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[ R ] RESTART SHIFT', btnX1 + btnW / 2, btnY + 18);

  ctx.fillStyle = 'rgba(44, 44, 44, 0.85)';
  ctx.fillRect(btnX2, btnY, btnW, btnH);
  ctx.strokeStyle = COLORS.copper;
  ctx.strokeRect(btnX2, btnY, btnW, btnH);
  ctx.fillStyle = COLORS.cream;
  ctx.fillText('[ ESC ] MAIN MENU', btnX2 + btnW / 2, btnY + 18);
}

// ── Defeat overlay ──
function drawDefeatOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(30,0,0,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLORS.dangerRed;
  ctx.font = '32px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('MELTDOWN', CANVAS_W / 2, CANVAS_H / 2 - 60);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = '14px "Special Elite", monospace';
  ctx.fillText(state.defeatReason || 'The factory has claimed another engineer.', CANVAS_W / 2, CANVAS_H / 2 - 20);

  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = '11px "Special Elite", monospace';
  ctx.fillText('An incident report has been filed.', CANVAS_W / 2, CANVAS_H / 2 + 15);
  ctx.fillText('Your next of kin has been notified (pending permit approval).', CANVAS_W / 2, CANVAS_H / 2 + 35);

  const btnW = 260;
  const btnX = CANVAS_W / 2 - btnW / 2;

  // Try again button
  ctx.fillStyle = 'rgba(179, 58, 42, 0.75)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 58, btnW, 32);
  ctx.strokeStyle = COLORS.dangerRed;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 58, btnW, 32);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '13px "Special Elite", monospace';
  ctx.fillText('[ R ] — TRY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 79);

  // Menu button
  ctx.fillStyle = 'rgba(44, 44, 44, 0.75)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 96, btnW, 26);
  ctx.strokeStyle = COLORS.charcoalLight;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 96, btnW, 26);
  ctx.fillStyle = COLORS.parchment;
  ctx.font = '11px "Special Elite", monospace';
  ctx.fillText('[ ESC ] — RETURN TO MENU', CANVAS_W / 2, CANVAS_H / 2 + 113);
}

// ── Main Menu ──
function drawMenu(ctx) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#0D2B2D');
  grad.addColorStop(1, '#1A1A1A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Background gears
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 6; i++) {
    const gx = 200 + i * 180;
    const gy = 150 + (i % 2) * 200;
    drawGearShape(ctx, gx, gy, 50 + i * 10, frameTick * 0.003 * (i % 2 === 0 ? 1 : -1));
  }
  ctx.globalAlpha = 1;

  // Pipes
  ctx.strokeStyle = COLORS.charcoalMed;
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(CANVAS_W, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, CANVAS_H - 80); ctx.lineTo(CANVAS_W, CANVAS_H - 80); ctx.stroke();

  // Title
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = '72px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('MELTDWN', CANVAS_W / 2, CANVAS_H / 2 - 100);

  // Glitch effect
  if (frameTick % 120 < 5) {
    ctx.fillStyle = COLORS.dangerRed;
    ctx.globalAlpha = 0.6;
    ctx.fillText('MELTDWN', CANVAS_W / 2 + 3, CANVAS_H / 2 - 98);
    ctx.globalAlpha = 1;
  }

  // Tagline
  ctx.fillStyle = COLORS.rustLight;
  ctx.font = '16px "Special Elite", monospace';
  ctx.fillText('THE FACTORY IS FINE. YOU ARE NOT.', CANVAS_W / 2, CANVAS_H / 2 - 55);

  // Menu options with button frames
  const btnW = 320;
  const btnX = CANVAS_W / 2 - btnW / 2;

  // Start shift button
  ctx.fillStyle = 'rgba(27, 107, 111, 0.5)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 5, btnW, 34);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 5, btnW, 34);
  ctx.fillStyle = COLORS.parchment;
  ctx.font = '16px "Spectral SC", serif';
  ctx.fillText('[ ENTER ] — START SHIFT', CANVAS_W / 2, CANVAS_H / 2 + 28);

  // Instructions button
  ctx.fillStyle = 'rgba(44, 44, 44, 0.6)';
  ctx.fillRect(btnX, CANVAS_H / 2 + 45, btnW, 26);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, CANVAS_H / 2 + 45, btnW, 26);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '13px "Special Elite", monospace';
  ctx.fillText('[ I ] — INSTRUCTIONS', CANVAS_W / 2, CANVAS_H / 2 + 63);

  // Sound button
  ctx.fillRect(btnX, CANVAS_H / 2 + 76, btnW, 26);
  ctx.strokeRect(btnX, CANVAS_H / 2 + 76, btnW, 26);
  ctx.fillText(isMuted() ? '[ M ] — SOUND: MUTED 🔇' : '[ M ] — SOUND: ON 🔊', CANVAS_W / 2, CANVAS_H / 2 + 94);

  // Footer
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = '10px "Special Elite", monospace';
  ctx.fillText('Game Vita 5.0 — Worst Game Wins', CANVAS_W / 2, CANVAS_H - 30);

  // Steam animation bottom
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 10; i++) {
    const sx = (i * 150 + frameTick * 0.5) % (CANVAS_W + 100) - 50;
    const sy = CANVAS_H - 90 - Math.sin(frameTick * 0.02 + i) * 20;
    ctx.fillStyle = '#AAAAAA';
    ctx.beginPath();
    ctx.arc(sx, sy, 15 + Math.sin(frameTick * 0.03 + i) * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Instructions ──
function drawInstructions(ctx) {
  ctx.fillStyle = '#0D2B2D';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const cx = CANVAS_W / 2;

  ctx.fillStyle = COLORS.brassGold;
  ctx.font = '28px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMPLOYEE ORIENTATION', cx, 60);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = '13px "Special Elite", monospace';
  const lines = [
    'CONTROLS:',
    '  A/D or ←/→ ........... Move',
    '  SPACE or W or ↑ ...... Jump',
    '  E .................... Interact',
    '  ESC .................. Pause',
    '  M .................... Toggle Sound',
    '',
    'OBJECTIVE:',
    '  Restart the Grand Steam Engine.',
    '  Collect gears. Obtain permits. Activate machinery.',
    '  Manage boiler pressure. Survive.',
    '',
    'WARNINGS:',
    '  • The boiler pressure rises constantly.',
    '  • Some machines require permits.',
    '  • Upgrades have side effects.',
    '  • The factory remembers what you trust.',
    '  • Progress creates complications.',
    '',
    '  "Safety is everyone\'s responsibility."',
    '  — Management',
  ];

  lines.forEach((line, i) => {
    if (line === 'CONTROLS:' || line === 'OBJECTIVE:' || line === 'WARNINGS:') {
      ctx.fillStyle = COLORS.brassGold;
      ctx.font = '14px "Spectral SC", serif';
    } else {
      ctx.fillStyle = COLORS.parchment;
      ctx.font = '12px "Special Elite", monospace';
    }
    ctx.textAlign = 'left';
    ctx.fillText(line, cx - 250, 110 + i * 24);
  });

  ctx.fillStyle = COLORS.cream;
  ctx.font = '14px "Spectral SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('[ ENTER / ESC ] — BACK TO MENU', cx, CANVAS_H - 40);
}
