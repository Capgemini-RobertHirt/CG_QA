'use strict'

/**
 * GET /api/templates/list
 * Returns all templates with full structure, details, and legoBlocks
 * SIMPLE AND BULLETPROOF - No complex logic, always returns valid JSON
 */
module.exports = async function templatesList(context, req) {
  try {
    // Fallback templates with legoBlocks - GUARANTEED VALID JSON
    const templates = [
      { 
        id: 'default', 
        entityType: 'default', 
        entity_type: 'default',
        name: 'Default', 
        documentTypes: {},
        structure: { sections: { required: ['introduction', 'proposal'], optional: ['conclusion', 'appendix', 'references', 'acknowledgments'] } },
        legoBlocks: {
          introduction: { components: [{ id: '1', componentId: 'card', name: 'Introduction', subcomponents: [{ id: '1a', subcomponentId: 'title', name: 'Title' }, { id: '1b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          proposal: { components: [{ id: '2', componentId: 'card', name: 'Proposal', subcomponents: [{ id: '2a', subcomponentId: 'title', name: 'Title' }, { id: '2b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          conclusion: { components: [{ id: '3', componentId: 'card', name: 'Conclusion', subcomponents: [{ id: '3a', subcomponentId: 'title', name: 'Title' }, { id: '3b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          appendix: { components: [{ id: '4', componentId: 'card', name: 'Appendix', subcomponents: [{ id: '4a', subcomponentId: 'title', name: 'Title' }, { id: '4b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References', subcomponents: [{ id: '5a', subcomponentId: 'list', name: 'Reference List' }] }] },
          acknowledgments: { components: [{ id: '6', componentId: 'card', name: 'Acknowledgments', subcomponents: [{ id: '6a', subcomponentId: 'paragraph', name: 'Acknowledgment Text' }] }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'engineering', 
        entityType: 'engineering', 
        entity_type: 'engineering',
        name: 'Engineering', 
        documentTypes: {},
        structure: { sections: { required: ['overview', 'requirements', 'design', 'implementation'], optional: ['appendix', 'references', 'glossary'] } },
        legoBlocks: {
          overview: { components: [{ id: '1', componentId: 'card', name: 'Overview' }] },
          requirements: { components: [{ id: '2', componentId: 'card', name: 'Requirements' }] },
          design: { components: [{ id: '3', componentId: 'card', name: 'Design' }] },
          implementation: { components: [{ id: '4', componentId: 'card', name: 'Implementation' }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References' }] },
          glossary: { components: [{ id: '7', componentId: 'card', name: 'Glossary' }] },
          technical_overview: { components: [{ id: '8', componentId: 'card', name: 'Technical Overview' }] },
          architecture: { components: [{ id: '9', componentId: 'card', name: 'Architecture' }] },
          support: { components: [{ id: '10', componentId: 'card', name: 'Support' }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'asset', 
        entityType: 'asset', 
        entity_type: 'asset',
        name: 'Asset', 
        documentTypes: {},
        structure: { sections: { required: ['overview', 'inventory', 'specifications'], optional: ['appendix', 'references', 'details'] } },
        legoBlocks: {
          overview: { components: [{ id: '1', componentId: 'card', name: 'Overview' }] },
          inventory: { components: [{ id: '2', componentId: 'card', name: 'Inventory' }] },
          specifications: { components: [{ id: '3', componentId: 'card', name: 'Specifications' }] },
          appendix: { components: [{ id: '4', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References' }] },
          details: { components: [{ id: '6', componentId: 'card', name: 'Details' }] },
          title_description: { components: [{ id: '7', componentId: 'card', name: 'Title & Description' }] },
          asset_overview: { components: [{ id: '8', componentId: 'card', name: 'Asset Overview' }] },
          key_content: { components: [{ id: '9', componentId: 'card', name: 'Key Content' }] },
          usage_instructions: { components: [{ id: '10', componentId: 'card', name: 'Usage Instructions' }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'whitepaper', 
        entityType: 'whitepaper', 
        entity_type: 'whitepaper',
        name: 'Whitepaper', 
        documentTypes: {},
        structure: { sections: { required: ['abstract', 'introduction', 'content', 'conclusion', 'references'], optional: ['appendix', 'glossary', 'index', 'foreword'] } },
        legoBlocks: {
          abstract: { components: [{ id: '1', componentId: 'card', name: 'Abstract' }] },
          introduction: { components: [{ id: '2', componentId: 'card', name: 'Introduction' }] },
          content: { components: [{ id: '3', componentId: 'card', name: 'Content' }] },
          conclusion: { components: [{ id: '4', componentId: 'card', name: 'Conclusion' }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References' }] },
          appendix: { components: [{ id: '6', componentId: 'card', name: 'Appendix' }] },
          glossary: { components: [{ id: '7', componentId: 'card', name: 'Glossary' }] },
          index: { components: [{ id: '8', componentId: 'card', name: 'Index' }] },
          foreword: { components: [{ id: '9', componentId: 'card', name: 'Foreword' }] },
          title_page: { components: [{ id: '10', componentId: 'card', name: 'Title Page' }] },
          executive_summary: { components: [{ id: '11', componentId: 'card', name: 'Executive Summary' }] },
          background_context: { components: [{ id: '12', componentId: 'card', name: 'Background' }] },
          case_studies: { components: [{ id: '13', componentId: 'card', name: 'Case Studies' }] },
          acknowledgments: { components: [{ id: '14', componentId: 'card', name: 'Acknowledgments' }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'point_of_view', 
        entityType: 'point_of_view', 
        entity_type: 'point_of_view',
        name: 'Point of View', 
        documentTypes: {},
        structure: { sections: { required: ['introduction', 'perspective', 'rationale', 'conclusion'], optional: ['appendix', 'references', 'case_studies'] } },
        legoBlocks: {
          introduction: { components: [{ id: '1', componentId: 'card', name: 'Introduction' }] },
          perspective: { components: [{ id: '2', componentId: 'card', name: 'Perspective' }] },
          rationale: { components: [{ id: '3', componentId: 'card', name: 'Rationale' }] },
          conclusion: { components: [{ id: '4', componentId: 'card', name: 'Conclusion' }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References' }] },
          case_studies: { components: [{ id: '7', componentId: 'card', name: 'Case Studies' }] },
          title_overview: { components: [{ id: '8', componentId: 'card', name: 'Title & Overview' }] },
          executive_perspective: { components: [{ id: '9', componentId: 'card', name: 'Executive Perspective' }] },
          key_insights: { components: [{ id: '10', componentId: 'card', name: 'Key Insights' }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'rfp_rfi_response', 
        entityType: 'rfp_rfi_response', 
        entity_type: 'rfp_rfi_response',
        name: 'RFP/RFI Response', 
        documentTypes: {},
        structure: { sections: { required: ['executive_summary', 'approach', 'team', 'pricing', 'timeline'], optional: ['appendix', 'references', 'case_studies', 'credentials'] } },
        legoBlocks: {
          executive_summary: { components: [{ id: '1', componentId: 'card', name: 'Executive Summary' }] },
          approach: { components: [{ id: '2', componentId: 'card', name: 'Approach' }] },
          team: { components: [{ id: '3', componentId: 'card', name: 'Team' }] },
          pricing: { components: [{ id: '4', componentId: 'card', name: 'Pricing' }] },
          timeline: { components: [{ id: '5', componentId: 'card', name: 'Timeline' }] },
          appendix: { components: [{ id: '6', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '7', componentId: 'card', name: 'References' }] },
          case_studies: { components: [{ id: '8', componentId: 'card', name: 'Case Studies' }] },
          credentials: { components: [{ id: '9', componentId: 'card', name: 'Credentials' }] },
          solution_overview: { components: [{ id: '10', componentId: 'card', name: 'Solution Overview' }] },
          implementation_timeline: { components: [{ id: '11', componentId: 'card', name: 'Implementation Timeline' }] },
          compliance_certifications: { components: [{ id: '12', componentId: 'card', name: 'Compliance' }] },
        },
        type: 'quality-template',
      },
      { 
        id: 'internal_meeting_presentation', 
        entityType: 'internal_meeting_presentation', 
        entity_type: 'internal_meeting_presentation',
        name: 'Internal Meeting Presentation', 
        documentTypes: {},
        structure: { sections: { required: ['agenda', 'content', 'action_items', 'next_steps'], optional: ['appendix', 'references', 'notes', 'attendees'] } },
        legoBlocks: {
          agenda: { components: [{ id: '1', componentId: 'card', name: 'Agenda' }] },
          content: { components: [{ id: '2', componentId: 'card', name: 'Content' }] },
          action_items: { components: [{ id: '3', componentId: 'card', name: 'Action Items' }] },
          next_steps: { components: [{ id: '4', componentId: 'card', name: 'Next Steps' }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References' }] },
          notes: { components: [{ id: '7', componentId: 'card', name: 'Meeting Notes' }] },
          attendees: { components: [{ id: '8', componentId: 'card', name: 'Attendees' }] },
          title_slide: { components: [{ id: '9', componentId: 'card', name: 'Title Slide' }] },
          executive_summary: { components: [{ id: '10', componentId: 'card', name: 'Executive Summary' }] },
          discussion_points: { components: [{ id: '11', componentId: 'card', name: 'Discussion Points' }] },
          contact_information: { components: [{ id: '12', componentId: 'card', name: 'Contact Information' }] },
        },
        type: 'quality-template',
      },
    ]

    // Return valid response
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: templates,
        count: templates.length,
      }),
    }
  } catch (error) {
    // Fallback response - even if something breaks, return templates
    const fallback = [
      { id: 'default', entityType: 'default', name: 'Default', legoBlocks: { default: { components: [{ id: '1', name: 'Default' }] } } },
      { id: 'engineering', entityType: 'engineering', name: 'Engineering', legoBlocks: { eng: { components: [{ id: '1', name: 'Engineering' }] } } },
      { id: 'asset', entityType: 'asset', name: 'Asset', legoBlocks: { asset: { components: [{ id: '1', name: 'Asset' }] } } },
      { id: 'whitepaper', entityType: 'whitepaper', name: 'Whitepaper', legoBlocks: { wp: { components: [{ id: '1', name: 'Whitepaper' }] } } },
      { id: 'point_of_view', entityType: 'point_of_view', name: 'Point of View', legoBlocks: { pov: { components: [{ id: '1', name: 'POV' }] } } },
      { id: 'rfp_rfi_response', entityType: 'rfp_rfi_response', name: 'RFP/RFI Response', legoBlocks: { rfp: { components: [{ id: '1', name: 'RFP' }] } } },
      { id: 'internal_meeting_presentation', entityType: 'internal_meeting_presentation', name: 'Internal Meeting Presentation', legoBlocks: { presentation: { components: [{ id: '1', name: 'Presentation' }] } } },
    ]
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: fallback,
        count: fallback.length,
      }),
    }
  }
}
