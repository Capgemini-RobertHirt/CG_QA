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