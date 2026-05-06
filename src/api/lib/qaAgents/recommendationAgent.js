'use strict'

function runRecommendationAgent({ agentReports }) {
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

  return {
    id: 'recommendation-agent',
    name: 'Recommendation Agent',
    strategy: 'heuristic',
    summary: 'Synthesized the outputs of the specialized QA agents into prioritized next actions.',
    scores: {},
    findings: [],
    recommendations,
    insights: {
      synthesizedFromAgents: agentReports.map((agent) => agent.id),
    },
  }
}

module.exports = {
  runRecommendationAgent,
}