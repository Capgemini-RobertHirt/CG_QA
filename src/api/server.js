/**
 * Simple Express-based API server for local development
 * Wraps Azure Functions to work with Express
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 7072;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for development
let templates = [
  {
    id: 'template-default',
    entity_type: 'default',
    name: 'Default',
    type: 'default',
    elements: 11,
    sections: { required: 2, optional: 4 },
  },
  {
    id: 'template-engineering',
    entity_type: 'engineering',
    name: 'Engineering',
    type: 'engineering',
    elements: 14,
    sections: { required: 6, optional: 3 },
  },
  {
    id: 'template-asset',
    entity_type: 'asset',
    name: 'Asset',
    type: 'asset',
    elements: 14,
    sections: { required: 6, optional: 3 },
  },
  {
    id: 'template-whitepaper',
    entity_type: 'whitepaper',
    name: 'Whitepaper',
    type: 'whitepaper',
    elements: 18,
    sections: { required: 10, optional: 3 },
  },
  {
    id: 'template-point_of_view',
    entity_type: 'point_of_view',
    name: 'Point of View',
    type: 'point_of_view',
    elements: 15,
    sections: { required: 7, optional: 3 },
  },
  {
    id: 'template-rfp_rfi_response',
    entity_type: 'rfp_rfi_response',
    name: 'RFP/RFI Response',
    type: 'rfp_rfi_response',
    elements: 16,
    sections: { required: 8, optional: 3 },
  },
  {
    id: 'template-internal_meeting_presentation',
    entity_type: 'internal_meeting_presentation',
    name: 'Internal Meeting Presentation',
    type: 'internal_meeting_presentation',
    elements: 16,
    sections: { required: 8, optional: 3 },
  },
];

let samples = [];
let analysisResults = [];

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * GET /api/templates
 * Get all available templates
 */
app.get('/api/templates', (req, res) => {
  res.json({
    available_types: templates.map((t) => t.entity_type),
    templates: templates,
  });
});

/**
 * GET /api/templates/:type
 * Get template by type
 */
app.get('/api/templates/:type', (req, res) => {
  const template = templates.find((t) => t.entity_type === req.params.type);
  if (!template) {
    return res.status(404).json({ error: `Template type '${req.params.type}' not found` });
  }
  res.json(template);
});

/**
 * POST /api/samples
 * Upload a new sample/proposal
 */
