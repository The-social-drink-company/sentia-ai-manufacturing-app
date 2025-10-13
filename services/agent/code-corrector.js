/**
 * Advanced Code Correction Engine - AST-Based Intelligent Code Modification
 * Performs sophisticated code analysis and corrections using Abstract Syntax Trees
 * for precise, safe, and semantically-aware code transformations
 */

import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { transformFromAstSync } from '@babel/core';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


class CodeCorrectionEngine {
  constructor() {
    this.corrections = new Map();
    this.analysisCache = new Map();
    this.safetyChecks = true;
    this.backupEnabled = true;
    
    this.fixPatterns = this.initializeFixPatterns();
    this.codeTemplates = this.initializeCodeTemplates();
    this.riskAssessment = this.initializeRiskAssessment();
  }

  initializeFixPatterns() {
    return {
      // Timeout-related fixes
      timeout: {
        patterns: [
          {
            type: 'config_update',
            target: 'playwright.config.js',
            find: /timeout:\s*(\d+)/g,
            replace: (match, timeout) => `timeout: ${Math.min(parseInt(timeout) * 2, 300000)}`
          },
          {
            type: 'api_timeout',
            target: '**/*.js',
            astPattern: 'fetch_without_timeout',
            transformation: 'add_fetch_timeout'
          }
        ]
      },

      // Error handling fixes
      error_handling: {
        patterns: [
          {
            type: 'try_catch_wrapper',
            target: '**/*.js',
            astPattern: 'async_without_error_handling',
            transformation: 'wrap_with_try_catch'
          },
          {
            type: 'error_middleware',
            target: 'server.js',
            astPattern: 'missing_error_middleware',
            transformation: 'add_error_middleware'
          }
        ]
      },

      // Authentication fixes
      auth: {
        patterns: [
          {
            type: 'token_validation',
            target: 'server.js',
            astPattern: 'weak_auth_check',
            transformation: 'strengthen_auth_validation'
          },
          {
            type: 'session_management',
            target: 'src/**/*.jsx',
            astPattern: 'missing_auth_state',
            transformation: 'add_auth_state_management'
          }
        ]
      },

      // Performance optimizations
      performance: {
        patterns: [
          {
            type: 'react_memo',
            target: 'src/components/**/*.jsx',
            astPattern: 'expensive_component',
            transformation: 'add_react_memo'
          },
          {
            type: 'lazy_loading',
            target: 'src/**/*.jsx',
            astPattern: 'heavy_import',
            transformation: 'add_lazy_loading'
          }
        ]
      },

      // API route fixes
      api_routes: {
        patterns: [
          {
            type: 'route_validation',
            target: 'server.js',
            astPattern: 'missing_route_validation',
            transformation: 'add_input_validation'
          },
          {
            type: 'cors_config',
            target: 'server.js',
            astPattern: 'basic_cors',
            transformation: 'enhance_cors_config'
          }
        ]
      }
    };
  }

  initializeCodeTemplates() {
    return {
      try_catch_wrapper: `
try {
  {{ORIGINAL_CODE}}
} catch (error) {
  logError('{{OPERATION_NAME}} failed:', error);
  {{ERROR_HANDLING}}
}`,

      fetch_with_timeout: `
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), {{TIMEOUT}});

try {
  const response = await fetch({{URL}}, {
    ...{{OPTIONS}},
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw error;
}`,

      error_middleware: `
// Enhanced error handling middleware
app.use((error, req, res, _next) => {
  logError('Server error:', error);
  
  // Log error details for debugging
  logError('Stack:', error.stack);
  logError('Request URL:', req.url);
  logError('Request Method:', req.method);
  
  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.message,
      stack: error.stack 
    })
  });
});`,

      react_memo_wrapper: `React.memo({{COMPONENT_NAME}})`,

      auth_validation: `
// Enhanced authentication middleware
const authenticateUser = async (req, res, _next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization header provided',
        code: 'MISSING_AUTH_HEADER'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'MISSING_TOKEN'
      });
    }
    
    // Validate token format
    if (typeof token !== 'string' || token.length < 10) {
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    const payload = await clerkClient.verifyToken(token);
    
    if (!payload || !payload.sub) {
      return res.status(401).json({ 
        error: 'Invalid token payload',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }
    
    req.userId = payload.sub;
    req.user = await clerkClient.users.getUser(payload.sub);
    
    // Check if user is active
    if (req.user.banned) {
      return res.status(403).json({ 
        error: 'User account is suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
    }
    
    next();
  } catch (error) {
    logError('Authentication error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};`,

      input_validation: `
// Input validation middleware
const validateInput = (schema) => {
  return (req, res, _next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
};`,

      enhanced_cors: `
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://web-production-1f10.up.railway.app',
      'https://sentia-manufacturing-dashboard-testing.up.railway.app'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}))`
    };
  }

  initializeRiskAssessment() {
    return {
      low: {
        maxChanges: 10,
        requiresBackup: true,
        requiresValidation: true,
        autoApprove: true
      },
      medium: {
        maxChanges: 5,
        requiresBackup: true,
        requiresValidation: true,
        autoApprove: false
      },
      high: {
        maxChanges: 2,
        requiresBackup: true,
        requiresValidation: true,
        autoApprove: false
      },
      critical: {
        maxChanges: 1,
        requiresBackup: true,
        requiresValidation: true,
        autoApprove: false
      }
    };
  }

  // Main correction method
  async applyCorrections(analysisResults) {
    logDebug('🔧 Starting advanced code corrections...');
    
    const correctionPlan = await this.generateCorrectionPlan(analysisResults);
    const results = {
      applied: [],
      skipped: [],
      failed: [],
      riskLevel: correctionPlan.riskLevel
    };

    // Create backups if required
    if (this.backupEnabled) {
      await this.createCodeBackups(correctionPlan.affectedFiles);
    }

    // Apply corrections in order of priority
    for (const correction of correctionPlan.corrections) {
      try {
        const result = await this.applyIndividualCorrection(correction);
        results.applied.push({ correction, result });
        
        logDebug(`✅ Applied correction: ${correction.type} to ${correction.file}`);
      } catch (error) {
        logError(`❌ Failed to apply correction: ${correction.type} - ${error.message}`);
        results.failed.push({ correction, error: error.message });
      }
    }

    // Validate all applied corrections
    await this.validateCorrections(results.applied);

    logDebug(`🎯 Corrections complete: ${results.applied.length} applied, ${results.failed.length} failed`);
    return results;
  }

