/**
 * Simple Static Server for Enterprise Dashboard
 * Serves the pre-built dashboard from dist folder
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Try multiple paths to find the dist folder
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '../dist'),
  path.join(process.cwd(), 'dist'),
  '/opt/render/project/src/dist'
];

let staticPath = null;
for (const testPath of possiblePaths) {
  console.log(`Checking for dist at: ${testPath}`);
  try {
    const fs = await import('fs');
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`Found dist folder at: ${staticPath}`);
      break;
    }
  } catch (e) {
    console.log(`Path not accessible: ${testPath}`);
  }
}

if (!staticPath) {
  console.error('ERROR: Could not find dist folder in any expected location');
  console.log('Current directory:', process.cwd());
  console.log('Script directory:', __dirname);
  process.exit(1);
}

// Serve static files
app.use(express.static(staticPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    staticPath: staticPath
  });
});

// Catch all route - serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
    ========================================
    ENTERPRISE DASHBOARD SERVER
    ========================================
    Port: ${PORT}
    Static Path: ${staticPath}
    URL: http://localhost:${PORT}
    Health: http://localhost:${PORT}/health
    ========================================
  `);
});