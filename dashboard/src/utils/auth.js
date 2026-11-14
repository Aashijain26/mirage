// Authentication utilities for Mirage Honeytoken SOC Admin
// In real API mode, tokens are stored in sessionStorage.
// In mock mode (VITE_USE_MOCK=true), access is granted immediately.

const AUTH_TOKEN_KEY = "mirage_admin_token";

const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const RAW_USE_MOCK = import.meta.env.VITE_USE_MOCK;
export const isMockMode = RAW_USE_MOCK === "true" || !RAW_API_URL.trim();

export function getAuthToken() {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch (_) {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, String(token).trim());
    }
  } catch (_) {}
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (_) {}
}

export function isAuthenticated() {
  if (isMockMode) return true;
  return Boolean(getAuthToken());
}
