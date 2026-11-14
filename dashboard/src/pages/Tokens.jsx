import React from "react";
import { KeyRound, Shield } from "lucide-react";
import { TokenForm } from "../components/TokenForm.jsx";
import { TokenList } from "../components/TokenList.jsx";
import { ErrorBanner } from "../components/ErrorBanner.jsx";
import { useAppData } from "../hooks/useAppData.js";

export function Tokens() {
  const {
    tokens,
    tokenHitCounts,
    tokenLastTriggered,
    loadingTokens,
    tokensError,
    createToken,
    refreshTokens,
    now
  } = useAppData();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#1F2B47] pb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#E6EDF7] tracking-tight">
            Honeytoken Decoy Management
          </h2>
        </div>
        <p className="text-xs text-[#8FA0BD] mt-1">
          Generate high-fidelity decoy credentials to plant across repositories, CI/CD pipelines, and configuration files.
        </p>
      </div>

      {/* Error banner if needed */}
      {tokensError && (
        <ErrorBanner
          title="Tokens Synchronization Error"
          message={tokensError}
          onRetry={refreshTokens}
        />
      )}

      {/* Generation Form */}
      <TokenForm onSubmit={createToken} error={tokensError} />

      {/* Active Traps Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#E6EDF7]">
              Deployed Decoy Inventory ({tokens.length})
            </h3>
          </div>
          <span className="text-xs text-[#8FA0BD] font-mono">
            {tokens.filter((t) => !t.revoked).length} Armed
          </span>
        </div>

        <TokenList
          tokens={tokens}
          tokenHitCounts={tokenHitCounts}
          tokenLastTriggered={tokenLastTriggered}
          loading={loadingTokens}
          now={now}
        />
      </div>
    </div>
  );
}

export default Tokens;

