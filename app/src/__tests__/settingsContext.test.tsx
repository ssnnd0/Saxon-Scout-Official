import React from 'react';
import { render, screen } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

function TestConsumer() {
  const { settings, update } = useSettings();
  return (
    <div>
      <div data-testid="theme">{settings.theme}</div>
      <button onClick={() => update('theme', 'dark')}>toggle</button>
    </div>
  );
}

describe('SettingsContext', () => {
  beforeEach(() => {
    // isolate storage per test
    localStorage.clear();
  });

  it('provides default settings and allows updates', () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    // default theme is light
    expect(screen.getByTestId('theme').textContent).toBe('light');

    // update theme to dark
    screen.getByText('toggle').click();
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    // persisted to localStorage
    const saved = localStorage.getItem('saxon-scout-settings');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved as string);
    expect(parsed.theme).toBe('dark');
  });
});
