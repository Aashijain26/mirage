import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import worldData from "../assets/world-geometry.json";
import { getCountryCoordinates, projectCoordinates } from "../config/countryCoords.js";
import {
  ChevronDown,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  ExternalLink
} from "lucide-react";
import { SpotlightCard } from "./SpotlightCard.jsx";

export function ThreatMap({ events = [] }) {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState("7 days");
  const [selectedSource, setSelectedSource] = useState("All sources");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [center, setCenter] = useState({ x: 500, y: 250 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Derive attack points from actual live events
  const allPlottedPoints = useMemo(() => {
    if (!Array.isArray(events)) return [];

    const points = [];
    events.forEach((ev, idx) => {
      let coord = null;

      // 1. Check direct lat / lng
      if (ev.geo?.lat != null && ev.geo?.lng != null) {
        const lat = Number(ev.geo.lat);
        const lng = Number(ev.geo.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          coord = projectCoordinates(lat, lng);
        }
      } else if (ev.geo?.loc && typeof ev.geo.loc === "string" && ev.geo.loc.includes(",")) {
        // "lat,lng" string from some IP enrichment APIs
        const [latStr, lngStr] = ev.geo.loc.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          coord = projectCoordinates(lat, lng);
        }
      } else if (ev.geo?.country) {
        // 2. Documented country-level fallback only when country is known
        const countryName = String(ev.geo.country).trim().toLowerCase();
        if (
          countryName &&
          countryName !== "unknown" &&
          countryName !== "private network" &&
          countryName !== "localhost" &&
          countryName !== "n/a"
        ) {
          const countryCoord = getCountryCoordinates(countryName);
          if (countryCoord) {
            // Apply slight deterministic spread if multiple points share the same country
            const spreadOffset = ((idx % 5) - 2) * 4;
            coord = projectCoordinates(countryCoord.lat, countryCoord.lng);
            coord = { x: coord.x + spreadOffset, y: coord.y + spreadOffset };
          }
        }
      }

      // Never invent attacker locations if coordinates could not be resolved
      if (!coord) return;

      const isHigh = (ev.score ?? 0) >= 70;
      const isMed = (ev.score ?? 0) >= 50 && (ev.score ?? 0) < 70;
      const severity = ev.severity || (isHigh ? "high" : isMed ? "medium" : "low");

      const flags = Array.isArray(ev.flags) ? ev.flags : [];
      const isTor = Boolean(ev.geo?.proxy) || flags.includes("tor_exit");
      const isDc = Boolean(ev.geo?.hosting) || flags.includes("datacenter");
      const sourceType = isTor ? "Tor Relays" : isDc ? "Datacenters" : "Residential";

      points.push({
        id: ev.id ?? idx + 1,
        ip: ev.ip || "Unknown IP",
        city: ev.geo?.city || ev.geo?.country || "Known Origin",
        country: ev.geo?.country || "",
        token: ev.token_label || ev.token_id || "Honeytoken",
        score: ev.score ?? 0,
        severity,
        sourceType,
        x: Math.max(10, Math.min(990, coord.x)),
        y: Math.max(10, Math.min(490, coord.y)),
        pulse: isHigh,
        ts: ev.ts || ev.created_at
      });
    });

    return points;
  }, [events]);

  // Filter points based on selected source & time range
  const mapPoints = useMemo(() => {
    let pts = allPlottedPoints;

    // Filter by source
    if (selectedSource !== "All sources") {
      pts = pts.filter((p) => p.sourceType === selectedSource);
    }

    // Filter by time range
    const now = Date.now();
    const rangeMs =
      selectedRange === "24 hours"
        ? 24 * 3600 * 1000
        : selectedRange === "30 days"
        ? 30 * 86400 * 1000
        : 7 * 86400 * 1000;

    pts = pts.filter((p) => {
      if (!p.ts) return true;
      const t = new Date(p.ts).getTime();
      return isNaN(t) || now - t <= rangeMs;
    });

    return pts;
  }, [allPlottedPoints, selectedSource, selectedRange]);

  // Active highlighted attack (defaults to first available or selected)
  const [selectedPointId, setSelectedPointId] = useState(null);
  const activeIncident = useMemo(() => {
    if (mapPoints.length === 0) return null;
    if (selectedPointId != null) {
      const match = mapPoints.find((p) => p.id === selectedPointId);
      if (match) return match;
    }
    return mapPoints[0];
  }, [mapPoints, selectedPointId]);

  // Dynamic sparkline data responsive to selectedRange & live events
  const sparklineBars = useMemo(() => {
    const now = Date.now();
    const rangeMs =
      selectedRange === "24 hours"
        ? 24 * 3600 * 1000
        : selectedRange === "30 days"
        ? 30 * 86400 * 1000
        : 7 * 86400 * 1000;
    const binSize = rangeMs / 7;
    const bins = [0, 0, 0, 0, 0, 0, 0];

    events.forEach((e) => {
      const ts = e.ts || e.created_at;
      if (!ts) return;
      const t = new Date(ts).getTime();
      const diff = now - t;
      if (diff >= 0 && diff < rangeMs) {
        const binIndex = 6 - Math.min(6, Math.floor(diff / binSize));
        bins[binIndex] = (bins[binIndex] || 0) + 1;
      }
    });

    return bins;
  }, [events, selectedRange]);

  // Dynamic metrics for Speedometer Gauges - derived strictly from real events
  const highCount = useMemo(() => events.filter((e) => (e.score ?? 0) >= 70).length, [events]);
  const tokensHitCount = useMemo(() => new Set(events.map((e) => e.token_id || e.token_label).filter(Boolean)).size, [events]);

  // Calculate dynamic SVG viewBox for zooming & panning
  const currentViewBox = useMemo(() => {
    const width = 1000 / zoomLevel;
    const height = 500 / zoomLevel;
    const minX = Math.max(0, Math.min(1000 - width, center.x - width / 2));
    const minY = Math.max(0, Math.min(500 - height, center.y - height / 2));
    return `${minX} ${minY} ${width} ${height}`;
  }, [zoomLevel, center]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, Number((z + 0.5).toFixed(1))));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(1, Number((z - 0.5).toFixed(1)));
      if (next === 1) setCenter({ x: 500, y: 250 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setCenter({ x: 500, y: 250 });
  };

  const handleSelectPoint = (pt) => {
    setSelectedPointId(pt.id);
    // Smoothly focus on selected pin
    setCenter({ x: pt.x, y: pt.y });
    if (zoomLevel < 2) setZoomLevel(2.2);
  };

  // Preset region zooms
  const handlePresetRegion = (region) => {
    if (region === "europe") {
      setZoomLevel(2.5);
      setCenter({ x: 520, y: 130 });
    } else if (region === "americas") {
      setZoomLevel(2.0);
      setCenter({ x: 250, y: 180 });
    } else if (region === "asia") {
      setZoomLevel(2.0);
      setCenter({ x: 780, y: 190 });
    } else {
      handleResetZoom();
    }
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || zoomLevel <= 1) return;
    const dx = (e.clientX - dragStart.current.x) * (1 / zoomLevel);
    const dy = (e.clientY - dragStart.current.y) * (1 / zoomLevel);
    dragStart.current = { x: e.clientX, y: e.clientY };

    setCenter((prev) => ({
      x: Math.max(100, Math.min(900, prev.x - dx)),
      y: Math.max(50, Math.min(450, prev.y - dy))
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dynamic gauge geometry
  const highRatio = Math.min(1, Math.max(0, highCount / 20));
  const highAngle = (1 - highRatio) * Math.PI;
  const highX = 50 + 38 * Math.cos(highAngle);
  const highY = 48 - 38 * Math.sin(highAngle);

  const tokenRatio = Math.min(1, Math.max(0, tokensHitCount / 14));
  const tokenAngle = (1 - tokenRatio) * Math.PI;
  const tokenX = 50 + 38 * Math.cos(tokenAngle);
  const tokenY = 48 - 38 * Math.sin(tokenAngle);

  return (
    <SpotlightCard className="bg-[#111726] border border-[#1e2a40] rounded-2xl p-5 shadow-xl overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-tech text-[#8FA0BD]">[03] \\</span>
          <h3 className="font-heading text-lg font-bold text-white tracking-wide">LIVE MAP</h3>
          <span className="text-xs text-[#606d85] font-mono-tech ml-2">
            {mapPoints.length} markers plotted
          </span>
          {zoomLevel > 1 && (
            <span className="bg-blue-950/70 border border-blue-700/60 text-[#38bdf8] px-2 py-0.5 rounded-full text-[10px] font-mono-tech ml-1">
              {zoomLevel}x zoom
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono-tech">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span>▲</span>
            <span className="text-[#8FA0BD]">High</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span>●</span>
            <span className="text-[#8FA0BD]">Medium</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>●</span>
            <span className="text-[#8FA0BD]">Low</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls | Center Map | Right Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center min-h-[300px]">
        {/* Left Column: Interactive Dropdowns, Region Presets & Live Sparklines */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-4 py-2">
          {/* Time Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="w-full appearance-none bg-[#162035] border border-[#233554] rounded-lg px-3 py-1.5 text-xs text-white hover:border-[#3b82f6]/50 focus:outline-none focus:border-[#38bdf8] transition-colors cursor-pointer pr-8"
            >
              <option value="24 hours">24 hours</option>
              <option value="7 days">7 days</option>
              <option value="30 days">30 days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8FA0BD] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Source Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full appearance-none bg-[#162035] border border-[#233554] rounded-lg px-3 py-1.5 text-xs text-white hover:border-[#3b82f6]/50 focus:outline-none focus:border-[#38bdf8] transition-colors cursor-pointer pr-8"
            >
              <option value="All sources">All sources</option>
              <option value="Tor Relays">Tor Relays</option>
              <option value="Datacenters">Datacenters</option>
              <option value="Residential">Residential</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8FA0BD] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Quick Region Zoom Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono-tech text-[#8FA0BD] block uppercase tracking-wider">
              REGIONS
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono-tech">
              <button
                type="button"
                onClick={() => handlePresetRegion("global")}
                className="bg-[#141c2c] hover:bg-[#1e2c45] border border-[#1e2a40] text-gray-300 hover:text-white py-1 px-1.5 rounded-sm transition-colors text-center"
              >
                Global
              </button>
              <button
                type="button"
                onClick={() => handlePresetRegion("europe")}
                className="bg-[#141c2c] hover:bg-[#1e2c45] border border-[#1e2a40] text-gray-300 hover:text-white py-1 px-1.5 rounded-sm transition-colors text-center"
              >
                Europe
              </button>
              <button
                type="button"
                onClick={() => handlePresetRegion("americas")}
                className="bg-[#141c2c] hover:bg-[#1e2c45] border border-[#1e2a40] text-gray-300 hover:text-white py-1 px-1.5 rounded-sm transition-colors text-center"
              >
                Americas
              </button>
              <button
                type="button"
                onClick={() => handlePresetRegion("asia")}
                className="bg-[#141c2c] hover:bg-[#1e2c45] border border-[#1e2a40] text-gray-300 hover:text-white py-1 px-1.5 rounded-sm transition-colors text-center"
              >
                Asia-Pac
              </button>
            </div>
          </div>

          {/* Sparkline 1: HITS / DAY */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono-tech text-[#8FA0BD] tracking-wider block uppercase">
              HITS / DAY
            </span>
            <div className="flex items-end gap-1.5 h-8">
              {sparklineBars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${(h / 30) * 100}%` }}
                  className="w-1.5 bg-gradient-to-t from-blue-500 to-[#38bdf8] rounded-xs shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-all duration-300"
                />
              ))}
            </div>
          </div>

          {/* Sparkline 2: PEAK LOAD */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono-tech text-[#8FA0BD] tracking-wider block uppercase">
              PEAK LOAD
            </span>
            <svg viewBox="0 0 80 24" className="w-24 h-6 overflow-visible">
              <path
                d="M 0 18 Q 20 16 35 17 T 55 10 T 80 4"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Center: Dotted Map Container with Dynamic Zoom & Pan */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`lg:col-span-8 relative bg-[#0a0f18] rounded-xl border border-[#1b273d] p-2 min-h-[300px] flex items-center justify-center overflow-hidden select-none ${
            zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
        >
          {/* Zoom Controls Floating Pill */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-[#101726]/90 border border-[#1e2a40] rounded-xl p-1 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset view (Fit all)"
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#38bdf8] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* SVG Map Canvas with Responsive ViewBox */}
          <svg
            viewBox={currentViewBox}
            className="w-full h-auto max-h-[350px] transition-[viewBox] duration-300 ease-out select-none"
          >
            <defs>
              {/* Dot pattern in matrix green */}
              <pattern id="dot-pattern" width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="4.5" cy="4.5" r="1.6" fill="#10b981" opacity="0.65" />
              </pattern>

              {/* Mask made of world landmass paths */}
              <mask id="world-mask">
                <rect width="1000" height="500" fill="black" />
                {worldData.landmasses.map((lm, i) => (
                  <path key={i} d={lm.path} fill="white" />
                ))}
              </mask>

              {/* Pulse animation keyframes */}
              <style>{`
                @keyframes radar-pulse {
                  0% { r: 6px; opacity: 0.85; stroke-width: 1.5px; }
                  100% { r: 36px; opacity: 0; stroke-width: 0.5px; }
                }
                .pulse-ring {
                  animation: radar-pulse 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
                }
              `}</style>
            </defs>

            {/* Dotted Continents */}
            <rect width="1000" height="500" fill="url(#dot-pattern)" mask="url(#world-mask)" />

            {/* Attack points with White Translucent Hover Circle & Click-to-Inspect */}
            {mapPoints.map((pt, i) => {
              const isHigh = pt.severity === "high";
              const isMed = pt.severity === "medium";
              const color = isHigh ? "#ef4444" : isMed ? "#f97316" : "#22c55e";
              const isHovered = hoveredPoint === i;
              const isSelected = activeIncident?.ip === pt.ip;

              return (
                <g
                  key={pt.id || i}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPoint(pt);
                  }}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer group"
                >
                  {/* Selected / Hovered White Translucent Circle */}
                  {(isHovered || isSelected) && (
                    <circle
                      cx="0"
                      cy="0"
                      r="16"
                      fill="rgba(255, 255, 255, 0.18)"
                      stroke={isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.45)"}
                      strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                  )}

                  {/* Radar pulse on high severity targets */}
                  {pt.pulse && (
                    <>
                      <circle cx="0" cy="0" r="16" fill="none" stroke="#f97316" className="pulse-ring" />
                      <circle
                        cx="0"
                        cy="0"
                        r="28"
                        fill="none"
                        stroke="#ef4444"
                        className="pulse-ring"
                        style={{ animationDelay: "0.7s" }}
                      />
                    </>
                  )}

                  {/* Marker shape */}
                  {isHigh ? (
                    <polygon
                      points="0,-7 6,4 -6,4"
                      fill={color}
                      className="transition-transform duration-200 hover:scale-125"
                    />
                  ) : (
                    <circle
                      cx="0"
                      cy="0"
                      r="4.5"
                      fill={color}
                      stroke="#0a0f18"
                      strokeWidth="1"
                      className="transition-transform duration-200 hover:scale-125"
                    />
                  )}
                </g>
              );
            })}

            {/* Empty state when no geolocated threat events exist */}
            {mapPoints.length === 0 && (
              <g transform="translate(500, 250)">
                <rect
                  x="-180"
                  y="-35"
                  width="360"
                  height="70"
                  rx="10"
                  fill="#0b1322"
                  fillOpacity="0.88"
                  stroke="#1e3a5f"
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  y="-6"
                  fill="#f1f5f9"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="1.5"
                >
                  NO GEOLOCATED THREATS RECORDED
                </text>
                <text
                  textAnchor="middle"
                  y="18"
                  fill="#8FA0BD"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Traps armed · Telemetry listening for triggers
                </text>
              </g>
            )}
          </svg>

          {/* Floating SUSPICIOUS ACTIVITY Card (Actively responsive to selected pin!) */}
          <div className="absolute top-3 right-3 sm:right-5 w-68 bg-[#0f172a]/95 border border-[#1e3a5f] rounded-xl p-3.5 shadow-2xl backdrop-blur-md z-10 transition-all">
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#38bdf8] uppercase tracking-wider mb-1.5">
              <span>SUSPICIOUS ACTIVITY</span>
              <AlertCircle className={`w-3.5 h-3.5 ${activeIncident ? "text-amber-400" : "text-slate-500"}`} />
            </div>

            {activeIncident ? (
              <>
                {/* Currently Selected Pin Details */}
                <div className="border-b border-[#1e2a40] pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold font-mono-tech text-white">
                      {activeIncident.ip}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/incidents/${activeIncident.id || 1}`)}
                      title="Inspect Incident"
                      className="text-[#38bdf8] hover:text-white p-1 rounded-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8FA0BD] truncate mt-0.5">
                    {activeIncident.city} ·{" "}
                    <span className="text-[#38bdf8]">{activeIncident.token}</span> · score{" "}
                    {activeIncident.score}
                  </p>
                </div>

                {/* List of other recent hits */}
                <div className="space-y-1.5 text-xs font-mono-tech">
                  {mapPoints
                    .filter((pt) => pt.id !== activeIncident.id)
                    .slice(0, 3)
                    .map((pt, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => handleSelectPoint(pt)}
                        className={`flex items-center justify-between px-1.5 py-1 rounded-sm cursor-pointer transition-colors ${
                          activeIncident.ip === pt.ip
                            ? "bg-blue-950/70 border border-blue-700/50 text-white"
                            : "text-[#cbd5e1] hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {pt.severity === "high" ? (
                            <span className="text-rose-400 text-[10px] leading-none shrink-0">▲</span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          )}
                          <span className="truncate">{pt.ip}</span>
                        </div>
                        <span className="text-[11px] text-[#64748b]">{pt.city}</span>
                      </div>
                    ))}
                  {mapPoints.length <= 1 && (
                    <div className="text-[11px] text-[#64748b] italic py-1">
                      No other geolocated hits
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs font-mono-tech text-white font-bold">No Active Threats</p>
                <p className="text-[11px] font-mono-tech text-[#8FA0BD] mt-1">
                  Awaiting token telemetry
                </p>
              </div>
            )}
          </div>

          {/* Bottom Floating Pill with icons & quick reset */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#101726]/90 border border-[#1e2a40] rounded-full px-3 py-1 flex items-center gap-2.5 shadow-lg text-xs z-10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[#8FA0BD] text-[11px]">🏷️ Decoys</span>
            <span className="text-emerald-400 text-[11px]">📡 Live Telemetry</span>
          </div>
        </div>

        {/* Right Column: Speedometer Gauges with Dynamic Needles */}
        <div className="lg:col-span-2 flex flex-col justify-around gap-4 items-center py-1">
          {/* Gauge 1: High incidents (orange) */}
          <div
            onClick={() => navigate("/incidents")}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative w-28 h-18 flex items-end justify-center">
              {/* White translucent circle on hover */}
              <div className="absolute -inset-1 rounded-full bg-white/0 group-hover:bg-white/10 group-hover:ring-2 group-hover:ring-white/20 transition-all duration-300 pointer-events-none" />
              <svg viewBox="0 0 100 55" className="w-28 h-16">
                <path
                  d="M 12 48 A 38 38 0 0 1 88 48"
                  fill="none"
                  stroke="#1c2538"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d={highRatio > 0 ? `M 12 48 A 38 38 0 0 1 ${highX.toFixed(1)} ${highY.toFixed(1)}` : "M 12 48 A 38 38 0 0 1 12 48"}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <line
                  x1="50"
                  y1="48"
                  x2={highX.toFixed(1)}
                  y2={highY.toFixed(1)}
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <circle cx="50" cy="48" r="3.5" fill="white" />
              </svg>
              <div className="absolute bottom-1 font-heading text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                {highCount}
              </div>
            </div>
            <span className="text-[11px] font-mono-tech text-[#8FA0BD] text-center mt-1 group-hover:text-white transition-colors">
              {highCount} High incident{highCount === 1 ? "" : "s"}
            </span>
          </div>

          {/* Gauge 2: Tokens hit (green) */}
          <div
            onClick={() => navigate("/tokens")}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative w-28 h-18 flex items-end justify-center">
              {/* White translucent circle on hover */}
              <div className="absolute -inset-1 rounded-full bg-white/0 group-hover:bg-white/10 group-hover:ring-2 group-hover:ring-white/20 transition-all duration-300 pointer-events-none" />
              <svg viewBox="0 0 100 55" className="w-28 h-16">
                <path
                  d="M 12 48 A 38 38 0 0 1 88 48"
                  fill="none"
                  stroke="#1c2538"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d={tokenRatio > 0 ? `M 12 48 A 38 38 0 0 1 ${tokenX.toFixed(1)} ${tokenY.toFixed(1)}` : "M 12 48 A 38 38 0 0 1 12 48"}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <line
                  x1="50"
                  y1="48"
                  x2={tokenX.toFixed(1)}
                  y2={tokenY.toFixed(1)}
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <circle cx="50" cy="48" r="3.5" fill="white" />
              </svg>
              <div className="absolute bottom-1 font-heading text-2xl font-bold text-white group-hover:scale-110 transition-transform">
                {tokensHitCount}
              </div>
            </div>
            <span className="text-[11px] font-mono-tech text-[#8FA0BD] text-center mt-1 group-hover:text-white transition-colors">
              {tokensHitCount} Token{tokensHitCount === 1 ? "" : "s"} hit
            </span>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
