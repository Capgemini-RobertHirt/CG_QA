'use strict'

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ')
}

function toDisplayName(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function hasSection(content, sectionName) {
  const normalizedContent = normalizeText(content)
  const tokens = sectionName.toLowerCase().split('_').filter(Boolean)

  if (tokens.length === 0) {
    return false
  }

  if (normalizedContent.includes(tokens.join(' '))) {
    return true
  }

  return tokens.every((token) => normalizedContent.includes(token))
}

function buildRecommendations(missingRequired, missingOptional, template) {
  const recommendations = []

  missingRequired.slice(0, 4).forEach((section) => {
    recommendations.push(`Add the required section '${toDisplayName(section)}' to align with the selected template.`)
  })

  if (template?.structure?.toc?.required) {
    recommendations.push('Add a table of contents to satisfy the template navigation requirements.')
  }

  if (missingOptional.length > 0) {
    recommendations.push(`Improve completeness by considering optional sections such as ${missingOptional.slice(0, 3).map(toDisplayName).join(', ')}.`)
  }

  if (recommendations.length === 0) {
    recommendations.push('The document aligns well with the selected template. Focus on wording and formatting refinements.')
  }

  return recommendations
}

function analyzeDocumentAgainstTemplate({ sampleId, fileName, entityType, documentType, documentContent, template }) {
  const requiredSections = template?.structure?.sections?.required || []
  const optionalSections = template?.structure?.sections?.optional || []
  const missingRequired = requiredSections.filter((section) => !hasSection(documentContent, section))
  const presentRequired = requiredSections.filter((section) => hasSection(documentContent, section))
  const missingOptional = optionalSections.filter((section) => !hasSection(documentContent, section))

  const structureScore = requiredSections.length === 0
    ? 100
    : Math.round((presentRequired.length / requiredSections.length) * 100)
  const wordCount = normalizeText(documentContent).split(/\s+/).filter(Boolean).length
  const contentScore = Math.min(100, Math.max(45, Math.round(wordCount / 12)))
  const designScore = template?.structure?.toc?.required && !normalizeText(documentContent).includes('table of contents')
    ? 65
    : 78
  const completenessScore = Math.max(
    40,
    Math.round(((presentRequired.length + (optionalSections.length - missingOptional.length) * 0.5) / Math.max(1, requiredSections.length + optionalSections.length * 0.5)) * 100)
  )
  const overallScore = Math.round((structureScore * 0.4) + (contentScore * 0.2) + (designScore * 0.15) + (completenessScore * 0.25))

  const findings = []
  missingRequired.forEach((section) => {
    findings.push({
      dimension: 'structure',
      severity: 'major',
      message: `Missing required section: ${toDisplayName(section)}`,
    })
  })

  missingOptional.slice(0, 3).forEach((section) => {
    findings.push({
      dimension: 'completeness',
      severity: 'minor',
      message: `Optional section not detected: ${toDisplayName(section)}`,
    })
  })

  if (template?.structure?.toc?.required && !normalizeText(documentContent).includes('table of contents')) {
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: 'Table of contents required by template but not detected in the uploaded document.',
    })
  }

  return {
    sample_id: sampleId,
    entity_type: entityType,
    document_type: documentType,
    file_name: fileName,
    scores: {
      structure: structureScore,
      design: designScore,
      content: contentScore,
      completeness: completenessScore,
    },
    overall_score: overallScore,
    recommendations: buildRecommendations(missingRequired, missingOptional, template),
    findings,
    annotations: [],
    heatmap: null,
    created_at: new Date().toISOString(),
  }
}

module.exports = {
  analyzeDocumentAgainstTemplate,
}