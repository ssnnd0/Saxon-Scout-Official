// Design tokens for JS/TS usage (CSS variables remain the source of truth for styling)
// Use these in calculations, animations, and component logic where CSS vars are not convenient.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
} as const;

export const duration = {
  fast: 150,
  base: 200,
  slow: 300,
} as const;

export const zIndex = {
  base: 1,
  nav: 10,
  overlay: 40,
  modal: 50,
  toast: 60,
} as const;

export type ThemeName =
  | 'light'
  | 'dark'
  | 'emerald'
  | 'crimson'
  | 'amethyst'
  | 'amber'
  | 'high-contrast';

export const themes: ThemeName[] = [
  'light',
  'dark',
  'emerald',
  'crimson',
  'amethyst',
  'amber',
  'high-contrast',
];
