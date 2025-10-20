import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickScout from '../views/QuickScout';

describe('QuickScout view (smoke)', () => {
  it('renders Saxon Scout title', () => {
    render(<QuickScout root={null} scouter="tester" />);
    expect(screen.getByText(/Saxon Scout/i)).toBeInTheDocument();
  });
});
