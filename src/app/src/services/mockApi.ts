/**
 * Mock API service for local development testing
 * Simulates backend responses when Azure Functions aren't running
 */

interface Template {
  id: string;
  entity_type: string;
  global_rules: {
    custom_config?: Record<string, any>;
    template_name?: string;
    [key: string]: any;
  };
}

// In-memory storage for templates
let templates: Template[] = [];

// Default template types
const DEFAULT_TYPES = ['default', 'engineering', 'asset', 'whitepaper', 'point_of_view', 'rfp_rfi_response', 'internal_meeting_presentation'];

const generateId = () => `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const mockApi = {
  /**
   * Get all available template types (entity types)
   */
  getTemplateTypes: async () => {
    // Return unique entity types from stored templates plus defaults
    const types = [...new Set([
      ...DEFAULT_TYPES,
      ...templates.map(t => t.entity_type)
    ])];
    return {
      available_types: types,
      count: types.length,
    };
  },

  /**
   * Get all templates
   */
  getTemplates: async () => {
    // Return stored templates
    if (templates.length > 0) {
      return templates;
    }
    // If no templates, return empty array
    return [];
  },

  /**
   * Create a new template
   */
  createTemplate: async (template: any) => {
    const newTemplate: Template = {
      id: generateId(),
      entity_type: template.entity_type,
      global_rules: template.global_rules || {},
      ...template,
    };
    templates.push(newTemplate);
    console.log('Mock API: Template created', newTemplate.id);
    return {
      id: newTemplate.id,
      entity_type: newTemplate.entity_type,
      message: 'Template created/updated successfully',
    };
  },

  /**
   * Update an existing template
   */
  updateTemplate: async (id: string, template: any) => {
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template with id ${id} not found`);
    }
    templates[index] = {
      ...templates[index],
      ...template,
    };
    console.log('Mock API: Template updated', id);
    return {
      id: templates[index].id,
      entity_type: templates[index].entity_type,
      message: 'Template updated successfully',
    };
  },

  /**
   * Delete a template
   */
  deleteTemplate: async (id: string) => {
    templates = templates.filter(t => t.id !== id);
    console.log('Mock API: Template deleted', id);
    return { message: 'Template deleted successfully' };
  },

  /**
   * Health check
   */
  health: async () => {
    return { status: 'ok', mode: 'mock', message: 'Mock API running locally' };
  },
};
