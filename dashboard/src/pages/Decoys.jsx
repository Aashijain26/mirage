import React, { useMemo, useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { CopyButton } from "../components/CopyButton.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Decoys() {
  const {
    tokens, decoys, createDecoy, deleteDecoy, searchQuery, loadingDecoys, decoysError
  } = useAppData();
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [path, setPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdDecoy, setCreatedDecoy] = useState(null);
  const [error, setError] = useState("");

  const availableTokens = useMemo(() => {
    const plantedTokenIds = new Set(decoys.map((decoy) => decoy.honeytoken_id));
    return tokens.filter((token) => !token.revoked && !plantedTokenIds.has(token.id));
  }, [tokens, decoys]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    setSubmitting(true);
    try {
      const created = await createDecoy({
        token_id: selectedTokenId,
        label: label.trim(),
        host: host.trim(),
        path: path.trim()
      });
      setCreatedDecoy(created);
      setError("");
      setSelectedTokenId("");
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
              First create a fake credential in Tokens. Then choose that same token here and record where you planted it. This step does not create another credential or another Trap URL.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Select the token you already created</label>
              <select
                required
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
                disabled={availableTokens.length === 0}
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white font-mono-tech disabled:opacity-60"
              >
                <option value="">Choose a token</option>
                {availableTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.label} · {token.type.toUpperCase()}{token.context ? ` · ${token.context}` : ""}
                  </option>
                ))}
              </select>
              {availableTokens.length === 0 && (
                <p className="text-[11px] text-[#8FA0BD]">
                  No unplaced tokens yet. <Link className="text-cyan-300 underline" to="/tokens">Create a token first</Link>.
                </p>
              )}
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
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Where are you planting it? (host or URL)</label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="build-runner-03 or https://your-site.example/api"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Field: Path */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Path (optional)</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/settings/integrations"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Neon Green Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            >
              {submitting ? "Saving..." : "Mark token as planted"}
            </button>
            {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
            {createdDecoy && (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-3 space-y-2 text-xs text-emerald-100">
                <strong>Placement saved. This is the same token and Trap URL you created in Tokens.</strong>
                {createdDecoy.callback_url && (
                  <div className="space-y-1 break-all font-mono text-cyan-300">
                    <div>Trap URL: {createdDecoy.callback_url}</div>
                    <div className="flex flex-wrap gap-3">
                      <a href={createdDecoy.callback_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white underline">
                        Open trap URL <ExternalLink className="h-3 w-3" />
                      </a>
                      <CopyButton compact label="Copy trap URL" textToCopy={createdDecoy.callback_url} />
                    </div>
                  </div>
                )}
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
              {decoys.filter((decoy) => decoy.active !== false).length} active
            </span>
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

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-xs font-mono-tech truncate">
                        {dec.label}
                      </div>
                      <div className="text-[11px] font-mono-tech text-[#8FA0BD] truncate mt-0.5">
                        {dec.path}
                      </div>
                      {dec.active && dec.callback_url && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono-tech">
                          <a href={dec.callback_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 underline">
                            Open trap URL <ExternalLink className="h-3 w-3" />
                          </a>
                          <CopyButton compact label="Copy trap URL" textToCopy={dec.callback_url} />
                          <span className="text-[#8FA0BD]">{dec.hits || 0} hits</span>
                        </div>
                      )}
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
