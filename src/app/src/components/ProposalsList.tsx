import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './ProposalsList.css';

function ProposalsList() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const loadProposals = async () => {
      try {
        // Try to get proposals from API
        const response = await api.getProposals();
        const apiProposals = response.data.samples || [];
        
        // If API returns proposals, use them and update localStorage
        if (apiProposals.length > 0) {
          setProposals(apiProposals);
          localStorage.setItem('cached_proposals', JSON.stringify(apiProposals));
        } else {
          // If API returns empty, try localStorage fallback
          const cachedProposals = localStorage.getItem('cached_proposals');
          if (cachedProposals) {
            const parsed = JSON.parse(cachedProposals);
            console.log('Using cached proposals from localStorage:', parsed);
            setProposals(parsed);
          } else {
            setProposals([]);
          }
        }
      } catch (error) {
        console.error('Error loading proposals:', error);
        // On error, try to load from localStorage
        const cachedProposals = localStorage.getItem('cached_proposals');
        if (cachedProposals) {
          const parsed = JSON.parse(cachedProposals);
          console.log('Error loading from API, using cached proposals:', parsed);
          setProposals(parsed);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, []);

  const handleViewProposal = (id: string) => {
    navigate(`/proposal/${id}`);
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      await api.deleteProposal(id);
      setProposals(proposals.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  if (loading) return <div>{t('common.loading')}</div>;
  if (proposals.length === 0) return <div>{t('proposals.noProposals')}</div>;

  return (
    <div className="proposals-list">
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
              <td><span className="badge">{proposal.status}</span></td>
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