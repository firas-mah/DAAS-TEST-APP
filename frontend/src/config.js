/**
 * Runtime configuration.
 *
 * The docker-entrypoint.sh script generates /usr/share/nginx/html/runtime-config.js
 * which sets window.RUNTIME_CONFIG.BACKEND_URL at container startup.
 *
 * In development, we fall back to VITE_BACKEND_URL.
 */
function getBackendUrl() {
  // Runtime config (production / Docker)
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.BACKEND_URL) {
    return window.RUNTIME_CONFIG.BACKEND_URL;
  }

  // Build-time env (development)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Final fallback
  return 'http://localhost:8080';
}

export const BACKEND_URL = getBackendUrl();

