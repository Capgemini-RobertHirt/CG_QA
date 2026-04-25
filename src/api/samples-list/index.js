'use strict'

const { getSamplesByDocumentType } = require('../lib/cosmosClient')

/**
 * GET /api/samples
 * Returns template samples, optionally filtered by document_type
 * Query param: document_type (optional)
 */
module.exports = async function samplesList(context, req) {
  try {
    const documentType = req.query.document_type

    let samples = []
    if (documentType) {
      samples = await getSamplesByDocumentType(documentType)
    } else {
      // TODO: Get all samples without filter
      samples = []
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        samples,
        count: samples.length,
      }),
    }
  } catch (error) {
    context.log(`Error fetching samples: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch samples',
        message: error.message,
      }),
    }
  }
}
