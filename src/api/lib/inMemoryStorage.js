'use strict'

// In-memory storage for samples when Cosmos DB is unavailable
const samples = new Map()

/**
 * Store a sample in memory
 */
function storeSample(id, sample) {
  samples.set(id, {
    ...sample,
    id: sample.id || id,
    storedAt: new Date().toISOString(),
  })
  return samples.get(id)
}

/**
 * Get a sample by ID
 */
function getSample(id) {
  return samples.get(id)
}

/**
 * Get all samples
 */
function getAllSamples() {
  return Array.from(samples.values())
}

/**
 * Get samples by document type
 */
function getSamplesByType(documentType) {
  if (!documentType) {
    return getAllSamples()
  }
  return Array.from(samples.values()).filter(
    sample => sample.documentType === documentType || sample.document_type === documentType
  )
}

/**
 * Delete a sample
 */
function deleteSample(id) {
  const result = samples.has(id)
  samples.delete(id)
  return result
}

/**
 * Clear all samples
 */
function clearSamples() {
  samples.clear()
}

module.exports = {
  storeSample,
  getSample,
  getAllSamples,
  getSamplesByType,
  deleteSample,
  clearSamples,
}