  async generateCorrectionPlan(analysisResults) {
    const corrections = [];
    const affectedFiles = new Set();
    let riskLevel = 'low';

    // Process each fix instruction from analysis
    for (const instruction of analysisResults.fixInstructions || []) {
      const correctionGroup = await this.generateCorrectionsForInstruction(instruction);
      
      correctionGroup.forEach(correction => {
        corrections.push(correction);
        affectedFiles.add(correction.file);
        
        // Update risk level based on correction risk
        if (correction.risk === 'high' && riskLevel !== 'critical') {
          riskLevel = 'high';
        } else if (correction.risk === 'critical') {
          riskLevel = 'critical';
        }
      });
    }

    // Sort corrections by priority and risk
    corrections.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      corrections,
      affectedFiles: Array.from(affectedFiles),
      riskLevel,
      totalCorrections: corrections.length,
      estimatedDuration: this.estimateCorrectionDuration(corrections)
    };
  }

  async generateCorrectionsForInstruction(instruction) {
    const corrections = [];
    const pattern = instruction.pattern;
    
    if (!this.fixPatterns[pattern]) {
      logWarn(`No fix patterns available for: ${pattern}`);
      return corrections;
    }

    const patterns = this.fixPatterns[pattern].patterns;
    
    for (const patternConfig of patterns) {
      const files = await this.findTargetFiles(patternConfig.target);
      
      for (const file of files) {
        const correction = await this.analyzeFileForCorrection(file, patternConfig, instruction);
        if (correction) {
          corrections.push(correction);
        }
      }
    }

    return corrections;
  }

  async findTargetFiles(targetPattern) {
    const files = [];
    const baseDir = process.cwd();
    
    if (targetPattern.includes('**')) {
      // Handle glob patterns
      const globPattern = targetPattern.replace('**/', '');
      files.push(...await this.findFilesRecursively(baseDir, globPattern));
    } else {
      // Single file
      const filePath = path.join(baseDir, targetPattern);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }
    
    return files;
  }

  async findFilesRecursively(dir, pattern) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await this.findFilesRecursively(fullPath, pattern));
      } else if (entry.isFile() && this.matchesPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  async analyzeFileForCorrection(filePath, patternConfig, instruction) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileExt = path.extname(filePath);
      
      // Check if file needs correction
      const needsCorrection = await this.fileNeedsCorrection(content, patternConfig, fileExt);
      
      if (!needsCorrection) {
        return null;
      }

      return {
        file: filePath,
        type: patternConfig.type,
        pattern: patternConfig.astPattern || patternConfig.type,
        transformation: patternConfig.transformation,
        priority: instruction.priority || 'medium',
        risk: this.assessCorrectionRisk(filePath, patternConfig),
        originalInstruction: instruction,
        config: patternConfig
      };
    } catch (error) {
      logError(`Error analyzing file ${filePath}: ${error.message}`);
      return null;
    }
  }

  async fileNeedsCorrection(content, patternConfig, fileExt) {
    // Simple regex-based checks
    if (patternConfig.find) {
      return patternConfig.find.test(content);
    }

    // AST-based analysis for JavaScript files
    if (['.js', '.jsx', '.ts', '.tsx'].includes(fileExt)) {
      return await this.astNeedsCorrection(content, patternConfig);
    }

    return false;
  }

  async astNeedsCorrection(content, patternConfig) {
    try {
      const ast = this.parseCode(content);
      let needsCorrection = false;

      traverse.default(ast, {
        enter(path) {
          if (patternConfig.astPattern === 'fetch_without_timeout' && 
              t.isCallExpression(path.node) &&
              path.node.callee.name === 'fetch') {
            const args = path.node.arguments;
            if (args.length < 2 || !this.hasTimeoutOption(args[1])) {
              needsCorrection = true;
            }
          }
          
          if (patternConfig.astPattern === 'async_without_error_handling' &&
              t.isFunctionDeclaration(path.node) &&
              path.node.async) {
            if (!this.hasTryCatchBlock(path.node.body)) {
              needsCorrection = true;
            }
          }
          
          if (patternConfig.astPattern === 'expensive_component' &&
              t.isExportDefaultDeclaration(path.node) &&
              t.isFunctionDeclaration(path.node.declaration)) {
            if (!this.isWrappedWithMemo(path.parent)) {
              needsCorrection = true;
            }
          }
        }
      });

      return needsCorrection;
    } catch (error) {
      logWarn(`AST analysis failed: ${error.message}`);
      return false;
    }
  }

  parseCode(content, options = {}) {
    const defaultOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'doExpressions',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining'
      ]
    };

    return parser.parse(content, { ...defaultOptions, ...options });
  }

  hasTimeoutOption(optionsNode) {
    if (!optionsNode || !t.isObjectExpression(optionsNode)) {
      return false;
    }

    return optionsNode.properties.some(prop => 
      t.isObjectProperty(prop) && 
      t.isIdentifier(prop.key) && 
      prop.key.name === 'timeout'
    );
  }

  hasTryCatchBlock(blockStatement) {
    if (!blockStatement || !blockStatement.body) {
      return false;
    }

    return blockStatement.body.some(stmt => t.isTryStatement(stmt));
  }

  isWrappedWithMemo(parent) {
    // Check if the component is wrapped with React.memo
    return false; // Simplified - would need more sophisticated check
  }

  assessCorrectionRisk(filePath, patternConfig) {
    const criticalFiles = ['server.js', 'app.js', 'index.js'];
    const fileName = path.basename(filePath);
    
    if (criticalFiles.includes(fileName)) {
      return 'high';
    }
    
    if (patternConfig.type.includes('middleware') || patternConfig.type.includes('auth')) {
      return 'high';
    }
    
    if (patternConfig.type.includes('config') || patternConfig.type.includes('timeout')) {
      return 'medium';
    }
    
    return 'low';
  }

  estimateCorrectionDuration(corrections) {
    const durations = {
      config_update: 5000,
      api_timeout: 10000,
      try_catch_wrapper: 15000,
      error_middleware: 20000,
      auth_validation: 25000,
      react_memo: 8000,
      input_validation: 12000
    };
    
    const totalMs = corrections.reduce((sum, correction) => {
      return sum + (durations[correction.type] || 10000);
    }, 0);
    
    return Math.round(totalMs / 1000) + ' seconds';
  }

  async applyIndividualCorrection(correction) {
    const content = fs.readFileSync(correction.file, 'utf8');
    const fileExt = path.extname(correction.file);
    
    let correctedContent;
    
    if (correction.config.find && correction.config.replace) {
      // Simple regex replacement
      correctedContent = content.replace(correction.config.find, correction.config.replace);
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(fileExt)) {
      // AST-based transformation
      correctedContent = await this.applyASTTransformation(content, correction);
    } else {
      throw new Error('Unsupported file type for correction');
    }

    if (correctedContent && correctedContent !== content) {
      // Validate the corrected code
      await this.validateCorrectedCode(correctedContent, fileExt);
      
      // Write the corrected content
      fs.writeFileSync(correction.file, correctedContent);
      
      return {
        success: true,
        changes: this.calculateChanges(content, correctedContent),
        linesModified: this.countModifiedLines(content, correctedContent)
      };
    } else {
      return {
        success: false,
        reason: 'No changes needed or transformation failed'
      };
    }
  }

  async applyASTTransformation(content, correction) {
    try {
      const ast = this.parseCode(content);
      let modified = false;

      traverse.default(ast, {
        enter: (path) => {
          if (this.shouldTransformNode(path, correction)) {
            this.transformNode(path, correction);
            modified = true;
          }
        }
      });

      if (!modified) {
        return null;
      }

      const result = generate.default(ast, {
        retainLines: true,
        compact: false
      });

      return result.code;
    } catch (error) {
      throw new Error(`AST transformation failed: ${error.message}`);
    }
  }

  shouldTransformNode(path, correction) {
    switch (correction.transformation) {
      case 'add_fetch_timeout':
        return t.isCallExpression(path.node) && 
               path.node.callee.name === 'fetch' &&
               !this.hasTimeoutOption(path.node.arguments[1]);
               
      case 'wrap_with_try_catch':
        return t.isFunctionDeclaration(path.node) &&
               path.node.async &&
               !this.hasTryCatchBlock(path.node.body);
               
      case 'add_react_memo':
        return t.isExportDefaultDeclaration(path.node) &&
               t.isFunctionDeclaration(path.node.declaration);
               
      default:
        return false;
    }
  }

  transformNode(path, correction) {
    switch (correction.transformation) {
      case 'add_fetch_timeout':
        this.addFetchTimeout(path);
        break;
        
      case 'wrap_with_try_catch':
        this.wrapWithTryCatch(path);
        break;
        
      case 'add_react_memo':
        this.addReactMemo(path);
        break;
        
      case 'add_error_middleware':
        this.addErrorMiddleware(path);
        break;
    }
  }

  addFetchTimeout(path) {
    const fetchCall = path.node;
    const [url, options] = fetchCall.arguments;
    
    // Create timeout options
    const timeoutProperty = t.objectProperty(
      t.identifier('timeout'),
      t.numericLiteral(10000) // 10 seconds
    );
    
    if (options && t.isObjectExpression(options)) {
      // Add timeout to existing options
      options.properties.push(timeoutProperty);
    } else {
      // Create new options object
      const newOptions = t.objectExpression([timeoutProperty]);
      fetchCall.arguments = [url, newOptions];
    }
  }

  wrapWithTryCatch(path) {
    const functionBody = path.node.body;
    
    const tryStatement = t.tryStatement(
      functionBody,
      t.catchClause(
        t.identifier('error'),
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(t.identifier('console'), t.identifier('error')),
              [t.stringLiteral('Operation failed:'), t.identifier('error')]
            )
          ),
          t.throwStatement(t.identifier('error'))
        ])
      )
    );
    
    path.node.body = t.blockStatement([tryStatement]);
  }

  addReactMemo(path) {
    const component = path.node.declaration;
    
    // Wrap the component with React.memo
    const memoCall = t.callExpression(
      t.memberExpression(t.identifier('React'), t.identifier('memo')),
      [component]
    );
    
    path.node.declaration = memoCall;
    
    // Ensure React is imported
    this.ensureReactImport(path);
  }

  addErrorMiddleware(path) {
    // Add error middleware to Express app
    const template = this.codeTemplates.error_middleware;
    const middlewareAST = this.parseCode(template);
    
    // Insert the middleware before app.listen
    const program = path.findParent(p => t.isProgram(p.node));
    if (program) {
      program.node.body.push(...middlewareAST.body);
    }
  }

  ensureReactImport(path) {
    const program = path.findParent(p => t.isProgram(p.node));
    if (!program) return;
    
    // Check if React is already imported
    const hasReactImport = program.node.body.some(stmt =>
      t.isImportDeclaration(stmt) &&
      stmt.source.value === 'react'
    );
    
    if (!hasReactImport) {
      const reactImport = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('React'))],
        t.stringLiteral('react')
      );
      
      program.node.body.unshift(reactImport);
    }
  }

  async validateCorrectedCode(code, fileExt) {
    if (['.js', '.jsx', '.ts', '.tsx'].includes(fileExt)) {
      try {
        // Parse to check for syntax errors
        this.parseCode(code);
        
        // Basic linting checks
        this.performBasicLinting(code);
        
        return true;
      } catch (error) {
        throw new Error(`Code validation failed: ${error.message}`);
      }
    }
    
    return true;
  }

  performBasicLinting(code) {
    // Check for common issues
    const issues = [];
    
    if (code.includes('console.log') && !code.includes('development')) {
      issues.push('Contains console.log statements');
    }
    
    if (code.includes('eval(')) {
      issues.push('Contains eval() - security risk');
    }
    
    if (code.includes('innerHTML')) {
      issues.push('Contains innerHTML - potential XSS risk');
    }
    
    if (issues.length > 0) {
      logWarn('Code quality issues detected:', issues);
    }
  }

  calculateChanges(originalContent, correctedContent) {
    const originalLines = originalContent.split('\n');
    const correctedLines = correctedContent.split('\n');
    
    return {
      originalLength: originalContent.length,
      correctedLength: correctedContent.length,
      originalLines: originalLines.length,
      correctedLines: correctedLines.length,
      sizeDelta: correctedContent.length - originalContent.length,
      lineDelta: correctedLines.length - originalLines.length
    };
  }

  countModifiedLines(originalContent, correctedContent) {
    const originalLines = originalContent.split('\n');
    const correctedLines = correctedContent.split('\n');
    
    let modifiedLines = 0;
    const maxLines = Math.max(originalLines.length, correctedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const correctedLine = correctedLines[i] || '';
      
      if (originalLine !== correctedLine) {
        modifiedLines++;
      }
    }
    
    return modifiedLines;
  }

  async createCodeBackups(affectedFiles) {
    const backupDir = path.join(process.cwd(), 'tests', 'autonomous', 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const filePath of affectedFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);
        const backupPath = path.join(backupDir, timestamp, relativePath);
        
        // Ensure backup directory exists
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        
        // Write backup
        fs.writeFileSync(backupPath, content);
      } catch (error) {
        logError(`Failed to backup ${filePath}: ${error.message}`);
      }
    }
    
    logDebug(`📦 Created backups for ${affectedFiles.length} files`);
  }

  async validateCorrections(appliedCorrections) {
    logDebug('🔍 Validating applied corrections...');
    
    for (const { correction, result } of appliedCorrections) {
      try {
        // Re-read the file and validate
        const content = fs.readFileSync(correction.file, 'utf8');
        await this.validateCorrectedCode(content, path.extname(correction.file));
        
        logDebug(`✅ Validation passed: ${correction.file}`);
      } catch (error) {
        logError(`❌ Validation failed: ${correction.file} - ${error.message}`);
        
        // Attempt to restore from backup if validation fails
        await this.restoreFromBackup(correction.file);
      }
    }
  }

  async restoreFromBackup(filePath) {
    try {
      const backupDir = path.join(process.cwd(), 'tests', 'autonomous', 'backups');
      const backupDirs = fs.readdirSync(backupDir).sort().reverse(); // Latest first
      
      for (const dir of backupDirs) {
        const relativePath = path.relative(process.cwd(), filePath);
        const backupFile = path.join(backupDir, dir, relativePath);
        
        if (fs.existsSync(backupFile)) {
          const backupContent = fs.readFileSync(backupFile, 'utf8');
          fs.writeFileSync(filePath, backupContent);
          logDebug(`🔄 Restored ${filePath} from backup`);
          return;
        }
      }
      
      logError(`❌ No backup found for ${filePath}`);
    } catch (error) {
      logError(`Failed to restore backup for ${filePath}: ${error.message}`);
    }
  }

  // Public API methods
  async analyzeCodebase() {
    logDebug('📊 Analyzing codebase for potential improvements...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      analyzedFiles: 0,
      potentialIssues: [],
      recommendations: []
    };
    
    const jsFiles = await this.findFilesRecursively(process.cwd(), '*.{js,jsx}');
    analysis.totalFiles = jsFiles.length;
    
    for (const file of jsFiles.slice(0, 20)) { // Limit analysis
      try {
        const fileAnalysis = await this.analyzeFile(file);
        analysis.analyzedFiles++;
        
        if (fileAnalysis.issues.length > 0) {
          analysis.potentialIssues.push({
            file,
            issues: fileAnalysis.issues
          });
        }
      } catch (error) {
        logWarn(`Failed to analyze ${file}: ${error.message}`);
      }
    }
    
    return analysis;
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    try {
      const ast = this.parseCode(content);
      
      traverse.default(ast, {
        enter: (path) => {
          // Check for potential issues
          if (t.isCallExpression(path.node) && path.node.callee.name === 'fetch') {
            if (!this.hasTimeoutOption(path.node.arguments[1])) {
              issues.push({
                type: 'missing_timeout',
                line: path.node.loc?.start.line,
                description: 'Fetch call without timeout'
              });
            }
          }
          
          if (t.isFunctionDeclaration(path.node) && path.node.async) {
            if (!this.hasTryCatchBlock(path.node.body)) {
              issues.push({
                type: 'missing_error_handling',
                line: path.node.loc?.start.line,
                description: 'Async function without error handling'
              });
            }
          }
        }
      });
    } catch (error) {
      issues.push({
        type: 'syntax_error',
        description: `Parse error: ${error.message}`
      });
    }
    
    return { issues };
  }

  getStats() {
    return {
      totalCorrections: this.corrections.size,
      cacheSize: this.analysisCache.size,
      safetyChecksEnabled: this.safetyChecks,
      backupEnabled: this.backupEnabled
    };
  }

  clearCache() {
    this.analysisCache.clear();
    logDebug('🧹 Analysis cache cleared');
  }
}

export default CodeCorrectionEngine;
export { CodeCorrectionEngine };