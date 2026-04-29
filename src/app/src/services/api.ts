import axios from 'axios';
import { mockApi, mockApiExtended } from './mockApi';

const apiClient = axios.create({
  timeout: 30000,
});

// Flag to track if backend is available
let backendAvailable = true;
let backendCheckTime = 0;
const BACKEND_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor for handling 500/connection errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If it's a connection error or 500, mark backend as unavailable
    if (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED') {
      backendAvailable = false;
      console.warn('Backend unavailable, switching to mock API mode');
    }
    throw error;
  }
);

/**
 * Transform simplified template format to backend-expected format
 */
const transformTemplateForBackend = (template: any) => {
  return {
    entity_type: template.type || 'default',
    document_types: {
      general_document: {},
      business_brief: {},
      proposal: {},
      report: {},
      information_sheet: {},
    },
    global_rules: {
      severity_levels: ['blocker', 'critical', 'major', 'minor', 'advisory'],
      scoring: {
        weights: {
          structure: 0.25,
          design: 0.35,
          compliance: 0.2,
          business_context: 0.2,
        },
      },
      custom_config: template.config || {},
      template_name: template.name,
    },
    structure: {
      sections: {
        required: [],
        optional: [],
        ordering_enforced: false,
        page_break_after: [],
      },
      toc: {
        required: false,
        max_depth: 2,
      },
      cross_references: {
        figures_numbered: true,
        tables_numbered: true,
      },
    },
    design: {
      fonts: {
        title: {
          allowed: ['Calibri', 'Segoe UI'],
          size: { min: 20, max: 28 },
          weight: 'bold',
        },
        heading: {
          allowed: ['Calibri', 'Segoe UI'],
          size: { min: 14, max: 18 },
          weight: ['bold', 'semibold'],
        },
        body: {
          allowed: ['Calibri', 'Segoe UI'],
          size: { min: 10, max: 12 },
          weight: 'regular',
        },
      },
      colors: {
        palette_required: true,
        primary: ['#003366', '#0066CC'],
        secondary: ['#FFFFFF', '#F5F5F5'],
        text: ['#000000', '#1F1F1F'],
        accent: ['#FF6B35'],
        max_colors_per_page: 5,
      },
      grid: {
        type: 'column_grid',
        columns: 12,
        gutter: 0.25,
        baseline_grid: true,
        snap_tolerance_px: 4,
      },
      alignment: {
        enforce_horizontal: true,
        enforce_vertical: true,
        justification_allowed: ['left'],
        nearly_aligned_threshold_px: 6,
      },
      spacing: {
        line_spacing: { min: 1.1, max: 1.2 },
        paragraph_spacing_px: { before: 6, after: 6 },
        consistent_spacing_required: true,
      },
    },
  };
};

export const api = {
  // Proposals
  uploadProposal: async (file: File, templateType: string) => {
    try {
      const fileContent = await file.text();
      return await apiClient.post('/api/samples', {
        documentType: templateType,
        entityType: 'document',
        fileContent: fileContent,
        fileName: file.name,
        uploadedBy: 'user',
      });
    } catch (error) {
      // If backend is unavailable, use mock API
      if (!backendAvailable || (error as any).response?.status >= 500) {
        console.warn('Backend unavailable, using mock API for uploadProposal');
        const fileContent = await file.text();
        const result = await mockApiExtended.uploadProposal(templateType, fileContent, file.name);
        return { data: result, status: 201 };
      }
      console.error('Upload failed:', error);
      throw error;
    }
  },

  getProposals: async () => {
    try {
      return await apiClient.get('/api/samples');
    } catch (error) {
      // If backend is unavailable, use mock API
      if (!backendAvailable || (error as any).response?.status >= 500) {
        console.warn('Backend unavailable, using mock API for getProposals');
        const proposals = await mockApiExtended.getProposals();
        return { data: { samples: proposals }, status: 200 };
      }
      console.error('Error loading proposals:', error);
      throw error;
    }
  },
  
  getProposal: (id: string) => apiClient.get(`/api/samples/${id}`),
  
  deleteProposal: (id: string) => apiClient.delete(`/api/samples/${id}`),

  analyzeProposal: (id: string) => apiClient.post(`/api/analyze/${id}`, {}),

  getAnalysis: (id: string) => apiClient.get(`/api/analyze/${id}`),

  // Templates - with fallback to mock API
  getTemplates: async () => {
    try {
      // First try to get full templates with structure from templates-list
      try {
        return await apiClient.get('/api/templates-list');
      } catch (e) {
        // Fall back to available-types if templates-list is not available
        return await apiClient.get('/api/templates/available-types');
      }
    } catch (error) {
      console.info('Backend unavailable, using mock API for getTemplates');
      return { data: await mockApi.getTemplates() };
    }
  },

  getTemplateTypes: async () => {
    try {
      return await apiClient.get('/api/templates/available-types');
    } catch (error) {
      console.info('Backend unavailable, using mock API for getTemplateTypes');
      return { data: await mockApi.getTemplateTypes() };
    }
  },
  
  createTemplate: async (template: any) => {
    try {
      return await apiClient.post('/api/templates', transformTemplateForBackend(template));
    } catch (error) {
      console.info('Backend unavailable, using mock API for createTemplate');
      return { data: await mockApi.createTemplate(transformTemplateForBackend(template)) };
    }
  },
  
  updateTemplate: async (id: string, template: any) => {
    try {
      return await apiClient.put(`/api/templates/${id}`, transformTemplateForBackend(template));
    } catch (error) {
      console.info('Backend unavailable, using mock API for updateTemplate');
      return { data: await mockApi.updateTemplate(id, transformTemplateForBackend(template)) };
    }
  },
  
  deleteTemplate: async (id: string) => {
    try {
      return await apiClient.delete(`/api/templates/${id}`);
    } catch (error) {
      console.info('Backend unavailable, using mock API for deleteTemplate');
      return { data: await mockApi.deleteTemplate(id) };
    }
  },

  // Health check
  health: async () => {
    try {
      return await apiClient.get('/api/health');
    } catch (error) {
      console.info('Backend unavailable, using mock API for health');
      return { data: await mockApi.health() };
    }
  },
};

export default apiClient;