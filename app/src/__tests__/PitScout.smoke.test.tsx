import React from 'react';
import { render, screen } from '@testing-library/react';
import PitScout from '../views/PitScout';

describe('PitScout view (smoke)', () => {
  it('renders Pit Scouting title', () => {
    render(<PitScout root={null} scouter="tester" navigateHome={() => {}} />);
    expect(screen.getByText(/Pit Scouting/i)).toBeInTheDocument();
  });
});
