import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, AlertCircle, ArrowRight } from "lucide-react";
import { checkHealth } from "../api.js";
import { setAuthToken } from "../utils/auth.js";

export function Login() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setErrorMessage("Token cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await checkHealth(trimmed);
      setAuthToken(trimmed);
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E6EDF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-[#1F2B47] bg-[#111A2E] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Shield className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Honeytoken Monitor SOC
          </h1>
          <p className="text-xs text-[#8FA0BD]">
            Administrative intrusion detection &amp; decoy telemetry console
          </p>
        </div>

        {/* Inline Error Message */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold">Authentication Alert: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-token"
              className="block text-xs font-medium text-[#8FA0BD] mb-1.5"
            >
              Admin Token
            </label>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 text-[#8FA0BD] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="admin-token"
                type="password"
                required
                autoComplete="current-password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter admin bearer token"
                className="w-full pl-9 pr-4 py-2.5 bg-[#0B1220] border border-[#1F2B47] rounded-lg text-sm text-[#E6EDF7] placeholder-[#8FA0BD]/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-[#8FA0BD]/70 mt-1">
              Token is verified against the backend and retained in sessionStorage.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-950/40 border border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Authorization...</span>
              </>
            ) : (
              <>
                <span>Connect</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-[#1F2B47]/60">
          <span className="text-[11px] text-[#8FA0BD] font-mono">
            Antigravity SOC Defense Protocol &bull; Strict Bearer Isolation
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;

