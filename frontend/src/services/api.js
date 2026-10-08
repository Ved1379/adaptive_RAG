import axios from 'axios';
import { MOCK_DOCUMENTS, MOCK_CHUNKS, MOCK_USERS_LIST, MOCK_ANALYTICS_DATA } from './mockData';

// Central API Configuration
// In development, empty baseURL uses Vite's proxy configured in vite.config.js to forward to http://127.0.0.1:8000
// Can also be overridden via .env VITE_API_BASE_URL if needed
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Central Axios Client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Health check endpoint - matches existing FastAPI main.py @app.get("/health")
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 4000 });
    return { isOnline: true, data: response.data };
  } catch (error) {
    return { isOnline: false, error: error.message };
  }
};

/**
 * Send user message to the real FastAPI RAG backend
 * Endpoint: POST /chat
 * Request payload: { "question": string }
 * Expected response:
 * {
 *   "answer": string,
 *   "category": "COLLEGE" | "GENERAL",
 *   "evaluation": {
 *     "faithfulness": "PASS" | "FAIL",
 *     "relevance": "PASS" | "FAIL",
 *     "groundedness": "PASS" | "FAIL",
 *     "completeness": "PASS" | "FAIL",
 *     "factual_consistency": "PASS" | "FAIL"
 *   },
 *   "sources": Array<{ document: string, page?: number, chunk_index?: number, text?: string }>,
 *   "regenerated": boolean
 * }
 */
export const sendChatMessage = async (question) => {
  try {
    const response = await apiClient.post('/chat', {
      question,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('[API] /chat request failed:', error);

    let errorMessage =
      'Unable to connect to the chatbot server. Please make sure the FastAPI backend is running.';

    if (error.response) {
      if (error.response.status === 404) {
        errorMessage =
          'FastAPI server is running, but the POST /chat endpoint is not yet defined in main.py.';
      } else if (error.response.data?.detail) {
        errorMessage =
          typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail);
      } else {
        errorMessage = `Server error (${error.response.status}): ${
          error.response.statusText || 'Request failed'
        }`;
      }
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      errorMessage =
        'Unable to connect to the chatbot server. Please make sure the FastAPI backend is running at http://127.0.0.1:8000.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out waiting for the RAG backend to respond.';
    }

    return {
      success: false,
      error: errorMessage,
      status: error.response?.status,
    };
  }
};

// Alias to maintain full compatibility across components
export const sendMessage = sendChatMessage;

/**
 * Get all available college documents
 * Endpoint: GET /documents
 */
export const getDocuments = async (search = '') => {
  try {
    const response = await apiClient.get('/documents', {
      params: { q: search },
    });
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    // Isolated mock fallback only for Documents UI browsing until GET /documents is added
    let filtered = [...MOCK_DOCUMENTS];
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.filename.toLowerCase().includes(query) ||
          d.department.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query)
      );
    }
    return {
      success: true,
      data: filtered,
      isMock: true,
    };
  }
};

/**
 * Get document details by ID
 * Endpoint: GET /documents/{id}
 */
export const getDocument = async (id) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    const doc = MOCK_DOCUMENTS.find((d) => d.id === id) || MOCK_DOCUMENTS[0];
    const chunks = MOCK_CHUNKS[id] || MOCK_CHUNKS['doc-001'] || [];
    return {
      success: true,
      data: {
        ...doc,
        chunks,
      },
      isMock: true,
    };
  }
};

/**
 * Admin: Upload Document
 * Endpoint: POST /documents/upload
 */
export const uploadDocument = async (formData) => {
  try {
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      data: {
        message: 'Document queued for ingestion and chunking (Simulated UI)',
        filename: formData.get('file')?.name || 'uploaded_document.pdf',
        status: 'Processing',
      },
      isMock: true,
    };
  }
};

/**
 * Admin: Delete Document
 * Endpoint: DELETE /documents/{id}
 */
export const deleteDocument = async (id) => {
  try {
    const response = await apiClient.delete(`/documents/${id}`);
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    await new Promise((res) => setTimeout(res, 500));
    return {
      success: true,
      data: { message: `Document ${id} removed (Simulated UI)` },
      isMock: true,
    };
  }
};

/**
 * Admin: Replace Document
 * Endpoint: PUT /documents/{id}
 */
export const replaceDocument = async (id, formData) => {
  try {
    const response = await apiClient.put(`/documents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      data: {
        message: `Document ${id} replaced and re-indexing queued (Simulated UI)`,
        filename: formData.get('file')?.name || 'updated_document.pdf',
        status: 'Processing',
      },
      isMock: true,
    };
  }
};

/**
 * Admin: Get Users List
 * Endpoint: GET /users
 */
export const getUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    return {
      success: true,
      data: MOCK_USERS_LIST,
      isMock: true,
    };
  }
};

/**
 * Admin: Get Analytics Data
 * Endpoint: GET /analytics
 */
export const getAnalytics = async () => {
  try {
    const response = await apiClient.get('/analytics');
    return {
      success: true,
      data: response.data,
      isMock: false,
    };
  } catch (error) {
    return {
      success: true,
      data: MOCK_ANALYTICS_DATA,
      isMock: true,
    };
  }
};
