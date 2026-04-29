/**
 * Mock API service for local development testing
 * Simulates backend responses when Azure Functions aren't running
 * Includes baseline template configurations from the Capgemini quality checker
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

// Template configurations loaded from baseline JSON files
const TEMPLATE_CONFIGS = {
  default: {
    entity_type: 'default',
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
    },
    structure: {
      sections: {
        required: ['introduction', 'proposal'],
        optional: ['conclusion', 'appendix', 'references', 'acknowledgments'],
        ordering_enforced: true,
        page_break_after: ['introduction'],
      },
      toc: {
        required: false,
        max_depth: 2,
      },
    },
    design: {
      fonts: {
        title: { allowed: ['Calibri', 'Segoe UI'], size: { min: 20, max: 28 } },
        heading: { allowed: ['Calibri', 'Segoe UI'], size: { min: 14, max: 18 } },
        body: { allowed: ['Calibri', 'Segoe UI'], size: { min: 10, max: 12 } },
      },
      colors: {
        palette_required: true,
        primary: ['#003366', '#0066CC'],
        max_colors_per_page: 5,
      },
    },
  },
  engineering: {
    entity_type: 'engineering',
    document_types: {
      technical_specification: {},
      architecture_document: {},
      implementation_guide: {},
      technical_proposal: {},
      engineering_brief: {},
    },
    global_rules: {
      severity_levels: ['blocker', 'critical', 'major', 'minor', 'advisory'],
      scoring: {
        weights: {
          structure: 0.25,
          design: 0.3,
          compliance: 0.2,
          business_context: 0.25,
        },
      },
    },
    structure: {
      sections: {
        required: [
          'technical_overview',
          'architecture',
          'implementation',
          'risk_mitigation',
          'support',
          'pricing',
        ],
        optional: ['appendix', 'references', 'compliance_matrix'],
        ordering_enforced: true,
      },
      toc: {
        required: true,
        max_depth: 3,
      },
    },
    design: {
      fonts: {
        title: { allowed: ['Calibri', 'Segoe UI', 'Courier New'], size: { min: 20, max: 28 } },
        code: { allowed: ['Courier New', 'Consolas'], size: { min: 8, max: 10 } },
      },
      colors: {
        palette_required: true,
        code_highlight: ['#E8E8E8', '#D4D4D4'],
        max_colors_per_page: 6,
      },
    },
  },
  asset: {
    entity_type: 'asset',
    document_types: {
      internal_asset: {},
      case_study: {},
      toolkit: {},
      best_practices_guide: {},
      resource_template: {},
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
    },
    structure: {
      sections: {
        required: [
          'title_description',
          'asset_overview',
          'key_content',
          'usage_instructions',
          'business_value',
          'related_assets',
        ],
        optional: ['appendix', 'references', 'faq'],
      },
      toc: {
        required: false,
        max_depth: 2,
      },
    },
    design: {
      fonts: {
        title: { allowed: ['Calibri', 'Segoe UI'], size: { min: 16, max: 24 } },
        heading: { allowed: ['Calibri', 'Segoe UI'], size: { min: 12, max: 16 } },
      },
    },
  },
  whitepaper: {
    entity_type: 'whitepaper',
    document_types: {
      whitepaper: {},
      point_of_view: {},
      research_brief: {},
      industry_analysis: {},
      trend_report: {},
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
    },
    structure: {
      sections: {
        required: [
          'title_page',
          'executive_summary',
          'introduction',
          'background_context',
          'problem_statement',
          'research_methodology',
          'findings_analysis',
          'recommendations',
          'conclusion',
          'references',
        ],
        optional: ['appendix', 'case_studies', 'glossary'],
      },
      toc: {
        required: true,
        max_depth: 3,
      },
    },
  },
  point_of_view: {
    entity_type: 'point_of_view',
    document_types: {
      point_of_view: {},
      strategic_brief: {},
      market_perspective: {},
      executive_article: {},
      thought_leadership: {},
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
    },
    structure: {
      sections: {
        required: [
          'title_overview',
          'executive_perspective',
          'business_context',
          'key_insights',
          'market_implications',
          'strategic_recommendations',
          'call_to_action',
        ],
        optional: ['case_examples', 'appendix', 'references'],
      },
      toc: {
        required: false,
        max_depth: 2,
      },
    },
  },
  rfp_rfi_response: {
    entity_type: 'rfp_rfi_response',
    document_types: {
      rfp_rfi_response: {},
      executive_one_pager: {},
      internal_asset: {},
      case_study: {},
      methodology_guide: {},
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
    },
    structure: {
      sections: {
        required: [
          'executive_summary',
          'solution_overview',
          'approach_methodology',
          'implementation_timeline',
          'team_qualifications',
          'risk_management',
          'pricing_commercial',
          'terms_conditions',
        ],
        optional: ['case_studies', 'appendix', 'references'],
      },
      toc: {
        required: true,
        max_depth: 3,
      },
    },
  },
  internal_meeting_presentation: {
    entity_type: 'internal_meeting_presentation',
    document_types: {
      meeting_presentation: {},
      status_update: {},
      strategy_session: {},
      decision_briefing: {},
      workshop_materials: {},
    },
    global_rules: {
      severity_levels: ['blocker', 'critical', 'major', 'minor', 'advisory'],
      scoring: {
        weights: {
          structure: 0.3,
          design: 0.3,
          compliance: 0.15,
          business_context: 0.25,
        },
      },
    },
    structure: {
      sections: {
        required: [
          'title_slide',
          'meeting_agenda',
          'executive_summary',
          'background_context',
          'key_topics',
          'discussion_points',
          'action_items',
          'next_steps',
        ],
        optional: ['appendix', 'references', 'glossary'],
      },
      toc: {
        required: false,
        max_depth: 2,
      },
    },
  },
};

// In-memory storage for custom templates
let customTemplates: Template[] = [];

// Default template types
const DEFAULT_TYPES = [
  'default',
  'engineering',
  'asset',
  'whitepaper',
  'point_of_view',
  'rfp_rfi_response',
  'internal_meeting_presentation',
];

const generateId = () => `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Count configuration items from a template config object
 */
