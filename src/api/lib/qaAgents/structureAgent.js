'use strict'

const { hasSection, toDisplayName } = require('./shared')
const { getQaAgentConfig, canUseAzureOpenAi, isLlmAgentEnabled, getAzureOpenAiConfigForAgent, getAzureOpenAiInsightMetadata } = require('./config')
const { requestJsonChatCompletion } = require('./providers/azureOpenAI')

function buildHeuristicStructureReport({ documentContent, template }) {
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
      section,
      related_sections: [section],
      issue_type: 'missing-required-section',
      expected: toDisplayName(section),
    })
  })

  missingOptional.slice(0, 4).forEach((section) => {
    findings.push({
      dimension: 'completeness',
      severity: 'minor',
      message: `Optional section not detected: ${toDisplayName(section)}`,
      section,
      related_sections: [section],
      issue_type: 'missing-optional-section',
      expected: toDisplayName(section),
    })
  })

  return {
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

function truncateText(value, maxLength) {
  const text = String(value || '')
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}\n\n[truncated]`
}

function buildStructurePrompt({ documentContent, template, heuristicReport }) {
  return {
    systemPrompt: [
      'You are a proposal QA reviewer specializing in document structure and section coverage.',
      'Return strict JSON with keys: summary, scores, findings.',
      'scores must be an object with integer structure and completeness values from 0 to 100.',
      'findings must be an array of up to 6 objects with keys severity, dimension, message.',
      'Judge whether the document contains the required and optional sections implied by the template, even when section titles vary slightly.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        task: 'Assess section coverage and structural completeness for this document.',
        templateStructure: {
          requiredSections: template?.structure?.sections?.required || [],
          optionalSections: template?.structure?.sections?.optional || [],
        },
        heuristicBaseline: heuristicReport,
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
      dimension: finding.dimension || 'structure',
      message: finding.message.trim(),
    }))

  return normalizedFindings.length > 0 ? normalizedFindings : fallbackFindings
}

async function runStructureAgent({ documentContent, template }) {
  const heuristicReport = buildHeuristicStructureReport({ documentContent, template })
  const qaConfig = getQaAgentConfig()
  const azureOpenAiConfig = getAzureOpenAiConfigForAgent(qaConfig, 'structure-agent')
  const shouldAttemptLlm =
    isLlmAgentEnabled(qaConfig, 'structure-agent') &&
    qaConfig.strategy !== 'heuristic' &&
    canUseAzureOpenAi({ azureOpenAi: azureOpenAiConfig })

  if (shouldAttemptLlm) {
    try {
      const prompt = buildStructurePrompt({ documentContent, template, heuristicReport })
      const completion = await requestJsonChatCompletion({
        ...azureOpenAiConfig,
        ...prompt,
      })
      const payload = completion.payload

      return {
        id: 'structure-agent',
        name: 'Structure Agent',
        strategy: qaConfig.strategy === 'llm' ? 'llm' : 'hybrid',
        summary:
          typeof payload?.summary === 'string' && payload.summary.trim().length > 0
            ? payload.summary.trim()
            : heuristicReport.summary,
        scores: {
          structure: normalizeScore(payload?.scores?.structure, heuristicReport.scores.structure),
          completeness: normalizeScore(payload?.scores?.completeness, heuristicReport.scores.completeness),
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
        id: 'structure-agent',
        name: 'Structure Agent',
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
    id: 'structure-agent',
    name: 'Structure Agent',
    strategy: 'heuristic',
    summary: heuristicReport.summary,
    scores: heuristicReport.scores,
    findings: heuristicReport.findings,
    insights: heuristicReport.insights,
  }
}

module.exports = {
  runStructureAgent,
}