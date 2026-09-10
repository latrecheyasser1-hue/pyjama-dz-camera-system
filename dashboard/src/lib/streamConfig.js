/**
 * Pyjama DZ System Configuration & Cloud Streaming Endpoint Manager
 * Automatically uses Cloudflare Tunnel URL if configured, 
 * or fallback to Local IP / Localhost with easy live switching.
 */

const STORAGE_KEY = 'pyjama_stream_server_url';

export function getStreamServerUrl() {
  // 1. Check user defined custom URL in LocalStorage
  const custom = localStorage.getItem(STORAGE_KEY);
  if (custom && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }

  // 2. Check environment variable (VITE_STREAM_SERVER_URL)
  if (import.meta.env.VITE_STREAM_SERVER_URL) {
    return import.meta.env.VITE_STREAM_SERVER_URL.replace(/\/+$/, '');
  }

  // 3. Fallback to localhost if running locally
  return 'http://localhost:8000';
}

export function setStreamServerUrl(url) {
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}
