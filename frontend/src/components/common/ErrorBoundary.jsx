// components/ErrorBoundary.jsx
/**
 * Error boundary component for graceful error handling
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="text-red-400" size={48} />
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-slate-400 mb-6">
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
            </p>
            
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-slate-400 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-red-400 bg-slate-900/50 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
