<<<<<<< HEAD
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './TemplateConfigurationEditor.css';

interface TemplateConfigurationEditorProps {
  template?: any;
  onClose: () => void;
}

function TemplateConfigurationEditor({ template, onClose }: TemplateConfigurationEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [type, setType] = useState(template?.type || 'default');
  const [configItems, setConfigItems] = useState(template?.config || [{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleAddConfigItem = () => {
    setConfigItems([...configItems, { key: '', value: '' }]);
  };

  const handleRemoveConfigItem = (index: number) => {
    setConfigItems(configItems.filter((_, i) => i !== index));
  };

  const handleConfigChange = (index: number, field: string, value: string) => {
    const newItems = [...configItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setConfigItems(newItems);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const templateData = { name, type, config: configItems };
      
      if (template?.id) {
        await api.updateTemplate(template.id, templateData);
      } else {
        await api.createTemplate(templateData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="template-editor">
      <h2>{template ? t('templates.editTemplate') : t('templates.createTemplate')}</h2>
      
      <div className="form-group">
        <label>{t('templates.templateName')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('templates.templateName')}
        />
      </div>

      <div className="form-group">
        <label>{t('templates.templateType')}</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="default">Default</option>
          <option value="engineering">Engineering</option>
          <option value="asset">Asset</option>
        </select>
      </div>

      <div className="form-group">
        <label>{t('templates.configuration')}</label>
        <div className="config-items">
          {configItems.map((item, index) => (
            <div key={index} className="config-item">
              <input
                type="text"
                value={item.key}
                onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                placeholder="Key"
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                placeholder="Value"
              />
              <button onClick={() => handleRemoveConfigItem(index)} className="delete-button">
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleAddConfigItem} className="add-button">
          Add Config Item
        </button>
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={loading}>
          {loading ? t('common.loading') : t('common.save')}
        </button>
        <button onClick={onClose}>{t('common.cancel')}</button>
      </div>
    </div>
  );
}

export default TemplateConfigurationEditor;
=======
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './TemplateConfigurationEditor.css';

interface Template {
  id?: string;
  name: string;
  type: string;
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateConfigurationEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

const TEMPLATE_TYPES = ['engineering', 'design', 'process', 'compliance'];

export default function TemplateConfigurationEditor({
  template,
  onSave,
  onCancel,
}: TemplateConfigurationEditorProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(template);
  const [configItems, setConfigItems] = useState<Array<{ key: string; value: any }>>(
    Object.entries(template.config || {}).map(([key, value]) => ({ key, value }))
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, type: e.target.value });
  };

  const handleConfigChange = (index: number, field: 'key' | 'value', val: any) => {
    const updated = [...configItems];
    updated[index][field] = val;
    setConfigItems(updated);
  };

  const addConfigItem = () => {
    setConfigItems([...configItems, { key: '', value: '' }]);
  };

  const removeConfigItem = (index: number) => {
    setConfigItems(configItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }

    const config: Record<string, any> = {};
    for (const item of configItems) {
      if (item.key.trim()) {
        config[item.key] = item.value;
      }
    }

    onSave({
      ...formData,
      config,
    });
  };

  return (
    <div className="template-editor">
      <div className="editor-header">
        <h2>{template.id ? 'Edit Template' : 'Create New Template'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label htmlFor="name">Template Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="e.g., Technical Proposal"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Template Type *</label>
          <select
            id="type"
            value={formData.type}
            onChange={handleTypeChange}
            required
          >
            <option value="">Select a type</option>
            {TEMPLATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="config-section">
          <h3>Configuration Items</h3>
          <div className="config-items">
            {configItems.map((item, index) => (
              <div key={index} className="config-row">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                  placeholder="Key"
                  className="config-key"
                />
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="config-value"
                />
                <button
                  type="button"
                  onClick={() => removeConfigItem(index)}
                  className="btn-remove"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addConfigItem}
            className="btn-add-config"
          >
            + Add Configuration Item
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save">
            {t('common.save') || 'Save'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
