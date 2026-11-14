import React from "react";
import { Cloud, Key, Database, ShieldCheck, Flame, ShieldAlert, Copy } from "lucide-react";
import { CopyButton } from "./CopyButton.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { TableRowSkeleton } from "./Skeleton.jsx";
import { formatRelativeTime, formatFullTimestamp, maskCredential } from "../utils/formatters.js";

const TYPE_ICONS = {
  aws: Cloud,
  api_key: Key,
  db: Database
};

export function TokenList({
  tokens = [],
  tokenHitCounts = new Map(),
  tokenLastTriggered = new Map(),
  loading = false,
  now = Date.now()
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1F2B47] bg-[#111A2E] overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={7} />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <EmptyState
        title="No honeytokens configured"
        description="Deploy your first trap credential above to catch attackers probing your systems."
      />
    );
  }

  return (
    <div className="rounded-xl border border-[#1F2B47] bg-[#111A2E] overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1F2B47] bg-[#16213A]/60 text-[11px] font-semibold uppercase tracking-wider text-[#8FA0BD]">
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Label &amp; ID</th>
              <th className="py-3 px-4">Masked Credential</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Attack Hits</th>
              <th className="py-3 px-4">Last Triggered</th>
              <th className="py-3 px-4">Trap Status</th>
              <th className="py-3 px-4 text-right">Trap URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2B47]/60 text-xs">
            {tokens.map((tok) => {
              const Icon = TYPE_ICONS[tok.type] || Key;
              const hits = tokenHitCounts.get(tok.id) || 0;
              const lastTriggeredTs = tokenLastTriggered.get(tok.id);
              const isTriggered = hits > 0;
              const masked = maskCredential(tok.value, tok.type);

              return (
                <tr
                  key={tok.id}
                  className="hover:bg-[#16213A] transition-colors"
                >
                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#16213A] border border-[#1F2B47] text-slate-300">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <span className="font-semibold text-slate-300 uppercase text-[11px]">
                        {tok.type === "api_key" ? "API Key" : tok.type.toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Label & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#E6EDF7] text-sm">
                        {tok.label}
                      </span>
                      <span className="font-mono text-[11px] text-[#8FA0BD]">
                        {tok.id}
                      </span>
                    </div>
                  </td>

                  {/* Masked Value */}
                  <td className="py-3.5 px-4 font-mono text-slate-400 max-w-xs truncate">
                    <span title="Masked credential value" className="cursor-help">
                      {masked}
                    </span>
                  </td>

                  {/* Created Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#8FA0BD]">
                    <span
                      title={formatFullTimestamp(tok.created_at)}
                      className="cursor-help"
                    >
                      {formatRelativeTime(tok.created_at, now)}
                    </span>
                  </td>

                  {/* Hit Count */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                    {hits > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <Flame className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>{hits} hit{hits > 1 ? "s" : ""}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">0 hits</span>
                    )}
                  </td>

                  {/* Last Triggered */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#8FA0BD]">
                    {lastTriggeredTs ? (
                      <span
                        title={formatFullTimestamp(lastTriggeredTs)}
                        className="cursor-help text-amber-300 font-medium"
                      >
                        {formatRelativeTime(lastTriggeredTs, now)}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Status Chip */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {tok.revoked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Revoked
                      </span>
                    ) : isTriggered ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-800/60 animate-pulse">
                        <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                        <span>Triggered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                        <span>Armed</span>
                      </span>
                    )}
                  </td>

                  {/* Trap URL Copy */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {tok.callback_url && (
                      <CopyButton
                        textToCopy={tok.callback_url}
                        label="Copy Trap URL"
                        compact
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View (< 768px) */}
      <div className="block md:hidden divide-y divide-[#1F2B47]/60">
        {tokens.map((tok) => {
          const Icon = TYPE_ICONS[tok.type] || Key;
          const hits = tokenHitCounts.get(tok.id) || 0;
          const lastTriggeredTs = tokenLastTriggered.get(tok.id);
          const isTriggered = hits > 0;
          const masked = maskCredential(tok.value, tok.type);

          return (
            <div key={tok.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#16213A] border border-[#1F2B47] text-slate-300">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="font-bold text-sm text-[#E6EDF7]">{tok.label}</span>
                </div>
                {isTriggered ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/60 text-red-400 border border-red-800/60">
                    Triggered ({hits})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    Armed
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[#8FA0BD] font-mono">
                <span>{tok.id}</span>
                <span>{masked}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8FA0BD] pt-1">
                <span>Created {formatRelativeTime(tok.created_at, now)}</span>
                {tok.callback_url && (
                  <CopyButton textToCopy={tok.callback_url} compact label="Copy Trap URL" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TokenList;

