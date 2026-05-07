'use strict'

const { DefaultAzureCredential } = require('@azure/identity')

const AZURE_OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default'

function buildEndpointUrl({ endpoint, deployment, apiVersion }) {
  const normalizedEndpoint = String(endpoint || '').replace(/\/$/, '')
  const encodedDeployment = encodeURIComponent(deployment)
  const encodedVersion = encodeURIComponent(apiVersion)
  return `${normalizedEndpoint}/openai/deployments/${encodedDeployment}/chat/completions?api-version=${encodedVersion}`
}

function extractJsonBlock(content) {
  if (!content) {
    return ''
  }

  const trimmed = String(content).trim()
  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fencedMatch) {
    return fencedMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

async function getAuthorizationHeaders({ apiKey, authMode }) {
  if (authMode === 'api-key') {
    if (!apiKey) {
      throw new Error('Azure OpenAI authentication failed: auth mode is api-key but no API key is configured')
    }

    return {
      headers: {
        'api-key': apiKey,
      },
      authMode: 'api-key',
    }
  }

  if (authMode === 'auto' && apiKey) {
    return {
      headers: {
        'api-key': apiKey,
      },
      authMode: 'api-key',
    }
  }

  const credential = new DefaultAzureCredential()
  const token = await credential.getToken(AZURE_OPENAI_SCOPE)
  if (!token?.token) {
    throw new Error('Azure OpenAI authentication failed: no access token available')
  }

  return {
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
    authMode: 'managed-identity',
  }
}

async function requestJsonChatCompletion({ endpoint, deployment, apiVersion, apiKey, authMode, timeoutMs, systemPrompt, userPrompt }) {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const authorization = await getAuthorizationHeaders({ apiKey, authMode })
    const response = await fetch(buildEndpointUrl({ endpoint, deployment, apiVersion }), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorization.headers,
      },
      body: JSON.stringify({
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI request failed with ${response.status}: ${errorText}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    const jsonBlock = extractJsonBlock(content)
    return {
      payload: JSON.parse(jsonBlock),
      authMode: authorization.authMode,
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Azure OpenAI request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function probeAzureOpenAi({ endpoint, deployment, apiVersion, apiKey, authMode, timeoutMs, mode }) {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const authorization = await getAuthorizationHeaders({ apiKey, authMode })

    if (mode === 'auth') {
      return {
        ok: true,
        authMode: authorization.authMode,
        probeMode: 'auth',
        message: 'Authentication headers acquired successfully.',
      }
    }

    const response = await fetch(buildEndpointUrl({ endpoint, deployment, apiVersion }), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorization.headers,
      },
      body: JSON.stringify({
        temperature: 0,
        max_tokens: 16,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Return strict JSON with a single key ok set to true.' },
          { role: 'user', content: 'Respond with {"ok": true}.' },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI request failed with ${response.status}: ${errorText}`)
    }

    return {
      ok: true,
      authMode: authorization.authMode,
      probeMode: 'live',
      message: 'Live Azure OpenAI probe succeeded.',
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Azure OpenAI probe timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutHandle)
  }
}

module.exports = {
  requestJsonChatCompletion,
  probeAzureOpenAi,
}