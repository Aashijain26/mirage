import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Server,
  Globe,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Layers,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ScoreBadge } from "./ScoreBadge.jsx";
import { SeverityBadge } from "./SeverityBadge.jsx";
import { FlagChip } from "./FlagChip.jsx";
import { CopyButton } from "./CopyButton.jsx";
import { AiAnalysisSkeleton } from "./Skeleton.jsx";
import {
  FLAG_DESCRIPTIONS,
  formatRelativeTime,
  formatFullTimestamp,
  truncateText
} from "../utils/formatters.js";
import { useAppData } from "../hooks/useAppData.js";

export function Incident({ event, onSelectEventId = null }) {
  const {
    events,
    tokenMap,
    getAiSummary,
    isMockMode,
    now
  } = useAppData();

  const [expandedUa, setExpandedUa] = useState(false);
  const [aiState, setAiState] = useState({
    status: "idle", // 'idle' | 'loading' | 'success' | 'error'
    data: null,
    error: null
  });
  const [checkedActions, setCheckedActions] = useState({});

  // Find all events associated with this attacker's IP
  const ipEvents = useMemo(() => {
    if (!event || !event.ip) return [];
    return events
      .filter((e) => e.ip === event.ip)
      .sort((a, b) => new Date(a.ts) - new Date(b.ts)); // Ascending chronological order
  }, [events, event?.ip]);

  const eventIdsForIp = useMemo(() => ipEvents.map((e) => e.id), [ipEvents]);

  // AI Summary fetcher
  const handleRunAiAnalysis = async () => {
    if (!event?.ip || eventIdsForIp.length === 0) return;
    setAiState({ status: "loading", data: null, error: null });
    try {
      const summaryResult = await getAiSummary(event.ip, eventIdsForIp);
      setAiState({ status: "success", data: summaryResult, error: null });
    } catch (err) {
      setAiState({
        status: "error",
        data: null,
        error: err.message || "Failed to analyze incident."
      });
    }
  };

  // Auto-run once in mock mode when opening an incident
  useEffect(() => {
    if (event?.ip) {
      setExpandedUa(false);
      setCheckedActions({});
      if (isMockMode) {
        handleRunAiAnalysis();
      } else {
        setAiState({ status: "idle", data: null, error: null });
      }
    }
  }, [event?.id, event?.ip, isMockMode]);

  if (!event) {
    return (
      <div className="p-8 text-center text-[#8FA0BD]">
        Select an incident from the feed to view forensic analysis.
      </div>
    );
  }

  // Token data
  const triggeredToken = tokenMap.get(event.token_id);
  const tokenLabel = triggeredToken ? triggeredToken.label : event.token_id || "Unknown";
  const tokenType = triggeredToken ? triggeredToken.type : "Generic";
  const callbackUrl = triggeredToken ? triggeredToken.callback_url : "";

  // Flags & Indicators
  const flags = Array.isArray(event.flags) ? event.flags : [];
  const isTor = flags.includes("tor") || event.geo?.proxy === true;
  const isHosting = flags.includes("hosting-provider") || event.geo?.hosting === true;
  const isProxy = event.geo?.proxy === true;

  // Toggle action item
  const toggleAction = (idx) => {
    setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const rawUserAgent = event.ua || "None captured";
  const isUaLong = rawUserAgent.length > 120;

  return (
    <div className="space-y-6">
      {/* 1. Header: Attacker IP, Geo, ISP/ASN, Indicators */}
      <div className="p-5 md:p-6 rounded-xl border border-[#1F2B47] bg-[#111A2E] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1F2B47]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8FA0BD] mb-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span title={formatFullTimestamp(event.ts)} className="cursor-help">
                Triggered {formatRelativeTime(event.ts, now)} ({formatFullTimestamp(event.ts)})
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-mono font-bold text-white tracking-tight">
                {event.ip}
              </h2>
              <CopyButton textToCopy={event.ip} compact label="Copy IP" />

              {/* Badges for Tor, Hosting, Proxy */}
              {isTor && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/60">
                  Tor Exit Node
                </span>
              )}
              {isHosting && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60">
                  Hosting / Datacenter
                </span>
              )}
              {isProxy && !isTor && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-400 border border-purple-800/60">
                  Proxy / VPN
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <ScoreBadge score={event.score} size="lg" />
          </div>
        </div>

        {/* Network & ISP Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[#8FA0BD] block">Location</span>
            <span className="font-semibold text-[#E6EDF7] mt-0.5 block">
              {event.geo?.city ? `${event.geo.city}, ` : ""}
              {event.geo?.country || "Unknown Location"}
            </span>
          </div>

          <div>
            <span className="text-[#8FA0BD] block">ISP / Network</span>
            <span className="font-semibold text-[#E6EDF7] mt-0.5 block truncate" title={event.geo?.isp}>
              {event.geo?.isp || "Unknown ISP"}
            </span>
          </div>

          <div>
            <span className="text-[#8FA0BD] block">Autonomous System (ASN)</span>
            <span className="font-mono text-[#E6EDF7] mt-0.5 block">
              {event.geo?.as || "Unknown ASN"}
            </span>
          </div>

          <div>
            <span className="text-[#8FA0BD] block">Organization</span>
            <span className="font-semibold text-[#E6EDF7] mt-0.5 block truncate" title={event.geo?.org}>
              {event.geo?.org || "Unknown Org"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Two-Column Grid: Triggered Token & Risk Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triggered Token Card */}
        <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2B47] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[#E6EDF7]">Compromised Honeytoken Decoy</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-slate-300">
              {tokenType}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#1F2B47]/40">
              <span className="text-[#8FA0BD]">Token Label:</span>
              <span className="font-bold text-white text-sm">{tokenLabel}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#1F2B47]/40">
              <span className="text-[#8FA0BD]">Token ID:</span>
              <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                <span>{event.token_id}</span>
                <CopyButton textToCopy={event.token_id} compact label="Copy Token ID" />
              </div>
            </div>

            {callbackUrl && (
              <div className="py-1">
                <span className="text-[#8FA0BD] block mb-1">Callback Trap URL:</span>
                <div className="flex items-center justify-between p-2 rounded bg-[#0B1220] border border-[#1F2B47] font-mono text-[11px] text-cyan-300">
                  <span className="truncate mr-2">{callbackUrl}</span>
                  <CopyButton textToCopy={callbackUrl} compact label="Copy Trap URL" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Score & "Why this score" Flags */}
        <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2B47] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[#E6EDF7]">Risk Assessment &amp; Flags</h3>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300">
              Score: {event.score}/100
            </span>
          </div>

          {/* Score progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-[#0B1220] h-2.5 rounded-full overflow-hidden border border-[#1F2B47]">
              <div
                className={`h-full transition-all duration-500 ${
                  event.score >= 60
                    ? "bg-red-500"
                    : event.score >= 30
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, event.score || 0))}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-[#8FA0BD] block mb-2">
              Why this score:
            </span>
            {flags.length > 0 ? (
              <div className="space-y-2">
                {flags.map((flag, idx) => (
                  <FlagChip key={idx} flag={flag} full />
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#0B1220] border border-[#1F2B47] text-xs text-[#8FA0BD]">
                No malicious flags detected. Low-risk isolated query with standard client headers.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Attack Timeline: ALL events from this IP (sorted ascending) */}
      <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2B47] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#E6EDF7]">
              Attacker Interaction Timeline ({ipEvents.length} total event{ipEvents.length > 1 ? "s" : ""})
            </h3>
          </div>
          <span className="text-xs text-[#8FA0BD]">Chronological order (earliest &rarr; latest)</span>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F2B47]">
          {ipEvents.map((timelineEv) => {
            const isSelected = timelineEv.id === event.id;
            const tok = tokenMap.get(timelineEv.token_id);
            const tLabel = tok ? tok.label : timelineEv.token_id || "Token";

            return (
              <div
                key={timelineEv.id}
                onClick={() => onSelectEventId && onSelectEventId(timelineEv.id)}
                className={`relative p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#16213A] border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30"
                    : "bg-[#0B1220]/70 border-[#1F2B47] hover:border-[#2a3a5e] hover:bg-[#0B1220]"
                }`}
              >
                {/* Node marker on timeline */}
                <div
                  className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    isSelected
                      ? "bg-emerald-400 border-[#0B1220] ring-2 ring-emerald-500/50"
                      : timelineEv.score >= 60
                      ? "bg-red-500 border-[#0B1220]"
                      : "bg-[#8FA0BD] border-[#0B1220]"
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8FA0BD] font-mono" title={formatFullTimestamp(timelineEv.ts)}>
                      {formatRelativeTime(timelineEv.ts, now)}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                        timelineEv.method === "POST"
                          ? "bg-amber-950/60 text-amber-400"
                          : "bg-blue-950/60 text-blue-400"
                      }`}
                    >
                      {timelineEv.method || "GET"}
                    </span>
                    <span className="font-mono text-white text-xs">
                      {timelineEv.path || "/"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#16213A] text-slate-300 border border-[#1F2B47]">
                      {tLabel}
                    </span>
                    <ScoreBadge score={timelineEv.score} size="sm" />
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        [Active Event]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Raw Request Details (Plain Text Mono Block) */}
      <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1F2B47] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#E6EDF7]">Raw HTTP Request Evidence</h3>
          </div>
          <span className="text-xs text-[#8FA0BD] font-mono">Captured Plaintext</span>
        </div>

        <div className="p-4 rounded-lg bg-[#0B1220] border border-[#1F2B47] font-mono text-xs text-slate-300 space-y-2 select-text overflow-x-auto">
          <div>
            <span className="text-[#8FA0BD] select-none">REQUEST_LINE: </span>
            <span className="text-emerald-400 font-semibold">{event.method || "GET"}</span>{" "}
            <span className="text-white">{event.path || "/"}</span>{" "}
            <span className="text-[#8FA0BD]">HTTP/1.1</span>
          </div>
          <div>
            <span className="text-[#8FA0BD] select-none">HOST: </span>
            <span className="text-slate-200">api.security-perimeter.internal</span>
          </div>
          <div>
            <span className="text-[#8FA0BD] select-none">ORIGIN_IP: </span>
            <span className="text-slate-200">{event.ip}</span>
          </div>
          <div>
            <span className="text-[#8FA0BD] select-none">TOKEN_ID: </span>
            <span className="text-cyan-300">{event.token_id}</span>
          </div>
          <div className="pt-1">
            <span className="text-[#8FA0BD] select-none">USER_AGENT: </span>
            <span
              className="text-amber-200 cursor-pointer"
              onClick={() => isUaLong && setExpandedUa(!expandedUa)}
              title={isUaLong ? (expandedUa ? "Click to collapse" : "Click to view full user agent") : rawUserAgent}
            >
              {expandedUa ? rawUserAgent : truncateText(rawUserAgent, 120)}
            </span>
            {isUaLong && (
              <button
                type="button"
                onClick={() => setExpandedUa(!expandedUa)}
                className="ml-2 text-xs text-emerald-400 hover:underline select-none"
              >
                {expandedUa ? "[Collapse]" : "[Expand Full UA]"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. AI Attacker Profile Panel */}
      <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2B47] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF7]">
                AI SOC Attacker Profile &amp; Remediation
              </h3>
              <p className="text-xs text-[#8FA0BD]">
                Heuristic &amp; LLM-based adversary behavioral synthesis
              </p>
            </div>
          </div>

          {aiState.status !== "loading" && (
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{aiState.status === "success" ? "Re-Analyze" : "Analyze with AI"}</span>
            </button>
          )}
        </div>

        {/* AI States: idle, loading, error, success */}
        {aiState.status === "idle" && (
          <div className="p-8 text-center rounded-lg bg-[#0B1220] border border-dashed border-[#1F2B47] text-[#8FA0BD] space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-[#8FA0BD]/50" aria-hidden="true" />
            <p className="text-xs max-w-sm mx-auto">
              Click &quot;Analyze with AI&quot; to synthesize multi-event timeline patterns, assess intent, and generate mitigation guidance.
            </p>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Analyze with AI
            </button>
          </div>
        )}

        {aiState.status === "loading" && (
          <AiAnalysisSkeleton text="Analyzing attacker behavior..." />
        )}

        {aiState.status === "error" && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{aiState.error || "Failed to generate AI profile."}</span>
            </div>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded text-white font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {aiState.status === "success" && aiState.data && (
          <div className="space-y-4">
            {/* Badges: Severity + Likely Actor */}
            <div className="flex items-center gap-3 flex-wrap">
              <SeverityBadge severity={aiState.data.severity} />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16213A] text-slate-300 border border-[#1F2B47]">
                <span className="text-[#8FA0BD]">Actor Class:</span>
                <span className="uppercase text-white font-mono">
                  {aiState.data.likely_actor || "Unknown"}
                </span>
              </div>
            </div>

            {/* Plaintext Summary Paragraph (Security: Normal React interpolation, never HTML) */}
            <div className="p-4 rounded-lg bg-[#0B1220] border border-[#1F2B47] text-xs text-slate-200 leading-relaxed">
              {aiState.data.summary}
            </div>

            {/* Recommended Actions Checklist */}
            {Array.isArray(aiState.data.recommended_actions) &&
              aiState.data.recommended_actions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#E6EDF7] block">
                    Recommended Incident Remediation Checklist:
                  </span>
                  <div className="space-y-2">
                    {aiState.data.recommended_actions.map((action, idx) => {
                      const isDone = !!checkedActions[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleAction(idx)}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isDone
                              ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300 line-through opacity-70"
                              : "bg-[#0B1220] border-[#1F2B47] text-slate-200 hover:border-[#2a3a5e]"
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={isDone ? `Mark "${action}" incomplete` : `Mark "${action}" complete`}
                            className="mt-0.5 shrink-0 focus:outline-none"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                            ) : (
                              <Square className="w-4 h-4 text-[#8FA0BD]" aria-hidden="true" />
                            )}
                          </button>
                          <span>{action}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Incident;

