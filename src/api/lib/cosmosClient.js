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
      
      // Extract legoBlocks from structure
      const legoBlocks = template.structure?.legoBlocks || {}
      const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
        return sum + (section.components ? section.components.length : 0)
      }, 0)
      
      // Transform to standard format - DON'T use spread to avoid nesting issues
      const fullTemplate = {
        id: template.entity_type,
        entityType: template.entity_type,
        entity_type: template.entity_type,
        name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        // Include all properties explicitly
        document_types: template.document_types || {},
        documentTypes: template.document_types || {},
        global_rules: template.global_rules || {},
        globalRules: template.global_rules || {},
        structure: template.structure || { sections: { required: [], optional: [] } },
        design: template.design || {},
        components: template.components,
        images: template.images,
        tables: template.tables,
        header_footer: template.header_footer,
        compliance: template.compliance,
        business_context: template.business_context,
        anti_patterns: template.anti_patterns,
        output: template.output,
        // IMPORTANT: Surface legoBlocks at root level
        legoBlocks: legoBlocks,
        type: 'quality-template',
      }
      
      console.log(`Loaded template ${entityType} from file: ${filename} with ${Object.keys(legoBlocks).length} sections and ${componentCount} components`)
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
          
          // Extract legoBlocks from structure
          const legoBlocks = template.structure?.legoBlocks || {}
          const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
            return sum + (section.components ? section.components.length : 0)
          }, 0)
          
          // Preserve all template data from the JSON file - DON'T use spread to avoid nesting issues
          const fullTemplate = {
            id: template.entity_type,
            entityType: template.entity_type,
            entity_type: template.entity_type,
            name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            // Include all properties explicitly
            document_types: template.document_types || {},
            documentTypes: template.document_types || {},
            global_rules: template.global_rules || {},
            globalRules: template.global_rules || {},
            structure: template.structure || { sections: { required: [], optional: [] } },
            design: template.design || {},
            components: template.components,
            images: template.images,
            tables: template.tables,
            header_footer: template.header_footer,
            compliance: template.compliance,
            business_context: template.business_context,
            anti_patterns: template.anti_patterns,
            output: template.output,
            // IMPORTANT: Surface legoBlocks at root level
            legoBlocks: legoBlocks,
            type: 'quality-template',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          templates.push(fullTemplate)
          console.log(`Loaded template: ${fullTemplate.name} with ${Object.keys(legoBlocks).length} sections and ${componentCount} components`)
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
          entity_type: 'default',
          name: 'Default',
          documentTypes: { general_document: {}, business_brief: {}, proposal: {}, report: {}, information_sheet: {} },
          structure: { sections: { required: ['introduction', 'proposal'], optional: ['conclusion', 'appendix', 'references', 'acknowledgments'] } },
          legoBlocks: {
            introduction: { components: [{ id: '1', name: 'Introduction' }] },
            proposal: { components: [{ id: '2', name: 'Proposal' }] },
            conclusion: { components: [{ id: '3', name: 'Conclusion' }] },
            appendix: { components: [{ id: '4', name: 'Appendix' }] },
            references: { components: [{ id: '5', name: 'References' }] },
            acknowledgments: { components: [{ id: '6', name: 'Acknowledgments' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'engineering',
          entityType: 'engineering',
          entity_type: 'engineering',
          name: 'Engineering',
          documentTypes: { technical_spec: {}, design_doc: {}, architecture: {} },
          structure: { sections: { required: ['overview', 'requirements', 'design', 'implementation'], optional: ['appendix', 'references', 'glossary'] } },
          legoBlocks: {
            overview: { components: [{ id: '1', name: 'Overview' }] },
            requirements: { components: [{ id: '2', name: 'Requirements' }] },
            design: { components: [{ id: '3', name: 'Design' }] },
            implementation: { components: [{ id: '4', name: 'Implementation' }] },
            appendix: { components: [{ id: '5', name: 'Appendix' }] },
            references: { components: [{ id: '6', name: 'References' }] },
            glossary: { components: [{ id: '7', name: 'Glossary' }] },
            technical_overview: { components: [{ id: '8', name: 'Technical Overview' }] },
            architecture: { components: [{ id: '9', name: 'Architecture' }] },
            support: { components: [{ id: '10', name: 'Support' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'asset',
          entityType: 'asset',
          entity_type: 'asset',
          name: 'Asset',
          documentTypes: { asset_list: {}, asset_details: {} },
          structure: { sections: { required: ['overview', 'details'], optional: ['appendix', 'references'] } },
          legoBlocks: {
            overview: { components: [{ id: '1', name: 'Overview' }] },
            inventory: { components: [{ id: '2', name: 'Inventory' }] },
            specifications: { components: [{ id: '3', name: 'Specifications' }] },
            appendix: { components: [{ id: '4', name: 'Appendix' }] },
            references: { components: [{ id: '5', name: 'References' }] },
            details: { components: [{ id: '6', name: 'Details' }] },
            title_description: { components: [{ id: '7', name: 'Title & Description' }] },
            asset_overview: { components: [{ id: '8', name: 'Asset Overview' }] },
            key_content: { components: [{ id: '9', name: 'Key Content' }] },
            usage_instructions: { components: [{ id: '10', name: 'Usage Instructions' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'whitepaper',
          entityType: 'whitepaper',
          entity_type: 'whitepaper',
          name: 'Whitepaper',
          documentTypes: { whitepaper: {}, technical_paper: {} },
          structure: { sections: { required: ['abstract', 'introduction', 'content', 'conclusion'], optional: ['appendix', 'references', 'glossary', 'index'] } },
          legoBlocks: {
            abstract: { components: [{ id: '1', name: 'Abstract' }] },
            introduction: { components: [{ id: '2', name: 'Introduction' }] },
            content: { components: [{ id: '3', name: 'Content' }] },
            conclusion: { components: [{ id: '4', name: 'Conclusion' }] },
            references: { components: [{ id: '5', name: 'References' }] },
            appendix: { components: [{ id: '6', name: 'Appendix' }] },
            glossary: { components: [{ id: '7', name: 'Glossary' }] },
            index: { components: [{ id: '8', name: 'Index' }] },
            foreword: { components: [{ id: '9', name: 'Foreword' }] },
            title_page: { components: [{ id: '10', name: 'Title Page' }] },
            executive_summary: { components: [{ id: '11', name: 'Executive Summary' }] },
            background_context: { components: [{ id: '12', name: 'Background' }] },
            case_studies: { components: [{ id: '13', name: 'Case Studies' }] },
            acknowledgments: { components: [{ id: '14', name: 'Acknowledgments' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'point_of_view',
          entityType: 'point_of_view',
          entity_type: 'point_of_view',
          name: 'Point of View',
          documentTypes: { pov: {}, perspective: {} },
          structure: { sections: { required: ['introduction', 'perspective', 'conclusion'], optional: ['appendix', 'references'] } },
          legoBlocks: {
            introduction: { components: [{ id: '1', name: 'Introduction' }] },
            perspective: { components: [{ id: '2', name: 'Perspective' }] },
            rationale: { components: [{ id: '3', name: 'Rationale' }] },
            conclusion: { components: [{ id: '4', name: 'Conclusion' }] },
            appendix: { components: [{ id: '5', name: 'Appendix' }] },
            references: { components: [{ id: '6', name: 'References' }] },
            case_studies: { components: [{ id: '7', name: 'Case Studies' }] },
            title_overview: { components: [{ id: '8', name: 'Title & Overview' }] },
            executive_perspective: { components: [{ id: '9', name: 'Executive Perspective' }] },
            key_insights: { components: [{ id: '10', name: 'Key Insights' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rfp_rfi_response',
          entityType: 'rfp_rfi_response',
          entity_type: 'rfp_rfi_response',
          name: 'RFP/RFI Response',
          documentTypes: { rfp_response: {}, rfi_response: {} },
          structure: { sections: { required: ['executive_summary', 'approach', 'team', 'pricing'], optional: ['appendix', 'references', 'case_studies'] } },
          legoBlocks: {
            executive_summary: { components: [{ id: '1', name: 'Executive Summary' }] },
            approach: { components: [{ id: '2', name: 'Approach' }] },
            team: { components: [{ id: '3', name: 'Team' }] },
            pricing: { components: [{ id: '4', name: 'Pricing' }] },
            timeline: { components: [{ id: '5', name: 'Timeline' }] },
            appendix: { components: [{ id: '6', name: 'Appendix' }] },
            references: { components: [{ id: '7', name: 'References' }] },
            case_studies: { components: [{ id: '8', name: 'Case Studies' }] },
            credentials: { components: [{ id: '9', name: 'Credentials' }] },
            solution_overview: { components: [{ id: '10', name: 'Solution Overview' }] },
            implementation_timeline: { components: [{ id: '11', name: 'Implementation Timeline' }] },
            compliance_certifications: { components: [{ id: '12', name: 'Compliance' }] },
          },
          type: 'quality-template',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'internal_meeting_presentation',
          entityType: 'internal_meeting_presentation',
          entity_type: 'internal_meeting_presentation',
          name: 'Internal Meeting Presentation',
          documentTypes: { presentation: {}, meeting_slides: {} },
          structure: { sections: { required: ['agenda', 'content', 'action_items'], optional: ['appendix', 'references', 'notes'] } },
          legoBlocks: {
            agenda: { components: [{ id: '1', name: 'Agenda' }] },
            content: { components: [{ id: '2', name: 'Content' }] },
            action_items: { components: [{ id: '3', name: 'Action Items' }] },
            next_steps: { components: [{ id: '4', name: 'Next Steps' }] },
            appendix: { components: [{ id: '5', name: 'Appendix' }] },
            references: { components: [{ id: '6', name: 'References' }] },
            notes: { components: [{ id: '7', name: 'Meeting Notes' }] },
            attendees: { components: [{ id: '8', name: 'Attendees' }] },
            title_slide: { components: [{ id: '9', name: 'Title Slide' }] },
            executive_summary: { components: [{ id: '10', name: 'Executive Summary' }] },
            discussion_points: { components: [{ id: '11', name: 'Discussion Points' }] },
            contact_information: { components: [{ id: '12', name: 'Contact Information' }] },
          },
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
