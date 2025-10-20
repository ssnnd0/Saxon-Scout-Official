import React from 'react';
import { render, screen } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

describe('navCollapsedByDefault setting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads navCollapsedByDefault from localStorage on load', () => {
    localStorage.setItem(
      'saxon-scout-settings',
      JSON.stringify({ navCollapsedByDefault: true })
    );

    function Probe() {
      const { settings } = useSettings();
      return <div data-testid="collapsed">{settings.navCollapsedByDefault ? 'yes' : 'no'}</div>;
    }

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>
    );

    expect(screen.getByTestId('collapsed').textContent).toBe('yes');
  });
});
