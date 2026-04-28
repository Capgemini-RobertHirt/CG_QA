<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import DocumentUpload from '../components/DocumentUpload';
import ProposalsList from '../components/ProposalsList';
import { useTranslation } from 'react-i18next';
import './HomePage.css';

function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useTranslation();

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="home-page">
      <Navigation />
      <div className="page-content">
        <h1>{t('proposals.myProposals')}</h1>
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        <ProposalsList key={refreshTrigger} />
      </div>
    </div>
  );
}

export default HomePage;
=======
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import DocumentUpload from '../components/DocumentUpload';
import ProposalsList from '../components/ProposalsList';
import './HomePage.css';

export default function HomePage() {
  const { t } = useTranslation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Navigation />
      <div className="home-page">
        <div className="page-header">
          <h1>{t('proposals.title') || 'RFP Quality Checker'}</h1>
          <p className="subtitle">{t('proposals.description') || 'Upload and analyze your proposal documents'}</p>
        </div>

        <div className="home-content">
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          <ProposalsList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
