import axios from "axios";
import { ENDPOINTS } from "./config/endpoints.js";
import {
  mockGetEvents,
  mockGetTokens,
  mockCreateToken,
  mockSummary,
  startMockSimulator
} from "./mock.js";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const RAW_USE_MOCK = import.meta.env.VITE_USE_MOCK;
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

// When VITE_USE_MOCK is "true" or VITE_API_URL is empty, every function uses mock.js
export const isMockMode = RAW_USE_MOCK === "true" || !RAW_API_URL.trim();

// Axios instance for real mode
const apiClient = axios.create({
  baseURL: RAW_API_URL.trim(),
  timeout: 10000
});

if (ADMIN_TOKEN && ADMIN_TOKEN.trim()) {
  apiClient.defaults.headers.common["X-Admin-Token"] = ADMIN_TOKEN.trim();
}

/**
 * Defensive normalizer to accept either an array or an object wrapping the array
 */
function normalizeList(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export async function getEvents() {
  if (isMockMode) {
    return await mockGetEvents();
  }
  const res = await apiClient.get(ENDPOINTS.events);
  return normalizeList(res.data, "events");
}

export async function getTokens() {
  if (isMockMode) {
    return await mockGetTokens();
  }
  const res = await apiClient.get(ENDPOINTS.tokens);
  return normalizeList(res.data, "tokens");
}

export async function createToken(body) {
  if (isMockMode) {
    return await mockCreateToken(body);
  }
  const res = await apiClient.post(ENDPOINTS.createToken, body);
  return res.data;
}

export async function summarize(eventIds) {
  if (isMockMode) {
    return await mockSummary(eventIds);
  }
  const res = await apiClient.post(ENDPOINTS.summary, { event_ids: eventIds });
  return res.data;
}

export function openSocket(onMessage, onStatus) {
  if (isMockMode) {
    onStatus("mock");
    const unsubscribe = startMockSimulator((event) => {
      onMessage(event);
    });
    return {
      close: () => unsubscribe()
    };
  }

  // Construct WebSocket URL
  let baseUrl = RAW_API_URL.trim();
  if (baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "ws://");
  } else if (baseUrl.startsWith("https://")) {
    baseUrl = baseUrl.replace("https://", "wss://");
  } else if (!baseUrl.startsWith("ws://") && !baseUrl.startsWith("wss://")) {
    baseUrl = `ws://${baseUrl}`;
  }

  // Strip trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, "");
  const wsPath = ENDPOINTS.ws.startsWith("/") ? ENDPOINTS.ws : `/${ENDPOINTS.ws}`;
  const wsUrl = `${baseUrl}${wsPath}`;

  let ws = null;
  let isClosedManually = false;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (!isClosedManually) {
        onStatus("live");
      }
    };

    ws.onmessage = (msgEvent) => {
      try {
        const parsed = JSON.parse(msgEvent.data);
        onMessage(parsed);
      } catch (err) {
        console.warn("Failed to parse incoming WebSocket message as JSON", err);
      }
    };

    ws.onerror = (err) => {
      if (!isClosedManually) {
        onStatus("offline");
      }
    };

    ws.onclose = () => {
      if (!isClosedManually) {
        onStatus("offline");
      }
    };
  } catch (err) {
    onStatus("offline");
  }

  return {
    close: () => {
      isClosedManually = true;
      if (ws) {
        try {
          ws.close();
        } catch (_) {}
      }
    }
  };
}

