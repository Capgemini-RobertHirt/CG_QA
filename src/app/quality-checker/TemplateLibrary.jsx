import { useState, useEffect } from 'react'
import './TemplateLibrary.css'

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates/available-types')
      const data = await response.json()

      // Fetch details for each template
      const templateDetails = await Promise.all(
        (data.available_types || []).map(async (entityType) => {
          try {
            const detailResponse = await fetch(`/api/templates/${entityType}`)
            if (detailResponse.ok) {
              return await detailResponse.json()
            }
          } catch (err) {
            console.error(`Error fetching template ${entityType}:`, err)
          }
          return null
        })
      )

      setTemplates(templateDetails.filter((t) => t !== null))
    } catch (err) {
      setError(`Failed to load templates: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading templates...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Quality Template Library</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {templates.map((template) => (
          <div
            key={template.entityType}
            onClick={() => setSelectedTemplate(template)}
            style={{
              border: '1px solid #ddd',
              padding: '1rem',
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: selectedTemplate?.entityType === template.entityType ? '#f0f0f0' : 'white',
            }}
          >
            <h3>{template.entityType}</h3>
            <p>
              <strong>Document Types:</strong> {Object.keys(template.documentTypes || {}).join(', ') || 'N/A'}
            </p>
            <p>
              <strong>Required Sections:</strong> {template.structure?.sections?.required?.length || 0}
            </p>
            <p>
              <strong>Scoring:</strong> Structure {(template.globalRules?.scoring?.weights?.structure * 100) | 0}%, Design{' '}
              {(template.globalRules?.scoring?.weights?.design * 100) | 0}%
            </p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div style={{ marginTop: '2rem', border: '1px solid #0066cc', padding: '1rem', borderRadius: '8px' }}>
          <h2>{selectedTemplate.entityType}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h4>Required Sections</h4>
              <ul>
                {(selectedTemplate.structure?.sections?.required || []).map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Optional Sections</h4>
              <ul>
                {(selectedTemplate.structure?.sections?.optional || []).map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4>Design Standards</h4>
            <p>
              <strong>Fonts:</strong> {selectedTemplate.design?.fonts?.body?.allowed?.join(', ') || 'N/A'}
            </p>
            <p>
              <strong>Color Palette:</strong> {selectedTemplate.design?.colors?.primary?.join(', ') || 'N/A'}
            </p>
            <p>
              <strong>Grid System:</strong> {selectedTemplate.design?.grid?.columns || 'N/A'} columns
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
