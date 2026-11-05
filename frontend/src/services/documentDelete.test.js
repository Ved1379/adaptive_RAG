import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  getItem(key) {
    return key === 'adaptive_rag_token' ? 'test-admin-token' : null;
  },
};

const { apiClient, deleteDocument } = await import('./api.js');

test('document deletion uses the admin endpoint, DELETE method, ID, and bearer token', async () => {
  const originalAdapter = apiClient.defaults.adapter;
  let request;
  apiClient.defaults.adapter = async (config) => {
    request = config;
    return {
      data: { message: 'Document deleted', deleted_chunks: 2 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };

  try {
    const result = await deleteDocument('document-id-123');
    assert.equal(result.success, true);
    assert.equal(request.method, 'delete');
    assert.equal(apiClient.getUri(request), '/api/admin/documents/document-id-123');
    assert.equal(request.headers.Authorization, 'Bearer test-admin-token');
    assert.equal(request.data, undefined);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
});

test('document deletion returns the backend failure detail', async () => {
  const originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async (config) => {
    const error = new Error('Request failed with status code 503');
    error.config = config;
    error.response = {
      status: 503,
      data: { detail: 'ChromaDB cleanup could not be confirmed.' },
      headers: {},
      config,
    };
    throw error;
  };

  try {
    const result = await deleteDocument('document-id-123');
    assert.deepEqual(result, {
      success: false,
      error: 'ChromaDB cleanup could not be confirmed.',
    });
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
});
