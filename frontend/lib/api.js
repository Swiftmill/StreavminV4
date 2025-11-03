const FALLBACK_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export const apiUrl = (path) => {
  if (typeof window !== 'undefined') {
    const base = FALLBACK_BASE || window.__STREAVMIN_API_BASE || '';
    return `${base}${path}`;
  }
  return `${FALLBACK_BASE || 'http://localhost:4000'}${path}`;
};

export const apiFetch = (path, options = {}) =>
  fetch(apiUrl(path), { credentials: 'include', ...options });
