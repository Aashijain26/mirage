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
  getIncidents,
  createToken as apiCreateToken,
  deleteToken as apiDeleteToken,
  getDecoys as apiGetDecoys,
  getAutomationStatus,
  getLeakResponseStatus,
  getLeakAlerts,
  checkLeakAlertsNow as apiCheckLeakAlertsNow,
  createLeakDemoCases as apiCreateLeakDemoCases,
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
  const [incidents, setIncidents] = useState([]);
  const [decoys, setDecoys] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingDecoys, setLoadingDecoys] = useState(true);
  const [tokensError, setTokensError] = useState(null);
  const [decoysError, setDecoysError] = useState(null);
  const [automationStatus, setAutomationStatus] = useState({ status: "loading" });
  const [leakResponseStatus, setLeakResponseStatus] = useState({ status: "loading" });
  const [leakAlerts, setLeakAlerts] = useState([]);
  const [leakAlertsError, setLeakAlertsError] = useState(null);
  const [incidentsError, setIncidentsError] = useState(null);
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

  const refreshIncidents = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
      setIncidentsError(null);
    } catch (err) {
      setIncidentsError(err.message || "Failed to load incidents");
    }
  }, []);

  const refreshDecoys = useCallback(async () => {
    setLoadingDecoys(true);
    setDecoysError(null);
    try {
      const data = await apiGetDecoys();
      setDecoys(Array.isArray(data) ? data : []);
    } catch (err) {
      setDecoysError(err.message || "Failed to load decoys");
    } finally {
      setLoadingDecoys(false);
    }
  }, []);

  const refreshAutomationStatus = useCallback(async () => {
    try {
      setAutomationStatus(await getAutomationStatus());
    } catch (err) {
      setAutomationStatus({ status: "unavailable", error: err.message || "Could not load automation status" });
    }
  }, []);

  const refreshLeakAlerts = useCallback(async () => {
    try {
      setLeakAlerts(await getLeakAlerts());
      setLeakAlertsError(null);
    } catch (err) {
      setLeakAlertsError(err.message || "Could not load GitHub alerts");
    }
  }, []);

  const refreshLeakResponseStatus = useCallback(async () => {
    try {
      setLeakResponseStatus(await getLeakResponseStatus());
    } catch (err) {
      setLeakResponseStatus({ status: "unavailable", error: err.message || "Could not load leak response status" });
    }
  }, []);

  useEffect(() => {
    refreshTokens();
    refreshIncidents();
    refreshDecoys();
    refreshAutomationStatus();
    refreshLeakAlerts();
    refreshLeakResponseStatus();
  }, [refreshTokens, refreshDecoys, refreshIncidents, refreshAutomationStatus, refreshLeakAlerts, refreshLeakResponseStatus]);

  useEffect(() => {
    if (isMockMode) return undefined;
    const timer = setInterval(() => {
      refreshIncidents();
      refreshAutomationStatus();
      refreshLeakAlerts();
      refreshLeakResponseStatus();
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshIncidents, refreshAutomationStatus, refreshLeakAlerts, refreshLeakResponseStatus]);

  const checkLeakAlertsNow = useCallback(async () => {
    const result = await apiCheckLeakAlertsNow();
    await Promise.all([refreshLeakAlerts(), refreshDecoys(), refreshLeakResponseStatus()]);
    return result;
  }, [refreshDecoys, refreshLeakAlerts, refreshLeakResponseStatus]);

  const createLeakDemoCases = useCallback(async () => {
    const result = await apiCreateLeakDemoCases();
    await Promise.all([refreshLeakAlerts(), refreshDecoys(), refreshLeakResponseStatus()]);
    return result;
  }, [refreshDecoys, refreshLeakAlerts, refreshLeakResponseStatus]);

  const tokenMap = useMemo(() => {
    const map = new Map();
    tokens.forEach((t) => {
      if (t && t.id) map.set(t.id, t);
    });
    return map;
  }, [tokens]);

  const stats = useMemo(() => {
    const totalHoneytokens = tokens.length;
    const activeHoneytokens = tokens.filter((t) => !t.revoked).length;
    const tokensHit = tokens.filter((t) => (t.hits || 0) > 0).length;
    const today = new Date().toISOString().slice(0, 10);
    const hitsToday = liveEvents.events.filter((event) => String(event.ts || event.created_at || "").slice(0, 10) === today).length;

    const highSeverity = liveEvents.events.filter((e) => (e.score ?? 0) >= 70).length;
    const mediumSeverity = liveEvents.events.filter((e) => (e.score ?? 0) >= 50 && (e.score ?? 0) < 70).length;
    const lowSeverity = liveEvents.events.filter((e) => (e.score ?? 0) < 50).length;

    return {
      totalHoneytokens,
      activeHoneytokens,
      tokensHit,
      hitsToday,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      totalIncidents: incidents.length,
      totalAttacks: liveEvents.events.length,
      highSeverityIncidents: incidents.filter((incident) => (incident.score ?? 0) >= 70).length,
      lastAttackTimestamp: liveEvents.events[0]?.ts || liveEvents.events[0]?.created_at || null
    };
  }, [tokens, liveEvents.events, incidents]);

  const handleSimulateAttack = useCallback(() => {
    if (!isMockMode) return null;
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
    const cacheKey = `${ip}:${(eventIds || []).join(",")}`;
    if (aiCacheRef.current.has(cacheKey)) return aiCacheRef.current.get(cacheKey);
    const result = await summarize(eventIds);
    aiCacheRef.current.set(cacheKey, result);
    return result;
  }, []);

  const value = {
    events: liveEvents.events,
    incidents,
    incidentsError,
    refreshIncidents,
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
    decoysError,
    automationStatus,
    leakResponseStatus,
    leakAlerts,
    leakAlertsError,
    refreshLeakAlerts,
    checkLeakAlertsNow,
    createLeakDemoCases,
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
