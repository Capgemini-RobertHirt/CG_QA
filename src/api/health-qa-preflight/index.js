'use strict'

const { runQaAgentPreflight, runQaAgentPreflightProbe } = require('../lib/qaAgents/preflight')

module.exports = async function qaAgentPreflight(context, req) {
  const requestedProbeMode = String(req?.query?.probe || '').trim().toLowerCase()
  const probeMode = requestedProbeMode === 'auth' || requestedProbeMode === 'live' ? requestedProbeMode : null
  const preflight = probeMode
    ? await runQaAgentPreflightProbe({ probeMode })
    : runQaAgentPreflight()

  context.res = {
    status: preflight.ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: preflight.ok ? 'ok' : 'degraded',
      ...preflight,
      timestamp: new Date().toISOString(),
    }),
  }
}