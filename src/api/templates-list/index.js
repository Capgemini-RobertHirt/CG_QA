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
    // Return fallback templates on error instead of 500
    const fallbackTemplates = [
      { id: 'default', entityType: 'default', name: 'Default', structure: { sections: { required: ['intro', 'proposal'], optional: ['conclusion'] } } },
      { id: 'engineering', entityType: 'engineering', name: 'Engineering', structure: { sections: { required: ['overview', 'design'], optional: ['appendix'] } } },
      { id: 'asset', entityType: 'asset', name: 'Asset', structure: { sections: { required: ['overview'], optional: ['details'] } } },
      { id: 'whitepaper', entityType: 'whitepaper', name: 'Whitepaper', structure: { sections: { required: ['abstract', 'intro'], optional: ['conclusion'] } } },
      { id: 'point_of_view', entityType: 'point_of_view', name: 'Point of View', structure: { sections: { required: ['intro'], optional: ['conclusion'] } } },
      { id: 'rfp_rfi_response', entityType: 'rfp_rfi_response', name: 'RFP/RFI Response', structure: { sections: { required: ['summary', 'approach'], optional: ['pricing'] } } },
      { id: 'internal_meeting_presentation', entityType: 'internal_meeting_presentation', name: 'Internal Meeting Presentation', structure: { sections: { required: ['agenda'], optional: ['notes'] } } },
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
