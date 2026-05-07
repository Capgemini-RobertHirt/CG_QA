'use strict'

const { runQualityAssuranceAgents } = require('./qaAgents/orchestrator')

async function analyzeDocumentAgainstTemplate({ sampleId, fileName, entityType, documentType, documentContent, documentModel, template }) {
  const orchestrationResult = await runQualityAssuranceAgents({
    sampleId,
    fileName,
    entityType,
    documentType,
    documentContent,
    documentModel,
    template,
  })

  return {
    sample_id: sampleId,
    entity_type: entityType,
    document_type: documentType,
    file_name: fileName,
    scores: orchestrationResult.scores,
    overall_score: orchestrationResult.overall_score,
    recommendations: orchestrationResult.recommendations,
    findings: orchestrationResult.findings,
    agent_reports: orchestrationResult.agent_reports,
    annotations: documentModel?.annotations || [],
    heatmap: documentModel?.heatmap || null,
    document_excerpt: documentContent,
    created_at: new Date().toISOString(),
  }
}

module.exports = {
  analyzeDocumentAgainstTemplate,
}