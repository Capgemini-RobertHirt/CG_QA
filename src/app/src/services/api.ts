<<<<<<< HEAD
import axios from 'axios';

const apiClient = axios.create({
  timeout: 30000,
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Proposals
  uploadProposal: async (file: File, templateType: string) => {
    const fileContent = await file.text();
    return apiClient.post('/api/samples', {
      documentType: templateType,
      entityType: 'document',
      fileContent: fileContent,
      fileName: file.name,
      uploadedBy: 'user',
    });
  },

  getProposals: () => apiClient.get('/api/samples'),
  
  getProposal: (id: string) => apiClient.get(`/api/samples/${id}`),
  
  deleteProposal: (id: string) => apiClient.delete(`/api/samples/${id}`),

  analyzeProposal: (id: string) => apiClient.post(`/api/analyze/${id}`, {}),

  // Templates
  getTemplates: () => apiClient.get('/api/templates/available-types'),
  
  getTemplateTypes: () => apiClient.get('/api/templates/available-types'),
  
  createTemplate: (template: any) => apiClient.post('/api/templates', template),
  
  updateTemplate: (id: string, template: any) => apiClient.put(`/api/templates/${id}`, template),
  
  deleteTemplate: (id: string) => apiClient.delete(`/api/templates/${id}`),

  // Health check
  health: () => apiClient.get('/api/health'),
};

export default apiClient;
=======
/**
 * API client for frontend communication with Azure Function backend.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7071/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// Auth endpoints
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }
};

// Proposals endpoints
export const proposalsAPI = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/proposals`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch proposals');
    return response.json();
  },

  get: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/proposals/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch proposal');
    return response.json();
  },

  upload: async (formData: FormData) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/proposals/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  analyze: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/proposals/${id}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/proposals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Delete failed');
    return response.json();
  }
};

// Templates endpoints
export const templatesAPI = {
  listAvailable: async () => {
    const response = await fetch(`${API_BASE_URL}/templates/available-types`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  get: async (entityType: string) => {
    const response = await fetch(`${API_BASE_URL}/templates/${entityType}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  },

  update: async (entityType: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/templates/${entityType}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update template');
    return response.json();
  }
};

// Ideas/Samples endpoints
export const ideasAPI = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/ideas`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch ideas');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/ideas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create idea');
    return response.json();
  },

  upload: async (formData: FormData) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/samples/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }
};
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
