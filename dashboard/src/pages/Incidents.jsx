import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Incidents() {
  const navigate = useNavigate();
  const { events, searchQuery } = useAppData();
  const [filter, setFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    let list = events;
    if (filter === "high") {
      list = list.filter((e) => (e.score ?? 0) >= 70);
    } else if (filter === "medium") {
      list = list.filter((e) => (e.score ?? 0) >= 50 && (e.score ?? 0) < 70);
    } else if (filter === "low") {
      list = list.filter((e) => (e.score ?? 0) < 50);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.ip?.toLowerCase().includes(q) ||
          e.token_label?.toLowerCase().includes(q) ||
          e.geo?.city?.toLowerCase().includes(q) ||
          e.geo?.country?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [events, filter, searchQuery]);

  return (
    <div className="p-6 sm:p-8 space-y-4 max-w-7xl mx-auto">
      {/* Sub-header status text */}
      <div className="text-xs text-[#8FA0BD] font-mono-tech">
        <span>4 hits in the last hour. 1 is high severity.</span>
      </div>

      {/* Main Table Card: [06] \\ LOG */}
      <SpotlightCard className="bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 sm:p-6 shadow-xl">
        {/* Card Header & Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1b263b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-tech text-[#8FA0BD]">[06] \\</span>
            <h2 className="font-heading text-lg font-bold text-white tracking-wide">LOG</h2>
            <span className="text-xs font-mono-tech text-[#64748b] ml-1">
              {events.length} incidents
            </span>
          </div>

          {/* Filter Pills with White Translucent Circle on Hover */}
          <div className="inline-flex items-center bg-[#0d1320] border border-[#1e2a40] rounded-full p-1 text-xs font-mono-tech">
            {["all", "high", "medium", "low"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-1 rounded-full capitalize transition-all duration-200 cursor-pointer ${
                  filter === f
                    ? "bg-[#2563eb] text-white font-bold shadow-sm shadow-blue-500/20"
                    : "text-[#8FA0BD] hover:text-white hover:bg-white/10"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech border-collapse">
            <thead>
              <tr className="border-b border-[#1b263b] text-[#606d85] uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 w-16">#</th>
                <th className="py-3 px-4">SOURCE</th>
                <th className="py-3 px-4">TOKEN</th>
                <th className="py-3 px-4">FLAGS</th>
                <th className="py-3 px-4 w-36">SCORE</th>
                <th className="py-3 px-4 text-right w-28">WHEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#172033]">
              {filteredEvents.map((ev, index) => {
                const isHigh = (ev.score ?? 0) >= 70;
                const isMed = (ev.score ?? 0) >= 50 && (ev.score ?? 0) < 70;
                const flags = Array.isArray(ev.flags) ? ev.flags : [];
                const primaryFlags = flags.slice(0, 2);
                const extraCount = flags.length > 2 ? flags.length - 2 : 0;
                const scoreColor = isHigh
                  ? "from-rose-500 to-red-600"
                  : isMed
                  ? "from-amber-400 to-orange-500"
                  : "from-blue-500 to-cyan-400";

                return (
                  <tr
                    key={ev.id || index}
                    onClick={() => navigate(`/incidents/${ev.id}`)}
                    className="hover:bg-[#141f33]/80 hover:shadow-[inset_2px_0_0_#38bdf8] transition-all cursor-pointer group"
                  >
                    {/* # Index */}
                    <td className="py-3.5 px-3 text-[#64748b]">
                      [{String(index + 1).padStart(2, "0")}]
                    </td>

                    {/* SOURCE */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {isHigh ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : isMed ? (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-white text-xs group-hover:text-[#38bdf8] transition-colors">
                            {ev.ip}
                          </div>
                          <div className="text-[11px] text-[#8FA0BD]">
                            {ev.geo?.city
                              ? `${ev.geo.city}, ${ev.geo.country || ""}`
                              : ev.geo?.country || "Unknown origin"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TOKEN */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 bg-teal-950/70 border border-teal-700/50 text-[#34d399] px-2.5 py-1 rounded-full text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                        {ev.token_label || "ansible-vault-test"}
                      </span>
                    </td>

                    {/* FLAGS */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {primaryFlags.map((flag, fIdx) => (
                          <span
                            key={fIdx}
                            className="bg-[#141c2d] border border-[#202d45] text-[#cbd5e1] px-2 py-0.5 rounded-full text-[10px]"
                          >
                            {flag}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="bg-[#141c2d] border border-[#202d45] text-[#8FA0BD] px-1.5 py-0.5 rounded-full text-[10px]">
                            +{extraCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SCORE */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-[#172236] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, ev.score || 40)}%` }}
                            className={`h-full bg-gradient-to-r ${scoreColor} rounded-full`}
                          />
                        </div>
                        <span className="font-bold text-white text-xs">{ev.score || 40}</span>
                      </div>
                    </td>

                    {/* WHEN */}
                    <td className="py-3.5 px-4 text-right text-[#8FA0BD] text-[11px]">
                      {ev.time_ago || "40 min ago"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
