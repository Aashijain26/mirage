import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorBanner({
  title = "Connection Error",
  message = "Unable to fetch data from the server.",
  onRetry = null
}) {
  return (
    <div
      role="alert"
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-800/60 bg-red-950/40 text-red-200 my-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-red-100">{title}</h4>
          <p className="text-xs text-red-300 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/60 hover:bg-red-800/80 text-white border border-red-700/60 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;

