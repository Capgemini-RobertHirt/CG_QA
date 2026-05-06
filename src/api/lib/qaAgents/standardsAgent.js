'use strict'

const { normalizeText } = require('./shared')
const { getQaAgentConfig, canUseAzureOpenAi, isLlmAgentEnabled, getAzureOpenAiConfigForAgent, getAzureOpenAiInsightMetadata } = require('./config')
const { requestJsonChatCompletion } = require('./providers/azureOpenAI')

function buildHeuristicStandardsReport({ documentContent, template }) {
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

function truncateText(value, maxLength) {
  const text = String(value || '')
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}\n\n[truncated]`
}

function buildStandardsPrompt({ documentContent, template, heuristicReport }) {
  return {
    systemPrompt: [
      'You are a proposal QA reviewer specializing in document standards and compliance.',
      'Return strict JSON with keys: summary, scores, findings.',
      'scores must be an object with integer design and compliance values from 0 to 100.',
      'findings must be an array of up to 4 objects with keys severity, dimension, message.',
      'Focus on table of contents, numbering, references, formatting standards, and structural navigation quality.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        task: 'Assess the document against the template standards and compliance expectations.',
        templateStandards: {
          tocRequired: Boolean(template?.structure?.toc?.required),
          figureNumberingRequired: Boolean(template?.structure?.cross_references?.figures_numbered),
          tableNumberingRequired: Boolean(template?.structure?.cross_references?.tables_numbered),
        },
        heuristicBaseline: {
          summary: heuristicReport.summary,
          scores: heuristicReport.scores,
          findings: heuristicReport.findings,
        },
        documentExcerpt: truncateText(documentContent, 12000),
      },
      null,
      2
    ),
  }
}

function normalizeScore(value, fallback) {
  const numeric = Number.parseInt(value, 10)
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric))
  }
  return fallback
}

function normalizeFindings(findings, fallbackFindings) {
  if (!Array.isArray(findings)) {
    return fallbackFindings
  }

  const normalizedFindings = findings
    .filter((finding) => finding && typeof finding.message === 'string')
    .map((finding) => ({
      severity: finding.severity || 'minor',
      dimension: finding.dimension || 'compliance',
      message: finding.message.trim(),
    }))

  return normalizedFindings.length > 0 ? normalizedFindings : fallbackFindings
}

async function runStandardsAgent({ documentContent, template }) {
  const heuristicReport = buildHeuristicStandardsReport({ documentContent, template })
  const qaConfig = getQaAgentConfig()
  const azureOpenAiConfig = getAzureOpenAiConfigForAgent(qaConfig, 'standards-agent')
  const shouldAttemptLlm =
    isLlmAgentEnabled(qaConfig, 'standards-agent') &&
    qaConfig.strategy !== 'heuristic' &&
    canUseAzureOpenAi({ azureOpenAi: azureOpenAiConfig })

  if (shouldAttemptLlm) {
    try {
      const prompt = buildStandardsPrompt({ documentContent, template, heuristicReport })
      const completion = await requestJsonChatCompletion({
        ...azureOpenAiConfig,
        ...prompt,
      })
      const payload = completion.payload

      return {
        id: 'standards-agent',
        name: 'Standards Agent',
        strategy: qaConfig.strategy === 'llm' ? 'llm' : 'hybrid',
        summary:
          typeof payload?.summary === 'string' && payload.summary.trim().length > 0
            ? payload.summary.trim()
            : heuristicReport.summary,
        scores: {
          design: normalizeScore(payload?.scores?.design, heuristicReport.scores.design),
          compliance: normalizeScore(payload?.scores?.compliance, heuristicReport.scores.compliance),
        },
        findings: normalizeFindings(payload?.findings, heuristicReport.findings),
        insights: {
          ...heuristicReport.insights,
          ...getAzureOpenAiInsightMetadata({
            ...azureOpenAiConfig,
            authMode: completion.authMode,
          }),
        },
      }
    } catch (error) {
      return {
        id: 'standards-agent',
        name: 'Standards Agent',
        strategy: 'heuristic',
        summary: heuristicReport.summary,
        scores: heuristicReport.scores,
        findings: heuristicReport.findings,
        insights: {
          ...heuristicReport.insights,
          fallbackReason: error.message,
          ...getAzureOpenAiInsightMetadata(azureOpenAiConfig),
        },
      }
    }
  }

  return {
    id: 'standards-agent',
    name: 'Standards Agent',
    strategy: 'heuristic',
    summary: heuristicReport.summary,
    scores: heuristicReport.scores,
    findings: heuristicReport.findings,
    insights: heuristicReport.insights,
  }
}

module.exports = {
  runStandardsAgent,
}