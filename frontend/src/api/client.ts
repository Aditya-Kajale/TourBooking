import { refreshToken } from './auth';

export const API_BASE = "http://127.0.0.1:8000";

// 🔥 Get CSRF token from browser cookies
function getCSRFToken() {
  const name = "csrftoken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let cookie of cookies) {
    const c = cookie.trim();
    if (c.startsWith(name)) {
      return c.substring(name.length);
    }
  }
  return "";
}

export const apiFetch = async <T = any>(url: string, options: any = {}, retry = true): Promise<T> => {
  const isFormData = options.body instanceof FormData;
  const method = (options.method || 'GET').toUpperCase();
  const headers: any = isFormData ? {} : { 'Content-Type': 'application/json' };

  // include CSRF token for state-changing requests
  if (method !== 'GET' && method !== 'HEAD') {
    let token = getCSRFToken();
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('csrfToken') || '';
    }
    if (token) {
      headers['X-CSRFToken'] = token;
    }
  }

  // Also include the DRF Authentication Token if available
  if (typeof localStorage !== 'undefined') {
    const apiToken = localStorage.getItem('token');
    if (apiToken) {
      headers['Authorization'] = `Token ${apiToken}`;
    }
  }

  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });

  // Handle Token Expiry
  if (res.status === 401 && retry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the request once with new token
      return apiFetch(url, options, false);
    } else {
      // Refresh failed, redirect to login or clear state
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('csrfToken');
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let errorMsg = "API request failed";
    try {
      const error = await res.json();
      errorMsg = error.detail || error.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  try {
    return await res.json();
  } catch (e) {
    return null as unknown as T;
  }
};