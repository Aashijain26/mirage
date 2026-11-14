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
export const isMockMode = RAW_USE_MOCK === "true" || !RAW_API_URL.trim();

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
  return [];
}

export async function createDecoy(body) {
  if (isMockMode) return mockCreateDecoy(body);
  return body;
}

export async function deleteDecoy(id) {
  if (isMockMode) return mockDeleteDecoy(id);
  return { ok: true };
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
