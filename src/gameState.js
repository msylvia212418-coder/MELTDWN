// ── Game State & Logic ──
// Central game state, update loop, interaction handling, and all mechanics.

import { STATE, PRESSURE_MAX, PRESSURE_RATE, PRESSURE_WARN, PRESSURE_DANGER, VALVE_REDUCTION, TRUST_THRESHOLD, CANVAS_W, CANVAS_H } from './constants.js';
import { buildLevel, LEVEL_W, LEVEL_H } from './level.js';
import { createPlayer, updatePlayer, rectsOverlap } from './player.js';
import { isDown, wasPressed, wasClicked, resetInput } from './input.js';
import { sfxGear, sfxDeny, sfxPermit, sfxValve, sfxExplosion, sfxVictory, sfxActivate, sfxHurt } from './audio.js';
import { toggleMute } from './audio.js';

export function createGameState() {
  const level = buildLevel();
  const player = createPlayer(2 * 40, 13 * 40);

  return {
    gameState: STATE.MENU,
    level,
    player,

    // Collectibles
    gearsCollected: 0,
    permitsHeld: [],         // array of permit names

    // Pressure
    pressure: 10,
    pressurePaused: false,
    deceptiveGaugeActive: false,
    gaugeTappedTimer: 0,

    // Trust Memory
    trustMemory: {
      signTrust: 0,
      upgradeTrust: 0,
      gaugeTrust: 0,
    },

    // Complications
    generatorActivated: false,
    conveyorActive: false,
    inspectionTriggered: false,
    inspectionCleared: false,

    // Dialogue
    dialogue: null,           // { title, text } or null
    dialogueQueue: [],

    // Interaction prompt
    interactPrompt: null,

    // Supervisor messages
    supervisorMsg: '',
    supervisorMsgTimer: 0,

    // Objectives
    currentObjective: 'Find the Generator. Collect gears along the way.',

    // Defeat
    defeatReason: '',

    // Particles
    particles: [],

    // Golden gear shortcut
    shortcutOpen: false,

    // Form 47-B review days
    celebrationDays: 412,
  };
}

