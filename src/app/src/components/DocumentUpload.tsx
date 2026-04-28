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
=======
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { proposalsAPI } from '../services/api';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = ['pptx', 'xlsx', 'docx'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return t('errors.invalidFileType') || 'Invalid file type';
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('errors.fileTooLarge') || 'File too large';
    }
    return null;
  };

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
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('errors.fileRequired') || 'File is required');
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      await proposalsAPI.upload(formData);
      
      setSuccess('File uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || t('errors.uploadFailed') || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-box">
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📄</div>
          <h3>{t('proposals.uploadNew') || 'Upload New Document'}</h3>
          <p>Drag and drop your file here or click to select</p>
          <p className="file-types">Supported: .pptx, .xlsx, .docx (Max 50MB)</p>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pptx,.xlsx,.docx"
            className="file-input"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="select-button"
            disabled={uploading}
          >
            {t('common.upload') || 'Select File'}
          </button>
        </div>

        {selectedFile && (
          <div className="selected-file">
            <p><strong>Selected:</strong> {selectedFile.name}</p>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={uploading}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  );
}
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
