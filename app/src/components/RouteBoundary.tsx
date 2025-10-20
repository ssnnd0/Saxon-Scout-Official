import React from 'react';

interface RouteBoundaryProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

interface RouteBoundaryState {
  hasError: boolean;
  error?: any;
}

export default class RouteBoundary extends React.Component<RouteBoundaryProps, RouteBoundaryState> {
  constructor(props: RouteBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): RouteBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('RouteBoundary caught error', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="saxon-hero">
          <div className="flex items-center justify-center min-h-screen">
            <div className="saxon-card max-w-xl w-full">
              <div className="saxon-card-header">
                <h3>Something went wrong</h3>
              </div>
              <div className="saxon-card-body">
                <p className="text-saxon-gold-dark">An unexpected error occurred while rendering this page.</p>
                <button className="saxon-btn mt-4" onClick={this.handleRetry}>Try Again</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
