// frontend/src/components/common/ErrorBoundary.jsx
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
    console.error('Uncaught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#04070D] text-[#F7F7FC]">
          <div className="max-w-xl text-center bg-[#070B14] p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-xl">
            <h2 className="text-2xl font-black mb-2 text-[#FF6B8A] font-serif">Something went wrong</h2>
            <p className="text-[#CBD5E1]/80 mb-6 font-light">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            
            <details className="text-left text-xs text-[#CBD5E1]/60 bg-[#0A111E] p-4 rounded-2xl overflow-auto max-h-48 mb-6 border border-white/5">
              <summary className="cursor-pointer font-bold mb-2 hover:text-[#00F2FE] transition">View Technical Details</summary>
              <pre className="whitespace-pre-wrap font-mono">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.info && this.state.info.componentStack}
              </pre>
            </details>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white font-bold hover:opacity-90 transition shadow-lg shadow-blue-900/30 border border-white/10"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-6 py-2.5 rounded-2xl border border-white/10 text-[#CBD5E1] hover:bg-white/5 transition"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
