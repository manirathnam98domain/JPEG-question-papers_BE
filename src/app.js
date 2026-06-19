// src/app.js
import express from 'express';
import multer from 'multer';
import { handleDocumentExtraction } from './controllers/upload.controller.js';
import { validateUploadedFile } from './middlewares/fileValidator.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Configure Multer for In-Memory Storage
// We store files in memory as a Buffer instead of writing to disk for better performance and security.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 3. Document Extraction Route Pipeline
// Step 1: Intercept file ('file' is the field name matching your form-data)
// Step 2: Validate size and MIME type via fileValidator middleware
// Step 3: Run OCR and parser via handleDocumentExtraction controller
app.post('/api/extract', upload.single('file'), validateUploadedFile, handleDocumentExtraction);

// 4. Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Document Extraction Engine running securely on http://localhost:${PORT}`);
});

export default app;