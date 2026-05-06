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

    // Determine entity_type - use 'type' or 'entity_type' field
    const entityType = template.entity_type || template.type
    if (!entityType) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required field: entity_type or type',
        }),
      }
      return
    }

    // Build complete template with defaults for missing fields
    const completeTemplate = {
      ...template,
      entity_type: entityType,
      // Provide defaults if missing
      structure: template.structure || { sections: { required: [], optional: [] } },
      design: template.design || {
        colors: { primary: '#003366', secondary: '#0066CC' },
        fonts: { body: 'Segoe UI', heading: 'Segoe UI' },
      },
      global_rules: template.global_rules || {
        template_name: template.name || entityType,
        custom_config: template.config || {},
      },
    }

    const savedTemplate = await upsertTemplate({
      ...completeTemplate,
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
