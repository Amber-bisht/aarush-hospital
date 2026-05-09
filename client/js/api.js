/**
 * API module – replaces Axios with fetch.
 * Handles JWT access/refresh token lifecycle.
 */

// Dynamic API detection based on environment
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : (window.location.origin + '/api'); // Fallback to relative path for production/Vercel proxying

const STORAGE_KEY = 'hms_auth_state';

/* ── Session helpers ── */
function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  if (session && session.tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getAccessToken() {
  return readSession()?.tokens?.accessToken || null;
}

function getRefreshToken() {
  return readSession()?.tokens?.refreshToken || null;
}

/* ── Core fetch wrapper ── */
async function request(method, path, body, _retry) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== undefined && body !== null) {
    options.body = JSON.stringify(body);
  }

  let response = await fetch(url, options);

  // Attempt refresh on 401
  if (
    response.status === 401 &&
    !_retry &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/register') &&
    !path.includes('/auth/refresh')
  ) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const session = readSession();
          writeSession({
            user: refreshData.user || session?.user,
            tokens: refreshData.tokens,
          });

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.tokens.accessToken}`;
          options.headers = headers;
          response = await fetch(url, options);
        } else {
          writeSession(null);
          window.location.href = '/auth.html';
          throw new Error('Session expired');
        }
      } catch (refreshError) {
        writeSession(null);
        window.location.href = '/auth.html';
        throw refreshError;
      }
    } else {
      writeSession(null);
      window.location.href = '/auth.html';
      throw new Error('No refresh token');
    }
  }

  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const err = new Error(data?.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/* ── Public API ── */
const api = {
  get: (path, params) => {
    let query = '';
    if (params && typeof params === 'object') {
      const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null);
      if (entries.length) query = '?' + new URLSearchParams(entries).toString();
    }
    return request('GET', path + query);
  },
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

window.API_BASE_URL = API_BASE_URL;
window.api = api;
window.readSession = readSession;
window.writeSession = writeSession;
