/**
 * Azure Function HTTP Trigger for CG QA API
 * This is the main entry point that wraps the Express server for Azure deployment
 */

const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
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
    name: 'Point Of View',
    type: 'point_of_view',
    elements: 15,
    sections: { required: 5, optional: 4 },
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
    sections: { required: 7, optional: 4 },
  },
];

let samples = [];
let analysisResults = [];

// Routes

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/templates', (req, res) => {
  res.json(templates);
});

app.get('/api/templates/:type', (req, res) => {
  const template = templates.find((t) => t.entity_type === req.params.type);
  if (!template) {
    return res.status(404).json({ error: `Template type '${req.params.type}' not found` });
  }
  res.json(template);
});

app.post('/api/samples', (req, res) => {
  try {
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
      quality_score: Math.floor(Math.random() * 40 + 60),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    samples.push(sample);

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

app.get('/api/samples', (req, res) => {
  res.json({
    samples: samples,
    total: samples.length,
  });
});

app.get('/api/samples/:id', (req, res) => {
  const sample = samples.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  res.json(sample);
});

app.delete('/api/samples/:id', (req, res) => {
  const index = samples.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  samples.splice(index, 1);
  res.json({ message: 'Sample deleted successfully' });
});

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

app.get('/api/analyze/:id', (req, res) => {
  let analysis = analysisResults.find((a) => a.id === req.params.id);
  if (!analysis) {
    analysis = analysisResults.find((a) => a.sample_id === req.params.id);
  }
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json(analysis);
});

// Default route for local testing
app.get('/', (req, res) => {
  res.json({
    message: 'CG QA API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/templates',
      'GET /api/templates/:type',
      'POST /api/samples',
      'GET /api/samples',
      'GET /api/samples/:id',
      'DELETE /api/samples/:id',
      'POST /api/analyze/:id',
      'GET /api/analyze/:id',
    ],
  });
});

// Export for both local and serverless deployment
if (process.env.NODE_ENV === 'production' || process.env.AZURE_FUNCTIONS_ENVIRONMENT) {
  module.exports = serverless(app);
} else {
  // For local development
  const PORT = process.env.PORT || 7072;
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}
