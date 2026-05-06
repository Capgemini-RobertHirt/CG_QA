'use strict'

const { v4: uuidv4 } = require('uuid')
const { getTemplateByEntityType, upsertAnalysisResults } = require('../lib/cosmosClient')
const { analyzeDocumentAgainstTemplate } = require('../lib/analysisEngine')

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

    const analysisId = uuidv4()
    const analysisResults = {
      id: analysisId,
      ...(await analyzeDocumentAgainstTemplate({
        sampleId: null,
        fileName: file_name || 'document',
        entityType: entity_type,
        documentType: document_type,
        documentContent: document_content,
        template,
      })),
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
