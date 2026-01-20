export const APP_VERSION = "2026.SAXON.3";

export const KEYBINDS = {
  SCORE_FUEL: '1',
  DROP_FUEL: '`',
  PICK_GROUND: 'w',
  PICK_OUTPOST: 'e',
  PICK_DEPOT: 'r', // Auto only usually
};

export const ZONES = [
  // Blue Alliance (Zones on Left - 0 to 50 range in viewbox)
  // Width increased to 30 for easier tapping
  { id: 'blue-1', label: 'Blue Left', x: 8, y: 4, w: 30, h: 28, color: 'blue' },
  { id: 'blue-2', label: 'Blue Center', x: 8, y: 36, w: 30, h: 28, color: 'blue' },
  { id: 'blue-3', label: 'Blue Right', x: 8, y: 68, w: 30, h: 28, color: 'blue' },
  
  // Red Alliance (Zones on Right - 50 to 100 range in viewbox)
  // X adjusted to fit new width of 30 within right side
  { id: 'red-1', label: 'Red Left', x: 62, y: 4, w: 30, h: 28, color: 'red' },
  { id: 'red-2', label: 'Red Center', x: 62, y: 36, w: 30, h: 28, color: 'red' },
  { id: 'red-3', label: 'Red Right', x: 62, y: 68, w: 30, h: 28, color: 'red' },
];