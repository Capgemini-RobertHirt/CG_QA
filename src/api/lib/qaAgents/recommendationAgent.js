'use strict'

const { getQaAgentConfig, canUseAzureOpenAi, isLlmAgentEnabled, getAzureOpenAiConfigForAgent, getAzureOpenAiInsightMetadata } = require('./config')
const { requestJsonChatCompletion } = require('./providers/azureOpenAI')

function getExpectedComponents(template) {
  const legoBlocks = template?.structure?.legoBlocks

  if (Array.isArray(legoBlocks)) {
    return legoBlocks.map((block) => ({
      type: block.type,
      title: block.title,
      required: block.required,
      description: block.description,
    }))
  }

  if (legoBlocks && typeof legoBlocks === 'object') {
    return Object.values(legoBlocks)
      .flatMap((section) => section?.components || [])
      .map((component) => ({
        type: component.componentId || component.type || 'card',
        title: component.name || component.title || 'Component',
        required: Boolean(component.required),
        description: component.description,
      }))
  }

  return []
}

function buildHeuristicRecommendations(agentReports) {
  const findings = agentReports.flatMap((agent) => agent.findings || [])
  const recommendations = []

  const majorFindings = findings.filter((finding) => finding.severity === 'major')
  if (majorFindings.length > 0) {
    recommendations.push('Address missing required template sections first, because they have the largest effect on quality and compliance.')
  }

  if (findings.some((finding) => finding.dimension === 'design')) {
    recommendations.push('Align navigation and document formatting with the template standard before final review.')
  }

  if (findings.some((finding) => finding.dimension === 'content')) {
    recommendations.push('Expand sections that do not yet demonstrate the component types expected by the template.')
  }

  if (recommendations.length === 0) {
    recommendations.push('The document is broadly aligned; focus on final consistency checks and editorial quality.')
  }

  return recommendations
}

function summarizeAgentReports(agentReports) {
  return agentReports.map((agent) => ({
    id: agent.id,
    name: agent.name,
    strategy: agent.strategy,
    summary: agent.summary,
    scores: agent.scores,
    findings: (agent.findings || []).slice(0, 5).map((finding) => ({
      dimension: finding.dimension,
      severity: finding.severity,
      message: finding.message,
    })),
  }))
}

function truncateText(value, maxLength) {
  const text = String(value || '')
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}\n\n[truncated]`
}

function buildRecommendationPrompt({ entityType, documentType, fileName, documentContent, template, agentReports }) {
  const templateSummary = {
    entityType,
    documentType,
    fileName,
    templateName: template?.name || template?.title || entityType,
    requiredSections: template?.structure?.requiredSections || [],
    optionalSections: template?.structure?.optionalSections || [],
    expectedComponents: getExpectedComponents(template),
  }

  return {
    systemPrompt: [
      'You are a senior proposal quality assurance reviewer.',
      'Return strict JSON with keys: summary, recommendations, findings.',
      'summary must be a short string.',
      'recommendations must be an array of 2 to 5 concise, prioritized actions.',
      'findings must be an array of up to 3 objects with keys severity, dimension, message.',
      'Base your reasoning on the template expectations, document excerpt, and prior agent signals.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        task: 'Synthesize the strongest next actions for improving this document against the template.',
        template: templateSummary,
        document_excerpt: truncateText(documentContent, 12000),
        agent_reports: summarizeAgentReports(agentReports),
      },
      null,
      2
    ),
  }
}

function normalizeLlmRecommendations(payload, fallbackRecommendations) {
  const recommendations = Array.isArray(payload?.recommendations)
    ? payload.recommendations.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : []

  const findings = Array.isArray(payload?.findings)
    ? payload.findings
        .filter((item) => item && typeof item.message === 'string')
        .map((item) => ({
          severity: item.severity || 'minor',
          dimension: item.dimension || 'content',
          message: item.message.trim(),
        }))
    : []

  return {
    summary:
      typeof payload?.summary === 'string' && payload.summary.trim().length > 0
        ? payload.summary.trim()
        : 'Synthesized the strongest next actions using Azure OpenAI and the upstream QA agent outputs.',
    recommendations: recommendations.length > 0 ? recommendations : fallbackRecommendations,
    findings,
  }
}

async function runRecommendationAgent({ agentReports, entityType, documentType, fileName, documentContent, template }) {
  const qaConfig = getQaAgentConfig()
  const azureOpenAiConfig = getAzureOpenAiConfigForAgent(qaConfig, 'recommendation-agent')
  const fallbackRecommendations = buildHeuristicRecommendations(agentReports)
  const shouldAttemptLlm =
    isLlmAgentEnabled(qaConfig, 'recommendation-agent') &&
    qaConfig.strategy !== 'heuristic' &&
    canUseAzureOpenAi({ azureOpenAi: azureOpenAiConfig })

  if (shouldAttemptLlm) {
    try {
      const prompt = buildRecommendationPrompt({
        entityType,
        documentType,
        fileName,
        documentContent,
        template,
        agentReports,
      })
      const completion = await requestJsonChatCompletion({
        ...azureOpenAiConfig,
        ...prompt,
      })
      const payload = completion.payload
      const llmResult = normalizeLlmRecommendations(payload, fallbackRecommendations)

      return {
        id: 'recommendation-agent',
        name: 'Recommendation Agent',
        strategy: qaConfig.strategy === 'llm' ? 'llm' : 'hybrid',
        summary: llmResult.summary,
        scores: {},
        findings: llmResult.findings,
        recommendations: llmResult.recommendations,
        insights: {
          synthesizedFromAgents: agentReports.map((agent) => agent.id),
          ...getAzureOpenAiInsightMetadata({
            ...azureOpenAiConfig,
            authMode: completion.authMode,
          }),
        },
      }
    } catch (error) {
      return {
        id: 'recommendation-agent',
        name: 'Recommendation Agent',
        strategy: 'heuristic',
        summary: 'Synthesized the outputs of the specialized QA agents into prioritized next actions.',
        scores: {},
        findings: [],
        recommendations: fallbackRecommendations,
        insights: {
          synthesizedFromAgents: agentReports.map((agent) => agent.id),
          fallbackReason: error.message,
          ...getAzureOpenAiInsightMetadata(azureOpenAiConfig),
        },
      }
    }
  }

  return {
    id: 'recommendation-agent',
    name: 'Recommendation Agent',
    strategy: 'heuristic',
    summary: 'Synthesized the outputs of the specialized QA agents into prioritized next actions.',
    scores: {},
    findings: [],
    recommendations: fallbackRecommendations,
    insights: {
      synthesizedFromAgents: agentReports.map((agent) => agent.id),
    },
  }
}

module.exports = {
  runRecommendationAgent,
}