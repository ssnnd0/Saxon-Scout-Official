export const APP_VERSION = "2026.SAXON.3";

export const KEYBINDS = {
  SCORE_FUEL: '1',
  DROP_FUEL: '`',
  PICK_GROUND: 'w',
  PICK_OUTPOST: 'e',
  PICK_DEPOT: 'r', // Auto only usually
};

export const ZONES = [
  // Blue Alliance (Zones on Left)
  // Adjusted height to fit 100% viewbox (0-100) with margins
  { id: 'blue-1', label: 'Blue Left', x: 10, y: 4, w: 25, h: 28, color: 'blue' },
  { id: 'blue-2', label: 'Blue Center', x: 10, y: 36, w: 25, h: 28, color: 'blue' },
  { id: 'blue-3', label: 'Blue Right', x: 10, y: 68, w: 25, h: 28, color: 'blue' },
  
  // Red Alliance (Zones on Right)
  { id: 'red-1', label: 'Red Left', x: 65, y: 4, w: 25, h: 28, color: 'red' },
  { id: 'red-2', label: 'Red Center', x: 65, y: 36, w: 25, h: 28, color: 'red' },
  { id: 'red-3', label: 'Red Right', x: 65, y: 68, w: 25, h: 28, color: 'red' },
];