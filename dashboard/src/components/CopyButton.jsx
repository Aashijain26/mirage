import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ textToCopy, label = "Copy", compact = false, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(String(textToCopy));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      try {
        const textarea = document.createElement("textarea");
        textarea.value = String(textToCopy);
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {
        console.error("Failed to copy text");
      }
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : label}
        title={copied ? "Copied!" : label}
        className={`p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${className}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="text-emerald-400 font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default CopyButton;

