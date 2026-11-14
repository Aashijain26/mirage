import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { useLiveEvents } from "./useLiveEvents.js";
import { getTokens, createToken as apiCreateToken, summarize, isMockMode } from "../api.js";
import { simulateImmediateAttack } from "../mock.js";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const liveEvents = useLiveEvents();
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [tokensError, setTokensError] = useState(null);

  // In-memory cache for AI attacker profile summaries per IP
  const aiCacheRef = useRef(new Map());

  // Clock tick to refresh relative times every 30 seconds
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tokens
  const refreshTokens = useCallback(async () => {
    setLoadingTokens(true);
    setTokensError(null);
    try {
      const data = await getTokens();
      setTokens(Array.isArray(data) ? data : []);
    } catch (err) {
      setTokensError(err.message || "Failed to load tokens");
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  // Token map for fast lookup of labels
  const tokenMap = useMemo(() => {
    const map = new Map();
    tokens.forEach((t) => {
      if (t && t.id) {
        map.set(t.id, t);
      }
    });
    return map;
  }, [tokens]);

  // Derived token hit stats from events
  const { tokenHitCounts, tokenLastTriggered } = useMemo(() => {
    const hits = new Map();
    const lastTrig = new Map();

    liveEvents.events.forEach((ev) => {
      if (!ev || !ev.token_id) return;
      hits.set(ev.token_id, (hits.get(ev.token_id) || 0) + 1);

      const existingTs = lastTrig.get(ev.token_id);
      if (!existingTs || new Date(ev.ts) > new Date(existingTs)) {
        lastTrig.set(ev.token_id, ev.ts);
      }
    });

    return { tokenHitCounts: hits, tokenLastTriggered: lastTrig };
  }, [liveEvents.events]);

  // Derived top-level metrics
  const stats = useMemo(() => {
    const totalHoneytokens = tokens.length;
    const activeHoneytokens = tokens.filter((t) => !t.revoked).length;
    const totalAttacks = liveEvents.events.length;
    const highSeverityIncidents = liveEvents.events.filter(
      (e) => (e.score ?? 0) >= 60
    ).length;

    const latestEvent = liveEvents.events[0];
    const lastAttackTimestamp = latestEvent ? latestEvent.ts : null;

    return {
      totalHoneytokens,
      activeHoneytokens,
      totalAttacks,
      highSeverityIncidents,
      lastAttackTimestamp
    };
  }, [tokens, liveEvents.events]);

  // Simulate attack handler
  const handleSimulateAttack = useCallback(() => {
    if (!isMockMode) return null;
    const attackEvent = simulateImmediateAttack();
    liveEvents.pushEvent(attackEvent);
    return attackEvent;
  }, [liveEvents]);

  // Create token action
  const handleCreateToken = useCallback(
    async (payload) => {
      const res = await apiCreateToken(payload);
      await refreshTokens();
      return res;
    },
    [refreshTokens]
  );

  // AI Summary fetcher with per-IP in-memory caching
  const getAiSummary = useCallback(async (ip, eventIds) => {
    if (!ip) return null;
    if (aiCacheRef.current.has(ip)) {
      return aiCacheRef.current.get(ip);
    }
    const result = await summarize(eventIds);
    aiCacheRef.current.set(ip, result);
    return result;
  }, []);

  const value = {
    // Events
    events: liveEvents.events,
    connectionStatus: liveEvents.status,
    loadingEvents: liveEvents.loading,
    eventsError: liveEvents.error,
    isPaused: liveEvents.isPaused,
    togglePause: liveEvents.togglePause,
    recentEventIds: liveEvents.recentEventIds,
    refreshEvents: liveEvents.refreshEvents,

    // Tokens
    tokens,
    tokenMap,
    tokenHitCounts,
    tokenLastTriggered,
    loadingTokens,
    tokensError,
    refreshTokens,
    createToken: handleCreateToken,

    // Overall metrics & timers
    stats,
    now,
    isMockMode,
    simulateAttack: handleSimulateAttack,
    getAiSummary
  };

  return React.createElement(AppDataContext.Provider, { value }, children);
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
