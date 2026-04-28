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
