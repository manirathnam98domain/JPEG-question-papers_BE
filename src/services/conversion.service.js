// src/services/conversion.service.js
import { pdf } from 'pdf-to-img';

/**
 * Converts a PDF buffer into PNG image buffers using the pdf-to-img async pipeline
 * @param {Buffer} pdfBuffer - Uploaded file buffer
 * @returns {Promise<Array<Buffer>>} Array of all collected page image buffers
 */
export async function convertPdfToImageBuffers(pdfBuffer) {
  let doc = null;
  const imageBuffers = [];

  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('The provided PDF payload buffer is empty.');
    }

    // Convert memory buffer to data URL representation for pdf-to-img compatibility
    const base64DataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Use scale 2.5 or 3.0 if you are missing text due to low image contrast/quality
    doc = await pdf(base64DataUrl, { scale: 2.5 });

    // Explicitly iterate over every available page in the document stream
    for await (const pageImageBuffer of doc) {
      if (pageImageBuffer && pageImageBuffer.length > 0) {
        imageBuffers.push(pageImageBuffer);
      }
    }

    if (imageBuffers.length === 0) {
      throw new Error('The PDF processing engine rendered zero asset frames.');
    }

    return imageBuffers;
  } catch (error) {
    throw new Error(`PDF Conversion Error: ${error.message}`);
  } finally {
    if (doc && typeof doc.destroy === 'function') {
      await doc.destroy();
    }
  }
}