const countConfigItems = (config: any): number => {
  if (!config) return 0;
  
  let count = 0;
  
  // Count document types
  if (config.document_types) {
    count += Object.keys(config.document_types).length;
  }
  
  // Count required sections
  if (config.structure?.sections?.required) {
    count += config.structure.sections.required.length;
  }
  
  // Count optional sections
  if (config.structure?.sections?.optional) {
    count += config.structure.sections.optional.length;
  }
  
  return count;
};

// Helper function to generate legoBlocks from section configuration
const generateLegoBlocks = (config: any) => {
  if (!config?.structure?.sections) {
    return {};
  }

  const legoBlocks: Record<string, any> = {};
  const allSections = [
    ...(config.structure.sections.required || []),
    ...(config.structure.sections.optional || []),
  ];

  // Section name to component mapping
  const sectionComponentMap: Record<string, { comp: string; name: string }> = {
    'introduction': { comp: 'card', name: 'Introduction' },
    'executive_summary': { comp: 'card', name: 'Executive Summary' },
    'overview': { comp: 'card', name: 'Overview' },
    'proposal': { comp: 'card', name: 'Proposal' },
    'technical_overview': { comp: 'card', name: 'Technical Overview' },
    'architecture': { comp: 'column', name: 'Architecture' },
    'design': { comp: 'card', name: 'Design' },
    'implementation': { comp: 'card', name: 'Implementation' },
    'business_case': { comp: 'card', name: 'Business Case' },
    'benefits': { comp: 'card', name: 'Benefits' },
    'risk_mitigation': { comp: 'table', name: 'Risk Mitigation' },
    'compliance': { comp: 'card', name: 'Compliance' },
    'performance': { comp: 'chart', name: 'Performance' },
    'support': { comp: 'card', name: 'Support' },
    'conclusion': { comp: 'card', name: 'Conclusion' },
    'appendix': { comp: 'card', name: 'Appendix' },
    'references': { comp: 'card', name: 'References' },
    'pricing': { comp: 'table', name: 'Pricing' },
    'title_description': { comp: 'card', name: 'Title & Description' },
    'asset_overview': { comp: 'card', name: 'Asset Overview' },
    'key_content': { comp: 'grid', name: 'Key Content' },
    'usage_instructions': { comp: 'numbered_list', name: 'Usage Instructions' },
    'related_assets': { comp: 'grid', name: 'Related Assets' },
    'faq': { comp: 'card', name: 'FAQ' },
    'title_slide': { comp: 'card', name: 'Title Slide' },
    'meeting_agenda': { comp: 'numbered_list', name: 'Meeting Agenda' },
    'background_context': { comp: 'card', name: 'Background Context' },
    'key_topics': { comp: 'grid', name: 'Key Topics' },
    'discussion_points': { comp: 'card', name: 'Discussion Points' },
  };

  // Generate component instance for each section
  allSections.forEach(section => {
    const mapping = sectionComponentMap[section] || {
      comp: 'card',
      name: section.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    };

    legoBlocks[section] = {
      components: [
        {
          id: `comp-${Date.now()}-${Math.random()}`,
          componentId: mapping.comp,
          name: mapping.name,
          category: 'container',
          properties: {
            title: mapping.name,
            variant: 'default',
          },
          subcomponents: [
            {
              id: `subcomp-${Date.now()}-title`,
              subcomponentId: 'title',
              name: 'Section Title',
              properties: {
                fontSize: '24px',
                fontWeight: 'bold',
                alignment: 'left',
                marginBottom: '16px',
              },
            },
            {
              id: `subcomp-${Date.now()}-paragraph`,
              subcomponentId: 'paragraph',
              name: 'Section Content',
              properties: {
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#333333',
              },
            },
          ],
        },
      ],
    };
  });

  return legoBlocks;
};

