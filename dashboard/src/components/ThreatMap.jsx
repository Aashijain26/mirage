import React, { useState, useMemo } from "react";
import worldData from "../assets/world-geometry.json";
import { getCountryCoordinates, projectCoordinates } from "../config/countryCoords.js";
import { Globe, ShieldAlert } from "lucide-react";

export function ThreatMap({ events = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Group events by country
  const countryClusters = useMemo(() => {
    const map = new Map();

    events.forEach((ev) => {
      const countryRaw = ev?.geo?.country;
      if (!countryRaw) return;

      const coords = getCountryCoordinates(countryRaw);
      if (!coords) return; // Skip missing countries silently as per spec

      const key = coords.name;
      const current = map.get(key) || {
        country: coords.name,
        lat: coords.lat,
        lng: coords.lng,
        hits: 0,
        maxScore: 0,
        latestIp: ev.ip,
        events: []
      };

      current.hits += 1;
      current.maxScore = Math.max(current.maxScore, ev.score || 0);
      current.events.push(ev);
      map.set(key, current);
    });

    return Array.from(map.values()).map((cluster) => {
      const { x, y } = projectCoordinates(cluster.lat, cluster.lng);
      return {
        ...cluster,
        x,
        y
      };
    });
  }, [events]);

  return (
    <div className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h3 className="text-base font-semibold text-[#E6EDF7]">Global Threat Distribution</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-[#8FA0BD]">High Risk (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-[#8FA0BD]">Medium (50-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            <span className="text-[#8FA0BD]">Low (&lt;50)</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[260px] w-full flex items-center justify-center bg-[#0B1220] rounded-lg border border-[#1F2B47]/60 overflow-hidden">
        {/* Subtle grid pattern for SOC aesthetic */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1F2B47 1px, transparent 1px), linear-gradient(to bottom, #1F2B47 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        <svg
          viewBox={worldData.viewBox || "0 0 1000 500"}
          className="w-full h-auto max-h-[380px] select-none"
          style={{ filter: "drop-shadow(0 0 12px rgba(11, 18, 32, 0.8))" }}
        >
          {/* Subtle latitude grid lines */}
          <line x1="0" y1="125" x2="1000" y2="125" stroke="#1F2B47" strokeDasharray="3 4" strokeWidth="0.75" />
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#1F2B47" strokeDasharray="5 5" strokeWidth="1" />
          <line x1="0" y1="375" x2="1000" y2="375" stroke="#1F2B47" strokeDasharray="3 4" strokeWidth="0.75" />
          {/* Longitude center line (Prime Meridian) */}
          <line x1="500" y1="0" x2="500" y2="500" stroke="#1F2B47" strokeDasharray="5 5" strokeWidth="1" />

          {/* Continents & Landmasses */}
          <g fill="#16213A" stroke="#1F2B47" strokeWidth="1.2">
            {worldData.landmasses.map((land, idx) => (
              <path key={idx} d={land.path} className="transition-colors hover:fill-[#1b2947]" />
            ))}
          </g>

          {/* Plotted Attack Clusters */}
          {countryClusters.map((cluster, idx) => {
            // Scale radius based on hit count: min 5, max 16
            const radius = Math.min(16, Math.max(5, 4 + Math.sqrt(cluster.hits) * 3));
            let color = "#22C55E";
            if (cluster.maxScore >= 70) color = "#EF4444";
            else if (cluster.maxScore >= 50) color = "#F59E0B";

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(cluster)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer animated radar pulse ring for high risk */}
                {cluster.maxScore >= 70 && (
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={radius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-ping"
                    style={{ transformOrigin: `${cluster.x}px ${cluster.y}px` }}
                  />
                )}
                {/* Outer halo */}
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={radius + 3}
                  fill={color}
                  opacity="0.25"
                />
                {/* Main cluster dot */}
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={radius}
                  fill={color}
                  stroke="#0B1220"
                  strokeWidth="1.5"
                  className="transition-transform group-hover:scale-125"
                  style={{ transformOrigin: `${cluster.x}px ${cluster.y}px` }}
                />
                {/* Hit count label inside dot if large enough */}
                {radius >= 8 && (
                  <text
                    x={cluster.x}
                    y={cluster.y + 3.5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {cluster.hits}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-lg border border-[#1F2B47] bg-[#16213A]/95 text-xs shadow-xl backdrop-blur-md"
            style={{
              top: Math.min(220, Math.max(20, (hoveredPoint.y / 500) * 260 - 20)),
              left: Math.min(
                340,
                Math.max(40, (hoveredPoint.x / 1000) * 450)
              )
            }}
          >
            <div className="flex items-center gap-2 mb-1.5 border-b border-[#1F2B47] pb-1">
              <ShieldAlert
                className={`w-4 h-4 ${
                  hoveredPoint.maxScore >= 70
                    ? "text-red-400"
                    : hoveredPoint.maxScore >= 50
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
                aria-hidden="true"
              />
              <span className="font-semibold text-white">{hoveredPoint.country}</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-[#8FA0BD]">Attack Hits:</span>
                <span className="font-mono font-bold text-white">{hoveredPoint.hits}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#8FA0BD]">Max Risk Score:</span>
                <span
                  className={`font-mono font-bold ${
                    hoveredPoint.maxScore >= 70
                      ? "text-red-400"
                      : hoveredPoint.maxScore >= 50
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {hoveredPoint.maxScore}/100
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#8FA0BD]">Latest IP:</span>
                <span className="font-mono text-slate-200">{hoveredPoint.latestIp}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#8FA0BD]">
        <span>Plotted via local offline coordinate centroids</span>
        <span>{countryClusters.length} active origin countries</span>
      </div>
    </div>
  );
}

export default ThreatMap;

