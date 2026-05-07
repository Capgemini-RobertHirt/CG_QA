'use strict'

const { normalizeText } = require('./shared')
const { getQaAgentConfig, canUseAzureOpenAi, isLlmAgentEnabled, getAzureOpenAiConfigForAgent, getAzureOpenAiInsightMetadata } = require('./config')
const { requestJsonChatCompletion } = require('./providers/azureOpenAI')

function buildPowerPointLayoutInsights(documentModel) {
  const slides = Array.isArray(documentModel?.slides) ? documentModel.slides : []
  if (documentModel?.fileType !== 'pptx' || slides.length === 0) {
    return {
      findings: [],
      scoreAdjustments: { design: 0, compliance: 0 },
      insights: {},
    }
  }

  const findings = []
  let designPenalty = 0
  let compliancePenalty = 0

  const slidesMissingTitlePlaceholder = slides.filter((slide) => !slide.hasTitlePlaceholder)
  slidesMissingTitlePlaceholder.slice(0, 4).forEach((slide) => {
    designPenalty += 4
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: `Slide ${slide.slideNumber} does not expose a title placeholder, which weakens layout consistency and navigation.`,
      rule: 'title-placeholder-present',
      issue_type: 'powerpoint-layout-standard',
      expected: 'Slide title placeholder',
      related_sections: [slide.sectionKey],
    })
  })

  const slidesMissingTitleText = slides.filter((slide) => slide.hasTitlePlaceholder && !slide.hasTitleText)
  slidesMissingTitleText.slice(0, 4).forEach((slide) => {
    designPenalty += 5
    findings.push({
      dimension: 'structure',
      severity: 'major',
      message: `Slide ${slide.slideNumber} has a title placeholder but no visible title text.`,
      rule: 'title-placeholder-populated',
      issue_type: 'powerpoint-layout-standard',
      expected: 'Visible slide title',
      related_sections: [slide.sectionKey],
    })
  })

  const uniqueThemes = documentModel?.presentation?.uniqueThemes || []
  if (uniqueThemes.length > 1) {
    designPenalty += 10
    compliancePenalty += 6
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: `The deck references ${uniqueThemes.length} different PowerPoint themes, which suggests inconsistent master usage.`,
      rule: 'single-theme-per-deck',
      issue_type: 'powerpoint-theme-consistency',
      expected: 'Single deck theme',
      related_sections: slides.slice(0, 3).map((slide) => slide.sectionKey),
    })
  }

  const uniqueMasters = documentModel?.presentation?.uniqueMasters || []
  if (uniqueMasters.length > 1) {
    designPenalty += 8
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: `The deck uses ${uniqueMasters.length} slide masters. Proposal decks usually need a single master family unless there is a deliberate appendix variant.`,
      rule: 'single-master-family',
      issue_type: 'powerpoint-master-consistency',
      expected: 'Single master family',
      related_sections: slides.slice(0, 3).map((slide) => slide.sectionKey),
    })
  }

  const explicitFonts = documentModel?.presentation?.explicitFonts || []
  const slidesWithMultipleFonts = slides.filter((slide) => slide.explicitFonts.length > 2)
  if (explicitFonts.length > 3) {
    designPenalty += 10
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: `The deck uses ${explicitFonts.length} explicit font families, which is high for a proposal response and usually indicates inconsistent typography.`,
      rule: 'font-family-consistency',
      issue_type: 'powerpoint-font-consistency',
      expected: 'Limited font family set',
      related_sections: slidesWithMultipleFonts.slice(0, 3).map((slide) => slide.sectionKey),
    })
  }

  slidesWithMultipleFonts.slice(0, 3).forEach((slide) => {
    designPenalty += 3
    findings.push({
      dimension: 'design',
      severity: 'advisory',
      message: `Slide ${slide.slideNumber} mixes ${slide.explicitFonts.length} explicit font families.`,
      rule: 'slide-font-consistency',
      issue_type: 'powerpoint-font-consistency',
      expected: 'Single slide font family set',
      related_sections: [slide.sectionKey],
    })
  })

  const denseSlides = slides.filter((slide) => slide.wordCount > 120 || slide.shapeCount > 18 || slide.textBoxCount > 12)
  denseSlides.slice(0, 4).forEach((slide) => {
    designPenalty += slide.wordCount > 170 ? 6 : 3
    findings.push({
      dimension: 'design',
      severity: slide.wordCount > 170 ? 'major' : 'minor',
      message: `Slide ${slide.slideNumber} appears dense with ${slide.wordCount} words and ${slide.shapeCount} shapes, which may reduce executive readability.`,
      rule: 'dense-slide-heuristic',
      issue_type: 'powerpoint-density',
      expected: 'Readable slide density',
      related_sections: [slide.sectionKey],
    })
  })

  return {
    findings,
    scoreAdjustments: {
      design: designPenalty,
      compliance: compliancePenalty,
    },
    insights: {
      slideCount: slides.length,
      uniqueThemes,
      uniqueMasters,
      explicitFonts,
      slidesMissingTitlePlaceholder: slidesMissingTitlePlaceholder.map((slide) => slide.slideNumber),
      slidesMissingTitleText: slidesMissingTitleText.map((slide) => slide.slideNumber),
      denseSlides: denseSlides.map((slide) => slide.slideNumber),
    },
  }
}

