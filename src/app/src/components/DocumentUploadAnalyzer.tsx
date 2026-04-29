import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { parseDocument, detectDocumentType } from '../services/documentParser';
import './DocumentUpload.css';

export interface ExtractedData {
  documentName: string;
  documentType: string;
  sections: string[];
  components: string[];
  requiredItems: string[];
  suggestedConfig: Record<string, any>;
  confidence: number;
}

interface DocumentUploadAnalyzerProps {
  onExtract: (data: ExtractedData) => void;
  onCancel: () => void;
}

export const DocumentUploadAnalyzer: React.FC<DocumentUploadAnalyzerProps> = ({
  onExtract,
  onCancel,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [parseProgress, setParseProgress] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setPreview(selectedFile.name);
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setAnalyzing(true);
    setError('');
    setParseProgress('Starting document analysis...');

    try {
      // Parse document using the documentParser service
      setParseProgress('Reading file...');
      const parsedContent = await parseDocument(file);

      setParseProgress('Extracting structure...');
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const extractedData = parseDocumentContent(parsedContent.text, fileNameWithoutExt);

      setParseProgress('Finalizing analysis...');
      await new Promise((resolve) => setTimeout(resolve, 800));

      onExtract(extractedData);
    } catch (err) {
      console.error('Document analysis error:', err);
      setError(
        `Error analyzing document: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setAnalyzing(false);
      setParseProgress('');
    }
  };

  const parseDocumentContent = (content: string, fileName: string): ExtractedData => {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const documentName = fileName.replace(/\.[^/.]+$/, '');

    // Extract sections (lines that are headers or all caps)
    const sections = lines
      .filter(
        (line) =>
          line === line.toUpperCase() ||
          line.startsWith('#') ||
          line.match(/^[\d\.]+\s+[A-Z]/) ||
          line.match(/^[A-Z][^a-z]*$/)
      )
      .map((line) => line.replace(/^#+\s*/, '').replace(/^[\d\.]+\s*/, '').trim())
      .filter((line) => line.length > 3)
      .slice(0, 8);

    // Component keywords to detect
    const componentKeywords = [
      'card',
      'grid',
      'table',
      'timeline',
      'chart',
      'image',
      'list',
      'callout',
      'quote',
      'code',
      'column',
      'section',
      'header',
      'footer',
    ];
    const components = componentKeywords
      .filter((comp) => content.toLowerCase().includes(comp))
      .slice(0, 6);

    // Extract required items (lines containing keywords like must, required, shall)
    const requiredItems = lines
      .filter(
        (line) =>
          (line.toLowerCase().includes('must') ||
            line.toLowerCase().includes('required') ||
            line.toLowerCase().includes('shall') ||
            line.toLowerCase().includes('mandatory') ||
            line.toLowerCase().includes('essential')) &&
          line.length > 10
      )
      .slice(0, 5);

    // Detect document type using the service
    const documentType = detectDocumentType(content);

    // Calculate confidence based on extracted data quality
    let confidence = 50;
    if (sections.length > 0) confidence += 10;
    if (sections.length > 3) confidence += 10;
    if (components.length > 0) confidence += 10;
    if (requiredItems.length > 0) confidence += 10;
    if (lines.length > 100) confidence += 10;
    confidence = Math.min(95, confidence);

    return {
      documentName,
      documentType,
      sections: sections.length > 0 ? sections : ['Introduction', 'Content', 'Conclusion'],
      components: components.length > 0 ? components : ['card', 'paragraph'],
      requiredItems,
      suggestedConfig: {
        entity_type: documentType,
        structure: {
          sections: {
            required: sections.slice(0, Math.max(1, Math.ceil(sections.length / 2))),
            optional: sections.slice(Math.ceil(sections.length / 2)),
          },
          toc: {
            required: sections.length > 3,
            max_depth: Math.min(3, Math.ceil(sections.length / 3)),
          },
        },
        design: {
          colors: {
            primary: '#003366',
            secondary: '#0066CC',
            max_colors_per_page: 5,
          },
          fonts: {
            body: 'Segoe UI',
            heading: 'Segoe UI',
          },
        },
      },
      confidence,
    };
  };

  return (
    <div className="upload-analyzer-overlay">
      <div className="upload-analyzer-container">
        <h2>📄 {t('templates.uploadDocument') || 'Upload & Extract Configuration'}</h2>

        <div className="analyzer-section">
          <h3>{t('templates.uploadDocument') || 'Upload Document'}</h3>
          <p>
            {t('templates.uploadDocumentDescription') ||
              'Upload a sample document (PDF, DOCX, or TXT) to automatically extract:'}
          </p>
          <ul>
            <li>Document structure and sections</li>
            <li>Recommended component types</li>
            <li>Required configuration items</li>
            <li>Suggested template type</li>
          </ul>

          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={analyzing}
            />

            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
            >
              📁 {file ? 'Change File' : 'Choose File'}
            </button>

            {file && <div className="file-info">✓ {preview}</div>}
            {error && <div className="error-message">❌ {error}</div>}
            {parseProgress && <div className="parse-progress">⏳ {parseProgress}</div>}
          </div>

          <div className="supported-formats">
            <strong>Supported formats:</strong>
            <ul>
              <li>
                <strong>PDF (.pdf)</strong> - Text extraction from all pages (requires pdfjs-dist)
              </li>
              <li>
                <strong>Word (.docx)</strong> - Text extraction using Mammoth.js
              </li>
              <li>
                <strong>Text (.txt)</strong> - Direct text reading
              </li>
            </ul>
            <p className="note">
              ✅ PDF and DOCX parsing is now supported client-side using modern JavaScript libraries.
              Max file size: 10MB.
            </p>
          </div>
        </div>

        <div className="analyzer-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={analyzing}>
            Cancel
          </button>
          <button
            className="btn-primary btn-lg"
            onClick={analyzeDocument}
            disabled={!file || analyzing}
          >
            {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Document'}
          </button>
        </div>
      </div>
    </div>
  );
};
