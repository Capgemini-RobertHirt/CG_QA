import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { useTranslation } from 'react-i18next';
import './HistoryPage.css';

function HistoryPage() {
  const { t } = useTranslation();
  const [history] = useState<any[]>([]);

  return (
    <div className="history-page">
      <Navigation />
      <div className="page-content">
        <h1>{t('pages.history')}</h1>
        <div className="history-container">
          {history.length === 0 ? (
            <p>{t('common.loading')}</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  {/* History item details */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;

