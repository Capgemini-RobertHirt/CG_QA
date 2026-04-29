import React, { useState, useEffect } from 'react';
import TemplateConfigurationEditor from './TemplateConfigurationEditor';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './TemplateAdminDashboard.css';

interface Template {
  id?: string;
  name: string;
  type: string;
  config?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

function TemplateAdminDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [cloneSourceTemplate, setCloneSourceTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplateTypes();
      setTemplates(response.data.available_types || []);
      setError(null);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError(t('errors.loadFailed') || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate({ ...template });
    setCloneSourceTemplate(null);
    setShowEditor(true);
  };

  const handleCloneTemplate = (template: Template) => {
    const clonedTemplate: Template = {
      name: `${template.name} (Copy)`,
      type: template.type,
      config: template.config ? JSON.parse(JSON.stringify(template.config)) : {},
    };
    setEditingTemplate(clonedTemplate);
    setCloneSourceTemplate(template);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setCloneSourceTemplate(null);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: string | undefined) => {
    if (!id) return;
    
    if (!window.confirm(t('templates.confirmDelete') || 'Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      setSuccessMessage(t('templates.deleteSuccess') || 'Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(t('errors.deleteFailed') || 'Failed to delete template');
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setCloneSourceTemplate(null);
    loadTemplates();
  };

  const handleEditorSave = () => {
    setSuccessMessage(
      editingTemplate?.id 
        ? (t('templates.updateSuccess') || 'Template updated successfully')
        : (t('templates.createSuccess') || 'Template created successfully')
    );
    handleEditorClose();
  };

  if (showEditor) {
    return (
      <TemplateConfigurationEditor
        template={editingTemplate}
        cloneSource={cloneSourceTemplate}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    );
  }

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  return (
    <div className="template-dashboard">
      <div className="dashboard-header">
        <h2>{t('templates.manageTemplates') || 'Manage Templates'}</h2>
        <button className="create-button" onClick={handleCreateTemplate}>
          + {t('templates.createTemplate')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {templates.length === 0 ? (
        <div className="empty-state">
          <p>{t('templates.noTemplates') || 'No templates found'}</p>
          <button onClick={handleCreateTemplate}>{t('templates.createFirst') || 'Create your first template'}</button>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="card-header">
                <h3>{template.name}</h3>
              </div>
              <div className="card-content">
                <p className="template-type">
                  <strong>{t('templates.type') || 'Type'}:</strong> {template.type}
                </p>
                <p className="template-items">
                  <strong>{t('templates.items') || 'Items'}:</strong> {Object.keys(template.config || {}).length}
                </p>
                {template.updatedAt && (
                  <p className="template-date">
                    <strong>{t('templates.updated') || 'Updated'}:</strong> {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="card-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleEditTemplate(template)}
                  title={t('templates.editTooltip') || 'Edit this template'}
                >
                  ✎ {t('common.edit') || 'Edit'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleCloneTemplate(template)}
                  title={t('templates.cloneTooltip') || 'Create a copy of this template'}
                >
                  ⊕ {t('templates.clone') || 'Clone'}
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteTemplate(template.id)}
                  title={t('templates.deleteTooltip') || 'Delete this template'}
                >
                  🗑️ {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateAdminDashboard;