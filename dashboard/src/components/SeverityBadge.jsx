import React from "react";
import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";

export function SeverityBadge({ severity = "low", className = "" }) {
  const norm = String(severity || "low").toLowerCase();

  if (norm === "high") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-800/60 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>HIGH</span>
      </span>
    );
  }

  if (norm === "medium" || norm === "med") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-400 border border-amber-800/60 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>MEDIUM</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>LOW</span>
    </span>
  );
}

export default SeverityBadge;

