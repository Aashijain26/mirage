import axios from "axios";
import { ENDPOINTS } from "./config/endpoints.js";
import { getAuthToken } from "./utils/auth.js";
import {
  mockGetEvents,
  mockGetTokens,
  mockCreateToken,
  mockDeleteToken,
  mockGetDecoys,
  mockCreateDecoy,
  mockDeleteDecoy,
  mockSummary,
  startMockSimulator
} from "./mock.js";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const RAW_USE_MOCK = import.meta.env.VITE_USE_MOCK;
// Mock behavior is opt-in only. A missing API URL must fail visibly instead of
// silently showing fabricated data in a supposed live deployment.
export const isMockMode = RAW_USE_MOCK === "true";

const apiClient = axios.create({ baseURL: RAW_API_URL.trim(), timeout: 10000 });
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function normalizeList(data, key) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export async function checkHealth(token) {
  if (isMockMode) return { authenticated: true };
  if (!RAW_API_URL.trim()) throw new Error("Set VITE_API_URL to the backend address before signing in.");
  const res = await apiClient.post(ENDPOINTS.auth, {}, {
    headers: { Authorization: `Bearer ${String(token || "").trim()}` }
  });
  return res.data;
}

export async function getEvents() {
  if (isMockMode) return mockGetEvents();
  const res = await apiClient.get(ENDPOINTS.events, { params: { limit: 500 } });
  return normalizeList(res.data, "events");
}

export async function getTokens() {
  if (isMockMode) return mockGetTokens();
  const res = await apiClient.get(ENDPOINTS.tokens);
  return normalizeList(res.data, "tokens");
}

export async function getIncidents() {
  if (isMockMode) return (await mockGetEvents()).map((event) => ({
    ...event, last_seen: event.ts || event.created_at, first_seen: event.ts || event.created_at,
    event_count: 1, events: [event], token_label: event.token_label || event.token_id
  }));
  const res = await apiClient.get(ENDPOINTS.incidents);
  return normalizeList(res.data, "incidents");
}

export async function createToken(body) {
  if (isMockMode) return mockCreateToken(body);
  const res = await apiClient.post(ENDPOINTS.createToken, {
    type: body.type,
    label: body.label,
    context: body.context
  });
  return res.data;
}

export async function deleteToken(id) {
  if (isMockMode) return mockDeleteToken(id);
  const res = await apiClient.delete(`${ENDPOINTS.tokens}/${id}`);
  return res.data;
}

export async function getDecoys() {
  if (isMockMode) return mockGetDecoys();
  const res = await apiClient.get(ENDPOINTS.decoys);
  return normalizeList(res.data, "decoys");
}

export async function getAutomationStatus() {
  if (isMockMode) return { provider: "github", status: "mock_mode", enabled: false, configured: false };
  const res = await apiClient.get(ENDPOINTS.automationStatus);
  return res.data;
}

export async function createDecoy(body) {
  if (isMockMode) return mockCreateDecoy(body);
  const res = await apiClient.post(ENDPOINTS.decoys, body);
  return res.data;
}

export async function deleteDecoy(id) {
  if (isMockMode) return mockDeleteDecoy(id);
  const res = await apiClient.delete(`${ENDPOINTS.decoys}/${id}`);
  return res.data;
}

export async function summarize(eventIds) {
  if (isMockMode) return mockSummary(eventIds);
  const res = await apiClient.post(ENDPOINTS.summary, { event_ids: eventIds });
  return res.data;
}

export function startLiveUpdates(onMessage, onStatus) {
  if (isMockMode) {
    onStatus("mock");
    const unsubscribe = startMockSimulator(onMessage);
    return { close: unsubscribe };
  }
  onStatus("polling");
  return { close() {} };
}
