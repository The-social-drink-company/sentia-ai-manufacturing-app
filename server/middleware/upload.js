import fs from 'fs';
import path from 'path';

import multer from 'multer';

import { logInfo, logError } from '../../services/observability/structuredLogger.js';

// File upload configuration
const storage = multer.diskStorage({
  destination (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logInfo('Created uploads directory');
    }
    cb(null, uploadDir);
  },
  filename (req, file, cb) {
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.originalname}`;
    logInfo('File upload started', { filename, originalname: file.originalname });
    cb(null, filename);
  }
});

// File filter for allowed file types
const fileFilter = (_req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    logError('File upload rejected', { 
      filename: file.originalname, 
      extension: fileExt,
      allowedTypes 
    });
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Create multer upload instance
export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Error handling middleware for multer
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      logError('File size limit exceeded', { limit: '10MB' });
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      logError('Too many files uploaded', { limit: 5 });
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      logError('Unexpected file field', { fieldname: err.field });
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    
    logError('Multer error', err);
    return res.status(400).json({ error: 'File upload error.' });
  }
  
  if (err.message.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  
  next(err);
};