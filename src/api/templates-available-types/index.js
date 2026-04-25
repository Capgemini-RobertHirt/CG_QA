'use strict'

const { getAllTemplateEntityTypes } = require('../lib/cosmosClient')

/**
 * GET /api/templates/available-types
 * Returns list of all available template entity types
 */
module.exports = async function templatesAvailableTypes(context, req) {
  try {
    const entityTypes = await getAllTemplateEntityTypes()

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        available_types: entityTypes,
        count: entityTypes.length,
      }),
    }
  } catch (error) {
    context.log(`Error fetching template types: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch template types',
        message: error.message,
      }),
    }
  }
}
