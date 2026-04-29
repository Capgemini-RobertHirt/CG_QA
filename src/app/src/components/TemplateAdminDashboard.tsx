import React, { useState, useEffect } from 'react';
import TemplateConfigurationEditor from './TemplateConfigurationEditor';
import { AdminControlPanel } from './AdminControlPanel';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './TemplateAdminDashboard.css';

interface Template {
  id?: string;
  name?: string;
  type?: string;
  entity_type?: string;
  config?: Record<string, any>;
  global_rules?: Record<string, any>;
  structure?: Record<string, any>;
  design?: Record<string, any>;
  document_types?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

function TemplateAdminDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [cloneSourceTemplate, setCloneSourceTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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
      // Try to get full template objects first (which includes structure/config)
      let response;
      try {
        response = await api.getTemplates();
      } catch (error) {
        // Fallback to getTemplateTypes if getTemplates fails
        response = await api.getTemplateTypes();
      }
      
      // Handle both mock API (returns available_types as strings) and real API (returns template objects)
      let loadedTemplates: Template[] = [];
      
      if (Array.isArray(response.data.available_types)) {
        // API returning entity types
        loadedTemplates = response.data.available_types.map((type: any) => {
          // If it's a string, convert to template object
          if (typeof type === 'string') {
            return {
              id: `template-baseline-${type}`,
              name: type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1),
              type: type,
              entity_type: type,
              config: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return {
            id: type.id || `template-${type.entity_type}`,
            name: type.name || type.entity_type?.replace(/_/g, ' '),
            type: type.entity_type || type.type,
            entity_type: type.entity_type || type.type,
            config: type.config || type.global_rules?.custom_config || {},
            structure: type.structure,
            document_types: type.document_types,
            global_rules: type.global_rules,
            design: type.design,
            createdAt: type.created_at || type.createdAt,
            updatedAt: type.updated_at || type.updatedAt,
          };
        });
      } else if (Array.isArray(response.data)) {
        // Real API or mock API returning template objects
        loadedTemplates = response.data.map((template: any) => ({
          id: template.id || `template-${template.entity_type}`,
          name: template.name || template.global_rules?.template_name || template.entity_type,
          type: template.entity_type || template.type,
          entity_type: template.entity_type || template.type,
          config: template.global_rules?.custom_config || template.config || {},
          structure: template.structure,
          document_types: template.document_types,
          global_rules: template.global_rules,
          design: template.design,
          createdAt: template.created_at || template.createdAt,
          updatedAt: template.updated_at || template.updatedAt,
        }));
      }
      
      setTemplates(loadedTemplates);
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

  if (showAdminPanel) {
    return <AdminControlPanel onClose={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="template-dashboard">
      <div className="dashboard-header">
        <h2>{t('templates.manageTemplates') || 'Manage Templates'}</h2>
        <div className="header-actions">
          <button className="admin-button" onClick={() => setShowAdminPanel(true)}>
            ⚙️ {t('admin.controlPanel') || 'Admin Controls'}
          </button>
          <button className="create-button" onClick={handleCreateTemplate}>
            + {t('templates.createTemplate')}
          </button>
        </div>
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
          {templates.map((template) => {
            // Count configuration items from structure
            const requiredSections = template.structure?.sections?.required?.length || 0;
            const optionalSections = template.structure?.sections?.optional?.length || 0;
            const documentTypes = Object.keys(template.document_types || {}).length;
            const totalItems = requiredSections + optionalSections + documentTypes;
            
            return (
              <div key={template.id} className="template-card">
                <div className="card-header">
                  <h3>{template.name}</h3>
                </div>
                <div className="card-content">
                  <p className="template-type">
                    <strong>{t('templates.type') || 'Type'}:</strong> {template.type || template.entity_type}
                  </p>
                  <p className="template-items">
                    <strong>{t('templates.items') || 'Items'}:</strong> {totalItems > 0 ? totalItems : Object.keys(template.config || {}).length}
                  </p>
                  {template.structure?.sections && (
                    <p className="template-sections">
                      <strong>Sections:</strong> {requiredSections} required, {optionalSections} optional
                    </p>
                  )}
                  {(template.updatedAt || template.updated_at) && (
                    <p className="template-date">
                      <strong>{t('templates.updated') || 'Updated'}:</strong> {new Date(template.updatedAt || template.updated_at || '').toLocaleDateString()}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TemplateAdminDashboard;