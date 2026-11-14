import React from "react";
import { ShieldCheck } from "lucide-react";

export function EmptyState({
  title = "No hits yet",
  description = "Traps are armed and waiting.",
  icon: Icon = ShieldCheck,
  action = null
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#1F2B47] bg-[#111A2E]/60 my-4">
      <div className="w-14 h-14 rounded-full bg-[#16213A] border border-[#1F2B47] flex items-center justify-center mb-4 text-emerald-400">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#E6EDF7] mb-1">{title}</h3>
      <p className="text-sm text-[#8FA0BD] max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;

