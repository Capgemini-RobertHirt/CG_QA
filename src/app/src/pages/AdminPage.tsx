<<<<<<< HEAD
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
=======
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
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
