#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('Testing template loading and legoBlocks extraction...\n')

const templateNames = [
  'default.json',
  'engineering.json',
  'asset.json',
  'whitepaper.json',
  'point_of_view.json',
  'rfp_rfi_response.json',
  'internal_meeting_presentation.json',
]

const possiblePaths = [
  path.join(__dirname, 'templates'),
  path.join(process.cwd(), 'src', 'api', 'templates'),
  path.join(process.cwd(), 'api', 'templates'),
]

let templatesDir = null
for (const dir of possiblePaths) {
  if (fs.existsSync(dir)) {
    templatesDir = dir
    console.log(`✓ Found templates directory: ${templatesDir}\n`)
    break
  }
}

if (!templatesDir) {
  console.error('✗ Could not find templates directory')
  process.exit(1)
}

const templates = []

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
      
      console.log(`✓ ${filename}:`)
      console.log(`  - Entity Type: ${template.entity_type}`)
      console.log(`  - Has structure: ${!!template.structure}`)
      console.log(`  - Has structure.legoBlocks: ${!!template.structure?.legoBlocks}`)
      console.log(`  - LegoBlocks sections: ${legoBlockKeys.length} (${legoBlockKeys.join(', ')})`)
      console.log(`  - Total components: ${componentCount}`)
      
      // Check each section
      legoBlockKeys.forEach(sectionName => {
        const section = legoBlocks[sectionName]
        const componentCount = section.components ? section.components.length : 0
        console.log(`    - ${sectionName}: ${componentCount} components`)
      })
      
      templates.push({
        id: template.entity_type,
        entityType: template.entity_type,
        name: template.name || template.entity_type.replace(/_/g, ' '),
        legoBlocks: legoBlocks,
        totalComponents: componentCount,
      })
      console.log()
    }
  } catch (e) {
    console.error(`✗ Error loading ${filename}: ${e.message}\n`)
  }
}

console.log(`\n📊 Summary: Loaded ${templates.length} templates`)
templates.forEach(t => {
  console.log(`  - ${t.entityType}: ${t.totalComponents} components`)
})
