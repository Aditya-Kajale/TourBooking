const API_BASE = "http://127.0.0.1:8000";

export const login = async (username: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const me = await res.json();
      localStorage.setItem('user', JSON.stringify(me));
      if (me.csrfToken) localStorage.setItem('csrfToken', me.csrfToken);
      if (me.token) localStorage.setItem('token', me.token);
      return { ok: true, user: me };
    }
    const err = await res.json();
    return { ok: false, error: err.detail || 'Login failed' };
  } catch (err) {
    return { ok: false, error: 'Network error' };
  }
};

export const register = async (data: any) => {
  try {
    const res = await fetch(`${API_BASE}/api/register/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const me = await res.json();
      localStorage.setItem('user', JSON.stringify(me));
      if (me.csrfToken) localStorage.setItem('csrfToken', me.csrfToken);
      if (me.token) localStorage.setItem('token', me.token);
      return { ok: true, user: me };
    }
    const err = await res.json();
    return { ok: false, error: err.detail || 'Registration failed' };
  } catch (err) {
    return { ok: false, error: 'Network error' };
  }
};

export const refreshToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/refresh-token/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
    });

    if (res.ok) {
      const me = await res.json();
      localStorage.setItem('user', JSON.stringify(me));
      if (me.csrfToken) localStorage.setItem('csrfToken', me.csrfToken);
      if (me.token) localStorage.setItem('token', me.token);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_BASE}/api/logout/`, { 
      method: 'POST', 
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : {}
    });
  } catch (err) {
    console.error('Logout failed', err);
  }
  localStorage.removeItem('user');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('token');
};
