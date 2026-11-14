import React from "react";
import { Key, ShieldCheck, Crosshair, AlertTriangle, Clock } from "lucide-react";
import { formatRelativeTime } from "../utils/formatters.js";
import { CardSkeleton } from "./Skeleton.jsx";

export function StatsCards({ stats, loading = false, now = Date.now() }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const relativeLastAttack = formatRelativeTime(stats.lastAttackTimestamp, now);

  const cards = [
    {
      label: "Total Honeytokens",
      value: stats.totalHoneytokens,
      subtext: "Configured decoy credentials",
      icon: Key,
      iconColor: "text-blue-400 bg-blue-950/40 border-blue-800/40"
    },
    {
      label: "Active Honeytokens",
      value: stats.activeHoneytokens,
      subtext: "Armed and monitoring traps",
      icon: ShieldCheck,
      iconColor: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
    },
    {
      label: "Total Attacks Detected",
      value: stats.totalAttacks,
      subtext: "Recorded trap interactions",
      icon: Crosshair,
      iconColor: "text-amber-400 bg-amber-950/40 border-amber-800/40"
    },
    {
      label: "High-Severity Incidents",
      value: stats.highSeverityIncidents,
      subtext: "Score >= 60 (Tor, burst, scans)",
      icon: AlertTriangle,
      iconColor: "text-red-400 bg-red-950/40 border-red-800/40",
      highlight: stats.highSeverityIncidents > 0
    },
    {
      label: "Last Attack Activity",
      value: relativeLastAttack,
      subtext: stats.lastAttackTimestamp ? "Most recent trigger" : "No trigger events",
      icon: Clock,
      iconColor: "text-purple-400 bg-purple-950/40 border-purple-800/40",
      isTime: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-5 rounded-xl border bg-[#111A2E] transition-all duration-200 hover:border-[#2a3a5e] ${
              c.highlight
                ? "border-red-900/50 hover:border-red-800/70"
                : "border-[#1F2B47]"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#8FA0BD]">
                {c.label}
              </span>
              <div className={`p-2 rounded-lg border ${c.iconColor}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tracking-tight text-[#E6EDF7] ${
                  c.isTime ? "text-xl font-mono" : "font-mono"
                } ${c.highlight ? "text-red-400" : ""}`}
              >
                {c.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8FA0BD] truncate">{c.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;

