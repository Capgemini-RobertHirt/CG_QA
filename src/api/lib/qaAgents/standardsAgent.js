'use strict'

const { normalizeText } = require('./shared')

function runStandardsAgent({ documentContent, template }) {
  const content = normalizeText(documentContent)
  const findings = []
  let designScore = 78
  let complianceScore = 82

  if (template?.structure?.toc?.required && !content.includes('table of contents')) {
    designScore -= 15
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: 'Table of contents is required by the template but was not detected.',
    })
  }

  if (template?.structure?.cross_references?.figures_numbered && content.includes('figure') && !/figure\s+\d+/i.test(documentContent)) {
    complianceScore -= 10
    findings.push({
      dimension: 'compliance',
      severity: 'minor',
      message: 'Figures appear to be referenced without numbering, which conflicts with the template standard.',
    })
  }

  if (template?.structure?.cross_references?.tables_numbered && content.includes('table') && !/table\s+\d+/i.test(documentContent)) {
    complianceScore -= 10
    findings.push({
      dimension: 'compliance',
      severity: 'minor',
      message: 'Tables appear to be referenced without numbering, which conflicts with the template standard.',
    })
  }

  return {
    id: 'standards-agent',
    name: 'Standards Agent',
    strategy: 'heuristic',
    summary: 'Checked structural standards, navigation requirements, and cross-reference rules against the selected template.',
    scores: {
      design: Math.max(0, Math.min(100, designScore)),
      compliance: Math.max(0, Math.min(100, complianceScore)),
    },
    findings,
    insights: {
      tocRequired: Boolean(template?.structure?.toc?.required),
      figureNumberingRequired: Boolean(template?.structure?.cross_references?.figures_numbered),
      tableNumberingRequired: Boolean(template?.structure?.cross_references?.tables_numbered),
    },
  }
}

module.exports = {
  runStandardsAgent,
}