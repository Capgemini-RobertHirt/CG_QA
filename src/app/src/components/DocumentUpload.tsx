import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

interface TemplateOption {
  id: string;
  name: string;
  type: string;
}

// Default templates for fallback
const DEFAULT_TEMPLATES: TemplateOption[] = [
  { id: 'template-default', name: 'Default', type: 'default' },
  { id: 'template-engineering', name: 'Engineering', type: 'engineering' },
  { id: 'template-asset', name: 'Asset', type: 'asset' },
  { id: 'template-whitepaper', name: 'Whitepaper', type: 'whitepaper' },
  { id: 'template-point_of_view', name: 'Point of View', type: 'point_of_view' },
  { id: 'template-rfp_rfi_response', name: 'RFP/RFI Response', type: 'rfp_rfi_response' },
  { id: 'template-internal_meeting_presentation', name: 'Internal Meeting Presentation', type: 'internal_meeting_presentation' },
];

function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState('default');
  const [templates, setTemplates] = useState<TemplateOption[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useTranslation();

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.getTemplates();
        const data = response?.data;

        let loadedTemplates: TemplateOption[] = [];

        // Handle mock API response: { data: { available_types: [...] } }
        if (data?.available_types && typeof data.available_types[Symbol.iterator] === 'function') {
          loadedTemplates = Array.from(data.available_types).map((type: any) => {
            const typeStr = typeof type === 'string' ? type : (type.type || type.entity_type || 'default');
            return {
              id: `template-${typeStr}`,
              name: typeStr.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              type: typeStr,
            };
          });
        }
        // Handle array of template objects
        else if (Array.isArray(data)) {
          loadedTemplates = data.map((template: any) => ({
            id: template.id || `template-${template.entity_type}`,
            name: template.name || template.entity_type?.replace(/_/g, ' '),
            type: template.type || template.entity_type,
          }));
        }

        if (loadedTemplates.length > 0) {
          setTemplates(loadedTemplates);
          setTemplateType(loadedTemplates[0].type);
        }
      } catch (error) {
        console.error('Failed to load templates, using defaults:', error);
        setTemplates(DEFAULT_TEMPLATES);
        setTemplateType('default');
      }
    };

    loadTemplates();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const response = await api.uploadProposal(selectedFile, templateType);
      
      // Cache the uploaded proposal to localStorage
      const uploadedProposal = {
        id: response.data.id || `proposal_${Date.now()}`,
        name: selectedFile.name,
        status: 'uploaded',
        quality: 0,
        documentType: templateType,
        uploadedAt: new Date().toISOString(),
      };
      
      const cachedProposals = localStorage.getItem('cached_proposals');
      const proposals = cachedProposals ? JSON.parse(cachedProposals) : [];
      proposals.unshift(uploadedProposal); // Add to beginning of list
      localStorage.setItem('cached_proposals', JSON.stringify(proposals));
      
      setMessage({ type: 'success', text: 'Document uploaded successfully' });
      setSelectedFile(null);
      onUploadSuccess?.();
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' });
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-upload">
      <div className={`drag-area ${isDragging ? 'dragging' : ''}`}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           onDrop={handleDrop}>
        <p>{t('proposals.uploadDocument')}</p>
        <input type="file" onChange={handleFileSelect} hidden id="file-input" />
        <label htmlFor="file-input" className="file-button">
          {t('common.save')}
        </label>
      </div>

      {selectedFile && (
        <div className="selected-file">
          <p>File: {selectedFile.name}</p>
          <select 
            value={templateType} 
            onChange={(e) => setTemplateType(e.target.value)}
          >
            {templates.map(template => (
              <option key={template.id} value={template.type}>
                {template.name}
              </option>
            ))}
          </select>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? t('common.loading') : 'Upload'}
          </button>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
