import React from 'react';
import { render } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

function setupMatchMedia(initialDark = true) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  // @ts-ignore
  window.matchMedia = (query: string) => {
    return {
      matches: initialDark,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
      addListener: (cb: any) => listeners.add(cb),
      removeListener: (cb: any) => listeners.delete(cb),
      dispatch: (matches: boolean) => {
        // naive dispatch helper
        listeners.forEach(cb => cb({ matches } as MediaQueryListEvent));
      }
    } as any;
  };
  return {
    setDark(next: boolean) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)') as any;
      mql.matches = next;
      mql.dispatch(next);
    }
  };
}

function ThemeSetter() {
  const { update } = useSettings();
  React.useEffect(() => {
    update('theme', 'auto');
  }, [update]);
  return null;
}

describe('SettingsContext auto theme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies dark when system prefers dark and toggles on change', () => {
    const media = setupMatchMedia(true);
    render(
      <SettingsProvider>
        <ThemeSetter />
      </SettingsProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    media.setDark(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe(null);

    media.setDark(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
