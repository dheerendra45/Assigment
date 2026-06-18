// Fetch wrapper: attaches the JWT and silently refreshes once on a 401.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const BASE = `${API_URL}/api`;

const store = {
  get access() {
    return localStorage.getItem('accessToken');
  },
  get refresh() {
    return localStorage.getItem('refreshToken');
  },
  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },
};

export class ApiError extends Error {
  constructor(payload, status) {
    super(payload?.message || 'Request failed');
    this.code = payload?.code || 'UNKNOWN';
    this.status = payload?.status || status;
    this.details = payload?.details;
  }
}

let refreshPromise = null;

async function doRefresh() {
  if (!store.refresh) throw new ApiError({ message: 'No session', code: 'UNAUTHORIZED' }, 401);
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: store.refresh }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new ApiError(data, res.status);
        store.set(data);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, auth = true, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && store.access) headers.Authorization = `Bearer ${store.access}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && auth && !_retry && store.refresh) {
    try {
      await doRefresh();
      return request(path, { method, body, auth, _retry: true });
    } catch {
      store.clear();
      throw new ApiError(data, 401);
    }
  }

  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}

export const api = {
  store,
  register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST', body: { refreshToken: store.refresh }, auth: false }),

  listTasks: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const q = qs.toString();
    return request(`/tasks${q ? `?${q}` : ''}`);
  },
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body }),
  updateStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  listUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  analytics: () => request('/analytics'),
};
