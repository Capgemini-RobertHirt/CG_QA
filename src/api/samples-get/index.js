'use strict'

const { getSample } = require('../lib/inMemoryStorage')
const { getSampleById } = require('../lib/cosmosClient')

module.exports = async function samplesGet(context, req) {
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

    let sample = await getSampleById(id)
    if (!sample) {
      sample = getSample(id)
    }

    if (!sample) {
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
      body: JSON.stringify({
        id: sample.id,
        file_name: sample.fileName || sample.file_name || 'document',
        status: sample.status || sample.analysisStatus || sample.analysis_status || 'uploaded',
        template_type: sample.entityType || sample.entity_type,
        quality_score: sample.qualityScore || sample.quality_score || 0,
        created_at: sample.uploadedAt || sample.uploaded_at || sample.created_at || new Date().toISOString(),
        analysis_id: sample.analysisId || sample.analysis_id,
        document_type: sample.documentType || sample.document_type,
        entity_type: sample.entityType || sample.entity_type,
        file_url: sample.fileUrl || sample.file_url,
      }),
    }
  } catch (error) {
    context.log(`Error fetching sample: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load sample details', message: error.message }),
    }
  }
}