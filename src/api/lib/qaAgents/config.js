'use strict'

const DEFAULT_OPENAI_API_VERSION = '2024-10-21'
const DEFAULT_TIMEOUT_MS = 15000

function normalizeAuthMode(value) {
  const normalized = String(value || 'auto').trim().toLowerCase()
  if (normalized === 'api-key' || normalized === 'managed-identity' || normalized === 'auto') {
    return normalized
  }
  return 'auto'
}

function toEndpointHost(value) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).host
  } catch {
    return String(value)
  }
}

function toEnvToken(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
}

function parseAgentIds(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeStrategy(value) {
  const normalized = String(value || 'heuristic').trim().toLowerCase()
  if (normalized === 'llm' || normalized === 'hybrid') {
    return normalized
  }
  return 'heuristic'
}

function parseTimeout(value) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return DEFAULT_TIMEOUT_MS
}

function getQaAgentConfig() {
  const strategy = normalizeStrategy(process.env.QA_AGENT_STRATEGY)
  const llmAgentIds = parseAgentIds(process.env.QA_LLM_AGENT_IDS)
  const llmAgentId = String(process.env.QA_LLM_AGENT_ID || 'recommendation-agent').trim().toLowerCase()
  const enabledLlmAgents = llmAgentIds.length > 0 ? llmAgentIds : [llmAgentId]

  return {
    strategy,
    llmAgentId,
    llmAgentIds: enabledLlmAgents,
    azureOpenAi: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || DEFAULT_OPENAI_API_VERSION,
      apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY,
      authMode: normalizeAuthMode(process.env.AZURE_OPENAI_AUTH_MODE),
      timeoutMs: parseTimeout(process.env.QA_LLM_TIMEOUT_MS),
    },
  }
}

function canUseAzureOpenAi(config) {
  const azureOpenAi = config?.azureOpenAi || {}
  return Boolean(azureOpenAi.endpoint && azureOpenAi.deployment)
}

function isLlmAgentEnabled(config, agentId) {
  return (config?.llmAgentIds || []).includes(String(agentId || '').trim().toLowerCase())
}

function getAzureOpenAiConfigForAgent(config, agentId) {
  const normalizedAgentId = String(agentId || '').trim().toLowerCase()
  const envToken = toEnvToken(normalizedAgentId)
  const baseConfig = config?.azureOpenAi || {}

  return {
    endpoint: process.env[`AZURE_OPENAI_ENDPOINT_${envToken}`] || baseConfig.endpoint,
    deployment: process.env[`AZURE_OPENAI_DEPLOYMENT_${envToken}`] || baseConfig.deployment,
    apiVersion: process.env[`AZURE_OPENAI_API_VERSION_${envToken}`] || baseConfig.apiVersion,
    apiKey: process.env[`AZURE_OPENAI_API_KEY_${envToken}`] || process.env[`AZURE_OPENAI_KEY_${envToken}`] || baseConfig.apiKey,
    authMode: normalizeAuthMode(process.env[`AZURE_OPENAI_AUTH_MODE_${envToken}`] || baseConfig.authMode),
    timeoutMs: parseTimeout(process.env[`QA_LLM_TIMEOUT_MS_${envToken}`]) || baseConfig.timeoutMs,
  }
}

function getAzureOpenAiInsightMetadata(azureOpenAiConfig) {
  return {
    provider: 'azure-openai',
    endpoint: azureOpenAiConfig?.endpoint || null,
    endpoint_host: toEndpointHost(azureOpenAiConfig?.endpoint),
    deployment: azureOpenAiConfig?.deployment || null,
    auth_mode: azureOpenAiConfig?.authMode || 'auto',
  }
}

module.exports = {
  getQaAgentConfig,
  canUseAzureOpenAi,
  isLlmAgentEnabled,
  getAzureOpenAiConfigForAgent,
  getAzureOpenAiInsightMetadata,
}