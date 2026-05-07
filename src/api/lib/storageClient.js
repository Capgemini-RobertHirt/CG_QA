'use strict'

const path = require('path')
const {
  BlobServiceClient,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob')
const { QueueClient } = require('@azure/storage-queue')

const DEFAULT_CONTAINER_NAME = process.env.DOCUMENTS_BLOB_CONTAINER || 'documents'
const DEFAULT_PPTX_QUEUE_NAME = process.env.PPTX_ANALYSIS_QUEUE || 'pptx-analysis-jobs'
const DEFAULT_UPLOAD_EXPIRY_MINUTES = Number.parseInt(process.env.PPTX_UPLOAD_SAS_EXPIRY_MINUTES || '30', 10)

let blobServiceClient = null
let queueClient = null

function getConnectionString() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING or AzureWebJobsStorage must be configured.')
  }

  return connectionString
}

function parseConnectionString(connectionString) {
  const parts = Object.fromEntries(
    connectionString
      .split(';')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const separatorIndex = segment.indexOf('=')
        return [segment.slice(0, separatorIndex), segment.slice(separatorIndex + 1)]
      })
  )

  return {
    accountName: parts.AccountName,
    accountKey: parts.AccountKey,
  }
}

function getBlobService() {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(getConnectionString())
  }

  return blobServiceClient
}

function getSharedKeyCredential() {
  const { accountName, accountKey } = parseConnectionString(getConnectionString())
  if (!accountName || !accountKey) {
    throw new Error('Storage connection string must include AccountName and AccountKey to generate upload SAS tokens.')
  }

  return new StorageSharedKeyCredential(accountName, accountKey)
}

function sanitizePathSegment(value) {
  return String(value || 'file')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file'
}

async function ensureContainer(containerName = DEFAULT_CONTAINER_NAME) {
  const containerClient = getBlobService().getContainerClient(containerName)
  await containerClient.createIfNotExists()
  return containerClient
}

async function ensureQueue(queueName = DEFAULT_PPTX_QUEUE_NAME) {
  if (!queueClient || queueClient.name !== queueName) {
    queueClient = new QueueClient(getConnectionString(), queueName)
  }

  await queueClient.createIfNotExists()
  return queueClient
}

async function createPptxUploadSession({ sampleId, fileName, contentType }) {
  const containerClient = await ensureContainer()
  const normalizedFileName = sanitizePathSegment(path.basename(fileName || `${sampleId}.pptx`))
  const blobName = `samples/pptx/${sampleId}/${normalizedFileName}`
  const blobClient = containerClient.getBlockBlobClient(blobName)
  const expiresOn = new Date(Date.now() + DEFAULT_UPLOAD_EXPIRY_MINUTES * 60 * 1000)

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerClient.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn,
      contentType: contentType || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
    getSharedKeyCredential()
  ).toString()

  return {
    blobName,
    containerName: containerClient.containerName,
    blobUrl: blobClient.url,
    uploadUrl: `${blobClient.url}?${sasToken}`,
    expiresAt: expiresOn.toISOString(),
  }
}

async function enqueuePptxAnalysisJob(job) {
  const client = await ensureQueue()
  await client.sendMessage(JSON.stringify(job))
}

async function getBlobBuffer(blobName, containerName = DEFAULT_CONTAINER_NAME) {
  const containerClient = await ensureContainer(containerName)
  const blobClient = containerClient.getBlockBlobClient(blobName)
  const downloadResponse = await blobClient.download()
  const chunks = []

  for await (const chunk of downloadResponse.readableStreamBody) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return {
    buffer: Buffer.concat(chunks),
    url: blobClient.url,
  }
}

async function blobExists(blobName, containerName = DEFAULT_CONTAINER_NAME) {
  const containerClient = await ensureContainer(containerName)
  return containerClient.getBlockBlobClient(blobName).exists()
}

module.exports = {
  DEFAULT_CONTAINER_NAME,
  DEFAULT_PPTX_QUEUE_NAME,
  createPptxUploadSession,
  enqueuePptxAnalysisJob,
  getBlobBuffer,
  blobExists,
}