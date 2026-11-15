import React, { useState } from "react";
import { Cloud, Key, Webhook, Trash2 } from "lucide-react";
import { SpotlightCard } from "../components/SpotlightCard.jsx";
import { CopyButton } from "../components/CopyButton.jsx";
import { useAppData } from "../hooks/useAppData.js";

const TOKEN_TYPES = [
  {
    id: "aws",
    label: "AWS key",
    desc: "AKIA-style access keys",
    icon: Cloud,
    tag: "[01]"
  },
  {
    id: "api_key",
    label: "API key",
    desc: "Bearer tokens for internal APIs",
    icon: Key,
    tag: "[02]"
  },
  {
    id: "webhook",
    label: "Webhook",
    desc: "A URL that wakes up when touched",
    icon: Webhook,
    tag: "[03]"
  }
];

export function Tokens() {
  const { tokens, createToken, deleteToken, searchQuery, tokensError, isMockMode } = useAppData();
  const [selectedType, setSelectedType] = useState("aws");
  const [name, setName] = useState("");
  const [whereItLives, setWhereItLives] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [createError, setCreateError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const created = await createToken({
        type: selectedType,
        label: name.trim(),
        context: whereItLives.trim()
      });
      setCreatedToken(created);
      setCreateError("");
      setName("");
      setWhereItLives("");
    } catch (err) {
      setCreateError(err.message || "Could not create token");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTokens = tokens.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.label?.toLowerCase().includes(q) ||
      t.context?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: PLANT A TOKEN ================= */}
        <SpotlightCard className="lg:col-span-5 bg-[#111726] border border-[#1e2a40] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[01] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                CREATE A TOKEN
              </h2>
            </div>
            <p className="text-xs text-[#8FA0BD]">
              Generate the fake credential and Trap URL here. Then select this token in Decoys to record where you planted it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 3 Horizontal Chamfered Type Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {TOKEN_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`clip-chamfer-tr p-3 text-left transition-all duration-200 border cursor-pointer flex flex-col justify-between min-h-[92px] ${
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

            {/* Field: Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="prod-repo-aws"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Field: Where it lives */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono-tech text-[#cbd5e1]">Where it lives</label>
              <input
                type="text"
                required
                value={whereItLives}
                onChange={(e) => setWhereItLives(e.target.value)}
                placeholder="github.com/acme/payments-service"
                className="w-full bg-[#141d2f] border border-[#202e47] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#606d85] font-mono-tech transition-colors shadow-inner"
              />
            </div>

            {/* Neon Green Action Button with Glow */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            >
              {submitting ? "Creating..." : "Create token"}
            </button>
            {!isMockMode && <p className="text-[11px] text-[#64748b]">The raw secret is only returned at creation. Store it now; the server keeps only its hash.</p>}
            {createError && <p role="alert" className="text-xs text-rose-400">{createError}</p>}
            {createdToken && (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-3 space-y-2 text-xs text-emerald-100">
                <strong>Copy this credential now. The secret is not stored in readable form and cannot be shown again.</strong>
                <div className="flex items-start justify-between gap-2"><pre className="whitespace-pre-wrap break-all font-mono">{JSON.stringify(createdToken.value, null, 2)}</pre><CopyButton compact label="Copy credential" textToCopy={typeof createdToken.value === "string" ? createdToken.value : JSON.stringify(createdToken.value, null, 2)} /></div>
                {createdToken.callback_url && <div className="flex items-start justify-between gap-2 break-all font-mono text-cyan-300"><span>Trap URL: {createdToken.callback_url}</span><CopyButton compact label="Copy trap URL" textToCopy={createdToken.callback_url} /></div>}
                <button type="button" onClick={() => setCreatedToken(null)} className="text-emerald-300 underline">Dismiss</button>
              </div>
            )}

            {/* Footnote */}
            <p className="text-[11px] text-[#64748b] leading-relaxed">
              A hit is recorded when a request reaches this token's Trap URL or AWS endpoint. Creating or storing the credential alone does not trigger an event.
            </p>
          </form>
        </SpotlightCard>

        {/* ================= RIGHT COLUMN: PLANTED TOKENS ================= */}
        <SpotlightCard className="lg:col-span-7 bg-[#111726] border border-[#1e2a40] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-tech text-[#8FA0BD]">[02] \\</span>
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                TOKENS CREATED
              </h2>
            </div>
            <span className="text-xs font-mono-tech text-[#64748b]">
              {tokens.length} armed
            </span>
          </div>

          {/* Token List Items */}
          <div className="space-y-3.5">
            {tokensError && <p role="alert" className="text-xs text-rose-400">{tokensError}</p>}
            {filteredTokens.map((tok, idx) => {
              const badgeLabel =
                tok.type === "aws" ? "AWS KEY" : tok.type === "webhook" ? "WEBHOOK" : tok.type === "db" ? "DB TOKEN" : "API KEY";
              const hasHits = (tok.hits || 0) > 0;
              const hitPercent = Math.min(100, Math.max(15, ((tok.hits || 0) / 28) * 100));

              return (
                <div
                  key={tok.id || idx}
                  className="bg-[#141d2f] border border-[#202e47] rounded-xl p-4 space-y-2.5 hover:border-[#38bdf8]/40 hover:bg-[#17233a] hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all duration-200"
                >
                  {/* Top line */}
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[#64748b]">[{String(idx + 1).padStart(2, "0")}]</span>
                      <span className="font-bold text-white text-xs truncate">{tok.label}</span>
                      <span className="bg-teal-950/80 border border-teal-700/60 text-[#34d399] px-2 py-0.5 rounded-full text-[10px]">
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[#64748b] text-[11px] hidden sm:inline">
                        {tok.type === "aws" ? "AKIA… (shown once at creation)" : "Secret shown once at creation"}
                      </span>
                      {hasHits ? (
                        <span className="text-[#fb923c] font-bold text-xs">
                          {tok.hits} hits
                        </span>
                      ) : (
                        <span className="text-[#64748b] text-xs">Untouched</span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteToken(tok.id)}
                        className="text-[#64748b] hover:text-rose-400 p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        title="Revoke token"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Context / Location */}
                  <div className="text-[11px] font-mono-tech text-[#8FA0BD] truncate">
                    {tok.context || "Unspecified location"}
                  </div>

                  {/* Hit Progress Bar */}
                  {hasHits ? (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-[#0d1422] rounded-full flex overflow-hidden">
                        <div style={{ width: `${hitPercent}%` }} className="h-full bg-[#f97316]" />
                        <div className="flex-1 h-full bg-hazard-stripes-dark" />
                      </div>
                      <div className="text-[10px] font-mono-tech text-[#8FA0BD]">
                        Hit {tok.hits} times{tok.last_hit ? `, last ${Number.isNaN(new Date(tok.last_hit).getTime()) ? tok.last_hit : new Date(tok.last_hit).toLocaleString()}` : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono-tech text-[#64748b] pt-1">
                      Untouched
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTokens.length === 0 && (
              <div className="py-8 text-center text-xs font-mono-tech text-[#8FA0BD]">
                No planted honeytokens found.
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
