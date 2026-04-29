import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './GlobalStandardsLibrary.css';

export interface StandardItem {
  id: string;
  title: string;
  category: 'guideline' | 'standard' | 'policy' | 'best-practice' | 'compliance';
  description: string;
  content?: string;
  links?: { title: string; url: string }[];
  applicableTemplates?: string[];
  createdAt: string;
  updatedAt: string;
}

interface GlobalStandardsLibraryProps {
  standards: StandardItem[];
  onSave: (standards: StandardItem[]) => void;
  onCancel: () => void;
}

const CATEGORIES: StandardItem['category'][] = ['guideline', 'standard', 'policy', 'best-practice', 'compliance'];

export const GlobalStandardsLibrary: React.FC<GlobalStandardsLibraryProps> = ({
  standards: initialStandards,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [standards, setStandards] = useState<StandardItem[]>(initialStandards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<StandardItem['category'] | 'all'>('all');
  const [formData, setFormData] = useState<Omit<StandardItem, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    category: 'guideline',
    description: '',
    content: '',
    links: [],
    applicableTemplates: [],
  });

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'guideline',
      description: '',
      content: '',
      links: [],
      applicableTemplates: [],
    });
    setShowForm(true);
  };

  const handleEdit = (standard: StandardItem) => {
    setEditingId(standard.id);
    setFormData({
      title: standard.title,
      category: standard.category,
      description: standard.description,
      content: standard.content,
      links: standard.links || [],
      applicableTemplates: standard.applicableTemplates || [],
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this standard?')) {
      setStandards(standards.filter((s) => s.id !== id));
    }
  };

  const handleSaveForm = () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    if (editingId) {
      setStandards(
        standards.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...formData,
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    } else {
      const newStandard: StandardItem = {
        id: `std-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setStandards([...standards, newStandard]);
    }

    setShowForm(false);
  };

  const handleAddLink = () => {
    setFormData({
      ...formData,
      links: [...(formData.links || []), { title: '', url: '' }],
    });
  };

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links?.filter((_, i) => i !== index),
    });
  };

  const handleSaveAll = () => {
    onSave(standards);
  };

  const filteredStandards =
    filterCategory === 'all' ? standards : standards.filter((s) => s.category === filterCategory);

  return (
    <div className="standards-library-overlay">
      <div className="standards-library-container">
        <div className="standards-header">
          <h2>📚 Global Standards Library</h2>
          <p>Manage quality standards, design guidelines, compliance policies, and best practices</p>
        </div>

        {!showForm && (
          <>
            <div className="standards-toolbar">
              <div className="filter-group">
                <label>Filter by Category:</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)}>
                  <option value="all">All Categories ({standards.length})</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ')} ({standards.filter((s) => s.category === cat).length})
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn-primary" onClick={handleAddNew}>
                + Add New Standard
              </button>
            </div>

            <div className="standards-list">
              {filteredStandards.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No standards in this category</p>
                  <button className="btn-primary" onClick={handleAddNew}>
                    Create First Standard
                  </button>
                </div>
              ) : (
                filteredStandards.map((standard) => (
                  <div key={standard.id} className="standard-card">
                    <div className="standard-header-card">
                      <div className="standard-title-group">
                        <h3>{standard.title}</h3>
                        <span className={`category-badge cat-${standard.category}`}>
                          {standard.category.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="standard-actions">
                        <button className="btn-edit" onClick={() => handleEdit(standard)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(standard.id)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    <p className="standard-description">{standard.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="standards-actions">
              <button className="btn-secondary" onClick={onCancel}>
                Close
              </button>
              <button className="btn-primary btn-lg" onClick={handleSaveAll}>
                💾 Save All Standards
              </button>
            </div>
          </>
        )}

        {showForm && (
          <div className="standards-form">
            <h3>{editingId ? 'Edit Standard' : 'Create New Standard'}</h3>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Brand Color Compliance"
                maxLength={100}
              />
              <span className="char-count">{formData.title.length}/100</span>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this standard..."
                maxLength={300}
                rows={3}
              />
              <span className="char-count">{formData.description.length}/300</span>
            </div>

            <div className="form-group">
              <label>Detailed Content</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full content, guidelines, or specifications..."
                maxLength={2000}
                rows={6}
              />
              <span className="char-count">{(formData.content || '').length}/2000</span>
            </div>

            <div className="form-section">
              <h4>📎 Reference Links</h4>
              {formData.links && formData.links.length > 0 && (
                <div className="links-list">
                  {formData.links.map((link, idx) => (
                    <div key={idx} className="link-item">
                      <input
                        type="text"
                        placeholder="Link title"
                        value={link.title}
                        onChange={(e) => {
                          const updatedLinks = [...(formData.links || [])];
                          updatedLinks[idx].title = e.target.value;
                          setFormData({ ...formData, links: updatedLinks });
                        }}
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => {
                          const updatedLinks = [...(formData.links || [])];
                          updatedLinks[idx].url = e.target.value;
                          setFormData({ ...formData, links: updatedLinks });
                        }}
                      />
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleRemoveLink(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-secondary" onClick={handleAddLink}>
                + Add Link
              </button>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn-primary btn-lg" onClick={handleSaveForm}>
                {editingId ? 'Update Standard' : 'Create Standard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
