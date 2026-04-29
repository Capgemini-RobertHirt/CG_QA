import React, { useState } from 'react';
import {
  Component,
  Subcomponent,
  ComponentProperty,
  COMPONENT_LIBRARY,
  SECTION_TEXT_COMPONENTS,
  getComponentById,
  getSubcomponentById,
} from '../services/componentLibrary';
import './ComponentTreeEditor.css';

interface ComponentInstance {
  id: string;
  componentId: string;
  name: string;
  category: 'text' | 'layout' | 'media' | 'special' | 'container';
  properties: Record<string, any>;
  subcomponents: SubcomponentInstance[];
}

interface SubcomponentInstance {
  id: string;
  subcomponentId: string;
  name: string;
  properties: Record<string, any>;
}

interface SectionStructure {
  name: string;
  components: ComponentInstance[];
}

interface ComponentTreeEditorProps {
  templateStructure?: Record<string, any>;
  onSave?: (structure: Record<string, SectionStructure[]>) => void;
}

export const ComponentTreeEditor: React.FC<ComponentTreeEditorProps> = ({
  templateStructure = {},
  onSave,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(Object.keys(templateStructure).slice(0, 1))
  );
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [expandedSubcomponents, setExpandedSubcomponents] = useState<Set<string>>(new Set());
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [showComponentSelector, setShowComponentSelector] = useState<string | null>(null);

  const sections = Object.keys(templateStructure);

  const toggleSection = (sectionName: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionName)) {
      newSet.delete(sectionName);
    } else {
      newSet.add(sectionName);
    }
    setExpandedSections(newSet);
  };

  const toggleComponent = (componentId: string) => {
    const newSet = new Set(expandedComponents);
    if (newSet.has(componentId)) {
      newSet.delete(componentId);
    } else {
      newSet.add(componentId);
    }
    setExpandedComponents(newSet);
  };

  const toggleSubcomponent = (subcomponentId: string) => {
    const newSet = new Set(expandedSubcomponents);
    if (newSet.has(subcomponentId)) {
      newSet.delete(subcomponentId);
    } else {
      newSet.add(subcomponentId);
    }
    setExpandedSubcomponents(newSet);
  };

  const renderPropertyInput = (
    property: ComponentProperty,
    value: any,
    onChange: (newValue: any) => void
  ) => {
    const key = `${selectedComponent}-${property.name}`;

    switch (property.type) {
      case 'boolean':
        return (
          <div className="property-input">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              id={key}
            />
            <label htmlFor={key}>{property.label}</label>
          </div>
        );

      case 'number':
        return (
          <div className="property-input">
            <label htmlFor={key}>{property.label}</label>
            <input
              type="number"
              id={key}
              value={value || property.default || 0}
              onChange={(e) => onChange(parseInt(e.target.value))}
              min={property.min}
              max={property.max}
              title={property.description}
            />
          </div>
        );

      case 'color':
        return (
          <div className="property-input">
            <label htmlFor={key}>{property.label}</label>
            <div className="color-input-group">
              <input
                type="color"
                id={key}
                value={value || property.default || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                title={property.description}
              />
              <input
                type="text"
                value={value || property.default || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                maxLength={7}
                placeholder="#000000"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="property-input">
            <label htmlFor={key}>{property.label}</label>
            <select
              id={key}
              value={value || property.default || ''}
              onChange={(e) => onChange(e.target.value)}
              title={property.description}
            >
              <option value="">-- Select {property.label} --</option>
              {property.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'size':
      case 'string':
      default:
        return (
          <div className="property-input">
            <label htmlFor={key}>{property.label}</label>
            <input
              type="text"
              id={key}
              value={value || property.default || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={property.default}
              title={property.description}
              maxLength={50}
            />
          </div>
        );
    }
  };

  const renderPropertyEditor = (
    properties: ComponentProperty[],
    values: Record<string, any>,
    onChange: (newValues: Record<string, any>) => void
  ) => {
    return (
      <div className="properties-panel">
        <h4>Properties</h4>
        {properties.map((prop) => (
          <div key={prop.name} className="property-field">
            {renderPropertyInput(prop, values[prop.name], (newValue) => {
              onChange({ ...values, [prop.name]: newValue });
            })}
            {prop.description && (
              <small className="property-description">{prop.description}</small>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSubcomponentInstance = (subcomp: SubcomponentInstance, parentId: string) => {
    const subcomponentDef = getSubcomponentById(subcomp.subcomponentId);
    const isExpanded = expandedSubcomponents.has(`${parentId}-${subcomp.id}`);
    const isSelected = selectedComponent === `${parentId}-subcomp-${subcomp.id}`;

    if (!subcomponentDef) return null;

    return (
      <div key={subcomp.id} className="tree-item subcomponent-item">
        <div className="item-header">
          {subcomponentDef.properties.length > 0 && (
            <button
              className="expand-btn"
              onClick={() => toggleSubcomponent(`${parentId}-${subcomp.id}`)}
            >
              {isExpanded ? '▼' : '▶'} {subcomponentDef.icon}
            </button>
          )}
          <span
            className={`item-name ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelectedComponent(`${parentId}-subcomp-${subcomp.id}`)}
          >
            {subcomp.name}
          </span>
          <button
            className="btn-small btn-remove"
            onClick={() => {
              // Remove subcomponent logic
              console.log('Remove subcomponent:', subcomp.id);
            }}
            title="Remove subcomponent"
          >
            ✕
          </button>
        </div>
        {isExpanded && subcomponentDef.properties.length > 0 && (
          <div className="item-content">
            {renderPropertyEditor(
              subcomponentDef.properties,
              subcomp.properties,
              (newProps) => {
                // Update subcomponent properties logic
                console.log('Update subcomponent properties:', newProps);
              }
            )}
          </div>
        )}
      </div>
    );
  };

  const renderComponentInstance = (
    component: ComponentInstance,
    sectionName: string
  ) => {
    const componentDef = getComponentById(component.componentId);
    const isExpanded = expandedComponents.has(component.id);
    const isSelected = selectedComponent === component.id;

    if (!componentDef) return null;

    return (
      <div key={component.id} className="tree-item component-item">
        <div className="item-header">
          <button
            className="expand-btn"
            onClick={() => toggleComponent(component.id)}
          >
            {isExpanded ? '▼' : '▶'} {componentDef.icon}
          </button>
          <span
            className={`item-name ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelectedComponent(component.id)}
          >
            {component.name}
          </span>
          <div className="item-actions">
            <button
              className="btn-small btn-edit"
              onClick={() => setSelectedComponent(component.id)}
              title="Edit component"
            >
              ✎
            </button>
            <button
              className="btn-small btn-remove"
              onClick={() => {
                // Remove component logic
                console.log('Remove component:', component.id);
              }}
              title="Remove component"
            >
              ✕
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="item-content">
            {/* Component Properties */}
            {componentDef.properties.length > 0 && (
              <div className="component-section">
                <h5>Component Settings</h5>
                {renderPropertyEditor(
                  componentDef.properties,
                  component.properties,
                  (newProps) => {
                    // Update component properties logic
                    console.log('Update component properties:', newProps);
                  }
                )}
              </div>
            )}

            {/* Subcomponents */}
            {component.subcomponents.length > 0 && (
              <div className="component-section subcomponents-section">
                <h5>Sub-elements ({component.subcomponents.length})</h5>
                <div className="subcomponents-list">
                  {component.subcomponents.map((subcomp) =>
                    renderSubcomponentInstance(subcomp, component.id)
                  )}
                </div>
              </div>
            )}

            {/* Add Subcomponent */}
            {componentDef.subcomponents.length > 0 && (
              <div className="component-section">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowComponentSelector(component.id)}
                >
                  + Add Sub-element
                </button>
                {showComponentSelector === component.id && (
                  <div className="selector-panel">
                    <h5>Select Sub-element Type</h5>
                    {componentDef.subcomponents.map((subcomp) => (
                      <button
                        key={subcomp.id}
                        className="selector-option"
                        onClick={() => {
                          // Add subcomponent logic
                          console.log('Add subcomponent:', subcomp.id);
                          setShowComponentSelector(null);
                        }}
                      >
                        {subcomp.icon} {subcomp.name}
                        <span className="selector-description">{subcomp.description}</span>
                      </button>
                    ))}
                    <button
                      className="btn btn-cancel btn-small"
                      onClick={() => setShowComponentSelector(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (sectionName: string) => {
    const section = templateStructure[sectionName];
    const isExpanded = expandedSections.has(sectionName);
    const components = section?.components || [];

    return (
      <div key={sectionName} className="tree-item section-item">
        <div className="section-header">
          <button
            className="expand-btn"
            onClick={() => toggleSection(sectionName)}
          >
            {isExpanded ? '▼' : '▶'} 📋
          </button>
          <h4 className="section-name">{sectionName}</h4>
          <span className="component-count">{components.length} components</span>
        </div>

        {isExpanded && (
          <div className="section-content">
            {components.length > 0 ? (
              <div className="components-tree">
                {components.map((comp) => renderComponentInstance(comp, sectionName))}
              </div>
            ) : (
              <p className="empty-message">No components assigned. Add one to get started.</p>
            )}

            <button
              className="btn btn-secondary btn-add-component"
              onClick={() => setShowComponentSelector(`section-${sectionName}`)}
            >
              + Add Component to Section
            </button>

            {showComponentSelector === `section-${sectionName}` && (
              <div className="component-selector-panel">
                <h5>Select Component Type</h5>
                <div className="component-grid">
                  {COMPONENT_LIBRARY.map((comp) => (
                    <button
                      key={comp.id}
                      className="component-card"
                      onClick={() => {
                        // Add component to section logic
                        console.log('Add component to section:', comp.id);
                        setShowComponentSelector(null);
                      }}
                      title={comp.description}
                    >
                      <div className="component-icon">{comp.icon}</div>
                      <div className="component-label">{comp.name}</div>
                      <div className="component-desc">{comp.description}</div>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-cancel"
                  onClick={() => setShowComponentSelector(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="component-tree-editor">
      <div className="tree-container">
        <div className="tree-header">
          <h3>📦 Template Component Structure</h3>
          <p className="tree-subtitle">Build your template using modular components</p>
        </div>

        <div className="sections-tree">
          {sections.length > 0 ? (
            sections.map((sectionName) => renderSection(sectionName))
          ) : (
            <p className="empty-message">
              No template structure found. Create or edit a template to get started.
            </p>
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedComponent && (
        <div className="properties-sidebar">
          <div className="sidebar-header">
            <h3>✎ Edit Component</h3>
            <button
              className="btn-close"
              onClick={() => setSelectedComponent(null)}
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="sidebar-content">
            <p>Select a component from the tree to edit its properties.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentTreeEditor;
