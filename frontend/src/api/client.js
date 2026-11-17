const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('jalsuraksha_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}
