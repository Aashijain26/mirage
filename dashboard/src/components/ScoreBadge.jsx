import React from "react";
import { getSeverityFromScore } from "../utils/formatters.js";

export function ScoreBadge({ score, size = "md", showLabel = false }) {
  const numScore = typeof score === "number" ? score : parseInt(score, 10) || 0;
  const severity = getSeverityFromScore(numScore);

  let colorClasses = "text-emerald-400 bg-emerald-950/40 border-emerald-800/60";
  let labelText = "Low";
  let dotColor = "bg-emerald-400";

  if (severity === "high") {
    colorClasses = "text-red-400 bg-red-950/40 border-red-800/60";
    labelText = "High";
    dotColor = "bg-red-400";
  } else if (severity === "medium") {
    colorClasses = "text-amber-400 bg-amber-950/40 border-amber-800/60";
    labelText = "Med";
    dotColor = "bg-amber-400";
  }

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border ${colorClasses}`}
        title={`Risk score: ${numScore}/100 (${labelText})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{numScore}</span>
        {showLabel && <span className="font-sans text-[10px] uppercase opacity-75">{labelText}</span>}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${colorClasses}`}
        title={`Threat Risk Score: ${numScore}/100`}
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400">Threat Score</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-3xl font-bold">{numScore}</span>
            <span className="text-xs opacity-60">/100</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border border-current">
            {severity === "high" ? "High Risk" : severity === "medium" ? "Medium Risk" : "Low Risk"}
          </span>
        </div>
      </div>
    );
  }

  // Default "md"
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${colorClasses}`}
      title={`Risk score: ${numScore}/100 (${labelText})`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{numScore}</span>
      <span className="font-sans text-[11px] font-medium opacity-80">({labelText})</span>
    </span>
  );
}

export default ScoreBadge;

