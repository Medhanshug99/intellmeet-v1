import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6">
          <div className="max-w-md w-full bg-white border border-stone-200 shadow-sm rounded-lg p-8 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-stone-500 mb-6">
              An unexpected error occurred in the application interface.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800 transition-colors py-2.5 rounded-md font-medium text-sm shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <div className="mt-8 text-left w-full overflow-x-auto bg-stone-100 p-4 rounded-md border border-stone-200">
                <p className="text-xs font-mono text-stone-800 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
