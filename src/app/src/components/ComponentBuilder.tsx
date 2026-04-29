import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ComponentBuilder.css';

interface ComponentProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'size';
  defaultValue?: string;
  required?: boolean;
  description?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

interface ComponentBuilderProps {
  onSave: (component: any) => void;
  onCancel: () => void;
  editingComponent?: any;
}

const PROPERTY_TYPES = ['string', 'number', 'boolean', 'color', 'select', 'size'] as const;
const CATEGORIES = ['layout', 'media', 'special', 'custom'] as const;

export const ComponentBuilder: React.FC<ComponentBuilderProps> = ({
  onSave,
  onCancel,
  editingComponent,
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState(editingComponent?.name || '');
  const [description, setDescription] = useState(editingComponent?.description || '');
  const [category, setCategory] = useState((editingComponent?.category as any) || 'custom');
  const [icon, setIcon] = useState(editingComponent?.icon || '');
  const [properties, setProperties] = useState<ComponentProperty[]>(editingComponent?.properties || []);
  const [newProperty, setNewProperty] = useState<Partial<ComponentProperty>>({
    name: '',
    type: 'string',
    defaultValue: '',
    required: false,
  });

  const addProperty = () => {
    if (!newProperty.name) {
      alert('Property name is required');
      return;
    }

    const property: ComponentProperty = {
      name: newProperty.name,
      type: newProperty.type as any,
      defaultValue: newProperty.defaultValue || '',
      description: newProperty.description || '',
      required: newProperty.required || false,
      options: newProperty.options || [],
      minValue: newProperty.minValue,
      maxValue: newProperty.maxValue,
    };

    setProperties([...properties, property]);
    setNewProperty({
      name: '',
      type: 'string',
      defaultValue: '',
      required: false,
    });
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Component name is required');
      return;
    }

    const component = {
      id: editingComponent?.id || `comp-${Date.now()}`,
      name,
      description,
      category,
      icon,
      properties,
      subcomponents: [],
      isCustom: true,
    };

    onSave(component);
  };

  return (
    <div className="component-builder-overlay">
      <div className="component-builder-container">
        <h2>{editingComponent ? 'Edit Component' : 'Create Custom Component'}</h2>

        <div className="builder-section">
          <h3>📝 Basic Information</h3>

          <div className="builder-field">
            <label>Component Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hero Banner, Feature List"
              maxLength={50}
            />
            <span className="char-count">{name.length}/50</span>
          </div>

          <div className="builder-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this component is used for..."
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{description.length}/200</span>
          </div>

          <div className="builder-row">
            <div className="builder-field" style={{ flex: 1 }}>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="builder-field" style={{ flex: 1 }}>
              <label>Icon (Emoji)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                placeholder="🎨"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        <div className="builder-section">
          <h3>⚙️ Properties ({properties.length})</h3>

          {properties.length > 0 && (
            <div className="properties-list">
              {properties.map((prop, idx) => (
                <div key={idx} className="property-item">
                  <div className="property-info">
                    <strong>{prop.name}</strong>
                    <span className="property-type">{prop.type}</span>
                    {prop.required && <span className="property-required">Required</span>}
                  </div>
                  <button className="btn-small btn-danger" onClick={() => removeProperty(idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="add-property-form">
            <h4>Add New Property</h4>

            <div className="builder-row">
              <div className="builder-field" style={{ flex: 2 }}>
                <label>Property Name *</label>
                <input
                  type="text"
                  value={newProperty.name || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  placeholder="e.g., backgroundColor"
                  maxLength={50}
                />
              </div>

              <div className="builder-field" style={{ flex: 1 }}>
                <label>Type</label>
                <select
                  value={newProperty.type || 'string'}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="builder-field" style={{ flex: 1 }}>
                <label>Required</label>
                <input
                  type="checkbox"
                  checked={newProperty.required || false}
                  onChange={(e) => setNewProperty({ ...newProperty, required: e.target.checked })}
                />
              </div>
            </div>

            <div className="builder-field">
              <label>Default Value</label>
              <input
                type="text"
                value={newProperty.defaultValue || ''}
                onChange={(e) => setNewProperty({ ...newProperty, defaultValue: e.target.value })}
                placeholder="Leave empty for no default"
              />
            </div>

            <div className="builder-field">
              <label>Description</label>
              <input
                type="text"
                value={newProperty.description || ''}
                onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                placeholder="What is this property for?"
              />
            </div>

            <button className="btn-primary" onClick={addProperty}>
              + Add Property
            </button>
          </div>
        </div>

        <div className="builder-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary btn-lg" onClick={handleSave}>
            {editingComponent ? 'Update Component' : 'Create Component'}
          </button>
        </div>
      </div>
    </div>
  );
};
