import React, { useState } from "react";
import { Key, FileCode, Database, Archive, Trash2, RefreshCw, FlaskConical } from "lucide-react";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { CopyButton } from "../components/CopyButton.jsx";
import { useAppData } from "../hooks/useAppData.js";

const DECOY_TYPES = [
  {
    id: "ssh",
    label: "Fake SSH key",
    desc: "A private key that should never move",
    icon: Key,
    tag: "[01]"
  },
  {
    id: "env",
    label: "Fake .env",
    desc: "Credentials file left in the open",
    icon: FileCode,
    tag: "[02]"
  },
  {
    id: "db",
    label: "Fake DB dump",
    desc: "A dump nobody should download",
    icon: Database,
    tag: "[03]"
  },
  {
    id: "backup",
    label: "Fake backup",
    desc: "An archive worth poking at",
    icon: Archive,
    tag: "[04]"
  }
];

export function Decoys() {
  const {
    decoys, createDecoy, deleteDecoy, searchQuery, loadingDecoys, decoysError,
    automationStatus, leakResponseStatus, leakAlerts, leakAlertsError,
    checkLeakAlertsNow, createLeakDemoCases, refreshLeakAlerts, isMockMode
  } = useAppData();
  const [selectedType, setSelectedType] = useState("ssh");
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [path, setPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdDecoy, setCreatedDecoy] = useState(null);
  const [error, setError] = useState("");
  const [automationAction, setAutomationAction] = useState("");
  const [automationBusy, setAutomationBusy] = useState(false);

  const runLeakAction = async (action) => {
    setAutomationBusy(true);
    setAutomationAction("");
    try {
      const result = await action();
      const statuses = (result?.results || []).map((item) => item.status);
      setAutomationAction(statuses.length
        ? `Finished: ${statuses.join(", ")}`
        : `Finished: ${result?.status || "checked"}`);
      await refreshLeakAlerts();
    } catch (err) {
      setAutomationAction(err.message || "The GitHub action failed. Check backend logs.");
    } finally {
      setAutomationBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    setSubmitting(true);
    try {
      const created = await createDecoy({
        type: selectedType,
        label: label.trim(),
        host: host.trim() || "web-server-01",
        path: path.trim() || `/srv/app/${label.trim()}`
      });
      setCreatedDecoy(created);
      setError("");
      setLabel("");
      setHost("");
      setPath("");
    } catch (err) {
      setError(err.message || "Could not create decoy");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDecoys = decoys.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.label?.toLowerCase().includes(q) ||
      d.path?.toLowerCase().includes(q) ||
      d.host?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: PLANT A DECOY ================= */}
        <SpotlightCard className="lg:col-span-5 bg-[#111726] border border-[#1e2a40] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[01] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                PLANT A DECOY
              </h2>
            </div>
            <p className="text-xs text-[#8FA0BD]">
              Create a tracked honeytoken and record where you planted it. Mirage detects requests to its trap URL, not file reads.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 2x2 Grid of Chamfered Type Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {DECOY_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`clip-chamfer-tr p-3.5 text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between min-h-[96px] ${
                      isSelected
                        ? "bg-[#14231b] border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.2)] text-white scale-[1.02]"
                        : "bg-[#141d2f] border-[#202e47] text-[#8FA0BD] hover:border-blue-400/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono-tech text-[#64748b]">{t.tag}</span>
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#22c55e]" : "text-[#8FA0BD]"}`} />
                    </div>

                    <div className="mt-2">
                      <div className="font-bold text-xs text-white leading-tight">{t.label}</div>
                      <div className="text-[10px] text-[#64748b] mt-0.5 line-clamp-2 leading-tight">
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Field: Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Label</label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="id_rsa backup"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Field: Host */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="build-runner-03"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Field: Path */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Path</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/root/.ssh/id_rsa"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Neon Green Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            >
              {submitting ? "Creating..." : "Create tracked decoy"}
            </button>
            {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
            {createdDecoy && (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-3 space-y-2 text-xs text-emerald-100">
                <strong>{isMockMode ? "Demo record created in this browser session." : "Created. Copy this credential now; it will not be shown again."}</strong>
                {createdDecoy.value && <div className="flex items-start justify-between gap-2 break-all font-mono"><span>{typeof createdDecoy.value === "string" ? createdDecoy.value : JSON.stringify(createdDecoy.value)}</span><CopyButton compact label="Copy credential" textToCopy={typeof createdDecoy.value === "string" ? createdDecoy.value : JSON.stringify(createdDecoy.value)} /></div>}
                {createdDecoy.callback_url && <div className="flex items-start justify-between gap-2 break-all font-mono text-cyan-300"><span>Trap URL: {createdDecoy.callback_url}</span><CopyButton compact label="Copy trap URL" textToCopy={createdDecoy.callback_url} /></div>}
                <button type="button" onClick={() => setCreatedDecoy(null)} className="text-emerald-300 underline">Dismiss</button>
              </div>
            )}
          </form>
        </SpotlightCard>

        {/* ================= RIGHT COLUMN: PLANTED DECOYS ================= */}
        <SpotlightCard className="lg:col-span-7 bg-[#111726] border border-[#1e2a40] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[02] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                PLANTED DECOYS
              </h2>
            </div>
            <span className="text-xs font-mono-tech text-[#64748b]">
              {decoys.length} live
            </span>
          </div>

          <div className="rounded-lg border border-[#202e47] bg-[#0d1422] p-3 text-[11px] font-mono-tech text-[#8FA0BD]">
            <span className="text-white">GitHub auto-planting: </span>
            <span className={automationStatus.status === "planted" ? "text-emerald-400" : "text-amber-300"}>{automationStatus.status?.replaceAll("_", " ") || "checking"}</span>
            {automationStatus.repository && <span> · {automationStatus.repository}:{automationStatus.path}</span>}
            {automationStatus.status === "needs_configuration" && <span> · Add the GitHub settings to the backend environment and enable AUTO_PLANT_ENABLED.</span>}
            {automationStatus.status === "needs_public_https_url" && <span> · Set PUBLIC_BASE_URL to the deployed HTTPS backend URL.</span>}
          </div>

          <div className="rounded-lg border border-[#202e47] bg-[#0d1422] p-3 space-y-2 text-[11px] font-mono-tech text-[#8FA0BD]">
            <div>
              <span className="text-white">Leak-triggered planting: </span>
              <span className={leakResponseStatus.enabled && leakResponseStatus.configured ? "text-emerald-400" : "text-amber-300"}>
                {leakResponseStatus.status?.replaceAll("_", " ") || "checking"}
              </span>
              {leakResponseStatus.repository && <span> · {leakResponseStatus.repository}</span>}
            </div>
            <p>Same GitHub alert reuses its decoy. Each callback use adds a hit to that decoy.</p>
            {automationAction && <p className="text-cyan-300 break-words">{automationAction}</p>}
            <div className="flex flex-wrap gap-2">
              {leakResponseStatus.enabled && (
                <button type="button" disabled={automationBusy || isMockMode}
                  onClick={() => runLeakAction(checkLeakAlertsNow)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#334155] px-2.5 py-1.5 text-[10px] text-white hover:bg-white/5 disabled:opacity-50">
                  <RefreshCw className="h-3 w-3" /> Check GitHub now
                </button>
              )}
              {leakResponseStatus.demo_enabled && (
                <button type="button" disabled={automationBusy || isMockMode}
                  onClick={() => runLeakAction(createLeakDemoCases)}
                  className="inline-flex items-center gap-1.5 rounded border border-emerald-700 px-2.5 py-1.5 text-[10px] text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50">
                  <FlaskConical className="h-3 w-3" /> Create 3 safe demo cases
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#202e47] bg-[#0d1422] p-3 space-y-2">
            <div className="text-[11px] font-mono-tech text-white">GitHub leak log</div>
            {leakAlertsError && <p className="text-[10px] text-rose-400">{leakAlertsError}</p>}
            {leakAlerts.length === 0 && !leakAlertsError && (
              <p className="text-[10px] font-mono-tech text-[#64748b]">No GitHub alerts have been processed yet.</p>
            )}
            {leakAlerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="border-t border-[#202e47] pt-2 text-[10px] font-mono-tech text-[#8FA0BD] space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white">{alert.secret_type}</span>
                  {alert.is_demo && <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-300">SIMULATED</span>}
                  <span>· {alert.status}</span>
                  <span>· {alert.hits} hits</span>
                </div>
                <div className="break-all">Source: {alert.repository}:{alert.source_path || "unknown"}{alert.source_line ? `:${alert.source_line}` : ""}</div>
                <div className="break-all">Decoy: {alert.decoy_path}</div>
                {alert.callback_url && (
                  <div className="flex flex-wrap items-center gap-2 break-all">
                    <span>Callback: {alert.callback_url}</span>
                    <CopyButton compact label="Copy callback" textToCopy={alert.callback_url} />
                  </div>
                )}
                {alert.alert_url && <a className="text-cyan-300 underline" href={alert.alert_url} target="_blank" rel="noreferrer">Open GitHub alert</a>}
              </div>
            ))}
          </div>

          {/* Decoy List Items */}
          <div className="space-y-3.5">
            {decoysError && <p role="alert" className="text-xs text-rose-400">{decoysError}</p>}
            {loadingDecoys && (
              <div className="py-8 text-center text-xs font-mono-tech text-[#8FA0BD]">
                Loading decoys...
              </div>
            )}
            {!loadingDecoys && filteredDecoys.length === 0 && (
              <div className="py-8 text-center text-xs font-mono-tech text-[#8FA0BD]">
                No decoys have been registered yet.
              </div>
            )}
            {!loadingDecoys &&
              filteredDecoys.map((dec, idx) => {
              const hasHits = (dec.hits || 0) > 0;

              return (
                <div
                  key={dec.id || idx}
                  className="bg-[#141d2f] border border-[#202e47] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#38bdf8]/40 hover:bg-[#17233a] hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all duration-200"
                >
                  <div className="flex items-start gap-3 truncate">
                    <span className="text-[#64748b] text-xs font-mono-tech pt-0.5">
                      [{String(idx + 1).padStart(2, "0")}]
                    </span>

                    <span className="bg-teal-950/80 border border-teal-700/60 text-[#34d399] px-2 py-0.5 rounded-full text-[10px] font-mono-tech shrink-0 mt-0.5">
                      {dec.badge}
                    </span>

                    <div className="truncate">
                      <div className="font-bold text-white text-xs font-mono-tech truncate">
                        {dec.label}
                      </div>
                      <div className="text-[11px] font-mono-tech text-[#8FA0BD] truncate mt-0.5">
                        {dec.path}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`text-xs font-mono-tech ${
                        hasHits ? "text-[#fb923c] font-bold" : "text-[#64748b]"
                      }`}
                    >
                      {dec.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteDecoy(dec.id)}
                      className="text-[#64748b] hover:text-rose-400 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                      title="Delete decoy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
