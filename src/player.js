// ── Player entity ──
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, MAX_FALL, FRICTION, TILE, CANVAS_H, COLORS } from './constants.js';
import { isDown, wasPressed } from './input.js';
import { sfxJump } from './audio.js';

export function createPlayer(x, y) {
  return {
    x, y,
    w: 28,
    h: 38,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,         // 1 = right, -1 = left
    walkFrame: 0,
    walkTimer: 0,
    hasTurboBoots: false,
    hasGoldenGear: false,
    // checkpoint
    checkpointX: x,
    checkpointY: y,
  };
}

export function updatePlayer(player, platforms, hazards, levelW, levelH) {
  const speed = player.hasTurboBoots ? MOVE_SPEED * 1.8 : MOVE_SPEED;
  const friction = player.hasTurboBoots ? 0.92 : FRICTION;

  // ── Horizontal input ──
  let moving = false;
  if (isDown('ArrowLeft') || isDown('KeyA')) {
    player.vx -= speed * 0.35;
    player.facing = -1;
    moving = true;
  }
  if (isDown('ArrowRight') || isDown('KeyD')) {
    player.vx += speed * 0.35;
    player.facing = 1;
    moving = true;
  }

  player.vx *= friction;
  if (Math.abs(player.vx) < 0.2) player.vx = 0;
  // Cap horizontal speed
  const maxH = player.hasTurboBoots ? speed * 1.3 : speed;
  if (player.vx > maxH) player.vx = maxH;
  if (player.vx < -maxH) player.vx = -maxH;

  // ── Jump ──
  if ((wasPressed('Space') || wasPressed('ArrowUp') || wasPressed('KeyW')) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    sfxJump();
  }

  // ── Gravity ──
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;

  // ── Walk animation ──
  if (moving && player.onGround) {
    player.walkTimer += 0.15;
    player.walkFrame = Math.floor(player.walkTimer) % 4;
  } else {
    player.walkTimer = 0;
    player.walkFrame = 0;
  }

  // ── Move X and collide ──
  player.x += player.vx;
  player.onGround = false;
  resolveCollisions(player, platforms, 'x');

  // ── Move Y and collide ──
  player.y += player.vy;
  resolveCollisions(player, platforms, 'y');

  // ── World bounds ──
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.w > levelW) { player.x = levelW - player.w; player.vx = 0; }

  // ── Fell off screen? ──
  if (player.y > levelH + 100) {
    return 'fell';
  }

  // ── Hazard check ──
  for (const h of hazards) {
    if (!h.active) continue;
    if (rectsOverlap(player, h)) {
      return 'hazard';
    }
  }

  return null;
}

function resolveCollisions(player, platforms, axis) {
  for (const p of platforms) {
    if (!rectsOverlap(player, p)) continue;

    if (axis === 'x') {
      if (player.vx > 0) {
        player.x = p.x - player.w;
      } else if (player.vx < 0) {
        player.x = p.x + p.w;
      }
      player.vx = 0;
    } else {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ── Render the player character ──
export function renderPlayer(ctx, player, camX, camY) {
  const px = Math.round(player.x - camX);
  const py = Math.round(player.y - camY);
  const f = player.facing;

  ctx.save();
  ctx.translate(px + player.w / 2, py + player.h);
  ctx.scale(f, 1);

  // Body
  ctx.fillStyle = COLORS.teal;
  ctx.fillRect(-12, -36, 24, 26);

  // Head
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(-8, -44, 16, 12);

  // Goggles
  ctx.fillStyle = COLORS.copper;
  ctx.fillRect(-7, -40, 6, 5);
  ctx.fillRect(1, -40, 6, 5);
  ctx.fillStyle = COLORS.tealLight;
  ctx.fillRect(-5, -39, 3, 3);
  ctx.fillRect(2, -39, 3, 3);

  // Legs — animate walk
  const legOffset = player.onGround ? Math.sin(player.walkTimer * 3) * 3 : 0;
  ctx.fillStyle = COLORS.charcoalMed;
  ctx.fillRect(-9, -10, 7, 10 + legOffset);
  ctx.fillRect(2, -10, 7, 10 - legOffset);

  // Boots
  if (player.hasTurboBoots) {
    ctx.fillStyle = COLORS.rustRed;
    ctx.fillRect(-11, -1 + legOffset, 9, 4);
    ctx.fillRect(1, -1 - legOffset, 9, 4);
    // flames
    if (Math.random() > 0.4) {
      ctx.fillStyle = COLORS.yellowWarn;
      ctx.fillRect(-9, 3 + legOffset, 5, 3);
      ctx.fillRect(3, 3 - legOffset, 5, 3);
    }
  } else {
    ctx.fillStyle = COLORS.copperDark;
    ctx.fillRect(-10, -1 + legOffset, 8, 3);
    ctx.fillRect(2, -1 - legOffset, 8, 3);
  }

  // Arm
  ctx.fillStyle = COLORS.tealDark;
  const armSwing = Math.sin(player.walkTimer * 3) * 4;
  ctx.fillRect(10, -32 + armSwing, 5, 14);

  // Hard hat / helmet
  ctx.fillStyle = COLORS.brassGold;
  ctx.fillRect(-10, -48, 20, 6);
  ctx.fillRect(-6, -50, 12, 4);

  ctx.restore();
}
