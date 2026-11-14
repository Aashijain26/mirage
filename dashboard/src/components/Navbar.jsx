import React from "react";
import { Menu, Zap, Play, Pause, Bell } from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Navbar({ title = "Overview", subtitle = "SOC Threat Intelligence & Decoy Monitoring", onMenuClick = () => {} }) {
  const {
    connectionStatus,
    isMockMode,
    simulateAttack,
    isPaused,
    togglePause
  } = useAppData();

  return (
    <header className="h-16 px-4 md:px-8 border-b border-[#1F2B47] bg-[#0B1220]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar navigation"
          className="p-2 rounded-lg text-[#8FA0BD] hover:text-white hover:bg-[#16213A] md:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-bold text-[#E6EDF7] tracking-tight">
            {title}
          </h1>
          <span className="hidden sm:inline text-xs text-[#8FA0BD] truncate max-w-xs md:max-w-md">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Controls & Status */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Pause/Resume Live Stream */}
        <button
          type="button"
          onClick={togglePause}
          title={isPaused ? "Resume live event updates" : "Pause live stream to inspect"}
          aria-label={isPaused ? "Resume live stream" : "Pause live stream"}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isPaused
              ? "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50"
              : "bg-[#16213A] text-[#8FA0BD] border-[#1F2B47] hover:text-[#E6EDF7] hover:border-[#2a3a5e]"
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Paused</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live Stream</span>
            </>
          )}
        </button>

        {/* Simulate Attack Button - VISIBLE ONLY IN MOCK MODE */}
        {isMockMode && (
          <button
            type="button"
            onClick={simulateAttack}
            title="Inject an immediate high-severity Tor burst attack"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 border border-red-500 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span className="hidden xs:inline">Simulate Attack</span>
            <span className="xs:hidden">Simulate</span>
          </button>
        )}

        {/* Connection Status Pill */}
        <ConnectionStatus status={connectionStatus} />
      </div>
    </header>
  );
}

export default Navbar;