// ── Main update function ──
export function updateGame(state) {
  const click = wasClicked();

  // ── Menu state ──
  if (state.gameState === STATE.MENU) {
    const btnW = 340;
    const btnX = CANVAS_W / 2 - btnW / 2;
    const inBtnX = click && click.x >= btnX && click.x <= btnX + btnW;

    if (wasPressed('Enter') || wasPressed('NumpadEnter') || (inBtnX && click.y >= 250 && click.y <= 292)) {
      startGame(state);
      return;
    }
    if (wasPressed('KeyI') || (inBtnX && click.y >= 302 && click.y <= 340)) {
      state.gameState = STATE.INSTRUCTIONS;
      return;
    }
    if (wasPressed('KeyP') || (inBtnX && click.y >= 350 && click.y <= 388)) {
      state.gameState = STATE.PERMITS;
      return;
    }
    if (wasPressed('KeyC') || (inBtnX && click.y >= 398 && click.y <= 436)) {
      state.gameState = STATE.CREDITS;
      return;
    }
    if (wasPressed('KeyM') || (inBtnX && click.y >= 446 && click.y <= 480)) {
      toggleMute();
      return;
    }
    return;
  }

  // ── Instructions ──
  if (state.gameState === STATE.INSTRUCTIONS) {
    if (wasPressed('Enter') || wasPressed('Escape') || wasPressed('NumpadEnter') || wasPressed('KeyI') || click) {
      state.gameState = STATE.MENU;
    }
    return;
  }

  // ── Permits Ledger ──
  if (state.gameState === STATE.PERMITS) {
    if (wasPressed('Enter') || wasPressed('Escape') || wasPressed('NumpadEnter') || wasPressed('KeyP') || click) {
      state.gameState = STATE.MENU;
    }
    return;
  }

  // ── Credits ──
  if (state.gameState === STATE.CREDITS) {
    if (wasPressed('Enter') || wasPressed('Escape') || wasPressed('NumpadEnter') || wasPressed('KeyC') || click) {
      state.gameState = STATE.MENU;
    }
    return;
  }

  // ── Victory state ──
  if (state.gameState === STATE.VICTORY) {
    const vBtnY = (CANVAS_H - 330) / 2 + 330 - 38; // 487
    const vBtnW = 190;
    const vBtnH = 28;
    const vBtnX1 = CANVAS_W / 2 - vBtnW - 10; // 440 to 630
    const vBtnX2 = CANVAS_W / 2 + 10;         // 650 to 840

    if (wasPressed('KeyR') || (click && click.y >= vBtnY && click.y <= vBtnY + vBtnH && click.x >= vBtnX1 && click.x <= vBtnX1 + vBtnW)) {
      restartGame(state);
      return;
    }
    if (wasPressed('Escape') || (click && click.y >= vBtnY && click.y <= vBtnY + vBtnH && click.x >= vBtnX2 && click.x <= vBtnX2 + vBtnW)) {
      Object.assign(state, createGameState());
      state.gameState = STATE.MENU;
      return;
    }
    return;
  }

  // ── Defeat state ──
  if (state.gameState === STATE.DEFEAT) {
    const dBtnW = 260;
    const dBtnX = CANVAS_W / 2 - dBtnW / 2;
    const dTryY1 = CANVAS_H / 2 + 58;
    const dTryY2 = CANVAS_H / 2 + 90;
    const dMenuY1 = CANVAS_H / 2 + 96;
    const dMenuY2 = CANVAS_H / 2 + 122;

    if (wasPressed('KeyR') || (click && click.x >= dBtnX && click.x <= dBtnX + dBtnW && click.y >= dTryY1 && click.y <= dTryY2)) {
      restartGame(state);
      return;
    }
    if (wasPressed('Escape') || (click && click.x >= dBtnX && click.x <= dBtnX + dBtnW && click.y >= dMenuY1 && click.y <= dMenuY2)) {
      Object.assign(state, createGameState());
      state.gameState = STATE.MENU;
      return;
    }
    return;
  }

  // ── Pause toggle ──
  if (wasPressed('Escape') || (click && click.x >= CANVAS_W - 145 && click.x <= CANVAS_W - 70 && click.y <= 50)) {
    if (state.gameState === STATE.PLAYING) {
      state.gameState = STATE.PAUSED;
      return;
    }
  }

  if (state.gameState === STATE.PAUSED) {
    const ph = 246;
    const py = (CANVAS_H - ph) / 2;
    const pBtnW = 260;
    const pBtnX = CANVAS_W / 2 - pBtnW / 2;
    if (wasPressed('Escape') || (click && click.x >= pBtnX && click.x <= pBtnX + pBtnW && click.y >= py + 118 && click.y <= py + 150)) {
      state.gameState = STATE.PLAYING;
      return;
    }
    if (wasPressed('KeyR') || (click && click.x >= pBtnX && click.x <= pBtnX + pBtnW && click.y >= py + 156 && click.y <= py + 186)) {
      restartGame(state);
      return;
    }
    if (wasPressed('Enter') || wasPressed('NumpadEnter') || (click && click.x >= pBtnX && click.x <= pBtnX + pBtnW && click.y >= py + 194 && click.y <= py + 224)) {
      Object.assign(state, createGameState());
      state.gameState = STATE.MENU;
      return;
    }
    return;
  }

  // ── Mute toggle ──
  if (wasPressed('KeyM') || (click && click.x >= CANVAS_W - 65 && click.y <= 50)) {
    toggleMute();
  }

  // ── Dialogue handling ──
  if (state.dialogue) {
    if (wasPressed('KeyE') || wasPressed('Space') || click) {
      state.dialogue = null;
      if (state.dialogueQueue.length > 0) {
        state.dialogue = state.dialogueQueue.shift();
      }
    }
    return; // block gameplay while dialogue is open
  }

  // ── Gauge tapping (discover deceptive gauge) ──
  if (wasPressed('KeyT') || (click && click.x >= 10 && click.x <= 180 && click.y >= 10 && click.y <= 55)) {
    if (state.deceptiveGaugeActive) {
      tapGauge(state);
    }
  }

  // ── Playing ──

  // Active platforms including shortcut if unlocked
  const allPlatforms = state.shortcutOpen
    ? [...state.level.platforms, ...(state.level.shortcutPlatforms || [])]
    : state.level.platforms;

  // Update player
  const result = updatePlayer(state.player, allPlatforms, getActiveHazards(state), LEVEL_W, LEVEL_H);

  // Turbo boots continuous sprint heating
  if (state.player.hasTurboBoots && state.player.onGround && Math.abs(state.player.vx) > 5) {
    state.player.turboSprintTicks = (state.player.turboSprintTicks || 0) + 1;
    if (state.player.turboSprintTicks > 180) {
      state.player.turboSprintTicks = 0;
      state.pressure += 2;
      sfxHurt();
      showSupervisor(state, '⚠ BOOT OVERHEAT: Excessive speed recorded. Friction penalty: +2% pressure.', 180);
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: state.player.x + 14,
          y: state.player.y + 36,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2 - 1,
          r: Math.random() * 4 + 2,
          life: 0.8,
        });
      }
    }
  } else {
    state.player.turboSprintTicks = Math.max(0, (state.player.turboSprintTicks || 0) - 2);
  }
  if (result === 'fell') {
    // Respawn at checkpoint with pressure penalty
    state.player.x = state.player.checkpointX;
    state.player.y = state.player.checkpointY;
    state.player.vx = 0;
    state.player.vy = 0;
    state.pressure += 8;
    sfxHurt();
    showSupervisor(state, 'You fell. +8% pressure. An incident report has been filed.', 180);
    if (state.pressure >= PRESSURE_MAX) {
      triggerDefeat(state, 'Too many falls caused a boiler meltdown.\nClumsy AND explosive.');
    }
    return;
  }
  if (result === 'hazard') {
    sfxHurt();
    triggerDefeat(state, 'Hazardous steam exposure detected.\nYour safety record has been updated.');
    return;
  }

  // Conveyor belt effect
  applyConveyors(state);

  // Pressure system
  updatePressure(state);

  // Steam vent toggling
  updateSteamVents(state);

  // Collectible pickup
  checkGearPickup(state);
  checkPermitPickup(state);

  // Checkpoint activation
  checkCheckpoints(state);

  // Interaction detection
  updateInteractionPrompts(state);

  // Interaction execution
  if (wasPressed('KeyE')) {
    handleInteraction(state);
  }

  // Supervisor message timer
  if (state.supervisorMsgTimer > 0) {
    state.supervisorMsgTimer--;
  }

  // Particles
  updateParticles(state);

  // Spawn ambient steam
  if (frameTick % 30 === 0) {
    spawnSteamNearVents(state);
  }
}

