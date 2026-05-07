import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './ProposalDetailPage.css';

type DocumentSection = { key: string; title: string; content: string };

type ReviewItem = {
  id: string;
  title: string;
  summary: string;
  severity: string;
  dimension: string;
  issueType: string;
  expected: string | null;
  rule: string | null;
  agentName: string | null;
  relatedSections: string[];
};

type HighlightType = 'standard' | 'component' | 'section' | 'context';

type HighlightTerm = {
  value: string;
  type: HighlightType;
};

function normalizeSectionKey(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toDisplayLabel(value: unknown) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAgentValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Not configured';
  }

  return String(value);
}

function maskEndpointLabel(value: unknown) {
  const host = formatAgentValue(value);
  if (host === 'Not configured') {
    return host;
  }

  if (!import.meta.env.PROD) {
    return host;
  }

  const segments = host.split('.');
  if (segments.length < 3) {
    return 'Azure OpenAI resource';
  }

  const [resourceName, ...domainParts] = segments;
  const visiblePrefix = resourceName.slice(0, 4);
  return `${visiblePrefix}${resourceName.length > 4 ? '***' : ''}.${domainParts.join('.')}`;
}

function formatFallbackReason(value: unknown) {
  const message = formatAgentValue(value);
  if (message === 'Not configured') {
    return message;
  }

  if (!import.meta.env.PROD) {
    return message;
  }

  const normalized = message.toLowerCase();
  const lowSignalPatterns = [
    'fetch failed',
    'access denied due to invalid subscription key',
    'tenant provided in token does not match',
    'timed out',
  ];

  if (lowSignalPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'Azure OpenAI fallback is active. Check backend diagnostics for the provider error.';
  }

  if (message.length > 140) {
    return `${message.slice(0, 137)}...`;
  }

  return message;
}

function extractDocumentSections(documentContent: unknown): DocumentSection[] {
  const content = String(documentContent || '');
  if (!content.trim()) {
    return [];
  }

  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections: Array<{ key: string; title: string; content: string }> = [];
  let currentSection: { key: string; title: string; lines: string[] } | null = null;

  const isHeading = (line: string) => {
    if (line.length > 80) {
      return false;
    }

    if (/[:;]$/.test(line)) {
      return false;
    }

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 8) {
      return false;
    }

    return words.every((word) => /^[A-Z0-9][A-Za-z0-9/-]*$/.test(word));
  };

  lines.forEach((line) => {
    if (isHeading(line)) {
      if (currentSection) {
        sections.push({
          key: currentSection.key,
          title: currentSection.title,
          content: currentSection.lines.join(' ').trim(),
        });
      }

      currentSection = {
        key: normalizeSectionKey(line),
        title: line,
        lines: [],
      };
      return;
    }

    if (!currentSection) {
      currentSection = {
        key: 'document_overview',
        title: 'Document Overview',
        lines: [],
      };
    }

    currentSection.lines.push(line);
  });

  if (currentSection) {
    sections.push({
      key: currentSection.key,
      title: currentSection.title,
      content: currentSection.lines.join(' ').trim(),
    });
  }

  return sections;
}

function buildReviewItems(analysis: any): ReviewItem[] {
  const findingsFromAgents = (analysis?.agent_reports || []).flatMap((agent: any) =>
    (agent.findings || []).map((finding: any, index: number) => ({
      id: `${agent.id || 'agent'}-${index}-${finding.issue_type || finding.message}`,
      title: finding.expected || finding.message,
      summary: finding.message,
      severity: finding.severity || 'minor',
      dimension: finding.dimension || 'content',
      issueType: finding.issue_type || 'review-item',
      expected: finding.expected || null,
      rule: finding.rule || null,
      agentName: agent.name,
      relatedSections: (finding.related_sections || [finding.section]).filter(Boolean),
    }))
  );

  if (findingsFromAgents.length > 0) {
    return findingsFromAgents;
  }

  return (analysis?.findings || []).map((finding: any, index: number) => ({
    id: `finding-${index}-${finding.issue_type || finding.message}`,
    title: finding.expected || finding.message,
    summary: finding.message,
    severity: finding.severity || 'minor',
    dimension: finding.dimension || 'content',
    issueType: finding.issue_type || 'review-item',
    expected: finding.expected || null,
    rule: finding.rule || null,
    agentName: null,
    relatedSections: (finding.related_sections || [finding.section]).filter(Boolean),
  }));
}

