// Formatting and utility functions for Honeytoken Monitor

export const FLAG_DESCRIPTIONS = {
  "scripted": "Automated tooling detected in user agent",
  "tor": "Connection from a Tor exit node",
  "multi-token": "Probed multiple honeytokens",
  "burst": "Rapid burst of requests",
  "hosting-provider": "Origin is a hosting or datacenter network"
};

export function getFlagReadableText(flag) {
  if (!flag) return "";
  return FLAG_DESCRIPTIONS[flag] || flag;
}

export function getSeverityFromScore(score) {
  const num = typeof score === "number" ? score : parseInt(score, 10) || 0;
  if (num >= 60) return "high";
  if (num >= 30) return "medium";
  return "low";
}

export function formatRelativeTime(isoString, now = Date.now()) {
  if (!isoString) return "Never";
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return "Unknown";

  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSeconds < 45) return "Just now";
  if (diffSeconds < 90) return "1 min ago";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(isoString).toLocaleDateString();
}

export function formatFullTimestamp(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return `${d.toISOString().replace("T", " ").replace("Z", " UTC")}`;
}

export function truncateText(text, maxChars = 120) {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

/**
 * Mask sensitive credentials for the TokenList view
 */
export function maskCredential(val, type = "generic") {
  if (!val) return "••••••••••••";
  if (typeof val === "object") {
    // If it's an object of KEY: value, mask the main secret key
    const primaryKey = Object.keys(val).find(
      (k) =>
        k.includes("KEY") ||
        k.includes("SECRET") ||
        k.includes("URL") ||
        k.includes("PASSWORD")
    ) || Object.keys(val)[0];

    const secretStr = String(val[primaryKey] || "");
    return maskString(secretStr, type);
  }
  return maskString(String(val), type);
}

function maskString(str, type) {
  if (str.startsWith("AKIA")) {
    const end = str.slice(-4);
    return `AKIA${"•".repeat(12)}${end}`;
  }
  if (str.startsWith("sk_live_")) {
    const end = str.slice(-4);
    return `sk_live_${"•".repeat(16)}${end}`;
  }
  if (str.startsWith("postgres://")) {
    return "postgres://••••••••:••••••••@••••••••:5432/db";
  }
  if (str.length > 8) {
    return `${str.slice(0, 4)}${"•".repeat(8)}${str.slice(-4)}`;
  }
  return "••••••••••••";
}

