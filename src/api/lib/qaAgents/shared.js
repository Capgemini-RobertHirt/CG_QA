'use strict'

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ')
}

function toDisplayName(value) {
  return (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function hasSection(content, sectionName) {
  const normalizedContent = normalizeText(content)
  const tokens = (sectionName || '').toLowerCase().split('_').filter(Boolean)

  if (tokens.length === 0) {
    return false
  }

  if (normalizedContent.includes(tokens.join(' '))) {
    return true
  }

  return tokens.every((token) => normalizedContent.includes(token))
}

function detectComponentSignals(documentContent) {
  const content = documentContent || ''
  const normalized = normalizeText(content)
  const signals = new Set()

  if (/^[\s]*[-*•]\s/m.test(content)) signals.add('list')
  if (/^[\s]*\d+\.\s/m.test(content)) signals.add('numbered-list')
  if (content.includes('|')) signals.add('table')
  if (/\d+%/.test(content) || /\$[\d,]+/.test(content)) signals.add('chart')
  if (normalized.includes('timeline') || normalized.includes('schedule') || normalized.includes('roadmap')) signals.add('timeline')
  if (normalized.includes('quote') || normalized.includes('testimonial')) signals.add('quote')
  if (normalized.includes('figure') || normalized.includes('image') || normalized.includes('diagram')) signals.add('image')
  if (normalized.includes('overview') || normalized.includes('summary') || normalized.includes('highlights')) signals.add('card')
  if (normalized.includes('comparison') || normalized.includes('matrix')) signals.add('grid')

  return Array.from(signals)
}

function getExpectedTemplateComponents(template) {
  const legoBlocks = template?.structure?.legoBlocks || template?.legoBlocks || {}
  const expectedComponents = []

  Object.entries(legoBlocks).forEach(([sectionName, sectionValue]) => {
    const components = sectionValue?.components || []
    components.forEach((component) => {
      expectedComponents.push({
        sectionName,
        componentId: component.componentId || 'card',
        componentName: component.name || toDisplayName(sectionName),
      })
    })
  })

  return expectedComponents
}

function getDocumentWordCount(documentContent) {
  return normalizeText(documentContent).split(/\s+/).filter(Boolean).length
}

module.exports = {
  normalizeText,
  toDisplayName,
  hasSection,
  detectComponentSignals,
  getExpectedTemplateComponents,
  getDocumentWordCount,
}