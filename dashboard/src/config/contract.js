// Centralized Team Architecture Assumptions, Data Contracts, and Normalizers
// All assumed backend shapes, flags, severity thresholds, and normalizers are isolated here.

export const SEVERITY_THRESHOLDS = {
  LOW_MAX: 49,
  MEDIUM_MIN: 50,
  MEDIUM_MAX: 69,
  HIGH_MIN: 70
};

export const SEVERITY_RANKS = {
  low: 1,
  medium: 2,
  high: 3
};

export const FLAG_DESCRIPTIONS = {
  scripted_ua: "Automated tooling detected in user agent",
  suspicious_request: "Reconnaissance path, hosting or proxy origin, rapid requests, or off-hours activity",
  multi_token_probe: "Probed multiple honeytokens within 10 minutes",
  hosting_ip: "Origin is a hosting or datacenter network",
  proxy_ip: "Origin is a known proxy or VPN",
  rapid_fire: "5 or more requests within 60 seconds",
  off_hours: "Activity between 00:00 and 05:00 UTC"
};

export const BASE_SCORE_EXPLANATION =
  "Base score 40: any use of a honeytoken is suspicious";

export const FLAG_SCORE_POINTS = {
  scripted_ua: 15,
  suspicious_request: 15,
  multi_token_probe: 25,
  hosting_ip: 0,
  proxy_ip: 0,
  rapid_fire: 0,
  off_hours: 0
};

export const AI_BEHAVIOR_LABELS = {
  scripted_scan: "Scripted scan",
  manual_probe: "Manual probe",
  credential_test: "Credential test",
  unclear: "Unclear"
};

export const TOKEN_TYPES = {
  AWS: "aws",
  API_KEY: "api_key",
  WEBHOOK: "webhook"
};

/**
 * Derive severity from numerical score if server severity is missing.
 * < 50 = low, 50 to 69 = medium, 70 and above = high.
 */
export function deriveSeverityFromScore(score) {
  const num = typeof score === "number" ? score : parseInt(score, 10) || 0;
  if (num >= SEVERITY_THRESHOLDS.HIGH_MIN) return "high";
  if (num >= SEVERITY_THRESHOLDS.MEDIUM_MIN) return "medium";
  return "low";
}

/**
 * Resolves severity: server is source of truth, fallback to score calculation.
 */
export function resolveSeverity(incident) {
  if (!incident) return "low";
  if (incident.severity) {
    const s = String(incident.severity).toLowerCase();
    if (s === "high" || s === "medium" || s === "low") {
      return s;
    }
  }
  return deriveSeverityFromScore(incident.score);
}

/**
 * Human-readable flag description. Unknown flags render as raw text.
 */
export function getFlagDescription(flag) {
  if (!flag) return "";
  const key = String(flag).toLowerCase().trim();
  return FLAG_DESCRIPTIONS[key] || flag;
}

/**
 * Safely normalize a single event within an incident
 */
export function normalizeIncidentEvent(raw, defaultTs = new Date().toISOString()) {
  if (!raw) return null;
  return {
    id: raw.id ?? Math.floor(Math.random() * 100000),
    ts: raw.ts || raw.timestamp || defaultTs,
    method: raw.method ? String(raw.method).toUpperCase() : "GET",
    path: raw.path ? String(raw.path) : "/",
    ua: raw.ua || raw.user_agent || "Unknown user agent",
    headers: typeof raw.headers === "object" && raw.headers !== null ? raw.headers : {}
  };
}

/**
 * Safely normalize an AI summary object
 */
export function normalizeSummary(raw) {
  if (!raw || typeof raw !== "object") return null;
  const behaviorRaw = String(raw.behavior || "unclear").toLowerCase();
  const validBehavior = AI_BEHAVIOR_LABELS[behaviorRaw] ? behaviorRaw : "unclear";

  return {
    summary: raw.summary ? String(raw.summary) : "",
    behavior: validBehavior,
    recommended_actions: Array.isArray(raw.recommended_actions)
      ? raw.recommended_actions.map(String)
      : []
  };
}

