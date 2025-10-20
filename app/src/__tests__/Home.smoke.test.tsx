import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../views/Home';

describe('Home view (smoke)', () => {
  it('renders hero title', () => {
    render(
      <MemoryRouter>
        <Home navigate={() => { /* no-op */ }} />
      </MemoryRouter>
    );

    expect(screen.getByText(/SAXON SCOUT/i)).toBeInTheDocument();
  });
});