let frameTick = 0;
export function tickFrame() { frameTick++; }

// ── Start / Restart ──

function startGame(state) {
  const fresh = createGameState();
  Object.assign(state, fresh);
  state.gameState = STATE.PLAYING;
  resetInput();
  showSupervisor(state, 'Welcome to your shift. Please collect gears and obtain permits.', 300);
}

function restartGame(state) {
  startGame(state);
}

// ── Defeat ──
function triggerDefeat(state, reason) {
  state.gameState = STATE.DEFEAT;
  state.defeatReason = reason;
  sfxExplosion();
}

// ── Pressure ──
function updatePressure(state) {
  if (state.gaugeTappedTimer > 0) {
    state.gaugeTappedTimer--;
  }

  if (state.pressurePaused) return;
  state.pressure += PRESSURE_RATE;

  // Conveyors add extra pressure
  if (state.conveyorActive) {
    state.pressure += PRESSURE_RATE * 0.5;
  }

  // Warnings
  if (state.pressure >= PRESSURE_DANGER && !state._dangerWarned) {
    showSupervisor(state, '⚠ DANGER: Pressure critical! Find a valve!', 200);
    state._dangerWarned = true;
  } else if (state.pressure >= PRESSURE_WARN && !state._warnWarned) {
    showSupervisor(state, '⚠ WARNING: Pressure rising. Consider using a valve.', 180);
    state._warnWarned = true;
  }

  // Overheat
  if (state.pressure >= PRESSURE_MAX) {
    triggerDefeat(state, 'BOILER MELTDOWN!\nPressure exceeded maximum tolerance.\nThe factory will reopen in... never.');
  }
}

