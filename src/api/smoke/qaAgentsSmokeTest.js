'use strict'

const { analyzeDocumentAgainstTemplate } = require('../lib/analysisEngine')

function buildTemplate() {
  return {
    name: 'Proposal Template',
    structure: {
      toc: { required: true },
      cross_references: {
        figures_numbered: true,
        tables_numbered: true,
      },
      sections: {
        required: ['Executive Summary', 'Solution Overview', 'Pricing'],
        optional: ['Timeline', 'Conclusion'],
      },
      legoBlocks: {},
    },
  }
}

function buildDocument() {
  return [
    'Table of Contents',
    'Executive Summary',
    'This proposal summarizes the recommended delivery approach.',
    'Solution Overview',
    'Figure 1 shows the transition architecture and delivery model.',
    'Timeline',
    'Table 1 lists the milestone sequence and owners.',
    'Pricing',
    'The total contract value is $250,000 with phased delivery.',
    'Conclusion',
    'The proposed approach aligns with the target operating model.',
  ].join('\n\n')
}

async function main() {
  const result = await analyzeDocumentAgainstTemplate({
    sampleId: 'smoke-sample',
    fileName: 'smoke-test.docx',
    entityType: 'proposal',
    documentType: 'proposal',
    documentContent: buildDocument(),
    template: buildTemplate(),
  })

  const summary = result.agent_reports.map((agent) => ({
    id: agent.id,
    strategy: agent.strategy,
    provider: agent.insights?.provider || null,
    endpoint_host: agent.insights?.endpoint_host || null,
    deployment: agent.insights?.deployment || null,
    auth_mode: agent.insights?.auth_mode || null,
    fallbackReason: agent.insights?.fallbackReason || null,
  }))

  console.log(JSON.stringify({
    overall_score: result.overall_score,
    agents: summary,
    recommendations: result.recommendations,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})