function getRelatedSectionCards(reviewItem: ReviewItem, documentSections: DocumentSection[]) {
  const normalizedTargets = (reviewItem.relatedSections || []).map((section: string) => normalizeSectionKey(section));
  const matches = documentSections.filter((section) =>
    normalizedTargets.some((target: string) => target && (section.key.includes(target) || target.includes(section.key)))
  );

  if (matches.length > 0) {
    return matches;
  }

  return normalizedTargets.map((target: string) => ({
    key: target || reviewItem.id,
    title: toDisplayLabel(target || 'section_to_review'),
    content: 'This section was not detected directly in the uploaded document text. Review the document structure and headings manually.',
  }));
}

function toPreviewSectionId(sectionKey: string) {
  return `review-preview-${normalizeSectionKey(sectionKey) || 'section'}`;
}

function groupReviewItems(reviewItems: ReviewItem[], groupBy: string) {
  if (groupBy === 'none') {
    return [{ label: 'All Issues', items: reviewItems }];
  }

  const grouped = new Map<string, ReviewItem[]>();

  reviewItems.forEach((item) => {
    let keys: string[] = [];

    if (groupBy === 'severity') {
      keys = [item.severity || 'unclassified'];
    } else if (groupBy === 'agent') {
      keys = [item.agentName || 'Unassigned'];
    } else if (groupBy === 'section') {
      keys = item.relatedSections.length > 0 ? item.relatedSections : ['section_to_review'];
    }

    keys.forEach((key) => {
      const bucket = grouped.get(key) || [];
      bucket.push(item);
      grouped.set(key, bucket);
    });
  });

  return Array.from(grouped.entries()).map(([label, items]) => ({
    label: groupBy === 'section' ? toDisplayLabel(label) : toDisplayLabel(label),
    items,
  }));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightTerms(reviewItem: ReviewItem | null) {
  if (!reviewItem) {
    return [] as HighlightTerm[];
  }

  const terms = new Map<string, HighlightType>();
  const addTerm = (value: unknown, type: HighlightType) => {
    const normalizedValue = String(value || '').trim();
    if (normalizedValue.length <= 2) {
      return;
    }

    const normalizedKey = normalizedValue.toLowerCase();
    if (!terms.has(normalizedKey)) {
      terms.set(normalizedKey, type);
    }
  };

  const normalizedAgentName = String(reviewItem.agentName || '').toLowerCase();
  const normalizedIssueType = String(reviewItem.issueType || '').toLowerCase();
  const expectedType: HighlightType = normalizedAgentName.includes('structure') || normalizedIssueType.includes('section')
    ? 'section'
    : 'component';

  if (reviewItem.expected) {
    addTerm(reviewItem.expected, expectedType);
  }

  if (reviewItem.rule) {
    addTerm(toDisplayLabel(reviewItem.rule), 'standard');
    addTerm(String(reviewItem.rule).replace(/_/g, ' '), 'standard');
  }

  reviewItem.relatedSections.forEach((section) => {
    addTerm(toDisplayLabel(section), 'section');
    addTerm(String(section).replace(/_/g, ' '), 'section');
  });

  reviewItem.summary
    .split(/[^A-Za-z0-9]+/)
    .filter((token) => token.length > 4)
    .slice(0, 4)
    .forEach((token) => addTerm(token, 'context'));

  return Array.from(terms.entries())
    .map(([value, type]) => ({ value, type }))
    .sort((left, right) => right.value.length - left.value.length);
}

function renderHighlightedText(text: string, highlightTerms: HighlightTerm[]) {
  if (!text) {
    return text;
  }

  const usableTerms = highlightTerms.filter((term) => term.value);
  if (usableTerms.length === 0) {
    return text;
  }

  const highlightTypeByValue = new Map(usableTerms.map((term) => [term.value.toLowerCase(), term.type]));
  const pattern = new RegExp(`(${usableTerms.map((term) => escapeRegExp(term.value)).join('|')})`, 'gi');
  const segments = text.split(pattern);

  return segments.map((segment, index) => {
    const highlightType = highlightTypeByValue.get(segment.toLowerCase());
    if (!highlightType) {
      return <React.Fragment key={`segment-${index}`}>{segment}</React.Fragment>;
    }

    return (
      <mark key={`segment-${index}`} className={`preview-highlight preview-highlight-${highlightType}`}>
        {segment}
      </mark>
    );
  });
}

function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [proposal, setProposal] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReviewItemId, setSelectedReviewItemId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [activePreviewSectionKey, setActivePreviewSectionKey] = useState<string | null>(null);

  useEffect(() => {
    const loadProposalDetails = async () => {
      try {
        if (!id) {
          console.warn('No proposal ID provided');
          setLoading(false);
          return;
        }

        console.log('Loading proposal with ID:', id);

        // Load proposal details
        const proposalResponse = await api.getProposal(id);
        console.log('Proposal response:', proposalResponse);
        const proposalData = proposalResponse.data;
        console.log('Proposal data:', proposalData);
        setProposal(proposalData);

        // Load analysis results if analysis_id exists
        if (proposalData?.analysis_id) {
          try {
            console.log('Loading analysis with ID:', proposalData.analysis_id);
            const analysisResponse = await api.getAnalysis(proposalData.analysis_id);
            console.log('Analysis data:', analysisResponse.data);
            setAnalysis(analysisResponse.data);
          } catch (error) {
            console.warn('Could not load analysis:', error);
          }
        }
      } catch (error) {
        console.error('Error loading proposal details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposalDetails();
  }, [id]);

  const documentSections = extractDocumentSections(proposal?.file_content || analysis?.document_excerpt || '');
  const reviewItems = buildReviewItems(analysis);
  const availableSeverities = Array.from(new Set(reviewItems.map((item) => item.severity))).filter(Boolean);
  const availableAgents = Array.from(new Set(reviewItems.map((item) => item.agentName).filter(Boolean)));
  const availableSections = Array.from(
    new Set(reviewItems.flatMap((item) => item.relatedSections).filter(Boolean).map((section) => normalizeSectionKey(section)))
  );
  const filteredReviewItems = reviewItems.filter((item) => {
    const severityMatches = severityFilter === 'all' || item.severity === severityFilter;
    const agentMatches = agentFilter === 'all' || item.agentName === agentFilter;
    const sectionMatches =
      sectionFilter === 'all' ||
      item.relatedSections.some((section) => normalizeSectionKey(section) === sectionFilter);
    return severityMatches && agentMatches && sectionMatches;
  });
  const groupedReviewItems = groupReviewItems(filteredReviewItems, groupBy);
  const selectedReviewItem = filteredReviewItems.find((item: any) => item.id === selectedReviewItemId) || filteredReviewItems[0] || null;
  const selectedSectionCards = selectedReviewItem ? getRelatedSectionCards(selectedReviewItem, documentSections) : [];
  const highlightTerms = buildHighlightTerms(selectedReviewItem);

  const focusPreviewSection = (sectionKey: string) => {
    const normalizedKey = normalizeSectionKey(sectionKey);
    setActivePreviewSectionKey(normalizedKey);
    requestAnimationFrame(() => {
      document.getElementById(toPreviewSectionId(normalizedKey))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  useEffect(() => {
    if (filteredReviewItems.length > 0) {
      setSelectedReviewItemId((current) => current && filteredReviewItems.some((item: any) => item.id === current) ? current : filteredReviewItems[0].id);
      return;
    }

    setSelectedReviewItemId(null);
  }, [analysis, severityFilter, agentFilter, sectionFilter]);

  useEffect(() => {
    if (selectedReviewItem?.relatedSections?.length) {
      setActivePreviewSectionKey(normalizeSectionKey(selectedReviewItem.relatedSections[0]));
    } else {
      setActivePreviewSectionKey(null);
    }
  }, [selectedReviewItemId]);

  if (loading) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="proposal-detail-page">
      <Navigation />
      <div className="page-content">
        <button onClick={() => navigate('/')}>&larr; Back</button>
        <h1>{t('proposals.proposalTitle')}</h1>
        {proposal ? (
          <div className="proposal-details">
            <div className="proposal-info">
              <h2>{proposal.file_name}</h2>
              <p><strong>{t('proposals.status')}:</strong> {proposal.status}</p>
              <p><strong>{t('proposals.template')}:</strong> {proposal.template_type}</p>
              <p><strong>{t('proposals.quality')}:</strong> {proposal.quality_score}%</p>
              <p><strong>{t('proposals.uploadedDate')}:</strong> {new Date(proposal.created_at).toLocaleString()}</p>
            </div>

            {analysis && (
              <div className="analysis-results">
                <h3>{t('proposals.analysisResults')}</h3>
                <div className="scores">
                  <div className="score-item">
                    <label>{t('proposals.structure')}:</label>
                    <span>{analysis.scores?.structure || 0}%</span>
                  </div>
                  <div className="score-item">
                    <label>{t('proposals.design')}:</label>
                    <span>{analysis.scores?.design || 0}%</span>
                  </div>
                  <div className="score-item">
                    <label>{t('proposals.content')}:</label>
                    <span>{analysis.scores?.content || 0}%</span>
                  </div>
                  <div className="score-item">
                    <label>{t('proposals.completeness')}:</label>
                    <span>{analysis.scores?.completeness || 0}%</span>
                  </div>
                  <div className="score-item overall">
                    <label>{t('proposals.overallScore')}:</label>
                    <span>{analysis.overall_score || 0}%</span>
                  </div>
                </div>

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>{t('proposals.recommendations')}:</h4>
                    <ul>
                      {analysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewItems.length > 0 && (
                  <div className="analysis-review-panel">
                    <div className="analysis-review-header">
                      <h4>Interactive Review</h4>
                      <p>Select an issue to see the affected section, expected alignment, and where to review the uploaded document.</p>
                    </div>
                    <div className="analysis-review-controls">
                      <label>
                        Severity
                        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                          <option value="all">All</option>
                          {availableSeverities.map((severity) => (
                            <option key={severity} value={severity}>{toDisplayLabel(severity)}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Agent
                        <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
                          <option value="all">All</option>
                          {availableAgents.map((agent) => (
                            <option key={agent} value={String(agent)}>{agent}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Section
                        <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
                          <option value="all">All</option>
                          {availableSections.map((section) => (
                            <option key={section} value={section}>{toDisplayLabel(section)}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Group By
                        <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                          <option value="none">None</option>
                          <option value="severity">Severity</option>
                          <option value="agent">Agent</option>
                          <option value="section">Section</option>
                        </select>
                      </label>
                    </div>
                    {filteredReviewItems.length > 0 && selectedReviewItem ? (
                    <div className="analysis-review-layout">
                      <div className="review-issue-list">
                        {groupedReviewItems.map((group) => (
                          <div key={group.label} className="review-group">
                            {groupBy !== 'none' && <h5 className="review-group-title">{group.label}</h5>}
                            {group.items.map((item: any) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`review-issue-button ${selectedReviewItem.id === item.id ? 'is-active' : ''}`}
                                onClick={() => setSelectedReviewItemId(item.id)}
                              >
                                <span className={`review-severity-badge severity-${String(item.severity).toLowerCase()}`}>{item.severity}</span>
                                <strong>{item.title}</strong>
                                <span>{item.summary}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="review-detail-card">
                        <div className="review-detail-meta">
                          <span className={`review-severity-badge severity-${String(selectedReviewItem.severity).toLowerCase()}`}>
                            {selectedReviewItem.severity}
                          </span>
                          <span>{toDisplayLabel(selectedReviewItem.dimension)}</span>
                          {selectedReviewItem.agentName && <span>{selectedReviewItem.agentName}</span>}
                        </div>
                        <h5>{selectedReviewItem.title}</h5>
                        <p>{selectedReviewItem.summary}</p>
                        {selectedReviewItem.expected && (
                          <div className="review-detail-block">
                            <strong>Expected Alignment</strong>
                            <p>{selectedReviewItem.expected}</p>
                          </div>
                        )}
                        {selectedReviewItem.rule && (
                          <div className="review-detail-block">
                            <strong>Related Standard</strong>
                            <p>{toDisplayLabel(selectedReviewItem.rule)}</p>
                          </div>
                        )}
                        <div className="review-detail-block">
                          <strong>Related Sections</strong>
                          <div className="review-section-links">
                            {selectedSectionCards.map((sectionCard: any) => (
                              <button
                                key={`link-${sectionCard.key}`}
                                type="button"
                                className={`review-section-link ${activePreviewSectionKey === normalizeSectionKey(sectionCard.key) ? 'is-active' : ''}`}
                                onClick={() => focusPreviewSection(sectionCard.key)}
                              >
                                {sectionCard.title}
                              </button>
                            ))}
                          </div>
                          <div className="review-related-sections">
                            {selectedSectionCards.map((sectionCard: any) => (
                              <article key={sectionCard.key} className="review-section-card">
                                <h6>{sectionCard.title}</h6>
                                <p>{sectionCard.content || 'No document text was extracted for this section.'}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                        <div className="review-detail-block">
                          <strong>Document Preview</strong>
                          <div className="document-preview-legend" aria-label="Preview highlight legend">
                            <span className="document-preview-legend-item">
                              <span className="preview-highlight preview-highlight-standard">Standard</span>
                            </span>
                            <span className="document-preview-legend-item">
                              <span className="preview-highlight preview-highlight-component">Component</span>
                            </span>
                            <span className="document-preview-legend-item">
                              <span className="preview-highlight preview-highlight-section">Section</span>
                            </span>
                            <span className="document-preview-legend-item">
                              <span className="preview-highlight preview-highlight-context">Context</span>
                            </span>
                          </div>
                          <div className="document-preview-panel">
                            {(documentSections.length > 0 ? documentSections : selectedSectionCards).map((sectionCard: any) => {
                              const sectionKey = normalizeSectionKey(sectionCard.key || sectionCard.title);
                              const isRelated = selectedReviewItem.relatedSections.some((section: string) => normalizeSectionKey(section) === sectionKey);
                              const isActive = activePreviewSectionKey === sectionKey;
                              return (
                                <article
                                  key={`preview-${sectionKey}`}
                                  id={toPreviewSectionId(sectionKey)}
                                  className={`document-preview-section ${isRelated ? 'is-related' : ''} ${isActive ? 'is-active' : ''}`}
                                >
                                  <div className="document-preview-header">
                                    <h6>{sectionCard.title}</h6>
                                    {isRelated && <span className="document-preview-tag">Related</span>}
                                  </div>
                                  <p>{renderHighlightedText(sectionCard.content || 'No extracted text was available for this section.', highlightTerms)}</p>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                      <div className="review-empty-state">
                        No issues match the current filters.
                      </div>
                    )}
                  </div>
                )}

                {analysis.agent_reports && analysis.agent_reports.length > 0 && (
                  <div className="agent-insights">
                    <h4>QA Agent Insights:</h4>
                    <div className="agent-insight-grid">
                      {analysis.agent_reports.map((agent: any) => (
                        <article key={agent.id} className="agent-insight-card">
                          <div className="agent-insight-header">
                            <strong>{agent.name}</strong>
                            <span className={`agent-strategy-badge strategy-${String(agent.strategy || 'heuristic').toLowerCase()}`}>
                              {formatAgentValue(agent.strategy)}
                            </span>
                          </div>
                          <p className="agent-summary">{agent.summary}</p>
                          <dl className="agent-meta-list">
                            <div>
                              <dt>Provider</dt>
                              <dd>{formatAgentValue(agent.insights?.provider)}</dd>
                            </div>
                            <div>
                              <dt>Endpoint</dt>
                              <dd>{maskEndpointLabel(agent.insights?.endpoint_host)}</dd>
                            </div>
                            <div>
                              <dt>Deployment</dt>
                              <dd>{formatAgentValue(agent.insights?.deployment)}</dd>
                            </div>
                            <div>
                              <dt>Auth</dt>
                              <dd>{formatAgentValue(agent.insights?.auth_mode)}</dd>
                            </div>
                          </dl>
                          {agent.findings?.length > 0 && (
                            <div className="agent-findings">
                              <strong>Findings</strong>
                              <ul>
                                {agent.findings.slice(0, 3).map((finding: any, index: number) => (
                                  <li key={`${agent.id}-finding-${index}`}>{finding.message}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {agent.insights?.fallbackReason && (
                            <div className="agent-fallback-reason">
                              <strong>Fallback</strong>
                              <p>{formatFallbackReason(agent.insights.fallbackReason)}</p>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>{t('proposals.noProposals')}</p>
        )}
      </div>
    </div>
  );
}

export default ProposalDetailPage;

