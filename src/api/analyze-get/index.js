'use strict'

const { getAnalysisResult, getSample } = require('../lib/inMemoryStorage')
const { getAnalysisResultById, getSampleById } = require('../lib/cosmosClient')

module.exports = async function analyzeGet(context, req) {
  try {
    const id = context.bindingData?.id || req.params?.id

    if (!id) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Analysis id is required' }),
      }
      return
    }

    let analysis = await getAnalysisResultById(id)
    if (!analysis) {
      const sample = await getSampleById(id)
      if (sample?.analysisId) {
        analysis = await getAnalysisResultById(sample.analysisId)
      }
    }

    if (!analysis) {
      analysis = getAnalysisResult(id)
      if (!analysis) {
        const sample = getSample(id)
        if (sample?.analysisId || sample?.analysis_id) {
          analysis = getAnalysisResult(sample.analysisId || sample.analysis_id)
        }
      }
    }

    if (!analysis) {
      context.res = {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Analysis not found' }),
      }
      return
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis),
    }
  } catch (error) {
    context.log(`Error fetching analysis: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load analysis', message: error.message }),
    }
  }
}