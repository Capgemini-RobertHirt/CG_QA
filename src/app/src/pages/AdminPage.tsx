import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import TemplateAdminDashboard from '../components/TemplateAdminDashboard';
import { useTranslation } from 'react-i18next';
import './AdminPage.css';

function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Check if user has admin role
  if (!user?.isAdmin) {
    return (
      <div className="admin-page">
        <Navigation />
        <div className="page-content">
          <p>{t('common.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navigation />
      <div className="page-content">
        <h1>{t('pages.admin')}</h1>
        <TemplateAdminDashboard />
      </div>
    </div>
  );
}

export default AdminPage;
