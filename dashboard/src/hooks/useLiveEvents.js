import { useState, useEffect, useRef, useCallback } from "react";
import { getEvents, startLiveUpdates, isMockMode } from "../api.js";

const MAX_EVENTS = 500;

export function useLiveEvents() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(isMockMode ? "mock" : "reconnecting");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentEventIds, setRecentEventIds] = useState(new Set());

  // Refs to manage live connections and backoff without race conditions
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const eventQueueRef = useRef([]);
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Helper to mark an event as recent so it triggers flash highlight
  const markRecent = useCallback((id) => {
    setRecentEventIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setRecentEventIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1600);
  }, []);

  // Prepend event with deduping and memory capping
  const handleIncomingEvent = useCallback(
    (newEvent) => {
      if (!newEvent || !newEvent.id) return;

      if (isPausedRef.current) {
        eventQueueRef.current.push(newEvent);
        return;
      }

      markRecent(newEvent.id);
      setEvents((prev) => {
        if (prev.some((e) => e.id === newEvent.id)) {
          return prev;
        }
        return [newEvent, ...prev].slice(0, MAX_EVENTS);
      });
    },
    [markRecent]
  );

  // Resume unpausing flushes queued events
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (!next && eventQueueRef.current.length > 0) {
        const queue = [...eventQueueRef.current];
        eventQueueRef.current = [];
        queue.forEach((e) => markRecent(e.id));
        setEvents((prevEvents) => {
          const combined = [...queue, ...prevEvents];
          const seen = new Set();
          const deduped = [];
          for (const ev of combined) {
            if (ev && ev.id && !seen.has(ev.id)) {
              seen.add(ev.id);
              deduped.push(ev);
            }
          }
          return deduped.slice(0, MAX_EVENTS);
        });
      }
      return next;
    });
  }, [markRecent]);

  // Initial load
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      if (!isUnmountedRef.current) {
        setEvents(data.slice(0, MAX_EVENTS));
      }
    } catch (err) {
      if (!isUnmountedRef.current) {
        setError(err.message || "Failed to load events");
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Use the mock simulator locally and authenticated REST polling in real mode.
  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    if (isMockMode) {
      setStatus("mock");
      const sub = startLiveUpdates(handleIncomingEvent, (s) => {
        if (!isUnmountedRef.current) setStatus(s);
      });
      socketRef.current = sub;
      return;
    }

    setStatus("polling");
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        try {
          const polled = await getEvents();
          if (!isUnmountedRef.current && Array.isArray(polled)) {
            setStatus("polling");
            setError(null);
            setEvents((prev) => {
              const seen = new Set([
                ...prev.map((e) => e.id),
                ...eventQueueRef.current.map((e) => e.id)
              ]);
              const newItems = polled.filter((e) => !seen.has(e.id));
              if (newItems.length === 0) return prev;
              if (isPausedRef.current) {
                eventQueueRef.current.push(...newItems);
                return prev;
              }
              newItems.forEach((event) => markRecent(event.id));
              return [...newItems, ...prev].slice(0, MAX_EVENTS);
            });
          }
        } catch (err) {
          if (!isUnmountedRef.current) {
            setStatus("offline");
            setError(err.message || "Failed to poll events");
          }
        }
      }, 2500);
    }
  }, [handleIncomingEvent]);

  useEffect(() => {
    isUnmountedRef.current = false;
    loadInitialData().then(() => {
      connect();
    });

    return () => {
      isUnmountedRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadInitialData, connect]);

  // Method to manually push an event (e.g. from simulate attack button)
  const pushEvent = useCallback(
    (ev) => {
      handleIncomingEvent(ev);
    },
    [handleIncomingEvent]
  );

  return {
    events,
    status,
    loading,
    error,
    isPaused,
    togglePause,
    pushEvent,
    recentEventIds,
    refreshEvents: loadInitialData
  };
}

