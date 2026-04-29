/**
 * Template Update Script
 * Adds component structure to all template JSON files
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Section name to component mapping (comprehensive version)
const SECTION_COMPONENTS = {
  // Generic sections
  'introduction': { comp: 'card', name: 'Introduction', icon: '📄' },
  'executive_summary': { comp: 'card', name: 'Executive Summary', icon: '📊' },
  'overview': { comp: 'card', name: 'Overview', icon: '👁️' },
  'proposal': { comp: 'card', name: 'Proposal', icon: '📝' },
  'conclusion': { comp: 'card', name: 'Conclusion', icon: '📌' },
  'appendix': { comp: 'card', name: 'Appendix', icon: '📎' },
  'references': { comp: 'card', name: 'References', icon: '📚' },
  'acknowledgments': { comp: 'card', name: 'Acknowledgments', icon: '🙏' },
  
  // Technical sections
  'technical_overview': { comp: 'card', name: 'Technical Overview', icon: '🔧' },
  'architecture': { comp: 'column', name: 'Architecture', icon: '🏗️' },
  'technical_architecture': { comp: 'card', name: 'Technical Architecture', icon: '🏗️' },
  'design': { comp: 'card', name: 'Design', icon: '🎨' },
  'design_principles': { comp: 'callout', name: 'Design Principles', icon: '✨' },
  'implementation': { comp: 'card', name: 'Implementation', icon: '⚙️' },
  'implementation_guide': { comp: 'card', name: 'Implementation Guide', icon: '📖' },
  'deployment': { comp: 'timeline', name: 'Deployment', icon: '📅' },
  'technical_specification': { comp: 'table', name: 'Technical Specifications', icon: '📋' },
  'requirements': { comp: 'card', name: 'Requirements', icon: '✓' },
  'features': { comp: 'grid', name: 'Features', icon: '⭐' },
  
  // Business/Proposal sections
  'business_case': { comp: 'card', name: 'Business Case', icon: '💼' },
  'benefits': { comp: 'card', name: 'Benefits', icon: '🎁' },
  'value_proposition': { comp: 'callout', name: 'Value Proposition', icon: '💡' },
  'business_context': { comp: 'card', name: 'Business Context', icon: '🌍' },
  'business_value': { comp: 'card', name: 'Business Value', icon: '💰' },
  
  // Risk/Compliance sections
  'risk_mitigation': { comp: 'table', name: 'Risk Mitigation', icon: '⚠️' },
  'risks': { comp: 'callout', name: 'Risks', icon: '⚠️' },
  'risk_management': { comp: 'table', name: 'Risk Management', icon: '⚠️' },
  'compliance': { comp: 'card', name: 'Compliance', icon: '✅' },
  'compliance_matrix': { comp: 'table', name: 'Compliance Matrix', icon: '📊' },
  'compliance_certifications': { comp: 'card', name: 'Compliance Certifications', icon: '🏅' },
  
  // Performance/Metrics sections
  'performance': { comp: 'chart', name: 'Performance', icon: '📈' },
  'performance_metrics': { comp: 'grid', name: 'Performance Metrics', icon: '📊' },
  'metrics': { comp: 'table', name: 'Metrics', icon: '📈' },
  'findings_analysis': { comp: 'table', name: 'Findings & Analysis', icon: '🔍' },
  
  // Support/Operations sections
  'support': { comp: 'card', name: 'Support', icon: '🛠️' },
  'operations': { comp: 'card', name: 'Operations', icon: '⚙️' },
  'support_contact': { comp: 'card', name: 'Support Contact', icon: '📞' },
  'contact_information': { comp: 'card', name: 'Contact Information', icon: '📞' },
  
  // Pricing/Terms sections
  'pricing': { comp: 'table', name: 'Pricing', icon: '💰' },
  'pricing_commercial': { comp: 'table', name: 'Pricing & Commercial', icon: '💰' },
  'cost_estimation': { comp: 'table', name: 'Cost Estimation', icon: '💵' },
  'terms_conditions': { comp: 'card', name: 'Terms & Conditions', icon: '📋' },
  
  // Timeline/Process sections
  'next_steps': { comp: 'timeline', name: 'Next Steps', icon: '→' },
  'implementation_timeline': { comp: 'timeline', name: 'Implementation Timeline', icon: '📅' },
  'action_items': { comp: 'numbered_list', name: 'Action Items', icon: '✓' },
  
  // Team/Qualifications sections
  'team_qualifications': { comp: 'card', name: 'Team Qualifications', icon: '👥' },
  'team': { comp: 'card', name: 'Team', icon: '👥' },
  
  // Asset-specific sections
  'title_description': { comp: 'card', name: 'Title & Description', icon: '📝' },
  'asset_overview': { comp: 'card', name: 'Asset Overview', icon: '📦' },
  'key_content': { comp: 'grid', name: 'Key Content', icon: '⭐' },
  'usage_instructions': { comp: 'numbered_list', name: 'Usage Instructions', icon: '📖' },
  'related_assets': { comp: 'grid', name: 'Related Assets', icon: '🔗' },
  'faq': { comp: 'card', name: 'FAQ', icon: '❓' },
  
  // Meeting/Presentation sections
  'title_slide': { comp: 'card', name: 'Title Slide', icon: '🎬' },
  'meeting_agenda': { comp: 'numbered_list', name: 'Meeting Agenda', icon: '📋' },
  'background_context': { comp: 'card', name: 'Background Context', icon: '📚' },
  'key_topics': { comp: 'grid', name: 'Key Topics', icon: '🎯' },
  'discussion_points': { comp: 'card', name: 'Discussion Points', icon: '💬' },
  'executive_perspective': { comp: 'callout', name: 'Executive Perspective', icon: '👔' },
  'key_insights': { comp: 'card', name: 'Key Insights', icon: '💡' },
  'market_implications': { comp: 'card', name: 'Market Implications', icon: '📊' },
  'strategic_recommendations': { comp: 'card', name: 'Strategic Recommendations', icon: '🎯' },
  'call_to_action': { comp: 'callout', name: 'Call to Action', icon: '🚀' },
  
  // RFP/Proposal sections
  'solution_overview': { comp: 'card', name: 'Solution Overview', icon: '💡' },
  'approach_methodology': { comp: 'card', name: 'Approach & Methodology', icon: '📐' },
  'case_studies': { comp: 'grid', name: 'Case Studies', icon: '📖' },
  'case_examples': { comp: 'grid', name: 'Case Examples', icon: '📖' },
  
  // Whitepaper sections
  'title_page': { comp: 'card', name: 'Title Page', icon: '📖' },
  'problem_statement': { comp: 'card', name: 'Problem Statement', icon: '❌' },
  'research_methodology': { comp: 'card', name: 'Research Methodology', icon: '🔬' },
  'recommendations': { comp: 'card', name: 'Recommendations', icon: '✨' },
  'glossary': { comp: 'card', name: 'Glossary', icon: '📚' },
};

function createComponentInstance(componentId, componentName) {
  const id = uuidv4();
  
  // Default subcomponents for text-based sections
  const subcomponents = [
    {
      id: uuidv4(),
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
      id: uuidv4(),
      subcomponentId: 'paragraph',
      name: 'Section Content',
      properties: {
        fontSize: '12px',
        lineHeight: '1.5',
        color: '#333333',
      },
    },
  ];

  // For specific component types, add appropriate subcomponents
  if (componentId === 'table' || componentId === 'chart') {
    // Tables and charts typically just have the component itself
    return {
      id,
      componentId,
      name: componentName,
      category: 'media',
      properties: {
        title: componentName,
      },
      subcomponents: [],
    };
  }

  if (componentId === 'timeline') {
    return {
      id,
      componentId,
      name: componentName,
      category: 'special',
      properties: {
        orientation: 'vertical',
        itemCount: 4,
      },
      subcomponents: [subcomponents[0]], // Just title
    };
  }

  if (componentId === 'grid') {
    return {
      id,
      componentId,
      name: componentName,
      category: 'layout',
      properties: {
        rows: 2,
        columns: 2,
        gap: '16px',
      },
      subcomponents: [subcomponents[0]], // Just title
    };
  }

  return {
    id,
    componentId,
    name: componentName,
    category: componentId === 'callout' ? 'special' : (componentId === 'column' ? 'layout' : 'container'),
    properties: {
      title: componentName,
      variant: 'default',
    },
    subcomponents,
  };
}

function generateStructureForSections(sections) {
  const structure = {};
  
  sections.forEach(sectionName => {
    let mapping = SECTION_COMPONENTS[sectionName];
    
    // If not found, try to build a sensible default based on the section name
    if (!mapping) {
      const displayName = sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      mapping = { comp: 'card', name: displayName, icon: '📋' };
    }
    
    if (!structure[sectionName]) {
      structure[sectionName] = {
        components: [
          createComponentInstance(
            mapping.comp,
            mapping.name
          ),
        ],
      };
    }
  });

  return structure;
}

function updateTemplate(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const requiredSections = data.structure?.sections?.required || [];
    const optionalSections = data.structure?.sections?.optional || [];
    
    // Generate component structure
    const allSections = [...requiredSections, ...optionalSections];
    const generatedStructure = generateStructureForSections(allSections);
    
    // Update template structure with component instances
    if (!data.structure) {
      data.structure = {};
    }
    if (!data.structure.legoBlocks) {
      data.structure.legoBlocks = generatedStructure;
    } else {
      // Merge with existing
      Object.assign(data.structure.legoBlocks, generatedStructure);
    }

    // Write back the updated template
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Updated: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error updating ${path.basename(filePath)}:`, error.message);
  }
}

// Update all template files
const templateFiles = fs.readdirSync(TEMPLATES_DIR)
  .filter(file => file.endsWith('.json'))
  .map(file => path.join(TEMPLATES_DIR, file));

console.log(`🔄 Updating ${templateFiles.length} templates...\n`);

templateFiles.forEach(updateTemplate);

console.log(`\n✨ Template update complete!`);
