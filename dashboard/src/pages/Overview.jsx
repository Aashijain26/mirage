import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { Activity, BarChart2, ShieldAlert, ArrowRight } from "lucide-react";
import { StatsCards } from "../components/StatsCards.jsx";
import { ThreatMap } from "../components/ThreatMap.jsx";
import { Feed } from "../components/Feed.jsx";
import { ErrorBanner } from "../components/ErrorBanner.jsx";
import { useAppData } from "../hooks/useAppData.js";

// Custom dark Recharts tooltip
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 rounded-lg border border-[#1F2B47] bg-[#16213A] shadow-xl text-xs space-y-1">
        <p className="text-[#8FA0BD] font-medium">{label}</p>
        <p className="font-mono font-bold text-emerald-400">
          {payload[0].value} attack{payload[0].value === 1 ? "" : "s"}
        </p>
      </div>
    );
  }
  return null;
}

export function Overview() {
  const {
    events,
    tokens,
    tokenMap,
    recentEventIds,
    stats,
    loadingEvents,
    loadingTokens,
    eventsError,
    refreshEvents,
    now
  } = useAppData();

  // 1. Attacks per hour (last 24h buckets)
  const hourlyData = useMemo(() => {
    const buckets = [];
    const oneHourMs = 3600 * 1000;
    const nowHour = Math.floor(now / oneHourMs) * oneHourMs;

    for (let i = 23; i >= 0; i--) {
      const bucketStart = nowHour - i * oneHourMs;
      const bucketEnd = bucketStart + oneHourMs;
      const hourDate = new Date(bucketStart);
      const label = `${String(hourDate.getHours()).padStart(2, "0")}:00`;

      const count = events.filter((e) => {
        const t = new Date(e.ts).getTime();
        return t >= bucketStart && t < bucketEnd;
      }).length;

      buckets.push({ time: label, attacks: count });
    }
    return buckets;
  }, [events, now]);

  // 2. Top 5 source countries
  const topCountriesData = useMemo(() => {
    const counts = new Map();
    events.forEach((e) => {
      const country = e?.geo?.country || "Unknown";
      counts.set(country, (counts.get(country) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([country, count]) => ({ country, attacks: count }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 5);
  }, [events]);

  const isLoading = loadingEvents || loadingTokens;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Error banner if network/backend failed */}
      {eventsError && (
        <ErrorBanner
          title="Live Feed Telemetry Error"
          message={eventsError}
          onRetry={refreshEvents}
        />
      )}

      {/* 5 Stats Cards */}
      <StatsCards stats={stats} loading={isLoading} now={now} />

      {/* Charts Row: Hourly Cadence & Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Trend Chart */}
        <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#E6EDF7]">
                Attacks Per Hour (Last 24 Hours)
              </h3>
            </div>
            <span className="text-xs font-mono text-[#8FA0BD]">
              {events.length} total hits
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2B47" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#8FA0BD"
                  fontSize={10}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke="#8FA0BD"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="attacks"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attackGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Countries Bar Chart */}
        <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#E6EDF7]">
                Top 5 Source Countries
              </h3>
            </div>
            <span className="text-xs font-mono text-[#8FA0BD]">By Volume</span>
          </div>

          <div className="h-64 w-full">
            {topCountriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#8FA0BD]">
                No country telemetry recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountriesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2B47" vertical={false} />
                  <XAxis
                    dataKey="country"
                    stroke="#8FA0BD"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#8FA0BD"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="attacks"
                    fill="#38BDF8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Threat Map Card */}
      <ThreatMap events={events} />

      {/* Recent Suspicious Activity (Top 5 newest events) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#E6EDF7]">
              Recent Suspicious Decoy Activity
            </h3>
          </div>
          <Link
            to="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>View all in Live Feed</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <Feed
          events={events}
          tokenMap={tokenMap}
          recentEventIds={recentEventIds}
          loading={loadingEvents}
          compact={true}
          now={now}
        />
      </div>
    </div>
  );
}

export default Overview;

