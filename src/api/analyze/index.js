'use strict'

const { v4: uuidv4 } = require('uuid')
const { getTemplateByEntityType, upsertAnalysisResults } = require('../lib/cosmosClient')

/**
 * POST /api/analyze
 * Analyze a document against quality template
 * Expects JSON body with document content, document_type, and entity_type
 */
module.exports = async function analyze(context, req) {
  try {
    const { document_content, document_type, entity_type, file_name } = req.body

    if (!document_content || !document_type || !entity_type) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: document_content, document_type, entity_type',
        }),
      }
      return
    }

    // Get the quality template
    const template = await getTemplateByEntityType(entity_type)

    if (!template) {
      context.res = {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Template for entity type '${entity_type}' not found`,
        }),
      }
      return
    }

    // TODO: Implement actual document analysis logic
    // For now, return placeholder results
    const analysisId = uuidv4()
    const analysisResults = {
      id: analysisId,
      entity_type,
      document_type,
      file_name: file_name || 'document',
      scores: {
        structure: 85,
        design: 75,
        compliance: 90,
        business_context: 80,
        overall: 82.5,
      },
      findings: [
        {
          dimension: 'structure',
          severity: 'minor',
          message: 'Missing appendix section',
        },
        {
          dimension: 'design',
          severity: 'major',
          message: 'Inconsistent font usage',
        },
      ],
      annotations: [],
      heatmap: null,
    }

    // Store results
    await upsertAnalysisResults(analysisId, analysisResults)

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisResults),
    }
  } catch (error) {
    context.log(`Error analyzing document: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to analyze document',
        message: error.message,
      }),
    }
  }
}
