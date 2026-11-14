// Authentication utilities for Honeytoken Monitor SOC Admin
// Tokens are strictly stored in sessionStorage, never in localStorage or logs.

const AUTH_TOKEN_KEY = "ht_admin_token";

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
  return Boolean(getAuthToken());
}