function tapGauge(state) {
  state.gaugeTappedTimer = 240; // ~4 seconds at 60fps
  sfxValve();
  showSupervisor(state, 'You tapped the gauge glass! The needle jumped to reveal actual pressure.', 180);
}

// ── Steam vents ──
function updateSteamVents(state) {
  for (const h of state.level.hazards) {
    if (h.type !== 'steam_vent') continue;
    h.timer++;
    if (h.active && h.timer > h.onDuration) {
      h.active = false;
      h.timer = 0;
    } else if (!h.active && h.timer > h.offDuration) {
      h.active = true;
      h.timer = 0;
    }
  }
}

// ── Active hazards (for collision) ──
function getActiveHazards(state) {
  return state.level.hazards.filter(h => {
    if (h.type === 'steam_vent') return h.active;
    if (h.type === 'conveyor') return false; // conveyors push, don't kill
    if (h.type === 'gap') return false; // gaps are just missing floor
    return h.active;
  });
}

// ── Conveyors ──
function applyConveyors(state) {
  for (const h of state.level.hazards) {
    if (h.type !== 'conveyor' || !h.active) continue;
    // Check if player is near conveyor (standing on it)
    const onConveyor = state.player.y + state.player.h >= h.y - 5 &&
                       state.player.y + state.player.h <= h.y + 10 &&
                       state.player.x + state.player.w > h.x &&
                       state.player.x < h.x + h.w;
    if (onConveyor) {
      state.player.vx += h.dir === 'right' ? h.speed * 0.15 : -h.speed * 0.15;
    }
  }
}

// ── Gear pickup ──
function checkGearPickup(state) {
  for (const g of state.level.gears) {
    if (g.collected) continue;
    if (rectsOverlap(state.player, g)) {
      g.collected = true;
      state.gearsCollected++;
      sfxGear();
      showSupervisor(state, `Gear collected! (${state.gearsCollected} total)`, 120);
    }
  }
}

// ── Permit pickup ──
function checkPermitPickup(state) {
  for (const p of state.level.permits) {
    if (p.collected) continue;
    if (rectsOverlap(state.player, p)) {
      p.collected = true;
      state.permitsHeld.push(p.name);
      sfxPermit();
      showDialogue(state, 'PERMIT ACQUIRED', `${p.name}\n\n${p.description}\n\nFiled and approved.\n(Do not lose this document.)`);
      updateObjective(state);
    }
  }
}

// ── Checkpoints ──
function checkCheckpoints(state) {
  for (const cp of state.level.checkpoints) {
    if (cp.activated) continue;
    if (rectsOverlap(state.player, cp)) {
      cp.activated = true;
      state.player.checkpointX = cp.x;
      state.player.checkpointY = cp.y - state.player.h;
      showSupervisor(state, 'Checkpoint reached. Progress saved (probably).', 150);
    }
  }
}

// ── Interaction prompts ──
function updateInteractionPrompts(state) {
  state.interactPrompt = null;

  // Machines
  for (const m of state.level.machines) {
    if (m.activated && m.id !== 'engine') continue;
    if (rectsOverlap(state.player, m.interactBox)) {
      if (m.id === 'engine') {
        state.interactPrompt = '[E] Activate Grand Steam Engine';
      } else {
        state.interactPrompt = `[E] ${m.promptText}`;
      }
      return;
    }
  }

  // Valves
  for (const v of state.level.valves) {
    if (rectsOverlap(state.player, v.interactBox)) {
      if (v.cooldown > 0) {
        state.interactPrompt = `[E] Valve cooling down... (${Math.ceil(v.cooldown / 60)}s)`;
      } else {
        state.interactPrompt = '[E] Release pressure valve';
      }
      return;
    }
  }

  // Signs
  for (const s of state.level.signs) {
    if (rectsOverlap(state.player, s.interactBox)) {
      state.interactPrompt = '[E] Read sign';
      return;
    }
  }

  // Upgrades
  for (const u of state.level.upgrades) {
    if (u.purchased) continue;
    if (rectsOverlap(state.player, u.interactBox)) {
      state.interactPrompt = `[E] Purchase ${u.name} (${u.cost} gears)`;
      return;
    }
  }
}

