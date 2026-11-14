import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radio, KeyRound, ShieldAlert, X, Shield } from "lucide-react";
import { useAppData } from "../hooks/useAppData.js";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/feed", label: "Live Feed", icon: Radio, showLiveDot: true },
  { to: "/tokens", label: "Tokens", icon: KeyRound },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert, showBadge: true }
];

export function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const { stats } = useAppData();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1220] border-r border-[#1F2B47] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1F2B47]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-[#E6EDF7]">
                Honeytoken
              </span>
              <span className="text-[11px] font-mono text-emerald-400 tracking-wider uppercase">
                Monitor SOC
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="p-1 rounded-md text-[#8FA0BD] hover:text-white md:hidden"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-[#16213A] text-emerald-400 border border-emerald-500/30 font-semibold"
                      : "text-[#8FA0BD] hover:text-[#E6EDF7] hover:bg-[#111A2E]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? "text-emerald-400"
                            : "text-[#8FA0BD] group-hover:text-[#E6EDF7]"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.showLiveDot && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                      {item.showBadge && stats.highSeverityIncidents > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/60">
                          {stats.highSeverityIncidents}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer SOC Status */}
        <div className="p-4 border-t border-[#1F2B47] bg-[#111A2E]/50">
          <div className="flex items-center justify-between text-xs text-[#8FA0BD] mb-1">
            <span>SOC Defense Grid</span>
            <span className="text-emerald-400 font-mono font-semibold">ARMED</span>
          </div>
          <div className="w-full bg-[#16213A] h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full" />
          </div>
          <p className="text-[11px] text-[#8FA0BD] mt-2 font-mono truncate">
            {stats.activeHoneytokens} decoys armed
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