function buildHeuristicStandardsReport({ documentContent, template }) {
  const content = normalizeText(documentContent)
  const findings = []
  let designScore = 78
  let complianceScore = 82

  if (template?.structure?.toc?.required && !content.includes('table of contents')) {
    designScore -= 15
    findings.push({
      dimension: 'design',
      severity: 'minor',
      message: 'Table of contents is required by the template but was not detected.',
      rule: 'table-of-contents',
      issue_type: 'missing-standard',
      expected: 'Table of Contents',
      related_sections: ['table_of_contents'],
    })
  }

  if (template?.structure?.cross_references?.figures_numbered && content.includes('figure') && !/figure\s+\d+/i.test(documentContent)) {
    complianceScore -= 10
    findings.push({
      dimension: 'compliance',
      severity: 'minor',
      message: 'Figures appear to be referenced without numbering, which conflicts with the template standard.',
      rule: 'figures-numbered',
      issue_type: 'formatting-standard',
      expected: 'Numbered figures',
      related_sections: ['figures'],
    })
  }

  if (template?.structure?.cross_references?.tables_numbered && content.includes('table') && !/table\s+\d+/i.test(documentContent)) {
    complianceScore -= 10
    findings.push({
      dimension: 'compliance',
      severity: 'minor',
      message: 'Tables appear to be referenced without numbering, which conflicts with the template standard.',
      rule: 'tables-numbered',
      issue_type: 'formatting-standard',
      expected: 'Numbered tables',
      related_sections: ['tables'],
    })
  }

  return {
    summary: 'Checked structural standards, navigation requirements, and cross-reference rules against the selected template.',
    scores: {
      design: Math.max(0, Math.min(100, designScore)),
      compliance: Math.max(0, Math.min(100, complianceScore)),
    },
    findings,
    insights: {
      tocRequired: Boolean(template?.structure?.toc?.required),
      figureNumberingRequired: Boolean(template?.structure?.cross_references?.figures_numbered),
      tableNumberingRequired: Boolean(template?.structure?.cross_references?.tables_numbered),
    },
  }
}

