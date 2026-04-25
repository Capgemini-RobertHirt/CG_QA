'use strict'

const fs = require('fs').promises
const path = require('path')
const { upsertTemplate } = require('../lib/cosmosClient')

/**
 * POST /api/admin/load-templates
 * Load quality templates from JSON files into Cosmos DB (admin only)
 */
module.exports = async function loadTemplates(context, req) {
  try {
    // Path to templates directory (from current working directory)
    const templatesDir = path.join(process.cwd(), 'src', 'api', 'templates')

    // List of template files to load
    const templateFiles = [
      'rfp_rfi_response.json',
      'whitepaper.json',
      'asset.json',
      'point_of_view.json',
      'internal_meeting_presentation.json',
      'engineering.json',
      'default.json',
    ]

    const results = {
      loaded: [],
      failed: [],
    }

    for (const file of templateFiles) {
      try {
        const filePath = path.join(templatesDir, file)
        const fileContent = await fs.readFile(filePath, 'utf-8')
        const template = JSON.parse(fileContent)

        // Ensure required fields
        if (!template.entity_type) {
          throw new Error('Template missing entity_type field')
        }

        // Save to Cosmos DB
        await upsertTemplate({
          ...template,
          created_by: context.bindingData.user?.name || 'system',
        })

        results.loaded.push(template.entity_type)
        context.log(`Loaded template: ${template.entity_type}`)
      } catch (error) {
        results.failed.push({
          file,
          error: error.message,
        })
        context.log(`Failed to load template from ${file}: ${error.message}`)
      }
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Template loading completed',
        ...results,
      }),
    }
  } catch (error) {
    context.log(`Error loading templates: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to load templates',
        message: error.message,
      }),
    }
  }
}