// ── Handle interaction ──
function handleInteraction(state) {
  // Check machines first
  for (const m of state.level.machines) {
    if (!rectsOverlap(state.player, m.interactBox)) continue;

    if (m.id === 'engine') {
      handleEngineActivation(state, m);
      return;
    }

    if (m.activated) {
      showDialogue(state, 'MACHINE STATUS', `${m.name} is already operational.\n\nPlease do not press buttons unnecessarily.\nForm 88-D: "Excessive Button Pressing" may apply.`);
      return;
    }

    // Check permit
    if (m.requiredPermit && !state.permitsHeld.includes(m.requiredPermit)) {
      sfxDeny();
      showDialogue(state, 'ACCESS DENIED', `${m.name} requires: ${m.requiredPermit}\n\nPlease obtain the appropriate permit\nbefore operating this equipment.\n\nViolators will be recycled.`);
      return;
    }

    // Activate machine
    activateMachine(state, m);
    return;
  }

  // Valves
  for (const v of state.level.valves) {
    if (!rectsOverlap(state.player, v.interactBox)) continue;

    if (v.cooldown > 0) {
      sfxDeny();
      showDialogue(state, 'VALVE NOTICE', 'This valve is cooling down.\n\nPlease wait patiently.\nImpatience will be noted on your file.');
      return;
    }

    if (v.requiredPermit && !state.permitsHeld.includes(v.requiredPermit)) {
      sfxDeny();
      showDialogue(state, 'ACCESS DENIED', `This valve requires: ${v.requiredPermit}\n\nUnauthorized pressure relief is a\nClass 3 infraction.`);
      return;
    }

    // Release valve
    releaseValve(state, v);
    return;
  }

  // Signs
  for (const s of state.level.signs) {
    if (!rectsOverlap(state.player, s.interactBox)) continue;
    readSign(state, s);
    return;
  }

  // Upgrades
  for (const u of state.level.upgrades) {
    if (u.purchased) continue;
    if (!rectsOverlap(state.player, u.interactBox)) continue;
    purchaseUpgrade(state, u);
    return;
  }
}

// ── Machine activation ──
function activateMachine(state, machine) {
  machine.activated = true;
  sfxActivate();

  let complication = '';

  switch (machine.id) {
    case 'generator':
      state.generatorActivated = true;
      // Complication: activate conveyor belt
      state.conveyorActive = true;
      for (const h of state.level.hazards) {
        if (h.type === 'conveyor') h.active = true;
      }
      complication = '\n\n⚠ COMPLICATION: The conveyor belt has started!\nWatch your footing in the machine zone.';
      state.currentObjective = 'Find valves to manage pressure. Head deeper into the factory.';
      break;

    case 'boiler_pump':
      // Complication: pressure spike
      state.pressure += 12;
      complication = '\n\n⚠ COMPLICATION: Pump vibrations increased\nboiler pressure by 12%!';
      break;

    case 'crane':
      // Complication: triggers inspection
      state.inspectionTriggered = true;
      complication = '\n\n⚠ COMPLICATION: Crane operation has triggered\na mandatory safety inspection.\nExpect additional delays.';
      state.pressure += 5;
      break;
  }

  showDialogue(state, `${machine.name} ACTIVATED`, `${machine.activateText}${complication}`);
  updateObjective(state);

  // Trust memory: using machines increases gauge trust
  state.trustMemory.gaugeTrust++;
  checkTrustConsequences(state);
}

