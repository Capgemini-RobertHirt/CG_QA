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
