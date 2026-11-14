import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-xl border border-red-800/60 bg-red-950/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-900/50 border border-red-700/60 flex items-center justify-center mx-auto text-red-400">
              <AlertOctagon className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-white">Application Interface Alert</h2>
            <p className="text-xs text-red-200 leading-relaxed">
              An unexpected error occurred in this view. Security monitoring remains active in the background.
            </p>
            <p className="text-[11px] font-mono text-red-300/80 bg-black/40 p-2 rounded truncate">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reload SOC View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

