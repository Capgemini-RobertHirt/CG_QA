<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import { proposalsAPI } from '../services/api';
import './HistoryPage.css';

interface HistoryEntry {
  id: string;
  proposalId: string;
  proposalName: string;
  action: 'upload' | 'analyze' | 'download' | 'delete' | 'update';
  timestamp: string;
  details?: string;
  status: 'success' | 'error' | 'pending';
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // This would call a history endpoint when available
      const data = await proposalsAPI.getHistory?.() || [];
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'upload':
        return 'action-upload';
      case 'analyze':
        return 'action-analyze';
      case 'download':
        return 'action-download';
      case 'delete':
        return 'action-delete';
      default:
        return 'action-default';
    }
  };

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'upload':
        return '📤';
      case 'analyze':
        return '🔍';
      case 'download':
        return '📥';
      case 'delete':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  const filteredHistory = history.filter(entry => {
    if (filterAction === 'all') return true;
    return entry.action === filterAction;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return <div className="history-page"><p>Loading history...</p></div>;
  }

  return (
    <>
      <Navigation />
      <div className="history-page">
      <div className="history-header">
        <h1>{t('history.title') || 'Activity History'}</h1>
        <p className="subtitle">{t('history.subtitle') || 'View your proposal activity and changes'}</p>
      </div>

      <div className="history-controls">
        <div className="filters">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Actions</option>
            <option value="upload">Uploads</option>
            <option value="analyze">Analyses</option>
            <option value="download">Downloads</option>
            <option value="delete">Deletions</option>
            <option value="update">Updates</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {sortedHistory.length === 0 ? (
        <p className="empty-message">{t('history.empty') || 'No activity history available'}</p>
      ) : (
        <div className="history-timeline">
          {sortedHistory.map((entry, idx) => (
            <div key={entry.id || idx} className="history-item">
              <div className="timeline-dot"></div>
              <div className="item-content">
                <div className="item-header">
                  <span className={`action-badge ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)} {entry.action.toUpperCase()}
                  </span>
                  <span className={`status-badge ${entry.status}`}>
                    {getStatusIcon(entry.status)}
                  </span>
                </div>
                <h4>{entry.proposalName}</h4>
                <p className="timestamp">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                {entry.details && (
                  <p className="details">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
