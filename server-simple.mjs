import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway provides PORT
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('dist'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// API test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', port: PORT });
});

// Catch all - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server - bind to 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});