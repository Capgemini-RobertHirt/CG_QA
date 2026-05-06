import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './ProposalDetailPage.css';

function formatAgentValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Not configured';
  }

  return String(value);
}

function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [proposal, setProposal] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
                              <dd>{formatAgentValue(agent.insights?.endpoint_host)}</dd>
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
                              <p>{agent.insights.fallbackReason}</p>
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

