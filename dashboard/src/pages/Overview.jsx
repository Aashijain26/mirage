import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ThreatMap } from "../components/ThreatMap.jsx";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Overview() {
  const navigate = useNavigate();
  const { events, tokens } = useAppData();
  const [incidentIndex, setIncidentIndex] = useState(0);

  // Dynamic severity counts derived from live events (no hardcoded fallbacks)
  const highCount = useMemo(
    () => events.filter((e) => (e.score ?? 0) >= 70).length,
    [events]
  );
  const medCount = useMemo(
    () => events.filter((e) => (e.score ?? 0) >= 50 && (e.score ?? 0) < 70).length,
    [events]
  );
  const lowCount = useMemo(
    () => events.filter((e) => (e.score ?? 0) < 50).length,
    [events]
  );
  const totalRequests = useMemo(
    () => events.length,
    [events.length]
  );

  // Latest 5 incidents derived from live events
  const latestIncidents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return events.slice(0, 5).map((ev) => ({
      id: ev.id,
      ip: ev.ip,
      city: ev.geo?.city || ev.geo?.country || "Unknown Location",
      country: ev.geo?.country || "",
      token: ev.token_label || ev.token_id || "Honeytoken",
      score: ev.score ?? 0,
      flags: Array.isArray(ev.flags) ? ev.flags : []
    }));
  }, [events]);

  const currentInc = latestIncidents[incidentIndex] || latestIncidents[0] || null;

  // Dynamic hits per day data responsive to actual timestamps over last 7 days
  const dayHits = useMemo(() => {
    const days = [];
    const now = new Date();
    // 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];
      days.push({ day: dayName, dateStr, total: 0, low: 0, med: 0, high: 0 });
    }

    events.forEach((ev) => {
      const ts = ev.ts || ev.created_at;
      if (!ts) return;
      try {
        const evDate = new Date(ts).toISOString().split("T")[0];
        const match = days.find((d) => d.dateStr === evDate);
        if (match) {
          match.total += 1;
          const score = ev.score ?? 0;
          if (score >= 70) match.high += 1;
          else if (score >= 50) match.med += 1;
          else match.low += 1;
        }
      } catch {
        // ignore invalid date
      }
    });

    return days;
  }, [events]);

  // Dynamic most hit token derived from real tokens and events
  const mostHit = useMemo(() => {
    const tokenCounts = {};
    events.forEach((ev) => {
      const key = ev.token_label || ev.token_id;
      if (key) tokenCounts[key] = (tokenCounts[key] || 0) + 1;
    });

    tokens.forEach((t) => {
      const key = t.label || t.id;
      if (key && typeof t.hits === "number") {
        tokenCounts[key] = Math.max(tokenCounts[key] || 0, t.hits);
      }
    });

    let topLabel = tokens[0]?.label || "None";
    let topHits = 0;
    for (const [k, v] of Object.entries(tokenCounts)) {
      if (v > topHits) {
        topHits = v;
        topLabel = k;
      }
    }

    return { label: topLabel, hits: topHits };
  }, [tokens, events]);

  // Derived coverage metrics
  const tokensHitCount = useMemo(
    () => new Set(events.map((e) => e.token_id || e.token_label).filter(Boolean)).size,
    [events]
  );

  const hitsToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return events.filter((e) => {
      const ts = e.ts || e.created_at;
      if (!ts) return false;
      try {
        return new Date(ts).toISOString().split("T")[0] === todayStr;
      } catch {
        return false;
      }
    }).length;
  }, [events]);

  const unknownSourceCount = useMemo(
    () =>
      events.filter(
        (e) =>
          !e.geo?.country ||
          e.geo.country.toLowerCase() === "unknown" ||
          e.geo.country.toLowerCase() === "private network"
      ).length,
    [events]
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ================= ROW 1: INCIDENTS SPHERES | COVERAGE | MOST HIT TOKEN ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: INCIDENTS 3D Spheres with Spotlight & White Hover Circles */}
        <SpotlightCard className="md:col-span-4 bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[01] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">INCIDENTS</h2>
            </div>
            <p className="text-xs text-[#8FA0BD]">Open incidents by severity.</p>
          </div>

          {/* 3 Glowing Spheres with White Translucent Circle on Hover & Click-to-Filter */}
          <div className="flex items-end justify-around py-5">
            {/* High (Orange-Red Sphere) */}
            <div
              onClick={() => navigate("/incidents")}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-white/0 group-hover:bg-white/15 group-hover:ring-4 group-hover:ring-white/20 transition-all duration-300 blur-[1px] pointer-events-none" />
                <div className="w-22 h-22 rounded-full sphere-3d-high flex items-center justify-center font-heading text-3xl font-extrabold text-white select-none transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_15px_30px_rgba(230,74,25,0.6)]">
                  {highCount}
                </div>
              </div>
              <span className="text-xs font-mono-tech text-[#8FA0BD] group-hover:text-white transition-colors">
                High
              </span>
            </div>

            {/* Medium (Amber Sphere) */}
            <div
              onClick={() => navigate("/incidents")}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-white/0 group-hover:bg-white/15 group-hover:ring-4 group-hover:ring-white/20 transition-all duration-300 blur-[1px] pointer-events-none" />
                <div className="w-18 h-18 rounded-full sphere-3d-medium flex items-center justify-center font-heading text-2xl font-extrabold text-white select-none transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_15px_30px_rgba(245,124,0,0.6)]">
                  {medCount}
                </div>
              </div>
              <span className="text-xs font-mono-tech text-[#8FA0BD] group-hover:text-white transition-colors">
                Medium
              </span>
            </div>

            {/* Low (Electric Azure Blue Sphere) */}
            <div
              onClick={() => navigate("/incidents")}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-1.5 rounded-full bg-white/0 group-hover:bg-white/20 group-hover:ring-4 group-hover:ring-blue-400/30 transition-all duration-300 blur-[1px] pointer-events-none" />
                <div className="w-15 h-15 rounded-full sphere-3d-low flex items-center justify-center font-heading text-xl font-extrabold text-white select-none transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_15px_30px_rgba(37,99,235,0.7)]">
                  {lowCount}
                </div>
              </div>
              <span className="text-xs font-mono-tech text-[#8FA0BD] group-hover:text-blue-300 transition-colors">
                Low
              </span>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 2: COVERAGE with Dynamic Live Bars & Spotlight */}
        <SpotlightCard className="md:col-span-5 bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[02] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">COVERAGE</h2>
            </div>
            <p className="text-xs text-[#8FA0BD]">Planted tokens and their traffic.</p>
          </div>

          {/* Metrics with Bars */}
          <div className="space-y-4 py-2">
            {/* 1. Tokens planted */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-[#8FA0BD]">Tokens planted</span>
                <span className="text-[#38bdf8] font-bold">{tokens.length}</span>
              </div>
              <div className="h-1.5 w-full bg-[#182338] rounded-full overflow-hidden">
                <div
                  style={{ width: `${tokens.length > 0 ? 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-[#38bdf8] rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                />
              </div>
            </div>

            {/* 2. Tokens hit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-[#8FA0BD]">Tokens hit</span>
                <span className="text-[#fb923c] font-bold">{tokensHitCount}</span>
              </div>
              <div className="h-1.5 w-full bg-[#182338] rounded-full flex overflow-hidden">
                <div
                  style={{
                    width: `${
                      tokens.length > 0
                        ? Math.min(100, Math.round((tokensHitCount / tokens.length) * 100))
                        : 0
                    }%`
                  }}
                  className="h-full bg-[#f97316]"
                />
                <div className="h-full flex-1 bg-hazard-stripes-dark" />
              </div>
            </div>

            {/* 3. Hits today */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-tech">
                <span className="text-[#8FA0BD]">Hits today</span>
                <span className="text-[#f87171] font-bold">{hitsToday}</span>
              </div>
              <div className="h-1.5 w-full bg-[#182338] rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      totalRequests > 0
                        ? Math.min(100, Math.round((hitsToday / totalRequests) * 100))
                        : 0
                    }%`
                  }}
                  className="h-full bg-[#ef4444] rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 3: MOST HIT TOKEN */}
        <div className="md:col-span-3 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#7c2d12] via-[#5c1d0b] to-[#3b1206] border border-orange-900/40 text-white group hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(234,88,12,0.2)] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-tech tracking-widest uppercase text-orange-200/80">
              MOST HIT TOKEN
            </span>
            <span className="text-xs font-mono-tech text-orange-300/40">[\ ]</span>
          </div>

          <div className="py-2">
            <h3 className="font-mono-tech text-sm font-semibold text-white truncate">
              {mostHit.label}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-5xl font-extrabold text-white">
                {mostHit.hits}
              </span>
              <span className="text-xs font-mono-tech text-orange-200/80">hits</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate("/tokens")}
              className="bg-white hover:bg-orange-50 text-black font-semibold text-xs px-4 py-1.5 rounded-full shadow-md transition-all cursor-pointer hover:ring-2 hover:ring-white/40 hover:scale-105"
            >
              Show
            </button>
          </div>
        </div>
      </div>

      {/* ================= ROW 2: LIVE MAP WITH ZOOM & PAN ================= */}
      <ThreatMap events={events} />

      {/* ================= ROW 3: SEVERITY SUMMARY 4-PILL BAR ================= */}
      <SpotlightCard className="bg-[#111726] border border-[#1e2a40] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-around gap-4 text-xs font-mono-tech">
        {/* Low (Blue / Cyan accent) */}
        <div
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2.5 group cursor-pointer hover:bg-white/5 px-3 py-1 rounded-full transition-colors"
        >
          <Shield className="w-4 h-4 text-[#38bdf8] fill-blue-500/20" />
          <span className="text-[#8FA0BD] group-hover:text-blue-300 transition-colors">Low</span>
          <span className="text-white font-bold text-sm">{lowCount}</span>
          <span className="text-[#64748b]">/ {totalRequests}</span>
        </div>

        {/* Medium */}
        <div
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2.5 group cursor-pointer hover:bg-white/5 px-3 py-1 rounded-full transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 fill-amber-500/20" />
          <span className="text-[#8FA0BD] group-hover:text-amber-300 transition-colors">Medium</span>
          <span className="text-white font-bold text-sm">{medCount}</span>
          <span className="text-[#64748b]">/ {totalRequests}</span>
        </div>

        {/* High */}
        <div
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2.5 group cursor-pointer hover:bg-white/5 px-3 py-1 rounded-full transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 fill-rose-500/20" />
          <span className="text-[#8FA0BD] group-hover:text-rose-300 transition-colors">High</span>
          <span className="text-white font-bold text-sm">{highCount}</span>
          <span className="text-[#64748b]">/ {totalRequests}</span>
        </div>

        {/* Unknown Source */}
        <div
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2.5 group cursor-pointer hover:bg-white/5 px-3 py-1 rounded-full transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-[#8FA0BD]" />
          <span className="text-[#8FA0BD] group-hover:text-white transition-colors">Unknown source</span>
          <span className="text-white font-bold text-sm">{unknownSourceCount}</span>
          <span className="text-[#64748b]">/ {totalRequests}</span>
        </div>
      </SpotlightCard>

      {/* ================= ROW 4: HITS PER DAY CAPSULES | LATEST INCIDENT CAROUSEL ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: [04] \\ HITS PER DAY */}
        <SpotlightCard className="md:col-span-7 bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[04] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">HITS PER DAY</h2>
            </div>
            <p className="text-xs text-[#8FA0BD]">Requests captured per day, last 7 days.</p>
          </div>

          {/* 7 Vertical Capsule Bars */}
          <div className="flex items-end justify-between gap-2 sm:gap-3 py-6 px-2">
            {dayHits.map((d, i) => {
              const maxVal = Math.max(1, ...dayHits.map((item) => item.total));
              const fillPct = d.total > 0 ? Math.max(14, (d.total / maxVal) * 88) : 0;
              const lowPct = d.total > 0 ? (d.low / d.total) * 100 : 0;
              const medPct = d.total > 0 ? (d.med / d.total) * 100 : 0;
              const highPct = d.total > 0 ? (d.high / d.total) * 100 : 0;

              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                  {/* Total on top */}
                  <span className="text-xs font-mono-tech text-[#8FA0BD] group-hover:text-white transition-colors">
                    {d.total}
                  </span>

                  {/* Capsule container */}
                  <div className="w-7 sm:w-9 h-36 bg-[#0a0f18] border border-[#1e2a40] rounded-full flex flex-col justify-end overflow-hidden relative group-hover:border-blue-400/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all duration-200">
                    {/* Top unfilled area with hazard stripes */}
                    <div className="w-full flex-1 bg-hazard-stripes-dark" />

                    {/* Bottom stacked filled area */}
                    <div
                      style={{ height: `${fillPct}%` }}
                      className="w-full flex flex-col justify-end shrink-0 transition-all duration-500"
                    >
                      {d.high > 0 && (
                        <div style={{ height: `${highPct}%` }} className="w-full bg-[#ef4444]" />
                      )}
                      {d.med > 0 && (
                        <div style={{ height: `${medPct}%` }} className="w-full bg-[#f97316]" />
                      )}
                      {d.low > 0 && (
                        <div style={{ height: `${lowPct}%` }} className="w-full bg-[#22c55e]" />
                      )}
                    </div>
                  </div>

                  {/* Day label */}
                  <span className="text-[11px] font-mono-tech text-[#8FA0BD] group-hover:text-white transition-colors">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono-tech pt-2 border-t border-[#1a2336]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span>●</span>
              <span className="text-[#8FA0BD]">Low</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span>●</span>
              <span className="text-[#8FA0BD]">Medium</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span>●</span>
              <span className="text-[#8FA0BD]">High</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Right: [05] \\ LATEST INCIDENT */}
        <div className="md:col-span-5 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#450a0a] via-[#260606] to-[#140303] border border-red-900/40 text-white group hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/5 rotate-12 pointer-events-none" />
          <div className="absolute -bottom-10 -right-4 w-32 h-32 border border-white/5 -rotate-6 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between text-[11px] font-mono-tech tracking-wider text-rose-300/80 uppercase">
            <span>LATEST INCIDENT</span>
            <span className="text-rose-400/50">[05]</span>
          </div>

          {/* Incident Content */}
          {currentInc ? (
            <>
              <div className="py-4 space-y-3 relative z-10">
                <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                  LATEST INCIDENT
                </h2>

                <div
                  onClick={() => navigate(`/incidents/${currentInc.id}`)}
                  className="space-y-1 cursor-pointer group/link"
                >
                  <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white group-hover/link:text-rose-300 transition-colors">
                    {currentInc.ip}
                  </p>
                  <p className="text-xs text-rose-200/70">
                    {currentInc.city}{currentInc.country ? `, ${currentInc.country}` : ""}
                  </p>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="inline-flex items-center gap-1 bg-teal-950/80 border border-teal-700/60 text-[#34d399] px-2.5 py-0.5 rounded-full text-xs font-mono-tech">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                    {currentInc.token}
                  </span>

                  <span className="bg-[#181012] border border-red-900/60 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-mono-tech">
                    score {currentInc.score}
                  </span>

                  {currentInc.flags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#181012] border border-red-900/40 text-rose-200/80 px-2 py-0.5 rounded-full text-[11px] font-mono-tech"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Carousel Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-rose-950/60 relative z-10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setIncidentIndex((prev) =>
                        prev === 0 ? latestIncidents.length - 1 : prev - 1
                      )
                    }
                    className="w-8 h-8 rounded-full border border-rose-800/60 flex items-center justify-center text-white hover:bg-white/15 hover:ring-2 hover:ring-white/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIncidentIndex((prev) =>
                        prev === latestIncidents.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="w-8 h-8 rounded-full border border-rose-800/60 flex items-center justify-center text-white hover:bg-white/15 hover:ring-2 hover:ring-white/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress line */}
                <div className="flex-1 mx-4 h-0.5 bg-rose-950 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${((incidentIndex + 1) / Math.max(1, latestIncidents.length)) * 100}%`
                    }}
                    className="h-full bg-white transition-all duration-300"
                  />
                </div>

                {/* Index label */}
                <span className="text-xs font-mono-tech text-rose-300/80">
                  {incidentIndex + 1}/{latestIncidents.length || 1}
                </span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-2 relative z-10">
              <p className="font-heading text-lg font-bold text-white">NO RECENT INCIDENTS</p>
              <p className="text-xs text-rose-200/70 font-mono-tech">
                Traps are active and monitoring for deceptive credential access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
