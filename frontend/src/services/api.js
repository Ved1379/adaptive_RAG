import axios from 'axios';

// Central API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Central Axios Client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adaptive_rag_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (localStorage.getItem('adaptive_rag_token')) {
        console.warn('[API] Authentication expired. Please log in again.');
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Health Check
// ==========================================
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 4000 });
    return { isOnline: true, data: response.data };
  } catch (error) {
    return { isOnline: false, error: error.message };
  }
};

// ==========================================
// Authentication APIs
// ==========================================
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.access_token) {
      localStorage.setItem('adaptive_rag_token', response.data.access_token);
    }
    return { success: true, data: response.data };
  } catch (error) {
    const detail = error.response?.data?.detail || 'Invalid login credentials.';
    return { success: false, error: detail };
  }
};

export const registerUser = async ({ email, password, name, department }) => {
  try {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      name,
      department: department || 'General',
    });
    if (response.data?.access_token) {
      localStorage.setItem('adaptive_rag_token', response.data.access_token);
    }
    return { success: true, data: response.data };
  } catch (error) {
    const detail = error.response?.data?.detail || 'Registration failed.';
    return { success: false, error: detail };
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return { success: true, data: response.data.user };
  } catch (error) {
    return { success: false, error: error.response?.data?.detail || 'Failed to authenticate user.' };
  }
};

// ==========================================
// Chatbot APIs
// ==========================================
export const sendChatMessage = async (question) => {
  try {
    const response = await apiClient.post('/chat', { question });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('[API] /chat request failed:', error);
    let errorMessage = 'Unable to reach the chatbot server. Please check backend status.';
    if (error.response?.data?.detail) {
      errorMessage =
        typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
    }
    return {
      success: false,
      error: errorMessage,
      status: error.response?.status,
    };
  }
};

export const sendMessage = sendChatMessage;

export const getChatHistory = async () => {
  try {
    const response = await apiClient.get('/chat/history');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, data: [] };
  }
};

// ==========================================
// Document Management & Submission APIs
// ==========================================
export const getDocuments = async (search = '', statusFilter = '') => {
  try {
    const params = {};
    if (search) params.q = search;
    if (statusFilter) params.status_filter = statusFilter;
    const response = await apiClient.get('/documents', { params });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to fetch documents.',
      data: [],
    };
  }
};

export const getDocument = async (id) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Document not found.',
    };
  }
};

export const uploadDocument = async (formData) => {
  try {
    const response = await apiClient.post('/documents/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to upload document.',
    };
  }
};

export const submitDocument = uploadDocument;

export const getMySubmissions = async () => {
  try {
    const response = await apiClient.get('/documents/my-submissions');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
    };
  }
};

// ==========================================
// Admin Governance & Review APIs
// ==========================================
export const getAdminRequests = async (statusFilter = '') => {
  try {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await apiClient.get('/admin/document-requests', { params });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to fetch document requests.',
      data: [],
    };
  }
};

export const approveDocument = async (id) => {
  try {
    const response = await apiClient.post(`/admin/document-requests/${id}/approve`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to approve document.',
    };
  }
};

export const rejectDocument = async (id, reason = '') => {
  try {
    const response = await apiClient.post(`/admin/document-requests/${id}/reject`, { reason });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to reject document.',
    };
  }
};

export const retryIngestion = async (id) => {
  try {
    const response = await apiClient.post(`/admin/document-requests/${id}/retry`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Retry ingestion failed.',
    };
  }
};

export const replaceDocument = async (id, formData) => {
  try {
    const response = await apiClient.post('/documents/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to replace document.',
    };
  }
};

export const deleteDocument = async (id) => {
  try {
    const response = await apiClient.delete(`/admin/documents/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to delete document.',
    };
  }
};

export const previewDocument = async (id) => {
  try {
    const response = await apiClient.get(`/admin/documents/${id}/preview`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to preview document.',
    };
  }
};

// ==========================================
// Admin Analytics, Users & Audit Logs APIs
// ==========================================
export const getAnalytics = async () => {
  try {
    const response = await apiClient.get('/admin/analytics');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Failed to fetch analytics.',
      data: null,
    };
  }
};

export const getAuditLogs = async (limit = 50) => {
  try {
    const response = await apiClient.get('/admin/audit-logs', { params: { limit } });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
    };
  }
};

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
    };
  }
};
