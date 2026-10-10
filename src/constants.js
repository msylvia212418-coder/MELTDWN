// ── Color palette ──
export const COLORS = {
  brassGold:    '#C5993E',
  brassLight:   '#D4AF5A',
  brassDark:    '#9A7730',
  copper:       '#B87333',
  copperLight:  '#D4935E',
  copperDark:   '#8B5A2B',
  parchment:    '#F5E6C4',
  cream:        '#FAF0DC',
  teal:         '#1B6B6F',
  tealDark:     '#0D4F52',
  tealLight:    '#2D8F8F',
  charcoal:     '#2C2C2C',
  charcoalMed:  '#3D3D3D',
  charcoalLight:'#555555',
  rustRed:      '#B33A2A',
  rustLight:    '#D44E3C',
  dangerRed:    '#FF3333',
  steam:        'rgba(200,200,200,0.4)',
  bg:           '#1A1A1A',
  bgAlt:        '#222222',
  white:        '#FFFFFF',
  black:        '#000000',
  green:        '#4CAF50',
  yellowWarn:   '#FFD700',
};

// ── Canvas ──
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// ── Physics ──
export const GRAVITY    = 0.55;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 4.2;
export const MAX_FALL   = 14;
export const FRICTION   = 0.82;

// ── Game states ──
export const STATE = {
  MENU:       'menu',
  PLAYING:    'playing',
  PAUSED:     'paused',
  VICTORY:    'victory',
  DEFEAT:     'defeat',
  INSTRUCTIONS: 'instructions',
};

// ── Pressure ──
export const PRESSURE_MAX       = 100;
export const PRESSURE_WARN      = 60;
export const PRESSURE_DANGER    = 80;
export const PRESSURE_RATE      = 0.015;   // per frame passive rise
export const VALVE_REDUCTION    = 20;

// ── Trust thresholds ──
export const TRUST_THRESHOLD = 3;

// ── Tile size ──
export const TILE = 40;
