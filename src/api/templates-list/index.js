'use strict'

const { getAllTemplates } = require('../lib/cosmosClient')

/**
 * GET /api/templates-list
 * Returns all templates with full structure and details
 */
module.exports = async function templatesList(context, req) {
  try {
    const templates = await getAllTemplates()
    
    if (!templates || templates.length === 0) {
      context.log('Warning: No templates found')
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: templates || [],
        count: (templates || []).length,
      }),
    }
  } catch (error) {
    context.log(`Error fetching templates: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch templates',
        message: error.message,
      }),
    }
  }
}
