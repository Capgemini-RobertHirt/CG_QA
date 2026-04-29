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