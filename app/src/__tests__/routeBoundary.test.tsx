import React from 'react';
import { render, screen } from '@testing-library/react';
import RouteBoundary from '../components/RouteBoundary';

function Boom(): JSX.Element {
  // Throw during render to trigger error boundary
  throw new Error('boom');
}

describe('RouteBoundary', () => {
  it('renders fallback UI when child throws', () => {
    render(
      <RouteBoundary>
        <Boom />
      </RouteBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
  });
});
