/**
 * assets/js/api.js
 * Central API client – wraps fetch, injects auth token, handles 401 auto-logout.
 */

const API_BASE = 'https://production-schoolofscience-backend.onrender.com/api/v1';

/**
 * Core request wrapper.
 * @param {string} endpoint  - e.g. '/auth/login'
 * @param {object} options   - fetch options
 * @returns {Promise<{ success, data, message }>}
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sos_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Remove Content-Type for FormData (let browser set it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Auto-logout on 401
    if (response.status === 401) {
      localStorage.removeItem('sos_token');
      localStorage.removeItem('sos_user');
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/index.html';
      }
      return data;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

const API = {
  /** GET request */
  get: (endpoint) => request(endpoint, { method: 'GET' }),

  /** POST request with JSON body */
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body:   JSON.stringify(body),
  }),

  /** POST request with FormData (file uploads) */
  postForm: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body:   formData,
  }),

  /** PUT request with JSON body */
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body:   JSON.stringify(body),
  }),

  /** PUT request with FormData */
  putForm: (endpoint, formData) => request(endpoint, {
    method: 'PUT',
    body:   formData,
  }),

  /** PATCH request */
  patch: (endpoint, body = {}) => request(endpoint, {
    method: 'PATCH',
    body:   JSON.stringify(body),
  }),

  /** DELETE request */
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Make available globally
window.API = API;
window.API_BASE = API_BASE;
