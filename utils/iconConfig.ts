/**
 * Icon Configuration and Management
 * Centralizes all icon references for the application
 */

export const ICON_SIZES = {
  XS: 16,
  SM: 24,
  MD: 32,
  LG: 48,
  XL: 64,
  XXL: 128,
  MEGA: 192,
  ULTRA: 512,
} as const;

export const APP_ICONS = {
  // PWA Icons
  pwa: {
    small: '/icons/android/android-launchericon-192-192.png',
    large: '/icons/android/android-launchericon-512-512.png',
  },
  
  // Logo Variants
  logo: {
    light: '/icons/Logo+611+White+Name.webp',
    dark: '/icons/Logo+611+Black+Name.webp',
    square: '/icons/android/android-launchericon-192-192.png',
    whiteIcon: '/icons/Logo+611+White+Name.webp',
  },
  
  // Apple Icons
  apple: {
    180: '/icons/ios/180.png',
    152: '/icons/ios/152.png',
    144: '/icons/ios/144.png',
    120: '/icons/ios/120.png',
  },
  
  // Android Icons
  android: {
    48: '/icons/android/android-launchericon-48-48.png',
    72: '/icons/android/android-launchericon-72-72.png',
    96: '/icons/android/android-launchericon-96-96.png',
    144: '/icons/android/android-launchericon-144-144.png',
    192: '/icons/android/android-launchericon-192-192.png',
    512: '/icons/android/android-launchericon-512-512.png',
  },
  
  // Windows Icons
  windows: {
    tile: '/icons/windows11/Square150x150Logo.scale-100.png',
    favicon32: '/icons/windows11/Square44x44Logo.targetsize-32.png',
    favicon16: '/icons/windows11/Square44x44Logo.targetsize-16.png',
  },
  
  // Favicon
  favicon: '/icons/windows11/Square44x44Logo.targetsize-32.png',
} as const;

export const BRAND_INFO = {
  name: 'SaxonScout',
  teamName: 'Team 611 Scouting',
  team: 'Langley Saxons',
  teamNumber: 611,
  description: 'Advanced scouting application for FIRST Robotics Competition',
  colors: {
    primary: '#A8C66C', // Matcha
    secondary: '#D4AF37', // Gold
    dark: '#000000', // Obsidian
    light: '#FFFFFF',
  },
  githubRepo: 'ssnnd0/saxon-scout',
  version: '2026.3.0',
  year: new Date().getFullYear(),
} as const;

/**
 * Get icon path by type and size
 */
export function getIconPath(type: 'pwa' | 'logo' | 'apple' | 'android' | 'windows' | 'favicon', size?: string | number): string {
  const icons = APP_ICONS[type] as Record<string | number, string>;
  if (!icons) return APP_ICONS.favicon;
  
  if (size && size in icons) {
    return icons[size];
  }
  
  // Return first available if size not found
  return Object.values(icons)[0] || APP_ICONS.favicon;
}

/**
 * Generate manifest-compatible icon object
 */
export function generateManifestIcon(path: string, purpose: 'any' | 'maskable' | 'any maskable' = 'any') {
  return {
    src: path,
    sizes: 'any',
    type: 'image/png',
    purpose,
  };
}

/**
 * Get responsive icon for current theme
 */
export function getThemedIcon(isDark: boolean): string {
  return isDark ? APP_ICONS.logo.light : APP_ICONS.logo.dark;
}
