// src/middlewares/fileValidator.js
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // Strict limit: 15 Megabytes

export function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded.' });
  }

  // 1. Enforce size limitations
  if (req.file.size > MAX_FILE_SIZE) {
    return res.status(413).json({ 
      error: 'Payload Too Large', 
      message: `File size exceeds the allowable limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
    });
  }

  // 2. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(415).json({ 
      error: 'Unsupported Media Type', 
      message: `Invalid format (${req.file.mimetype}). Only PDF, PNG, and JPEG are accepted.` 
    });
  }

  next();
}