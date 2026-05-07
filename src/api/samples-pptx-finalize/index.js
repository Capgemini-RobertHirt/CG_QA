'use strict'

const { upsertSample } = require('../lib/cosmosClient')
const { storeSample } = require('../lib/inMemoryStorage')
const { blobExists, enqueuePptxAnalysisJob } = require('../lib/storageClient')

const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

module.exports = async function finalizePptxUpload(context, req) {
  try {
    const {
      sampleId,
      blobName,
      blobUrl,
      fileName,
      fileSize,
      contentType,
      documentType,
      entityType,
      uploadedBy,
    } = req.body || {}

    if (!sampleId || !blobName || !fileName || !documentType || !entityType) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'sampleId, blobName, fileName, documentType, and entityType are required.',
        }),
      }
      return
    }

    const uploaded = await blobExists(blobName)
    if (!uploaded) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'The PPTX blob was not found. Upload must complete before finalization.' }),
      }
      return
    }

    const sampleData = {
      id: sampleId,
      document_type: documentType,
      entity_type: entityType,
      file_name: fileName,
      file_url: blobUrl,
      uploaded_by: uploadedBy || 'user',
      uploaded_at: new Date().toISOString(),
      analysis_status: 'processing',
      content_type: contentType || PPTX_MIME_TYPE,
      file_size: fileSize,
      blob_name: blobName,
      processing_mode: 'async-pptx',
    }

    let sample = null
    try {
      sample = await upsertSample(sampleData)
    } catch (dbError) {
      context.log(`Database unavailable during PPTX finalization, using in-memory storage: ${dbError.message}`)
      sample = storeSample(sampleId, {
        ...sampleData,
        documentType,
        entityType,
        fileName,
        fileUrl: blobUrl,
        uploadedAt: sampleData.uploaded_at,
        analysisStatus: 'processing',
        contentType: sampleData.content_type,
        fileSize,
        blobName,
        processingMode: 'async-pptx',
        type: 'template-sample',
      })
    }

    await enqueuePptxAnalysisJob({
      sampleId,
      blobName,
      fileName,
      fileSize,
      contentType: sampleData.content_type,
      documentType,
      entityType,
      uploadedBy: sampleData.uploaded_by,
      uploadedAt: sampleData.uploaded_at,
      blobUrl,
    })

    context.res = {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sample.id || sampleId,
        file_name: fileName,
        template_type: documentType,
        document_type: documentType,
        entity_type: entityType,
        status: 'processing',
        quality_score: 0,
        created_at: sample.uploadedAt || sample.uploaded_at || sampleData.uploaded_at,
        file_url: blobUrl,
        message: 'PPTX upload accepted. Analysis has been queued and will complete asynchronously.',
      }),
    }
  } catch (error) {
    context.log(`Error finalizing PPTX upload: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to finalize PPTX upload', message: error.message }),
    }
  }
}