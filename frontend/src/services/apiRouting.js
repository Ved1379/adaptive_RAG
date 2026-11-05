export const API_PROXY_PREFIX = '/api';
export const API_PROXY_TARGET = 'http://127.0.0.1:9000';

export function resolveApiBaseUrl(configuredBaseUrl) {
  const configured = typeof configuredBaseUrl === 'string' ? configuredBaseUrl.trim() : '';
  return configured ? configured.replace(/\/+$/, '') : API_PROXY_PREFIX;
}

export function rewriteApiProxyPath(path) {
  return path.replace(/^\/api(?=\/|$)/, '') || '/';
}
