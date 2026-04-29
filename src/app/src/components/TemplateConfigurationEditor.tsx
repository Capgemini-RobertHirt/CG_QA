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