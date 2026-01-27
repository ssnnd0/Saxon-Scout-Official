import React, { ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Log to analytics/monitoring service in production
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('saxon_error_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
      localStorage.setItem('saxon_error_logs', JSON.stringify(logs.slice(-50))); // Keep last 50
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-obsidian p-6">
          <div className="max-w-md bg-obsidian-light rounded-2xl p-8 border border-red-500/30 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={32} />
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            </div>
            
            <p className="text-slate-300 text-sm mb-6">
              An unexpected error occurred. Your data is safe. Try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto">
                <p className="text-red-400 text-xs font-mono whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 bg-matcha hover:bg-matcha-dark text-obsidian rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
