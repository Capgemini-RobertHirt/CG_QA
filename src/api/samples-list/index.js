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
      // When no filter, return empty samples list
      // In a production system, this would fetch all samples from the database
      samples = []
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        samples,
        count: samples.length,
        message: samples.length === 0 ? 'No samples available' : undefined,
      }),
    }
  } catch (error) {
    context.log(`Error fetching samples: ${error.message}`)
    // Return empty list on error to maintain API availability
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        samples: [],
        count: 0,
        message: 'Using fallback response',
      }),
    }
  }
}
