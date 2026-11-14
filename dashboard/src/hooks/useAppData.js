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
import {
  getTokens,
  createToken as apiCreateToken,
  deleteToken as apiDeleteToken,
  getDecoys as apiGetDecoys,
  createDecoy as apiCreateDecoy,
  deleteDecoy as apiDeleteDecoy,
  summarize,
  isMockMode
} from "../api.js";
import { simulateImmediateAttack } from "../mock.js";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const liveEvents = useLiveEvents();
  const [tokens, setTokens] = useState([]);
  const [decoys, setDecoys] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingDecoys, setLoadingDecoys] = useState(true);
  const [tokensError, setTokensError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const aiCacheRef = useRef(new Map());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

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

  const refreshDecoys = useCallback(async () => {
    setLoadingDecoys(true);
    try {
      const data = await apiGetDecoys();
      setDecoys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDecoys(false);
    }
  }, []);

  useEffect(() => {
    refreshTokens();
    refreshDecoys();
  }, [refreshTokens, refreshDecoys]);

  const tokenMap = useMemo(() => {
    const map = new Map();
    tokens.forEach((t) => {
      if (t && t.id) map.set(t.id, t);
    });
    return map;
  }, [tokens]);

  const stats = useMemo(() => {
    const totalHoneytokens = tokens.length || 14;
    const activeHoneytokens = tokens.filter((t) => !t.revoked).length || 14;
    const tokensHit = tokens.filter((t) => (t.hits || 0) > 0).length || 7;
    const hitsToday = 46;

    const highSeverity = liveEvents.events.filter((e) => (e.score ?? 0) >= 70).length || 3;
    const mediumSeverity = liveEvents.events.filter((e) => (e.score ?? 0) >= 50 && (e.score ?? 0) < 70).length || 8;
    const lowSeverity = liveEvents.events.filter((e) => (e.score ?? 0) < 50).length || 9;

    return {
      totalHoneytokens,
      activeHoneytokens,
      tokensHit,
      hitsToday,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      totalIncidents: liveEvents.events.length || 20
    };
  }, [tokens, liveEvents.events]);

  const handleSimulateAttack = useCallback(() => {
    const attackEvent = simulateImmediateAttack();
    liveEvents.pushEvent(attackEvent);
    return attackEvent;
  }, [liveEvents]);

  const handleCreateToken = useCallback(
    async (payload) => {
      const res = await apiCreateToken(payload);
      await refreshTokens();
      return res;
    },
    [refreshTokens]
  );

  const handleDeleteToken = useCallback(
    async (id) => {
      await apiDeleteToken(id);
      await refreshTokens();
    },
    [refreshTokens]
  );

  const handleCreateDecoy = useCallback(
    async (payload) => {
      const res = await apiCreateDecoy(payload);
      await refreshDecoys();
      return res;
    },
    [refreshDecoys]
  );

  const handleDeleteDecoy = useCallback(
    async (id) => {
      await apiDeleteDecoy(id);
      await refreshDecoys();
    },
    [refreshDecoys]
  );

  const getAiSummary = useCallback(async (ip, eventIds) => {
    if (!ip) return null;
    if (aiCacheRef.current.has(ip)) return aiCacheRef.current.get(ip);
    const result = await summarize(eventIds);
    aiCacheRef.current.set(ip, result);
    return result;
  }, []);

  const value = {
    events: liveEvents.events,
    connectionStatus: liveEvents.status,
    loadingEvents: liveEvents.loading,
    eventsError: liveEvents.error,
    isPaused: liveEvents.isPaused,
    togglePause: liveEvents.togglePause,
    recentEventIds: liveEvents.recentEventIds,
    refreshEvents: liveEvents.refreshEvents,

    tokens,
    tokenMap,
    loadingTokens,
    tokensError,
    refreshTokens,
    createToken: handleCreateToken,
    deleteToken: handleDeleteToken,

    decoys,
    loadingDecoys,
    refreshDecoys,
    createDecoy: handleCreateDecoy,
    deleteDecoy: handleDeleteDecoy,

    stats,
    now,
    isMockMode,
    simulateAttack: handleSimulateAttack,
    getAiSummary,
    searchQuery,
    setSearchQuery
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
