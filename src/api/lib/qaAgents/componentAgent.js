'use strict'

const { detectComponentSignals, getExpectedTemplateComponents, toDisplayName, getDocumentWordCount } = require('./shared')

const SIGNAL_MAP = {
  card: ['card'],
  table: ['table'],
  chart: ['chart'],
  timeline: ['timeline'],
  quote: ['quote'],
  grid: ['grid'],
  numbered_list: ['numbered-list'],
}

function runComponentAgent({ documentContent, template }) {
  const expectedComponents = getExpectedTemplateComponents(template)
  const detectedSignals = detectComponentSignals(documentContent)
  const wordCount = getDocumentWordCount(documentContent)

  let matchedComponents = 0
  const findings = []

  expectedComponents.forEach((component) => {
    const acceptableSignals = SIGNAL_MAP[component.componentId] || ['card']
    const hasMatch = acceptableSignals.some((signal) => detectedSignals.includes(signal))
    if (hasMatch) {
      matchedComponents += 1
      return
    }

    findings.push({
      dimension: 'content',
      severity: 'minor',
      message: `Document does not show strong evidence for component '${component.componentName}' in section '${toDisplayName(component.sectionName)}'.`,
    })
  })

  const componentCoverage = expectedComponents.length === 0
    ? 100
    : Math.round((matchedComponents / expectedComponents.length) * 100)
  const richnessScore = Math.min(100, Math.max(45, Math.round(wordCount / 12)))

  return {
    id: 'component-agent',
    name: 'Component Agent',
    strategy: 'heuristic',
    summary: `Detected ${detectedSignals.length} component signals across ${wordCount} words and matched ${matchedComponents}/${expectedComponents.length} expected template components.`,
    scores: {
      content: Math.round((componentCoverage * 0.6) + (richnessScore * 0.4)),
    },
    findings: findings.slice(0, 6),
    insights: {
      detectedSignals,
      expectedComponents,
      matchedComponents,
    },
  }
}

module.exports = {
  runComponentAgent,
}