// src/controllers/upload.controller.js
import { convertPdfToImageBuffers } from '../services/conversion.service.js';
import { processImagesToText } from '../services/ocr.service.js';
import { structureRawTextToJSON } from '../services/parser.service.js';

export async function handleDocumentExtraction(req, res) {
  // Defensive early exit
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'Invalid payload. Upload file buffer is missing.' });
  }

  const mimeType = req.file.mimetype;
  let targetImages = [];

  try {
    // 1. DYNAMIC ROUTING PATHWAY
    if (mimeType === 'application/pdf') {
      console.log(`[Pipeline] Processing PDF Document (${req.file.size} bytes)`);
      targetImages = await convertPdfToImageBuffers(req.file.buffer);
    } else if (mimeType === 'image/png' || mimeType === 'image/jpeg') {
      console.log(`[Pipeline] Processing Direct Image Layer: ${mimeType}`);
      // Push the original image buffer directly into the execution list
      targetImages.push(req.file.buffer);
    } else {
      return res.status(415).json({ error: 'Unsupported file format.' });
    }

    // Clean up req payload reference immediately to release buffer space
    req.file.buffer = null;

    console.log(`[Pipeline] Passing ${targetImages.length} page frames to OCR engine.`);

    // 2. RUN TEXT RECOGNITION PIPELINE
    const rawExtractedText = await processImagesToText(targetImages);

    // 3. LEXICAL STRUCTURING TO JSON
    const operationalJSON = structureRawTextToJSON(rawExtractedText);

    return res.status(200).json({
      success: true,
      data: operationalJSON
    });

  } catch (error) {
    console.error(`[Extraction Engine Critical Fault]: ${error.stack}`);

    if (error.message.includes('PDF Conversion Error')) {
      return res.status(422).json({ error: 'Failed to split PDF document layers.', details: error.message });
    }
    if (error.message.includes('OCR Subsystem Fault')) {
      return res.status(502).json({ error: 'OCR processing failed on one or more frames.', details: error.message });
    }

    return res.status(500).json({
      error: 'Processing Exception',
      message: error.message || 'An unexpected operational boundary error occurred.'
    });
  } finally {
    // Ultimate memory cleanup loop
    targetImages = null;
  }
}