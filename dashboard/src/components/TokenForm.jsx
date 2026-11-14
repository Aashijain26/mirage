import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, AlertTriangle, X, Cloud, Key, Database } from "lucide-react";
import { CopyButton } from "./CopyButton.jsx";

const TOKEN_TYPES = [
  {
    id: "aws",
    label: "AWS Access Key",
    description: "IAM credentials (AKIA...) for S3/STS traps",
    icon: Cloud
  },
  {
    id: "api_key",
    label: "API Key",
    description: "Bearer/Stripe style keys for code repos",
    icon: Key
  },
  {
    id: "db",
    label: "Database URI",
    description: "Postgres/MySQL connection string traps",
    icon: Database
  }
];

export function TokenForm({ onSubmit, loading = false, error = null }) {
  const [type, setType] = useState("aws");
  const [label, setLabel] = useState("");
  const [context, setContext] = useState("");
  const [inlineError, setInlineError] = useState(null);
  const [revealedToken, setRevealedToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineError(null);

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setInlineError("A descriptive label is required (max 60 chars).");
      return;
    }

    if (trimmedLabel.length > 60) {
      setInlineError("Label must be 60 characters or fewer.");
      return;
    }

    try {
      const response = await onSubmit({
        type,
        label: trimmedLabel,
        context: context.trim() || undefined
      });

      // Show one-time reveal panel
      if (response && response.value) {
        setRevealedToken({
          id: response.id,
          type,
          label: trimmedLabel,
          value: response.value,
          callback_url: response.callback_url
        });
        // Reset inputs
        setLabel("");
        setContext("");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to generate honeytoken trap.";
      setInlineError(message);
    }
  };

  const handleDismissReveal = () => {
    // Clear completely from component state - never stored anywhere
    setRevealedToken(null);
  };

  // Build .env format string
  const generateEnvString = () => {
    if (!revealedToken) return "";
    const lines = [];
    if (typeof revealedToken.value === "object" && revealedToken.value !== null) {
      Object.entries(revealedToken.value).forEach(([k, v]) => {
        lines.push(`${k}=${v}`);
      });
    } else {
      lines.push(`HONEYTOKEN_KEY=${revealedToken.value}`);
    }
    if (revealedToken.callback_url) {
      lines.push(`HONEYTOKEN_CALLBACK_URL=${revealedToken.callback_url}`);
    }
    return lines.join("\n");
  };

  return (
    <div className="space-y-4">
      {/* One-Time Reveal Modal / Alert Panel */}
      {revealedToken && (
        <div
          role="region"
          aria-label="One-Time Credential Reveal"
          className="p-5 rounded-xl border border-emerald-500/50 bg-[#111A2E] shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Warning */}
          <div className="flex items-start justify-between gap-3 border-b border-[#1F2B47] pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Honeytoken Trap Armed &amp; Generated
                </h4>
                <p className="text-xs text-[#8FA0BD] mt-0.5">
                  ID: <span className="font-mono text-emerald-400">{revealedToken.id}</span> — {revealedToken.label}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissReveal}
              aria-label="Dismiss one-time credential view"
              className="p-1 rounded-md text-[#8FA0BD] hover:text-white hover:bg-[#16213A] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="font-semibold">
              Shown once. Copy it now. For security, raw secrets will not be shown again.
            </span>
          </div>

          {/* Render Key-Value pairs */}
          <div className="space-y-2.5">
            {typeof revealedToken.value === "object" && revealedToken.value !== null ? (
              Object.entries(revealedToken.value).map(([key, val]) => (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0B1220] border border-[#1F2B47]"
                >
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {key}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-300 break-all select-all">
                      {String(val)}
                    </span>
                    <CopyButton textToCopy={String(val)} compact label={`Copy ${key}`} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1220] border border-[#1F2B47]">
                <span className="text-xs font-mono text-emerald-300 break-all select-all">
                  {String(revealedToken.value)}
                </span>
                <CopyButton textToCopy={String(revealedToken.value)} compact />
              </div>
            )}

            {/* Callback trap URL */}
            {revealedToken.callback_url && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0B1220] border border-[#1F2B47]">
                <span className="text-xs font-mono font-semibold text-slate-300">
                  TRAP_CALLBACK_URL
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-300 break-all select-all">
                    {revealedToken.callback_url}
                  </span>
                  <CopyButton textToCopy={revealedToken.callback_url} compact label="Copy Trap URL" />
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <CopyButton
              textToCopy={generateEnvString()}
              label="Copy all as .env"
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 font-semibold"
            />
            <button
              type="button"
              onClick={handleDismissReveal}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#16213A] hover:bg-[#1f2b47] text-[#E6EDF7] border border-[#1F2B47] transition-colors"
            >
              Done &amp; Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Generation Form */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-xl border border-[#1F2B47] bg-[#111A2E] space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[#1F2B47] pb-3">
          <KeyRound className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-[#E6EDF7]">Deploy New Honeytoken Trap</h3>
        </div>

        {/* Server or Inline Error */}
        {(inlineError || error) && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold">Creation Error: </span>
              <span>{inlineError || error}</span>
            </div>
          </div>
        )}

        {/* Token Type Selection */}
        <div>
          <label className="block text-xs font-medium text-[#8FA0BD] mb-2">
            Decoy Credential Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {TOKEN_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-[#16213A] border-emerald-500 text-[#E6EDF7] shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50"
                      : "bg-[#0B1220] border-[#1F2B47] text-[#8FA0BD] hover:border-[#2a3a5e] hover:text-[#E6EDF7]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? "text-emerald-400" : "text-[#8FA0BD]"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#E6EDF7]">{t.label}</span>
                    <span className="text-[11px] text-[#8FA0BD] mt-0.5">{t.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Label Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="token-label" className="text-xs font-medium text-[#8FA0BD]">
              Token Label <span className="text-red-400">*</span>
            </label>
            <span className="text-[11px] text-[#8FA0BD] font-mono">
              {label.length}/60
            </span>
          </div>
          <input
            id="token-label"
            type="text"
            required
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. github-ci-prod-aws or stripe-staging-key"
            className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#1F2B47] rounded-lg text-xs md:text-sm text-[#E6EDF7] placeholder-[#8FA0BD]/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Context Textarea */}
        <div>
          <label htmlFor="token-context" className="block text-xs font-medium text-[#8FA0BD] mb-1">
            Deployment Context <span className="text-[11px] text-[#8FA0BD]/70">(Optional)</span>
          </label>
          <textarea
            id="token-context"
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Where will you plant this? e.g. Left in public GitHub repo repo-service/.env or leaked in dev slack channel"
            className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#1F2B47] rounded-lg text-xs md:text-sm text-[#E6EDF7] placeholder-[#8FA0BD]/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !label.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-950/40 border border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Trap...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>Create Honeytoken</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TokenForm;

