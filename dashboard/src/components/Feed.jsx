import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScoreBadge } from "./ScoreBadge.jsx";
import { FlagChip } from "./FlagChip.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { TableRowSkeleton } from "./Skeleton.jsx";
import { formatRelativeTime, formatFullTimestamp, truncateText } from "../utils/formatters.js";
import { Search, Filter, ShieldAlert, ArrowUpRight, ChevronRight, Layers } from "lucide-react";

export function Feed({
  events = [],
  tokenMap = new Map(),
  recentEventIds = new Set(),
  loading = false,
  compact = false,
  maxItems = 500,
  onSelectEvent = null,
  now = Date.now()
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");

  // Filtering
  const filteredEvents = useMemo(() => {
    let list = events;

    if (compact) {
      return list.slice(0, 5);
    }

    if (severityFilter !== "all") {
      list = list.filter((e) => {
        const s = e.score ?? 0;
        if (severityFilter === "high") return s >= 70;
        if (severityFilter === "medium") return s >= 50 && s < 70;
        if (severityFilter === "low") return s < 50;
        return true;
      });
    }

    if (tokenFilter !== "all") {
      list = list.filter((e) => e.token_id === tokenFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.ip && e.ip.toLowerCase().includes(q)) ||
          (e.path && e.path.toLowerCase().includes(q)) ||
          (e.geo?.city && e.geo.city.toLowerCase().includes(q)) ||
          (e.geo?.country && e.geo.country.toLowerCase().includes(q)) ||
          (e.ua && e.ua.toLowerCase().includes(q))
      );
    }

    return list.slice(0, maxItems);
  }, [events, compact, severityFilter, tokenFilter, search, maxItems]);

  const handleRowClick = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      navigate(`/incidents/${event.id}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#1F2B47] bg-[#111A2E] overflow-hidden">
        {Array.from({ length: compact ? 5 : 8 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={compact ? 5 : 7} />
        ))}
      </div>
    );
  }

  // Token options for filter dropdown
  const uniqueTokenIds = Array.from(new Set(events.map((e) => e.token_id).filter(Boolean)));

  return (
    <div className="flex flex-col space-y-3">
      {/* Filters bar (only in full mode) */}
      {!compact && (
        <div className="p-4 rounded-xl border border-[#1F2B47] bg-[#111A2E] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8FA0BD] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, path, country, user agent..."
              className="w-full pl-9 pr-4 py-2 bg-[#0B1220] border border-[#1F2B47] rounded-lg text-xs md:text-sm text-[#E6EDF7] placeholder-[#8FA0BD] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Severity & Token dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#0B1220] border border-[#1F2B47] rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#8FA0BD]" aria-hidden="true" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                aria-label="Filter by Severity"
                className="bg-transparent text-[#E6EDF7] focus:outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="high">High Risk (&ge;60)</option>
                <option value="medium">Medium Risk (30-59)</option>
                <option value="low">Low Risk (&lt;30)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0B1220] border border-[#1F2B47] rounded-lg px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-[#8FA0BD]" aria-hidden="true" />
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                aria-label="Filter by Token"
                className="bg-transparent text-[#E6EDF7] focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Honeytokens</option>
                {uniqueTokenIds.map((tid) => {
                  const tok = tokenMap.get(tid);
                  return (
                    <option key={tid} value={tid}>
                      {tok ? tok.label : tid}
                    </option>
                  );
                })}
              </select>
            </div>

            <span className="text-xs font-mono text-[#8FA0BD] ml-auto">
              {filteredEvents.length} events
            </span>
          </div>
        </div>
      )}

      {/* Main Table / Cards view */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No events match current filter"
          description="Traps are armed. Adjust search filters or trigger a simulated attack."
        />
      ) : (
        <div className="rounded-xl border border-[#1F2B47] bg-[#111A2E] overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F2B47] bg-[#16213A]/60 text-[11px] font-semibold uppercase tracking-wider text-[#8FA0BD]">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Honeytoken</th>
                  <th className="py-3 px-4">Method &amp; Path</th>
                  <th className="py-3 px-4">Threat Score</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2B47]/60 text-xs">
                {filteredEvents.map((ev) => {
                  const isRecent = recentEventIds.has(ev.id);
                  const isHighRisk = (ev.score ?? 0) >= 70;
                  const resolvedToken = tokenMap.get(ev.token_id);
                  const tokenLabel = resolvedToken ? resolvedToken.label : ev.token_id || "Unknown";
                  const relTime = formatRelativeTime(ev.ts, now);
                  const fullTime = formatFullTimestamp(ev.ts);

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => handleRowClick(ev)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleRowClick(ev)}
                      className={`cursor-pointer transition-all duration-300 hover:bg-[#16213A] focus:outline-none focus:bg-[#16213A] ${
                        isRecent
                          ? isHighRisk
                            ? "flash-new-high"
                            : "flash-new-normal"
                          : ""
                      }`}
                    >
                      {/* Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-[#8FA0BD]">
                        <span title={fullTime} className="cursor-help">
                          {relTime}
                        </span>
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-[#E6EDF7]">
                        <span className="hover:text-emerald-400 transition-colors">
                          {ev.ip || "—"}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap text-[#8FA0BD]">
                        {ev.geo ? (
                          <span>
                            {ev.geo.city ? `${ev.geo.city}, ` : ""}
                            <span className="text-[#E6EDF7] font-medium">
                              {ev.geo.country || "Unknown"}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Token */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#16213A] text-slate-300 border border-[#1F2B47]"
                          title={`Token ID: ${ev.token_id}`}
                        >
                          {tokenLabel}
                        </span>
                      </td>

                      {/* Method & Path */}
                      <td className="py-3 px-4 max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ev.method === "POST"
                                ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                                : "bg-blue-950/60 text-blue-400 border border-blue-800/40"
                            }`}
                          >
                            {ev.method || "GET"}
                          </span>
                          <span
                            className="text-[#E6EDF7] truncate cursor-help"
                            title={ev.path}
                          >
                            {ev.path || "/"}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ScoreBadge score={ev.score} size="sm" showLabel />
                      </td>

                      {/* Flags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {Array.isArray(ev.flags) && ev.flags.length > 0 ? (
                            ev.flags.map((flag, idx) => (
                              <FlagChip key={idx} flag={flag} />
                            ))
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3 px-3 text-right text-[#8FA0BD]">
                        <ChevronRight className="w-4 h-4 ml-auto text-[#8FA0BD] group-hover:text-emerald-400" aria-hidden="true" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View (< 768px) */}
          <div className="block md:hidden divide-y divide-[#1F2B47]/60">
            {filteredEvents.map((ev) => {
              const isRecent = recentEventIds.has(ev.id);
              const isHighRisk = (ev.score ?? 0) >= 70;
              const resolvedToken = tokenMap.get(ev.token_id);
              const tokenLabel = resolvedToken ? resolvedToken.label : ev.token_id || "Unknown";
              const relTime = formatRelativeTime(ev.ts, now);

              return (
                <div
                  key={ev.id}
                  onClick={() => handleRowClick(ev)}
                  className={`p-4 space-y-2 cursor-pointer transition-colors active:bg-[#16213A] ${
                    isRecent
                      ? isHighRisk
                        ? "flash-new-high"
                        : "flash-new-normal"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {ev.ip}
                    </span>
                    <ScoreBadge score={ev.score} size="sm" showLabel />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8FA0BD]">
                    <span>
                      {ev.geo?.city ? `${ev.geo.city}, ` : ""}
                      {ev.geo?.country || "Unknown Location"}
                    </span>
                    <span>{relTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {ev.method || "GET"}
                    </span>
                    <span className="text-[#E6EDF7] truncate">{ev.path || "/"}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400 bg-[#16213A] px-2 py-0.5 rounded border border-[#1F2B47]">
                      {tokenLabel}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.isArray(ev.flags) &&
                        ev.flags.slice(0, 2).map((flag, idx) => (
                          <FlagChip key={idx} flag={flag} />
                        ))}
                      {Array.isArray(ev.flags) && ev.flags.length > 2 && (
                        <span className="text-[10px] text-[#8FA0BD]">
                          +{ev.flags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;

