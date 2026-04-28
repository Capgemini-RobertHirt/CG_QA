import React from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import TemplateAdminDashboard from '../components/TemplateAdminDashboard';
import './AdminPage.css';

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Check if user is admin
  if (!user?.isAdmin && !user?.roles?.includes('admin')) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.title') || 'Administration'}</h1>
        <p className="subtitle">{t('admin.subtitle') || 'Manage application settings and templates'}</p>
      </div>

      <div className="admin-content">
        <TemplateAdminDashboard />
      </div>
      </div>
    </>
  );
}
