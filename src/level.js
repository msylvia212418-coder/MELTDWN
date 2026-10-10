// ── Level definition ──
// One complete factory level with all interactables, platforms, hazards, etc.
import { TILE, COLORS } from './constants.js';

// Level dimensions (in pixels)
export const LEVEL_W = TILE * 80;   // 3200px wide
export const LEVEL_H = TILE * 18;   // 720px tall

/**
 * Build the full level.
 * Returns { platforms, gears, permits, machines, valves, signs, upgrades, hazards, checkpoints, engine }
 */
export function buildLevel() {
  const platforms = [];
  const gears = [];
  const permits = [];
  const machines = [];
  const valves = [];
  const signs = [];
  const upgrades = [];
  const hazards = [];
  const checkpoints = [];

  // ═══ FLOOR ═══
  // Main ground with some gaps
  addFloor(platforms, 0, 15, 0, 20);       // Section 1: tiles 0–19
  // Gap at tile 20-21
  addFloor(platforms, 0, 15, 22, 36);      // Section 2: tiles 22–35
  // Gap at tile 36-37
  addFloor(platforms, 0, 15, 38, 80);      // Section 3: tiles 38–79 (long run to engine)

  // ═══ PLATFORMS ═══
  // Section 1: Entry area
  addPlatform(platforms, 3, 12, 5);    // low plat
  addPlatform(platforms, 8, 10, 4);    // mid plat
  addPlatform(platforms, 14, 11, 4);   // right plat
  
  // Section 2: Permit zone
  addPlatform(platforms, 24, 12, 5);
  addPlatform(platforms, 26, 9, 4);
  addPlatform(platforms, 31, 11, 5);

  // Section 3: Machine zone
  addPlatform(platforms, 40, 12, 4);
  addPlatform(platforms, 42, 9, 3);
  addPlatform(platforms, 46, 11, 5);
  addPlatform(platforms, 48, 8, 3);
  addPlatform(platforms, 53, 12, 4);
  addPlatform(platforms, 55, 10, 3);

  // Section 4: Pressure zone
  addPlatform(platforms, 60, 12, 5);
  addPlatform(platforms, 63, 9, 4);
  addPlatform(platforms, 67, 11, 4);

  // Section 5: Engine approach
  addPlatform(platforms, 72, 12, 3);
  addPlatform(platforms, 74, 9, 3);

  // ═══ WALLS / CEILINGS ═══
  // Ceiling segments
  addWall(platforms, 0, 0, 80, 1);   // top ceiling

  // Vertical walls (decorative upper sections — leave walkable gap at bottom)
  addVertWall(platforms, 20, 1, 7);   // upper wall, section 1-2 divider
  addVertWall(platforms, 37, 1, 6);   // upper wall, section 2-3 divider
  addVertWall(platforms, 57, 1, 5);   // partial upper wall

  // ═══ GEARS (collectible) ═══
  // 8 gears total, scattered throughout
  gears.push(
    makeGear(5 * TILE, 11 * TILE),
    makeGear(10 * TILE, 9 * TILE),
    makeGear(15 * TILE, 10 * TILE),
    makeGear(25 * TILE, 11 * TILE),
    makeGear(33 * TILE, 10 * TILE),
    makeGear(44 * TILE, 8 * TILE),
    makeGear(56 * TILE, 9 * TILE),
    makeGear(64 * TILE, 8 * TILE),
  );

  // ═══ PERMITS (collectible documents) ═══
  permits.push(
    makePermit(28 * TILE, 8 * TILE, 'Generator Permit', 'FORM 12-A: Authorization to Operate Electrical Generation Equipment'),
    makePermit(48 * TILE + 10, 7 * TILE, 'Valve Permit', 'FORM 23-C: Steam Pressure Relief Authorization'),
    makePermit(68 * TILE, 10 * TILE, 'Engine Permit', 'FORM 47-B: Grand Steam Engine Ignition Clearance'),
  );

  // ═══ MACHINES (interactable) ═══
  machines.push(
    makeMachine(18 * TILE, 13 * TILE, 'generator', 'Generator', 'Generator Permit', 
      'Activate the Generator to power the factory.', 'The generator hums to life!\n...The conveyor belt has started.'),
    makeMachine(45 * TILE, 13 * TILE, 'boiler_pump', 'Boiler Pump', null,
      'Pump coolant into the boiler system.', 'Coolant flowing!\n...Pressure increased slightly from the pump vibrations.'),
    makeMachine(53 * TILE, 13 * TILE, 'crane', 'Steam Crane', null,
      'Operate the crane to clear the path.', 'Path cleared!\n...A safety inspection has been triggered.'),
    makeMachine(75 * TILE, 13 * TILE, 'engine', 'Grand Steam Engine', 'Engine Permit',
      'Activate the Grand Steam Engine to win!', null),
  );

  // ═══ VALVES ═══
  valves.push(
    makeValve(34 * TILE, 14 * TILE, 'Valve Permit'),
    makeValve(61 * TILE, 14 * TILE, null),          // free valve (no permit needed)
    makeValve(70 * TILE, 14 * TILE, 'Valve Permit'),
  );

  // ═══ SIGNS ═══
  signs.push(
    makeSign(2 * TILE, 13 * TILE, '→ GENERATOR THIS WAY →\nCollect gears. Obtain permits.\nDo NOT touch the boiler.', 'helpful'),
    makeSign(23 * TILE, 13 * TILE, 'PERMIT OFFICE\n↑ Forms available above ↑\nProcessing time: 0 seconds*\n*Results may vary', 'helpful'),
    makeSign(39 * TILE, 13 * TILE, 'MACHINE ZONE\nAll equipment operational.\nSafety record: 3 days\nPrevious record: 4 days', 'helpful'),
    makeSign(58 * TILE, 13 * TILE, '← VALVE ROOM ←\nReduce pressure here.\n(Permit may be required)', 'helpful'),
    makeSign(71 * TILE, 13 * TILE, 'GRAND ENGINE ROOM →\nAlmost there!\n(Probably)', 'helpful'),
  );

  // ═══ UPGRADES ═══
  upgrades.push(
    makeUpgrade(12 * TILE, 10 * TILE, 'turbo_boots', 'Turbo Boots',
      '+80% speed, -50% stopping precision\nCost: 3 gears', 3),
    makeUpgrade(50 * TILE, 7 * TILE, 'golden_gear', 'Golden Gear',
      'Unlocks Engine Room shortcut\nCost: 4 gears\nSide effect: +15 pressure', 4),
  );

  // ═══ HAZARDS ═══
  // (gaps are just missing floor tiles — falling is handled by out-of-bounds check)

  // Steam vents (toggle on/off)
  hazards.push(
    makeSteamVent(43 * TILE, 12 * TILE),
    makeSteamVent(52 * TILE, 12 * TILE),
    makeSteamVent(66 * TILE, 12 * TILE),
  );

  // Conveyor belt (activated by generator)
  hazards.push(
    makeConveyor(40 * TILE, 15 * TILE - 4, 6 * TILE, 'right', false),
  );

  // ═══ CHECKPOINTS ═══
  checkpoints.push(
    makeCheckpoint(22 * TILE, 14 * TILE),
    makeCheckpoint(45 * TILE, 14 * TILE),
    makeCheckpoint(65 * TILE, 14 * TILE),
  );

  // ═══ SHORTCUT PLATFORMS (Unlocked by Golden Gear) ═══
  const shortcutPlatforms = [];
  addPlatform(shortcutPlatforms, 51, 6, 4);
  addPlatform(shortcutPlatforms, 57, 5, 5);
  addPlatform(shortcutPlatforms, 64, 5, 5);
  addPlatform(shortcutPlatforms, 71, 6, 4);

  // ═══ ENGINE (final goal) ═══
  const engine = {
    x: 76 * TILE, y: 9 * TILE,
    w: TILE * 3, h: TILE * 6,
    activated: false,
  };

  return { platforms, shortcutPlatforms, gears, permits, machines, valves, signs, upgrades, hazards, checkpoints, engine };
}

