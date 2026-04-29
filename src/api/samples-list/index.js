'use strict'

const { getSamplesByType, getAllSamples } = require('../lib/inMemoryStorage')
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

    // Try to get from Cosmos DB first
    try {
      if (documentType) {
        samples = await getSamplesByDocumentType(documentType)
      } else {
        // Get all samples from Cosmos DB
        samples = []
      }
    } catch (dbError) {
      context.log(`Cosmos DB unavailable: ${dbError.message}, using in-memory storage`)
      // Fall back to in-memory storage
      samples = getSamplesByType(documentType)
    }

    // If Cosmos DB returned empty, also check in-memory storage
    if (samples.length === 0) {
      const inMemorySamples = getSamplesByType(documentType)
      samples = inMemorySamples
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
