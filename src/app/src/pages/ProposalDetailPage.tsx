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
