import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Siren, Key, Fish, LogOut } from "lucide-react";
import { MirageLogo } from "./MirageLogo.jsx";
import { clearAuthToken } from "../utils/auth.js";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/incidents", label: "Incidents", icon: Siren },
  { to: "/tokens", label: "Tokens", icon: Key },
  { to: "/decoys", label: "Decoys", icon: Fish }
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  return (
    <aside className="w-16 bg-[#0b0f17] border-r border-[#1a2336] flex flex-col items-center justify-between py-5 select-none shrink-0 z-40">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink to="/" title="Mirage Home" className="relative group">
          <div className="absolute -inset-1.5 rounded-full bg-white/0 group-hover:bg-white/10 transition-all duration-300 blur-xs" />
          <MirageLogo className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" />
        </NavLink>

        {/* Navigation Rail */}
        <nav className="flex flex-col items-center gap-3 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                title={item.label}
                className={({ isActive }) =>
                  `w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-[#22c55e] text-black shadow-lg shadow-emerald-500/25 font-bold scale-105"
                      : "text-[#8FA0BD] hover:text-white hover:bg-white/12 hover:ring-1 hover:ring-white/25 hover:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                  }`
                }
              >
                <Icon className="w-5 h-5" strokeWidth={2.2} />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Exit */}
      <div className="flex flex-col items-center gap-4">
        {/* User Avatar Circle 'A' */}
        <div
          title="Admin User"
          className="w-8 h-8 rounded-full bg-[#881337] border border-rose-900/60 text-white flex items-center justify-center text-xs font-bold shadow-inner hover:ring-2 hover:ring-white/30 transition-all cursor-pointer"
        >
          A
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="text-[#64748b] hover:text-white p-2 rounded-full hover:bg-white/10 hover:ring-1 hover:ring-white/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
