// ── Renderer ──
// All Canvas 2D drawing for the game world, HUD, and menus.
// Victorian Steampunk Illustrated Aesthetic
import { COLORS, CANVAS_W, CANVAS_H, TILE, PRESSURE_MAX, PRESSURE_WARN, PRESSURE_DANGER, STATE } from './constants.js';
import { LEVEL_W, LEVEL_H } from './level.js';
import { renderPlayer } from './player.js';
import { isMuted } from './audio.js';

let frameTick = 0;

// ── Asset preloading ──
const backdropImg = new Image();
backdropImg.src = `${import.meta.env.BASE_URL}assets/factory_backdrop.jpg`;
let backdropLoaded = false;
backdropImg.onload = () => { backdropLoaded = true; };

const gaugeImg = new Image();
gaugeImg.src = `${import.meta.env.BASE_URL}assets/steampunk_gauge.jpg`;
let gaugeLoaded = false;
gaugeImg.onload = () => { gaugeLoaded = true; };

const plaqueImg = new Image();
plaqueImg.src = `${import.meta.env.BASE_URL}assets/victorian_plaque.jpg`;
let plaqueLoaded = false;
plaqueImg.onload = () => { plaqueLoaded = true; };

// ── Typography constants ──
const FONT_TITLE = '"Cinzel Decorative", "Spectral SC", serif';
const FONT_HEADING = '"Cinzel", "Spectral SC", serif';
const FONT_BODY = '"Special Elite", monospace';

// ── Helper: Draw ornate brass panel ──
function drawBrassPanel(ctx, x, y, w, h, opts = {}) {
  const borderW = opts.borderWidth || 4;
  const cornerR = opts.cornerRadius || 0;
  const fill = opts.fill || 'rgba(18, 12, 6, 0.92)';
  const borderColor = opts.borderColor || COLORS.brassGold;
  const rivets = opts.rivets !== false;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + 4, y + 4, w, h);

  // Main panel
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);

  // Inner bevel (lighter top-left, darker bottom-right)
  ctx.fillStyle = 'rgba(197, 153, 62, 0.12)';
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x + w - 2, y, 2, h);

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderW;
  ctx.strokeRect(x + borderW / 2, y + borderW / 2, w - borderW, h - borderW);

  // Inner line
  ctx.strokeStyle = 'rgba(197, 153, 62, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + borderW + 3, y + borderW + 3, w - (borderW + 3) * 2, h - (borderW + 3) * 2);

  // Corner rivets
  if (rivets) {
    const rivetColor = COLORS.brassBevel || COLORS.brassGold;
    const offset = borderW + 6;
    const positions = [
      [x + offset, y + offset],
      [x + w - offset, y + offset],
      [x + offset, y + h - offset],
      [x + w - offset, y + h - offset],
    ];
    for (const [rx, ry] of positions) {
      // Rivet base
      ctx.fillStyle = COLORS.copperDark;
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
      // Rivet highlight
      ctx.fillStyle = rivetColor;
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
      // Rivet shine
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(rx - 1, ry - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Helper: Draw brass button ──
function drawBrassButton(ctx, x, y, w, h, text, opts = {}) {
  const hover = opts.highlight || false;
  const small = opts.small || false;
  const danger = opts.danger || false;

  // Button shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x + 2, y + 2, w, h);

  // Base plate
  const baseGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (danger) {
    baseGrad.addColorStop(0, '#6B2318');
    baseGrad.addColorStop(0.5, '#4A1810');
    baseGrad.addColorStop(1, '#2A0C06');
  } else {
    baseGrad.addColorStop(0, '#3D2A10');
    baseGrad.addColorStop(0.5, '#2A1B08');
    baseGrad.addColorStop(1, '#1A0F04');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x, y, w, h);

  // Top bevel
  ctx.fillStyle = danger ? 'rgba(211,78,60,0.3)' : 'rgba(197, 153, 62, 0.25)';
  ctx.fillRect(x, y, w, 2);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, y + h - 2, w, 2);

  // Border
  ctx.strokeStyle = danger ? COLORS.rustRed : COLORS.brassGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // Corner dots
  const dotR = 2.5;
  ctx.fillStyle = danger ? COLORS.rustLight : COLORS.copper;
  [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(dx, dy, dotR, 0, Math.PI * 2); ctx.fill();
  });

  // Text
  ctx.fillStyle = danger ? COLORS.cream : COLORS.goldLeaf || COLORS.cream;
  ctx.font = small ? `13px ${FONT_HEADING}` : `15px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + (small ? 5 : 6));
}

// ── Helper: Draw decorative gear ──
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
  ctx.fillStyle = COLORS.bronzeDark || COLORS.charcoal;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Helper: Draw decorative divider ──
function drawDivider(ctx, x, y, w) {
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.35, y);
  ctx.stroke();
  // Center gear ornament
  drawGearShape(ctx, x + w / 2, y, 6, frameTick * 0.01);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

// ══════════════════════════════════════════
// MAIN RENDER FRAME
// ══════════════════════════════════════════
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
  if (state.gameState === STATE.PERMITS) {
    drawPermitsLedger(ctx, state);
    return;
  }
  if (state.gameState === STATE.CREDITS) {
    drawCredits(ctx);
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

// ══════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════
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

// ══════════════════════════════════════════
// BACKGROUND — Warm Industrial Factory
// ══════════════════════════════════════════
function drawBackground(ctx, camX, camY) {
  // Deep warm gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1C1008');
  grad.addColorStop(0.3, '#22160C');
  grad.addColorStop(0.6, '#1A1108');
  grad.addColorStop(1, '#0D0906');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Parallax vertical pipes
  ctx.strokeStyle = COLORS.bronze || '#8C531B';
  ctx.lineWidth = 8;
  for (let i = 0; i < 12; i++) {
    const px = i * 300 - (camX * 0.2) % 300;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, CANVAS_H);
    ctx.stroke();

    // Pipe joints / fittings
    ctx.fillStyle = COLORS.copperDark;
    ctx.fillRect(px - 6, 95 + (i % 3) * 90, 20, 12);
    ctx.fillStyle = COLORS.copper;
    ctx.fillRect(px - 5, 97 + (i % 3) * 90, 18, 8);

    // Horizontal cross pipes
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(px - 50, 100 + (i % 3) * 90);
    ctx.lineTo(px + 250, 100 + (i % 3) * 90);
    ctx.stroke();
    ctx.strokeStyle = COLORS.bronze || '#8C531B';
    ctx.lineWidth = 8;
  }

  // Background gears (parallax, copper tint)
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = COLORS.copper;
  for (let i = 0; i < 8; i++) {
    const gx = i * 400 - (camX * 0.15) % 400 + 100;
    const gy = 150 + (i % 3) * 120;
    drawGearShape(ctx, gx, gy, 40 + (i % 2) * 20, frameTick * 0.005 * (i % 2 === 0 ? 1 : -1));
  }
  ctx.globalAlpha = 1;

  // Warm ambient light from below (furnace glow)
  const furnaceGrad = ctx.createLinearGradient(0, CANVAS_H - 100, 0, CANVAS_H);
  furnaceGrad.addColorStop(0, 'rgba(229, 169, 60, 0)');
  furnaceGrad.addColorStop(0.6, 'rgba(183, 115, 51, 0.06)');
  furnaceGrad.addColorStop(1, 'rgba(140, 83, 27, 0.12)');
  ctx.fillStyle = furnaceGrad;
  ctx.fillRect(0, CANVAS_H - 100, CANVAS_W, 100);
}

// ══════════════════════════════════════════
// PLATFORMS — Industrial Riveted Steel
// ══════════════════════════════════════════
function drawPlatforms(ctx, platforms, camX, camY) {
  for (const p of platforms) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    if (sx + p.w < -50 || sx > CANVAS_W + 50) continue;

    if (p.h <= TILE / 2 + 1) {
      // Thin platform — brass-topped metal grating
      const platGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
      platGrad.addColorStop(0, COLORS.copper);
      platGrad.addColorStop(0.3, COLORS.copperDark);
      platGrad.addColorStop(1, '#3D2A10');
      ctx.fillStyle = platGrad;
      ctx.fillRect(sx, sy, p.w, p.h);

      // Top brass edge
      ctx.fillStyle = COLORS.brassGold;
      ctx.fillRect(sx, sy, p.w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx, sy, p.w, 1);

      // Rivets
      ctx.fillStyle = COLORS.brassBevel || COLORS.brassGold;
      for (let rx = sx + 10; rx < sx + p.w; rx += 22) {
        ctx.beginPath();
        ctx.arc(rx, sy + 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Rivet highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(rx - 0.5, sy + 4.5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.brassBevel || COLORS.brassGold;
      }
    } else {
      // Floor / thick platform — brick with copper top
      const brickGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
      brickGrad.addColorStop(0, '#3D2A10');
      brickGrad.addColorStop(0.1, '#2A1B08');
      brickGrad.addColorStop(1, '#1A0F04');
      ctx.fillStyle = brickGrad;
      ctx.fillRect(sx, sy, p.w, p.h);

      // Top surface brass line
      ctx.fillStyle = COLORS.copper;
      ctx.fillRect(sx, sy, p.w, 4);
      ctx.fillStyle = COLORS.brassGold;
      ctx.fillRect(sx, sy, p.w, 2);

      // Brick pattern
      ctx.strokeStyle = 'rgba(140, 83, 27, 0.15)';
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

    // Polished gold platform
    const goldGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
    goldGrad.addColorStop(0, COLORS.brassLight);
    goldGrad.addColorStop(0.5, COLORS.brassGold);
    goldGrad.addColorStop(1, COLORS.brassDark);
    ctx.fillStyle = goldGrad;
    ctx.fillRect(sx, sy, p.w, p.h);

    // Shine line
    ctx.fillStyle = 'rgba(245,222,136,0.3)';
    ctx.fillRect(sx, sy, p.w, 1);

    // Gold rivets
    ctx.fillStyle = COLORS.goldLeaf || COLORS.yellowWarn;
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
    const by = first.y - camY - 22;
    drawBrassPanel(ctx, bx, by, 160, 20, { borderWidth: 2, rivets: false, fill: 'rgba(42, 27, 8, 0.9)' });
    ctx.fillStyle = COLORS.goldLeaf || COLORS.brassLight;
    ctx.font = `9px ${FONT_HEADING}`;
    ctx.textAlign = 'left';
    ctx.fillText('GOLDEN SHORTCUT EXPRESS', bx + 10, by + 14);
  }
}

function drawLockedShortcutGate(ctx, camX, camY) {
  const gx = 51 * TILE - camX;
  const gy = 6 * TILE - camY - 20;
  if (gx < -100 || gx > CANVAS_W + 100) return;

  drawBrassPanel(ctx, gx, gy, 160, 22, { borderWidth: 2, rivets: false, fill: 'rgba(30, 10, 5, 0.85)', borderColor: COLORS.rustRed });
  ctx.fillStyle = COLORS.rustLight;
  ctx.font = `9px ${FONT_HEADING}`;
  ctx.textAlign = 'left';
  ctx.fillText('SHORTCUT LOCKED', gx + 18, gy + 15);
  // Lock icon
  ctx.fillStyle = COLORS.rustRed;
  ctx.fillRect(gx + 6, gy + 7, 8, 8);
  ctx.strokeStyle = COLORS.rustRed;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gx + 10, gy + 7, 4, Math.PI, 0);
  ctx.stroke();
}

// ══════════════════════════════════════════
// GEARS (Collectible)
// ══════════════════════════════════════════
function drawGears(ctx, gears, camX, camY) {
  for (const g of gears) {
    if (g.collected) continue;
    const gx = g.x - camX + 10;
    const gy = g.y - camY + 10 + Math.sin(frameTick * 0.04 + g.bobOffset) * 4;
    
    // Warm glow
    ctx.globalAlpha = 0.25;
    const glowGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 18);
    glowGrad.addColorStop(0, COLORS.amberGlow || COLORS.brassLight);
    glowGrad.addColorStop(1, 'rgba(229,169,60,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawGearShape(ctx, gx, gy, 10, frameTick * 0.02);
  }
}

// ══════════════════════════════════════════
// PERMITS (Collectible Documents)
// ══════════════════════════════════════════
function drawPermits(ctx, permits, camX, camY) {
  for (const p of permits) {
    if (p.collected) continue;
    const px = p.x - camX;
    const py = p.y - camY + Math.sin(frameTick * 0.03 + p.bobOffset) * 3;

    // Glow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(px - 4, py - 4, p.w + 8, p.h + 8);
    ctx.globalAlpha = 1;

    // Parchment
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(px, py, p.w, p.h);
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, p.w, p.h);

    // Wax seal
    ctx.fillStyle = COLORS.rustRed;
    ctx.beginPath();
    ctx.arc(px + p.w / 2, py + p.h - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(px + p.w / 2 - 1, py + p.h - 9, 2, 0, Math.PI * 2);
    ctx.fill();

    // Text lines
    ctx.fillStyle = COLORS.bronzeDark || COLORS.charcoalLight;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + 4, py + 4 + i * 5, p.w - 8, 2);
    }
  }
}

// ══════════════════════════════════════════
// MACHINES
// ══════════════════════════════════════════
function drawMachines(ctx, machines, camX, camY) {
  for (const m of machines) {
    const mx = m.x - camX;
    const my = m.y - camY;
    if (m.id === 'engine') continue;

    // Machine body with industrial gradient
    const machGrad = ctx.createLinearGradient(mx, my, mx, my + m.h);
    if (m.activated) {
      machGrad.addColorStop(0, '#1B5B5F');
      machGrad.addColorStop(1, '#0D3F42');
    } else {
      machGrad.addColorStop(0, '#3D3020');
      machGrad.addColorStop(1, '#1A1408');
    }
    ctx.fillStyle = machGrad;
    ctx.fillRect(mx, my, m.w, m.h);

    // Brass border
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, m.w, m.h);
    ctx.strokeStyle = COLORS.brassGold;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 2, my + 2, m.w - 4, m.h - 4);

    // Gauge on machine
    const gaugeX = mx + m.w / 2;
    const gaugeY = my + 18;
    // Gauge bezel
    ctx.fillStyle = COLORS.copperDark;
    ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1A1408';
    ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.brassGold;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 12, 0, Math.PI * 2); ctx.stroke();

    if (m.activated) {
      ctx.fillStyle = COLORS.green;
      ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 5, 0, Math.PI * 2); ctx.fill();
      // Glow
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = COLORS.green;
      ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = COLORS.rustRed;
      ctx.beginPath(); ctx.arc(gaugeX, gaugeY, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Nameplate
    const npW = m.w + 10;
    const npX = mx - 5;
    const npY = my - 20;
    ctx.fillStyle = 'rgba(18, 12, 6, 0.85)';
    ctx.fillRect(npX, npY, npW, 16);
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 1;
    ctx.strokeRect(npX, npY, npW, 16);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = `9px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText(m.name.toUpperCase(), mx + m.w / 2, npY + 12);
  }
}

