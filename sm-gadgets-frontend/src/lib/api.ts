const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Prepend the VITE_API_URL to the endpoint if it's not already absolute.
 * This ensures the frontend talks to the Render backend in production.
 */
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) return endpoint;
  
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBase}${cleanEndpoint}`;
};
