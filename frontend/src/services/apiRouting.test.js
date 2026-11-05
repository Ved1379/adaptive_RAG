import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {
  API_PROXY_PREFIX,
  API_PROXY_TARGET,
  resolveApiBaseUrl,
  rewriteApiProxyPath,
} from './apiRouting.js';

test('default API base URL uses the shared Vite proxy prefix', () => {
  assert.equal(resolveApiBaseUrl(undefined), '/api');
  assert.equal(resolveApiBaseUrl('  '), '/api');
  const client = axios.create({ baseURL: resolveApiBaseUrl(undefined) });
  assert.equal(client.getUri({ url: '/conversations' }), '/api/conversations');
});

test('an explicitly configured backend URL is preserved without a trailing slash', () => {
  assert.equal(resolveApiBaseUrl(' http://127.0.0.1:9000/ '), 'http://127.0.0.1:9000');
});

test('the shared Vite proxy strips only the /api prefix for all backend route groups', () => {
  assert.equal(API_PROXY_PREFIX, '/api');
  assert.equal(API_PROXY_TARGET, 'http://127.0.0.1:9000');
  for (const endpoint of [
    '/api/conversations',
    '/api/auth/login',
    '/api/health',
    '/api/chat',
    '/api/documents/submit',
    '/api/admin/analytics',
  ]) {
    assert.equal(rewriteApiProxyPath(endpoint), endpoint.replace(/^\/api/, ''));
  }
  assert.equal(rewriteApiProxyPath('/api'), '/');
});
