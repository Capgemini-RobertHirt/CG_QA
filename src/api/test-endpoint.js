'use strict'

const fs = require('fs')
const path = require('path')

console.log('\n=== TEMPLATE LOADING TEST ===\n')
console.log(`Current working directory: ${process.cwd()}`)
console.log(`__dirname: ${__dirname}`)

// Test path detection like the endpoint does
const possiblePaths = [
  path.join(__dirname, '..', 'templates'),
  path.join(process.cwd(), 'src', 'api', 'templates'),
  path.join(process.cwd(), 'api', 'templates'),
  path.join(process.cwd(), '..', 'api', 'templates'),
  path.join(process.cwd(), '..', 'src', 'api', 'templates'),
]

console.log('\nTesting possible paths:')
possiblePaths.forEach((dir, i) => {
  const exists = fs.existsSync(dir)
  console.log(`  ${i + 1}. ${dir} ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`)
  if (exists) {
    const files = fs.readdirSync(dir)
    console.log(`     Files: ${files.join(', ')}`)
  }
})

// Find and load templates
let templatesDir = null
for (const dir of possiblePaths) {
  if (fs.existsSync(dir)) {
    templatesDir = dir
    console.log(`\n✓ Using templates directory: ${templatesDir}`)
    break
  }
}

if (!templatesDir) {
  console.error('\n✗ CRITICAL: Could not find templates directory!')
  process.exit(1)
}

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

console.log('\nLoading templates:\n')
for (const filename of templateNames) {
  const filePath = path.join(templatesDir, filename)
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`✗ ${filename} - FILE NOT FOUND`)
      continue
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const template = JSON.parse(fileContent)

    // Extract legoBlocks
    const legoBlocks = template.structure?.legoBlocks || {}
    const legoBlockKeys = Object.keys(legoBlocks)
    const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
      const count = section.components ? section.components.length : 0
      return sum + count
    }, 0)

    console.log(`✓ ${filename}`)
    console.log(`  - Structure exists: ${!!template.structure}`)
    console.log(`  - LegoBlocks sections: ${legoBlockKeys.length}`)
    console.log(`  - Total components: ${componentCount}`)
    console.log(`  - LegoBlocks keys: ${legoBlockKeys.join(', ')}`)

    // Create response object like endpoint does
    const completeTemplate = {
      id: template.entity_type,
      entityType: template.entity_type,
      entity_type: template.entity_type,
      name: template.name || template.entity_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      document_types: template.document_types || {},
      documentTypes: template.document_types || {},
      global_rules: template.global_rules || {},
      globalRules: template.global_rules || {},
      structure: template.structure || { sections: { required: [], optional: [] } },
      design: template.design || {},
      legoBlocks: legoBlocks,
      type: 'quality-template',
    }

    templates.push(completeTemplate)
  } catch (e) {
    console.log(`✗ ${filename} - ERROR: ${e.message}`)
  }
}

console.log(`\n=== RESULT ===`)
console.log(`✓ Successfully loaded ${templates.length} templates`)
console.log(`\n=== TEMPLATE RESPONSE ===`)
console.log(JSON.stringify({
  templates: templates,
  count: templates.length,
}, null, 2))

// Check individual template structure
console.log(`\n=== FIRST TEMPLATE DETAILS ===`)
if (templates.length > 0) {
  const firstTemplate = templates[0]
  console.log(`Template: ${firstTemplate.name}`)
  console.log(`  - id: ${firstTemplate.id}`)
  console.log(`  - entityType: ${firstTemplate.entityType}`)
  console.log(`  - legoBlocks: ${JSON.stringify(firstTemplate.legoBlocks, null, 2)}`)
}

console.log(`\n=== END TEST ===\n`)
