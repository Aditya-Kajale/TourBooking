const API_BASE = "http://127.0.0.1:8000";

export const login = async (username: string, password: string) => {
  // Use the JSON login endpoint on the backend to avoid CSRF issues in dev
  const res = await fetch(`${API_BASE}/api/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    // response should include user details already
    try {
      const me = await res.json();
      // persist user and CSRF/Auth token (if returned)
      localStorage.setItem('user', JSON.stringify(me));
      if (me.csrfToken) {
        localStorage.setItem('csrfToken', me.csrfToken);
      }
      if (me.token) {
        localStorage.setItem('token', me.token);
      }
      return { ok: true, user: me };
    } catch (err) {
      const user = { username };
      localStorage.setItem('user', JSON.stringify(user));
      return { ok: true, user };
    }
  }

  const text = await res.text();
  return { ok: false, error: text };
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE}/api/logout/`, { method: 'POST', credentials: 'include' });
  } catch (err) {
    // fallback to DRF logout
    await fetch(`${API_BASE}/api-auth/logout/`, { method: 'POST', credentials: 'include' });
  }
  localStorage.removeItem('user');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('token');
};
