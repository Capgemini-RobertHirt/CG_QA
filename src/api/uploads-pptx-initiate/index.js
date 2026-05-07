'use strict'

const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { createPptxUploadSession } = require('../lib/storageClient')

const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const MAX_PPTX_UPLOAD_BYTES = Number.parseInt(process.env.PPTX_MAX_UPLOAD_BYTES || `${100 * 1024 * 1024}`, 10)

module.exports = async function initiatePptxUpload(context, req) {
  try {
    const { fileName, fileSize, contentType } = req.body || {}
    const normalizedContentType = String(contentType || '').trim()
    const normalizedFileName = String(fileName || '').trim()
    const parsedFileSize = Number.parseInt(String(fileSize || '0'), 10)

    if (!normalizedFileName || !Number.isFinite(parsedFileSize) || parsedFileSize <= 0) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileName and fileSize are required.' }),
      }
      return
    }

    if (normalizedContentType !== PPTX_MIME_TYPE && path.extname(normalizedFileName).toLowerCase() !== '.pptx') {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only PPTX uploads can use the direct upload session endpoint.' }),
      }
      return
    }

    if (parsedFileSize > MAX_PPTX_UPLOAD_BYTES) {
      context.res = {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'File too large',
          message: `PPTX uploads are limited to ${Math.round(MAX_PPTX_UPLOAD_BYTES / (1024 * 1024))}MB.`,
        }),
      }
      return
    }

    const sampleId = uuidv4()
    const session = await createPptxUploadSession({
      sampleId,
      fileName: normalizedFileName,
      contentType: normalizedContentType || PPTX_MIME_TYPE,
    })

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sampleId,
        ...session,
        maxUploadBytes: MAX_PPTX_UPLOAD_BYTES,
      }),
    }
  } catch (error) {
    context.log(`Error creating PPTX upload session: ${error.message}`)
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create PPTX upload session', message: error.message }),
    }
  }
}