/**
 * Template Structure Generator
 * Generates default component instances for template sections
 * Maps section names to appropriate component configurations
 */

import { v4 as uuidv4 } from 'uuid';

export interface ComponentInstance {
  id: string;
  componentId: string;
  name: string;
  category: 'text' | 'layout' | 'media' | 'special' | 'container';
  properties: Record<string, any>;
  subcomponents: SubcomponentInstance[];
}

export interface SubcomponentInstance {
  id: string;
  subcomponentId: string;
  name: string;
  properties: Record<string, any>;
}

export interface SectionStructure {
  components: ComponentInstance[];
}

/**
 * Mapping of section names to default component configurations
 * Each section typically starts with a title/heading and paragraphs
 */
const SECTION_COMPONENT_MAPS: Record<string, Array<{
  componentId: string;
  name: string;
  properties: Record<string, any>;
  subcomponents: Array<{
    subcomponentId: string;
    name: string;
    properties: Record<string, any>;
  }>;
}>> = {
  // Introduction/Overview sections
  'introduction': [
    {
      componentId: 'card',
      name: 'Introduction Card',
      properties: { title: 'Introduction', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Section Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Overview Text', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'executive_summary': [
    {
      componentId: 'card',
      name: 'Executive Summary',
      properties: { title: 'Executive Summary', variant: 'highlight' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Section Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Summary Text', properties: { fontSize: '12px', lineHeight: '1.5' } },
        { subcomponentId: 'bullet_list', name: 'Key Points', properties: {} },
      ],
    },
  ],
  'overview': [
    {
      componentId: 'card',
      name: 'Overview',
      properties: { title: 'Overview', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Section Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Overview Content', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],

  // Architecture/Design sections
  'architecture': [
    {
      componentId: 'column',
      name: 'Architecture Section',
      properties: { columns: 2, gap: '20px' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Architecture Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Architecture Description', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
    {
      componentId: 'image',
      name: 'Architecture Diagram',
      properties: { alignment: 'center', caption: true, width: '90%', height: 'auto' },
      subcomponents: [],
    },
  ],
  'technical_architecture': [
    {
      componentId: 'card',
      name: 'Technical Architecture',
      properties: { title: 'Architecture', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Architecture Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Architecture Details', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
    {
      componentId: 'table',
      name: 'Architecture Components',
      properties: { rows: 5, columns: 3 },
      subcomponents: [],
    },
  ],
  'design': [
    {
      componentId: 'card',
      name: 'Design Section',
      properties: { title: 'Design', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Design Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Design Description', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'design_principles': [
    {
      componentId: 'callout',
      name: 'Design Principles',
      properties: { type: 'info', backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Principles', properties: { fontSize: '16px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Principle List', properties: {} },
      ],
    },
  ],

  // Implementation sections
  'implementation': [
    {
      componentId: 'card',
      name: 'Implementation Details',
      properties: { title: 'Implementation', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Implementation Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'numbered_list', name: 'Implementation Steps', properties: {} },
      ],
    },
    {
      componentId: 'code_block',
      name: 'Implementation Code',
      properties: { language: 'python', lineNumbers: true, highlight: true },
      subcomponents: [],
    },
  ],
  'implementation_guide': [
    {
      componentId: 'card',
      name: 'Implementation Guide',
      properties: { title: 'Implementation Guide', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Guide Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Guide Introduction', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'deployment': [
    {
      componentId: 'timeline',
      name: 'Deployment Timeline',
      properties: { orientation: 'vertical', itemCount: 4, dotColor: '#003366' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Timeline Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
      ],
    },
  ],

  // Technical sections
  'technical_overview': [
    {
      componentId: 'card',
      name: 'Technical Overview',
      properties: { title: 'Technical Overview', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Technical Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Technical Details', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'technical_specification': [
    {
      componentId: 'table',
      name: 'Technical Specifications',
      properties: { rows: 6, columns: 2 },
      subcomponents: [],
    },
  ],
  'requirements': [
    {
      componentId: 'card',
      name: 'Requirements',
      properties: { title: 'Requirements', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Requirements Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Requirement List', properties: {} },
      ],
    },
  ],
  'features': [
    {
      componentId: 'grid',
      name: 'Feature Grid',
      properties: { rows: 2, columns: 2, gap: '20px' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Features Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
      ],
    },
  ],

  // Business/Proposal sections
  'proposal': [
    {
      componentId: 'card',
      name: 'Proposal Details',
      properties: { title: 'Proposal', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Proposal Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Proposal Description', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'business_case': [
    {
      componentId: 'card',
      name: 'Business Case',
      properties: { title: 'Business Case', variant: 'highlight' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Business Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Business Justification', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'benefits': [
    {
      componentId: 'card',
      name: 'Benefits',
      properties: { title: 'Benefits', variant: 'highlight' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Benefits Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Benefit List', properties: {} },
      ],
    },
  ],
  'value_proposition': [
    {
      componentId: 'callout',
      name: 'Value Proposition',
      properties: { type: 'success', backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Value Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Value Description', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],

  // Risk/Compliance sections
  'risk_mitigation': [
    {
      componentId: 'table',
      name: 'Risk Matrix',
      properties: { rows: 5, columns: 4 },
      subcomponents: [],
    },
  ],
  'risks': [
    {
      componentId: 'callout',
      name: 'Risk Assessment',
      properties: { type: 'warning', backgroundColor: '#FFF3E0', borderColor: '#E65100' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Risk Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Risk List', properties: {} },
      ],
    },
  ],
  'compliance': [
    {
      componentId: 'card',
      name: 'Compliance Requirements',
      properties: { title: 'Compliance', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Compliance Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Compliance Items', properties: {} },
      ],
    },
  ],
  'compliance_matrix': [
    {
      componentId: 'table',
      name: 'Compliance Matrix',
      properties: { rows: 6, columns: 3 },
      subcomponents: [],
    },
  ],

  // Performance/Metrics sections
  'performance': [
    {
      componentId: 'chart',
      name: 'Performance Metrics',
      properties: { chartType: 'line', dataPoints: 10 },
      subcomponents: [],
    },
  ],
  'performance_metrics': [
    {
      componentId: 'grid',
      name: 'Key Metrics',
      properties: { rows: 2, columns: 2, gap: '16px' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Metrics Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
      ],
    },
  ],
  'metrics': [
    {
      componentId: 'table',
      name: 'Metrics Table',
      properties: { rows: 5, columns: 3 },
      subcomponents: [],
    },
  ],

  // Support/Operations sections
  'support': [
    {
      componentId: 'card',
      name: 'Support Details',
      properties: { title: 'Support', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Support Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Support Description', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'operations': [
    {
      componentId: 'card',
      name: 'Operations',
      properties: { title: 'Operations', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Operations Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Operations Plan', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],

  // Conclusion/Next Steps
  'conclusion': [
    {
      componentId: 'card',
      name: 'Conclusion',
      properties: { title: 'Conclusion', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Conclusion Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Conclusion Text', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'next_steps': [
    {
      componentId: 'numbered_list',
      name: 'Action Items',
      properties: {},
      subcomponents: [
        { subcomponentId: 'title', name: 'Next Steps Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
      ],
    },
  ],

  // Appendix/References
  'appendix': [
    {
      componentId: 'card',
      name: 'Appendix',
      properties: { title: 'Appendix', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Appendix Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Appendix Content', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
  'references': [
    {
      componentId: 'card',
      name: 'References',
      properties: { title: 'References', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'References Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'bullet_list', name: 'Reference List', properties: {} },
      ],
    },
  ],

  // Pricing/Cost sections
  'pricing': [
    {
      componentId: 'table',
      name: 'Pricing Structure',
      properties: { rows: 4, columns: 3 },
      subcomponents: [],
    },
  ],
  'cost_estimation': [
    {
      componentId: 'table',
      name: 'Cost Breakdown',
      properties: { rows: 5, columns: 2 },
      subcomponents: [],
    },
  ],

  // Generic fallback for any section
  'default': [
    {
      componentId: 'card',
      name: 'Section Content',
      properties: { title: 'Section', variant: 'default' },
      subcomponents: [
        { subcomponentId: 'title', name: 'Section Title', properties: { fontSize: '24px', fontWeight: 'bold' } },
        { subcomponentId: 'paragraph', name: 'Section Content', properties: { fontSize: '12px', lineHeight: '1.5' } },
      ],
    },
  ],
};

/**
 * Creates a component instance from template definition
 */
function createComponentInstance(
  componentDef: typeof SECTION_COMPONENT_MAPS['default'][0]
): ComponentInstance {
  const componentId = uuidv4();
  
  const subcomponents: SubcomponentInstance[] = componentDef.subcomponents.map(subcomp => ({
    id: uuidv4(),
    subcomponentId: subcomp.subcomponentId,
    name: subcomp.name,
    properties: subcomp.properties || {},
  }));

  return {
    id: componentId,
    componentId: componentDef.componentId,
    name: componentDef.name,
    category: 'container', // Default category; can be overridden based on componentId
    properties: componentDef.properties || {},
    subcomponents,
  };
}

/**
 * Generates component instances for a given section
 * Returns default configuration if section not in map
 */
function generateComponentsForSection(sectionName: string): ComponentInstance[] {
  // Normalize section name (lowercase, replace spaces/dashes with underscores)
  const normalized = sectionName.toLowerCase().replace(/[\s-]/g, '_');
  
  // Get component definitions for this section (or use default)
  const componentDefs = SECTION_COMPONENT_MAPS[normalized] || SECTION_COMPONENT_MAPS['default'];
  
  // Create instances for each component definition
  return componentDefs.map(createComponentInstance);
}

/**
 * Generates complete template structure from sections
 */
export function generateTemplateStructure(
  requiredSections: string[] = [],
  optionalSections: string[] = []
): Record<string, SectionStructure> {
  const structure: Record<string, SectionStructure> = {};
  
  // Add required sections
  requiredSections.forEach(section => {
    structure[section] = {
      components: generateComponentsForSection(section),
    };
  });

  // Add optional sections
  optionalSections.forEach(section => {
    structure[section] = {
      components: generateComponentsForSection(section),
    };
  });

  return structure;
}

/**
 * Enriches an existing template structure with missing section configurations
 */
export function enrichTemplateStructure(
  existingStructure: Record<string, any>,
  requiredSections: string[] = [],
  optionalSections: string[] = []
): Record<string, SectionStructure> {
  const enrichedStructure: Record<string, SectionStructure> = {};
  
  // Process required sections
  requiredSections.forEach(section => {
    enrichedStructure[section] = existingStructure[section] || {
      components: generateComponentsForSection(section),
    };
  });

  // Process optional sections
  optionalSections.forEach(section => {
    enrichedStructure[section] = existingStructure[section] || {
      components: generateComponentsForSection(section),
    };
  });

  // Preserve any other sections from existing structure
  Object.keys(existingStructure).forEach(section => {
    if (!enrichedStructure[section]) {
      enrichedStructure[section] = existingStructure[section];
    }
  });

  return enrichedStructure;
}
