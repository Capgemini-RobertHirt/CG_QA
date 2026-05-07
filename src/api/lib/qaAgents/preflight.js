'use strict'

const { getQaAgentConfig, isLlmAgentEnabled, getAzureOpenAiConfigForAgent } = require('./config')
const { probeAzureOpenAi } = require('./providers/azureOpenAI')

const LLM_AGENT_IDS = ['structure-agent', 'standards-agent', 'recommendation-agent']

function getConfiguredLlmAgents(config) {
  return LLM_AGENT_IDS.filter((agentId) => isLlmAgentEnabled(config, agentId))
}

function validateAgentConfig(agentId, agentConfig) {
  const issues = []

  if (!agentConfig.endpoint) {
    issues.push({
      agentId,
      severity: 'error',
      code: 'missing-endpoint',
      message: `Azure OpenAI endpoint is not configured for ${agentId}.`,
    })
  }

  if (!agentConfig.deployment) {
    issues.push({
      agentId,
      severity: 'error',
      code: 'missing-deployment',
      message: `Azure OpenAI deployment is not configured for ${agentId}.`,
    })
  }

  if (agentConfig.authMode === 'api-key' && !agentConfig.apiKey) {
    issues.push({
      agentId,
      severity: 'error',
      code: 'missing-api-key',
      message: `Azure OpenAI auth mode is api-key for ${agentId}, but no API key is configured.`,
    })
  }

  if (agentConfig.authMode === 'managed-identity') {
    issues.push({
      agentId,
      severity: 'info',
      code: 'managed-identity-runtime-check',
      message: `Managed identity is configured for ${agentId}; token and tenant validation happens at runtime.`,
    })
  }

  return issues
}

function runQaAgentPreflight() {
  const config = getQaAgentConfig()
  const enabledAgents = getConfiguredLlmAgents(config)

  if (config.strategy === 'heuristic') {
    return {
      ok: true,
      strategy: config.strategy,
      enforced: process.env.QA_AGENT_PREFLIGHT_ENFORCED === 'true',
      enabledAgents,
      issues: [],
      summary: 'QA agent preflight passed because LLM-backed agents are disabled.',
    }
  }

  const issues = enabledAgents.flatMap((agentId) => validateAgentConfig(agentId, getAzureOpenAiConfigForAgent(config, agentId)))
  const blockingIssues = issues.filter((issue) => issue.severity === 'error')

  return {
    ok: blockingIssues.length === 0,
    strategy: config.strategy,
    enforced: process.env.QA_AGENT_PREFLIGHT_ENFORCED === 'true',
    enabledAgents,
    issues,
    summary:
      blockingIssues.length === 0
        ? 'QA agent preflight passed.'
        : `QA agent preflight found ${blockingIssues.length} blocking configuration issue(s).`,
  }
}

async function runQaAgentPreflightProbe({ probeMode }) {
  const config = getQaAgentConfig()
  const preflight = runQaAgentPreflight()

  if (!probeMode || preflight.strategy === 'heuristic') {
    return preflight
  }

  const probeResults = await Promise.all(
    preflight.enabledAgents.map(async (agentId) => {
      const agentConfig = getAzureOpenAiConfigForAgent(config, agentId)
      const blockingIssues = preflight.issues.filter((issue) => issue.agentId === agentId && issue.severity === 'error')

      if (blockingIssues.length > 0) {
        return {
          agentId,
          ok: false,
          probeMode,
          message: 'Skipped provider probe because configuration is incomplete.',
          issues: blockingIssues,
        }
      }

      try {
        const result = await probeAzureOpenAi({
          ...agentConfig,
          mode: probeMode,
        })

        return {
          agentId,
          ok: true,
          probeMode,
          authMode: result.authMode,
          message: result.message,
        }
      } catch (error) {
        return {
          agentId,
          ok: false,
          probeMode,
          message: error.message,
        }
      }
    })
  )

  const probeFailures = probeResults.filter((result) => !result.ok)

  return {
    ...preflight,
    ok: preflight.ok && probeFailures.length === 0,
    probeMode,
    probeResults,
    summary:
      probeFailures.length === 0
        ? `${preflight.summary} ${probeMode === 'live' ? 'Live provider probes succeeded.' : 'Authentication probes succeeded.'}`
        : `${preflight.summary} ${probeMode === 'live' ? 'One or more live provider probes failed.' : 'One or more authentication probes failed.'}`,
  }
}

function ensureQaAgentPreflight() {
  const preflight = runQaAgentPreflight()
  if (process.env.QA_AGENT_PREFLIGHT_ENFORCED === 'true' && !preflight.ok) {
    const error = new Error(preflight.summary)
    error.code = 'qa-agent-preflight-failed'
    error.preflight = preflight
    throw error
  }

  return preflight
}

module.exports = {
  runQaAgentPreflight,
  runQaAgentPreflightProbe,
  ensureQaAgentPreflight,
}