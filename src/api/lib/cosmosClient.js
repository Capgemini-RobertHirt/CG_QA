'use strict'

const { CosmosClient } = require('@azure/cosmos')
const { DefaultAzureCredential } = require('@azure/identity')

let cosmosClient = null
let database = null
let container = null

/**
 * Initialize Cosmos DB client using Managed Identity
 */
async function initializeCosmosClient() {
  if (cosmosClient) {
    return { database, container }
  }

  try {
    const endpoint = process.env.COSMOS_DB_ENDPOINT
    const key = process.env.COSMOS_DB_KEY
    const databaseId = process.env.COSMOS_DB_NAME || 'cg-qa'
    const containerId = process.env.COSMOS_CONTAINER_ID || 'quality-templates'

    if (!endpoint) {
      throw new Error('COSMOS_DB_ENDPOINT environment variable not set')
    }

    // Use key-based auth if available (for local dev), otherwise use Managed Identity
    if (key) {
      cosmosClient = new CosmosClient({ endpoint, key })
    } else {
      const credential = new DefaultAzureCredential()
      cosmosClient = new CosmosClient({ endpoint, aadCredentials: credential })
    }

    database = cosmosClient.database(databaseId)
    container = database.container(containerId)

    console.log(`Connected to Cosmos DB: ${endpoint}/${databaseId}/${containerId}`)
    return { database, container }
  } catch (error) {
    console.error('Failed to initialize Cosmos DB client:', error)
    throw error
  }
}

/**
 * Get Cosmos DB container for templates
 */
async function getTemplateContainer() {
  const { container } = await initializeCosmosClient()
  return container
}

/**
 * Create or update a quality template
 */
async function upsertTemplate(template) {
  try {
    const { container } = await initializeCosmosClient()
    const response = await container.items.upsert({
      id: template.id || template.entity_type,
      entityType: template.entity_type,
      documentTypes: template.document_types,
      globalRules: template.global_rules,
      structure: template.structure,
      design: template.design,
      components: template.components,
      images: template.images,
      tables: template.tables,
      headerFooter: template.header_footer,
      compliance: template.compliance,
      businessContext: template.business_context,
      antiPatterns: template.anti_patterns,
      output: template.output,
      createdBy: template.created_by,
      createdAt: template.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'quality-template',
    })

    return response.resource
  } catch (error) {
    console.error('Error upserting template:', error)
    throw error
  }
}

/**
 * Get template by entity type
 */
async function getTemplateByEntityType(entityType) {
  try {
    const { container } = await initializeCosmosClient()
    const query = `SELECT * FROM c WHERE c.entityType = @entityType AND c.type = 'quality-template'`
    const { resources } = await container.items.query({ query, parameters: [{ name: '@entityType', value: entityType }] }).fetchAll()

    return resources.length > 0 ? resources[0] : null
  } catch (error) {
    console.error('Error fetching template:', error)
    throw error
  }
}

/**
 * Get all template entity types
 */
async function getAllTemplateEntityTypes() {
  try {
    const { container } = await initializeCosmosClient()
    const query = `SELECT DISTINCT c.entityType FROM c WHERE c.type = 'quality-template' ORDER BY c.entityType`
    const { resources } = await container.items.query(query).fetchAll()

    return resources.map((r) => r.entityType)
  } catch (error) {
    console.warn('Error fetching template types from Cosmos DB, using fallback:', error.message)
    // Return fallback template types when Cosmos DB is unavailable
    return [
      'default',
      'engineering',
      'asset',
      'whitepaper',
      'point_of_view',
      'rfp_rfi_response',
      'internal_meeting_presentation',
    ]
  }
}

/**
 * Create or update a template sample
 */
