// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // log to console or send to your error tracking
    console.error('Uncaught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-xl text-center">
            <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An unexpected error occurred. Try refreshing the page.</p>
            <details className="text-left text-xs text-gray-500">
              <summary className="cursor-pointer">Technical details</summary>
              <pre className="whitespace-pre-wrap">{String(this.state.error)}</pre>
              <pre className="whitespace-pre-wrap">{String(this.state.info?.componentStack)}</pre>
            </details>
            <div className="mt-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded bg-indigo-600 text-white">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
