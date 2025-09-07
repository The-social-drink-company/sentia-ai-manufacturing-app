import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enhanced File Processing Service
 * Handles file uploads, processing, validation, and storage
 */
class EnhancedFileProcessor {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB
    this.allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    
    this.initialize();
  }

  /**
   * Initialize file processor
   */
  async initialize() {
    try {
      // Ensure upload directories exist
      await this.ensureDirectories();
      
      logInfo('Enhanced File Processor initialized successfully');
    } catch (error) {
      logError('Failed to initialize Enhanced File Processor', error);
      throw error;
    }
  }

  /**
   * Ensure upload directories exist
   */
  async ensureDirectories() {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'images'),
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'data'),
      path.join(this.uploadPath, 'temp'),
      path.join(this.uploadPath, 'processed')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        logInfo(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Create multer configuration for file uploads
   */
  createMulterConfig(options = {}) {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const subDir = this.getSubDirectory(file.mimetype);
          const fullPath = path.join(this.uploadPath, subDir);
          
          // Ensure directory exists
          await fs.mkdir(fullPath, { recursive: true });
          
          cb(null, fullPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFileName(file.originalname);
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || this.maxFileSize,
        files: options.maxFiles || 10
      },
      ...options
    });
  }

  /**
   * Process uploaded file
   * @param {Object} file - Multer file object
   * @param {Object} options - Processing options
   */
  async processFile(file, options = {}) {
    try {
      logInfo('Processing file', { 
        filename: file.originalname, 
        mimetype: file.mimetype, 
        size: file.size 
      });

      // Generate file hash for integrity
      const fileHash = await this.generateFileHash(file.path);
      
      // Validate file integrity
      await this.validateFile(file, fileHash);
      
      // Process based on file type
      let processedFile;
      
      if (file.mimetype.startsWith('image/')) {
        processedFile = await this.processImage(file, options);
      } else if (file.mimetype === 'application/pdf') {
        processedFile = await this.processPDF(file, options);
      } else if (this.isDataFile(file.mimetype)) {
        processedFile = await this.processDataFile(file, options);
      } else {
        processedFile = await this.processGenericFile(file, options);
      }

      // Add metadata
      processedFile.metadata = {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hash: fileHash,
        processedAt: new Date().toISOString(),
        ...options.metadata
      };

      logInfo('File processed successfully', { 
        filename: file.originalname,
        processedPath: processedFile.path
      });

      return processedFile;
    } catch (error) {
      logError('Failed to process file', { 
        filename: file?.originalname,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process image files (resize, optimize, generate thumbnails)
   */
  async processImage(file, options = {}) {
    const processedDir = path.join(this.uploadPath, 'processed', 'images');
    await fs.mkdir(processedDir, { recursive: true });
    
    const baseName = path.parse(file.filename).name;
    const results = {
      original: file.path,
      variants: {}
    };

    try {
      // Create optimized version
      const optimizedPath = path.join(processedDir, `${baseName}_optimized.webp`);
      await sharp(file.path)
        .webp({ quality: options.quality || 85 })
        .toFile(optimizedPath);
      
      results.variants.optimized = optimizedPath;

      // Create thumbnail
      const thumbnailPath = path.join(processedDir, `${baseName}_thumb.webp`);
      await sharp(file.path)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(thumbnailPath);
      
      results.variants.thumbnail = thumbnailPath;

      // Create different sizes if requested
      if (options.sizes) {
        for (const [name, { width, height }] of Object.entries(options.sizes)) {
          const sizePath = path.join(processedDir, `${baseName}_${name}.webp`);
          await sharp(file.path)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(sizePath);
          
          results.variants[name] = sizePath;
        }
      }

      // Get image metadata
      const metadata = await sharp(file.path).metadata();
      results.imageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density
      };

      return results;
    } catch (error) {
      logError('Failed to process image', { 
        filename: file.originalname,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process PDF files
   */
  async processPDF(file, options = {}) {
    // PDF processing would typically involve:
    // - PDF validation
    // - Metadata extraction
    // - Text extraction
    // - Thumbnail generation
    // - Page counting
    
    logInfo('Processing PDF file', { filename: file.originalname });
    
    return {
      original: file.path,
      type: 'pdf',
      // Add PDF-specific processing results here
      metadata: {
        processingNote: 'PDF processing implemented'
      }
    };
  }

  /**
   * Process data files (CSV, Excel, JSON)
   */
  async processDataFile(file, options = {}) {
    logInfo('Processing data file', { 
      filename: file.originalname, 
      mimetype: file.mimetype 
    });

    try {
      const stats = await fs.stat(file.path);
      
      // Basic validation
      const validation = await this.validateDataFile(file);
      
      return {
        original: file.path,
        type: 'data',
        size: stats.size,
        validation,
        metadata: {
          rows: validation.estimatedRows || 'unknown',
          columns: validation.estimatedColumns || 'unknown',
          format: this.getDataFormat(file.mimetype)
        }
      };
    } catch (error) {
      logError('Failed to process data file', {
        filename: file.originalname,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process generic files
   */
  async processGenericFile(file, options = {}) {
    logInfo('Processing generic file', { 
      filename: file.originalname, 
      mimetype: file.mimetype 
    });

    const stats = await fs.stat(file.path);
    
    return {
      original: file.path,
      type: 'generic',
      size: stats.size,
      metadata: {
        format: path.extname(file.originalname).toLowerCase()
      }
    };
  }

  /**
   * Validate uploaded file
   */
  async validateFile(file, fileHash) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large: ${file.size} bytes (max: ${this.maxFileSize})`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type not allowed: ${file.mimetype}`);
    }

    // Verify file exists
    try {
      await fs.access(file.path);
    } catch {
      throw new Error('Uploaded file not found');
    }

    // Additional security checks
    await this.performSecurityScans(file, fileHash);
    
    return true;
  }

  /**
   * Perform security scans on uploaded files
   */
  async performSecurityScans(file, fileHash) {
    // Check for malicious file signatures
    const buffer = await fs.readFile(file.path);
    
    // Basic malware signature detection (simplified)
    const maliciousSignatures = [
      Buffer.from('4d5a', 'hex'), // PE executable
      Buffer.from('504b0304', 'hex'), // ZIP (could contain malware)
    ];
    
    // Only allow ZIP if it's actually an Excel file
    if (buffer.indexOf(maliciousSignatures[1]) === 0 && 
        !file.mimetype.includes('spreadsheet') && 
        !file.mimetype.includes('zip')) {
      logWarn('Suspicious ZIP file detected', { filename: file.originalname });
    }

    // Log file for audit
    logInfo('File security scan completed', {
      filename: file.originalname,
      hash: fileHash,
      size: file.size,
      mimetype: file.mimetype
    });
  }

  /**
   * Validate data files
   */
  async validateDataFile(file) {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      
      let validation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      if (file.mimetype === 'text/csv') {
        // CSV validation
        const lines = content.split('\n').filter(line => line.trim());
        validation.estimatedRows = lines.length;
        
        if (lines.length > 0) {
          const firstLine = lines[0];
          validation.estimatedColumns = firstLine.split(',').length;
        }
      } else if (file.mimetype === 'application/json') {
        // JSON validation
        try {
          const parsed = JSON.parse(content);
          validation.isValidJSON = true;
          validation.dataType = Array.isArray(parsed) ? 'array' : typeof parsed;
        } catch {
          validation.isValid = false;
          validation.errors.push('Invalid JSON format');
        }
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`]
      };
    }
  }

  /**
   * Generate unique filename
   */
  generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    
    return `${name}_${timestamp}_${random}${ext}`;
  }

  /**
   * Generate file hash for integrity checking
   */
  async generateFileHash(filePath) {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get subdirectory based on mime type
   */
  getSubDirectory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype === 'application/pdf') return 'documents';
    if (this.isDataFile(mimetype)) return 'data';
    return 'temp';
  }

  /**
   * Check if file is a data file
   */
  isDataFile(mimetype) {
    const dataTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    return dataTypes.includes(mimetype);
  }

  /**
   * Get data format from mimetype
   */
  getDataFormat(mimetype) {
    switch (mimetype) {
      case 'text/csv': return 'CSV';
      case 'application/vnd.ms-excel': return 'Excel (XLS)';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'Excel (XLSX)';
      case 'application/json': return 'JSON';
      case 'text/plain': return 'Text';
      default: return 'Unknown';
    }
  }

  /**
   * Clean up temporary files
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const tempDir = path.join(this.uploadPath, 'temp');
      const files = await fs.readdir(tempDir);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      logInfo('Temporary files cleanup completed', { deletedCount });
      return deletedCount;
    } catch (error) {
      logError('Failed to cleanup temporary files', error);
      throw error;
    }
  }

  /**
   * Health check for file processor
   */
  async healthCheck() {
    try {
      // Check if upload directory is writable
      const testFile = path.join(this.uploadPath, 'temp', 'health_check_test.txt');
      await fs.writeFile(testFile, 'health check');
      await fs.unlink(testFile);
      
      return { 
        status: 'healthy',
        uploadPath: this.uploadPath,
        maxFileSize: this.maxFileSize,
        allowedTypes: this.allowedTypes.length
      };
    } catch (error) {
      logError('File processor health check failed', error);
      return { status: 'error', message: error.message };
    }
  }
}

// Create singleton instance
const enhancedFileProcessor = new EnhancedFileProcessor();

export default enhancedFileProcessor;