export const mockApi = {
  /**
   * Get all available template types (entity types)
   */
  getTemplateTypes: async () => {
    const types = [...DEFAULT_TYPES];
    return {
      available_types: types,
      count: types.length,
    };
  },

  /**
   * Get all templates (baseline + custom)
   */
  getTemplates: async () => {
    // Create template objects from baseline configs
    const baselineTemplates: Record<string, Template> = {};
    DEFAULT_TYPES.forEach(type => {
      const config = TEMPLATE_CONFIGS[type as keyof typeof TEMPLATE_CONFIGS];
      const structure = {
        ...config?.structure,
        legoBlocks: generateLegoBlocks(config),
      };
      
      baselineTemplates[`template-baseline-${type}`] = {
        id: `template-baseline-${type}`,
        entity_type: type,
        name: type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1),
        global_rules: config?.global_rules || {},
        structure,
        design: config?.design,
        document_types: config?.document_types,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: 'baseline',
      };
    });

    // Merge custom templates (which may override/extend baselines)
    const result: Template[] = [];
    const seenIds = new Set<string>();

    // Add custom templates (which include baseline-modified versions)
    customTemplates.forEach(template => {
      const baseConfig = template.entity_type ? TEMPLATE_CONFIGS[template.entity_type as keyof typeof TEMPLATE_CONFIGS] : undefined;
      const templateConfig = template.structure || baseConfig;
      
      result.push({
        ...template,
        // Ensure all structure fields are preserved and include legoBlocks
        structure: {
          ...(template.structure || (baseConfig?.structure || {})),
          legoBlocks: template.structure?.legoBlocks || generateLegoBlocks(templateConfig),
        },
        document_types: template.document_types || (baseConfig?.document_types),
        design: template.design || (baseConfig?.design),
      });
      seenIds.add(template.id);
    });

    // Add baseline templates that haven't been modified
    Object.entries(baselineTemplates).forEach(([id, template]) => {
      if (!seenIds.has(id)) {
        result.push(template);
      }
    });

    return result;
  },

  /**
   * Create a new custom template
   */
  createTemplate: async (template: any) => {
    const newTemplate: Template = {
      id: generateId(),
      entity_type: template.entity_type,
      global_rules: template.global_rules || {},
      ...template,
      type: 'custom',
    };
    customTemplates.push(newTemplate);
    console.log('Mock API: Template created', newTemplate.id);
    return {
      id: newTemplate.id,
      entity_type: newTemplate.entity_type,
      message: 'Template created successfully',
    };
  },

  /**
   * Update an existing template
   */
  updateTemplate: async (id: string, template: any) => {
    // Check if it's a custom template
    const customIndex = customTemplates.findIndex(t => t.id === id);
    if (customIndex !== -1) {
      const updatedTemplate = {
        ...customTemplates[customIndex],
        ...template,
        updated_at: new Date().toISOString(),
      };
      
      // Regenerate legoBlocks if structure changed
      if (template.structure && !template.structure.legoBlocks) {
        updatedTemplate.structure = {
          ...template.structure,
          legoBlocks: generateLegoBlocks(template),
        };
      }
      
      customTemplates[customIndex] = updatedTemplate;
      console.log('Mock API: Custom template updated', id);
      return {
        id: customTemplates[customIndex].id,
        entity_type: customTemplates[customIndex].entity_type,
        message: 'Template updated successfully',
      };
    }

    // Check if it's a baseline template
    if (id.startsWith('template-baseline-')) {
      const baselineType = id.replace('template-baseline-', '');
      const baselineConfig = TEMPLATE_CONFIGS[baselineType as keyof typeof TEMPLATE_CONFIGS];
      
      if (baselineConfig) {
        // Create or update a custom template that modifies the baseline
        const modifiedTemplate: Template = {
          id: id, // Keep the same ID for the baseline
          entity_type: baselineType,
          name: template.name || baselineType.replace(/_/g, ' '),
          global_rules: {
            ...baselineConfig.global_rules,
            custom_config: template.config || {},
          },
          structure: template.structure || baselineConfig.structure,
          design: template.design || baselineConfig.design,
          document_types: template.document_types || baselineConfig.document_types,
          ...template,
          type: 'baseline-modified',
          created_at: baselineConfig.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Check if we already have a custom entry for this baseline
        const existingIndex = customTemplates.findIndex(t => t.id === id);
        if (existingIndex !== -1) {
          customTemplates[existingIndex] = modifiedTemplate;
        } else {
          customTemplates.push(modifiedTemplate);
        }
        
        console.log('Mock API: Baseline template updated', id);
        return {
          id: modifiedTemplate.id,
          entity_type: modifiedTemplate.entity_type,
          message: 'Template updated successfully',
        };
      }
    }

    throw new Error(`Template with id ${id} not found`);
  },

  /**
   * Delete a template
   */
  deleteTemplate: async (id: string) => {
    customTemplates = customTemplates.filter(t => t.id !== id);
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

// In-memory storage for proposals/samples
let proposals: Array<any> = [];

const proposalGenerator = () => `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Extended Mock API with component and standards management
 */
export const mockApiExtended = {
  // Custom Components
  getCustomComponents: async () => {
    return customComponents;
  },

  createCustomComponent: async (component: any) => {
    const newComponent = {
      ...component,
      id: component.id || `comp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    customComponents.push(newComponent);
    console.log('Mock API: Custom component created', newComponent.id);
    return newComponent;
  },

  updateCustomComponent: async (id: string, component: any) => {
    const index = customComponents.findIndex(c => c.id === id);
    if (index !== -1) {
      customComponents[index] = {
        ...customComponents[index],
        ...component,
        updatedAt: new Date().toISOString(),
      };
      console.log('Mock API: Custom component updated', id);
      return customComponents[index];
    }
    throw new Error(`Component with id ${id} not found`);
  },

  deleteCustomComponent: async (id: string) => {
    customComponents = customComponents.filter(c => c.id !== id);
    console.log('Mock API: Custom component deleted', id);
    return { message: 'Component deleted successfully' };
  },

  // Global Standards
  getGlobalStandards: async () => {
    return globalStandards;
  },

  createGlobalStandard: async (standard: any) => {
    const newStandard = {
      ...standard,
      id: standard.id || `std-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStandards.push(newStandard);
    console.log('Mock API: Global standard created', newStandard.id);
    return newStandard;
  },

  updateGlobalStandard: async (id: string, standard: any) => {
    const index = globalStandards.findIndex(s => s.id === id);
    if (index !== -1) {
      globalStandards[index] = {
        ...globalStandards[index],
        ...standard,
        updatedAt: new Date().toISOString(),
      };
      console.log('Mock API: Global standard updated', id);
      return globalStandards[index];
    }
    throw new Error(`Standard with id ${id} not found`);
  },

  deleteGlobalStandard: async (id: string) => {
    globalStandards = globalStandards.filter(s => s.id !== id);
    console.log('Mock API: Global standard deleted', id);
    return { message: 'Standard deleted successfully' };
  },

  // Initialize with sample data
  initializeSampleData: async () => {
    // Sample standards
    globalStandards = [
      {
        id: 'std-1',
        title: 'Brand Color Compliance',
        category: 'guideline',
        description: 'All documents must use approved brand colors from the corporate palette',
        content: 'Primary: #003366, Secondary: #3498db, Accent: #e74c3c',
        links: [{ title: 'Brand Guidelines', url: 'https://brand.company.com' }],
        applicableTemplates: ['default', 'whitepaper'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-2',
        title: 'Font Standards',
        category: 'standard',
        description: 'Corporate font standards for all documents',
        content: 'Body: Segoe UI 11pt, Headings: Segoe UI Bold 14-24pt',
        links: [],
        applicableTemplates: ['default', 'engineering'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-3',
        title: 'Document Compliance Checklist',
        category: 'policy',
        description: 'Mandatory compliance requirements for all corporate documents',
        content: 'Every document must include: title page, toc, footer with page numbers, company branding',
        links: [],
        applicableTemplates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    return { message: 'Sample data initialized' };
  },

  // Proposals/Samples
  uploadProposal: async (documentType: string, fileContent: string, fileName: string) => {
    const proposalId = proposalGenerator();
    const proposal = {
      id: proposalId,
      documentType,
      entityType: 'document',
      fileContent,
      fileName,
      uploadedBy: 'user',
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      analysisStatus: 'pending',
      quality_score: null,
      issues: [],
    };
    proposals.push(proposal);
    console.log('Mock API: Proposal uploaded', proposalId);
    return {
      id: proposalId,
      message: 'Proposal uploaded successfully',
    };
  },

  getProposals: async () => {
    return proposals.map(p => ({
      ...p,
      samples: [p],
    }));
  },

  getProposal: async (id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) {
      throw new Error(`Proposal with id ${id} not found`);
    }
    return proposal;
  },

  deleteProposal: async (id: string) => {
    proposals = proposals.filter(p => p.id !== id);
    console.log('Mock API: Proposal deleted', id);
    return { message: 'Proposal deleted successfully' };
  },
};

// Custom components storage (in-memory)
let customComponents: Array<any> = [];
let globalStandards: Array<any> = [];
