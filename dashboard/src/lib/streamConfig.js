/**
 * Pyjama DZ System Configuration & Cloud Streaming Endpoint Manager
 * Automatically syncs with Supabase cloud setting 'stream_cloud_url',
 * or uses LocalStorage / VITE_STREAM_SERVER_URL / localhost.
 */
import { supabase } from './supabase';

const STORAGE_KEY = 'pyjama_stream_server_url';
let cachedCloudUrl = null;

export function getStreamServerUrl() {
  // 1. User manual override in LocalStorage
  const custom = localStorage.getItem(STORAGE_KEY);
  if (custom && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }

  // 2. Cached Cloud Tunnel from Supabase
  if (cachedCloudUrl) {
    return cachedCloudUrl.replace(/\/+$/, '');
  }

  // 3. Environment variable (VITE_STREAM_SERVER_URL)
  if (import.meta.env.VITE_STREAM_SERVER_URL) {
    return import.meta.env.VITE_STREAM_SERVER_URL.replace(/\/+$/, '');
  }

  // 4. Default fallback
  return 'http://localhost:8000';
}

export function setStreamServerUrl(url) {
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Automatically fetch the live cloud tunnel URL from Supabase
 */
export async function syncCloudStreamUrl(onUrlUpdate) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'stream_cloud_url')
      .single();

    if (!error && data?.value?.url) {
      cachedCloudUrl = data.value.url;
      if (onUrlUpdate) onUrlUpdate(cachedCloudUrl);
      return cachedCloudUrl;
    }
  } catch (e) {
    // Graceful fallback
  }
  return null;
}
