import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
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

    try {
      const fileContent = await readFile(file);
      const extractedData = parseDocumentContent(fileContent, file.name);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onExtract(extractedData);
    } catch (err) {
      setError(`Error analyzing document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      } else {
        reject(new Error('PDF/DOCX parsing requires backend. Uploading as reference.'));
      }
    });
  };

  const parseDocumentContent = (content: string, fileName: string): ExtractedData => {
    const lines = content.split('\n').filter((line) => line.trim());
    const documentName = fileName.replace(/\.[^/.]+$/, '');

    const sections = lines
      .filter((line) => line === line.toUpperCase() || line.startsWith('#'))
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .slice(0, 8);

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
    const components = componentKeywords.filter((comp) =>
      content.toLowerCase().includes(comp)
    );

    const requiredItems = lines
      .filter(
        (line) =>
          line.toLowerCase().includes('must') ||
          line.toLowerCase().includes('required') ||
          line.toLowerCase().includes('shall')
      )
      .slice(0, 5);

    const lowerContent = content.toLowerCase();
    let documentType = 'default';
    if (lowerContent.includes('engineering')) documentType = 'engineering';
    else if (lowerContent.includes('whitepaper')) documentType = 'whitepaper';
    else if (lowerContent.includes('rfp') || lowerContent.includes('rfi')) documentType = 'rfp_rfi_response';
    else if (lowerContent.includes('proposal')) documentType = 'rfp_rfi_response';
    else if (lowerContent.includes('presentation')) documentType = 'internal_meeting_presentation';

    return {
      documentName,
      documentType,
      sections,
      components,
      requiredItems,
      suggestedConfig: {
        entity_type: documentType,
        structure: {
          sections: {
            required: sections.slice(0, 3),
            optional: sections.slice(3),
          },
          toc: {
            required: sections.length > 3,
            max_depth: Math.min(3, sections.length),
          },
        },
        design: {
          colors: {
            primary: '#3498db',
            max_colors_per_page: 5,
          },
          fonts: {
            body: 'Segoe UI',
            heading: 'Segoe UI',
          },
        },
      },
      confidence: 65,
    };
  };

  return (
    <div className="upload-analyzer-overlay">
      <div className="upload-analyzer-container">
        <h2>📄 Upload & Extract Configuration</h2>

        <div className="analyzer-section">
          <h3>Upload Document</h3>
          <p>Upload a sample document (PDF, DOCX, or TXT) to automatically extract:</p>
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
          </div>

          <div className="supported-formats">
            <strong>Supported formats:</strong>
            <ul>
              <li>PDF (.pdf) - Requires backend processing</li>
              <li>Word (.docx) - Requires backend processing</li>
              <li>Text (.txt) - Direct extraction</li>
            </ul>
            <p className="note">
              Note: PDF and DOCX parsing requires backend processing.
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
