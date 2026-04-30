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

    if (resources.length > 0) {
      return resources[0]
    }
    
    // Fallback to file-based loading
    throw new Error('Template not found in Cosmos DB')
  } catch (error) {
    console.warn(`Template ${entityType} not found in Cosmos DB, trying files:`, error.message)
    
    // Load template from JSON file when Cosmos DB is unavailable
    try {
      const fs = require('fs')
      const path = require('path')
      
      // Try multiple possible paths for the templates directory
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'api', 'templates'),
        path.join(process.cwd(), 'api', 'templates'),
        path.join(__dirname, '..', 'templates'),
        path.join(__dirname, '../templates'),
      ]
      
      let templatesDir = null
      for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
          templatesDir = dir
          console.log(`Found templates directory: ${templatesDir}`)
          break
        }
      }

      if (!templatesDir) {
        throw new Error(`Could not find templates directory`)
      }

      // Map entity type to filename
      const filenameMap = {
        'default': 'default.json',
        'engineering': 'engineering.json',
        'asset': 'asset.json',
        'whitepaper': 'whitepaper.json',
        'point_of_view': 'point_of_view.json',
        'rfp_rfi_response': 'rfp_rfi_response.json',
        'internal_meeting_presentation': 'internal_meeting_presentation.json',
      }
      
      const filename = filenameMap[entityType]
      if (!filename) {
        console.warn(`Unknown entity type: ${entityType}`)
        return null
      }

      const filePath = path.join(templatesDir, filename)
      if (!fs.existsSync(filePath)) {
        console.warn(`Template file not found: ${filePath}`)
        return null
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const template = JSON.parse(fileContent)
      
      // Transform to standard format
      const fullTemplate = {
        id: template.entity_type,
        entityType: template.entity_type,
        entity_type: template.entity_type,
        name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        // Preserve all original fields
        ...template,
        // Ensure standard names are set
        documentTypes: template.document_types || template.documentTypes || {},
        globalRules: template.global_rules || template.globalRules || {},
        structure: template.structure || { sections: { required: [], optional: [] } },
        design: template.design || {},
        type: 'quality-template',
      }
      
      console.log(`Loaded template ${entityType} from file: ${filename}`)
      return fullTemplate
    } catch (fileError) {
      console.error(`Failed to load template ${entityType} from file:`, fileError.message)
      
      // Return null to trigger 404 response
      return null
    }
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
      
      // Try multiple possible paths for the templates directory
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'api', 'templates'),
        path.join(process.cwd(), 'api', 'templates'),
        path.join(__dirname, '..', 'templates'),
        path.join(__dirname, '../templates'),
      ]
      
      let templatesDir = null
      for (const dir of possiblePaths) {
        try {
          await fs.access(dir)
          templatesDir = dir
          console.log(`Found templates directory at: ${templatesDir}`)
          break
        } catch (e) {
          // Continue to next path
        }
      }

      if (!templatesDir) {
        throw new Error(`Could not find templates directory in any of: ${possiblePaths.join(', ')}`)
      }

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
          // Preserve all template data from the JSON file
          const fullTemplate = {
            id: template.entity_type,
            entityType: template.entity_type,
            entity_type: template.entity_type,
            name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            // Preserve all original fields
            ...template,
            // Ensure standard names are set
            documentTypes: template.document_types || template.documentTypes || {},
            globalRules: template.global_rules || template.globalRules || {},
            structure: template.structure || { sections: { required: [], optional: [] } },
            design: template.design || {},
            type: 'quality-template',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          templates.push(fullTemplate)
          console.log(`Loaded template: ${fullTemplate.name} with structure sections`)
        } catch (fileError) {
          console.warn(`Could not load template from ${file}:`, fileError.message)
        }
      }

      if (templates.length > 0) {
        return templates
      }

      throw new Error('No templates loaded from files')
    } catch (fileError) {
      console.error('Failed to load templates from files:', fileError.message)
      
      // Return fallback templates with full structure embedded
      return [
        {
          id: 'default',
          entityType: 'default',
          name: 'Default',
          documentTypes: { general_document: {}, business_brief: {}, proposal: {}, report: {}, information_sheet: {} },
          structure: { sections: { required: ['introduction', 'proposal'], optional: ['conclusion', 'appendix', 'references', 'acknowledgments'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'engineering',
          entityType: 'engineering',
          name: 'Engineering',
          documentTypes: { technical_spec: {}, design_doc: {}, architecture: {} },
          structure: { sections: { required: ['overview', 'requirements', 'design', 'implementation'], optional: ['appendix', 'references', 'glossary'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'asset',
          entityType: 'asset',
          name: 'Asset',
          documentTypes: { asset_list: {}, asset_details: {} },
          structure: { sections: { required: ['overview', 'details'], optional: ['appendix', 'references'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'whitepaper',
          entityType: 'whitepaper',
          name: 'Whitepaper',
          documentTypes: { whitepaper: {}, technical_paper: {} },
          structure: { sections: { required: ['abstract', 'introduction', 'content', 'conclusion'], optional: ['appendix', 'references', 'glossary', 'index'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'point_of_view',
          entityType: 'point_of_view',
          name: 'Point of View',
          documentTypes: { pov: {}, perspective: {} },
          structure: { sections: { required: ['introduction', 'perspective', 'conclusion'], optional: ['appendix', 'references'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rfp_rfi_response',
          entityType: 'rfp_rfi_response',
          name: 'RFP/RFI Response',
          documentTypes: { rfp_response: {}, rfi_response: {} },
          structure: { sections: { required: ['executive_summary', 'approach', 'team', 'pricing'], optional: ['appendix', 'references', 'case_studies'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'internal_meeting_presentation',
          entityType: 'internal_meeting_presentation',
          name: 'Internal Meeting Presentation',
          documentTypes: { presentation: {}, meeting_slides: {} },
          structure: { sections: { required: ['agenda', 'content', 'action_items'], optional: ['appendix', 'references', 'notes'] } },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
      ]
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
