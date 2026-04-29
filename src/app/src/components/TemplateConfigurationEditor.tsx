import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import ComponentTreeEditor from './ComponentTreeEditor';
import './TemplateConfigurationEditor.css';

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

interface TemplateConfigurationEditorProps {
  template?: Template | null;
  cloneSource?: Template | null;
  onClose: () => void;
  onSave?: () => void;
}

const TEMPLATE_TYPES = ['default', 'engineering', 'asset', 'whitepaper', 'point_of_view', 'rfp_rfi_response', 'internal_meeting_presentation'];

// Helper function to extract configuration items from template
function extractConfigItems(template?: Template | null): Array<{ key: string; value: string }> {
  if (!template) return [{ key: '', value: '' }];

  const items: Array<{ key: string; value: string }> = [];

  // Extract from structure.sections
  if (template.structure?.sections) {
    if (template.structure.sections.required?.length > 0) {
      items.push({
        key: 'Required Sections',
        value: template.structure.sections.required.join(', ')
      });
    }
    if (template.structure.sections.optional?.length > 0) {
      items.push({
        key: 'Optional Sections',
        value: template.structure.sections.optional.join(', ')
      });
    }
  }

  // Extract from document_types
  if (template.document_types && Object.keys(template.document_types).length > 0) {
    items.push({
      key: 'Document Types',
      value: Object.keys(template.document_types).join(', ')
    });
  }

  // Extract from custom config
  if (template.config && Object.keys(template.config).length > 0) {
    Object.entries(template.config).forEach(([key, value]) => {
      items.push({
        key,
        value: String(value)
      });
    });
  }

  // If no items extracted, return empty entry
  return items.length > 0 ? items : [{ key: '', value: '' }];
}

function TemplateConfigurationEditor({ template, cloneSource, onClose, onSave }: TemplateConfigurationEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [type, setType] = useState(template?.type || template?.entity_type || 'default');
  const [configEntries, setConfigEntries] = useState<Array<{ key: string; value: string }>>(
    extractConfigItems(template)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'components'>('simple');
  const { t } = useTranslation();

  const isEditing = Boolean(template?.id);
  const isCloning = Boolean(cloneSource);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setNameError(t('templates.nameRequired') || 'Template name is required');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleAddConfigItem = () => {
    setConfigEntries([...configEntries, { key: '', value: '' }]);
  };

  const handleRemoveConfigItem = (index: number) => {
    setConfigEntries(configEntries.filter((_, i) => i !== index));
  };

  const handleConfigChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEntries = [...configEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setConfigEntries(newEntries);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Separate configuration items into different categories
      const customConfig: Record<string, string> = {};
      let requiredSections: string[] = [];
      let optionalSections: string[] = [];
      let documentTypes: string[] = [];

      configEntries.forEach(entry => {
        if (!entry.key.trim()) return;

        const key = entry.key.trim();
        const value = entry.value.trim();

        if (key === 'Required Sections' && value) {
          requiredSections = value.split(',').map(s => s.trim()).filter(s => s);
        } else if (key === 'Optional Sections' && value) {
          optionalSections = value.split(',').map(s => s.trim()).filter(s => s);
        } else if (key === 'Document Types' && value) {
          documentTypes = value.split(',').map(d => d.trim()).filter(d => d);
        } else {
          customConfig[key] = value;
        }
      });

      // Build the template data
      const templateData: any = { 
        name: name.trim(), 
        type,
        config: customConfig 
      };

      // Preserve or update structure
      if (template?.structure || requiredSections.length > 0 || optionalSections.length > 0) {
        templateData.structure = template?.structure || {};
        templateData.structure.sections = {
          required: requiredSections.length > 0 ? requiredSections : (template?.structure?.sections?.required || []),
          optional: optionalSections.length > 0 ? optionalSections : (template?.structure?.sections?.optional || [])
        };
      }

      // Preserve document types
      if (template?.document_types) {
        if (documentTypes.length > 0) {
          templateData.document_types = {};
          documentTypes.forEach(doc => {
            templateData.document_types[doc] = template.document_types?.[doc] || {};
          });
        } else {
          templateData.document_types = template.document_types;
        }
      }

      // Preserve design and global_rules
      if (template?.design) {
        templateData.design = template.design;
      }
      if (template?.global_rules) {
        templateData.global_rules = template.global_rules;
      }

      if (isEditing && template?.id) {
        await api.updateTemplate(template.id, templateData);
      } else {
        await api.createTemplate(templateData);
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      setError(t('errors.saveFailed') || 'Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="template-editor-container">
      <div className="template-editor">
        <div className="editor-header">
          <h2>
            {isCloning ? (t('templates.cloneTemplate') || 'Clone Template') : (isEditing ? t('templates.editTemplate') : t('templates.createTemplate'))}
          </h2>
          {isCloning && (
            <p className="clone-info">
              {t('templates.basedOn') || 'Based on'}: <strong>{cloneSource?.name}</strong>
            </p>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="view-mode-tabs">
          <button
            className={`tab-btn ${viewMode === 'simple' ? 'active' : ''}`}
            onClick={() => setViewMode('simple')}
          >
            ⚙️ {t('templates.basicSettings') || 'Basic Settings'}
          </button>
          <button
            className={`tab-btn ${viewMode === 'components' ? 'active' : ''}`}
            onClick={() => setViewMode('components')}
          >
            📦 {t('templates.componentStructure') || 'Component Structure'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {viewMode === 'simple' ? (
          <>
            <div className="form-group">
              <label htmlFor="template-name">{t('templates.templateName')} *</label>
              <input
                id="template-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder={t('templates.enterTemplateName') || 'e.g., Technical Proposal'}
                className={nameError ? 'input-error' : ''}
                maxLength={100}
              />
              {nameError && <span className="error-message">{nameError}</span>}
              <span className="char-count">{name.length}/100</span>
            </div>

            <div className="form-group">
              <label htmlFor="template-type">{t('templates.templateType')} *</label>
              <select id="template-type" value={type} onChange={(e) => setType(e.target.value)}>
                {TEMPLATE_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ').charAt(0).toUpperCase() + t.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('templates.configuration')} ({configEntries.filter(e => e.key.trim()).length})</label>
              <p className="form-hint">{t('templates.configurationHint') || 'Add key-value pairs for template configuration'}</p>
              <div className="config-items">
                {configEntries.map((entry, index) => (
                  <div key={index} className="config-row">
                    <input
                      type="text"
                      value={entry.key}
                      onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                      placeholder={t('templates.configKey') || 'Key'}
                      className="config-key"
                      maxLength={50}
                    />
                    <input
                      type="text"
                      value={entry.value}
                      onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                      placeholder={t('templates.configValue') || 'Value'}
                      className="config-value"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveConfigItem(index)}
                      className="btn-remove"
                      title={t('templates.removeItem') || 'Remove this item'}
                      aria-label="Remove configuration item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddConfigItem}
                className="btn btn-secondary"
              >
                + {t('templates.addItem') || 'Add Configuration Item'}
              </button>
            </div>
          </>
        ) : (
          <div className="component-editor-view">
            <ComponentTreeEditor
              templateStructure={template?.structure?.legoBlocks || {}}
              onSave={(structure) => {
                // Update template structure with component data
                console.log('Component structure saved:', structure);
              }}
            />
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="btn btn-primary"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateConfigurationEditor;