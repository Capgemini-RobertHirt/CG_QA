'use strict'

const { v4: uuidv4 } = require('uuid')
const { getTemplateByEntityType, upsertAnalysisResults, upsertSample } = require('../lib/cosmosClient')
const { storeAnalysis, storeSample, getSample } = require('../lib/inMemoryStorage')
const { analyzeDocumentAgainstTemplate } = require('../lib/analysisEngine')
const { getBlobBuffer } = require('../lib/storageClient')
const { parsePptxBuffer } = require('../lib/pptxParser')
const { ensureQaAgentPreflight } = require('../lib/qaAgents/preflight')

module.exports = async function processPptxRequest(context, req) {
  const payload = req.body || {}
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
    uploadedAt,
  } = payload

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

  context.log(`Processing PPTX analysis job for sample ${sampleId}`)

  const updateFailure = async (message) => {
    const failedSample = {
      id: sampleId,
      document_type: documentType,
      entity_type: entityType,
      file_name: fileName,
      file_url: blobUrl,
      uploaded_by: uploadedBy,
      uploaded_at: uploadedAt,
      analysis_status: 'failed',
      content_type: contentType,
      file_size: fileSize,
      blob_name: blobName,
      processing_mode: 'async-pptx',
      analysis_error: message,
    }

    try {
      await upsertSample(failedSample)
    } catch (dbError) {
      storeSample(sampleId, {
        ...(getSample(sampleId) || {}),
        ...failedSample,
        documentType,
        entityType,
        fileName,
        fileUrl: blobUrl,
        uploadedAt,
        analysisStatus: 'failed',
        contentType,
        fileSize,
        blobName,
        processingMode: 'async-pptx',
        analysisError: message,
        type: 'template-sample',
      })
      context.log(`Stored failed PPTX status in memory: ${dbError.message}`)
    }
  }

  try {
    ensureQaAgentPreflight()

    const template = await getTemplateByEntityType(documentType)
    if (!template) {
      throw new Error(`No quality template found for document type '${documentType}'.`)
    }

    const { buffer, url } = await getBlobBuffer(blobName)
    const parsedPresentation = await parsePptxBuffer(buffer)
    const analysisId = uuidv4()

    const analysisResults = {
      id: analysisId,
      ...(await analyzeDocumentAgainstTemplate({
        sampleId,
        fileName,
        entityType,
        documentType,
        documentContent: parsedPresentation.text,
        documentModel: parsedPresentation,
        template,
      })),
    }

    await upsertAnalysisResults(analysisId, analysisResults)
    storeAnalysis(analysisId, analysisResults)

    const completedSample = {
      id: sampleId,
      document_type: documentType,
      entity_type: entityType,
      file_name: fileName,
      file_url: url || blobUrl,
      file_content: parsedPresentation.text,
      uploaded_by: uploadedBy,
      uploaded_at: uploadedAt,
      analysis_status: 'completed',
      analysis_id: analysisId,
      quality_score: analysisResults.overall_score,
      analysis_results: analysisResults,
      content_type: contentType,
      file_size: fileSize,
      blob_name: blobName,
      processing_mode: 'async-pptx',
    }

    try {
      await upsertSample(completedSample)
    } catch (dbError) {
      storeSample(sampleId, {
        ...(getSample(sampleId) || {}),
        ...completedSample,
        documentType,
        entityType,
        fileName,
        fileUrl: url || blobUrl,
        fileContent: parsedPresentation.text,
        uploadedAt,
        analysisId,
        qualityScore: analysisResults.overall_score,
        analysisResults,
        analysisStatus: 'completed',
        contentType,
        fileSize,
        blobName,
        processingMode: 'async-pptx',
        type: 'template-sample',
      })
      context.log(`Stored completed PPTX sample in memory: ${dbError.message}`)
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sampleId,
        analysisId,
        status: 'completed',
        qualityScore: analysisResults.overall_score,
      }),
    }
  } catch (error) {
    context.log(`Error processing PPTX analysis job for sample ${sampleId}: ${error.message}`)
    await updateFailure(error.message)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process PPTX analysis',
        message: error.message,
        sampleId,
      }),
    }
  }
}