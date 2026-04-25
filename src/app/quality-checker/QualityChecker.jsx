import { useState, useEffect } from 'react'
import './QualityChecker.css'

export default function QualityChecker() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch available templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates/available-types')
      const data = await response.json()
      setTemplates(data.available_types || [])
    } catch (err) {
      setError(`Failed to load templates: ${err.message}`)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setAnalysisResults(null)
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()

    if (!selectedTemplate || !documentType || !uploadedFile) {
      setError('Please select template, document type, and upload file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Read file content
      const fileContent = await uploadedFile.text()

      // Call analyze API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_content: fileContent,
          document_type: documentType,
          entity_type: selectedTemplate,
          file_name: uploadedFile.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const results = await response.json()
      setAnalysisResults(results)
    } catch (err) {
      setError(`Analysis error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Quality Checker</h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleAnalyze}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Select Entity Type:
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
            >
              <option value="">-- Choose template --</option>
              {templates.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Document Type:
            <input
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g., rfp_response, whitepaper"
              style={{ marginLeft: '0.5rem', padding: '0.5rem', width: '300px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Upload Document:
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.docx"
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
          {uploadedFile && <p>Selected: {uploadedFile.name}</p>}
        </div>

        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          {loading ? 'Analyzing...' : 'Analyze Document'}
        </button>
      </form>

      {analysisResults && (
        <div style={{ marginTop: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
          <h2>Analysis Results</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <strong>Structure</strong>
              <p style={{ fontSize: '2rem', margin: 0 }}>{analysisResults.scores?.structure || 'N/A'}</p>
            </div>
            <div>
              <strong>Design</strong>
              <p style={{ fontSize: '2rem', margin: 0 }}>{analysisResults.scores?.design || 'N/A'}</p>
            </div>
            <div>
              <strong>Compliance</strong>
              <p style={{ fontSize: '2rem', margin: 0 }}>{analysisResults.scores?.compliance || 'N/A'}</p>
            </div>
            <div>
              <strong>Overall</strong>
              <p style={{ fontSize: '2rem', margin: 0, color: '#0066cc' }}>{analysisResults.scores?.overall || 'N/A'}</p>
            </div>
          </div>

          {analysisResults.findings && analysisResults.findings.length > 0 && (
            <div>
              <h3>Findings</h3>
              <ul>
                {analysisResults.findings.map((finding, idx) => (
                  <li key={idx}>
                    <strong>{finding.dimension}</strong> [{finding.severity}]: {finding.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
