import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { proposalsAPI } from '../services/api';
import './ProposalsList.css';

interface Proposal {
  id: string;
  filename: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  uploadedAt: string;
  analysisResult?: {
    issues: Array<{ category: string; severity: string; message: string }>;
    score: number;
  };
}

interface ProposalsListProps {
  refreshTrigger?: number;
}

export default function ProposalsList({ refreshTrigger = 0 }: ProposalsListProps) {
  const { t } = useTranslation();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [refreshTrigger]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await proposalsAPI.list();
      setProposals(data || []);
    } catch (err: any) {
      setError(err.message || t('errors.loadFailed') || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    try {
      await proposalsAPI.delete(id);
      setProposals(proposals.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete proposal');
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'analyzing':
        return 'badge-info';
      case 'error':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: t('proposals.status.pending') || 'Pending',
      analyzing: t('proposals.status.analyzing') || 'Analyzing',
      completed: t('proposals.status.completed') || 'Completed',
      error: t('proposals.status.error') || 'Error',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="proposals-list"><p>Loading proposals...</p></div>;
  }

  if (error) {
    return <div className="proposals-list"><p className="error">{error}</p></div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="proposals-list">
        <p className="empty">{t('proposals.empty') || 'No proposals yet'}</p>
      </div>
    );
  }

  return (
    <div className="proposals-list">
      <h3>{t('proposals.list') || 'Your Proposals'}</h3>
      <table className="proposals-table">
        <thead>
          <tr>
            <th>{t('proposals.filename') || 'Filename'}</th>
            <th>{t('proposals.status') || 'Status'}</th>
            <th>{t('proposals.uploaded') || 'Uploaded'}</th>
            <th>{t('proposals.score') || 'Score'}</th>
            <th>{t('common.actions') || 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td className="filename">
                <a href={`/proposal/${proposal.id}`}>{proposal.filename}</a>
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(proposal.status)}`}>
                  {getStatusText(proposal.status)}
                </span>
              </td>
              <td>{new Date(proposal.uploadedAt).toLocaleDateString()}</td>
              <td>
                {proposal.analysisResult?.score ? (
                  <span className="score">{(proposal.analysisResult.score * 100).toFixed(1)}%</span>
                ) : (
                  <span className="score-pending">-</span>
                )}
              </td>
              <td className="actions">
                <button
                  onClick={() => {
                    window.location.href = `/proposal/${proposal.id}`;
                  }}
                  className="btn-view"
                  title="View details"
                >
                  👁️
                </button>
                <button
                  onClick={() => handleDelete(proposal.id)}
                  className="btn-delete"
                  title="Delete proposal"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