/**
 * Safely normalize a single incident from backend or mock
 */
export function normalizeIncident(raw) {
  if (!raw || typeof raw !== "object") return null;

  const score = typeof raw.score === "number" ? raw.score : parseInt(raw.score, 10) || 40;
  const severity = raw.severity
    ? String(raw.severity).toLowerCase()
    : deriveSeverityFromScore(score);

  // Normalize flags case-insensitively
  const flags = Array.isArray(raw.flags)
    ? raw.flags.map((f) => String(f).toLowerCase().trim()).filter(Boolean)
    : [];

  // Normalize raw events
  const defaultTs = raw.last_seen || raw.first_seen || new Date().toISOString();
  const events = Array.isArray(raw.events)
    ? raw.events.map((e) => normalizeIncidentEvent(e, defaultTs)).filter(Boolean)
    : [];

  const firstSeen = raw.first_seen || (events[0] ? events[0].ts : defaultTs);
  const lastSeen = raw.last_seen || (events[events.length - 1] ? events[events.length - 1].ts : defaultTs);
  const eventCount = typeof raw.event_count === "number" ? raw.event_count : Math.max(1, events.length);

  return {
    id: raw.id,
    token_id: raw.token_id ? String(raw.token_id) : "unknown-token",
    token_label: raw.token_label ? String(raw.token_label) : undefined,
    token_type: raw.token_type ? String(raw.token_type) : undefined,
    ip: raw.ip ? String(raw.ip) : "Unknown IP",
    geo: {
      city: raw.geo?.city ? String(raw.geo.city) : "",
      country: raw.geo?.country ? String(raw.geo.country) : "Unknown",
      isp: raw.geo?.isp ? String(raw.geo.isp) : "",
      as: raw.geo?.as ? String(raw.geo.as) : "",
      org: raw.geo?.org ? String(raw.geo.org) : "",
      proxy: Boolean(raw.geo?.proxy),
      hosting: Boolean(raw.geo?.hosting)
    },
    score,
    severity,
    flags,
    event_count: eventCount,
    first_seen: firstSeen,
    last_seen: lastSeen,
    events,
    summary: normalizeSummary(raw.summary)
  };
}

/**
 * Normalize list of incidents (handles array or wrapper object)
 */
export function normalizeIncidentsList(data) {
  if (!data) return [];
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.incidents)) {
    list = data.incidents;
  } else if (Array.isArray(data.items)) {
    list = data.items;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  }
  return list.map(normalizeIncident).filter(Boolean);
}

/**
 * Normalize list of tokens
 */
export function normalizeTokensList(data) {
  if (!data) return [];
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.tokens)) {
    list = data.tokens;
  } else if (Array.isArray(data.items)) {
    list = data.items;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  }
  return list.map((t) => ({
    id: String(t.id),
    type: t.type ? String(t.type) : "api_key",
    label: t.label ? String(t.label) : String(t.id),
    value: t.value || {},
    callback_url: t.callback_url || "",
    created_at: t.created_at || new Date().toISOString(),
    revoked: Boolean(t.revoked)
  }));
}

/**
 * Normalize decoy generation response
 */
export function normalizeDecoys(data) {
  if (!data) return [];
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data.decoys)) {
    list = data.decoys;
  } else if (Array.isArray(data.items)) {
    list = data.items;
  } else if (Array.isArray(data.data)) {
    list = data.data;
  }

  return list.map((d) => ({
    var_names: Array.isArray(d.var_names) ? d.var_names.map(String) : [],
    file_path: d.file_path ? String(d.file_path) : "",
    comment: d.comment ? String(d.comment) : "",
    placement_note: d.placement_note ? String(d.placement_note) : ""
  }));
}

