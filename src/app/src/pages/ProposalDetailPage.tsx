import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './ProposalDetailPage.css';

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
        <h1>TESTING - {t('proposals.proposalTitle')}</h1>
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <p><strong>Debug Info:</strong></p>
          <p>ID: {id}</p>
          <p>Loading: {loading ? 'yes' : 'no'}</p>
          <p>Proposal: {proposal ? 'loaded' : 'not loaded'}</p>
          <p>Proposal ID: {proposal?.id}</p>
        </div>
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

