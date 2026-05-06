'use strict'

const { getSample, deleteSample, deleteAnalysis } = require('../lib/inMemoryStorage')
const { getSampleById, deleteSampleById } = require('../lib/cosmosClient')

module.exports = async function samplesDelete(context, req) {
  try {
    const id = context.bindingData?.id || req.params?.id

    if (!id) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sample id is required' }),
      }
      return
    }

    let deleted = false
    const existingSample = await getSampleById(id)
    if (existingSample) {
      deleted = await deleteSampleById(id)
    }

    if (!deleted) {
      const sample = getSample(id)
      if (sample) {
        deleteSample(id)
        if (sample.analysisId || sample.analysis_id) {
          deleteAnalysis(sample.analysisId || sample.analysis_id)
        }
        deleted = true
      }
    }

    if (!deleted) {
      context.res = {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sample not found' }),
      }
      return
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sample deleted successfully' }),
    }
  } catch (error) {
    context.log(`Error deleting sample: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete sample', message: error.message }),
    }
  }
}