// ── Engine activation ──
function handleEngineActivation(state, machine) {
  if (machine.activated) {
    showDialogue(state, 'ENGINE STATUS', 'The Grand Steam Engine is already running.\n\nPlease stop touching things.');
    return;
  }

  // Require permit
  if (!state.permitsHeld.includes('Engine Permit')) {
    sfxDeny();
    showDialogue(state, 'ACCESS DENIED', 'Grand Steam Engine requires: Engine Permit\n\nFORM 47-B must be obtained before\nignition of the Grand Steam Engine.\n\nThis is not negotiable.');
    return;
  }

  // Check if generator is active
  if (!state.generatorActivated) {
    sfxDeny();
    showDialogue(state, 'INSUFFICIENT POWER', 'The Generator must be activated first.\n\nThe Grand Steam Engine cannot operate\nwithout electrical power.\n\nThis should be obvious.');
    return;
  }

  // Inspection check (if triggered, player needs to have visited crane)
  if (state.inspectionTriggered && !state.inspectionCleared) {
    state.inspectionCleared = true;
    state.pressure += 8;
    showDialogue(state, 'SAFETY INSPECTION', 'Inspector found 47 violations.\n\nAll violations have been waived\n(the inspector was also the boiler).\n\n+8% pressure from paperwork.');
    state.dialogueQueue.push({
      title: 'INSPECTION COMPLETE',
      text: 'You may now proceed with engine activation.\n\nPlease note: any celebrations must be\npre-approved via Form 47-B.'
    });
    return;
  }

  // Victory!
  machine.activated = true;
  state.level.engine.activated = true;
  sfxVictory();
  state.gameState = STATE.VICTORY;
}

// ── Valve release ──
function releaseValve(state, valve) {
  const actualReduction = VALVE_REDUCTION;
  state.pressure = Math.max(0, state.pressure - actualReduction);
  valve.cooldown = 300; // 5 seconds at 60fps
  sfxValve();

  // Trust memory
  state.trustMemory.gaugeTrust++;

  let msg = `Pressure reduced by ${actualReduction}%.\nCurrent pressure: ${Math.round(state.pressure)}%`;

  // Trust consequence: after too many valve uses, gauge becomes deceptive
  if (state.trustMemory.gaugeTrust >= TRUST_THRESHOLD + 2 && !state.deceptiveGaugeActive) {
    state.deceptiveGaugeActive = true;
    msg += '\n\n⚠ The factory has "recalibrated" your\npressure gauge. Readings may be\n"optimized for morale."';
  }

  showDialogue(state, 'VALVE RELEASED', msg);
  
  // Spawn steam particles
  for (let i = 0; i < 15; i++) {
    state.particles.push({
      x: valve.x + 20,
      y: valve.y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 3 - 1,
      r: Math.random() * 5 + 3,
      life: 1,
    });
  }

  // Reset danger warnings for new threshold
  state._dangerWarned = false;
  state._warnWarned = false;
}

// ── Sign reading ──
function readSign(state, sign) {
  sign.readCount++;
  state.trustMemory.signTrust++;

  let text = sign.text;

  // Trust consequence: after reading too many signs, one gives bad advice
  if (state.trustMemory.signTrust >= TRUST_THRESHOLD && sign.readCount >= 2) {
    const misleading = [
      'ACTUALLY, the engine is to the LEFT.\n(It is not.)',
      'TIP: Jump into steam vents for bonus gears.\n(This is a lie.)',
      'SHORTCUT: Fall into the gap for a secret area.\n(There is no secret area.)',
      'The boiler is fine at 95%.\n(The boiler is NOT fine at 95%.)',
    ];
    text = misleading[state.trustMemory.signTrust % misleading.length];
    showDialogue(state, 'FACTORY SIGN (REVISED)', text + '\n\n[The factory has noticed you trust signs.]');
  } else {
    showDialogue(state, 'FACTORY SIGN', text);
  }

  checkTrustConsequences(state);
}

