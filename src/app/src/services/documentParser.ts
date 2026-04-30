/**
 * Document Parser Service
 * Handles extraction of text from PDF, DOCX, and TXT files
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF worker - use public assets path for all environments
// This ensures the worker file is properly served by the web server
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs-dist/build/pdf.worker.min.js';

export interface ParsedDocumentContent {
  text: string;
  fileType: string;
  pageCount?: number;
}

/**
 * Parse PDF file and extract text
 */
async function parsePDF(file: File): Promise<ParsedDocumentContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    let pageCount = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      pageCount++;
    }

    return {
      text: fullText,
      fileType: 'pdf',
      pageCount,
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse DOCX file and extract text
 */
async function parseDOCX(file: File): Promise<ParsedDocumentContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      text: result.value,
      fileType: 'docx',
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse TXT file (simple text read)
 */
async function parseTXT(file: File): Promise<ParsedDocumentContent> {
  try {
    const text = await file.text();
    
    return {
      text,
      fileType: 'txt',
    };
  } catch (error) {
    throw new Error(`Failed to parse TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main parser function - determines file type and parses accordingly
 */
export async function parseDocument(file: File): Promise<ParsedDocumentContent> {
  const mimeType = file.type;

  if (mimeType === 'application/pdf') {
    return parsePDF(file);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseDOCX(file);
  } else if (mimeType === 'text/plain') {
    return parseTXT(file);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Detect document type from content
 */
export function detectDocumentType(content: string): string {
  const lowerContent = content.toLowerCase();

  const indicators: Record<string, { keywords: string[]; type: string }> = {
    technical: {
      keywords: [
        'architecture',
        'implementation',
        'technical',
        'system',
        'design',
        'specification',
        'api',
        'database',
        'server',
      ],
      type: 'technical',
    },
    business: {
      keywords: ['business', 'proposal', 'roi', 'budget', 'cost', 'value', 'benefit', 'strategy'],
      type: 'business',
    },
    whitepaper: {
      keywords: ['whitepaper', 'research', 'analysis', 'study', 'findings', 'conclusion', 'methodology'],
      type: 'whitepaper',
    },
    rfp: {
      keywords: ['rfp', 'rfi', 'request', 'response', 'proposal', 'bid', 'vendor'],
      type: 'rfp_rfi_response',
    },
    internal: {
      keywords: ['meeting', 'agenda', 'minutes', 'presentation', 'discussion', 'action item'],
      type: 'internal_meeting_presentation',
    },
  };

  let bestMatch = { type: 'default', score: 0 };

  for (const [_, { keywords, type }] of Object.entries(indicators)) {
    const score = keywords.filter((kw) => lowerContent.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { type, score };
    }
  }

  return bestMatch.type;
}