// ══════════════════════════════════════════
// VALVES
// ══════════════════════════════════════════
function drawValves(ctx, valves, camX, camY) {
  for (const v of valves) {
    const vx = v.x - camX;
    const vy = v.y - camY;

    // Pipe
    ctx.fillStyle = COLORS.copperDark;
    ctx.fillRect(vx + TILE / 2 - 5, vy - 10, 10, TILE + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(vx + TILE / 2 - 4, vy - 10, 3, TILE + 10);

    // Valve wheel
    const wheelColor = v.cooldown > 0 ? COLORS.charcoalLight : COLORS.rustRed;
    ctx.strokeStyle = wheelColor;
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

    // Hub
    ctx.fillStyle = COLORS.copper;
    ctx.beginPath();
    ctx.arc(vx + TILE / 2, vy + TILE / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label plate
    const lpW = 50;
    const lpX = vx + TILE / 2 - lpW / 2;
    ctx.fillStyle = 'rgba(18, 12, 6, 0.85)';
    ctx.fillRect(lpX, vy - 20, lpW, 12);
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 1;
    ctx.strokeRect(lpX, vy - 20, lpW, 12);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = `8px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText('VALVE', vx + TILE / 2, vy - 11);
  }
}

// ══════════════════════════════════════════
// SIGNS
// ══════════════════════════════════════════
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
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 8, sy - 5, TILE + 16, 30);
    // Inner line
    ctx.strokeStyle = 'rgba(140,83,27,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 5, sy - 2, TILE + 10, 24);

    ctx.fillStyle = COLORS.bronzeDark || COLORS.charcoal;
    ctx.font = `8px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText('READ [E]', sx + TILE / 2, sy + 15);
  }
}

// ══════════════════════════════════════════
// UPGRADES
// ══════════════════════════════════════════
function drawUpgrades(ctx, upgrades, camX, camY) {
  for (const u of upgrades) {
    if (u.purchased) continue;
    const ux = u.x - camX;
    const uy = u.y - camY + Math.sin(frameTick * 0.035 + u.bobOffset) * 4;

    // Glow
    ctx.globalAlpha = 0.2;
    const upGlow = ctx.createRadialGradient(ux + u.w / 2, uy + u.h / 2, 0, ux + u.w / 2, uy + u.h / 2, 30);
    upGlow.addColorStop(0, COLORS.amberGlow || COLORS.brassLight);
    upGlow.addColorStop(1, 'rgba(229,169,60,0)');
    ctx.fillStyle = upGlow;
    ctx.beginPath();
    ctx.arc(ux + u.w / 2, uy + u.h / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Box
    const upGrad = ctx.createLinearGradient(ux, uy, ux, uy + u.h);
    upGrad.addColorStop(0, COLORS.brassLight);
    upGrad.addColorStop(0.5, COLORS.brassGold);
    upGrad.addColorStop(1, COLORS.brassDark);
    ctx.fillStyle = upGrad;
    ctx.fillRect(ux, uy, u.w, u.h);
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(ux, uy, u.w, u.h);

    // Icon (gear or bolt)
    ctx.fillStyle = COLORS.bronzeDark || COLORS.charcoal;
    if (u.id === 'turbo_boots') {
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(ux + u.w / 2 - 3, uy + 5);
      ctx.lineTo(ux + u.w / 2 + 4, uy + u.h / 2);
      ctx.lineTo(ux + u.w / 2 - 1, uy + u.h / 2);
      ctx.lineTo(ux + u.w / 2 + 3, uy + u.h - 4);
      ctx.lineTo(ux + u.w / 2 - 4, uy + u.h / 2 + 2);
      ctx.lineTo(ux + u.w / 2 + 1, uy + u.h / 2 + 2);
      ctx.closePath();
      ctx.fill();
    } else {
      drawGearShape(ctx, ux + u.w / 2, uy + u.h / 2, 10, frameTick * 0.02);
    }

    // Name plate
    ctx.fillStyle = COLORS.parchment;
    ctx.font = `8px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText(u.name.toUpperCase(), ux + u.w / 2, uy - 6);
  }
}

// ══════════════════════════════════════════
// HAZARDS
// ══════════════════════════════════════════
function drawHazards(ctx, hazards, camX, camY) {
  for (const h of hazards) {
    const hx = h.x - camX;
    const hy = h.y - camY;

    if (h.type === 'steam_vent') {
      // Vent pipe
      ctx.fillStyle = COLORS.copperDark;
      ctx.fillRect(hx + 10, hy + h.h - TILE, TILE - 20, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(hx + 12, hy + h.h - TILE, 3, TILE);

      if (h.active) {
        // Steam column
        ctx.globalAlpha = 0.3 + Math.sin(frameTick * 0.1) * 0.15;
        const steamGrad = ctx.createLinearGradient(hx + TILE / 2, hy, hx + TILE / 2, hy + h.h - TILE);
        steamGrad.addColorStop(0, 'rgba(200,200,200,0.1)');
        steamGrad.addColorStop(1, 'rgba(200,200,200,0.6)');
        ctx.fillStyle = steamGrad;
        ctx.fillRect(hx + 5, hy, TILE - 10, h.h - TILE);
        ctx.globalAlpha = 1;

        // Warning triangle
        ctx.fillStyle = COLORS.dangerRed;
        ctx.beginPath();
        ctx.moveTo(hx + TILE / 2, hy - 12);
        ctx.lineTo(hx + TILE / 2 - 7, hy - 1);
        ctx.lineTo(hx + TILE / 2 + 7, hy - 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COLORS.cream;
        ctx.font = `7px ${FONT_HEADING}`;
        ctx.textAlign = 'center';
        ctx.fillText('!', hx + TILE / 2, hy - 3);
      }
    } else if (h.type === 'conveyor') {
      if (!h.active) continue;
      // Conveyor belt
      const convGrad = ctx.createLinearGradient(hx, hy, hx, hy + h.h);
      convGrad.addColorStop(0, COLORS.charcoalLight);
      convGrad.addColorStop(1, '#2A1B08');
      ctx.fillStyle = convGrad;
      ctx.fillRect(hx, hy, h.w, h.h);

      // Direction arrows
      ctx.fillStyle = COLORS.amberGlow || COLORS.yellowWarn;
      const dir = h.dir === 'right' ? 1 : -1;
      for (let ax = 0; ax < h.w; ax += 30) {
        const offset = (frameTick * 2 * dir) % 30;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dir > 0 ? '\u25B6' : '\u25C0', hx + ax + offset, hy - 2);
      }
    } else if (h.type === 'gap') {
      ctx.fillStyle = COLORS.rustRed;
      ctx.globalAlpha = 0.5 + Math.sin(frameTick * 0.05) * 0.2;
      ctx.fillRect(hx - 5, hy, 5, 3);
      ctx.fillRect(hx + h.w, hy, 5, 3);
      ctx.globalAlpha = 1;
    }
  }
}

// ══════════════════════════════════════════
// CHECKPOINTS
// ══════════════════════════════════════════
function drawCheckpoints(ctx, checkpoints, camX, camY) {
  for (const cp of checkpoints) {
    const cx = cp.x - camX;
    const cy = cp.y - camY;

    // Pole
    ctx.fillStyle = COLORS.copperDark;
    ctx.fillRect(cx + TILE / 2 - 2, cy - 20, 4, TILE + 20);
    // Pole shine
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(cx + TILE / 2 - 1, cy - 20, 1, TILE + 20);

    // Flag
    ctx.fillStyle = cp.activated ? COLORS.green : COLORS.charcoalMed;
    ctx.beginPath();
    ctx.moveTo(cx + TILE / 2 + 2, cy - 18);
    ctx.lineTo(cx + TILE / 2 + 18, cy - 12);
    ctx.lineTo(cx + TILE / 2 + 2, cy - 6);
    ctx.closePath();
    ctx.fill();

    if (cp.activated) {
      // Glow
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(cx + TILE / 2 + 10, cy - 12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Finial
    ctx.fillStyle = COLORS.brassGold;
    ctx.beginPath();
    ctx.arc(cx + TILE / 2, cy - 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ══════════════════════════════════════════
// ENGINE
// ══════════════════════════════════════════
function drawEngine(ctx, engine, camX, camY) {
  if (!engine) return;
  const ex = engine.x - camX;
  const ey = engine.y - camY;

  // Large machine body
  const engGrad = ctx.createLinearGradient(ex, ey, ex, ey + engine.h);
  if (engine.activated) {
    engGrad.addColorStop(0, '#1B5B5F');
    engGrad.addColorStop(0.5, '#0D4F52');
    engGrad.addColorStop(1, '#082D2F');
  } else {
    engGrad.addColorStop(0, '#3D3020');
    engGrad.addColorStop(0.5, '#2A1B08');
    engGrad.addColorStop(1, '#1A0F04');
  }
  ctx.fillStyle = engGrad;
  ctx.fillRect(ex, ey, engine.w, engine.h);

  // Ornate border
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 3;
  ctx.strokeRect(ex, ey, engine.w, engine.h);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 1;
  ctx.strokeRect(ex + 4, ey + 4, engine.w - 8, engine.h - 8);

  // Large gear
  drawGearShape(ctx, ex + engine.w / 2, ey + engine.h / 2, 30,
    engine.activated ? frameTick * 0.03 : 0);

  // Smokestacks
  ctx.fillStyle = COLORS.copperDark;
  ctx.fillRect(ex + 10, ey - 40, 20, 40);
  ctx.fillRect(ex + engine.w - 30, ey - 30, 20, 30);
  // Stack tops
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(ex + 8, ey - 42, 24, 4);
  ctx.fillRect(ex + engine.w - 32, ey - 32, 24, 4);

  if (engine.activated) {
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

  // Nameplate
  const npW = 200;
  const npX = ex + engine.w / 2 - npW / 2;
  drawBrassPanel(ctx, npX, ey - 56, npW, 18, { borderWidth: 2, rivets: false, fill: 'rgba(18,12,6,0.9)' });
  ctx.fillStyle = COLORS.goldLeaf || COLORS.brassLight;
  ctx.font = `11px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText('GRAND STEAM ENGINE', ex + engine.w / 2, ey - 42);
}

// ══════════════════════════════════════════
// STEAM PARTICLES
// ══════════════════════════════════════════
function drawSteamParticles(ctx, particles, camX, camY) {
  if (!particles) return;
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.4;
    ctx.fillStyle = `rgba(200,200,200,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y - camY, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ══════════════════════════════════════════
// HUD — Industrial Brass Dashboard
// ══════════════════════════════════════════
function drawHUD(ctx, state) {
  // Background bar with gradient and brass borders
  const hudGrad = ctx.createLinearGradient(0, 0, 0, 58);
  hudGrad.addColorStop(0, 'rgba(28, 16, 8, 0.96)');
  hudGrad.addColorStop(1, 'rgba(18, 10, 4, 0.96)');
  ctx.fillStyle = hudGrad;
  ctx.fillRect(0, 0, CANVAS_W, 58);

  // Bottom brass line
  ctx.fillStyle = COLORS.brassGold;
  ctx.fillRect(0, 56, CANVAS_W, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 55, CANVAS_W, 1);

  // Decorative rivets along bottom
  ctx.fillStyle = COLORS.copper;
  for (let rx = 15; rx < CANVAS_W; rx += 60) {
    ctx.beginPath();
    ctx.arc(rx, 56, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Industrial Round Pressure Gauge (Left)
  drawPressureGauge(ctx, 6, 2, state.pressure, state.deceptiveGaugeActive, state.gaugeTappedTimer);

  // 2. Gears tally
  drawGearShape(ctx, 84, 22, 9, frameTick * 0.02);
  ctx.fillStyle = COLORS.goldLeaf || COLORS.parchment;
  ctx.font = `14px ${FONT_HEADING}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${state.gearsCollected}`, 98, 27);

  // 3. Stamped Permits Clipboard Tracker
  const clipX = 135;
  const clipY = 8;
  ctx.fillStyle = 'rgba(38, 22, 10, 0.9)';
  ctx.fillRect(clipX, clipY, 138, 40);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(clipX, clipY, 138, 40);

  // Top brass clip clamp
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(clipX + 49, clipY - 2, 40, 5);
  ctx.strokeStyle = COLORS.brassDark;
  ctx.strokeRect(clipX + 49, clipY - 2, 40, 5);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `8px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText('PERMIT REGISTRY', clipX + 69, clipY + 11);

  // 3 Stamped tags: A-12, B-44, C-99
  const pTags = [
    { code: 'A-12', name: 'Permit A-12' },
    { code: 'B-44', name: 'Permit B-44' },
    { code: 'C-99', name: 'Permit C-99' },
  ];
  pTags.forEach((ptag, idx) => {
    const hasPermit = state.permitsHeld && (state.permitsHeld.includes(ptag.name) || state.permitsHeld.includes(ptag.code) || state.permitsHeld.length > idx);
    const tx = clipX + 6 + idx * 42;
    const ty = clipY + 17;
    ctx.fillStyle = hasPermit ? 'rgba(58, 125, 108, 0.45)' : 'rgba(18, 12, 6, 0.7)';
    ctx.fillRect(tx, ty, 38, 18);
    ctx.strokeStyle = hasPermit ? COLORS.goldLeaf : 'rgba(140, 83, 27, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, 38, 18);
    ctx.fillStyle = hasPermit ? COLORS.goldLeaf : COLORS.charcoalLight;
    ctx.font = `bold 8px ${FONT_BODY}`;
    ctx.textAlign = 'center';
    ctx.fillText(ptag.code, tx + 19, ty + 12);
  });

  // 4. Vintage Galvanometer Trust Meter
  const galvX = 282;
  const galvY = 8;
  ctx.fillStyle = 'rgba(32, 18, 8, 0.9)';
  ctx.fillRect(galvX, galvY, 102, 40);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(galvX, galvY, 102, 40);

  ctx.fillStyle = COLORS.amberGlow || COLORS.brassGold;
  ctx.font = `8px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText('TRUST METER', galvX + 51, galvY + 11);

  // Scale arc
  ctx.strokeStyle = 'rgba(140, 83, 27, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(galvX + 51, galvY + 36, 17, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Galvanometer needle
  const totalViolations = (state.trustMemory ? (state.trustMemory.signTrust + state.trustMemory.upgradeTrust + state.trustMemory.gaugeTrust) : 0);
  const trustRatio = Math.max(0, Math.min(1, 1 - totalViolations / 6));
  const needleAngle = Math.PI * 1.15 + trustRatio * (Math.PI * 0.7);
  ctx.strokeStyle = totalViolations > 2 ? COLORS.dangerRed : COLORS.goldLeaf;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(galvX + 51, galvY + 36);
  ctx.lineTo(galvX + 51 + Math.cos(needleAngle) * 15, galvY + 36 + Math.sin(needleAngle) * 15);
  ctx.stroke();

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `7px ${FONT_BODY}`;
  ctx.fillText(totalViolations > 2 ? 'SUSPICIOUS' : 'COMPLIANT', galvX + 51, galvY + 33);

  // 5. Central Objective Panel with Victorian styling
  const objW = 336;
  const objX = 390;
  ctx.fillStyle = 'rgba(38, 22, 10, 0.85)';
  ctx.fillRect(objX, 6, objW, 20);
  ctx.strokeStyle = 'rgba(197, 153, 62, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(objX, 6, objW, 20);
  // Corner accents
  ctx.fillStyle = COLORS.brassGold;
  ctx.fillRect(objX, 6, 3, 3);
  ctx.fillRect(objX + objW - 3, 6, 3, 3);
  ctx.fillRect(objX, 23, 3, 3);
  ctx.fillRect(objX + objW - 3, 23, 3, 3);

  ctx.fillStyle = COLORS.amberGlow || COLORS.yellowWarn;
  ctx.font = `10px ${FONT_BODY}`;
  ctx.textAlign = 'center';
  ctx.fillText(state.currentObjective || '', objX + objW / 2, 19);

  // Supervisor message below objective
  if (state.supervisorMsg && state.supervisorMsgTimer > 0) {
    const alpha = Math.min(1, state.supervisorMsgTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.cream;
    ctx.font = `9px ${FONT_BODY}`;
    ctx.fillText(state.supervisorMsg, objX + objW / 2, 40);
    ctx.globalAlpha = 1;
  }

  // 6. Machinery Status Lamps (GEN, CNV, ENG)
  const machX = 740;
  const machY = 8;
  ctx.fillStyle = 'rgba(32, 18, 8, 0.9)';
  ctx.fillRect(machX, machY, 116, 40);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(machX, machY, 116, 40);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `8px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText('MACHINERY STATUS', machX + 58, machY + 11);

  const lamps = [
    { label: 'GEN', active: !!state.generatorActivated },
    { label: 'CNV', active: !!state.conveyorActive },
    { label: 'ENG', active: !!state.inspectionCleared },
  ];
  lamps.forEach((lamp, idx) => {
    const lx = machX + 20 + idx * 38;
    const ly = machY + 23;
    // Lamp brass bezel
    ctx.fillStyle = COLORS.copperDark;
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fill();
    // Glowing jewel lens
    ctx.fillStyle = lamp.active ? '#4CAF50' : '#2A1B08';
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fill();
    if (lamp.active) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.45)';
      ctx.beginPath();
      ctx.arc(lx, ly, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lamp label
    ctx.fillStyle = lamp.active ? COLORS.goldLeaf : COLORS.charcoalLight;
    ctx.font = `bold 7px ${FONT_BODY}`;
    ctx.textAlign = 'center';
    ctx.fillText(lamp.label, lx, ly + 12);
  });

  // 7. Upgrades indicators
  const upgX = 848;
  if (state.player && state.player.hasTurboBoots) {
    ctx.fillStyle = 'rgba(42, 27, 8, 0.85)';
    ctx.fillRect(upgX, 6, 82, 18);
    ctx.strokeStyle = COLORS.rustLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(upgX, 6, 82, 18);
    ctx.fillStyle = COLORS.rustLight;
    ctx.font = `8px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText('TURBO BOOTS', upgX + 41, 18);
  }
  if (state.player && state.player.hasGoldenGear) {
    ctx.fillStyle = 'rgba(42, 27, 8, 0.85)';
    ctx.fillRect(upgX, 28, 82, 18);
    ctx.strokeStyle = COLORS.brassGold;
    ctx.lineWidth = 1;
    ctx.strokeRect(upgX, 28, 82, 18);
    ctx.fillStyle = COLORS.brassGold;
    ctx.font = `8px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText('GOLDEN GEAR', upgX + 41, 40);
  }

  // 8. Keybind hints (stamped typewriter brass tags)
  // [T] GAUGE
  ctx.fillStyle = 'rgba(42, 27, 8, 0.85)';
  ctx.fillRect(CANVAS_W - 200, 16, 70, 24);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_W - 200, 16, 70, 24);
  ctx.fillStyle = COLORS.goldLeaf;
  ctx.font = `8px ${FONT_BODY}`;
  ctx.textAlign = 'center';
  ctx.fillText('[T] GAUGE', CANVAS_W - 165, 31);

  // ESC (Pause)
  ctx.fillStyle = 'rgba(42, 27, 8, 0.85)';
  ctx.fillRect(CANVAS_W - 120, 16, 50, 24);
  ctx.strokeStyle = COLORS.copper;
  ctx.strokeRect(CANVAS_W - 120, 16, 50, 24);
  ctx.fillStyle = COLORS.parchment;
  ctx.font = `8px ${FONT_HEADING}`;
  ctx.fillText('ESC', CANVAS_W - 95, 31);

  // M (Sound)
  ctx.fillStyle = 'rgba(42, 27, 8, 0.85)';
  ctx.fillRect(CANVAS_W - 62, 16, 50, 24);
  ctx.strokeStyle = COLORS.copper;
  ctx.strokeRect(CANVAS_W - 62, 16, 50, 24);
  ctx.fillStyle = isMuted() ? COLORS.rustRed : COLORS.green;
  ctx.fillText(isMuted() ? 'M: OFF' : 'M: SND', CANVAS_W - 37, 31);
}

// ── Industrial Pressure Gauge (Round Dial) ──
function drawPressureGauge(ctx, x, y, pressure, deceptive, gaugeTappedTimer) {
  const isTapped = gaugeTappedTimer > 0;
  const displayPressure = (deceptive && !isTapped) ? Math.max(0, pressure - 20) : pressure;
  const ratio = Math.min(displayPressure / PRESSURE_MAX, 1);

  const cx = x + 26;
  const cy = y + 28;
  const outerR = 24;
  const innerR = 19;

  // Bezel
  const bezelGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR + 2);
  bezelGrad.addColorStop(0, COLORS.copper);
  bezelGrad.addColorStop(0.5, COLORS.brassGold);
  bezelGrad.addColorStop(1, COLORS.copperDark);
  ctx.fillStyle = bezelGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();

  // Face
  const faceGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, innerR);
  faceGrad.addColorStop(0, '#F5E6C4');
  faceGrad.addColorStop(1, '#D4C4A0');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();

  // Glass highlight
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 6, 10, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Tick marks
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  for (let i = 0; i <= 10; i++) {
    const a = startAngle + (i / 10) * (endAngle - startAngle);
    const isMajor = i % 5 === 0;
    const tickInner = innerR - (isMajor ? 6 : 3);
    const tickOuter = innerR - 1;
    ctx.strokeStyle = i >= 8 ? COLORS.dangerRed : i >= 6 ? COLORS.amberDark || COLORS.yellowWarn : COLORS.bronzeDark || '#522E0C';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * tickInner, cy + Math.sin(a) * tickInner);
    ctx.lineTo(cx + Math.cos(a) * tickOuter, cy + Math.sin(a) * tickOuter);
    ctx.stroke();
  }

  // Danger zone arc
  const dangerStart = startAngle + (PRESSURE_DANGER / PRESSURE_MAX) * (endAngle - startAngle);
  ctx.strokeStyle = 'rgba(255,51,51,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 3, dangerStart, endAngle);
  ctx.stroke();

  // Needle
  const needleAngle = startAngle + ratio * (endAngle - startAngle);
  // Needle shake & jitter when tapped or approaching danger
  let shake = isTapped ? Math.sin(frameTick * 0.5) * 0.05 : 0;
  if (pressure >= PRESSURE_DANGER) {
    shake += Math.sin(frameTick * 0.9) * 0.07 + Math.sin(frameTick * 1.7) * 0.04;
  } else if (pressure >= PRESSURE_WARN) {
    shake += Math.sin(frameTick * 0.5) * 0.035;
  }

  // Subtle steam puffs when pressure is high
  if (pressure >= PRESSURE_WARN) {
    ctx.save();
    ctx.globalAlpha = 0.15 + (pressure >= PRESSURE_DANGER ? 0.15 : 0);
    ctx.fillStyle = '#FFFFFF';
    for (let sp = 0; sp < 3; sp++) {
      const spx = cx + Math.cos(frameTick * 0.05 + sp * 2) * (outerR + 2);
      const spy = cy - 8 - ((frameTick * 0.8 + sp * 10) % 20);
      ctx.beginPath();
      ctx.arc(spx, spy, 3 + sp * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(needleAngle + shake);
  ctx.fillStyle = pressure >= PRESSURE_DANGER ? COLORS.dangerRed : '#2A1B08';
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(innerR - 4, 0);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Center hub
  ctx.fillStyle = COLORS.copperDark;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.brassGold;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  // Pressure text below
  ctx.fillStyle = isTapped ? COLORS.dangerRed : COLORS.parchment;
  ctx.font = `bold 9px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(displayPressure)}%`, cx, cy + outerR + 11);

  // Status label
  let statusText = 'NOMINAL';
  let statusColor = COLORS.green;
  if (pressure >= PRESSURE_DANGER) {
    statusText = frameTick % 30 < 15 ? 'DANGER' : 'CRITICAL';
    statusColor = COLORS.dangerRed;
  } else if (pressure >= PRESSURE_WARN) {
    statusText = 'WARNING';
    statusColor = COLORS.amberGlow || COLORS.yellowWarn;
  }
  ctx.fillStyle = statusColor;
  ctx.font = `7px ${FONT_HEADING}`;
  ctx.fillText(statusText, cx, cy + outerR + 20);

  // Deceptive indicator
  if (deceptive && !isTapped) {
    ctx.fillStyle = COLORS.amberGlow || COLORS.yellowWarn;
    ctx.font = `6px ${FONT_BODY}`;
    ctx.fillText('*calibrated*', cx + 50, cy + 10);
    ctx.fillText('[T] Tap gauge', cx + 50, cy + 20);
  } else if (isTapped) {
    ctx.fillStyle = COLORS.dangerRed;
    ctx.font = `7px ${FONT_BODY}`;
    ctx.fillText('TRUE READING', cx + 50, cy + 15);
  }
}

// ══════════════════════════════════════════
// DIALOGUE — Brass-Framed Factory Notice
// ══════════════════════════════════════════
function drawDialogue(ctx, dialogue) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bw = 620;
  const bh = 220;
  const bx = (CANVAS_W - bw) / 2;
  const by = CANVAS_H - bh - 40;

  drawBrassPanel(ctx, bx, by, bw, bh, { borderWidth: 4, fill: 'rgba(18, 12, 6, 0.95)' });

  // Header bar
  const hdrGrad = ctx.createLinearGradient(bx + 12, by + 10, bx + 12, by + 36);
  hdrGrad.addColorStop(0, 'rgba(140, 83, 27, 0.5)');
  hdrGrad.addColorStop(1, 'rgba(82, 46, 12, 0.3)');
  ctx.fillStyle = hdrGrad;
  ctx.fillRect(bx + 12, by + 10, bw - 24, 26);
  ctx.strokeStyle = COLORS.copper;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 12, by + 10, bw - 24, 26);

  ctx.fillStyle = COLORS.goldLeaf || COLORS.brassLight;
  ctx.font = `13px ${FONT_HEADING}`;
  ctx.textAlign = 'left';
  ctx.fillText(dialogue.title || 'FACTORY NOTICE', bx + 22, by + 28);

  // Body text
  ctx.fillStyle = COLORS.parchment;
  ctx.font = `13px ${FONT_BODY}`;
  const lines = (dialogue.text || '').split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + 25, by + 58 + i * 20);
  });

  // Dismiss hint
  drawBrassButton(ctx, bx + bw / 2 - 100, by + bh - 35, 200, 24, 'Press [E] or SPACE to close', { small: true });
}

