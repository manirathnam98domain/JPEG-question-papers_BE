// src/services/ocr.service.js
import { createWorker } from 'tesseract.js';

/**
 * Processes an array of image buffers sequentially, freeing memory as it goes.
 * @param {Array<Buffer>} imageBuffers - Array of image buffers to process
 * @returns {Promise<string>} Accumulated raw text
 */
export async function processImagesToText(imageBuffers) {
  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error('OCR Subsystem received an empty image array.');
  }

  let worker = null;
  let aggregatedText = '';

  try {
    // 1. Initialize the WebAssembly Worker Lifecycle
    // We configure it to run locally without caching issues
    worker = await createWorker('eng', 1, {
      errorHandler: (err) => console.error(`[Tesseract Core Error]:`, err)
    });

    // 2. Sequential Processing Loop (Memory Friendly)
    for (let i = 0; i < imageBuffers.length; i++) {
      if (!imageBuffers[i]) continue; // Skip if already cleared

      try {
        // Run OCR on the individual page buffer
        const { data: { text } } = await worker.recognize(imageBuffers[i]);
        aggregatedText += `${text}\n`;
      } catch (pageError) {
        throw new Error(`Failed parsing page index ${i}: ${pageError.message}`);
      } finally {
        // CRITICAL FOR MEMORY MANAGEMENT: 
        // Sever the reference to the heavy buffer immediately so the Garbage Collector can reclaim it.
        imageBuffers[i] = null;
      }
    }

    return aggregatedText;

  } catch (error) {
    throw new Error(`OCR Subsystem Fault: ${error.message}`);
  } finally {
    // 3. Guaranteed Lifecycle Termination
    // Prevents zombie WebAssembly processes from lingering in your background memory
    if (worker) {
      await worker.terminate();
      worker = null; // Explicitly free worker reference
    }
  }
}