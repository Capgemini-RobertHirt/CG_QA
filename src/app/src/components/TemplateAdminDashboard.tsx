import React, { useState, useEffect } from 'react';
import TemplateConfigurationEditor from './TemplateConfigurationEditor';
import { DocumentUploadAnalyzer, type ExtractedData } from './DocumentUploadAnalyzer';
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

const normalizeSectionKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildLegoBlocksFromExtraction = (sections: string[], components: string[]) => {
  const componentHints = new Set(components.map((component) => component.toLowerCase()));
  const sectionComponentMap: Record<string, string> = {
    table: 'table',
    grid: 'grid',
    chart: 'chart',
    timeline: 'timeline',
    quote: 'quote',
    diagram: 'card',
    visual: 'card',
    image: 'card',
    list: 'card',
    'bullet-point': 'card',
    paragraph: 'card',
    heading: 'card',
  };

  const pickComponentId = (sectionName: string) => {
    const sectionLower = sectionName.toLowerCase();
    if (sectionLower.includes('timeline') || sectionLower.includes('roadmap')) return 'timeline';
    if (sectionLower.includes('pricing') || sectionLower.includes('cost') || sectionLower.includes('risk')) return 'table';
    if (sectionLower.includes('metric') || sectionLower.includes('performance') || sectionLower.includes('kpi')) return 'chart';
    if (sectionLower.includes('quote') || sectionLower.includes('testimonial')) return 'quote';
    if (sectionLower.includes('grid') || sectionLower.includes('overview') || sectionLower.includes('topics')) return 'grid';

    for (const hint of componentHints) {
      if (sectionComponentMap[hint]) {
        return sectionComponentMap[hint];
      }
    }

    return 'card';
  };

  return sections.reduce((acc: Record<string, any>, sectionName, index) => {
    const key = normalizeSectionKey(sectionName) || `section_${index + 1}`;
    const componentId = pickComponentId(sectionName);
    const subcomponents = [
      {
        id: `subcomp-${key}-title`,
        subcomponentId: 'title',
        name: 'Section Title',
        properties: {
          fontSize: '24px',
          fontWeight: 'bold',
          alignment: 'left',
          marginBottom: '16px',
        },
      },
    ];

    if (componentHints.has('bullet-point') || componentHints.has('list')) {
      subcomponents.push({
        id: `subcomp-${key}-list`,
        subcomponentId: 'bulletList',
        name: 'Bullet List',
        properties: {
          itemCount: 5,
          bulletStyle: 'circle',
          fontSize: '12px',
          spacing: '8px',
        },
      });
    } else if (componentHints.has('numbered-list') || componentHints.has('steps')) {
      subcomponents.push({
        id: `subcomp-${key}-numbered`,
        subcomponentId: 'numberedList',
        name: 'Numbered List',
        properties: {
          itemCount: 5,
          numberFormat: '1.',
          fontSize: '12px',
        },
      });
    } else {
      subcomponents.push({
        id: `subcomp-${key}-paragraph`,
        subcomponentId: 'paragraph',
        name: 'Section Content',
        properties: {
          fontSize: '12px',
          lineHeight: '1.5',
          color: '#333333',
          maxWidth: '100%',
        },
      });
    }

    acc[key] = {
      name: sectionName,
      components: [
        {
          id: `comp-${key}`,
          componentId,
          name: sectionName,
          category: 'container',
          properties: {
            title: sectionName,
            variant: 'default',
          },
          subcomponents,
        },
      ],
    };

    return acc;
  }, {});
};

function TemplateAdminDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [cloneSourceTemplate, setCloneSourceTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDocumentUploadAnalyzer, setShowDocumentUploadAnalyzer] = useState(false);
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
      
      // Handle different API response formats
      let loadedTemplates: Template[] = [];
      
      // First check for new templates-list endpoint format with full templates
      if (Array.isArray(response.data.templates)) {
        loadedTemplates = response.data.templates.map((template: any) => ({
          id: template.id || template.entityType || `template-${template.entity_type}`,
          name: template.name || template.entityType?.replace(/_/g, ' ') || template.entity_type?.replace(/_/g, ' '),
          type: template.type || template.entityType || template.entity_type,
          entity_type: template.entity_type || template.entityType || template.type,
          config: template.config || template.globalRules?.custom_config || {},
          structure: template.structure,
          document_types: template.documentTypes || template.document_types,
          global_rules: template.globalRules || template.global_rules,
          design: template.design,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        }));
      }
      // Then check for available_types endpoint format (returns entity types as strings or objects)
      else if (Array.isArray(response.data.available_types)) {
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

  const handleDocumentExtracted = (extractedData: ExtractedData) => {
    const allSections = extractedData.sections.length > 0
      ? extractedData.sections
      : ['Introduction', 'Content', 'Conclusion'];
    const legoBlocks = buildLegoBlocksFromExtraction(allSections, extractedData.components);

    // Create a new template from the extracted document data
    const newTemplate: Template = {
      name: extractedData.documentName,
      type: extractedData.documentType,
      entity_type: extractedData.documentType,
      structure: {
        sections: {
          required: allSections.slice(0, Math.ceil(allSections.length / 2)),
          optional: allSections.slice(Math.ceil(allSections.length / 2)),
        },
        legoBlocks,
      },
      config: {
        suggestedComponents: extractedData.components,
        requiredItems: extractedData.requiredItems,
        confidence: extractedData.confidence,
      },
      document_types: extractedData.documentType ? { [extractedData.documentType]: {} } : {},
      global_rules: extractedData.suggestedConfig,
      design: extractedData.suggestedConfig?.design || {
        colors: { primary: '#003366', secondary: '#0066CC' },
        fonts: { body: 'Segoe UI', heading: 'Segoe UI' },
      },
    };

    // Set the extracted template for editing
    setEditingTemplate(newTemplate);
    setCloneSourceTemplate(null);
    setShowDocumentUploadAnalyzer(false);
    setShowEditor(true);

    setSuccessMessage(
      t('templates.documentAnalyzed') || 
      `Document analyzed successfully! Confidence: ${extractedData.confidence}%`
    );
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

  if (showDocumentUploadAnalyzer) {
    return (
      <DocumentUploadAnalyzer
        onExtract={handleDocumentExtracted}
        onCancel={() => setShowDocumentUploadAnalyzer(false)}
      />
    );
  }

  return (
    <div className="template-dashboard">
      <div className="dashboard-header">
        <h2>{t('templates.manageTemplates') || 'Manage Templates'}</h2>
        <div className="header-actions">
          <button className="admin-button" onClick={() => setShowAdminPanel(true)}>
            ⚙️ {t('admin.controlPanel') || 'Admin Controls'}
          </button>
          <button 
            className="upload-button" 
            onClick={() => setShowDocumentUploadAnalyzer(true)}
            title="Upload a document to automatically extract template configuration"
          >
            📄 {t('templates.uploadDocument') || 'Upload Document'}
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