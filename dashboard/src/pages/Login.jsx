import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MirageLogo } from "../components/MirageLogo.jsx";
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#4a1220] via-[#240811] to-[#120308] text-white flex flex-col items-center justify-center p-4">
      {/* Translucent floating square frames for background depth */}
      <div className="absolute top-16 left-12 w-48 h-48 border border-white/5 rotate-12 pointer-events-none" />
      <div className="absolute bottom-24 right-16 w-72 h-72 border border-white/5 -rotate-6 pointer-events-none" />
      <div className="absolute top-1/2 left-20 w-36 h-36 border border-white/5 rotate-45 pointer-events-none" />
      <div className="absolute bottom-12 left-16 w-24 h-24 border border-white/5 rotate-12 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Brand Mark */}
        <MirageLogo className="w-10 h-10 mb-3" />

        {/* Title */}
        <h1 className="font-heading text-3xl font-black tracking-[0.4em] text-white select-none">
          MIRAGE
        </h1>

        {/* Subtitle */}
        <p className="text-[10px] font-mono-tech tracking-[0.25em] text-rose-200/60 uppercase mt-1 mb-8">
          HONEYTOKEN MONITORING
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-mono-tech text-[#cbd5e1]">
              Admin token
            </label>
            <input
              type="password"
              required
              autoFocus
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#161822]/90 border-2 border-[#22c55e] focus:outline-none rounded-full px-5 py-3 text-sm text-white placeholder-gray-500 shadow-[0_0_18px_rgba(34,197,94,0.18)] font-mono transition-all"
            />
          </div>

          {errorMessage && (
            <div className="text-xs font-mono-tech text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-xl px-4 py-2">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-sm py-3 rounded-full shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer mt-2"
          >
            {loading ? "Verifying..." : "Sign in"}
          </button>
        </form>

        {/* Footer Watermark */}
        <div className="mt-12 text-[10px] font-mono-tech tracking-[0.25em] text-rose-300/40 uppercase">
          MIRAGE / DECOY-WATCH
        </div>
      </div>
    </div>
  );
}
