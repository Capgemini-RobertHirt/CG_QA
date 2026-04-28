import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateType, setTemplateType] = useState('default');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useTranslation();

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
      setMessage({ type: 'success', text: 'Document uploaded successfully' });
      setSelectedFile(null);
      onUploadSuccess?.();
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed' });
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
          <select value={templateType} onChange={(e) => setTemplateType(e.target.value)}>
            <option value="default">Default</option>
            <option value="engineering">Engineering</option>
            <option value="asset">Asset</option>
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