async function upsertSample(sample) {
  try {
    const { container } = await initializeCosmosClient()
    const response = await container.items.upsert({
      id: sample.id,
      documentType: sample.document_type,
      entityType: sample.entity_type,
      fileName: sample.file_name,
      fileUrl: sample.file_url,
      uploadedBy: sample.uploaded_by,
      uploadedAt: sample.uploaded_at || new Date().toISOString(),
      analysisStatus: sample.analysis_status || 'pending',
      analysisResults: sample.analysis_results,
      type: 'template-sample',
    })

    return response.resource
  } catch (error) {
    console.warn('Error upserting sample to Cosmos DB, returning sample object:', error.message)
    // Return the sample object as-is when Cosmos DB is unavailable
    // This allows the system to continue functioning with in-memory storage
    return {
      id: sample.id,
      documentType: sample.document_type,
      entityType: sample.entity_type,
      fileName: sample.file_name,
      fileUrl: sample.file_url,
      uploadedBy: sample.uploaded_by,
      uploadedAt: sample.uploaded_at || new Date().toISOString(),
      analysisStatus: sample.analysis_status || 'pending',
      type: 'template-sample',
    }
  }
}

/**
 * Get samples by document type
 */
async function getSamplesByDocumentType(documentType) {
  try {
    const { container } = await initializeCosmosClient()
    const query = `SELECT * FROM c WHERE c.documentType = @documentType AND c.type = 'template-sample' ORDER BY c.uploadedAt DESC`
    const { resources } = await container.items.query({ query, parameters: [{ name: '@documentType', value: documentType }] }).fetchAll()

    return resources
  } catch (error) {
    console.warn('Error fetching samples from Cosmos DB, using fallback:', error.message)
    // Return fallback empty samples when Cosmos DB is unavailable
    // In a real implementation, this would fetch from a database or file system
    return []
  }
}

/**
 * Store analysis results for a document
 */
async function upsertAnalysisResults(analysisId, results) {
  try {
    const { container } = await initializeCosmosClient()
    const response = await container.items.upsert({
      id: analysisId,
      entityType: results.entity_type,
      documentType: results.document_type,
      fileName: results.file_name,
      scores: results.scores,
      findings: results.findings,
      annotations: results.annotations,
      heatmap: results.heatmap,
      createdAt: new Date().toISOString(),
      type: 'analysis-result',
    })

    return response.resource
  } catch (error) {
    console.error('Error upserting analysis results:', error)
    throw error
  }
}

/**
 * Get all templates with full structure and details
 */
async function getAllTemplates() {
  try {
    const { container } = await initializeCosmosClient()
    const query = `SELECT * FROM c WHERE c.type = 'quality-template' ORDER BY c.entityType`
    const { resources } = await container.items.query(query).fetchAll()

    if (resources.length > 0) {
      return resources
    }
    
    // If Cosmos DB is empty, fall through to file-based loading
    throw new Error('No templates found in Cosmos DB')
  } catch (error) {
    console.warn('Could not fetch templates from Cosmos DB, loading from files:', error.message)
    
    // Load templates from JSON files when Cosmos DB is unavailable
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const templatesDir = path.join(process.cwd(), 'src', 'api', 'templates')
      const templateFiles = [
        'default.json',
        'engineering.json',
        'asset.json',
        'whitepaper.json',
        'point_of_view.json',
        'rfp_rfi_response.json',
        'internal_meeting_presentation.json',
      ]

      const templates = []
      for (const file of templateFiles) {
        try {
          const filePath = path.join(templatesDir, file)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const template = JSON.parse(fileContent)
          templates.push({
            id: template.entity_type,
            entityType: template.entity_type,
            documentTypes: template.document_types || {},
            globalRules: template.global_rules || {},
            structure: template.structure || {},
            design: template.design || {},
            components: template.components,
            images: template.images,
            tables: template.tables,
            type: 'quality-template',
          })
        } catch (fileError) {
          console.warn(`Could not load template from ${file}:`, fileError.message)
        }
      }

      return templates
    } catch (fileError) {
      console.error('Failed to load templates from files:', fileError.message)
      // Return empty array with fallback template types
      return [
        'default',
        'engineering',
        'asset',
        'whitepaper',
        'point_of_view',
        'rfp_rfi_response',
        'internal_meeting_presentation',
      ].map(type => ({
        id: type,
        entityType: type,
        documentTypes: {},
        structure: { sections: { required: [], optional: [] } },
        type: 'quality-template',
      }))
    }
  }
}

module.exports = {
  initializeCosmosClient,
  getTemplateContainer,
  upsertTemplate,
  getTemplateByEntityType,
  getAllTemplateEntityTypes,
  getAllTemplates,
  upsertSample,
  getSamplesByDocumentType,
  upsertAnalysisResults,
}
