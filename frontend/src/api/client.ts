const API_BASE = "http://127.0.0.1:8000";

// 🔥 Get CSRF token from browser cookies
function getCSRFToken() {
  const name = "csrftoken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name)) {
      return cookie.substring(name.length);
    }
  }
  return "";
}
export const apiFetch = async <T = any>(url: string, options: any = {}): Promise<T> => {
    const isFormData = options.body instanceof FormData;

  const method = (options.method || 'GET').toUpperCase();
  const headers: any = isFormData ? {} : { 'Content-Type': 'application/json' };

  // include CSRF token for state-changing requests
  if (method !== 'GET' && method !== 'HEAD') {
    // try cookie first
    let token = getCSRFToken();
    // fallback to token saved from login response (useful when cookie is blocked by cross-port dev setups)
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('csrfToken') || '';
    }
    // diagnostic logging for CSRF issues
    try {
      // eslint-disable-next-line no-console
      console.debug('apiFetch CSRF token sources', { cookieToken: getCSRFToken(), localStorageToken: (typeof localStorage !== 'undefined') ? localStorage.getItem('csrfToken') : null, method });
    } catch (e) {}

    if (token) {
      headers['X-CSRFToken'] = token;
    } else {
      // if this is a state-changing request and no token is available, log a clear error
      // eslint-disable-next-line no-console
      console.error('apiFetch: no CSRF token available for state-changing request', { url, method });
    }
  }

  // Also include the DRF Authentication Token if available
  if (typeof localStorage !== 'undefined') {
    const apiToken = localStorage.getItem('token');
    if (apiToken) {
      headers['Authorization'] = `Token ${apiToken}`;
    }

    // 🛠️ DEV-ONLY: Inject X-DEV-USER header for easier local development
    // This allows the backend to identify the user without session/cookies
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (user && user.id) {
          headers['X-DEV-USER'] = user.id;
        }
      } catch (e) {}
    }
  }

  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });

    if (!res.ok) {
        let errorMsg = "API request failed";
        try {
            const error = await res.json();
            console.error("API Error:", error);
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