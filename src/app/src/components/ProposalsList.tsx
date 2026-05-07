import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './ProposalsList.css';

const POLLING_INTERVAL_MS = 5000;

function normalizeProposalStatus(status: unknown) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) {
    return 'uploaded';
  }

  if (normalized === 'completed' || normalized === 'analyzed') {
    return 'completed';
  }

  if (normalized === 'failed' || normalized === 'error') {
    return 'error';
  }

  return normalized;
}

function ProposalsList() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const loadProposals = async () => {
    try {
      const response = await api.getProposals();
      const apiProposals = response.data.samples || [];

      if (apiProposals.length > 0) {
        setProposals(apiProposals);
        localStorage.setItem('cached_proposals', JSON.stringify(apiProposals));
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        const cachedProposals = localStorage.getItem('cached_proposals');
        if (cachedProposals) {
          const parsed = JSON.parse(cachedProposals);
          setProposals(parsed);
        } else {
          setProposals([]);
        }
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      const cachedProposals = localStorage.getItem('cached_proposals');
      if (cachedProposals) {
        const parsed = JSON.parse(cachedProposals);
        setProposals(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const hasProcessingProposals = proposals.some((proposal) => normalizeProposalStatus(proposal.status) === 'processing');

  useEffect(() => {
    if (!hasProcessingProposals) {
      setPollingActive(false);
      return;
    }

    setPollingActive(true);
    const intervalId = window.setInterval(() => {
      loadProposals();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasProcessingProposals]);

  const handleViewProposal = (id: string) => {
    navigate(`/proposal/${id}`);
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      await api.deleteProposal(id);
      const updatedProposals = proposals.filter(p => p.id !== id);
      setProposals(updatedProposals);
      localStorage.setItem('cached_proposals', JSON.stringify(updatedProposals));
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;
  if (proposals.length === 0) return <div>{t('proposals.noProposals')}</div>;

  return (
    <div className="proposals-list">
      <div className="proposals-list-toolbar">
        <div className="proposals-refresh-status">
          {pollingActive ? 'Auto-refreshing while PPTX analysis is processing.' : 'Refresh to check the latest analysis status.'}
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
        </div>
        <button type="button" className="refresh-button" onClick={loadProposals}>Refresh</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>{t('proposals.proposalTitle')}</th>
            <th>{t('proposals.status')}</th>
            <th>{t('proposals.quality')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => (
            <tr key={proposal.id}>
              <td>{proposal.name}</td>
              <td><span className={`badge ${normalizeProposalStatus(proposal.status)}`}>{proposal.status}</span></td>
              <td>{proposal.quality}%</td>
              <td>
                <button onClick={() => handleViewProposal(proposal.id)}>{t('proposals.view')}</button>
                <button onClick={() => handleDeleteProposal(proposal.id)}>{t('common.delete')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProposalsList;