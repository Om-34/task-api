import axios from 'axios';
import { API_URL, TOKEN_STORAGE_KEY } from '../config';

export const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if we have one) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A small set of listeners notified when the server tells us our
// session is no longer valid (expired/invalid token). AuthContext
// subscribes to this so it can clear state and redirect to /login.
const unauthorizedListeners = new Set();

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes an axios error into a plain, user-friendly message string.
 * The FastAPI backend returns errors as either:
 *   { "detail": "some message" }
 *   { "detail": "Validation error", "errors": [{ "loc": [...], "msg": "..." }, ...] }
 */
export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Network error: could not reach the server. Is the API running?';
  }

  const data = error.response.data;
  if (!data) return fallback;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e) => {
        const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : 'field';
        return `${field}: ${e.msg}`;
      })
      .join('; ');
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  return fallback;
}
