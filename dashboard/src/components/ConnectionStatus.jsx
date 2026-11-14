import React from "react";
import { Radio, RefreshCw, WifiOff, Database } from "lucide-react";

export function ConnectionStatus({ status = "live", className = "" }) {
  const norm = String(status).toLowerCase();

  if (norm === "mock") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 ${className}`}
        title="Running on realistic local fixtures & simulator (no backend required)"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="font-semibold">Mock Mode</span>
      </div>
    );
  }

  if (norm === "live") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 ${className}`}
        title="WebSocket connected. Receiving real-time hits."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold">Live</span>
      </div>
    );
  }

  if (norm === "reconnecting") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/50 text-amber-300 border border-amber-800/60 ${className}`}
        title="WebSocket disconnected. Retrying with exponential backoff & polling REST."
      >
        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
        <span className="font-semibold">Reconnecting</span>
      </div>
    );
  }

  // Offline
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-950/50 text-red-300 border border-red-800/60 ${className}`}
      title="Backend server unreachable."
    >
      <span className="w-2 h-2 rounded-full bg-red-500" />
      <span className="font-semibold">Offline</span>
    </div>
  );
}

export default ConnectionStatus;

