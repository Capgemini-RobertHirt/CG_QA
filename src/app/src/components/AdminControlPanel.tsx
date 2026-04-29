import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ComponentBuilder } from './ComponentBuilder';
import { DocumentUploadAnalyzer, type ExtractedData } from './DocumentUploadAnalyzer';
import { GlobalStandardsLibrary, type StandardItem } from './GlobalStandardsLibrary';
import { mockApiExtended } from '../services/mockApi';
import { loadCustomComponents } from '../services/componentLibrary';
import '../components/AdminControlPanel.css';

interface TabState {
  activeTab: 'components' | 'standards' | 'documents';
}

export const AdminControlPanel: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { t } = useTranslation();
  const [tabState, setTabState] = useState<TabState>({ activeTab: 'components' });
  const [showComponentBuilder, setShowComponentBuilder] = useState(false);
  const [showDocumentAnalyzer, setShowDocumentAnalyzer] = useState(false);
  const [showStandardsLibrary, setShowStandardsLibrary] = useState(false);
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [extractedTemplateConfig, setExtractedTemplateConfig] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load custom components
      const components = await mockApiExtended.getCustomComponents();
      setCustomComponents(components);
      loadCustomComponents(components);

      // Load global standards
      const stds = await mockApiExtended.getGlobalStandards();
      if (stds.length === 0) {
        // Initialize with sample data if empty
        await mockApiExtended.initializeSampleData();
        const initialStds = await mockApiExtended.getGlobalStandards();
        setStandards(initialStds);
      } else {
        setStandards(stds);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleComponentSave = async (component: Omit<any, 'id'>) => {
    try {
      const newComponent = await mockApiExtended.createCustomComponent(component);
      setCustomComponents([...customComponents, newComponent]);
      loadCustomComponents([...customComponents, newComponent]);
      setShowComponentBuilder(false);
      console.log('✓ Component created successfully');
    } catch (error) {
      console.error('Error saving component:', error);
    }
  };

  const handleComponentDelete = async (id: string) => {
    try {
      await mockApiExtended.deleteCustomComponent(id);
      const updated = customComponents.filter(c => c.id !== id);
      setCustomComponents(updated);
      loadCustomComponents(updated);
      console.log('✓ Component deleted successfully');
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  const handleDocumentExtract = async (extractedData: ExtractedData) => {
    try {
      setExtractedTemplateConfig(extractedData);
      setShowDocumentAnalyzer(false);
      console.log('✓ Document analyzed successfully');
      console.log('Extracted configuration:', extractedData);
    } catch (error) {
      console.error('Error analyzing document:', error);
    }
  };

  const handleStandardsSave = async (updatedStandards: StandardItem[]) => {
    try {
      // Save all standards (would normally be a batch operation)
      setStandards(updatedStandards);
      console.log('✓ Standards saved successfully');
      setShowStandardsLibrary(false);
    } catch (error) {
      console.error('Error saving standards:', error);
    }
  };

  return (
    <div className="admin-control-panel-overlay">
      <div className="admin-control-panel-container">
        {/* Panel Header */}
        <div className="panel-header">
          <h1>⚙️ Admin Control Panel</h1>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="panel-tabs">
          <button
            className={`tab-btn ${tabState.activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setTabState({ activeTab: 'components' })}
          >
            🎨 Components
          </button>
          <button
            className={`tab-btn ${tabState.activeTab === 'standards' ? 'active' : ''}`}
            onClick={() => setTabState({ activeTab: 'standards' })}
          >
            📚 Standards
          </button>
          <button
            className={`tab-btn ${tabState.activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setTabState({ activeTab: 'documents' })}
          >
            📄 Documents
          </button>
        </div>

        {/* Tab Content */}
        <div className="panel-content">
          {/* Components Tab */}
          {tabState.activeTab === 'components' && (
            <div className="tab-pane">
              <h2>Custom Components</h2>
              <p>Create and manage custom components for your templates</p>

              <button className="btn-primary btn-lg" onClick={() => setShowComponentBuilder(true)}>
                + Create New Component
              </button>

              {customComponents.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No custom components yet</p>
                  <p>Create your first component to get started!</p>
                </div>
              ) : (
                <div className="components-grid">
                  {customComponents.map((comp) => (
                    <div key={comp.id} className="component-item">
                      <div className="component-header">
                        <span className="component-icon">{comp.icon || '🎨'}</span>
                        <div className="component-info">
                          <h3>{comp.name}</h3>
                          <p>{comp.description}</p>
                        </div>
                      </div>
                      <div className="component-meta">
                        <span className="category-badge">{comp.category}</span>
                        <span className="property-count">
                          {(comp.properties || []).length} properties
                        </span>
                      </div>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleComponentDelete(comp.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Standards Tab */}
          {tabState.activeTab === 'standards' && (
            <div className="tab-pane">
              <h2>Global Standards Library</h2>
              <p>Manage quality guidelines, compliance policies, and design standards</p>

              <button className="btn-primary btn-lg" onClick={() => setShowStandardsLibrary(true)}>
                📚 Manage Standards Library
              </button>

              {standards.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No standards configured yet</p>
                </div>
              ) : (
                <div className="standards-preview">
                  <h3>Current Standards ({standards.length})</h3>
                  <ul>
                    {standards.map((std) => (
                      <li key={std.id}>
                        <strong>{std.title}</strong>
                        <span className="category-badge">{std.category}</span>
                        <p>{std.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {tabState.activeTab === 'documents' && (
            <div className="tab-pane">
              <h2>Document Upload & Extraction</h2>
              <p>Upload sample documents to automatically extract configuration and structure</p>

              <button className="btn-primary btn-lg" onClick={() => setShowDocumentAnalyzer(true)}>
                📄 Upload Document
              </button>

              {extractedTemplateConfig && (
                <div className="extracted-config">
                  <h3>Extracted Configuration</h3>
                  <div className="config-summary">
                    <div className="config-item">
                      <strong>Document Name:</strong> {extractedTemplateConfig.documentName}
                    </div>
                    <div className="config-item">
                      <strong>Document Type:</strong> {extractedTemplateConfig.documentType}
                    </div>
                    <div className="config-item">
                      <strong>Sections Found:</strong> {extractedTemplateConfig.sections.length}
                    </div>
                    <div className="config-item">
                      <strong>Components Detected:</strong> {extractedTemplateConfig.components.length}
                    </div>
                    <div className="config-item">
                      <strong>Confidence:</strong> {extractedTemplateConfig.confidence}%
                    </div>
                  </div>

                  <div className="config-details">
                    <details>
                      <summary>📋 Sections</summary>
                      <ul>
                        {extractedTemplateConfig.sections.map((sec: string, idx: number) => (
                          <li key={idx}>{sec}</li>
                        ))}
                      </ul>
                    </details>

                    <details>
                      <summary>🎨 Components</summary>
                      <ul>
                        {extractedTemplateConfig.components.map((comp: string, idx: number) => (
                          <li key={idx}>{comp}</li>
                        ))}
                      </ul>
                    </details>

                    <details>
                      <summary>✓ Requirements</summary>
                      <ul>
                        {extractedTemplateConfig.requiredItems.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      console.log('Applying config to template...');
                      console.log(extractedTemplateConfig.suggestedConfig);
                    }}
                  >
                    Apply to New Template
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showComponentBuilder && (
          <ComponentBuilder
            onSave={handleComponentSave}
            onCancel={() => setShowComponentBuilder(false)}
          />
        )}

        {showDocumentAnalyzer && (
          <DocumentUploadAnalyzer
            onExtract={handleDocumentExtract}
            onCancel={() => setShowDocumentAnalyzer(false)}
          />
        )}

        {showStandardsLibrary && (
          <GlobalStandardsLibrary
            standards={standards}
            onSave={handleStandardsSave}
            onCancel={() => setShowStandardsLibrary(false)}
          />
        )}
      </div>
    </div>
  );
};
