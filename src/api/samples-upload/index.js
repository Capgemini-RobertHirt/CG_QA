'use strict'

const { v4: uuidv4 } = require('uuid')
const { BlobServiceClient } = require('@azure/storage-blob')
const { upsertSample } = require('../lib/cosmosClient')

/**
 * POST /api/samples
 * Upload a document sample for analysis
 * Expects multipart/form-data with file and metadata
 */
module.exports = async function samplesUpload(context, req) {
  try {
    // Parse form data (simplified - in production use a form parser library)
    const { documentType, entityType, fileName, fileContent, uploadedBy } = req.body

    if (!documentType || !entityType || !fileContent) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: documentType, entityType, fileContent',
        }),
      }
      return
    }

    const sampleId = uuidv4()
    const blobName = `samples/${entityType}/${documentType}/${sampleId}/${fileName || 'document'}`

    // Upload to blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    )
    const containerClient = blobServiceClient.getContainerClient('documents')
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(fileContent, Buffer.byteLength(fileContent))

    // Store metadata in Cosmos DB
    const sample = await upsertSample({
      id: sampleId,
      document_type: documentType,
      entity_type: entityType,
      file_name: fileName || 'document',
      file_url: blockBlobClient.url,
      uploaded_by: uploadedBy || 'system',
      uploaded_at: new Date().toISOString(),
      analysis_status: 'pending',
    })

    context.res = {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sample.id,
        message: 'Sample uploaded successfully',
        file_url: sample.fileUrl,
      }),
    }
  } catch (error) {
    context.log(`Error uploading sample: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to upload sample',
        message: error.message,
      }),
    }
  }
}
