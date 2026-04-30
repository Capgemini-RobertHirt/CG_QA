'use strict'

const { getTemplateByEntityType } = require('../lib/cosmosClient')

/**
 * GET /api/templates/{entityType}
 * Returns quality template for specified entity type
 */
module.exports = async function templatesGet(context, req) {
  try {
    // Safely extract route parameter with defensive check
    const route = context.bindingData?.route
    if (!route) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Route parameter is missing' }),
      }
      return
    }

    const { entityType } = route

    if (!entityType) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Entity type is required' }),
      }
      return
    }

    const template = await getTemplateByEntityType(entityType)

    if (!template) {
      context.res = {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Template for entity type '${entityType}' not found` }),
      }
      return
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    }
  } catch (error) {
    context.log(`Error fetching template: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch template',
        message: error.message,
      }),
    }
  }
}
