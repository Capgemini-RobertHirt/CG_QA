import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './TemplateConfigurationEditor.css';

interface Template {
  id?: string;
  name: string;
  type: string;
  config?: Record<string, any>;
}

interface TemplateConfigurationEditorProps {
  template?: Template | null;
  cloneSource?: Template | null;
  onClose: () => void;
  onSave?: () => void;
}

const TEMPLATE_TYPES = ['default', 'engineering', 'asset', 'whitepaper', 'point_of_view', 'rfp_rfi_response', 'internal_meeting_presentation'];

function TemplateConfigurationEditor({ template, cloneSource, onClose, onSave }: TemplateConfigurationEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [type, setType] = useState(template?.type || 'default');
  const [configEntries, setConfigEntries] = useState<Array<{ key: string; value: string }>>(
    template?.config ? Object.entries(template.config).map(([key, value]) => ({ key, value: String(value) })) : [{ key: '', value: '' }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
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
      // Build config object from entries, filtering out empty keys
      const config: Record<string, string> = {};
      configEntries.forEach(entry => {
        if (entry.key.trim()) {
          config[entry.key.trim()] = entry.value;
        }
      });

      const templateData = { name: name.trim(), type, config };

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

        {error && <div className="alert alert-error">{error}</div>}

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