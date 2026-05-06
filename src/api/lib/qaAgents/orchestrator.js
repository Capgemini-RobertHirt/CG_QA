'use strict'

const { runStructureAgent } = require('./structureAgent')
const { runComponentAgent } = require('./componentAgent')
const { runStandardsAgent } = require('./standardsAgent')
const { runRecommendationAgent } = require('./recommendationAgent')

function weightedAverage(values) {
  const present = values.filter((value) => typeof value === 'number')
  if (present.length === 0) {
    return 0
  }
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length)
}

async function runQualityAssuranceAgents(input) {
  const structureReport = await runStructureAgent(input)
  const componentReport = runComponentAgent(input)
  const standardsReport = await runStandardsAgent(input)
  const recommendationReport = await runRecommendationAgent({
    ...input,
    agentReports: [structureReport, componentReport, standardsReport],
  })

  const agentReports = [structureReport, componentReport, standardsReport, recommendationReport]
  const scores = {
    structure: structureReport.scores.structure,
    design: standardsReport.scores.design,
    content: componentReport.scores.content,
    completeness: structureReport.scores.completeness,
    compliance: standardsReport.scores.compliance,
  }

  const overallScore = weightedAverage([
    scores.structure,
    scores.design,
    scores.content,
    scores.completeness,
    scores.compliance,
  ])

  return {
    agent_reports: agentReports,
    scores,
    overall_score: overallScore,
    findings: [
      ...structureReport.findings,
      ...componentReport.findings,
      ...standardsReport.findings,
    ],
    recommendations: recommendationReport.recommendations,
  }
}

module.exports = {
  runQualityAssuranceAgents,
}