import React, { useState, useEffect } from 'react';
import TemplateConfigurationEditor from './TemplateConfigurationEditor';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './TemplateAdminDashboard.css';

function TemplateAdminDashboard() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplateTypes();
      setTemplates(response.data.available_types || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (showEditor) {
    return (
      <TemplateConfigurationEditor
        template={editingTemplate}
        onClose={() => {
          setShowEditor(false);
          loadTemplates();
        }}
      />
    );
  }

  if (loading) return <div>{t('common.loading')}</div>;

  return (
    <div className="template-dashboard">
      <button className="create-button" onClick={handleCreateTemplate}>
        {t('templates.createTemplate')}
      </button>

      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card">
            <h3>{template.name}</h3>
            <p>Type: {template.type}</p>
            <p>Updated: {new Date(template.updated).toLocaleDateString()}</p>
            <div className="card-actions">
              <button onClick={() => handleEditTemplate(template)}>{t('templates.editTemplate')}</button>
              <button onClick={() => handleDeleteTemplate(template.id)} className="delete">
                {t('templates.deleteTemplate')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemplateAdminDashboard;
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesAPI.list();
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Template) => {
    try {
      if (template.id) {
        await templatesAPI.update(template.id, template);
      } else {
        await templatesAPI.create(template);
      }
      fetchTemplates();
      setSelectedTemplate(null);
      setIsCreating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templatesAPI.delete(id);
      setTemplates(templates.filter(t => t.id !== id));
      setSelectedTemplate(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  if (selectedTemplate || isCreating) {
    return (
      <TemplateConfigurationEditor
        template={selectedTemplate || { name: '', type: '', config: {} } as Template}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setSelectedTemplate(null);
          setIsCreating(false);
        }}
      />
    );
  }

  if (loading) {
    return <div className="template-dashboard"><p>Loading templates...</p></div>;
  }

  return (
    <div className="template-dashboard">
      <div className="dashboard-header">
        <h2>{t('templates.management') || 'Template Management'}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          + {t('templates.new') || 'New Template'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {templates.length === 0 ? (
        <p className="empty-message">{t('templates.empty') || 'No templates available'}</p>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <h3>{template.name}</h3>
              <p className="type">{template.type}</p>
              <p className="updated">
                {t('common.updated') || 'Updated'}: {new Date(template.updatedAt).toLocaleDateString()}
              </p>
              <div className="card-actions">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="btn-edit"
                >
                  ✏️ {t('common.edit') || 'Edit'}
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="btn-delete"
                >
                  🗑️ {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}