app.post('/api/samples', (req, res) => {
  try {
    // Support both naming conventions (frontend uses camelCase, Azure Functions use snake_case)
    const fileContent = req.body.fileContent || req.body.document_content;
    const templateType = req.body.documentType || req.body.template_type || req.body.entity_type;
    const fileName = req.body.fileName || req.body.file_name;

    if (!fileContent || !templateType) {
      return res.status(400).json({
        error: 'Missing required fields: fileContent/document_content, documentType/template_type',
      });
    }

    const sampleId = `proposal-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const sample = {
      id: sampleId,
      file_name: fileName || 'document',
      document_type: req.body.documentType || req.body.document_type || 'document',
      template_type: templateType,
      content_length: fileContent?.length || 0,
      status: 'uploaded',
      quality_score: Math.floor(Math.random() * 40 + 60), // Random score 60-100
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    samples.push(sample);

    // Simulate analysis
    const analysisId = uuidv4();
    const analysis = {
      id: analysisId,
      sample_id: sampleId,
      entity_type: templateType,
      document_type: req.body.documentType || req.body.document_type || 'general_document',
      file_name: fileName || 'document',
      scores: {
        structure: Math.floor(Math.random() * 40 + 60),
        design: Math.floor(Math.random() * 40 + 60),
        content: Math.floor(Math.random() * 40 + 60),
        completeness: Math.floor(Math.random() * 40 + 60),
      },
      overall_score: Math.floor(Math.random() * 40 + 60),
      recommendations: [
        'Add more detail to introduction section',
        'Improve document structure clarity',
        'Enhance visual hierarchy',
      ],
      created_at: new Date().toISOString(),
    };

    analysisResults.push(analysis);
    sample.analysis_id = analysisId;

    res.status(201).json({
      id: sampleId,
      analysis_id: analysisId,
      status: 'uploaded',
      message: 'Document uploaded and analyzed successfully',
    });
  } catch (error) {
    console.error('Error uploading sample:', error);
    res.status(500).json({ error: 'Failed to upload sample', details: error.message });
  }
});

/**
 * GET /api/samples
 * Get all uploaded samples/proposals
 */
app.get('/api/samples', (req, res) => {
  // Transform samples to include 'name' field for frontend compatibility
  const transformedSamples = samples.map(sample => ({
    id: sample.id,
    name: sample.name || sample.file_name || 'Untitled',
    status: sample.status || 'uploaded',
    quality: sample.quality || sample.quality_score || 0,
    documentType: sample.documentType || sample.document_type,
    entityType: sample.entityType || sample.template_type,
    ...sample
  }));
  
  res.json({
    samples: transformedSamples,
    total: transformedSamples.length,
  });
});

/**
 * GET /api/samples/:id
 * Get specific sample details
 */
app.get('/api/samples/:id', (req, res) => {
  const sample = samples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  res.json(sample);
});

/**
 * DELETE /api/samples/:id
 * Delete a sample
 */
app.delete('/api/samples/:id', (req, res) => {
  const index = samples.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  samples.splice(index, 1);
  res.json({ message: 'Sample deleted successfully' });
});

/**
 * POST /api/analyze/:id
 * Analyze a specific sample
 */
app.post('/api/analyze/:id', (req, res) => {
  try {
    const sample = samples.find((s) => s.id === req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    const analysisId = uuidv4();
    const analysis = {
      id: analysisId,
      sample_id: req.params.id,
      entity_type: sample.template_type,
      document_type: sample.document_type,
      file_name: sample.file_name,
      scores: {
        structure: Math.floor(Math.random() * 40 + 60),
        design: Math.floor(Math.random() * 40 + 60),
        content: Math.floor(Math.random() * 40 + 60),
        completeness: Math.floor(Math.random() * 40 + 60),
      },
      overall_score: Math.floor(Math.random() * 40 + 60),
      recommendations: [
        'Review structure against template requirements',
        'Add missing sections',
        'Improve document formatting',
      ],
      created_at: new Date().toISOString(),
    };

    analysisResults.push(analysis);
    sample.analysis_id = analysisId;
    sample.quality_score = analysis.overall_score;
    sample.updated_at = new Date().toISOString();

    res.json({
      id: analysisId,
      ...analysis,
      message: 'Analysis completed successfully',
    });
  } catch (error) {
    console.error('Error analyzing sample:', error);
    res.status(500).json({ error: 'Failed to analyze sample', details: error.message });
  }
});

/**
 * GET /api/analyze/:id
 * Get analysis results by analysis ID or sample ID
 */
app.get('/api/analyze/:id', (req, res) => {
  // Try to find by analysis ID first, then by sample_id
  let analysis = analysisResults.find((a) => a.id === req.params.id);
  if (!analysis) {
    analysis = analysisResults.find((a) => a.sample_id === req.params.id);
  }
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json(analysis);
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     CG QA API Server                    ║
║     Development Mode                    ║
╚════════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}

📚 Available Endpoints:
  GET  /api/health                - Health check
  GET  /api/templates             - Get all templates
  GET  /api/templates/:type       - Get template by type
  POST /api/samples               - Upload new sample
  GET  /api/samples               - Get all samples
  GET  /api/samples/:id           - Get sample details
  DELETE /api/samples/:id         - Delete sample
  POST /api/analyze/:id           - Analyze sample
  GET  /api/analyze/:id           - Get analysis results

Frontend URL: http://localhost:5173

Press Ctrl+C to stop the server
`);
});