// ── Helper builders ──

function addFloor(arr, _unused, row, startCol, endCol) {
  for (let c = startCol; c < endCol; c++) {
    arr.push({ x: c * TILE, y: row * TILE, w: TILE, h: TILE * 3 });
  }
}

function addPlatform(arr, col, row, widthTiles) {
  arr.push({ x: col * TILE, y: row * TILE, w: widthTiles * TILE, h: TILE / 2 });
}

function addWall(arr, col, row, widthTiles, heightTiles) {
  arr.push({ x: col * TILE, y: row * TILE, w: widthTiles * TILE, h: heightTiles * TILE });
}

function addVertWall(arr, col, startRow, heightTiles) {
  arr.push({ x: col * TILE, y: startRow * TILE, w: TILE / 2, h: heightTiles * TILE });
}

function makeGear(x, y) {
  return { x, y, w: 20, h: 20, collected: false, bobOffset: Math.random() * Math.PI * 2 };
}

function makePermit(x, y, name, description) {
  return { x, y, w: 26, h: 30, name, description, collected: false, bobOffset: Math.random() * Math.PI * 2 };
}

function makeMachine(x, y, id, name, requiredPermit, promptText, activateText) {
  return {
    x, y, w: TILE * 2, h: TILE * 2, id, name, requiredPermit, promptText, activateText,
    activated: false, interactBox: { x: x - 10, y: y - 10, w: TILE * 2 + 20, h: TILE * 2 + 20 },
  };
}

function makeValve(x, y, requiredPermit) {
  return {
    x, y, w: TILE, h: TILE, requiredPermit,
    interactBox: { x: x - 10, y: y - 10, w: TILE + 20, h: TILE + 20 },
    cooldown: 0,
  };
}

function makeSign(x, y, text, type) {
  return {
    x, y, w: TILE, h: TILE * 1.2,
    text, type,
    interactBox: { x: x - 15, y: y - 15, w: TILE + 30, h: TILE * 1.2 + 30 },
    readCount: 0,
  };
}

function makeUpgrade(x, y, id, name, description, cost) {
  return {
    x, y, w: 30, h: 30, id, name, description, cost,
    purchased: false, bobOffset: Math.random() * Math.PI * 2,
    interactBox: { x: x - 10, y: y - 10, w: 50, h: 50 },
  };
}

function makeHazard(x, y, w, h, type) {
  return { x, y, w, h, type, active: true };
}

function makeSteamVent(x, y) {
  return {
    x, y, w: TILE, h: TILE * 3,
    type: 'steam_vent',
    active: true,
    timer: Math.random() * 120,
    onDuration: 90,
    offDuration: 70,
  };
}

function makeConveyor(x, y, w, dir, active) {
  return {
    x, y, w, h: 4,
    type: 'conveyor',
    dir,
    active,
    speed: 2.5,
  };
}

function makeCheckpoint(x, y) {
  return { x, y, w: TILE, h: TILE, activated: false };
}