function truncateText(value, maxLength) {
  const text = String(value || '')
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}\n\n[truncated]`
}

function buildStandardsPrompt({ documentContent, template, heuristicReport }) {
  return {
    systemPrompt: [
      'You are a proposal QA reviewer specializing in document standards and compliance.',
      'Return strict JSON with keys: summary, scores, findings.',
      'scores must be an object with integer design and compliance values from 0 to 100.',
      'findings must be an array of up to 4 objects with keys severity, dimension, message.',
      'Focus on table of contents, numbering, references, formatting standards, and structural navigation quality.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        task: 'Assess the document against the template standards and compliance expectations.',
        templateStandards: {
          tocRequired: Boolean(template?.structure?.toc?.required),
          figureNumberingRequired: Boolean(template?.structure?.cross_references?.figures_numbered),
          tableNumberingRequired: Boolean(template?.structure?.cross_references?.tables_numbered),
        },
        heuristicBaseline: {
          summary: heuristicReport.summary,
          scores: heuristicReport.scores,
          findings: heuristicReport.findings,
        },
        documentExcerpt: truncateText(documentContent, 12000),
      },
      null,
      2
    ),
  }
}

function normalizeScore(value, fallback) {
  const numeric = Number.parseInt(value, 10)
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric))
  }
  return fallback
}

function normalizeFindings(findings, fallbackFindings) {
  if (!Array.isArray(findings)) {
    return fallbackFindings
  }

  const normalizedFindings = findings
    .filter((finding) => finding && typeof finding.message === 'string')
    .map((finding) => ({
      severity: finding.severity || 'minor',
      dimension: finding.dimension || 'compliance',
      message: finding.message.trim(),
    }))

  return normalizedFindings.length > 0 ? normalizedFindings : fallbackFindings
}

async function runStandardsAgent({ documentContent, documentModel, template }) {
  const heuristicReport = buildHeuristicStandardsReport({ documentContent, template })
  const powerpointLayoutReport = buildPowerPointLayoutInsights(documentModel)
  const mergedHeuristicReport = {
    summary:
      powerpointLayoutReport.findings.length > 0
        ? `${heuristicReport.summary} Evaluated native PowerPoint slide layout, theme, typography, and density signals.`
        : heuristicReport.summary,
    scores: {
      design: Math.max(0, Math.min(100, heuristicReport.scores.design - powerpointLayoutReport.scoreAdjustments.design)),
      compliance: Math.max(0, Math.min(100, heuristicReport.scores.compliance - powerpointLayoutReport.scoreAdjustments.compliance)),
    },
    findings: [...heuristicReport.findings, ...powerpointLayoutReport.findings],
    insights: {
      ...heuristicReport.insights,
      powerpoint: powerpointLayoutReport.insights,
    },
  }
  const qaConfig = getQaAgentConfig()
  const azureOpenAiConfig = getAzureOpenAiConfigForAgent(qaConfig, 'standards-agent')
  const shouldAttemptLlm =
    isLlmAgentEnabled(qaConfig, 'standards-agent') &&
    qaConfig.strategy !== 'heuristic' &&
    canUseAzureOpenAi({ azureOpenAi: azureOpenAiConfig })

  if (shouldAttemptLlm) {
    try {
      const prompt = buildStandardsPrompt({ documentContent, template, heuristicReport: mergedHeuristicReport })
      const completion = await requestJsonChatCompletion({
        ...azureOpenAiConfig,
        ...prompt,
      })
      const payload = completion.payload

      return {
        id: 'standards-agent',
        name: 'Standards Agent',
        strategy: qaConfig.strategy === 'llm' ? 'llm' : 'hybrid',
        summary:
          typeof payload?.summary === 'string' && payload.summary.trim().length > 0
            ? payload.summary.trim()
            : mergedHeuristicReport.summary,
        scores: {
          design: normalizeScore(payload?.scores?.design, mergedHeuristicReport.scores.design),
          compliance: normalizeScore(payload?.scores?.compliance, mergedHeuristicReport.scores.compliance),
        },
        findings: normalizeFindings(payload?.findings, mergedHeuristicReport.findings),
        insights: {
          ...mergedHeuristicReport.insights,
          ...getAzureOpenAiInsightMetadata({
            ...azureOpenAiConfig,
            authMode: completion.authMode,
          }),
        },
      }
    } catch (error) {
      return {
        id: 'standards-agent',
        name: 'Standards Agent',
        strategy: 'heuristic',
        summary: mergedHeuristicReport.summary,
        scores: mergedHeuristicReport.scores,
        findings: mergedHeuristicReport.findings,
        insights: {
          ...mergedHeuristicReport.insights,
          fallbackReason: error.message,
          ...getAzureOpenAiInsightMetadata(azureOpenAiConfig),
        },
      }
    }
  }

  return {
    id: 'standards-agent',
    name: 'Standards Agent',
    strategy: 'heuristic',
    summary: mergedHeuristicReport.summary,
    scores: mergedHeuristicReport.scores,
    findings: mergedHeuristicReport.findings,
    insights: mergedHeuristicReport.insights,
  }
}

module.exports = {
  runStandardsAgent,
}