// ══════════════════════════════════════════
// INTERACTION PROMPT — Mechanical Factory Label
// ══════════════════════════════════════════
function drawInteractPrompt(ctx, text) {
  const tw = ctx.measureText(text).width || 200;
  const pw = Math.max(tw + 40, 220);
  const ph = 28;
  const px = CANVAS_W / 2 - pw / 2;
  const py = CANVAS_H - 62;

  ctx.fillStyle = 'rgba(18, 12, 6, 0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  // Corner dots
  ctx.fillStyle = COLORS.copper;
  [[px + 4, py + 4], [px + pw - 4, py + 4], [px + 4, py + ph - 4], [px + pw - 4, py + ph - 4]].forEach(([rx, ry]) => {
    ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = COLORS.goldLeaf || COLORS.cream;
  ctx.font = `12px ${FONT_HEADING}`;
  ctx.textAlign = 'center';
  ctx.fillText(text, CANVAS_W / 2, py + 19);
}

// ══════════════════════════════════════════
// PAUSE OVERLAY
// ══════════════════════════════════════════
function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(13, 9, 6, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const pw = 420;
  const ph = 246;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;

  drawBrassPanel(ctx, px, py, pw, ph, { borderWidth: 4, fill: 'rgba(20, 12, 6, 0.94)' });

  // Title
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = `28px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('SHIFT SUSPENDED', CANVAS_W / 2, py + 48);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `11px ${FONT_HEADING}`;
  ctx.fillText('BOILER INSPECTION & WORK HALT', CANVAS_W / 2, py + 68);

  drawDivider(ctx, px + 30, py + 78, pw - 60);

  // Sub text
  ctx.fillStyle = COLORS.parchment;
  ctx.font = `12px ${FONT_BODY}`;
  ctx.fillText('The factory machinery stands idle awaiting your return.', CANVAS_W / 2, py + 98);

  // Buttons
  const btnW = 260;
  const btnX = CANVAS_W / 2 - btnW / 2;
  drawBrassButton(ctx, btnX, py + 118, btnW, 32, 'RESUME WORK  [ESC]');
  drawBrassButton(ctx, btnX, py + 156, btnW, 30, 'RESTART SHIFT  [R]', { small: true, danger: true });
  drawBrassButton(ctx, btnX, py + 194, btnW, 28, 'MAIN MENU  [ENTER]', { small: true });
}

// ══════════════════════════════════════════
// VICTORY OVERLAY — Form 47-B
// ══════════════════════════════════════════
function drawVictoryOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(13, 9, 6, 0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Parchment form
  const bw = 520;
  const bh = 360;
  const bx = (CANVAS_W - bw) / 2;
  const by = (CANVAS_H - bh) / 2;

  // Parchment background
  ctx.fillStyle = '#3D2A10';
  ctx.fillRect(bx + 4, by + 4, bw, bh);

  const parchGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  parchGrad.addColorStop(0, '#F5E6C4');
  parchGrad.addColorStop(0.3, '#EDD9AF');
  parchGrad.addColorStop(0.7, '#E8D0A0');
  parchGrad.addColorStop(1, '#DFC48E');
  ctx.fillStyle = parchGrad;
  ctx.fillRect(bx, by, bw, bh);

  // Ornate border
  ctx.strokeStyle = COLORS.copperDark;
  ctx.lineWidth = 4;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.strokeStyle = COLORS.brassGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);
  ctx.strokeStyle = 'rgba(140,83,27,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 10, by + 10, bw - 20, bh - 20);

  // Corner rivets
  const rv = [[bx + 14, by + 14], [bx + bw - 14, by + 14], [bx + 14, by + bh - 14], [bx + bw - 14, by + bh - 14]];
  rv.forEach(([rx, ry]) => {
    ctx.fillStyle = COLORS.copperDark; ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.brassGold; ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
  });

  // Title
  ctx.fillStyle = '#2A1B08';
  ctx.font = `22px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('FORM 47-B', CANVAS_W / 2, by + 45);

  // Subtitle
  ctx.font = `13px ${FONT_HEADING}`;
  ctx.fillText('Application for Permission to Celebrate', CANVAS_W / 2, by + 70);

  // Divider
  ctx.strokeStyle = COLORS.copperDark;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 40, by + 80); ctx.lineTo(bx + bw - 40, by + 80); ctx.stroke();

  // Status
  ctx.fillStyle = COLORS.rustRed;
  ctx.font = `18px ${FONT_TITLE}`;
  ctx.fillText('STATUS: PENDING REVIEW', CANVAS_W / 2, by + 110);

  // Body
  ctx.fillStyle = '#3D2A10';
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText('The Grand Steam Engine is operational.', CANVAS_W / 2, by + 145);
  ctx.fillText('Your celebration request has been filed.', CANVAS_W / 2, by + 165);
  ctx.fillText(`Estimated processing time: ${state.celebrationDays || 412} business days`, CANVAS_W / 2, by + 185);
  ctx.fillText('(Do not celebrate until formal authorization is filed.)', CANVAS_W / 2, by + 205);

  ctx.font = `10px ${FONT_BODY}`;
  ctx.fillText(`Gears collected: ${state.gearsCollected}`, CANVAS_W / 2, by + 235);
  ctx.fillText(`Trust violations: ${state.trustMemory.signTrust + state.trustMemory.upgradeTrust + state.trustMemory.gaugeTrust}`, CANVAS_W / 2, by + 255);

  // Official seal
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = COLORS.rustRed;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2 + 170, by + 240, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.rustRed;
  ctx.font = `8px ${FONT_HEADING}`;
  ctx.fillText('OFFICIAL', CANVAS_W / 2 + 170, by + 238);
  ctx.fillText('SEAL', CANVAS_W / 2 + 170, by + 248);

  // Buttons
  const btnW = 200;
  const btnH = 30;
  const btnY = by + bh - 45;
  const btnX1 = CANVAS_W / 2 - btnW - 10;
  const btnX2 = CANVAS_W / 2 + 10;

  drawBrassButton(ctx, btnX1, btnY, btnW, btnH, 'RESTART SHIFT  [R]');
  drawBrassButton(ctx, btnX2, btnY, btnW, btnH, 'MAIN MENU  [ESC]', { small: true });
}

// ══════════════════════════════════════════
// DEFEAT OVERLAY
// ══════════════════════════════════════════
function drawDefeatOverlay(ctx, state) {
  // Dark red overlay
  ctx.fillStyle = 'rgba(30, 5, 0, 0.88)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Flickering furnace glow
  const glowAlpha = 0.05 + Math.sin(frameTick * 0.08) * 0.03;
  ctx.globalAlpha = glowAlpha;
  ctx.fillStyle = '#FF3333';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;

  const pw = 460;
  const ph = 260;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;

  drawBrassPanel(ctx, px, py, pw, ph, { borderColor: COLORS.rustRed, fill: 'rgba(30, 8, 4, 0.95)' });

  // Title
  ctx.fillStyle = COLORS.dangerRed;
  ctx.font = `34px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('MELTDOWN', CANVAS_W / 2, py + 55);

  drawDivider(ctx, px + 30, py + 68, pw - 60);

  // Reason
  ctx.fillStyle = COLORS.parchment;
  ctx.font = `13px ${FONT_BODY}`;
  const reason = state.defeatReason || 'The factory has claimed another engineer.';
  const reasonLines = reason.split('\n');
  reasonLines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, py + 95 + i * 20);
  });

  // Footer
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = `10px ${FONT_BODY}`;
  ctx.fillText('An incident report has been filed.', CANVAS_W / 2, py + 155);
  ctx.fillText('Your next of kin has been notified (pending permit approval).', CANVAS_W / 2, py + 172);

  // Buttons
  const btnW = 260;
  const btnX = CANVAS_W / 2 - btnW / 2;
  drawBrassButton(ctx, btnX, py + 190, btnW, 32, 'TRY AGAIN  [R]', { danger: true });
  drawBrassButton(ctx, btnX, py + 228, btnW, 24, 'RETURN TO MENU  [ESC]', { small: true });
}

// ══════════════════════════════════════════
// MAIN MENU — Illustrated Victorian Title Screen
// ══════════════════════════════════════════
function drawMenu(ctx) {
  // Illustrated factory backdrop
  if (backdropLoaded) {
    ctx.drawImage(backdropImg, 0, 0, CANVAS_W, CANVAS_H);
    // Dark overlay for legibility
    ctx.fillStyle = 'rgba(13, 9, 6, 0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Vignette
    const vig = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.25, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    // Fallback gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#1C1008');
    grad.addColorStop(0.5, '#22160C');
    grad.addColorStop(1, '#0D0906');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Animated background gears
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = COLORS.brassGold;
  for (let i = 0; i < 6; i++) {
    const gx = 200 + i * 200;
    const gy = 100 + (i % 2) * 280;
    drawGearShape(ctx, gx, gy, 50 + i * 12, frameTick * 0.003 * (i % 2 === 0 ? 1 : -1));
  }
  ctx.globalAlpha = 1;

  // Top decorative pipe
  ctx.fillStyle = COLORS.copperDark;
  ctx.fillRect(0, 0, CANVAS_W, 6);
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(0, 0, CANVAS_W, 3);

  // Bottom decorative pipe
  ctx.fillStyle = COLORS.copperDark;
  ctx.fillRect(0, CANVAS_H - 6, CANVAS_W, 6);
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(0, CANVAS_H - 3, CANVAS_W, 3);

  // Title panel
  const tpW = 700;
  const tpH = 120;
  const tpX = (CANVAS_W - tpW) / 2;
  const tpY = 60;
  drawBrassPanel(ctx, tpX, tpY, tpW, tpH, { borderWidth: 5, fill: 'rgba(18, 12, 6, 0.88)' });

  // Title text with shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = `72px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('MELTDWN', CANVAS_W / 2 + 3, tpY + 62 + 3);

  // Title text
  const titleGrad = ctx.createLinearGradient(CANVAS_W / 2 - 200, tpY + 20, CANVAS_W / 2 + 200, tpY + 70);
  titleGrad.addColorStop(0, '#D4AF5A');
  titleGrad.addColorStop(0.3, '#F5DE88');
  titleGrad.addColorStop(0.5, '#E5A93C');
  titleGrad.addColorStop(0.7, '#F5DE88');
  titleGrad.addColorStop(1, '#C5993E');
  ctx.fillStyle = titleGrad;
  ctx.fillText('MELTDWN', CANVAS_W / 2, tpY + 62);

  // Glitch effect
  if (frameTick % 150 < 4) {
    ctx.fillStyle = COLORS.dangerRed;
    ctx.globalAlpha = 0.4;
    ctx.fillText('MELTDWN', CANVAS_W / 2 + 3, tpY + 60);
    ctx.globalAlpha = 1;
  }

  // Tagline
  ctx.fillStyle = COLORS.parchment;
  ctx.font = `15px ${FONT_BODY}`;
  ctx.fillText('THE FACTORY IS FINE. YOU ARE NOT.', CANVAS_W / 2, tpY + 95);

  // Decorative divider below title
  drawDivider(ctx, tpX + 50, tpY + tpH + 20, tpW - 100);

  // Ornate main menu console panel
  const panelW = 400;
  const panelH = 264;
  const panelX = CANVAS_W / 2 - panelW / 2;
  const panelY = 232;
  drawBrassPanel(ctx, panelX, panelY, panelW, panelH, { borderWidth: 3, fill: 'rgba(20, 12, 6, 0.88)' });

  // Menu buttons
  const btnW = 340;
  const btnX = CANVAS_W / 2 - btnW / 2;

  drawBrassButton(ctx, btnX, 250, btnW, 42, 'START SHIFT  [ENTER]');
  drawBrassButton(ctx, btnX, 302, btnW, 38, 'HOW TO WORK  [I]', { small: true });
  drawBrassButton(ctx, btnX, 350, btnW, 38, 'PERMIT STATUS  [P]', { small: true });
  drawBrassButton(ctx, btnX, 398, btnW, 38, 'CREDITS  [C]', { small: true });

  // Sound toggle
  const sndText = isMuted() ? 'SOUND: OFF  [M]' : 'SOUND: ON  [M]';
  drawBrassButton(ctx, btnX, 446, btnW, 34, sndText, { small: true });

  // Footer
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = `10px ${FONT_BODY}`;
  ctx.textAlign = 'center';
  ctx.fillText('Game Vita 5.0  \u2014  Worst Game Wins', CANVAS_W / 2, CANVAS_H - 20);

  // Floating steam particles (cosmetic)
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 10; i++) {
    const sx = (i * 150 + frameTick * 0.5) % (CANVAS_W + 100) - 50;
    const sy = CANVAS_H - 60 - Math.sin(frameTick * 0.02 + i) * 20;
    ctx.fillStyle = '#AAAAAA';
    ctx.beginPath();
    ctx.arc(sx, sy, 12 + Math.sin(frameTick * 0.03 + i) * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ══════════════════════════════════════════
// INSTRUCTIONS — Victorian Brass Notice Board
// ══════════════════════════════════════════
function drawInstructions(ctx) {
  // Background
  if (backdropLoaded) {
    ctx.drawImage(backdropImg, 0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(13, 9, 6, 0.75)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#0D0906';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  const pw = 900;
  const ph = 580;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;

  drawBrassPanel(ctx, px, py, pw, ph, { borderWidth: 5, fill: 'rgba(18, 12, 6, 0.95)' });

  const cx = CANVAS_W / 2;

  // Title
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = `26px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('EMPLOYEE ORIENTATION', cx, py + 45);

  drawDivider(ctx, px + 50, py + 58, pw - 100);

  // ── Left Column: Controls ──
  const colL = px + 40;
  const colR = px + pw / 2 + 20;
  let yPos = py + 85;

  ctx.fillStyle = COLORS.amberGlow || COLORS.brassGold;
  ctx.font = `14px ${FONT_HEADING}`;
  ctx.textAlign = 'left';
  ctx.fillText('CONTROLS', colL, yPos);
  yPos += 8;

  const controls = [
    ['A / D  or  \u2190 / \u2192', 'Move'],
    ['SPACE  or  W / \u2191', 'Jump'],
    ['E', 'Interact / Activate'],
    ['T  or  Click Gauge', 'Check True Pressure'],
    ['ESC', 'Pause'],
    ['M', 'Toggle Sound'],
    ['R', 'Restart Shift'],
  ];

  ctx.font = `12px ${FONT_BODY}`;
  controls.forEach(([key, action]) => {
    yPos += 24;
    // Key badge
    const kw = ctx.measureText(key).width + 16;
    ctx.fillStyle = 'rgba(140, 83, 27, 0.3)';
    ctx.fillRect(colL, yPos - 13, kw, 18);
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 1;
    ctx.strokeRect(colL, yPos - 13, kw, 18);
    ctx.fillStyle = COLORS.goldLeaf || COLORS.brassLight;
    ctx.font = `11px ${FONT_HEADING}`;
    ctx.textAlign = 'left';
    ctx.fillText(key, colL + 8, yPos);

    ctx.fillStyle = COLORS.parchment;
    ctx.font = `12px ${FONT_BODY}`;
    ctx.fillText(action, colL + kw + 12, yPos);
  });

  // ── Right Column: Objective + Warnings ──
  yPos = py + 85;
  ctx.fillStyle = COLORS.amberGlow || COLORS.brassGold;
  ctx.font = `14px ${FONT_HEADING}`;
  ctx.textAlign = 'left';
  ctx.fillText('OBJECTIVE', colR, yPos);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `12px ${FONT_BODY}`;
  const objectives = [
    'Restart the Grand Steam Engine.',
    'Collect gears. Obtain permits.',
    'Activate machinery in order.',
    'Manage boiler pressure. Survive.',
  ];
  objectives.forEach((line, i) => {
    yPos += 22;
    ctx.fillText('\u2022  ' + line, colR, yPos);
  });

  yPos += 35;
  ctx.fillStyle = COLORS.rustLight;
  ctx.font = `14px ${FONT_HEADING}`;
  ctx.fillText('WARNINGS', colR, yPos);

  const warnings = [
    ['Boiler pressure rises constantly.', COLORS.dangerRed],
    ['Some machines require permits.', COLORS.amberGlow || COLORS.yellowWarn],
    ['Upgrades have cursed side effects.', COLORS.rustLight],
    ['The factory remembers your habits.', COLORS.amberGlow || COLORS.yellowWarn],
    ['Progress creates complications.', COLORS.rustLight],
    ['Falling = OSHA report + 8% pressure.', COLORS.dangerRed],
    ['The gauge may lie. Tap [T] to check.', COLORS.dangerRed],
  ];

  ctx.font = `11px ${FONT_BODY}`;
  warnings.forEach(([text, color]) => {
    yPos += 22;
    ctx.fillStyle = color;
    ctx.fillText('\u26A0  ' + text, colR, yPos);
  });

  // Footer divider
  drawDivider(ctx, px + 50, py + ph - 60, pw - 100);

  // Quote
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = `italic 12px ${FONT_BODY}`;
  ctx.textAlign = 'center';
  ctx.fillText('"Safety is everyone\'s responsibility."  \u2014 Management', cx, py + ph - 40);

  // Back button
  drawBrassButton(ctx, cx - 140, py + ph - 25, 280, 22, 'BACK TO MENU  [ENTER / ESC]', { small: true });
}

// ══════════════════════════════════════════
// PERMITS LEDGER — Victorian Bureaucratic Registry
// ══════════════════════════════════════════
function drawPermitsLedger(ctx, state) {
  if (backdropLoaded) {
    ctx.drawImage(backdropImg, 0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(13, 9, 6, 0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#0D0906';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  const pw = 880;
  const ph = 560;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;
  const cx = CANVAS_W / 2;

  drawBrassPanel(ctx, px, py, pw, ph, { borderWidth: 5, fill: 'rgba(22, 14, 8, 0.95)' });

  // Title
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = `24px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('MINISTRY OF INDUSTRIAL OVERSIGHT', cx, py + 42);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `12px ${FONT_HEADING}`;
  ctx.fillText('CENTRAL PERMIT REGISTER & AUTHORIZATION LEDGER', cx, py + 64);

  drawDivider(ctx, px + 50, py + 74, pw - 100);

  // Permit entries
  const permits = [
    {
      code: 'PERMIT A-12',
      title: 'Primary Generator Ignition & Dynamo Licensing',
      req: 'Requires clearance from the East Generator Station.',
      has: state && state.permitsHeld && (state.permitsHeld.includes('Permit A-12') || state.permitsHeld.includes('A-12')),
    },
    {
      code: 'PERMIT B-44',
      title: 'Pneumatic Conveyance & Industrial Belt Transport',
      req: 'Required before traversing automated factory belts.',
      has: state && state.permitsHeld && (state.permitsHeld.includes('Permit B-44') || state.permitsHeld.includes('B-44')),
    },
    {
      code: 'PERMIT C-99',
      title: 'Boiler Overpressure Emergency Relief Authorization',
      req: 'Mandatory license to vent high-pressure safety valves.',
      has: state && state.permitsHeld && (state.permitsHeld.includes('Permit C-99') || state.permitsHeld.includes('C-99')),
    },
    {
      code: 'FORM 47-B',
      title: 'Special Exemption: Application to Celebrate Shift Completion',
      req: 'Subject to 412 business days administrative review.',
      has: state && state.gameState === STATE.VICTORY,
      special: true,
    },
  ];

  let cardY = py + 92;
  permits.forEach((p, i) => {
    // Card background
    ctx.fillStyle = p.has ? 'rgba(30, 45, 30, 0.6)' : 'rgba(38, 24, 12, 0.6)';
    ctx.fillRect(px + 40, cardY, pw - 80, 80);
    ctx.strokeStyle = p.has ? COLORS.goldLeaf : COLORS.copper;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 40, cardY, pw - 80, 80);

    // Code & Title
    ctx.fillStyle = p.has ? COLORS.goldLeaf : COLORS.amberGlow;
    ctx.font = `14px ${FONT_HEADING}`;
    ctx.textAlign = 'left';
    ctx.fillText(p.code, px + 60, cardY + 28);

    ctx.fillStyle = COLORS.parchment;
    ctx.font = `12px ${FONT_BODY}`;
    ctx.fillText(p.title, px + 175, cardY + 28);

    // Requirement
    ctx.fillStyle = COLORS.charcoalLight;
    ctx.font = `11px ${FONT_BODY}`;
    ctx.fillText(p.req, px + 60, cardY + 54);

    // Status stamp
    const stampX = px + pw - 160;
    const stampY = cardY + 22;
    ctx.fillStyle = p.has ? 'rgba(76, 175, 80, 0.2)' : 'rgba(179, 58, 42, 0.2)';
    ctx.fillRect(stampX, stampY, 100, 36);
    ctx.strokeStyle = p.has ? '#4CAF50' : COLORS.rustRed;
    ctx.lineWidth = 2;
    ctx.strokeRect(stampX, stampY, 100, 36);

    ctx.fillStyle = p.has ? '#4CAF50' : COLORS.rustRed;
    ctx.font = `bold 11px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText(p.has ? 'APPROVED' : (p.special ? 'PENDING' : 'REQUIRED'), stampX + 50, stampY + 22);

    cardY += 92;
  });

  // Footer divider
  drawDivider(ctx, px + 50, py + ph - 55, pw - 100);

  // Return button
  drawBrassButton(ctx, cx - 150, py + ph - 25, 300, 24, 'RETURN TO NOTICE BOARD  [ENTER / ESC]', { small: true });
}

// ══════════════════════════════════════════
// CREDITS — Victorian Commemorative Plaque
// ══════════════════════════════════════════
function drawCredits(ctx) {
  if (backdropLoaded) {
    ctx.drawImage(backdropImg, 0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(13, 9, 6, 0.78)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#0D0906';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  const pw = 840;
  const ph = 540;
  const px = (CANVAS_W - pw) / 2;
  const py = (CANVAS_H - ph) / 2;
  const cx = CANVAS_W / 2;

  drawBrassPanel(ctx, px, py, pw, ph, { borderWidth: 5, fill: 'rgba(22, 14, 8, 0.96)' });

  // Title
  ctx.fillStyle = COLORS.brassGold;
  ctx.font = `26px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.fillText('GRAND ENGINE WORKS & FOUNDRY', cx, py + 48);

  ctx.fillStyle = COLORS.parchment;
  ctx.font = `13px ${FONT_HEADING}`;
  ctx.fillText('COMMENDATIONS & ACCREDITATIONS', cx, py + 74);

  drawDivider(ctx, px + 60, py + 86, pw - 120);

  // Credits list
  const entries = [
    { role: 'CHIEF DESIGNER & AUTOMATA ENGINEER', name: 'The MELTDWN Engineering Team' },
    { role: 'OFFICIAL JAM ENTRY', name: 'Game Vita 5.0 — "Worst Game Wins"' },
    { role: 'STEAM SYNTHESIS & ACOUSTICS', name: 'Victorian Procedural Web Audio Engine' },
    { role: 'FOUNDRY ART DIRECTION & STYLING', name: '2D Illustrated Victorian Steampunk Canvas Engine' },
    { role: 'BUREAUCRATIC OVERSIGHT & SAFETY HAZARDS', name: 'Imperial Department of Redundant Paperwork & Boilers' },
  ];

  let ey = py + 125;
  entries.forEach(e => {
    ctx.fillStyle = COLORS.amberGlow || COLORS.brassGold;
    ctx.font = `12px ${FONT_HEADING}`;
    ctx.textAlign = 'center';
    ctx.fillText(e.role, cx, ey);

    ctx.fillStyle = COLORS.parchment;
    ctx.font = `13px ${FONT_BODY}`;
    ctx.fillText(e.name, cx, ey + 22);

    ey += 58;
  });

  // Footer quote & divider
  drawDivider(ctx, px + 60, py + ph - 55, pw - 120);
  ctx.fillStyle = COLORS.charcoalLight;
  ctx.font = `italic 11px ${FONT_BODY}`;
  ctx.textAlign = 'center';
  ctx.fillText('"The machine cares not for your compliance, but requires your signatures."', cx, py + ph - 38);

  // Return button
  drawBrassButton(ctx, cx - 140, py + ph - 22, 280, 22, 'RETURN TO MAIN CONSOLE  [ENTER / ESC]', { small: true });
}
