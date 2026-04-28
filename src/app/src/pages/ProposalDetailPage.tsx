<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useTranslation } from 'react-i18next';
import './ProposalDetailPage.css';

function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load proposal details from API
    setLoading(false);
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
            {/* Proposal details will be rendered here */}
          </div>
        ) : (
          <p>{t('proposals.noProposals')}</p>
        )}
      </div>
    </div>
  );
}

export default ProposalDetailPage;
=======
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import { proposalsAPI } from '../services/api';
import './ProposalDetailPage.css';

interface Issue {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
  location?: string;
}

interface ProposalDetail {
  id: string;
  filename: string;
  status: string;
  uploadedAt: string;
  analysisResult?: {
    issues: Issue[];
    score: number;
    summary: string;
  };
}

export default function ProposalDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sortBy, setSortBy] = useState<'severity' | 'category'>('severity');

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await proposalsAPI.get(id);
      setProposal(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  const getSortedIssues = (): Issue[] => {
    if (!proposal?.analysisResult?.issues) return [];
    const issues = [...proposal.analysisResult.issues];

    if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      issues.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);
    } else {
      issues.sort((a, b) => a.category.localeCompare(b.category));
    }

    return issues;
  };

  if (loading) {
    return <div className="proposal-detail"><p>Loading proposal...</p></div>;
  }

  if (error || !proposal) {
    return (
      <div className="proposal-detail">
        <p className="error">{error || 'Proposal not found'}</p>
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
      </div>
    );
  }

  const issues = getSortedIssues();
  const issueCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  return (
    <>
      <Navigation />
      <div className="proposal-detail">
      <button onClick={() => navigate('/')} className="btn-back">
        ← Back to List
      </button>

      <div className="detail-header">
        <h1>{proposal.filename}</h1>
        <p className="uploaded">
          Uploaded: {new Date(proposal.uploadedAt).toLocaleString()}
        </p>
      </div>

      {proposal.analysisResult && (
        <>
          <div className="analysis-summary">
            <div className="score-box">
              <div className="score-value">
                {(proposal.analysisResult.score * 100).toFixed(1)}%
              </div>
              <div className="score-label">Quality Score</div>
            </div>

            <div className="issue-stats">
              <div className={`stat critical`}>
                <span className="count">{issueCounts.critical}</span>
                <span className="label">Critical</span>
              </div>
              <div className={`stat high`}>
                <span className="count">{issueCounts.high}</span>
                <span className="label">High</span>
              </div>
              <div className={`stat medium`}>
                <span className="count">{issueCounts.medium}</span>
                <span className="label">Medium</span>
              </div>
              <div className={`stat low`}>
                <span className="count">{issueCounts.low}</span>
                <span className="label">Low</span>
              </div>
            </div>
          </div>

          {proposal.analysisResult.summary && (
            <div className="summary-section">
              <h3>Summary</h3>
              <p>{proposal.analysisResult.summary}</p>
            </div>
          )}

          <div className="issues-section">
            <div className="issues-header">
              <h3>Issues Found: {issues.length}</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'severity' | 'category')}
                className="sort-select"
              >
                <option value="severity">Sort by Severity</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>

            {issues.length === 0 ? (
              <p className="no-issues">No issues found!</p>
            ) : (
              <div className="issues-list">
                {issues.map((issue, idx) => (
                  <div
                    key={issue.id || idx}
                    className={`issue-item ${getSeverityColor(issue.severity)}`}
                    onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                  >
                    <div className="issue-header">
                      <span className={`severity-badge ${issue.severity}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="category">{issue.category}</span>
                      <span className="location">{issue.location && `📍 ${issue.location}`}</span>
                    </div>
                    <p className="message">{issue.message}</p>

                    {selectedIssue?.id === issue.id && issue.suggestion && (
                      <div className="issue-details">
                        <h4>Suggestion</h4>
                        <p>{issue.suggestion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn-download">
              📥 Download Corrected Document
            </button>
            <button className="btn-export">
              📊 Export Report
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
