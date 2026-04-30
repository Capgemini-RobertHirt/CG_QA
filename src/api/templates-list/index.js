'use strict'

const fs = require('fs')
const path = require('path')

/**
 * GET /api/templates-list
 * Returns all templates with full structure and details
 */
module.exports = async function templatesList(context, req) {
  try {
    context.log('templates-list endpoint called')
    
    // Try to load templates from JSON files directly
    const templateNames = [
      'default.json',
      'engineering.json',
      'asset.json',
      'whitepaper.json',
      'point_of_view.json',
      'rfp_rfi_response.json',
      'internal_meeting_presentation.json',
    ]
    
    const templates = []
    
    // Try multiple paths
    const possiblePaths = [
      path.join(__dirname, '..', 'templates'),
      path.join(process.cwd(), 'src', 'api', 'templates'),
      path.join(process.cwd(), 'api', 'templates'),
      path.join(process.cwd(), '..', 'api', 'templates'),
      path.join(process.cwd(), '..', 'src', 'api', 'templates'),
    ]
    
    let templatesDir = null
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        templatesDir = dir
        context.log(`✓ Found templates directory: ${templatesDir}`)
        break
      } else {
        context.log(`✗ Templates directory not found: ${dir}`)
      }
    }
    
    if (templatesDir) {
      for (const filename of templateNames) {
        const filePath = path.join(templatesDir, filename)
        try {
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            const template = JSON.parse(fileContent)
            
            // Extract legoBlocks from structure
            const legoBlocks = template.structure?.legoBlocks || {}
            const legoBlockKeys = Object.keys(legoBlocks)
            const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
              const sectionComponents = section.components ? section.components.length : 0
              return sum + sectionComponents
            }, 0)
            
            context.log(`Processing ${filename}: structure exists=${!!template.structure}, legoBlocks found=${legoBlockKeys.length} sections with ${componentCount} total components`)
            
            // Create complete template object - DON'T spread template to avoid nesting issues
            const completeTemplate = {
              id: template.entity_type,
              entityType: template.entity_type,
              entity_type: template.entity_type,
              name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              // Include all key properties from original template
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
            
            templates.push(completeTemplate)
            context.log(`Loaded template: ${template.entity_type} with ${legoBlockKeys.length} sections and ${componentCount} components - legoBlocks keys: ${legoBlockKeys.join(', ')}`)
          }
        } catch (e) {
          context.log(`Error loading ${filename}: ${e.message}`)
        }
      }
    }
    
    // If we loaded templates from files, return them
    if (templates.length > 0) {
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: templates,
          count: templates.length,
        }),
      }
      return
    }
    
    // Fallback - always return something
    context.log('No templates loaded from files, using fallback templates with legoBlocks')
    const fallbackTemplates = [
      { 
        id: 'default', 
        entityType: 'default', 
        name: 'Default', 
        structure: { sections: { required: ['introduction', 'proposal'], optional: ['conclusion', 'appendix', 'references', 'acknowledgments'] } },
        legoBlocks: {
          introduction: { components: [{ id: '1', componentId: 'card', name: 'Introduction', subcomponents: [{ id: '1a', subcomponentId: 'title', name: 'Title' }, { id: '1b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          proposal: { components: [{ id: '2', componentId: 'card', name: 'Proposal', subcomponents: [{ id: '2a', subcomponentId: 'title', name: 'Title' }, { id: '2b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          conclusion: { components: [{ id: '3', componentId: 'card', name: 'Conclusion', subcomponents: [{ id: '3a', subcomponentId: 'title', name: 'Title' }, { id: '3b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          appendix: { components: [{ id: '4', componentId: 'card', name: 'Appendix', subcomponents: [{ id: '4a', subcomponentId: 'title', name: 'Title' }, { id: '4b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References', subcomponents: [{ id: '5a', subcomponentId: 'list', name: 'Reference List' }] }] },
          acknowledgments: { components: [{ id: '6', componentId: 'card', name: 'Acknowledgments', subcomponents: [{ id: '6a', subcomponentId: 'paragraph', name: 'Acknowledgment Text' }] }] },
        }
      },
      { 
        id: 'engineering', 
        entityType: 'engineering', 
        name: 'Engineering', 
        structure: { sections: { required: ['overview', 'requirements', 'design', 'implementation'], optional: ['appendix', 'references', 'glossary'] } },
        legoBlocks: {
          overview: { components: [{ id: '1', componentId: 'card', name: 'Overview', subcomponents: [{ id: '1a', subcomponentId: 'title', name: 'Title' }, { id: '1b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          requirements: { components: [{ id: '2', componentId: 'card', name: 'Requirements', subcomponents: [{ id: '2a', subcomponentId: 'title', name: 'Title' }, { id: '2b', subcomponentId: 'list', name: 'Requirements List' }] }] },
          design: { components: [{ id: '3', componentId: 'card', name: 'Design', subcomponents: [{ id: '3a', subcomponentId: 'title', name: 'Title' }, { id: '3b', subcomponentId: 'diagram', name: 'Diagram' }] }] },
          implementation: { components: [{ id: '4', componentId: 'card', name: 'Implementation', subcomponents: [{ id: '4a', subcomponentId: 'title', name: 'Title' }, { id: '4b', subcomponentId: 'code', name: 'Code' }] }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix', subcomponents: [{ id: '5a', subcomponentId: 'content', name: 'Additional Content' }] }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References', subcomponents: [{ id: '6a', subcomponentId: 'list', name: 'Reference List' }] }] },
          glossary: { components: [{ id: '7', componentId: 'card', name: 'Glossary', subcomponents: [{ id: '7a', subcomponentId: 'definitions', name: 'Term Definitions' }] }] },
          technical_overview: { components: [{ id: '8', componentId: 'card', name: 'Technical Overview', subcomponents: [{ id: '8a', subcomponentId: 'title', name: 'Title' }, { id: '8b', subcomponentId: 'paragraph', name: 'Content' }] }] },
          architecture: { components: [{ id: '9', componentId: 'card', name: 'Architecture', subcomponents: [{ id: '9a', subcomponentId: 'diagram', name: 'Architecture Diagram' }] }] },
          support: { components: [{ id: '10', componentId: 'card', name: 'Support', subcomponents: [{ id: '10a', subcomponentId: 'contact', name: 'Contact Information' }] }] },
        }
      },
      { 
        id: 'asset', 
        entityType: 'asset', 
        name: 'Asset', 
        structure: { sections: { required: ['overview', 'inventory', 'specifications'], optional: ['appendix', 'references', 'details'] } },
        legoBlocks: {
          overview: { components: [{ id: '1', componentId: 'card', name: 'Overview', subcomponents: [{ id: '1a', subcomponentId: 'title', name: 'Title' }, { id: '1b', subcomponentId: 'paragraph', name: 'Description' }] }] },
          inventory: { components: [{ id: '2', componentId: 'card', name: 'Inventory', subcomponents: [{ id: '2a', subcomponentId: 'title', name: 'Title' }, { id: '2b', subcomponentId: 'table', name: 'Inventory Table' }] }] },
          specifications: { components: [{ id: '3', componentId: 'card', name: 'Specifications', subcomponents: [{ id: '3a', subcomponentId: 'title', name: 'Title' }, { id: '3b', subcomponentId: 'specs', name: 'Technical Specs' }] }] },
          appendix: { components: [{ id: '4', componentId: 'card', name: 'Appendix', subcomponents: [{ id: '4a', subcomponentId: 'content', name: 'Content' }] }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References', subcomponents: [{ id: '5a', subcomponentId: 'list', name: 'References' }] }] },
          details: { components: [{ id: '6', componentId: 'card', name: 'Details', subcomponents: [{ id: '6a', subcomponentId: 'paragraph', name: 'Additional Details' }] }] },
          title_description: { components: [{ id: '7', componentId: 'card', name: 'Title & Description' }] },
          asset_overview: { components: [{ id: '8', componentId: 'card', name: 'Asset Overview' }] },
          key_content: { components: [{ id: '9', componentId: 'card', name: 'Key Content' }] },
          usage_instructions: { components: [{ id: '10', componentId: 'card', name: 'Usage Instructions' }] },
        }
      },
      { 
        id: 'whitepaper', 
        entityType: 'whitepaper', 
        name: 'Whitepaper', 
        structure: { sections: { required: ['abstract', 'introduction', 'content', 'conclusion', 'references'], optional: ['appendix', 'glossary', 'index', 'foreword'] } },
        legoBlocks: {
          abstract: { components: [{ id: '1', componentId: 'card', name: 'Abstract' }] },
          introduction: { components: [{ id: '2', componentId: 'card', name: 'Introduction' }] },
          content: { components: [{ id: '3', componentId: 'card', name: 'Content' }] },
          conclusion: { components: [{ id: '4', componentId: 'card', name: 'Conclusion' }] },
          references: { components: [{ id: '5', componentId: 'card', name: 'References' }] },
          appendix: { components: [{ id: '6', componentId: 'card', name: 'Appendix' }] },
          glossary: { components: [{ id: '7', componentId: 'card', name: 'Glossary' }] },
          index: { components: [{ id: '8', componentId: 'card', name: 'Index' }] },
          foreword: { components: [{ id: '9', componentId: 'card', name: 'Foreword' }] },
          title_page: { components: [{ id: '10', componentId: 'card', name: 'Title Page' }] },
          executive_summary: { components: [{ id: '11', componentId: 'card', name: 'Executive Summary' }] },
          background_context: { components: [{ id: '12', componentId: 'card', name: 'Background & Context' }] },
          case_studies: { components: [{ id: '13', componentId: 'card', name: 'Case Studies' }] },
          acknowledgments: { components: [{ id: '14', componentId: 'card', name: 'Acknowledgments' }] },
        }
      },
      { 
        id: 'point_of_view', 
        entityType: 'point_of_view', 
        name: 'Point of View', 
        structure: { sections: { required: ['introduction', 'perspective', 'rationale', 'conclusion'], optional: ['appendix', 'references', 'case_studies'] } },
        legoBlocks: {
          introduction: { components: [{ id: '1', componentId: 'card', name: 'Introduction' }] },
          perspective: { components: [{ id: '2', componentId: 'card', name: 'Perspective' }] },
          rationale: { components: [{ id: '3', componentId: 'card', name: 'Rationale' }] },
          conclusion: { components: [{ id: '4', componentId: 'card', name: 'Conclusion' }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References' }] },
          case_studies: { components: [{ id: '7', componentId: 'card', name: 'Case Studies' }] },
          title_overview: { components: [{ id: '8', componentId: 'card', name: 'Title & Overview' }] },
          executive_perspective: { components: [{ id: '9', componentId: 'card', name: 'Executive Perspective' }] },
          key_insights: { components: [{ id: '10', componentId: 'card', name: 'Key Insights' }] },
        }
      },
      { 
        id: 'rfp_rfi_response', 
        entityType: 'rfp_rfi_response', 
        name: 'RFP/RFI Response', 
        structure: { sections: { required: ['executive_summary', 'approach', 'team', 'pricing', 'timeline'], optional: ['appendix', 'references', 'case_studies', 'credentials'] } },
        legoBlocks: {
          executive_summary: { components: [{ id: '1', componentId: 'card', name: 'Executive Summary' }] },
          approach: { components: [{ id: '2', componentId: 'card', name: 'Approach' }] },
          team: { components: [{ id: '3', componentId: 'card', name: 'Team' }] },
          pricing: { components: [{ id: '4', componentId: 'card', name: 'Pricing' }] },
          timeline: { components: [{ id: '5', componentId: 'card', name: 'Timeline' }] },
          appendix: { components: [{ id: '6', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '7', componentId: 'card', name: 'References' }] },
          case_studies: { components: [{ id: '8', componentId: 'card', name: 'Case Studies' }] },
          credentials: { components: [{ id: '9', componentId: 'card', name: 'Credentials' }] },
          solution_overview: { components: [{ id: '10', componentId: 'card', name: 'Solution Overview' }] },
          implementation_timeline: { components: [{ id: '11', componentId: 'card', name: 'Implementation Timeline' }] },
          compliance_certifications: { components: [{ id: '12', componentId: 'card', name: 'Compliance & Certifications' }] },
        }
      },
      { 
        id: 'internal_meeting_presentation', 
        entityType: 'internal_meeting_presentation', 
        name: 'Internal Meeting Presentation', 
        structure: { sections: { required: ['agenda', 'content', 'action_items', 'next_steps'], optional: ['appendix', 'references', 'notes', 'attendees'] } },
        legoBlocks: {
          agenda: { components: [{ id: '1', componentId: 'card', name: 'Agenda' }] },
          content: { components: [{ id: '2', componentId: 'card', name: 'Content' }] },
          action_items: { components: [{ id: '3', componentId: 'card', name: 'Action Items' }] },
          next_steps: { components: [{ id: '4', componentId: 'card', name: 'Next Steps' }] },
          appendix: { components: [{ id: '5', componentId: 'card', name: 'Appendix' }] },
          references: { components: [{ id: '6', componentId: 'card', name: 'References' }] },
          notes: { components: [{ id: '7', componentId: 'card', name: 'Meeting Notes' }] },
          attendees: { components: [{ id: '8', componentId: 'card', name: 'Attendees' }] },
          title_slide: { components: [{ id: '9', componentId: 'card', name: 'Title Slide' }] },
          executive_summary: { components: [{ id: '10', componentId: 'card', name: 'Executive Summary' }] },
          discussion_points: { components: [{ id: '11', componentId: 'card', name: 'Discussion Points' }] },
          contact_information: { components: [{ id: '12', componentId: 'card', name: 'Contact Information' }] },
        }
      },
    ]
    
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: fallbackTemplates,
        count: fallbackTemplates.length,
      }),
    }
  } catch (error) {
    context.log(`Error in templates-list: ${error.message}`)
    
    // Ultimate fallback - return at least the template names
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates: [
          { id: 'default', entityType: 'default', name: 'Default' },
          { id: 'engineering', entityType: 'engineering', name: 'Engineering' },
          { id: 'asset', entityType: 'asset', name: 'Asset' },
          { id: 'whitepaper', entityType: 'whitepaper', name: 'Whitepaper' },
          { id: 'point_of_view', entityType: 'point_of_view', name: 'Point of View' },
          { id: 'rfp_rfi_response', entityType: 'rfp_rfi_response', name: 'RFP/RFI Response' },
          { id: 'internal_meeting_presentation', entityType: 'internal_meeting_presentation', name: 'Internal Meeting Presentation' },
        ],
        count: 7,
      }),
    }
  }
}
