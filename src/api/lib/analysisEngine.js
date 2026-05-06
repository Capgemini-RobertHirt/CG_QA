'use strict'

const { runQualityAssuranceAgents } = require('./qaAgents/orchestrator')

function analyzeDocumentAgainstTemplate({ sampleId, fileName, entityType, documentType, documentContent, template }) {
  const orchestrationResult = runQualityAssuranceAgents({
    sampleId,
    fileName,
    entityType,
    documentType,
    documentContent,
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
    annotations: [],
    heatmap: null,
    created_at: new Date().toISOString(),
  }
}

module.exports = {
  analyzeDocumentAgainstTemplate,
}