// ── Upgrade purchase ──
function purchaseUpgrade(state, upgrade) {
  if (state.gearsCollected < upgrade.cost) {
    sfxDeny();
    showDialogue(state, 'INSUFFICIENT GEARS', `${upgrade.name} costs ${upgrade.cost} gears.\nYou have ${state.gearsCollected}.\n\nPlease collect more gears and return.\nGears are non-refundable.`);
    return;
  }

  state.gearsCollected -= upgrade.cost;
  upgrade.purchased = true;
  state.trustMemory.upgradeTrust++;
  sfxActivate();

  if (upgrade.id === 'turbo_boots') {
    state.player.hasTurboBoots = true;
    showDialogue(state, 'UPGRADE ACQUIRED', 'TURBO BOOTS installed!\n\n+80% movement speed\n-50% stopping precision\n\nThe factory is not responsible for\nany collisions resulting from excessive speed.\n\nENJOY.');
  } else if (upgrade.id === 'golden_gear') {
    state.player.hasGoldenGear = true;
    state.pressure += 15;
    state.shortcutOpen = true;
    showDialogue(state, 'UPGRADE ACQUIRED', 'GOLDEN GEAR obtained!\n\nEngine Room shortcut unlocked.\n\n⚠ Side effect: +15% pressure\n(as clearly stated in the fine print\nthat was too fine to print)');
  }

  checkTrustConsequences(state);
}

// ── Trust consequences ──
function checkTrustConsequences(state) {
  const total = state.trustMemory.signTrust + state.trustMemory.upgradeTrust + state.trustMemory.gaugeTrust;

  if (total === TRUST_THRESHOLD * 2 && !state._trustWarning1) {
    state._trustWarning1 = true;
    showSupervisor(state, 'The factory has noticed your behavioral patterns. Adjustments pending.', 240);
  }

  if (total === TRUST_THRESHOLD * 3 && !state._trustWarning2) {
    state._trustWarning2 = true;
    showSupervisor(state, 'Trust Level: ELEVATED. The factory is "helping" you now.', 240);
    // Increase passive pressure rate slightly
    state.pressure += 5;
  }
}

// ── Update objectives ──
function updateObjective(state) {
  if (state.level.engine.activated) {
    state.currentObjective = 'COMPLETE!';
    return;
  }

  if (state.permitsHeld.includes('Engine Permit') && state.generatorActivated) {
    state.currentObjective = '→ Activate the Grand Steam Engine!';
    return;
  }

  if (!state.generatorActivated) {
    if (state.permitsHeld.includes('Generator Permit')) {
      state.currentObjective = '→ Activate the Generator (needs permit ✓)';
    } else {
      state.currentObjective = 'Find the Generator Permit. Collect gears along the way.';
    }
    return;
  }

  if (!state.permitsHeld.includes('Engine Permit')) {
    state.currentObjective = 'Find the Engine Permit to activate the Grand Steam Engine.';
    return;
  }

  state.currentObjective = 'Explore the factory. Manage pressure. Reach the Engine.';
}

// ── Valve cooldown ──
export function updateValveCooldowns(state) {
  for (const v of state.level.valves) {
    if (v.cooldown > 0) v.cooldown--;
  }
}

// ── Particles ──
function updateParticles(state) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    p.r *= 0.99;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function spawnSteamNearVents(state) {
  for (const h of state.level.hazards) {
    if (h.type !== 'steam_vent' || !h.active) continue;
    state.particles.push({
      x: h.x + 20 + (Math.random() - 0.5) * 15,
      y: h.y + 5,
      vx: (Math.random() - 0.5) * 1,
      vy: -Math.random() * 2 - 0.5,
      r: Math.random() * 6 + 2,
      life: 0.7,
    });
  }
}

// ── Helpers ──
function showDialogue(state, title, text) {
  if (state.dialogue) {
    state.dialogueQueue.push({ title, text });
  } else {
    state.dialogue = { title, text };
  }
}

function showSupervisor(state, msg, duration) {
  state.supervisorMsg = msg;
  state.supervisorMsgTimer = duration || 180;
}
