'use strict'

const { hasSection, toDisplayName } = require('./shared')

function runStructureAgent({ documentContent, template }) {
  const requiredSections = template?.structure?.sections?.required || []
  const optionalSections = template?.structure?.sections?.optional || []
  const matchedRequired = requiredSections.filter((section) => hasSection(documentContent, section))
  const missingRequired = requiredSections.filter((section) => !hasSection(documentContent, section))
  const matchedOptional = optionalSections.filter((section) => hasSection(documentContent, section))
  const missingOptional = optionalSections.filter((section) => !hasSection(documentContent, section))

  const requiredCoverage = requiredSections.length === 0
    ? 100
    : Math.round((matchedRequired.length / requiredSections.length) * 100)
  const completeness = Math.round(((matchedRequired.length + matchedOptional.length * 0.5) / Math.max(1, requiredSections.length + optionalSections.length * 0.5)) * 100)

  const findings = []
  missingRequired.forEach((section) => {
    findings.push({
      dimension: 'structure',
      severity: 'major',
      message: `Missing required section: ${toDisplayName(section)}`,
    })
  })

  missingOptional.slice(0, 4).forEach((section) => {
    findings.push({
      dimension: 'completeness',
      severity: 'minor',
      message: `Optional section not detected: ${toDisplayName(section)}`,
    })
  })

  return {
    id: 'structure-agent',
    name: 'Structure Agent',
    strategy: 'heuristic',
    summary: `Matched ${matchedRequired.length}/${requiredSections.length} required sections and ${matchedOptional.length}/${optionalSections.length} optional sections.`,
    scores: {
      structure: requiredCoverage,
      completeness: Math.max(0, Math.min(100, completeness)),
    },
    findings,
    insights: {
      matchedRequired,
      missingRequired,
      matchedOptional,
      missingOptional,
    },
  }
}

module.exports = {
  runStructureAgent,
}