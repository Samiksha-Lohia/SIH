import { storage } from '../lib/storage.js';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newAccessToken) {
  refreshSubscribers.forEach((callback) => callback(newAccessToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

/**
 * Low-level request wrapper for all backend calls.
 */
async function baseFetch(endpoint, options = {}, retryOn401 = true) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  // Automatically attach auth header if available
  const token = storage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-set JSON content-type if not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new ApiError('Unable to connect to the SUTRA API server. Please check your network connection.', {
      status: 0,
      code: 'NETWORK_ERROR',
      details: netErr.message,
    });
  }

  // Handle 401 with silent token refresh attempt
  if (response.status === 401 && retryOn401) {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshJson = await refreshRes.json();

          if (refreshRes.ok && refreshJson.success && refreshJson.data?.tokens?.accessToken) {
            const newAccess = refreshJson.data.tokens.accessToken;
            const newRefresh = refreshJson.data.tokens.refreshToken || refreshToken;
            storage.setAccessToken(newAccess);
            storage.setRefreshToken(newRefresh);
            isRefreshing = false;
            onRefreshed(newAccess);
          } else {
            throw new Error('Token refresh rejected');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          refreshSubscribers = [];
          storage.clearAuthSession();
          window.dispatchEvent(new CustomEvent('sutra:unauthorized', { detail: { reason: 'SESSION_EXPIRED' } }));
          throw new ApiError('Your session has expired. Please sign in again.', {
            status: 401,
            code: 'SESSION_EXPIRED',
          });
        }
      }

      // Wait for the in-flight refresh to finish, then retry original request once
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          if (!(options.body instanceof FormData) && !retryHeaders.has('Content-Type')) {
            retryHeaders.set('Content-Type', 'application/json');
          }
          baseFetch(endpoint, { ...options, headers: retryHeaders }, false)
            .then(resolve)
            .catch(reject);
        });
      });
    } else {
      storage.clearAuthSession();
      window.dispatchEvent(new CustomEvent('sutra:unauthorized', { detail: { reason: 'UNAUTHENTICATED' } }));
    }
  }

  // Parse backend envelope: { success, data, error, meta }
  let json = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errObj = json?.error;
    throw new ApiError(errObj?.message || `Request failed with status ${response.status}`, {
      status: response.status,
      code: errObj?.code || 'HTTP_ERROR',
      details: errObj?.details || null,
    });
  }

  // Return standard payload unwrapped
  return {
    data: json?.data ?? null,
    meta: json?.meta ?? null,
    success: json?.success ?? true,
    raw: json,
  };
}

export const api = {
  get(endpoint, options = {}) {
    return baseFetch(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return baseFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put(endpoint, body, options = {}) {
    return baseFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch(endpoint, body, options = {}) {
    return baseFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return baseFetch(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;
