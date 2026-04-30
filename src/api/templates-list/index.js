'use strict'

const { getAllTemplates } = require('../lib/cosmosClient')

/**
 * GET /api/templates-list
 * Returns all templates with full structure and details
 */
module.exports = async function templatesList(context, req) {
  try {
    context.log('Loading templates...')
    const templates = await getAllTemplates()
    
    context.log(`Templates loaded: ${templates ? templates.length : 0}`)
    
    // Always return 200 with valid JSON, even if templates is empty
    const responseBody = {
      templates: Array.isArray(templates) ? templates : [],
      count: Array.isArray(templates) ? templates.length : 0,
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responseBody),
    }
  } catch (error) {
    context.log(`Error fetching templates: ${error.message}`)
    // Return comprehensive fallback templates with full structure
    const fallbackTemplates = [
      { 
        id: 'default', 
        entityType: 'default', 
        name: 'Default',
        structure: { 
          sections: { 
            required: ['introduction', 'proposal'], 
            optional: ['conclusion', 'appendix', 'references', 'acknowledgments'] 
          } 
        },
        document_types: { general_document: {}, business_brief: {}, proposal: {}, report: {}, information_sheet: {} },
        global_rules: { severity_levels: ['blocker', 'critical', 'major', 'minor', 'advisory'] },
      },
      { 
        id: 'engineering', 
        entityType: 'engineering', 
        name: 'Engineering',
        structure: { 
          sections: { 
            required: ['overview', 'requirements', 'design', 'implementation'], 
            optional: ['appendix', 'references', 'glossary'] 
          } 
        },
        document_types: { technical_spec: {}, design_doc: {}, architecture: {} },
      },
      { 
        id: 'asset', 
        entityType: 'asset', 
        name: 'Asset',
        structure: { 
          sections: { 
            required: ['overview', 'inventory', 'specifications'], 
            optional: ['appendix', 'references', 'details'] 
          } 
        },
        document_types: { asset_list: {}, asset_details: {} },
      },
      { 
        id: 'whitepaper', 
        entityType: 'whitepaper', 
        name: 'Whitepaper',
        structure: { 
          sections: { 
            required: ['abstract', 'introduction', 'content', 'conclusion', 'references'], 
            optional: ['appendix', 'glossary', 'index', 'foreword'] 
          } 
        },
        document_types: { whitepaper: {}, technical_paper: {}, research_paper: {} },
      },
      { 
        id: 'point_of_view', 
        entityType: 'point_of_view', 
        name: 'Point of View',
        structure: { 
          sections: { 
            required: ['introduction', 'perspective', 'rationale', 'conclusion'], 
            optional: ['appendix', 'references', 'case_studies'] 
          } 
        },
        document_types: { pov: {}, perspective: {}, viewpoint: {} },
      },
      { 
        id: 'rfp_rfi_response', 
        entityType: 'rfp_rfi_response', 
        name: 'RFP/RFI Response',
        structure: { 
          sections: { 
            required: ['executive_summary', 'approach', 'team', 'pricing', 'timeline'], 
            optional: ['appendix', 'references', 'case_studies', 'credentials'] 
          } 
        },
        document_types: { rfp_response: {}, rfi_response: {}, proposal_response: {} },
      },
      { 
        id: 'internal_meeting_presentation', 
        entityType: 'internal_meeting_presentation', 
        name: 'Internal Meeting Presentation',
        structure: { 
          sections: { 
            required: ['agenda', 'content', 'action_items', 'next_steps'], 
            optional: ['appendix', 'references', 'notes', 'attendees'] 
          } 
        },
        document_types: { presentation: {}, meeting_slides: {}, briefing: {} },
      },
    ]
    
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: fallbackTemplates,
        count: fallbackTemplates.length,
        message: 'Using fallback templates',
      }),
    }
  }
}
