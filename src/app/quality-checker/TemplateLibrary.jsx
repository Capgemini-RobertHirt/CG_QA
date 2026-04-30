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
      
      // Try to fetch from templates/list endpoint first
      try {
        const listResponse = await fetch('/api/templates/list')
        if (listResponse.ok) {
          const listData = await listResponse.json()
          console.log('Received from /api/templates/list:', listData)
          if (listData.templates && listData.templates.length > 0) {
            // Log each template's legoBlocks
            listData.templates.forEach((t) => {
              const legoBlocks = t.legoBlocks || {}
              const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
                return sum + (section.components ? section.components.length : 0)
              }, 0)
              console.log(`Template ${t.entityType}: legoBlocks=${Object.keys(legoBlocks).length} sections, ${componentCount} components`)
            })
            setTemplates(listData.templates)
            return
          }
        }
      } catch (err) {
        console.warn('Could not fetch from /api/templates/list, trying available-types:', err)
      }
      
      // Fallback: Fetch from available-types and get individual templates
      const response = await fetch('/api/templates/available-types')
      const data = await response.json()

      // Fetch details for each template
      const templateDetails = await Promise.all(
        (data.available_types || []).map(async (entityType) => {
          try {
            const detailResponse = await fetch(`/api/templates/${entityType}`)
            if (detailResponse.ok) {
              const template = await detailResponse.json()
              const legoBlocks = template.legoBlocks || {}
              const componentCount = Object.values(legoBlocks).reduce((sum, section) => {
                return sum + (section.components ? section.components.length : 0)
              }, 0)
              console.log(`Fetched ${entityType}: legoBlocks=${Object.keys(legoBlocks).length} sections, ${componentCount} components`)
              return template
            }
          } catch (err) {
            console.error(`Error fetching template ${entityType}:`, err)
          }
          return null
        })
      )

      const validTemplates = templateDetails.filter((t) => t !== null)
      console.log('Final templates loaded:', validTemplates.length)
      setTemplates(validTemplates)
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
        {templates.map((template) => {
          // Calculate total components - get legoBlocks from either root or structure
          const legoBlocks = template.legoBlocks || template.structure?.legoBlocks || {}
          const totalComponents = Object.values(legoBlocks).reduce((sum, section) => {
            return sum + (section.components ? section.components.length : 0)
          }, 0)
          
          if (totalComponents === 0) {
            console.log(`${template.entityType} has 0 components - legoBlocks:`, legoBlocks)
          }
          
          return (
            <div
              key={template.entityType || template.id}
              onClick={() => setSelectedTemplate(template)}
              style={{
                border: '1px solid #ddd',
                padding: '1rem',
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: selectedTemplate?.entityType === template.entityType ? '#f0f0f0' : 'white',
              }}
            >
              <h3>{template.entityType || template.name}</h3>
              <p>
                <strong>Document Types:</strong> {Object.keys(template.documentTypes || template.document_types || {}).join(', ') || 'N/A'}
              </p>
              <p>
                <strong>Required Sections:</strong> {template.structure?.sections?.required?.length || 0}
              </p>
              <p>
                <strong>Components:</strong> {totalComponents} across {Object.keys(legoBlocks).length} sections
              </p>
              <p>
                <strong>Scoring:</strong> Structure {(template.globalRules?.scoring?.weights?.structure * 100 || template.global_rules?.scoring?.weights?.structure * 100 || 0) | 0}%, Design{' '}
                {(template.globalRules?.scoring?.weights?.design * 100 || template.global_rules?.scoring?.weights?.design * 100 || 0) | 0}%
              </p>
            </div>
          )
        })}
      </div>

          {selectedTemplate && (
        <div style={{ marginTop: '2rem', border: '1px solid #0066cc', padding: '1rem', borderRadius: '8px' }}>
          <h2>{selectedTemplate.entityType || selectedTemplate.name}</h2>
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

          {(() => {
            // Get legoBlocks from either root level or structure
            const legoBlocks = selectedTemplate.legoBlocks || selectedTemplate.structure?.legoBlocks || {}
            const hasComponents = Object.keys(legoBlocks).length > 0
            
            return hasComponents && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4>Components by Section ({Object.keys(legoBlocks).length} sections)</h4>
                {Object.entries(legoBlocks).map(([sectionName, sectionData]) => (
                  <div key={sectionName} style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #0066cc' }}>
                    <h5 style={{ margin: '0.5rem 0' }}>{sectionName.replace(/_/g, ' ').toUpperCase()}</h5>
                    {sectionData.components && sectionData.components.length > 0 ? (
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        {sectionData.components.map((component) => (
                          <li key={component.id} style={{ marginBottom: '0.5rem' }}>
                            <strong>{component.name}</strong> ({component.componentId})
                            {component.subcomponents && component.subcomponents.length > 0 && (
                              <ul style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                {component.subcomponents.map((sub) => (
                                  <li key={sub.id} style={{ fontSize: '0.9em', color: '#666' }}>
                                    {sub.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#999', fontSize: '0.9em' }}>No components defined</p>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}

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
