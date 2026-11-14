import React from "react";

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[#16213A] rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-[#1F2B47]/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  );
}

export function AiAnalysisSkeleton({ text = "Analyzing attacker behavior..." }) {
  return (
    <div className="p-6 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-emerald-400">{text}</span>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="pt-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-full rounded" />
        <Skeleton className="h-6 w-full rounded" />
      </div>
    </div>
  );
}

export default Skeleton;

