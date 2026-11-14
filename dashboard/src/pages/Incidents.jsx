import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { useAppData } from "../hooks/useAppData.js";

function ago(value) {
  if (!value) return "Unknown time";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return "Unknown time";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export function Incidents() {
  const navigate = useNavigate();
  const { incidents, incidentsError, searchQuery, loadingEvents } = useAppData();
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => incidents.filter((incident) => {
    const severity = incident.severity || "low";
    if (filter !== "all" && severity !== filter) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || [incident.ip, incident.token_label, incident.geo?.city, incident.geo?.country,
      ...(incident.flags || [])].some((value) => String(value || "").toLowerCase().includes(query));
  }), [incidents, filter, searchQuery]);

  return (
    <div className="p-6 sm:p-8 space-y-4 max-w-7xl mx-auto">
      <SpotlightCard className="bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1b263b]">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-white tracking-wide">CORRELATED INCIDENTS</h2>
            <span className="text-xs font-mono-tech text-[#64748b]">{rows.length} shown</span>
          </div>
          <div className="inline-flex items-center bg-[#0d1320] border border-[#1e2a40] rounded-full p-1 text-xs font-mono-tech">
            {["all", "high", "medium", "low"].map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)}
                className={`px-4 py-1 rounded-full capitalize ${filter === item ? "bg-[#2563eb] text-white font-bold" : "text-[#8FA0BD] hover:text-white"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {incidentsError && <p role="alert" className="mb-3 text-xs text-rose-400">{incidentsError}</p>}
          <table className="w-full text-left text-xs font-mono-tech border-collapse">
            <thead><tr className="border-b border-[#1b263b] text-[#606d85] uppercase text-[11px]">
              <th className="py-3 px-3">IP / LOCATION</th><th className="py-3 px-4">TOKEN</th>
              <th className="py-3 px-4">ACTIVITY</th><th className="py-3 px-4">RISK</th><th className="py-3 px-4 text-right">LAST SEEN</th>
            </tr></thead>
            <tbody className="divide-y divide-[#172033]">
              {rows.map((incident) => {
                const Icon = incident.score >= 70 ? AlertTriangle : incident.score >= 50 ? AlertCircle : ShieldCheck;
                return <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)} className="hover:bg-[#141f33]/80 cursor-pointer">
                  <td className="py-3.5 px-3"><div className="flex gap-3 items-center"><Icon className="w-4 h-4 text-amber-400"/><div><strong className="text-white">{incident.ip}</strong><div className="text-[#8FA0BD]">{incident.geo?.city ? `${incident.geo.city}, ` : ""}{incident.geo?.country || "Unknown origin"}</div></div></div></td>
                  <td className="py-3.5 px-4 text-emerald-300">{incident.token_label || incident.token_id || "Honeytoken"}</td>
                  <td className="py-3.5 px-4 text-[#8FA0BD]">{incident.event_count || incident.events?.length || 0} events</td>
                  <td className="py-3.5 px-4"><strong className={incident.score >= 70 ? "text-rose-400" : incident.score >= 50 ? "text-amber-300" : "text-cyan-300"}>{incident.severity || "low"} · {incident.score ?? 0}</strong></td>
                  <td className="py-3.5 px-4 text-right text-[#8FA0BD]">{ago(incident.last_seen)}</td>
                </tr>;
              })}
              {!loadingEvents && rows.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-[#8FA0BD]">No correlated incidents recorded.</td></tr>}
              {loadingEvents && <tr><td colSpan={5} className="py-12 text-center text-[#8FA0BD]">Loading incidents…</td></tr>}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
