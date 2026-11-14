import React, { useState } from "react";
import { Key, FileCode, Database, Archive, Trash2 } from "lucide-react";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
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
  const { decoys, createDecoy, deleteDecoy, searchQuery } = useAppData();
  const [selectedType, setSelectedType] = useState("ssh");
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [path, setPath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    setSubmitting(true);
    try {
      await createDecoy({
        type: selectedType,
        label: label.trim(),
        host: host.trim() || "web-server-01",
        path: path.trim() || `/srv/app/${label.trim()}`
      });
      setLabel("");
      setHost("");
      setPath("");
    } catch (err) {
      console.error(err);
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
              Files that look worth stealing. They are not.
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
              Plant decoy
            </button>
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

          {/* Decoy List Items */}
          <div className="space-y-3.5">
            {filteredDecoys.map((dec, idx) => {
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
