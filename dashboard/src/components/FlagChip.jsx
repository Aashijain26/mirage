import React from "react";
import { Bot, ShieldAlert, Layers, Zap, Server, Tag } from "lucide-react";
import { getFlagReadableText } from "../utils/formatters.js";

const FLAG_CONFIG = {
  scripted: {
    label: "Scripted",
    icon: Bot,
    color: "text-amber-300 bg-amber-950/40 border-amber-800/40"
  },
  tor: {
    label: "Tor Exit",
    icon: ShieldAlert,
    color: "text-red-300 bg-red-950/40 border-red-800/40"
  },
  "multi-token": {
    label: "Multi-Token",
    icon: Layers,
    color: "text-purple-300 bg-purple-950/40 border-purple-800/40"
  },
  burst: {
    label: "Burst",
    icon: Zap,
    color: "text-orange-300 bg-orange-950/40 border-orange-800/40"
  },
  "hosting-provider": {
    label: "Hosting/Cloud",
    icon: Server,
    color: "text-blue-300 bg-blue-950/40 border-blue-800/40"
  }
};

export function FlagChip({ flag, full = false }) {
  if (!flag) return null;
  const config = FLAG_CONFIG[flag] || {
    label: flag,
    icon: Tag,
    color: "text-slate-300 bg-slate-800/50 border-slate-700"
  };

  const Icon = config.icon;
  const explanation = getFlagReadableText(flag);

  if (full) {
    return (
      <div
        className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs ${config.color}`}
      >
        <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {config.label}
          </span>
          <span className="text-slate-300 text-xs mt-0.5">{explanation}</span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${config.color} cursor-help transition-colors hover:brightness-110`}
      title={explanation}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export default FlagChip;

