import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Search, Zap, AlertTriangle, X } from "lucide-react";
import { useAppData } from "../hooks/useAppData.js";

const TABS = [
  { to: "/", label: "Overview", exact: true },
  { to: "/incidents", label: "Incidents" },
  { to: "/tokens", label: "Tokens" },
  { to: "/decoys", label: "Decoys" }
];

export function TopHeader() {
  const location = useLocation();
  const { simulateAttack, searchQuery, setSearchQuery, isMockMode } = useAppData();
  const [toast, setToast] = useState(null);

  let breadcrumb = "MIRAGE / OVERVIEW";
  let title = "OVERVIEW";
  let searchPlaceholder = "Search incidents";

  if (location.pathname.startsWith("/incidents") || location.pathname.startsWith("/feed")) {
    breadcrumb = "MIRAGE / INCIDENTS";
    title = "INCIDENTS";
    searchPlaceholder = "Search IP, token, city";
  } else if (location.pathname.startsWith("/tokens")) {
    breadcrumb = "MIRAGE / TOKENS";
    title = "TOKENS";
    searchPlaceholder = "Filter tokens";
  } else if (location.pathname.startsWith("/decoys")) {
    breadcrumb = "MIRAGE / DECOYS";
    title = "DECOYS";
    searchPlaceholder = "Search incidents";
  }

  const handleSimulate = () => {
    const ev = simulateAttack();
    if (ev) {
      setToast({
        ip: ev.ip,
        token: ev.token_label,
        score: ev.score
      });
      setTimeout(() => {
        setToast(null);
      }, 4500);
    }
  };

  return (
    <div className="relative pt-6 pb-4 px-6 sm:px-8 border-b border-[#1a2336]/60 overflow-hidden">
      {/* Olive-gold atmospheric glow behind header */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none top-glow-gradient" />

      {/* Simulated Attack Notification Toast Banner */}
      {toast && (
        <div className="relative z-30 mb-3 bg-red-950/90 border border-red-600/70 text-white rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-bounce backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-xs font-mono-tech">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong className="text-rose-300">ATTACK SIMULATED:</strong> High-severity Tor burst from{" "}
              <code className="text-white font-bold">{toast.ip}</code> probe on{" "}
              <code className="text-emerald-400">{toast.token}</code> (Risk score: {toast.score})
            </span>
          </div>
          {isMockMode && <button
            type="button"
            onClick={() => setToast(null)}
            className="text-rose-300 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="relative z-10 flex items-center gap-2 text-[11px] font-mono-tech text-[#99a67a] tracking-[0.2em] uppercase mb-1">
        <span>{breadcrumb}</span>
      </div>

      {/* Main Title */}
      <h1 className="relative z-10 text-4xl sm:text-5xl font-black font-heading text-white tracking-wider mb-5">
        {title}
      </h1>

      {/* Subnav & Actions Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Segmented Control Pill Bar */}
        <div className="inline-flex items-center bg-[#111726]/90 border border-[#1e2a40] rounded-full p-1 backdrop-blur-md shadow-lg">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.exact}
              className={({ isActive }) =>
                `px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 select-none ${
                  isActive
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-[#8FA0BD] hover:text-white hover:bg-white/12 hover:ring-1 hover:ring-white/20 font-medium"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right Search & Simulate attack */}
        <div className="flex items-center gap-3">
          {/* Search bar with blue shade accent on focus */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8FA0BD] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-[#111726]/90 border border-[#1e2a40] rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-[#606d85] focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 w-44 sm:w-60 transition-all backdrop-blur-sm shadow-inner"
            />
          </div>

          {/* Simulate Attack button */}
          <button
            type="button"
            onClick={handleSimulate}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
            <span>Simulate attack</span>
          </button>
        </div>
      </div>
    </div>
  );
}
