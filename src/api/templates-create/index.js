'use strict'

const { upsertTemplate } = require('../lib/cosmosClient')

/**
 * POST /api/templates
 * Create or update a quality template (admin only)
 * Expects JSON body with template configuration
 */
module.exports = async function templatesCreate(context, req) {
  try {
    const template = req.body

    if (!template.entity_type) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required field: entity_type',
        }),
      }
      return
    }

    // Validate template structure
    if (!template.global_rules || !template.structure || !template.design) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid template structure. Missing required sections: global_rules, structure, design',
        }),
      }
      return
    }

    const savedTemplate = await upsertTemplate({
      ...template,
      created_by: context.bindingData.user?.name || 'system',
    })

    context.res = {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: savedTemplate.id,
        entity_type: savedTemplate.entityType,
        message: 'Template created/updated successfully',
      }),
    }
  } catch (error) {
    context.log(`Error creating template: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create template',
        message: error.message,
      }),
    }
  }
}
